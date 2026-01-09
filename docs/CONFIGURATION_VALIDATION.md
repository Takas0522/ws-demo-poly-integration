# Configuration Validation Guide

This guide provides strategies and implementations for validating environment configuration to ensure applications start with correct settings.

## 🎯 Overview

Configuration validation is critical for:
- **Early Error Detection**: Catch configuration issues before deployment
- **Security**: Ensure production environments use appropriate security settings
- **Reliability**: Prevent runtime failures due to missing or invalid configuration
- **Documentation**: Serve as living documentation of required configuration

## 📋 Validation Strategies

### 1. Startup Validation

Validate configuration when the application starts, before accepting requests.

### 2. Type Validation

Ensure values are of the correct type (string, number, boolean, URL, etc.).

### 3. Format Validation

Verify values match expected formats (URLs, time durations, etc.).

### 4. Range Validation

Check numeric values are within acceptable ranges.

### 5. Environment-Specific Validation

Apply different rules based on the environment (development, staging, production).

## 🛠️ Implementation Examples

### Node.js/TypeScript with Zod

**Installation**:
```bash
npm install zod
```

**Implementation** (`src/config/env.validation.ts`):
```typescript
import { z } from 'zod';

/**
 * Environment variable schema with validation rules
 */
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'staging', 'production']),

  // CosmosDB Configuration
  COSMOSDB_ENDPOINT: z.string().url('COSMOSDB_ENDPOINT must be a valid URL'),
  COSMOSDB_KEY: z.string().min(1, 'COSMOSDB_KEY is required'),
  COSMOSDB_DATABASE: z.string().min(1, 'COSMOSDB_DATABASE is required'),
  COSMOSDB_MAX_RETRY_ATTEMPTS: z.coerce.number().min(1).max(10).default(3),
  COSMOSDB_RETRY_INTERVAL_MS: z.coerce.number().min(100).max(10000).default(1000),

  // JWT Configuration
  JWT_SECRET: z.string()
    .min(32, 'JWT_SECRET must be at least 32 characters for security')
    .refine(
      (val) => process.env.NODE_ENV !== 'production' || val !== 'dev-secret-key-not-for-production-use-only',
      'JWT_SECRET cannot use development default in production'
    ),
  JWT_EXPIRES_IN: z.string().regex(/^\d+[smhd]$/, 'JWT_EXPIRES_IN must be a valid duration (e.g., 1h, 24h, 7d)'),
  JWT_REFRESH_EXPIRES_IN: z.string().regex(/^\d+[smhd]$/, 'JWT_REFRESH_EXPIRES_IN must be a valid duration'),

  // Service Ports
  FRONTEND_PORT: z.coerce.number().min(1).max(65535).optional(),
  AUTH_SERVICE_PORT: z.coerce.number().min(1).max(65535).optional(),
  USER_MANAGEMENT_SERVICE_PORT: z.coerce.number().min(1).max(65535).optional(),
  SERVICE_SETTINGS_SERVICE_PORT: z.coerce.number().min(1).max(65535).optional(),

  // Service URLs
  FRONTEND_URL: z.string().url().optional(),
  AUTH_SERVICE_URL: z.string().url().optional(),
  USER_MANAGEMENT_SERVICE_URL: z.string().url().optional(),
  SERVICE_SETTINGS_SERVICE_URL: z.string().url().optional(),

  // Feature Flags
  FEATURE_USER_CREATE: z.enum(['enabled', 'disabled']).default('enabled'),
  FEATURE_USER_EDIT: z.enum(['enabled', 'disabled']).default('enabled'),
  FEATURE_USER_DELETE: z.enum(['enabled', 'disabled']).default('enabled'),
  FEATURE_USER_ROLE_ASSIGN: z.enum(['enabled', 'disabled']).default('enabled'),
  FEATURE_SERVICE_CREATE: z.enum(['enabled', 'disabled']).default('enabled'),
  FEATURE_SERVICE_EDIT: z.enum(['enabled', 'disabled']).default('enabled'),
  FEATURE_SERVICE_DELETE: z.enum(['enabled', 'disabled']).default('enabled'),
  FEATURE_PASSWORD_RESET: z.enum(['enabled', 'disabled']).default('enabled'),
  FEATURE_EMAIL_VERIFICATION: z.enum(['enabled', 'disabled']).default('enabled'),
  FEATURE_TWO_FACTOR_AUTH: z.enum(['enabled', 'disabled']).default('disabled'),
  FEATURE_ANALYTICS: z.enum(['enabled', 'disabled']).default('disabled'),
  FEATURE_AUDIT_LOGGING: z.enum(['enabled', 'disabled']).default('enabled'),
  FEATURE_RATE_LIMITING: z.enum(['enabled', 'disabled']).default('disabled'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'text']).default('json'),
  LOG_FILE_PATH: z.string().optional(),

  // CORS
  CORS_ORIGINS: z.string().transform((val) => val.split(',').map(s => s.trim())),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().min(1000).default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().min(1).default(100),

  // Tenant
  DEFAULT_TENANT_ID: z.string().min(1).default('default-tenant'),

  // Security
  PASSWORD_MIN_LENGTH: z.coerce.number().min(6).max(128).default(8),
  PASSWORD_REQUIRE_UPPERCASE: z.coerce.boolean().default(true),
  PASSWORD_REQUIRE_LOWERCASE: z.coerce.boolean().default(true),
  PASSWORD_REQUIRE_NUMBERS: z.coerce.boolean().default(true),
  PASSWORD_REQUIRE_SPECIAL_CHARS: z.coerce.boolean().default(true),
  SESSION_TIMEOUT_MINUTES: z.coerce.number().min(1).max(1440).default(30),
  MAX_LOGIN_ATTEMPTS: z.coerce.number().min(1).max(100).default(5),
  LOCKOUT_DURATION_MINUTES: z.coerce.number().min(1).max(1440).default(15),

  // Development Tools
  ENABLE_API_DOCS: z.coerce.boolean().default(true),
  ENABLE_DETAILED_ERRORS: z.coerce.boolean().default(true),
  ENABLE_REQUEST_LOGGING: z.coerce.boolean().default(true),

  // Azure (optional)
  APPINSIGHTS_INSTRUMENTATIONKEY: z.string().optional(),
  AZURE_STORAGE_CONNECTION_STRING: z.string().optional(),
});

/**
 * Validated environment configuration type
 */
export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validate and parse environment variables
 * @throws {z.ZodError} If validation fails
 */
export function validateEnv(): EnvConfig {
  try {
    const config = envSchema.parse(process.env);
    
    // Additional custom validations
    validateProductionSettings(config);
    validateServiceUrls(config);
    
    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment variable validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error('❌ Unexpected error during environment validation:', error);
    }
    throw error;
  }
}

/**
 * Additional validation for production environment
 */
function validateProductionSettings(config: EnvConfig): void {
  if (config.NODE_ENV === 'production') {
    // Ensure sensitive tools are disabled in production
    if (config.ENABLE_DETAILED_ERRORS) {
      console.warn('⚠️  WARNING: ENABLE_DETAILED_ERRORS should be false in production');
    }
    
    if (config.ENABLE_API_DOCS) {
      console.warn('⚠️  WARNING: Consider disabling ENABLE_API_DOCS in production');
    }
    
    // Ensure security settings are strict
    if (config.PASSWORD_MIN_LENGTH < 8) {
      throw new Error('PASSWORD_MIN_LENGTH must be at least 8 in production');
    }
    
    // Ensure appropriate log level
    if (config.LOG_LEVEL === 'debug') {
      console.warn('⚠️  WARNING: LOG_LEVEL=debug may impact performance in production');
    }
  }
}

/**
 * Validate service URLs are accessible (if needed)
 */
function validateServiceUrls(config: EnvConfig): void {
  // In production, ensure URLs use HTTPS
  if (config.NODE_ENV === 'production') {
    const urls = [
      config.FRONTEND_URL,
      config.AUTH_SERVICE_URL,
      config.USER_MANAGEMENT_SERVICE_URL,
      config.SERVICE_SETTINGS_SERVICE_URL,
    ];
    
    urls.forEach((url) => {
      if (url && !url.startsWith('https://')) {
        throw new Error(`Production URLs must use HTTPS: ${url}`);
      }
    });
  }
}

/**
 * Get validated configuration
 * Memoized to ensure validation happens only once
 */
let cachedConfig: EnvConfig | null = null;

export function getConfig(): EnvConfig {
  if (!cachedConfig) {
    cachedConfig = validateEnv();
    console.log('✅ Environment configuration validated successfully');
  }
  return cachedConfig;
}
```

**Usage in Application**:
```typescript
// src/index.ts or src/app.ts
import 'dotenv/config'; // Load .env file
import { getConfig } from './config/env.validation';

// Validate configuration on startup
const config = getConfig();

// Use validated configuration
console.log(`Starting ${config.NODE_ENV} environment`);
console.log(`CosmosDB: ${config.COSMOSDB_ENDPOINT}`);
console.log(`Log Level: ${config.LOG_LEVEL}`);

// Start your application
startServer(config);
```

### Alternative: Custom Validation

For projects not using Zod, implement custom validation:

```typescript
// src/config/env.validation.ts

interface RequiredEnvVar {
  name: string;
  validate?: (value: string) => boolean;
  errorMessage?: string;
}

const requiredEnvVars: RequiredEnvVar[] = [
  { name: 'NODE_ENV' },
  { 
    name: 'COSMOSDB_ENDPOINT',
    validate: (v) => v.startsWith('https://'),
    errorMessage: 'COSMOSDB_ENDPOINT must start with https://'
  },
  { name: 'COSMOSDB_KEY' },
  { name: 'COSMOSDB_DATABASE' },
  { 
    name: 'JWT_SECRET',
    validate: (v) => v.length >= 32,
    errorMessage: 'JWT_SECRET must be at least 32 characters'
  },
  { name: 'JWT_EXPIRES_IN' },
];

export function validateEnvironment(): void {
  const errors: string[] = [];

  // Check required variables
  requiredEnvVars.forEach(({ name, validate, errorMessage }) => {
    const value = process.env[name];
    
    if (!value) {
      errors.push(`${name} is required but not set`);
      return;
    }
    
    if (validate && !validate(value)) {
      errors.push(errorMessage || `${name} has invalid value`);
    }
  });

  // Check production-specific requirements
  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET?.includes('dev-secret')) {
      errors.push('JWT_SECRET must not use development default in production');
    }
    
    if (process.env.ENABLE_DETAILED_ERRORS === 'true') {
      errors.push('ENABLE_DETAILED_ERRORS should be false in production');
    }
  }

  // Report errors
  if (errors.length > 0) {
    console.error('❌ Environment validation failed:');
    errors.forEach(error => console.error(`  - ${error}`));
    throw new Error('Environment validation failed');
  }

  console.log('✅ Environment validation successful');
}
```

## 🧪 Testing Configuration

### Unit Tests

```typescript
// tests/config/env.validation.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { validateEnv } from '../../src/config/env.validation';

describe('Environment Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should pass with valid development configuration', () => {
    process.env.NODE_ENV = 'development';
    process.env.COSMOSDB_ENDPOINT = 'https://localhost:8081';
    process.env.COSMOSDB_KEY = 'test-key';
    process.env.COSMOSDB_DATABASE = 'test-db';
    process.env.JWT_SECRET = 'a'.repeat(32);
    process.env.JWT_EXPIRES_IN = '24h';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
    process.env.CORS_ORIGINS = 'http://localhost:3000';

    expect(() => validateEnv()).not.toThrow();
  });

  it('should fail with missing required variables', () => {
    process.env.NODE_ENV = 'development';
    // Missing COSMOSDB_ENDPOINT

    expect(() => validateEnv()).toThrow();
  });

  it('should fail with short JWT secret', () => {
    process.env.NODE_ENV = 'development';
    process.env.COSMOSDB_ENDPOINT = 'https://localhost:8081';
    process.env.COSMOSDB_KEY = 'test-key';
    process.env.COSMOSDB_DATABASE = 'test-db';
    process.env.JWT_SECRET = 'too-short'; // Less than 32 characters
    process.env.JWT_EXPIRES_IN = '24h';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
    process.env.CORS_ORIGINS = 'http://localhost:3000';

    expect(() => validateEnv()).toThrow(/at least 32 characters/);
  });

  it('should fail with development JWT secret in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.COSMOSDB_ENDPOINT = 'https://prod.documents.azure.com:443/';
    process.env.COSMOSDB_KEY = 'test-key';
    process.env.COSMOSDB_DATABASE = 'test-db';
    process.env.JWT_SECRET = 'dev-secret-key-not-for-production-use-only';
    process.env.JWT_EXPIRES_IN = '24h';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
    process.env.CORS_ORIGINS = 'https://app.example.com';

    expect(() => validateEnv()).toThrow(/development default/);
  });

  it('should require HTTPS URLs in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.COSMOSDB_ENDPOINT = 'https://prod.documents.azure.com:443/';
    process.env.COSMOSDB_KEY = 'test-key';
    process.env.COSMOSDB_DATABASE = 'test-db';
    process.env.JWT_SECRET = 'a'.repeat(64);
    process.env.JWT_EXPIRES_IN = '24h';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
    process.env.CORS_ORIGINS = 'https://app.example.com';
    process.env.FRONTEND_URL = 'http://insecure.com'; // HTTP in production

    expect(() => validateEnv()).toThrow(/HTTPS/);
  });

  it('should validate feature flag values', () => {
    process.env.NODE_ENV = 'development';
    process.env.COSMOSDB_ENDPOINT = 'https://localhost:8081';
    process.env.COSMOSDB_KEY = 'test-key';
    process.env.COSMOSDB_DATABASE = 'test-db';
    process.env.JWT_SECRET = 'a'.repeat(32);
    process.env.JWT_EXPIRES_IN = '24h';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
    process.env.CORS_ORIGINS = 'http://localhost:3000';
    process.env.FEATURE_USER_CREATE = 'invalid'; // Invalid value

    expect(() => validateEnv()).toThrow();
  });
});
```

### Integration Tests

```typescript
// tests/integration/config.integration.test.ts
import { describe, it, expect } from 'vitest';
import { getConfig } from '../../src/config/env.validation';

describe('Configuration Integration', () => {
  it('should load and validate actual environment', () => {
    const config = getConfig();
    
    expect(config.NODE_ENV).toBeDefined();
    expect(config.COSMOSDB_ENDPOINT).toBeDefined();
    expect(config.JWT_SECRET.length).toBeGreaterThanOrEqual(32);
  });

  it('should have consistent service URLs', () => {
    const config = getConfig();
    
    if (config.AUTH_SERVICE_URL) {
      expect(config.AUTH_SERVICE_URL).toMatch(/^https?:\/\//);
    }
  });
});
```

## 🚀 CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/validate-config.yml
name: Validate Configuration

on:
  pull_request:
    paths:
      - '.env.*'
      - 'src/config/**'
      - 'docs/ENVIRONMENT_CONFIGURATION.md'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Check .env.template is up to date
        run: |
          # Ensure all variables in code are documented in template
          npm run check:env-template
      
      - name: Validate environment examples
        run: |
          # Test that example files are valid
          cp .env.development .env
          npm run validate:env
          
          cp .env.staging .env
          npm run validate:env
      
      - name: Run configuration tests
        run: npm test -- config
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Prevent committing .env files
if git diff --cached --name-only | grep -q "^\.env$"; then
  echo "Error: Attempting to commit .env file"
  echo "Please remove .env from staging"
  exit 1
fi

# Validate that .env.template is complete
npm run check:env-template
if [ $? -ne 0 ]; then
  echo "Error: .env.template validation failed"
  exit 1
fi

exit 0
```

## 📊 Validation Checklist

Use this checklist when adding new environment variables:

- [ ] Add variable to `.env.template` with description
- [ ] Add variable to environment-specific files (`.env.development`, `.env.staging`, `.env.production`)
- [ ] Add validation rule in `env.validation.ts`
- [ ] Update `docs/ENVIRONMENT_CONFIGURATION.md`
- [ ] Add test cases for the new variable
- [ ] Test with invalid values to ensure validation works
- [ ] Document any environment-specific requirements
- [ ] Update CI/CD pipeline if needed

## 🔍 Best Practices

1. **Validate Early**: Fail fast on startup if configuration is invalid
2. **Clear Error Messages**: Provide actionable error messages
3. **Type Safety**: Use TypeScript types for configuration
4. **Default Values**: Provide sensible defaults where appropriate
5. **Environment-Specific Rules**: Apply stricter validation in production
6. **Documentation**: Keep validation rules and documentation in sync
7. **Testing**: Write comprehensive tests for validation logic
8. **Logging**: Log successful validation and warnings clearly

## 📚 Additional Resources

- [Zod Documentation](https://zod.dev/)
- [Twelve-Factor App: Config](https://12factor.net/config)
- [Azure App Service Configuration](https://docs.microsoft.com/azure/app-service/configure-common)

---

**Last Updated**: 2026-01-09
