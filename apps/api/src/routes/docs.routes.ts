import { Router } from 'express'
import swaggerUi from 'swagger-ui-express'
import { openApiDocument } from '../config/swagger.js'

export const docsRouter = Router()

// A relaxed policy just for this page: Helmet's default adds upgrade-insecure-requests, which breaks Swagger UI on http://localhost
docsRouter.use((_req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; base-uri 'self'; frame-ancestors 'none'",
  )
  next()
})

docsRouter.get('/openapi.json', (_req, res) => {
  res.json(openApiDocument)
})
docsRouter.use('/', swaggerUi.serve, swaggerUi.setup(openApiDocument, { customSiteTitle: 'UniKamp API' }))