import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../../src/app.js'
import { prisma } from '../../src/config/database.js'
import {
  createLoggedInUser,
  createProductRow,
  createTestCategory,
  createTestUniversity,
  removeTestCategory,
  removeTestUniversity,
} from '../helpers.js'

let university: Awaited<ReturnType<typeof createTestUniversity>>
let category: Awaited<ReturnType<typeof createTestCategory>>

beforeAll(async () => {
  university = await createTestUniversity()
  category = await createTestCategory()
})

afterAll(async () => {
  await removeTestCategory(category.id)
  await removeTestUniversity(university.id)
  await prisma.$disconnect()
})

const verified = (role: 'STUDENT' | 'ADMIN' = 'STUDENT') =>
  createLoggedInUser(app, university.id, { emailVerified: true, role })
const listing = (sellerId: string) => createProductRow(sellerId, university.id, category.id)

describe('reporting', () => {
  it('requires a session and a verified email', async () => {
    const seller = await verified()
    const product = await listing(seller.user.id)
    const body = { type: 'LISTING', targetId: product.id, reason: 'SCAM' }

    expect((await request(app).post('/api/v1/reports').send(body)).status).toBe(401)
    const unverified = await createLoggedInUser(app, university.id)
    expect((await unverified.agent.post('/api/v1/reports').send(body)).status).toBe(403)
  })

  it('validates input', async () => {
    const seller = await verified()
    const reporter = await verified()
    const product = await listing(seller.user.id)
    const send = (body: object) => reporter.agent.post('/api/v1/reports').send(body)

    expect((await send({ type: 'LISTING', targetId: product.id, reason: 'NOPE' })).status).toBe(400)
    expect((await send({ type: 'LISTING', targetId: product.id, reason: 'OTHER' })).status).toBe(400)
    expect((await send({ type: 'OTHER', targetId: product.id, reason: 'SCAM' })).status).toBe(400)
    expect((await send({ type: 'LISTING', reason: 'SCAM' })).status).toBe(400)
  })

  it('reports a listing once while it is open, and never your own', async () => {
    const seller = await verified()
    const reporter = await verified()
    const product = await listing(seller.user.id)
    const body = { type: 'LISTING', targetId: product.id, reason: 'SCAM', details: 'Asked me to pay in advance' }

    expect((await seller.agent.post('/api/v1/reports').send(body)).status).toBe(400)
    const created = await reporter.agent.post('/api/v1/reports').send(body)
    expect(created.status).toBe(201)
    expect(created.body.data.report.status).toBe('PENDING')
    expect((await reporter.agent.post('/api/v1/reports').send(body)).status).toBe(409)
    expect((await reporter.agent.post('/api/v1/reports').send({ ...body, targetId: 'missing' })).status).toBe(404)
  })

  it('reports a user, but not yourself', async () => {
    const seller = await verified()
    const reporter = await verified()
    const body = { type: 'USER', targetId: seller.user.id, reason: 'HARASSMENT', details: 'Keeps sending rude messages' }

    expect((await seller.agent.post('/api/v1/reports').send(body)).status).toBe(400)
    expect((await reporter.agent.post('/api/v1/reports').send({ ...body, targetId: 'missing' })).status).toBe(404)
    expect((await reporter.agent.post('/api/v1/reports').send(body)).status).toBe(201)
    expect((await reporter.agent.post('/api/v1/reports').send(body)).status).toBe(409)
  })

  it('shows people only their own report history', async () => {
    const seller = await verified()
    const reporter = await verified()
    const other = await verified()
    const product = await listing(seller.user.id)
    await reporter.agent.post('/api/v1/reports').send({ type: 'LISTING', targetId: product.id, reason: 'SPAM' }).expect(201)

    const mine = await reporter.agent.get('/api/v1/reports/mine')
    expect(mine.body.data.reports).toHaveLength(1)
    expect(mine.body.data.reports[0]).toMatchObject({ type: 'LISTING', reason: 'SPAM', status: 'PENDING' })
    expect((await other.agent.get('/api/v1/reports/mine')).body.data.reports).toHaveLength(0)
  })
})

describe('moderation', () => {
  it('keeps the queue away from students', async () => {
    const student = await verified()
    expect((await student.agent.get('/api/v1/admin/reports')).status).toBe(403)
    expect((await student.agent.patch('/api/v1/admin/reports/anything').send({ status: 'DISMISSED' })).status).toBe(403)
    expect((await request(app).get('/api/v1/admin/reports')).status).toBe(401)
  })

  it('removes a reported listing, tells both people and writes audit logs', async () => {
    const admin = await verified('ADMIN')
    const seller = await verified()
    const reporter = await verified()
    const product = await listing(seller.user.id)

    const created = await reporter.agent
      .post('/api/v1/reports')
      .send({ type: 'LISTING', targetId: product.id, reason: 'SCAM', details: 'Asked me to pay in advance' })
    const reportId = created.body.data.report.id as string

    const queue = await admin.agent.get('/api/v1/admin/reports?status=PENDING')
    expect(queue.body.data.reports.map((r: { id: string }) => r.id)).toContain(reportId)

    const review = await admin.agent
      .patch(`/api/v1/admin/reports/${reportId}`)
      .send({ status: 'RESOLVED', resolution: 'Scam confirmed', removeListing: true })
    expect(review.status).toBe(200)

    expect((await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).status).toBe('REMOVED')
    expect((await request(app).get(`/api/v1/products/${product.id}`)).status).toBe(404)
    const edit = await seller.agent.patch(`/api/v1/products/${product.id}`).send({ price: 5 })
    expect(edit.status).toBe(403)

    const reporterAlerts = await reporter.agent.get('/api/v1/notifications')
    expect(reporterAlerts.body.data.unreadCount).toBe(1)
    expect(reporterAlerts.body.data.notifications[0].type).toBe('REPORT_UPDATE')
    const sellerAlerts = await seller.agent.get('/api/v1/notifications')
    expect(sellerAlerts.body.data.notifications[0].type).toBe('LISTING_REMOVED')

    const actions = (await prisma.auditLog.findMany({ where: { actorId: admin.user.id } })).map((log) => log.action)
    expect(actions).toEqual(expect.arrayContaining(['report.resolved', 'listing.removed_by_moderator']))

    expect((await reporter.agent.get('/api/v1/reports/mine')).body.data.reports[0].status).toBe('RESOLVED')

    await reporter.agent.post('/api/v1/notifications/read-all').expect(200)
    expect((await reporter.agent.get('/api/v1/notifications/summary')).body.data.unreadNotifications).toBe(0)
  })

  it('dismisses without removing, and a finished report cannot be reviewed again', async () => {
    const admin = await verified('ADMIN')
    const seller = await verified()
    const reporter = await verified()
    const product = await listing(seller.user.id)
    const reportId = (
      await reporter.agent.post('/api/v1/reports').send({ type: 'LISTING', targetId: product.id, reason: 'MISLEADING' })
    ).body.data.report.id as string
    const url = `/api/v1/admin/reports/${reportId}`

    expect((await admin.agent.patch(url).send({ status: 'DISMISSED', removeListing: true })).status).toBe(400)
    expect((await admin.agent.patch(url).send({ status: 'REVIEWING' })).status).toBe(200)
    expect((await admin.agent.patch(url).send({ status: 'DISMISSED', resolution: 'No violation' })).status).toBe(200)
    expect((await admin.agent.patch(url).send({ status: 'RESOLVED' })).status).toBe(409)

    expect((await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).status).toBe('ACTIVE')
    expect((await request(app).get(`/api/v1/products/${product.id}`)).status).toBe(200)
  })

  it('cannot remove a listing for a report about a user', async () => {
    const admin = await verified('ADMIN')
    const target = await verified()
    const reporter = await verified()
    const reportId = (
      await reporter.agent
        .post('/api/v1/reports')
        .send({ type: 'USER', targetId: target.user.id, reason: 'SPAM' })
    ).body.data.report.id as string
    const res = await admin.agent.patch(`/api/v1/admin/reports/${reportId}`).send({ status: 'RESOLVED', removeListing: true })
    expect(res.status).toBe(400)
  })
})
