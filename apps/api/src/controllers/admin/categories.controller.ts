import { adminCategoriesService } from '../../services/admin-categories.service.js'
import { ok } from '../../utils/api-response.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { requireUser } from '../../utils/current-user.js'
import type { CreateCategoryInput, UpdateCategoryInput } from '../../validators/admin.validator.js'

export const adminCategoriesController = {
  list: asyncHandler(async (_req, res) => {
    res.json(ok({ categories: await adminCategoriesService.list() }))
  }),

  create: asyncHandler(async (req, res) => {
    const category = await adminCategoriesService.create(requireUser(req).id, req.body as CreateCategoryInput)
    res.status(201).json(ok({ category }))
  }),

  update: asyncHandler(async (req, res) => {
    const { id } = res.locals.params as { id: string }
    res.json(ok(await adminCategoriesService.update(requireUser(req).id, id, req.body as UpdateCategoryInput)))
  }),

  move: asyncHandler(async (req, res) => {
    const { id } = res.locals.params as { id: string }
    const { direction } = req.body as { direction: 'up' | 'down' }
    res.json(ok(await adminCategoriesService.move(requireUser(req).id, id, direction)))
  }),

  remove: asyncHandler(async (req, res) => {
    const { id } = res.locals.params as { id: string }
    await adminCategoriesService.remove(requireUser(req).id, id)
    res.json(ok({ deleted: true }))
  }),
}