/**
 * useNFT Hooks
 * React Query hooks for NFT and wallet data
 */

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { nftService } from '../../services/api/nftService';

/**
 * Get user's NFTs (infinite scroll)
 */
export const useUserNFTsQuery = (walletAddress: string, chainId?: number) => {
  return useInfiniteQuery({
    queryKey: ['nft', 'wallet', walletAddress, chainId],
    queryFn: ({ pageParam }) => nftService.getUserNFTs(walletAddress, chainId, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: !!walletAddress,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Get single NFT
 */
export const useNFTQuery = (contractAddress: string, tokenId: string, chainId: number) => {
  return useQuery({
    queryKey: ['nft', chainId, contractAddress, tokenId],
    queryFn: () => nftService.getNFT(contractAddress, tokenId, chainId),
    enabled: !!contractAddress && !!tokenId && !!chainId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Get NFTs from collection (infinite scroll)
 */
export const useCollectionNFTsQuery = (contractAddress: string, chainId: number) => {
  return useInfiniteQuery({
    queryKey: ['nft', 'collection', chainId, contractAddress],
    queryFn: ({ pageParam }) => nftService.getCollectionNFTs(contractAddress, chainId, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: !!contractAddress && !!chainId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Get token balances
 */
export const useTokenBalancesQuery = (walletAddress: string, chainId?: number) => {
  return useQuery({
    queryKey: ['wallet', walletAddress, 'tokens', chainId],
    queryFn: () => nftService.getTokenBalances(walletAddress, chainId),
    enabled: !!walletAddress,
    staleTime: 30 * 1000, // 30 seconds - balances need fresh data
    refetchInterval: 60 * 1000, // Poll every minute
  });
};

/**
 * Get native balance
 */
export const useNativeBalanceQuery = (walletAddress: string, chainId: number) => {
  return useQuery({
    queryKey: ['wallet', walletAddress, 'balance', chainId],
    queryFn: () => nftService.getNativeBalance(walletAddress, chainId),
    enabled: !!walletAddress && !!chainId,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
};

/**
 * Get transactions (infinite scroll)
 */
export const useTransactionsQuery = (walletAddress: string, chainId?: number) => {
  return useInfiniteQuery({
    queryKey: ['wallet', walletAddress, 'transactions', chainId],
    queryFn: ({ pageParam }) => nftService.getTransactions(walletAddress, chainId, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: !!walletAddress,
    staleTime: 30 * 1000,
  });
};

/**
 * Search NFTs (infinite scroll)
 */
export const useSearchNFTsQuery = (query: string, filters?: {
  chainId?: number;
  minPrice?: string;
  maxPrice?: string;
}) => {
  return useInfiniteQuery({
    queryKey: ['nft', 'search', query, filters],
    queryFn: ({ pageParam }) => nftService.searchNFTs(query, { ...filters, cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: query.length > 0,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Get trending collections
 */
export const useTrendingCollectionsQuery = (timeframe: '24h' | '7d' | '30d' = '24h') => {
  return useQuery({
    queryKey: ['nft', 'trending', timeframe],
    queryFn: () => nftService.getTrendingCollections(timeframe),
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * Get NFT floor price
 */
export const useFloorPriceQuery = (contractAddress: string, chainId: number) => {
  return useQuery({
    queryKey: ['nft', 'floor', chainId, contractAddress],
    queryFn: () => nftService.getFloorPrice(contractAddress, chainId),
    enabled: !!contractAddress && !!chainId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Verify NFT ownership
 */
export const useVerifyOwnershipQuery = (
  walletAddress: string,
  contractAddress: string,
  tokenId: string,
  chainId: number
) => {
  return useQuery({
    queryKey: ['nft', 'verify', chainId, contractAddress, tokenId, walletAddress],
    queryFn: () => nftService.verifyOwnership(walletAddress, contractAddress, tokenId, chainId),
    enabled: !!walletAddress && !!contractAddress && !!tokenId && !!chainId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Get portfolio summary
 */
export const usePortfolioSummaryQuery = (walletAddress: string) => {
  return useQuery({
    queryKey: ['wallet', walletAddress, 'portfolio'],
    queryFn: () => nftService.getPortfolioSummary(walletAddress),
    enabled: !!walletAddress,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

/**
 * Resolve ENS name
 */
export const useResolveENSQuery = (ensName: string) => {
  return useQuery({
    queryKey: ['wallet', 'ens', ensName],
    queryFn: () => nftService.resolveENS(ensName),
    enabled: !!ensName && ensName.endsWith('.eth'),
    staleTime: 30 * 60 * 1000, // 30 minutes - ENS doesn't change often
  });
};

/**
 * Reverse resolve address to ENS
 */
export const useReverseResolveENSQuery = (address: string) => {
  return useQuery({
    queryKey: ['wallet', 'address', address, 'ens'],
    queryFn: () => nftService.reverseResolveENS(address),
    enabled: !!address && address.startsWith('0x'),
    staleTime: 30 * 60 * 1000,
  });
};

export default {
  useUserNFTsQuery,
  useNFTQuery,
  useCollectionNFTsQuery,
  useTokenBalancesQuery,
  useNativeBalanceQuery,
  useTransactionsQuery,
  useSearchNFTsQuery,
  useTrendingCollectionsQuery,
  useFloorPriceQuery,
  useVerifyOwnershipQuery,
  usePortfolioSummaryQuery,
  useResolveENSQuery,
  useReverseResolveENSQuery,
};
