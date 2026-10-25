import type { ListingStatus, Prisma } from '@prisma/client'
import { prisma } from '../config/database.js'

export const productListInclude = {
  category: { select: { id: true, name: true, slug: true } },
  university: { select: { id: true, name: true } },
  campus: { select: { id: true, name: true } },
  images: { select: { url: true }, orderBy: [{ position: 'asc' }, { id: 'asc' }], take: 1 },
  _count: { select: { favorites: true } },
} satisfies Prisma.ProductInclude

export const productDetailInclude = {
  ...productListInclude,
  images: { select: { id: true, url: true }, orderBy: [{ position: 'asc' }, { id: 'asc' }] },
  seller: {
    select: {
      id: true,
      fullName: true,
      createdAt: true,
      status: true,
      verification: { select: { status: true } },
      university: { select: { name: true } },
    },
  },
} satisfies Prisma.ProductInclude

export type ProductListRow = Prisma.ProductGetPayload<{ include: typeof productListInclude }>
export type ProductDetailRow = Prisma.ProductGetPayload<{ include: typeof productDetailInclude }>

export const productRepository = {
  list: (where: Prisma.ProductWhereInput, orderBy: Prisma.ProductOrderByWithRelationInput[], skip: number, take: number) =>
    prisma.$transaction([
      prisma.product.findMany({ where, orderBy, skip, take, include: productListInclude }),
      prisma.product.count({ where }),
    ]),

  findDetail: (id: string) => prisma.product.findUnique({ where: { id }, include: productDetailInclude }),

  findForOwnerCheck: (id: string) =>
    prisma.product.findUnique({
      where: { id },
      select: { id: true, sellerId: true, status: true, universityId: true, _count: { select: { images: true } } },
    }),

  create: (data: Prisma.ProductUncheckedCreateInput) => prisma.product.create({ data, include: productListInclude }),

  update: (id: string, data: Prisma.ProductUncheckedUpdateInput) =>
    prisma.product.update({ where: { id }, data, include: productListInclude }),

  delete: (id: string) => prisma.product.delete({ where: { id } }),

  imagePublicIds: (productId: string) =>
    prisma.productImage.findMany({ where: { productId }, select: { publicId: true } }),

  listMine: (sellerId: string, status?: ListingStatus) =>
    prisma.product.findMany({
      where: { sellerId, ...(status ? { status } : {}) },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: productListInclude,
    }),

  // One view per viewer per product per 24 hours
  recordView: async (productId: string, viewerId: string) => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const existing = await prisma.listingView.findFirst({
      where: { productId, viewerId, createdAt: { gte: since } },
      select: { id: true },
    })
    if (!existing) await prisma.listingView.create({ data: { productId, viewerId } })
  },
}