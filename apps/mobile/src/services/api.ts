import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002';

class ApiService {
  private token: string | null = null;

  async getAuthToken(): Promise<string | null> {
    if (!this.token) {
      this.token = await AsyncStorage.getItem('authToken');
    }
    return this.token;
  }

  async setAuthToken(token: string): Promise<void> {
    this.token = token;
    await AsyncStorage.setItem('authToken', token);
  }

  async clearAuthToken(): Promise<void> {
    this.token = null;
    await AsyncStorage.removeItem('authToken');
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await this.getAuthToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.clearAuthToken();
        }
        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (response.accessToken) {
      await this.setAuthToken(response.accessToken);
    }
    
    return response;
  }

  async register(data: any) {
    const response = await this.request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    if (response.accessToken) {
      await this.setAuthToken(response.accessToken);
    }
    
    return response;
  }

  async logout() {
    await this.request('/api/v1/auth/logout', { method: 'POST' });
    await this.clearAuthToken();
  }

  // Community endpoints
  async getCommunities(page = 1, limit = 20) {
    return this.request(`/api/v1/communities?page=${page}&limit=${limit}`);
  }

  async getCommunity(id: string) {
    return this.request(`/api/v1/communities/${id}`);
  }

  async joinCommunity(id: string) {
    return this.request(`/api/v1/communities/${id}/join`, { method: 'POST' });
  }

  async leaveCommunity(id: string) {
    return this.request(`/api/v1/communities/${id}/leave`, { method: 'POST' });
  }

  // Post endpoints
  async createPost(data: { communityId: string; title: string; content: string; type: string }) {
    return this.request('/api/v1/posts', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getPost(id: string) {
    return this.request(`/api/v1/posts/${id}`);
  }

  async getPosts(communityId?: string, page = 1, limit = 20) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    
    if (communityId) {
      params.append('communityId', communityId);
    }
    
    return this.request(`/api/v1/posts?${params}`);
  }

  async votePost(postId: string, voteType: 'upvote' | 'downvote') {
    return this.request(`/api/v1/posts/${postId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ voteType })
    });
  }

  async savePost(postId: string) {
    return this.request(`/api/v1/posts/${postId}/save`, { method: 'POST' });
  }

  async unsavePost(postId: string) {
    return this.request(`/api/v1/posts/${postId}/unsave`, { method: 'POST' });
  }

  async sharePost(postId: string) {
    return this.request(`/api/v1/posts/${postId}/share`, { method: 'POST' });
  }

  // Comment endpoints
  async getComments(postId: string, page = 1, limit = 20) {
    return this.request(`/api/v1/posts/${postId}/comments?page=${page}&limit=${limit}`);
  }

  async createComment(postId: string, content: string, parentId?: string) {
    return this.request(`/api/v1/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parentId })
    });
  }

  async voteComment(commentId: string, voteType: 'upvote' | 'downvote') {
    return this.request(`/api/v1/comments/${commentId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ voteType })
    });
  }

  // Server endpoints (Discord-like)
  async getServers() {
    return this.request('/api/v1/servers');
  }

  async createServer(data: { name: string; description?: string }) {
    return this.request('/api/v1/servers', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getServerChannels(serverId: string) {
    return this.request(`/api/v1/servers/${serverId}/channels`);
  }

  // Message endpoints
  async getMessages(channelId: string, limit = 50, before?: string) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (before) params.append('before', before);
    
    return this.request(`/api/v1/channels/${channelId}/messages?${params}`);
  }

  async sendMessage(channelId: string, content: string) {
    return this.request(`/api/v1/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  }

  async pinMessage(messageId: string) {
    return this.request(`/api/v1/messages/${messageId}/pin`, { method: 'POST' });
  }

  async unpinMessage(messageId: string) {
    return this.request(`/api/v1/messages/${messageId}/unpin`, { method: 'POST' });
  }

  async markAsRead(channelId: string) {
    return this.request(`/api/v1/channels/${channelId}/read`, { method: 'POST' });
  }

  // User/Profile endpoints
  async getCurrentUser() {
    return this.request('/api/v1/users/me');
  }

  async updateProfile(data: any) {
    return this.request('/api/v1/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async uploadAvatar(file: any) {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.request('/api/v1/users/me/avatar', {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data' },
      body: formData
    });
  }

  async uploadBanner(file: any) {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.request('/api/v1/users/me/banner', {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data' },
      body: formData
    });
  }

  async getUser(userId: string) {
    return this.request(`/api/v1/users/${userId}`);
  }

  async followUser(userId: string) {
    return this.request(`/api/v1/users/${userId}/follow`, { method: 'POST' });
  }

  async unfollowUser(userId: string) {
    return this.request(`/api/v1/users/${userId}/unfollow`, { method: 'POST' });
  }

  // Notification endpoints
  async getNotifications(page = 1, limit = 20) {
    return this.request(`/api/v1/notifications?page=${page}&limit=${limit}`);
  }

  async markNotificationRead(notificationId: string) {
    return this.request(`/api/v1/notifications/${notificationId}/read`, { method: 'POST' });
  }

  async markAllNotificationsRead() {
    return this.request('/api/v1/notifications/read-all', { method: 'POST' });
  }

  async updateNotificationSettings(settings: any) {
    return this.request('/api/v1/users/me/notification-settings', {
      method: 'PATCH',
      body: JSON.stringify(settings)
    });
  }

  // Search endpoints
  async search(query: string, type?: 'posts' | 'users' | 'communities') {
    const params = new URLSearchParams({ q: query });
    if (type) params.append('type', type);
    
    return this.request(`/api/v1/search?${params}`);
  }

  // Voice channel endpoints
  async joinVoiceChannel(channelId: string) {
    return this.request(`/api/v1/channels/${channelId}/voice/join`, { method: 'POST' });
  }

  async leaveVoiceChannel(channelId: string) {
    return this.request(`/api/v1/channels/${channelId}/voice/leave`, { method: 'POST' });
  }

  async getVoiceToken(channelId: string) {
    return this.request(`/api/v1/channels/${channelId}/voice/token`);
  }

  async muteUser(channelId: string, userId: string) {
    return this.request(`/api/v1/channels/${channelId}/voice/mute`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  async deafenUser(channelId: string, userId: string) {
    return this.request(`/api/v1/channels/${channelId}/voice/deafen`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }
}

export const api = new ApiService();