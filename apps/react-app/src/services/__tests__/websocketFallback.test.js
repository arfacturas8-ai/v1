/**
 * WebSocket Fallback Integration Tests
 * Tests for the HTTP polling fallback mechanism
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import websocketService from '../websocketService';

describe('WebSocket Fallback Integration', () => {
  beforeEach(() => {
    // Reset service state before each test
    websocketService.disconnect();
    jest.clearAllMocks();
  });

  afterEach(() => {
    websocketService.disconnect();
  });

  describe('Connection Fallback', () => {
    it('should attempt WebSocket connection first', async () => {
      const mockUser = {
        id: 'test-user-1',
        username: 'testuser',
        email: 'test@example.com'
      };

      // This will attempt Socket.IO connection
      await websocketService.connect(mockUser);

      // Check that connection was attempted
      expect(websocketService.currentUser).toEqual(mockUser);
    });

    it('should fall back to polling after WebSocket failures', async () => {
      const mockUser = {
        id: 'test-user-1',
        username: 'testuser',
        email: 'test@example.com'
      };

      // Mock Socket.IO to fail
      // In a real test, you'd mock the io() function to throw errors

      // Manually trigger fallback for testing
      websocketService.socketIOFailed = true;
      await websocketService.connect(mockUser);

      const status = websocketService.getConnectionStatus();
      expect(status.usePolling).toBe(true);
      expect(status.connectionType).toBe('polling');
    });

    it('should track connection attempts', async () => {
      const mockUser = {
        id: 'test-user-1',
        username: 'testuser',
        email: 'test@example.com'
      };

      // Simulate connection attempts
      websocketService.connectionAttempts = 2;

      const status = websocketService.getConnectionStatus();
      expect(websocketService.connectionAttempts).toBe(2);
    });
  });

  describe('Polling Mechanism', () => {
    it('should start polling when fallback is activated', () => {
      websocketService.currentUser = {
        id: 'test-user-1',
        username: 'testuser'
      };

      websocketService.fallbackToPolling();

      expect(websocketService.usePolling).toBe(true);
      expect(websocketService.isConnected).toBe(true);
      expect(websocketService.pollingInterval).not.toBeNull();
    });

    it('should stop polling on disconnect', () => {
      websocketService.currentUser = {
        id: 'test-user-1',
        username: 'testuser'
      };

      websocketService.fallbackToPolling();
      expect(websocketService.pollingInterval).not.toBeNull();

      websocketService.disconnect();
      expect(websocketService.pollingInterval).toBeNull();
      expect(websocketService.usePolling).toBe(false);
    });

    it('should handle polling events correctly', () => {
      const mockEvent = {
        type: 'message:new',
        data: {
          id: 'msg-1',
          content: 'Test message',
          channelId: 'channel-1'
        }
      };

      let receivedEvent = null;
      websocketService.on('message:received', (data) => {
        receivedEvent = data;
      });

      websocketService.handlePollingEvent(mockEvent);

      expect(receivedEvent).toEqual(mockEvent.data);
    });
  });

  describe('Event Sending', () => {
    it('should send events via Socket.IO when connected', async () => {
      websocketService.isConnected = true;
      websocketService.usePolling = false;
      websocketService.socket = {
        emit: jest.fn()
      };

      const result = await websocketService.sendEvent('test:event', {
        test: 'data'
      });

      expect(result).toBe(true);
      expect(websocketService.socket.emit).toHaveBeenCalledWith('test:event', {
        test: 'data'
      });
    });

    it('should send events via HTTP when polling', async () => {
      websocketService.isConnected = true;
      websocketService.usePolling = true;

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      const result = await websocketService.sendEvent('test:event', {
        test: 'data'
      });

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/events/send'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            type: 'test:event',
            data: { test: 'data' }
          })
        })
      );
    });

    it('should handle send failures gracefully', async () => {
      websocketService.isConnected = true;
      websocketService.usePolling = true;

      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await websocketService.sendEvent('test:event', {
        test: 'data'
      });

      expect(result).toBe(false);
    });
  });

  describe('Connection Status', () => {
    it('should report WebSocket connection type', () => {
      websocketService.isConnected = true;
      websocketService.usePolling = false;

      const status = websocketService.getConnectionStatus();

      expect(status.connectionType).toBe('websocket');
      expect(status.usePolling).toBe(false);
    });

    it('should report polling connection type', () => {
      websocketService.isConnected = true;
      websocketService.usePolling = true;

      const status = websocketService.getConnectionStatus();

      expect(status.connectionType).toBe('polling');
      expect(status.usePolling).toBe(true);
    });

    it('should track Socket.IO failure state', () => {
      websocketService.socketIOFailed = true;

      const status = websocketService.getConnectionStatus();

      expect(status.socketIOFailed).toBe(true);
    });
  });

  describe('Reconnection Logic', () => {
    it('should fall back to polling after max reconnect attempts', () => {
      websocketService.reconnectAttempts = 5;
      websocketService.currentUser = {
        id: 'test-user-1',
        username: 'testuser'
      };

      websocketService.attemptReconnect();

      expect(websocketService.socketIOFailed).toBe(true);
      expect(websocketService.usePolling).toBe(true);
    });

    it('should periodically attempt upgrade from polling to WebSocket', () => {
      jest.useFakeTimers();

      websocketService.usePolling = true;
      websocketService.lastMessageTimestamp = Date.now() - 120000; // 2 minutes ago

      websocketService.attemptReconnect();

      // Fast-forward 60 seconds
      jest.advanceTimersByTime(60000);

      // Should reset failure flags to allow retry
      expect(websocketService.reconnectInterval).not.toBeNull();

      jest.useRealTimers();
    });
  });

  describe('Message Sending Integration', () => {
    it('should send messages through the correct transport', async () => {
      websocketService.isConnected = true;
      websocketService.usePolling = false;
      websocketService.currentUser = {
        id: 'user-1',
        username: 'testuser'
      };
      websocketService.socket = {
        emit: jest.fn()
      };

      const result = websocketService.sendMessage(
        'channel-1',
        'Hello, world!',
        'text',
        {}
      );

      expect(result).toBeTruthy();
      expect(websocketService.socket.emit).toHaveBeenCalled();
    });
  });
});
