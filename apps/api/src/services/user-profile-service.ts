import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Types and schemas
export const ProfileUpdateSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(1000).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url().optional().or(z.literal('')),
  occupation: z.string().max(100).optional(),
  education: z.string().max(100).optional(),
  pronouns: z.string().max(50).optional(),
  birthDate: z.coerce.date().optional(),
  interests: z.array(z.string().max(50)).max(20).optional(),
  socialLinks: z.array(z.object({
    platform: z.enum(['twitter', 'instagram', 'github', 'linkedin', 'youtube', 'twitch', 'discord', 'reddit', 'other']),
    url: z.string().url(),
    displayText: z.string().max(50).optional()
  })).max(10).optional(),
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  profileMessage: z.string().max(200).optional(),
  profileColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  profileTags: z.array(z.string().max(30)).max(10).optional()
});

export const PrivacySettingsSchema = z.object({
  profileVisibility: z.enum(['public', 'followers', 'private']).optional(),
  emailVisibility: z.enum(['public', 'followers', 'private']).optional(),
  phoneVisibility: z.enum(['public', 'followers', 'private']).optional(),
  birthdateVisibility: z.enum(['public', 'followers', 'private']).optional(),
  locationVisibility: z.enum(['public', 'followers', 'private']).optional(),
  websiteVisibility: z.enum(['public', 'followers', 'private']).optional(),
  socialLinksVisibility: z.enum(['public', 'followers', 'private']).optional(),
  followersVisibility: z.enum(['public', 'followers', 'private']).optional(),
  followingVisibility: z.enum(['public', 'followers', 'private']).optional(),
  activityVisibility: z.enum(['public', 'followers', 'private']).optional(),
  achievementsVisibility: z.enum(['public', 'followers', 'private']).optional(),
  allowFollows: z.boolean().optional(),
  allowMessages: z.enum(['everyone', 'followers', 'none']).optional(),
  allowMentions: z.enum(['everyone', 'followers', 'none']).optional(),
  indexProfile: z.boolean().optional(),
  allowDiscovery: z.boolean().optional()
});

export const UserSearchSchema = z.object({
  query: z.string().min(1).max(100),
  filters: z.object({
    location: z.string().optional(),
    occupation: z.string().optional(),
    verified: z.boolean().optional(),
    premium: z.boolean().optional(),
    hasAvatar: z.boolean().optional(),
    joinDateAfter: z.coerce.date().optional(),
    joinDateBefore: z.coerce.date().optional(),
    minFollowers: z.number().int().min(0).optional(),
    maxFollowers: z.number().int().min(0).optional(),
    interests: z.array(z.string()).optional()
  }).optional(),
  sort: z.enum(['relevance', 'followers', 'recent', 'alphabetical']).default('relevance'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20)
});

export interface ProfileData {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  avatar?: string;
  banner?: string;
  bio?: string;
  location?: string;
  website?: string;
  occupation?: string;
  education?: string;
  pronouns?: string;
  birthDate?: Date;
  interests: string[];
  socialLinks: any[];
  privacySettings: any;
  profileViews: number;
  followersCount: number;
  followingCount: number;
  achievementPoints: number;
  profileCompleteness: number;
  isVerified: boolean;
  premiumType: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  lastSeenAt?: Date;
}

export interface UserActivityData {
  id: string;
  activityType: string;
  activityData: any;
  timestamp: Date;
  entityId?: string;
  entityType?: string;
  points: number;
  isPublic: boolean;
}

export class UserProfileService {
  
  /**
   * Get complete user profile with privacy filtering
   */
  async getProfile(userId: string, viewerId?: string): Promise<ProfileData | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId, isActive: true },
      include: {
        UserProfile: true,
        UserPrivacySettings: true,
        UserStatistics: true,
        _count: {
          select: {
            UserFollow_UserFollow_followingIdToUser: true,
            UserFollow_UserFollow_followerIdToUser: true,
            Post: { where: { isRemoved: false } },
            Comment: { where: { isRemoved: false } },
            UserAchievement: { where: { isVisible: true } }
          }
        }
      }
    });

    if (!user) return null;

    // Check privacy settings and relationship
    const relationship = viewerId && viewerId !== userId 
      ? await this.getUserRelationship(viewerId, userId)
      : null;

    const privacy = user.UserPrivacySettings || await this.createDefaultPrivacySettings(userId);
    const profile = user.UserProfile || await this.createDefaultProfile(userId);

    // Filter data based on privacy settings
    const canViewProfile = this.canViewField(privacy.profileVisibility, relationship, viewerId === userId);
    
    if (!canViewProfile) {
      return {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        isVerified: user.isVerified,
        profileViews: 0,
        followersCount: 0,
        followingCount: 0,
        achievementPoints: 0,
        profileCompleteness: 0,
        premiumType: 'NONE',
        role: 'USER',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        interests: [],
        socialLinks: [],
        privacySettings: { profileVisibility: 'private' }
      } as ProfileData;
    }

    // Increment profile view count (but not for self-views)
    if (viewerId && viewerId !== userId) {
      await this.incrementProfileViews(userId);
      await this.logActivity(viewerId, 'profile_view', { viewedUserId: userId }, userId, 'user');
    }

    const profileData: ProfileData = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: this.canViewField(privacy.emailVisibility, relationship, viewerId === userId) ? user.email : undefined,
      avatar: user.avatar,
      banner: user.banner,
      bio: user.bio,
      location: this.canViewField(privacy.locationVisibility, relationship, viewerId === userId) ? user.location : undefined,
      website: this.canViewField(privacy.websiteVisibility, relationship, viewerId === userId) ? user.website : undefined,
      occupation: user.occupation,
      education: user.education,
      pronouns: user.pronouns,
      birthDate: this.canViewField(privacy.birthdateVisibility, relationship, viewerId === userId) ? user.birthDate : undefined,
      interests: user.interests ? JSON.parse(user.interests as string) : [],
      socialLinks: this.canViewField(privacy.socialLinksVisibility, relationship, viewerId === userId) 
        ? (user.socialLinks ? JSON.parse(user.socialLinks as string) : []) 
        : [],
      privacySettings: viewerId === userId ? privacy : { profileVisibility: privacy.profileVisibility },
      profileViews: user.profileViews || 0,
      followersCount: this.canViewField(privacy.followersVisibility, relationship, viewerId === userId) ? user.followersCount || 0 : 0,
      followingCount: this.canViewField(privacy.followingVisibility, relationship, viewerId === userId) ? user.followingCount || 0 : 0,
      achievementPoints: this.canViewField(privacy.achievementsVisibility, relationship, viewerId === userId) ? user.achievementPoints || 0 : 0,
      profileCompleteness: user.profileCompleteness || 0,
      isVerified: user.isVerified,
      premiumType: user.premiumType,
      role: user.role || 'USER',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastSeenAt: user.lastSeenAt
    };

    return profileData;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateData: z.infer<typeof ProfileUpdateSchema>): Promise<ProfileData> {
    const { theme, timezone, language, profileMessage, profileColor, profileTags, ...userUpdates } = updateData;

    // Prepare user table updates
    const userUpdateData: any = { ...userUpdates };
    if (updateData.interests) {
      userUpdateData.interests = JSON.stringify(updateData.interests);
    }
    if (updateData.socialLinks) {
      userUpdateData.socialLinks = JSON.stringify(updateData.socialLinks);
    }
    userUpdateData.updatedAt = new Date();

    // Prepare profile table updates
    const profileUpdateData: any = {};
    if (theme !== undefined) profileUpdateData.theme = theme;
    if (timezone !== undefined) profileUpdateData.timezone = timezone;
    if (language !== undefined) profileUpdateData.language = language;
    if (profileMessage !== undefined) profileUpdateData.profileMessage = profileMessage;
    if (profileColor !== undefined) profileUpdateData.profileColor = profileColor;
    if (profileTags !== undefined) profileUpdateData.profileTags = profileTags;
    if (Object.keys(profileUpdateData).length > 0) {
      profileUpdateData.updatedAt = new Date();
    }

    // Execute updates in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user table
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: userUpdateData
      });

      // Update or create profile table
      if (Object.keys(profileUpdateData).length > 0) {
        await tx.userProfile.upsert({
          where: { userId },
          update: profileUpdateData,
          create: {
            id: `profile_${userId}`,
            userId,
            ...profileUpdateData
          }
        });
      }

      return updatedUser;
    });

    // Log activity
    await this.logActivity(userId, 'profile_update', updateData, userId, 'user', 10);

    // Check for achievements
    await this.checkProfileAchievements(userId);

    // Return updated profile
    return this.getProfile(userId, userId) as Promise<ProfileData>;
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(userId: string, settings: z.infer<typeof PrivacySettingsSchema>) {
    const privacySettings = await prisma.userPrivacySettings.upsert({
      where: { userId },
      update: {
        ...settings,
        updatedAt: new Date()
      },
      create: {
        id: `privacy_${userId}`,
        userId,
        ...settings
      }
    });

    await this.logActivity(userId, 'privacy_update', settings, userId, 'user', 5);

    return privacySettings;
  }

  /**
   * Search users with advanced filtering
   */
  async searchUsers(searchParams: z.infer<typeof UserSearchSchema>, viewerId?: string) {
    const { query, filters = {}, sort, page, limit } = searchParams;
    
    // Build search query
    const whereConditions: any = {
      isActive: true,
      UserPrivacySettings: {
        OR: [
          { allowDiscovery: true },
          { allowDiscovery: null }
        ]
      }
    };

    // Text search using full-text search
    if (query.trim()) {
      whereConditions.OR = [
        {
          username: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          displayName: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          bio: {
            contains: query,
            mode: 'insensitive'
          }
        }
      ];
    }

    // Apply filters
    if (filters.location) {
      whereConditions.location = {
        contains: filters.location,
        mode: 'insensitive'
      };
    }

    if (filters.occupation) {
      whereConditions.occupation = {
        contains: filters.occupation,
        mode: 'insensitive'
      };
    }

    if (filters.verified !== undefined) {
      whereConditions.isVerified = filters.verified;
    }

    if (filters.premium !== undefined) {
      whereConditions.premiumType = filters.premium ? { not: 'NONE' } : 'NONE';
    }

    if (filters.hasAvatar !== undefined) {
      whereConditions.avatar = filters.hasAvatar ? { not: null } : null;
    }

    if (filters.joinDateAfter) {
      whereConditions.createdAt = {
        ...whereConditions.createdAt,
        gte: filters.joinDateAfter
      };
    }

    if (filters.joinDateBefore) {
      whereConditions.createdAt = {
        ...whereConditions.createdAt,
        lte: filters.joinDateBefore
      };
    }

    if (filters.minFollowers !== undefined) {
      whereConditions.followersCount = {
        ...whereConditions.followersCount,
        gte: filters.minFollowers
      };
    }

    if (filters.maxFollowers !== undefined) {
      whereConditions.followersCount = {
        ...whereConditions.followersCount,
        lte: filters.maxFollowers
      };
    }

    // Build order by clause
    let orderBy: any = {};
    switch (sort) {
      case 'followers':
        orderBy = { followersCount: 'desc' };
        break;
      case 'recent':
        orderBy = { createdAt: 'desc' };
        break;
      case 'alphabetical':
        orderBy = { username: 'asc' };
        break;
      default: // relevance
        orderBy = [
          { isVerified: 'desc' },
          { followersCount: 'desc' },
          { username: 'asc' }
        ];
    }

    // Execute search
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereConditions,
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          bio: true,
          location: true,
          isVerified: true,
          premiumType: true,
          followersCount: true,
          achievementPoints: true,
          createdAt: true,
          UserPrivacySettings: {
            select: {
              profileVisibility: true,
              locationVisibility: true
            }
          }
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.user.count({ where: whereConditions })
    ]);

    // Filter results based on privacy
    const filteredUsers = users.filter(user => {
      const privacy = user.UserPrivacySettings;
      return !privacy || privacy.profileVisibility === 'public';
    }).map(user => ({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      bio: user.bio,
      location: user.UserPrivacySettings?.locationVisibility === 'public' ? user.location : null,
      isVerified: user.isVerified,
      premiumType: user.premiumType,
      followersCount: user.followersCount || 0,
      achievementPoints: user.achievementPoints || 0,
      createdAt: user.createdAt
    }));

    return {
      users: filteredUsers,
      pagination: {
        total,
        page,
        pageSize: limit,
        hasMore: page * limit < total
      }
    };
  }

  /**
   * Follow a user
   */
  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }

    // Check if target user allows follows
    const targetUser = await prisma.user.findUnique({
      where: { id: followingId },
      include: { UserPrivacySettings: true }
    });

    if (!targetUser) {
      throw new Error('User not found');
    }

    const privacy = targetUser.UserPrivacySettings;
    if (privacy && !privacy.allowFollows) {
      throw new Error('User does not allow follows');
    }

    // Check if already following
    const existingFollow = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });

    if (existingFollow) {
      throw new Error('Already following user');
    }

    // Create follow relationship
    const follow = await prisma.userFollow.create({
      data: {
        id: `follow_${followerId}_${followingId}`,
        followerId,
        followingId
      }
    });

    // Log activities
    await this.logActivity(followerId, 'user_follow', { followingId }, followingId, 'user', 20);
    await this.logActivity(followingId, 'gained_follower', { followerId }, followerId, 'user', 10);

    // Check achievements
    await this.checkFollowAchievements(followerId);
    await this.checkFollowAchievements(followingId);

    return follow;
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(followerId: string, followingId: string) {
    const result = await prisma.userFollow.deleteMany({
      where: {
        followerId,
        followingId
      }
    });

    if (result.count === 0) {
      throw new Error('Not following user');
    }

    await this.logActivity(followerId, 'user_unfollow', { followingId }, followingId, 'user');

    return { success: true };
  }

  /**
   * Block a user
   */
  async blockUser(blockerId: string, blockedId: string, reason?: string) {
    if (blockerId === blockedId) {
      throw new Error('Cannot block yourself');
    }

    // Check if already blocked
    const existingBlock = await prisma.userBlocked.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId
        }
      }
    });

    if (existingBlock) {
      throw new Error('User already blocked');
    }

    // Create block relationship and remove follow relationships
    const result = await prisma.$transaction(async (tx) => {
      // Remove any follow relationships
      await tx.userFollow.deleteMany({
        where: {
          OR: [
            { followerId: blockerId, followingId: blockedId },
            { followerId: blockedId, followingId: blockerId }
          ]
        }
      });

      // Create block
      const block = await tx.userBlocked.create({
        data: {
          id: `block_${blockerId}_${blockedId}`,
          blockerId,
          blockedId,
          reason
        }
      });

      return block;
    });

    await this.logActivity(blockerId, 'user_block', { blockedId, reason }, blockedId, 'user');

    return result;
  }

  /**
   * Unblock a user
   */
  async unblockUser(blockerId: string, blockedId: string) {
    const result = await prisma.userBlocked.deleteMany({
      where: {
        blockerId,
        blockedId
      }
    });

    if (result.count === 0) {
      throw new Error('User not blocked');
    }

    await this.logActivity(blockerId, 'user_unblock', { blockedId }, blockedId, 'user');

    return { success: true };
  }

  /**
   * Get user activity timeline
   */
  async getUserActivity(userId: string, viewerId?: string, page = 1, limit = 20) {
    // Check if viewer can see activities
    const relationship = viewerId && viewerId !== userId 
      ? await this.getUserRelationship(viewerId, userId)
      : null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { UserPrivacySettings: true }
    });

    if (!user) throw new Error('User not found');

    const privacy = user.UserPrivacySettings;
    const canViewActivity = this.canViewField(privacy?.activityVisibility || 'public', relationship, viewerId === userId);

    if (!canViewActivity) {
      return { activities: [], pagination: { total: 0, page, pageSize: limit, hasMore: false } };
    }

    const [activities, total] = await Promise.all([
      prisma.userActivityTimeline.findMany({
        where: {
          userId,
          isPublic: true
        },
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.userActivityTimeline.count({
        where: {
          userId,
          isPublic: true
        }
      })
    ]);

    return {
      activities,
      pagination: {
        total,
        page,
        pageSize: limit,
        hasMore: page * limit < total
      }
    };
  }

  /**
   * Get user achievements
   */
  async getUserAchievements(userId: string, viewerId?: string) {
    // Check if viewer can see achievements
    const relationship = viewerId && viewerId !== userId 
      ? await this.getUserRelationship(viewerId, userId)
      : null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { UserPrivacySettings: true }
    });

    if (!user) throw new Error('User not found');

    const privacy = user.UserPrivacySettings;
    const canViewAchievements = this.canViewField(privacy?.achievementsVisibility || 'public', relationship, viewerId === userId);

    if (!canViewAchievements) {
      return [];
    }

    const achievements = await prisma.userAchievement.findMany({
      where: {
        userId,
        isVisible: true
      },
      include: {
        Achievement: true
      },
      orderBy: { earnedAt: 'desc' }
    });

    return achievements.map(ua => ({
      id: ua.id,
      achievementId: ua.achievementId,
      name: ua.Achievement.name,
      description: ua.Achievement.description,
      icon: ua.Achievement.icon,
      category: ua.Achievement.category,
      rarity: ua.Achievement.rarity,
      points: ua.Achievement.points,
      earnedAt: ua.earnedAt,
      progress: ua.progress
    }));
  }

  /**
   * Award achievement to user
   */
  async awardAchievement(userId: string, achievementId: string, progress = 100) {
    // Check if user already has this achievement
    const existingAchievement = await prisma.userAchievement.findFirst({
      where: { userId, achievementId }
    });

    if (existingAchievement) {
      return existingAchievement;
    }

    const achievement = await prisma.achievement.findUnique({
      where: { id: achievementId }
    });

    if (!achievement) {
      throw new Error('Achievement not found');
    }

    const userAchievement = await prisma.userAchievement.create({
      data: {
        id: `ua_${userId}_${achievementId}`,
        userId,
        achievementId,
        progress
      },
      include: {
        Achievement: true
      }
    });

    // Log activity and award points
    await this.logActivity(
      userId, 
      'achievement_earned', 
      { achievementId, achievementName: achievement.name }, 
      achievementId, 
      'achievement', 
      achievement.points
    );

    return userAchievement;
  }

  // Private helper methods

  private async getUserRelationship(viewerId: string, targetUserId: string) {
    const [follow, block] = await Promise.all([
      prisma.userFollow.findUnique({
        where: {
          followerId_followingId: {
            followerId: viewerId,
            followingId: targetUserId
          }
        }
      }),
      prisma.userBlocked.findFirst({
        where: {
          OR: [
            { blockerId: viewerId, blockedId: targetUserId },
            { blockerId: targetUserId, blockedId: viewerId }
          ]
        }
      })
    ]);

    return {
      isFollowing: !!follow,
      isBlocked: !!block,
      isBlockedBy: block?.blockerId === targetUserId
    };
  }

  private canViewField(visibility: string, relationship: any, isOwner: boolean): boolean {
    if (isOwner) return true;
    if (visibility === 'private') return false;
    if (visibility === 'public') return true;
    if (visibility === 'followers') return relationship?.isFollowing || false;
    return false;
  }

  private async incrementProfileViews(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        profileViews: {
          increment: 1
        }
      }
    });
  }

  private async logActivity(
    userId: string,
    activityType: string,
    activityData: any = {},
    entityId?: string,
    entityType?: string,
    points = 0
  ) {
    await prisma.userActivityTimeline.create({
      data: {
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        activityType,
        activityData,
        entityId,
        entityType,
        points
      }
    });

    if (points > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          achievementPoints: {
            increment: points
          }
        }
      });
    }
  }

  private async createDefaultPrivacySettings(userId: string) {
    return prisma.userPrivacySettings.create({
      data: {
        id: `privacy_${userId}`,
        userId
      }
    });
  }

  private async createDefaultProfile(userId: string) {
    return prisma.userProfile.create({
      data: {
        id: `profile_${userId}`,
        userId
      }
    });
  }

  private async checkProfileAchievements(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profileCompleteness: true }
    });

    if (user && user.profileCompleteness >= 80) {
      await this.awardAchievement(userId, 'ach_profile_complete');
    }
  }

  private async checkFollowAchievements(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { followersCount: true }
    });

    if (!user) return;

    const followerCount = user.followersCount || 0;

    if (followerCount >= 1) {
      await this.awardAchievement(userId, 'ach_first_follower');
    }
    if (followerCount >= 50) {
      await this.awardAchievement(userId, 'ach_socialite');
    }
    if (followerCount >= 500) {
      await this.awardAchievement(userId, 'ach_influencer');
    }
  }
}

export const userProfileService = new UserProfileService();