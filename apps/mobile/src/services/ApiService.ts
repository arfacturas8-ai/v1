/**
 * CRYB API SERVICE
 * Handles all API communications with backend server
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { NetworkService } from './NetworkService';
import { CrashDetector } from '../utils/CrashDetector';

import Constants from 'expo-constants';

// API Configuration from environment
const config = Constants.expoConfig?.extra || {};
// Use api.cryb.ai for production builds, localhost for development
const getApiUrl = () => {
  if (__DEV__) {
    return Platform.OS === 'android' ? 'http://10.0.2.2:3002' : 'http://localhost:3002';
  }
  return config.apiUrl || 'https://api.cryb.ai/api/v1';
};
const API_BASE_URL = getApiUrl();
const API_TIMEOUT = config.apiTimeout || 10000; // 10 seconds  
const MAX_RETRIES = config.maxRetryAttempts || 3;

// Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  isVerified: boolean;
  createdAt: string;
  role: 'user' | 'admin' | 'moderator';
  settings?: {
    biometricEnabled: boolean;
    pushNotifications: boolean;
    theme: 'light' | 'dark' | 'auto';
  };
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface Message {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  channelId: string;
  serverId?: string;
  timestamp: string;
  type: 'text' | 'image' | 'file' | 'system';
  attachments?: Attachment[];
  reactions?: Reaction[];
  mentions?: string[];
  isEdited: boolean;
  editedAt?: string;
  replyTo?: string;
}

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  contentType: string;
  thumbnailUrl?: string;
}

export interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface Server {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  bannerUrl?: string;
  memberCount: number;
  onlineMembers: number;
  ownerId: string;
  category: string;
  isPublic: boolean;
  isVerified: boolean;
  channels: Channel[];
  members: ServerMember[];
  roles: Role[];
  createdAt: string;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  type: 'text' | 'voice' | 'announcement';
  serverId: string;
  position: number;
  isPrivate: boolean;
  permissions: Permission[];
  lastMessageId?: string;
  lastActivity: string;
}

export interface ServerMember {
  id: string;
  userId: string;
  serverId: string;
  username: string;
  nickname?: string;
  avatarUrl?: string;
  roles: string[];
  joinedAt: string;
  isOnline: boolean;
  lastSeen: string;
}

export interface Role {
  id: string;
  name: string;
  color: string;
  permissions: string[];
  position: number;
  serverId: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
}

export interface SearchResult {
  type: 'post' | 'message' | 'user' | 'community' | 'server';
  id: string;
  title?: string;
  content?: string;
  username?: string;
  displayName?: string;
  name?: string;
  description?: string;
  avatar?: string;
  icon?: string;
  createdAt?: string;
  score?: number;
  highlights?: string[];
  user?: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  community?: {
    id: string;
    name: string;
    displayName: string;
    icon?: string;
  };
  channel?: {
    id: string;
    name: string;
    serverId: string;
  };
}

export interface ApiSearchResponse {
  users?: {
    items: Array<{
      id: string;
      username: string;
      displayName: string;
      avatar?: string;
      isVerified: boolean;
    }>;
    total: number;
    source: string;
  };
  servers?: {
    items: Array<{
      id: string;
      name: string;
      description?: string;
      icon?: string;
      member_count?: number;
    }>;
    total: number;
    source: string;
  };
  communities?: {
    items: Array<{
      id: string;
      name: string;
      displayName: string;
      description?: string;
      icon?: string;
      memberCount: number;
    }>;
    total: number;
    source: string;
  };
  posts?: {
    items: Array<{
      id: string;
      title: string;
      content: string;
      url?: string;
      thumbnail?: string;
      score: number;
      viewCount: number;
      commentCount: number;
      createdAt: string;
      editedAt?: string;
      user: {
        id: string;
        username: string;
        displayName: string;
        avatar?: string;
      };
      community: {
        id: string;
        name: string;
        displayName: string;
      };
    }>;
    total: number;
    source: string;
  };
  messages?: {
    items: Array<{
      id: string;
      content: string;
      createdAt: string;
      editedTimestamp?: string;
      user: {
        id: string;
        username: string;
        displayName: string;
        avatar?: string;
      };
      channel: {
        id: string;
        name: string;
        serverId: string;
      };
    }>;
    total: number;
    source: string;
  };
}

export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  hasMore: boolean;
  query: string;
}

class ApiService {
  private static instance: ApiService;
  private tokens: AuthTokens | null = null;
  private requestQueue: Array<() => Promise<any>> = [];
  private isRefreshingToken = false;

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Load stored tokens
      await this.loadTokens();
      
      // Validate tokens if they exist
      if (this.tokens) {
        await this.validateTokens();
      }

      console.log('[ApiService] Initialized successfully');
    } catch (error) {
      console.error('[ApiService] Initialization error:', error);
      
      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { action: 'initializeApiService' },
        'medium'
      );
    }
  }

  private async loadTokens(): Promise<void> {
    try {
      const tokensData = await AsyncStorage.getItem('@cryb_auth_tokens');
      if (tokensData) {
        this.tokens = JSON.parse(tokensData);
        
        // Check if tokens are expired
        if (this.tokens && this.tokens.expiresAt < Date.now()) {
          await this.refreshTokens();
        }
      }
    } catch (error) {
      console.error('[ApiService] Load tokens error:', error);
      this.tokens = null;
    }
  }

  private async saveTokens(tokens: AuthTokens): Promise<void> {
    try {
      this.tokens = tokens;
      await AsyncStorage.setItem('@cryb_auth_tokens', JSON.stringify(tokens));
    } catch (error) {
      console.error('[ApiService] Save tokens error:', error);
    }
  }

  private async clearTokens(): Promise<void> {
    try {
      this.tokens = null;
      await AsyncStorage.removeItem('@cryb_auth_tokens');
    } catch (error) {
      console.error('[ApiService] Clear tokens error:', error);
    }
  }

  private async validateTokens(): Promise<boolean> {
    try {
      if (!this.tokens) {
        return false;
      }

      const response = await this.makeRequest<User>('/api/v1/auth/validate', {
        method: 'GET',
        skipAuth: false,
      });

      return response.success;
    } catch (error) {
      console.error('[ApiService] Validate tokens error:', error);
      return false;
    }
  }

  private async refreshTokens(): Promise<boolean> {
    try {
      if (!this.tokens?.refreshToken || this.isRefreshingToken) {
        return false;
      }

      this.isRefreshingToken = true;

      const response = await this.makeRequest<AuthTokens>('/api/v1/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({
          refreshToken: this.tokens.refreshToken,
        }),
        skipAuth: true,
      });

      if (response.success && response.data) {
        await this.saveTokens(response.data);
        
        // Process queued requests
        await this.processRequestQueue();
        
        return true;
      } else {
        await this.clearTokens();
        return false;
      }
    } catch (error) {
      console.error('[ApiService] Refresh tokens error:', error);
      await this.clearTokens();
      return false;
    } finally {
      this.isRefreshingToken = false;
    }
  }

  private async processRequestQueue(): Promise<void> {
    const queue = [...this.requestQueue];
    this.requestQueue = [];

    await Promise.all(queue.map(request => 
      request().catch(error => 
        console.error('[ApiService] Queued request error:', error)
      )
    ));
  }

  private async makeRequest<T>(
    endpoint: string,
    options: {
      method?: string;
      body?: string | FormData;
      headers?: Record<string, string>;
      skipAuth?: boolean;
      skipRetry?: boolean;
    } = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      body,
      headers = {},
      skipAuth = false,
      skipRetry = false,
    } = options;

    try {
      // Check network connectivity
      if (!NetworkService.isConnected()) {
        throw new Error('No network connection');
      }

      // Prepare headers
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
      };

      // Add authentication if not skipped
      if (!skipAuth && this.tokens?.accessToken) {
        requestHeaders.Authorization = `Bearer ${this.tokens.accessToken}`;
      }

      // Make the request with network retry
      const response = await NetworkService.retry(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

        try {
          const result = await fetch(`${API_BASE_URL}${endpoint}`, {
            method,
            headers: requestHeaders,
            body,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
          return result;
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      }, MAX_RETRIES);

      // Handle response
      const responseData = await response.json();

      if (response.status === 401 && !skipAuth && !skipRetry) {
        // Token expired, try to refresh
        const refreshSuccess = await this.refreshTokens();
        if (refreshSuccess) {
          // Retry the request with new token
          return this.makeRequest<T>(endpoint, { ...options, skipRetry: true });
        } else {
          return {
            success: false,
            error: 'Authentication failed',
            code: 'AUTH_FAILED',
          };
        }
      }

      if (!response.ok) {
        return {
          success: false,
          error: responseData.message || 'Request failed',
          code: responseData.code || `HTTP_${response.status}`,
        };
      }

      return {
        success: true,
        data: responseData.data || responseData,
        message: responseData.message,
      };

    } catch (error) {
      console.error(`[ApiService] Request failed [${method} ${endpoint}]:`, error);

      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { 
          action: 'apiRequest',
          endpoint,
          method,
        },
        'low'
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Request failed',
        code: 'NETWORK_ERROR',
      };
    }
  }

  // Authentication API methods
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await this.makeRequest<{ user: User; tokens: AuthTokens }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    });

    if (response.success && response.data?.tokens) {
      await this.saveTokens(response.data.tokens);
    }

    return response;
  }

  async register(data: RegisterData): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await this.makeRequest<{ user: User; tokens: AuthTokens }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    });

    if (response.success && response.data?.tokens) {
      await this.saveTokens(response.data.tokens);
    }

    return response;
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    return this.makeRequest('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
      skipAuth: true,
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<ApiResponse> {
    return this.makeRequest('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password: newPassword }),
      skipAuth: true,
    });
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.makeRequest('/api/v1/auth/logout', {
      method: 'POST',
      body: JSON.stringify({
        refreshToken: this.tokens?.refreshToken,
      }),
    });

    await this.clearTokens();
    return response;
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.makeRequest<User>('/api/v1/auth/me');
  }

  // Server API methods
  async getServers(): Promise<ApiResponse<Server[]>> {
    return this.makeRequest<Server[]>('/api/v1/servers');
  }

  async getServer(serverId: string): Promise<ApiResponse<Server>> {
    return this.makeRequest<Server>(`/api/v1/servers/${serverId}`);
  }

  async createServer(data: {
    name: string;
    description: string;
    category: string;
    isPublic: boolean;
    iconUrl?: string;
    bannerUrl?: string;
  }): Promise<ApiResponse<Server>> {
    return this.makeRequest<Server>('/api/v1/servers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async joinServer(serverId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/v1/servers/${serverId}/join`, {
      method: 'POST',
    });
  }

  async leaveServer(serverId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/v1/servers/${serverId}/leave`, {
      method: 'POST',
    });
  }

  // Channel API methods
  async getChannels(serverId: string): Promise<ApiResponse<Channel[]>> {
    return this.makeRequest<Channel[]>(`/api/v1/servers/${serverId}/channels`);
  }

  async createChannel(serverId: string, data: {
    name: string;
    type: string;
    description?: string;
    isPrivate?: boolean;
  }): Promise<ApiResponse<Channel>> {
    return this.makeRequest<Channel>(`/api/v1/servers/${serverId}/channels`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Message API methods
  async getMessages(channelId: string, limit = 50, before?: string): Promise<ApiResponse<Message[]>> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(before && { before }),
    });

    return this.makeRequest<Message[]>(`/api/v1/channels/${channelId}/messages?${params}`);
  }

  async sendMessage(channelId: string, content: string, attachments?: File[]): Promise<ApiResponse<Message>> {
    if (attachments && attachments.length > 0) {
      // Handle file uploads
      const formData = new FormData();
      formData.append('content', content);
      attachments.forEach((file, index) => {
        formData.append(`attachment_${index}`, file);
      });

      return this.makeRequest<Message>(`/api/v1/channels/${channelId}/messages`, {
        method: 'POST',
        body: formData,
        headers: {}, // Don't set content-type for FormData
      });
    } else {
      return this.makeRequest<Message>(`/api/v1/channels/${channelId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
    }
  }

  async editMessage(messageId: string, content: string): Promise<ApiResponse<Message>> {
    return this.makeRequest<Message>(`/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
  }

  async deleteMessage(messageId: string): Promise<ApiResponse> {
    return this.makeRequest(`/messages/${messageId}`, {
      method: 'DELETE',
    });
  }

  async addReaction(messageId: string, emoji: string): Promise<ApiResponse> {
    return this.makeRequest(`/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });
  }

  async removeReaction(messageId: string, emoji: string): Promise<ApiResponse> {
    return this.makeRequest(`/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`, {
      method: 'DELETE',
    });
  }

  // User API methods
  async getUsers(query?: string): Promise<ApiResponse<User[]>> {
    const params = query ? `?search=${encodeURIComponent(query)}` : '';
    return this.makeRequest<User[]>(`/users${params}`);
  }

  async getUser(userId: string): Promise<ApiResponse<User>> {
    return this.makeRequest<User>(`/users/${userId}`);
  }

  async updateProfile(data: {
    username?: string;
    email?: string;
    avatarUrl?: string;
  }): Promise<ApiResponse<User>> {
    return this.makeRequest<User>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // File Upload methods
  async uploadFile(file: File, type: 'avatar' | 'banner' | 'attachment'): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return this.makeRequest<{ url: string }>('/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Don't set content-type for FormData
    });
  }

  // Community/Discovery methods
  async getDiscoverServers(category?: string): Promise<ApiResponse<Server[]>> {
    const params = category ? `?category=${encodeURIComponent(category)}` : '';
    return this.makeRequest<Server[]>(`/discover/servers${params}`);
  }

  async searchServers(query: string): Promise<ApiResponse<Server[]>> {
    return this.makeRequest<Server[]>(`/search/servers?q=${encodeURIComponent(query)}`);
  }

  // Utility methods
  isAuthenticated(): boolean {
    return this.tokens !== null && this.tokens.expiresAt > Date.now();
  }

  getAccessToken(): string | null {
    return this.tokens?.accessToken || null;
  }

  getCurrentUserId(): string | null {
    // This would typically come from a decoded JWT token
    // For now, we'll return null and expect it to be set after login
    return null;
  }

  // Push Notification methods
  async registerPushToken(tokenData: {
    token: string;
    platform: 'ios' | 'android' | 'web';
    deviceId: string;
  }): Promise<ApiResponse> {
    return this.makeRequest('/api/v1/notifications/register-token', {
      method: 'POST',
      body: JSON.stringify(tokenData),
    });
  }

  async unregisterPushToken(deviceId: string): Promise<ApiResponse> {
    return this.makeRequest('/api/v1/notifications/unregister-token', {
      method: 'DELETE',
      body: JSON.stringify({ deviceId }),
    });
  }

  async updateNotificationSettings(settings: {
    enableMessages: boolean;
    enableServerInvites: boolean;
    enableFriendRequests: boolean;
    enableAnnouncements: boolean;
  }): Promise<ApiResponse> {
    return this.makeRequest('/api/v1/notifications/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  }

  // Search methods
  async search(query: string, filters?: {
    type?: 'post' | 'message' | 'user' | 'community' | 'server';
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<SearchResponse>> {
    const params = new URLSearchParams({
      q: query,
      ...(filters?.type && { type: filters.type }),
      ...(filters?.limit && { limit: filters.limit.toString() }),
      ...(filters?.offset && { offset: filters.offset.toString() }),
    });

    const response = await this.makeRequest<{ data: ApiSearchResponse; query: string }>(`/api/v1/search?${params}`);
    
    if (!response.success || !response.data) {
      return response as ApiResponse<SearchResponse>;
    }

    // Transform the API response into our SearchResponse format
    const apiData = response.data.data;
    const results: SearchResult[] = [];
    let totalCount = 0;

    // Add users
    if (apiData.users?.items) {
      apiData.users.items.forEach(user => {
        results.push({
          type: 'user',
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
          content: user.displayName, // For bio/description if available
        });
      });
      totalCount += apiData.users.total;
    }

    // Add servers
    if (apiData.servers?.items) {
      apiData.servers.items.forEach(server => {
        results.push({
          type: 'server',
          id: server.id,
          name: server.name,
          title: server.name,
          description: server.description,
          icon: server.icon,
          content: server.description,
        });
      });
      totalCount += apiData.servers.total;
    }

    // Add communities
    if (apiData.communities?.items) {
      apiData.communities.items.forEach(community => {
        results.push({
          type: 'community',
          id: community.id,
          name: community.name,
          displayName: community.displayName,
          title: community.displayName,
          description: community.description,
          icon: community.icon,
          content: community.description,
          community: {
            id: community.id,
            name: community.name,
            displayName: community.displayName,
            icon: community.icon,
          },
        });
      });
      totalCount += apiData.communities.total;
    }

    // Add posts
    if (apiData.posts?.items) {
      apiData.posts.items.forEach(post => {
        results.push({
          type: 'post',
          id: post.id,
          title: post.title,
          content: post.content,
          createdAt: post.createdAt,
          score: post.score,
          user: {
            id: post.user.id,
            username: post.user.username,
            displayName: post.user.displayName,
            avatar: post.user.avatar,
          },
          community: {
            id: post.community.id,
            name: post.community.name,
            displayName: post.community.displayName,
          },
        });
      });
      totalCount += apiData.posts.total;
    }

    // Add messages
    if (apiData.messages?.items) {
      apiData.messages.items.forEach(message => {
        results.push({
          type: 'message',
          id: message.id,
          content: message.content,
          createdAt: message.createdAt,
          user: {
            id: message.user.id,
            username: message.user.username,
            displayName: message.user.displayName,
            avatar: message.user.avatar,
          },
          channel: {
            id: message.channel.id,
            name: message.channel.name,
            serverId: message.channel.serverId,
          },
        });
      });
      totalCount += apiData.messages.total;
    }

    const transformedResponse: SearchResponse = {
      results,
      totalCount,
      hasMore: false, // We'll implement pagination later
      query: response.data.query,
    };

    return {
      success: true,
      data: transformedResponse,
      message: response.message,
    };
  }

  async searchPosts(query: string, limit = 20, offset = 0): Promise<ApiResponse<SearchResult[]>> {
    return this.search(query, { type: 'post', limit, offset }).then(response => ({
      ...response,
      data: response.data?.results || [],
    }));
  }

  async searchUsers(query: string, limit = 20, offset = 0): Promise<ApiResponse<SearchResult[]>> {
    return this.search(query, { type: 'user', limit, offset }).then(response => ({
      ...response,
      data: response.data?.results || [],
    }));
  }

  async searchCommunities(query: string, limit = 20, offset = 0): Promise<ApiResponse<SearchResult[]>> {
    return this.search(query, { type: 'community', limit, offset }).then(response => ({
      ...response,
      data: response.data?.results || [],
    }));
  }

  // Voice channel methods
  voice = {
    getChannel: async (channelId: string): Promise<any> => {
      const response = await this.request('/voice/channel/' + channelId, {
        method: 'GET',
      });
      return response.data;
    },

    getParticipants: async (channelId: string): Promise<any[]> => {
      const response = await this.request('/voice/channel/' + channelId + '/participants', {
        method: 'GET',
      });
      return response.data || [];
    },

    joinChannel: async (channelId: string, userData: { userId?: string; username?: string }): Promise<any> => {
      const response = await this.request('/voice/join', {
        method: 'POST',
        body: JSON.stringify({
          channelId,
          ...userData,
        }),
      });
      return response.data;
    },

    leaveChannel: async (channelId: string): Promise<any> => {
      const response = await this.request('/voice/leave', {
        method: 'POST',
        body: JSON.stringify({ channelId }),
      });
      return response.data;
    },

    updateVoiceState: async (channelId: string, state: { isMuted?: boolean; isDeafened?: boolean }): Promise<any> => {
      const response = await this.request('/voice/state', {
        method: 'PUT',
        body: JSON.stringify({
          channelId,
          ...state,
        }),
      });
      return response.data;
    },

    getAccessToken: async (channelId: string): Promise<string> => {
      const response = await this.request('/voice/token', {
        method: 'POST',
        body: JSON.stringify({ channelId }),
      });
      return response.data.token;
    },
  };
}

export const apiService = ApiService.getInstance();