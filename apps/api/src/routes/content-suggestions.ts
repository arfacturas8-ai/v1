import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "@cryb/database";
import { authMiddleware } from "../middleware/auth";

const contentSuggestionsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get personalized content suggestions for users
  fastify.get("/personalized", {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Content Suggestions'],
      summary: 'Get personalized content suggestions',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          type: { 
            type: 'string', 
            enum: ['posts', 'communities', 'users', 'all'],
            default: 'all'
          },
          limit: { type: 'number', minimum: 1, maximum: 50, default: 10 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const { type = 'all', limit = 10 } = request.query as {
        type?: 'posts' | 'communities' | 'users' | 'all';
        limit?: number;
      };

      // Get user's joined communities
      const userCommunities = await prisma.communityMember.findMany({
        where: { userId: user.id },
        select: { communityId: true }
      });

      const communityIds = userCommunities.map(uc => uc.communityId);

      const suggestions: any = {};

      // Get suggested posts
      if (type === 'posts' || type === 'all') {
        let suggestedPosts;
        
        if (communityIds.length > 0) {
          // Get posts from user's communities
          suggestedPosts = await prisma.post.findMany({
            where: {
              communityId: { in: communityIds },
              userId: { not: user.id }, // Don't suggest user's own posts
            },
            include: {
              user: {
                select: { username: true, displayName: true, avatarUrl: true }
              },
              community: {
                select: { name: true, displayName: true, imageUrl: true }
              },
              _count: {
                select: { comments: true }
              }
            },
            orderBy: [
              { isPinned: 'desc' },
              { score: 'desc' },
              { createdAt: 'desc' }
            ],
            take: Math.min(limit, 20)
          });
        } else {
          // Get trending posts for new users
          suggestedPosts = await prisma.post.findMany({
            where: {
              community: { isPublic: true }
            },
            include: {
              user: {
                select: { username: true, displayName: true, avatarUrl: true }
              },
              community: {
                select: { name: true, displayName: true, imageUrl: true }
              },
              _count: {
                select: { comments: true }
              }
            },
            orderBy: [
              { score: 'desc' },
              { createdAt: 'desc' }
            ],
            take: Math.min(limit, 20)
          });
        }

        suggestions.posts = suggestedPosts.map(post => ({
          ...post,
          reason: communityIds.includes(post.communityId) 
            ? `Popular in ${post.community.displayName}` 
            : 'Trending on CRYB'
        }));
      }

      // Get suggested communities
      if (type === 'communities' || type === 'all') {
        const suggestedCommunities = await prisma.community.findMany({
          where: {
            isPublic: true,
            id: { notIn: communityIds } // Don't suggest communities user already joined
          },
          include: {
            _count: {
              select: { members: true, posts: true }
            }
          },
          orderBy: { memberCount: 'desc' },
          take: Math.min(limit, 10)
        });

        suggestions.communities = suggestedCommunities.map(community => ({
          ...community,
          reason: community.memberCount > 100 
            ? 'Popular community' 
            : 'Growing community'
        }));
      }

      // Get suggested users to follow
      if (type === 'users' || type === 'all') {
        let suggestedUsers;
        
        if (communityIds.length > 0) {
          // Get active users from user's communities
          suggestedUsers = await prisma.user.findMany({
            where: {
              id: { not: user.id },
              communityMembers: {
                some: {
                  communityId: { in: communityIds }
                }
              }
            },
            include: {
              _count: {
                select: { posts: true, comments: true }
              }
            },
            orderBy: [
              { lastActive: 'desc' }
            ],
            take: Math.min(limit, 10)
          });
        } else {
          // Get most active users for new users
          suggestedUsers = await prisma.user.findMany({
            where: {
              id: { not: user.id },
              isAdmin: false
            },
            include: {
              _count: {
                select: { posts: true, comments: true }
              }
            },
            orderBy: [
              { lastActive: 'desc' }
            ],
            take: Math.min(limit, 10)
          });
        }

        suggestions.users = suggestedUsers.map(suggestedUser => ({
          id: suggestedUser.id,
          username: suggestedUser.username,
          displayName: suggestedUser.displayName,
          avatarUrl: suggestedUser.avatarUrl,
          bio: suggestedUser.bio,
          activity: {
            posts: suggestedUser._count.posts,
            comments: suggestedUser._count.comments
          },
          reason: suggestedUser._count.posts > 10 
            ? 'Active contributor' 
            : 'Community member'
        }));
      }

      return reply.send({
        success: true,
        data: suggestions
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get personalized suggestions"
      });
    }
  });

  // Get trending content
  fastify.get("/trending", {
    schema: {
      tags: ['Content Suggestions'],
      summary: 'Get trending content',
      querystring: {
        type: 'object',
        properties: {
          period: { 
            type: 'string', 
            enum: ['hour', 'day', 'week', 'month'],
            default: 'day'
          },
          limit: { type: 'number', minimum: 1, maximum: 50, default: 10 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { period = 'day', limit = 10 } = request.query as {
        period?: 'hour' | 'day' | 'week' | 'month';
        limit?: number;
      };

      // Calculate time threshold
      const timeThresholds = {
        hour: new Date(Date.now() - 60 * 60 * 1000),
        day: new Date(Date.now() - 24 * 60 * 60 * 1000),
        week: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        month: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      };

      const since = timeThresholds[period];

      // Get trending posts
      const trendingPosts = await prisma.post.findMany({
        where: {
          createdAt: { gte: since },
          community: { isPublic: true }
        },
        include: {
          user: {
            select: { username: true, displayName: true, avatarUrl: true }
          },
          community: {
            select: { name: true, displayName: true, imageUrl: true }
          },
          _count: {
            select: { comments: true }
          }
        },
        orderBy: [
          { score: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit
      });

      // Get trending communities
      const trendingCommunities = await prisma.community.findMany({
        where: {
          isPublic: true,
          posts: {
            some: {
              createdAt: { gte: since }
            }
          }
        },
        include: {
          _count: {
            select: { 
              members: true, 
              posts: {
                where: { createdAt: { gte: since } }
              }
            }
          }
        },
        orderBy: {
          posts: {
            _count: 'desc'
          }
        },
        take: Math.min(limit, 10)
      });

      return reply.send({
        success: true,
        data: {
          posts: trendingPosts,
          communities: trendingCommunities,
          period,
          since: since.toISOString()
        }
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get trending content"
      });
    }
  });

  // Get content suggestions for new users
  fastify.get("/for-new-users", {
    schema: {
      tags: ['Content Suggestions'],
      summary: 'Get content suggestions for new users',
      querystring: {
        type: 'object',
        properties: {
          interests: { 
            type: 'array',
            items: { type: 'string' }
          },
          limit: { type: 'number', minimum: 1, maximum: 50, default: 20 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { interests = [], limit = 20 } = request.query as {
        interests?: string[];
        limit?: number;
      };

      // Map interests to community categories
      const interestToCommunityMap: Record<string, string[]> = {
        gaming: ['gaming'],
        technology: ['technology'],
        crypto: ['crypto'],
        creative: ['creative'],
        business: ['general'],
        lifestyle: ['general'],
        education: ['help'],
        science: ['technology']
      };

      const categoryNames = interests.flatMap(interest => 
        interestToCommunityMap[interest] || []
      );

      // Always include general content for new users
      if (!categoryNames.includes('general')) {
        categoryNames.push('general');
      }

      // Get welcome posts and high-quality content
      const welcomePosts = await prisma.post.findMany({
        where: {
          OR: [
            { isPinned: true },
            { 
              title: { 
                contains: 'welcome', 
                mode: 'insensitive' 
              } 
            },
            {
              community: {
                name: { in: categoryNames.length > 0 ? categoryNames : ['general'] }
              }
            }
          ],
          community: { isPublic: true }
        },
        include: {
          user: {
            select: { username: true, displayName: true, avatarUrl: true }
          },
          community: {
            select: { name: true, displayName: true, imageUrl: true }
          },
          _count: {
            select: { comments: true }
          }
        },
        orderBy: [
          { isPinned: 'desc' },
          { score: 'desc' },
          { createdAt: 'desc' }
        ],
        take: Math.min(limit, 30)
      });

      // Get recommended communities based on interests
      const recommendedCommunities = await prisma.community.findMany({
        where: {
          isPublic: true,
          ...(categoryNames.length > 0 && {
            name: { in: categoryNames }
          })
        },
        include: {
          _count: {
            select: { members: true, posts: true }
          }
        },
        orderBy: { memberCount: 'desc' },
        take: 10
      });

      // Get sample active users
      const activeUsers = await prisma.user.findMany({
        where: {
          isAdmin: false,
          lastActive: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Active in last week
          }
        },
        include: {
          _count: {
            select: { posts: true, comments: true }
          }
        },
        orderBy: [
          { lastActive: 'desc' }
        ],
        take: 8
      });

      // Create onboarding tips
      const onboardingTips = [
        {
          title: "Complete Your Profile",
          description: "Add a profile picture and bio to help others connect with you",
          icon: "person",
          action: "profile"
        },
        {
          title: "Join Communities",
          description: "Find communities that match your interests and join the conversation",
          icon: "people",
          action: "communities"
        },
        {
          title: "Make Your First Post",
          description: "Share something interesting or ask a question to get started",
          icon: "create",
          action: "post"
        },
        {
          title: "Engage with Others",
          description: "Upvote good content and leave thoughtful comments",
          icon: "heart",
          action: "engage"
        }
      ];

      return reply.send({
        success: true,
        data: {
          welcomePosts: welcomePosts.slice(0, 10),
          recommendedCommunities,
          activeUsers: activeUsers.map(user => ({
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            bio: user.bio,
            activity: {
              posts: user._count.posts,
              comments: user._count.comments
            }
          })),
          onboardingTips,
          interests,
          matchedCategories: categoryNames
        }
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get new user suggestions"
      });
    }
  });

  // Get content discovery feed
  fastify.get("/discover", {
    schema: {
      tags: ['Content Suggestions'],
      summary: 'Get content discovery feed',
      querystring: {
        type: 'object',
        properties: {
          algorithm: { 
            type: 'string', 
            enum: ['hot', 'new', 'top', 'controversial'],
            default: 'hot'
          },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 25 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { algorithm = 'hot', limit = 25 } = request.query as {
        algorithm?: 'hot' | 'new' | 'top' | 'controversial';
        limit?: number;
      };

      let orderBy: any;

      switch (algorithm) {
        case 'new':
          orderBy = { createdAt: 'desc' };
          break;
        case 'top':
          orderBy = { score: 'desc' };
          break;
        case 'controversial':
          // Posts with mixed reactions (would need vote data to implement properly)
          orderBy = [{ createdAt: 'desc' }];
          break;
        case 'hot':
        default:
          // Hot algorithm: combination of score and recency
          orderBy = [
            { isPinned: 'desc' },
            { score: 'desc' },
            { createdAt: 'desc' }
          ];
          break;
      }

      const posts = await prisma.post.findMany({
        where: {
          community: { isPublic: true }
        },
        include: {
          user: {
            select: { username: true, displayName: true, avatarUrl: true }
          },
          community: {
            select: { name: true, displayName: true, imageUrl: true }
          },
          _count: {
            select: { comments: true }
          }
        },
        orderBy,
        take: limit
      });

      return reply.send({
        success: true,
        data: {
          posts,
          algorithm,
          total: posts.length
        }
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get discovery feed"
      });
    }
  });

  // Mark content as seen/not interested
  fastify.post("/feedback", {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Content Suggestions'],
      summary: 'Provide feedback on suggested content',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          contentId: { type: 'string' },
          contentType: { type: 'string', enum: ['post', 'community', 'user'] },
          feedbackType: { 
            type: 'string', 
            enum: ['like', 'dislike', 'not_interested', 'seen', 'save'] 
          }
        },
        required: ['contentId', 'contentType', 'feedbackType']
      }
    }
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const { contentId, contentType, feedbackType } = request.body as {
        contentId: string;
        contentType: 'post' | 'community' | 'user';
        feedbackType: 'like' | 'dislike' | 'not_interested' | 'seen' | 'save';
      };

      // For now, just acknowledge the feedback
      // In a real implementation, you'd store this in a user_content_feedback table
      // and use it to improve future recommendations

      fastify.log.info(`User ${user.id} provided feedback: ${feedbackType} for ${contentType} ${contentId}`);

      return reply.send({
        success: true,
        message: "Feedback recorded. We'll use this to improve your recommendations!"
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to record feedback"
      });
    }
  });
};

export default contentSuggestionsRoutes;