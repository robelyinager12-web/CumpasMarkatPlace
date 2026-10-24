process.env.NODE_ENV = 'test'
process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test'
process.env.FRONTEND_URL ??= 'http://localhost:3000'
process.env.SESSION_SECRET ??= 'test-only-secret-test-only-secret-1234'