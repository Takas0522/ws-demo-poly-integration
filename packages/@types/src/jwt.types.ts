/**
 * JWT (JSON Web Token) type definitions
 */

import { PermissionString } from './permission.types';
import { UserId } from './user.types';
import { TenantId } from './tenant.types';

/**
 * JWT token type
 */
export type JWTToken = string;

/**
 * JWT payload for access tokens
 */
export interface JWTAccessPayload {
  /** User ID */
  sub: UserId;
  /** User email */
  email: string;
  /** User display name */
  displayName: string;
  /** Tenant ID */
  tenantId: TenantId;
  /** User roles */
  roles: string[];
  /** User permissions (aggregated from roles and direct permissions) */
  permissions: PermissionString[];
  /** Token type */
  type: 'access';
  /** Issued at timestamp (seconds since epoch) */
  iat: number;
  /** Expiration timestamp (seconds since epoch) */
  exp: number;
  /** Issuer */
  iss?: string;
  /** Audience */
  aud?: string;
}

/**
 * JWT payload for refresh tokens
 */
export interface JWTRefreshPayload {
  /** User ID */
  sub: UserId;
  /** Tenant ID */
  tenantId: TenantId;
  /** Token type */
  type: 'refresh';
  /** Issued at timestamp (seconds since epoch) */
  iat: number;
  /** Expiration timestamp (seconds since epoch) */
  exp: number;
  /** Issuer */
  iss?: string;
  /** Audience */
  aud?: string;
  /** Token ID for revocation tracking */
  jti?: string;
}

/**
 * JWT payload union type
 */
export type JWTPayload = JWTAccessPayload | JWTRefreshPayload;

/**
 * Decoded JWT token with header and payload
 */
export interface DecodedJWT<T extends JWTPayload = JWTPayload> {
  /** JWT header */
  header: {
    alg: string;
    typ: string;
  };
  /** JWT payload */
  payload: T;
  /** JWT signature */
  signature: string;
}

/**
 * JWT token pair
 */
export interface JWTTokenPair {
  /** Access token (short-lived) */
  accessToken: JWTToken;
  /** Refresh token (long-lived) */
  refreshToken: JWTToken;
  /** Access token expiration time in seconds */
  expiresIn: number;
  /** Token type (always "Bearer") */
  tokenType: 'Bearer';
}

/**
 * JWT verification result
 */
export interface JWTVerificationResult<T extends JWTPayload = JWTPayload> {
  /** Whether the token is valid */
  valid: boolean;
  /** Decoded payload if valid */
  payload?: T;
  /** Error message if invalid */
  error?: string;
  /** Error code */
  errorCode?: 'EXPIRED' | 'INVALID' | 'MALFORMED' | 'REVOKED';
}
