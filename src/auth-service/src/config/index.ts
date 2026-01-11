import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  // Server
  port: parseInt(process.env.AUTH_SERVICE_PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // JWT Configuration with RS256 (asymmetric keys)
  jwt: {
    // For RS256, we need public/private key pair
    // In production, these should be loaded from secure storage (Azure Key Vault)
    // For development, we use HS256 for simplicity
    // TODO: Implement RS256 support for better security isolation
    algorithm: 'HS256' as const, // Change to 'RS256' when using asymmetric keys
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    accessTokenExpiry: '1h', // 1 hour as per requirements
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: 'saas-auth-service',
    audience: 'saas-app',
  },

  // CosmosDB Configuration
  cosmosDb: {
    endpoint: process.env.COSMOSDB_ENDPOINT || 'https://localhost:8081',
    // Note: Default key is for local emulator only - NEVER use in production
    key: process.env.COSMOSDB_KEY || '',
    database: process.env.COSMOSDB_DATABASE || 'saas-management',
    containers: {
      users: 'users',
      refreshTokens: 'refresh-tokens',
      auditLogs: 'audit-logs',
    },
  },

  // CORS Configuration
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(','),
    credentials: true,
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // Security
  security: {
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
    lockoutDurationMinutes: parseInt(process.env.LOCKOUT_DURATION_MINUTES || '15', 10),
    passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
  },

  // Feature Flags
  features: {
    passwordReset: process.env.FEATURE_PASSWORD_RESET === 'enabled',
    emailVerification: process.env.FEATURE_EMAIL_VERIFICATION === 'enabled',
    twoFactorAuth: process.env.FEATURE_TWO_FACTOR_AUTH === 'enabled',
    rateLimiting: process.env.FEATURE_RATE_LIMITING !== 'disabled',
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
};

export default config;
