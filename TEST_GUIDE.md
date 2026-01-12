# 🧪 Quick Test Guide

## Run All Tests

### Individual Packages

```bash
# Test react-permissions
cd packages/react-permissions && npm test

# Test permissions
cd scripts/permissions && npm test

# Test @types
cd packages/@types && npm test
```

### With Coverage

```bash
# react-permissions with coverage
cd packages/react-permissions && npm run test:coverage

# permissions with coverage
cd scripts/permissions && npm run test:coverage

# @types with coverage
cd packages/@types && npm run test:coverage
```

## Test Statistics

- **Total Tests**: 220 passing
- **react-permissions**: 108 tests (94.62% coverage)
- **permissions**: 95 tests (97.47% coverage)
- **@types**: 17 tests (100% coverage)

## Quick Commands

```bash
# Watch mode for development
npm run test:watch

# Run specific test file
npm test -- permissions.test

# Update snapshots (if needed)
npm test -- -u
```

For detailed documentation, see [TESTING.md](./TESTING.md)
