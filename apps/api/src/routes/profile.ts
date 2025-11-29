import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@cryb/database';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { sendSuccess, ErrorResponses, sendCreated } from '../utils/responses';
import { paginationQuerySchema, createPaginatedResult } from '../utils/pagination';

/**
 * Profile Management Routes
 * 
 * Essential frontend endpoints for user profiles:
 * - Profile viewing and editing
 * - Avatar and banner management
 * - Social links management
 * - Profile statistics
 * - Activity history
 * - Account security settings
 */

// Validation schemas
const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(1000).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url().optional(),
  pronouns: z.string().max(50).optional(),
  birthDate: z.coerce.date().optional(),
  occupation: z.string().max(100).optional(),
  education: z.string().max(100).optional(),
  interests: z.array(z.string().max(50)).max(20).optional(),
  socialLinks: z.array(
    z.object({
      platform: z.enum(['twitter', 'instagram', 'github', 'linkedin', 'youtube', 'twitch', 'discord', 'reddit', 'other']),
      url: z.string().url(),
      displayText: z.string().max(50).optional()
    })
  ).max(10).optional()
});

const updateSecuritySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128).optional(),
  email: z.string().email().optional(),
  twoFactorEnabled: z.boolean().optional()
}).refine(data => data.newPassword || data.email || data.twoFactorEnabled !== undefined, {
  message: 'At least one field must be provided to update'
});

const deactivateAccountSchema = z.object({
  password: z.string().min(1),
  reason: z.enum(['privacy', 'harassment', 'time', 'other']),
  feedback: z.string().max(500).optional(),
  reactivationDate: z.coerce.date().optional()
});

export default async function profileRoutes(fastify: FastifyInstance) {

  /**
   * Get current user's full profile
   */
  fastify.get('/me', {
    preHandler: authMiddleware,
    schema: {
      tags: ['profile'],
      summary: 'Get current user profile',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: request.userId! },
        include: {
          _count: {
            select: {
              posts: true,
              comments: true
            }
          }
        }
      });

      if (!user) {
        return ErrorResponses.notFound(reply, 'User not found');
      }

      // Parse JSON fields
      const socialLinks = user.socialLinks ? JSON.parse(user.socialLinks as string) : [];
      const interests = user.interests ? JSON.parse(user.interests as string) : [];

      // Calculate additional stats (simplified for now)
      const postUpvotes = 0;
      const commentUpvotes = 0; 
      const totalAwards = 0;

      const profile = {
        // Basic info
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        avatar: user.avatar,
        banner: user.banner,
        bio: user.bio,
        location: user.location,
        website: user.website,
        pronouns: user.pronouns,
        occupation: user.occupation,
        education: user.education,
        birthDate: user.birthDate,
        interests,
        socialLinks,
        
        // Status
        isVerified: user.isVerified,
        premiumType: user.premiumType,
        role: user.role,
        
        // Timestamps
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastActiveAt: user.lastActiveAt,
        
        // Stats
        stats: {
          posts: user._count.posts,
          comments: user._count.comments,
          followers: 0,
          following: 0,
          servers: 0,
          friends: 0,
          postUpvotes,
          commentUpvotes,
          totalUpvotes: postUpvotes + commentUpvotes,
          awards: totalAwards,
          accountAgeInDays: Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        },
        
        // Security info (sensitive data)
        security: {
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
          twoFactorEnabled: user.twoFactorEnabled,
          activeSessions: 0,
          lastLoginAt: null
        },
        
        // Active sessions
        sessions: []
      };

      sendSuccess(reply, profile);
    } catch (error) {
      fastify.log.error('Error fetching user profile:', error);
      ErrorResponses.internalError(reply, 'Failed to fetch user profile');
    }
  });

  /**
   * Update user profile
   */
  fastify.patch('/me', {
    preHandler: [authMiddleware, validate({ body: updateProfileSchema })],
    schema: {
      tags: ['profile'],
      summary: 'Update user profile',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    try {
      const updates = request.body as z.infer<typeof updateProfileSchema>;

      // Handle social links and interests as JSON
      const updateData: any = { ...updates };
      if (updates.socialLinks) {
        updateData.socialLinks = JSON.stringify(updates.socialLinks);
      }
      if (updates.interests) {
        updateData.interests = JSON.stringify(updates.interests);
      }
      updateData.updatedAt = new Date();

      // Check if username is being changed (if that field exists)
      if ((updates as any).username) {
        const existingUser = await prisma.user.findFirst({
          where: {
            username: (updates as any).username,
            id: { not: request.userId! }
          }
        });

        if (existingUser) {
          return ErrorResponses.conflict(reply, 'Username is already taken');
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: request.userId! },
        data: updateData,
        select: {
          id: true,
          username: true,
          displayName: true,
          bio: true,
          location: true,
          website: true,
          pronouns: true,
          occupation: true,
          education: true,
          birthDate: true,
          interests: true,
          socialLinks: true,
          updatedAt: true
        }
      });

      // Emit profile update event to WebSocket clients
      if (fastify.io) {
        fastify.io.to(`user:${request.userId}`).emit('profileUpdated', {
          userId: request.userId,
          updates: {
            displayName: updatedUser.displayName,
            bio: updatedUser.bio,
            avatar: (updatedUser as any).avatar
          }
        });
      }

      sendSuccess(reply, {
        message: 'Profile updated successfully',
        profile: {
          ...updatedUser,
          interests: updatedUser.interests ? JSON.parse(updatedUser.interests as string) : [],
          socialLinks: updatedUser.socialLinks ? JSON.parse(updatedUser.socialLinks as string) : []
        }
      });
    } catch (error) {
      fastify.log.error('Error updating user profile:', error);
      ErrorResponses.internalError(reply, 'Failed to update profile');
    }
  });

  /**
   * Upload profile avatar
   */
  fastify.post('/me/avatar', {
    preHandler: authMiddleware,
    schema: {
      tags: ['profile'],
      summary: 'Upload profile avatar',
      security: [{ Bearer: [] }],
      consumes: ['multipart/form-data']
    }
  }, async (request, reply) => {
    try {
      const data = await request.file();
      
      if (!data) {
        return ErrorResponses.badRequest(reply, 'No file uploaded');
      }

      // Validate file type and size
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(data.mimetype)) {
        return ErrorResponses.badRequest(reply, 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed');
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      const chunks = [];
      let totalSize = 0;

      for await (const chunk of data.file) {
        totalSize += chunk.length;
        if (totalSize > maxSize) {
          return ErrorResponses.badRequest(reply, 'File too large. Maximum size is 5MB');
        }
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);

      // Upload to file service
      if (!fastify.services?.fileUpload) {
        return ErrorResponses.serviceUnavailable(reply, 'File upload service unavailable');
      }

      const filename = `users/${request.userId}/avatar_${Date.now()}.${data.mimetype.split('/')[1]}`;
      const uploadResult = await fastify.services.fileUpload.uploadBuffer(
        buffer,
        filename,
        data.mimetype
      );

      // Update user avatar
      const updatedUser = await prisma.user.update({
        where: { id: request.userId! },
        data: {
          avatar: uploadResult.url,
          updatedAt: new Date()
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true
        }
      });

      // Emit avatar update to WebSocket clients
      if (fastify.io) {
        fastify.io.to(`user:${request.userId}`).emit('avatarUpdated', {
          userId: request.userId,
          avatar: updatedUser.avatar
        });
      }

      sendSuccess(reply, {
        message: 'Avatar uploaded successfully',
        avatar: updatedUser.avatar,
        user: updatedUser
      });
    } catch (error) {
      fastify.log.error('Error uploading avatar:', error);
      ErrorResponses.internalError(reply, 'Failed to upload avatar');
    }
  });

  /**
   * Upload profile banner
   */
  fastify.post('/me/banner', {
    preHandler: authMiddleware,
    schema: {
      tags: ['profile'],
      summary: 'Upload profile banner',
      security: [{ Bearer: [] }],
      consumes: ['multipart/form-data']
    }
  }, async (request, reply) => {
    try {
      const data = await request.file();
      
      if (!data) {
        return ErrorResponses.badRequest(reply, 'No file uploaded');
      }

      // Validate file type and size
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(data.mimetype)) {
        return ErrorResponses.badRequest(reply, 'Invalid file type. Only JPEG, PNG, and WebP are allowed');
      }

      const maxSize = 10 * 1024 * 1024; // 10MB for banners
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

      // Upload to file service
      if (!fastify.services?.fileUpload) {
        return ErrorResponses.serviceUnavailable(reply, 'File upload service unavailable');
      }

      const filename = `users/${request.userId}/banner_${Date.now()}.${data.mimetype.split('/')[1]}`;
      const uploadResult = await fastify.services.fileUpload.uploadBuffer(
        buffer,
        filename,
        data.mimetype
      );

      // Update user banner
      const updatedUser = await prisma.user.update({
        where: { id: request.userId! },
        data: {
          banner: uploadResult.url,
          updatedAt: new Date()
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          banner: true
        }
      });

      sendSuccess(reply, {
        message: 'Banner uploaded successfully',
        banner: updatedUser.banner,
        user: updatedUser
      });
    } catch (error) {
      fastify.log.error('Error uploading banner:', error);
      ErrorResponses.internalError(reply, 'Failed to upload banner');
    }
  });

  /**
   * Get user activity history
   */
  fastify.get('/me/activity', {
    preHandler: [authMiddleware, validate({ query: paginationQuerySchema })],
    schema: {
      tags: ['profile'],
      summary: 'Get user activity history',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    try {
      const { page, limit, sort = 'createdAt', order } = request.query as any;

      // Get recent posts, comments, and other activities
      const [posts, comments, total] = await Promise.all([
        prisma.post.findMany({
          where: { userId: request.userId! },
          select: {
            id: true,
            title: true,
            createdAt: true,
            community: { select: { name: true, displayName: true } },
            _count: { select: { comments: true, votes: true } }
          },
          orderBy: { [sort]: order },
          take: Math.floor(limit / 2),
          skip: Math.floor(((page - 1) * limit) / 2)
        }),
        prisma.comment.findMany({
          where: { userId: request.userId! },
          select: {
            id: true,
            content: true,
            createdAt: true,
            post: { 
              select: { 
                id: true, 
                title: true,
                community: { select: { name: true } }
              } 
            },
            _count: { select: { votes: true } }
          },
          orderBy: { [sort]: order },
          take: Math.ceil(limit / 2),
          skip: Math.ceil(((page - 1) * limit) / 2)
        }),
        prisma.post.count({ where: { userId: request.userId! } }) + 
        prisma.comment.count({ where: { userId: request.userId! } })
      ]);

      // Combine and sort activities
      const activities = [
        ...posts.map(post => ({
          id: post.id,
          type: 'post' as const,
          title: post.title,
          createdAt: post.createdAt,
          community: post.community,
          stats: { comments: post._count.comments, votes: post._count.votes }
        })),
        ...comments.map(comment => ({
          id: comment.id,
          type: 'comment' as const,
          content: comment.content.substring(0, 200),
          createdAt: comment.createdAt,
          post: comment.post,
          stats: { votes: comment._count.votes }
        }))
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const result = createPaginatedResult(activities, total, { page, limit, sort, order });
      
      sendSuccess(reply, result);
    } catch (error) {
      fastify.log.error('Error fetching user activity:', error);
      ErrorResponses.internalError(reply, 'Failed to fetch user activity');
    }
  });

  /**
   * Update security settings
   */
  fastify.patch('/me/security', {
    preHandler: [authMiddleware, validate({ body: updateSecuritySchema })],
    schema: {
      tags: ['profile'],
      summary: 'Update security settings',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    try {
      const { currentPassword, newPassword, email, twoFactorEnabled } = request.body as z.infer<typeof updateSecuritySchema>;

      // Verify current password
      const user = await prisma.user.findUnique({
        where: { id: request.userId! },
        select: { id: true, passwordHash: true, email: true }
      });

      if (!user) {
        return ErrorResponses.notFound(reply, 'User not found');
      }

      // Verify password
      const { verifyPassword } = await import('@cryb/auth');
      const isValidPassword = await verifyPassword(currentPassword, user.passwordHash);
      
      if (!isValidPassword) {
        return ErrorResponses.unauthorized(reply, 'Current password is incorrect');
      }

      const updates: any = { updatedAt: new Date() };

      // Update password if provided
      if (newPassword) {
        const { hashPassword } = await import('@cryb/auth');
        updates.passwordHash = await hashPassword(newPassword);
      }

      // Update email if provided
      if (email && email !== user.email) {
        // Check if email is already taken
        const existingUser = await prisma.user.findFirst({
          where: { email, id: { not: request.userId! } }
        });

        if (existingUser) {
          return ErrorResponses.conflict(reply, 'Email is already in use');
        }

        updates.email = email;
        updates.emailVerified = false; // Require re-verification
      }

      // Update 2FA setting
      if (twoFactorEnabled !== undefined) {
        updates.twoFactorEnabled = twoFactorEnabled;
      }

      await prisma.user.update({
        where: { id: request.userId! },
        data: updates
      });

      sendSuccess(reply, {
        message: 'Security settings updated successfully',
        changes: {
          passwordChanged: !!newPassword,
          emailChanged: !!email,
          twoFactorChanged: twoFactorEnabled !== undefined
        }
      });
    } catch (error) {
      fastify.log.error('Error updating security settings:', error);
      ErrorResponses.internalError(reply, 'Failed to update security settings');
    }
  });

  /**
   * Get account sessions
   */
  fastify.get('/me/sessions', {
    preHandler: authMiddleware,
    schema: {
      tags: ['profile'],
      summary: 'Get account sessions',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    try {
      const sessions = await prisma.session.findMany({
        where: { userId: request.userId! },
        select: {
          id: true,
          deviceName: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
          lastUsedAt: true,
          expiresAt: true,
          isActive: true
        },
        orderBy: { lastUsedAt: 'desc' }
      });

      // Parse user agents for better display
      const sessionsWithDetails = sessions.map(session => ({
        ...session,
        isCurrent: session.id === (request as any).sessionId,
        browserInfo: parseUserAgent(session.userAgent || ''),
        location: parseIPLocation(session.ipAddress || '')
      }));

      sendSuccess(reply, {
        sessions: sessionsWithDetails,
        totalSessions: sessions.length,
        activeSessions: sessions.filter(s => s.isActive).length
      });
    } catch (error) {
      fastify.log.error('Error fetching user sessions:', error);
      ErrorResponses.internalError(reply, 'Failed to fetch user sessions');
    }
  });

  /**
   * Revoke session
   */
  fastify.delete('/me/sessions/:sessionId', {
    preHandler: authMiddleware,
    schema: {
      tags: ['profile'],
      summary: 'Revoke user session',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    try {
      const { sessionId } = request.params as { sessionId: string };

      const session = await prisma.session.findFirst({
        where: { 
          id: sessionId,
          userId: request.userId! 
        }
      });

      if (!session) {
        return ErrorResponses.notFound(reply, 'Session not found');
      }

      await prisma.session.delete({
        where: { id: sessionId }
      });

      sendSuccess(reply, {
        message: 'Session revoked successfully',
        revokedSessionId: sessionId
      });
    } catch (error) {
      fastify.log.error('Error revoking session:', error);
      ErrorResponses.internalError(reply, 'Failed to revoke session');
    }
  });

  /**
   * Deactivate account
   */
  fastify.post('/me/deactivate', {
    preHandler: [authMiddleware, validate({ body: deactivateAccountSchema })],
    schema: {
      tags: ['profile'],
      summary: 'Deactivate user account',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    try {
      const { password, reason, feedback, reactivationDate } = request.body as z.infer<typeof deactivateAccountSchema>;

      // Verify password
      const user = await prisma.user.findUnique({
        where: { id: request.userId! },
        select: { passwordHash: true }
      });

      if (!user) {
        return ErrorResponses.notFound(reply, 'User not found');
      }

      const { verifyPassword } = await import('@cryb/auth');
      const isValidPassword = await verifyPassword(password, user.passwordHash);
      
      if (!isValidPassword) {
        return ErrorResponses.unauthorized(reply, 'Password is incorrect');
      }

      // Deactivate account
      await prisma.user.update({
        where: { id: request.userId! },
        data: {
          isActive: false,
          deactivatedAt: new Date(),
          deactivationReason: reason,
          deactivationFeedback: feedback,
          reactivationDate: reactivationDate || null,
          updatedAt: new Date()
        }
      });

      // Revoke all sessions
      await prisma.session.deleteMany({
        where: { userId: request.userId! }
      });

      sendSuccess(reply, {
        message: 'Account deactivated successfully',
        deactivatedAt: new Date().toISOString(),
        reactivationDate: reactivationDate?.toISOString()
      });
    } catch (error) {
      fastify.log.error('Error deactivating account:', error);
      ErrorResponses.internalError(reply, 'Failed to deactivate account');
    }
  });
}

// Helper functions
function parseUserAgent(userAgent: string): any {
  // Simple user agent parsing - in production, use a proper library
  const browserRegex = /(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/i;
  const osRegex = /(Windows|Mac|Linux|Android|iOS)/i;
  
  const browser = userAgent.match(browserRegex)?.[1] || 'Unknown';
  const os = userAgent.match(osRegex)?.[1] || 'Unknown';
  
  return { browser, os, raw: userAgent };
}

function parseIPLocation(ip: string): any {
  // Placeholder for IP geolocation - in production, use a service like MaxMind
  return { 
    ip,
    country: 'Unknown',
    region: 'Unknown',
    city: 'Unknown'
  };
}