import { FastifyRequest, FastifyReply } from 'fastify';
import { tokenGatingService } from '../services/token-gating';
import { prisma } from '@cryb/database';

interface TokenGatingOptions {
  // Entity-based gating
  serverId?: string;
  channelId?: string;
  communityId?: string;
  
  // Direct requirement specification
  requirements?: {
    type: 'TOKEN_BALANCE' | 'NFT_OWNERSHIP' | 'COMBINED' | 'CUSTOM';
    tokens?: Array<{
      address: string;
      symbol: string;
      name: string;
      chain: string;
      minAmount: string;
    }>;
    nfts?: Array<{
      contractAddress: string;
      minTokens: number;
      specificTokenIds?: string[];
    }>;
    customLogic?: string;
  };
  
  // Behavior options
  mode?: 'strict' | 'permissive' | 'cache'; // strict = always check, permissive = allow partial, cache = use cached results
  cacheDuration?: number; // in seconds, default 300 (5 minutes)
  allowAdmin?: boolean; // bypass for admins, default true
  allowModerator?: boolean; // bypass for moderators, default true
  
  // Response customization
  deniedStatusCode?: number; // default 403
  deniedMessage?: string;
  includeRequirements?: boolean; // include requirement details in denial response
  
  // Logging and metrics
  logAccess?: boolean; // log all access attempts, default false
  enableMetrics?: boolean; // collect metrics, default true
}

interface TokenGatingResult {
  hasAccess: boolean;
  reason?: string;
  requirements?: any;
  bypassReason?: string;
  cached?: boolean;
  checkDuration?: number;
}

// Cache for token gating results
const accessCache = new Map<string, { result: TokenGatingResult; timestamp: number; ttl: number }>();

/**
 * Advanced token gating middleware
 * Can be used to protect API routes based on token/NFT ownership
 */
export function tokenGatingMiddleware(options: TokenGatingOptions) {
  return async (request: FastifyRequest & { userId?: string }, reply: FastifyReply) => {
    const startTime = Date.now();
    
    try {
      // Ensure user is authenticated
      if (!request.userId) {
        return reply.code(401).send({
          success: false,
          error: 'Authentication required for token gating',
        });
      }

      // Check for admin/moderator bypass
      if (options.allowAdmin || options.allowModerator) {
        const bypassReason = await checkBypassPermissions(
          request.userId, 
          options.serverId, 
          options.channelId, 
          options.communityId,
          options.allowAdmin,
          options.allowModerator
        );
        
        if (bypassReason) {
          if (options.logAccess) {
            await logAccessAttempt(request.userId, {
              hasAccess: true,
              bypassReason,
              checkDuration: Date.now() - startTime
            }, options);
          }
          
          return; // Continue to the route handler
        }
      }

      // Check cache if enabled
      if (options.mode === 'cache') {
        const cacheKey = generateCacheKey(request.userId, options);
        const cached = getFromCache(cacheKey);
        
        if (cached) {
          if (!cached.result.hasAccess) {
            return sendDeniedResponse(reply, cached.result, options);
          }
          
          if (options.logAccess) {
            await logAccessAttempt(request.userId, { ...cached.result, cached: true }, options);
          }
          
          return; // Continue to the route handler
        }
      }

      // Perform token gating check
      let result: TokenGatingResult;
      
      if (options.requirements) {
        // Direct requirements check
        result = await checkDirectRequirements(request.userId, options.requirements, options);
      } else {
        // Entity-based check
        result = await checkEntityRequirements(
          request.userId,
          options.serverId,
          options.channelId,
          options.communityId,
          options
        );
      }

      result.checkDuration = Date.now() - startTime;

      // Cache result if enabled
      if (options.mode === 'cache') {
        const cacheKey = generateCacheKey(request.userId, options);
        setInCache(cacheKey, result, options.cacheDuration || 300);
      }

      // Log access attempt
      if (options.logAccess) {
        await logAccessAttempt(request.userId, result, options);
      }

      // Update metrics
      if (options.enableMetrics !== false) {
        await updateMetrics(result, options);
      }

      // Handle denied access
      if (!result.hasAccess) {
        return sendDeniedResponse(reply, result, options);
      }

      // Access granted, continue to route handler
      return;

    } catch (error) {
      console.error('Token gating middleware error:', error);
      
      // In permissive mode, allow access on error
      if (options.mode === 'permissive') {
        console.warn('Token gating failed in permissive mode, allowing access');
        return;
      }
      
      // Otherwise deny access
      return reply.code(500).send({
        success: false,
        error: 'Token gating verification failed',
      });
    }
  };
}

/**
 * Check if user has bypass permissions (admin/moderator)
 */
async function checkBypassPermissions(
  userId: string,
  serverId?: string,
  channelId?: string,
  communityId?: string,
  allowAdmin?: boolean,
  allowModerator?: boolean
): Promise<string | null> {
  try {
    // Check platform admin
    if (allowAdmin) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isAdmin: true }
      });
      
      if (user?.isAdmin) {
        return 'Platform Admin';
      }
    }

    // Check server ownership/moderation
    if (serverId && (allowAdmin || allowModerator)) {
      const server = await prisma.server.findUnique({
        where: { id: serverId },
        select: { ownerId: true }
      });
      
      if (server?.ownerId === userId) {
        return 'Server Owner';
      }

      // Check server moderator
      if (allowModerator) {
        const moderator = await prisma.serverModerator.findFirst({
          where: { serverId, userId }
        });
        
        if (moderator) {
          return 'Server Moderator';
        }
      }
    }

    // Check channel-specific permissions
    if (channelId && (allowAdmin || allowModerator)) {
      const channel = await prisma.channel.findUnique({
        where: { id: channelId },
        include: { server: true }
      });
      
      if (channel?.server?.ownerId === userId) {
        return 'Server Owner';
      }
    }

    // Check community moderation
    if (communityId && allowModerator) {
      const moderator = await prisma.moderator.findFirst({
        where: { communityId, userId }
      });
      
      if (moderator) {
        return 'Community Moderator';
      }
    }

    return null;
  } catch (error) {
    console.error('Error checking bypass permissions:', error);
    return null;
  }
}

/**
 * Check requirements directly specified in options
 */
async function checkDirectRequirements(
  userId: string, 
  requirements: NonNullable<TokenGatingOptions['requirements']>,
  options: TokenGatingOptions
): Promise<TokenGatingResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletAddress: true }
    });

    if (!user?.walletAddress) {
      return {
        hasAccess: false,
        reason: 'No wallet connected',
      };
    }

    // Create a temporary rule for checking
    const tempRule = {
      id: 'temp',
      ruleType: requirements.type,
      tokenRequirements: requirements.tokens?.map(token => ({
        tokenAddress: token.address.toLowerCase(),
        symbol: token.symbol,
        name: token.name,
        chain: token.chain,
        minAmount: token.minAmount,
      })) || [],
      nftRequirements: requirements.nfts?.map(nft => ({
        collection: {
          contractAddress: nft.contractAddress.toLowerCase(),
          name: nft.contractAddress,
          chain: 'ethereum'
        },
        minTokens: nft.minTokens,
        specificTokenIds: nft.specificTokenIds
      })) || []
    };

    // Use the existing token gating service logic
    const result = await (tokenGatingService as any).checkRuleAccess(user.walletAddress, tempRule);
    
    return {
      hasAccess: result.hasAccess,
      reason: result.reason,
      requirements: result.requirements
    };
  } catch (error) {
    console.error('Error checking direct requirements:', error);
    return {
      hasAccess: false,
      reason: 'Failed to verify requirements',
    };
  }
}

/**
 * Check requirements based on entity (server/channel/community)
 */
async function checkEntityRequirements(
  userId: string,
  serverId?: string,
  channelId?: string,
  communityId?: string,
  options?: TokenGatingOptions
): Promise<TokenGatingResult> {
  try {
    const result = await tokenGatingService.checkAccess(userId, serverId, channelId, communityId);
    
    return {
      hasAccess: result.hasAccess,
      reason: result.reason,
      requirements: result.requirements
    };
  } catch (error) {
    console.error('Error checking entity requirements:', error);
    return {
      hasAccess: false,
      reason: 'Failed to verify access',
    };
  }
}

/**
 * Generate cache key for storing results
 */
function generateCacheKey(userId: string, options: TokenGatingOptions): string {
  const parts = [userId];
  
  if (options.serverId) parts.push(`server:${options.serverId}`);
  if (options.channelId) parts.push(`channel:${options.channelId}`);
  if (options.communityId) parts.push(`community:${options.communityId}`);
  if (options.requirements) {
    const reqHash = Buffer.from(JSON.stringify(options.requirements)).toString('base64').slice(0, 8);
    parts.push(`req:${reqHash}`);
  }
  
  return parts.join('|');
}

/**
 * Get result from cache
 */
function getFromCache(key: string): { result: TokenGatingResult } | null {
  const cached = accessCache.get(key);
  if (!cached) return null;
  
  if (Date.now() > cached.timestamp + (cached.ttl * 1000)) {
    accessCache.delete(key);
    return null;
  }
  
  return { result: { ...cached.result, cached: true } };
}

/**
 * Store result in cache
 */
function setInCache(key: string, result: TokenGatingResult, ttlSeconds: number): void {
  accessCache.set(key, {
    result: { ...result },
    timestamp: Date.now(),
    ttl: ttlSeconds
  });
  
  // Clean up old entries periodically
  if (Math.random() < 0.01) { // 1% chance
    cleanupCache();
  }
}

/**
 * Clean up expired cache entries
 */
function cleanupCache(): void {
  const now = Date.now();
  for (const [key, cached] of accessCache.entries()) {
    if (now > cached.timestamp + (cached.ttl * 1000)) {
      accessCache.delete(key);
    }
  }
}

/**
 * Send denial response with proper formatting
 */
function sendDeniedResponse(
  reply: FastifyReply, 
  result: TokenGatingResult, 
  options: TokenGatingOptions
): Promise<any> {
  const statusCode = options.deniedStatusCode || 403;
  const message = options.deniedMessage || 'Access denied due to token gating requirements';
  
  const response: any = {
    success: false,
    error: message,
    reason: result.reason
  };
  
  if (options.includeRequirements && result.requirements) {
    response.requirements = result.requirements;
  }
  
  if (result.checkDuration) {
    response.checkDuration = result.checkDuration;
  }
  
  return reply.code(statusCode).send(response);
}

/**
 * Log access attempt for auditing
 */
async function logAccessAttempt(
  userId: string, 
  result: TokenGatingResult, 
  options: TokenGatingOptions
): Promise<void> {
  try {
    const logEntry = {
      userId,
      hasAccess: result.hasAccess,
      reason: result.reason,
      bypassReason: result.bypassReason,
      cached: result.cached || false,
      checkDuration: result.checkDuration || 0,
      serverId: options.serverId,
      channelId: options.channelId,
      communityId: options.communityId,
      timestamp: new Date()
    };
    
    // Store in database or log to file
    await prisma.tokenGatingAccessLog.create({
      data: {
        userId: logEntry.userId,
        hasAccess: logEntry.hasAccess,
        reason: logEntry.reason,
        bypassReason: logEntry.bypassReason,
        cached: logEntry.cached,
        checkDurationMs: logEntry.checkDuration,
        serverId: logEntry.serverId,
        channelId: logEntry.channelId,
        communityId: logEntry.communityId,
      }
    }).catch(error => {
      // Fallback to console logging if database fails
      console.log('Token gating access log:', JSON.stringify(logEntry));
    });
    
  } catch (error) {
    console.error('Failed to log access attempt:', error);
  }
}

/**
 * Update metrics for monitoring
 */
async function updateMetrics(result: TokenGatingResult, options: TokenGatingOptions): Promise<void> {
  try {
    // This could integrate with Prometheus, StatsD, etc.
    const metrics = {
      access_granted: result.hasAccess ? 1 : 0,
      access_denied: result.hasAccess ? 0 : 1,
      check_duration: result.checkDuration || 0,
      cached_result: result.cached ? 1 : 0,
      bypass_used: result.bypassReason ? 1 : 0
    };
    
    // For now, just log metrics
    // In production, send to your metrics system
    console.debug('Token gating metrics:', metrics);
    
  } catch (error) {
    console.error('Failed to update metrics:', error);
  }
}

/**
 * Convenience function to create token gating middleware with common patterns
 */
export const tokenGatingPatterns = {
  /**
   * Basic server-level gating
   */
  serverGate: (serverId: string, options?: Partial<TokenGatingOptions>) =>
    tokenGatingMiddleware({ serverId, mode: 'cache', ...options }),

  /**
   * Channel-level gating
   */
  channelGate: (channelId: string, options?: Partial<TokenGatingOptions>) =>
    tokenGatingMiddleware({ channelId, mode: 'cache', ...options }),

  /**
   * Community-level gating
   */
  communityGate: (communityId: string, options?: Partial<TokenGatingOptions>) =>
    tokenGatingMiddleware({ communityId, mode: 'cache', ...options }),

  /**
   * Premium content gating (requires minimum CRYB tokens)
   */
  premiumGate: (minCrybTokens: string, options?: Partial<TokenGatingOptions>) =>
    tokenGatingMiddleware({
      requirements: {
        type: 'TOKEN_BALANCE',
        tokens: [{
          address: process.env.CRYB_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000',
          symbol: 'CRYB',
          name: 'CRYB Token',
          chain: 'ethereum',
          minAmount: minCrybTokens
        }]
      },
      mode: 'cache',
      ...options
    }),

  /**
   * VIP gating (requires NFT ownership)
   */
  vipGate: (nftContractAddress: string, minTokens: number = 1, options?: Partial<TokenGatingOptions>) =>
    tokenGatingMiddleware({
      requirements: {
        type: 'NFT_OWNERSHIP',
        nfts: [{
          contractAddress: nftContractAddress,
          minTokens
        }]
      },
      mode: 'cache',
      ...options
    }),

  /**
   * Whale gating (requires significant ETH balance)
   */
  whaleGate: (minEthBalance: string, options?: Partial<TokenGatingOptions>) =>
    tokenGatingMiddleware({
      requirements: {
        type: 'TOKEN_BALANCE',
        tokens: [{
          address: '0x0000000000000000000000000000000000000000',
          symbol: 'ETH',
          name: 'Ethereum',
          chain: 'ethereum',
          minAmount: minEthBalance
        }]
      },
      mode: 'cache',
      ...options
    }),
};

/**
 * Health check function for monitoring
 */
export function getTokenGatingHealth(): {
  cacheSize: number;
  cacheHitRate?: number;
  avgCheckDuration?: number;
  status: 'healthy' | 'degraded' | 'unhealthy';
} {
  const cacheSize = accessCache.size;
  
  // Basic health metrics
  return {
    cacheSize,
    status: cacheSize > 10000 ? 'degraded' : 'healthy' // Simple threshold
  };
}

/**
 * Clear cache (useful for testing or manual cache invalidation)
 */
export function clearTokenGatingCache(pattern?: string): number {
  if (!pattern) {
    const size = accessCache.size;
    accessCache.clear();
    return size;
  }
  
  let cleared = 0;
  for (const key of accessCache.keys()) {
    if (key.includes(pattern)) {
      accessCache.delete(key);
      cleared++;
    }
  }
  
  return cleared;
}