import React from 'react';
import { render, fireEvent, waitFor, screen, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import CrashSafeChatArea from '../../src/components/chat/CrashSafeChatArea';
import { createMockMessage, createMockUser } from '../__mocks__/testData';

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Mock crash reporting service
jest.mock('../../src/services/CrashReportingService', () => ({
  reportError: jest.fn(),
  reportPerformanceIssue: jest.fn(),
}));

// Mock socket service
const mockSocketService = {
  sendMessage: jest.fn(),
  subscribeToMessages: jest.fn(),
  unsubscribeFromMessages: jest.fn(),
  isConnected: true,
  reconnect: jest.fn(),
};

jest.mock('../../src/services/SocketService', () => mockSocketService);

// Mock virtual scroll
jest.mock('../../src/hooks/use-crash-safe-virtual-scroll', () => ({
  useCrashSafeVirtualScroll: () => ({
    scrollToTop: jest.fn(),
    scrollToBottom: jest.fn(),
    onScrollToIndexFailed: jest.fn(),
    renderItem: ({ item }: any) => item,
    getItemLayout: jest.fn(),
  }),
}));

describe('CrashSafeChatArea', () => {
  const mockMessages = [
    createMockMessage({ id: '1', content: 'Hello world!', timestamp: new Date() }),
    createMockMessage({ id: '2', content: 'How are you?', timestamp: new Date() }),
    createMockMessage({ id: '3', content: 'Great chat app!', timestamp: new Date() }),
  ];

  const mockCurrentUser = createMockUser({ id: 'user1', username: 'testuser' });
  const mockChannelId = 'channel123';

  beforeEach(() => {
    jest.clearAllMocks();
    mockSocketService.sendMessage.mockClear();
    mockSocketService.subscribeToMessages.mockClear();
    mockSocketService.unsubscribeFromMessages.mockClear();
  });

  const defaultProps = {
    channelId: mockChannelId,
    messages: mockMessages,
    currentUser: mockCurrentUser,
    onSendMessage: jest.fn(),
    onEditMessage: jest.fn(),
    onDeleteMessage: jest.fn(),
    onLoadMore: jest.fn(),
  };

  test('renders chat area with messages', () => {
    render(<CrashSafeChatArea {...defaultProps} />);
    
    expect(screen.getByTestID('crash-safe-chat-area')).toBeTruthy();
    expect(screen.getByText('Hello world!')).toBeTruthy();
    expect(screen.getByText('How are you?')).toBeTruthy();
    expect(screen.getByText('Great chat app!')).toBeTruthy();
  });

  test('renders empty state when no messages', () => {
    render(<CrashSafeChatArea {...defaultProps} messages={[]} />);
    
    expect(screen.getByTestID('empty-chat-state')).toBeTruthy();
    expect(screen.getByText('No messages yet')).toBeTruthy();
    expect(screen.getByText('Start a conversation!')).toBeTruthy();
  });

  test('renders loading state', () => {
    render(<CrashSafeChatArea {...defaultProps} loading={true} />);
    
    expect(screen.getByTestID('chat-loading-indicator')).toBeTruthy();
    expect(screen.getByText('Loading messages...')).toBeTruthy();
  });

  test('handles message sending', async () => {
    const onSendMessage = jest.fn();
    render(<CrashSafeChatArea {...defaultProps} onSendMessage={onSendMessage} />);
    
    const messageInput = screen.getByTestID('message-input');
    const sendButton = screen.getByTestID('send-button');
    
    fireEvent.changeText(messageInput, 'New test message');
    fireEvent.press(sendButton);
    
    await waitFor(() => {
      expect(onSendMessage).toHaveBeenCalledWith('New test message');
    });
    
    // Input should be cleared after sending
    expect(messageInput.props.value).toBe('');
  });

  test('prevents sending empty messages', async () => {
    const onSendMessage = jest.fn();
    render(<CrashSafeChatArea {...defaultProps} onSendMessage={onSendMessage} />);
    
    const sendButton = screen.getByTestID('send-button');
    fireEvent.press(sendButton);
    
    expect(onSendMessage).not.toHaveBeenCalled();
  });

  test('handles message editing', async () => {
    const onEditMessage = jest.fn();
    render(<CrashSafeChatArea {...defaultProps} onEditMessage={onEditMessage} />);
    
    const firstMessage = screen.getByTestID('message-1');
    
    // Long press to show context menu
    fireEvent(firstMessage, 'longPress');
    
    await waitFor(() => {
      expect(screen.getByTestID('edit-message-option')).toBeTruthy();
    });
    
    fireEvent.press(screen.getByTestID('edit-message-option'));
    
    await waitFor(() => {
      const editInput = screen.getByTestID('edit-message-input');
      fireEvent.changeText(editInput, 'Edited message content');
      fireEvent.press(screen.getByTestID('save-edit-button'));
    });
    
    await waitFor(() => {
      expect(onEditMessage).toHaveBeenCalledWith('1', 'Edited message content');
    });
  });

  test('handles message deletion', async () => {
    const onDeleteMessage = jest.fn();
    render(<CrashSafeChatArea {...defaultProps} onDeleteMessage={onDeleteMessage} />);
    
    const firstMessage = screen.getByTestID('message-1');
    
    // Long press to show context menu
    fireEvent(firstMessage, 'longPress');
    
    await waitFor(() => {
      expect(screen.getByTestID('delete-message-option')).toBeTruthy();
    });
    
    fireEvent.press(screen.getByTestID('delete-message-option'));
    
    // Confirm deletion
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    });
    
    // Simulate confirming deletion
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const confirmCallback = alertCall[2][1].onPress;
    
    act(() => {
      confirmCallback();
    });
    
    await waitFor(() => {
      expect(onDeleteMessage).toHaveBeenCalledWith('1');
    });
  });

  test('shows typing indicator when users are typing', async () => {
    render(<CrashSafeChatArea {...defaultProps} typingUsers={[{ username: 'otheruser' }]} />);
    
    expect(screen.getByTestID('typing-indicator')).toBeTruthy();
    expect(screen.getByText('otheruser is typing...')).toBeTruthy();
  });

  test('shows multiple users typing', async () => {
    const typingUsers = [
      { username: 'user1' },
      { username: 'user2' },
      { username: 'user3' },
    ];
    
    render(<CrashSafeChatArea {...defaultProps} typingUsers={typingUsers} />);
    
    expect(screen.getByText('user1, user2, user3 are typing...')).toBeTruthy();
  });

  test('handles scroll to bottom', async () => {
    render(<CrashSafeChatArea {...defaultProps} />);
    
    const scrollToBottomButton = screen.getByTestID('scroll-to-bottom-button');
    fireEvent.press(scrollToBottomButton);
    
    // Button should hide after scrolling to bottom
    await waitFor(() => {
      expect(screen.queryByTestID('scroll-to-bottom-button')).toBeFalsy();
    });
  });

  test('handles pull to refresh', async () => {
    const onLoadMore = jest.fn();
    render(<CrashSafeChatArea {...defaultProps} onLoadMore={onLoadMore} />);
    
    const scrollView = screen.getByTestID('messages-scroll-view');
    fireEvent(scrollView, 'refresh');
    
    await waitFor(() => {
      expect(onLoadMore).toHaveBeenCalled();
    });
  });

  test('handles crash recovery', async () => {
    const crashReportService = require('../../src/services/CrashReportingService');
    
    // Simulate a render error
    const ErrorComponent = () => {
      throw new Error('Test render error');
    };
    
    const props = {
      ...defaultProps,
      renderMessage: () => <ErrorComponent />,
    };
    
    render(<CrashSafeChatArea {...props} />);
    
    await waitFor(() => {
      expect(screen.getByTestID('error-boundary-fallback')).toBeTruthy();
      expect(screen.getByText('Something went wrong')).toBeTruthy();
      expect(screen.getByTestID('retry-button')).toBeTruthy();
    });
    
    expect(crashReportService.reportError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        component: 'CrashSafeChatArea',
        action: 'render'
      })
    );
  });

  test('recovers from crash when retry is pressed', async () => {
    const ErrorComponent = () => {
      throw new Error('Test render error');
    };
    
    let shouldError = true;
    const ConditionalErrorComponent = () => {
      if (shouldError) {
        throw new Error('Test render error');
      }
      return null;
    };
    
    const props = {
      ...defaultProps,
      renderMessage: () => <ConditionalErrorComponent />,
    };
    
    render(<CrashSafeChatArea {...props} />);
    
    await waitFor(() => {
      expect(screen.getByTestID('error-boundary-fallback')).toBeTruthy();
    });
    
    // Fix the error condition
    shouldError = false;
    
    // Press retry button
    fireEvent.press(screen.getByTestID('retry-button'));
    
    await waitFor(() => {
      expect(screen.queryByTestID('error-boundary-fallback')).toBeFalsy();
      expect(screen.getByTestID('crash-safe-chat-area')).toBeTruthy();
    });
  });

  test('handles network errors gracefully', async () => {
    const onSendMessage = jest.fn().mockRejectedValue(new Error('Network error'));
    
    render(<CrashSafeChatArea {...defaultProps} onSendMessage={onSendMessage} />);
    
    const messageInput = screen.getByTestID('message-input');
    const sendButton = screen.getByTestID('send-button');
    
    fireEvent.changeText(messageInput, 'Test message');
    fireEvent.press(sendButton);
    
    await waitFor(() => {
      expect(screen.getByTestID('error-message')).toBeTruthy();
      expect(screen.getByText('Failed to send message')).toBeTruthy();
      expect(screen.getByTestID('retry-send-button')).toBeTruthy();
    });
  });

  test('retries failed message sending', async () => {
    const onSendMessage = jest.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(true);
    
    render(<CrashSafeChatArea {...defaultProps} onSendMessage={onSendMessage} />);
    
    const messageInput = screen.getByTestID('message-input');
    const sendButton = screen.getByTestID('send-button');
    
    fireEvent.changeText(messageInput, 'Test message');
    fireEvent.press(sendButton);
    
    await waitFor(() => {
      expect(screen.getByTestID('retry-send-button')).toBeTruthy();
    });
    
    fireEvent.press(screen.getByTestID('retry-send-button'));
    
    await waitFor(() => {
      expect(onSendMessage).toHaveBeenCalledTimes(2);
      expect(screen.queryByTestID('error-message')).toBeFalsy();
    });
  });

  test('handles message attachment upload', async () => {
    render(<CrashSafeChatArea {...defaultProps} />);
    
    const attachButton = screen.getByTestID('attach-button');
    fireEvent.press(attachButton);
    
    await waitFor(() => {
      expect(screen.getByTestID('attachment-options')).toBeTruthy();
      expect(screen.getByTestID('camera-option')).toBeTruthy();
      expect(screen.getByTestID('gallery-option')).toBeTruthy();
      expect(screen.getByTestID('file-option')).toBeTruthy();
    });
    
    fireEvent.press(screen.getByTestID('gallery-option'));
    
    await waitFor(() => {
      expect(screen.getByTestID('attachment-preview')).toBeTruthy();
    });
  });

  test('shows connection status indicator', () => {
    render(<CrashSafeChatArea {...defaultProps} connected={false} />);
    
    expect(screen.getByTestID('connection-indicator')).toBeTruthy();
    expect(screen.getByText('Connecting...')).toBeTruthy();
  });

  test('handles reconnection', async () => {
    render(<CrashSafeChatArea {...defaultProps} connected={false} />);
    
    const reconnectButton = screen.getByTestID('reconnect-button');
    fireEvent.press(reconnectButton);
    
    await waitFor(() => {
      expect(mockSocketService.reconnect).toHaveBeenCalled();
    });
  });

  test('preserves scroll position when new messages arrive', async () => {
    const { rerender } = render(<CrashSafeChatArea {...defaultProps} />);
    
    // Scroll to middle position
    const scrollView = screen.getByTestID('messages-scroll-view');
    fireEvent.scroll(scrollView, { nativeEvent: { contentOffset: { y: 500 } } });
    
    // Add new messages
    const newMessages = [
      ...mockMessages,
      createMockMessage({ id: '4', content: 'New message', timestamp: new Date() }),
    ];
    
    rerender(<CrashSafeChatArea {...defaultProps} messages={newMessages} />);
    
    // Scroll position should be preserved
    expect(screen.getByTestID('scroll-to-bottom-button')).toBeTruthy();
  });

  test('auto-scrolls to bottom for own messages', async () => {
    render(<CrashSafeChatArea {...defaultProps} />);
    
    const messageInput = screen.getByTestID('message-input');
    const sendButton = screen.getByTestID('send-button');
    
    fireEvent.changeText(messageInput, 'My new message');
    fireEvent.press(sendButton);
    
    // Should auto-scroll to bottom after sending own message
    await waitFor(() => {
      expect(screen.queryByTestID('scroll-to-bottom-button')).toBeFalsy();
    });
  });

  test('shows message reactions', () => {
    const messagesWithReactions = [
      {
        ...mockMessages[0],
        reactions: [
          { emoji: '👍', count: 3, users: ['user1', 'user2', 'user3'] },
          { emoji: '❤️', count: 1, users: ['user1'] },
        ],
      },
    ];
    
    render(<CrashSafeChatArea {...defaultProps} messages={messagesWithReactions} />);
    
    expect(screen.getByTestID('message-reactions')).toBeTruthy();
    expect(screen.getByText('👍 3')).toBeTruthy();
    expect(screen.getByText('❤️ 1')).toBeTruthy();
  });

  test('handles message reaction tap', async () => {
    const onReactToMessage = jest.fn();
    const messagesWithReactions = [
      {
        ...mockMessages[0],
        reactions: [{ emoji: '👍', count: 3, users: ['user1', 'user2', 'user3'] }],
      },
    ];
    
    render(
      <CrashSafeChatArea 
        {...defaultProps} 
        messages={messagesWithReactions}
        onReactToMessage={onReactToMessage}
      />
    );
    
    const reactionButton = screen.getByTestID('reaction-👍');
    fireEvent.press(reactionButton);
    
    await waitFor(() => {
      expect(onReactToMessage).toHaveBeenCalledWith('1', '👍');
    });
  });

  test('shows emoji picker for reactions', async () => {
    render(<CrashSafeChatArea {...defaultProps} />);
    
    const firstMessage = screen.getByTestID('message-1');
    fireEvent(firstMessage, 'longPress');
    
    await waitFor(() => {
      fireEvent.press(screen.getByTestID('react-message-option'));
    });
    
    await waitFor(() => {
      expect(screen.getByTestID('emoji-picker')).toBeTruthy();
    });
  });

  test('handles performance monitoring', () => {
    const crashReportService = require('../../src/services/CrashReportingService');
    
    // Render with many messages to test performance
    const manyMessages = Array.from({ length: 1000 }, (_, i) =>
      createMockMessage({ id: `${i}`, content: `Message ${i}`, timestamp: new Date() })
    );
    
    const startTime = Date.now();
    render(<CrashSafeChatArea {...defaultProps} messages={manyMessages} />);
    const renderTime = Date.now() - startTime;
    
    if (renderTime > 100) { // 100ms threshold
      expect(crashReportService.reportPerformanceIssue).toHaveBeenCalledWith({
        component: 'CrashSafeChatArea',
        metric: 'render_time',
        value: renderTime,
        threshold: 100,
      });
    }
  });
});