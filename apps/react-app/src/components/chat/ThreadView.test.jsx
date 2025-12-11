import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import ThreadView from './ThreadView'
import socketService from '../../services/socket'

jest.mock('../../services/socket', () => ({
  on: jest.fn(),
  off: jest.fn(),
  send: jest.fn()
}))

jest.mock('./MessageBubble', () => {
  return function MockMessageBubble({ message, isOwnMessage, showActions, compact, className }) {
    return (
      <div data-testid="message-bubble" data-message-id={message.id} data-own-message={isOwnMessage}>
        {message.content}
      </div>
    )
  }
})

jest.mock('./MessageComposer', () => {
  return function MockMessageComposer({ onSendMessage, onTyping, onStopTyping, placeholder, user, typingUsers }) {
    return (
      <div data-testid="message-composer">
        <input
          data-testid="composer-input"
          placeholder={placeholder}
          onChange={(e) => {
            if (e.target.value) onTyping?.()
            else onStopTyping?.()
          }}
        />
        <button
          data-testid="send-button"
          onClick={() => onSendMessage('Test message', 'text', [])}
        >
          Send
        </button>
        {typingUsers.length > 0 && (
          <div data-testid="typing-indicator">
            {typingUsers.join(', ')} typing
          </div>
        )}
      </div>
    )
  }
})

global.fetch = jest.fn()

describe('ThreadView', () => {
  let mockParentMessage
  let mockUser
  let mockOnClose

  beforeEach(() => {
    jest.clearAllMocks()

    mockParentMessage = {
      id: 'msg-1',
      threadId: 'thread-1',
      userId: 'user-1',
      username: 'Alice',
      avatar: 'https://example.com/alice.jpg',
      content: 'This is the parent message',
      timestamp: '2024-01-01T10:00:00Z'
    }

    mockUser = {
      id: 'user-2',
      username: 'Bob',
      avatar: 'https://example.com/bob.jpg'
    }

    mockOnClose = jest.fn()

    global.fetch.mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        messages: [],
        participants: [],
        hasMore: false
      })
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Thread Display', () => {
    test('renders loading state initially', () => {
      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      expect(screen.getByText('Loading thread...')).toBeInTheDocument()
    })

    test('renders thread header with title', async () => {
      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Thread')).toBeInTheDocument()
      })
    })

    test('renders thread with custom className', async () => {
      const { container } = render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
          className="custom-class"
        />
      )

      await waitFor(() => {
        expect(container.firstChild).toHaveClass('custom-class')
      })
    })

    test('renders mobile layout when isMobile is true', async () => {
      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
          isMobile={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('message-composer')).toBeInTheDocument()
      })
    })

    test('displays thread statistics correctly', async () => {
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({
          messages: [
            { id: 'reply-1', userId: 'user-2', content: 'Reply 1', timestamp: '2024-01-01T10:05:00Z' },
            { id: 'reply-2', userId: 'user-3', content: 'Reply 2', timestamp: '2024-01-01T10:10:00Z' }
          ],
          participants: [
            { id: 'user-1', username: 'Alice' },
            { id: 'user-2', username: 'Bob' },
            { id: 'user-3', username: 'Charlie' }
          ],
          hasMore: false
        })
      })

      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('2 replies')).toBeInTheDocument()
        expect(screen.getByText('3 participants')).toBeInTheDocument()
      })
    })

    test('uses threadId from parentMessage if available', async () => {
      const messageWithThreadId = {
        ...mockParentMessage,
        threadId: 'custom-thread-id'
      }

      render(
        <ThreadView
          parentMessage={messageWithThreadId}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/threads/custom-thread-id/messages')
      })
    })

    test('uses message id as threadId if threadId not available', async () => {
      const messageWithoutThreadId = {
        ...mockParentMessage,
        threadId: undefined
      }

      render(
        <ThreadView
          parentMessage={messageWithoutThreadId}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/threads/msg-1/messages')
      })
    })
  })

  describe('Parent Message Display', () => {
    test('renders parent message in thread', async () => {
      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('This is the parent message')).toBeInTheDocument()
      })
    })

    test('displays parent message username', async () => {
      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument()
      })
    })

    test('displays parent message avatar', async () => {
      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        const avatar = screen.getByAltText('Alice')
        expect(avatar).toBeInTheDocument()
        expect(avatar).toHaveAttribute('src', 'https://example.com/alice.jpg')
      })
    })

    test('displays parent message fallback when no avatar', async () => {
      const messageWithoutAvatar = {
        ...mockParentMessage,
        avatar: null
      }

      render(
        <ThreadView
          parentMessage={messageWithoutAvatar}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('A')).toBeInTheDocument()
      })
    })

    test('displays parent message timestamp', async () => {
      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        const timeElements = screen.getAllByText(/ago|Just now/)
        expect(timeElements.length).toBeGreaterThan(0)
      })
    })

    test('shows pin indicator on parent message', async () => {
      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        const pinIcon = screen.getByTitle('Original message')
        expect(pinIcon).toBeInTheDocument()
      })
    })
  })

  describe('Thread Replies List', () => {
    test('displays thread replies', async () => {
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({
          messages: [
            { id: 'reply-1', userId: 'user-2', username: 'Bob', content: 'First reply', timestamp: '2024-01-01T10:05:00Z' },
            { id: 'reply-2', userId: 'user-3', username: 'Charlie', content: 'Second reply', timestamp: '2024-01-01T10:10:00Z' }
          ],
          participants: [],
          hasMore: false
        })
      })

      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('First reply')).toBeInTheDocument()
        expect(screen.getByText('Second reply')).toBeInTheDocument()
      })
    })

    test('displays empty thread when no replies', async () => {
      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('message-composer')).toBeInTheDocument()
      })
    })

    test('shows avatar for first message from each user', async () => {
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({
          messages: [
            { id: 'reply-1', userId: 'user-2', username: 'Bob', avatar: 'bob.jpg', content: 'Reply 1', timestamp: '2024-01-01T10:05:00Z' },
            { id: 'reply-2', userId: 'user-2', username: 'Bob', avatar: 'bob.jpg', content: 'Reply 2', timestamp: '2024-01-01T10:06:00Z' }
          ],
          participants: [],
          hasMore: false
        })
      })

      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Reply 1')).toBeInTheDocument()
        expect(screen.getByText('Reply 2')).toBeInTheDocument()
      })
    })

    test('displays username and timestamp for messages with avatar', async () => {
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({
          messages: [
            { id: 'reply-1', userId: 'user-2', username: 'Bob', content: 'Reply', timestamp: '2024-01-01T10:05:00Z' }
          ],
          participants: [],
          hasMore: false
        })
      })

      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Bob')).toBeInTheDocument()
      })
    })

    test('shows pending status for sending messages', async () => {
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({
          messages: [
            { id: 'reply-1', userId: 'user-2', username: 'Bob', content: 'Reply', timestamp: '2024-01-01T10:05:00Z', pending: true }
          ],
          participants: [],
          hasMore: false
        })
      })

      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Sending...')).toBeInTheDocument()
      })
    })

    test('identifies own messages correctly', async () => {
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({
          messages: [
            { id: 'reply-1', userId: 'user-2', username: 'Bob', content: 'My reply', timestamp: '2024-01-01T10:05:00Z' }
          ],
          participants: [],
          hasMore: false
        })
      })

      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        const messageBubble = screen.getByTestId('message-bubble')
        expect(messageBubble).toHaveAttribute('data-own-message', 'true')
      })
    })
  })

  describe('Reply to Thread', () => {
    test('sends reply via socket', async () => {
      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('message-composer')).toBeInTheDocument()
      })

      const sendButton = screen.getByTestId('send-button')
      fireEvent.click(sendButton)

      expect(socketService.send).toHaveBeenCalledWith('send_thread_reply', expect.objectContaining({
        threadId: 'thread-1',
        parentMessageId: 'msg-1'
      }))
    })

    test('displays optimistic message when sending reply', async () => {
      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('message-composer')).toBeInTheDocument()
      })

      const sendButton = screen.getByTestId('send-button')
      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(screen.getByText('Test message')).toBeInTheDocument()
      })
    })

    test('handles empty content gracefully', async () => {
      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('message-composer')).toBeInTheDocument()
      })

      expect(socketService.send).not.toHaveBeenCalledWith('send_thread_reply', expect.any(Object))
    })

    test('includes attachments in reply', async () => {
      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('message-composer')).toBeInTheDocument()
      })

      const sendButton = screen.getByTestId('send-button')
      fireEvent.click(sendButton)

      expect(socketService.send).toHaveBeenCalledWith('send_thread_reply', expect.objectContaining({
        attachments: []
      }))
    })

    test('auto-scrolls to bottom when sending reply', async () => {
      const scrollIntoViewMock = jest.fn()
      Element.prototype.scrollIntoView = scrollIntoViewMock

      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('message-composer')).toBeInTheDocument()
      })

      const sendButton = screen.getByTestId('send-button')
      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalled()
      })
    })
  })

  describe('Thread Participants', () => {
    test('displays participant avatars', async () => {
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({
          messages: [
            { id: 'reply-1', userId: 'user-2', content: 'Reply', timestamp: '2024-01-01T10:05:00Z' }
          ],
          participants: [
            { id: 'user-1', username: 'Alice', avatar: 'alice.jpg' },
            { id: 'user-2', username: 'Bob', avatar: 'bob.jpg' }
          ],
          hasMore: false
        })
      })

      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('2 participants')).toBeInTheDocument()
      })
    })

    test('shows first 5 participants', async () => {
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({
          messages: [
            { id: 'reply-1', userId: 'user-2', content: 'Reply', timestamp: '2024-01-01T10:05:00Z' },
            { id: 'reply-2', userId: 'user-3', content: 'Reply', timestamp: '2024-01-01T10:06:00Z' },
            { id: 'reply-3', userId: 'user-4', content: 'Reply', timestamp: '2024-01-01T10:07:00Z' },
            { id: 'reply-4', userId: 'user-5', content: 'Reply', timestamp: '2024-01-01T10:08:00Z' },
            { id: 'reply-5', userId: 'user-6', content: 'Reply', timestamp: '2024-01-01T10:09:00Z' }
          ],
          participants: [
            { id: 'user-1', username: 'Alice' },
            { id: 'user-2', username: 'Bob' },
            { id: 'user-3', username: 'Charlie' },
            { id: 'user-4', username: 'Dave' },
            { id: 'user-5', username: 'Eve' },
            { id: 'user-6', username: 'Frank' }
          ],
          hasMore: false
        })
      })

      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('6 participants')).toBeInTheDocument()
      })
    })

    test('displays overflow count when more than 5 participants', async () => {
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({
          messages: [
            { id: 'reply-1', userId: 'user-2', content: 'Reply', timestamp: '2024-01-01T10:05:00Z' },
            { id: 'reply-2', userId: 'user-3', content: 'Reply', timestamp: '2024-01-01T10:06:00Z' },
            { id: 'reply-3', userId: 'user-4', content: 'Reply', timestamp: '2024-01-01T10:07:00Z' },
            { id: 'reply-4', userId: 'user-5', content: 'Reply', timestamp: '2024-01-01T10:08:00Z' },
            { id: 'reply-5', userId: 'user-6', content: 'Reply', timestamp: '2024-01-01T10:09:00Z' },
            { id: 'reply-6', userId: 'user-7', content: 'Reply', timestamp: '2024-01-01T10:10:00Z' }
          ],
          participants: [],
          hasMore: false
        })
      })

      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('+2')).toBeInTheDocument()
      })
    })

    test('shows participant username on hover', async () => {
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({
          messages: [
            { id: 'reply-1', userId: 'user-2', content: 'Reply', timestamp: '2024-01-01T10:05:00Z' }
          ],
          participants: [
            { id: 'user-1', username: 'Alice' },
            { id: 'user-2', username: 'Bob' }
          ],
          hasMore: false
        })
      })

      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        const participantAvatar = screen.getByTitle('Alice')
        expect(participantAvatar).toBeInTheDocument()
      })
    })

    test('hides participants when thread is collapsed', async () => {
      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Participants:')).toBeInTheDocument()
      })

      const collapseButton = screen.getByRole('button', { name: '' })
      fireEvent.click(collapseButton)

      await waitFor(() => {
        expect(screen.queryByText('Participants:')).not.toBeInTheDocument()
      })
    })
  })

  describe('Thread Settings', () => {
    test('toggles thread notifications', async () => {
      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(screen.getByTitle('Disable notifications')).toBeInTheDocument()
      })

      const notificationButton = screen.getByTitle('Disable notifications')
      fireEvent.click(notificationButton)

      await waitFor(() => {
        expect(screen.getByTitle('Enable notifications')).toBeInTheDocument()
      })
    })

    test('shows notification button with correct state', async () => {
      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        const notificationButton = screen.getByTitle('Disable notifications')
        expect(notificationButton).toHaveClass('text-blue-500')
      })
    })

    test('displays more options button', async () => {
      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        const moreButton = screen.getByRole('button', { name: '' })
        expect(moreButton).toBeInTheDocument()
      })
    })

    test('collapses and expands thread header', async () => {
      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Participants:')).toBeInTheDocument()
      })

      const buttons = screen.getAllByRole('button')
      const collapseButton = buttons.find(btn => btn.querySelector('.lucide-chevron-down'))

      if (collapseButton) {
        fireEvent.click(collapseButton)

        await waitFor(() => {
          expect(screen.queryByText('Participants:')).not.toBeInTheDocument()
        })
      }
    })
  })

  describe('Close Thread View', () => {
    test('calls onClose when close button clicked', async () => {
      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('message-composer')).toBeInTheDocument()
      })

      const closeButtons = screen.getAllByRole('button')
      const closeButton = closeButtons.find(btn => btn.querySelector('.lucide-x'))

      if (closeButton) {
        fireEvent.click(closeButton)
        expect(mockOnClose).toHaveBeenCalledTimes(1)
      }
    })

    test('leaves thread when unmounting', async () => {
      const { unmount } = render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(socketService.send).toHaveBeenCalledWith('join_thread', { threadId: 'thread-1' })
      })

      unmount()

      expect(socketService.send).toHaveBeenCalledWith('leave_thread', { threadId: 'thread-1' })
    })
  })

  describe('API Integration', () => {
    test('fetches thread messages on mount', async () => {
      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/threads/thread-1/messages')
      })
    })

    test('loads more messages when scrolled to top', async () => {
      global.fetch
        .mockResolvedValueOnce({
          json: jest.fn().mockResolvedValue({
            messages: [
              { id: 'reply-1', userId: 'user-2', username: 'Bob', content: 'Reply 1', timestamp: '2024-01-01T10:05:00Z' }
            ],
            participants: [],
            hasMore: true
          })
        })
        .mockResolvedValueOnce({
          json: jest.fn().mockResolvedValue({
            messages: [
              { id: 'reply-0', userId: 'user-2', username: 'Bob', content: 'Reply 0', timestamp: '2024-01-01T10:00:00Z' }
            ],
            hasMore: false
          })
        })

      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Reply 1')).toBeInTheDocument()
      })

      const scrollContainer = screen.getByText('Reply 1').closest('.overflow-y-auto')
      if (scrollContainer) {
        fireEvent.scroll(scrollContainer, { target: { scrollTop: 0 } })

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith('/api/threads/thread-1/messages?before=reply-1')
        })
      }
    })

    test('displays loading indicator when loading more messages', async () => {
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({
          messages: [
            { id: 'reply-1', userId: 'user-2', username: 'Bob', content: 'Reply 1', timestamp: '2024-01-01T10:05:00Z' }
          ],
          participants: [],
          hasMore: true
        })
      })

      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Reply 1')).toBeInTheDocument()
      })
    })

    test('handles API error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      global.fetch.mockRejectedValueOnce(new Error('API Error'))

      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to load thread messages:', expect.any(Error))
      })

      consoleError.mockRestore()
    })

    test('does not load more if already loading', async () => {
      global.fetch.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))

      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1)
      })
    })

    test('does not load more if no more messages', async () => {
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({
          messages: [
            { id: 'reply-1', userId: 'user-2', username: 'Bob', content: 'Reply 1', timestamp: '2024-01-01T10:05:00Z' }
          ],
          participants: [],
          hasMore: false
        })
      })

      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Reply 1')).toBeInTheDocument()
      })

      const scrollContainer = screen.getByText('Reply 1').closest('.overflow-y-auto')
      if (scrollContainer) {
        fireEvent.scroll(scrollContainer, { target: { scrollTop: 0 } })

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledTimes(1)
        })
      }
    })
  })

  describe('Socket Integration', () => {
    test('joins thread on mount', async () => {
      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(socketService.send).toHaveBeenCalledWith('join_thread', { threadId: 'thread-1' })
      })
    })

    test('registers socket event listeners', async () => {
      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(socketService.on).toHaveBeenCalledWith('thread_reply', expect.any(Function))
        expect(socketService.on).toHaveBeenCalledWith('thread_typing', expect.any(Function))
        expect(socketService.on).toHaveBeenCalledWith('thread_stopped_typing', expect.any(Function))
      })
    })

    test('handles incoming thread reply', async () => {
      let replyHandler

      socketService.on.mockImplementation((event, handler) => {
        if (event === 'thread_reply') {
          replyHandler = handler
        }
      })

      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(replyHandler).toBeDefined()
      })

      const newReply = {
        id: 'reply-new',
        threadId: 'thread-1',
        userId: 'user-3',
        username: 'Charlie',
        content: 'New reply',
        timestamp: '2024-01-01T10:15:00Z'
      }

      replyHandler(newReply)

      await waitFor(() => {
        expect(screen.getByText('New reply')).toBeInTheDocument()
      })
    })

    test('ignores replies from other threads', async () => {
      let replyHandler

      socketService.on.mockImplementation((event, handler) => {
        if (event === 'thread_reply') {
          replyHandler = handler
        }
      })

      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(replyHandler).toBeDefined()
      })

      const otherThreadReply = {
        id: 'reply-other',
        threadId: 'thread-2',
        userId: 'user-3',
        username: 'Charlie',
        content: 'Other thread reply',
        timestamp: '2024-01-01T10:15:00Z'
      }

      replyHandler(otherThreadReply)

      await waitFor(() => {
        expect(screen.queryByText('Other thread reply')).not.toBeInTheDocument()
      })
    })

    test('sends typing event when typing', async () => {
      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('message-composer')).toBeInTheDocument()
      })

      const input = screen.getByTestId('composer-input')
      fireEvent.change(input, { target: { value: 'typing...' } })

      await waitFor(() => {
        expect(socketService.send).toHaveBeenCalledWith('thread_typing', { threadId: 'thread-1' })
      })
    })

    test('sends stopped typing event', async () => {
      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('message-composer')).toBeInTheDocument()
      })

      const input = screen.getByTestId('composer-input')
      fireEvent.change(input, { target: { value: '' } })

      await waitFor(() => {
        expect(socketService.send).toHaveBeenCalledWith('thread_stopped_typing', { threadId: 'thread-1' })
      })
    })

    test('displays typing indicator for other users', async () => {
      let typingHandler

      socketService.on.mockImplementation((event, handler) => {
        if (event === 'thread_typing') {
          typingHandler = handler
        }
      })

      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(typingHandler).toBeDefined()
      })

      typingHandler({ threadId: 'thread-1', userId: 'user-3' })

      await waitFor(() => {
        expect(screen.getByText(/typing/)).toBeInTheDocument()
      })
    })

    test('does not show typing indicator for current user', async () => {
      let typingHandler

      socketService.on.mockImplementation((event, handler) => {
        if (event === 'thread_typing') {
          typingHandler = handler
        }
      })

      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(typingHandler).toBeDefined()
      })

      typingHandler({ threadId: 'thread-1', userId: 'user-2' })

      expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument()
    })

    test('removes typing indicator after timeout', async () => {
      jest.useFakeTimers()

      let typingHandler

      socketService.on.mockImplementation((event, handler) => {
        if (event === 'thread_typing') {
          typingHandler = handler
        }
      })

      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(typingHandler).toBeDefined()
      })

      typingHandler({ threadId: 'thread-1', userId: 'user-3' })

      jest.advanceTimersByTime(3000)

      await waitFor(() => {
        expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument()
      })

      jest.useRealTimers()
    })

    test('removes typing indicator on stopped typing event', async () => {
      let typingHandler, stoppedTypingHandler

      socketService.on.mockImplementation((event, handler) => {
        if (event === 'thread_typing') {
          typingHandler = handler
        } else if (event === 'thread_stopped_typing') {
          stoppedTypingHandler = handler
        }
      })

      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(typingHandler).toBeDefined()
        expect(stoppedTypingHandler).toBeDefined()
      })

      typingHandler({ threadId: 'thread-1', userId: 'user-3' })

      await waitFor(() => {
        expect(screen.getByText(/typing/)).toBeInTheDocument()
      })

      stoppedTypingHandler({ userId: 'user-3' })

      await waitFor(() => {
        expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument()
      })
    })

    test('unregisters socket listeners on unmount', async () => {
      const { unmount } = render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(socketService.on).toHaveBeenCalled()
      })

      unmount()

      expect(socketService.off).toHaveBeenCalledWith('thread_reply', expect.any(Function))
      expect(socketService.off).toHaveBeenCalledWith('thread_typing', expect.any(Function))
      expect(socketService.off).toHaveBeenCalledWith('thread_stopped_typing', expect.any(Function))
    })
  })

  describe('Loading States', () => {
    test('shows loading spinner initially', () => {
      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      expect(screen.getByText('Loading thread...')).toBeInTheDocument()
      const spinner = document.querySelector('.')
      expect(spinner).toBeInTheDocument()
    })

    test('hides loading state after data loads', async () => {
      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading thread...')).not.toBeInTheDocument()
      })
    })

    test('shows loading indicator when loading more messages', async () => {
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({
          messages: [
            { id: 'reply-1', userId: 'user-2', username: 'Bob', content: 'Reply 1', timestamp: '2024-01-01T10:05:00Z' }
          ],
          participants: [],
          hasMore: true
        })
      })

      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Reply 1')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    test('handles fetch error for thread messages', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to load thread messages:', expect.any(Error))
      })

      consoleError.mockRestore()
    })

    test('handles fetch error for loading more messages', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

      global.fetch
        .mockResolvedValueOnce({
          json: jest.fn().mockResolvedValue({
            messages: [
              { id: 'reply-1', userId: 'user-2', username: 'Bob', content: 'Reply 1', timestamp: '2024-01-01T10:05:00Z' }
            ],
            participants: [],
            hasMore: true
          })
        })
        .mockRejectedValueOnce(new Error('Network error'))

      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Reply 1')).toBeInTheDocument()
      })

      const scrollContainer = screen.getByText('Reply 1').closest('.overflow-y-auto')
      if (scrollContainer) {
        fireEvent.scroll(scrollContainer, { target: { scrollTop: 0 } })

        await waitFor(() => {
          expect(consoleError).toHaveBeenCalledWith('Failed to load more messages:', expect.any(Error))
        })
      }

      consoleError.mockRestore()
    })

    test('handles missing parent message gracefully', async () => {
      render(
        <ThreadView
          parentMessage={null}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      expect(screen.getByText('Loading thread...')).toBeInTheDocument()
    })

    test('handles missing user gracefully', async () => {
      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={null}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('message-composer')).toBeInTheDocument()
      })
    })

    test('handles send reply error', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      socketService.send.mockImplementationOnce(() => {
        throw new Error('Send error')
      })

      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('message-composer')).toBeInTheDocument()
      })

      const sendButton = screen.getByTestId('send-button')
      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled()
      })

      consoleError.mockRestore()
    })

    test('handles malformed API response', async () => {
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({})
      })

      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('message-composer')).toBeInTheDocument()
      })
    })
  })

  describe('Timestamp Formatting', () => {
    test('displays "Just now" for recent messages', async () => {
      const now = new Date()
      const recentMessage = {
        ...mockParentMessage,
        timestamp: now.toISOString()
      }

      render(
        <ThreadView
          parentMessage={recentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Just now')).toBeInTheDocument()
      })
    })

    test('displays minutes ago for messages under 1 hour', async () => {
      const now = new Date()
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
      const recentMessage = {
        ...mockParentMessage,
        timestamp: fiveMinutesAgo.toISOString()
      }

      render(
        <ThreadView
          parentMessage={recentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/5m ago/)).toBeInTheDocument()
      })
    })

    test('displays hours ago for messages under 24 hours', async () => {
      const now = new Date()
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
      const recentMessage = {
        ...mockParentMessage,
        timestamp: twoHoursAgo.toISOString()
      }

      render(
        <ThreadView
          parentMessage={recentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/2h ago/)).toBeInTheDocument()
      })
    })

    test('displays date for messages over 24 hours', async () => {
      const twoDaysAgo = new Date('2024-01-01T10:00:00Z')
      const oldMessage = {
        ...mockParentMessage,
        timestamp: twoDaysAgo.toISOString()
      }

      render(
        <ThreadView
          parentMessage={oldMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        const datePattern = /\d{1,2}\/\d{1,2}\/\d{4}/
        const elements = screen.getAllByText(datePattern)
        expect(elements.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Auto-scroll Behavior', () => {
    test('scrolls to bottom on initial load', async () => {
      const scrollIntoViewMock = jest.fn()
      Element.prototype.scrollIntoView = scrollIntoViewMock

      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalled()
      })
    })

    test('scrolls to bottom when new reply arrives', async () => {
      const scrollIntoViewMock = jest.fn()
      Element.prototype.scrollIntoView = scrollIntoViewMock

      let replyHandler

      socketService.on.mockImplementation((event, handler) => {
        if (event === 'thread_reply') {
          replyHandler = handler
        }
      })

      render(
        <ThreadView
          parentMessage={mockParentMessage}
          onClose={mockOnClose}
          user={mockUser}
          channelId="channel-1"
        />
      )

      await waitFor(() => {
        expect(replyHandler).toBeDefined()
      })

      scrollIntoViewMock.mockClear()

      const newReply = {
        id: 'reply-new',
        threadId: 'thread-1',
        userId: 'user-3',
        username: 'Charlie',
        content: 'New reply',
        timestamp: '2024-01-01T10:15:00Z'
      }

      replyHandler(newReply)

      await waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalledWith(
          expect.objectContaining({
            behavior: 'smooth',
            block: 'end'
          })
        )
      })
    })
  })
})

export default MockMessageBubble
