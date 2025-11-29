import crypto from 'crypto';
import { Redis } from 'ioredis';
import { prisma } from '@cryb/database';
import { AUTH_CONSTANTS } from '../models/auth-models';
import logger from '../utils/logger';

export interface SessionData {
  user_id: string;
  session_id: string;
  device_fingerprint?: string;
  ip_address: string;
  user_agent: string;
  location?: any;
  created_at: Date;
  last_activity: Date;
  expires_at: Date;
  is_active: boolean;
  metadata?: Record<string, any>;
}

export interface DeviceInfo {
  fingerprint: string;
  name: string;
  type: 'mobile' | 'desktop' | 'tablet' | 'unknown';
  browser: string;
  os: string;
  is_trusted: boolean;
  first_seen: Date;
  last_seen: Date;
}

export interface SessionActivity {
  timestamp: Date;
  action: string;
  ip_address: string;
  details?: any;
}

export interface SessionSecurity {
  risk_score: number;
  anomalies: string[];
  warnings: string[];
  is_suspicious: boolean;
}

export class SessionManagementService {
  private redis: Redis;
  private readonly SESSION_PREFIX = 'session:';
  private readonly DEVICE_PREFIX = 'device:';
  private readonly ACTIVITY_PREFIX = 'activity:';
  private readonly SECURITY_PREFIX = 'security:';
  private readonly GEO_PREFIX = 'geo:';

  constructor(redis: Redis) {
    this.redis = redis;
  }

  /**
   * Create a new session
   */
  async createSession(sessionData: Omit<SessionData, 'session_id' | 'created_at' | 'last_activity'>): Promise<SessionData> {
    try {
      const sessionId = crypto.randomUUID();
      const now = new Date();

      const session: SessionData = {
        ...sessionData,
        session_id: sessionId,
        created_at: now,
        last_activity: now,
        is_active: true
      };

      // Store session in Redis
      const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
      const sessionTTL = Math.floor((session.expires_at.getTime() - now.getTime()) / 1000);

      await this.redis.setex(
        sessionKey,
        sessionTTL,
        JSON.stringify(this.serializeSession(session))
      );

      // Store session in database for persistence
      await prisma.userSession.create({
        data: {
          user_id: session.user_id,
          session_token: sessionId,
          refresh_token: '', // Will be set by JWT service
          refresh_token_version: 1,
          device_fingerprint: session.device_fingerprint,
          ip_address: session.ip_address,
          user_agent: session.user_agent,
          location: session.location,
          expires_at: session.expires_at,
          is_active: session.is_active
        }
      });

      // Index session by user
      await this.indexSessionByUser(session.user_id, sessionId);

      // Track device information
      if (session.device_fingerprint) {
        await this.updateDeviceInfo(session.user_id, session.device_fingerprint, {
          user_agent: session.user_agent,
          ip_address: session.ip_address
        });
      }

      // Log session creation
      await this.logSessionActivity(sessionId, 'session_created', {
        ip_address: session.ip_address,
        user_agent: session.user_agent
      });

      logger.info(`Session created for user ${session.user_id}: ${sessionId}`);

      return session;

    } catch (error) {
      logger.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    try {
      const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
      const sessionDataRaw = await this.redis.get(sessionKey);

      if (!sessionDataRaw) {
        // Try to get from database
        const dbSession = await prisma.userSession.findUnique({
          where: { session_token: sessionId }
        });

        if (!dbSession || !dbSession.is_active || dbSession.expires_at < new Date()) {
          return null;
        }

        // Restore to Redis
        const session = this.deserializeDbSession(dbSession);
        const sessionTTL = Math.floor((session.expires_at.getTime() - Date.now()) / 1000);
        
        if (sessionTTL > 0) {
          await this.redis.setex(sessionKey, sessionTTL, JSON.stringify(this.serializeSession(session)));
        }

        return session;
      }

      const sessionData = JSON.parse(sessionDataRaw);
      return this.deserializeSession(sessionData);

    } catch (error) {
      logger.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(sessionId: string, activity: {
    ip_address?: string;
    user_agent?: string;
    action?: string;
    metadata?: any;
  }): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return;
      }

      // Update last activity
      session.last_activity = new Date();

      // Update IP and user agent if provided
      if (activity.ip_address) {
        session.ip_address = activity.ip_address;
      }
      if (activity.user_agent) {
        session.user_agent = activity.user_agent;
      }

      // Store updated session
      const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
      const sessionTTL = Math.floor((session.expires_at.getTime() - Date.now()) / 1000);

      if (sessionTTL > 0) {
        await this.redis.setex(sessionKey, sessionTTL, JSON.stringify(this.serializeSession(session)));
      }

      // Update database
      await prisma.userSession.update({
        where: { session_token: sessionId },
        data: {
          last_activity: session.last_activity,
          ip_address: session.ip_address,
          user_agent: session.user_agent
        }
      });

      // Log activity
      if (activity.action) {
        await this.logSessionActivity(sessionId, activity.action, {
          ip_address: session.ip_address,
          metadata: activity.metadata
        });
      }

    } catch (error) {
      logger.error('Error updating session activity:', error);
    }
  }

  /**
   * Invalidate session
   */
  async invalidateSession(sessionId: string, reason: string = 'logout'): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return;
      }

      // Remove from Redis
      await this.redis.del(`${this.SESSION_PREFIX}${sessionId}`);

      // Remove from user index
      await this.removeSessionFromUserIndex(session.user_id, sessionId);

      // Update database
      await prisma.userSession.update({
        where: { session_token: sessionId },
        data: { is_active: false }
      });

      // Log session termination
      await this.logSessionActivity(sessionId, 'session_terminated', {
        ip_address: session.ip_address,
        reason
      });

      // Clean up activity logs
      await this.cleanupSessionActivity(sessionId);

      logger.info(`Session invalidated: ${sessionId} (reason: ${reason})`);

    } catch (error) {
      logger.error('Error invalidating session:', error);
    }
  }

  /**
   * Invalidate all user sessions
   */
  async invalidateAllUserSessions(userId: string, reason: string = 'security_event'): Promise<number> {
    try {
      const sessionIds = await this.getUserSessionIds(userId);
      
      for (const sessionId of sessionIds) {
        await this.invalidateSession(sessionId, reason);
      }

      logger.info(`Invalidated ${sessionIds.length} sessions for user ${userId}`);
      return sessionIds.length;

    } catch (error) {
      logger.error('Error invalidating all user sessions:', error);
      return 0;
    }
  }

  /**
   * Get all active sessions for user
   */
  async getUserSessions(userId: string): Promise<SessionData[]> {
    try {
      const sessionIds = await this.getUserSessionIds(userId);
      const sessions: SessionData[] = [];

      for (const sessionId of sessionIds) {
        const session = await this.getSession(sessionId);
        if (session && session.is_active) {
          sessions.push(session);
        }
      }

      return sessions.sort((a, b) => b.last_activity.getTime() - a.last_activity.getTime());

    } catch (error) {
      logger.error('Error getting user sessions:', error);
      return [];
    }
  }

  /**
   * Analyze session security
   */
  async analyzeSessionSecurity(sessionId: string): Promise<SessionSecurity> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return {
          risk_score: 100,
          anomalies: ['session_not_found'],
          warnings: [],
          is_suspicious: true
        };
      }

      let riskScore = 0;
      const anomalies: string[] = [];
      const warnings: string[] = [];

      // Check session age
      const sessionAge = Date.now() - session.created_at.getTime();
      const maxSessionAge = 7 * 24 * 60 * 60 * 1000; // 7 days

      if (sessionAge > maxSessionAge) {
        riskScore += 20;
        warnings.push('session_too_old');
      }

      // Check inactivity
      const inactivityTime = Date.now() - session.last_activity.getTime();
      const maxInactivity = 24 * 60 * 60 * 1000; // 24 hours

      if (inactivityTime > maxInactivity) {
        riskScore += 15;
        warnings.push('long_inactivity');
      }

      // Check for IP changes
      const recentActivity = await this.getSessionActivity(sessionId, 10);
      const uniqueIPs = new Set(recentActivity.map(a => a.ip_address));

      if (uniqueIPs.size > 3) {
        riskScore += 30;
        anomalies.push('multiple_ip_addresses');
      }

      // Check for geographic anomalies
      const geoAnomalies = await this.detectGeographicAnomalies(sessionId);
      if (geoAnomalies.length > 0) {
        riskScore += 25;
        anomalies.push(...geoAnomalies);
      }

      // Check device consistency
      const deviceChanges = await this.detectDeviceChanges(sessionId);
      if (deviceChanges.length > 0) {
        riskScore += 20;
        anomalies.push(...deviceChanges);
      }

      return {
        risk_score: Math.min(riskScore, 100),
        anomalies,
        warnings,
        is_suspicious: riskScore > 50
      };

    } catch (error) {
      logger.error('Error analyzing session security:', error);
      return {
        risk_score: 100,
        anomalies: ['analysis_error'],
        warnings: [],
        is_suspicious: true
      };
    }
  }

  /**
   * Get device information for user
   */
  async getUserDevices(userId: string): Promise<DeviceInfo[]> {
    try {
      const deviceKey = `${this.DEVICE_PREFIX}${userId}`;
      const devicesData = await this.redis.hgetall(deviceKey);

      const devices: DeviceInfo[] = [];
      for (const [fingerprint, data] of Object.entries(devicesData)) {
        try {
          devices.push(JSON.parse(data));
        } catch (error) {
          logger.warn(`Invalid device data for ${fingerprint}:`, error);
        }
      }

      return devices.sort((a, b) => b.last_seen.getTime() - a.last_seen.getTime());

    } catch (error) {
      logger.error('Error getting user devices:', error);
      return [];
    }
  }

  /**
   * Trust a device
   */
  async trustDevice(userId: string, deviceFingerprint: string): Promise<void> {
    try {
      const deviceKey = `${this.DEVICE_PREFIX}${userId}`;
      const deviceData = await this.redis.hget(deviceKey, deviceFingerprint);

      if (deviceData) {
        const device = JSON.parse(deviceData);
        device.is_trusted = true;
        await this.redis.hset(deviceKey, deviceFingerprint, JSON.stringify(device));

        logger.info(`Device trusted for user ${userId}: ${deviceFingerprint}`);
      }

    } catch (error) {
      logger.error('Error trusting device:', error);
    }
  }

  /**
   * Revoke device trust
   */
  async revokeDeviceTrust(userId: string, deviceFingerprint: string): Promise<void> {
    try {
      const deviceKey = `${this.DEVICE_PREFIX}${userId}`;
      const deviceData = await this.redis.hget(deviceKey, deviceFingerprint);

      if (deviceData) {
        const device = JSON.parse(deviceData);
        device.is_trusted = false;
        await this.redis.hset(deviceKey, deviceFingerprint, JSON.stringify(device));

        // Invalidate sessions from this device
        const sessions = await this.getUserSessions(userId);
        for (const session of sessions) {
          if (session.device_fingerprint === deviceFingerprint) {
            await this.invalidateSession(session.session_id, 'device_trust_revoked');
          }
        }

        logger.info(`Device trust revoked for user ${userId}: ${deviceFingerprint}`);
      }

    } catch (error) {
      logger.error('Error revoking device trust:', error);
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      let cleanedCount = 0;

      // Clean up database sessions
      const expiredSessions = await prisma.userSession.findMany({
        where: {
          OR: [
            { expires_at: { lt: new Date() } },
            { is_active: false }
          ]
        },
        select: { session_token: true, user_id: true }
      });

      for (const session of expiredSessions) {
        await this.redis.del(`${this.SESSION_PREFIX}${session.session_token}`);
        await this.removeSessionFromUserIndex(session.user_id, session.session_token);
        await this.cleanupSessionActivity(session.session_token);
        cleanedCount++;
      }

      // Delete from database
      await prisma.userSession.deleteMany({
        where: {
          OR: [
            { expires_at: { lt: new Date() } },
            { is_active: false }
          ]
        }
      });

      logger.info(`Cleaned up ${cleanedCount} expired sessions`);
      return cleanedCount;

    } catch (error) {
      logger.error('Error cleaning up expired sessions:', error);
      return 0;
    }
  }

  /**
   * Private helper methods
   */

  private async indexSessionByUser(userId: string, sessionId: string): Promise<void> {
    const userSessionsKey = `user_sessions:${userId}`;
    await this.redis.sadd(userSessionsKey, sessionId);
    await this.redis.expire(userSessionsKey, 30 * 24 * 60 * 60); // 30 days
  }

  private async removeSessionFromUserIndex(userId: string, sessionId: string): Promise<void> {
    const userSessionsKey = `user_sessions:${userId}`;
    await this.redis.srem(userSessionsKey, sessionId);
  }

  private async getUserSessionIds(userId: string): Promise<string[]> {
    const userSessionsKey = `user_sessions:${userId}`;
    return await this.redis.smembers(userSessionsKey);
  }

  private async updateDeviceInfo(userId: string, fingerprint: string, info: {
    user_agent: string;
    ip_address: string;
  }): Promise<void> {
    try {
      const deviceKey = `${this.DEVICE_PREFIX}${userId}`;
      const existingData = await this.redis.hget(deviceKey, fingerprint);

      let device: DeviceInfo;
      const now = new Date();

      if (existingData) {
        device = JSON.parse(existingData);
        device.last_seen = now;
      } else {
        device = {
          fingerprint,
          name: this.generateDeviceName(info.user_agent),
          type: this.detectDeviceType(info.user_agent),
          browser: this.extractBrowser(info.user_agent),
          os: this.extractOS(info.user_agent),
          is_trusted: false,
          first_seen: now,
          last_seen: now
        };
      }

      await this.redis.hset(deviceKey, fingerprint, JSON.stringify(device));
      await this.redis.expire(deviceKey, 365 * 24 * 60 * 60); // 1 year

    } catch (error) {
      logger.error('Error updating device info:', error);
    }
  }

  private generateDeviceName(userAgent: string): string {
    const browser = this.extractBrowser(userAgent);
    const os = this.extractOS(userAgent);
    return `${browser} on ${os}`;
  }

  private detectDeviceType(userAgent: string): 'mobile' | 'desktop' | 'tablet' | 'unknown' {
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'tablet';
    } else if (ua.includes('desktop') || ua.includes('windows') || ua.includes('mac') || ua.includes('linux')) {
      return 'desktop';
    }
    return 'unknown';
  }

  private extractBrowser(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    if (ua.includes('chrome')) return 'Chrome';
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('safari')) return 'Safari';
    if (ua.includes('edge')) return 'Edge';
    if (ua.includes('opera')) return 'Opera';
    return 'Unknown';
  }

  private extractOS(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    if (ua.includes('windows')) return 'Windows';
    if (ua.includes('mac')) return 'macOS';
    if (ua.includes('linux')) return 'Linux';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
    return 'Unknown';
  }

  private async logSessionActivity(sessionId: string, action: string, details: any): Promise<void> {
    try {
      const activityKey = `${this.ACTIVITY_PREFIX}${sessionId}`;
      const activity: SessionActivity = {
        timestamp: new Date(),
        action,
        ip_address: details.ip_address || '0.0.0.0',
        details
      };

      await this.redis.lpush(activityKey, JSON.stringify(activity));
      await this.redis.ltrim(activityKey, 0, 99); // Keep last 100 activities
      await this.redis.expire(activityKey, 30 * 24 * 60 * 60); // 30 days

    } catch (error) {
      logger.error('Error logging session activity:', error);
    }
  }

  private async getSessionActivity(sessionId: string, limit: number = 10): Promise<SessionActivity[]> {
    try {
      const activityKey = `${this.ACTIVITY_PREFIX}${sessionId}`;
      const activities = await this.redis.lrange(activityKey, 0, limit - 1);

      return activities.map(a => JSON.parse(a));

    } catch (error) {
      logger.error('Error getting session activity:', error);
      return [];
    }
  }

  private async cleanupSessionActivity(sessionId: string): Promise<void> {
    const activityKey = `${this.ACTIVITY_PREFIX}${sessionId}`;
    await this.redis.del(activityKey);
  }

  private async detectGeographicAnomalies(sessionId: string): Promise<string[]> {
    // Mock implementation - in production, use real GeoIP service
    return [];
  }

  private async detectDeviceChanges(sessionId: string): Promise<string[]> {
    // Mock implementation - in production, implement device fingerprint analysis
    return [];
  }

  private serializeSession(session: SessionData): any {
    return {
      ...session,
      created_at: session.created_at.toISOString(),
      last_activity: session.last_activity.toISOString(),
      expires_at: session.expires_at.toISOString()
    };
  }

  private deserializeSession(data: any): SessionData {
    return {
      ...data,
      created_at: new Date(data.created_at),
      last_activity: new Date(data.last_activity),
      expires_at: new Date(data.expires_at)
    };
  }

  private deserializeDbSession(dbSession: any): SessionData {
    return {
      user_id: dbSession.user_id,
      session_id: dbSession.session_token,
      device_fingerprint: dbSession.device_fingerprint,
      ip_address: dbSession.ip_address,
      user_agent: dbSession.user_agent,
      location: dbSession.location,
      created_at: dbSession.created_at,
      last_activity: dbSession.last_activity,
      expires_at: dbSession.expires_at,
      is_active: dbSession.is_active,
      metadata: {}
    };
  }
}