import type { Request } from 'express'
import { uploadsService } from '../services/uploads.service.js'
import { ApiError } from '../utils/api-error.js'
import { ok } from '../utils/api-response.js'
import { asyncHandler } from '../utils/async-handler.js'

const userId = (req: Request) => {
  if (!req.user) throw ApiError.unauthorized()
  return req.user.id
}

export const uploadsController = {
  add: asyncHandler(async (req, res) => {
    const { id } = res.locals.params as { id: string }
    const files = (req.files ?? []) as Express.Multer.File[]
    const images = await uploadsService.add(userId(req), id, files)
    res.status(201).json(ok({ images }))
  }),

  remove: asyncHandler(async (req, res) => {
    const { id, imageId } = res.locals.params as { id: string; imageId: string }
    await uploadsService.remove(userId(req), id, imageId)
    res.json(ok({ removed: true }))
  }),
}