import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@cryb/database';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { sendSuccess, sendError, ErrorResponses } from '../utils/responses';

/**
 * User Preferences Routes
 * 
 * Essential frontend endpoints for user customization:
 * - Theme preferences (dark/light mode)
 * - Language settings
 * - Privacy settings
 * - Display preferences
 * - Accessibility settings
 */

// Validation schemas
const updatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().min(2).max(10).optional(),
  timezone: z.string().optional(),
  dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']).optional(),
  timeFormat: z.enum(['12h', '24h']).optional(),
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url().optional(),
  pronouns: z.string().max(50).optional(),
  showOnlineStatus: z.boolean().optional(),
  allowDirectMessages: z.enum(['everyone', 'friends', 'nobody']).optional(),
  showEmail: z.boolean().optional(),
  compactMode: z.boolean().optional(),
  reducedMotion: z.boolean().optional(),
  highContrast: z.boolean().optional(),
  fontSize: z.enum(['small', 'medium', 'large', 'xlarge']).optional(),
  soundEnabled: z.boolean().optional(),
  desktopNotifications: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  nsfw: z.boolean().optional(),
  autoplayVideos: z.boolean().optional(),
  showAvatars: z.boolean().optional(),
  hideScores: z.boolean().optional()
});

const privacySettingsSchema = z.object({
  profileVisibility: z.enum(['public', 'friends', 'private']).optional(),
  showOnlineStatus: z.boolean().optional(),
  allowDirectMessages: z.enum(['everyone', 'friends', 'nobody']).optional(),
  showEmail: z.boolean().optional(),
  showJoinDate: z.boolean().optional(),
  indexBySearchEngines: z.boolean().optional(),
  allowFriendRequests: z.boolean().optional(),
  showActiveInCommunities: z.boolean().optional(),
  showCommentHistory: z.boolean().optional(),
  showPostHistory: z.boolean().optional()
});

const displaySettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  compactMode: z.boolean().optional(),
  reducedMotion: z.boolean().optional(),
  highContrast: z.boolean().optional(),
  fontSize: z.enum(['small', 'medium', 'large', 'xlarge']).optional(),
  showAvatars: z.boolean().optional(),
  hideScores: z.boolean().optional(),
  autoplayVideos: z.boolean().optional(),
  showNsfw: z.boolean().optional(),
  blurNsfw: z.boolean().optional(),
  infiniteScroll: z.boolean().optional(),
  postsPerPage: z.number().min(5).max(100).optional()
});

const notificationSettingsSchema = z.object({
  desktopNotifications: z.boolean().optional(),
  soundEnabled: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  mentions: z.boolean().optional(),
  directMessages: z.boolean().optional(),
  friendRequests: z.boolean().optional(),
  postReplies: z.boolean().optional(),
  commentReplies: z.boolean().optional(),
  upvotes: z.boolean().optional(),
  awards: z.boolean().optional(),
  communityInvites: z.boolean().optional(),
  serverInvites: z.boolean().optional(),
  liveStreams: z.boolean().optional(),
  emailDigest: z.enum(['off', 'daily', 'weekly']).optional(),
  pushNotifications: z.boolean().optional(),
  quietHours: z.object({
    enabled: z.boolean(),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  }).optional()
});

const accessibilitySettingsSchema = z.object({
  reducedMotion: z.boolean().optional(),
  highContrast: z.boolean().optional(),
  fontSize: z.enum(['small', 'medium', 'large', 'xlarge']).optional(),
  screenReader: z.boolean().optional(),
  keyboardNavigation: z.boolean().optional(),
  focusIndicator: z.boolean().optional(),
  colorBlindFriendly: z.boolean().optional(),
  altTextRequired: z.boolean().optional()
});

export default async function userPreferencesRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authMiddleware);

  /**
   * Get user preferences
   */
  fastify.get('/', {
    schema: {
      tags: ['user-preferences'],
      summary: 'Get user preferences',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: request.userId! },
        select: {
          id: true,
          displayName: true,
          bio: true,
          location: true,
          website: true,
          pronouns: true,
          locale: true,
          preferences: true,
          privacySettings: true,
          notificationSettings: true
        }
      });

      if (!user) {
        return ErrorResponses.notFound(reply, 'User not found');
      }

      // Parse JSON preferences with defaults
      const preferences = user.preferences ? JSON.parse(user.preferences as string) : {};
      const privacySettings = user.privacySettings ? JSON.parse(user.privacySettings as string) : {};
      const notificationSettings = user.notificationSettings ? JSON.parse(user.notificationSettings as string) : {};

      const defaultPreferences = {
        theme: 'system',
        language: user.locale || 'en-US',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        compactMode: false,
        reducedMotion: false,
        highContrast: false,
        fontSize: 'medium',
        soundEnabled: true,
        autoplayVideos: true,
        showAvatars: true,
        hideScores: false,
        nsfw: false,
        infiniteScroll: true,
        postsPerPage: 25
      };

      const defaultPrivacySettings = {
        profileVisibility: 'public',
        showOnlineStatus: true,
        allowDirectMessages: 'friends',
        showEmail: false,
        showJoinDate: true,
        indexBySearchEngines: true,
        allowFriendRequests: true,
        showActiveInCommunities: true,
        showCommentHistory: true,
        showPostHistory: true
      };

      const defaultNotificationSettings = {
        desktopNotifications: true,
        soundEnabled: true,
        emailNotifications: true,
        marketingEmails: false,
        mentions: true,
        directMessages: true,
        friendRequests: true,
        postReplies: true,
        commentReplies: true,
        upvotes: true,
        awards: true,
        communityInvites: true,
        serverInvites: true,
        liveStreams: false,
        emailDigest: 'weekly',
        pushNotifications: true,
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00'
        }
      };

      sendSuccess(reply, {
        profile: {
          displayName: user.displayName,
          bio: user.bio,
          location: user.location,
          website: user.website,
          pronouns: user.pronouns
        },
        preferences: { ...defaultPreferences, ...preferences },
        privacy: { ...defaultPrivacySettings, ...privacySettings },
        notifications: { ...defaultNotificationSettings, ...notificationSettings }
      });
    } catch (error) {
      fastify.log.error('Error fetching user preferences:', error);
      ErrorResponses.internalError(reply, 'Failed to fetch user preferences');
    }
  });

  /**
   * Update user preferences
   */
  fastify.patch('/', {
    preHandler: [validate({ body: updatePreferencesSchema })],
    schema: {
      tags: ['user-preferences'],
      summary: 'Update user preferences',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    try {
      const updates = request.body as z.infer<typeof updatePreferencesSchema>;

      // Separate profile updates from preferences
      const profileUpdates: any = {};
      const preferences: any = {};

      const profileFields = ['displayName', 'bio', 'location', 'website', 'pronouns'];
      
      Object.entries(updates).forEach(([key, value]) => {
        if (profileFields.includes(key)) {
          profileUpdates[key] = value;
        } else {
          preferences[key] = value;
        }
      });

      // Get current preferences to merge
      const currentUser = await prisma.user.findUnique({
        where: { id: request.userId! },
        select: { preferences: true }
      });

      const currentPreferences = currentUser?.preferences 
        ? JSON.parse(currentUser.preferences as string) 
        : {};

      // Merge preferences
      const mergedPreferences = { ...currentPreferences, ...preferences };

      // Update user
      const updateData: any = {
        ...profileUpdates,
        preferences: JSON.stringify(mergedPreferences),
        updatedAt: new Date()
      };

      // Update locale if language is provided
      if (updates.language) {
        updateData.locale = updates.language;
      }

      const updatedUser = await prisma.user.update({
        where: { id: request.userId! },
        data: updateData,
        select: {
          id: true,
          displayName: true,
          bio: true,
          location: true,
          website: true,
          pronouns: true,
          locale: true,
          preferences: true,
          updatedAt: true
        }
      });

      sendSuccess(reply, {
        message: 'Preferences updated successfully',
        user: updatedUser,
        preferences: JSON.parse(updatedUser.preferences as string || '{}')
      });
    } catch (error) {
      fastify.log.error('Error updating user preferences:', error);
      ErrorResponses.internalError(reply, 'Failed to update user preferences');
    }
  });

  /**
   * Update privacy settings
   */
  fastify.patch('/privacy', {
    preHandler: [validate({ body: privacySettingsSchema })],
    schema: {
      tags: ['user-preferences'],
      summary: 'Update privacy settings',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    try {
      const updates = request.body as z.infer<typeof privacySettingsSchema>;

      // Get current privacy settings
      const currentUser = await prisma.user.findUnique({
        where: { id: request.userId! },
        select: { privacySettings: true }
      });

      const currentSettings = currentUser?.privacySettings 
        ? JSON.parse(currentUser.privacySettings as string) 
        : {};

      // Merge settings
      const mergedSettings = { ...currentSettings, ...updates };

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: request.userId! },
        data: {
          privacySettings: JSON.stringify(mergedSettings),
          updatedAt: new Date()
        },
        select: {
          id: true,
          privacySettings: true,
          updatedAt: true
        }
      });

      sendSuccess(reply, {
        message: 'Privacy settings updated successfully',
        privacySettings: JSON.parse(updatedUser.privacySettings as string || '{}')
      });
    } catch (error) {
      fastify.log.error('Error updating privacy settings:', error);
      ErrorResponses.internalError(reply, 'Failed to update privacy settings');
    }
  });

  /**
   * Update display settings
   */
  fastify.patch('/display', {
    preHandler: [validate({ body: displaySettingsSchema })],
    schema: {
      tags: ['user-preferences'],
      summary: 'Update display settings',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    try {
      const updates = request.body as z.infer<typeof displaySettingsSchema>;

      // Get current preferences
      const currentUser = await prisma.user.findUnique({
        where: { id: request.userId! },
        select: { preferences: true }
      });

      const currentPreferences = currentUser?.preferences 
        ? JSON.parse(currentUser.preferences as string) 
        : {};

      // Merge settings
      const mergedPreferences = { ...currentPreferences, ...updates };

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: request.userId! },
        data: {
          preferences: JSON.stringify(mergedPreferences),
          updatedAt: new Date()
        },
        select: {
          id: true,
          preferences: true,
          updatedAt: true
        }
      });

      sendSuccess(reply, {
        message: 'Display settings updated successfully',
        displaySettings: JSON.parse(updatedUser.preferences as string || '{}')
      });
    } catch (error) {
      fastify.log.error('Error updating display settings:', error);
      ErrorResponses.internalError(reply, 'Failed to update display settings');
    }
  });

  /**
   * Update notification settings
   */
  fastify.patch('/notifications', {
    preHandler: [validate({ body: notificationSettingsSchema })],
    schema: {
      tags: ['user-preferences'],
      summary: 'Update notification settings',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    try {
      const updates = request.body as z.infer<typeof notificationSettingsSchema>;

      // Get current notification settings
      const currentUser = await prisma.user.findUnique({
        where: { id: request.userId! },
        select: { notificationSettings: true }
      });

      const currentSettings = currentUser?.notificationSettings 
        ? JSON.parse(currentUser.notificationSettings as string) 
        : {};

      // Merge settings
      const mergedSettings = { ...currentSettings, ...updates };

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: request.userId! },
        data: {
          notificationSettings: JSON.stringify(mergedSettings),
          updatedAt: new Date()
        },
        select: {
          id: true,
          notificationSettings: true,
          updatedAt: true
        }
      });

      sendSuccess(reply, {
        message: 'Notification settings updated successfully',
        notificationSettings: JSON.parse(updatedUser.notificationSettings as string || '{}')
      });
    } catch (error) {
      fastify.log.error('Error updating notification settings:', error);
      ErrorResponses.internalError(reply, 'Failed to update notification settings');
    }
  });

  /**
   * Update accessibility settings
   */
  fastify.patch('/accessibility', {
    preHandler: [validate({ body: accessibilitySettingsSchema })],
    schema: {
      tags: ['user-preferences'],
      summary: 'Update accessibility settings',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    try {
      const updates = request.body as z.infer<typeof accessibilitySettingsSchema>;

      // Get current preferences
      const currentUser = await prisma.user.findUnique({
        where: { id: request.userId! },
        select: { preferences: true }
      });

      const currentPreferences = currentUser?.preferences 
        ? JSON.parse(currentUser.preferences as string) 
        : {};

      // Merge settings
      const mergedPreferences = { ...currentPreferences, ...updates };

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: request.userId! },
        data: {
          preferences: JSON.stringify(mergedPreferences),
          updatedAt: new Date()
        },
        select: {
          id: true,
          preferences: true,
          updatedAt: true
        }
      });

      sendSuccess(reply, {
        message: 'Accessibility settings updated successfully',
        accessibilitySettings: JSON.parse(updatedUser.preferences as string || '{}')
      });
    } catch (error) {
      fastify.log.error('Error updating accessibility settings:', error);
      ErrorResponses.internalError(reply, 'Failed to update accessibility settings');
    }
  });

  /**
   * Reset preferences to defaults
   */
  fastify.post('/reset', {
    schema: {
      tags: ['user-preferences'],
      summary: 'Reset all preferences to defaults',
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        properties: {
          sections: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['preferences', 'privacy', 'notifications', 'all']
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { sections = ['all'] } = request.body as { sections?: string[] };

      const updates: any = {
        updatedAt: new Date()
      };

      if (sections.includes('all') || sections.includes('preferences')) {
        updates.preferences = JSON.stringify({});
      }

      if (sections.includes('all') || sections.includes('privacy')) {
        updates.privacySettings = JSON.stringify({});
      }

      if (sections.includes('all') || sections.includes('notifications')) {
        updates.notificationSettings = JSON.stringify({});
      }

      await prisma.user.update({
        where: { id: request.userId! },
        data: updates
      });

      sendSuccess(reply, {
        message: 'Preferences reset to defaults successfully',
        resetSections: sections
      });
    } catch (error) {
      fastify.log.error('Error resetting preferences:', error);
      ErrorResponses.internalError(reply, 'Failed to reset preferences');
    }
  });

  /**
   * Export preferences (for backup/migration)
   */
  fastify.get('/export', {
    schema: {
      tags: ['user-preferences'],
      summary: 'Export user preferences',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: request.userId! },
        select: {
          preferences: true,
          privacySettings: true,
          notificationSettings: true,
          locale: true
        }
      });

      if (!user) {
        return ErrorResponses.notFound(reply, 'User not found');
      }

      const exportData = {
        preferences: user.preferences ? JSON.parse(user.preferences as string) : {},
        privacySettings: user.privacySettings ? JSON.parse(user.privacySettings as string) : {},
        notificationSettings: user.notificationSettings ? JSON.parse(user.notificationSettings as string) : {},
        locale: user.locale,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      reply.header('Content-Type', 'application/json');
      reply.header('Content-Disposition', `attachment; filename="cryb-preferences-${Date.now()}.json"`);
      
      sendSuccess(reply, exportData);
    } catch (error) {
      fastify.log.error('Error exporting preferences:', error);
      ErrorResponses.internalError(reply, 'Failed to export preferences');
    }
  });
}