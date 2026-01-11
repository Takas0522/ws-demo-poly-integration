/**
 * @saas-app/types
 * 
 * Shared TypeScript type definitions for SaaS Management Application
 * 
 * This package provides centralized type definitions for:
 * - User management
 * - Tenant/multi-tenancy
 * - Authentication & Authorization
 * - Permissions (dot notation system)
 * - JWT tokens
 * - API requests and responses
 * 
 * @packageDocumentation
 */

// User types
export * from './user.types';

// Tenant types
export * from './tenant.types';

// Permission types
export * from './permission.types';

// JWT types
export * from './jwt.types';

// API types
export * from './api.types';

// Authentication types
export * from './auth.types';

// Namespace exports for organized imports
export * as UserTypes from './user.types';
export * as TenantTypes from './tenant.types';
export * as PermissionTypes from './permission.types';
export * as JWTTypes from './jwt.types';
export * as APITypes from './api.types';
export * as AuthTypes from './auth.types';
