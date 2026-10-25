import { adminProductsService } from '../../services/admin-products.service.js'
import { ok } from '../../utils/api-response.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { requireUser } from '../../utils/current-user.js'
import type { ProductListQuery, ProductStatusInput } from '../../validators/admin.validator.js'

export const adminProductsController = {
  list: asyncHandler(async (_req, res) => {
    const { products, meta } = await adminProductsService.list(res.locals.query as ProductListQuery)
    res.json(ok({ products }, meta))
  }),

  setStatus: asyncHandler(async (req, res) => {
    const { id } = res.locals.params as { id: string }
    res.json(ok(await adminProductsService.setStatus(requireUser(req).id, id, req.body as ProductStatusInput)))
  }),
}