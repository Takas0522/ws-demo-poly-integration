import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { JWTAccessPayload, JWTRefreshPayload, JWTTokenPair, JWTVerificationResult } from '@saas-app/types';
import { config } from '../config';

/**
 * JWT Token Service
 * Handles token generation, verification, and validation
 */
export class TokenService {
  /**
   * Generate an access token for a user
   */
  static generateAccessToken(payload: Omit<JWTAccessPayload, 'type' | 'iat' | 'exp' | 'iss' | 'aud'>): string {
    const now = Math.floor(Date.now() / 1000);
    
    const tokenPayload: JWTAccessPayload = {
      ...payload,
      type: 'access',
      iat: now,
      exp: now + 3600, // 1 hour from now
      iss: config.jwt.issuer,
      aud: config.jwt.audience,
    };

    return jwt.sign(tokenPayload, config.jwt.secret, {
      algorithm: config.jwt.algorithm,
    });
  }

  /**
   * Generate a refresh token for a user
   */
  static generateRefreshToken(userId: string, tenantId: string): string {
    const now = Math.floor(Date.now() / 1000);
    const jti = uuidv4(); // Unique token ID for revocation tracking
    
    const tokenPayload: JWTRefreshPayload = {
      sub: userId,
      tenantId,
      type: 'refresh',
      iat: now,
      exp: now + 7 * 24 * 3600, // 7 days from now
      iss: config.jwt.issuer,
      aud: config.jwt.audience,
      jti,
    };

    return jwt.sign(tokenPayload, config.jwt.secret, {
      algorithm: config.jwt.algorithm,
    });
  }

  /**
   * Generate a complete token pair (access + refresh)
   */
  static generateTokenPair(
    userId: string,
    email: string,
    displayName: string,
    tenantId: string,
    roles: string[],
    permissions: string[]
  ): JWTTokenPair {
    const accessToken = this.generateAccessToken({
      sub: userId,
      email,
      displayName,
      tenantId,
      roles,
      permissions,
    });

    const refreshToken = this.generateRefreshToken(userId, tenantId);

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600, // 1 hour in seconds
      tokenType: 'Bearer',
    };
  }

  /**
   * Verify and decode an access token
   */
  static verifyAccessToken(token: string): JWTVerificationResult<JWTAccessPayload> {
    try {
      const payload = jwt.verify(token, config.jwt.secret, {
        algorithms: [config.jwt.algorithm],
        issuer: config.jwt.issuer,
        audience: config.jwt.audience,
      }) as JWTAccessPayload;

      if (payload.type !== 'access') {
        return {
          valid: false,
          error: 'Invalid token type',
          errorCode: 'INVALID',
        };
      }

      return {
        valid: true,
        payload,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return {
          valid: false,
          error: 'Token expired',
          errorCode: 'EXPIRED',
        };
      } else if (error instanceof jwt.JsonWebTokenError) {
        return {
          valid: false,
          error: 'Invalid token',
          errorCode: 'INVALID',
        };
      } else {
        return {
          valid: false,
          error: 'Token verification failed',
          errorCode: 'MALFORMED',
        };
      }
    }
  }

  /**
   * Verify and decode a refresh token
   */
  static verifyRefreshToken(token: string): JWTVerificationResult<JWTRefreshPayload> {
    try {
      const payload = jwt.verify(token, config.jwt.secret, {
        algorithms: [config.jwt.algorithm],
        issuer: config.jwt.issuer,
        audience: config.jwt.audience,
      }) as JWTRefreshPayload;

      if (payload.type !== 'refresh') {
        return {
          valid: false,
          error: 'Invalid token type',
          errorCode: 'INVALID',
        };
      }

      return {
        valid: true,
        payload,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return {
          valid: false,
          error: 'Refresh token expired',
          errorCode: 'EXPIRED',
        };
      } else if (error instanceof jwt.JsonWebTokenError) {
        return {
          valid: false,
          error: 'Invalid refresh token',
          errorCode: 'INVALID',
        };
      } else {
        return {
          valid: false,
          error: 'Refresh token verification failed',
          errorCode: 'MALFORMED',
        };
      }
    }
  }

  /**
   * Decode a token without verification (for debugging)
   */
  static decode(token: string): { header: { alg: string; typ: string }; payload: JWTAccessPayload | JWTRefreshPayload } | null {
    return jwt.decode(token, { complete: true }) as { header: { alg: string; typ: string }; payload: JWTAccessPayload | JWTRefreshPayload } | null;
  }
}
