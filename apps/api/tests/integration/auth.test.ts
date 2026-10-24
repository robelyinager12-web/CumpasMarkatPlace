import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { app } from '../../src/app.js'
import { prisma } from '../../src/config/database.js'
import {
  STRONG_PASSWORD,
  createTestUniversity,
  createUser,
  loginAgent,
  removeTestUniversity,
  uniqueEmail,
} from '../helpers.js'

const mail = vi.hoisted(() => ({
  verification: [] as { to: string; token: string }[],
  reset: [] as { to: string; token: string }[],
}))

vi.mock('../../src/services/email.service.js', () => ({
  sendVerificationEmail: async (to: string, _name: string, token: string) => {
    mail.verification.push({ to, token })
  },
  sendPasswordResetEmail: async (to: string, _name: string, token: string) => {
    mail.reset.push({ to, token })
  },
}))

let university: Awaited<ReturnType<typeof createTestUniversity>>

beforeAll(async () => {
  university = await createTestUniversity()
})

afterAll(async () => {
  await removeTestUniversity(university.id)
  await prisma.$disconnect()
})

const registerBody = (email: string) => ({
  fullName: 'Abebe Kebede',
  email,
  password: STRONG_PASSWORD,
  universityId: university.id,
  campusId: university.campuses[0].id,
})

describe('registration', () => {
  it('creates an account with an HttpOnly cookie and never exposes the password hash', async () => {
    const email = uniqueEmail('reg')
    const res = await request(app).post('/api/v1/auth/register').send(registerBody(email))

    expect(res.status).toBe(201)
    expect(res.body.data.user.email).toBe(email)
    expect(res.body.data.user.emailVerified).toBe(false)
    expect(res.body.data.user.studentVerification).toBe('UNVERIFIED')
    expect(JSON.stringify(res.body)).not.toContain('passwordHash')

    const cookies = (res.headers['set-cookie'] ?? []).join(';')
    expect(cookies).toContain('unikamp_session=')
    expect(cookies).toContain('HttpOnly')
  })

  it('ignores a role sent by the client (no privilege escalation)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...registerBody(uniqueEmail('role')), role: 'ADMIN' })
    expect(res.status).toBe(201)
    expect(res.body.data.user.role).toBe('STUDENT')
  })

  it('rejects a duplicate email', async () => {
    const email = uniqueEmail('dup')
    await request(app).post('/api/v1/auth/register').send(registerBody(email)).expect(201)
    const res = await request(app).post('/api/v1/auth/register').send(registerBody(email))
    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('CONFLICT')
  })

  it('rejects a weak password with field details', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...registerBody(uniqueEmail('weak')), password: 'onlyletters' })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
    expect(res.body.error.details[0].path).toBe('password')
  })

  it('rejects a campus from another university', async () => {
    const other = await createTestUniversity()
    try {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...registerBody(uniqueEmail('campus')), campusId: other.campuses[0].id })
      expect(res.status).toBe(400)
    } finally {
      await removeTestUniversity(other.id)
    }
  })
})

describe('login and sessions', () => {
  it('gives the same generic error for a wrong password and an unknown email', async () => {
    const { email } = await createUser(university.id)
    const wrongPassword = await request(app).post('/api/v1/auth/login').send({ email, password: 'Wrong1234' })
    const unknownEmail = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: uniqueEmail('ghost'), password: 'Wrong1234' })

    expect(wrongPassword.status).toBe(401)
    expect(unknownEmail.status).toBe(401)
    expect(wrongPassword.body.error.message).toBe(unknownEmail.body.error.message)
  })

  it('serves /me while logged in and rejects it after logout', async () => {
    const { email, password } = await createUser(university.id)
    const agent = await loginAgent(app, email, password)

    const me = await agent.get('/api/v1/auth/me')
    expect(me.status).toBe(200)
    expect(me.body.data.user.email).toBe(email)

    await agent.post('/api/v1/auth/logout').expect(200)
    expect((await agent.get('/api/v1/auth/me')).status).toBe(401)
  })

  it('rejects /me without a session cookie', async () => {
    expect((await request(app).get('/api/v1/auth/me')).status).toBe(401)
  })

  it('blocks suspended accounts at login and on existing sessions', async () => {
    const suspended = await createUser(university.id, { status: 'SUSPENDED' })
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: suspended.email, password: suspended.password })
    expect(login.status).toBe(403)
    expect(login.body.error.code).toBe('ACCOUNT_SUSPENDED')

    const active = await createUser(university.id)
    const agent = await loginAgent(app, active.email, active.password)
    await prisma.user.update({ where: { id: active.user.id }, data: { status: 'SUSPENDED' } })
    expect((await agent.get('/api/v1/auth/me')).status).toBe(403)
  })
})

describe('email verification', () => {
  it('verifies once and rejects reuse of the same link', async () => {
    const email = uniqueEmail('verify')
    const agent = request.agent(app)
    await agent.post('/api/v1/auth/register').send(registerBody(email)).expect(201)

    const token = mail.verification.filter((m) => m.to === email).at(-1)?.token
    expect(token).toBeDefined()

    await request(app).post('/api/v1/auth/verify-email').send({ token }).expect(200)
    expect((await agent.get('/api/v1/auth/me')).body.data.user.emailVerified).toBe(true)

    const reuse = await request(app).post('/api/v1/auth/verify-email').send({ token })
    expect(reuse.status).toBe(400)
  })

  it('rejects an unknown token', async () => {
    const res = await request(app).post('/api/v1/auth/verify-email').send({ token: 'x'.repeat(43) })
    expect(res.status).toBe(400)
  })
})

describe('password reset', () => {
  it('answers the same for unknown emails and sends nothing', async () => {
    const email = uniqueEmail('nobody')
    const res = await request(app).post('/api/v1/auth/forgot-password').send({ email })
    expect(res.status).toBe(200)
    expect(mail.reset.some((m) => m.to === email)).toBe(false)
  })

  it('resets the password, signs out other sessions and rejects the old password', async () => {
    const { email, password } = await createUser(university.id)
    const oldSession = await loginAgent(app, email, password)

    await request(app).post('/api/v1/auth/forgot-password').send({ email }).expect(200)
    await vi.waitFor(() => expect(mail.reset.some((m) => m.to === email)).toBe(true))
    const token = mail.reset.filter((m) => m.to === email).at(-1)?.token

    const weak = await request(app).post('/api/v1/auth/reset-password').send({ token, password: 'short' })
    expect(weak.status).toBe(400)

    const newPassword = 'Brand3NewPass'
    await request(app).post('/api/v1/auth/reset-password').send({ token, password: newPassword }).expect(200)

    expect((await oldSession.get('/api/v1/auth/me')).status).toBe(401)
    await request(app).post('/api/v1/auth/login').send({ email, password }).expect(401)
    await request(app).post('/api/v1/auth/login').send({ email, password: newPassword }).expect(200)

    const reuse = await request(app).post('/api/v1/auth/reset-password').send({ token, password: 'An0therPass1' })
    expect(reuse.status).toBe(400)
  })
})