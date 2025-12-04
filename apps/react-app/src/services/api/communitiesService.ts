/**
 * Communities Service
 * API methods for communities, channels, roles, and moderation
 */

import { api } from '../../lib/apiClient';

// Types
export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string;
  avatarUrl?: string;
  bannerUrl?: string;
  type: 'public' | 'private' | 'token-gated';
  category?: string;
  createdAt: string;
  updatedAt: string;

  // Creator/Admin info
  creatorId: string;
  creator?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    verified: boolean;
  };

  // Stats
  stats?: {
    members: number;
    posts: number;
    onlineMembers: number;
  };

  // Current user's membership
  membership?: {
    joined: boolean;
    role: 'owner' | 'admin' | 'moderator' | 'member';
    permissions: string[];
  };

  // Settings
  settings?: {
    allowInvites: boolean;
    requireApproval: boolean;
    allowMemberPosts: boolean;
    allowMemberInvites: boolean;
    contentFiltering: boolean;
  };

  // Token gating
  tokenGating?: {
    enabled: boolean;
    chainId: number;
    contractAddress: string;
    minBalance: string;
    tokenType: 'ERC20' | 'ERC721' | 'ERC1155';
  };
}

export interface Channel {
  id: string;
  communityId: string;
  name: string;
  description?: string;
  type: 'text' | 'voice' | 'announcement';
  position: number;
  parentId?: string;
  permissions?: {
    viewChannel: string[];
    sendMessages: string[];
    manageChannel: string[];
  };
  createdAt: string;
}

export interface CommunityMember {
  id: string;
  userId: string;
  communityId: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joinedAt: string;

  user?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    verified: boolean;
  };
}

export interface CreateCommunityData {
  name: string;
  slug: string;
  description: string;
  type: 'public' | 'private' | 'token-gated';
  category?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  settings?: any;
  tokenGating?: any;
}

export interface UpdateCommunityData {
  name?: string;
  description?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  category?: string;
  settings?: any;
  tokenGating?: any;
}

export interface CommunitiesResponse {
  communities: Community[];
  nextCursor?: string;
  hasMore: boolean;
  total?: number;
}

export interface MembersResponse {
  members: CommunityMember[];
  nextCursor?: string;
  hasMore: boolean;
  total: number;
}

// Communities Service
export const communitiesService = {
  /**
   * Get all communities with filters
   */
  async getCommunities(filters?: {
    category?: string;
    type?: string;
    query?: string;
    cursor?: string;
  }): Promise<CommunitiesResponse> {
    const params = new URLSearchParams();

    if (filters?.category) params.append('category', filters.category);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.query) params.append('q', filters.query);
    if (filters?.cursor) params.append('cursor', filters.cursor);

    const queryString = params.toString();
    const url = `/communities${queryString ? `?${queryString}` : ''}`;

    return api.get<CommunitiesResponse>(url);
  },

  /**
   * Get community by ID
   */
  async getCommunity(communityId: string): Promise<Community> {
    return api.get<Community>(`/communities/${communityId}`);
  },

  /**
   * Get community by slug
   */
  async getCommunityBySlug(slug: string): Promise<Community> {
    return api.get<Community>(`/communities/slug/${slug}`);
  },

  /**
   * Create community
   */
  async createCommunity(data: CreateCommunityData): Promise<Community> {
    return api.post<Community>('/communities', data);
  },

  /**
   * Update community
   */
  async updateCommunity(communityId: string, data: UpdateCommunityData): Promise<Community> {
    return api.patch<Community>(`/communities/${communityId}`, data);
  },

  /**
   * Delete community
   */
  async deleteCommunity(communityId: string): Promise<void> {
    return api.delete<void>(`/communities/${communityId}`);
  },

  /**
   * Get user's joined communities
   */
  async getMyCommunitiesQuery(cursor?: string): Promise<CommunitiesResponse> {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);

    const queryString = params.toString();
    const url = `/communities/me${queryString ? `?${queryString}` : ''}`;

    return api.get<CommunitiesResponse>(url);
  },

  /**
   * Get trending communities
   */
  async getTrendingCommunities(limit: number = 10): Promise<CommunitiesResponse> {
    return api.get<CommunitiesResponse>(`/communities/trending?limit=${limit}`);
  },

  /**
   * Get suggested communities
   */
  async getSuggestedCommunities(limit: number = 10): Promise<CommunitiesResponse> {
    return api.get<CommunitiesResponse>(`/communities/suggested?limit=${limit}`);
  },

  /**
   * Search communities
   */
  async searchCommunities(query: string, filters?: { type?: string; category?: string }): Promise<CommunitiesResponse> {
    const params = new URLSearchParams();
    params.append('q', query);

    if (filters?.type) params.append('type', filters.type);
    if (filters?.category) params.append('category', filters.category);

    return api.get<CommunitiesResponse>(`/communities/search?${params.toString()}`);
  },

  /**
   * Join community
   */
  async joinCommunity(communityId: string): Promise<{ success: boolean; membership: any }> {
    return api.post<{ success: boolean; membership: any }>(`/communities/${communityId}/join`);
  },

  /**
   * Leave community
   */
  async leaveCommunity(communityId: string): Promise<{ success: boolean }> {
    return api.post<{ success: boolean }>(`/communities/${communityId}/leave`);
  },

  /**
   * Get community members
   */
  async getMembers(communityId: string, cursor?: string, role?: string): Promise<MembersResponse> {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    if (role) params.append('role', role);

    const queryString = params.toString();
    const url = `/communities/${communityId}/members${queryString ? `?${queryString}` : ''}`;

    return api.get<MembersResponse>(url);
  },

  /**
   * Invite user to community
   */
  async inviteMember(communityId: string, userId: string): Promise<{ success: boolean }> {
    return api.post<{ success: boolean }>(`/communities/${communityId}/invite`, { userId });
  },

  /**
   * Remove member from community
   */
  async removeMember(communityId: string, userId: string): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>(`/communities/${communityId}/members/${userId}`);
  },

  /**
   * Update member role
   */
  async updateMemberRole(
    communityId: string,
    userId: string,
    role: 'admin' | 'moderator' | 'member'
  ): Promise<CommunityMember> {
    return api.patch<CommunityMember>(`/communities/${communityId}/members/${userId}`, { role });
  },

  /**
   * Get community channels
   */
  async getChannels(communityId: string): Promise<{ channels: Channel[] }> {
    return api.get<{ channels: Channel[] }>(`/communities/${communityId}/channels`);
  },

  /**
   * Create channel
   */
  async createChannel(
    communityId: string,
    data: {
      name: string;
      description?: string;
      type: 'text' | 'voice' | 'announcement';
      parentId?: string;
    }
  ): Promise<Channel> {
    return api.post<Channel>(`/communities/${communityId}/channels`, data);
  },

  /**
   * Update channel
   */
  async updateChannel(
    communityId: string,
    channelId: string,
    data: {
      name?: string;
      description?: string;
      position?: number;
    }
  ): Promise<Channel> {
    return api.patch<Channel>(`/communities/${communityId}/channels/${channelId}`, data);
  },

  /**
   * Delete channel
   */
  async deleteChannel(communityId: string, channelId: string): Promise<void> {
    return api.delete<void>(`/communities/${communityId}/channels/${channelId}`);
  },

  /**
   * Get community posts
   */
  async getCommunityPosts(communityId: string, cursor?: string): Promise<{
    posts: any[];
    nextCursor?: string;
    hasMore: boolean;
  }> {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);

    const queryString = params.toString();
    const url = `/communities/${communityId}/posts${queryString ? `?${queryString}` : ''}`;

    return api.get(url);
  },

  /**
   * Get community rules
   */
  async getRules(communityId: string): Promise<{ rules: { title: string; description: string }[] }> {
    return api.get<{ rules: { title: string; description: string }[] }>(`/communities/${communityId}/rules`);
  },

  /**
   * Update community rules
   */
  async updateRules(
    communityId: string,
    rules: { title: string; description: string }[]
  ): Promise<{ rules: { title: string; description: string }[] }> {
    return api.put<{ rules: { title: string; description: string }[] }>(`/communities/${communityId}/rules`, { rules });
  },

  /**
   * Ban member from community
   */
  async banMember(communityId: string, userId: string, reason?: string): Promise<{ success: boolean }> {
    return api.post<{ success: boolean }>(`/communities/${communityId}/bans`, {
      userId,
      reason,
    });
  },

  /**
   * Unban member from community
   */
  async unbanMember(communityId: string, userId: string): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>(`/communities/${communityId}/bans/${userId}`);
  },

  /**
   * Get banned members
   */
  async getBannedMembers(communityId: string): Promise<{ bans: any[] }> {
    return api.get<{ bans: any[] }>(`/communities/${communityId}/bans`);
  },

  /**
   * Report community
   */
  async reportCommunity(communityId: string, reason: string, details?: string): Promise<{ success: boolean }> {
    return api.post<{ success: boolean }>(`/communities/${communityId}/report`, {
      reason,
      details,
    });
  },

  /**
   * Upload community avatar
   */
  async uploadAvatar(communityId: string, file: File): Promise<{ url: string }> {
    return api.upload<{ url: string }>(`/communities/${communityId}/avatar`, file);
  },

  /**
   * Upload community banner
   */
  async uploadBanner(communityId: string, file: File): Promise<{ url: string }> {
    return api.upload<{ url: string }>(`/communities/${communityId}/banner`, file);
  },

  /**
   * Get community events
   */
  async getEvents(communityId: string): Promise<{ events: any[] }> {
    return api.get<{ events: any[] }>(`/communities/${communityId}/events`);
  },

  /**
   * Create community event
   */
  async createEvent(
    communityId: string,
    data: {
      title: string;
      description: string;
      startDate: string;
      endDate?: string;
      location?: string;
    }
  ): Promise<any> {
    return api.post(`/communities/${communityId}/events`, data);
  },

  /**
   * Get community analytics (admin/moderator only)
   */
  async getAnalytics(communityId: string, period: '7d' | '30d' | '90d' = '30d'): Promise<{
    members: { total: number; growth: number };
    posts: { total: number; growth: number };
    engagement: { total: number; growth: number };
  }> {
    return api.get(`/communities/${communityId}/analytics?period=${period}`);
  },

  /**
   * Transfer ownership
   */
  async transferOwnership(communityId: string, newOwnerId: string): Promise<Community> {
    return api.post<Community>(`/communities/${communityId}/transfer`, { newOwnerId });
  },
};

export default communitiesService;
