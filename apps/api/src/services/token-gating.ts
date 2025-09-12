import { prisma } from "@cryb/database";
import { ethers } from "ethers";
import { nftService } from "./nft";
import { providerManager } from "../../../../packages/web3/src/providers/ProviderManager";

export interface TokenGatingRequirement {
  type: 'TOKEN_BALANCE' | 'NFT_OWNERSHIP' | 'COMBINED' | 'CUSTOM';
  tokens?: Array<{
    address: string;
    symbol: string;
    name: string;
    chain: string;
    minAmount: string; // in wei
  }>;
  nfts?: Array<{
    contractAddress: string;
    minTokens: number;
    specificTokenIds?: string[];
  }>;
  customLogic?: string; // JSON string for custom requirements
}

export interface TokenGatingResult {
  hasAccess: boolean;
  reason?: string;
  requirements: {
    tokens?: Array<{
      symbol: string;
      required: string;
      current: string;
      satisfied: boolean;
    }>;
    nfts?: Array<{
      collection: string;
      required: number;
      current: number;
      satisfied: boolean;
    }>;
  };
}

export class TokenGatingService {
  private readonly ERC20_ABI = [
    "function balanceOf(address owner) external view returns (uint256)",
    "function decimals() external view returns (uint8)",
    "function symbol() external view returns (string)",
    "function name() external view returns (string)",
  ];

  private async getProvider(chain: string = 'ethereum'): Promise<ethers.Provider> {
    try {
      return await providerManager.getProvider(chain);
    } catch (error) {
      console.error(`Failed to get provider for chain ${chain}:`, error);
      throw new Error(`Provider unavailable for chain: ${chain}`);
    }
  }

  /**
   * Create token gating rule
   */
  async createTokenGatingRule(
    data: {
      serverId?: string;
      channelId?: string;
      communityId?: string;
      name: string;
      description?: string;
      requirements: TokenGatingRequirement;
    }
  ) {
    try {
      const rule = await prisma.tokenGatingRule.create({
        data: {
          serverId: data.serverId,
          channelId: data.channelId,
          communityId: data.communityId,
          name: data.name,
          description: data.description,
          ruleType: data.requirements.type,
          isActive: true,
        },
      });

      // Create token requirements
      if (data.requirements.tokens) {
        const tokenRequirements = data.requirements.tokens.map(token => ({
          ruleId: rule.id,
          tokenAddress: token.address.toLowerCase(),
          symbol: token.symbol,
          name: token.name,
          chain: token.chain,
          minAmount: token.minAmount,
        }));

        await prisma.tokenRequirement.createMany({
          data: tokenRequirements,
        });
      }

      // Create NFT requirements
      if (data.requirements.nfts) {
        for (const nftReq of data.requirements.nfts) {
          // Get or create collection
          const collection = await this.getOrCreateNFTCollection(
            nftReq.contractAddress,
            'ethereum' // Default chain for now
          );

          await prisma.nFTRequirement.create({
            data: {
              ruleId: rule.id,
              collectionId: collection.id,
              minTokens: nftReq.minTokens,
              specificTokenIds: nftReq.specificTokenIds || null,
            },
          });
        }
      }

      return await this.getTokenGatingRule(rule.id);
    } catch (error) {
      console.error('Error creating token gating rule:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        data
      });
      
      throw new Error('Failed to create token gating rule');
    }
  }

  /**
   * Get token gating rule by ID
   */
  async getTokenGatingRule(ruleId: string) {
    try {
      const rule = await prisma.tokenGatingRule.findUnique({
        where: { id: ruleId },
        include: {
          tokenRequirements: true,
          nftRequirements: {
            include: {
              collection: true,
            },
          },
        },
      });

      return rule;
    } catch (error) {
      console.error('Error getting token gating rule:', error);
      return null;
    }
  }

  /**
   * Check if user has access based on token gating rules
   */
  async checkAccess(
    userId: string,
    serverId?: string,
    channelId?: string,
    communityId?: string
  ): Promise<TokenGatingResult> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user?.walletAddress) {
        return {
          hasAccess: false,
          reason: 'No wallet connected',
          requirements: {},
        };
      }

      // Get applicable rules
      const rules = await prisma.tokenGatingRule.findMany({
        where: {
          isActive: true,
          OR: [
            { serverId },
            { channelId },
            { communityId },
          ].filter(Boolean),
        },
        include: {
          tokenRequirements: true,
          nftRequirements: {
            include: {
              collection: true,
            },
          },
        },
      });

      if (rules.length === 0) {
        return { hasAccess: true, requirements: {} };
      }

      // Check each rule (user needs to satisfy at least one rule)
      for (const rule of rules) {
        const result = await this.checkRuleAccess(user.walletAddress, rule);
        if (result.hasAccess) {
          return result;
        }
      }

      // If no rules are satisfied, return the last check result for details
      const lastRule = rules[rules.length - 1];
      return await this.checkRuleAccess(user.walletAddress, lastRule);
    } catch (error) {
      console.error('Error checking token gating access:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        serverId,
        channelId,
        communityId
      });
      
      return {
        hasAccess: false,
        reason: 'Failed to verify access',
        requirements: {},
      };
    }
  }

  /**
   * Check access for a specific rule
   */
  private async checkRuleAccess(walletAddress: string, rule: any): Promise<TokenGatingResult> {
    const result: TokenGatingResult = {
      hasAccess: false,
      requirements: {}
    };

    try {
      let tokenRequirementsMet = true;
      let nftRequirementsMet = true;

      // Check token requirements
      if (rule.tokenRequirements?.length > 0) {
        result.requirements.tokens = [];
        
        for (const tokenReq of rule.tokenRequirements) {
          const balance = await this.getTokenBalance(
            tokenReq.tokenAddress,
            walletAddress,
            tokenReq.chain
          );

          const balanceBN = ethers.parseUnits(balance, 18);
          const requiredBN = ethers.parseUnits(tokenReq.minAmount, 0);
          const satisfied = balanceBN >= requiredBN;

          result.requirements.tokens.push({
            symbol: tokenReq.symbol,
            required: ethers.formatEther(requiredBN),
            current: ethers.formatEther(balanceBN),
            satisfied,
          });

          if (!satisfied) {
            tokenRequirementsMet = false;
          }
        }
      }

      // Check NFT requirements
      if (rule.nftRequirements?.length > 0) {
        result.requirements.nfts = [];

        for (const nftReq of rule.nftRequirements) {
          const nftCount = await this.getNFTCount(
            nftReq.collection.contractAddress,
            walletAddress,
            nftReq.collection.chain,
            nftReq.specificTokenIds
          );

          const satisfied = nftCount >= nftReq.minTokens;

          result.requirements.nfts.push({
            collection: nftReq.collection.name,
            required: nftReq.minTokens,
            current: nftCount,
            satisfied,
          });

          if (!satisfied) {
            nftRequirementsMet = false;
          }
        }
      }

      // Determine access based on rule type
      switch (rule.ruleType) {
        case 'TOKEN_BALANCE':
          result.hasAccess = tokenRequirementsMet;
          break;
        case 'NFT_OWNERSHIP':
          result.hasAccess = nftRequirementsMet;
          break;
        case 'COMBINED':
          result.hasAccess = tokenRequirementsMet && nftRequirementsMet;
          break;
        case 'CUSTOM':
          // TODO: Implement custom logic evaluation
          result.hasAccess = false;
          result.reason = 'Custom logic not implemented';
          break;
      }

      if (!result.hasAccess && !result.reason) {
        result.reason = 'Token gating requirements not met';
      }

      return result;
    } catch (error) {
      console.error('Error checking rule access:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ruleId: rule.id,
        walletAddress
      });
      
      return {
        hasAccess: false,
        reason: 'Failed to verify token gating requirements',
        requirements: {}
      };
    }
  }

  /**
   * Get token balance for an address with provider failover
   */
  private async getTokenBalance(
    tokenAddress: string,
    walletAddress: string,
    chain: string = 'ethereum'
  ): Promise<string> {
    try {
      return await providerManager.executeWithFailover(
        chain,
        async (provider) => {
          if (tokenAddress === '0x0000000000000000000000000000000000000000' || 
              tokenAddress.toLowerCase() === 'eth' ||
              tokenAddress.toLowerCase() === 'native') {
            // Native token (ETH, MATIC, etc.)
            const balance = await Promise.race([
              provider.getBalance(walletAddress),
              this.timeout(8000, 'Native balance timeout')
            ]);
            return ethers.formatEther(balance);
          }

          // ERC-20 token
          const contract = new ethers.Contract(tokenAddress, this.ERC20_ABI, provider);
          
          const [balance, decimals] = await Promise.all([
            Promise.race([
              contract.balanceOf(walletAddress),
              this.timeout(8000, 'Token balance timeout')
            ]),
            Promise.race([
              contract.decimals(),
              this.timeout(5000, 'Token decimals timeout')
            ]).catch(() => 18) // Default to 18 if decimals() fails
          ]);

          return ethers.formatUnits(balance, decimals);
        },
        3 // Max retries for balance checks
      );
    } catch (error) {
      console.warn('Error getting token balance:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tokenAddress,
        walletAddress,
        chain
      });
      
      return '0';
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
   * Get NFT count for an address
   */
  private async getNFTCount(
    contractAddress: string,
    walletAddress: string,
    chain: string = 'ethereum',
    specificTokenIds?: string[]
  ): Promise<number> {
    try {
      if (specificTokenIds?.length) {
        // Check ownership of specific token IDs
        let count = 0;
        
        for (const tokenId of specificTokenIds) {
          const ownership = await nftService.verifyNFTOwnership(
            contractAddress,
            tokenId,
            walletAddress,
            chain
          );
          
          if (ownership.isOwner) {
            count++;
          }
        }
        
        return count;
      } else {
        // Count all NFTs from collection (simplified implementation)
        // In production, this would use more efficient methods like Moralis/Alchemy
        const userNfts = await prisma.userNFT.findMany({
          where: {
            user: {
              walletAddress: walletAddress.toLowerCase(),
            },
            nft: {
              collection: {
                contractAddress: contractAddress.toLowerCase(),
                chain,
              },
            },
            verified: true,
          },
        });

        return userNfts.length;
      }
    } catch (error) {
      console.warn('Error getting NFT count:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        contractAddress,
        walletAddress,
        chain
      });
      
      return 0;
    }
  }

  /**
   * Get all token gating rules for a server/channel/community
   */
  async getTokenGatingRules(filters: {
    serverId?: string;
    channelId?: string;
    communityId?: string;
    isActive?: boolean;
  }) {
    try {
      const rules = await prisma.tokenGatingRule.findMany({
        where: {
          serverId: filters.serverId,
          channelId: filters.channelId,
          communityId: filters.communityId,
          isActive: filters.isActive,
        },
        include: {
          tokenRequirements: true,
          nftRequirements: {
            include: {
              collection: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return rules;
    } catch (error) {
      console.error('Error getting token gating rules:', error);
      return [];
    }
  }

  /**
   * Update token gating rule
   */
  async updateTokenGatingRule(
    ruleId: string,
    updates: {
      name?: string;
      description?: string;
      isActive?: boolean;
      requirements?: TokenGatingRequirement;
    }
  ) {
    try {
      // Update base rule
      const rule = await prisma.tokenGatingRule.update({
        where: { id: ruleId },
        data: {
          name: updates.name,
          description: updates.description,
          isActive: updates.isActive,
          ruleType: updates.requirements?.type,
          updatedAt: new Date(),
        },
      });

      // If requirements are updated, recreate them
      if (updates.requirements) {
        // Delete existing requirements
        await Promise.all([
          prisma.tokenRequirement.deleteMany({
            where: { ruleId },
          }),
          prisma.nFTRequirement.deleteMany({
            where: { ruleId },
          }),
        ]);

        // Create new token requirements
        if (updates.requirements.tokens) {
          const tokenRequirements = updates.requirements.tokens.map(token => ({
            ruleId,
            tokenAddress: token.address.toLowerCase(),
            symbol: token.symbol,
            name: token.name,
            chain: token.chain,
            minAmount: token.minAmount,
          }));

          await prisma.tokenRequirement.createMany({
            data: tokenRequirements,
          });
        }

        // Create new NFT requirements
        if (updates.requirements.nfts) {
          for (const nftReq of updates.requirements.nfts) {
            const collection = await this.getOrCreateNFTCollection(
              nftReq.contractAddress,
              'ethereum'
            );

            await prisma.nFTRequirement.create({
              data: {
                ruleId,
                collectionId: collection.id,
                minTokens: nftReq.minTokens,
                specificTokenIds: nftReq.specificTokenIds || null,
              },
            });
          }
        }
      }

      return await this.getTokenGatingRule(ruleId);
    } catch (error) {
      console.error('Error updating token gating rule:', error);
      throw new Error('Failed to update token gating rule');
    }
  }

  /**
   * Delete token gating rule
   */
  async deleteTokenGatingRule(ruleId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Delete related requirements first (cascade should handle this, but being explicit)
      await Promise.all([
        prisma.tokenRequirement.deleteMany({
          where: { ruleId },
        }),
        prisma.nFTRequirement.deleteMany({
          where: { ruleId },
        }),
      ]);

      // Delete the rule
      await prisma.tokenGatingRule.delete({
        where: { id: ruleId },
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting token gating rule:', error);
      return {
        success: false,
        error: 'Failed to delete token gating rule'
      };
    }
  }

  /**
   * Bulk check user access for multiple rules
   */
  async bulkCheckAccess(
    userId: string,
    rules: Array<{
      serverId?: string;
      channelId?: string;
      communityId?: string;
    }>
  ) {
    try {
      const results = await Promise.all(
        rules.map(rule => this.checkAccess(
          userId,
          rule.serverId,
          rule.channelId,
          rule.communityId
        ))
      );

      return results;
    } catch (error) {
      console.error('Error in bulk access check:', error);
      return rules.map(() => ({
        hasAccess: false,
        reason: 'Failed to verify access',
        requirements: {}
      }));
    }
  }

  /**
   * Get or create NFT collection for requirements
   */
  private async getOrCreateNFTCollection(contractAddress: string, chain: string) {
    const normalizedAddress = contractAddress.toLowerCase();
    
    let collection = await prisma.nFTCollection.findUnique({
      where: {
        contractAddress_chain: {
          contractAddress: normalizedAddress,
          chain
        }
      }
    });

    if (!collection) {
      // Create basic collection record
      collection = await prisma.nFTCollection.create({
        data: {
          contractAddress: normalizedAddress,
          name: `Collection ${normalizedAddress.slice(0, 8)}...`,
          symbol: 'UNKNOWN',
          chain,
          verified: false
        }
      });
    }

    return collection;
  }

  /**
   * Get supported tokens for token gating across multiple chains
   */
  getSupportedTokens() {
    return [
      // Ethereum Mainnet
      { 
        address: '0x0000000000000000000000000000000000000000', 
        symbol: 'ETH', 
        name: 'Ethereum', 
        chain: 'ethereum',
        decimals: 18,
        isNative: true
      },
      { 
        address: '0xA0b86991c631F4ED1DC5fCC7E1C2745e8fB9Aea3', 
        symbol: 'USDC', 
        name: 'USD Coin', 
        chain: 'ethereum',
        decimals: 6
      },
      { 
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', 
        symbol: 'USDT', 
        name: 'Tether USD', 
        chain: 'ethereum',
        decimals: 6
      },
      { 
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', 
        symbol: 'DAI', 
        name: 'Dai Stablecoin', 
        chain: 'ethereum',
        decimals: 18
      },
      { 
        address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', 
        symbol: 'UNI', 
        name: 'Uniswap', 
        chain: 'ethereum',
        decimals: 18
      },
      
      // Polygon
      { 
        address: '0x0000000000000000000000000000000000000000', 
        symbol: 'MATIC', 
        name: 'Polygon', 
        chain: 'polygon',
        decimals: 18,
        isNative: true
      },
      { 
        address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', 
        symbol: 'USDC', 
        name: 'USD Coin (PoS)', 
        chain: 'polygon',
        decimals: 6
      },
      { 
        address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', 
        symbol: 'USDT', 
        name: 'Tether USD (PoS)', 
        chain: 'polygon',
        decimals: 6
      },
      
      // Arbitrum
      { 
        address: '0x0000000000000000000000000000000000000000', 
        symbol: 'ETH', 
        name: 'Ethereum', 
        chain: 'arbitrum',
        decimals: 18,
        isNative: true
      },
      { 
        address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', 
        symbol: 'USDC', 
        name: 'USD Coin (Arb1)', 
        chain: 'arbitrum',
        decimals: 6
      },
      
      // Optimism
      { 
        address: '0x0000000000000000000000000000000000000000', 
        symbol: 'ETH', 
        name: 'Ethereum', 
        chain: 'optimism',
        decimals: 18,
        isNative: true
      },
      { 
        address: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', 
        symbol: 'USDC', 
        name: 'USD Coin (Optimism)', 
        chain: 'optimism',
        decimals: 6
      }
    ];
  }
}

export const tokenGatingService = new TokenGatingService();