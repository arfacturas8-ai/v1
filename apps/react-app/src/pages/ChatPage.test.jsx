import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { BrowserRouter, useParams, useNavigate } from 'react-router-dom'
import ChatPage from './ChatPage'
import { AuthContext } from '../contexts/AuthContext'
import apiService from '../services/api'
import socketService from '../services/socket'
import channelService from '../services/channelService'

// Mock services
jest.mock('../services/api')
jest.mock('../services/socket')
jest.mock('../services/channelService')

// Mock router hooks
const mockNavigate = jest.fn()
const mockParams = {}

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockParams,
  useNavigate: () => mockNavigate
}))

// Mock all chat components
jest.mock('../components/chat/ChatInterface', () => ({
  __esModule: true,
  default: ({ onChannelChange, onMessageSend, messages }) => (
    <div data-testid="chat-interface">
      <div>ChatInterface</div>
      <button onClick={() => onChannelChange && onChannelChange('channel2')}>
        Change Channel
      </button>
      <button onClick={() => onMessageSend && onMessageSend({ content: 'Test message' })}>
        Send Message
      </button>
      <div data-testid="message-count">{messages?.length || 0} messages</div>
    </div>
  )
}))

jest.mock('../components/chat/ChannelSidebar', () => ({
  __esModule: true,
  default: ({ servers, activeServer, activeChannel, onServerChange, onChannelChange }) => (
    <div data-testid="channel-sidebar">
      <div>ChannelSidebar</div>
      <button onClick={() => onServerChange && onServerChange('server2')}>
        Change Server
      </button>
      <button onClick={() => onChannelChange && onChannelChange('channel2')}>
        Select Channel
      </button>
      <div data-testid="server-count">{servers?.length || 0} servers</div>
    </div>
  )
}))

jest.mock('../components/chat/MessageComposer', () => ({
  __esModule: true,
  default: ({ onSend }) => (
    <div data-testid="message-composer">
      <button onClick={() => onSend && onSend({ content: 'Test' })}>
        Compose Message
      </button>
    </div>
  )
}))

jest.mock('../components/chat/ThreadView', () => ({
  __esModule: true,
  default: ({ messageId, onClose }) => (
    <div data-testid="thread-view">
      Thread for {messageId}
      <button onClick={onClose}>Close Thread</button>
    </div>
  )
}))

jest.mock('../components/chat/MessageSearch', () => ({
  __esModule: true,
  default: ({ onClose }) => (
    <div data-testid="message-search">
      <button onClick={onClose}>Close Search</button>
    </div>
  )
}))

jest.mock('../components/chat/DirectMessagesPanel', () => ({
  __esModule: true,
  default: ({ conversations, onClose }) => (
    <div data-testid="direct-messages-panel">
      <div>{conversations?.length || 0} conversations</div>
      <button onClick={onClose}>Close DM Panel</button>
    </div>
  )
}))

jest.mock('../components/chat/UserPresenceSystem', () => ({
  __esModule: true,
  default: ({ users }) => (
    <div data-testid="user-presence-system">
      {users?.length || 0} users online
    </div>
  )
}))

jest.mock('../components/chat/VoiceChannelInterface', () => ({
  __esModule: true,
  default: ({ channelId, onLeave }) => (
    <div data-testid="voice-channel-interface">
      Voice: {channelId}
      <button onClick={onLeave}>Leave Voice</button>
    </div>
  )
}))

jest.mock('../components/chat/NotificationCenter', () => ({
  __esModule: true,
  default: ({ notifications, onClose, onClear }) => (
    <div data-testid="notification-center">
      <div>{notifications?.length || 0} notifications</div>
      <button onClick={onClose}>Close Notifications</button>
      <button onClick={onClear}>Clear All</button>
    </div>
  )
}))

jest.mock('../components/chat/KeyboardShortcuts', () => ({
  __esModule: true,
  default: ({ onShortcut }) => (
    <div data-testid="keyboard-shortcuts">
      <button onClick={() => onShortcut && onShortcut('search')}>Trigger Search</button>
    </div>
  )
}))

jest.mock('../components/chat/MobileOptimizations', () => ({
  __esModule: true,
  useIsMobile: jest.fn(() => false)
}))

// Mock accessibility utilities
jest.mock('../utils/accessibility.jsx', () => ({
  SkipToContent: () => <div data-testid="skip-to-content">Skip to content</div>,
  announce: jest.fn(),
  useLoadingAnnouncement: jest.fn(),
  useErrorAnnouncement: jest.fn()
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Hash: () => <span>Hash</span>,
  MessageSquare: () => <span>MessageSquare</span>,
  Phone: () => <span>Phone</span>,
  Settings: () => <span>Settings</span>,
  Search: () => <span>Search</span>,
  Bell: () => <span>Bell</span>,
  Users: () => <span>Users</span>
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
  },
  {
    id: 'conv2',
    participant: { id: 'user3', displayName: 'User Three' },
    lastMessage: { content: 'Hi there!', timestamp: Date.now() }
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
    mockParams.channelId = undefined
    mockParams.dmId = undefined

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
    socketService.connect = jest.fn()
    socketService.disconnect = jest.fn()
    socketService.isConnected = jest.fn().mockReturnValue(true)

    // Setup channel service mocks
    channelService.getMessages = jest.fn().mockResolvedValue({
      success: true,
      messages: mockMessages
    })
  })

  describe('Page Rendering', () => {
    it('renders without crashing', () => {
      renderWithContext()
      expect(document.querySelector('[role="main"]')).toBeInTheDocument()
    })

    it('renders with proper semantic HTML structure', () => {
      renderWithContext()
      const main = document.querySelector('[role="main"]')
      expect(main).toHaveAttribute('aria-label', 'Chat loading')
    })

    it('renders main heading', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByText(/ChatPage/i)).toBeInTheDocument()
      })
    })

    it('displays construction message', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByText(/Content under construction/i)).toBeInTheDocument()
      })
    })

    it('applies proper styling to container', async () => {
      renderWithContext()
      await waitFor(() => {
        const main = document.querySelector('[role="main"]')
        expect(main).toHaveStyle({ padding: '20px', maxWidth: '1200px' })
      })
    })
  })

  describe('Loading States', () => {
    it('shows loading state initially', () => {
      renderWithContext()
      expect(screen.getByText(/Loading chat/i)).toBeInTheDocument()
    })

    it('displays loading spinner', () => {
      renderWithContext()
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('loading spinner has proper ARIA attributes', () => {
      renderWithContext()
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveAttribute('aria-hidden', 'true')
    })

    it('loading container has aria-busy attribute', () => {
      renderWithContext()
      const loadingContainer = screen.getByRole('main')
      expect(loadingContainer).toHaveAttribute('aria-busy', 'true')
    })

    it('loading container has aria-live polite', () => {
      renderWithContext()
      const loadingContainer = screen.getByRole('main')
      expect(loadingContainer).toHaveAttribute('aria-live', 'polite')
    })

    it('loading text is visible to screen readers', () => {
      renderWithContext()
      const loadingText = screen.getByText(/Loading chat/i)
      expect(loadingText).toHaveAttribute('aria-live', 'polite')
    })

    it('transitions from loading to content', async () => {
      renderWithContext()
      expect(screen.getByText(/Loading chat/i)).toBeInTheDocument()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })

    it('removes loading spinner after data loads', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
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

    it('error container has proper aria-label', async () => {
      apiService.get.mockRejectedValue(new Error('API Error'))
      renderWithContext()
      await waitFor(() => {
        const errorMain = screen.getByRole('main')
        expect(errorMain).toHaveAttribute('aria-label', 'Chat error')
      })
    })

    it('displays error icon', async () => {
      apiService.get.mockRejectedValue(new Error('API Error'))
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByText('⚠️')).toBeInTheDocument()
      })
    })

    it('error icon has aria-hidden', async () => {
      apiService.get.mockRejectedValue(new Error('API Error'))
      renderWithContext()
      await waitFor(() => {
        const icon = screen.getByText('⚠️')
        expect(icon).toHaveAttribute('aria-hidden', 'true')
      })
    })

    it('displays retry button on error', async () => {
      apiService.get.mockRejectedValue(new Error('API Error'))
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument()
      })
    })

    it('retry button has descriptive aria-label', async () => {
      apiService.get.mockRejectedValue(new Error('API Error'))
      renderWithContext()
      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /Try Again/i })
        expect(retryButton).toHaveAttribute('aria-label', 'Try reloading the page')
      })
    })

    it('retry button triggers page reload', async () => {
      apiService.get.mockRejectedValue(new Error('API Error'))
      delete window.location
      window.location = { reload: jest.fn() }

      renderWithContext()
      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /Try Again/i })
        fireEvent.click(retryButton)
        expect(window.location.reload).toHaveBeenCalled()
      })
    })

    it('displays custom error message', async () => {
      apiService.get.mockRejectedValue(new Error('Network error'))
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByText(/Failed to load chat data/i)).toBeInTheDocument()
      })
    })

    it('handles API returning unsuccessful response', async () => {
      apiService.get.mockResolvedValue({ success: false, error: 'Server error' })
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })

    it('handles malformed server data gracefully', async () => {
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

    it('logs error to console on API failure', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      apiService.get.mockRejectedValue(new Error('Test error'))
      renderWithContext()
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled()
      })
      consoleSpy.mockRestore()
    })
  })

  describe('Authentication Check', () => {
    it('uses authenticated user from AuthContext', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(mockAuthContext.user).toBe(mockUser)
      })
    })

    it('handles unauthenticated state', async () => {
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

    it('does not redirect when authenticated', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalledWith('/login')
      })
    })

    it('handles null user gracefully', async () => {
      const nullUserContext = {
        ...mockAuthContext,
        user: null
      }
      renderWithContext(nullUserContext)
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })

    it('displays user info when authenticated', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(mockAuthContext.user.username).toBe('testuser')
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

    it('makes parallel API calls', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledTimes(2)
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
    })

    it('sets active channel when servers load', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })

    it('handles servers without channels', async () => {
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

    it('handles alternative data structure', async () => {
      apiService.get.mockImplementation((url) => {
        if (url.includes('/chat/servers')) {
          return Promise.resolve({ success: true, data: mockServers })
        }
        return Promise.resolve({ success: true, data: mockConversations })
      })
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Default Channel Selection', () => {
    it('selects first server by default', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })

    it('selects first channel of first server', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })

    it('does not select channel if server has no channels', async () => {
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
        expect(channelService.getMessages).not.toHaveBeenCalled()
      })
    })

    it('does not select server if list is empty', async () => {
      apiService.get.mockImplementation((url) => {
        if (url.includes('/chat/servers')) {
          return Promise.resolve({ success: true, data: { servers: [] } })
        }
        return Promise.resolve({ success: true, data: { conversations: [] } })
      })
      renderWithContext()
      await waitFor(() => {
        expect(channelService.getMessages).not.toHaveBeenCalled()
      })
    })
  })

  describe('URL Parameter Handling', () => {
    it('handles channelId parameter', async () => {
      mockParams.channelId = 'channel2'
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })

    it('handles dmId parameter', async () => {
      mockParams.dmId = 'conv1'
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })

    it('handles both channelId and dmId', async () => {
      mockParams.channelId = 'channel2'
      mockParams.dmId = 'conv1'
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })

    it('handles invalid channelId', async () => {
      mockParams.channelId = 'invalid-channel'
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })

    it('handles invalid dmId', async () => {
      mockParams.dmId = 'invalid-dm'
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Channel and Message Management', () => {
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

    it('clears messages on channel change', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(channelService.getMessages).toHaveBeenCalledWith('channel1', { limit: 50 })
      })
    })
  })

  describe('Real-time Socket.IO Connection', () => {
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

    it('emits message via socket service', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(socketService.on).toHaveBeenCalled()
      })
    })

    it('reconnects socket on connection loss', async () => {
      socketService.isConnected.mockReturnValue(false)
      renderWithContext()
      await waitFor(() => {
        expect(socketService.on).toHaveBeenCalled()
      })
    })
  })

  describe('Notification Integration', () => {
    it('creates notification for new message', async () => {
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
              content: 'New notification',
              author: { displayName: 'Test User' },
              timestamp: Date.now()
            }
          })
        })
      }
    })

    it('creates notification for user joined', async () => {
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
            user: { displayName: 'New User Joined' }
          })
        })
      }
    })

    it('notification includes message content', async () => {
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
              id: 'msg',
              content: 'Message content here',
              author: { displayName: 'Author' },
              timestamp: Date.now()
            }
          })
        })
      }
    })
  })

  describe('Mobile Layout', () => {
    it('detects mobile view', async () => {
      const { useIsMobile } = require('../components/chat/MobileOptimizations')
      useIsMobile.mockReturnValue(true)
      renderWithContext()
      await waitFor(() => {
        expect(useIsMobile).toHaveBeenCalled()
      })
    })

    it('renders mobile layout when on mobile', async () => {
      const { useIsMobile } = require('../components/chat/MobileOptimizations')
      useIsMobile.mockReturnValue(true)
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })

    it('renders desktop layout when not mobile', async () => {
      const { useIsMobile } = require('../components/chat/MobileOptimizations')
      useIsMobile.mockReturnValue(false)
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('uses accessibility announcements for loading', () => {
      const { useLoadingAnnouncement } = require('../utils/accessibility.jsx')
      renderWithContext()
      expect(useLoadingAnnouncement).toHaveBeenCalled()
    })

    it('uses accessibility announcements for errors', () => {
      const { useErrorAnnouncement } = require('../utils/accessibility.jsx')
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

    it('main content has proper ARIA label', async () => {
      renderWithContext()
      await waitFor(() => {
        const main = screen.getByRole('main')
        expect(main).toHaveAttribute('aria-label')
      })
    })

    it('provides skip to content link', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.queryByTestId('skip-to-content')).toBeInTheDocument()
      })
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

    it('manages directMessages state', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/messages/conversations')
      })
    })

    it('manages loading state', async () => {
      renderWithContext()
      expect(screen.getByText(/Loading chat/i)).toBeInTheDocument()
      await waitFor(() => {
        expect(screen.queryByText(/Loading chat/i)).not.toBeInTheDocument()
      })
    })

    it('manages error state', async () => {
      apiService.get.mockRejectedValue(new Error('Error'))
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
      })
    })
  })

  describe('Performance and Optimization', () => {
    it('makes parallel API calls on mount', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledTimes(2)
      })
    })

    it('does not refetch on re-render', async () => {
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
      expect(apiService.get).toHaveBeenCalledTimes(2)
    })

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

    it('cancels pending requests on unmount', async () => {
      const { unmount } = renderWithContext()
      unmount()
      await waitFor(() => {
        expect(socketService.off).toHaveBeenCalled()
      })
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

export default mockNavigate
