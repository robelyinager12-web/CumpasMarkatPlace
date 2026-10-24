import { describe, expect, it } from 'vitest'
import { DUMMY_HASH, hashPassword, verifyPassword } from '../../src/utils/password.js'

describe('password hashing', () => {
  it('verifies the right password and rejects a wrong one', async () => {
    const hash = await hashPassword('Correct1Horse')
    expect(await verifyPassword('Correct1Horse', hash)).toBe(true)
    expect(await verifyPassword('Wrong1Horse', hash)).toBe(false)
  })

  it('never stores the plain password and salts every hash', async () => {
    const a = await hashPassword('Correct1Horse')
    const b = await hashPassword('Correct1Horse')
    expect(a).not.toContain('Correct1Horse')
    expect(a).not.toBe(b)
  })

  it('returns false (does not throw) for a malformed stored hash', async () => {
    expect(await verifyPassword('anything1', '!demo-account-cannot-log-in')).toBe(false)
    expect(await verifyPassword('anything1', DUMMY_HASH)).toBe(false)
  })
})