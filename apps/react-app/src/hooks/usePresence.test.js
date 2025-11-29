/**
 * Tests for usePresence hook
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePresence } from './usePresence';
import websocketService from '../services/websocketService';
import { useAuth } from '../contexts/AuthContext';

jest.mock('../services/websocketService');
jest.mock('../contexts/AuthContext');

describe('usePresence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    websocketService.on = jest.fn();
    websocketService.off = jest.fn();
    websocketService.updateStatus = jest.fn();

    useAuth.mockReturnValue({
      user: { id: 'user-123', username: 'testuser' }
    });

    // Mock document.hidden
    Object.defineProperty(document, 'hidden', {
      writable: true,
      value: false
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('initializes with empty state', () => {
      const { result } = renderHook(() => usePresence());

      expect(result.current.onlineUsers).toEqual([]);
      expect(result.current.currentStatus).toBe('online');
      expect(result.current.onlineCount).toBe(0);
    });

    it('sets initial status to online', () => {
      renderHook(() => usePresence());

      expect(websocketService.updateStatus).toHaveBeenCalledWith('online');
    });

    it('does not initialize without user', () => {
      useAuth.mockReturnValue({ user: null });

      renderHook(() => usePresence());

      expect(websocketService.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('updates user status', () => {
      const { result } = renderHook(() => usePresence());

      act(() => {
        result.current.updateStatus('away');
      });

      expect(websocketService.updateStatus).toHaveBeenCalledWith('away');
      expect(result.current.currentStatus).toBe('away');
    });

    it('does not update if status is the same', () => {
      const { result } = renderHook(() => usePresence());

      websocketService.updateStatus.mockClear();

      act(() => {
        result.current.updateStatus('online');
      });

      expect(websocketService.updateStatus).not.toHaveBeenCalled();
    });

    it('does not update without user', () => {
      useAuth.mockReturnValue({ user: null });

      const { result } = renderHook(() => usePresence());

      act(() => {
        result.current.updateStatus('away');
      });

      expect(result.current.currentStatus).toBe('online');
    });
  });

  describe('setCustomStatus', () => {
    it('sets custom status message', () => {
      const { result } = renderHook(() => usePresence());

      act(() => {
        result.current.setCustomStatus('Working on project');
      });

      expect(websocketService.updateStatus).toHaveBeenCalledWith('online', 'Working on project');
    });

    it('does not set custom status without user', () => {
      useAuth.mockReturnValue({ user: null });

      const { result } = renderHook(() => usePresence());

      websocketService.updateStatus.mockClear();

      act(() => {
        result.current.setCustomStatus('Message');
      });

      expect(websocketService.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('getUserPresence', () => {
    it('gets presence for online user', () => {
      let onlineHandler;
      websocketService.on.mockImplementation((event, handler) => {
        if (event === 'user:online') onlineHandler = handler;
      });

      const { result } = renderHook(() => usePresence());

      act(() => {
        onlineHandler({
          userId: 'user-2',
          username: 'john',
          displayName: 'John Doe',
          avatar: 'avatar.jpg',
          status: 'online'
        });
      });

      const presence = result.current.getUserPresence('user-2');

      expect(presence.isOnline).toBe(true);
      expect(presence.status).toBe('online');
    });

    it('gets presence for offline user', () => {
      const { result } = renderHook(() => usePresence());

      const presence = result.current.getUserPresence('unknown-user');

      expect(presence.isOnline).toBe(false);
      expect(presence.status).toBe('offline');
    });
  });

  describe('getOnlineCount', () => {
    it('returns count of online users', () => {
      let onlineHandler;
      websocketService.on.mockImplementation((event, handler) => {
        if (event === 'user:online') onlineHandler = handler;
      });

      const { result } = renderHook(() => usePresence());

      act(() => {
        onlineHandler({ userId: 'user-1', username: 'user1' });
        onlineHandler({ userId: 'user-2', username: 'user2' });
        onlineHandler({ userId: 'user-3', username: 'user3' });
      });

      expect(result.current.getOnlineCount()).toBe(3);
      expect(result.current.onlineCount).toBe(3);
    });
  });

  describe('getOnlineUsers', () => {
    it('returns list of online users', () => {
      let onlineHandler;
      websocketService.on.mockImplementation((event, handler) => {
        if (event === 'user:online') onlineHandler = handler;
      });

      const { result } = renderHook(() => usePresence());

      act(() => {
        onlineHandler({ userId: 'user-1', username: 'user1', displayName: 'User One' });
        onlineHandler({ userId: 'user-2', username: 'user2', displayName: 'User Two' });
      });

      const users = result.current.getOnlineUsers();

      expect(users).toHaveLength(2);
      expect(users[0].username).toBe('user1');
      expect(users[1].username).toBe('user2');
    });
  });

  describe('getUsersByStatus', () => {
    it('filters users by status', () => {
      let onlineHandler;
      let statusHandler;
      websocketService.on.mockImplementation((event, handler) => {
        if (event === 'user:online') onlineHandler = handler;
        if (event === 'user:status') statusHandler = handler;
      });

      const { result } = renderHook(() => usePresence());

      act(() => {
        onlineHandler({ userId: 'user-1', username: 'user1' });
        onlineHandler({ userId: 'user-2', username: 'user2' });
        statusHandler({ userId: 'user-1', status: 'away', username: 'user1' });
      });

      const awayUsers = result.current.getUsersByStatus('away');
      const onlineUsers = result.current.getUsersByStatus('online');

      expect(awayUsers).toHaveLength(1);
      expect(awayUsers[0].username).toBe('user1');
      expect(onlineUsers).toHaveLength(1);
    });

    it('provides status counts', () => {
      let onlineHandler;
      let statusHandler;
      websocketService.on.mockImplementation((event, handler) => {
        if (event === 'user:online') onlineHandler = handler;
        if (event === 'user:status') statusHandler = handler;
      });

      const { result } = renderHook(() => usePresence());

      act(() => {
        onlineHandler({ userId: 'user-1', username: 'user1' });
        onlineHandler({ userId: 'user-2', username: 'user2' });
        onlineHandler({ userId: 'user-3', username: 'user3' });
        statusHandler({ userId: 'user-1', status: 'idle', username: 'user1' });
        statusHandler({ userId: 'user-2', status: 'away', username: 'user2' });
      });

      expect(result.current.idleCount).toBe(1);
      expect(result.current.awayCount).toBe(1);
    });
  });

  describe('Activity Tracking', () => {
    it('tracks user activity', () => {
      const { result } = renderHook(() => usePresence());

      act(() => {
        result.current.trackActivity();
      });

      // Activity should reset idle timer
    });

    it('sets to idle after 5 minutes of inactivity', () => {
      const { result } = renderHook(() => usePresence());

      websocketService.updateStatus.mockClear();

      act(() => {
        result.current.trackActivity();
      });

      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000);
      });

      expect(websocketService.updateStatus).toHaveBeenCalledWith('idle');
      expect(result.current.currentStatus).toBe('idle');
    });

    it('returns to online on activity after idle', () => {
      const { result } = renderHook(() => usePresence());

      // Set to idle
      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000);
      });

      websocketService.updateStatus.mockClear();

      // Track activity
      act(() => {
        result.current.trackActivity();
      });

      expect(websocketService.updateStatus).toHaveBeenCalledWith('online');
    });

    it('does not set to idle from non-online status', () => {
      const { result } = renderHook(() => usePresence());

      act(() => {
        result.current.updateStatus('dnd');
      });

      websocketService.updateStatus.mockClear();

      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000);
      });

      expect(websocketService.updateStatus).not.toHaveBeenCalledWith('idle');
    });
  });

  describe('Visibility Change Handling', () => {
    it('sets to away when tab hidden for 2 minutes', async () => {
      renderHook(() => usePresence());

      websocketService.updateStatus.mockClear();

      // Simulate tab hidden
      Object.defineProperty(document, 'hidden', { value: true });

      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });

      act(() => {
        jest.advanceTimersByTime(2 * 60 * 1000);
      });

      expect(websocketService.updateStatus).toHaveBeenCalledWith('away');
    });

    it('sets to online when tab becomes visible', () => {
      const { result } = renderHook(() => usePresence());

      // First set to away
      act(() => {
        result.current.updateStatus('away');
      });

      websocketService.updateStatus.mockClear();

      // Simulate tab visible
      Object.defineProperty(document, 'hidden', { value: false });

      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });

      expect(websocketService.updateStatus).toHaveBeenCalledWith('online');
    });

    it('does not change from DND when hidden', async () => {
      const { result } = renderHook(() => usePresence());

      act(() => {
        result.current.updateStatus('dnd');
      });

      websocketService.updateStatus.mockClear();

      // Simulate tab hidden
      Object.defineProperty(document, 'hidden', { value: true });

      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
        jest.advanceTimersByTime(2 * 60 * 1000);
      });

      expect(websocketService.updateStatus).not.toHaveBeenCalledWith('away');
    });
  });

  describe('Activity Event Listeners', () => {
    it('adds activity listeners on mount', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

      renderHook(() => usePresence());

      expect(addEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function), expect.any(Object));
      expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function), expect.any(Object));
      expect(addEventListenerSpy).toHaveBeenCalledWith('keypress', expect.any(Function), expect.any(Object));
      expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), expect.any(Object));
      expect(addEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function), expect.any(Object));

      addEventListenerSpy.mockRestore();
    });

    it('removes activity listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

      const { unmount } = renderHook(() => usePresence());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('WebSocket Events', () => {
    it('subscribes to presence events', () => {
      renderHook(() => usePresence());

      expect(websocketService.on).toHaveBeenCalledWith('user:online', expect.any(Function));
      expect(websocketService.on).toHaveBeenCalledWith('user:offline', expect.any(Function));
      expect(websocketService.on).toHaveBeenCalledWith('user:status', expect.any(Function));
    });

    it('handles user online event', () => {
      let onlineHandler;
      websocketService.on.mockImplementation((event, handler) => {
        if (event === 'user:online') onlineHandler = handler;
      });

      const { result } = renderHook(() => usePresence());

      act(() => {
        onlineHandler({
          userId: 'user-2',
          username: 'john',
          displayName: 'John Doe',
          avatar: 'avatar.jpg',
          status: 'online'
        });
      });

      expect(result.current.onlineUsers).toHaveLength(1);
      expect(result.current.onlineUsers[0].username).toBe('john');
    });

    it('handles user offline event', () => {
      let onlineHandler;
      let offlineHandler;
      websocketService.on.mockImplementation((event, handler) => {
        if (event === 'user:online') onlineHandler = handler;
        if (event === 'user:offline') offlineHandler = handler;
      });

      const { result } = renderHook(() => usePresence());

      act(() => {
        onlineHandler({ userId: 'user-2', username: 'john' });
      });

      expect(result.current.onlineUsers).toHaveLength(1);

      act(() => {
        offlineHandler({ userId: 'user-2' });
      });

      expect(result.current.onlineUsers).toHaveLength(0);

      const presence = result.current.getUserPresence('user-2');
      expect(presence.status).toBe('offline');
    });

    it('handles user status event', () => {
      let statusHandler;
      websocketService.on.mockImplementation((event, handler) => {
        if (event === 'user:status') statusHandler = handler;
      });

      const { result } = renderHook(() => usePresence());

      act(() => {
        statusHandler({
          userId: 'user-2',
          username: 'john',
          status: 'dnd',
          customMessage: 'In a meeting'
        });
      });

      const presence = result.current.getUserPresence('user-2');
      expect(presence.status).toBe('dnd');
      expect(presence.customMessage).toBe('In a meeting');
    });

    it('adds user to online list when status changes to non-offline', () => {
      let statusHandler;
      websocketService.on.mockImplementation((event, handler) => {
        if (event === 'user:status') statusHandler = handler;
      });

      const { result } = renderHook(() => usePresence());

      act(() => {
        statusHandler({
          userId: 'user-2',
          username: 'john',
          displayName: 'John',
          avatar: 'avatar.jpg',
          status: 'online'
        });
      });

      expect(result.current.onlineUsers).toHaveLength(1);
    });

    it('unsubscribes from events on unmount', () => {
      const { unmount } = renderHook(() => usePresence());

      unmount();

      expect(websocketService.off).toHaveBeenCalledWith('user:online', expect.any(Function));
      expect(websocketService.off).toHaveBeenCalledWith('user:offline', expect.any(Function));
      expect(websocketService.off).toHaveBeenCalledWith('user:status', expect.any(Function));
    });
  });

  describe('Cleanup', () => {
    it('sets offline status on unmount', () => {
      const { unmount } = renderHook(() => usePresence());

      websocketService.updateStatus.mockClear();

      unmount();

      expect(websocketService.updateStatus).toHaveBeenCalledWith('offline');
    });

    it('clears activity timeout on unmount', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      const { result, unmount } = renderHook(() => usePresence());

      act(() => {
        result.current.trackActivity();
      });

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid status changes', () => {
      const { result } = renderHook(() => usePresence());

      act(() => {
        result.current.updateStatus('away');
        result.current.updateStatus('idle');
        result.current.updateStatus('dnd');
        result.current.updateStatus('online');
      });

      expect(result.current.currentStatus).toBe('online');
    });

    it('handles multiple online events for same user', () => {
      let onlineHandler;
      websocketService.on.mockImplementation((event, handler) => {
        if (event === 'user:online') onlineHandler = handler;
      });

      const { result } = renderHook(() => usePresence());

      act(() => {
        onlineHandler({ userId: 'user-2', username: 'john' });
        onlineHandler({ userId: 'user-2', username: 'john' });
        onlineHandler({ userId: 'user-2', username: 'john' });
      });

      expect(result.current.onlineUsers).toHaveLength(1);
    });

    it('handles offline event for non-existent user', () => {
      let offlineHandler;
      websocketService.on.mockImplementation((event, handler) => {
        if (event === 'user:offline') offlineHandler = handler;
      });

      const { result } = renderHook(() => usePresence());

      expect(() => {
        act(() => {
          offlineHandler({ userId: 'unknown-user' });
        });
      }).not.toThrow();
    });

    it('throttles activity tracking', () => {
      const { result } = renderHook(() => usePresence());

      websocketService.updateStatus.mockClear();

      // Set to idle first
      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000);
      });

      websocketService.updateStatus.mockClear();

      // Rapid activity calls should be throttled
      act(() => {
        result.current.trackActivity();
        result.current.trackActivity();
        result.current.trackActivity();
      });

      // Should only update status once
      expect(websocketService.updateStatus).toHaveBeenCalledTimes(1);
    });
  });
});
