import { randomUUID } from 'node:crypto'
import type { Express } from 'express'
import request from 'supertest'
import { prisma } from '../src/config/database.js'
import { hashPassword } from '../src/utils/password.js'

export const STRONG_PASSWORD = 'Sup3rSecret!'
export const uniqueEmail = (label = 'user') => `${label}.${randomUUID().slice(0, 8)}@example.test`

// 1x1 PNG
export const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

export async function createTestUniversity() {
  const suffix = randomUUID().slice(0, 8)
  return prisma.university.create({
    data: { name: `Test University ${suffix}`, campuses: { create: [{ name: 'Main' }, { name: 'North' }] } },
    include: { campuses: true },
  })
}

export async function removeTestUniversity(id: string) {
  await prisma.auditLog.deleteMany({ where: { actor: { universityId: id } } })
  await prisma.product.deleteMany({ where: { universityId: id } })
  await prisma.user.deleteMany({ where: { universityId: id } })
  await prisma.campus.deleteMany({ where: { universityId: id } })
  await prisma.university.delete({ where: { id } })
}

export async function createTestCategory() {
  const suffix = randomUUID().slice(0, 8)
  return prisma.category.create({ data: { name: `Test Category ${suffix}`, slug: `test-category-${suffix}` } })
}

export async function removeTestCategory(id: string) {
  await prisma.product.deleteMany({ where: { categoryId: id } })
  await prisma.category.delete({ where: { id } })
}

export async function createUser(
  universityId: string,
  overrides: { role?: 'STUDENT' | 'ADMIN'; emailVerified?: boolean; status?: 'ACTIVE' | 'SUSPENDED' } = {},
) {
  const email = uniqueEmail()
  const user = await prisma.user.create({
    data: {
      fullName: 'Test User',
      email,
      passwordHash: await hashPassword(STRONG_PASSWORD),
      universityId,
      role: overrides.role ?? 'STUDENT',
      emailVerified: overrides.emailVerified ?? false,
      status: overrides.status ?? 'ACTIVE',
      verification: { create: {} },
    },
  })
  return { user, email, password: STRONG_PASSWORD }
}

export async function loginAgent(app: Express, email: string, password: string) {
  const agent = request.agent(app)
  await agent.post('/api/v1/auth/login').send({ email, password }).expect(200)
  return agent
}

export async function createLoggedInUser(
  app: Express,
  universityId: string,
  overrides: Parameters<typeof createUser>[1] = {},
) {
  const created = await createUser(universityId, overrides)
  const agent = await loginAgent(app, created.email, created.password)
  return { ...created, agent }
}

export async function createProductRow(
  sellerId: string,
  universityId: string,
  categoryId: string,
  over: {
    title?: string
    description?: string
    price?: number
    condition?: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR'
    status?: 'DRAFT' | 'ACTIVE' | 'SOLD' | 'ARCHIVED' | 'REMOVED'
    images?: number
  } = {},
) {
  return prisma.product.create({
    data: {
      title: over.title ?? 'Test product',
      description: over.description ?? 'A test product description.',
      priceEtb: over.price ?? 100,
      condition: over.condition ?? 'GOOD',
      status: over.status ?? 'ACTIVE',
      sellerId,
      categoryId,
      universityId,
      images: {
        create: Array.from({ length: over.images ?? 1 }, (_, position) => ({
          url: 'https://placehold.co/600x400?text=Test',
          position,
        })),
      },
    },
  })
}