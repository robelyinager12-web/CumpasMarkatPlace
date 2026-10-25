import { rateLimit } from 'express-rate-limit'
import { env } from '../config/env.js'
import { ApiError } from '../utils/api-error.js'

const handler = (_req: unknown, _res: unknown, next: (error?: unknown) => void) => {
  next(ApiError.tooManyRequests())
}

const perIp = (windowMs: number, limit: number) =>
  rateLimit({ windowMs, limit, standardHeaders: 'draft-7', legacyHeaders: false, handler })

// For routes behind authenticate(): counts per account, so shared campus Wi-Fi does not punish everyone
const perUser = (windowMs: number, limit: number) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id ?? 'anonymous',
    handler,
  })

export const globalLimiter = perIp(15 * 60 * 1000, 600)
// Per IP. Campus Wi-Fi shares IPs, so this is generous; per-account lockout can be added in Phase 6.
export const authLimiter = perIp(15 * 60 * 1000, env.AUTH_RATE_LIMIT_MAX)
export const uploadLimiter = perIp(15 * 60 * 1000, 100)

export const conversationStartLimiter = perUser(60 * 60 * 1000, 10)
export const messageLimiter = perUser(10 * 60 * 1000, 60)
export const reportLimiter = perUser(60 * 60 * 1000, 10)