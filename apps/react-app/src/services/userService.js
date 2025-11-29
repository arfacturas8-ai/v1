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
    return api.get('/users/me');
  }

  /**
   * Get user profile by username
   * @param {string} username 
   */
  async getUserProfile(username) {
    return api.get(`/users/${username}`);
  }

  /**
   * Update current user profile
   * @param {Object} profileData 
   */
  async updateProfile(profileData) {
    return api.patch('/users/me', profileData);
  }

  /**
   * Upload user avatar
   * @param {File} file 
   */
  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/users/me/avatar', formData);
  }

  /**
   * Upload user banner
   * @param {File} file 
   */
  async uploadBanner(file) {
    const formData = new FormData();
    formData.append('banner', file);
    return api.post('/users/me/banner', formData);
  }

  /**
   * Get user's posts
   * @param {string} username 
   * @param {Object} params 
   */
  async getUserPosts(username, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/users/${username}/posts${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Get user's comments
   * @param {string} username 
   * @param {Object} params 
   */
  async getUserComments(username, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/users/${username}/comments${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Get user's communities
   * @param {string} username 
   * @param {Object} params 
   */
  async getUserCommunities(username, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/users/${username}/communities${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Get user's saved posts
   * @param {Object} params 
   */
  async getSavedPosts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/users/me/saved${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Get user's upvoted posts
   * @param {string} username 
   * @param {Object} params 
   */
  async getUpvotedPosts(username, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/users/${username}/upvoted${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Get user's awards
   * @param {string} username 
   */
  async getUserAwards(username) {
    return api.get(`/users/${username}/awards`);
  }

  /**
   * Get user's karma breakdown
   * @param {string} username 
   */
  async getUserKarma(username) {
    return api.get(`/users/${username}/karma`);
  }

  /**
   * Follow a user
   * @param {string} username 
   */
  async followUser(username) {
    return api.post(`/users/${username}/follow`);
  }

  /**
   * Unfollow a user
   * @param {string} username 
   */
  async unfollowUser(username) {
    return api.post(`/users/${username}/unfollow`);
  }

  /**
   * Get user's followers
   * @param {string} username 
   * @param {Object} params 
   */
  async getUserFollowers(username, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/users/${username}/followers${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Get user's following
   * @param {string} username 
   * @param {Object} params 
   */
  async getUserFollowing(username, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/users/${username}/following${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Block a user
   * @param {string} username 
   */
  async blockUser(username) {
    return api.post(`/users/${username}/block`);
  }

  /**
   * Unblock a user
   * @param {string} username 
   */
  async unblockUser(username) {
    return api.post(`/users/${username}/unblock`);
  }

  /**
   * Get blocked users
   * @param {Object} params 
   */
  async getBlockedUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/users/me/blocked${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Report a user
   * @param {string} username 
   * @param {Object} reportData 
   */
  async reportUser(username, reportData) {
    return api.post(`/users/${username}/report`, reportData);
  }

  /**
   * Get user settings
   */
  async getUserSettings() {
    return api.get('/users/me/settings');
  }

  /**
   * Update user settings
   * @param {Object} settings 
   */
  async updateUserSettings(settings) {
    return api.patch('/users/me/settings', settings);
  }

  /**
   * Get notification preferences
   */
  async getNotificationPreferences() {
    return api.get('/users/me/notifications/preferences');
  }

  /**
   * Update notification preferences
   * @param {Object} preferences 
   */
  async updateNotificationPreferences(preferences) {
    return api.patch('/users/me/notifications/preferences', preferences);
  }

  /**
   * Get privacy settings
   */
  async getPrivacySettings() {
    return api.get('/users/me/privacy');
  }

  /**
   * Update privacy settings
   * @param {Object} privacy 
   */
  async updatePrivacySettings(privacy) {
    return api.patch('/users/me/privacy', privacy);
  }

  /**
   * Delete user account
   * @param {Object} confirmationData 
   */
  async deleteAccount(confirmationData) {
    return api.post('/users/me/delete', confirmationData);
  }

  /**
   * Export user data (GDPR)
   */
  async exportUserData() {
    return api.get('/gdpr/export-data');
  }

  /**
   * Get GDPR privacy information
   */
  async getGDPRPrivacyInfo() {
    return api.get('/gdpr/privacy-info');
  }

  /**
   * Delete user account (GDPR)
   */
  async deleteAccountGDPR(confirmationData) {
    return api.post('/gdpr/delete-account', confirmationData);
  }

  /**
   * Check username availability
   * @param {string} username 
   */
  async checkUsernameAvailability(username) {
    return api.get(`/users/check-username?username=${username}`);
  }

  /**
   * Search users
   * @param {string} query 
   * @param {Object} params 
   */
  async searchUsers(query, params = {}) {
    const searchParams = { q: query, type: 'users', ...params };
    const queryString = new URLSearchParams(searchParams).toString();
    return api.get(`/search?${queryString}`);
  }

  /**
   * Get user's NFTs
   * @param {string} username 
   */
  async getUserNFTs(username) {
    return api.get(`/users/${username}/nfts`);
  }

  /**
   * Get user's wallet address
   * @param {string} username 
   */
  async getUserWallet(username) {
    return api.get(`/users/${username}/wallet`);
  }

  /**
   * Connect wallet to account
   * @param {Object} walletData 
   */
  async connectWallet(walletData) {
    return api.post('/users/me/connect-wallet', walletData);
  }
}

export default new UserService();