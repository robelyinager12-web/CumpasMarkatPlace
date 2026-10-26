import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { createListing, signUp } from './helpers'

async function seriousProblems(page: Page) {
  await page.waitForLoadState('networkidle')
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  return results.violations
    .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
    .map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.length} place(s), e.g. ${violation.nodes[0]?.target.join(' ')})`)
}

test.describe('accessibility (WCAG 2.1 A and AA, serious and critical problems)', () => {
  for (const [name, url] of [
    ['home page', '/'],
    ['marketplace', '/marketplace'],
    ['log in', '/auth/login'],
    ['register', '/auth/register'],
    ['safety guide', '/safety'],
    ['terms', '/terms'],
    ['privacy policy', '/privacy'],
  ]) {
    test(`${name} has none`, async ({ page }) => {
      await page.goto(url)
      expect(await seriousProblems(page)).toEqual([])
    })
  }

  test('a listing page and the signed-in dashboard have none', async ({ page }) => {
    await signUp(page.request, { label: 'a11y' })
    const product = await createListing(page.request)

    await page.goto(`/products/${product.id}`)
    expect(await seriousProblems(page)).toEqual([])

    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: /Welcome/ })).toBeVisible()
    expect(await seriousProblems(page)).toEqual([])
  })
})