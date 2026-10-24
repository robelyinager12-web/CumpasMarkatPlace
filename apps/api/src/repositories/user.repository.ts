import type { Prisma } from '@prisma/client'
import { prisma } from '../config/database.js'

export const userInclude = {
  university: { select: { id: true, name: true } },
  campus: { select: { id: true, name: true } },
  verification: { select: { status: true } },
} satisfies Prisma.UserInclude

export type UserWithRelations = Prisma.UserGetPayload<{ include: typeof userInclude }>

export const userRepository = {
  findByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),
  findByPhone: (phone: string) => prisma.user.findUnique({ where: { phone } }),
  findById: (id: string) => prisma.user.findUnique({ where: { id }, include: userInclude }),
  create: (data: Prisma.UserUncheckedCreateInput) => prisma.user.create({ data, include: userInclude }),
  update: (id: string, data: Prisma.UserUncheckedUpdateInput) =>
    prisma.user.update({ where: { id }, data, include: userInclude }),
}