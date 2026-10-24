import type { AuthTokenType } from '@prisma/client'
import { prisma } from '../config/database.js'

export const authTokenRepository = {
  create: (data: { userId: string; type: AuthTokenType; tokenHash: string; expiresAt: Date }) =>
    prisma.authToken.create({ data }),
  findUsable: (tokenHash: string, type: AuthTokenType) =>
    prisma.authToken.findFirst({
      where: { tokenHash, type, usedAt: null, expiresAt: { gt: new Date() } },
    }),
  // Atomic: only one request can ever consume a token
  markUsed: async (id: string) =>
    (await prisma.authToken.updateMany({ where: { id, usedAt: null }, data: { usedAt: new Date() } })).count === 1,
  deleteForUser: (userId: string, type: AuthTokenType) => prisma.authToken.deleteMany({ where: { userId, type } }),
}