import type { Prisma } from '@prisma/client'
import { prisma } from '../config/database.js'
import { ApiError } from '../utils/api-error.js'
import { buildMeta } from '../utils/pagination.js'
import type { CreateFeaturedInput, FeaturedListQuery } from '../validators/admin.validator.js'
import { auditService } from './audit.service.js'

const DAY_MS = 24 * 60 * 60 * 1000

const featuredInclude = {
  product: {
    select: {
      id: true,
      title: true,
      status: true,
      images: { select: { url: true }, orderBy: [{ position: 'asc' }, { id: 'asc' }], take: 1 },
      seller: { select: { fullName: true } },
    },
  },
} satisfies Prisma.FeaturedListingInclude

type FeaturedRow = Prisma.FeaturedListingGetPayload<{ include: typeof featuredInclude }>

const stateOf = (row: { startsAt: Date; endsAt: Date }, now: Date) =>
  row.endsAt < now ? ('ended' as const) : row.startsAt > now ? ('scheduled' as const) : ('active' as const)

const toDto = (row: FeaturedRow, now: Date) => ({
  id: row.id,
  productId: row.productId,
  startsAt: row.startsAt,
  endsAt: row.endsAt,
  state: stateOf(row, now),
  product: {
    id: row.product.id,
    title: row.product.title,
    status: row.product.status,
    image: row.product.images[0]?.url ?? null,
    sellerName: row.product.seller.fullName,
  },
})

export const adminFeaturedService = {
  async list(query: FeaturedListQuery) {
    const now = new Date()
    const where: Prisma.FeaturedListingWhereInput =
      query.state === 'active'
        ? { startsAt: { lte: now }, endsAt: { gte: now } }
        : query.state === 'scheduled'
          ? { startsAt: { gt: now } }
          : query.state === 'ended'
            ? { endsAt: { lt: now } }
            : {}

    const [rows, total] = await prisma.$transaction([
      prisma.featuredListing.findMany({
        where,
        orderBy: [{ endsAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: featuredInclude,
      }),
      prisma.featuredListing.count({ where }),
    ])
    return { featured: rows.map((row) => toDto(row, now)), meta: buildMeta(query.page, query.pageSize, total) }
  },

  async create(adminId: string, input: CreateFeaturedInput) {
    const product = await prisma.product.findUnique({
      where: { id: input.productId },
      select: { id: true, title: true, status: true },
    })
    if (!product) throw ApiError.notFound('Listing not found')
    if (product.status !== 'ACTIVE') throw ApiError.badRequest('Only active listings can be featured')

    const now = new Date()
    const startsAt = input.startsAt ?? now
    const endsAt = new Date(startsAt.getTime() + input.days * DAY_MS)
    if (endsAt <= now) throw ApiError.badRequest('The featured period has already ended')

    const overlap = await prisma.featuredListing.findFirst({
      where: { productId: product.id, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } },
      select: { id: true },
    })
    if (overlap) throw ApiError.conflict('This listing is already featured during that period')

    const created = await prisma.$transaction(async (tx) => {
      const row = await tx.featuredListing.create({
        data: { productId: product.id, startsAt, endsAt },
        include: featuredInclude,
      })
      await auditService.record(tx, {
        actorId: adminId,
        action: 'featured.created',
        entityType: 'FeaturedListing',
        entityId: row.id,
        metadata: { productId: product.id, startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() },
      })
      return row
    })
    return toDto(created, now)
  },

  async remove(adminId: string, id: string) {
    const row = await prisma.featuredListing.findUnique({ where: { id } })
    if (!row) throw ApiError.notFound('Featured listing not found')
    await prisma.$transaction([
      prisma.featuredListing.delete({ where: { id } }),
      auditService.create({
        actorId: adminId,
        action: 'featured.removed',
        entityType: 'FeaturedListing',
        entityId: id,
        metadata: { productId: row.productId },
      }),
    ])
  },
}