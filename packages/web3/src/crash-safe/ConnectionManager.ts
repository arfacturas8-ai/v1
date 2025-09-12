import { createPublicClient, createWalletClient, custom, http, PublicClient, WalletClient } from 'viem';
import { mainnet, polygon, arbitrum, base, optimism, bsc } from 'viem/chains';
import { Chain } from 'viem';

export interface RpcEndpoint {
  url: string;
  weight: number;
  timeout: number;
  maxRetries: number;
  isHealthy: boolean;
  lastChecked: number;
  consecutiveFailures: number;
}

export interface ChainConfig {
  chain: Chain;
  rpcs: RpcEndpoint[];
  fallbackRpcs: string[];
  healthCheckInterval: number;
}

export interface ConnectionManagerConfig {
  maxRetries: number;
  retryDelay: number;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
  healthCheckInterval: number;
  rateLimitPerSecond: number;
}

export interface RequestOptions {
  retries?: number;
  timeout?: number;
  priority?: 'low' | 'normal' | 'high';
  bypassCircuitBreaker?: boolean;
}

export class CrashSafeConnectionManager {
  private chains: Map<number, ChainConfig> = new Map();
  private publicClients: Map<number, PublicClient> = new Map();
  private walletClients: Map<number, WalletClient> = new Map();
  private circuitBreakers: Map<string, { isOpen: boolean; failures: number; lastFailure: number }> = new Map();
  private rateLimiter: Map<string, number[]> = new Map();
  private healthCheckTimers: Map<number, NodeJS.Timeout> = new Map();
  private requestQueue: Array<{ resolve: Function; reject: Function; fn: Function; options: RequestOptions }> = [];
  private isProcessingQueue = false;
  private logger: Console = console;

  private readonly config: ConnectionManagerConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    circuitBreakerThreshold: 5,
    circuitBreakerTimeout: 30000,
    healthCheckInterval: 60000,
    rateLimitPerSecond: 10
  };

  constructor(config?: Partial<ConnectionManagerConfig>) {
    this.config = { ...this.config, ...config };
    this.initializeChains();
    this.startHealthChecks();
  }

  private initializeChains(): void {
    const chainConfigs: Array<{ chain: Chain; rpcs: string[]; fallbacks: string[] }> = [
      {
        chain: mainnet,
        rpcs: [
          'https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}',
          'https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}',
          'https://rpc.ankr.com/eth'
        ],
        fallbacks: [
          'https://eth.llamarpc.com',
          'https://ethereum.publicnode.com',
          'https://cloudflare-eth.com'
        ]
      },
      {
        chain: polygon,
        rpcs: [
          'https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}',
          'https://polygon-mainnet.infura.io/v3/${INFURA_PROJECT_ID}',
          'https://rpc.ankr.com/polygon'
        ],
        fallbacks: [
          'https://polygon.llamarpc.com',
          'https://polygon-rpc.com'
        ]
      },
      {
        chain: arbitrum,
        rpcs: [
          'https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}',
          'https://arbitrum-mainnet.infura.io/v3/${INFURA_PROJECT_ID}',
          'https://rpc.ankr.com/arbitrum'
        ],
        fallbacks: [
          'https://arbitrum.llamarpc.com',
          'https://arbitrum.public-rpc.com'
        ]
      },
      {
        chain: base,
        rpcs: [
          'https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}',
          'https://mainnet.base.org',
          'https://rpc.ankr.com/base'
        ],
        fallbacks: [
          'https://base.llamarpc.com'
        ]
      },
      {
        chain: optimism,
        rpcs: [
          'https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}',
          'https://optimism-mainnet.infura.io/v3/${INFURA_PROJECT_ID}',
          'https://rpc.ankr.com/optimism'
        ],
        fallbacks: [
          'https://optimism.llamarpc.com',
          'https://mainnet.optimism.io'
        ]
      },
      {
        chain: bsc,
        rpcs: [
          'https://bsc-dataseed1.binance.org',
          'https://rpc.ankr.com/bsc',
          'https://bsc-dataseed.binance.org'
        ],
        fallbacks: [
          'https://bsc.publicnode.com',
          'https://rpc.ankr.com/bsc'
        ]
      }
    ];

    for (const { chain, rpcs, fallbacks } of chainConfigs) {
      const rpcEndpoints: RpcEndpoint[] = [
        ...rpcs.map((url, index) => ({
          url: this.interpolateUrl(url),
          weight: rpcs.length - index,
          timeout: 5000,
          maxRetries: 2,
          isHealthy: true,
          lastChecked: 0,
          consecutiveFailures: 0
        })),
        ...fallbacks.map((url, index) => ({
          url,
          weight: 1,
          timeout: 10000,
          maxRetries: 1,
          isHealthy: true,
          lastChecked: 0,
          consecutiveFailures: 0
        }))
      ];

      this.chains.set(chain.id, {
        chain,
        rpcs: rpcEndpoints,
        fallbackRpcs: fallbacks,
        healthCheckInterval: this.config.healthCheckInterval
      });
    }
  }

  private interpolateUrl(url: string): string {
    return url
      .replace('${ALCHEMY_API_KEY}', process.env.ALCHEMY_API_KEY || '')
      .replace('${INFURA_PROJECT_ID}', process.env.INFURA_PROJECT_ID || '');
  }

  public async getPublicClient(chainId: number, options?: RequestOptions): Promise<PublicClient> {
    return this.executeWithFallback(async () => {
      if (this.publicClients.has(chainId)) {
        const client = this.publicClients.get(chainId)!;
        // Test the client with a simple call
        await client.getBlockNumber();
        return client;
      }

      const chainConfig = this.chains.get(chainId);
      if (!chainConfig) {
        throw new Error(`Unsupported chain ID: ${chainId}`);
      }

      const rpcUrl = await this.getHealthyRpcUrl(chainId);
      const client = createPublicClient({
        chain: chainConfig.chain,
        transport: http(rpcUrl, {
          timeout: 10000,
          retryCount: 2,
          retryDelay: 1000
        })
      });

      this.publicClients.set(chainId, client);
      return client;
    }, options);
  }

  public async getWalletClient(chainId: number, options?: RequestOptions): Promise<WalletClient | null> {
    try {
      if (typeof window === 'undefined') {
        return null;
      }

      return this.executeWithFallback(async () => {
        if (this.walletClients.has(chainId)) {
          return this.walletClients.get(chainId)!;
        }

        const chainConfig = this.chains.get(chainId);
        if (!chainConfig) {
          throw new Error(`Unsupported chain ID: ${chainId}`);
        }

        // Check if wallet is available
        if (!window.ethereum) {
          throw new Error('No wallet provider detected');
        }

        const client = createWalletClient({
          chain: chainConfig.chain,
          transport: custom(window.ethereum)
        });

        this.walletClients.set(chainId, client);
        return client;
      }, options);
    } catch (error) {
      this.logger.warn('Failed to get wallet client:', error);
      return null;
    }
  }

  private async getHealthyRpcUrl(chainId: number): Promise<string> {
    const chainConfig = this.chains.get(chainId);
    if (!chainConfig) {
      throw new Error(`Chain ${chainId} not configured`);
    }

    // Sort RPCs by health and weight
    const healthyRpcs = chainConfig.rpcs
      .filter(rpc => rpc.isHealthy)
      .sort((a, b) => b.weight - a.weight);

    if (healthyRpcs.length === 0) {
      // All RPCs are unhealthy, try the best fallback
      const fallbackRpc = chainConfig.rpcs
        .sort((a, b) => a.consecutiveFailures - b.consecutiveFailures)[0];
      
      if (fallbackRpc) {
        this.logger.warn(`Using potentially unhealthy RPC for chain ${chainId}: ${fallbackRpc.url}`);
        return fallbackRpc.url;
      }
      
      throw new Error(`No healthy RPC endpoints available for chain ${chainId}`);
    }

    return healthyRpcs[0].url;
  }

  private async executeWithFallback<T>(
    operation: () => Promise<T>,
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      retries = this.config.maxRetries,
      timeout = 10000,
      bypassCircuitBreaker = false
    } = options;

    // Check circuit breaker
    const operationId = operation.toString().slice(0, 50);
    if (!bypassCircuitBreaker && this.isCircuitBreakerOpen(operationId)) {
      throw new Error('Circuit breaker is open for this operation');
    }

    // Rate limiting
    if (!this.checkRateLimit(operationId)) {
      throw new Error('Rate limit exceeded');
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await Promise.race([
          operation(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Operation timeout')), timeout)
          )
        ]);

        // Reset circuit breaker on success
        this.resetCircuitBreaker(operationId);
        return result;
      } catch (error) {
        lastError = error as Error;
        this.recordFailure(operationId);

        if (attempt < retries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Operation failed after all retries');
  }

  private isCircuitBreakerOpen(operationId: string): boolean {
    const breaker = this.circuitBreakers.get(operationId);
    if (!breaker) return false;

    if (breaker.isOpen) {
      const timeSinceLastFailure = Date.now() - breaker.lastFailure;
      if (timeSinceLastFailure > this.config.circuitBreakerTimeout) {
        breaker.isOpen = false;
        breaker.failures = 0;
        return false;
      }
      return true;
    }

    return breaker.failures >= this.config.circuitBreakerThreshold;
  }

  private recordFailure(operationId: string): void {
    const breaker = this.circuitBreakers.get(operationId) || {
      isOpen: false,
      failures: 0,
      lastFailure: 0
    };

    breaker.failures++;
    breaker.lastFailure = Date.now();

    if (breaker.failures >= this.config.circuitBreakerThreshold) {
      breaker.isOpen = true;
      this.logger.warn(`Circuit breaker opened for operation: ${operationId}`);
    }

    this.circuitBreakers.set(operationId, breaker);
  }

  private resetCircuitBreaker(operationId: string): void {
    const breaker = this.circuitBreakers.get(operationId);
    if (breaker) {
      breaker.isOpen = false;
      breaker.failures = 0;
    }
  }

  private checkRateLimit(operationId: string): boolean {
    const now = Date.now();
    const window = 1000; // 1 second window
    
    let requests = this.rateLimiter.get(operationId) || [];
    requests = requests.filter(time => now - time < window);
    
    if (requests.length >= this.config.rateLimitPerSecond) {
      return false;
    }
    
    requests.push(now);
    this.rateLimiter.set(operationId, requests);
    return true;
  }

  private startHealthChecks(): void {
    for (const [chainId, chainConfig] of this.chains) {
      const timer = setInterval(() => {
        this.performHealthCheck(chainId).catch(error => {
          this.logger.error(`Health check failed for chain ${chainId}:`, error);
        });
      }, chainConfig.healthCheckInterval);

      this.healthCheckTimers.set(chainId, timer);
    }
  }

  private async performHealthCheck(chainId: number): Promise<void> {
    const chainConfig = this.chains.get(chainId);
    if (!chainConfig) return;

    const healthChecks = chainConfig.rpcs.map(async rpc => {
      const startTime = Date.now();
      try {
        const client = createPublicClient({
          chain: chainConfig.chain,
          transport: http(rpc.url, { timeout: rpc.timeout })
        });

        await client.getBlockNumber();
        
        rpc.isHealthy = true;
        rpc.consecutiveFailures = 0;
        rpc.lastChecked = Date.now();
        
        const responseTime = Date.now() - startTime;
        if (responseTime > rpc.timeout * 0.8) {
          rpc.weight = Math.max(1, rpc.weight - 1);
        } else {
          rpc.weight = Math.min(10, rpc.weight + 1);
        }
      } catch (error) {
        rpc.isHealthy = false;
        rpc.consecutiveFailures++;
        rpc.lastChecked = Date.now();
        rpc.weight = Math.max(1, rpc.weight - 2);
        
        this.logger.warn(`Health check failed for RPC ${rpc.url}:`, error);
      }
    });

    await Promise.allSettled(healthChecks);
  }

  public getConnectionStatus(): Record<number, { healthy: number; total: number; status: string }> {
    const status: Record<number, { healthy: number; total: number; status: string }> = {};
    
    for (const [chainId, config] of this.chains) {
      const healthyCount = config.rpcs.filter(rpc => rpc.isHealthy).length;
      const totalCount = config.rpcs.length;
      
      let statusText = 'healthy';
      if (healthyCount === 0) statusText = 'critical';
      else if (healthyCount < totalCount * 0.5) statusText = 'degraded';
      
      status[chainId] = {
        healthy: healthyCount,
        total: totalCount,
        status: statusText
      };
    }
    
    return status;
  }

  public getSupportedChains(): Chain[] {
    return Array.from(this.chains.values()).map(config => config.chain);
  }

  public async switchNetwork(chainId: number): Promise<void> {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('No wallet provider available');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        // Chain not added to wallet, try to add it
        const chainConfig = this.chains.get(chainId);
        if (chainConfig) {
          await this.addNetwork(chainConfig.chain);
        }
      }
      throw error;
    }
  }

  private async addNetwork(chain: Chain): Promise<void> {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('No wallet provider available');
    }

    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: `0x${chain.id.toString(16)}`,
          chainName: chain.name,
          nativeCurrency: chain.nativeCurrency,
          rpcUrls: [await this.getHealthyRpcUrl(chain.id)],
          blockExplorerUrls: chain.blockExplorers?.default ? [chain.blockExplorers.default.url] : undefined,
        },
      ],
    });
  }

  public cleanup(): void {
    // Clear health check timers
    for (const timer of this.healthCheckTimers.values()) {
      clearInterval(timer);
    }
    this.healthCheckTimers.clear();

    // Clear clients
    this.publicClients.clear();
    this.walletClients.clear();

    // Clear circuit breakers and rate limiters
    this.circuitBreakers.clear();
    this.rateLimiter.clear();
  }
}

// Export singleton instance
export const connectionManager = new CrashSafeConnectionManager();

// Types for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}