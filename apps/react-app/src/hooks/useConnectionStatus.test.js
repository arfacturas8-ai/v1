/**
 * Tests for useConnectionStatus hook
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useConnectionStatus } from './useConnectionStatus';
import websocketService from '../services/websocketService';

jest.mock('../services/websocketService');

describe('useConnectionStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    websocketService.on = jest.fn();
    websocketService.off = jest.fn();
    websocketService.getConnectionStatus = jest.fn().mockReturnValue({
      isConnected: false,
      isConnecting: false,
      connectionType: 'websocket',
      usePolling: false,
      socketIOFailed: false,
      reconnectAttempts: 0,
      onlineUsersCount: 0
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('initializes with disconnected state', () => {
      const { result } = renderHook(() => useConnectionStatus());

      expect(result.current.isConnected).toBe(false);
      expect(result.current.isConnecting).toBe(false);
      expect(result.current.connectionType).toBe('websocket');
    });

    it('fetches initial connection status', () => {
      renderHook(() => useConnectionStatus());

      expect(websocketService.getConnectionStatus).toHaveBeenCalled();
    });

    it('subscribes to connection events', () => {
      renderHook(() => useConnectionStatus());

      expect(websocketService.on).toHaveBeenCalledWith('connection:success', expect.any(Function));
      expect(websocketService.on).toHaveBeenCalledWith('connection:lost', expect.any(Function));
      expect(websocketService.on).toHaveBeenCalledWith('connection:error', expect.any(Function));
      expect(websocketService.on).toHaveBeenCalledWith('connection:reconnecting', expect.any(Function));
    });
  });

  describe('Connection Status Updates', () => {
    it('updates status when connected', () => {
      websocketService.getConnectionStatus.mockReturnValue({
        isConnected: true,
        isConnecting: false,
        connectionType: 'websocket',
        usePolling: false,
        socketIOFailed: false,
        reconnectAttempts: 0,
        onlineUsersCount: 10
      });

      const { result } = renderHook(() => useConnectionStatus());

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.onlineUsersCount).toBe(10);
    });

    it('updates status periodically every 2 seconds', () => {
      const { result } = renderHook(() => useConnectionStatus());

      // Initial call
      expect(websocketService.getConnectionStatus).toHaveBeenCalledTimes(1);

      // After 2 seconds
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(websocketService.getConnectionStatus).toHaveBeenCalledTimes(2);

      // After 4 seconds
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(websocketService.getConnectionStatus).toHaveBeenCalledTimes(3);
    });

    it('shows connecting state', () => {
      websocketService.getConnectionStatus.mockReturnValue({
        isConnected: false,
        isConnecting: true,
        connectionType: 'websocket',
        usePolling: false,
        socketIOFailed: false,
        reconnectAttempts: 1,
        onlineUsersCount: 0
      });

      const { result } = renderHook(() => useConnectionStatus());

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.isConnecting).toBe(true);
      expect(result.current.reconnectAttempts).toBe(1);
    });
  });

  describe('Polling Fallback', () => {
    it('detects polling fallback connection', () => {
      websocketService.getConnectionStatus.mockReturnValue({
        isConnected: true,
        isConnecting: false,
        connectionType: 'polling',
        usePolling: true,
        socketIOFailed: true,
        reconnectAttempts: 0,
        onlineUsersCount: 5
      });

      const { result } = renderHook(() => useConnectionStatus());

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.usePolling).toBe(true);
      expect(result.current.isPollingFallback).toBe(true);
      expect(result.current.isWebSocket).toBe(false);
      expect(result.current.connectionQuality).toBe('degraded');
    });

    it('shows good connection quality for WebSocket', () => {
      websocketService.getConnectionStatus.mockReturnValue({
        isConnected: true,
        isConnecting: false,
        connectionType: 'websocket',
        usePolling: false,
        socketIOFailed: false,
        reconnectAttempts: 0,
        onlineUsersCount: 10
      });

      const { result } = renderHook(() => useConnectionStatus());

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.isPollingFallback).toBe(false);
      expect(result.current.isWebSocket).toBe(true);
      expect(result.current.connectionQuality).toBe('good');
    });
  });

  describe('Connection Events', () => {
    it('handles connection success event', () => {
      let successHandler;
      websocketService.on.mockImplementation((event, handler) => {
        if (event === 'connection:success') successHandler = handler;
      });

      websocketService.getConnectionStatus.mockReturnValue({
        isConnected: true,
        isConnecting: false,
        connectionType: 'websocket',
        usePolling: false,
        socketIOFailed: false,
        reconnectAttempts: 0,
        onlineUsersCount: 10
      });

      renderHook(() => useConnectionStatus());

      act(() => {
        successHandler({ connectionType: 'websocket' });
      });

      expect(websocketService.getConnectionStatus).toHaveBeenCalled();
    });

    it('logs info when connected via polling', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

      let successHandler;
      websocketService.on.mockImplementation((event, handler) => {
        if (event === 'connection:success') successHandler = handler;
      });

      renderHook(() => useConnectionStatus());

      act(() => {
        successHandler({ connectionType: 'polling' });
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('HTTP polling fallback')
      );

      consoleSpy.mockRestore();
    });

    it('handles connection lost event', () => {
      let lostHandler;
      websocketService.on.mockImplementation((event, handler) => {
        if (event === 'connection:lost') lostHandler = handler;
      });

      websocketService.getConnectionStatus.mockReturnValue({
        isConnected: false,
        isConnecting: false,
        connectionType: 'websocket',
        usePolling: false,
        socketIOFailed: false,
        reconnectAttempts: 0,
        onlineUsersCount: 0
      });

      renderHook(() => useConnectionStatus());

      act(() => {
        lostHandler();
      });

      expect(websocketService.getConnectionStatus).toHaveBeenCalled();
    });

    it('handles connection error event', () => {
      let errorHandler;
      websocketService.on.mockImplementation((event, handler) => {
        if (event === 'connection:error') errorHandler = handler;
      });

      renderHook(() => useConnectionStatus());

      act(() => {
        errorHandler();
      });

      expect(websocketService.getConnectionStatus).toHaveBeenCalled();
    });

    it('handles reconnecting event', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

      let reconnectingHandler;
      websocketService.on.mockImplementation((event, handler) => {
        if (event === 'connection:reconnecting') reconnectingHandler = handler;
      });

      renderHook(() => useConnectionStatus());

      act(() => {
        reconnectingHandler({ attempt: 3 });
      });

      expect(consoleSpy).toHaveBeenCalledWith('Reconnecting... Attempt 3');
      expect(websocketService.getConnectionStatus).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Cleanup', () => {
    it('clears interval on unmount', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      const { unmount } = renderHook(() => useConnectionStatus());

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
    });

    it('unsubscribes from all events on unmount', () => {
      const { unmount } = renderHook(() => useConnectionStatus());

      unmount();

      expect(websocketService.off).toHaveBeenCalledWith('connection:success', expect.any(Function));
      expect(websocketService.off).toHaveBeenCalledWith('connection:lost', expect.any(Function));
      expect(websocketService.off).toHaveBeenCalledWith('connection:error', expect.any(Function));
      expect(websocketService.off).toHaveBeenCalledWith('connection:reconnecting', expect.any(Function));
    });
  });

  describe('Helper Properties', () => {
    it('provides isPollingFallback helper', () => {
      websocketService.getConnectionStatus.mockReturnValue({
        isConnected: true,
        isConnecting: false,
        connectionType: 'polling',
        usePolling: true,
        socketIOFailed: false,
        reconnectAttempts: 0,
        onlineUsersCount: 0
      });

      const { result } = renderHook(() => useConnectionStatus());

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.isPollingFallback).toBe(true);
    });

    it('provides isWebSocket helper', () => {
      websocketService.getConnectionStatus.mockReturnValue({
        isConnected: true,
        isConnecting: false,
        connectionType: 'websocket',
        usePolling: false,
        socketIOFailed: false,
        reconnectAttempts: 0,
        onlineUsersCount: 0
      });

      const { result } = renderHook(() => useConnectionStatus());

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.isWebSocket).toBe(true);
    });

    it('provides connectionQuality helper', () => {
      websocketService.getConnectionStatus.mockReturnValue({
        isConnected: true,
        isConnecting: false,
        connectionType: 'websocket',
        usePolling: false,
        socketIOFailed: false,
        reconnectAttempts: 0,
        onlineUsersCount: 0
      });

      const { result } = renderHook(() => useConnectionStatus());

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.connectionQuality).toBe('good');
    });
  });

  describe('Reconnection Attempts', () => {
    it('tracks reconnection attempts', () => {
      websocketService.getConnectionStatus.mockReturnValue({
        isConnected: false,
        isConnecting: true,
        connectionType: 'websocket',
        usePolling: false,
        socketIOFailed: false,
        reconnectAttempts: 5,
        onlineUsersCount: 0
      });

      const { result } = renderHook(() => useConnectionStatus());

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.reconnectAttempts).toBe(5);
    });

    it('resets reconnection attempts on success', () => {
      websocketService.getConnectionStatus
        .mockReturnValueOnce({
          isConnected: false,
          isConnecting: true,
          connectionType: 'websocket',
          usePolling: false,
          socketIOFailed: false,
          reconnectAttempts: 3,
          onlineUsersCount: 0
        })
        .mockReturnValueOnce({
          isConnected: true,
          isConnecting: false,
          connectionType: 'websocket',
          usePolling: false,
          socketIOFailed: false,
          reconnectAttempts: 0,
          onlineUsersCount: 10
        });

      const { result } = renderHook(() => useConnectionStatus());

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.reconnectAttempts).toBe(0);
    });
  });

  describe('Online Users Count', () => {
    it('tracks online users count', () => {
      websocketService.getConnectionStatus.mockReturnValue({
        isConnected: true,
        isConnecting: false,
        connectionType: 'websocket',
        usePolling: false,
        socketIOFailed: false,
        reconnectAttempts: 0,
        onlineUsersCount: 42
      });

      const { result } = renderHook(() => useConnectionStatus());

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.onlineUsersCount).toBe(42);
    });

    it('updates online users count in real-time', () => {
      websocketService.getConnectionStatus
        .mockReturnValueOnce({
          isConnected: true,
          isConnecting: false,
          connectionType: 'websocket',
          usePolling: false,
          socketIOFailed: false,
          reconnectAttempts: 0,
          onlineUsersCount: 10
        })
        .mockReturnValueOnce({
          isConnected: true,
          isConnecting: false,
          connectionType: 'websocket',
          usePolling: false,
          socketIOFailed: false,
          reconnectAttempts: 0,
          onlineUsersCount: 15
        });

      const { result } = renderHook(() => useConnectionStatus());

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.onlineUsersCount).toBe(15);
    });
  });
});
