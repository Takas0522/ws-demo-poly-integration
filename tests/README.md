# Test Suite Documentation

This directory contains integration and E2E tests for the SaaS Management Application.

## Directory Structure

```
tests/
├── integration/              # Integration tests (Jest)
│   ├── api/                  # API integration tests
│   │   ├── auth-service.test.ts
│   │   ├── user-management-service.test.ts
│   │   └── service-settings.test.ts
│   ├── database/             # Database integration tests
│   │   └── cosmosdb-operations.test.ts
│   ├── cross-service/        # Cross-service communication tests
│   │   └── service-communication.test.ts
│   ├── utils/                # Test utilities
│   │   ├── api-helpers.ts
│   │   ├── database-helpers.ts
│   │   └── jwt-helpers.ts
│   └── setup.ts              # Test setup and configuration
└── e2e/                      # End-to-end tests (Playwright)
    ├── auth/                 # Authentication E2E tests
    │   └── authentication.spec.ts
    ├── user-management/      # User management E2E tests
    │   └── user-journey.spec.ts
    ├── permissions/          # Permission-based UI tests
    │   └── permission-ui.spec.ts
    └── utils/                # E2E test utilities
        └── helpers.ts
```

## Running Tests

### Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific integration test suite
npm run test:integration:api
npm run test:integration:database
npm run test:integration:cross-service

# Run specific test file
npx jest tests/integration/api/auth-service.test.ts
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode (visible browser)
npm run test:e2e:headed

# Run E2E tests in debug mode
npm run test:e2e:debug

# Run specific E2E test
npx playwright test tests/e2e/auth/authentication.spec.ts
```

### All Tests

```bash
# Run all tests (unit + integration + E2E)
npm run test:all
```

## Test Coverage

### Integration Tests
- **81 tests** covering:
  - Auth Service API (13 tests)
  - User Management Service API (13 tests)
  - Service Settings API (16 tests)
  - Database Operations (19 tests)
  - Cross-Service Communication (19 tests)

### E2E Tests
- **30 tests** covering:
  - Authentication Flow (10 tests)
  - User Management Journey (10 tests)
  - Permission-Based UI (10 tests)

## Test Utilities

### Integration Test Utilities

#### API Helpers (`utils/api-helpers.ts`)
- `createApiClient()` - Create API client for services
- `createAuthenticatedClient()` - Create authenticated API client
- `waitForService()` - Wait for service to be ready
- `assertResponse` - Response assertion helpers

#### Database Helpers (`utils/database-helpers.ts`)
- `createTestTenant()` - Create test tenant data
- `createTestUser()` - Create test user data
- `createTestPermission()` - Create test permission data
- `generateTestId()` - Generate unique test IDs
- `TestDataCleanup` - Track and cleanup test data
- `testIsolation` - Data isolation utilities

#### JWT Helpers (`utils/jwt-helpers.ts`)
- `generateTestToken()` - Generate JWT tokens for testing
- `verifyToken()` - Verify JWT tokens
- `testTokens` - Pre-configured tokens for different roles
- `tokenValidation` - Token validation utilities

### E2E Test Utilities

#### E2E Helpers (`e2e/utils/helpers.ts`)
- `login()` - Login helper
- `logout()` - Logout helper
- `isLoggedIn()` - Check login status
- `waitForApiResponse()` - Wait for API responses
- `setupAuthenticatedPage()` - Setup authenticated page
- `e2eCredentials` - Test credentials

## Configuration

### Integration Tests
- Configuration: `jest.integration.config.js`
- Setup: `tests/integration/setup.ts`
- Environment: `.env.development`

### E2E Tests
- Configuration: `playwright.config.ts`
- Environment: `.env.development`

## Best Practices

### Integration Tests
1. Use test utilities from `utils/` directory
2. Always use `TEST_DATA_PREFIX` for test data
3. Track created data with `TestDataCleanup`
4. Mock services when they're not available
5. Test both success and failure scenarios

### E2E Tests
1. Use page object pattern with helpers
2. Handle timing with proper waits, not arbitrary timeouts
3. Gracefully skip tests when frontend is unavailable
4. Take screenshots on failures
5. Keep tests independent and isolated

## Troubleshooting

### Services Not Available
Integration tests are designed to work without live services by using mocks. However, for full testing, ensure:
- Auth Service: `http://localhost:3001`
- User Management Service: `http://localhost:3002`
- Service Settings Service: `http://localhost:3003`

### E2E Tests Skipping
E2E tests require the frontend to be running:
- Frontend: `http://localhost:3000`

Tests will skip gracefully if services are not available.

### Test Failures
Check:
1. Environment variables in `.env.development`
2. Service availability
3. CosmosDB emulator running (for database tests)
4. JWT_SECRET consistency across services

## Documentation

For detailed documentation, see:
- [INTEGRATION_TESTING.md](../INTEGRATION_TESTING.md) - Comprehensive testing guide
- [TESTING.md](../TESTING.md) - Overall testing documentation
- [TEST_GUIDE.md](../TEST_GUIDE.md) - Quick test guide

## Contributing

When adding new tests:
1. Follow existing test patterns
2. Use appropriate test utilities
3. Add documentation for complex test scenarios
4. Ensure tests work with graceful degradation
5. Update test counts in this README
