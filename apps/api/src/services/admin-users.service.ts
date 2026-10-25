import type { Prisma } from '@prisma/client'
import { prisma } from '../config/database.js'
import { ApiError } from '../utils/api-error.js'
import { buildMeta } from '../utils/pagination.js'
import type { UserListQuery, UserStatusInput } from '../validators/admin.validator.js'
import { auditService } from './audit.service.js'

const userSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  emailVerified: true,
  department: true,
  createdAt: true,
  university: { select: { name: true } },
  campus: { select: { name: true } },
  verification: { select: { status: true } },
  _count: { select: { products: true } },
} satisfies Prisma.UserSelect

export const adminUsersService = {
  async list(query: UserListQuery) {
    const where: Prisma.UserWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.role ? { role: query.role } : {}),
      ...(query.q
        ? {
            OR: [
              { fullName: { contains: query.q, mode: 'insensitive' as const } },
              { email: { contains: query.q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }
    const [rows, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: userSelect,
      }),
      prisma.user.count({ where }),
    ])

    return {
      users: rows.map((row) => ({
        id: row.id,
        fullName: row.fullName,
        email: row.email,
        phone: row.phone,
        role: row.role,
        status: row.status,
        emailVerified: row.emailVerified,
        department: row.department,
        createdAt: row.createdAt,
        university: row.university.name,
        campus: row.campus?.name ?? null,
        studentVerification: row.verification?.status ?? 'UNVERIFIED',
        listings: row._count.products,
      })),
      meta: buildMeta(query.page, query.pageSize, total),
    }
  },

  async setStatus(adminId: string, targetId: string, input: UserStatusInput) {
    if (adminId === targetId) throw ApiError.badRequest('You cannot change the status of your own account')

    const target = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true, role: true, status: true } })
    if (!target) throw ApiError.notFound('User not found')
    if (target.role === 'ADMIN') throw ApiError.forbidden('Administrator accounts cannot be suspended here')
    if (target.status === input.status) {
      throw ApiError.conflict(`This account is already ${input.status.toLowerCase()}`)
    }

    const suspending = input.status === 'SUSPENDED'
    const ops: Prisma.PrismaPromise<unknown>[] = [
      prisma.user.update({ where: { id: targetId }, data: { status: input.status } }),
      auditService.create({
        actorId: adminId,
        action: suspending ? 'user.suspended' : 'user.restored',
        entityType: 'User',
        entityId: targetId,
        metadata: { reason: input.reason ?? null },
      }),
    ]
    // Suspension signs the person out everywhere immediately
    if (suspending) ops.push(prisma.session.deleteMany({ where: { userId: targetId } }))

    await prisma.$transaction(ops)
    return { id: targetId, status: input.status }
  },
}