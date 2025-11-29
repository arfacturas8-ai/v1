import { Server, Socket } from 'socket.io';
import { Redis } from 'ioredis';
import { prisma } from '@cryb/database';
import { AuthService } from '../services/auth';

interface ReactionEventData {
  contentType: 'post' | 'comment' | 'message';
  contentId: string;
  reactionType: string;
  customEmojiName?: string;
  customEmojiId?: string;
}

interface ReactionSocket extends Socket {
  userId?: string;
  authenticated?: boolean;
}

export class ReactionRealtimeHandler {
  private io: Server;
  private redis: Redis;
  private authService: AuthService;

  constructor(io: Server, redis: Redis, authService: AuthService) {
    this.io = io;
    this.redis = redis;
    this.authService = authService;
    this.setupHandlers();
  }

  private setupHandlers() {
    this.io.on('connection', (socket: ReactionSocket) => {
      console.log(`Socket connected: ${socket.id}`);

      // Handle authentication
      socket.on('authenticate', async (token: string) => {
        try {
          const user = await this.authService.verifyToken(token);
          if (user) {
            socket.userId = user.id;
            socket.authenticated = true;
            socket.join(`user:${user.id}`);
            
            console.log(`User ${user.id} authenticated on socket ${socket.id}`);
            socket.emit('authenticated', { success: true, userId: user.id });
          } else {
            socket.emit('authenticated', { success: false, error: 'Invalid token' });
          }
        } catch (error) {
          console.error('Authentication error:', error);
          socket.emit('authenticated', { success: false, error: 'Authentication failed' });
        }
      });

      // Join content-specific rooms
      socket.on('join_content_room', (data: { contentType: string; contentId: string }) => {
        const roomName = `${data.contentType}:${data.contentId}`;
        socket.join(roomName);
        console.log(`Socket ${socket.id} joined room: ${roomName}`);
      });

      // Leave content-specific rooms
      socket.on('leave_content_room', (data: { contentType: string; contentId: string }) => {
        const roomName = `${data.contentType}:${data.contentId}`;
        socket.leave(roomName);
        console.log(`Socket ${socket.id} left room: ${roomName}`);
      });

      // Handle real-time reaction events
      socket.on('add_reaction', async (data: ReactionEventData) => {
        if (!socket.authenticated || !socket.userId) {
          socket.emit('reaction_error', { error: 'Not authenticated' });
          return;
        }

        try {
          await this.handleAddReaction(socket, data);
        } catch (error) {
          console.error('Error adding reaction:', error);
          socket.emit('reaction_error', { error: 'Failed to add reaction' });
        }
      });

      socket.on('remove_reaction', async (data: ReactionEventData) => {
        if (!socket.authenticated || !socket.userId) {
          socket.emit('reaction_error', { error: 'Not authenticated' });
          return;
        }

        try {
          await this.handleRemoveReaction(socket, data);
        } catch (error) {
          console.error('Error removing reaction:', error);
          socket.emit('reaction_error', { error: 'Failed to remove reaction' });
        }
      });

      // Handle reaction analytics requests
      socket.on('get_reaction_analytics', async (data: { contentType?: string; contentId?: string; timeframe?: string }) => {
        if (!socket.authenticated) {
          socket.emit('reaction_error', { error: 'Not authenticated' });
          return;
        }

        try {
          const analytics = await this.getReactionAnalytics(data);
          socket.emit('reaction_analytics', analytics);
        } catch (error) {
          console.error('Error getting analytics:', error);
          socket.emit('reaction_error', { error: 'Failed to get analytics' });
        }
      });

      // Handle trending reactions requests
      socket.on('get_trending_reactions', async (data: { contentType?: string; period?: string; limit?: number }) => {
        try {
          const trending = await this.getTrendingReactions(data);
          socket.emit('trending_reactions', trending);
        } catch (error) {
          console.error('Error getting trending reactions:', error);
          socket.emit('reaction_error', { error: 'Failed to get trending reactions' });
        }
      });

      // Handle user reaction history
      socket.on('get_user_reaction_history', async (data: { userId?: string; limit?: number }) => {
        if (!socket.authenticated) {
          socket.emit('reaction_error', { error: 'Not authenticated' });
          return;
        }

        try {
          const userId = data.userId || socket.userId;
          const history = await this.getUserReactionHistory(userId!, data.limit);
          socket.emit('user_reaction_history', history);
        } catch (error) {
          console.error('Error getting user history:', error);
          socket.emit('reaction_error', { error: 'Failed to get user history' });
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
      });
    });
  }

  private async handleAddReaction(socket: ReactionSocket, data: ReactionEventData) {
    const { contentType, contentId, reactionType, customEmojiName, customEmojiId } = data;
    const userId = socket.userId!;

    // Validate content exists
    const contentExists = await this.validateContentExists(contentType, contentId);
    if (!contentExists) {
      socket.emit('reaction_error', { error: 'Content not found' });
      return;
    }

    // Check if user already has this reaction
    const existingReaction = await this.checkExistingReaction(userId, contentType, contentId, reactionType);
    if (existingReaction) {
      socket.emit('reaction_error', { error: 'Reaction already exists' });
      return;
    }

    // Add reaction to database
    const reaction = await this.addReactionToDatabase({
      userId,
      contentType,
      contentId,
      reactionType,
      customEmojiName,
      customEmojiId
    });

    // Get updated reaction summary
    const summary = await this.getReactionSummary(contentType, contentId);

    // Get content owner for notifications
    const contentOwner = await this.getContentOwner(contentType, contentId);

    // Emit to content room
    const roomName = `${contentType}:${contentId}`;
    this.io.to(roomName).emit('reaction_added', {
      reactionId: reaction.id,
      userId,
      contentType,
      contentId,
      reactionType,
      customEmojiName,
      summary,
      timestamp: new Date().toISOString()
    });

    // Send notification to content owner (if not self-reaction)
    if (contentOwner && contentOwner.id !== userId) {
      await this.sendReactionNotification(contentOwner.id, {
        type: 'REACTION_RECEIVED',
        reactorUserId: userId,
        contentType,
        contentId,
        reactionType,
        customEmojiName
      });
    }

    // Update analytics in background
    this.updateReactionAnalytics(contentType, contentId, reactionType, 'add');

    // Cache reaction for quick access
    await this.cacheReaction(reaction);

    socket.emit('reaction_added_success', { reactionId: reaction.id, summary });
  }

  private async handleRemoveReaction(socket: ReactionSocket, data: ReactionEventData) {
    const { contentType, contentId, reactionType } = data;
    const userId = socket.userId!;

    // Find and remove reaction
    const removedReaction = await this.removeReactionFromDatabase(userId, contentType, contentId, reactionType);
    
    if (!removedReaction) {
      socket.emit('reaction_error', { error: 'Reaction not found' });
      return;
    }

    // Get updated reaction summary
    const summary = await this.getReactionSummary(contentType, contentId);

    // Emit to content room
    const roomName = `${contentType}:${contentId}`;
    this.io.to(roomName).emit('reaction_removed', {
      reactionId: removedReaction.id,
      userId,
      contentType,
      contentId,
      reactionType,
      summary,
      timestamp: new Date().toISOString()
    });

    // Update analytics in background
    this.updateReactionAnalytics(contentType, contentId, reactionType, 'remove');

    // Remove from cache
    await this.uncacheReaction(removedReaction.id);

    socket.emit('reaction_removed_success', { reactionId: removedReaction.id, summary });
  }

  private async validateContentExists(contentType: string, contentId: string): Promise<boolean> {
    try {
      switch (contentType) {
        case 'post':
          const post = await prisma.post.findUnique({ where: { id: contentId } });
          return !!post;
        case 'comment':
          const comment = await prisma.comment.findUnique({ where: { id: contentId } });
          return !!comment;
        case 'message':
          const message = await prisma.message.findUnique({ where: { id: contentId } });
          return !!message;
        default:
          return false;
      }
    } catch (error) {
      console.error('Error validating content:', error);
      return false;
    }
  }

  private async checkExistingReaction(userId: string, contentType: string, contentId: string, reactionType: string): Promise<boolean> {
    try {
      const existing = await prisma.$queryRaw`
        SELECT id FROM enhanced_reactions 
        WHERE user_id = ${userId}::text
        AND reaction_type = ${reactionType}::reaction_type
        AND (
          (${contentType} = 'post' AND post_id = ${contentId}::text) OR
          (${contentType} = 'comment' AND comment_id = ${contentId}::text) OR  
          (${contentType} = 'message' AND message_id = ${contentId}::text)
        )
      ` as any[];

      return existing.length > 0;
    } catch (error) {
      console.error('Error checking existing reaction:', error);
      return false;
    }
  }

  private async addReactionToDatabase(data: {
    userId: string;
    contentType: string;
    contentId: string;
    reactionType: string;
    customEmojiName?: string;
    customEmojiId?: string;
  }) {
    const { userId, contentType, contentId, reactionType, customEmojiName, customEmojiId } = data;

    const reactionData: any = {
      user_id: userId,
      reaction_type: reactionType,
      custom_emoji_name: customEmojiName,
      custom_emoji_id: customEmojiId
    };

    if (contentType === 'post') reactionData.post_id = contentId;
    else if (contentType === 'comment') reactionData.comment_id = contentId;
    else if (contentType === 'message') reactionData.message_id = contentId;

    const result = await prisma.$queryRaw`
      INSERT INTO enhanced_reactions (user_id, post_id, comment_id, message_id, reaction_type, custom_emoji_name, custom_emoji_id)
      VALUES (
        ${reactionData.user_id}::text,
        ${reactionData.post_id || null}::text,
        ${reactionData.comment_id || null}::text, 
        ${reactionData.message_id || null}::text,
        ${reactionData.reaction_type}::reaction_type,
        ${reactionData.custom_emoji_name || null}::text,
        ${reactionData.custom_emoji_id || null}::text
      )
      RETURNING *
    ` as any[];

    return result[0];
  }

  private async removeReactionFromDatabase(userId: string, contentType: string, contentId: string, reactionType: string) {
    const result = await prisma.$queryRaw`
      DELETE FROM enhanced_reactions 
      WHERE user_id = ${userId}::text
      AND reaction_type = ${reactionType}::reaction_type
      AND (
        (${contentType} = 'post' AND post_id = ${contentId}::text) OR
        (${contentType} = 'comment' AND comment_id = ${contentId}::text) OR  
        (${contentType} = 'message' AND message_id = ${contentId}::text)
      )
      RETURNING *
    ` as any[];

    return result[0] || null;
  }

  private async getReactionSummary(contentType: string, contentId: string) {
    const summary = await prisma.$queryRaw`
      SELECT * FROM reaction_summaries 
      WHERE content_type = ${contentType} AND content_id = ${contentId}
    ` as any[];

    return summary[0] || null;
  }

  private async getContentOwner(contentType: string, contentId: string) {
    try {
      switch (contentType) {
        case 'post':
          const post = await prisma.post.findUnique({
            where: { id: contentId },
            select: { userId: true }
          });
          if (post) {
            return await prisma.user.findUnique({ where: { id: post.userId } });
          }
          break;
        case 'comment':
          const comment = await prisma.comment.findUnique({
            where: { id: contentId },
            select: { userId: true }
          });
          if (comment) {
            return await prisma.user.findUnique({ where: { id: comment.userId } });
          }
          break;
        case 'message':
          const message = await prisma.message.findUnique({
            where: { id: contentId },
            select: { userId: true }
          });
          if (message) {
            return await prisma.user.findUnique({ where: { id: message.userId } });
          }
          break;
      }
      return null;
    } catch (error) {
      console.error('Error getting content owner:', error);
      return null;
    }
  }

  private async sendReactionNotification(userId: string, notificationData: any) {
    try {
      // Create notification in database
      await prisma.$queryRaw`
        INSERT INTO reaction_notifications (recipient_user_id, reactor_user_id, content_type, content_id, reaction_type, custom_emoji_name)
        VALUES (
          ${userId}::text, 
          ${notificationData.reactorUserId}::text, 
          ${notificationData.contentType}::text, 
          ${notificationData.contentId}::text, 
          ${notificationData.reactionType}::reaction_type, 
          ${notificationData.customEmojiName || null}::text
        )
        ON CONFLICT (recipient_user_id, reactor_user_id, content_type, content_id, reaction_type) DO NOTHING
      `;

      // Emit real-time notification
      this.io.to(`user:${userId}`).emit('reaction_notification', notificationData);
    } catch (error) {
      console.error('Error sending reaction notification:', error);
    }
  }

  private async updateReactionAnalytics(contentType: string, contentId: string, reactionType: string, action: 'add' | 'remove') {
    try {
      const increment = action === 'add' ? 1 : -1;
      const today = new Date().toISOString().split('T')[0];

      // Update daily analytics
      await prisma.$queryRaw`
        INSERT INTO reaction_analytics (content_type, content_id, reaction_type, date, count, unique_users)
        VALUES (
          ${contentType}::text, 
          ${contentId}::text, 
          ${reactionType}::reaction_type, 
          ${today}::date, 
          ${increment}::integer, 
          1::integer
        )
        ON CONFLICT (content_type, content_id, reaction_type, date) 
        DO UPDATE SET 
          count = reaction_analytics.count + ${increment}::integer,
          updated_at = NOW()
      `;

      // Update trending calculations in background
      this.calculateTrendingScore(contentType, contentId);
    } catch (error) {
      console.error('Error updating analytics:', error);
    }
  }

  private async calculateTrendingScore(contentType: string, contentId: string) {
    try {
      // Calculate trend score based on recent activity
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const recentReactions = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM enhanced_reactions
        WHERE (
          (${contentType} = 'post' AND post_id = ${contentId}::text) OR
          (${contentType} = 'comment' AND comment_id = ${contentId}::text) OR  
          (${contentType} = 'message' AND message_id = ${contentId}::text)
        )
        AND created_at > ${oneHourAgo.toISOString()}::timestamp
      ` as any[];

      const dailyReactions = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM enhanced_reactions
        WHERE (
          (${contentType} = 'post' AND post_id = ${contentId}::text) OR
          (${contentType} = 'comment' AND comment_id = ${contentId}::text) OR  
          (${contentType} = 'message' AND message_id = ${contentId}::text)
        )
        AND created_at > ${oneDayAgo.toISOString()}::timestamp
      ` as any[];

      const recentCount = parseInt(recentReactions[0]?.count || '0');
      const dailyCount = parseInt(dailyReactions[0]?.count || '0');

      // Calculate velocity (reactions per hour)
      const velocity = recentCount; // reactions in last hour
      
      // Calculate trend score (weighted by recency)
      const trendScore = (recentCount * 10) + (dailyCount * 1);

      // Update trending table
      await prisma.$queryRaw`
        INSERT INTO trending_reactions (content_type, content_id, trend_score, reaction_velocity, trend_period)
        VALUES (
          ${contentType}::text, 
          ${contentId}::text, 
          ${trendScore}::float, 
          ${velocity}::float, 
          '24h'::text
        )
        ON CONFLICT (content_type, content_id, trend_period) 
        DO UPDATE SET 
          trend_score = ${trendScore}::float,
          reaction_velocity = ${velocity}::float,
          calculated_at = NOW(),
          expires_at = NOW() + INTERVAL '24 hours'
      `;
    } catch (error) {
      console.error('Error calculating trending score:', error);
    }
  }

  private async cacheReaction(reaction: any) {
    try {
      const key = `reaction:${reaction.id}`;
      await this.redis.setex(key, 3600, JSON.stringify(reaction)); // Cache for 1 hour
    } catch (error) {
      console.error('Error caching reaction:', error);
    }
  }

  private async uncacheReaction(reactionId: string) {
    try {
      const key = `reaction:${reactionId}`;
      await this.redis.del(key);
    } catch (error) {
      console.error('Error uncaching reaction:', error);
    }
  }

  private async getReactionAnalytics(data: { contentType?: string; contentId?: string; timeframe?: string }) {
    try {
      const { contentType, contentId, timeframe = '24h' } = data;

      if (contentId) {
        // Get analytics for specific content
        return await this.getContentAnalytics(contentType!, contentId, timeframe);
      } else {
        // Get global analytics
        return await this.getGlobalAnalytics(contentType, timeframe);
      }
    } catch (error) {
      console.error('Error getting analytics:', error);
      return null;
    }
  }

  private async getContentAnalytics(contentType: string, contentId: string, timeframe: string) {
    // Implementation for content-specific analytics
    const summary = await this.getReactionSummary(contentType, contentId);
    return {
      contentType,
      contentId,
      summary,
      timeframe
    };
  }

  private async getGlobalAnalytics(contentType?: string, timeframe: string = '24h') {
    // Implementation for global analytics
    return {
      globalStats: true,
      contentType,
      timeframe
    };
  }

  private async getTrendingReactions(data: { contentType?: string; period?: string; limit?: number }) {
    try {
      const { contentType, period = '24h', limit = 10 } = data;

      const contentFilter = contentType ? `AND content_type = '${contentType}'` : '';

      const trending = await prisma.$queryRaw`
        SELECT * FROM trending_reactions 
        WHERE trend_period = ${period}::text 
        AND expires_at > NOW()
        ${contentFilter ? prisma.$queryRawUnsafe(contentFilter) : prisma.$queryRawUnsafe('')}
        ORDER BY trend_score DESC
        LIMIT ${limit}
      ` as any[];

      return trending;
    } catch (error) {
      console.error('Error getting trending reactions:', error);
      return [];
    }
  }

  private async getUserReactionHistory(userId: string, limit: number = 50) {
    try {
      const history = await prisma.$queryRaw`
        SELECT * FROM enhanced_reactions 
        WHERE user_id = ${userId}::text
        ORDER BY created_at DESC
        LIMIT ${limit}
      ` as any[];

      return history;
    } catch (error) {
      console.error('Error getting user history:', error);
      return [];
    }
  }
}

export default ReactionRealtimeHandler;