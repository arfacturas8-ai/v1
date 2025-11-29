/**
 * Tests for directMessages
 */
import directMessagesService from './directMessages';
import socketService from './socket';
import apiService from './api';

jest.mock('./socket', () => ({
  __esModule: true,
  default: {
    on: jest.fn(),
    emit: jest.fn(),
    getDirectConversations: jest.fn(),
    getDirectMessages: jest.fn(),
    sendDirectMessage: jest.fn(),
    startDirectConversation: jest.fn(),
    markConversationAsRead: jest.fn()
  }
}));
jest.mock('./api');

describe('directMessages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    directMessagesService.conversations = [];
    directMessagesService.messages.clear();
    directMessagesService.listeners.clear();
  });

  afterEach(() => {
    // Clean up service state
    directMessagesService.destroy();
  });

  describe('Event Management', () => {
    it('registers event listeners', () => {
      const callback = jest.fn();

      directMessagesService.on('test_event', callback);

      expect(directMessagesService.listeners.has('test_event')).toBe(true);
      expect(directMessagesService.listeners.get('test_event')).toContain(callback);
    });

    it('removes event listeners', () => {
      const callback = jest.fn();

      directMessagesService.on('test_event', callback);
      directMessagesService.off('test_event', callback);

      expect(directMessagesService.listeners.get('test_event')).not.toContain(callback);
    });

    it('emits events to registered listeners', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      directMessagesService.on('test_event', callback1);
      directMessagesService.on('test_event', callback2);

      directMessagesService.emit('test_event', { data: 'test' });

      expect(callback1).toHaveBeenCalledWith({ data: 'test' });
      expect(callback2).toHaveBeenCalledWith({ data: 'test' });
    });

    it('handles errors in event callbacks gracefully', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Callback error');
      });
      const successCallback = jest.fn();

      directMessagesService.on('test_event', errorCallback);
      directMessagesService.on('test_event', successCallback);

      // Should not throw
      directMessagesService.emit('test_event', { data: 'test' });

      expect(successCallback).toHaveBeenCalled();
    });
  });

  describe('loadConversations', () => {
    it('loads conversations from API', async () => {
      const mockConversations = [
        { id: 'conv-1', user: { id: 'user-1', username: 'user1' } },
        { id: 'conv-2', user: { id: 'user-2', username: 'user2' } }
      ];

      apiService.get.mockResolvedValue({
        data: mockConversations
      });

      const result = await directMessagesService.loadConversations();

      expect(apiService.get).toHaveBeenCalledWith('/conversations');
      expect(result).toEqual(mockConversations);
      expect(directMessagesService.conversations).toEqual(mockConversations);
    });

    it('falls back to socket on API error', async () => {
      apiService.get.mockRejectedValue(new Error('API error'));

      const result = await directMessagesService.loadConversations();

      expect(socketService.getDirectConversations).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('emits conversations_updated event', async () => {
      const callback = jest.fn();
      directMessagesService.on('conversations_updated', callback);

      apiService.get.mockResolvedValue({
        data: [{ id: 'conv-1' }]
      });

      await directMessagesService.loadConversations();

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('loadMessages', () => {
    it('loads messages from API', async () => {
      const mockMessages = [
        { id: 'msg-1', content: 'Hello', conversationId: 'conv-1' },
        { id: 'msg-2', content: 'Hi', conversationId: 'conv-1' }
      ];

      apiService.get.mockResolvedValue({
        data: mockMessages
      });

      const result = await directMessagesService.loadMessages('conv-1');

      expect(apiService.get).toHaveBeenCalledWith('/conversations/conv-1/messages');
      expect(result).toEqual(mockMessages);
      expect(directMessagesService.messages.get('conv-1')).toEqual(mockMessages);
    });

    it('falls back to socket on API error', async () => {
      apiService.get.mockRejectedValue(new Error('API error'));

      const result = await directMessagesService.loadMessages('conv-1');

      expect(socketService.getDirectMessages).toHaveBeenCalledWith('conv-1');
      expect(result).toEqual([]);
    });

    it('emits messages_updated event', async () => {
      const callback = jest.fn();
      directMessagesService.on('messages_updated', callback);

      apiService.get.mockResolvedValue({
        data: [{ id: 'msg-1' }]
      });

      await directMessagesService.loadMessages('conv-1');

      expect(callback).toHaveBeenCalledWith({
        conversationId: 'conv-1',
        messages: [{ id: 'msg-1' }]
      });
    });
  });

  describe('sendMessage', () => {
    it('sends message with optimistic update', async () => {
      const conversation = {
        id: 'conv-1',
        user: { id: 'user-1', username: 'user1' }
      };
      directMessagesService.conversations = [conversation];

      const result = await directMessagesService.sendMessage('conv-1', 'Hello');

      expect(result.content).toBe('Hello');
      expect(result.conversationId).toBe('conv-1');
      expect(result.status).toBe('sending');
      expect(socketService.sendDirectMessage).toHaveBeenCalledWith(
        'user-1',
        'Hello',
        []
      );
    });

    it('sends message with attachments', async () => {
      const conversation = {
        id: 'conv-1',
        user: { id: 'user-1', username: 'user1' }
      };
      directMessagesService.conversations = [conversation];

      await directMessagesService.sendMessage('conv-1', 'Check this', ['file1.jpg']);

      expect(socketService.sendDirectMessage).toHaveBeenCalledWith(
        'user-1',
        'Check this',
        ['file1.jpg']
      );
    });

    it('adds message to local messages', async () => {
      const conversation = {
        id: 'conv-1',
        user: { id: 'user-1', username: 'user1' }
      };
      directMessagesService.conversations = [conversation];

      await directMessagesService.sendMessage('conv-1', 'Test message');

      const messages = directMessagesService.messages.get('conv-1');
      expect(messages).toHaveLength(1);
      expect(messages[0].content).toBe('Test message');
    });
  });

  describe('startConversation', () => {
    it('starts new conversation via API', async () => {
      const mockConversation = {
        id: 'conv-1',
        user: { id: 'user-1', username: 'user1' }
      };

      apiService.post.mockResolvedValue({
        data: mockConversation
      });

      const result = await directMessagesService.startConversation('user-1');

      expect(apiService.post).toHaveBeenCalledWith('/conversations', { userId: 'user-1' });
      expect(result).toEqual(mockConversation);
      expect(directMessagesService.conversations).toContain(mockConversation);
    });

    it('falls back to socket on API error', async () => {
      apiService.post.mockRejectedValue(new Error('API error'));

      await expect(
        directMessagesService.startConversation('user-1')
      ).rejects.toThrow();

      expect(socketService.startDirectConversation).toHaveBeenCalledWith('user-1');
    });
  });

  describe('markAsRead', () => {
    it('marks conversation as read', async () => {
      const conversation = {
        id: 'conv-1',
        unreadCount: 5,
        lastMessage: { content: 'test', isRead: false }
      };
      directMessagesService.conversations = [conversation];

      apiService.patch.mockResolvedValue({});

      await directMessagesService.markAsRead('conv-1');

      expect(apiService.patch).toHaveBeenCalledWith('/conversations/conv-1/read');
      expect(socketService.markConversationAsRead).toHaveBeenCalledWith('conv-1');
      expect(conversation.unreadCount).toBe(0);
      expect(conversation.lastMessage.isRead).toBe(true);
    });
  });

  describe('handleDirectMessageReceived', () => {
    it('adds new message to conversation', () => {
      const message = {
        id: 'msg-1',
        conversationId: 'conv-1',
        content: 'New message'
      };

      directMessagesService.handleDirectMessageReceived(message);

      const messages = directMessagesService.messages.get('conv-1');
      expect(messages).toContain(message);
    });

    it('does not add duplicate messages', () => {
      const message = {
        id: 'msg-1',
        conversationId: 'conv-1',
        content: 'Test'
      };

      directMessagesService.messages.set('conv-1', [message]);
      directMessagesService.handleDirectMessageReceived(message);

      const messages = directMessagesService.messages.get('conv-1');
      expect(messages).toHaveLength(1);
    });

    it('emits message_received event', () => {
      const callback = jest.fn();
      directMessagesService.on('message_received', callback);

      const message = {
        id: 'msg-1',
        conversationId: 'conv-1',
        content: 'Test'
      };

      directMessagesService.handleDirectMessageReceived(message);

      expect(callback).toHaveBeenCalledWith(message);
    });
  });

  describe('handleConversationCreated', () => {
    it('adds new conversation', () => {
      const conversation = {
        id: 'conv-1',
        user: { id: 'user-1', username: 'user1' }
      };

      directMessagesService.handleConversationCreated(conversation);

      expect(directMessagesService.conversations).toContain(conversation);
    });

    it('does not add duplicate conversations', () => {
      const conversation = {
        id: 'conv-1',
        user: { id: 'user-1', username: 'user1' }
      };

      directMessagesService.conversations = [conversation];
      directMessagesService.handleConversationCreated(conversation);

      expect(directMessagesService.conversations).toHaveLength(1);
    });

    it('adds conversation to start of list', () => {
      const oldConversation = { id: 'conv-1' };
      const newConversation = { id: 'conv-2' };

      directMessagesService.conversations = [oldConversation];
      directMessagesService.handleConversationCreated(newConversation);

      expect(directMessagesService.conversations[0]).toEqual(newConversation);
    });
  });

  describe('Utility methods', () => {
    it('gets all conversations', () => {
      const conversations = [
        { id: 'conv-1' },
        { id: 'conv-2' }
      ];
      directMessagesService.conversations = conversations;

      expect(directMessagesService.getConversations()).toEqual(conversations);
    });

    it('gets messages for conversation', () => {
      const messages = [{ id: 'msg-1' }, { id: 'msg-2' }];
      directMessagesService.messages.set('conv-1', messages);

      expect(directMessagesService.getMessages('conv-1')).toEqual(messages);
    });

    it('returns empty array for non-existent conversation', () => {
      expect(directMessagesService.getMessages('non-existent')).toEqual([]);
    });

    it('gets specific conversation', () => {
      const conversation = { id: 'conv-1', user: { username: 'user1' } };
      directMessagesService.conversations = [conversation];

      expect(directMessagesService.getConversation('conv-1')).toEqual(conversation);
    });

    it('gets conversation recipient', () => {
      const conversation = {
        id: 'conv-1',
        user: { id: 'user-1', username: 'user1' }
      };
      directMessagesService.conversations = [conversation];

      const recipient = directMessagesService.getConversationRecipient('conv-1');
      expect(recipient).toEqual({ id: 'user-1', username: 'user1' });
    });

    it('searches conversations by username', () => {
      directMessagesService.conversations = [
        { id: 'conv-1', user: { username: 'john', displayName: 'John Doe' } },
        { id: 'conv-2', user: { username: 'jane', displayName: 'Jane Smith' } }
      ];

      const results = directMessagesService.searchConversations('joh');
      expect(results).toHaveLength(1);
      expect(results[0].user.username).toBe('john');
    });

    it('searches conversations by display name', () => {
      directMessagesService.conversations = [
        { id: 'conv-1', user: { username: 'user1', displayName: 'Alice' } },
        { id: 'conv-2', user: { username: 'user2', displayName: 'Bob' } }
      ];

      const results = directMessagesService.searchConversations('ali');
      expect(results).toHaveLength(1);
      expect(results[0].user.displayName).toBe('Alice');
    });
  });

  describe('destroy', () => {
    it('clears all data', () => {
      directMessagesService.conversations = [{ id: 'conv-1' }];
      directMessagesService.messages.set('conv-1', [{ id: 'msg-1' }]);
      directMessagesService.on('test', jest.fn());

      directMessagesService.destroy();

      expect(directMessagesService.conversations).toEqual([]);
      expect(directMessagesService.messages.size).toBe(0);
      expect(directMessagesService.listeners.size).toBe(0);
    });
  });
});
