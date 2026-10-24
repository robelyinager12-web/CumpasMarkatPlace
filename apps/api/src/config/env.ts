import 'dotenv/config'
import { z } from 'zod'

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    FRONTEND_URL: z.string().url(),
    SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
    EMAIL_API_KEY: z.string().optional(),
    IMAGE_STORAGE_URL: z.string().optional(),
    IMAGE_STORAGE_KEY: z.string().optional(),
  })
  .refine((v) => !(v.NODE_ENV === 'production' && v.SESSION_SECRET.startsWith('replace_with')), {
    message: 'SESSION_SECRET still has the placeholder value',
    path: ['SESSION_SECRET'],
  })

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:')
  for (const issue of parsed.error.issues) {
    console.error(` - ${issue.path.map(String).join('.')}: ${issue.message}`)
  }
  process.exit(1)
}

export const env = parsed.data