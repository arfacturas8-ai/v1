/**
 * API Keys Service
 * Manages developer API keys for CRYB Platform API access
 */

import api from './api';

class APIKeysService {
  /**
   * Get all API keys for current user
   */
  async getAPIKeys() {
    try {
      const response = await api.get('/api-keys');
      return response;
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      return { success: false, data: { items: [] } };
    }
  }

  /**
   * Create a new API key
   * @param {String} name - Name/description for the API key
   * @param {Array} scopes - Permission scopes for the key
   * @param {Number} expiresInDays - Expiration in days (optional)
   */
  async createAPIKey(name, scopes = [], expiresInDays = null) {
    try {
      const response = await api.post('/api-keys', {
        name,
        scopes,
        expiresIn: expiresInDays ? expiresInDays * 24 * 60 * 60 * 1000 : null
      });
      return response;
    } catch (error) {
      console.error('Failed to create API key:', error);
      throw error;
    }
  }

  /**
   * Revoke/delete an API key
   * @param {String} keyId - API key ID
   */
  async revokeAPIKey(keyId) {
    try {
      const response = await api.delete(`/api-keys/${keyId}`);
      return response;
    } catch (error) {
      console.error('Failed to revoke API key:', error);
      throw error;
    }
  }

  /**
   * Update API key (name, scopes)
   * @param {String} keyId - API key ID
   * @param {Object} updates - Fields to update
   */
  async updateAPIKey(keyId, updates) {
    try {
      const response = await api.patch(`/api-keys/${keyId}`, updates);
      return response;
    } catch (error) {
      console.error('Failed to update API key:', error);
      throw error;
    }
  }

  /**
   * Get API key usage statistics
   * @param {String} keyId - API key ID
   */
  async getAPIKeyStats(keyId) {
    try {
      const response = await api.get(`/api-keys/${keyId}/stats`);
      return response;
    } catch (error) {
      console.error('Failed to fetch API key stats:', error);
      return { success: false, data: { requests: 0, lastUsed: null } };
    }
  }

  /**
   * Get available API scopes/permissions
   */
  getAvailableScopes() {
    return [
      { id: 'read:profile', name: 'Read Profile', description: 'Read user profile information' },
      { id: 'write:profile', name: 'Write Profile', description: 'Update user profile' },
      { id: 'read:posts', name: 'Read Posts', description: 'Read posts and comments' },
      { id: 'write:posts', name: 'Write Posts', description: 'Create and edit posts' },
      { id: 'read:communities', name: 'Read Communities', description: 'Read community data' },
      { id: 'write:communities', name: 'Write Communities', description: 'Manage communities' },
      { id: 'read:messages', name: 'Read Messages', description: 'Read direct messages' },
      { id: 'write:messages', name: 'Write Messages', description: 'Send messages' },
      { id: 'read:analytics', name: 'Read Analytics', description: 'Access analytics data' },
      { id: 'admin:all', name: 'Admin Access', description: 'Full admin access (use with caution)' }
    ];
  }
}

export default new APIKeysService();
