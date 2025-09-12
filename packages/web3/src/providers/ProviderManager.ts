import { ethers } from 'ethers';

export interface ProviderConfig {
  name: string;
  url: string;
  apiKey?: string;
  priority: number;
  maxRetries: number;
  timeout: number;
}

export interface ChainConfig {
  chainId: number;
  name: string;
  providers: ProviderConfig[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorer: string;
}

export class ProviderManager {
  private static instance: ProviderManager;
  private chains: Map<string, ChainConfig> = new Map();
  private providerCache: Map<string, ethers.Provider> = new Map();
  private providerHealth: Map<string, { isHealthy: boolean; lastCheck: number }> = new Map();
  
  private constructor() {
    this.initializeChains();
  }

  public static getInstance(): ProviderManager {
    if (!ProviderManager.instance) {
      ProviderManager.instance = new ProviderManager();
    }
    return ProviderManager.instance;
  }

  private initializeChains(): void {
    const chains: { [key: string]: ChainConfig } = {
      ethereum: {
        chainId: 1,
        name: 'Ethereum Mainnet',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        blockExplorer: 'https://etherscan.io',
        providers: [
          {
            name: 'alchemy',
            url: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
            apiKey: process.env.ALCHEMY_API_KEY,
            priority: 1,
            maxRetries: 3,
            timeout: 10000,
          },
          {
            name: 'infura',
            url: `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
            apiKey: process.env.INFURA_PROJECT_ID,
            priority: 2,
            maxRetries: 3,
            timeout: 10000,
          },
          {
            name: 'ankr',
            url: 'https://rpc.ankr.com/eth',
            priority: 3,
            maxRetries: 2,
            timeout: 15000,
          },
          {
            name: 'public',
            url: 'https://cloudflare-eth.com',
            priority: 4,
            maxRetries: 1,
            timeout: 20000,
          },
        ],
      },
      polygon: {
        chainId: 137,
        name: 'Polygon Mainnet',
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
        blockExplorer: 'https://polygonscan.com',
        providers: [
          {
            name: 'alchemy',
            url: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
            apiKey: process.env.ALCHEMY_API_KEY,
            priority: 1,
            maxRetries: 3,
            timeout: 10000,
          },
          {
            name: 'infura',
            url: `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
            apiKey: process.env.INFURA_PROJECT_ID,
            priority: 2,
            maxRetries: 3,
            timeout: 10000,
          },
          {
            name: 'ankr',
            url: 'https://rpc.ankr.com/polygon',
            priority: 3,
            maxRetries: 2,
            timeout: 15000,
          },
        ],
      },
      arbitrum: {
        chainId: 42161,
        name: 'Arbitrum One',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        blockExplorer: 'https://arbiscan.io',
        providers: [
          {
            name: 'alchemy',
            url: `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
            apiKey: process.env.ALCHEMY_API_KEY,
            priority: 1,
            maxRetries: 3,
            timeout: 10000,
          },
          {
            name: 'infura',
            url: `https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
            apiKey: process.env.INFURA_PROJECT_ID,
            priority: 2,
            maxRetries: 3,
            timeout: 10000,
          },
          {
            name: 'ankr',
            url: 'https://rpc.ankr.com/arbitrum',
            priority: 3,
            maxRetries: 2,
            timeout: 15000,
          },
        ],
      },
      optimism: {
        chainId: 10,
        name: 'Optimism',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        blockExplorer: 'https://optimistic.etherscan.io',
        providers: [
          {
            name: 'alchemy',
            url: `https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
            apiKey: process.env.ALCHEMY_API_KEY,
            priority: 1,
            maxRetries: 3,
            timeout: 10000,
          },
          {
            name: 'infura',
            url: `https://optimism-mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
            apiKey: process.env.INFURA_PROJECT_ID,
            priority: 2,
            maxRetries: 3,
            timeout: 10000,
          },
          {
            name: 'ankr',
            url: 'https://rpc.ankr.com/optimism',
            priority: 3,
            maxRetries: 2,
            timeout: 15000,
          },
        ],
      },
      bsc: {
        chainId: 56,
        name: 'Binance Smart Chain',
        nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
        blockExplorer: 'https://bscscan.com',
        providers: [
          {
            name: 'ankr',
            url: 'https://rpc.ankr.com/bsc',
            priority: 1,
            maxRetries: 3,
            timeout: 10000,
          },
          {
            name: 'binance',
            url: 'https://bsc-dataseed1.binance.org',
            priority: 2,
            maxRetries: 2,
            timeout: 15000,
          },
        ],
      },
    };

    for (const [key, config] of Object.entries(chains)) {
      this.chains.set(key, config);
    }
  }

  /**
   * Get a provider for the specified chain with automatic failover
   */
  public async getProvider(chainName: string): Promise<ethers.Provider> {
    const chainConfig = this.chains.get(chainName.toLowerCase());
    if (!chainConfig) {
      throw new Error(`Unsupported chain: ${chainName}`);
    }

    // Try to get cached provider first
    const cacheKey = `${chainName}_provider`;
    const cachedProvider = this.providerCache.get(cacheKey);
    if (cachedProvider) {
      const isHealthy = await this.checkProviderHealth(cachedProvider, chainName);
      if (isHealthy) {
        return cachedProvider;
      } else {
        this.providerCache.delete(cacheKey);
      }
    }

    // Sort providers by priority and health
    const sortedProviders = chainConfig.providers
      .filter(p => this.hasRequiredApiKey(p))
      .sort((a, b) => a.priority - b.priority);

    for (const providerConfig of sortedProviders) {
      try {
        const provider = await this.createProvider(providerConfig, chainConfig);
        const isHealthy = await this.checkProviderHealth(provider, chainName);
        
        if (isHealthy) {
          this.providerCache.set(cacheKey, provider);
          return provider;
        }
      } catch (error) {
        console.warn(`Failed to create provider ${providerConfig.name} for ${chainName}:`, error);
        continue;
      }
    }

    throw new Error(`No healthy providers available for chain: ${chainName}`);
  }

  /**
   * Get multiple providers for redundancy
   */
  public async getMultipleProviders(chainName: string, count: number = 2): Promise<ethers.Provider[]> {
    const chainConfig = this.chains.get(chainName.toLowerCase());
    if (!chainConfig) {
      throw new Error(`Unsupported chain: ${chainName}`);
    }

    const providers: ethers.Provider[] = [];
    const sortedProviders = chainConfig.providers
      .filter(p => this.hasRequiredApiKey(p))
      .sort((a, b) => a.priority - b.priority);

    for (const providerConfig of sortedProviders) {
      if (providers.length >= count) break;

      try {
        const provider = await this.createProvider(providerConfig, chainConfig);
        const isHealthy = await this.checkProviderHealth(provider, chainName);
        
        if (isHealthy) {
          providers.push(provider);
        }
      } catch (error) {
        console.warn(`Failed to create provider ${providerConfig.name} for ${chainName}:`, error);
        continue;
      }
    }

    if (providers.length === 0) {
      throw new Error(`No healthy providers available for chain: ${chainName}`);
    }

    return providers;
  }

  /**
   * Execute a function with automatic provider failover
   */
  public async executeWithFailover<T>(
    chainName: string,
    operation: (provider: ethers.Provider) => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    const chainConfig = this.chains.get(chainName.toLowerCase());
    if (!chainConfig) {
      throw new Error(`Unsupported chain: ${chainName}`);
    }

    const sortedProviders = chainConfig.providers
      .filter(p => this.hasRequiredApiKey(p))
      .sort((a, b) => a.priority - b.priority);

    let lastError: Error | null = null;

    for (const providerConfig of sortedProviders) {
      let attempts = 0;
      
      while (attempts < Math.min(maxRetries, providerConfig.maxRetries)) {
        try {
          const provider = await this.createProvider(providerConfig, chainConfig);
          const result = await Promise.race([
            operation(provider),
            this.timeout(providerConfig.timeout, `Provider ${providerConfig.name} timeout`)
          ]);
          
          return result;
        } catch (error) {
          lastError = error as Error;
          attempts++;
          
          console.warn(
            `Provider ${providerConfig.name} attempt ${attempts} failed:`,
            error instanceof Error ? error.message : 'Unknown error'
          );
          
          if (attempts < Math.min(maxRetries, providerConfig.maxRetries)) {
            await this.delay(Math.pow(2, attempts) * 1000); // Exponential backoff
          }
        }
      }
    }

    throw new Error(
      `All providers failed for chain ${chainName}. Last error: ${
        lastError?.message || 'Unknown error'
      }`
    );
  }

  /**
   * Get chain configuration
   */
  public getChainConfig(chainName: string): ChainConfig | null {
    return this.chains.get(chainName.toLowerCase()) || null;
  }

  /**
   * Get all supported chains
   */
  public getSupportedChains(): string[] {
    return Array.from(this.chains.keys());
  }

  /**
   * Check if a provider has required API keys
   */
  private hasRequiredApiKey(providerConfig: ProviderConfig): boolean {
    if (!providerConfig.apiKey) {
      return true; // No API key required
    }
    
    return Boolean(providerConfig.apiKey && providerConfig.apiKey !== 'undefined');
  }

  /**
   * Create a provider instance
   */
  private async createProvider(
    providerConfig: ProviderConfig,
    chainConfig: ChainConfig
  ): Promise<ethers.Provider> {
    const provider = new ethers.JsonRpcProvider(providerConfig.url, {
      chainId: chainConfig.chainId,
      name: chainConfig.name,
    });

    // Set custom polling interval
    provider.pollingInterval = 12000; // 12 seconds

    return provider;
  }

  /**
   * Check provider health
   */
  private async checkProviderHealth(provider: ethers.Provider, chainName: string): Promise<boolean> {
    const healthKey = `${chainName}_${provider._getConnection().url}`;
    const cachedHealth = this.providerHealth.get(healthKey);
    
    // Use cached health check if recent (5 minutes)
    if (cachedHealth && Date.now() - cachedHealth.lastCheck < 300000) {
      return cachedHealth.isHealthy;
    }

    try {
      // Simple health check - get latest block number
      const blockNumber = await Promise.race([
        provider.getBlockNumber(),
        this.timeout(5000, 'Health check timeout')
      ]);
      
      const isHealthy = typeof blockNumber === 'number' && blockNumber > 0;
      
      this.providerHealth.set(healthKey, {
        isHealthy,
        lastCheck: Date.now(),
      });
      
      return isHealthy;
    } catch (error) {
      console.warn(`Provider health check failed for ${chainName}:`, error);
      
      this.providerHealth.set(healthKey, {
        isHealthy: false,
        lastCheck: Date.now(),
      });
      
      return false;
    }
  }

  /**
   * Create a timeout promise
   */
  private timeout<T>(ms: number, message: string): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    });
  }

  /**
   * Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear provider cache
   */
  public clearCache(): void {
    this.providerCache.clear();
    this.providerHealth.clear();
  }

  /**
   * Get provider health status
   */
  public getProviderHealth(): Map<string, { isHealthy: boolean; lastCheck: number }> {
    return new Map(this.providerHealth);
  }
}

export const providerManager = ProviderManager.getInstance();