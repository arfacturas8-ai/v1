/**
 * Server Management Service for CRYB Platform
 * Handles Discord-like server operations
 */

import apiService from './api';
import channelService from './channelService';

class ServerService {
  constructor() {
    this.endpoints = {
      servers: '/servers',
      channels: '/channels',
      members: '/servers/{serverId}/members',
      invites: '/servers/{serverId}/invites'
    };
  }

  // Get all servers for current user
  async getServers() {
    try {
      const response = await apiService.get(this.endpoints.servers);
      
      if (response.success && response.data) {
        return { success: true, servers: response.data.servers || [] };
      }

      return { success: false, error: 'Failed to fetch servers' };
    } catch (error) {
      console.error('Get servers error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to fetch servers' 
      };
    }
  }

  // Get server by ID
  async getServer(serverId) {
    try {
      const response = await apiService.get(`${this.endpoints.servers}/${serverId}`);
      
      if (response.success && response.data) {
        return { success: true, server: response.data.server };
      }

      return { success: false, error: 'Server not found' };
    } catch (error) {
      console.error('Get server error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to fetch server' 
      };
    }
  }

  // Create new server
  async createServer(serverData) {
    try {
      const formData = new FormData();
      
      // Add server data
      formData.append('name', serverData.name);
      formData.append('description', serverData.description || '');
      formData.append('isPublic', serverData.isPublic ? 'true' : 'false');
      
      // Add icon if provided
      if (serverData.icon) {
        formData.append('icon', serverData.icon);
      }

      // Add banner if provided
      if (serverData.banner) {
        formData.append('banner', serverData.banner);
      }

      // Add categories and channels if provided
      if (serverData.categories) {
        formData.append('categories', JSON.stringify(serverData.categories));
      }

      const response = await apiService.post(this.endpoints.servers, formData);
      
      if (response.success && response.data) {
        return { success: true, server: response.data.server };
      }

      return { success: false, error: 'Failed to create server' };
    } catch (error) {
      console.error('Create server error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to create server' 
      };
    }
  }

  // Update server
  async updateServer(serverId, updateData) {
    try {
      const formData = new FormData();
      
      // Add text fields
      Object.keys(updateData).forEach(key => {
        if (key === 'icon' || key === 'banner') {
          // Handle file uploads
          if (updateData[key]) {
            formData.append(key, updateData[key]);
          }
        } else if (typeof updateData[key] === 'object') {
          formData.append(key, JSON.stringify(updateData[key]));
        } else {
          formData.append(key, updateData[key]);
        }
      });

      const response = await apiService.put(`${this.endpoints.servers}/${serverId}`, formData);
      
      if (response.success && response.data) {
        return { success: true, server: response.data.server };
      }

      return { success: false, error: 'Failed to update server' };
    } catch (error) {
      console.error('Update server error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to update server' 
      };
    }
  }

  // Delete server
  async deleteServer(serverId) {
    try {
      const response = await apiService.delete(`${this.endpoints.servers}/${serverId}`);
      
      return { success: response.success, message: response.message || 'Server deleted' };
    } catch (error) {
      console.error('Delete server error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to delete server' 
      };
    }
  }

  // Join server
  async joinServer(serverId, inviteCode = null) {
    try {
      const response = await apiService.post(`${this.endpoints.servers}/${serverId}/join`, {
        inviteCode
      });
      
      if (response.success && response.data) {
        return { success: true, server: response.data.server, member: response.data.member };
      }

      return { success: false, error: 'Failed to join server' };
    } catch (error) {
      console.error('Join server error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to join server' 
      };
    }
  }

  // Leave server
  async leaveServer(serverId) {
    try {
      const response = await apiService.post(`${this.endpoints.servers}/${serverId}/leave`);
      
      return { success: response.success, message: response.message || 'Left server' };
    } catch (error) {
      console.error('Leave server error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to leave server' 
      };
    }
  }

  // Get server members
  async getServerMembers(serverId, page = 1, limit = 50) {
    try {
      const response = await apiService.get(
        this.endpoints.members.replace('{serverId}', serverId) + 
        `?page=${page}&limit=${limit}`
      );
      
      if (response.success && response.data) {
        return { 
          success: true, 
          members: response.data.members || [],
          pagination: response.data.pagination || {}
        };
      }

      return { success: false, error: 'Failed to fetch members' };
    } catch (error) {
      console.error('Get server members error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to fetch members' 
      };
    }
  }

  // Update member role
  async updateMemberRole(serverId, memberId, role) {
    try {
      const response = await apiService.patch(
        `${this.endpoints.members.replace('{serverId}', serverId)}/${memberId}`,
        { role }
      );
      
      if (response.success && response.data) {
        return { success: true, member: response.data.member };
      }

      return { success: false, error: 'Failed to update member role' };
    } catch (error) {
      console.error('Update member role error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to update member role' 
      };
    }
  }

  // Kick member from server
  async kickMember(serverId, memberId, reason = '') {
    try {
      const response = await apiService.delete(
        `${this.endpoints.members.replace('{serverId}', serverId)}/${memberId}`,
        { body: JSON.stringify({ reason }) }
      );
      
      return { success: response.success, message: response.message || 'Member kicked' };
    } catch (error) {
      console.error('Kick member error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to kick member' 
      };
    }
  }

  // Ban member from server
  async banMember(serverId, memberId, reason = '', duration = null) {
    try {
      const response = await apiService.post(
        `${this.endpoints.servers}/${serverId}/ban`,
        { memberId, reason, duration }
      );
      
      return { success: response.success, message: response.message || 'Member banned' };
    } catch (error) {
      console.error('Ban member error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to ban member' 
      };
    }
  }

  // Get server channels
  async getServerChannels(serverId) {
    try {
      return await channelService.getChannels(serverId);
    } catch (error) {
      console.error('Get server channels error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch channels'
      };
    }
  }

  // Create server channel
  async createChannel(serverId, channelData) {
    try {
      return await channelService.createChannel({
        serverId,
        name: channelData.name,
        type: channelData.type || 'GUILD_TEXT',
        description: channelData.description || null,
        topic: channelData.topic || null,
        parentId: channelData.categoryId || channelData.parentId || null,
        isPrivate: channelData.isPrivate || false,
        slowMode: channelData.slowMode || 0,
        nsfw: channelData.nsfw || false,
        userLimit: channelData.userLimit || null,
        bitrate: channelData.bitrate || null,
        position: channelData.position || null
      });
    } catch (error) {
      console.error('Create channel error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create channel'
      };
    }
  }

  // Create server invite
  async createInvite(serverId, inviteData = {}) {
    try {
      const response = await apiService.post(
        this.endpoints.invites.replace('{serverId}', serverId),
        {
          expiresIn: inviteData.expiresIn || '7d',
          maxUses: inviteData.maxUses || null,
          temporary: inviteData.temporary || false
        }
      );
      
      if (response.success && response.data) {
        return { success: true, invite: response.data.invite };
      }

      return { success: false, error: 'Failed to create invite' };
    } catch (error) {
      console.error('Create invite error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to create invite' 
      };
    }
  }

  // Get server invites
  async getInvites(serverId) {
    try {
      const response = await apiService.get(
        this.endpoints.invites.replace('{serverId}', serverId)
      );
      
      if (response.success && response.data) {
        return { success: true, invites: response.data.invites || [] };
      }

      return { success: false, error: 'Failed to fetch invites' };
    } catch (error) {
      console.error('Get invites error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to fetch invites' 
      };
    }
  }

  // Delete server invite
  async deleteInvite(serverId, inviteId) {
    try {
      const response = await apiService.delete(
        `${this.endpoints.invites.replace('{serverId}', serverId)}/${inviteId}`
      );
      
      return { success: response.success, message: response.message || 'Invite deleted' };
    } catch (error) {
      console.error('Delete invite error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to delete invite' 
      };
    }
  }

  // Search public servers
  async searchPublicServers(query = '', filters = {}) {
    try {
      const params = new URLSearchParams({
        q: query,
        ...filters
      });

      const response = await apiService.get(`/server-discovery?${params.toString()}`);
      
      if (response.success && response.data) {
        return { success: true, servers: response.data.servers || [] };
      }

      return { success: false, error: 'Failed to search servers' };
    } catch (error) {
      console.error('Search servers error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to search servers' 
      };
    }
  }

  // Get server analytics (admin only)
  async getServerAnalytics(serverId, timeRange = '7d') {
    try {
      const response = await apiService.get(
        `${this.endpoints.servers}/${serverId}/analytics?timeRange=${timeRange}`
      );
      
      if (response.success && response.data) {
        return { success: true, analytics: response.data.analytics };
      }

      return { success: false, error: 'Failed to fetch analytics' };
    } catch (error) {
      console.error('Get server analytics error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to fetch analytics' 
      };
    }
  }

  // Validate server invite code
  async validateInvite(inviteCode) {
    try {
      const response = await apiService.get(`/invites/${inviteCode}/validate`, { auth: false });
      
      if (response.success && response.data) {
        return { success: true, invite: response.data.invite };
      }

      return { success: false, error: 'Invalid or expired invite' };
    } catch (error) {
      console.error('Validate invite error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Invalid or expired invite' 
      };
    }
  }

  // Join server by invite code
  async joinByInvite(inviteCode) {
    try {
      const response = await apiService.post(`/invites/${inviteCode}/join`);

      if (response.success && response.data) {
        return {
          success: true,
          server: response.data.server,
          member: response.data.member
        };
      }

      return { success: false, error: 'Failed to join server' };
    } catch (error) {
      console.error('Join by invite error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to join server'
      };
    }
  }

  // Unban member from server
  async unbanMember(serverId, userId) {
    try {
      const response = await apiService.delete(`/moderation/servers/${serverId}/ban/${userId}`);

      return { success: response.success, message: response.message || 'Member unbanned' };
    } catch (error) {
      console.error('Unban member error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to unban member'
      };
    }
  }

  // Get server bans
  async getServerBans(serverId) {
    try {
      const response = await apiService.get(`/moderation/servers/${serverId}/bans`);

      if (response.success && response.data) {
        return { success: true, bans: response.data.bans || [] };
      }

      return { success: false, error: 'Failed to fetch bans' };
    } catch (error) {
      console.error('Get server bans error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch bans'
      };
    }
  }

  // Get server roles
  async getServerRoles(serverId) {
    try {
      const response = await apiService.get(`${this.endpoints.servers}/${serverId}/roles`);

      if (response.success && response.data) {
        return { success: true, roles: response.data.roles || [] };
      }

      return { success: false, error: 'Failed to fetch roles' };
    } catch (error) {
      console.error('Get server roles error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch roles'
      };
    }
  }

  // Create server role
  async createRole(serverId, roleData) {
    try {
      const response = await apiService.post(`${this.endpoints.servers}/${serverId}/roles`, {
        name: roleData.name,
        color: roleData.color || null,
        permissions: roleData.permissions || '0',
        position: roleData.position || 0,
        mentionable: roleData.mentionable || false,
        hoisted: roleData.hoisted || false
      });

      if (response.success && response.data) {
        return { success: true, role: response.data.role };
      }

      return { success: false, error: 'Failed to create role' };
    } catch (error) {
      console.error('Create role error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to create role'
      };
    }
  }

  // Update server role
  async updateRole(serverId, roleId, updateData) {
    try {
      const response = await apiService.patch(
        `${this.endpoints.servers}/${serverId}/roles/${roleId}`,
        updateData
      );

      if (response.success && response.data) {
        return { success: true, role: response.data.role };
      }

      return { success: false, error: 'Failed to update role' };
    } catch (error) {
      console.error('Update role error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to update role'
      };
    }
  }

  // Delete server role
  async deleteRole(serverId, roleId) {
    try {
      const response = await apiService.delete(`${this.endpoints.servers}/${serverId}/roles/${roleId}`);

      return { success: response.success, message: response.message || 'Role deleted' };
    } catch (error) {
      console.error('Delete role error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to delete role'
      };
    }
  }

  // Assign role to member
  async assignRoleToMember(serverId, memberId, roleId) {
    try {
      const response = await apiService.post(
        `${this.endpoints.servers}/${serverId}/members/${memberId}/roles`,
        { roleId }
      );

      if (response.success && response.data) {
        return { success: true, member: response.data.member };
      }

      return { success: false, error: 'Failed to assign role' };
    } catch (error) {
      console.error('Assign role error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to assign role'
      };
    }
  }

  // Remove role from member
  async removeRoleFromMember(serverId, memberId, roleId) {
    try {
      const response = await apiService.delete(
        `${this.endpoints.servers}/${serverId}/members/${memberId}/roles/${roleId}`
      );

      return { success: response.success, message: response.message || 'Role removed' };
    } catch (error) {
      console.error('Remove role error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to remove role'
      };
    }
  }

  // Update member nickname
  async updateMemberNickname(serverId, memberId, nickname) {
    try {
      const response = await apiService.patch(
        `${this.endpoints.members.replace('{serverId}', serverId)}/${memberId}/nickname`,
        { nickname }
      );

      if (response.success && response.data) {
        return { success: true, member: response.data.member };
      }

      return { success: false, error: 'Failed to update nickname' };
    } catch (error) {
      console.error('Update nickname error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to update nickname'
      };
    }
  }

  // Update channel
  async updateChannel(serverId, channelId, updateData) {
    try {
      return await channelService.updateChannel(channelId, updateData);
    } catch (error) {
      console.error('Update channel error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update channel'
      };
    }
  }

  // Delete channel
  async deleteChannel(serverId, channelId) {
    try {
      return await channelService.deleteChannel(channelId);
    } catch (error) {
      console.error('Delete channel error:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete channel'
      };
    }
  }

  // Get server audit logs
  async getServerAuditLogs(serverId, options = {}) {
    try {
      const params = new URLSearchParams({
        page: options.page || 1,
        limit: options.limit || 50,
        ...(options.actionType && { actionType: options.actionType }),
        ...(options.userId && { userId: options.userId })
      });

      const response = await apiService.get(
        `${this.endpoints.servers}/${serverId}/audit-logs?${params.toString()}`
      );

      if (response.success && response.data) {
        return {
          success: true,
          logs: response.data.logs || [],
          pagination: response.data.pagination || {}
        };
      }

      return { success: false, error: 'Failed to fetch audit logs' };
    } catch (error) {
      console.error('Get audit logs error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch audit logs'
      };
    }
  }

  // Get server emojis
  async getServerEmojis(serverId) {
    try {
      const response = await apiService.get(`${this.endpoints.servers}/${serverId}/emojis`);

      if (response.success && response.data) {
        return { success: true, emojis: response.data.emojis || [] };
      }

      return { success: false, error: 'Failed to fetch emojis' };
    } catch (error) {
      console.error('Get server emojis error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch emojis'
      };
    }
  }

  // Create server emoji
  async createEmoji(serverId, emojiData) {
    try {
      const formData = new FormData();
      formData.append('name', emojiData.name);
      if (emojiData.image) {
        formData.append('image', emojiData.image);
      }

      const response = await apiService.post(
        `${this.endpoints.servers}/${serverId}/emojis`,
        formData
      );

      if (response.success && response.data) {
        return { success: true, emoji: response.data.emoji };
      }

      return { success: false, error: 'Failed to create emoji' };
    } catch (error) {
      console.error('Create emoji error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to create emoji'
      };
    }
  }

  // Delete server emoji
  async deleteEmoji(serverId, emojiId) {
    try {
      const response = await apiService.delete(
        `${this.endpoints.servers}/${serverId}/emojis/${emojiId}`
      );

      return { success: response.success, message: response.message || 'Emoji deleted' };
    } catch (error) {
      console.error('Delete emoji error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to delete emoji'
      };
    }
  }

  // Get server stickers
  async getServerStickers(serverId) {
    try {
      const response = await apiService.get(`${this.endpoints.servers}/${serverId}/stickers`);

      if (response.success && response.data) {
        return { success: true, stickers: response.data.stickers || [] };
      }

      return { success: false, error: 'Failed to fetch stickers' };
    } catch (error) {
      console.error('Get server stickers error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch stickers'
      };
    }
  }

  // Create server sticker
  async createSticker(serverId, stickerData) {
    try {
      const formData = new FormData();
      formData.append('name', stickerData.name);
      formData.append('description', stickerData.description || '');
      formData.append('tags', stickerData.tags || '');
      if (stickerData.file) {
        formData.append('file', stickerData.file);
      }

      const response = await apiService.post(
        `${this.endpoints.servers}/${serverId}/stickers`,
        formData
      );

      if (response.success && response.data) {
        return { success: true, sticker: response.data.sticker };
      }

      return { success: false, error: 'Failed to create sticker' };
    } catch (error) {
      console.error('Create sticker error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to create sticker'
      };
    }
  }

  // Delete server sticker
  async deleteSticker(serverId, stickerId) {
    try {
      const response = await apiService.delete(
        `${this.endpoints.servers}/${serverId}/stickers/${stickerId}`
      );

      return { success: response.success, message: response.message || 'Sticker deleted' };
    } catch (error) {
      console.error('Delete sticker error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to delete sticker'
      };
    }
  }

  // Get server templates
  async getServerTemplates() {
    try {
      const response = await apiService.get('/server-discovery/templates');

      if (response.success && response.data) {
        return { success: true, templates: response.data || [] };
      }

      return { success: false, error: 'Failed to fetch templates' };
    } catch (error) {
      console.error('Get server templates error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch templates'
      };
    }
  }

  // Create server from template
  async createServerFromTemplate(templateData) {
    try {
      const response = await apiService.post('/server-discovery/create-from-template', {
        templateId: templateData.templateId,
        name: templateData.name,
        description: templateData.description || '',
        icon: templateData.icon || null,
        banner: templateData.banner || null,
        isPublic: templateData.isPublic !== false
      });

      if (response.success && response.data) {
        return { success: true, server: response.data };
      }

      return { success: false, error: 'Failed to create server from template' };
    } catch (error) {
      console.error('Create server from template error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to create server from template'
      };
    }
  }

  // Get server webhooks
  async getServerWebhooks(serverId) {
    try {
      const response = await apiService.get(`${this.endpoints.servers}/${serverId}/webhooks`);

      if (response.success && response.data) {
        return { success: true, webhooks: response.data.webhooks || [] };
      }

      return { success: false, error: 'Failed to fetch webhooks' };
    } catch (error) {
      console.error('Get server webhooks error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch webhooks'
      };
    }
  }

  // Create server webhook
  async createWebhook(serverId, webhookData) {
    try {
      const response = await apiService.post(`${this.endpoints.servers}/${serverId}/webhooks`, {
        name: webhookData.name,
        channelId: webhookData.channelId,
        avatar: webhookData.avatar || null
      });

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

  // Delete server webhook
  async deleteWebhook(serverId, webhookId) {
    try {
      const response = await apiService.delete(
        `${this.endpoints.servers}/${serverId}/webhooks/${webhookId}`
      );

      return { success: response.success, message: response.message || 'Webhook deleted' };
    } catch (error) {
      console.error('Delete webhook error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to delete webhook'
      };
    }
  }

  // Get server settings
  async getServerSettings(serverId) {
    try {
      const response = await apiService.get(`${this.endpoints.servers}/${serverId}/settings`);

      if (response.success && response.data) {
        return { success: true, settings: response.data.settings };
      }

      return { success: false, error: 'Failed to fetch settings' };
    } catch (error) {
      console.error('Get server settings error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch settings'
      };
    }
  }

  // Update server settings
  async updateServerSettings(serverId, settings) {
    try {
      const response = await apiService.patch(
        `${this.endpoints.servers}/${serverId}/settings`,
        settings
      );

      if (response.success && response.data) {
        return { success: true, settings: response.data.settings };
      }

      return { success: false, error: 'Failed to update settings' };
    } catch (error) {
      console.error('Update server settings error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to update settings'
      };
    }
  }
}

// Create and export singleton instance
const serverService = new ServerService();

export default serverService;