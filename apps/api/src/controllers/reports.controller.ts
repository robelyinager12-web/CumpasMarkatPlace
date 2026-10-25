import { reportsService } from '../services/reports.service.js'
import { requireUser } from '../utils/current-user.js'
import { ok } from '../utils/api-response.js'
import { asyncHandler } from '../utils/async-handler.js'
import type { CreateReportInput } from '../validators/reports.validator.js'

export const reportsController = {
  create: asyncHandler(async (req, res) => {
    const report = await reportsService.create(requireUser(req).id, req.body as CreateReportInput)
    res.status(201).json(ok({ report }))
  }),

  mine: asyncHandler(async (req, res) => {
    res.json(ok({ reports: await reportsService.listMine(requireUser(req).id) }))
  }),
}