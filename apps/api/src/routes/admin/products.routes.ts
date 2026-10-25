import { Router } from 'express'
import { adminProductsController } from '../../controllers/admin/products.controller.js'
import { validate } from '../../middleware/validate.js'
import { productListQuerySchema, productStatusSchema } from '../../validators/admin.validator.js'
import { idParamSchema } from '../../validators/common.validator.js'

export const adminProductsRouter = Router()

adminProductsRouter.get('/', validate({ query: productListQuerySchema }), adminProductsController.list)
adminProductsRouter.patch('/:id/status', validate({ params: idParamSchema, body: productStatusSchema }), adminProductsController.setStatus)