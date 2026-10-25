import { Prisma, type ListingStatus } from '@prisma/client'
import { storage } from '../config/storage.js'
import { categoryRepository } from '../repositories/category.repository.js'
import { favoriteRepository } from '../repositories/favorite.repository.js'
import { productRepository } from '../repositories/product.repository.js'
import { universityRepository } from '../repositories/university.repository.js'
import { userRepository } from '../repositories/user.repository.js'
import type { AuthUser } from '../types/auth-user.js'
import { ApiError } from '../utils/api-error.js'
import { buildMeta } from '../utils/pagination.js'
import type { CreateProductInput, ListProductsQuery, UpdateProductInput } from '../validators/products.validator.js'
import { toDetailDto, toListDto } from './product-dto.js'

const TRANSITIONS: Record<ListingStatus, ListingStatus[]> = {
  DRAFT: ['ACTIVE', 'ARCHIVED'],
  ACTIVE: ['SOLD', 'ARCHIVED'],
  SOLD: ['ACTIVE', 'ARCHIVED'],
  ARCHIVED: ['ACTIVE'],
  REMOVED: [],
}

const NO_FAVORITES: ReadonlySet<string> = new Set()

function buildWhere(query: ListProductsQuery): Prisma.ProductWhereInput {
  const words = query.q
    .split(' ')
    .filter(Boolean)
    .slice(0, 6)
    .map((word) => word.slice(0, 50))
  const now = new Date()
  const hasPrice = query.minPrice !== undefined || query.maxPrice !== undefined

  return {
    status: 'ACTIVE',
    ...(query.category ? { category: { slug: query.category } } : {}),
    ...(query.universityId ? { universityId: query.universityId } : {}),
    ...(query.campusId ? { campusId: query.campusId } : {}),
    ...(query.condition.length > 0 ? { condition: { in: query.condition } } : {}),
    ...(hasPrice
      ? {
          priceEtb: {
            ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
            ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
          },
        }
      : {}),
    ...(query.excludeId ? { id: { not: query.excludeId } } : {}),
    ...(query.featured ? { featured: { some: { startsAt: { lte: now }, endsAt: { gte: now } } } } : {}),
    // every word must appear in the title or the description
    ...(words.length > 0
      ? {
          AND: words.map((word) => ({
            OR: [
              { title: { contains: word, mode: 'insensitive' as const } },
              { description: { contains: word, mode: 'insensitive' as const } },
            ],
          })),
        }
      : {}),
  }
}

function buildOrderBy(sort: ListProductsQuery['sort']): Prisma.ProductOrderByWithRelationInput[] {
  if (sort === 'price_asc') return [{ priceEtb: 'asc' }, { id: 'asc' }]
  if (sort === 'price_desc') return [{ priceEtb: 'desc' }, { id: 'desc' }]
  return [{ createdAt: 'desc' }, { id: 'desc' }]
}

async function assertCampus(campusId: string, universityId: string) {
  const campus = await universityRepository.findCampus(campusId)
  if (!campus || campus.universityId !== universityId) {
    throw ApiError.badRequest('The selected campus does not belong to your university')
  }
}

async function assertCategory(categoryId: string) {
  if (!(await categoryRepository.findActiveById(categoryId))) {
    throw ApiError.badRequest('The selected category is not available')
  }
}

// Loads a listing the signed-in user owns, or throws. Hidden listings (draft/archived/removed)
// of other people look like "not found", visible ones answer "forbidden".
async function getOwned(userId: string, id: string) {
  const product = await productRepository.findForOwnerCheck(id)
  if (!product) throw ApiError.notFound('Listing not found')
  if (product.sellerId !== userId) {
    throw product.status === 'ACTIVE' || product.status === 'SOLD'
      ? ApiError.forbidden('You can only change your own listings')
      : ApiError.notFound('Listing not found')
  }
  return product
}

const removedError = () => new ApiError(403, 'LISTING_REMOVED', 'This listing was removed by a moderator')

export const productsService = {
  getOwned,

  async list(query: ListProductsQuery, viewerId?: string) {
    const [rows, total] = await productRepository.list(
      buildWhere(query),
      buildOrderBy(query.sort),
      (query.page - 1) * query.pageSize,
      query.pageSize,
    )
    const favorites = viewerId
      ? await favoriteRepository.idsAmong(viewerId, rows.map((row) => row.id))
      : NO_FAVORITES
    return { products: rows.map((row) => toListDto(row, favorites)), meta: buildMeta(query.page, query.pageSize, total) }
  },

  async getById(id: string, viewer?: AuthUser) {
    const row = await productRepository.findDetail(id)
    if (!row) throw ApiError.notFound('Listing not found')

    const isOwner = viewer?.id === row.sellerId
    const isPublic = row.status === 'ACTIVE' || row.status === 'SOLD'
    if (!isPublic && !isOwner && viewer?.role !== 'ADMIN') throw ApiError.notFound('Listing not found')

    const favorites = viewer ? await favoriteRepository.idsAmong(viewer.id, [row.id]) : NO_FAVORITES
    return { product: toDetailDto(row, favorites, isOwner), countView: isPublic && !isOwner }
  },

  recordView: (productId: string, viewerKey: string) => productRepository.recordView(productId, viewerKey),

  async listMine(userId: string, status?: ListingStatus) {
    const rows = await productRepository.listMine(userId, status)
    return rows.map((row) => toListDto(row, NO_FAVORITES))
  },

  async create(userId: string, input: CreateProductInput) {
    const user = await userRepository.findById(userId)
    if (!user) throw ApiError.unauthorized()
    await assertCategory(input.categoryId)

    const campusId = input.campusId === undefined ? (user.campus?.id ?? null) : input.campusId
    if (campusId) await assertCampus(campusId, user.university.id)

    const row = await productRepository.create({
      title: input.title,
      description: input.description,
      priceEtb: input.price,
      condition: input.condition,
      negotiable: input.negotiable,
      quantity: input.quantity,
      status: 'DRAFT',
      sellerId: userId,
      categoryId: input.categoryId,
      universityId: user.university.id, // always the seller's own university
      campusId,
    })
    return toListDto(row, NO_FAVORITES)
  },

  async update(userId: string, id: string, input: UpdateProductInput) {
    const product = await getOwned(userId, id)
    if (product.status === 'REMOVED') throw removedError()

    const data: Prisma.ProductUncheckedUpdateInput = {}
    if (input.title !== undefined) data.title = input.title
    if (input.description !== undefined) data.description = input.description
    if (input.price !== undefined) data.priceEtb = input.price
    if (input.condition !== undefined) data.condition = input.condition
    if (input.negotiable !== undefined) data.negotiable = input.negotiable
    if (input.quantity !== undefined) data.quantity = input.quantity

    if (input.categoryId !== undefined) {
      await assertCategory(input.categoryId)
      data.categoryId = input.categoryId
    }
    if (input.campusId !== undefined) {
      if (input.campusId) await assertCampus(input.campusId, product.universityId)
      data.campusId = input.campusId
    }

    if (input.status !== undefined && input.status !== product.status) {
      if (!TRANSITIONS[product.status].includes(input.status)) {
        throw ApiError.conflict(
          `A ${product.status.toLowerCase()} listing cannot be changed to ${input.status.toLowerCase()}`,
        )
      }
      if (input.status === 'ACTIVE' && product._count.images < 1) {
        throw ApiError.badRequest('Add at least one photo before publishing this listing')
      }
      data.status = input.status
    }

    const row = await productRepository.update(id, data)
    return toListDto(row, NO_FAVORITES)
  },

  async remove(userId: string, id: string) {
    const product = await getOwned(userId, id)
    if (product.status === 'REMOVED') throw removedError()

    const publicIds = (await productRepository.imagePublicIds(id))
      .map((image) => image.publicId)
      .filter((value): value is string => !!value)

    try {
      await productRepository.delete(id)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw ApiError.conflict('This listing has messages or reports, so it cannot be deleted. Archive it instead.')
      }
      throw error
    }
    await Promise.allSettled(publicIds.map((publicId) => storage.remove(publicId)))
  },
}