import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "@cryb/database";
import { authMiddleware } from "../middleware/auth";
import bcrypt from "bcryptjs";

const adminContentRoutes: FastifyPluginAsync = async (fastify) => {
  // Admin-only middleware
  const adminMiddleware = async (request: any, reply: any) => {
    const user = request.user;
    if (!user?.isAdmin) {
      return reply.code(403).send({
        success: false,
        error: "Admin access required"
      });
    }
  };

  // Get platform statistics
  fastify.get("/stats", {
    preHandler: [authMiddleware, adminMiddleware],
    schema: {
      tags: ['Admin'],
      summary: 'Get platform statistics',
      security: [{ bearerAuth: [] }],
    }
  }, async (request, reply) => {
    try {
      const [
        userCount,
        communityCount,
        postCount,
        commentCount,
        activeUsers,
        postsToday
      ] = await Promise.all([
        prisma.user.count(),
        prisma.community.count(),
        prisma.post.count(),
        prisma.comment.count(),
        prisma.user.count({
          where: {
            lastActive: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          }
        }),
        prisma.post.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)) // Today
            }
          }
        })
      ]);

      return reply.send({
        success: true,
        data: {
          users: userCount,
          communities: communityCount,
          posts: postCount,
          comments: commentCount,
          activeUsers,
          postsToday,
          engagementRate: postCount > 0 ? Math.round((commentCount / postCount) * 100) : 0
        }
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get statistics"
      });
    }
  });

  // Create sample content
  fastify.post("/create-content", {
    preHandler: [authMiddleware, adminMiddleware],
    schema: {
      tags: ['Admin'],
      summary: 'Create sample content',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          communityName: { type: 'string' },
          communityDisplayName: { type: 'string' },
          communityDescription: { type: 'string' },
          postTitle: { type: 'string' },
          postContent: { type: 'string' },
          postType: { type: 'string', enum: ['text', 'link', 'image'] },
          postUrl: { type: 'string' },
          authorUsername: { type: 'string' }
        },
        required: ['communityName', 'communityDisplayName', 'postTitle', 'postContent', 'authorUsername']
      }
    }
  }, async (request, reply) => {
    try {
      const {
        communityName,
        communityDisplayName,
        communityDescription,
        postTitle,
        postContent,
        postType = 'text',
        postUrl,
        authorUsername
      } = request.body as {
        communityName: string;
        communityDisplayName: string;
        communityDescription?: string;
        postTitle: string;
        postContent: string;
        postType?: 'text' | 'link' | 'image';
        postUrl?: string;
        authorUsername: string;
      };

      // Find or create the author
      let author = await prisma.user.findFirst({
        where: { username: authorUsername }
      });

      if (!author) {
        // Create a sample user if it doesn't exist
        author = await prisma.user.create({
          data: {
            id: `user-${authorUsername}-${Date.now()}`,
            username: authorUsername,
            displayName: authorUsername.charAt(0).toUpperCase() + authorUsername.slice(1),
            email: `${authorUsername}@example.com`,
            passwordHash: await bcrypt.hash('password123', 10),
            emailVerified: true,
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorUsername}`,
            bio: `Sample user created for content seeding`
          }
        });
      }

      // Find or create the community
      let community = await prisma.community.findFirst({
        where: { name: communityName }
      });

      if (!community) {
        community = await prisma.community.create({
          data: {
            id: `community-${communityName}-${Date.now()}`,
            name: communityName,
            displayName: communityDisplayName,
            description: communityDescription || `A community for ${communityDisplayName}`,
            isPublic: true,
            isNsfw: false,
            rules: [
              "Be respectful to all members",
              "Stay on topic",
              "No spam or self-promotion",
              "Follow community guidelines"
            ],
            imageUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${communityName}`,
            memberCount: 0
          }
        });

        // Add the author as a member
        await prisma.communityMember.create({
          data: {
            communityId: community.id,
            userId: author.id
          }
        });

        // Update member count
        await prisma.community.update({
          where: { id: community.id },
          data: { memberCount: 1 }
        });
      }

      // Create the post
      const post = await prisma.post.create({
        data: {
          id: `post-${Date.now()}`,
          title: postTitle,
          content: postContent,
          url: postUrl,
          communityId: community.id,
          userId: author.id,
          type: postType,
          score: Math.floor(Math.random() * 50) + 1, // Random initial score
        }
      });

      // Create some sample votes
      const sampleUsers = await prisma.user.findMany({ take: 5 });
      for (const user of sampleUsers) {
        if (Math.random() > 0.5) { // 50% chance of voting
          try {
            await prisma.postVote.create({
              data: {
                postId: post.id,
                userId: user.id,
                voteType: Math.random() > 0.2 ? 'up' : 'down' // 80% upvotes
              }
            });
          } catch (error) {
            // Ignore duplicate vote errors
          }
        }
      }

      // Update post score based on votes
      const votes = await prisma.postVote.findMany({
        where: { postId: post.id }
      });
      const score = votes.reduce((sum, vote) => sum + (vote.voteType === 'up' ? 1 : -1), 0);
      
      await prisma.post.update({
        where: { id: post.id },
        data: { score }
      });

      // Create a sample comment
      const sampleComment = await prisma.comment.create({
        data: {
          id: `comment-${Date.now()}`,
          content: `Great post! This is exactly the kind of content we need in ${community.displayName}.`,
          postId: post.id,
          userId: author.id
        }
      });

      return reply.send({
        success: true,
        message: "Sample content created successfully",
        data: {
          community: {
            id: community.id,
            name: community.name,
            displayName: community.displayName
          },
          post: {
            id: post.id,
            title: post.title,
            score
          },
          author: {
            id: author.id,
            username: author.username,
            displayName: author.displayName
          }
        }
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to create sample content"
      });
    }
  });

  // Bulk create sample users
  fastify.post("/create-sample-users", {
    preHandler: [authMiddleware, adminMiddleware],
    schema: {
      tags: ['Admin'],
      summary: 'Create multiple sample users',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          count: { type: 'number', minimum: 1, maximum: 100 },
          usernames: { 
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { count = 10, usernames = [] } = request.body as {
        count?: number;
        usernames?: string[];
      };

      const defaultUsernames = [
        'alice_codes', 'bob_builder', 'charlie_crypto', 'diana_designer', 'eve_explorer',
        'frank_gamer', 'grace_guru', 'henry_hacker', 'iris_innovator', 'jack_journalist',
        'kate_creative', 'liam_leader', 'maya_musician', 'noah_navigator', 'olivia_optimizer',
        'paul_programmer', 'quinn_quester', 'ruby_researcher', 'sam_scientist', 'tina_tester'
      ];

      const usersToCreate = usernames.length > 0 ? usernames : defaultUsernames.slice(0, count);
      const createdUsers = [];

      for (const username of usersToCreate) {
        try {
          const existingUser = await prisma.user.findFirst({
            where: { username }
          });

          if (!existingUser) {
            const user = await prisma.user.create({
              data: {
                id: `user-${username}-${Date.now()}`,
                username,
                displayName: username.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                email: `${username}@example.com`,
                passwordHash: await bcrypt.hash('password123', 10),
                emailVerified: true,
                avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
                bio: `Sample user interested in various topics`
              }
            });
            createdUsers.push(user);

            // Join some random communities
            const communities = await prisma.community.findMany({ take: 5 });
            for (const community of communities) {
              if (Math.random() > 0.5) { // 50% chance to join each community
                try {
                  await prisma.communityMember.create({
                    data: {
                      communityId: community.id,
                      userId: user.id
                    }
                  });
                } catch (error) {
                  // Ignore if already a member
                }
              }
            }
          }
        } catch (error) {
          console.error(`Failed to create user ${username}:`, error);
        }
      }

      // Update community member counts
      const communities = await prisma.community.findMany();
      for (const community of communities) {
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
        message: `Created ${createdUsers.length} sample users`,
        data: {
          createdUsers: createdUsers.map(u => ({
            id: u.id,
            username: u.username,
            displayName: u.displayName
          }))
        }
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to create sample users"
      });
    }
  });

  // Get content analytics
  fastify.get("/analytics", {
    preHandler: [authMiddleware, adminMiddleware],
    schema: {
      tags: ['Admin'],
      summary: 'Get content analytics',
      security: [{ bearerAuth: [] }],
    }
  }, async (request, reply) => {
    try {
      // Community analytics
      const communityAnalytics = await prisma.community.findMany({
        include: {
          _count: {
            select: {
              members: true,
              posts: true
            }
          }
        },
        orderBy: { memberCount: 'desc' }
      });

      // User activity analytics
      const userActivity = await prisma.user.findMany({
        include: {
          _count: {
            select: {
              posts: true,
              comments: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      // Post engagement analytics
      const postEngagement = await prisma.post.findMany({
        include: {
          _count: {
            select: { comments: true }
          },
          community: {
            select: { name: true, displayName: true }
          },
          user: {
            select: { username: true, displayName: true }
          }
        },
        orderBy: { score: 'desc' },
        take: 10
      });

      // Weekly activity trends
      const weeklyPosts = await prisma.post.groupBy({
        by: ['createdAt'],
        _count: { id: true },
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      });

      return reply.send({
        success: true,
        data: {
          communities: communityAnalytics.map(c => ({
            id: c.id,
            name: c.displayName,
            members: c._count.members,
            posts: c._count.posts,
            engagementRate: c._count.posts > 0 ? (c._count.posts / c._count.members) * 100 : 0
          })),
          topUsers: userActivity.map(u => ({
            id: u.id,
            username: u.username,
            displayName: u.displayName,
            posts: u._count.posts,
            comments: u._count.comments,
            totalActivity: u._count.posts + u._count.comments
          })),
          topPosts: postEngagement.map(p => ({
            id: p.id,
            title: p.title,
            score: p.score,
            comments: p._count.comments,
            community: p.community.displayName,
            author: p.user.displayName
          })),
          trends: {
            weeklyPosts: weeklyPosts.length,
            averageEngagement: postEngagement.length > 0 
              ? Math.round(postEngagement.reduce((sum, p) => sum + p._count.comments, 0) / postEngagement.length)
              : 0
          }
        }
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get analytics"
      });
    }
  });

  // Reset platform data (dangerous - admin only)
  fastify.post("/reset-platform", {
    preHandler: [authMiddleware, adminMiddleware],
    schema: {
      tags: ['Admin'],
      summary: 'Reset platform data (DANGEROUS)',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          confirmPhrase: { type: 'string' }
        },
        required: ['confirmPhrase']
      }
    }
  }, async (request, reply) => {
    try {
      const { confirmPhrase } = request.body as { confirmPhrase: string };
      
      if (confirmPhrase !== 'RESET_CRYB_PLATFORM') {
        return reply.code(400).send({
          success: false,
          error: "Invalid confirmation phrase"
        });
      }

      // Delete all data except admin users
      await prisma.postVote.deleteMany();
      await prisma.commentVote.deleteMany();
      await prisma.comment.deleteMany();
      await prisma.post.deleteMany();
      await prisma.communityMember.deleteMany();
      await prisma.communityModerator.deleteMany();
      await prisma.community.deleteMany();
      await prisma.notification.deleteMany();
      
      // Delete non-admin users
      await prisma.user.deleteMany({
        where: { isAdmin: false }
      });

      return reply.send({
        success: true,
        message: "Platform data reset successfully. Only admin users remain."
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to reset platform data"
      });
    }
  });
};

export default adminContentRoutes;