/**
 * Tests for serverService
 */
import serverService from './serverService';
import apiService from './api';
import channelService from './channelService';

jest.mock('./api');
jest.mock('./channelService');

describe('serverService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getServers', () => {
    it('fetches all servers successfully', async () => {
      const mockServers = [
        { id: '1', name: 'Server 1' },
        { id: '2', name: 'Server 2' }
      ];
      apiService.get.mockResolvedValue({
        success: true,
        data: { servers: mockServers }
      });

      const result = await serverService.getServers();

      expect(apiService.get).toHaveBeenCalledWith('/servers');
      expect(result.success).toBe(true);
      expect(result.servers).toEqual(mockServers);
    });

    it('handles error when fetching servers', async () => {
      apiService.get.mockRejectedValue(new Error('Network error'));

      const result = await serverService.getServers();

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('handles unsuccessful response', async () => {
      apiService.get.mockResolvedValue({ success: false });

      const result = await serverService.getServers();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch servers');
    });
  });

  describe('getServer', () => {
    it('fetches server by ID', async () => {
      const mockServer = { id: 'server-1', name: 'Test Server' };
      apiService.get.mockResolvedValue({
        success: true,
        data: { server: mockServer }
      });

      const result = await serverService.getServer('server-1');

      expect(apiService.get).toHaveBeenCalledWith('/servers/server-1');
      expect(result.success).toBe(true);
      expect(result.server).toEqual(mockServer);
    });

    it('handles server not found', async () => {
      apiService.get.mockRejectedValue(new Error('Not found'));

      const result = await serverService.getServer('invalid-id');

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('createServer', () => {
    it('creates server with basic data', async () => {
      const serverData = {
        name: 'New Server',
        description: 'Test description',
        isPublic: true
      };
      const mockServer = { id: '1', ...serverData };
      apiService.post.mockResolvedValue({
        success: true,
        data: { server: mockServer }
      });

      const result = await serverService.createServer(serverData);

      expect(apiService.post).toHaveBeenCalled();
      const formData = apiService.post.mock.calls[0][1];
      expect(formData).toBeInstanceOf(FormData);
      expect(result.success).toBe(true);
      expect(result.server).toEqual(mockServer);
    });

    it('creates server with icon and banner', async () => {
      const mockIcon = new File(['icon'], 'icon.png', { type: 'image/png' });
      const mockBanner = new File(['banner'], 'banner.png', { type: 'image/png' });
      const serverData = {
        name: 'Server with Images',
        icon: mockIcon,
        banner: mockBanner
      };
      apiService.post.mockResolvedValue({
        success: true,
        data: { server: { id: '1' } }
      });

      await serverService.createServer(serverData);

      const formData = apiService.post.mock.calls[0][1];
      expect(formData.get('icon')).toBe(mockIcon);
      expect(formData.get('banner')).toBe(mockBanner);
    });

    it('creates server with categories', async () => {
      const serverData = {
        name: 'Server with Categories',
        categories: ['general', 'tech']
      };
      apiService.post.mockResolvedValue({
        success: true,
        data: { server: { id: '1' } }
      });

      await serverService.createServer(serverData);

      const formData = apiService.post.mock.calls[0][1];
      expect(JSON.parse(formData.get('categories'))).toEqual(['general', 'tech']);
    });

    it('handles creation error', async () => {
      apiService.post.mockRejectedValue(new Error('Creation failed'));

      const result = await serverService.createServer({ name: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('updateServer', () => {
    it('updates server data', async () => {
      const updateData = { name: 'Updated Name', description: 'Updated desc' };
      apiService.put.mockResolvedValue({
        success: true,
        data: { server: { id: '1', ...updateData } }
      });

      const result = await serverService.updateServer('server-1', updateData);

      expect(apiService.put).toHaveBeenCalledWith('/servers/server-1', expect.any(FormData));
      expect(result.success).toBe(true);
    });

    it('updates server with files', async () => {
      const mockIcon = new File(['icon'], 'icon.png');
      const updateData = { icon: mockIcon };
      apiService.put.mockResolvedValue({
        success: true,
        data: { server: { id: '1' } }
      });

      await serverService.updateServer('server-1', updateData);

      const formData = apiService.put.mock.calls[0][1];
      expect(formData.get('icon')).toBe(mockIcon);
    });

    it('handles update error', async () => {
      apiService.put.mockRejectedValue(new Error('Update failed'));

      const result = await serverService.updateServer('server-1', { name: 'New' });

      expect(result.success).toBe(false);
    });
  });

  describe('deleteServer', () => {
    it('deletes server successfully', async () => {
      apiService.delete.mockResolvedValue({ success: true, message: 'Deleted' });

      const result = await serverService.deleteServer('server-1');

      expect(apiService.delete).toHaveBeenCalledWith('/servers/server-1');
      expect(result.success).toBe(true);
    });

    it('handles deletion error', async () => {
      apiService.delete.mockRejectedValue(new Error('Cannot delete'));

      const result = await serverService.deleteServer('server-1');

      expect(result.success).toBe(false);
    });
  });

  describe('joinServer', () => {
    it('joins server without invite code', async () => {
      const mockData = {
        server: { id: '1', name: 'Server' },
        member: { id: 'user-1' }
      };
      apiService.post.mockResolvedValue({
        success: true,
        data: mockData
      });

      const result = await serverService.joinServer('server-1');

      expect(apiService.post).toHaveBeenCalledWith('/servers/server-1/join', { inviteCode: null });
      expect(result.success).toBe(true);
      expect(result.server).toEqual(mockData.server);
    });

    it('joins server with invite code', async () => {
      apiService.post.mockResolvedValue({
        success: true,
        data: { server: {}, member: {} }
      });

      await serverService.joinServer('server-1', 'INVITE123');

      expect(apiService.post).toHaveBeenCalledWith('/servers/server-1/join', {
        inviteCode: 'INVITE123'
      });
    });

    it('handles join error', async () => {
      apiService.post.mockRejectedValue(new Error('Cannot join'));

      const result = await serverService.joinServer('server-1');

      expect(result.success).toBe(false);
    });
  });

  describe('leaveServer', () => {
    it('leaves server successfully', async () => {
      apiService.post.mockResolvedValue({ success: true, message: 'Left' });

      const result = await serverService.leaveServer('server-1');

      expect(apiService.post).toHaveBeenCalledWith('/servers/server-1/leave');
      expect(result.success).toBe(true);
    });

    it('handles leave error', async () => {
      apiService.post.mockRejectedValue(new Error('Cannot leave'));

      const result = await serverService.leaveServer('server-1');

      expect(result.success).toBe(false);
    });
  });

  describe('getServerMembers', () => {
    it('fetches server members with pagination', async () => {
      const mockMembers = [
        { id: 'user-1', username: 'user1' },
        { id: 'user-2', username: 'user2' }
      ];
      apiService.get.mockResolvedValue({
        success: true,
        data: {
          members: mockMembers,
          pagination: { page: 1, total: 2 }
        }
      });

      const result = await serverService.getServerMembers('server-1', 1, 50);

      expect(apiService.get).toHaveBeenCalledWith(expect.stringContaining('/servers/server-1/members'));
      expect(apiService.get).toHaveBeenCalledWith(expect.stringContaining('page=1'));
      expect(apiService.get).toHaveBeenCalledWith(expect.stringContaining('limit=50'));
      expect(result.success).toBe(true);
      expect(result.members).toEqual(mockMembers);
    });

    it('handles error when fetching members', async () => {
      apiService.get.mockRejectedValue(new Error('Fetch failed'));

      const result = await serverService.getServerMembers('server-1');

      expect(result.success).toBe(false);
    });
  });

  describe('updateMemberRole', () => {
    it('updates member role successfully', async () => {
      const mockMember = { id: 'user-1', role: 'moderator' };
      apiService.patch.mockResolvedValue({
        success: true,
        data: { member: mockMember }
      });

      const result = await serverService.updateMemberRole('server-1', 'user-1', 'moderator');

      expect(apiService.patch).toHaveBeenCalledWith(
        expect.stringContaining('/servers/server-1/members/user-1'),
        { role: 'moderator' }
      );
      expect(result.success).toBe(true);
      expect(result.member).toEqual(mockMember);
    });

    it('handles role update error', async () => {
      apiService.patch.mockRejectedValue(new Error('Update failed'));

      const result = await serverService.updateMemberRole('server-1', 'user-1', 'admin');

      expect(result.success).toBe(false);
    });
  });

  describe('kickMember', () => {
    it('kicks member without reason', async () => {
      apiService.delete.mockResolvedValue({ success: true, message: 'Kicked' });

      const result = await serverService.kickMember('server-1', 'user-1');

      expect(apiService.delete).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('kicks member with reason', async () => {
      apiService.delete.mockResolvedValue({ success: true });

      await serverService.kickMember('server-1', 'user-1', 'Spam');

      const callArgs = apiService.delete.mock.calls[0];
      expect(callArgs[1].body).toContain('Spam');
    });
  });

  describe('banMember', () => {
    it('bans member with reason and duration', async () => {
      apiService.post.mockResolvedValue({ success: true, message: 'Banned' });

      const result = await serverService.banMember('server-1', 'user-1', 'Harassment', '7d');

      expect(apiService.post).toHaveBeenCalledWith('/servers/server-1/ban', {
        memberId: 'user-1',
        reason: 'Harassment',
        duration: '7d'
      });
      expect(result.success).toBe(true);
    });

    it('bans member permanently', async () => {
      apiService.post.mockResolvedValue({ success: true });

      await serverService.banMember('server-1', 'user-1', 'Severe violation', null);

      expect(apiService.post).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
        duration: null
      }));
    });
  });

  describe('unbanMember', () => {
    it('unbans member successfully', async () => {
      apiService.delete.mockResolvedValue({ success: true, message: 'Unbanned' });

      const result = await serverService.unbanMember('server-1', 'user-1');

      expect(apiService.delete).toHaveBeenCalledWith('/moderation/servers/server-1/ban/user-1');
      expect(result.success).toBe(true);
    });
  });

  describe('getServerBans', () => {
    it('fetches server bans', async () => {
      const mockBans = [
        { userId: 'user-1', reason: 'Spam' },
        { userId: 'user-2', reason: 'Harassment' }
      ];
      apiService.get.mockResolvedValue({
        success: true,
        data: { bans: mockBans }
      });

      const result = await serverService.getServerBans('server-1');

      expect(apiService.get).toHaveBeenCalledWith('/moderation/servers/server-1/bans');
      expect(result.success).toBe(true);
      expect(result.bans).toEqual(mockBans);
    });
  });

  describe('Channel Management', () => {
    it('gets server channels via channelService', async () => {
      const mockChannels = [{ id: 'ch-1', name: 'general' }];
      channelService.getChannels.mockResolvedValue({ success: true, channels: mockChannels });

      const result = await serverService.getServerChannels('server-1');

      expect(channelService.getChannels).toHaveBeenCalledWith('server-1');
      expect(result.success).toBe(true);
    });

    it('creates channel via channelService', async () => {
      const channelData = { name: 'new-channel', type: 'GUILD_TEXT' };
      channelService.createChannel.mockResolvedValue({ success: true, channel: {} });

      await serverService.createChannel('server-1', channelData);

      expect(channelService.createChannel).toHaveBeenCalledWith(
        expect.objectContaining({
          serverId: 'server-1',
          name: 'new-channel',
          type: 'GUILD_TEXT'
        })
      );
    });

    it('updates channel via channelService', async () => {
      const updateData = { name: 'updated-channel' };
      channelService.updateChannel.mockResolvedValue({ success: true });

      await serverService.updateChannel('server-1', 'ch-1', updateData);

      expect(channelService.updateChannel).toHaveBeenCalledWith('ch-1', updateData);
    });

    it('deletes channel via channelService', async () => {
      channelService.deleteChannel.mockResolvedValue({ success: true });

      await serverService.deleteChannel('server-1', 'ch-1');

      expect(channelService.deleteChannel).toHaveBeenCalledWith('ch-1');
    });
  });

  describe('Invite Management', () => {
    it('creates invite with options', async () => {
      const inviteData = {
        expiresIn: '24h',
        maxUses: 10,
        temporary: true
      };
      apiService.post.mockResolvedValue({
        success: true,
        data: { invite: { code: 'ABC123' } }
      });

      const result = await serverService.createInvite('server-1', inviteData);

      expect(apiService.post).toHaveBeenCalledWith(
        '/servers/server-1/invites',
        expect.objectContaining(inviteData)
      );
      expect(result.success).toBe(true);
    });

    it('fetches server invites', async () => {
      const mockInvites = [{ code: 'ABC', uses: 5 }];
      apiService.get.mockResolvedValue({
        success: true,
        data: { invites: mockInvites }
      });

      const result = await serverService.getInvites('server-1');

      expect(result.success).toBe(true);
      expect(result.invites).toEqual(mockInvites);
    });

    it('deletes invite', async () => {
      apiService.delete.mockResolvedValue({ success: true });

      const result = await serverService.deleteInvite('server-1', 'invite-1');

      expect(apiService.delete).toHaveBeenCalledWith('/servers/server-1/invites/invite-1');
      expect(result.success).toBe(true);
    });

    it('validates invite code', async () => {
      apiService.get.mockResolvedValue({
        success: true,
        data: { invite: { code: 'ABC123', server: {} } }
      });

      const result = await serverService.validateInvite('ABC123');

      expect(apiService.get).toHaveBeenCalledWith('/invites/ABC123/validate', { auth: false });
      expect(result.success).toBe(true);
    });

    it('joins server by invite code', async () => {
      apiService.post.mockResolvedValue({
        success: true,
        data: { server: {}, member: {} }
      });

      const result = await serverService.joinByInvite('ABC123');

      expect(apiService.post).toHaveBeenCalledWith('/invites/ABC123/join');
      expect(result.success).toBe(true);
    });
  });

  describe('Role Management', () => {
    it('gets server roles', async () => {
      const mockRoles = [{ id: 'role-1', name: 'Admin' }];
      apiService.get.mockResolvedValue({
        success: true,
        data: { roles: mockRoles }
      });

      const result = await serverService.getServerRoles('server-1');

      expect(result.success).toBe(true);
      expect(result.roles).toEqual(mockRoles);
    });

    it('creates role with options', async () => {
      const roleData = {
        name: 'Moderator',
        color: '#FF0000',
        permissions: '12345',
        mentionable: true,
        hoisted: true
      };
      apiService.post.mockResolvedValue({
        success: true,
        data: { role: roleData }
      });

      const result = await serverService.createRole('server-1', roleData);

      expect(apiService.post).toHaveBeenCalledWith(
        '/servers/server-1/roles',
        expect.objectContaining(roleData)
      );
      expect(result.success).toBe(true);
    });

    it('updates role', async () => {
      const updateData = { name: 'Updated Role', color: '#00FF00' };
      apiService.patch.mockResolvedValue({
        success: true,
        data: { role: updateData }
      });

      const result = await serverService.updateRole('server-1', 'role-1', updateData);

      expect(apiService.patch).toHaveBeenCalledWith('/servers/server-1/roles/role-1', updateData);
      expect(result.success).toBe(true);
    });

    it('deletes role', async () => {
      apiService.delete.mockResolvedValue({ success: true });

      const result = await serverService.deleteRole('server-1', 'role-1');

      expect(result.success).toBe(true);
    });

    it('assigns role to member', async () => {
      apiService.post.mockResolvedValue({
        success: true,
        data: { member: { id: 'user-1', roles: ['role-1'] } }
      });

      const result = await serverService.assignRoleToMember('server-1', 'user-1', 'role-1');

      expect(apiService.post).toHaveBeenCalledWith(
        '/servers/server-1/members/user-1/roles',
        { roleId: 'role-1' }
      );
      expect(result.success).toBe(true);
    });

    it('removes role from member', async () => {
      apiService.delete.mockResolvedValue({ success: true });

      const result = await serverService.removeRoleFromMember('server-1', 'user-1', 'role-1');

      expect(apiService.delete).toHaveBeenCalledWith(
        '/servers/server-1/members/user-1/roles/role-1'
      );
      expect(result.success).toBe(true);
    });
  });

  describe('updateMemberNickname', () => {
    it('updates member nickname', async () => {
      apiService.patch.mockResolvedValue({
        success: true,
        data: { member: { nickname: 'NewNick' } }
      });

      const result = await serverService.updateMemberNickname('server-1', 'user-1', 'NewNick');

      expect(apiService.patch).toHaveBeenCalledWith(
        expect.stringContaining('/servers/server-1/members/user-1/nickname'),
        { nickname: 'NewNick' }
      );
      expect(result.success).toBe(true);
    });
  });

  describe('Server Discovery', () => {
    it('searches public servers', async () => {
      const mockServers = [{ id: '1', name: 'Public Server' }];
      apiService.get.mockResolvedValue({
        success: true,
        data: { servers: mockServers }
      });

      const result = await serverService.searchPublicServers('gaming', { category: 'gaming' });

      expect(apiService.get).toHaveBeenCalledWith(expect.stringContaining('server-discovery'));
      expect(result.success).toBe(true);
      expect(result.servers).toEqual(mockServers);
    });

    it('gets server templates', async () => {
      const mockTemplates = [{ id: 'template-1', name: 'Gaming Template' }];
      apiService.get.mockResolvedValue({
        success: true,
        data: mockTemplates
      });

      const result = await serverService.getServerTemplates();

      expect(apiService.get).toHaveBeenCalledWith('/server-discovery/templates');
      expect(result.success).toBe(true);
      expect(result.templates).toEqual(mockTemplates);
    });

    it('creates server from template', async () => {
      const templateData = {
        templateId: 'template-1',
        name: 'My Gaming Server',
        description: 'My server',
        isPublic: true
      };
      apiService.post.mockResolvedValue({
        success: true,
        data: { id: 'new-server' }
      });

      const result = await serverService.createServerFromTemplate(templateData);

      expect(apiService.post).toHaveBeenCalledWith(
        '/server-discovery/create-from-template',
        expect.objectContaining(templateData)
      );
      expect(result.success).toBe(true);
    });
  });

  describe('Server Analytics', () => {
    it('gets server analytics with time range', async () => {
      const mockAnalytics = { members: 100, messages: 5000 };
      apiService.get.mockResolvedValue({
        success: true,
        data: { analytics: mockAnalytics }
      });

      const result = await serverService.getServerAnalytics('server-1', '30d');

      expect(apiService.get).toHaveBeenCalledWith(
        expect.stringContaining('/servers/server-1/analytics')
      );
      expect(apiService.get).toHaveBeenCalledWith(expect.stringContaining('timeRange=30d'));
      expect(result.success).toBe(true);
      expect(result.analytics).toEqual(mockAnalytics);
    });
  });

  describe('Server Audit Logs', () => {
    it('gets audit logs with options', async () => {
      const mockLogs = [{ action: 'MEMBER_KICK', user: 'user-1' }];
      apiService.get.mockResolvedValue({
        success: true,
        data: { logs: mockLogs, pagination: {} }
      });

      const result = await serverService.getServerAuditLogs('server-1', {
        page: 1,
        limit: 50,
        actionType: 'MEMBER_KICK',
        userId: 'user-1'
      });

      const callArg = apiService.get.mock.calls[0][0];
      expect(callArg).toContain('audit-logs');
      expect(callArg).toContain('page=1');
      expect(callArg).toContain('actionType=MEMBER_KICK');
      expect(result.success).toBe(true);
      expect(result.logs).toEqual(mockLogs);
    });
  });

  describe('Emoji Management', () => {
    it('gets server emojis', async () => {
      const mockEmojis = [{ id: 'emoji-1', name: 'smile' }];
      apiService.get.mockResolvedValue({
        success: true,
        data: { emojis: mockEmojis }
      });

      const result = await serverService.getServerEmojis('server-1');

      expect(result.success).toBe(true);
      expect(result.emojis).toEqual(mockEmojis);
    });

    it('creates emoji', async () => {
      const mockImage = new File(['emoji'], 'smile.png');
      const emojiData = { name: 'smile', image: mockImage };
      apiService.post.mockResolvedValue({
        success: true,
        data: { emoji: { id: '1', name: 'smile' } }
      });

      const result = await serverService.createEmoji('server-1', emojiData);

      const formData = apiService.post.mock.calls[0][1];
      expect(formData).toBeInstanceOf(FormData);
      expect(result.success).toBe(true);
    });

    it('deletes emoji', async () => {
      apiService.delete.mockResolvedValue({ success: true });

      const result = await serverService.deleteEmoji('server-1', 'emoji-1');

      expect(result.success).toBe(true);
    });
  });

  describe('Sticker Management', () => {
    it('gets server stickers', async () => {
      const mockStickers = [{ id: 'sticker-1', name: 'cool' }];
      apiService.get.mockResolvedValue({
        success: true,
        data: { stickers: mockStickers }
      });

      const result = await serverService.getServerStickers('server-1');

      expect(result.success).toBe(true);
      expect(result.stickers).toEqual(mockStickers);
    });

    it('creates sticker', async () => {
      const mockFile = new File(['sticker'], 'cool.png');
      const stickerData = {
        name: 'cool',
        description: 'Cool sticker',
        tags: 'fun,cool',
        file: mockFile
      };
      apiService.post.mockResolvedValue({
        success: true,
        data: { sticker: { id: '1' } }
      });

      const result = await serverService.createSticker('server-1', stickerData);

      const formData = apiService.post.mock.calls[0][1];
      expect(formData).toBeInstanceOf(FormData);
      expect(result.success).toBe(true);
    });

    it('deletes sticker', async () => {
      apiService.delete.mockResolvedValue({ success: true });

      const result = await serverService.deleteSticker('server-1', 'sticker-1');

      expect(result.success).toBe(true);
    });
  });

  describe('Webhook Management', () => {
    it('gets server webhooks', async () => {
      const mockWebhooks = [{ id: 'webhook-1', name: 'My Webhook' }];
      apiService.get.mockResolvedValue({
        success: true,
        data: { webhooks: mockWebhooks }
      });

      const result = await serverService.getServerWebhooks('server-1');

      expect(result.success).toBe(true);
      expect(result.webhooks).toEqual(mockWebhooks);
    });

    it('creates webhook', async () => {
      const webhookData = {
        name: 'GitHub Webhook',
        channelId: 'ch-1',
        avatar: 'https://avatar.url'
      };
      apiService.post.mockResolvedValue({
        success: true,
        data: { webhook: { id: '1' } }
      });

      const result = await serverService.createWebhook('server-1', webhookData);

      expect(apiService.post).toHaveBeenCalledWith(
        '/servers/server-1/webhooks',
        expect.objectContaining(webhookData)
      );
      expect(result.success).toBe(true);
    });

    it('deletes webhook', async () => {
      apiService.delete.mockResolvedValue({ success: true });

      const result = await serverService.deleteWebhook('server-1', 'webhook-1');

      expect(result.success).toBe(true);
    });
  });

  describe('Server Settings', () => {
    it('gets server settings', async () => {
      const mockSettings = { verification: 'low', afkTimeout: 300 };
      apiService.get.mockResolvedValue({
        success: true,
        data: { settings: mockSettings }
      });

      const result = await serverService.getServerSettings('server-1');

      expect(result.success).toBe(true);
      expect(result.settings).toEqual(mockSettings);
    });

    it('updates server settings', async () => {
      const newSettings = { verification: 'high', afkTimeout: 600 };
      apiService.patch.mockResolvedValue({
        success: true,
        data: { settings: newSettings }
      });

      const result = await serverService.updateServerSettings('server-1', newSettings);

      expect(apiService.patch).toHaveBeenCalledWith(
        '/servers/server-1/settings',
        newSettings
      );
      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('handles API errors with data.message', async () => {
      apiService.get.mockRejectedValue({
        message: 'Request failed',
        data: { message: 'Detailed error' }
      });

      const result = await serverService.getServer('server-1');

      expect(result.error).toContain('Detailed error');
    });

    it('handles channel service errors', async () => {
      channelService.getChannels.mockRejectedValue(new Error('Channel error'));

      const result = await serverService.getServerChannels('server-1');

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });
});
