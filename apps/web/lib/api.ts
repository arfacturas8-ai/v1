"use client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Connection status tracking
let connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error' = 'disconnected';
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

class ApiClient {
  private baseURL: string;
  private retryCount = 3;
  private retryDelay = 1000;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    
    // Perform initial health check
    if (typeof window !== 'undefined') {
      this.healthCheck();
    }
  }

  // Health check endpoint
  async healthCheck(): Promise<boolean> {
    try {
      connectionStatus = 'connecting';
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        connectionStatus = 'connected';
        lastHealthCheck = Date.now();
        return true;
      } else {
        connectionStatus = 'error';
        return false;
      }
    } catch (error) {
      console.warn('Backend health check failed:', error);
      connectionStatus = 'disconnected';
      return false;
    }
  }

  // Get connection status
  getConnectionStatus() {
    return connectionStatus;
  }

  // Check if we need to perform health check
  private shouldHealthCheck(): boolean {
    const now = Date.now();
    return now - lastHealthCheck > HEALTH_CHECK_INTERVAL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryAttempt = 0
  ): Promise<ApiResponse<T>> {
    try {
      // Perform health check if needed
      if (this.shouldHealthCheck() && endpoint !== '/health') {
        await this.healthCheck();
      }

      // Get token from localStorage
      const token = typeof window !== 'undefined' 
        ? localStorage.getItem('auth-token') 
        : null;

      const config: RequestInit = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      };

      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      
      // Handle different response types
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        // Handle specific HTTP status codes
        if (response.status === 401) {
          // Unauthorized - try to refresh token first
          if (typeof window !== 'undefined' && endpoint !== '/api/v1/auth/refresh' && endpoint !== '/api/v1/auth/login') {
            const refreshResult = await this.refreshToken();
            if (refreshResult.success) {
              // Retry the original request with new token
              return this.request(endpoint, options, retryAttempt);
            }
          }
          
          // If refresh failed or not applicable, clear tokens and redirect
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth-token');
            localStorage.removeItem('refresh-token');
            // Don't redirect during server-side rendering
            if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
              window.location.href = '/login';
            }
          }
        } else if (response.status === 429) {
          // Rate limited - retry after delay
          if (retryAttempt < this.retryCount) {
            await this.delay(this.retryDelay * Math.pow(2, retryAttempt));
            return this.request(endpoint, options, retryAttempt + 1);
          }
        } else if (response.status >= 500 && retryAttempt < this.retryCount) {
          // Server error - retry with exponential backoff
          await this.delay(this.retryDelay * Math.pow(2, retryAttempt));
          return this.request(endpoint, options, retryAttempt + 1);
        }

        return {
          success: false,
          error: typeof data === 'object' ? (data.message || data.error || `Request failed (${response.status})`) : `Request failed (${response.status})`,
          data: null,
        };
      }

      connectionStatus = 'connected';
      return {
        success: true,
        data: typeof data === 'object' ? (data.data || data) : data,
        message: typeof data === 'object' ? data.message : undefined,
      };
    } catch (error) {
      console.error('API request error:', error);
      
      // Network errors - retry if not exceeded max attempts
      if (retryAttempt < this.retryCount) {
        await this.delay(this.retryDelay * Math.pow(2, retryAttempt));
        return this.request(endpoint, options, retryAttempt + 1);
      }
      
      connectionStatus = 'error';
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        data: null,
      };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Auth endpoints
  async login(credentials: { email: string; password: string }) {
    const response = await this.request<{ user: any; tokens: any }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data?.tokens?.accessToken) {
      localStorage.setItem('auth-token', response.data.tokens.accessToken);
      localStorage.setItem('refresh-token', response.data.tokens.refreshToken);
    }

    return {
      ...response,
      data: response.data ? {
        ...response.data,
        token: response.data.tokens?.accessToken // For backward compatibility
      } : undefined
    };
  }

  async register(userData: { 
    email: string; 
    password: string; 
    confirmPassword: string;
    username: string; 
    displayName?: string;
  }) {
    const response = await this.request<{ user: any; tokens: any }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data?.tokens?.accessToken) {
      localStorage.setItem('auth-token', response.data.tokens.accessToken);
      localStorage.setItem('refresh-token', response.data.tokens.refreshToken);
    }

    return {
      ...response,
      data: response.data ? {
        ...response.data,
        token: response.data.tokens?.accessToken // For backward compatibility
      } : undefined
    };
  }

  async logout() {
    const response = await this.request('/api/v1/auth/logout', {
      method: 'POST',
    });
    
    localStorage.removeItem('auth-token');
    localStorage.removeItem('refresh-token');
    return response;
  }

  async getCurrentUser() {
    return this.request('/api/v1/auth/me');
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refresh-token');
    if (!refreshToken) {
      return { success: false, error: 'No refresh token available' };
    }

    const response = await this.request<{ tokens: any }>('/api/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    if (response.success && response.data?.tokens?.accessToken) {
      localStorage.setItem('auth-token', response.data.tokens.accessToken);
      localStorage.setItem('refresh-token', response.data.tokens.refreshToken);
    }

    return {
      ...response,
      data: response.data ? {
        ...response.data,
        token: response.data.tokens?.accessToken // For backward compatibility
      } : undefined
    };
  }

  // OAuth endpoints
  initiateOAuth(provider: 'google' | 'discord' | 'github', redirectUri?: string) {
    const params = new URLSearchParams();
    if (redirectUri) params.append('redirect_uri', redirectUri);
    
    const url = `${this.baseURL}/api/v1/oauth/${provider}/authorize${params.toString() ? `?${params}` : ''}`;
    window.location.href = url;
  }

  async forgotPassword(email: string) {
    return this.request('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string, confirmPassword: string) {
    return this.request('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password, confirmPassword }),
    });
  }

  async verifyEmail(token: string) {
    return this.request('/api/v1/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async resendVerification() {
    return this.request('/api/v1/auth/resend-verification', {
      method: 'POST',
    });
  }

  // Server endpoints
  async getServers() {
    return this.request('/api/v1/servers');
  }

  async getServer(serverId: string) {
    return this.request(`/api/v1/servers/${serverId}`);
  }

  async createServer(data: { name: string; description?: string }) {
    return this.request('/api/v1/servers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Channel endpoints
  async getChannels(serverId: string) {
    return this.request(`/api/v1/servers/${serverId}/channels`);
  }

  async createChannel(serverId: string, data: { name: string; type: string; description?: string }) {
    return this.request(`/api/v1/servers/${serverId}/channels`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Message endpoints
  async getMessages(channelId: string, limit = 50, before?: string) {
    const params = new URLSearchParams({ 
      limit: limit.toString(),
      ...(before && { before })
    });
    return this.request(`/api/v1/channels/${channelId}/messages?${params}`);
  }

  async sendMessage(channelId: string, data: { content: string; attachments?: string[] }) {
    return this.request(`/api/v1/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // User endpoints
  async updateProfile(data: Partial<{ displayName: string; avatar: string; status: string }>) {
    return this.request('/api/v1/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getUsers(serverId?: string) {
    const endpoint = serverId ? `/api/v1/servers/${serverId}/members` : '/api/v1/users';
    return this.request(endpoint);
  }

  // Reddit-style Posts endpoints
  async getPosts(params?: { page?: number; limit?: number; sort?: 'hot' | 'new' | 'top' }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.sort) searchParams.append('sort', params.sort);
    
    const endpoint = `/api/v1/posts${searchParams.toString() ? `?${searchParams}` : ''}`;
    return this.request(endpoint);
  }

  async getPost(postId: string) {
    return this.request(`/api/v1/posts/${postId}`);
  }

  async createPost(data: { 
    communityId: string; 
    title: string; 
    content?: string; 
    type: string;
    url?: string; 
    imageUrl?: string;
    flair?: string;
    nsfw?: boolean;
    pollOptions?: string[];
    pollDuration?: number;
  }) {
    return this.request('/api/v1/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async votePost(postId: string, value: number) {
    return this.request(`/api/v1/posts/${postId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ value }),
    });
  }

  // Comments endpoints
  async getComments(postId: string, sort?: 'top' | 'new' | 'old') {
    const params = new URLSearchParams();
    if (sort) params.append('sort', sort);
    
    const endpoint = `/api/v1/comments/post/${postId}${params.toString() ? `?${params}` : ''}`;
    return this.request(endpoint);
  }

  async createComment(data: { postId: string; parentId?: string; content: string }) {
    return this.request('/api/v1/comments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async voteComment(commentId: string, value: number) {
    return this.request(`/api/v1/comments/${commentId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ value }),
    });
  }

  async updateComment(commentId: string, content: string) {
    return this.request(`/api/v1/comments/${commentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
  }

  async deleteComment(commentId: string) {
    return this.request(`/api/v1/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  // Communities endpoints
  async getCommunities() {
    return this.request('/api/v1/communities');
  }

  async getCommunity(communityId: string) {
    return this.request(`/api/v1/communities/${communityId}`);
  }

  async createCommunity(data: { name: string; displayName: string; description?: string; isPublic?: boolean; isNsfw?: boolean }) {
    return this.request('/api/v1/communities', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCommunity(communityId: string, data: Partial<{ displayName: string; description: string; icon: string; banner: string }>) {
    return this.request(`/api/v1/communities/${communityId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async joinCommunity(communityId: string) {
    return this.request(`/api/v1/communities/${communityId}/join`, {
      method: 'POST',
    });
  }

  async leaveCommunity(communityId: string) {
    return this.request(`/api/v1/communities/${communityId}/leave`, {
      method: 'POST',
    });
  }

  // Awards endpoints
  async getAwardTypes() {
    return this.request('/api/awards/types');
  }

  async giveAward(itemType: 'post' | 'comment', itemId: string, awardType: string, message?: string, anonymous?: boolean) {
    const endpoint = itemType === 'post' ? `/api/awards/post/${itemId}` : `/api/awards/comment/${itemId}`;
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify({ awardType, message, anonymous }),
    });
  }

  async getAwards(itemType: 'post' | 'comment', itemId: string) {
    const endpoint = itemType === 'post' ? `/api/awards/post/${itemId}` : `/api/awards/comment/${itemId}`;
    return this.request(endpoint);
  }

  async getReceivedAwards(page?: number, limit?: number) {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    
    const endpoint = `/api/awards/received${params.toString() ? `?${params}` : ''}`;
    return this.request(endpoint);
  }

  async getGivenAwards(page?: number, limit?: number) {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    
    const endpoint = `/api/awards/given${params.toString() ? `?${params}` : ''}`;
    return this.request(endpoint);
  }

  // Karma endpoints
  async getUserKarma(userId?: string) {
    const endpoint = userId ? `/api/karma/user/${userId}` : '/api/karma/me';
    return this.request(endpoint);
  }

  async getKarmaHistory(page?: number, limit?: number) {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    
    const endpoint = `/api/karma/history${params.toString() ? `?${params}` : ''}`;
    return this.request(endpoint);
  }

  async getKarmaLeaderboard(timeFrame?: string, limit?: number) {
    const params = new URLSearchParams();
    if (timeFrame) params.append('timeFrame', timeFrame);
    if (limit) params.append('limit', limit.toString());
    
    const endpoint = `/api/karma/leaderboard${params.toString() ? `?${params}` : ''}`;
    return this.request(endpoint);
  }
}

// Create singleton instance
export const api = new ApiClient();

// Export for direct usage
export default api;