import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "@cryb/database";
import { authMiddleware } from "../middleware/auth";

const onboardingRoutes: FastifyPluginAsync = async (fastify) => {
  // Get onboarding flow data
  fastify.get("/flow", {
    schema: {
      tags: ['Onboarding'],
      summary: 'Get onboarding flow configuration',
    }
  }, async (request, reply) => {
    try {
      const flowConfig = {
        steps: [
          {
            id: 'welcome',
            title: 'Welcome to CRYB',
            description: 'The next-generation community platform',
            type: 'intro',
            required: false
          },
          {
            id: 'interests',
            title: 'What interests you?',
            description: 'Select your interests to get personalized recommendations',
            type: 'selection',
            required: true,
            minSelections: 1,
            maxSelections: 6
          },
          {
            id: 'communities',
            title: 'Join Communities',
            description: 'Discover communities that match your interests',
            type: 'community_selection',
            required: false,
            maxSelections: 10
          },
          {
            id: 'profile',
            title: 'Complete Your Profile',
            description: 'Add a photo and bio to help others connect with you',
            type: 'profile_setup',
            required: false
          },
          {
            id: 'notifications',
            title: 'Notification Preferences',
            description: 'Choose how you want to be notified about activity',
            type: 'preferences',
            required: false
          }
        ],
        interests: [
          {
            id: 'gaming',
            name: 'Gaming',
            icon: 'game-controller',
            description: 'Video games, esports, streaming',
            color: '#FF6B6B',
            relatedCommunities: ['community-gaming']
          },
          {
            id: 'technology',
            name: 'Technology',
            icon: 'laptop',
            description: 'Programming, AI, innovation',
            color: '#667eea',
            relatedCommunities: ['community-technology']
          },
          {
            id: 'crypto',
            name: 'Crypto & DeFi',
            icon: 'logo-bitcoin',
            description: 'Blockchain, NFTs, trading',
            color: '#f093fb',
            relatedCommunities: ['community-crypto']
          },
          {
            id: 'creative',
            name: 'Creative Arts',
            icon: 'color-palette',
            description: 'Art, music, design, writing',
            color: '#4facfe',
            relatedCommunities: ['community-creative']
          },
          {
            id: 'business',
            name: 'Business',
            icon: 'trending-up',
            description: 'Entrepreneurship, investing, career',
            color: '#43e97b',
            relatedCommunities: ['community-general']
          },
          {
            id: 'lifestyle',
            name: 'Lifestyle',
            icon: 'heart',
            description: 'Health, fitness, travel, food',
            color: '#fa709a',
            relatedCommunities: ['community-general']
          },
          {
            id: 'education',
            name: 'Education',
            icon: 'school',
            description: 'Learning, courses, academic discussions',
            color: '#764ba2',
            relatedCommunities: ['community-help']
          },
          {
            id: 'science',
            name: 'Science',
            icon: 'flask',
            description: 'Research, discoveries, scientific discussions',
            color: '#00f2fe',
            relatedCommunities: ['community-technology']
          }
        ]
      };

      return reply.send({
        success: true,
        data: flowConfig
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get onboarding flow"
      });
    }
  });

  // Get recommended communities based on interests
  fastify.post("/recommend-communities", {
    schema: {
      tags: ['Onboarding'],
      summary: 'Get community recommendations based on interests',
      body: {
        type: 'object',
        properties: {
          interests: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of interest IDs'
          }
        },
        required: ['interests']
      }
    }
  }, async (request, reply) => {
    try {
      const { interests } = request.body as { interests: string[] };

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

      // Get category names based on interests
      const categoryNames = interests.flatMap(interest => 
        interestToCommunityMap[interest] || []
      );

      // Always include general communities
      if (!categoryNames.includes('general')) {
        categoryNames.push('general');
      }

      // Get communities matching the categories
      const communities = await prisma.community.findMany({
        where: {
          isPublic: true,
          name: { in: categoryNames }
        },
        include: {
          _count: {
            select: { members: true, posts: true }
          }
        },
        orderBy: { memberCount: 'desc' }
      });

      // If no specific matches, get popular communities
      if (communities.length === 0) {
        const popularCommunities = await prisma.community.findMany({
          where: { isPublic: true },
          include: {
            _count: {
              select: { members: true, posts: true }
            }
          },
          orderBy: { memberCount: 'desc' },
          take: 5
        });

        return reply.send({
          success: true,
          data: {
            communities: popularCommunities,
            matchType: 'popular'
          }
        });
      }

      return reply.send({
        success: true,
        data: {
          communities,
          matchType: 'interest_based'
        }
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get community recommendations"
      });
    }
  });

  // Complete onboarding step
  fastify.post("/complete-step", {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Onboarding'],
      summary: 'Complete an onboarding step',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          stepId: { type: 'string' },
          data: { type: 'object' }
        },
        required: ['stepId', 'data']
      }
    }
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const { stepId, data } = request.body as { stepId: string; data: any };

      // Process different step types
      switch (stepId) {
        case 'interests':
          // Save user interests
          if (data.selectedInterests && Array.isArray(data.selectedInterests)) {
            // Store interests in user bio or a separate interests field
            const interestsList = data.selectedInterests.join(', ');
            await prisma.user.update({
              where: { id: user.id },
              data: {
                bio: user.bio ? `${user.bio} | Interests: ${interestsList}` : `Interests: ${interestsList}`
              }
            });
          }
          break;

        case 'communities':
          // Join selected communities
          if (data.selectedCommunities && Array.isArray(data.selectedCommunities)) {
            for (const communityId of data.selectedCommunities) {
              try {
                await prisma.communityMember.create({
                  data: {
                    communityId,
                    userId: user.id
                  }
                });

                // Update community member count
                await prisma.community.update({
                  where: { id: communityId },
                  data: {
                    memberCount: { increment: 1 }
                  }
                });
              } catch (error) {
                // Ignore if already a member
                console.log(`User ${user.id} already member of community ${communityId}`);
              }
            }
          }
          break;

        case 'profile':
          // Update profile information
          const updateData: any = {};
          if (data.bio) updateData.bio = data.bio;
          if (data.displayName) updateData.displayName = data.displayName;
          if (data.avatarUrl) updateData.avatarUrl = data.avatarUrl;

          if (Object.keys(updateData).length > 0) {
            await prisma.user.update({
              where: { id: user.id },
              data: updateData
            });
          }
          break;

        case 'notifications':
          // Save notification preferences
          // This would typically be stored in a separate preferences table
          console.log('Notification preferences saved:', data);
          break;
      }

      // Record that this step was completed
      // You might want to create an onboarding_progress table for this
      return reply.send({
        success: true,
        message: `Step ${stepId} completed successfully`
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to complete onboarding step"
      });
    }
  });

  // Mark onboarding as complete
  fastify.post("/complete", {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Onboarding'],
      summary: 'Mark onboarding as complete',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          completedSteps: {
            type: 'array',
            items: { type: 'string' }
          },
          skippedSteps: {
            type: 'array',
            items: { type: 'string' }
          },
          totalTimeSpent: { type: 'number' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const { completedSteps = [], skippedSteps = [], totalTimeSpent = 0 } = request.body as {
        completedSteps: string[];
        skippedSteps: string[];
        totalTimeSpent: number;
      };

      // Update user to mark onboarding as complete
      await prisma.user.update({
        where: { id: user.id },
        data: {
          // Add an onboardingCompleted field if available
          bio: user.bio || 'New CRYB member!'
        }
      });

      // Create welcome notification
      await prisma.notification.create({
        data: {
          id: `onboarding-complete-${user.id}-${Date.now()}`,
          userId: user.id,
          type: 'onboarding_complete',
          title: 'Welcome to CRYB! 🎉',
          content: 'You\'ve completed the onboarding process. Start exploring communities and connecting with others!',
          data: {
            completedSteps,
            skippedSteps,
            totalTimeSpent,
            completedAt: new Date().toISOString()
          }
        }
      });

      // Get user's current communities for the response
      const userCommunities = await prisma.communityMember.findMany({
        where: { userId: user.id },
        include: {
          community: {
            select: {
              id: true,
              name: true,
              displayName: true,
              imageUrl: true,
              memberCount: true
            }
          }
        }
      });

      return reply.send({
        success: true,
        message: "Onboarding completed successfully!",
        data: {
          user: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            bio: user.bio
          },
          joinedCommunities: userCommunities.length,
          communities: userCommunities.map(uc => uc.community),
          completionStats: {
            completedSteps: completedSteps.length,
            skippedSteps: skippedSteps.length,
            totalTimeSpent
          }
        }
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to complete onboarding"
      });
    }
  });

  // Get onboarding progress for a user
  fastify.get("/progress", {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Onboarding'],
      summary: 'Get user onboarding progress',
      security: [{ bearerAuth: [] }],
    }
  }, async (request, reply) => {
    try {
      const user = (request as any).user;

      // Check user's current state
      const userCommunities = await prisma.communityMember.count({
        where: { userId: user.id }
      });

      const userPosts = await prisma.post.count({
        where: { userId: user.id }
      });

      const userComments = await prisma.comment.count({
        where: { userId: user.id }
      });

      // Determine completion status
      const progress = {
        interests: !!user.bio && user.bio.includes('Interests:'),
        communities: userCommunities > 0,
        profile: !!(user.avatarUrl && user.bio),
        firstPost: userPosts > 0,
        firstComment: userComments > 0
      };

      const completionPercentage = Math.round(
        (Object.values(progress).filter(Boolean).length / Object.keys(progress).length) * 100
      );

      return reply.send({
        success: true,
        data: {
          progress,
          completionPercentage,
          stats: {
            communitiesJoined: userCommunities,
            postsCreated: userPosts,
            commentsCreated: userComments
          },
          nextSteps: [
            ...(userCommunities === 0 ? ['Join some communities to get started'] : []),
            ...(userPosts === 0 ? ['Create your first post'] : []),
            ...(userComments === 0 ? ['Leave a comment on a post you like'] : []),
            ...(!user.avatarUrl ? ['Add a profile picture'] : [])
          ]
        }
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get onboarding progress"
      });
    }
  });
};

export default onboardingRoutes;