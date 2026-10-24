import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../../src/app.js'
import { prisma } from '../../src/config/database.js'
import { createTestUniversity, createUser, loginAgent, removeTestUniversity } from '../helpers.js'

let university: Awaited<ReturnType<typeof createTestUniversity>>

beforeAll(async () => {
  university = await createTestUniversity()
})

afterAll(async () => {
  await removeTestUniversity(university.id)
  await prisma.$disconnect()
})

describe('admin routes', () => {
  it('require a session', async () => {
    expect((await request(app).get('/api/v1/admin/verifications')).status).toBe(401)
  })

  it('are forbidden for students', async () => {
    const student = await createUser(university.id)
    const agent = await loginAgent(app, student.email, student.password)
    expect((await agent.get('/api/v1/admin/verifications')).status).toBe(403)
    const review = await agent
      .patch(`/api/v1/admin/verifications/${student.user.id}`)
      .send({ status: 'VERIFIED' })
    expect(review.status).toBe(403)
  })

  it('work for administrators', async () => {
    const admin = await createUser(university.id, { role: 'ADMIN' })
    const agent = await loginAgent(app, admin.email, admin.password)
    expect((await agent.get('/api/v1/admin/verifications')).status).toBe(200)
  })
})

describe('student verification', () => {
  it('needs a verified email, then goes request -> pending -> admin approval, with an audit log', async () => {
    const student = await createUser(university.id)
    const studentAgent = await loginAgent(app, student.email, student.password)

    const early = await studentAgent.post('/api/v1/auth/student-verification').send({})
    expect(early.status).toBe(403)
    expect(early.body.error.code).toBe('EMAIL_NOT_VERIFIED')

    await prisma.user.update({ where: { id: student.user.id }, data: { emailVerified: true } })
    const requested = await studentAgent.post('/api/v1/auth/student-verification').send({ message: 'Year 2, Computer Science' })
    expect(requested.status).toBe(200)
    expect(requested.body.data.status).toBe('PENDING')

    expect((await studentAgent.post('/api/v1/auth/student-verification').send({})).status).toBe(409)
    expect((await studentAgent.get('/api/v1/auth/me')).body.data.user.studentVerification).toBe('PENDING')

    const admin = await createUser(university.id, { role: 'ADMIN' })
    const adminAgent = await loginAgent(app, admin.email, admin.password)
    const pending = await adminAgent.get('/api/v1/admin/verifications?status=PENDING')
    expect(pending.body.data.verifications.some((v: { userId: string }) => v.userId === student.user.id)).toBe(true)

    await adminAgent
      .patch(`/api/v1/admin/verifications/${student.user.id}`)
      .send({ status: 'VERIFIED', note: 'Checked at the registrar' })
      .expect(200)

    expect((await studentAgent.get('/api/v1/auth/me')).body.data.user.studentVerification).toBe('VERIFIED')
    const audit = await prisma.auditLog.findFirst({
      where: { actorId: admin.user.id, action: 'student_verification.verified', entityId: student.user.id },
    })
    expect(audit).not.toBeNull()
  })
})

describe('profile updates', () => {
  it('cannot change the role or other protected fields', async () => {
    const student = await createUser(university.id)
    const agent = await loginAgent(app, student.email, student.password)

    const res = await agent.patch('/api/v1/auth/me').send({ fullName: 'New Name', role: 'ADMIN', emailVerified: true })
    expect(res.status).toBe(200)
    expect(res.body.data.user.fullName).toBe('New Name')
    expect(res.body.data.user.role).toBe('STUDENT')
    expect(res.body.data.user.emailVerified).toBe(false)

    const onlyProtected = await agent.patch('/api/v1/auth/me').send({ role: 'ADMIN' })
    expect(onlyProtected.status).toBe(400)
  })

  it('requires a session', async () => {
    expect((await request(app).patch('/api/v1/auth/me').send({ fullName: 'Nobody' })).status).toBe(401)
  })
})

describe('cross-site requests', () => {
  it('rejects state-changing requests from an untrusted origin', async () => {
    const res = await request(app).post('/api/v1/auth/logout').set('Origin', 'https://evil.example')
    expect(res.status).toBe(403)
  })

  it('accepts the configured frontend origin', async () => {
    const res = await request(app).post('/api/v1/auth/logout').set('Origin', 'http://localhost:3000')
    expect(res.status).toBe(200)
  })
})