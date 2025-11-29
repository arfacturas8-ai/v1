import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import MessageReactions from './MessageReactions'

describe('MessageReactions', () => {
  const mockOnAddReaction = jest.fn()
  const mockOnRemoveReaction = jest.fn()
  const defaultProps = {
    reactions: {},
    onAddReaction: mockOnAddReaction,
    onRemoveReaction: mockOnRemoveReaction,
    currentUserId: 'user-123',
    messageId: 'msg-456'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should not render when there are no reactions and picker is closed', () => {
      const { container } = render(<MessageReactions {...defaultProps} />)
      expect(container.firstChild).toBeNull()
    })

    it('should render with reactions present', () => {
      const props = {
        ...defaultProps,
        reactions: {
          '👍': { count: 2, users: ['user-1', 'user-2'] }
        }
      }
      render(<MessageReactions {...props} />)
      expect(screen.getByText('👍')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('should render multiple reactions', () => {
      const props = {
        ...defaultProps,
        reactions: {
          '👍': { count: 2, users: ['user-1', 'user-2'] },
          '❤️': { count: 3, users: ['user-3', 'user-4', 'user-5'] },
          '😂': { count: 1, users: ['user-6'] }
        }
      }
      render(<MessageReactions {...props} />)
      expect(screen.getByText('👍')).toBeInTheDocument()
      expect(screen.getByText('❤️')).toBeInTheDocument()
      expect(screen.getByText('😂')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const props = {
        ...defaultProps,
        reactions: { '👍': { count: 1, users: ['user-1'] } },
        className: 'custom-class'
      }
      const { container } = render(<MessageReactions {...props} />)
      expect(container.firstChild).toHaveClass('custom-class')
    })

    it('should render add reaction button when reactions exist', () => {
      const props = {
        ...defaultProps,
        reactions: { '👍': { count: 1, users: ['user-1'] } }
      }
      render(<MessageReactions {...props} />)
      expect(screen.getByTitle('Add reaction')).toBeInTheDocument()
    })
  })

  describe('Reaction Display and Sorting', () => {
    it('should sort reactions by count in descending order', () => {
      const props = {
        ...defaultProps,
        reactions: {
          '👍': { count: 2, users: ['user-1', 'user-2'] },
          '❤️': { count: 5, users: ['user-3', 'user-4', 'user-5', 'user-6', 'user-7'] },
          '😂': { count: 3, users: ['user-8', 'user-9', 'user-10'] }
        }
      }
      const { container } = render(<MessageReactions {...props} />)
      const buttons = container.querySelectorAll('button[title*="reacted with"]')
      expect(buttons[0]).toHaveTextContent('❤️')
      expect(buttons[1]).toHaveTextContent('😂')
      expect(buttons[2]).toHaveTextContent('👍')
    })

    it('should filter out reactions with zero count', () => {
      const props = {
        ...defaultProps,
        reactions: {
          '👍': { count: 2, users: ['user-1', 'user-2'] },
          '❤️': { count: 0, users: [] },
          '😂': { count: 1, users: ['user-3'] }
        }
      }
      render(<MessageReactions {...props} />)
      expect(screen.getByText('👍')).toBeInTheDocument()
      expect(screen.queryByText('❤️')).not.toBeInTheDocument()
      expect(screen.getByText('😂')).toBeInTheDocument()
    })

    it('should display reaction count correctly', () => {
      const props = {
        ...defaultProps,
        reactions: {
          '👍': { count: 42, users: Array(42).fill('user') }
        }
      }
      render(<MessageReactions {...props} />)
      expect(screen.getByText('42')).toBeInTheDocument()
    })

    it('should show tooltip with users who reacted', () => {
      const props = {
        ...defaultProps,
        reactions: {
          '👍': { count: 3, users: ['Alice', 'Bob', 'Charlie'] }
        }
      }
      render(<MessageReactions {...props} />)
      const button = screen.getByText('👍').closest('button')
      expect(button).toHaveAttribute('title', 'Alice, Bob, Charlie reacted with 👍')
    })

    it('should handle missing users array gracefully', () => {
      const props = {
        ...defaultProps,
        reactions: {
          '👍': { count: 1 }
        }
      }
      render(<MessageReactions {...props} />)
      expect(screen.getByText('👍')).toBeInTheDocument()
    })
  })

  describe('User Reaction State', () => {
    it('should highlight reactions from current user', () => {
      const props = {
        ...defaultProps,
        reactions: {
          '👍': { count: 2, users: ['user-123', 'user-2'] }
        }
      }
      render(<MessageReactions {...props} />)
      const button = screen.getByText('👍').closest('button')
      expect(button).toHaveClass('bg-accent-cyan/20')
      expect(button).toHaveClass('border-accent-cyan')
    })

    it('should not highlight reactions not from current user', () => {
      const props = {
        ...defaultProps,
        reactions: {
          '👍': { count: 2, users: ['user-1', 'user-2'] }
        }
      }
      render(<MessageReactions {...props} />)
      const button = screen.getByText('👍').closest('button')
      expect(button).toHaveClass('bg-tertiary/50')
      expect(button).not.toHaveClass('bg-accent-cyan/20')
    })

    it('should handle multiple reactions with mixed user states', () => {
      const props = {
        ...defaultProps,
        reactions: {
          '👍': { count: 2, users: ['user-123', 'user-2'] },
          '❤️': { count: 2, users: ['user-3', 'user-4'] }
        }
      }
      render(<MessageReactions {...props} />)
      const thumbsUp = screen.getByText('👍').closest('button')
      const heart = screen.getByText('❤️').closest('button')

      expect(thumbsUp).toHaveClass('bg-accent-cyan/20')
      expect(heart).toHaveClass('bg-tertiary/50')
    })
  })

  describe('Add Reaction Functionality', () => {
    it('should call onAddReaction when clicking unreacted emoji', () => {
      const props = {
        ...defaultProps,
        reactions: {
          '👍': { count: 1, users: ['user-1'] }
        }
      }
      render(<MessageReactions {...props} />)
      const button = screen.getByText('👍').closest('button')
      fireEvent.click(button)

      expect(mockOnAddReaction).toHaveBeenCalledWith('msg-456', '👍')
      expect(mockOnAddReaction).toHaveBeenCalledTimes(1)
    })

    it('should call onAddReaction with correct parameters', () => {
      const props = {
        ...defaultProps,
        reactions: {
          '❤️': { count: 1, users: ['user-1'] }
        }
      }
      render(<MessageReactions {...props} />)
      const button = screen.getByText('❤️').closest('button')
      fireEvent.click(button)

      expect(mockOnAddReaction).toHaveBeenCalledWith('msg-456', '❤️')
    })

    it('should not call onRemoveReaction when adding reaction', () => {
      const props = {
        ...defaultProps,
        reactions: {
          '👍': { count: 1, users: ['user-1'] }
        }
      }
      render(<MessageReactions {...props} />)
      const button = screen.getByText('👍').closest('button')
      fireEvent.click(button)

      expect(mockOnRemoveReaction).not.toHaveBeenCalled()
    })
  })

  describe('Remove Reaction Functionality', () => {
    it('should call onRemoveReaction when clicking own reaction', () => {
      const props = {
        ...defaultProps,
        reactions: {
          '👍': { count: 2, users: ['user-123', 'user-2'] }
        }
      }
      render(<MessageReactions {...props} />)
      const button = screen.getByText('👍').closest('button')
      fireEvent.click(button)

      expect(mockOnRemoveReaction).toHaveBeenCalledWith('msg-456', '👍')
      expect(mockOnRemoveReaction).toHaveBeenCalledTimes(1)
    })

    it('should call onRemoveReaction with correct parameters', () => {
      const props = {
        ...defaultProps,
        currentUserId: 'user-999',
        reactions: {
          '❤️': { count: 1, users: ['user-999'] }
        }
      }
      render(<MessageReactions {...props} />)
      const button = screen.getByText('❤️').closest('button')
      fireEvent.click(button)

      expect(mockOnRemoveReaction).toHaveBeenCalledWith('msg-456', '❤️')
    })

    it('should not call onAddReaction when removing reaction', () => {
      const props = {
        ...defaultProps,
        reactions: {
          '👍': { count: 1, users: ['user-123'] }
        }
      }
      render(<MessageReactions {...props} />)
      const button = screen.getByText('👍').closest('button')
      fireEvent.click(button)

      expect(mockOnAddReaction).not.toHaveBeenCalled()
    })

    it('should handle removing last reaction', () => {
      const props = {
        ...defaultProps,
        reactions: {
          '👍': { count: 1, users: ['user-123'] }
        }
      }
      render(<MessageReactions {...props} />)
      const button = screen.getByText('👍').closest('button')
      fireEvent.click(button)

      expect(mockOnRemoveReaction).toHaveBeenCalledWith('msg-456', '👍')
    })
  })

  describe('Emoji Picker', () => {
    it('should open emoji picker when clicking add button', () => {
      const props = {
        ...defaultProps,
        reactions: { '👍': { count: 1, users: ['user-1'] } }
      }
      render(<MessageReactions {...props} />)
      const addButton = screen.getByTitle('Add reaction')
      fireEvent.click(addButton)

      expect(screen.getByText('More emojis...')).toBeInTheDocument()
    })

    it('should close emoji picker when clicking add button again', () => {
      const props = {
        ...defaultProps,
        reactions: { '👍': { count: 1, users: ['user-1'] } }
      }
      render(<MessageReactions {...props} />)
      const addButton = screen.getByTitle('Add reaction')

      fireEvent.click(addButton)
      expect(screen.getByText('More emojis...')).toBeInTheDocument()

      fireEvent.click(addButton)
      expect(screen.queryByText('More emojis...')).not.toBeInTheDocument()
    })

    it('should display all quick reaction emojis', () => {
      const props = {
        ...defaultProps,
        reactions: { '👍': { count: 1, users: ['user-1'] } }
      }
      render(<MessageReactions {...props} />)
      const addButton = screen.getByTitle('Add reaction')
      fireEvent.click(addButton)

      const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '💯']
      quickReactions.forEach(emoji => {
        expect(screen.getByTitle(`React with ${emoji}`)).toBeInTheDocument()
      })
    })

    it('should close picker when clicking overlay', () => {
      const props = {
        ...defaultProps,
        reactions: { '👍': { count: 1, users: ['user-1'] } }
      }
      const { container } = render(<MessageReactions {...props} />)
      const addButton = screen.getByTitle('Add reaction')
      fireEvent.click(addButton)

      const overlay = container.querySelector('.fixed.inset-0')
      fireEvent.click(overlay)

      expect(screen.queryByText('More emojis...')).not.toBeInTheDocument()
    })

    it('should render X icon when picker is open', () => {
      const props = {
        ...defaultProps,
        reactions: { '👍': { count: 1, users: ['user-1'] } }
      }
      const { container } = render(<MessageReactions {...props} />)
      const addButton = screen.getByTitle('Add reaction')

      fireEvent.click(addButton)
      const xIcon = container.querySelector('[class*="lucide-x"]')
      expect(xIcon).toBeInTheDocument()
    })

    it('should render Plus icon when picker is closed', () => {
      const props = {
        ...defaultProps,
        reactions: { '👍': { count: 1, users: ['user-1'] } }
      }
      const { container } = render(<MessageReactions {...props} />)
      const plusIcon = container.querySelector('[class*="lucide-plus"]')
      expect(plusIcon).toBeInTheDocument()
    })
  })

  describe('Quick Reactions from Picker', () => {
    it('should add reaction when clicking emoji in picker', () => {
      const props = {
        ...defaultProps,
        reactions: { '👍': { count: 1, users: ['user-1'] } }
      }
      render(<MessageReactions {...props} />)
      const addButton = screen.getByTitle('Add reaction')
      fireEvent.click(addButton)

      const heartEmoji = screen.getByTitle('React with ❤️')
      fireEvent.click(heartEmoji)

      expect(mockOnAddReaction).toHaveBeenCalledWith('msg-456', '❤️')
    })

    it('should close picker after selecting emoji', () => {
      const props = {
        ...defaultProps,
        reactions: { '👍': { count: 1, users: ['user-1'] } }
      }
      render(<MessageReactions {...props} />)
      const addButton = screen.getByTitle('Add reaction')
      fireEvent.click(addButton)

      const fireEmoji = screen.getByTitle('React with 🔥')
      fireEvent.click(fireEmoji)

      expect(screen.queryByText('More emojis...')).not.toBeInTheDocument()
    })

    it('should add multiple different reactions from picker', () => {
      const props = {
        ...defaultProps,
        reactions: { '👍': { count: 1, users: ['user-1'] } }
      }
      render(<MessageReactions {...props} />)

      const addButton = screen.getByTitle('Add reaction')

      fireEvent.click(addButton)
      fireEvent.click(screen.getByTitle('React with ❤️'))

      fireEvent.click(addButton)
      fireEvent.click(screen.getByTitle('React with 😂'))

      expect(mockOnAddReaction).toHaveBeenCalledWith('msg-456', '❤️')
      expect(mockOnAddReaction).toHaveBeenCalledWith('msg-456', '😂')
      expect(mockOnAddReaction).toHaveBeenCalledTimes(2)
    })

    it('should handle clicking More emojis button', () => {
      const props = {
        ...defaultProps,
        reactions: { '👍': { count: 1, users: ['user-1'] } }
      }
      render(<MessageReactions {...props} />)
      const addButton = screen.getByTitle('Add reaction')
      fireEvent.click(addButton)

      const moreButton = screen.getByText('More emojis...')
      fireEvent.click(moreButton)

      expect(screen.queryByText('More emojis...')).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty reactions object', () => {
      const { container } = render(<MessageReactions {...defaultProps} reactions={{}} />)
      expect(container.firstChild).toBeNull()
    })

    it('should handle undefined reactions', () => {
      const { container } = render(<MessageReactions {...defaultProps} reactions={undefined} />)
      expect(container.firstChild).toBeNull()
    })

    it('should handle null currentUserId', () => {
      const props = {
        ...defaultProps,
        currentUserId: null,
        reactions: { '👍': { count: 1, users: ['user-1'] } }
      }
      render(<MessageReactions {...props} />)
      expect(screen.getByText('👍')).toBeInTheDocument()
    })

    it('should handle empty users array in reaction data', () => {
      const props = {
        ...defaultProps,
        reactions: {
          '👍': { count: 1, users: [] }
        }
      }
      render(<MessageReactions {...props} />)
      expect(screen.getByText('👍')).toBeInTheDocument()
    })

    it('should handle reaction without users property', () => {
      const props = {
        ...defaultProps,
        reactions: {
          '👍': { count: 2 }
        }
      }
      const { container } = render(<MessageReactions {...props} />)
      const button = screen.getByText('👍').closest('button')
      fireEvent.click(button)

      expect(mockOnAddReaction).toHaveBeenCalledWith('msg-456', '👍')
    })

    it('should handle very long username list', () => {
      const longUserList = Array.from({ length: 100 }, (_, i) => `user-${i}`)
      const props = {
        ...defaultProps,
        reactions: {
          '👍': { count: 100, users: longUserList }
        }
      }
      render(<MessageReactions {...props} />)
      const button = screen.getByText('👍').closest('button')
      expect(button).toHaveAttribute('title')
    })

    it('should handle empty className prop', () => {
      const props = {
        ...defaultProps,
        reactions: { '👍': { count: 1, users: ['user-1'] } },
        className: ''
      }
      const { container } = render(<MessageReactions {...props} />)
      expect(container.firstChild).toHaveClass('flex')
    })

    it('should handle special characters in user IDs', () => {
      const props = {
        ...defaultProps,
        currentUserId: 'user@example.com',
        reactions: {
          '👍': { count: 1, users: ['user@example.com'] }
        }
      }
      render(<MessageReactions {...props} />)
      const button = screen.getByText('👍').closest('button')
      expect(button).toHaveClass('bg-accent-cyan/20')
    })

    it('should handle rapid clicking on reactions', () => {
      const props = {
        ...defaultProps,
        reactions: { '👍': { count: 1, users: ['user-1'] } }
      }
      render(<MessageReactions {...props} />)
      const button = screen.getByText('👍').closest('button')

      fireEvent.click(button)
      fireEvent.click(button)
      fireEvent.click(button)

      expect(mockOnAddReaction).toHaveBeenCalledTimes(3)
    })

    it('should handle emoji picker toggle rapidly', () => {
      const props = {
        ...defaultProps,
        reactions: { '👍': { count: 1, users: ['user-1'] } }
      }
      render(<MessageReactions {...props} />)
      const addButton = screen.getByTitle('Add reaction')

      fireEvent.click(addButton)
      fireEvent.click(addButton)
      fireEvent.click(addButton)

      expect(screen.queryByText('More emojis...')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have accessible button titles for reactions', () => {
      const props = {
        ...defaultProps,
        reactions: {
          '👍': { count: 2, users: ['Alice', 'Bob'] }
        }
      }
      render(<MessageReactions {...props} />)
      const button = screen.getByText('👍').closest('button')
      expect(button).toHaveAttribute('title')
    })

    it('should have accessible title for add reaction button', () => {
      const props = {
        ...defaultProps,
        reactions: { '👍': { count: 1, users: ['user-1'] } }
      }
      render(<MessageReactions {...props} />)
      const addButton = screen.getByTitle('Add reaction')
      expect(addButton).toHaveAttribute('title', 'Add reaction')
    })

    it('should have accessible titles for emoji picker buttons', () => {
      const props = {
        ...defaultProps,
        reactions: { '👍': { count: 1, users: ['user-1'] } }
      }
      render(<MessageReactions {...props} />)
      const addButton = screen.getByTitle('Add reaction')
      fireEvent.click(addButton)

      expect(screen.getByTitle('React with 👍')).toBeInTheDocument()
      expect(screen.getByTitle('React with ❤️')).toBeInTheDocument()
    })
  })

  describe('Component Integration', () => {
    it('should work with different message IDs', () => {
      const props = {
        ...defaultProps,
        messageId: 'different-msg-id',
        reactions: { '👍': { count: 1, users: ['user-1'] } }
      }
      render(<MessageReactions {...props} />)
      const button = screen.getByText('👍').closest('button')
      fireEvent.click(button)

      expect(mockOnAddReaction).toHaveBeenCalledWith('different-msg-id', '👍')
    })

    it('should work with different current user IDs', () => {
      const props = {
        ...defaultProps,
        currentUserId: 'different-user',
        reactions: {
          '👍': { count: 2, users: ['different-user', 'other-user'] }
        }
      }
      render(<MessageReactions {...props} />)
      const button = screen.getByText('👍').closest('button')
      expect(button).toHaveClass('bg-accent-cyan/20')
    })

    it('should maintain picker state across reaction clicks', () => {
      const props = {
        ...defaultProps,
        reactions: { '👍': { count: 1, users: ['user-1'] } }
      }
      render(<MessageReactions {...props} />)

      const addButton = screen.getByTitle('Add reaction')
      fireEvent.click(addButton)
      expect(screen.getByText('More emojis...')).toBeInTheDocument()

      const reactionButton = screen.getByText('👍').closest('button')
      fireEvent.click(reactionButton)

      expect(screen.getByText('More emojis...')).toBeInTheDocument()
    })
  })
})

export default mockOnAddReaction
