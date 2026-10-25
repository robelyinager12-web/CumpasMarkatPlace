import type { Prisma } from '@prisma/client'
import { prisma } from '../config/database.js'
import { ApiError } from '../utils/api-error.js'
import { buildMeta } from '../utils/pagination.js'
import type { ProductListQuery, ProductStatusInput } from '../validators/admin.validator.js'
import { auditService } from './audit.service.js'
import { notificationService } from './notification.service.js'

const productSelect = {
  id: true,
  title: true,
  priceEtb: true,
  status: true,
  createdAt: true,
  seller: { select: { id: true, fullName: true, email: true, status: true } },
  category: { select: { name: true } },
  university: { select: { name: true } },
  images: { select: { url: true }, orderBy: [{ position: 'asc' }, { id: 'asc' }], take: 1 },
  _count: { select: { favorites: true, reports: true } },
} satisfies Prisma.ProductSelect

export const adminProductsService = {
  async list(query: ProductListQuery) {
    const where: Prisma.ProductWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q, mode: 'insensitive' as const } },
              { seller: { email: { contains: query.q, mode: 'insensitive' as const } } },
              { seller: { fullName: { contains: query.q, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    }
    const [rows, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: productSelect,
      }),
      prisma.product.count({ where }),
    ])

    return {
      products: rows.map((row) => ({
        id: row.id,
        title: row.title,
        price: Number(row.priceEtb),
        status: row.status,
        createdAt: row.createdAt,
        image: row.images[0]?.url ?? null,
        category: row.category.name,
        university: row.university.name,
        seller: {
          id: row.seller.id,
          name: row.seller.fullName,
          email: row.seller.email,
          suspended: row.seller.status === 'SUSPENDED',
        },
        favorites: row._count.favorites,
        reports: row._count.reports,
      })),
      meta: buildMeta(query.page, query.pageSize, total),
    }
  },

  // REMOVED = take down. ARCHIVED = restore a removed listing; the seller then decides whether to republish.
  async setStatus(adminId: string, id: string, input: ProductStatusInput) {
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, title: true, status: true, sellerId: true },
    })
    if (!product) throw ApiError.notFound('Listing not found')

    const removing = input.status === 'REMOVED'
    if (removing && product.status === 'REMOVED') throw ApiError.conflict('This listing was already removed')
    if (!removing && product.status !== 'REMOVED') throw ApiError.conflict('Only removed listings can be restored')

    const title = product.title.slice(0, 80)
    await prisma.$transaction([
      prisma.product.update({ where: { id }, data: { status: input.status } }),
      auditService.create({
        actorId: adminId,
        action: removing ? 'listing.removed_by_moderator' : 'listing.restored_by_moderator',
        entityType: 'Product',
        entityId: id,
        metadata: { reason: input.reason, previousStatus: product.status },
      }),
      notificationService.create({
        userId: product.sellerId,
        type: removing ? 'LISTING_REMOVED' : 'LISTING_RESTORED',
        body: removing
          ? `Your listing "${title}" was removed by a moderator: ${input.reason.slice(0, 200)}`
          : `Your listing "${title}" was restored. You can republish it from My listings.`,
        link: '/dashboard/listings',
      }),
    ])
    return { id, status: input.status }
  },
}