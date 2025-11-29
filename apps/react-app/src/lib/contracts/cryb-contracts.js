// CRYB Platform Smart Contract Interfaces
// Adapted for React app with advanced DeFi features

// Enhanced staking configuration
export const STAKING_POOLS = {
  BASIC: {
    id: 0,
    name: 'Basic Pool',
    minStake: BigInt('1000') * BigInt(10 ** 18), // 1,000 CRYB
    lockPeriod: 30 * 24 * 60 * 60, // 30 days
    baseAPY: 15, // 15%
    bonusMultiplier: 1.0
  },
  PREMIUM: {
    id: 1,
    name: 'Premium Pool',
    minStake: BigInt('10000') * BigInt(10 ** 18), // 10,000 CRYB
    lockPeriod: 90 * 24 * 60 * 60, // 90 days
    baseAPY: 25, // 25%
    bonusMultiplier: 1.2
  },
  DIAMOND: {
    id: 2,
    name: 'Diamond Pool',
    minStake: BigInt('100000') * BigInt(10 ** 18), // 100,000 CRYB
    lockPeriod: 365 * 24 * 60 * 60, // 1 year
    baseAPY: 40, // 40%
    bonusMultiplier: 1.5
  }
};

// Yield farming pools configuration
export const YIELD_FARMS = {
  CRYB_ETH: {
    id: 0,
    name: 'CRYB-ETH LP',
    token0: 'CRYB',
    token1: 'ETH',
    multiplier: 2.0,
    totalAllocPoint: 200,
    isActive: true
  },
  CRYB_USDC: {
    id: 1,
    name: 'CRYB-USDC LP',
    token0: 'CRYB',
    token1: 'USDC',
    multiplier: 1.5,
    totalAllocPoint: 150,
    isActive: true
  }
};

// Chain IDs for different networks
export const CHAIN_IDS = {
  MAINNET: 1,
  POLYGON: 137,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  BASE: 8453,
  BSC: 56,
  AVALANCHE: 43114,
  SEPOLIA: 11155111,
  POLYGON_MUMBAI: 80001,
  ARBITRUM_GOERLI: 421613,
  OPTIMISM_GOERLI: 420
};

// Network configurations
export const NETWORK_CONFIGS = {
  [CHAIN_IDS.MAINNET]: {
    name: 'Ethereum Mainnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.infura.io/v3/', 'https://eth-mainnet.alchemyapi.io/v2/'],
    blockExplorerUrls: ['https://etherscan.io'],
    iconUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png'
  },
  [CHAIN_IDS.POLYGON]: {
    name: 'Polygon Mainnet',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    rpcUrls: ['https://polygon-rpc.com/', 'https://rpc-mainnet.matic.network'],
    blockExplorerUrls: ['https://polygonscan.com'],
    iconUrl: 'https://cryptologos.cc/logos/polygon-matic-logo.png'
  },
  [CHAIN_IDS.ARBITRUM]: {
    name: 'Arbitrum One',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://arbiscan.io'],
    iconUrl: 'https://cryptologos.cc/logos/arbitrum-arb-logo.png'
  },
  [CHAIN_IDS.OPTIMISM]: {
    name: 'Optimism',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.optimism.io'],
    blockExplorerUrls: ['https://optimistic.etherscan.io'],
    iconUrl: 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.png'
  },
  [CHAIN_IDS.BASE]: {
    name: 'Base',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.base.org'],
    blockExplorerUrls: ['https://basescan.org'],
    iconUrl: 'https://cryptologos.cc/logos/base-base-logo.png'
  },
  [CHAIN_IDS.SEPOLIA]: {
    name: 'Sepolia Testnet',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'SEP', decimals: 18 },
    rpcUrls: ['https://sepolia.infura.io/v3/'],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
    iconUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png'
  }
};

// Contract addresses for different networks
// IMPORTANT: Replace these placeholder addresses with actual deployed contract addresses
// Use environment variables for production deployment
export const CRYB_TOKEN_ADDRESSES = {
  [CHAIN_IDS.MAINNET]: import.meta.env.VITE_CRYB_TOKEN_MAINNET || null,
  [CHAIN_IDS.POLYGON]: import.meta.env.VITE_CRYB_TOKEN_POLYGON || null,
  [CHAIN_IDS.SEPOLIA]: import.meta.env.VITE_CRYB_TOKEN_SEPOLIA || null,
};

export const CRYB_NFT_ADDRESSES = {
  [CHAIN_IDS.MAINNET]: import.meta.env.VITE_CRYB_NFT_MAINNET || null,
  [CHAIN_IDS.POLYGON]: import.meta.env.VITE_CRYB_NFT_POLYGON || null,
  [CHAIN_IDS.SEPOLIA]: import.meta.env.VITE_CRYB_NFT_SEPOLIA || null,
};

// Validation helper to check if contracts are deployed
export const isContractDeployed = (chainId, contractType = 'token') => {
  const addresses = contractType === 'token' ? CRYB_TOKEN_ADDRESSES : CRYB_NFT_ADDRESSES;
  const address = addresses[chainId];
  return address && address !== null && address.match(/^0x[a-fA-F0-9]{40}$/);
};

// Get contract address with validation
export const getContractAddress = (chainId, contractType = 'token') => {
  if (!isContractDeployed(chainId, contractType)) {
    throw new Error(
      `${contractType.toUpperCase()} contract not deployed on chain ${chainId}. ` +
      `Set VITE_CRYB_${contractType.toUpperCase()}_${getChainName(chainId)} environment variable.`
    );
  }
  const addresses = contractType === 'token' ? CRYB_TOKEN_ADDRESSES : CRYB_NFT_ADDRESSES;
  return addresses[chainId];
};

// Helper to get chain name for error messages
const getChainName = (chainId) => {
  const names = {
    [CHAIN_IDS.MAINNET]: 'MAINNET',
    [CHAIN_IDS.POLYGON]: 'POLYGON',
    [CHAIN_IDS.SEPOLIA]: 'SEPOLIA'
  };
  return names[chainId] || 'UNKNOWN';
};

// ABI fragments for the contracts (minimal required functions)
export const CRYB_TOKEN_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'stake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'unstake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'claimRewards',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'stakingBalance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'calculateStakingReward',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'getAccessLevel',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'requiredLevel', type: 'uint256' },
    ],
    name: 'hasAccessLevel',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Enhanced staking functions
  {
    inputs: [
      { name: 'poolId', type: 'uint256' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'stakeInPool',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'poolId', type: 'uint256' }],
    name: 'getPoolInfo',
    outputs: [
      { name: 'minStake', type: 'uint256' },
      { name: 'lockPeriod', type: 'uint256' },
      { name: 'baseAPY', type: 'uint256' },
      { name: 'totalStaked', type: 'uint256' },
      { name: 'isActive', type: 'bool' }
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'poolId', type: 'uint256' }
    ],
    name: 'getUserStakeInfo',
    outputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'stakeTime', type: 'uint256' },
      { name: 'lastClaimTime', type: 'uint256' },
      { name: 'pendingRewards', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'compoundStakingRewards',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Yield farming functions
  {
    inputs: [
      { name: 'farmId', type: 'uint256' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'depositToFarm',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'farmId', type: 'uint256' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'withdrawFromFarm',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'farmId', type: 'uint256' }],
    name: 'harvestFarmRewards',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'farmId', type: 'uint256' }
    ],
    name: 'getUserFarmInfo',
    outputs: [
      { name: 'stakedAmount', type: 'uint256' },
      { name: 'pendingRewards', type: 'uint256' },
      { name: 'lastHarvestTime', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // Treasury and governance functions
  {
    inputs: [],
    name: 'getTreasuryBalance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'treasuryWithdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'newFeeRate', type: 'uint256' }],
    name: 'updateTransactionFee',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'burnTreasuryTokens',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Token utility functions
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'message', type: 'string' }
    ],
    name: 'tip',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'communityId', type: 'uint256' },
      { name: 'duration', type: 'uint256' }
    ],
    name: 'purchasePremiumAccess',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'from', type: 'address' },
      { indexed: true, name: 'to', type: 'address' },
      { indexed: false, name: 'value', type: 'uint256' },
    ],
    name: 'Transfer',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
    name: 'Staked',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'reward', type: 'uint256' },
    ],
    name: 'Unstaked',
    type: 'event',
  },
];

export const CRYB_NFT_ABI = [
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'index', type: 'uint256' },
    ],
    name: 'tokenOfOwnerByIndex',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'quantity', type: 'uint256' }],
    name: 'publicMint',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'quantity', type: 'uint256' }],
    name: 'whitelistMint',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'stakeToken',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'unstakeToken',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'calculateStakingReward',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'setProfilePicture',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserProfilePicture',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'getTokensByOwner',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'from', type: 'address' },
      { indexed: true, name: 'to', type: 'address' },
      { indexed: true, name: 'tokenId', type: 'uint256' },
    ],
    name: 'Transfer',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'to', type: 'address' },
      { indexed: false, name: 'startTokenId', type: 'uint256' },
      { indexed: false, name: 'quantity', type: 'uint256' },
    ],
    name: 'BatchMinted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: true, name: 'tokenId', type: 'uint256' },
    ],
    name: 'ProfilePictureSet',
    type: 'event',
  },
];

// Mock data for development (when actual contracts are not deployed)
export const MOCK_TOKEN_INFO = {
  name: 'CRYB Token',
  symbol: 'CRYB',
  decimals: 18,
  totalSupply: BigInt('1000000000') * BigInt(10 ** 18), // 1B tokens
  maxTxAmount: BigInt('10000000') * BigInt(10 ** 18), // 10M tokens
  maxWalletAmount: BigInt('50000000') * BigInt(10 ** 18), // 50M tokens
  transferFee: 0,
  isPaused: false,
};

export const MOCK_NFT_COLLECTION_INFO = {
  totalSupply: 2547,
  maxSupply: 10000,
  publicPrice: BigInt('80000000000000000'), // 0.08 ETH in wei
  whitelistPrice: BigInt('60000000000000000'), // 0.06 ETH in wei
  phase: 2, // Public mint phase
  revealed: true,
};

// Contract interface class for CRYB Token
export class CRYBTokenContract {
  constructor(chainId) {
    this.chainId = chainId;
    this.address = CRYB_TOKEN_ADDRESSES[chainId];
    this.abi = CRYB_TOKEN_ABI;
    
    if (!this.address) {
      throw new Error(`CRYB Token contract not deployed on chain ${chainId}`);
    }
  }

  // Mock methods for when contracts aren't deployed
  async getTokenInfo() {
    // In a real implementation, this would make actual contract calls
    return Promise.resolve(MOCK_TOKEN_INFO);
  }

  async getBalance(account) {
    // Mock balance based on account (for demo purposes)
    const mockBalances = {
      // Add some mock balances for testing
    };
    
    return Promise.resolve(
      mockBalances[account?.toLowerCase()] || 
      BigInt(Math.floor(Math.random() * 100000)) * BigInt(10 ** 18)
    );
  }

  async getStakingInfo(account) {
    const stakedAmount = BigInt(Math.floor(Math.random() * 50000)) * BigInt(10 ** 18);
    const pendingRewards = BigInt(Math.floor(Math.random() * 1000)) * BigInt(10 ** 18);
    
    return Promise.resolve({
      stakedAmount,
      stakingStart: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
      pendingRewards,
      accessLevel: stakedAmount > BigInt(100000) * BigInt(10 ** 18) ? 4 :
                   stakedAmount > BigInt(25000) * BigInt(10 ** 18) ? 3 :
                   stakedAmount > BigInt(5000) * BigInt(10 ** 18) ? 2 :
                   stakedAmount > BigInt(1000) * BigInt(10 ** 18) ? 1 : 0
    });
  }

  async getAccessLevel(account) {
    const balance = await this.getBalance(account);
    
    if (balance >= BigInt(500000) * BigInt(10 ** 18)) return 5; // Diamond
    if (balance >= BigInt(100000) * BigInt(10 ** 18)) return 4; // Platinum
    if (balance >= BigInt(25000) * BigInt(10 ** 18)) return 3;  // Gold
    if (balance >= BigInt(5000) * BigInt(10 ** 18)) return 2;   // Silver
    if (balance >= BigInt(1000) * BigInt(10 ** 18)) return 1;   // Bronze
    return 0; // No access
  }

  async hasAccessLevel(account, requiredLevel) {
    const userLevel = await this.getAccessLevel(account);
    return userLevel >= requiredLevel;
  }

  // Enhanced staking methods
  async getStakingPools() {
    return Promise.resolve(Object.values(STAKING_POOLS));
  }

  async getPoolInfo(poolId) {
    const pools = Object.values(STAKING_POOLS);
    return Promise.resolve(pools[poolId] || null);
  }

  async getUserStakeInfo(account, poolId) {
    const pool = await this.getPoolInfo(poolId);
    if (!pool) return null;

    const stakedAmount = BigInt(Math.floor(Math.random() * 50000)) * BigInt(10 ** 18);
    const stakeTime = Date.now() - 15 * 24 * 60 * 60 * 1000; // 15 days ago
    const pendingRewards = this.calculatePoolRewards(stakedAmount, stakeTime, pool);

    return Promise.resolve({
      amount: stakedAmount,
      stakeTime,
      lastClaimTime: stakeTime,
      pendingRewards,
      pool
    });
  }

  calculatePoolRewards(stakedAmount, stakeTime, pool) {
    const now = Date.now();
    const stakingDuration = (now - stakeTime) / 1000; // seconds
    const yearlyRewards = (Number(stakedAmount) * pool.baseAPY * pool.bonusMultiplier) / 100;
    const secondlyRewards = yearlyRewards / (365 * 24 * 60 * 60);
    return BigInt(Math.floor(secondlyRewards * stakingDuration));
  }

  // Yield farming methods
  async getYieldFarms() {
    return Promise.resolve(Object.values(YIELD_FARMS));
  }

  async getUserFarmInfo(account, farmId) {
    const farms = Object.values(YIELD_FARMS);
    const farm = farms[farmId];
    if (!farm) return null;

    const stakedAmount = BigInt(Math.floor(Math.random() * 10000)) * BigInt(10 ** 18);
    const pendingRewards = BigInt(Math.floor(Math.random() * 500)) * BigInt(10 ** 18);

    return Promise.resolve({
      stakedAmount,
      pendingRewards,
      lastHarvestTime: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
      farm
    });
  }

  async getTotalValueLocked() {
    // Mock TVL calculation
    return Promise.resolve({
      totalStaked: BigInt(2500000) * BigInt(10 ** 18), // 2.5M CRYB
      totalFarmed: BigInt(850000) * BigInt(10 ** 18), // 850K CRYB
      treasuryBalance: BigInt(1200000) * BigInt(10 ** 18), // 1.2M CRYB
      totalValueUSD: 4550000 // $4.55M
    });
  }

  // Enhanced transaction methods
  async stake(amount) {
    return Promise.resolve(`0x${'mock'.repeat(16)}`);
  }

  async stakeInPool(poolId, amount) {
    return Promise.resolve(`0x${'pool'.repeat(16)}`);
  }

  async compoundStakingRewards() {
    return Promise.resolve(`0x${'compound'.repeat(12)}`);
  }

  async depositToFarm(farmId, amount) {
    return Promise.resolve(`0x${'farm'.repeat(16)}`);
  }

  async harvestFarmRewards(farmId) {
    return Promise.resolve(`0x${'harvest'.repeat(13)}`);
  }

  async tip(to, amount, message) {
    return Promise.resolve(`0x${'tip'.repeat(21)}`);
  }

  async purchasePremiumAccess(communityId, duration) {
    return Promise.resolve(`0x${'premium'.repeat(14)}`);
  }

  async unstake(amount) {
    return Promise.resolve(`0x${'mock'.repeat(16)}`);
  }

  async claimRewards() {
    return Promise.resolve(`0x${'mock'.repeat(16)}`);
  }

  formatTokenAmount(amount, decimals = 18) {
    return (Number(amount) / (10 ** decimals)).toFixed(4);
  }

  parseTokenAmount(amount, decimals = 18) {
    return BigInt(Math.floor(parseFloat(amount) * (10 ** decimals)));
  }
}

// Contract interface class for CRYB NFT Collection
export class CRYBNFTContract {
  constructor(chainId) {
    this.chainId = chainId;
    this.address = CRYB_NFT_ADDRESSES[chainId];
    this.abi = CRYB_NFT_ABI;
    
    if (!this.address) {
      throw new Error(`CRYB NFT contract not deployed on chain ${chainId}`);
    }
  }

  async getCollectionInfo() {
    return Promise.resolve(MOCK_NFT_COLLECTION_INFO);
  }

  async getUserNFTs(account) {
    // Mock user NFTs
    const mockTokenIds = [1, 42, 123, 456];
    const mockProfilePicture = Math.random() > 0.5 ? mockTokenIds[0] : 0;
    
    return Promise.resolve({
      tokenIds: mockTokenIds,
      profilePictureTokenId: mockProfilePicture,
      stakedTokens: mockTokenIds.slice(0, 2), // First 2 are staked
    });
  }

  async ownsToken(account, tokenId) {
    const userNFTs = await this.getUserNFTs(account);
    return userNFTs.tokenIds.includes(tokenId);
  }

  async getTokenURI(tokenId) {
    return Promise.resolve(`https://mock-api.cryb.com/metadata/${tokenId}`);
  }

  async getTokensByOwner(account) {
    const userNFTs = await this.getUserNFTs(account);
    return userNFTs.tokenIds;
  }

  // Transaction methods
  async publicMint(quantity, value) {
    return Promise.resolve(`0x${'mint'.repeat(16)}`);
  }

  async whitelistMint(quantity, value) {
    return Promise.resolve(`0x${'mint'.repeat(16)}`);
  }

  async setProfilePicture(tokenId) {
    return Promise.resolve(`0x${'profile'.repeat(14)}`);
  }

  async stakeToken(tokenId) {
    return Promise.resolve(`0x${'stake'.repeat(15)}`);
  }

  async unstakeToken(tokenId) {
    return Promise.resolve(`0x${'unstake'.repeat(13)}`);
  }

  formatETH(amount) {
    return (Number(amount) / (10 ** 18)).toFixed(4);
  }
}

// Factory functions to get contract instances
export function getCRYBTokenContract(chainId) {
  return new CRYBTokenContract(chainId);
}

export function getCRYBNFTContract(chainId) {
  return new CRYBNFTContract(chainId);
}

// Utility functions
export function formatTokenAmount(amount, decimals = 18) {
  return (Number(amount) / (10 ** decimals)).toFixed(4);
}

export function parseTokenAmount(amount, decimals = 18) {
  return BigInt(Math.floor(parseFloat(amount) * (10 ** decimals)));
}

export function getExplorerUrl(chainId, address, type = 'address') {
  const baseUrls = {
    [CHAIN_IDS.MAINNET]: 'https://etherscan.io',
    [CHAIN_IDS.POLYGON]: 'https://polygonscan.com',
    [CHAIN_IDS.SEPOLIA]: 'https://sepolia.etherscan.io',
  };

  const baseUrl = baseUrls[chainId] || 'https://etherscan.io';
  return `${baseUrl}/${type}/${address}`;
}

// Access level names and benefits
export const ACCESS_LEVELS = {
  0: { name: 'None', color: '#gray', benefits: [] },
  1: { 
    name: 'Bronze', 
    color: '#CD7F32', 
    benefits: ['Basic chat access', 'Community participation']
  },
  2: { 
    name: 'Silver', 
    color: '#C0C0C0', 
    benefits: ['Voice channels', 'File uploads', 'Custom emoji']
  },
  3: { 
    name: 'Gold', 
    color: '#FFD700', 
    benefits: ['Screen sharing', 'Priority support', 'Advanced features']
  },
  4: { 
    name: 'Platinum', 
    color: '#E5E4E2', 
    benefits: ['Admin tools', 'Beta features', 'Exclusive channels']
  },
  5: { 
    name: 'Diamond', 
    color: '#B9F2FF', 
    benefits: ['Full platform access', 'Governance voting', 'Revenue sharing']
  }
};

// Premium subscription tiers
export const PREMIUM_TIERS = {
  BASIC: {
    id: 0,
    name: 'Basic Premium',
    monthlyPrice: BigInt('10') * BigInt(10 ** 18), // 10 CRYB
    benefits: ['Ad-free experience', 'Enhanced profile', 'Priority support']
  },
  PRO: {
    id: 1,
    name: 'Pro Premium',
    monthlyPrice: BigInt('25') * BigInt(10 ** 18), // 25 CRYB
    benefits: ['All Basic features', 'Advanced analytics', 'Custom themes', 'API access']
  },
  ENTERPRISE: {
    id: 2,
    name: 'Enterprise',
    monthlyPrice: BigInt('100') * BigInt(10 ** 18), // 100 CRYB
    benefits: ['All Pro features', 'White-label options', 'Dedicated support', 'Custom integrations']
  }
};

// Contract event listeners (simplified version for React)
export class ContractEventManager {
  constructor() {
    this.listeners = new Map();
  }

  addEventListener(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName).push(callback);
  }

  removeEventListener(eventName, callback) {
    const listeners = this.listeners.get(eventName);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Mock event emission for demo
  emitEvent(eventName, event) {
    const listeners = this.listeners.get(eventName);
    if (listeners) {
      listeners.forEach(callback => callback(event));
    }
  }
}

export const contractEventManager = new ContractEventManager();

// DeFi yield calculation utilities
export class YieldCalculator {
  static calculateAPY(principal, rewards, timeStaked) {
    const annualizedReturns = (Number(rewards) / Number(principal)) * (365 * 24 * 60 * 60 * 1000 / timeStaked);
    return annualizedReturns * 100;
  }

  static calculateCompoundRewards(principal, apy, compoundFrequency, timeInYears) {
    const rate = apy / 100;
    const compoundedAmount = Number(principal) * Math.pow(1 + rate / compoundFrequency, compoundFrequency * timeInYears);
    return BigInt(Math.floor(compoundedAmount - Number(principal)));
  }

  static calculateImpermanentLoss(price1Initial, price1Current, price2Initial, price2Current) {
    const priceRatio = (price1Current / price1Initial) / (price2Current / price2Initial);
    const impermanentLoss = 2 * Math.sqrt(priceRatio) / (1 + priceRatio) - 1;
    return impermanentLoss * 100; // Return as percentage
  }

  static calculateLiquidityProviderRewards(lpTokenBalance, totalLpSupply, tradingFees, timeStaked) {
    const poolShare = Number(lpTokenBalance) / Number(totalLpSupply);
    const annualizedFees = tradingFees * (365 * 24 * 60 * 60 * 1000 / timeStaked);
    return poolShare * annualizedFees;
  }
}

// Token economics utilities
export class TokenEconomics {
  static calculateTokenVelocity(transactionVolume, averageTokenHolding) {
    return transactionVolume / averageTokenHolding;
  }

  static calculateMarketCap(totalSupply, tokenPrice) {
    return Number(totalSupply) * tokenPrice;
  }

  static calculateBurnRate(totalBurned, timeElapsed) {
    return Number(totalBurned) / timeElapsed * (365 * 24 * 60 * 60 * 1000); // Annual burn rate
  }

  static calculateInflationRate(newTokens, totalSupply, timeElapsed) {
    const rate = Number(newTokens) / Number(totalSupply);
    return rate * (365 * 24 * 60 * 60 * 1000 / timeElapsed) * 100; // Annual inflation percentage
  }
}

export const yieldCalculator = new YieldCalculator();
export const tokenEconomics = new TokenEconomics();