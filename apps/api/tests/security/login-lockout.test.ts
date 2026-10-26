import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../../src/app.js'
import { prisma } from '../../src/config/database.js'
import { hashToken } from '../../src/utils/tokens.js'
import { createTestUniversity, createUser, removeTestUniversity, uniqueEmail } from '../helpers.js'

let university: Awaited<ReturnType<typeof createTestUniversity>>

beforeAll(async () => {
  university = await createTestUniversity()
})

afterAll(async () => {
  await removeTestUniversity(university.id)
  await prisma.$disconnect()
})

const attempt = (email: string, password: string) => request(app).post('/api/v1/auth/login').send({ email, password })

describe('login lockout', () => {
  it('locks an account after 5 wrong passwords, even for the right password', async () => {
    const { email, password } = await createUser(university.id)
    for (let i = 0; i < 5; i++) expect((await attempt(email, 'Wrong-password1')).status).toBe(401)

    const locked = await attempt(email, password)
    expect(locked.status).toBe(429)
    expect(locked.body.error.code).toBe('TOO_MANY_ATTEMPTS')
    expect(locked.body.error.message).toMatch(/try again in \d+ minutes?/)
    expect(locked.headers['set-cookie']).toBeUndefined()
  })

  it('treats an email that does not exist exactly the same, so it reveals nothing', async () => {
    const ghost = uniqueEmail('ghost')
    for (let i = 0; i < 5; i++) expect((await attempt(ghost, 'Wrong-password1')).status).toBe(401)
    const locked = await attempt(ghost, 'Wrong-password1')
    expect(locked.status).toBe(429)
    expect(locked.body.error.code).toBe('TOO_MANY_ATTEMPTS')
  })

  it('does not affect other accounts, and a successful login resets the counter', async () => {
    const victim = await createUser(university.id)
    const bystander = await createUser(university.id)
    for (let i = 0; i < 4; i++) await attempt(victim.email, 'Wrong-password1')

    expect((await attempt(bystander.email, bystander.password)).status).toBe(200)
    expect((await attempt(victim.email, victim.password)).status).toBe(200) // 4 failures, then a success
    for (let i = 0; i < 4; i++) expect((await attempt(victim.email, 'Wrong-password1')).status).toBe(401) // counter started again
    expect((await attempt(victim.email, victim.password)).status).toBe(200)
  })

  it('unlocks when the lock time has passed', async () => {
    const { email, password } = await createUser(university.id)
    for (let i = 0; i < 5; i++) await attempt(email, 'Wrong-password1')
    expect((await attempt(email, password)).status).toBe(429)

    await prisma.loginThrottle.update({
      where: { key: hashToken(`throttle:login:${email}`) },
      data: { lockedUntil: new Date(Date.now() - 1000) },
    })
    expect((await attempt(email, password)).status).toBe(200)
  })

  it('stores a hash, never the email address', async () => {
    const email = `hash.${randomUUID().slice(0, 8)}@example.test`
    await attempt(email, 'Wrong-password1')
    const rows = await prisma.loginThrottle.findMany({ where: { key: hashToken(`throttle:login:${email}`) } })
    expect(rows).toHaveLength(1)
    expect(rows[0].key).not.toContain(email)
  })
})