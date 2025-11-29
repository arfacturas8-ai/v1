/**
 * Tests for userService
 */
import userService from './userService';
import api from './api';

jest.mock('./api');

describe('userService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentUser', () => {
    it('fetches current user profile', async () => {
      const mockUser = { id: '1', username: 'currentuser', email: 'user@test.com' };
      api.get.mockResolvedValue(mockUser);

      const result = await userService.getCurrentUser();

      expect(api.get).toHaveBeenCalledWith('/users/me');
      expect(result).toEqual(mockUser);
    });

    it('handles error when fetching current user', async () => {
      api.get.mockRejectedValue(new Error('Unauthorized'));

      await expect(userService.getCurrentUser()).rejects.toThrow('Unauthorized');
    });
  });

  describe('getUserProfile', () => {
    it('fetches user profile by username', async () => {
      const mockUser = { id: '1', username: 'testuser', email: 'test@test.com' };
      api.get.mockResolvedValue(mockUser);

      const result = await userService.getUserProfile('testuser');

      expect(api.get).toHaveBeenCalledWith('/users/testuser');
      expect(result).toEqual(mockUser);
    });

    it('handles user not found', async () => {
      api.get.mockRejectedValue(new Error('Not found'));

      await expect(userService.getUserProfile('invalid')).rejects.toThrow('Not found');
    });
  });

  describe('updateProfile', () => {
    it('updates user profile', async () => {
      const updateData = { displayName: 'New Name', bio: 'Updated bio' };
      api.patch.mockResolvedValue({ success: true, data: updateData });

      const result = await userService.updateProfile(updateData);

      expect(api.patch).toHaveBeenCalledWith('/users/me', updateData);
      expect(result.success).toBe(true);
    });

    it('handles update errors', async () => {
      api.patch.mockRejectedValue(new Error('Update failed'));

      await expect(userService.updateProfile({})).rejects.toThrow('Update failed');
    });
  });

  describe('uploadAvatar', () => {
    it('uploads avatar file', async () => {
      const mockFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });
      api.post.mockResolvedValue({ success: true, url: 'https://cdn.example.com/avatar.jpg' });

      const result = await userService.uploadAvatar(mockFile);

      expect(api.post).toHaveBeenCalledWith('/users/me/avatar', expect.any(FormData));
      const formData = api.post.mock.calls[0][1];
      expect(formData.get('avatar')).toBe(mockFile);
      expect(result.success).toBe(true);
    });

    it('handles upload errors', async () => {
      const mockFile = new File(['avatar'], 'avatar.jpg');
      api.post.mockRejectedValue(new Error('File too large'));

      await expect(userService.uploadAvatar(mockFile)).rejects.toThrow('File too large');
    });
  });

  describe('uploadBanner', () => {
    it('uploads banner file', async () => {
      const mockFile = new File(['banner'], 'banner.jpg', { type: 'image/jpeg' });
      api.post.mockResolvedValue({ success: true, url: 'https://cdn.example.com/banner.jpg' });

      const result = await userService.uploadBanner(mockFile);

      expect(api.post).toHaveBeenCalledWith('/users/me/banner', expect.any(FormData));
      const formData = api.post.mock.calls[0][1];
      expect(formData.get('banner')).toBe(mockFile);
      expect(result.success).toBe(true);
    });
  });

  describe('getUserPosts', () => {
    it('fetches user posts without params', async () => {
      const mockPosts = [{ id: '1', title: 'Post 1' }];
      api.get.mockResolvedValue(mockPosts);

      const result = await userService.getUserPosts('testuser');

      expect(api.get).toHaveBeenCalledWith('/users/testuser/posts');
      expect(result).toEqual(mockPosts);
    });

    it('fetches user posts with pagination params', async () => {
      const mockPosts = [{ id: '1', title: 'Post 1' }];
      api.get.mockResolvedValue(mockPosts);

      await userService.getUserPosts('testuser', { page: 2, limit: 10 });

      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('page=2'));
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('limit=10'));
    });
  });

  describe('getUserComments', () => {
    it('fetches user comments', async () => {
      const mockComments = [{ id: '1', content: 'Comment 1' }];
      api.get.mockResolvedValue(mockComments);

      const result = await userService.getUserComments('testuser');

      expect(api.get).toHaveBeenCalledWith('/users/testuser/comments');
      expect(result).toEqual(mockComments);
    });

    it('fetches user comments with params', async () => {
      api.get.mockResolvedValue([]);

      await userService.getUserComments('testuser', { page: 1, sort: 'new' });

      const callArg = api.get.mock.calls[0][0];
      expect(callArg).toContain('page=1');
      expect(callArg).toContain('sort=new');
    });
  });

  describe('getUserCommunities', () => {
    it('fetches user communities', async () => {
      const mockCommunities = [{ id: '1', name: 'Tech' }];
      api.get.mockResolvedValue(mockCommunities);

      const result = await userService.getUserCommunities('testuser');

      expect(api.get).toHaveBeenCalledWith('/users/testuser/communities');
      expect(result).toEqual(mockCommunities);
    });
  });

  describe('getSavedPosts', () => {
    it('fetches saved posts', async () => {
      const mockPosts = [{ id: '1', title: 'Saved Post' }];
      api.get.mockResolvedValue(mockPosts);

      const result = await userService.getSavedPosts();

      expect(api.get).toHaveBeenCalledWith('/users/me/saved');
      expect(result).toEqual(mockPosts);
    });

    it('fetches saved posts with params', async () => {
      api.get.mockResolvedValue([]);

      await userService.getSavedPosts({ page: 2, limit: 20 });

      const callArg = api.get.mock.calls[0][0];
      expect(callArg).toContain('page=2');
      expect(callArg).toContain('limit=20');
    });
  });

  describe('getUpvotedPosts', () => {
    it('fetches upvoted posts', async () => {
      const mockPosts = [{ id: '1', title: 'Upvoted Post' }];
      api.get.mockResolvedValue(mockPosts);

      const result = await userService.getUpvotedPosts('testuser');

      expect(api.get).toHaveBeenCalledWith('/users/testuser/upvoted');
      expect(result).toEqual(mockPosts);
    });
  });

  describe('getUserAwards', () => {
    it('fetches user awards', async () => {
      const mockAwards = [{ id: '1', name: 'Gold' }];
      api.get.mockResolvedValue(mockAwards);

      const result = await userService.getUserAwards('testuser');

      expect(api.get).toHaveBeenCalledWith('/users/testuser/awards');
      expect(result).toEqual(mockAwards);
    });
  });

  describe('getUserKarma', () => {
    it('fetches user karma breakdown', async () => {
      const mockKarma = { post: 100, comment: 50 };
      api.get.mockResolvedValue(mockKarma);

      const result = await userService.getUserKarma('testuser');

      expect(api.get).toHaveBeenCalledWith('/users/testuser/karma');
      expect(result).toEqual(mockKarma);
    });
  });

  describe('followUser', () => {
    it('follows a user', async () => {
      api.post.mockResolvedValue({ success: true, following: true });

      const result = await userService.followUser('testuser');

      expect(api.post).toHaveBeenCalledWith('/users/testuser/follow');
      expect(result.success).toBe(true);
    });

    it('handles follow error', async () => {
      api.post.mockRejectedValue(new Error('Already following'));

      await expect(userService.followUser('testuser')).rejects.toThrow('Already following');
    });
  });

  describe('unfollowUser', () => {
    it('unfollows a user', async () => {
      api.post.mockResolvedValue({ success: true });

      const result = await userService.unfollowUser('testuser');

      expect(api.post).toHaveBeenCalledWith('/users/testuser/unfollow');
      expect(result.success).toBe(true);
    });
  });

  describe('getUserFollowers', () => {
    it('fetches user followers', async () => {
      const mockFollowers = [{ id: '1', username: 'follower1' }];
      api.get.mockResolvedValue(mockFollowers);

      const result = await userService.getUserFollowers('testuser');

      expect(api.get).toHaveBeenCalledWith('/users/testuser/followers');
      expect(result).toEqual(mockFollowers);
    });

    it('fetches followers with pagination', async () => {
      api.get.mockResolvedValue([]);

      await userService.getUserFollowers('testuser', { page: 2, limit: 50 });

      const callArg = api.get.mock.calls[0][0];
      expect(callArg).toContain('page=2');
      expect(callArg).toContain('limit=50');
    });
  });

  describe('getUserFollowing', () => {
    it('fetches users being followed', async () => {
      const mockFollowing = [{ id: '1', username: 'following1' }];
      api.get.mockResolvedValue(mockFollowing);

      const result = await userService.getUserFollowing('testuser');

      expect(api.get).toHaveBeenCalledWith('/users/testuser/following');
      expect(result).toEqual(mockFollowing);
    });
  });

  describe('blockUser', () => {
    it('blocks a user', async () => {
      api.post.mockResolvedValue({ success: true });

      const result = await userService.blockUser('testuser');

      expect(api.post).toHaveBeenCalledWith('/users/testuser/block');
      expect(result.success).toBe(true);
    });
  });

  describe('unblockUser', () => {
    it('unblocks a user', async () => {
      api.post.mockResolvedValue({ success: true });

      const result = await userService.unblockUser('testuser');

      expect(api.post).toHaveBeenCalledWith('/users/testuser/unblock');
      expect(result.success).toBe(true);
    });
  });

  describe('getBlockedUsers', () => {
    it('fetches blocked users', async () => {
      const mockBlocked = [{ id: '1', username: 'blocked1' }];
      api.get.mockResolvedValue(mockBlocked);

      const result = await userService.getBlockedUsers();

      expect(api.get).toHaveBeenCalledWith('/users/me/blocked');
      expect(result).toEqual(mockBlocked);
    });

    it('fetches blocked users with params', async () => {
      api.get.mockResolvedValue([]);

      await userService.getBlockedUsers({ page: 1 });

      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('page=1'));
    });
  });

  describe('reportUser', () => {
    it('reports a user', async () => {
      const reportData = { reason: 'spam', details: 'Spamming posts' };
      api.post.mockResolvedValue({ success: true });

      const result = await userService.reportUser('testuser', reportData);

      expect(api.post).toHaveBeenCalledWith('/users/testuser/report', reportData);
      expect(result.success).toBe(true);
    });
  });

  describe('getUserSettings', () => {
    it('fetches user settings', async () => {
      const mockSettings = { theme: 'dark', language: 'en' };
      api.get.mockResolvedValue(mockSettings);

      const result = await userService.getUserSettings();

      expect(api.get).toHaveBeenCalledWith('/users/me/settings');
      expect(result).toEqual(mockSettings);
    });
  });

  describe('updateUserSettings', () => {
    it('updates user settings', async () => {
      const settings = { theme: 'light', language: 'es' };
      api.patch.mockResolvedValue({ success: true, settings });

      const result = await userService.updateUserSettings(settings);

      expect(api.patch).toHaveBeenCalledWith('/users/me/settings', settings);
      expect(result.success).toBe(true);
    });
  });

  describe('getNotificationPreferences', () => {
    it('fetches notification preferences', async () => {
      const mockPrefs = { email: true, push: false };
      api.get.mockResolvedValue(mockPrefs);

      const result = await userService.getNotificationPreferences();

      expect(api.get).toHaveBeenCalledWith('/users/me/notifications/preferences');
      expect(result).toEqual(mockPrefs);
    });
  });

  describe('updateNotificationPreferences', () => {
    it('updates notification preferences', async () => {
      const preferences = { email: false, push: true };
      api.patch.mockResolvedValue({ success: true });

      const result = await userService.updateNotificationPreferences(preferences);

      expect(api.patch).toHaveBeenCalledWith('/users/me/notifications/preferences', preferences);
      expect(result.success).toBe(true);
    });
  });

  describe('getPrivacySettings', () => {
    it('fetches privacy settings', async () => {
      const mockPrivacy = { profileVisible: true, showEmail: false };
      api.get.mockResolvedValue(mockPrivacy);

      const result = await userService.getPrivacySettings();

      expect(api.get).toHaveBeenCalledWith('/users/me/privacy');
      expect(result).toEqual(mockPrivacy);
    });
  });

  describe('updatePrivacySettings', () => {
    it('updates privacy settings', async () => {
      const privacy = { profileVisible: false, showEmail: false };
      api.patch.mockResolvedValue({ success: true });

      const result = await userService.updatePrivacySettings(privacy);

      expect(api.patch).toHaveBeenCalledWith('/users/me/privacy', privacy);
      expect(result.success).toBe(true);
    });
  });

  describe('deleteAccount', () => {
    it('deletes user account', async () => {
      const confirmationData = { password: 'mypassword', confirm: true };
      api.post.mockResolvedValue({ success: true });

      const result = await userService.deleteAccount(confirmationData);

      expect(api.post).toHaveBeenCalledWith('/users/me/delete', confirmationData);
      expect(result.success).toBe(true);
    });

    it('handles deletion error', async () => {
      api.post.mockRejectedValue(new Error('Invalid password'));

      await expect(userService.deleteAccount({ password: 'wrong' })).rejects.toThrow('Invalid password');
    });
  });

  describe('GDPR Operations', () => {
    it('exports user data', async () => {
      const mockData = { profile: {}, posts: [], comments: [] };
      api.get.mockResolvedValue(mockData);

      const result = await userService.exportUserData();

      expect(api.get).toHaveBeenCalledWith('/gdpr/export-data');
      expect(result).toEqual(mockData);
    });

    it('gets GDPR privacy info', async () => {
      const mockInfo = { dataRetention: '30 days', cookies: [] };
      api.get.mockResolvedValue(mockInfo);

      const result = await userService.getGDPRPrivacyInfo();

      expect(api.get).toHaveBeenCalledWith('/gdpr/privacy-info');
      expect(result).toEqual(mockInfo);
    });

    it('deletes account via GDPR endpoint', async () => {
      const confirmationData = { email: 'test@test.com', confirm: true };
      api.post.mockResolvedValue({ success: true });

      const result = await userService.deleteAccountGDPR(confirmationData);

      expect(api.post).toHaveBeenCalledWith('/gdpr/delete-account', confirmationData);
      expect(result.success).toBe(true);
    });
  });

  describe('checkUsernameAvailability', () => {
    it('checks if username is available', async () => {
      api.get.mockResolvedValue({ available: true });

      const result = await userService.checkUsernameAvailability('newuser');

      expect(api.get).toHaveBeenCalledWith('/users/check-username?username=newuser');
      expect(result.available).toBe(true);
    });

    it('returns false for taken username', async () => {
      api.get.mockResolvedValue({ available: false });

      const result = await userService.checkUsernameAvailability('existinguser');

      expect(result.available).toBe(false);
    });
  });

  describe('searchUsers', () => {
    it('searches users by query', async () => {
      const mockUsers = [
        { id: '1', username: 'user1' },
        { id: '2', username: 'user2' }
      ];
      api.get.mockResolvedValue(mockUsers);

      const result = await userService.searchUsers('user');

      const callArg = api.get.mock.calls[0][0];
      expect(callArg).toContain('/search');
      expect(callArg).toContain('q=user');
      expect(callArg).toContain('type=users');
      expect(result).toEqual(mockUsers);
    });

    it('searches users with additional params', async () => {
      api.get.mockResolvedValue([]);

      await userService.searchUsers('test', { verified: true, online: true });

      const callArg = api.get.mock.calls[0][0];
      expect(callArg).toContain('q=test');
      expect(callArg).toContain('verified=true');
      expect(callArg).toContain('online=true');
    });

    it('handles empty search results', async () => {
      api.get.mockResolvedValue([]);

      const result = await userService.searchUsers('nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('Web3/NFT Operations', () => {
    it('gets user NFTs', async () => {
      const mockNFTs = [{ id: '1', name: 'NFT 1' }];
      api.get.mockResolvedValue(mockNFTs);

      const result = await userService.getUserNFTs('testuser');

      expect(api.get).toHaveBeenCalledWith('/users/testuser/nfts');
      expect(result).toEqual(mockNFTs);
    });

    it('gets user wallet address', async () => {
      const mockWallet = { address: '0x123...', chain: 'ethereum' };
      api.get.mockResolvedValue(mockWallet);

      const result = await userService.getUserWallet('testuser');

      expect(api.get).toHaveBeenCalledWith('/users/testuser/wallet');
      expect(result).toEqual(mockWallet);
    });

    it('connects wallet to account', async () => {
      const walletData = { address: '0x123...', signature: 'sig...' };
      api.post.mockResolvedValue({ success: true });

      const result = await userService.connectWallet(walletData);

      expect(api.post).toHaveBeenCalledWith('/users/me/connect-wallet', walletData);
      expect(result.success).toBe(true);
    });

    it('handles wallet connection error', async () => {
      api.post.mockRejectedValue(new Error('Invalid signature'));

      await expect(userService.connectWallet({ address: '0x123' })).rejects.toThrow('Invalid signature');
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      api.get.mockRejectedValue(new Error('Network error'));

      await expect(userService.getCurrentUser()).rejects.toThrow('Network error');
    });

    it('handles authentication errors', async () => {
      api.get.mockRejectedValue(new Error('Unauthorized'));

      await expect(userService.getUserSettings()).rejects.toThrow('Unauthorized');
    });
  });
});
