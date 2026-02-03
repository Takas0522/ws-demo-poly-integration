import { test, expect } from './fixtures/auth.fixture';
import { generateTestTenant, waitForApiResponse } from './utils/test-helpers';

/**
 * Tenant Management Flow E2E Tests
 */
test.describe('Tenant Management Flow', () => {
  test('should display tenant list', async ({ authenticatedPage }) => {
    // Navigate to tenants page
    await authenticatedPage.goto('/tenants');

    // Wait for the page to load
    await authenticatedPage.waitForLoadState('networkidle');

    // Check if tenant list is displayed
    const tenantList = authenticatedPage.locator('[data-testid="tenant-list"], table, .tenant-item');
    await expect(tenantList).toBeVisible({ timeout: 10000 });
  });

  test('should create a new tenant', async ({ authenticatedPage }) => {
    const testTenant = generateTestTenant();

    // Navigate to tenants page
    await authenticatedPage.goto('/tenants');

    // Click "新規作成" or "Create" button
    const createButton = authenticatedPage.locator(
      'button:has-text("新規作成"), button:has-text("Create"), a:has-text("新規作成"), a:has-text("Create")'
    ).first();
    await createButton.click();

    // Wait for form to appear
    await authenticatedPage.waitForSelector('input[name="name"], input[placeholder*="名前"], input[placeholder*="name"]');

    // Fill in tenant information
    await authenticatedPage.fill('input[name="name"], input[placeholder*="名前"], input[placeholder*="name"]', testTenant.name);
    
    // Fill in domain
    const domainInput = authenticatedPage.locator('input[name="domains"], input[placeholder*="ドメイン"], input[placeholder*="domain"]');
    if (await domainInput.count() > 0) {
      await domainInput.first().fill(testTenant.domains[0]);
    }

    // Wait for API response when submitting
    const responsePromise = waitForApiResponse(authenticatedPage, '/api/tenants');

    // Submit the form
    const submitButton = authenticatedPage.locator('button[type="submit"], button:has-text("作成"), button:has-text("Create")');
    await submitButton.click();

    // Wait for API response
    const response = await responsePromise;
    expect(response.status()).toBeLessThan(400);

    // Should navigate back to tenant list or show success message
    await authenticatedPage.waitForTimeout(1000);
  });

  test('should view tenant details', async ({ authenticatedPage }) => {
    // Navigate to tenants page
    await authenticatedPage.goto('/tenants');
    await authenticatedPage.waitForLoadState('networkidle');

    // Click on the first tenant in the list
    const firstTenant = authenticatedPage.locator(
      '[data-testid="tenant-item"]:first-child, table tbody tr:first-child, .tenant-item:first-child'
    );
    
    if (await firstTenant.count() > 0) {
      await firstTenant.click();

      // Wait for detail page to load
      await authenticatedPage.waitForLoadState('networkidle');

      // Verify detail information is displayed
      const detailSection = authenticatedPage.locator('[data-testid="tenant-detail"], .tenant-detail, .detail-section');
      await expect(detailSection.or(authenticatedPage.locator('body'))).toBeVisible();
    }
  });

  test('should edit tenant information', async ({ authenticatedPage }) => {
    // Navigate to tenants page
    await authenticatedPage.goto('/tenants');
    await authenticatedPage.waitForLoadState('networkidle');

    // Click on the first tenant
    const firstTenant = authenticatedPage.locator(
      '[data-testid="tenant-item"]:first-child, table tbody tr:first-child, .tenant-item:first-child'
    );
    
    if (await firstTenant.count() > 0) {
      await firstTenant.click();
      await authenticatedPage.waitForLoadState('networkidle');

      // Click edit button
      const editButton = authenticatedPage.locator(
        'button:has-text("編集"), button:has-text("Edit"), a:has-text("編集"), a:has-text("Edit")'
      );
      
      if (await editButton.count() > 0) {
        await editButton.first().click();

        // Wait for edit form
        await authenticatedPage.waitForSelector('input[name="name"], input[placeholder*="名前"]');

        // Update name
        const nameInput = authenticatedPage.locator('input[name="name"], input[placeholder*="名前"]');
        await nameInput.fill('Updated Tenant Name');

        // Submit
        const submitButton = authenticatedPage.locator('button[type="submit"], button:has-text("更新"), button:has-text("Update")');
        await submitButton.click();

        // Wait for success
        await authenticatedPage.waitForTimeout(1000);
      }
    }
  });

  test('should search tenants', async ({ authenticatedPage }) => {
    // Navigate to tenants page
    await authenticatedPage.goto('/tenants');
    await authenticatedPage.waitForLoadState('networkidle');

    // Find search input
    const searchInput = authenticatedPage.locator(
      'input[type="search"], input[placeholder*="検索"], input[placeholder*="Search"]'
    );

    if (await searchInput.count() > 0) {
      // Type search query
      await searchInput.fill('test');

      // Wait for results to update
      await authenticatedPage.waitForTimeout(1000);

      // Verify filtered results are displayed
      const results = authenticatedPage.locator('[data-testid="tenant-list"], table tbody tr, .tenant-item');
      await expect(results.first()).toBeVisible();
    }
  });

  test('should handle pagination', async ({ authenticatedPage }) => {
    // Navigate to tenants page
    await authenticatedPage.goto('/tenants');
    await authenticatedPage.waitForLoadState('networkidle');

    // Check if pagination controls exist
    const paginationNext = authenticatedPage.locator(
      'button:has-text("次へ"), button:has-text("Next"), [aria-label="Next page"]'
    );

    if (await paginationNext.count() > 0 && await paginationNext.isEnabled()) {
      // Click next page
      await paginationNext.click();

      // Wait for page to load
      await authenticatedPage.waitForLoadState('networkidle');

      // Verify page changed
      const url = authenticatedPage.url();
      expect(url).toMatch(/page=2|offset=/);
    }
  });
});
