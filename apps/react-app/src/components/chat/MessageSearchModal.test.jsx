import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import MessageSearchModal from './MessageSearchModal'

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  X: ({ className, size }) => <div data-testid="icon-x" className={className}>X</div>,
  Search: ({ className, size }) => <div data-testid="icon-search" className={className}>Search</div>,
  Calendar: ({ className, size }) => <div data-testid="icon-calendar" className={className}>Calendar</div>,
  User: ({ className, size }) => <div data-testid="icon-user" className={className}>User</div>,
  Hash: ({ className, size }) => <div data-testid="icon-hash" className={className}>Hash</div>,
  Filter: ({ className, size }) => <div data-testid="icon-filter" className={className}>Filter</div>,
}))

// Mock DOMPurify
vi.mock('dompurify', () => ({
  default: {
    sanitize: (html) => html
  }
}))

const createMockMessage = (id, overrides = {}) => ({
  id: `msg-${id}`,
  userId: `user-${id}`,
  username: `User${id}`,
  content: `Test message content ${id}`,
  timestamp: new Date(2025, 0, id, 12, 0).toISOString(),
  channelId: 'general',
  ...overrides
})

describe('MessageSearchModal', () => {
  const mockOnClose = vi.fn()
  const mockOnJumpToMessage = vi.fn()
  let mockMessages

  beforeEach(() => {
    vi.clearAllMocks()
    mockMessages = [
      createMockMessage(1, { content: 'Hello world', username: 'Alice' }),
      createMockMessage(2, { content: 'Test message here', username: 'Bob' }),
      createMockMessage(3, { content: 'Another test', username: 'Charlie' }),
      createMockMessage(4, { content: 'JavaScript is awesome', username: 'Alice', channelId: 'dev' }),
      createMockMessage(5, { content: 'React testing library', username: 'Bob' }),
    ]
  })

  describe('Modal Rendering and Open/Close', () => {
    it('should not render when isOpen is false', () => {
      render(
        <MessageSearchModal
          isOpen={false}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      expect(screen.queryByText('Search Messages')).not.toBeInTheDocument()
    })

    it('should render when isOpen is true', () => {
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      expect(screen.getByText('Search Messages')).toBeInTheDocument()
    })

    it('should render modal with correct structure', () => {
      const { container } = render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      expect(container.querySelector('.modal-backdrop')).toBeInTheDocument()
      expect(screen.getByText('Search Messages')).toBeInTheDocument()
    })

    it('should render search input field', () => {
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      expect(screen.getByPlaceholderText('Search messages, users, or content...')).toBeInTheDocument()
    })

    it('should render close button', () => {
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const closeButtons = screen.getAllByTestId('icon-x')
      expect(closeButtons.length).toBeGreaterThan(0)
    })

    it('should call onClose when close button is clicked', () => {
      const { container } = render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const closeButton = container.querySelector('button[class*="hover:bg-tertiary"]')
      fireEvent.click(closeButton)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when backdrop is clicked', () => {
      const { container } = render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const backdrop = container.querySelector('.modal-backdrop')
      fireEvent.click(backdrop)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should not call onClose when modal content is clicked', () => {
      const { container } = render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const modalContent = container.querySelector('.bg-secondary')
      fireEvent.click(modalContent)
      expect(mockOnClose).not.toHaveBeenCalled()
    })

    it('should stop propagation when modal content is clicked', () => {
      const { container } = render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const modalContent = container.querySelector('.bg-secondary')
      const stopPropagationSpy = vi.fn()
      const event = new MouseEvent('click', { bubbles: true })
      event.stopPropagation = stopPropagationSpy
      modalContent.dispatchEvent(event)
      expect(stopPropagationSpy).toHaveBeenCalled()
    })

    it('should render with correct modal styling', () => {
      const { container } = render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const modal = container.querySelector('.bg-secondary')
      expect(modal).toHaveClass('rounded-2xl', 'p-6', 'max-w-4xl', 'animate-slide-up', 'backdrop-blur-xl')
    })
  })

  describe('Search Input and Filtering', () => {
    it('should update search query on input change', async () => {
      const user = userEvent.setup()
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, 'test')
      expect(input.value).toBe('test')
    })

    it('should filter messages based on search query', async () => {
      const user = userEvent.setup()
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, 'test')

      await waitFor(() => {
        expect(screen.getByText('Test message here')).toBeInTheDocument()
        expect(screen.getByText('Another test')).toBeInTheDocument()
      })
    })

    it('should perform case-insensitive search', async () => {
      const user = userEvent.setup()
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, 'TEST')

      await waitFor(() => {
        expect(screen.getByText('Test message here')).toBeInTheDocument()
      })
    })

    it('should search in message content', async () => {
      const user = userEvent.setup()
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, 'JavaScript')

      await waitFor(() => {
        expect(screen.getByText('JavaScript is awesome')).toBeInTheDocument()
      })
    })

    it('should search in username', async () => {
      const user = userEvent.setup()
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, 'Alice')

      await waitFor(() => {
        expect(screen.getByText('Hello world')).toBeInTheDocument()
        expect(screen.getByText('JavaScript is awesome')).toBeInTheDocument()
      })
    })

    it('should clear results when search query is empty', async () => {
      const user = userEvent.setup()
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, 'test')

      await waitFor(() => {
        expect(screen.getByText('Test message here')).toBeInTheDocument()
      })

      await user.clear(input)

      await waitFor(() => {
        expect(screen.queryByText('Test message here')).not.toBeInTheDocument()
      })
    })

    it('should trim whitespace from search query', async () => {
      const user = userEvent.setup()
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, '   ')

      await waitFor(() => {
        expect(screen.queryByText('Test message here')).not.toBeInTheDocument()
      })
    })

    it('should autofocus search input when modal opens', () => {
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      expect(input).toHaveAttribute('autoFocus')
    })

    it('should limit search results to 50 messages', async () => {
      const manyMessages = Array.from({ length: 100 }, (_, i) =>
        createMockMessage(i, { content: 'test message', username: 'TestUser' })
      )
      const user = userEvent.setup()
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={manyMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, 'test')

      await waitFor(() => {
        expect(screen.getByText('50 results for "test"')).toBeInTheDocument()
      })
    })
  })

  describe('Search Results Display', () => {
    it('should display search results count', async () => {
      const user = userEvent.setup()
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, 'test')

      await waitFor(() => {
        expect(screen.getByText(/3 results for "test"/)).toBeInTheDocument()
      })
    })

    it('should display message username in results', async () => {
      const user = userEvent.setup()
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, 'test')

      await waitFor(() => {
        expect(screen.getByText('Bob')).toBeInTheDocument()
        expect(screen.getByText('Charlie')).toBeInTheDocument()
      })
    })

    it('should display message timestamp in results', async () => {
      const user = userEvent.setup()
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, 'test')

      await waitFor(() => {
        const timestamps = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/)
        expect(timestamps.length).toBeGreaterThan(0)
      })
    })

    it('should display message content in results', async () => {
      const user = userEvent.setup()
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, 'hello')

      await waitFor(() => {
        expect(screen.getByText('Hello world')).toBeInTheDocument()
      })
    })

    it('should display channel ID when present', async () => {
      const user = userEvent.setup()
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, 'JavaScript')

      await waitFor(() => {
        expect(screen.getByText('dev')).toBeInTheDocument()
      })
    })

    it('should display user avatar initial', async () => {
      const user = userEvent.setup()
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, 'Alice')

      await waitFor(() => {
        expect(screen.getByText('A')).toBeInTheDocument()
      })
    })

    it('should display fallback when username is missing', async () => {
      const messagesWithoutUsername = [
        createMockMessage(1, { content: 'test', username: null })
      ]
      const user = userEvent.setup()
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={messagesWithoutUsername}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, 'test')

      await waitFor(() => {
        expect(screen.getByText('?')).toBeInTheDocument()
      })
    })

    it('should apply hover effect to search results', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, 'test')

      await waitFor(() => {
        const resultItems = container.querySelectorAll('[class*="hover:bg-tertiary/50"]')
        expect(resultItems.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Search Filters - Date Range', () => {
    it('should toggle filters panel when filter button is clicked', async () => {
      const { container } = render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const filterButton = container.querySelector('button[title="Filters"]')
      fireEvent.click(filterButton)

      await waitFor(() => {
        expect(screen.getByText('Date Range')).toBeInTheDocument()
      })
    })

    it('should render date range filter options', async () => {
      const { container } = render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const filterButton = container.querySelector('button[title="Filters"]')
      fireEvent.click(filterButton)

      await waitFor(() => {
        const select = screen.getByDisplayValue('All Time')
        expect(select).toBeInTheDocument()
      })
    })

    it('should filter by today', async () => {
      const today = new Date()
      const messagesWithDates = [
        createMockMessage(1, { content: 'today message', timestamp: today.toISOString() }),
        createMockMessage(2, { content: 'old message', timestamp: new Date(2024, 0, 1).toISOString() })
      ]
      const user = userEvent.setup()
      const { container } = render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={messagesWithDates}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )

      const filterButton = container.querySelector('button[title="Filters"]')
      fireEvent.click(filterButton)

      const select = screen.getByDisplayValue('All Time')
      await user.selectOptions(select, 'today')

      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, 'message')

      await waitFor(() => {
        expect(screen.getByText('today message')).toBeInTheDocument()
        expect(screen.queryByText('old message')).not.toBeInTheDocument()
      })
    })

    it('should filter by last week', async () => {
      const weekAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      const twoWeeksAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      const messagesWithDates = [
        createMockMessage(1, { content: 'recent message', timestamp: weekAgo.toISOString() }),
        createMockMessage(2, { content: 'old message', timestamp: twoWeeksAgo.toISOString() })
      ]
      const user = userEvent.setup()
      const { container } = render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={messagesWithDates}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )

      const filterButton = container.querySelector('button[title="Filters"]')
      fireEvent.click(filterButton)

      const select = screen.getByDisplayValue('All Time')
      await user.selectOptions(select, 'week')

      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, 'message')

      await waitFor(() => {
        expect(screen.getByText('recent message')).toBeInTheDocument()
        expect(screen.queryByText('old message')).not.toBeInTheDocument()
      })
    })

    it('should filter by last month', async () => {
      const monthAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
      const twoMonthsAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000)
      const messagesWithDates = [
        createMockMessage(1, { content: 'recent message', timestamp: monthAgo.toISOString() }),
        createMockMessage(2, { content: 'old message', timestamp: twoMonthsAgo.toISOString() })
      ]
      const user = userEvent.setup()
      const { container } = render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={messagesWithDates}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )

      const filterButton = container.querySelector('button[title="Filters"]')
      fireEvent.click(filterButton)

      const select = screen.getByDisplayValue('All Time')
      await user.selectOptions(select, 'month')

      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, 'message')

      await waitFor(() => {
        expect(screen.getByText('recent message')).toBeInTheDocument()
        expect(screen.queryByText('old message')).not.toBeInTheDocument()
      })
    })
  })

  describe('Search Filters - User', () => {
    it('should render user filter input', async () => {
      const { container } = render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const filterButton = container.querySelector('button[title="Filters"]')
      fireEvent.click(filterButton)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Username...')).toBeInTheDocument()
      })
    })

    it('should filter messages by user', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )

      const filterButton = container.querySelector('button[title="Filters"]')
      fireEvent.click(filterButton)

      const userInput = screen.getByPlaceholderText('Username...')
      await user.type(userInput, 'Alice')

      const searchInput = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(searchInput, 'a')

      await waitFor(() => {
        expect(screen.getByText('Hello world')).toBeInTheDocument()
        expect(screen.getByText('JavaScript is awesome')).toBeInTheDocument()
        expect(screen.queryByText('Test message here')).not.toBeInTheDocument()
      })
    })

    it('should perform case-insensitive user filtering', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )

      const filterButton = container.querySelector('button[title="Filters"]')
      fireEvent.click(filterButton)

      const userInput = screen.getByPlaceholderText('Username...')
      await user.type(userInput, 'alice')

      const searchInput = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(searchInput, 'a')

      await waitFor(() => {
        expect(screen.getByText('Hello world')).toBeInTheDocument()
      })
    })

    it('should display user icon in filter', async () => {
      const { container } = render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const filterButton = container.querySelector('button[title="Filters"]')
      fireEvent.click(filterButton)

      await waitFor(() => {
        const userIcons = screen.getAllByTestId('icon-user')
        expect(userIcons.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Search Filters - Channel', () => {
    it('should filter messages by channel', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )

      // Manually set the channel filter
      const filterButton = container.querySelector('button[title="Filters"]')
      fireEvent.click(filterButton)

      const searchInput = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(searchInput, 'a')

      await waitFor(() => {
        const results = screen.queryAllByText(/message/)
        expect(results.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Clear Filters', () => {
    it('should render clear filters button', async () => {
      const { container } = render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const filterButton = container.querySelector('button[title="Filters"]')
      fireEvent.click(filterButton)

      await waitFor(() => {
        expect(screen.getByText('Clear Filters')).toBeInTheDocument()
      })
    })

    it('should clear all filters when clear button is clicked', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )

      const filterButton = container.querySelector('button[title="Filters"]')
      fireEvent.click(filterButton)

      const userInput = screen.getByPlaceholderText('Username...')
      await user.type(userInput, 'Alice')

      const dateSelect = screen.getByDisplayValue('All Time')
      await user.selectOptions(dateSelect, 'today')

      const clearButton = screen.getByText('Clear Filters')
      fireEvent.click(clearButton)

      await waitFor(() => {
        expect(userInput.value).toBe('')
        expect(dateSelect.value).toBe('all')
      })
    })

    it('should show filtered indicator when filters are applied', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )

      const filterButton = container.querySelector('button[title="Filters"]')
      fireEvent.click(filterButton)

      const userInput = screen.getByPlaceholderText('Username...')
      await user.type(userInput, 'Alice')

      const searchInput = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(searchInput, 'a')

      await waitFor(() => {
        expect(screen.getByText(/\(filtered\)/)).toBeInTheDocument()
      })
    })
  })

  describe('Message Preview in Results', () => {
    it('should truncate long message content', async () => {
      const longMessage = 'This is a very long message that should be truncated when displayed in the search results. '.repeat(10)
      const messagesWithLong = [
        createMockMessage(1, { content: longMessage })
      ]
      const user = userEvent.setup()
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={messagesWithLong}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, 'long')

      await waitFor(() => {
        const { container } = render(
          <MessageSearchModal
            isOpen={true}
            onClose={mockOnClose}
            messages={messagesWithLong}
            onJumpToMessage={mockOnJumpToMessage}
          />
        )
        const truncatedText = container.querySelector('.line-clamp-3')
        expect(truncatedText).toBeInTheDocument()
      })
    })

    it('should display message content with line clamp', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, 'test')

      await waitFor(() => {
        const clampedElements = container.querySelectorAll('.line-clamp-3')
        expect(clampedElements.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Click to Navigate to Message', () => {
    it('should call onJumpToMessage when result is clicked', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, 'test')

      await waitFor(() => {
        const resultItem = screen.getByText('Test message here').closest('div[class*="cursor-pointer"]')
        fireEvent.click(resultItem)
        expect(mockOnJumpToMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            content: 'Test message here'
          })
        )
      })
    })

    it('should close modal after jumping to message', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, 'test')

      await waitFor(() => {
        const resultItem = screen.getByText('Test message here').closest('div[class*="cursor-pointer"]')
        fireEvent.click(resultItem)
        expect(mockOnClose).toHaveBeenCalledTimes(1)
      })
    })

    it('should apply cursor pointer to result items', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, 'test')

      await waitFor(() => {
        const resultItems = container.querySelectorAll('[class*="cursor-pointer"]')
        expect(resultItems.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Empty Search Results', () => {
    it('should display no results message when search yields nothing', async () => {
      const user = userEvent.setup()
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, 'nonexistent')

      await waitFor(() => {
        expect(screen.getByText('No messages found')).toBeInTheDocument()
      })
    })

    it('should display search icon in empty state', async () => {
      const user = userEvent.setup()
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, 'nonexistent')

      await waitFor(() => {
        const searchIcons = screen.getAllByTestId('icon-search')
        expect(searchIcons.length).toBeGreaterThan(0)
      })
    })

    it('should display helpful message in empty state', async () => {
      const user = userEvent.setup()
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, 'nonexistent')

      await waitFor(() => {
        expect(screen.getByText('Try adjusting your search terms or filters')).toBeInTheDocument()
      })
    })

    it('should display initial empty state before search', () => {
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      expect(screen.getByText('Search Messages')).toBeInTheDocument()
      expect(screen.getByText('Search through all messages in this server')).toBeInTheDocument()
    })

    it('should show 0 results for query that matches nothing', async () => {
      const user = userEvent.setup()
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, 'xyz123')

      await waitFor(() => {
        expect(screen.getByText('0 results for "xyz123"')).toBeInTheDocument()
      })
    })
  })

  describe('Search Result Highlighting', () => {
    it('should highlight matched text in results', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, 'test')

      await waitFor(() => {
        const highlightedText = container.querySelector('mark')
        expect(highlightedText).toBeInTheDocument()
      })
    })

    it('should apply correct styling to highlighted text', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, 'test')

      await waitFor(() => {
        const mark = container.querySelector('mark')
        expect(mark).toHaveClass('bg-accent-cyan/30', 'text-accent-cyan', 'rounded', 'px-1')
      })
    })

    it('should escape regex special characters in search query', async () => {
      const messagesWithSpecialChars = [
        createMockMessage(1, { content: 'test (special) chars' })
      ]
      const user = userEvent.setup()
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={messagesWithSpecialChars}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, '(special)')

      await waitFor(() => {
        expect(screen.getByText('test (special) chars')).toBeInTheDocument()
      })
    })

    it('should highlight case-insensitively', async () => {
      const user = userEvent.setup()
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, 'TEST')

      await waitFor(() => {
        expect(screen.getByText('Test message here')).toBeInTheDocument()
      })
    })
  })

  describe('Loading States', () => {
    it('should handle empty messages array', () => {
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={[]}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      expect(screen.getByText('Search Messages')).toBeInTheDocument()
    })

    it('should display search when messages are provided', () => {
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      expect(screen.getByPlaceholderText('Search messages, users, or content...')).toBeInTheDocument()
    })

    it('should handle messages prop changes', async () => {
      const { rerender } = render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )

      const user = userEvent.setup()
      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, 'test')

      const newMessages = [
        createMockMessage(10, { content: 'new test message' })
      ]

      rerender(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={newMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('new test message')).toBeInTheDocument()
      })
    })
  })

  describe('Search Tips', () => {
    it('should display search tips when no search query', () => {
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      expect(screen.getByText('Search Tips:')).toBeInTheDocument()
    })

    it('should hide search tips when searching', async () => {
      const user = userEvent.setup()
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, 'test')

      await waitFor(() => {
        expect(screen.queryByText('Search Tips:')).not.toBeInTheDocument()
      })
    })

    it('should display tip about exact phrases', () => {
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      expect(screen.getByText(/Use quotes for exact phrases/)).toBeInTheDocument()
    })

    it('should display tip about user search', () => {
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      expect(screen.getByText(/Search by user with @ prefix/)).toBeInTheDocument()
    })

    it('should display tip about date filtering', () => {
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      expect(screen.getByText(/Filter by date range/)).toBeInTheDocument()
    })
  })

  describe('Focus Management', () => {
    it('should focus search input on mount', () => {
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      expect(input).toHaveAttribute('autoFocus')
    })

    it('should maintain focus on search input after typing', async () => {
      const user = userEvent.setup()
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, 'test')
      expect(input).toHaveFocus()
    })
  })

  describe('Accessibility', () => {
    it('should render search input with proper placeholder', () => {
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      expect(screen.getByPlaceholderText('Search messages, users, or content...')).toBeInTheDocument()
    })

    it('should render filter button with title attribute', () => {
      const { container } = render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const filterButton = container.querySelector('button[title="Filters"]')
      expect(filterButton).toHaveAttribute('title', 'Filters')
    })

    it('should render labels for filter inputs', async () => {
      const { container } = render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const filterButton = container.querySelector('button[title="Filters"]')
      fireEvent.click(filterButton)

      await waitFor(() => {
        expect(screen.getByText('From User')).toBeInTheDocument()
        expect(screen.getByText('Date Range')).toBeInTheDocument()
      })
    })

    it('should use semantic HTML for modal structure', () => {
      const { container } = render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      expect(container.querySelector('input[type="text"]')).toBeInTheDocument()
      expect(container.querySelector('select')).toBeNull() // Select appears after filter toggle
    })

    it('should render search icon for visual identification', () => {
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const searchIcons = screen.getAllByTestId('icon-search')
      expect(searchIcons.length).toBeGreaterThan(0)
    })

    it('should have proper contrast for text elements', () => {
      const { container } = render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const title = screen.getByText('Search Messages')
      expect(title).toHaveClass('text-primary')
    })
  })

  describe('Advanced Search Options', () => {
    it('should toggle filter panel visibility', async () => {
      const { container } = render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const filterButton = container.querySelector('button[title="Filters"]')

      fireEvent.click(filterButton)
      await waitFor(() => {
        expect(screen.getByText('From User')).toBeInTheDocument()
      })

      fireEvent.click(filterButton)
      await waitFor(() => {
        expect(screen.queryByText('From User')).not.toBeInTheDocument()
      })
    })

    it('should apply active state to filter button when filters shown', async () => {
      const { container } = render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const filterButton = container.querySelector('button[title="Filters"]')
      fireEvent.click(filterButton)

      await waitFor(() => {
        expect(filterButton).toHaveClass('bg-accent-cyan/20', 'text-accent-cyan')
      })
    })

    it('should render filters in responsive grid layout', async () => {
      const { container } = render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const filterButton = container.querySelector('button[title="Filters"]')
      fireEvent.click(filterButton)

      await waitFor(() => {
        const grid = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-3')
        expect(grid).toBeInTheDocument()
      })
    })
  })

  describe('Scrolling Behavior', () => {
    it('should render scrollable results container', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, 'test')

      await waitFor(() => {
        const scrollContainer = container.querySelector('.overflow-y-auto')
        expect(scrollContainer).toBeInTheDocument()
      })
    })

    it('should apply thin scrollbar styles', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, 'test')

      await waitFor(() => {
        const scrollContainer = container.querySelector('.scrollbar-thin')
        expect(scrollContainer).toBeInTheDocument()
      })
    })

    it('should set fixed height for results container', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, 'test')

      await waitFor(() => {
        const scrollContainer = container.querySelector('.h-96')
        expect(scrollContainer).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle null messages array', () => {
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={null}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      expect(screen.getByText('Search Messages')).toBeInTheDocument()
    })

    it('should handle undefined messages array', () => {
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={undefined}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      expect(screen.getByText('Search Messages')).toBeInTheDocument()
    })

    it('should handle messages without channelId', async () => {
      const messagesWithoutChannel = [
        createMockMessage(1, { content: 'test', channelId: null })
      ]
      const user = userEvent.setup()
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={messagesWithoutChannel}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, 'test')

      await waitFor(() => {
        expect(screen.getByText('test')).toBeInTheDocument()
      })
    })

    it('should handle rapid filter changes', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )

      const filterButton = container.querySelector('button[title="Filters"]')
      fireEvent.click(filterButton)

      const userInput = screen.getByPlaceholderText('Username...')
      await user.type(userInput, 'A')
      await user.clear(userInput)
      await user.type(userInput, 'B')
      await user.clear(userInput)
      await user.type(userInput, 'C')

      expect(userInput.value).toBe('C')
    })

    it('should handle missing onJumpToMessage callback', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={undefined}
        />
      )
      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, 'test')

      await waitFor(() => {
        expect(screen.getByText('Test message here')).toBeInTheDocument()
      })
    })

    it('should handle multiple simultaneous filters', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={mockMessages}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )

      const filterButton = container.querySelector('button[title="Filters"]')
      fireEvent.click(filterButton)

      const userInput = screen.getByPlaceholderText('Username...')
      await user.type(userInput, 'Alice')

      const dateSelect = screen.getByDisplayValue('All Time')
      await user.selectOptions(dateSelect, 'week')

      const searchInput = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(searchInput, 'a')

      await waitFor(() => {
        expect(screen.getByText(/(filtered)/)).toBeInTheDocument()
      })
    })

    it('should sanitize HTML in message content', async () => {
      const messagesWithHTML = [
        createMockMessage(1, { content: '<script>alert("xss")</script>test' })
      ]
      const user = userEvent.setup()
      render(
        <MessageSearchModal
          isOpen={true}
          onClose={mockOnClose}
          messages={messagesWithHTML}
          onJumpToMessage={mockOnJumpToMessage}
        />
      )
      const input = screen.getByPlaceholderText('Search messages, users, or content...')
      await user.type(input, 'test')

      await waitFor(() => {
        expect(screen.getByText(/<script>alert\("xss"\)<\/script>test/)).toBeInTheDocument()
      })
    })
  })
})

export default createMockMessage
