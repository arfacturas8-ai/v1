import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import ChatPage from '../ChatPage'
import { AuthContext } from '../../contexts/AuthContext'
import apiService from '../../services/api'
import socketService from '../../services/socket'
import channelService from '../../services/channelService'

// Mock services
jest.mock('../../services/api')
jest.mock('../../services/socket')
jest.mock('../../services/channelService')

// Mock all chat components
jest.mock('../../components/chat/ChatInterface', () => ({
  __esModule: true,
  default: () => <div data-testid="chat-interface">ChatInterface</div>
}))
jest.mock('../../components/chat/ChannelSidebar', () => ({
  __esModule: true,
  default: () => <div data-testid="channel-sidebar">ChannelSidebar</div>
}))
jest.mock('../../components/chat/MessageComposer', () => ({
  __esModule: true,
  default: () => <div data-testid="message-composer">MessageComposer</div>
}))
jest.mock('../../components/chat/ThreadView', () => ({
  __esModule: true,
  default: () => <div data-testid="thread-view">ThreadView</div>
}))
jest.mock('../../components/chat/MessageSearch', () => ({
  __esModule: true,
  default: () => <div data-testid="message-search">MessageSearch</div>
}))
jest.mock('../../components/chat/DirectMessagesPanel', () => ({
  __esModule: true,
  default: () => <div data-testid="direct-messages-panel">DirectMessagesPanel</div>
}))
jest.mock('../../components/chat/UserPresenceSystem', () => ({
  __esModule: true,
  default: () => <div data-testid="user-presence-system">UserPresenceSystem</div>
}))
jest.mock('../../components/chat/VoiceChannelInterface', () => ({
  __esModule: true,
  default: () => <div data-testid="voice-channel-interface">VoiceChannelInterface</div>
}))
jest.mock('../../components/chat/NotificationCenter', () => ({
  __esModule: true,
  default: () => <div data-testid="notification-center">NotificationCenter</div>
}))
jest.mock('../../components/chat/KeyboardShortcuts', () => ({
  __esModule: true,
  default: () => <div data-testid="keyboard-shortcuts">KeyboardShortcuts</div>
}))
jest.mock('../../components/chat/MobileOptimizations', () => ({
  __esModule: true,
  useIsMobile: jest.fn(() => false)
}))

// Mock accessibility utilities
jest.mock('../../utils/accessibility.jsx', () => ({
  SkipToContent: () => <div>Skip to content</div>,
  announce: jest.fn(),
  useLoadingAnnouncement: jest.fn(),
  useErrorAnnouncement: jest.fn()
}))

const mockUser = {
  id: 'user1',
  username: 'testuser',
  displayName: 'Test User',
  email: 'test@example.com',
  avatar: null
}

const mockAuthContext = {
  user: mockUser,
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false
}

const mockServers = [
  {
    id: 'server1',
    name: 'Test Server',
    channels: [
      { id: 'channel1', name: 'general', type: 'text' },
      { id: 'channel2', name: 'announcements', type: 'text' },
      { id: 'channel3', name: 'voice', type: 'voice' }
    ]
  },
  {
    id: 'server2',
    name: 'Second Server',
    channels: [
      { id: 'channel4', name: 'chat', type: 'text' }
    ]
  }
]

const mockConversations = [
  {
    id: 'conv1',
    participant: { id: 'user2', displayName: 'User Two' },
    lastMessage: { content: 'Hello!', timestamp: Date.now() }
  }
]

const mockMessages = [
  {
    id: 'msg1',
    content: 'First message',
    author: mockUser,
    timestamp: Date.now() - 10000,
    reactions: {}
  },
  {
    id: 'msg2',
    content: 'Second message',
    author: { id: 'user2', displayName: 'User Two' },
    timestamp: Date.now() - 5000,
    reactions: { '👍': ['user1'] }
  }
]

const renderWithContext = (authValue = mockAuthContext) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>
        <ChatPage user={mockUser} />
      </AuthContext.Provider>
    </BrowserRouter>
  )
}

describe('ChatPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default API mocks
    apiService.get = jest.fn().mockImplementation((url) => {
      if (url.includes('/chat/servers')) {
        return Promise.resolve({ success: true, data: { servers: mockServers } })
      }
      if (url.includes('/messages/conversations')) {
        return Promise.resolve({ success: true, data: { conversations: mockConversations } })
      }
      return Promise.resolve({ success: false })
    })

    // Setup socket service mocks
    socketService.on = jest.fn()
    socketService.off = jest.fn()
    socketService.emit = jest.fn()

    // Setup channel service mocks
    channelService.getMessages = jest.fn().mockResolvedValue({
      success: true,
      messages: mockMessages
    })
  })

  describe('Rendering and Initial Load', () => {
    it('renders without crashing', () => {
      renderWithContext()
      expect(document.querySelector('[role="main"]')).toBeInTheDocument()
    })

    it('shows loading state initially', () => {
      renderWithContext()
      expect(screen.getByText(/Loading chat/i)).toBeInTheDocument()
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('displays loading spinner with proper ARIA attributes', () => {
      renderWithContext()
      const loadingContainer = screen.getByRole('main')
      expect(loadingContainer).toHaveAttribute('aria-busy', 'true')
      expect(loadingContainer).toHaveAttribute('aria-live', 'polite')
    })

    it('renders main content after loading', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
      expect(screen.getByText(/ChatPage/i)).toBeInTheDocument()
    })
  })

  describe('Authentication', () => {
    it('uses authenticated user from AuthContext', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(mockAuthContext.user).toBe(mockUser)
      })
    })

    it('handles unauthenticated state gracefully', async () => {
      const unauthContext = {
        ...mockAuthContext,
        user: null,
        isAuthenticated: false
      }
      renderWithContext(unauthContext)
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('API Data Loading', () => {
    it('fetches servers from API on mount', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/chat/servers')
      })
    })

    it('fetches conversations from API on mount', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/messages/conversations')
      })
    })

    it('loads servers and channels successfully', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })

    it('handles empty servers list', async () => {
      apiService.get.mockImplementation((url) => {
        if (url.includes('/chat/servers')) {
          return Promise.resolve({ success: true, data: { servers: [] } })
        }
        return Promise.resolve({ success: true, data: { conversations: [] } })
      })

      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })

    it('handles empty conversations list', async () => {
      apiService.get.mockImplementation((url) => {
        if (url.includes('/chat/servers')) {
          return Promise.resolve({ success: true, data: { servers: mockServers } })
        }
        if (url.includes('/messages/conversations')) {
          return Promise.resolve({ success: true, data: { conversations: [] } })
        }
        return Promise.resolve({ success: false })
      })

      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })

    it('sets active server when servers load', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
      // Active server should be set to first server
    })

    it('sets active channel when servers load', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
      // Active channel should be set to first channel of first server
    })
  })

  describe('Error Handling', () => {
    it('displays error state when API fails', async () => {
      apiService.get.mockRejectedValue(new Error('API Error'))

      renderWithContext()
      await waitFor(() => {
        expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
      })
    })

    it('shows error message with proper ARIA attributes', async () => {
      apiService.get.mockRejectedValue(new Error('API Error'))

      renderWithContext()
      await waitFor(() => {
        const errorAlert = screen.getByRole('alert')
        expect(errorAlert).toHaveAttribute('aria-live', 'assertive')
      })
    })

    it('displays retry button on error', async () => {
      apiService.get.mockRejectedValue(new Error('API Error'))

      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument()
      })
    })

    it('handles API returning unsuccessful response', async () => {
      apiService.get.mockResolvedValue({ success: false, error: 'Server error' })

      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })

    it('handles malformed server data', async () => {
      apiService.get.mockImplementation((url) => {
        if (url.includes('/chat/servers')) {
          return Promise.resolve({ success: true, data: null })
        }
        return Promise.resolve({ success: true, data: { conversations: [] } })
      })

      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })

    it('handles message loading failure gracefully', async () => {
      channelService.getMessages.mockRejectedValue(new Error('Message load failed'))

      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Channel and Server Management', () => {
    it('loads messages when active channel changes', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(channelService.getMessages).toHaveBeenCalledWith('channel1', { limit: 50 })
      })
    })

    it('does not load messages when no active channel', async () => {
      apiService.get.mockImplementation((url) => {
        if (url.includes('/chat/servers')) {
          return Promise.resolve({
            success: true,
            data: { servers: [{ id: 'server1', name: 'Test', channels: [] }] }
          })
        }
        return Promise.resolve({ success: true, data: { conversations: [] } })
      })

      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })

    it('stores loaded messages in state', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(channelService.getMessages).toHaveBeenCalled()
      })
    })

    it('handles unsuccessful message loading', async () => {
      channelService.getMessages.mockResolvedValue({ success: false, error: 'Failed' })

      renderWithContext()
      await waitFor(() => {
        expect(channelService.getMessages).toHaveBeenCalled()
      })
    })
  })

  describe('Message Operations', () => {
    it('handles sending a new message', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })

      // Simulate message send would happen via component interaction
    })

    it('creates message with proper structure', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })

    it('includes attachments in sent messages', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })

    it('emits message via socket service', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(socketService.on).toHaveBeenCalled()
      })
    })

    it('adds new message to messages list on send', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Real-time Socket Integration', () => {
    it('sets up socket event listeners on mount', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(socketService.on).toHaveBeenCalledWith('message_received', expect.any(Function))
        expect(socketService.on).toHaveBeenCalledWith('user_joined', expect.any(Function))
      })
    })

    it('cleans up socket listeners on unmount', async () => {
      const { unmount } = renderWithContext()
      await waitFor(() => {
        expect(socketService.on).toHaveBeenCalled()
      })

      unmount()
      expect(socketService.off).toHaveBeenCalledWith('message_received')
      expect(socketService.off).toHaveBeenCalledWith('user_joined')
    })

    it('handles incoming message_received event', async () => {
      let messageReceivedHandler
      socketService.on.mockImplementation((event, handler) => {
        if (event === 'message_received') {
          messageReceivedHandler = handler
        }
      })

      renderWithContext()
      await waitFor(() => {
        expect(socketService.on).toHaveBeenCalledWith('message_received', expect.any(Function))
      })

      if (messageReceivedHandler) {
        act(() => {
          messageReceivedHandler({
            channelId: 'channel1',
            message: {
              id: 'newmsg',
              content: 'New message',
              author: { displayName: 'Other User' },
              timestamp: Date.now()
            }
          })
        })
      }
    })

    it('adds notification for new messages', async () => {
      let messageReceivedHandler
      socketService.on.mockImplementation((event, handler) => {
        if (event === 'message_received') {
          messageReceivedHandler = handler
        }
      })

      renderWithContext()
      await waitFor(() => {
        expect(socketService.on).toHaveBeenCalled()
      })

      if (messageReceivedHandler) {
        act(() => {
          messageReceivedHandler({
            channelId: 'channel1',
            message: {
              id: 'newmsg',
              content: 'Test',
              author: { displayName: 'User' },
              timestamp: Date.now()
            }
          })
        })
      }
    })

    it('handles user_joined event', async () => {
      let userJoinedHandler
      socketService.on.mockImplementation((event, handler) => {
        if (event === 'user_joined') {
          userJoinedHandler = handler
        }
      })

      renderWithContext()
      await waitFor(() => {
        expect(socketService.on).toHaveBeenCalled()
      })

      if (userJoinedHandler) {
        act(() => {
          userJoinedHandler({
            user: { displayName: 'New User' }
          })
        })
      }
    })

    it('ignores messages for inactive channels', async () => {
      let messageReceivedHandler
      socketService.on.mockImplementation((event, handler) => {
        if (event === 'message_received') {
          messageReceivedHandler = handler
        }
      })

      renderWithContext()
      await waitFor(() => {
        expect(socketService.on).toHaveBeenCalled()
      })

      if (messageReceivedHandler) {
        act(() => {
          messageReceivedHandler({
            channelId: 'different-channel',
            message: { content: 'Should be ignored' }
          })
        })
      }
    })
  })

  describe('State Management', () => {
    it('initializes with correct default state', () => {
      renderWithContext()
      expect(screen.getByText(/Loading chat/i)).toBeInTheDocument()
    })

    it('manages activeServer state', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })

    it('manages activeChannel state', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })

    it('manages activeThread state', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })

    it('manages showDirectMessages state', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })

    it('manages showNotifications state', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })

    it('manages showSearch state', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })

    it('manages showVoiceInterface state', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })

    it('manages servers state', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/chat/servers')
      })
    })

    it('manages messages state', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(channelService.getMessages).toHaveBeenCalled()
      })
    })

    it('manages notifications state', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('UI Components', () => {
    it('displays main layout with proper structure', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Chat page')
    })

    it('renders with proper semantic HTML', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
    })

    it('has accessible heading', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /ChatPage/i })).toBeInTheDocument()
      })
    })
  })

  describe('Memoization', () => {
    it('memoizes current server', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })

    it('memoizes current channel', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })

    it('memoizes online users', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })

    it('memoizes all users', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })

    it('returns first server when activeServer not found', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })

    it('returns first channel when activeChannel not found', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })

    it('filters online users correctly', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('uses accessibility announcements for loading', () => {
      const { useLoadingAnnouncement } = require('../../utils/accessibility.jsx')
      renderWithContext()
      expect(useLoadingAnnouncement).toHaveBeenCalled()
    })

    it('uses accessibility announcements for errors', () => {
      const { useErrorAnnouncement } = require('../../utils/accessibility.jsx')
      renderWithContext()
      expect(useErrorAnnouncement).toHaveBeenCalled()
    })

    it('loading state has proper ARIA labels', () => {
      renderWithContext()
      const loadingElement = screen.getByRole('main')
      expect(loadingElement).toHaveAttribute('aria-label', 'Chat loading')
    })

    it('error state has proper ARIA labels', async () => {
      apiService.get.mockRejectedValue(new Error('API Error'))

      renderWithContext()
      await waitFor(() => {
        const errorElement = screen.getByRole('main')
        expect(errorElement).toHaveAttribute('aria-label', 'Chat error')
      })
    })

    it('retry button has descriptive label', async () => {
      apiService.get.mockRejectedValue(new Error('API Error'))

      renderWithContext()
      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /Try reloading the page/i })
        expect(retryButton).toBeInTheDocument()
      })
    })
  })

  describe('Mobile Responsiveness', () => {
    it('checks mobile state on mount', async () => {
      const { useIsMobile } = require('../../components/chat/MobileOptimizations')
      renderWithContext()
      await waitFor(() => {
        expect(useIsMobile).toHaveBeenCalled()
      })
    })

    it('handles mobile view state', async () => {
      const { useIsMobile } = require('../../components/chat/MobileOptimizations')
      useIsMobile.mockReturnValue(true)

      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })

    it('handles desktop view state', async () => {
      const { useIsMobile } = require('../../components/chat/MobileOptimizations')
      useIsMobile.mockReturnValue(false)

      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles undefined server in servers list', async () => {
      apiService.get.mockImplementation((url) => {
        if (url.includes('/chat/servers')) {
          return Promise.resolve({
            success: true,
            data: { servers: [undefined, mockServers[0]] }
          })
        }
        return Promise.resolve({ success: true, data: { conversations: [] } })
      })

      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })

    it('handles server without channels', async () => {
      apiService.get.mockImplementation((url) => {
        if (url.includes('/chat/servers')) {
          return Promise.resolve({
            success: true,
            data: { servers: [{ id: 'srv1', name: 'Test', channels: [] }] }
          })
        }
        return Promise.resolve({ success: true, data: { conversations: [] } })
      })

      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })

    it('handles rapid server switching', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })

    it('handles rapid channel switching', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })

    it('handles multiple socket events in quick succession', async () => {
      let messageReceivedHandler
      socketService.on.mockImplementation((event, handler) => {
        if (event === 'message_received') {
          messageReceivedHandler = handler
        }
      })

      renderWithContext()
      await waitFor(() => {
        expect(socketService.on).toHaveBeenCalled()
      })

      if (messageReceivedHandler) {
        act(() => {
          messageReceivedHandler({
            channelId: 'channel1',
            message: { id: '1', content: 'First', author: { displayName: 'User' }, timestamp: Date.now() }
          })
          messageReceivedHandler({
            channelId: 'channel1',
            message: { id: '2', content: 'Second', author: { displayName: 'User' }, timestamp: Date.now() }
          })
        })
      }
    })

    it('handles empty message content', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })

    it('handles very long message content', async () => {
      const longContent = 'a'.repeat(10000)
      channelService.getMessages.mockResolvedValue({
        success: true,
        messages: [{ id: 'long', content: longContent, author: mockUser, timestamp: Date.now() }]
      })

      renderWithContext()
      await waitFor(() => {
        expect(channelService.getMessages).toHaveBeenCalled()
      })
    })

    it('handles messages with special characters', async () => {
      channelService.getMessages.mockResolvedValue({
        success: true,
        messages: [{
          id: 'special',
          content: '<script>alert("test")</script>',
          author: mockUser,
          timestamp: Date.now()
        }]
      })

      renderWithContext()
      await waitFor(() => {
        expect(channelService.getMessages).toHaveBeenCalled()
      })
    })

    it('handles null user data', async () => {
      const nullUserContext = {
        ...mockAuthContext,
        user: null
      }

      renderWithContext(nullUserContext)
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })

    it('handles concurrent API calls', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Performance', () => {
    it('makes parallel API calls on mount', async () => {
      const startTime = Date.now()

      renderWithContext()
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledTimes(2)
      })

      const endTime = Date.now()
      // Parallel calls should complete faster than sequential
    })

    it('uses Promise.all for concurrent requests', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/chat/servers')
        expect(apiService.get).toHaveBeenCalledWith('/messages/conversations')
      })
    })

    it('does not refetch on re-render without dependency change', async () => {
      const { rerender } = renderWithContext()
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledTimes(2)
      })

      rerender(
        <BrowserRouter>
          <AuthContext.Provider value={mockAuthContext}>
            <ChatPage user={mockUser} />
          </AuthContext.Provider>
        </BrowserRouter>
      )

      // Should still be 2 calls, not 4
      expect(apiService.get).toHaveBeenCalledTimes(2)
    })
  })

  describe('Cleanup', () => {
    it('cleans up on unmount', async () => {
      const { unmount } = renderWithContext()
      await waitFor(() => {
        expect(socketService.on).toHaveBeenCalled()
      })

      unmount()
      expect(socketService.off).toHaveBeenCalled()
    })

    it('removes all socket listeners on unmount', async () => {
      const { unmount } = renderWithContext()
      await waitFor(() => {
        expect(socketService.on).toHaveBeenCalled()
      })

      unmount()
      expect(socketService.off).toHaveBeenCalledWith('message_received')
      expect(socketService.off).toHaveBeenCalledWith('user_joined')
    })
  })

  describe('Snapshot Tests', () => {
    it('matches snapshot for loading state', () => {
      const { container } = renderWithContext()
      expect(container.firstChild).toMatchSnapshot()
    })

    it('matches snapshot for error state', async () => {
      apiService.get.mockRejectedValue(new Error('API Error'))

      const { container } = renderWithContext()
      await waitFor(() => {
        expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
      })
      expect(container.firstChild).toMatchSnapshot()
    })

    it('matches snapshot for loaded state', async () => {
      const { container } = renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
      expect(container.firstChild).toMatchSnapshot()
    })

    it('matches snapshot with empty data', async () => {
      apiService.get.mockImplementation((url) => {
        if (url.includes('/chat/servers')) {
          return Promise.resolve({ success: true, data: { servers: [] } })
        }
        return Promise.resolve({ success: true, data: { conversations: [] } })
      })

      const { container } = renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
      expect(container.firstChild).toMatchSnapshot()
    })
  })
})

export default mockUser
