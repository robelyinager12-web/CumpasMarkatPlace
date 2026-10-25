import { dashboardService } from '../services/dashboard.service.js'
import { requireUser } from '../utils/current-user.js'
import { ok } from '../utils/api-response.js'
import { asyncHandler } from '../utils/async-handler.js'

export const dashboardController = {
  seller: asyncHandler(async (req, res) => {
    res.json(ok(await dashboardService.seller(requireUser(req).id)))
  }),

  buyer: asyncHandler(async (req, res) => {
    res.json(ok(await dashboardService.buyer(requireUser(req).id)))
  }),
}