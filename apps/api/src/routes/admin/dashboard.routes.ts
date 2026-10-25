import { Router } from 'express'
import { adminDashboardController } from '../../controllers/admin/dashboard.controller.js'

export const adminDashboardRouter = Router()

adminDashboardRouter.get('/', adminDashboardController.get)