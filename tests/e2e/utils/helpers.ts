/**
 * E2E Test Utilities
 * 
 * Helper functions for Playwright E2E tests
 */

import { Page, expect as playwrightExpect } from '@playwright/test';

/**
 * Login helper for E2E tests
 */
export async function login(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/login');
  
  // Wait for login form
  await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 5000 });
  
  // Fill in credentials
  await page.fill('input[name="email"], input[type="email"]', email);
  await page.fill('input[name="password"], input[type="password"]', password);
  
  // Click login button
  await page.click('button[type="submit"], button:has-text("Login"), button:has-text("ログイン")');
  
  // Wait for navigation after login
  await page.waitForLoadState('networkidle');
}

/**
 * Common logout button selectors for different languages and UI patterns
 */
const LOGOUT_SELECTORS = [
  'button:has-text("Logout")',
  'button:has-text("ログアウト")',
  'a:has-text("Logout")',
  'a:has-text("ログアウト")',
];

/**
 * Logout helper for E2E tests
 */
export async function logout(page: Page): Promise<void> {
  for (const selector of LOGOUT_SELECTORS) {
    try {
      const element = await page.$(selector);
      if (element) {
        await element.click();
        await page.waitForLoadState('networkidle');
        return;
      }
    } catch (error) {
      // Try next selector
    }
  }
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  // Check for common indicators of logged-in state
  const indicators = [
    'button:has-text("Logout")',
    'button:has-text("ログアウト")',
    '[data-testid="user-menu"]',
    '[data-testid="profile-icon"]',
  ];
  
  for (const selector of indicators) {
    try {
      const element = await page.$(selector);
      if (element) {
        return true;
      }
    } catch (error) {
      // Continue checking
    }
  }
  
  return false;
}

/**
 * Wait for API response
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  timeout: number = 10000
): Promise<any> {
  return page.waitForResponse(
    response => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout }
  );
}

/**
 * Check for error messages on page
 */
export async function hasErrorMessage(page: Page): Promise<boolean> {
  const errorSelectors = [
    '.error',
    '.alert-error',
    '[role="alert"]',
    '.error-message',
    '[data-testid="error-message"]',
  ];
  
  for (const selector of errorSelectors) {
    try {
      const element = await page.$(selector);
      if (element && await element.isVisible()) {
        return true;
      }
    } catch (error) {
      // Continue checking
    }
  }
  
  return false;
}

/**
 * Get error message text
 */
export async function getErrorMessage(page: Page): Promise<string | null> {
  const errorSelectors = [
    '.error',
    '.alert-error',
    '[role="alert"]',
    '.error-message',
    '[data-testid="error-message"]',
  ];
  
  for (const selector of errorSelectors) {
    try {
      const element = await page.$(selector);
      if (element && await element.isVisible()) {
        return await element.textContent();
      }
    } catch (error) {
      // Continue checking
    }
  }
  
  return null;
}

/**
 * Check if element is visible on page
 */
export async function isVisible(page: Page, selector: string): Promise<boolean> {
  try {
    const element = await page.$(selector);
    return element ? await element.isVisible() : false;
  } catch (error) {
    return false;
  }
}

/**
 * Check if button/element is enabled
 */
export async function isEnabled(page: Page, selector: string): Promise<boolean> {
  try {
    const element = await page.$(selector);
    return element ? await element.isEnabled() : false;
  } catch (error) {
    return false;
  }
}

/**
 * Wait for element to be visible
 */
export async function waitForVisible(
  page: Page,
  selector: string,
  timeout: number = 5000
): Promise<void> {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

/**
 * Wait for element to be hidden
 */
export async function waitForHidden(
  page: Page,
  selector: string,
  timeout: number = 5000
): Promise<void> {
  await page.waitForSelector(selector, { state: 'hidden', timeout });
}

/**
 * Mock credentials for E2E tests
 */
export const e2eCredentials = {
  admin: {
    email: 'admin@example.com',
    password: 'Admin123!',
  },
  user: {
    email: 'user@example.com',
    password: 'User123!',
  },
  viewer: {
    email: 'viewer@example.com',
    password: 'Viewer123!',
  },
};

/**
 * Setup authenticated page
 */
export async function setupAuthenticatedPage(
  page: Page,
  credentials = e2eCredentials.user
): Promise<void> {
  await page.goto('/');
  
  // Check if already logged in
  if (await isLoggedIn(page)) {
    return;
  }
  
  // Login if not already authenticated
  await login(page, credentials.email, credentials.password);
}

/**
 * Take screenshot with custom name
 */
export async function takeScreenshot(
  page: Page,
  name: string
): Promise<void> {
  await page.screenshot({
    path: `test-results/screenshots/${name}.png`,
    fullPage: true,
  });
}

/**
 * Check for loading indicators
 */
export async function isLoading(page: Page): Promise<boolean> {
  const loadingSelectors = [
    '.loading',
    '.spinner',
    '[data-testid="loading"]',
    '[aria-busy="true"]',
  ];
  
  for (const selector of loadingSelectors) {
    try {
      const element = await page.$(selector);
      if (element && await element.isVisible()) {
        return true;
      }
    } catch (error) {
      // Continue checking
    }
  }
  
  return false;
}

/**
 * Wait for loading to complete
 */
export async function waitForLoadingComplete(
  page: Page,
  timeout: number = 10000
): Promise<void> {
  const startTime = Date.now();
  
  while (await isLoading(page)) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for loading to complete');
    }
    await page.waitForTimeout(100);
  }
}
