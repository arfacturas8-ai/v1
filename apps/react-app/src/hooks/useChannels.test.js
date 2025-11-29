/**
 * Tests for useChannels hook
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChannels } from './useChannels';
import channelService from '../services/channelService';
import websocketService from '../services/websocketService';

jest.mock('../services/channelService');
jest.mock('../services/websocketService');

describe('useChannels', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    websocketService.on = jest.fn();
    websocketService.off = jest.fn();
  });

  describe('Initialization', () => {
    it('initializes with empty channels', () => {
      const { result } = renderHook(() => useChannels('server-1'));

      expect(result.current.channels).toEqual([]);
      expect(result.current.selectedChannel).toBe(null);
      expect(result.current.loading).toBe(false);
    });

    it('initializes with server ID', () => {
      const { result } = renderHook(() => useChannels('server-1'));

      expect(result.current.channels).toEqual([]);
    });
  });

  describe('loadChannels', () => {
    it('loads channels for a server', async () => {
      const mockChannels = [
        { id: 'ch-1', name: 'general', type: 'text', serverId: 'server-1' },
        { id: 'ch-2', name: 'random', type: 'text', serverId: 'server-1' }
      ];
      channelService.getChannels.mockResolvedValue({ channels: mockChannels });

      const { result } = renderHook(() => useChannels('server-1'));

      await act(async () => {
        await result.current.loadChannels();
      });

      expect(channelService.getChannels).toHaveBeenCalledWith('server-1');
      expect(result.current.channels).toEqual(mockChannels);
    });

    it('sets loading state during fetch', async () => {
      channelService.getChannels.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({ channels: [] }), 100);
      }));

      const { result } = renderHook(() => useChannels('server-1'));

      let loadingDuringFetch = false;
      act(() => {
        result.current.loadChannels().then(() => {});
        loadingDuringFetch = result.current.loading;
      });

      expect(loadingDuringFetch).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('handles errors during loading', async () => {
      channelService.getChannels.mockRejectedValue(new Error('Failed to load'));

      const { result } = renderHook(() => useChannels('server-1'));

      await act(async () => {
        await result.current.loadChannels();
      });

      expect(result.current.error).toBe('Failed to load');
      expect(result.current.loading).toBe(false);
    });

    it('loads channels on mount if autoLoad is true', async () => {
      const mockChannels = [{ id: 'ch-1', name: 'general' }];
      channelService.getChannels.mockResolvedValue({ channels: mockChannels });

      await act(async () => {
        renderHook(() => useChannels('server-1', { autoLoad: true }));
      });

      await waitFor(() => {
        expect(channelService.getChannels).toHaveBeenCalledWith('server-1');
      });
    });
  });

  describe('createChannel', () => {
    it('creates a text channel', async () => {
      const newChannel = { id: 'ch-new', name: 'new-channel', type: 'text', serverId: 'server-1' };
      channelService.createChannel.mockResolvedValue(newChannel);

      const { result } = renderHook(() => useChannels('server-1'));

      await act(async () => {
        await result.current.createChannel({ name: 'new-channel', type: 'text' });
      });

      expect(channelService.createChannel).toHaveBeenCalledWith('server-1', { name: 'new-channel', type: 'text' });
      expect(result.current.channels).toContainEqual(newChannel);
    });

    it('creates a voice channel', async () => {
      const newChannel = { id: 'ch-voice', name: 'voice-chat', type: 'voice', serverId: 'server-1' };
      channelService.createChannel.mockResolvedValue(newChannel);

      const { result } = renderHook(() => useChannels('server-1'));

      await act(async () => {
        await result.current.createChannel({ name: 'voice-chat', type: 'voice' });
      });

      expect(result.current.channels).toContainEqual(newChannel);
    });

    it('creates channel in category', async () => {
      const newChannel = { id: 'ch-new', name: 'new', categoryId: 'cat-1', serverId: 'server-1' };
      channelService.createChannel.mockResolvedValue(newChannel);

      const { result } = renderHook(() => useChannels('server-1'));

      await act(async () => {
        await result.current.createChannel({ name: 'new', categoryId: 'cat-1' });
      });

      expect(channelService.createChannel).toHaveBeenCalledWith('server-1', { name: 'new', categoryId: 'cat-1' });
    });

    it('handles create errors', async () => {
      channelService.createChannel.mockRejectedValue(new Error('Create failed'));

      const { result } = renderHook(() => useChannels('server-1'));

      await act(async () => {
        await result.current.createChannel({ name: 'new-channel' });
      });

      expect(result.current.error).toBe('Create failed');
    });
  });

  describe('updateChannel', () => {
    it('updates channel name', async () => {
      const initialChannels = [{ id: 'ch-1', name: 'old-name', serverId: 'server-1' }];
      const updatedChannel = { id: 'ch-1', name: 'new-name', serverId: 'server-1' };

      channelService.getChannels.mockResolvedValue({ channels: initialChannels });
      channelService.updateChannel.mockResolvedValue(updatedChannel);

      const { result } = renderHook(() => useChannels('server-1'));

      await act(async () => {
        await result.current.loadChannels();
      });

      await act(async () => {
        await result.current.updateChannel('ch-1', { name: 'new-name' });
      });

      expect(channelService.updateChannel).toHaveBeenCalledWith('server-1', 'ch-1', { name: 'new-name' });
      expect(result.current.channels[0].name).toBe('new-name');
    });

    it('updates channel topic', async () => {
      const initialChannels = [{ id: 'ch-1', name: 'general', topic: 'Old topic' }];
      const updatedChannel = { id: 'ch-1', name: 'general', topic: 'New topic' };

      channelService.getChannels.mockResolvedValue({ channels: initialChannels });
      channelService.updateChannel.mockResolvedValue(updatedChannel);

      const { result } = renderHook(() => useChannels('server-1'));

      await act(async () => {
        await result.current.loadChannels();
      });

      await act(async () => {
        await result.current.updateChannel('ch-1', { topic: 'New topic' });
      });

      expect(result.current.channels[0].topic).toBe('New topic');
    });

    it('handles update errors', async () => {
      channelService.updateChannel.mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useChannels('server-1'));

      await act(async () => {
        await result.current.updateChannel('ch-1', { name: 'new' });
      });

      expect(result.current.error).toBe('Update failed');
    });
  });

  describe('deleteChannel', () => {
    it('deletes a channel', async () => {
      const initialChannels = [
        { id: 'ch-1', name: 'general', serverId: 'server-1' },
        { id: 'ch-2', name: 'random', serverId: 'server-1' }
      ];
      channelService.getChannels.mockResolvedValue({ channels: initialChannels });
      channelService.deleteChannel.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useChannels('server-1'));

      await act(async () => {
        await result.current.loadChannels();
      });

      await act(async () => {
        await result.current.deleteChannel('ch-1');
      });

      expect(channelService.deleteChannel).toHaveBeenCalledWith('server-1', 'ch-1');
      expect(result.current.channels).toHaveLength(1);
      expect(result.current.channels[0].id).toBe('ch-2');
    });

    it('clears selected channel if deleted', async () => {
      const initialChannels = [{ id: 'ch-1', name: 'general', serverId: 'server-1' }];
      channelService.getChannels.mockResolvedValue({ channels: initialChannels });
      channelService.deleteChannel.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useChannels('server-1'));

      await act(async () => {
        await result.current.loadChannels();
        result.current.selectChannel('ch-1');
      });

      expect(result.current.selectedChannel).toBe('ch-1');

      await act(async () => {
        await result.current.deleteChannel('ch-1');
      });

      expect(result.current.selectedChannel).toBe(null);
    });

    it('handles delete errors', async () => {
      channelService.deleteChannel.mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useChannels('server-1'));

      await act(async () => {
        await result.current.deleteChannel('ch-1');
      });

      expect(result.current.error).toBe('Delete failed');
    });
  });

  describe('selectChannel', () => {
    it('selects a channel', () => {
      const { result } = renderHook(() => useChannels('server-1'));

      act(() => {
        result.current.selectChannel('ch-1');
      });

      expect(result.current.selectedChannel).toBe('ch-1');
    });

    it('changes selected channel', () => {
      const { result } = renderHook(() => useChannels('server-1'));

      act(() => {
        result.current.selectChannel('ch-1');
      });
      expect(result.current.selectedChannel).toBe('ch-1');

      act(() => {
        result.current.selectChannel('ch-2');
      });
      expect(result.current.selectedChannel).toBe('ch-2');
    });

    it('deselects channel with null', () => {
      const { result } = renderHook(() => useChannels('server-1'));

      act(() => {
        result.current.selectChannel('ch-1');
        result.current.selectChannel(null);
      });

      expect(result.current.selectedChannel).toBe(null);
    });
  });

  describe('Categories', () => {
    it('creates a category', async () => {
      const newCategory = { id: 'cat-1', name: 'Category 1', type: 'category', serverId: 'server-1' };
      channelService.createChannel.mockResolvedValue(newCategory);

      const { result } = renderHook(() => useChannels('server-1'));

      await act(async () => {
        await result.current.createCategory('Category 1');
      });

      expect(channelService.createChannel).toHaveBeenCalledWith('server-1', { name: 'Category 1', type: 'category' });
      expect(result.current.channels).toContainEqual(newCategory);
    });

    it('moves channel to category', async () => {
      const initialChannels = [{ id: 'ch-1', name: 'general', categoryId: null }];
      const updatedChannel = { id: 'ch-1', name: 'general', categoryId: 'cat-1' };

      channelService.getChannels.mockResolvedValue({ channels: initialChannels });
      channelService.updateChannel.mockResolvedValue(updatedChannel);

      const { result } = renderHook(() => useChannels('server-1'));

      await act(async () => {
        await result.current.loadChannels();
      });

      await act(async () => {
        await result.current.moveToCategory('ch-1', 'cat-1');
      });

      expect(channelService.updateChannel).toHaveBeenCalledWith('server-1', 'ch-1', { categoryId: 'cat-1' });
      expect(result.current.channels[0].categoryId).toBe('cat-1');
    });

    it('groups channels by category', async () => {
      const mockChannels = [
        { id: 'cat-1', name: 'Text Channels', type: 'category' },
        { id: 'ch-1', name: 'general', categoryId: 'cat-1' },
        { id: 'ch-2', name: 'random', categoryId: 'cat-1' },
        { id: 'ch-3', name: 'announcements', categoryId: null }
      ];
      channelService.getChannels.mockResolvedValue({ channels: mockChannels });

      const { result } = renderHook(() => useChannels('server-1'));

      await act(async () => {
        await result.current.loadChannels();
      });

      const grouped = result.current.getChannelsByCategory();

      expect(grouped['cat-1']).toHaveLength(2);
      expect(grouped['uncategorized']).toHaveLength(1);
    });
  });

  describe('Channel Filtering', () => {
    it('gets text channels only', async () => {
      const mockChannels = [
        { id: 'ch-1', name: 'general', type: 'text' },
        { id: 'ch-2', name: 'voice', type: 'voice' },
        { id: 'ch-3', name: 'random', type: 'text' }
      ];
      channelService.getChannels.mockResolvedValue({ channels: mockChannels });

      const { result } = renderHook(() => useChannels('server-1'));

      await act(async () => {
        await result.current.loadChannels();
      });

      const textChannels = result.current.getTextChannels();

      expect(textChannels).toHaveLength(2);
      expect(textChannels.every(ch => ch.type === 'text')).toBe(true);
    });

    it('gets voice channels only', async () => {
      const mockChannels = [
        { id: 'ch-1', name: 'general', type: 'text' },
        { id: 'ch-2', name: 'voice-1', type: 'voice' },
        { id: 'ch-3', name: 'voice-2', type: 'voice' }
      ];
      channelService.getChannels.mockResolvedValue({ channels: mockChannels });

      const { result } = renderHook(() => useChannels('server-1'));

      await act(async () => {
        await result.current.loadChannels();
      });

      const voiceChannels = result.current.getVoiceChannels();

      expect(voiceChannels).toHaveLength(2);
      expect(voiceChannels.every(ch => ch.type === 'voice')).toBe(true);
    });

    it('finds channel by ID', async () => {
      const mockChannels = [
        { id: 'ch-1', name: 'general' },
        { id: 'ch-2', name: 'random' }
      ];
      channelService.getChannels.mockResolvedValue({ channels: mockChannels });

      const { result } = renderHook(() => useChannels('server-1'));

      await act(async () => {
        await result.current.loadChannels();
      });

      const channel = result.current.findChannelById('ch-2');

      expect(channel).toEqual({ id: 'ch-2', name: 'random' });
    });
  });

  describe('WebSocket Events', () => {
    it('subscribes to channel events on mount', () => {
      renderHook(() => useChannels('server-1'));

      expect(websocketService.on).toHaveBeenCalledWith('channel:created', expect.any(Function));
      expect(websocketService.on).toHaveBeenCalledWith('channel:updated', expect.any(Function));
      expect(websocketService.on).toHaveBeenCalledWith('channel:deleted', expect.any(Function));
    });

    it('unsubscribes from events on unmount', () => {
      const { unmount } = renderHook(() => useChannels('server-1'));

      unmount();

      expect(websocketService.off).toHaveBeenCalledWith('channel:created', expect.any(Function));
      expect(websocketService.off).toHaveBeenCalledWith('channel:updated', expect.any(Function));
      expect(websocketService.off).toHaveBeenCalledWith('channel:deleted', expect.any(Function));
    });

    it('handles channel created event', async () => {
      let createdHandler;
      websocketService.on.mockImplementation((event, handler) => {
        if (event === 'channel:created') createdHandler = handler;
      });

      const { result } = renderHook(() => useChannels('server-1'));

      const newChannel = { id: 'ch-new', name: 'new-channel', serverId: 'server-1' };

      await act(async () => {
        createdHandler(newChannel);
      });

      expect(result.current.channels).toContainEqual(newChannel);
    });

    it('handles channel updated event', async () => {
      let updatedHandler;
      websocketService.on.mockImplementation((event, handler) => {
        if (event === 'channel:updated') updatedHandler = handler;
      });

      const initialChannels = [{ id: 'ch-1', name: 'old-name', serverId: 'server-1' }];
      channelService.getChannels.mockResolvedValue({ channels: initialChannels });

      const { result } = renderHook(() => useChannels('server-1'));

      await act(async () => {
        await result.current.loadChannels();
      });

      const updatedChannel = { id: 'ch-1', name: 'new-name', serverId: 'server-1' };

      await act(async () => {
        updatedHandler(updatedChannel);
      });

      expect(result.current.channels[0].name).toBe('new-name');
    });

    it('handles channel deleted event', async () => {
      let deletedHandler;
      websocketService.on.mockImplementation((event, handler) => {
        if (event === 'channel:deleted') deletedHandler = handler;
      });

      const initialChannels = [
        { id: 'ch-1', name: 'general', serverId: 'server-1' },
        { id: 'ch-2', name: 'random', serverId: 'server-1' }
      ];
      channelService.getChannels.mockResolvedValue({ channels: initialChannels });

      const { result } = renderHook(() => useChannels('server-1'));

      await act(async () => {
        await result.current.loadChannels();
      });

      await act(async () => {
        deletedHandler({ channelId: 'ch-1', serverId: 'server-1' });
      });

      expect(result.current.channels).toHaveLength(1);
      expect(result.current.channels[0].id).toBe('ch-2');
    });

    it('ignores events for different servers', async () => {
      let createdHandler;
      websocketService.on.mockImplementation((event, handler) => {
        if (event === 'channel:created') createdHandler = handler;
      });

      const { result } = renderHook(() => useChannels('server-1'));

      const otherServerChannel = { id: 'ch-new', name: 'other', serverId: 'server-2' };

      await act(async () => {
        createdHandler(otherServerChannel);
      });

      expect(result.current.channels).not.toContainEqual(otherServerChannel);
    });
  });

  describe('Edge Cases', () => {
    it('handles server change', async () => {
      const channels1 = [{ id: 'ch-1', name: 'Server 1 Channel', serverId: 'server-1' }];
      const channels2 = [{ id: 'ch-2', name: 'Server 2 Channel', serverId: 'server-2' }];

      channelService.getChannels
        .mockResolvedValueOnce({ channels: channels1 })
        .mockResolvedValueOnce({ channels: channels2 });

      const { result, rerender } = renderHook(
        ({ serverId }) => useChannels(serverId),
        { initialProps: { serverId: 'server-1' } }
      );

      await act(async () => {
        await result.current.loadChannels();
      });

      expect(result.current.channels).toEqual(channels1);

      rerender({ serverId: 'server-2' });

      await act(async () => {
        await result.current.loadChannels();
      });

      expect(result.current.channels).toEqual(channels2);
    });

    it('handles empty response', async () => {
      channelService.getChannels.mockResolvedValue({ channels: [] });

      const { result } = renderHook(() => useChannels('server-1'));

      await act(async () => {
        await result.current.loadChannels();
      });

      expect(result.current.channels).toEqual([]);
    });

    it('handles duplicate channel prevention', async () => {
      const channel = { id: 'ch-1', name: 'general', serverId: 'server-1' };
      channelService.createChannel.mockResolvedValue(channel);

      const { result } = renderHook(() => useChannels('server-1'));

      await act(async () => {
        await result.current.createChannel({ name: 'general' });
        await result.current.createChannel({ name: 'general' });
      });

      const channelIds = result.current.channels.map(c => c.id);
      const uniqueIds = [...new Set(channelIds)];

      expect(channelIds.length).toBe(uniqueIds.length);
    });

    it('preserves selected channel across reloads', async () => {
      const mockChannels = [
        { id: 'ch-1', name: 'general' },
        { id: 'ch-2', name: 'random' }
      ];
      channelService.getChannels.mockResolvedValue({ channels: mockChannels });

      const { result } = renderHook(() => useChannels('server-1'));

      await act(async () => {
        await result.current.loadChannels();
        result.current.selectChannel('ch-2');
      });

      expect(result.current.selectedChannel).toBe('ch-2');

      await act(async () => {
        await result.current.loadChannels();
      });

      expect(result.current.selectedChannel).toBe('ch-2');
    });
  });
});
