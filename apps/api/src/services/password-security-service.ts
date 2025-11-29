import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { Redis } from 'ioredis';
import { prisma } from '@cryb/database';
import { AUTH_CONSTANTS } from '../models/auth-models';
import logger from '../utils/logger';

export interface PasswordPolicy {
  id: string;
  name: string;
  min_length: number;
  max_length: number;
  require_uppercase: boolean;
  require_lowercase: boolean;
  require_numbers: boolean;
  require_symbols: boolean;
  forbidden_patterns: string[];
  max_age_days?: number;
  history_count: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PasswordStrengthResult {
  score: number; // 0-100
  strength: 'very_weak' | 'weak' | 'moderate' | 'strong' | 'very_strong';
  feedback: string[];
  warnings: string[];
  meets_policy: boolean;
  estimated_crack_time: string;
}

export interface PasswordValidationResult {
  valid: boolean;
  strength: PasswordStrengthResult;
  policy_violations: string[];
  suggestions: string[];
}

export interface PasswordBreachCheckResult {
  is_breached: boolean;
  breach_count?: number;
  source: 'local_cache' | 'haveibeenpwned' | 'internal_database';
}

export interface PasswordHistoryEntry {
  hash: string;
  created_at: Date;
}

export class PasswordSecurityService {
  private redis: Redis;
  private readonly BREACH_CACHE_PREFIX = 'breach_check:';
  private readonly STRENGTH_CACHE_PREFIX = 'strength_check:';
  private readonly POLICY_CACHE_PREFIX = 'policy_cache:';
  private readonly CACHE_TTL = 86400; // 24 hours
  private readonly SALT_ROUNDS = 12;

  // Common passwords and patterns
  private readonly COMMON_PASSWORDS = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
    'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'iloveyou',
    'princess', 'dragon', 'superman', 'batman', 'master', 'jesus'
  ];

  private readonly KEYBOARD_PATTERNS = [
    'qwerty', 'asdfgh', 'zxcvbn', '123456', '098765', 'qwertyuiop',
    'asdfghjkl', 'zxcvbnm', '1q2w3e', 'a1s2d3', 'q1w2e3r4', '1a2s3d4f'
  ];

  private readonly DICTIONARY_WORDS = [
    'house', 'computer', 'internet', 'security', 'system', 'network',
    'server', 'database', 'application', 'software', 'hardware', 'mobile'
  ];

  constructor(redis: Redis) {
    this.redis = redis;
  }

  /**
   * Create a new password policy
   */
  async createPasswordPolicy(data: Omit<PasswordPolicy, 'id' | 'created_at' | 'updated_at'>): Promise<PasswordPolicy> {
    try {
      // Check if policy with same name exists
      const existing = await prisma.passwordPolicy.findUnique({
        where: { name: data.name }
      });

      if (existing) {
        throw new Error('Password policy with this name already exists');
      }

      // If this is being set as active, deactivate others
      if (data.is_active) {
        await prisma.passwordPolicy.updateMany({
          where: { is_active: true },
          data: { is_active: false }
        });
      }

      const policy = await prisma.passwordPolicy.create({
        data: {
          name: data.name,
          min_length: data.min_length,
          max_length: data.max_length,
          require_uppercase: data.require_uppercase,
          require_lowercase: data.require_lowercase,
          require_numbers: data.require_numbers,
          require_symbols: data.require_symbols,
          forbidden_patterns: data.forbidden_patterns,
          max_age_days: data.max_age_days,
          history_count: data.history_count,
          is_active: data.is_active
        }
      });

      // Clear policy cache
      await this.clearPolicyCache();

      logger.info(`Password policy created: ${policy.name}`);
      return policy;

    } catch (error) {
      logger.error('Error creating password policy:', error);
      throw error;
    }
  }

  /**
   * Get active password policy
   */
  async getActivePasswordPolicy(): Promise<PasswordPolicy | null> {
    try {
      // Check cache first
      const cacheKey = `${this.POLICY_CACHE_PREFIX}active`;
      const cached = await this.redis.get(cacheKey);

      if (cached) {
        const data = JSON.parse(cached);
        return {
          ...data,
          created_at: new Date(data.created_at),
          updated_at: new Date(data.updated_at)
        };
      }

      // Get from database
      const policy = await prisma.passwordPolicy.findFirst({
        where: { is_active: true }
      });

      if (policy) {
        // Cache the result
        await this.redis.setex(
          cacheKey,
          this.CACHE_TTL,
          JSON.stringify({
            ...policy,
            created_at: policy.created_at.toISOString(),
            updated_at: policy.updated_at.toISOString()
          })
        );
      }

      return policy;

    } catch (error) {
      logger.error('Error getting active password policy:', error);
      return null;
    }
  }

  /**
   * Validate password against policy and strength requirements
   */
  async validatePassword(password: string, userId?: string): Promise<PasswordValidationResult> {
    try {
      const policy = await this.getActivePasswordPolicy();
      const strength = await this.checkPasswordStrength(password);
      const policyViolations: string[] = [];
      const suggestions: string[] = [];

      if (policy) {
        // Check length
        if (password.length < policy.min_length) {
          policyViolations.push(`Password must be at least ${policy.min_length} characters long`);
        }
        if (password.length > policy.max_length) {
          policyViolations.push(`Password must be no more than ${policy.max_length} characters long`);
        }

        // Check character requirements
        if (policy.require_uppercase && !/[A-Z]/.test(password)) {
          policyViolations.push('Password must contain at least one uppercase letter');
          suggestions.push('Add uppercase letters (A-Z)');
        }
        if (policy.require_lowercase && !/[a-z]/.test(password)) {
          policyViolations.push('Password must contain at least one lowercase letter');
          suggestions.push('Add lowercase letters (a-z)');
        }
        if (policy.require_numbers && !/[0-9]/.test(password)) {
          policyViolations.push('Password must contain at least one number');
          suggestions.push('Add numbers (0-9)');
        }
        if (policy.require_symbols && !/[^A-Za-z0-9]/.test(password)) {
          policyViolations.push('Password must contain at least one special character');
          suggestions.push('Add special characters (!@#$%^&*)');
        }

        // Check forbidden patterns
        for (const pattern of policy.forbidden_patterns) {
          if (password.toLowerCase().includes(pattern.toLowerCase())) {
            policyViolations.push(`Password cannot contain "${pattern}"`);
          }
        }

        // Check password history if user provided
        if (userId && policy.history_count > 0) {
          const isReused = await this.checkPasswordHistory(userId, password, policy.history_count);
          if (isReused) {
            policyViolations.push('Password cannot be one of your recent passwords');
            suggestions.push('Choose a password you have not used recently');
          }
        }
      }

      // Additional suggestions based on strength analysis
      if (strength.score < 60) {
        suggestions.push('Consider using a longer password');
        suggestions.push('Mix uppercase and lowercase letters');
        suggestions.push('Include numbers and special characters');
        suggestions.push('Avoid common words and patterns');
      }

      return {
        valid: policyViolations.length === 0 && strength.score >= 50,
        strength,
        policy_violations: policyViolations,
        suggestions
      };

    } catch (error) {
      logger.error('Error validating password:', error);
      throw error;
    }
  }

  /**
   * Check password strength
   */
  async checkPasswordStrength(password: string): Promise<PasswordStrengthResult> {
    try {
      // Check cache first
      const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
      const cacheKey = `${this.STRENGTH_CACHE_PREFIX}${passwordHash}`;
      const cached = await this.redis.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      let score = 0;
      const feedback: string[] = [];
      const warnings: string[] = [];

      // Length scoring
      if (password.length >= 12) {
        score += 25;
        feedback.push('Good length');
      } else if (password.length >= 8) {
        score += 15;
        feedback.push('Adequate length');
      } else {
        score += 5;
        warnings.push('Password is too short');
      }

      // Character variety scoring
      let varietyScore = 0;
      if (/[a-z]/.test(password)) {
        varietyScore += 5;
        feedback.push('Contains lowercase letters');
      }
      if (/[A-Z]/.test(password)) {
        varietyScore += 5;
        feedback.push('Contains uppercase letters');
      }
      if (/[0-9]/.test(password)) {
        varietyScore += 5;
        feedback.push('Contains numbers');
      }
      if (/[^A-Za-z0-9]/.test(password)) {
        varietyScore += 10;
        feedback.push('Contains special characters');
      }
      score += varietyScore;

      // Entropy and complexity
      const entropy = this.calculateEntropy(password);
      if (entropy > 60) {
        score += 25;
        feedback.push('High entropy');
      } else if (entropy > 40) {
        score += 15;
        feedback.push('Good entropy');
      } else {
        score += 5;
        warnings.push('Low entropy - password is predictable');
      }

      // Check for common patterns
      const patternPenalty = this.checkCommonPatterns(password);
      score = Math.max(0, score - patternPenalty);

      if (patternPenalty > 0) {
        warnings.push('Contains common patterns or words');
      }

      // Check for breach (this would be cached for performance)
      const breachCheck = await this.checkPasswordBreach(password);
      if (breachCheck.is_breached) {
        score = Math.max(0, score - 30);
        warnings.push('Password found in data breaches');
        feedback.push(`Found in ${breachCheck.breach_count || 'multiple'} breaches`);
      }

      // Determine strength level
      let strength: PasswordStrengthResult['strength'];
      if (score >= 80) {
        strength = 'very_strong';
      } else if (score >= 60) {
        strength = 'strong';
      } else if (score >= 40) {
        strength = 'moderate';
      } else if (score >= 20) {
        strength = 'weak';
      } else {
        strength = 'very_weak';
      }

      // Estimate crack time
      const crackTime = this.estimateCrackTime(password, entropy);

      const result: PasswordStrengthResult = {
        score: Math.min(100, score),
        strength,
        feedback,
        warnings,
        meets_policy: score >= 50,
        estimated_crack_time: crackTime
      };

      // Cache the result (without the actual password)
      await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));

      return result;

    } catch (error) {
      logger.error('Error checking password strength:', error);
      throw error;
    }
  }

  /**
   * Hash password securely
   */
  async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, this.SALT_ROUNDS);
    } catch (error) {
      logger.error('Error hashing password:', error);
      throw error;
    }
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      logger.error('Error verifying password:', error);
      return false;
    }
  }

  /**
   * Update user password with history tracking
   */
  async updateUserPassword(userId: string, newPassword: string, currentPassword?: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password if provided
      if (currentPassword && user.password_hash) {
        const isCurrentValid = await this.verifyPassword(currentPassword, user.password_hash);
        if (!isCurrentValid) {
          throw new Error('Current password is incorrect');
        }
      }

      // Validate new password
      const validation = await this.validatePassword(newPassword, userId);
      if (!validation.valid) {
        throw new Error(`Password validation failed: ${validation.policy_violations.join(', ')}`);
      }

      // Hash new password
      const newPasswordHash = await this.hashPassword(newPassword);

      // Get password history
      const passwordHistory = Array.isArray(user.password_history) 
        ? user.password_history 
        : JSON.parse(user.password_history as string || '[]');

      // Add current password to history if it exists
      if (user.password_hash) {
        passwordHistory.unshift(user.password_hash);
      }

      // Keep only the required number of passwords in history
      const policy = await this.getActivePasswordPolicy();
      const historyCount = policy?.history_count || AUTH_CONSTANTS.PASSWORD_HISTORY_COUNT;
      const trimmedHistory = passwordHistory.slice(0, historyCount);

      // Update user record
      await prisma.user.update({
        where: { id: userId },
        data: {
          password_hash: newPasswordHash,
          password_history: trimmedHistory,
          last_password_change: new Date(),
          require_password_change: false
        }
      });

      // Log password change
      await this.logSecurityEvent({
        user_id: userId,
        event_type: 'password_change',
        ip_address: '0.0.0.0',
        user_agent: 'system',
        metadata: {
          strength_score: validation.strength.score,
          strength_level: validation.strength.strength
        }
      });

      logger.info(`Password updated for user ${userId}`);

    } catch (error) {
      logger.error('Error updating user password:', error);
      throw error;
    }
  }

  /**
   * Check if password needs to be changed based on age
   */
  async checkPasswordAge(userId: string): Promise<{
    needs_change: boolean;
    days_old: number;
    max_age?: number;
    expires_in_days?: number;
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { last_password_change: true, require_password_change: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.require_password_change) {
        return {
          needs_change: true,
          days_old: 0,
          max_age: 0
        };
      }

      const policy = await this.getActivePasswordPolicy();
      if (!policy?.max_age_days) {
        return {
          needs_change: false,
          days_old: 0
        };
      }

      const lastChange = user.last_password_change || new Date(0);
      const now = new Date();
      const daysOld = Math.floor((now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24));
      const needsChange = daysOld >= policy.max_age_days;
      const expiresInDays = Math.max(0, policy.max_age_days - daysOld);

      return {
        needs_change: needsChange,
        days_old: daysOld,
        max_age: policy.max_age_days,
        expires_in_days: expiresInDays
      };

    } catch (error) {
      logger.error('Error checking password age:', error);
      return {
        needs_change: false,
        days_old: 0
      };
    }
  }

  /**
   * Generate secure password suggestion
   */
  generateSecurePassword(length: number = 16): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    
    let password = '';
    
    // Ensure at least one character from each category
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => 0.5 - Math.random()).join('');
  }

  /**
   * Private helper methods
   */

  private async checkPasswordHistory(userId: string, password: string, historyCount: number): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password_hash: true, password_history: true }
      });

      if (!user) {
        return false;
      }

      const passwordHistory = Array.isArray(user.password_history) 
        ? user.password_history 
        : JSON.parse(user.password_history as string || '[]');

      // Check current password
      if (user.password_hash && await this.verifyPassword(password, user.password_hash)) {
        return true;
      }

      // Check password history
      for (let i = 0; i < Math.min(historyCount, passwordHistory.length); i++) {
        if (await this.verifyPassword(password, passwordHistory[i])) {
          return true;
        }
      }

      return false;

    } catch (error) {
      logger.error('Error checking password history:', error);
      return false;
    }
  }

  private async checkPasswordBreach(password: string): Promise<PasswordBreachCheckResult> {
    try {
      const passwordHash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
      const hashPrefix = passwordHash.substring(0, 5);
      const hashSuffix = passwordHash.substring(5);

      // Check cache first
      const cacheKey = `${this.BREACH_CACHE_PREFIX}${hashPrefix}`;
      const cached = await this.redis.get(cacheKey);

      if (cached) {
        const breachData = JSON.parse(cached);
        const breachCount = breachData[hashSuffix];
        return {
          is_breached: !!breachCount,
          breach_count: breachCount,
          source: 'local_cache'
        };
      }

      // In production, this would check against HaveIBeenPwned API
      // For now, check against common passwords
      const isCommon = this.COMMON_PASSWORDS.some(common => 
        password.toLowerCase().includes(common.toLowerCase())
      );

      if (isCommon) {
        return {
          is_breached: true,
          breach_count: 1000, // Mock high breach count for common passwords
          source: 'internal_database'
        };
      }

      return {
        is_breached: false,
        source: 'internal_database'
      };

    } catch (error) {
      logger.error('Error checking password breach:', error);
      return {
        is_breached: false,
        source: 'internal_database'
      };
    }
  }

  private calculateEntropy(password: string): number {
    const charSets = [];
    if (/[a-z]/.test(password)) charSets.push(26);
    if (/[A-Z]/.test(password)) charSets.push(26);
    if (/[0-9]/.test(password)) charSets.push(10);
    if (/[^A-Za-z0-9]/.test(password)) charSets.push(32);

    const charSetSize = charSets.reduce((sum, size) => sum + size, 0);
    return password.length * Math.log2(charSetSize);
  }

  private checkCommonPatterns(password: string): number {
    let penalty = 0;
    const lowerPassword = password.toLowerCase();

    // Check common passwords
    for (const common of this.COMMON_PASSWORDS) {
      if (lowerPassword.includes(common)) {
        penalty += 20;
      }
    }

    // Check keyboard patterns
    for (const pattern of this.KEYBOARD_PATTERNS) {
      if (lowerPassword.includes(pattern)) {
        penalty += 15;
      }
    }

    // Check dictionary words
    for (const word of this.DICTIONARY_WORDS) {
      if (lowerPassword.includes(word)) {
        penalty += 10;
      }
    }

    // Check for repeated characters
    const repeated = /(.)\1{2,}/.test(password);
    if (repeated) {
      penalty += 10;
    }

    // Check for sequential characters
    const sequential = /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|123|234|345|456|567|678|789|890)/i.test(password);
    if (sequential) {
      penalty += 15;
    }

    return Math.min(penalty, 50); // Cap penalty at 50 points
  }

  private estimateCrackTime(password: string, entropy: number): string {
    // Simplified crack time estimation
    const attemptsPerSecond = 1e10; // 10 billion attempts per second (modern GPUs)
    const totalCombinations = Math.pow(2, entropy);
    const secondsToCrack = totalCombinations / (2 * attemptsPerSecond); // Average case

    if (secondsToCrack < 60) {
      return 'Less than a minute';
    } else if (secondsToCrack < 3600) {
      return `${Math.round(secondsToCrack / 60)} minutes`;
    } else if (secondsToCrack < 86400) {
      return `${Math.round(secondsToCrack / 3600)} hours`;
    } else if (secondsToCrack < 31536000) {
      return `${Math.round(secondsToCrack / 86400)} days`;
    } else if (secondsToCrack < 3153600000) {
      return `${Math.round(secondsToCrack / 31536000)} years`;
    } else {
      return 'Centuries or more';
    }
  }

  private async clearPolicyCache(): Promise<void> {
    const pattern = `${this.POLICY_CACHE_PREFIX}*`;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(event: {
    user_id?: string;
    event_type: string;
    ip_address: string;
    user_agent: string;
    location?: any;
    metadata?: any;
    risk_score?: number;
  }): Promise<void> {
    try {
      await prisma.securityEvent.create({
        data: {
          user_id: event.user_id,
          event_type: event.event_type as any,
          ip_address: event.ip_address,
          user_agent: event.user_agent,
          location: event.location,
          metadata: event.metadata || {},
          risk_score: event.risk_score || 0
        }
      });
    } catch (error) {
      logger.error('Error logging security event:', error);
    }
  }
}