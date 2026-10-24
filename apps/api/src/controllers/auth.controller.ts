import type { Request } from 'express'
import { clearSessionCookieOptions, SESSION_COOKIE, sessionCookieOptions } from '../config/session.js'
import { authService } from '../services/auth.service.js'
import { sessionService } from '../services/session.service.js'
import { verificationService } from '../services/verification.service.js'
import { ApiError } from '../utils/api-error.js'
import { ok } from '../utils/api-response.js'
import { asyncHandler } from '../utils/async-handler.js'
import type { LoginInput, RegisterInput, UpdateProfileInput } from '../validators/auth.validator.js'

const clientMeta = (req: Request) => ({ ip: req.ip, userAgent: req.get('user-agent')?.slice(0, 255) })

const currentUserId = (req: Request) => {
  if (!req.user) throw ApiError.unauthorized()
  return req.user.id
}

export const authController = {
  register: asyncHandler(async (req, res) => {
    const { user, sessionToken } = await authService.register(req.body as RegisterInput, clientMeta(req))
    res.cookie(SESSION_COOKIE, sessionToken, sessionCookieOptions)
    res.status(201).json(ok({ user }))
  }),

  login: asyncHandler(async (req, res) => {
    const { user, sessionToken } = await authService.login(req.body as LoginInput, clientMeta(req))
    res.cookie(SESSION_COOKIE, sessionToken, sessionCookieOptions)
    res.json(ok({ user }))
  }),

  logout: asyncHandler(async (req, res) => {
    const token: unknown = req.cookies?.[SESSION_COOKIE]
    if (typeof token === 'string') await sessionService.destroy(token)
    res.clearCookie(SESSION_COOKIE, clearSessionCookieOptions)
    res.json(ok({ loggedOut: true }))
  }),

  me: asyncHandler(async (req, res) => {
    res.json(ok({ user: await authService.getUser(currentUserId(req)) }))
  }),

  updateMe: asyncHandler(async (req, res) => {
    res.json(ok({ user: await authService.updateProfile(currentUserId(req), req.body as UpdateProfileInput) }))
  }),

  verifyEmail: asyncHandler(async (req, res) => {
    await authService.verifyEmail((req.body as { token: string }).token)
    res.json(ok({ verified: true }))
  }),

  resendVerification: asyncHandler(async (req, res) => {
    await authService.resendVerification(currentUserId(req))
    res.json(ok({ sent: true }))
  }),

  forgotPassword: asyncHandler(async (req, res) => {
    await authService.forgotPassword((req.body as { email: string }).email)
    res.json(ok({ message: 'If an account exists for this email, a reset link has been sent.' }))
  }),

  resetPassword: asyncHandler(async (req, res) => {
    const { token, password } = req.body as { token: string; password: string }
    await authService.resetPassword(token, password)
    res.json(ok({ reset: true }))
  }),

  requestStudentVerification: asyncHandler(async (req, res) => {
    const body = req.body as { message?: string } | undefined
    res.json(ok(await verificationService.request(currentUserId(req), body?.message)))
  }),
}