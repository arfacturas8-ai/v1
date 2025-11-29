/**
 * Tests for useMessages hook
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMessages } from './useMessages';
import channelService from '../services/channelService';
import websocketService from '../services/websocketService';

jest.mock('../services/channelService');
jest.mock('../services/websocketService');

describe('useMessages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    websocketService.on = jest.fn();
    websocketService.off = jest.fn();
  });

  describe('Initialization', () => {
    it('initializes with empty messages', () => {
      const { result } = renderHook(() => useMessages('channel-1'));

      expect(result.current.messages).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.hasMore).toBe(true);
    });

    it('initializes with custom page size', () => {
      const { result } = renderHook(() => useMessages('channel-1', { pageSize: 100 }));

      expect(result.current.messages).toEqual([]);
    });
  });

  describe('loadMessages', () => {
    it('loads messages for a channel', async () => {
      const mockMessages = [
        { id: 'msg-1', content: 'Hello', channelId: 'channel-1' },
        { id: 'msg-2', content: 'World', channelId: 'channel-1' }
      ];
      channelService.getMessages.mockResolvedValue({ messages: mockMessages, hasMore: true });

      const { result } = renderHook(() => useMessages('channel-1'));

      await act(async () => {
        await result.current.loadMessages();
      });

      expect(channelService.getMessages).toHaveBeenCalledWith('channel-1', 1, 50);
      expect(result.current.messages).toEqual(mockMessages);
      expect(result.current.hasMore).toBe(true);
    });

    it('sets loading state during fetch', async () => {
      channelService.getMessages.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({ messages: [], hasMore: false }), 100);
      }));

      const { result } = renderHook(() => useMessages('channel-1'));

      let loadingDuringFetch = false;
      act(() => {
        result.current.loadMessages().then(() => {});
        loadingDuringFetch = result.current.loading;
      });

      expect(loadingDuringFetch).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('handles pagination', async () => {
      const page1 = [{ id: 'msg-1', content: 'Message 1' }];
      const page2 = [{ id: 'msg-2', content: 'Message 2' }];

      channelService.getMessages
        .mockResolvedValueOnce({ messages: page1, hasMore: true })
        .mockResolvedValueOnce({ messages: page2, hasMore: false });

      const { result } = renderHook(() => useMessages('channel-1'));

      await act(async () => {
        await result.current.loadMessages();
      });
      expect(result.current.messages).toHaveLength(1);

      await act(async () => {
        await result.current.loadMore();
      });
      expect(result.current.messages).toHaveLength(2);
      expect(result.current.hasMore).toBe(false);
    });

    it('handles errors during loading', async () => {
      channelService.getMessages.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useMessages('channel-1'));

      await act(async () => {
        await result.current.loadMessages();
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.loading).toBe(false);
    });

    it('does not load more when hasMore is false', async () => {
      channelService.getMessages.mockResolvedValue({ messages: [], hasMore: false });

      const { result } = renderHook(() => useMessages('channel-1'));

      await act(async () => {
        await result.current.loadMessages();
      });

      channelService.getMessages.mockClear();

      await act(async () => {
        await result.current.loadMore();
      });

      expect(channelService.getMessages).not.toHaveBeenCalled();
    });
  });

  describe('sendMessage', () => {
    it('sends a text message', async () => {
      const mockMessage = { id: 'msg-new', content: 'New message', channelId: 'channel-1' };
      channelService.sendMessage.mockResolvedValue(mockMessage);

      const { result } = renderHook(() => useMessages('channel-1'));

      await act(async () => {
        await result.current.sendMessage('New message');
      });

      expect(channelService.sendMessage).toHaveBeenCalledWith('channel-1', 'New message', {});
      expect(result.current.messages).toContainEqual(mockMessage);
    });

    it('sends message with files', async () => {
      const mockFile = new File(['content'], 'test.txt');
      const mockMessage = { id: 'msg-new', content: 'Check this', channelId: 'channel-1' };
      channelService.sendMessage.mockResolvedValue(mockMessage);

      const { result } = renderHook(() => useMessages('channel-1'));

      await act(async () => {
        await result.current.sendMessage('Check this', { files: [mockFile] });
      });

      expect(channelService.sendMessage).toHaveBeenCalledWith('channel-1', 'Check this', { files: [mockFile] });
    });

    it('sends message with reply', async () => {
      const mockMessage = { id: 'msg-new', content: 'Reply', replyTo: 'msg-1', channelId: 'channel-1' };
      channelService.sendMessage.mockResolvedValue(mockMessage);

      const { result } = renderHook(() => useMessages('channel-1'));

      await act(async () => {
        await result.current.sendMessage('Reply', { replyTo: 'msg-1' });
      });

      expect(channelService.sendMessage).toHaveBeenCalledWith('channel-1', 'Reply', { replyTo: 'msg-1' });
    });

    it('adds optimistic message before sending', async () => {
      let resolvePromise;
      const promise = new Promise(resolve => { resolvePromise = resolve; });
      channelService.sendMessage.mockReturnValue(promise);

      const { result } = renderHook(() => useMessages('channel-1'));

      act(() => {
        result.current.sendMessage('Optimistic message');
      });

      // Check optimistic message
      await waitFor(() => {
        expect(result.current.messages.some(m => m.content === 'Optimistic message')).toBe(true);
      });

      await act(async () => {
        resolvePromise({ id: 'msg-confirmed', content: 'Optimistic message', channelId: 'channel-1' });
        await promise;
      });
    });

    it('handles send errors', async () => {
      channelService.sendMessage.mockRejectedValue(new Error('Send failed'));

      const { result } = renderHook(() => useMessages('channel-1'));

      await act(async () => {
        await result.current.sendMessage('Failed message');
      });

      expect(result.current.error).toBe('Send failed');
    });
  });

  describe('updateMessage', () => {
    it('updates an existing message', async () => {
      const initialMessages = [
        { id: 'msg-1', content: 'Original', channelId: 'channel-1' }
      ];
      channelService.getMessages.mockResolvedValue({ messages: initialMessages, hasMore: false });
      channelService.updateMessage.mockResolvedValue({ id: 'msg-1', content: 'Updated', channelId: 'channel-1' });

      const { result } = renderHook(() => useMessages('channel-1'));

      await act(async () => {
        await result.current.loadMessages();
      });

      await act(async () => {
        await result.current.updateMessage('msg-1', 'Updated');
      });

      expect(channelService.updateMessage).toHaveBeenCalledWith('channel-1', 'msg-1', 'Updated');
      expect(result.current.messages[0].content).toBe('Updated');
    });

    it('handles update errors', async () => {
      channelService.updateMessage.mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useMessages('channel-1'));

      await act(async () => {
        await result.current.updateMessage('msg-1', 'Updated');
      });

      expect(result.current.error).toBe('Update failed');
    });
  });

  describe('deleteMessage', () => {
    it('deletes a message', async () => {
      const initialMessages = [
        { id: 'msg-1', content: 'Message 1', channelId: 'channel-1' },
        { id: 'msg-2', content: 'Message 2', channelId: 'channel-1' }
      ];
      channelService.getMessages.mockResolvedValue({ messages: initialMessages, hasMore: false });
      channelService.deleteMessage.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useMessages('channel-1'));

      await act(async () => {
        await result.current.loadMessages();
      });

      await act(async () => {
        await result.current.deleteMessage('msg-1');
      });

      expect(channelService.deleteMessage).toHaveBeenCalledWith('channel-1', 'msg-1');
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].id).toBe('msg-2');
    });
  });

  describe('Reactions', () => {
    it('adds reaction to message', async () => {
      const initialMessages = [{ id: 'msg-1', content: 'Test', reactions: [] }];
      channelService.getMessages.mockResolvedValue({ messages: initialMessages, hasMore: false });
      channelService.addReaction.mockResolvedValue({ emoji: '👍', count: 1 });

      const { result } = renderHook(() => useMessages('channel-1'));

      await act(async () => {
        await result.current.loadMessages();
      });

      await act(async () => {
        await result.current.addReaction('msg-1', '👍');
      });

      expect(channelService.addReaction).toHaveBeenCalledWith('channel-1', 'msg-1', '👍');
    });

    it('removes reaction from message', async () => {
      const initialMessages = [{ id: 'msg-1', content: 'Test', reactions: [{ emoji: '👍', count: 1 }] }];
      channelService.getMessages.mockResolvedValue({ messages: initialMessages, hasMore: false });
      channelService.removeReaction.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useMessages('channel-1'));

      await act(async () => {
        await result.current.loadMessages();
      });

      await act(async () => {
        await result.current.removeReaction('msg-1', '👍');
      });

      expect(channelService.removeReaction).toHaveBeenCalledWith('channel-1', 'msg-1', '👍');
    });
  });

  describe('Typing Indicators', () => {
    it('starts typing indicator', () => {
      const { result } = renderHook(() => useMessages('channel-1'));

      act(() => {
        result.current.startTyping();
      });

      expect(channelService.startTyping).toHaveBeenCalledWith('channel-1');
    });

    it('stops typing indicator', () => {
      const { result } = renderHook(() => useMessages('channel-1'));

      act(() => {
        result.current.stopTyping();
      });

      expect(channelService.stopTyping).toHaveBeenCalledWith('channel-1');
    });

    it('updates typing users list', () => {
      const { result } = renderHook(() => useMessages('channel-1'));

      act(() => {
        result.current.setTypingUsers(['user-1', 'user-2']);
      });

      expect(result.current.typingUsers).toEqual(['user-1', 'user-2']);
    });
  });

  describe('Pin Messages', () => {
    it('pins a message', async () => {
      const initialMessages = [{ id: 'msg-1', content: 'Pin me', pinned: false }];
      channelService.getMessages.mockResolvedValue({ messages: initialMessages, hasMore: false });
      channelService.pinMessage.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useMessages('channel-1'));

      await act(async () => {
        await result.current.loadMessages();
      });

      await act(async () => {
        await result.current.pinMessage('msg-1');
      });

      expect(channelService.pinMessage).toHaveBeenCalledWith('channel-1', 'msg-1');
    });

    it('unpins a message', async () => {
      const initialMessages = [{ id: 'msg-1', content: 'Unpin me', pinned: true }];
      channelService.getMessages.mockResolvedValue({ messages: initialMessages, hasMore: false });
      channelService.unpinMessage.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useMessages('channel-1'));

      await act(async () => {
        await result.current.loadMessages();
      });

      await act(async () => {
        await result.current.unpinMessage('msg-1');
      });

      expect(channelService.unpinMessage).toHaveBeenCalledWith('channel-1', 'msg-1');
    });
  });

  describe('Search Messages', () => {
    it('searches messages in channel', async () => {
      const mockResults = [
        { id: 'msg-1', content: 'Search result 1' },
        { id: 'msg-2', content: 'Search result 2' }
      ];
      channelService.searchMessages.mockResolvedValue({ messages: mockResults });

      const { result } = renderHook(() => useMessages('channel-1'));

      await act(async () => {
        await result.current.searchMessages('query');
      });

      expect(channelService.searchMessages).toHaveBeenCalledWith('channel-1', 'query', {});
      expect(result.current.searchResults).toEqual(mockResults);
    });

    it('clears search results', () => {
      const { result } = renderHook(() => useMessages('channel-1'));

      act(() => {
        result.current.searchResults = [{ id: 'msg-1', content: 'Result' }];
        result.current.clearSearch();
      });

      expect(result.current.searchResults).toEqual([]);
    });
  });

  describe('WebSocket Events', () => {
    it('subscribes to message events on mount', () => {
      renderHook(() => useMessages('channel-1'));

      expect(websocketService.on).toHaveBeenCalledWith('message:new', expect.any(Function));
      expect(websocketService.on).toHaveBeenCalledWith('message:update', expect.any(Function));
      expect(websocketService.on).toHaveBeenCalledWith('message:delete', expect.any(Function));
      expect(websocketService.on).toHaveBeenCalledWith('typing:start', expect.any(Function));
      expect(websocketService.on).toHaveBeenCalledWith('typing:stop', expect.any(Function));
    });

    it('unsubscribes from events on unmount', () => {
      const { unmount } = renderHook(() => useMessages('channel-1'));

      unmount();

      expect(websocketService.off).toHaveBeenCalledWith('message:new', expect.any(Function));
      expect(websocketService.off).toHaveBeenCalledWith('message:update', expect.any(Function));
      expect(websocketService.off).toHaveBeenCalledWith('message:delete', expect.any(Function));
      expect(websocketService.off).toHaveBeenCalledWith('typing:start', expect.any(Function));
      expect(websocketService.off).toHaveBeenCalledWith('typing:stop', expect.any(Function));
    });

    it('handles new message event', async () => {
      let newMessageHandler;
      websocketService.on.mockImplementation((event, handler) => {
        if (event === 'message:new') newMessageHandler = handler;
      });

      const { result } = renderHook(() => useMessages('channel-1'));

      const newMessage = { id: 'msg-new', content: 'New from WS', channelId: 'channel-1' };

      await act(async () => {
        newMessageHandler(newMessage);
      });

      expect(result.current.messages).toContainEqual(newMessage);
    });

    it('handles message update event', async () => {
      let updateHandler;
      websocketService.on.mockImplementation((event, handler) => {
        if (event === 'message:update') updateHandler = handler;
      });

      const initialMessages = [{ id: 'msg-1', content: 'Original', channelId: 'channel-1' }];
      channelService.getMessages.mockResolvedValue({ messages: initialMessages, hasMore: false });

      const { result } = renderHook(() => useMessages('channel-1'));

      await act(async () => {
        await result.current.loadMessages();
      });

      const updatedMessage = { id: 'msg-1', content: 'Updated via WS', channelId: 'channel-1' };

      await act(async () => {
        updateHandler(updatedMessage);
      });

      expect(result.current.messages[0].content).toBe('Updated via WS');
    });

    it('handles message delete event', async () => {
      let deleteHandler;
      websocketService.on.mockImplementation((event, handler) => {
        if (event === 'message:delete') deleteHandler = handler;
      });

      const initialMessages = [
        { id: 'msg-1', content: 'Message 1', channelId: 'channel-1' },
        { id: 'msg-2', content: 'Message 2', channelId: 'channel-1' }
      ];
      channelService.getMessages.mockResolvedValue({ messages: initialMessages, hasMore: false });

      const { result } = renderHook(() => useMessages('channel-1'));

      await act(async () => {
        await result.current.loadMessages();
      });

      await act(async () => {
        deleteHandler({ messageId: 'msg-1', channelId: 'channel-1' });
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].id).toBe('msg-2');
    });

    it('ignores events for different channels', async () => {
      let newMessageHandler;
      websocketService.on.mockImplementation((event, handler) => {
        if (event === 'message:new') newMessageHandler = handler;
      });

      const { result } = renderHook(() => useMessages('channel-1'));

      const otherChannelMessage = { id: 'msg-new', content: 'Other channel', channelId: 'channel-2' };

      await act(async () => {
        newMessageHandler(otherChannelMessage);
      });

      expect(result.current.messages).not.toContainEqual(otherChannelMessage);
    });
  });

  describe('Edge Cases', () => {
    it('handles channel change', async () => {
      const messages1 = [{ id: 'msg-1', content: 'Channel 1', channelId: 'channel-1' }];
      const messages2 = [{ id: 'msg-2', content: 'Channel 2', channelId: 'channel-2' }];

      channelService.getMessages
        .mockResolvedValueOnce({ messages: messages1, hasMore: false })
        .mockResolvedValueOnce({ messages: messages2, hasMore: false });

      const { result, rerender } = renderHook(
        ({ channelId }) => useMessages(channelId),
        { initialProps: { channelId: 'channel-1' } }
      );

      await act(async () => {
        await result.current.loadMessages();
      });

      expect(result.current.messages).toEqual(messages1);

      rerender({ channelId: 'channel-2' });

      await act(async () => {
        await result.current.loadMessages();
      });

      expect(result.current.messages).toEqual(messages2);
    });

    it('handles empty response', async () => {
      channelService.getMessages.mockResolvedValue({ messages: [], hasMore: false });

      const { result } = renderHook(() => useMessages('channel-1'));

      await act(async () => {
        await result.current.loadMessages();
      });

      expect(result.current.messages).toEqual([]);
      expect(result.current.hasMore).toBe(false);
    });

    it('prevents duplicate messages', async () => {
      const mockMessage = { id: 'msg-1', content: 'Test', channelId: 'channel-1' };
      channelService.sendMessage.mockResolvedValue(mockMessage);

      const { result } = renderHook(() => useMessages('channel-1'));

      await act(async () => {
        await result.current.sendMessage('Test');
        await result.current.sendMessage('Test');
      });

      const messageIds = result.current.messages.map(m => m.id);
      const uniqueIds = [...new Set(messageIds)];

      expect(messageIds.length).toBe(uniqueIds.length);
    });
  });
});
