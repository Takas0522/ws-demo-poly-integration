/**
 * Seed Data Validation Utilities
 * 
 * Validates seed data files against schema and checks relationship integrity
 */

import {
  Tenant,
  User,
  Permission,
  TenantUser,
  Service,
  Validators,
  ValidValues,
  isTenant,
  isUser,
  isPermission,
  isTenantUser,
  isService,
  TenantStatus,
  UserStatus,
  SubscriptionPlan,
  PermissionCategory,
  PermissionAction,
  PermissionScope,
} from './types';

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: 'error';
  entity: string;
  field?: string;
  message: string;
  value?: any;
}

export interface ValidationWarning {
  type: 'warning';
  entity: string;
  field?: string;
  message: string;
  value?: any;
}

/**
 * Validate tenant data
 */
export function validateTenant(tenant: any, index: number): ValidationResult {
  const result: ValidationResult = { valid: true, errors: [], warnings: [] };
  const entityId = `Tenant[${index}]`;

  // Check if it's a valid tenant structure
  if (!isTenant(tenant)) {
    result.valid = false;
    result.errors.push({
      type: 'error',
      entity: entityId,
      message: 'Invalid tenant structure',
    });
    return result;
  }

  // Validate required fields
  if (!tenant.id || tenant.id.trim() === '') {
    result.valid = false;
    result.errors.push({
      type: 'error',
      entity: entityId,
      field: 'id',
      message: 'id field is required and cannot be empty',
    });
  }

  if (!tenant.tenantId || tenant.tenantId.trim() === '') {
    result.valid = false;
    result.errors.push({
      type: 'error',
      entity: entityId,
      field: 'tenantId',
      message: 'tenantId field is required and cannot be empty',
    });
  }

  // Validate ID matches tenantId
  if (tenant.id !== tenant.tenantId) {
    result.valid = false;
    result.errors.push({
      type: 'error',
      entity: entityId,
      field: 'id',
      message: `Tenant ID (${tenant.id}) must match tenantId (${tenant.tenantId})`,
    });
  }

  // Validate status
  const validStatuses: TenantStatus[] = ['active', 'suspended', 'inactive'];
  if (!validStatuses.includes(tenant.status)) {
    result.valid = false;
    result.errors.push({
      type: 'error',
      entity: entityId,
      field: 'status',
      message: `Invalid status: ${tenant.status}. Must be one of: ${validStatuses.join(', ')}`,
      value: tenant.status,
    });
  }

  // Validate subscription plan
  const validPlans: SubscriptionPlan[] = ['free', 'basic', 'professional', 'enterprise'];
  if (!validPlans.includes(tenant.subscription?.plan)) {
    result.valid = false;
    result.errors.push({
      type: 'error',
      entity: entityId,
      field: 'subscription.plan',
      message: `Invalid subscription plan: ${tenant.subscription?.plan}. Must be one of: ${validPlans.join(', ')}`,
      value: tenant.subscription?.plan,
    });
  }

  // Validate dates
  if (tenant.subscription?.startDate && !Validators.isValidISOTimestamp(tenant.subscription.startDate)) {
    result.warnings.push({
      type: 'warning',
      entity: entityId,
      field: 'subscription.startDate',
      message: 'Start date is not a valid ISO 8601 timestamp',
      value: tenant.subscription.startDate,
    });
  }

  if (tenant.subscription?.endDate && !Validators.isValidISOTimestamp(tenant.subscription.endDate)) {
    result.warnings.push({
      type: 'warning',
      entity: entityId,
      field: 'subscription.endDate',
      message: 'End date is not a valid ISO 8601 timestamp',
      value: tenant.subscription.endDate,
    });
  }

  return result;
}

/**
 * Validate user data (seed data format with password field)
 */
export function validateUser(user: any, index: number, validTenantIds: Set<string>): ValidationResult {
  const result: ValidationResult = { valid: true, errors: [], warnings: [] };
  const entityId = `User[${index}]`;

  // Check basic structure
  if (!user.id || !user.tenantId || !user.email || !user.username) {
    result.valid = false;
    result.errors.push({
      type: 'error',
      entity: entityId,
      message: 'Missing required fields (id, tenantId, email, username)',
    });
    return result;
  }

  // Validate email
  if (!Validators.isValidEmail(user.email)) {
    result.valid = false;
    result.errors.push({
      type: 'error',
      entity: entityId,
      field: 'email',
      message: `Invalid email format: ${user.email}`,
      value: user.email,
    });
  }

  // Validate tenant relationship
  if (!validTenantIds.has(user.tenantId)) {
    result.valid = false;
    result.errors.push({
      type: 'error',
      entity: entityId,
      field: 'tenantId',
      message: `User references non-existent tenant: ${user.tenantId}`,
      value: user.tenantId,
    });
  }

  // Validate status
  const validStatuses: UserStatus[] = ['active', 'inactive', 'suspended', 'locked'];
  if (!validStatuses.includes(user.status)) {
    result.valid = false;
    result.errors.push({
      type: 'error',
      entity: entityId,
      field: 'status',
      message: `Invalid status: ${user.status}. Must be one of: ${validStatuses.join(', ')}`,
      value: user.status,
    });
  }

  // Validate roles array
  if (!Array.isArray(user.roles) || user.roles.length === 0) {
    result.valid = false;
    result.errors.push({
      type: 'error',
      entity: entityId,
      field: 'roles',
      message: 'User must have at least one role',
    });
  }

  // Validate permissions array
  if (!Array.isArray(user.permissions)) {
    result.valid = false;
    result.errors.push({
      type: 'error',
      entity: entityId,
      field: 'permissions',
      message: 'Permissions must be an array',
    });
  } else {
    // Validate each permission format
    user.permissions.forEach((perm: string, permIndex: number) => {
      if (!Validators.isValidPermissionName(perm)) {
        result.warnings.push({
          type: 'warning',
          entity: entityId,
          field: `permissions[${permIndex}]`,
          message: `Invalid permission name format: ${perm}`,
          value: perm,
        });
      }
    });
  }

  // Check for password field (required in seed data)
  if (!user.password || user.password.trim() === '') {
    result.valid = false;
    result.errors.push({
      type: 'error',
      entity: entityId,
      field: 'password',
      message: 'Password field is required in seed data (will be hashed during seeding)',
    });
  }

  return result;
}

/**
 * Validate permission data
 */
export function validatePermission(permission: any, index: number, validTenantIds: Set<string>): ValidationResult {
  const result: ValidationResult = { valid: true, errors: [], warnings: [] };
  const entityId = `Permission[${index}]`;

  // Check basic structure
  if (!permission.name || !permission.category || !permission.action) {
    result.valid = false;
    result.errors.push({
      type: 'error',
      entity: entityId,
      message: 'Missing required fields (name, category, action)',
    });
    return result;
  }

  // Validate permission name format
  if (!Validators.isValidPermissionName(permission.name)) {
    result.valid = false;
    result.errors.push({
      type: 'error',
      entity: entityId,
      field: 'name',
      message: `Invalid permission name format: ${permission.name}`,
      value: permission.name,
    });
  }

  // Validate category
  const validCategories: PermissionCategory[] = ['users', 'services', 'settings', 'system'];
  if (!validCategories.includes(permission.category)) {
    result.valid = false;
    result.errors.push({
      type: 'error',
      entity: entityId,
      field: 'category',
      message: `Invalid category: ${permission.category}. Must be one of: ${validCategories.join(', ')}`,
      value: permission.category,
    });
  }

  // Validate action
  const validActions: PermissionAction[] = ['create', 'read', 'update', 'delete', 'execute'];
  if (!validActions.includes(permission.action)) {
    result.valid = false;
    result.errors.push({
      type: 'error',
      entity: entityId,
      field: 'action',
      message: `Invalid action: ${permission.action}. Must be one of: ${validActions.join(', ')}`,
      value: permission.action,
    });
  }

  // Validate scope
  const validScopes: PermissionScope[] = ['tenant', 'global', 'own'];
  if (permission.scope && !validScopes.includes(permission.scope)) {
    result.valid = false;
    result.errors.push({
      type: 'error',
      entity: entityId,
      field: 'scope',
      message: `Invalid scope: ${permission.scope}. Must be one of: ${validScopes.join(', ')}`,
      value: permission.scope,
    });
  }

  return result;
}

/**
 * Validate all seed data and check relationships
 */
export function validateSeedData(
  tenants: any[],
  users: any[],
  permissions: any[]
): ValidationResult {
  const result: ValidationResult = { valid: true, errors: [], warnings: [] };

  // Validate tenants first
  const validTenantIds = new Set<string>();
  tenants.forEach((tenant, index) => {
    const tenantResult = validateTenant(tenant, index);
    result.errors.push(...tenantResult.errors);
    result.warnings.push(...tenantResult.warnings);
    if (!tenantResult.valid) {
      result.valid = false;
    } else {
      validTenantIds.add(tenant.tenantId);
    }
  });

  // Check for duplicate tenant IDs
  const tenantIdCounts = new Map<string, number>();
  tenants.forEach((tenant) => {
    const count = tenantIdCounts.get(tenant.tenantId) || 0;
    tenantIdCounts.set(tenant.tenantId, count + 1);
  });
  tenantIdCounts.forEach((count, tenantId) => {
    if (count > 1) {
      result.valid = false;
      result.errors.push({
        type: 'error',
        entity: 'Tenants',
        field: 'tenantId',
        message: `Duplicate tenant ID found: ${tenantId}`,
        value: tenantId,
      });
    }
  });

  // Validate users
  const permissionNames = new Set<string>();
  users.forEach((user, index) => {
    const userResult = validateUser(user, index, validTenantIds);
    result.errors.push(...userResult.errors);
    result.warnings.push(...userResult.warnings);
    if (!userResult.valid) {
      result.valid = false;
    }

    // Collect permission names for later validation
    if (Array.isArray(user.permissions)) {
      user.permissions.forEach((perm: string) => permissionNames.add(perm));
    }
  });

  // Validate permissions
  const definedPermissions = new Set<string>();
  permissions.forEach((permission, index) => {
    const permResult = validatePermission(permission, index, validTenantIds);
    result.errors.push(...permResult.errors);
    result.warnings.push(...permResult.warnings);
    if (!permResult.valid) {
      result.valid = false;
    } else {
      definedPermissions.add(permission.name);
    }
  });

  // Check if all user permissions are defined
  permissionNames.forEach((permName) => {
    if (!definedPermissions.has(permName)) {
      result.warnings.push({
        type: 'warning',
        entity: 'Users',
        field: 'permissions',
        message: `User references undefined permission: ${permName}`,
        value: permName,
      });
    }
  });

  return result;
}

/**
 * Print validation results
 */
export function printValidationResults(result: ValidationResult): void {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Seed Data Validation Results');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  if (result.errors.length === 0 && result.warnings.length === 0) {
    console.log('✅ All validations passed!');
    console.log('');
    return;
  }

  if (result.errors.length > 0) {
    console.log('❌ ERRORS:');
    result.errors.forEach((error) => {
      const field = error.field ? ` (${error.field})` : '';
      console.log(`  • ${error.entity}${field}: ${error.message}`);
      if (error.value !== undefined) {
        console.log(`    Value: ${JSON.stringify(error.value)}`);
      }
    });
    console.log('');
  }

  if (result.warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    result.warnings.forEach((warning) => {
      const field = warning.field ? ` (${warning.field})` : '';
      console.log(`  • ${warning.entity}${field}: ${warning.message}`);
      if (warning.value !== undefined) {
        console.log(`    Value: ${JSON.stringify(warning.value)}`);
      }
    });
    console.log('');
  }

  console.log(`Total: ${result.errors.length} error(s), ${result.warnings.length} warning(s)`);
  console.log('');

  if (!result.valid) {
    console.log('❌ Validation failed! Please fix errors before seeding data.');
  } else {
    console.log('✅ Validation passed with warnings. Review warnings before proceeding.');
  }
  console.log('');
}

/**
 * V2: Validate TenantUser data
 */
export function validateTenantUser(tenantUser: any, index: number, validUserIds: Set<string>, validTenantIds: Set<string>): ValidationResult {
  const result: ValidationResult = { valid: true, errors: [], warnings: [] };
  const entityId = `TenantUser[${index}]`;

  // Validate required fields
  if (!tenantUser.id || tenantUser.id.trim() === '') {
    result.valid = false;
    result.errors.push({
      type: 'error',
      entity: entityId,
      field: 'id',
      message: 'id field is required and cannot be empty',
    });
  }

  // Validate ID format
  if (tenantUser.id && !tenantUser.id.startsWith('tenantuser-')) {
    result.warnings.push({
      type: 'warning',
      entity: entityId,
      field: 'id',
      message: `ID should start with "tenantuser-" but got "${tenantUser.id}"`,
    });
  }

  // Validate userId
  if (!tenantUser.userId || tenantUser.userId.trim() === '') {
    result.valid = false;
    result.errors.push({
      type: 'error',
      entity: entityId,
      field: 'userId',
      message: 'userId field is required and cannot be empty',
    });
  } else if (!validUserIds.has(tenantUser.userId)) {
    result.errors.push({
      type: 'error',
      entity: entityId,
      field: 'userId',
      message: `userId "${tenantUser.userId}" does not exist in Users collection`,
      value: tenantUser.userId,
    });
    result.valid = false;
  }

  // Validate tenantId
  if (!tenantUser.tenantId || tenantUser.tenantId.trim() === '') {
    result.valid = false;
    result.errors.push({
      type: 'error',
      entity: entityId,
      field: 'tenantId',
      message: 'tenantId field is required and cannot be empty',
    });
  } else if (!validTenantIds.has(tenantUser.tenantId)) {
    result.errors.push({
      type: 'error',
      entity: entityId,
      field: 'tenantId',
      message: `tenantId "${tenantUser.tenantId}" does not exist in Tenants collection`,
      value: tenantUser.tenantId,
    });
    result.valid = false;
  }

  // Validate status
  if (!ValidValues.TENANT_USER_STATUSES.includes(tenantUser.status as any)) {
    result.valid = false;
    result.errors.push({
      type: 'error',
      entity: entityId,
      field: 'status',
      message: `Invalid status. Must be one of: ${ValidValues.TENANT_USER_STATUSES.join(', ')}`,
      value: tenantUser.status,
    });
  }

  // Validate roles array
  if (!Array.isArray(tenantUser.roles)) {
    result.valid = false;
    result.errors.push({
      type: 'error',
      entity: entityId,
      field: 'roles',
      message: 'roles must be an array',
    });
  }

  // Validate permissions array
  if (!Array.isArray(tenantUser.permissions)) {
    result.valid = false;
    result.errors.push({
      type: 'error',
      entity: entityId,
      field: 'permissions',
      message: 'permissions must be an array',
    });
  } else {
    tenantUser.permissions.forEach((perm: string, permIndex: number) => {
      if (!Validators.isValidPermissionName(perm)) {
        result.warnings.push({
          type: 'warning',
          entity: entityId,
          field: `permissions[${permIndex}]`,
          message: `Permission name "${perm}" does not follow dot notation format`,
          value: perm,
        });
      }
    });
  }

  // Validate timestamps
  if (tenantUser.joinedAt && !Validators.isValidISOTimestamp(tenantUser.joinedAt)) {
    result.warnings.push({
      type: 'warning',
      entity: entityId,
      field: 'joinedAt',
      message: 'joinedAt is not a valid ISO 8601 timestamp',
      value: tenantUser.joinedAt,
    });
  }

  if (tenantUser.leftAt && tenantUser.leftAt !== null && !Validators.isValidISOTimestamp(tenantUser.leftAt)) {
    result.warnings.push({
      type: 'warning',
      entity: entityId,
      field: 'leftAt',
      message: 'leftAt is not a valid ISO 8601 timestamp',
      value: tenantUser.leftAt,
    });
  }

  return result;
}

/**
 * V2: Validate Service data
 */
export function validateService(service: any, index: number): ValidationResult {
  const result: ValidationResult = { valid: true, errors: [], warnings: [] };
  const entityId = `Service[${index}]`;

  // Validate required fields
  if (!service.id || service.id.trim() === '') {
    result.valid = false;
    result.errors.push({
      type: 'error',
      entity: entityId,
      field: 'id',
      message: 'id field is required and cannot be empty',
    });
  }

  // Validate ID format
  if (service.id && !service.id.startsWith('service-')) {
    result.warnings.push({
      type: 'warning',
      entity: entityId,
      field: 'id',
      message: `ID should start with "service-" but got "${service.id}"`,
    });
  }

  // Validate tenantId (must be "system-internal")
  if (service.tenantId !== 'system-internal') {
    result.valid = false;
    result.errors.push({
      type: 'error',
      entity: entityId,
      field: 'tenantId',
      message: 'Service tenantId must be "system-internal"',
      value: service.tenantId,
    });
  }

  // Validate name
  if (!service.name || service.name.trim() === '') {
    result.valid = false;
    result.errors.push({
      type: 'error',
      entity: entityId,
      field: 'name',
      message: 'name field is required and cannot be empty',
    });
  }

  // Validate displayName (localized)
  if (!service.displayName || typeof service.displayName !== 'object') {
    result.valid = false;
    result.errors.push({
      type: 'error',
      entity: entityId,
      field: 'displayName',
      message: 'displayName must be an object with ja and en properties',
    });
  } else {
    if (!service.displayName.ja || service.displayName.ja.trim() === '') {
      result.valid = false;
      result.errors.push({
        type: 'error',
        entity: entityId,
        field: 'displayName.ja',
        message: 'Japanese display name is required',
      });
    }
    if (!service.displayName.en || service.displayName.en.trim() === '') {
      result.valid = false;
      result.errors.push({
        type: 'error',
        entity: entityId,
        field: 'displayName.en',
        message: 'English display name is required',
      });
    }
  }

  // Validate description (localized)
  if (!service.description || typeof service.description !== 'object') {
    result.valid = false;
    result.errors.push({
      type: 'error',
      entity: entityId,
      field: 'description',
      message: 'description must be an object with ja and en properties',
    });
  } else {
    if (!service.description.ja || service.description.ja.trim() === '') {
      result.valid = false;
      result.errors.push({
        type: 'error',
        entity: entityId,
        field: 'description.ja',
        message: 'Japanese description is required',
      });
    }
    if (!service.description.en || service.description.en.trim() === '') {
      result.valid = false;
      result.errors.push({
        type: 'error',
        entity: entityId,
        field: 'description.en',
        message: 'English description is required',
      });
    }
  }

  // Validate status
  if (!ValidValues.SERVICE_STATUSES.includes(service.status as any)) {
    result.valid = false;
    result.errors.push({
      type: 'error',
      entity: entityId,
      field: 'status',
      message: `Invalid status. Must be one of: ${ValidValues.SERVICE_STATUSES.join(', ')}`,
      value: service.status,
    });
  }

  // Validate requiredPlan array
  if (!Array.isArray(service.requiredPlan)) {
    result.valid = false;
    result.errors.push({
      type: 'error',
      entity: entityId,
      field: 'requiredPlan',
      message: 'requiredPlan must be an array',
    });
  } else {
    service.requiredPlan.forEach((plan: string, planIndex: number) => {
      if (!ValidValues.SUBSCRIPTION_PLANS.includes(plan as any)) {
        result.errors.push({
          type: 'error',
          entity: entityId,
          field: `requiredPlan[${planIndex}]`,
          message: `Invalid plan. Must be one of: ${ValidValues.SUBSCRIPTION_PLANS.join(', ')}`,
          value: plan,
        });
        result.valid = false;
      }
    });
  }

  // Validate features array
  if (!Array.isArray(service.features)) {
    result.valid = false;
    result.errors.push({
      type: 'error',
      entity: entityId,
      field: 'features',
      message: 'features must be an array',
    });
  } else {
    service.features.forEach((feature: any, featureIndex: number) => {
      if (!feature.key || feature.key.trim() === '') {
        result.errors.push({
          type: 'error',
          entity: entityId,
          field: `features[${featureIndex}].key`,
          message: 'Feature key is required',
        });
        result.valid = false;
      }
      if (!feature.displayName || typeof feature.displayName !== 'object') {
        result.errors.push({
          type: 'error',
          entity: entityId,
          field: `features[${featureIndex}].displayName`,
          message: 'Feature displayName must be an object with ja and en properties',
        });
        result.valid = false;
      }
      if (typeof feature.enabled !== 'boolean') {
        result.errors.push({
          type: 'error',
          entity: entityId,
          field: `features[${featureIndex}].enabled`,
          message: 'Feature enabled must be a boolean',
        });
        result.valid = false;
      }
    });
  }

  return result;
}
