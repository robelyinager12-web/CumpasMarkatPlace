import { describe, expect, it } from 'vitest'
import { generateToken, hashToken } from '../../src/utils/tokens.js'

describe('tokens', () => {
  it('generates long, unique, URL-safe tokens', () => {
    const a = generateToken()
    const b = generateToken()
    expect(a).not.toBe(b)
    expect(a.length).toBeGreaterThanOrEqual(43)
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('hashes deterministically and never returns the token itself', () => {
    const token = generateToken()
    expect(hashToken(token)).toBe(hashToken(token))
    expect(hashToken(token)).not.toContain(token)
    expect(hashToken(token)).not.toBe(hashToken(generateToken()))
  })
})