import { categoryRepository } from '../repositories/category.repository.js'
import { ok } from '../utils/api-response.js'
import { asyncHandler } from '../utils/async-handler.js'

export const categoriesController = {
  list: asyncHandler(async (_req, res) => {
    res.set('Cache-Control', 'public, max-age=300')
    res.json(ok({ categories: await categoryRepository.listActive() }))
  }),
}