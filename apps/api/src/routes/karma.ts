import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "@cryb/database";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth";

const karmaRoutes: FastifyPluginAsync = async (fastify) => {
  // Get user karma breakdown
  fastify.get("/user/:userId", async (request, reply) => {
    await optionalAuthMiddleware(request, reply);
    
    try {
      const { userId } = z.object({
        userId: z.string(),
      }).parse(request.params);

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          createdAt: true,
        },
      });

      if (!user) {
        return reply.code(404).send({
          success: false,
          error: "User not found",
        });
      }

      // Calculate post karma
      const postVotes = await prisma.vote.findMany({
        where: {
          post: {
            userId: userId,
          },
        },
      });

      const postKarma = postVotes.reduce((sum, vote) => sum + vote.value, 0);

      // Calculate comment karma
      const commentVotes = await prisma.vote.findMany({
        where: {
          comment: {
            userId: userId,
          },
        },
      });

      const commentKarma = commentVotes.reduce((sum, vote) => sum + vote.value, 0);

      // Get awards received
      const awardsReceived = await prisma.award.findMany({
        where: { receiverId: userId },
      });

      const awardKarma = awardsReceived.reduce((sum, award) => {
        // Award karma based on type
        const awardValues = {
          silver: 10,
          gold: 50,
          platinum: 100,
          helpful: 15,
          wholesome: 12,
          mind_blown: 20,
        };
        return sum + (awardValues[award.type as keyof typeof awardValues] || 0);
      }, 0);

      // Calculate total karma
      const totalKarma = postKarma + commentKarma + awardKarma;

      // Get karma breakdown by time period
      const now = new Date();
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

      const recentPostVotes = await prisma.vote.findMany({
        where: {
          post: {
            userId: userId,
          },
          createdAt: {
            gte: oneMonthAgo,
          },
        },
      });

      const recentCommentVotes = await prisma.vote.findMany({
        where: {
          comment: {
            userId: userId,
          },
          createdAt: {
            gte: oneMonthAgo,
          },
        },
      });

      const recentKarma = [
        ...recentPostVotes,
        ...recentCommentVotes,
      ].reduce((sum, vote) => sum + vote.value, 0);

      // Get top posts and comments
      const topPosts = await prisma.post.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          score: true,
          createdAt: true,
          community: {
            select: {
              name: true,
              displayName: true,
            },
          },
        },
        orderBy: { score: "desc" },
        take: 5,
      });

      const topComments = await prisma.comment.findMany({
        where: { userId },
        select: {
          id: true,
          content: true,
          score: true,
          createdAt: true,
          post: {
            select: {
              id: true,
              title: true,
              community: {
                select: {
                  name: true,
                  displayName: true,
                },
              },
            },
          },
        },
        orderBy: { score: "desc" },
        take: 5,
      });

      // Calculate user tier based on karma
      let tier = "Bronze";
      let tierProgress = 0;
      let nextTierThreshold = 100;

      if (totalKarma >= 10000) {
        tier = "Diamond";
        tierProgress = 100;
        nextTierThreshold = 10000;
      } else if (totalKarma >= 5000) {
        tier = "Platinum";
        tierProgress = Math.min(100, ((totalKarma - 5000) / 5000) * 100);
        nextTierThreshold = 10000;
      } else if (totalKarma >= 1000) {
        tier = "Gold";
        tierProgress = Math.min(100, ((totalKarma - 1000) / 4000) * 100);
        nextTierThreshold = 5000;
      } else if (totalKarma >= 100) {
        tier = "Silver";
        tierProgress = Math.min(100, ((totalKarma - 100) / 900) * 100);
        nextTierThreshold = 1000;
      } else {
        tierProgress = Math.min(100, (totalKarma / 100) * 100);
      }

      return reply.send({
        success: true,
        data: {
          user,
          karma: {
            total: totalKarma,
            post: postKarma,
            comment: commentKarma,
            award: awardKarma,
            recent30Days: recentKarma,
          },
          tier: {
            current: tier,
            progress: tierProgress,
            nextThreshold: nextTierThreshold,
          },
          stats: {
            totalPosts: await prisma.post.count({ where: { userId } }),
            totalComments: await prisma.comment.count({ where: { userId } }),
            awardsReceived: awardsReceived.length,
            topPosts,
            topComments,
          },
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get user karma",
      });
    }
  });

  // Get karma leaderboard
  fastify.get("/leaderboard", async (request, reply) => {
    try {
      const { timeFrame = "all", limit = 25 } = z.object({
        timeFrame: z.enum(["day", "week", "month", "year", "all"]).default("all"),
        limit: z.coerce.number().min(1).max(100).default(25),
      }).parse(request.query);

      let dateFilter: any = {};
      const now = new Date();

      switch (timeFrame) {
        case "day":
          dateFilter = { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) };
          break;
        case "week":
          dateFilter = { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
          break;
        case "month":
          dateFilter = { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
          break;
        case "year":
          dateFilter = { gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
          break;
        default:
          dateFilter = undefined;
      }

      // Get all users with their karma scores
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          createdAt: true,
        },
        take: 1000, // Limit to avoid performance issues
      });

      // Calculate karma for each user
      const usersWithKarma = await Promise.all(
        users.map(async (user) => {
          const whereClause = dateFilter ? { createdAt: dateFilter } : {};

          const [postVotes, commentVotes] = await Promise.all([
            prisma.vote.findMany({
              where: {
                ...whereClause,
                post: {
                  userId: user.id,
                },
              },
            }),
            prisma.vote.findMany({
              where: {
                ...whereClause,
                comment: {
                  userId: user.id,
                },
              },
            }),
          ]);

          const karma = [...postVotes, ...commentVotes].reduce(
            (sum, vote) => sum + vote.value,
            0
          );

          return {
            ...user,
            karma,
          };
        })
      );

      // Sort by karma and take top users
      const topUsers = usersWithKarma
        .filter(user => user.karma > 0) // Only include users with positive karma
        .sort((a, b) => b.karma - a.karma)
        .slice(0, limit)
        .map((user, index) => ({
          rank: index + 1,
          user: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            avatar: user.avatar,
          },
          karma: user.karma,
        }));

      return reply.send({
        success: true,
        data: {
          timeFrame,
          leaders: topUsers,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get karma leaderboard",
      });
    }
  });

  // Get user's karma history (requires auth)
  fastify.get("/history", { preHandler: [authMiddleware] }, async (request: any, reply) => {
    try {
      const { page = 1, limit = 50, days = 30 } = z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(50),
        days: z.coerce.number().min(1).max(365).default(30),
      }).parse(request.query);

      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Get all votes on user's content
      const [postVotes, commentVotes] = await Promise.all([
        prisma.vote.findMany({
          where: {
            post: {
              userId: request.userId,
            },
            createdAt: {
              gte: cutoffDate,
            },
          },
          include: {
            post: {
              select: {
                id: true,
                title: true,
              },
            },
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.vote.findMany({
          where: {
            comment: {
              userId: request.userId,
            },
            createdAt: {
              gte: cutoffDate,
            },
          },
          include: {
            comment: {
              select: {
                id: true,
                content: true,
              },
            },
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      // Combine and sort all karma events
      const allKarmaEvents = [
        ...postVotes.map(vote => ({
          type: "post_vote" as const,
          value: vote.value,
          date: vote.createdAt,
          source: vote.post,
          voter: vote.user,
        })),
        ...commentVotes.map(vote => ({
          type: "comment_vote" as const,
          value: vote.value,
          date: vote.createdAt,
          source: vote.comment,
          voter: vote.user,
        })),
      ].sort((a, b) => b.date.getTime() - a.date.getTime());

      // Paginate results
      const startIndex = (page - 1) * limit;
      const paginatedEvents = allKarmaEvents.slice(startIndex, startIndex + limit);

      // Calculate daily karma totals
      const dailyKarma = new Map<string, number>();
      allKarmaEvents.forEach(event => {
        const dateKey = event.date.toISOString().split('T')[0];
        dailyKarma.set(dateKey, (dailyKarma.get(dateKey) || 0) + event.value);
      });

      const dailyKarmaArray = Array.from(dailyKarma.entries())
        .map(([date, karma]) => ({ date, karma }))
        .sort((a, b) => b.date.localeCompare(a.date));

      return reply.send({
        success: true,
        data: {
          events: paginatedEvents,
          total: allKarmaEvents.length,
          page,
          pageSize: limit,
          hasMore: startIndex + limit < allKarmaEvents.length,
          dailyBreakdown: dailyKarmaArray,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get karma history",
      });
    }
  });

  // Get trending content based on karma velocity
  fastify.get("/trending", async (request, reply) => {
    try {
      const { timeFrame = "day", contentType = "all" } = z.object({
        timeFrame: z.enum(["hour", "day", "week"]).default("day"),
        contentType: z.enum(["posts", "comments", "all"]).default("all"),
      }).parse(request.query);

      let hoursBack = 24;
      switch (timeFrame) {
        case "hour":
          hoursBack = 1;
          break;
        case "week":
          hoursBack = 168;
          break;
      }

      const cutoffDate = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

      let trendingContent: any[] = [];

      if (contentType === "posts" || contentType === "all") {
        const trendingPosts = await prisma.post.findMany({
          where: {
            createdAt: {
              gte: cutoffDate,
            },
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
            community: {
              select: {
                id: true,
                name: true,
                displayName: true,
                icon: true,
              },
            },
            _count: {
              select: { comments: true, votes: true },
            },
          },
          orderBy: { score: "desc" },
          take: 25,
        });

        trendingContent.push(...trendingPosts.map(post => ({
          type: "post",
          content: post,
          velocity: post.score / Math.max(1, (Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60)), // karma per hour
        })));
      }

      if (contentType === "comments" || contentType === "all") {
        const trendingComments = await prisma.comment.findMany({
          where: {
            createdAt: {
              gte: cutoffDate,
            },
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
            post: {
              select: {
                id: true,
                title: true,
                community: {
                  select: {
                    id: true,
                    name: true,
                    displayName: true,
                  },
                },
              },
            },
            _count: {
              select: { replies: true },
            },
          },
          orderBy: { score: "desc" },
          take: 25,
        });

        trendingContent.push(...trendingComments.map(comment => ({
          type: "comment",
          content: comment,
          velocity: comment.score / Math.max(1, (Date.now() - comment.createdAt.getTime()) / (1000 * 60 * 60)), // karma per hour
        })));
      }

      // Sort by velocity (karma per hour) and take top items
      const sortedContent = trendingContent
        .sort((a, b) => b.velocity - a.velocity)
        .slice(0, 50);

      return reply.send({
        success: true,
        data: {
          timeFrame,
          contentType,
          trending: sortedContent,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get trending content",
      });
    }
  });
};

export default karmaRoutes;