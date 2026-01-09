# Environment Configuration Guide

This guide provides comprehensive documentation for configuring environment variables and feature flags across all environments (development, staging, and production).

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Environment Files](#environment-files)
- [Environment Variables Reference](#environment-variables-reference)
- [Feature Flags](#feature-flags)
- [Environment-Specific Configuration](#environment-specific-configuration)
- [Azure App Service Configuration](#azure-app-service-configuration)
- [Security Best Practices](#security-best-practices)
- [Validation](#validation)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

The application uses environment-based configuration with feature flags to support different deployment environments and enable/disable features dynamically. This approach allows for:

- **Environment Isolation**: Separate configurations for development, staging, and production
- **Feature Control**: Toggle features via flags for gradual rollouts and A/B testing
- **Security**: Sensitive data is never committed to version control
- **Flexibility**: Easy configuration changes without code deployment

## 🚀 Quick Start

### For Local Development

1. **Copy the template**:
   ```bash
   cp .env.template .env
   ```

2. **Or use the development example**:
   ```bash
   cp .env.development .env
   ```

3. **Start the services**:
   - The CosmosDB Emulator should be running (automatically started in DevContainer)
   - Services will read from the `.env` file automatically

### For Individual Services

Each service may have its own `.env` file. Copy the template to each service directory:

```bash
# Frontend
cp .env.template src/front/.env

# Auth Service
cp .env.template src/auth-service/.env

# User Management Service
cp .env.template src/user-management-service/.env

# Service Settings Service
cp .env.template src/service-setting-service/.env
```

## 📁 Environment Files

| File | Purpose | Usage |
|------|---------|-------|
| `.env.template` | Template with all variables | Copy to `.env` for local development |
| `.env.development` | Development defaults | Reference for local setup |
| `.env.staging` | Staging configuration reference | Reference for Azure App Service staging |
| `.env.production` | Production configuration reference | Reference for Azure App Service production |
| `.env` | Active local configuration | Used by services (gitignored) |

**Important**: The `.env` file is gitignored and should NEVER be committed to version control.

## 📖 Environment Variables Reference

### Core Configuration

#### Node Environment
```bash
NODE_ENV=development  # Options: development, staging, production
```

Determines the runtime environment and affects logging, error handling, and other behaviors.

### CosmosDB Configuration

#### Connection Settings
```bash
COSMOSDB_ENDPOINT=https://localhost:8081
COSMOSDB_KEY=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==
COSMOSDB_DATABASE=saas-management
```

- **COSMOSDB_ENDPOINT**: The endpoint URL for your CosmosDB instance
  - Local: `https://localhost:8081` (emulator)
  - Azure: `https://your-account.documents.azure.com:443/`
- **COSMOSDB_KEY**: Primary or secondary key for authentication
  - Use the default key for local emulator
  - Retrieve from Azure Key Vault for production
- **COSMOSDB_DATABASE**: Database name (separate for each environment)

#### Retry Configuration
```bash
COSMOSDB_MAX_RETRY_ATTEMPTS=3
COSMOSDB_RETRY_INTERVAL_MS=1000
```

### JWT Authentication Configuration

```bash
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
```

- **JWT_SECRET**: Secret key for signing JWT tokens
  - **CRITICAL**: Generate a strong secret for staging and production
  - Generate using: `openssl rand -base64 32` (minimum) or `openssl rand -base64 64` (recommended)
  - Never use default values in non-development environments
- **JWT_EXPIRES_IN**: Access token expiration time (formats: `1h`, `24h`, `7d`)
- **JWT_REFRESH_EXPIRES_IN**: Refresh token expiration time

### Service Ports and URLs

```bash
# Ports (used internally)
FRONTEND_PORT=3000
AUTH_SERVICE_PORT=3001
USER_MANAGEMENT_SERVICE_PORT=3002
SERVICE_SETTINGS_SERVICE_PORT=3003

# URLs (for service-to-service communication)
FRONTEND_URL=http://localhost:3000
AUTH_SERVICE_URL=http://localhost:3001
USER_MANAGEMENT_SERVICE_URL=http://localhost:3002
SERVICE_SETTINGS_SERVICE_URL=http://localhost:3003
```

### CORS Configuration

```bash
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

Comma-separated list of allowed origins for Cross-Origin Resource Sharing.

### Logging Configuration

```bash
LOG_LEVEL=info        # Options: error, warn, info, debug
LOG_FORMAT=json       # Options: json, text
LOG_FILE_PATH=        # Optional: path to log file
```

### Security Settings

```bash
# Password Requirements
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBERS=true
PASSWORD_REQUIRE_SPECIAL_CHARS=true

# Session Settings
SESSION_TIMEOUT_MINUTES=30
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
```

### Development Tools

```bash
ENABLE_API_DOCS=true              # Enable Swagger/OpenAPI documentation
ENABLE_DETAILED_ERRORS=true       # Show detailed error messages
ENABLE_REQUEST_LOGGING=true       # Log all HTTP requests
```

**Warning**: Disable `ENABLE_DETAILED_ERRORS` in production to avoid exposing sensitive information.

## 🎛️ Feature Flags

Feature flags allow you to enable or disable features without code changes. All flags accept `enabled` or `disabled` as values.

### User Management Features

```bash
FEATURE_USER_CREATE=enabled        # Allow creating new users
FEATURE_USER_EDIT=enabled          # Allow editing user details
FEATURE_USER_DELETE=enabled        # Allow deleting users
FEATURE_USER_ROLE_ASSIGN=enabled   # Allow assigning roles to users
```

### Service Settings Features

```bash
FEATURE_SERVICE_CREATE=enabled     # Allow creating new services
FEATURE_SERVICE_EDIT=enabled       # Allow editing service settings
FEATURE_SERVICE_DELETE=enabled     # Allow deleting services
```

### Authentication Features

```bash
FEATURE_PASSWORD_RESET=enabled           # Enable password reset functionality
FEATURE_EMAIL_VERIFICATION=enabled       # Enable email verification
FEATURE_TWO_FACTOR_AUTH=disabled         # Enable two-factor authentication
```

### Advanced Features

```bash
FEATURE_ANALYTICS=disabled         # Enable analytics tracking
FEATURE_AUDIT_LOGGING=enabled      # Enable audit logging
FEATURE_RATE_LIMITING=disabled     # Enable API rate limiting
```

### Rate Limiting Configuration

```bash
RATE_LIMIT_WINDOW_MS=900000        # Time window (15 minutes)
RATE_LIMIT_MAX_REQUESTS=100        # Max requests per window
```

### Using Feature Flags in Code

**Backend (Node.js/TypeScript)**:
```typescript
// Example: config/features.ts
export const isFeatureEnabled = (featureName: string): boolean => {
  const value = process.env[`FEATURE_${featureName.toUpperCase()}`];
  return value === 'enabled';
};

// Usage in service
if (isFeatureEnabled('USER_DELETE')) {
  // Allow delete operation
}
```

**Frontend (React)**:
```typescript
// Example: hooks/useFeatureFlag.ts
export const useFeatureFlag = (featureName: string): boolean => {
  return import.meta.env[`VITE_FEATURE_${featureName}`] === 'enabled';
};

// Usage in component
const canDeleteUser = useFeatureFlag('USER_DELETE');
```

## 🌍 Environment-Specific Configuration

### Development Environment

**Purpose**: Local development with maximum debugging capabilities

**Key Settings**:
- CosmosDB Emulator with default credentials
- Debug-level logging
- All development tools enabled
- Relaxed security settings for ease of testing
- All feature flags enabled for testing

**Setup**:
```bash
cp .env.development .env
```

### Staging Environment

**Purpose**: Pre-production testing environment that mirrors production

**Key Settings**:
- Azure CosmosDB instance (staging)
- Info-level logging
- API documentation enabled
- Production-level security
- Test new features before production rollout

**Configuration**: Use Azure App Service Application Settings (see below)

### Production Environment

**Purpose**: Live production environment with maximum security

**Key Settings**:
- Azure CosmosDB instance (production)
- Warn/error-level logging only
- API documentation disabled
- Maximum security settings
- Conservative feature flag approach
- Secrets from Azure Key Vault

**Configuration**: Use Azure App Service Application Settings + Azure Key Vault

## ☁️ Azure App Service Configuration

### Setting Environment Variables in Azure

1. **Via Azure Portal**:
   - Navigate to your App Service
   - Go to **Configuration** > **Application settings**
   - Click **+ New application setting**
   - Add name and value
   - Click **OK** and **Save**

2. **Via Azure CLI**:
   ```bash
   az webapp config appsettings set \
     --resource-group <resource-group-name> \
     --name <app-name> \
     --settings COSMOSDB_ENDPOINT="https://your-account.documents.azure.com:443/"
   ```

3. **Via ARM Template**:
   ```json
   {
     "type": "Microsoft.Web/sites/config",
     "apiVersion": "2021-02-01",
     "name": "[concat(parameters('appServiceName'), '/appsettings')]",
     "properties": {
       "COSMOSDB_ENDPOINT": "[parameters('cosmosDbEndpoint')]",
       "NODE_ENV": "production"
     }
   }
   ```

### Using Azure Key Vault for Secrets

**Recommended for**: JWT_SECRET, COSMOSDB_KEY, connection strings

1. **Store secret in Key Vault**:
   ```bash
   az keyvault secret set \
     --vault-name <your-keyvault-name> \
     --name jwt-secret \
     --value <your-secure-jwt-secret>
   ```

2. **Reference in App Service**:
   ```
   @Microsoft.KeyVault(SecretUri=https://your-keyvault.vault.azure.net/secrets/jwt-secret/)
   ```

3. **Enable Managed Identity**:
   ```bash
   az webapp identity assign \
     --resource-group <resource-group-name> \
     --name <app-name>
   ```

4. **Grant App Service access to Key Vault**:
   ```bash
   az keyvault set-policy \
     --name <your-keyvault-name> \
     --object-id <app-service-principal-id> \
     --secret-permissions get list
   ```

## 🔒 Security Best Practices

### 1. Never Commit Secrets

- ✅ Use `.env.template` for documentation
- ✅ Keep `.env` in `.gitignore`
- ❌ Never commit `.env` files with actual values
- ❌ Never hardcode secrets in source code

### 2. Use Strong Secrets

```bash
# Generate JWT secret (minimum 32 bytes)
openssl rand -base64 32

# Generate stronger secret (recommended 64 bytes)
openssl rand -base64 64
```

### 3. Rotate Secrets Regularly

- Rotate JWT secrets every 90 days
- Rotate database keys annually or when compromised
- Update all dependent services when rotating

### 4. Environment Isolation

- Use different secrets for each environment
- Never use production secrets in development/staging
- Use separate databases for each environment

### 5. Least Privilege Access

- Use read-only keys where write access is not needed
- Limit CORS origins to specific domains
- Configure Azure RBAC for resource access

### 6. Monitor and Alert

- Enable Application Insights in staging and production
- Set up alerts for authentication failures
- Monitor for unusual API usage patterns

## ✅ Validation

### Manual Validation

Check that required variables are set:

```bash
# Example validation script
#!/bin/bash
required_vars=(
  "NODE_ENV"
  "COSMOSDB_ENDPOINT"
  "COSMOSDB_KEY"
  "JWT_SECRET"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "Error: $var is not set"
    exit 1
  fi
done

echo "All required environment variables are set"
```

### Automated Validation

Implement validation in your application startup:

```typescript
// Example: config/validate.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  COSMOSDB_ENDPOINT: z.string().url(),
  COSMOSDB_KEY: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']),
});

export const validateEnv = () => {
  try {
    envSchema.parse(process.env);
    console.log('✅ Environment variables validated successfully');
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    process.exit(1);
  }
};
```

### Testing Configuration

Create a test to verify configuration in different environments:

```typescript
// tests/config.test.ts
import { describe, it, expect } from 'vitest';

describe('Environment Configuration', () => {
  it('should have all required variables', () => {
    expect(process.env.NODE_ENV).toBeDefined();
    expect(process.env.COSMOSDB_ENDPOINT).toBeDefined();
    expect(process.env.JWT_SECRET).toBeDefined();
  });

  it('should have valid JWT secret in production', () => {
    if (process.env.NODE_ENV === 'production') {
      expect(process.env.JWT_SECRET).not.toBe('dev-secret-key-not-for-production-use-only');
      expect(process.env.JWT_SECRET!.length).toBeGreaterThanOrEqual(32);
    }
  });
});
```

## 🔧 Troubleshooting

### Issue: Service cannot connect to CosmosDB

**Symptoms**: Connection errors, timeout errors

**Solutions**:
1. Verify CosmosDB Emulator is running (development):
   ```bash
   curl -k https://localhost:8081/_explorer/emulator.pem
   ```
2. Check endpoint URL format (Azure):
   - Should end with `:443/`
   - Should use `https://`
3. Verify the key is correct and not expired
4. Check firewall rules in Azure

### Issue: JWT authentication fails

**Symptoms**: "Invalid token" or "Token expired" errors

**Solutions**:
1. Verify `JWT_SECRET` is consistent across all services
2. Check token expiration settings
3. Ensure clocks are synchronized across services
4. Verify the secret is not accidentally different between environments

### Issue: Feature flag not working

**Symptoms**: Feature behaves unexpectedly

**Solutions**:
1. Verify flag value is exactly `enabled` or `disabled` (case-sensitive)
2. Check if the flag name matches in code and environment
3. Restart the service after changing environment variables
4. Clear any caches that might store the old value

### Issue: Environment variables not loaded

**Symptoms**: Undefined or default values

**Solutions**:
1. Verify `.env` file exists in the correct directory
2. Check file permissions (should be readable)
3. Ensure no typos in variable names
4. Verify the environment variable loader is configured correctly
5. Check if dotenv or similar package is installed and initialized

### Issue: CORS errors in frontend

**Symptoms**: "Access-Control-Allow-Origin" errors

**Solutions**:
1. Verify `CORS_ORIGINS` includes your frontend URL
2. Use exact URLs (including protocol and port)
3. No trailing slashes in URLs
4. Restart backend service after changes

## 📚 Additional Resources

- [Azure App Service Configuration](https://docs.microsoft.com/azure/app-service/configure-common)
- [Azure Key Vault](https://docs.microsoft.com/azure/key-vault/general/overview)
- [CosmosDB Security](https://docs.microsoft.com/azure/cosmos-db/secure-access-to-data)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Feature Flags Best Practices](https://martinfowler.com/articles/feature-toggles.html)

## 🔄 Keeping This Document Updated

When adding new environment variables:
1. Update `.env.template` with the new variable and documentation
2. Update all environment-specific files (`.env.development`, `.env.staging`, `.env.production`)
3. Document the variable in this guide
4. Add validation for critical variables
5. Update any related ADR documents

---

**Last Updated**: 2026-01-09
