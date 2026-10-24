import type { RequestHandler } from 'express'
import type { ZodType } from 'zod'
import { ApiError } from '../utils/api-error.js'

type Schemas = { body?: ZodType; query?: ZodType; params?: ZodType }

// Validates with Zod. Parsed body replaces req.body; parsed query/params go to res.locals
// (req.query is read-only in Express 5).
export const validate =
  (schemas: Schemas): RequestHandler =>
  (req, res, next) => {
    for (const key of ['body', 'query', 'params'] as const) {
      const schema = schemas[key]
      if (!schema) continue
      const result = schema.safeParse(req[key])
      if (!result.success) {
        return next(
          ApiError.validation(
            result.error.issues.map((i) => ({ path: i.path.map(String).join('.'), message: i.message })),
          ),
        )
      }
      if (key === 'body') req.body = result.data
      else res.locals[key] = result.data
    }
    next()
  }