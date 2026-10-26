import { prisma } from '../config/database.js'
import { env } from '../config/env.js'
import { ApiError } from '../utils/api-error.js'
import { hashToken } from '../utils/tokens.js'

const WINDOW_MS = env.LOGIN_LOCK_MINUTES * 60_000

// The identity is hashed, so the table holds no email addresses. It works the same for emails that do not exist.
const keyOf = (identity: string) => hashToken(`throttle:${identity.toLowerCase()}`)

export const loginThrottle = {
  async assertNotLocked(identity: string) {
    const row = await prisma.loginThrottle.findUnique({ where: { key: keyOf(identity) } })
    if (row?.lockedUntil && row.lockedUntil.getTime() > Date.now()) {
      const minutes = Math.max(1, Math.ceil((row.lockedUntil.getTime() - Date.now()) / 60_000))
      throw new ApiError(
        429,
        'TOO_MANY_ATTEMPTS',
        `Too many failed attempts. Please try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
      )
    }
  },

  async recordFailure(identity: string) {
    const key = keyOf(identity)
    const now = Date.now()
    const row = await prisma.loginThrottle.findUnique({ where: { key } })
    const lockExpired = !!row?.lockedUntil && row.lockedUntil.getTime() <= now
    const windowExpired = !!row && now - row.updatedAt.getTime() > WINDOW_MS
    const failures = row && !lockExpired && !windowExpired ? row.failures + 1 : 1
    const lockedUntil = failures >= env.LOGIN_MAX_FAILURES ? new Date(now + WINDOW_MS) : null
    await prisma.loginThrottle.upsert({
      where: { key },
      update: { failures, lockedUntil },
      create: { key, failures, lockedUntil },
    })
  },

  async clear(identity: string) {
    await prisma.loginThrottle.deleteMany({ where: { key: keyOf(identity) } })
  },
}