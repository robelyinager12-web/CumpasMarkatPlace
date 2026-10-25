import type { Prisma, ReportStatus } from '@prisma/client'
import { prisma } from '../config/database.js'
import { ApiError } from '../utils/api-error.js'
import type { ReviewReportInput } from '../validators/admin.validator.js'
import { auditService } from './audit.service.js'
import { notificationService } from './notification.service.js'

const ALLOWED: Record<ReportStatus, ReportStatus[]> = {
  PENDING: ['REVIEWING', 'RESOLVED', 'DISMISSED'],
  REVIEWING: ['RESOLVED', 'DISMISSED'],
  RESOLVED: [],
  DISMISSED: [],
}

export const adminReportsService = {
  list: (status: ReportStatus) =>
    prisma.listingReport.findMany({
      where: { status },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: 100,
      include: {
        reporter: { select: { id: true, fullName: true, email: true } },
        reportedUser: { select: { id: true, fullName: true, email: true } },
        product: {
          select: { id: true, title: true, status: true, seller: { select: { id: true, fullName: true } } },
        },
      },
    }),

  async review(adminId: string, reportId: string, input: ReviewReportInput) {
    const report = await prisma.listingReport.findUnique({
      where: { id: reportId },
      include: { product: { select: { id: true, title: true, status: true, sellerId: true } } },
    })
    if (!report) throw ApiError.notFound('Report not found')
    if (!ALLOWED[report.status].includes(input.status)) {
      throw ApiError.conflict(`A ${report.status.toLowerCase()} report cannot be changed to ${input.status.toLowerCase()}`)
    }
    if (input.removeListing) {
      if (!report.product) throw ApiError.badRequest('This report is not about a listing')
      if (report.product.status === 'REMOVED') throw ApiError.conflict('This listing was already removed')
    }

    const terminal = input.status === 'RESOLVED' || input.status === 'DISMISSED'
    const resolution = input.resolution || null
    const now = new Date()

    const ops: Prisma.PrismaPromise<unknown>[] = [
      prisma.listingReport.update({
        where: { id: reportId },
        data: { status: input.status, resolution, ...(terminal ? { resolvedBy: adminId, resolvedAt: now } : {}) },
      }),
      auditService.create({
        actorId: adminId,
        action: `report.${input.status.toLowerCase()}`,
        entityType: 'ListingReport',
        entityId: reportId,
        metadata: { resolution, removedListing: input.removeListing },
      }),
    ]

    if (input.removeListing && report.product) {
      ops.push(
        prisma.product.update({ where: { id: report.product.id }, data: { status: 'REMOVED' } }),
        auditService.create({
          actorId: adminId,
          action: 'listing.removed_by_moderator',
          entityType: 'Product',
          entityId: report.product.id,
          metadata: { reportId },
        }),
        notificationService.create({
          userId: report.product.sellerId,
          type: 'LISTING_REMOVED',
          body: `Your listing "${report.product.title.slice(0, 80)}" was removed because it broke the UniKamp rules.`,
          link: '/dashboard/listings',
        }),
      )
    }

    if (terminal) {
      ops.push(
        notificationService.create({
          userId: report.reporterId,
          type: 'REPORT_UPDATE',
          body:
            input.status === 'RESOLVED'
              ? 'We reviewed your report and took action where needed. Thank you for helping keep UniKamp safe.'
              : 'We reviewed your report and did not find a rule violation. Thank you for letting us know.',
          link: '/dashboard/reports',
        }),
      )
    }

    await prisma.$transaction(ops)
    return { id: reportId, status: input.status }
  },
}