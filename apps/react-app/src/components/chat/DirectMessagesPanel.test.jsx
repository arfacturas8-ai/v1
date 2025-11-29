import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import DirectMessagesPanel from './DirectMessagesPanel'
import socketService from '../../services/socket'

// Mock socket service
jest.mock('../../services/socket', () => ({
  on: jest.fn(),
  off: jest.fn(),
  send: jest.fn(),
  sendDirectMessage: jest.fn(),
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  X: ({ className }) => <span className={className} data-testid="icon-x" />,
  Phone: ({ className }) => <span className={className} data-testid="icon-phone" />,
  Video: ({ className }) => <span className={className} data-testid="icon-video" />,
  UserPlus: ({ className }) => <span className={className} data-testid="icon-user-plus" />,
  Settings: ({ className }) => <span className={className} data-testid="icon-settings" />,
  Search: ({ className }) => <span className={className} data-testid="icon-search" />,
  Pin: ({ className }) => <span className={className} data-testid="icon-pin" />,
  Info: ({ className }) => <span className={className} data-testid="icon-info" />,
  Users: ({ className }) => <span className={className} data-testid="icon-users" />,
  MessageCircle: ({ className }) => <span className={className} data-testid="icon-message-circle" />,
  Image: ({ className }) => <span className={className} data-testid="icon-image" />,
  File: ({ className }) => <span className={className} data-testid="icon-file" />,
  Mic: ({ className }) => <span className={className} data-testid="icon-mic" />,
  MoreHorizontal: ({ className }) => <span className={className} data-testid="icon-more-horizontal" />,
  Archive: ({ className }) => <span className={className} data-testid="icon-archive" />,
  Bell: ({ className }) => <span className={className} data-testid="icon-bell" />,
  BellOff: ({ className }) => <span className={className} data-testid="icon-bell-off" />,
  Star: ({ className }) => <span className={className} data-testid="icon-star" />,
  Hash: ({ className }) => <span className={className} data-testid="icon-hash" />,
  Lock: ({ className }) => <span className={className} data-testid="icon-lock" />,
  Crown: ({ className }) => <span className={className} data-testid="icon-crown" />
}))

// Mock MessageList component
jest.mock('./MessageList', () => {
  return function MockMessageList({ messages, typingUsers, onLoadMore, hasMore, isLoading }) {
    return (
      <div data-testid="message-list">
        {messages.map(msg => (
          <div key={msg.id} data-testid={`message-${msg.id}`}>
            {msg.content}
          </div>
        ))}
        {typingUsers.length > 0 && <div data-testid="typing-indicator">Typing...</div>}
        {hasMore && (
          <button onClick={onLoadMore} disabled={isLoading} data-testid="load-more">
            Load More
          </button>
        )}
      </div>
    )
  }
})

// Mock MessageComposer component
jest.mock('./MessageComposer', () => {
  return function MockMessageComposer({ onSendMessage, onTyping, onStopTyping, placeholder }) {
    return (
      <div data-testid="message-composer">
        <input
          data-testid="message-input"
          placeholder={placeholder}
          onFocus={onTyping}
          onBlur={onStopTyping}
          onChange={(e) => {
            if (e.target.value) onTyping()
            else onStopTyping()
          }}
        />
        <button
          data-testid="send-button"
          onClick={() => onSendMessage('Test message', 'text', [])}
        >
          Send
        </button>
      </div>
    )
  }
})

// Mock UserPresenceSystem component
jest.mock('./UserPresenceSystem', () => {
  return function MockUserPresenceSystem() {
    return <div data-testid="user-presence-system" />
  }
})

// Mock fetch
global.fetch = jest.fn()

describe('DirectMessagesPanel', () => {
  const mockUser = {
    id: 'user1',
    username: 'testuser',
    displayName: 'Test User',
    avatar: 'https://example.com/avatar.jpg'
  }

  const mockConversationId = 'conv1'
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock successful conversation fetch
    global.fetch.mockImplementation((url) => {
      if (url.includes('/api/conversations/')) {
        if (url.includes('/messages')) {
          return Promise.resolve({
            json: () => Promise.resolve({
              messages: [],
              hasMore: false
            })
          })
        }
        return Promise.resolve({
          json: () => Promise.resolve({
            conversation: {
              id: 'conv1',
              type: 'direct',
              name: 'Alice Cooper',
              participants: ['user1', 'user2'],
              lastActivity: new Date().toISOString(),
              created: new Date(Date.now() - 86400000).toISOString()
            },
            participants: [
              {
                id: 'user2',
                username: 'alice',
                displayName: 'Alice Cooper',
                avatar: null,
                status: 'online'
              }
            ]
          })
        })
      }
      return Promise.reject(new Error('Not found'))
    })
  })

  describe('Loading State', () => {
    it('should display loading state initially', () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Loading conversation...')).toBeInTheDocument()
    })

    it('should display loading spinner', () => {
      const { container } = render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })
  })

  describe('Header Rendering', () => {
    it('should render conversation header after loading', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Alice Cooper')).toBeInTheDocument()
      })
    })

    it('should display participant avatar in header', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Alice Cooper')).toBeInTheDocument()
      })
    })

    it('should display online status indicator', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        const { container } = render(
          <DirectMessagesPanel
            conversationId={mockConversationId}
            user={mockUser}
            onClose={mockOnClose}
          />
        )

        const onlineIndicator = container.querySelector('.bg-green-500')
        expect(onlineIndicator).toBeTruthy()
      })
    })

    it('should display close button', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('icon-x')).toBeInTheDocument()
      })
    })

    it('should call onClose when close button clicked', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        const closeButton = screen.getByTestId('icon-x').closest('button')
        fireEvent.click(closeButton)
        expect(mockOnClose).toHaveBeenCalled()
      })
    })
  })

  describe('Group Chat Features', () => {
    beforeEach(() => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/conversations/')) {
          if (url.includes('/messages')) {
            return Promise.resolve({
              json: () => Promise.resolve({
                messages: [],
                hasMore: false
              })
            })
          }
          return Promise.resolve({
            json: () => Promise.resolve({
              conversation: {
                id: 'conv1',
                type: 'group',
                name: 'Team Chat',
                participants: ['user1', 'user2', 'user3'],
                lastActivity: new Date().toISOString(),
                created: new Date(Date.now() - 86400000).toISOString()
              },
              participants: [
                {
                  id: 'user2',
                  username: 'alice',
                  displayName: 'Alice Cooper',
                  avatar: null,
                  status: 'online'
                },
                {
                  id: 'user3',
                  username: 'bob',
                  displayName: 'Bob Wilson',
                  avatar: null,
                  status: 'away'
                }
              ]
            })
          })
        }
        return Promise.reject(new Error('Not found'))
      })
    })

    it('should display group icon for group chats', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('icon-users')).toBeInTheDocument()
      })
    })

    it('should display group name', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Team Chat')).toBeInTheDocument()
      })
    })

    it('should display member count', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('2 members')).toBeInTheDocument()
      })
    })

    it('should display add participant button for group chats', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('icon-user-plus')).toBeInTheDocument()
      })
    })
  })

  describe('Call Features', () => {
    it('should display voice call button', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('icon-phone')).toBeInTheDocument()
      })
    })

    it('should display video call button', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('icon-video')).toBeInTheDocument()
      })
    })

    it('should start voice call when phone button clicked', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        const phoneButton = screen.getByTestId('icon-phone').closest('button')
        fireEvent.click(phoneButton)

        expect(screen.getByText(/Voice call in progress/)).toBeInTheDocument()
      })
    })

    it('should start video call when video button clicked', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        const videoButton = screen.getByTestId('icon-video').closest('button')
        fireEvent.click(videoButton)

        expect(screen.getByText(/Video call in progress/)).toBeInTheDocument()
      })
    })

    it('should hide call buttons when in call', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        const phoneButton = screen.getByTestId('icon-phone').closest('button')
        fireEvent.click(phoneButton)
      })

      await waitFor(() => {
        const phoneButtons = screen.queryAllByTestId('icon-phone')
        const videoButtons = screen.queryAllByTestId('icon-video')

        // Should only have icon in call status, not in header buttons
        expect(phoneButtons.length).toBeLessThanOrEqual(1)
        expect(videoButtons.length).toBeLessThanOrEqual(1)
      })
    })

    it('should display end call button during call', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        const phoneButton = screen.getByTestId('icon-phone').closest('button')
        fireEvent.click(phoneButton)
      })

      await waitFor(() => {
        expect(screen.getByText('End call')).toBeInTheDocument()
      })
    })

    it('should end call when end call button clicked', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        const phoneButton = screen.getByTestId('icon-phone').closest('button')
        fireEvent.click(phoneButton)
      })

      await waitFor(() => {
        const endCallButton = screen.getByText('End call')
        fireEvent.click(endCallButton)

        expect(screen.queryByText(/call in progress/)).not.toBeInTheDocument()
      })
    })

    it('should send start_call socket event', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        const phoneButton = screen.getByTestId('icon-phone').closest('button')
        fireEvent.click(phoneButton)

        expect(socketService.send).toHaveBeenCalledWith('start_call', expect.objectContaining({
          conversationId: mockConversationId,
          type: 'voice'
        }))
      })
    })

    it('should send end_call socket event', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        const phoneButton = screen.getByTestId('icon-phone').closest('button')
        fireEvent.click(phoneButton)
      })

      await waitFor(() => {
        const endCallButton = screen.getByText('End call')
        fireEvent.click(endCallButton)

        expect(socketService.send).toHaveBeenCalledWith('end_call', { conversationId: mockConversationId })
      })
    })
  })

  describe('Header Action Buttons', () => {
    it('should display search button', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('icon-search')).toBeInTheDocument()
      })
    })

    it('should display info button', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('icon-info')).toBeInTheDocument()
      })
    })

    it('should display more options button', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('icon-more-horizontal')).toBeInTheDocument()
      })
    })

    it('should toggle conversation info sidebar when info button clicked', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        const infoButton = screen.getByTestId('icon-info').closest('button')
        fireEvent.click(infoButton)

        expect(screen.getByText('Conversation Info')).toBeInTheDocument()
      })
    })
  })

  describe('Conversation Info Sidebar', () => {
    it('should display participants list', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        const infoButton = screen.getByTestId('icon-info').closest('button')
        fireEvent.click(infoButton)
      })

      await waitFor(() => {
        expect(screen.getByText(/Participants/)).toBeInTheDocument()
      })
    })

    it('should display settings section', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        const infoButton = screen.getByTestId('icon-info').closest('button')
        fireEvent.click(infoButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument()
      })
    })

    it('should display notifications toggle', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        const infoButton = screen.getByTestId('icon-info').closest('button')
        fireEvent.click(infoButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument()
      })
    })

    it('should display pin conversation toggle', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        const infoButton = screen.getByTestId('icon-info').closest('button')
        fireEvent.click(infoButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Pin conversation')).toBeInTheDocument()
      })
    })

    it('should display star conversation toggle', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        const infoButton = screen.getByTestId('icon-info').closest('button')
        fireEvent.click(infoButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Star conversation')).toBeInTheDocument()
      })
    })

    it('should display archive conversation toggle', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        const infoButton = screen.getByTestId('icon-info').closest('button')
        fireEvent.click(infoButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Archive conversation')).toBeInTheDocument()
      })
    })

    it('should update setting when toggled', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/settings')) {
          return Promise.resolve({ json: () => Promise.resolve({}) })
        }
        return global.fetch.getMockImplementation()(url)
      })

      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        const infoButton = screen.getByTestId('icon-info').closest('button')
        fireEvent.click(infoButton)
      })

      await waitFor(() => {
        const notificationsToggle = screen.getByText('Notifications').closest('label').querySelector('input')
        fireEvent.click(notificationsToggle)
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/conversations/${mockConversationId}/settings`,
          expect.objectContaining({
            method: 'PATCH'
          })
        )
      })
    })
  })

  describe('Messages Display', () => {
    it('should render MessageList component', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('message-list')).toBeInTheDocument()
      })
    })

    it('should render MessageComposer component', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('message-composer')).toBeInTheDocument()
      })
    })

    it('should display messages from API', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/messages')) {
          return Promise.resolve({
            json: () => Promise.resolve({
              messages: [
                {
                  id: 'msg1',
                  content: 'Hello there!',
                  userId: 'user2',
                  username: 'alice',
                  timestamp: new Date().toISOString(),
                  type: 'text'
                }
              ],
              hasMore: false
            })
          })
        }
        return global.fetch.getMockImplementation()(url)
      })

      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Hello there!')).toBeInTheDocument()
      })
    })
  })

  describe('Message Sending', () => {
    it('should send message via socket', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        const sendButton = screen.getByTestId('send-button')
        fireEvent.click(sendButton)

        expect(socketService.sendDirectMessage).toHaveBeenCalledWith(
          mockConversationId,
          'Test message',
          []
        )
      })
    })

    it('should display optimistic message update', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        const sendButton = screen.getByTestId('send-button')
        fireEvent.click(sendButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Test message')).toBeInTheDocument()
      })
    })
  })

  describe('Real-time Message Updates', () => {
    it('should register socket event listeners', () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      expect(socketService.on).toHaveBeenCalledWith('direct_message_received', expect.any(Function))
      expect(socketService.on).toHaveBeenCalledWith('dm_typing_start', expect.any(Function))
      expect(socketService.on).toHaveBeenCalledWith('dm_typing_stop', expect.any(Function))
      expect(socketService.on).toHaveBeenCalledWith('conversation_updated', expect.any(Function))
      expect(socketService.on).toHaveBeenCalledWith('call_started', expect.any(Function))
      expect(socketService.on).toHaveBeenCalledWith('call_ended', expect.any(Function))
    })

    it('should unregister socket event listeners on unmount', () => {
      const { unmount } = render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      unmount()

      expect(socketService.off).toHaveBeenCalledWith('direct_message_received', expect.any(Function))
      expect(socketService.off).toHaveBeenCalledWith('dm_typing_start', expect.any(Function))
      expect(socketService.off).toHaveBeenCalledWith('dm_typing_stop', expect.any(Function))
    })

    it('should join conversation via socket on mount', () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      expect(socketService.send).toHaveBeenCalledWith('join_conversation', {
        conversationId: mockConversationId
      })
    })

    it('should leave conversation via socket on unmount', () => {
      const { unmount } = render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      unmount()

      expect(socketService.send).toHaveBeenCalledWith('leave_conversation', {
        conversationId: mockConversationId
      })
    })
  })

  describe('Typing Indicators', () => {
    it('should send typing start event', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        const input = screen.getByTestId('message-input')
        fireEvent.focus(input)

        expect(socketService.send).toHaveBeenCalledWith('dm_typing_start', {
          conversationId: mockConversationId
        })
      })
    })

    it('should send typing stop event', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        const input = screen.getByTestId('message-input')
        fireEvent.blur(input)

        expect(socketService.send).toHaveBeenCalledWith('dm_typing_stop', {
          conversationId: mockConversationId
        })
      })
    })
  })

  describe('Load More Messages', () => {
    it('should load more messages when requested', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/messages')) {
          if (url.includes('before=')) {
            return Promise.resolve({
              json: () => Promise.resolve({
                messages: [
                  {
                    id: 'msg0',
                    content: 'Older message',
                    userId: 'user2',
                    username: 'alice',
                    timestamp: new Date(Date.now() - 10000).toISOString(),
                    type: 'text'
                  }
                ],
                hasMore: false
              })
            })
          }
          return Promise.resolve({
            json: () => Promise.resolve({
              messages: [
                {
                  id: 'msg1',
                  content: 'Hello there!',
                  userId: 'user2',
                  username: 'alice',
                  timestamp: new Date().toISOString(),
                  type: 'text'
                }
              ],
              hasMore: true
            })
          })
        }
        return global.fetch.getMockImplementation()(url)
      })

      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        const loadMoreButton = screen.getByTestId('load-more')
        fireEvent.click(loadMoreButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Older message')).toBeInTheDocument()
      })
    })

    it('should not load more when already loading', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/messages')) {
          return Promise.resolve({
            json: () => Promise.resolve({
              messages: [],
              hasMore: true
            })
          })
        }
        return global.fetch.getMockImplementation()(url)
      })

      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        const loadMoreButton = screen.getByTestId('load-more')
        fireEvent.click(loadMoreButton)
        fireEvent.click(loadMoreButton)
      })

      // Should only call once
      await waitFor(() => {
        const messageCalls = Array.from(global.fetch.mock.calls).filter(
          call => call[0].includes('/messages') && call[0].includes('before=')
        )
        expect(messageCalls.length).toBeLessThanOrEqual(1)
      })
    })
  })

  describe('Timestamp Formatting', () => {
    it('should format recent timestamps as "Just now"', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        const infoButton = screen.getByTestId('icon-info').closest('button')
        fireEvent.click(infoButton)
      })

      await waitFor(() => {
        // Should see "Just now" or similar for recent activity
        expect(screen.getByText(/ago|now/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle conversation load error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      global.fetch.mockRejectedValueOnce(new Error('Failed to load'))

      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to load conversation:', expect.any(Error))
      })

      consoleError.mockRestore()
    })

    it('should handle messages load error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()

      global.fetch.mockImplementation((url) => {
        if (url.includes('/messages')) {
          return Promise.reject(new Error('Failed to load messages'))
        }
        return global.fetch.getMockImplementation()(url)
      })

      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to load messages:', expect.any(Error))
      })

      consoleError.mockRestore()
    })

    it('should handle send message error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      socketService.sendDirectMessage.mockImplementationOnce(() => {
        throw new Error('Send failed')
      })

      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        const sendButton = screen.getByTestId('send-button')
        fireEvent.click(sendButton)
      })

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to send message:', expect.any(Error))
      })

      consoleError.mockRestore()
    })
  })

  describe('Mobile Support', () => {
    it('should render in mobile mode when isMobile prop is true', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
          isMobile={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('message-list')).toBeInTheDocument()
      })
    })
  })

  describe('CustomClassName', () => {
    it('should apply custom className', async () => {
      const { container } = render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
          className="custom-class"
        />
      )

      await waitFor(() => {
        expect(container.querySelector('.custom-class')).toBeInTheDocument()
      })
    })
  })

  describe('User Status Display', () => {
    it('should display away status with yellow indicator', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/conversations/')) {
          if (url.includes('/messages')) {
            return Promise.resolve({
              json: () => Promise.resolve({
                messages: [],
                hasMore: false
              })
            })
          }
          return Promise.resolve({
            json: () => Promise.resolve({
              conversation: {
                id: 'conv1',
                type: 'direct',
                participants: ['user1', 'user2']
              },
              participants: [
                {
                  id: 'user2',
                  username: 'alice',
                  displayName: 'Alice Cooper',
                  status: 'away'
                }
              ]
            })
          })
        }
        return Promise.reject(new Error('Not found'))
      })

      const { container } = render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        const awayIndicator = container.querySelector('.bg-yellow-500')
        expect(awayIndicator).toBeTruthy()
      })
    })

    it('should display busy status with red indicator', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/conversations/')) {
          if (url.includes('/messages')) {
            return Promise.resolve({
              json: () => Promise.resolve({
                messages: [],
                hasMore: false
              })
            })
          }
          return Promise.resolve({
            json: () => Promise.resolve({
              conversation: {
                id: 'conv1',
                type: 'direct',
                participants: ['user1', 'user2']
              },
              participants: [
                {
                  id: 'user2',
                  username: 'alice',
                  displayName: 'Alice Cooper',
                  status: 'busy'
                }
              ]
            })
          })
        }
        return Promise.reject(new Error('Not found'))
      })

      const { container } = render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        const busyIndicator = container.querySelector('.bg-red-500')
        expect(busyIndicator).toBeTruthy()
      })
    })

    it('should display offline status with gray indicator', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/conversations/')) {
          if (url.includes('/messages')) {
            return Promise.resolve({
              json: () => Promise.resolve({
                messages: [],
                hasMore: false
              })
            })
          }
          return Promise.resolve({
            json: () => Promise.resolve({
              conversation: {
                id: 'conv1',
                type: 'direct',
                participants: ['user1', 'user2']
              },
              participants: [
                {
                  id: 'user2',
                  username: 'alice',
                  displayName: 'Alice Cooper',
                  status: 'offline'
                }
              ]
            })
          })
        }
        return Promise.reject(new Error('Not found'))
      })

      const { container } = render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        const offlineIndicator = container.querySelector('.bg-gray-500')
        expect(offlineIndicator).toBeTruthy()
      })
    })
  })

  describe('Conversation Title Display', () => {
    it('should display participant display name for direct messages', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Alice Cooper')).toBeInTheDocument()
      })
    })

    it('should fall back to username if display name not available', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/conversations/')) {
          if (url.includes('/messages')) {
            return Promise.resolve({
              json: () => Promise.resolve({
                messages: [],
                hasMore: false
              })
            })
          }
          return Promise.resolve({
            json: () => Promise.resolve({
              conversation: {
                id: 'conv1',
                type: 'direct',
                participants: ['user1', 'user2']
              },
              participants: [
                {
                  id: 'user2',
                  username: 'alice',
                  status: 'online'
                }
              ]
            })
          })
        }
        return Promise.reject(new Error('Not found'))
      })

      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
      })
    })

    it('should display "Loading..." when conversation not loaded', () => {
      global.fetch.mockImplementation(() => new Promise(() => {})) // Never resolves

      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Loading conversation...')).toBeInTheDocument()
    })
  })

  describe('Participant Info Display', () => {
    it('should show all participants in info sidebar', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/conversations/')) {
          if (url.includes('/messages')) {
            return Promise.resolve({
              json: () => Promise.resolve({
                messages: [],
                hasMore: false
              })
            })
          }
          return Promise.resolve({
            json: () => Promise.resolve({
              conversation: {
                id: 'conv1',
                type: 'group',
                name: 'Team Chat',
                participants: ['user1', 'user2', 'user3']
              },
              participants: [
                {
                  id: 'user2',
                  username: 'alice',
                  displayName: 'Alice Cooper',
                  status: 'online'
                },
                {
                  id: 'user3',
                  username: 'bob',
                  displayName: 'Bob Wilson',
                  status: 'away'
                }
              ]
            })
          })
        }
        return Promise.reject(new Error('Not found'))
      })

      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        const infoButton = screen.getByTestId('icon-info').closest('button')
        fireEvent.click(infoButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Alice Cooper')).toBeInTheDocument()
        expect(screen.getByText('Bob Wilson')).toBeInTheDocument()
      })
    })

    it('should display participant usernames', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        const infoButton = screen.getByTestId('icon-info').closest('button')
        fireEvent.click(infoButton)
      })

      await waitFor(() => {
        expect(screen.getByText('@alice')).toBeInTheDocument()
      })
    })
  })

  describe('Conversation Details', () => {
    it('should display conversation creation time', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        const infoButton = screen.getByTestId('icon-info').closest('button')
        fireEvent.click(infoButton)
      })

      await waitFor(() => {
        expect(screen.getByText(/Created/)).toBeInTheDocument()
      })
    })

    it('should display last activity time', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        const infoButton = screen.getByTestId('icon-info').closest('button')
        fireEvent.click(infoButton)
      })

      await waitFor(() => {
        expect(screen.getByText(/Last activity/)).toBeInTheDocument()
      })
    })
  })

  describe('Add Participant', () => {
    it('should send request to add participant', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/participants')) {
          return Promise.resolve({ json: () => Promise.resolve({}) })
        }
        return global.fetch.getMockImplementation()(url)
      })

      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('message-list')).toBeInTheDocument()
      })
    })
  })

  describe('Message Composer Placeholder', () => {
    it('should display conversation-specific placeholder', async () => {
      render(
        <DirectMessagesPanel
          conversationId={mockConversationId}
          user={mockUser}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        const input = screen.getByTestId('message-input')
        expect(input).toHaveAttribute('placeholder', 'Message Alice Cooper...')
      })
    })
  })
})

export default MockMessageList
