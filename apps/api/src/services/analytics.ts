import { Queue } from 'bullmq';
import { prisma } from '@cryb/database';

export interface AnalyticsEvent {
  type: 'message_sent' | 'user_joined' | 'user_left' | 'voice_joined' | 'voice_left' | 'reaction_added' | 'custom';
  userId?: string;
  serverId?: string;
  channelId?: string;
  metadata?: any;
  timestamp?: Date;
}

export interface VoiceSessionMetrics {
  userId: string;
  serverId: string;
  channelId: string;
  sessionDuration: number; // in seconds
  timestamp: Date;
}

export interface MessageMetrics {
  serverId?: string;
  channelId: string;
  userId: string;
  messageCount: number;
  characterCount: number;
  wordCount: number;
  attachmentCount: number;
  mentionCount: number;
  reactionCount: number;
  timestamp: Date;
}

export class AnalyticsService {
  private queue: Queue;
  private eventCache: AnalyticsEvent[] = [];
  private flushInterval: NodeJS.Timeout;

  constructor(analyticsQueue: Queue) {
    this.queue = analyticsQueue;
    
    // Flush events to database every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flushEventCache();
    }, 30000);
  }

  /**
   * Track an analytics event
   */
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      // Add timestamp if not provided
      const eventWithTimestamp = {
        ...event,
        timestamp: event.timestamp || new Date()
      };

      // Add to cache for batch processing
      this.eventCache.push(eventWithTimestamp);

      // If cache is getting full, flush immediately
      if (this.eventCache.length >= 100) {
        await this.flushEventCache();
      }

      // Queue for real-time processing if needed
      if (event.type === 'voice_joined' || event.type === 'voice_left') {
        await this.queue.add('process-voice-event', eventWithTimestamp);
      }
    } catch (error) {
      console.error('Failed to track analytics event:', error);
    }
  }

  /**
   * Track message analytics
   */
  async trackMessage(messageData: {
    messageId: string;
    serverId?: string;
    channelId: string;
    userId: string;
    content: string;
    attachments: number;
    mentions: number;
  }): Promise<void> {
    const wordCount = messageData.content.trim().split(/\s+/).filter(word => word.length > 0).length;
    
    const metrics: MessageMetrics = {
      serverId: messageData.serverId,
      channelId: messageData.channelId,
      userId: messageData.userId,
      messageCount: 1,
      characterCount: messageData.content.length,
      wordCount,
      attachmentCount: messageData.attachments,
      mentionCount: messageData.mentions,
      reactionCount: 0,
      timestamp: new Date()
    };

    try {
      // Store in TimescaleDB optimized table
      await prisma.messageAnalytics.create({
        data: {
          serverId: metrics.serverId,
          channelId: metrics.channelId,
          userId: metrics.userId,
          messageCount: metrics.messageCount,
          characterCount: metrics.characterCount,
          wordCount: metrics.wordCount,
          attachmentCount: metrics.attachmentCount,
          mentionCount: metrics.mentionCount,
          reactionCount: metrics.reactionCount,
          timestamp: metrics.timestamp
        }
      });

      // Track general event
      await this.trackEvent({
        type: 'message_sent',
        userId: messageData.userId,
        serverId: messageData.serverId,
        channelId: messageData.channelId,
        metadata: {
          messageId: messageData.messageId,
          characterCount: metrics.characterCount,
          wordCount: metrics.wordCount
        }
      });
    } catch (error) {
      console.error('Failed to track message analytics:', error);
    }
  }

  /**
   * Track voice session
   */
  async trackVoiceSession(sessionData: VoiceSessionMetrics): Promise<void> {
    try {
      await prisma.voiceAnalytics.create({
        data: {
          serverId: sessionData.serverId,
          channelId: sessionData.channelId,
          userId: sessionData.userId,
          sessionDuration: sessionData.sessionDuration,
          timestamp: sessionData.timestamp
        }
      });

      await this.trackEvent({
        type: 'voice_left',
        userId: sessionData.userId,
        serverId: sessionData.serverId,
        channelId: sessionData.channelId,
        metadata: {
          duration: sessionData.sessionDuration
        }
      });
    } catch (error) {
      console.error('Failed to track voice session:', error);
    }
  }

  /**
   * Track LiveKit room events
   */
  async trackVoiceRoomStart(event: any): Promise<void> {
    await this.trackEvent({
      type: 'custom',
      metadata: {
        eventType: 'voice_room_started',
        roomName: event.room?.name,
        ...event
      }
    });
  }

  async trackVoiceRoomEnd(event: any): Promise<void> {
    await this.trackEvent({
      type: 'custom',
      metadata: {
        eventType: 'voice_room_ended',
        roomName: event.room?.name,
        duration: event.room?.duration,
        ...event
      }
    });
  }

  async trackParticipantJoin(event: any): Promise<void> {
    await this.trackEvent({
      type: 'voice_joined',
      userId: event.participant?.identity,
      metadata: {
        roomName: event.room?.name,
        participantName: event.participant?.name,
        ...event
      }
    });
  }

  async trackParticipantLeave(event: any): Promise<void> {
    await this.trackEvent({
      type: 'voice_left',
      userId: event.participant?.identity,
      metadata: {
        roomName: event.room?.name,
        participantName: event.participant?.name,
        duration: event.participant?.duration,
        ...event
      }
    });
  }

  /**
   * Get server analytics dashboard data
   */
  async getServerAnalytics(serverId: string, days: number = 7): Promise<any> {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const [messageStats, voiceStats, memberStats] = await Promise.all([
        this.getMessageAnalytics(serverId, since),
        this.getVoiceAnalytics(serverId, since),
        this.getMemberAnalytics(serverId, since)
      ]);

      return {
        period: {
          days,
          from: since.toISOString(),
          to: new Date().toISOString()
        },
        messages: messageStats,
        voice: voiceStats,
        members: memberStats,
        summary: {
          totalMessages: messageStats.totalMessages,
          totalVoiceMinutes: Math.round(voiceStats.totalMinutes),
          activeUsers: messageStats.activeUsers,
          mostActiveChannel: messageStats.mostActiveChannel
        }
      };
    } catch (error) {
      console.error('Failed to get server analytics:', error);
      return null;
    }
  }

  /**
   * Get message analytics
   */
  private async getMessageAnalytics(serverId: string, since: Date): Promise<any> {
    try {
      const messageData = await prisma.messageAnalytics.groupBy({
        by: ['channelId', 'userId'],
        where: {
          serverId,
          timestamp: { gte: since }
        },
        _sum: {
          messageCount: true,
          characterCount: true,
          wordCount: true,
          attachmentCount: true
        },
        _count: {
          id: true
        }
      });

      const totalMessages = messageData.reduce((sum, item) => sum + (item._sum.messageCount || 0), 0);
      const activeUsers = new Set(messageData.map(item => item.userId)).size;
      
      // Find most active channel
      const channelActivity = messageData.reduce((acc, item) => {
        acc[item.channelId] = (acc[item.channelId] || 0) + (item._sum.messageCount || 0);
        return acc;
      }, {} as { [key: string]: number });

      const mostActiveChannel = Object.entries(channelActivity)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || null;

      // Get hourly breakdown
      const hourlyData = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('hour', timestamp) as hour,
          SUM(message_count) as messages
        FROM "MessageAnalytics"
        WHERE server_id = ${serverId} AND timestamp >= ${since}
        GROUP BY hour
        ORDER BY hour
      `;

      return {
        totalMessages,
        activeUsers,
        mostActiveChannel,
        averageMessageLength: messageData.reduce((sum, item) => sum + (item._sum.characterCount || 0), 0) / totalMessages || 0,
        hourlyBreakdown: hourlyData,
        channelBreakdown: channelActivity
      };
    } catch (error) {
      console.error('Failed to get message analytics:', error);
      return { totalMessages: 0, activeUsers: 0 };
    }
  }

  /**
   * Get voice analytics
   */
  private async getVoiceAnalytics(serverId: string, since: Date): Promise<any> {
    try {
      const voiceData = await prisma.voiceAnalytics.groupBy({
        by: ['channelId', 'userId'],
        where: {
          serverId,
          timestamp: { gte: since }
        },
        _sum: {
          sessionDuration: true
        },
        _count: {
          id: true
        }
      });

      const totalMinutes = voiceData.reduce((sum, item) => sum + (item._sum.sessionDuration || 0), 0) / 60;
      const activeVoiceUsers = new Set(voiceData.map(item => item.userId)).size;

      return {
        totalMinutes,
        activeVoiceUsers,
        averageSessionDuration: voiceData.length > 0 ? (totalMinutes * 60) / voiceData.length : 0,
        channelBreakdown: voiceData.reduce((acc, item) => {
          acc[item.channelId] = ((acc[item.channelId] || 0) + (item._sum.sessionDuration || 0)) / 60;
          return acc;
        }, {} as { [key: string]: number })
      };
    } catch (error) {
      console.error('Failed to get voice analytics:', error);
      return { totalMinutes: 0, activeVoiceUsers: 0 };
    }
  }

  /**
   * Get member analytics
   */
  private async getMemberAnalytics(serverId: string, since: Date): Promise<any> {
    try {
      const totalMembers = await prisma.serverMember.count({
        where: { serverId }
      });

      const newMembers = await prisma.serverMember.count({
        where: {
          serverId,
          joinedAt: { gte: since }
        }
      });

      // Get retention data (members who joined and are still active)
      const activeMembers = await prisma.serverMember.count({
        where: {
          serverId,
          user: {
            lastSeenAt: { gte: since }
          }
        }
      });

      return {
        totalMembers,
        newMembers,
        activeMembers,
        retentionRate: totalMembers > 0 ? (activeMembers / totalMembers) * 100 : 0
      };
    } catch (error) {
      console.error('Failed to get member analytics:', error);
      return { totalMembers: 0, newMembers: 0, activeMembers: 0 };
    }
  }

  /**
   * Get user engagement metrics
   */
  async getUserEngagement(userId: string, days: number = 30): Promise<any> {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const [messageActivity, voiceActivity] = await Promise.all([
        prisma.messageAnalytics.groupBy({
          by: ['serverId'],
          where: {
            userId,
            timestamp: { gte: since }
          },
          _sum: {
            messageCount: true,
            characterCount: true
          }
        }),
        prisma.voiceAnalytics.groupBy({
          by: ['serverId'],
          where: {
            userId,
            timestamp: { gte: since }
          },
          _sum: {
            sessionDuration: true
          }
        })
      ]);

      return {
        totalMessages: messageActivity.reduce((sum, item) => sum + (item._sum.messageCount || 0), 0),
        totalCharacters: messageActivity.reduce((sum, item) => sum + (item._sum.characterCount || 0), 0),
        totalVoiceMinutes: Math.round(voiceActivity.reduce((sum, item) => sum + (item._sum.sessionDuration || 0), 0) / 60),
        serversActive: new Set([
          ...messageActivity.map(item => item.serverId).filter(Boolean),
          ...voiceActivity.map(item => item.serverId).filter(Boolean)
        ]).size
      };
    } catch (error) {
      console.error('Failed to get user engagement:', error);
      return null;
    }
  }

  /**
   * Flush event cache to database
   */
  private async flushEventCache(): Promise<void> {
    if (this.eventCache.length === 0) return;

    const eventsToFlush = [...this.eventCache];
    this.eventCache = [];

    try {
      // Process events in batches
      await this.queue.addBulk(
        eventsToFlush.map((event, index) => ({
          name: 'process-analytics-event',
          data: event,
          opts: {
            delay: index * 10 // Small delay to prevent overwhelming
          }
        }))
      );

      console.log(`📊 Flushed ${eventsToFlush.length} analytics events`);
    } catch (error) {
      console.error('Failed to flush analytics events:', error);
      // Put events back in cache to retry later
      this.eventCache = eventsToFlush.concat(this.eventCache);
    }
  }

  /**
   * Cleanup old analytics data
   */
  async cleanupOldData(daysToKeep: number = 365): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const [messagesDeleted, voiceDeleted] = await Promise.all([
        prisma.messageAnalytics.deleteMany({
          where: {
            timestamp: { lt: cutoffDate }
          }
        }),
        prisma.voiceAnalytics.deleteMany({
          where: {
            timestamp: { lt: cutoffDate }
          }
        })
      ]);

      console.log(`🧹 Cleaned up analytics data: ${messagesDeleted.count + voiceDeleted.count} records`);
    } catch (error) {
      console.error('Failed to cleanup analytics data:', error);
    }
  }

  /**
   * Cleanup when service shuts down
   */
  async cleanup(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    // Flush remaining events
    await this.flushEventCache();
  }
}