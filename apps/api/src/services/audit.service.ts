import type { Prisma } from '@prisma/client'
import { prisma } from '../config/database.js'

export const auditService = {
  // Returns a lazy Prisma promise so it can be committed atomically inside prisma.$transaction([...])
  create: (entry: {
    actorId: string
    action: string
    entityType: string
    entityId?: string
    metadata?: Prisma.InputJsonValue
  }) => prisma.auditLog.create({ data: entry }),
}