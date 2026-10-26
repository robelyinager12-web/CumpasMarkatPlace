import { describe, expect, it } from 'vitest'
import { decryptSecret, encryptSecret } from '../../src/utils/secret-box.js'
import { base32Decode, base32Encode, generateSecret, otpauthUrl, totpAt, verifyTotp } from '../../src/utils/totp.js'

const RFC_SECRET = Buffer.from('12345678901234567890')

describe('TOTP', () => {
  // RFC 6238 SHA-1 test vectors (the standard's 8-digit codes, last 6 digits)
  it.each([
    [59, '287082'],
    [1111111109, '081804'],
    [1111111111, '050471'],
    [1234567890, '005924'],
    [2000000000, '279037'],
  ])('produces the standard code at %i seconds', (seconds, expected) => {
    expect(totpAt(RFC_SECRET, seconds * 1000)).toBe(expected)
  })

  it('accepts the current step and one step either side, and nothing else', () => {
    const now = 1_700_000_000_000
    expect(verifyTotp(RFC_SECRET, totpAt(RFC_SECRET, now), now)).toBe(true)
    expect(verifyTotp(RFC_SECRET, totpAt(RFC_SECRET, now - 30_000), now)).toBe(true)
    expect(verifyTotp(RFC_SECRET, totpAt(RFC_SECRET, now + 30_000), now)).toBe(true)
    expect(verifyTotp(RFC_SECRET, totpAt(RFC_SECRET, now - 90_000), now)).toBe(false)
    expect(verifyTotp(RFC_SECRET, '12345', now)).toBe(false)
    expect(verifyTotp(RFC_SECRET, 'abcdef', now)).toBe(false)
  })

  it('encodes base32 the way authenticator apps expect', () => {
    expect(base32Encode(RFC_SECRET)).toBe('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ')
    const secret = generateSecret()
    expect(base32Decode(base32Encode(secret)).equals(secret)).toBe(true)
    expect(base32Decode('gezd gnbv-gy3t qojq GEZDGNBVGY3TQOJQ').equals(RFC_SECRET)).toBe(true)
  })

  it('builds a standard otpauth link', () => {
    const url = otpauthUrl('abebe@example.com', RFC_SECRET)
    expect(url.startsWith('otpauth://totp/UniKamp%3Aabebe%40example.com?')).toBe(true)
    expect(url).toContain('secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ')
    expect(url).toContain('issuer=UniKamp')
  })
})

describe('secret box', () => {
  it('encrypts and decrypts, and never stores the plain secret', () => {
    const secret = generateSecret()
    const stored = encryptSecret(secret)
    expect(stored).not.toContain(base32Encode(secret))
    expect(decryptSecret(stored).equals(secret)).toBe(true)
    expect(encryptSecret(secret)).not.toBe(stored) // fresh random IV every time
  })

  it('rejects tampered data', () => {
    const stored = encryptSecret(generateSecret())
    const [iv, tag, data] = stored.split('.')
    const flipped = `${data.slice(0, -2)}${data.endsWith('AA') ? 'BB' : 'AA'}`
    expect(() => decryptSecret([iv, tag, flipped].join('.'))).toThrow()
  })
})