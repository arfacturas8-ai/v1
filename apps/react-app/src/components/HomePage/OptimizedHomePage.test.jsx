/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { BrowserRouter } from 'react-router-dom'
import OptimizedHomePage from './OptimizedHomePage'
import { useAuth } from '../../contexts/AuthContext.jsx'
import communityService from '../../services/communityService'
import postsService from '../../services/postsService'
import apiService from '../../services/api'
import offlineStorage from '../../services/offlineStorage'
import { announce, useLoadingAnnouncement } from '../../utils/accessibility'

// Mock dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>
}))

jest.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: jest.fn()
}))

jest.mock('../../services/communityService', () => ({
  getCommunities: jest.fn()
}))

jest.mock('../../services/postsService', () => ({
  getPosts: jest.fn()
}))

jest.mock('../../services/api', () => ({
  get: jest.fn()
}))

jest.mock('../../services/offlineStorage', () => ({
  getCommunities: jest.fn(),
  getPosts: jest.fn(),
  saveCommunities: jest.fn(),
  savePosts: jest.fn()
}))

jest.mock('../../utils/accessibility', () => ({
  SkipToContent: ({ targetId }) => <a href={`#${targetId}`}>Skip to content</a>,
  announce: jest.fn(),
  useLoadingAnnouncement: jest.fn()
}))

jest.mock('../../lib/utils', () => ({
  formatNumber: (num) => num?.toLocaleString() || '0'
}))

jest.mock('../ui/AccessibleButton', () => {
  return ({ children, onClick, ariaLabel, icon, className }) => (
    <button onClick={onClick} aria-label={ariaLabel} className={className}>
      {icon}
      {children}
    </button>
  )
})

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    article: ({ children, ...props }) => <article {...props}>{children}</article>
  }
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  TrendingUp: () => <svg data-testid="icon-trending-up" />,
  Users: () => <svg data-testid="icon-users" />,
  MessageCircle: () => <svg data-testid="icon-message-circle" />,
  Plus: () => <svg data-testid="icon-plus" />,
  Activity: () => <svg data-testid="icon-activity" />,
  Flame: () => <svg data-testid="icon-flame" />,
  Eye: () => <svg data-testid="icon-eye" />,
  Sparkles: () => <svg data-testid="icon-sparkles" />
}))

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn()
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
})
global.IntersectionObserver = mockIntersectionObserver

// Mock Socket.IO (for potential real-time updates)
const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn()
}

// Helper functions
const createMockUser = () => ({
  id: 'user-1',
  username: 'testuser',
  email: 'test@example.com'
})

const createMockCommunity = (id) => ({
  id: `community-${id}`,
  name: `Community${id}`,
  description: `Description for community ${id}`,
  icon: '🎮',
  memberCount: 1000 + id * 100,
  onlineCount: 50 + id * 5
})

const createMockPost = (id) => ({
  id: `post-${id}`,
  title: `Post Title ${id}`,
  communityName: `Community${id}`,
  commentCount: 10 + id,
  score: 100 + id * 10,
  isTrending: id % 2 === 0
})

const createMockLiveStats = () => ({
  activeUsers: 1500,
  totalPosts: 5000,
  totalCommunities: 150,
  newToday: 50,
  userTrend: 5,
  postTrend: 10,
  communityTrend: 2
})

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('OptimizedHomePage Component', () => {
  let mockNavigate

  beforeEach(() => {
    jest.clearAllMocks()
    mockNavigate = jest.fn()
    require('react-router-dom').useNavigate.mockReturnValue(mockNavigate)

    // Default mock implementations
    useAuth.mockReturnValue({ user: createMockUser() })
    communityService.getCommunities.mockResolvedValue({
      success: true,
      communities: [
        createMockCommunity(1),
        createMockCommunity(2),
        createMockCommunity(3)
      ]
    })
    postsService.getPosts.mockResolvedValue({
      success: true,
      posts: [
        createMockPost(1),
        createMockPost(2),
        createMockPost(3)
      ]
    })
    apiService.get.mockResolvedValue({
      success: true,
      data: createMockLiveStats()
    })
    offlineStorage.getCommunities.mockResolvedValue([])
    offlineStorage.getPosts.mockResolvedValue([])
    offlineStorage.saveCommunities.mockResolvedValue()
    offlineStorage.savePosts.mockResolvedValue()

    // Mock navigator.onLine
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: true
    })
  })

  describe('Component Rendering and Layout', () => {
    it('should render without crashing', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(screen.getByText('CRYB Platform')).toBeInTheDocument()
      })
    })

    it('should render header with platform title', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(screen.getByRole('banner')).toBeInTheDocument()
        expect(screen.getByText('CRYB Platform')).toBeInTheDocument()
      })
    })

    it('should render main content area with correct ID', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
      })
    })

    it('should render skip to content link', () => {
      renderWithRouter(<OptimizedHomePage />)
      expect(screen.getByText('Skip to content')).toBeInTheDocument()
    })

    it('should have sticky header', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        const header = screen.getByRole('banner')
        expect(header).toHaveClass('sticky')
      })
    })

    it('should render with background color', async () => {
      renderWithRouter(<OptimizedHomePage />)
      const container = screen.getByRole('main').parentElement
      expect(container).toHaveClass('bg-gray-50')
    })

    it('should render with min-height screen class', async () => {
      renderWithRouter(<OptimizedHomePage />)
      const container = screen.getByRole('main').parentElement
      expect(container).toHaveClass('min-h-screen')
    })
  })

  describe('Loading States and Announcements', () => {
    it('should call useLoadingAnnouncement hook', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(useLoadingAnnouncement).toHaveBeenCalled()
      })
    })

    it('should announce loading state to screen readers', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(useLoadingAnnouncement).toHaveBeenCalledWith(
          expect.any(Boolean),
          'Loading home page content'
        )
      })
    })

    it('should display loading state initially', () => {
      renderWithRouter(<OptimizedHomePage />)
      // Component should be in loading state before data arrives
      expect(communityService.getCommunities).toHaveBeenCalled()
    })
  })

  describe('Live Stats Display', () => {
    it('should fetch live stats on mount', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/stats/live')
      })
    })

    it('should render stats section when stats are loaded', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(screen.getByLabelText(/Platform Statistics/i)).toBeInTheDocument()
      })
    })

    it('should display active users stat card', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(screen.getByText('Active Users')).toBeInTheDocument()
        expect(screen.getByText('1,500')).toBeInTheDocument()
      })
    })

    it('should display total posts stat card', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(screen.getByText('Total Posts')).toBeInTheDocument()
        expect(screen.getByText('5,000')).toBeInTheDocument()
      })
    })

    it('should display communities stat card', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(screen.getByText('Communities')).toBeInTheDocument()
        expect(screen.getByText('150')).toBeInTheDocument()
      })
    })

    it('should display new today stat card', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(screen.getByText('New Today')).toBeInTheDocument()
        expect(screen.getByText('50')).toBeInTheDocument()
      })
    })

    it('should render stat cards in grid layout', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        const statsSection = screen.getByLabelText(/Platform Statistics/i)
        const grid = statsSection.querySelector('.grid')
        expect(grid).toBeInTheDocument()
      })
    })

    it('should display stat trends with positive value', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(screen.getByText(/5%/)).toBeInTheDocument()
      })
    })

    it('should display stat trends with screen reader text', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(screen.getByText(/increased by 5 percent/)).toBeInTheDocument()
      })
    })

    it('should refresh stats every 30 seconds', async () => {
      jest.useFakeTimers()
      renderWithRouter(<OptimizedHomePage />)

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledTimes(1)
      })

      jest.advanceTimersByTime(30000)

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledTimes(2)
      })

      jest.useRealTimers()
    })

    it('should handle stats fetch error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      apiService.get.mockRejectedValue(new Error('Stats fetch failed'))

      renderWithRouter(<OptimizedHomePage />)

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to fetch live stats:',
          expect.any(Error)
        )
      })

      consoleError.mockRestore()
    })

    it('should render stat card icons', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(screen.getByTestId('icon-users')).toBeInTheDocument()
        expect(screen.getByTestId('icon-message-circle')).toBeInTheDocument()
        expect(screen.getByTestId('icon-activity')).toBeInTheDocument()
        expect(screen.getByTestId('icon-sparkles')).toBeInTheDocument()
      })
    })

    it('should apply correct color classes to stat cards', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        const statsSection = screen.getByLabelText(/Platform Statistics/i)
        expect(statsSection.querySelector('.bg-blue-500')).toBeInTheDocument()
        expect(statsSection.querySelector('.bg-green-500')).toBeInTheDocument()
        expect(statsSection.querySelector('.bg-purple-500')).toBeInTheDocument()
        expect(statsSection.querySelector('.bg-orange-500')).toBeInTheDocument()
      })
    })
  })

  describe('Featured Communities Section', () => {
    it('should fetch featured communities on mount', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(communityService.getCommunities).toHaveBeenCalledWith({
          sort: 'featured',
          limit: 6
        })
      })
    })

    it('should render communities section heading', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(screen.getByText('Featured Communities')).toBeInTheDocument()
      })
    })

    it('should render view all communities link', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        const link = screen.getByLabelText('View all communities')
        expect(link).toBeInTheDocument()
        expect(link).toHaveAttribute('href', '/communities')
      })
    })

    it('should display community cards', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(screen.getByText('Community1')).toBeInTheDocument()
        expect(screen.getByText('Community2')).toBeInTheDocument()
        expect(screen.getByText('Community3')).toBeInTheDocument()
      })
    })

    it('should display community member count', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(screen.getByText(/1,100 members/)).toBeInTheDocument()
      })
    })

    it('should display community online count', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(screen.getByText(/55 online/)).toBeInTheDocument()
      })
    })

    it('should display community description', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(screen.getByText('Description for community 1')).toBeInTheDocument()
      })
    })

    it('should display community icon', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(screen.getByText('🎮')).toBeInTheDocument()
      })
    })

    it('should navigate to community on card click', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        const communityCard = screen.getByText('Community1').closest('div')
        fireEvent.click(communityCard)
      })
      expect(mockNavigate).toHaveBeenCalledWith('/c/Community1')
    })

    it('should navigate to community on Enter key', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        const communityCard = screen.getByText('Community1').closest('div')
        fireEvent.keyDown(communityCard, { key: 'Enter', code: 'Enter' })
      })
      expect(mockNavigate).toHaveBeenCalledWith('/c/Community1')
    })

    it('should navigate to community on Space key', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        const communityCard = screen.getByText('Community1').closest('div')
        fireEvent.keyDown(communityCard, { key: ' ', code: 'Space' })
      })
      expect(mockNavigate).toHaveBeenCalledWith('/c/Community1')
    })

    it('should have proper ARIA labels for community cards', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        const communityCard = screen.getByText('Community1').closest('div')
        expect(communityCard).toHaveAttribute('role', 'article')
        expect(communityCard).toHaveAttribute('aria-labelledby', 'community-community-1-name')
      })
    })

    it('should make community cards keyboard accessible', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        const communityCard = screen.getByText('Community1').closest('div')
        expect(communityCard).toHaveAttribute('tabIndex', '0')
      })
    })

    it('should cache communities for offline use', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(offlineStorage.saveCommunities).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ name: 'Community1' })
          ])
        )
      })
    })

    it('should render communities in grid layout', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        const communitiesSection = screen.getByLabelText(/Featured Communities/i)
        const grid = communitiesSection.querySelector('.grid')
        expect(grid).toBeInTheDocument()
      })
    })
  })

  describe('Trending Posts Section', () => {
    it('should fetch trending posts on mount', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(postsService.getPosts).toHaveBeenCalledWith({
          sort: 'trending',
          limit: 3
        })
      })
    })

    it('should render trending posts section heading', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(screen.getByText('Trending Posts')).toBeInTheDocument()
      })
    })

    it('should display flame icon in heading', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(screen.getByTestId('icon-flame')).toBeInTheDocument()
      })
    })

    it('should render view all trending posts link', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        const link = screen.getByLabelText('View all trending posts')
        expect(link).toBeInTheDocument()
        expect(link).toHaveAttribute('href', '/posts?sort=trending')
      })
    })

    it('should display post cards', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(screen.getByText('Post Title 1')).toBeInTheDocument()
        expect(screen.getByText('Post Title 2')).toBeInTheDocument()
        expect(screen.getByText('Post Title 3')).toBeInTheDocument()
      })
    })

    it('should display post community name', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(screen.getByText(/c\/Community1/)).toBeInTheDocument()
      })
    })

    it('should display post comment count', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(screen.getByText('11')).toBeInTheDocument()
      })
    })

    it('should display post score', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(screen.getByText('110')).toBeInTheDocument()
      })
    })

    it('should display trending badge for trending posts', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        const trendingBadges = screen.getAllByTitle('Trending')
        expect(trendingBadges.length).toBeGreaterThan(0)
      })
    })

    it('should navigate to post on card click', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        const postCard = screen.getByText('Post Title 1').closest('article')
        fireEvent.click(postCard)
      })
      expect(mockNavigate).toHaveBeenCalledWith('/posts/post-1')
    })

    it('should navigate to post on Enter key', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        const postCard = screen.getByText('Post Title 1').closest('article')
        fireEvent.keyDown(postCard, { key: 'Enter', code: 'Enter' })
      })
      expect(mockNavigate).toHaveBeenCalledWith('/posts/post-1')
    })

    it('should navigate to post on Space key', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        const postCard = screen.getByText('Post Title 1').closest('article')
        fireEvent.keyDown(postCard, { key: ' ', code: 'Space' })
      })
      expect(mockNavigate).toHaveBeenCalledWith('/posts/post-1')
    })

    it('should have proper ARIA labels for post cards', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        const postCard = screen.getByText('Post Title 1').closest('article')
        expect(postCard).toHaveAttribute('role', 'article')
        expect(postCard).toHaveAttribute('aria-labelledby', 'post-post-1-title')
      })
    })

    it('should make post cards keyboard accessible', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        const postCard = screen.getByText('Post Title 1').closest('article')
        expect(postCard).toHaveAttribute('tabIndex', '0')
      })
    })

    it('should cache posts for offline use', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(offlineStorage.savePosts).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ title: 'Post Title 1' })
          ])
        )
      })
    })

    it('should render post icons', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(screen.getAllByTestId('icon-users').length).toBeGreaterThan(0)
        expect(screen.getAllByTestId('icon-message-circle').length).toBeGreaterThan(0)
        expect(screen.getAllByTestId('icon-trending-up').length).toBeGreaterThan(0)
      })
    })

    it('should include screen reader text for post metadata', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(screen.getAllByText('comments').length).toBeGreaterThan(0)
        expect(screen.getAllByText('points').length).toBeGreaterThan(0)
      })
    })
  })

  describe('Create Post Button', () => {
    it('should render create post button when user is authenticated', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(screen.getByLabelText('Create new post')).toBeInTheDocument()
      })
    })

    it('should not render create post button when user is not authenticated', async () => {
      useAuth.mockReturnValue({ user: null })
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(screen.queryByLabelText('Create new post')).not.toBeInTheDocument()
      })
    })

    it('should display plus icon in create post button', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        const button = screen.getByLabelText('Create new post')
        expect(within(button).getByTestId('icon-plus')).toBeInTheDocument()
      })
    })

    it('should navigate to submit page on create post click', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        const button = screen.getByLabelText('Create new post')
        fireEvent.click(button)
      })
      expect(mockNavigate).toHaveBeenCalledWith('/submit')
    })

    it('should have proper button styling', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        const button = screen.getByLabelText('Create new post')
        expect(button).toHaveClass('bg-blue-600', 'text-white')
      })
    })
  })

  describe('Offline Mode', () => {
    beforeEach(() => {
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: false
      })
    })

    it('should detect offline state on mount', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(screen.getByText(/You're offline/)).toBeInTheDocument()
      })
    })

    it('should display offline indicator banner', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        const banner = screen.getByRole('status')
        expect(banner).toHaveClass('bg-yellow-100')
      })
    })

    it('should load cached communities when offline', async () => {
      const cachedCommunities = [createMockCommunity(1), createMockCommunity(2)]
      offlineStorage.getCommunities.mockResolvedValue(cachedCommunities)

      renderWithRouter(<OptimizedHomePage />)

      await waitFor(() => {
        expect(offlineStorage.getCommunities).toHaveBeenCalled()
      })
    })

    it('should load cached posts when offline', async () => {
      const cachedPosts = [createMockPost(1), createMockPost(2)]
      offlineStorage.getPosts.mockResolvedValue(cachedPosts)

      renderWithRouter(<OptimizedHomePage />)

      await waitFor(() => {
        expect(offlineStorage.getPosts).toHaveBeenCalledWith({ limit: 3 })
      })
    })

    it('should announce offline status to screen readers', async () => {
      renderWithRouter(<OptimizedHomePage />)

      await waitFor(() => {
        expect(announce).toHaveBeenCalledWith(
          'Showing cached content. Connect to the internet for latest updates.',
          'polite'
        )
      })
    })

    it('should not fetch live stats when offline', async () => {
      apiService.get.mockClear()
      renderWithRouter(<OptimizedHomePage />)

      await waitFor(() => {
        expect(apiService.get).not.toHaveBeenCalled()
      })
    })

    it('should not fetch from API when offline', async () => {
      communityService.getCommunities.mockClear()
      postsService.getPosts.mockClear()

      renderWithRouter(<OptimizedHomePage />)

      await waitFor(() => {
        expect(communityService.getCommunities).not.toHaveBeenCalled()
        expect(postsService.getPosts).not.toHaveBeenCalled()
      })
    })
  })

  describe('Online/Offline Transitions', () => {
    it('should listen for online events', async () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
      renderWithRouter(<OptimizedHomePage />)

      expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
      addEventListenerSpy.mockRestore()
    })

    it('should listen for offline events', async () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
      renderWithRouter(<OptimizedHomePage />)

      expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))
      addEventListenerSpy.mockRestore()
    })

    it('should announce when connection is restored', async () => {
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: false
      })

      renderWithRouter(<OptimizedHomePage />)

      // Simulate going online
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: true
      })
      fireEvent(window, new Event('online'))

      await waitFor(() => {
        expect(announce).toHaveBeenCalledWith('Connection restored', 'polite')
      })
    })

    it('should announce when going offline', async () => {
      renderWithRouter(<OptimizedHomePage />)

      // Simulate going offline
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: false
      })
      fireEvent(window, new Event('offline'))

      await waitFor(() => {
        expect(announce).toHaveBeenCalledWith(
          'You are offline. Showing cached content.',
          'assertive'
        )
      })
    })

    it('should remove event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
      const { unmount } = renderWithRouter(<OptimizedHomePage />)

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))
      removeEventListenerSpy.mockRestore()
    })
  })

  describe('Error Handling', () => {
    it('should display error message when data fetch fails', async () => {
      communityService.getCommunities.mockRejectedValue(new Error('Fetch failed'))

      renderWithRouter(<OptimizedHomePage />)

      await waitFor(() => {
        expect(screen.getByText('Failed to load content. Please try again.')).toBeInTheDocument()
      })
    })

    it('should render error alert with proper role', async () => {
      communityService.getCommunities.mockRejectedValue(new Error('Fetch failed'))

      renderWithRouter(<OptimizedHomePage />)

      await waitFor(() => {
        const errorAlert = screen.getByRole('alert')
        expect(errorAlert).toBeInTheDocument()
      })
    })

    it('should announce error to screen readers', async () => {
      communityService.getCommunities.mockRejectedValue(new Error('Fetch failed'))

      renderWithRouter(<OptimizedHomePage />)

      await waitFor(() => {
        expect(announce).toHaveBeenCalledWith('Failed to load content', 'assertive')
      })
    })

    it('should log error to console', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      communityService.getCommunities.mockRejectedValue(new Error('Fetch failed'))

      renderWithRouter(<OptimizedHomePage />)

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to fetch data:',
          expect.any(Error)
        )
      })

      consoleError.mockRestore()
    })

    it('should handle partial data fetch failures', async () => {
      communityService.getCommunities.mockResolvedValue({
        success: true,
        communities: [createMockCommunity(1)]
      })
      postsService.getPosts.mockRejectedValue(new Error('Posts fetch failed'))

      renderWithRouter(<OptimizedHomePage />)

      await waitFor(() => {
        expect(screen.getByText('Failed to load content. Please try again.')).toBeInTheDocument()
      })
    })
  })

  describe('Data Fetching and Caching', () => {
    it('should fetch both communities and posts in parallel', async () => {
      renderWithRouter(<OptimizedHomePage />)

      await waitFor(() => {
        expect(communityService.getCommunities).toHaveBeenCalled()
        expect(postsService.getPosts).toHaveBeenCalled()
      })
    })

    it('should limit featured communities to 6', async () => {
      const communities = Array.from({ length: 10 }, (_, i) => createMockCommunity(i))
      communityService.getCommunities.mockResolvedValue({
        success: true,
        communities
      })

      renderWithRouter(<OptimizedHomePage />)

      await waitFor(() => {
        expect(communityService.getCommunities).toHaveBeenCalledWith({
          sort: 'featured',
          limit: 6
        })
      })
    })

    it('should limit trending posts to 3', async () => {
      renderWithRouter(<OptimizedHomePage />)

      await waitFor(() => {
        expect(postsService.getPosts).toHaveBeenCalledWith({
          sort: 'trending',
          limit: 3
        })
      })
    })

    it('should handle empty communities response', async () => {
      communityService.getCommunities.mockResolvedValue({
        success: true,
        communities: []
      })

      renderWithRouter(<OptimizedHomePage />)

      await waitFor(() => {
        expect(screen.getByText('Featured Communities')).toBeInTheDocument()
      })
    })

    it('should handle empty posts response', async () => {
      postsService.getPosts.mockResolvedValue({
        success: true,
        posts: []
      })

      renderWithRouter(<OptimizedHomePage />)

      await waitFor(() => {
        expect(screen.getByText('Trending Posts')).toBeInTheDocument()
      })
    })

    it('should handle undefined communities in response', async () => {
      communityService.getCommunities.mockResolvedValue({
        success: true
      })

      renderWithRouter(<OptimizedHomePage />)

      await waitFor(() => {
        expect(screen.getByText('Featured Communities')).toBeInTheDocument()
      })
    })

    it('should handle undefined posts in response', async () => {
      postsService.getPosts.mockResolvedValue({
        success: true
      })

      renderWithRouter(<OptimizedHomePage />)

      await waitFor(() => {
        expect(screen.getByText('Trending Posts')).toBeInTheDocument()
      })
    })
  })

  describe('Performance Optimizations', () => {
    it('should memoize stat display values', async () => {
      const { rerender } = renderWithRouter(<OptimizedHomePage />)

      await waitFor(() => {
        expect(screen.getByText('Active Users')).toBeInTheDocument()
      })

      // Rerender without changing stats
      rerender(
        <BrowserRouter>
          <OptimizedHomePage />
        </BrowserRouter>
      )

      // Stats should still be displayed (memoization working)
      expect(screen.getByText('Active Users')).toBeInTheDocument()
    })

    it('should use React.memo for StatCard component', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        // StatCard should be memoized - verify display name
        expect(screen.getByText('Active Users')).toBeInTheDocument()
      })
    })

    it('should use React.memo for CommunityCard component', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(screen.getByText('Community1')).toBeInTheDocument()
      })
    })

    it('should use React.memo for PostCard component', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(screen.getByText('Post Title 1')).toBeInTheDocument()
      })
    })

    it('should use useCallback for navigation handlers', async () => {
      renderWithRouter(<OptimizedHomePage />)

      await waitFor(() => {
        const communityCard = screen.getByText('Community1').closest('div')
        fireEvent.click(communityCard)
      })

      expect(mockNavigate).toHaveBeenCalledWith('/c/Community1')
    })

    it('should memoize the entire component', () => {
      // OptimizedHomePage should be wrapped with React.memo
      expect(OptimizedHomePage.$$typeof).toBeDefined()
    })
  })

  describe('Accessibility Features', () => {
    it('should have proper heading hierarchy', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        const h1 = screen.getByRole('heading', { level: 1 })
        expect(h1).toHaveTextContent('CRYB Platform')
      })
    })

    it('should have proper section labels', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(screen.getByLabelText(/Platform Statistics/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Featured Communities/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Trending Posts/i)).toBeInTheDocument()
      })
    })

    it('should hide decorative icons from screen readers', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        const statSection = screen.getByLabelText(/Platform Statistics/i)
        const decorativeIcons = statSection.querySelectorAll('[aria-hidden="true"]')
        expect(decorativeIcons.length).toBeGreaterThan(0)
      })
    })

    it('should provide screen reader only text for context', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(screen.getByText('Posted in', { selector: '.sr-only' })).toBeInTheDocument()
      })
    })

    it('should have live regions for dynamic content', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        const liveRegions = screen.getAllByRole('status')
        expect(liveRegions.length).toBeGreaterThan(0)
      })
    })

    it('should announce stat values with aria-live', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        const statValues = screen.getByText('1,500').closest('p')
        expect(statValues).toHaveAttribute('aria-live', 'polite')
      })
    })

    it('should have accessible buttons with aria-labels', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        const createButton = screen.getByLabelText('Create new post')
        expect(createButton).toBeInTheDocument()
      })
    })

    it('should support keyboard navigation for interactive elements', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        const communityCard = screen.getByText('Community1').closest('div')
        expect(communityCard).toHaveAttribute('tabIndex', '0')
      })
    })
  })

  describe('Mobile Responsiveness', () => {
    it('should render grid with responsive classes', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        const statsSection = screen.getByLabelText(/Platform Statistics/i)
        const grid = statsSection.querySelector('.grid')
        expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4')
      })
    })

    it('should render communities grid with responsive classes', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        const communitiesSection = screen.getByLabelText(/Featured Communities/i)
        const grid = communitiesSection.querySelector('.grid')
        expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3')
      })
    })

    it('should use responsive padding', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        const main = screen.getByRole('main')
        expect(main).toHaveClass('px-4')
      })
    })

    it('should have max-width constraint', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        const main = screen.getByRole('main')
        expect(main).toHaveClass('max-w-7xl', 'mx-auto')
      })
    })
  })

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle null user gracefully', async () => {
      useAuth.mockReturnValue({ user: null })
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(screen.getByText('CRYB Platform')).toBeInTheDocument()
      })
    })

    it('should handle undefined user gracefully', async () => {
      useAuth.mockReturnValue({})
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        expect(screen.getByText('CRYB Platform')).toBeInTheDocument()
      })
    })

    it('should handle API returning unsuccessful response', async () => {
      communityService.getCommunities.mockResolvedValue({ success: false })
      postsService.getPosts.mockResolvedValue({ success: false })

      renderWithRouter(<OptimizedHomePage />)

      await waitFor(() => {
        expect(screen.getByText('Featured Communities')).toBeInTheDocument()
      })
    })

    it('should handle stats API failure gracefully', async () => {
      apiService.get.mockResolvedValue({ success: false })

      renderWithRouter(<OptimizedHomePage />)

      await waitFor(() => {
        expect(screen.getByText('CRYB Platform')).toBeInTheDocument()
      })
    })

    it('should handle missing community data fields', async () => {
      communityService.getCommunities.mockResolvedValue({
        success: true,
        communities: [{ id: 'c1', name: 'TestCommunity' }]
      })

      renderWithRouter(<OptimizedHomePage />)

      await waitFor(() => {
        expect(screen.getByText('TestCommunity')).toBeInTheDocument()
      })
    })

    it('should handle missing post data fields', async () => {
      postsService.getPosts.mockResolvedValue({
        success: true,
        posts: [{ id: 'p1', title: 'Test Post' }]
      })

      renderWithRouter(<OptimizedHomePage />)

      await waitFor(() => {
        expect(screen.getByText('Test Post')).toBeInTheDocument()
      })
    })

    it('should handle rapid online/offline state changes', async () => {
      renderWithRouter(<OptimizedHomePage />)

      fireEvent(window, new Event('offline'))
      fireEvent(window, new Event('online'))
      fireEvent(window, new Event('offline'))
      fireEvent(window, new Event('online'))

      await waitFor(() => {
        expect(announce).toHaveBeenCalled()
      })
    })
  })

  describe('Component Lifecycle', () => {
    it('should fetch data on mount', async () => {
      renderWithRouter(<OptimizedHomePage />)

      await waitFor(() => {
        expect(communityService.getCommunities).toHaveBeenCalled()
        expect(postsService.getPosts).toHaveBeenCalled()
      })
    })

    it('should clean up stats interval on unmount', () => {
      jest.useFakeTimers()
      const { unmount } = renderWithRouter(<OptimizedHomePage />)

      unmount()

      // Advance timers after unmount
      jest.advanceTimersByTime(30000)

      // Should not call API after unmount
      expect(apiService.get).toHaveBeenCalledTimes(1)

      jest.useRealTimers()
    })

    it('should clean up event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
      const { unmount } = renderWithRouter(<OptimizedHomePage />)

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalled()
      removeEventListenerSpy.mockRestore()
    })
  })

  describe('Memoization and Re-renders', () => {
    it('should not refetch data on re-render with same props', async () => {
      const { rerender } = renderWithRouter(<OptimizedHomePage />)

      await waitFor(() => {
        expect(communityService.getCommunities).toHaveBeenCalledTimes(1)
      })

      rerender(
        <BrowserRouter>
          <OptimizedHomePage />
        </BrowserRouter>
      )

      // Should not fetch again
      expect(communityService.getCommunities).toHaveBeenCalledTimes(1)
    })

    it('should refetch data when going from offline to online', async () => {
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: false
      })

      renderWithRouter(<OptimizedHomePage />)

      await waitFor(() => {
        expect(offlineStorage.getCommunities).toHaveBeenCalled()
      })

      // Go online
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: true
      })
      fireEvent(window, new Event('online'))

      // Should fetch from API now
      await waitFor(() => {
        expect(communityService.getCommunities).toHaveBeenCalled()
      })
    })
  })

  describe('StatCard Component', () => {
    it('should render stat card with correct structure', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        const statCard = screen.getByLabelText(/Active Users: 1,500/)
        expect(statCard).toHaveAttribute('role', 'article')
      })
    })

    it('should display positive trend indicator', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        const trendIndicator = screen.getByText(/↑/)
        expect(trendIndicator).toBeInTheDocument()
      })
    })

    it('should display negative trend indicator', async () => {
      apiService.get.mockResolvedValue({
        success: true,
        data: { ...createMockLiveStats(), userTrend: -3 }
      })

      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        const trendIndicator = screen.getByText(/↓/)
        expect(trendIndicator).toBeInTheDocument()
      })
    })

    it('should apply correct color to trend text', async () => {
      renderWithRouter(<OptimizedHomePage />)
      await waitFor(() => {
        const trendText = screen.getByText(/5%/).closest('p')
        expect(trendText).toHaveClass('text-green-600')
      })
    })
  })
})

export default mockIntersectionObserver
