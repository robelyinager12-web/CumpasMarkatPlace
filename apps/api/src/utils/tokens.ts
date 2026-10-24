import { createHmac, randomBytes } from 'node:crypto'
import { env } from '../config/env.js'

// 256-bit random token that is sent to the user. Only its HMAC is stored in the database.
export const generateToken = () => randomBytes(32).toString('base64url')

export const hashToken = (token: string) =>
  createHmac('sha256', env.SESSION_SECRET).update(token).digest('hex')