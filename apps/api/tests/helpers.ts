import { randomUUID } from 'node:crypto'
import type { Express } from 'express'
import request from 'supertest'
import { prisma } from '../src/config/database.js'
import { hashPassword } from '../src/utils/password.js'

export const STRONG_PASSWORD = 'Sup3rSecret!'
export const uniqueEmail = (label = 'user') => `${label}.${randomUUID().slice(0, 8)}@example.test`

export async function createTestUniversity() {
  const suffix = randomUUID().slice(0, 8)
  return prisma.university.create({
    data: { name: `Test University ${suffix}`, campuses: { create: [{ name: 'Main' }, { name: 'North' }] } },
    include: { campuses: true },
  })
}

export async function removeTestUniversity(id: string) {
  await prisma.auditLog.deleteMany({ where: { actor: { universityId: id } } })
  await prisma.user.deleteMany({ where: { universityId: id } })
  await prisma.campus.deleteMany({ where: { universityId: id } })
  await prisma.university.delete({ where: { id } })
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