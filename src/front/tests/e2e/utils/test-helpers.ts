/**
 * Test utilities and helper functions
 */

import type { Page, Response } from '@playwright/test';

/**
 * Generate a unique identifier for test data
 */
export function generateTestId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate test tenant data
 */
export function generateTestTenant() {
  const id = generateTestId();
  return {
    name: `テストテナント ${id}`,
    domains: [`test-${id}.example.com`],
  };
}

/**
 * Generate test user data
 */
export function generateTestUser() {
  const id = generateTestId();
  return {
    user_id: `user-${id}@example.com`,
    name: `テストユーザー ${id}`,
    password: 'TestPassword123!',
  };
}

/**
 * Wait for API response
 */
export async function waitForApiResponse(page: Page, urlPattern: string | RegExp): Promise<Response> {
  return page.waitForResponse((response: Response) => {
    const url = response.url();
    if (typeof urlPattern === 'string') {
      return url.includes(urlPattern);
    }
    return urlPattern.test(url);
  });
}

/**
 * Check if element is visible
 */
export async function isVisible(page: Page, selector: string): Promise<boolean> {
  try {
    const element = await page.locator(selector);
    return await element.isVisible();
  } catch {
    return false;
  }
}
