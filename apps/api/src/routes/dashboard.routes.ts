import { Router } from 'express'
import { dashboardController } from '../controllers/dashboard.controller.js'
import { authenticate } from '../middleware/authenticate.js'

export const dashboardRouter = Router()

dashboardRouter.use(authenticate)
dashboardRouter.get('/seller', dashboardController.seller)
dashboardRouter.get('/buyer', dashboardController.buyer)