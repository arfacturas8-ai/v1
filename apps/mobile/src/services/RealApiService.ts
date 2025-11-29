// COMPLETE API SERVICE - NO MOCKS
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

// Use api.cryb.ai for production, local for development
const getApiUrl = () => {
  // In production, always use the live API
  if (!__DEV__) {
    return 'https://api.cryb.ai/api';
  }
  
  // In development, check for explicit dev server or use live API as fallback
  const devUrl = process.env.EXPO_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (devUrl) {
    return Platform.OS === 'android' && devUrl.includes('localhost') 
      ? devUrl.replace('localhost', '10.0.2.2') + '/api'
      : devUrl + '/api';
  }
  
  // Default to live API
  return 'https://api.cryb.ai/api';
};
const API_URL = getApiUrl();

interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
  isOnline?: boolean;
  lastSeen?: string;
}

interface Community {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  avatar?: string;
  banner?: string;
  isPrivate: boolean;
  createdAt: string;
  isMember?: boolean;
  isAdmin?: boolean;
}

interface Post {
  id: string;
  title: string;
  content: string;
  author: User;
  community: Community;
  votes: number;
  userVote?: 'up' | 'down' | null;
  commentCount: number;
  images?: string[];
  video?: string;
  audio?: string;
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
  isLocked?: boolean;
}

interface Comment {
  id: string;
  content: string;
  author: User;
  post: Post;
  votes: number;
  userVote?: 'up' | 'down' | null;
  replies: Comment[];
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  audio?: string;
}

interface Message {
  id: string;
  content: string;
  sender: User;
  recipient?: User;
  channel?: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file';
  fileUrl?: string;
  replyTo?: Message;
  reactions?: { emoji: string; users: User[]; }[];
  createdAt: string;
  updatedAt: string;
  isEdited?: boolean;
  isDelivered?: boolean;
  isRead?: boolean;
}

interface Notification {
  id: string;
  type: 'mention' | 'reply' | 'vote' | 'follow' | 'message' | 'community';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
  sender?: User;
}

class RealApiService {
  private token: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.loadTokens();
  }

  private async loadTokens() {
    try {
      this.token = await AsyncStorage.getItem('access_token');
      this.refreshToken = await AsyncStorage.getItem('refresh_token');
    } catch (error) {
      console.error('Failed to load tokens:', error);
    }
  }

  private async saveTokens(accessToken: string, refreshToken: string) {
    try {
      await AsyncStorage.setItem('access_token', accessToken);
      await AsyncStorage.setItem('refresh_token', refreshToken);
      this.token = accessToken;
      this.refreshToken = refreshToken;
    } catch (error) {
      console.error('Failed to save tokens:', error);
    }
  }

  private async clearTokens() {
    try {
      await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
      this.token = null;
      this.refreshToken = null;
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  private getHeaders(includeAuth = true): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (includeAuth && this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  private async makeRequest(url: string, options: RequestInit = {}) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      if (response.status === 401 && this.refreshToken) {
        // Try to refresh token
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry original request with new token
          return fetch(url, {
            ...options,
            headers: {
              ...this.getHeaders(),
              ...options.headers,
            },
          });
        }
      }

      return response;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // AUTH ENDPOINTS
  async register(email: string, password: string, username: string) {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username })
    });
    
    const data = await response.json();
    if (data.success && data.token) {
      await this.saveTokens(data.token, data.refreshToken || data.token);
    }
    return data;
  }

  async login(email: string, password: string) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    if (data.success && data.token) {
      await this.saveTokens(data.token, data.refreshToken || data.token);
    }
    return data;
  }

  async logout() {
    try {
      await this.makeRequest(`${API_URL}/auth/logout`, { method: 'POST' });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      await this.clearTokens();
    }
  }

  async refreshAccessToken() {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });

      const data = await response.json();
      if (data.success && data.token) {
        await this.saveTokens(data.token, data.refreshToken || this.refreshToken!);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  async forgotPassword(email: string) {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return response.json();
  }

  async resetPassword(token: string, password: string) {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password })
    });
    return response.json();
  }

  // USER ENDPOINTS
  async getCurrentUser(): Promise<User> {
    const response = await this.makeRequest(`${API_URL}/users/me`);
    const data = await response.json();
    return data.user || data;
  }

  async getUserProfile(userId: string): Promise<User> {
    const response = await this.makeRequest(`${API_URL}/users/${userId}`);
    const data = await response.json();
    return data.user || data;
  }

  async updateProfile(updates: Partial<User>) {
    const response = await this.makeRequest(`${API_URL}/users/me`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return response.json();
  }

  async searchUsers(query: string): Promise<User[]> {
    const response = await this.makeRequest(`${API_URL}/users/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    return data.users || data;
  }

  // COMMUNITY ENDPOINTS
  async getCommunities(): Promise<Community[]> {
    const response = await this.makeRequest(`${API_URL}/communities`);
    const data = await response.json();
    return data.communities || data;
  }

  async getCommunity(communityId: string): Promise<Community> {
    const response = await this.makeRequest(`${API_URL}/communities/${communityId}`);
    const data = await response.json();
    return data.community || data;
  }

  async createCommunity(name: string, description: string, isPrivate = false) {
    const response = await this.makeRequest(`${API_URL}/communities`, {
      method: 'POST',
      body: JSON.stringify({ name, description, isPrivate })
    });
    return response.json();
  }

  async joinCommunity(communityId: string) {
    const response = await this.makeRequest(`${API_URL}/communities/${communityId}/join`, {
      method: 'POST'
    });
    return response.json();
  }

  async leaveCommunity(communityId: string) {
    const response = await this.makeRequest(`${API_URL}/communities/${communityId}/leave`, {
      method: 'DELETE'
    });
    return response.json();
  }

  async getCommunityMembers(communityId: string): Promise<User[]> {
    const response = await this.makeRequest(`${API_URL}/communities/${communityId}/members`);
    const data = await response.json();
    return data.members || data;
  }

  async searchCommunities(query: string): Promise<Community[]> {
    const response = await this.makeRequest(`${API_URL}/communities/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    return data.communities || data;
  }

  // POST ENDPOINTS
  async getPosts(
    communityId?: string, 
    sortBy: 'hot' | 'new' | 'top' | 'rising' | 'controversial' | 'gilded' = 'hot', 
    limit = 20, 
    offset = 0,
    timeRange?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all'
  ): Promise<Post[]> {
    const params = new URLSearchParams({
      sortBy,
      limit: limit.toString(),
      offset: offset.toString()
    });
    
    if (communityId) {
      params.append('communityId', communityId);
    }
    
    if (timeRange) {
      params.append('timeRange', timeRange);
    }
    
    const response = await this.makeRequest(`${API_URL}/posts?${params.toString()}`);
    const data = await response.json();
    return data.posts || data;
  }

  async getPost(postId: string): Promise<Post> {
    const response = await this.makeRequest(`${API_URL}/posts/${postId}`);
    const data = await response.json();
    return data.post || data;
  }

  async createPost(title: string, content: string, communityId: string, mediaFiles?: string[]) {
    const response = await this.makeRequest(`${API_URL}/posts`, {
      method: 'POST',
      body: JSON.stringify({ title, content, communityId, images: mediaFiles })
    });
    return response.json();
  }

  async updatePost(postId: string, updates: { title?: string; content?: string }) {
    const response = await this.makeRequest(`${API_URL}/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return response.json();
  }

  async deletePost(postId: string) {
    const response = await this.makeRequest(`${API_URL}/posts/${postId}`, {
      method: 'DELETE'
    });
    return response.json();
  }

  async votePost(postId: string, vote: 'up' | 'down') {
    const response = await this.makeRequest(`${API_URL}/posts/${postId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ vote })
    });
    return response.json();
  }


  // COMMENT ENDPOINTS
  async getComments(postId: string): Promise<Comment[]> {
    const response = await this.makeRequest(`${API_URL}/comments?postId=${postId}`);
    const data = await response.json();
    return data.comments || data;
  }

  async createComment(content: string, postId: string, parentId?: string, audioUrl?: string) {
    const response = await this.makeRequest(`${API_URL}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, postId, parentId, audio: audioUrl })
    });
    return response.json();
  }

  async updateComment(commentId: string, content: string) {
    const response = await this.makeRequest(`${API_URL}/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify({ content })
    });
    return response.json();
  }

  async deleteComment(commentId: string) {
    const response = await this.makeRequest(`${API_URL}/comments/${commentId}`, {
      method: 'DELETE'
    });
    return response.json();
  }

  async voteComment(commentId: string, vote: 'up' | 'down') {
    const response = await this.makeRequest(`${API_URL}/comments/${commentId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ vote })
    });
    return response.json();
  }

  // MESSAGE ENDPOINTS
  async getMessages(channelId?: string, userId?: string, limit = 50, offset = 0): Promise<Message[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    
    if (channelId) params.append('channelId', channelId);
    if (userId) params.append('userId', userId);
    
    const response = await this.makeRequest(`${API_URL}/messages?${params.toString()}`);
    const data = await response.json();
    return data.messages || data;
  }

  async sendMessage(content: string, recipientId?: string, channelId?: string, type = 'text', fileUrl?: string) {
    const response = await this.makeRequest(`${API_URL}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, recipientId, channelId, type, fileUrl })
    });
    return response.json();
  }

  async updateMessage(messageId: string, content: string) {
    const response = await this.makeRequest(`${API_URL}/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ content })
    });
    return response.json();
  }

  async deleteMessage(messageId: string) {
    const response = await this.makeRequest(`${API_URL}/messages/${messageId}`, {
      method: 'DELETE'
    });
    return response.json();
  }

  async addReaction(messageId: string, emoji: string) {
    const response = await this.makeRequest(`${API_URL}/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji })
    });
    return response.json();
  }

  async getConversations(): Promise<any[]> {
    const response = await this.makeRequest(`${API_URL}/conversations`);
    const data = await response.json();
    return data.conversations || data;
  }

  // NOTIFICATION ENDPOINTS
  async getNotifications(limit = 50, offset = 0): Promise<Notification[]> {
    const response = await this.makeRequest(`${API_URL}/notifications?limit=${limit}&offset=${offset}`);
    const data = await response.json();
    return data.notifications || data;
  }

  async markNotificationRead(notificationId: string) {
    const response = await this.makeRequest(`${API_URL}/notifications/${notificationId}/read`, {
      method: 'PUT'
    });
    return response.json();
  }

  async markAllNotificationsRead() {
    const response = await this.makeRequest(`${API_URL}/notifications/read-all`, {
      method: 'PUT'
    });
    return response.json();
  }

  async registerPushToken(token: string, platform: 'ios' | 'android') {
    const response = await this.makeRequest(`${API_URL}/notifications/push-token`, {
      method: 'POST',
      body: JSON.stringify({ token, platform })
    });
    return response.json();
  }

  // EXTENDED POST ENDPOINTS
  async savePost(postId: string, save: boolean = true) {
    const response = await this.makeRequest(`${API_URL}/posts/${postId}/save`, {
      method: save ? 'POST' : 'DELETE'
    });
    return response.json();
  }

  async hidePost(postId: string, hide: boolean = true) {
    const response = await this.makeRequest(`${API_URL}/posts/${postId}/hide`, {
      method: hide ? 'POST' : 'DELETE'
    });
    return response.json();
  }

  async reportPost(postId: string, reason: string, customReason?: string) {
    const response = await this.makeRequest(`${API_URL}/posts/${postId}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason, customReason })
    });
    return response.json();
  }

  async crossPost(postId: string, communityId: string, title?: string) {
    const response = await this.makeRequest(`${API_URL}/posts/${postId}/crosspost`, {
      method: 'POST',
      body: JSON.stringify({ communityId, title })
    });
    return response.json();
  }

  async getSavedPosts(limit = 20, offset = 0): Promise<Post[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    const response = await this.makeRequest(`${API_URL}/users/me/saved?${params.toString()}`);
    const data = await response.json();
    return data.posts || data;
  }

  // USER FEATURES
  async followUser(userId: string) {
    const response = await this.makeRequest(`${API_URL}/users/${userId}/follow`, {
      method: 'POST'
    });
    return response.json();
  }

  async unfollowUser(userId: string) {
    const response = await this.makeRequest(`${API_URL}/users/${userId}/follow`, {
      method: 'DELETE'
    });
    return response.json();
  }

  async blockUser(userId: string, reason?: string) {
    const response = await this.makeRequest(`${API_URL}/users/${userId}/block`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
    return response.json();
  }

  async unblockUser(userId: string) {
    const response = await this.makeRequest(`${API_URL}/users/${userId}/block`, {
      method: 'DELETE'
    });
    return response.json();
  }

  async getTrophies(userId?: string) {
    const endpoint = userId ? `${API_URL}/users/${userId}/trophies` : `${API_URL}/users/me/trophies`;
    const response = await this.makeRequest(endpoint);
    const data = await response.json();
    return data.trophies || data;
  }

  async getUserFlair(communityId: string, userId?: string) {
    const endpoint = userId 
      ? `${API_URL}/communities/${communityId}/flair/${userId}`
      : `${API_URL}/communities/${communityId}/flair/me`;
    const response = await this.makeRequest(endpoint);
    return response.json();
  }

  async setUserFlair(communityId: string, flairId: string, text?: string) {
    const response = await this.makeRequest(`${API_URL}/communities/${communityId}/flair/me`, {
      method: 'POST',
      body: JSON.stringify({ flairId, text })
    });
    return response.json();
  }

  // KARMA SYSTEM
  async getUserKarma(userId?: string) {
    const endpoint = userId ? `${API_URL}/karma/user/${userId}` : `${API_URL}/karma/me`;
    const response = await this.makeRequest(endpoint);
    return response.json();
  }

  async getKarmaHistory(limit = 50, offset = 0) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    const response = await this.makeRequest(`${API_URL}/karma/history?${params.toString()}`);
    return response.json();
  }

  async getKarmaLeaderboard(timeFrame?: string, limit = 50) {
    const params = new URLSearchParams();
    if (timeFrame) params.append('timeFrame', timeFrame);
    if (limit) params.append('limit', limit.toString());
    
    const response = await this.makeRequest(`${API_URL}/karma/leaderboard${params.toString() ? `?${params}` : ''}`);
    return response.json();
  }

  // AWARDS SYSTEM
  async getAwardTypes() {
    const response = await this.makeRequest(`${API_URL}/awards/types`);
    return response.json();
  }

  async giveAward(itemType: 'post' | 'comment', itemId: string, awardType: string, message?: string, anonymous = false) {
    const endpoint = itemType === 'post' 
      ? `${API_URL}/awards/post/${itemId}` 
      : `${API_URL}/awards/comment/${itemId}`;
    const response = await this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({ awardType, message, anonymous })
    });
    return response.json();
  }

  async getReceivedAwards(limit = 50, offset = 0) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    const response = await this.makeRequest(`${API_URL}/awards/received?${params.toString()}`);
    return response.json();
  }

  // COMMUNITY FEATURES
  async getCommunityRules(communityId: string) {
    const response = await this.makeRequest(`${API_URL}/communities/${communityId}/rules`);
    return response.json();
  }

  async getCommunityWiki(communityId: string) {
    const response = await this.makeRequest(`${API_URL}/communities/${communityId}/wiki`);
    return response.json();
  }

  async getWikiPage(communityId: string, pageId: string) {
    const response = await this.makeRequest(`${API_URL}/communities/${communityId}/wiki/${pageId}`);
    return response.json();
  }

  async getCommunityModerators(communityId: string) {
    const response = await this.makeRequest(`${API_URL}/communities/${communityId}/moderators`);
    return response.json();
  }

  // MODERATION
  async reportComment(commentId: string, reason: string, customReason?: string) {
    const response = await this.makeRequest(`${API_URL}/comments/${commentId}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason, customReason })
    });
    return response.json();
  }

  async banUser(communityId: string, userId: string, reason?: string, duration?: number) {
    const response = await this.makeRequest(`${API_URL}/moderation/communities/${communityId}/ban`, {
      method: 'POST',
      body: JSON.stringify({ userId, reason, duration })
    });
    return response.json();
  }

  async muteUser(communityId: string, userId: string, reason?: string, duration = 7) {
    const response = await this.makeRequest(`${API_URL}/moderation/communities/${communityId}/mute`, {
      method: 'POST',
      body: JSON.stringify({ userId, reason, duration })
    });
    return response.json();
  }

  // DIRECT MESSAGES / CHAT
  async getDirectMessages(userId: string, limit = 50, offset = 0): Promise<Message[]> {
    const params = new URLSearchParams({
      userId,
      limit: limit.toString(),
      offset: offset.toString()
    });
    const response = await this.makeRequest(`${API_URL}/conversations?${params.toString()}`);
    const data = await response.json();
    return data.messages || data;
  }

  async sendDirectMessage(recipientId: string, content: string) {
    const response = await this.makeRequest(`${API_URL}/conversations`, {
      method: 'POST',
      body: JSON.stringify({ recipientId, content })
    });
    return response.json();
  }

  async getConversationsList(limit = 20, offset = 0) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    const response = await this.makeRequest(`${API_URL}/conversations?${params.toString()}`);
    return response.json();
  }

  async markConversationRead(conversationId: string) {
    const response = await this.makeRequest(`${API_URL}/conversations/${conversationId}/read`, {
      method: 'POST'
    });
    return response.json();
  }

  // GLOBAL SEARCH - matches API endpoint GET /api/search
  async search(
    query: string,
    filters?: {
      type?: 'posts' | 'communities' | 'users';
      sort?: 'relevance' | 'top' | 'new' | 'comments';
      time?: 'all' | 'year' | 'month' | 'week' | 'day' | 'hour';
      communityId?: string;
      author?: string;
    },
    limit = 20,
    offset = 0
  ): Promise<{
    posts?: Post[];
    communities?: Community[];
    users?: User[];
    totalCount: number;
    hasMore: boolean;
  }> {
    const params = new URLSearchParams({ 
      q: query, 
      limit: limit.toString(), 
      offset: offset.toString() 
    });
    
    if (filters?.type) params.append('type', filters.type);
    if (filters?.sort) params.append('sort', filters.sort);
    if (filters?.time) params.append('time', filters.time);
    if (filters?.communityId) params.append('communityId', filters.communityId);
    if (filters?.author) params.append('author', filters.author);
    
    const response = await this.makeRequest(`${API_URL}/search?${params.toString()}`);
    const data = await response.json();
    return data;
  }

  // SEARCH POSTS
  async searchPosts(
    query: string, 
    filters?: {
      sort?: 'relevance' | 'top' | 'new' | 'comments';
      time?: 'all' | 'year' | 'month' | 'week' | 'day' | 'hour';
      communityId?: string;
      author?: string;
    },
    limit = 20, 
    offset = 0
  ): Promise<Post[]> {
    const params = new URLSearchParams({ 
      q: query, 
      limit: limit.toString(), 
      offset: offset.toString() 
    });
    
    if (filters?.sort) params.append('sort', filters.sort);
    if (filters?.time) params.append('time', filters.time);
    if (filters?.communityId) params.append('communityId', filters.communityId);
    if (filters?.author) params.append('author', filters.author);
    
    const response = await this.makeRequest(`${API_URL}/search/posts?${params.toString()}`);
    const data = await response.json();
    return data.posts || data;
  }

  async searchComments(
    query: string, 
    filters?: {
      sort?: 'relevance' | 'top' | 'new';
      communityId?: string;
      author?: string;
    },
    limit = 20, 
    offset = 0
  ): Promise<Comment[]> {
    const params = new URLSearchParams({ 
      q: query, 
      limit: limit.toString(), 
      offset: offset.toString() 
    });
    
    if (filters?.sort) params.append('sort', filters.sort);
    if (filters?.communityId) params.append('communityId', filters.communityId);
    if (filters?.author) params.append('author', filters.author);
    
    const response = await this.makeRequest(`${API_URL}/search/comments?${params.toString()}`);
    const data = await response.json();
    return data.comments || data;
  }

  // LIVE DISCUSSIONS
  async createLiveDiscussion(postId: string) {
    const response = await this.makeRequest(`${API_URL}/posts/${postId}/live`, {
      method: 'POST'
    });
    return response.json();
  }

  async joinLiveDiscussion(postId: string) {
    const response = await this.makeRequest(`${API_URL}/posts/${postId}/live/join`, {
      method: 'POST'
    });
    return response.json();
  }

  async leaveLiveDiscussion(postId: string) {
    const response = await this.makeRequest(`${API_URL}/posts/${postId}/live/leave`, {
      method: 'POST'
    });
    return response.json();
  }

  // MEDIA UPLOAD ENDPOINTS
  async uploadMedia(uri: string, type: 'image' | 'video' | 'audio', purpose = 'post'): Promise<string> {
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'media';
      const match = /\.([\w]+)$/.exec(filename);
      const fileType = match ? `${type}/${match[1]}` : `${type}/jpeg`;
      
      formData.append('file', {
        uri,
        name: filename,
        type: fileType,
      } as any);
      
      formData.append('purpose', purpose);
      
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      
      const data = await response.json();
      return data.url || data.fileUrl;
    } catch (error) {
      console.error('Media upload failed:', error);
      throw error;
    }
  }

  async uploadAudio(uri: string): Promise<string> {
    return this.uploadMedia(uri, 'audio', 'message');
  }

  async uploadAvatar(uri: string): Promise<string> {
    return this.uploadMedia(uri, 'image', 'avatar');
  }

  // UTILITY ENDPOINTS
  async getHealth() {
    const response = await fetch(`${API_URL.replace('/api', '')}/health`);
    return response.json();
  }

  async getServerStats() {
    const response = await this.makeRequest(`${API_URL}/stats`);
    return response.json();
  }

  // CALL ENDPOINTS
  async initiateCall(recipientId: string, type: 'voice' | 'video') {
    const response = await this.makeRequest(`${API_URL}/calls/initiate`, {
      method: 'POST',
      body: JSON.stringify({ recipientId, type })
    });
    return response.json();
  }

  async answerCall(callId: string) {
    const response = await this.makeRequest(`${API_URL}/calls/${callId}/answer`, {
      method: 'POST'
    });
    return response.json();
  }

  async endCall(callId: string) {
    const response = await this.makeRequest(`${API_URL}/calls/${callId}/end`, {
      method: 'POST'
    });
    return response.json();
  }

  // HELPER METHODS
  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }
}

const apiService = new RealApiService();
export default apiService;

// Export types for use in components
export type { User, Community, Post, Comment, Message, Notification };