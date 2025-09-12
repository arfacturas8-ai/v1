import { FastifyPluginAsync } from "fastify";
import { healthMonitor, setupDefaultHealthChecks } from "../../../../packages/web3/src/monitoring/HealthMonitor";

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  // Initialize health monitoring on first load
  setupDefaultHealthChecks(healthMonitor);

  // Basic health check
  fastify.get("/", async (request, reply) => {
    const health = await healthMonitor.runHealthChecks();
    
    const statusCode = health.overall === 'healthy' ? 200 : 
                      health.overall === 'degraded' ? 200 : 503;
    
    return reply.code(statusCode).send({
      status: health.overall,
      timestamp: health.timestamp,
      version: health.version,
      checks: health.checks.map(check => ({
        name: check.name,
        status: check.status,
        responseTime: check.responseTime,
        lastCheck: check.lastCheck,
        error: check.error
      }))
    });
  });

  // Detailed health check (admin only in production)
  fastify.get("/detailed", async (request, reply) => {
    // In production, you might want to add authentication here
    if (process.env.NODE_ENV === 'production') {
      // Simple IP-based restriction for now
      const forwardedFor = request.headers['x-forwarded-for'] as string;
      const clientIp = forwardedFor?.split(',')[0] || request.ip;
      
      // Allow localhost and private networks
      if (!clientIp.startsWith('127.') && 
          !clientIp.startsWith('10.') && 
          !clientIp.startsWith('192.168.') &&
          !clientIp.startsWith('172.')) {
        return reply.code(403).send({
          error: "Access denied",
          message: "Detailed health checks are restricted in production"
        });
      }
    }

    const health = await healthMonitor.runHealthChecks();
    
    const statusCode = health.overall === 'healthy' ? 200 : 
                      health.overall === 'degraded' ? 200 : 503;
    
    return reply.code(statusCode).send({
      status: health.overall,
      timestamp: health.timestamp,
      version: health.version,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV,
      checks: health.checks,
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        cpuUsage: process.cpuUsage(),
        pid: process.pid
      }
    });
  });

  // Readiness probe (for Kubernetes/Docker)
  fastify.get("/ready", async (request, reply) => {
    const health = healthMonitor.getCurrentHealth();
    
    // Consider system ready if not completely unhealthy
    const isReady = health.overall !== 'unhealthy';
    
    if (isReady) {
      return reply.send({
        status: "ready",
        timestamp: new Date().toISOString()
      });
    } else {
      return reply.code(503).send({
        status: "not ready",
        timestamp: new Date().toISOString(),
        reason: health.checks
          .filter(c => c.status === 'unhealthy')
          .map(c => `${c.name}: ${c.error}`)
          .join(', ')
      });
    }
  });

  // Liveness probe (for Kubernetes/Docker)
  fastify.get("/live", async (request, reply) => {
    // Simple liveness check - if the server can respond, it's alive
    return reply.send({
      status: "alive",
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Web3 specific health checks
  fastify.get("/web3", async (request, reply) => {
    const health = healthMonitor.getCurrentHealth();
    
    // Filter for Web3-related checks
    const web3Checks = health.checks.filter(check => 
      check.name.includes('provider') || 
      check.name.includes('cache') || 
      check.name === 'payment_system' ||
      check.name === 'api_keys'
    );

    const hasUnhealthyWeb3 = web3Checks.some(c => c.status === 'unhealthy');
    const hasDegradedWeb3 = web3Checks.some(c => c.status === 'degraded');
    
    const web3Status = hasUnhealthyWeb3 ? 'unhealthy' : 
                      (hasDegradedWeb3 ? 'degraded' : 'healthy');

    const statusCode = web3Status === 'unhealthy' ? 503 : 200;
    
    return reply.code(statusCode).send({
      status: web3Status,
      timestamp: new Date().toISOString(),
      checks: web3Checks,
      summary: {
        total: web3Checks.length,
        healthy: web3Checks.filter(c => c.status === 'healthy').length,
        degraded: web3Checks.filter(c => c.status === 'degraded').length,
        unhealthy: web3Checks.filter(c => c.status === 'unhealthy').length
      }
    });
  });

  // Provider status endpoint
  fastify.get("/providers", async (request, reply) => {
    try {
      const { providerManager } = await import("../../../../packages/web3/src/providers/ProviderManager");
      
      const chains = providerManager.getSupportedChains();
      const providerHealth = providerManager.getProviderHealth();
      
      const chainStatus = await Promise.allSettled(
        chains.map(async (chain) => {
          try {
            const config = providerManager.getChainConfig(chain);
            const provider = await providerManager.getProvider(chain);
            const blockNumber = await provider.getBlockNumber();
            
            return {
              chain,
              status: 'healthy',
              blockNumber,
              config: {
                name: config?.name,
                chainId: config?.chainId,
                providersCount: config?.providers.length
              }
            };
          } catch (error) {
            return {
              chain,
              status: 'unhealthy',
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        })
      );

      return reply.send({
        timestamp: new Date().toISOString(),
        chains: chainStatus.map((result, index) => ({
          chain: chains[index],
          ...(result.status === 'fulfilled' ? result.value : {
            status: 'error',
            error: result.reason
          })
        })),
        providerHealthCache: Array.from(providerHealth.entries()).map(([key, health]) => ({
          provider: key,
          isHealthy: health.isHealthy,
          lastCheck: new Date(health.lastCheck).toISOString()
        }))
      });
    } catch (error) {
      fastify.log.error("Error getting provider status:", error);
      
      return reply.code(500).send({
        error: "Failed to get provider status",
        timestamp: new Date().toISOString()
      });
    }
  });

  // Cache statistics
  fastify.get("/cache", async (request, reply) => {
    try {
      const { 
        nftMetadataCache, 
        tokenBalanceCache, 
        blockchainDataCache 
      } = await import("../../../../packages/web3/src/cache/CacheManager");

      return reply.send({
        timestamp: new Date().toISOString(),
        caches: {
          nftMetadata: nftMetadataCache.getStats(),
          tokenBalance: tokenBalanceCache.getStats(),
          blockchainData: blockchainDataCache.getStats()
        },
        totalMemoryUsage: [
          nftMetadataCache.getStats().approximateMemoryUsage,
          tokenBalanceCache.getStats().approximateMemoryUsage,
          blockchainDataCache.getStats().approximateMemoryUsage
        ].reduce((sum, usage) => sum + usage, 0)
      });
    } catch (error) {
      fastify.log.error("Error getting cache statistics:", error);
      
      return reply.code(500).send({
        error: "Failed to get cache statistics",
        timestamp: new Date().toISOString()
      });
    }
  });

  // Clear caches (admin only)
  fastify.post("/cache/clear", async (request, reply) => {
    if (process.env.NODE_ENV === 'production') {
      return reply.code(403).send({
        error: "Cache clearing is not allowed in production"
      });
    }

    try {
      const { 
        nftMetadataCache, 
        tokenBalanceCache, 
        blockchainDataCache 
      } = await import("../../../../packages/web3/src/cache/CacheManager");

      nftMetadataCache.clear();
      tokenBalanceCache.clear();
      blockchainDataCache.clear();

      return reply.send({
        message: "All caches cleared successfully",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      fastify.log.error("Error clearing caches:", error);
      
      return reply.code(500).send({
        error: "Failed to clear caches",
        timestamp: new Date().toISOString()
      });
    }
  });
};

export default healthRoutes;