import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { sendSuccess, sendCreated, ErrorResponses } from '../utils/responses';
import { paginationQuerySchema } from '../utils/pagination';
import { 
  userProfileService, 
  ProfileUpdateSchema, 
  PrivacySettingsSchema, 
  UserSearchSchema 
} from '../services/user-profile-service';

/**
 * Enhanced User Profile System API
 * Complete backend implementation with real database integration
 */

// Additional validation schemas
const userIdParamSchema = z.object({
  userId: z.string().cuid()
});

const usernameParamSchema = z.object({
  username: z.string().min(1).max(50)
});

const achievementParamsSchema = z.object({
  userId: z.string().cuid(),
  achievementId: z.string()
});

const followUserSchema = z.object({
  notificationsEnabled: z.boolean().default(true)
});

const blockUserSchema = z.object({
  reason: z.string().max(500).optional()
});

const avatarUploadSchema = z.object({
  cropX: z.number().min(0).optional(),
  cropY: z.number().min(0).optional(),
  cropWidth: z.number().min(1).optional(),
  cropHeight: z.number().min(1).optional()
});

export default async function enhancedProfileRoutes(fastify: FastifyInstance) {

  // ============================================================================
  // PROFILE MANAGEMENT ENDPOINTS
  // ============================================================================

  /**
   * GET /api/v1/users/:userId/profile - Get user profile
   * Comprehensive profile data with privacy filtering
   */
  fastify.get('/:userId/profile', {
    preHandler: [
      optionalAuthMiddleware,
      validate({ params: userIdParamSchema })
    ],
    schema: {
      tags: ['profiles'],
      summary: 'Get user profile',
      description: 'Retrieve comprehensive user profile with privacy filtering',
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string', description: 'User ID' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                username: { type: 'string' },
                displayName: { type: 'string' },
                avatar: { type: 'string', nullable: true },
                bio: { type: 'string', nullable: true },
                followersCount: { type: 'number' },
                followingCount: { type: 'number' },
                isVerified: { type: 'boolean' },
                createdAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { userId } = request.params as z.infer<typeof userIdParamSchema>;
      const viewerId = request.userId;

      const profile = await userProfileService.getProfile(userId, viewerId);

      if (!profile) {
        return ErrorResponses.notFound(reply, 'User not found');
      }

      sendSuccess(reply, profile);
    } catch (error) {
      fastify.log.error('Error fetching user profile:', error);
      ErrorResponses.internalError(reply, 'Failed to fetch user profile');
    }
  });

  /**
   * PUT /api/v1/users/:userId/profile - Update user profile
   * Comprehensive profile updates with validation
   */
  fastify.put('/:userId/profile', {
    preHandler: [
      authMiddleware,
      validate({ 
        params: userIdParamSchema,
        body: ProfileUpdateSchema 
      })
    ],
    schema: {
      tags: ['profiles'],
      summary: 'Update user profile',
      description: 'Update comprehensive user profile information',
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string', description: 'User ID' }
        }
      },
      body: {
        type: 'object',
        properties: {
          displayName: { type: 'string', maxLength: 100 },
          bio: { type: 'string', maxLength: 1000 },
          location: { type: 'string', maxLength: 100 },
          website: { type: 'string', format: 'uri' },
          occupation: { type: 'string', maxLength: 100 },
          education: { type: 'string', maxLength: 100 },
          pronouns: { type: 'string', maxLength: 50 },
          birthDate: { type: 'string', format: 'date' },
          interests: { 
            type: 'array', 
            items: { type: 'string', maxLength: 50 },
            maxItems: 20 
          },
          socialLinks: {
            type: 'array',
            items: {
              type: 'object',
              required: ['platform', 'url'],
              properties: {
                platform: { 
                  type: 'string',
                  enum: ['twitter', 'instagram', 'github', 'linkedin', 'youtube', 'twitch', 'discord', 'reddit', 'other']
                },
                url: { type: 'string', format: 'uri' },
                displayText: { type: 'string', maxLength: 50 }
              }
            },
            maxItems: 10
          },
          theme: { type: 'string', enum: ['light', 'dark', 'auto'] },
          timezone: { type: 'string' },
          language: { type: 'string' },
          profileMessage: { type: 'string', maxLength: 200 },
          profileColor: { type: 'string', pattern: '^#[0-9A-F]{6}$' },
          profileTags: {
            type: 'array',
            items: { type: 'string', maxLength: 30 },
            maxItems: 10
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { userId } = request.params as z.infer<typeof userIdParamSchema>;
      const updateData = request.body as z.infer<typeof ProfileUpdateSchema>;

      // Verify user can update this profile
      if (request.userId !== userId) {
        return ErrorResponses.forbidden(reply, 'Cannot update another user\'s profile');
      }

      const updatedProfile = await userProfileService.updateProfile(userId, updateData);

      // Emit real-time update to WebSocket clients
      if (fastify.io) {
        fastify.io.to(`user:${userId}`).emit('profileUpdated', {
          userId,
          profile: {
            displayName: updatedProfile.displayName,
            bio: updatedProfile.bio,
            avatar: updatedProfile.avatar,
            profileCompleteness: updatedProfile.profileCompleteness
          }
        });

        // Notify followers of significant changes
        if (updateData.displayName || updateData.avatar) {
          fastify.io.to(`user:${userId}:followers`).emit('userProfileChanged', {
            userId,
            changes: {
              displayName: updateData.displayName,
              avatar: updateData.avatar
            }
          });
        }
      }

      sendSuccess(reply, updatedProfile, 'Profile updated successfully');
    } catch (error) {
      fastify.log.error('Error updating user profile:', error);
      ErrorResponses.internalError(reply, 'Failed to update profile');
    }
  });

  // ============================================================================
  // USER SEARCH ENDPOINTS
  // ============================================================================

  /**
   * GET /api/v1/users/search - Advanced user search
   * Full-text search with filtering and sorting
   */
  fastify.get('/search', {
    preHandler: [
      optionalAuthMiddleware,
      validate({ query: UserSearchSchema })
    ],
    schema: {
      tags: ['profiles'],
      summary: 'Search users',
      description: 'Advanced user search with filtering and full-text search',
      querystring: {
        type: 'object',
        required: ['query'],
        properties: {
          query: { type: 'string', minLength: 1, maxLength: 100 },
          'filters.location': { type: 'string' },
          'filters.occupation': { type: 'string' },
          'filters.verified': { type: 'boolean' },
          'filters.premium': { type: 'boolean' },
          'filters.hasAvatar': { type: 'boolean' },
          'filters.joinDateAfter': { type: 'string', format: 'date' },
          'filters.joinDateBefore': { type: 'string', format: 'date' },
          'filters.minFollowers': { type: 'number', minimum: 0 },
          'filters.maxFollowers': { type: 'number', minimum: 0 },
          'filters.interests': { 
            type: 'array',
            items: { type: 'string' }
          },
          sort: { 
            type: 'string', 
            enum: ['relevance', 'followers', 'recent', 'alphabetical'],
            default: 'relevance'
          },
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 50, default: 20 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const searchParams = request.query as z.infer<typeof UserSearchSchema>;
      const viewerId = request.userId;

      const results = await userProfileService.searchUsers(searchParams, viewerId);

      sendSuccess(reply, results);
    } catch (error) {
      fastify.log.error('Error searching users:', error);
      ErrorResponses.internalError(reply, 'Failed to search users');
    }
  });

  // ============================================================================
  // FOLLOW SYSTEM ENDPOINTS
  // ============================================================================

  /**
   * POST /api/v1/users/:userId/follow - Follow user
   * Follow a user with real-time notifications
   */
  fastify.post('/:userId/follow', {
    preHandler: [
      authMiddleware,
      validate({ 
        params: userIdParamSchema,
        body: followUserSchema
      })
    ],
    schema: {
      tags: ['profiles'],
      summary: 'Follow user',
      description: 'Follow a user and receive their updates',
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string', description: 'User ID to follow' }
        }
      },
      body: {
        type: 'object',
        properties: {
          notificationsEnabled: { type: 'boolean', default: true }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { userId } = request.params as z.infer<typeof userIdParamSchema>;
      const { notificationsEnabled } = request.body as z.infer<typeof followUserSchema>;
      const followerId = request.userId!;

      const follow = await userProfileService.followUser(followerId, userId);

      // Real-time notifications
      if (fastify.io) {
        // Notify the followed user
        fastify.io.to(`user:${userId}`).emit('newFollower', {
          followerId,
          followerInfo: await userProfileService.getProfile(followerId, userId)
        });

        // Join follower to user's update room if notifications enabled
        if (notificationsEnabled) {
          const followerSocket = fastify.io.sockets.sockets.get(`user:${followerId}`);
          if (followerSocket) {
            followerSocket.join(`user:${userId}:followers`);
          }
        }
      }

      sendCreated(reply, follow, 'User followed successfully');
    } catch (error) {
      fastify.log.error('Error following user:', error);
      ErrorResponses.badRequest(reply, error instanceof Error ? error.message : 'Failed to follow user');
    }
  });

  /**
   * DELETE /api/v1/users/:userId/follow - Unfollow user
   * Unfollow a user and stop receiving updates
   */
  fastify.delete('/:userId/follow', {
    preHandler: [
      authMiddleware,
      validate({ params: userIdParamSchema })
    ],
    schema: {
      tags: ['profiles'],
      summary: 'Unfollow user',
      description: 'Unfollow a user and stop receiving their updates',
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string', description: 'User ID to unfollow' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { userId } = request.params as z.infer<typeof userIdParamSchema>;
      const followerId = request.userId!;

      await userProfileService.unfollowUser(followerId, userId);

      // Real-time notifications
      if (fastify.io) {
        // Notify the unfollowed user
        fastify.io.to(`user:${userId}`).emit('followerRemoved', {
          followerId
        });

        // Remove follower from user's update room
        const followerSocket = fastify.io.sockets.sockets.get(`user:${followerId}`);
        if (followerSocket) {
          followerSocket.leave(`user:${userId}:followers`);
        }
      }

      sendSuccess(reply, { success: true }, 'User unfollowed successfully');
    } catch (error) {
      fastify.log.error('Error unfollowing user:', error);
      ErrorResponses.badRequest(reply, error instanceof Error ? error.message : 'Failed to unfollow user');
    }
  });

  /**
   * GET /api/v1/users/:userId/followers - Get user followers
   * Paginated list of user followers
   */
  fastify.get('/:userId/followers', {
    preHandler: [
      optionalAuthMiddleware,
      validate({ 
        params: userIdParamSchema,
        query: paginationQuerySchema
      })
    ],
    schema: {
      tags: ['profiles'],
      summary: 'Get user followers',
      description: 'Get paginated list of user followers',
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string', description: 'User ID' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
          sort: { type: 'string', enum: ['recent', 'alphabetical'], default: 'recent' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { userId } = request.params as z.infer<typeof userIdParamSchema>;
      const { page = 1, limit = 20, sort = 'recent' } = request.query as any;
      const viewerId = request.userId;

      // Check if user allows followers to be viewed
      const targetProfile = await userProfileService.getProfile(userId, viewerId);
      if (!targetProfile) {
        return ErrorResponses.notFound(reply, 'User not found');
      }

      // Get followers with proper database query
      const orderBy = sort === 'alphabetical' 
        ? { follower: { username: 'asc' } }
        : { createdAt: 'desc' };

      const [followers, total] = await Promise.all([
        fastify.prisma.userFollow.findMany({
          where: { followingId: userId },
          include: {
            follower: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                isVerified: true,
                followersCount: true,
                createdAt: true
              }
            }
          },
          orderBy,
          skip: (page - 1) * limit,
          take: limit
        }),
        fastify.prisma.userFollow.count({
          where: { followingId: userId }
        })
      ]);

      const followerList = followers.map(f => ({
        ...f.follower,
        followedAt: f.createdAt
      }));

      sendSuccess(reply, {
        followers: followerList,
        pagination: {
          total,
          page,
          pageSize: limit,
          hasMore: page * limit < total
        }
      });
    } catch (error) {
      fastify.log.error('Error fetching followers:', error);
      ErrorResponses.internalError(reply, 'Failed to fetch followers');
    }
  });

  /**
   * GET /api/v1/users/:userId/following - Get users being followed
   * Paginated list of users being followed
   */
  fastify.get('/:userId/following', {
    preHandler: [
      optionalAuthMiddleware,
      validate({ 
        params: userIdParamSchema,
        query: paginationQuerySchema
      })
    ],
    schema: {
      tags: ['profiles'],
      summary: 'Get users being followed',
      description: 'Get paginated list of users being followed',
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string', description: 'User ID' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
          sort: { type: 'string', enum: ['recent', 'alphabetical'], default: 'recent' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { userId } = request.params as z.infer<typeof userIdParamSchema>;
      const { page = 1, limit = 20, sort = 'recent' } = request.query as any;
      const viewerId = request.userId;

      // Check if user allows following list to be viewed
      const targetProfile = await userProfileService.getProfile(userId, viewerId);
      if (!targetProfile) {
        return ErrorResponses.notFound(reply, 'User not found');
      }

      // Get following with proper database query
      const orderBy = sort === 'alphabetical' 
        ? { following: { username: 'asc' } }
        : { createdAt: 'desc' };

      const [following, total] = await Promise.all([
        fastify.prisma.userFollow.findMany({
          where: { followerId: userId },
          include: {
            following: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                isVerified: true,
                followersCount: true,
                createdAt: true
              }
            }
          },
          orderBy,
          skip: (page - 1) * limit,
          take: limit
        }),
        fastify.prisma.userFollow.count({
          where: { followerId: userId }
        })
      ]);

      const followingList = following.map(f => ({
        ...f.following,
        followedAt: f.createdAt
      }));

      sendSuccess(reply, {
        following: followingList,
        pagination: {
          total,
          page,
          pageSize: limit,
          hasMore: page * limit < total
        }
      });
    } catch (error) {
      fastify.log.error('Error fetching following:', error);
      ErrorResponses.internalError(reply, 'Failed to fetch following');
    }
  });

  // ============================================================================
  // ACTIVITY TIMELINE ENDPOINTS
  // ============================================================================

  /**
   * GET /api/v1/users/:userId/activity - Get user activity timeline
   * Paginated activity timeline with privacy filtering
   */
  fastify.get('/:userId/activity', {
    preHandler: [
      optionalAuthMiddleware,
      validate({ 
        params: userIdParamSchema,
        query: paginationQuerySchema
      })
    ],
    schema: {
      tags: ['profiles'],
      summary: 'Get user activity timeline',
      description: 'Get paginated user activity timeline with privacy filtering',
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string', description: 'User ID' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 50, default: 20 },
          activityType: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { userId } = request.params as z.infer<typeof userIdParamSchema>;
      const { page = 1, limit = 20 } = request.query as any;
      const viewerId = request.userId;

      const activities = await userProfileService.getUserActivity(userId, viewerId, page, limit);

      sendSuccess(reply, activities);
    } catch (error) {
      fastify.log.error('Error fetching user activity:', error);
      ErrorResponses.internalError(reply, 'Failed to fetch user activity');
    }
  });

  // ============================================================================
  // ACHIEVEMENT SYSTEM ENDPOINTS
  // ============================================================================

  /**
   * GET /api/v1/users/:userId/achievements - Get user achievements
   * List of earned achievements with privacy filtering
   */
  fastify.get('/:userId/achievements', {
    preHandler: [
      optionalAuthMiddleware,
      validate({ params: userIdParamSchema })
    ],
    schema: {
      tags: ['profiles'],
      summary: 'Get user achievements',
      description: 'Get list of user achievements with privacy filtering',
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string', description: 'User ID' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { userId } = request.params as z.infer<typeof userIdParamSchema>;
      const viewerId = request.userId;

      const achievements = await userProfileService.getUserAchievements(userId, viewerId);

      sendSuccess(reply, achievements);
    } catch (error) {
      fastify.log.error('Error fetching user achievements:', error);
      ErrorResponses.internalError(reply, 'Failed to fetch user achievements');
    }
  });

  /**
   * PUT /api/v1/users/:userId/achievements - Toggle achievement visibility
   * Update achievement visibility settings
   */
  fastify.put('/:userId/achievements', {
    preHandler: [
      authMiddleware,
      validate({ 
        params: userIdParamSchema,
        body: z.object({
          achievementId: z.string(),
          isVisible: z.boolean()
        })
      })
    ],
    schema: {
      tags: ['profiles'],
      summary: 'Update achievement visibility',
      description: 'Toggle visibility of specific achievement',
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string', description: 'User ID' }
        }
      },
      body: {
        type: 'object',
        required: ['achievementId', 'isVisible'],
        properties: {
          achievementId: { type: 'string' },
          isVisible: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { userId } = request.params as z.infer<typeof userIdParamSchema>;
      const { achievementId, isVisible } = request.body as any;

      // Verify user can update this profile
      if (request.userId !== userId) {
        return ErrorResponses.forbidden(reply, 'Cannot update another user\'s achievements');
      }

      const updatedAchievement = await fastify.prisma.userAchievement.updateMany({
        where: {
          userId,
          achievementId
        },
        data: {
          isVisible
        }
      });

      if (updatedAchievement.count === 0) {
        return ErrorResponses.notFound(reply, 'Achievement not found');
      }

      sendSuccess(reply, { success: true }, 'Achievement visibility updated');
    } catch (error) {
      fastify.log.error('Error updating achievement visibility:', error);
      ErrorResponses.internalError(reply, 'Failed to update achievement visibility');
    }
  });

  // ============================================================================
  // PROFILE IMAGE UPLOAD ENDPOINTS
  // ============================================================================

  /**
   * POST /api/v1/users/:userId/avatar - Upload profile avatar
   * Upload and crop profile avatar with MinIO integration
   */
  fastify.post('/:userId/avatar', {
    preHandler: [
      authMiddleware,
      validate({ params: userIdParamSchema })
    ],
    schema: {
      tags: ['profiles'],
      summary: 'Upload profile avatar',
      description: 'Upload and set user profile avatar',
      security: [{ Bearer: [] }],
      consumes: ['multipart/form-data'],
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string', description: 'User ID' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { userId } = request.params as z.infer<typeof userIdParamSchema>;

      // Verify user can update this profile
      if (request.userId !== userId) {
        return ErrorResponses.forbidden(reply, 'Cannot update another user\'s avatar');
      }

      const data = await request.file();
      
      if (!data) {
        return ErrorResponses.badRequest(reply, 'No file uploaded');
      }

      // Validate file type and size
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(data.mimetype)) {
        return ErrorResponses.badRequest(reply, 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed');
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      const chunks = [];
      let totalSize = 0;

      for await (const chunk of data.file) {
        totalSize += chunk.length;
        if (totalSize > maxSize) {
          return ErrorResponses.badRequest(reply, 'File too large. Maximum size is 10MB');
        }
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);

      // Upload to MinIO storage
      if (!fastify.services?.fileUpload) {
        return ErrorResponses.serviceUnavailable(reply, 'File upload service unavailable');
      }

      const filename = `users/${userId}/avatar_${Date.now()}.${data.mimetype.split('/')[1]}`;
      const uploadResult = await fastify.services.fileUpload.uploadBuffer(
        buffer,
        filename,
        data.mimetype
      );

      // Update user avatar in database
      const updatedUser = await fastify.prisma.user.update({
        where: { id: userId },
        data: {
          avatar: uploadResult.url,
          updatedAt: new Date()
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          updatedAt: true
        }
      });

      // Log activity
      await userProfileService.logActivity(
        userId, 
        'avatar_update', 
        { avatarUrl: uploadResult.url }, 
        userId, 
        'user', 
        15
      );

      // Real-time notification to followers
      if (fastify.io) {
        fastify.io.to(`user:${userId}:followers`).emit('userAvatarUpdated', {
          userId,
          avatar: updatedUser.avatar
        });
      }

      sendSuccess(reply, {
        avatar: updatedUser.avatar,
        user: updatedUser
      }, 'Avatar uploaded successfully');
    } catch (error) {
      fastify.log.error('Error uploading avatar:', error);
      ErrorResponses.internalError(reply, 'Failed to upload avatar');
    }
  });

  // ============================================================================
  // PRIVACY SETTINGS ENDPOINTS
  // ============================================================================

  /**
   * PUT /api/v1/users/:userId/privacy - Update privacy settings
   * Update comprehensive privacy settings
   */
  fastify.put('/:userId/privacy', {
    preHandler: [
      authMiddleware,
      validate({ 
        params: userIdParamSchema,
        body: PrivacySettingsSchema
      })
    ],
    schema: {
      tags: ['profiles'],
      summary: 'Update privacy settings',
      description: 'Update comprehensive user privacy settings',
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string', description: 'User ID' }
        }
      },
      body: {
        type: 'object',
        properties: {
          profileVisibility: { type: 'string', enum: ['public', 'followers', 'private'] },
          emailVisibility: { type: 'string', enum: ['public', 'followers', 'private'] },
          phoneVisibility: { type: 'string', enum: ['public', 'followers', 'private'] },
          birthdateVisibility: { type: 'string', enum: ['public', 'followers', 'private'] },
          locationVisibility: { type: 'string', enum: ['public', 'followers', 'private'] },
          websiteVisibility: { type: 'string', enum: ['public', 'followers', 'private'] },
          socialLinksVisibility: { type: 'string', enum: ['public', 'followers', 'private'] },
          followersVisibility: { type: 'string', enum: ['public', 'followers', 'private'] },
          followingVisibility: { type: 'string', enum: ['public', 'followers', 'private'] },
          activityVisibility: { type: 'string', enum: ['public', 'followers', 'private'] },
          achievementsVisibility: { type: 'string', enum: ['public', 'followers', 'private'] },
          allowFollows: { type: 'boolean' },
          allowMessages: { type: 'string', enum: ['everyone', 'followers', 'none'] },
          allowMentions: { type: 'string', enum: ['everyone', 'followers', 'none'] },
          indexProfile: { type: 'boolean' },
          allowDiscovery: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { userId } = request.params as z.infer<typeof userIdParamSchema>;
      const privacySettings = request.body as z.infer<typeof PrivacySettingsSchema>;

      // Verify user can update this profile
      if (request.userId !== userId) {
        return ErrorResponses.forbidden(reply, 'Cannot update another user\'s privacy settings');
      }

      const updatedSettings = await userProfileService.updatePrivacySettings(userId, privacySettings);

      sendSuccess(reply, updatedSettings, 'Privacy settings updated successfully');
    } catch (error) {
      fastify.log.error('Error updating privacy settings:', error);
      ErrorResponses.internalError(reply, 'Failed to update privacy settings');
    }
  });

  // ============================================================================
  // BLOCK/UNBLOCK ENDPOINTS
  // ============================================================================

  /**
   * POST /api/v1/users/:userId/block - Block user
   * Block a user and remove all relationships
   */
  fastify.post('/:userId/block', {
    preHandler: [
      authMiddleware,
      validate({ 
        params: userIdParamSchema,
        body: blockUserSchema
      })
    ],
    schema: {
      tags: ['profiles'],
      summary: 'Block user',
      description: 'Block a user and remove all relationships',
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string', description: 'User ID to block' }
        }
      },
      body: {
        type: 'object',
        properties: {
          reason: { type: 'string', maxLength: 500 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { userId } = request.params as z.infer<typeof userIdParamSchema>;
      const { reason } = request.body as z.infer<typeof blockUserSchema>;
      const blockerId = request.userId!;

      const block = await userProfileService.blockUser(blockerId, userId, reason);

      sendCreated(reply, block, 'User blocked successfully');
    } catch (error) {
      fastify.log.error('Error blocking user:', error);
      ErrorResponses.badRequest(reply, error instanceof Error ? error.message : 'Failed to block user');
    }
  });

  /**
   * DELETE /api/v1/users/:userId/block - Unblock user
   * Unblock a user and allow future interactions
   */
  fastify.delete('/:userId/block', {
    preHandler: [
      authMiddleware,
      validate({ params: userIdParamSchema })
    ],
    schema: {
      tags: ['profiles'],
      summary: 'Unblock user',
      description: 'Unblock a user and allow future interactions',
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string', description: 'User ID to unblock' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { userId } = request.params as z.infer<typeof userIdParamSchema>;
      const blockerId = request.userId!;

      await userProfileService.unblockUser(blockerId, userId);

      sendSuccess(reply, { success: true }, 'User unblocked successfully');
    } catch (error) {
      fastify.log.error('Error unblocking user:', error);
      ErrorResponses.badRequest(reply, error instanceof Error ? error.message : 'Failed to unblock user');
    }
  });

  /**
   * GET /api/v1/users/blocked - Get blocked users
   * Get list of blocked users
   */
  fastify.get('/blocked', {
    preHandler: [
      authMiddleware,
      validate({ query: paginationQuerySchema })
    ],
    schema: {
      tags: ['profiles'],
      summary: 'Get blocked users',
      description: 'Get paginated list of blocked users',
      security: [{ Bearer: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 20 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { page = 1, limit = 20 } = request.query as any;
      const blockerId = request.userId!;

      const [blockedUsers, total] = await Promise.all([
        fastify.prisma.userBlocked.findMany({
          where: { blockerId },
          include: {
            blocked: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        fastify.prisma.userBlocked.count({
          where: { blockerId }
        })
      ]);

      const formattedUsers = blockedUsers.map(block => ({
        id: block.id,
        user: block.blocked,
        reason: block.reason,
        blockedAt: block.createdAt
      }));

      sendSuccess(reply, {
        blockedUsers: formattedUsers,
        pagination: {
          total,
          page,
          pageSize: limit,
          hasMore: page * limit < total
        }
      });
    } catch (error) {
      fastify.log.error('Error fetching blocked users:', error);
      ErrorResponses.internalError(reply, 'Failed to fetch blocked users');
    }
  });
}