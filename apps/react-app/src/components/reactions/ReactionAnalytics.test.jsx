import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReactionAnalytics, {
  AnalyticsCard,
  ReactionChart,
  TrendingContent,
  ReactionLeaderboard
} from './ReactionAnalytics';
import { DEFAULT_REACTIONS } from './ReactionPicker';

global.fetch = jest.fn();

const mockAnalyticsData = {
  totalReactions: 1250,
  uniqueUsers: 350,
  engagementRate: 42.5,
  engagementTrend: 'up',
  trendingScore: 8750,
  trendDirection: 'up',
  chartData: [
    {
      timestamp: new Date('2025-01-01T00:00:00Z').getTime(),
      reactions: { like: 45, love: 30, laugh: 20, wow: 10, sad: 5 }
    },
    {
      timestamp: new Date('2025-01-01T06:00:00Z').getTime(),
      reactions: { like: 60, love: 40, laugh: 25, wow: 15, sad: 8 }
    },
    {
      timestamp: new Date('2025-01-01T12:00:00Z').getTime(),
      reactions: { like: 75, love: 50, laugh: 30, wow: 20, sad: 10 }
    }
  ],
  reactionBreakdown: {
    like: 500,
    love: 350,
    laugh: 200,
    wow: 150,
    sad: 50
  },
  peakHours: {
    start: '6PM',
    end: '9PM'
  },
  contentInsights: {
    topType: 'Posts'
  },
  behaviorInsights: {
    tendency: 'positively'
  },
  growthTrend: {
    direction: 'increased',
    percentage: 15
  }
};

const mockTrendingData = [
  {
    content_id: 'content1',
    content_info: {
      title: 'Trending Post 1',
      content: 'This is a trending post content'
    },
    trend_score: 5400,
    total_reactions: 320,
    total_unique_users: 180
  },
  {
    content_id: 'content2',
    content_info: {
      content: 'This is another trending post without a title that should be truncated to show only first 100 characters maximum'
    },
    trend_score: 4200,
    total_reactions: 280,
    total_unique_users: 150
  }
];

const mockLeaderboardData = [
  {
    user_id: 'user1',
    username: 'john_doe',
    display_name: 'John Doe',
    avatar: 'https://example.com/avatar1.jpg',
    total_reactions_given: 1500,
    total_reactions_received: 2300,
    reaction_streak: 15,
    achievement_badges: [{ emoji: '🏆' }, { emoji: '⭐' }]
  },
  {
    user_id: 'user2',
    username: 'jane_smith',
    display_name: 'Jane Smith',
    avatar: null,
    total_reactions_given: 1200,
    total_reactions_received: 1800,
    reaction_streak: 5,
    achievement_badges: []
  },
  {
    user_id: 'user3',
    username: 'bob_wilson',
    total_reactions_given: 800,
    total_reactions_received: 1500,
    reaction_streak: 10,
    achievement_badges: [{ emoji: '🎯' }]
  }
];

describe('AnalyticsCard', () => {
  const mockIcon = () => <div>Icon</div>;

  test('renders card with title and value', () => {
    render(
      <AnalyticsCard
        title="Test Title"
        value={100}
        icon={mockIcon}
        color="#007bff"
      />
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  test('renders card with subtitle', () => {
    render(
      <AnalyticsCard
        title="Test Title"
        value={100}
        subtitle="Test Subtitle"
        icon={mockIcon}
        color="#007bff"
      />
    );

    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  test('renders upward trend indicator', () => {
    render(
      <AnalyticsCard
        title="Test Title"
        value={100}
        icon={mockIcon}
        trend="up"
        color="#007bff"
      />
    );

    expect(screen.getByText('Trending up')).toBeInTheDocument();
  });

  test('renders downward trend indicator', () => {
    render(
      <AnalyticsCard
        title="Test Title"
        value={100}
        icon={mockIcon}
        trend="down"
        color="#007bff"
      />
    );

    expect(screen.getByText('Trending down')).toBeInTheDocument();
  });

  test('renders without trend indicator', () => {
    render(
      <AnalyticsCard
        title="Test Title"
        value={100}
        icon={mockIcon}
        color="#007bff"
      />
    );

    expect(screen.queryByText(/Trending/)).not.toBeInTheDocument();
  });

  test('applies clickable class when onClick provided', () => {
    const handleClick = jest.fn();
    const { container } = render(
      <AnalyticsCard
        title="Test Title"
        value={100}
        icon={mockIcon}
        onClick={handleClick}
        color="#007bff"
      />
    );

    const card = container.querySelector('.analytics-card');
    expect(card).toHaveClass('clickable');
  });

  test('calls onClick when card is clicked', () => {
    const handleClick = jest.fn();
    const { container } = render(
      <AnalyticsCard
        title="Test Title"
        value={100}
        icon={mockIcon}
        onClick={handleClick}
        color="#007bff"
      />
    );

    const card = container.querySelector('.analytics-card');
    fireEvent.click(card);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('applies custom color CSS variable', () => {
    const { container } = render(
      <AnalyticsCard
        title="Test Title"
        value={100}
        icon={mockIcon}
        color="#ff5733"
      />
    );

    const card = container.querySelector('.analytics-card');
    expect(card).toHaveStyle({ '--card-color': '#ff5733' });
  });

  test('applies trend class to card', () => {
    const { container } = render(
      <AnalyticsCard
        title="Test Title"
        value={100}
        icon={mockIcon}
        trend="up"
        color="#007bff"
      />
    );

    const card = container.querySelector('.analytics-card');
    expect(card).toHaveClass('trend-up');
  });
});

describe('ReactionChart', () => {
  const mockChartData = [
    {
      timestamp: new Date('2025-01-01T00:00:00Z').getTime(),
      reactions: { like: 45, love: 30 }
    },
    {
      timestamp: new Date('2025-01-01T06:00:00Z').getTime(),
      reactions: { like: 60, love: 40 }
    }
  ];

  test('renders chart with title', () => {
    render(<ReactionChart data={mockChartData} timeframe="24h" />);
    expect(screen.getByText('Reaction Trends')).toBeInTheDocument();
  });

  test('renders legend with reaction types', () => {
    render(<ReactionChart data={mockChartData} timeframe="24h" />);

    expect(screen.getByText('Like')).toBeInTheDocument();
    expect(screen.getByText('Love')).toBeInTheDocument();
  });

  test('renders all data points', () => {
    const { container } = render(<ReactionChart data={mockChartData} timeframe="24h" />);

    const barGroups = container.querySelectorAll('.chart-bar-group');
    expect(barGroups).toHaveLength(2);
  });

  test('formats 24h timeframe dates correctly', () => {
    render(<ReactionChart data={mockChartData} timeframe="24h" />);

    const labels = screen.getAllByText(/\d{2}:\d{2}/);
    expect(labels.length).toBeGreaterThan(0);
  });

  test('formats 7d timeframe dates correctly', () => {
    const weekData = [
      { timestamp: new Date('2025-01-01').getTime(), reactions: { like: 45 } }
    ];
    render(<ReactionChart data={weekData} timeframe="7d" />);

    const labels = screen.getAllByText(/Mon|Tue|Wed|Thu|Fri|Sat|Sun/);
    expect(labels.length).toBeGreaterThan(0);
  });

  test('formats month timeframe dates correctly', () => {
    const monthData = [
      { timestamp: new Date('2025-01-15').getTime(), reactions: { like: 45 } }
    ];
    render(<ReactionChart data={monthData} timeframe="30d" />);

    const { container } = render(<ReactionChart data={monthData} timeframe="30d" />);
    expect(container).toBeInTheDocument();
  });

  test('filters chart by selected reaction', () => {
    render(<ReactionChart data={mockChartData} timeframe="24h" />);

    const likeButton = screen.getByText('Like').closest('button');
    fireEvent.click(likeButton);

    expect(likeButton).toHaveClass('active');
  });

  test('toggles reaction filter on second click', () => {
    render(<ReactionChart data={mockChartData} timeframe="24h" />);

    const likeButton = screen.getByText('Like').closest('button');
    fireEvent.click(likeButton);
    expect(likeButton).toHaveClass('active');

    fireEvent.click(likeButton);
    expect(likeButton).not.toHaveClass('active');
  });

  test('applies custom height to chart container', () => {
    const { container } = render(<ReactionChart data={mockChartData} timeframe="24h" height={300} />);

    const chartContainer = container.querySelector('.chart-container');
    expect(chartContainer).toHaveStyle({ height: '300px' });
  });

  test('calculates max value correctly', () => {
    const { container } = render(<ReactionChart data={mockChartData} timeframe="24h" />);

    const yAxisLabels = container.querySelectorAll('.y-axis-label');
    expect(yAxisLabels.length).toBe(5);
  });

  test('renders bars with correct colors', () => {
    const { container } = render(<ReactionChart data={mockChartData} timeframe="24h" />);

    const bars = container.querySelectorAll('.chart-bar');
    expect(bars.length).toBeGreaterThan(0);
  });

  test('handles empty reaction data', () => {
    const emptyData = [{ timestamp: Date.now(), reactions: {} }];
    const { container } = render(<ReactionChart data={emptyData} timeframe="24h" />);

    expect(container.querySelector('.chart-content')).toBeInTheDocument();
  });
});

describe('TrendingContent', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders trending header with content type', () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: { trending: [] } })
    });

    render(<TrendingContent contentType="post" onViewContent={jest.fn()} />);
    expect(screen.getByText(/Trending post/i)).toBeInTheDocument();
  });

  test('renders loading state initially', () => {
    fetch.mockImplementationOnce(() => new Promise(() => {}));

    render(<TrendingContent contentType="post" onViewContent={jest.fn()} />);
    expect(screen.getByText('Finding trending content...')).toBeInTheDocument();
  });

  test('fetches trending data on mount', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: { trending: mockTrendingData } })
    });

    render(<TrendingContent contentType="post" onViewContent={jest.fn()} />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/reactions/trending')
      );
    });
  });

  test('renders trending items after loading', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: { trending: mockTrendingData } })
    });

    render(<TrendingContent contentType="post" onViewContent={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Trending Post 1')).toBeInTheDocument();
    });
  });

  test('displays item rank numbers', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: { trending: mockTrendingData } })
    });

    render(<TrendingContent contentType="post" onViewContent={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
    });
  });

  test('formats trend score correctly for values over 1000', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: { trending: mockTrendingData } })
    });

    render(<TrendingContent contentType="post" onViewContent={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('5.4K trend')).toBeInTheDocument();
    });
  });

  test('formats trend score correctly for values under 1000', async () => {
    const lowScoreData = [{
      ...mockTrendingData[0],
      trend_score: 500
    }];

    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: { trending: lowScoreData } })
    });

    render(<TrendingContent contentType="post" onViewContent={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('500 trend')).toBeInTheDocument();
    });
  });

  test('displays reaction stats for items', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: { trending: mockTrendingData } })
    });

    render(<TrendingContent contentType="post" onViewContent={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('320 reactions')).toBeInTheDocument();
      expect(screen.getByText('180 users')).toBeInTheDocument();
    });
  });

  test('renders timeframe selector buttons', () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: { trending: [] } })
    });

    render(<TrendingContent contentType="post" onViewContent={jest.fn()} />);

    expect(screen.getByText('1h')).toBeInTheDocument();
    expect(screen.getByText('6h')).toBeInTheDocument();
    expect(screen.getByText('24h')).toBeInTheDocument();
    expect(screen.getByText('7d')).toBeInTheDocument();
  });

  test('changes timeframe when button clicked', async () => {
    fetch.mockResolvedValue({
      json: async () => ({ success: true, data: { trending: [] } })
    });

    render(<TrendingContent contentType="post" onViewContent={jest.fn()} />);

    const sevenDayButton = screen.getByText('7d');
    fireEvent.click(sevenDayButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('period=7d')
      );
    });
  });

  test('refetches data when timeframe changes', async () => {
    fetch.mockResolvedValue({
      json: async () => ({ success: true, data: { trending: [] } })
    });

    render(<TrendingContent contentType="post" onViewContent={jest.fn()} />);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    const oneHourButton = screen.getByText('1h');
    fireEvent.click(oneHourButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  test('calls onViewContent when view button clicked', async () => {
    const handleViewContent = jest.fn();
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: { trending: mockTrendingData } })
    });

    render(<TrendingContent contentType="post" onViewContent={handleViewContent} />);

    await waitFor(() => {
      const viewButtons = screen.getAllByRole('button', { name: '' });
      const viewButton = viewButtons.find(btn => btn.className.includes('view-content-btn'));
      if (viewButton) {
        fireEvent.click(viewButton);
        expect(handleViewContent).toHaveBeenCalledWith(mockTrendingData[0]);
      }
    });
  });

  test('displays no trending message when list is empty', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: { trending: [] } })
    });

    render(<TrendingContent contentType="post" onViewContent={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('No trending content')).toBeInTheDocument();
    });
  });

  test('truncates long content without title', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: { trending: mockTrendingData } })
    });

    render(<TrendingContent contentType="post" onViewContent={jest.fn()} />);

    await waitFor(() => {
      const truncatedText = screen.getByText(/This is another trending post without a title/);
      expect(truncatedText).toBeInTheDocument();
    });
  });

  test('handles fetch errors gracefully', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<TrendingContent contentType="post" onViewContent={jest.fn()} />);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });

    consoleError.mockRestore();
  });
});

describe('ReactionLeaderboard', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders leaderboard header', () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: { leaderboard: [] } })
    });

    render(<ReactionLeaderboard timeframe="30d" limit={10} />);
    expect(screen.getByText('Top Reactors')).toBeInTheDocument();
  });

  test('displays timeframe label', () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: { leaderboard: [] } })
    });

    render(<ReactionLeaderboard timeframe="30d" limit={10} />);
    expect(screen.getByText('30d')).toBeInTheDocument();
  });

  test('shows loading spinner initially', () => {
    fetch.mockImplementationOnce(() => new Promise(() => {}));

    const { container } = render(<ReactionLeaderboard timeframe="30d" limit={10} />);
    expect(container.querySelector('.loading-spinner')).toBeInTheDocument();
  });

  test('fetches leaderboard data on mount', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: { leaderboard: mockLeaderboardData } })
    });

    render(<ReactionLeaderboard timeframe="30d" limit={10} />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/reactions/leaderboard')
      );
    });
  });

  test('renders leaderboard users after loading', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: { leaderboard: mockLeaderboardData } })
    });

    render(<ReactionLeaderboard timeframe="30d" limit={10} />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  test('displays medals for top 3 users', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: { leaderboard: mockLeaderboardData } })
    });

    render(<ReactionLeaderboard timeframe="30d" limit={10} />);

    await waitFor(() => {
      expect(screen.getByText('🥇')).toBeInTheDocument();
      expect(screen.getByText('🥈')).toBeInTheDocument();
      expect(screen.getByText('🥉')).toBeInTheDocument();
    });
  });

  test('displays rank numbers for users below top 3', async () => {
    const extendedData = [...mockLeaderboardData, {
      user_id: 'user4',
      username: 'user4',
      total_reactions_given: 500,
      total_reactions_received: 800,
      reaction_streak: 3
    }];

    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: { leaderboard: extendedData } })
    });

    render(<ReactionLeaderboard timeframe="30d" limit={10} />);

    await waitFor(() => {
      expect(screen.getByText('#4')).toBeInTheDocument();
    });
  });

  test('displays user avatars when available', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: { leaderboard: mockLeaderboardData } })
    });

    render(<ReactionLeaderboard timeframe="30d" limit={10} />);

    await waitFor(() => {
      const avatar = screen.getByAlt('John Doe');
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar1.jpg');
    });
  });

  test('displays avatar placeholder when avatar not available', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: { leaderboard: mockLeaderboardData } })
    });

    render(<ReactionLeaderboard timeframe="30d" limit={10} />);

    await waitFor(() => {
      expect(screen.getByText('J')).toBeInTheDocument();
    });
  });

  test('uses username when display_name not available', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: { leaderboard: mockLeaderboardData } })
    });

    render(<ReactionLeaderboard timeframe="30d" limit={10} />);

    await waitFor(() => {
      expect(screen.getByText('bob_wilson')).toBeInTheDocument();
    });
  });

  test('formats numbers over 1000 with K suffix', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: { leaderboard: mockLeaderboardData } })
    });

    render(<ReactionLeaderboard timeframe="30d" limit={10} />);

    await waitFor(() => {
      expect(screen.getByText('1.5K given')).toBeInTheDocument();
    });
  });

  test('displays reactions given and received stats', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: { leaderboard: mockLeaderboardData } })
    });

    render(<ReactionLeaderboard timeframe="30d" limit={10} />);

    await waitFor(() => {
      expect(screen.getByText('1.5K given')).toBeInTheDocument();
      expect(screen.getByText('2.3K received')).toBeInTheDocument();
    });
  });

  test('displays streak achievement for streaks over 7', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: { leaderboard: mockLeaderboardData } })
    });

    const { container } = render(<ReactionLeaderboard timeframe="30d" limit={10} />);

    await waitFor(() => {
      const achievements = container.querySelectorAll('.achievement');
      expect(achievements.length).toBeGreaterThan(0);
    });
  });

  test('does not display streak for streaks 7 or under', async () => {
    const lowStreakData = [{
      ...mockLeaderboardData[1],
      reaction_streak: 5
    }];

    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: { leaderboard: lowStreakData } })
    });

    const { container } = render(<ReactionLeaderboard timeframe="30d" limit={10} />);

    await waitFor(() => {
      const userItem = screen.getByText('Jane Smith').closest('.leaderboard-item');
      const achievement = userItem?.querySelector('.achievement');
      expect(achievement).toBeFalsy();
    });
  });

  test('displays achievement badges', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: { leaderboard: mockLeaderboardData } })
    });

    render(<ReactionLeaderboard timeframe="30d" limit={10} />);

    await waitFor(() => {
      expect(screen.getByText('🏆')).toBeInTheDocument();
      expect(screen.getByText('⭐')).toBeInTheDocument();
    });
  });

  test('refetches data when timeframe changes', async () => {
    fetch.mockResolvedValue({
      json: async () => ({ success: true, data: { leaderboard: [] } })
    });

    const { rerender } = render(<ReactionLeaderboard timeframe="30d" limit={10} />);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    rerender(<ReactionLeaderboard timeframe="7d" limit={10} />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  test('handles fetch errors gracefully', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<ReactionLeaderboard timeframe="30d" limit={10} />);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });

    consoleError.mockRestore();
  });
});

describe('ReactionAnalytics', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders analytics header', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockAnalyticsData })
    });

    render(<ReactionAnalytics contentType="post" />);

    await waitFor(() => {
      expect(screen.getByText('Reaction Analytics')).toBeInTheDocument();
    });
  });

  test('displays loading state initially', () => {
    fetch.mockImplementationOnce(() => new Promise(() => {}));

    render(<ReactionAnalytics contentType="post" />);

    expect(screen.getByText('Analyzing reactions...')).toBeInTheDocument();
    expect(screen.getByText('Gathering insights from user engagement')).toBeInTheDocument();
  });

  test('fetches global analytics when no contentId provided', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockAnalyticsData })
    });

    render(<ReactionAnalytics contentType="post" timeframe="24h" />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/reactions/analytics/global')
      );
    });
  });

  test('fetches content-specific analytics when contentId provided', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockAnalyticsData })
    });

    render(<ReactionAnalytics contentType="post" contentId="123" timeframe="24h" />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/reactions/post/123')
      );
    });
  });

  test('renders all tab buttons', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockAnalyticsData })
    });

    render(<ReactionAnalytics contentType="post" />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Trending')).toBeInTheDocument();
      expect(screen.getByText('Top Users')).toBeInTheDocument();
      expect(screen.getByText('Insights')).toBeInTheDocument();
    });
  });

  test('overview tab is active by default', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockAnalyticsData })
    });

    render(<ReactionAnalytics contentType="post" />);

    await waitFor(() => {
      const overviewTab = screen.getByText('Overview').closest('button');
      expect(overviewTab).toHaveClass('active');
    });
  });

  test('switches to trending tab when clicked', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockAnalyticsData })
    });

    render(<ReactionAnalytics contentType="post" showTrending={true} />);

    await waitFor(() => {
      const trendingTab = screen.getByText('Trending');
      fireEvent.click(trendingTab);
      expect(trendingTab.closest('button')).toHaveClass('active');
    });
  });

  test('switches to leaderboard tab when clicked', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockAnalyticsData })
    });

    render(<ReactionAnalytics contentType="post" showLeaderboard={true} />);

    await waitFor(() => {
      const leaderboardTab = screen.getByText('Top Users');
      fireEvent.click(leaderboardTab);
      expect(leaderboardTab.closest('button')).toHaveClass('active');
    });
  });

  test('switches to insights tab when clicked', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockAnalyticsData })
    });

    render(<ReactionAnalytics contentType="post" />);

    await waitFor(() => {
      const insightsTab = screen.getByText('Insights');
      fireEvent.click(insightsTab);
      expect(insightsTab.closest('button')).toHaveClass('active');
    });
  });

  test('displays analytics cards in overview tab', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockAnalyticsData })
    });

    render(<ReactionAnalytics contentType="post" />);

    await waitFor(() => {
      expect(screen.getByText('Total Reactions')).toBeInTheDocument();
      expect(screen.getByText('Unique Users')).toBeInTheDocument();
      expect(screen.getByText('Engagement Rate')).toBeInTheDocument();
      expect(screen.getByText('Trending Score')).toBeInTheDocument();
    });
  });

  test('displays correct analytics values', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockAnalyticsData })
    });

    render(<ReactionAnalytics contentType="post" />);

    await waitFor(() => {
      expect(screen.getByText('1250')).toBeInTheDocument();
      expect(screen.getByText('350')).toBeInTheDocument();
      expect(screen.getByText('42.5%')).toBeInTheDocument();
      expect(screen.getByText('8750')).toBeInTheDocument();
    });
  });

  test('renders chart when showChart is true and data exists', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockAnalyticsData })
    });

    render(<ReactionAnalytics contentType="post" showChart={true} />);

    await waitFor(() => {
      expect(screen.getByText('Reaction Trends')).toBeInTheDocument();
    });
  });

  test('does not render chart when showChart is false', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockAnalyticsData })
    });

    render(<ReactionAnalytics contentType="post" showChart={false} />);

    await waitFor(() => {
      expect(screen.queryByText('Reaction Trends')).not.toBeInTheDocument();
    });
  });

  test('displays popular reactions breakdown', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockAnalyticsData })
    });

    render(<ReactionAnalytics contentType="post" />);

    await waitFor(() => {
      expect(screen.getByText('Most Popular Reactions')).toBeInTheDocument();
      expect(screen.getByText('Like')).toBeInTheDocument();
      expect(screen.getByText('Love')).toBeInTheDocument();
    });
  });

  test('calculates and displays reaction percentages', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockAnalyticsData })
    });

    render(<ReactionAnalytics contentType="post" />);

    await waitFor(() => {
      expect(screen.getByText(/40\.0%/)).toBeInTheDocument();
      expect(screen.getByText(/28\.0%/)).toBeInTheDocument();
    });
  });

  test('renders trending content in trending tab', async () => {
    fetch.mockResolvedValue({
      json: async () => ({ success: true, data: mockAnalyticsData })
    });

    render(<ReactionAnalytics contentType="post" showTrending={true} />);

    await waitFor(() => {
      const trendingTab = screen.getByText('Trending');
      fireEvent.click(trendingTab);
    });

    await waitFor(() => {
      const { container } = render(<ReactionAnalytics contentType="post" showTrending={true} />);
      expect(container).toBeInTheDocument();
    });
  });

  test('does not render trending when showTrending is false', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockAnalyticsData })
    });

    render(<ReactionAnalytics contentType="post" showTrending={false} />);

    await waitFor(() => {
      const trendingTab = screen.getByText('Trending');
      fireEvent.click(trendingTab);
    });

    const { container } = render(<ReactionAnalytics contentType="post" showTrending={false} />);
    await waitFor(() => {
      expect(container.querySelector('.trending-tab')).not.toBeInTheDocument();
    });
  });

  test('renders leaderboard in leaderboard tab', async () => {
    fetch.mockResolvedValue({
      json: async () => ({ success: true, data: mockAnalyticsData })
    });

    render(<ReactionAnalytics contentType="post" showLeaderboard={true} />);

    await waitFor(() => {
      const leaderboardTab = screen.getByText('Top Users');
      fireEvent.click(leaderboardTab);
    });
  });

  test('displays insights in insights tab', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockAnalyticsData })
    });

    render(<ReactionAnalytics contentType="post" />);

    await waitFor(() => {
      const insightsTab = screen.getByText('Insights');
      fireEvent.click(insightsTab);
    });

    await waitFor(() => {
      expect(screen.getByText('Peak Activity')).toBeInTheDocument();
      expect(screen.getByText('Popular Content')).toBeInTheDocument();
      expect(screen.getByText('User Behavior')).toBeInTheDocument();
      expect(screen.getByText('Growth Trend')).toBeInTheDocument();
    });
  });

  test('displays peak hours insight', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockAnalyticsData })
    });

    render(<ReactionAnalytics contentType="post" />);

    await waitFor(() => {
      const insightsTab = screen.getByText('Insights');
      fireEvent.click(insightsTab);
    });

    await waitFor(() => {
      expect(screen.getByText(/6PM - 9PM/)).toBeInTheDocument();
    });
  });

  test('displays content insights', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockAnalyticsData })
    });

    render(<ReactionAnalytics contentType="post" />);

    await waitFor(() => {
      const insightsTab = screen.getByText('Insights');
      fireEvent.click(insightsTab);
    });

    await waitFor(() => {
      expect(screen.getByText(/Posts get the most reactions/)).toBeInTheDocument();
    });
  });

  test('displays behavior insights', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockAnalyticsData })
    });

    render(<ReactionAnalytics contentType="post" />);

    await waitFor(() => {
      const insightsTab = screen.getByText('Insights');
      fireEvent.click(insightsTab);
    });

    await waitFor(() => {
      expect(screen.getByText(/positively/)).toBeInTheDocument();
    });
  });

  test('displays growth trend insights', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockAnalyticsData })
    });

    render(<ReactionAnalytics contentType="post" />);

    await waitFor(() => {
      const insightsTab = screen.getByText('Insights');
      fireEvent.click(insightsTab);
    });

    await waitFor(() => {
      expect(screen.getByText(/increased by 15%/)).toBeInTheDocument();
    });
  });

  test('refetches data when timeframe changes', async () => {
    fetch.mockResolvedValue({
      json: async () => ({ success: true, data: mockAnalyticsData })
    });

    const { rerender } = render(<ReactionAnalytics contentType="post" timeframe="24h" />);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    rerender(<ReactionAnalytics contentType="post" timeframe="7d" />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  test('refetches data when contentType changes', async () => {
    fetch.mockResolvedValue({
      json: async () => ({ success: true, data: mockAnalyticsData })
    });

    const { rerender } = render(<ReactionAnalytics contentType="post" />);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    rerender(<ReactionAnalytics contentType="comment" />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  test('refetches data when contentId changes', async () => {
    fetch.mockResolvedValue({
      json: async () => ({ success: true, data: mockAnalyticsData })
    });

    const { rerender } = render(<ReactionAnalytics contentType="post" contentId="123" />);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    rerender(<ReactionAnalytics contentType="post" contentId="456" />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  test('handles fetch errors gracefully', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<ReactionAnalytics contentType="post" />);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });

    consoleError.mockRestore();
  });

  test('handles missing analytics data gracefully', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: {} })
    });

    render(<ReactionAnalytics contentType="post" />);

    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  test('passes onContentView to TrendingContent', async () => {
    const handleContentView = jest.fn();
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockAnalyticsData })
    });

    render(
      <ReactionAnalytics
        contentType="post"
        showTrending={true}
        onContentView={handleContentView}
      />
    );

    await waitFor(() => {
      const trendingTab = screen.getByText('Trending');
      fireEvent.click(trendingTab);
    });
  });

  test('handles null analytics gracefully', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: false })
    });

    render(<ReactionAnalytics contentType="post" />);

    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });
});

export default mockAnalyticsData
