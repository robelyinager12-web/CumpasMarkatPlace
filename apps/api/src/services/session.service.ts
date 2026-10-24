import { SESSION_TTL_MS } from '../config/session.js'
import { sessionRepository } from '../repositories/session.repository.js'
import { generateToken, hashToken } from '../utils/tokens.js'

const TOUCH_AFTER_MS = 15 * 60 * 1000

export const sessionService = {
  async create(userId: string, meta: { ip?: string; userAgent?: string }) {
    const token = generateToken()
    await sessionRepository.create({
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      ip: meta.ip,
      userAgent: meta.userAgent,
    })
    return token
  },

  async findValid(token: string) {
    const session = await sessionRepository.findByTokenHash(hashToken(token))
    if (!session) return null
    if (session.expiresAt.getTime() <= Date.now()) {
      await sessionRepository.deleteByTokenHash(session.tokenHash)
      return null
    }
    if (Date.now() - session.lastUsedAt.getTime() > TOUCH_AFTER_MS) {
      await sessionRepository.touch(session.id).catch(() => undefined)
    }
    return session
  },

  destroy: (token: string) => sessionRepository.deleteByTokenHash(hashToken(token)),
  destroyAllForUser: (userId: string) => sessionRepository.deleteAllForUser(userId),
}