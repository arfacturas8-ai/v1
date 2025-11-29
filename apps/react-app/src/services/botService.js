/**
 * Bot Service
 * Manages bot creation and configuration
 */

import api from './api';

class BotService {
  /**
   * Get all bots for current user
   */
  async getBots() {
    try {
      const response = await api.get('/bots');
      return response;
    } catch (error) {
      console.error('Failed to fetch bots:', error);
      return { success: false, data: { items: [] } };
    }
  }

  /**
   * Get single bot details
   * @param {String} botId - Bot ID
   */
  async getBot(botId) {
    try {
      const response = await api.get(`/bots/${botId}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch bot:', error);
      throw error;
    }
  }

  /**
   * Create a new bot
   * @param {Object} botData - Bot configuration
   */
  async createBot(botData) {
    try {
      const response = await api.post('/bots', botData);
      return response;
    } catch (error) {
      console.error('Failed to create bot:', error);
      throw error;
    }
  }

  /**
   * Update bot configuration
   * @param {String} botId - Bot ID
   * @param {Object} updates - Fields to update
   */
  async updateBot(botId, updates) {
    try {
      const response = await api.patch(`/bots/${botId}`, updates);
      return response;
    } catch (error) {
      console.error('Failed to update bot:', error);
      throw error;
    }
  }

  /**
   * Delete a bot
   * @param {String} botId - Bot ID
   */
  async deleteBot(botId) {
    try {
      const response = await api.delete(`/bots/${botId}`);
      return response;
    } catch (error) {
      console.error('Failed to delete bot:', error);
      throw error;
    }
  }

  /**
   * Regenerate bot token
   * @param {String} botId - Bot ID
   */
  async regenerateToken(botId) {
    try {
      const response = await api.post(`/bots/${botId}/regenerate-token`);
      return response;
    } catch (error) {
      console.error('Failed to regenerate bot token:', error);
      throw error;
    }
  }

  /**
   * Get bot statistics
   * @param {String} botId - Bot ID
   */
  async getBotStats(botId) {
    try {
      const response = await api.get(`/bots/${botId}/stats`);
      return response;
    } catch (error) {
      console.error('Failed to fetch bot stats:', error);
      return { success: false, data: { requests: 0, lastUsed: null } };
    }
  }

  /**
   * Get available bot permissions
   */
  getAvailablePermissions() {
    return [
      { id: 'read_messages', name: 'Read Messages', description: 'Read messages in channels where bot is added' },
      { id: 'send_messages', name: 'Send Messages', description: 'Send messages to channels' },
      { id: 'manage_messages', name: 'Manage Messages', description: 'Delete and pin messages' },
      { id: 'read_users', name: 'Read Users', description: 'Access user profile information' },
      { id: 'manage_channels', name: 'Manage Channels', description: 'Create and modify channels' },
      { id: 'moderation', name: 'Moderation', description: 'Ban, kick, and timeout users' },
      { id: 'webhooks', name: 'Webhooks', description: 'Create and manage webhooks' },
      { id: 'voice', name: 'Voice', description: 'Join and manage voice channels' }
    ];
  }

  /**
   * Get bot types/categories
   */
  getBotTypes() {
    return [
      { id: 'moderation', name: 'Moderation Bot', icon: '🛡️', description: 'Auto-moderation and user management' },
      { id: 'utility', name: 'Utility Bot', icon: '🔧', description: 'Tools and helpful commands' },
      { id: 'music', name: 'Music Bot', icon: '🎵', description: 'Play music in voice channels' },
      { id: 'game', name: 'Game Bot', icon: '🎮', description: 'Games and entertainment' },
      { id: 'analytics', name: 'Analytics Bot', icon: '📊', description: 'Server statistics and insights' },
      { id: 'custom', name: 'Custom Bot', icon: '⚙️', description: 'Custom functionality' }
    ];
  }
}

export default new BotService();
