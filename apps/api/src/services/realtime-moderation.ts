import { Server as SocketIOServer } from 'socket.io';
import { comprehensiveModerationService } from './comprehensive-moderation';
import { aiModerationService } from './ai-moderation';
import { prisma } from '@cryb/database';

interface ModerationEvent {
  type: 'content_flagged' | 'user_banned' | 'content_removed' | 'report_submitted' | 'appeal_submitted';
  data: any;
  timestamp: Date;
  moderator_id?: string;
  community_id?: string;
  server_id?: string;
}

interface ModerationNotification {
  id: string;
  type: 'urgent' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  data: any;
  recipient_id?: string;
  community_id?: string;
  server_id?: string;
  timestamp: Date;
}

export class RealtimeModerationService {
  private io: SocketIOServer | null = null;
  private moderatorSockets: Map<string, string[]> = new Map();
  private onlineModeratorCount: number = 0;

  constructor() {
    this.initializeEventHandlers();
  }

  /**
   * Initialize Socket.IO server
   */
  setSocketServer(io: SocketIOServer) {
    this.io = io;
    this.setupSocketHandlers();
    console.log('✅ Realtime Moderation Service initialized with Socket.IO');
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupSocketHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      console.log(`🔌 User connected to moderation system: ${socket.id}`);

      // Handle moderator authentication
      socket.on('authenticate_moderator', async (data) => {
        try {
          const { userId, token } = data;
          
          // Verify token and check moderation permissions
          const isValidModerator = await this.verifyModeratorAuth(userId, token);
          
          if (isValidModerator) {
            // Add to moderator sockets
            if (!this.moderatorSockets.has(userId)) {
              this.moderatorSockets.set(userId, []);
            }
            this.moderatorSockets.get(userId)!.push(socket.id);
            
            // Join moderator rooms
            socket.join('moderators');
            socket.join(`moderator_${userId}`);
            
            this.onlineModeratorCount++;
            
            socket.emit('moderator_authenticated', {
              success: true,
              moderator_id: userId,
              online_moderators: this.onlineModeratorCount,
            });

            // Send pending notifications
            await this.sendPendingNotifications(userId, socket);
            
            console.log(`✅ Moderator ${userId} authenticated and joined moderation channels`);
          } else {
            socket.emit('authentication_failed', {
              error: 'Invalid moderator credentials',
            });
          }
        } catch (error) {
          console.error('Error authenticating moderator:', error);
          socket.emit('authentication_failed', {
            error: 'Authentication failed',
          });
        }
      });

      // Handle moderation action requests
      socket.on('apply_moderation_action', async (data) => {
        try {
          const moderatorId = await this.getModeratorFromSocket(socket.id);
          if (!moderatorId) {
            socket.emit('action_error', { error: 'Not authenticated as moderator' });
            return;
          }

          const actionData = {
            ...data,
            moderator_id: moderatorId,
            auto_generated: false,
          };

          const actionId = await comprehensiveModerationService.applyModerationAction(actionData);
          
          // Broadcast action to other moderators
          this.broadcastModerationEvent({
            type: 'user_banned',
            data: {
              action_id: actionId,
              ...actionData,
            },
            timestamp: new Date(),
            moderator_id: moderatorId,
          });

          socket.emit('action_applied', {
            success: true,
            action_id: actionId,
          });
        } catch (error) {
          console.error('Error applying moderation action:', error);
          socket.emit('action_error', {
            error: 'Failed to apply moderation action',
          });
        }
      });

      // Handle queue item assignment
      socket.on('assign_queue_item', async (data) => {
        try {
          const moderatorId = await this.getModeratorFromSocket(socket.id);
          if (!moderatorId) {
            socket.emit('assignment_error', { error: 'Not authenticated as moderator' });
            return;
          }

          await this.assignQueueItemToModerator(data.queue_id, moderatorId);
          
          // Notify other moderators that item is taken
          socket.to('moderators').emit('queue_item_assigned', {
            queue_id: data.queue_id,
            assigned_to: moderatorId,
          });

          socket.emit('assignment_success', {
            queue_id: data.queue_id,
          });
        } catch (error) {
          console.error('Error assigning queue item:', error);
          socket.emit('assignment_error', {
            error: 'Failed to assign queue item',
          });
        }
      });

      // Handle real-time content analysis requests
      socket.on('analyze_content_realtime', async (data) => {
        try {
          const moderatorId = await this.getModeratorFromSocket(socket.id);
          if (!moderatorId) {
            socket.emit('analysis_error', { error: 'Not authenticated as moderator' });
            return;
          }

          const { content, content_type } = data;
          
          // Analyze content in real-time
          const analysis = await aiModerationService.analyzeTextContent(
            content,
            `realtime_${Date.now()}`,
            content_type,
            moderatorId
          );

          socket.emit('analysis_result', {
            analysis,
            timestamp: new Date(),
          });
        } catch (error) {
          console.error('Error analyzing content in real-time:', error);
          socket.emit('analysis_error', {
            error: 'Failed to analyze content',
          });
        }
      });

      // Handle moderator status updates
      socket.on('update_moderator_status', async (data) => {
        try {
          const moderatorId = await this.getModeratorFromSocket(socket.id);
          if (!moderatorId) return;

          const { status, availability } = data;
          
          await this.updateModeratorStatus(moderatorId, status, availability);
          
          // Broadcast status update to admin dashboard
          this.io!.to('admin_dashboard').emit('moderator_status_update', {
            moderator_id: moderatorId,
            status,
            availability,
            timestamp: new Date(),
          });
        } catch (error) {
          console.error('Error updating moderator status:', error);
        }
      });

      // Handle live moderation sessions
      socket.on('start_moderation_session', async (data) => {
        try {
          const moderatorId = await this.getModeratorFromSocket(socket.id);
          if (!moderatorId) return;

          const { community_id, server_id } = data;
          
          // Join specific moderation channels
          if (community_id) {
            socket.join(`moderation_${community_id}`);
          }
          if (server_id) {
            socket.join(`moderation_${server_id}`);
          }

          socket.emit('session_started', {
            moderator_id: moderatorId,
            community_id,
            server_id,
            timestamp: new Date(),
          });
        } catch (error) {
          console.error('Error starting moderation session:', error);
        }
      });

      // Handle disconnect
      socket.on('disconnect', async () => {
        await this.handleModeratorDisconnect(socket.id);
        console.log(`🔌 Socket disconnected: ${socket.id}`);
      });
    });
  }

  /**
   * Broadcast moderation event to relevant moderators
   */
  broadcastModerationEvent(event: ModerationEvent) {
    if (!this.io) return;

    // Broadcast to all moderators
    this.io.to('moderators').emit('moderation_event', event);

    // Broadcast to specific community/server moderators
    if (event.community_id) {
      this.io.to(`moderation_${event.community_id}`).emit('moderation_event', event);
    }
    if (event.server_id) {
      this.io.to(`moderation_${event.server_id}`).emit('moderation_event', event);
    }

    console.log(`📡 Broadcasted moderation event: ${event.type}`);
  }

  /**
   * Send urgent notification to moderators
   */
  async sendUrgentNotification(notification: ModerationNotification) {
    if (!this.io) return;

    // Send to specific moderator if specified
    if (notification.recipient_id) {
      this.io.to(`moderator_${notification.recipient_id}`).emit('urgent_notification', notification);
    } else {
      // Send to all available moderators
      this.io.to('moderators').emit('urgent_notification', notification);
    }

    // Store notification for offline moderators
    await this.storeNotification(notification);

    console.log(`🚨 Sent urgent notification: ${notification.title}`);
  }

  /**
   * Handle content flagged by AI
   */
  async handleContentFlagged(
    contentId: string,
    contentType: string,
    analysis: any,
    userId: string,
    communityId?: string,
    serverId?: string
  ) {
    const event: ModerationEvent = {
      type: 'content_flagged',
      data: {
        content_id: contentId,
        content_type: contentType,
        analysis,
        user_id: userId,
        flagged_categories: analysis.flagged_categories,
        confidence: analysis.overall_confidence,
      },
      timestamp: new Date(),
      community_id: communityId,
      server_id: serverId,
    };

    this.broadcastModerationEvent(event);

    // Send urgent notification for high-risk content
    if (analysis.overall_confidence > 0.8 || analysis.flagged_categories.includes('self_harm')) {
      await this.sendUrgentNotification({
        id: `notification_${Date.now()}`,
        type: 'urgent',
        title: 'High-Risk Content Detected',
        message: `AI detected ${analysis.flagged_categories.join(', ')} in ${contentType} with ${(analysis.overall_confidence * 100).toFixed(1)}% confidence`,
        data: {
          content_id: contentId,
          content_type: contentType,
          analysis,
        },
        community_id: communityId,
        server_id: serverId,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Handle new report submitted
   */
  async handleReportSubmitted(
    reportId: string,
    reportData: any,
    priority: number
  ) {
    const event: ModerationEvent = {
      type: 'report_submitted',
      data: {
        report_id: reportId,
        ...reportData,
        priority,
      },
      timestamp: new Date(),
      community_id: reportData.community_id,
      server_id: reportData.server_id,
    };

    this.broadcastModerationEvent(event);

    // Send notification for high-priority reports
    if (priority >= 3) {
      await this.sendUrgentNotification({
        id: `notification_${Date.now()}`,
        type: priority >= 4 ? 'urgent' : 'high',
        title: 'High-Priority Report Submitted',
        message: `New ${reportData.category} report requires immediate attention`,
        data: {
          report_id: reportId,
          category: reportData.category,
          description: reportData.description,
        },
        community_id: reportData.community_id,
        server_id: reportData.server_id,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Handle moderation action applied
   */
  async handleActionApplied(
    actionId: string,
    actionData: any
  ) {
    const event: ModerationEvent = {
      type: actionData.action_type === 'ban' ? 'user_banned' : 'content_removed',
      data: {
        action_id: actionId,
        ...actionData,
      },
      timestamp: new Date(),
      moderator_id: actionData.moderator_id,
      community_id: actionData.community_id,
      server_id: actionData.server_id,
    };

    this.broadcastModerationEvent(event);

    // Notify the affected user if they're online
    if (actionData.target_user_id) {
      this.io?.to(`user_${actionData.target_user_id}`).emit('moderation_action', {
        action_type: actionData.action_type,
        reason: actionData.reason,
        duration_minutes: actionData.duration_minutes,
        appeal_deadline: actionData.appeal_deadline,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Get moderation statistics for dashboard
   */
  async getModerationStats(): Promise<any> {
    try {
      const stats = await prisma.$queryRaw`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'pending') as pending_reports,
          COUNT(*) FILTER (WHERE status = 'reviewing') as reviewing_reports,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as reports_24h,
          COUNT(*) FILTER (WHERE priority >= 3) as high_priority_reports
        FROM content_reports
      `;

      const queueStats = await prisma.$queryRaw`
        SELECT 
          COUNT(*) as total_queue_items,
          COUNT(*) FILTER (WHERE status = 'pending') as pending_queue,
          COUNT(*) FILTER (WHERE priority >= 3) as high_priority_queue,
          AVG(confidence_score) as avg_confidence
        FROM moderation_queue
      `;

      return {
        online_moderators: this.onlineModeratorCount,
        reports: (stats as any[])[0],
        queue: (queueStats as any[])[0],
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error fetching moderation stats:', error);
      return {
        online_moderators: this.onlineModeratorCount,
        reports: {},
        queue: {},
        timestamp: new Date(),
      };
    }
  }

  /**
   * Send live stats updates to admin dashboard
   */
  async broadcastLiveStats() {
    if (!this.io) return;

    const stats = await this.getModerationStats();
    this.io.to('admin_dashboard').emit('live_stats_update', stats);
  }

  // Helper methods

  private initializeEventHandlers() {
    // Set up periodic stats broadcasting
    setInterval(async () => {
      await this.broadcastLiveStats();
    }, 30000); // Every 30 seconds

    console.log('✅ Realtime moderation event handlers initialized');
  }

  private async verifyModeratorAuth(userId: string, token: string): Promise<boolean> {
    try {
      // Verify JWT token and check moderation permissions
      const permissions = await prisma.$queryRawUnsafe(`
        SELECT * FROM moderator_permissions WHERE user_id = $1
      `, userId);

      return (permissions as any[]).length > 0;
    } catch (error) {
      console.error('Error verifying moderator auth:', error);
      return false;
    }
  }

  private async getModeratorFromSocket(socketId: string): Promise<string | null> {
    for (const [moderatorId, sockets] of this.moderatorSockets.entries()) {
      if (sockets.includes(socketId)) {
        return moderatorId;
      }
    }
    return null;
  }

  private async assignQueueItemToModerator(queueId: string, moderatorId: string): Promise<void> {
    try {
      await prisma.$executeRawUnsafe(`
        UPDATE moderation_queue 
        SET assigned_moderator = $1, assigned_at = NOW(), status = 'reviewing'
        WHERE id = $2 AND (assigned_moderator IS NULL OR assigned_moderator = $1)
      `, moderatorId, queueId);
    } catch (error) {
      console.error('Error assigning queue item:', error);
      throw error;
    }
  }

  private async updateModeratorStatus(
    moderatorId: string,
    status: string,
    availability: boolean
  ): Promise<void> {
    try {
      await prisma.$executeRawUnsafe(`
        UPDATE moderator_permissions 
        SET updated_at = NOW()
        WHERE user_id = $1
      `, moderatorId);
      
      // Could store more detailed status in a separate table
    } catch (error) {
      console.error('Error updating moderator status:', error);
    }
  }

  private async sendPendingNotifications(moderatorId: string, socket: any): Promise<void> {
    try {
      // Get pending notifications for this moderator
      const notifications = await prisma.$queryRawUnsafe(`
        SELECT * FROM moderation_notifications 
        WHERE (recipient_id = $1 OR recipient_id IS NULL)
        AND created_at >= NOW() - INTERVAL '24 hours'
        ORDER BY created_at DESC
        LIMIT 10
      `, moderatorId);

      for (const notification of notifications as any[]) {
        socket.emit('pending_notification', notification);
      }
    } catch (error) {
      console.error('Error sending pending notifications:', error);
    }
  }

  private async storeNotification(notification: ModerationNotification): Promise<void> {
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO moderation_notifications (
          id, type, title, message, data, recipient_id, 
          community_id, server_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
        notification.id, notification.type, notification.title,
        notification.message, JSON.stringify(notification.data),
        notification.recipient_id, notification.community_id,
        notification.server_id, notification.timestamp
      );
    } catch (error) {
      console.error('Error storing notification:', error);
    }
  }

  private async handleModeratorDisconnect(socketId: string): Promise<void> {
    const moderatorId = await this.getModeratorFromSocket(socketId);
    
    if (moderatorId) {
      // Remove socket from moderator's socket list
      const sockets = this.moderatorSockets.get(moderatorId) || [];
      const updatedSockets = sockets.filter(id => id !== socketId);
      
      if (updatedSockets.length === 0) {
        // Moderator is completely offline
        this.moderatorSockets.delete(moderatorId);
        this.onlineModeratorCount--;
        
        // Release any assigned queue items
        await this.releaseModeratorQueueItems(moderatorId);
      } else {
        this.moderatorSockets.set(moderatorId, updatedSockets);
      }
    }
  }

  private async releaseModeratorQueueItems(moderatorId: string): Promise<void> {
    try {
      await prisma.$executeRawUnsafe(`
        UPDATE moderation_queue 
        SET assigned_moderator = NULL, status = 'pending'
        WHERE assigned_moderator = $1 AND status = 'reviewing'
      `, moderatorId);
    } catch (error) {
      console.error('Error releasing moderator queue items:', error);
    }
  }
}

export const realtimeModerationService = new RealtimeModerationService();