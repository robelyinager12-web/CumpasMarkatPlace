import { execSync } from 'node:child_process'
import path from 'node:path'
import { expect, type APIRequestContext, type Browser, type Page } from '@playwright/test'

export const WEB = process.env.E2E_WEB_URL ?? 'http://localhost:3100'
export const API = process.env.E2E_API_URL ?? 'http://localhost:4100/api/v1'
const E2E_DB = process.env.E2E_DATABASE_URL ?? 'postgresql://unikamp:unikamp_dev_only@localhost:5432/unikamp_e2e'
const REPO_ROOT = path.resolve(__dirname, '../../..')

export const PASSWORD = 'E2eSecret123'
export const PILOT_UNIVERSITY = 'Addis Ababa University'

// 1x1 PNG
export const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

const token = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
export const uniqueEmail = (label = 'e2e') => `${label}.${token()}@example.test`
export const uniqueTitle = (label: string) => `${label} ${token()}`

// Does what an email link or the create-admin script would do, against the e2e database only
function databaseHelper(command: 'verify-email' | 'make-admin', email: string) {
  execSync(`pnpm --filter @unikamp/api exec tsx scripts/e2e-helper.ts ${command} ${email}`, {
    cwd: REPO_ROOT,
    env: { ...process.env, DATABASE_URL: E2E_DB },
    stdio: 'pipe',
  })
}

// Registers through the API. The session cookie lands in the browser context the request belongs to.
export async function signUp(
  request: APIRequestContext,
  options: { verified?: boolean; admin?: boolean; label?: string } = {},
) {
  const universities = (await (await request.get(`${API}/universities`)).json()).data.universities as {
    id: string
    name: string
  }[]
  const university = universities.find((item) => item.name === PILOT_UNIVERSITY) ?? universities[0]

  const email = uniqueEmail(options.label)
  const response = await request.post(`${API}/auth/register`, {
    data: { fullName: 'E2E Student', email, password: PASSWORD, universityId: university.id },
  })
  expect(response.ok(), await response.text()).toBeTruthy()

  if (options.verified !== false) databaseHelper('verify-email', email)
  if (options.admin) databaseHelper('make-admin', email)
  return { email, password: PASSWORD }
}

// A published listing with one photo, made through the API for speed
export async function createListing(request: APIRequestContext, options: { title?: string; price?: number } = {}) {
  const categories = (await (await request.get(`${API}/categories`)).json()).data.categories as { id: string }[]
  const created = await request.post(`${API}/products`, {
    data: {
      title: options.title ?? uniqueTitle('E2E item'),
      description: 'A listing created by the end-to-end tests.',
      categoryId: categories[0].id,
      price: options.price ?? 250,
      condition: 'GOOD',
      negotiable: false,
    },
  })
  expect(created.ok(), await created.text()).toBeTruthy()
  const product = (await created.json()).data.product as { id: string; title: string }

  const upload = await request.post(`${API}/products/${product.id}/images`, {
    multipart: { images: { name: 'photo.png', mimeType: 'image/png', buffer: PNG } },
  })
  expect(upload.ok(), await upload.text()).toBeTruthy()

  const publish = await request.patch(`${API}/products/${product.id}`, { data: { status: 'ACTIVE' } })
  expect(publish.ok(), await publish.text()).toBeTruthy()
  return product
}

export async function loginViaUi(page: Page, email: string, password = PASSWORD) {
  await page.goto('/auth/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Log in', exact: true }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}

// A separate browser profile (its own cookies) with a freshly registered account, for tests with two people
export async function newActor(
  browser: Browser,
  options: { verified?: boolean; admin?: boolean; label?: string } = {},
) {
  const context = await browser.newContext({ baseURL: WEB })
  const page = await context.newPage()
  const account = await signUp(context.request, options)
  return { context, page, ...account }
}