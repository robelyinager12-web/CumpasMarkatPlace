import { Router } from 'express'
import { categoriesController } from '../controllers/categories.controller.js'

export const categoriesRouter = Router()

categoriesRouter.get('/', categoriesController.list)