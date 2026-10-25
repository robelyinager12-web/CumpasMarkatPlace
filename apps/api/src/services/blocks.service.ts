import { prisma } from '../config/database.js'
import { ApiError } from '../utils/api-error.js'
import { publicName } from './product-dto.js'

export type BlockState = { byMe: boolean; byThem: boolean }

export const blocksService = {
  async between(userId: string, otherIds: string[]) {
    const states = new Map<string, BlockState>()
    if (otherIds.length === 0) return states

    const rows = await prisma.userBlock.findMany({
      where: {
        OR: [
          { blockerId: userId, blockedId: { in: otherIds } },
          { blockerId: { in: otherIds }, blockedId: userId },
        ],
      },
    })
    for (const row of rows) {
      const otherId = row.blockerId === userId ? row.blockedId : row.blockerId
      const state = states.get(otherId) ?? { byMe: false, byThem: false }
      if (row.blockerId === userId) state.byMe = true
      else state.byThem = true
      states.set(otherId, state)
    }
    return states
  },

  // The blocked person is never told they were blocked
  async assertCanMessage(senderId: string, recipientId: string) {
    const state = (await blocksService.between(senderId, [recipientId])).get(recipientId)
    if (state?.byMe) {
      throw new ApiError(403, 'BLOCKED_BY_YOU', 'You blocked this person. Unblock them to send messages.')
    }
    if (state?.byThem) {
      throw new ApiError(403, 'CONVERSATION_UNAVAILABLE', 'This conversation is no longer available.')
    }
  },

  async list(userId: string) {
    const rows = await prisma.userBlock.findMany({
      where: { blockerId: userId },
      orderBy: { createdAt: 'desc' },
      include: { blocked: { select: { id: true, fullName: true } } },
    })
    return rows.map((row) => ({ userId: row.blocked.id, name: publicName(row.blocked.fullName), blockedAt: row.createdAt }))
  },

  async block(userId: string, targetId: string) {
    if (userId === targetId) throw ApiError.badRequest('You cannot block yourself')
    const target = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true } })
    if (!target) throw ApiError.notFound('User not found')
    await prisma.userBlock.upsert({
      where: { blockerId_blockedId: { blockerId: userId, blockedId: targetId } },
      update: {},
      create: { blockerId: userId, blockedId: targetId },
    })
  },

  async unblock(userId: string, targetId: string) {
    await prisma.userBlock.deleteMany({ where: { blockerId: userId, blockedId: targetId } })
  },
}