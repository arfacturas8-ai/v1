import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "@cryb/database";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth";
import { validate } from "../middleware/validation";

// Comprehensive validation schemas for enhanced reaction system
const reactionSchemas = {
  add: z.object({
    contentType: z.enum(['post', 'comment', 'message']),
    contentId: z.string().cuid(),
    reactionType: z.enum([
      'like', 'love', 'laugh', 'wow', 'sad', 'angry',
      'upvote', 'downvote', 'fire', 'rocket', 'heart_eyes', 
      'thinking', 'clap', 'thumbs_up', 'thumbs_down', 'custom_emoji'
    ]),
    customEmojiName: z.string().optional(),
    customEmojiId: z.string().optional()
  }),
  
  remove: z.object({
    contentType: z.enum(['post', 'comment', 'message']),
    contentId: z.string().cuid(),
    reactionType: z.enum([
      'like', 'love', 'laugh', 'wow', 'sad', 'angry',
      'upvote', 'downvote', 'fire', 'rocket', 'heart_eyes', 
      'thinking', 'clap', 'thumbs_up', 'thumbs_down', 'custom_emoji'
    ]).optional()
  }),
  
  analytics: z.object({
    contentType: z.enum(['post', 'comment', 'message']).optional(),
    timeframe: z.enum(['1h', '6h', '24h', '7d', '30d']).default('24h'),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(25)
  }),
  
  trending: z.object({
    contentType: z.enum(['post', 'comment', 'message']).optional(),
    period: z.enum(['1h', '6h', '24h', '7d']).default('24h'),
    limit: z.coerce.number().min(1).max(50).default(10)
  }),
  
  customEmoji: z.object({
    name: z.string().min(1).max(32),
    url: z.string().url().optional(),
    data: z.string().optional(), // Base64 or emoji unicode
    serverId: z.string().cuid().optional(),
    communityId: z.string().cuid().optional(),
    isGlobal: z.boolean().default(false)
  })
};

const reactionRoutes: FastifyPluginAsync = async (fastify) => {
  // Add reaction to content
  fastify.post("/", { 
    preHandler: [authMiddleware, validate({ body: reactionSchemas.add })] 
  }, async (request: any, reply) => {
    try {
      const { contentType, contentId, reactionType, customEmojiName, customEmojiId } = request.body;
      const userId = request.userId;

      // Validate content exists and user has permission
      let contentExists = false;
      let contentOwnerId = null;

      switch (contentType) {
        case 'post':
          const post = await prisma.post.findUnique({
            where: { id: contentId },
            select: { id: true, userId: true, communityId: true }
          });
          if (post) {
            contentExists = true;
            contentOwnerId = post.userId;
          }
          break;
        case 'comment':
          const comment = await prisma.comment.findUnique({
            where: { id: contentId },
            select: { id: true, userId: true }
          });
          if (comment) {
            contentExists = true;
            contentOwnerId = comment.userId;
          }
          break;
        case 'message':
          const message = await prisma.message.findUnique({
            where: { id: contentId },
            select: { id: true, userId: true }
          });
          if (message) {
            contentExists = true;
            contentOwnerId = message.userId;
          }
          break;
      }

      if (!contentExists) {
        return reply.code(404).send({
          success: false,
          error: "Content not found"
        });
      }

      // Check if user already reacted with this type
      const existingReaction = await prisma.$queryRaw`
        SELECT id FROM enhanced_reactions 
        WHERE user_id = ${userId} 
        AND reaction_type = ${reactionType}::reaction_type
        AND (
          (${contentType} = 'post' AND post_id = ${contentId}) OR
          (${contentType} = 'comment' AND comment_id = ${contentId}) OR  
          (${contentType} = 'message' AND message_id = ${contentId})
        )
      ` as any[];

      if (existingReaction.length > 0) {
        return reply.code(409).send({
          success: false,
          error: "User already reacted with this type"
        });
      }

      // Create the reaction
      const reactionData: any = {
        user_id: userId,
        reaction_type: reactionType,
        custom_emoji_name: customEmojiName,
        custom_emoji_id: customEmojiId
      };

      if (contentType === 'post') reactionData.post_id = contentId;
      else if (contentType === 'comment') reactionData.comment_id = contentId;
      else if (contentType === 'message') reactionData.message_id = contentId;

      const reaction = await prisma.$queryRaw`
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

      // Get updated reaction summary
      const summary = await prisma.$queryRaw`
        SELECT * FROM reaction_summaries 
        WHERE content_type = ${contentType} AND content_id = ${contentId}
      ` as any[];

      // Emit real-time update via Socket.io
      const socketPayload = {
        type: 'REACTION_ADDED',
        contentType,
        contentId,
        userId,
        reactionType,
        customEmojiName,
        summary: summary[0] || null
      };

      // Emit to content room
      fastify.io?.to(`${contentType}:${contentId}`).emit('reaction_update', socketPayload);

      // Create notification for content owner (if not self-reaction)
      if (contentOwnerId && contentOwnerId !== userId) {
        await prisma.$queryRaw`
          INSERT INTO reaction_notifications (recipient_user_id, reactor_user_id, content_type, content_id, reaction_type, custom_emoji_name)
          VALUES (${contentOwnerId}::text, ${userId}::text, ${contentType}::text, ${contentId}::text, ${reactionType}::reaction_type, ${customEmojiName || null}::text)
          ON CONFLICT (recipient_user_id, reactor_user_id, content_type, content_id, reaction_type) DO NOTHING
        `;

        // Emit notification to content owner
        fastify.io?.to(`user:${contentOwnerId}`).emit('reaction_notification', {
          type: 'REACTION_RECEIVED',
          reactorUserId: userId,
          contentType,
          contentId,
          reactionType,
          customEmojiName
        });
      }

      return reply.send({
        success: true,
        data: {
          reaction: reaction[0],
          summary: summary[0]
        },
        message: "Reaction added successfully"
      });

    } catch (error) {
      fastify.log.error('Error adding reaction:', error);
      return reply.code(500).send({
        success: false,
        error: "Failed to add reaction"
      });
    }
  });

  // Remove reaction from content
  fastify.delete("/", { 
    preHandler: [authMiddleware, validate({ body: reactionSchemas.remove })] 
  }, async (request: any, reply) => {
    try {
      const { contentType, contentId, reactionType } = request.body;
      const userId = request.userId;

      // Remove specific reaction type or all reactions from user
      let deletedReactions;
      if (reactionType) {
        deletedReactions = await prisma.$queryRaw`
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
      } else {
        deletedReactions = await prisma.$queryRaw`
          DELETE FROM enhanced_reactions
          WHERE user_id = ${userId}::text
          AND (
            (${contentType} = 'post' AND post_id = ${contentId}::text) OR
            (${contentType} = 'comment' AND comment_id = ${contentId}::text) OR
            (${contentType} = 'message' AND message_id = ${contentId}::text)
          )
          RETURNING *
        ` as any[];
      }

      if (deletedReactions.length === 0) {
        return reply.code(404).send({
          success: false,
          error: "Reaction not found"
        });
      }

      // Get updated reaction summary  
      const summary = await prisma.$queryRaw`
        SELECT * FROM reaction_summaries 
        WHERE content_type = ${contentType} AND content_id = ${contentId}
      ` as any[];

      // Emit real-time update
      const socketPayload = {
        type: 'REACTION_REMOVED',
        contentType,
        contentId, 
        userId,
        reactionType: reactionType || 'all',
        summary: summary[0] || null
      };

      fastify.io?.to(`${contentType}:${contentId}`).emit('reaction_update', socketPayload);

      return reply.send({
        success: true,
        data: {
          removedReactions: deletedReactions,
          summary: summary[0]
        },
        message: "Reaction removed successfully"
      });

    } catch (error) {
      fastify.log.error('Error removing reaction:', error);
      return reply.code(500).send({
        success: false,
        error: "Failed to remove reaction"
      });
    }
  });

  // Get reactions for specific content
  fastify.get("/:contentType/:contentId", async (request, reply) => {
    await optionalAuthMiddleware(request, reply);
    
    try {
      const { contentType, contentId } = z.object({
        contentType: z.enum(['post', 'comment', 'message']),
        contentId: z.string().cuid()
      }).parse(request.params);

      const { page = 1, limit = 50, reactionType } = z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(50),
        reactionType: z.enum([
          'like', 'love', 'laugh', 'wow', 'sad', 'angry',
          'upvote', 'downvote', 'fire', 'rocket', 'heart_eyes',
          'thinking', 'clap', 'thumbs_up', 'thumbs_down', 'custom_emoji'
        ]).optional()
      }).parse(request.query);

      // Get reaction summary
      const summary = await prisma.$queryRaw`
        SELECT * FROM reaction_summaries
        WHERE content_type = ${contentType} AND content_id = ${contentId}
      ` as any[];

      // Get detailed reactions with user info
      let reactions;
      if (reactionType) {
        reactions = await prisma.$queryRaw`
          SELECT
            r.*,
            u.username,
            u.display_name,
            u.avatar
          FROM enhanced_reactions r
          JOIN users u ON r.user_id = u.id
          WHERE (
            (${contentType} = 'post' AND r.post_id = ${contentId}::text) OR
            (${contentType} = 'comment' AND r.comment_id = ${contentId}::text) OR
            (${contentType} = 'message' AND r.message_id = ${contentId}::text)
          )
          AND r.reaction_type = ${reactionType}::reaction_type
          ORDER BY r.created_at DESC
          LIMIT ${limit} OFFSET ${(page - 1) * limit}
        ` as any[];
      } else {
        reactions = await prisma.$queryRaw`
          SELECT
            r.*,
            u.username,
            u.display_name,
            u.avatar
          FROM enhanced_reactions r
          JOIN users u ON r.user_id = u.id
          WHERE (
            (${contentType} = 'post' AND r.post_id = ${contentId}::text) OR
            (${contentType} = 'comment' AND r.comment_id = ${contentId}::text) OR
            (${contentType} = 'message' AND r.message_id = ${contentId}::text)
          )
          ORDER BY r.created_at DESC
          LIMIT ${limit} OFFSET ${(page - 1) * limit}
        ` as any[];
      }

      // Get user's reactions if authenticated
      let userReactions = [];
      if ((request as any).userId) {
        userReactions = await prisma.$queryRaw`
          SELECT reaction_type, custom_emoji_name FROM enhanced_reactions
          WHERE user_id = ${(request as any).userId}::text
          AND (
            (${contentType} = 'post' AND post_id = ${contentId}::text) OR
            (${contentType} = 'comment' AND comment_id = ${contentId}::text) OR  
            (${contentType} = 'message' AND message_id = ${contentId}::text)
          )
        ` as any[];
      }

      return reply.send({
        success: true,
        data: {
          summary: summary[0] || null,
          reactions,
          userReactions,
          pagination: {
            page,
            limit,
            hasMore: reactions.length === limit
          }
        }
      });

    } catch (error) {
      fastify.log.error('Error getting reactions:', error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get reactions"
      });
    }
  });

  // Get trending reactions and content
  fastify.get("/trending", async (request, reply) => {
    await optionalAuthMiddleware(request, reply);

    try {
      const { contentType, period, limit } = reactionSchemas.trending.parse(request.query);

      let trending;
      if (contentType) {
        trending = await prisma.$queryRaw`
          SELECT
            tr.*,
            rs.total_reactions,
            rs.total_unique_users,
            CASE tr.content_type
              WHEN 'post' THEN (
                SELECT json_build_object(
                  'id', p.id,
                  'title', p.title,
                  'community', json_build_object(
                    'name', c.name,
                    'display_name', c.display_name
                  ),
                  'user', json_build_object(
                    'username', u.username,
                    'display_name', u.display_name
                  )
                )
                FROM posts p
                JOIN communities c ON p.community_id = c.id
                JOIN users u ON p.user_id = u.id
                WHERE p.id = tr.content_id
              )
              WHEN 'comment' THEN (
                SELECT json_build_object(
                  'id', co.id,
                  'content', co.content,
                  'user', json_build_object(
                    'username', u.username,
                    'display_name', u.display_name
                  )
                )
                FROM comments co
                JOIN users u ON co.user_id = u.id
                WHERE co.id = tr.content_id
              )
              ELSE NULL
            END as content_info
          FROM trending_reactions tr
          JOIN reaction_summaries rs ON tr.content_type = rs.content_type AND tr.content_id = rs.content_id
          WHERE tr.trend_period = ${period}
          AND tr.expires_at > NOW()
          AND tr.content_type = ${contentType}
          ORDER BY tr.trend_score DESC
          LIMIT ${limit}
        ` as any[];
      } else {
        trending = await prisma.$queryRaw`
          SELECT
            tr.*,
            rs.total_reactions,
            rs.total_unique_users,
            CASE tr.content_type
              WHEN 'post' THEN (
                SELECT json_build_object(
                  'id', p.id,
                  'title', p.title,
                  'community', json_build_object(
                    'name', c.name,
                    'display_name', c.display_name
                  ),
                  'user', json_build_object(
                    'username', u.username,
                    'display_name', u.display_name
                  )
                )
                FROM posts p
                JOIN communities c ON p.community_id = c.id
                JOIN users u ON p.user_id = u.id
                WHERE p.id = tr.content_id
              )
              WHEN 'comment' THEN (
                SELECT json_build_object(
                  'id', co.id,
                  'content', co.content,
                  'user', json_build_object(
                    'username', u.username,
                    'display_name', u.display_name
                  )
                )
                FROM comments co
                JOIN users u ON co.user_id = u.id
                WHERE co.id = tr.content_id
              )
              ELSE NULL
            END as content_info
          FROM trending_reactions tr
          JOIN reaction_summaries rs ON tr.content_type = rs.content_type AND tr.content_id = rs.content_id
          WHERE tr.trend_period = ${period}
          AND tr.expires_at > NOW()
          ORDER BY tr.trend_score DESC
          LIMIT ${limit}
        ` as any[];
      }

      return reply.send({
        success: true,
        data: {
          trending,
          period,
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      fastify.log.error('Error getting trending reactions:', error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get trending reactions"
      });
    }
  });

  // Get user reaction analytics and history
  fastify.get("/analytics/user", { preHandler: [authMiddleware] }, async (request: any, reply) => {
    try {
      const { timeframe, page, limit } = reactionSchemas.analytics.parse(request.query);
      const userId = request.userId;

      // Get user reaction history
      const history = await prisma.$queryRaw`
        SELECT * FROM user_reaction_history WHERE user_id = ${userId}::text
      ` as any[];

      // Get recent reactions given by user
      const recentReactions = await prisma.$queryRaw`
        SELECT 
          r.*,
          CASE r.post_id
            WHEN NOT NULL THEN (
              SELECT json_build_object('id', p.id, 'title', p.title, 'type', 'post')
              FROM posts p WHERE p.id = r.post_id
            )
          END as content_info
        FROM enhanced_reactions r
        WHERE r.user_id = ${userId}::text
        ORDER BY r.created_at DESC
        LIMIT ${limit} OFFSET ${(page - 1) * limit}
      ` as any[];

      // Get reaction statistics
      const stats = await prisma.$queryRaw`
        SELECT 
          reaction_type,
          COUNT(*) as count
        FROM enhanced_reactions 
        WHERE user_id = ${userId}::text
        GROUP BY reaction_type
        ORDER BY count DESC
      ` as any[];

      return reply.send({
        success: true,
        data: {
          history: history[0] || null,
          recentReactions,
          stats,
          pagination: {
            page,
            limit,
            hasMore: recentReactions.length === limit
          }
        }
      });

    } catch (error) {
      fastify.log.error('Error getting user analytics:', error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get user analytics"
      });
    }
  });

  // Get user notifications for reactions
  fastify.get("/notifications", { preHandler: [authMiddleware] }, async (request: any, reply) => {
    try {
      const { page = 1, limit = 25, unreadOnly = false } = z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(25),
        unreadOnly: z.coerce.boolean().default(false)
      }).parse(request.query);

      const userId = request.userId;

      let notifications;
      if (unreadOnly) {
        notifications = await prisma.$queryRaw`
          SELECT
            rn.*,
            u.username as reactor_username,
            u.display_name as reactor_display_name,
            u.avatar as reactor_avatar
          FROM reaction_notifications rn
          JOIN users u ON rn.reactor_user_id = u.id
          WHERE rn.recipient_user_id = ${userId}::text
          AND is_read = false
          ORDER BY rn.created_at DESC
          LIMIT ${limit} OFFSET ${(page - 1) * limit}
        ` as any[];
      } else {
        notifications = await prisma.$queryRaw`
          SELECT
            rn.*,
            u.username as reactor_username,
            u.display_name as reactor_display_name,
            u.avatar as reactor_avatar
          FROM reaction_notifications rn
          JOIN users u ON rn.reactor_user_id = u.id
          WHERE rn.recipient_user_id = ${userId}::text
          ORDER BY rn.created_at DESC
          LIMIT ${limit} OFFSET ${(page - 1) * limit}
        ` as any[];
      }

      return reply.send({
        success: true,
        data: {
          notifications,
          pagination: {
            page,
            limit,
            hasMore: notifications.length === limit
          }
        }
      });

    } catch (error) {
      fastify.log.error('Error getting notifications:', error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get notifications"
      });
    }
  });

  // Mark reaction notifications as read
  fastify.post("/notifications/read", { preHandler: [authMiddleware] }, async (request: any, reply) => {
    try {
      const { notificationIds, markAll = false } = z.object({
        notificationIds: z.array(z.string()).optional(),
        markAll: z.boolean().default(false)
      }).parse(request.body);

      const userId = request.userId;

      if (markAll) {
        await prisma.$queryRaw`
          UPDATE reaction_notifications 
          SET is_read = true, read_at = NOW()
          WHERE recipient_user_id = ${userId}::text AND is_read = false
        `;
      } else if (notificationIds && notificationIds.length > 0) {
        await prisma.$queryRaw`
          UPDATE reaction_notifications 
          SET is_read = true, read_at = NOW()
          WHERE id = ANY(${notificationIds}::text[]) 
          AND recipient_user_id = ${userId}::text
        `;
      }

      return reply.send({
        success: true,
        message: "Notifications marked as read"
      });

    } catch (error) {
      fastify.log.error('Error marking notifications as read:', error);
      return reply.code(500).send({
        success: false,
        error: "Failed to mark notifications as read"
      });
    }
  });

  // Create custom emoji
  fastify.post("/emoji", { 
    preHandler: [authMiddleware, validate({ body: reactionSchemas.customEmoji })] 
  }, async (request: any, reply) => {
    try {
      const { name, url, data, serverId, communityId, isGlobal } = request.body;
      const userId = request.userId;

      // Check permissions for global emojis (admin only)
      if (isGlobal) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { flags: true }
        });
        
        // Check if user has admin flag (you may need to adjust this based on your permission system)
        if (!user || !(user.flags & 1)) { // Assuming flag 1 is admin
          return reply.code(403).send({
            success: false,
            error: "Insufficient permissions to create global emojis"
          });
        }
      }

      // Check server/community permissions
      if (serverId) {
        const serverMember = await prisma.serverMember.findUnique({
          where: { serverId_userId: { serverId, userId } }
        });
        
        if (!serverMember) {
          return reply.code(403).send({
            success: false,
            error: "Must be a server member to create server emojis"
          });
        }
      }

      if (communityId) {
        const communityMember = await prisma.communityMember.findUnique({
          where: { communityId_userId: { communityId, userId } }
        });
        
        if (!communityMember) {
          return reply.code(403).send({
            success: false,
            error: "Must be a community member to create community emojis"
          });
        }
      }

      const emoji = await prisma.$queryRaw`
        INSERT INTO custom_emoji_reactions (emoji_name, emoji_url, emoji_data, server_id, community_id, is_global, created_by)
        VALUES (
          ${name}::text, 
          ${url || ''}::text, 
          ${data || ''}::text, 
          ${serverId || null}::text, 
          ${communityId || null}::text, 
          ${isGlobal}::boolean, 
          ${userId}::text
        )
        RETURNING *
      ` as any[];

      return reply.send({
        success: true,
        data: emoji[0],
        message: "Custom emoji created successfully"
      });

    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        return reply.code(409).send({
          success: false,
          error: "Emoji name already exists in this scope"
        });
      }
      
      fastify.log.error('Error creating custom emoji:', error);
      return reply.code(500).send({
        success: false,
        error: "Failed to create custom emoji"
      });
    }
  });

  // Get available emojis for user
  fastify.get("/emoji", async (request, reply) => {
    await optionalAuthMiddleware(request, reply);

    try {
      const { serverId, communityId } = z.object({
        serverId: z.string().optional(),
        communityId: z.string().optional()
      }).parse(request.query);

      let emojis = [];

      // Get global emojis
      const globalEmojis = await prisma.$queryRaw`
        SELECT * FROM custom_emoji_reactions 
        WHERE is_global = true AND is_active = true
        ORDER BY usage_count DESC, emoji_name ASC
      ` as any[];

      emojis = [...globalEmojis];

      // Get server-specific emojis
      if (serverId) {
        const serverEmojis = await prisma.$queryRaw`
          SELECT * FROM custom_emoji_reactions 
          WHERE server_id = ${serverId}::text AND is_active = true
          ORDER BY usage_count DESC, emoji_name ASC
        ` as any[];
        emojis = [...emojis, ...serverEmojis];
      }

      // Get community-specific emojis
      if (communityId) {
        const communityEmojis = await prisma.$queryRaw`
          SELECT * FROM custom_emoji_reactions 
          WHERE community_id = ${communityId}::text AND is_active = true
          ORDER BY usage_count DESC, emoji_name ASC
        ` as any[];
        emojis = [...emojis, ...communityEmojis];
      }

      return reply.send({
        success: true,
        data: {
          emojis,
          categories: {
            global: globalEmojis.length,
            server: serverId ? emojis.filter(e => e.server_id === serverId).length : 0,
            community: communityId ? emojis.filter(e => e.community_id === communityId).length : 0
          }
        }
      });

    } catch (error) {
      fastify.log.error('Error getting emojis:', error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get emojis"
      });
    }
  });

  // Get reaction leaderboard
  fastify.get("/leaderboard", async (request, reply) => {
    try {
      const { timeframe = '30d', limit = 20 } = z.object({
        timeframe: z.enum(['24h', '7d', '30d', 'all']).default('30d'),
        limit: z.coerce.number().min(1).max(100).default(20)
      }).parse(request.query);

      const leaderboard = await prisma.$queryRaw`
        SELECT * FROM reaction_leaderboard
        ORDER BY total_reactions_given DESC
        LIMIT ${limit}
      ` as any[];

      return reply.send({
        success: true,
        data: {
          leaderboard,
          timeframe,
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      fastify.log.error('Error getting leaderboard:', error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get leaderboard"
      });
    }
  });

  // Admin endpoint to manage reactions
  fastify.delete("/admin/:reactionId", { preHandler: [authMiddleware] }, async (request: any, reply) => {
    try {
      const { reactionId } = z.object({
        reactionId: z.string()
      }).parse(request.params);

      const userId = request.userId;

      // Check admin permissions
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { flags: true }
      });

      if (!user || !(user.flags & 1)) { // Assuming flag 1 is admin
        return reply.code(403).send({
          success: false,
          error: "Insufficient permissions"
        });
      }

      await prisma.$queryRaw`
        DELETE FROM enhanced_reactions WHERE id = ${reactionId}::text
      `;

      return reply.send({
        success: true,
        message: "Reaction removed by admin"
      });

    } catch (error) {
      fastify.log.error('Error removing reaction (admin):', error);
      return reply.code(500).send({
        success: false,
        error: "Failed to remove reaction"
      });
    }
  });
};

export default reactionRoutes;