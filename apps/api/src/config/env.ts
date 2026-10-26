import 'dotenv/config'
import path from 'node:path'
import { z } from 'zod'

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    FRONTEND_URL: z.string().url(),
    SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
    BCRYPT_COST: z.coerce.number().int().min(4).max(15).default(12),
    AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(50),
    LOGIN_MAX_FAILURES: z.coerce.number().int().min(3).max(20).default(5),
    LOGIN_LOCK_MINUTES: z.coerce.number().int().min(1).max(240).default(15),
    REQUIRE_ADMIN_2FA: z.enum(['true', 'false']).optional(),
    ENABLE_API_DOCS: z.enum(['true', 'false']).optional(),
    EMAIL_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().default('UniKamp <onboarding@resend.dev>'),
    PUBLIC_API_URL: z.string().url().default('http://localhost:4000'),
    IMAGE_STORAGE_DRIVER: z.enum(['local', 'cloudinary']).default('local'),
    UPLOAD_DIR: z.string().default(path.resolve(process.cwd(), 'uploads')),
    CLOUDINARY_URL: z.string().optional(),
  })
  .refine((v) => !(v.NODE_ENV === 'production' && v.SESSION_SECRET.startsWith('replace_with')), {
    message: 'SESSION_SECRET still has the placeholder value',
    path: ['SESSION_SECRET'],
  })
  .refine((v) => !(v.NODE_ENV === 'production' && v.BCRYPT_COST < 10), {
    message: 'BCRYPT_COST must be at least 10 in production',
    path: ['BCRYPT_COST'],
  })
  .refine((v) => v.IMAGE_STORAGE_DRIVER !== 'cloudinary' || !!v.CLOUDINARY_URL?.startsWith('cloudinary://'), {
    message: 'CLOUDINARY_URL (cloudinary://key:secret@cloud_name) is required when IMAGE_STORAGE_DRIVER=cloudinary',
    path: ['CLOUDINARY_URL'],
  })
  .refine((v) => !(v.NODE_ENV === 'production' && v.IMAGE_STORAGE_DRIVER === 'local'), {
    message: 'Local image storage is wiped on every redeploy. Use IMAGE_STORAGE_DRIVER=cloudinary in production',
    path: ['IMAGE_STORAGE_DRIVER'],
  })

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:')
  for (const issue of parsed.error.issues) {
    console.error(` - ${issue.path.map(String).join('.')}: ${issue.message}`)
  }
  process.exit(1)
}

const data = parsed.data

export const env = {
  ...data,
  // Administrators must use two-factor in production unless explicitly switched off
  requireAdminTwoFactor: data.REQUIRE_ADMIN_2FA ? data.REQUIRE_ADMIN_2FA === 'true' : data.NODE_ENV === 'production',
  // API docs are on in development and test, off in production unless explicitly switched on
  enableApiDocs: data.ENABLE_API_DOCS ? data.ENABLE_API_DOCS === 'true' : data.NODE_ENV !== 'production',
}