/**
 * useSearch Hooks
 * React Query hooks for search API
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { searchService, SearchFilters } from '../../services/api/searchService';
import { toast } from '../../stores/uiStore';
import { getErrorMessage } from '../../utils/errorUtils';

/**
 * Universal search (infinite scroll)
 */
export const useSearchQuery = (query: string, filters?: SearchFilters) => {
  return useInfiniteQuery({
    queryKey: ['search', query, filters],
    queryFn: ({ pageParam }) => searchService.search(query, { ...filters, cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: query.length > 0,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Search users (infinite scroll)
 */
export const useSearchUsersQuery = (query: string, filters?: { verified?: boolean }) => {
  return useInfiniteQuery({
    queryKey: ['search', 'users', query, filters],
    queryFn: ({ pageParam }) => searchService.searchUsers(query, { ...filters, cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: query.length > 0,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Search posts (infinite scroll)
 */
export const useSearchPostsQuery = (query: string, filters?: {
  dateFrom?: string;
  dateTo?: string;
  hasMedia?: boolean;
}) => {
  return useInfiniteQuery({
    queryKey: ['search', 'posts', query, filters],
    queryFn: ({ pageParam }) => searchService.searchPosts(query, { ...filters, cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: query.length > 0,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Search communities (infinite scroll)
 */
export const useSearchCommunitiesQuery = (query: string, filters?: { type?: string }) => {
  return useInfiniteQuery({
    queryKey: ['search', 'communities', query, filters],
    queryFn: ({ pageParam }) => searchService.searchCommunities(query, { ...filters, cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: query.length > 0,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Search tags (infinite scroll)
 */
export const useSearchTagsQuery = (query: string) => {
  return useInfiniteQuery({
    queryKey: ['search', 'tags', query],
    queryFn: ({ pageParam }) => searchService.searchTags(query, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: query.length > 0,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Get trending tags
 */
export const useTrendingTagsQuery = (limit: number = 10) => {
  return useQuery({
    queryKey: ['search', 'tags', 'trending', limit],
    queryFn: () => searchService.getTrendingTags(limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Get search suggestions (autocomplete)
 */
export const useSuggestionsQuery = (query: string, type?: 'user' | 'community' | 'tag') => {
  return useQuery({
    queryKey: ['search', 'suggestions', query, type],
    queryFn: () => searchService.getSuggestions(query, type),
    enabled: query.length > 1, // Only search after 2+ characters
    staleTime: 30 * 1000, // 30 seconds
  });
};

/**
 * Get recent searches
 */
export const useRecentSearchesQuery = () => {
  return useQuery({
    queryKey: ['search', 'recent'],
    queryFn: () => searchService.getRecentSearches(),
    staleTime: 60 * 1000, // 1 minute
  });
};

/**
 * Get popular searches
 */
export const usePopularSearchesQuery = (limit: number = 10) => {
  return useQuery({
    queryKey: ['search', 'popular', limit],
    queryFn: () => searchService.getPopularSearches(limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Save search mutation
 */
export const useSaveSearch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ query, type }: { query: string; type: string }) =>
      searchService.saveSearch(query, type),
    onSuccess: () => {
      // Invalidate recent searches
      queryClient.invalidateQueries({ queryKey: ['search', 'recent'] });
    },
  });
};

/**
 * Clear search history mutation
 */
export const useClearSearchHistory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => searchService.clearHistory(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search', 'recent'] });

      toast.success('Search history cleared');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to clear search history'));
    },
  });
};

export default {
  useSearchQuery,
  useSearchUsersQuery,
  useSearchPostsQuery,
  useSearchCommunitiesQuery,
  useSearchTagsQuery,
  useTrendingTagsQuery,
  useSuggestionsQuery,
  useRecentSearchesQuery,
  usePopularSearchesQuery,
  useSaveSearch,
  useClearSearchHistory,
};
