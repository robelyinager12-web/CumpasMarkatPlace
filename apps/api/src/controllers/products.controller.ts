import type { Request } from 'express'
import { productsService } from '../services/products.service.js'
import { ApiError } from '../utils/api-error.js'
import { ok } from '../utils/api-response.js'
import { asyncHandler } from '../utils/async-handler.js'
import { hashToken } from '../utils/tokens.js'
import type {
  CreateProductInput,
  ListProductsQuery,
  MineQuery,
  UpdateProductInput,
} from '../validators/products.validator.js'

const userId = (req: Request) => {
  if (!req.user) throw ApiError.unauthorized()
  return req.user.id
}

// Signed-in viewers count by account; visitors by an irreversible keyed hash of IP + browser.
const viewerKey = (req: Request) =>
  req.user ? req.user.id : `anon:${hashToken(`${req.ip}|${req.get('user-agent') ?? ''}`).slice(0, 16)}`

export const productsController = {
  list: asyncHandler(async (req, res) => {
    const { products, meta } = await productsService.list(res.locals.query as ListProductsQuery, req.user?.id)
    res.json(ok({ products }, meta))
  }),

  mine: asyncHandler(async (req, res) => {
    const { status } = res.locals.query as MineQuery
    res.json(ok({ products: await productsService.listMine(userId(req), status) }))
  }),

  get: asyncHandler(async (req, res) => {
    const { id } = res.locals.params as { id: string }
    const { product, countView } = await productsService.getById(id, req.user)
    if (countView) void productsService.recordView(id, viewerKey(req)).catch(() => undefined)
    res.json(ok({ product }))
  }),

  create: asyncHandler(async (req, res) => {
    const product = await productsService.create(userId(req), req.body as CreateProductInput)
    res.status(201).json(ok({ product }))
  }),

  update: asyncHandler(async (req, res) => {
    const { id } = res.locals.params as { id: string }
    res.json(ok({ product: await productsService.update(userId(req), id, req.body as UpdateProductInput) }))
  }),

  remove: asyncHandler(async (req, res) => {
    const { id } = res.locals.params as { id: string }
    await productsService.remove(userId(req), id)
    res.json(ok({ deleted: true }))
  }),
}