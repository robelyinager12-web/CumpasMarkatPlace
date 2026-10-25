import { adminUniversitiesService } from '../../services/admin-universities.service.js'
import { ok } from '../../utils/api-response.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { requireUser } from '../../utils/current-user.js'
import type { CreateUniversityInput, UpdateUniversityInput } from '../../validators/admin.validator.js'

export const adminUniversitiesController = {
  list: asyncHandler(async (_req, res) => {
    res.json(ok({ universities: await adminUniversitiesService.list() }))
  }),

  create: asyncHandler(async (req, res) => {
    const university = await adminUniversitiesService.create(requireUser(req).id, req.body as CreateUniversityInput)
    res.status(201).json(ok({ university }))
  }),

  update: asyncHandler(async (req, res) => {
    const { id } = res.locals.params as { id: string }
    res.json(ok(await adminUniversitiesService.update(requireUser(req).id, id, req.body as UpdateUniversityInput)))
  }),

  remove: asyncHandler(async (req, res) => {
    const { id } = res.locals.params as { id: string }
    await adminUniversitiesService.remove(requireUser(req).id, id)
    res.json(ok({ deleted: true }))
  }),

  addCampus: asyncHandler(async (req, res) => {
    const { id } = res.locals.params as { id: string }
    const campus = await adminUniversitiesService.addCampus(requireUser(req).id, id, (req.body as { name: string }).name)
    res.status(201).json(ok({ campus }))
  }),

  renameCampus: asyncHandler(async (req, res) => {
    const { id } = res.locals.params as { id: string }
    res.json(ok(await adminUniversitiesService.renameCampus(requireUser(req).id, id, (req.body as { name: string }).name)))
  }),

  removeCampus: asyncHandler(async (req, res) => {
    const { id } = res.locals.params as { id: string }
    await adminUniversitiesService.removeCampus(requireUser(req).id, id)
    res.json(ok({ deleted: true }))
  }),
}