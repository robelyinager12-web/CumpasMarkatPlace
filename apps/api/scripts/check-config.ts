import { PrismaClient } from '@prisma/client'
import { env } from '../src/config/env.js'

// Pre-flight check: run it with your production values before (and after) deploying.
// The settings are validated first by src/config/env.ts, which prints what is wrong and stops.
type Level = 'ok' | 'warn' | 'fail'
const lines: { level: Level; text: string }[] = []
const add = (level: Level, text: string) => lines.push({ level, text })
const isLocalHost = (host: string) => ['localhost', '127.0.0.1', '::1', '[::1]'].includes(host)

add(
  env.NODE_ENV === 'production' ? 'ok' : 'warn',
  env.NODE_ENV === 'production' ? 'NODE_ENV is production' : `NODE_ENV is "${env.NODE_ENV}" (a live server must use "production")`,
)

const frontend = new URL(env.FRONTEND_URL)
if (isLocalHost(frontend.hostname)) add('fail', 'FRONTEND_URL points at localhost')
else if (frontend.protocol !== 'https:') add('fail', 'FRONTEND_URL must start with https://')
else add('ok', `FRONTEND_URL is ${frontend.origin}`)
if (frontend.pathname !== '/' || frontend.search) add('warn', 'FRONTEND_URL should be just the address, with nothing after the domain')

add('ok', `SESSION_SECRET has ${env.SESSION_SECRET.length} characters (the real one lives only on the server)`)
add(env.BCRYPT_COST >= 12 ? 'ok' : 'warn', `BCRYPT_COST is ${env.BCRYPT_COST} (12 is recommended)`)
add('ok', `TRUST_PROXY_HOPS is ${env.TRUST_PROXY_HOPS} (use 2 when the site is on Vercel and the API on Render, otherwise 1)`)

if (!env.EMAIL_API_KEY) add('fail', 'EMAIL_API_KEY is not set: nobody would receive verification or reset emails')
else add('ok', 'EMAIL_API_KEY is set')
if (/resend\.dev/i.test(env.EMAIL_FROM)) {
  add('warn', 'EMAIL_FROM uses resend.dev: Resend only delivers those to your own account email. Verify your domain and use an address on it')
} else {
  add('ok', `EMAIL_FROM is ${env.EMAIL_FROM}`)
}

add(env.IMAGE_STORAGE_DRIVER === 'cloudinary' ? 'ok' : 'warn', `Photos are stored with: ${env.IMAGE_STORAGE_DRIVER}`)
add(env.requireAdminTwoFactor ? 'ok' : 'warn', env.requireAdminTwoFactor ? 'Administrators must use two-factor' : 'Administrator two-factor is NOT enforced')
add(env.enableApiDocs ? 'warn' : 'ok', env.enableApiDocs ? 'API documentation is public (ENABLE_API_DOCS)' : 'API documentation is off')

const db = new URL(env.DATABASE_URL)
const sslmode = db.searchParams.get('sslmode')
if (isLocalHost(db.hostname)) add('warn', 'DATABASE_URL points at localhost')
else if (!sslmode || sslmode === 'disable') add('fail', 'DATABASE_URL needs ?sslmode=require for a hosted database')
else add('ok', `Database host: ${db.host} (sslmode=${sslmode})`)
if (db.searchParams.has('channel_binding')) add('warn', 'DATABASE_URL has channel_binding. If the connection fails, remove that part')

const prisma = new PrismaClient()
try {
  await prisma.$queryRaw`SELECT 1`
  add('ok', 'Connected to the database')

  try {
    const rows = await prisma.$queryRaw<{ n: number }[]>`SELECT COUNT(*)::int AS n FROM "_prisma_migrations" WHERE finished_at IS NOT NULL`
    add('ok', `${rows[0]?.n ?? 0} database migrations are applied`)
    const [categories, universities, admins] = await Promise.all([
      prisma.category.count({ where: { isActive: true } }),
      prisma.university.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
    ])
    add(categories > 0 ? 'ok' : 'warn', `${categories} active categories`)
    add(universities > 0 ? 'ok' : 'warn', `${universities} active universities`)
    add(admins > 0 ? 'ok' : 'warn', `${admins} administrator account(s)`)
  } catch {
    add('warn', 'No tables yet. The API applies the migrations the first time it starts')
  }
} catch {
  add('fail', 'Could not connect to the database. Check DATABASE_URL, and that the database is awake')
} finally {
  await prisma.$disconnect()
}

const symbol = { ok: '✓', warn: '!', fail: '✗' } as const
for (const line of lines) console.log(`  ${symbol[line.level]} ${line.text}`)
const failed = lines.filter((line) => line.level === 'fail').length
const warned = lines.filter((line) => line.level === 'warn').length
console.log(`\n${failed} problem(s), ${warned} warning(s).`)
process.exit(failed > 0 ? 1 : 0)