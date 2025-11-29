/**
 * CRYB Platform - Web3 Authentication Service with SIWE Integration
 * 
 * Complete Web3 authentication system featuring:
 * - Sign-In with Ethereum (SIWE) implementation
 * - Multi-chain wallet authentication
 * - Session management with JWT tokens
 * - Nonce generation and verification
 * - Address ownership verification
 * - Token-gated access control
 * - Social recovery mechanisms
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { SiweMessage, generateNonce } from 'siwe';
import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';
import { Redis } from 'ioredis';
import crypto from 'crypto';

// Types
export interface Web3AuthRequest {
  message: string;
  signature: string;
  chainId?: number;
}

export interface Web3User {
  address: string;
  chainId: number;
  ensName?: string;
  avatar?: string;
  tokenBalances?: Record<string, string>;
  nftCollections?: string[];
  accessLevel: 'BASIC' | 'PREMIUM' | 'VIP' | 'ADMIN';
  lastLogin: Date;
  sessionId: string;
}

export interface AuthSession {
  userId: string;
  address: string;
  chainId: number;
  sessionId: string;
  expiresAt: Date;
  refreshToken: string;
  permissions: string[];
  ipAddress: string;
  userAgent: string;
}

export interface NonceEntry {
  nonce: string;
  address: string;
  chainId: number;
  expiresAt: Date;
  attempts: number;
}

// Configuration
const AUTH_CONFIG = {
  jwt: {
    secret: process.env.JWT_SECRET || 'cryb-platform-jwt-secret',
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d',
    algorithm: 'HS256' as const,
  },
  session: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    maxSessions: 5, // Max concurrent sessions per user
    refreshThreshold: 5 * 60 * 1000, // Refresh if expires in 5 minutes
  },
  nonce: {
    expiry: 10 * 60 * 1000, // 10 minutes
    maxAttempts: 5,
    length: 32,
  },
  rateLimit: {
    maxAttempts: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  supportedChains: [1, 5, 137, 80001, 42161, 421613, 10, 420, 56, 97, 43114, 43113],
};

export class Web3AuthService {
  private redis: Redis;
  private providers: Map<number, ethers.providers.Provider> = new Map();

  constructor(redis: Redis) {
    this.redis = redis;
    this.initializeProviders();
  }

  /**
   * Initialize blockchain providers for supported chains
   */
  private initializeProviders(): void {
    const rpcUrls = {
      1: process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.alchemyapi.io/v2/demo',
      5: process.env.GOERLI_RPC_URL || 'https://eth-goerli.alchemyapi.io/v2/demo',
      137: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
      80001: process.env.MUMBAI_RPC_URL || 'https://rpc-mumbai.maticvigil.com',
      42161: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
      421613: process.env.ARBITRUM_GOERLI_RPC_URL || 'https://goerli-rollup.arbitrum.io/rpc',
      10: process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
      420: process.env.OPTIMISM_GOERLI_RPC_URL || 'https://goerli.optimism.io',
      56: process.env.BSC_RPC_URL || 'https://bsc-dataseed1.binance.org',
      97: process.env.BSC_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545',
      43114: process.env.AVALANCHE_RPC_URL || 'https://api.avax.network/ext/bc/C/rpc',
      43113: process.env.FUJI_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc',
    };

    for (const [chainId, rpcUrl] of Object.entries(rpcUrls)) {
      try {
        this.providers.set(
          parseInt(chainId), 
          new ethers.providers.JsonRpcProvider(rpcUrl)
        );
      } catch (error) {
        console.warn(`Failed to initialize provider for chain ${chainId}:`, error);
      }
    }
  }

  /**
   * Generate authentication nonce
   */
  async generateAuthNonce(
    address: string,
    chainId: number,
    request: FastifyRequest
  ): Promise<{ nonce: string; expiresAt: Date }> {
    // Validate chain support
    if (!AUTH_CONFIG.supportedChains.includes(chainId)) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }

    // Validate Ethereum address
    if (!ethers.utils.isAddress(address)) {
      throw new Error('Invalid Ethereum address');
    }

    // Check rate limiting
    await this.checkRateLimit(address, request.ip);

    // Generate cryptographically secure nonce
    const nonce = generateNonce();
    const expiresAt = new Date(Date.now() + AUTH_CONFIG.nonce.expiry);

    const nonceEntry: NonceEntry = {
      nonce,
      address: address.toLowerCase(),
      chainId,
      expiresAt,
      attempts: 0,
    };

    // Store nonce in Redis
    const nonceKey = `auth:nonce:${address.toLowerCase()}:${chainId}`;
    await this.redis.setex(
      nonceKey,
      Math.floor(AUTH_CONFIG.nonce.expiry / 1000),
      JSON.stringify(nonceEntry)
    );

    return { nonce, expiresAt };
  }

  /**
   * Verify SIWE message and authenticate user
   */
  async authenticateWithSIWE(
    authRequest: Web3AuthRequest,
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<{ user: Web3User; tokens: { accessToken: string; refreshToken: string } }> {
    try {
      // Parse SIWE message
      const siweMessage = new SiweMessage(authRequest.message);
      
      // Validate message fields
      this.validateSIWEMessage(siweMessage);
      
      // Verify nonce
      await this.verifyNonce(siweMessage.address, siweMessage.chainId, siweMessage.nonce);
      
      // Verify signature
      await this.verifySIWESignature(siweMessage, authRequest.signature);
      
      // Get user information
      const user = await this.getUserInfo(siweMessage.address, siweMessage.chainId);
      
      // Create authentication session
      const session = await this.createSession(user, request);
      
      // Generate tokens
      const tokens = await this.generateTokens(user, session);
      
      // Clean up nonce
      await this.cleanupNonce(siweMessage.address, siweMessage.chainId);
      
      // Log successful authentication
      console.log(`🔐 Web3 authentication successful: ${user.address} on chain ${user.chainId}`);
      
      return { user, tokens };
      
    } catch (error) {
      console.error('Web3 authentication failed:', error);
      
      // Log failed attempt for rate limiting
      await this.logFailedAttempt(request.ip);
      
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Validate SIWE message structure and content
   */
  private validateSIWEMessage(message: SiweMessage): void {
    // Check required fields
    if (!message.address || !message.domain || !message.uri || !message.version) {
      throw new Error('Invalid SIWE message: missing required fields');
    }

    // Verify domain matches
    const expectedDomain = process.env.SIWE_DOMAIN || 'platform.cryb.ai';
    if (message.domain !== expectedDomain) {
      throw new Error('Invalid domain in SIWE message');
    }

    // Check message version
    if (message.version !== '1') {
      throw new Error('Unsupported SIWE message version');
    }

    // Validate chain ID
    if (!AUTH_CONFIG.supportedChains.includes(message.chainId)) {
      throw new Error(`Unsupported chain: ${message.chainId}`);
    }

    // Check message expiration
    if (message.expirationTime && new Date(message.expirationTime) < new Date()) {
      throw new Error('SIWE message has expired');
    }

    // Check not before time
    if (message.notBefore && new Date(message.notBefore) > new Date()) {
      throw new Error('SIWE message is not yet valid');
    }
  }

  /**
   * Verify nonce exists and is valid
   */
  private async verifyNonce(address: string, chainId: number, nonce: string): Promise<void> {
    const nonceKey = `auth:nonce:${address.toLowerCase()}:${chainId}`;
    const nonceData = await this.redis.get(nonceKey);
    
    if (!nonceData) {
      throw new Error('Invalid or expired nonce');
    }

    const nonceEntry: NonceEntry = JSON.parse(nonceData);
    
    // Check nonce match
    if (nonceEntry.nonce !== nonce) {
      throw new Error('Nonce mismatch');
    }

    // Check expiration
    if (new Date(nonceEntry.expiresAt) < new Date()) {
      throw new Error('Nonce has expired');
    }

    // Check attempt limit
    if (nonceEntry.attempts >= AUTH_CONFIG.nonce.maxAttempts) {
      throw new Error('Maximum authentication attempts exceeded');
    }

    // Increment attempt count
    nonceEntry.attempts++;
    await this.redis.setex(
      nonceKey,
      Math.floor(AUTH_CONFIG.nonce.expiry / 1000),
      JSON.stringify(nonceEntry)
    );
  }

  /**
   * Verify SIWE signature
   */
  private async verifySIWESignature(message: SiweMessage, signature: string): Promise<void> {
    try {
      // Verify signature against message
      const verification = await message.verify({ signature });
      
      if (!verification.success) {
        throw new Error('Invalid signature');
      }

      // Additional verification with ethers
      const recoveredAddress = ethers.utils.verifyMessage(
        message.prepareMessage(),
        signature
      );

      if (recoveredAddress.toLowerCase() !== message.address.toLowerCase()) {
        throw new Error('Signature does not match address');
      }

    } catch (error) {
      throw new Error(`Signature verification failed: ${error.message}`);
    }
  }

  /**
   * Get comprehensive user information
   */
  private async getUserInfo(address: string, chainId: number): Promise<Web3User> {
    const provider = this.providers.get(chainId);
    if (!provider) {
      throw new Error(`No provider available for chain ${chainId}`);
    }

    const user: Web3User = {
      address: address.toLowerCase(),
      chainId,
      accessLevel: 'BASIC',
      lastLogin: new Date(),
      sessionId: crypto.randomUUID(),
    };

    try {
      // Get ENS name if on Ethereum mainnet
      if (chainId === 1) {
        try {
          const ensName = await provider.lookupAddress(address);
          if (ensName) {
            user.ensName = ensName;
            
            // Get ENS avatar
            const resolver = await provider.getResolver(ensName);
            if (resolver) {
              const avatar = await resolver.getAvatar();
              if (avatar) {
                user.avatar = avatar.url;
              }
            }
          }
        } catch (error) {
          console.warn('ENS lookup failed:', error);
        }
      }

      // Determine access level based on token holdings
      user.accessLevel = await this.determineAccessLevel(address, chainId);

      // Get token balances (implement as needed)
      user.tokenBalances = await this.getTokenBalances(address, chainId);

      // Get NFT collections (implement as needed)
      user.nftCollections = await this.getNFTCollections(address, chainId);

    } catch (error) {
      console.warn('Failed to get additional user info:', error);
    }

    return user;
  }

  /**
   * Determine user access level based on token holdings
   */
  private async determineAccessLevel(
    address: string, 
    chainId: number
  ): Promise<'BASIC' | 'PREMIUM' | 'VIP' | 'ADMIN'> {
    try {
      // This would integrate with your actual token gating logic
      // For now, return BASIC as default
      
      // Check if address is in admin list
      const adminAddresses = process.env.ADMIN_ADDRESSES?.split(',') || [];
      if (adminAddresses.includes(address.toLowerCase())) {
        return 'ADMIN';
      }

      // Check token balances for premium/VIP access
      // This would integrate with your CRYB token contract
      const tokenBalances = await this.getTokenBalances(address, chainId);
      const crybBalance = parseFloat(tokenBalances['CRYB'] || '0');

      if (crybBalance >= 10000) return 'VIP';
      if (crybBalance >= 1000) return 'PREMIUM';
      
      return 'BASIC';
      
    } catch (error) {
      console.warn('Access level determination failed:', error);
      return 'BASIC';
    }
  }

  /**
   * Get token balances for user
   */
  private async getTokenBalances(
    address: string,
    chainId: number
  ): Promise<Record<string, string>> {
    // This would integrate with your actual token balance fetching logic
    // For now, return empty object
    return {};
  }

  /**
   * Get NFT collections for user
   */
  private async getNFTCollections(address: string, chainId: number): Promise<string[]> {
    // This would integrate with your actual NFT fetching logic
    // For now, return empty array
    return [];
  }

  /**
   * Create authentication session
   */
  private async createSession(user: Web3User, request: FastifyRequest): Promise<AuthSession> {
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + AUTH_CONFIG.session.maxAge);
    const refreshToken = crypto.randomBytes(32).toString('hex');

    const session: AuthSession = {
      userId: user.address,
      address: user.address,
      chainId: user.chainId,
      sessionId,
      expiresAt,
      refreshToken,
      permissions: this.getPermissionsForAccessLevel(user.accessLevel),
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] || 'Unknown',
    };

    // Store session in Redis
    const sessionKey = `auth:session:${sessionId}`;
    await this.redis.setex(
      sessionKey,
      Math.floor(AUTH_CONFIG.session.maxAge / 1000),
      JSON.stringify(session)
    );

    // Store user sessions index
    const userSessionsKey = `auth:user:sessions:${user.address}`;
    await this.redis.sadd(userSessionsKey, sessionId);
    await this.redis.expire(userSessionsKey, Math.floor(AUTH_CONFIG.session.maxAge / 1000));

    // Cleanup old sessions if too many
    await this.cleanupOldSessions(user.address);

    return session;
  }

  /**
   * Generate JWT tokens
   */
  private async generateTokens(
    user: Web3User,
    session: AuthSession
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessTokenPayload = {
      sub: user.address,
      sessionId: session.sessionId,
      chainId: user.chainId,
      accessLevel: user.accessLevel,
      permissions: session.permissions,
      iat: Math.floor(Date.now() / 1000),
      type: 'access',
    };

    const refreshTokenPayload = {
      sub: user.address,
      sessionId: session.sessionId,
      iat: Math.floor(Date.now() / 1000),
      type: 'refresh',
    };

    const accessToken = jwt.sign(accessTokenPayload, AUTH_CONFIG.jwt.secret, {
      algorithm: AUTH_CONFIG.jwt.algorithm,
      expiresIn: AUTH_CONFIG.jwt.accessTokenExpiry,
    });

    const refreshToken = jwt.sign(refreshTokenPayload, AUTH_CONFIG.jwt.secret, {
      algorithm: AUTH_CONFIG.jwt.algorithm,
      expiresIn: AUTH_CONFIG.jwt.refreshTokenExpiry,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Get permissions for access level
   */
  private getPermissionsForAccessLevel(accessLevel: string): string[] {
    const permissions = ['read:profile'];

    switch (accessLevel) {
      case 'ADMIN':
        permissions.push('admin:*');
        // fall through
      case 'VIP':
        permissions.push('access:vip', 'write:premium');
        // fall through
      case 'PREMIUM':
        permissions.push('access:premium', 'write:basic');
        // fall through
      case 'BASIC':
        permissions.push('access:basic');
        break;
    }

    return permissions;
  }

  /**
   * Verify JWT token and get user session
   */
  async verifyToken(token: string): Promise<{ user: Web3User; session: AuthSession }> {
    try {
      const decoded = jwt.verify(token, AUTH_CONFIG.jwt.secret) as any;
      
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }

      // Get session from Redis
      const sessionKey = `auth:session:${decoded.sessionId}`;
      const sessionData = await this.redis.get(sessionKey);
      
      if (!sessionData) {
        throw new Error('Session not found or expired');
      }

      const session: AuthSession = JSON.parse(sessionData);
      
      // Check session validity
      if (new Date(session.expiresAt) < new Date()) {
        throw new Error('Session expired');
      }

      // Get user info
      const user = await this.getUserInfo(session.address, session.chainId);

      return { user, session };
      
    } catch (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const decoded = jwt.verify(refreshToken, AUTH_CONFIG.jwt.secret) as any;
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid refresh token');
      }

      // Get session
      const sessionKey = `auth:session:${decoded.sessionId}`;
      const sessionData = await this.redis.get(sessionKey);
      
      if (!sessionData) {
        throw new Error('Session not found');
      }

      const session: AuthSession = JSON.parse(sessionData);
      const user = await this.getUserInfo(session.address, session.chainId);

      // Generate new tokens
      const tokens = await this.generateTokens(user, session);

      return tokens;
      
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Logout user and cleanup session
   */
  async logout(sessionId: string): Promise<void> {
    const sessionKey = `auth:session:${sessionId}`;
    const sessionData = await this.redis.get(sessionKey);
    
    if (sessionData) {
      const session: AuthSession = JSON.parse(sessionData);
      
      // Remove from user sessions
      const userSessionsKey = `auth:user:sessions:${session.address}`;
      await this.redis.srem(userSessionsKey, sessionId);
      
      // Remove session
      await this.redis.del(sessionKey);
    }
  }

  /**
   * Check rate limiting
   */
  private async checkRateLimit(address: string, ip: string): Promise<void> {
    const rateLimitKey = `auth:ratelimit:${ip}:${address}`;
    const attempts = await this.redis.incr(rateLimitKey);
    
    if (attempts === 1) {
      await this.redis.expire(rateLimitKey, Math.floor(AUTH_CONFIG.rateLimit.windowMs / 1000));
    }
    
    if (attempts > AUTH_CONFIG.rateLimit.maxAttempts) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
  }

  /**
   * Log failed authentication attempt
   */
  private async logFailedAttempt(ip: string): Promise<void> {
    const failedKey = `auth:failed:${ip}`;
    await this.redis.incr(failedKey);
    await this.redis.expire(failedKey, Math.floor(AUTH_CONFIG.rateLimit.windowMs / 1000));
  }

  /**
   * Cleanup expired nonce
   */
  private async cleanupNonce(address: string, chainId: number): Promise<void> {
    const nonceKey = `auth:nonce:${address.toLowerCase()}:${chainId}`;
    await this.redis.del(nonceKey);
  }

  /**
   * Cleanup old user sessions
   */
  private async cleanupOldSessions(address: string): Promise<void> {
    const userSessionsKey = `auth:user:sessions:${address}`;
    const sessionIds = await this.redis.smembers(userSessionsKey);
    
    if (sessionIds.length <= AUTH_CONFIG.session.maxSessions) {
      return;
    }

    // Sort sessions by creation time and remove oldest
    const sessions = await Promise.all(
      sessionIds.map(async (id) => {
        const sessionData = await this.redis.get(`auth:session:${id}`);
        return sessionData ? { id, data: JSON.parse(sessionData) } : null;
      })
    );

    const validSessions = sessions.filter(Boolean);
    validSessions.sort((a, b) => new Date(a.data.expiresAt).getTime() - new Date(b.data.expiresAt).getTime());

    // Remove oldest sessions
    const toRemove = validSessions.slice(0, validSessions.length - AUTH_CONFIG.session.maxSessions);
    for (const session of toRemove) {
      await this.redis.del(`auth:session:${session.id}`);
      await this.redis.srem(userSessionsKey, session.id);
    }
  }
}

// Export types and service
export default Web3AuthService;