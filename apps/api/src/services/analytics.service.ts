import { prisma } from '../config/database.js'
import { auditService } from './audit.service.js'

const DAY_MS = 24 * 60 * 60 * 1000

export const analyticsService = {
  async dashboard() {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * DAY_MS)

    const [
      totalUsers,
      suspendedUsers,
      verifiedStudents,
      pendingVerifications,
      activeListings,
      soldListings,
      pendingReports,
      reviewingReports,
      newUsers7d,
      newListings7d,
      activeFeatured,
      scheduledFeatured,
      recentActivity,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'SUSPENDED' } }),
      prisma.studentVerification.count({ where: { status: 'VERIFIED' } }),
      prisma.studentVerification.count({ where: { status: 'PENDING' } }),
      prisma.product.count({ where: { status: 'ACTIVE' } }),
      prisma.product.count({ where: { status: 'SOLD' } }),
      prisma.listingReport.count({ where: { status: 'PENDING' } }),
      prisma.listingReport.count({ where: { status: 'REVIEWING' } }),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.product.count({ where: { createdAt: { gte: weekAgo }, status: { not: 'DRAFT' } } }),
      prisma.featuredListing.count({ where: { startsAt: { lte: now }, endsAt: { gte: now } } }),
      prisma.featuredListing.count({ where: { startsAt: { gt: now } } }),
      auditService.recent(10),
    ])

    return {
      stats: {
        totalUsers,
        suspendedUsers,
        verifiedStudents,
        pendingVerifications,
        activeListings,
        soldListings,
        pendingReports,
        reviewingReports,
        newUsers7d,
        newListings7d,
      },
      promotions: { activeFeatured, scheduledFeatured },
      // Payments are not implemented, so no revenue is invented
      revenue: { available: false, note: 'Payments are not enabled yet, so there is no revenue to report.' },
      recentActivity,
    }
  },
}