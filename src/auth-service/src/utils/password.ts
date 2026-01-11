import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Password utilities for hashing and validation
 */
export class PasswordUtils {
  /**
   * Hash a plain text password
   */
  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Verify a plain text password against a hash
   */
  static async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Validate password meets requirements
   */
  static validate(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const minLength = parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10);

    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }

    if (process.env.PASSWORD_REQUIRE_UPPERCASE === 'true' && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (process.env.PASSWORD_REQUIRE_LOWERCASE === 'true' && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (process.env.PASSWORD_REQUIRE_NUMBERS === 'true' && !/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (process.env.PASSWORD_REQUIRE_SPECIAL_CHARS === 'true' && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
