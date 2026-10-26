import { expect, test } from '@playwright/test'
import { createListing, signUp } from './helpers'

test.describe('favorites', () => {
  test('a signed-in student can save, see and remove a favorite', async ({ page, request }) => {
    await signUp(request, { label: 'seller' })
    const product = await createListing(request)

    await signUp(page.request, { label: 'buyer' })
    await page.goto(`/products/${product.id}`)
    // wait until the page knows the buyer is signed in, otherwise the heart sends them to the login page
    await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible()

    const saved = page.waitForResponse((r) => r.url().includes('/favorites/') && r.request().method() === 'POST')
    await page.getByRole('button', { name: 'Save to favorites' }).first().click()
    await saved
    await expect(page.getByRole('button', { name: 'Remove from favorites' }).first()).toHaveAttribute('aria-pressed', 'true')

    await page.goto('/favorites')
    await expect(page.getByRole('heading', { name: product.title })).toBeVisible()

    // still saved after a reload, because it is stored on the server
    await page.goto(`/products/${product.id}`)
    await expect(page.getByRole('button', { name: 'Remove from favorites' }).first()).toBeVisible()

    const removed = page.waitForResponse((r) => r.url().includes('/favorites/') && r.request().method() === 'DELETE')
    await page.getByRole('button', { name: 'Remove from favorites' }).first().click()
    await removed
    await page.goto('/favorites')
    await expect(page.getByText('No favorites yet')).toBeVisible()
  })

  test('a visitor who taps the heart is sent to log in', async ({ page, request }) => {
    await signUp(request, { label: 'seller' })
    const product = await createListing(request)

    await page.goto(`/products/${product.id}`)
    await page.getByRole('button', { name: 'Save to favorites' }).first().click()
    await expect(page).toHaveURL(/\/auth\/login\?next=/)
  })
})