import { expect, test } from '@playwright/test'
import { PNG, createListing, signUp, uniqueTitle } from './helpers'

test.describe('listings', () => {
  test('a verified student can create, publish, edit and mark a listing as sold', async ({ page }) => {
    await signUp(page.request, { label: 'seller' })
    const title = uniqueTitle('Calculus textbook')

    await page.goto('/sell/new')
    await page.getByLabel('Title').fill(title)
    await page.getByLabel('Description').fill('Good condition, a few notes in the margin.')
    await page.getByLabel('Category').selectOption({ index: 1 })
    await page.getByLabel('Price (ETB)').fill('450')
    await page.locator('input[type="file"]').setInputFiles({ name: 'photo.png', mimeType: 'image/png', buffer: PNG })
    await page.getByRole('button', { name: 'Publish listing' }).click()

    await expect(page).toHaveURL(/\/products\//)
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
    await expect(page.getByText(/ETB\s*450/).first()).toBeVisible()

    // it is findable in the marketplace
    await page.goto(`/marketplace?q=${encodeURIComponent(title)}`)
    await expect(page.getByRole('heading', { name: title })).toBeVisible()

    // edit the price from the dashboard
    await page.goto('/dashboard/listings')
    const row = page.locator('li').filter({ hasText: title })
    await row.getByRole('link', { name: 'Edit' }).click()
    await page.getByLabel('Price (ETB)').fill('500')
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page).toHaveURL(/\/dashboard\/listings/)
    await expect(page.locator('li').filter({ hasText: title })).toContainText(/ETB\s*500/)

    // marking it as sold removes it from search, and the row says so
    await page.locator('li').filter({ hasText: title }).getByRole('button', { name: 'Mark as sold' }).click()
    await expect(page.locator('li').filter({ hasText: title })).toContainText('Sold')
    await page.goto(`/marketplace?q=${encodeURIComponent(title)}`)
    await expect(page.getByText('Nothing matches your search')).toBeVisible()
  })

  test('the listing form shows what is wrong', async ({ page }) => {
    await signUp(page.request)
    await page.goto('/sell/new')
    await page.getByRole('button', { name: 'Publish listing' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'Title must be at least 3 characters' })).toBeVisible()
    await expect(page.getByRole('alert').filter({ hasText: 'Select a category' })).toBeVisible()
  })

  test('an unverified email is asked to verify before selling', async ({ page }) => {
    await signUp(page.request, { verified: false })
    await page.goto('/sell/new')
    await expect(page.getByRole('heading', { name: 'Verify your email to sell' })).toBeVisible()
  })

  test('only the owner can open the edit page', async ({ page, request }) => {
    await signUp(request, { label: 'owner' })
    const product = await createListing(request)

    await signUp(page.request, { label: 'stranger' })
    await page.goto(`/sell/${product.id}/edit`)
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  })
})