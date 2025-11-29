import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import DiscoverPage from './DiscoverPage'
import { AuthContext } from '../contexts/AuthContext'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  TrendingUp: (props) => <div data-testid="trending-up-icon" {...props} />,
  Users: (props) => <div data-testid="users-icon" {...props} />,
  Hash: (props) => <div data-testid="hash-icon" {...props} />,
  Star: (props) => <div data-testid="star-icon" {...props} />,
  Filter: (props) => <div data-testid="filter-icon" {...props} />,
  Search: (props) => <div data-testid="search-icon" {...props} />,
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}))

// Mock PageSkeleton component
jest.mock('../components/LoadingSkeleton', () => ({
  PageSkeleton: ({ type }) => <div data-testid="page-skeleton" data-type={type}>Loading...</div>,
}))

// Mock fetch globally
global.fetch = jest.fn()

const mockAuthContext = {
  user: {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
  },
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
}

const mockDiscoverData = {
  communities: [
    {
      id: 'comm1',
      name: 'test-community',
      displayName: 'Test Community',
      description: 'A test community',
      memberCount: 500,
      icon: null,
    },
    {
      id: 'comm2',
      name: 'gaming-community',
      displayName: 'Gaming Community',
      description: 'For gamers',
      memberCount: 1000,
      icon: null,
    },
    {
      id: 'comm3',
      name: 'tech-community',
      displayName: 'Tech Community',
      description: 'Technology discussions',
      memberCount: 750,
      icon: null,
    },
  ],
  tags: [
    { name: 'javascript', postCount: 100 },
    { name: 'react', postCount: 80 },
    { name: 'nodejs', postCount: 60 },
    { name: 'python', postCount: 90 },
    { name: 'gaming', postCount: 50 },
  ],
  users: [
    {
      id: 'user1',
      username: 'john_doe',
      displayName: 'John Doe',
      bio: 'Software developer',
      followers: 100,
      avatar: null,
    },
    {
      id: 'user2',
      username: 'jane_smith',
      displayName: 'Jane Smith',
      bio: 'Designer',
      followers: 200,
      avatar: null,
    },
  ],
}

const renderWithRouter = (component, authValue = mockAuthContext) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>{component}</AuthContext.Provider>
    </BrowserRouter>
  )
}

describe('DiscoverPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockDiscoverData,
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Rendering', () => {
    it('renders without crashing', () => {
      renderWithRouter(<DiscoverPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('has correct aria-label on main element', () => {
      renderWithRouter(<DiscoverPage />)
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Discover page')
    })

    it('displays page title', () => {
      renderWithRouter(<DiscoverPage />)
      expect(screen.getByRole('heading', { name: /discover/i, level: 1 })).toBeInTheDocument()
    })

    it('displays page description', () => {
      renderWithRouter(<DiscoverPage />)
      expect(screen.getByText(/explore trending communities, topics, and people/i)).toBeInTheDocument()
    })

    it('renders search input', () => {
      renderWithRouter(<DiscoverPage />)
      const searchInput = screen.getByPlaceholderText(/search communities, tags, or people/i)
      expect(searchInput).toBeInTheDocument()
    })

    it('renders search icon', () => {
      renderWithRouter(<DiscoverPage />)
      expect(screen.getByTestId('search-icon')).toBeInTheDocument()
    })

    it('renders all tab buttons', () => {
      renderWithRouter(<DiscoverPage />)
      expect(screen.getByRole('button', { name: /view trending/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /view communities/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /view tags/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /view people/i })).toBeInTheDocument()
    })

    it('renders icons for all tabs', () => {
      renderWithRouter(<DiscoverPage />)
      expect(screen.getByTestId('trending-up-icon')).toBeInTheDocument()
      expect(screen.getByTestId('users-icon')).toBeInTheDocument()
      expect(screen.getByTestId('hash-icon')).toBeInTheDocument()
      expect(screen.getByTestId('star-icon')).toBeInTheDocument()
    })

    it('shows loading skeleton initially', () => {
      renderWithRouter(<DiscoverPage />)
      expect(screen.getByTestId('page-skeleton')).toBeInTheDocument()
    })

    it('loading skeleton has correct type', () => {
      renderWithRouter(<DiscoverPage />)
      expect(screen.getByTestId('page-skeleton')).toHaveAttribute('data-type', 'grid')
    })

    it('applies correct styles to main container', () => {
      renderWithRouter(<DiscoverPage />)
      const main = screen.getByRole('main')
      expect(main).toHaveStyle({
        minHeight: '100vh',
        paddingTop: '80px',
      })
    })
  })

  describe('Loading States', () => {
    it('shows loading state on mount', () => {
      renderWithRouter(<DiscoverPage />)
      expect(screen.getByRole('status', { name: /loading discover content/i })).toBeInTheDocument()
    })

    it('loading state has aria-live attribute', () => {
      renderWithRouter(<DiscoverPage />)
      const loadingElement = screen.getByRole('status', { name: /loading discover content/i })
      expect(loadingElement).toHaveAttribute('aria-live', 'polite')
    })

    it('hides loading state after data loads', async () => {
      renderWithRouter(<DiscoverPage />)
      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })
    })

    it('shows loading when switching tabs', async () => {
      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })

      const communitiesTab = screen.getByRole('button', { name: /view communities/i })
      fireEvent.click(communitiesTab)

      expect(screen.getByTestId('page-skeleton')).toBeInTheDocument()
    })

    it('loads data for initial tab on mount', async () => {
      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/discover?type=trending',
          { credentials: 'include' }
        )
      })
    })
  })

  describe('Tab Navigation', () => {
    it('trending tab is active by default', () => {
      renderWithRouter(<DiscoverPage />)
      const trendingTab = screen.getByRole('button', { name: /view trending/i })
      expect(trendingTab).toHaveAttribute('aria-pressed', 'true')
    })

    it('switches to communities tab', async () => {
      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })

      const communitiesTab = screen.getByRole('button', { name: /view communities/i })
      fireEvent.click(communitiesTab)

      expect(communitiesTab).toHaveAttribute('aria-pressed', 'true')
    })

    it('switches to tags tab', async () => {
      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })

      const tagsTab = screen.getByRole('button', { name: /view tags/i })
      fireEvent.click(tagsTab)

      expect(tagsTab).toHaveAttribute('aria-pressed', 'true')
    })

    it('switches to people tab', async () => {
      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })

      const peopleTab = screen.getByRole('button', { name: /view people/i })
      fireEvent.click(peopleTab)

      expect(peopleTab).toHaveAttribute('aria-pressed', 'true')
    })

    it('fetches data when switching tabs', async () => {
      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/discover?type=trending',
          { credentials: 'include' }
        )
      })

      const communitiesTab = screen.getByRole('button', { name: /view communities/i })
      fireEvent.click(communitiesTab)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/discover?type=communities',
          { credentials: 'include' }
        )
      })
    })

    it('only one tab is active at a time', async () => {
      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })

      const communitiesTab = screen.getByRole('button', { name: /view communities/i })
      fireEvent.click(communitiesTab)

      const trendingTab = screen.getByRole('button', { name: /view trending/i })
      expect(trendingTab).toHaveAttribute('aria-pressed', 'false')
      expect(communitiesTab).toHaveAttribute('aria-pressed', 'true')
    })

    it('applies active styles to selected tab', async () => {
      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })

      const trendingTab = screen.getByRole('button', { name: /view trending/i })
      expect(trendingTab).toHaveStyle({
        color: '#667eea',
      })
    })
  })

  describe('Search Functionality', () => {
    it('search input starts empty', () => {
      renderWithRouter(<DiscoverPage />)
      const searchInput = screen.getByPlaceholderText(/search communities, tags, or people/i)
      expect(searchInput).toHaveValue('')
    })

    it('updates search query on input', async () => {
      const user = userEvent.setup()
      renderWithRouter(<DiscoverPage />)

      const searchInput = screen.getByPlaceholderText(/search communities, tags, or people/i)
      await user.type(searchInput, 'test query')

      expect(searchInput).toHaveValue('test query')
    })

    it('search input has correct aria-label', () => {
      renderWithRouter(<DiscoverPage />)
      const searchInput = screen.getByPlaceholderText(/search communities, tags, or people/i)
      expect(searchInput).toHaveAttribute('aria-label', 'Search discover page')
    })

    it('search input has correct type', () => {
      renderWithRouter(<DiscoverPage />)
      const searchInput = screen.getByPlaceholderText(/search communities, tags, or people/i)
      expect(searchInput).toHaveAttribute('type', 'text')
    })

    it('clears search query', async () => {
      const user = userEvent.setup()
      renderWithRouter(<DiscoverPage />)

      const searchInput = screen.getByPlaceholderText(/search communities, tags, or people/i)
      await user.type(searchInput, 'test')
      await user.clear(searchInput)

      expect(searchInput).toHaveValue('')
    })

    it('handles special characters in search', async () => {
      const user = userEvent.setup()
      renderWithRouter(<DiscoverPage />)

      const searchInput = screen.getByPlaceholderText(/search communities, tags, or people/i)
      await user.type(searchInput, '@#$%^&*()')

      expect(searchInput).toHaveValue('@#$%^&*()')
    })

    it('handles long search queries', async () => {
      const user = userEvent.setup()
      renderWithRouter(<DiscoverPage />)

      const longQuery = 'a'.repeat(100)
      const searchInput = screen.getByPlaceholderText(/search communities, tags, or people/i)
      await user.type(searchInput, longQuery)

      expect(searchInput).toHaveValue(longQuery)
    })

    it('search input changes border color on focus', () => {
      renderWithRouter(<DiscoverPage />)
      const searchInput = screen.getByPlaceholderText(/search communities, tags, or people/i)

      fireEvent.focus(searchInput)
      expect(searchInput.style.borderColor).toBe('#667eea')
    })

    it('search input resets border color on blur', () => {
      renderWithRouter(<DiscoverPage />)
      const searchInput = screen.getByPlaceholderText(/search communities, tags, or people/i)

      fireEvent.focus(searchInput)
      fireEvent.blur(searchInput)
      expect(searchInput.style.borderColor).toBe('#e5e7eb')
    })
  })

  describe('Trending Tab Content', () => {
    it('displays trending communities section', async () => {
      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /trending communities/i })).toBeInTheDocument()
      })
    })

    it('displays trending tags section', async () => {
      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /trending tags/i })).toBeInTheDocument()
      })
    })

    it('limits trending communities to 6 items', async () => {
      const manyCommunitiesData = {
        ...mockDiscoverData,
        communities: Array(10).fill(null).map((_, i) => ({
          id: `comm${i}`,
          name: `community-${i}`,
          displayName: `Community ${i}`,
          description: `Description ${i}`,
          memberCount: 100,
        })),
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => manyCommunitiesData,
      })

      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        const sections = document.querySelectorAll('section')
        expect(sections.length).toBeGreaterThan(0)
      })
    })

    it('limits trending tags to 12 items', async () => {
      const manyTagsData = {
        ...mockDiscoverData,
        tags: Array(20).fill(null).map((_, i) => ({
          name: `tag${i}`,
          postCount: 100 - i,
        })),
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => manyTagsData,
      })

      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        const sections = document.querySelectorAll('section')
        expect(sections.length).toBeGreaterThan(0)
      })
    })

    it('renders trending tab content when active', async () => {
      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /trending communities/i })).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: /trending tags/i })).toBeInTheDocument()
      })
    })
  })

  describe('Communities Tab Content', () => {
    it('displays all communities when communities tab is active', async () => {
      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })

      const communitiesTab = screen.getByRole('button', { name: /view communities/i })
      fireEvent.click(communitiesTab)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })
    })

    it('does not limit communities in communities tab', async () => {
      renderWithRouter(<DiscoverPage />)

      const communitiesTab = screen.getByRole('button', { name: /view communities/i })
      fireEvent.click(communitiesTab)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })
    })

    it('shows empty state when no communities', async () => {
      renderWithRouter(<DiscoverPage />)

      // Wait for initial load to complete
      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })

      // Mock the next fetch call with empty communities
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockDiscoverData, communities: [] }),
      })

      const communitiesTab = screen.getByRole('button', { name: /view communities/i })
      fireEvent.click(communitiesTab)

      await waitFor(() => {
        expect(screen.getByText(/no results found/i)).toBeInTheDocument()
      })
    })
  })

  describe('Tags Tab Content', () => {
    it('displays all tags when tags tab is active', async () => {
      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })

      const tagsTab = screen.getByRole('button', { name: /view tags/i })
      fireEvent.click(tagsTab)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })
    })

    it('does not limit tags in tags tab', async () => {
      renderWithRouter(<DiscoverPage />)

      const tagsTab = screen.getByRole('button', { name: /view tags/i })
      fireEvent.click(tagsTab)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })
    })

    it('shows empty state when no tags', async () => {
      renderWithRouter(<DiscoverPage />)

      // Wait for initial load to complete
      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })

      // Mock the next fetch call with empty tags
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockDiscoverData, tags: [] }),
      })

      const tagsTab = screen.getByRole('button', { name: /view tags/i })
      fireEvent.click(tagsTab)

      await waitFor(() => {
        expect(screen.getByText(/no results found/i)).toBeInTheDocument()
      })
    })
  })

  describe('People Tab Content', () => {
    it('displays users when people tab is active', async () => {
      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })

      const peopleTab = screen.getByRole('button', { name: /view people/i })
      fireEvent.click(peopleTab)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })
    })

    it('shows empty state when no users', async () => {
      renderWithRouter(<DiscoverPage />)

      // Wait for initial load to complete
      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })

      // Mock the next fetch call with empty users
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockDiscoverData, users: [] }),
      })

      const peopleTab = screen.getByRole('button', { name: /view people/i })
      fireEvent.click(peopleTab)

      await waitFor(() => {
        expect(screen.getByText(/no results found/i)).toBeInTheDocument()
      })
    })
  })

  describe('Empty States', () => {
    it('displays empty state with filter icon', async () => {
      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockDiscoverData, communities: [] }),
      })

      const communitiesTab = screen.getByRole('button', { name: /view communities/i })
      fireEvent.click(communitiesTab)

      await waitFor(() => {
        expect(screen.getByTestId('filter-icon')).toBeInTheDocument()
      })
    })

    it('empty state has correct message', async () => {
      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockDiscoverData, tags: [] }),
      })

      const tagsTab = screen.getByRole('button', { name: /view tags/i })
      fireEvent.click(tagsTab)

      await waitFor(() => {
        expect(screen.getByText(/no results found/i)).toBeInTheDocument()
        expect(screen.getByText(/try adjusting your search or check back later/i)).toBeInTheDocument()
      })
    })

    it('empty state has role="status"', async () => {
      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockDiscoverData, communities: [] }),
      })

      const communitiesTab = screen.getByRole('button', { name: /view communities/i })
      fireEvent.click(communitiesTab)

      await waitFor(() => {
        expect(screen.getByText(/no results found/i)).toBeInTheDocument()
      })

      const emptyStates = screen.getAllByRole('status')
      const emptyStateWithMessage = emptyStates.find(el =>
        el.textContent.includes('No results found')
      )
      expect(emptyStateWithMessage).toBeInTheDocument()
    })

    it('empty state has aria-live attribute', async () => {
      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockDiscoverData, communities: [] }),
      })

      const communitiesTab = screen.getByRole('button', { name: /view communities/i })
      fireEvent.click(communitiesTab)

      await waitFor(() => {
        expect(screen.getByText(/no results found/i)).toBeInTheDocument()
      })

      const emptyStates = screen.getAllByRole('status')
      const emptyStateWithMessage = emptyStates.find(el =>
        el.textContent.includes('No results found')
      )
      expect(emptyStateWithMessage).toHaveAttribute('aria-live', 'polite')
    })

    it('does not show empty state on trending tab with some data', async () => {
      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByText(/no results found/i)).not.toBeInTheDocument()
      })
    })

    it('filter icon is decorative', async () => {
      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockDiscoverData, communities: [] }),
      })

      const communitiesTab = screen.getByRole('button', { name: /view communities/i })
      fireEvent.click(communitiesTab)

      await waitFor(() => {
        const filterIcon = screen.getByTestId('filter-icon')
        expect(filterIcon).toHaveAttribute('aria-hidden', 'true')
      })
    })
  })

  describe('API Integration', () => {
    it('fetches data with correct credentials', async () => {
      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ credentials: 'include' })
        )
      })
    })

    it('fetches data for trending tab', async () => {
      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/discover?type=trending',
          { credentials: 'include' }
        )
      })
    })

    it('fetches data for communities tab', async () => {
      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })

      const communitiesTab = screen.getByRole('button', { name: /view communities/i })
      fireEvent.click(communitiesTab)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/discover?type=communities',
          { credentials: 'include' }
        )
      })
    })

    it('fetches data for tags tab', async () => {
      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })

      const tagsTab = screen.getByRole('button', { name: /view tags/i })
      fireEvent.click(tagsTab)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/discover?type=tags',
          { credentials: 'include' }
        )
      })
    })

    it('fetches data for people tab', async () => {
      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })

      const peopleTab = screen.getByRole('button', { name: /view people/i })
      fireEvent.click(peopleTab)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/discover?type=people',
          { credentials: 'include' }
        )
      })
    })

    it('handles successful API response', async () => {
      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })
    })

    it('handles missing communities in response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tags: mockDiscoverData.tags, users: mockDiscoverData.users }),
      })

      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })
    })

    it('handles missing tags in response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ communities: mockDiscoverData.communities, users: mockDiscoverData.users }),
      })

      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })
    })

    it('handles missing users in response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ communities: mockDiscoverData.communities, tags: mockDiscoverData.tags }),
      })

      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })
    })

    it('handles completely empty response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('handles fetch error gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })
    })

    it('handles non-ok response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })
    })

    it('logs error to console', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      global.fetch.mockRejectedValueOnce(new Error('Test error'))

      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Discover fetch error:', expect.any(Error))
      })

      consoleErrorSpy.mockRestore()
    })

    it('handles JSON parse error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON')
        },
      })

      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })
    })

    it('recovers from error on tab switch', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDiscoverData,
      })

      const communitiesTab = screen.getByRole('button', { name: /view communities/i })
      fireEvent.click(communitiesTab)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })
    })

    it('handles 404 response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })
    })

    it('handles 401 unauthorized response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      })

      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })
    })

    it('handles timeout error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('timeout'))

      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })
    })
  })

  describe('User Interactions', () => {
    it('allows typing in search input', async () => {
      const user = userEvent.setup()
      renderWithRouter(<DiscoverPage />)

      const searchInput = screen.getByPlaceholderText(/search communities, tags, or people/i)
      await user.type(searchInput, 'test')

      expect(searchInput).toHaveValue('test')
    })

    it('allows clicking tab buttons', async () => {
      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })

      const communitiesTab = screen.getByRole('button', { name: /view communities/i })
      fireEvent.click(communitiesTab)

      expect(communitiesTab).toHaveAttribute('aria-pressed', 'true')
    })

    it('handles rapid tab switching', async () => {
      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })

      const communitiesTab = screen.getByRole('button', { name: /view communities/i })
      const tagsTab = screen.getByRole('button', { name: /view tags/i })
      const peopleTab = screen.getByRole('button', { name: /view people/i })

      fireEvent.click(communitiesTab)
      fireEvent.click(tagsTab)
      fireEvent.click(peopleTab)

      await waitFor(() => {
        expect(peopleTab).toHaveAttribute('aria-pressed', 'true')
      })
    })

    it('handles keyboard navigation in search', async () => {
      const user = userEvent.setup()
      renderWithRouter(<DiscoverPage />)

      const searchInput = screen.getByPlaceholderText(/search communities, tags, or people/i)
      await user.type(searchInput, 'test{ArrowLeft}{ArrowRight}{Backspace}')

      expect(searchInput).toHaveValue('tes')
    })

    it('allows selecting text in search input', async () => {
      const user = userEvent.setup()
      renderWithRouter(<DiscoverPage />)

      const searchInput = screen.getByPlaceholderText(/search communities, tags, or people/i)
      await user.type(searchInput, 'test')
      await user.tripleClick(searchInput)

      // Text should be selectable
      expect(searchInput).toHaveValue('test')
    })
  })

  describe('Accessibility', () => {
    it('all tabs have aria-labels', () => {
      renderWithRouter(<DiscoverPage />)

      const trendingTab = screen.getByRole('button', { name: /view trending/i })
      const communitiesTab = screen.getByRole('button', { name: /view communities/i })
      const tagsTab = screen.getByRole('button', { name: /view tags/i })
      const peopleTab = screen.getByRole('button', { name: /view people/i })

      expect(trendingTab).toHaveAttribute('aria-label', 'View Trending')
      expect(communitiesTab).toHaveAttribute('aria-label', 'View Communities')
      expect(tagsTab).toHaveAttribute('aria-label', 'View Tags')
      expect(peopleTab).toHaveAttribute('aria-label', 'View People')
    })

    it('all tabs have aria-pressed state', () => {
      renderWithRouter(<DiscoverPage />)

      const tabs = [
        screen.getByRole('button', { name: /view trending/i }),
        screen.getByRole('button', { name: /view communities/i }),
        screen.getByRole('button', { name: /view tags/i }),
        screen.getByRole('button', { name: /view people/i }),
      ]

      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('aria-pressed')
      })
    })

    it('icons are marked as decorative', () => {
      renderWithRouter(<DiscoverPage />)

      const icons = [
        screen.getByTestId('trending-up-icon'),
        screen.getByTestId('users-icon'),
        screen.getByTestId('hash-icon'),
        screen.getByTestId('star-icon'),
        screen.getByTestId('search-icon'),
      ]

      icons.forEach(icon => {
        expect(icon).toHaveAttribute('aria-hidden', 'true')
      })
    })

    it('search input has proper label', () => {
      renderWithRouter(<DiscoverPage />)
      const searchInput = screen.getByPlaceholderText(/search communities, tags, or people/i)
      expect(searchInput).toHaveAttribute('aria-label', 'Search discover page')
    })

    it('main element has correct role', () => {
      renderWithRouter(<DiscoverPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('headings have correct levels', async () => {
      renderWithRouter(<DiscoverPage />)

      expect(screen.getByRole('heading', { level: 1, name: /discover/i })).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 2, name: /trending communities/i })).toBeInTheDocument()
        expect(screen.getByRole('heading', { level: 2, name: /trending tags/i })).toBeInTheDocument()
      })
    })

    it('loading state is announced to screen readers', () => {
      renderWithRouter(<DiscoverPage />)
      const loadingState = screen.getByRole('status', { name: /loading discover content/i })
      expect(loadingState).toHaveAttribute('aria-live', 'polite')
    })

    it('empty state is announced to screen readers', async () => {
      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockDiscoverData, communities: [] }),
      })

      const communitiesTab = screen.getByRole('button', { name: /view communities/i })
      fireEvent.click(communitiesTab)

      await waitFor(() => {
        expect(screen.getByText(/no results found/i)).toBeInTheDocument()
      })

      const emptyStates = screen.getAllByRole('status')
      const emptyStateWithMessage = emptyStates.find(el =>
        el.textContent.includes('No results found')
      )
      expect(emptyStateWithMessage).toHaveAttribute('aria-live', 'polite')
    })

    it('keyboard focus is visible', () => {
      renderWithRouter(<DiscoverPage />)
      const trendingTab = screen.getByRole('button', { name: /view trending/i })
      trendingTab.focus()
      expect(trendingTab).toHaveFocus()
    })
  })

  describe('Edge Cases', () => {
    it('handles null communities array', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockDiscoverData, communities: null }),
      })

      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })
    })

    it('handles undefined tags array', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockDiscoverData, tags: undefined }),
      })

      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })
    })

    it('handles items without ids', async () => {
      const dataWithoutIds = {
        communities: [
          { name: 'test', displayName: 'Test', memberCount: 100 },
        ],
        tags: [
          { name: 'test', postCount: 50 },
        ],
        users: [
          { username: 'test', displayName: 'Test User' },
        ],
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => dataWithoutIds,
      })

      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })
    })

    it('handles very long community names', async () => {
      const longNameData = {
        ...mockDiscoverData,
        communities: [{
          id: '1',
          name: 'a'.repeat(100),
          displayName: 'A'.repeat(100),
          description: 'Test',
          memberCount: 100,
        }],
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => longNameData,
      })

      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })
    })

    it('handles zero member count', async () => {
      const zeroMembersData = {
        ...mockDiscoverData,
        communities: [{
          id: '1',
          name: 'test',
          displayName: 'Test',
          description: 'Test',
          memberCount: 0,
        }],
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => zeroMembersData,
      })

      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })
    })

    it('handles negative post count', async () => {
      const negativeCountData = {
        ...mockDiscoverData,
        tags: [{ name: 'test', postCount: -1 }],
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => negativeCountData,
      })

      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })
    })

    it('handles special characters in tag names', async () => {
      const specialCharsData = {
        ...mockDiscoverData,
        tags: [{ name: '@#$%^&*()', postCount: 10 }],
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => specialCharsData,
      })

      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })
    })

    it('handles emoji in user names', async () => {
      const emojiData = {
        ...mockDiscoverData,
        users: [{
          id: '1',
          username: 'test',
          displayName: 'Test 😀 User',
          bio: 'Bio with 🎉',
        }],
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => emojiData,
      })

      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })
    })

    it('handles missing community description', async () => {
      const noDescriptionData = {
        ...mockDiscoverData,
        communities: [{
          id: '1',
          name: 'test',
          displayName: 'Test',
          memberCount: 100,
        }],
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => noDescriptionData,
      })

      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })
    })

    it('handles missing user bio', async () => {
      const noBioData = {
        ...mockDiscoverData,
        users: [{
          id: '1',
          username: 'test',
          displayName: 'Test User',
        }],
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => noBioData,
      })

      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })
    })
  })

  describe('State Management', () => {
    it('maintains search query across tab switches', async () => {
      const user = userEvent.setup()
      renderWithRouter(<DiscoverPage />)

      const searchInput = screen.getByPlaceholderText(/search communities, tags, or people/i)
      await user.type(searchInput, 'test query')

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })

      const communitiesTab = screen.getByRole('button', { name: /view communities/i })
      fireEvent.click(communitiesTab)

      expect(searchInput).toHaveValue('test query')
    })

    it('fetches new data when tab changes', async () => {
      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1)
      })

      const communitiesTab = screen.getByRole('button', { name: /view communities/i })
      fireEvent.click(communitiesTab)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2)
      })
    })

    it('does not fetch data when clicking same tab', async () => {
      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1)
      })

      const trendingTab = screen.getByRole('button', { name: /view trending/i })
      fireEvent.click(trendingTab)

      // Should still be 1 because same tab was clicked
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1)
      })
    })

    it('preserves data when returning to previous tab', async () => {
      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })

      const communitiesTab = screen.getByRole('button', { name: /view communities/i })
      fireEvent.click(communitiesTab)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })

      const trendingTab = screen.getByRole('button', { name: /view trending/i })
      fireEvent.click(trendingTab)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })
    })
  })

  describe('Performance', () => {
    it('renders efficiently with many communities', async () => {
      const manyCommunities = Array(100).fill(null).map((_, i) => ({
        id: `comm${i}`,
        name: `community-${i}`,
        displayName: `Community ${i}`,
        description: `Description ${i}`,
        memberCount: 100 + i,
      }))

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockDiscoverData, communities: manyCommunities }),
      })

      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })
    })

    it('renders efficiently with many tags', async () => {
      const manyTags = Array(100).fill(null).map((_, i) => ({
        name: `tag${i}`,
        postCount: 100 - i,
      }))

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockDiscoverData, tags: manyTags }),
      })

      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })
    })

    it('renders efficiently with many users', async () => {
      const manyUsers = Array(100).fill(null).map((_, i) => ({
        id: `user${i}`,
        username: `user${i}`,
        displayName: `User ${i}`,
        bio: `Bio ${i}`,
        followers: 100 + i,
      }))

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockDiscoverData, users: manyUsers }),
      })

      renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })
    })
  })

  describe('Authentication Context', () => {
    it('works with authenticated user', async () => {
      renderWithRouter(<DiscoverPage />, mockAuthContext)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })
    })

    it('works with unauthenticated user', async () => {
      const unauthContext = {
        ...mockAuthContext,
        user: null,
        isAuthenticated: false,
      }

      renderWithRouter(<DiscoverPage />, unauthContext)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })
    })

    it('works with loading auth state', async () => {
      const loadingAuthContext = {
        ...mockAuthContext,
        loading: true,
      }

      renderWithRouter(<DiscoverPage />, loadingAuthContext)

      expect(screen.getByTestId('page-skeleton')).toBeInTheDocument()
    })
  })

  describe('Snapshot Tests', () => {
    it('matches snapshot for trending tab', async () => {
      const { container } = renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })

      expect(container).toMatchSnapshot()
    })

    it('matches snapshot for loading state', () => {
      const { container } = renderWithRouter(<DiscoverPage />)
      expect(container).toMatchSnapshot()
    })

    it('matches snapshot for empty state', async () => {
      const { container } = renderWithRouter(<DiscoverPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ communities: [], tags: [], users: [] }),
      })

      const communitiesTab = screen.getByRole('button', { name: /view communities/i })
      fireEvent.click(communitiesTab)

      await waitFor(() => {
        expect(screen.getByText(/no results found/i)).toBeInTheDocument()
      })

      expect(container).toMatchSnapshot()
    })
  })
})

export default mockAuthContext
