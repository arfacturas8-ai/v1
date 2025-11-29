/**
 * Channel Management Service for CRYB Platform
 * Handles Discord-like channel operations and messaging
 */

import apiService from './api';

class ChannelService {
  constructor() {
    this.endpoints = {
      channels: '/channels',
      messages: '/messages'
    };
  }

  // Get all channels for a server
  async getChannels(serverId) {
    try {
      const response = await apiService.get(`${this.endpoints.channels}?serverId=${serverId}`);

      if (response.success && response.data) {
        return { success: true, channels: response.data || [] };
      }

      return { success: false, error: 'Failed to fetch channels' };
    } catch (error) {
      console.error('Get channels error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch channels'
      };
    }
  }

  // Get channel by ID
  async getChannel(channelId) {
    try {
      const response = await apiService.get(`${this.endpoints.channels}/${channelId}`);

      if (response.success && response.data) {
        return { success: true, channel: response.data };
      }

      return { success: false, error: 'Channel not found' };
    } catch (error) {
      console.error('Get channel error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch channel'
      };
    }
  }

  // Create channel
  async createChannel(channelData) {
    try {
      const response = await apiService.post(this.endpoints.channels, {
        serverId: channelData.serverId,
        name: channelData.name,
        type: channelData.type || 'GUILD_TEXT',
        description: channelData.description || null,
        topic: channelData.topic || null,
        parentId: channelData.parentId || null,
        isPrivate: channelData.isPrivate || false,
        slowMode: channelData.slowMode || 0,
        nsfw: channelData.nsfw || false,
        userLimit: channelData.userLimit || null,
        bitrate: channelData.bitrate || null,
        position: channelData.position || null
      });

      if (response.success && response.data) {
        return { success: true, channel: response.data };
      }

      return { success: false, error: 'Failed to create channel' };
    } catch (error) {
      console.error('Create channel error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to create channel'
      };
    }
  }

  // Update channel
  async updateChannel(channelId, updateData) {
    try {
      const response = await apiService.patch(`${this.endpoints.channels}/${channelId}`, updateData);

      if (response.success && response.data) {
        return { success: true, channel: response.data };
      }

      return { success: false, error: 'Failed to update channel' };
    } catch (error) {
      console.error('Update channel error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to update channel'
      };
    }
  }

  // Delete channel
  async deleteChannel(channelId) {
    try {
      const response = await apiService.delete(`${this.endpoints.channels}/${channelId}`);
      
      return { success: response.success, message: response.message || 'Channel deleted' };
    } catch (error) {
      console.error('Delete channel error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to delete channel' 
      };
    }
  }

  // Get channel messages
  async getMessages(channelId, options = {}) {
    try {
      const params = new URLSearchParams({
        limit: options.limit || '50',
        ...(options.before && { before: options.before }),
        ...(options.after && { after: options.after }),
        ...(options.around && { around: options.around })
      });

      const response = await apiService.get(
        `${this.endpoints.channels}/${channelId}/messages?${params.toString()}`
      );
      
      if (response.success && response.data) {
        return { 
          success: true, 
          messages: response.data.messages || [],
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

  // Send message
  async sendMessage(channelId, content, options = {}) {
    try {
      const messageData = {
        content,
        type: options.type || 'text',
        replyTo: options.replyTo || null,
        metadata: options.metadata || {}
      };

      // Handle file uploads
      if (options.files && options.files.length > 0) {
        const formData = new FormData();
        
        // Add message data
        Object.keys(messageData).forEach(key => {
          if (typeof messageData[key] === 'object') {
            formData.append(key, JSON.stringify(messageData[key]));
          } else {
            formData.append(key, messageData[key]);
          }
        });
        
        // Add files
        options.files.forEach((file, index) => {
          formData.append('files', file);
        });

        const response = await apiService.post(
          `${this.endpoints.channels}/${channelId}/messages`,
          formData
        );
        
        if (response.success && response.data) {
          return { success: true, message: response.data.message };
        }
      } else {
        // Regular text message
        const response = await apiService.post(
          `${this.endpoints.channels}/${channelId}/messages`,
          messageData
        );
        
        if (response.success && response.data) {
          return { success: true, message: response.data.message };
        }
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

  // Update message
  async updateMessage(channelId, messageId, content) {
    try {
      const response = await apiService.put(
        `${this.endpoints.channels}/${channelId}/messages/${messageId}`,
        { content }
      );
      
      if (response.success && response.data) {
        return { success: true, message: response.data.message };
      }

      return { success: false, error: 'Failed to update message' };
    } catch (error) {
      console.error('Update message error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to update message' 
      };
    }
  }

  // Delete message
  async deleteMessage(channelId, messageId) {
    try {
      const response = await apiService.delete(
        `${this.endpoints.channels}/${channelId}/messages/${messageId}`
      );
      
      return { success: response.success, message: response.message || 'Message deleted' };
    } catch (error) {
      console.error('Delete message error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to delete message' 
      };
    }
  }

  // React to message
  async addReaction(channelId, messageId, emoji) {
    try {
      const response = await apiService.post(
        `${this.endpoints.channels}/${channelId}/messages/${messageId}/reactions`,
        { emoji }
      );
      
      if (response.success && response.data) {
        return { success: true, reaction: response.data.reaction };
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

  // Remove reaction
  async removeReaction(channelId, messageId, emoji) {
    try {
      const response = await apiService.delete(
        `${this.endpoints.channels}/${channelId}/messages/${messageId}/reactions/${emoji}`
      );
      
      return { success: response.success, message: response.message || 'Reaction removed' };
    } catch (error) {
      console.error('Remove reaction error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to remove reaction' 
      };
    }
  }

  // Pin message
  async pinMessage(channelId, messageId) {
    try {
      const response = await apiService.post(
        `${this.endpoints.channels}/${channelId}/messages/${messageId}/pin`
      );
      
      return { success: response.success, message: response.message || 'Message pinned' };
    } catch (error) {
      console.error('Pin message error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to pin message' 
      };
    }
  }

  // Unpin message
  async unpinMessage(channelId, messageId) {
    try {
      const response = await apiService.delete(
        `${this.endpoints.channels}/${channelId}/messages/${messageId}/pin`
      );
      
      return { success: response.success, message: response.message || 'Message unpinned' };
    } catch (error) {
      console.error('Unpin message error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to unpin message' 
      };
    }
  }

  // Get pinned messages
  async getPinnedMessages(channelId) {
    try {
      const response = await apiService.get(
        `${this.endpoints.channels}/${channelId}/pinned`
      );
      
      if (response.success && response.data) {
        return { success: true, messages: response.data.messages || [] };
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

  // Search messages in channel
  async searchMessages(channelId, query, options = {}) {
    try {
      const params = new URLSearchParams({
        q: query,
        limit: options.limit || '25',
        ...(options.author && { author: options.author }),
        ...(options.mentions && { mentions: options.mentions }),
        ...(options.has && { has: options.has }),
        ...(options.before && { before: options.before }),
        ...(options.after && { after: options.after })
      });

      const response = await apiService.get(
        `${this.endpoints.channels}/${channelId}/search?${params.toString()}`
      );
      
      if (response.success && response.data) {
        return { 
          success: true, 
          messages: response.data.messages || [],
          total: response.data.total || 0
        };
      }

      return { success: false, error: 'Failed to search messages' };
    } catch (error) {
      console.error('Search messages error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to search messages' 
      };
    }
  }

  // Get channel permissions for current user
  async getChannelPermissions(channelId) {
    try {
      const response = await apiService.get(
        `${this.endpoints.channels}/${channelId}/permissions`
      );
      
      if (response.success && response.data) {
        return { success: true, permissions: response.data.permissions };
      }

      return { success: false, error: 'Failed to fetch permissions' };
    } catch (error) {
      console.error('Get channel permissions error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to fetch permissions' 
      };
    }
  }

  // Update channel permissions
  async updateChannelPermissions(channelId, roleId, permissions) {
    try {
      const response = await apiService.put(
        `${this.endpoints.channels}/${channelId}/permissions/${roleId}`,
        { permissions }
      );
      
      if (response.success && response.data) {
        return { success: true, permissions: response.data.permissions };
      }

      return { success: false, error: 'Failed to update permissions' };
    } catch (error) {
      console.error('Update channel permissions error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to update permissions' 
      };
    }
  }

  // Get channel members
  async getChannelMembers(channelId) {
    try {
      const response = await apiService.get(
        `${this.endpoints.channels}/${channelId}/members`
      );
      
      if (response.success && response.data) {
        return { success: true, members: response.data.members || [] };
      }

      return { success: false, error: 'Failed to fetch channel members' };
    } catch (error) {
      console.error('Get channel members error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to fetch channel members' 
      };
    }
  }

  // Create message thread
  async createThread(channelId, messageId, threadName) {
    try {
      const response = await apiService.post(
        `${this.endpoints.channels}/${channelId}/messages/${messageId}/threads`,
        { name: threadName }
      );
      
      if (response.success && response.data) {
        return { success: true, thread: response.data.thread };
      }

      return { success: false, error: 'Failed to create thread' };
    } catch (error) {
      console.error('Create thread error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to create thread' 
      };
    }
  }

  // Get channel webhooks
  async getWebhooks(channelId) {
    try {
      const response = await apiService.get(
        `${this.endpoints.channels}/${channelId}/webhooks`
      );
      
      if (response.success && response.data) {
        return { success: true, webhooks: response.data.webhooks || [] };
      }

      return { success: false, error: 'Failed to fetch webhooks' };
    } catch (error) {
      console.error('Get webhooks error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to fetch webhooks' 
      };
    }
  }

  // Create webhook
  async createWebhook(channelId, webhookData) {
    try {
      const response = await apiService.post(
        `${this.endpoints.channels}/${channelId}/webhooks`,
        webhookData
      );
      
      if (response.success && response.data) {
        return { success: true, webhook: response.data.webhook };
      }

      return { success: false, error: 'Failed to create webhook' };
    } catch (error) {
      console.error('Create webhook error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to create webhook' 
      };
    }
  }

  // Mark channel as read
  async markAsRead(channelId) {
    try {
      const response = await apiService.post(
        `${this.endpoints.channels}/${channelId}/read`
      );
      
      return { success: response.success, message: response.message || 'Channel marked as read' };
    } catch (error) {
      console.error('Mark as read error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to mark channel as read' 
      };
    }
  }

  // Get channel typing users
  async getTypingUsers(channelId) {
    try {
      const response = await apiService.get(
        `${this.endpoints.channels}/${channelId}/typing`
      );
      
      if (response.success && response.data) {
        return { success: true, users: response.data.users || [] };
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

  // Upload file to channel
  async uploadFile(channelId, file, metadata = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Add metadata
      Object.keys(metadata).forEach(key => {
        formData.append(key, metadata[key]);
      });

      const response = await apiService.post(
        `${this.endpoints.channels}/${channelId}/upload`,
        formData
      );
      
      if (response.success && response.data) {
        return { success: true, file: response.data.file };
      }

      return { success: false, error: 'Failed to upload file' };
    } catch (error) {
      console.error('Upload file error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to upload file' 
      };
    }
  }

  // Get message history for infinite scroll
  async getMessageHistory(channelId, lastMessageId = null, limit = 50) {
    try {
      const params = new URLSearchParams({ limit: limit.toString() });
      if (lastMessageId) {
        params.append('before', lastMessageId);
      }

      const response = await apiService.get(
        `${this.endpoints.channels}/${channelId}/messages?${params.toString()}`
      );

      if (response.success && response.data) {
        return {
          success: true,
          messages: response.data.messages || [],
          hasMore: response.data.hasMore || false
        };
      }

      return { success: false, error: 'Failed to fetch message history' };
    } catch (error) {
      console.error('Get message history error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch message history'
      };
    }
  }

  // Send typing indicator
  async sendTypingIndicator(channelId) {
    try {
      const response = await apiService.post(
        `${this.endpoints.channels}/${channelId}/typing`
      );

      return { success: response.success, message: response.message || 'Typing indicator sent' };
    } catch (error) {
      console.error('Send typing indicator error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to send typing indicator'
      };
    }
  }

  // Delete channel permission overwrite
  async deleteChannelPermission(channelId, overwriteId) {
    try {
      const response = await apiService.delete(
        `${this.endpoints.channels}/${channelId}/permissions/${overwriteId}`
      );

      return { success: response.success, message: response.message || 'Permission overwrite deleted' };
    } catch (error) {
      console.error('Delete channel permission error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to delete permission overwrite'
      };
    }
  }
}

// Create and export singleton instance
const channelService = new ChannelService();

export default channelService;