/**
 * User-related type definitions
 */

/**
 * User ID type for type safety
 */
export type UserId = string;

/**
 * User status enum
 */
export enum UserStatus {
  Active = 'active',
  Inactive = 'inactive',
  Suspended = 'suspended',
  Pending = 'pending'
}

/**
 * Base user interface with core properties
 */
export interface User {
  /** Unique user identifier */
  id: UserId;
  /** User's email address (unique) */
  email: string;
  /** User's display name */
  displayName: string;
  /** User's first name */
  firstName?: string;
  /** User's last name */
  lastName?: string;
  /** User's current status */
  status: UserStatus;
  /** Tenant ID this user belongs to */
  tenantId: string;
  /** Roles assigned to the user */
  roles: string[];
  /** Direct permissions granted to the user */
  permissions: string[];
  /** User profile picture URL */
  profilePictureUrl?: string;
  /** User's phone number */
  phoneNumber?: string;
  /** User's preferred language */
  language?: string;
  /** User's timezone */
  timezone?: string;
  /** Last login timestamp */
  lastLoginAt?: Date;
  /** Account creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** User who created this user */
  createdBy?: UserId;
  /** User who last updated this user */
  updatedBy?: UserId;
}

/**
 * User creation request
 */
export interface CreateUserRequest {
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  tenantId: string;
  roles?: string[];
  permissions?: string[];
  password: string;
  phoneNumber?: string;
  language?: string;
  timezone?: string;
}

/**
 * User update request
 */
export interface UpdateUserRequest {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  status?: UserStatus;
  roles?: string[];
  permissions?: string[];
  profilePictureUrl?: string;
  phoneNumber?: string;
  language?: string;
  timezone?: string;
}

/**
 * User profile (public-facing user info)
 */
export interface UserProfile {
  id: UserId;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string;
  status: UserStatus;
}
