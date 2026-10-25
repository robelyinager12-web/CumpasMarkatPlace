import { Router } from 'express'
import { adminFeaturedController } from '../../controllers/admin/featured.controller.js'
import { validate } from '../../middleware/validate.js'
import { createFeaturedSchema, featuredListQuerySchema } from '../../validators/admin.validator.js'
import { idParamSchema } from '../../validators/common.validator.js'

export const adminFeaturedRouter = Router()

adminFeaturedRouter.get('/', validate({ query: featuredListQuerySchema }), adminFeaturedController.list)
adminFeaturedRouter.post('/', validate({ body: createFeaturedSchema }), adminFeaturedController.create)
adminFeaturedRouter.delete('/:id', validate({ params: idParamSchema }), adminFeaturedController.remove)