import { app } from './app.js'
import { prisma } from './config/database.js'
import { env } from './config/env.js'
import { logger } from './config/logger.js'
import { startCleanupSchedule } from './jobs/cleanup.js'

const stopCleanup = startCleanupSchedule()

const server = app.listen(env.PORT, () => {
  logger.info(`UniKamp API listening on :${env.PORT} (${env.NODE_ENV})`)
})

const shutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down`)
  stopCleanup()
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
  setTimeout(() => process.exit(1), 10_000).unref()
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))