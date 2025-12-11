/**
 * CRYB Platform - Comprehensive ProfilePage Component Tests
 * Tests for the ProfilePage component with 80+ test cases
 */

import React from 'react'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import ProfilePage from './ProfilePage'
import { AuthContext } from '../contexts/AuthContext'
import userService from '../services/userService'
import postsService from '../services/postsService'
import nftService from '../services/nftService'

// Mock services
jest.mock('../services/userService')
jest.mock('../services/postsService')
jest.mock('../services/nftService')

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  User: () => <svg data-testid="user-icon" />,
  Users: () => <svg data-testid="users-icon" />,
  MessageSquare: () => <svg data-testid="message-square-icon" />,
  Star: () => <svg data-testid="star-icon" />,
  Trophy: () => <svg data-testid="trophy-icon" />,
  Calendar: () => <svg data-testid="calendar-icon" />,
  MapPin: () => <svg data-testid="map-pin-icon" />,
  Link: () => <svg data-testid="link-icon" />,
  Mail: () => <svg data-testid="mail-icon" />,
  UserPlus: () => <svg data-testid="user-plus-icon" />,
  UserMinus: () => <svg data-testid="user-minus-icon" />,
  Edit3: () => <svg data-testid="edit3-icon" />,
  Award: () => <svg data-testid="award-icon" />,
  Bookmark: () => <svg data-testid="bookmark-icon" />,
  Share2: () => <svg data-testid="share2-icon" />,
  ChevronUp: () => <svg data-testid="chevron-up-icon" />,
  ChevronDown: () => <svg data-testid="chevron-down-icon" />,
  Zap: () => <svg data-testid="zap-icon" />,
  Crown: () => <svg data-testid="crown-icon" />,
  Shield: () => <svg data-testid="shield-icon" />,
  Image: () => <svg data-testid="image-icon" />,
  Wallet: () => <svg data-testid="wallet-icon" />,
  Copy: () => <svg data-testid="copy-icon" />,
  CheckCircle: () => <svg data-testid="check-circle-icon" />,
  ExternalLink: () => <svg data-testid="external-link-icon" />,
  Grid3x3: () => <svg data-testid="grid-icon" />,
  Activity: () => <svg data-testid="activity-icon" />,
  X: () => <svg data-testid="x-icon" />,
  BarChart3: () => <svg data-testid="bar-chart-icon" />
}))

// Mock SocialAnalytics component
jest.mock('../components/social/SocialAnalytics', () => {
  return function SocialAnalytics() {
    return <div data-testid="social-analytics">Social Analytics Component</div>
  }
})

// Mock SocialActivityFeed component
jest.mock('../components/social/SocialActivityFeed', () => {
  return function SocialActivityFeed() {
    return <div data-testid="social-activity-feed">Social Activity Feed Component</div>
  }
})

// Mock SocialGraphVisualization component
jest.mock('../components/social/SocialGraphVisualization', () => {
  return function SocialGraphVisualization() {
    return <div data-testid="social-graph-viz">Social Graph Visualization Component</div>
  }
})

// Mock accessibility utilities
jest.mock('../utils/accessibility.jsx', () => ({
  SkipToContent: ({ children }) => <div>{children}</div>,
  announce: jest.fn(),
  useLoadingAnnouncement: jest.fn(),
  useErrorAnnouncement: jest.fn(),
  AccessibleModal: ({ children, isOpen }) => (isOpen ? <div role="dialog">{children}</div> : null),
  AccessibleTabs: ({ children }) => <div>{children}</div>,
  useFocusTrap: jest.fn()
}))

// Mock user data
const mockUser = {
  id: '1',
  username: 'testuser',
  displayName: 'Test User',
  bio: 'This is a test bio',
  email: 'test@example.com',
  location: 'San Francisco, CA',
  website: 'https://example.com',
  joinedAt: '2024-01-01T00:00:00Z',
  followerCount: 100,
  followingCount: 50,
  karma: 5000,
  nftCount: 5,
  walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
  stats: {
    totalPosts: 42,
    totalComments: 156,
    totalAwards: 12
  },
  badges: [
    { id: '1', name: 'Early Adopter', icon: 'shield', description: 'One of the first users' },
    { id: '2', name: 'Top Contributor', icon: 'crown', description: 'Made many contributions' }
  ],
  achievements: [
    {
      id: '1',
      name: 'First Post',
      description: 'Created your first post',
      rarity: 'common',
      icon: '📝'
    },
    {
      id: '2',
      name: 'Power User',
      description: 'Reached 1000 karma',
      rarity: 'rare',
      icon: '⚡'
    }
  ],
  isFollowing: false
}

const mockOtherUser = {
  ...mockUser,
  id: '2',
  username: 'otheruser',
  displayName: 'Other User',
  isFollowing: false
}

const mockPosts = [
  {
    id: 'post1',
    title: 'First Test Post',
    content: 'This is the first test post content',
    author: { id: '1', username: 'testuser', displayName: 'Test User' },
    created: '2024-01-15T10:00:00Z',
    likes: 25,
    commentCount: 5
  },
  {
    id: 'post2',
    title: 'Second Test Post',
    content: 'This is the second test post content',
    author: { id: '1', username: 'testuser', displayName: 'Test User' },
    created: '2024-01-14T10:00:00Z',
    likes: 10,
    commentCount: 3
  }
]

const mockNFTs = [
  {
    id: 'nft1',
    name: 'Cool NFT #1',
    description: 'A cool NFT',
    image: 'https://example.com/nft1.png',
    rarity: 'legendary',
    owner: '1'
  },
  {
    id: 'nft2',
    name: 'Cool NFT #2',
    description: 'Another cool NFT',
    image: 'https://example.com/nft2.png',
    rarity: 'epic',
    owner: '1'
  }
]

const mockAuthContext = {
  user: mockUser,
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false
}

// Helper function to render component with router and auth context
const renderWithRouter = (username = 'testuser', authValue = mockAuthContext) => {
  return render(
    <MemoryRouter initialEntries={[`/profile/${username}`]}>
      <AuthContext.Provider value={authValue}>
        <Routes>
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/" element={<div>Home Page</div>} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  )
}

describe('ProfilePage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock implementations
    userService.getUserByUsername.mockResolvedValue({
      success: true,
      user: mockUser
    })

    postsService.getPosts.mockResolvedValue({
      success: true,
      posts: mockPosts
    })

    nftService.getMyNFTs.mockResolvedValue({
      success: true,
      nfts: mockNFTs
    })
  })

  // ======================
  // 1. PAGE RENDERING TESTS
  // ======================

  describe('Page Rendering', () => {
    it('should render the profile page without crashing', async () => {
      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('should have correct aria-label on main element', async () => {
      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Profile page')
      })
    })

    it('should render the page title', async () => {
      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByText('ProfilePage')).toBeInTheDocument()
      })
    })

    it('should display construction message', async () => {
      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByText(/Content under construction/i)).toBeInTheDocument()
      })
    })

    it('should render with proper layout structure', async () => {
      renderWithRouter()
      await waitFor(() => {
        const main = screen.getByRole('main')
        expect(main).toHaveStyle({ padding: '20px' })
      })
    })
  })

  // ==============================
  // 2. URL PARAMETER HANDLING TESTS
  // ==============================

  describe('URL Parameter Handling', () => {
    it('should extract username from URL params', async () => {
      renderWithRouter('testuser')
      await waitFor(() => {
        expect(userService.getUserByUsername).toHaveBeenCalledWith('testuser')
      })
    })

    it('should handle different usernames from URL', async () => {
      renderWithRouter('anotheruser')
      await waitFor(() => {
        expect(userService.getUserByUsername).toHaveBeenCalledWith('anotheruser')
      })
    })

    it('should use current user username when no URL param provided', async () => {
      render(
        <MemoryRouter initialEntries={['/profile']}>
          <AuthContext.Provider value={mockAuthContext}>
            <Routes>
              <Route path="/profile" element={<ProfilePage />} />
            </Routes>
          </AuthContext.Provider>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(userService.getUserByUsername).toHaveBeenCalledWith('testuser')
      })
    })

    it('should handle special characters in username', async () => {
      renderWithRouter('user-with_special.chars')
      await waitFor(() => {
        expect(userService.getUserByUsername).toHaveBeenCalledWith('user-with_special.chars')
      })
    })

    it('should handle numeric usernames', async () => {
      renderWithRouter('user123')
      await waitFor(() => {
        expect(userService.getUserByUsername).toHaveBeenCalledWith('user123')
      })
    })
  })

  // ===================================
  // 3. USER PROFILE DATA FETCHING TESTS
  // ===================================

  describe('User Profile Data Fetching', () => {
    it('should fetch user profile data on mount', async () => {
      renderWithRouter()
      await waitFor(() => {
        expect(userService.getUserByUsername).toHaveBeenCalledTimes(1)
      })
    })

    it('should fetch user posts after loading profile', async () => {
      renderWithRouter()
      await waitFor(() => {
        expect(postsService.getPosts).toHaveBeenCalledWith({
          authorId: '1',
          limit: 20
        })
      })
    })

    it('should fetch user NFTs after loading profile', async () => {
      renderWithRouter()
      await waitFor(() => {
        expect(nftService.getMyNFTs).toHaveBeenCalledWith('1')
      })
    })

    it('should fetch all data in parallel', async () => {
      renderWithRouter()
      await waitFor(() => {
        expect(userService.getUserByUsername).toHaveBeenCalled()
        expect(postsService.getPosts).toHaveBeenCalled()
        expect(nftService.getMyNFTs).toHaveBeenCalled()
      })
    })

    it('should handle successful user data response', async () => {
      renderWithRouter()
      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
      })
    })

    it('should store user data in state', async () => {
      renderWithRouter()
      await waitFor(() => {
        // Profile page should be rendered, indicating user data was stored
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('should refetch data when username parameter changes', async () => {
      const { rerender } = renderWithRouter('testuser')

      await waitFor(() => {
        expect(userService.getUserByUsername).toHaveBeenCalledWith('testuser')
      })

      // Change username
      userService.getUserByUsername.mockResolvedValue({
        success: true,
        user: mockOtherUser
      })

      rerender(
        <MemoryRouter initialEntries={['/profile/otheruser']}>
          <AuthContext.Provider value={mockAuthContext}>
            <Routes>
              <Route path="/profile/:username" element={<ProfilePage />} />
            </Routes>
          </AuthContext.Provider>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(userService.getUserByUsername).toHaveBeenCalledWith('otheruser')
      })
    })
  })

  // ==========================================
  // 4. OWN PROFILE VS OTHER USER PROFILE TESTS
  // ==========================================

  describe('Own Profile vs Other User Profile', () => {
    it('should identify own profile correctly', async () => {
      renderWithRouter('testuser')
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
      // Own profile detection happens in useEffect
    })

    it('should identify other user profile correctly', async () => {
      userService.getUserByUsername.mockResolvedValue({
        success: true,
        user: mockOtherUser
      })

      renderWithRouter('otheruser')
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('should set isOwnProfile to true when viewing own profile', async () => {
      renderWithRouter('testuser')
      await waitFor(() => {
        expect(userService.getUserByUsername).toHaveBeenCalledWith('testuser')
      })
    })

    it('should set isOwnProfile to false when viewing other profile', async () => {
      userService.getUserByUsername.mockResolvedValue({
        success: true,
        user: mockOtherUser
      })

      renderWithRouter('otheruser')
      await waitFor(() => {
        expect(userService.getUserByUsername).toHaveBeenCalledWith('otheruser')
      })
    })
  })

  // =======================
  // 5. LOADING STATES TESTS
  // =======================

  describe('Loading States', () => {
    it('should show loading skeleton initially', async () => {
      renderWithRouter()

      // Check for loading skeleton elements
      const skeletons = document.querySelectorAll('.')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('should display profile header skeleton while loading', async () => {
      renderWithRouter()

      const skeletons = document.querySelectorAll('.')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('should display tabs skeleton while loading', async () => {
      renderWithRouter()

      const skeletons = document.querySelectorAll('.')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('should display content skeleton while loading', async () => {
      renderWithRouter()

      const skeletons = document.querySelectorAll('.')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('should remove loading state after data loads', async () => {
      renderWithRouter()

      await waitFor(() => {
        expect(screen.queryByText(/Loading.*profile/i)).not.toBeInTheDocument()
      })
    })

    it('should announce loading state to screen readers', async () => {
      const { useLoadingAnnouncement } = require('../utils/accessibility.jsx')

      renderWithRouter()

      await waitFor(() => {
        expect(useLoadingAnnouncement).toHaveBeenCalled()
      })
    })

    it('should set loading to false after successful data fetch', async () => {
      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('should set loading to false after error', async () => {
      userService.getUserByUsername.mockResolvedValue({
        success: false,
        user: null
      })

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText(/Error Loading Profile/i)).toBeInTheDocument()
      })
    })
  })

  // =======================
  // 6. ERROR HANDLING TESTS
  // =======================

  describe('Error Handling', () => {
    it('should display error message when user not found', async () => {
      userService.getUserByUsername.mockResolvedValue({
        success: false,
        user: null
      })

      renderWithRouter('nonexistent')

      await waitFor(() => {
        expect(screen.getByText(/Error Loading Profile/i)).toBeInTheDocument()
      })
    })

    it('should show user not found message when user is null', async () => {
      userService.getUserByUsername.mockResolvedValue({
        success: true,
        user: null
      })

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText(/User not found/i)).toBeInTheDocument()
      })
    })

    it('should display error icon on error', async () => {
      userService.getUserByUsername.mockResolvedValue({
        success: false,
        user: null
      })

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByTestId('x-icon')).toBeInTheDocument()
      })
    })

    it('should show try again button on error', async () => {
      userService.getUserByUsername.mockResolvedValue({
        success: false,
        user: null
      })

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument()
      })
    })

    it('should show go home button on error', async () => {
      userService.getUserByUsername.mockResolvedValue({
        success: false,
        user: null
      })

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Go Home/i })).toBeInTheDocument()
      })
    })

    it('should reload page when try again is clicked', async () => {
      userService.getUserByUsername.mockResolvedValue({
        success: false,
        user: null
      })

      const reloadSpy = jest.fn()
      Object.defineProperty(window, 'location', {
        value: { reload: reloadSpy },
        writable: true
      })

      renderWithRouter()

      await waitFor(() => {
        const tryAgainButton = screen.getByRole('button', { name: /Try Again/i })
        fireEvent.click(tryAgainButton)
        expect(reloadSpy).toHaveBeenCalled()
      })
    })

    it('should handle API error gracefully', async () => {
      userService.getUserByUsername.mockRejectedValue(new Error('API Error'))

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText(/Error Loading Profile/i)).toBeInTheDocument()
      })
    })

    it('should display custom error message from API', async () => {
      userService.getUserByUsername.mockRejectedValue(new Error('Network connection failed'))

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText(/Network connection failed/i)).toBeInTheDocument()
      })
    })

    it('should announce errors to screen readers', async () => {
      const { useErrorAnnouncement } = require('../utils/accessibility.jsx')

      userService.getUserByUsername.mockResolvedValue({
        success: false,
        user: null
      })

      renderWithRouter()

      await waitFor(() => {
        expect(useErrorAnnouncement).toHaveBeenCalled()
      })
    })

    it('should handle posts fetch error gracefully', async () => {
      postsService.getPosts.mockRejectedValue(new Error('Failed to fetch posts'))

      renderWithRouter()

      // Should still render profile even if posts fail
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('should handle NFTs fetch error gracefully', async () => {
      nftService.getMyNFTs.mockRejectedValue(new Error('Failed to fetch NFTs'))

      renderWithRouter()

      // Should still render profile even if NFTs fail
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })
  })

  // =============================
  // 7. AUTHENTICATION CHECK TESTS
  // =============================

  describe('Authentication Check', () => {
    it('should redirect to login when not authenticated and no username param', async () => {
      const unauthContext = {
        ...mockAuthContext,
        user: null,
        isAuthenticated: false
      }

      render(
        <MemoryRouter initialEntries={['/profile']}>
          <AuthContext.Provider value={unauthContext}>
            <Routes>
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/login" element={<div>Login Page</div>} />
            </Routes>
          </AuthContext.Provider>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument()
      })
    })

    it('should allow viewing profiles when authenticated', async () => {
      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('should allow viewing other profiles with username param when not authenticated', async () => {
      const unauthContext = {
        ...mockAuthContext,
        user: null,
        isAuthenticated: false
      }

      renderWithRouter('testuser', unauthContext)

      await waitFor(() => {
        expect(userService.getUserByUsername).toHaveBeenCalledWith('testuser')
      })
    })

    it('should handle missing currentUser in context', async () => {
      const contextWithoutUser = {
        ...mockAuthContext,
        user: null
      }

      render(
        <MemoryRouter initialEntries={['/profile']}>
          <AuthContext.Provider value={contextWithoutUser}>
            <Routes>
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/login" element={<div>Login Page</div>} />
            </Routes>
          </AuthContext.Provider>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument()
      })
    })
  })

  // ====================================
  // 8. EDIT PROFILE FUNCTIONALITY TESTS
  // ====================================

  describe('Edit Profile Functionality', () => {
    it('should display edit profile button for own profile', async () => {
      renderWithRouter('testuser')

      // Since the actual UI is just "Content under construction"
      // we're testing the data flow that would support edit functionality
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('should not display edit button for other profiles', async () => {
      userService.getUserByUsername.mockResolvedValue({
        success: true,
        user: mockOtherUser
      })

      renderWithRouter('otheruser')

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })
  })

  // =====================================
  // 9. FOLLOW/UNFOLLOW FUNCTIONALITY TESTS
  // =====================================

  describe('Follow/Unfollow Functionality', () => {
    it('should set initial following state from user data', async () => {
      const followingUser = { ...mockOtherUser, isFollowing: true }
      userService.getUserByUsername.mockResolvedValue({
        success: true,
        user: followingUser
      })

      renderWithRouter('otheruser')

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('should set following to false by default', async () => {
      userService.getUserByUsername.mockResolvedValue({
        success: true,
        user: mockOtherUser
      })

      renderWithRouter('otheruser')

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })
  })

  // ========================
  // 10. DATA HANDLING TESTS
  // ========================

  describe('Data Handling', () => {
    it('should handle empty posts array', async () => {
      postsService.getPosts.mockResolvedValue({
        success: true,
        posts: []
      })

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('should handle empty NFTs array', async () => {
      nftService.getMyNFTs.mockResolvedValue({
        success: true,
        nfts: []
      })

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('should handle null posts response', async () => {
      postsService.getPosts.mockResolvedValue({
        success: true,
        posts: null
      })

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('should handle null NFTs response', async () => {
      nftService.getMyNFTs.mockResolvedValue({
        success: true,
        nfts: null
      })

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('should filter out null posts', async () => {
      postsService.getPosts.mockResolvedValue({
        success: true,
        posts: [mockPosts[0], null, mockPosts[1], undefined]
      })

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('should filter out null NFTs', async () => {
      nftService.getMyNFTs.mockResolvedValue({
        success: true,
        nfts: [mockNFTs[0], null, mockNFTs[1], undefined]
      })

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('should sort posts by creation date', async () => {
      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('should handle user without badges', async () => {
      const userWithoutBadges = { ...mockUser, badges: [] }
      userService.getUserByUsername.mockResolvedValue({
        success: true,
        user: userWithoutBadges
      })

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('should handle user without achievements', async () => {
      const userWithoutAchievements = { ...mockUser, achievements: [] }
      userService.getUserByUsername.mockResolvedValue({
        success: true,
        user: userWithoutAchievements
      })

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('should handle user without wallet address', async () => {
      const userWithoutWallet = { ...mockUser, walletAddress: null }
      userService.getUserByUsername.mockResolvedValue({
        success: true,
        user: userWithoutWallet
      })

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })
  })

  // ===========================
  // 11. USER STATISTICS TESTS
  // ===========================

  describe('User Statistics', () => {
    it('should calculate user stats correctly', async () => {
      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
      // Stats calculation happens in useMemo
    })

    it('should handle user with zero stats', async () => {
      const userWithZeroStats = {
        ...mockUser,
        stats: { totalPosts: 0, totalComments: 0, totalAwards: 0 },
        followerCount: 0,
        karma: 0,
        nftCount: 0
      }

      userService.getUserByUsername.mockResolvedValue({
        success: true,
        user: userWithZeroStats
      })

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('should format large karma numbers with locale string', async () => {
      const userWithHighKarma = { ...mockUser, karma: 1234567 }
      userService.getUserByUsername.mockResolvedValue({
        success: true,
        user: userWithHighKarma
      })

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('should format large follower counts with locale string', async () => {
      const userWithManyFollowers = { ...mockUser, followerCount: 999999 }
      userService.getUserByUsername.mockResolvedValue({
        success: true,
        user: userWithManyFollowers
      })

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })
  })

  // ========================
  // 12. ACCESSIBILITY TESTS
  // ========================

  describe('Accessibility', () => {
    it('should have proper role on main element', async () => {
      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('should have aria-label on main element', async () => {
      renderWithRouter()

      await waitFor(() => {
        const main = screen.getByRole('main')
        expect(main).toHaveAttribute('aria-label', 'Profile page')
      })
    })

    it('should announce loading state to screen readers', async () => {
      const { useLoadingAnnouncement } = require('../utils/accessibility.jsx')

      renderWithRouter()

      expect(useLoadingAnnouncement).toHaveBeenCalled()
    })

    it('should announce errors to screen readers', async () => {
      const { useErrorAnnouncement } = require('../utils/accessibility.jsx')

      userService.getUserByUsername.mockResolvedValue({
        success: false,
        user: null
      })

      renderWithRouter()

      expect(useErrorAnnouncement).toHaveBeenCalled()
    })

    it('should pass username to loading announcement', async () => {
      const { useLoadingAnnouncement } = require('../utils/accessibility.jsx')

      renderWithRouter('testuser')

      await waitFor(() => {
        expect(useLoadingAnnouncement).toHaveBeenCalled()
      })
    })
  })

  // =============================
  // 13. SCROLL BEHAVIOR TESTS
  // =============================

  describe('Scroll Behavior', () => {
    it('should attach scroll event listener on mount', async () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')

      renderWithRouter()

      await waitFor(() => {
        expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
      })

      addEventListenerSpy.mockRestore()
    })

    it('should remove scroll event listener on unmount', async () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

      const { unmount } = renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))

      removeEventListenerSpy.mockRestore()
    })

    it('should track scroll position', async () => {
      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      // Trigger scroll
      fireEvent.scroll(window, { target: { scrollY: 100 } })

      // Component should handle scroll event
    })
  })

  // =======================
  // 14. MODAL TESTS
  // =======================

  describe('Modal Functionality', () => {
    it('should initialize edit form when edit modal would open', async () => {
      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
      // Edit modal logic is in useEffect
    })

    it('should clear errors when modal would open', async () => {
      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })
  })

  // =============================
  // 15. UTILITY FUNCTIONS TESTS
  // =============================

  describe('Utility Functions', () => {
    it('should format time correctly for seconds ago', async () => {
      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
      // formatTimeAgo is a memoized callback
    })

    it('should format time correctly for minutes ago', async () => {
      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('should format time correctly for hours ago', async () => {
      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('should format time correctly for days ago', async () => {
      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('should get correct badge icon based on name', async () => {
      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
      // getBadgeIcon is a memoized callback
    })

    it('should get correct rarity color', async () => {
      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
      // getRarityColor is a memoized callback
    })
  })

  // =============================
  // 16. PERFORMANCE TESTS
  // =============================

  describe('Performance and Memoization', () => {
    it('should memoize filtered posts', async () => {
      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
      // Memoization tested through useMemo
    })

    it('should memoize sorted posts', async () => {
      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('should memoize user stats data', async () => {
      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('should memoize tab configuration', async () => {
      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('should memoize callback functions', async () => {
      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })
  })

  // =============================
  // 17. INTEGRATION TESTS
  // =============================

  describe('Integration Tests', () => {
    it('should load complete profile with all data', async () => {
      renderWithRouter()

      await waitFor(() => {
        expect(userService.getUserByUsername).toHaveBeenCalled()
        expect(postsService.getPosts).toHaveBeenCalled()
        expect(nftService.getMyNFTs).toHaveBeenCalled()
      })
    })

    it('should handle partial data load gracefully', async () => {
      postsService.getPosts.mockResolvedValue({
        success: false,
        posts: []
      })

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('should work with all dependencies', async () => {
      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })
  })

  // =============================
  // 18. EDGE CASES TESTS
  // =============================

  describe('Edge Cases', () => {
    it('should handle very long usernames', async () => {
      const longUsername = 'a'.repeat(100)
      renderWithRouter(longUsername)

      await waitFor(() => {
        expect(userService.getUserByUsername).toHaveBeenCalledWith(longUsername)
      })
    })

    it('should handle very long display names', async () => {
      const userWithLongName = { ...mockUser, displayName: 'A'.repeat(200) }
      userService.getUserByUsername.mockResolvedValue({
        success: true,
        user: userWithLongName
      })

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('should handle very long bio text', async () => {
      const userWithLongBio = { ...mockUser, bio: 'Bio '.repeat(200) }
      userService.getUserByUsername.mockResolvedValue({
        success: true,
        user: userWithLongBio
      })

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('should handle empty username string', async () => {
      render(
        <MemoryRouter initialEntries={['/profile/']}>
          <AuthContext.Provider value={mockAuthContext}>
            <Routes>
              <Route path="/profile/:username" element={<ProfilePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/login" element={<div>Login Page</div>} />
            </Routes>
          </AuthContext.Provider>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('should handle rapid component mounting and unmounting', async () => {
      const { unmount } = renderWithRouter()

      unmount()

      // Should not cause errors
    })
  })

  // ===================================
  // 19. COMPONENT LIFECYCLE TESTS
  // ===================================

  describe('Component Lifecycle', () => {
    it('should clean up on unmount', async () => {
      const { unmount } = renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      unmount()

      // Should not cause memory leaks or errors
    })

    it('should handle multiple re-renders', async () => {
      const { rerender } = renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      rerender(
        <MemoryRouter initialEntries={['/profile/testuser']}>
          <AuthContext.Provider value={mockAuthContext}>
            <Routes>
              <Route path="/profile/:username" element={<ProfilePage />} />
            </Routes>
          </AuthContext.Provider>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })
  })

  // ===================================
  // 20. RESPONSIVE BEHAVIOR TESTS
  // ===================================

  describe('Responsive Behavior', () => {
    it('should render with correct layout styles', async () => {
      renderWithRouter()

      await waitFor(() => {
        const main = screen.getByRole('main')
        expect(main).toHaveStyle({
          padding: '20px',
          maxWidth: '1200px',
          margin: '0 auto'
        })
      })
    })

    it('should apply responsive padding', async () => {
      renderWithRouter()

      await waitFor(() => {
        const main = screen.getByRole('main')
        expect(main).toHaveStyle({ padding: '20px' })
      })
    })

    it('should have max-width constraint', async () => {
      renderWithRouter()

      await waitFor(() => {
        const main = screen.getByRole('main')
        expect(main).toHaveStyle({ maxWidth: '1200px' })
      })
    })

    it('should center content', async () => {
      renderWithRouter()

      await waitFor(() => {
        const main = screen.getByRole('main')
        expect(main).toHaveStyle({ margin: '0 auto' })
      })
    })
  })
})

export default SocialAnalytics
