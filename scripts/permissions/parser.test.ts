/**
 * Tests for permission parser
 */

import {
  validatePermissionFormat,
  parsePermission,
  matchesWildcard,
  isMoreSpecific,
  normalizePermission,
  expandWildcard
} from './parser';

describe('validatePermissionFormat', () => {
  test('should validate correct two-segment format', () => {
    const result = validatePermissionFormat('users.create');
    expect(result.valid).toBe(true);
  });

  test('should validate correct three-segment format', () => {
    const result = validatePermissionFormat('app.users.create');
    expect(result.valid).toBe(true);
  });

  test('should validate wildcard permissions', () => {
    expect(validatePermissionFormat('users.*').valid).toBe(true);
    expect(validatePermissionFormat('app.users.*').valid).toBe(true);
    expect(validatePermissionFormat('app.*').valid).toBe(true);
  });

  test('should allow hyphens in segments', () => {
    expect(validatePermissionFormat('api-keys.create').valid).toBe(true);
    expect(validatePermissionFormat('user-settings.update').valid).toBe(true);
  });

  test('should reject empty string', () => {
    const result = validatePermissionFormat('');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('non-empty');
  });

  test('should reject single segment', () => {
    const result = validatePermissionFormat('users');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('at least 2 segments');
  });

  test('should reject uppercase letters', () => {
    const result = validatePermissionFormat('Users.Create');
    expect(result.valid).toBe(false);
  });

  test('should reject wildcard in middle', () => {
    const result = validatePermissionFormat('users.*.create');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('end');
  });

  test('should reject wildcard without dot', () => {
    const result = validatePermissionFormat('users*');
    expect(result.valid).toBe(false);
  });

  test('should reject consecutive dots', () => {
    const result = validatePermissionFormat('users..create');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('consecutive dots');
  });

  test('should reject special characters', () => {
    expect(validatePermissionFormat('users.create!').valid).toBe(false);
    expect(validatePermissionFormat('users.create@admin').valid).toBe(false);
    expect(validatePermissionFormat('users_admin.create').valid).toBe(false);
  });
});

describe('parsePermission', () => {
  test('should parse two-segment permission', () => {
    const parsed = parsePermission('users.create');
    expect(parsed.full).toBe('users.create');
    expect(parsed.module).toBe('users');
    expect(parsed.action).toBe('create');
    expect(parsed.app).toBeUndefined();
    expect(parsed.isWildcard).toBe(false);
  });

  test('should parse three-segment permission', () => {
    const parsed = parsePermission('app.users.create');
    expect(parsed.full).toBe('app.users.create');
    expect(parsed.app).toBe('app');
    expect(parsed.module).toBe('users');
    expect(parsed.action).toBe('create');
    expect(parsed.isWildcard).toBe(false);
  });

  test('should parse wildcard permission', () => {
    const parsed = parsePermission('users.*');
    expect(parsed.full).toBe('users.*');
    expect(parsed.module).toBe('users');
    expect(parsed.action).toBe('*');
    expect(parsed.isWildcard).toBe(true);
    expect(parsed.wildcardPrefix).toBe('users');
  });

  test('should parse multi-level wildcard', () => {
    const parsed = parsePermission('app.users.*');
    expect(parsed.isWildcard).toBe(true);
    expect(parsed.wildcardPrefix).toBe('app.users');
  });

  test('should throw on invalid format', () => {
    expect(() => parsePermission('invalid')).toThrow();
    expect(() => parsePermission('Users.Create')).toThrow();
  });
});

describe('matchesWildcard', () => {
  test('should match exact wildcard prefix', () => {
    expect(matchesWildcard('users.create', 'users.*')).toBe(true);
    expect(matchesWildcard('users.read', 'users.*')).toBe(true);
    expect(matchesWildcard('users.update', 'users.*')).toBe(true);
  });

  test('should match nested wildcards', () => {
    expect(matchesWildcard('app.users.create', 'app.users.*')).toBe(true);
    expect(matchesWildcard('app.users.delete', 'app.users.*')).toBe(true);
  });

  test('should match broader wildcards', () => {
    expect(matchesWildcard('app.users.create', 'app.*')).toBe(true);
    expect(matchesWildcard('app.services.read', 'app.*')).toBe(true);
  });

  test('should not match non-wildcard patterns', () => {
    expect(matchesWildcard('users.create', 'users.create')).toBe(false);
  });

  test('should not match different modules', () => {
    expect(matchesWildcard('services.create', 'users.*')).toBe(false);
    expect(matchesWildcard('app.services.create', 'app.users.*')).toBe(false);
  });

  test('should not match partial segments', () => {
    expect(matchesWildcard('user.create', 'users.*')).toBe(false);
  });
});

describe('isMoreSpecific', () => {
  test('should detect concrete permissions are more specific than wildcards', () => {
    expect(isMoreSpecific('users.create', 'users.*')).toBe(true);
    expect(isMoreSpecific('users.*', 'users.create')).toBe(false);
  });

  test('should detect longer paths are more specific', () => {
    expect(isMoreSpecific('app.users.create', 'users.create')).toBe(true);
    expect(isMoreSpecific('users.create', 'app.users.create')).toBe(false);
  });

  test('should handle wildcards at different levels', () => {
    expect(isMoreSpecific('app.users.*', 'app.*')).toBe(true);
    expect(isMoreSpecific('app.*', 'app.users.*')).toBe(false);
  });
});

describe('normalizePermission', () => {
  test('should convert to lowercase', () => {
    expect(normalizePermission('Users.Create')).toBe('users.create');
    expect(normalizePermission('APP.USERS.CREATE')).toBe('app.users.create');
  });

  test('should trim whitespace', () => {
    expect(normalizePermission('  users.create  ')).toBe('users.create');
    expect(normalizePermission('\tusers.create\n')).toBe('users.create');
  });

  test('should handle already normalized permissions', () => {
    expect(normalizePermission('users.create')).toBe('users.create');
  });
});

describe('expandWildcard', () => {
  test('should expand wildcard to concrete permissions', () => {
    const actions = ['create', 'read', 'update', 'delete'];
    const result = expandWildcard('users.*', actions);
    
    expect(result).toHaveLength(4);
    expect(result).toContain('users.create');
    expect(result).toContain('users.read');
    expect(result).toContain('users.update');
    expect(result).toContain('users.delete');
  });

  test('should handle multi-level wildcards', () => {
    const actions = ['create', 'read'];
    const result = expandWildcard('app.users.*', actions);
    
    expect(result).toHaveLength(2);
    expect(result).toContain('app.users.create');
    expect(result).toContain('app.users.read');
  });

  test('should return as-is for non-wildcard permissions', () => {
    const actions = ['create', 'read'];
    const result = expandWildcard('users.create', actions);
    
    expect(result).toHaveLength(1);
    expect(result).toContain('users.create');
  });

  test('should handle empty actions array', () => {
    const result = expandWildcard('users.*', []);
    expect(result).toHaveLength(0);
  });
});
