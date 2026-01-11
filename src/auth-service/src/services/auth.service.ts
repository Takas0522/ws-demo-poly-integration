import { v4 as uuidv4 } from 'uuid';
import { CosmosDbService } from './cosmosdb.service';
import { TokenService } from './token.service';
import { PasswordUtils } from '../utils/password';
import { LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse } from '@saas-app/types';
import { config } from '../config';

interface RefreshTokenDocument {
  id: string;
  userId: string;
  tenantId: string;
  tokenId: string; // jti from JWT
  token: string;
  expiresAt: string;
  createdAt: string;
  deviceInfo?: string;
  ipAddress?: string;
}

interface UserDocument {
  id: string;
  email: string;
  username: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  passwordHash: string;
  status: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
  security: {
    lastLoginAt?: string;
    failedLoginAttempts: number;
    lockedUntil?: string;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Authentication Service
 * Handles user authentication, token management, and session tracking
 */
export class AuthService {
  private cosmosDb: CosmosDbService;

  constructor() {
    this.cosmosDb = CosmosDbService.getInstance();
  }

  /**
   * Authenticate a user and generate tokens
   */
  async login(request: LoginRequest): Promise<LoginResponse> {
    const { email, password, tenantId } = request;

    // Find user by email
    const user = await this.findUserByEmail(email, tenantId);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if account is locked
    if (user.security.lockedUntil) {
      const lockedUntil = new Date(user.security.lockedUntil);
      if (lockedUntil > new Date()) {
        throw new Error(`Account is locked until ${lockedUntil.toISOString()}`);
      }
    }

    // Verify password
    const isValidPassword = await PasswordUtils.verify(password, user.passwordHash);
    if (!isValidPassword) {
      await this.handleFailedLogin(user);
      throw new Error('Invalid email or password');
    }

    // Check account status
    if (user.status !== 'active') {
      throw new Error(`Account is ${user.status}`);
    }

    // Reset failed login attempts on successful login
    await this.resetFailedLoginAttempts(user.id, user.tenantId);

    // Generate tokens
    const tokens = TokenService.generateTokenPair(
      user.id,
      user.email,
      user.displayName,
      user.tenantId,
      user.roles,
      user.permissions
    );

    // Store refresh token
    await this.storeRefreshToken(user.id, user.tenantId, tokens.refreshToken);

    // Update last login timestamp
    await this.updateLastLogin(user.id, user.tenantId);

    return {
      tokens,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status as 'active' | 'inactive' | 'suspended' | 'pending',
      },
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const { refreshToken } = request;

    // Verify refresh token
    const verificationResult = TokenService.verifyRefreshToken(refreshToken);
    if (!verificationResult.valid || !verificationResult.payload) {
      throw new Error('Invalid or expired refresh token');
    }

    const { sub: userId, tenantId, jti } = verificationResult.payload;

    // Check if refresh token exists and is not revoked
    const isValid = await this.validateRefreshToken(userId, jti || '');
    if (!isValid) {
      throw new Error('Refresh token has been revoked');
    }

    // Get user details
    const user = await this.findUserById(userId, tenantId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check account status
    if (user.status !== 'active') {
      throw new Error(`Account is ${user.status}`);
    }

    // Generate new tokens
    const tokens = TokenService.generateTokenPair(
      user.id,
      user.email,
      user.displayName,
      user.tenantId,
      user.roles,
      user.permissions
    );

    // Store new refresh token and revoke old one
    await this.revokeRefreshToken(userId, jti || '');
    await this.storeRefreshToken(user.id, user.tenantId, tokens.refreshToken);

    return { tokens };
  }

  /**
   * Logout user by revoking refresh tokens
   */
  async logout(userId: string, refreshToken?: string, allDevices = false): Promise<void> {
    if (allDevices) {
      // Revoke all refresh tokens for user
      await this.revokeAllRefreshTokens(userId);
    } else if (refreshToken) {
      // Revoke specific refresh token
      const verificationResult = TokenService.verifyRefreshToken(refreshToken);
      if (verificationResult.valid && verificationResult.payload?.jti) {
        await this.revokeRefreshToken(userId, verificationResult.payload.jti);
      }
    }
  }

  /**
   * Find user by email
   */
  private async findUserByEmail(email: string, tenantId?: string): Promise<UserDocument | null> {
    try {
      const container = this.cosmosDb.getUsersContainer();
      const query = tenantId
        ? `SELECT * FROM c WHERE c.email = @email AND c.tenantId = @tenantId`
        : `SELECT * FROM c WHERE c.email = @email`;

      const { resources } = await container.items
        .query({
          query,
          parameters: [
            { name: '@email', value: email },
            ...(tenantId ? [{ name: '@tenantId', value: tenantId }] : []),
          ],
        })
        .fetchAll();

      return resources.length > 0 ? resources[0] : null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  /**
   * Find user by ID
   */
  private async findUserById(userId: string, tenantId: string): Promise<UserDocument | null> {
    try {
      const container = this.cosmosDb.getUsersContainer();
      const { resource } = await container.item(userId, tenantId).read();
      return resource || null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }

  /**
   * Store refresh token in database
   */
  private async storeRefreshToken(userId: string, tenantId: string, token: string): Promise<void> {
    const verificationResult = TokenService.verifyRefreshToken(token);
    if (!verificationResult.valid || !verificationResult.payload) {
      throw new Error('Invalid refresh token');
    }

    const { jti, exp } = verificationResult.payload;

    const tokenDoc: RefreshTokenDocument = {
      id: jti || uuidv4(),
      userId,
      tenantId,
      tokenId: jti || '',
      token,
      expiresAt: new Date(exp * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    const container = this.cosmosDb.getRefreshTokensContainer();
    await container.items.create(tokenDoc);
  }

  /**
   * Validate refresh token exists and is not revoked
   */
  private async validateRefreshToken(userId: string, tokenId: string): Promise<boolean> {
    try {
      const container = this.cosmosDb.getRefreshTokensContainer();
      const { resource } = await container.item(tokenId, userId).read();
      return !!resource;
    } catch (error) {
      return false;
    }
  }

  /**
   * Revoke a specific refresh token
   */
  private async revokeRefreshToken(userId: string, tokenId: string): Promise<void> {
    try {
      const container = this.cosmosDb.getRefreshTokensContainer();
      await container.item(tokenId, userId).delete();
    } catch (error) {
      console.error('Error revoking refresh token:', error);
    }
  }

  /**
   * Revoke all refresh tokens for a user
   */
  private async revokeAllRefreshTokens(userId: string): Promise<void> {
    try {
      const container = this.cosmosDb.getRefreshTokensContainer();
      const query = 'SELECT * FROM c WHERE c.userId = @userId';
      const { resources } = await container.items
        .query({
          query,
          parameters: [{ name: '@userId', value: userId }],
        })
        .fetchAll();

      for (const token of resources) {
        await container.item(token.id, token.userId).delete();
      }
    } catch (error) {
      console.error('Error revoking all refresh tokens:', error);
    }
  }

  /**
   * Handle failed login attempt
   */
  private async handleFailedLogin(user: UserDocument): Promise<void> {
    const failedAttempts = (user.security.failedLoginAttempts || 0) + 1;
    const updates: {
      security: {
        lastLoginAt?: string;
        failedLoginAttempts: number;
        lockedUntil?: string;
      };
    } = {
      security: {
        ...user.security,
        failedLoginAttempts: failedAttempts,
      },
    };

    // Lock account if max attempts reached
    if (failedAttempts >= config.security.maxLoginAttempts) {
      const lockoutDuration = config.security.lockoutDurationMinutes * 60 * 1000;
      updates.security.lockedUntil = new Date(Date.now() + lockoutDuration).toISOString();
    }

    const container = this.cosmosDb.getUsersContainer();
    await container.item(user.id, user.tenantId).patch([
      { op: 'replace', path: '/security', value: updates.security },
    ]);
  }

  /**
   * Reset failed login attempts
   */
  private async resetFailedLoginAttempts(userId: string, tenantId: string): Promise<void> {
    try {
      const container = this.cosmosDb.getUsersContainer();
      await container.item(userId, tenantId).patch([
        { op: 'replace', path: '/security/failedLoginAttempts', value: 0 },
        { op: 'remove', path: '/security/lockedUntil' },
      ]);
    } catch (error) {
      console.error('Error resetting failed login attempts:', error);
    }
  }

  /**
   * Update last login timestamp
   */
  private async updateLastLogin(userId: string, tenantId: string): Promise<void> {
    try {
      const container = this.cosmosDb.getUsersContainer();
      await container.item(userId, tenantId).patch([
        { op: 'replace', path: '/security/lastLoginAt', value: new Date().toISOString() },
      ]);
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }
}
