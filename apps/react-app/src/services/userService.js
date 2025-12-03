/**
 * User Service for CRYB Platform
 * Handles all user-related API operations
 */

import api from './api';

class UserService {
  /**
   * Get current user profile
   */
  async getCurrentUser() {
    try {
      const response = await api.get('/users/me');

      if (response.success && response.data) {
        return { success: true, user: response.data.user || response.data };
      }

      return { success: false, error: 'Failed to fetch current user' };
    } catch (error) {
      console.error('Get current user error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch current user'
      };
    }
  }

  /**
   * Get user profile by username
   * @param {string} username
   */
  async getUserProfile(username) {
    try {
      const response = await api.get(`/users/${username}`);

      if (response.success && response.data) {
        return { success: true, user: response.data.user || response.data };
      }

      return { success: false, error: 'User not found' };
    } catch (error) {
      console.error('Get user profile error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch user profile'
      };
    }
  }

  /**
   * Get user by username (alias for getUserProfile)
   * @param {string} username
   */
  async getUserByUsername(username) {
    return this.getUserProfile(username);
  }

  /**
   * Update current user profile
   * @param {Object} profileData
   */
  async updateProfile(profileData) {
    try {
      const response = await api.patch('/users/me', profileData);

      if (response.success && response.data) {
        return { success: true, user: response.data.user || response.data };
      }

      return { success: false, error: 'Failed to update profile' };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to update profile'
      };
    }
  }

  /**
   * Upload user avatar
   * @param {File} file
   */
  async uploadAvatar(file) {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await api.post('/users/me/avatar', formData);

      if (response.success && response.data) {
        return { success: true, avatarUrl: response.data.avatarUrl || response.data.url };
      }

      return { success: false, error: 'Failed to upload avatar' };
    } catch (error) {
      console.error('Upload avatar error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to upload avatar'
      };
    }
  }

  /**
   * Upload user banner
   * @param {File} file
   */
  async uploadBanner(file) {
    try {
      const formData = new FormData();
      formData.append('banner', file);
      const response = await api.post('/users/me/banner', formData);

      if (response.success && response.data) {
        return { success: true, bannerUrl: response.data.bannerUrl || response.data.url };
      }

      return { success: false, error: 'Failed to upload banner' };
    } catch (error) {
      console.error('Upload banner error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to upload banner'
      };
    }
  }

  /**
   * Get user's posts
   * @param {string} username
   * @param {Object} params
   */
  async getUserPosts(username, params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/users/${username}/posts${queryString ? `?${queryString}` : ''}`);

      if (response.success && response.data) {
        return {
          success: true,
          posts: response.data.posts || response.data || [],
          pagination: response.data.pagination || {}
        };
      }

      return { success: false, error: 'Failed to fetch user posts' };
    } catch (error) {
      console.error('Get user posts error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch user posts'
      };
    }
  }

  /**
   * Get user's comments
   * @param {string} username
   * @param {Object} params
   */
  async getUserComments(username, params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/users/${username}/comments${queryString ? `?${queryString}` : ''}`);

      if (response.success && response.data) {
        return {
          success: true,
          comments: response.data.comments || response.data || [],
          pagination: response.data.pagination || {}
        };
      }

      return { success: false, error: 'Failed to fetch user comments' };
    } catch (error) {
      console.error('Get user comments error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch user comments'
      };
    }
  }

  /**
   * Get user's communities
   * @param {string} username
   * @param {Object} params
   */
  async getUserCommunities(username, params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/users/${username}/communities${queryString ? `?${queryString}` : ''}`);

      if (response.success && response.data) {
        return {
          success: true,
          communities: response.data.communities || response.data || [],
          pagination: response.data.pagination || {}
        };
      }

      return { success: false, error: 'Failed to fetch user communities' };
    } catch (error) {
      console.error('Get user communities error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch user communities'
      };
    }
  }

  /**
   * Get user's saved posts
   * @param {Object} params
   */
  async getSavedPosts(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/users/me/saved${queryString ? `?${queryString}` : ''}`);

      if (response.success && response.data) {
        return {
          success: true,
          posts: response.data.posts || response.data || [],
          pagination: response.data.pagination || {}
        };
      }

      return { success: false, error: 'Failed to fetch saved posts' };
    } catch (error) {
      console.error('Get saved posts error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch saved posts'
      };
    }
  }

  /**
   * Get user's upvoted posts
   * @param {string} username
   * @param {Object} params
   */
  async getUpvotedPosts(username, params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/users/${username}/upvoted${queryString ? `?${queryString}` : ''}`);

      if (response.success && response.data) {
        return {
          success: true,
          posts: response.data.posts || response.data || [],
          pagination: response.data.pagination || {}
        };
      }

      return { success: false, error: 'Failed to fetch upvoted posts' };
    } catch (error) {
      console.error('Get upvoted posts error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch upvoted posts'
      };
    }
  }

  /**
   * Get user's awards
   * @param {string} username
   */
  async getUserAwards(username) {
    try {
      const response = await api.get(`/users/${username}/awards`);

      if (response.success && response.data) {
        return { success: true, awards: response.data.awards || response.data || [] };
      }

      return { success: false, error: 'Failed to fetch user awards' };
    } catch (error) {
      console.error('Get user awards error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch user awards'
      };
    }
  }

  /**
   * Get user's karma breakdown
   * @param {string} username
   */
  async getUserKarma(username) {
    try {
      const response = await api.get(`/users/${username}/karma`);

      if (response.success && response.data) {
        return { success: true, karma: response.data.karma || response.data };
      }

      return { success: false, error: 'Failed to fetch user karma' };
    } catch (error) {
      console.error('Get user karma error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch user karma'
      };
    }
  }

  /**
   * Follow a user
   * @param {string} username
   */
  async followUser(username) {
    try {
      const response = await api.post(`/users/${username}/follow`);

      return {
        success: response.success,
        message: response.message || 'User followed successfully'
      };
    } catch (error) {
      console.error('Follow user error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to follow user'
      };
    }
  }

  /**
   * Unfollow a user
   * @param {string} username
   */
  async unfollowUser(username) {
    try {
      const response = await api.post(`/users/${username}/unfollow`);

      return {
        success: response.success,
        message: response.message || 'User unfollowed successfully'
      };
    } catch (error) {
      console.error('Unfollow user error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to unfollow user'
      };
    }
  }

  /**
   * Get user's followers
   * @param {string} username
   * @param {Object} params
   */
  async getUserFollowers(username, params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/users/${username}/followers${queryString ? `?${queryString}` : ''}`);

      if (response.success && response.data) {
        return {
          success: true,
          followers: response.data.followers || response.data || [],
          pagination: response.data.pagination || {}
        };
      }

      return { success: false, error: 'Failed to fetch followers' };
    } catch (error) {
      console.error('Get user followers error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch followers'
      };
    }
  }

  /**
   * Get user's following
   * @param {string} username
   * @param {Object} params
   */
  async getUserFollowing(username, params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/users/${username}/following${queryString ? `?${queryString}` : ''}`);

      if (response.success && response.data) {
        return {
          success: true,
          following: response.data.following || response.data || [],
          pagination: response.data.pagination || {}
        };
      }

      return { success: false, error: 'Failed to fetch following' };
    } catch (error) {
      console.error('Get user following error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch following'
      };
    }
  }

  /**
   * Block a user
   * @param {string} username
   */
  async blockUser(username) {
    try {
      const response = await api.post(`/users/${username}/block`);

      return {
        success: response.success,
        message: response.message || 'User blocked successfully'
      };
    } catch (error) {
      console.error('Block user error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to block user'
      };
    }
  }

  /**
   * Unblock a user
   * @param {string} username
   */
  async unblockUser(username) {
    try {
      const response = await api.post(`/users/${username}/unblock`);

      return {
        success: response.success,
        message: response.message || 'User unblocked successfully'
      };
    } catch (error) {
      console.error('Unblock user error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to unblock user'
      };
    }
  }

  /**
   * Get blocked users
   * @param {Object} params
   */
  async getBlockedUsers(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/users/me/blocked${queryString ? `?${queryString}` : ''}`);

      if (response.success && response.data) {
        return {
          success: true,
          users: response.data.users || response.data || [],
          pagination: response.data.pagination || {}
        };
      }

      return { success: false, error: 'Failed to fetch blocked users' };
    } catch (error) {
      console.error('Get blocked users error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch blocked users'
      };
    }
  }

  /**
   * Report a user
   * @param {string} username
   * @param {Object} reportData
   */
  async reportUser(username, reportData) {
    try {
      const response = await api.post(`/users/${username}/report`, reportData);

      return {
        success: response.success,
        message: response.message || 'User reported successfully'
      };
    } catch (error) {
      console.error('Report user error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to report user'
      };
    }
  }

  /**
   * Get user settings
   */
  async getUserSettings() {
    try {
      const response = await api.get('/users/me/settings');

      if (response.success && response.data) {
        return { success: true, settings: response.data.settings || response.data };
      }

      return { success: false, error: 'Failed to fetch settings' };
    } catch (error) {
      console.error('Get user settings error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch settings'
      };
    }
  }

  /**
   * Update user settings
   * @param {Object} settings
   */
  async updateUserSettings(settings) {
    try {
      const response = await api.patch('/users/me/settings', settings);

      if (response.success && response.data) {
        return { success: true, settings: response.data.settings || response.data };
      }

      return { success: false, error: 'Failed to update settings' };
    } catch (error) {
      console.error('Update user settings error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to update settings'
      };
    }
  }

  /**
   * Get notification preferences
   */
  async getNotificationPreferences() {
    try {
      const response = await api.get('/users/me/notifications/preferences');

      if (response.success && response.data) {
        return { success: true, preferences: response.data.preferences || response.data };
      }

      return { success: false, error: 'Failed to fetch notification preferences' };
    } catch (error) {
      console.error('Get notification preferences error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch notification preferences'
      };
    }
  }

  /**
   * Update notification preferences
   * @param {Object} preferences
   */
  async updateNotificationPreferences(preferences) {
    try {
      const response = await api.patch('/users/me/notifications/preferences', preferences);

      if (response.success && response.data) {
        return { success: true, preferences: response.data.preferences || response.data };
      }

      return { success: false, error: 'Failed to update notification preferences' };
    } catch (error) {
      console.error('Update notification preferences error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to update notification preferences'
      };
    }
  }

  /**
   * Get privacy settings
   */
  async getPrivacySettings() {
    try {
      const response = await api.get('/users/me/privacy');

      if (response.success && response.data) {
        return { success: true, privacy: response.data.privacy || response.data };
      }

      return { success: false, error: 'Failed to fetch privacy settings' };
    } catch (error) {
      console.error('Get privacy settings error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch privacy settings'
      };
    }
  }

  /**
   * Update privacy settings
   * @param {Object} privacy
   */
  async updatePrivacySettings(privacy) {
    try {
      const response = await api.patch('/users/me/privacy', privacy);

      if (response.success && response.data) {
        return { success: true, privacy: response.data.privacy || response.data };
      }

      return { success: false, error: 'Failed to update privacy settings' };
    } catch (error) {
      console.error('Update privacy settings error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to update privacy settings'
      };
    }
  }

  /**
   * Delete user account
   * @param {Object} confirmationData
   */
  async deleteAccount(confirmationData) {
    try {
      const response = await api.post('/users/me/delete', confirmationData);

      return {
        success: response.success,
        message: response.message || 'Account deleted successfully'
      };
    } catch (error) {
      console.error('Delete account error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to delete account'
      };
    }
  }

  /**
   * Export user data (GDPR)
   */
  async exportUserData() {
    try {
      const response = await api.get('/gdpr/export-data');

      if (response.success && response.data) {
        return { success: true, data: response.data };
      }

      return { success: false, error: 'Failed to export user data' };
    } catch (error) {
      console.error('Export user data error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to export user data'
      };
    }
  }

  /**
   * Get GDPR privacy information
   */
  async getGDPRPrivacyInfo() {
    try {
      const response = await api.get('/gdpr/privacy-info');

      if (response.success && response.data) {
        return { success: true, info: response.data };
      }

      return { success: false, error: 'Failed to fetch GDPR privacy info' };
    } catch (error) {
      console.error('Get GDPR privacy info error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch GDPR privacy info'
      };
    }
  }

  /**
   * Delete user account (GDPR)
   */
  async deleteAccountGDPR(confirmationData) {
    try {
      const response = await api.post('/gdpr/delete-account', confirmationData);

      return {
        success: response.success,
        message: response.message || 'Account deletion requested'
      };
    } catch (error) {
      console.error('Delete account GDPR error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to delete account'
      };
    }
  }

  /**
   * Check username availability
   * @param {string} username
   */
  async checkUsernameAvailability(username) {
    try {
      const response = await api.get(`/users/check-username?username=${username}`);

      if (response.success && response.data) {
        return { success: true, available: response.data.available };
      }

      return { success: false, error: 'Failed to check username availability' };
    } catch (error) {
      console.error('Check username availability error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to check username availability'
      };
    }
  }

  /**
   * Search users
   * @param {string} query
   * @param {Object} params
   */
  async searchUsers(query, params = {}) {
    try {
      const searchParams = { q: query, type: 'users', ...params };
      const queryString = new URLSearchParams(searchParams).toString();
      const response = await api.get(`/search?${queryString}`);

      if (response.success && response.data) {
        return {
          success: true,
          users: response.data.users || response.data.results || response.data || [],
          total: response.data.total || 0
        };
      }

      return { success: false, error: 'Search failed' };
    } catch (error) {
      console.error('Search users error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Search failed'
      };
    }
  }

  /**
   * Get user's NFTs
   * @param {string} username
   */
  async getUserNFTs(username) {
    try {
      const response = await api.get(`/users/${username}/nfts`);

      if (response.success && response.data) {
        return { success: true, nfts: response.data.nfts || response.data || [] };
      }

      return { success: false, error: 'Failed to fetch user NFTs' };
    } catch (error) {
      console.error('Get user NFTs error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch user NFTs'
      };
    }
  }

  /**
   * Get user's wallet address
   * @param {string} username
   */
  async getUserWallet(username) {
    try {
      const response = await api.get(`/users/${username}/wallet`);

      if (response.success && response.data) {
        return { success: true, wallet: response.data.wallet || response.data };
      }

      return { success: false, error: 'Failed to fetch user wallet' };
    } catch (error) {
      console.error('Get user wallet error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch user wallet'
      };
    }
  }

  /**
   * Connect wallet to account
   * @param {Object} walletData
   */
  async connectWallet(walletData) {
    try {
      const response = await api.post('/users/me/connect-wallet', walletData);

      if (response.success && response.data) {
        return { success: true, wallet: response.data.wallet || response.data };
      }

      return { success: false, error: 'Failed to connect wallet' };
    } catch (error) {
      console.error('Connect wallet error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to connect wallet'
      };
    }
  }
}

export default new UserService();
