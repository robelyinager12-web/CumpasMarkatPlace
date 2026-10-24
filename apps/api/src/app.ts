import express from 'express'
import helmet from 'helmet'
import { corsMiddleware } from './config/cors.js'
import { errorHandler } from './middleware/error-handler.js'
import { notFound } from './middleware/not-found.js'
import { globalLimiter } from './middleware/rate-limit.js'
import { requestLogger } from './middleware/request-logger.js'
import { apiRouter } from './routes/index.routes.js'

export const app = express()

app.disable('x-powered-by')
app.set('trust proxy', 1) // behind one proxy on Render/Railway/Fly
app.use(helmet())
app.use(corsMiddleware)
app.use(requestLogger)
app.use(express.json({ limit: '100kb' }))

app.use('/api/v1', globalLimiter, apiRouter)

app.use(notFound)
app.use(errorHandler)