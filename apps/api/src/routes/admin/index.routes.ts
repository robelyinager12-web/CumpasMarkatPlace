import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { requireRole } from '../../middleware/authorize.js'
import { adminReportsRouter } from './reports.routes.js'
import { adminVerificationsRouter } from './verifications.routes.js'

export const adminRouter = Router()

// Every admin route requires a signed-in ADMIN. Enforced here on the server, not just hidden in the UI.
adminRouter.use(authenticate, requireRole('ADMIN'))
adminRouter.use('/verifications', adminVerificationsRouter)
adminRouter.use('/reports', adminReportsRouter)