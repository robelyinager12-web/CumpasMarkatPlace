import { expect, test } from '@playwright/test'
import { createListing, newActor, signUp } from './helpers'

test.describe('messaging', () => {
  test('a buyer and a seller can chat, and a block closes the conversation', async ({ browser }) => {
    const seller = await newActor(browser, { label: 'seller' })
    const product = await createListing(seller.context.request)
    const buyer = await newActor(browser, { label: 'buyer' })

    // the buyer contacts the seller
    await buyer.page.goto(`/products/${product.id}`)
    await buyer.page.getByRole('button', { name: 'Contact seller' }).click()
    await buyer.page.getByRole('button', { name: 'Send message' }).click()
    await expect(buyer.page).toHaveURL(/\/messages\//)
    await expect(buyer.page.getByText('Hi, is this still available?')).toBeVisible()

    // the seller sees an unread badge and replies
    await seller.page.goto('/messages')
    await expect(seller.page.getByLabel('1 unread').first()).toBeVisible()
    await seller.page.getByRole('link', { name: /Hi, is this still available\?/ }).click()
    await seller.page.getByLabel('Message', { exact: true }).fill('Yes, it is available.')
    await seller.page.getByRole('button', { name: 'Send', exact: true }).click()
    await expect(seller.page.getByText('Yes, it is available.')).toBeVisible()

    // the reply reaches the buyer without a reload (the thread checks for new messages every few seconds)
    await expect(buyer.page.getByText('Yes, it is available.')).toBeVisible()

    // the buyer blocks the seller
    buyer.page.once('dialog', (dialog) => dialog.accept())
    await buyer.page.getByRole('button', { name: 'Block', exact: true }).click()
    await expect(buyer.page.getByText(/You blocked/)).toBeVisible()

    // the seller can no longer reply, and is not told why
    await seller.page.reload()
    await expect(seller.page.getByText('You can no longer reply to this conversation.')).toBeVisible()
    await expect(seller.page.getByText(/blocked/i)).toHaveCount(0)

    await buyer.context.close()
    await seller.context.close()
  })

  test('a visitor is asked to log in before contacting a seller', async ({ page, request }) => {
    await signUp(request, { label: 'seller' })
    const product = await createListing(request)
    await page.goto(`/products/${product.id}`)
    await expect(page.getByRole('link', { name: 'Log in to contact seller' })).toBeVisible()
  })

  test('only the two people in a conversation can open it', async ({ browser }) => {
    const seller = await newActor(browser, { label: 'seller' })
    const product = await createListing(seller.context.request)
    const buyer = await newActor(browser, { label: 'buyer' })

    await buyer.page.goto(`/products/${product.id}`)
    await buyer.page.getByRole('button', { name: 'Contact seller' }).click()
    await buyer.page.getByRole('button', { name: 'Send message' }).click()
    await expect(buyer.page).toHaveURL(/\/messages\//)
    const conversationUrl = buyer.page.url()

    const stranger = await newActor(browser, { label: 'stranger' })
    await stranger.page.goto(conversationUrl)
    await expect(stranger.page.getByRole('heading', { name: 'Page not found' })).toBeVisible()

    await Promise.all([buyer.context.close(), seller.context.close(), stranger.context.close()])
  })
})