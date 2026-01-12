/**
 * Integration Test Setup
 * 
 * This file runs before each integration test suite to set up the test environment.
 */

import * as dotenv from 'dotenv';

// Load environment variables from .env.development
dotenv.config({ path: '.env.development' });

// Extend Jest timeout for integration tests
jest.setTimeout(30000);

// Global test setup
beforeAll(async () => {
  console.log('🚀 Starting integration test suite...');
  console.log('Environment:', process.env.NODE_ENV);
});

afterAll(async () => {
  console.log('✅ Integration test suite completed');
});

// Helper to ensure environment variables are set
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is required but not set`);
  }
  return value;
}

// Export test configuration
export const testConfig = {
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  userManagementServiceUrl: process.env.USER_MANAGEMENT_SERVICE_URL || 'http://localhost:3002',
  serviceSettingsServiceUrl: process.env.SERVICE_SETTINGS_SERVICE_URL || 'http://localhost:3003',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  cosmosDbEndpoint: process.env.COSMOSDB_ENDPOINT || 'https://localhost:8081',
  cosmosDbDatabase: process.env.COSMOSDB_DATABASE || 'saas-management-dev',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-key-not-for-production-use-only',
};
