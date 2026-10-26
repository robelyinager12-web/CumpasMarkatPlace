import { Prisma } from '@prisma/client'
import { prisma } from '../config/database.js'
import { env } from '../config/env.js'
import { logger } from '../config/logger.js'
import { authTokenRepository } from '../repositories/auth-token.repository.js'
import { universityRepository } from '../repositories/university.repository.js'
import { userRepository, type UserWithRelations } from '../repositories/user.repository.js'
import type { LoginInput, RegisterInput, UpdateProfileInput } from '../validators/auth.validator.js'
import { ApiError } from '../utils/api-error.js'
import { DUMMY_HASH, hashPassword, verifyPassword } from '../utils/password.js'
import { generateToken, hashToken } from '../utils/tokens.js'
import { sendPasswordResetEmail, sendVerificationEmail } from './email.service.js'
import { loginThrottle } from './login-throttle.service.js'
import { sessionService } from './session.service.js'
import { twoFactorService } from './two-factor.service.js'

const HOUR = 60 * 60 * 1000
const EMAIL_TOKEN_TTL_MS = 24 * HOUR
const RESET_TOKEN_TTL_MS = HOUR

type ClientMeta = { ip?: string; userAgent?: string }

export const toUserDto = (user: UserWithRelations) => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  emailVerified: user.emailVerified,
  phoneVerified: user.phoneVerified,
  department: user.department,
  university: user.university,
  campus: user.campus,
  studentVerification: user.verification?.status ?? 'UNVERIFIED',
  twoFactorEnabled: user.totpEnabled,
  // true when this administrator must turn on two-factor before the admin area opens
  twoFactorRequired: user.role === 'ADMIN' && env.requireAdminTwoFactor && !user.totpEnabled,
})

async function issueEmailVerification(user: { id: string; email: string; fullName: string }) {
  await authTokenRepository.deleteForUser(user.id, 'EMAIL_VERIFICATION')
  const token = generateToken()
  await authTokenRepository.create({
    userId: user.id,
    type: 'EMAIL_VERIFICATION',
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + EMAIL_TOKEN_TTL_MS),
  })
  await sendVerificationEmail(user.email, user.fullName, token)
}

async function assertCampusBelongsTo(campusId: string, universityId: string) {
  const campus = await universityRepository.findCampus(campusId)
  if (!campus || campus.universityId !== universityId) {
    throw ApiError.badRequest('The selected campus does not belong to this university')
  }
}

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'

export const authService = {
  async register(input: RegisterInput, meta: ClientMeta) {
    const university = await universityRepository.findActiveById(input.universityId)
    if (!university) throw ApiError.badRequest('The selected university is not available')
    if (input.campusId) await assertCampusBelongsTo(input.campusId, university.id)

    if (await userRepository.findByEmail(input.email)) {
      throw ApiError.conflict('An account with this email already exists')
    }
    if (input.phone && (await userRepository.findByPhone(input.phone))) {
      throw ApiError.conflict('An account with this phone number already exists')
    }

    const passwordHash = await hashPassword(input.password)

    let user: UserWithRelations
    try {
      user = await userRepository.create({
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        passwordHash,
        department: input.department || undefined,
        universityId: university.id,
        campusId: input.campusId,
        verification: { create: {} },
      })
    } catch (error) {
      if (isUniqueViolation(error)) throw ApiError.conflict('An account with these details already exists')
      throw error
    }

    try {
      await issueEmailVerification(user)
    } catch (err) {
      logger.error({ err }, 'Could not issue the verification email')
    }

    const sessionToken = await sessionService.create(user.id, meta)
    return { user: toUserDto(user), sessionToken }
  },

  // Returns { twoFactorRequired } (and no session) when the password was right but a code is still needed.
  async login(input: LoginInput, meta: ClientMeta) {
    const identity = `login:${input.email}`
    await loginThrottle.assertNotLocked(identity)

    const found = await userRepository.findByEmail(input.email)
    const valid = await verifyPassword(input.password, found?.passwordHash ?? DUMMY_HASH)
    if (!found || !valid) {
      await loginThrottle.recordFailure(identity)
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password')
    }
    if (found.status !== 'ACTIVE') {
      throw new ApiError(403, 'ACCOUNT_SUSPENDED', 'Your account is suspended. Please contact support.')
    }

    if (found.totpEnabled) {
      if (!input.code) return { twoFactorRequired: true as const }
      if (!(await twoFactorService.verifyLoginCode(found, input.code))) {
        await loginThrottle.recordFailure(identity)
        throw new ApiError(401, 'INVALID_CODE', 'That code is incorrect or has expired')
      }
    }
    await loginThrottle.clear(identity)

    const user = await userRepository.findById(found.id)
    if (!user) throw ApiError.unauthorized()

    const sessionToken = await sessionService.create(user.id, meta)
    return { user: toUserDto(user), sessionToken }
  },

  async getUser(userId: string) {
    const user = await userRepository.findById(userId)
    if (!user) throw ApiError.unauthorized()
    return toUserDto(user)
  },

  async verifyEmail(token: string) {
    const record = await authTokenRepository.findUsable(hashToken(token), 'EMAIL_VERIFICATION')
    if (!record || !(await authTokenRepository.markUsed(record.id))) {
      throw ApiError.badRequest('This verification link is invalid or has expired')
    }
    await prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } })
  },

  async resendVerification(userId: string) {
    const user = await userRepository.findById(userId)
    if (!user) throw ApiError.unauthorized()
    if (user.emailVerified) throw ApiError.conflict('Your email is already verified')
    await issueEmailVerification(user)
  },

  async forgotPassword(email: string) {
    const user = await userRepository.findByEmail(email)
    if (!user || user.status !== 'ACTIVE') return // same response either way: no account enumeration

    await authTokenRepository.deleteForUser(user.id, 'PASSWORD_RESET')
    const token = generateToken()
    await authTokenRepository.create({
      userId: user.id,
      type: 'PASSWORD_RESET',
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    })
    void sendPasswordResetEmail(user.email, user.fullName, token) // not awaited, so response time does not leak
  },

  async resetPassword(token: string, newPassword: string) {
    const record = await authTokenRepository.findUsable(hashToken(token), 'PASSWORD_RESET')
    if (!record || !(await authTokenRepository.markUsed(record.id))) {
      throw ApiError.badRequest('This reset link is invalid or has expired')
    }
    const passwordHash = await hashPassword(newPassword)
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      prisma.session.deleteMany({ where: { userId: record.userId } }), // sign out everywhere
    ])
  },

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const current = await userRepository.findById(userId)
    if (!current) throw ApiError.unauthorized()

    const data: Prisma.UserUncheckedUpdateInput = {}
    if (input.fullName !== undefined) data.fullName = input.fullName
    if (input.department !== undefined) data.department = input.department || null

    if (input.phone !== undefined) {
      if (input.phone && input.phone !== current.phone) {
        const owner = await userRepository.findByPhone(input.phone)
        if (owner && owner.id !== userId) throw ApiError.conflict('An account with this phone number already exists')
      }
      if (input.phone !== current.phone) data.phoneVerified = false
      data.phone = input.phone
    }

    if (input.campusId !== undefined) {
      if (input.campusId) await assertCampusBelongsTo(input.campusId, current.universityId)
      data.campusId = input.campusId
    }

    try {
      return toUserDto(await userRepository.update(userId, data))
    } catch (error) {
      if (isUniqueViolation(error)) throw ApiError.conflict('An account with this phone number already exists')
      throw error
    }
  },
}