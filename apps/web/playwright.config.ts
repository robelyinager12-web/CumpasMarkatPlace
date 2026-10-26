import { defineConfig, devices } from '@playwright/test'
import os from 'node:os'
import path from 'node:path'

// Separate ports and a separate database, so these tests never touch your development data or collide with `pnpm dev`.
const API_PORT = 4100
const WEB_PORT = 3100
const E2E_DB = process.env.E2E_DATABASE_URL ?? 'postgresql://unikamp:unikamp_dev_only@localhost:5432/unikamp_e2e'
const REPO_ROOT = path.resolve(__dirname, '../..')

const apiEnv = {
  ...process.env,
  NODE_ENV: 'test',
  PORT: String(API_PORT),
  DATABASE_URL: E2E_DB,
  FRONTEND_URL: `http://localhost:${WEB_PORT}`,
  PUBLIC_API_URL: `http://localhost:${API_PORT}`,
  SESSION_SECRET: 'e2e-only-secret-e2e-only-secret-1234',
  BCRYPT_COST: '4',
  AUTH_RATE_LIMIT_MAX: '1000',
  IMAGE_STORAGE_DRIVER: 'local',
  UPLOAD_DIR: path.join(os.tmpdir(), 'unikamp-e2e-uploads'),
} as Record<string, string>

const webEnv = {
  ...process.env,
  NODE_ENV: 'production',
  NEXT_PUBLIC_API_URL: `http://localhost:${API_PORT}/api/v1`,
  NEXT_DIST_DIR: '.next-e2e',
} as Record<string, string>

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'pnpm --filter @unikamp/api exec tsx src/server.ts',
      cwd: REPO_ROOT,
      url: `http://localhost:${API_PORT}/api/v1/health`,
      env: apiEnv,
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: `pnpm --filter @unikamp/web exec next build && pnpm --filter @unikamp/web exec next start -p ${WEB_PORT}`,
      cwd: REPO_ROOT,
      url: `http://localhost:${WEB_PORT}`,
      env: webEnv,
      reuseExistingServer: false,
      timeout: 300_000,
    },
  ],
})