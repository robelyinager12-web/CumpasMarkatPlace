import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto'
import { env } from '../config/env.js'

// AES-256-GCM with a key derived from SESSION_SECRET. Changing SESSION_SECRET makes stored secrets unreadable.
const key = Buffer.from(hkdfSync('sha256', env.SESSION_SECRET, 'unikamp-secret-box-v1', 'totp-secret', 32))

export function encryptSecret(plain: Buffer): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const data = Buffer.concat([cipher.update(plain), cipher.final()])
  return [iv, cipher.getAuthTag(), data].map((part) => part.toString('base64url')).join('.')
}

export function decryptSecret(stored: string): Buffer {
  const [iv, tag, data] = stored.split('.').map((part) => Buffer.from(part, 'base64url'))
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()])
}