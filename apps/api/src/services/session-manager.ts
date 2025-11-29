import Redis from 'ioredis';
import { randomBytes } from 'crypto';

export interface Session {
  id: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  lastActivity: Date;
  ipAddress?: string;
  userAgent?: string;
  data?: Record<string, any>;
}

export class SessionManager {
  private redis: Redis;
  private sessionTTL = 86400; // 24 hours default
  private activityUpdateInterval = 300; // Update activity every 5 minutes

  constructor(redis: Redis, ttl?: number) {
    this.redis = redis;
    if (ttl) this.sessionTTL = ttl;
  }

  async createSession(userId: string, metadata?: { ipAddress?: string; userAgent?: string }): Promise<Session> {
    const sessionId = randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.sessionTTL * 1000);

    const session: Session = {
      id: sessionId,
      userId,
      createdAt: now,
      expiresAt,
      lastActivity: now,
      ...metadata
    };

    // Store in Redis
    await this.redis.setex(
      'session:' + sessionId,
      this.sessionTTL,
      JSON.stringify(session)
    );

    // Track user sessions
    await this.redis.sadd('user:sessions:' + userId, sessionId);
    await this.redis.expire('user:sessions:' + userId, this.sessionTTL);

    return session;
  }

  async getSession(sessionId: string): Promise<Session | null> {
    const data = await this.redis.get('session:' + sessionId);
    if (!data) return null;

    const session = JSON.parse(data);
    
    // Check if expired
    if (new Date(session.expiresAt) < new Date()) {
      await this.destroySession(sessionId);
      return null;
    }

    return session;
  }

  async updateActivity(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) return false;

    // Only update if more than activityUpdateInterval has passed
    const lastUpdate = new Date(session.lastActivity);
    const now = new Date();
    
    if (now.getTime() - lastUpdate.getTime() < this.activityUpdateInterval * 1000) {
      return true; // Skip update but return success
    }

    session.lastActivity = now;
    
    // Extend session TTL
    await this.redis.setex(
      'session:' + sessionId,
      this.sessionTTL,
      JSON.stringify(session)
    );

    return true;
  }

  async destroySession(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) return false;

    // Remove session
    await this.redis.del('session:' + sessionId);
    
    // Remove from user's sessions
    await this.redis.srem('user:sessions:' + session.userId, sessionId);

    return true;
  }

  async getUserSessions(userId: string): Promise<Session[]> {
    const sessionIds = await this.redis.smembers('user:sessions:' + userId);
    const sessions: Session[] = [];

    for (const sessionId of sessionIds) {
      const session = await this.getSession(sessionId);
      if (session) {
        sessions.push(session);
      }
    }

    return sessions;
  }

  async destroyAllUserSessions(userId: string): Promise<number> {
    const sessionIds = await this.redis.smembers('user:sessions:' + userId);
    let destroyed = 0;

    for (const sessionId of sessionIds) {
      if (await this.destroySession(sessionId)) {
        destroyed++;
      }
    }

    await this.redis.del('user:sessions:' + userId);
    return destroyed;
  }

  async getActiveSessions(): Promise<number> {
    const keys = await this.redis.keys('session:*');
    return keys.length;
  }

  async cleanupExpiredSessions(): Promise<number> {
    const keys = await this.redis.keys('session:*');
    let cleaned = 0;

    for (const key of keys) {
      const sessionId = key.replace('session:', '');
      const session = await this.getSession(sessionId);
      
      if (!session) {
        cleaned++;
      }
    }

    return cleaned;
  }
}