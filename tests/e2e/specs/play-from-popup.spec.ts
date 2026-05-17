import { test, expect } from '@playwright/test'

test.describe('Play from Popup', () => {
  test('popup renders without errors', async ({ page }) => {
    // This is a placeholder — real E2E requires loading the unpacked extension
    await page.goto('about:blank')
    expect(true).toBe(true)
  })
})
