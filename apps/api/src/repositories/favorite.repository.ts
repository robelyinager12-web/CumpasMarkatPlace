import { prisma } from '../config/database.js'
import { productListInclude } from './product.repository.js'

const visibleProduct = { status: { in: ['ACTIVE', 'SOLD'] as ('ACTIVE' | 'SOLD')[] } }

export const favoriteRepository = {
  add: (userId: string, productId: string) =>
    prisma.favorite.upsert({
      where: { userId_productId: { userId, productId } },
      update: {},
      create: { userId, productId },
    }),

  remove: (userId: string, productId: string) => prisma.favorite.deleteMany({ where: { userId, productId } }),

  idsAmong: async (userId: string, productIds: string[]) => {
    if (productIds.length === 0) return new Set<string>()
    const rows = await prisma.favorite.findMany({
      where: { userId, productId: { in: productIds } },
      select: { productId: true },
    })
    return new Set(rows.map((row) => row.productId))
  },

  list: (userId: string, skip: number, take: number) =>
    prisma.$transaction([
      prisma.favorite.findMany({
        where: { userId, product: visibleProduct },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { product: { include: productListInclude } },
      }),
      prisma.favorite.count({ where: { userId, product: visibleProduct } }),
    ]),
}