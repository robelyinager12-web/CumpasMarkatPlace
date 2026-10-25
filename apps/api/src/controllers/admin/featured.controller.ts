import { adminFeaturedService } from '../../services/admin-featured.service.js'
import { ok } from '../../utils/api-response.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { requireUser } from '../../utils/current-user.js'
import type { CreateFeaturedInput, FeaturedListQuery } from '../../validators/admin.validator.js'

export const adminFeaturedController = {
  list: asyncHandler(async (_req, res) => {
    const { featured, meta } = await adminFeaturedService.list(res.locals.query as FeaturedListQuery)
    res.json(ok({ featured }, meta))
  }),

  create: asyncHandler(async (req, res) => {
    const featured = await adminFeaturedService.create(requireUser(req).id, req.body as CreateFeaturedInput)
    res.status(201).json(ok({ featured }))
  }),

  remove: asyncHandler(async (req, res) => {
    const { id } = res.locals.params as { id: string }
    await adminFeaturedService.remove(requireUser(req).id, id)
    res.json(ok({ deleted: true }))
  }),
}