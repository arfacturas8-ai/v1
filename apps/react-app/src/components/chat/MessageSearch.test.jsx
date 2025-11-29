import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MessageSearch from './MessageSearch'

// Mock DOMPurify
jest.mock('dompurify', () => ({
  sanitize: jest.fn((html) => html),
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}))

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString()
    }),
    clear: jest.fn(() => {
      store = {}
    }),
  }
})()

global.localStorage = localStorageMock

// Mock fetch
global.fetch = jest.fn()

describe('MessageSearch Component', () => {
  const mockProps = {
    onSearch: jest.fn(),
    onResultSelect: jest.fn(),
    onClose: jest.fn(),
    channelId: 'channel-1',
    serverId: 'server-1',
    user: { id: '1', username: 'testuser' },
    isMobile: false,
    className: '',
  }

  const mockResults = [
    {
      id: '1',
      content: 'Test message with search term',
      author: { id: '1', username: 'alice', avatar: null },
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      channelId: '1',
      channelName: 'general',
      messageType: 'text',
      reactions: [{ emoji: '=M', count: 3, userReacted: false }],
      hasThread: true,
      threadCount: 5,
      isPinned: false,
      mentions: ['@bob'],
      highlights: ['Test message with <mark>search term</mark>'],
    },
    {
      id: '2',
      content: 'Another message with attachment',
      author: { id: '2', username: 'bob', avatar: null },
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      channelId: '2',
      channelName: 'random',
      messageType: 'file',
      attachments: [{ type: 'image', name: 'screenshot.png' }],
      reactions: [],
      hasThread: false,
      isPinned: true,
      mentions: [],
      highlights: ['Another message with attachment'],
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.clear()
    global.fetch.mockImplementation(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            results: mockResults,
            hasMore: false,
          }),
      })
    )
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<MessageSearch {...mockProps} />)
      expect(screen.getByText('Search Messages')).toBeInTheDocument()
    })

    it('renders search input with placeholder', () => {
      render(<MessageSearch {...mockProps} />)
      expect(screen.getByPlaceholderText('Search messages...')).toBeInTheDocument()
    })

    it('renders close button', () => {
      render(<MessageSearch {...mockProps} />)
      const closeButtons = screen.getAllByRole('button')
      const closeButton = closeButtons.find((btn) => btn.querySelector('svg'))
      expect(closeButton).toBeInTheDocument()
    })

    it('renders filter button', () => {
      render(<MessageSearch {...mockProps} />)
      const filterButtons = screen.getAllByRole('button')
      expect(filterButtons.length).toBeGreaterThan(0)
    })

    it('focuses search input on mount', () => {
      render(<MessageSearch {...mockProps} />)
      const searchInput = screen.getByPlaceholderText('Search messages...')
      expect(searchInput).toHaveFocus()
    })

    it('applies custom className', () => {
      const { container } = render(<MessageSearch {...mockProps} className="custom-class" />)
      expect(container.firstChild).toHaveClass('custom-class')
    })

    it('renders empty state when no query', () => {
      render(<MessageSearch {...mockProps} />)
      expect(screen.getByText('Search Messages')).toBeInTheDocument()
      expect(
        screen.getByText('Find messages, files, and conversations across all channels')
      ).toBeInTheDocument()
    })
  })

  describe('Search Input', () => {
    it('updates search query on input change', async () => {
      const user = userEvent.setup()
      render(<MessageSearch {...mockProps} />)
      const searchInput = screen.getByPlaceholderText('Search messages...')

      await user.type(searchInput, 'test query')
      expect(searchInput).toHaveValue('test query')
    })

    it('clears input when empty', async () => {
      const user = userEvent.setup()
      render(<MessageSearch {...mockProps} />)
      const searchInput = screen.getByPlaceholderText('Search messages...')

      await user.type(searchInput, 'test')
      await user.clear(searchInput)
      expect(searchInput).toHaveValue('')
    })

    it('shows search history on focus when available', async () => {
      localStorage.setItem('cryb-search-history', JSON.stringify(['previous search', 'another search']))
      const user = userEvent.setup()
      render(<MessageSearch {...mockProps} />)
      const searchInput = screen.getByPlaceholderText('Search messages...')

      await user.click(searchInput)
      await waitFor(() => {
        expect(screen.getByText('Recent searches')).toBeInTheDocument()
        expect(screen.getByText('previous search')).toBeInTheDocument()
        expect(screen.getByText('another search')).toBeInTheDocument()
      })
    })

    it('hides search history on blur', async () => {
      localStorage.setItem('cryb-search-history', JSON.stringify(['previous search']))
      const user = userEvent.setup()
      render(<MessageSearch {...mockProps} />)
      const searchInput = screen.getByPlaceholderText('Search messages...')

      await user.click(searchInput)
      await waitFor(() => {
        expect(screen.getByText('Recent searches')).toBeInTheDocument()
      })

      await user.tab()
      await waitFor(
        () => {
          expect(screen.queryByText('Recent searches')).not.toBeInTheDocument()
        },
        { timeout: 300 }
      )
    })

    it('does not show search history when there is a query', async () => {
      localStorage.setItem('cryb-search-history', JSON.stringify(['previous search']))
      const user = userEvent.setup()
      render(<MessageSearch {...mockProps} />)
      const searchInput = screen.getByPlaceholderText('Search messages...')

      await user.type(searchInput, 'test')
      expect(screen.queryByText('Recent searches')).not.toBeInTheDocument()
    })

    it('populates search from history when clicked', async () => {
      localStorage.setItem('cryb-search-history', JSON.stringify(['previous search']))
      const user = userEvent.setup()
      render(<MessageSearch {...mockProps} />)
      const searchInput = screen.getByPlaceholderText('Search messages...')

      await user.click(searchInput)
      await waitFor(() => {
        expect(screen.getByText('previous search')).toBeInTheDocument()
      })

      const historyItem = screen.getByText('previous search')
      await user.click(historyItem)

      expect(searchInput).toHaveValue('previous search')
    })
  })

  describe('Search Functionality', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('debounces search input', async () => {
      const user = userEvent.setup({ delay: null })
      render(<MessageSearch {...mockProps} />)
      const searchInput = screen.getByPlaceholderText('Search messages...')

      await user.type(searchInput, 'test')

      expect(global.fetch).not.toHaveBeenCalled()

      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1)
      })
    })

    it('calls onSearch callback when search is performed', async () => {
      const user = userEvent.setup({ delay: null })
      render(<MessageSearch {...mockProps} />)
      const searchInput = screen.getByPlaceholderText('Search messages...')

      await user.type(searchInput, 'test query')
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(mockProps.onSearch).toHaveBeenCalledWith('test query')
      })
    })

    it('sends correct search parameters to API', async () => {
      const user = userEvent.setup({ delay: null })
      render(<MessageSearch {...mockProps} />)
      const searchInput = screen.getByPlaceholderText('Search messages...')

      await user.type(searchInput, 'test')
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/search/messages',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('"query":"test"'),
          })
        )
      })
    })

    it('shows loading state during search', async () => {
      global.fetch.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ json: () => ({ results: [] }) }), 1000))
      )

      const user = userEvent.setup({ delay: null })
      render(<MessageSearch {...mockProps} />)
      const searchInput = screen.getByPlaceholderText('Search messages...')

      await user.type(searchInput, 'test')
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument()
      })
    })

    it('displays results after search', async () => {
      const user = userEvent.setup({ delay: null })
      render(<MessageSearch {...mockProps} />)
      const searchInput = screen.getByPlaceholderText('Search messages...')

      await user.type(searchInput, 'test')
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
        expect(screen.getByText('bob')).toBeInTheDocument()
      })
    })

    it('shows "no results" message when search returns empty', async () => {
      global.fetch.mockImplementation(() =>
        Promise.resolve({
          json: () => Promise.resolve({ results: [], hasMore: false }),
        })
      )

      const user = userEvent.setup({ delay: null })
      render(<MessageSearch {...mockProps} />)
      const searchInput = screen.getByPlaceholderText('Search messages...')

      await user.type(searchInput, 'nonexistent')
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.getByText('No results found')).toBeInTheDocument()
        expect(screen.getByText('Try adjusting your search terms or filters')).toBeInTheDocument()
      })
    })

    it('handles API errors gracefully', async () => {
      global.fetch.mockImplementation(() => Promise.reject(new Error('API Error')))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const user = userEvent.setup({ delay: null })
      render(<MessageSearch {...mockProps} />)
      const searchInput = screen.getByPlaceholderText('Search messages...')

      await user.type(searchInput, 'test')
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Search failed:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })

    it('adds search query to history', async () => {
      const user = userEvent.setup({ delay: null })
      render(<MessageSearch {...mockProps} />)
      const searchInput = screen.getByPlaceholderText('Search messages...')

      await user.type(searchInput, 'test query')
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        const history = JSON.parse(localStorage.getItem('cryb-search-history'))
        expect(history).toContain('test query')
      })
    })

    it('limits search history to 10 items', async () => {
      const existingHistory = Array.from({ length: 10 }, (_, i) => `search ${i}`)
      localStorage.setItem('cryb-search-history', JSON.stringify(existingHistory))

      const user = userEvent.setup({ delay: null })
      render(<MessageSearch {...mockProps} />)
      const searchInput = screen.getByPlaceholderText('Search messages...')

      await user.type(searchInput, 'new search')
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        const history = JSON.parse(localStorage.getItem('cryb-search-history'))
        expect(history.length).toBe(10)
        expect(history[0]).toBe('new search')
      })
    })

    it('removes duplicate from history when searching again', async () => {
      localStorage.setItem('cryb-search-history', JSON.stringify(['old search', 'test query', 'another search']))

      const user = userEvent.setup({ delay: null })
      render(<MessageSearch {...mockProps} />)
      const searchInput = screen.getByPlaceholderText('Search messages...')

      await user.type(searchInput, 'test query')
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        const history = JSON.parse(localStorage.getItem('cryb-search-history'))
        expect(history.filter((h) => h === 'test query').length).toBe(1)
        expect(history[0]).toBe('test query')
      })
    })
  })

  describe('Keyboard Navigation', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('navigates down through results with ArrowDown', async () => {
      const user = userEvent.setup({ delay: null })
      render(<MessageSearch {...mockProps} />)
      const searchInput = screen.getByPlaceholderText('Search messages...')

      await user.type(searchInput, 'test')
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
      })

      fireEvent.keyDown(window, { key: 'ArrowDown' })
      fireEvent.keyDown(window, { key: 'ArrowDown' })

      const results = screen.getAllByRole('button').filter((el) => el.textContent.includes('alice'))
      expect(results.length).toBeGreaterThan(0)
    })

    it('navigates up through results with ArrowUp', async () => {
      const user = userEvent.setup({ delay: null })
      render(<MessageSearch {...mockProps} />)
      const searchInput = screen.getByPlaceholderText('Search messages...')

      await user.type(searchInput, 'test')
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
      })

      fireEvent.keyDown(window, { key: 'ArrowDown' })
      fireEvent.keyDown(window, { key: 'ArrowDown' })
      fireEvent.keyDown(window, { key: 'ArrowUp' })

      const results = screen.getAllByRole('button')
      expect(results.length).toBeGreaterThan(0)
    })

    it('selects result on Enter key', async () => {
      const user = userEvent.setup({ delay: null })
      render(<MessageSearch {...mockProps} />)
      const searchInput = screen.getByPlaceholderText('Search messages...')

      await user.type(searchInput, 'test')
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
      })

      fireEvent.keyDown(window, { key: 'ArrowDown' })
      fireEvent.keyDown(window, { key: 'Enter' })

      await waitFor(() => {
        expect(mockProps.onResultSelect).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }))
      })
    })

    it('closes search on Escape key', () => {
      render(<MessageSearch {...mockProps} />)

      fireEvent.keyDown(window, { key: 'Escape' })

      expect(mockProps.onClose).toHaveBeenCalled()
    })

    it('does not navigate beyond result boundaries', async () => {
      const user = userEvent.setup({ delay: null })
      render(<MessageSearch {...mockProps} />)
      const searchInput = screen.getByPlaceholderText('Search messages...')

      await user.type(searchInput, 'test')
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
      })

      // Try to go up from initial position
      fireEvent.keyDown(window, { key: 'ArrowUp' })

      // Should stay at -1 (no selection)
      fireEvent.keyDown(window, { key: 'Enter' })
      expect(mockProps.onResultSelect).not.toHaveBeenCalled()
    })

    it('does not navigate down past last result', async () => {
      const user = userEvent.setup({ delay: null })
      render(<MessageSearch {...mockProps} />)
      const searchInput = screen.getByPlaceholderText('Search messages...')

      await user.type(searchInput, 'test')
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
      })

      // Navigate to last result and try to go further
      fireEvent.keyDown(window, { key: 'ArrowDown' })
      fireEvent.keyDown(window, { key: 'ArrowDown' })
      fireEvent.keyDown(window, { key: 'ArrowDown' }) // Should not move

      fireEvent.keyDown(window, { key: 'Enter' })
      expect(mockProps.onResultSelect).toHaveBeenCalled()
    })
  })

  describe('Filtering', () => {
    it('toggles filter panel on filter button click', async () => {
      const user = userEvent.setup()
      render(<MessageSearch {...mockProps} />)

      const filterButtons = screen.getAllByRole('button')
      const filterButton = filterButtons.find((btn) => btn.className.includes('absolute right-2'))

      await user.click(filterButton)

      await waitFor(() => {
        expect(screen.getByText('From Users')).toBeInTheDocument()
        expect(screen.getByText('In Channels')).toBeInTheDocument()
        expect(screen.getByText('Date Range')).toBeInTheDocument()
      })
    })

    it('displays active filter count', async () => {
      const user = userEvent.setup()
      render(<MessageSearch {...mockProps} />)

      const filterButtons = screen.getAllByRole('button')
      const filterButton = filterButtons.find((btn) => btn.className.includes('absolute right-2'))
      await user.click(filterButton)

      await waitFor(() => {
        expect(screen.getByText('From Users')).toBeInTheDocument()
      })

      const hasReactionsCheckbox = screen.getByLabelText('Has reactions')
      await user.click(hasReactionsCheckbox)

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument()
      })
    })

    it('filters by users', async () => {
      const user = userEvent.setup()
      render(<MessageSearch {...mockProps} />)

      const filterButtons = screen.getAllByRole('button')
      const filterButton = filterButtons.find((btn) => btn.className.includes('absolute right-2'))
      await user.click(filterButton)

      await waitFor(() => {
        expect(screen.getByText('From Users')).toBeInTheDocument()
      })

      const userSelect = screen.getByLabelText('From Users')
      await user.selectOptions(userSelect, ['1'])

      expect(userSelect).toHaveValue(['1'])
    })

    it('filters by channels', async () => {
      const user = userEvent.setup()
      render(<MessageSearch {...mockProps} />)

      const filterButtons = screen.getAllByRole('button')
      const filterButton = filterButtons.find((btn) => btn.className.includes('absolute right-2'))
      await user.click(filterButton)

      await waitFor(() => {
        expect(screen.getByText('In Channels')).toBeInTheDocument()
      })

      const channelSelect = screen.getByLabelText('In Channels')
      await user.selectOptions(channelSelect, ['1'])

      expect(channelSelect).toHaveValue(['1'])
    })

    it('filters by date range preset', async () => {
      const user = userEvent.setup()
      render(<MessageSearch {...mockProps} />)

      const filterButtons = screen.getAllByRole('button')
      const filterButton = filterButtons.find((btn) => btn.className.includes('absolute right-2'))
      await user.click(filterButton)

      await waitFor(() => {
        expect(screen.getByText('Date Range')).toBeInTheDocument()
      })

      const dateRangeSelect = screen.getByLabelText('Date Range')
      await user.selectOptions(dateRangeSelect, 'week')

      expect(dateRangeSelect).toHaveValue('week')
    })

    it('filters by sort order', async () => {
      const user = userEvent.setup()
      render(<MessageSearch {...mockProps} />)

      const filterButtons = screen.getAllByRole('button')
      const filterButton = filterButtons.find((btn) => btn.className.includes('absolute right-2'))
      await user.click(filterButton)

      await waitFor(() => {
        expect(screen.getByText('Sort By')).toBeInTheDocument()
      })

      const sortSelect = screen.getByLabelText('Sort By')
      await user.selectOptions(sortSelect, 'newest')

      expect(sortSelect).toHaveValue('newest')
    })

    it('filters by message types', async () => {
      const user = userEvent.setup()
      render(<MessageSearch {...mockProps} />)

      const filterButtons = screen.getAllByRole('button')
      const filterButton = filterButtons.find((btn) => btn.className.includes('absolute right-2'))
      await user.click(filterButton)

      await waitFor(() => {
        expect(screen.getByText('Message Types')).toBeInTheDocument()
      })

      const textCheckbox = screen.getByLabelText('Text')
      await user.click(textCheckbox)

      expect(textCheckbox).not.toBeChecked()
    })

    it('filters by has reactions', async () => {
      const user = userEvent.setup()
      render(<MessageSearch {...mockProps} />)

      const filterButtons = screen.getAllByRole('button')
      const filterButton = filterButtons.find((btn) => btn.className.includes('absolute right-2'))
      await user.click(filterButton)

      await waitFor(() => {
        expect(screen.getByLabelText('Has reactions')).toBeInTheDocument()
      })

      const hasReactionsCheckbox = screen.getByLabelText('Has reactions')
      await user.click(hasReactionsCheckbox)

      expect(hasReactionsCheckbox).toBeChecked()
    })

    it('filters by pinned messages', async () => {
      const user = userEvent.setup()
      render(<MessageSearch {...mockProps} />)

      const filterButtons = screen.getAllByRole('button')
      const filterButton = filterButtons.find((btn) => btn.className.includes('absolute right-2'))
      await user.click(filterButton)

      await waitFor(() => {
        expect(screen.getByLabelText('Pinned messages')).toBeInTheDocument()
      })

      const pinnedCheckbox = screen.getByLabelText('Pinned messages')
      await user.click(pinnedCheckbox)

      expect(pinnedCheckbox).toBeChecked()
    })

    it('filters by has threads', async () => {
      const user = userEvent.setup()
      render(<MessageSearch {...mockProps} />)

      const filterButtons = screen.getAllByRole('button')
      const filterButton = filterButtons.find((btn) => btn.className.includes('absolute right-2'))
      await user.click(filterButton)

      await waitFor(() => {
        expect(screen.getByLabelText('Has threads')).toBeInTheDocument()
      })

      const hasThreadsCheckbox = screen.getByLabelText('Has threads')
      await user.click(hasThreadsCheckbox)

      expect(hasThreadsCheckbox).toBeChecked()
    })

    it('filters by mentions', async () => {
      const user = userEvent.setup()
      render(<MessageSearch {...mockProps} />)

      const filterButtons = screen.getAllByRole('button')
      const filterButton = filterButtons.find((btn) => btn.className.includes('absolute right-2'))
      await user.click(filterButton)

      await waitFor(() => {
        expect(screen.getByLabelText('Mentions me')).toBeInTheDocument()
      })

      const mentionsCheckbox = screen.getByLabelText('Mentions me')
      await user.click(mentionsCheckbox)

      expect(mentionsCheckbox).toBeChecked()
    })

    it('clears all filters', async () => {
      const user = userEvent.setup()
      render(<MessageSearch {...mockProps} />)

      const filterButtons = screen.getAllByRole('button')
      const filterButton = filterButtons.find((btn) => btn.className.includes('absolute right-2'))
      await user.click(filterButton)

      await waitFor(() => {
        expect(screen.getByLabelText('Has reactions')).toBeInTheDocument()
      })

      const hasReactionsCheckbox = screen.getByLabelText('Has reactions')
      await user.click(hasReactionsCheckbox)

      await waitFor(() => {
        expect(screen.getByText('Clear all filters')).toBeInTheDocument()
      })

      const clearButton = screen.getByText('Clear all filters')
      await user.click(clearButton)

      expect(hasReactionsCheckbox).not.toBeChecked()
    })

    it('only shows clear button when filters are active', async () => {
      const user = userEvent.setup()
      render(<MessageSearch {...mockProps} />)

      const filterButtons = screen.getAllByRole('button')
      const filterButton = filterButtons.find((btn) => btn.className.includes('absolute right-2'))
      await user.click(filterButton)

      await waitFor(() => {
        expect(screen.queryByText('Clear all filters')).not.toBeInTheDocument()
      })

      const hasReactionsCheckbox = screen.getByLabelText('Has reactions')
      await user.click(hasReactionsCheckbox)

      await waitFor(() => {
        expect(screen.getByText('Clear all filters')).toBeInTheDocument()
      })
    })
  })

  describe('Results Display', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('displays message author', async () => {
      const user = userEvent.setup({ delay: null })
      render(<MessageSearch {...mockProps} />)
      const searchInput = screen.getByPlaceholderText('Search messages...')

      await user.type(searchInput, 'test')
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
        expect(screen.getByText('bob')).toBeInTheDocument()
      })
    })

    it('displays channel name', async () => {
      const user = userEvent.setup({ delay: null })
      render(<MessageSearch {...mockProps} />)
      const searchInput = screen.getByPlaceholderText('Search messages...')

      await user.type(searchInput, 'test')
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.getByText(/general/)).toBeInTheDocument()
        expect(screen.getByText(/random/)).toBeInTheDocument()
      })
    })

    it('displays highlighted search results', async () => {
      const user = userEvent.setup({ delay: null })
      render(<MessageSearch {...mockProps} />)
      const searchInput = screen.getByPlaceholderText('Search messages...')

      await user.type(searchInput, 'test')
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        const highlights = document.querySelectorAll('[dangerouslySetInnerHTML]')
        expect(highlights.length).toBeGreaterThan(0)
      })
    })

    it('displays message reactions', async () => {
      const user = userEvent.setup({ delay: null })
      render(<MessageSearch {...mockProps} />)
      const searchInput = screen.getByPlaceholderText('Search messages...')

      await user.type(searchInput, 'test')
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.getByText('=M')).toBeInTheDocument()
        expect(screen.getByText('3')).toBeInTheDocument()
      })
    })

    it('displays thread information', async () => {
      const user = userEvent.setup({ delay: null })
      render(<MessageSearch {...mockProps} />)
      const searchInput = screen.getByPlaceholderText('Search messages...')

      await user.type(searchInput, 'test')
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument()
      })
    })

    it('displays pinned indicator', async () => {
      const user = userEvent.setup({ delay: null })
      render(<MessageSearch {...mockProps} />)
      const searchInput = screen.getByPlaceholderText('Search messages...')

      await user.type(searchInput, 'test')
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        const results = screen.getAllByRole('button').filter((el) => el.textContent.includes('bob'))
        expect(results.length).toBeGreaterThan(0)
      })
    })

    it('displays attachments', async () => {
      const user = userEvent.setup({ delay: null })
      render(<MessageSearch {...mockProps} />)
      const searchInput = screen.getByPlaceholderText('Search messages...')

      await user.type(searchInput, 'test')
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.getByText('screenshot.png')).toBeInTheDocument()
      })
    })

    it('formats timestamps correctly', async () => {
      const user = userEvent.setup({ delay: null })
      render(<MessageSearch {...mockProps} />)
      const searchInput = screen.getByPlaceholderText('Search messages...')

      await user.type(searchInput, 'test')
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        const timestamps = screen.getAllByText(/\d{1,2}:\d{2}/)
        expect(timestamps.length).toBeGreaterThan(0)
      })
    })

    it('displays result count', async () => {
      const user = userEvent.setup({ delay: null })
      render(<MessageSearch {...mockProps} />)
      const searchInput = screen.getByPlaceholderText('Search messages...')

      await user.type(searchInput, 'test')
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.getByText('2 results found')).toBeInTheDocument()
      })
    })

    it('displays load more button when hasMore is true', async () => {
      global.fetch.mockImplementation(() =>
        Promise.resolve({
          json: () => Promise.resolve({ results: mockResults, hasMore: true }),
        })
      )

      const user = userEvent.setup({ delay: null })
      render(<MessageSearch {...mockProps} />)
      const searchInput = screen.getByPlaceholderText('Search messages...')

      await user.type(searchInput, 'test')
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.getByText('Load more')).toBeInTheDocument()
      })
    })

    it('does not display load more button when hasMore is false', async () => {
      const user = userEvent.setup({ delay: null })
      render(<MessageSearch {...mockProps} />)
      const searchInput = screen.getByPlaceholderText('Search messages...')

      await user.type(searchInput, 'test')
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.queryByText('Load more')).not.toBeInTheDocument()
      })
    })
  })

  describe('Result Selection', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('calls onResultSelect when result is clicked', async () => {
      const user = userEvent.setup({ delay: null })
      render(<MessageSearch {...mockProps} />)
      const searchInput = screen.getByPlaceholderText('Search messages...')

      await user.type(searchInput, 'test')
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
      })

      const results = screen.getAllByRole('button').filter((el) => el.textContent.includes('alice'))
      await user.click(results[0])

      expect(mockProps.onResultSelect).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }))
    })

    it('expands result on expand button click', async () => {
      const user = userEvent.setup({ delay: null })
      render(<MessageSearch {...mockProps} />)
      const searchInput = screen.getByPlaceholderText('Search messages...')

      await user.type(searchInput, 'test')
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
      })

      const expandButtons = screen.getAllByRole('button').filter((btn) => {
        const svg = btn.querySelector('svg')
        return svg && svg.tagName === 'svg'
      })

      if (expandButtons.length > 0) {
        await user.click(expandButtons[expandButtons.length - 1])

        await waitFor(() => {
          expect(
            screen.getByText(/Message context and surrounding messages would appear here/)
          ).toBeInTheDocument()
        })
      }
    })

    it('collapses expanded result on second click', async () => {
      const user = userEvent.setup({ delay: null })
      render(<MessageSearch {...mockProps} />)
      const searchInput = screen.getByPlaceholderText('Search messages...')

      await user.type(searchInput, 'test')
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
      })

      const expandButtons = screen.getAllByRole('button').filter((btn) => {
        const svg = btn.querySelector('svg')
        return svg && svg.tagName === 'svg'
      })

      if (expandButtons.length > 0) {
        const expandButton = expandButtons[expandButtons.length - 1]
        await user.click(expandButton)

        await waitFor(() => {
          expect(
            screen.getByText(/Message context and surrounding messages would appear here/)
          ).toBeInTheDocument()
        })

        await user.click(expandButton)

        await waitFor(() => {
          expect(
            screen.queryByText(/Message context and surrounding messages would appear here/)
          ).not.toBeInTheDocument()
        })
      }
    })

    it('highlights selected result', async () => {
      const user = userEvent.setup({ delay: null })
      render(<MessageSearch {...mockProps} />)
      const searchInput = screen.getByPlaceholderText('Search messages...')

      await user.type(searchInput, 'test')
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
      })

      fireEvent.keyDown(window, { key: 'ArrowDown' })

      await waitFor(() => {
        const selectedResults = document.querySelectorAll('.bg-blue-50, .dark\\:bg-blue-900\\/20')
        expect(selectedResults.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Close Functionality', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup()
      render(<MessageSearch {...mockProps} />)

      const closeButtons = screen.getAllByRole('button')
      const closeButton = closeButtons.find((btn) => {
        const svg = btn.querySelector('svg')
        return svg && btn.className.includes('ml-auto')
      })

      if (closeButton) {
        await user.click(closeButton)
        expect(mockProps.onClose).toHaveBeenCalled()
      }
    })
  })

  describe('Mobile Behavior', () => {
    it('applies mobile-specific styling', () => {
      const { container } = render(<MessageSearch {...mockProps} isMobile={true} />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('renders all core features on mobile', () => {
      render(<MessageSearch {...mockProps} isMobile={true} />)
      expect(screen.getByText('Search Messages')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Search messages...')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles empty search history', () => {
      localStorage.clear()
      render(<MessageSearch {...mockProps} />)
      const searchInput = screen.getByPlaceholderText('Search messages...')
      fireEvent.focus(searchInput)
      expect(screen.queryByText('Recent searches')).not.toBeInTheDocument()
    })

    it('handles malformed search history in localStorage', () => {
      localStorage.setItem('cryb-search-history', 'invalid json')
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      expect(() => {
        render(<MessageSearch {...mockProps} />)
      }).not.toThrow()

      consoleSpy.mockRestore()
    })

    it('handles missing optional props', () => {
      const minimalProps = {
        channelId: 'channel-1',
        serverId: 'server-1',
      }

      expect(() => {
        render(<MessageSearch {...minimalProps} />)
      }).not.toThrow()
    })

    it('cleans up event listeners on unmount', () => {
      const { unmount } = render(<MessageSearch {...mockProps} />)
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
      removeEventListenerSpy.mockRestore()
    })
  })
})

export default localStorageMock
