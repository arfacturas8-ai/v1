import crypto from 'crypto';
import { promisify } from 'util';
import qrcode from 'qrcode';
import { prisma } from '@cryb/database';
import { Redis } from 'ioredis';
import logger from '../utils/logger';

export interface TwoFactorSetupResult {
  secret: string;
  qr_code: string;
  backup_codes: string[];
  manual_entry_key: string;
}

export interface TwoFactorVerificationResult {
  success: boolean;
  used_backup_code?: boolean;
  remaining_backup_codes?: number;
  error?: string;
}

export class TwoFactorAuthService {
  private redis: Redis;
  private readonly TOTP_WINDOW = 30; // 30 seconds
  private readonly TOTP_DIGITS = 6;
  private readonly BACKUP_CODE_LENGTH = 8;
  private readonly BACKUP_CODE_COUNT = 10;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  /**
   * Generate TOTP secret and QR code for user setup
   */
  async setupTwoFactor(userId: string, userEmail: string): Promise<TwoFactorSetupResult> {
    try {
      // Check if user exists and doesn't already have 2FA enabled
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const existingTwoFactor = await prisma.twoFactorAuth.findUnique({
        where: { user_id: userId }
      });

      if (existingTwoFactor && existingTwoFactor.is_enabled) {
        throw new Error('Two-factor authentication is already enabled');
      }

      // Generate secret
      const secret = this.generateSecret();
      
      // Generate backup codes
      const backupCodes = this.generateBackupCodes();
      const hashedBackupCodes = backupCodes.map(code => this.hashBackupCode(code));

      // Create or update 2FA record (not enabled yet)
      await prisma.twoFactorAuth.upsert({
        where: { user_id: userId },
        create: {
          user_id: userId,
          secret,
          backup_codes: hashedBackupCodes,
          is_enabled: false
        },
        update: {
          secret,
          backup_codes: hashedBackupCodes,
          is_enabled: false,
          verified_at: null
        }
      });

      // Generate QR code
      const appName = process.env.APP_NAME || 'CRYB Platform';
      const otpAuthUrl = `otpauth://totp/${encodeURIComponent(appName)}:${encodeURIComponent(userEmail)}?secret=${secret}&issuer=${encodeURIComponent(appName)}`;
      const qrCode = await qrcode.toDataURL(otpAuthUrl);

      // Log security event
      await this.logSecurityEvent({
        user_id: userId,
        event_type: 'mfa_setup_initiated',
        ip_address: '0.0.0.0', // Would be passed from request context
        user_agent: 'system',
        metadata: {
          action: 'totp_secret_generated'
        }
      });

      return {
        secret,
        qr_code: qrCode,
        backup_codes: backupCodes, // Return unhashed codes for user to save
        manual_entry_key: secret
      };

    } catch (error) {
      logger.error('Error setting up two-factor auth:', error);
      throw error;
    }
  }

  /**
   * Verify setup and enable 2FA
   */
  async verifyAndEnableTwoFactor(userId: string, verificationCode: string): Promise<boolean> {
    try {
      const twoFactor = await prisma.twoFactorAuth.findUnique({
        where: { user_id: userId }
      });

      if (!twoFactor) {
        throw new Error('Two-factor authentication not set up');
      }

      if (twoFactor.is_enabled) {
        throw new Error('Two-factor authentication is already enabled');
      }

      // Verify the code
      const isValid = this.verifyTOTP(twoFactor.secret, verificationCode);

      if (!isValid) {
        // Log failed verification
        await this.logSecurityEvent({
          user_id: userId,
          event_type: 'mfa_setup_failed',
          ip_address: '0.0.0.0',
          user_agent: 'system',
          metadata: {
            reason: 'invalid_verification_code'
          },
          risk_score: 20
        });

        throw new Error('Invalid verification code');
      }

      // Enable 2FA
      await prisma.twoFactorAuth.update({
        where: { user_id: userId },
        data: {
          is_enabled: true,
          verified_at: new Date()
        }
      });

      // Log successful setup
      await this.logSecurityEvent({
        user_id: userId,
        event_type: 'mfa_enabled',
        ip_address: '0.0.0.0',
        user_agent: 'system',
        metadata: {
          method: 'totp'
        }
      });

      return true;

    } catch (error) {
      logger.error('Error verifying and enabling two-factor auth:', error);
      throw error;
    }
  }

  /**
   * Verify TOTP code during login
   */
  async verifyTwoFactor(userId: string, code: string): Promise<TwoFactorVerificationResult> {
    try {
      const twoFactor = await prisma.twoFactorAuth.findUnique({
        where: { user_id: userId }
      });

      if (!twoFactor || !twoFactor.is_enabled) {
        return {
          success: false,
          error: 'Two-factor authentication not enabled'
        };
      }

      // Check if it's a backup code
      if (code.length === this.BACKUP_CODE_LENGTH) {
        return await this.verifyBackupCode(userId, code, twoFactor);
      }

      // Check for replay attack prevention
      const replayKey = `totp_used:${userId}:${code}`;
      const wasUsed = await this.redis.get(replayKey);
      if (wasUsed) {
        await this.logSecurityEvent({
          user_id: userId,
          event_type: 'mfa_replay_attempt',
          ip_address: '0.0.0.0',
          user_agent: 'system',
          metadata: {
            code_attempted: code
          },
          risk_score: 80
        });

        return {
          success: false,
          error: 'Code has already been used'
        };
      }

      // Verify TOTP code
      const isValid = this.verifyTOTP(twoFactor.secret, code);

      if (!isValid) {
        await this.logSecurityEvent({
          user_id: userId,
          event_type: 'mfa_failed',
          ip_address: '0.0.0.0',
          user_agent: 'system',
          metadata: {
            method: 'totp',
            reason: 'invalid_code'
          },
          risk_score: 30
        });

        return {
          success: false,
          error: 'Invalid verification code'
        };
      }

      // Mark code as used (prevent replay)
      await this.redis.setex(replayKey, this.TOTP_WINDOW * 2, '1'); // Valid for 2 windows

      // Log successful verification
      await this.logSecurityEvent({
        user_id: userId,
        event_type: 'mfa_verified',
        ip_address: '0.0.0.0',
        user_agent: 'system',
        metadata: {
          method: 'totp'
        }
      });

      return {
        success: true
      };

    } catch (error) {
      logger.error('Error verifying two-factor code:', error);
      return {
        success: false,
        error: 'Verification failed'
      };
    }
  }

  /**
   * Verify backup code
   */
  private async verifyBackupCode(userId: string, code: string, twoFactor: any): Promise<TwoFactorVerificationResult> {
    try {
      const hashedCode = this.hashBackupCode(code);
      const backupCodes = Array.isArray(twoFactor.backup_codes) 
        ? twoFactor.backup_codes 
        : JSON.parse(twoFactor.backup_codes || '[]');

      const codeIndex = backupCodes.indexOf(hashedCode);

      if (codeIndex === -1) {
        await this.logSecurityEvent({
          user_id: userId,
          event_type: 'mfa_failed',
          ip_address: '0.0.0.0',
          user_agent: 'system',
          metadata: {
            method: 'backup_code',
            reason: 'invalid_backup_code'
          },
          risk_score: 40
        });

        return {
          success: false,
          error: 'Invalid backup code'
        };
      }

      // Remove used backup code
      backupCodes.splice(codeIndex, 1);

      await prisma.twoFactorAuth.update({
        where: { user_id: userId },
        data: {
          backup_codes: backupCodes
        }
      });

      // Log successful backup code usage
      await this.logSecurityEvent({
        user_id: userId,
        event_type: 'mfa_verified',
        ip_address: '0.0.0.0',
        user_agent: 'system',
        metadata: {
          method: 'backup_code',
          remaining_codes: backupCodes.length
        }
      });

      // Warn if running low on backup codes
      if (backupCodes.length <= 2) {
        await this.logSecurityEvent({
          user_id: userId,
          event_type: 'mfa_backup_codes_low',
          ip_address: '0.0.0.0',
          user_agent: 'system',
          metadata: {
            remaining_codes: backupCodes.length
          },
          risk_score: 10
        });
      }

      return {
        success: true,
        used_backup_code: true,
        remaining_backup_codes: backupCodes.length
      };

    } catch (error) {
      logger.error('Error verifying backup code:', error);
      return {
        success: false,
        error: 'Backup code verification failed'
      };
    }
  }

  /**
   * Disable 2FA for user
   */
  async disableTwoFactor(userId: string, currentPassword: string): Promise<boolean> {
    try {
      // In a real implementation, verify the current password
      // For now, we'll skip password verification

      const twoFactor = await prisma.twoFactorAuth.findUnique({
        where: { user_id: userId }
      });

      if (!twoFactor || !twoFactor.is_enabled) {
        throw new Error('Two-factor authentication is not enabled');
      }

      // Disable 2FA
      await prisma.twoFactorAuth.update({
        where: { user_id: userId },
        data: {
          is_enabled: false,
          verified_at: null
        }
      });

      // Log 2FA disabled
      await this.logSecurityEvent({
        user_id: userId,
        event_type: 'mfa_disabled',
        ip_address: '0.0.0.0',
        user_agent: 'system',
        metadata: {
          method: 'user_request'
        }
      });

      return true;

    } catch (error) {
      logger.error('Error disabling two-factor auth:', error);
      throw error;
    }
  }

  /**
   * Generate new backup codes
   */
  async generateNewBackupCodes(userId: string): Promise<string[]> {
    try {
      const twoFactor = await prisma.twoFactorAuth.findUnique({
        where: { user_id: userId }
      });

      if (!twoFactor || !twoFactor.is_enabled) {
        throw new Error('Two-factor authentication is not enabled');
      }

      // Generate new backup codes
      const backupCodes = this.generateBackupCodes();
      const hashedBackupCodes = backupCodes.map(code => this.hashBackupCode(code));

      await prisma.twoFactorAuth.update({
        where: { user_id: userId },
        data: {
          backup_codes: hashedBackupCodes
        }
      });

      // Log backup codes regenerated
      await this.logSecurityEvent({
        user_id: userId,
        event_type: 'mfa_backup_codes_regenerated',
        ip_address: '0.0.0.0',
        user_agent: 'system',
        metadata: {
          new_code_count: backupCodes.length
        }
      });

      return backupCodes;

    } catch (error) {
      logger.error('Error generating new backup codes:', error);
      throw error;
    }
  }

  /**
   * Check if user has 2FA enabled
   */
  async isTwoFactorEnabled(userId: string): Promise<boolean> {
    try {
      const twoFactor = await prisma.twoFactorAuth.findUnique({
        where: { user_id: userId }
      });

      return !!(twoFactor && twoFactor.is_enabled);
    } catch (error) {
      logger.error('Error checking two-factor status:', error);
      return false;
    }
  }

  /**
   * Get 2FA status and info for user
   */
  async getTwoFactorStatus(userId: string): Promise<{
    enabled: boolean;
    verified_at?: Date;
    backup_codes_remaining?: number;
  }> {
    try {
      const twoFactor = await prisma.twoFactorAuth.findUnique({
        where: { user_id: userId }
      });

      if (!twoFactor) {
        return { enabled: false };
      }

      const backupCodes = Array.isArray(twoFactor.backup_codes) 
        ? twoFactor.backup_codes 
        : JSON.parse(twoFactor.backup_codes || '[]');

      return {
        enabled: twoFactor.is_enabled,
        verified_at: twoFactor.verified_at,
        backup_codes_remaining: backupCodes.length
      };

    } catch (error) {
      logger.error('Error getting two-factor status:', error);
      return { enabled: false };
    }
  }

  /**
   * Generate random secret for TOTP
   */
  private generateSecret(): string {
    return crypto.randomBytes(20).toString('base32').toUpperCase();
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < this.BACKUP_CODE_COUNT; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  /**
   * Hash backup code for storage
   */
  private hashBackupCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  /**
   * Verify TOTP code
   */
  private verifyTOTP(secret: string, token: string): boolean {
    const window = 1; // Allow 1 time step before and after current
    const currentTime = Math.floor(Date.now() / 1000 / this.TOTP_WINDOW);

    for (let i = -window; i <= window; i++) {
      const testTime = currentTime + i;
      const expectedToken = this.generateTOTP(secret, testTime);
      
      if (this.constantTimeCompare(expectedToken, token)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generate TOTP token
   */
  private generateTOTP(secret: string, timeStep: number): string {
    const timeBuffer = Buffer.alloc(8);
    timeBuffer.writeUInt32BE(Math.floor(timeStep / Math.pow(2, 32)), 0);
    timeBuffer.writeUInt32BE(timeStep & 0xffffffff, 4);

    // Convert base32 secret to buffer
    const secretBuffer = Buffer.from(secret, 'base32');

    // Generate HMAC
    const hmac = crypto.createHmac('sha1', secretBuffer);
    hmac.update(timeBuffer);
    const digest = hmac.digest();

    // Dynamic truncation
    const offset = digest[digest.length - 1] & 0x0f;
    const code = ((digest[offset] & 0x7f) << 24) |
                 ((digest[offset + 1] & 0xff) << 16) |
                 ((digest[offset + 2] & 0xff) << 8) |
                 (digest[offset + 3] & 0xff);

    // Return 6-digit code
    return (code % Math.pow(10, this.TOTP_DIGITS)).toString().padStart(this.TOTP_DIGITS, '0');
  }

  /**
   * Constant time string comparison to prevent timing attacks
   */
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
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