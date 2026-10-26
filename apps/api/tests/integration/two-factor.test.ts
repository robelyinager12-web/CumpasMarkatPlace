import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../../src/app.js'
import { prisma } from '../../src/config/database.js'
import { base32Decode, totpAt } from '../../src/utils/totp.js'
import { createLoggedInUser, createTestUniversity, removeTestUniversity } from '../helpers.js'

let university: Awaited<ReturnType<typeof createTestUniversity>>

beforeAll(async () => {
  university = await createTestUniversity()
})

afterAll(async () => {
  await removeTestUniversity(university.id)
  await prisma.$disconnect()
})

type LoggedIn = Awaited<ReturnType<typeof createLoggedInUser>>

const codeFor = (secret: string) => totpAt(base32Decode(secret), Date.now())

async function enrol(user: LoggedIn) {
  const setup = await user.agent.post('/api/v1/auth/2fa/setup').expect(200)
  const secret = setup.body.data.secret as string
  const enabled = await user.agent.post('/api/v1/auth/2fa/enable').send({ code: codeFor(secret) })
  return { secret, setup, enabled }
}

const login = (user: LoggedIn, code?: string) =>
  request(app).post('/api/v1/auth/login').send({ email: user.email, password: user.password, ...(code ? { code } : {}) })

describe('two-factor setup', () => {
  it('needs a session', async () => {
    expect((await request(app).post('/api/v1/auth/2fa/setup')).status).toBe(401)
    expect((await request(app).post('/api/v1/auth/2fa/enable').send({ code: '123456' })).status).toBe(401)
  })

  it('stores the secret encrypted, turns on only with a correct code, and hands out recovery codes once', async () => {
    const user = await createLoggedInUser(app, university.id)
    const setup = await user.agent.post('/api/v1/auth/2fa/setup').expect(200)
    const secret = setup.body.data.secret as string
    expect(setup.body.data.otpauthUrl).toMatch(/^otpauth:\/\/totp\//)

    const stored = await prisma.user.findUniqueOrThrow({ where: { id: user.user.id } })
    expect(stored.totpEnabled).toBe(false)
    expect(stored.totpSecret).toBeTruthy()
    expect(stored.totpSecret).not.toContain(secret)

    const wrong = await user.agent.post('/api/v1/auth/2fa/enable').send({ code: '000000' })
    expect(wrong.status).toBe(400)
    expect(wrong.body.error.code).toBe('INVALID_CODE')

    const enabled = await user.agent.post('/api/v1/auth/2fa/enable').send({ code: codeFor(secret) })
    expect(enabled.status).toBe(200)
    const codes = enabled.body.data.recoveryCodes as string[]
    expect(codes).toHaveLength(8)
    expect(codes.every((code) => /^[0-9a-f]{6}-[0-9a-f]{6}$/.test(code))).toBe(true)

    const after = await prisma.user.findUniqueOrThrow({ where: { id: user.user.id } })
    expect(after.totpEnabled).toBe(true)
    expect(after.recoveryCodeHashes).toHaveLength(8)
    expect(after.recoveryCodeHashes.some((hash) => codes.some((code) => hash.includes(code)))).toBe(false)

    expect((await user.agent.get('/api/v1/auth/me')).body.data.user.twoFactorEnabled).toBe(true)
    expect((await user.agent.post('/api/v1/auth/2fa/setup')).status).toBe(409)
  })
})

describe('signing in with two-factor', () => {
  it('asks for a code without giving a session, and rejects wrong codes', async () => {
    const user = await createLoggedInUser(app, university.id)
    const { secret } = await enrol(user)

    const first = await login(user)
    expect(first.status).toBe(200)
    expect(first.body.data).toEqual({ twoFactorRequired: true })
    expect(first.headers['set-cookie']).toBeUndefined()

    const wrong = await login(user, '000000')
    expect(wrong.status).toBe(401)
    expect(wrong.body.error.code).toBe('INVALID_CODE')
    expect(wrong.headers['set-cookie']).toBeUndefined()

    const right = await login(user, codeFor(secret))
    expect(right.status).toBe(200)
    expect(right.body.data.user.email).toBe(user.email)
    expect((right.headers['set-cookie'] ?? []).join(';')).toContain('unikamp_session=')
  })

  it('does not accept a code when the password is wrong', async () => {
    const user = await createLoggedInUser(app, university.id)
    const { secret } = await enrol(user)
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: 'Wrong-password1', code: codeFor(secret) })
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS')
  })

  it('lets a recovery code in exactly once', async () => {
    const user = await createLoggedInUser(app, university.id)
    const { enabled } = await enrol(user)
    const [first, second] = enabled.body.data.recoveryCodes as string[]

    expect((await login(user, first)).status).toBe(200)
    const reused = await login(user, first)
    expect(reused.status).toBe(401)
    expect(reused.body.error.code).toBe('INVALID_CODE')
    expect((await login(user, second.toUpperCase().replace('-', ' '))).status).toBe(200) // spacing and case are forgiven
    expect((await prisma.user.findUniqueOrThrow({ where: { id: user.user.id } })).recoveryCodeHashes).toHaveLength(6)
  })
})

describe('managing two-factor', () => {
  it('replaces recovery codes only with the password and a code', async () => {
    const user = await createLoggedInUser(app, university.id)
    const { secret, enabled } = await enrol(user)
    const [oldCode] = enabled.body.data.recoveryCodes as string[]

    const wrongPassword = await user.agent
      .post('/api/v1/auth/2fa/recovery-codes')
      .send({ password: 'Wrong-password1', code: codeFor(secret) })
    expect(wrongPassword.status).toBe(400)
    expect(wrongPassword.body.error.code).toBe('INVALID_PASSWORD')

    const fresh = await user.agent
      .post('/api/v1/auth/2fa/recovery-codes')
      .send({ password: user.password, code: codeFor(secret) })
    expect(fresh.status).toBe(200)
    expect(fresh.body.data.recoveryCodes).toHaveLength(8)

    expect((await login(user, oldCode)).status).toBe(401)
    expect((await login(user, (fresh.body.data.recoveryCodes as string[])[0])).status).toBe(200)
  })

  it('turns off with the password and a code, and sign-in then needs no code', async () => {
    const user = await createLoggedInUser(app, university.id)
    const { secret } = await enrol(user)

    expect((await user.agent.post('/api/v1/auth/2fa/disable').send({ password: user.password, code: '000000' })).status).toBe(400)
    const off = await user.agent.post('/api/v1/auth/2fa/disable').send({ password: user.password, code: codeFor(secret) })
    expect(off.status).toBe(200)

    const stored = await prisma.user.findUniqueOrThrow({ where: { id: user.user.id } })
    expect(stored).toMatchObject({ totpEnabled: false, totpSecret: null, recoveryCodeHashes: [] })
    expect((await login(user)).body.data.user.email).toBe(user.email)
  })

  it('throttles repeated wrong codes', async () => {
    const user = await createLoggedInUser(app, university.id)
    const { secret } = await enrol(user)

    for (let i = 0; i < 5; i++) {
      const res = await user.agent.post('/api/v1/auth/2fa/disable').send({ password: user.password, code: '000000' })
      expect(res.status).toBe(400)
    }
    const locked = await user.agent.post('/api/v1/auth/2fa/disable').send({ password: user.password, code: codeFor(secret) })
    expect(locked.status).toBe(429)
    expect(locked.body.error.code).toBe('TOO_MANY_ATTEMPTS')
  })
})