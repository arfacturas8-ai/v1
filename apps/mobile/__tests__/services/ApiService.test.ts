import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock network info
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true, type: 'wifi' })),
  addEventListener: jest.fn(),
  useNetInfo: jest.fn(() => ({ isConnected: true, type: 'wifi' })),
}));

// ApiService implementation for testing
class ApiService {
  private baseURL: string;
  private authToken: string | null = null;

  constructor(baseURL: string = 'http://localhost:3000/api') {
    this.baseURL = baseURL;
  }

  async initialize() {
    const token = await AsyncStorage.getItem('authToken');
    this.authToken = token;
  }

  async setAuthToken(token: string) {
    this.authToken = token;
    await AsyncStorage.setItem('authToken', token);
  }

  async clearAuthToken() {
    this.authToken = null;
    await AsyncStorage.removeItem('authToken');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth methods
  async login(email: string, password: string) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    await this.setAuthToken(data.token);
    return data;
  }

  async register(userData: {
    username: string;
    email: string;
    password: string;
    displayName?: string;
  }) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    await this.setAuthToken(data.token);
    return data;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      await this.clearAuthToken();
    }
  }

  async refreshToken() {
    const data = await this.request('/auth/refresh', { method: 'POST' });
    await this.setAuthToken(data.token);
    return data;
  }

  // User methods
  async getProfile() {
    return this.request('/users/me');
  }

  async updateProfile(updates: {
    displayName?: string;
    bio?: string;
    avatar?: string;
  }) {
    return this.request('/users/me', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Feed methods
  async getFeed(params: {
    sort?: 'hot' | 'new' | 'top';
    timeRange?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
    page?: number;
    limit?: number;
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    const query = searchParams.toString();
    const endpoint = `/posts${query ? `?${query}` : ''}`;
    
    return this.request(endpoint);
  }

  async getPost(postId: string) {
    return this.request(`/posts/${postId}`);
  }

  async createPost(postData: {
    title: string;
    content: string;
    communityId: string;
    tags?: string[];
  }) {
    return this.request('/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  async votePost(postId: string, direction: 'up' | 'down') {
    return this.request(`/posts/${postId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ direction }),
    });
  }

  // Comment methods
  async getComments(postId: string) {
    return this.request(`/posts/${postId}/comments`);
  }

  async createComment(postId: string, content: string, parentId?: string) {
    return this.request(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parentId }),
    });
  }

  async voteComment(commentId: string, direction: 'up' | 'down') {
    return this.request(`/comments/${commentId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ direction }),
    });
  }

  // Community methods
  async getCommunities(params: { limit?: number; search?: string } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    const query = searchParams.toString();
    const endpoint = `/communities${query ? `?${query}` : ''}`;
    
    return this.request(endpoint);
  }

  async getCommunity(communityId: string) {
    return this.request(`/communities/${communityId}`);
  }

  async joinCommunity(communityId: string) {
    return this.request(`/communities/${communityId}/join`, {
      method: 'POST',
    });
  }

  async leaveCommunity(communityId: string) {
    return this.request(`/communities/${communityId}/leave`, {
      method: 'POST',
    });
  }

  // Notification methods
  async getNotifications(params: { page?: number; limit?: number } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    const query = searchParams.toString();
    const endpoint = `/notifications${query ? `?${query}` : ''}`;
    
    return this.request(endpoint);
  }

  async markNotificationRead(notificationId: string) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsRead() {
    return this.request('/notifications/read-all', {
      method: 'PUT',
    });
  }

  // Chat methods
  async getMessages(channelId: string, params: { before?: string; limit?: number } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    const query = searchParams.toString();
    const endpoint = `/channels/${channelId}/messages${query ? `?${query}` : ''}`;
    
    return this.request(endpoint);
  }

  async sendMessage(channelId: string, content: string, type: 'text' | 'image' | 'file' = 'text') {
    return this.request(`/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, type }),
    });
  }

  // Upload methods
  async uploadFile(file: File | Blob, type: 'image' | 'video' | 'document' | 'audio') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await fetch(`${this.baseURL}/uploads`, {
      method: 'POST',
      headers: {
        'Authorization': this.authToken ? `Bearer ${this.authToken}` : '',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Search methods
  async search(query: string, type: 'posts' | 'communities' | 'users' | 'all' = 'all') {
    const searchParams = new URLSearchParams({ query, type });
    return this.request(`/search?${searchParams.toString()}`);
  }
}

describe('ApiService', () => {
  let apiService: ApiService;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

  beforeEach(() => {
    jest.clearAllMocks();
    apiService = new ApiService('http://localhost:3000/api');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Initialization', () => {
    it('initializes with stored auth token', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('stored-token');

      await apiService.initialize();

      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('authToken');
    });

    it('initializes without auth token when none stored', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      await apiService.initialize();

      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('authToken');
    });
  });

  describe('Authentication', () => {
    it('logs in successfully', async () => {
      const mockResponse = {
        user: { id: '1', username: 'testuser' },
        token: 'auth-token',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await apiService.login('test@example.com', 'password');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password',
          }),
        })
      );

      expect(result).toEqual(mockResponse);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('authToken', 'auth-token');
    });

    it('handles login failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Invalid credentials' }),
      } as Response);

      await expect(apiService.login('test@example.com', 'wrong-password')).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('registers new user successfully', async () => {
      const userData = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        displayName: 'New User',
      };

      const mockResponse = {
        user: { id: '2', username: 'newuser' },
        token: 'new-auth-token',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await apiService.register(userData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/register',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(userData),
        })
      );

      expect(result).toEqual(mockResponse);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('authToken', 'new-auth-token');
    });

    it('logs out successfully', async () => {
      await apiService.setAuthToken('test-token');

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      await apiService.logout();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/logout',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          }),
        })
      );

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('authToken');
    });

    it('refreshes token successfully', async () => {
      await apiService.setAuthToken('old-token');

      const mockResponse = { token: 'new-token' };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await apiService.refreshToken();

      expect(result).toEqual(mockResponse);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('authToken', 'new-token');
    });
  });

  describe('User Profile', () => {
    beforeEach(async () => {
      await apiService.setAuthToken('test-token');
    });

    it('gets user profile', async () => {
      const mockProfile = {
        id: '1',
        username: 'testuser',
        displayName: 'Test User',
        bio: 'Test bio',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockProfile),
      } as Response);

      const result = await apiService.getProfile();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/users/me',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          }),
        })
      );

      expect(result).toEqual(mockProfile);
    });

    it('updates user profile', async () => {
      const updates = {
        displayName: 'Updated Name',
        bio: 'Updated bio',
      };

      const mockUpdatedProfile = {
        id: '1',
        username: 'testuser',
        ...updates,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUpdatedProfile),
      } as Response);

      const result = await apiService.updateProfile(updates);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/users/me',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updates),
        })
      );

      expect(result).toEqual(mockUpdatedProfile);
    });
  });

  describe('Feed Operations', () => {
    beforeEach(async () => {
      await apiService.setAuthToken('test-token');
    });

    it('gets feed with default parameters', async () => {
      const mockFeedData = {
        posts: [
          { id: '1', title: 'Post 1' },
          { id: '2', title: 'Post 2' },
        ],
        pagination: { page: 1, totalPages: 5 },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFeedData),
      } as Response);

      const result = await apiService.getFeed();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/posts',
        expect.any(Object)
      );

      expect(result).toEqual(mockFeedData);
    });

    it('gets feed with custom parameters', async () => {
      const params = {
        sort: 'top' as const,
        timeRange: 'week' as const,
        page: 2,
        limit: 20,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ posts: [] }),
      } as Response);

      await apiService.getFeed(params);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/posts?sort=top&timeRange=week&page=2&limit=20',
        expect.any(Object)
      );
    });

    it('gets single post', async () => {
      const mockPost = {
        id: '1',
        title: 'Test Post',
        content: 'Test content',
        author: { username: 'testuser' },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockPost),
      } as Response);

      const result = await apiService.getPost('1');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/posts/1',
        expect.any(Object)
      );

      expect(result).toEqual(mockPost);
    });

    it('creates new post', async () => {
      const postData = {
        title: 'New Post',
        content: 'New post content',
        communityId: 'community-1',
        tags: ['test', 'new'],
      };

      const mockCreatedPost = {
        id: '3',
        ...postData,
        author: { username: 'testuser' },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCreatedPost),
      } as Response);

      const result = await apiService.createPost(postData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/posts',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
        })
      );

      expect(result).toEqual(mockCreatedPost);
    });

    it('votes on post', async () => {
      const mockVoteResponse = { success: true, newVoteCount: 43 };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockVoteResponse),
      } as Response);

      const result = await apiService.votePost('1', 'up');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/posts/1/vote',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ direction: 'up' }),
        })
      );

      expect(result).toEqual(mockVoteResponse);
    });
  });

  describe('Comment Operations', () => {
    beforeEach(async () => {
      await apiService.setAuthToken('test-token');
    });

    it('gets comments for post', async () => {
      const mockComments = {
        comments: [
          { id: '1', content: 'First comment' },
          { id: '2', content: 'Second comment' },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockComments),
      } as Response);

      const result = await apiService.getComments('post-1');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/posts/post-1/comments',
        expect.any(Object)
      );

      expect(result).toEqual(mockComments);
    });

    it('creates new comment', async () => {
      const mockCreatedComment = {
        id: '3',
        content: 'New comment',
        author: { username: 'testuser' },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCreatedComment),
      } as Response);

      const result = await apiService.createComment('post-1', 'New comment');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/posts/post-1/comments',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ content: 'New comment', parentId: undefined }),
        })
      );

      expect(result).toEqual(mockCreatedComment);
    });

    it('creates reply comment', async () => {
      const mockReplyComment = {
        id: '4',
        content: 'Reply comment',
        parentId: 'comment-1',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockReplyComment),
      } as Response);

      const result = await apiService.createComment('post-1', 'Reply comment', 'comment-1');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/posts/post-1/comments',
        expect.objectContaining({
          body: JSON.stringify({ content: 'Reply comment', parentId: 'comment-1' }),
        })
      );

      expect(result).toEqual(mockReplyComment);
    });
  });

  describe('Community Operations', () => {
    beforeEach(async () => {
      await apiService.setAuthToken('test-token');
    });

    it('gets communities list', async () => {
      const mockCommunities = {
        communities: [
          { id: '1', name: 'Community 1' },
          { id: '2', name: 'Community 2' },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCommunities),
      } as Response);

      const result = await apiService.getCommunities();

      expect(result).toEqual(mockCommunities);
    });

    it('gets communities with search parameters', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ communities: [] }),
      } as Response);

      await apiService.getCommunities({ limit: 10, search: 'tech' });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/communities?limit=10&search=tech',
        expect.any(Object)
      );
    });

    it('joins community', async () => {
      const mockJoinResponse = { success: true, memberCount: 1235 };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockJoinResponse),
      } as Response);

      const result = await apiService.joinCommunity('community-1');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/communities/community-1/join',
        expect.objectContaining({ method: 'POST' })
      );

      expect(result).toEqual(mockJoinResponse);
    });

    it('leaves community', async () => {
      const mockLeaveResponse = { success: true, memberCount: 1233 };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLeaveResponse),
      } as Response);

      const result = await apiService.leaveCommunity('community-1');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/communities/community-1/leave',
        expect.objectContaining({ method: 'POST' })
      );

      expect(result).toEqual(mockLeaveResponse);
    });
  });

  describe('Notification Operations', () => {
    beforeEach(async () => {
      await apiService.setAuthToken('test-token');
    });

    it('gets notifications', async () => {
      const mockNotifications = {
        notifications: [
          { id: '1', title: 'New comment', isRead: false },
          { id: '2', title: 'Post liked', isRead: true },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockNotifications),
      } as Response);

      const result = await apiService.getNotifications();

      expect(result).toEqual(mockNotifications);
    });

    it('marks single notification as read', async () => {
      const mockResponse = { success: true };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await apiService.markNotificationRead('notification-1');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/notifications/notification-1/read',
        expect.objectContaining({ method: 'PUT' })
      );

      expect(result).toEqual(mockResponse);
    });

    it('marks all notifications as read', async () => {
      const mockResponse = { success: true, readCount: 5 };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await apiService.markAllNotificationsRead();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/notifications/read-all',
        expect.objectContaining({ method: 'PUT' })
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await apiService.setAuthToken('test-token');
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(apiService.getFeed()).rejects.toThrow('Network error');
    });

    it('handles HTTP errors with JSON response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Bad request' }),
      } as Response);

      await expect(apiService.getFeed()).rejects.toThrow('Bad request');
    });

    it('handles HTTP errors without JSON response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as Response);

      await expect(apiService.getFeed()).rejects.toThrow('HTTP 500');
    });

    it('handles unauthorized errors gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Unauthorized' }),
      } as Response);

      await expect(apiService.getProfile()).rejects.toThrow('Unauthorized');
    });
  });

  describe('File Upload', () => {
    beforeEach(async () => {
      await apiService.setAuthToken('test-token');
    });

    it('uploads file successfully', async () => {
      const mockFile = new Blob(['test content'], { type: 'text/plain' });
      const mockUploadResponse = {
        id: 'file-1',
        url: 'https://example.com/file-1.txt',
        size: 12,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUploadResponse),
      } as Response);

      const result = await apiService.uploadFile(mockFile, 'document');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/uploads',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          }),
        })
      );

      expect(result).toEqual(mockUploadResponse);
    });

    it('handles upload errors', async () => {
      const mockFile = new Blob(['test content']);

      mockFetch.mockResolvedValue({
        ok: false,
        status: 413,
        json: () => Promise.resolve({ message: 'File too large' }),
      } as Response);

      await expect(apiService.uploadFile(mockFile, 'image')).rejects.toThrow('File too large');
    });
  });

  describe('Search Operations', () => {
    beforeEach(async () => {
      await apiService.setAuthToken('test-token');
    });

    it('searches with default parameters', async () => {
      const mockSearchResults = {
        posts: [{ id: '1', title: 'Search result' }],
        communities: [],
        users: [],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSearchResults),
      } as Response);

      const result = await apiService.search('test query');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/search?query=test+query&type=all',
        expect.any(Object)
      );

      expect(result).toEqual(mockSearchResults);
    });

    it('searches specific content type', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ posts: [] }),
      } as Response);

      await apiService.search('javascript', 'posts');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/search?query=javascript&type=posts',
        expect.any(Object)
      );
    });
  });

  describe('Token Management', () => {
    it('sets auth token correctly', async () => {
      await apiService.setAuthToken('new-token');

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('authToken', 'new-token');
    });

    it('clears auth token correctly', async () => {
      await apiService.clearAuthToken();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('authToken');
    });

    it('includes auth token in requests', async () => {
      await apiService.setAuthToken('test-token');

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      await apiService.getFeed();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          }),
        })
      );
    });

    it('makes requests without auth token when not set', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      await apiService.getFeed();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.any(String),
          }),
        })
      );
    });
  });
});