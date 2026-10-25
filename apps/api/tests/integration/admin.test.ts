import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../../src/app.js'
import { prisma } from '../../src/config/database.js'
import {
  STRONG_PASSWORD,
  createLoggedInUser,
  createProductRow,
  createTestCategory,
  createTestUniversity,
  createUser,
  removeTestCategory,
  removeTestUniversity,
} from '../helpers.js'

const PREFIX = `adm-${randomUUID().slice(0, 6)}`
const A = '/api/v1/admin'

let university: Awaited<ReturnType<typeof createTestUniversity>>
let category: Awaited<ReturnType<typeof createTestCategory>>

beforeAll(async () => {
  university = await createTestUniversity()
  category = await createTestCategory()
})

afterAll(async () => {
  await removeTestUniversity(university.id)
  await removeTestCategory(category.id)
  await prisma.category.deleteMany({ where: { slug: { startsWith: PREFIX } } })
  await prisma.campus.deleteMany({ where: { university: { name: { startsWith: PREFIX } } } })
  await prisma.university.deleteMany({ where: { name: { startsWith: PREFIX } } })
  await prisma.$disconnect()
})

const admin = () => createLoggedInUser(app, university.id, { role: 'ADMIN', emailVerified: true })
const student = () => createLoggedInUser(app, university.id, { emailVerified: true })
const listing = (sellerId: string, over: Parameters<typeof createProductRow>[3] = {}) =>
  createProductRow(sellerId, university.id, category.id, over)
const publicSearch = (title: string, extra = '') =>
  request(app).get(`/api/v1/products?universityId=${university.id}&q=${encodeURIComponent(title)}${extra}`)
const ids = (res: request.Response, key: string) => res.body.data[key].map((item: { id: string }) => item.id)

describe('dashboard', () => {
  it('returns real counts and says plainly that revenue is not available', async () => {
    const a = await admin()
    const target = await student()
    await prisma.studentVerification.update({ where: { userId: target.user.id }, data: { status: 'VERIFIED' } })
    await listing(target.user.id)

    const res = await a.agent.get(`${A}/dashboard`)
    expect(res.status).toBe(200)
    const { stats, promotions, revenue, recentActivity } = res.body.data

    for (const key of [
      'totalUsers', 'suspendedUsers', 'verifiedStudents', 'pendingVerifications', 'activeListings',
      'soldListings', 'pendingReports', 'reviewingReports', 'newUsers7d', 'newListings7d',
    ]) {
      expect(typeof stats[key], key).toBe('number')
    }
    expect(stats.totalUsers).toBeGreaterThanOrEqual(2)
    expect(stats.verifiedStudents).toBeGreaterThanOrEqual(1)
    expect(stats.activeListings).toBeGreaterThanOrEqual(1)
    expect(typeof promotions.activeFeatured).toBe('number')
    expect(revenue.available).toBe(false)
    expect(Array.isArray(recentActivity)).toBe(true)
  })
})

describe('user management', () => {
  it('lists and searches users without exposing secrets', async () => {
    const a = await admin()
    const target = await student()

    const res = await a.agent.get(`${A}/users?q=${encodeURIComponent(target.email)}`)
    expect(res.status).toBe(200)
    expect(res.body.data.users).toHaveLength(1)
    expect(res.body.data.users[0]).toMatchObject({
      id: target.user.id,
      email: target.email,
      role: 'STUDENT',
      status: 'ACTIVE',
      emailVerified: true,
      studentVerification: 'UNVERIFIED',
    })
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|tokenHash/)

    const suspendedOnly = await a.agent.get(`${A}/users?status=SUSPENDED&q=${encodeURIComponent(target.email)}`)
    expect(suspendedOnly.body.data.users).toHaveLength(0)
    expect(res.body.meta.total).toBe(1)
  })

  it('needs a reason, and refuses to suspend yourself, another admin or someone twice', async () => {
    const a = await admin()
    const otherAdmin = await admin()
    const target = await student()
    const url = (id: string) => `${A}/users/${id}/status`

    expect((await a.agent.patch(url(target.user.id)).send({ status: 'SUSPENDED' })).status).toBe(400)
    expect((await a.agent.patch(url(target.user.id)).send({ status: 'SUSPENDED', reason: 'bad' })).status).toBe(400)
    expect((await a.agent.patch(url(a.user.id)).send({ status: 'SUSPENDED', reason: 'Testing myself' })).status).toBe(400)
    expect((await a.agent.patch(url(otherAdmin.user.id)).send({ status: 'SUSPENDED', reason: 'Testing admins' })).status).toBe(403)
    expect((await a.agent.patch(url('missing')).send({ status: 'SUSPENDED', reason: 'Testing missing' })).status).toBe(404)

    await a.agent.patch(url(target.user.id)).send({ status: 'SUSPENDED', reason: 'Repeated scam reports' }).expect(200)
    expect((await a.agent.patch(url(target.user.id)).send({ status: 'SUSPENDED', reason: 'Repeated scam reports' })).status).toBe(409)
    expect((await a.agent.patch(url(a.user.id)).send({ status: 'ACTIVE' })).status).toBe(400)
  })

  it('suspending signs the person out, blocks login, hides their listings and is logged; restoring reverses it', async () => {
    const a = await admin()
    const target = await student()
    const title = `Hidden ${PREFIX}`
    const product = await listing(target.user.id, { title })
    expect((await publicSearch(title)).body.data.products).toHaveLength(1)

    const url = `${A}/users/${target.user.id}/status`
    await a.agent.patch(url).send({ status: 'SUSPENDED', reason: 'Repeated scam reports' }).expect(200)

    expect((await target.agent.get('/api/v1/auth/me')).status).toBe(401)
    const login = await request(app).post('/api/v1/auth/login').send({ email: target.email, password: STRONG_PASSWORD })
    expect(login.status).toBe(403)
    expect(login.body.error.code).toBe('ACCOUNT_SUSPENDED')

    expect((await publicSearch(title)).body.data.products).toHaveLength(0)
    expect((await request(app).get(`/api/v1/products/${product.id}`)).status).toBe(404)
    expect((await a.agent.get(`/api/v1/products/${product.id}`)).status).toBe(200) // moderators can still look

    const audit = await prisma.auditLog.findFirst({
      where: { actorId: a.user.id, action: 'user.suspended', entityId: target.user.id },
    })
    expect(audit?.metadata).toMatchObject({ reason: 'Repeated scam reports' })

    await a.agent.patch(url).send({ status: 'ACTIVE' }).expect(200)
    expect((await publicSearch(title)).body.data.products).toHaveLength(1)
    await request(app).post('/api/v1/auth/login').send({ email: target.email, password: STRONG_PASSWORD }).expect(200)
    expect(await prisma.auditLog.count({ where: { actorId: a.user.id, action: 'user.restored' } })).toBe(1)
  })
})

describe('listing moderation', () => {
  it('lists and searches listings with seller details', async () => {
    const a = await admin()
    const seller = await student()
    const title = `Searchable ${PREFIX}`
    const product = await listing(seller.user.id, { title })

    const res = await a.agent.get(`${A}/products?q=${encodeURIComponent(title)}&status=ACTIVE`)
    expect(res.status).toBe(200)
    expect(ids(res, 'products')).toEqual([product.id])
    expect(res.body.data.products[0]).toMatchObject({ title, status: 'ACTIVE', seller: { id: seller.user.id, email: seller.email } })
    expect((await a.agent.get(`${A}/products?q=${encodeURIComponent(title)}&status=SOLD`)).body.data.products).toHaveLength(0)
  })

  it('removes with a reason, tells the seller, restores to archived and logs every step', async () => {
    const a = await admin()
    const seller = await student()
    const title = `Moderated ${PREFIX}`
    const product = await listing(seller.user.id, { title })
    const url = `${A}/products/${product.id}/status`

    expect((await a.agent.patch(url).send({ status: 'REMOVED' })).status).toBe(400)
    expect((await a.agent.patch(url).send({ status: 'ACTIVE', reason: 'Because I can' })).status).toBe(400)
    expect((await a.agent.patch(url).send({ status: 'ARCHIVED', reason: 'Not removed yet' })).status).toBe(409)

    await a.agent.patch(url).send({ status: 'REMOVED', reason: 'Prohibited item' }).expect(200)
    expect((await a.agent.patch(url).send({ status: 'REMOVED', reason: 'Prohibited item' })).status).toBe(409)
    expect((await request(app).get(`/api/v1/products/${product.id}`)).status).toBe(404)
    expect((await publicSearch(title)).body.data.products).toHaveLength(0)
    expect((await seller.agent.patch(`/api/v1/products/${product.id}`).send({ price: 5 })).status).toBe(403)

    const alerts = (await seller.agent.get('/api/v1/notifications')).body.data.notifications
    expect(alerts[0].type).toBe('LISTING_REMOVED')
    expect(alerts[0].body).toContain('Prohibited item')

    await a.agent.patch(url).send({ status: 'ARCHIVED', reason: 'Appeal accepted' }).expect(200)
    expect((await publicSearch(title)).body.data.products).toHaveLength(0) // archived, not live yet
    await seller.agent.patch(`/api/v1/products/${product.id}`).send({ status: 'ACTIVE' }).expect(200)
    expect((await publicSearch(title)).body.data.products).toHaveLength(1)

    const actions = (await prisma.auditLog.findMany({ where: { actorId: a.user.id, entityId: product.id } })).map((log) => log.action)
    expect(actions).toEqual(expect.arrayContaining(['listing.removed_by_moderator', 'listing.restored_by_moderator']))
  })
})

describe('category management', () => {
  it('creates, rejects duplicates, and needs a slug for non-Latin names', async () => {
    const a = await admin()
    const created = await a.agent.post(`${A}/categories`).send({ name: `${PREFIX} Alpha` })
    expect(created.status).toBe(201)
    expect(created.body.data.category).toMatchObject({ slug: `${PREFIX}-alpha`, isActive: true, listings: 0 })

    expect((await a.agent.post(`${A}/categories`).send({ name: `${PREFIX} Alpha` })).status).toBe(409)
    expect((await a.agent.post(`${A}/categories`).send({ name: `${PREFIX} Other`, slug: `${PREFIX}-alpha` })).status).toBe(409)
    expect((await a.agent.post(`${A}/categories`).send({ name: 'መጽሐፍት' })).status).toBe(400)
    const amharic = await a.agent.post(`${A}/categories`).send({ name: `መጽሐፍት ${PREFIX}`, slug: `${PREFIX}-books` })
    expect(amharic.status).toBe(201)
  })

  it('deactivating hides a category from the public list and from new listings', async () => {
    const a = await admin()
    const seller = await student()
    const id = (await a.agent.post(`${A}/categories`).send({ name: `${PREFIX} Beta` })).body.data.category.id as string

    const publicIds = async () =>
      (await request(app).get('/api/v1/categories')).body.data.categories.map((c: { id: string }) => c.id)
    expect(await publicIds()).toContain(id)

    await a.agent.patch(`${A}/categories/${id}`).send({ isActive: false }).expect(200)
    expect(await publicIds()).not.toContain(id)
    const adminList = (await a.agent.get(`${A}/categories`)).body.data.categories
    expect(adminList.find((c: { id: string }) => c.id === id).isActive).toBe(false)

    const body = {
      title: 'Textbook for sale',
      description: 'Good condition, a few notes in the margin.',
      categoryId: id,
      price: 100,
      condition: 'GOOD',
    }
    expect((await seller.agent.post('/api/v1/products').send(body)).status).toBe(400)

    await a.agent.patch(`${A}/categories/${id}`).send({ isActive: true, name: `${PREFIX} Beta Renamed` }).expect(200)
    expect((await seller.agent.post('/api/v1/products').send(body)).status).toBe(201)
  })

  it('moves categories up and down, and cannot delete one that has listings', async () => {
    const a = await admin()
    const first = (await a.agent.post(`${A}/categories`).send({ name: `${PREFIX} First` })).body.data.category.id as string
    const second = (await a.agent.post(`${A}/categories`).send({ name: `${PREFIX} Second` })).body.data.category.id as string
    const order = async () =>
      (await a.agent.get(`${A}/categories`)).body.data.categories.map((c: { id: string }) => c.id) as string[]

    let list = await order()
    expect(list.indexOf(first)).toBeLessThan(list.indexOf(second))
    const moved = await a.agent.post(`${A}/categories/${second}/move`).send({ direction: 'up' })
    expect(moved.body.data.moved).toBe(true)
    list = await order()
    expect(list.indexOf(second)).toBeLessThan(list.indexOf(first))

    const top = list[0]
    expect((await a.agent.post(`${A}/categories/${top}/move`).send({ direction: 'up' })).body.data.moved).toBe(false)
    expect((await a.agent.post(`${A}/categories/${first}/move`).send({ direction: 'sideways' })).status).toBe(400)

    const seller = await student()
    await createProductRow(seller.user.id, university.id, first, { title: `In ${PREFIX} First` })
    const blocked = await a.agent.delete(`${A}/categories/${first}`)
    expect(blocked.status).toBe(409)
    expect(blocked.body.error.message).toContain('Deactivate')

    await a.agent.delete(`${A}/categories/${second}`).expect(200)
    expect(await order()).not.toContain(second)
    expect((await a.agent.delete(`${A}/categories/${second}`)).status).toBe(404)
  })
})

describe('university and campus management', () => {
  it('creates universities and campuses, rejects duplicates, and deactivation stops registration', async () => {
    const a = await admin()
    const created = await a.agent.post(`${A}/universities`).send({ name: `${PREFIX} University`, city: 'Test City' })
    expect(created.status).toBe(201)
    const id = created.body.data.university.id as string
    expect((await a.agent.post(`${A}/universities`).send({ name: `${PREFIX} University` })).status).toBe(409)

    const campus = await a.agent.post(`${A}/universities/${id}/campuses`).send({ name: 'North Gate' })
    expect(campus.status).toBe(201)
    expect((await a.agent.post(`${A}/universities/${id}/campuses`).send({ name: 'North Gate' })).status).toBe(409)
    expect((await a.agent.post(`${A}/universities/missing/campuses`).send({ name: 'Anywhere' })).status).toBe(404)

    const list = (await a.agent.get(`${A}/universities`)).body.data.universities
    const mine = list.find((u: { id: string }) => u.id === id)
    expect(mine.campuses.map((c: { name: string }) => c.name)).toEqual(['North Gate'])

    const publicIds = async () =>
      (await request(app).get('/api/v1/universities')).body.data.universities.map((u: { id: string }) => u.id)
    expect(await publicIds()).toContain(id)

    await a.agent.patch(`${A}/universities/${id}`).send({ isActive: false }).expect(200)
    expect(await publicIds()).not.toContain(id)
    const register = await request(app)
      .post('/api/v1/auth/register')
      .send({ fullName: 'New Student', email: `new.${PREFIX}@example.test`, password: STRONG_PASSWORD, universityId: id })
    expect(register.status).toBe(400)

    await a.agent.patch(`${A}/campuses/${campus.body.data.campus.id}`).send({ name: 'South Gate' }).expect(200)
    await a.agent.delete(`${A}/campuses/${campus.body.data.campus.id}`).expect(200)
  })

  it('refuses to delete a university that still has people, and deletes an empty one', async () => {
    const a = await admin()
    const id = (await a.agent.post(`${A}/universities`).send({ name: `${PREFIX} Busy University` })).body.data.university.id as string
    const { user } = await createUser(id)

    const blocked = await a.agent.delete(`${A}/universities/${id}`)
    expect(blocked.status).toBe(409)
    expect(blocked.body.error.message).toContain('Deactivate')

    await prisma.user.delete({ where: { id: user.id } })
    await a.agent.delete(`${A}/universities/${id}`).expect(200)
    expect((await a.agent.delete(`${A}/universities/${id}`)).status).toBe(404)
  })
})

describe('featured listings', () => {
  it('features an active listing, refuses overlaps and non-active listings, and unfeatures', async () => {
    const a = await admin()
    const seller = await student()
    const product = await listing(seller.user.id, { title: `Featured ${PREFIX}` })
    const draft = await listing(seller.user.id, { title: `Draft ${PREFIX}`, status: 'DRAFT' })
    const featuredIds = async () =>
      ids(await request(app).get(`/api/v1/products?featured=true&universityId=${university.id}`), 'products')

    expect(await featuredIds()).not.toContain(product.id)

    expect((await a.agent.post(`${A}/featured`).send({ productId: draft.id, days: 7 })).status).toBe(400)
    expect((await a.agent.post(`${A}/featured`).send({ productId: 'missing', days: 7 })).status).toBe(404)
    expect((await a.agent.post(`${A}/featured`).send({ productId: product.id, days: 0 })).status).toBe(400)
    expect((await a.agent.post(`${A}/featured`).send({ productId: product.id, days: 91 })).status).toBe(400)

    const created = await a.agent.post(`${A}/featured`).send({ productId: product.id, days: 7 })
    expect(created.status).toBe(201)
    expect(created.body.data.featured.state).toBe('active')
    const featuredId = created.body.data.featured.id as string

    expect(await featuredIds()).toContain(product.id)
    expect((await a.agent.post(`${A}/featured`).send({ productId: product.id, days: 3 })).status).toBe(409)
    expect(ids(await a.agent.get(`${A}/featured?state=active&pageSize=100`), 'featured')).toContain(featuredId)

    await a.agent.delete(`${A}/featured/${featuredId}`).expect(200)
    expect(await featuredIds()).not.toContain(product.id)
    expect((await a.agent.delete(`${A}/featured/${featuredId}`)).status).toBe(404)
  })

  it('schedules a future period that is not shown until it starts', async () => {
    const a = await admin()
    const seller = await student()
    const product = await listing(seller.user.id, { title: `Scheduled ${PREFIX}` })
    const startsAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()

    const created = await a.agent.post(`${A}/featured`).send({ productId: product.id, days: 3, startsAt })
    expect(created.status).toBe(201)
    expect(created.body.data.featured.state).toBe('scheduled')

    const publicFeatured = await request(app).get(`/api/v1/products?featured=true&universityId=${university.id}`)
    expect(ids(publicFeatured, 'products')).not.toContain(product.id)
    expect(ids(await a.agent.get(`${A}/featured?state=scheduled&pageSize=100`), 'featured')).toContain(created.body.data.featured.id)
    expect(ids(await a.agent.get(`${A}/featured?state=ended&pageSize=100`), 'featured')).not.toContain(created.body.data.featured.id)
  })
})

describe('audit log viewer', () => {
  it('shows what an administrator did, with filters and paging', async () => {
    const a = await admin()
    const other = await admin()
    const target = await student()

    await a.agent.post(`${A}/categories`).send({ name: `${PREFIX} Audited` }).expect(201)
    await a.agent.patch(`${A}/users/${target.user.id}/status`).send({ status: 'SUSPENDED', reason: 'Audit trail test' }).expect(200)
    await other.agent.post(`${A}/categories`).send({ name: `${PREFIX} Audited by other` }).expect(201)

    const mine = await a.agent.get(`${A}/audit-logs?actorId=${a.user.id}`)
    expect(mine.status).toBe(200)
    const actions = mine.body.data.logs.map((log: { action: string }) => log.action)
    expect(actions).toEqual(expect.arrayContaining(['category.created', 'user.suspended']))
    expect(mine.body.data.logs.every((log: { actor: { id: string } }) => log.actor.id === a.user.id)).toBe(true)
    expect(mine.body.data.logs[0].actor.email).toBe(a.email)

    const filtered = await a.agent.get(`${A}/audit-logs?actorId=${a.user.id}&action=suspended&entityType=User`)
    expect(filtered.body.data.logs).toHaveLength(1)
    expect(filtered.body.data.logs[0]).toMatchObject({ entityId: target.user.id, metadata: { reason: 'Audit trail test' } })

    const paged = await a.agent.get(`${A}/audit-logs?actorId=${a.user.id}&pageSize=1&page=2`)
    expect(paged.body.data.logs).toHaveLength(1)
    expect(paged.body.meta).toMatchObject({ page: 2, pageSize: 1, total: 2, totalPages: 2 })

    expect((await a.agent.get(`${A}/audit-logs?pageSize=500`)).status).toBe(400)
  })
})