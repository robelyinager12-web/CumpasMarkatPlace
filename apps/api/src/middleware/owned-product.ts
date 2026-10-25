import { productsService } from '../services/products.service.js'
import { ApiError } from '../utils/api-error.js'
import { asyncHandler } from '../utils/async-handler.js'

// Runs BEFORE the upload is read, so strangers cannot make the server buffer big files.
export const requireOwnedProduct = asyncHandler(async (req, res, next) => {
  if (!req.user) throw ApiError.unauthorized()
  const { id } = res.locals.params as { id: string }
  await productsService.getOwned(req.user.id, id)
  next()
})