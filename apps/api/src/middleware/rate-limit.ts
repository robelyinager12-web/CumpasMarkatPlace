import { rateLimit } from 'express-rate-limit'
import { env } from '../config/env.js'
import { ApiError } from '../utils/api-error.js'

const build = (windowMs: number, limit: number) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(ApiError.tooManyRequests())
    },
  })

export const globalLimiter = build(15 * 60 * 1000, 600)
// Per IP. Campus Wi-Fi shares IPs, so this is generous; per-account lockout can be added in Phase 6.
export const authLimiter = build(15 * 60 * 1000, env.AUTH_RATE_LIMIT_MAX)