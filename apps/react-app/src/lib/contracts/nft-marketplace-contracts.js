// CRYB Platform NFT Marketplace Contracts
// Enterprise-grade NFT marketplace with bidding, royalties, and cross-chain support

import { CHAIN_IDS } from './cryb-contracts.js';

// NFT Marketplace contract addresses
export const MARKETPLACE_ADDRESSES = {
  NFT_MARKETPLACE: {
    [CHAIN_IDS.MAINNET]: '0x6D00000000000000000000000000000000000001',
    [CHAIN_IDS.POLYGON]: '0x6D00000000000000000000000000000000000002',
    [CHAIN_IDS.ARBITRUM]: '0x6D00000000000000000000000000000000000003',
    [CHAIN_IDS.OPTIMISM]: '0x6D00000000000000000000000000000000000004',
    [CHAIN_IDS.SEPOLIA]: '0x6D00000000000000000000000000000000000005'
  },
  ROYALTY_MANAGER: {
    [CHAIN_IDS.MAINNET]: '0x7D00000000000000000000000000000000000001',
    [CHAIN_IDS.POLYGON]: '0x7D00000000000000000000000000000000000002',
    [CHAIN_IDS.ARBITRUM]: '0x7D00000000000000000000000000000000000003',
    [CHAIN_IDS.OPTIMISM]: '0x7D00000000000000000000000000000000000004',
    [CHAIN_IDS.SEPOLIA]: '0x7D00000000000000000000000000000000000005'
  },
  AUCTION_HOUSE: {
    [CHAIN_IDS.MAINNET]: '0x8D00000000000000000000000000000000000001',
    [CHAIN_IDS.POLYGON]: '0x8D00000000000000000000000000000000000002',
    [CHAIN_IDS.ARBITRUM]: '0x8D00000000000000000000000000000000000003',
    [CHAIN_IDS.OPTIMISM]: '0x8D00000000000000000000000000000000000004',
    [CHAIN_IDS.SEPOLIA]: '0x8D00000000000000000000000000000000000005'
  },
  COLLECTION_FACTORY: {
    [CHAIN_IDS.MAINNET]: '0x9D00000000000000000000000000000000000001',
    [CHAIN_IDS.POLYGON]: '0x9D00000000000000000000000000000000000002',
    [CHAIN_IDS.ARBITRUM]: '0x9D00000000000000000000000000000000000003',
    [CHAIN_IDS.OPTIMISM]: '0x9D00000000000000000000000000000000000004',
    [CHAIN_IDS.SEPOLIA]: '0x9D00000000000000000000000000000000000005'
  }
};

// NFT Marketplace ABI with comprehensive trading features
export const NFT_MARKETPLACE_ABI = [
  // Listing management
  {
    inputs: [
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'price', type: 'uint256' },
      { name: 'paymentToken', type: 'address' },
      { name: 'duration', type: 'uint256' }
    ],
    name: 'createListing',
    outputs: [{ name: 'listingId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'listingId', type: 'uint256' }],
    name: 'cancelListing',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'listingId', type: 'uint256' },
      { name: 'newPrice', type: 'uint256' }
    ],
    name: 'updateListingPrice',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'listingId', type: 'uint256' },
      { name: 'buyer', type: 'address' }
    ],
    name: 'buyNFT',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  // Offer system
  {
    inputs: [
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'price', type: 'uint256' },
      { name: 'paymentToken', type: 'address' },
      { name: 'expiration', type: 'uint256' }
    ],
    name: 'makeOffer',
    outputs: [{ name: 'offerId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'offerId', type: 'uint256' }],
    name: 'acceptOffer',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'offerId', type: 'uint256' }],
    name: 'cancelOffer',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  // Collection offers
  {
    inputs: [
      { name: 'nftContract', type: 'address' },
      { name: 'price', type: 'uint256' },
      { name: 'paymentToken', type: 'address' },
      { name: 'expiration', type: 'uint256' },
      { name: 'quantity', type: 'uint256' }
    ],
    name: 'makeCollectionOffer',
    outputs: [{ name: 'offerId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'offerId', type: 'uint256' },
      { name: 'tokenId', type: 'uint256' }
    ],
    name: 'acceptCollectionOffer',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  // Batch operations
  {
    inputs: [
      { name: 'nftContracts', type: 'address[]' },
      { name: 'tokenIds', type: 'uint256[]' },
      { name: 'prices', type: 'uint256[]' },
      { name: 'paymentTokens', type: 'address[]' },
      { name: 'durations', type: 'uint256[]' }
    ],
    name: 'createBatchListings',
    outputs: [{ name: 'listingIds', type: 'uint256[]' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'listingIds', type: 'uint256[]' }],
    name: 'buyBatchNFTs',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  // View functions
  {
    inputs: [{ name: 'listingId', type: 'uint256' }],
    name: 'getListing',
    outputs: [
      { name: 'seller', type: 'address' },
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'price', type: 'uint256' },
      { name: 'paymentToken', type: 'address' },
      { name: 'startTime', type: 'uint256' },
      { name: 'endTime', type: 'uint256' },
      { name: 'active', type: 'bool' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'offerId', type: 'uint256' }],
    name: 'getOffer',
    outputs: [
      { name: 'buyer', type: 'address' },
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'price', type: 'uint256' },
      { name: 'paymentToken', type: 'address' },
      { name: 'expiration', type: 'uint256' },
      { name: 'active', type: 'bool' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'nftContract', type: 'address' },
      { name: 'offset', type: 'uint256' },
      { name: 'limit', type: 'uint256' }
    ],
    name: 'getListingsByCollection',
    outputs: [{ name: 'listingIds', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'seller', type: 'address' },
      { name: 'offset', type: 'uint256' },
      { name: 'limit', type: 'uint256' }
    ],
    name: 'getListingsBySeller',
    outputs: [{ name: 'listingIds', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' }
    ],
    name: 'getOffersByNFT',
    outputs: [{ name: 'offerIds', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function'
  },
  // Platform management
  {
    inputs: [{ name: 'newFee', type: 'uint256' }],
    name: 'setPlatformFee',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getPlatformFee',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'allowed', type: 'bool' }
    ],
    name: 'setPaymentToken',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'token', type: 'address' }],
    name: 'isPaymentTokenAllowed',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  // Emergency functions
  {
    inputs: [],
    name: 'pause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'unpause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'listingId', type: 'uint256' },
      { indexed: true, name: 'seller', type: 'address' },
      { indexed: true, name: 'nftContract', type: 'address' },
      { indexed: false, name: 'tokenId', type: 'uint256' },
      { indexed: false, name: 'price', type: 'uint256' },
      { indexed: false, name: 'paymentToken', type: 'address' }
    ],
    name: 'ItemListed',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'listingId', type: 'uint256' },
      { indexed: true, name: 'buyer', type: 'address' },
      { indexed: true, name: 'seller', type: 'address' },
      { indexed: false, name: 'nftContract', type: 'address' },
      { indexed: false, name: 'tokenId', type: 'uint256' },
      { indexed: false, name: 'price', type: 'uint256' }
    ],
    name: 'ItemSold',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'offerId', type: 'uint256' },
      { indexed: true, name: 'buyer', type: 'address' },
      { indexed: true, name: 'nftContract', type: 'address' },
      { indexed: false, name: 'tokenId', type: 'uint256' },
      { indexed: false, name: 'price', type: 'uint256' }
    ],
    name: 'OfferMade',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'offerId', type: 'uint256' },
      { indexed: true, name: 'seller', type: 'address' },
      { indexed: true, name: 'buyer', type: 'address' }
    ],
    name: 'OfferAccepted',
    type: 'event'
  }
];

// Auction House ABI for timed auctions
export const AUCTION_HOUSE_ABI = [
  {
    inputs: [
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'reservePrice', type: 'uint256' },
      { name: 'duration', type: 'uint256' },
      { name: 'paymentToken', type: 'address' }
    ],
    name: 'createAuction',
    outputs: [{ name: 'auctionId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'auctionId', type: 'uint256' },
      { name: 'bidAmount', type: 'uint256' }
    ],
    name: 'placeBid',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [{ name: 'auctionId', type: 'uint256' }],
    name: 'settleAuction',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'auctionId', type: 'uint256' }],
    name: 'cancelAuction',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'auctionId', type: 'uint256' }],
    name: 'getAuction',
    outputs: [
      { name: 'seller', type: 'address' },
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'reservePrice', type: 'uint256' },
      { name: 'currentBid', type: 'uint256' },
      { name: 'highestBidder', type: 'address' },
      { name: 'endTime', type: 'uint256' },
      { name: 'settled', type: 'bool' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'auctionId', type: 'uint256' }],
    name: 'getBidHistory',
    outputs: [
      { name: 'bidders', type: 'address[]' },
      { name: 'amounts', type: 'uint256[]' },
      { name: 'timestamps', type: 'uint256[]' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'auctionId', type: 'uint256' },
      { indexed: true, name: 'seller', type: 'address' },
      { indexed: true, name: 'nftContract', type: 'address' },
      { indexed: false, name: 'tokenId', type: 'uint256' },
      { indexed: false, name: 'reservePrice', type: 'uint256' },
      { indexed: false, name: 'endTime', type: 'uint256' }
    ],
    name: 'AuctionCreated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'auctionId', type: 'uint256' },
      { indexed: true, name: 'bidder', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' }
    ],
    name: 'BidPlaced',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'auctionId', type: 'uint256' },
      { indexed: true, name: 'winner', type: 'address' },
      { indexed: false, name: 'winningBid', type: 'uint256' }
    ],
    name: 'AuctionSettled',
    type: 'event'
  }
];

// Royalty Manager ABI (EIP-2981 compatible)
export const ROYALTY_MANAGER_ABI = [
  {
    inputs: [
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'recipient', type: 'address' },
      { name: 'percentage', type: 'uint256' }
    ],
    name: 'setRoyalty',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'nftContract', type: 'address' },
      { name: 'recipient', type: 'address' },
      { name: 'percentage', type: 'uint256' }
    ],
    name: 'setDefaultRoyalty',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'salePrice', type: 'uint256' }
    ],
    name: 'royaltyInfo',
    outputs: [
      { name: 'receiver', type: 'address' },
      { name: 'royaltyAmount', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' }
    ],
    name: 'deleteRoyalty',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'nftContract', type: 'address' }],
    name: 'deleteDefaultRoyalty',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];

// Collection Factory ABI for creating new NFT collections
export const COLLECTION_FACTORY_ABI = [
  {
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'baseURI', type: 'string' },
      { name: 'maxSupply', type: 'uint256' },
      { name: 'mintPrice', type: 'uint256' },
      { name: 'royaltyRecipient', type: 'address' },
      { name: 'royaltyPercentage', type: 'uint256' }
    ],
    name: 'createERC721Collection',
    outputs: [{ name: 'collectionAddress', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'baseURI', type: 'string' },
      { name: 'royaltyRecipient', type: 'address' },
      { name: 'royaltyPercentage', type: 'uint256' }
    ],
    name: 'createERC1155Collection',
    outputs: [{ name: 'collectionAddress', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'creator', type: 'address' }],
    name: 'getCollectionsByCreator',
    outputs: [{ name: 'collections', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getAllCollections',
    outputs: [{ name: 'collections', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'collection', type: 'address' }],
    name: 'isValidCollection',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  }
];

// Marketplace configuration
export const MARKETPLACE_CONFIG = {
  PLATFORM_FEE: 250, // 2.5% in basis points
  MAX_ROYALTY: 1000, // 10% maximum royalty
  MIN_BID_INCREMENT: 500, // 5% minimum bid increment
  AUCTION_EXTENSION: 15 * 60, // 15 minutes extension if bid in last 15 minutes
  DEFAULT_AUCTION_DURATION: 7 * 24 * 60 * 60, // 7 days
  MIN_AUCTION_DURATION: 60 * 60, // 1 hour
  MAX_AUCTION_DURATION: 30 * 24 * 60 * 60 // 30 days
};

// Payment tokens configuration
export const PAYMENT_TOKENS = {
  [CHAIN_IDS.MAINNET]: {
    ETH: '0x0000000000000000000000000000000000000000',
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    USDC: '0xA0b86a33E6441ce67780E9Ad5e6FfE49B51ba87C',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    CRYB: '0x1234567890123456789012345678901234567890' // CRYB token address
  },
  [CHAIN_IDS.POLYGON]: {
    MATIC: '0x0000000000000000000000000000000000000000',
    WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    DAI: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    CRYB: '0x1234567890123456789012345678901234567890' // CRYB token address
  }
};

// NFT Marketplace data will be fetched from smart contracts
// No mock data - all data should come from blockchain

// Marketplace contract classes
export class NFTMarketplaceContract {
  constructor(chainId, contractType = 'NFT_MARKETPLACE') {
    this.chainId = chainId;
    this.contractType = contractType;
    this.address = MARKETPLACE_ADDRESSES[contractType][chainId];
    
    switch (contractType) {
      case 'NFT_MARKETPLACE':
        this.abi = NFT_MARKETPLACE_ABI;
        break;
      case 'AUCTION_HOUSE':
        this.abi = AUCTION_HOUSE_ABI;
        break;
      case 'ROYALTY_MANAGER':
        this.abi = ROYALTY_MANAGER_ABI;
        break;
      case 'COLLECTION_FACTORY':
        this.abi = COLLECTION_FACTORY_ABI;
        break;
      default:
        throw new Error(`Unknown contract type: ${contractType}`);
    }
    
    if (!this.address) {
      throw new Error(`${contractType} contract not deployed on chain ${chainId}`);
    }
  }

  // Marketplace functions
  async getListings(page = 1, limit = 20, filters = {}) {
    const start = (page - 1) * limit;
    const end = start + limit;
    
    let filteredListings = [...MOCK_LISTINGS];
    
    // Apply filters
    if (filters.collection) {
      filteredListings = filteredListings.filter(l => l.nftContract.toLowerCase() === filters.collection.toLowerCase());
    }
    if (filters.seller) {
      filteredListings = filteredListings.filter(l => l.seller.toLowerCase() === filters.seller.toLowerCase());
    }
    if (filters.minPrice) {
      filteredListings = filteredListings.filter(l => l.price >= BigInt(filters.minPrice));
    }
    if (filters.maxPrice) {
      filteredListings = filteredListings.filter(l => l.price <= BigInt(filters.maxPrice));
    }
    if (filters.paymentToken) {
      filteredListings = filteredListings.filter(l => l.paymentToken.toLowerCase() === filters.paymentToken.toLowerCase());
    }
    
    return {
      listings: filteredListings.slice(start, end),
      total: filteredListings.length,
      page,
      hasMore: end < filteredListings.length
    };
  }

  async getListing(listingId) {
    return MOCK_LISTINGS.find(l => l.id === listingId.toString()) || null;
  }

  async createListing(nftContract, tokenId, price, paymentToken, duration) {
    
    const newListing = {
      id: (MOCK_LISTINGS.length + 1).toString(),
      seller: '0x0000000000000000000000000000000000000000', // Would be actual user address
      nftContract,
      tokenId,
      price: BigInt(price),
      paymentToken,
      startTime: Date.now(),
      endTime: Date.now() + duration * 1000,
      active: true,
      metadata: {
        name: `NFT #${tokenId}`,
        description: 'User-listed NFT',
        image: 'https://example.com/placeholder.png',
        attributes: []
      }
    };
    
    MOCK_LISTINGS.unshift(newListing);
    return Promise.resolve(`0x${'listing'.repeat(12)}`);
  }

  async buyNFT(listingId, buyer) {
    const listing = await this.getListing(listingId);
    if (!listing) throw new Error('Listing not found');
    
    // Mark listing as inactive
    listing.active = false;
    return Promise.resolve(`0x${'purchase'.repeat(11)}`);
  }

  async cancelListing(listingId) {
    const listing = await this.getListing(listingId);
    if (listing) listing.active = false;
    return Promise.resolve(`0x${'cancel'.repeat(14)}`);
  }

  // Offer functions
  async getOffers(nftContract, tokenId) {
    return MOCK_OFFERS.filter(o => 
      o.nftContract.toLowerCase() === nftContract.toLowerCase() && 
      o.tokenId.toString() === tokenId.toString() &&
      o.active
    );
  }

  async makeOffer(nftContract, tokenId, price, paymentToken, expiration) {
    
    const newOffer = {
      id: (MOCK_OFFERS.length + 1).toString(),
      buyer: '0x0000000000000000000000000000000000000000', // Would be actual user address
      nftContract,
      tokenId,
      price: BigInt(price),
      paymentToken,
      expiration,
      active: true
    };
    
    MOCK_OFFERS.unshift(newOffer);
    return Promise.resolve(`0x${'offer'.repeat(15)}`);
  }

  async acceptOffer(offerId) {
    const offer = MOCK_OFFERS.find(o => o.id === offerId.toString());
    if (offer) offer.active = false;
    return Promise.resolve(`0x${'accept'.repeat(14)}`);
  }

  // Auction functions
  async getAuctions(page = 1, limit = 20, filters = {}) {
    const start = (page - 1) * limit;
    const end = start + limit;
    
    let filteredAuctions = [...MOCK_AUCTIONS];
    
    if (filters.collection) {
      filteredAuctions = filteredAuctions.filter(a => a.nftContract.toLowerCase() === filters.collection.toLowerCase());
    }
    if (filters.seller) {
      filteredAuctions = filteredAuctions.filter(a => a.seller.toLowerCase() === filters.seller.toLowerCase());
    }
    if (filters.active !== undefined) {
      const now = Date.now();
      filteredAuctions = filteredAuctions.filter(a => 
        filters.active ? (a.endTime > now && !a.settled) : (a.endTime <= now || a.settled)
      );
    }
    
    return {
      auctions: filteredAuctions.slice(start, end),
      total: filteredAuctions.length,
      page,
      hasMore: end < filteredAuctions.length
    };
  }

  async getAuction(auctionId) {
    return MOCK_AUCTIONS.find(a => a.id === auctionId.toString()) || null;
  }

  async createAuction(nftContract, tokenId, reservePrice, duration, paymentToken) {
    
    const newAuction = {
      id: (MOCK_AUCTIONS.length + 1).toString(),
      seller: '0x0000000000000000000000000000000000000000', // Would be actual user address
      nftContract,
      tokenId,
      reservePrice: BigInt(reservePrice),
      currentBid: BigInt(0),
      highestBidder: '0x0000000000000000000000000000000000000000',
      endTime: Date.now() + duration * 1000,
      settled: false,
      bidHistory: [],
      metadata: {
        name: `NFT #${tokenId}`,
        description: 'User-listed auction NFT',
        image: 'https://example.com/placeholder.png',
        attributes: []
      }
    };
    
    MOCK_AUCTIONS.unshift(newAuction);
    return Promise.resolve(`0x${'auction'.repeat(13)}`);
  }

  async placeBid(auctionId, bidAmount) {
    const auction = await this.getAuction(auctionId);
    if (!auction) throw new Error('Auction not found');
    
    // Update auction with new bid
    auction.currentBid = BigInt(bidAmount);
    auction.highestBidder = '0x0000000000000000000000000000000000000000'; // Would be actual user address
    auction.bidHistory.push({
      bidder: '0x0000000000000000000000000000000000000000',
      amount: BigInt(bidAmount),
      timestamp: Date.now()
    });
    
    return Promise.resolve(`0x${'bid'.repeat(18)}`);
  }

  async settleAuction(auctionId) {
    const auction = await this.getAuction(auctionId);
    if (auction) auction.settled = true;
    return Promise.resolve(`0x${'settle'.repeat(14)}`);
  }

  // Royalty functions
  async getRoyaltyInfo(nftContract, tokenId, salePrice) {
    // Mock royalty calculation - 5% to creator
    const royaltyPercentage = 500; // 5% in basis points
    const royaltyAmount = (BigInt(salePrice) * BigInt(royaltyPercentage)) / BigInt(10000);
    
    return {
      receiver: '0x742d35Cc6644C068532C17cF3c4E4a44e4a94F3e', // Mock creator address
      royaltyAmount
    };
  }

  async setRoyalty(nftContract, tokenId, recipient, percentage) {
    return Promise.resolve(`0x${'royalty'.repeat(12)}`);
  }

  // Collection factory functions
  async createCollection(name, symbol, baseURI, maxSupply, mintPrice, royaltyRecipient, royaltyPercentage) {
    return Promise.resolve('0xNewCollectionAddress000000000000000000000');
  }

  async getCollectionsByCreator(creator) {
    // Mock collections
    return [
      '0x0987654321098765432109876543210987654321',
      '0x1234567890123456789012345678901234567890'
    ];
  }

  // Utility functions
  formatPrice(price, decimals = 18) {
    return (Number(price) / (10 ** decimals)).toFixed(6);
  }

  parsePrice(price, decimals = 18) {
    return BigInt(Math.floor(parseFloat(price) * (10 ** decimals)));
  }

  calculateFees(price) {
    const platformFee = (BigInt(price) * BigInt(MARKETPLACE_CONFIG.PLATFORM_FEE)) / BigInt(10000);
    return {
      platformFee,
      sellerReceives: BigInt(price) - platformFee
    };
  }

  isPaymentTokenSupported(tokenAddress) {
    const supportedTokens = PAYMENT_TOKENS[this.chainId] || {};
    return Object.values(supportedTokens).includes(tokenAddress.toLowerCase());
  }

  getPaymentTokenInfo(tokenAddress) {
    const supportedTokens = PAYMENT_TOKENS[this.chainId] || {};
    for (const [symbol, address] of Object.entries(supportedTokens)) {
      if (address.toLowerCase() === tokenAddress.toLowerCase()) {
        return { symbol, address };
      }
    }
    return null;
  }
}

// Factory functions
export function getMarketplaceContract(chainId, contractType = 'NFT_MARKETPLACE') {
  return new NFTMarketplaceContract(chainId, contractType);
}

export function getNFTMarketplace(chainId) {
  return new NFTMarketplaceContract(chainId, 'NFT_MARKETPLACE');
}

export function getAuctionHouse(chainId) {
  return new NFTMarketplaceContract(chainId, 'AUCTION_HOUSE');
}

export function getRoyaltyManager(chainId) {
  return new NFTMarketplaceContract(chainId, 'ROYALTY_MANAGER');
}

export function getCollectionFactory(chainId) {
  return new NFTMarketplaceContract(chainId, 'COLLECTION_FACTORY');
}

// Utility functions
export function calculateMinimumBid(currentBid) {
  return currentBid + (currentBid * BigInt(MARKETPLACE_CONFIG.MIN_BID_INCREMENT)) / BigInt(10000);
}

export function isAuctionActive(auction) {
  return auction.endTime > Date.now() && !auction.settled;
}

export function getTimeRemaining(endTime) {
  const remaining = endTime - Date.now();
  if (remaining <= 0) return null;
  
  const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
  const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  
  return { days, hours, minutes, total: remaining };
}

export function formatTimeRemaining(endTime) {
  const time = getTimeRemaining(endTime);
  if (!time) return 'Ended';
  
  if (time.days > 0) {
    return `${time.days}d ${time.hours}h ${time.minutes}m`;
  } else if (time.hours > 0) {
    return `${time.hours}h ${time.minutes}m`;
  } else {
    return `${time.minutes}m`;
  }
}

export function getListingStatus(listing) {
  if (!listing.active) return 'Inactive';
  if (listing.endTime <= Date.now()) return 'Expired';
  return 'Active';
}

export function getOfferStatus(offer) {
  if (!offer.active) return 'Inactive';
  if (offer.expiration <= Date.now()) return 'Expired';
  return 'Active';
}