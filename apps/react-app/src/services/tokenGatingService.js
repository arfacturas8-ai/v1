// CRYB Platform Token Gating Service
// Advanced NFT and token-based access control system

import { getCRYBTokenContract, getCRYBNFTContract, ACCESS_LEVELS } from '../lib/contracts/cryb-contracts.js';
import { walletManager } from '../lib/web3/WalletManager.js';

// Access requirement types
export const ACCESS_REQUIREMENT_TYPES = {
  TOKEN_BALANCE: 'token_balance',
  NFT_OWNERSHIP: 'nft_ownership',
  STAKING_AMOUNT: 'staking_amount',
  COMMUNITY_MEMBERSHIP: 'community_membership',
  SOCIAL_SCORE: 'social_score',
  VERIFICATION_BADGE: 'verification_badge',
  COMBINED_REQUIREMENTS: 'combined_requirements'
};

// Community access levels
export const COMMUNITY_ACCESS_LEVELS = {
  PUBLIC: {
    id: 'public',
    name: 'Public',
    description: 'Open to everyone',
    requirements: [],
    permissions: ['view_content', 'basic_chat']
  },
  VERIFIED: {
    id: 'verified',
    name: 'Verified',
    description: 'Verified users only',
    requirements: [
      {
        type: ACCESS_REQUIREMENT_TYPES.VERIFICATION_BADGE,
        value: true
      }
    ],
    permissions: ['view_content', 'basic_chat', 'create_posts', 'react_to_posts']
  },
  TOKEN_HOLDER: {
    id: 'token_holder',
    name: 'Token Holder',
    description: 'Must hold CRYB tokens',
    requirements: [
      {
        type: ACCESS_REQUIREMENT_TYPES.TOKEN_BALANCE,
        tokenContract: '0x1234567890123456789012345678901234567890',
        minAmount: '1000000000000000000000' // 1,000 CRYB
      }
    ],
    permissions: ['view_content', 'basic_chat', 'create_posts', 'react_to_posts', 'voice_channels']
  },
  NFT_HOLDER: {
    id: 'nft_holder',
    name: 'NFT Holder',
    description: 'Must own specific NFTs',
    requirements: [
      {
        type: ACCESS_REQUIREMENT_TYPES.NFT_OWNERSHIP,
        nftContract: '0x0987654321098765432109876543210987654321',
        minCount: 1
      }
    ],
    permissions: ['view_content', 'basic_chat', 'create_posts', 'react_to_posts', 'voice_channels', 'special_channels']
  },
  STAKER: {
    id: 'staker',
    name: 'Staker',
    description: 'Must have staked tokens',
    requirements: [
      {
        type: ACCESS_REQUIREMENT_TYPES.STAKING_AMOUNT,
        tokenContract: '0x1234567890123456789012345678901234567890',
        minAmount: '5000000000000000000000' // 5,000 CRYB staked
      }
    ],
    permissions: ['view_content', 'basic_chat', 'create_posts', 'react_to_posts', 'voice_channels', 'special_channels', 'governance_voting']
  },
  VIP: {
    id: 'vip',
    name: 'VIP',
    description: 'High-tier access with multiple requirements',
    requirements: [
      {
        type: ACCESS_REQUIREMENT_TYPES.COMBINED_REQUIREMENTS,
        operator: 'AND',
        conditions: [
          {
            type: ACCESS_REQUIREMENT_TYPES.TOKEN_BALANCE,
            tokenContract: '0x1234567890123456789012345678901234567890',
            minAmount: '25000000000000000000000' // 25,000 CRYB
          },
          {
            type: ACCESS_REQUIREMENT_TYPES.NFT_OWNERSHIP,
            nftContract: '0x0987654321098765432109876543210987654321',
            minCount: 2
          },
          {
            type: ACCESS_REQUIREMENT_TYPES.SOCIAL_SCORE,
            minScore: 100
          }
        ]
      }
    ],
    permissions: [
      'view_content', 'basic_chat', 'create_posts', 'react_to_posts', 
      'voice_channels', 'special_channels', 'governance_voting', 
      'admin_tools', 'beta_features'
    ]
  }
};

// Permission types and descriptions
export const PERMISSIONS = {
  view_content: 'View community content',
  basic_chat: 'Participate in basic chat',
  create_posts: 'Create posts and content',
  react_to_posts: 'React to posts and comments',
  voice_channels: 'Access voice channels',
  special_channels: 'Access special/private channels',
  governance_voting: 'Participate in governance voting',
  admin_tools: 'Access administrative tools',
  beta_features: 'Access beta features',
  revenue_sharing: 'Participate in revenue sharing',
  custom_roles: 'Create and assign custom roles',
  moderation: 'Moderate community content'
};

// Community configurations
export const COMMUNITY_CONFIGS = {
  'cryb-genesis': {
    id: 'cryb-genesis',
    name: 'CRYB Genesis',
    description: 'Exclusive community for CRYB Genesis NFT holders',
    accessLevel: 'nft_holder',
    requirements: [
      {
        type: ACCESS_REQUIREMENT_TYPES.NFT_OWNERSHIP,
        nftContract: '0x0987654321098765432109876543210987654321',
        requiredTokenIds: [1, 2, 3, 4, 5], // Genesis NFTs
        minCount: 1
      }
    ],
    features: ['exclusive_drops', 'early_access', 'governance_rights'],
    memberLimit: 1000
  },
  'diamond-tier': {
    id: 'diamond-tier',
    name: 'Diamond Tier',
    description: 'Ultra-exclusive community for diamond-level users',
    accessLevel: 'vip',
    requirements: [
      {
        type: ACCESS_REQUIREMENT_TYPES.COMBINED_REQUIREMENTS,
        operator: 'AND',
        conditions: [
          {
            type: ACCESS_REQUIREMENT_TYPES.TOKEN_BALANCE,
            tokenContract: '0x1234567890123456789012345678901234567890',
            minAmount: '100000000000000000000000' // 100,000 CRYB
          },
          {
            type: ACCESS_REQUIREMENT_TYPES.STAKING_AMOUNT,
            tokenContract: '0x1234567890123456789012345678901234567890',
            minAmount: '50000000000000000000000' // 50,000 CRYB staked
          }
        ]
      }
    ],
    features: ['revenue_sharing', 'white_glove_support', 'product_roadmap_input'],
    memberLimit: 100
  }
};

export class TokenGatingService {
  constructor() {
    this.userCache = new Map();
    this.requirementCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  // Check if user meets access requirements
  async checkAccess(userAddress, requirements, operator = 'AND') {
    try {
      if (!userAddress || !requirements || requirements.length === 0) {
        return { hasAccess: false, failedRequirements: ['Invalid parameters'] };
      }

      const chainId = walletManager.currentChainId || 1;
      const results = [];
      const failedRequirements = [];

      for (const requirement of requirements) {
        const result = await this.checkSingleRequirement(userAddress, requirement, chainId);
        results.push(result);
        
        if (!result.passed) {
          failedRequirements.push(result.reason);
        }
      }

      let hasAccess = false;
      if (operator === 'AND') {
        hasAccess = results.every(r => r.passed);
      } else if (operator === 'OR') {
        hasAccess = results.some(r => r.passed);
      }

      return {
        hasAccess,
        failedRequirements: hasAccess ? [] : failedRequirements,
        checkedRequirements: results
      };
    } catch (error) {
      console.error('Access check error:', error);
      return { hasAccess: false, failedRequirements: ['System error'] };
    }
  }

  // Check a single requirement
  async checkSingleRequirement(userAddress, requirement, chainId) {
    try {
      switch (requirement.type) {
        case ACCESS_REQUIREMENT_TYPES.TOKEN_BALANCE:
          return await this.checkTokenBalance(userAddress, requirement, chainId);
          
        case ACCESS_REQUIREMENT_TYPES.NFT_OWNERSHIP:
          return await this.checkNFTOwnership(userAddress, requirement, chainId);
          
        case ACCESS_REQUIREMENT_TYPES.STAKING_AMOUNT:
          return await this.checkStakingAmount(userAddress, requirement, chainId);
          
        case ACCESS_REQUIREMENT_TYPES.COMMUNITY_MEMBERSHIP:
          return await this.checkCommunityMembership(userAddress, requirement);
          
        case ACCESS_REQUIREMENT_TYPES.SOCIAL_SCORE:
          return await this.checkSocialScore(userAddress, requirement);
          
        case ACCESS_REQUIREMENT_TYPES.VERIFICATION_BADGE:
          return await this.checkVerificationBadge(userAddress, requirement);
          
        case ACCESS_REQUIREMENT_TYPES.COMBINED_REQUIREMENTS:
          const subResult = await this.checkAccess(
            userAddress, 
            requirement.conditions, 
            requirement.operator
          );
          return {
            passed: subResult.hasAccess,
            reason: subResult.hasAccess ? 'Combined requirements met' : 'Combined requirements not met',
            details: subResult
          };
          
        default:
          return {
            passed: false,
            reason: `Unknown requirement type: ${requirement.type}`
          };
      }
    } catch (error) {
      console.error('Single requirement check error:', error);
      return {
        passed: false,
        reason: `Error checking requirement: ${error.message}`
      };
    }
  }

  // Check token balance requirement
  async checkTokenBalance(userAddress, requirement, chainId) {
    try {
      const cacheKey = `token_balance_${userAddress}_${requirement.tokenContract}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const tokenContract = getCRYBTokenContract(chainId);
      const balance = await tokenContract.getBalance(userAddress);
      const minAmount = BigInt(requirement.minAmount);
      
      const result = {
        passed: balance >= minAmount,
        reason: balance >= minAmount 
          ? `Token balance sufficient: ${tokenContract.formatTokenAmount(balance)} CRYB`
          : `Insufficient token balance: ${tokenContract.formatTokenAmount(balance)} CRYB (required: ${tokenContract.formatTokenAmount(minAmount)} CRYB)`,
        balance: balance.toString(),
        required: minAmount.toString()
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      return {
        passed: false,
        reason: `Token balance check failed: ${error.message}`
      };
    }
  }

  // Check NFT ownership requirement
  async checkNFTOwnership(userAddress, requirement, chainId) {
    try {
      const cacheKey = `nft_ownership_${userAddress}_${requirement.nftContract}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const nftContract = getCRYBNFTContract(chainId);
      const userNFTs = await nftContract.getUserNFTs(userAddress);
      
      let ownedCount = 0;
      let ownedTokenIds = [];

      if (requirement.requiredTokenIds) {
        // Check specific token IDs
        ownedTokenIds = userNFTs.tokenIds.filter(id => 
          requirement.requiredTokenIds.includes(id)
        );
        ownedCount = ownedTokenIds.length;
      } else {
        // Check any NFTs from the collection
        ownedCount = userNFTs.tokenIds.length;
        ownedTokenIds = userNFTs.tokenIds;
      }

      const minCount = requirement.minCount || 1;
      
      const result = {
        passed: ownedCount >= minCount,
        reason: ownedCount >= minCount
          ? `NFT ownership satisfied: owns ${ownedCount} NFT(s)`
          : `Insufficient NFTs: owns ${ownedCount} NFT(s) (required: ${minCount})`,
        ownedCount,
        ownedTokenIds,
        required: minCount
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      return {
        passed: false,
        reason: `NFT ownership check failed: ${error.message}`
      };
    }
  }

  // Check staking amount requirement
  async checkStakingAmount(userAddress, requirement, chainId) {
    try {
      const cacheKey = `staking_amount_${userAddress}_${requirement.tokenContract}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const tokenContract = getCRYBTokenContract(chainId);
      const stakingInfo = await tokenContract.getStakingInfo(userAddress);
      const minAmount = BigInt(requirement.minAmount);
      
      const result = {
        passed: stakingInfo.stakedAmount >= minAmount,
        reason: stakingInfo.stakedAmount >= minAmount
          ? `Staking requirement met: ${tokenContract.formatTokenAmount(stakingInfo.stakedAmount)} CRYB staked`
          : `Insufficient staked amount: ${tokenContract.formatTokenAmount(stakingInfo.stakedAmount)} CRYB (required: ${tokenContract.formatTokenAmount(minAmount)} CRYB)`,
        stakedAmount: stakingInfo.stakedAmount.toString(),
        required: minAmount.toString()
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      return {
        passed: false,
        reason: `Staking amount check failed: ${error.message}`
      };
    }
  }

  // Check community membership requirement
  async checkCommunityMembership(userAddress, requirement) {
    try {
      // In a real implementation, this would check membership in other communities
      const mockMemberships = ['general', 'early-adopters', 'beta-testers'];
      const hasRequiredMembership = mockMemberships.includes(requirement.communityId);
      
      return {
        passed: hasRequiredMembership,
        reason: hasRequiredMembership 
          ? `Member of required community: ${requirement.communityId}`
          : `Not a member of required community: ${requirement.communityId}`,
        memberships: mockMemberships
      };
    } catch (error) {
      return {
        passed: false,
        reason: `Community membership check failed: ${error.message}`
      };
    }
  }

  // Check social score requirement
  async checkSocialScore(userAddress, requirement) {
    try {
      // Mock social score calculation based on platform activity
      const mockScore = Math.floor(Math.random() * 150) + 50; // 50-200 range
      const minScore = requirement.minScore || 100;
      
      return {
        passed: mockScore >= minScore,
        reason: mockScore >= minScore
          ? `Social score sufficient: ${mockScore}`
          : `Social score too low: ${mockScore} (required: ${minScore})`,
        currentScore: mockScore,
        required: minScore
      };
    } catch (error) {
      return {
        passed: false,
        reason: `Social score check failed: ${error.message}`
      };
    }
  }

  // Check verification badge requirement
  async checkVerificationBadge(userAddress, requirement) {
    try {
      // Mock verification status
      const isVerified = Math.random() > 0.5; // 50% chance for demo
      
      return {
        passed: isVerified,
        reason: isVerified 
          ? 'User is verified'
          : 'User is not verified',
        verified: isVerified
      };
    } catch (error) {
      return {
        passed: false,
        reason: `Verification check failed: ${error.message}`
      };
    }
  }

  // Get user's access level for a community
  async getUserCommunityAccess(userAddress, communityId) {
    try {
      const community = COMMUNITY_CONFIGS[communityId];
      if (!community) {
        return {
          hasAccess: false,
          accessLevel: null,
          permissions: [],
          reason: 'Community not found'
        };
      }

      const accessCheck = await this.checkAccess(userAddress, community.requirements);
      
      if (accessCheck.hasAccess) {
        const accessLevel = COMMUNITY_ACCESS_LEVELS[community.accessLevel];
        return {
          hasAccess: true,
          accessLevel: accessLevel,
          permissions: accessLevel.permissions,
          community: community,
          checkedRequirements: accessCheck.checkedRequirements
        };
      } else {
        return {
          hasAccess: false,
          accessLevel: null,
          permissions: [],
          failedRequirements: accessCheck.failedRequirements,
          community: community
        };
      }
    } catch (error) {
      console.error('Community access check error:', error);
      return {
        hasAccess: false,
        accessLevel: null,
        permissions: [],
        reason: error.message
      };
    }
  }

  // Get all communities user has access to
  async getUserCommunities(userAddress) {
    try {
      const accessibleCommunities = [];
      
      for (const [communityId, community] of Object.entries(COMMUNITY_CONFIGS)) {
        const access = await this.getUserCommunityAccess(userAddress, communityId);
        if (access.hasAccess) {
          accessibleCommunities.push({
            communityId,
            community,
            accessLevel: access.accessLevel,
            permissions: access.permissions
          });
        }
      }

      return accessibleCommunities;
    } catch (error) {
      console.error('Get user communities error:', error);
      return [];
    }
  }

  // Check specific permission for user in community
  async hasPermission(userAddress, communityId, permission) {
    try {
      const access = await this.getUserCommunityAccess(userAddress, communityId);
      return access.hasAccess && access.permissions.includes(permission);
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  }

  // Get user's global access level based on token holdings
  async getUserGlobalAccessLevel(userAddress) {
    try {
      const chainId = walletManager.currentChainId || 1;
      const tokenContract = getCRYBTokenContract(chainId);
      const accessLevel = await tokenContract.getAccessLevel(userAddress);
      
      return {
        level: accessLevel,
        name: ACCESS_LEVELS[accessLevel]?.name || 'Unknown',
        color: ACCESS_LEVELS[accessLevel]?.color || '#gray',
        benefits: ACCESS_LEVELS[accessLevel]?.benefits || []
      };
    } catch (error) {
      console.error('Global access level error:', error);
      return {
        level: 0,
        name: 'None',
        color: '#gray',
        benefits: []
      };
    }
  }

  // Create custom access requirement
  createCustomRequirement(type, params) {
    switch (type) {
      case ACCESS_REQUIREMENT_TYPES.TOKEN_BALANCE:
        return {
          type: ACCESS_REQUIREMENT_TYPES.TOKEN_BALANCE,
          tokenContract: params.tokenContract,
          minAmount: params.minAmount
        };
        
      case ACCESS_REQUIREMENT_TYPES.NFT_OWNERSHIP:
        return {
          type: ACCESS_REQUIREMENT_TYPES.NFT_OWNERSHIP,
          nftContract: params.nftContract,
          minCount: params.minCount || 1,
          requiredTokenIds: params.requiredTokenIds || null
        };
        
      case ACCESS_REQUIREMENT_TYPES.COMBINED_REQUIREMENTS:
        return {
          type: ACCESS_REQUIREMENT_TYPES.COMBINED_REQUIREMENTS,
          operator: params.operator || 'AND',
          conditions: params.conditions || []
        };
        
      default:
        throw new Error(`Unsupported requirement type: ${type}`);
    }
  }

  // Cache management
  getFromCache(key) {
    const cached = this.requirementCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  setCache(key, data) {
    this.requirementCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.requirementCache.clear();
    this.userCache.clear();
  }

  // Real-time access monitoring
  startAccessMonitoring(userAddress, communityId, callback) {
    const monitoringInterval = setInterval(async () => {
      try {
        const access = await this.getUserCommunityAccess(userAddress, communityId);
        callback(access);
      } catch (error) {
        console.error('Access monitoring error:', error);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(monitoringInterval);
  }

  // Event listeners for wallet changes
  setupWalletListeners() {
    if (walletManager) {
      walletManager.on('accountChanged', () => {
        this.clearCache();
      });
      
      walletManager.on('chainChanged', () => {
        this.clearCache();
      });
    }
  }
}

// Singleton instance
export const tokenGatingService = new TokenGatingService();

// Initialize wallet listeners
if (typeof window !== 'undefined') {
  tokenGatingService.setupWalletListeners();
}

export default tokenGatingService;