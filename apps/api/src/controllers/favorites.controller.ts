import type { Request } from 'express'
import { favoritesService } from '../services/favorites.service.js'
import { ApiError } from '../utils/api-error.js'
import { ok } from '../utils/api-response.js'
import { asyncHandler } from '../utils/async-handler.js'

const userId = (req: Request) => {
  if (!req.user) throw ApiError.unauthorized()
  return req.user.id
}

export const favoritesController = {
  list: asyncHandler(async (req, res) => {
    const { page, pageSize } = res.locals.query as { page: number; pageSize: number }
    const { products, meta } = await favoritesService.list(userId(req), page, pageSize)
    res.json(ok({ products }, meta))
  }),

  add: asyncHandler(async (req, res) => {
    const { productId } = res.locals.params as { productId: string }
    await favoritesService.add(userId(req), productId)
    res.json(ok({ favorite: true }))
  }),

  remove: asyncHandler(async (req, res) => {
    const { productId } = res.locals.params as { productId: string }
    await favoritesService.remove(userId(req), productId)
    res.json(ok({ favorite: false }))
  }),
}