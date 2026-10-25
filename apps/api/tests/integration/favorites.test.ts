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

describe('favorites', () => {
  it('requires a session', async () => {
    expect((await request(app).get('/api/v1/favorites')).status).toBe(401)
    expect((await request(app).post('/api/v1/favorites/anything')).status).toBe(401)
  })

  it('saves once, lists, shows the heart state to the viewer only, and removes', async () => {
    const { user: seller } = await createUser(university.id, { emailVerified: true })
    const product = await createProductRow(seller.id, university.id, category.id, { title: 'Favourite me' })
    const buyer = await createLoggedInUser(app, university.id)

    await buyer.agent.post(`/api/v1/favorites/${product.id}`).expect(200)
    await buyer.agent.post(`/api/v1/favorites/${product.id}`).expect(200) // saving twice is harmless

    const saved = await buyer.agent.get('/api/v1/favorites')
    expect(saved.body.data.products).toHaveLength(1)
    expect(saved.body.data.products[0].id).toBe(product.id)
    expect(saved.body.meta.total).toBe(1)

    const query = `/api/v1/products?universityId=${university.id}&q=Favourite`
    const asBuyer = await buyer.agent.get(query)
    expect(asBuyer.body.data.products[0].isFavorite).toBe(true)
    expect(asBuyer.body.data.products[0].favoritesCount).toBe(1)
    const asVisitor = await request(app).get(query)
    expect(asVisitor.body.data.products[0].isFavorite).toBe(false)

    await buyer.agent.delete(`/api/v1/favorites/${product.id}`).expect(200)
    await buyer.agent.delete(`/api/v1/favorites/${product.id}`).expect(200)
    expect((await buyer.agent.get('/api/v1/favorites')).body.data.products).toHaveLength(0)
  })

  it('cannot save a draft or a missing listing', async () => {
    const { user: seller } = await createUser(university.id, { emailVerified: true })
    const draft = await createProductRow(seller.id, university.id, category.id, { status: 'DRAFT' })
    const buyer = await createLoggedInUser(app, university.id)
    expect((await buyer.agent.post(`/api/v1/favorites/${draft.id}`)).status).toBe(404)
    expect((await buyer.agent.post('/api/v1/favorites/does-not-exist')).status).toBe(404)
  })
})