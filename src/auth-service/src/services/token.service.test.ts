import { TokenService } from '../services/token.service';

// Mock config
jest.mock('../config', () => {
  const mockConfig = {
    jwt: {
      algorithm: 'HS256',
      secret: 'test-secret-key-for-testing-only',
      accessTokenExpiry: '1h',
      refreshTokenExpiry: '7d',
      issuer: 'saas-auth-service',
      audience: 'saas-app',
    },
  };
  return {
    config: mockConfig,
    default: mockConfig,
  };
});

describe('TokenService', () => {
  const testUserId = 'user-123';
  const testEmail = 'test@example.com';
  const testDisplayName = 'Test User';
  const testTenantId = 'tenant-123';
  const testRoles = ['user'];
  const testPermissions = ['users.read'];

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = TokenService.generateAccessToken({
        sub: testUserId,
        email: testEmail,
        displayName: testDisplayName,
        tenantId: testTenantId,
        roles: testRoles,
        permissions: testPermissions,
      });

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
    });

    it('should include correct payload in access token', () => {
      const token = TokenService.generateAccessToken({
        sub: testUserId,
        email: testEmail,
        displayName: testDisplayName,
        tenantId: testTenantId,
        roles: testRoles,
        permissions: testPermissions,
      });

      const decoded = TokenService.decode(token);
      expect(decoded).toBeDefined();
      const payload = decoded?.payload as any;
      expect(payload.sub).toBe(testUserId);
      expect(payload.email).toBe(testEmail);
      expect(payload.type).toBe('access');
      expect(payload.tenantId).toBe(testTenantId);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = TokenService.generateRefreshToken(testUserId, testTenantId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include correct payload in refresh token', () => {
      const token = TokenService.generateRefreshToken(testUserId, testTenantId);

      const decoded = TokenService.decode(token);
      expect(decoded).toBeDefined();
      const payload = decoded?.payload as any;
      expect(payload.sub).toBe(testUserId);
      expect(payload.type).toBe('refresh');
      expect(payload.tenantId).toBe(testTenantId);
      expect(payload.jti).toBeDefined();
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      const tokenPair = TokenService.generateTokenPair(
        testUserId,
        testEmail,
        testDisplayName,
        testTenantId,
        testRoles,
        testPermissions
      );

      expect(tokenPair.accessToken).toBeDefined();
      expect(tokenPair.refreshToken).toBeDefined();
      expect(tokenPair.tokenType).toBe('Bearer');
      expect(tokenPair.expiresIn).toBe(3600);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = TokenService.generateAccessToken({
        sub: testUserId,
        email: testEmail,
        displayName: testDisplayName,
        tenantId: testTenantId,
        roles: testRoles,
        permissions: testPermissions,
      });

      const result = TokenService.verifyAccessToken(token);

      expect(result.valid).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload?.sub).toBe(testUserId);
      expect(result.payload?.type).toBe('access');
    });

    it('should reject an invalid token', () => {
      const result = TokenService.verifyAccessToken('invalid-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.errorCode).toBeDefined();
    });

    it('should reject a refresh token as access token', () => {
      const refreshToken = TokenService.generateRefreshToken(testUserId, testTenantId);
      const result = TokenService.verifyAccessToken(refreshToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token type');
      expect(result.errorCode).toBe('INVALID');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = TokenService.generateRefreshToken(testUserId, testTenantId);

      const result = TokenService.verifyRefreshToken(token);

      expect(result.valid).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload?.sub).toBe(testUserId);
      expect(result.payload?.type).toBe('refresh');
    });

    it('should reject an invalid refresh token', () => {
      const result = TokenService.verifyRefreshToken('invalid-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.errorCode).toBeDefined();
    });

    it('should reject an access token as refresh token', () => {
      const accessToken = TokenService.generateAccessToken({
        sub: testUserId,
        email: testEmail,
        displayName: testDisplayName,
        tenantId: testTenantId,
        roles: testRoles,
        permissions: testPermissions,
      });
      const result = TokenService.verifyRefreshToken(accessToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token type');
      expect(result.errorCode).toBe('INVALID');
    });
  });
});
