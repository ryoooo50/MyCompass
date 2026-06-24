import { test, expect } from '@playwright/test'

test.describe('ダッシュボード基本', () => {
  test('未認証時は /login にリダイレクト', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/login/)
  })

  test('ログインページが表示される', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('h1')).toBeVisible()
  })
})
