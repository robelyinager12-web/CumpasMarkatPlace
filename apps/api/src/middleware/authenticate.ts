import { clearSessionCookieOptions, SESSION_COOKIE } from '../config/session.js'
import { sessionService } from '../services/session.service.js'
import { ApiError } from '../utils/api-error.js'
import { asyncHandler } from '../utils/async-handler.js'

export const authenticate = asyncHandler(async (req, res, next) => {
  const token: unknown = req.cookies?.[SESSION_COOKIE]
  if (typeof token !== 'string' || token.length < 20) throw ApiError.unauthorized()

  const session = await sessionService.findValid(token)
  if (!session) {
    res.clearCookie(SESSION_COOKIE, clearSessionCookieOptions)
    throw ApiError.unauthorized('Your session has expired. Please log in again.')
  }
  if (session.user.status !== 'ACTIVE') {
    throw new ApiError(403, 'ACCOUNT_SUSPENDED', 'Your account is suspended. Please contact support.')
  }

  req.user = {
    id: session.user.id,
    email: session.user.email,
    fullName: session.user.fullName,
    role: session.user.role,
    emailVerified: session.user.emailVerified,
  }
  req.sessionId = session.id
  next()
})