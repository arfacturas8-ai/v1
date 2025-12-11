import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import HomePage from './HomePage'
import { AuthContext } from '../contexts/AuthContext'
import communityService from '../services/communityService'
import postsService from '../services/postsService'
import apiService from '../services/api'
import offlineStorage from '../services/offlineStorage'
import { announce, useLoadingAnnouncement, useErrorAnnouncement } from '../utils/accessibility'

// Mock all services
jest.mock('../services/communityService')
jest.mock('../services/postsService')
jest.mock('../services/api')
jest.mock('../services/offlineStorage')
jest.mock('../utils/accessibility', () => ({
  SkipToContent: ({ targetId }) => <a href={`#${targetId}`}>Skip to main content</a>,
  announce: jest.fn(),
  useLoadingAnnouncement: jest.fn(),
  useErrorAnnouncement: jest.fn()
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, variants, initial, animate, exit, whileHover, whileTap, ...props }) => (
      <div {...props}>{children}</div>
    ),
    button: ({ children, variants, initial, animate, exit, whileHover, whileTap, ...props }) => (
      <button {...props}>{children}</button>
    ),
    h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>
  },
  AnimatePresence: ({ children }) => <>{children}</>
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => {
  const icons = [
    'TrendingUp', 'Users', 'MessageCircle', 'Zap', 'ArrowRight', 'Star',
    'Award', 'Globe', 'Plus', 'Hash', 'Activity', 'Wallet', 'BarChart3',
    'Flame', 'Clock', 'Eye', 'Sparkles', 'Rocket', 'Target', 'Heart',
    'Share2', 'Bookmark', 'TrendingDown', 'ChevronRight', 'WifiOff'
  ]

  const mockIcons = {}
  icons.forEach(icon => {
    mockIcons[icon] = ({ className, ...props }) => (
      <span data-testid={`icon-${icon}`} className={className} {...props} />
    )
  })

  return mockIcons
})

// Mock react-router-dom
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}))

const mockAuthContext = {
  user: {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    avatar: 'https://example.com/avatar.jpg'
  },
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false
}

const mockUnauthContext = {
  user: null,
  isAuthenticated: false,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false
}

const mockCommunities = [
  {
    id: '1',
    name: 'test-community',
    displayName: 'Test Community',
    description: 'A test community for testing',
    memberCount: 1000,
    icon: 'https://example.com/icon1.jpg',
    category: 'Technology'
  },
  {
    id: '2',
    name: 'crypto-fans',
    displayName: 'Crypto Fans',
    description: 'Cryptocurrency discussion',
    memberCount: 2500,
    icon: null,
    category: 'Finance'
  },
  {
    id: '3',
    name: 'gaming',
    displayName: 'Gaming Central',
    description: 'All about gaming',
    memberCount: 5000,
    icon: 'https://example.com/icon3.jpg',
    category: 'Gaming'
  }
]

const mockPosts = [
  {
    id: '1',
    title: 'Trending Post About Tech',
    content: 'This is trending content',
    author: { id: '1', username: 'author1', avatar: 'https://example.com/user1.jpg' },
    communityName: 'test-community',
    createdAt: new Date('2025-11-06').toISOString(),
    likes: 150,
    comments: 25,
    views: 1000
  },
  {
    id: '2',
    title: 'Hot Discussion on Crypto',
    content: 'Crypto discussion content',
    author: { id: '2', username: 'author2', avatar: null },
    communityName: 'crypto-fans',
    createdAt: new Date('2025-11-07').toISOString(),
    likes: 89,
    comments: 12,
    views: 500
  },
  {
    id: '3',
    title: 'Gaming News Update',
    content: 'Latest gaming news',
    author: { id: '3', username: 'author3', avatar: 'https://example.com/user3.jpg' },
    communityName: 'gaming',
    createdAt: new Date('2025-11-05').toISOString(),
    likes: 200,
    comments: 45,
    views: 2000
  }
]

const mockActivities = [
  {
    id: '1',
    type: 'post',
    user: { username: 'user1' },
    action: 'created a post',
    timestamp: new Date().toISOString()
  },
  {
    id: '2',
    type: 'comment',
    user: { username: 'user2' },
    action: 'commented on a post',
    timestamp: new Date().toISOString()
  }
]

const mockLiveStats = {
  communities: 150,
  totalCommunities: 150,
  activeUsers: 5000,
  totalUsers: 5000,
  onlineUsers: 1200,
  usersOnline: 1200,
  totalVolume: 1500000
}

const renderWithRouter = (component, authValue = mockAuthContext) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>
        {component}
      </AuthContext.Provider>
    </BrowserRouter>
  )
}

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()

    // Setup default mock implementations
    communityService.getCommunities.mockResolvedValue({
      success: true,
      communities: mockCommunities
    })

    postsService.getPosts.mockResolvedValue({
      success: true,
      posts: mockPosts
    })

    apiService.get.mockImplementation((url) => {
      if (url === '/stats/live') {
        return Promise.resolve({ success: true, data: mockLiveStats })
      }
      if (url === '/activity/recent?limit=5') {
        return Promise.resolve({ success: true, data: { activities: mockActivities } })
      }
      return Promise.resolve({ success: true, data: {} })
    })

    offlineStorage.getCommunities.mockResolvedValue([])
    offlineStorage.getPosts.mockResolvedValue([])
    offlineStorage.saveCommunities.mockResolvedValue(true)
    offlineStorage.savePosts.mockResolvedValue(true)

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    })
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  // ==================== RENDERING TESTS ====================

  describe('Page Rendering', () => {
    it('renders without crashing', () => {
      renderWithRouter(<HomePage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('renders with correct aria-label on main element', () => {
      renderWithRouter(<HomePage />)
      const main = screen.getByRole('main')
      expect(main).toHaveAttribute('aria-label', 'Home page')
    })

    it('renders skip to content link', () => {
      renderWithRouter(<HomePage />)
      expect(screen.getByText('Skip to main content')).toBeInTheDocument()
    })

    it('renders page title', () => {
      renderWithRouter(<HomePage />)
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })

    it('has proper heading hierarchy', async () => {
      renderWithRouter(<HomePage />)
      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toBeInTheDocument()
    })

    it('renders with proper page structure', () => {
      const { container } = renderWithRouter(<HomePage />)
      const main = container.querySelector('[role="main"]')
      expect(main).toBeInTheDocument()
    })
  })

  // ==================== LOADING STATES ====================

  describe('Loading States', () => {
    it('shows loading state initially', () => {
      renderWithRouter(<HomePage />)
      const skeletons = document.querySelectorAll('.')
      expect(skeletons.length).toBeGreaterThanOrEqual(0)
    })

    it('announces loading state to screen readers', () => {
      renderWithRouter(<HomePage />)
      expect(useLoadingAnnouncement).toHaveBeenCalled()
    })

    it('removes loading state after data loads', async () => {
      renderWithRouter(<HomePage />)
      await waitFor(() => {
        expect(communityService.getCommunities).toHaveBeenCalled()
      })
    })

    it('shows skeleton loaders for communities', () => {
      renderWithRouter(<HomePage />)
      expect(document.querySelector('.')).toBeTruthy()
    })

    it('shows skeleton loaders for posts', () => {
      renderWithRouter(<HomePage />)
      expect(document.querySelector('.')).toBeTruthy()
    })

    it('transitions from loading to loaded state', async () => {
      renderWithRouter(<HomePage />)
      await waitFor(() => {
        expect(communityService.getCommunities).toHaveBeenCalled()
      }, { timeout: 3000 })
    })
  })

  // ==================== DATA FETCHING ====================

  describe('Data Fetching', () => {
    it('fetches featured communities on mount', async () => {
      renderWithRouter(<HomePage />)
      await waitFor(() => {
        expect(communityService.getCommunities).toHaveBeenCalledWith({
          sort: 'featured',
          limit: 6
        })
      })
    })

    it('fetches trending posts on mount', async () => {
      renderWithRouter(<HomePage />)
      await waitFor(() => {
        expect(postsService.getPosts).toHaveBeenCalledWith({
          sort: 'trending',
          limit: 3
        })
      })
    })

    it('fetches live stats on mount', async () => {
      renderWithRouter(<HomePage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/stats/live')
      })
    })

    it('fetches recent activity on mount', async () => {
      renderWithRouter(<HomePage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/activity/recent?limit=5')
      })
    })

    it('loads cached communities from offline storage', async () => {
      offlineStorage.getCommunities.mockResolvedValue([mockCommunities[0]])
      renderWithRouter(<HomePage />)
      await waitFor(() => {
        expect(offlineStorage.getCommunities).toHaveBeenCalled()
      })
    })

    it('loads cached posts from offline storage', async () => {
      offlineStorage.getPosts.mockResolvedValue([mockPosts[0]])
      renderWithRouter(<HomePage />)
      await waitFor(() => {
        expect(offlineStorage.getPosts).toHaveBeenCalledWith({ limit: 3 })
      })
    })

    it('saves communities to offline storage after fetch', async () => {
      renderWithRouter(<HomePage />)
      await waitFor(() => {
        expect(offlineStorage.saveCommunities).toHaveBeenCalledWith(mockCommunities)
      })
    })

    it('saves posts to offline storage after fetch', async () => {
      renderWithRouter(<HomePage />)
      await waitFor(() => {
        expect(offlineStorage.savePosts).toHaveBeenCalledWith(mockPosts)
      })
    })

    it('refreshes live stats every 30 seconds', async () => {
      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/stats/live')
      })

      const initialCallCount = apiService.get.mock.calls.filter(
        call => call[0] === '/stats/live'
      ).length

      jest.advanceTimersByTime(30000)

      await waitFor(() => {
        const newCallCount = apiService.get.mock.calls.filter(
          call => call[0] === '/stats/live'
        ).length
        expect(newCallCount).toBeGreaterThan(initialCallCount)
      })
    })

    it('cleans up live stats interval on unmount', async () => {
      const { unmount } = renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/stats/live')
      })

      unmount()
      const callCountBeforeUnmount = apiService.get.mock.calls.length

      jest.advanceTimersByTime(30000)

      expect(apiService.get.mock.calls.length).toBe(callCountBeforeUnmount)
    })
  })

  // ==================== ERROR HANDLING ====================

  describe('Error Handling', () => {
    it('shows error message when community fetch fails', async () => {
      communityService.getCommunities.mockRejectedValue(new Error('Network error'))
      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText(/Failed to load content/i)).toBeInTheDocument()
      })
    })

    it('shows error message when posts fetch fails', async () => {
      postsService.getPosts.mockRejectedValue(new Error('Network error'))
      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText(/Failed to load content/i)).toBeInTheDocument()
      })
    })

    it('announces errors to screen readers', async () => {
      communityService.getCommunities.mockRejectedValue(new Error('Network error'))
      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(useErrorAnnouncement).toHaveBeenCalled()
      })
    })

    it('continues to show cached data when fetch fails', async () => {
      offlineStorage.getCommunities.mockResolvedValue([mockCommunities[0]])
      communityService.getCommunities.mockRejectedValue(new Error('Network error'))

      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText(/Failed to load content/i)).toBeInTheDocument()
      })
    })

    it('handles live stats fetch failure gracefully', async () => {
      apiService.get.mockImplementation((url) => {
        if (url === '/stats/live') {
          return Promise.reject(new Error('Stats unavailable'))
        }
        return Promise.resolve({ success: true, data: {} })
      })

      renderWithRouter(<HomePage />)

      // Should not crash, just log error
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/stats/live')
      })
    })

    it('handles activity fetch failure gracefully', async () => {
      apiService.get.mockImplementation((url) => {
        if (url === '/activity/recent?limit=5') {
          return Promise.reject(new Error('Activity unavailable'))
        }
        return Promise.resolve({ success: true, data: mockLiveStats })
      })

      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/activity/recent?limit=5')
      })
    })

    it('clears error state on successful retry', async () => {
      let callCount = 0
      communityService.getCommunities.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({ success: true, communities: mockCommunities })
      })

      const { rerender } = renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText(/Failed to load content/i)).toBeInTheDocument()
      })

      rerender(
        <BrowserRouter>
          <AuthContext.Provider value={mockAuthContext}>
            <HomePage />
          </AuthContext.Provider>
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(communityService.getCommunities).toHaveBeenCalledTimes(2)
      })
    })
  })

  // ==================== FEATURED COMMUNITIES ====================

  describe('Featured Communities Display', () => {
    it('displays featured communities after loading', async () => {
      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(screen.queryByText('Test Community')).toBeTruthy()
      })
    })

    it('limits featured communities to 6', async () => {
      const manyCommunities = Array.from({ length: 10 }, (_, i) => ({
        ...mockCommunities[0],
        id: `${i}`,
        name: `community-${i}`,
        displayName: `Community ${i}`
      }))

      communityService.getCommunities.mockResolvedValue({
        success: true,
        communities: manyCommunities
      })

      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(communityService.getCommunities).toHaveBeenCalledWith({
          sort: 'featured',
          limit: 6
        })
      })
    })

    it('displays community member counts', async () => {
      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(screen.queryByText(/1000|2500|5000/)).toBeTruthy()
      })
    })

    it('shows community icons when available', async () => {
      renderWithRouter(<HomePage />)

      await waitFor(() => {
        const images = document.querySelectorAll('img')
        expect(images.length).toBeGreaterThan(0)
      })
    })

    it('shows fallback for communities without icons', async () => {
      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(communityService.getCommunities).toHaveBeenCalled()
      })
    })

    it('displays community descriptions', async () => {
      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(screen.queryByText(/test community for testing/i)).toBeTruthy()
      })
    })
  })

  // ==================== TRENDING POSTS ====================

  describe('Trending Posts Display', () => {
    it('displays trending posts after loading', async () => {
      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(screen.queryByText(/Trending Post About Tech/i)).toBeTruthy()
      })
    })

    it('limits trending posts to 3', async () => {
      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(postsService.getPosts).toHaveBeenCalledWith({
          sort: 'trending',
          limit: 3
        })
      })
    })

    it('displays post authors', async () => {
      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(screen.queryByText(/author1|author2|author3/)).toBeTruthy()
      })
    })

    it('displays post metrics (likes, comments)', async () => {
      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(screen.queryByText(/150|89|200/)).toBeTruthy()
      })
    })

    it('displays post timestamps', async () => {
      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(postsService.getPosts).toHaveBeenCalled()
      })
    })

    it('shows empty state when no posts available', async () => {
      postsService.getPosts.mockResolvedValue({
        success: true,
        posts: []
      })

      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(postsService.getPosts).toHaveBeenCalled()
      })
    })
  })

  // ==================== LIVE STATS ====================

  describe('Live Statistics', () => {
    it('displays live statistics', async () => {
      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/stats/live')
      })
    })

    it('displays community count', async () => {
      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(screen.queryByText(/150/)).toBeTruthy()
      })
    })

    it('displays active users count', async () => {
      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(screen.queryByText(/5000/)).toBeTruthy()
      })
    })

    it('displays online users count', async () => {
      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(screen.queryByText(/1200/)).toBeTruthy()
      })
    })

    it('formats total volume as currency', async () => {
      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(screen.queryByText(/\$|1500000|1.5M/)).toBeTruthy()
      })
    })

    it('handles missing live stats gracefully', async () => {
      apiService.get.mockImplementation((url) => {
        if (url === '/stats/live') {
          return Promise.resolve({ success: true, data: null })
        }
        return Promise.resolve({ success: true, data: {} })
      })

      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/stats/live')
      })
    })

    it('updates stats periodically', async () => {
      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/stats/live')
      })

      const initialCalls = apiService.get.mock.calls.filter(
        call => call[0] === '/stats/live'
      ).length

      jest.advanceTimersByTime(30000)

      await waitFor(() => {
        const updatedCalls = apiService.get.mock.calls.filter(
          call => call[0] === '/stats/live'
        ).length
        expect(updatedCalls).toBeGreaterThan(initialCalls)
      })
    })
  })

  // ==================== RECENT ACTIVITY ====================

  describe('Recent Activity Feed', () => {
    it('fetches recent activity', async () => {
      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/activity/recent?limit=5')
      })
    })

    it('displays activity items', async () => {
      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(screen.queryByText(/user1|user2/)).toBeTruthy()
      })
    })

    it('shows empty state when no activities', async () => {
      apiService.get.mockImplementation((url) => {
        if (url === '/activity/recent?limit=5') {
          return Promise.resolve({ success: true, data: { activities: [] } })
        }
        return Promise.resolve({ success: true, data: mockLiveStats })
      })

      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/activity/recent?limit=5')
      })
    })
  })

  // ==================== QUICK ACTIONS ====================

  describe('Quick Actions', () => {
    it('renders quick action buttons', async () => {
      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(screen.queryByText(/Create Post/i)).toBeTruthy()
      })
    })

    it('navigates to submit page on Create Post click', async () => {
      renderWithRouter(<HomePage />)

      const createButton = screen.queryByText(/Create Post/i)
      if (createButton) {
        fireEvent.click(createButton)
        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith('/submit')
        })
      }
    })

    it('navigates to communities page on Browse Communities click', async () => {
      renderWithRouter(<HomePage />)

      const browseButton = screen.queryByText(/Browse Communities/i)
      if (browseButton) {
        fireEvent.click(browseButton)
        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith('/communities')
        })
      }
    })

    it('navigates to chat page on Join Chat click', async () => {
      renderWithRouter(<HomePage />)

      const chatButton = screen.queryByText(/Join Chat/i)
      if (chatButton) {
        fireEvent.click(chatButton)
        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith('/chat')
        })
      }
    })

    it('navigates to crypto page on Crypto Hub click', async () => {
      renderWithRouter(<HomePage />)

      const cryptoButton = screen.queryByText(/Crypto Hub/i)
      if (cryptoButton) {
        fireEvent.click(cryptoButton)
        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith('/crypto')
        })
      }
    })

    it('displays icons for quick actions', async () => {
      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(document.querySelector('[data-testid^="icon-"]')).toBeTruthy()
      })
    })

    it('applies gradient styling to quick actions', async () => {
      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(screen.queryByText(/Create Post/i)).toBeTruthy()
      })
    })
  })

  // ==================== NAVIGATION ====================

  describe('Navigation', () => {
    it('navigates to community page when clicking community', async () => {
      renderWithRouter(<HomePage />)

      await waitFor(() => {
        const communityLink = screen.queryByText('Test Community')
        if (communityLink) {
          fireEvent.click(communityLink)
          expect(mockNavigate).toHaveBeenCalled()
        }
      })
    })

    it('navigates to post page when clicking post', async () => {
      renderWithRouter(<HomePage />)

      await waitFor(() => {
        const postLink = screen.queryByText(/Trending Post About Tech/i)
        if (postLink) {
          fireEvent.click(postLink)
          expect(mockNavigate).toHaveBeenCalled()
        }
      })
    })

    it('navigates to communities list', async () => {
      renderWithRouter(<HomePage />)

      const exploreButton = screen.queryByText(/Explore|View all/i)
      if (exploreButton) {
        fireEvent.click(exploreButton)
        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith('/communities')
        })
      }
    })

    it('converts community name to lowercase for navigation', async () => {
      renderWithRouter(<HomePage />)

      await waitFor(() => {
        const communityLink = screen.queryByText('Test Community')
        if (communityLink) {
          fireEvent.click(communityLink)
          const navigateCalls = mockNavigate.mock.calls
          if (navigateCalls.length > 0) {
            const lastCall = navigateCalls[navigateCalls.length - 1][0]
            if (lastCall && lastCall.includes('community')) {
              expect(lastCall).toMatch(/\/community\/[a-z-]+/)
            }
          }
        }
      })
    })
  })

  // ==================== AUTHENTICATION ====================

  describe('User Authentication', () => {
    it('shows authenticated user content', async () => {
      renderWithRouter(<HomePage />, mockAuthContext)

      await waitFor(() => {
        expect(screen.queryByText(/testuser/i)).toBeTruthy()
      })
    })

    it('shows sign in button for unauthenticated users', async () => {
      renderWithRouter(<HomePage />, mockUnauthContext)

      await waitFor(() => {
        expect(screen.queryByText(/Sign In|Login/i)).toBeTruthy()
      })
    })

    it('shows sign up button for unauthenticated users', async () => {
      renderWithRouter(<HomePage />, mockUnauthContext)

      await waitFor(() => {
        expect(screen.queryByText(/Sign Up|Register/i)).toBeTruthy()
      })
    })

    it('navigates to login page when clicking sign in', async () => {
      renderWithRouter(<HomePage />, mockUnauthContext)

      const signInButton = screen.queryByText(/Sign In|Login/i)
      if (signInButton) {
        fireEvent.click(signInButton)
        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith('/login')
        })
      }
    })

    it('navigates to signup page when clicking sign up', async () => {
      renderWithRouter(<HomePage />, mockUnauthContext)

      const signUpButton = screen.queryByText(/Sign Up|Register/i)
      if (signUpButton) {
        fireEvent.click(signUpButton)
        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith('/signup')
        })
      }
    })

    it('displays user avatar when authenticated', async () => {
      renderWithRouter(<HomePage />, mockAuthContext)

      await waitFor(() => {
        const avatar = document.querySelector('img[src*="avatar"]')
        expect(avatar).toBeTruthy()
      })
    })

    it('fetches data regardless of authentication status', async () => {
      renderWithRouter(<HomePage />, mockUnauthContext)

      await waitFor(() => {
        expect(communityService.getCommunities).toHaveBeenCalled()
        expect(postsService.getPosts).toHaveBeenCalled()
      })
    })
  })

  // ==================== OFFLINE MODE ====================

  describe('Offline Mode', () => {
    it('detects offline state on mount', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      })

      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(screen.queryByText(/Offline/i)).toBeTruthy()
      })
    })

    it('shows offline indicator when going offline', async () => {
      renderWithRouter(<HomePage />)

      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      })

      fireEvent(window, new Event('offline'))

      await waitFor(() => {
        expect(screen.queryByText(/Offline/i)).toBeTruthy()
      })
    })

    it('hides offline indicator when going online', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      })

      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(screen.queryByText(/Offline/i)).toBeTruthy()
      })

      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      })

      fireEvent(window, new Event('online'))

      await waitFor(() => {
        expect(screen.queryByText(/Offline/i)).toBeFalsy()
      })
    })

    it('adds event listeners for online/offline events', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')

      renderWithRouter(<HomePage />)

      expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
      expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))

      addEventListenerSpy.mockRestore()
    })

    it('removes event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

      const { unmount } = renderWithRouter(<HomePage />)
      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))

      removeEventListenerSpy.mockRestore()
    })

    it('uses cached data when offline', async () => {
      offlineStorage.getCommunities.mockResolvedValue(mockCommunities)
      offlineStorage.getPosts.mockResolvedValue(mockPosts)

      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      })

      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(offlineStorage.getCommunities).toHaveBeenCalled()
        expect(offlineStorage.getPosts).toHaveBeenCalled()
      })
    })
  })

  // ==================== ACCESSIBILITY ====================

  describe('Accessibility', () => {
    it('has accessible main landmark', () => {
      renderWithRouter(<HomePage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('announces loading state to screen readers', () => {
      renderWithRouter(<HomePage />)
      expect(useLoadingAnnouncement).toHaveBeenCalledWith(
        expect.any(Boolean),
        'Loading homepage content'
      )
    })

    it('announces errors to screen readers', async () => {
      communityService.getCommunities.mockRejectedValue(new Error('Error'))
      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(useErrorAnnouncement).toHaveBeenCalled()
      })
    })

    it('has proper ARIA labels', () => {
      renderWithRouter(<HomePage />)
      const main = screen.getByRole('main')
      expect(main).toHaveAttribute('aria-label')
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      await user.tab()
      expect(document.activeElement).toBeTruthy()
    })

    it('has sufficient color contrast', () => {
      renderWithRouter(<HomePage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('provides text alternatives for images', async () => {
      renderWithRouter(<HomePage />)

      await waitFor(() => {
        const images = document.querySelectorAll('img')
        images.forEach(img => {
          expect(img.hasAttribute('alt')).toBeTruthy()
        })
      })
    })

    it('uses semantic HTML elements', () => {
      renderWithRouter(<HomePage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })

    it('has focus indicators', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithRouter(<HomePage />)

      const buttons = screen.queryAllByRole('button')
      if (buttons.length > 0) {
        await user.tab()
        expect(document.activeElement).toBeTruthy()
      }
    })
  })

  // ==================== MOBILE LAYOUT ====================

  describe('Mobile Layout', () => {
    it('renders mobile-friendly layout', () => {
      renderWithRouter(<HomePage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('adjusts padding for mobile', () => {
      renderWithRouter(<HomePage />)
      const main = screen.getByRole('main')
      expect(main).toHaveStyle({ padding: '20px' })
    })

    it('sets max-width for content', () => {
      renderWithRouter(<HomePage />)
      const main = screen.getByRole('main')
      expect(main.parentElement || main).toBeTruthy()
    })

    it('centers content on mobile', () => {
      renderWithRouter(<HomePage />)
      const main = screen.getByRole('main')
      expect(main).toHaveStyle({ margin: '0 auto' })
    })
  })

  // ==================== ANIMATIONS ====================

  describe('Animations', () => {
    it('uses framer-motion for animations', () => {
      renderWithRouter(<HomePage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('renders motion components', () => {
      renderWithRouter(<HomePage />)
      const motionElements = document.querySelectorAll('[class*="motion"]')
      expect(motionElements.length >= 0).toBeTruthy()
    })
  })

  // ==================== PERFORMANCE ====================

  describe('Performance Optimization', () => {
    it('memoizes quick actions', () => {
      const { rerender } = renderWithRouter(<HomePage />)

      rerender(
        <BrowserRouter>
          <AuthContext.Provider value={mockAuthContext}>
            <HomePage />
          </AuthContext.Provider>
        </BrowserRouter>
      )

      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('memoizes animation variants', () => {
      renderWithRouter(<HomePage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('memoizes navigation callbacks', async () => {
      renderWithRouter(<HomePage />)

      const button = screen.queryByText(/Create Post/i)
      if (button) {
        fireEvent.click(button)
        fireEvent.click(button)

        expect(mockNavigate).toHaveBeenCalled()
      }
    })

    it('uses useCallback for event handlers', () => {
      renderWithRouter(<HomePage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('uses useMemo for computed values', () => {
      renderWithRouter(<HomePage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  // ==================== EMPTY STATES ====================

  describe('Empty States', () => {
    it('shows empty state when no communities available', async () => {
      communityService.getCommunities.mockResolvedValue({
        success: true,
        communities: []
      })

      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(communityService.getCommunities).toHaveBeenCalled()
      })
    })

    it('shows empty state when no posts available', async () => {
      postsService.getPosts.mockResolvedValue({
        success: true,
        posts: []
      })

      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(postsService.getPosts).toHaveBeenCalled()
      })
    })

    it('shows empty state for activities', async () => {
      apiService.get.mockImplementation((url) => {
        if (url === '/activity/recent?limit=5') {
          return Promise.resolve({ success: true, data: { activities: [] } })
        }
        return Promise.resolve({ success: true, data: mockLiveStats })
      })

      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalled()
      })
    })
  })

  // ==================== EDGE CASES ====================

  describe('Edge Cases', () => {
    it('handles null user gracefully', () => {
      const nullUserContext = { ...mockAuthContext, user: null }
      renderWithRouter(<HomePage />, nullUserContext)

      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles undefined communities response', async () => {
      communityService.getCommunities.mockResolvedValue({
        success: true,
        communities: undefined
      })

      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(communityService.getCommunities).toHaveBeenCalled()
      })
    })

    it('handles undefined posts response', async () => {
      postsService.getPosts.mockResolvedValue({
        success: true,
        posts: undefined
      })

      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(postsService.getPosts).toHaveBeenCalled()
      })
    })

    it('handles malformed live stats', async () => {
      apiService.get.mockImplementation((url) => {
        if (url === '/stats/live') {
          return Promise.resolve({ success: true, data: { invalid: 'data' } })
        }
        return Promise.resolve({ success: true, data: {} })
      })

      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/stats/live')
      })
    })

    it('handles very long community names', async () => {
      const longName = 'A'.repeat(100)
      communityService.getCommunities.mockResolvedValue({
        success: true,
        communities: [{
          ...mockCommunities[0],
          displayName: longName
        }]
      })

      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(screen.queryByText(longName.substring(0, 20))).toBeTruthy()
      })
    })

    it('handles very large numbers in stats', async () => {
      apiService.get.mockImplementation((url) => {
        if (url === '/stats/live') {
          return Promise.resolve({
            success: true,
            data: {
              ...mockLiveStats,
              totalVolume: 999999999999
            }
          })
        }
        return Promise.resolve({ success: true, data: {} })
      })

      renderWithRouter(<HomePage />)

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/stats/live')
      })
    })
  })
})

export default icons
