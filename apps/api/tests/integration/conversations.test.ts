import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../../src/app.js'
import { prisma } from '../../src/config/database.js'
import {
  createLoggedInUser,
  createProductRow,
  createTestCategory,
  createTestUniversity,
  createUser,
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

const verified = () => createLoggedInUser(app, university.id, { emailVerified: true })
type Agent = Awaited<ReturnType<typeof verified>>['agent']

const listing = (sellerId: string, over: Parameters<typeof createProductRow>[3] = {}) =>
  createProductRow(sellerId, university.id, category.id, over)
const start = (agent: Agent, productId: string, message = 'Hi, is this still available?') =>
  agent.post('/api/v1/conversations').send({ productId, message })
const idOf = (message: { id: string }) => message.id

describe('starting a conversation', () => {
  it('requires a session and a verified email', async () => {
    expect((await request(app).get('/api/v1/conversations')).status).toBe(401)
    expect((await request(app).post('/api/v1/conversations').send({})).status).toBe(401)

    const seller = await verified()
    const product = await listing(seller.user.id)
    const unverified = await createLoggedInUser(app, university.id)
    const res = await start(unverified.agent, product.id)
    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('EMAIL_NOT_VERIFIED')
  })

  it('only works on active listings that are not your own', async () => {
    const seller = await verified()
    const buyer = await verified()

    expect((await start(seller.agent, (await listing(seller.user.id)).id)).status).toBe(400)
    expect((await start(buyer.agent, (await listing(seller.user.id, { status: 'DRAFT' })).id)).status).toBe(404)
    expect((await start(buyer.agent, (await listing(seller.user.id, { status: 'SOLD' })).id)).status).toBe(404)
    expect((await start(buyer.agent, 'does-not-exist')).status).toBe(404)

    const suspended = await createUser(university.id, { emailVerified: true, status: 'SUSPENDED' })
    expect((await start(buyer.agent, (await listing(suspended.user.id)).id)).status).toBe(404)
  })

  it('rejects empty or oversized first messages', async () => {
    const seller = await verified()
    const buyer = await verified()
    const product = await listing(seller.user.id)
    expect((await start(buyer.agent, product.id, '   ')).status).toBe(400)
    expect((await start(buyer.agent, product.id, 'a'.repeat(1001))).status).toBe(400)
  })

  it('keeps one conversation per buyer and listing', async () => {
    const seller = await verified()
    const buyer = await verified()
    const product = await listing(seller.user.id)

    const first = await start(buyer.agent, product.id, 'First message')
    const second = await start(buyer.agent, product.id, 'Second message')
    expect(first.status).toBe(201)
    expect(second.status).toBe(201)
    expect(second.body.data.conversationId).toBe(first.body.data.conversationId)

    expect(await prisma.conversation.count({ where: { productId: product.id } })).toBe(1)
    expect(await prisma.message.count({ where: { conversationId: first.body.data.conversationId } })).toBe(2)
  })
})

describe('reading, unread counts and replies', () => {
  it('tracks unread messages per person and clears them when read', async () => {
    const seller = await verified()
    const buyer = await verified()
    const product = await listing(seller.user.id, { title: 'Calculus textbook' })

    const started = await start(buyer.agent, product.id)
    const id = started.body.data.conversationId as string

    const sellerList = await seller.agent.get('/api/v1/conversations')
    const item = sellerList.body.data.conversations[0]
    expect(item).toMatchObject({ id, role: 'seller', unreadCount: 1, canSend: true, blockedByMe: false })
    expect(item.product.title).toBe('Calculus textbook')
    expect(item.other.name).toBe('Test U.')
    expect(item.lastMessage.body).toBe('Hi, is this still available?')
    expect(JSON.stringify(sellerList.body)).not.toContain(buyer.email)

    const buyerItem = (await buyer.agent.get('/api/v1/conversations')).body.data.conversations[0]
    expect(buyerItem).toMatchObject({ role: 'buyer', unreadCount: 0 })

    const summary = await seller.agent.get('/api/v1/notifications/summary')
    expect(summary.body.data).toEqual({ unreadNotifications: 0, unreadMessages: 1 })

    await seller.agent.post(`/api/v1/conversations/${id}/read`).expect(200)
    expect((await seller.agent.get('/api/v1/notifications/summary')).body.data.unreadMessages).toBe(0)

    const reply = await seller.agent.post(`/api/v1/conversations/${id}/messages`).send({ body: 'Yes, it is.' })
    expect(reply.status).toBe(201)
    expect(reply.body.data.message.mine).toBe(true)
    expect((await buyer.agent.get('/api/v1/notifications/summary')).body.data.unreadMessages).toBe(1)

    const thread = await buyer.agent.get(`/api/v1/conversations/${id}/messages`)
    expect(thread.body.data.messages.map((m: { mine: boolean }) => m.mine)).toEqual([true, false])
  })

  it('pages through long conversations in both directions', async () => {
    const seller = await verified()
    const buyer = await verified()
    const product = await listing(seller.user.id)
    const id = (await start(buyer.agent, product.id, 'message 1')).body.data.conversationId as string
    for (const n of [2, 3, 4, 5]) {
      await buyer.agent.post(`/api/v1/conversations/${id}/messages`).send({ body: `message ${n}` }).expect(201)
    }

    const base = `/api/v1/conversations/${id}/messages`
    const all = (await buyer.agent.get(`${base}?limit=100`)).body.data.messages as { id: string }[]
    const ids = all.map(idOf)
    expect(ids).toHaveLength(5)

    const latest = await buyer.agent.get(`${base}?limit=2`)
    expect(latest.body.data.messages.map(idOf)).toEqual(ids.slice(3))
    expect(latest.body.data.hasMore).toBe(true)

    const older = await buyer.agent.get(`${base}?limit=2&before=${ids[3]}`)
    expect(older.body.data.messages.map(idOf)).toEqual(ids.slice(1, 3))
    expect(older.body.data.hasMore).toBe(true)

    const oldest = await buyer.agent.get(`${base}?limit=2&before=${ids[1]}`)
    expect(oldest.body.data.messages.map(idOf)).toEqual(ids.slice(0, 1))
    expect(oldest.body.data.hasMore).toBe(false)

    expect((await buyer.agent.get(`${base}?after=${ids[2]}`)).body.data.messages.map(idOf)).toEqual(ids.slice(3))
    expect((await buyer.agent.get(`${base}?after=${ids[4]}`)).body.data.messages).toEqual([])

    expect((await buyer.agent.get(`${base}?after=unknown-id`)).status).toBe(400)
    expect((await buyer.agent.get(`${base}?after=${ids[0]}&before=${ids[1]}`)).status).toBe(400)
  })

  it('validates message bodies', async () => {
    const seller = await verified()
    const buyer = await verified()
    const id = (await start(buyer.agent, (await listing(seller.user.id)).id)).body.data.conversationId as string
    const url = `/api/v1/conversations/${id}/messages`
    expect((await buyer.agent.post(url).send({ body: '' })).status).toBe(400)
    expect((await buyer.agent.post(url).send({ body: '  \n ' })).status).toBe(400)
    expect((await buyer.agent.post(url).send({ body: 'x'.repeat(1001) })).status).toBe(400)
    expect((await buyer.agent.post(url).send({})).status).toBe(400)
  })

  it('closes the conversation when a moderator removes the listing', async () => {
    const seller = await verified()
    const buyer = await verified()
    const product = await listing(seller.user.id)
    const id = (await start(buyer.agent, product.id)).body.data.conversationId as string

    await prisma.product.update({ where: { id: product.id }, data: { status: 'REMOVED' } })
    const res = await buyer.agent.post(`/api/v1/conversations/${id}/messages`).send({ body: 'Still there?' })
    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('LISTING_REMOVED')
    const item = (await buyer.agent.get(`/api/v1/conversations/${id}`)).body.data.conversation
    expect(item.canSend).toBe(false)
  })
})