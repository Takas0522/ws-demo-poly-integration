/**
 * API Test Utilities
 * 
 * Helper functions for testing REST APIs across all services
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { testConfig } from '../setup';

/**
 * Create an API client for a specific service
 * 
 * Note: validateStatus is set to return true for all status codes to allow
 * tests to handle and assert on error responses without throwing exceptions.
 * This enables testing of error scenarios (4xx, 5xx) without try-catch blocks.
 */
export function createApiClient(baseURL: string): AxiosInstance {
  return axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
    validateStatus: () => true, // Don't throw on any status code - allows error testing
  });
}

/**
 * Create an authenticated API client with JWT token
 */
export function createAuthenticatedClient(baseURL: string, token: string): AxiosInstance {
  return axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    validateStatus: () => true,
  });
}

/**
 * API clients for each service
 */
export const apiClients = {
  auth: createApiClient(testConfig.authServiceUrl),
  userManagement: createApiClient(testConfig.userManagementServiceUrl),
  serviceSettings: createApiClient(testConfig.serviceSettingsServiceUrl),
};

/**
 * Wait for a service to be ready
 */
export async function waitForService(
  baseURL: string,
  healthPath: string = '/health',
  maxRetries: number = 30,
  retryDelay: number = 1000
): Promise<boolean> {
  const client = createApiClient(baseURL);
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await client.get(healthPath);
      if (response.status === 200) {
        return true;
      }
    } catch (error) {
      // Service not ready yet
    }
    
    await new Promise(resolve => setTimeout(resolve, retryDelay));
  }
  
  return false;
}

/**
 * Check if all services are available
 */
export async function checkServicesAvailability(): Promise<{
  auth: boolean;
  userManagement: boolean;
  serviceSettings: boolean;
}> {
  return {
    auth: await isServiceAvailable(testConfig.authServiceUrl),
    userManagement: await isServiceAvailable(testConfig.userManagementServiceUrl),
    serviceSettings: await isServiceAvailable(testConfig.serviceSettingsServiceUrl),
  };
}

/**
 * Check if a service is available
 */
async function isServiceAvailable(baseURL: string): Promise<boolean> {
  try {
    const client = createApiClient(baseURL);
    const response = await client.get('/health');
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

/**
 * Mock user credentials for testing
 */
export const mockCredentials = {
  admin: {
    email: 'admin@example.com',
    password: 'Admin123!',
    tenantId: 'tenant-1',
  },
  user: {
    email: 'user@example.com',
    password: 'User123!',
    tenantId: 'tenant-1',
  },
  viewer: {
    email: 'viewer@example.com',
    password: 'Viewer123!',
    tenantId: 'tenant-1',
  },
};

/**
 * Response assertion helpers
 */
export const assertResponse = {
  isSuccess(status: number): void {
    expect(status).toBeGreaterThanOrEqual(200);
    expect(status).toBeLessThan(300);
  },
  
  isCreated(status: number): void {
    expect(status).toBe(201);
  },
  
  isOk(status: number): void {
    expect(status).toBe(200);
  },
  
  isBadRequest(status: number): void {
    expect(status).toBe(400);
  },
  
  isUnauthorized(status: number): void {
    expect(status).toBe(401);
  },
  
  isForbidden(status: number): void {
    expect(status).toBe(403);
  },
  
  isNotFound(status: number): void {
    expect(status).toBe(404);
  },
  
  isServerError(status: number): void {
    expect(status).toBeGreaterThanOrEqual(500);
  },
};
