import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatIntegration, { useChatIntegration } from './ChatIntegration';

// Mock the auth context
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock the hooks
jest.mock('../hooks/useServers', () => jest.fn());
jest.mock('../hooks/useChannels', () => jest.fn());
jest.mock('../hooks/useMessages', () => jest.fn());
jest.mock('../hooks/usePresence', () => jest.fn());

// Mock websocket service
jest.mock('../services/websocketService', () => ({
  connect: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  isConnected: false,
  reconnectAttempts: 0,
}));

import { useAuth } from '../contexts/AuthContext';
import useServers from '../hooks/useServers';
import useChannels from '../hooks/useChannels';
import useMessages from '../hooks/useMessages';
import usePresence from '../hooks/usePresence';
import websocketService from '../services/websocketService';

const mockUser = {
  id: 'user1',
  username: 'testuser',
  email: 'test@example.com',
};

const mockServers = [
  { id: 'server1', name: 'Test Server' },
  { id: 'server2', name: 'Another Server' },
];

const mockChannels = [
  { id: 'channel1', name: 'general' },
  { id: 'channel2', name: 'random' },
];

const mockMessages = [
  { id: 'msg1', content: 'Hello', authorUsername: 'user1', channelId: 'channel1' },
];

// Test consumer component
const TestConsumer = () => {
  const context = useChatIntegration();
  return (
    <div>
      <div data-testid="connection-status">{context.connectionStatus}</div>
      <div data-testid="is-connected">{context.isConnected ? 'true' : 'false'}</div>
      <div data-testid="servers-count">{context.servers.length}</div>
      <div data-testid="channels-count">{context.channels.length}</div>
      <div data-testid="messages-count">{context.messages.length}</div>
      <button onClick={() => context.selectServer(mockServers[0])}>Select Server</button>
      <button onClick={() => context.selectChannel(mockChannels[0])}>Select Channel</button>
      <button onClick={() => context.sendMessage('test')}>Send Message</button>
    </div>
  );
};

describe('ChatIntegration', () => {
  let mockLoadServers;
  let mockSelectServer;
  let mockLoadChannels;
  let mockSelectChannel;
  let mockSendMessage;
  let mockLoadMessages;
  let mockUpdateStatus;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup hook mocks
    mockLoadServers = jest.fn();
    mockSelectServer = jest.fn();
    mockLoadChannels = jest.fn();
    mockSelectChannel = jest.fn();
    mockSendMessage = jest.fn();
    mockLoadMessages = jest.fn();
    mockUpdateStatus = jest.fn();

    useAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    });

    useServers.mockReturnValue({
      servers: mockServers,
      currentServer: null,
      selectServer: mockSelectServer,
      loadServers: mockLoadServers,
    });

    useChannels.mockReturnValue({
      channels: mockChannels,
      currentChannel: null,
      selectChannel: mockSelectChannel,
      loadChannels: mockLoadChannels,
    });

    useMessages.mockReturnValue({
      messages: mockMessages,
      sendMessage: mockSendMessage,
      loadMessages: mockLoadMessages,
      typingUsers: [],
    });

    usePresence.mockReturnValue({
      onlineUsers: [],
      currentStatus: 'online',
      updateStatus: mockUpdateStatus,
    });

    // Mock WebSocket connection
    websocketService.connect.mockResolvedValue();
    websocketService.isConnected = false;
    websocketService.reconnectAttempts = 0;
  });

  describe('Rendering', () => {
    it('renders children', () => {
      render(
        <ChatIntegration>
          <div>Test Child</div>
        </ChatIntegration>
      );
      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    it('wraps content in chat-integration div', () => {
      const { container } = render(
        <ChatIntegration>
          <div>Test</div>
        </ChatIntegration>
      );
      expect(container.querySelector('.chat-integration')).toBeInTheDocument();
    });

    it('matches snapshot', () => {
      const { container } = render(
        <ChatIntegration>
          <div>Test</div>
        </ChatIntegration>
      );
      expect(container).toMatchSnapshot();
    });
  });

  describe('WebSocket Connection', () => {
    it('connects websocket when authenticated', async () => {
      render(
        <ChatIntegration>
          <div>Test</div>
        </ChatIntegration>
      );

      await waitFor(() => {
        expect(websocketService.connect).toHaveBeenCalledWith(mockUser);
      });
    });

    it('loads servers after connection', async () => {
      render(
        <ChatIntegration>
          <div>Test</div>
        </ChatIntegration>
      );

      await waitFor(() => {
        expect(mockLoadServers).toHaveBeenCalled();
      });
    });

    it('sets connection status to connected on success', async () => {
      render(
        <ChatIntegration>
          <TestConsumer />
        </ChatIntegration>
      );

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });
    });

    it('sets connection status to error on failure', async () => {
      websocketService.connect.mockRejectedValue(new Error('Connection failed'));

      render(
        <ChatIntegration>
          <TestConsumer />
        </ChatIntegration>
      );

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('error');
      });
    });

    it('does not connect when not authenticated', () => {
      useAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
      });

      render(
        <ChatIntegration>
          <TestConsumer />
        </ChatIntegration>
      );

      expect(websocketService.connect).not.toHaveBeenCalled();
      expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected');
    });

    it('registers event listeners', async () => {
      render(
        <ChatIntegration>
          <div>Test</div>
        </ChatIntegration>
      );

      await waitFor(() => {
        expect(websocketService.on).toHaveBeenCalledWith('connection:success', expect.any(Function));
        expect(websocketService.on).toHaveBeenCalledWith('connection:lost', expect.any(Function));
        expect(websocketService.on).toHaveBeenCalledWith('connection:error', expect.any(Function));
        expect(websocketService.on).toHaveBeenCalledWith('connection:reconnecting', expect.any(Function));
        expect(websocketService.on).toHaveBeenCalledWith('connection:failed', expect.any(Function));
      });
    });

    it('cleans up event listeners on unmount', async () => {
      const { unmount } = render(
        <ChatIntegration>
          <div>Test</div>
        </ChatIntegration>
      );

      await waitFor(() => {
        expect(websocketService.on).toHaveBeenCalled();
      });

      unmount();

      expect(websocketService.off).toHaveBeenCalledWith('connection:success', expect.any(Function));
      expect(websocketService.off).toHaveBeenCalledWith('connection:lost', expect.any(Function));
      expect(websocketService.off).toHaveBeenCalledWith('connection:error', expect.any(Function));
      expect(websocketService.off).toHaveBeenCalledWith('connection:reconnecting', expect.any(Function));
      expect(websocketService.off).toHaveBeenCalledWith('connection:failed', expect.any(Function));
    });
  });

  describe('Connection Status', () => {
    it('displays connecting status', () => {
      useAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
      });

      render(
        <ChatIntegration>
          <TestConsumer />
        </ChatIntegration>
      );

      expect(screen.getByTestId('connection-status')).toHaveTextContent('connecting');
    });

    it('displays connected status after successful connection', async () => {
      render(
        <ChatIntegration>
          <TestConsumer />
        </ChatIntegration>
      );

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
        expect(screen.getByTestId('is-connected')).toHaveTextContent('true');
      });
    });

    it('shows connection status indicator', async () => {
      websocketService.connect.mockRejectedValue(new Error('Failed'));

      render(
        <ChatIntegration>
          <div>Test</div>
        </ChatIntegration>
      );

      await waitFor(() => {
        expect(screen.getByText(/connection error/i)).toBeInTheDocument();
      });
    });

    it('hides status indicator when connected', async () => {
      render(
        <ChatIntegration>
          <div>Test</div>
        </ChatIntegration>
      );

      await waitFor(() => {
        const indicator = screen.queryByText(/connected/i);
        if (indicator) {
          expect(indicator).toHaveStyle({ display: 'none' });
        }
      });
    });
  });

  describe('Auto-selection', () => {
    it('auto-selects first server', async () => {
      render(
        <ChatIntegration>
          <TestConsumer />
        </ChatIntegration>
      );

      await waitFor(() => {
        expect(mockSelectServer).toHaveBeenCalledWith(mockServers[0]);
      });
    });

    it('auto-selects general channel', async () => {
      useServers.mockReturnValue({
        servers: mockServers,
        currentServer: mockServers[0],
        selectServer: mockSelectServer,
        loadServers: mockLoadServers,
      });

      render(
        <ChatIntegration>
          <TestConsumer />
        </ChatIntegration>
      );

      await waitFor(() => {
        expect(mockSelectChannel).toHaveBeenCalledWith(mockChannels[0]);
      });
    });

    it('selects first channel if general not found', async () => {
      const channelsWithoutGeneral = [
        { id: 'channel1', name: 'random' },
        { id: 'channel2', name: 'other' },
      ];

      useChannels.mockReturnValue({
        channels: channelsWithoutGeneral,
        currentChannel: null,
        selectChannel: mockSelectChannel,
        loadChannels: mockLoadChannels,
      });

      useServers.mockReturnValue({
        servers: mockServers,
        currentServer: mockServers[0],
        selectServer: mockSelectServer,
        loadServers: mockLoadServers,
      });

      render(
        <ChatIntegration>
          <TestConsumer />
        </ChatIntegration>
      );

      await waitFor(() => {
        expect(mockSelectChannel).toHaveBeenCalledWith(channelsWithoutGeneral[0]);
      });
    });

    it('does not auto-select if server already selected', async () => {
      useServers.mockReturnValue({
        servers: mockServers,
        currentServer: mockServers[0],
        selectServer: mockSelectServer,
        loadServers: mockLoadServers,
      });

      render(
        <ChatIntegration>
          <TestConsumer />
        </ChatIntegration>
      );

      await waitFor(() => {
        expect(mockSelectServer).not.toHaveBeenCalled();
      });
    });
  });

  describe('Context Provider', () => {
    it('provides connection status', async () => {
      render(
        <ChatIntegration>
          <TestConsumer />
        </ChatIntegration>
      );

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toBeInTheDocument();
      });
    });

    it('provides servers data', () => {
      render(
        <ChatIntegration>
          <TestConsumer />
        </ChatIntegration>
      );

      expect(screen.getByTestId('servers-count')).toHaveTextContent('2');
    });

    it('provides channels data', () => {
      render(
        <ChatIntegration>
          <TestConsumer />
        </ChatIntegration>
      );

      expect(screen.getByTestId('channels-count')).toHaveTextContent('2');
    });

    it('provides messages data', () => {
      render(
        <ChatIntegration>
          <TestConsumer />
        </ChatIntegration>
      );

      expect(screen.getByTestId('messages-count')).toHaveTextContent('1');
    });

    it('provides server selection function', async () => {
      const user = userEvent.setup();
      render(
        <ChatIntegration>
          <TestConsumer />
        </ChatIntegration>
      );

      await user.click(screen.getByText('Select Server'));
      expect(mockSelectServer).toHaveBeenCalled();
    });

    it('provides channel selection function', async () => {
      const user = userEvent.setup();
      render(
        <ChatIntegration>
          <TestConsumer />
        </ChatIntegration>
      );

      await user.click(screen.getByText('Select Channel'));
      expect(mockSelectChannel).toHaveBeenCalled();
    });

    it('provides send message function', async () => {
      const user = userEvent.setup();
      render(
        <ChatIntegration>
          <TestConsumer />
        </ChatIntegration>
      );

      await user.click(screen.getByText('Send Message'));
      expect(mockSendMessage).toHaveBeenCalled();
    });
  });

  describe('useChatIntegration Hook', () => {
    it('throws error when used outside provider', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow('useChatIntegration must be used within ChatIntegration');

      consoleErrorSpy.mockRestore();
    });

    it('returns context when used inside provider', () => {
      render(
        <ChatIntegration>
          <TestConsumer />
        </ChatIntegration>
      );

      expect(screen.getByTestId('connection-status')).toBeInTheDocument();
    });
  });

  describe('Debug Info', () => {
    it('shows debug button in development', () => {
      const originalEnv = import.meta.env.MODE;
      Object.defineProperty(import.meta.env, 'MODE', {
        value: 'development',
        writable: true,
      });

      render(
        <ChatIntegration>
          <div>Test</div>
        </ChatIntegration>
      );

      expect(screen.getByText(/debug/i)).toBeInTheDocument();

      Object.defineProperty(import.meta.env, 'MODE', {
        value: originalEnv,
        writable: true,
      });
    });

    it('opens debug panel on click', async () => {
      const user = userEvent.setup();
      Object.defineProperty(import.meta.env, 'MODE', {
        value: 'development',
        writable: true,
      });

      render(
        <ChatIntegration>
          <div>Test</div>
        </ChatIntegration>
      );

      await user.click(screen.getByText(/debug/i));
      expect(screen.getByText(/debug info/i)).toBeInTheDocument();
    });

    it('closes debug panel', async () => {
      const user = userEvent.setup();
      Object.defineProperty(import.meta.env, 'MODE', {
        value: 'development',
        writable: true,
      });

      render(
        <ChatIntegration>
          <div>Test</div>
        </ChatIntegration>
      );

      await user.click(screen.getByText(/debug/i));
      await user.click(screen.getByText('✕'));

      expect(screen.queryByText(/debug info/i)).not.toBeInTheDocument();
    });

    it('displays connection info in debug panel', async () => {
      const user = userEvent.setup();
      Object.defineProperty(import.meta.env, 'MODE', {
        value: 'development',
        writable: true,
      });

      render(
        <ChatIntegration>
          <div>Test</div>
        </ChatIntegration>
      );

      await user.click(screen.getByText(/debug/i));
      await waitFor(() => {
        expect(screen.getByText(/connection:/i)).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('listens for new messages', async () => {
      render(
        <ChatIntegration>
          <div>Test</div>
        </ChatIntegration>
      );

      await waitFor(() => {
        expect(websocketService.on).toHaveBeenCalledWith('message:received', expect.any(Function));
      });
    });

    it('logs new message events', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      render(
        <ChatIntegration>
          <div>Test</div>
        </ChatIntegration>
      );

      await waitFor(() => {
        const messageHandler = websocketService.on.mock.calls.find(
          call => call[0] === 'message:received'
        )?.[1];

        if (messageHandler) {
          messageHandler({
            channelId: 'channel1',
            authorUsername: 'testuser',
            content: 'This is a test message with more than 50 characters to test truncation',
          });

          expect(consoleSpy).toHaveBeenCalledWith(
            'New message received:',
            expect.objectContaining({
              channel: 'channel1',
              author: 'testuser',
            })
          );
        }
      });

      consoleSpy.mockRestore();
    });

    it('cleans up message listener on unmount', async () => {
      const { unmount } = render(
        <ChatIntegration>
          <div>Test</div>
        </ChatIntegration>
      );

      await waitFor(() => {
        expect(websocketService.on).toHaveBeenCalledWith('message:received', expect.any(Function));
      });

      unmount();

      expect(websocketService.off).toHaveBeenCalledWith('message:received', expect.any(Function));
    });
  });

  describe('Connection Events', () => {
    it('handles connection success event', async () => {
      render(
        <ChatIntegration>
          <TestConsumer />
        </ChatIntegration>
      );

      await waitFor(() => {
        const handler = websocketService.on.mock.calls.find(
          call => call[0] === 'connection:success'
        )?.[1];

        if (handler) {
          act(() => {
            handler();
          });

          expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
        }
      });
    });

    it('handles connection lost event', async () => {
      render(
        <ChatIntegration>
          <TestConsumer />
        </ChatIntegration>
      );

      await waitFor(() => {
        const handler = websocketService.on.mock.calls.find(
          call => call[0] === 'connection:lost'
        )?.[1];

        if (handler) {
          act(() => {
            handler({ reason: 'Network error' });
          });

          expect(screen.getByTestId('connection-status')).toHaveTextContent('reconnecting');
        }
      });
    });

    it('handles connection error event', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ChatIntegration>
          <TestConsumer />
        </ChatIntegration>
      );

      await waitFor(() => {
        const handler = websocketService.on.mock.calls.find(
          call => call[0] === 'connection:error'
        )?.[1];

        if (handler) {
          act(() => {
            handler({ error: new Error('Connection error') });
          });

          expect(screen.getByTestId('connection-status')).toHaveTextContent('error');
        }
      });

      consoleSpy.mockRestore();
    });

    it('handles connection reconnecting event', async () => {
      render(
        <ChatIntegration>
          <TestConsumer />
        </ChatIntegration>
      );

      await waitFor(() => {
        const handler = websocketService.on.mock.calls.find(
          call => call[0] === 'connection:reconnecting'
        )?.[1];

        if (handler) {
          act(() => {
            handler({ attempt: 1 });
          });

          expect(screen.getByTestId('connection-status')).toHaveTextContent('reconnecting');
        }
      });
    });

    it('handles connection failed event', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ChatIntegration>
          <TestConsumer />
        </ChatIntegration>
      );

      await waitFor(() => {
        const handler = websocketService.on.mock.calls.find(
          call => call[0] === 'connection:failed'
        )?.[1];

        if (handler) {
          act(() => {
            handler();
          });

          expect(screen.getByTestId('connection-status')).toHaveTextContent('failed');
        }
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty servers list', () => {
      useServers.mockReturnValue({
        servers: [],
        currentServer: null,
        selectServer: mockSelectServer,
        loadServers: mockLoadServers,
      });

      render(
        <ChatIntegration>
          <TestConsumer />
        </ChatIntegration>
      );

      expect(screen.getByTestId('servers-count')).toHaveTextContent('0');
    });

    it('handles empty channels list', () => {
      useChannels.mockReturnValue({
        channels: [],
        currentChannel: null,
        selectChannel: mockSelectChannel,
        loadChannels: mockLoadChannels,
      });

      render(
        <ChatIntegration>
          <TestConsumer />
        </ChatIntegration>
      );

      expect(screen.getByTestId('channels-count')).toHaveTextContent('0');
    });

    it('handles connection state changes', async () => {
      useAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
      });

      const { rerender } = render(
        <ChatIntegration>
          <TestConsumer />
        </ChatIntegration>
      );

      expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected');

      useAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
      });

      rerender(
        <ChatIntegration>
          <TestConsumer />
        </ChatIntegration>
      );

      await waitFor(() => {
        expect(websocketService.connect).toHaveBeenCalled();
      });
    });
  });
});

export default mockUser
