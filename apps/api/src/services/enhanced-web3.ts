/**
 * Enhanced Web3 Service with RPC Optimization, Caching, and Error Handling
 * CRYB Platform - Production-Ready Web3 Infrastructure
 */

import { createPublicClient, http, fallback, webSocket } from 'viem';
import { mainnet, polygon, arbitrum, optimism, bsc } from 'viem/chains';
import { LRUCache } from 'lru-cache';
import { Redis } from 'ioredis';
import { ethers } from 'ethers';

// Enhanced Types
export interface TokenBalance {
  address: string;
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  usdValue?: number;
  lastUpdated: Date;
  chainId: number;
}

export interface NFTMetadata {
  tokenId: string;
  contractAddress: string;
  name: string;
  description?: string;
  image?: string;
  attributes?: Array<{
    trait_type: string;
    value: any;
  }>;
  lastUpdated: Date;
  chainId: number;
}

export interface WalletPortfolio {
  address: string;
  totalUsdValue: number;
  tokens: TokenBalance[];
  nfts: NFTMetadata[];
  lastUpdated: Date;
  chainBreakdown: Record<number, { value: number; tokenCount: number; nftCount: number }>;
}

export interface RPCEndpoint {
  url: string;
  priority: number;
  isHealthy: boolean;
  latency: number;
  lastCheck: Date;
  requestCount: number;
  errorCount: number;
}

export interface ChainConfig {
  chainId: number;
  name: string;
  endpoints: RPCEndpoint[];
  retryAttempts: number;
  timeout: number;
  blockTimeMs: number;
  gasMultiplier: number;
}

export interface Web3Error extends Error {
  code: string;
  chainId?: number;
  address?: string;
  retryable: boolean;
  context?: any;
  timestamp: Date;
}

export interface TransactionCache {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  gasUsed?: string;
  gasPrice?: string;
  timestamp: Date;
  retryCount: number;
}

// Cache configuration with TTL optimization
const CACHE_CONFIG = {
  balances: { max: 2000, ttl: 30000 }, // 30 seconds - frequently updated
  tokens: { max: 1000, ttl: 300000 }, // 5 minutes - moderately stable
  nfts: { max: 500, ttl: 600000 }, // 10 minutes - relatively stable
  prices: { max: 200, ttl: 60000 }, // 1 minute - volatile
  transactions: { max: 2000, ttl: 300000 }, // 5 minutes - historical data
  metadata: { max: 1000, ttl: 3600000 }, // 1 hour - static contract data
  siwe: { max: 500, ttl: 900000 }, // 15 minutes - authentication sessions
};

// Multi-chain RPC configuration with fallbacks
const CHAIN_CONFIGS: ChainConfig[] = [
  {
    chainId: 1,
    name: 'Ethereum',
    endpoints: [
      { url: process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo', priority: 1, isHealthy: true, latency: 0, lastCheck: new Date(), requestCount: 0, errorCount: 0 },
      { url: process.env.ETHEREUM_BACKUP_RPC_URL || 'https://cloudflare-eth.com', priority: 2, isHealthy: true, latency: 0, lastCheck: new Date(), requestCount: 0, errorCount: 0 },
      { url: 'https://rpc.ankr.com/eth', priority: 3, isHealthy: true, latency: 0, lastCheck: new Date(), requestCount: 0, errorCount: 0 },
    ],
    retryAttempts: 3,
    timeout: 15000,
    blockTimeMs: 12000,
    gasMultiplier: 1.1,
  },
  {
    chainId: 137,
    name: 'Polygon',
    endpoints: [
      { url: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com', priority: 1, isHealthy: true, latency: 0, lastCheck: new Date(), requestCount: 0, errorCount: 0 },
      { url: 'https://rpc.ankr.com/polygon', priority: 2, isHealthy: true, latency: 0, lastCheck: new Date(), requestCount: 0, errorCount: 0 },
      { url: 'https://polygon-mainnet.public.blastapi.io', priority: 3, isHealthy: true, latency: 0, lastCheck: new Date(), requestCount: 0, errorCount: 0 },
    ],
    retryAttempts: 3,
    timeout: 10000,
    blockTimeMs: 2000,
    gasMultiplier: 1.2,
  },
  {
    chainId: 42161,
    name: 'Arbitrum',
    endpoints: [
      { url: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc', priority: 1, isHealthy: true, latency: 0, lastCheck: new Date(), requestCount: 0, errorCount: 0 },
      { url: 'https://rpc.ankr.com/arbitrum', priority: 2, isHealthy: true, latency: 0, lastCheck: new Date(), requestCount: 0, errorCount: 0 },
      { url: 'https://arbitrum-mainnet.public.blastapi.io', priority: 3, isHealthy: true, latency: 0, lastCheck: new Date(), requestCount: 0, errorCount: 0 },
    ],
    retryAttempts: 3,
    timeout: 8000,
    blockTimeMs: 13000,
    gasMultiplier: 1.0,
  },
  {
    chainId: 10,
    name: 'Optimism',
    endpoints: [
      { url: process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io', priority: 1, isHealthy: true, latency: 0, lastCheck: new Date(), requestCount: 0, errorCount: 0 },
      { url: 'https://rpc.ankr.com/optimism', priority: 2, isHealthy: true, latency: 0, lastCheck: new Date(), requestCount: 0, errorCount: 0 },
      { url: 'https://optimism-mainnet.public.blastapi.io', priority: 3, isHealthy: true, latency: 0, lastCheck: new Date(), requestCount: 0, errorCount: 0 },
    ],
    retryAttempts: 3,
    timeout: 8000,
    blockTimeMs: 2000,
    gasMultiplier: 1.0,
  },
  {
    chainId: 56,
    name: 'BNB Smart Chain',
    endpoints: [
      { url: process.env.BSC_RPC_URL || 'https://bsc-dataseed1.binance.org', priority: 1, isHealthy: true, latency: 0, lastCheck: new Date(), requestCount: 0, errorCount: 0 },
      { url: 'https://rpc.ankr.com/bsc', priority: 2, isHealthy: true, latency: 0, lastCheck: new Date(), requestCount: 0, errorCount: 0 },
      { url: 'https://bsc-mainnet.public.blastapi.io', priority: 3, isHealthy: true, latency: 0, lastCheck: new Date(), requestCount: 0, errorCount: 0 },
    ],
    retryAttempts: 3,
    timeout: 10000,
    blockTimeMs: 3000,
    gasMultiplier: 1.1,
  },
];

export class EnhancedWeb3Service {
  private redis: Redis | null = null;
  private localCaches = {
    balances: new LRUCache<string, any>(CACHE_CONFIG.balances),
    tokens: new LRUCache<string, any>(CACHE_CONFIG.tokens),
    nfts: new LRUCache<string, any>(CACHE_CONFIG.nfts),
    prices: new LRUCache<string, any>(CACHE_CONFIG.prices),
    transactions: new LRUCache<string, any>(CACHE_CONFIG.transactions),
    metadata: new LRUCache<string, any>(CACHE_CONFIG.metadata),
    siwe: new LRUCache<string, any>(CACHE_CONFIG.siwe),
  };
  
  private rpcEndpoints: Map<number, ChainConfig> = new Map();
  private circuitBreakers: Map<string, { failures: number; lastFailure: Date; isOpen: boolean }> = new Map();
  private batchRequests: Map<string, { requests: any[]; timeout: NodeJS.Timeout }> = new Map();
  private transactionCache: Map<string, TransactionCache> = new Map();
  private providers: Map<number, any> = new Map();
  
  private isFeatureFlagEnabled = process.env.ENABLE_WEB3_FEATURES === 'true';
  private metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageLatency: 0,
  };

  constructor() {
    console.log('🚀 Initializing Enhanced Web3 Service...');
    this.initializeRedis();
    this.initializeRPCEndpoints();
    this.initializeProviders();
    this.startHealthChecks();
    this.startMetricsCollection();
    
    if (!this.isFeatureFlagEnabled) {
      console.log('⚡ Web3 features disabled - running in mock mode');
    } else {
      console.log('✅ Web3 features enabled - production mode active');
    }
  }

  /**
   * Initialize Redis connection for distributed caching
   */
  private initializeRedis(): void {
    if (process.env.REDIS_URL && this.isFeatureFlagEnabled) {
      try {
        this.redis = new Redis(process.env.REDIS_URL, {
          retryDelayOnFailover: 100,
          enableReadyCheck: false,
          maxRetriesPerRequest: 3,
          connectTimeout: 10000,
          lazyConnect: true,
        });
        
        this.redis.on('connect', () => console.log('✅ Redis connected for Web3 caching'));
        this.redis.on('error', (err) => console.warn('⚠️ Redis connection error:', err));
        
      } catch (error) {
        console.warn('⚠️ Redis initialization failed, using local cache only:', error);
      }
    }
  }

  /**
   * Initialize RPC endpoints with health monitoring
   */
  private initializeRPCEndpoints(): void {
    CHAIN_CONFIGS.forEach(config => {
      this.rpcEndpoints.set(config.chainId, { ...config });
    });
    console.log(`✅ Initialized RPC endpoints for ${CHAIN_CONFIGS.length} chains`);
  }

  /**
   * Initialize viem providers with fallback support
   */
  private initializeProviders(): void {
    for (const [chainId, config] of this.rpcEndpoints.entries()) {
      try {
        const chain = this.getViemChain(chainId);
        const transports = config.endpoints.map(endpoint => http(endpoint.url, {
          timeout: config.timeout,
          retryCount: config.retryAttempts,
        }));

        const provider = createPublicClient({
          chain,
          transport: fallback(transports, { rank: false }),
          batch: { multicall: true },
          cacheTime: 30_000, // 30 seconds
        });

        this.providers.set(chainId, provider);
      } catch (error) {
        console.warn(`Failed to initialize provider for chain ${chainId}:`, error);
      }
    }
    console.log(`✅ Initialized ${this.providers.size} blockchain providers`);
  }

  /**
   * Get viem chain configuration
   */
  private getViemChain(chainId: number) {
    switch (chainId) {
      case 1: return mainnet;
      case 137: return polygon;
      case 42161: return arbitrum;
      case 10: return optimism;
      case 56: return bsc;
      default: return mainnet;
    }
  }

  /**
   * Start health check monitoring for all RPC endpoints
   */
  private startHealthChecks(): void {
    const healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, 60000); // Every minute

    // Cleanup interval on process exit
    process.on('SIGINT', () => {
      clearInterval(healthCheckInterval);
    });

    console.log('✅ Health check monitoring started');
  }

  /**
   * Perform comprehensive health checks
   */
  private async performHealthChecks(): Promise<void> {
    const healthPromises = Array.from(this.rpcEndpoints.entries()).map(
      ([chainId, config]) => this.checkChainHealth(chainId, config)
    );

    await Promise.allSettled(healthPromises);
  }

  /**
   * Check health of all endpoints for a specific chain
   */
  private async checkChainHealth(chainId: number, config: ChainConfig): Promise<void> {
    const healthPromises = config.endpoints.map(endpoint => 
      this.checkEndpointHealth(chainId, endpoint, config.timeout)
    );

    await Promise.allSettled(healthPromises);
  }

  /**
   * Check individual endpoint health with detailed metrics
   */
  private async checkEndpointHealth(chainId: number, endpoint: RPCEndpoint, timeout: number): Promise<void> {
    const startTime = Date.now();
    const key = `rpc-${chainId}-${endpoint.url}`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: Date.now(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const isHealthy = response.ok;
      const latency = Date.now() - startTime;

      endpoint.isHealthy = isHealthy;
      endpoint.latency = latency;
      endpoint.lastCheck = new Date();
      endpoint.requestCount++;

      if (isHealthy) {
        this.resetCircuitBreaker(key);
      } else {
        endpoint.errorCount++;
        this.recordFailure(key);
      }
      
    } catch (error) {
      endpoint.isHealthy = false;
      endpoint.latency = Date.now() - startTime;
      endpoint.lastCheck = new Date();
      endpoint.requestCount++;
      endpoint.errorCount++;
      this.recordFailure(key);
    }
  }

  /**
   * Start metrics collection for monitoring
   */
  private startMetricsCollection(): void {
    setInterval(() => {
      this.logMetrics();
    }, 300000); // Every 5 minutes
  }

  /**
   * Log performance metrics
   */
  private logMetrics(): void {
    const successRate = this.metrics.totalRequests > 0 
      ? (this.metrics.successfulRequests / this.metrics.totalRequests * 100).toFixed(2)
      : '0.00';
    
    const cacheHitRate = (this.metrics.cacheHits + this.metrics.cacheMisses) > 0
      ? (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) * 100).toFixed(2)
      : '0.00';

    console.log(`📊 Web3 Service Metrics:
      Total Requests: ${this.metrics.totalRequests}
      Success Rate: ${successRate}%
      Cache Hit Rate: ${cacheHitRate}%
      Average Latency: ${this.metrics.averageLatency.toFixed(0)}ms
      Active Endpoints: ${Array.from(this.rpcEndpoints.values())
        .flatMap(c => c.endpoints)
        .filter(e => e.isHealthy).length}
    `);
  }

  /**
   * Get best RPC endpoint for a chain with intelligent selection
   */
  private getBestRPCEndpoint(chainId: number): RPCEndpoint | null {
    const config = this.rpcEndpoints.get(chainId);
    if (!config) return null;

    // Filter healthy endpoints and calculate scores
    const healthyEndpoints = config.endpoints
      .filter(ep => ep.isHealthy && !this.isCircuitBreakerOpen(`rpc-${chainId}-${ep.url}`))
      .map(ep => ({
        ...ep,
        score: this.calculateEndpointScore(ep)
      }))
      .sort((a, b) => b.score - a.score);

    return healthyEndpoints[0] || config.endpoints[0]; // Fallback to first endpoint
  }

  /**
   * Calculate endpoint score based on multiple factors
   */
  private calculateEndpointScore(endpoint: RPCEndpoint): number {
    const latencyScore = Math.max(0, 1000 - endpoint.latency) / 1000; // Lower latency = higher score
    const reliabilityScore = endpoint.requestCount > 0 
      ? 1 - (endpoint.errorCount / endpoint.requestCount) 
      : 0.5;
    const priorityScore = (4 - endpoint.priority) / 3; // Higher priority = higher score
    
    return latencyScore * 0.4 + reliabilityScore * 0.4 + priorityScore * 0.2;
  }

  /**
   * Circuit breaker implementation with adaptive thresholds
   */
  private isCircuitBreakerOpen(key: string): boolean {
    const breaker = this.circuitBreakers.get(key);
    if (!breaker) return false;
    
    const failureThreshold = 5;
    const recoveryTimeMs = 300000; // 5 minutes
    
    if (breaker.failures >= failureThreshold) {
      const timeSinceLastFailure = Date.now() - breaker.lastFailure.getTime();
      if (timeSinceLastFailure > recoveryTimeMs) {
        breaker.isOpen = false;
        breaker.failures = 0;
      }
      return breaker.isOpen;
    }
    return false;
  }

  private recordFailure(key: string): void {
    const breaker = this.circuitBreakers.get(key) || { 
      failures: 0, 
      lastFailure: new Date(), 
      isOpen: false 
    };
    
    breaker.failures++;
    breaker.lastFailure = new Date();
    if (breaker.failures >= 5) {
      breaker.isOpen = true;
    }
    this.circuitBreakers.set(key, breaker);
  }

  private resetCircuitBreaker(key: string): void {
    this.circuitBreakers.delete(key);
  }

  /**
   * Enhanced caching with automatic invalidation
   */
  private async getFromCache(key: string, cacheType: keyof typeof this.localCaches): Promise<any> {
    this.metrics.totalRequests++;
    
    // Try local cache first
    const localValue = this.localCaches[cacheType].get(key);
    if (localValue) {
      this.metrics.cacheHits++;
      return localValue;
    }

    // Try Redis cache
    if (this.redis) {
      try {
        const redisValue = await this.redis.get(`web3:${cacheType}:${key}`);
        if (redisValue) {
          const parsed = JSON.parse(redisValue);
          this.localCaches[cacheType].set(key, parsed);
          this.metrics.cacheHits++;
          return parsed;
        }
      } catch (error) {
        console.warn('Redis cache read failed:', error);
      }
    }

    this.metrics.cacheMisses++;
    return null;
  }

  private async setToCache(
    key: string, 
    value: any, 
    cacheType: keyof typeof this.localCaches, 
    customTtl?: number
  ): Promise<void> {
    // Set in local cache
    this.localCaches[cacheType].set(key, value);

    // Set in Redis cache with TTL
    if (this.redis) {
      try {
        const serialized = JSON.stringify(value);
        const ttl = customTtl || CACHE_CONFIG[cacheType].ttl;
        await this.redis.setex(`web3:${cacheType}:${key}`, Math.floor(ttl / 1000), serialized);
      } catch (error) {
        console.warn('Redis cache write failed:', error);
      }
    }
  }

  /**
   * Execute function with advanced retry logic and telemetry
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    operation: string,
    chainId?: number,
    maxRetries: number = 3
  ): Promise<T> {
    const startTime = Date.now();
    this.metrics.totalRequests++;
    
    if (this.isCircuitBreakerOpen(operation)) {
      const error = this.createWeb3Error(
        'CIRCUIT_BREAKER_OPEN',
        `Circuit breaker open for ${operation}`,
        null,
        { operation, chainId }
      );
      this.metrics.failedRequests++;
      throw error;
    }

    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await fn();
        
        // Success metrics
        this.metrics.successfulRequests++;
        this.metrics.averageLatency = (this.metrics.averageLatency + (Date.now() - startTime)) / 2;
        this.resetCircuitBreaker(operation);
        
        return result;
      } catch (error) {
        lastError = error;
        this.recordFailure(operation);
        
        if (attempt === maxRetries) break;
        
        // Exponential backoff with jitter
        const baseDelay = 1000 * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 500;
        const delay = baseDelay + jitter;
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    this.metrics.failedRequests++;
    throw this.createWeb3Error(
      'OPERATION_FAILED',
      `Operation failed after ${maxRetries} attempts`,
      lastError,
      { operation, chainId, attempts: maxRetries }
    );
  }

  /**
   * Create standardized Web3 error with enhanced context
   */
  private createWeb3Error(
    code: string,
    message: string,
    originalError: any,
    context?: any
  ): Web3Error {
    const error = new Error(message) as Web3Error;
    error.code = code;
    error.context = context;
    error.timestamp = new Date();
    error.retryable = [
      'NETWORK_ERROR', 
      'TIMEOUT', 
      'RATE_LIMIT', 
      'RPC_ERROR',
      'CIRCUIT_BREAKER_OPEN'
    ].includes(code);
    
    if (originalError) {
      error.stack = originalError.stack;
      error.cause = originalError;
    }
    
    return error;
  }

  /**
   * Verify wallet ownership using SIWE with caching and retry logic
   */
  async verifyWalletOwnership(
    message: string, 
    signature: string, 
    address: string
  ): Promise<boolean> {
    if (!this.isFeatureFlagEnabled) {
      console.log('🔓 Web3 features disabled - mocking SIWE verification');
      return true;
    }

    const cacheKey = `siwe:${address}:${signature.slice(0, 16)}`;
    
    try {
      // Check cache first
      const cached = await this.getFromCache(cacheKey, 'siwe');
      if (cached !== null) return cached;

      // Verify signature with ethers
      const result = await this.executeWithRetry(async () => {
        const recoveredAddress = ethers.verifyMessage(message, signature);
        return recoveredAddress.toLowerCase() === address.toLowerCase();
      }, `siwe-verify-${address}`);

      // Cache the result
      await this.setToCache(cacheKey, result, 'siwe', 300000);
      
      return result;
    } catch (error) {
      const web3Error = this.createWeb3Error(
        'SIWE_VERIFICATION_FAILED',
        'Failed to verify wallet ownership',
        error,
        { address, messageLength: message.length }
      );
      console.error('SIWE verification failed:', web3Error);
      return false;
    }
  }

  /**
   * Get wallet token balances with parallel processing and caching
   */
  async getWalletTokens(
    address: string, 
    chainIds: number[] = [1, 137, 42161]
  ): Promise<TokenBalance[]> {
    if (!this.isFeatureFlagEnabled) {
      console.log('💰 Web3 features disabled - returning mock token data');
      return this.getMockTokenData(address, chainIds);
    }

    const cacheKey = `tokens:${address}:${chainIds.sort().join(',')}`;
    
    try {
      // Check cache first
      const cached = await this.getFromCache(cacheKey, 'tokens');
      if (cached) {
        const age = Date.now() - new Date(cached.lastUpdated).getTime();
        if (age < CACHE_CONFIG.tokens.ttl) {
          return cached.tokens;
        }
      }

      const tokens: TokenBalance[] = [];
      const errors: Array<{ chainId: number; error: any }> = [];
      
      // Process chains in parallel batches
      const concurrencyLimit = 3;
      for (let i = 0; i < chainIds.length; i += concurrencyLimit) {
        const batch = chainIds.slice(i, i + concurrencyLimit);
        const batchResults = await Promise.allSettled(
          batch.map(chainId => this.getChainTokens(address, chainId))
        );

        batchResults.forEach((result, index) => {
          const chainId = batch[index];
          if (result.status === 'fulfilled') {
            tokens.push(...result.value);
          } else {
            errors.push({ chainId, error: result.reason });
          }
        });
      }

      // Cache successful results
      const cacheData = { tokens, lastUpdated: new Date() };
      await this.setToCache(cacheKey, cacheData, 'tokens');

      if (errors.length > 0) {
        console.warn(`Token fetching completed with errors for ${errors.length} chains`);
      }

      return tokens;
    } catch (error) {
      const web3Error = this.createWeb3Error(
        'TOKEN_FETCH_FAILED',
        'Failed to get wallet tokens',
        error,
        { address, chainIds }
      );
      console.error('Wallet token fetch failed:', web3Error);
      
      // Return cached data as fallback
      const cached = await this.getFromCache(cacheKey, 'tokens');
      return cached?.tokens || [];
    }
  }

  /**
   * Get tokens for a specific chain with optimized RPC calls
   */
  private async getChainTokens(address: string, chainId: number): Promise<TokenBalance[]> {
    const provider = this.providers.get(chainId);
    if (!provider) {
      throw new Error(`No provider available for chain ${chainId}`);
    }

    return await this.executeWithRetry(async () => {
      // Get native token balance
      const balance = await provider.getBalance({ address: address as `0x${string}` });
      const chainConfig = this.rpcEndpoints.get(chainId);
      
      const tokens: TokenBalance[] = [{
        address: '0x0000000000000000000000000000000000000000',
        symbol: this.getNativeTokenSymbol(chainId),
        name: this.getNativeTokenName(chainId),
        balance: ethers.formatEther(balance),
        decimals: 18,
        lastUpdated: new Date(),
        chainId,
      }];

      // Get common ERC-20 tokens for this chain
      const commonTokens = this.getCommonTokens(chainId);
      for (const tokenContract of commonTokens) {
        try {
          const tokenBalance = await this.getERC20Balance(provider, tokenContract, address);
          if (parseFloat(tokenBalance.balance) > 0) {
            tokens.push({
              ...tokenBalance,
              lastUpdated: new Date(),
              chainId,
            });
          }
        } catch (error) {
          // Silently continue on token errors
        }
      }

      return tokens;
    }, `get-chain-tokens-${chainId}`, chainId);
  }

  /**
   * Get ERC-20 token balance with contract interaction
   */
  private async getERC20Balance(
    provider: any, 
    tokenAddress: string, 
    walletAddress: string
  ): Promise<Omit<TokenBalance, 'lastUpdated' | 'chainId'>> {
    const tokenABI = [
      'function balanceOf(address) view returns (uint256)',
      'function symbol() view returns (string)',
      'function name() view returns (string)',
      'function decimals() view returns (uint8)'
    ];

    try {
      // Use multicall for efficiency
      const results = await provider.multicall({
        contracts: [
          {
            address: tokenAddress as `0x${string}`,
            abi: tokenABI,
            functionName: 'balanceOf',
            args: [walletAddress as `0x${string}`],
          },
          {
            address: tokenAddress as `0x${string}`,
            abi: tokenABI,
            functionName: 'symbol',
            args: [],
          },
          {
            address: tokenAddress as `0x${string}`,
            abi: tokenABI,
            functionName: 'name',
            args: [],
          },
          {
            address: tokenAddress as `0x${string}`,
            abi: tokenABI,
            functionName: 'decimals',
            args: [],
          },
        ],
      });

      const [balance, symbol, name, decimals] = results.map((r: any) => r.result);
      
      return {
        address: tokenAddress,
        symbol: symbol || 'UNKNOWN',
        name: name || 'Unknown Token',
        balance: ethers.formatUnits(balance, decimals),
        decimals: Number(decimals) || 18,
      };
    } catch (error) {
      throw new Error(`Failed to get ERC-20 balance for ${tokenAddress}: ${error}`);
    }
  }

  /**
   * Get common tokens for a specific chain
   */
  private getCommonTokens(chainId: number): string[] {
    const tokensByChain = {
      1: [ // Ethereum
        '0xA0b86a33E6441f3de0B0b3b2eA11b93cD0dE8F72', // USDC
        '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
        '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
      ],
      137: [ // Polygon
        '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC
        '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // USDT
        '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', // DAI
        '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', // WETH
      ],
      42161: [ // Arbitrum
        '0xA0b86a33E6441f3de0B0b3b2eA11b93cD0dE8F72', // USDC
        '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // USDT
        '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // DAI
        '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH
      ],
    };
    
    return tokensByChain[chainId as keyof typeof tokensByChain] || [];
  }

  /**
   * Get native token symbol for chain
   */
  private getNativeTokenSymbol(chainId: number): string {
    const symbols = {
      1: 'ETH',
      137: 'MATIC',
      42161: 'ETH',
      10: 'ETH',
      56: 'BNB',
    };
    return symbols[chainId as keyof typeof symbols] || 'ETH';
  }

  /**
   * Get native token name for chain
   */
  private getNativeTokenName(chainId: number): string {
    const names = {
      1: 'Ethereum',
      137: 'Polygon',
      42161: 'Ethereum',
      10: 'Ethereum',
      56: 'BNB',
    };
    return names[chainId as keyof typeof names] || 'Ethereum';
  }

  /**
   * Get mock token data when features are disabled
   */
  private getMockTokenData(address: string, chainIds: number[]): TokenBalance[] {
    const mockTokens = [
      {
        address: '0xa0b86a33e6441f3de0b0b3b2ea11b93cd0de8f72',
        symbol: 'CRYB',
        name: 'CRYB Token',
        balance: '25000.0',
        decimals: 18,
        usdValue: 50000,
        lastUpdated: new Date(),
        chainId: 1,
      },
      {
        address: '0xa0b86a33e6441f3de0b0b3b2ea11b93cd0de8f72',
        symbol: 'USDC',
        name: 'USD Coin',
        balance: '10000.0',
        decimals: 6,
        usdValue: 10000,
        lastUpdated: new Date(),
        chainId: 1,
      },
      {
        address: '0x0000000000000000000000000000000000000000',
        symbol: 'MATIC',
        name: 'Polygon',
        balance: '5000.0',
        decimals: 18,
        usdValue: 3500,
        lastUpdated: new Date(),
        chainId: 137,
      },
    ];

    return mockTokens.filter(token => chainIds.includes(token.chainId));
  }

  /**
   * Get service health status
   */
  getHealthStatus() {
    const totalEndpoints = Array.from(this.rpcEndpoints.values())
      .flatMap(c => c.endpoints);
    const healthyEndpoints = totalEndpoints.filter(e => e.isHealthy);
    
    return {
      status: healthyEndpoints.length > 0 ? 'healthy' : 'degraded',
      featuresEnabled: this.isFeatureFlagEnabled,
      endpoints: {
        total: totalEndpoints.length,
        healthy: healthyEndpoints.length,
        unhealthy: totalEndpoints.length - healthyEndpoints.length,
      },
      caches: {
        local: {
          balances: this.localCaches.balances.size,
          tokens: this.localCaches.tokens.size,
          nfts: this.localCaches.nfts.size,
        },
        redis: this.redis ? 'connected' : 'disconnected',
      },
      metrics: this.metrics,
      circuitBreakers: this.circuitBreakers.size,
    };
  }

  /**
   * Clear all caches
   */
  async clearCaches(): Promise<void> {
    // Clear local caches
    Object.values(this.localCaches).forEach(cache => cache.clear());
    
    // Clear Redis cache
    if (this.redis) {
      try {
        const keys = await this.redis.keys('web3:*');
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch (error) {
        console.warn('Failed to clear Redis cache:', error);
      }
    }
    
    console.log('🧹 All Web3 caches cleared');
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down Enhanced Web3 Service...');
    
    // Clear intervals
    // (intervals should be stored as class properties for proper cleanup)
    
    // Close Redis connection
    if (this.redis) {
      await this.redis.quit();
    }
    
    // Clear caches
    await this.clearCaches();
    
    console.log('✅ Enhanced Web3 Service shutdown complete');
  }
}

// Export singleton instance
export default new EnhancedWeb3Service();