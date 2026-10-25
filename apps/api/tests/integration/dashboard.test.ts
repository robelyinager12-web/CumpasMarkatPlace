import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
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
const listing = (sellerId: string, over: Parameters<typeof createProductRow>[3] = {}) =>
  createProductRow(sellerId, university.id, category.id, over)

describe('dashboards', () => {
  it('shows sellers real numbers', async () => {
    const seller = await verified()
    const fan = await verified()
    const popular = await listing(seller.user.id, { title: 'Dashboard A' })
    await listing(seller.user.id, { title: 'Dashboard B' })
    await listing(seller.user.id, { title: 'Dashboard sold', status: 'SOLD' })
    await listing(seller.user.id, { title: 'Dashboard draft', status: 'DRAFT' })

    await fan.agent.post(`/api/v1/favorites/${popular.id}`).expect(200)
    await fan.agent.get(`/api/v1/products/${popular.id}`).expect(200)
    await vi.waitFor(async () => {
      expect(await prisma.listingView.count({ where: { product: { sellerId: seller.user.id } } })).toBe(1)
    })
    await fan.agent.post('/api/v1/conversations').send({ productId: popular.id, message: 'Hello there' }).expect(201)

    const res = await seller.agent.get('/api/v1/dashboard/seller')
    expect(res.status).toBe(200)
    expect(res.body.data.stats).toEqual({
      activeListings: 2,
      soldListings: 1,
      draftListings: 1,
      favoritesReceived: 1,
      totalViews: 1,
      viewsLast7Days: 1,
    })
    expect(res.body.data.recentConversations).toHaveLength(1)
    expect(res.body.data.recentConversations[0].unreadCount).toBe(1)
  })

  it('shows buyers their favorites, recent views, conversations and reports', async () => {
    const seller = await verified()
    const buyer = await verified()
    const product = await listing(seller.user.id, { title: 'Buyer dashboard item' })

    await buyer.agent.post(`/api/v1/favorites/${product.id}`).expect(200)
    await buyer.agent.get(`/api/v1/products/${product.id}`).expect(200)
    await vi.waitFor(async () => {
      expect(await prisma.listingView.count({ where: { viewerId: buyer.user.id } })).toBe(1)
    })
    await buyer.agent.post('/api/v1/conversations').send({ productId: product.id, message: 'Is it available?' }).expect(201)
    await buyer.agent.post('/api/v1/reports').send({ type: 'LISTING', targetId: product.id, reason: 'SPAM' }).expect(201)

    const res = await buyer.agent.get('/api/v1/dashboard/buyer')
    expect(res.status).toBe(200)
    expect(res.body.data.favorites.map((p: { id: string }) => p.id)).toEqual([product.id])
    expect(res.body.data.recentlyViewed.map((p: { id: string }) => p.id)).toEqual([product.id])
    expect(res.body.data.recentConversations).toHaveLength(1)
    expect(res.body.data.recentConversations[0].role).toBe('buyer')
    expect(res.body.data.reports).toHaveLength(1)
  })

  it('requires a session', async () => {
    const { default: request } = await import('supertest')
    expect((await request(app).get('/api/v1/dashboard/seller')).status).toBe(401)
    expect((await request(app).get('/api/v1/dashboard/buyer')).status).toBe(401)
  })
})