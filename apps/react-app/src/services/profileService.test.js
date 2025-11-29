/**
 * Tests for profileService
 */
import profileService from './profileService';
import apiService from './api';

jest.mock('./api');

describe('profileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    profileService.cache.clear();
  });

  describe('getProfile', () => {
    it('fetches current user profile', async () => {
      const mockProfile = { id: 'user-1', username: 'john', email: 'john@example.com' };
      apiService.get.mockResolvedValue(mockProfile);

      const result = await profileService.getProfile();

      expect(apiService.get).toHaveBeenCalledWith('/profile');
      expect(result).toEqual(mockProfile);
    });

    it('fetches specific user profile', async () => {
      const mockProfile = { id: 'user-2', username: 'jane' };
      apiService.get.mockResolvedValue(mockProfile);

      const result = await profileService.getProfile('user-2');

      expect(apiService.get).toHaveBeenCalledWith('/profile/user-2');
      expect(result).toEqual(mockProfile);
    });

    it('uses cached profile', async () => {
      const mockProfile = { id: 'user-1', username: 'john' };
      apiService.get.mockResolvedValue(mockProfile);

      await profileService.getProfile();
      await profileService.getProfile();

      expect(apiService.get).toHaveBeenCalledTimes(1);
    });

    it('throws error on failure', async () => {
      apiService.get.mockRejectedValue(new Error('Not found'));

      await expect(profileService.getProfile('invalid')).rejects.toThrow('Not found');
    });
  });

  describe('updateProfile', () => {
    it('updates user profile', async () => {
      const updates = { displayName: 'John Doe', bio: 'Developer' };
      apiService.put.mockResolvedValue({ success: true, data: updates });

      const result = await profileService.updateProfile(updates);

      expect(apiService.put).toHaveBeenCalledWith('/profile', updates);
      expect(result.success).toBe(true);
    });

    it('clears cache after update', async () => {
      apiService.put.mockResolvedValue({ success: true });
      profileService.cache.set('profile_current', { data: 'old' });

      await profileService.updateProfile({ displayName: 'New' });

      expect(profileService.cache.has('profile_current')).toBe(false);
    });
  });

  describe('uploadAvatar', () => {
    it('uploads avatar file', async () => {
      const file = new File(['content'], 'avatar.jpg', { type: 'image/jpeg' });
      apiService.uploadFile.mockResolvedValue({ url: 'https://cdn.example.com/avatar.jpg' });

      const result = await profileService.uploadAvatar(file);

      expect(apiService.uploadFile).toHaveBeenCalledWith('/profile/avatar', file);
      expect(result.url).toBeDefined();
    });

    it('clears cache after upload', async () => {
      const file = new File(['content'], 'avatar.jpg');
      apiService.uploadFile.mockResolvedValue({ url: 'url' });
      profileService.cache.set('profile_current', { data: 'old' });

      await profileService.uploadAvatar(file);

      expect(profileService.cache.has('profile_current')).toBe(false);
    });
  });

  describe('uploadBanner', () => {
    it('uploads banner file', async () => {
      const file = new File(['content'], 'banner.jpg', { type: 'image/jpeg' });
      apiService.uploadFile.mockResolvedValue({ url: 'https://cdn.example.com/banner.jpg' });

      const result = await profileService.uploadBanner(file);

      expect(apiService.uploadFile).toHaveBeenCalledWith('/profile/banner', file);
      expect(result.url).toBeDefined();
    });
  });

  describe('searchUsers', () => {
    it('searches users by query', async () => {
      const mockUsers = [
        { id: 'user-1', username: 'john' },
        { id: 'user-2', username: 'jane' }
      ];
      apiService.get.mockResolvedValue({ users: mockUsers });

      const result = await profileService.searchUsers('john');

      const callArg = apiService.get.mock.calls[0][0];
      expect(callArg).toContain('/users/search');
      expect(callArg).toContain('q=john');
      expect(result.users).toEqual(mockUsers);
    });

    it('applies filters', async () => {
      apiService.get.mockResolvedValue({ users: [] });

      await profileService.searchUsers('query', { verified: true, online: true });

      const callArg = apiService.get.mock.calls[0][0];
      expect(callArg).toContain('verified=true');
      expect(callArg).toContain('online=true');
    });
  });

  describe('getUserActivity', () => {
    it('fetches current user activity', async () => {
      const mockActivity = [
        { id: 'act-1', type: 'post', timestamp: '2024-01-01' }
      ];
      apiService.get.mockResolvedValue({ activity: mockActivity });

      const result = await profileService.getUserActivity();

      expect(apiService.get).toHaveBeenCalledWith(expect.stringContaining('/profile/activity'));
      expect(result.activity).toEqual(mockActivity);
    });

    it('fetches specific user activity with pagination', async () => {
      apiService.get.mockResolvedValue({ activity: [] });

      await profileService.getUserActivity('user-1', 2, 50);

      const callArg = apiService.get.mock.calls[0][0];
      expect(callArg).toContain('/profile/user-1/activity');
      expect(callArg).toContain('page=2');
      expect(callArg).toContain('limit=50');
    });
  });

  describe('getUserPosts', () => {
    it('fetches user posts', async () => {
      const mockPosts = [
        { id: 'post-1', title: 'Test Post' }
      ];
      apiService.get.mockResolvedValue({ posts: mockPosts });

      const result = await profileService.getUserPosts('user-1');

      expect(apiService.get).toHaveBeenCalledWith(expect.stringContaining('/profile/user-1/posts'));
      expect(result.posts).toEqual(mockPosts);
    });

    it('supports sorting and pagination', async () => {
      apiService.get.mockResolvedValue({ posts: [] });

      await profileService.getUserPosts('user-1', 3, 10, 'popular');

      const callArg = apiService.get.mock.calls[0][0];
      expect(callArg).toContain('page=3');
      expect(callArg).toContain('limit=10');
      expect(callArg).toContain('sortBy=popular');
    });
  });

  describe('getUserComments', () => {
    it('fetches user comments', async () => {
      const mockComments = [
        { id: 'comment-1', content: 'Great post!' }
      ];
      apiService.get.mockResolvedValue({ comments: mockComments });

      const result = await profileService.getUserComments('user-1');

      expect(apiService.get).toHaveBeenCalledWith(expect.stringContaining('/profile/user-1/comments'));
      expect(result.comments).toEqual(mockComments);
    });
  });

  describe('Cache Management', () => {
    it('caches responses', async () => {
      const mockProfile = { id: 'user-1' };
      apiService.get.mockResolvedValue(mockProfile);

      await profileService.getProfile('user-1');

      expect(profileService.cache.has('profile_user-1')).toBe(true);
    });

    it('respects cache expiry', async () => {
      jest.useFakeTimers();
      const mockProfile = { id: 'user-1' };
      apiService.get.mockResolvedValue(mockProfile);

      await profileService.getProfile('user-1');

      jest.advanceTimersByTime(6 * 60 * 1000);

      await profileService.getProfile('user-1');

      expect(apiService.get).toHaveBeenCalledTimes(2);
      jest.useRealTimers();
    });

    it('clears specific cache key', () => {
      profileService.cache.set('profile_current', { data: 'test' });
      profileService.clearCache('profile_current');

      expect(profileService.cache.has('profile_current')).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('handles network errors', async () => {
      apiService.get.mockRejectedValue(new Error('Network error'));

      await expect(profileService.getProfile()).rejects.toThrow('Network error');
    });

    it('handles update errors', async () => {
      apiService.put.mockRejectedValue(new Error('Validation error'));

      await expect(profileService.updateProfile({})).rejects.toThrow('Validation error');
    });

    it('handles upload errors', async () => {
      apiService.uploadFile.mockRejectedValue(new Error('File too large'));

      const file = new File(['content'], 'avatar.jpg');
      await expect(profileService.uploadAvatar(file)).rejects.toThrow('File too large');
    });
  });
});
