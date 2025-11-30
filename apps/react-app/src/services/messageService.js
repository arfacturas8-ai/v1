/**
 * Message Service for CRYB Platform
 * Handles all message-related API operations
 */

import api from './api';

class MessageService {
  /**
   * Get messages for a specific channel
   * @param {string} channelId - Channel ID
   * @param {Object} options - Query options (page, limit, before, after)
   * @returns {Promise<Object>} Messages with pagination
   */
  async getMessages(channelId, options = {}) {
    try {
      const params = { channelId, ...options };
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/messages${queryString ? `?${queryString}` : ''}`);

      if (response.success && response.data) {
        return {
          success: true,
          messages: response.data.messages || response.data || [],
          pagination: response.data.pagination || {}
        };
      }

      return { success: false, error: 'Failed to fetch messages' };
    } catch (error) {
      console.error('Get messages error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch messages'
      };
    }
  }

  /**
   * Send a new message to a channel
   * @param {string} channelId - Channel ID
   * @param {Object} messageData - Message data (content, replyToId, attachments, embeds)
   * @returns {Promise<Object>} Created message
   */
  async sendMessage(channelId, messageData) {
    try {
      const data = {
        channelId,
        ...messageData
      };
      const response = await api.post('/messages', data);

      if (response.success && response.data) {
        return { success: true, message: response.data.message || response.data };
      }

      return { success: false, error: 'Failed to send message' };
    } catch (error) {
      console.error('Send message error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to send message'
      };
    }
  }

  /**
   * Get a single message by ID
   * @param {string} messageId - Message ID
   * @returns {Promise<Object>} Message details
   */
  async getMessage(messageId) {
    try {
      const response = await api.get(`/messages/${messageId}`);

      if (response.success && response.data) {
        return { success: true, data: response.data };
      }

      return { success: false, error: 'Message not found' };
    } catch (error) {
      console.error('Get message error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch message'
      };
    }
  }

  /**
   * Edit a message
   * @param {string} messageId - Message ID
   * @param {string} content - Updated message content
   * @returns {Promise<Object>} Updated message
   */
  async editMessage(messageId, content) {
    try {
      const response = await api.patch(`/messages/${messageId}`, { content });

      if (response.success && response.data) {
        return { success: true, message: response.data.message || response.data };
      }

      return { success: false, error: 'Failed to edit message' };
    } catch (error) {
      console.error('Edit message error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to edit message'
      };
    }
  }

  /**
   * Delete a message
   * @param {string} messageId - Message ID
   * @returns {Promise<Object>} Success response
   */
  async deleteMessage(messageId) {
    try {
      const response = await api.delete(`/messages/${messageId}`);

      return {
        success: response.success,
        message: response.message || 'Message deleted'
      };
    } catch (error) {
      console.error('Delete message error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to delete message'
      };
    }
  }

  /**
   * Add or toggle a reaction to a message
   * @param {string} messageId - Message ID
   * @param {string} emoji - Emoji to react with
   * @returns {Promise<Object>} Reaction data
   */
  async addReaction(messageId, emoji) {
    try {
      const response = await api.post(`/messages/${messageId}/reactions`, { emoji });

      if (response.success && response.data) {
        return { success: true, reaction: response.data.reaction || response.data };
      }

      return { success: false, error: 'Failed to add reaction' };
    } catch (error) {
      console.error('Add reaction error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to add reaction'
      };
    }
  }

  /**
   * Remove a reaction from a message
   * Note: The backend handles this through the addReaction endpoint (toggle behavior)
   * @param {string} messageId - Message ID
   * @param {string} emoji - Emoji to remove
   * @returns {Promise<Object>} Success response
   */
  async removeReaction(messageId, emoji) {
    try {
      // The backend API toggles reactions, so we use the same endpoint
      const response = await api.post(`/messages/${messageId}/reactions`, { emoji });

      if (response.success && response.data) {
        return { success: true, reaction: response.data.reaction || response.data };
      }

      return { success: false, error: 'Failed to remove reaction' };
    } catch (error) {
      console.error('Remove reaction error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to remove reaction'
      };
    }
  }

  /**
   * Get users who reacted with a specific emoji
   * @param {string} messageId - Message ID
   * @param {string} emoji - Emoji to query
   * @param {Object} params - Query parameters (page, limit)
   * @returns {Promise<Object>} List of users who reacted
   */
  async getReactionDetails(messageId, emoji, params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/messages/${messageId}/reactions/${emoji}${queryString ? `?${queryString}` : ''}`);

      if (response.success && response.data) {
        return {
          success: true,
          users: response.data.users || response.data || [],
          pagination: response.data.pagination || {}
        };
      }

      return { success: false, error: 'Failed to fetch reaction details' };
    } catch (error) {
      console.error('Get reaction details error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch reaction details'
      };
    }
  }

  /**
   * Pin a message in the channel
   * @param {string} messageId - Message ID
   * @returns {Promise<Object>} Pinned message
   */
  async pinMessage(messageId) {
    try {
      const response = await api.post(`/messages/${messageId}/pin`);

      return {
        success: response.success,
        message: response.message || 'Message pinned'
      };
    } catch (error) {
      console.error('Pin message error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to pin message'
      };
    }
  }

  /**
   * Unpin a message in the channel
   * @param {string} messageId - Message ID
   * @returns {Promise<Object>} Success response
   */
  async unpinMessage(messageId) {
    try {
      const response = await api.post(`/messages/${messageId}/unpin`);

      return {
        success: response.success,
        message: response.message || 'Message unpinned'
      };
    } catch (error) {
      console.error('Unpin message error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to unpin message'
      };
    }
  }

  /**
   * Get all pinned messages for a channel
   * @param {string} channelId - Channel ID
   * @param {Object} params - Query parameters (page, limit)
   * @returns {Promise<Object>} List of pinned messages
   */
  async getPinnedMessages(channelId, params = {}) {
    try {
      const queryParams = {
        channelId,
        ...params
      };

      // Get all messages for the channel and filter pinned ones
      // Note: This could be optimized with a dedicated backend endpoint
      const response = await this.getMessages(channelId, {
        ...params,
        limit: 100 // Get more messages to find pinned ones
      });

      if (response.success && response.messages) {
        // Filter for pinned messages
        const pinnedMessages = response.messages.filter(msg => msg.isPinned);

        return {
          success: true,
          data: {
            messages: pinnedMessages,
            pagination: {
              total: pinnedMessages.length,
              page: params.page || 1,
              pageSize: params.limit || 50,
              hasMore: false
            }
          }
        };
      }

      return { success: false, error: 'Failed to fetch pinned messages' };
    } catch (error) {
      console.error('Get pinned messages error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch pinned messages'
      };
    }
  }

  /**
   * Search messages in a channel
   * @param {string} channelId - Channel ID
   * @param {string} query - Search query
   * @param {Object} params - Query parameters (page, limit)
   * @returns {Promise<Object>} Search results
   */
  async searchMessages(channelId, query, params = {}) {
    try {
      const searchParams = {
        channelId,
        q: query,
        ...params
      };
      const queryString = new URLSearchParams(searchParams).toString();
      const response = await api.get(`/messages/search${queryString ? `?${queryString}` : ''}`);

      if (response.success && response.data) {
        return {
          success: true,
          messages: response.data.messages || response.data.results || response.data || [],
          total: response.data.total || 0
        };
      }

      return { success: false, error: 'Search failed' };
    } catch (error) {
      console.error('Search messages error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Search failed'
      };
    }
  }

  /**
   * Get message replies (thread)
   * @param {string} messageId - Parent message ID
   * @param {Object} params - Query parameters (page, limit)
   * @returns {Promise<Object>} List of reply messages
   */
  async getMessageReplies(messageId, params = {}) {
    try {
      // First get the message which includes replies
      const message = await this.getMessage(messageId);

      if (message.success && message.data && message.data.replies) {
        return {
          success: true,
          data: {
            messages: message.data.replies,
            pagination: {
              total: message.data._count?.replies || message.data.replies.length,
              page: params.page || 1,
              pageSize: params.limit || 50,
              hasMore: false
            }
          }
        };
      }

      return { success: false, error: 'Failed to fetch message replies' };
    } catch (error) {
      console.error('Get message replies error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch message replies'
      };
    }
  }

  /**
   * Upload message attachments
   * @param {string} channelId - Channel ID
   * @param {File|File[]} files - File(s) to upload
   * @returns {Promise<Object>} Upload response with attachment URLs
   */
  async uploadAttachments(channelId, files) {
    try {
      const fileArray = Array.isArray(files) ? files : [files];

      if (fileArray.length === 1) {
        const response = await api.uploadFile('/messages/attachments', fileArray[0], { channelId });

        if (response.success && response.data) {
          return { success: true, attachments: response.data.attachments || response.data };
        }
      } else {
        const response = await api.uploadFiles('/messages/attachments', fileArray, { channelId });

        if (response.success && response.data) {
          return { success: true, attachments: response.data.attachments || response.data };
        }
      }

      return { success: false, error: 'Failed to upload attachments' };
    } catch (error) {
      console.error('Upload attachments error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to upload attachments'
      };
    }
  }

  /**
   * Report a message
   * @param {string} messageId - Message ID
   * @param {Object} reportData - Report details (reason, description)
   * @returns {Promise<Object>} Success response
   */
  async reportMessage(messageId, reportData) {
    try {
      const response = await api.post(`/messages/${messageId}/report`, reportData);

      return {
        success: response.success,
        message: response.message || 'Message reported'
      };
    } catch (error) {
      console.error('Report message error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to report message'
      };
    }
  }

  /**
   * Bulk delete messages (moderator action)
   * @param {string} channelId - Channel ID
   * @param {string[]} messageIds - Array of message IDs to delete
   * @returns {Promise<Object>} Success response
   */
  async bulkDeleteMessages(channelId, messageIds) {
    try {
      const response = await api.post(`/messages/bulk-delete`, {
        channelId,
        messageIds
      });

      return {
        success: response.success,
        message: response.message || `${messageIds.length} messages deleted`
      };
    } catch (error) {
      console.error('Bulk delete messages error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to delete messages'
      };
    }
  }

  /**
   * Get messages before a specific message ID (for pagination)
   * @param {string} channelId - Channel ID
   * @param {string} beforeMessageId - Message ID to get messages before
   * @param {number} limit - Number of messages to fetch
   * @returns {Promise<Object>} Messages with pagination
   */
  async getMessagesBefore(channelId, beforeMessageId, limit = 50) {
    return this.getMessages(channelId, {
      before: beforeMessageId,
      limit
    });
  }

  /**
   * Get messages after a specific message ID (for pagination)
   * @param {string} channelId - Channel ID
   * @param {string} afterMessageId - Message ID to get messages after
   * @param {number} limit - Number of messages to fetch
   * @returns {Promise<Object>} Messages with pagination
   */
  async getMessagesAfter(channelId, afterMessageId, limit = 50) {
    return this.getMessages(channelId, {
      after: afterMessageId,
      limit
    });
  }

  /**
   * Get messages around a specific message ID (for jump to message)
   * @param {string} channelId - Channel ID
   * @param {string} aroundMessageId - Message ID to center around
   * @param {number} limit - Number of messages to fetch
   * @returns {Promise<Object>} Messages with pagination
   */
  async getMessagesAround(channelId, aroundMessageId, limit = 50) {
    try {
      const halfLimit = Math.floor(limit / 2);

      // Get messages before and after the target message
      const [before, after] = await Promise.all([
        this.getMessagesBefore(channelId, aroundMessageId, halfLimit),
        this.getMessagesAfter(channelId, aroundMessageId, halfLimit)
      ]);

      // Also get the target message
      const targetMessage = await this.getMessage(aroundMessageId);

      const beforeMessages = before.success ? before.messages : [];
      const afterMessages = after.success ? after.messages : [];
      const centerMessage = targetMessage.success && targetMessage.data ? [targetMessage.data] : [];

      // Combine and sort messages
      const allMessages = [...beforeMessages, ...centerMessage, ...afterMessages]
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      return {
        success: true,
        data: {
          messages: allMessages,
          pagination: {
            total: allMessages.length,
            page: 1,
            pageSize: limit,
            hasMore: false
          }
        }
      };
    } catch (error) {
      console.error('Get messages around error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch messages'
      };
    }
  }

  /**
   * Mark messages as read in a channel
   * @param {string} channelId - Channel ID
   * @param {string} lastMessageId - Last message ID that was read
   * @returns {Promise<Object>} Success response
   */
  async markAsRead(channelId, lastMessageId) {
    try {
      const response = await api.post(`/messages/read`, {
        channelId,
        lastMessageId
      });

      return {
        success: response.success,
        message: response.message || 'Messages marked as read'
      };
    } catch (error) {
      console.error('Mark as read error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to mark messages as read'
      };
    }
  }

  /**
   * Get unread message count for a channel
   * @param {string} channelId - Channel ID
   * @returns {Promise<Object>} Unread count
   */
  async getUnreadCount(channelId) {
    try {
      const response = await api.get(`/messages/unread?channelId=${channelId}`);

      if (response.success && response.data) {
        return { success: true, count: response.data.count || 0 };
      }

      return { success: false, error: 'Failed to fetch unread count' };
    } catch (error) {
      console.error('Get unread count error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch unread count'
      };
    }
  }

  /**
   * Start typing indicator in a channel
   * @param {string} channelId - Channel ID
   * @returns {Promise<Object>} Success response
   */
  async startTyping(channelId) {
    try {
      const response = await api.post(`/messages/typing`, { channelId });

      return {
        success: response.success,
        message: response.message || 'Typing indicator started'
      };
    } catch (error) {
      console.error('Start typing error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to start typing indicator'
      };
    }
  }

  /**
   * Get typing users in a channel
   * @param {string} channelId - Channel ID
   * @returns {Promise<Object>} List of users currently typing
   */
  async getTypingUsers(channelId) {
    try {
      const response = await api.get(`/messages/typing?channelId=${channelId}`);

      if (response.success && response.data) {
        return { success: true, users: response.data.users || response.data || [] };
      }

      return { success: false, error: 'Failed to fetch typing users' };
    } catch (error) {
      console.error('Get typing users error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch typing users'
      };
    }
  }
}

export default new MessageService();
