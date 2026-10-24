import { Router } from 'express'
import { ApiError } from '../utils/api-error.js'
import { ok } from '../utils/api-response.js'
import { asyncHandler } from '../utils/async-handler.js'

export const apiRouter = Router()

// Liveness: does not touch the database
apiRouter.get('/health', (_req, res) => {
  res.json(ok({ status: 'ok', uptime: Math.round(process.uptime()), timestamp: new Date().toISOString() }))
})

// Readiness: checks the database connection
apiRouter.get(
  '/health/ready',
  asyncHandler(async (_req, res) => {
    const { prisma } = await import('../config/database.js')
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch {
      throw new ApiError(503, 'DB_UNAVAILABLE', 'Database is not reachable')
    }
    res.json(ok({ status: 'ready' }))
  }),
)