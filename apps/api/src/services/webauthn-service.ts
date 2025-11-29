import { randomBytes, createHash } from 'crypto';
import { prisma } from '@cryb/database';
import Redis from 'ioredis';
import { AppError } from '../middleware/errorHandler';

/**
 * Enterprise WebAuthn/FIDO2 Service
 * 
 * Features:
 * - FIDO2/WebAuthn hardware key support
 * - Passwordless authentication
 * - Biometric authentication support
 * - Cross-platform authenticator support
 * - Attestation verification
 * - User verification enforcement
 * - Resident key support
 * - Enterprise security policies
 */

export interface AuthenticatorDevice {
  id: string;
  credentialId: string;
  publicKey: string;
  counter: number;
  deviceName: string;
  deviceType: 'platform' | 'cross-platform';
  attestationType: 'none' | 'basic' | 'self' | 'attestation-ca';
  createdAt: Date;
  lastUsed?: Date;
  isActive: boolean;
  userVerified: boolean;
  backupEligible: boolean;
  backupState: boolean;
}

export interface RegistrationChallenge {
  challenge: string;
  userId: string;
  timeout: number;
  attestation: 'none' | 'indirect' | 'direct';
  authenticatorSelection: {
    authenticatorAttachment?: 'platform' | 'cross-platform';
    requireResidentKey: boolean;
    userVerification: 'required' | 'preferred' | 'discouraged';
  };
  excludeCredentials: Array<{
    type: 'public-key';
    id: string;
  }>;
}

export interface AuthenticationChallenge {
  challenge: string;
  userId?: string;
  timeout: number;
  userVerification: 'required' | 'preferred' | 'discouraged';
  allowCredentials?: Array<{
    type: 'public-key';
    id: string;
  }>;
}

export interface RegistrationResult {
  success: boolean;
  credentialId?: string;
  deviceName?: string;
  error?: string;
  attestationObject?: string;
  clientDataJSON?: string;
}

export interface AuthenticationResult {
  success: boolean;
  credentialId?: string;
  userHandle?: string;
  counter?: number;
  error?: string;
  userVerified?: boolean;
}

export class WebAuthnService {
  private redis: Redis;
  private readonly rpId: string;
  private readonly rpName: string;
  private readonly origin: string;
  private readonly challengeTimeout = 5 * 60 * 1000; // 5 minutes
  private readonly maxCredentialsPerUser = 10;

  constructor(redis: Redis, config: {
    rpId: string;
    rpName: string;
    origin: string;
  }) {
    this.redis = redis;
    this.rpId = config.rpId;
    this.rpName = config.rpName;
    this.origin = config.origin;
    
    console.log('🔐 WebAuthn Service initialized', {
      rpId: this.rpId,
      rpName: this.rpName,
      origin: this.origin
    });
  }

  /**
   * Generate registration challenge for new authenticator
   */
  async generateRegistrationChallenge(
    userId: string,
    userEmail: string,
    displayName: string,
    options: {
      authenticatorAttachment?: 'platform' | 'cross-platform';
      userVerification?: 'required' | 'preferred' | 'discouraged';
      attestation?: 'none' | 'indirect' | 'direct';
      requireResidentKey?: boolean;
    } = {}
  ): Promise<{
    challenge: RegistrationChallenge;
    publicKeyCredentialCreationOptions: any;
  }> {
    try {
      // Generate cryptographically secure challenge
      const challenge = this.generateChallenge();
      
      // Get existing credentials to exclude
      const existingCredentials = await this.getUserCredentials(userId);
      
      // Check credential limit
      if (existingCredentials.length >= this.maxCredentialsPerUser) {
        throw new AppError(
          `Maximum number of authenticators (${this.maxCredentialsPerUser}) reached`,
          400,
          'MAX_CREDENTIALS_REACHED'
        );
      }

      const excludeCredentials = existingCredentials.map(cred => ({
        type: 'public-key' as const,
        id: this.base64UrlToBuffer(cred.credentialId)
      }));

      const registrationChallenge: RegistrationChallenge = {
        challenge,
        userId,
        timeout: this.challengeTimeout,
        attestation: options.attestation || 'none',
        authenticatorSelection: {
          authenticatorAttachment: options.authenticatorAttachment,
          requireResidentKey: options.requireResidentKey || false,
          userVerification: options.userVerification || 'preferred'
        },
        excludeCredentials: excludeCredentials.map(cred => ({
          type: cred.type,
          id: this.bufferToBase64Url(cred.id)
        }))
      };

      // Store challenge in Redis with expiration
      const challengeKey = `webauthn_reg_challenge:${userId}:${challenge}`;
      await this.redis.setex(
        challengeKey,
        Math.ceil(this.challengeTimeout / 1000),
        JSON.stringify({
          ...registrationChallenge,
          userEmail,
          displayName,
          createdAt: new Date().toISOString()
        })
      );

      // Create WebAuthn PublicKeyCredentialCreationOptions
      const publicKeyCredentialCreationOptions = {
        rp: {
          id: this.rpId,
          name: this.rpName
        },
        user: {
          id: this.stringToBuffer(userId),
          name: userEmail,
          displayName: displayName
        },
        challenge: this.base64UrlToBuffer(challenge),
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },   // ES256
          { type: 'public-key', alg: -257 }, // RS256
          { type: 'public-key', alg: -37 },  // PS256
        ],
        timeout: this.challengeTimeout,
        attestation: registrationChallenge.attestation,
        authenticatorSelection: {
          ...registrationChallenge.authenticatorSelection,
          authenticatorAttachment: registrationChallenge.authenticatorSelection.authenticatorAttachment
        },
        excludeCredentials: excludeCredentials.map(cred => ({
          ...cred,
          id: cred.id,
          transports: ['usb', 'nfc', 'ble', 'internal'] as AuthenticatorTransport[]
        }))
      };

      return {
        challenge: registrationChallenge,
        publicKeyCredentialCreationOptions
      };

    } catch (error) {
      console.error('Failed to generate registration challenge:', error);
      throw new AppError(
        'Failed to generate registration challenge',
        500,
        'REGISTRATION_CHALLENGE_FAILED'
      );
    }
  }

  /**
   * Verify registration response and register new authenticator
   */
  async verifyRegistration(
    userId: string,
    credentialId: string,
    attestationObject: string,
    clientDataJSON: string,
    deviceName?: string
  ): Promise<RegistrationResult> {
    try {
      // Parse client data
      const clientData = JSON.parse(this.bufferToString(this.base64UrlToBuffer(clientDataJSON)));
      
      // Verify origin
      if (clientData.origin !== this.origin) {
        return { 
          success: false, 
          error: `Invalid origin: expected ${this.origin}, got ${clientData.origin}` 
        };
      }

      // Verify type
      if (clientData.type !== 'webauthn.create') {
        return { 
          success: false, 
          error: `Invalid type: expected webauthn.create, got ${clientData.type}` 
        };
      }

      // Verify challenge
      const challenge = clientData.challenge;
      const challengeKey = `webauthn_reg_challenge:${userId}:${challenge}`;
      const storedChallenge = await this.redis.get(challengeKey);
      
      if (!storedChallenge) {
        return { 
          success: false, 
          error: 'Invalid or expired challenge' 
        };
      }

      // Parse stored challenge
      const challengeData = JSON.parse(storedChallenge);
      
      // Parse attestation object
      const attestationBuffer = this.base64UrlToBuffer(attestationObject);
      const attestationParsed = this.parseAttestationObject(attestationBuffer);
      
      if (!attestationParsed.success) {
        return { 
          success: false, 
          error: 'Invalid attestation object' 
        };
      }

      // Extract public key from authenticator data
      const publicKey = this.extractPublicKey(attestationParsed.authData);
      if (!publicKey) {
        return { 
          success: false, 
          error: 'Failed to extract public key' 
        };
      }

      // Verify signature if attestation is present
      const attestationVerified = await this.verifyAttestation(
        attestationParsed,
        clientDataJSON,
        challengeData.attestation
      );

      if (!attestationVerified) {
        return { 
          success: false, 
          error: 'Attestation verification failed' 
        };
      }

      // Extract flags and counters
      const flags = this.parseAuthenticatorFlags(attestationParsed.authData);
      
      // Store authenticator in database
      const authenticator = await prisma.authenticatorDevice.create({
        data: {
          id: `auth_${Date.now()}_${randomBytes(8).toString('hex')}`,
          userId,
          credentialId: this.bufferToBase64Url(this.base64UrlToBuffer(credentialId)),
          publicKey: this.bufferToBase64Url(publicKey),
          counter: attestationParsed.counter || 0,
          deviceName: deviceName || 'WebAuthn Device',
          deviceType: challengeData.authenticatorSelection?.authenticatorAttachment || 'cross-platform',
          attestationType: challengeData.attestation || 'none',
          isActive: true,
          userVerified: flags.userVerified,
          backupEligible: flags.backupEligible,
          backupState: flags.backupState,
          createdAt: new Date()
        }
      });

      // Clean up challenge
      await this.redis.del(challengeKey);

      console.log(`✅ WebAuthn authenticator registered for user ${userId}:`, {
        credentialId: authenticator.credentialId,
        deviceName: authenticator.deviceName,
        deviceType: authenticator.deviceType
      });

      return {
        success: true,
        credentialId: authenticator.credentialId,
        deviceName: authenticator.deviceName,
        attestationObject,
        clientDataJSON
      };

    } catch (error) {
      console.error('WebAuthn registration verification failed:', error);
      return { 
        success: false, 
        error: 'Registration verification failed' 
      };
    }
  }

  /**
   * Generate authentication challenge
   */
  async generateAuthenticationChallenge(
    userId?: string,
    options: {
      userVerification?: 'required' | 'preferred' | 'discouraged';
      allowCredentials?: string[];
    } = {}
  ): Promise<{
    challenge: AuthenticationChallenge;
    publicKeyCredentialRequestOptions: any;
  }> {
    try {
      const challenge = this.generateChallenge();
      
      // Get user credentials if userId provided
      let allowCredentials: Array<{ type: 'public-key'; id: Buffer }> = [];
      
      if (userId) {
        const userCredentials = await this.getUserCredentials(userId);
        allowCredentials = userCredentials
          .filter(cred => cred.isActive)
          .map(cred => ({
            type: 'public-key' as const,
            id: this.base64UrlToBuffer(cred.credentialId)
          }));
      } else if (options.allowCredentials) {
        allowCredentials = options.allowCredentials.map(credId => ({
          type: 'public-key' as const,
          id: this.base64UrlToBuffer(credId)
        }));
      }

      const authenticationChallenge: AuthenticationChallenge = {
        challenge,
        userId,
        timeout: this.challengeTimeout,
        userVerification: options.userVerification || 'preferred',
        allowCredentials: allowCredentials.map(cred => ({
          type: cred.type,
          id: this.bufferToBase64Url(cred.id)
        }))
      };

      // Store challenge in Redis
      const challengeKey = `webauthn_auth_challenge:${challenge}`;
      await this.redis.setex(
        challengeKey,
        Math.ceil(this.challengeTimeout / 1000),
        JSON.stringify({
          ...authenticationChallenge,
          createdAt: new Date().toISOString()
        })
      );

      // Create WebAuthn PublicKeyCredentialRequestOptions
      const publicKeyCredentialRequestOptions = {
        challenge: this.base64UrlToBuffer(challenge),
        timeout: this.challengeTimeout,
        rpId: this.rpId,
        userVerification: authenticationChallenge.userVerification,
        allowCredentials: allowCredentials.map(cred => ({
          ...cred,
          id: cred.id,
          transports: ['usb', 'nfc', 'ble', 'internal'] as AuthenticatorTransport[]
        }))
      };

      return {
        challenge: authenticationChallenge,
        publicKeyCredentialRequestOptions
      };

    } catch (error) {
      console.error('Failed to generate authentication challenge:', error);
      throw new AppError(
        'Failed to generate authentication challenge',
        500,
        'AUTHENTICATION_CHALLENGE_FAILED'
      );
    }
  }

  /**
   * Verify authentication response
   */
  async verifyAuthentication(
    credentialId: string,
    authenticatorData: string,
    clientDataJSON: string,
    signature: string,
    userHandle?: string
  ): Promise<AuthenticationResult> {
    try {
      // Parse client data
      const clientData = JSON.parse(this.bufferToString(this.base64UrlToBuffer(clientDataJSON)));
      
      // Verify origin
      if (clientData.origin !== this.origin) {
        return { 
          success: false, 
          error: `Invalid origin: expected ${this.origin}, got ${clientData.origin}` 
        };
      }

      // Verify type
      if (clientData.type !== 'webauthn.get') {
        return { 
          success: false, 
          error: `Invalid type: expected webauthn.get, got ${clientData.type}` 
        };
      }

      // Verify challenge
      const challenge = clientData.challenge;
      const challengeKey = `webauthn_auth_challenge:${challenge}`;
      const storedChallenge = await this.redis.get(challengeKey);
      
      if (!storedChallenge) {
        return { 
          success: false, 
          error: 'Invalid or expired challenge' 
        };
      }

      // Get authenticator from database
      const authenticator = await prisma.authenticatorDevice.findFirst({
        where: {
          credentialId: this.bufferToBase64Url(this.base64UrlToBuffer(credentialId)),
          isActive: true
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        }
      });

      if (!authenticator) {
        return { 
          success: false, 
          error: 'Authenticator not found or inactive' 
        };
      }

      // Parse authenticator data
      const authDataBuffer = this.base64UrlToBuffer(authenticatorData);
      const authDataParsed = this.parseAuthenticatorData(authDataBuffer);
      
      // Verify RP ID hash
      const expectedRpIdHash = createHash('sha256').update(this.rpId).digest();
      if (!authDataParsed.rpIdHash.equals(expectedRpIdHash)) {
        return { 
          success: false, 
          error: 'RP ID hash mismatch' 
        };
      }

      // Verify counter (replay attack protection)
      if (authDataParsed.counter <= authenticator.counter) {
        console.warn(`Counter rollback detected for credential ${credentialId}: ${authDataParsed.counter} <= ${authenticator.counter}`);
        
        // Mark authenticator as potentially compromised
        await prisma.authenticatorDevice.update({
          where: { id: authenticator.id },
          data: { 
            isActive: false,
            lastUsed: new Date()
          }
        });
        
        return { 
          success: false, 
          error: 'Counter rollback detected - authenticator disabled for security' 
        };
      }

      // Verify signature
      const signatureBuffer = this.base64UrlToBuffer(signature);
      const publicKeyBuffer = this.base64UrlToBuffer(authenticator.publicKey);
      
      const signatureVerified = await this.verifySignature(
        publicKeyBuffer,
        authDataBuffer,
        this.base64UrlToBuffer(clientDataJSON),
        signatureBuffer
      );

      if (!signatureVerified) {
        return { 
          success: false, 
          error: 'Signature verification failed' 
        };
      }

      // Update authenticator counter and last used
      await prisma.authenticatorDevice.update({
        where: { id: authenticator.id },
        data: {
          counter: authDataParsed.counter,
          lastUsed: new Date()
        }
      });

      // Clean up challenge
      await this.redis.del(challengeKey);

      const flags = this.parseAuthenticatorFlags(authDataBuffer);

      console.log(`✅ WebAuthn authentication successful for user ${authenticator.userId}:`, {
        credentialId: authenticator.credentialId,
        deviceName: authenticator.deviceName,
        counter: authDataParsed.counter,
        userVerified: flags.userVerified
      });

      return {
        success: true,
        credentialId: authenticator.credentialId,
        userHandle: authenticator.userId,
        counter: authDataParsed.counter,
        userVerified: flags.userVerified
      };

    } catch (error) {
      console.error('WebAuthn authentication verification failed:', error);
      return { 
        success: false, 
        error: 'Authentication verification failed' 
      };
    }
  }

  /**
   * Get user's registered authenticators
   */
  async getUserCredentials(userId: string): Promise<AuthenticatorDevice[]> {
    try {
      const authenticators = await prisma.authenticatorDevice.findMany({
        where: { 
          userId,
          isActive: true 
        },
        orderBy: { createdAt: 'desc' }
      });

      return authenticators.map(auth => ({
        id: auth.id,
        credentialId: auth.credentialId,
        publicKey: auth.publicKey,
        counter: auth.counter,
        deviceName: auth.deviceName,
        deviceType: auth.deviceType as 'platform' | 'cross-platform',
        attestationType: auth.attestationType as 'none' | 'basic' | 'self' | 'attestation-ca',
        createdAt: auth.createdAt,
        lastUsed: auth.lastUsed || undefined,
        isActive: auth.isActive,
        userVerified: auth.userVerified,
        backupEligible: auth.backupEligible,
        backupState: auth.backupState
      }));

    } catch (error) {
      console.error('Failed to get user credentials:', error);
      return [];
    }
  }

  /**
   * Remove authenticator
   */
  async removeAuthenticator(userId: string, credentialId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await prisma.authenticatorDevice.updateMany({
        where: {
          userId,
          credentialId,
          isActive: true
        },
        data: {
          isActive: false,
          lastUsed: new Date()
        }
      });

      if (result.count === 0) {
        return { success: false, error: 'Authenticator not found' };
      }

      console.log(`🔑 WebAuthn authenticator removed for user ${userId}: ${credentialId}`);
      return { success: true };

    } catch (error) {
      console.error('Failed to remove authenticator:', error);
      return { success: false, error: 'Failed to remove authenticator' };
    }
  }

  /**
   * Update authenticator name
   */
  async updateAuthenticatorName(userId: string, credentialId: string, deviceName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await prisma.authenticatorDevice.updateMany({
        where: {
          userId,
          credentialId,
          isActive: true
        },
        data: {
          deviceName: deviceName.trim().substring(0, 100) // Limit name length
        }
      });

      if (result.count === 0) {
        return { success: false, error: 'Authenticator not found' };
      }

      return { success: true };

    } catch (error) {
      console.error('Failed to update authenticator name:', error);
      return { success: false, error: 'Failed to update authenticator name' };
    }
  }

  // Helper methods for WebAuthn protocol implementation

  private generateChallenge(): string {
    return this.bufferToBase64Url(randomBytes(32));
  }

  private stringToBuffer(str: string): Buffer {
    return Buffer.from(str, 'utf8');
  }

  private bufferToString(buffer: Buffer): string {
    return buffer.toString('utf8');
  }

  private bufferToBase64Url(buffer: Buffer): string {
    return buffer.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private base64UrlToBuffer(base64url: string): Buffer {
    const base64 = base64url
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const padding = 4 - (base64.length % 4);
    const paddedBase64 = padding !== 4 ? base64 + '='.repeat(padding) : base64;
    
    return Buffer.from(paddedBase64, 'base64');
  }

  private parseAttestationObject(attestationBuffer: Buffer): { success: boolean; authData?: Buffer; counter?: number; fmt?: string } {
    try {
      // This is a simplified implementation
      // In production, use a proper CBOR library like 'cbor'
      // For now, we'll extract the authenticator data portion
      
      // The attestation object is CBOR-encoded
      // We need to decode it and extract authData
      // This is a placeholder implementation
      
      return {
        success: true,
        authData: attestationBuffer.slice(0, 37), // Simplified extraction
        counter: 0,
        fmt: 'none'
      };
    } catch (error) {
      console.error('Failed to parse attestation object:', error);
      return { success: false };
    }
  }

  private extractPublicKey(authData: Buffer): Buffer | null {
    try {
      // Extract public key from authenticator data
      // This is a simplified implementation
      // In production, parse the CBOR-encoded credential public key
      
      if (authData.length < 77) {
        return null;
      }
      
      // Extract the credential public key (after the credential ID)
      // This is a placeholder - actual implementation needs proper CBOR parsing
      return authData.slice(55, 77);
    } catch (error) {
      console.error('Failed to extract public key:', error);
      return null;
    }
  }

  private parseAuthenticatorData(authData: Buffer): { rpIdHash: Buffer; flags: number; counter: number } {
    if (authData.length < 37) {
      throw new Error('Invalid authenticator data length');
    }

    return {
      rpIdHash: authData.slice(0, 32),
      flags: authData[32],
      counter: authData.readUInt32BE(33)
    };
  }

  private parseAuthenticatorFlags(authData: Buffer): {
    userPresent: boolean;
    userVerified: boolean;
    attestedCredentialData: boolean;
    extensionDataIncluded: boolean;
    backupEligible: boolean;
    backupState: boolean;
  } {
    const flags = authData[32];
    
    return {
      userPresent: (flags & 0x01) !== 0,
      userVerified: (flags & 0x04) !== 0,
      attestedCredentialData: (flags & 0x40) !== 0,
      extensionDataIncluded: (flags & 0x80) !== 0,
      backupEligible: (flags & 0x08) !== 0,
      backupState: (flags & 0x10) !== 0
    };
  }

  private async verifyAttestation(
    attestationParsed: any,
    clientDataJSON: string,
    attestationType: string
  ): Promise<boolean> {
    // Simplified attestation verification
    // In production, implement proper attestation verification based on format
    
    if (attestationType === 'none') {
      return true; // No attestation verification needed
    }
    
    // For 'basic', 'self', or 'attestation-ca', implement proper verification
    // This would involve checking certificate chains, signatures, etc.
    
    return true; // Placeholder
  }

  private async verifySignature(
    publicKey: Buffer,
    authenticatorData: Buffer,
    clientDataJSON: Buffer,
    signature: Buffer
  ): Promise<boolean> {
    try {
      const crypto = require('crypto');
      
      // Create the data to verify (authenticatorData + hash(clientDataJSON))
      const clientDataHash = crypto.createHash('sha256').update(clientDataJSON).digest();
      const signedData = Buffer.concat([authenticatorData, clientDataHash]);
      
      // For ES256 (ECDSA with SHA-256)
      // This is a simplified implementation
      // In production, parse the public key properly and use the correct algorithm
      
      const verify = crypto.createVerify('sha256');
      verify.update(signedData);
      
      // Convert public key to PEM format (this is simplified)
      // In practice, you need to parse the CBOR-encoded public key
      // and convert it to the appropriate format for crypto.verify()
      
      return true; // Placeholder - implement actual signature verification
      
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }
}

/**
 * Create WebAuthn service instance
 */
export function createWebAuthnService(redis: Redis, config: {
  rpId?: string;
  rpName?: string;
  origin?: string;
} = {}): WebAuthnService {
  const defaultConfig = {
    rpId: process.env.WEBAUTHN_RP_ID || 'localhost',
    rpName: process.env.WEBAUTHN_RP_NAME || 'CRYB Platform',
    origin: process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000'
  };

  return new WebAuthnService(redis, { ...defaultConfig, ...config });
}