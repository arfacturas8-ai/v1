/**
 * Tests for useServers hook
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useServers } from './useServers';
import serverService from '../services/serverService';
import websocketService from '../services/websocketService';

jest.mock('../services/serverService');
jest.mock('../services/websocketService');

describe('useServers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    websocketService.on = jest.fn();
    websocketService.off = jest.fn();
    websocketService.joinServer = jest.fn();
    websocketService.leaveServer = jest.fn();
  });

  describe('Initialization', () => {
    it('initializes with empty state', () => {
      serverService.getServers = jest.fn().mockResolvedValue({ success: true, servers: [] });

      const { result } = renderHook(() => useServers());

      expect(result.current.servers).toEqual([]);
      expect(result.current.currentServer).toBe(null);
      expect(result.current.loading).toBe(false);
    });

    it('loads servers on mount', async () => {
      const mockServers = [
        { id: 'srv-1', name: 'Server 1' },
        { id: 'srv-2', name: 'Server 2' }
      ];
      serverService.getServers = jest.fn().mockResolvedValue({ success: true, servers: mockServers });

      const { result } = renderHook(() => useServers());

      await waitFor(() => {
        expect(result.current.servers).toEqual(mockServers);
      });

      expect(serverService.getServers).toHaveBeenCalled();
    });
  });

  describe('loadServers', () => {
    it('loads servers successfully', async () => {
      const mockServers = [{ id: 'srv-1', name: 'Test Server' }];
      serverService.getServers = jest.fn().mockResolvedValue({ success: true, servers: mockServers });

      const { result } = renderHook(() => useServers());

      await waitFor(() => {
        expect(result.current.servers).toEqual(mockServers);
      });
    });

    it('sets loading state during fetch', async () => {
      serverService.getServers = jest.fn().mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ success: true, servers: [] }), 100))
      );

      const { result } = renderHook(() => useServers());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('handles errors', async () => {
      serverService.getServers = jest.fn().mockResolvedValue({ success: false, error: 'Failed to load' });

      const { result } = renderHook(() => useServers());

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to load');
      });
    });
  });

  describe('createServer', () => {
    it('creates a new server', async () => {
      const newServer = { id: 'srv-new', name: 'New Server' };
      serverService.getServers = jest.fn().mockResolvedValue({ success: true, servers: [] });
      serverService.createServer = jest.fn().mockResolvedValue({ success: true, server: newServer });

      const { result } = renderHook(() => useServers());

      await act(async () => {
        await result.current.createServer({ name: 'New Server' });
      });

      expect(serverService.createServer).toHaveBeenCalledWith({ name: 'New Server' });
      expect(result.current.servers).toContainEqual(newServer);
    });

    it('joins WebSocket room for new server', async () => {
      const newServer = { id: 'srv-new', name: 'New Server' };
      serverService.getServers = jest.fn().mockResolvedValue({ success: true, servers: [] });
      serverService.createServer = jest.fn().mockResolvedValue({ success: true, server: newServer });

      const { result } = renderHook(() => useServers());

      await act(async () => {
        await result.current.createServer({ name: 'New Server' });
      });

      expect(websocketService.joinServer).toHaveBeenCalledWith('srv-new');
    });

    it('returns the created server', async () => {
      const newServer = { id: 'srv-new', name: 'New Server' };
      serverService.getServers = jest.fn().mockResolvedValue({ success: true, servers: [] });
      serverService.createServer = jest.fn().mockResolvedValue({ success: true, server: newServer });

      const { result } = renderHook(() => useServers());

      let created;
      await act(async () => {
        created = await result.current.createServer({ name: 'New Server' });
      });

      expect(created).toEqual(newServer);
    });

    it('handles creation errors', async () => {
      serverService.getServers = jest.fn().mockResolvedValue({ success: true, servers: [] });
      serverService.createServer = jest.fn().mockRejectedValue(new Error('Creation failed'));

      const { result } = renderHook(() => useServers());

      await act(async () => {
        await expect(result.current.createServer({ name: 'Server' })).rejects.toThrow('Creation failed');
      });

      expect(result.current.error).toBe('Creation failed');
    });
  });

  describe('joinServer', () => {
    it('joins an existing server', async () => {
      const serverToJoin = { id: 'srv-2', name: 'Server to Join' };
      serverService.getServers = jest.fn().mockResolvedValue({ success: true, servers: [] });
      serverService.joinServer = jest.fn().mockResolvedValue({ success: true, server: serverToJoin });

      const { result } = renderHook(() => useServers());

      await act(async () => {
        await result.current.joinServer('srv-2');
      });

      expect(serverService.joinServer).toHaveBeenCalledWith('srv-2', null);
      expect(result.current.servers).toContainEqual(serverToJoin);
    });

    it('joins with invite code', async () => {
      const server = { id: 'srv-2', name: 'Server' };
      serverService.getServers = jest.fn().mockResolvedValue({ success: true, servers: [] });
      serverService.joinServer = jest.fn().mockResolvedValue({ success: true, server });

      const { result } = renderHook(() => useServers());

      await act(async () => {
        await result.current.joinServer('srv-2', 'INVITE123');
      });

      expect(serverService.joinServer).toHaveBeenCalledWith('srv-2', 'INVITE123');
    });

    it('joins WebSocket room', async () => {
      const server = { id: 'srv-2', name: 'Server' };
      serverService.getServers = jest.fn().mockResolvedValue({ success: true, servers: [] });
      serverService.joinServer = jest.fn().mockResolvedValue({ success: true, server });

      const { result } = renderHook(() => useServers());

      await act(async () => {
        await result.current.joinServer('srv-2');
      });

      expect(websocketService.joinServer).toHaveBeenCalledWith('srv-2');
    });

    it('does not duplicate servers', async () => {
      const existingServer = { id: 'srv-1', name: 'Existing' };
      serverService.getServers = jest.fn().mockResolvedValue({ success: true, servers: [existingServer] });
      serverService.joinServer = jest.fn().mockResolvedValue({ success: true, server: existingServer });

      const { result } = renderHook(() => useServers());

      await waitFor(() => {
        expect(result.current.servers).toHaveLength(1);
      });

      await act(async () => {
        await result.current.joinServer('srv-1');
      });

      expect(result.current.servers).toHaveLength(1);
    });
  });

  describe('joinByInvite', () => {
    it('joins server by invite code', async () => {
      const server = { id: 'srv-invite', name: 'Invited Server' };
      serverService.getServers = jest.fn().mockResolvedValue({ success: true, servers: [] });
      serverService.joinByInvite = jest.fn().mockResolvedValue({ success: true, server });

      const { result } = renderHook(() => useServers());

      await act(async () => {
        await result.current.joinByInvite('INVITE789');
      });

      expect(serverService.joinByInvite).toHaveBeenCalledWith('INVITE789');
      expect(result.current.servers).toContainEqual(server);
    });

    it('joins WebSocket room after invite', async () => {
      const server = { id: 'srv-invite', name: 'Server' };
      serverService.getServers = jest.fn().mockResolvedValue({ success: true, servers: [] });
      serverService.joinByInvite = jest.fn().mockResolvedValue({ success: true, server });

      const { result } = renderHook(() => useServers());

      await act(async () => {
        await result.current.joinByInvite('INVITE789');
      });

      expect(websocketService.joinServer).toHaveBeenCalledWith('srv-invite');
    });
  });

  describe('leaveServer', () => {
    it('leaves a server', async () => {
      const servers = [
        { id: 'srv-1', name: 'Server 1' },
        { id: 'srv-2', name: 'Server 2' }
      ];
      serverService.getServers = jest.fn().mockResolvedValue({ success: true, servers });
      serverService.leaveServer = jest.fn().mockResolvedValue({ success: true });

      const { result } = renderHook(() => useServers());

      await waitFor(() => {
        expect(result.current.servers).toHaveLength(2);
      });

      await act(async () => {
        await result.current.leaveServer('srv-1');
      });

      expect(serverService.leaveServer).toHaveBeenCalledWith('srv-1');
      expect(result.current.servers).toHaveLength(1);
      expect(result.current.servers[0].id).toBe('srv-2');
    });

    it('leaves WebSocket room', async () => {
      const servers = [{ id: 'srv-1', name: 'Server 1' }];
      serverService.getServers = jest.fn().mockResolvedValue({ success: true, servers });
      serverService.leaveServer = jest.fn().mockResolvedValue({ success: true });

      const { result } = renderHook(() => useServers());

      await waitFor(() => {
        expect(result.current.servers).toHaveLength(1);
      });

      await act(async () => {
        await result.current.leaveServer('srv-1');
      });

      expect(websocketService.leaveServer).toHaveBeenCalledWith('srv-1');
    });

    it('clears current server if leaving it', async () => {
      const servers = [{ id: 'srv-1', name: 'Server 1' }];
      serverService.getServers = jest.fn().mockResolvedValue({ success: true, servers });
      serverService.leaveServer = jest.fn().mockResolvedValue({ success: true });

      const { result } = renderHook(() => useServers());

      await waitFor(() => {
        expect(result.current.servers).toHaveLength(1);
      });

      act(() => {
        result.current.selectServer(servers[0]);
      });

      expect(result.current.currentServer).toEqual(servers[0]);

      await act(async () => {
        await result.current.leaveServer('srv-1');
      });

      expect(result.current.currentServer).toBe(null);
    });
  });

  describe('updateServer', () => {
    it('updates server data', async () => {
      const servers = [{ id: 'srv-1', name: 'Old Name' }];
      const updated = { id: 'srv-1', name: 'New Name' };
      serverService.getServers = jest.fn().mockResolvedValue({ success: true, servers });
      serverService.updateServer = jest.fn().mockResolvedValue({ success: true, server: updated });

      const { result } = renderHook(() => useServers());

      await waitFor(() => {
        expect(result.current.servers).toHaveLength(1);
      });

      await act(async () => {
        await result.current.updateServer('srv-1', { name: 'New Name' });
      });

      expect(serverService.updateServer).toHaveBeenCalledWith('srv-1', { name: 'New Name' });
      expect(result.current.servers[0].name).toBe('New Name');
    });

    it('updates current server if it matches', async () => {
      const server = { id: 'srv-1', name: 'Old Name' };
      const updated = { id: 'srv-1', name: 'Updated Name' };
      serverService.getServers = jest.fn().mockResolvedValue({ success: true, servers: [server] });
      serverService.updateServer = jest.fn().mockResolvedValue({ success: true, server: updated });

      const { result } = renderHook(() => useServers());

      await waitFor(() => {
        expect(result.current.servers).toHaveLength(1);
      });

      act(() => {
        result.current.selectServer(server);
      });

      await act(async () => {
        await result.current.updateServer('srv-1', { name: 'Updated Name' });
      });

      expect(result.current.currentServer.name).toBe('Updated Name');
    });
  });

  describe('deleteServer', () => {
    it('deletes a server', async () => {
      const servers = [
        { id: 'srv-1', name: 'Server 1' },
        { id: 'srv-2', name: 'Server 2' }
      ];
      serverService.getServers = jest.fn().mockResolvedValue({ success: true, servers });
      serverService.deleteServer = jest.fn().mockResolvedValue({ success: true });

      const { result } = renderHook(() => useServers());

      await waitFor(() => {
        expect(result.current.servers).toHaveLength(2);
      });

      await act(async () => {
        await result.current.deleteServer('srv-1');
      });

      expect(serverService.deleteServer).toHaveBeenCalledWith('srv-1');
      expect(result.current.servers).toHaveLength(1);
      expect(result.current.servers[0].id).toBe('srv-2');
    });

    it('leaves WebSocket room on delete', async () => {
      const servers = [{ id: 'srv-1', name: 'Server 1' }];
      serverService.getServers = jest.fn().mockResolvedValue({ success: true, servers });
      serverService.deleteServer = jest.fn().mockResolvedValue({ success: true });

      const { result } = renderHook(() => useServers());

      await waitFor(() => {
        expect(result.current.servers).toHaveLength(1);
      });

      await act(async () => {
        await result.current.deleteServer('srv-1');
      });

      expect(websocketService.leaveServer).toHaveBeenCalledWith('srv-1');
    });
  });

  describe('selectServer', () => {
    it('selects a server', async () => {
      const servers = [{ id: 'srv-1', name: 'Server 1' }];
      serverService.getServers = jest.fn().mockResolvedValue({ success: true, servers });

      const { result } = renderHook(() => useServers());

      await waitFor(() => {
        expect(result.current.servers).toHaveLength(1);
      });

      act(() => {
        result.current.selectServer(servers[0]);
      });

      expect(result.current.currentServer).toEqual(servers[0]);
    });

    it('joins WebSocket room when selecting', async () => {
      const server = { id: 'srv-1', name: 'Server 1' };
      serverService.getServers = jest.fn().mockResolvedValue({ success: true, servers: [server] });

      const { result } = renderHook(() => useServers());

      await waitFor(() => {
        expect(result.current.servers).toHaveLength(1);
      });

      act(() => {
        result.current.selectServer(server);
      });

      expect(websocketService.joinServer).toHaveBeenCalledWith('srv-1');
    });

    it('leaves previous server room when switching', async () => {
      const servers = [
        { id: 'srv-1', name: 'Server 1' },
        { id: 'srv-2', name: 'Server 2' }
      ];
      serverService.getServers = jest.fn().mockResolvedValue({ success: true, servers });

      const { result } = renderHook(() => useServers());

      await waitFor(() => {
        expect(result.current.servers).toHaveLength(2);
      });

      act(() => {
        result.current.selectServer(servers[0]);
      });

      act(() => {
        result.current.selectServer(servers[1]);
      });

      expect(websocketService.leaveServer).toHaveBeenCalledWith('srv-1');
      expect(websocketService.joinServer).toHaveBeenCalledWith('srv-2');
    });
  });

  describe('searchServers', () => {
    it('searches public servers', async () => {
      const searchResults = [{ id: 'srv-pub', name: 'Public Server' }];
      serverService.getServers = jest.fn().mockResolvedValue({ success: true, servers: [] });
      serverService.searchPublicServers = jest.fn().mockResolvedValue({ success: true, servers: searchResults });

      const { result } = renderHook(() => useServers());

      let results;
      await act(async () => {
        results = await result.current.searchServers('gaming');
      });

      expect(serverService.searchPublicServers).toHaveBeenCalledWith('gaming', {});
      expect(results).toEqual(searchResults);
    });

    it('searches with filters', async () => {
      serverService.getServers = jest.fn().mockResolvedValue({ success: true, servers: [] });
      serverService.searchPublicServers = jest.fn().mockResolvedValue({ success: true, servers: [] });

      const { result } = renderHook(() => useServers());

      await act(async () => {
        await result.current.searchServers('query', { category: 'gaming', minMembers: 100 });
      });

      expect(serverService.searchPublicServers).toHaveBeenCalledWith('query', { category: 'gaming', minMembers: 100 });
    });
  });

  describe('WebSocket Events', () => {
    it('subscribes to server events', async () => {
      serverService.getServers = jest.fn().mockResolvedValue({ success: true, servers: [] });

      renderHook(() => useServers());

      await waitFor(() => {
        expect(websocketService.on).toHaveBeenCalledWith('server:updated', expect.any(Function));
        expect(websocketService.on).toHaveBeenCalledWith('server:member_joined', expect.any(Function));
        expect(websocketService.on).toHaveBeenCalledWith('server:member_left', expect.any(Function));
      });
    });

    it('handles server updated event', async () => {
      let updateHandler;
      websocketService.on.mockImplementation((event, handler) => {
        if (event === 'server:updated') updateHandler = handler;
      });

      const servers = [{ id: 'srv-1', name: 'Old Name', description: 'Old' }];
      serverService.getServers = jest.fn().mockResolvedValue({ success: true, servers });

      const { result } = renderHook(() => useServers());

      await waitFor(() => {
        expect(result.current.servers).toHaveLength(1);
      });

      act(() => {
        updateHandler({ serverId: 'srv-1', updates: { description: 'Updated' } });
      });

      expect(result.current.servers[0].description).toBe('Updated');
    });

    it('handles member joined event', async () => {
      let joinHandler;
      websocketService.on.mockImplementation((event, handler) => {
        if (event === 'server:member_joined') joinHandler = handler;
      });

      const servers = [{ id: 'srv-1', name: 'Server', memberCount: 10, members: [] }];
      serverService.getServers = jest.fn().mockResolvedValue({ success: true, servers });

      const { result } = renderHook(() => useServers());

      await waitFor(() => {
        expect(result.current.servers).toHaveLength(1);
      });

      act(() => {
        joinHandler({ serverId: 'srv-1', member: { id: 'user-1', name: 'John' } });
      });

      expect(result.current.servers[0].memberCount).toBe(11);
      expect(result.current.servers[0].members).toHaveLength(1);
    });

    it('handles member left event', async () => {
      let leftHandler;
      websocketService.on.mockImplementation((event, handler) => {
        if (event === 'server:member_left') leftHandler = handler;
      });

      const servers = [{
        id: 'srv-1',
        name: 'Server',
        memberCount: 10,
        members: [{ id: 'user-1', name: 'John' }]
      }];
      serverService.getServers = jest.fn().mockResolvedValue({ success: true, servers });

      const { result } = renderHook(() => useServers());

      await waitFor(() => {
        expect(result.current.servers).toHaveLength(1);
      });

      act(() => {
        leftHandler({ serverId: 'srv-1', userId: 'user-1' });
      });

      expect(result.current.servers[0].memberCount).toBe(9);
      expect(result.current.servers[0].members).toHaveLength(0);
    });

    it('unsubscribes from events on unmount', async () => {
      serverService.getServers = jest.fn().mockResolvedValue({ success: true, servers: [] });

      const { unmount } = renderHook(() => useServers());

      unmount();

      expect(websocketService.off).toHaveBeenCalledWith('server:updated', expect.any(Function));
      expect(websocketService.off).toHaveBeenCalledWith('server:member_joined', expect.any(Function));
      expect(websocketService.off).toHaveBeenCalledWith('server:member_left', expect.any(Function));
    });
  });

  describe('Utilities', () => {
    it('gets server by ID', async () => {
      const servers = [
        { id: 'srv-1', name: 'Server 1' },
        { id: 'srv-2', name: 'Server 2' }
      ];
      serverService.getServers = jest.fn().mockResolvedValue({ success: true, servers });

      const { result } = renderHook(() => useServers());

      await waitFor(() => {
        expect(result.current.servers).toHaveLength(2);
      });

      const server = result.current.getServerById('srv-2');
      expect(server).toEqual({ id: 'srv-2', name: 'Server 2' });
    });

    it('provides server count', async () => {
      const servers = [
        { id: 'srv-1', name: 'Server 1' },
        { id: 'srv-2', name: 'Server 2' },
        { id: 'srv-3', name: 'Server 3' }
      ];
      serverService.getServers = jest.fn().mockResolvedValue({ success: true, servers });

      const { result } = renderHook(() => useServers());

      await waitFor(() => {
        expect(result.current.serverCount).toBe(3);
      });
    });
  });
});
