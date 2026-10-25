import cookieParser from 'cookie-parser'
import express from 'express'
import helmet from 'helmet'
import { corsMiddleware } from './config/cors.js'
import { env } from './config/env.js'
import { errorHandler } from './middleware/error-handler.js'
import { notFound } from './middleware/not-found.js'
import { globalLimiter } from './middleware/rate-limit.js'
import { requestLogger } from './middleware/request-logger.js'
import { requireTrustedOrigin } from './middleware/trusted-origin.js'
import { apiRouter } from './routes/index.routes.js'

export const app = express()

app.disable('x-powered-by')
app.set('trust proxy', 1) // behind one proxy on Render/Railway/Fly
app.use(helmet())
app.use(corsMiddleware)

// Development only: serve locally stored photos. They are validated JPEG/PNG/WebP files with generated names.
// Helmet blocks cross-origin embedding by default, so images are explicitly allowed to be shown by the web app.
if (env.IMAGE_STORAGE_DRIVER === 'local') {
  app.use(
    '/uploads',
    (_req, res, next) => {
      res.set('Cross-Origin-Resource-Policy', 'cross-origin')
      next()
    },
    express.static(env.UPLOAD_DIR, { index: false, dotfiles: 'deny', maxAge: '7d', immutable: true }),
  )
}

app.use(requestLogger)
app.use(express.json({ limit: '100kb' }))
app.use(cookieParser())
app.use(requireTrustedOrigin)

app.use('/api/v1', globalLimiter, apiRouter)

app.use(notFound)
app.use(errorHandler)