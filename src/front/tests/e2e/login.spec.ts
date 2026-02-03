import { test, expect } from '@playwright/test';

/**
 * Login Flow E2E Tests
 */
test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    // Check if login form elements are present
    await expect(page.locator('input[name="user_id"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    // Fill in valid credentials
    await page.fill('input[name="user_id"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password123');

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('/');

    // Verify we're on the dashboard
    await expect(page).toHaveURL('/');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    // Fill in invalid credentials
    await page.fill('input[name="user_id"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');

    // Submit the form
    await page.click('button[type="submit"]');

    // Should stay on login page
    await expect(page).toHaveURL('/login');

    // Should show error message
    const errorMessage = page.locator('text=/エラー|error|失敗/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('should show validation error for empty fields', async ({ page }) => {
    // Try to submit without filling fields
    await page.click('button[type="submit"]');

    // Should stay on login page
    await expect(page).toHaveURL('/login');
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.fill('input[name="user_id"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');

    // Find and click logout button
    const logoutButton = page.locator('button:has-text("ログアウト"), button:has-text("Logout")');
    await logoutButton.click();

    // Should redirect to login page
    await page.waitForURL('/login');
    await expect(page).toHaveURL('/login');
  });

  test('should handle session timeout', async ({ page }) => {
    // Login
    await page.fill('input[name="user_id"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');

    // Clear cookies to simulate session expiry
    await page.context().clearCookies();

    // Try to access protected route
    await page.goto('/tenants');

    // Should redirect to login
    await page.waitForURL('/login');
    await expect(page).toHaveURL('/login');
  });
});
