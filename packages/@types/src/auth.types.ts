/**
 * Authentication-related type definitions
 */

import { JWTTokenPair } from './jwt.types';
import { UserProfile } from './user.types';

/**
 * Login request
 */
export interface LoginRequest {
  /** User email */
  email: string;
  /** User password */
  password: string;
  /** Optional tenant ID for multi-tenant login */
  tenantId?: string;
  /** Remember me flag for extended session */
  rememberMe?: boolean;
}

/**
 * Login response
 */
export interface LoginResponse {
  /** JWT token pair */
  tokens: JWTTokenPair;
  /** User profile */
  user: UserProfile;
}

/**
 * Register request
 */
export interface RegisterRequest {
  /** User email */
  email: string;
  /** User password */
  password: string;
  /** User display name */
  displayName: string;
  /** User first name */
  firstName?: string;
  /** User last name */
  lastName?: string;
  /** Tenant ID (or will create new tenant) */
  tenantId?: string;
}

/**
 * Register response
 */
export interface RegisterResponse {
  /** JWT token pair */
  tokens: JWTTokenPair;
  /** User profile */
  user: UserProfile;
}

/**
 * Refresh token request
 */
export interface RefreshTokenRequest {
  /** Refresh token */
  refreshToken: string;
}

/**
 * Refresh token response
 */
export interface RefreshTokenResponse {
  /** New JWT token pair */
  tokens: JWTTokenPair;
}

/**
 * Logout request
 */
export interface LogoutRequest {
  /** Optional: logout from all devices */
  allDevices?: boolean;
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  /** User email */
  email: string;
}

/**
 * Password reset confirmation request
 */
export interface PasswordResetConfirmRequest {
  /** Reset token */
  token: string;
  /** New password */
  newPassword: string;
}

/**
 * Change password request
 */
export interface ChangePasswordRequest {
  /** Current password */
  currentPassword: string;
  /** New password */
  newPassword: string;
}

/**
 * Verify email request
 */
export interface VerifyEmailRequest {
  /** Verification token */
  token: string;
}

/**
 * Session information
 */
export interface SessionInfo {
  /** Session ID */
  id: string;
  /** User ID */
  userId: string;
  /** Tenant ID */
  tenantId: string;
  /** Device/user agent information */
  userAgent?: string;
  /** IP address */
  ipAddress?: string;
  /** Session creation time */
  createdAt: Date;
  /** Last activity time */
  lastActivityAt: Date;
  /** Session expiration time */
  expiresAt: Date;
  /** Whether this is the current session */
  isCurrent?: boolean;
}
