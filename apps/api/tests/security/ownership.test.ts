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

describe('listing ownership', () => {
  it('stops other users (and admins) from changing someone else\'s public listing', async () => {
    const { user: victim } = await createUser(university.id, { emailVerified: true })
    const listing = await createProductRow(victim.id, university.id, category.id, { title: 'Victim item', price: 200 })
    const image = await prisma.productImage.findFirstOrThrow({ where: { productId: listing.id } })

    const attackers = [
      await createLoggedInUser(app, university.id, { emailVerified: true }),
      await createLoggedInUser(app, university.id, { emailVerified: true, role: 'ADMIN' }),
    ]

    for (const attacker of attackers) {
      const base = `/api/v1/products/${listing.id}`
      expect((await attacker.agent.patch(base).send({ price: 1 })).status).toBe(403)
      expect((await attacker.agent.patch(base).send({ status: 'ARCHIVED' })).status).toBe(403)
      expect((await attacker.agent.delete(base)).status).toBe(403)
      const upload = await attacker.agent
        .post(`${base}/images`)
        .attach('images', PNG_BYTES, { filename: 'x.png', contentType: 'image/png' })
      expect(upload.status).toBe(403)
      expect((await attacker.agent.delete(`${base}/images/${image.id}`)).status).toBe(403)
    }

    const unchanged = await prisma.product.findUniqueOrThrow({ where: { id: listing.id } })
    expect(Number(unchanged.priceEtb)).toBe(200)
    expect(unchanged.status).toBe('ACTIVE')
    expect(await prisma.productImage.count({ where: { productId: listing.id } })).toBe(1)
  })

  it('hides other people\'s drafts completely', async () => {
    const { user: victim } = await createUser(university.id, { emailVerified: true })
    const draft = await createProductRow(victim.id, university.id, category.id, { status: 'DRAFT' })
    const attacker = await createLoggedInUser(app, university.id, { emailVerified: true })

    expect((await attacker.agent.get(`/api/v1/products/${draft.id}`)).status).toBe(404)
    expect((await attacker.agent.patch(`/api/v1/products/${draft.id}`).send({ price: 1 })).status).toBe(404)
    expect((await attacker.agent.delete(`/api/v1/products/${draft.id}`)).status).toBe(404)
    const mine = await attacker.agent.get('/api/v1/products/mine')
    expect(mine.body.data.products.map((p: { id: string }) => p.id)).not.toContain(draft.id)
  })

  it('does not let owners mark their own listing as removed or reassign it', async () => {
    const owner = await createLoggedInUser(app, university.id, { emailVerified: true })
    const listing = await createProductRow(owner.user.id, university.id, category.id)
    const removed = await owner.agent.patch(`/api/v1/products/${listing.id}`).send({ status: 'REMOVED' })
    expect(removed.status).toBe(400)

    const reassign = await owner.agent.patch(`/api/v1/products/${listing.id}`).send({ sellerId: 'x', title: 'Fine title' })
    expect(reassign.status).toBe(200)
    const after = await prisma.product.findUniqueOrThrow({ where: { id: listing.id } })
    expect(after.sellerId).toBe(owner.user.id)
  })

  it('refuses photo uploads from signed-out visitors before reading the file', async () => {
    const { user: victim } = await createUser(university.id, { emailVerified: true })
    const listing = await createProductRow(victim.id, university.id, category.id)
    const res = await request(app)
      .post(`/api/v1/products/${listing.id}/images`)
      .attach('images', PNG_BYTES, { filename: 'x.png', contentType: 'image/png' })
    expect(res.status).toBe(401)
  })
})