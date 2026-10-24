import { Router } from 'express'
import { adminVerificationsController } from '../../controllers/admin/verifications.controller.js'
import { validate } from '../../middleware/validate.js'
import { reviewVerificationSchema, verificationListQuerySchema } from '../../validators/admin.validator.js'
import { userIdParamSchema } from '../../validators/common.validator.js'

export const adminVerificationsRouter = Router()

adminVerificationsRouter.get('/', validate({ query: verificationListQuerySchema }), adminVerificationsController.list)
adminVerificationsRouter.patch(
  '/:userId',
  validate({ params: userIdParamSchema, body: reviewVerificationSchema }),
  adminVerificationsController.review,
)