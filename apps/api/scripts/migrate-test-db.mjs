import { spawnSync } from 'node:child_process'

const url =
  process.env.TEST_DATABASE_URL ?? 'postgresql://unikamp:unikamp_dev_only@localhost:5432/unikamp_test'

const result = spawnSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, DATABASE_URL: url },
})

process.exit(result.status ?? 1)