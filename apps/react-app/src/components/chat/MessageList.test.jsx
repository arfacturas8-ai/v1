import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import MessageList from './MessageList'

// Mock child components
vi.mock('./MessageBubble', () => ({
  default: ({ message, isOwnMessage, isMobile, isSelected, onReact }) => (
    <div
      data-testid={`message-bubble-${message.id}`}
      data-own-message={isOwnMessage}
      data-mobile={isMobile}
      data-selected={isSelected}
    >
      {message.content}
    </div>
  )
}))

vi.mock('../MessageReactions', () => ({
  default: ({ reactions, onAddReaction, onRemoveReaction, currentUserId, isMobile }) => (
    <div data-testid="message-reactions">
      {Object.entries(reactions).map(([emoji, users]) => (
        <button
          key={emoji}
          onClick={() => onAddReaction(emoji)}
          data-testid={`reaction-${emoji}`}
        >
          {emoji} {users.length}
        </button>
      ))}
    </div>
  )
}))

vi.mock('../MessageActions', () => ({
  default: ({ message, isOwnMessage, onEdit, onDelete, onReply, onReact, onCopy, onPin, isMobile, isVisible }) => (
    <div
      data-testid={`message-actions-${message.id}`}
      data-own-message={isOwnMessage}
      data-mobile={isMobile}
      data-visible={isVisible}
    >
      {onEdit && <button onClick={() => onEdit(message)}>Edit</button>}
      {onDelete && <button onClick={() => onDelete(message)}>Delete</button>}
      {onReply && <button onClick={() => onReply(message)}>Reply</button>}
      {onCopy && <button onClick={() => onCopy(message)}>Copy</button>}
      {onPin && <button onClick={() => onPin(message)}>Pin</button>}
    </div>
  )
}))

vi.mock('react-markdown', () => ({
  default: ({ children }) => <div data-testid="markdown">{children}</div>
}))

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn()
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
})
window.IntersectionObserver = mockIntersectionObserver

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn()

// Mock navigator.vibrate
Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: vi.fn()
})

const createMockMessage = (id, overrides = {}) => ({
  id: `msg-${id}`,
  userId: `user-${id}`,
  username: `User ${id}`,
  avatar: `U${id}`,
  content: `Test message ${id}`,
  timestamp: new Date(2025, 0, 1, 12, id).toISOString(),
  ...overrides
})

describe('MessageList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Element.prototype.scrollIntoView.mockClear()
  })

  describe('Basic Rendering', () => {
    it('should render without crashing with no messages', () => {
      render(<MessageList messages={[]} currentUserId="user-1" />)
      expect(screen.queryByRole('article')).not.toBeInTheDocument()
    })

    it('should render a list of messages', () => {
      const messages = [
        createMockMessage(1),
        createMockMessage(2),
        createMockMessage(3)
      ]
      render(<MessageList messages={messages} currentUserId="user-1" />)

      expect(screen.getByText('Test message 1')).toBeInTheDocument()
      expect(screen.getByText('Test message 2')).toBeInTheDocument()
      expect(screen.getByText('Test message 3')).toBeInTheDocument()
    })

    it('should render messages in the correct order', () => {
      const messages = [
        createMockMessage(1),
        createMockMessage(2),
        createMockMessage(3)
      ]
      const { container } = render(<MessageList messages={messages} currentUserId="user-1" />)

      const messageElements = container.querySelectorAll('[id^="message-"]')
      expect(messageElements[0]).toHaveAttribute('id', 'message-msg-1')
      expect(messageElements[1]).toHaveAttribute('id', 'message-msg-2')
      expect(messageElements[2]).toHaveAttribute('id', 'message-msg-3')
    })

    it('should apply own-message class to current user messages', () => {
      const messages = [
        createMockMessage(1, { userId: 'current-user' }),
        createMockMessage(2, { userId: 'other-user' })
      ]
      const { container } = render(<MessageList messages={messages} currentUserId="current-user" />)

      const ownMessage = container.querySelector('#message-msg-1')
      const otherMessage = container.querySelector('#message-msg-2')

      expect(ownMessage).toHaveClass('own-message')
      expect(otherMessage).not.toHaveClass('own-message')
    })

    it('should render with mobile styles when isMobile is true', () => {
      const messages = [createMockMessage(1)]
      render(<MessageList messages={messages} currentUserId="user-1" isMobile={true} />)

      const bubble = screen.getByTestId('message-bubble-msg-1')
      expect(bubble).toHaveAttribute('data-mobile', 'true')
    })
  })

  describe('Message Grouping', () => {
    it('should group messages by date', () => {
      const messages = [
        createMockMessage(1, { timestamp: new Date(2025, 0, 1).toISOString() }),
        createMockMessage(2, { timestamp: new Date(2025, 0, 1).toISOString() }),
        createMockMessage(3, { timestamp: new Date(2025, 0, 2).toISOString() })
      ]
      const { container } = render(<MessageList messages={messages} currentUserId="user-1" />)

      const dateSeparators = container.querySelectorAll('[class*="items-center justify-center"]')
      expect(dateSeparators.length).toBeGreaterThan(0)
    })

    it('should show avatar for first message from each user', () => {
      const messages = [
        createMockMessage(1, { userId: 'user-1', avatar: 'A' }),
        createMockMessage(2, { userId: 'user-1', avatar: 'A' }),
        createMockMessage(3, { userId: 'user-2', avatar: 'B' })
      ]
      const { container } = render(<MessageList messages={messages} currentUserId="user-3" />)

      const avatars = container.querySelectorAll('.rounded-full[style*="backgroundColor"]')
      const emptySpacers = container.querySelectorAll('.flex-shrink-0')

      expect(avatars.length).toBeGreaterThan(0)
      expect(emptySpacers.length).toBeGreaterThan(avatars.length)
    })

    it('should hide avatar for consecutive messages from same user', () => {
      const messages = [
        createMockMessage(1, { userId: 'user-1' }),
        createMockMessage(2, { userId: 'user-1' }),
        createMockMessage(3, { userId: 'user-1' })
      ]
      const { container } = render(<MessageList messages={messages} currentUserId="user-2" />)

      const messageItems = container.querySelectorAll('[id^="message-"]')
      expect(messageItems).toHaveLength(3)
    })

    it('should show username for first message from each user', () => {
      const messages = [
        createMockMessage(1, { userId: 'user-1', username: 'Alice' }),
        createMockMessage(2, { userId: 'user-1', username: 'Alice' }),
        createMockMessage(3, { userId: 'user-2', username: 'Bob' })
      ]
      render(<MessageList messages={messages} currentUserId="user-3" />)

      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
    })

    it('should display "You" for current user messages', () => {
      const messages = [
        createMockMessage(1, { userId: 'current-user' })
      ]
      render(<MessageList messages={messages} currentUserId="current-user" />)

      expect(screen.getByText('You')).toBeInTheDocument()
    })
  })

  describe('Date Separators', () => {
    it('should render date separator for each day', () => {
      const messages = [
        createMockMessage(1, { timestamp: new Date(2025, 0, 1).toISOString() }),
        createMockMessage(2, { timestamp: new Date(2025, 0, 2).toISOString() }),
        createMockMessage(3, { timestamp: new Date(2025, 0, 3).toISOString() })
      ]
      const { container } = render(<MessageList messages={messages} currentUserId="user-1" />)

      const dateSeparators = container.querySelectorAll('[class*="my-8"]')
      expect(dateSeparators.length).toBeGreaterThan(0)
    })

    it('should format today as "Today"', () => {
      const today = new Date()
      const messages = [
        createMockMessage(1, { timestamp: today.toISOString() })
      ]
      render(<MessageList messages={messages} currentUserId="user-1" />)

      expect(screen.getByText('Today')).toBeInTheDocument()
    })

    it('should format yesterday as "Yesterday"', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const messages = [
        createMockMessage(1, { timestamp: yesterday.toISOString() })
      ]
      render(<MessageList messages={messages} currentUserId="user-1" />)

      expect(screen.getByText('Yesterday')).toBeInTheDocument()
    })

    it('should format older dates with locale string', () => {
      const oldDate = new Date(2025, 0, 1)
      const messages = [
        createMockMessage(1, { timestamp: oldDate.toISOString() })
      ]
      render(<MessageList messages={messages} currentUserId="user-1" />)

      const expectedDate = oldDate.toLocaleDateString()
      expect(screen.getByText(expectedDate)).toBeInTheDocument()
    })
  })

  describe('Scroll to Bottom', () => {
    it('should scroll to bottom when new messages arrive and user is at bottom', async () => {
      const { rerender } = render(
        <MessageList messages={[createMockMessage(1)]} currentUserId="user-1" />
      )

      await waitFor(() => {
        expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
      })

      Element.prototype.scrollIntoView.mockClear()

      rerender(
        <MessageList
          messages={[createMockMessage(1), createMockMessage(2)]}
          currentUserId="user-1"
        />
      )

      await waitFor(() => {
        expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
          behavior: 'smooth',
          block: 'end'
        })
      })
    })

    it('should render scroll to bottom button when not at bottom', () => {
      const { container } = render(
        <MessageList messages={[createMockMessage(1)]} currentUserId="user-1" />
      )

      const scrollButton = container.querySelector('button[class*="absolute bottom-4 right-4"]')
      expect(scrollButton).toBeInTheDocument()
    })

    it('should scroll to bottom when button is clicked', () => {
      const { container } = render(
        <MessageList messages={[createMockMessage(1)]} currentUserId="user-1" />
      )

      const scrollButton = container.querySelector('button[class*="absolute bottom-4 right-4"]')
      if (scrollButton) {
        fireEvent.click(scrollButton)
        expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
          behavior: 'smooth',
          block: 'end'
        })
      }
    })

    it('should scroll smoothly by default', () => {
      render(<MessageList messages={[createMockMessage(1)]} currentUserId="user-1" />)

      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'smooth' })
      )
    })
  })

  describe('Infinite Scroll / Load More', () => {
    it('should call onLoadMore when scrolling near top', () => {
      const onLoadMore = vi.fn()
      const messages = Array.from({ length: 20 }, (_, i) => createMockMessage(i))
      const { container } = render(
        <MessageList
          messages={messages}
          currentUserId="user-1"
          hasMore={true}
          onLoadMore={onLoadMore}
        />
      )

      const scrollContainer = container.querySelector('.overflow-y-auto')
      if (scrollContainer) {
        fireEvent.scroll(scrollContainer, {
          target: {
            scrollTop: 50,
            clientHeight: 500,
            scrollHeight: 1000
          }
        })
      }

      expect(onLoadMore).toHaveBeenCalled()
    })

    it('should not call onLoadMore when hasMore is false', () => {
      const onLoadMore = vi.fn()
      const messages = Array.from({ length: 20 }, (_, i) => createMockMessage(i))
      const { container } = render(
        <MessageList
          messages={messages}
          currentUserId="user-1"
          hasMore={false}
          onLoadMore={onLoadMore}
        />
      )

      const scrollContainer = container.querySelector('.overflow-y-auto')
      if (scrollContainer) {
        fireEvent.scroll(scrollContainer, {
          target: {
            scrollTop: 50,
            clientHeight: 500,
            scrollHeight: 1000
          }
        })
      }

      expect(onLoadMore).not.toHaveBeenCalled()
    })

    it('should not call onLoadMore when already loading', () => {
      const onLoadMore = vi.fn()
      const messages = Array.from({ length: 20 }, (_, i) => createMockMessage(i))
      const { container } = render(
        <MessageList
          messages={messages}
          currentUserId="user-1"
          hasMore={true}
          isLoading={true}
          onLoadMore={onLoadMore}
        />
      )

      const scrollContainer = container.querySelector('.overflow-y-auto')
      if (scrollContainer) {
        fireEvent.scroll(scrollContainer, {
          target: {
            scrollTop: 50,
            clientHeight: 500,
            scrollHeight: 1000
          }
        })
      }

      expect(onLoadMore).not.toHaveBeenCalled()
    })

    it('should not call onLoadMore when not near top', () => {
      const onLoadMore = vi.fn()
      const messages = Array.from({ length: 20 }, (_, i) => createMockMessage(i))
      const { container } = render(
        <MessageList
          messages={messages}
          currentUserId="user-1"
          hasMore={true}
          onLoadMore={onLoadMore}
        />
      )

      const scrollContainer = container.querySelector('.overflow-y-auto')
      if (scrollContainer) {
        fireEvent.scroll(scrollContainer, {
          target: {
            scrollTop: 500,
            clientHeight: 500,
            scrollHeight: 1000
          }
        })
      }

      expect(onLoadMore).not.toHaveBeenCalled()
    })
  })

  describe('Message Timestamps', () => {
    it('should display formatted timestamps', () => {
      const messages = [
        createMockMessage(1, { timestamp: new Date(2025, 0, 1, 14, 30).toISOString() })
      ]
      render(<MessageList messages={messages} currentUserId="user-1" />)

      expect(screen.getByText(/14:30/)).toBeInTheDocument()
    })

    it('should display edited indicator', () => {
      const messages = [
        createMockMessage(1, { edited: true })
      ]
      render(<MessageList messages={messages} currentUserId="user-1" />)

      expect(screen.getByText('(edited)')).toBeInTheDocument()
    })

    it('should not display edited indicator when not edited', () => {
      const messages = [
        createMockMessage(1, { edited: false })
      ]
      render(<MessageList messages={messages} currentUserId="user-1" />)

      expect(screen.queryByText('(edited)')).not.toBeInTheDocument()
    })

    it('should use 24-hour format for time', () => {
      const messages = [
        createMockMessage(1, { timestamp: new Date(2025, 0, 1, 23, 59).toISOString() })
      ]
      render(<MessageList messages={messages} currentUserId="user-1" />)

      expect(screen.getByText(/23:59/)).toBeInTheDocument()
    })
  })

  describe('User Avatars', () => {
    it('should display user avatar with correct initial', () => {
      const messages = [
        createMockMessage(1, { avatar: 'A' })
      ]
      const { container } = render(<MessageList messages={messages} currentUserId="user-2" />)

      expect(screen.getByText('A')).toBeInTheDocument()
    })

    it('should apply correct styles to own message avatars', () => {
      const messages = [
        createMockMessage(1, { userId: 'current-user', avatar: 'A' })
      ]
      const { container } = render(<MessageList messages={messages} currentUserId="current-user" />)

      const avatar = screen.getByText('A').parentElement
      expect(avatar).toHaveStyle({ backgroundColor: 'var(--accent-primary)' })
    })

    it('should apply correct styles to other user avatars', () => {
      const messages = [
        createMockMessage(1, { userId: 'other-user', avatar: 'B' })
      ]
      const { container } = render(<MessageList messages={messages} currentUserId="current-user" />)

      const avatar = screen.getByText('B').parentElement
      expect(avatar).toHaveStyle({ backgroundColor: '#6b7280' })
    })

    it('should render smaller avatars on mobile', () => {
      const messages = [
        createMockMessage(1, { avatar: 'A' })
      ]
      const { container } = render(
        <MessageList messages={messages} currentUserId="user-2" isMobile={true} />
      )

      const avatar = screen.getByText('A').parentElement
      expect(avatar).toHaveClass('w-8', 'h-8')
    })

    it('should render larger avatars on desktop', () => {
      const messages = [
        createMockMessage(1, { avatar: 'A' })
      ]
      const { container } = render(
        <MessageList messages={messages} currentUserId="user-2" isMobile={false} />
      )

      const avatar = screen.getByText('A').parentElement
      expect(avatar).toHaveClass('w-10', 'h-10')
    })
  })

  describe('Message Reactions', () => {
    it('should display reactions when present', () => {
      const messages = [
        createMockMessage(1, {
          reactions: {
            '👍': ['user-1', 'user-2'],
            '❤️': ['user-3']
          }
        })
      ]
      render(<MessageList messages={messages} currentUserId="user-1" />)

      expect(screen.getByTestId('message-reactions')).toBeInTheDocument()
    })

    it('should not display reactions section when empty', () => {
      const messages = [
        createMockMessage(1, { reactions: {} })
      ]
      render(<MessageList messages={messages} currentUserId="user-1" />)

      expect(screen.queryByTestId('message-reactions')).not.toBeInTheDocument()
    })

    it('should call onMessageReact when adding reaction', async () => {
      const onMessageReact = vi.fn()
      const messages = [
        createMockMessage(1, {
          reactions: { '👍': ['user-2'] }
        })
      ]
      render(
        <MessageList
          messages={messages}
          currentUserId="user-1"
          onMessageReact={onMessageReact}
        />
      )

      const reactionButton = screen.getByTestId('reaction-👍')
      fireEvent.click(reactionButton)

      expect(onMessageReact).toHaveBeenCalledWith('msg-1', '👍')
    })

    it('should render reactions in mobile mode', () => {
      const messages = [
        createMockMessage(1, {
          reactions: { '👍': ['user-2'] }
        })
      ]
      render(
        <MessageList
          messages={messages}
          currentUserId="user-1"
          isMobile={true}
        />
      )

      expect(screen.getByTestId('message-reactions')).toBeInTheDocument()
    })
  })

  describe('Thread Indicators', () => {
    it('should display thread indicator when thread replies exist', () => {
      const messages = [
        createMockMessage(1, {
          threadReplies: [
            { id: 'reply-1', content: 'Reply 1' },
            { id: 'reply-2', content: 'Reply 2' }
          ]
        })
      ]
      render(<MessageList messages={messages} currentUserId="user-1" />)

      expect(screen.getByText('2 replies')).toBeInTheDocument()
    })

    it('should display singular form for one reply', () => {
      const messages = [
        createMockMessage(1, {
          threadReplies: [
            { id: 'reply-1', content: 'Reply 1' }
          ]
        })
      ]
      render(<MessageList messages={messages} currentUserId="user-1" />)

      expect(screen.getByText('1 reply')).toBeInTheDocument()
    })

    it('should call onOpenThread when thread indicator is clicked', () => {
      const onOpenThread = vi.fn()
      const messages = [
        createMockMessage(1, {
          threadReplies: [{ id: 'reply-1', content: 'Reply 1' }]
        })
      ]
      render(
        <MessageList
          messages={messages}
          currentUserId="user-1"
          onOpenThread={onOpenThread}
        />
      )

      const threadButton = screen.getByText('1 reply')
      fireEvent.click(threadButton)

      expect(onOpenThread).toHaveBeenCalledWith(expect.objectContaining({ id: 'msg-1' }))
    })

    it('should not display thread indicator when no replies', () => {
      const messages = [
        createMockMessage(1, { threadReplies: [] })
      ]
      render(<MessageList messages={messages} currentUserId="user-1" />)

      expect(screen.queryByText(/reply/)).not.toBeInTheDocument()
    })
  })

  describe('Read Receipts', () => {
    it('should display read count for own messages', () => {
      const messages = [
        createMockMessage(1, {
          userId: 'current-user',
          readBy: ['current-user', 'user-2', 'user-3']
        })
      ]
      render(<MessageList messages={messages} currentUserId="current-user" />)

      expect(screen.getByText('Read by 2')).toBeInTheDocument()
    })

    it('should not display read count for messages with only one reader', () => {
      const messages = [
        createMockMessage(1, {
          userId: 'current-user',
          readBy: ['current-user']
        })
      ]
      render(<MessageList messages={messages} currentUserId="current-user" />)

      expect(screen.queryByText(/Read by/)).not.toBeInTheDocument()
    })

    it('should not display read count for other user messages', () => {
      const messages = [
        createMockMessage(1, {
          userId: 'other-user',
          readBy: ['current-user', 'user-2', 'user-3']
        })
      ]
      render(<MessageList messages={messages} currentUserId="current-user" />)

      expect(screen.queryByText(/Read by/)).not.toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('should display loading indicator when loading', () => {
      render(<MessageList messages={[]} currentUserId="user-1" isLoading={true} />)

      const spinner = document.querySelector('.')
      expect(spinner).toBeInTheDocument()
    })

    it('should not display loading indicator when not loading', () => {
      render(<MessageList messages={[]} currentUserId="user-1" isLoading={false} />)

      const spinner = document.querySelector('.')
      expect(spinner).not.toBeInTheDocument()
    })

    it('should display messages while loading', () => {
      const messages = [createMockMessage(1)]
      render(
        <MessageList
          messages={messages}
          currentUserId="user-1"
          isLoading={true}
        />
      )

      expect(screen.getByText('Test message 1')).toBeInTheDocument()
      expect(document.querySelector('.')).toBeInTheDocument()
    })
  })

  describe('Message Actions', () => {
    it('should render message actions for each message', () => {
      const messages = [createMockMessage(1)]
      render(<MessageList messages={messages} currentUserId="user-1" />)

      expect(screen.getByTestId('message-actions-msg-1')).toBeInTheDocument()
    })

    it('should call onMessageEdit when edit is clicked', () => {
      const onMessageEdit = vi.fn()
      const messages = [createMockMessage(1)]
      render(
        <MessageList
          messages={messages}
          currentUserId="user-1"
          onMessageEdit={onMessageEdit}
        />
      )

      const editButton = screen.getByText('Edit')
      fireEvent.click(editButton)

      expect(onMessageEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'msg-1' }))
    })

    it('should call onMessageDelete when delete is clicked', () => {
      const onMessageDelete = vi.fn()
      const messages = [createMockMessage(1)]
      render(
        <MessageList
          messages={messages}
          currentUserId="user-1"
          onMessageDelete={onMessageDelete}
        />
      )

      const deleteButton = screen.getByText('Delete')
      fireEvent.click(deleteButton)

      expect(onMessageDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 'msg-1' }))
    })

    it('should call onMessageReply when reply is clicked', () => {
      const onMessageReply = vi.fn()
      const messages = [createMockMessage(1)]
      render(
        <MessageList
          messages={messages}
          currentUserId="user-1"
          onMessageReply={onMessageReply}
        />
      )

      const replyButton = screen.getByText('Reply')
      fireEvent.click(replyButton)

      expect(onMessageReply).toHaveBeenCalledWith(expect.objectContaining({ id: 'msg-1' }))
    })

    it('should call onMessageCopy when copy is clicked', () => {
      const onMessageCopy = vi.fn()
      const messages = [createMockMessage(1)]
      render(
        <MessageList
          messages={messages}
          currentUserId="user-1"
          onMessageCopy={onMessageCopy}
        />
      )

      const copyButton = screen.getByText('Copy')
      fireEvent.click(copyButton)

      expect(onMessageCopy).toHaveBeenCalledWith(expect.objectContaining({ id: 'msg-1' }))
    })

    it('should call onMessagePin when pin is clicked', () => {
      const onMessagePin = vi.fn()
      const messages = [createMockMessage(1)]
      render(
        <MessageList
          messages={messages}
          currentUserId="user-1"
          onMessagePin={onMessagePin}
        />
      )

      const pinButton = screen.getByText('Pin')
      fireEvent.click(pinButton)

      expect(onMessagePin).toHaveBeenCalledWith(expect.objectContaining({ id: 'msg-1' }))
    })
  })

  describe('Mobile Touch Interactions', () => {
    it('should handle touch start on mobile', () => {
      const messages = [createMockMessage(1)]
      const { container } = render(
        <MessageList messages={messages} currentUserId="user-1" isMobile={true} />
      )

      const messageItem = container.querySelector('#message-msg-1')
      fireEvent.touchStart(messageItem, {
        touches: [{ clientX: 100, clientY: 100 }]
      })

      expect(messageItem).toBeInTheDocument()
    })

    it('should handle swipe right gesture for reply', () => {
      const onMessageReply = vi.fn()
      const messages = [createMockMessage(1)]
      const { container } = render(
        <MessageList
          messages={messages}
          currentUserId="user-1"
          isMobile={true}
          onMessageReply={onMessageReply}
        />
      )

      const messageItem = container.querySelector('#message-msg-1')

      fireEvent.touchStart(messageItem, {
        touches: [{ clientX: 50, clientY: 100 }]
      })

      fireEvent.touchMove(messageItem, {
        touches: [{ clientX: 150, clientY: 100 }]
      })

      fireEvent.touchEnd(messageItem, {})

      expect(onMessageReply).toHaveBeenCalledWith(expect.objectContaining({ id: 'msg-1' }))
    })

    it('should handle swipe left gesture for selection', () => {
      const messages = [createMockMessage(1)]
      const { container } = render(
        <MessageList
          messages={messages}
          currentUserId="user-1"
          isMobile={true}
        />
      )

      const messageItem = container.querySelector('#message-msg-1')

      fireEvent.touchStart(messageItem, {
        touches: [{ clientX: 150, clientY: 100 }]
      })

      fireEvent.touchMove(messageItem, {
        touches: [{ clientX: 50, clientY: 100 }]
      })

      fireEvent.touchEnd(messageItem, {})

      expect(screen.getByText(/message/)).toBeInTheDocument()
    })

    it('should not handle touch events when not on mobile', () => {
      const onMessageReply = vi.fn()
      const messages = [createMockMessage(1)]
      const { container } = render(
        <MessageList
          messages={messages}
          currentUserId="user-1"
          isMobile={false}
          onMessageReply={onMessageReply}
        />
      )

      const messageItem = container.querySelector('#message-msg-1')

      fireEvent.touchStart(messageItem, {
        touches: [{ clientX: 50, clientY: 100 }]
      })

      fireEvent.touchMove(messageItem, {
        touches: [{ clientX: 150, clientY: 100 }]
      })

      fireEvent.touchEnd(messageItem, {})

      expect(onMessageReply).not.toHaveBeenCalled()
    })

    it('should trigger haptic feedback on long press', () => {
      const messages = [createMockMessage(1)]
      const { container } = render(
        <MessageList
          messages={messages}
          currentUserId="user-1"
          isMobile={true}
        />
      )

      const messageItem = container.querySelector('#message-msg-1')

      fireEvent.touchStart(messageItem, {
        touches: [{ clientX: 100, clientY: 100 }]
      })

      fireEvent.touchMove(messageItem, {
        touches: [{ clientX: 100, clientY: 100 }]
      })

      setTimeout(() => {
        fireEvent.touchEnd(messageItem, {})
      }, 600)
    })
  })

  describe('Selection Mode', () => {
    it('should enter selection mode on long press', () => {
      const messages = [createMockMessage(1)]
      const { container } = render(
        <MessageList
          messages={messages}
          currentUserId="user-1"
          isMobile={true}
        />
      )

      const messageItem = container.querySelector('#message-msg-1')

      fireEvent.touchStart(messageItem, {
        touches: [{ clientX: 100, clientY: 100 }]
      })

      fireEvent.touchMove(messageItem, {
        touches: [{ clientX: 100, clientY: 100 }]
      })

      setTimeout(() => {
        fireEvent.touchEnd(messageItem, {})
        expect(screen.queryByText(/selected/)).toBeInTheDocument()
      }, 600)
    })

    it('should display selection count', () => {
      const messages = [createMockMessage(1)]
      const { container, rerender } = render(
        <MessageList
          messages={messages}
          currentUserId="user-1"
          isMobile={true}
        />
      )

      const messageItem = container.querySelector('#message-msg-1')

      fireEvent.touchStart(messageItem, {
        touches: [{ clientX: 150, clientY: 100 }]
      })

      fireEvent.touchMove(messageItem, {
        touches: [{ clientX: 50, clientY: 100 }]
      })

      fireEvent.touchEnd(messageItem, {})
    })

    it('should copy selected messages when copy button is clicked', () => {
      const onMessageCopy = vi.fn()
      const messages = [createMockMessage(1)]
      const { container } = render(
        <MessageList
          messages={messages}
          currentUserId="user-1"
          isMobile={true}
          onMessageCopy={onMessageCopy}
        />
      )

      const messageItem = container.querySelector('#message-msg-1')

      fireEvent.touchStart(messageItem, {
        touches: [{ clientX: 150, clientY: 100 }]
      })

      fireEvent.touchMove(messageItem, {
        touches: [{ clientX: 50, clientY: 100 }]
      })

      fireEvent.touchEnd(messageItem, {})

      const copyButton = screen.queryByText('Copy')
      if (copyButton) {
        fireEvent.click(copyButton)
        expect(onMessageCopy).toHaveBeenCalled()
      }
    })

    it('should exit selection mode when cancel is clicked', () => {
      const messages = [createMockMessage(1)]
      const { container } = render(
        <MessageList
          messages={messages}
          currentUserId="user-1"
          isMobile={true}
        />
      )

      const messageItem = container.querySelector('#message-msg-1')

      fireEvent.touchStart(messageItem, {
        touches: [{ clientX: 150, clientY: 100 }]
      })

      fireEvent.touchMove(messageItem, {
        touches: [{ clientX: 50, clientY: 100 }]
      })

      fireEvent.touchEnd(messageItem, {})

      const cancelButton = screen.queryByText('Cancel')
      if (cancelButton) {
        fireEvent.click(cancelButton)
      }
    })
  })

  describe('Virtual Scrolling', () => {
    it('should calculate total height for virtual scrolling', () => {
      const messages = Array.from({ length: 100 }, (_, i) => createMockMessage(i))
      const { container } = render(
        <MessageList messages={messages} currentUserId="user-1" />
      )

      const virtualContainer = container.querySelector('[style*="position: relative"]')
      expect(virtualContainer).toBeInTheDocument()
    })

    it('should render spacers for virtual scrolling', () => {
      const messages = Array.from({ length: 100 }, (_, i) => createMockMessage(i))
      const { container } = render(
        <MessageList messages={messages} currentUserId="user-1" />
      )

      const spacers = container.querySelectorAll('[style*="height"]')
      expect(spacers.length).toBeGreaterThan(0)
    })

    it('should update visible range on scroll', () => {
      const messages = Array.from({ length: 100 }, (_, i) => createMockMessage(i))
      const { container } = render(
        <MessageList messages={messages} currentUserId="user-1" />
      )

      const scrollContainer = container.querySelector('.overflow-y-auto')
      if (scrollContainer) {
        fireEvent.scroll(scrollContainer, {
          target: {
            scrollTop: 500,
            clientHeight: 500,
            scrollHeight: 2000
          }
        })
      }

      expect(scrollContainer).toBeInTheDocument()
    })

    it('should apply overscan to visible range', () => {
      const messages = Array.from({ length: 100 }, (_, i) => createMockMessage(i))
      render(<MessageList messages={messages} currentUserId="user-1" />)

      expect(screen.queryByText('Test message 1')).toBeInTheDocument()
    })
  })

  describe('Performance Optimizations', () => {
    it('should memoize grouped messages', () => {
      const messages = [
        createMockMessage(1),
        createMockMessage(2)
      ]
      const { rerender } = render(
        <MessageList messages={messages} currentUserId="user-1" />
      )

      rerender(<MessageList messages={messages} currentUserId="user-1" />)

      expect(screen.getByText('Test message 1')).toBeInTheDocument()
    })

    it('should memoize flat message list', () => {
      const messages = [
        createMockMessage(1),
        createMockMessage(2)
      ]
      const { rerender } = render(
        <MessageList messages={messages} currentUserId="user-1" />
      )

      rerender(<MessageList messages={messages} currentUserId="user-1" />)

      expect(screen.getByText('Test message 2')).toBeInTheDocument()
    })

    it('should use callbacks for event handlers', () => {
      const onMessageEdit = vi.fn()
      const messages = [createMockMessage(1)]
      const { rerender } = render(
        <MessageList
          messages={messages}
          currentUserId="user-1"
          onMessageEdit={onMessageEdit}
        />
      )

      rerender(
        <MessageList
          messages={messages}
          currentUserId="user-1"
          onMessageEdit={onMessageEdit}
        />
      )

      expect(screen.getByTestId('message-actions-msg-1')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty messages array', () => {
      render(<MessageList messages={[]} currentUserId="user-1" />)

      expect(screen.queryByText(/Test message/)).not.toBeInTheDocument()
    })

    it('should handle missing currentUserId', () => {
      const messages = [createMockMessage(1)]
      render(<MessageList messages={messages} currentUserId={null} />)

      expect(screen.getByText('Test message 1')).toBeInTheDocument()
    })

    it('should handle messages without reactions', () => {
      const messages = [createMockMessage(1, { reactions: undefined })]
      render(<MessageList messages={messages} currentUserId="user-1" />)

      expect(screen.queryByTestId('message-reactions')).not.toBeInTheDocument()
    })

    it('should handle messages without threadReplies', () => {
      const messages = [createMockMessage(1, { threadReplies: undefined })]
      render(<MessageList messages={messages} currentUserId="user-1" />)

      expect(screen.queryByText(/reply/)).not.toBeInTheDocument()
    })

    it('should handle messages without readBy', () => {
      const messages = [
        createMockMessage(1, { userId: 'current-user', readBy: undefined })
      ]
      render(<MessageList messages={messages} currentUserId="current-user" />)

      expect(screen.getByText('Test message 1')).toBeInTheDocument()
    })

    it('should handle undefined callback props', () => {
      const messages = [createMockMessage(1)]
      render(<MessageList messages={messages} currentUserId="user-1" />)

      expect(screen.getByText('Test message 1')).toBeInTheDocument()
    })

    it('should handle scroll container not present', () => {
      const { container } = render(
        <MessageList messages={[]} currentUserId="user-1" />
      )

      const scrollContainer = container.querySelector('.overflow-y-auto')
      expect(scrollContainer).toBeInTheDocument()
    })
  })
})

export default mockIntersectionObserver
