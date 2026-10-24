import cors from 'cors'
import { env } from './env.js'

const allowedOrigin = new URL(env.FRONTEND_URL).origin

export const corsMiddleware = cors({
  origin: allowedOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600,
})