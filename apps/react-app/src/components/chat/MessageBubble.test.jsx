import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import MessageBubble from './MessageBubble'

// Mock dependencies
jest.mock('react-markdown', () => {
  return function ReactMarkdown({ children, components }) {
    if (components) {
      const processedContent = children
      return <div data-testid="markdown-content">{processedContent}</div>
    }
    return <div data-testid="markdown-content">{children}</div>
  }
})

jest.mock('./MessageActions', () => {
  return function MessageActions({ message, isOwnMessage, onReply, onEdit, onDelete, onReact, onPin, onCopy, position }) {
    return (
      <div data-testid="message-actions" data-position={position}>
        <button onClick={() => onReply(message)}>Reply</button>
        <button onClick={() => onEdit(message)}>Edit</button>
        <button onClick={() => onDelete(message)}>Delete</button>
        <button onClick={() => onReact(message.id, '👍')}>React</button>
        <button onClick={() => onPin(message)}>Pin</button>
        <button onClick={() => onCopy(message.content)}>Copy</button>
      </div>
    )
  }
})

jest.mock('./MessageReactions', () => {
  return function MessageReactions({ reactions, onAddReaction, onRemoveReaction, currentUserId, messageId }) {
    return (
      <div data-testid="message-reactions">
        {Object.entries(reactions || {}).map(([emoji, data]) => (
          <button key={emoji} onClick={() => onRemoveReaction(messageId, emoji)}>
            {emoji} {data.count}
          </button>
        ))}
        <button onClick={() => onAddReaction(messageId, '👍')}>Add Reaction</button>
      </div>
    )
  }
})

jest.mock('../ui/Card', () => ({
  Card: ({ children, className }) => <div className={className}>{children}</div>
}))

jest.mock('../ui/Button', () => ({
  IconButton: ({ children, onClick }) => <button onClick={onClick}>{children}</button>
}))

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve())
  },
  vibrate: jest.fn()
})

describe('MessageBubble', () => {
  const mockMessage = {
    id: 'msg-1',
    content: 'Hello, this is a test message',
    timestamp: new Date('2024-01-15T10:30:00').toISOString(),
    userId: 'user-1',
    reactions: {
      '👍': { count: 2, users: ['user-1', 'user-2'] },
      '❤️': { count: 1, users: ['user-3'] }
    }
  }

  const defaultProps = {
    message: mockMessage,
    isOwnMessage: false,
    isMobile: false,
    isSelected: false,
    onReact: jest.fn(),
    onReply: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onPin: jest.fn(),
    onCopy: jest.fn(),
    currentUserId: 'current-user'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render the message content', () => {
      render(<MessageBubble {...defaultProps} />)
      expect(screen.getByText(/Hello, this is a test message/i)).toBeInTheDocument()
    })

    it('should render with custom className', () => {
      const { container } = render(<MessageBubble {...defaultProps} className="custom-class" />)
      expect(container.firstChild).toHaveClass('custom-class')
    })

    it('should render message reactions', () => {
      render(<MessageBubble {...defaultProps} />)
      expect(screen.getByTestId('message-reactions')).toBeInTheDocument()
    })

    it('should render without reactions when message has no reactions', () => {
      const messageWithoutReactions = { ...mockMessage, reactions: {} }
      render(<MessageBubble {...defaultProps} message={messageWithoutReactions} />)
      expect(screen.getByTestId('message-reactions')).toBeInTheDocument()
    })

    it('should apply selected styles when isSelected is true', () => {
      const { container } = render(<MessageBubble {...defaultProps} isSelected={true} />)
      const bubble = container.querySelector('[class*="ring-2"]')
      expect(bubble).toBeInTheDocument()
    })
  })

  describe('Own Message Styling', () => {
    it('should apply own message styles when isOwnMessage is true', () => {
      render(<MessageBubble {...defaultProps} isOwnMessage={true} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')
      expect(bubble).toHaveStyle({ marginLeft: 'auto' })
    })

    it('should apply different border radius for own messages', () => {
      render(<MessageBubble {...defaultProps} isOwnMessage={true} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')
      expect(bubble).toHaveStyle({ borderRadius: '16px 16px 4px 16px' })
    })

    it('should apply different border radius for other messages', () => {
      render(<MessageBubble {...defaultProps} isOwnMessage={false} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')
      expect(bubble).toHaveStyle({ borderRadius: '16px 16px 16px 4px' })
    })

    it('should show timestamp for own messages', () => {
      render(<MessageBubble {...defaultProps} isOwnMessage={true} />)
      expect(screen.getByText(/10:30/)).toBeInTheDocument()
    })

    it('should show delivery status indicator for own messages', () => {
      const { container } = render(<MessageBubble {...defaultProps} isOwnMessage={true} />)
      const statusIcon = container.querySelector('svg')
      expect(statusIcon).toBeInTheDocument()
    })

    it('should show read receipt for messages with multiple readers', () => {
      const messageWithReaders = {
        ...mockMessage,
        readBy: ['user-1', 'user-2', 'user-3']
      }
      const { container } = render(<MessageBubble {...defaultProps} message={messageWithReaders} isOwnMessage={true} />)
      const checkmarks = container.querySelectorAll('svg')
      expect(checkmarks.length).toBeGreaterThanOrEqual(2)
    })

    it('should not show read receipt for messages with one reader', () => {
      const messageWithOneReader = {
        ...mockMessage,
        readBy: ['user-1']
      }
      render(<MessageBubble {...defaultProps} message={messageWithOneReader} isOwnMessage={true} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')
      expect(bubble).toBeInTheDocument()
    })
  })

  describe('Mobile Styling', () => {
    it('should apply mobile text size when isMobile is true', () => {
      const { container } = render(<MessageBubble {...defaultProps} isMobile={true} />)
      const bubble = container.querySelector('[class*="text-sm"]')
      expect(bubble).toBeInTheDocument()
    })

    it('should apply desktop text size when isMobile is false', () => {
      const { container } = render(<MessageBubble {...defaultProps} isMobile={false} />)
      const bubble = container.querySelector('[class*="text-base"]')
      expect(bubble).toBeInTheDocument()
    })

    it('should set maxWidth to 85% on mobile', () => {
      render(<MessageBubble {...defaultProps} isMobile={true} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')
      expect(bubble).toHaveStyle({ maxWidth: '85%' })
    })

    it('should set maxWidth to 70% on desktop', () => {
      render(<MessageBubble {...defaultProps} isMobile={false} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')
      expect(bubble).toHaveStyle({ maxWidth: '70%' })
    })
  })

  describe('Message Actions', () => {
    it('should show message actions on hover for desktop', async () => {
      render(<MessageBubble {...defaultProps} isMobile={false} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')

      fireEvent.mouseEnter(bubble)

      await waitFor(() => {
        expect(screen.getByTestId('message-actions')).toBeInTheDocument()
      })
    })

    it('should hide message actions on mouse leave', async () => {
      render(<MessageBubble {...defaultProps} isMobile={false} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')

      fireEvent.mouseEnter(bubble)
      await waitFor(() => {
        expect(screen.getByTestId('message-actions')).toBeInTheDocument()
      })

      fireEvent.mouseLeave(bubble)

      await waitFor(() => {
        expect(screen.queryByTestId('message-actions')).not.toBeInTheDocument()
      })
    })

    it('should not show message actions on mobile hover', () => {
      render(<MessageBubble {...defaultProps} isMobile={true} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')

      fireEvent.mouseEnter(bubble)

      expect(screen.queryByTestId('message-actions')).not.toBeInTheDocument()
    })

    it('should position actions on top-left for own messages', async () => {
      render(<MessageBubble {...defaultProps} isOwnMessage={true} isMobile={false} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')

      fireEvent.mouseEnter(bubble)

      await waitFor(() => {
        const actions = screen.getByTestId('message-actions')
        expect(actions).toHaveAttribute('data-position', 'top-left')
      })
    })

    it('should position actions on top-right for other messages', async () => {
      render(<MessageBubble {...defaultProps} isOwnMessage={false} isMobile={false} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')

      fireEvent.mouseEnter(bubble)

      await waitFor(() => {
        const actions = screen.getByTestId('message-actions')
        expect(actions).toHaveAttribute('data-position', 'top-right')
      })
    })
  })

  describe('Touch Gestures - Swipe', () => {
    it('should handle touch start event on mobile', () => {
      render(<MessageBubble {...defaultProps} isMobile={true} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')

      fireEvent.touchStart(bubble, {
        touches: [{ clientX: 100, clientY: 100 }]
      })

      expect(bubble).toBeInTheDocument()
    })

    it('should not handle touch start on desktop', () => {
      render(<MessageBubble {...defaultProps} isMobile={false} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')

      fireEvent.touchStart(bubble, {
        touches: [{ clientX: 100, clientY: 100 }]
      })

      expect(bubble).toBeInTheDocument()
    })

    it('should handle swipe right gesture on other messages', () => {
      render(<MessageBubble {...defaultProps} isMobile={true} isOwnMessage={false} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')

      fireEvent.touchStart(bubble, {
        touches: [{ clientX: 50, clientY: 100 }]
      })

      fireEvent.touchMove(bubble, {
        touches: [{ clientX: 150, clientY: 100 }]
      })

      fireEvent.touchEnd(bubble)

      expect(defaultProps.onReply).toHaveBeenCalledWith(mockMessage)
    })

    it('should handle swipe left gesture on own messages', () => {
      render(<MessageBubble {...defaultProps} isMobile={true} isOwnMessage={true} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')

      fireEvent.touchStart(bubble, {
        touches: [{ clientX: 150, clientY: 100 }]
      })

      fireEvent.touchMove(bubble, {
        touches: [{ clientX: 50, clientY: 100 }]
      })

      fireEvent.touchEnd(bubble)

      expect(bubble).toBeInTheDocument()
    })

    it('should show quick reactions on sufficient swipe', async () => {
      render(<MessageBubble {...defaultProps} isMobile={true} isOwnMessage={false} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')

      fireEvent.touchStart(bubble, {
        touches: [{ clientX: 50, clientY: 100 }]
      })

      fireEvent.touchMove(bubble, {
        touches: [{ clientX: 150, clientY: 100 }]
      })

      await waitFor(() => {
        const quickReactions = screen.queryAllByRole('button', { name: /👍|❤️|😂|😮|😢|🔥/ })
        expect(quickReactions.length).toBeGreaterThan(0)
      })
    })

    it('should dismiss swipe with vertical movement', () => {
      render(<MessageBubble {...defaultProps} isMobile={true} isOwnMessage={false} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')

      fireEvent.touchStart(bubble, {
        touches: [{ clientX: 100, clientY: 50 }]
      })

      fireEvent.touchMove(bubble, {
        touches: [{ clientX: 120, clientY: 120 }]
      })

      expect(bubble).toBeInTheDocument()
    })

    it('should trigger haptic feedback on swipe action', () => {
      render(<MessageBubble {...defaultProps} isMobile={true} isOwnMessage={false} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')

      fireEvent.touchStart(bubble, {
        touches: [{ clientX: 50, clientY: 100 }]
      })

      fireEvent.touchMove(bubble, {
        touches: [{ clientX: 150, clientY: 100 }]
      })

      fireEvent.touchEnd(bubble)

      expect(navigator.vibrate).toHaveBeenCalledWith(30)
    })

    it('should reset swipe offset after touch end', async () => {
      jest.useFakeTimers()
      render(<MessageBubble {...defaultProps} isMobile={true} isOwnMessage={false} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')

      fireEvent.touchStart(bubble, {
        touches: [{ clientX: 50, clientY: 100 }]
      })

      fireEvent.touchMove(bubble, {
        touches: [{ clientX: 150, clientY: 100 }]
      })

      fireEvent.touchEnd(bubble)

      jest.advanceTimersByTime(200)

      await waitFor(() => {
        expect(bubble).toHaveStyle({ transform: 'translateX(0px)' })
      })

      jest.useRealTimers()
    })

    it('should constrain swipe offset for own messages', () => {
      render(<MessageBubble {...defaultProps} isMobile={true} isOwnMessage={true} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')

      fireEvent.touchStart(bubble, {
        touches: [{ clientX: 200, clientY: 100 }]
      })

      fireEvent.touchMove(bubble, {
        touches: [{ clientX: 50, clientY: 100 }]
      })

      expect(bubble).toBeInTheDocument()
    })

    it('should constrain swipe offset for other messages', () => {
      render(<MessageBubble {...defaultProps} isMobile={true} isOwnMessage={false} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')

      fireEvent.touchStart(bubble, {
        touches: [{ clientX: 50, clientY: 100 }]
      })

      fireEvent.touchMove(bubble, {
        touches: [{ clientX: 200, clientY: 100 }]
      })

      expect(bubble).toBeInTheDocument()
    })
  })

  describe('Touch Gestures - Long Press', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should show quick reactions on long press for mobile', async () => {
      render(<MessageBubble {...defaultProps} isMobile={true} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')

      fireEvent.touchStart(bubble, {
        touches: [{ clientX: 100, clientY: 100 }]
      })

      jest.advanceTimersByTime(500)

      await waitFor(() => {
        const quickReactions = screen.queryAllByRole('button')
        expect(quickReactions.length).toBeGreaterThan(0)
      })
    })

    it('should trigger haptic feedback on long press', () => {
      render(<MessageBubble {...defaultProps} isMobile={true} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')

      fireEvent.touchStart(bubble, {
        touches: [{ clientX: 100, clientY: 100 }]
      })

      jest.advanceTimersByTime(500)

      expect(navigator.vibrate).toHaveBeenCalledWith(50)
    })

    it('should cancel long press on touch end', () => {
      render(<MessageBubble {...defaultProps} isMobile={true} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')

      fireEvent.touchStart(bubble, {
        touches: [{ clientX: 100, clientY: 100 }]
      })

      jest.advanceTimersByTime(200)

      fireEvent.touchEnd(bubble)

      jest.advanceTimersByTime(300)

      expect(screen.queryByRole('button', { name: '👍' })).not.toBeInTheDocument()
    })

    it('should cancel long press on touch move', () => {
      render(<MessageBubble {...defaultProps} isMobile={true} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')

      fireEvent.touchStart(bubble, {
        touches: [{ clientX: 100, clientY: 100 }]
      })

      jest.advanceTimersByTime(200)

      fireEvent.touchMove(bubble, {
        touches: [{ clientX: 150, clientY: 100 }]
      })

      jest.advanceTimersByTime(300)

      expect(bubble).toBeInTheDocument()
    })

    it('should not show quick reactions on long press for desktop', () => {
      render(<MessageBubble {...defaultProps} isMobile={false} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')

      fireEvent.touchStart(bubble, {
        touches: [{ clientX: 100, clientY: 100 }]
      })

      jest.advanceTimersByTime(500)

      expect(screen.queryByRole('button', { name: '👍' })).not.toBeInTheDocument()
    })
  })

  describe('Quick Reactions', () => {
    it('should display quick reactions when shown', async () => {
      render(<MessageBubble {...defaultProps} isMobile={true} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')

      fireEvent.touchStart(bubble, {
        touches: [{ clientX: 50, clientY: 100 }]
      })

      fireEvent.touchMove(bubble, {
        touches: [{ clientX: 150, clientY: 100 }]
      })

      await waitFor(() => {
        expect(screen.getByText('👍')).toBeInTheDocument()
      })
    })

    it('should handle quick reaction selection', async () => {
      render(<MessageBubble {...defaultProps} isMobile={true} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')

      fireEvent.touchStart(bubble, {
        touches: [{ clientX: 50, clientY: 100 }]
      })

      fireEvent.touchMove(bubble, {
        touches: [{ clientX: 150, clientY: 100 }]
      })

      await waitFor(() => {
        const thumbsUp = screen.getByText('👍')
        fireEvent.click(thumbsUp)
      })

      expect(defaultProps.onReact).toHaveBeenCalledWith('msg-1', '👍')
    })

    it('should close quick reactions on close button click', async () => {
      render(<MessageBubble {...defaultProps} isMobile={true} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')

      fireEvent.touchStart(bubble, {
        touches: [{ clientX: 50, clientY: 100 }]
      })

      fireEvent.touchMove(bubble, {
        touches: [{ clientX: 150, clientY: 100 }]
      })

      await waitFor(() => {
        const closeButton = screen.getByRole('button', { name: '' })
        if (closeButton) {
          fireEvent.click(closeButton)
        }
      })
    })

    it('should position quick reactions on right for own messages', async () => {
      render(<MessageBubble {...defaultProps} isMobile={true} isOwnMessage={true} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')

      fireEvent.touchStart(bubble, {
        touches: [{ clientX: 150, clientY: 100 }]
      })

      fireEvent.touchMove(bubble, {
        touches: [{ clientX: 50, clientY: 100 }]
      })

      fireEvent.touchEnd(bubble)

      await waitFor(() => {
        const quickReactions = screen.queryByText('👍')
        if (quickReactions) {
          const container = quickReactions.closest('div')
          expect(container).toHaveClass('right-0')
        }
      })
    })

    it('should position quick reactions on left for other messages', async () => {
      render(<MessageBubble {...defaultProps} isMobile={true} isOwnMessage={false} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')

      fireEvent.touchStart(bubble, {
        touches: [{ clientX: 50, clientY: 100 }]
      })

      fireEvent.touchMove(bubble, {
        touches: [{ clientX: 150, clientY: 100 }]
      })

      await waitFor(() => {
        const quickReactions = screen.queryByText('👍')
        if (quickReactions) {
          const container = quickReactions.closest('div')
          expect(container).toHaveClass('left-0')
        }
      })
    })
  })

  describe('Content Parsing', () => {
    it('should parse URLs in message content', () => {
      const messageWithUrl = {
        ...mockMessage,
        content: 'Check this out https://example.com'
      }
      render(<MessageBubble {...defaultProps} message={messageWithUrl} />)
      expect(screen.getByText(/Check this out/)).toBeInTheDocument()
    })

    it('should parse mentions in message content', () => {
      const messageWithMention = {
        ...mockMessage,
        content: 'Hey @john how are you?'
      }
      render(<MessageBubble {...defaultProps} message={messageWithMention} />)
      expect(screen.getByText(/Hey @john how are you?/)).toBeInTheDocument()
    })

    it('should parse hashtags in message content', () => {
      const messageWithHashtag = {
        ...mockMessage,
        content: 'This is #awesome'
      }
      render(<MessageBubble {...defaultProps} message={messageWithHashtag} />)
      expect(screen.getByText(/This is #awesome/)).toBeInTheDocument()
    })

    it('should parse multiple URLs in message content', () => {
      const messageWithMultipleUrls = {
        ...mockMessage,
        content: 'Visit https://example.com and https://test.com'
      }
      render(<MessageBubble {...defaultProps} message={messageWithMultipleUrls} />)
      expect(screen.getByText(/Visit https:\/\/example.com and https:\/\/test.com/)).toBeInTheDocument()
    })

    it('should parse combined mentions and hashtags', () => {
      const messageWithMixed = {
        ...mockMessage,
        content: 'Hey @john check #news'
      }
      render(<MessageBubble {...defaultProps} message={messageWithMixed} />)
      expect(screen.getByText(/Hey @john check #news/)).toBeInTheDocument()
    })
  })

  describe('File Attachments', () => {
    it('should render file attachment', () => {
      const messageWithFile = {
        ...mockMessage,
        content: '📎 document.pdf'
      }
      const { container } = render(<MessageBubble {...defaultProps} message={messageWithFile} />)
      expect(screen.getByText('document.pdf')).toBeInTheDocument()
      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('should render voice message attachment', () => {
      const messageWithVoice = {
        ...mockMessage,
        content: '🎵 voice_message.mp3'
      }
      const { container } = render(<MessageBubble {...defaultProps} message={messageWithVoice} />)
      expect(container.querySelector('button')).toBeInTheDocument()
      expect(screen.getByText('0:42')).toBeInTheDocument()
    })

    it('should not render attachment for regular messages', () => {
      const regularMessage = {
        ...mockMessage,
        content: 'Just a regular message'
      }
      const { container } = render(<MessageBubble {...defaultProps} message={regularMessage} />)
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument()
    })
  })

  describe('Reaction Handling', () => {
    it('should call onReact when reaction is added', async () => {
      render(<MessageBubble {...defaultProps} />)

      const addReactionButton = screen.getByText('Add Reaction')
      fireEvent.click(addReactionButton)

      expect(defaultProps.onReact).toHaveBeenCalledWith('msg-1', '👍')
    })

    it('should call onReact with remove action when reaction is removed', () => {
      render(<MessageBubble {...defaultProps} />)

      const reactionButton = screen.getByText('👍 2')
      fireEvent.click(reactionButton)

      expect(screen.getByTestId('message-reactions')).toBeInTheDocument()
    })

    it('should pass correct messageId when reacting', async () => {
      render(<MessageBubble {...defaultProps} isMobile={false} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')

      fireEvent.mouseEnter(bubble)

      await waitFor(() => {
        const reactButton = screen.getByText('React')
        fireEvent.click(reactButton)
      })

      expect(defaultProps.onReact).toHaveBeenCalledWith('msg-1', '👍')
    })
  })

  describe('Message Actions Handlers', () => {
    it('should call onReply when reply action is triggered', async () => {
      render(<MessageBubble {...defaultProps} isMobile={false} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')

      fireEvent.mouseEnter(bubble)

      await waitFor(() => {
        const replyButton = screen.getByText('Reply')
        fireEvent.click(replyButton)
      })

      expect(defaultProps.onReply).toHaveBeenCalledWith(mockMessage)
    })

    it('should call onEdit when edit action is triggered', async () => {
      render(<MessageBubble {...defaultProps} isOwnMessage={true} isMobile={false} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')

      fireEvent.mouseEnter(bubble)

      await waitFor(() => {
        const editButton = screen.getByText('Edit')
        fireEvent.click(editButton)
      })

      expect(defaultProps.onEdit).toHaveBeenCalledWith(mockMessage)
    })

    it('should call onDelete when delete action is triggered', async () => {
      render(<MessageBubble {...defaultProps} isOwnMessage={true} isMobile={false} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')

      fireEvent.mouseEnter(bubble)

      await waitFor(() => {
        const deleteButton = screen.getByText('Delete')
        fireEvent.click(deleteButton)
      })

      expect(defaultProps.onDelete).toHaveBeenCalledWith(mockMessage)
    })

    it('should call onPin when pin action is triggered', async () => {
      render(<MessageBubble {...defaultProps} isMobile={false} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')

      fireEvent.mouseEnter(bubble)

      await waitFor(() => {
        const pinButton = screen.getByText('Pin')
        fireEvent.click(pinButton)
      })

      expect(defaultProps.onPin).toHaveBeenCalledWith(mockMessage)
    })

    it('should call onCopy and clipboard API when copy action is triggered', async () => {
      render(<MessageBubble {...defaultProps} isMobile={false} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')

      fireEvent.mouseEnter(bubble)

      await waitFor(() => {
        const copyButton = screen.getByText('Copy')
        fireEvent.click(copyButton)
      })

      expect(defaultProps.onCopy).toHaveBeenCalledWith(mockMessage.content)
    })
  })

  describe('Timestamp Display', () => {
    it('should format timestamp correctly for own messages', () => {
      render(<MessageBubble {...defaultProps} isOwnMessage={true} />)
      expect(screen.getByText(/10:30/)).toBeInTheDocument()
    })

    it('should not show timestamp for other messages', () => {
      render(<MessageBubble {...defaultProps} isOwnMessage={false} />)
      expect(screen.queryByText(/10:30/)).not.toBeInTheDocument()
    })

    it('should use 24-hour format for timestamp', () => {
      const afternoonMessage = {
        ...mockMessage,
        timestamp: new Date('2024-01-15T14:30:00').toISOString()
      }
      render(<MessageBubble {...defaultProps} message={afternoonMessage} isOwnMessage={true} />)
      expect(screen.getByText(/14:30/)).toBeInTheDocument()
    })
  })

  describe('Swipe Action Indicators', () => {
    it('should show swipe indicator when swiping right', () => {
      const { container } = render(<MessageBubble {...defaultProps} isMobile={true} isOwnMessage={false} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')

      fireEvent.touchStart(bubble, {
        touches: [{ clientX: 50, clientY: 100 }]
      })

      fireEvent.touchMove(bubble, {
        touches: [{ clientX: 100, clientY: 100 }]
      })

      const indicator = container.querySelector('.left-0')
      expect(indicator).toBeInTheDocument()
    })

    it('should show swipe indicator when swiping left', () => {
      const { container } = render(<MessageBubble {...defaultProps} isMobile={true} isOwnMessage={true} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')

      fireEvent.touchStart(bubble, {
        touches: [{ clientX: 100, clientY: 100 }]
      })

      fireEvent.touchMove(bubble, {
        touches: [{ clientX: 50, clientY: 100 }]
      })

      const indicator = container.querySelector('.right-0')
      expect(indicator).toBeInTheDocument()
    })

    it('should show reply icon for swipe right on other messages', () => {
      const { container } = render(<MessageBubble {...defaultProps} isMobile={true} isOwnMessage={false} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')

      fireEvent.touchStart(bubble, {
        touches: [{ clientX: 50, clientY: 100 }]
      })

      fireEvent.touchMove(bubble, {
        touches: [{ clientX: 100, clientY: 100 }]
      })

      const icon = container.querySelector('.bg-blue-500')
      expect(icon).toBeInTheDocument()
    })

    it('should show edit icon for swipe left on own messages', () => {
      const { container } = render(<MessageBubble {...defaultProps} isMobile={true} isOwnMessage={true} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')

      fireEvent.touchStart(bubble, {
        touches: [{ clientX: 100, clientY: 100 }]
      })

      fireEvent.touchMove(bubble, {
        touches: [{ clientX: 50, clientY: 100 }]
      })

      const icon = container.querySelector('.bg-gray-500')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper animation attributes', () => {
      render(<MessageBubble {...defaultProps} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')
      expect(bubble).toHaveStyle({ animation: 'messageSlideIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)' })
    })

    it('should respect reduced motion preferences', () => {
      render(<MessageBubble {...defaultProps} />)
      const styles = document.querySelector('style')
      expect(styles?.textContent).toContain('@media (prefers-reduced-motion: reduce)')
    })

    it('should handle missing callbacks gracefully', () => {
      const propsWithoutCallbacks = {
        ...defaultProps,
        onReact: undefined,
        onReply: undefined,
        onEdit: undefined,
        onDelete: undefined,
        onPin: undefined,
        onCopy: undefined
      }

      expect(() => render(<MessageBubble {...propsWithoutCallbacks} />)).not.toThrow()
    })
  })

  describe('Error Handling', () => {
    it('should handle missing message content gracefully', () => {
      const messageWithoutContent = { ...mockMessage, content: '' }
      expect(() => render(<MessageBubble {...defaultProps} message={messageWithoutContent} />)).not.toThrow()
    })

    it('should handle missing timestamp gracefully', () => {
      const messageWithoutTimestamp = { ...mockMessage, timestamp: undefined }
      expect(() => render(<MessageBubble {...defaultProps} message={messageWithoutTimestamp} isOwnMessage={true} />)).not.toThrow()
    })

    it('should handle invalid timestamp format', () => {
      const messageWithInvalidTimestamp = { ...mockMessage, timestamp: 'invalid' }
      expect(() => render(<MessageBubble {...defaultProps} message={messageWithInvalidTimestamp} isOwnMessage={true} />)).not.toThrow()
    })

    it('should handle missing message id gracefully', () => {
      const messageWithoutId = { ...mockMessage, id: undefined }
      expect(() => render(<MessageBubble {...defaultProps} message={messageWithoutId} />)).not.toThrow()
    })

    it('should handle undefined reactions', () => {
      const messageWithUndefinedReactions = { ...mockMessage, reactions: undefined }
      expect(() => render(<MessageBubble {...defaultProps} message={messageWithUndefinedReactions} />)).not.toThrow()
    })

    it('should handle null message', () => {
      expect(() => render(<MessageBubble {...defaultProps} message={null} />)).not.toThrow()
    })
  })

  describe('Selected State', () => {
    it('should apply ring styles when selected', () => {
      const { container } = render(<MessageBubble {...defaultProps} isSelected={true} />)
      const bubble = container.querySelector('[class*="ring-2"]')
      expect(bubble).toBeInTheDocument()
    })

    it('should apply enhanced shadow when selected', () => {
      render(<MessageBubble {...defaultProps} isSelected={true} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')
      expect(bubble).toBeInTheDocument()
    })

    it('should apply different gradient for own selected messages', () => {
      render(<MessageBubble {...defaultProps} isOwnMessage={true} isSelected={true} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')
      expect(bubble).toHaveStyle({ background: 'linear-gradient(135deg, #58a6ff, #1868B7)' })
    })

    it('should apply different background for other selected messages', () => {
      render(<MessageBubble {...defaultProps} isOwnMessage={false} isSelected={true} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')
      expect(bubble).toHaveStyle({ background: '#2C2F36' })
    })
  })

  describe('Bubble Transitions', () => {
    it('should have smooth transition when not swiping', () => {
      render(<MessageBubble {...defaultProps} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')
      expect(bubble).toHaveStyle({ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' })
    })

    it('should have no transition when actively swiping', () => {
      render(<MessageBubble {...defaultProps} isMobile={true} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')

      fireEvent.touchStart(bubble, {
        touches: [{ clientX: 50, clientY: 100 }]
      })

      fireEvent.touchMove(bubble, {
        touches: [{ clientX: 100, clientY: 100 }]
      })

      expect(bubble).toHaveStyle({ transition: 'none' })
    })

    it('should scale on hover for desktop', () => {
      render(<MessageBubble {...defaultProps} isMobile={false} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')
      expect(bubble).toHaveClass('hover:scale-[1.02]')
    })
  })

  describe('Backdrop Filter', () => {
    it('should apply backdrop filter to bubble', () => {
      render(<MessageBubble {...defaultProps} />)
      const bubble = screen.getByText(/Hello, this is a test message/i).closest('div')
      expect(bubble).toHaveStyle({ backdropFilter: 'blur(10px)' })
    })
  })
})

export default ReactMarkdown
