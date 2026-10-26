import { prisma } from '../config/database.js'
import { logger } from '../config/logger.js'

const DAY_MS = 24 * 60 * 60 * 1000

// Safe to run on several servers at once: it only deletes rows that are already useless.
export async function runCleanup(now = new Date()) {
  const dayAgo = new Date(now.getTime() - DAY_MS)
  const ninetyDaysAgo = new Date(now.getTime() - 90 * DAY_MS)

  const [sessions, tokens, throttles, notifications] = await prisma.$transaction([
    prisma.session.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.authToken.deleteMany({ where: { OR: [{ expiresAt: { lt: dayAgo } }, { usedAt: { lt: dayAgo } }] } }),
    prisma.loginThrottle.deleteMany({ where: { updatedAt: { lt: dayAgo } } }),
    prisma.notification.deleteMany({ where: { readAt: { lt: ninetyDaysAgo } } }),
  ])
  return {
    sessions: sessions.count,
    tokens: tokens.count,
    throttles: throttles.count,
    notifications: notifications.count,
  }
}

export function startCleanupSchedule() {
  const run = () =>
    runCleanup()
      .then((result) => logger.info(result, 'Cleanup finished'))
      .catch((err) => logger.error({ err }, 'Cleanup failed'))

  const first = setTimeout(run, 60_000)
  const timer = setInterval(run, 6 * 60 * 60 * 1000)
  first.unref()
  timer.unref()
  return () => {
    clearTimeout(first)
    clearInterval(timer)
  }
}