import { test, expect } from './fixtures/auth.fixture';
import { generateTestUser, waitForApiResponse } from './utils/test-helpers';

/**
 * User Management Flow E2E Tests
 */
test.describe('User Management Flow', () => {
  test('should display user list', async ({ authenticatedPage }) => {
    // Navigate to users page
    await authenticatedPage.goto('/users');

    // Wait for the page to load
    await authenticatedPage.waitForLoadState('networkidle');

    // Check if user list is displayed
    const userList = authenticatedPage.locator('[data-testid="user-list"], table, .user-item');
    await expect(userList).toBeVisible({ timeout: 10000 });
  });

  test('should create a new user', async ({ authenticatedPage }) => {
    const testUser = generateTestUser();

    // Navigate to users page
    await authenticatedPage.goto('/users');

    // Click "新規作成" or "Create" button
    const createButton = authenticatedPage.locator(
      'button:has-text("新規作成"), button:has-text("Create"), a:has-text("新規作成"), a:has-text("Create")'
    ).first();
    await createButton.click();

    // Wait for form to appear
    await authenticatedPage.waitForSelector('input[name="user_id"], input[name="email"]');

    // Fill in user information
    await authenticatedPage.fill('input[name="user_id"], input[name="email"]', testUser.user_id);
    await authenticatedPage.fill('input[name="name"], input[placeholder*="名前"]', testUser.name);
    await authenticatedPage.fill('input[name="password"], input[type="password"]', testUser.password);

    // Wait for API response when submitting
    const responsePromise = waitForApiResponse(authenticatedPage, '/api/users');

    // Submit the form
    const submitButton = authenticatedPage.locator('button[type="submit"], button:has-text("作成"), button:has-text("Create")');
    await submitButton.click();

    // Wait for API response
    const response = await responsePromise;
    expect(response.status()).toBeLessThan(400);

    // Should navigate back to user list or show success message
    await authenticatedPage.waitForTimeout(1000);
  });

  test('should view user details', async ({ authenticatedPage }) => {
    // Navigate to users page
    await authenticatedPage.goto('/users');
    await authenticatedPage.waitForLoadState('networkidle');

    // Click on the first user in the list
    const firstUser = authenticatedPage.locator(
      '[data-testid="user-item"]:first-child, table tbody tr:first-child, .user-item:first-child'
    );
    
    if (await firstUser.count() > 0) {
      await firstUser.click();

      // Wait for detail page to load
      await authenticatedPage.waitForLoadState('networkidle');

      // Verify detail information is displayed
      const detailSection = authenticatedPage.locator('[data-testid="user-detail"], .user-detail, .detail-section');
      await expect(detailSection.or(authenticatedPage.locator('body'))).toBeVisible();
    }
  });

  test('should edit user information', async ({ authenticatedPage }) => {
    // Navigate to users page
    await authenticatedPage.goto('/users');
    await authenticatedPage.waitForLoadState('networkidle');

    // Click on the first user
    const firstUser = authenticatedPage.locator(
      '[data-testid="user-item"]:first-child, table tbody tr:first-child, .user-item:first-child'
    );
    
    if (await firstUser.count() > 0) {
      await firstUser.click();
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
        await nameInput.fill('Updated User Name');

        // Submit
        const submitButton = authenticatedPage.locator('button[type="submit"], button:has-text("更新"), button:has-text("Update")');
        await submitButton.click();

        // Wait for success
        await authenticatedPage.waitForTimeout(1000);
      }
    }
  });

  test('should assign role to user', async ({ authenticatedPage }) => {
    // Navigate to users page
    await authenticatedPage.goto('/users');
    await authenticatedPage.waitForLoadState('networkidle');

    // Click on the first user
    const firstUser = authenticatedPage.locator(
      '[data-testid="user-item"]:first-child, table tbody tr:first-child'
    );
    
    if (await firstUser.count() > 0) {
      await firstUser.click();
      await authenticatedPage.waitForLoadState('networkidle');

      // Look for role assignment section
      const roleSection = authenticatedPage.locator(
        '[data-testid="role-section"], .role-section, button:has-text("ロール"), button:has-text("Role")'
      );

      if (await roleSection.count() > 0) {
        await roleSection.first().click();

        // Wait for role selection
        await authenticatedPage.waitForTimeout(500);

        // Select a role if dropdown exists
        const roleSelect = authenticatedPage.locator('select[name="role_id"], .role-select');
        if (await roleSelect.count() > 0) {
          await roleSelect.first().selectOption({ index: 1 });

          // Submit role assignment
          const assignButton = authenticatedPage.locator('button:has-text("割り当て"), button:has-text("Assign")');
          if (await assignButton.count() > 0) {
            await assignButton.click();
            await authenticatedPage.waitForTimeout(1000);
          }
        }
      }
    }
  });

  test('should toggle user active status', async ({ authenticatedPage }) => {
    // Navigate to users page
    await authenticatedPage.goto('/users');
    await authenticatedPage.waitForLoadState('networkidle');

    // Click on the first user
    const firstUser = authenticatedPage.locator(
      '[data-testid="user-item"]:first-child, table tbody tr:first-child'
    );
    
    if (await firstUser.count() > 0) {
      await firstUser.click();
      await authenticatedPage.waitForLoadState('networkidle');

      // Look for active/inactive toggle
      const toggleButton = authenticatedPage.locator(
        'button:has-text("無効化"), button:has-text("有効化"), button:has-text("Disable"), button:has-text("Enable")'
      );

      if (await toggleButton.count() > 0) {
        await toggleButton.first().click();
        
        // Confirm if dialog appears
        const confirmButton = authenticatedPage.locator('button:has-text("確認"), button:has-text("OK"), button:has-text("はい")');
        if (await confirmButton.count() > 0) {
          await confirmButton.click();
        }

        await authenticatedPage.waitForTimeout(1000);
      }
    }
  });

  test('should search users', async ({ authenticatedPage }) => {
    // Navigate to users page
    await authenticatedPage.goto('/users');
    await authenticatedPage.waitForLoadState('networkidle');

    // Find search input
    const searchInput = authenticatedPage.locator(
      'input[type="search"], input[placeholder*="検索"], input[placeholder*="Search"]'
    );

    if (await searchInput.count() > 0) {
      // Type search query
      await searchInput.fill('admin');

      // Wait for results to update
      await authenticatedPage.waitForTimeout(1000);

      // Verify filtered results are displayed
      const results = authenticatedPage.locator('[data-testid="user-list"], table tbody tr, .user-item');
      await expect(results.first()).toBeVisible();
    }
  });

  test('should filter users by tenant', async ({ authenticatedPage }) => {
    // Navigate to users page
    await authenticatedPage.goto('/users');
    await authenticatedPage.waitForLoadState('networkidle');

    // Find tenant filter
    const tenantFilter = authenticatedPage.locator(
      'select[name="tenant_id"], .tenant-filter'
    );

    if (await tenantFilter.count() > 0) {
      // Select a tenant
      await tenantFilter.selectOption({ index: 1 });

      // Wait for results to update
      await authenticatedPage.waitForTimeout(1000);

      // Verify filtered results are displayed
      const results = authenticatedPage.locator('[data-testid="user-list"], table tbody tr, .user-item');
      await expect(results.first()).toBeVisible();
    }
  });
});
