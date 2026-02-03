import { test as base } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Test fixtures for authentication and common setup
 */
export const test = base.extend<{ authenticatedPage: Page }>({
  // Authenticated page fixture
  authenticatedPage: async ({ page }, use) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Fill in credentials (using default admin user)
    await page.fill('input[name="user_id"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    // Submit login form
    await page.click('button[type="submit"]');
    
    // Wait for navigation to complete
    await page.waitForURL('/');
    
    // Use the authenticated page
    await use(page);
  },
});

export { expect } from '@playwright/test';
