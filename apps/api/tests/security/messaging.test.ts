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

const verified = () => createLoggedInUser(app, university.id, { emailVerified: true })
const listing = (sellerId: string) => createProductRow(sellerId, university.id, category.id)

async function setupChat() {
  const seller = await verified()
  const buyer = await verified()
  const product = await listing(seller.user.id)
  const started = await buyer.agent
    .post('/api/v1/conversations')
    .send({ productId: product.id, message: 'Hi, is this available?' })
  return { seller, buyer, product, id: started.body.data.conversationId as string }
}

describe('conversation privacy', () => {
  it('hides a conversation from everyone except its two participants', async () => {
    const { id } = await setupChat()
    const stranger = await verified()
    const base = `/api/v1/conversations/${id}`

    expect((await stranger.agent.get(base)).status).toBe(404)
    expect((await stranger.agent.get(`${base}/messages`)).status).toBe(404)
    expect((await stranger.agent.post(`${base}/messages`).send({ body: 'Let me in' })).status).toBe(404)
    expect((await stranger.agent.post(`${base}/read`)).status).toBe(404)
    expect((await stranger.agent.get('/api/v1/conversations')).body.data.conversations).toHaveLength(0)

    expect((await request(app).get(base)).status).toBe(401)
    expect((await request(app).get(`${base}/messages`)).status).toBe(401)
    expect((await request(app).post(`${base}/messages`).send({ body: 'x' })).status).toBe(401)
  })

  it('never lets a message be sent as someone else', async () => {
    const { buyer, seller, id } = await setupChat()
    const res = await buyer.agent
      .post(`/api/v1/conversations/${id}/messages`)
      .send({ body: 'Pretending', senderId: seller.user.id })
    expect(res.status).toBe(201)
    expect(res.body.data.message.senderId).toBe(buyer.user.id)

    const stored = await prisma.message.findFirstOrThrow({ where: { conversationId: id, body: 'Pretending' } })
    expect(stored.senderId).toBe(buyer.user.id)
  })

  it('does not let a stranger mark someone else as having read', async () => {
    const { seller, id } = await setupChat()
    const stranger = await verified()
    await stranger.agent.post(`/api/v1/conversations/${id}/read`).expect(404)
    const item = (await seller.agent.get('/api/v1/conversations')).body.data.conversations[0]
    expect(item.unreadCount).toBe(1)
  })
})

describe('blocking', () => {
  it('stops the blocker and the blocked person from messaging, without revealing the block', async () => {
    const { seller, buyer, id } = await setupChat()
    await buyer.agent.post(`/api/v1/blocks/${seller.user.id}`).expect(200)

    const blocks = await buyer.agent.get('/api/v1/blocks')
    expect(blocks.body.data.blocks.map((b: { userId: string }) => b.userId)).toEqual([seller.user.id])

    const byBlocker = await buyer.agent.post(`/api/v1/conversations/${id}/messages`).send({ body: 'Hello?' })
    expect(byBlocker.status).toBe(403)
    expect(byBlocker.body.error.code).toBe('BLOCKED_BY_YOU')

    const byBlocked = await seller.agent.post(`/api/v1/conversations/${id}/messages`).send({ body: 'Why?' })
    expect(byBlocked.status).toBe(403)
    expect(byBlocked.body.error.code).toBe('CONVERSATION_UNAVAILABLE')
    expect(byBlocked.body.error.message).not.toMatch(/block/i)

    const buyerView = (await buyer.agent.get(`/api/v1/conversations/${id}`)).body.data.conversation
    const sellerView = (await seller.agent.get(`/api/v1/conversations/${id}`)).body.data.conversation
    expect(buyerView).toMatchObject({ blockedByMe: true, canSend: false })
    expect(sellerView).toMatchObject({ blockedByMe: false, canSend: false })
  })

  it('blocks new conversations in both directions', async () => {
    const { seller, buyer } = await setupChat()
    await buyer.agent.post(`/api/v1/blocks/${seller.user.id}`).expect(200)

    const buyersOwn = await listing(buyer.user.id)
    const fromBlocked = await seller.agent
      .post('/api/v1/conversations')
      .send({ productId: buyersOwn.id, message: 'Hi' })
    expect(fromBlocked.status).toBe(403)
    expect(fromBlocked.body.error.code).toBe('CONVERSATION_UNAVAILABLE')

    const sellersOther = await listing(seller.user.id)
    const fromBlocker = await buyer.agent
      .post('/api/v1/conversations')
      .send({ productId: sellersOther.id, message: 'Hi' })
    expect(fromBlocker.status).toBe(403)
    expect(fromBlocker.body.error.code).toBe('BLOCKED_BY_YOU')
  })

  it('stops counting messages from blocked people as unread, and unblocking restores messaging', async () => {
    const { seller, buyer, id } = await setupChat()
    expect((await seller.agent.get('/api/v1/notifications/summary')).body.data.unreadMessages).toBe(1)

    await seller.agent.post(`/api/v1/blocks/${buyer.user.id}`).expect(200)
    expect((await seller.agent.get('/api/v1/notifications/summary')).body.data.unreadMessages).toBe(0)
    expect((await seller.agent.get('/api/v1/conversations')).body.data.conversations[0].unreadCount).toBe(0)

    await seller.agent.delete(`/api/v1/blocks/${buyer.user.id}`).expect(200)
    await seller.agent.delete(`/api/v1/blocks/${buyer.user.id}`).expect(200) // unblocking twice is harmless
    const reply = await seller.agent.post(`/api/v1/conversations/${id}/messages`).send({ body: 'Sorry about that' })
    expect(reply.status).toBe(201)
  })

  it('rejects blocking yourself or an unknown user', async () => {
    const user = await verified()
    expect((await user.agent.post(`/api/v1/blocks/${user.user.id}`)).status).toBe(400)
    expect((await user.agent.post('/api/v1/blocks/does-not-exist')).status).toBe(404)
    expect((await request(app).post('/api/v1/blocks/anyone')).status).toBe(401)
  })
})

describe('abuse limits', () => {
  it('limits how many new conversations one account can start per hour', async () => {
    const seller = await verified()
    const buyer = await verified()
    const statuses: number[] = []
    let lastBody: { error?: { code?: string } } = {}

    for (let i = 0; i < 11; i++) {
      const product = await listing(seller.user.id)
      const res = await buyer.agent.post('/api/v1/conversations').send({ productId: product.id, message: 'Hi there' })
      statuses.push(res.status)
      lastBody = res.body
    }

    expect(statuses.slice(0, 10).every((status) => status === 201)).toBe(true)
    expect(statuses[10]).toBe(429)
    expect(lastBody.error?.code).toBe('TOO_MANY_REQUESTS')
  })
})