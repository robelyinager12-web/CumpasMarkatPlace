import type { ReportListQuery, ReviewReportInput } from '../../validators/admin.validator.js'
import { adminReportsService } from '../../services/admin-reports.service.js'
import { requireUser } from '../../utils/current-user.js'
import { ok } from '../../utils/api-response.js'
import { asyncHandler } from '../../utils/async-handler.js'

export const adminReportsController = {
  list: asyncHandler(async (_req, res) => {
    const { status } = res.locals.query as ReportListQuery
    res.json(ok({ reports: await adminReportsService.list(status) }))
  }),

  review: asyncHandler(async (req, res) => {
    const { id } = res.locals.params as { id: string }
    res.json(ok(await adminReportsService.review(requireUser(req).id, id, req.body as ReviewReportInput)))
  }),
}