import { prisma } from '../config/database.js'
import { ApiError } from '../utils/api-error.js'
import type { CreateReportInput } from '../validators/reports.validator.js'
import { publicName } from './product-dto.js'

const OPEN = ['PENDING', 'REVIEWING'] as ('PENDING' | 'REVIEWING')[]

export const reportsService = {
  async create(reporterId: string, input: CreateReportInput) {
    const details = input.details || null

    if (input.type === 'LISTING') {
      const product = await prisma.product.findFirst({
        where: { id: input.targetId, status: { in: ['ACTIVE', 'SOLD'] } },
        select: { id: true, sellerId: true },
      })
      if (!product) throw ApiError.notFound('Listing not found')
      if (product.sellerId === reporterId) throw ApiError.badRequest('You cannot report your own listing')
      if (await prisma.listingReport.findFirst({ where: { reporterId, productId: product.id, status: { in: OPEN } } })) {
        throw ApiError.conflict('You already reported this listing. We are reviewing it.')
      }
      const report = await prisma.listingReport.create({
        data: { productId: product.id, reporterId, reason: input.reason, details },
        select: { id: true, status: true },
      })
      return report
    }

    const target = await prisma.user.findUnique({ where: { id: input.targetId }, select: { id: true } })
    if (!target) throw ApiError.notFound('User not found')
    if (target.id === reporterId) throw ApiError.badRequest('You cannot report yourself')
    if (await prisma.listingReport.findFirst({ where: { reporterId, reportedUserId: target.id, status: { in: OPEN } } })) {
      throw ApiError.conflict('You already reported this user. We are reviewing it.')
    }
    return prisma.listingReport.create({
      data: { reportedUserId: target.id, reporterId, reason: input.reason, details },
      select: { id: true, status: true },
    })
  },

  async listMine(reporterId: string, limit = 50) {
    const rows = await prisma.listingReport.findMany({
      where: { reporterId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
      include: { product: { select: { title: true } }, reportedUser: { select: { fullName: true } } },
    })
    return rows.map((row) => ({
      id: row.id,
      type: row.productId ? ('LISTING' as const) : ('USER' as const),
      target: row.product?.title ?? (row.reportedUser ? publicName(row.reportedUser.fullName) : 'Unknown'),
      reason: row.reason,
      status: row.status,
      createdAt: row.createdAt,
    }))
  },
}