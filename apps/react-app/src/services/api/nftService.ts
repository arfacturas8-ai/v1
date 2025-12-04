/**
 * NFT Service
 * API methods for NFTs, wallet assets, and blockchain data
 */

import { api } from '../../lib/apiClient';

// Types
export interface NFT {
  id: string;
  tokenId: string;
  contractAddress: string;
  chainId: number;
  name: string;
  description?: string;
  imageUrl?: string;
  animationUrl?: string;
  externalUrl?: string;
  attributes?: { trait_type: string; value: string | number }[];
  collection?: {
    name: string;
    imageUrl?: string;
    verified: boolean;
  };
  owner: string;
  creator?: string;
  price?: {
    amount: string;
    currency: string;
    usd: number;
  };
  lastSale?: {
    amount: string;
    currency: string;
    timestamp: string;
  };
  metadata?: any;
}

export interface Token {
  address: string;
  chainId: number;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceFormatted: string;
  price?: {
    usd: number;
    change24h: number;
  };
  value?: {
    usd: number;
  };
  logo?: string;
}

export interface Transaction {
  hash: string;
  chainId: number;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  timestamp: string;
  status: 'success' | 'failed' | 'pending';
  type: 'send' | 'receive' | 'swap' | 'mint' | 'approve' | 'contract';
  token?: {
    symbol: string;
    address: string;
  };
}

export interface NFTsResponse {
  nfts: NFT[];
  nextCursor?: string;
  hasMore: boolean;
  total: number;
}

export interface TokensResponse {
  tokens: Token[];
  totalValue: {
    usd: number;
  };
}

export interface TransactionsResponse {
  transactions: Transaction[];
  nextCursor?: string;
  hasMore: boolean;
}

// NFT Service
export const nftService = {
  /**
   * Get user's NFTs
   */
  async getUserNFTs(walletAddress: string, chainId?: number, cursor?: string): Promise<NFTsResponse> {
    const params = new URLSearchParams();
    if (chainId) params.append('chainId', chainId.toString());
    if (cursor) params.append('cursor', cursor);

    const queryString = params.toString();
    const url = `/nft/wallet/${walletAddress}${queryString ? `?${queryString}` : ''}`;

    return api.get<NFTsResponse>(url);
  },

  /**
   * Get NFT by contract address and token ID
   */
  async getNFT(contractAddress: string, tokenId: string, chainId: number): Promise<NFT> {
    return api.get<NFT>(`/nft/${chainId}/${contractAddress}/${tokenId}`);
  },

  /**
   * Get NFTs from collection
   */
  async getCollectionNFTs(contractAddress: string, chainId: number, cursor?: string): Promise<NFTsResponse> {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);

    const queryString = params.toString();
    const url = `/nft/collection/${chainId}/${contractAddress}${queryString ? `?${queryString}` : ''}`;

    return api.get<NFTsResponse>(url);
  },

  /**
   * Get user's token balances
   */
  async getTokenBalances(walletAddress: string, chainId?: number): Promise<TokensResponse> {
    const params = new URLSearchParams();
    if (chainId) params.append('chainId', chainId.toString());

    const queryString = params.toString();
    const url = `/wallet/${walletAddress}/tokens${queryString ? `?${queryString}` : ''}`;

    return api.get<TokensResponse>(url);
  },

  /**
   * Get user's transaction history
   */
  async getTransactions(walletAddress: string, chainId?: number, cursor?: string): Promise<TransactionsResponse> {
    const params = new URLSearchParams();
    if (chainId) params.append('chainId', chainId.toString());
    if (cursor) params.append('cursor', cursor);

    const queryString = params.toString();
    const url = `/wallet/${walletAddress}/transactions${queryString ? `?${queryString}` : ''}`;

    return api.get<TransactionsResponse>(url);
  },

  /**
   * Get native balance (ETH, MATIC, etc.)
   */
  async getNativeBalance(walletAddress: string, chainId: number): Promise<{
    balance: string;
    balanceFormatted: string;
    value: { usd: number };
  }> {
    return api.get(`/wallet/${walletAddress}/balance/${chainId}`);
  },

  /**
   * Search NFTs
   */
  async searchNFTs(query: string, filters?: {
    chainId?: number;
    minPrice?: string;
    maxPrice?: string;
    cursor?: string;
  }): Promise<NFTsResponse> {
    const params = new URLSearchParams();
    params.append('q', query);

    if (filters?.chainId) params.append('chainId', filters.chainId.toString());
    if (filters?.minPrice) params.append('minPrice', filters.minPrice);
    if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters?.cursor) params.append('cursor', filters.cursor);

    return api.get<NFTsResponse>(`/nft/search?${params.toString()}`);
  },

  /**
   * Get trending NFT collections
   */
  async getTrendingCollections(timeframe: '24h' | '7d' | '30d' = '24h'): Promise<{
    collections: {
      address: string;
      chainId: number;
      name: string;
      imageUrl?: string;
      floorPrice: { amount: string; currency: string };
      volume: { amount: string; currency: string };
      change: number;
    }[];
  }> {
    return api.get(`/nft/trending?timeframe=${timeframe}`);
  },

  /**
   * Get NFT floor price
   */
  async getFloorPrice(contractAddress: string, chainId: number): Promise<{
    floorPrice: { amount: string; currency: string; usd: number };
  }> {
    return api.get(`/nft/floor/${chainId}/${contractAddress}`);
  },

  /**
   * Verify NFT ownership
   */
  async verifyOwnership(walletAddress: string, contractAddress: string, tokenId: string, chainId: number): Promise<{
    isOwner: boolean;
  }> {
    return api.get(`/nft/verify/${chainId}/${contractAddress}/${tokenId}/${walletAddress}`);
  },

  /**
   * Get portfolio summary
   */
  async getPortfolioSummary(walletAddress: string): Promise<{
    totalValue: { usd: number };
    nftsCount: number;
    tokensCount: number;
    chains: number[];
    breakdown: {
      nfts: { usd: number };
      tokens: { usd: number };
      native: { usd: number };
    };
  }> {
    return api.get(`/wallet/${walletAddress}/portfolio`);
  },

  /**
   * Resolve ENS name
   */
  async resolveENS(ensName: string): Promise<{ address: string; avatar?: string }> {
    return api.get(`/wallet/ens/${ensName}`);
  },

  /**
   * Reverse resolve address to ENS
   */
  async reverseResolveENS(address: string): Promise<{ ensName?: string; avatar?: string }> {
    return api.get(`/wallet/address/${address}/ens`);
  },
};

export default nftService;
