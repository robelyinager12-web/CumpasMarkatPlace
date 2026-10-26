import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { requireRole } from '../../middleware/authorize.js'
import { requireAdminTwoFactor } from '../../middleware/two-factor.js'
import { adminAuditLogsRouter } from './audit-logs.routes.js'
import { adminCategoriesRouter } from './categories.routes.js'
import { adminDashboardRouter } from './dashboard.routes.js'
import { adminFeaturedRouter } from './featured.routes.js'
import { adminProductsRouter } from './products.routes.js'
import { adminReportsRouter } from './reports.routes.js'
import { adminCampusesRouter, adminUniversitiesRouter } from './universities.routes.js'
import { adminUsersRouter } from './users.routes.js'
import { adminVerificationsRouter } from './verifications.routes.js'

export const adminRouter = Router()

// Every admin route requires a signed-in ADMIN (with two-factor on, when enforced).
// Enforced here on the server, not just hidden in the UI.
adminRouter.use(authenticate, requireRole('ADMIN'), requireAdminTwoFactor)

adminRouter.use('/dashboard', adminDashboardRouter)
adminRouter.use('/users', adminUsersRouter)
adminRouter.use('/products', adminProductsRouter)
adminRouter.use('/reports', adminReportsRouter)
adminRouter.use('/verifications', adminVerificationsRouter)
adminRouter.use('/categories', adminCategoriesRouter)
adminRouter.use('/universities', adminUniversitiesRouter)
adminRouter.use('/campuses', adminCampusesRouter)
adminRouter.use('/featured', adminFeaturedRouter)
adminRouter.use('/audit-logs', adminAuditLogsRouter)