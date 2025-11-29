import { randomBytes, createHmac, timingSafeEqual } from 'crypto';
import { prisma } from '@cryb/database';
import Redis from 'ioredis';
import QRCode from 'qrcode';

export interface TwoFactorSetup {
  secret: string;
  qrCodeDataURL: string;
  backupCodes: string[];
  manualEntryKey: string;
}

export interface TwoFactorVerificationResult {
  success: boolean;
  error?: string;
  isBackupCode?: boolean;
  remainingBackupCodes?: number;
}

/**
 * Comprehensive Two-Factor Authentication Service
 * 
 * Features:
 * - TOTP (Time-based One-Time Password) generation and verification
 * - QR code generation for easy setup
 * - Backup codes for recovery
 * - Rate limiting for verification attempts
 * - Secure secret generation and storage
 * - Multiple device support
 * - Recovery options
 */
export class TwoFactorAuthService {
  private redis: Redis;
  private readonly SECRET_LENGTH = 32;
  private readonly BACKUP_CODES_COUNT = 10;
  private readonly BACKUP_CODE_LENGTH = 8;
  private readonly TOTP_WINDOW = 1; // Allow 1 window (30 seconds) tolerance
  private readonly TOTP_STEP = 30; // 30 seconds
  private readonly MAX_VERIFICATION_ATTEMPTS = 3;
  private readonly VERIFICATION_WINDOW = 5 * 60 * 1000; // 5 minutes

  constructor(redis: Redis) {
    this.redis = redis;
    console.log('🔐 Two-Factor Authentication Service initialized');
  }

  /**
   * Generate 2FA setup for a user
   */
  async generateTwoFactorSetup(userId: string, userEmail?: string, issuer = 'CRYB'): Promise<TwoFactorSetup> {
    try {
      // Generate secret
      const secret = this.generateSecret();
      
      // Generate backup codes
      const backupCodes = this.generateBackupCodes();
      
      // Create manual entry key (formatted secret)
      const manualEntryKey = this.formatSecretForManualEntry(secret);
      
      // Generate QR code
      const otpAuthUrl = this.generateOTPAuthURL(secret, userEmail || `user-${userId}`, issuer);
      const qrCodeDataURL = await QRCode.toDataURL(otpAuthUrl, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });
      
      // Store temporary setup data in Redis (expires in 10 minutes)
      const setupKey = `2fa_setup:${userId}`;
      await this.redis.setex(setupKey, 600, JSON.stringify({
        secret,
        backupCodes: backupCodes.map(code => this.hashBackupCode(code)),
        createdAt: new Date().toISOString()
      }));
      
      return {
        secret: manualEntryKey,
        qrCodeDataURL,
        backupCodes,
        manualEntryKey
      };
      
    } catch (error) {
      console.error('Failed to generate 2FA setup:', error);
      throw new Error('Failed to generate 2FA setup');
    }
  }

  /**
   * Enable 2FA for a user with verification
   */
  async enableTwoFactor(userId: string, verificationCode: string): Promise<{ success: boolean; error?: string; backupCodes?: string[] }> {
    try {
      // Get setup data from Redis
      const setupKey = `2fa_setup:${userId}`;
      const setupData = await this.redis.get(setupKey);
      
      if (!setupData) {
        return { success: false, error: '2FA setup session expired. Please start over.' };
      }
      
      const { secret, backupCodes, createdAt } = JSON.parse(setupData);
      
      // Check if setup is expired (10 minutes)
      const setupTime = new Date(createdAt).getTime();
      if (Date.now() - setupTime > 10 * 60 * 1000) {
        await this.redis.del(setupKey);
        return { success: false, error: '2FA setup session expired. Please start over.' };
      }
      
      // Verify the provided code
      if (!this.verifyTOTP(secret, verificationCode)) {
        return { success: false, error: 'Invalid verification code. Please try again.' };
      }
      
      // Enable 2FA in database
      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: true,
          twoFactorSecret: secret,
          twoFactorBackupCodes: backupCodes,
          twoFactorEnabledAt: new Date()
        }
      });
      
      // Clean up setup data
      await this.redis.del(setupKey);
      
      // Generate plaintext backup codes for user to save
      const plaintextBackupCodes = this.generateBackupCodes();
      
      // Log security event
      console.log(`🔐 2FA enabled for user ${userId}`);
      
      return { 
        success: true, 
        backupCodes: plaintextBackupCodes 
      };
      
    } catch (error) {
      console.error('Failed to enable 2FA:', error);
      return { success: false, error: 'Failed to enable 2FA' };
    }
  }

  /**
   * Disable 2FA for a user
   */
  async disableTwoFactor(userId: string, verificationCode: string, currentPassword?: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get user data
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          twoFactorEnabled: true,
          twoFactorSecret: true,
          twoFactorBackupCodes: true,
          passwordHash: true
        }
      });
      
      if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
        return { success: false, error: '2FA is not enabled for this account' };
      }
      
      // Verify the provided code (TOTP or backup code)
      let isValidCode = false;
      let isBackupCode = false;
      
      // Try TOTP first
      if (this.verifyTOTP(user.twoFactorSecret, verificationCode)) {
        isValidCode = true;
      } else {
        // Try backup codes
        const hashedCode = this.hashBackupCode(verificationCode.toUpperCase());
        if (user.twoFactorBackupCodes && user.twoFactorBackupCodes.includes(hashedCode)) {
          isValidCode = true;
          isBackupCode = true;
        }
      }
      
      if (!isValidCode) {
        return { success: false, error: 'Invalid verification code' };
      }
      
      // Additional security: require password for 2FA disable if available
      if (currentPassword && user.passwordHash) {
        const { verifyPassword } = await import('@cryb/auth');
        const isPasswordValid = await verifyPassword(currentPassword, user.passwordHash);
        if (!isPasswordValid) {
          return { success: false, error: 'Current password is required to disable 2FA' };
        }
      }
      
      // Disable 2FA in database
      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorBackupCodes: null,
          twoFactorEnabledAt: null
        }
      });
      
      // Log security event
      console.log(`🔓 2FA disabled for user ${userId} using ${isBackupCode ? 'backup code' : 'TOTP'}`);
      
      return { success: true };
      
    } catch (error) {
      console.error('Failed to disable 2FA:', error);
      return { success: false, error: 'Failed to disable 2FA' };
    }
  }

  /**
   * Verify 2FA code for login
   */
  async verifyTwoFactor(userId: string, code: string, clientIP?: string): Promise<TwoFactorVerificationResult> {
    try {
      // Rate limiting for verification attempts
      const rateLimitResult = await this.checkVerificationRateLimit(userId, clientIP);
      if (!rateLimitResult.allowed) {
        return { 
          success: false, 
          error: `Too many verification attempts. Try again in ${rateLimitResult.retryAfter} seconds.` 
        };
      }
      
      // Get user 2FA data
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          twoFactorEnabled: true,
          twoFactorSecret: true,
          twoFactorBackupCodes: true
        }
      });
      
      if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
        return { success: false, error: '2FA is not enabled for this account' };
      }
      
      // Clean and validate input
      const cleanCode = code.replace(/\s/g, '').toUpperCase();
      
      // Try TOTP verification first
      if (this.verifyTOTP(user.twoFactorSecret, cleanCode)) {
        await this.clearVerificationAttempts(userId, clientIP);
        return { success: true };
      }
      
      // Try backup codes
      if (user.twoFactorBackupCodes && user.twoFactorBackupCodes.length > 0) {
        const hashedCode = this.hashBackupCode(cleanCode);
        const backupCodeIndex = user.twoFactorBackupCodes.indexOf(hashedCode);
        
        if (backupCodeIndex !== -1) {
          // Remove used backup code
          const updatedBackupCodes = [...user.twoFactorBackupCodes];
          updatedBackupCodes.splice(backupCodeIndex, 1);
          
          await prisma.user.update({
            where: { id: userId },
            data: { twoFactorBackupCodes: updatedBackupCodes }
          });
          
          await this.clearVerificationAttempts(userId, clientIP);
          
          console.log(`🔑 Backup code used for user ${userId}. Remaining: ${updatedBackupCodes.length}`);
          
          return { 
            success: true, 
            isBackupCode: true,
            remainingBackupCodes: updatedBackupCodes.length
          };
        }
      }
      
      // Record failed attempt
      await this.recordVerificationAttempt(userId, clientIP);
      
      return { success: false, error: 'Invalid verification code' };
      
    } catch (error) {
      console.error('2FA verification error:', error);
      return { success: false, error: 'Verification service unavailable' };
    }
  }

  /**
   * Generate new backup codes
   */
  async regenerateBackupCodes(userId: string, verificationCode: string): Promise<{ success: boolean; backupCodes?: string[]; error?: string }> {
    try {
      // Verify current 2FA code
      const verificationResult = await this.verifyTwoFactor(userId, verificationCode);
      if (!verificationResult.success) {
        return { success: false, error: 'Invalid verification code' };
      }
      
      // Generate new backup codes
      const newBackupCodes = this.generateBackupCodes();
      const hashedBackupCodes = newBackupCodes.map(code => this.hashBackupCode(code));
      
      // Update database
      await prisma.user.update({
        where: { id: userId },
        data: { twoFactorBackupCodes: hashedBackupCodes }
      });
      
      console.log(`🔄 Backup codes regenerated for user ${userId}`);
      
      return { success: true, backupCodes: newBackupCodes };
      
    } catch (error) {
      console.error('Failed to regenerate backup codes:', error);
      return { success: false, error: 'Failed to regenerate backup codes' };
    }
  }

  /**
   * Get 2FA status for a user
   */
  async getTwoFactorStatus(userId: string): Promise<{
    enabled: boolean;
    enabledAt?: Date;
    backupCodesRemaining?: number;
    hasBackupCodes?: boolean;
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          twoFactorEnabled: true,
          twoFactorEnabledAt: true,
          twoFactorBackupCodes: true
        }
      });
      
      if (!user) {
        return { enabled: false };
      }
      
      return {
        enabled: user.twoFactorEnabled || false,
        enabledAt: user.twoFactorEnabledAt || undefined,
        backupCodesRemaining: user.twoFactorBackupCodes?.length || 0,
        hasBackupCodes: (user.twoFactorBackupCodes?.length || 0) > 0
      };
      
    } catch (error) {
      console.error('Failed to get 2FA status:', error);
      return { enabled: false };
    }
  }

  /**
   * Generate a secure secret
   */
  private generateSecret(): string {
    const buffer = randomBytes(this.SECRET_LENGTH);
    return this.base32Encode(buffer);
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < this.BACKUP_CODES_COUNT; i++) {
      const code = randomBytes(this.BACKUP_CODE_LENGTH / 2).toString('hex').toUpperCase();
      // Format as XXXX-XXXX for better readability
      codes.push(code.substring(0, 4) + '-' + code.substring(4, 8));
    }
    return codes;
  }

  /**
   * Hash backup code for storage
   */
  private hashBackupCode(code: string): string {
    return createHmac('sha256', process.env.JWT_SECRET || 'fallback-secret')
      .update(code.toUpperCase().replace('-', ''))
      .digest('hex');
  }

  /**
   * Format secret for manual entry
   */
  private formatSecretForManualEntry(secret: string): string {
    return secret.replace(/(.{4})/g, '$1 ').trim();
  }

  /**
   * Generate OTP Auth URL for QR codes
   */
  private generateOTPAuthURL(secret: string, accountName: string, issuer: string): string {
    const params = new URLSearchParams({
      secret,
      issuer,
      algorithm: 'SHA1',
      digits: '6',
      period: '30'
    });
    
    return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?${params}`;
  }

  /**
   * Verify TOTP code
   */
  private verifyTOTP(secret: string, token: string): boolean {
    try {
      const cleanToken = token.replace(/\s/g, '');
      if (!/^\\d{6}$/.test(cleanToken)) {
        return false;
      }
      
      const now = Math.floor(Date.now() / 1000);
      const counter = Math.floor(now / this.TOTP_STEP);
      
      // Check current window and adjacent windows for clock drift tolerance
      for (let i = -this.TOTP_WINDOW; i <= this.TOTP_WINDOW; i++) {
        const expectedToken = this.generateTOTP(secret, counter + i);
        if (this.constantTimeEqual(cleanToken, expectedToken)) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('TOTP verification error:', error);
      return false;
    }
  }

  /**
   * Generate TOTP token
   */
  private generateTOTP(secret: string, counter: number): string {
    try {
      const secretBuffer = this.base32Decode(secret);
      const counterBuffer = Buffer.alloc(8);
      counterBuffer.writeBigUInt64BE(BigInt(counter), 0);
      
      const hmac = createHmac('sha1', secretBuffer);
      hmac.update(counterBuffer);
      const hash = hmac.digest();
      
      const offset = hash[hash.length - 1] & 0x0f;
      const binary = 
        ((hash[offset] & 0x7f) << 24) |
        ((hash[offset + 1] & 0xff) << 16) |
        ((hash[offset + 2] & 0xff) << 8) |
        (hash[offset + 3] & 0xff);
      
      const token = (binary % 1000000).toString().padStart(6, '0');
      return token;
    } catch (error) {
      console.error('TOTP generation error:', error);
      return '000000';
    }
  }

  /**
   * Constant time string comparison to prevent timing attacks
   */
  private constantTimeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    
    const bufferA = Buffer.from(a, 'utf8');
    const bufferB = Buffer.from(b, 'utf8');
    
    if (bufferA.length !== bufferB.length) return false;
    
    return timingSafeEqual(bufferA, bufferB);
  }

  /**
   * Base32 encode
   */
  private base32Encode(buffer: Buffer): string {
    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    let bits = 0;
    let value = 0;
    
    for (let i = 0; i < buffer.length; i++) {
      value = (value << 8) | buffer[i];
      bits += 8;
      
      while (bits >= 5) {
        result += base32Chars[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }
    
    if (bits > 0) {
      result += base32Chars[(value << (5 - bits)) & 31];
    }
    
    return result;
  }

  /**
   * Base32 decode
   */
  private base32Decode(encoded: string): Buffer {
    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const cleanEncoded = encoded.toUpperCase().replace(/[^A-Z2-7]/g, '');
    
    let bits = 0;
    let value = 0;
    let index = 0;
    const output = Buffer.alloc(Math.ceil(cleanEncoded.length * 5 / 8));
    
    for (let i = 0; i < cleanEncoded.length; i++) {
      const char = cleanEncoded[i];
      const charIndex = base32Chars.indexOf(char);
      
      if (charIndex === -1) continue;
      
      value = (value << 5) | charIndex;
      bits += 5;
      
      if (bits >= 8) {
        output[index++] = (value >>> (bits - 8)) & 255;
        bits -= 8;
      }
    }
    
    return output.slice(0, index);
  }

  /**
   * Rate limiting for 2FA verification attempts
   */
  private async checkVerificationRateLimit(userId: string, clientIP?: string): Promise<{ allowed: boolean; retryAfter?: number }> {
    try {
      const key = `2fa_attempts:${userId}:${clientIP || 'unknown'}`;
      const attempts = await this.redis.get(key);
      const attemptCount = parseInt(attempts || '0');
      
      if (attemptCount >= this.MAX_VERIFICATION_ATTEMPTS) {
        const ttl = await this.redis.ttl(key);
        return { allowed: false, retryAfter: ttl };
      }
      
      return { allowed: true };
    } catch (error) {
      console.error('2FA rate limit check failed:', error);
      return { allowed: true }; // Allow on error
    }
  }

  /**
   * Record verification attempt
   */
  private async recordVerificationAttempt(userId: string, clientIP?: string): Promise<void> {
    try {
      const key = `2fa_attempts:${userId}:${clientIP || 'unknown'}`;
      const result = await this.redis.incr(key);
      
      if (result === 1) {
        await this.redis.expire(key, Math.ceil(this.VERIFICATION_WINDOW / 1000));
      }
    } catch (error) {
      console.error('Failed to record 2FA attempt:', error);
    }
  }

  /**
   * Clear verification attempts on successful verification
   */
  private async clearVerificationAttempts(userId: string, clientIP?: string): Promise<void> {
    try {
      const key = `2fa_attempts:${userId}:${clientIP || 'unknown'}`;
      await this.redis.del(key);
    } catch (error) {
      console.error('Failed to clear 2FA attempts:', error);
    }
  }
}

/**
 * Create 2FA service instance
 */
export function createTwoFactorAuthService(redis: Redis): TwoFactorAuthService {
  return new TwoFactorAuthService(redis);
}