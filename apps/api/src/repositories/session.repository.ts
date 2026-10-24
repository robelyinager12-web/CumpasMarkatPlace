import { prisma } from '../config/database.js'

export const sessionRepository = {
  create: (data: { userId: string; tokenHash: string; expiresAt: Date; userAgent?: string; ip?: string }) =>
    prisma.session.create({ data }),
  findByTokenHash: (tokenHash: string) =>
    prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: { id: true, email: true, fullName: true, role: true, status: true, emailVerified: true },
        },
      },
    }),
  touch: (id: string) => prisma.session.update({ where: { id }, data: { lastUsedAt: new Date() } }),
  deleteByTokenHash: (tokenHash: string) => prisma.session.deleteMany({ where: { tokenHash } }),
  deleteAllForUser: (userId: string) => prisma.session.deleteMany({ where: { userId } }),
}