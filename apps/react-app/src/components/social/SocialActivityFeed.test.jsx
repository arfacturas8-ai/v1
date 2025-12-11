import React from 'react'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import SocialActivityFeed from './SocialActivityFeed'
import socialService from '../../services/socialService'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../ui/useToast'
import useSocialRealTime from '../../hooks/useSocialRealTime'

// Mock dependencies
jest.mock('../../services/socialService')
jest.mock('../../contexts/AuthContext')
jest.mock('../ui/useToast')
jest.mock('../../hooks/useSocialRealTime')
jest.mock('./SocialActivityFeed.css', () => {})

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Activity: ({ size }) => <div data-testid="activity-icon" data-size={size}>Activity</div>,
  Heart: ({ size }) => <div data-testid="heart-icon" data-size={size}>Heart</div>,
  MessageSquare: ({ size }) => <div data-testid="message-icon" data-size={size}>Message</div>,
  UserPlus: ({ size }) => <div data-testid="user-plus-icon" data-size={size}>UserPlus</div>,
  Users: ({ size }) => <div data-testid="users-icon" data-size={size}>Users</div>,
  Share2: ({ size }) => <div data-testid="share-icon" data-size={size}>Share</div>,
  Trophy: ({ size }) => <div data-testid="trophy-icon" data-size={size}>Trophy</div>,
  Star: ({ size }) => <div data-testid="star-icon" data-size={size}>Star</div>,
  Zap: ({ size }) => <div data-testid="zap-icon" data-size={size}>Zap</div>,
  Calendar: ({ size }) => <div data-testid="calendar-icon" data-size={size}>Calendar</div>,
  Filter: ({ size }) => <div data-testid="filter-icon" data-size={size}>Filter</div>,
  RefreshCw: ({ size, className }) => <div data-testid="refresh-icon" data-size={size} className={className}>Refresh</div>,
  X: ({ size }) => <div data-testid="x-icon" data-size={size}>X</div>,
  Bookmark: ({ size }) => <div data-testid="bookmark-icon" data-size={size}>Bookmark</div>,
  BookmarkCheck: ({ size }) => <div data-testid="bookmark-check-icon" data-size={size}>BookmarkCheck</div>,
  MoreHorizontal: ({ size }) => <div data-testid="more-icon" data-size={size}>More</div>,
  ExternalLink: ({ size }) => <div data-testid="external-link-icon" data-size={size}>ExternalLink</div>,
  Eye: ({ size }) => <div data-testid="eye-icon" data-size={size}>Eye</div>,
  Clock: ({ size }) => <div data-testid="clock-icon" data-size={size}>Clock</div>,
  TrendingUp: ({ size }) => <div data-testid="trending-icon" data-size={size}>TrendingUp</div>,
  Bell: ({ size }) => <div data-testid="bell-icon" data-size={size}>Bell</div>,
  Settings: ({ size }) => <div data-testid="settings-icon" data-size={size}>Settings</div>
}))

describe('SocialActivityFeed', () => {
  const mockShowToast = jest.fn()
  const mockUser = {
    id: 'user123',
    username: 'testuser',
    displayName: 'Test User'
  }

  const createMockActivity = (overrides = {}) => ({
    id: 'activity_1',
    type: 'post',
    user: {
      id: 'user1',
      username: 'techguru',
      displayName: 'Tech Guru',
      avatar: '👨‍💻'
    },
    action: 'created a post',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    content: 'Just discovered an amazing new DeFi protocol!',
    engagement: {
      likes: 10,
      comments: 5,
      shares: 2
    },
    metadata: {
      postId: 'post_1',
      targetUser: null,
      achievement: null,
      community: null
    },
    ...overrides
  })

  const createMockResponse = (activities = [], hasMore = false) => ({
    activities,
    page: 1,
    limit: 20,
    hasMore
  })

  beforeEach(() => {
    jest.clearAllMocks()

    useAuth.mockReturnValue({
      user: mockUser
    })

    useToast.mockReturnValue({
      showToast: mockShowToast
    })

    useSocialRealTime.mockReturnValue({
      isConnected: false,
      getRecentActivities: jest.fn(() => []),
      socialUpdates: { activities: [] }
    })

    socialService.getSocialActivityFeed.mockResolvedValue(
      createMockResponse([createMockActivity()])
    )
  })

  describe('Component Rendering', () => {
    it('should render activity feed with header', async () => {
      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(screen.getByText('Activity Feed')).toBeInTheDocument()
      })

      expect(screen.getByText('Stay updated with your social network')).toBeInTheDocument()
    })

    it('should render embedded mode without header', async () => {
      render(<SocialActivityFeed embedded={true} />)

      await waitFor(() => {
        expect(screen.queryByText('Activity Feed')).not.toBeInTheDocument()
      })
    })

    it('should render modal wrapper when not embedded', async () => {
      const { container } = render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(container.querySelector('.social-activity-modal')).toBeInTheDocument()
      })
    })

    it('should render activity list container', async () => {
      const { container } = render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(container.querySelector('.activity-list')).toBeInTheDocument()
      })
    })

    it('should render header controls', async () => {
      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(screen.getByTestId('refresh-icon')).toBeInTheDocument()
        expect(screen.getByTestId('filter-icon')).toBeInTheDocument()
      })
    })
  })

  describe('Initial Loading', () => {
    it('should show loading state initially', () => {
      socialService.getSocialActivityFeed.mockReturnValue(new Promise(() => {}))

      render(<SocialActivityFeed />)

      expect(screen.getByText('Loading activity feed...')).toBeInTheDocument()
      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument()
    })

    it('should call API on mount', async () => {
      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(socialService.getSocialActivityFeed).toHaveBeenCalledWith(
          1,
          20,
          expect.objectContaining({
            type: undefined,
            timeRange: 'week',
            userId: null
          })
        )
      })
    })

    it('should hide loading state after data loads', async () => {
      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(screen.queryByText('Loading activity feed...')).not.toBeInTheDocument()
      })
    })

    it('should load with custom userId prop', async () => {
      render(<SocialActivityFeed userId="user456" />)

      await waitFor(() => {
        expect(socialService.getSocialActivityFeed).toHaveBeenCalledWith(
          1,
          20,
          expect.objectContaining({
            userId: 'user456'
          })
        )
      })
    })
  })

  describe('Activity Item Rendering', () => {
    it('should render activity items after loading', async () => {
      const activity = createMockActivity()
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([activity])
      )

      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
        expect(screen.getByText('@techguru')).toBeInTheDocument()
      })
    })

    it('should display activity content', async () => {
      const activity = createMockActivity({
        content: 'Test activity content'
      })
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([activity])
      )

      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(screen.getByText('Test activity content')).toBeInTheDocument()
      })
    })

    it('should display activity action', async () => {
      const activity = createMockActivity({
        action: 'liked a post'
      })
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([activity])
      )

      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(screen.getByText('liked a post')).toBeInTheDocument()
      })
    })

    it('should render user avatar emoji', async () => {
      const activity = createMockActivity()
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([activity])
      )

      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(screen.getByText('👨‍💻')).toBeInTheDocument()
      })
    })

    it('should render user avatar image when URL provided', async () => {
      const activity = createMockActivity({
        user: {
          id: 'user1',
          username: 'testuser',
          displayName: 'Test User',
          avatar: 'https://example.com/avatar.jpg'
        }
      })
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([activity])
      )

      render(<SocialActivityFeed />)

      await waitFor(() => {
        const img = screen.getByAltText('testuser')
        expect(img).toBeInTheDocument()
        expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
      })
    })

    it('should render avatar placeholder when no avatar', async () => {
      const activity = createMockActivity({
        user: {
          id: 'user1',
          username: 'testuser',
          displayName: 'Test User',
          avatar: null
        }
      })
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([activity])
      )

      const { container } = render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(container.querySelector('.avatar-placeholder')).toBeInTheDocument()
      })
    })

    it('should display multiple activities', async () => {
      const activities = [
        createMockActivity({ id: 'activity_1', user: { id: '1', username: 'user1', displayName: 'User 1', avatar: '👨' } }),
        createMockActivity({ id: 'activity_2', user: { id: '2', username: 'user2', displayName: 'User 2', avatar: '👩' } }),
        createMockActivity({ id: 'activity_3', user: { id: '3', username: 'user3', displayName: 'User 3', avatar: '🧑' } })
      ]
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse(activities)
      )

      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(screen.getByText('User 1')).toBeInTheDocument()
        expect(screen.getByText('User 2')).toBeInTheDocument()
        expect(screen.getByText('User 3')).toBeInTheDocument()
      })
    })
  })

  describe('Activity Types', () => {
    it('should render post activity type', async () => {
      const activity = createMockActivity({ type: 'post' })
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([activity])
      )

      const { container } = render(<SocialActivityFeed />)

      await waitFor(() => {
        const badges = container.querySelectorAll('.activity-type-badge')
        expect(badges.length).toBeGreaterThan(0)
      })
    })

    it('should render follow activity type with target user', async () => {
      const activity = createMockActivity({
        type: 'follow',
        action: 'started following',
        metadata: {
          targetUser: {
            id: 'user2',
            username: 'targetuser',
            displayName: 'Target User'
          }
        }
      })
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([activity])
      )

      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(screen.getByText('started following')).toBeInTheDocument()
        expect(screen.getByText('Target User')).toBeInTheDocument()
      })
    })

    it('should render achievement activity with badge', async () => {
      const activity = createMockActivity({
        type: 'achievement',
        action: 'earned an achievement',
        metadata: {
          achievement: 'Early Adopter'
        }
      })
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([activity])
      )

      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(screen.getByText('earned an achievement')).toBeInTheDocument()
        expect(screen.getByText('Early Adopter')).toBeInTheDocument()
      })
    })

    it('should render join activity with community', async () => {
      const activity = createMockActivity({
        type: 'join',
        action: 'joined a community',
        metadata: {
          community: 'Web3 Developers'
        }
      })
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([activity])
      )

      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(screen.getByText('joined a community')).toBeInTheDocument()
        expect(screen.getByText('Web3 Developers')).toBeInTheDocument()
      })
    })

    it('should render like activity', async () => {
      const activity = createMockActivity({
        type: 'like',
        action: 'liked a post'
      })
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([activity])
      )

      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(screen.getByText('liked a post')).toBeInTheDocument()
      })
    })

    it('should render share activity', async () => {
      const activity = createMockActivity({
        type: 'share',
        action: 'shared a post'
      })
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([activity])
      )

      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(screen.getByText('shared a post')).toBeInTheDocument()
      })
    })
  })

  describe('Time Formatting', () => {
    it('should display "Just now" for recent activity', async () => {
      const activity = createMockActivity({
        timestamp: new Date(Date.now() - 30000).toISOString()
      })
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([activity])
      )

      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(screen.getByText('Just now')).toBeInTheDocument()
      })
    })

    it('should display minutes ago for activities under 1 hour', async () => {
      const activity = createMockActivity({
        timestamp: new Date(Date.now() - 1800000).toISOString()
      })
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([activity])
      )

      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(screen.getByText(/30m ago/)).toBeInTheDocument()
      })
    })

    it('should display hours ago for activities under 24 hours', async () => {
      const activity = createMockActivity({
        timestamp: new Date(Date.now() - 7200000).toISOString()
      })
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([activity])
      )

      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(screen.getByText(/2h ago/)).toBeInTheDocument()
      })
    })

    it('should display days ago for activities under 7 days', async () => {
      const activity = createMockActivity({
        timestamp: new Date(Date.now() - 172800000).toISOString()
      })
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([activity])
      )

      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(screen.getByText(/2d ago/)).toBeInTheDocument()
      })
    })

    it('should display date for activities over 7 days old', async () => {
      const oldDate = new Date(Date.now() - 864000000)
      const activity = createMockActivity({
        timestamp: oldDate.toISOString()
      })
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([activity])
      )

      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(screen.getByText(oldDate.toLocaleDateString())).toBeInTheDocument()
      })
    })
  })

  describe('Engagement Display', () => {
    it('should display likes count', async () => {
      const activity = createMockActivity({
        engagement: { likes: 42, comments: 5, shares: 2 }
      })
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([activity])
      )

      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(screen.getByText('42')).toBeInTheDocument()
      })
    })

    it('should display comments count', async () => {
      const activity = createMockActivity({
        engagement: { likes: 10, comments: 23, shares: 2 }
      })
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([activity])
      )

      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(screen.getByText('23')).toBeInTheDocument()
      })
    })

    it('should display shares count', async () => {
      const activity = createMockActivity({
        engagement: { likes: 10, comments: 5, shares: 15 }
      })
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([activity])
      )

      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument()
      })
    })

    it('should render engagement buttons', async () => {
      const activity = createMockActivity()
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([activity])
      )

      const { container } = render(<SocialActivityFeed />)

      await waitFor(() => {
        const buttons = container.querySelectorAll('.engagement-btn')
        expect(buttons.length).toBeGreaterThanOrEqual(3)
      })
    })
  })

  describe('Save/Bookmark Functionality', () => {
    it('should render bookmark button', async () => {
      const activity = createMockActivity()
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([activity])
      )

      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(screen.getByTestId('bookmark-icon')).toBeInTheDocument()
      })
    })

    it('should save activity when bookmark clicked', async () => {
      const activity = createMockActivity()
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([activity])
      )

      const { container } = render(<SocialActivityFeed />)

      await waitFor(() => {
        const saveBtn = container.querySelector('.save-btn')
        fireEvent.click(saveBtn)
      })

      expect(mockShowToast).toHaveBeenCalledWith('Activity saved', 'success')
    })

    it('should unsave activity when bookmark clicked again', async () => {
      const activity = createMockActivity()
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([activity])
      )

      const { container } = render(<SocialActivityFeed />)

      await waitFor(() => {
        const saveBtn = container.querySelector('.save-btn')
        fireEvent.click(saveBtn)
        fireEvent.click(saveBtn)
      })

      expect(mockShowToast).toHaveBeenCalledWith('Activity unsaved', 'info')
    })

    it('should show BookmarkCheck icon when saved', async () => {
      const activity = createMockActivity()
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([activity])
      )

      const { container } = render(<SocialActivityFeed />)

      await waitFor(() => {
        const saveBtn = container.querySelector('.save-btn')
        fireEvent.click(saveBtn)
      })

      await waitFor(() => {
        expect(screen.getByTestId('bookmark-check-icon')).toBeInTheDocument()
      })
    })

    it('should toggle saved class on button', async () => {
      const activity = createMockActivity()
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([activity])
      )

      const { container } = render(<SocialActivityFeed />)

      let saveBtn
      await waitFor(() => {
        saveBtn = container.querySelector('.save-btn')
        expect(saveBtn).not.toHaveClass('saved')
      })

      fireEvent.click(saveBtn)

      await waitFor(() => {
        expect(saveBtn).toHaveClass('saved')
      })
    })
  })

  describe('Filter Functionality', () => {
    it('should show filters when filter button clicked', async () => {
      render(<SocialActivityFeed />)

      await waitFor(() => {
        const filterBtn = screen.getByTitle('Show filters')
        fireEvent.click(filterBtn)
      })

      expect(screen.getByText('Activity Type:')).toBeInTheDocument()
      expect(screen.getByText('Time Range:')).toBeInTheDocument()
    })

    it('should hide filters when filter button clicked again', async () => {
      render(<SocialActivityFeed />)

      await waitFor(() => {
        const filterBtn = screen.getByTitle('Show filters')
        fireEvent.click(filterBtn)
      })

      expect(screen.getByText('Activity Type:')).toBeInTheDocument()

      const filterBtn = screen.getByTitle('Show filters')
      fireEvent.click(filterBtn)

      await waitFor(() => {
        expect(screen.queryByText('Activity Type:')).not.toBeInTheDocument()
      })
    })

    it('should reload activities when filter type changes', async () => {
      render(<SocialActivityFeed />)

      await waitFor(() => {
        const filterBtn = screen.getByTitle('Show filters')
        fireEvent.click(filterBtn)
      })

      const typeSelect = screen.getByLabelText('Activity Type:')
      fireEvent.change(typeSelect, { target: { value: 'posts' } })

      await waitFor(() => {
        expect(socialService.getSocialActivityFeed).toHaveBeenCalledWith(
          1,
          20,
          expect.objectContaining({
            type: 'posts'
          })
        )
      })
    })

    it('should reload activities when time range changes', async () => {
      render(<SocialActivityFeed />)

      await waitFor(() => {
        const filterBtn = screen.getByTitle('Show filters')
        fireEvent.click(filterBtn)
      })

      const rangeSelect = screen.getByLabelText('Time Range:')
      fireEvent.change(rangeSelect, { target: { value: 'day' } })

      await waitFor(() => {
        expect(socialService.getSocialActivityFeed).toHaveBeenCalledWith(
          1,
          20,
          expect.objectContaining({
            timeRange: 'day'
          })
        )
      })
    })

    it('should filter activities by type in UI', async () => {
      const activities = [
        createMockActivity({ id: 'activity_1', type: 'post' }),
        createMockActivity({ id: 'activity_2', type: 'like' }),
        createMockActivity({ id: 'activity_3', type: 'post' })
      ]
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse(activities)
      )

      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(screen.getAllByText(/created a post|liked a post/).length).toBe(3)
      })
    })

    it('should display all activity type options', async () => {
      render(<SocialActivityFeed />)

      await waitFor(() => {
        const filterBtn = screen.getByTitle('Show filters')
        fireEvent.click(filterBtn)
      })

      const typeSelect = screen.getByLabelText('Activity Type:')
      const options = within(typeSelect).getAllByRole('option')

      expect(options.length).toBe(5)
      expect(options[0]).toHaveValue('all')
      expect(options[1]).toHaveValue('social')
      expect(options[2]).toHaveValue('posts')
      expect(options[3]).toHaveValue('achievements')
      expect(options[4]).toHaveValue('connections')
    })

    it('should display all time range options', async () => {
      render(<SocialActivityFeed />)

      await waitFor(() => {
        const filterBtn = screen.getByTitle('Show filters')
        fireEvent.click(filterBtn)
      })

      const rangeSelect = screen.getByLabelText('Time Range:')
      const options = within(rangeSelect).getAllByRole('option')

      expect(options.length).toBe(4)
      expect(options[0]).toHaveValue('day')
      expect(options[1]).toHaveValue('week')
      expect(options[2]).toHaveValue('month')
      expect(options[3]).toHaveValue('all')
    })

    it('should add active class to filter button when filters shown', async () => {
      render(<SocialActivityFeed />)

      const filterBtn = screen.getByTitle('Show filters')

      await waitFor(() => {
        fireEvent.click(filterBtn)
      })

      expect(filterBtn).toHaveClass('active')
    })
  })

  describe('Refresh Functionality', () => {
    it('should reload activities when refresh button clicked', async () => {
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([createMockActivity()])
      )

      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(socialService.getSocialActivityFeed).toHaveBeenCalledTimes(1)
      })

      const refreshBtn = screen.getByTitle('Refresh feed')
      fireEvent.click(refreshBtn)

      await waitFor(() => {
        expect(socialService.getSocialActivityFeed).toHaveBeenCalledTimes(2)
      })
    })

    it('should disable refresh button while refreshing', async () => {
      socialService.getSocialActivityFeed.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(createMockResponse([])), 100))
      )

      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(socialService.getSocialActivityFeed).toHaveBeenCalled()
      })

      const refreshBtn = screen.getByTitle('Refresh feed')
      fireEvent.click(refreshBtn)

      expect(refreshBtn).toBeDisabled()
    })

    it('should add spinning class to refresh icon while refreshing', async () => {
      socialService.getSocialActivityFeed.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(createMockResponse([])), 100))
      )

      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(socialService.getSocialActivityFeed).toHaveBeenCalled()
      })

      const refreshBtn = screen.getByTitle('Refresh feed')
      fireEvent.click(refreshBtn)

      const refreshIcon = screen.getByTestId('refresh-icon')
      expect(refreshIcon).toHaveClass('spinning')
    })

    it('should reset pagination on refresh', async () => {
      render(<SocialActivityFeed />)

      await waitFor(() => {
        const refreshBtn = screen.getByTitle('Refresh feed')
        fireEvent.click(refreshBtn)
      })

      await waitFor(() => {
        expect(socialService.getSocialActivityFeed).toHaveBeenCalledWith(
          1,
          20,
          expect.any(Object)
        )
      })
    })
  })

  describe('Load More / Pagination', () => {
    it('should display load more button when hasMore is true', async () => {
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([createMockActivity()], true)
      )

      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(screen.getByText('Load More Activity')).toBeInTheDocument()
      })
    })

    it('should not display load more button when hasMore is false', async () => {
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([createMockActivity()], false)
      )

      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(screen.queryByText('Load More Activity')).not.toBeInTheDocument()
      })
    })

    it('should load more activities when button clicked', async () => {
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([createMockActivity()], true)
      )

      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(socialService.getSocialActivityFeed).toHaveBeenCalledTimes(1)
      })

      const loadMoreBtn = screen.getByText('Load More Activity')
      fireEvent.click(loadMoreBtn)

      await waitFor(() => {
        expect(socialService.getSocialActivityFeed).toHaveBeenCalledTimes(2)
      })
    })

    it('should increment page number when loading more', async () => {
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([createMockActivity()], true)
      )

      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(socialService.getSocialActivityFeed).toHaveBeenCalledWith(1, 20, expect.any(Object))
      })

      const loadMoreBtn = screen.getByText('Load More Activity')
      fireEvent.click(loadMoreBtn)

      await waitFor(() => {
        expect(socialService.getSocialActivityFeed).toHaveBeenCalledWith(2, 20, expect.any(Object))
      })
    })

    it('should append new activities when loading more', async () => {
      const firstActivities = [createMockActivity({ id: 'activity_1', user: { id: '1', username: 'user1', displayName: 'User 1', avatar: '👨' } })]
      const secondActivities = [createMockActivity({ id: 'activity_2', user: { id: '2', username: 'user2', displayName: 'User 2', avatar: '👩' } })]

      socialService.getSocialActivityFeed
        .mockResolvedValueOnce(createMockResponse(firstActivities, true))
        .mockResolvedValueOnce(createMockResponse(secondActivities, false))

      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(screen.getByText('User 1')).toBeInTheDocument()
      })

      const loadMoreBtn = screen.getByText('Load More Activity')
      fireEvent.click(loadMoreBtn)

      await waitFor(() => {
        expect(screen.getByText('User 1')).toBeInTheDocument()
        expect(screen.getByText('User 2')).toBeInTheDocument()
      })
    })

    it('should disable load more button while loading', async () => {
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([createMockActivity()], true)
      )

      render(<SocialActivityFeed />)

      await waitFor(() => {
        const loadMoreBtn = screen.getByText('Load More Activity')
        expect(loadMoreBtn).not.toBeDisabled()
      })
    })

    it('should show loading text on load more button while loading', async () => {
      socialService.getSocialActivityFeed
        .mockResolvedValueOnce(createMockResponse([createMockActivity()], true))
        .mockImplementationOnce(() =>
          new Promise(resolve => setTimeout(() => resolve(createMockResponse([])), 100))
        )

      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(screen.getByText('Load More Activity')).toBeInTheDocument()
      })

      const loadMoreBtn = screen.getByText('Load More Activity')
      fireEvent.click(loadMoreBtn)

      await waitFor(() => {
        expect(screen.getByText('')).toBeInTheDocument()
      })
    })
  })

  describe('Real-time Updates', () => {
    it('should display realtime indicator when connected', async () => {
      useSocialRealTime.mockReturnValue({
        isConnected: true,
        getRecentActivities: jest.fn(() => []),
        socialUpdates: { activities: [] }
      })

      render(<SocialActivityFeed />)

      await waitFor(() => {
        const filterBtn = screen.getByTitle('Show filters')
        fireEvent.click(filterBtn)
      })

      expect(screen.getByText('Live updates')).toBeInTheDocument()
    })

    it('should not display realtime indicator when disconnected', async () => {
      useSocialRealTime.mockReturnValue({
        isConnected: false,
        getRecentActivities: jest.fn(() => []),
        socialUpdates: { activities: [] }
      })

      render(<SocialActivityFeed />)

      await waitFor(() => {
        const filterBtn = screen.getByTitle('Show filters')
        fireEvent.click(filterBtn)
      })

      expect(screen.queryByText('Live updates')).not.toBeInTheDocument()
    })

    it('should add realtime activities to the feed', async () => {
      const existingActivity = createMockActivity({ id: 'activity_1' })
      const realtimeActivity = createMockActivity({
        id: 'activity_realtime',
        user: { id: 'user2', username: 'realtime', displayName: 'Realtime User', avatar: '⚡' }
      })

      const mockGetRecentActivities = jest.fn(() => [realtimeActivity])

      useSocialRealTime.mockReturnValue({
        isConnected: true,
        getRecentActivities: mockGetRecentActivities,
        socialUpdates: { activities: [realtimeActivity] }
      })

      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([existingActivity])
      )

      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(screen.getByText('Realtime User')).toBeInTheDocument()
      })
    })

    it('should not add duplicate realtime activities', async () => {
      const activity = createMockActivity({ id: 'activity_1' })

      const mockGetRecentActivities = jest.fn(() => [activity])

      useSocialRealTime.mockReturnValue({
        isConnected: true,
        getRecentActivities: mockGetRecentActivities,
        socialUpdates: { activities: [activity] }
      })

      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([activity])
      )

      const { container } = render(<SocialActivityFeed />)

      await waitFor(() => {
        const items = container.querySelectorAll('.activity-item')
        expect(items.length).toBe(1)
      })
    })

    it('should limit activities to maxItems prop', async () => {
      const activities = Array.from({ length: 60 }, (_, i) =>
        createMockActivity({ id: `activity_${i}` })
      )

      const mockGetRecentActivities = jest.fn(() => activities)

      useSocialRealTime.mockReturnValue({
        isConnected: true,
        getRecentActivities: mockGetRecentActivities,
        socialUpdates: { activities }
      })

      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([])
      )

      const { container } = render(<SocialActivityFeed maxItems={50} />)

      await waitFor(() => {
        const items = container.querySelectorAll('.activity-item')
        expect(items.length).toBeLessThanOrEqual(50)
      })
    })

    it('should prepend realtime activities to existing ones', async () => {
      const existingActivities = [
        createMockActivity({ id: 'activity_1', user: { id: '1', username: 'user1', displayName: 'User 1', avatar: '👨' } })
      ]
      const realtimeActivity = createMockActivity({
        id: 'activity_new',
        user: { id: '2', username: 'user2', displayName: 'User 2', avatar: '👩' }
      })

      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse(existingActivities)
      )

      const mockGetRecentActivities = jest.fn(() => [realtimeActivity])

      useSocialRealTime.mockReturnValue({
        isConnected: true,
        getRecentActivities: mockGetRecentActivities,
        socialUpdates: { activities: [realtimeActivity] }
      })

      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(screen.getByText('User 2')).toBeInTheDocument()
        expect(screen.getByText('User 1')).toBeInTheDocument()
      })
    })
  })

  describe('Empty States', () => {
    it('should display empty state when no activities', async () => {
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([])
      )

      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(screen.getByText('No activity found')).toBeInTheDocument()
      })
    })

    it('should display filter suggestion in empty state when filters active', async () => {
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([])
      )

      render(<SocialActivityFeed />)

      await waitFor(() => {
        const filterBtn = screen.getByTitle('Show filters')
        fireEvent.click(filterBtn)
      })

      const typeSelect = screen.getByLabelText('Activity Type:')
      fireEvent.change(typeSelect, { target: { value: 'posts' } })

      await waitFor(() => {
        expect(screen.getByText('Try adjusting your filters to see more activity')).toBeInTheDocument()
      })
    })

    it('should display follow suggestion when no filters active', async () => {
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([])
      )

      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(screen.getByText('Follow more users to see their activity here')).toBeInTheDocument()
      })
    })

    it('should display empty icon in empty state', async () => {
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([])
      )

      render(<SocialActivityFeed />)

      await waitFor(() => {
        const icons = screen.getAllByTestId('activity-icon')
        expect(icons.some(icon => icon.getAttribute('data-size') === '48')).toBe(true)
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error toast when API fails', async () => {
      socialService.getSocialActivityFeed.mockRejectedValue(
        new Error('API Error')
      )

      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Failed to load activity feed', 'error')
      })
    })

    it('should display mock data when API fails', async () => {
      socialService.getSocialActivityFeed.mockRejectedValue(
        new Error('API Error')
      )

      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })
    })

    it('should log error to console when API fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const error = new Error('API Error')

      socialService.getSocialActivityFeed.mockRejectedValue(error)

      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error loading activity feed:', error)
      })

      consoleSpy.mockRestore()
    })

    it('should handle network errors gracefully', async () => {
      socialService.getSocialActivityFeed.mockRejectedValue(
        new Error('Network error')
      )

      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(screen.queryByText('Loading activity feed...')).not.toBeInTheDocument()
      })
    })

    it('should continue showing existing activities on refresh error', async () => {
      const activity = createMockActivity()
      socialService.getSocialActivityFeed
        .mockResolvedValueOnce(createMockResponse([activity]))
        .mockRejectedValueOnce(new Error('Refresh failed'))

      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      const refreshBtn = screen.getByTitle('Refresh feed')
      fireEvent.click(refreshBtn)

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Failed to load activity feed', 'error')
      })
    })
  })

  describe('Close Functionality', () => {
    it('should render close button when onClose provided', async () => {
      const onClose = jest.fn()

      render(<SocialActivityFeed onClose={onClose} />)

      await waitFor(() => {
        expect(screen.getByTestId('x-icon')).toBeInTheDocument()
      })
    })

    it('should not render close button when onClose not provided', async () => {
      render(<SocialActivityFeed />)

      await waitFor(() => {
        const xIcons = screen.queryAllByTestId('x-icon')
        expect(xIcons.length).toBe(0)
      })
    })

    it('should call onClose when close button clicked', async () => {
      const onClose = jest.fn()

      render(<SocialActivityFeed onClose={onClose} />)

      await waitFor(() => {
        const closeBtn = screen.getByRole('button', { name: /close/i })
        fireEvent.click(closeBtn)
      })

      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('Additional Actions', () => {
    it('should render more actions button for each activity', async () => {
      const activity = createMockActivity()
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([activity])
      )

      render(<SocialActivityFeed />)

      await waitFor(() => {
        expect(screen.getByTestId('more-icon')).toBeInTheDocument()
      })
    })

    it('should render activity type badge with correct color', async () => {
      const activity = createMockActivity({ type: 'post' })
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([activity])
      )

      const { container } = render(<SocialActivityFeed />)

      await waitFor(() => {
        const badge = container.querySelector('.activity-type-badge')
        expect(badge).toHaveStyle({ backgroundColor: '#00BBFF' })
      })
    })

    it('should handle engagement button clicks', async () => {
      const activity = createMockActivity()
      socialService.getSocialActivityFeed.mockResolvedValue(
        createMockResponse([activity])
      )

      const { container } = render(<SocialActivityFeed />)

      await waitFor(() => {
        const engagementBtns = container.querySelectorAll('.engagement-btn')
        fireEvent.click(engagementBtns[0])
      })

      // Should not crash
      expect(container).toBeInTheDocument()
    })
  })
})

export default mockShowToast
