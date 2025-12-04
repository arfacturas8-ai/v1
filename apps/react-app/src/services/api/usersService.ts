/**
 * Users Service
 * API methods for users, profiles, follows, and relationships
 */

import { api } from '../../lib/apiClient';

// Types
export interface User {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  location?: string;
  website?: string;
  verified: boolean;
  createdAt: string;

  // Stats
  stats?: {
    followers: number;
    following: number;
    posts: number;
    likes: number;
  };

  // Current user's relationship
  relationship?: {
    following: boolean;
    followedBy: boolean;
    blocked: boolean;
    muted: boolean;
  };

  // Wallet info (if connected)
  wallet?: {
    address: string;
    ens?: string;
  };
}

export interface UpdateProfileData {
  displayName?: string;
  bio?: string;
  location?: string;
  website?: string;
  avatarUrl?: string;
  bannerUrl?: string;
}

export interface UserFilters {
  query?: string;
  verified?: boolean;
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface UsersResponse {
  users: User[];
  nextCursor?: string;
  hasMore: boolean;
  total?: number;
}

export interface FollowersResponse {
  users: User[];
  nextCursor?: string;
  hasMore: boolean;
  total: number;
}

// Users Service
export const usersService = {
  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    return api.get<User>('/users/me');
  },

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<User> {
    return api.get<User>(`/users/${userId}`);
  },

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<User> {
    return api.get<User>(`/users/username/${username}`);
  },

  /**
   * Update current user profile
   */
  async updateProfile(data: UpdateProfileData): Promise<User> {
    return api.patch<User>('/users/me', data);
  },

  /**
   * Upload avatar
   */
  async uploadAvatar(file: File): Promise<{ url: string }> {
    return api.upload<{ url: string }>('/users/me/avatar', file);
  },

  /**
   * Upload banner
   */
  async uploadBanner(file: File): Promise<{ url: string }> {
    return api.upload<{ url: string }>('/users/me/banner', file);
  },

  /**
   * Search users
   */
  async searchUsers(query: string, filters?: Omit<UserFilters, 'query'>): Promise<UsersResponse> {
    const params = new URLSearchParams();
    params.append('q', query);

    if (filters?.verified !== undefined) params.append('verified', filters.verified.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.cursor) params.append('cursor', filters.cursor);

    return api.get<UsersResponse>(`/users/search?${params.toString()}`);
  },

  /**
   * Get suggested users to follow
   */
  async getSuggestedUsers(limit: number = 10): Promise<UsersResponse> {
    return api.get<UsersResponse>(`/users/suggested?limit=${limit}`);
  },

  /**
   * Follow user
   */
  async followUser(userId: string): Promise<{ following: boolean }> {
    return api.post<{ following: boolean }>(`/users/${userId}/follow`);
  },

  /**
   * Unfollow user
   */
  async unfollowUser(userId: string): Promise<{ following: boolean }> {
    return api.delete<{ following: boolean }>(`/users/${userId}/follow`);
  },

  /**
   * Get user's followers
   */
  async getFollowers(userId: string, cursor?: string): Promise<FollowersResponse> {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);

    const queryString = params.toString();
    const url = `/users/${userId}/followers${queryString ? `?${queryString}` : ''}`;

    return api.get<FollowersResponse>(url);
  },

  /**
   * Get user's following
   */
  async getFollowing(userId: string, cursor?: string): Promise<FollowersResponse> {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);

    const queryString = params.toString();
    const url = `/users/${userId}/following${queryString ? `?${queryString}` : ''}`;

    return api.get<FollowersResponse>(url);
  },

  /**
   * Block user
   */
  async blockUser(userId: string): Promise<{ blocked: boolean }> {
    return api.post<{ blocked: boolean }>(`/users/${userId}/block`);
  },

  /**
   * Unblock user
   */
  async unblockUser(userId: string): Promise<{ blocked: boolean }> {
    return api.delete<{ blocked: boolean }>(`/users/${userId}/block`);
  },

  /**
   * Mute user
   */
  async muteUser(userId: string): Promise<{ muted: boolean }> {
    return api.post<{ muted: boolean }>(`/users/${userId}/mute`);
  },

  /**
   * Unmute user
   */
  async unmuteUser(userId: string): Promise<{ muted: boolean }> {
    return api.delete<{ muted: boolean }>(`/users/${userId}/mute`);
  },

  /**
   * Get blocked users
   */
  async getBlockedUsers(cursor?: string): Promise<UsersResponse> {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);

    const queryString = params.toString();
    const url = `/users/me/blocked${queryString ? `?${queryString}` : ''}`;

    return api.get<UsersResponse>(url);
  },

  /**
   * Get muted users
   */
  async getMutedUsers(cursor?: string): Promise<UsersResponse> {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);

    const queryString = params.toString();
    const url = `/users/me/muted${queryString ? `?${queryString}` : ''}`;

    return api.get<UsersResponse>(url);
  },

  /**
   * Report user
   */
  async reportUser(userId: string, reason: string, details?: string): Promise<{ success: boolean }> {
    return api.post<{ success: boolean }>(`/users/${userId}/report`, {
      reason,
      details,
    });
  },

  /**
   * Get user's posts
   */
  async getUserPosts(userId: string, cursor?: string): Promise<{
    posts: any[];
    nextCursor?: string;
    hasMore: boolean;
  }> {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);

    const queryString = params.toString();
    const url = `/users/${userId}/posts${queryString ? `?${queryString}` : ''}`;

    return api.get(url);
  },

  /**
   * Get user's liked posts
   */
  async getUserLikes(userId: string, cursor?: string): Promise<{
    posts: any[];
    nextCursor?: string;
    hasMore: boolean;
  }> {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);

    const queryString = params.toString();
    const url = `/users/${userId}/likes${queryString ? `?${queryString}` : ''}`;

    return api.get(url);
  },

  /**
   * Get user's media posts
   */
  async getUserMedia(userId: string, cursor?: string): Promise<{
    posts: any[];
    nextCursor?: string;
    hasMore: boolean;
  }> {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);

    const queryString = params.toString();
    const url = `/users/${userId}/media${queryString ? `?${queryString}` : ''}`;

    return api.get(url);
  },

  /**
   * Connect wallet to user account
   */
  async connectWallet(address: string, signature: string): Promise<User> {
    return api.post<User>('/users/me/wallet', {
      address,
      signature,
    });
  },

  /**
   * Disconnect wallet from user account
   */
  async disconnectWallet(): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>('/users/me/wallet');
  },

  /**
   * Verify user (admin only)
   */
  async verifyUser(userId: string): Promise<User> {
    return api.post<User>(`/users/${userId}/verify`);
  },

  /**
   * Unverify user (admin only)
   */
  async unverifyUser(userId: string): Promise<User> {
    return api.delete<User>(`/users/${userId}/verify`);
  },
};

export default usersService;
