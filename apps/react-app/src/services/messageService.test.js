/**
 * Tests for messageService
 */
import messageService from './messageService';
import api from './api';

jest.mock('./api');

describe('messageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMessages', () => {
    it('fetches messages for a channel', async () => {
      const mockMessages = [
        { id: '1', content: 'Message 1', channelId: 'channel-1' },
        { id: '2', content: 'Message 2', channelId: 'channel-1' }
      ];

      api.get.mockResolvedValue({
        success: true,
        data: { messages: mockMessages }
      });

      const result = await messageService.getMessages('channel-1');

      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('channelId=channel-1'));
      expect(result.success).toBe(true);
      expect(result.data.messages).toEqual(mockMessages);
    });

    it('fetches messages with pagination options', async () => {
      api.get.mockResolvedValue({
        success: true,
        data: { messages: [] }
      });

      await messageService.getMessages('channel-1', { page: 2, limit: 50 });

      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('page=2')
      );
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('limit=50')
      );
    });

    it('handles fetch errors', async () => {
      api.get.mockRejectedValue(new Error('Channel not found'));

      await expect(messageService.getMessages('invalid')).rejects.toThrow();
    });
  });

  describe('sendMessage', () => {
    it('sends a message to a channel', async () => {
      const messageData = { content: 'Hello world' };

      api.post.mockResolvedValue({
        success: true,
        data: { id: '1', channelId: 'channel-1', content: 'Hello world' }
      });

      const result = await messageService.sendMessage('channel-1', messageData);

      expect(api.post).toHaveBeenCalledWith('/messages', {
        channelId: 'channel-1',
        ...messageData
      });
      expect(result.success).toBe(true);
    });

    it('sends message with attachments', async () => {
      const messageData = {
        content: 'Check this out',
        attachments: ['file1.jpg', 'file2.png']
      };

      api.post.mockResolvedValue({
        success: true,
        data: { id: '1', ...messageData }
      });

      await messageService.sendMessage('channel-1', messageData);

      expect(api.post).toHaveBeenCalledWith(
        '/messages',
        expect.objectContaining({ attachments: ['file1.jpg', 'file2.png'] })
      );
    });

    it('sends message as reply', async () => {
      const messageData = {
        content: 'Reply content',
        replyToId: 'msg-123'
      };

      api.post.mockResolvedValue({
        success: true,
        data: { id: '2', ...messageData }
      });

      await messageService.sendMessage('channel-1', messageData);

      expect(api.post).toHaveBeenCalledWith(
        '/messages',
        expect.objectContaining({ replyToId: 'msg-123' })
      );
    });
  });

  describe('getMessage', () => {
    it('fetches a single message', async () => {
      const mockMessage = { id: '1', content: 'Test message' };

      api.get.mockResolvedValue({
        success: true,
        data: mockMessage
      });

      const result = await messageService.getMessage('1');

      expect(api.get).toHaveBeenCalledWith('/messages/1');
      expect(result.data).toEqual(mockMessage);
    });
  });

  describe('editMessage', () => {
    it('edits a message', async () => {
      api.patch.mockResolvedValue({
        success: true,
        data: { id: '1', content: 'Updated content' }
      });

      const result = await messageService.editMessage('1', 'Updated content');

      expect(api.patch).toHaveBeenCalledWith('/messages/1', { content: 'Updated content' });
      expect(result.success).toBe(true);
    });

    it('handles unauthorized edits', async () => {
      api.patch.mockRejectedValue(new Error('Unauthorized'));

      await expect(
        messageService.editMessage('1', 'hack')
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('deleteMessage', () => {
    it('deletes a message', async () => {
      api.delete.mockResolvedValue({
        success: true,
        message: 'Message deleted'
      });

      const result = await messageService.deleteMessage('1');

      expect(api.delete).toHaveBeenCalledWith('/messages/1');
      expect(result.success).toBe(true);
    });
  });

  describe('addReaction', () => {
    it('adds a reaction to a message', async () => {
      api.post.mockResolvedValue({
        success: true,
        data: { emoji: '👍', count: 1 }
      });

      const result = await messageService.addReaction('msg-1', '👍');

      expect(api.post).toHaveBeenCalledWith('/messages/msg-1/reactions', { emoji: '👍' });
      expect(result.success).toBe(true);
    });
  });

  describe('removeReaction', () => {
    it('removes a reaction from a message', async () => {
      api.post.mockResolvedValue({
        success: true,
        data: { emoji: '👍', count: 0 }
      });

      await messageService.removeReaction('msg-1', '👍');

      expect(api.post).toHaveBeenCalledWith('/messages/msg-1/reactions', { emoji: '👍' });
    });
  });

  describe('getReactionDetails', () => {
    it('gets users who reacted with specific emoji', async () => {
      const mockUsers = [
        { id: '1', username: 'user1' },
        { id: '2', username: 'user2' }
      ];

      api.get.mockResolvedValue({
        success: true,
        data: { users: mockUsers }
      });

      const result = await messageService.getReactionDetails('msg-1', '👍');

      expect(api.get).toHaveBeenCalledWith('/messages/msg-1/reactions/👍');
      expect(result.data.users).toHaveLength(2);
    });

    it('includes pagination parameters', async () => {
      api.get.mockResolvedValue({
        success: true,
        data: { users: [] }
      });

      await messageService.getReactionDetails('msg-1', '❤️', { page: 2, limit: 10 });

      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('page=2')
      );
    });
  });

  describe('pinMessage', () => {
    it('pins a message', async () => {
      api.post.mockResolvedValue({
        success: true,
        data: { isPinned: true }
      });

      const result = await messageService.pinMessage('msg-1');

      expect(api.post).toHaveBeenCalledWith('/messages/msg-1/pin');
      expect(result.success).toBe(true);
    });
  });

  describe('unpinMessage', () => {
    it('unpins a message', async () => {
      api.post.mockResolvedValue({
        success: true,
        data: { isPinned: false }
      });

      const result = await messageService.unpinMessage('msg-1');

      expect(api.post).toHaveBeenCalledWith('/messages/msg-1/unpin');
      expect(result.success).toBe(true);
    });
  });

  describe('getPinnedMessages', () => {
    it('gets pinned messages for a channel', async () => {
      const mockMessages = [
        { id: '1', content: 'Pinned 1', isPinned: true },
        { id: '2', content: 'Pinned 2', isPinned: true },
        { id: '3', content: 'Not pinned', isPinned: false }
      ];

      api.get.mockResolvedValue({
        success: true,
        data: { messages: mockMessages }
      });

      const result = await messageService.getPinnedMessages('channel-1');

      expect(result.success).toBe(true);
      expect(result.data.messages).toHaveLength(2);
      expect(result.data.messages.every(msg => msg.isPinned)).toBe(true);
    });

    it('handles channels with no pinned messages', async () => {
      api.get.mockResolvedValue({
        success: true,
        data: { messages: [] }
      });

      const result = await messageService.getPinnedMessages('channel-1');

      expect(result.data.messages).toHaveLength(0);
    });
  });

  describe('searchMessages', () => {
    it('searches messages in a channel', async () => {
      const mockResults = [
        { id: '1', content: 'Found message 1' },
        { id: '2', content: 'Found message 2' }
      ];

      api.get.mockResolvedValue({
        success: true,
        data: { results: mockResults }
      });

      const result = await messageService.searchMessages('channel-1', 'test query');

      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('channelId=channel-1')
      );
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('q=test+query')
      );
    });
  });

  describe('getMessageReplies', () => {
    it('gets replies for a message thread', async () => {
      const mockMessage = {
        id: '1',
        content: 'Parent message',
        replies: [
          { id: '2', content: 'Reply 1' },
          { id: '3', content: 'Reply 2' }
        ],
        _count: { replies: 2 }
      };

      api.get.mockResolvedValue({
        success: true,
        data: mockMessage
      });

      const result = await messageService.getMessageReplies('1');

      expect(result.success).toBe(true);
      expect(result.data.messages).toHaveLength(2);
    });

    it('handles messages with no replies', async () => {
      api.get.mockResolvedValue({
        success: true,
        data: { id: '1', content: 'No replies', replies: [] }
      });

      const result = await messageService.getMessageReplies('1');

      expect(result.data.messages).toHaveLength(0);
    });
  });

  describe('uploadAttachments', () => {
    it('uploads single file', async () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

      api.uploadFile = jest.fn().mockResolvedValue({
        success: true,
        data: { url: 'https://cdn.example.com/test.jpg' }
      });

      const result = await messageService.uploadAttachments('channel-1', file);

      expect(api.uploadFile).toHaveBeenCalledWith(
        '/messages/attachments',
        file,
        { channelId: 'channel-1' }
      );
      expect(result.success).toBe(true);
    });

    it('uploads multiple files', async () => {
      const files = [
        new File(['content1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['content2'], 'test2.png', { type: 'image/png' })
      ];

      api.uploadFiles = jest.fn().mockResolvedValue({
        success: true,
        data: { urls: ['url1', 'url2'] }
      });

      const result = await messageService.uploadAttachments('channel-1', files);

      expect(api.uploadFiles).toHaveBeenCalledWith(
        '/messages/attachments',
        files,
        { channelId: 'channel-1' }
      );
      expect(result.success).toBe(true);
    });
  });

  describe('reportMessage', () => {
    it('reports a message', async () => {
      const reportData = { reason: 'spam', description: 'Spam message' };

      api.post.mockResolvedValue({
        success: true,
        message: 'Message reported'
      });

      const result = await messageService.reportMessage('msg-1', reportData);

      expect(api.post).toHaveBeenCalledWith('/messages/msg-1/report', reportData);
      expect(result.success).toBe(true);
    });
  });

  describe('bulkDeleteMessages', () => {
    it('deletes multiple messages', async () => {
      const messageIds = ['msg-1', 'msg-2', 'msg-3'];

      api.post.mockResolvedValue({
        success: true,
        data: { deleted: 3 }
      });

      const result = await messageService.bulkDeleteMessages('channel-1', messageIds);

      expect(api.post).toHaveBeenCalledWith('/messages/bulk-delete', {
        channelId: 'channel-1',
        messageIds
      });
      expect(result.success).toBe(true);
    });
  });

  describe('getMessagesBefore', () => {
    it('fetches messages before a specific message', async () => {
      api.get.mockResolvedValue({
        success: true,
        data: { messages: [] }
      });

      await messageService.getMessagesBefore('channel-1', 'msg-100', 25);

      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('before=msg-100')
      );
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('limit=25')
      );
    });
  });

  describe('getMessagesAfter', () => {
    it('fetches messages after a specific message', async () => {
      api.get.mockResolvedValue({
        success: true,
        data: { messages: [] }
      });

      await messageService.getMessagesAfter('channel-1', 'msg-50', 30);

      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('after=msg-50')
      );
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('limit=30')
      );
    });
  });

  describe('getMessagesAround', () => {
    it('fetches messages around a specific message', async () => {
      const beforeMessages = [
        { id: '1', content: 'Before 1', createdAt: '2024-01-01T10:00:00Z' },
        { id: '2', content: 'Before 2', createdAt: '2024-01-01T11:00:00Z' }
      ];

      const afterMessages = [
        { id: '4', content: 'After 1', createdAt: '2024-01-01T13:00:00Z' },
        { id: '5', content: 'After 2', createdAt: '2024-01-01T14:00:00Z' }
      ];

      const targetMessage = {
        id: '3',
        content: 'Target',
        createdAt: '2024-01-01T12:00:00Z'
      };

      api.get
        .mockResolvedValueOnce({ success: true, data: { messages: beforeMessages } })
        .mockResolvedValueOnce({ success: true, data: { messages: afterMessages } })
        .mockResolvedValueOnce({ success: true, data: targetMessage });

      const result = await messageService.getMessagesAround('channel-1', '3', 50);

      expect(result.success).toBe(true);
      expect(result.data.messages).toHaveLength(5);
      expect(result.data.messages[2].id).toBe('3'); // Target message in middle
    });
  });

  describe('markAsRead', () => {
    it('marks messages as read', async () => {
      api.post.mockResolvedValue({
        success: true,
        data: { readUpTo: 'msg-100' }
      });

      const result = await messageService.markAsRead('channel-1', 'msg-100');

      expect(api.post).toHaveBeenCalledWith('/messages/read', {
        channelId: 'channel-1',
        lastMessageId: 'msg-100'
      });
      expect(result.success).toBe(true);
    });
  });

  describe('getUnreadCount', () => {
    it('gets unread message count', async () => {
      api.get.mockResolvedValue({
        success: true,
        data: { unread: 5 }
      });

      const result = await messageService.getUnreadCount('channel-1');

      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('channelId=channel-1')
      );
      expect(result.data.unread).toBe(5);
    });
  });

  describe('startTyping', () => {
    it('sends typing indicator', async () => {
      api.post.mockResolvedValue({
        success: true
      });

      await messageService.startTyping('channel-1');

      expect(api.post).toHaveBeenCalledWith('/messages/typing', {
        channelId: 'channel-1'
      });
    });
  });

  describe('getTypingUsers', () => {
    it('gets users currently typing', async () => {
      const mockTyping = [
        { id: '1', username: 'user1' },
        { id: '2', username: 'user2' }
      ];

      api.get.mockResolvedValue({
        success: true,
        data: { typing: mockTyping }
      });

      const result = await messageService.getTypingUsers('channel-1');

      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('channelId=channel-1')
      );
      expect(result.data.typing).toHaveLength(2);
    });
  });
});
