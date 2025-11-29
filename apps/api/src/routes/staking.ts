import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "@cryb/database";
import { authMiddleware } from "../middleware/auth";

const stakingRoutes: FastifyPluginAsync = async (fastify) => {

  // Get all staking pools
  fastify.get("/v1/staking/pools", async (request, reply) => {
    try {
      const pools = await prisma.stakingPool.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: { stakes: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Calculate total staked for each pool
      const poolsWithStats = await Promise.all(
        pools.map(async (pool) => {
          const totalStaked = await prisma.userStake.aggregate({
            where: {
              poolId: pool.id,
              status: 'ACTIVE'
            },
            _sum: { amount: true }
          });

          return {
            ...pool,
            totalStaked: totalStaked._sum.amount || '0',
            activeStakers: pool._count.stakes
          };
        })
      );

      return reply.send({
        success: true,
        data: poolsWithStats
      });
    } catch (error: any) {
      fastify.log.error('Failed to fetch staking pools:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch staking pools'
      });
    }
  });

  // Get specific pool details
  fastify.get("/v1/staking/pools/:id", async (request, reply) => {
    try {
      const { id } = z.object({
        id: z.string()
      }).parse(request.params);

      const pool = await prisma.stakingPool.findUnique({
        where: { id },
        include: {
          stakes: {
            where: { status: 'ACTIVE' },
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
            orderBy: { stakedAt: 'desc' },
            take: 100
          },
          rewards: {
            orderBy: { distributedAt: 'desc' },
            take: 50
          }
        }
      });

      if (!pool) {
        return reply.code(404).send({
          success: false,
          error: 'Pool not found'
        });
      }

      const totalStaked = await prisma.userStake.aggregate({
        where: {
          poolId: id,
          status: 'ACTIVE'
        },
        _sum: { amount: true }
      });

      return reply.send({
        success: true,
        data: {
          ...pool,
          totalStaked: totalStaked._sum.amount || '0'
        }
      });
    } catch (error: any) {
      fastify.log.error('Failed to fetch pool details:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch pool details'
      });
    }
  });

  // Create staking pool (admin only)
  fastify.post("/v1/staking/pools", {
    preHandler: authMiddleware
  }, async (request, reply) => {
    try {
      const user = (request as any).user;

      // Check if user is admin (you may want to add admin check middleware)
      // For now, any authenticated user can create pools

      const body = z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        tokenAddress: z.string(),
        rewardTokenAddress: z.string(),
        apy: z.number().min(0).max(10000), // APY in basis points (100 = 1%)
        lockPeriodDays: z.number().int().min(0),
        minStake: z.string(),
        maxStake: z.string().optional(),
        isActive: z.boolean().default(true)
      }).parse(request.body);

      const pool = await prisma.stakingPool.create({
        data: {
          name: body.name,
          description: body.description,
          tokenAddress: body.tokenAddress,
          rewardTokenAddress: body.rewardTokenAddress,
          apy: body.apy,
          lockPeriodDays: body.lockPeriodDays,
          minStake: body.minStake,
          maxStake: body.maxStake,
          isActive: body.isActive,
          createdBy: user.id
        }
      });

      return reply.code(201).send({
        success: true,
        data: pool
      });
    } catch (error: any) {
      fastify.log.error('Failed to create staking pool:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to create staking pool',
        details: error.message
      });
    }
  });

  // Stake tokens
  fastify.post("/v1/staking/stake", {
    preHandler: authMiddleware
  }, async (request, reply) => {
    try {
      const user = (request as any).user;

      const body = z.object({
        poolId: z.string(),
        amount: z.string(), // Amount in wei as string
        transactionHash: z.string() // Blockchain transaction hash
      }).parse(request.body);

      // Verify pool exists and is active
      const pool = await prisma.stakingPool.findUnique({
        where: { id: body.poolId }
      });

      if (!pool || !pool.isActive) {
        return reply.code(400).send({
          success: false,
          error: 'Pool not found or inactive'
        });
      }

      // Check minimum stake
      if (BigInt(body.amount) < BigInt(pool.minStake)) {
        return reply.code(400).send({
          success: false,
          error: `Minimum stake is ${pool.minStake}`
        });
      }

      // Check maximum stake if set
      if (pool.maxStake && BigInt(body.amount) > BigInt(pool.maxStake)) {
        return reply.code(400).send({
          success: false,
          error: `Maximum stake is ${pool.maxStake}`
        });
      }

      // Calculate unlock date
      const unlockDate = new Date();
      unlockDate.setDate(unlockDate.getDate() + pool.lockPeriodDays);

      // Create stake
      const stake = await prisma.userStake.create({
        data: {
          userId: user.id,
          poolId: body.poolId,
          amount: body.amount,
          stakedAt: new Date(),
          unlockDate: unlockDate,
          status: 'ACTIVE',
          transactionHash: body.transactionHash
        },
        include: {
          pool: true
        }
      });

      return reply.code(201).send({
        success: true,
        data: stake,
        message: 'Successfully staked tokens'
      });
    } catch (error: any) {
      fastify.log.error('Failed to stake tokens:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to stake tokens',
        details: error.message
      });
    }
  });

  // Unstake tokens
  fastify.post("/v1/staking/unstake", {
    preHandler: authMiddleware
  }, async (request, reply) => {
    try {
      const user = (request as any).user;

      const body = z.object({
        stakeId: z.string(),
        transactionHash: z.string() // Blockchain transaction hash
      }).parse(request.body);

      // Find stake
      const stake = await prisma.userStake.findUnique({
        where: { id: body.stakeId },
        include: { pool: true }
      });

      if (!stake) {
        return reply.code(404).send({
          success: false,
          error: 'Stake not found'
        });
      }

      if (stake.userId !== user.id) {
        return reply.code(403).send({
          success: false,
          error: 'Not authorized to unstake this'
        });
      }

      if (stake.status !== 'ACTIVE') {
        return reply.code(400).send({
          success: false,
          error: 'Stake is not active'
        });
      }

      // Check if unlock period has passed
      if (new Date() < stake.unlockDate) {
        return reply.code(400).send({
          success: false,
          error: `Tokens are locked until ${stake.unlockDate.toISOString()}`,
          unlockDate: stake.unlockDate
        });
      }

      // Update stake status
      const updatedStake = await prisma.userStake.update({
        where: { id: body.stakeId },
        data: {
          status: 'UNSTAKED',
          unstakedAt: new Date(),
          unstakeTransactionHash: body.transactionHash
        },
        include: {
          pool: true
        }
      });

      return reply.send({
        success: true,
        data: updatedStake,
        message: 'Successfully unstaked tokens'
      });
    } catch (error: any) {
      fastify.log.error('Failed to unstake tokens:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to unstake tokens',
        details: error.message
      });
    }
  });

  // Claim rewards
  fastify.post("/v1/staking/claim-rewards", {
    preHandler: authMiddleware
  }, async (request, reply) => {
    try {
      const user = (request as any).user;

      const body = z.object({
        stakeId: z.string(),
        transactionHash: z.string() // Blockchain transaction hash
      }).parse(request.body);

      // Find stake
      const stake = await prisma.userStake.findUnique({
        where: { id: body.stakeId },
        include: { pool: true }
      });

      if (!stake) {
        return reply.code(404).send({
          success: false,
          error: 'Stake not found'
        });
      }

      if (stake.userId !== user.id) {
        return reply.code(403).send({
          success: false,
          error: 'Not authorized'
        });
      }

      if (stake.status !== 'ACTIVE') {
        return reply.code(400).send({
          success: false,
          error: 'Stake is not active'
        });
      }

      // Calculate rewards based on APY and time staked
      const now = new Date();
      const stakedDays = Math.floor((now.getTime() - stake.stakedAt.getTime()) / (1000 * 60 * 60 * 24));
      const yearlyReward = (BigInt(stake.amount) * BigInt(stake.pool.apy)) / BigInt(10000);
      const dailyReward = yearlyReward / BigInt(365);
      const totalReward = dailyReward * BigInt(stakedDays);

      // Create reward record
      const reward = await prisma.stakingReward.create({
        data: {
          stakeId: stake.id,
          userId: user.id,
          poolId: stake.poolId,
          amount: totalReward.toString(),
          distributedAt: new Date(),
          transactionHash: body.transactionHash
        }
      });

      // Update last reward claim date on stake
      await prisma.userStake.update({
        where: { id: body.stakeId },
        data: {
          lastRewardClaim: new Date()
        }
      });

      return reply.send({
        success: true,
        data: reward,
        message: 'Successfully claimed rewards'
      });
    } catch (error: any) {
      fastify.log.error('Failed to claim rewards:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to claim rewards',
        details: error.message
      });
    }
  });

  // Get user's stakes
  fastify.get("/v1/staking/my-stakes", {
    preHandler: authMiddleware
  }, async (request, reply) => {
    try {
      const user = (request as any).user;

      const stakes = await prisma.userStake.findMany({
        where: { userId: user.id },
        include: {
          pool: true,
          rewards: {
            orderBy: { distributedAt: 'desc' }
          }
        },
        orderBy: { stakedAt: 'desc' }
      });

      // Calculate pending rewards for each active stake
      const stakesWithRewards = stakes.map(stake => {
        if (stake.status === 'ACTIVE') {
          const now = new Date();
          const lastClaim = stake.lastRewardClaim || stake.stakedAt;
          const daysSinceLastClaim = Math.floor((now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60 * 24));

          const yearlyReward = (BigInt(stake.amount) * BigInt(stake.pool.apy)) / BigInt(10000);
          const dailyReward = yearlyReward / BigInt(365);
          const pendingReward = dailyReward * BigInt(daysSinceLastClaim);

          return {
            ...stake,
            pendingRewards: pendingReward.toString()
          };
        }
        return {
          ...stake,
          pendingRewards: '0'
        };
      });

      return reply.send({
        success: true,
        data: stakesWithRewards
      });
    } catch (error: any) {
      fastify.log.error('Failed to fetch user stakes:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch user stakes'
      });
    }
  });

  // Get user's rewards
  fastify.get("/v1/staking/rewards/:userId", async (request, reply) => {
    try {
      const { userId } = z.object({
        userId: z.string()
      }).parse(request.params);

      const rewards = await prisma.stakingReward.findMany({
        where: { userId },
        include: {
          pool: {
            select: {
              id: true,
              name: true,
              rewardTokenAddress: true
            }
          },
          stake: {
            select: {
              id: true,
              amount: true,
              stakedAt: true
            }
          }
        },
        orderBy: { distributedAt: 'desc' }
      });

      const totalRewards = await prisma.stakingReward.aggregate({
        where: { userId },
        _sum: { amount: true }
      });

      return reply.send({
        success: true,
        data: {
          rewards,
          totalRewards: totalRewards._sum.amount || '0'
        }
      });
    } catch (error: any) {
      fastify.log.error('Failed to fetch rewards:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch rewards'
      });
    }
  });
};

export default stakingRoutes;
