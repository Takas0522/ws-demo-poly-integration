/**
 * Tenant-related type definitions
 */

/**
 * Tenant ID type for type safety
 */
export type TenantId = string;

/**
 * Tenant status enum
 */
export enum TenantStatus {
  Active = 'active',
  Inactive = 'inactive',
  Suspended = 'suspended',
  Trial = 'trial'
}

/**
 * Tenant subscription tier
 */
export enum TenantTier {
  Free = 'free',
  Basic = 'basic',
  Professional = 'professional',
  Enterprise = 'enterprise'
}

/**
 * Base tenant interface
 */
export interface Tenant {
  /** Unique tenant identifier */
  id: TenantId;
  /** Tenant name */
  name: string;
  /** Tenant display name */
  displayName: string;
  /** Tenant description */
  description?: string;
  /** Tenant status */
  status: TenantStatus;
  /** Subscription tier */
  tier: TenantTier;
  /** Tenant domain (for domain-based routing) */
  domain?: string;
  /** Tenant logo URL */
  logoUrl?: string;
  /** Tenant primary contact email */
  contactEmail: string;
  /** Tenant primary contact phone */
  contactPhone?: string;
  /** Tenant settings (JSON object) */
  settings?: Record<string, unknown>;
  /** Maximum number of users allowed */
  maxUsers?: number;
  /** Subscription start date */
  subscriptionStartDate?: Date;
  /** Subscription end date */
  subscriptionEndDate?: Date;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** Created by user ID */
  createdBy?: string;
  /** Last updated by user ID */
  updatedBy?: string;
}

/**
 * Tenant creation request
 */
export interface CreateTenantRequest {
  name: string;
  displayName: string;
  description?: string;
  tier: TenantTier;
  domain?: string;
  contactEmail: string;
  contactPhone?: string;
  settings?: Record<string, unknown>;
  maxUsers?: number;
}

/**
 * Tenant update request
 */
export interface UpdateTenantRequest {
  displayName?: string;
  description?: string;
  status?: TenantStatus;
  tier?: TenantTier;
  domain?: string;
  logoUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  settings?: Record<string, unknown>;
  maxUsers?: number;
  subscriptionEndDate?: Date;
}

/**
 * Tenant summary (lightweight tenant info)
 */
export interface TenantSummary {
  id: TenantId;
  name: string;
  displayName: string;
  status: TenantStatus;
  tier: TenantTier;
  logoUrl?: string;
}
