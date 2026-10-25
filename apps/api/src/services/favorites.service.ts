import { prisma } from '../config/database.js'
import { favoriteRepository } from '../repositories/favorite.repository.js'
import { ApiError } from '../utils/api-error.js'
import { buildMeta } from '../utils/pagination.js'
import { toListDto } from './product-dto.js'

export const favoritesService = {
  async add(userId: string, productId: string) {
    const product = await prisma.product.findFirst({ where: { id: productId, status: 'ACTIVE' }, select: { id: true } })
    if (!product) throw ApiError.notFound('Listing not found')
    await favoriteRepository.add(userId, productId) // saving twice is harmless
  },

  async remove(userId: string, productId: string) {
    await favoriteRepository.remove(userId, productId)
  },

  async list(userId: string, page: number, pageSize: number) {
    const [rows, total] = await favoriteRepository.list(userId, (page - 1) * pageSize, pageSize)
    const all = new Set(rows.map((row) => row.productId))
    return {
      products: rows.map((row) => toListDto(row.product, all)),
      meta: buildMeta(page, pageSize, total),
    }
  },
}