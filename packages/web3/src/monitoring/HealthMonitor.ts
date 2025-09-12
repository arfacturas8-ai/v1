export interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  lastCheck: Date;
  error?: string;
  metadata?: Record<string, any>;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  checks: HealthCheck[];
  timestamp: Date;
  version: string;
}

export class HealthMonitor {
  private static instance: HealthMonitor;
  private checks: Map<string, HealthCheck> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(health: SystemHealth) => void> = new Set();

  private constructor() {
    this.startMonitoring();
  }

  public static getInstance(): HealthMonitor {
    if (!HealthMonitor.instance) {
      HealthMonitor.instance = new HealthMonitor();
    }
    return HealthMonitor.instance;
  }

  /**
   * Register a health check
   */
  public registerCheck(name: string, checkFn: () => Promise<Partial<HealthCheck>>): void {
    this.checks.set(name, {
      name,
      status: 'unhealthy',
      lastCheck: new Date(),
      error: 'Not yet checked'
    });

    // Store the check function for periodic execution
    (this as any)[`check_${name}`] = checkFn;
  }

  /**
   * Run all health checks
   */
  public async runHealthChecks(): Promise<SystemHealth> {
    const results: HealthCheck[] = [];
    let overallHealthy = true;
    let overallDegraded = false;

    for (const [name, currentCheck] of this.checks.entries()) {
      try {
        const checkFn = (this as any)[`check_${name}`];
        if (!checkFn) continue;

        const start = Date.now();
        const result = await Promise.race([
          checkFn(),
          this.timeout(10000, `Health check ${name} timeout`)
        ]);
        const responseTime = Date.now() - start;

        const updatedCheck: HealthCheck = {
          name,
          status: result.status || 'healthy',
          responseTime,
          lastCheck: new Date(),
          error: result.error,
          metadata: result.metadata
        };

        results.push(updatedCheck);
        this.checks.set(name, updatedCheck);

        if (updatedCheck.status === 'unhealthy') {
          overallHealthy = false;
        } else if (updatedCheck.status === 'degraded') {
          overallDegraded = true;
        }
      } catch (error) {
        const failedCheck: HealthCheck = {
          name,
          status: 'unhealthy',
          lastCheck: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error'
        };

        results.push(failedCheck);
        this.checks.set(name, failedCheck);
        overallHealthy = false;
      }
    }

    const systemHealth: SystemHealth = {
      overall: overallHealthy ? (overallDegraded ? 'degraded' : 'healthy') : 'unhealthy',
      checks: results,
      timestamp: new Date(),
      version: process.env.npm_package_version || '1.0.0'
    };

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(systemHealth);
      } catch (error) {
        console.error('Health monitor listener error:', error);
      }
    });

    return systemHealth;
  }

  /**
   * Get current health status
   */
  public getCurrentHealth(): SystemHealth {
    const checks = Array.from(this.checks.values());
    const hasUnhealthy = checks.some(c => c.status === 'unhealthy');
    const hasDegraded = checks.some(c => c.status === 'degraded');

    return {
      overall: hasUnhealthy ? 'unhealthy' : (hasDegraded ? 'degraded' : 'healthy'),
      checks,
      timestamp: new Date(),
      version: process.env.npm_package_version || '1.0.0'
    };
  }

  /**
   * Subscribe to health status changes
   */
  public onHealthChange(listener: (health: SystemHealth) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Start periodic monitoring
   */
  private startMonitoring(): void {
    if (this.checkInterval) return;

    // Run checks every 30 seconds
    this.checkInterval = setInterval(async () => {
      try {
        await this.runHealthChecks();
      } catch (error) {
        console.error('Health check monitoring error:', error);
      }
    }, 30000);

    // Run initial check
    setTimeout(() => this.runHealthChecks(), 1000);
  }

  /**
   * Stop monitoring
   */
  public stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Timeout helper
   */
  private timeout<T>(ms: number, message: string): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    });
  }
}

// Default health checks
export function setupDefaultHealthChecks(monitor: HealthMonitor): void {
  // Database health check
  monitor.registerCheck('database', async () => {
    try {
      const { prisma } = await import('@cryb/database');
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'healthy' };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Database connection failed'
      };
    }
  });

  // Provider health checks
  monitor.registerCheck('ethereum_provider', async () => {
    try {
      const { providerManager } = await import('../providers/ProviderManager');
      const provider = await providerManager.getProvider('ethereum');
      const blockNumber = await provider.getBlockNumber();
      
      if (blockNumber > 0) {
        return { 
          status: 'healthy',
          metadata: { blockNumber }
        };
      } else {
        return { status: 'degraded', error: 'Invalid block number' };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Ethereum provider failed'
      };
    }
  });

  monitor.registerCheck('polygon_provider', async () => {
    try {
      const { providerManager } = await import('../providers/ProviderManager');
      const provider = await providerManager.getProvider('polygon');
      const blockNumber = await provider.getBlockNumber();
      
      if (blockNumber > 0) {
        return { 
          status: 'healthy',
          metadata: { blockNumber }
        };
      } else {
        return { status: 'degraded', error: 'Invalid block number' };
      }
    } catch (error) {
      return {
        status: 'degraded', // Polygon is secondary, so degraded instead of unhealthy
        error: error instanceof Error ? error.message : 'Polygon provider failed'
      };
    }
  });

  // Cache health check
  monitor.registerCheck('cache_system', async () => {
    try {
      const { nftMetadataCache, tokenBalanceCache } = await import('../cache/CacheManager');
      
      const nftStats = nftMetadataCache.getStats();
      const tokenStats = tokenBalanceCache.getStats();
      
      const totalMemory = nftStats.approximateMemoryUsage + tokenStats.approximateMemoryUsage;
      const maxMemory = 50 * 1024 * 1024; // 50MB threshold
      
      if (totalMemory > maxMemory) {
        return {
          status: 'degraded',
          error: 'High memory usage',
          metadata: {
            memoryUsage: totalMemory,
            nftCacheEntries: nftStats.totalEntries,
            tokenCacheEntries: tokenStats.totalEntries
          }
        };
      }
      
      return {
        status: 'healthy',
        metadata: {
          memoryUsage: totalMemory,
          nftCacheEntries: nftStats.totalEntries,
          tokenCacheEntries: tokenStats.totalEntries,
          nftHitRatio: nftStats.hitRatio,
          tokenHitRatio: tokenStats.hitRatio
        }
      };
    } catch (error) {
      return {
        status: 'degraded',
        error: error instanceof Error ? error.message : 'Cache system check failed'
      };
    }
  });

  // API Keys validation
  monitor.registerCheck('api_keys', async () => {
    const missingKeys: string[] = [];
    const warnings: string[] = [];
    
    // Critical keys
    if (!process.env.INFURA_PROJECT_ID && !process.env.ALCHEMY_API_KEY) {
      missingKeys.push('No blockchain provider configured (INFURA_PROJECT_ID or ALCHEMY_API_KEY)');
    }
    
    // Important but non-critical keys
    if (!process.env.TRANSAK_API_KEY) {
      warnings.push('TRANSAK_API_KEY not configured - payment functionality limited');
    }
    
    if (!process.env.MORALIS_API_KEY) {
      warnings.push('MORALIS_API_KEY not configured - NFT functionality may be limited');
    }
    
    if (missingKeys.length > 0) {
      return {
        status: 'unhealthy',
        error: missingKeys.join(', ')
      };
    } else if (warnings.length > 0) {
      return {
        status: 'degraded',
        error: warnings.join(', ')
      };
    } else {
      return {
        status: 'healthy',
        metadata: {
          configuredProviders: [
            process.env.INFURA_PROJECT_ID ? 'Infura' : null,
            process.env.ALCHEMY_API_KEY ? 'Alchemy' : null
          ].filter(Boolean)
        }
      };
    }
  });

  // Payment system health
  monitor.registerCheck('payment_system', async () => {
    try {
      const { cryptoPaymentService } = await import('../../../apps/api/src/services/crypto-payments');
      
      // Check if payment service is properly configured
      const supportedOptions = cryptoPaymentService.getSupportedOptions();
      
      if (supportedOptions.cryptoCurrencies.length === 0) {
        return {
          status: 'unhealthy',
          error: 'No supported cryptocurrencies configured'
        };
      }
      
      // Check recent payment activity
      const { prisma } = await import('@cryb/database');
      const recentPayments = await prisma.cryptoPayment.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });
      
      const failedPayments = await prisma.cryptoPayment.count({
        where: {
          status: 'FAILED',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      });
      
      const failureRate = recentPayments > 0 ? (failedPayments / recentPayments) : 0;
      
      if (failureRate > 0.1) { // More than 10% failure rate
        return {
          status: 'degraded',
          error: `High payment failure rate: ${(failureRate * 100).toFixed(1)}%`,
          metadata: {
            recentPayments,
            failedPayments,
            failureRate
          }
        };
      }
      
      return {
        status: 'healthy',
        metadata: {
          supportedCurrencies: supportedOptions.cryptoCurrencies.length,
          recentPayments,
          failedPayments,
          successRate: ((1 - failureRate) * 100).toFixed(1) + '%'
        }
      };
    } catch (error) {
      return {
        status: 'degraded',
        error: error instanceof Error ? error.message : 'Payment system check failed'
      };
    }
  });
}

export const healthMonitor = HealthMonitor.getInstance();