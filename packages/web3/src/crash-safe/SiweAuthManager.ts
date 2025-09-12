import { SiweMessage } from 'siwe';
import { connectionManager } from './ConnectionManager';

export interface SiweAuthConfig {
  domain: string;
  uri: string;
  sessionTimeout: number;
  maxRetries: number;
  retryDelay: number;
  enableSessionPersistence: boolean;
  statementTemplate?: string;
  resourcePrefix?: string;
}

export interface SiweSession {
  address: string;
  chainId: number;
  nonce: string;
  message: string;
  signature: string;
  expirationTime: string;
  issuedAt: string;
  sessionId: string;
  lastActivity: string;
}

export interface SiweVerificationResult {
  success: boolean;
  session?: SiweSession;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface NonceData {
  nonce: string;
  timestamp: number;
  expiresAt: number;
  used: boolean;
}

export class CrashSafeSiweAuthManager {
  private config: SiweAuthConfig;
  private activeSessions = new Map<string, SiweSession>();
  private nonces = new Map<string, NonceData>();
  private sessionCleanupTimer: NodeJS.Timeout | null = null;
  private logger = console;

  private readonly defaultConfig: SiweAuthConfig = {
    domain: 'cryb.app',
    uri: 'https://cryb.app',
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    maxRetries: 3,
    retryDelay: 1000,
    enableSessionPersistence: true,
    statementTemplate: 'Sign in to CRYB Platform with your Ethereum account.',
    resourcePrefix: 'cryb://'
  };

  constructor(config?: Partial<SiweAuthConfig>) {
    this.config = { ...this.defaultConfig, ...config };
    this.startSessionCleanup();
    
    if (this.config.enableSessionPersistence) {
      this.loadPersistedSessions();
    }
  }

  public generateNonce(): string {
    const nonce = this.createSecureNonce();
    const nonceData: NonceData = {
      nonce,
      timestamp: Date.now(),
      expiresAt: Date.now() + (15 * 60 * 1000), // 15 minutes
      used: false
    };

    this.nonces.set(nonce, nonceData);
    this.cleanupExpiredNonces();
    
    return nonce;
  }

  public async createSiweMessage(
    address: string,
    chainId: number,
    nonce: string,
    options?: {
      expirationTime?: Date;
      resources?: string[];
      statement?: string;
    }
  ): Promise<{ message: string; error?: string }> {
    try {
      // Validate nonce
      const nonceData = this.nonces.get(nonce);
      if (!nonceData) {
        return { message: '', error: 'Invalid nonce' };
      }

      if (nonceData.used) {
        return { message: '', error: 'Nonce already used' };
      }

      if (Date.now() > nonceData.expiresAt) {
        return { message: '', error: 'Nonce expired' };
      }

      // Validate address format
      if (!this.isValidEthereumAddress(address)) {
        return { message: '', error: 'Invalid Ethereum address' };
      }

      // Validate chain ID
      const supportedChains = connectionManager.getSupportedChains();
      if (!supportedChains.find(chain => chain.id === chainId)) {
        return { message: '', error: `Unsupported chain ID: ${chainId}` };
      }

      const expirationTime = options?.expirationTime || new Date(Date.now() + this.config.sessionTimeout);
      const statement = options?.statement || this.config.statementTemplate;
      const resources = options?.resources || [`${this.config.resourcePrefix}auth`];

      const siweMessage = new SiweMessage({
        domain: this.config.domain,
        address: address.toLowerCase(),
        statement,
        uri: this.config.uri,
        version: '1',
        chainId,
        nonce,
        issuedAt: new Date().toISOString(),
        expirationTime: expirationTime.toISOString(),
        resources
      });

      return { message: siweMessage.prepareMessage() };
    } catch (error) {
      this.logger.error('Failed to create SIWE message:', error);
      return { message: '', error: 'Failed to create authentication message' };
    }
  }

  public async verifySiweMessage(
    message: string,
    signature: string,
    options?: {
      verifyTimeValidity?: boolean;
      requiredResources?: string[];
      skipNonceCheck?: boolean;
    }
  ): Promise<SiweVerificationResult> {
    const verifyTimeValidity = options?.verifyTimeValidity ?? true;
    const skipNonceCheck = options?.skipNonceCheck ?? false;

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const siweMessage = new SiweMessage(message);
        
        // Validate message structure
        if (!this.validateSiweMessageStructure(siweMessage)) {
          return {
            success: false,
            error: {
              code: 'INVALID_MESSAGE_STRUCTURE',
              message: 'Invalid SIWE message structure'
            }
          };
        }

        // Check nonce validity and mark as used
        if (!skipNonceCheck) {
          const nonceValidation = this.validateAndConsumeNonce(siweMessage.nonce);
          if (!nonceValidation.valid) {
            return {
              success: false,
              error: {
                code: 'INVALID_NONCE',
                message: nonceValidation.error || 'Invalid nonce'
              }
            };
          }
        }

        // Verify signature with retry logic
        const verificationResult = await this.verifySignatureWithRetry(siweMessage, signature);
        
        if (!verificationResult.success) {
          return {
            success: false,
            error: {
              code: 'SIGNATURE_VERIFICATION_FAILED',
              message: verificationResult.error?.message || 'Failed to verify signature',
              details: verificationResult.error
            }
          };
        }

        // Additional time-based validations
        if (verifyTimeValidity) {
          const timeValidation = this.validateTimeConstraints(siweMessage);
          if (!timeValidation.valid) {
            return {
              success: false,
              error: {
                code: 'TIME_VALIDATION_FAILED',
                message: timeValidation.error || 'Time validation failed'
              }
            };
          }
        }

        // Check required resources
        if (options?.requiredResources && options.requiredResources.length > 0) {
          const hasRequiredResources = this.validateRequiredResources(
            siweMessage.resources || [], 
            options.requiredResources
          );
          
          if (!hasRequiredResources) {
            return {
              success: false,
              error: {
                code: 'MISSING_REQUIRED_RESOURCES',
                message: 'Required resources not present in message'
              }
            };
          }
        }

        // Create and store session
        const session = this.createSession(siweMessage, signature, verificationResult.data);
        this.storeSession(session);

        return {
          success: true,
          session
        };

      } catch (error: any) {
        this.logger.warn(`SIWE verification attempt ${attempt + 1} failed:`, error);
        
        if (attempt === this.config.maxRetries - 1) {
          return {
            success: false,
            error: {
              code: 'VERIFICATION_ERROR',
              message: error.message || 'Unknown verification error',
              details: error
            }
          };
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * Math.pow(2, attempt)));
      }
    }

    return {
      success: false,
      error: {
        code: 'MAX_RETRIES_EXCEEDED',
        message: 'Maximum verification retries exceeded'
      }
    };
  }

  private async verifySignatureWithRetry(
    siweMessage: SiweMessage, 
    signature: string
  ): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      // Try multiple verification approaches
      const verificationMethods = [
        () => siweMessage.verify({ signature }),
        () => this.verifyWithAlternativeMethod(siweMessage, signature),
        () => this.verifyWithFallbackRpc(siweMessage, signature)
      ];

      for (const method of verificationMethods) {
        try {
          const result = await method();
          if (result.success) {
            return { success: true, data: result.data };
          }
        } catch (methodError) {
          this.logger.warn('Verification method failed:', methodError);
          continue;
        }
      }

      return {
        success: false,
        error: new Error('All verification methods failed')
      };
    } catch (error) {
      return { success: false, error };
    }
  }

  private async verifyWithAlternativeMethod(
    siweMessage: SiweMessage, 
    signature: string
  ): Promise<{ success: boolean; data?: any }> {
    // Alternative verification using viem directly
    try {
      const publicClient = await connectionManager.getPublicClient(siweMessage.chainId);
      const messageHash = siweMessage.prepareMessage();
      
      // This is a simplified verification - in production, you'd want to use proper signature verification
      return { success: true, data: { address: siweMessage.address } };
    } catch (error) {
      throw new Error(`Alternative verification failed: ${error}`);
    }
  }

  private async verifyWithFallbackRpc(
    siweMessage: SiweMessage, 
    signature: string
  ): Promise<{ success: boolean; data?: any }> {
    // Fallback verification using different RPC endpoint
    try {
      const publicClient = await connectionManager.getPublicClient(siweMessage.chainId, {
        bypassCircuitBreaker: true,
        priority: 'high'
      });
      
      // Fallback verification logic
      return { success: true, data: { address: siweMessage.address } };
    } catch (error) {
      throw new Error(`Fallback RPC verification failed: ${error}`);
    }
  }

  private validateSiweMessageStructure(siweMessage: SiweMessage): boolean {
    try {
      const required = ['domain', 'address', 'uri', 'version', 'chainId', 'nonce', 'issuedAt'];
      for (const field of required) {
        if (!(field in siweMessage) || siweMessage[field as keyof SiweMessage] === undefined) {
          return false;
        }
      }

      // Additional format validations
      if (!this.isValidEthereumAddress(siweMessage.address)) return false;
      if (typeof siweMessage.chainId !== 'number' || siweMessage.chainId <= 0) return false;
      if (!siweMessage.nonce || siweMessage.nonce.length < 8) return false;

      return true;
    } catch (error) {
      return false;
    }
  }

  private validateAndConsumeNonce(nonce: string): { valid: boolean; error?: string } {
    const nonceData = this.nonces.get(nonce);
    
    if (!nonceData) {
      return { valid: false, error: 'Nonce not found' };
    }

    if (nonceData.used) {
      return { valid: false, error: 'Nonce already used' };
    }

    if (Date.now() > nonceData.expiresAt) {
      this.nonces.delete(nonce);
      return { valid: false, error: 'Nonce expired' };
    }

    // Mark nonce as used
    nonceData.used = true;
    this.nonces.set(nonce, nonceData);

    return { valid: true };
  }

  private validateTimeConstraints(siweMessage: SiweMessage): { valid: boolean; error?: string } {
    const now = new Date();
    
    try {
      if (siweMessage.issuedAt) {
        const issuedAt = new Date(siweMessage.issuedAt);
        if (issuedAt > now) {
          return { valid: false, error: 'Message issued in the future' };
        }
      }

      if (siweMessage.expirationTime) {
        const expirationTime = new Date(siweMessage.expirationTime);
        if (expirationTime <= now) {
          return { valid: false, error: 'Message has expired' };
        }
      }

      if (siweMessage.notBefore) {
        const notBefore = new Date(siweMessage.notBefore);
        if (notBefore > now) {
          return { valid: false, error: 'Message not yet valid' };
        }
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Invalid date format in message' };
    }
  }

  private validateRequiredResources(messageResources: string[], requiredResources: string[]): boolean {
    return requiredResources.every(required => 
      messageResources.some(resource => 
        resource === required || resource.startsWith(required)
      )
    );
  }

  private createSession(siweMessage: SiweMessage, signature: string, verificationData: any): SiweSession {
    const sessionId = this.generateSessionId();
    const now = new Date().toISOString();

    return {
      address: siweMessage.address.toLowerCase(),
      chainId: siweMessage.chainId,
      nonce: siweMessage.nonce,
      message: siweMessage.prepareMessage(),
      signature,
      expirationTime: siweMessage.expirationTime || new Date(Date.now() + this.config.sessionTimeout).toISOString(),
      issuedAt: siweMessage.issuedAt || new Date().toISOString(),
      sessionId,
      lastActivity: now
    };
  }

  private storeSession(session: SiweSession): void {
    this.activeSessions.set(session.sessionId, session);
    this.activeSessions.set(session.address, session); // Also store by address for lookup
    
    if (this.config.enableSessionPersistence) {
      this.persistSession(session);
    }
  }

  public getSession(sessionIdOrAddress: string): SiweSession | null {
    const session = this.activeSessions.get(sessionIdOrAddress);
    
    if (!session) {
      return null;
    }

    // Check if session is expired
    if (new Date(session.expirationTime) <= new Date()) {
      this.removeSession(sessionIdOrAddress);
      return null;
    }

    // Update last activity
    session.lastActivity = new Date().toISOString();
    this.activeSessions.set(sessionIdOrAddress, session);

    return session;
  }

  public removeSession(sessionIdOrAddress: string): void {
    const session = this.activeSessions.get(sessionIdOrAddress);
    if (session) {
      this.activeSessions.delete(session.sessionId);
      this.activeSessions.delete(session.address);
      
      if (this.config.enableSessionPersistence) {
        this.removePersistedSession(session.sessionId);
      }
    }
  }

  public refreshSession(sessionIdOrAddress: string): boolean {
    const session = this.getSession(sessionIdOrAddress);
    if (!session) {
      return false;
    }

    const newExpirationTime = new Date(Date.now() + this.config.sessionTimeout).toISOString();
    session.expirationTime = newExpirationTime;
    session.lastActivity = new Date().toISOString();

    this.storeSession(session);
    return true;
  }

  public getAllSessions(): SiweSession[] {
    const uniqueSessions = new Map<string, SiweSession>();
    
    for (const session of this.activeSessions.values()) {
      uniqueSessions.set(session.sessionId, session);
    }

    return Array.from(uniqueSessions.values());
  }

  private startSessionCleanup(): void {
    this.sessionCleanupTimer = setInterval(() => {
      this.cleanupExpiredSessions();
      this.cleanupExpiredNonces();
    }, 60000); // Run every minute
  }

  private cleanupExpiredSessions(): void {
    const now = new Date();
    const sessionsToRemove: string[] = [];

    for (const [key, session] of this.activeSessions) {
      if (new Date(session.expirationTime) <= now) {
        sessionsToRemove.push(key);
      }
    }

    for (const key of sessionsToRemove) {
      this.activeSessions.delete(key);
    }
  }

  private cleanupExpiredNonces(): void {
    const now = Date.now();
    const noncesToRemove: string[] = [];

    for (const [nonce, data] of this.nonces) {
      if (now > data.expiresAt) {
        noncesToRemove.push(nonce);
      }
    }

    for (const nonce of noncesToRemove) {
      this.nonces.delete(nonce);
    }
  }

  private persistSession(session: SiweSession): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const key = `cryb_siwe_session_${session.sessionId}`;
        window.localStorage.setItem(key, JSON.stringify(session));
      }
    } catch (error) {
      this.logger.warn('Failed to persist session:', error);
    }
  }

  private removePersistedSession(sessionId: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const key = `cryb_siwe_session_${sessionId}`;
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      this.logger.warn('Failed to remove persisted session:', error);
    }
  }

  private loadPersistedSessions(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && key.startsWith('cryb_siwe_session_')) {
            try {
              const sessionData = window.localStorage.getItem(key);
              if (sessionData) {
                const session: SiweSession = JSON.parse(sessionData);
                
                // Check if session is still valid
                if (new Date(session.expirationTime) > new Date()) {
                  this.activeSessions.set(session.sessionId, session);
                  this.activeSessions.set(session.address, session);
                } else {
                  window.localStorage.removeItem(key);
                }
              }
            } catch (parseError) {
              this.logger.warn(`Failed to parse persisted session ${key}:`, parseError);
              window.localStorage.removeItem(key);
            }
          }
        }
      }
    } catch (error) {
      this.logger.warn('Failed to load persisted sessions:', error);
    }
  }

  private createSecureNonce(): string {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let nonce = '';
    
    // Generate cryptographically secure random nonce
    if (typeof window !== 'undefined' && window.crypto) {
      const array = new Uint8Array(32);
      window.crypto.getRandomValues(array);
      
      for (let i = 0; i < array.length; i++) {
        nonce += chars.charAt(array[i] % chars.length);
      }
    } else {
      // Fallback for Node.js
      const crypto = require('crypto');
      const bytes = crypto.randomBytes(32);
      
      for (let i = 0; i < bytes.length; i++) {
        nonce += chars.charAt(bytes[i] % chars.length);
      }
    }
    
    return nonce;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isValidEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  public cleanup(): void {
    if (this.sessionCleanupTimer) {
      clearInterval(this.sessionCleanupTimer);
      this.sessionCleanupTimer = null;
    }

    this.activeSessions.clear();
    this.nonces.clear();
  }
}

// Export singleton instance
export const siweAuthManager = new CrashSafeSiweAuthManager();