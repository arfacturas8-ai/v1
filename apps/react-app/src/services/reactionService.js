import apiService from './api';
import { socket } from './socket';
import { getErrorMessage } from '../utils/errorUtils';

class ReactionService {
  constructor() {
    this.apiService = apiService;
    this.socket = socket;
    this.cache = new Map();
    this.setupRealtimeListeners();
  }

  // Setup real-time Socket.io listeners
  setupRealtimeListeners() {
    if (!this.socket) return;

    this.socket.on('reaction_added', this.handleReactionAdded.bind(this));
    this.socket.on('reaction_removed', this.handleReactionRemoved.bind(this));
    this.socket.on('reaction_notification', this.handleReactionNotification.bind(this));
    this.socket.on('reaction_analytics', this.handleAnalyticsUpdate.bind(this));
    this.socket.on('trending_reactions', this.handleTrendingUpdate.bind(this));
  }

  // Event handlers for real-time updates
  handleReactionAdded(data) {
    const { contentType, contentId, userId, reactionType, summary } = data;
    
    // Update cache
    const cacheKey = `${contentType}:${contentId}`;
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      cached.summary = summary;
      cached.lastUpdated = Date.now();
    }

    // Emit custom event for components to listen
    window.dispatchEvent(new CustomEvent('reactionAdded', {
      detail: { contentType, contentId, userId, reactionType, summary }
    }));
  }

  handleReactionRemoved(data) {
    const { contentType, contentId, userId, reactionType, summary } = data;
    
    // Update cache
    const cacheKey = `${contentType}:${contentId}`;
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      cached.summary = summary;
      cached.lastUpdated = Date.now();
    }

    // Emit custom event for components to listen
    window.dispatchEvent(new CustomEvent('reactionRemoved', {
      detail: { contentType, contentId, userId, reactionType, summary }
    }));
  }

  handleReactionNotification(data) {
    // Emit notification event
    window.dispatchEvent(new CustomEvent('reactionNotification', {
      detail: data
    }));
  }

  handleAnalyticsUpdate(data) {
    // Update analytics cache
    this.cache.set('analytics', { data, lastUpdated: Date.now() });
    
    window.dispatchEvent(new CustomEvent('analyticsUpdate', {
      detail: data
    }));
  }

  handleTrendingUpdate(data) {
    // Update trending cache
    this.cache.set('trending', { data, lastUpdated: Date.now() });
    
    window.dispatchEvent(new CustomEvent('trendingUpdate', {
      detail: data
    }));
  }

  // Join/leave content rooms for real-time updates
  joinContentRoom(contentType, contentId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('join_content_room', { contentType, contentId });
    }
  }

  leaveContentRoom(contentType, contentId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('leave_content_room', { contentType, contentId });
    }
  }

  // Add reaction to content
  async addReaction(contentType, contentId, reactionType, options = {}) {
    try {
      // Optimistic update via Socket.io for immediate feedback
      if (this.socket && this.socket.connected) {
        this.socket.emit('add_reaction', {
          contentType,
          contentId,
          reactionType,
          customEmojiName: options.customEmojiName,
          customEmojiId: options.customEmojiId
        });
      }

      // Also send HTTP request for reliability
      const response = await this.apiService.post('/reactions', {
        contentType,
        contentId,
        reactionType,
        customEmojiName: options.customEmojiName,
        customEmojiId: options.customEmojiId
      });

      if (response.data.success) {
        // Update cache
        const cacheKey = `${contentType}:${contentId}`;
        this.cache.set(cacheKey, {
          summary: response.data.data.summary,
          lastUpdated: Date.now()
        });

        return response.data.data;
      } else {
        throw new Error(getErrorMessage(response.data.error, 'Failed to add reaction'));
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  }

  // Remove reaction from content
  async removeReaction(contentType, contentId, reactionType) {
    try {
      // Optimistic update via Socket.io
      if (this.socket && this.socket.connected) {
        this.socket.emit('remove_reaction', {
          contentType,
          contentId,
          reactionType
        });
      }

      // HTTP request for reliability
      const response = await this.apiService.delete('/reactions', {
        data: {
          contentType,
          contentId,
          reactionType
        }
      });

      if (response.data.success) {
        // Update cache
        const cacheKey = `${contentType}:${contentId}`;
        this.cache.set(cacheKey, {
          summary: response.data.data.summary,
          lastUpdated: Date.now()
        });

        return response.data.data;
      } else {
        throw new Error(getErrorMessage(response.data.error, 'Failed to remove reaction'));
      }
    } catch (error) {
      console.error('Error removing reaction:', error);
      throw error;
    }
  }

  // Toggle reaction (add if not present, remove if present)
  async toggleReaction(contentType, contentId, reactionType, isCurrentlyReacted, options = {}) {
    if (isCurrentlyReacted) {
      return await this.removeReaction(contentType, contentId, reactionType);
    } else {
      return await this.addReaction(contentType, contentId, reactionType, options);
    }
  }

  // Get reactions for content
  async getReactions(contentType, contentId, options = {}) {
    try {
      // Check cache first
      const cacheKey = `${contentType}:${contentId}`;
      const cached = this.cache.get(cacheKey);
      const cacheAge = cached ? Date.now() - cached.lastUpdated : Infinity;
      
      // Use cache if less than 30 seconds old
      if (cached && cacheAge < 30000 && !options.force) {
        return cached;
      }

      const params = new URLSearchParams({
        page: options.page || 1,
        limit: options.limit || 50,
        ...(options.reactionType && { reactionType: options.reactionType })
      });

      const response = await this.apiService.get(`/reactions/${contentType}/${contentId}?${params}`);

      if (response.data.success) {
        // Update cache
        this.cache.set(cacheKey, {
          ...response.data.data,
          lastUpdated: Date.now()
        });

        return response.data.data;
      } else {
        throw new Error(getErrorMessage(response.data.error, 'Failed to get reactions'));
      }
    } catch (error) {
      console.error('Error getting reactions:', error);
      throw error;
    }
  }

  // Get trending reactions and content
  async getTrending(options = {}) {
    try {
      const cached = this.cache.get('trending');
      const cacheAge = cached ? Date.now() - cached.lastUpdated : Infinity;
      
      // Use cache if less than 5 minutes old
      if (cached && cacheAge < 300000 && !options.force) {
        return cached.data;
      }

      const params = new URLSearchParams({
        period: options.period || '24h',
        limit: options.limit || 10,
        ...(options.contentType && { contentType: options.contentType })
      });

      const response = await this.apiService.get(`/reactions/trending?${params}`);

      if (response.data.success) {
        // Update cache
        this.cache.set('trending', {
          data: response.data.data,
          lastUpdated: Date.now()
        });

        return response.data.data;
      } else {
        throw new Error(getErrorMessage(response.data.error, 'Failed to get trending reactions'));
      }
    } catch (error) {
      console.error('Error getting trending reactions:', error);
      throw error;
    }
  }

  // Get user reaction analytics
  async getUserAnalytics(options = {}) {
    try {
      const params = new URLSearchParams({
        timeframe: options.timeframe || '30d',
        page: options.page || 1,
        limit: options.limit || 25
      });

      const response = await this.apiService.get(`/reactions/analytics/user?${params}`);

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(getErrorMessage(response.data.error, 'Failed to get user analytics'));
      }
    } catch (error) {
      console.error('Error getting user analytics:', error);
      throw error;
    }
  }

  // Get reaction notifications
  async getNotifications(options = {}) {
    try {
      const params = new URLSearchParams({
        page: options.page || 1,
        limit: options.limit || 25,
        unreadOnly: options.unreadOnly || false
      });

      const response = await this.apiService.get(`/reactions/notifications?${params}`);

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(getErrorMessage(response.data.error, 'Failed to get notifications'));
      }
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }

  // Mark notifications as read
  async markNotificationsRead(notificationIds = [], markAll = false) {
    try {
      const response = await this.apiService.post('/reactions/notifications/read', {
        notificationIds,
        markAll
      });

      if (response.data.success) {
        return true;
      } else {
        throw new Error(getErrorMessage(response.data.error, 'Failed to mark notifications as read'));
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  }

  // Get available emojis
  async getAvailableEmojis(options = {}) {
    try {
      const params = new URLSearchParams({
        ...(options.serverId && { serverId: options.serverId }),
        ...(options.communityId && { communityId: options.communityId })
      });

      const response = await this.apiService.get(`/reactions/emoji?${params}`);

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(getErrorMessage(response.data.error, 'Failed to get emojis'));
      }
    } catch (error) {
      console.error('Error getting emojis:', error);
      throw error;
    }
  }

  // Create custom emoji
  async createCustomEmoji(emojiData) {
    try {
      const response = await this.apiService.post('/reactions/emoji', emojiData);

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(getErrorMessage(response.data.error, 'Failed to create custom emoji'));
      }
    } catch (error) {
      console.error('Error creating custom emoji:', error);
      throw error;
    }
  }

  // Get reaction leaderboard
  async getLeaderboard(options = {}) {
    try {
      const params = new URLSearchParams({
        timeframe: options.timeframe || '30d',
        limit: options.limit || 20
      });

      const response = await this.apiService.get(`/reactions/leaderboard?${params}`);

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(getErrorMessage(response.data.error, 'Failed to get leaderboard'));
      }
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  }

  // Get reaction analytics via Socket.io (real-time)
  getAnalyticsRealtime(contentType, contentId, timeframe = '24h') {
    if (this.socket && this.socket.connected) {
      this.socket.emit('get_reaction_analytics', {
        contentType,
        contentId,
        timeframe
      });
    }
  }

  // Get trending reactions via Socket.io (real-time)
  getTrendingRealtime(contentType, period = '24h', limit = 10) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('get_trending_reactions', {
        contentType,
        period,
        limit
      });
    }
  }

  // Get user reaction history via Socket.io
  getUserHistoryRealtime(userId, limit = 50) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('get_user_reaction_history', {
        userId,
        limit
      });
    }
  }

  // Utility functions
  formatReactionCount(count) {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  }

  getReactionColor(reactionType) {
    const colorMap = {
      like: '#1da1f2',
      love: '#e91e63',
      laugh: '#ff9800',
      wow: '#9c27b0',
      sad: '#607d8b',
      angry: '#f44336',
      fire: '#ff5722',
      rocket: '#3f51b5',
      heart_eyes: '#e91e63',
      thinking: '#795548',
      clap: '#4caf50',
      thumbs_up: '#4caf50',
      thumbs_down: '#f44336',
      upvote: '#4caf50',
      downvote: '#f44336'
    };
    return colorMap[reactionType] || '#888888';
  }

  getReactionEmoji(reactionType) {
    const emojiMap = {
      like: '👍',
      love: '❤️',
      laugh: '😂',
      wow: '😮',
      sad: '😢',
      angry: '😡',
      fire: '🔥',
      rocket: '🚀',
      heart_eyes: '😍',
      thinking: '🤔',
      clap: '👏',
      thumbs_up: '👍',
      thumbs_down: '👎',
      upvote: '⬆️',
      downvote: '⬇️'
    };
    return emojiMap[reactionType] || '❓';
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Create and export singleton instance
const reactionService = new ReactionService();

export default reactionService;
export { ReactionService };