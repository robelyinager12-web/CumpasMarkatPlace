process.env.NODE_ENV = 'test'
// API tests use their own database so dev data is never touched. Run: pnpm --filter @unikamp/api test:migrate
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://unikamp:unikamp_dev_only@localhost:5432/unikamp_test'
process.env.FRONTEND_URL ??= 'http://localhost:3000'
process.env.SESSION_SECRET ??= 'test-only-secret-test-only-secret-1234'
process.env.BCRYPT_COST = '4'
process.env.AUTH_RATE_LIMIT_MAX = '1000'