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
    const params = { channelId, ...options };
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/messages${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Send a new message to a channel
   * @param {string} channelId - Channel ID
   * @param {Object} messageData - Message data (content, replyToId, attachments, embeds)
   * @returns {Promise<Object>} Created message
   */
  async sendMessage(channelId, messageData) {
    const data = {
      channelId,
      ...messageData
    };
    return api.post('/messages', data);
  }

  /**
   * Get a single message by ID
   * @param {string} messageId - Message ID
   * @returns {Promise<Object>} Message details
   */
  async getMessage(messageId) {
    return api.get(`/messages/${messageId}`);
  }

  /**
   * Edit a message
   * @param {string} messageId - Message ID
   * @param {string} content - Updated message content
   * @returns {Promise<Object>} Updated message
   */
  async editMessage(messageId, content) {
    return api.patch(`/messages/${messageId}`, { content });
  }

  /**
   * Delete a message
   * @param {string} messageId - Message ID
   * @returns {Promise<Object>} Success response
   */
  async deleteMessage(messageId) {
    return api.delete(`/messages/${messageId}`);
  }

  /**
   * Add or toggle a reaction to a message
   * @param {string} messageId - Message ID
   * @param {string} emoji - Emoji to react with
   * @returns {Promise<Object>} Reaction data
   */
  async addReaction(messageId, emoji) {
    return api.post(`/messages/${messageId}/reactions`, { emoji });
  }

  /**
   * Remove a reaction from a message
   * Note: The backend handles this through the addReaction endpoint (toggle behavior)
   * @param {string} messageId - Message ID
   * @param {string} emoji - Emoji to remove
   * @returns {Promise<Object>} Success response
   */
  async removeReaction(messageId, emoji) {
    // The backend API toggles reactions, so we use the same endpoint
    return api.post(`/messages/${messageId}/reactions`, { emoji });
  }

  /**
   * Get users who reacted with a specific emoji
   * @param {string} messageId - Message ID
   * @param {string} emoji - Emoji to query
   * @param {Object} params - Query parameters (page, limit)
   * @returns {Promise<Object>} List of users who reacted
   */
  async getReactionDetails(messageId, emoji, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/messages/${messageId}/reactions/${emoji}${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Pin a message in the channel
   * @param {string} messageId - Message ID
   * @returns {Promise<Object>} Pinned message
   */
  async pinMessage(messageId) {
    return api.post(`/messages/${messageId}/pin`);
  }

  /**
   * Unpin a message in the channel
   * @param {string} messageId - Message ID
   * @returns {Promise<Object>} Success response
   */
  async unpinMessage(messageId) {
    return api.post(`/messages/${messageId}/unpin`);
  }

  /**
   * Get all pinned messages for a channel
   * @param {string} channelId - Channel ID
   * @param {Object} params - Query parameters (page, limit)
   * @returns {Promise<Object>} List of pinned messages
   */
  async getPinnedMessages(channelId, params = {}) {
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

    if (response.success && response.data && response.data.messages) {
      // Filter for pinned messages
      const pinnedMessages = response.data.messages.filter(msg => msg.isPinned);

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

    return response;
  }

  /**
   * Search messages in a channel
   * @param {string} channelId - Channel ID
   * @param {string} query - Search query
   * @param {Object} params - Query parameters (page, limit)
   * @returns {Promise<Object>} Search results
   */
  async searchMessages(channelId, query, params = {}) {
    const searchParams = {
      channelId,
      q: query,
      ...params
    };
    const queryString = new URLSearchParams(searchParams).toString();
    return api.get(`/messages/search${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Get message replies (thread)
   * @param {string} messageId - Parent message ID
   * @param {Object} params - Query parameters (page, limit)
   * @returns {Promise<Object>} List of reply messages
   */
  async getMessageReplies(messageId, params = {}) {
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

    return message;
  }

  /**
   * Upload message attachments
   * @param {string} channelId - Channel ID
   * @param {File|File[]} files - File(s) to upload
   * @returns {Promise<Object>} Upload response with attachment URLs
   */
  async uploadAttachments(channelId, files) {
    const fileArray = Array.isArray(files) ? files : [files];

    if (fileArray.length === 1) {
      return api.uploadFile('/messages/attachments', fileArray[0], { channelId });
    } else {
      return api.uploadFiles('/messages/attachments', fileArray, { channelId });
    }
  }

  /**
   * Report a message
   * @param {string} messageId - Message ID
   * @param {Object} reportData - Report details (reason, description)
   * @returns {Promise<Object>} Success response
   */
  async reportMessage(messageId, reportData) {
    return api.post(`/messages/${messageId}/report`, reportData);
  }

  /**
   * Bulk delete messages (moderator action)
   * @param {string} channelId - Channel ID
   * @param {string[]} messageIds - Array of message IDs to delete
   * @returns {Promise<Object>} Success response
   */
  async bulkDeleteMessages(channelId, messageIds) {
    return api.post(`/messages/bulk-delete`, {
      channelId,
      messageIds
    });
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
    const halfLimit = Math.floor(limit / 2);

    // Get messages before and after the target message
    const [before, after] = await Promise.all([
      this.getMessagesBefore(channelId, aroundMessageId, halfLimit),
      this.getMessagesAfter(channelId, aroundMessageId, halfLimit)
    ]);

    // Also get the target message
    const targetMessage = await this.getMessage(aroundMessageId);

    const beforeMessages = before.success ? before.data.messages : [];
    const afterMessages = after.success ? after.data.messages : [];
    const centerMessage = targetMessage.success ? [targetMessage.data] : [];

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
  }

  /**
   * Mark messages as read in a channel
   * @param {string} channelId - Channel ID
   * @param {string} lastMessageId - Last message ID that was read
   * @returns {Promise<Object>} Success response
   */
  async markAsRead(channelId, lastMessageId) {
    return api.post(`/messages/read`, {
      channelId,
      lastMessageId
    });
  }

  /**
   * Get unread message count for a channel
   * @param {string} channelId - Channel ID
   * @returns {Promise<Object>} Unread count
   */
  async getUnreadCount(channelId) {
    return api.get(`/messages/unread?channelId=${channelId}`);
  }

  /**
   * Start typing indicator in a channel
   * @param {string} channelId - Channel ID
   * @returns {Promise<Object>} Success response
   */
  async startTyping(channelId) {
    return api.post(`/messages/typing`, { channelId });
  }

  /**
   * Get typing users in a channel
   * @param {string} channelId - Channel ID
   * @returns {Promise<Object>} List of users currently typing
   */
  async getTypingUsers(channelId) {
    return api.get(`/messages/typing?channelId=${channelId}`);
  }
}

export default new MessageService();
