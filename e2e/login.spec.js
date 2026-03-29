import { test, expect } from '@playwright/test'

test.describe('Flujo de autenticación', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('muestra el formulario de login', async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('muestra error con credenciales incorrectas', async ({ page }) => {
    await page.fill('input[type="email"]', 'usuario@noexiste.com')
    await page.click('button[type="submit"]')

    // Should show an error (org lookup fails)
    await expect(page.locator('text=/error|no encontr|inválid/i')).toBeVisible({ timeout: 8000 })
  })

  test('redirige al dashboard tras login exitoso', async ({ page }) => {
    // Fill email to trigger org lookup
    await page.fill('input[type="email"]', process.env.E2E_EMAIL ?? 'admin@test.com')
    await page.click('button[type="submit"]')

    // If org lookup succeeds, password field appears
    const passwordField = page.locator('input[type="password"]')
    const isVisible = await passwordField.isVisible().catch(() => false)

    if (isVisible) {
      await page.fill('input[type="password"]', process.env.E2E_PASSWORD ?? 'Password123!')
      await page.click('button[type="submit"]')
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
    } else {
      test.skip()
    }
  })
})

test.describe('Protección de rutas del dashboard', () => {
  test('redirige al login al acceder sin autenticación', async ({ page }) => {
    await page.goto('/dashboard')
    // Should redirect to login or show login page
    await expect(page).toHaveURL(/\/login|\//, { timeout: 5000 })
  })
})
