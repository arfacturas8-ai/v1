/**
 * Tests for channelService
 */
import channelService from './channelService';
import apiService from './api';

jest.mock('./api');

describe('channelService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getChannels', () => {
    it('fetches channels for server', async () => {
      const mockChannels = [
        { id: 'ch-1', name: 'general', type: 'GUILD_TEXT' },
        { id: 'ch-2', name: 'voice', type: 'GUILD_VOICE' }
      ];
      apiService.get.mockResolvedValue({
        success: true,
        data: mockChannels
      });

      const result = await channelService.getChannels('server-1');

      expect(apiService.get).toHaveBeenCalledWith('/channels?serverId=server-1');
      expect(result.success).toBe(true);
      expect(result.channels).toEqual(mockChannels);
    });

    it('handles fetch error', async () => {
      apiService.get.mockRejectedValue(new Error('Network error'));

      const result = await channelService.getChannels('server-1');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getChannel', () => {
    it('fetches single channel', async () => {
      const mockChannel = { id: 'ch-1', name: 'general' };
      apiService.get.mockResolvedValue({
        success: true,
        data: mockChannel
      });

      const result = await channelService.getChannel('ch-1');

      expect(apiService.get).toHaveBeenCalledWith('/channels/ch-1');
      expect(result.success).toBe(true);
      expect(result.channel).toEqual(mockChannel);
    });
  });

  describe('createChannel', () => {
    it('creates text channel', async () => {
      const channelData = {
        serverId: 'server-1',
        name: 'new-channel',
        type: 'GUILD_TEXT'
      };
      const mockResponse = {
        success: true,
        data: { ...channelData, id: 'ch-3' }
      };
      apiService.post.mockResolvedValue(mockResponse);

      const result = await channelService.createChannel(channelData);

      expect(apiService.post).toHaveBeenCalledWith('/channels', expect.objectContaining({
        serverId: 'server-1',
        name: 'new-channel',
        type: 'GUILD_TEXT'
      }));
      expect(result.success).toBe(true);
    });

    it('creates voice channel with options', async () => {
      const channelData = {
        serverId: 'server-1',
        name: 'voice-chat',
        type: 'GUILD_VOICE',
        userLimit: 10,
        bitrate: 64000
      };
      apiService.post.mockResolvedValue({
        success: true,
        data: channelData
      });

      await channelService.createChannel(channelData);

      expect(apiService.post).toHaveBeenCalledWith('/channels', expect.objectContaining({
        userLimit: 10,
        bitrate: 64000
      }));
    });
  });

  describe('updateChannel', () => {
    it('updates channel properties', async () => {
      const updates = { name: 'updated-name', topic: 'New topic' };
      apiService.patch.mockResolvedValue({
        success: true,
        data: { id: 'ch-1', ...updates }
      });

      const result = await channelService.updateChannel('ch-1', updates);

      expect(apiService.patch).toHaveBeenCalledWith('/channels/ch-1', updates);
      expect(result.success).toBe(true);
    });
  });

  describe('deleteChannel', () => {
    it('deletes channel', async () => {
      apiService.delete.mockResolvedValue({
        success: true,
        message: 'Channel deleted'
      });

      const result = await channelService.deleteChannel('ch-1');

      expect(apiService.delete).toHaveBeenCalledWith('/channels/ch-1');
      expect(result.success).toBe(true);
    });
  });

  describe('getMessages', () => {
    it('fetches channel messages with default options', async () => {
      const mockMessages = [
        { id: 'msg-1', content: 'Hello' },
        { id: 'msg-2', content: 'World' }
      ];
      apiService.get.mockResolvedValue({
        success: true,
        data: { messages: mockMessages, pagination: {} }
      });

      const result = await channelService.getMessages('ch-1');

      expect(apiService.get).toHaveBeenCalledWith(expect.stringContaining('/channels/ch-1/messages'));
      expect(result.success).toBe(true);
      expect(result.messages).toEqual(mockMessages);
    });

    it('supports pagination options', async () => {
      apiService.get.mockResolvedValue({
        success: true,
        data: { messages: [], pagination: {} }
      });

      await channelService.getMessages('ch-1', {
        limit: 100,
        before: 'msg-10',
        after: 'msg-1'
      });

      const callArg = apiService.get.mock.calls[0][0];
      expect(callArg).toContain('limit=100');
      expect(callArg).toContain('before=msg-10');
      expect(callArg).toContain('after=msg-1');
    });
  });

  describe('sendMessage', () => {
    it('sends text message', async () => {
      apiService.post.mockResolvedValue({
        success: true,
        data: { message: { id: 'msg-1', content: 'Hello' } }
      });

      const result = await channelService.sendMessage('ch-1', 'Hello');

      expect(apiService.post).toHaveBeenCalledWith(
        '/channels/ch-1/messages',
        expect.objectContaining({ content: 'Hello' })
      );
      expect(result.success).toBe(true);
    });

    it('sends message with files', async () => {
      const mockFile = new File(['content'], 'test.txt');
      apiService.post.mockResolvedValue({
        success: true,
        data: { message: { id: 'msg-1' } }
      });

      await channelService.sendMessage('ch-1', 'Check this', {
        files: [mockFile]
      });

      expect(apiService.post).toHaveBeenCalled();
      const formData = apiService.post.mock.calls[0][1];
      expect(formData).toBeInstanceOf(FormData);
    });

    it('supports reply option', async () => {
      apiService.post.mockResolvedValue({
        success: true,
        data: { message: {} }
      });

      await channelService.sendMessage('ch-1', 'Reply', {
        replyTo: 'msg-1'
      });

      expect(apiService.post).toHaveBeenCalledWith(
        '/channels/ch-1/messages',
        expect.objectContaining({ replyTo: 'msg-1' })
      );
    });
  });

  describe('updateMessage', () => {
    it('updates message content', async () => {
      apiService.put.mockResolvedValue({
        success: true,
        data: { message: { id: 'msg-1', content: 'Updated' } }
      });

      const result = await channelService.updateMessage('ch-1', 'msg-1', 'Updated');

      expect(apiService.put).toHaveBeenCalledWith(
        '/channels/ch-1/messages/msg-1',
        { content: 'Updated' }
      );
      expect(result.success).toBe(true);
    });
  });

  describe('deleteMessage', () => {
    it('deletes message', async () => {
      apiService.delete.mockResolvedValue({
        success: true,
        message: 'Message deleted'
      });

      const result = await channelService.deleteMessage('ch-1', 'msg-1');

      expect(apiService.delete).toHaveBeenCalledWith('/channels/ch-1/messages/msg-1');
      expect(result.success).toBe(true);
    });
  });

  describe('addReaction', () => {
    it('adds emoji reaction', async () => {
      apiService.post.mockResolvedValue({
        success: true,
        data: { reaction: { emoji: '👍' } }
      });

      const result = await channelService.addReaction('ch-1', 'msg-1', '👍');

      expect(apiService.post).toHaveBeenCalledWith(
        '/channels/ch-1/messages/msg-1/reactions',
        { emoji: '👍' }
      );
      expect(result.success).toBe(true);
    });
  });

  describe('removeReaction', () => {
    it('removes emoji reaction', async () => {
      apiService.delete.mockResolvedValue({
        success: true
      });

      const result = await channelService.removeReaction('ch-1', 'msg-1', '👍');

      expect(apiService.delete).toHaveBeenCalledWith(
        '/channels/ch-1/messages/msg-1/reactions/👍'
      );
      expect(result.success).toBe(true);
    });
  });

  describe('pinMessage', () => {
    it('pins message', async () => {
      apiService.post.mockResolvedValue({
        success: true
      });

      const result = await channelService.pinMessage('ch-1', 'msg-1');

      expect(apiService.post).toHaveBeenCalledWith(
        '/channels/ch-1/messages/msg-1/pin'
      );
      expect(result.success).toBe(true);
    });
  });

  describe('unpinMessage', () => {
    it('unpins message', async () => {
      apiService.delete.mockResolvedValue({
        success: true
      });

      const result = await channelService.unpinMessage('ch-1', 'msg-1');

      expect(apiService.delete).toHaveBeenCalledWith(
        '/channels/ch-1/messages/msg-1/pin'
      );
      expect(result.success).toBe(true);
    });
  });

  describe('getPinnedMessages', () => {
    it('fetches pinned messages', async () => {
      const mockMessages = [
        { id: 'msg-1', content: 'Pinned 1', isPinned: true },
        { id: 'msg-2', content: 'Pinned 2', isPinned: true }
      ];
      apiService.get.mockResolvedValue({
        success: true,
        data: { messages: mockMessages }
      });

      const result = await channelService.getPinnedMessages('ch-1');

      expect(apiService.get).toHaveBeenCalledWith('/channels/ch-1/pinned');
      expect(result.messages).toEqual(mockMessages);
    });
  });

  describe('searchMessages', () => {
    it('searches messages with query', async () => {
      apiService.get.mockResolvedValue({
        success: true,
        data: { messages: [], total: 0 }
      });

      const result = await channelService.searchMessages('ch-1', 'test query');

      const callArg = apiService.get.mock.calls[0][0];
      expect(callArg).toContain('search');
      expect(callArg).toContain('q=test+query');
      expect(result.success).toBe(true);
    });

    it('supports search filters', async () => {
      apiService.get.mockResolvedValue({
        success: true,
        data: { messages: [], total: 0 }
      });

      await channelService.searchMessages('ch-1', 'test', {
        author: 'user-1',
        mentions: 'user-2',
        has: 'link'
      });

      const callArg = apiService.get.mock.calls[0][0];
      expect(callArg).toContain('author=user-1');
      expect(callArg).toContain('mentions=user-2');
      expect(callArg).toContain('has=link');
    });
  });

  describe('getChannelPermissions', () => {
    it('fetches user permissions', async () => {
      const mockPermissions = ['READ_MESSAGES', 'SEND_MESSAGES'];
      apiService.get.mockResolvedValue({
        success: true,
        data: { permissions: mockPermissions }
      });

      const result = await channelService.getChannelPermissions('ch-1');

      expect(result.permissions).toEqual(mockPermissions);
    });
  });

  describe('updateChannelPermissions', () => {
    it('updates role permissions', async () => {
      const permissions = ['READ_MESSAGES', 'SEND_MESSAGES'];
      apiService.put.mockResolvedValue({
        success: true,
        data: { permissions }
      });

      const result = await channelService.updateChannelPermissions('ch-1', 'role-1', permissions);

      expect(apiService.put).toHaveBeenCalledWith(
        '/channels/ch-1/permissions/role-1',
        { permissions }
      );
      expect(result.success).toBe(true);
    });
  });

  describe('getChannelMembers', () => {
    it('fetches channel members', async () => {
      const mockMembers = [
        { id: 'user-1', username: 'alice' },
        { id: 'user-2', username: 'bob' }
      ];
      apiService.get.mockResolvedValue({
        success: true,
        data: { members: mockMembers }
      });

      const result = await channelService.getChannelMembers('ch-1');

      expect(result.members).toEqual(mockMembers);
    });
  });

  describe('createThread', () => {
    it('creates thread from message', async () => {
      apiService.post.mockResolvedValue({
        success: true,
        data: { thread: { id: 'thread-1', name: 'Discussion' } }
      });

      const result = await channelService.createThread('ch-1', 'msg-1', 'Discussion');

      expect(apiService.post).toHaveBeenCalledWith(
        '/channels/ch-1/messages/msg-1/threads',
        { name: 'Discussion' }
      );
      expect(result.success).toBe(true);
    });
  });

  describe('getWebhooks', () => {
    it('fetches channel webhooks', async () => {
      const mockWebhooks = [
        { id: 'hook-1', name: 'Bot Webhook' }
      ];
      apiService.get.mockResolvedValue({
        success: true,
        data: { webhooks: mockWebhooks }
      });

      const result = await channelService.getWebhooks('ch-1');

      expect(result.webhooks).toEqual(mockWebhooks);
    });
  });

  describe('createWebhook', () => {
    it('creates webhook', async () => {
      const webhookData = { name: 'My Webhook', avatar: 'url' };
      apiService.post.mockResolvedValue({
        success: true,
        data: { webhook: { ...webhookData, id: 'hook-1' } }
      });

      const result = await channelService.createWebhook('ch-1', webhookData);

      expect(apiService.post).toHaveBeenCalledWith(
        '/channels/ch-1/webhooks',
        webhookData
      );
      expect(result.success).toBe(true);
    });
  });

  describe('markAsRead', () => {
    it('marks channel as read', async () => {
      apiService.post.mockResolvedValue({
        success: true
      });

      const result = await channelService.markAsRead('ch-1');

      expect(apiService.post).toHaveBeenCalledWith('/channels/ch-1/read');
      expect(result.success).toBe(true);
    });
  });

  describe('getTypingUsers', () => {
    it('fetches typing users', async () => {
      const mockUsers = [
        { id: 'user-1', username: 'alice' }
      ];
      apiService.get.mockResolvedValue({
        success: true,
        data: { users: mockUsers }
      });

      const result = await channelService.getTypingUsers('ch-1');

      expect(result.users).toEqual(mockUsers);
    });
  });

  describe('uploadFile', () => {
    it('uploads file to channel', async () => {
      const mockFile = new File(['content'], 'test.txt');
      apiService.post.mockResolvedValue({
        success: true,
        data: { file: { id: 'file-1', url: 'https://...' } }
      });

      const result = await channelService.uploadFile('ch-1', mockFile, {
        description: 'Test file'
      });

      expect(apiService.post).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe('getMessageHistory', () => {
    it('fetches message history', async () => {
      apiService.get.mockResolvedValue({
        success: true,
        data: { messages: [], hasMore: false }
      });

      const result = await channelService.getMessageHistory('ch-1');

      expect(result.success).toBe(true);
      expect(result.hasMore).toBe(false);
    });

    it('supports pagination with lastMessageId', async () => {
      apiService.get.mockResolvedValue({
        success: true,
        data: { messages: [], hasMore: true }
      });

      await channelService.getMessageHistory('ch-1', 'msg-100', 25);

      const callArg = apiService.get.mock.calls[0][0];
      expect(callArg).toContain('before=msg-100');
      expect(callArg).toContain('limit=25');
    });
  });

  describe('sendTypingIndicator', () => {
    it('sends typing indicator', async () => {
      apiService.post.mockResolvedValue({
        success: true
      });

      const result = await channelService.sendTypingIndicator('ch-1');

      expect(apiService.post).toHaveBeenCalledWith('/channels/ch-1/typing');
      expect(result.success).toBe(true);
    });
  });

  describe('deleteChannelPermission', () => {
    it('deletes permission overwrite', async () => {
      apiService.delete.mockResolvedValue({
        success: true
      });

      const result = await channelService.deleteChannelPermission('ch-1', 'overwrite-1');

      expect(apiService.delete).toHaveBeenCalledWith(
        '/channels/ch-1/permissions/overwrite-1'
      );
      expect(result.success).toBe(true);
    });
  });
});
