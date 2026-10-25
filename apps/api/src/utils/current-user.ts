import type { Request } from 'express'
import { ApiError } from './api-error.js'

export function requireUser(req: Request) {
  if (!req.user) throw ApiError.unauthorized()
  return req.user
}