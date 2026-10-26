import { expect, test } from '@playwright/test'
import { createListing, signUp, uniqueTitle } from './helpers'

test.describe('marketplace search', () => {
  // Two listings that share a unique word, so the results are the same on every run
  const word = uniqueTitle('findme').replace(' ', '')
  const cheap = `${word} cheap`
  const pricey = `${word} pricey`

  test.beforeAll(async ({ playwright }) => {
    const context = await playwright.request.newContext()
    await signUp(context, { label: 'seller' })
    await createListing(context, { title: cheap, price: 100 })
    await createListing(context, { title: pricey, price: 900 })
    await context.dispose()
  })

  test('the filter form searches real listings', async ({ page }) => {
    await page.goto('/marketplace')
    const filters = page.locator('aside')
    await filters.getByLabel('Search').fill(word)
    await filters.getByRole('button', { name: 'Apply filters' }).click()

    await expect(page).toHaveURL(new RegExp(`q=${word}`))
    await expect(page.getByRole('heading', { name: cheap })).toBeVisible()
    await expect(page.getByRole('heading', { name: pricey })).toBeVisible()
    await expect(page.getByText('2 listings')).toBeVisible()
  })

  test('price filters change the results', async ({ page }) => {
    await page.goto(`/marketplace?q=${word}&maxPrice=500`)
    await expect(page.getByRole('heading', { name: cheap })).toBeVisible()
    await expect(page.getByRole('heading', { name: pricey })).toHaveCount(0)

    await page.goto(`/marketplace?q=${word}&minPrice=500`)
    await expect(page.getByRole('heading', { name: pricey })).toBeVisible()
    await expect(page.getByRole('heading', { name: cheap })).toHaveCount(0)
  })

  test('sorting puts the highest price first', async ({ page }) => {
    await page.goto(`/marketplace?q=${word}&sort=price_desc`)
    await expect(page.getByRole('heading', { level: 3 }).first()).toHaveText(pricey)
    await page.goto(`/marketplace?q=${word}&sort=price_asc`)
    await expect(page.getByRole('heading', { level: 3 }).first()).toHaveText(cheap)
  })

  test('the sort menu updates the address', async ({ page }) => {
    await page.goto(`/marketplace?q=${word}`)
    await page.getByLabel('Sort by').selectOption('price_asc')
    await expect(page).toHaveURL(/sort=price_asc/)
  })

  test('a search with no matches shows a helpful message', async ({ page }) => {
    await page.goto('/marketplace?q=zzzzqqqqnothingmatches')
    await expect(page.getByText('Nothing matches your search')).toBeVisible()
  })

  test('an impossible price range is reported instead of breaking the page', async ({ page }) => {
    await page.goto('/marketplace?minPrice=500&maxPrice=100')
    await expect(page.getByText('We could not load listings')).toBeVisible()
  })
})