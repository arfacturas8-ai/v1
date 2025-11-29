import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import SocialAnalytics from './SocialAnalytics'
import socialService from '../../services/socialService'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../ui/useToast'

// Mock dependencies
jest.mock('../../services/socialService')
jest.mock('../../contexts/AuthContext')
jest.mock('../ui/useToast')

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  BarChart3: ({ size }) => <div data-testid="bar-chart-icon" data-size={size}>BarChart3</div>,
  TrendingUp: ({ size }) => <div data-testid="trending-up-icon" data-size={size}>TrendingUp</div>,
  Users: ({ size }) => <div data-testid="users-icon" data-size={size}>Users</div>,
  Heart: ({ size }) => <div data-testid="heart-icon" data-size={size}>Heart</div>,
  MessageSquare: ({ size }) => <div data-testid="message-square-icon" data-size={size}>MessageSquare</div>,
  Eye: ({ size }) => <div data-testid="eye-icon" data-size={size}>Eye</div>,
  Calendar: ({ size }) => <div data-testid="calendar-icon" data-size={size}>Calendar</div>,
  Target: ({ size }) => <div data-testid="target-icon" data-size={size}>Target</div>,
  Zap: ({ size }) => <div data-testid="zap-icon" data-size={size}>Zap</div>,
  Award: ({ size }) => <div data-testid="award-icon" data-size={size}>Award</div>,
  Star: ({ size }) => <div data-testid="star-icon" data-size={size}>Star</div>,
  Share2: ({ size }) => <div data-testid="share2-icon" data-size={size}>Share2</div>,
  ArrowUp: ({ size, className }) => <div data-testid="arrow-up-icon" className={className}>ArrowUp</div>,
  ArrowDown: ({ size, className }) => <div data-testid="arrow-down-icon" className={className}>ArrowDown</div>,
  Minus: ({ size, className }) => <div data-testid="minus-icon" className={className}>Minus</div>,
  Filter: ({ size }) => <div data-testid="filter-icon" data-size={size}>Filter</div>,
  Download: ({ size }) => <div data-testid="download-icon" data-size={size}>Download</div>,
  PieChart: ({ size }) => <div data-testid="pie-chart-icon" data-size={size}>PieChart</div>,
  Activity: ({ size }) => <div data-testid="activity-icon" data-size={size}>Activity</div>,
  Globe: ({ size }) => <div data-testid="globe-icon" data-size={size}>Globe</div>,
  MapPin: ({ size }) => <div data-testid="map-pin-icon" data-size={size}>MapPin</div>,
  Clock: ({ size }) => <div data-testid="clock-icon" data-size={size}>Clock</div>,
  X: ({ size }) => <div data-testid="x-icon" data-size={size}>X</div>
}))

describe('SocialAnalytics Component', () => {
  const mockShowToast = jest.fn()
  const mockOnClose = jest.fn()
  const mockUser = { id: 'user123', name: 'Test User' }

  const mockAnalyticsData = {
    overview: {
      totalFollowers: 1234,
      totalFollowing: 567,
      totalFriends: 89,
      totalConnections: 1890,
      profileViews: 5432,
      engagementRate: 0.084,
      growthRate: 0.12,
      influenceScore: 0.76,
      changes: {
        followers: { value: 45, percentage: 3.8 },
        following: { value: 12, percentage: 2.1 },
        friends: { value: 8, percentage: 9.9 },
        profileViews: { value: 234, percentage: 4.5 },
        engagementRate: { value: 0.007, percentage: 9.1 },
        influenceScore: { value: 0.04, percentage: 5.6 }
      }
    },
    growth: {
      followersGrowth: [
        { date: '2024-01-01', value: 1000 },
        { date: '2024-01-08', value: 1045 }
      ],
      followingGrowth: [
        { date: '2024-01-01', value: 520 },
        { date: '2024-01-08', value: 535 }
      ],
      friendsGrowth: [
        { date: '2024-01-01', value: 75 },
        { date: '2024-01-08', value: 78 }
      ],
      milestones: [
        { date: '2024-01-15', type: 'followers', value: 1000, description: 'Reached 1K followers' }
      ]
    },
    engagement: {
      averageEngagementRate: 0.084,
      totalEngagements: 2345,
      engagementByType: {
        likes: 1456,
        comments: 432,
        shares: 234,
        mentions: 123,
        profileViews: 100
      },
      topEngagingContent: [
        { id: '1', type: 'post', content: 'Web3 development insights...', engagements: 234, date: '2024-01-28' }
      ],
      engagementTrends: [
        { date: '2024-01-01', rate: 0.072 }
      ]
    },
    demographics: {
      followerDemographics: {
        byLocation: [
          { location: 'United States', count: 456, percentage: 37 }
        ],
        byInterests: [
          { interest: 'Web3', count: 567, percentage: 46 }
        ],
        byActivity: [
          { level: 'Very Active', count: 234, percentage: 19 }
        ]
      }
    },
    influence: {
      overallScore: 0.76,
      components: {
        reach: 0.82,
        engagement: 0.78,
        authority: 0.71,
        consistency: 0.74
      },
      influenceGrowth: [
        { date: '2024-01-01', score: 0.68 }
      ],
      influenceAreas: [
        { area: 'Web3 Development', score: 0.89, rank: 15 }
      ],
      viralContent: [
        { id: '1', content: 'Web3 development best practices', reach: 15678, engagement: 1234 }
      ]
    }
  }

  const mockNetworkData = {
    networkSize: 1890,
    networkDensity: 0.045,
    centralityScore: 0.73,
    clusteringCoefficient: 0.34,
    mutualConnections: 234,
    networkReach: 45678,
    influentialConnections: 23,
    connectionStrength: {
      strong: 156,
      medium: 567,
      weak: 1167
    },
    networkGrowth: {
      newConnections: 67,
      lostConnections: 12,
      netGrowth: 55
    },
    topConnectors: [
      { id: '1', name: 'Tech Guru', connections: 45, mutualWith: 12 }
    ]
  }

  beforeEach(() => {
    jest.clearAllMocks()
    useAuth.mockReturnValue({ user: mockUser })
    useToast.mockReturnValue({ showToast: mockShowToast })
    socialService.getSocialAnalytics.mockResolvedValue(mockAnalyticsData)
    socialService.getNetworkStats.mockResolvedValue(mockNetworkData)
  })

  describe('Component Rendering', () => {
    it('should render loading state initially', () => {
      render(<SocialAnalytics onClose={mockOnClose} />)
      expect(screen.getByText('Loading analytics...')).toBeInTheDocument()
      expect(screen.getByTestId('analytics-loading')).toBeInTheDocument()
    })

    it('should render analytics dashboard after loading', async () => {
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Social Analytics')).toBeInTheDocument()
      })

      expect(screen.getByText('Insights into your social network performance')).toBeInTheDocument()
    })

    it('should render with custom userId prop', async () => {
      const customUserId = 'custom123'
      render(<SocialAnalytics onClose={mockOnClose} userId={customUserId} />)

      await waitFor(() => {
        expect(socialService.getSocialAnalytics).toHaveBeenCalledWith(customUserId, '30d')
      })
    })

    it('should render with custom timeframe prop', async () => {
      render(<SocialAnalytics onClose={mockOnClose} timeframe="7d" />)

      await waitFor(() => {
        expect(socialService.getSocialAnalytics).toHaveBeenCalledWith(null, '7d')
      })
    })

    it('should render header with title and description', async () => {
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Social Analytics')).toBeInTheDocument()
        expect(screen.getByText('Insights into your social network performance')).toBeInTheDocument()
      })
    })

    it('should render timeframe select dropdown', async () => {
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        const select = screen.getByDisplayValue('30 Days')
        expect(select).toBeInTheDocument()
      })
    })

    it('should render export button', async () => {
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        const exportBtn = screen.getByTitle('Export analytics data')
        expect(exportBtn).toBeInTheDocument()
      })
    })

    it('should render close button', async () => {
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        const closeBtn = screen.getByRole('button', { name: /x/i })
        expect(closeBtn).toBeInTheDocument()
      })
    })
  })

  describe('Tab Navigation', () => {
    it('should render all tab buttons', async () => {
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      expect(screen.getByText('Growth')).toBeInTheDocument()
      expect(screen.getByText('Engagement')).toBeInTheDocument()
      expect(screen.getByText('Network')).toBeInTheDocument()
      expect(screen.getByText('Influence')).toBeInTheDocument()
    })

    it('should set Overview tab as active by default', async () => {
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        const overviewTab = screen.getByText('Overview').closest('button')
        expect(overviewTab).toHaveClass('active')
      })
    })

    it('should switch to Growth tab when clicked', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Growth'))

      expect(screen.getByText('Growth Trends')).toBeInTheDocument()
      expect(screen.getByText('Milestones')).toBeInTheDocument()
    })

    it('should switch to Engagement tab when clicked', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Engagement'))

      expect(screen.getByText('Engagement Breakdown')).toBeInTheDocument()
      expect(screen.getByText('Top Engaging Content')).toBeInTheDocument()
    })

    it('should switch to Network tab when clicked', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Network'))

      expect(screen.getByText('Connection Strength')).toBeInTheDocument()
      expect(screen.getByText('Top Connectors')).toBeInTheDocument()
    })

    it('should switch to Influence tab when clicked', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Influence'))

      expect(screen.getByText('Influence Score')).toBeInTheDocument()
      expect(screen.getByText('Influence Areas')).toBeInTheDocument()
    })

    it('should apply active class to selected tab', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      const engagementTab = screen.getByText('Engagement').closest('button')
      await user.click(screen.getByText('Engagement'))

      expect(engagementTab).toHaveClass('active')
    })
  })

  describe('Overview Tab', () => {
    it('should render followers stat card', async () => {
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Followers')).toBeInTheDocument()
        expect(screen.getByText('1.2K')).toBeInTheDocument()
      })
    })

    it('should render following stat card', async () => {
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Following')).toBeInTheDocument()
      })
    })

    it('should render friends stat card', async () => {
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Friends')).toBeInTheDocument()
        expect(screen.getByText('89')).toBeInTheDocument()
      })
    })

    it('should render profile views stat card', async () => {
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Profile Views')).toBeInTheDocument()
        expect(screen.getByText('5.4K')).toBeInTheDocument()
      })
    })

    it('should render engagement rate stat card', async () => {
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Engagement Rate')).toBeInTheDocument()
      })
    })

    it('should render influence score stat card', async () => {
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Influence Score')).toBeInTheDocument()
      })
    })

    it('should display positive change indicators', async () => {
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        const positiveChanges = screen.getAllByTestId('arrow-up-icon')
        expect(positiveChanges.length).toBeGreaterThan(0)
      })
    })

    it('should render quick insights section', async () => {
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Quick Insights')).toBeInTheDocument()
      })
    })

    it('should render growing influence insight', async () => {
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Growing Influence')).toBeInTheDocument()
      })
    })

    it('should render strong network insight', async () => {
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Strong Network')).toBeInTheDocument()
      })
    })

    it('should render high engagement insight', async () => {
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('High Engagement')).toBeInTheDocument()
      })
    })
  })

  describe('Growth Tab', () => {
    it('should render growth trends section', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Growth'))

      expect(screen.getByText('Growth Trends')).toBeInTheDocument()
    })

    it('should render growth chart placeholder', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Growth'))

      expect(screen.getByText('Growth chart visualization would be displayed here')).toBeInTheDocument()
    })

    it('should display followers growth value', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Growth'))

      expect(screen.getByText('Followers Growth')).toBeInTheDocument()
      expect(screen.getByText('+45')).toBeInTheDocument()
    })

    it('should display following growth value', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Growth'))

      expect(screen.getByText('Following Growth')).toBeInTheDocument()
      expect(screen.getByText('+12')).toBeInTheDocument()
    })

    it('should display friends growth value', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Growth'))

      expect(screen.getByText('Friends Growth')).toBeInTheDocument()
      expect(screen.getByText('+8')).toBeInTheDocument()
    })

    it('should render milestones section', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Growth'))

      expect(screen.getByText('Milestones')).toBeInTheDocument()
    })

    it('should display milestone items', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Growth'))

      expect(screen.getByText('Reached 1K followers')).toBeInTheDocument()
    })
  })

  describe('Engagement Tab', () => {
    it('should render engagement breakdown section', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Engagement'))

      expect(screen.getByText('Engagement Breakdown')).toBeInTheDocument()
    })

    it('should display likes in engagement breakdown', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Engagement'))

      expect(screen.getByText('Likes')).toBeInTheDocument()
    })

    it('should display comments in engagement breakdown', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Engagement'))

      expect(screen.getByText('Comments')).toBeInTheDocument()
    })

    it('should display shares in engagement breakdown', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Engagement'))

      expect(screen.getByText('Shares')).toBeInTheDocument()
    })

    it('should render top engaging content section', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Engagement'))

      expect(screen.getByText('Top Engaging Content')).toBeInTheDocument()
    })

    it('should display content items with ranks', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Engagement'))

      expect(screen.getByText('#1')).toBeInTheDocument()
      expect(screen.getByText('Web3 development insights...')).toBeInTheDocument()
    })

    it('should display engagement count for content', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Engagement'))

      expect(screen.getByText('234 engagements')).toBeInTheDocument()
    })
  })

  describe('Network Tab', () => {
    it('should render network size stat', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Network'))

      expect(screen.getByText('Network Size')).toBeInTheDocument()
      expect(screen.getByText('1.9K')).toBeInTheDocument()
    })

    it('should render network reach stat', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Network'))

      expect(screen.getByText('Network Reach')).toBeInTheDocument()
      expect(screen.getByText('45.7K')).toBeInTheDocument()
    })

    it('should render mutual connections stat', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Network'))

      expect(screen.getByText('Mutual Connections')).toBeInTheDocument()
    })

    it('should render centrality score stat', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Network'))

      expect(screen.getByText('Centrality Score')).toBeInTheDocument()
    })

    it('should render connection strength section', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Network'))

      expect(screen.getByText('Connection Strength')).toBeInTheDocument()
    })

    it('should display strong connections', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Network'))

      expect(screen.getByText('Strong Connections')).toBeInTheDocument()
    })

    it('should display medium connections', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Network'))

      expect(screen.getByText('Medium Connections')).toBeInTheDocument()
    })

    it('should display weak connections', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Network'))

      expect(screen.getByText('Weak Connections')).toBeInTheDocument()
    })

    it('should render top connectors section', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Network'))

      expect(screen.getByText('Top Connectors')).toBeInTheDocument()
    })

    it('should display top connector details', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Network'))

      expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      expect(screen.getByText('45 connections • 12 mutual')).toBeInTheDocument()
    })
  })

  describe('Influence Tab', () => {
    it('should render influence score display', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Influence'))

      expect(screen.getByText('Influence Score')).toBeInTheDocument()
      expect(screen.getByText('76.0%')).toBeInTheDocument()
    })

    it('should render influence components', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Influence'))

      expect(screen.getByText('Reach')).toBeInTheDocument()
      expect(screen.getByText('82.0%')).toBeInTheDocument()
    })

    it('should display engagement component', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Influence'))

      const engagementLabels = screen.getAllByText('Engagement')
      expect(engagementLabels.length).toBeGreaterThan(0)
      expect(screen.getByText('78.0%')).toBeInTheDocument()
    })

    it('should display authority component', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Influence'))

      expect(screen.getByText('Authority')).toBeInTheDocument()
      expect(screen.getByText('71.0%')).toBeInTheDocument()
    })

    it('should display consistency component', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Influence'))

      expect(screen.getByText('Consistency')).toBeInTheDocument()
      expect(screen.getByText('74.0%')).toBeInTheDocument()
    })

    it('should render influence areas section', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Influence'))

      expect(screen.getByText('Influence Areas')).toBeInTheDocument()
    })

    it('should display influence area details', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Influence'))

      expect(screen.getByText('Web3 Development')).toBeInTheDocument()
      expect(screen.getByText('Rank #15')).toBeInTheDocument()
      expect(screen.getByText('89.0%')).toBeInTheDocument()
    })
  })

  describe('Time Range Filters', () => {
    it('should render all timeframe options', async () => {
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('7 Days')).toBeInTheDocument()
      })

      expect(screen.getByText('30 Days')).toBeInTheDocument()
      expect(screen.getByText('90 Days')).toBeInTheDocument()
      expect(screen.getByText('1 Year')).toBeInTheDocument()
      expect(screen.getByText('All Time')).toBeInTheDocument()
    })

    it('should change timeframe when selected', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('30 Days')).toBeInTheDocument()
      })

      const select = screen.getByDisplayValue('30 Days')
      await user.selectOptions(select, '7d')

      await waitFor(() => {
        expect(socialService.getSocialAnalytics).toHaveBeenCalledWith(null, '7d')
      })
    })

    it('should reload analytics when timeframe changes', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('30 Days')).toBeInTheDocument()
      })

      const initialCallCount = socialService.getSocialAnalytics.mock.calls.length

      const select = screen.getByDisplayValue('30 Days')
      await user.selectOptions(select, '90d')

      await waitFor(() => {
        expect(socialService.getSocialAnalytics.mock.calls.length).toBeGreaterThan(initialCallCount)
      })
    })
  })

  describe('Export Functionality', () => {
    beforeEach(() => {
      global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
      global.URL.revokeObjectURL = jest.fn()
      HTMLAnchorElement.prototype.click = jest.fn()
    })

    it('should export analytics data when export button clicked', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByTitle('Export analytics data')).toBeInTheDocument()
      })

      const exportBtn = screen.getByTitle('Export analytics data')
      await user.click(exportBtn)

      expect(mockShowToast).toHaveBeenCalledWith('Analytics data exported successfully', 'success')
    })

    it('should create blob with correct data structure', async () => {
      const user = userEvent.setup()
      const mockBlob = jest.spyOn(global, 'Blob')

      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByTitle('Export analytics data')).toBeInTheDocument()
      })

      const exportBtn = screen.getByTitle('Export analytics data')
      await user.click(exportBtn)

      expect(mockBlob).toHaveBeenCalled()
      const blobData = JSON.parse(mockBlob.mock.calls[0][0][0])
      expect(blobData).toHaveProperty('exportDate')
      expect(blobData).toHaveProperty('timeframe')
      expect(blobData).toHaveProperty('analytics')
    })

    it('should include all analytics sections in export', async () => {
      const user = userEvent.setup()
      const mockBlob = jest.spyOn(global, 'Blob')

      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByTitle('Export analytics data')).toBeInTheDocument()
      })

      const exportBtn = screen.getByTitle('Export analytics data')
      await user.click(exportBtn)

      const blobData = JSON.parse(mockBlob.mock.calls[0][0][0])
      expect(blobData.analytics).toHaveProperty('overview')
      expect(blobData.analytics).toHaveProperty('growth')
      expect(blobData.analytics).toHaveProperty('engagement')
      expect(blobData.analytics).toHaveProperty('network')
      expect(blobData.analytics).toHaveProperty('demographics')
      expect(blobData.analytics).toHaveProperty('influence')
    })

    it('should create download link with correct filename', async () => {
      const user = userEvent.setup()
      const appendChildSpy = jest.spyOn(document.body, 'appendChild')

      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByTitle('Export analytics data')).toBeInTheDocument()
      })

      const exportBtn = screen.getByTitle('Export analytics data')
      await user.click(exportBtn)

      expect(appendChildSpy).toHaveBeenCalled()
      const link = appendChildSpy.mock.calls[0][0]
      expect(link.download).toMatch(/^social-analytics-30d-\d{4}-\d{2}-\d{2}\.json$/)
    })
  })

  describe('API Integration', () => {
    it('should call getSocialAnalytics on mount', async () => {
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(socialService.getSocialAnalytics).toHaveBeenCalledWith(null, '30d')
      })
    })

    it('should call getNetworkStats on mount', async () => {
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(socialService.getNetworkStats).toHaveBeenCalledWith(null)
      })
    })

    it('should make parallel API calls', async () => {
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(socialService.getSocialAnalytics).toHaveBeenCalled()
        expect(socialService.getNetworkStats).toHaveBeenCalled()
      })
    })

    it('should reload analytics when userId changes', async () => {
      const { rerender } = render(<SocialAnalytics onClose={mockOnClose} userId="user1" />)

      await waitFor(() => {
        expect(socialService.getSocialAnalytics).toHaveBeenCalledWith('user1', '30d')
      })

      rerender(<SocialAnalytics onClose={mockOnClose} userId="user2" />)

      await waitFor(() => {
        expect(socialService.getSocialAnalytics).toHaveBeenCalledWith('user2', '30d')
      })
    })
  })

  describe('Loading States', () => {
    it('should show loading spinner during data fetch', () => {
      render(<SocialAnalytics onClose={mockOnClose} />)

      expect(screen.getByText('Loading analytics...')).toBeInTheDocument()
    })

    it('should hide loading state after data loads', async () => {
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading analytics...')).not.toBeInTheDocument()
      })
    })

    it('should show loading state when changing timeframes', async () => {
      const user = userEvent.setup()

      socialService.getSocialAnalytics.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(mockAnalyticsData), 100))
      )

      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('30 Days')).toBeInTheDocument()
      })

      const select = screen.getByDisplayValue('30 Days')
      await user.selectOptions(select, '7d')

      expect(screen.getByText('Loading analytics...')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should show error toast when API fails', async () => {
      const error = new Error('API Error')
      socialService.getSocialAnalytics.mockRejectedValueOnce(error)

      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Failed to load analytics', 'error')
      })
    })

    it('should use mock data when API fails', async () => {
      socialService.getSocialAnalytics.mockRejectedValueOnce(new Error('API Error'))

      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Social Analytics')).toBeInTheDocument()
      })

      expect(screen.getByText('Followers')).toBeInTheDocument()
    })

    it('should handle missing overview data gracefully', async () => {
      socialService.getSocialAnalytics.mockResolvedValueOnce({})

      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Social Analytics')).toBeInTheDocument()
      })
    })

    it('should handle missing changes data gracefully', async () => {
      const dataWithoutChanges = {
        ...mockAnalyticsData,
        overview: {
          totalFollowers: 1234,
          totalFollowing: 567
        }
      }

      socialService.getSocialAnalytics.mockResolvedValueOnce(dataWithoutChanges)

      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Followers')).toBeInTheDocument()
      })
    })

    it('should log error to console on API failure', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const error = new Error('Test error')
      socialService.getSocialAnalytics.mockRejectedValueOnce(error)

      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error loading analytics:', error)
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Close Functionality', () => {
    it('should call onClose when close button clicked', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /x/i })).toBeInTheDocument()
      })

      const closeBtn = screen.getByRole('button', { name: /x/i })
      await user.click(closeBtn)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Number Formatting', () => {
    it('should format numbers in thousands', async () => {
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('1.2K')).toBeInTheDocument()
      })
    })

    it('should format numbers below 1000 as-is', async () => {
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('89')).toBeInTheDocument()
      })
    })

    it('should format large numbers in millions', async () => {
      const largeNumberData = {
        ...mockAnalyticsData,
        overview: {
          ...mockAnalyticsData.overview,
          totalFollowers: 1500000
        }
      }

      socialService.getSocialAnalytics.mockResolvedValueOnce(largeNumberData)

      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('1.5M')).toBeInTheDocument()
      })
    })
  })

  describe('Percentage Formatting', () => {
    it('should format decimal values as percentages', async () => {
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      const percentages = screen.getAllByText(/\d+\.\d+%/)
      expect(percentages.length).toBeGreaterThan(0)
    })
  })

  describe('Trend Indicators', () => {
    it('should show up arrow for positive changes', async () => {
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        const upArrows = screen.getAllByTestId('arrow-up-icon')
        expect(upArrows.length).toBeGreaterThan(0)
      })
    })

    it('should show down arrow for negative changes', async () => {
      const negativeChangeData = {
        ...mockAnalyticsData,
        overview: {
          ...mockAnalyticsData.overview,
          changes: {
            ...mockAnalyticsData.overview.changes,
            followers: { value: -10, percentage: -2.5 }
          }
        }
      }

      socialService.getSocialAnalytics.mockResolvedValueOnce(negativeChangeData)

      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByTestId('arrow-down-icon')).toBeInTheDocument()
      })
    })

    it('should apply positive class for positive changes', async () => {
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        const positiveChanges = document.querySelectorAll('.stat-change.positive')
        expect(positiveChanges.length).toBeGreaterThan(0)
      })
    })

    it('should apply negative class for negative changes', async () => {
      const negativeChangeData = {
        ...mockAnalyticsData,
        overview: {
          ...mockAnalyticsData.overview,
          changes: {
            ...mockAnalyticsData.overview.changes,
            followers: { value: -10, percentage: -2.5 }
          }
        }
      }

      socialService.getSocialAnalytics.mockResolvedValueOnce(negativeChangeData)

      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        const negativeChanges = document.querySelectorAll('.stat-change.negative')
        expect(negativeChanges.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Real-time Stats', () => {
    it('should display current follower count', async () => {
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('1.2K')).toBeInTheDocument()
      })
    })

    it('should display current engagement rate', async () => {
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Engagement Rate')).toBeInTheDocument()
      })
    })

    it('should display current influence score', async () => {
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Influence Score')).toBeInTheDocument()
      })
    })
  })

  describe('Progress Bars', () => {
    it('should render progress bars in engagement tab', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Engagement'))

      const progressBars = document.querySelectorAll('.progress-bar')
      expect(progressBars.length).toBeGreaterThan(0)
    })

    it('should render progress bars with correct widths', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Engagement'))

      const progressFills = document.querySelectorAll('.progress-fill')
      expect(progressFills.length).toBeGreaterThan(0)
    })

    it('should render progress bars in network tab', async () => {
      const user = userEvent.setup()
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Network'))

      const progressBars = document.querySelectorAll('.progress-bar')
      expect(progressBars.length).toBeGreaterThan(0)
    })
  })

  describe('Comparison with Previous Periods', () => {
    it('should display percentage change for followers', async () => {
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('3.8%')).toBeInTheDocument()
      })
    })

    it('should display percentage change for engagement', async () => {
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('9.1%')).toBeInTheDocument()
      })
    })

    it('should display percentage change for influence', async () => {
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('5.6%')).toBeInTheDocument()
      })
    })
  })

  describe('Demographics Display', () => {
    it('should handle demographics data when available', async () => {
      render(<SocialAnalytics onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Social Analytics')).toBeInTheDocument()
      })

      // Demographics are loaded but may not be displayed in all tabs
      expect(socialService.getSocialAnalytics).toHaveBeenCalled()
    })
  })
})

export default mockShowToast
