import { Router } from 'express'
import { adminCategoriesController } from '../../controllers/admin/categories.controller.js'
import { validate } from '../../middleware/validate.js'
import {
  createCategorySchema,
  moveCategorySchema,
  updateCategorySchema,
} from '../../validators/admin.validator.js'
import { idParamSchema } from '../../validators/common.validator.js'

export const adminCategoriesRouter = Router()

adminCategoriesRouter.get('/', adminCategoriesController.list)
adminCategoriesRouter.post('/', validate({ body: createCategorySchema }), adminCategoriesController.create)
adminCategoriesRouter.patch('/:id', validate({ params: idParamSchema, body: updateCategorySchema }), adminCategoriesController.update)
adminCategoriesRouter.post('/:id/move', validate({ params: idParamSchema, body: moveCategorySchema }), adminCategoriesController.move)
adminCategoriesRouter.delete('/:id', validate({ params: idParamSchema }), adminCategoriesController.remove)