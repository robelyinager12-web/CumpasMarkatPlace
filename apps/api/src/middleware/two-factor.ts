import type { RequestHandler } from 'express'
import { env } from '../config/env.js'
import { ApiError } from '../utils/api-error.js'

export const requireAdminTwoFactor: RequestHandler = (req, _res, next) => {
  if (env.requireAdminTwoFactor && req.user && !req.user.twoFactorEnabled) {
    return next(
      new ApiError(
        403,
        'TWO_FACTOR_REQUIRED',
        'Turn on two-factor sign-in in your dashboard security settings to use the admin area.',
      ),
    )
  }
  next()
}