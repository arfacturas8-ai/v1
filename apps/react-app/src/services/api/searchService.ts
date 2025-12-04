/**
 * Search Service
 * API methods for universal search across all content types
 */

import { api } from '../../lib/apiClient';

// Types
export interface SearchResult {
  type: 'user' | 'post' | 'community' | 'tag';
  id: string;
  score: number;
  highlight?: string;
  item: any;
}

export interface SearchResponse {
  results: SearchResult[];
  nextCursor?: string;
  hasMore: boolean;
  total: number;
  facets?: {
    users: number;
    posts: number;
    communities: number;
    tags: number;
  };
}

export interface SearchFilters {
  type?: 'user' | 'post' | 'community' | 'tag' | 'all';
  dateFrom?: string;
  dateTo?: string;
  verified?: boolean;
  hasMedia?: boolean;
  cursor?: string;
  limit?: number;
}

// Search Service
export const searchService = {
  /**
   * Universal search across all content types
   */
  async search(query: string, filters?: SearchFilters): Promise<SearchResponse> {
    const params = new URLSearchParams();
    params.append('q', query);

    if (filters?.type && filters.type !== 'all') params.append('type', filters.type);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.verified !== undefined) params.append('verified', filters.verified.toString());
    if (filters?.hasMedia !== undefined) params.append('hasMedia', filters.hasMedia.toString());
    if (filters?.cursor) params.append('cursor', filters.cursor);
    if (filters?.limit) params.append('limit', filters.limit.toString());

    return api.get<SearchResponse>(`/search?${params.toString()}`);
  },

  /**
   * Search users
   */
  async searchUsers(query: string, filters?: { verified?: boolean; cursor?: string }): Promise<{
    users: any[];
    nextCursor?: string;
    hasMore: boolean;
  }> {
    const params = new URLSearchParams();
    params.append('q', query);

    if (filters?.verified !== undefined) params.append('verified', filters.verified.toString());
    if (filters?.cursor) params.append('cursor', filters.cursor);

    return api.get(`/search/users?${params.toString()}`);
  },

  /**
   * Search posts
   */
  async searchPosts(query: string, filters?: {
    dateFrom?: string;
    dateTo?: string;
    hasMedia?: boolean;
    cursor?: string;
  }): Promise<{
    posts: any[];
    nextCursor?: string;
    hasMore: boolean;
  }> {
    const params = new URLSearchParams();
    params.append('q', query);

    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.hasMedia !== undefined) params.append('hasMedia', filters.hasMedia.toString());
    if (filters?.cursor) params.append('cursor', filters.cursor);

    return api.get(`/search/posts?${params.toString()}`);
  },

  /**
   * Search communities
   */
  async searchCommunities(query: string, filters?: { type?: string; cursor?: string }): Promise<{
    communities: any[];
    nextCursor?: string;
    hasMore: boolean;
  }> {
    const params = new URLSearchParams();
    params.append('q', query);

    if (filters?.type) params.append('type', filters.type);
    if (filters?.cursor) params.append('cursor', filters.cursor);

    return api.get(`/search/communities?${params.toString()}`);
  },

  /**
   * Search tags/hashtags
   */
  async searchTags(query: string, cursor?: string): Promise<{
    tags: { name: string; count: number }[];
    nextCursor?: string;
    hasMore: boolean;
  }> {
    const params = new URLSearchParams();
    params.append('q', query);
    if (cursor) params.append('cursor', cursor);

    return api.get(`/search/tags?${params.toString()}`);
  },

  /**
   * Get trending tags
   */
  async getTrendingTags(limit: number = 10): Promise<{
    tags: { name: string; count: number; trend: number }[];
  }> {
    return api.get(`/search/tags/trending?limit=${limit}`);
  },

  /**
   * Get search suggestions (autocomplete)
   */
  async getSuggestions(query: string, type?: 'user' | 'community' | 'tag'): Promise<{
    suggestions: { type: string; value: string; label: string }[];
  }> {
    const params = new URLSearchParams();
    params.append('q', query);
    if (type) params.append('type', type);

    return api.get(`/search/suggestions?${params.toString()}`);
  },

  /**
   * Get recent searches for current user
   */
  async getRecentSearches(): Promise<{
    searches: { query: string; type: string; timestamp: string }[];
  }> {
    return api.get('/search/recent');
  },

  /**
   * Save search to history
   */
  async saveSearch(query: string, type: string): Promise<{ success: boolean }> {
    return api.post<{ success: boolean }>('/search/history', {
      query,
      type,
    });
  },

  /**
   * Clear search history
   */
  async clearHistory(): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>('/search/history');
  },

  /**
   * Get popular searches
   */
  async getPopularSearches(limit: number = 10): Promise<{
    searches: { query: string; count: number }[];
  }> {
    return api.get(`/search/popular?limit=${limit}`);
  },
};

export default searchService;
