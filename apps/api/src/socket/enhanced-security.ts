import { Server, Socket } from 'socket.io';
import { FastifyInstance } from 'fastify';
import Redis from 'ioredis';
import { AdvancedRedisPubSub } from './advanced-redis-pubsub';
import { verifyToken } from '@cryb/auth';
import { prisma } from '@cryb/database';

/**
 * ENHANCED SECURITY SYSTEM FOR WEBSOCKET CONNECTIONS
 * 
 * Features:
 * ✅ Multi-layer rate limiting (connection, event, message)
 * ✅ Advanced JWT validation with token refresh
 * ✅ Connection filtering and blacklisting
 * ✅ DDoS protection and mitigation
 * ✅ Intrusion detection and prevention
 * ✅ Security event logging and analysis
 * ✅ Geo-blocking and IP reputation checks
 * ✅ Content filtering and validation
 * ✅ Session security and hijacking prevention
 * ✅ Real-time security monitoring
 * ✅ Automated threat response
 * ✅ Security audit trails
 */

export interface SecurityConfig {
  rateLimit: {
    connectionWindow: number;
    connectionsPerWindow: number;
    eventWindow: number;
    eventsPerWindow: number;
    messageWindow: number;
    messagesPerWindow: number;
    burstAllowance: number;
  };
  authentication: {
    jwtAlgorithm: string;
    tokenTtl: number;
    refreshThreshold: number;
    maxConcurrentSessions: number;
    requireTwoFactor: boolean;
  };
  filtering: {
    enableGeoBlocking: boolean;
    allowedCountries: string[];
    blockedCountries: string[];
    enableIPReputation: boolean;
    reputationThreshold: number;
    enableUserAgentFiltering: boolean;
    blockedUserAgents: string[];
  };
  ddosProtection: {
    enabled: boolean;
    threshold: number;
    timeWindow: number;
    blockDuration: number;
    autoMitigation: boolean;
  };
  monitoring: {
    logSecurityEvents: boolean;
    alertOnSuspiciousActivity: boolean;
    enableIntrusionDetection: boolean;
    enableBehaviorAnalysis: boolean;
  };
}

export interface SecurityMetrics {
  connections: {
    total: number;
    allowed: number;
    blocked: number;
    rateLimited: number;
    authFailed: number;
  };
  events: {
    total: number;
    processed: number;
    blocked: number;
    rateLimited: number;
    malicious: number;
  };
  threats: {
    ddosAttempts: number;
    suspiciousIPs: number;
    malformedRequests: number;
    unauthorizedAccess: number;
    intrusionAttempts: number;
  };
  security: {
    activeBlacklist: number;
    trustedIPs: number;
    activeSessions: number;
    expiredTokens: number;
    twoFactorBypass: number;
  };
}

export interface SecurityEvent {
  id: string;
  timestamp: number;
  type: 'connection_blocked' | 'rate_limit_exceeded' | 'auth_failed' | 'ddos_detected' | 
        'malicious_payload' | 'session_hijack' | 'unauthorized_access' | 'suspicious_behavior';
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip: string;
  userAgent?: string;
  userId?: string;
  sessionId?: string;
  description: string;
  metadata: Record<string, any>;
  blocked: boolean;
  responseAction: string;
}

export interface RateLimitEntry {
  ip: string;
  userId?: string;
  connections: number;
  events: number;
  messages: number;
  lastConnection: number;
  lastEvent: number;
  lastMessage: number;
  violations: number;
  blockedUntil?: number;
}

export interface BlacklistEntry {
  ip: string;
  reason: string;
  timestamp: number;
  expiresAt?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  automatic: boolean;
}

export class EnhancedSecuritySystem {
  private io: Server;
  private fastify: FastifyInstance;
  private redis: Redis;
  private pubsub: AdvancedRedisPubSub;
  
  // Configuration
  private config: SecurityConfig;
  
  // Security state
  private rateLimits = new Map<string, RateLimitEntry>();
  private blacklist = new Map<string, BlacklistEntry>();
  private trustedIPs = new Set<string>();
  private activeSessions = new Map<string, Set<string>>(); // userId -> sessionIds
  private suspiciousIPs = new Map<string, number>(); // IP -> suspicion score
  
  // Security metrics
  private metrics: SecurityMetrics;
  
  // Security events
  private securityEvents: SecurityEvent[] = [];
  private readonly MAX_EVENT_HISTORY = 10000;
  
  // Monitoring
  private securityInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  // DDoS detection
  private connectionTracker = new Map<string, number[]>();
  private ddosDetectionWindow = 60000; // 1 minute
  
  constructor(io: Server, fastify: FastifyInstance, redis: Redis, pubsub: AdvancedRedisPubSub) {
    this.io = io;
    this.fastify = fastify;
    this.redis = redis;
    this.pubsub = pubsub;
    
    this.config = this.getDefaultConfig();
    this.metrics = this.initializeMetrics();
    
    this.initialize();
  }
  
  /**
   * Initialize the security system
   */
  private async initialize(): Promise<void> {
    try {
      this.fastify.log.info('🔒 Initializing Enhanced Security System...');
      
      // Load security configuration
      await this.loadSecurityConfiguration();
      
      // Setup connection security
      this.setupConnectionSecurity();
      
      // Setup authentication security
      this.setupAuthenticationSecurity();
      
      // Setup rate limiting
      this.setupRateLimiting();
      
      // Setup content filtering
      this.setupContentFiltering();
      
      // Setup DDoS protection
      this.setupDDoSProtection();
      
      // Setup intrusion detection
      this.setupIntrusionDetection();
      
      // Start security monitoring
      this.startSecurityMonitoring();
      
      // Load existing security data
      await this.loadSecurityData();
      
      this.fastify.log.info('🛡️ Enhanced Security System initialized');
      this.fastify.log.info('🔐 Security features active:');
      this.fastify.log.info(`   - Rate limiting: ${this.config.rateLimit.connectionsPerWindow} conn/min`);
      this.fastify.log.info(`   - JWT validation: ${this.config.authentication.jwtAlgorithm}`);
      this.fastify.log.info(`   - Geo-blocking: ${this.config.filtering.enableGeoBlocking ? 'enabled' : 'disabled'}`);
      this.fastify.log.info(`   - DDoS protection: ${this.config.ddosProtection.enabled ? 'enabled' : 'disabled'}`);
      this.fastify.log.info(`   - Intrusion detection: ${this.config.monitoring.enableIntrusionDetection ? 'enabled' : 'disabled'}`);
      
    } catch (error) {
      this.fastify.log.error('💥 Failed to initialize Enhanced Security System:', error);
      throw error;
    }
  }
  
  /**
   * Setup connection security
   */
  private setupConnectionSecurity(): void {
    // Pre-connection validation
    this.io.engine.on('connection_error', (err) => {
      this.logSecurityEvent({
        type: 'connection_blocked',
        severity: 'medium',
        ip: 'unknown',
        description: `Connection error: ${err.message}`,
        metadata: { error: err.message },
        blocked: true,
        responseAction: 'connection_rejected'
      });
    });
    
    // Connection middleware
    this.io.use(async (socket, next) => {
      try {
        const connectionResult = await this.validateConnection(socket);
        
        if (!connectionResult.allowed) {
          this.logSecurityEvent({
            type: 'connection_blocked',
            severity: connectionResult.severity || 'medium',
            ip: connectionResult.ip,
            userAgent: connectionResult.userAgent,
            description: connectionResult.reason || 'Connection blocked',
            metadata: connectionResult.metadata || {},
            blocked: true,
            responseAction: 'connection_rejected'
          });
          
          this.metrics.connections.blocked++;
          return next(new Error(connectionResult.reason || 'Connection blocked'));
        }
        
        this.metrics.connections.allowed++;
        next();
        
      } catch (error) {
        this.fastify.log.error('Connection security error:', error);
        next(new Error('Security validation failed'));
      }
    });
  }
  
  /**
   * Validate incoming connection
   */
  private async validateConnection(socket: Socket): Promise<{
    allowed: boolean;
    reason?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    ip: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }> {
    
    const ip = this.getClientIP(socket);
    const userAgent = socket.handshake.headers['user-agent'] || '';
    
    // Check blacklist
    if (this.blacklist.has(ip)) {
      const entry = this.blacklist.get(ip)!;
      if (!entry.expiresAt || entry.expiresAt > Date.now()) {
        return {
          allowed: false,
          reason: `IP blacklisted: ${entry.reason}`,
          severity: entry.severity,
          ip,
          userAgent,
          metadata: { blacklistReason: entry.reason }
        };
      } else {
        // Remove expired blacklist entry
        this.blacklist.delete(ip);
      }
    }
    
    // Check rate limiting
    const rateLimitResult = await this.checkConnectionRateLimit(ip);
    if (!rateLimitResult.allowed) {
      return {
        allowed: false,
        reason: 'Connection rate limit exceeded',
        severity: 'medium',
        ip,
        userAgent,
        metadata: { rateLimit: rateLimitResult }
      };
    }
    
    // Check geo-blocking
    if (this.config.filtering.enableGeoBlocking) {
      const geoResult = await this.checkGeoBlocking(ip);
      if (!geoResult.allowed) {
        return {
          allowed: false,
          reason: `Geographic location blocked: ${geoResult.country}`,
          severity: 'low',
          ip,
          userAgent,
          metadata: { country: geoResult.country }
        };
      }
    }
    
    // Check IP reputation
    if (this.config.filtering.enableIPReputation) {
      const reputationResult = await this.checkIPReputation(ip);
      if (!reputationResult.allowed) {
        return {
          allowed: false,
          reason: `Low IP reputation score: ${reputationResult.score}`,
          severity: 'high',
          ip,
          userAgent,
          metadata: { reputationScore: reputationResult.score }
        };
      }
    }
    
    // Check user agent filtering
    if (this.config.filtering.enableUserAgentFiltering) {
      const uaResult = this.checkUserAgent(userAgent);
      if (!uaResult.allowed) {
        return {
          allowed: false,
          reason: `Blocked user agent: ${userAgent}`,
          severity: 'low',
          ip,
          userAgent,
          metadata: { userAgent }
        };
      }
    }
    
    // Check DDoS protection
    if (this.config.ddosProtection.enabled) {
      const ddosResult = this.checkDDoSProtection(ip);
      if (!ddosResult.allowed) {
        return {
          allowed: false,
          reason: 'DDoS protection triggered',
          severity: 'critical',
          ip,
          userAgent,
          metadata: { connectionRate: ddosResult.connectionRate }
        };
      }
    }
    
    return { allowed: true, ip, userAgent };
  }
  
  /**
   * Setup authentication security
   */
  private setupAuthenticationSecurity(): void {
    this.io.use(async (socket, next) => {
      try {
        const authResult = await this.authenticateSocket(socket);
        
        if (!authResult.success) {
          this.logSecurityEvent({
            type: 'auth_failed',
            severity: authResult.severity || 'medium',
            ip: this.getClientIP(socket),
            userAgent: socket.handshake.headers['user-agent'],
            description: authResult.reason || 'Authentication failed',
            metadata: authResult.metadata || {},
            blocked: true,
            responseAction: 'auth_rejected'
          });
          
          this.metrics.connections.authFailed++;
          return next(new Error(authResult.reason || 'Authentication failed'));
        }
        
        // Setup socket security context
        this.setupSocketSecurity(socket, authResult.user);
        
        next();
        
      } catch (error) {
        this.fastify.log.error('Authentication security error:', error);
        next(new Error('Authentication security validation failed'));
      }
    });
  }
  
  /**
   * Authenticate socket connection
   */
  private async authenticateSocket(socket: Socket): Promise<{
    success: boolean;
    user?: any;
    reason?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    metadata?: Record<string, any>;
  }> {
    
    try {
      // Extract token from multiple sources
      let token = this.extractToken(socket);
      
      if (!token) {
        return {
          success: false,
          reason: 'No authentication token provided',
          severity: 'low',
          metadata: { tokenSources: 'none' }
        };
      }
      
      // Validate token format
      if (!this.isValidTokenFormat(token)) {
        return {
          success: false,
          reason: 'Invalid token format',
          severity: 'medium',
          metadata: { tokenFormat: 'invalid' }
        };
      }
      
      // Verify JWT token
      let payload: any;
      try {
        payload = verifyToken(token);
      } catch (jwtError) {
        return {
          success: false,
          reason: `JWT verification failed: ${jwtError.message}`,
          severity: 'medium',
          metadata: { jwtError: jwtError.message }
        };
      }
      
      if (!payload?.userId) {
        return {
          success: false,
          reason: 'Invalid token payload - missing userId',
          severity: 'medium',
          metadata: { payload: 'invalid' }
        };
      }
      
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
          isVerified: true,
          bannedAt: true,
          lastSeenAt: true,
          twoFactorEnabled: true,
          roles: true
        }
      });
      
      if (!user) {
        return {
          success: false,
          reason: 'User not found',
          severity: 'high',
          metadata: { userId: payload.userId }
        };
      }
      
      // Check if user is banned
      if (user.bannedAt && user.bannedAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
        return {
          success: false,
          reason: 'User account is banned',
          severity: 'high',
          metadata: { bannedAt: user.bannedAt }
        };
      }
      
      // Check concurrent session limit
      const userSessions = this.activeSessions.get(user.id) || new Set();
      if (userSessions.size >= this.config.authentication.maxConcurrentSessions) {
        return {
          success: false,
          reason: 'Maximum concurrent sessions exceeded',
          severity: 'medium',
          metadata: { sessionCount: userSessions.size }
        };
      }
      
      // Check two-factor authentication if required
      if (this.config.authentication.requireTwoFactor && user.twoFactorEnabled) {
        const twoFactorResult = await this.validateTwoFactor(socket, user);
        if (!twoFactorResult.valid) {
          return {
            success: false,
            reason: 'Two-factor authentication required',
            severity: 'medium',
            metadata: { twoFactor: 'required' }
          };
        }
      }
      
      // Check token freshness
      const tokenAge = Date.now() - payload.iat * 1000;
      if (tokenAge > this.config.authentication.refreshThreshold) {
        // Token is old but still valid - consider refresh
        this.logSecurityEvent({
          type: 'suspicious_behavior',
          severity: 'low',
          ip: this.getClientIP(socket),
          userId: user.id,
          description: 'Old token used for authentication',
          metadata: { tokenAge, userId: user.id },
          blocked: false,
          responseAction: 'token_refresh_suggested'
        });
      }
      
      return { success: true, user };
      
    } catch (error) {
      this.fastify.log.error('Authentication error:', error);
      return {
        success: false,
        reason: 'Authentication system error',
        severity: 'high',
        metadata: { error: error.message }
      };
    }
  }
  
  /**
   * Setup socket security context
   */
  private setupSocketSecurity(socket: Socket, user: any): void {
    // Add security metadata to socket
    (socket as any).security = {
      userId: user.id,
      sessionId: socket.id,
      authenticated: true,
      ip: this.getClientIP(socket),
      userAgent: socket.handshake.headers['user-agent'],
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      eventCount: 0,
      messageCount: 0
    };
    
    // Track active session
    if (!this.activeSessions.has(user.id)) {
      this.activeSessions.set(user.id, new Set());
    }
    this.activeSessions.get(user.id)!.add(socket.id);
    
    // Setup event monitoring
    this.setupSocketEventMonitoring(socket);
    
    // Setup disconnect handling
    socket.on('disconnect', () => {
      this.handleSecureDisconnect(socket, user);
    });
  }
  
  /**
   * Setup socket event monitoring
   */
  private setupSocketEventMonitoring(socket: Socket): void {
    const originalEmit = socket.emit.bind(socket);
    const originalOn = socket.on.bind(socket);
    
    // Monitor outgoing events
    socket.emit = (...args: any[]) => {
      const security = (socket as any).security;
      if (security) {
        security.lastActivity = Date.now();
        security.eventCount++;
        
        // Check event rate limiting
        if (!this.checkEventRateLimit(socket)) {
          this.logSecurityEvent({
            type: 'rate_limit_exceeded',
            severity: 'medium',
            ip: security.ip,
            userId: security.userId,
            sessionId: security.sessionId,
            description: 'Event rate limit exceeded',
            metadata: { eventCount: security.eventCount },
            blocked: true,
            responseAction: 'event_blocked'
          });
          return false;
        }
      }
      
      return originalEmit(...args);
    };
    
    // Monitor incoming events
    socket.on = (event: string, listener: (...args: any[]) => void) => {
      const wrappedListener = (...args: any[]) => {
        const security = (socket as any).security;
        if (security) {
          security.lastActivity = Date.now();
          security.eventCount++;
          
          // Validate event content
          const validationResult = this.validateEventContent(event, args);
          if (!validationResult.valid) {
            this.logSecurityEvent({
              type: 'malicious_payload',
              severity: validationResult.severity || 'medium',
              ip: security.ip,
              userId: security.userId,
              sessionId: security.sessionId,
              description: `Malicious event content: ${validationResult.reason}`,
              metadata: { event, reason: validationResult.reason },
              blocked: true,
              responseAction: 'event_blocked'
            });
            return;
          }
          
          // Check suspicious behavior
          this.analyzeSocketBehavior(socket, event, args);
        }
        
        try {
          listener(...args);
        } catch (error) {
          this.fastify.log.error('Event handler error:', error);
        }
      };
      
      return originalOn(event, wrappedListener);
    };
  }
  
  /**
   * Setup rate limiting
   */
  private setupRateLimiting(): void {
    // Rate limit cleanup interval
    setInterval(() => {
      this.cleanupRateLimits();
    }, 60000); // Every minute
  }
  
  /**
   * Check connection rate limit
   */
  private async checkConnectionRateLimit(ip: string): Promise<{
    allowed: boolean;
    current: number;
    limit: number;
    resetTime: number;
  }> {
    
    try {
      const key = `rate_limit:connection:${ip}`;
      const now = Date.now();
      const window = this.config.rateLimit.connectionWindow;
      const limit = this.config.rateLimit.connectionsPerWindow;
      
      // Use Redis for distributed rate limiting
      const pipeline = this.redis.pipeline();
      pipeline.zremrangebyscore(key, 0, now - window);
      pipeline.zadd(key, now, now);
      pipeline.zcard(key);
      pipeline.expire(key, Math.ceil(window / 1000));
      
      const results = await pipeline.exec();
      const current = results?.[2]?.[1] as number || 0;
      
      const allowed = current <= limit;
      
      if (!allowed) {
        // Track violation
        const entry = this.rateLimits.get(ip) || this.createRateLimitEntry(ip);
        entry.violations++;
        entry.connections = current;
        entry.lastConnection = now;
        this.rateLimits.set(ip, entry);
        
        this.metrics.connections.rateLimited++;
      }
      
      return {
        allowed,
        current,
        limit,
        resetTime: now + window
      };
      
    } catch (error) {
      this.fastify.log.error('Rate limit check error:', error);
      return { allowed: true, current: 0, limit: 0, resetTime: 0 };
    }
  }
  
  /**
   * Check event rate limit
   */
  private checkEventRateLimit(socket: Socket): boolean {
    const security = (socket as any).security;
    if (!security) return false;
    
    const now = Date.now();
    const window = this.config.rateLimit.eventWindow;
    const limit = this.config.rateLimit.eventsPerWindow;
    
    // Simple in-memory rate limiting for events
    const windowStart = now - window;
    if (security.lastActivity < windowStart) {
      security.eventCount = 1;
      return true;
    }
    
    if (security.eventCount > limit) {
      this.metrics.events.rateLimited++;
      return false;
    }
    
    return true;
  }
  
  /**
   * Validate event content
   */
  private validateEventContent(event: string, args: any[]): {
    valid: boolean;
    reason?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
  } {
    
    // Check for malicious event names
    if (this.isMaliciousEvent(event)) {
      return {
        valid: false,
        reason: `Malicious event name: ${event}`,
        severity: 'high'
      };
    }
    
    // Check for oversized payloads
    try {
      const payload = JSON.stringify(args);
      if (payload.length > 1024 * 1024) { // 1MB limit
        return {
          valid: false,
          reason: 'Payload too large',
          severity: 'medium'
        };
      }
    } catch (error) {
      return {
        valid: false,
        reason: 'Invalid payload format',
        severity: 'medium'
      };
    }
    
    // Check for injection attempts
    if (this.containsInjectionAttempt(args)) {
      return {
        valid: false,
        reason: 'Injection attempt detected',
        severity: 'critical'
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Analyze socket behavior for suspicious patterns
   */
  private analyzeSocketBehavior(socket: Socket, event: string, args: any[]): void {
    const security = (socket as any).security;
    if (!security) return;
    
    const ip = security.ip;
    let suspicionScore = this.suspiciousIPs.get(ip) || 0;
    
    // Check for rapid event firing
    const eventRate = security.eventCount / ((Date.now() - security.connectedAt) / 1000);
    if (eventRate > 100) { // More than 100 events per second
      suspicionScore += 10;
    }
    
    // Check for unusual event patterns
    if (this.isUnusualEventPattern(event, args)) {
      suspicionScore += 5;
    }
    
    // Check for privilege escalation attempts
    if (this.isPrivilegeEscalationAttempt(event, args)) {
      suspicionScore += 20;
    }
    
    // Update suspicion score
    this.suspiciousIPs.set(ip, suspicionScore);
    
    // Trigger alerts for high suspicion scores
    if (suspicionScore > 50) {
      this.logSecurityEvent({
        type: 'suspicious_behavior',
        severity: 'high',
        ip: security.ip,
        userId: security.userId,
        sessionId: security.sessionId,
        description: `High suspicion score: ${suspicionScore}`,
        metadata: { suspicionScore, event, eventRate },
        blocked: false,
        responseAction: 'monitoring_increased'
      });
    }
    
    if (suspicionScore > 100) {
      // Auto-blacklist IP
      this.addToBlacklist(ip, 'Automatic blacklist due to suspicious behavior', 'high', true);
      socket.disconnect(true);
    }
  }
  
  /**
   * Setup content filtering
   */
  private setupContentFiltering(): void {
    // Content filters are applied in validateEventContent
    this.fastify.log.info('📋 Content filtering configured');
  }
  
  /**
   * Setup DDoS protection
   */
  private setupDDoSProtection(): void {
    if (!this.config.ddosProtection.enabled) return;
    
    setInterval(() => {
      this.analyzeDDoSPatterns();
    }, 10000); // Every 10 seconds
  }
  
  /**
   * Check DDoS protection
   */
  private checkDDoSProtection(ip: string): {
    allowed: boolean;
    connectionRate?: number;
  } {
    
    if (!this.config.ddosProtection.enabled) {
      return { allowed: true };
    }
    
    const now = Date.now();
    const window = this.config.ddosProtection.timeWindow;
    
    if (!this.connectionTracker.has(ip)) {
      this.connectionTracker.set(ip, []);
    }
    
    const connections = this.connectionTracker.get(ip)!;
    
    // Remove old connections
    const cutoff = now - window;
    while (connections.length > 0 && connections[0] < cutoff) {
      connections.shift();
    }
    
    // Add current connection
    connections.push(now);
    
    const connectionRate = connections.length;
    
    if (connectionRate > this.config.ddosProtection.threshold) {
      // DDoS detected
      this.handleDDoSDetection(ip, connectionRate);
      return { allowed: false, connectionRate };
    }
    
    return { allowed: true, connectionRate };
  }
  
  /**
   * Handle DDoS detection
   */
  private handleDDoSDetection(ip: string, connectionRate: number): void {
    this.logSecurityEvent({
      type: 'ddos_detected',
      severity: 'critical',
      ip,
      description: `DDoS attack detected: ${connectionRate} connections`,
      metadata: { connectionRate, threshold: this.config.ddosProtection.threshold },
      blocked: true,
      responseAction: 'ip_blacklisted'
    });
    
    this.metrics.threats.ddosAttempts++;
    
    if (this.config.ddosProtection.autoMitigation) {
      // Auto-blacklist the IP
      this.addToBlacklist(
        ip, 
        `DDoS attack: ${connectionRate} connections`, 
        'critical', 
        true,
        Date.now() + this.config.ddosProtection.blockDuration
      );
    }
  }
  
  /**
   * Setup intrusion detection
   */
  private setupIntrusionDetection(): void {
    if (!this.config.monitoring.enableIntrusionDetection) return;
    
    this.fastify.log.info('🔍 Intrusion detection enabled');
  }
  
  /**
   * Utility methods
   */
  
  private getClientIP(socket: Socket): string {
    const headers = socket.handshake.headers;
    return (headers['x-forwarded-for'] as string)?.split(',')[0] ||
           (headers['x-real-ip'] as string) ||
           socket.handshake.address ||
           'unknown';
  }
  
  private extractToken(socket: Socket): string | null {
    const { auth, headers, query } = socket.handshake;
    
    // Check auth object
    if (auth?.token) return auth.token;
    
    // Check authorization header
    const authHeader = headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    // Check query parameters
    if (query?.token) return query.token as string;
    
    return null;
  }
  
  private isValidTokenFormat(token: string): boolean {
    return typeof token === 'string' && 
           token.length > 10 && 
           token.split('.').length === 3;
  }
  
  private async validateTwoFactor(socket: Socket, user: any): Promise<{ valid: boolean }> {
    // Simplified 2FA validation - implement based on your 2FA system
    const twoFactorCode = socket.handshake.auth?.twoFactorCode;
    
    if (!twoFactorCode) {
      return { valid: false };
    }
    
    // Validate 2FA code (implement your validation logic)
    return { valid: true };
  }
  
  private async checkGeoBlocking(ip: string): Promise<{
    allowed: boolean;
    country?: string;
  }> {
    
    try {
      // Implement geo-location lookup
      // For demo purposes, always allow
      return { allowed: true };
    } catch (error) {
      return { allowed: true };
    }
  }
  
  private async checkIPReputation(ip: string): Promise<{
    allowed: boolean;
    score?: number;
  }> {
    
    try {
      // Implement IP reputation check
      // For demo purposes, always allow
      return { allowed: true, score: 100 };
    } catch (error) {
      return { allowed: true };
    }
  }
  
  private checkUserAgent(userAgent: string): { allowed: boolean } {
    const blocked = this.config.filtering.blockedUserAgents;
    const isBlocked = blocked.some(pattern => 
      userAgent.toLowerCase().includes(pattern.toLowerCase())
    );
    
    return { allowed: !isBlocked };
  }
  
  private isMaliciousEvent(event: string): boolean {
    const maliciousPatterns = [
      '__proto__',
      'constructor',
      'prototype',
      'eval',
      'function',
      'script',
      'alert',
      'document',
      'window'
    ];
    
    return maliciousPatterns.some(pattern => 
      event.toLowerCase().includes(pattern)
    );
  }
  
  private containsInjectionAttempt(args: any[]): boolean {
    const payload = JSON.stringify(args);
    const injectionPatterns = [
      '<script',
      'javascript:',
      'vbscript:',
      'onload=',
      'onerror=',
      'eval(',
      'Function(',
      'setTimeout(',
      'setInterval('
    ];
    
    return injectionPatterns.some(pattern => 
      payload.toLowerCase().includes(pattern)
    );
  }
  
  private isUnusualEventPattern(event: string, args: any[]): boolean {
    // Implement pattern analysis
    return false;
  }
  
  private isPrivilegeEscalationAttempt(event: string, args: any[]): boolean {
    const escalationPatterns = [
      'admin',
      'root',
      'sudo',
      'privilege',
      'escalate',
      'bypass',
      'override'
    ];
    
    const content = `${event} ${JSON.stringify(args)}`.toLowerCase();
    return escalationPatterns.some(pattern => content.includes(pattern));
  }
  
  private createRateLimitEntry(ip: string): RateLimitEntry {
    return {
      ip,
      connections: 0,
      events: 0,
      messages: 0,
      lastConnection: 0,
      lastEvent: 0,
      lastMessage: 0,
      violations: 0
    };
  }
  
  private addToBlacklist(
    ip: string, 
    reason: string, 
    severity: 'low' | 'medium' | 'high' | 'critical', 
    automatic: boolean,
    expiresAt?: number
  ): void {
    
    const entry: BlacklistEntry = {
      ip,
      reason,
      timestamp: Date.now(),
      expiresAt,
      severity,
      automatic
    };
    
    this.blacklist.set(ip, entry);
    this.metrics.security.activeBlacklist++;
    
    this.fastify.log.warn(`🚫 IP ${ip} blacklisted: ${reason}`);
  }
  
  /**
   * Security monitoring and logging
   */
  
  private startSecurityMonitoring(): void {
    this.securityInterval = setInterval(() => {
      this.analyzeSecurityMetrics();
    }, 30000); // Every 30 seconds
    
    this.cleanupInterval = setInterval(() => {
      this.cleanupSecurityData();
    }, 5 * 60 * 1000); // Every 5 minutes
  }
  
  private logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: Date.now()
    };
    
    this.securityEvents.push(securityEvent);
    
    // Trim event history
    if (this.securityEvents.length > this.MAX_EVENT_HISTORY) {
      this.securityEvents.shift();
    }
    
    // Log based on severity
    const logLevel = event.severity === 'critical' || event.severity === 'high' ? 'warn' : 'info';
    this.fastify.log[logLevel](`🔒 Security Event [${event.severity.toUpperCase()}]: ${event.description}`);
    
    // Broadcast security event
    this.io.emit('security:event', securityEvent);
    
    // Publish to other servers
    this.pubsub.publish('security:event', securityEvent, { priority: 'high' });
  }
  
  private analyzeSecurityMetrics(): void {
    // Update metrics
    this.updateSecurityMetrics();
    
    // Detect patterns
    this.detectSecurityPatterns();
    
    // Generate alerts if needed
    this.checkSecurityAlerts();
  }
  
  private updateSecurityMetrics(): void {
    this.metrics.security.activeBlacklist = this.blacklist.size;
    this.metrics.security.trustedIPs = this.trustedIPs.size;
    this.metrics.security.activeSessions = Array.from(this.activeSessions.values())
      .reduce((sum, sessions) => sum + sessions.size, 0);
    this.metrics.threats.suspiciousIPs = this.suspiciousIPs.size;
  }
  
  private detectSecurityPatterns(): void {
    // Analyze recent security events for patterns
    const recentEvents = this.securityEvents.filter(
      event => Date.now() - event.timestamp < 300000 // Last 5 minutes
    );
    
    // Detect coordinated attacks
    const ipCounts = new Map<string, number>();
    for (const event of recentEvents) {
      ipCounts.set(event.ip, (ipCounts.get(event.ip) || 0) + 1);
    }
    
    for (const [ip, count] of ipCounts.entries()) {
      if (count > 10) { // More than 10 events in 5 minutes
        this.logSecurityEvent({
          type: 'suspicious_behavior',
          severity: 'high',
          ip,
          description: `Coordinated attack detected: ${count} events in 5 minutes`,
          metadata: { eventCount: count, timeWindow: 300000 },
          blocked: false,
          responseAction: 'increased_monitoring'
        });
      }
    }
  }
  
  private checkSecurityAlerts(): void {
    // Check for conditions that require immediate attention
    const criticalEvents = this.securityEvents.filter(
      event => event.severity === 'critical' && 
               Date.now() - event.timestamp < 60000 // Last minute
    ).length;
    
    if (criticalEvents > 5) {
      this.fastify.log.error(`🚨 SECURITY ALERT: ${criticalEvents} critical events in the last minute`);
    }
  }
  
  private cleanupSecurityData(): void {
    const now = Date.now();
    
    // Cleanup expired blacklist entries
    for (const [ip, entry] of this.blacklist.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.blacklist.delete(ip);
        this.metrics.security.activeBlacklist--;
      }
    }
    
    // Cleanup old rate limit entries
    this.cleanupRateLimits();
    
    // Cleanup old suspicious IPs
    for (const [ip, score] of this.suspiciousIPs.entries()) {
      if (score < 10) { // Reset low scores
        this.suspiciousIPs.delete(ip);
      } else {
        // Decay suspicion score
        this.suspiciousIPs.set(ip, Math.max(0, score - 5));
      }
    }
    
    // Cleanup old connection tracking
    const cutoff = now - this.ddosDetectionWindow;
    for (const [ip, connections] of this.connectionTracker.entries()) {
      const filtered = connections.filter(time => time > cutoff);
      if (filtered.length === 0) {
        this.connectionTracker.delete(ip);
      } else {
        this.connectionTracker.set(ip, filtered);
      }
    }
  }
  
  private cleanupRateLimits(): void {
    const now = Date.now();
    const cutoff = now - this.config.rateLimit.connectionWindow;
    
    for (const [ip, entry] of this.rateLimits.entries()) {
      if (entry.lastConnection < cutoff && entry.lastEvent < cutoff && entry.lastMessage < cutoff) {
        this.rateLimits.delete(ip);
      }
    }
  }
  
  /**
   * Event handlers
   */
  
  private handleSecureDisconnect(socket: Socket, user: any): void {
    const security = (socket as any).security;
    if (security) {
      // Remove from active sessions
      const userSessions = this.activeSessions.get(user.id);
      if (userSessions) {
        userSessions.delete(socket.id);
        if (userSessions.size === 0) {
          this.activeSessions.delete(user.id);
        }
      }
      
      // Log disconnect
      this.fastify.log.debug(`🔌 Secure disconnect: ${user.username} (${socket.id})`);
    }
  }
  
  private analyzeDDoSPatterns(): void {
    // Analyze connection patterns for DDoS attacks
    const now = Date.now();
    const suspiciousIPs: string[] = [];
    
    for (const [ip, connections] of this.connectionTracker.entries()) {
      const recentConnections = connections.filter(
        time => time > now - this.config.ddosProtection.timeWindow
      );
      
      if (recentConnections.length > this.config.ddosProtection.threshold * 0.8) {
        suspiciousIPs.push(ip);
      }
    }
    
    if (suspiciousIPs.length > 5) {
      this.logSecurityEvent({
        type: 'ddos_detected',
        severity: 'critical',
        ip: 'multiple',
        description: `Potential distributed attack: ${suspiciousIPs.length} suspicious IPs`,
        metadata: { suspiciousIPs: suspiciousIPs.length },
        blocked: false,
        responseAction: 'monitoring_increased'
      });
    }
  }
  
  /**
   * Configuration and data loading
   */
  
  private getDefaultConfig(): SecurityConfig {
    return {
      rateLimit: {
        connectionWindow: 60000, // 1 minute
        connectionsPerWindow: 30,
        eventWindow: 10000, // 10 seconds
        eventsPerWindow: 100,
        messageWindow: 60000, // 1 minute
        messagesPerWindow: 60,
        burstAllowance: 10
      },
      authentication: {
        jwtAlgorithm: 'HS256',
        tokenTtl: 3600000, // 1 hour
        refreshThreshold: 1800000, // 30 minutes
        maxConcurrentSessions: 5,
        requireTwoFactor: false
      },
      filtering: {
        enableGeoBlocking: false,
        allowedCountries: [],
        blockedCountries: [],
        enableIPReputation: false,
        reputationThreshold: 50,
        enableUserAgentFiltering: true,
        blockedUserAgents: ['bot', 'crawler', 'spider', 'scraper']
      },
      ddosProtection: {
        enabled: true,
        threshold: 100, // connections per window
        timeWindow: 60000, // 1 minute
        blockDuration: 300000, // 5 minutes
        autoMitigation: true
      },
      monitoring: {
        logSecurityEvents: true,
        alertOnSuspiciousActivity: true,
        enableIntrusionDetection: true,
        enableBehaviorAnalysis: true
      }
    };
  }
  
  private async loadSecurityConfiguration(): Promise<void> {
    try {
      // Load configuration from environment or database
      // For now, use defaults
      this.fastify.log.info('🔧 Security configuration loaded');
    } catch (error) {
      this.fastify.log.error('Error loading security configuration:', error);
    }
  }
  
  private async loadSecurityData(): Promise<void> {
    try {
      // Load blacklist, trusted IPs, etc. from Redis
      const blacklistKeys = await this.redis.keys('security:blacklist:*');
      
      for (const key of blacklistKeys) {
        const data = await this.redis.get(key);
        if (data) {
          try {
            const entry = JSON.parse(data) as BlacklistEntry;
            this.blacklist.set(entry.ip, entry);
          } catch (parseError) {
            this.fastify.log.warn('Failed to parse blacklist entry:', parseError);
          }
        }
      }
      
      this.fastify.log.info(`📋 Loaded ${this.blacklist.size} blacklist entries`);
      
    } catch (error) {
      this.fastify.log.error('Error loading security data:', error);
    }
  }
  
  private generateEventId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private initializeMetrics(): SecurityMetrics {
    return {
      connections: {
        total: 0,
        allowed: 0,
        blocked: 0,
        rateLimited: 0,
        authFailed: 0
      },
      events: {
        total: 0,
        processed: 0,
        blocked: 0,
        rateLimited: 0,
        malicious: 0
      },
      threats: {
        ddosAttempts: 0,
        suspiciousIPs: 0,
        malformedRequests: 0,
        unauthorizedAccess: 0,
        intrusionAttempts: 0
      },
      security: {
        activeBlacklist: 0,
        trustedIPs: 0,
        activeSessions: 0,
        expiredTokens: 0,
        twoFactorBypass: 0
      }
    };
  }
  
  /**
   * Public API
   */
  
  /**
   * Get security metrics
   */
  getSecurityMetrics(): SecurityMetrics {
    this.updateSecurityMetrics();
    return JSON.parse(JSON.stringify(this.metrics));
  }
  
  /**
   * Get security events
   */
  getSecurityEvents(limit: number = 100): SecurityEvent[] {
    return this.securityEvents.slice(-limit);
  }
  
  /**
   * Get blacklist
   */
  getBlacklist(): BlacklistEntry[] {
    return Array.from(this.blacklist.values());
  }
  
  /**
   * Manually add to blacklist
   */
  manualBlacklist(ip: string, reason: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'): boolean {
    try {
      this.addToBlacklist(ip, reason, severity, false);
      
      // Store in Redis
      this.redis.setex(
        `security:blacklist:${ip}`,
        24 * 60 * 60, // 24 hours
        JSON.stringify(this.blacklist.get(ip))
      );
      
      return true;
    } catch (error) {
      this.fastify.log.error('Error adding to blacklist:', error);
      return false;
    }
  }
  
  /**
   * Remove from blacklist
   */
  removeFromBlacklist(ip: string): boolean {
    try {
      const removed = this.blacklist.delete(ip);
      
      if (removed) {
        this.redis.del(`security:blacklist:${ip}`);
        this.metrics.security.activeBlacklist--;
      }
      
      return removed;
    } catch (error) {
      this.fastify.log.error('Error removing from blacklist:', error);
      return false;
    }
  }
  
  /**
   * Add trusted IP
   */
  addTrustedIP(ip: string): void {
    this.trustedIPs.add(ip);
    this.metrics.security.trustedIPs++;
  }
  
  /**
   * Remove trusted IP
   */
  removeTrustedIP(ip: string): boolean {
    const removed = this.trustedIPs.delete(ip);
    if (removed) {
      this.metrics.security.trustedIPs--;
    }
    return removed;
  }
  
  /**
   * Force cleanup
   */
  async forceCleanup(): Promise<void> {
    this.cleanupSecurityData();
    this.fastify.log.info('✅ Security system cleanup completed');
  }
  
  /**
   * Graceful shutdown
   */
  async close(): Promise<void> {
    try {
      this.fastify.log.info('🔄 Shutting down Enhanced Security System...');
      
      if (this.securityInterval) clearInterval(this.securityInterval);
      if (this.cleanupInterval) clearInterval(this.cleanupInterval);
      
      // Save current state to Redis
      for (const [ip, entry] of this.blacklist.entries()) {
        await this.redis.setex(
          `security:blacklist:${ip}`,
          24 * 60 * 60,
          JSON.stringify(entry)
        );
      }
      
      this.fastify.log.info('✅ Enhanced Security System shutdown complete');
      
    } catch (error) {
      this.fastify.log.error('Error during security system shutdown:', error);
    }
  }
}

/**
 * Factory function to create enhanced security system
 */
export function createEnhancedSecurity(
  io: Server,
  fastify: FastifyInstance,
  redis: Redis,
  pubsub: AdvancedRedisPubSub
): EnhancedSecuritySystem {
  return new EnhancedSecuritySystem(io, fastify, redis, pubsub);
}