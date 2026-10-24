import type { Role } from '@prisma/client'
import type { RequestHandler } from 'express'
import { ApiError } from '../utils/api-error.js'

export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized())
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden())
    next()
  }

export const requireVerifiedEmail: RequestHandler = (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized())
  if (!req.user.emailVerified) {
    return next(new ApiError(403, 'EMAIL_NOT_VERIFIED', 'Verify your email to use this feature'))
  }
  next()
}