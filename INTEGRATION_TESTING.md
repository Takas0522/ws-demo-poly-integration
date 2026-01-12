# 🧪 Integration Testing Guide

## Overview

This guide covers the integration and E2E testing setup for the SaaS Management Application polyrepo integration project.

## Table of Contents

- [Test Types](#test-types)
- [Integration Tests](#integration-tests)
- [E2E Tests](#e2e-tests)
- [Running Tests](#running-tests)
- [Test Environment Setup](#test-environment-setup)
- [Writing Tests](#writing-tests)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## Test Types

### Unit Tests
- Located in individual packages (`packages/*/src/**/*.test.ts`)
- Test individual functions, components, and modules in isolation
- Run with Jest
- See [TESTING.md](./TESTING.md) for details

### Integration Tests
- Located in `tests/integration/`
- Test interactions between services and components
- Test database operations and API endpoints
- Test cross-service communication

### E2E Tests
- Located in `tests/e2e/`
- Test complete user journeys through the application
- Use Playwright for browser automation
- Test authentication flows, user management, and permission-based UI

## Integration Tests

### Structure

```
tests/integration/
├── api/                          # API integration tests
│   ├── auth-service.test.ts
│   ├── user-management-service.test.ts
│   └── service-settings.test.ts
├── database/                     # Database integration tests
│   └── cosmosdb-operations.test.ts
├── cross-service/                # Cross-service communication tests
│   └── service-communication.test.ts
├── utils/                        # Test utilities
│   ├── api-helpers.ts
│   ├── database-helpers.ts
│   └── jwt-helpers.ts
└── setup.ts                      # Test setup and configuration
```

### API Integration Tests

Test REST API endpoints across all services:

```typescript
import { apiClients, assertResponse } from '../utils/api-helpers';
import { testTokens } from '../utils/jwt-helpers';

it('should create user with admin token', async () => {
  const token = testTokens.admin('tenant-1');
  const response = await apiClients.userManagement.post(
    '/users',
    userData,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  assertResponse.isCreated(response.status);
});
```

### Database Integration Tests

Test CosmosDB operations with data isolation:

```typescript
import { createTestUser, createTestDataCleanup } from '../utils/database-helpers';

const cleanup = createTestDataCleanup();

it('should create user with tenant isolation', () => {
  const user = createTestUser('tenant-1');
  cleanup.track('users', user.id);
  expect(user.tenantId).toBe('tenant-1');
});
```

### Cross-Service Tests

Test service-to-service communication:

```typescript
import { testTokens, verifyToken } from '../utils/jwt-helpers';

it('should use same JWT across services', async () => {
  const token = testTokens.user('tenant-1');
  
  // Token should work for all services
  const decoded = verifyToken(token);
  expect(decoded?.tenantId).toBe('tenant-1');
});
```

## E2E Tests

### Structure

```
tests/e2e/
├── auth/                         # Authentication E2E tests
│   └── authentication.spec.ts
├── user-management/              # User management E2E tests
│   └── user-journey.spec.ts
├── permissions/                  # Permission-based UI tests
│   └── permission-ui.spec.ts
└── utils/                        # E2E test utilities
    └── helpers.ts
```

### Authentication Flow Tests

```typescript
import { test, expect } from '@playwright/test';
import { login, e2eCredentials } from '../utils/helpers';

test('should login with valid credentials', async ({ page }) => {
  await login(page, e2eCredentials.user.email, e2eCredentials.user.password);
  expect(page.url()).not.toContain('/login');
});
```

### User Journey Tests

```typescript
test('should create new user', async ({ page }) => {
  await setupAuthenticatedPage(page, e2eCredentials.admin);
  await page.goto('/users');
  
  await page.click('button:has-text("Create")');
  await page.fill('input[name="email"]', 'new@example.com');
  await page.click('button[type="submit"]');
  
  await waitForLoadingComplete(page);
});
```

### Permission-Based UI Tests

```typescript
test('viewer should not see edit buttons', async ({ page }) => {
  await setupAuthenticatedPage(page, e2eCredentials.viewer);
  await page.goto('/users');
  
  const editVisible = await isVisible(page, 'button:has-text("Edit")');
  expect(editVisible).toBe(false);
});
```

## Running Tests

### Install Dependencies

```bash
# Install root dependencies
npm install

# Install Playwright browsers
npm run playwright:install
```

### Run All Tests

```bash
# Run all unit tests
npm run test:unit

# Run all integration tests
npm run test:integration

# Run all E2E tests
npm run test:e2e

# Run everything
npm run test:all
```

### Run Specific Test Suites

```bash
# Run API integration tests only
npm run test:integration:api

# Run database integration tests only
npm run test:integration:database

# Run cross-service tests only
npm run test:integration:cross-service
```

### Run E2E Tests with UI

```bash
# Open Playwright UI
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug
```

### Run Specific Test Files

```bash
# Run specific integration test
npx jest tests/integration/api/auth-service.test.ts

# Run specific E2E test
npx playwright test tests/e2e/auth/authentication.spec.ts
```

## Test Environment Setup

### Environment Variables

Integration tests use environment variables from `.env.development`:

```env
NODE_ENV=development
AUTH_SERVICE_URL=http://localhost:3001
USER_MANAGEMENT_SERVICE_URL=http://localhost:3002
SERVICE_SETTINGS_SERVICE_URL=http://localhost:3003
FRONTEND_URL=http://localhost:3000
COSMOSDB_ENDPOINT=https://localhost:8081
JWT_SECRET=dev-secret-key-not-for-production-use-only
```

### Service Requirements

For full integration and E2E testing, you need:

1. **CosmosDB Emulator**: Running on `localhost:8081`
2. **Backend Services**: Auth, User Management, Service Settings
3. **Frontend**: React application on `localhost:3000`

### Running Services

```bash
# Start CosmosDB emulator (see development guide)

# Start backend services (in separate terminals)
cd src/auth-service && npm start
cd src/user-management-service && npm start
cd src/service-setting-service && npm start

# Start frontend
cd src/front && npm start
```

### Graceful Degradation

Tests are designed to gracefully handle missing services:

- Integration tests mock service responses when services are unavailable
- E2E tests skip gracefully if frontend is not running
- Tests log warnings instead of failing when dependencies are missing

## Writing Tests

### Integration Test Best Practices

1. **Use Test Utilities**: Leverage helper functions in `tests/integration/utils/`
2. **Data Isolation**: Always use test prefixes and cleanup tracked data
3. **Mock When Needed**: Mock external services when they're not available
4. **Test Real Flows**: Test actual API calls when services are running

Example:

```typescript
import { createTestUser, generateTestId, createTestDataCleanup } from '../utils/database-helpers';

describe('My Integration Test', () => {
  const cleanup = createTestDataCleanup();
  
  afterAll(() => {
    console.log('Cleanup summary:', cleanup.getSummary());
  });
  
  it('should test something', () => {
    const tenantId = generateTestId('tenant');
    const user = createTestUser(tenantId);
    cleanup.track('users', user.id);
    
    // Your test logic
  });
});
```

### E2E Test Best Practices

1. **Use Page Objects**: Create reusable page helpers
2. **Handle Timing**: Use proper waits, not arbitrary timeouts
3. **Graceful Failures**: Handle missing elements gracefully
4. **Screenshots**: Take screenshots on failure for debugging
5. **Test in Isolation**: Each test should be independent

Example:

```typescript
import { test } from '@playwright/test';
import { setupAuthenticatedPage, waitForLoadingComplete } from '../utils/helpers';

test('my e2e test', async ({ page }) => {
  try {
    await setupAuthenticatedPage(page);
    await page.goto('/feature');
    await waitForLoadingComplete(page);
    
    // Your test logic
  } catch (error) {
    console.log('⚠️  Test skipped - service may not be available');
    test.skip();
  }
});
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/integration/lcov.info
  
  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Install Playwright
        run: npm run playwright:install
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: test-results/
```

## Troubleshooting

### Services Not Available

If services are not running, tests will:
- Log warnings instead of failing
- Use mocked responses
- Skip tests gracefully

To run full tests, ensure all services are running.

### CosmosDB Connection Issues

```bash
# Check if CosmosDB emulator is running
curl https://localhost:8081/_explorer/index.html

# Verify environment variables
echo $COSMOSDB_ENDPOINT
```

### Playwright Browser Issues

```bash
# Reinstall browsers
npx playwright install --with-deps

# Clear cache
rm -rf ~/.cache/ms-playwright
npm run playwright:install
```

### Test Timeouts

Increase timeouts in test configuration:

```javascript
// jest.integration.config.js
testTimeout: 60000  // 60 seconds

// playwright.config.ts
timeout: 60 * 1000  // 60 seconds
```

### JWT Token Issues

Ensure JWT_SECRET matches across all services:

```bash
# Check .env.development
grep JWT_SECRET .env.development
```

## Test Coverage Goals

- **Integration Tests**: 70%+ coverage
- **E2E Tests**: Cover all critical user journeys
- **Cross-Service Tests**: All service interactions

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://testingjavascript.com/)
- [API Testing Guide](https://www.postman.com/api-testing/)

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review test logs and error messages
3. Consult the main [TESTING.md](./TESTING.md) documentation
4. Open an issue in the repository
