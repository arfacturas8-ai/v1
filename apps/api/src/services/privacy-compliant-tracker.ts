import { prisma } from '@cryb/database';
import { logger } from '../utils/logger';
import { createHash, randomBytes } from 'crypto';
import EventEmitter from 'events';
import { Queue } from 'bullmq';

interface UserConsent {
  userId: string;
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
  performance: boolean;
  consentTimestamp: Date;
  consentVersion: string;
  ipHash: string;
  userAgent?: string;
}

interface TrackingEvent {
  type: 'page_view' | 'interaction' | 'search' | 'message_sent' | 'voice_activity' | 'custom';
  userId?: string;
  sessionId: string;
  anonymousId?: string;
  metadata?: any;
  timestamp: Date;
  requiresConsent: 'analytics' | 'functional' | 'marketing' | 'performance' | 'none';
}

interface UserSession {
  sessionId: string;
  userId?: string;
  anonymousId: string;
  startTime: Date;
  lastActivity: Date;
  ipHash: string;
  userAgent: string;
  consentStatus: UserConsent | null;
  events: TrackingEvent[];
  isActive: boolean;
}

interface PrivacySettings {
  dataRetentionDays: number;
  anonymizationDelay: number; // Days after which to anonymize data
  consentVersion: string;
  allowAnonymousTracking: boolean;
  requireExplicitConsent: boolean;
  cookiePolicy: {
    essential: boolean;
    functional: boolean;
    analytics: boolean;
    marketing: boolean;
  };
}

interface GDPRRequest {
  userId: string;
  requestType: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction';
  requestData?: any;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  createdAt: Date;
  completedAt?: Date;
  requestId: string;
}

export class PrivacyCompliantTracker extends EventEmitter {
  private sessions = new Map<string, UserSession>();
  private consentCache = new Map<string, UserConsent>();
  private queue: Queue;
  private settings: PrivacySettings = {
    dataRetentionDays: 365,
    anonymizationDelay: 30,
    consentVersion: '1.0',
    allowAnonymousTracking: true,
    requireExplicitConsent: true,
    cookiePolicy: {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false
    }
  };

  constructor(queue: Queue) {
    super();
    this.queue = queue;
    this.startCleanupTasks();
    this.setupEventHandlers();

    logger.info('Privacy-compliant tracker initialized', {
      consentVersion: this.settings.consentVersion,
      dataRetentionDays: this.settings.dataRetentionDays
    });
  }

  /**
   * Initialize or update user session
   */
  async initializeSession(
    sessionId: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<UserSession> {
    try {
      const ipHash = ipAddress ? this.hashIP(ipAddress) : 'unknown';
      const anonymousId = this.generateAnonymousId();

      let session = this.sessions.get(sessionId);
      
      if (!session) {
        session = {
          sessionId,
          userId,
          anonymousId,
          startTime: new Date(),
          lastActivity: new Date(),
          ipHash,
          userAgent: userAgent || 'unknown',
          consentStatus: null,
          events: [],
          isActive: true
        };

        this.sessions.set(sessionId, session);
      } else {
        // Update existing session
        session.userId = userId || session.userId;
        session.lastActivity = new Date();
        session.isActive = true;
      }

      // Load user consent if available
      if (userId) {
        session.consentStatus = await this.getUserConsent(userId);
      }

      logger.debug('Session initialized', {
        sessionId,
        userId,
        hasConsent: !!session.consentStatus
      });

      return session;
    } catch (error) {
      logger.error('Failed to initialize session:', error);
      throw error;
    }
  }

  /**
   * Record user consent with GDPR compliance
   */
  async recordConsent(
    userId: string,
    consent: {
      analytics: boolean;
      functional: boolean;
      marketing: boolean;
      performance: boolean;
    },
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const consentRecord: UserConsent = {
        userId,
        ...consent,
        consentTimestamp: new Date(),
        consentVersion: this.settings.consentVersion,
        ipHash: ipAddress ? this.hashIP(ipAddress) : 'unknown',
        userAgent: userAgent?.substring(0, 200)
      };

      // Store in database
      await prisma.userConsent.upsert({
        where: { userId },
        update: {
          analytics: consent.analytics,
          functional: consent.functional,
          marketing: consent.marketing,
          performance: consent.performance,
          consentTimestamp: consentRecord.consentTimestamp,
          consentVersion: consentRecord.consentVersion,
          ipHash: consentRecord.ipHash,
          userAgent: consentRecord.userAgent
        },
        create: {
          userId,
          analytics: consent.analytics,
          functional: consent.functional,
          marketing: consent.marketing,
          performance: consent.performance,
          consentTimestamp: consentRecord.consentTimestamp,
          consentVersion: consentRecord.consentVersion,
          ipHash: consentRecord.ipHash,
          userAgent: consentRecord.userAgent
        }
      });

      // Update cache
      this.consentCache.set(userId, consentRecord);

      // Update active sessions
      this.sessions.forEach(session => {
        if (session.userId === userId) {
          session.consentStatus = consentRecord;
        }
      });

      logger.info('User consent recorded', {
        userId,
        consent,
        consentVersion: this.settings.consentVersion
      });

      this.emit('consent_recorded', { userId, consent });
    } catch (error) {
      logger.error('Failed to record consent:', error);
      throw error;
    }
  }

  /**
   * Track user activity with consent checking
   */
  async trackActivity(
    sessionId: string,
    event: Omit<TrackingEvent, 'sessionId' | 'timestamp'>
  ): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        logger.warn('Attempted to track activity for unknown session', { sessionId });
        return;
      }

      const fullEvent: TrackingEvent = {
        ...event,
        sessionId,
        timestamp: new Date()
      };

      // Check consent requirements
      if (!this.hasRequiredConsent(session, fullEvent)) {
        logger.debug('Event blocked due to insufficient consent', {
          sessionId,
          eventType: event.type,
          requiredConsent: event.requiresConsent
        });
        return;
      }

      // Add to session events
      session.events.push(fullEvent);
      session.lastActivity = new Date();

      // Prevent session event buffer from growing too large
      if (session.events.length > 100) {
        session.events = session.events.slice(-100);
      }

      // Queue for processing
      await this.queue.add('process-tracking-event', {
        sessionId,
        event: fullEvent,
        consent: session.consentStatus
      }, {
        attempts: 3,
        backoff: 'exponential',
        removeOnComplete: 10,
        removeOnFail: 5
      });

      logger.debug('Activity tracked', {
        sessionId,
        eventType: event.type,
        userId: event.userId
      });

      this.emit('activity_tracked', fullEvent);
    } catch (error) {
      logger.error('Failed to track activity:', error);
      // Don't throw - tracking should never break the main application
    }
  }

  /**
   * Handle GDPR data requests
   */
  async handleGDPRRequest(
    userId: string,
    requestType: GDPRRequest['requestType'],
    requestData?: any
  ): Promise<string> {
    try {
      const requestId = randomBytes(16).toString('hex');
      
      const gdprRequest: GDPRRequest = {
        userId,
        requestType,
        requestData,
        status: 'pending',
        createdAt: new Date(),
        requestId
      };

      // Store request in database
      await prisma.gdprRequest.create({
        data: {
          userId,
          requestType,
          requestData: requestData ? JSON.stringify(requestData) : null,
          status: 'pending',
          requestId,
          createdAt: gdprRequest.createdAt
        }
      });

      // Queue for processing
      await this.queue.add('process-gdpr-request', gdprRequest, {
        attempts: 3,
        backoff: 'exponential',
        delay: 5000 // Small delay to allow for immediate requests
      });

      logger.info('GDPR request submitted', {
        userId,
        requestType,
        requestId
      });

      this.emit('gdpr_request_submitted', gdprRequest);
      return requestId;
    } catch (error) {
      logger.error('Failed to handle GDPR request:', error);
      throw error;
    }
  }

  /**
   * Process data access request
   */
  async processDataAccessRequest(userId: string): Promise<any> {
    try {
      const userData = await this.collectUserData(userId);
      
      logger.info('Data access request processed', { userId });
      return userData;
    } catch (error) {
      logger.error('Failed to process data access request:', error);
      throw error;
    }
  }

  /**
   * Process data erasure request (Right to be forgotten)
   */
  async processDataErasureRequest(userId: string): Promise<void> {
    try {
      // Anonymize or delete user data
      await this.anonymizeUserData(userId);
      
      // Remove from caches
      this.consentCache.delete(userId);
      
      // Update active sessions
      this.sessions.forEach(session => {
        if (session.userId === userId) {
          session.userId = undefined;
          session.consentStatus = null;
        }
      });

      logger.info('Data erasure request processed', { userId });
      this.emit('data_erased', { userId });
    } catch (error) {
      logger.error('Failed to process data erasure request:', error);
      throw error;
    }
  }

  /**
   * Get user consent status
   */
  async getUserConsent(userId: string): Promise<UserConsent | null> {
    try {
      // Check cache first
      const cached = this.consentCache.get(userId);
      if (cached) {
        return cached;
      }

      // Fetch from database
      const consent = await prisma.userConsent.findUnique({
        where: { userId }
      });

      if (consent) {
        const consentRecord: UserConsent = {
          userId: consent.userId,
          analytics: consent.analytics,
          functional: consent.functional,
          marketing: consent.marketing,
          performance: consent.performance,
          consentTimestamp: consent.consentTimestamp,
          consentVersion: consent.consentVersion,
          ipHash: consent.ipHash,
          userAgent: consent.userAgent
        };

        this.consentCache.set(userId, consentRecord);
        return consentRecord;
      }

      return null;
    } catch (error) {
      logger.error('Failed to get user consent:', error);
      return null;
    }
  }

  /**
   * Get anonymized analytics data
   */
  async getAnonymizedAnalytics(filters: {
    startDate?: Date;
    endDate?: Date;
    eventTypes?: string[];
  } = {}): Promise<any> {
    try {
      // This would query anonymized analytics data
      // Implementation depends on your analytics schema
      const analytics = {
        totalEvents: 0,
        uniqueSessions: 0,
        eventBreakdown: {},
        timeSeriesData: []
      };

      logger.debug('Anonymized analytics retrieved', filters);
      return analytics;
    } catch (error) {
      logger.error('Failed to get anonymized analytics:', error);
      return null;
    }
  }

  /**
   * Privacy utility methods
   */
  private hasRequiredConsent(session: UserSession, event: TrackingEvent): boolean {
    if (event.requiresConsent === 'none') {
      return true;
    }

    if (!session.consentStatus && this.settings.requireExplicitConsent) {
      return false;
    }

    if (!session.consentStatus && this.settings.allowAnonymousTracking) {
      // Allow anonymous tracking for non-personal events
      return !event.userId;
    }

    if (!session.consentStatus) {
      return false;
    }

    switch (event.requiresConsent) {
      case 'analytics':
        return session.consentStatus.analytics;
      case 'functional':
        return session.consentStatus.functional;
      case 'marketing':
        return session.consentStatus.marketing;
      case 'performance':
        return session.consentStatus.performance;
      default:
        return false;
    }
  }

  private hashIP(ip: string): string {
    return createHash('sha256').update(ip + 'salt').digest('hex').substring(0, 16);
  }

  private generateAnonymousId(): string {
    return randomBytes(16).toString('hex');
  }

  private async collectUserData(userId: string): Promise<any> {
    try {
      // Collect all user data for GDPR access request
      const userData = {
        personalInfo: await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
            createdAt: true,
            lastSeenAt: true
          }
        }),
        consent: await this.getUserConsent(userId),
        messages: await prisma.message.findMany({
          where: { userId },
          select: {
            id: true,
            content: true,
            createdAt: true,
            channelId: true
          },
          orderBy: { createdAt: 'desc' },
          take: 1000 // Limit for performance
        }),
        voiceActivity: await prisma.voiceAnalytics.findMany({
          where: { userId },
          select: {
            timestamp: true,
            sessionDuration: true,
            serverId: true,
            channelId: true
          },
          orderBy: { timestamp: 'desc' },
          take: 100
        }),
        messageAnalytics: await prisma.messageAnalytics.findMany({
          where: { userId },
          select: {
            timestamp: true,
            messageCount: true,
            characterCount: true,
            serverId: true,
            channelId: true
          },
          orderBy: { timestamp: 'desc' },
          take: 100
        })
      };

      return userData;
    } catch (error) {
      logger.error('Failed to collect user data:', error);
      throw error;
    }
  }

  private async anonymizeUserData(userId: string): Promise<void> {
    try {
      // Start transaction for data anonymization
      await prisma.$transaction(async (tx) => {
        // Anonymize messages (keep content but remove user association)
        await tx.message.updateMany({
          where: { userId },
          data: { userId: null }
        });

        // Delete personal analytics but keep anonymized aggregates
        await tx.messageAnalytics.deleteMany({
          where: { userId }
        });

        await tx.voiceAnalytics.deleteMany({
          where: { userId }
        });

        // Delete consent record
        await tx.userConsent.deleteMany({
          where: { userId }
        });

        // Delete GDPR requests
        await tx.gdprRequest.deleteMany({
          where: { userId }
        });

        // Mark user as anonymized rather than deleting (for referential integrity)
        await tx.user.update({
          where: { id: userId },
          data: {
            email: null,
            username: `anonymized_${randomBytes(8).toString('hex')}`,
            displayName: 'Anonymized User',
            avatar: null,
            isDeleted: true
          }
        });
      });

      logger.info('User data anonymized successfully', { userId });
    } catch (error) {
      logger.error('Failed to anonymize user data:', error);
      throw error;
    }
  }

  private setupEventHandlers(): void {
    this.queue.on('completed', (job) => {
      if (job.name === 'process-gdpr-request') {
        logger.debug('GDPR request processed', { jobId: job.id });
      }
    });

    this.queue.on('failed', (job, err) => {
      logger.error('Privacy queue job failed:', {
        jobId: job.id,
        jobName: job.name,
        error: err.message
      });
    });
  }

  private startCleanupTasks(): void {
    // Clean up old sessions every hour
    setInterval(() => {
      this.cleanupOldSessions();
    }, 60 * 60 * 1000);

    // Clean up old data according to retention policy daily
    setInterval(() => {
      this.cleanupOldData();
    }, 24 * 60 * 60 * 1000);
  }

  private cleanupOldSessions(): void {
    const now = new Date();
    const expiredSessions = [];

    this.sessions.forEach((session, sessionId) => {
      const inactiveDuration = now.getTime() - session.lastActivity.getTime();
      const maxInactivity = 30 * 60 * 1000; // 30 minutes

      if (inactiveDuration > maxInactivity) {
        expiredSessions.push(sessionId);
      }
    });

    expiredSessions.forEach(sessionId => {
      this.sessions.delete(sessionId);
    });

    if (expiredSessions.length > 0) {
      logger.debug('Cleaned up expired sessions', { count: expiredSessions.length });
    }
  }

  private async cleanupOldData(): Promise<void> {
    try {
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() - this.settings.dataRetentionDays);

      // Clean up old anonymized data
      const deletedCount = await prisma.gdprRequest.deleteMany({
        where: {
          createdAt: { lt: retentionDate },
          status: 'completed'
        }
      });

      logger.info('Old data cleaned up', {
        deletedRequests: deletedCount.count,
        retentionDate: retentionDate.toISOString()
      });
    } catch (error) {
      logger.error('Failed to cleanup old data:', error);
    }
  }

  /**
   * Get privacy compliance status
   */
  getComplianceStatus(): {
    consentRecords: number;
    activeSessions: number;
    pendingGDPRRequests: number;
    dataRetentionDays: number;
    settings: PrivacySettings;
  } {
    return {
      consentRecords: this.consentCache.size,
      activeSessions: this.sessions.size,
      pendingGDPRRequests: 0, // Would need async call
      dataRetentionDays: this.settings.dataRetentionDays,
      settings: { ...this.settings }
    };
  }

  /**
   * Update privacy settings
   */
  updateSettings(newSettings: Partial<PrivacySettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    logger.info('Privacy settings updated', newSettings);
    this.emit('settings_updated', this.settings);
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.sessions.clear();
    this.consentCache.clear();
    logger.info('Privacy-compliant tracker cleaned up');
  }
}