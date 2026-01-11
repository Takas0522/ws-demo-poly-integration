import { PasswordUtils } from '../utils/password';

describe('PasswordUtils', () => {
  describe('hash', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123!';
      const hash = await PasswordUtils.hash(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await PasswordUtils.hash(password);
      const hash2 = await PasswordUtils.hash(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verify', () => {
    it('should verify a correct password', async () => {
      const password = 'TestPassword123!';
      const hash = await PasswordUtils.hash(password);
      const isValid = await PasswordUtils.verify(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject an incorrect password', async () => {
      const password = 'TestPassword123!';
      const hash = await PasswordUtils.hash(password);
      const isValid = await PasswordUtils.verify('WrongPassword123!', hash);

      expect(isValid).toBe(false);
    });
  });

  describe('validate', () => {
    beforeEach(() => {
      // Set default requirements
      process.env.PASSWORD_MIN_LENGTH = '8';
      process.env.PASSWORD_REQUIRE_UPPERCASE = 'true';
      process.env.PASSWORD_REQUIRE_LOWERCASE = 'true';
      process.env.PASSWORD_REQUIRE_NUMBERS = 'true';
      process.env.PASSWORD_REQUIRE_SPECIAL_CHARS = 'true';
    });

    it('should validate a strong password', () => {
      const result = PasswordUtils.validate('StrongPass123!');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject a password that is too short', () => {
      const result = PasswordUtils.validate('Short1!');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject a password without uppercase letters', () => {
      const result = PasswordUtils.validate('lowercase123!');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject a password without lowercase letters', () => {
      const result = PasswordUtils.validate('UPPERCASE123!');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject a password without numbers', () => {
      const result = PasswordUtils.validate('NoNumbers!');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject a password without special characters', () => {
      const result = PasswordUtils.validate('NoSpecial123');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should return multiple errors for multiple violations', () => {
      const result = PasswordUtils.validate('weak');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
});
