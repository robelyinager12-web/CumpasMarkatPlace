import type { RequestHandler } from 'express'
import { logger } from '../config/logger.js'

// Logs method, path (no query string), status and timing. Never logs headers or bodies.
export const requestLogger: RequestHandler = (req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    logger.info(
      { method: req.method, path: req.path, status: res.statusCode, ms: Date.now() - start },
      'request',
    )
  })
  next()
}