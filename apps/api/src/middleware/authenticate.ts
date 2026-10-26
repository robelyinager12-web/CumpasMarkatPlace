import { clearSessionCookieOptions, SESSION_COOKIE } from '../config/session.js'
import { sessionService } from '../services/session.service.js'
import { ApiError } from '../utils/api-error.js'
import { asyncHandler } from '../utils/async-handler.js'

type SessionWithUser = NonNullable<Awaited<ReturnType<typeof sessionService.findValid>>>

const toAuthUser = (session: SessionWithUser) => ({
  id: session.user.id,
  email: session.user.email,
  fullName: session.user.fullName,
  role: session.user.role,
  emailVerified: session.user.emailVerified,
  twoFactorEnabled: session.user.totpEnabled,
})

const readToken = (cookies: unknown): string | null => {
  const token = (cookies as Record<string, unknown> | undefined)?.[SESSION_COOKIE]
  return typeof token === 'string' && token.length >= 20 ? token : null
}

export const authenticate = asyncHandler(async (req, res, next) => {
  const token = readToken(req.cookies)
  if (!token) throw ApiError.unauthorized()

  const session = await sessionService.findValid(token)
  if (!session) {
    res.clearCookie(SESSION_COOKIE, clearSessionCookieOptions)
    throw ApiError.unauthorized('Your session has expired. Please log in again.')
  }
  if (session.user.status !== 'ACTIVE') {
    throw new ApiError(403, 'ACCOUNT_SUSPENDED', 'Your account is suspended. Please contact support.')
  }

  req.user = toAuthUser(session)
  req.sessionId = session.id
  next()
})

// For public pages that look different when signed in (favorite hearts, "this is your listing").
// A missing or invalid session simply means "visitor".
export const optionalAuthenticate = asyncHandler(async (req, _res, next) => {
  const token = readToken(req.cookies)
  if (token) {
    const session = await sessionService.findValid(token)
    if (session && session.user.status === 'ACTIVE') {
      req.user = toAuthUser(session)
      req.sessionId = session.id
    }
  }
  next()
})