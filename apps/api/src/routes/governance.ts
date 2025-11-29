import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "@cryb/database";
import { authMiddleware } from "../middleware/auth";

const governanceRoutes: FastifyPluginAsync = async (fastify) => {

  // Get all governance proposals
  fastify.get("/v1/governance/proposals", async (request, reply) => {
    try {
      const { status, communityId } = z.object({
        status: z.enum(['PENDING', 'ACTIVE', 'PASSED', 'REJECTED', 'EXECUTED', 'CANCELLED']).optional(),
        communityId: z.string().optional()
      }).parse(request.query);

      const where: any = {};
      if (status) where.status = status;
      if (communityId) where.communityId = communityId;

      const proposals = await prisma.governanceProposal.findMany({
        where,
        include: {
          proposer: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true
            }
          },
          community: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          _count: {
            select: { votes: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Calculate vote stats for each proposal
      const proposalsWithStats = await Promise.all(
        proposals.map(async (proposal) => {
          const voteStats = await prisma.governanceVote.groupBy({
            by: ['option'],
            where: { proposalId: proposal.id },
            _sum: { votingPower: true },
            _count: true
          });

          const totalVotes = voteStats.reduce((sum, stat) => sum + (Number(stat._sum.votingPower) || 0), 0);
          const totalVoters = voteStats.reduce((sum, stat) => sum + stat._count, 0);

          return {
            ...proposal,
            voteStats: voteStats.map(stat => ({
              option: stat.option,
              votingPower: stat._sum.votingPower || '0',
              voterCount: stat._count
            })),
            totalVotes: totalVotes.toString(),
            totalVoters
          };
        })
      );

      return reply.send({
        success: true,
        data: proposalsWithStats
      });
    } catch (error: any) {
      fastify.log.error('Failed to fetch proposals:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch proposals'
      });
    }
  });

  // Get specific proposal
  fastify.get("/v1/governance/proposals/:id", async (request, reply) => {
    try {
      const { id } = z.object({
        id: z.string()
      }).parse(request.params);

      const proposal = await prisma.governanceProposal.findUnique({
        where: { id },
        include: {
          proposer: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true
            }
          },
          community: {
            select: {
              id: true,
              name: true,
              slug: true,
              memberCount: true
            }
          },
          votes: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatar: true
                }
              }
            },
            orderBy: { votedAt: 'desc' }
          }
        }
      });

      if (!proposal) {
        return reply.code(404).send({
          success: false,
          error: 'Proposal not found'
        });
      }

      // Calculate vote statistics
      const voteStats = await prisma.governanceVote.groupBy({
        by: ['option'],
        where: { proposalId: id },
        _sum: { votingPower: true },
        _count: true
      });

      const totalVotes = voteStats.reduce((sum, stat) => sum + (Number(stat._sum.votingPower) || 0), 0);
      const quorumReached = totalVotes >= Number(proposal.quorumThreshold);

      return reply.send({
        success: true,
        data: {
          ...proposal,
          voteStats: voteStats.map(stat => ({
            option: stat.option,
            votingPower: stat._sum.votingPower || '0',
            voterCount: stat._count,
            percentage: totalVotes > 0 ? ((Number(stat._sum.votingPower) || 0) / totalVotes * 100).toFixed(2) : '0'
          })),
          totalVotes: totalVotes.toString(),
          quorumReached,
          votingEnded: new Date() > proposal.endDate
        }
      });
    } catch (error: any) {
      fastify.log.error('Failed to fetch proposal:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch proposal'
      });
    }
  });

  // Create new proposal
  fastify.post("/v1/governance/proposals", {
    preHandler: authMiddleware
  }, async (request, reply) => {
    try {
      const user = (request as any).user;

      const body = z.object({
        communityId: z.string(),
        title: z.string().min(1).max(200),
        description: z.string().min(1).max(10000),
        options: z.array(z.string()).min(2).max(10),
        votingPeriodDays: z.number().int().min(1).max(30),
        executionDelayDays: z.number().int().min(0).max(30).default(2),
        quorumThreshold: z.string(), // Minimum voting power required
        approvalThreshold: z.string(), // Minimum approval percentage (in basis points, 5000 = 50%)
        snapshotBlock: z.number().int().optional(),
        proposalType: z.enum(['GENERAL', 'PARAMETER_CHANGE', 'TREASURY', 'UPGRADE']).default('GENERAL')
      }).parse(request.body);

      // Check if user is member of community
      const membership = await prisma.communityMember.findFirst({
        where: {
          communityId: body.communityId,
          userId: user.id
        }
      });

      if (!membership) {
        return reply.code(403).send({
          success: false,
          error: 'Must be a community member to create proposals'
        });
      }

      // Calculate dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + body.votingPeriodDays);

      const executionDate = new Date(endDate);
      executionDate.setDate(executionDate.getDate() + body.executionDelayDays);

      // Create proposal
      const proposal = await prisma.governanceProposal.create({
        data: {
          communityId: body.communityId,
          proposerId: user.id,
          title: body.title,
          description: body.description,
          options: body.options,
          startDate,
          endDate,
          executionDate,
          quorumThreshold: body.quorumThreshold,
          approvalThreshold: body.approvalThreshold,
          snapshotBlock: body.snapshotBlock,
          proposalType: body.proposalType,
          status: 'ACTIVE'
        },
        include: {
          proposer: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true
            }
          },
          community: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      });

      return reply.code(201).send({
        success: true,
        data: proposal,
        message: 'Proposal created successfully'
      });
    } catch (error: any) {
      fastify.log.error('Failed to create proposal:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to create proposal',
        details: error.message
      });
    }
  });

  // Vote on proposal
  fastify.post("/v1/governance/proposals/:id/vote", {
    preHandler: authMiddleware
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const { id } = z.object({
        id: z.string()
      }).parse(request.params);

      const body = z.object({
        option: z.number().int().min(0),
        votingPower: z.string(), // Amount of tokens/voting power (in wei)
        signature: z.string().optional(), // Signature for off-chain voting
        reason: z.string().max(1000).optional()
      }).parse(request.body);

      // Find proposal
      const proposal = await prisma.governanceProposal.findUnique({
        where: { id },
        include: {
          community: true
        }
      });

      if (!proposal) {
        return reply.code(404).send({
          success: false,
          error: 'Proposal not found'
        });
      }

      // Check if voting is active
      const now = new Date();
      if (now < proposal.startDate) {
        return reply.code(400).send({
          success: false,
          error: 'Voting has not started yet'
        });
      }

      if (now > proposal.endDate) {
        return reply.code(400).send({
          success: false,
          error: 'Voting has ended'
        });
      }

      if (proposal.status !== 'ACTIVE') {
        return reply.code(400).send({
          success: false,
          error: 'Proposal is not active'
        });
      }

      // Check if option is valid
      if (body.option >= proposal.options.length) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid vote option'
        });
      }

      // Check if user has already voted
      const existingVote = await prisma.governanceVote.findFirst({
        where: {
          proposalId: id,
          userId: user.id
        }
      });

      if (existingVote) {
        return reply.code(400).send({
          success: false,
          error: 'You have already voted on this proposal'
        });
      }

      // Check if user is community member
      const membership = await prisma.communityMember.findFirst({
        where: {
          communityId: proposal.communityId,
          userId: user.id
        }
      });

      if (!membership) {
        return reply.code(403).send({
          success: false,
          error: 'Must be a community member to vote'
        });
      }

      // Create vote
      const vote = await prisma.governanceVote.create({
        data: {
          proposalId: id,
          userId: user.id,
          option: body.option,
          votingPower: body.votingPower,
          signature: body.signature,
          reason: body.reason,
          votedAt: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true
            }
          }
        }
      });

      return reply.send({
        success: true,
        data: vote,
        message: 'Vote recorded successfully'
      });
    } catch (error: any) {
      fastify.log.error('Failed to vote on proposal:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to vote on proposal',
        details: error.message
      });
    }
  });

  // Get votes for a proposal
  fastify.get("/v1/governance/proposals/:id/votes", async (request, reply) => {
    try {
      const { id } = z.object({
        id: z.string()
      }).parse(request.params);

      const { option, limit, offset } = z.object({
        option: z.string().optional(),
        limit: z.string().optional(),
        offset: z.string().optional()
      }).parse(request.query);

      const where: any = { proposalId: id };
      if (option !== undefined) where.option = parseInt(option);

      const votes = await prisma.governanceVote.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true
            }
          }
        },
        orderBy: { votedAt: 'desc' },
        take: limit ? parseInt(limit) : 100,
        skip: offset ? parseInt(offset) : 0
      });

      const totalVotes = await prisma.governanceVote.count({ where });

      return reply.send({
        success: true,
        data: {
          votes,
          total: totalVotes,
          limit: limit ? parseInt(limit) : 100,
          offset: offset ? parseInt(offset) : 0
        }
      });
    } catch (error: any) {
      fastify.log.error('Failed to fetch votes:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch votes'
      });
    }
  });

  // Execute proposal (admin/automated)
  fastify.post("/v1/governance/proposals/:id/execute", {
    preHandler: authMiddleware
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const { id } = z.object({
        id: z.string()
      }).parse(request.params);

      const body = z.object({
        transactionHash: z.string().optional()
      }).parse(request.body);

      // Find proposal
      const proposal = await prisma.governanceProposal.findUnique({
        where: { id }
      });

      if (!proposal) {
        return reply.code(404).send({
          success: false,
          error: 'Proposal not found'
        });
      }

      // Check if voting has ended
      if (new Date() < proposal.endDate) {
        return reply.code(400).send({
          success: false,
          error: 'Voting is still active'
        });
      }

      // Check if execution delay has passed
      if (new Date() < proposal.executionDate) {
        return reply.code(400).send({
          success: false,
          error: `Proposal cannot be executed until ${proposal.executionDate.toISOString()}`
        });
      }

      if (proposal.status !== 'PASSED' && proposal.status !== 'ACTIVE') {
        return reply.code(400).send({
          success: false,
          error: 'Proposal is not in executable state'
        });
      }

      // Calculate vote results
      const voteStats = await prisma.governanceVote.groupBy({
        by: ['option'],
        where: { proposalId: id },
        _sum: { votingPower: true },
        _count: true
      });

      const totalVotes = voteStats.reduce((sum, stat) => sum + (Number(stat._sum.votingPower) || 0), 0);

      // Check quorum
      if (totalVotes < Number(proposal.quorumThreshold)) {
        await prisma.governanceProposal.update({
          where: { id },
          data: { status: 'REJECTED' }
        });

        return reply.code(400).send({
          success: false,
          error: 'Quorum not reached',
          details: {
            totalVotes: totalVotes.toString(),
            quorumThreshold: proposal.quorumThreshold
          }
        });
      }

      // Find winning option (highest voting power)
      const winningOption = voteStats.reduce((max, stat) =>
        (Number(stat._sum.votingPower) || 0) > (Number(max._sum.votingPower) || 0) ? stat : max
      );

      const winningPercentage = (Number(winningOption._sum.votingPower) || 0) / totalVotes * 10000; // In basis points

      // Check approval threshold
      if (winningPercentage < Number(proposal.approvalThreshold)) {
        await prisma.governanceProposal.update({
          where: { id },
          data: { status: 'REJECTED' }
        });

        return reply.code(400).send({
          success: false,
          error: 'Approval threshold not met',
          details: {
            winningPercentage: winningPercentage.toFixed(2),
            approvalThreshold: proposal.approvalThreshold
          }
        });
      }

      // Execute proposal
      const updatedProposal = await prisma.governanceProposal.update({
        where: { id },
        data: {
          status: 'EXECUTED',
          executedAt: new Date(),
          executedBy: user.id,
          executionTransactionHash: body.transactionHash,
          result: proposal.options[winningOption.option]
        }
      });

      return reply.send({
        success: true,
        data: updatedProposal,
        message: 'Proposal executed successfully'
      });
    } catch (error: any) {
      fastify.log.error('Failed to execute proposal:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to execute proposal',
        details: error.message
      });
    }
  });

  // Get user's voting power
  fastify.get("/v1/governance/my-voting-power", {
    preHandler: authMiddleware
  }, async (request, reply) => {
    try {
      const user = (request as any).user;

      const { communityId } = z.object({
        communityId: z.string().optional()
      }).parse(request.query);

      // In a real implementation, this would check:
      // 1. User's token balance at snapshot block
      // 2. User's delegated voting power
      // 3. User's staked tokens

      // For now, return a simple calculation based on user's stakes
      const stakes = await prisma.userStake.findMany({
        where: {
          userId: user.id,
          status: 'ACTIVE'
        },
        include: {
          pool: true
        }
      });

      const totalStaked = stakes.reduce((sum, stake) => {
        return sum + BigInt(stake.amount);
      }, BigInt(0));

      return reply.send({
        success: true,
        data: {
          votingPower: totalStaked.toString(),
          stakes: stakes.map(s => ({
            poolId: s.poolId,
            poolName: s.pool.name,
            amount: s.amount
          })),
          delegatedTo: null, // TODO: Implement delegation
          delegatedFrom: [] // TODO: Implement delegation
        }
      });
    } catch (error: any) {
      fastify.log.error('Failed to fetch voting power:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch voting power'
      });
    }
  });
};

export default governanceRoutes;
