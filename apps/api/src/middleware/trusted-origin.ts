import type { RequestHandler } from 'express'
import { env } from '../config/env.js'
import { ApiError } from '../utils/api-error.js'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])
const allowedOrigin = new URL(env.FRONTEND_URL).origin

// CSRF defence in depth on top of SameSite=Lax cookies: browsers always send Origin on
// cross-site writes, so a request from another site is refused.
export const requireTrustedOrigin: RequestHandler = (req, _res, next) => {
  if (SAFE_METHODS.has(req.method)) return next()
  const origin = req.get('origin')
  if (origin && origin !== allowedOrigin) return next(ApiError.forbidden('Request origin is not allowed'))
  next()
}