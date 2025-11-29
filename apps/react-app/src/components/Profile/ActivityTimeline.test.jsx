import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import ActivityTimeline from './ActivityTimeline'
import { AuthContext } from '../../contexts/AuthContext'
import { ToastContext } from '../ui/useToast'
import profileService from '../../services/profileService'

jest.mock('../../services/profileService')

const mockUser = {
  id: 'user123',
  username: 'testuser',
  displayName: 'Test User',
  avatar: null
}

const mockActivities = [
  {
    id: 'activity_1',
    type: 'post',
    timestamp: new Date('2025-11-07T10:00:00Z').toISOString(),
    user: mockUser,
    data: {
      title: 'Test Post Title',
      content: 'This is test post content',
      community: { name: 'Test Community', slug: 'test' }
    },
    visibility: 'public',
    reactions: {
      likes: 10,
      comments: 5
    }
  },
  {
    id: 'activity_2',
    type: 'comment',
    timestamp: new Date('2025-11-07T09:00:00Z').toISOString(),
    user: mockUser,
    data: {
      content: 'Great comment here!',
      post: { title: 'Original Post', id: 'post_123' }
    },
    visibility: 'public',
    reactions: {
      likes: 3,
      comments: 1
    }
  },
  {
    id: 'activity_3',
    type: 'reaction',
    timestamp: new Date('2025-11-06T15:00:00Z').toISOString(),
    user: mockUser,
    data: {
      type: 'like',
      target: { type: 'post', title: 'Liked Post', id: 'post_456' }
    },
    visibility: 'public',
    reactions: {
      likes: 0,
      comments: 0
    }
  },
  {
    id: 'activity_4',
    type: 'follow',
    timestamp: new Date('2025-11-06T14:00:00Z').toISOString(),
    user: mockUser,
    data: {
      target: { username: 'followeduser', displayName: 'Followed User', avatar: null }
    },
    visibility: 'public',
    reactions: {
      likes: 0,
      comments: 0
    }
  },
  {
    id: 'activity_5',
    type: 'achievement',
    timestamp: new Date('2025-11-05T12:00:00Z').toISOString(),
    user: mockUser,
    data: {
      badge: 'Community Builder',
      description: 'Helped grow a community to 1000+ members',
      rarity: 'rare'
    },
    visibility: 'public',
    reactions: {
      likes: 25,
      comments: 8
    }
  },
  {
    id: 'activity_6',
    type: 'join_community',
    timestamp: new Date('2025-11-05T11:00:00Z').toISOString(),
    user: mockUser,
    data: {
      community: { name: 'Web3 Developers', slug: 'web3-dev', memberCount: 2500 }
    },
    visibility: 'public',
    reactions: {
      likes: 2,
      comments: 0
    }
  }
]

const mockAuthContext = {
  user: mockUser,
  loading: false,
  login: jest.fn(),
  logout: jest.fn()
}

const mockToastContext = {
  showToast: jest.fn()
}

const renderWithProviders = (ui, { authValue = mockAuthContext, toastValue = mockToastContext } = {}) => {
  return render(
    <AuthContext.Provider value={authValue}>
      <ToastContext.Provider value={toastValue}>
        {ui}
      </ToastContext.Provider>
    </AuthContext.Provider>
  )
}

describe('ActivityTimeline Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-11-07T12:00:00Z'))
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Initial Rendering', () => {
    test('renders loading state initially', () => {
      profileService.getUserActivity.mockImplementation(() => new Promise(() => {}))

      renderWithProviders(<ActivityTimeline />)

      expect(screen.getByTestId('activity-timeline')).toHaveClass('activity-timeline--loading')
      const skeletons = screen.getAllByTestId('activity-skeleton')
      expect(skeletons).toHaveLength(5)
    })

    test('renders with default props', async () => {
      profileService.getUserActivity.mockResolvedValue({ activities: mockActivities })

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        expect(screen.queryByTestId('activity-skeleton')).not.toBeInTheDocument()
      })

      expect(screen.getByText('Activity Timeline')).toBeInTheDocument()
    })

    test('renders with custom className', async () => {
      profileService.getUserActivity.mockResolvedValue({ activities: [] })

      renderWithProviders(<ActivityTimeline className="custom-class" />)

      await waitFor(() => {
        expect(screen.getByTestId('activity-timeline')).toHaveClass('custom-class')
      })
    })

    test('renders with userId prop', async () => {
      profileService.getUserActivity.mockResolvedValue({ activities: mockActivities })

      renderWithProviders(<ActivityTimeline userId="user456" />)

      await waitFor(() => {
        expect(profileService.getUserActivity).toHaveBeenCalledWith(
          'user456',
          expect.any(Number),
          expect.any(Number),
          expect.any(Object)
        )
      })
    })

    test('renders with limit prop', async () => {
      profileService.getUserActivity.mockResolvedValue({ activities: mockActivities })

      renderWithProviders(<ActivityTimeline limit={10} />)

      await waitFor(() => {
        expect(profileService.getUserActivity).toHaveBeenCalledWith(
          null,
          1,
          10,
          expect.any(Object)
        )
      })
    })

    test('calls getUserActivity on mount', async () => {
      profileService.getUserActivity.mockResolvedValue({ activities: mockActivities })

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        expect(profileService.getUserActivity).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Activity Display', () => {
    test('displays activities after loading', async () => {
      profileService.getUserActivity.mockResolvedValue({ activities: mockActivities })

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        expect(screen.getByText(/Test Post Title/)).toBeInTheDocument()
        expect(screen.getByText(/Great comment here!/)).toBeInTheDocument()
      })
    })

    test('displays post activity correctly', async () => {
      const postActivity = [mockActivities[0]]
      profileService.getUserActivity.mockResolvedValue({ activities: postActivity })

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        expect(screen.getByText(/Created a new post in Test Community/)).toBeInTheDocument()
        expect(screen.getByText('Test Post Title')).toBeInTheDocument()
        expect(screen.getByText(/This is test post content/)).toBeInTheDocument()
      })
    })

    test('displays comment activity correctly', async () => {
      const commentActivity = [mockActivities[1]]
      profileService.getUserActivity.mockResolvedValue({ activities: commentActivity })

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        expect(screen.getByText(/Commented on "Original Post"/)).toBeInTheDocument()
        expect(screen.getByText(/"Great comment here!"/)).toBeInTheDocument()
      })
    })

    test('displays reaction activity correctly', async () => {
      const reactionActivity = [mockActivities[2]]
      profileService.getUserActivity.mockResolvedValue({ activities: reactionActivity })

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        expect(screen.getByText(/Liked "Liked Post"/)).toBeInTheDocument()
      })
    })

    test('displays follow activity correctly', async () => {
      const followActivity = [mockActivities[3]]
      profileService.getUserActivity.mockResolvedValue({ activities: followActivity })

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        expect(screen.getByText(/Started following Followed User/)).toBeInTheDocument()
      })
    })

    test('displays achievement activity correctly', async () => {
      const achievementActivity = [mockActivities[4]]
      profileService.getUserActivity.mockResolvedValue({ activities: achievementActivity })

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        expect(screen.getByText(/Earned the "Community Builder" achievement/)).toBeInTheDocument()
        expect(screen.getByText('Community Builder')).toBeInTheDocument()
        expect(screen.getByText('Helped grow a community to 1000+ members')).toBeInTheDocument()
      })
    })

    test('displays join_community activity correctly', async () => {
      const joinActivity = [mockActivities[5]]
      profileService.getUserActivity.mockResolvedValue({ activities: joinActivity })

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        expect(screen.getByText(/Joined the Web3 Developers community/)).toBeInTheDocument()
        expect(screen.getByText('2,500 members')).toBeInTheDocument()
      })
    })

    test('displays reaction counts for full variant', async () => {
      profileService.getUserActivity.mockResolvedValue({ activities: [mockActivities[0]] })

      renderWithProviders(<ActivityTimeline variant="full" />)

      await waitFor(() => {
        expect(screen.getByText('10')).toBeInTheDocument()
        expect(screen.getByText('5')).toBeInTheDocument()
      })
    })

    test('does not display reaction counts for compact variant', async () => {
      profileService.getUserActivity.mockResolvedValue({ activities: [mockActivities[0]] })

      renderWithProviders(<ActivityTimeline variant="compact" />)

      await waitFor(() => {
        const activityItems = screen.getAllByTestId('activity-item')
        activityItems.forEach(item => {
          expect(within(item).queryByTestId('activity-reactions')).not.toBeInTheDocument()
        })
      })
    })
  })

  describe('Time Formatting', () => {
    test('displays "Just now" for recent activities', async () => {
      const recentActivity = [{
        ...mockActivities[0],
        timestamp: new Date('2025-11-07T11:59:30Z').toISOString()
      }]
      profileService.getUserActivity.mockResolvedValue({ activities: recentActivity })

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        expect(screen.getByText('Just now')).toBeInTheDocument()
      })
    })

    test('displays minutes ago for recent activities', async () => {
      const recentActivity = [{
        ...mockActivities[0],
        timestamp: new Date('2025-11-07T11:45:00Z').toISOString()
      }]
      profileService.getUserActivity.mockResolvedValue({ activities: recentActivity })

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        expect(screen.getByText('15m ago')).toBeInTheDocument()
      })
    })

    test('displays hours ago for activities within 24 hours', async () => {
      const recentActivity = [{
        ...mockActivities[0],
        timestamp: new Date('2025-11-07T09:00:00Z').toISOString()
      }]
      profileService.getUserActivity.mockResolvedValue({ activities: recentActivity })

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        expect(screen.getByText('3h ago')).toBeInTheDocument()
      })
    })

    test('displays days ago for activities within a month', async () => {
      const recentActivity = [{
        ...mockActivities[0],
        timestamp: new Date('2025-11-04T12:00:00Z').toISOString()
      }]
      profileService.getUserActivity.mockResolvedValue({ activities: recentActivity })

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        expect(screen.getByText('3d ago')).toBeInTheDocument()
      })
    })

    test('displays date for older activities', async () => {
      const oldActivity = [{
        ...mockActivities[0],
        timestamp: new Date('2025-09-01T12:00:00Z').toISOString()
      }]
      profileService.getUserActivity.mockResolvedValue({ activities: oldActivity })

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        expect(screen.getByText(/9\/1\/2025/)).toBeInTheDocument()
      })
    })
  })

  describe('Group By Date', () => {
    test('groups activities by date', async () => {
      profileService.getUserActivity.mockResolvedValue({ activities: mockActivities })

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        expect(screen.getByText('Today')).toBeInTheDocument()
        expect(screen.getByText('Yesterday')).toBeInTheDocument()
      })
    })

    test('displays "Today" for current date', async () => {
      const todayActivities = mockActivities.filter(a =>
        new Date(a.timestamp).toDateString() === new Date('2025-11-07').toDateString()
      )
      profileService.getUserActivity.mockResolvedValue({ activities: todayActivities })

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        expect(screen.getByText('Today')).toBeInTheDocument()
      })
    })

    test('displays "Yesterday" for previous date', async () => {
      const yesterdayActivities = mockActivities.filter(a =>
        new Date(a.timestamp).toDateString() === new Date('2025-11-06').toDateString()
      )
      profileService.getUserActivity.mockResolvedValue({ activities: yesterdayActivities })

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        expect(screen.getByText('Yesterday')).toBeInTheDocument()
      })
    })

    test('displays formatted date for older dates', async () => {
      const olderActivities = mockActivities.filter(a =>
        new Date(a.timestamp).toDateString() === new Date('2025-11-05').toDateString()
      )
      profileService.getUserActivity.mockResolvedValue({ activities: olderActivities })

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        expect(screen.getByText(/Tuesday, November 5/)).toBeInTheDocument()
      })
    })

    test('groups multiple activities on same date', async () => {
      profileService.getUserActivity.mockResolvedValue({ activities: mockActivities })

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        const todaySection = screen.getByText('Today').closest('.timeline-day')
        const todayActivities = within(todaySection).getAllByTestId('activity-item')
        expect(todayActivities.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Filters', () => {
    test('displays filter panel when showFilters is true', async () => {
      profileService.getUserActivity.mockResolvedValue({ activities: mockActivities })

      renderWithProviders(<ActivityTimeline showFilters={true} />)

      await waitFor(() => {
        expect(screen.getByText('Filters')).toBeInTheDocument()
      })
    })

    test('hides filter panel when showFilters is false', async () => {
      profileService.getUserActivity.mockResolvedValue({ activities: mockActivities })

      renderWithProviders(<ActivityTimeline showFilters={false} />)

      await waitFor(() => {
        expect(screen.queryByText('Filters')).not.toBeInTheDocument()
      })
    })

    test('toggles filter panel on button click', async () => {
      profileService.getUserActivity.mockResolvedValue({ activities: mockActivities })

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        expect(screen.getByText('Activity Timeline')).toBeInTheDocument()
      })

      const filterButton = screen.getByRole('button', { name: /Filters/ })
      fireEvent.click(filterButton)

      expect(screen.getByLabelText('Activity Type')).toBeInTheDocument()
      expect(screen.getByLabelText('Time Period')).toBeInTheDocument()
      expect(screen.getByLabelText('Visibility')).toBeInTheDocument()
    })

    test('filters by activity type - posts', async () => {
      profileService.getUserActivity.mockResolvedValue({ activities: mockActivities })

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        expect(screen.getByText('Activity Timeline')).toBeInTheDocument()
      })

      const filterButton = screen.getByRole('button', { name: /Filters/ })
      fireEvent.click(filterButton)

      const typeSelect = screen.getByLabelText('Activity Type')
      fireEvent.change(typeSelect, { target: { value: 'posts' } })

      await waitFor(() => {
        expect(profileService.getUserActivity).toHaveBeenCalledWith(
          null,
          1,
          20,
          expect.objectContaining({ type: 'posts' })
        )
      })
    })

    test('filters by activity type - comments', async () => {
      profileService.getUserActivity.mockResolvedValue({ activities: mockActivities })

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        expect(screen.getByText('Activity Timeline')).toBeInTheDocument()
      })

      const filterButton = screen.getByRole('button', { name: /Filters/ })
      fireEvent.click(filterButton)

      const typeSelect = screen.getByLabelText('Activity Type')
      fireEvent.change(typeSelect, { target: { value: 'comments' } })

      await waitFor(() => {
        expect(profileService.getUserActivity).toHaveBeenCalledWith(
          null,
          1,
          20,
          expect.objectContaining({ type: 'comments' })
        )
      })
    })

    test('filters by activity type - reactions', async () => {
      profileService.getUserActivity.mockResolvedValue({ activities: mockActivities })

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        expect(screen.getByText('Activity Timeline')).toBeInTheDocument()
      })

      const filterButton = screen.getByRole('button', { name: /Filters/ })
      fireEvent.click(filterButton)

      const typeSelect = screen.getByLabelText('Activity Type')
      fireEvent.change(typeSelect, { target: { value: 'reactions' } })

      await waitFor(() => {
        expect(profileService.getUserActivity).toHaveBeenCalledWith(
          null,
          1,
          20,
          expect.objectContaining({ type: 'reactions' })
        )
      })
    })

    test('filters by activity type - follows', async () => {
      profileService.getUserActivity.mockResolvedValue({ activities: mockActivities })

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        expect(screen.getByText('Activity Timeline')).toBeInTheDocument()
      })

      const filterButton = screen.getByRole('button', { name: /Filters/ })
      fireEvent.click(filterButton)

      const typeSelect = screen.getByLabelText('Activity Type')
      fireEvent.change(typeSelect, { target: { value: 'follows' } })

      await waitFor(() => {
        expect(profileService.getUserActivity).toHaveBeenCalledWith(
          null,
          1,
          20,
          expect.objectContaining({ type: 'follows' })
        )
      })
    })

    test('filters by activity type - achievements', async () => {
      profileService.getUserActivity.mockResolvedValue({ activities: mockActivities })

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        expect(screen.getByText('Activity Timeline')).toBeInTheDocument()
      })

      const filterButton = screen.getByRole('button', { name: /Filters/ })
      fireEvent.click(filterButton)

      const typeSelect = screen.getByLabelText('Activity Type')
      fireEvent.change(typeSelect, { target: { value: 'achievements' } })

      await waitFor(() => {
        expect(profileService.getUserActivity).toHaveBeenCalledWith(
          null,
          1,
          20,
          expect.objectContaining({ type: 'achievements' })
        )
      })
    })

    test('filters by timeframe - today', async () => {
      profileService.getUserActivity.mockResolvedValue({ activities: mockActivities })

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        expect(screen.getByText('Activity Timeline')).toBeInTheDocument()
      })

      const filterButton = screen.getByRole('button', { name: /Filters/ })
      fireEvent.click(filterButton)

      const timeframeSelect = screen.getByLabelText('Time Period')
      fireEvent.change(timeframeSelect, { target: { value: 'today' } })

      await waitFor(() => {
        expect(profileService.getUserActivity).toHaveBeenCalledWith(
          null,
          1,
          20,
          expect.objectContaining({ timeframe: 'today' })
        )
      })
    })

    test('filters by timeframe - week', async () => {
      profileService.getUserActivity.mockResolvedValue({ activities: mockActivities })

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        expect(screen.getByText('Activity Timeline')).toBeInTheDocument()
      })

      const filterButton = screen.getByRole('button', { name: /Filters/ })
      fireEvent.click(filterButton)

      const timeframeSelect = screen.getByLabelText('Time Period')
      fireEvent.change(timeframeSelect, { target: { value: 'week' } })

      await waitFor(() => {
        expect(profileService.getUserActivity).toHaveBeenCalledWith(
          null,
          1,
          20,
          expect.objectContaining({ timeframe: 'week' })
        )
      })
    })

    test('filters by visibility', async () => {
      profileService.getUserActivity.mockResolvedValue({ activities: mockActivities })

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        expect(screen.getByText('Activity Timeline')).toBeInTheDocument()
      })

      const filterButton = screen.getByRole('button', { name: /Filters/ })
      fireEvent.click(filterButton)

      const visibilitySelect = screen.getByLabelText('Visibility')
      fireEvent.change(visibilitySelect, { target: { value: 'friends' } })

      await waitFor(() => {
        expect(profileService.getUserActivity).toHaveBeenCalledWith(
          null,
          1,
          20,
          expect.objectContaining({ visibility: 'friends' })
        )
      })
    })

    test('resets page when filters change', async () => {
      profileService.getUserActivity.mockResolvedValue({ activities: mockActivities })

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        expect(screen.getByText('Activity Timeline')).toBeInTheDocument()
      })

      const filterButton = screen.getByRole('button', { name: /Filters/ })
      fireEvent.click(filterButton)

      const typeSelect = screen.getByLabelText('Activity Type')
      fireEvent.change(typeSelect, { target: { value: 'posts' } })

      await waitFor(() => {
        const lastCall = profileService.getUserActivity.mock.calls[profileService.getUserActivity.mock.calls.length - 1]
        expect(lastCall[1]).toBe(1)
      })
    })
  })

  describe('Load More Activities', () => {
    test('displays load more button when hasMore is true', async () => {
      const limitedActivities = mockActivities.slice(0, 20)
      profileService.getUserActivity.mockResolvedValue({ activities: limitedActivities })

      renderWithProviders(<ActivityTimeline limit={20} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Load More Activities/ })).toBeInTheDocument()
      })
    })

    test('does not display load more button when hasMore is false', async () => {
      const limitedActivities = mockActivities.slice(0, 5)
      profileService.getUserActivity.mockResolvedValue({ activities: limitedActivities })

      renderWithProviders(<ActivityTimeline limit={20} />)

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Load More Activities/ })).not.toBeInTheDocument()
      })
    })

    test('loads more activities on button click', async () => {
      const firstBatch = mockActivities.slice(0, 3)
      const secondBatch = mockActivities.slice(3, 6)

      profileService.getUserActivity
        .mockResolvedValueOnce({ activities: firstBatch })
        .mockResolvedValueOnce({ activities: secondBatch })

      renderWithProviders(<ActivityTimeline limit={3} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Load More Activities/ })).toBeInTheDocument()
      })

      const loadMoreButton = screen.getByRole('button', { name: /Load More Activities/ })
      fireEvent.click(loadMoreButton)

      await waitFor(() => {
        expect(profileService.getUserActivity).toHaveBeenCalledTimes(2)
        expect(profileService.getUserActivity).toHaveBeenNthCalledWith(2, null, 2, 3, expect.any(Object))
      })
    })

    test('displays loading spinner when loading more', async () => {
      const firstBatch = mockActivities.slice(0, 3)
      profileService.getUserActivity
        .mockResolvedValueOnce({ activities: firstBatch })
        .mockImplementation(() => new Promise(() => {}))

      renderWithProviders(<ActivityTimeline limit={3} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Load More Activities/ })).toBeInTheDocument()
      })

      const loadMoreButton = screen.getByRole('button', { name: /Load More Activities/ })
      fireEvent.click(loadMoreButton)

      await waitFor(() => {
        expect(screen.getByText('Loading more activities...')).toBeInTheDocument()
      })
    })

    test('appends new activities to existing list', async () => {
      const firstBatch = [mockActivities[0]]
      const secondBatch = [mockActivities[1]]

      profileService.getUserActivity
        .mockResolvedValueOnce({ activities: firstBatch })
        .mockResolvedValueOnce({ activities: secondBatch })

      renderWithProviders(<ActivityTimeline limit={1} />)

      await waitFor(() => {
        expect(screen.getByText(/Test Post Title/)).toBeInTheDocument()
      })

      const loadMoreButton = screen.getByRole('button', { name: /Load More Activities/ })
      fireEvent.click(loadMoreButton)

      await waitFor(() => {
        expect(screen.getByText(/Test Post Title/)).toBeInTheDocument()
        expect(screen.getByText(/Great comment here!/)).toBeInTheDocument()
      })
    })

    test('increments page number after loading more', async () => {
      const firstBatch = mockActivities.slice(0, 2)
      const secondBatch = mockActivities.slice(2, 4)

      profileService.getUserActivity
        .mockResolvedValueOnce({ activities: firstBatch })
        .mockResolvedValueOnce({ activities: secondBatch })

      renderWithProviders(<ActivityTimeline limit={2} />)

      await waitFor(() => {
        expect(profileService.getUserActivity).toHaveBeenCalledWith(null, 1, 2, expect.any(Object))
      })

      const loadMoreButton = screen.getByRole('button', { name: /Load More Activities/ })
      fireEvent.click(loadMoreButton)

      await waitFor(() => {
        expect(profileService.getUserActivity).toHaveBeenCalledWith(null, 2, 2, expect.any(Object))
      })
    })
  })

  describe('Empty States', () => {
    test('displays empty state when no activities', async () => {
      profileService.getUserActivity.mockResolvedValue({ activities: [] })

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        expect(screen.getByText('No Activity Yet')).toBeInTheDocument()
        expect(screen.getByText('Start engaging with the community to see your activity here!')).toBeInTheDocument()
      })
    })

    test('displays empty state with correct icon', async () => {
      profileService.getUserActivity.mockResolvedValue({ activities: [] })

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        const emptyState = screen.getByTestId('timeline-empty')
        expect(within(emptyState).getByTestId('clock-icon')).toBeInTheDocument()
      })
    })

    test('does not display activities when empty', async () => {
      profileService.getUserActivity.mockResolvedValue({ activities: [] })

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        expect(screen.queryByTestId('activity-item')).not.toBeInTheDocument()
      })
    })
  })

  describe('API Integration', () => {
    test('calls profileService with correct parameters', async () => {
      profileService.getUserActivity.mockResolvedValue({ activities: mockActivities })

      renderWithProviders(<ActivityTimeline userId="user123" limit={15} />)

      await waitFor(() => {
        expect(profileService.getUserActivity).toHaveBeenCalledWith(
          'user123',
          1,
          15,
          expect.any(Object)
        )
      })
    })

    test('handles successful API response', async () => {
      profileService.getUserActivity.mockResolvedValue({ activities: mockActivities })

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        expect(screen.getByText(/Test Post Title/)).toBeInTheDocument()
      })
    })

    test('retries with different filters', async () => {
      profileService.getUserActivity
        .mockResolvedValueOnce({ activities: mockActivities })
        .mockResolvedValueOnce({ activities: [mockActivities[0]] })

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        expect(screen.getByText('Activity Timeline')).toBeInTheDocument()
      })

      const filterButton = screen.getByRole('button', { name: /Filters/ })
      fireEvent.click(filterButton)

      const typeSelect = screen.getByLabelText('Activity Type')
      fireEvent.change(typeSelect, { target: { value: 'posts' } })

      await waitFor(() => {
        expect(profileService.getUserActivity).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Error Handling', () => {
    test('falls back to mock data on API error', async () => {
      profileService.getUserActivity.mockRejectedValue(new Error('API Error'))

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        const activityItems = screen.queryAllByTestId('activity-item')
        expect(activityItems.length).toBeGreaterThan(0)
      })
    })

    test('logs error to console on API failure', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      profileService.getUserActivity.mockRejectedValue(new Error('API Error'))

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Error loading activities:', expect.any(Error))
      })

      consoleError.mockRestore()
    })

    test('handles network timeout gracefully', async () => {
      profileService.getUserActivity.mockRejectedValue(new Error('Network timeout'))

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        expect(screen.queryByTestId('activity-skeleton')).not.toBeInTheDocument()
      })
    })

    test('handles empty response from API', async () => {
      profileService.getUserActivity.mockResolvedValue({ activities: null })

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        expect(screen.getByText('No Activity Yet')).toBeInTheDocument()
      })
    })

    test('handles undefined response from API', async () => {
      profileService.getUserActivity.mockResolvedValue({})

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        expect(screen.getByText('No Activity Yet')).toBeInTheDocument()
      })
    })
  })

  describe('Loading States', () => {
    test('shows loading skeleton initially', () => {
      profileService.getUserActivity.mockImplementation(() => new Promise(() => {}))

      renderWithProviders(<ActivityTimeline />)

      expect(screen.getAllByTestId('activity-skeleton')).toHaveLength(5)
    })

    test('removes loading state after data loads', async () => {
      profileService.getUserActivity.mockResolvedValue({ activities: mockActivities })

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        expect(screen.queryByTestId('activity-skeleton')).not.toBeInTheDocument()
      })
    })

    test('shows loadingMore state separately from initial loading', async () => {
      const firstBatch = mockActivities.slice(0, 2)
      const secondBatch = mockActivities.slice(2, 4)

      profileService.getUserActivity
        .mockResolvedValueOnce({ activities: firstBatch })
        .mockImplementation(() => new Promise(() => {}))

      renderWithProviders(<ActivityTimeline limit={2} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Load More Activities/ })).toBeInTheDocument()
      })

      const loadMoreButton = screen.getByRole('button', { name: /Load More Activities/ })
      fireEvent.click(loadMoreButton)

      await waitFor(() => {
        expect(screen.getByText('Loading more activities...')).toBeInTheDocument()
        expect(screen.queryByTestId('activity-skeleton')).not.toBeInTheDocument()
      })
    })
  })

  describe('Variants', () => {
    test('renders full variant correctly', async () => {
      profileService.getUserActivity.mockResolvedValue({ activities: mockActivities })

      renderWithProviders(<ActivityTimeline variant="full" />)

      await waitFor(() => {
        expect(screen.getByTestId('activity-timeline')).toHaveClass('activity-timeline--full')
      })
    })

    test('renders compact variant correctly', async () => {
      profileService.getUserActivity.mockResolvedValue({ activities: mockActivities })

      renderWithProviders(<ActivityTimeline variant="compact" />)

      await waitFor(() => {
        expect(screen.getByTestId('activity-timeline')).toHaveClass('activity-timeline--compact')
      })
    })

    test('renders summary variant correctly', async () => {
      profileService.getUserActivity.mockResolvedValue({ activities: mockActivities })

      renderWithProviders(<ActivityTimeline variant="summary" />)

      await waitFor(() => {
        expect(screen.getByText('Recent Activity')).toBeInTheDocument()
        expect(screen.getByTestId('activity-timeline')).toHaveClass('activity-timeline--summary')
      })
    })

    test('summary variant displays activity stats', async () => {
      profileService.getUserActivity.mockResolvedValue({ activities: mockActivities })

      renderWithProviders(<ActivityTimeline variant="summary" />)

      await waitFor(() => {
        expect(screen.getByText(/Posts/)).toBeInTheDocument()
        expect(screen.getByText(/Comments/)).toBeInTheDocument()
        expect(screen.getByText(/Reactions/)).toBeInTheDocument()
      })
    })

    test('summary variant shows only first 3 activities', async () => {
      profileService.getUserActivity.mockResolvedValue({ activities: mockActivities })

      renderWithProviders(<ActivityTimeline variant="summary" />)

      await waitFor(() => {
        const activityItems = screen.getAllByTestId('activity-item')
        expect(activityItems).toHaveLength(3)
      })
    })

    test('summary variant uses minimal activity items', async () => {
      profileService.getUserActivity.mockResolvedValue({ activities: mockActivities })

      renderWithProviders(<ActivityTimeline variant="summary" />)

      await waitFor(() => {
        const activityItems = screen.getAllByTestId('activity-item')
        activityItems.forEach(item => {
          expect(item).toHaveClass('activity-item--minimal')
        })
      })
    })
  })

  describe('Infinite Scroll', () => {
    test('observes sentinel element for infinite scroll', async () => {
      const mockObserve = jest.fn()
      const mockDisconnect = jest.fn()
      global.IntersectionObserver = jest.fn(() => ({
        observe: mockObserve,
        disconnect: mockDisconnect,
        unobserve: jest.fn()
      }))

      profileService.getUserActivity.mockResolvedValue({ activities: mockActivities })

      renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        expect(mockObserve).toHaveBeenCalled()
      })
    })

    test('cleans up observer on unmount', async () => {
      const mockDisconnect = jest.fn()
      global.IntersectionObserver = jest.fn(() => ({
        observe: jest.fn(),
        disconnect: mockDisconnect,
        unobserve: jest.fn()
      }))

      profileService.getUserActivity.mockResolvedValue({ activities: mockActivities })

      const { unmount } = renderWithProviders(<ActivityTimeline />)

      await waitFor(() => {
        expect(screen.getByText('Activity Timeline')).toBeInTheDocument()
      })

      unmount()

      expect(mockDisconnect).toHaveBeenCalled()
    })
  })
})

export default mockUser
