import { analyticsService } from '../../services/analytics.service.js'
import { ok } from '../../utils/api-response.js'
import { asyncHandler } from '../../utils/async-handler.js'

export const adminDashboardController = {
  get: asyncHandler(async (_req, res) => {
    res.json(ok(await analyticsService.dashboard()))
  }),
}