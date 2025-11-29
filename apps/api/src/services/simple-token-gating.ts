import { prisma } from "@cryb/database";
import { ethers } from "ethers";
import { simpleNftService } from "./simple-nft";

export interface TokenGatingRule {
  id: string;
  name: string;
  description?: string;
  serverId?: string;
  channelId?: string;
  communityId?: string;
  isActive: boolean;
  requirements: TokenGatingRequirements;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenGatingRequirements {
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
}

export interface AccessCheckResult {
  hasAccess: boolean;
  reason?: string;
  details?: {
    passedRequirements: string[];
    failedRequirements: string[];
    userTokens: any[];
    userNFTs: any[];
  };
}

export class SimpleTokenGatingService {
  private getProvider(chainId: number = 1): ethers.JsonRpcProvider {
    const rpcUrls: Record<number, string> = {
      1: process.env.ETHEREUM_RPC_URL || `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
      137: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
      42161: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
      10: process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
      56: process.env.BSC_RPC_URL || 'https://bsc-dataseed1.binance.org'
    };
    
    const rpcUrl = rpcUrls[chainId] || rpcUrls[1];
    return new ethers.JsonRpcProvider(rpcUrl);
  }

  private getChainId(chain: string): number {
    const chainIds: Record<string, number> = {
      ethereum: 1,
      polygon: 137,
      arbitrum: 42161,
      optimism: 10,
      bsc: 56
    };
    return chainIds[chain] || 1;
  }

  async createTokenGatingRule(data: {
    serverId?: string;
    channelId?: string;
    communityId?: string;
    name: string;
    description?: string;
    requirements: TokenGatingRequirements;
  }): Promise<TokenGatingRule> {
    try {
      const rule = await prisma.tokenGatingRule.create({
        data: {
          serverId: data.serverId,
          channelId: data.channelId,
          communityId: data.communityId,
          name: data.name,
          description: data.description,
          isActive: true,
          requirements: data.requirements as any,
        }
      });

      return {
        id: rule.id,
        name: rule.name,
        description: rule.description,
        serverId: rule.serverId,
        channelId: rule.channelId,
        communityId: rule.communityId,
        isActive: rule.isActive,
        requirements: rule.requirements as TokenGatingRequirements,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt
      };
    } catch (error) {
      console.error('Error creating token gating rule:', error);
      throw new Error('Failed to create token gating rule');
    }
  }

  async getTokenGatingRules(filters: {
    serverId?: string;
    channelId?: string;
    communityId?: string;
    isActive?: boolean;
  }): Promise<TokenGatingRule[]> {
    try {
      const rules = await prisma.tokenGatingRule.findMany({
        where: {
          serverId: filters.serverId,
          channelId: filters.channelId,
          communityId: filters.communityId,
          isActive: filters.isActive,
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return rules.map(rule => ({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        serverId: rule.serverId,
        channelId: rule.channelId,
        communityId: rule.communityId,
        isActive: rule.isActive,
        requirements: rule.requirements as TokenGatingRequirements,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt
      }));
    } catch (error) {
      console.error('Error getting token gating rules:', error);
      throw new Error('Failed to get token gating rules');
    }
  }

  async getTokenGatingRule(ruleId: string): Promise<TokenGatingRule | null> {
    try {
      const rule = await prisma.tokenGatingRule.findUnique({
        where: { id: ruleId }
      });

      if (!rule) {
        return null;
      }

      return {
        id: rule.id,
        name: rule.name,
        description: rule.description,
        serverId: rule.serverId,
        channelId: rule.channelId,
        communityId: rule.communityId,
        isActive: rule.isActive,
        requirements: rule.requirements as TokenGatingRequirements,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt
      };
    } catch (error) {
      console.error('Error getting token gating rule:', error);
      return null;
    }
  }

  async updateTokenGatingRule(ruleId: string, data: {
    name?: string;
    description?: string;
    isActive?: boolean;
    requirements?: TokenGatingRequirements;
  }): Promise<TokenGatingRule> {
    try {
      const rule = await prisma.tokenGatingRule.update({
        where: { id: ruleId },
        data: {
          name: data.name,
          description: data.description,
          isActive: data.isActive,
          requirements: data.requirements as any,
          updatedAt: new Date()
        }
      });

      return {
        id: rule.id,
        name: rule.name,
        description: rule.description,
        serverId: rule.serverId,
        channelId: rule.channelId,
        communityId: rule.communityId,
        isActive: rule.isActive,
        requirements: rule.requirements as TokenGatingRequirements,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt
      };
    } catch (error) {
      console.error('Error updating token gating rule:', error);
      throw new Error('Failed to update token gating rule');
    }
  }

  async deleteTokenGatingRule(ruleId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await prisma.tokenGatingRule.delete({
        where: { id: ruleId }
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting token gating rule:', error);
      return { success: false, error: 'Failed to delete token gating rule' };
    }
  }

  async checkAccess(
    userId: string,
    serverId?: string,
    channelId?: string,
    communityId?: string
  ): Promise<AccessCheckResult> {
    try {
      // Get user's wallet address
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user?.walletAddress) {
        return {
          hasAccess: false,
          reason: 'No wallet connected',
          details: {
            passedRequirements: [],
            failedRequirements: ['wallet_connection'],
            userTokens: [],
            userNFTs: []
          }
        };
      }

      // Get applicable token gating rules
      const rules = await this.getTokenGatingRules({
        serverId,
        channelId,
        communityId,
        isActive: true
      });

      if (rules.length === 0) {
        return {
          hasAccess: true,
          reason: 'No token gating rules applied'
        };
      }

      // Check each rule
      const passedRequirements: string[] = [];
      const failedRequirements: string[] = [];
      const userTokens: any[] = [];
      const userNFTs: any[] = [];

      for (const rule of rules) {
        const ruleResult = await this.checkRuleAccess(user.walletAddress, rule);
        
        if (ruleResult.hasAccess) {
          passedRequirements.push(rule.name);
          userTokens.push(...(ruleResult.details?.userTokens || []));
          userNFTs.push(...(ruleResult.details?.userNFTs || []));
        } else {
          failedRequirements.push(rule.name);
        }
      }

      // At least one rule must pass for access
      const hasAccess = passedRequirements.length > 0;

      return {
        hasAccess,
        reason: hasAccess 
          ? `Access granted via ${passedRequirements.join(', ')}`
          : `Access denied - failed requirements: ${failedRequirements.join(', ')}`,
        details: {
          passedRequirements,
          failedRequirements,
          userTokens: this.deduplicateAssets(userTokens),
          userNFTs: this.deduplicateAssets(userNFTs)
        }
      };
    } catch (error) {
      console.error('Error checking access:', error);
      return {
        hasAccess: false,
        reason: 'Access check failed',
        details: {
          passedRequirements: [],
          failedRequirements: ['system_error'],
          userTokens: [],
          userNFTs: []
        }
      };
    }
  }

  private async checkRuleAccess(
    walletAddress: string,
    rule: TokenGatingRule
  ): Promise<AccessCheckResult> {
    const userTokens: any[] = [];
    const userNFTs: any[] = [];
    const passedRequirements: string[] = [];
    const failedRequirements: string[] = [];

    try {
      switch (rule.requirements.type) {
        case 'TOKEN_BALANCE':
          if (rule.requirements.tokens) {
            for (const tokenReq of rule.requirements.tokens) {
              const balance = await this.getTokenBalance(
                walletAddress,
                tokenReq.address,
                tokenReq.chain
              );

              const userBalance = parseFloat(balance.balance);
              const requiredBalance = parseFloat(tokenReq.minAmount);

              if (userBalance >= requiredBalance) {
                passedRequirements.push(`${tokenReq.symbol} >= ${requiredBalance}`);
                userTokens.push({
                  ...tokenReq,
                  userBalance: balance.balance
                });
              } else {
                failedRequirements.push(`${tokenReq.symbol} < ${requiredBalance} (has ${userBalance})`);
              }
            }
          }
          break;

        case 'NFT_OWNERSHIP':
          if (rule.requirements.nfts) {
            for (const nftReq of rule.requirements.nfts) {
              if (nftReq.specificTokenIds) {
                // Check specific token IDs
                let ownedCount = 0;
                for (const tokenId of nftReq.specificTokenIds) {
                  const ownership = await simpleNftService.verifyNFTOwnership(
                    nftReq.contractAddress,
                    tokenId,
                    walletAddress,
                    'ethereum'
                  );

                  if (ownership.isOwner) {
                    ownedCount++;
                    userNFTs.push({
                      contractAddress: nftReq.contractAddress,
                      tokenId,
                      nft: ownership.nft
                    });
                  }
                }

                if (ownedCount >= nftReq.minTokens) {
                  passedRequirements.push(`${nftReq.contractAddress} owns ${ownedCount}/${nftReq.minTokens} specific NFTs`);
                } else {
                  failedRequirements.push(`${nftReq.contractAddress} owns ${ownedCount}/${nftReq.minTokens} specific NFTs`);
                }
              } else {
                // Check general balance (ERC-721 balanceOf)
                const hasNFTs = await this.checkNFTBalance(
                  walletAddress,
                  nftReq.contractAddress,
                  nftReq.minTokens
                );

                if (hasNFTs) {
                  passedRequirements.push(`${nftReq.contractAddress} >= ${nftReq.minTokens} NFTs`);
                  userNFTs.push({
                    contractAddress: nftReq.contractAddress,
                    minTokens: nftReq.minTokens,
                    verified: true
                  });
                } else {
                  failedRequirements.push(`${nftReq.contractAddress} < ${nftReq.minTokens} NFTs`);
                }
              }
            }
          }
          break;

        case 'COMBINED':
          // Must pass both token and NFT requirements
          if (rule.requirements.tokens) {
            const tokenResult = await this.checkRuleAccess(walletAddress, {
              ...rule,
              requirements: { ...rule.requirements, type: 'TOKEN_BALANCE' }
            });
            
            if (tokenResult.hasAccess) {
              passedRequirements.push('token_requirements');
              userTokens.push(...(tokenResult.details?.userTokens || []));
            } else {
              failedRequirements.push('token_requirements');
            }
          }

          if (rule.requirements.nfts) {
            const nftResult = await this.checkRuleAccess(walletAddress, {
              ...rule,
              requirements: { ...rule.requirements, type: 'NFT_OWNERSHIP' }
            });
            
            if (nftResult.hasAccess) {
              passedRequirements.push('nft_requirements');
              userNFTs.push(...(nftResult.details?.userNFTs || []));
            } else {
              failedRequirements.push('nft_requirements');
            }
          }
          break;

        case 'CUSTOM':
          // Custom logic would be implemented here
          // For now, just return false
          failedRequirements.push('custom_logic_not_implemented');
          break;
      }

      const hasAccess = rule.requirements.type === 'COMBINED' 
        ? passedRequirements.length > 0 && failedRequirements.length === 0
        : passedRequirements.length > 0;

      return {
        hasAccess,
        reason: hasAccess ? 'Rule requirements satisfied' : 'Rule requirements not met',
        details: {
          passedRequirements,
          failedRequirements,
          userTokens,
          userNFTs
        }
      };
    } catch (error) {
      console.error('Error checking rule access:', error);
      return {
        hasAccess: false,
        reason: 'Rule check failed',
        details: {
          passedRequirements: [],
          failedRequirements: ['rule_check_error'],
          userTokens: [],
          userNFTs: []
        }
      };
    }
  }

  private async getTokenBalance(
    walletAddress: string,
    tokenAddress: string,
    chain: string
  ): Promise<{ balance: string; symbol: string; decimals: number }> {
    try {
      const chainId = this.getChainId(chain);
      const provider = this.getProvider(chainId);
      
      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        // ETH balance
        const balance = await provider.getBalance(walletAddress);
        return { 
          balance: ethers.formatEther(balance),
          symbol: 'ETH',
          decimals: 18
        };
      }
      
      // ERC-20 token balance
      const tokenAbi = [
        "function balanceOf(address) view returns (uint256)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)"
      ];
      
      const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, provider);
      const [balance, symbol, decimals] = await Promise.all([
        tokenContract.balanceOf(walletAddress),
        tokenContract.symbol(),
        tokenContract.decimals()
      ]);
      
      return {
        balance: ethers.formatUnits(balance, decimals),
        symbol,
        decimals: Number(decimals)
      };
    } catch (error) {
      console.error('Token balance error:', error);
      return { balance: '0', symbol: 'UNKNOWN', decimals: 18 };
    }
  }

  private async checkNFTBalance(
    walletAddress: string,
    contractAddress: string,
    minTokens: number
  ): Promise<boolean> {
    try {
      const provider = this.getProvider(1); // Default to mainnet
      
      const nftAbi = [
        "function balanceOf(address) view returns (uint256)"
      ];
      
      const nftContract = new ethers.Contract(contractAddress, nftAbi, provider);
      const balance = await nftContract.balanceOf(walletAddress);
      
      return Number(balance) >= minTokens;
    } catch (error) {
      console.error('NFT balance check error:', error);
      return false;
    }
  }

  async bulkCheckAccess(
    userId: string,
    rules: Array<{
      serverId?: string;
      channelId?: string;
      communityId?: string;
    }>
  ): Promise<AccessCheckResult[]> {
    const results: AccessCheckResult[] = [];

    for (const rule of rules) {
      try {
        const result = await this.checkAccess(
          userId,
          rule.serverId,
          rule.channelId,
          rule.communityId
        );
        results.push(result);
      } catch (error) {
        results.push({
          hasAccess: false,
          reason: 'Bulk check failed',
          details: {
            passedRequirements: [],
            failedRequirements: ['bulk_check_error'],
            userTokens: [],
            userNFTs: []
          }
        });
      }
    }

    return results;
  }

  getSupportedTokens() {
    return [
      {
        symbol: 'ETH',
        name: 'Ethereum',
        address: '0x0000000000000000000000000000000000000000',
        chain: 'ethereum',
        decimals: 18
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        address: '0xA0b86a33E6441f3de0B0b3b2eA11b93cD0dE8F72',
        chain: 'ethereum',
        decimals: 6
      },
      {
        symbol: 'WETH',
        name: 'Wrapped Ethereum',
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        chain: 'ethereum',
        decimals: 18
      }
    ];
  }

  private deduplicateAssets(assets: any[]): any[] {
    const seen = new Set();
    return assets.filter(asset => {
      const key = asset.address || asset.contractAddress || JSON.stringify(asset);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}

export const simpleTokenGatingService = new SimpleTokenGatingService();