import { expect, test } from '@playwright/test'
import { PASSWORD, signUp, uniqueEmail } from './helpers'
import { totpNow } from './totp'

test.describe('sign-in protection', () => {
  test('two-factor sign-in can be turned on and is then required', async ({ page }) => {
    const { email } = await signUp(page.request, { label: 'twofa' })

    await page.goto('/dashboard/security')
    await page.getByRole('button', { name: 'Set up two-factor sign-in' }).click()
    const secret = (await page.locator('code').first().innerText()).replace(/\s/g, '')
    await page.locator('#enable-code').fill(totpNow(secret))
    await page.getByRole('button', { name: 'Turn on' }).click()

    await expect(page.getByRole('heading', { name: 'Save your recovery codes' })).toBeVisible()
    await page.getByRole('button', { name: 'I have saved these codes' }).click()
    await expect(page.getByText('Two-factor sign-in is on.')).toBeVisible()

    await page.getByRole('button', { name: 'Log out' }).click()
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill(PASSWORD)
    await page.getByRole('button', { name: 'Log in', exact: true }).click()

    // the password alone is not enough
    await expect(page.getByLabel('Two-factor code')).toBeVisible()
    await page.getByLabel('Two-factor code').fill('000000')
    await page.getByRole('button', { name: 'Verify and log in' }).click()
    await expect(page.getByText('That code is incorrect or has expired')).toBeVisible()

    await page.getByLabel('Two-factor code').fill(totpNow(secret))
    await page.getByRole('button', { name: 'Verify and log in' }).click()
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('repeated wrong passwords lock the account for a while', async ({ page, request }) => {
    const { email } = await signUp(request, { label: 'lockout' })
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill(email)

    for (let attempt = 0; attempt < 5; attempt++) {
      await page.getByLabel('Password').fill('Wrong-password1')
      await page.getByRole('button', { name: 'Log in', exact: true }).click()
      await expect(page.getByText('Incorrect email or password')).toBeVisible()
    }

    await page.getByLabel('Password').fill(PASSWORD) // even the right password is refused now
    await page.getByRole('button', { name: 'Log in', exact: true }).click()
    await expect(page.getByText(/Too many failed attempts/)).toBeVisible()
  })

  test('a made-up email is locked the same way, so nothing is revealed', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill(uniqueEmail('ghost'))
    for (let attempt = 0; attempt < 5; attempt++) {
      await page.getByLabel('Password').fill('Wrong-password1')
      await page.getByRole('button', { name: 'Log in', exact: true }).click()
      await expect(page.getByText('Incorrect email or password')).toBeVisible()
    }
    await page.getByLabel('Password').fill('Wrong-password1')
    await page.getByRole('button', { name: 'Log in', exact: true }).click()
    await expect(page.getByText(/Too many failed attempts/)).toBeVisible()
  })
})