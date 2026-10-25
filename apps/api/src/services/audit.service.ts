import type { Prisma } from '@prisma/client'
import { prisma } from '../config/database.js'
import { buildMeta } from '../utils/pagination.js'
import type { AuditQuery } from '../validators/admin.validator.js'

type Entry = {
  actorId: string
  action: string
  entityType: string
  entityId?: string
  metadata?: Prisma.InputJsonValue
}

const auditInclude = {
  actor: { select: { id: true, fullName: true, email: true } },
} satisfies Prisma.AuditLogInclude

type AuditRow = Prisma.AuditLogGetPayload<{ include: typeof auditInclude }>

const toDto = (row: AuditRow) => ({
  id: row.id,
  action: row.action,
  entityType: row.entityType,
  entityId: row.entityId,
  metadata: row.metadata,
  createdAt: row.createdAt,
  actor: { id: row.actor.id, name: row.actor.fullName, email: row.actor.email },
})

export const auditService = {
  // Unsent Prisma query: use inside prisma.$transaction([...]) so the log and the change succeed or fail together
  create: (entry: Entry) => prisma.auditLog.create({ data: entry }),

  // For interactive transactions: prisma.$transaction(async (tx) => { ... })
  record: (tx: Prisma.TransactionClient, entry: Entry) => tx.auditLog.create({ data: entry }),

  async recent(take = 10) {
    const rows = await prisma.auditLog.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
      include: auditInclude,
    })
    return rows.map(toDto)
  },

  async list(query: AuditQuery) {
    const where: Prisma.AuditLogWhereInput = {
      ...(query.action ? { action: { contains: query.action, mode: 'insensitive' as const } } : {}),
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(query.actorId ? { actorId: query.actorId } : {}),
    }
    const [rows, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: auditInclude,
      }),
      prisma.auditLog.count({ where }),
    ])
    return { logs: rows.map(toDto), meta: buildMeta(query.page, query.pageSize, total) }
  },
}