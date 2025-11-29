import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "@cryb/database";
import { authMiddleware } from "../middleware/auth";
import bcrypt from "bcryptjs";

const seedingRoutes: FastifyPluginAsync = async (fastify) => {
  // Seed initial content (admin only)
  fastify.post("/initial-content", {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Seeding'],
      summary: 'Seed initial platform content',
      security: [{ bearerAuth: [] }],
    }
  }, async (request, reply) => {
    try {
      // Check if user is admin
      const user = (request as any).user;
      if (!user?.isAdmin) {
        return reply.code(403).send({
          success: false,
          error: "Admin access required"
        });
      }

      // Check if content already exists
      const existingContent = await prisma.community.count();
      if (existingContent > 0) {
        return reply.send({
          success: true,
          message: "Content already seeded",
          data: { communities: existingContent }
        });
      }

      // Create admin user if not exists
      const adminUser = await prisma.user.upsert({
        where: { id: 'admin-user-001' },
        update: {},
        create: {
          id: 'admin-user-001',
          username: 'cryb_admin',
          displayName: 'CRYB Admin',
          email: 'admin@cryb.ai',
          passwordHash: await bcrypt.hash('admin123', 10),
          emailVerified: true,
          isAdmin: true,
          avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
          bio: 'Welcome to CRYB! I\'m here to help you get started and answer any questions.',
        }
      });

      // Create moderator users
      const moderators = [
        {
          id: 'mod-user-001',
          username: 'gaming_mod',
          displayName: 'Gaming Moderator',
          email: 'gaming.mod@cryb.ai',
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face',
          bio: 'Gaming enthusiast and community moderator. Always ready to discuss the latest games!',
        },
        {
          id: 'mod-user-002',
          username: 'tech_wizard',
          displayName: 'Tech Wizard',
          email: 'tech.mod@cryb.ai',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
          bio: 'Software engineer passionate about emerging technologies and helping others learn.',
        },
        {
          id: 'mod-user-003',
          username: 'crypto_guru',
          displayName: 'Crypto Guru',
          email: 'crypto.mod@cryb.ai',
          avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face',
          bio: 'Blockchain enthusiast and DeFi expert. Here to guide you through the crypto space safely.',
        }
      ];

      for (const mod of moderators) {
        await prisma.user.upsert({
          where: { id: mod.id },
          update: {},
          create: {
            ...mod,
            passwordHash: await bcrypt.hash('mod123', 10),
            emailVerified: true,
            isAdmin: false,
          }
        });
      }

      // Create sample active users
      const sampleUsers = [
        {
          id: 'user-001',
          username: 'gamer_alex',
          displayName: 'Alex the Gamer',
          email: 'alex@example.com',
          avatarUrl: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&h=400&fit=crop&crop=face',
          bio: 'Passionate gamer who loves RPGs and competitive multiplayer games.',
        },
        {
          id: 'user-002',
          username: 'techie_sarah',
          displayName: 'Sarah Code',
          email: 'sarah@example.com',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b512e29?w=400&h=400&fit=crop&crop=face',
          bio: 'Full-stack developer interested in blockchain and AI technologies.',
        },
        {
          id: 'user-003',
          username: 'crypto_mike',
          displayName: 'Mike Crypto',
          email: 'mike@example.com',
          avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
          bio: 'DeFi enthusiast and early adopter of new crypto projects.',
        },
        {
          id: 'user-004',
          username: 'artist_luna',
          displayName: 'Luna Arts',
          email: 'luna@example.com',
          avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
          bio: 'Digital artist exploring NFTs and blockchain-based art platforms.',
        }
      ];

      for (const user of sampleUsers) {
        await prisma.user.upsert({
          where: { id: user.id },
          update: {},
          create: {
            ...user,
            passwordHash: await bcrypt.hash('user123', 10),
            emailVerified: true,
            isAdmin: false,
          }
        });
      }

      // Create default communities
      const communities = [
        {
          id: 'community-general',
          name: 'general',
          displayName: 'General Discussion',
          description: 'Welcome to CRYB! This is the place for general conversations, introductions, and community announcements.',
          isPublic: true,
          isNsfw: false,
          rules: [
            "Be respectful and kind to all community members",
            "No spam, self-promotion, or repetitive content",
            "Use appropriate channels for specific topics",
            "No harassment, hate speech, or discrimination",
            "Keep discussions constructive and on-topic"
          ],
          imageUrl: 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=400&h=400&fit=crop',
          bannerUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=400&fit=crop',
        },
        {
          id: 'community-gaming',
          name: 'gaming',
          displayName: 'Gaming Central',
          description: 'Everything gaming! Discuss your favorite games, share gameplay clips, find gaming partners, and stay updated on the latest gaming news.',
          isPublic: true,
          isNsfw: false,
          rules: [
            "No cheating, hacking, or exploit discussions",
            "Mark spoilers appropriately",
            "No toxic behavior or griefing",
            "Respect different gaming preferences and platforms",
            "Share gaming content and experiences constructively"
          ],
          imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=400&fit=crop',
          bannerUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=400&fit=crop',
        },
        {
          id: 'community-technology',
          name: 'technology',
          displayName: 'Tech Talk',
          description: 'Discuss the latest in technology, programming, AI, and innovation. Share projects, ask for help, and explore the future of tech.',
          isPublic: true,
          isNsfw: false,
          rules: [
            "Keep discussions technical and informative",
            "Provide context and sources for claims",
            "Help others learn and grow",
            "No piracy or illegal content sharing",
            "Respect intellectual property and licenses"
          ],
          imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop',
          bannerUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=400&fit=crop',
        },
        {
          id: 'community-crypto',
          name: 'crypto',
          displayName: 'Crypto & DeFi',
          description: 'Explore cryptocurrency, DeFi protocols, NFTs, and blockchain technology. Share insights, discuss market trends, and learn about the decentralized future.',
          isPublic: true,
          isNsfw: false,
          rules: [
            "No financial advice - only educational content",
            "Disclose any conflicts of interest",
            "No pump and dump schemes or scams",
            "Verify information before sharing",
            "Respect different investment strategies"
          ],
          imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=400&fit=crop',
          bannerUrl: 'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?w=1200&h=400&fit=crop',
        },
        {
          id: 'community-creative',
          name: 'creative',
          displayName: 'Creative Corner',
          description: 'Share your art, music, writing, and creative projects. Get feedback, collaborate with other creators, and showcase your talents.',
          isPublic: true,
          isNsfw: false,
          rules: [
            "Respect creative work and intellectual property",
            "Provide constructive feedback only",
            "Credit original creators appropriately",
            "No art theft or unauthorized use",
            "Support and encourage fellow creators"
          ],
          imageUrl: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=400&fit=crop',
          bannerUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop',
        },
        {
          id: 'community-help',
          name: 'help',
          displayName: 'Help & Support',
          description: 'Need help with CRYB or have questions? This is your go-to place for support, tutorials, and community assistance.',
          isPublic: true,
          isNsfw: false,
          rules: [
            "Search existing posts before asking questions",
            "Provide clear and detailed problem descriptions",
            "Be patient with community helpers",
            "Share solutions when you find them",
            "Help others when you can"
          ],
          imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=400&fit=crop',
          bannerUrl: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200&h=400&fit=crop',
        }
      ];

      const createdCommunities = [];
      for (const community of communities) {
        const created = await prisma.community.create({
          data: {
            ...community,
            memberCount: 0,
          }
        });
        createdCommunities.push(created);
      }

      // Add all users to all communities
      const allUsers = await prisma.user.findMany();
      for (const community of createdCommunities) {
        for (const user of allUsers) {
          await prisma.communityMember.create({
            data: {
              communityId: community.id,
              userId: user.id,
            }
          });
        }
      }

      // Create sample posts
      const samplePosts = [
        {
          id: 'post-welcome-001',
          title: 'Welcome to CRYB! 🎉',
          content: `Hey everyone! Welcome to CRYB, the next-generation community platform that combines the best of Discord and Reddit.

Here you can:
- **Chat in real-time** with voice and video support
- **Create and join communities** around your interests  
- **Vote on content** to surface the best discussions
- **Explore Web3 features** including NFT integration

We're excited to have you here! Drop a comment below to introduce yourself and let us know what communities you're most excited about.

Happy posting! 🚀`,
          communityId: 'community-general',
          userId: 'admin-user-001',
          type: 'text',
          isPinned: true,
        },
        {
          id: 'post-gaming-001',
          title: 'What\'s everyone playing this week? 🎮',
          content: `Drop your current games in the comments! Always looking for new recommendations and potential co-op partners.

Currently grinding through:
- **Cyberpunk 2077** - Finally giving it another shot after the updates
- **Valheim** - Building the most epic base with friends
- **Rocket League** - Still terrible but having fun 😅

What about you? Any hidden gems you'd recommend?`,
          communityId: 'community-gaming',
          userId: 'user-001',
          type: 'text',
          imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=400&fit=crop',
        },
        {
          id: 'post-tech-001',
          title: 'The Future of AI in Software Development',
          content: `Interesting article about how AI is transforming the software development landscape. What do you think about AI-assisted coding?

Key points from the article:
- AI can boost productivity by 30-50%
- But human creativity and problem-solving remain essential
- The future is likely human-AI collaboration, not replacement

As a developer, I'm excited but also cautious. AI tools like GitHub Copilot are incredibly helpful, but understanding the fundamentals is still crucial.

What's your experience with AI coding tools?`,
          url: 'https://techcrunch.com/ai-software-development-future',
          communityId: 'community-technology',
          userId: 'user-002',
          type: 'link',
        }
      ];

      const createdPosts = [];
      for (const post of samplePosts) {
        const created = await prisma.post.create({
          data: {
            ...post,
            score: 0,
          }
        });
        createdPosts.push(created);
      }

      // Create sample comments
      const sampleComments = [
        {
          id: 'comment-001',
          content: 'This is exactly what I\'ve been looking for! Love the combination of real-time chat and Reddit-style voting. Can\'t wait to explore more communities! 🎉',
          postId: 'post-welcome-001',
          userId: 'user-001',
        },
        {
          id: 'comment-002',
          content: 'Welcome to the community! Make sure to check out the Gaming Central - lots of great discussions happening there!',
          postId: 'post-welcome-001',
          userId: 'mod-user-001',
          parentId: 'comment-001',
        },
        {
          id: 'comment-003',
          content: 'Currently obsessed with Elden Ring! The open world is just incredible. Anyone up for some co-op sessions?',
          postId: 'post-gaming-001',
          userId: 'user-002',
        }
      ];

      for (const comment of sampleComments) {
        await prisma.comment.create({
          data: comment
        });
      }

      // Update community member counts
      for (const community of createdCommunities) {
        const memberCount = await prisma.communityMember.count({
          where: { communityId: community.id }
        });
        await prisma.community.update({
          where: { id: community.id },
          data: { memberCount }
        });
      }

      return reply.send({
        success: true,
        message: "Initial content seeded successfully",
        data: {
          users: allUsers.length,
          communities: createdCommunities.length,
          posts: createdPosts.length,
          comments: sampleComments.length,
        }
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to seed initial content"
      });
    }
  });

  // Get onboarding data
  fastify.get("/onboarding-data", {
    schema: {
      tags: ['Seeding'],
      summary: 'Get onboarding data for new users',
    }
  }, async (request, reply) => {
    try {
      // Get popular communities
      const communities = await prisma.community.findMany({
        where: { isPublic: true },
        include: {
          _count: {
            select: { members: true, posts: true }
          }
        },
        orderBy: { memberCount: 'desc' },
        take: 10
      });

      // Get featured posts
      const featuredPosts = await prisma.post.findMany({
        where: {
          isPinned: true,
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
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      // Get community categories
      const categories = [
        { id: 'gaming', name: 'Gaming', icon: 'game-controller', description: 'Video games, esports, streaming' },
        { id: 'technology', name: 'Technology', icon: 'laptop', description: 'Programming, AI, innovation' },
        { id: 'crypto', name: 'Crypto & DeFi', icon: 'logo-bitcoin', description: 'Blockchain, NFTs, trading' },
        { id: 'creative', name: 'Creative Arts', icon: 'color-palette', description: 'Art, music, design, writing' },
        { id: 'general', name: 'General', icon: 'chatbubbles', description: 'Discussion, introductions, announcements' },
        { id: 'help', name: 'Help & Support', icon: 'help-circle', description: 'Questions, tutorials, assistance' }
      ];

      return reply.send({
        success: true,
        data: {
          communities,
          featuredPosts,
          categories,
          stats: {
            totalCommunities: await prisma.community.count({ where: { isPublic: true } }),
            totalUsers: await prisma.user.count(),
            totalPosts: await prisma.post.count(),
          }
        }
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get onboarding data"
      });
    }
  });

  // Save user onboarding preferences
  fastify.post("/onboarding-preferences", {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Seeding'],
      summary: 'Save user onboarding preferences',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          interests: { 
            type: 'array',
            items: { type: 'string' }
          },
          communities: {
            type: 'array', 
            items: { type: 'string' }
          },
          preferences: {
            type: 'object',
            properties: {
              allowNotifications: { type: 'boolean' },
              allowLocationServices: { type: 'boolean' },
              preferredTheme: { type: 'string', enum: ['light', 'dark', 'auto'] }
            }
          }
        },
        required: ['interests']
      }
    }
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const { interests, communities = [], preferences = {} } = request.body as {
        interests: string[];
        communities: string[];
        preferences: any;
      };

      // Update user profile with interests and preferences
      await prisma.user.update({
        where: { id: user.id },
        data: {
          bio: user.bio || `Interested in ${interests.join(', ')}`,
          // Store preferences in a JSON field if available
        }
      });

      // Join selected communities
      for (const communityId of communities) {
        await prisma.communityMember.upsert({
          where: {
            communityId_userId: {
              communityId,
              userId: user.id
            }
          },
          update: {},
          create: {
            communityId,
            userId: user.id
          }
        });

        // Update community member count
        await prisma.community.update({
          where: { id: communityId },
          data: {
            memberCount: {
              increment: 1
            }
          }
        });
      }

      // Create welcome notification
      await prisma.notification.create({
        data: {
          id: `welcome-${user.id}-${Date.now()}`,
          userId: user.id,
          type: 'welcome',
          title: 'Welcome to CRYB! 🎉',
          content: `Thanks for joining our community! You've joined ${communities.length} communities based on your interests.`,
          data: {
            interests,
            communities,
            preferences
          }
        }
      });

      return reply.send({
        success: true,
        message: "Onboarding preferences saved successfully",
        data: {
          joinedCommunities: communities.length,
          selectedInterests: interests.length
        }
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to save onboarding preferences"
      });
    }
  });

  // Get personalized content suggestions for new users
  fastify.get("/content-suggestions", {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Seeding'],
      summary: 'Get personalized content suggestions',
      security: [{ bearerAuth: [] }],
    }
  }, async (request, reply) => {
    try {
      const user = (request as any).user;

      // Get user's communities
      const userCommunities = await prisma.communityMember.findMany({
        where: { userId: user.id },
        include: {
          community: true
        }
      });

      if (userCommunities.length === 0) {
        // If user hasn't joined any communities, suggest popular ones
        const popularCommunities = await prisma.community.findMany({
          where: { isPublic: true },
          orderBy: { memberCount: 'desc' },
          take: 5
        });

        return reply.send({
          success: true,
          data: {
            suggestedCommunities: popularCommunities,
            posts: [],
            message: "Join some communities to get personalized content suggestions!"
          }
        });
      }

      // Get recent posts from user's communities
      const communityIds = userCommunities.map(uc => uc.communityId);
      const suggestedPosts = await prisma.post.findMany({
        where: {
          communityId: { in: communityIds }
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
        take: 10
      });

      // Suggest similar communities
      const similarCommunities = await prisma.community.findMany({
        where: {
          isPublic: true,
          id: { notIn: communityIds }
        },
        orderBy: { memberCount: 'desc' },
        take: 3
      });

      return reply.send({
        success: true,
        data: {
          posts: suggestedPosts,
          suggestedCommunities: similarCommunities,
          userCommunities: userCommunities.map(uc => uc.community)
        }
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get content suggestions"
      });
    }
  });
};

export default seedingRoutes;