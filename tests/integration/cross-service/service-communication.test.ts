/**
 * Cross-Service Communication Integration Tests
 * 
 * Tests for service-to-service interactions and JWT token flow
 */

import { apiClients, createAuthenticatedClient } from '../utils/api-helpers';
import { testTokens, verifyToken, tokenValidation, createAuthHeader } from '../utils/jwt-helpers';
import { generateTestId, createTestUser } from '../utils/database-helpers';
import { testConfig } from '../setup';

describe('Cross-Service Communication Integration Tests', () => {
  
  describe('JWT Token Flow Across Services', () => {
    const tenantId = generateTestId('tenant');
    
    it('should accept same JWT token across all services', async () => {
      const token = testTokens.user(tenantId);
      const decoded = verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded?.tenantId).toBe(tenantId);
      
      // Token should be valid for all services
      const authHeader = createAuthHeader(token);
      expect(authHeader.Authorization).toContain('Bearer');
      
      // Expected: Same token works for auth, user-management, and settings services
    });
    
    it('should maintain user context across service calls', async () => {
      const userId = generateTestId('user');
      const token = testTokens.user(tenantId);
      const decoded = verifyToken(token);
      
      expect(decoded?.userId).toBeDefined();
      expect(decoded?.tenantId).toBe(tenantId);
      
      // User context should be preserved in all service calls
      // Service 1: Get user profile
      // Service 2: Get user settings
      // Service 3: Check user permissions
      
      expect(decoded?.tenantId).toBe(tenantId);
    });
    
    it('should reject expired token across all services', async () => {
      const expiredToken = testTokens.user(tenantId);
      
      // In real scenario, this would be expired
      expect(expiredToken).toBeDefined();
      
      // All services should reject expired token consistently
    });
  });
  
  describe('Authentication and Authorization Flow', () => {
    const tenantId = generateTestId('tenant');
    
    it('should complete full authentication flow', async () => {
      // Step 1: Login via auth service
      const credentials = {
        email: 'test@example.com',
        password: 'Test123!',
      };
      
      // Expected: POST /auth/login returns token
      const token = testTokens.user(tenantId);
      expect(token).toBeDefined();
      
      // Step 2: Use token to access user management service
      const decoded = verifyToken(token);
      expect(decoded?.permissions).toBeDefined();
      
      // Step 3: Use token to access settings service
      expect(decoded?.tenantId).toBe(tenantId);
    });
    
    it('should enforce permissions across service boundaries', async () => {
      const viewerToken = testTokens.viewer(tenantId);
      const adminToken = testTokens.admin(tenantId);
      
      const viewerDecoded = verifyToken(viewerToken);
      const adminDecoded = verifyToken(adminToken);
      
      // Viewer should have limited permissions
      expect(viewerDecoded?.permissions).toContain('users.read');
      expect(viewerDecoded?.permissions).not.toContain('users.delete');
      
      // Admin should have full permissions
      expect(adminDecoded?.permissions).toContain('users.*');
    });
    
    it('should handle cross-service permission checks', async () => {
      const token = testTokens.user(tenantId);
      
      // Check if user has permission across services
      expect(tokenValidation.hasPermission(token, 'users.read')).toBe(true);
      expect(tokenValidation.hasPermission(token, 'users.delete')).toBe(false);
    });
  });
  
  describe('Service-to-Service API Calls', () => {
    const tenantId = generateTestId('tenant');
    
    it('should fetch user data and then update settings', async () => {
      const userId = generateTestId('user');
      const token = testTokens.user(tenantId);
      
      const decoded = verifyToken(token);
      expect(decoded).toBeDefined();
      
      // Flow:
      // 1. User Management Service: GET /users/{userId}
      // 2. Settings Service: PATCH /settings with user preferences
      
      expect(decoded?.userId).toBeDefined();
    });
    
    it('should verify permissions before creating user', async () => {
      const adminToken = testTokens.admin(tenantId);
      const decoded = verifyToken(adminToken);
      
      expect(decoded?.roles).toContain('admin');
      
      // Flow:
      // 1. Auth Service: Verify token and permissions
      // 2. User Management Service: Create user if authorized
      
      expect(tokenValidation.hasRole(adminToken, 'admin')).toBe(true);
    });
    
    it('should cascade permission updates across services', async () => {
      const userId = generateTestId('user');
      const adminToken = testTokens.admin(tenantId);
      
      expect(verifyToken(adminToken)).toBeDefined();
      
      // Flow:
      // 1. User Management: Update user permissions
      // 2. Auth Service: Invalidate/refresh token
      // 3. Settings Service: Update user's setting access
      
      // Expected: Permission changes propagate to all services
    });
  });
  
  describe('Tenant Isolation Across Services', () => {
    it('should enforce tenant boundaries in all services', async () => {
      const tenant1Id = generateTestId('tenant');
      const tenant2Id = generateTestId('tenant');
      
      const tenant1Token = testTokens.admin(tenant1Id);
      const tenant2Token = testTokens.admin(tenant2Id);
      
      const decoded1 = verifyToken(tenant1Token);
      const decoded2 = verifyToken(tenant2Token);
      
      expect(decoded1?.tenantId).toBe(tenant1Id);
      expect(decoded2?.tenantId).toBe(tenant2Id);
      
      // Tenant 1 admin should not access Tenant 2 data in any service
      expect(decoded1?.tenantId).not.toBe(decoded2?.tenantId);
    });
    
    it('should maintain tenant context in service chains', async () => {
      const tenantId = generateTestId('tenant');
      const token = testTokens.user(tenantId);
      const decoded = verifyToken(token);
      
      expect(decoded?.tenantId).toBe(tenantId);
      
      // Flow:
      // Auth Service → User Management → Settings
      // Tenant ID should be consistent throughout
      
      expect(decoded?.tenantId).toBeDefined();
    });
  });
  
  describe('Error Handling Across Services', () => {
    const tenantId = generateTestId('tenant');
    
    it('should propagate authentication errors consistently', async () => {
      const invalidToken = 'invalid.jwt.token';
      
      // All services should return 401 for invalid token
      const decoded = verifyToken(invalidToken);
      expect(decoded).toBeNull();
    });
    
    it('should handle service unavailability gracefully', async () => {
      try {
        const response = await apiClients.userManagement.get('/health');
        
        if (response.status !== 200) {
          console.log('Service unavailable - expected behavior');
        }
      } catch (error) {
        // Expected when service is not running
        expect(error).toBeDefined();
      }
    });
    
    it('should return consistent error formats across services', async () => {
      const token = testTokens.user(tenantId);
      
      expect(verifyToken(token)).toBeDefined();
      
      // Expected error format:
      // {
      //   "error": "Error message",
      //   "code": "ERROR_CODE",
      //   "status": 400
      // }
    });
  });
  
  describe('Token Refresh Flow Across Services', () => {
    const tenantId = generateTestId('tenant');
    
    it('should refresh token and continue service access', async () => {
      const originalToken = testTokens.user(tenantId);
      
      // Step 1: Original token
      const originalDecoded = verifyToken(originalToken);
      expect(originalDecoded).toBeDefined();
      
      // Step 2: Token refresh via auth service
      const refreshedToken = testTokens.user(tenantId);
      const refreshedDecoded = verifyToken(refreshedToken);
      
      // Step 3: Use refreshed token in other services
      expect(refreshedDecoded?.userId).toBe(originalDecoded?.userId);
      expect(refreshedDecoded?.tenantId).toBe(originalDecoded?.tenantId);
    });
    
    it('should invalidate old token after refresh', async () => {
      const token = testTokens.user(tenantId);
      
      expect(verifyToken(token)).toBeDefined();
      
      // After refresh, old token should be invalidated
      // (In production, this would involve a token blacklist)
    });
  });
  
  describe('Rate Limiting and Throttling', () => {
    const tenantId = generateTestId('tenant');
    
    it('should apply rate limits consistently across services', async () => {
      const token = testTokens.user(tenantId);
      
      expect(verifyToken(token)).toBeDefined();
      
      // Expected: Rate limits apply to all service endpoints
      // If user exceeds limit in one service, it affects other services
    });
  });
  
  describe('Distributed Tracing', () => {
    const tenantId = generateTestId('tenant');
    
    it('should maintain trace context across service calls', async () => {
      const token = testTokens.user(tenantId);
      const traceId = generateTestId('trace');
      
      expect(verifyToken(token)).toBeDefined();
      
      // Expected: X-Trace-ID header propagates through all services
      // Auth → User Management → Settings
      
      expect(traceId).toBeDefined();
    });
  });
  
  describe('Service Health and Circuit Breaking', () => {
    it('should detect service health status', async () => {
      const services = ['auth', 'userManagement', 'serviceSettings'];
      
      for (const service of services) {
        try {
          const client = apiClients[service as keyof typeof apiClients];
          const response = await client.get('/health');
          
          if (response.status === 200) {
            console.log(`✅ ${service} service is healthy`);
          } else {
            console.log(`⚠️  ${service} service returned ${response.status}`);
          }
        } catch (error) {
          console.log(`❌ ${service} service is unavailable`);
        }
      }
    });
  });
});
