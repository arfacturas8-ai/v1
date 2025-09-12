import { PublicClient } from 'viem';
import { connectionManager } from './ConnectionManager';

export interface NftContract {
  address: string;
  chainId: number;
  standard: 'ERC721' | 'ERC1155';
  name?: string;
  symbol?: string;
}

export interface NftOwnership {
  contractAddress: string;
  tokenId: string;
  owner: string;
  balance: number;
  metadata?: NftMetadata;
  lastVerified: number;
}

export interface NftMetadata {
  name?: string;
  description?: string;
  image?: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: any;
    display_type?: string;
  }>;
  animation_url?: string;
  background_color?: string;
}

export interface TokenGateConfig {
  id: string;
  name: string;
  description?: string;
  requirements: TokenGateRequirement[];
  chainIds: number[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface TokenGateRequirement {
  type: 'nft_ownership' | 'token_balance' | 'custom_contract';
  contractAddress: string;
  chainId: number;
  minBalance?: number;
  tokenIds?: string[];
  attributes?: Array<{
    trait_type: string;
    value: any;
    operator?: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
  }>;
}

export interface VerificationResult {
  success: boolean;
  address: string;
  requirements: Array<{
    requirement: TokenGateRequirement;
    satisfied: boolean;
    details?: {
      ownedTokens?: NftOwnership[];
      balance?: number;
      error?: string;
    };
  }>;
  overallSatisfied: boolean;
  timestamp: number;
  chainId: number;
}

export interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  maxRequestsPerDay: number;
  cooldownPeriod: number;
}

export interface CacheConfig {
  ttl: number;
  maxSize: number;
  staleWhileRevalidate: number;
}

interface RequestRecord {
  timestamp: number;
  count: number;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
  isStale: boolean;
}

export class CrashSafeNftVerificationService {
  private rateLimitMap = new Map<string, RequestRecord[]>();
  private cache = new Map<string, CacheEntry>();
  private verificationQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private logger = console;

  private readonly rateLimitConfig: RateLimitConfig = {
    maxRequestsPerMinute: 30,
    maxRequestsPerHour: 500,
    maxRequestsPerDay: 2000,
    cooldownPeriod: 60000 // 1 minute
  };

  private readonly cacheConfig: CacheConfig = {
    ttl: 300000, // 5 minutes
    maxSize: 1000,
    staleWhileRevalidate: 600000 // 10 minutes
  };

  // Standard contract interfaces
  private readonly ERC721_INTERFACE = [
    'function balanceOf(address owner) view returns (uint256)',
    'function ownerOf(uint256 tokenId) view returns (address)',
    'function tokenURI(uint256 tokenId) view returns (string)',
    'function supportsInterface(bytes4 interfaceId) view returns (bool)'
  ];

  private readonly ERC1155_INTERFACE = [
    'function balanceOf(address account, uint256 id) view returns (uint256)',
    'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])',
    'function uri(uint256 id) view returns (string)',
    'function supportsInterface(bytes4 interfaceId) view returns (bool)'
  ];

  constructor(
    rateLimitConfig?: Partial<RateLimitConfig>,
    cacheConfig?: Partial<CacheConfig>
  ) {
    this.rateLimitConfig = { ...this.rateLimitConfig, ...rateLimitConfig };
    this.cacheConfig = { ...this.cacheConfig, ...cacheConfig };
    
    this.startCleanupTimer();
  }

  public async verifyNftOwnership(
    contractAddress: string,
    tokenId: string,
    ownerAddress: string,
    chainId: number,
    options?: {
      bypassCache?: boolean;
      includeMetadata?: boolean;
      retries?: number;
    }
  ): Promise<NftOwnership | null> {
    const cacheKey = `nft_ownership_${contractAddress}_${tokenId}_${ownerAddress}_${chainId}`;
    
    // Check rate limiting
    if (!this.checkRateLimit(ownerAddress)) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    // Check cache first (unless bypassed)
    if (!options?.bypassCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached as NftOwnership;
      }
    }

    try {
      const result = await this.executeWithRetry(async () => {
        return this.performNftOwnershipCheck(
          contractAddress,
          tokenId,
          ownerAddress,
          chainId,
          options?.includeMetadata || false
        );
      }, options?.retries || 3);

      if (result) {
        this.setCache(cacheKey, result);
      }

      return result;
    } catch (error: any) {
      this.logger.error(`NFT ownership verification failed: ${error.message}`, {
        contractAddress,
        tokenId,
        ownerAddress,
        chainId,
        error
      });
      return null;
    }
  }

  public async verifyTokenGateAccess(
    config: TokenGateConfig,
    userAddress: string,
    options?: {
      bypassCache?: boolean;
      includeDetails?: boolean;
    }
  ): Promise<VerificationResult> {
    const cacheKey = `token_gate_${config.id}_${userAddress}`;
    
    // Check rate limiting
    if (!this.checkRateLimit(userAddress)) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    // Check cache first
    if (!options?.bypassCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached as VerificationResult;
      }
    }

    const result: VerificationResult = {
      success: false,
      address: userAddress.toLowerCase(),
      requirements: [],
      overallSatisfied: false,
      timestamp: Date.now(),
      chainId: 0
    };

    try {
      const requirementChecks = config.requirements.map(async (requirement) => {
        try {
          const satisfied = await this.checkRequirement(requirement, userAddress, options?.includeDetails);
          return {
            requirement,
            satisfied: satisfied.success,
            details: satisfied.details
          };
        } catch (error: any) {
          this.logger.warn(`Requirement check failed:`, { requirement, error: error.message });
          return {
            requirement,
            satisfied: false,
            details: { error: error.message }
          };
        }
      });

      result.requirements = await Promise.allSettled(requirementChecks).then(results =>
        results.map(result => 
          result.status === 'fulfilled' ? result.value : {
            requirement: {} as TokenGateRequirement,
            satisfied: false,
            details: { error: 'Requirement check failed' }
          }
        )
      );

      result.overallSatisfied = result.requirements.every(req => req.satisfied);
      result.success = true;

      // Cache the result
      this.setCache(cacheKey, result);

      return result;
    } catch (error: any) {
      this.logger.error(`Token gate verification failed:`, {
        configId: config.id,
        userAddress,
        error: error.message
      });

      result.success = false;
      return result;
    }
  }

  private async performNftOwnershipCheck(
    contractAddress: string,
    tokenId: string,
    ownerAddress: string,
    chainId: number,
    includeMetadata: boolean
  ): Promise<NftOwnership | null> {
    const publicClient = await connectionManager.getPublicClient(chainId);
    
    // First, determine the contract standard
    const standard = await this.detectContractStandard(contractAddress, publicClient);
    
    if (!standard) {
      throw new Error(`Unable to determine contract standard for ${contractAddress}`);
    }

    let balance = 0;
    let actualOwner = '';

    try {
      if (standard === 'ERC721') {
        // Check ERC721 ownership
        const owner = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: this.ERC721_INTERFACE,
          functionName: 'ownerOf',
          args: [BigInt(tokenId)]
        }) as string;

        actualOwner = owner.toLowerCase();
        balance = actualOwner === ownerAddress.toLowerCase() ? 1 : 0;
      } else if (standard === 'ERC1155') {
        // Check ERC1155 balance
        const tokenBalance = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: this.ERC1155_INTERFACE,
          functionName: 'balanceOf',
          args: [ownerAddress as `0x${string}`, BigInt(tokenId)]
        }) as bigint;

        balance = Number(tokenBalance);
        actualOwner = balance > 0 ? ownerAddress.toLowerCase() : '';
      }

      if (balance === 0) {
        return null;
      }

      const ownership: NftOwnership = {
        contractAddress: contractAddress.toLowerCase(),
        tokenId,
        owner: actualOwner,
        balance,
        lastVerified: Date.now()
      };

      // Fetch metadata if requested
      if (includeMetadata) {
        try {
          ownership.metadata = await this.fetchTokenMetadata(
            contractAddress,
            tokenId,
            standard,
            publicClient
          );
        } catch (metadataError) {
          this.logger.warn(`Failed to fetch metadata for ${contractAddress}:${tokenId}`, metadataError);
        }
      }

      return ownership;
    } catch (error: any) {
      if (error.message.includes('ERC721: invalid token ID') || 
          error.message.includes('ERC721: owner query for nonexistent token')) {
        return null; // Token doesn't exist
      }
      throw error;
    }
  }

  private async checkRequirement(
    requirement: TokenGateRequirement,
    userAddress: string,
    includeDetails = false
  ): Promise<{ success: boolean; details?: any }> {
    switch (requirement.type) {
      case 'nft_ownership':
        return this.checkNftOwnershipRequirement(requirement, userAddress, includeDetails);
      
      case 'token_balance':
        return this.checkTokenBalanceRequirement(requirement, userAddress, includeDetails);
      
      case 'custom_contract':
        return this.checkCustomContractRequirement(requirement, userAddress, includeDetails);
      
      default:
        return { success: false, details: { error: 'Unknown requirement type' } };
    }
  }

  private async checkNftOwnershipRequirement(
    requirement: TokenGateRequirement,
    userAddress: string,
    includeDetails: boolean
  ): Promise<{ success: boolean; details?: any }> {
    try {
      const publicClient = await connectionManager.getPublicClient(requirement.chainId);
      const standard = await this.detectContractStandard(requirement.contractAddress, publicClient);
      
      if (!standard) {
        return { success: false, details: { error: 'Invalid contract' } };
      }

      let ownedTokens: NftOwnership[] = [];
      let totalBalance = 0;

      if (requirement.tokenIds && requirement.tokenIds.length > 0) {
        // Check specific token IDs
        for (const tokenId of requirement.tokenIds) {
          const ownership = await this.performNftOwnershipCheck(
            requirement.contractAddress,
            tokenId,
            userAddress,
            requirement.chainId,
            includeDetails
          );
          
          if (ownership && ownership.balance > 0) {
            ownedTokens.push(ownership);
            totalBalance += ownership.balance;
          }
        }
      } else {
        // Check general ownership (this would need more sophisticated logic for large collections)
        if (standard === 'ERC721') {
          const balance = await publicClient.readContract({
            address: requirement.contractAddress as `0x${string}`,
            abi: this.ERC721_INTERFACE,
            functionName: 'balanceOf',
            args: [userAddress as `0x${string}`]
          }) as bigint;
          
          totalBalance = Number(balance);
        }
      }

      const minBalance = requirement.minBalance || 1;
      const satisfied = totalBalance >= minBalance;

      // Check attribute requirements if specified
      if (satisfied && requirement.attributes && requirement.attributes.length > 0) {
        return this.checkAttributeRequirements(ownedTokens, requirement.attributes);
      }

      return {
        success: satisfied,
        details: includeDetails ? {
          ownedTokens,
          totalBalance,
          requiredBalance: minBalance
        } : undefined
      };
    } catch (error: any) {
      return {
        success: false,
        details: { error: error.message }
      };
    }
  }

  private async checkTokenBalanceRequirement(
    requirement: TokenGateRequirement,
    userAddress: string,
    includeDetails: boolean
  ): Promise<{ success: boolean; details?: any }> {
    try {
      const publicClient = await connectionManager.getPublicClient(requirement.chainId);
      
      // ERC20 balance check
      const ERC20_ABI = [
        'function balanceOf(address account) view returns (uint256)',
        'function decimals() view returns (uint8)'
      ];

      const [balance, decimals] = await Promise.all([
        publicClient.readContract({
          address: requirement.contractAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [userAddress as `0x${string}`]
        }) as Promise<bigint>,
        publicClient.readContract({
          address: requirement.contractAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'decimals'
        }) as Promise<number>
      ]);

      const actualBalance = Number(balance) / Math.pow(10, decimals);
      const requiredBalance = requirement.minBalance || 0;
      const satisfied = actualBalance >= requiredBalance;

      return {
        success: satisfied,
        details: includeDetails ? {
          balance: actualBalance,
          requiredBalance
        } : undefined
      };
    } catch (error: any) {
      return {
        success: false,
        details: { error: error.message }
      };
    }
  }

  private async checkCustomContractRequirement(
    requirement: TokenGateRequirement,
    userAddress: string,
    includeDetails: boolean
  ): Promise<{ success: boolean; details?: any }> {
    // This would implement custom contract logic
    // For now, return a placeholder
    return {
      success: false,
      details: { error: 'Custom contract requirements not implemented' }
    };
  }

  private checkAttributeRequirements(
    ownedTokens: NftOwnership[],
    attributes: Array<{
      trait_type: string;
      value: any;
      operator?: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
    }>
  ): { success: boolean; details?: any } {
    for (const token of ownedTokens) {
      if (!token.metadata?.attributes) continue;

      const satisfiesAll = attributes.every(requirement => {
        const tokenAttribute = token.metadata!.attributes!.find(
          attr => attr.trait_type === requirement.trait_type
        );

        if (!tokenAttribute) return false;

        const operator = requirement.operator || 'eq';
        const tokenValue = tokenAttribute.value;
        const requiredValue = requirement.value;

        switch (operator) {
          case 'eq':
            return tokenValue === requiredValue;
          case 'gt':
            return Number(tokenValue) > Number(requiredValue);
          case 'lt':
            return Number(tokenValue) < Number(requiredValue);
          case 'gte':
            return Number(tokenValue) >= Number(requiredValue);
          case 'lte':
            return Number(tokenValue) <= Number(requiredValue);
          case 'contains':
            return String(tokenValue).toLowerCase().includes(String(requiredValue).toLowerCase());
          default:
            return false;
        }
      });

      if (satisfiesAll) {
        return { success: true, details: { matchingToken: token } };
      }
    }

    return { success: false, details: { error: 'No tokens match attribute requirements' } };
  }

  private async detectContractStandard(
    contractAddress: string,
    publicClient: PublicClient
  ): Promise<'ERC721' | 'ERC1155' | null> {
    try {
      const INTERFACE_IDS = {
        ERC721: '0x80ac58cd',
        ERC1155: '0xd9b67a26'
      };

      const SUPPORTS_INTERFACE_ABI = [
        'function supportsInterface(bytes4 interfaceId) view returns (bool)'
      ];

      // Check ERC721
      try {
        const supportsERC721 = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: SUPPORTS_INTERFACE_ABI,
          functionName: 'supportsInterface',
          args: [INTERFACE_IDS.ERC721]
        }) as boolean;

        if (supportsERC721) return 'ERC721';
      } catch (e) {
        // Contract might not implement supportsInterface
      }

      // Check ERC1155
      try {
        const supportsERC1155 = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: SUPPORTS_INTERFACE_ABI,
          functionName: 'supportsInterface',
          args: [INTERFACE_IDS.ERC1155]
        }) as boolean;

        if (supportsERC1155) return 'ERC1155';
      } catch (e) {
        // Contract might not implement supportsInterface
      }

      // Fallback: try calling ERC721 methods
      try {
        await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: this.ERC721_INTERFACE,
          functionName: 'balanceOf',
          args: ['0x0000000000000000000000000000000000000000']
        });
        return 'ERC721';
      } catch (e) {
        // Not ERC721
      }

      // Fallback: try calling ERC1155 methods
      try {
        await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: this.ERC1155_INTERFACE,
          functionName: 'balanceOf',
          args: ['0x0000000000000000000000000000000000000000', BigInt(1)]
        });
        return 'ERC1155';
      } catch (e) {
        // Not ERC1155
      }

      return null;
    } catch (error) {
      this.logger.warn(`Failed to detect contract standard for ${contractAddress}:`, error);
      return null;
    }
  }

  private async fetchTokenMetadata(
    contractAddress: string,
    tokenId: string,
    standard: 'ERC721' | 'ERC1155',
    publicClient: PublicClient
  ): Promise<NftMetadata | undefined> {
    try {
      let tokenURI = '';

      if (standard === 'ERC721') {
        tokenURI = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: this.ERC721_INTERFACE,
          functionName: 'tokenURI',
          args: [BigInt(tokenId)]
        }) as string;
      } else if (standard === 'ERC1155') {
        tokenURI = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: this.ERC1155_INTERFACE,
          functionName: 'uri',
          args: [BigInt(tokenId)]
        }) as string;

        // Replace {id} placeholder in ERC1155 URIs
        if (tokenURI.includes('{id}')) {
          const hexId = BigInt(tokenId).toString(16).padStart(64, '0');
          tokenURI = tokenURI.replace('{id}', hexId);
        }
      }

      if (!tokenURI) return undefined;

      // Handle IPFS URIs
      if (tokenURI.startsWith('ipfs://')) {
        tokenURI = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
      }

      // Fetch metadata from URI with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(tokenURI, { 
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const metadata = await response.json() as NftMetadata;
      
      // Process image URL if it's IPFS
      if (metadata.image?.startsWith('ipfs://')) {
        metadata.image = metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
      }

      return metadata;
    } catch (error) {
      this.logger.warn(`Failed to fetch metadata for ${contractAddress}:${tokenId}`, error);
      return undefined;
    }
  }

  private checkRateLimit(address: string): boolean {
    const now = Date.now();
    const key = address.toLowerCase();
    
    if (!this.rateLimitMap.has(key)) {
      this.rateLimitMap.set(key, []);
    }

    const requests = this.rateLimitMap.get(key)!;
    
    // Remove old requests outside the time windows
    const oneMinuteAgo = now - 60000;
    const oneHourAgo = now - 3600000;
    const oneDayAgo = now - 86400000;
    
    const validRequests = requests.filter(req => req.timestamp > oneDayAgo);
    this.rateLimitMap.set(key, validRequests);
    
    // Check rate limits
    const requestsLastMinute = validRequests.filter(req => req.timestamp > oneMinuteAgo).length;
    const requestsLastHour = validRequests.filter(req => req.timestamp > oneHourAgo).length;
    const requestsLastDay = validRequests.length;
    
    if (requestsLastMinute >= this.rateLimitConfig.maxRequestsPerMinute ||
        requestsLastHour >= this.rateLimitConfig.maxRequestsPerHour ||
        requestsLastDay >= this.rateLimitConfig.maxRequestsPerDay) {
      return false;
    }

    // Add current request
    validRequests.push({ timestamp: now, count: 1 });
    return true;
  }

  private getFromCache(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    
    if (now > entry.expiresAt) {
      // Check if we can serve stale content while revalidating
      if (now - entry.expiresAt < this.cacheConfig.staleWhileRevalidate) {
        entry.isStale = true;
        return entry.data;
      }
      
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache(key: string, data: any): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.cacheConfig.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + this.cacheConfig.ttl,
      isStale: false
    });
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        if (attempt < maxRetries - 1) {
          const delay = 1000 * Math.pow(2, attempt); // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupCache();
      this.cleanupRateLimits();
    }, 300000); // Clean up every 5 minutes
  }

  private cleanupCache(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt + this.cacheConfig.staleWhileRevalidate) {
        this.cache.delete(key);
      }
    }
  }

  private cleanupRateLimits(): void {
    const oneDayAgo = Date.now() - 86400000;
    
    for (const [key, requests] of this.rateLimitMap) {
      const validRequests = requests.filter(req => req.timestamp > oneDayAgo);
      
      if (validRequests.length === 0) {
        this.rateLimitMap.delete(key);
      } else {
        this.rateLimitMap.set(key, validRequests);
      }
    }
  }

  public async batchVerifyOwnership(
    requests: Array<{
      contractAddress: string;
      tokenId: string;
      ownerAddress: string;
      chainId: number;
    }>,
    options?: {
      includeMetadata?: boolean;
      maxConcurrency?: number;
    }
  ): Promise<(NftOwnership | null)[]> {
    const maxConcurrency = options?.maxConcurrency || 5;
    const results: (NftOwnership | null)[] = [];
    
    // Process in batches to avoid overwhelming the RPC
    for (let i = 0; i < requests.length; i += maxConcurrency) {
      const batch = requests.slice(i, i + maxConcurrency);
      
      const batchResults = await Promise.allSettled(
        batch.map(req =>
          this.verifyNftOwnership(
            req.contractAddress,
            req.tokenId,
            req.ownerAddress,
            req.chainId,
            { includeMetadata: options?.includeMetadata }
          )
        )
      );

      results.push(...batchResults.map(result =>
        result.status === 'fulfilled' ? result.value : null
      ));
    }

    return results;
  }

  public getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    staleSearved: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.cacheConfig.maxSize,
      hitRate: 0, // Would need to track hits/misses
      staleSearved: 0 // Would need to track stale serves
    };
  }

  public clearCache(): void {
    this.cache.clear();
  }

  public cleanup(): void {
    this.cache.clear();
    this.rateLimitMap.clear();
  }
}

// Export singleton instance
export const nftVerificationService = new CrashSafeNftVerificationService();