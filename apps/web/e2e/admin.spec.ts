import { expect, test } from '@playwright/test'
import { API, WEB, createListing, newActor } from './helpers'

test.describe('administration', () => {
  test('an administrator resolves a report and removes the listing', async ({ browser }) => {
    const seller = await newActor(browser, { label: 'seller' })
    const product = await createListing(seller.context.request)
    const reporter = await newActor(browser, { label: 'reporter' })
    const report = await reporter.context.request.post(`${API}/reports`, {
      data: { type: 'LISTING', targetId: product.id, reason: 'SCAM', details: 'Asked me to pay in advance' },
    })
    expect(report.ok(), await report.text()).toBeTruthy()

    const admin = await newActor(browser, { label: 'admin', admin: true })
    await admin.page.goto('/admin/reports')
    const item = admin.page.locator('li').filter({ hasText: product.title })
    await item.getByRole('button', { name: 'Resolve and remove listing' }).click()
    await admin.page.getByRole('button', { name: 'Resolve report' }).click()
    await expect(item).toHaveCount(0) // it left the pending queue

    // the listing is gone for everyone else
    const visitor = await browser.newContext({ baseURL: WEB })
    const visitorPage = await visitor.newPage()
    await visitorPage.goto(`/products/${product.id}`)
    await expect(visitorPage.getByRole('heading', { name: 'Page not found' })).toBeVisible()

    // the seller was told
    await seller.page.goto('/dashboard/notifications')
    await expect(seller.page.getByText(/was removed/)).toBeVisible()

    await Promise.all([seller.context.close(), reporter.context.close(), admin.context.close(), visitor.close()])
  })

  test('an administrator can suspend a student, who is then signed out', async ({ browser }) => {
    const student = await newActor(browser, { label: 'student' })
    const admin = await newActor(browser, { label: 'admin', admin: true })

    await admin.page.goto('/admin/users')
    await admin.page.getByLabel('Search users').fill(student.email)
    await admin.page.getByRole('button', { name: 'Search' }).click()
    const row = admin.page.locator('tr').filter({ hasText: student.email })
    await row.getByRole('button', { name: 'Suspend' }).click()
    await admin.page.getByLabel('Reason').fill('Repeated scam reports in testing')
    await admin.page.getByRole('button', { name: 'Suspend account' }).click()
    await expect(row).toContainText('Suspended')

    await student.page.goto('/dashboard')
    await expect(student.page).toHaveURL(/\/auth\/login/)

    // the action is in the audit log
    await admin.page.goto('/admin/audit-logs')
    await admin.page.getByLabel('Action contains').fill('suspended')
    await admin.page.getByRole('button', { name: 'Filter' }).click()
    await expect(admin.page.getByText('User suspended').first()).toBeVisible()

    await Promise.all([student.context.close(), admin.context.close()])
  })

  test('the dashboard shows real numbers and the admin link', async ({ browser }) => {
    const admin = await newActor(browser, { label: 'admin', admin: true })
    await admin.page.goto('/admin')
    await expect(admin.page.getByRole('heading', { name: 'Admin dashboard' })).toBeVisible()
    await expect(admin.page.getByText('Registered users')).toBeVisible()
    await expect(admin.page.getByText(/Revenue: Payments are not enabled yet/)).toBeVisible()
    await expect(admin.page.getByRole('link', { name: 'Admin', exact: true })).toBeVisible()
    await admin.context.close()
  })
})