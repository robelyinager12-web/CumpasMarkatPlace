import { Router } from 'express'
import { adminReportsController } from '../../controllers/admin/reports.controller.js'
import { validate } from '../../middleware/validate.js'
import { reportListQuerySchema, reviewReportSchema } from '../../validators/admin.validator.js'
import { idParamSchema } from '../../validators/common.validator.js'

export const adminReportsRouter = Router()

adminReportsRouter.get('/', validate({ query: reportListQuerySchema }), adminReportsController.list)
adminReportsRouter.patch(
  '/:id',
  validate({ params: idParamSchema, body: reviewReportSchema }),
  adminReportsController.review,
)