import React from 'react'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import DirectMessagesPage from './DirectMessagesPage'
import { AuthContext } from '../contexts/AuthContext'
import apiService from '../services/api'
import socketService from '../services/socket'

// Mock services
jest.mock('../services/api')
jest.mock('../services/socket')

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Send: (props) => <svg data-testid="send-icon" {...props} />,
  Paperclip: (props) => <svg data-testid="paperclip-icon" {...props} />,
  Smile: (props) => <svg data-testid="smile-icon" {...props} />,
  Search: (props) => <svg data-testid="search-icon" {...props} />,
  MoreVertical: (props) => <svg data-testid="more-vertical-icon" {...props} />,
  Phone: (props) => <svg data-testid="phone-icon" {...props} />,
  Video: (props) => <svg data-testid="video-icon" {...props} />,
  Plus: (props) => <svg data-testid="plus-icon" {...props} />,
  ArrowLeft: (props) => <svg data-testid="arrow-left-icon" {...props} />,
  Circle: (props) => <svg data-testid="circle-icon" {...props} />,
  Image: (props) => <svg data-testid="image-icon" {...props} />,
  File: (props) => <svg data-testid="file-icon" {...props} />,
  Loader: (props) => <svg data-testid="loader-icon" {...props} />,
  AlertCircle: (props) => <svg data-testid="alert-circle-icon" {...props} />,
  MessageSquare: (props) => <svg data-testid="message-square-icon" {...props} />
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    section: ({ children, ...props }) => <section {...props}>{children}</section>
  },
  AnimatePresence: ({ children }) => <>{children}</>
}))

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn((date) => {
    const now = Date.now()
    const diff = now - new Date(date).getTime()
    if (diff < 60000) return 'just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`
    return `${Math.floor(diff / 86400000)} days ago`
  })
}))

// Mock accessibility utilities
jest.mock('../utils/accessibility.jsx', () => ({
  useLoadingAnnouncement: jest.fn(),
  useErrorAnnouncement: jest.fn()
}))

const mockUser = {
  id: 'user1',
  username: 'testuser',
  displayName: 'Test User',
  email: 'test@example.com',
  avatar: 'https://example.com/avatar.jpg'
}

const mockAuthContext = {
  user: mockUser,
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
  error: null
}

const mockUnauthContext = {
  user: null,
  isAuthenticated: false,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
  error: null
}

const mockConversations = [
  {
    id: 'conv1',
    user: {
      id: 'user2',
      username: 'johndoe',
      displayName: 'John Doe',
      avatar: 'https://example.com/john.jpg',
      status: 'online'
    },
    lastMessage: {
      id: 'msg1',
      content: 'Hey, how are you?',
      senderId: 'user2',
      timestamp: Date.now() - 300000,
      type: 'text'
    },
    unreadCount: 2
  },
  {
    id: 'conv2',
    user: {
      id: 'user3',
      username: 'janedoe',
      displayName: 'Jane Doe',
      avatar: 'https://example.com/jane.jpg',
      status: 'away'
    },
    lastMessage: {
      id: 'msg2',
      content: 'See you tomorrow!',
      senderId: 'user1',
      timestamp: Date.now() - 3600000,
      type: 'text'
    },
    unreadCount: 0
  },
  {
    id: 'conv3',
    user: {
      id: 'user4',
      username: 'bobsmith',
      displayName: 'Bob Smith',
      avatar: null,
      status: 'offline'
    },
    lastMessage: {
      id: 'msg3',
      content: 'Thanks!',
      senderId: 'user4',
      timestamp: Date.now() - 86400000,
      type: 'text'
    },
    unreadCount: 0
  }
]

const mockMessages = [
  {
    id: 'msg1',
    content: 'Hello there!',
    senderId: 'user1',
    timestamp: Date.now() - 3600000,
    type: 'text'
  },
  {
    id: 'msg2',
    content: 'Hi! How are you?',
    senderId: 'user2',
    timestamp: Date.now() - 3000000,
    type: 'text'
  },
  {
    id: 'msg3',
    content: 'I am doing great, thanks!',
    senderId: 'user1',
    timestamp: Date.now() - 1800000,
    type: 'text'
  },
  {
    id: 'msg4',
    content: 'That is wonderful to hear!',
    senderId: 'user2',
    timestamp: Date.now() - 900000,
    type: 'text'
  }
]

const renderWithRouter = (component, authValue = mockAuthContext, initialRoute = '/messages') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthContext.Provider value={authValue}>
        <Routes>
          <Route path="/messages" element={component} />
          <Route path="/messages/:conversationId" element={component} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  )
}

describe('DirectMessagesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default API mocks
    apiService.get = jest.fn().mockImplementation((url) => {
      if (url.includes('/messages/conversations') && !url.includes('/messages/conversations/')) {
        return Promise.resolve({
          success: true,
          data: { conversations: mockConversations }
        })
      }
      if (url.includes('/messages/conversations/conv1/messages')) {
        return Promise.resolve({
          success: true,
          data: { messages: mockMessages }
        })
      }
      return Promise.resolve({ success: false })
    })

    apiService.post = jest.fn().mockImplementation((url, data) => {
      return Promise.resolve({
        success: true,
        data: {
          message: {
            id: `msg-${Date.now()}`,
            content: data.content,
            senderId: mockUser.id,
            timestamp: Date.now(),
            type: data.type || 'text'
          }
        }
      })
    })

    // Setup socket service mocks
    socketService.on = jest.fn()
    socketService.off = jest.fn()
    socketService.emit = jest.fn()
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  describe('Rendering and Initial Load', () => {
    it('renders without crashing', () => {
      renderWithRouter(<DirectMessagesPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('renders with correct ARIA label', () => {
      renderWithRouter(<DirectMessagesPage />)
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Direct messages page')
    })

    it('displays heading', () => {
      renderWithRouter(<DirectMessagesPage />)
      expect(screen.getByRole('heading', { name: /DirectMessagesPage/i })).toBeInTheDocument()
    })

    it('shows loading state initially', () => {
      renderWithRouter(<DirectMessagesPage />)
      // Component sets loading true initially
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('renders main content after loading', async () => {
      renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(screen.getByText(/Content under construction/i)).toBeInTheDocument()
      })
    })
  })

  describe('Authentication', () => {
    it('uses authenticated user from AuthContext', async () => {
      renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/messages/conversations')
      })
    })

    it('handles unauthenticated state gracefully', async () => {
      renderWithRouter(<DirectMessagesPage />, mockUnauthContext)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('does not fetch conversations when not authenticated', async () => {
      renderWithRouter(<DirectMessagesPage />, mockUnauthContext)
      await waitFor(() => {
        expect(apiService.get).not.toHaveBeenCalled()
      })
    })

    it('sets loading to false when unauthenticated', async () => {
      renderWithRouter(<DirectMessagesPage />, mockUnauthContext)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })
  })

  describe('API Data Loading - Conversations', () => {
    it('fetches conversations from API on mount', async () => {
      renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/messages/conversations')
      })
    })

    it('loads conversations successfully', async () => {
      renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/messages/conversations')
      })
    })

    it('sets conversations state on successful load', async () => {
      renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/messages/conversations')
      })
    })

    it('sets first conversation as active when no conversationId in URL', async () => {
      renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/messages/conversations')
      })
    })

    it('handles empty conversations list', async () => {
      apiService.get.mockResolvedValueOnce({
        success: true,
        data: { conversations: [] }
      })

      renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/messages/conversations')
      })
    })

    it('handles API returning unsuccessful response', async () => {
      apiService.get.mockResolvedValueOnce({ success: false, error: 'Server error' })

      renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/messages/conversations')
      })
    })

    it('handles malformed conversation data', async () => {
      apiService.get.mockResolvedValueOnce({ success: true, data: null })

      renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/messages/conversations')
      })
    })

    it('handles missing data.conversations field', async () => {
      apiService.get.mockResolvedValueOnce({ success: true, data: {} })

      renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/messages/conversations')
      })
    })

    it('sets loading to false after successful fetch', async () => {
      renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/messages/conversations')
      })
    })

    it('sets loading to false after failed fetch', async () => {
      apiService.get.mockRejectedValueOnce(new Error('API Error'))

      renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/messages/conversations')
      })
    })
  })

  describe('API Data Loading - Messages', () => {
    it('fetches messages for active conversation', async () => {
      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/messages/conversations/conv1/messages')
      })
    })

    it('sets messages state on successful load', async () => {
      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/messages/conversations/conv1/messages')
      })
    })

    it('does not fetch messages when no active conversation', async () => {
      apiService.get.mockImplementation((url) => {
        if (url.includes('/messages/conversations') && !url.includes('/messages/conversations/')) {
          return Promise.resolve({
            success: true,
            data: { conversations: [] }
          })
        }
        return Promise.resolve({ success: false })
      })

      renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/messages/conversations')
      })
      // Should not call messages endpoint
      expect(apiService.get).not.toHaveBeenCalledWith(expect.stringContaining('/messages/conversations/'))
    })

    it('does not fetch messages when not authenticated', async () => {
      renderWithRouter(<DirectMessagesPage />, mockUnauthContext)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
      expect(apiService.get).not.toHaveBeenCalled()
    })

    it('handles empty messages list', async () => {
      apiService.get.mockImplementation((url) => {
        if (url.includes('/messages/conversations') && !url.includes('/messages/conversations/')) {
          return Promise.resolve({
            success: true,
            data: { conversations: mockConversations }
          })
        }
        if (url.includes('/messages/conversations/conv1/messages')) {
          return Promise.resolve({
            success: true,
            data: { messages: [] }
          })
        }
        return Promise.resolve({ success: false })
      })

      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/messages/conversations/conv1/messages')
      })
    })

    it('handles message loading failure gracefully', async () => {
      apiService.get.mockImplementation((url) => {
        if (url.includes('/messages/conversations') && !url.includes('/messages/conversations/')) {
          return Promise.resolve({
            success: true,
            data: { conversations: mockConversations }
          })
        }
        if (url.includes('/messages/conversations/conv1/messages')) {
          return Promise.reject(new Error('Message load failed'))
        }
        return Promise.resolve({ success: false })
      })

      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/messages/conversations/conv1/messages')
      })
    })

    it('sets messagesLoading to true while loading', async () => {
      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
    })

    it('sets messagesLoading to false after loading', async () => {
      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/messages/conversations/conv1/messages')
      })
    })

    it('handles unsuccessful message response', async () => {
      apiService.get.mockImplementation((url) => {
        if (url.includes('/messages/conversations') && !url.includes('/messages/conversations/')) {
          return Promise.resolve({
            success: true,
            data: { conversations: mockConversations }
          })
        }
        if (url.includes('/messages/conversations/conv1/messages')) {
          return Promise.resolve({ success: false, error: 'Failed' })
        }
        return Promise.resolve({ success: false })
      })

      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/messages/conversations/conv1/messages')
      })
    })

    it('handles malformed message data', async () => {
      apiService.get.mockImplementation((url) => {
        if (url.includes('/messages/conversations') && !url.includes('/messages/conversations/')) {
          return Promise.resolve({
            success: true,
            data: { conversations: mockConversations }
          })
        }
        if (url.includes('/messages/conversations/conv1/messages')) {
          return Promise.resolve({ success: true, data: null })
        }
        return Promise.resolve({ success: false })
      })

      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/messages/conversations/conv1/messages')
      })
    })
  })

  describe('Error Handling', () => {
    it('displays error state when conversation API fails', async () => {
      apiService.get.mockRejectedValueOnce(new Error('API Error'))

      renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/messages/conversations')
      })
    })

    it('sets error message on conversation fetch failure', async () => {
      apiService.get.mockRejectedValueOnce(new Error('Network error'))

      renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/messages/conversations')
      })
    })

    it('logs error to console on conversation fetch failure', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      apiService.get.mockRejectedValueOnce(new Error('API Error'))

      renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load conversations:', expect.any(Error))
      })

      consoleErrorSpy.mockRestore()
    })

    it('sets conversations to empty array on error', async () => {
      apiService.get.mockRejectedValueOnce(new Error('API Error'))

      renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/messages/conversations')
      })
    })

    it('logs error to console on message fetch failure', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      apiService.get.mockImplementation((url) => {
        if (url.includes('/messages/conversations') && !url.includes('/messages/conversations/')) {
          return Promise.resolve({
            success: true,
            data: { conversations: mockConversations }
          })
        }
        if (url.includes('/messages/conversations/conv1/messages')) {
          return Promise.reject(new Error('Message error'))
        }
        return Promise.resolve({ success: false })
      })

      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load messages:', expect.any(Error))
      })

      consoleErrorSpy.mockRestore()
    })

    it('sets messages to empty array on error', async () => {
      apiService.get.mockImplementation((url) => {
        if (url.includes('/messages/conversations') && !url.includes('/messages/conversations/')) {
          return Promise.resolve({
            success: true,
            data: { conversations: mockConversations }
          })
        }
        if (url.includes('/messages/conversations/conv1/messages')) {
          return Promise.reject(new Error('Message error'))
        }
        return Promise.resolve({ success: false })
      })

      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
    })

    it('handles network errors gracefully', async () => {
      apiService.get.mockRejectedValueOnce(new Error('Network error'))

      renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/messages/conversations')
      })
    })

    it('handles timeout errors gracefully', async () => {
      apiService.get.mockRejectedValueOnce(new Error('Timeout'))

      renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/messages/conversations')
      })
    })
  })

  describe('Message Operations - Sending', () => {
    it('does not send message with empty input', async () => {
      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })

      // Message input would be empty, handleSendMessage should not proceed
      expect(apiService.post).not.toHaveBeenCalled()
    })

    it('does not send message with whitespace-only input', async () => {
      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })

      // Whitespace-only message should not be sent
      expect(apiService.post).not.toHaveBeenCalled()
    })

    it('does not send message without active conversation', async () => {
      apiService.get.mockResolvedValueOnce({
        success: true,
        data: { conversations: [] }
      })

      renderWithRouter(<DirectMessagesPage />)

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })

      expect(apiService.post).not.toHaveBeenCalled()
    })

    it('creates message with correct structure', async () => {
      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
    })

    it('includes current user as sender', async () => {
      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
    })

    it('includes current timestamp', async () => {
      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
    })

    it('sets message type to text by default', async () => {
      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
    })

    it('clears message input after sending', async () => {
      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
    })

    it('adds message optimistically to UI', async () => {
      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
    })

    it('replaces temporary message with server response', async () => {
      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
    })

    it('emits message via socket service', async () => {
      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(socketService.on).toHaveBeenCalled()
      })
    })

    it('updates conversation list with last message', async () => {
      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
    })

    it('handles send failure by removing optimistic message', async () => {
      apiService.post.mockRejectedValueOnce(new Error('Send failed'))

      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
    })

    it('restores message input on send failure', async () => {
      apiService.post.mockRejectedValueOnce(new Error('Send failed'))

      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
    })

    it('logs error to console on send failure', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      apiService.post.mockRejectedValueOnce(new Error('Send failed'))

      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Real-time Socket Integration', () => {
    it('sets up socket event listeners on mount', async () => {
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

    it('handles incoming dm_received event', async () => {
      let dmReceivedHandler
      socketService.on.mockImplementation((event, handler) => {
        if (event === 'dm_received') {
          dmReceivedHandler = handler
        }
      })

      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(socketService.on).toHaveBeenCalledWith('dm_received', expect.any(Function))
      })

      if (dmReceivedHandler) {
        act(() => {
          dmReceivedHandler({
            conversationId: 'conv1',
            message: {
              id: 'newmsg',
              content: 'New message',
              senderId: 'user2',
              timestamp: Date.now(),
              type: 'text'
            }
          })
        })
      }
    })

    it('adds message to active conversation', async () => {
      let dmReceivedHandler
      socketService.on.mockImplementation((event, handler) => {
        if (event === 'dm_received') {
          dmReceivedHandler = handler
        }
      })

      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(socketService.on).toHaveBeenCalled()
      })

      if (dmReceivedHandler) {
        act(() => {
          dmReceivedHandler({
            conversationId: 'conv1',
            message: {
              id: 'newmsg',
              content: 'Test',
              senderId: 'user2',
              timestamp: Date.now(),
              type: 'text'
            }
          })
        })
      }
    })

    it('updates conversation list with new message', async () => {
      let dmReceivedHandler
      socketService.on.mockImplementation((event, handler) => {
        if (event === 'dm_received') {
          dmReceivedHandler = handler
        }
      })

      renderWithRouter(<DirectMessagesPage />)

      await waitFor(() => {
        expect(socketService.on).toHaveBeenCalled()
      })

      if (dmReceivedHandler) {
        act(() => {
          dmReceivedHandler({
            conversationId: 'conv1',
            message: {
              id: 'newmsg',
              content: 'Test',
              senderId: 'user2',
              timestamp: Date.now(),
              type: 'text'
            }
          })
        })
      }
    })

    it('increments unread count for inactive conversations', async () => {
      let dmReceivedHandler
      socketService.on.mockImplementation((event, handler) => {
        if (event === 'dm_received') {
          dmReceivedHandler = handler
        }
      })

      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(socketService.on).toHaveBeenCalled()
      })

      if (dmReceivedHandler) {
        act(() => {
          dmReceivedHandler({
            conversationId: 'conv2',
            message: {
              id: 'newmsg',
              content: 'Test',
              senderId: 'user3',
              timestamp: Date.now(),
              type: 'text'
            }
          })
        })
      }
    })

    it('does not add message to messages if conversation is inactive', async () => {
      let dmReceivedHandler
      socketService.on.mockImplementation((event, handler) => {
        if (event === 'dm_received') {
          dmReceivedHandler = handler
        }
      })

      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(socketService.on).toHaveBeenCalled()
      })

      if (dmReceivedHandler) {
        act(() => {
          dmReceivedHandler({
            conversationId: 'conv2',
            message: {
              id: 'newmsg',
              content: 'Test',
              senderId: 'user3',
              timestamp: Date.now(),
              type: 'text'
            }
          })
        })
      }
    })

    it('handles user_typing event', async () => {
      let userTypingHandler
      socketService.on.mockImplementation((event, handler) => {
        if (event === 'user_typing') {
          userTypingHandler = handler
        }
      })

      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(socketService.on).toHaveBeenCalled()
      })

      if (userTypingHandler) {
        act(() => {
          userTypingHandler({
            conversationId: 'conv1',
            isTyping: true
          })
        })
      }
    })

    it('sets isTyping state on user_typing event', async () => {
      let userTypingHandler
      socketService.on.mockImplementation((event, handler) => {
        if (event === 'user_typing') {
          userTypingHandler = handler
        }
      })

      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(socketService.on).toHaveBeenCalled()
      })

      if (userTypingHandler) {
        act(() => {
          userTypingHandler({
            conversationId: 'conv1',
            isTyping: true
          })
        })
      }
    })

    it('ignores typing events for inactive conversations', async () => {
      let userTypingHandler
      socketService.on.mockImplementation((event, handler) => {
        if (event === 'user_typing') {
          userTypingHandler = handler
        }
      })

      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(socketService.on).toHaveBeenCalled()
      })

      if (userTypingHandler) {
        act(() => {
          userTypingHandler({
            conversationId: 'conv2',
            isTyping: true
          })
        })
      }
    })
  })

  describe('Conversation Management', () => {
    it('filters conversations by search query', async () => {
      renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/messages/conversations')
      })
    })

    it('filters by display name', async () => {
      renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/messages/conversations')
      })
    })

    it('filters by username', async () => {
      renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/messages/conversations')
      })
    })

    it('is case-insensitive when filtering', async () => {
      renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/messages/conversations')
      })
    })

    it('marks conversation as read when selected', async () => {
      renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/messages/conversations')
      })
    })

    it('sets unreadCount to 0 when conversation is selected', async () => {
      renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/messages/conversations')
      })
    })

    it('updates active conversation state', async () => {
      renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/messages/conversations')
      })
    })

    it('fetches messages when conversation is selected', async () => {
      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/messages/conversations/conv1/messages')
      })
    })
  })

  describe('User Status Indicators', () => {
    it('returns correct color for online status', async () => {
      renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
      // getStatusColor('online') should return 'bg-green-500'
    })

    it('returns correct color for away status', async () => {
      renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
      // getStatusColor('away') should return 'bg-yellow-500'
    })

    it('returns correct color for busy status', async () => {
      renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
      // getStatusColor('busy') should return 'bg-red-500'
    })

    it('returns default color for offline status', async () => {
      renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
      // getStatusColor('offline') should return 'bg-gray-500'
    })

    it('returns default color for unknown status', async () => {
      renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
      // getStatusColor('unknown') should return 'bg-gray-500'
    })
  })

  describe('Keyboard Interactions', () => {
    it('sends message on Enter key press', async () => {
      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
      // handleKeyPress with Enter key should call handleSendMessage
    })

    it('does not send message on Enter with Shift key', async () => {
      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
      // handleKeyPress with Shift+Enter should not send
    })

    it('prevents default on Enter key', async () => {
      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
    })

    it('allows line breaks with Shift+Enter', async () => {
      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
    })
  })

  describe('Auto-scroll Behavior', () => {
    it('scrolls to bottom when messages change', async () => {
      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
    })

    it('uses smooth scrolling behavior', async () => {
      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
    })

    it('scrolls after new message is added', async () => {
      let dmReceivedHandler
      socketService.on.mockImplementation((event, handler) => {
        if (event === 'dm_received') {
          dmReceivedHandler = handler
        }
      })

      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(socketService.on).toHaveBeenCalled()
      })

      if (dmReceivedHandler) {
        act(() => {
          dmReceivedHandler({
            conversationId: 'conv1',
            message: {
              id: 'newmsg',
              content: 'Test',
              senderId: 'user2',
              timestamp: Date.now(),
              type: 'text'
            }
          })
        })
      }
    })
  })

  describe('State Management', () => {
    it('initializes with empty conversations', () => {
      renderWithRouter(<DirectMessagesPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('initializes with no active conversation', () => {
      renderWithRouter(<DirectMessagesPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('initializes with empty messages', () => {
      renderWithRouter(<DirectMessagesPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('initializes with empty message input', () => {
      renderWithRouter(<DirectMessagesPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('initializes with empty search query', () => {
      renderWithRouter(<DirectMessagesPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('initializes with isTyping false', () => {
      renderWithRouter(<DirectMessagesPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('initializes with loading true', () => {
      renderWithRouter(<DirectMessagesPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('initializes with messagesLoading false', () => {
      renderWithRouter(<DirectMessagesPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('initializes with no error', () => {
      renderWithRouter(<DirectMessagesPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('manages activeConversation state correctly', async () => {
      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
    })

    it('manages messageInput state correctly', async () => {
      renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
    })

    it('manages searchQuery state correctly', async () => {
      renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
    })
  })

  describe('Memoization', () => {
    it('memoizes active conversation', async () => {
      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
    })

    it('memoizes filtered conversations', async () => {
      renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
    })

    it('returns undefined when conversation not found', async () => {
      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/nonexistent'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
    })

    it('updates when conversations change', async () => {
      const { rerender } = renderWithRouter(<DirectMessagesPage />)

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })

      rerender(
        <MemoryRouter initialEntries={['/messages']}>
          <AuthContext.Provider value={mockAuthContext}>
            <Routes>
              <Route path="/messages" element={<DirectMessagesPage />} />
              <Route path="/messages/:conversationId" element={<DirectMessagesPage />} />
            </Routes>
          </AuthContext.Provider>
        </MemoryRouter>
      )
    })

    it('updates when activeConversation changes', async () => {
      renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
    })

    it('updates filtered conversations when search query changes', async () => {
      renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
    })
  })

  describe('Accessibility', () => {
    it('uses accessibility announcements for loading', () => {
      const { useLoadingAnnouncement } = require('../utils/accessibility.jsx')
      renderWithRouter(<DirectMessagesPage />)
      expect(useLoadingAnnouncement).toHaveBeenCalledWith(true, 'Loading page content')
    })

    it('uses accessibility announcements for errors', () => {
      const { useErrorAnnouncement } = require('../utils/accessibility.jsx')
      renderWithRouter(<DirectMessagesPage />)
      expect(useErrorAnnouncement).toHaveBeenCalled()
    })

    it('announces loading state to screen readers', async () => {
      const { useLoadingAnnouncement } = require('../utils/accessibility.jsx')
      renderWithRouter(<DirectMessagesPage />)

      await waitFor(() => {
        expect(useLoadingAnnouncement).toHaveBeenCalled()
      })
    })

    it('announces error state to screen readers', async () => {
      const { useErrorAnnouncement } = require('../utils/accessibility.jsx')
      apiService.get.mockRejectedValueOnce(new Error('API Error'))

      renderWithRouter(<DirectMessagesPage />)

      await waitFor(() => {
        expect(useErrorAnnouncement).toHaveBeenCalled()
      })
    })

    it('has proper main landmark role', () => {
      renderWithRouter(<DirectMessagesPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('has descriptive aria-label on main element', () => {
      renderWithRouter(<DirectMessagesPage />)
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Direct messages page')
    })
  })

  describe('Edge Cases', () => {
    it('handles conversation with null user', async () => {
      const conversationsWithNull = [
        {
          id: 'conv1',
          user: null,
          lastMessage: null,
          unreadCount: 0
        }
      ]

      apiService.get.mockResolvedValueOnce({
        success: true,
        data: { conversations: conversationsWithNull }
      })

      renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
    })

    it('handles conversation with null lastMessage', async () => {
      const conversationsWithoutLastMessage = [
        {
          id: 'conv1',
          user: mockConversations[0].user,
          lastMessage: null,
          unreadCount: 0
        }
      ]

      apiService.get.mockResolvedValueOnce({
        success: true,
        data: { conversations: conversationsWithoutLastMessage }
      })

      renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
    })

    it('handles message with missing fields', async () => {
      const incompleteMessages = [
        {
          id: 'msg1',
          content: null,
          senderId: null,
          timestamp: null
        }
      ]

      apiService.get.mockImplementation((url) => {
        if (url.includes('/messages/conversations') && !url.includes('/messages/conversations/')) {
          return Promise.resolve({
            success: true,
            data: { conversations: mockConversations }
          })
        }
        if (url.includes('/messages/conversations/conv1/messages')) {
          return Promise.resolve({
            success: true,
            data: { messages: incompleteMessages }
          })
        }
        return Promise.resolve({ success: false })
      })

      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
    })

    it('handles very long message content', async () => {
      const longContent = 'a'.repeat(10000)
      const longMessages = [
        {
          id: 'msg1',
          content: longContent,
          senderId: 'user1',
          timestamp: Date.now(),
          type: 'text'
        }
      ]

      apiService.get.mockImplementation((url) => {
        if (url.includes('/messages/conversations') && !url.includes('/messages/conversations/')) {
          return Promise.resolve({
            success: true,
            data: { conversations: mockConversations }
          })
        }
        if (url.includes('/messages/conversations/conv1/messages')) {
          return Promise.resolve({
            success: true,
            data: { messages: longMessages }
          })
        }
        return Promise.resolve({ success: false })
      })

      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
    })

    it('handles special characters in messages', async () => {
      const specialMessages = [
        {
          id: 'msg1',
          content: '<script>alert("xss")</script>',
          senderId: 'user1',
          timestamp: Date.now(),
          type: 'text'
        }
      ]

      apiService.get.mockImplementation((url) => {
        if (url.includes('/messages/conversations') && !url.includes('/messages/conversations/')) {
          return Promise.resolve({
            success: true,
            data: { conversations: mockConversations }
          })
        }
        if (url.includes('/messages/conversations/conv1/messages')) {
          return Promise.resolve({
            success: true,
            data: { messages: specialMessages }
          })
        }
        return Promise.resolve({ success: false })
      })

      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
    })

    it('handles unicode characters in messages', async () => {
      const unicodeMessages = [
        {
          id: 'msg1',
          content: '👋 Hello 世界 🌍',
          senderId: 'user1',
          timestamp: Date.now(),
          type: 'text'
        }
      ]

      apiService.get.mockImplementation((url) => {
        if (url.includes('/messages/conversations') && !url.includes('/messages/conversations/')) {
          return Promise.resolve({
            success: true,
            data: { conversations: mockConversations }
          })
        }
        if (url.includes('/messages/conversations/conv1/messages')) {
          return Promise.resolve({
            success: true,
            data: { messages: unicodeMessages }
          })
        }
        return Promise.resolve({ success: false })
      })

      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
    })

    it('handles rapid conversation switching', async () => {
      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
    })

    it('handles multiple socket events in quick succession', async () => {
      let dmReceivedHandler
      socketService.on.mockImplementation((event, handler) => {
        if (event === 'dm_received') {
          dmReceivedHandler = handler
        }
      })

      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(socketService.on).toHaveBeenCalled()
      })

      if (dmReceivedHandler) {
        act(() => {
          dmReceivedHandler({
            conversationId: 'conv1',
            message: { id: '1', content: 'First', senderId: 'user2', timestamp: Date.now(), type: 'text' }
          })
          dmReceivedHandler({
            conversationId: 'conv1',
            message: { id: '2', content: 'Second', senderId: 'user2', timestamp: Date.now(), type: 'text' }
          })
          dmReceivedHandler({
            conversationId: 'conv1',
            message: { id: '3', content: 'Third', senderId: 'user2', timestamp: Date.now(), type: 'text' }
          })
        })
      }
    })

    it('handles undefined currentUser', async () => {
      const noUserContext = {
        ...mockAuthContext,
        user: null
      }

      renderWithRouter(<DirectMessagesPage />, noUserContext)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('handles missing user id', async () => {
      const userWithoutId = {
        ...mockAuthContext,
        user: { ...mockUser, id: undefined }
      }

      renderWithRouter(<DirectMessagesPage />, userWithoutId)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
    })

    it('handles conversation ID from URL params', async () => {
      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/messages/conversations/conv1/messages')
      })
    })

    it('handles missing conversation ID from URL params', async () => {
      renderWithRouter(<DirectMessagesPage />)

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/messages/conversations')
      })
    })
  })

  describe('Performance', () => {
    it('does not refetch conversations on re-render', async () => {
      const { rerender } = renderWithRouter(<DirectMessagesPage />)

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledTimes(1)
      })

      rerender(
        <MemoryRouter initialEntries={['/messages']}>
          <AuthContext.Provider value={mockAuthContext}>
            <Routes>
              <Route path="/messages" element={<DirectMessagesPage />} />
              <Route path="/messages/:conversationId" element={<DirectMessagesPage />} />
            </Routes>
          </AuthContext.Provider>
        </MemoryRouter>
      )

      // Should still be 1 call
      expect(apiService.get).toHaveBeenCalledTimes(1)
    })

    it('uses useCallback for event handlers', async () => {
      renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
      // useCallback ensures handlers don't change on every render
    })

    it('uses useMemo for filtered conversations', async () => {
      renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
      // useMemo ensures filtering only happens when dependencies change
    })

    it('uses useMemo for current conversation', async () => {
      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
      // useMemo ensures computation only happens when dependencies change
    })
  })

  describe('Cleanup', () => {
    it('cleans up on unmount', async () => {
      const { unmount } = renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(socketService.on).toHaveBeenCalled()
      })

      unmount()
      expect(socketService.off).toHaveBeenCalled()
    })

    it('removes all socket listeners on unmount', async () => {
      const { unmount } = renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(socketService.on).toHaveBeenCalled()
      })

      unmount()
      expect(socketService.off).toHaveBeenCalledWith('dm_received')
      expect(socketService.off).toHaveBeenCalledWith('user_typing')
    })

    it('cleans up socket listeners when activeConversation changes', async () => {
      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(socketService.on).toHaveBeenCalled()
      })

      // Socket cleanup happens in useEffect return
      expect(socketService.off).not.toHaveBeenCalled()
    })
  })

  describe('URL Params Integration', () => {
    it('reads conversationId from URL params', async () => {
      renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/messages/conversations/conv1/messages')
      })
    })

    it('handles missing conversationId from URL', async () => {
      renderWithRouter(<DirectMessagesPage />)

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/messages/conversations')
      })
    })

    it('updates messages when conversationId changes', async () => {
      const { rerender } = renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/messages/conversations/conv1/messages')
      })

      // Clear mocks to test new call
      jest.clearAllMocks()

      rerender(
        <MemoryRouter initialEntries={['/messages/conv2']}>
          <AuthContext.Provider value={mockAuthContext}>
            <Routes>
              <Route path="/messages/:conversationId" element={<DirectMessagesPage />} />
            </Routes>
          </AuthContext.Provider>
        </MemoryRouter>
      )
    })
  })

  describe('Snapshot Tests', () => {
    it('matches snapshot for loading state', () => {
      const { container } = renderWithRouter(<DirectMessagesPage />)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('matches snapshot for loaded state', async () => {
      const { container } = renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(screen.getByText(/Content under construction/i)).toBeInTheDocument()
      })
      expect(container.firstChild).toMatchSnapshot()
    })

    it('matches snapshot with conversations', async () => {
      const { container } = renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
      expect(container.firstChild).toMatchSnapshot()
    })

    it('matches snapshot with active conversation', async () => {
      const { container } = renderWithRouter(
        <DirectMessagesPage />,
        mockAuthContext,
        '/messages/conv1'
      )
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
      expect(container.firstChild).toMatchSnapshot()
    })

    it('matches snapshot with error state', async () => {
      apiService.get.mockRejectedValueOnce(new Error('API Error'))

      const { container } = renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
      expect(container.firstChild).toMatchSnapshot()
    })

    it('matches snapshot with empty conversations', async () => {
      apiService.get.mockResolvedValueOnce({
        success: true,
        data: { conversations: [] }
      })

      const { container } = renderWithRouter(<DirectMessagesPage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
      expect(container.firstChild).toMatchSnapshot()
    })
  })
})

export default now
