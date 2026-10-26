import { expect, test } from '@playwright/test'
import { PASSWORD, loginViaUi, signUp, uniqueEmail } from './helpers'

test.describe('accounts', () => {
  test('a new student can register, log out and log back in', async ({ page }) => {
    const email = uniqueEmail('reg')

    await page.goto('/auth/register')
    await page.getByLabel('Full name').fill('Abebe Kebede')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('University').selectOption({ index: 1 })
    await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
    await page.getByLabel('Confirm password').fill(PASSWORD)
    await page.getByRole('button', { name: 'Create account' }).click()

    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByRole('heading', { name: 'Welcome, Abebe Kebede' })).toBeVisible()

    await page.getByRole('button', { name: 'Log out' }).click()
    await expect(page).toHaveURL(/\/$/)

    await loginViaUi(page, email)
    await expect(page.getByRole('heading', { name: 'Welcome, Abebe Kebede' })).toBeVisible()
  })

  test('registration shows field errors instead of silently failing', async ({ page }) => {
    await page.goto('/auth/register')
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'Enter your full name' })).toBeVisible()
    await expect(page.getByRole('alert').filter({ hasText: 'Select your university' })).toBeVisible()
  })

  test('a wrong password gives one generic message', async ({ page, request }) => {
    const { email } = await signUp(request)
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill('Wrong-password1')
    await page.getByRole('button', { name: 'Log in', exact: true }).click()
    await expect(page.getByText('Incorrect email or password')).toBeVisible()
  })

  test('protected pages send visitors to log in and then bring them back', async ({ page, request }) => {
    const { email } = await signUp(request)
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/auth\/login\?next=%2Fdashboard/)
    await loginViaUi(page, email)
    await expect(page).toHaveURL(/\/dashboard$/)
  })

  test('logging out ends the session', async ({ page }) => {
    await signUp(page.request)
    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Log out' }).click()
    await expect(page).toHaveURL(/\/$/)
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('the admin area does not reveal itself to students', async ({ page }) => {
    await signUp(page.request)
    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  })

  test('forgot password answers the same for any email', async ({ page }) => {
    await page.goto('/auth/forgot-password')
    await page.getByLabel('Email').fill(uniqueEmail('nobody'))
    await page.getByRole('button', { name: 'Send reset link' }).click()
    await expect(page.getByText('If an account exists for this email, a reset link has been sent.')).toBeVisible()
  })
})