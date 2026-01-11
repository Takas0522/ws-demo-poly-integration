/**
 * Seed Data System Tests
 * 
 * Tests for validation and data loading functions
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  validateSeedData,
  validateTenant,
  validateUser,
  validatePermission,
  ValidationResult,
} from './validation';
import { Validators } from './types';

// Helper function to load seed data
function loadSeedData(environment: string) {
  const seedsDir = path.join(__dirname, 'data', 'seeds', environment);
  
  const tenantsFile = path.join(seedsDir, 'tenants.json');
  const usersFile = path.join(seedsDir, 'users.json');
  const permissionsFile = path.join(seedsDir, 'permissions.json');
  
  const tenants = JSON.parse(fs.readFileSync(tenantsFile, 'utf-8'));
  const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
  const permissions = JSON.parse(fs.readFileSync(permissionsFile, 'utf-8'));
  
  return { tenants, users, permissions };
}

describe('Seed Data Validation Tests', () => {
  
  describe('Validators', () => {
    it('should validate email addresses correctly', () => {
      expect(Validators.isValidEmail('test@example.com')).toBe(true);
      expect(Validators.isValidEmail('user+tag@example.co.jp')).toBe(true);
      expect(Validators.isValidEmail('invalid-email')).toBe(false);
      expect(Validators.isValidEmail('@example.com')).toBe(false);
      expect(Validators.isValidEmail('test@')).toBe(false);
    });
    
    it('should validate permission names correctly', () => {
      expect(Validators.isValidPermissionName('users.create')).toBe(true);
      expect(Validators.isValidPermissionName('api-keys.delete')).toBe(true);
      expect(Validators.isValidPermissionName('user-settings.update')).toBe(true);
      expect(Validators.isValidPermissionName('InvalidFormat')).toBe(false);
      expect(Validators.isValidPermissionName('no-dot')).toBe(false);
      expect(Validators.isValidPermissionName('too.many.dots')).toBe(false);
    });
    
    it('should validate ISO timestamps correctly', () => {
      expect(Validators.isValidISOTimestamp('2026-01-01T00:00:00.000Z')).toBe(true);
      expect(Validators.isValidISOTimestamp(new Date().toISOString())).toBe(true);
      expect(Validators.isValidISOTimestamp('2026-01-01')).toBe(false);
      expect(Validators.isValidISOTimestamp('invalid-date')).toBe(false);
    });
  });
  
  describe('Tenant Validation', () => {
    const { tenants } = loadSeedData('development');
    
    it('should validate valid tenants', () => {
      tenants.forEach((tenant: any, index: number) => {
        const result = validateTenant(tenant, index);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
    
    it('should reject tenant with missing id', () => {
      const invalid = { ...tenants[0], id: '' };
      const result = validateTenant(invalid, 0);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
    
    it('should reject tenant with invalid status', () => {
      const invalid = { ...tenants[0], status: 'invalid' };
      const result = validateTenant(invalid, 0);
      expect(result.valid).toBe(false);
    });
    
    it('should reject tenant with mismatched id and tenantId', () => {
      const invalid = { ...tenants[0], id: 'different-id' };
      const result = validateTenant(invalid, 0);
      expect(result.valid).toBe(false);
    });
  });
  
  describe('User Validation', () => {
    const { tenants, users } = loadSeedData('development');
    const validTenantIds = new Set(tenants.map((t: any) => t.tenantId));
    
    it('should validate valid users', () => {
      users.forEach((user: any, index: number) => {
        const result = validateUser(user, index, validTenantIds);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
    
    it('should reject user with invalid email', () => {
      const invalid = { ...users[0], email: 'invalid-email' };
      const result = validateUser(invalid, 0, validTenantIds);
      expect(result.valid).toBe(false);
    });
    
    it('should reject user with non-existent tenant', () => {
      const invalid = { ...users[0], tenantId: 'non-existent-tenant' };
      const result = validateUser(invalid, 0, validTenantIds);
      expect(result.valid).toBe(false);
    });
    
    it('should reject user without roles', () => {
      const invalid = { ...users[0], roles: [] };
      const result = validateUser(invalid, 0, validTenantIds);
      expect(result.valid).toBe(false);
    });
  });
  
  describe('Permission Validation', () => {
    const { tenants, permissions } = loadSeedData('development');
    const validTenantIds = new Set(tenants.map((t: any) => t.tenantId));
    
    it('should validate valid permissions', () => {
      permissions.forEach((perm: any, index: number) => {
        const result = validatePermission(perm, index, validTenantIds);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
    
    it('should reject permission with invalid name format', () => {
      const invalid = { ...permissions[0], name: 'InvalidFormat' };
      const result = validatePermission(invalid, 0, validTenantIds);
      expect(result.valid).toBe(false);
    });
    
    it('should reject permission with invalid category', () => {
      const invalid = { ...permissions[0], category: 'invalid' };
      const result = validatePermission(invalid, 0, validTenantIds);
      expect(result.valid).toBe(false);
    });
    
    it('should reject permission with invalid action', () => {
      const invalid = { ...permissions[0], action: 'invalid' };
      const result = validatePermission(invalid, 0, validTenantIds);
      expect(result.valid).toBe(false);
    });
  });
  
  describe('Full Seed Data Validation', () => {
    it('should validate development environment data', () => {
      const { tenants, users, permissions } = loadSeedData('development');
      const result = validateSeedData(tenants, users, permissions);
      expect(result.valid).toBe(true);
    });
    
    it('should validate staging environment data', () => {
      const { tenants, users, permissions } = loadSeedData('staging');
      const result = validateSeedData(tenants, users, permissions);
      expect(result.valid).toBe(true);
    });
    
    it('should validate testing environment data', () => {
      const { tenants, users, permissions } = loadSeedData('testing');
      const result = validateSeedData(tenants, users, permissions);
      expect(result.valid).toBe(true);
    });
    
    it('should detect duplicate tenant IDs', () => {
      const { tenants, users, permissions } = loadSeedData('development');
      const duplicateTenants = [...tenants, tenants[0]]; // Add duplicate
      const result = validateSeedData(duplicateTenants, users, permissions);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Duplicate'))).toBe(true);
    });
    
    it('should check relationship integrity', () => {
      const { tenants, users, permissions } = loadSeedData('development');
      
      // User referencing non-existent permission should generate warning
      const userWithInvalidPerm = { 
        ...users[0], 
        permissions: [...users[0].permissions, 'nonexistent.permission'] 
      };
      const modifiedUsers = [userWithInvalidPerm, ...users.slice(1)];
      
      const result = validateSeedData(tenants, modifiedUsers, permissions);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.message.includes('undefined permission'))).toBe(true);
    });
  });
  
  describe('Environment-Specific Data Tests', () => {
    it('should have multiple tenants in development', () => {
      const { tenants } = loadSeedData('development');
      expect(tenants.length).toBeGreaterThan(1);
    });
    
    it('should have single tenant in staging', () => {
      const { tenants } = loadSeedData('staging');
      expect(tenants.length).toBe(1);
    });
    
    it('should have admin user with full permissions in development', () => {
      const { users } = loadSeedData('development');
      const admin = users.find((u: any) => u.roles.includes('admin'));
      expect(admin).toBeDefined();
      expect(admin.permissions.length).toBeGreaterThan(10);
    });
    
    it('should have 2FA enabled for staging admin', () => {
      const { users } = loadSeedData('staging');
      const admin = users.find((u: any) => u.roles.includes('admin'));
      expect(admin).toBeDefined();
      expect(admin.security.twoFactorEnabled).toBe(true);
    });
  });
});

// Run tests if this file is executed directly
if (require.main === module) {
  console.log('Running seed data validation tests...');
  console.log('Note: Use Jest or another test runner for actual test execution');
  console.log('This file defines tests but needs a test runner to execute them.');
}
