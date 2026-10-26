import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function base32Encode(buffer: Buffer): string {
  let bits = 0
  let value = 0
  let output = ''
  for (const byte of buffer) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      output += ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) output += ALPHABET[(value << (5 - bits)) & 31]
  return output
}

export function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/[\s=-]/g, '')
  let bits = 0
  let value = 0
  const bytes: number[] = []
  for (const char of clean) {
    const index = ALPHABET.indexOf(char)
    if (index === -1) throw new Error('Invalid base32 character')
    value = (value << 5) | index
    bits += 5
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return Buffer.from(bytes)
}

export const generateSecret = () => randomBytes(20)

function hotp(secret: Buffer, counter: number, digits = 6): string {
  const message = Buffer.alloc(8)
  message.writeBigUInt64BE(BigInt(counter))
  const hmac = createHmac('sha1', secret).update(message).digest()
  const offset = hmac[hmac.length - 1] & 0x0f
  const binary =
    ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3]
  return String(binary % 10 ** digits).padStart(digits, '0')
}

export const totpAt = (secret: Buffer, timeMs: number, digits = 6, stepSeconds = 30) =>
  hotp(secret, Math.floor(timeMs / 1000 / stepSeconds), digits)

const safeEqual = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b))

// Accepts the current 30-second step and one step either side, to allow for clock drift.
export function verifyTotp(secret: Buffer, code: string, nowMs = Date.now(), window = 1): boolean {
  const cleaned = code.replace(/\s/g, '')
  if (!/^\d{6}$/.test(cleaned)) return false
  let match = false
  for (let step = -window; step <= window; step++) {
    if (safeEqual(totpAt(secret, nowMs + step * 30_000), cleaned)) match = true
  }
  return match
}

export function otpauthUrl(account: string, secret: Buffer, issuer = 'UniKamp'): string {
  const label = encodeURIComponent(`${issuer}:${account}`)
  const params = new URLSearchParams({ secret: base32Encode(secret), issuer, algorithm: 'SHA1', digits: '6', period: '30' })
  return `otpauth://totp/${label}?${params.toString()}`
}