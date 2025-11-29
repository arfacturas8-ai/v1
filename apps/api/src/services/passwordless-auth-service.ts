import { randomBytes, createHash } from 'crypto';
import { prisma } from '@cryb/database';
import Redis from 'ioredis';
import { AppError } from '../middleware/errorHandler';
import { createWebAuthnService } from './webauthn-service';

/**
 * Enterprise Passwordless Authentication Service
 * 
 * Features:
 * - WebAuthn-based passwordless login
 * - Biometric authentication support
 * - Magic link authentication
 * - Email-based passwordless login
 * - SMS-based passwordless login
 * - QR code authentication
 * - Passkey management
 * - Cross-device authentication
 * - Progressive registration
 * - Fallback mechanisms
 */

export interface PasswordlessChallenge {
  id: string;
  type: 'webauthn' | 'magic-link' | 'sms' | 'qr-code';
  challenge?: string;
  token?: string;
  expiresAt: Date;
  userId?: string;
  metadata: Record<string, any>;
}

export interface MagicLinkOptions {
  email: string;
  redirectUrl?: string;
  expirationMinutes?: number;
  oneTimeUse?: boolean;
}

export interface SMSAuthOptions {
  phoneNumber: string;
  message?: string;
  expirationMinutes?: number;
}

export interface QRCodeAuthOptions {
  deviceId?: string;
  expirationMinutes?: number;
  allowMultipleUse?: boolean;
}

export interface BiometricAuthOptions {
  biometricType: 'fingerprint' | 'face' | 'voice' | 'iris';
  requireLiveness?: boolean;
  confidenceThreshold?: number;
}

export interface PasswordlessSession {
  sessionId: string;
  userId: string;
  authMethod: string;
  deviceInfo: Record<string, any>;
  expiresAt: Date;
  isActive: boolean;
}

export class PasswordlessAuthService {
  private redis: Redis;
  private webauthnService: any;
  private readonly challengeExpiry = 15 * 60 * 1000; // 15 minutes
  private readonly magicLinkExpiry = 30 * 60 * 1000; // 30 minutes
  private readonly smsExpiry = 5 * 60 * 1000; // 5 minutes
  private readonly qrCodeExpiry = 2 * 60 * 1000; // 2 minutes

  constructor(redis: Redis) {
    this.redis = redis;
    this.webauthnService = createWebAuthnService(redis);
    console.log('🔑 Passwordless Authentication Service initialized');
  }

  /**
   * Initiate passwordless authentication
   */
  async initiatePasswordlessAuth(
    identifier: string, // email, phone, or username
    method: 'webauthn' | 'magic-link' | 'sms' | 'qr-code',
    options: {
      redirectUrl?: string;
      deviceInfo?: Record<string, any>;
      clientInfo?: Record<string, any>;
    } = {}
  ): Promise<{
    success: boolean;
    challengeId?: string;
    challenge?: any;
    error?: string;
    metadata?: Record<string, any>;
  }> {
    try {
      // Find user by identifier
      const user = await this.findUserByIdentifier(identifier);
      
      switch (method) {
        case 'webauthn':
          return await this.initiateWebAuthnAuth(user, options);
        
        case 'magic-link':
          return await this.initiateMagicLinkAuth(user, identifier, options);
        
        case 'sms':
          return await this.initiateSMSAuth(user, identifier, options);
        
        case 'qr-code':
          return await this.initiateQRCodeAuth(user, options);
        
        default:
          throw new AppError(`Unsupported passwordless method: ${method}`, 400, 'UNSUPPORTED_METHOD');
      }

    } catch (error) {
      console.error('Passwordless authentication initiation failed:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to initiate passwordless authentication', 500, 'PASSWORDLESS_INIT_FAILED');
    }
  }

  /**
   * Complete passwordless authentication
   */
  async completePasswordlessAuth(
    challengeId: string,
    response: any,
    clientInfo: Record<string, any> = {}
  ): Promise<{
    success: boolean;
    user?: any;
    session?: PasswordlessSession;
    tokens?: any;
    error?: string;
  }> {
    try {
      // Get challenge from Redis
      const challenge = await this.getChallenge(challengeId);
      if (!challenge) {
        return { success: false, error: 'Invalid or expired challenge' };
      }

      let result;
      switch (challenge.type) {
        case 'webauthn':
          result = await this.completeWebAuthnAuth(challenge, response);
          break;
        
        case 'magic-link':
          result = await this.completeMagicLinkAuth(challenge, response);
          break;
        
        case 'sms':
          result = await this.completeSMSAuth(challenge, response);
          break;
        
        case 'qr-code':
          result = await this.completeQRCodeAuth(challenge, response);
          break;
        
        default:
          return { success: false, error: 'Unknown challenge type' };
      }

      if (!result.success) {
        return result;
      }

      // Generate session and tokens
      const session = await this.createPasswordlessSession(
        result.user.id,
        challenge.type,
        clientInfo
      );

      const tokens = await this.generateTokens(result.user.id, session.sessionId);

      // Clean up challenge
      await this.redis.del(`passwordless_challenge:${challengeId}`);

      return {
        success: true,
        user: result.user,
        session,
        tokens
      };

    } catch (error) {
      console.error('Passwordless authentication completion failed:', error);
      return { success: false, error: 'Authentication completion failed' };
    }
  }

  /**
   * WebAuthn passwordless authentication
   */
  private async initiateWebAuthnAuth(
    user: any,
    options: any
  ): Promise<any> {
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Check if user has registered WebAuthn credentials
    const credentials = await this.webauthnService.getUserCredentials(user.id);
    if (credentials.length === 0) {
      return { 
        success: false, 
        error: 'No WebAuthn credentials registered',
        metadata: { requiresRegistration: true }
      };
    }

    // Generate WebAuthn challenge
    const { challenge, publicKeyCredentialRequestOptions } = 
      await this.webauthnService.generateAuthenticationChallenge(user.id);

    // Store challenge
    const challengeId = await this.storeChallenge({
      type: 'webauthn',
      challenge: challenge.challenge,
      userId: user.id,
      metadata: {
        allowCredentials: challenge.allowCredentials,
        userVerification: challenge.userVerification
      }
    });

    return {
      success: true,
      challengeId,
      challenge: publicKeyCredentialRequestOptions,
      metadata: {
        credentialCount: credentials.length,
        requiresUserVerification: challenge.userVerification === 'required'
      }
    };
  }

  private async completeWebAuthnAuth(challenge: any, response: any): Promise<any> {
    const result = await this.webauthnService.verifyAuthentication(
      response.id,
      response.response.authenticatorData,
      response.response.clientDataJSON,
      response.response.signature,
      response.response.userHandle
    );

    if (!result.success) {
      return { success: false, error: result.error };
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: result.userHandle },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        isVerified: true
      }
    });

    return { success: true, user };
  }

  /**
   * Magic link authentication
   */
  private async initiateMagicLinkAuth(
    user: any,
    email: string,
    options: any
  ): Promise<any> {
    // Generate secure token
    const token = this.generateSecureToken();
    const expiresAt = new Date(Date.now() + this.magicLinkExpiry);

    // Store challenge
    const challengeId = await this.storeChallenge({
      type: 'magic-link',
      token,
      userId: user?.id,
      metadata: {
        email,
        redirectUrl: options.redirectUrl,
        oneTimeUse: true
      }
    });

    // Generate magic link
    const magicLink = this.generateMagicLink(token, options.redirectUrl);

    // Send email (placeholder - implement actual email service)
    await this.sendMagicLinkEmail(email, magicLink, user?.username);

    return {
      success: true,
      challengeId,
      metadata: {
        email,
        expiresAt: expiresAt.toISOString(),
        estimatedDelivery: '30 seconds'
      }
    };
  }

  private async completeMagicLinkAuth(challenge: any, response: any): Promise<any> {
    const { token } = response;

    if (challenge.token !== token) {
      return { success: false, error: 'Invalid magic link token' };
    }

    // Get or create user
    let user;
    if (challenge.userId) {
      user = await prisma.user.findUnique({
        where: { id: challenge.userId },
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
          isVerified: true
        }
      });
    } else {
      // Create user if doesn't exist (progressive registration)
      user = await this.createUserFromEmail(challenge.metadata.email);
    }

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    return { success: true, user };
  }

  /**
   * SMS authentication
   */
  private async initiateSMSAuth(
    user: any,
    phoneNumber: string,
    options: any
  ): Promise<any> {
    // Generate OTP
    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + this.smsExpiry);

    // Store challenge
    const challengeId = await this.storeChallenge({
      type: 'sms',
      token: otp,
      userId: user?.id,
      metadata: {
        phoneNumber,
        attempts: 0,
        maxAttempts: 3
      }
    });

    // Send SMS (placeholder - implement actual SMS service)
    await this.sendSMSOTP(phoneNumber, otp);

    return {
      success: true,
      challengeId,
      metadata: {
        phoneNumber: this.maskPhoneNumber(phoneNumber),
        expiresAt: expiresAt.toISOString(),
        otpLength: otp.length
      }
    };
  }

  private async completeSMSAuth(challenge: any, response: any): Promise<any> {
    const { otp } = response;

    // Check attempt count
    if (challenge.metadata.attempts >= challenge.metadata.maxAttempts) {
      return { success: false, error: 'Maximum attempts exceeded' };
    }

    // Verify OTP
    if (challenge.token !== otp) {
      // Increment attempts
      challenge.metadata.attempts++;
      await this.updateChallenge(challenge.id, challenge);
      
      return { 
        success: false, 
        error: 'Invalid OTP',
        metadata: {
          attemptsRemaining: challenge.metadata.maxAttempts - challenge.metadata.attempts
        }
      };
    }

    // Get or create user
    let user;
    if (challenge.userId) {
      user = await prisma.user.findUnique({
        where: { id: challenge.userId },
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
          isVerified: true
        }
      });
    } else {
      // Create user if doesn't exist
      user = await this.createUserFromPhone(challenge.metadata.phoneNumber);
    }

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    return { success: true, user };
  }

  /**
   * QR Code authentication
   */
  private async initiateQRCodeAuth(
    user: any,
    options: any
  ): Promise<any> {
    // Generate secure token
    const token = this.generateSecureToken();
    const qrData = {
      token,
      action: 'passwordless_auth',
      timestamp: Date.now(),
      deviceId: options.deviceInfo?.deviceId
    };

    // Store challenge
    const challengeId = await this.storeChallenge({
      type: 'qr-code',
      token,
      userId: user?.id,
      metadata: {
        qrData,
        scanned: false,
        deviceId: options.deviceInfo?.deviceId
      }
    });

    // Generate QR code
    const qrCodeData = await this.generateQRCode(JSON.stringify(qrData));

    return {
      success: true,
      challengeId,
      challenge: {
        qrCode: qrCodeData,
        token
      },
      metadata: {
        expiresIn: this.qrCodeExpiry / 1000,
        allowsMultipleScans: false
      }
    };
  }

  private async completeQRCodeAuth(challenge: any, response: any): Promise<any> {
    const { token, deviceId } = response;

    if (challenge.token !== token) {
      return { success: false, error: 'Invalid QR code token' };
    }

    // Verify device if specified
    if (challenge.metadata.deviceId && challenge.metadata.deviceId !== deviceId) {
      return { success: false, error: 'Device mismatch' };
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: challenge.userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        isVerified: true
      }
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    return { success: true, user };
  }

  /**
   * Biometric authentication setup and verification
   */
  async setupBiometricAuth(
    userId: string,
    biometricType: 'fingerprint' | 'face' | 'voice' | 'iris',
    biometricData: string, // Base64 encoded biometric template
    options: BiometricAuthOptions = {}
  ): Promise<{
    success: boolean;
    biometricId?: string;
    error?: string;
  }> {
    try {
      // Validate biometric data quality
      const qualityScore = await this.validateBiometricQuality(biometricData, biometricType);
      if (qualityScore < 0.7) {
        return { 
          success: false, 
          error: 'Biometric quality too low. Please try again with better lighting/positioning.' 
        };
      }

      // Hash and store biometric template securely
      const biometricHash = this.hashBiometricTemplate(biometricData);
      
      const biometricRecord = await prisma.biometricAuth.create({
        data: {
          id: `biometric_${Date.now()}_${randomBytes(8).toString('hex')}`,
          userId,
          biometricType,
          biometricHash,
          qualityScore,
          isActive: true,
          requireLiveness: options.requireLiveness || false,
          confidenceThreshold: options.confidenceThreshold || 0.8,
          createdAt: new Date()
        }
      });

      console.log(`📱 Biometric authentication setup for user ${userId}: ${biometricType}`);

      return {
        success: true,
        biometricId: biometricRecord.id
      };

    } catch (error) {
      console.error('Biometric setup failed:', error);
      return { success: false, error: 'Failed to setup biometric authentication' };
    }
  }

  async verifyBiometricAuth(
    userId: string,
    biometricType: string,
    biometricData: string,
    livenessData?: string
  ): Promise<{
    success: boolean;
    confidence?: number;
    error?: string;
  }> {
    try {
      // Get user's biometric records
      const biometricRecords = await prisma.biometricAuth.findMany({
        where: {
          userId,
          biometricType,
          isActive: true
        }
      });

      if (biometricRecords.length === 0) {
        return { success: false, error: 'No biometric templates registered' };
      }

      // Verify liveness if required
      for (const record of biometricRecords) {
        if (record.requireLiveness && !livenessData) {
          return { success: false, error: 'Liveness verification required' };
        }

        if (record.requireLiveness && livenessData) {
          const livenessValid = await this.verifyLiveness(livenessData, biometricType);
          if (!livenessValid) {
            return { success: false, error: 'Liveness verification failed' };
          }
        }
      }

      // Match biometric template
      const biometricHash = this.hashBiometricTemplate(biometricData);
      const matchResult = await this.matchBiometricTemplate(
        biometricHash,
        biometricRecords.map(r => r.biometricHash)
      );

      if (!matchResult.match) {
        return { success: false, error: 'Biometric verification failed' };
      }

      // Check confidence threshold
      const matchedRecord = biometricRecords.find(r => r.biometricHash === matchResult.matchedHash);
      if (matchResult.confidence < (matchedRecord?.confidenceThreshold || 0.8)) {
        return { 
          success: false, 
          error: 'Biometric confidence below threshold',
          confidence: matchResult.confidence
        };
      }

      console.log(`📱 Biometric verification successful for user ${userId}: ${biometricType} (confidence: ${matchResult.confidence})`);

      return {
        success: true,
        confidence: matchResult.confidence
      };

    } catch (error) {
      console.error('Biometric verification failed:', error);
      return { success: false, error: 'Biometric verification service unavailable' };
    }
  }

  /**
   * Progressive user registration for passwordless authentication
   */
  private async createUserFromEmail(email: string): Promise<any> {
    const username = email.split('@')[0] + '_' + Date.now();
    
    return await prisma.user.create({
      data: {
        username,
        displayName: username,
        email,
        isVerified: false, // Will be verified through passwordless auth
        passwordHash: null // No password for passwordless users
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        isVerified: true
      }
    });
  }

  private async createUserFromPhone(phoneNumber: string): Promise<any> {
    const username = 'user_' + phoneNumber.replace(/\D/g, '').slice(-6) + '_' + Date.now();
    
    return await prisma.user.create({
      data: {
        username,
        displayName: username,
        phoneNumber,
        isVerified: false,
        passwordHash: null
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        phoneNumber: true,
        isVerified: true
      }
    });
  }

  /**
   * Helper methods
   */
  private async findUserByIdentifier(identifier: string): Promise<any> {
    return await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier },
          { phoneNumber: identifier }
        ]
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        phoneNumber: true,
        isVerified: true
      }
    });
  }

  private async storeChallenge(challengeData: Partial<PasswordlessChallenge>): Promise<string> {
    const challengeId = `challenge_${Date.now()}_${randomBytes(16).toString('hex')}`;
    const challenge: PasswordlessChallenge = {
      id: challengeId,
      expiresAt: new Date(Date.now() + this.challengeExpiry),
      ...challengeData
    } as PasswordlessChallenge;

    await this.redis.setex(
      `passwordless_challenge:${challengeId}`,
      Math.ceil(this.challengeExpiry / 1000),
      JSON.stringify(challenge)
    );

    return challengeId;
  }

  private async getChallenge(challengeId: string): Promise<PasswordlessChallenge | null> {
    const data = await this.redis.get(`passwordless_challenge:${challengeId}`);
    return data ? JSON.parse(data) : null;
  }

  private async updateChallenge(challengeId: string, challenge: PasswordlessChallenge): Promise<void> {
    const ttl = await this.redis.ttl(`passwordless_challenge:${challengeId}`);
    if (ttl > 0) {
      await this.redis.setex(
        `passwordless_challenge:${challengeId}`,
        ttl,
        JSON.stringify(challenge)
      );
    }
  }

  private generateSecureToken(): string {
    return randomBytes(32).toString('hex');
  }

  private generateOTP(length: number = 6): string {
    return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
  }

  private generateMagicLink(token: string, redirectUrl?: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = new URL('/auth/magic-link', baseUrl);
    url.searchParams.set('token', token);
    if (redirectUrl) {
      url.searchParams.set('redirect', redirectUrl);
    }
    return url.toString();
  }

  private async generateQRCode(data: string): Promise<string> {
    // Placeholder - implement actual QR code generation
    const QRCode = require('qrcode');
    return await QRCode.toDataURL(data);
  }

  private maskPhoneNumber(phoneNumber: string): string {
    if (phoneNumber.length < 4) return phoneNumber;
    return phoneNumber.slice(0, -4).replace(/\d/g, '*') + phoneNumber.slice(-4);
  }

  private async createPasswordlessSession(
    userId: string,
    authMethod: string,
    clientInfo: Record<string, any>
  ): Promise<PasswordlessSession> {
    const sessionId = `pwdless_${Date.now()}_${randomBytes(16).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const session: PasswordlessSession = {
      sessionId,
      userId,
      authMethod,
      deviceInfo: clientInfo,
      expiresAt,
      isActive: true
    };

    // Store session in Redis
    await this.redis.setex(
      `passwordless_session:${sessionId}`,
      24 * 60 * 60, // 24 hours
      JSON.stringify(session)
    );

    return session;
  }

  private async generateTokens(userId: string, sessionId: string): Promise<any> {
    // Reuse enhanced auth service for token generation
    const { EnhancedAuthService } = await import('./enhanced-auth');
    const authService = new EnhancedAuthService(this.redis);
    
    return await authService.generateTokens(userId, {
      deviceInfo: `Passwordless authentication session ${sessionId}`,
      sessionId
    });
  }

  // Biometric helper methods (simplified implementations)
  private async validateBiometricQuality(biometricData: string, type: string): Promise<number> {
    // Placeholder - implement actual biometric quality assessment
    return Math.random() * 0.3 + 0.7; // Return score between 0.7-1.0
  }

  private hashBiometricTemplate(biometricData: string): string {
    return createHash('sha256').update(biometricData).digest('hex');
  }

  private async matchBiometricTemplate(
    templateHash: string, 
    storedHashes: string[]
  ): Promise<{ match: boolean; confidence: number; matchedHash?: string }> {
    // Placeholder - implement actual biometric matching
    for (const storedHash of storedHashes) {
      if (templateHash === storedHash) {
        return {
          match: true,
          confidence: Math.random() * 0.2 + 0.8, // 0.8-1.0
          matchedHash: storedHash
        };
      }
    }
    return { match: false, confidence: 0 };
  }

  private async verifyLiveness(livenessData: string, biometricType: string): Promise<boolean> {
    // Placeholder - implement actual liveness detection
    return Math.random() > 0.1; // 90% success rate for demo
  }

  // Communication service placeholders
  private async sendMagicLinkEmail(email: string, magicLink: string, username?: string): Promise<void> {
    console.log(`📧 Magic link email would be sent to ${email}: ${magicLink}`);
    // TODO: Implement actual email service
  }

  private async sendSMSOTP(phoneNumber: string, otp: string): Promise<void> {
    console.log(`📱 SMS OTP would be sent to ${phoneNumber}: ${otp}`);
    // TODO: Implement actual SMS service
  }
}

/**
 * Create passwordless authentication service instance
 */
export function createPasswordlessAuthService(redis: Redis): PasswordlessAuthService {
  return new PasswordlessAuthService(redis);
}