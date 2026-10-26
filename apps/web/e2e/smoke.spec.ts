import { expect, test } from '@playwright/test'
import { API } from './helpers'

test.describe('smoke', () => {
  test('the home page loads with its main sections', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Buy Smart. Sell Easy. Campus Life Made Affordable.' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Shop by category' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Recently listed' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'How UniKamp works' })).toBeVisible()
  })

  test('footer pages open', async ({ page }) => {
    await page.goto('/')
    for (const [link, heading] of [
      ['Safety', 'Safety guide'],
      ['Terms', 'Terms of Service'],
      ['Privacy', 'Privacy Policy'],
      ['About', 'About UniKamp'],
      ['Contact', 'Contact us'],
    ]) {
      await page.getByRole('navigation', { name: 'Footer' }).getByRole('link', { name: link }).click()
      await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible()
      await page.goto('/')
    }
  })

  test('the legal pages say they are drafts until a lawyer has reviewed them', async ({ page }) => {
    await page.goto('/terms')
    await expect(page.getByRole('note')).toContainText('not yet been reviewed by a lawyer')
  })

  test('unknown pages show a helpful 404', async ({ page }) => {
    await page.goto('/this-page-does-not-exist')
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  })

  test('the site sends security headers and hides what it runs on', async ({ request }) => {
    const headers = (await request.get('/')).headers()
    expect(headers['x-frame-options']).toBe('DENY')
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(headers['x-powered-by']).toBeUndefined()
  })

  test('the API reports healthy and serves its documentation in development', async ({ request }) => {
    expect((await request.get(`${API}/health`)).ok()).toBeTruthy()
    expect((await request.get(`${API}/health/ready`)).ok()).toBeTruthy()
    const spec = await (await request.get(`${API}/docs/openapi.json`)).json()
    expect(spec.openapi).toBe('3.0.3')
  })

  test('the keyboard skip link jumps past the navigation', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Skip to main content' })
    await expect(skip).toBeFocused()
    await skip.press('Enter')
    await expect(page).toHaveURL(/#main-content$/)
  })
})