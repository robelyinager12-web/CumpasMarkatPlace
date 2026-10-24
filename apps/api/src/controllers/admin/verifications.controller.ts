import { verificationService } from '../../services/verification.service.js'
import { ApiError } from '../../utils/api-error.js'
import { ok } from '../../utils/api-response.js'
import { asyncHandler } from '../../utils/async-handler.js'
import type { ReviewVerificationInput, VerificationListQuery } from '../../validators/admin.validator.js'

export const adminVerificationsController = {
  list: asyncHandler(async (_req, res) => {
    const { status } = res.locals.query as VerificationListQuery
    res.json(ok({ verifications: await verificationService.listByStatus(status) }))
  }),

  review: asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized()
    const { userId } = res.locals.params as { userId: string }
    res.json(ok(await verificationService.review(req.user.id, userId, req.body as ReviewVerificationInput)))
  }),
}