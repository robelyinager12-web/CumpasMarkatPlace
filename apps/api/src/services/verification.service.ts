import type { VerificationStatus } from '@prisma/client'
import { prisma } from '../config/database.js'
import { userRepository } from '../repositories/user.repository.js'
import { ApiError } from '../utils/api-error.js'
import { auditService } from './audit.service.js'

export const verificationService = {
  async request(userId: string, message?: string) {
    const user = await userRepository.findById(userId)
    if (!user) throw ApiError.unauthorized()
    if (!user.emailVerified) {
      throw new ApiError(403, 'EMAIL_NOT_VERIFIED', 'Verify your email before requesting student verification')
    }
    const status = user.verification?.status ?? 'UNVERIFIED'
    if (status === 'VERIFIED') throw ApiError.conflict('You are already a verified student')
    if (status === 'PENDING') throw ApiError.conflict('Your verification request is already pending')

    const now = new Date()
    const record = await prisma.studentVerification.upsert({
      where: { userId },
      update: { status: 'PENDING', requestNote: message || null, requestedAt: now, reviewedBy: null, reviewedAt: null, note: null },
      create: { userId, status: 'PENDING', requestNote: message || null, requestedAt: now },
    })
    return { status: record.status }
  },

  listByStatus: (status: VerificationStatus) =>
    prisma.studentVerification.findMany({
      where: { status },
      orderBy: { requestedAt: 'asc' },
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            department: true,
            createdAt: true,
            university: { select: { name: true } },
            campus: { select: { name: true } },
          },
        },
      },
    }),

  async review(adminId: string, targetUserId: string, input: { status: 'VERIFIED' | 'REJECTED'; note?: string }) {
    const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true } })
    if (!target) throw ApiError.notFound('User not found')

    const note = input.note || null
    const reviewedAt = new Date()
    const [record] = await prisma.$transaction([
      prisma.studentVerification.upsert({
        where: { userId: targetUserId },
        update: { status: input.status, note, reviewedBy: adminId, reviewedAt },
        create: { userId: targetUserId, status: input.status, note, reviewedBy: adminId, reviewedAt },
      }),
      auditService.create({
        actorId: adminId,
        action: `student_verification.${input.status.toLowerCase()}`,
        entityType: 'User',
        entityId: targetUserId,
        metadata: { note },
      }),
    ])
    return { userId: targetUserId, status: record.status }
  },
}