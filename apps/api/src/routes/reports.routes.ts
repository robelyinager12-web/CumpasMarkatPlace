import { Router } from 'express'
import { reportsController } from '../controllers/reports.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { requireVerifiedEmail } from '../middleware/authorize.js'
import { reportLimiter } from '../middleware/rate-limit.js'
import { validate } from '../middleware/validate.js'
import { createReportSchema } from '../validators/reports.validator.js'

export const reportsRouter = Router()

reportsRouter.use(authenticate)
reportsRouter.get('/mine', reportsController.mine)
reportsRouter.post('/', requireVerifiedEmail, reportLimiter, validate({ body: createReportSchema }), reportsController.create)