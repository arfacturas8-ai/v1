import { renderHook, act, waitFor } from '@testing-library/react';
import { useWebSocket } from '../useWebSocket';
import { io } from 'socket.io-client';

// Mock socket.io-client
jest.mock('socket.io-client');

describe('useWebSocket', () => {
  let mockSocket;

  beforeEach(() => {
    mockSocket = {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      connected: false
    };

    io.mockReturnValue(mockSocket);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize socket connection', () => {
    const { result } = renderHook(() => useWebSocket('http://localhost:3001'));

    expect(io).toHaveBeenCalledWith('http://localhost:3001', expect.any(Object));
  });

  it('should handle connection event', async () => {
    const { result } = renderHook(() => useWebSocket('http://localhost:3001'));

    const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];

    act(() => {
      mockSocket.connected = true;
      connectHandler();
    });

    await waitFor(() => {
      expect(result.current.connected).toBe(true);
    });
  });

  it('should handle disconnect event', async () => {
    const { result } = renderHook(() => useWebSocket('http://localhost:3001'));

    const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1];

    act(() => {
      mockSocket.connected = false;
      disconnectHandler();
    });

    await waitFor(() => {
      expect(result.current.connected).toBe(false);
    });
  });

  it('should emit events', () => {
    const { result } = renderHook(() => useWebSocket('http://localhost:3001'));

    act(() => {
      result.current.emit('test-event', { data: 'test' });
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('test-event', { data: 'test' });
  });

  it('should handle custom event listeners', () => {
    const mockHandler = jest.fn();
    const { result } = renderHook(() => useWebSocket('http://localhost:3001'));

    act(() => {
      result.current.on('custom-event', mockHandler);
    });

    expect(mockSocket.on).toHaveBeenCalledWith('custom-event', mockHandler);
  });

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => useWebSocket('http://localhost:3001'));

    unmount();

    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('should handle connection errors', async () => {
    const { result } = renderHook(() => useWebSocket('http://localhost:3001'));

    const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')[1];
    const error = new Error('Connection failed');

    act(() => {
      errorHandler(error);
    });

    await waitFor(() => {
      expect(result.current.error).toBe(error);
    });
  });

  it('should reconnect after disconnect', async () => {
    const { result } = renderHook(() => useWebSocket('http://localhost:3001'));

    const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1];

    act(() => {
      disconnectHandler();
    });

    await waitFor(() => {
      expect(mockSocket.connect).toHaveBeenCalled();
    });
  });
});
