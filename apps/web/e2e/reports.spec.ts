import { expect, test } from '@playwright/test'
import { createListing, newActor, signUp } from './helpers'

test.describe('reports', () => {
  test('a student can report a listing and follow its status', async ({ browser }) => {
    const seller = await newActor(browser, { label: 'seller' })
    const product = await createListing(seller.context.request)
    const reporter = await newActor(browser, { label: 'reporter' })

    await reporter.page.goto(`/products/${product.id}`)
    await expect(reporter.page.getByRole('button', { name: 'Log out' })).toBeVisible()
    await reporter.page.getByRole('button', { name: 'Report this listing' }).click()
    await reporter.page.getByLabel('Reason').selectOption({ label: 'Scam or fraud' })
    await reporter.page.getByRole('button', { name: 'Send report' }).click()
    await expect(reporter.page.getByText('Thank you. Our team will review your report.')).toBeVisible()

    await reporter.page.goto('/dashboard/reports')
    await expect(reporter.page.getByText(product.title)).toBeVisible()
    await expect(reporter.page.getByText(/Waiting for review/)).toBeVisible()

    await Promise.all([seller.context.close(), reporter.context.close()])
  })

  test('the report form explains what is missing', async ({ browser }) => {
    const seller = await newActor(browser, { label: 'seller' })
    const product = await createListing(seller.context.request)
    const reporter = await newActor(browser, { label: 'reporter' })

    await reporter.page.goto(`/products/${product.id}`)
    await expect(reporter.page.getByRole('button', { name: 'Log out' })).toBeVisible()
    await reporter.page.getByRole('button', { name: 'Report this listing' }).click()

    await reporter.page.getByRole('button', { name: 'Send report' }).click()
    await expect(reporter.page.getByRole('alert').filter({ hasText: 'Choose a reason' })).toBeVisible()

    await reporter.page.getByLabel('Reason').selectOption({ label: 'Something else' })
    await reporter.page.getByRole('button', { name: 'Send report' }).click()
    await expect(
      reporter.page.getByRole('alert').filter({ hasText: 'Please describe the problem (at least 10 characters)' }),
    ).toBeVisible()

    await Promise.all([seller.context.close(), reporter.context.close()])
  })

  test('a visitor who tries to report is sent to log in', async ({ page, request }) => {
    await signUp(request, { label: 'seller' })
    const product = await createListing(request)

    await page.goto(`/products/${product.id}`)
    await page.getByRole('button', { name: 'Report this listing' }).click()
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})