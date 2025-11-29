import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import CommunityAnalytics from './CommunityAnalytics'
import communityService from '../../services/communityService'
import socketService from '../../services/socket'

jest.mock('../../services/communityService')
jest.mock('../../services/socket')

const mockAnalyticsData = {
  totalMembers: 5000,
  memberGrowth: 15.5,
  totalPosts: 12000,
  postGrowth: 8.3,
  dailyActiveUsers: 1200,
  activeChange: 5.2,
  engagementRate: 68.5,
  engagementGrowth: 3.7,
  newMembers: 150,
  activeMembers: 1200,
  retentionRate: 82.3,
  postsPerDay: 40.5,
  commentsPerPost: 5.2,
  avgPostScore: 12.8,
  topContributors: [
    { id: '1', username: 'user1', avatar: '/avatar1.png', postCount: 150, karma: 5000 },
    { id: '2', username: 'user2', avatar: '/avatar2.png', postCount: 120, karma: 4500 },
    { id: '3', username: 'user3', avatar: '/avatar3.png', postCount: 100, karma: 4000 },
    { id: '4', username: 'user4', avatar: '/avatar4.png', postCount: 90, karma: 3500 },
    { id: '5', username: 'user5', avatar: '/avatar5.png', postCount: 80, karma: 3000 }
  ],
  milestones: [
    { date: '2025-01-01', title: '5000 Members', description: 'Reached 5000 community members' },
    { date: '2025-02-01', title: '10000 Posts', description: 'Community posted 10000 times' }
  ],
  overviewData: {
    chartData: [
      { label: 'Week 1', value: 1000 },
      { label: 'Week 2', value: 1500 },
      { label: 'Week 3', value: 2000 }
    ],
    maxValue: 2000
  },
  memberData: {
    growthData: [
      { value: 4000 },
      { value: 4500 },
      { value: 5000 }
    ],
    maxValue: 5000
  },
  contentData: {
    activityData: [
      { date: '2025-01-01', posts: 50, intensity: 0.8 },
      { date: '2025-01-02', posts: 40, intensity: 0.6 },
      { date: '2025-01-03', posts: 60, intensity: 1.0 }
    ]
  },
  engagementData: {
    likes: 5000,
    comments: 3000,
    shares: 1000
  }
}

describe('CommunityAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    socketService.on = jest.fn()
    socketService.off = jest.fn()
  })

  describe('Component Rendering', () => {
    test('renders analytics dashboard with header', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('Community Analytics')).toBeInTheDocument()
      })
    })

    test('renders header description', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText("Track your community's growth and engagement")).toBeInTheDocument()
      })
    })

    test('renders with custom time range prop', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" timeRange="90d" />)

      await waitFor(() => {
        const select = screen.getByRole('combobox')
        expect(select.value).toBe('90d')
      })
    })

    test('renders export button', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('Export')).toBeInTheDocument()
      })
    })
  })

  describe('Loading State', () => {
    test('displays loading spinner initially', () => {
      communityService.getCommunityAnalytics.mockImplementation(() => new Promise(() => {}))

      render(<CommunityAnalytics communityId="community-1" />)

      expect(screen.getByText('Loading analytics...')).toBeInTheDocument()
    })

    test('shows spinner element during loading', () => {
      communityService.getCommunityAnalytics.mockImplementation(() => new Promise(() => {}))

      const { container } = render(<CommunityAnalytics communityId="community-1" />)

      expect(container.querySelector('.spinner')).toBeInTheDocument()
    })

    test('renders loading state with correct class', () => {
      communityService.getCommunityAnalytics.mockImplementation(() => new Promise(() => {}))

      const { container } = render(<CommunityAnalytics communityId="community-1" />)

      expect(container.querySelector('.loading-state')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    test('displays error message when API fails', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: false,
        error: 'Failed to fetch analytics'
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch analytics')).toBeInTheDocument()
      })
    })

    test('displays generic error on exception', async () => {
      communityService.getCommunityAnalytics.mockRejectedValue(new Error('Network error'))

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('Failed to load analytics data')).toBeInTheDocument()
      })
    })

    test('renders retry button on error', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: false,
        error: 'Failed to fetch analytics'
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument()
      })
    })

    test('retries loading analytics when retry button clicked', async () => {
      communityService.getCommunityAnalytics
        .mockResolvedValueOnce({
          success: false,
          error: 'Failed to fetch analytics'
        })
        .mockResolvedValueOnce({
          success: true,
          analytics: mockAnalyticsData
        })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Retry'))

      await waitFor(() => {
        expect(screen.getByText('Community Analytics')).toBeInTheDocument()
      })
    })

    test('clears error state after successful retry', async () => {
      communityService.getCommunityAnalytics
        .mockResolvedValueOnce({
          success: false,
          error: 'Failed to fetch analytics'
        })
        .mockResolvedValueOnce({
          success: true,
          analytics: mockAnalyticsData
        })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch analytics')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Retry'))

      await waitFor(() => {
        expect(screen.queryByText('Failed to fetch analytics')).not.toBeInTheDocument()
      })
    })
  })

  describe('Growth Metrics', () => {
    test('displays total members count', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('5.0K')).toBeInTheDocument()
      })
    })

    test('displays member growth percentage', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('+15.5%')).toBeInTheDocument()
      })
    })

    test('displays total posts count', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('12.0K')).toBeInTheDocument()
      })
    })

    test('displays post growth percentage', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('+8.3%')).toBeInTheDocument()
      })
    })

    test('displays daily active users count', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('1.2K')).toBeInTheDocument()
      })
    })

    test('displays active users change percentage', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('+5.2%')).toBeInTheDocument()
      })
    })

    test('formats large numbers with M suffix', async () => {
      const dataWithMillions = {
        ...mockAnalyticsData,
        totalMembers: 2500000
      }

      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: dataWithMillions
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('2.5M')).toBeInTheDocument()
      })
    })

    test('formats numbers below 1000 without suffix', async () => {
      const dataWithSmallNumbers = {
        ...mockAnalyticsData,
        totalMembers: 500
      }

      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: dataWithSmallNumbers
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('500')).toBeInTheDocument()
      })
    })
  })

  describe('Engagement Metrics', () => {
    test('displays engagement rate', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('68.5%')).toBeInTheDocument()
      })
    })

    test('displays engagement growth percentage', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('+3.7%')).toBeInTheDocument()
      })
    })

    test('shows positive change icon for positive growth', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      const { container } = render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(container.querySelector('.positive')).toBeInTheDocument()
      })
    })

    test('shows negative change icon for negative growth', async () => {
      const dataWithNegativeGrowth = {
        ...mockAnalyticsData,
        memberGrowth: -5.2
      }

      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: dataWithNegativeGrowth
      })

      const { container } = render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(container.querySelector('.negative')).toBeInTheDocument()
      })
    })

    test('applies positive class for positive metrics', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      const { container } = render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        const positiveElements = container.querySelectorAll('.metric-change.positive')
        expect(positiveElements.length).toBeGreaterThan(0)
      })
    })

    test('applies negative class for negative metrics', async () => {
      const dataWithNegativeGrowth = {
        ...mockAnalyticsData,
        memberGrowth: -5.2,
        postGrowth: -3.1
      }

      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: dataWithNegativeGrowth
      })

      const { container } = render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        const negativeElements = container.querySelectorAll('.metric-change.negative')
        expect(negativeElements.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Member Demographics', () => {
    test('displays new members count', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument()
      })
    })

    test('displays active members count', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('1200')).toBeInTheDocument()
      })
    })

    test('displays retention rate', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('82.3%')).toBeInTheDocument()
      })
    })

    test('renders Member Activity section', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('Member Activity')).toBeInTheDocument()
      })
    })

    test('handles missing member data gracefully', async () => {
      const dataWithMissingMembers = {
        ...mockAnalyticsData,
        newMembers: undefined,
        activeMembers: undefined
      }

      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: dataWithMissingMembers
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('Member Activity')).toBeInTheDocument()
      })
    })
  })

  describe('Top Posts/Contributors', () => {
    test('displays top contributors section', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('Top Contributors')).toBeInTheDocument()
      })
    })

    test('renders top 5 contributors', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument()
        expect(screen.getByText('user2')).toBeInTheDocument()
        expect(screen.getByText('user3')).toBeInTheDocument()
        expect(screen.getByText('user4')).toBeInTheDocument()
        expect(screen.getByText('user5')).toBeInTheDocument()
      })
    })

    test('displays contributor rank numbers', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument()
        expect(screen.getByText('#2')).toBeInTheDocument()
        expect(screen.getByText('#3')).toBeInTheDocument()
      })
    })

    test('displays contributor post counts', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('150 posts')).toBeInTheDocument()
        expect(screen.getByText('120 posts')).toBeInTheDocument()
      })
    })

    test('displays contributor karma', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('5000')).toBeInTheDocument()
        expect(screen.getByText('4500')).toBeInTheDocument()
      })
    })

    test('renders contributor avatars', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        const avatars = screen.getAllByAltText(/user\d/)
        expect(avatars.length).toBe(5)
      })
    })

    test('uses default avatar for missing avatar URLs', async () => {
      const dataWithMissingAvatars = {
        ...mockAnalyticsData,
        topContributors: [
          { id: '1', username: 'user1', avatar: null, postCount: 150, karma: 5000 }
        ]
      }

      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: dataWithMissingAvatars
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        const avatar = screen.getByAltText('user1')
        expect(avatar.src).toContain('default-avatar.png')
      })
    })

    test('limits contributors list to 5 items', async () => {
      const dataWithManyContributors = {
        ...mockAnalyticsData,
        topContributors: Array(10).fill(null).map((_, i) => ({
          id: `${i + 1}`,
          username: `user${i + 1}`,
          avatar: `/avatar${i + 1}.png`,
          postCount: 100 - i,
          karma: 5000 - (i * 100)
        }))
      }

      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: dataWithManyContributors
      })

      const { container } = render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        const contributorItems = container.querySelectorAll('.contributor-item')
        expect(contributorItems.length).toBe(5)
      })
    })
  })

  describe('Time Range Filters', () => {
    test('renders time range select dropdown', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })
    })

    test('displays all time range options', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('7 Days')).toBeInTheDocument()
        expect(screen.getByText('30 Days')).toBeInTheDocument()
        expect(screen.getByText('3 Months')).toBeInTheDocument()
        expect(screen.getByText('1 Year')).toBeInTheDocument()
      })
    })

    test('defaults to 30 days time range', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        const select = screen.getByRole('combobox')
        expect(select.value).toBe('30d')
      })
    })

    test('changes time range when option selected', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        const select = screen.getByRole('combobox')
        fireEvent.change(select, { target: { value: '90d' } })
        expect(select.value).toBe('90d')
      })
    })

    test('reloads analytics when time range changes', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(communityService.getCommunityAnalytics).toHaveBeenCalledTimes(1)
      })

      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: '7d' } })

      await waitFor(() => {
        expect(communityService.getCommunityAnalytics).toHaveBeenCalledTimes(2)
      })
    })

    test('passes correct time range to API', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        const select = screen.getByRole('combobox')
        fireEvent.change(select, { target: { value: '365d' } })
      })

      await waitFor(() => {
        expect(communityService.getCommunityAnalytics).toHaveBeenCalledWith('community-1', '365d')
      })
    })
  })

  describe('Charts and Graphs', () => {
    test('renders chart tabs', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
        expect(screen.getByText('Members')).toBeInTheDocument()
        expect(screen.getByText('Content')).toBeInTheDocument()
        expect(screen.getByText('Engagement')).toBeInTheDocument()
      })
    })

    test('overview tab is active by default', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      const { container } = render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        const overviewTab = container.querySelector('.chart-tab.active')
        expect(overviewTab).toHaveTextContent('Overview')
      })
    })

    test('switches to members chart when tab clicked', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('Members'))
      })

      await waitFor(() => {
        expect(screen.getByText('Member Growth')).toBeInTheDocument()
      })
    })

    test('switches to content chart when tab clicked', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('Content'))
      })

      await waitFor(() => {
        expect(screen.getByText('Content Activity')).toBeInTheDocument()
      })
    })

    test('switches to engagement chart when tab clicked', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('Engagement'))
      })

      await waitFor(() => {
        expect(screen.getByText('Engagement Metrics')).toBeInTheDocument()
      })
    })

    test('renders overview chart with data', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('Community Overview')).toBeInTheDocument()
        expect(screen.getByText('Members, posts, and engagement over time')).toBeInTheDocument()
      })
    })

    test('renders members chart with growth data', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('Members'))
      })

      await waitFor(() => {
        expect(screen.getByText('New members and retention over time')).toBeInTheDocument()
      })
    })

    test('renders content chart with activity heatmap', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('Content'))
      })

      await waitFor(() => {
        expect(screen.getByText('Posts and comments distribution')).toBeInTheDocument()
      })
    })

    test('renders engagement chart with metrics', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('Engagement'))
      })

      await waitFor(() => {
        expect(screen.getByText('Likes, comments, and shares')).toBeInTheDocument()
      })
    })

    test('displays engagement numbers in engagement chart', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('Engagement'))
      })

      await waitFor(() => {
        expect(screen.getByText('5000')).toBeInTheDocument()
        expect(screen.getByText('3000')).toBeInTheDocument()
        expect(screen.getByText('1000')).toBeInTheDocument()
      })
    })
  })

  describe('Export Functionality', () => {
    test('renders export button', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('Export')).toBeInTheDocument()
      })
    })

    test('export button has correct class', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      const { container } = render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(container.querySelector('.export-btn')).toBeInTheDocument()
      })
    })
  })

  describe('Content Performance', () => {
    test('displays posts per day metric', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('40.5')).toBeInTheDocument()
      })
    })

    test('displays comments per post metric', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('5.2')).toBeInTheDocument()
      })
    })

    test('displays average post score', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('12.8')).toBeInTheDocument()
      })
    })

    test('renders Content Performance section', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('Content Performance')).toBeInTheDocument()
      })
    })

    test('handles missing content metrics gracefully', async () => {
      const dataWithMissingContent = {
        ...mockAnalyticsData,
        postsPerDay: undefined,
        commentsPerPost: undefined,
        avgPostScore: undefined
      }

      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: dataWithMissingContent
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('Content Performance')).toBeInTheDocument()
      })
    })
  })

  describe('Growth Timeline/Milestones', () => {
    test('renders growth milestones section', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('Growth Milestones')).toBeInTheDocument()
      })
    })

    test('displays milestone titles', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('5000 Members')).toBeInTheDocument()
        expect(screen.getByText('10000 Posts')).toBeInTheDocument()
      })
    })

    test('displays milestone descriptions', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('Reached 5000 community members')).toBeInTheDocument()
        expect(screen.getByText('Community posted 10000 times')).toBeInTheDocument()
      })
    })

    test('displays milestone dates', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('1/1/2025')).toBeInTheDocument()
        expect(screen.getByText('2/1/2025')).toBeInTheDocument()
      })
    })
  })

  describe('API Integration', () => {
    test('calls API with correct community ID on mount', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-123" />)

      await waitFor(() => {
        expect(communityService.getCommunityAnalytics).toHaveBeenCalledWith('community-123', '30d')
      })
    })

    test('calls API with custom time range', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" timeRange="7d" />)

      await waitFor(() => {
        expect(communityService.getCommunityAnalytics).toHaveBeenCalledWith('community-1', '7d')
      })
    })

    test('reloads data when community ID changes', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      const { rerender } = render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(communityService.getCommunityAnalytics).toHaveBeenCalledWith('community-1', '30d')
      })

      rerender(<CommunityAnalytics communityId="community-2" />)

      await waitFor(() => {
        expect(communityService.getCommunityAnalytics).toHaveBeenCalledWith('community-2', '30d')
      })
    })

    test('handles API success response correctly', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('Community Analytics')).toBeInTheDocument()
      })
    })

    test('handles API error response correctly', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: false,
        error: 'Unauthorized access'
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('Unauthorized access')).toBeInTheDocument()
      })
    })
  })

  describe('Real-time Updates (Socket)', () => {
    test('subscribes to socket analytics updates on mount', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(socketService.on).toHaveBeenCalledWith('analytics_updated', expect.any(Function))
      })
    })

    test('unsubscribes from socket updates on unmount', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      const { unmount } = render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(socketService.on).toHaveBeenCalled()
      })

      unmount()

      expect(socketService.off).toHaveBeenCalledWith('analytics_updated', expect.any(Function))
    })

    test('updates analytics when socket receives matching community data', async () => {
      let socketHandler
      socketService.on = jest.fn((event, handler) => {
        socketHandler = handler
      })

      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(socketHandler).toBeDefined()
      })

      socketHandler({
        communityId: 'community-1',
        updates: {
          totalMembers: 6000
        }
      })

      await waitFor(() => {
        expect(screen.getByText('6.0K')).toBeInTheDocument()
      })
    })

    test('ignores socket updates for different community', async () => {
      let socketHandler
      socketService.on = jest.fn((event, handler) => {
        socketHandler = handler
      })

      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(socketHandler).toBeDefined()
      })

      socketHandler({
        communityId: 'community-2',
        updates: {
          totalMembers: 9999
        }
      })

      await waitFor(() => {
        expect(screen.queryByText('9999')).not.toBeInTheDocument()
      })
    })

    test('merges socket updates with existing analytics', async () => {
      let socketHandler
      socketService.on = jest.fn((event, handler) => {
        socketHandler = handler
      })

      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: mockAnalyticsData
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(socketHandler).toBeDefined()
      })

      await waitFor(() => {
        expect(screen.getByText('5.0K')).toBeInTheDocument()
      })

      socketHandler({
        communityId: 'community-1',
        updates: {
          dailyActiveUsers: 1500
        }
      })

      await waitFor(() => {
        expect(screen.getByText('1.5K')).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    test('handles null analytics data', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: null
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('Community Analytics')).toBeInTheDocument()
      })
    })

    test('handles undefined values in analytics', async () => {
      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: {
          totalMembers: undefined,
          memberGrowth: undefined
        }
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('Community Analytics')).toBeInTheDocument()
      })
    })

    test('handles empty top contributors array', async () => {
      const dataWithNoContributors = {
        ...mockAnalyticsData,
        topContributors: []
      }

      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: dataWithNoContributors
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('Top Contributors')).toBeInTheDocument()
      })
    })

    test('handles empty milestones array', async () => {
      const dataWithNoMilestones = {
        ...mockAnalyticsData,
        milestones: []
      }

      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: dataWithNoMilestones
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('Growth Milestones')).toBeInTheDocument()
      })
    })

    test('handles zero values in metrics', async () => {
      const dataWithZeros = {
        ...mockAnalyticsData,
        totalMembers: 0,
        totalPosts: 0,
        dailyActiveUsers: 0
      }

      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: dataWithZeros
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('Community Analytics')).toBeInTheDocument()
      })
    })

    test('handles neutral change (zero growth)', async () => {
      const dataWithNeutralGrowth = {
        ...mockAnalyticsData,
        memberGrowth: 0
      }

      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: dataWithNeutralGrowth
      })

      const { container } = render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(container.querySelector('.neutral')).toBeInTheDocument()
      })
    })

    test('formats null number as 0', async () => {
      const dataWithNull = {
        ...mockAnalyticsData,
        totalMembers: null
      }

      communityService.getCommunityAnalytics.mockResolvedValue({
        success: true,
        analytics: dataWithNull
      })

      render(<CommunityAnalytics communityId="community-1" />)

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument()
      })
    })
  })
})

export default mockAnalyticsData
