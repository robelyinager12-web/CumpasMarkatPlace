import request from 'supertest'
import { describe, expect, it } from 'vitest'

describe('auth rate limiting', () => {
  it('blocks repeated login attempts from one IP', async () => {
    process.env.AUTH_RATE_LIMIT_MAX = '3' // must be set before the app is first imported in this file
    const { app } = await import('../../src/app.js')

    const statuses: number[] = []
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@example.test', password: 'Whatever123' })
      statuses.push(res.status)
    }

    expect(statuses.slice(0, 3)).toEqual([401, 401, 401])
    expect(statuses.slice(3)).toEqual([429, 429])
  })
})