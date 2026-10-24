import type { CookieOptions } from 'express'
import { env } from './env.js'

export const SESSION_COOKIE = 'unikamp_session'
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

const base: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.NODE_ENV === 'production',
  path: '/',
}

export const sessionCookieOptions: CookieOptions = { ...base, maxAge: SESSION_TTL_MS }
export const clearSessionCookieOptions: CookieOptions = base