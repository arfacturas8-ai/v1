/**
 * React Query Client Configuration
 * Centralized query client with caching, retries, and error handling
 */

import { QueryClient } from '@tanstack/react-query';
import { toast } from '../stores/uiStore';
import { APP_CONSTANTS } from '../config/constants';
import { getErrorMessage } from '../utils/errorUtils';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time - Data is considered fresh for 5 minutes
      staleTime: APP_CONSTANTS.CACHE_MEDIUM,

      // Cache time - Unused data is garbage collected after 30 minutes
      gcTime: APP_CONSTANTS.CACHE_LONG,

      // Retry configuration
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },

      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch on window focus for important data
      refetchOnWindowFocus: false,

      // Refetch on reconnect
      refetchOnReconnect: true,

      // Refetch on mount
      refetchOnMount: true,

      // Error handling
      onError: (error: any) => {
        console.error('Query error:', error);
      },
    },

    mutations: {
      // Retry mutations once
      retry: 1,

      // Error handling
      onError: (error: any) => {
        console.error('Mutation error:', error);
        toast.error(getErrorMessage(error, 'Something went wrong'));
      },
    },
  },
});

// Query keys factory for consistent key management
export const queryKeys = {
  // Auth
  auth: {
    user: () => ['auth', 'user'] as const,
    session: () => ['auth', 'session'] as const,
  },

  // Posts
  posts: {
    all: () => ['posts'] as const,
    list: (filters?: any) => ['posts', 'list', filters] as const,
    detail: (id: string) => ['posts', 'detail', id] as const,
    feed: (type: string) => ['posts', 'feed', type] as const,
    user: (userId: string) => ['posts', 'user', userId] as const,
    trending: () => ['posts', 'trending'] as const,
  },

  // Users
  users: {
    all: () => ['users'] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
    profile: (username: string) => ['users', 'profile', username] as const,
    followers: (id: string) => ['users', 'followers', id] as const,
    following: (id: string) => ['users', 'following', id] as const,
    suggestions: () => ['users', 'suggestions'] as const,
  },

  // Communities
  communities: {
    all: () => ['communities'] as const,
    list: (filters?: any) => ['communities', 'list', filters] as const,
    detail: (slug: string) => ['communities', 'detail', slug] as const,
    members: (slug: string) => ['communities', 'members', slug] as const,
    posts: (slug: string) => ['communities', 'posts', slug] as const,
  },

  // Messages
  messages: {
    all: () => ['messages'] as const,
    conversations: () => ['messages', 'conversations'] as const,
    conversation: (id: string) => ['messages', 'conversation', id] as const,
    requests: () => ['messages', 'requests'] as const,
  },

  // Notifications
  notifications: {
    all: () => ['notifications'] as const,
    list: (filters?: any) => ['notifications', 'list', filters] as const,
    unreadCount: () => ['notifications', 'unreadCount'] as const,
  },

  // NFTs
  nfts: {
    all: () => ['nfts'] as const,
    detail: (id: string) => ['nfts', 'detail', id] as const,
    owned: (address: string) => ['nfts', 'owned', address] as const,
    collection: (id: string) => ['nfts', 'collection', id] as const,
  },

  // Wallet
  wallet: {
    balance: (address: string) => ['wallet', 'balance', address] as const,
    transactions: (address: string) => ['wallet', 'transactions', address] as const,
    tokens: (address: string) => ['wallet', 'tokens', address] as const,
  },

  // Search
  search: {
    query: (q: string, type?: string) => ['search', q, type] as const,
    trending: () => ['search', 'trending'] as const,
  },
};

export default queryClient;
