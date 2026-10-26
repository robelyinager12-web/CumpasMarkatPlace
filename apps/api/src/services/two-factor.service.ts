import { randomBytes } from 'node:crypto'
import { prisma } from '../config/database.js'
import { env } from '../config/env.js'
import { logger } from '../config/logger.js'
import { ApiError } from '../utils/api-error.js'
import { verifyPassword } from '../utils/password.js'
import { decryptSecret, encryptSecret } from '../utils/secret-box.js'
import { hashToken } from '../utils/tokens.js'
import { base32Encode, generateSecret, otpauthUrl, verifyTotp } from '../utils/totp.js'
import { loginThrottle } from './login-throttle.service.js'

const RECOVERY_COUNT = 8

const normalizeRecovery = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '')
const hashRecovery = (value: string) => hashToken(`recovery:${normalizeRecovery(value)}`)
const newRecoveryCode = () => {
  const raw = randomBytes(6).toString('hex')
  return `${raw.slice(0, 6)}-${raw.slice(6)}`
}
const newRecoveryCodes = () => Array.from({ length: RECOVERY_COUNT }, newRecoveryCode)
const isSixDigits = (code: string) => /^\d{6}$/.test(code.replace(/\s/g, ''))

type Credentials = { id: string; totpSecret: string | null; recoveryCodeHashes: string[] }

function checkTotp(encrypted: string | null, code: string) {
  if (!encrypted) return false
  try {
    return verifyTotp(decryptSecret(encrypted), code)
  } catch (err) {
    logger.error({ err }, 'Could not read a two-factor secret')
    return false
  }
}

// A six-digit code is checked as an authenticator code, anything else as a single-use recovery code.
async function verifyCode(user: Credentials, code: string): Promise<boolean> {
  if (isSixDigits(code)) return checkTotp(user.totpSecret, code)
  const hash = hashRecovery(code)
  if (!user.recoveryCodeHashes.includes(hash)) return false
  // Atomic: two simultaneous requests cannot both spend the same recovery code
  const removed = await prisma.$executeRaw`
    UPDATE "User" SET "recoveryCodeHashes" = array_remove("recoveryCodeHashes", ${hash})
    WHERE "id" = ${user.id} AND ${hash} = ANY("recoveryCodeHashes")`
  return removed === 1
}

const invalidCode = () => new ApiError(400, 'INVALID_CODE', 'That code is incorrect or has expired')

async function confirmPasswordAndCode(
  user: Credentials & { passwordHash: string },
  password: string,
  code: string,
) {
  const identity = `2fa:${user.id}`
  await loginThrottle.assertNotLocked(identity)
  if (!(await verifyPassword(password, user.passwordHash))) {
    await loginThrottle.recordFailure(identity)
    throw new ApiError(400, 'INVALID_PASSWORD', 'Incorrect password')
  }
  if (!(await verifyCode(user, code))) {
    await loginThrottle.recordFailure(identity)
    throw invalidCode()
  }
  await loginThrottle.clear(identity)
}

const credentialSelect = {
  id: true,
  role: true,
  passwordHash: true,
  totpSecret: true,
  totpEnabled: true,
  recoveryCodeHashes: true,
} as const

export const twoFactorService = {
  verifyLoginCode: verifyCode,

  async setup(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, totpEnabled: true } })
    if (!user) throw ApiError.unauthorized()
    if (user.totpEnabled) throw ApiError.conflict('Two-factor sign-in is already on')

    const secret = generateSecret()
    await prisma.user.update({ where: { id: userId }, data: { totpSecret: encryptSecret(secret) } })
    return { secret: base32Encode(secret), otpauthUrl: otpauthUrl(user.email, secret) }
  },

  async enable(userId: string, code: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { totpSecret: true, totpEnabled: true } })
    if (!user) throw ApiError.unauthorized()
    if (user.totpEnabled) throw ApiError.conflict('Two-factor sign-in is already on')
    if (!user.totpSecret) throw ApiError.badRequest('Start the setup first')

    const identity = `2fa:${userId}`
    await loginThrottle.assertNotLocked(identity)
    if (!checkTotp(user.totpSecret, code)) {
      await loginThrottle.recordFailure(identity)
      throw invalidCode()
    }
    await loginThrottle.clear(identity)

    const recoveryCodes = newRecoveryCodes()
    await prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: true, recoveryCodeHashes: recoveryCodes.map(hashRecovery) },
    })
    return { recoveryCodes } // shown once; only hashes are stored
  },

  async disable(userId: string, password: string, code: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: credentialSelect })
    if (!user) throw ApiError.unauthorized()
    if (!user.totpEnabled) throw ApiError.badRequest('Two-factor sign-in is not on')
    if (user.role === 'ADMIN' && env.requireAdminTwoFactor) {
      throw ApiError.forbidden('Administrators must keep two-factor sign-in on')
    }
    await confirmPasswordAndCode(user, password, code)
    await prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: false, totpSecret: null, recoveryCodeHashes: [] },
    })
  },

  async regenerateRecoveryCodes(userId: string, password: string, code: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: credentialSelect })
    if (!user) throw ApiError.unauthorized()
    if (!user.totpEnabled) throw ApiError.badRequest('Two-factor sign-in is not on')
    await confirmPasswordAndCode(user, password, code)

    const recoveryCodes = newRecoveryCodes()
    await prisma.user.update({ where: { id: userId }, data: { recoveryCodeHashes: recoveryCodes.map(hashRecovery) } })
    return { recoveryCodes }
  },
}