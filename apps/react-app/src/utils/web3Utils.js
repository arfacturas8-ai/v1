// Web3 Utilities and Mock Data for CRYB Platform
// Professional Web3 integration functions and data structures

/**
 * Wallet Connection Utilities
 */
export const SUPPORTED_WALLETS = {
  METAMASK: {
    id: 'metamask',
    name: 'MetaMask',
    description: 'Most popular Ethereum wallet',
    icon: '🦊',
    downloadUrl: 'https://metamask.io/download',
    supported: true,
    mobile: true,
    desktop: true
  },
  WALLET_CONNECT: {
    id: 'walletconnect',
    name: 'WalletConnect',
    description: 'Connect with 300+ wallets',
    icon: '📱',
    downloadUrl: 'https://walletconnect.com',
    supported: true,
    mobile: true,
    desktop: true
  },
  COINBASE_WALLET: {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    description: 'Self-custody wallet by Coinbase',
    icon: '⚪',
    downloadUrl: 'https://wallet.coinbase.com',
    supported: true,
    mobile: true,
    desktop: true
  },
  PHANTOM: {
    id: 'phantom',
    name: 'Phantom',
    description: 'Solana ecosystem wallet',
    icon: '👻',
    downloadUrl: 'https://phantom.app',
    supported: false, // Coming soon
    mobile: true,
    desktop: true
  },
  TRUST_WALLET: {
    id: 'trust',
    name: 'Trust Wallet',
    description: 'Mobile-first DeFi wallet',
    icon: '🔷',
    downloadUrl: 'https://trustwallet.com',
    supported: false, // Coming soon
    mobile: true,
    desktop: false
  }
}

/**
 * Network Configuration
 */
export const SUPPORTED_NETWORKS = {
  ETHEREUM: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.infura.io/v3/',
    explorerUrl: 'https://etherscan.io',
    icon: '⟠',
    gasPrice: 'dynamic',
    supported: true
  },
  POLYGON: {
    chainId: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    icon: '🔷',
    gasPrice: 'low',
    supported: false // Coming in Phase 3
  },
  BSC: {
    chainId: 56,
    name: 'Binance Smart Chain',
    symbol: 'BNB',
    rpcUrl: 'https://bsc-dataseed1.binance.org',
    explorerUrl: 'https://bscscan.com',
    icon: '🟡',
    gasPrice: 'low',
    supported: false // Coming in Phase 3
  },
  ARBITRUM: {
    chainId: 42161,
    name: 'Arbitrum One',
    symbol: 'ETH',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    icon: '🔵',
    gasPrice: 'very_low',
    supported: false // Coming in Phase 3
  }
}

/**
 * Token Standards and Contracts
 */
export const TOKEN_STANDARDS = {
  ERC20: {
    name: 'ERC-20',
    description: 'Fungible tokens (currencies, utility tokens)',
    examples: ['CRYB', 'USDC', 'DAI', 'UNI'],
    useCase: 'Currency, governance, utility'
  },
  ERC721: {
    name: 'ERC-721',
    description: 'Non-fungible tokens (unique digital assets)',
    examples: ['Profile NFTs', 'Art', 'Collectibles'],
    useCase: 'Identity, ownership, collectibles'
  },
  ERC1155: {
    name: 'ERC-1155',
    description: 'Multi-token standard (both fungible and non-fungible)',
    examples: ['Game items', 'Badges', 'Certificates'],
    useCase: 'Gaming, achievements, multi-asset'
  }
}

/**
 * CRYB Token Configuration
 */
export const CRYB_TOKEN = {
  name: 'CRYB Token',
  symbol: 'CRYB',
  decimals: 18,
  totalSupply: '1000000000', // 1 billion
  standard: 'ERC-20',
  network: 'Ethereum',
  contractAddress: '0x...', // To be deployed
  features: {
    burnable: true,
    mintable: false,
    pausable: true,
    governance: true,
    staking: true
  },
  distribution: {
    community: { percentage: 40, amount: '400000000', description: 'User rewards and community incentives' },
    team: { percentage: 20, amount: '200000000', description: 'Core team with 4-year vesting' },
    ecosystem: { percentage: 15, amount: '150000000', description: 'Partnerships and growth' },
    treasury: { percentage: 15, amount: '150000000', description: 'Platform development and reserves' },
    publicSale: { percentage: 10, amount: '100000000', description: 'Public token sale and liquidity' }
  },
  utilities: [
    'Governance voting',
    'Token gating access',
    'Staking rewards',
    'Creator monetization',
    'Platform fee discounts',
    'Premium features'
  ]
}

/**
 * Mock User Data
 */
export const MOCK_USER_DATA = {
  wallet: {
    connected: false,
    address: '0x742d35CC6a2C4E8f8a8f8A8C9b8E8F8A8C9b8E8F',
    network: 'ethereum',
    balance: {
      eth: '2.45',
      cryb: '1250.00',
      usdc: '500.00'
    }
  },
  nfts: [
    {
      id: 1,
      name: 'Digital Collectible #001',
      collection: 'Digital Collectibles',
      image: '🚀',
      rarity: 'Legendary',
      traits: ['Founder', 'Early Adopter'],
      isProfilePic: true,
      value: '0.5 ETH'
    },
    {
      id: 2,
      name: 'Bored Ape #1234',
      collection: 'Bored Ape Yacht Club',
      image: '🐵',
      rarity: 'Rare',
      traits: ['Golden Fur', 'Laser Eyes', 'Crown'],
      isProfilePic: false,
      value: '15.2 ETH'
    },
    {
      id: 3,
      name: 'CryptoPunk #5678',
      collection: 'CryptoPunks',
      image: '👾',
      rarity: 'Ultra Rare',
      traits: ['Alien', 'Cap Forward', 'Pipe'],
      isProfilePic: false,
      value: '89.5 ETH'
    }
  ],
  defi: {
    totalValue: '$12543.21',
    positions: [
      {
        protocol: 'Uniswap V3',
        type: 'Liquidity Provider',
        pair: 'CRYB/ETH',
        value: '$5000.00',
        apr: '12.5%',
        rewards: '125.50 CRYB'
      },
      {
        protocol: 'Compound',
        type: 'Lending',
        asset: 'USDC',
        value: '$3000.00',
        apr: '4.2%',
        rewards: '10.50 COMP'
      },
      {
        protocol: 'CRYB Staking',
        type: 'Staking',
        asset: 'CRYB',
        value: '$4543.21',
        apr: '15.0%',
        rewards: '681.48 CRYB'
      }
    ]
  },
  governance: {
    votingPower: '1250 CRYB',
    votesParticipated: 12,
    proposalsCreated: 2,
    reputation: 'Active Contributor'
  }
}

/**
 * Web3 Feature Categories
 */
export const WEB3_FEATURES = {
  WALLET_INTEGRATION: {
    title: 'Wallet Integration',
    description: 'Connect and manage multiple Web3 wallets seamlessly',
    status: 'Phase 1',
    complexity: 'Medium',
    benefits: ['Multi-wallet support', 'Secure key management', 'Cross-platform compatibility']
  },
  NFT_SYSTEM: {
    title: 'NFT Profile System',
    description: 'Use NFTs as profile pictures and showcase collections',
    status: 'Phase 2',
    complexity: 'High',
    benefits: ['Digital identity', 'Collection showcase', 'Social status']
  },
  TOKEN_GATING: {
    title: 'Token Gating',
    description: 'Create exclusive communities based on token ownership',
    status: 'Phase 2',
    complexity: 'High',
    benefits: ['Exclusive access', 'Community building', 'Value creation']
  },
  DEFI_INTEGRATION: {
    title: 'DeFi Integration',
    description: 'Access decentralized finance directly from CRYB',
    status: 'Phase 3',
    complexity: 'Very High',
    benefits: ['Yield farming', 'Staking rewards', 'Portfolio management']
  },
  DAO_GOVERNANCE: {
    title: 'DAO Governance',
    description: 'Participate in decentralized platform governance',
    status: 'Phase 4',
    complexity: 'High',
    benefits: ['Democratic decision-making', 'Platform ownership', 'Proposal creation']
  }
}

/**
 * Educational Content Categories
 */
export const EDUCATION_CATEGORIES = {
  BASICS: {
    id: 'basics',
    title: 'Web3 Basics',
    description: 'Fundamental concepts of blockchain and Web3',
    difficulty: 'Beginner',
    topics: ['What is Web3?', 'Blockchain basics', 'Cryptocurrency 101']
  },
  WALLETS: {
    id: 'wallets',
    title: 'Digital Wallets',
    description: 'How to use and secure crypto wallets',
    difficulty: 'Beginner',
    topics: ['Wallet types', 'Security best practices', 'Transaction basics']
  },
  NFTS: {
    id: 'nfts',
    title: 'NFTs & Tokens',
    description: 'Understanding digital assets and tokens',
    difficulty: 'Intermediate',
    topics: ['NFT fundamentals', 'Token standards', 'Digital ownership']
  },
  DEFI: {
    id: 'defi',
    title: 'DeFi Explained',
    description: 'Decentralized finance and yield generation',
    difficulty: 'Advanced',
    topics: ['Lending & borrowing', 'Yield farming', 'Liquidity provision']
  },
  GOVERNANCE: {
    id: 'governance',
    title: 'DAOs & Governance',
    description: 'Community ownership and decision making',
    difficulty: 'Intermediate',
    topics: ['DAO basics', 'Voting mechanisms', 'Proposal creation']
  }
}

/**
 * Utility Functions
 */

// Format wallet address for display
export const formatWalletAddress = (address, startChars = 6, endChars = 4) => {
  if (!address) return ''
  return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`
}

// Format token amounts
export const formatTokenAmount = (amount, decimals = 18, displayDecimals = 2) => {
  if (!amount) return '0'
  const value = parseFloat(amount) / Math.pow(10, decimals)
  return value.toLocaleString(undefined, { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: displayDecimals 
  })
}

// Format USD values
export const formatUSDValue = (value) => {
  if (!value) return '$0.00'
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD' 
  }).format(value)
}

// Calculate APY
export const calculateAPY = (principal, rate, periods = 365) => {
  return principal * Math.pow((1 + rate / periods), periods) - principal
}

// Generate mock transaction hash
export const generateTxHash = () => {
  return '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')
}

// Validate Ethereum address
export const isValidEthereumAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

// Get network by chain ID
export const getNetworkByChainId = (chainId) => {
  return Object.values(SUPPORTED_NETWORKS).find(network => network.chainId === chainId)
}

// Get supported wallets for platform
export const getSupportedWallets = () => {
  return Object.values(SUPPORTED_WALLETS).filter(wallet => wallet.supported)
}

// Calculate token distribution percentages
export const calculateTokenDistribution = () => {
  const distribution = CRYB_TOKEN.distribution
  return Object.keys(distribution).map(key => ({
    category: key,
    percentage: distribution[key].percentage,
    amount: distribution[key].amount,
    description: distribution[key].description
  }))
}

// Mock Web3 connection simulation
export const simulateWalletConnection = async (walletType, delay = 2000) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        address: MOCK_USER_DATA.wallet.address,
        network: 'ethereum',
        balance: MOCK_USER_DATA.wallet.balance
      })
    }, delay)
  })
}

// Mock transaction simulation
export const simulateTransaction = async (type, amount, recipient, delay = 3000) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        txHash: generateTxHash(),
        type,
        amount,
        recipient,
        gasUsed: Math.floor(Math.random() * 50000 + 21000),
        gasFee: (Math.random() * 0.01).toFixed(6) + ' ETH',
        timestamp: new Date().toISOString()
      })
    }, delay)
  })
}

// Get feature status color
export const getFeatureStatusColor = (status) => {
  switch (status) {
    case 'Phase 1': return 'text-success'
    case 'Phase 2': return 'text-warning'
    case 'Phase 3': return 'text-info'
    case 'Phase 4': return 'text-accent-light'
    default: return 'text-muted'
  }
}

// Get complexity badge color
export const getComplexityColor = (complexity) => {
  switch (complexity) {
    case 'Low': return 'bg-success/20 text-success'
    case 'Medium': return 'bg-warning/20 text-warning'
    case 'High': return 'bg-error/20 text-error'
    case 'Very High': return 'bg-error/30 text-error'
    default: return 'bg-muted/20 text-muted'
  }
}

/**
 * Constants for UI Components
 */
export const WEB3_ICONS = {
  WALLET: '👛',
  NFT: '🖼️',
  TOKEN: '🪙',
  DEFI: '🏦',
  DAO: '🗳️',
  STAKING: '📈',
  BRIDGE: '🌉',
  ETHEREUM: '⟠',
  BITCOIN: '₿',
  SUCCESS: '✅',
  WARNING: '⚠️',
  ERROR: '❌',
  LOADING: '⏳'
}

export const ROADMAP_PHASES = {
  PHASE_1: {
    id: 'phase-1',
    title: 'Foundation',
    timeline: 'Q2 2024',
    status: 'upcoming',
    features: ['Token Launch', 'Wallet Integration', 'Basic Governance']
  },
  PHASE_2: {
    id: 'phase-2',
    title: 'Social Features',
    timeline: 'Q3 2024',
    status: 'upcoming',
    features: ['NFT Profiles', 'Token Gating', 'Creator Rewards']
  },
  PHASE_3: {
    id: 'phase-3',
    title: 'DeFi Integration',
    timeline: 'Q4 2024',
    status: 'upcoming',
    features: ['DEX Integration', 'Yield Farming', 'Cross-Chain']
  },
  PHASE_4: {
    id: 'phase-4',
    title: 'Ecosystem Growth',
    timeline: 'Q1 2025',
    status: 'planning',
    features: ['Partnership APIs', 'Advanced DAO', 'Mobile App']
  }
}

export default {
  SUPPORTED_WALLETS,
  SUPPORTED_NETWORKS,
  TOKEN_STANDARDS,
  CRYB_TOKEN,
  MOCK_USER_DATA,
  WEB3_FEATURES,
  EDUCATION_CATEGORIES,
  WEB3_ICONS,
  ROADMAP_PHASES,
  formatWalletAddress,
  formatTokenAmount,
  formatUSDValue,
  calculateAPY,
  generateTxHash,
  isValidEthereumAddress,
  getNetworkByChainId,
  getSupportedWallets,
  calculateTokenDistribution,
  simulateWalletConnection,
  simulateTransaction,
  getFeatureStatusColor,
  getComplexityColor
}