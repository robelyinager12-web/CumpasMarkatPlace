import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../../src/app.js'
import { prisma } from '../../src/config/database.js'
import {
  PNG_BYTES,
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

const body = (over: Record<string, unknown> = {}) => ({
  title: 'Calculus textbook',
  description: 'Good condition, a few notes in the margin.',
  categoryId: category.id,
  price: 450,
  condition: 'GOOD',
  negotiable: true,
  ...over,
})

const seller = () => createLoggedInUser(app, university.id, { emailVerified: true })

describe('creating listings', () => {
  it('requires a session and a verified email', async () => {
    expect((await request(app).post('/api/v1/products').send(body())).status).toBe(401)

    const unverified = await createLoggedInUser(app, university.id)
    const res = await unverified.agent.post('/api/v1/products').send(body())
    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('EMAIL_NOT_VERIFIED')
  })

  it('rejects invalid data with field details', async () => {
    const { agent } = await seller()
    for (const bad of [
      { price: 0 },
      { price: -5 },
      { price: 10.123 },
      { title: 'ab' },
      { description: 'short' },
      { condition: 'BROKEN' },
      { categoryId: '' },
    ]) {
      const res = await agent.post('/api/v1/products').send(body(bad))
      expect(res.status, JSON.stringify(bad)).toBe(400)
      expect(res.body.error.code).toBe('VALIDATION_ERROR')
    }
  })

  it('creates a draft in the seller\'s own university that the public cannot see', async () => {
    const { agent } = await seller()
    const res = await agent.post('/api/v1/products').send(body({ universityId: 'ignored', sellerId: 'ignored' }))
    expect(res.status).toBe(201)
    const product = res.body.data.product
    expect(product.status).toBe('DRAFT')
    expect(product.university.id).toBe(university.id)
    expect(product.price).toBe(450)

    expect((await request(app).get(`/api/v1/products/${product.id}`)).status).toBe(404)
    const list = await request(app).get(`/api/v1/products?universityId=${university.id}&q=Calculus`)
    expect(list.body.data.products.map((p: { id: string }) => p.id)).not.toContain(product.id)

    const own = await agent.get(`/api/v1/products/${product.id}`)
    expect(own.status).toBe(200)
    expect(own.body.data.product.isOwner).toBe(true)
  })

  it('rejects a campus from another university', async () => {
    const other = await createTestUniversity()
    try {
      const { agent } = await seller()
      const res = await agent.post('/api/v1/products').send(body({ campusId: other.campuses[0].id }))
      expect(res.status).toBe(400)
    } finally {
      await removeTestUniversity(other.id)
    }
  })
})

describe('photos and publishing', () => {
  it('accepts real images only, and a photo is needed to publish', async () => {
    const { agent } = await seller()
    const id = (await agent.post('/api/v1/products').send(body())).body.data.product.id

    const early = await agent.patch(`/api/v1/products/${id}`).send({ status: 'ACTIVE' })
    expect(early.status).toBe(400)

    const fake = await agent
      .post(`/api/v1/products/${id}/images`)
      .attach('images', Buffer.from('<script>alert(1)</script>'), { filename: 'evil.png', contentType: 'image/png' })
    expect(fake.status).toBe(400)
    expect(fake.body.error.code).toBe('INVALID_IMAGE')

    const good = await agent
      .post(`/api/v1/products/${id}/images`)
      .attach('images', PNG_BYTES, { filename: 'photo.png', contentType: 'image/png' })
    expect(good.status).toBe(201)
    expect(good.body.data.images).toHaveLength(1)

    const published = await agent.patch(`/api/v1/products/${id}`).send({ status: 'ACTIVE' })
    expect(published.status).toBe(200)
    expect(published.body.data.product.status).toBe('ACTIVE')

    const list = await request(app).get(`/api/v1/products?universityId=${university.id}&q=calculus`)
    expect(list.body.data.products.map((p: { id: string }) => p.id)).toContain(id)
  })

  it('allows at most 8 photos and refuses to remove the last photo of an active listing', async () => {
    const { agent } = await seller()
    const id = (await agent.post('/api/v1/products').send(body())).body.data.product.id
    const url = `/api/v1/products/${id}/images`
    const attachMany = (count: number) => {
      const req = agent.post(url)
      for (let i = 0; i < count; i++) req.attach('images', PNG_BYTES, { filename: `p${i}.png`, contentType: 'image/png' })
      return req
    }

    expect((await attachMany(5)).status).toBe(201)
    expect((await attachMany(4)).status).toBe(400)
    const last = await attachMany(3)
    expect(last.status).toBe(201)

    await agent.patch(`/api/v1/products/${id}`).send({ status: 'ACTIVE' }).expect(200)
    const images = last.body.data.images as { id: string }[]
    const stored = await prisma.productImage.findMany({ where: { productId: id } })
    for (const image of stored.slice(0, -1)) {
      await agent.delete(`/api/v1/products/${id}/images/${image.id}`).expect(200)
    }
    const refused = await agent.delete(`/api/v1/products/${id}/images/${stored[stored.length - 1].id}`)
    expect(refused.status).toBe(409)
    expect(images.length).toBe(3)
  })
})

describe('listing status and deletion', () => {
  it('follows allowed status changes only', async () => {
    const { agent, user } = await seller()
    const draft = await createProductRow(user.id, university.id, category.id, { status: 'DRAFT' })
    const toSold = await agent.patch(`/api/v1/products/${draft.id}`).send({ status: 'SOLD' })
    expect(toSold.status).toBe(409)

    const active = await createProductRow(user.id, university.id, category.id, { title: 'Sellable item' })
    const sold = await agent.patch(`/api/v1/products/${active.id}`).send({ status: 'SOLD' })
    expect(sold.status).toBe(200)
    expect(sold.body.data.product.status).toBe('SOLD')

    // sold items disappear from search but the page stays visible and labelled
    const list = await request(app).get(`/api/v1/products?universityId=${university.id}&q=Sellable`)
    expect(list.body.data.products).toHaveLength(0)
    const page = await request(app).get(`/api/v1/products/${active.id}`)
    expect(page.status).toBe(200)
    expect(page.body.data.product.status).toBe('SOLD')
  })

  it('lets the owner edit and delete, and nobody else', async () => {
    const owner = await seller()
    const stranger = await seller()
    const item = await createProductRow(owner.user.id, university.id, category.id)

    const edited = await owner.agent.patch(`/api/v1/products/${item.id}`).send({ price: 99.5, title: 'Renamed item' })
    expect(edited.status).toBe(200)
    expect(edited.body.data.product.price).toBe(99.5)

    expect((await stranger.agent.delete(`/api/v1/products/${item.id}`)).status).toBe(403)
    expect((await owner.agent.delete(`/api/v1/products/${item.id}`)).status).toBe(200)
    expect((await request(app).get(`/api/v1/products/${item.id}`)).status).toBe(404)
  })

  it('shows the seller by short name only, with no contact details', async () => {
    const { user, email } = await seller()
    const item = await createProductRow(user.id, university.id, category.id)
    const res = await request(app).get(`/api/v1/products/${item.id}`)
    expect(res.status).toBe(200)
    expect(res.body.data.product.seller.name).toBe('Test U.')
    expect(JSON.stringify(res.body)).not.toContain(email)
    expect(JSON.stringify(res.body)).not.toContain('passwordHash')
  })
})

describe('browsing and filters', () => {
  let browse: Awaited<ReturnType<typeof createTestUniversity>>
  let other: Awaited<ReturnType<typeof createTestCategory>>
  const titles = (res: request.Response) => res.body.data.products.map((p: { title: string }) => p.title)
  const get = (query: string) => request(app).get(`/api/v1/products?universityId=${browse.id}&${query}`)

  beforeAll(async () => {
    browse = await createTestUniversity()
    other = await createTestCategory()
    const { user } = await createUser(browse.id, { emailVerified: true })
    await createProductRow(user.id, browse.id, category.id, { title: 'Calculus textbook', price: 450, condition: 'GOOD' })
    await createProductRow(user.id, browse.id, category.id, { title: 'Scientific calculator', price: 600, condition: 'LIKE_NEW' })
    await createProductRow(user.id, browse.id, other.id, { title: 'Desk lamp', price: 350, condition: 'NEW' })
    await createProductRow(user.id, browse.id, other.id, { title: 'Wired headphones', price: 500, condition: 'FAIR' })
    await createProductRow(user.id, browse.id, other.id, { title: 'Notebook bundle', price: 150, condition: 'NEW' })
    await createProductRow(user.id, browse.id, other.id, { title: 'Hidden draft', price: 1, status: 'DRAFT' })
    await createProductRow(user.id, browse.id, other.id, { title: 'Sold laptop', price: 9000, status: 'SOLD' })
  })

  afterAll(async () => {
    await removeTestCategory(other.id)
    await removeTestUniversity(browse.id)
  })

  it('only lists active listings', async () => {
    const res = await get('pageSize=48')
    expect(res.body.data.products).toHaveLength(5)
    expect(titles(res)).not.toContain('Hidden draft')
    expect(titles(res)).not.toContain('Sold laptop')
  })

  it('searches every word in title or description', async () => {
    expect(titles(await get('q=calc')).sort()).toEqual(['Calculus textbook', 'Scientific calculator'])
    expect(titles(await get('q=scientific%20calc'))).toEqual(['Scientific calculator'])
    expect(titles(await get('q=nothingmatches'))).toEqual([])
  })

  it('filters by category, price and condition', async () => {
    expect((await get(`category=${other.slug}`)).body.data.products).toHaveLength(3)
    expect(titles(await get('minPrice=400&maxPrice=550')).sort()).toEqual(['Calculus textbook', 'Wired headphones'])
    expect(titles(await get('condition=NEW,LIKE_NEW')).sort()).toEqual(['Desk lamp', 'Notebook bundle', 'Scientific calculator'])
  })

  it('sorts by price and paginates with accurate totals', async () => {
    const asc = await get('sort=price_asc')
    expect(asc.body.data.products.map((p: { price: number }) => p.price)).toEqual([150, 350, 450, 500, 600])
    const desc = await get('sort=price_desc')
    expect(desc.body.data.products.map((p: { price: number }) => p.price)).toEqual([600, 500, 450, 350, 150])

    const page3 = await get('sort=price_asc&pageSize=2&page=3')
    expect(page3.body.data.products.map((p: { price: number }) => p.price)).toEqual([600])
    expect(page3.body.meta).toEqual({ page: 3, pageSize: 2, total: 5, totalPages: 3 })
  })

  it('rejects impossible filters and can exclude one listing', async () => {
    expect((await get('minPrice=500&maxPrice=100')).status).toBe(400)
    const all = await get('')
    const firstId = all.body.data.products[0].id
    const without = await get(`excludeId=${firstId}`)
    expect(without.body.data.products.map((p: { id: string }) => p.id)).not.toContain(firstId)
  })
})