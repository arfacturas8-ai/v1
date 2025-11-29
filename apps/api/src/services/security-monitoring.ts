import { FastifyRequest } from 'fastify';
import { createHash } from 'crypto';
import Redis from 'ioredis';
import { prisma } from '@cryb/database';

export interface SecurityEvent {
  type: 'login' | 'logout' | 'failed_login' | '2fa_attempt' | 'token_refresh' | 'password_change' | 'suspicious_activity' | 'account_lockout' | 'rate_limit_exceeded';
  userId?: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
  details: Record<string, any>;
  riskScore: number;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
}

export interface DeviceFingerprint {
  hash: string;
  userAgent: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
  platform?: string;
  cookieEnabled?: boolean;
}

export interface SessionInfo {
  id: string;
  userId: string;
  deviceFingerprint: DeviceFingerprint;
  ipAddress: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
  riskScore: number;
  flags: string[];
}

/**
 * Comprehensive Security Monitoring and Session Management Service
 * 
 * Features:
 * - Real-time security event monitoring
 * - Device fingerprinting and tracking
 * - Anomaly detection (unusual locations, times, devices)
 * - Risk scoring for sessions and events
 * - Automated threat response
 * - Session management with detailed tracking
 * - Geographic location tracking
 * - Brute force attack detection
 * - Account takeover prevention
 */
export class SecurityMonitoringService {
  private redis: Redis;
  private readonly SUSPICIOUS_EVENTS_THRESHOLD = 5;
  private readonly HIGH_RISK_SCORE_THRESHOLD = 75;
  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_CONCURRENT_SESSIONS = 10;

  // Known bot user agents for filtering
  private readonly BOT_USER_AGENTS = [
    /bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i,
    /Googlebot/i, /Bingbot/i, /facebookexternalhit/i, /Twitterbot/i
  ];

  // Suspicious patterns
  private readonly SUSPICIOUS_PATTERNS = {
    fastRequests: { threshold: 50, window: 60000 }, // 50 requests in 1 minute
    multipleIPs: { threshold: 5, window: 300000 }, // 5 different IPs in 5 minutes
    unusualHours: { start: 2, end: 6 }, // 2 AM to 6 AM local time
    rapidFailedLogins: { threshold: 3, window: 300000 }, // 3 failed logins in 5 minutes
    unusualUserAgents: /^(curl|wget|python|ruby|java|go-http|okhttp)/i
  };

  constructor(redis: Redis) {
    this.redis = redis;
    this.setupBackgroundTasks();
    console.log('🛡️ Security Monitoring Service initialized');
  }

  /**
   * Log a security event
   */
  async logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): Promise<void> {
    try {
      const fullEvent: SecurityEvent = {
        ...event,
        timestamp: new Date()
      };

      // Store in Redis for real-time monitoring
      const eventKey = `security_event:${Date.now()}:${Math.random().toString(36).substring(7)}`;
      await this.redis.setex(eventKey, 7 * 24 * 60 * 60, JSON.stringify(fullEvent)); // 7 days

      // Store in database for long-term analysis
      try {
        await prisma.securityLog.create({
          data: {
            type: fullEvent.type,
            userId: fullEvent.userId,
            ipAddress: fullEvent.ip,
            userAgent: fullEvent.userAgent,
            details: fullEvent.details,
            riskScore: fullEvent.riskScore,
            location: fullEvent.location ? JSON.stringify(fullEvent.location) : null,
            createdAt: fullEvent.timestamp
          }
        });
      } catch (dbError) {
        console.warn('Failed to store security event in database:', dbError);
      }

      // Check for immediate threats and respond
      await this.analyzeThreatLevel(fullEvent);

      // Update user risk score
      if (fullEvent.userId) {
        await this.updateUserRiskScore(fullEvent.userId, fullEvent.riskScore);
      }

    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Create and track a new session
   */
  async createSession(
    userId: string,
    request: FastifyRequest,
    additionalInfo: Record<string, any> = {}
  ): Promise<SessionInfo> {
    try {
      const deviceFingerprint = this.generateDeviceFingerprint(request);
      const sessionInfo: SessionInfo = {
        id: createHash('sha256').update(`${userId}:${Date.now()}:${Math.random()}`).digest('hex').substring(0, 16),
        userId,
        deviceFingerprint,
        ipAddress: this.getClientIP(request),
        location: await this.getLocationFromIP(this.getClientIP(request)),
        createdAt: new Date(),
        lastActivity: new Date(),
        isActive: true,
        riskScore: await this.calculateSessionRiskScore(userId, request),
        flags: []
      };

      // Check for suspicious activity
      sessionInfo.flags = await this.detectSuspiciousActivity(userId, sessionInfo);

      // Store session in Redis
      const sessionKey = `session_info:${sessionInfo.id}`;
      await this.redis.setex(sessionKey, Math.ceil(this.SESSION_TIMEOUT / 1000), JSON.stringify(sessionInfo));

      // Track user sessions
      const userSessionsKey = `user_sessions:${userId}`;
      await this.redis.sadd(userSessionsKey, sessionInfo.id);
      await this.redis.expire(userSessionsKey, Math.ceil(this.SESSION_TIMEOUT / 1000));

      // Enforce concurrent session limits
      await this.enforceConcurrentSessionLimits(userId);

      // Log session creation
      await this.logSecurityEvent({
        type: 'login',
        userId,
        ip: sessionInfo.ipAddress,
        userAgent: deviceFingerprint.userAgent,
        riskScore: sessionInfo.riskScore,
        location: sessionInfo.location,
        details: {
          sessionId: sessionInfo.id,
          deviceFingerprint: deviceFingerprint.hash,
          flags: sessionInfo.flags,
          ...additionalInfo
        }
      });

      return sessionInfo;

    } catch (error) {
      console.error('Failed to create session:', error);
      throw new Error('Session creation failed');
    }
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(sessionId: string, request: FastifyRequest): Promise<void> {
    try {
      const sessionKey = `session_info:${sessionId}`;
      const sessionData = await this.redis.get(sessionKey);
      
      if (!sessionData) {
        return; // Session doesn't exist
      }

      const session: SessionInfo = JSON.parse(sessionData);
      session.lastActivity = new Date();

      // Check for suspicious changes
      const currentIP = this.getClientIP(request);
      const currentUserAgent = request.headers['user-agent'] || '';

      if (session.ipAddress !== currentIP) {
        session.flags.push('ip_change');
        session.riskScore = Math.min(100, session.riskScore + 20);
        
        await this.logSecurityEvent({
          type: 'suspicious_activity',
          userId: session.userId,
          ip: currentIP,
          userAgent: currentUserAgent,
          riskScore: 60,
          details: {
            reason: 'ip_address_change',
            previousIP: session.ipAddress,
            currentIP,
            sessionId
          }
        });
      }

      // Update session
      await this.redis.setex(sessionKey, Math.ceil(this.SESSION_TIMEOUT / 1000), JSON.stringify(session));

    } catch (error) {
      console.error('Failed to update session activity:', error);
    }
  }

  /**
   * Get session information
   */
  async getSessionInfo(sessionId: string): Promise<SessionInfo | null> {
    try {
      const sessionKey = `session_info:${sessionId}`;
      const sessionData = await this.redis.get(sessionKey);
      
      if (!sessionData) {
        return null;
      }

      return JSON.parse(sessionData);

    } catch (error) {
      console.error('Failed to get session info:', error);
      return null;
    }
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<SessionInfo[]> {
    try {
      const userSessionsKey = `user_sessions:${userId}`;
      const sessionIds = await this.redis.smembers(userSessionsKey);
      
      const sessions: SessionInfo[] = [];
      
      for (const sessionId of sessionIds) {
        const sessionInfo = await this.getSessionInfo(sessionId);
        if (sessionInfo && sessionInfo.isActive) {
          sessions.push(sessionInfo);
        } else {
          // Clean up inactive session reference
          await this.redis.srem(userSessionsKey, sessionId);
        }
      }

      return sessions.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());

    } catch (error) {
      console.error('Failed to get user sessions:', error);
      return [];
    }
  }

  /**
   * Terminate a session
   */
  async terminateSession(sessionId: string, reason = 'logout'): Promise<void> {
    try {
      const sessionInfo = await this.getSessionInfo(sessionId);
      
      if (sessionInfo) {
        // Log session termination
        await this.logSecurityEvent({
          type: 'logout',
          userId: sessionInfo.userId,
          ip: sessionInfo.ipAddress,
          userAgent: sessionInfo.deviceFingerprint.userAgent,
          riskScore: 10,
          details: {
            sessionId,
            reason,
            duration: Date.now() - sessionInfo.createdAt.getTime()
          }
        });

        // Remove from user sessions
        const userSessionsKey = `user_sessions:${sessionInfo.userId}`;
        await this.redis.srem(userSessionsKey, sessionId);
      }

      // Remove session
      const sessionKey = `session_info:${sessionId}`;
      await this.redis.del(sessionKey);

    } catch (error) {
      console.error('Failed to terminate session:', error);
    }
  }

  /**
   * Generate device fingerprint
   */
  private generateDeviceFingerprint(request: FastifyRequest): DeviceFingerprint {
    const userAgent = request.headers['user-agent'] || '';
    const acceptLanguage = request.headers['accept-language'] || '';
    const acceptEncoding = request.headers['accept-encoding'] || '';
    
    // Create fingerprint hash
    const fingerprintString = `${userAgent}|${acceptLanguage}|${acceptEncoding}`;
    const hash = createHash('sha256').update(fingerprintString).digest('hex').substring(0, 16);

    return {
      hash,
      userAgent,
      language: acceptLanguage.split(',')[0],
      platform: this.extractPlatform(userAgent)
    };
  }

  /**
   * Extract platform from user agent
   */
  private extractPlatform(userAgent: string): string {
    const platforms = {
      'Windows': /Windows/i,
      'macOS': /Macintosh|Mac OS/i,
      'Linux': /Linux/i,
      'iOS': /iPhone|iPad|iPod/i,
      'Android': /Android/i
    };

    for (const [platform, regex] of Object.entries(platforms)) {
      if (regex.test(userAgent)) {
        return platform;
      }
    }

    return 'Unknown';
  }

  /**
   * Calculate session risk score
   */
  private async calculateSessionRiskScore(userId: string, request: FastifyRequest): Promise<number> {
    let riskScore = 0;
    const userAgent = request.headers['user-agent'] || '';
    const ip = this.getClientIP(request);

    // Check for bot-like user agent
    if (this.BOT_USER_AGENTS.some(pattern => pattern.test(userAgent))) {
      riskScore += 30;
    }

    // Check for unusual user agent
    if (this.SUSPICIOUS_PATTERNS.unusualUserAgents.test(userAgent)) {
      riskScore += 40;
    }

    // Check recent failed login attempts
    try {
      const failedAttemptsKey = `failed_login_attempts:${ip}`;
      const failedAttempts = await this.redis.get(failedAttemptsKey);
      if (failedAttempts && parseInt(failedAttempts) > 0) {
        riskScore += parseInt(failedAttempts) * 10;
      }
    } catch (error) {
      console.warn('Failed to check failed login attempts:', error);
    }

    // Check for multiple recent IPs for this user
    try {
      const recentIPsKey = `recent_ips:${userId}`;
      const recentIPsCount = await this.redis.scard(recentIPsKey);
      if (recentIPsCount > 3) {
        riskScore += (recentIPsCount - 3) * 15;
      }
      
      // Add current IP to recent IPs
      await this.redis.sadd(recentIPsKey, ip);
      await this.redis.expire(recentIPsKey, 24 * 60 * 60); // 24 hours
    } catch (error) {
      console.warn('Failed to check recent IPs:', error);
    }

    return Math.min(100, riskScore);
  }

  /**
   * Detect suspicious activity
   */
  private async detectSuspiciousActivity(userId: string, sessionInfo: SessionInfo): Promise<string[]> {
    const flags: string[] = [];

    try {
      // Check for unusual login time
      const hour = new Date().getHours();
      if (hour >= this.SUSPICIOUS_PATTERNS.unusualHours.start && hour <= this.SUSPICIOUS_PATTERNS.unusualHours.end) {
        flags.push('unusual_time');
      }

      // Check for high-risk geolocation
      if (sessionInfo.location) {
        // Add logic to check against known high-risk countries
        const highRiskCountries = ['XX', 'YY']; // Placeholder
        if (highRiskCountries.includes(sessionInfo.location.country || '')) {
          flags.push('high_risk_location');
        }
      }

      // Check for too many concurrent sessions
      const userSessions = await this.getUserSessions(userId);
      if (userSessions.length > 5) {
        flags.push('many_concurrent_sessions');
      }

      // Check for rapid session creation
      const recentSessionsKey = `recent_sessions:${userId}`;
      const recentSessions = await this.redis.incr(recentSessionsKey);
      if (recentSessions === 1) {
        await this.redis.expire(recentSessionsKey, 300); // 5 minutes
      }
      if (recentSessions > 3) {
        flags.push('rapid_session_creation');
      }

    } catch (error) {
      console.warn('Failed to detect suspicious activity:', error);
    }

    return flags;
  }

  /**
   * Analyze threat level and take action
   */
  private async analyzeThreatLevel(event: SecurityEvent): Promise<void> {
    try {
      if (event.riskScore >= this.HIGH_RISK_SCORE_THRESHOLD) {
        // High-risk event detected
        console.warn(`High-risk security event detected:`, event);

        if (event.userId) {
          // Check for pattern of high-risk events
          const highRiskEventsKey = `high_risk_events:${event.userId}`;
          const highRiskCount = await this.redis.incr(highRiskEventsKey);
          await this.redis.expire(highRiskEventsKey, 60 * 60); // 1 hour

          if (highRiskCount >= 3) {
            // Automatic account protection
            await this.triggerAccountProtection(event.userId, 'multiple_high_risk_events');
          }
        }

        // Rate limit the IP for suspicious activity
        if (event.riskScore >= 90) {
          const suspiciousIPKey = `suspicious_ip:${event.ip}`;
          await this.redis.setex(suspiciousIPKey, 60 * 60, 'blocked'); // 1 hour block
        }
      }

    } catch (error) {
      console.error('Failed to analyze threat level:', error);
    }
  }

  /**
   * Trigger account protection measures
   */
  private async triggerAccountProtection(userId: string, reason: string): Promise<void> {
    try {
      console.warn(`Triggering account protection for user ${userId}: ${reason}`);

      // Invalidate all sessions
      const userSessions = await this.getUserSessions(userId);
      for (const session of userSessions) {
        await this.terminateSession(session.id, 'security_protection');
      }

      // Log the protection action
      await this.logSecurityEvent({
        type: 'account_lockout',
        userId,
        ip: '0.0.0.0',
        userAgent: 'system',
        riskScore: 100,
        details: {
          reason,
          sessionsTerminated: userSessions.length,
          timestamp: new Date().toISOString()
        }
      });

      // TODO: Send security alert email to user

    } catch (error) {
      console.error('Failed to trigger account protection:', error);
    }
  }

  /**
   * Enforce concurrent session limits
   */
  private async enforceConcurrentSessionLimits(userId: string): Promise<void> {
    try {
      const userSessions = await this.getUserSessions(userId);
      
      if (userSessions.length > this.MAX_CONCURRENT_SESSIONS) {
        // Sort by last activity (oldest first)
        const sortedSessions = userSessions.sort((a, b) => a.lastActivity.getTime() - b.lastActivity.getTime());
        
        // Terminate oldest sessions
        const sessionsToTerminate = sortedSessions.slice(0, sortedSessions.length - this.MAX_CONCURRENT_SESSIONS);
        
        for (const session of sessionsToTerminate) {
          await this.terminateSession(session.id, 'concurrent_session_limit');
        }

        console.log(`Terminated ${sessionsToTerminate.length} oldest sessions for user ${userId} due to concurrent session limit`);
      }

    } catch (error) {
      console.error('Failed to enforce concurrent session limits:', error);
    }
  }

  /**
   * Update user risk score
   */
  private async updateUserRiskScore(userId: string, eventRiskScore: number): Promise<void> {
    try {
      const userRiskKey = `user_risk_score:${userId}`;
      const currentScore = await this.redis.get(userRiskKey);
      const current = currentScore ? parseInt(currentScore) : 0;
      
      // Use weighted average with decay over time
      const newScore = Math.min(100, Math.round((current * 0.8) + (eventRiskScore * 0.2)));
      
      await this.redis.setex(userRiskKey, 7 * 24 * 60 * 60, newScore.toString()); // 7 days

    } catch (error) {
      console.error('Failed to update user risk score:', error);
    }
  }

  /**
   * Get location from IP (placeholder - implement with actual IP geolocation service)
   */
  private async getLocationFromIP(ip: string): Promise<{ country?: string; region?: string; city?: string } | undefined> {
    try {
      // TODO: Integrate with IP geolocation service (e.g., MaxMind, IPInfo)
      // This is a placeholder implementation
      
      // Skip private/local IPs
      if (ip === '127.0.0.1' || ip === 'localhost' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
        return { country: 'Local', region: 'Local', city: 'Local' };
      }

      return undefined;

    } catch (error) {
      console.warn('Failed to get location from IP:', error);
      return undefined;
    }
  }

  /**
   * Get client IP address
   */
  private getClientIP(request: FastifyRequest): string {
    const forwarded = request.headers['x-forwarded-for'] as string;
    const realIP = request.headers['x-real-ip'] as string;
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIP) {
      return realIP;
    }
    
    return request.ip || 'unknown';
  }

  /**
   * Setup background cleanup tasks
   */
  private setupBackgroundTasks(): void {
    // Clean up expired events and sessions every hour
    setInterval(async () => {
      try {
        // This would include cleanup logic for expired Redis keys
        console.log('🧹 Running security monitoring cleanup tasks');
        
        // Clean up expired security events
        const eventKeys = await this.redis.keys('security_event:*');
        let cleanedCount = 0;
        
        for (const key of eventKeys) {
          const ttl = await this.redis.ttl(key);
          if (ttl <= 0) {
            await this.redis.del(key);
            cleanedCount++;
          }
        }
        
        if (cleanedCount > 0) {
          console.log(`🧹 Cleaned up ${cleanedCount} expired security events`);
        }
        
      } catch (error) {
        console.error('Security monitoring cleanup failed:', error);
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Get security statistics
   */
  async getSecurityStats(): Promise<{
    recentEvents: number;
    highRiskEvents: number;
    activeSessions: number;
    suspiciousIPs: number;
  }> {
    try {
      const [eventKeys, suspiciousIPKeys, sessionKeys] = await Promise.all([
        this.redis.keys('security_event:*'),
        this.redis.keys('suspicious_ip:*'),
        this.redis.keys('session_info:*')
      ]);

      // Count high-risk events from the last hour
      let highRiskEvents = 0;
      for (const eventKey of eventKeys) {
        try {
          const eventData = await this.redis.get(eventKey);
          if (eventData) {
            const event: SecurityEvent = JSON.parse(eventData);
            if (event.riskScore >= this.HIGH_RISK_SCORE_THRESHOLD && 
                Date.now() - event.timestamp.getTime() < 60 * 60 * 1000) {
              highRiskEvents++;
            }
          }
        } catch (error) {
          console.warn('Failed to parse security event:', error);
        }
      }

      return {
        recentEvents: eventKeys.length,
        highRiskEvents,
        activeSessions: sessionKeys.length,
        suspiciousIPs: suspiciousIPKeys.length
      };

    } catch (error) {
      console.error('Failed to get security stats:', error);
      return {
        recentEvents: 0,
        highRiskEvents: 0,
        activeSessions: 0,
        suspiciousIPs: 0
      };
    }
  }
}

/**
 * Create security monitoring service instance
 */
export function createSecurityMonitoringService(redis: Redis): SecurityMonitoringService {
  return new SecurityMonitoringService(redis);
}