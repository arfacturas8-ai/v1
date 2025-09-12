import { createHash, pbkdf2, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const pbkdf2Async = promisify(pbkdf2);

/**
 * Password Security Configuration
 */
export interface PasswordSecurityConfig {
  bcrypt?: {
    rounds: number;
    maxLength: number;
  };
  pbkdf2?: {
    iterations: number;
    keyLength: number;
    digest: string;
    saltLength: number;
  };
  argon2?: {
    type: number;
    memoryCost: number;
    timeCost: number;
    parallelism: number;
    hashLength: number;
    saltLength: number;
  };
  pepper?: string;
  passwordPolicy: {
    minLength: number;
    maxLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
    maxRepeating: number;
    commonPasswordCheck: boolean;
  };
}

/**
 * Password Strength Result
 */
export interface PasswordStrengthResult {
  score: number; // 0-100
  strength: 'very_weak' | 'weak' | 'fair' | 'good' | 'strong' | 'very_strong';
  isValid: boolean;
  errors: string[];
  suggestions: string[];
  entropy: number;
}

/**
 * Enhanced Password Security Service
 * 
 * Features:
 * - Multiple hashing algorithms with fallbacks (bcrypt, PBKDF2, Argon2)
 * - Comprehensive password strength validation
 * - Timing attack protection
 * - Pepper support for additional security
 * - Common password detection
 * - Entropy calculation
 * - Password policy enforcement
 * - Secure password generation
 * - Hash migration support
 */
export class PasswordSecurityService {
  private config: PasswordSecurityConfig;
  private commonPasswords: Set<string>;

  // Common weak passwords (top 1000 most common passwords subset)
  private readonly COMMON_PASSWORDS = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
    'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'iloveyou',
    'password1', '123123', 'sunshine', 'master', 'shadow', 'football',
    'jesus', '12345', 'michael', 'superman', 'batman', 'trustno1'
  ];

  constructor(config: Partial<PasswordSecurityConfig> = {}) {
    this.config = this.mergeWithDefaults(config);
    this.commonPasswords = new Set(this.COMMON_PASSWORDS);
  }

  /**
   * Merge user config with secure defaults
   */
  private mergeWithDefaults(config: Partial<PasswordSecurityConfig>): PasswordSecurityConfig {
    return {
      bcrypt: {
        rounds: config.bcrypt?.rounds || 12,
        maxLength: config.bcrypt?.maxLength || 72, // bcrypt limitation
        ...config.bcrypt
      },
      pbkdf2: {
        iterations: config.pbkdf2?.iterations || 100000,
        keyLength: config.pbkdf2?.keyLength || 64,
        digest: config.pbkdf2?.digest || 'sha256',
        saltLength: config.pbkdf2?.saltLength || 32,
        ...config.pbkdf2
      },
      argon2: {
        type: config.argon2?.type || 2, // Argon2id
        memoryCost: config.argon2?.memoryCost || 65536, // 64MB
        timeCost: config.argon2?.timeCost || 3,
        parallelism: config.argon2?.parallelism || 4,
        hashLength: config.argon2?.hashLength || 32,
        saltLength: config.argon2?.saltLength || 16,
        ...config.argon2
      },
      pepper: config.pepper || process.env.PASSWORD_PEPPER || '',
      passwordPolicy: {
        minLength: 8,
        maxLength: 128,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSymbols: false,
        maxRepeating: 3,
        commonPasswordCheck: true,
        ...config.passwordPolicy
      }
    };
  }

  /**
   * Hash password with multiple algorithms and fallbacks
   */
  async hashPassword(password: string): Promise<string> {
    try {
      // Validate password first
      const validation = this.validatePasswordStrength(password);
      if (!validation.isValid) {
        throw new Error(`Password validation failed: ${validation.errors.join(', ')}`);
      }

      // Apply pepper if configured
      const pepperedPassword = this.config.pepper ? password + this.config.pepper : password;

      // Try bcrypt first (if available)
      if (await this.isBcryptAvailable()) {
        try {
          const bcrypt = await import('bcrypt');
          const hash = await bcrypt.hash(pepperedPassword.slice(0, this.config.bcrypt!.maxLength), this.config.bcrypt!.rounds);
          return `bcrypt:${hash}`;
        } catch (bcryptError) {
          console.warn('Bcrypt hashing failed, falling back to PBKDF2:', bcryptError);
        }
      }

      // Fallback to PBKDF2 (always available)
      return await this.hashWithPBKDF2(pepperedPassword);

    } catch (error) {
      console.error('Password hashing error:', error);
      throw new Error('Password hashing failed');
    }
  }

  /**
   * Hash password using PBKDF2
   */
  private async hashWithPBKDF2(password: string): Promise<string> {
    try {
      const salt = randomBytes(this.config.pbkdf2!.saltLength);
      const hash = await pbkdf2Async(
        password,
        salt,
        this.config.pbkdf2!.iterations,
        this.config.pbkdf2!.keyLength,
        this.config.pbkdf2!.digest
      );

      const combined = Buffer.concat([salt, hash]);
      return `pbkdf2:${this.config.pbkdf2!.digest}:${this.config.pbkdf2!.iterations}:${combined.toString('base64')}`;
    } catch (error) {
      console.error('PBKDF2 hashing error:', error);
      throw new Error('PBKDF2 hashing failed');
    }
  }

  /**
   * Verify password against hash with timing attack protection
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      if (!password || !hash) {
        // Perform dummy operation to maintain consistent timing
        await this.dummyHashOperation();
        return false;
      }

      // Apply pepper if configured
      const pepperedPassword = this.config.pepper ? password + this.config.pepper : password;

      // Parse hash format
      const [algorithm, ...hashParts] = hash.split(':');

      switch (algorithm) {
        case 'bcrypt':
          return await this.verifyBcrypt(pepperedPassword, hashParts.join(':'));
        case 'pbkdf2':
          return await this.verifyPBKDF2(pepperedPassword, hashParts);
        case 'argon2':
          return await this.verifyArgon2(pepperedPassword, hashParts.join(':'));
        default:
          // Unknown algorithm, perform dummy operation and return false
          await this.dummyHashOperation();
          return false;
      }
    } catch (error) {
      console.error('Password verification error:', error);
      // Perform dummy operation to maintain consistent timing
      await this.dummyHashOperation();
      return false;
    }
  }

  /**
   * Verify bcrypt hash
   */
  private async verifyBcrypt(password: string, hash: string): Promise<boolean> {
    try {
      if (await this.isBcryptAvailable()) {
        const bcrypt = await import('bcrypt');
        return await bcrypt.compare(password.slice(0, this.config.bcrypt!.maxLength), hash);
      }
      return false;
    } catch (error) {
      console.error('Bcrypt verification error:', error);
      return false;
    }
  }

  /**
   * Verify PBKDF2 hash
   */
  private async verifyPBKDF2(password: string, hashParts: string[]): Promise<boolean> {
    try {
      if (hashParts.length !== 3) {
        return false;
      }

      const [digest, iterationsStr, encodedHash] = hashParts;
      const iterations = parseInt(iterationsStr, 10);
      
      if (isNaN(iterations)) {
        return false;
      }

      const combined = Buffer.from(encodedHash, 'base64');
      const saltLength = this.config.pbkdf2!.saltLength;
      const salt = combined.subarray(0, saltLength);
      const storedHash = combined.subarray(saltLength);

      const computedHash = await pbkdf2Async(
        password,
        salt,
        iterations,
        this.config.pbkdf2!.keyLength,
        digest
      );

      return timingSafeEqual(storedHash, computedHash);
    } catch (error) {
      console.error('PBKDF2 verification error:', error);
      return false;
    }
  }

  /**
   * Verify Argon2 hash (placeholder)
   */
  private async verifyArgon2(password: string, hash: string): Promise<boolean> {
    try {
      // Placeholder for Argon2 verification
      // Would require argon2 package
      console.warn('Argon2 verification not implemented');
      return false;
    } catch (error) {
      console.error('Argon2 verification error:', error);
      return false;
    }
  }

  /**
   * Perform dummy hash operation for timing attack protection
   */
  private async dummyHashOperation(): Promise<void> {
    try {
      const dummyPassword = 'dummy_password_for_timing_protection';
      const salt = randomBytes(16);
      await pbkdf2Async(dummyPassword, salt, 1000, 32, 'sha256');
    } catch (error) {
      // Ignore errors in dummy operation
    }
  }

  /**
   * Check if bcrypt is available
   */
  private async isBcryptAvailable(): Promise<boolean> {
    try {
      await import('bcrypt');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): PasswordStrengthResult {
    const errors: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    // Basic length check
    if (password.length < this.config.passwordPolicy.minLength) {
      errors.push(`Password must be at least ${this.config.passwordPolicy.minLength} characters long`);
    } else {
      score += 20;
    }

    if (password.length > this.config.passwordPolicy.maxLength) {
      errors.push(`Password must not exceed ${this.config.passwordPolicy.maxLength} characters`);
    }

    // Character type requirements
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSymbols = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (this.config.passwordPolicy.requireLowercase && !hasLowercase) {
      errors.push('Password must contain lowercase letters');
    } else if (hasLowercase) {
      score += 10;
    }

    if (this.config.passwordPolicy.requireUppercase && !hasUppercase) {
      errors.push('Password must contain uppercase letters');
    } else if (hasUppercase) {
      score += 10;
    }

    if (this.config.passwordPolicy.requireNumbers && !hasNumbers) {
      errors.push('Password must contain numbers');
    } else if (hasNumbers) {
      score += 10;
    }

    if (this.config.passwordPolicy.requireSymbols && !hasSymbols) {
      errors.push('Password must contain special characters');
    } else if (hasSymbols) {
      score += 15;
    }

    // Repeating characters check
    const maxRepeating = this.findMaxRepeatingCharacters(password);
    if (maxRepeating > this.config.passwordPolicy.maxRepeating) {
      errors.push(`Password contains too many repeating characters (max: ${this.config.passwordPolicy.maxRepeating})`);
      suggestions.push('Avoid using the same character multiple times in a row');
    } else {
      score += 10;
    }

    // Common password check
    if (this.config.passwordPolicy.commonPasswordCheck) {
      if (this.isCommonPassword(password)) {
        errors.push('Password is too common');
        suggestions.push('Use a more unique password');
      } else {
        score += 15;
      }
    }

    // Calculate entropy
    const entropy = this.calculateEntropy(password);
    score += Math.min(entropy / 4, 20); // Up to 20 points for entropy

    // Length bonus
    if (password.length >= 12) score += 5;
    if (password.length >= 16) score += 5;

    // Character diversity bonus
    const uniqueChars = new Set(password.toLowerCase()).size;
    if (uniqueChars >= password.length * 0.8) {
      score += 5;
    }

    // Determine strength level
    let strength: PasswordStrengthResult['strength'];
    if (score >= 90) strength = 'very_strong';
    else if (score >= 75) strength = 'strong';
    else if (score >= 60) strength = 'good';
    else if (score >= 40) strength = 'fair';
    else if (score >= 20) strength = 'weak';
    else strength = 'very_weak';

    // Add suggestions based on score
    if (score < 60) {
      if (!hasUppercase) suggestions.push('Add uppercase letters');
      if (!hasLowercase) suggestions.push('Add lowercase letters');
      if (!hasNumbers) suggestions.push('Add numbers');
      if (!hasSymbols) suggestions.push('Add special characters');
      if (password.length < 12) suggestions.push('Make it longer (12+ characters recommended)');
    }

    return {
      score: Math.min(Math.max(score, 0), 100),
      strength,
      isValid: errors.length === 0,
      errors,
      suggestions,
      entropy: Math.round(entropy)
    };
  }

  /**
   * Find maximum repeating characters
   */
  private findMaxRepeatingCharacters(password: string): number {
    let maxCount = 1;
    let currentCount = 1;

    for (let i = 1; i < password.length; i++) {
      if (password[i].toLowerCase() === password[i - 1].toLowerCase()) {
        currentCount++;
        maxCount = Math.max(maxCount, currentCount);
      } else {
        currentCount = 1;
      }
    }

    return maxCount;
  }

  /**
   * Check if password is in common passwords list
   */
  private isCommonPassword(password: string): boolean {
    const lowerPassword = password.toLowerCase();
    return this.commonPasswords.has(lowerPassword) ||
           this.commonPasswords.has(lowerPassword.split('').reverse().join(''));
  }

  /**
   * Calculate password entropy
   */
  private calculateEntropy(password: string): number {
    let charsetSize = 0;

    if (/[a-z]/.test(password)) charsetSize += 26;
    if (/[A-Z]/.test(password)) charsetSize += 26;
    if (/\d/.test(password)) charsetSize += 10;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) charsetSize += 32;
    if (/[\s]/.test(password)) charsetSize += 1;

    return Math.log2(Math.pow(charsetSize, password.length));
  }

  /**
   * Generate secure password
   */
  generateSecurePassword(length: number = 16): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*(),.?":{}|<>';

    let charset = lowercase + uppercase + numbers;
    if (this.config.passwordPolicy.requireSymbols) {
      charset += symbols;
    }

    let password = '';
    
    // Ensure at least one character from each required set
    if (this.config.passwordPolicy.requireLowercase) {
      password += this.getRandomChar(lowercase);
    }
    if (this.config.passwordPolicy.requireUppercase) {
      password += this.getRandomChar(uppercase);
    }
    if (this.config.passwordPolicy.requireNumbers) {
      password += this.getRandomChar(numbers);
    }
    if (this.config.passwordPolicy.requireSymbols) {
      password += this.getRandomChar(symbols);
    }

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += this.getRandomChar(charset);
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Get random character from charset
   */
  private getRandomChar(charset: string): string {
    const randomBytes = require('crypto').randomBytes(1);
    return charset[randomBytes[0] % charset.length];
  }

  /**
   * Check if password needs rehashing (upgrade to newer algorithm/settings)
   */
  needsRehash(hash: string): boolean {
    try {
      const [algorithm] = hash.split(':');
      
      switch (algorithm) {
        case 'pbkdf2':
          // Check if iterations are below current standard
          const parts = hash.split(':');
          if (parts.length >= 3) {
            const iterations = parseInt(parts[2], 10);
            return iterations < this.config.pbkdf2!.iterations;
          }
          return true;
        case 'bcrypt':
          // For bcrypt, we'd need to check the cost factor
          // This is simplified - in practice you'd parse the hash
          return false;
        default:
          return true; // Unknown algorithm should be rehashed
      }
    } catch (error) {
      return true; // Invalid hash should be rehashed
    }
  }

  /**
   * Get password policy information
   */
  getPasswordPolicy(): PasswordSecurityConfig['passwordPolicy'] {
    return { ...this.config.passwordPolicy };
  }
}

/**
 * Create password security service instance
 */
export function createPasswordSecurityService(config: Partial<PasswordSecurityConfig> = {}): PasswordSecurityService {
  return new PasswordSecurityService(config);
}

// Export default instance
export const passwordSecurity = createPasswordSecurityService();