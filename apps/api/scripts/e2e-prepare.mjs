import { PrismaClient } from '@prisma/client'
import { spawnSync } from 'node:child_process'

const url = process.env.E2E_DATABASE_URL ?? 'postgresql://unikamp:unikamp_dev_only@localhost:5432/unikamp_e2e'

if (!/e2e/i.test(url)) {
  console.error('E2E_DATABASE_URL must contain "e2e" so the tests can never run against real data.')
  process.exit(1)
}

// 1. Create the database if it does not exist yet
const parsed = new URL(url)
const dbName = parsed.pathname.slice(1)
if (!/^[A-Za-z0-9_]+$/.test(dbName)) {
  console.error('The database name may only contain letters, numbers and underscores.')
  process.exit(1)
}
parsed.pathname = '/postgres'
const admin = new PrismaClient({ datasourceUrl: parsed.toString() })
try {
  const rows = await admin.$queryRaw`SELECT 1 FROM pg_database WHERE datname = ${dbName}`
  if (rows.length === 0) {
    await admin.$executeRawUnsafe(`CREATE DATABASE "${dbName}"`)
    console.log(`Created database ${dbName}`)
  }
} finally {
  await admin.$disconnect()
}

// 2. Apply migrations and load the reference data (universities, categories, demo listings)
const env = { ...process.env, DATABASE_URL: url }
for (const args of [
  ['exec', 'prisma', 'migrate', 'deploy'],
  ['exec', 'prisma', 'db', 'seed'],
]) {
  const result = spawnSync('pnpm', args, { stdio: 'inherit', shell: true, env })
  if (result.status !== 0) process.exit(result.status ?? 1)
}