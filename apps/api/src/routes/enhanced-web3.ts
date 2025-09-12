import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "@cryb/database";
// Temporary stubs until Web3 package is fixed
const siweAuthManager = { createNonce: () => Math.random().toString(36) };
const nftVerificationService = { verify: async () => false };
const healthMonitor = { logAuthAttempt: () => {} };
const sessionManager = { create: async () => ({ token: 'mock-token' }) };
const handleWeb3Error = (error: any) => ({ message: error.message });
type TokenGateConfig = any;
type TokenGateRequirement = any;
import { createSession } from "@cryb/auth";
import { authMiddleware } from "../middleware/auth";

const enhancedWeb3Routes: FastifyPluginAsync = async (fastify) => {
  
  // Enhanced SIWE Authentication
  fastify.post("/v2/siwe/nonce", async (request, reply) => {
    try {
      const nonce = siweAuthManager.generateNonce();
      
      return reply.send({
        success: true,
        data: { 
          nonce,
          expiresAt: Date.now() + 15 * 60 * 1000 // 15 minutes
        },
      });
    } catch (error: any) {
      const errorInfo = handleWeb3Error(error, 'nonce_generation');
      fastify.log.error('Nonce generation failed:', error);
      
      return reply.code(500).send({
        success: false,
        error: errorInfo.userMessage,
        details: errorInfo.technicalMessage,
        retryable: errorInfo.isRetryable
      });
    }
  });

  fastify.post("/v2/siwe/verify", async (request, reply) => {
    try {
      const body = z.object({
        message: z.string(),
        signature: z.string(),
        chainId: z.number().optional(),
        skipNonceCheck: z.boolean().optional().default(false)
      }).parse(request.body);

      const result = await siweAuthManager.verifySiweMessage(
        body.message, 
        body.signature,
        {
          verifyTimeValidity: true,
          skipNonceCheck: body.skipNonceCheck
        }
      );

      if (!result.success || !result.session) {
        return reply.code(401).send({
          success: false,
          error: result.error?.message || "Invalid signature",
          code: result.error?.code || "VERIFICATION_FAILED"
        });
      }

      const address = result.session.address;

      // Find or create user
      let user = await prisma.user.findUnique({
        where: { walletAddress: address },
      });

      if (!user) {
        const username = `user_${address.slice(0, 8)}`;
        user = await prisma.user.create({
          data: {
            walletAddress: address,
            username,
            displayName: username,
          },
        });
      }

      // Create session
      const authSession = await createSession(user.id, undefined, address);

      return reply.send({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            walletAddress: user.walletAddress,
            avatar: user.avatar,
          },
          accessToken: authSession.accessToken,
          refreshToken: authSession.refreshToken,
          siweSession: {
            sessionId: result.session.sessionId,
            expiresAt: result.session.expirationTime,
            chainId: result.session.chainId
          }
        },
      });
    } catch (error: any) {
      const errorInfo = handleWeb3Error(error, 'siwe_verification');
      fastify.log.error('SIWE verification failed:', error);
      
      return reply.code(500).send({
        success: false,
        error: errorInfo.userMessage,
        details: errorInfo.technicalMessage,
        retryable: errorInfo.isRetryable,
        suggestedAction: errorInfo.suggestedAction
      });
    }
  });

  // Enhanced NFT Verification
  fastify.post("/v2/nft/verify", async (request: any, reply) => {
    await authMiddleware(request, reply);

    try {
      const body = z.object({
        contractAddress: z.string(),
        tokenId: z.string().optional(),
        chainId: z.number(),
        includeMetadata: z.boolean().optional().default(false),
        bypassCache: z.boolean().optional().default(false)
      }).parse(request.body);

      const user = await prisma.user.findUnique({
        where: { id: request.userId },
      });

      if (!user?.walletAddress) {
        return reply.code(400).send({
          success: false,
          error: "No wallet connected",
        });
      }

      let verification;

      if (body.tokenId) {
        // Verify specific token ownership
        verification = await nftVerificationService.verifyNftOwnership(
          body.contractAddress,
          body.tokenId,
          user.walletAddress,
          body.chainId,
          {
            includeMetadata: body.includeMetadata,
            bypassCache: body.bypassCache
          }
        );
      } else {
        // Batch verify multiple tokens (if needed)
        verification = null; // Implement batch verification if needed
      }

      return reply.send({
        success: true,
        data: {
          verified: verification !== null,
          ownership: verification,
          chainId: body.chainId,
          timestamp: Date.now()
        },
      });
    } catch (error: any) {
      const errorInfo = handleWeb3Error(error, 'nft_verification');
      fastify.log.error('NFT verification failed:', error);
      
      return reply.code(500).send({
        success: false,
        error: errorInfo.userMessage,
        details: errorInfo.technicalMessage,
        retryable: errorInfo.isRetryable
      });
    }
  });

  // Token Gate Verification
  fastify.post("/v2/token-gate/verify", async (request: any, reply) => {
    await authMiddleware(request, reply);

    try {
      const body = z.object({
        gateId: z.string().optional(),
        requirements: z.array(z.object({
          type: z.enum(['nft_ownership', 'token_balance', 'custom_contract']),
          contractAddress: z.string(),
          chainId: z.number(),
          minBalance: z.number().optional(),
          tokenIds: z.array(z.string()).optional(),
          attributes: z.array(z.object({
            trait_type: z.string(),
            value: z.any(),
            operator: z.enum(['eq', 'gt', 'lt', 'gte', 'lte', 'contains']).optional()
          })).optional()
        })).optional(),
        includeDetails: z.boolean().optional().default(false),
        bypassCache: z.boolean().optional().default(false)
      }).parse(request.body);

      const user = await prisma.user.findUnique({
        where: { id: request.userId },
      });

      if (!user?.walletAddress) {
        return reply.code(400).send({
          success: false,
          error: "No wallet connected",
        });
      }

      let gateConfig: TokenGateConfig;

      if (body.gateId) {
        // Load gate config from database
        const gate = await prisma.tokenGate?.findUnique({
          where: { id: body.gateId }
        });
        
        if (!gate) {
          return reply.code(404).send({
            success: false,
            error: "Token gate not found"
          });
        }
        
        gateConfig = gate as any; // Type conversion needed
      } else if (body.requirements) {
        // Use provided requirements
        gateConfig = {
          id: 'temp_gate',
          name: 'Temporary Gate',
          requirements: body.requirements as TokenGateRequirement[],
          chainIds: body.requirements.map(req => req.chainId),
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
      } else {
        return reply.code(400).send({
          success: false,
          error: "Either gateId or requirements must be provided"
        });
      }

      const verification = await nftVerificationService.verifyTokenGateAccess(
        gateConfig,
        user.walletAddress,
        {
          includeDetails: body.includeDetails,
          bypassCache: body.bypassCache
        }
      );

      return reply.send({
        success: true,
        data: verification,
      });
    } catch (error: any) {
      const errorInfo = handleWeb3Error(error, 'token_gate_verification');
      fastify.log.error('Token gate verification failed:', error);
      
      return reply.code(500).send({
        success: false,
        error: errorInfo.userMessage,
        details: errorInfo.technicalMessage,
        retryable: errorInfo.isRetryable
      });
    }
  });

  // Health Status Endpoint
  fastify.get("/v2/health", async (request, reply) => {
    try {
      const metrics = healthMonitor.getCurrentMetrics();
      const circuitBreakers = healthMonitor.getCircuitBreakers();
      const activeAlerts = healthMonitor.getActiveAlerts();
      const sessionStats = sessionManager.getSessionStats();

      return reply.send({
        success: true,
        data: {
          timestamp: Date.now(),
          overallStatus: metrics?.overallStatus || 'unknown',
          healthScore: metrics?.overallHealthScore || 0,
          components: {
            rpc: {
              status: metrics ? Object.values(metrics.rpcHealth).every(rpc => rpc.status === 'healthy') ? 'healthy' : 'degraded' : 'unknown',
              chains: metrics?.rpcHealth || {}
            },
            wallet: {
              status: metrics?.walletHealth.status || 'unknown'
            },
            transactions: {
              status: metrics?.transactionHealth.status || 'unknown',
              pendingCount: metrics?.transactionHealth.pendingCount || 0
            },
            sessions: {
              status: metrics?.sessionHealth.status || 'unknown',
              activeCount: sessionStats.totalSessions,
              authenticatedCount: sessionStats.authenticatedSessions
            }
          },
          circuitBreakers: circuitBreakers.map(breaker => ({
            id: breaker.id,
            state: breaker.state,
            failureCount: breaker.failureCount
          })),
          activeAlerts: activeAlerts.map(alert => ({
            id: alert.id,
            severity: alert.severity,
            title: alert.title,
            timestamp: alert.timestamp
          }))
        }
      });
    } catch (error: any) {
      fastify.log.error('Health check failed:', error);
      
      return reply.code(500).send({
        success: false,
        error: "Health check failed",
        details: error.message
      });
    }
  });

  // Session Management
  fastify.get("/v2/sessions", async (request: any, reply) => {
    await authMiddleware(request, reply);

    try {
      const user = await prisma.user.findUnique({
        where: { id: request.userId },
      });

      if (!user?.walletAddress) {
        return reply.code(400).send({
          success: false,
          error: "No wallet connected",
        });
      }

      const session = sessionManager.getSessionByAddress(user.walletAddress);
      const sessionStats = sessionManager.getSessionStats();

      return reply.send({
        success: true,
        data: {
          currentSession: session,
          stats: sessionStats,
          canReconnect: session && !sessionManager.isSessionActive(session.sessionId)
        }
      });
    } catch (error: any) {
      const errorInfo = handleWeb3Error(error, 'session_management');
      fastify.log.error('Session management failed:', error);
      
      return reply.code(500).send({
        success: false,
        error: errorInfo.userMessage
      });
    }
  });

  // Session Refresh
  fastify.post("/v2/sessions/refresh", async (request: any, reply) => {
    await authMiddleware(request, reply);

    try {
      const user = await prisma.user.findUnique({
        where: { id: request.userId },
      });

      if (!user?.walletAddress) {
        return reply.code(400).send({
          success: false,
          error: "No wallet connected",
        });
      }

      const session = sessionManager.getSessionByAddress(user.walletAddress);
      
      if (!session) {
        return reply.code(404).send({
          success: false,
          error: "No active session found"
        });
      }

      const refreshed = sessionManager.refreshSession(session.sessionId);
      
      if (!refreshed) {
        return reply.code(400).send({
          success: false,
          error: "Failed to refresh session"
        });
      }

      return reply.send({
        success: true,
        data: {
          sessionId: session.sessionId,
          expiresAt: session.expiresAt,
          refreshed: true
        }
      });
    } catch (error: any) {
      const errorInfo = handleWeb3Error(error, 'session_refresh');
      fastify.log.error('Session refresh failed:', error);
      
      return reply.code(500).send({
        success: false,
        error: errorInfo.userMessage
      });
    }
  });

  // Error Reporting
  fastify.post("/v2/errors", async (request, reply) => {
    try {
      const body = z.object({
        type: z.string(),
        message: z.string(),
        stack: z.string().optional(),
        context: z.record(z.any()).optional(),
        userAgent: z.string().optional(),
        url: z.string().optional()
      }).parse(request.body);

      // Log the error
      fastify.log.error('Web3 client error reported:', {
        type: body.type,
        message: body.message,
        context: body.context,
        timestamp: new Date().toISOString()
      });

      // Could store in database or send to error tracking service
      return reply.send({
        success: true,
        data: {
          reported: true,
          timestamp: Date.now()
        }
      });
    } catch (error: any) {
      fastify.log.error('Error reporting failed:', error);
      
      return reply.code(500).send({
        success: false,
        error: "Failed to report error"
      });
    }
  });
};

export default enhancedWeb3Routes;