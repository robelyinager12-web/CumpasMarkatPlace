import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../../src/app.js'
import { prisma } from '../../src/config/database.js'
import { createLoggedInUser, createTestUniversity, removeTestUniversity } from '../helpers.js'

type Method = 'get' | 'post' | 'patch' | 'delete'

const ROUTES: [Method, string][] = [
  ['get', '/api/v1/admin/dashboard'],
  ['get', '/api/v1/admin/users'],
  ['patch', '/api/v1/admin/users/x/status'],
  ['get', '/api/v1/admin/products'],
  ['patch', '/api/v1/admin/products/x/status'],
  ['get', '/api/v1/admin/reports'],
  ['patch', '/api/v1/admin/reports/x'],
  ['get', '/api/v1/admin/verifications'],
  ['patch', '/api/v1/admin/verifications/x'],
  ['get', '/api/v1/admin/categories'],
  ['post', '/api/v1/admin/categories'],
  ['patch', '/api/v1/admin/categories/x'],
  ['post', '/api/v1/admin/categories/x/move'],
  ['delete', '/api/v1/admin/categories/x'],
  ['get', '/api/v1/admin/universities'],
  ['post', '/api/v1/admin/universities'],
  ['patch', '/api/v1/admin/universities/x'],
  ['delete', '/api/v1/admin/universities/x'],
  ['post', '/api/v1/admin/universities/x/campuses'],
  ['patch', '/api/v1/admin/campuses/x'],
  ['delete', '/api/v1/admin/campuses/x'],
  ['get', '/api/v1/admin/featured'],
  ['post', '/api/v1/admin/featured'],
  ['delete', '/api/v1/admin/featured/x'],
  ['get', '/api/v1/admin/audit-logs'],
]

let university: Awaited<ReturnType<typeof createTestUniversity>>

beforeAll(async () => {
  university = await createTestUniversity()
})

afterAll(async () => {
  await removeTestUniversity(university.id)
  await prisma.$disconnect()
})

describe('every admin route', () => {
  it('rejects visitors with 401', async () => {
    for (const [method, path] of ROUTES) {
      const res = await request(app)[method](path)
      expect(res.status, `${method.toUpperCase()} ${path}`).toBe(401)
    }
  })

  it('rejects signed-in students with 403', async () => {
    const { agent } = await createLoggedInUser(app, university.id, { emailVerified: true })
    for (const [method, path] of ROUTES) {
      const res = await agent[method](path)
      expect(res.status, `${method.toUpperCase()} ${path}`).toBe(403)
    }
  })

  it('rejects an administrator once their account is suspended', async () => {
    const { agent, user } = await createLoggedInUser(app, university.id, { role: 'ADMIN' })
    expect((await agent.get('/api/v1/admin/dashboard')).status).toBe(200)

    await prisma.user.update({ where: { id: user.id }, data: { status: 'SUSPENDED' } })
    expect((await agent.get('/api/v1/admin/dashboard')).status).toBe(403)
  })
})