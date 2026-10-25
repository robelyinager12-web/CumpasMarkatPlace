import { Router } from 'express'
import { productsController } from '../controllers/products.controller.js'
import { uploadsController } from '../controllers/uploads.controller.js'
import { authenticate, optionalAuthenticate } from '../middleware/authenticate.js'
import { requireVerifiedEmail } from '../middleware/authorize.js'
import { requireOwnedProduct } from '../middleware/owned-product.js'
import { uploadLimiter } from '../middleware/rate-limit.js'
import { uploadImages } from '../middleware/upload.js'
import { validate } from '../middleware/validate.js'
import { idParamSchema, productImageParamsSchema } from '../validators/common.validator.js'
import {
  createProductSchema,
  listProductsQuerySchema,
  mineQuerySchema,
  updateProductSchema,
} from '../validators/products.validator.js'

export const productsRouter = Router()

productsRouter.get('/', optionalAuthenticate, validate({ query: listProductsQuerySchema }), productsController.list)
// "/mine" must be declared before "/:id"
productsRouter.get('/mine', authenticate, validate({ query: mineQuerySchema }), productsController.mine)
productsRouter.get('/:id', optionalAuthenticate, validate({ params: idParamSchema }), productsController.get)

productsRouter.post('/', authenticate, requireVerifiedEmail, validate({ body: createProductSchema }), productsController.create)
productsRouter.patch(
  '/:id',
  authenticate,
  requireVerifiedEmail,
  validate({ params: idParamSchema, body: updateProductSchema }),
  productsController.update,
)
productsRouter.delete('/:id', authenticate, validate({ params: idParamSchema }), productsController.remove)

productsRouter.post(
  '/:id/images',
  authenticate,
  requireVerifiedEmail,
  uploadLimiter,
  validate({ params: idParamSchema }),
  requireOwnedProduct,
  uploadImages,
  uploadsController.add,
)
productsRouter.delete(
  '/:id/images/:imageId',
  authenticate,
  validate({ params: productImageParamsSchema }),
  uploadsController.remove,
)