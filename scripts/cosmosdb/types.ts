/**
 * TypeScript Type Definitions for CosmosDB Schema
 * 
 * These types define the structure of documents stored in CosmosDB containers
 * for the SaaS Management Application.
 */

/**
 * Base interface for all documents
 */
export interface BaseDocument {
  id: string;
  tenantId: string;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
  createdBy: string;
  updatedBy: string;
}

/**
 * Tenant document
 */
export interface Tenant extends BaseDocument {
  name: string;
  status: TenantStatus;
  subscription: TenantSubscription;
  settings: TenantSettings;
  services?: TenantService[]; // V2: Services enabled for this tenant
}

export type TenantStatus = 'active' | 'suspended' | 'inactive';

/**
 * V2: Service enabled for a tenant
 */
export interface TenantService {
  serviceId: string;
  enabled: boolean;
  enabledAt: string; // ISO 8601 timestamp
  disabledAt: string | null;
}

export interface TenantSubscription {
  plan: SubscriptionPlan;
  startDate: string; // ISO 8601 date
  endDate: string; // ISO 8601 date
  maxUsers: number;
}

export type SubscriptionPlan = 'free' | 'basic' | 'professional' | 'enterprise';

export interface TenantSettings {
  timezone: string; // IANA timezone identifier
  locale: string; // Locale identifier (e.g., 'ja-JP', 'en-US')
  features: TenantFeatures;
  allowedDomains?: string[]; // V2: Allowed email domains (e.g., ["@company.com"])
}

export interface TenantFeatures {
  twoFactorAuth: boolean;
  apiAccess: boolean;
  advancedReporting: boolean;
  [key: string]: boolean; // Allow additional feature flags
}

/**
 * User document
 */
export interface User extends BaseDocument {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  status: UserStatus;
  roles: string[];
  permissions: string[];
  profile: UserProfile;
  security: UserSecurity;
  userType?: 'internal' | 'external'; // V2: User type (internal=管理会社内, external=管理会社外)
  primaryTenantId?: string; // V2: Primary tenant ID
}

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'locked';

export interface UserProfile {
  phoneNumber?: string;
  department?: string;
  jobTitle?: string;
  avatarUrl?: string;
}

export interface UserSecurity {
  lastLoginAt?: string; // ISO 8601 timestamp
  lastPasswordChangeAt: string; // ISO 8601 timestamp
  failedLoginAttempts: number;
  lockedUntil?: string; // ISO 8601 timestamp
  twoFactorEnabled: boolean;
  twoFactorSecret?: string; // Encrypted TOTP secret
}

/**
 * Permission document
 */
export interface Permission extends BaseDocument {
  name: string; // Dot-notation permission name (e.g., 'users.create')
  displayName: string;
  description: string;
  category: PermissionCategory;
  resource: string;
  action: PermissionAction;
  scope: PermissionScope;
  isActive: boolean;
  requiredPlan?: SubscriptionPlan;
  metadata?: PermissionMetadata;
}

export type PermissionCategory = 'users' | 'services' | 'settings' | 'system';

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'execute';

export type PermissionScope = 'tenant' | 'global' | 'own';

export interface PermissionMetadata {
  uiSection?: string;
  uiButton?: string;
  requiresConfirmation?: boolean;
  [key: string]: any; // Allow additional metadata fields
}

/**
 * Audit Log document
 */
export interface AuditLog {
  id: string;
  tenantId: string;
  timestamp: string; // ISO 8601 timestamp
  userId: string;
  userName: string;
  action: string; // Format: '{resource}.{action}'
  resource: AuditLogResource;
  details?: AuditLogDetails;
  metadata?: AuditLogMetadata;
  status: AuditLogStatus;
  ttl?: number; // Time to live in seconds (-1 for no expiry)
}

export interface AuditLogResource {
  type: string; // Resource type (e.g., 'User', 'Tenant', 'Permission')
  id: string;
  name?: string;
}

export interface AuditLogDetails {
  changes?: {
    [field: string]: {
      before: any;
      after: any;
    };
  };
  reason?: string;
  [key: string]: any; // Allow additional detail fields
}

export interface AuditLogMetadata {
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  sessionId?: string;
  [key: string]: any; // Allow additional metadata fields
}

export type AuditLogStatus = 'success' | 'failure' | 'warning';

/**
 * V2: TenantUser document - Multi-tenant user relationships
 */
export interface TenantUser {
  id: string;                    // Format: "tenantuser-{uuid}"
  userId: string;                 // Partition key
  tenantId: string;
  roles: string[];                // Tenant-specific roles
  permissions: string[];          // Tenant-specific permissions (dot notation)
  status: 'active' | 'inactive' | 'suspended';
  joinedAt: string;               // ISO 8601 timestamp
  leftAt: string | null;          // ISO 8601 timestamp (null if not left)
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

/**
 * V2: Service document - Service catalog
 */
export interface Service {
  id: string;                     // Format: "service-{uuid}"
  tenantId: string;               // Partition key (always "system-internal")
  name: string;                   // e.g., "file-management", "external-sharing", "ai-agent"
  displayName: LocalizedString;
  description: LocalizedString;
  category: string;               // e.g., "storage", "collaboration", "ai", "analytics"
  icon: string;                   // Icon name or URL
  status: 'active' | 'inactive' | 'beta';
  requiredPlan: SubscriptionPlan[];  // Plans that can use this service
  features: ServiceFeature[];
  pricing: ServicePricing[];
  metadata: ServiceMetadata;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

/**
 * V2: Localized string for multi-language support
 */
export interface LocalizedString {
  ja: string;
  en: string;
}

/**
 * V2: Service feature definition
 */
export interface ServiceFeature {
  key: string;
  displayName: LocalizedString;
  description: LocalizedString;
  enabled: boolean;
}

/**
 * V2: Service pricing information
 */
export interface ServicePricing {
  plan: SubscriptionPlan;
  price: number;
  currency: string;               // e.g., "JPY", "USD"
  billingCycle: 'monthly' | 'annual';
}

/**
 * V2: Service metadata
 */
export interface ServiceMetadata {
  version: string;
  releaseDate: string;            // ISO 8601 date
  deprecated: boolean;
}

/**
 * Query result types
 */
export interface QueryResult<T> {
  resources: T[];
  hasMoreResults: boolean;
  continuationToken?: string;
}

export interface PaginationOptions {
  maxItemCount?: number;
  continuationToken?: string;
}

/**
 * Database operation result types
 */
export interface CreateResult<T> {
  resource: T;
  statusCode: number;
  requestCharge: number;
}

export interface ReadResult<T> {
  resource: T;
  statusCode: number;
  requestCharge: number;
  etag: string;
}

export interface UpdateResult<T> {
  resource: T;
  statusCode: number;
  requestCharge: number;
  etag: string;
}

export interface DeleteResult {
  statusCode: number;
  requestCharge: number;
}

/**
 * Type guards for runtime type checking
 */
export function isTenant(doc: any): doc is Tenant {
  return (
    typeof doc.id === 'string' &&
    typeof doc.tenantId === 'string' &&
    typeof doc.name === 'string' &&
    typeof doc.status === 'string' &&
    typeof doc.subscription === 'object'
  );
}

export function isUser(doc: any): doc is User {
  return (
    typeof doc.id === 'string' &&
    typeof doc.tenantId === 'string' &&
    typeof doc.email === 'string' &&
    typeof doc.username === 'string' &&
    Array.isArray(doc.roles) &&
    Array.isArray(doc.permissions)
  );
}

export function isPermission(doc: any): doc is Permission {
  return (
    typeof doc.id === 'string' &&
    typeof doc.tenantId === 'string' &&
    typeof doc.name === 'string' &&
    typeof doc.category === 'string' &&
    typeof doc.action === 'string' &&
    typeof doc.scope === 'string'
  );
}

export function isAuditLog(doc: any): doc is AuditLog {
  return (
    typeof doc.id === 'string' &&
    typeof doc.tenantId === 'string' &&
    typeof doc.timestamp === 'string' &&
    typeof doc.userId === 'string' &&
    typeof doc.action === 'string' &&
    typeof doc.resource === 'object'
  );
}

/**
 * V2: Type guard for TenantUser
 */
export function isTenantUser(doc: any): doc is TenantUser {
  return (
    typeof doc.id === 'string' &&
    typeof doc.userId === 'string' &&
    typeof doc.tenantId === 'string' &&
    Array.isArray(doc.roles) &&
    Array.isArray(doc.permissions) &&
    typeof doc.status === 'string' &&
    ['active', 'inactive', 'suspended'].includes(doc.status)
  );
}

/**
 * V2: Type guard for Service
 */
export function isService(doc: any): doc is Service {
  return (
    typeof doc.id === 'string' &&
    typeof doc.tenantId === 'string' &&
    typeof doc.name === 'string' &&
    typeof doc.displayName === 'object' &&
    typeof doc.category === 'string' &&
    typeof doc.status === 'string' &&
    ['active', 'inactive', 'beta'].includes(doc.status)
  );
}

/**
 * Helper functions for document validation
 */
export const Validators = {
  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate permission name format (dot notation)
   * Allows formats like: users.create, api-keys.delete, user-settings.update
   * Format: {resource}.{action} where both parts can contain lowercase letters, numbers, and hyphens
   * Examples: users.read, api-keys.create, user-profile.update
   */
  isValidPermissionName(name: string): boolean {
    const permissionRegex = /^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/;
    return permissionRegex.test(name);
  },

  /**
   * Validate UUID format
   */
  isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  },

  /**
   * Validate ISO 8601 timestamp format
   */
  isValidISOTimestamp(timestamp: string): boolean {
    const date = new Date(timestamp);
    return !isNaN(date.getTime()) && date.toISOString() === timestamp;
  },
};

/**
 * Constants for document ID prefixes
 */
export const DocumentPrefixes = {
  TENANT: 'tenant-',
  USER: 'user-',
  PERMISSION: 'permission-',
  AUDIT_LOG: 'log-',
  TENANT_USER: 'tenantuser-',      // V2
  SERVICE: 'service-',              // V2
} as const;

/**
 * Constants for default values
 */
export const Defaults = {
  TENANT_STATUS: 'active' as TenantStatus,
  USER_STATUS: 'active' as UserStatus,
  PERMISSION_SCOPE: 'tenant' as PermissionScope,
  AUDIT_LOG_TTL: 7776000, // 90 days in seconds
  MAX_LOGIN_ATTEMPTS: 5,
  ACCOUNT_LOCKOUT_DURATION_MINUTES: 15,
} as const;

/**
 * V2: Constants for valid values
 */
export const ValidValues = {
  TENANT_USER_STATUSES: ['active', 'inactive', 'suspended'] as const,
  SERVICE_STATUSES: ['active', 'inactive', 'beta'] as const,
  USER_TYPES: ['internal', 'external'] as const,
  SUBSCRIPTION_PLANS: ['free', 'basic', 'professional', 'enterprise'] as const,
} as const;
