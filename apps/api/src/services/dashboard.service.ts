import { prisma } from '../config/database.js'
import { favoriteRepository } from '../repositories/favorite.repository.js'
import { productListInclude } from '../repositories/product.repository.js'
import { conversationsService } from './conversations.service.js'
import { favoritesService } from './favorites.service.js'
import { toListDto } from './product-dto.js'
import { reportsService } from './reports.service.js'

async function recentlyViewed(userId: string) {
  const views = await prisma.listingView.findMany({
    where: { viewerId: userId },
    orderBy: { createdAt: 'desc' },
    take: 40,
    select: { productId: true },
  })
  const ids = [...new Set(views.map((view) => view.productId))].slice(0, 6)
  if (ids.length === 0) return []

  const [rows, favoriteIds] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: ids }, status: { in: ['ACTIVE', 'SOLD'] } },
      include: productListInclude,
    }),
    favoriteRepository.idsAmong(userId, ids),
  ])
  const order = new Map(ids.map((id, index) => [id, index]))
  rows.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
  return rows.map((row) => toListDto(row, favoriteIds))
}

export const dashboardService = {
  async seller(userId: string) {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const [activeListings, soldListings, draftListings, favoritesReceived, totalViews, viewsLast7Days, conversations] =
      await Promise.all([
        prisma.product.count({ where: { sellerId: userId, status: 'ACTIVE' } }),
        prisma.product.count({ where: { sellerId: userId, status: 'SOLD' } }),
        prisma.product.count({ where: { sellerId: userId, status: 'DRAFT' } }),
        prisma.favorite.count({ where: { product: { sellerId: userId } } }),
        prisma.listingView.count({ where: { product: { sellerId: userId } } }),
        prisma.listingView.count({ where: { product: { sellerId: userId }, createdAt: { gte: weekAgo } } }),
        conversationsService.list(userId),
      ])
    return {
      stats: { activeListings, soldListings, draftListings, favoritesReceived, totalViews, viewsLast7Days },
      recentConversations: conversations.filter((conversation) => conversation.role === 'seller').slice(0, 5),
    }
  },

  async buyer(userId: string) {
    const [favorites, conversations, reports, viewed] = await Promise.all([
      favoritesService.list(userId, 1, 4),
      conversationsService.list(userId),
      reportsService.listMine(userId, 5),
      recentlyViewed(userId),
    ])
    return {
      favorites: favorites.products,
      recentlyViewed: viewed,
      recentConversations: conversations.filter((conversation) => conversation.role === 'buyer').slice(0, 5),
      reports,
    }
  },
}