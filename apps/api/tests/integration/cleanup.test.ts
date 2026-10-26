import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { prisma } from '../../src/config/database.js'
import { runCleanup } from '../../src/jobs/cleanup.js'
import { createTestUniversity, createUser, removeTestUniversity } from '../helpers.js'

const DAY = 24 * 60 * 60 * 1000
let university: Awaited<ReturnType<typeof createTestUniversity>>

beforeAll(async () => {
  university = await createTestUniversity()
})

afterAll(async () => {
  await removeTestUniversity(university.id)
  await prisma.$disconnect()
})

describe('cleanup job', () => {
  it('removes expired sessions, used or expired tokens and stale lock records, and keeps live ones', async () => {
    const { user } = await createUser(university.id)
    const id = randomUUID().slice(0, 8)
    const past = new Date(Date.now() - 2 * DAY)
    const future = new Date(Date.now() + DAY)

    await prisma.session.createMany({
      data: [
        { userId: user.id, tokenHash: `expired-${id}`, expiresAt: past },
        { userId: user.id, tokenHash: `live-${id}`, expiresAt: future },
      ],
    })
    await prisma.authToken.createMany({
      data: [
        { userId: user.id, type: 'EMAIL_VERIFICATION', tokenHash: `old-${id}`, expiresAt: past },
        { userId: user.id, type: 'PASSWORD_RESET', tokenHash: `used-${id}`, expiresAt: future, usedAt: past },
        { userId: user.id, type: 'PASSWORD_RESET', tokenHash: `fresh-${id}`, expiresAt: future },
      ],
    })
    await prisma.loginThrottle.createMany({ data: [{ key: `old-${id}`, failures: 2 }, { key: `fresh-${id}`, failures: 2 }] })
    await prisma.$executeRaw`UPDATE "LoginThrottle" SET "updatedAt" = ${past} WHERE "key" = ${`old-${id}`}`

    const result = await runCleanup()
    expect(result.sessions).toBeGreaterThanOrEqual(1)
    expect(result.tokens).toBeGreaterThanOrEqual(2)
    expect(result.throttles).toBeGreaterThanOrEqual(1)

    const sessions = (await prisma.session.findMany({ where: { userId: user.id } })).map((row) => row.tokenHash)
    expect(sessions).toEqual([`live-${id}`])
    const tokens = (await prisma.authToken.findMany({ where: { userId: user.id } })).map((row) => row.tokenHash)
    expect(tokens).toEqual([`fresh-${id}`])
    const keys = (await prisma.loginThrottle.findMany({ where: { key: { in: [`old-${id}`, `fresh-${id}`] } } })).map((row) => row.key)
    expect(keys).toEqual([`fresh-${id}`])
  })
})