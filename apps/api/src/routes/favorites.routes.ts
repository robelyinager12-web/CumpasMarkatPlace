import { Router } from 'express'
import { favoritesController } from '../controllers/favorites.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { validate } from '../middleware/validate.js'
import { paginationQuerySchema, productIdParamSchema } from '../validators/common.validator.js'

export const favoritesRouter = Router()

favoritesRouter.use(authenticate)
favoritesRouter.get('/', validate({ query: paginationQuerySchema }), favoritesController.list)
favoritesRouter.post('/:productId', validate({ params: productIdParamSchema }), favoritesController.add)
favoritesRouter.delete('/:productId', validate({ params: productIdParamSchema }), favoritesController.remove)