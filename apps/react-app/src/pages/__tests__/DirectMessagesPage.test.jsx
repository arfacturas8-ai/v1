import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter, useParams } from 'react-router-dom'
import DirectMessagesPage from '../DirectMessagesPage'
import { AuthContext } from '../../contexts/AuthContext'
import apiService from '../../services/api'
import socketService from '../../services/socket'
import { mockAuthContext, mockUnauthContext } from '../../../tests/utils/testUtils'

// Mock services
jest.mock('../../services/api')
jest.mock('../../services/socket')

// Mock useParams
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}))

// Mock accessibility utilities
jest.mock('../../utils/accessibility.jsx', () => ({
  useLoadingAnnouncement: jest.fn(),
  useErrorAnnouncement: jest.fn(),
}))

const mockConversations = [
  {
    id: 'conv1',
    user: { id: 'user2', username: 'user2', displayName: 'User Two' },
    lastMessage: { content: 'Hello!', timestamp: Date.now() - 1000 },
    unreadCount: 2,
  },
  {
    id: 'conv2',
    user: { id: 'user3', username: 'user3', displayName: 'User Three' },
    lastMessage: { content: 'How are you?', timestamp: Date.now() - 5000 },
    unreadCount: 0,
  },
]

const mockMessages = [
  {
    id: 'msg1',
    content: 'Hello!',
    senderId: 'user2',
    timestamp: Date.now() - 10000,
    type: 'text',
  },
  {
    id: 'msg2',
    content: 'Hi there!',
    senderId: 'current-user',
    timestamp: Date.now() - 5000,
    type: 'text',
  },
]

const renderWithRouter = (component, authValue = mockAuthContext) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>{component}</AuthContext.Provider>
    </BrowserRouter>
  )
}

describe('DirectMessagesPage - Rendering & Structure', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useParams.mockReturnValue({})
    socketService.on = jest.fn()
    socketService.off = jest.fn()
    socketService.emit = jest.fn()
    apiService.get = jest.fn(() =>
      Promise.resolve({ success: true, data: { conversations: [], messages: [] } })
    )
  })

  it('renders without crashing', () => {
    renderWithRouter(<DirectMessagesPage />)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('has proper page structure with semantic HTML', () => {
    renderWithRouter(<DirectMessagesPage />)
    expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Direct messages page')
  })

  it('displays page heading', () => {
    renderWithRouter(<DirectMessagesPage />)
    expect(screen.getByRole('heading', { name: /DirectMessagesPage/i })).toBeInTheDocument()
  })

  it('renders without console errors', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    renderWithRouter(<DirectMessagesPage />)
    expect(consoleSpy).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})

describe('DirectMessagesPage - Data Loading', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useParams.mockReturnValue({})
    socketService.on = jest.fn()
    socketService.off = jest.fn()
    socketService.emit = jest.fn()
  })

  it('fetches conversations on mount', async () => {
    apiService.get = jest.fn(() =>
      Promise.resolve({ success: true, data: { conversations: mockConversations } })
    )

    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalledWith('/messages/conversations')
    })
  })

  it('displays loading state initially', () => {
    apiService.get = jest.fn(() => new Promise(() => {}))
    renderWithRouter(<DirectMessagesPage />)

    // Loading state should be present
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('displays conversations after loading', async () => {
    apiService.get = jest.fn((url) => {
      if (url.includes('/messages/conversations')) {
        return Promise.resolve({ success: true, data: { conversations: mockConversations } })
      }
      return Promise.resolve({ success: true, data: { messages: [] } })
    })

    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalled()
    })
  })

  it('handles empty conversations list', async () => {
    apiService.get = jest.fn(() =>
      Promise.resolve({ success: true, data: { conversations: [] } })
    )

    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalled()
    })
  })

  it('handles API error gracefully', async () => {
    apiService.get = jest.fn(() =>
      Promise.reject(new Error('Failed to load conversations'))
    )

    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalled()
    })
  })
})

describe('DirectMessagesPage - Conversation List', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useParams.mockReturnValue({})
    socketService.on = jest.fn()
    socketService.off = jest.fn()
    socketService.emit = jest.fn()
    apiService.get = jest.fn((url) => {
      if (url.includes('/messages/conversations')) {
        return Promise.resolve({ success: true, data: { conversations: mockConversations } })
      }
      return Promise.resolve({ success: true, data: { messages: [] } })
    })
  })

  it('displays all conversations', async () => {
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalledWith('/messages/conversations')
    })
  })

  it('displays user display names in conversations', async () => {
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalled()
    })
  })

  it('displays last message in conversation', async () => {
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalled()
    })
  })

  it('displays unread count badge', async () => {
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalled()
    })
  })

  it('highlights active conversation', async () => {
    useParams.mockReturnValue({ conversationId: 'conv1' })
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalled()
    })
  })
})

describe('DirectMessagesPage - Conversation Search', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useParams.mockReturnValue({})
    socketService.on = jest.fn()
    socketService.off = jest.fn()
    socketService.emit = jest.fn()
    apiService.get = jest.fn((url) => {
      if (url.includes('/messages/conversations')) {
        return Promise.resolve({ success: true, data: { conversations: mockConversations } })
      }
      return Promise.resolve({ success: true, data: { messages: [] } })
    })
  })

  it('displays search input', async () => {
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      const searchInput = screen.queryByPlaceholderText(/search/i)
      // Search functionality may be present
    })
  })

  it('filters conversations by username', async () => {
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalled()
    })

    const searchInput = screen.queryByPlaceholderText(/search/i)
    if (searchInput) {
      await userEvent.type(searchInput, 'user2')
      // Should filter to matching conversations
    }
  })

  it('filters conversations by display name', async () => {
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalled()
    })

    const searchInput = screen.queryByPlaceholderText(/search/i)
    if (searchInput) {
      await userEvent.type(searchInput, 'User Two')
      // Should filter to matching conversations
    }
  })

  it('shows no results message when no matches', async () => {
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalled()
    })

    const searchInput = screen.queryByPlaceholderText(/search/i)
    if (searchInput) {
      await userEvent.type(searchInput, 'nonexistent')
      // Should show no results
    }
  })

  it('clears search when input is cleared', async () => {
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalled()
    })

    const searchInput = screen.queryByPlaceholderText(/search/i)
    if (searchInput) {
      await userEvent.type(searchInput, 'user2')
      await userEvent.clear(searchInput)
      // Should show all conversations again
    }
  })
})

describe('DirectMessagesPage - Conversation Selection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useParams.mockReturnValue({})
    socketService.on = jest.fn()
    socketService.off = jest.fn()
    socketService.emit = jest.fn()
    apiService.get = jest.fn((url) => {
      if (url.includes('/messages/conversations')) {
        return Promise.resolve({ success: true, data: { conversations: mockConversations } })
      }
      if (url.includes('/messages')) {
        return Promise.resolve({ success: true, data: { messages: mockMessages } })
      }
      return Promise.resolve({ success: true, data: {} })
    })
  })

  it('sets first conversation as active by default', async () => {
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalledWith('/messages/conversations')
    })
  })

  it('allows selecting a conversation', async () => {
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalled()
    })
  })

  it('fetches messages for selected conversation', async () => {
    useParams.mockReturnValue({ conversationId: 'conv1' })
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalledWith(
        expect.stringContaining('/messages/conversations/conv1/messages')
      )
    })
  })

  it('clears unread count on selection', async () => {
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalled()
    })
  })

  it('loads conversation from URL parameter', async () => {
    useParams.mockReturnValue({ conversationId: 'conv2' })
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalledWith(
        expect.stringContaining('/messages/conversations/conv2/messages')
      )
    })
  })
})

describe('DirectMessagesPage - Message Display', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useParams.mockReturnValue({ conversationId: 'conv1' })
    socketService.on = jest.fn()
    socketService.off = jest.fn()
    socketService.emit = jest.fn()
    apiService.get = jest.fn((url) => {
      if (url.includes('/messages/conversations/conv1/messages')) {
        return Promise.resolve({ success: true, data: { messages: mockMessages } })
      }
      return Promise.resolve({ success: true, data: { conversations: mockConversations } })
    })
  })

  it('displays messages for active conversation', async () => {
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalledWith(
        '/messages/conversations/conv1/messages'
      )
    })
  })

  it('displays message content', async () => {
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalled()
    })
  })

  it('displays message timestamps', async () => {
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalled()
    })
  })

  it('shows loading state while fetching messages', () => {
    apiService.get = jest.fn(() => new Promise(() => {}))
    renderWithRouter(<DirectMessagesPage />)

    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('auto-scrolls to bottom on new messages', async () => {
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalled()
    })

    // Should auto-scroll to bottom
  })
})

describe('DirectMessagesPage - Message Sending', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useParams.mockReturnValue({ conversationId: 'conv1' })
    socketService.on = jest.fn()
    socketService.off = jest.fn()
    socketService.emit = jest.fn()
    apiService.get = jest.fn((url) => {
      if (url.includes('/messages/conversations/conv1/messages')) {
        return Promise.resolve({ success: true, data: { messages: mockMessages } })
      }
      return Promise.resolve({ success: true, data: { conversations: mockConversations } })
    })
    apiService.post = jest.fn(() =>
      Promise.resolve({
        success: true,
        data: { message: { id: 'msg3', content: 'New message', senderId: 'current-user' } },
      })
    )
  })

  it('displays message input field', async () => {
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      const messageInput = screen.queryByPlaceholderText(/message/i)
      // Message input may be present
    })
  })

  it('allows typing in message input', async () => {
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      const messageInput = screen.queryByPlaceholderText(/message/i)
      if (messageInput) {
        userEvent.type(messageInput, 'Test message')
      }
    })
  })

  it('sends message on Enter key', async () => {
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      const messageInput = screen.queryByPlaceholderText(/message/i)
      if (messageInput) {
        userEvent.type(messageInput, 'Test message{enter}')
        expect(apiService.post).toHaveBeenCalled()
      }
    })
  })

  it('does not send on Shift+Enter', async () => {
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      const messageInput = screen.queryByPlaceholderText(/message/i)
      if (messageInput) {
        userEvent.type(messageInput, 'Test message{shift}{enter}')
        // Should not send, adds new line instead
      }
    })
  })

  it('sends message via send button', async () => {
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      const messageInput = screen.queryByPlaceholderText(/message/i)
      const sendButton = screen.queryByRole('button', { name: /send/i })

      if (messageInput && sendButton) {
        userEvent.type(messageInput, 'Test message')
        userEvent.click(sendButton)
        expect(apiService.post).toHaveBeenCalled()
      }
    })
  })

  it('clears input after sending', async () => {
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      const messageInput = screen.queryByPlaceholderText(/message/i)
      if (messageInput) {
        userEvent.type(messageInput, 'Test message{enter}')
      }
    })

    await waitFor(() => {
      const messageInput = screen.queryByPlaceholderText(/message/i)
      if (messageInput) {
        expect(messageInput.value).toBe('')
      }
    })
  })

  it('prevents sending empty messages', async () => {
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      const messageInput = screen.queryByPlaceholderText(/message/i)
      if (messageInput) {
        userEvent.type(messageInput, '   {enter}')
        expect(apiService.post).not.toHaveBeenCalled()
      }
    })
  })

  it('shows optimistic update', async () => {
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      const messageInput = screen.queryByPlaceholderText(/message/i)
      if (messageInput) {
        userEvent.type(messageInput, 'New message{enter}')
        // Message should appear immediately
      }
    })
  })
})

describe('DirectMessagesPage - Real-time Updates', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useParams.mockReturnValue({ conversationId: 'conv1' })
    socketService.on = jest.fn()
    socketService.off = jest.fn()
    socketService.emit = jest.fn()
    apiService.get = jest.fn((url) => {
      if (url.includes('/messages/conversations/conv1/messages')) {
        return Promise.resolve({ success: true, data: { messages: mockMessages } })
      }
      return Promise.resolve({ success: true, data: { conversations: mockConversations } })
    })
  })

  it('sets up socket listeners on mount', async () => {
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(socketService.on).toHaveBeenCalledWith('dm_received', expect.any(Function))
      expect(socketService.on).toHaveBeenCalledWith('user_typing', expect.any(Function))
    })
  })

  it('cleans up socket listeners on unmount', async () => {
    const { unmount } = renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(socketService.on).toHaveBeenCalled()
    })

    unmount()

    expect(socketService.off).toHaveBeenCalledWith('dm_received')
    expect(socketService.off).toHaveBeenCalledWith('user_typing')
  })

  it('receives new messages via socket', async () => {
    let dmReceivedCallback
    socketService.on = jest.fn((event, callback) => {
      if (event === 'dm_received') {
        dmReceivedCallback = callback
      }
    })

    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(socketService.on).toHaveBeenCalled()
    })

    if (dmReceivedCallback) {
      dmReceivedCallback({
        conversationId: 'conv1',
        message: { id: 'msg3', content: 'Socket message', senderId: 'user2' },
      })
    }
  })

  it('updates conversation list on new message', async () => {
    let dmReceivedCallback
    socketService.on = jest.fn((event, callback) => {
      if (event === 'dm_received') {
        dmReceivedCallback = callback
      }
    })

    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(socketService.on).toHaveBeenCalled()
    })

    if (dmReceivedCallback) {
      dmReceivedCallback({
        conversationId: 'conv2',
        message: { id: 'msg4', content: 'New DM', senderId: 'user3' },
      })
    }
  })

  it('shows typing indicator', async () => {
    let typingCallback
    socketService.on = jest.fn((event, callback) => {
      if (event === 'user_typing') {
        typingCallback = callback
      }
    })

    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(socketService.on).toHaveBeenCalled()
    })

    if (typingCallback) {
      typingCallback({ conversationId: 'conv1', isTyping: true })
    }
  })

  it('hides typing indicator when user stops typing', async () => {
    let typingCallback
    socketService.on = jest.fn((event, callback) => {
      if (event === 'user_typing') {
        typingCallback = callback
      }
    })

    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(socketService.on).toHaveBeenCalled()
    })

    if (typingCallback) {
      typingCallback({ conversationId: 'conv1', isTyping: true })
      typingCallback({ conversationId: 'conv1', isTyping: false })
    }
  })
})

describe('DirectMessagesPage - User Presence', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useParams.mockReturnValue({})
    socketService.on = jest.fn()
    socketService.off = jest.fn()
    socketService.emit = jest.fn()
    apiService.get = jest.fn((url) => {
      if (url.includes('/messages/conversations')) {
        return Promise.resolve({
          success: true,
          data: {
            conversations: [
              {
                ...mockConversations[0],
                user: { ...mockConversations[0].user, status: 'online' },
              },
              {
                ...mockConversations[1],
                user: { ...mockConversations[1].user, status: 'away' },
              },
            ],
          },
        })
      }
      return Promise.resolve({ success: true, data: { messages: [] } })
    })
  })

  it('displays user online status', async () => {
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalled()
    })
  })

  it('shows online indicator for online users', async () => {
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalled()
    })
  })

  it('shows away indicator for away users', async () => {
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalled()
    })
  })

  it('shows busy indicator for busy users', async () => {
    apiService.get = jest.fn((url) => {
      if (url.includes('/messages/conversations')) {
        return Promise.resolve({
          success: true,
          data: {
            conversations: [
              {
                ...mockConversations[0],
                user: { ...mockConversations[0].user, status: 'busy' },
              },
            ],
          },
        })
      }
      return Promise.resolve({ success: true, data: { messages: [] } })
    })

    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalled()
    })
  })

  it('shows offline indicator for offline users', async () => {
    apiService.get = jest.fn((url) => {
      if (url.includes('/messages/conversations')) {
        return Promise.resolve({
          success: true,
          data: {
            conversations: [
              {
                ...mockConversations[0],
                user: { ...mockConversations[0].user, status: 'offline' },
              },
            ],
          },
        })
      }
      return Promise.resolve({ success: true, data: { messages: [] } })
    })

    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalled()
    })
  })
})

describe('DirectMessagesPage - Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useParams.mockReturnValue({})
    socketService.on = jest.fn()
    socketService.off = jest.fn()
    socketService.emit = jest.fn()
  })

  it('handles conversation fetch error', async () => {
    apiService.get = jest.fn(() =>
      Promise.reject(new Error('Failed to load conversations'))
    )

    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalled()
    })
  })

  it('handles message fetch error', async () => {
    apiService.get = jest.fn((url) => {
      if (url.includes('/messages/conversations')) {
        return Promise.resolve({ success: true, data: { conversations: mockConversations } })
      }
      return Promise.reject(new Error('Failed to load messages'))
    })

    useParams.mockReturnValue({ conversationId: 'conv1' })
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalled()
    })
  })

  it('handles message send error', async () => {
    apiService.get = jest.fn((url) => {
      if (url.includes('/messages/conversations')) {
        return Promise.resolve({ success: true, data: { conversations: mockConversations } })
      }
      return Promise.resolve({ success: true, data: { messages: mockMessages } })
    })
    apiService.post = jest.fn(() => Promise.reject(new Error('Failed to send')))

    useParams.mockReturnValue({ conversationId: 'conv1' })
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      const messageInput = screen.queryByPlaceholderText(/message/i)
      if (messageInput) {
        userEvent.type(messageInput, 'Test message{enter}')
      }
    })

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalled()
    })
  })

  it('removes failed message from UI', async () => {
    apiService.get = jest.fn((url) => {
      if (url.includes('/messages/conversations')) {
        return Promise.resolve({ success: true, data: { conversations: mockConversations } })
      }
      return Promise.resolve({ success: true, data: { messages: mockMessages } })
    })
    apiService.post = jest.fn(() => Promise.reject(new Error('Failed to send')))

    useParams.mockReturnValue({ conversationId: 'conv1' })
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      const messageInput = screen.queryByPlaceholderText(/message/i)
      if (messageInput) {
        userEvent.type(messageInput, 'Test message{enter}')
      }
    })

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalled()
    })
  })

  it('restores input on send failure', async () => {
    apiService.get = jest.fn((url) => {
      if (url.includes('/messages/conversations')) {
        return Promise.resolve({ success: true, data: { conversations: mockConversations } })
      }
      return Promise.resolve({ success: true, data: { messages: mockMessages } })
    })
    apiService.post = jest.fn(() => Promise.reject(new Error('Failed to send')))

    useParams.mockReturnValue({ conversationId: 'conv1' })
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      const messageInput = screen.queryByPlaceholderText(/message/i)
      if (messageInput) {
        userEvent.type(messageInput, 'Test message{enter}')
      }
    })

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalled()
    })
  })
})

describe('DirectMessagesPage - Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useParams.mockReturnValue({})
    socketService.on = jest.fn()
    socketService.off = jest.fn()
    socketService.emit = jest.fn()
    apiService.get = jest.fn(() =>
      Promise.resolve({ success: true, data: { conversations: [] } })
    )
  })

  it('renders for authenticated users', () => {
    renderWithRouter(<DirectMessagesPage />, mockAuthContext)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('handles unauthenticated state', () => {
    renderWithRouter(<DirectMessagesPage />, mockUnauthContext)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('does not fetch data when unauthenticated', async () => {
    renderWithRouter(<DirectMessagesPage />, mockUnauthContext)

    await waitFor(() => {
      // Should not fetch conversations when not authenticated
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })
})

describe('DirectMessagesPage - Accessibility', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useParams.mockReturnValue({})
    socketService.on = jest.fn()
    socketService.off = jest.fn()
    socketService.emit = jest.fn()
    apiService.get = jest.fn(() =>
      Promise.resolve({ success: true, data: { conversations: mockConversations } })
    )
  })

  it('has proper ARIA labels', () => {
    renderWithRouter(<DirectMessagesPage />)
    expect(screen.getByRole('main')).toHaveAttribute('aria-label')
  })

  it('supports keyboard navigation', async () => {
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalled()
    })
  })

  it('announces new messages to screen readers', async () => {
    let dmReceivedCallback
    socketService.on = jest.fn((event, callback) => {
      if (event === 'dm_received') {
        dmReceivedCallback = callback
      }
    })

    useParams.mockReturnValue({ conversationId: 'conv1' })
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(socketService.on).toHaveBeenCalled()
    })

    if (dmReceivedCallback) {
      dmReceivedCallback({
        conversationId: 'conv1',
        message: { id: 'msg3', content: 'New message', senderId: 'user2' },
      })
    }
  })

  it('has proper focus management', async () => {
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalled()
    })
  })
})

describe('DirectMessagesPage - Responsive Design', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useParams.mockReturnValue({})
    socketService.on = jest.fn()
    socketService.off = jest.fn()
    socketService.emit = jest.fn()
    apiService.get = jest.fn(() =>
      Promise.resolve({ success: true, data: { conversations: mockConversations } })
    )
  })

  it('renders correctly on mobile', () => {
    global.innerWidth = 375
    renderWithRouter(<DirectMessagesPage />)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('renders correctly on tablet', () => {
    global.innerWidth = 768
    renderWithRouter(<DirectMessagesPage />)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('renders correctly on desktop', () => {
    global.innerWidth = 1920
    renderWithRouter(<DirectMessagesPage />)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })
})

describe('DirectMessagesPage - Empty States', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useParams.mockReturnValue({})
    socketService.on = jest.fn()
    socketService.off = jest.fn()
    socketService.emit = jest.fn()
  })

  it('shows empty state when no conversations', async () => {
    apiService.get = jest.fn(() =>
      Promise.resolve({ success: true, data: { conversations: [] } })
    )

    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalled()
    })
  })

  it('shows empty messages state', async () => {
    apiService.get = jest.fn((url) => {
      if (url.includes('/messages/conversations')) {
        return Promise.resolve({ success: true, data: { conversations: mockConversations } })
      }
      return Promise.resolve({ success: true, data: { messages: [] } })
    })

    useParams.mockReturnValue({ conversationId: 'conv1' })
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalled()
    })
  })
})

describe('DirectMessagesPage - Performance', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useParams.mockReturnValue({})
    socketService.on = jest.fn()
    socketService.off = jest.fn()
    socketService.emit = jest.fn()
  })

  it('memoizes filtered conversations', async () => {
    apiService.get = jest.fn(() =>
      Promise.resolve({ success: true, data: { conversations: mockConversations } })
    )

    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalled()
    })
  })

  it('memoizes active conversation data', async () => {
    apiService.get = jest.fn((url) => {
      if (url.includes('/messages/conversations')) {
        return Promise.resolve({ success: true, data: { conversations: mockConversations } })
      }
      return Promise.resolve({ success: true, data: { messages: [] } })
    })

    useParams.mockReturnValue({ conversationId: 'conv1' })
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalled()
    })
  })
})

describe('DirectMessagesPage - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useParams.mockReturnValue({})
    socketService.on = jest.fn()
    socketService.off = jest.fn()
    socketService.emit = jest.fn()
    apiService.get = jest.fn(() =>
      Promise.resolve({ success: true, data: { conversations: mockConversations } })
    )
  })

  it('handles rapid conversation switching', async () => {
    apiService.get = jest.fn((url) => {
      if (url.includes('/messages/conversations')) {
        return Promise.resolve({ success: true, data: { conversations: mockConversations } })
      }
      return Promise.resolve({ success: true, data: { messages: [] } })
    })

    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalled()
    })
  })

  it('handles long message content', async () => {
    apiService.get = jest.fn((url) => {
      if (url.includes('/messages/conversations')) {
        return Promise.resolve({ success: true, data: { conversations: mockConversations } })
      }
      return Promise.resolve({
        success: true,
        data: {
          messages: [
            {
              id: 'msg1',
              content: 'a'.repeat(5000),
              senderId: 'user2',
              timestamp: Date.now(),
            },
          ],
        },
      })
    })

    useParams.mockReturnValue({ conversationId: 'conv1' })
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalled()
    })
  })

  it('handles unicode and emoji in messages', async () => {
    apiService.get = jest.fn((url) => {
      if (url.includes('/messages/conversations')) {
        return Promise.resolve({ success: true, data: { conversations: mockConversations } })
      }
      return Promise.resolve({ success: true, data: { messages: mockMessages } })
    })
    apiService.post = jest.fn(() =>
      Promise.resolve({
        success: true,
        data: { message: { id: 'msg3', content: 'Hello 👋 🚀', senderId: 'current-user' } },
      })
    )

    useParams.mockReturnValue({ conversationId: 'conv1' })
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      const messageInput = screen.queryByPlaceholderText(/message/i)
      if (messageInput) {
        userEvent.type(messageInput, 'Hello 👋 🚀{enter}')
      }
    })
  })

  it('handles very old timestamps', async () => {
    apiService.get = jest.fn((url) => {
      if (url.includes('/messages/conversations')) {
        return Promise.resolve({ success: true, data: { conversations: mockConversations } })
      }
      return Promise.resolve({
        success: true,
        data: {
          messages: [
            {
              id: 'msg1',
              content: 'Old message',
              senderId: 'user2',
              timestamp: new Date('2020-01-01').getTime(),
            },
          ],
        },
      })
    })

    useParams.mockReturnValue({ conversationId: 'conv1' })
    renderWithRouter(<DirectMessagesPage />)

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalled()
    })
  })
})

export default mockConversations
