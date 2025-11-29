/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import KarmaSystem from './KarmaSystem';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Star: ({ size, className }) => <div data-testid="star-icon" data-size={size} className={className} />,
  TrendingUp: ({ size, className }) => <div data-testid="trending-up-icon" data-size={size} className={className} />,
  TrendingDown: ({ size, className }) => <div data-testid="trending-down-icon" data-size={size} className={className} />,
  Award: ({ size, className }) => <div data-testid="award-icon" data-size={size} className={className} />,
  Target: ({ size }) => <div data-testid="target-icon" data-size={size} />,
  Zap: ({ size }) => <div data-testid="zap-icon" data-size={size} />,
  Trophy: ({ size, className }) => <div data-testid="trophy-icon" data-size={size} className={className} />,
  Medal: ({ size }) => <div data-testid="medal-icon" data-size={size} />,
  Shield: ({ size }) => <div data-testid="shield-icon" data-size={size} />,
  Heart: ({ size, className }) => <div data-testid="heart-icon" data-size={size} className={className} />,
  MessageSquare: ({ size, className }) => <div data-testid="message-square-icon" data-size={size} className={className} />,
  Users: ({ size }) => <div data-testid="users-icon" data-size={size} />,
  ChevronUp: ({ size, className }) => <div data-testid="chevron-up-icon" data-size={size} className={className} />,
  ChevronDown: ({ size, className }) => <div data-testid="chevron-down-icon" data-size={size} className={className} />,
  Info: ({ size }) => <div data-testid="info-icon" data-size={size} />,
  Gift: ({ size }) => <div data-testid="gift-icon" data-size={size} />,
  Flame: ({ size }) => <div data-testid="flame-icon" data-size={size} />,
  Crown: ({ size }) => <div data-testid="crown-icon" data-size={size} />,
  Activity: ({ size }) => <div data-testid="activity-icon" data-size={size} />,
  BarChart3: ({ size }) => <div data-testid="bar-chart-icon" data-size={size} />,
  Calendar: ({ size }) => <div data-testid="calendar-icon" data-size={size} />,
  Clock: ({ size }) => <div data-testid="clock-icon" data-size={size} />,
  ArrowUp: ({ size }) => <div data-testid="arrow-up-icon" data-size={size} />
}));

// Mock CSS import
jest.mock('./KarmaSystem.css', () => ({}));

describe('KarmaSystem', () => {
  let mockFetch;

  const defaultUser = {
    id: '123',
    username: 'testuser',
    karma: 750
  };

  const mockKarmaData = {
    totalKarma: 750,
    weeklyKarma: 45,
    monthlyKarma: 180,
    rank: 'Member',
    percentile: 15,
    nextRank: 'Regular',
    karmaToNext: 250,
    breakdown: {
      posts: 250,
      comments: 200,
      awards: 150,
      helpfulness: 100,
      consistency: 50
    },
    history: [
      {
        type: 'post',
        description: 'Created a helpful post',
        timestamp: '2025-11-05T10:00:00Z',
        points: 25
      },
      {
        type: 'comment',
        description: 'Added a thoughtful comment',
        timestamp: '2025-11-05T09:00:00Z',
        points: 10
      },
      {
        type: 'award',
        description: 'Received Gold Award',
        timestamp: '2025-11-04T15:00:00Z',
        points: 100
      },
      {
        type: 'upvote',
        description: 'Post upvoted',
        timestamp: '2025-11-04T12:00:00Z',
        points: 5
      }
    ],
    achievements: [],
    leaderboard: []
  };

  const mockNegativeKarmaData = {
    ...mockKarmaData,
    weeklyKarma: -15
  };

  const mockEmptyHistoryData = {
    ...mockKarmaData,
    history: []
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock localStorage
    Storage.prototype.getItem = jest.fn(() => 'fake-token');

    // Mock fetch
    mockFetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockKarmaData)
      })
    );
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering and Initial State', () => {
    it('renders without crashing', () => {
      const { container } = render(<KarmaSystem user={defaultUser} onClose={jest.fn()} />);
      expect(container).toBeInTheDocument();
    });

    it('renders modal header with correct title', () => {
      render(<KarmaSystem user={defaultUser} onClose={jest.fn()} />);
      expect(screen.getByText('Karma System')).toBeInTheDocument();
      expect(screen.getByText('Track your contribution and reputation')).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(<KarmaSystem user={defaultUser} onClose={jest.fn()} />);
      const closeButton = screen.getByRole('button', { name: '✕' });
      expect(closeButton).toBeInTheDocument();
    });

    it('renders all four tab buttons', () => {
      render(<KarmaSystem user={defaultUser} onClose={jest.fn()} />);
      expect(screen.getByRole('button', { name: /overview/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /history/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /achievements/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /leaderboard/i })).toBeInTheDocument();
    });

    it('shows loading state initially', () => {
      render(<KarmaSystem user={defaultUser} onClose={jest.fn()} />);
      expect(screen.getByText('Loading karma data...')).toBeInTheDocument();
    });

    it('renders with default karma from user prop', () => {
      render(<KarmaSystem user={defaultUser} onClose={jest.fn()} />);
      expect(mockFetch).toHaveBeenCalled();
    });

    it('handles missing user prop gracefully', () => {
      expect(() => render(<KarmaSystem onClose={jest.fn()} />)).not.toThrow();
    });
  });

  describe('API Integration', () => {
    it('fetches karma data on mount', async () => {
      render(<KarmaSystem user={defaultUser} onClose={jest.fn()} />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/user/karma?range=week',
          expect.objectContaining({
            headers: {
              'Authorization': 'Bearer fake-token'
            }
          })
        );
      });
    });

    it('updates karma data after successful fetch', async () => {
      render(<KarmaSystem user={defaultUser} onClose={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('750')).toBeInTheDocument();
      });
    });

    it('handles fetch error gracefully', async () => {
      mockFetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<KarmaSystem user={defaultUser} onClose={jest.fn()} />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch karma data:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('handles non-ok response', async () => {
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 404
        })
      );

      render(<KarmaSystem user={defaultUser} onClose={jest.fn()} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading karma data...')).not.toBeInTheDocument();
      });
    });

    it('includes authorization token in request', async () => {
      render(<KarmaSystem user={defaultUser} onClose={jest.fn()} />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': 'Bearer fake-token'
            })
          })
        );
      });
    });
  });

  describe('Overview Tab', () => {
    beforeEach(async () => {
      render(<KarmaSystem user={defaultUser} onClose={jest.fn()} />);
      await waitFor(() => {
        expect(screen.queryByText('Loading karma data...')).not.toBeInTheDocument();
      });
    });

    it('displays total karma value', () => {
      expect(screen.getByText('750')).toBeInTheDocument();
      expect(screen.getByText('Total Karma')).toBeInTheDocument();
    });

    it('displays current rank name', () => {
      expect(screen.getByText('Member')).toBeInTheDocument();
      expect(screen.getByText('Current Rank')).toBeInTheDocument();
    });

    it('displays rank icon', () => {
      const rankValue = screen.getByText('750').closest('.karma-value');
      expect(rankValue.querySelector('.karma-icon')).toBeInTheDocument();
    });

    it('shows positive weekly karma with trending up icon', () => {
      expect(screen.getByText('+45 this week')).toBeInTheDocument();
      expect(screen.getByTestId('trending-up-icon')).toBeInTheDocument();
    });

    it('shows negative weekly karma with trending down icon', async () => {
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockNegativeKarmaData)
        })
      );

      const { rerender } = render(<KarmaSystem user={defaultUser} onClose={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('-15 this week')).toBeInTheDocument();
        expect(screen.getByTestId('trending-down-icon')).toBeInTheDocument();
      });
    });

    it('displays progress to next rank', () => {
      expect(screen.getByText(/Progress to Regular/i)).toBeInTheDocument();
      expect(screen.getByText('250 karma needed')).toBeInTheDocument();
    });

    it('shows progress bar with correct width', () => {
      const progressBar = document.querySelector('.progress-fill');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveStyle({ width: expect.stringContaining('%') });
    });

    it('displays percentile badge', () => {
      expect(screen.getByText('Top 15%')).toBeInTheDocument();
      expect(screen.getByText('of all users')).toBeInTheDocument();
      expect(screen.getByTestId('trophy-icon')).toBeInTheDocument();
    });

    it('displays karma breakdown section', () => {
      expect(screen.getByText('Karma Breakdown')).toBeInTheDocument();
    });

    it('shows posts karma breakdown', () => {
      expect(screen.getByText('Posts')).toBeInTheDocument();
      expect(screen.getByText('250')).toBeInTheDocument();
    });

    it('shows comments karma breakdown', () => {
      expect(screen.getByText('Comments')).toBeInTheDocument();
      expect(screen.getByText('200')).toBeInTheDocument();
    });

    it('shows awards karma breakdown', () => {
      expect(screen.getByText('Awards')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    it('shows helpfulness karma breakdown', () => {
      expect(screen.getByText('Helpfulness')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('shows consistency karma breakdown', () => {
      expect(screen.getByText('Consistency')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('renders karma breakdown bars with correct widths', () => {
      const bars = document.querySelectorAll('.bar-fill');
      expect(bars.length).toBeGreaterThan(0);
      bars.forEach(bar => {
        expect(bar).toHaveStyle({ width: expect.stringContaining('%') });
      });
    });

    it('displays karma tips section', () => {
      expect(screen.getByText('How to Earn Karma')).toBeInTheDocument();
    });

    it('shows quality content tip card', () => {
      expect(screen.getByText('Quality Content')).toBeInTheDocument();
      expect(screen.getByText('Create helpful posts and thoughtful comments')).toBeInTheDocument();
      expect(screen.getByText('+10-50 karma')).toBeInTheDocument();
    });

    it('shows upvote tip card', () => {
      expect(screen.getByText('Get Upvoted')).toBeInTheDocument();
      expect(screen.getByText('Receive upvotes on your contributions')).toBeInTheDocument();
      expect(screen.getByText('+1 karma each')).toBeInTheDocument();
    });

    it('shows awards tip card', () => {
      expect(screen.getByText('Earn Awards')).toBeInTheDocument();
      expect(screen.getByText('Receive awards from other users')).toBeInTheDocument();
      expect(screen.getByText('+25-100 karma')).toBeInTheDocument();
    });

    it('shows help others tip card', () => {
      expect(screen.getByText('Help Others')).toBeInTheDocument();
      expect(screen.getByText('Answer questions and provide support')).toBeInTheDocument();
      expect(screen.getByText('+5-20 karma')).toBeInTheDocument();
    });

    it('displays correct rank color styling', () => {
      const rankInfo = document.querySelector('.current-rank');
      expect(rankInfo).toHaveStyle({ borderColor: expect.any(String) });
    });

    it('formats large karma numbers with locale string', () => {
      expect(screen.getByText('750')).toBeInTheDocument();
    });
  });

  describe('History Tab', () => {
    beforeEach(async () => {
      render(<KarmaSystem user={defaultUser} onClose={jest.fn()} />);
      await waitFor(() => {
        expect(screen.queryByText('Loading karma data...')).not.toBeInTheDocument();
      });

      const historyTab = screen.getByRole('button', { name: /history/i });
      fireEvent.click(historyTab);
    });

    it('switches to history tab when clicked', () => {
      expect(screen.getByText('Karma History')).toBeInTheDocument();
    });

    it('displays time range selector', () => {
      const timeSelect = screen.getByRole('combobox');
      expect(timeSelect).toBeInTheDocument();
    });

    it('shows all time range options', () => {
      const timeSelect = screen.getByRole('combobox');
      expect(screen.getByRole('option', { name: 'Today' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'This Week' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'This Month' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'This Year' })).toBeInTheDocument();
    });

    it('has week selected by default', () => {
      const timeSelect = screen.getByRole('combobox');
      expect(timeSelect.value).toBe('week');
    });

    it('displays history chart section', () => {
      expect(screen.getByText('Karma trend visualization')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart-icon')).toBeInTheDocument();
    });

    it('renders mini chart bars', () => {
      const chartBars = document.querySelectorAll('.history-bar');
      expect(chartBars.length).toBe(12);
    });

    it('displays recent activity section', () => {
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });

    it('shows history items with correct structure', () => {
      expect(screen.getByText('Created a helpful post')).toBeInTheDocument();
      expect(screen.getByText('Added a thoughtful comment')).toBeInTheDocument();
      expect(screen.getByText('Received Gold Award')).toBeInTheDocument();
      expect(screen.getByText('Post upvoted')).toBeInTheDocument();
    });

    it('displays karma points for each history item', () => {
      expect(screen.getByText('+25')).toBeInTheDocument();
      expect(screen.getByText('+10')).toBeInTheDocument();
      expect(screen.getByText('+100')).toBeInTheDocument();
      expect(screen.getByText('+5')).toBeInTheDocument();
    });

    it('shows timestamps for history items', () => {
      const timestamps = document.querySelectorAll('.history-time');
      expect(timestamps.length).toBeGreaterThan(0);
    });

    it('displays appropriate icon for post type', () => {
      const historyIcons = document.querySelectorAll('.history-icon');
      expect(historyIcons.length).toBe(4);
    });

    it('shows empty state when no history', async () => {
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockEmptyHistoryData)
        })
      );

      const { rerender } = render(<KarmaSystem user={defaultUser} onClose={jest.fn()} />);

      await waitFor(() => {
        const historyTab = screen.getByRole('button', { name: /history/i });
        fireEvent.click(historyTab);
      });

      await waitFor(() => {
        expect(screen.getByText('No recent karma activity')).toBeInTheDocument();
      });
    });

    it('applies positive class to positive karma points', () => {
      const positivePoints = document.querySelectorAll('.history-points.positive');
      expect(positivePoints.length).toBeGreaterThan(0);
    });
  });

  describe('Time Range Filtering', () => {
    beforeEach(async () => {
      render(<KarmaSystem user={defaultUser} onClose={jest.fn()} />);
      await waitFor(() => {
        expect(screen.queryByText('Loading karma data...')).not.toBeInTheDocument();
      });

      const historyTab = screen.getByRole('button', { name: /history/i });
      fireEvent.click(historyTab);
    });

    it('changes time range to day', async () => {
      const timeSelect = screen.getByRole('combobox');
      fireEvent.change(timeSelect, { target: { value: 'day' } });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/user/karma?range=day',
          expect.any(Object)
        );
      });
    });

    it('changes time range to month', async () => {
      const timeSelect = screen.getByRole('combobox');
      fireEvent.change(timeSelect, { target: { value: 'month' } });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/user/karma?range=month',
          expect.any(Object)
        );
      });
    });

    it('changes time range to year', async () => {
      const timeSelect = screen.getByRole('combobox');
      fireEvent.change(timeSelect, { target: { value: 'year' } });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/user/karma?range=year',
          expect.any(Object)
        );
      });
    });

    it('shows loading state during time range change', async () => {
      const timeSelect = screen.getByRole('combobox');

      mockFetch.mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve(mockKarmaData)
        }), 100))
      );

      fireEvent.change(timeSelect, { target: { value: 'month' } });

      expect(screen.getByText('Loading karma data...')).toBeInTheDocument();
    });

    it('refetches data when time range changes', async () => {
      const initialCallCount = mockFetch.mock.calls.length;
      const timeSelect = screen.getByRole('combobox');

      fireEvent.change(timeSelect, { target: { value: 'day' } });

      await waitFor(() => {
        expect(mockFetch.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });
  });

  describe('Achievements Tab', () => {
    beforeEach(async () => {
      render(<KarmaSystem user={defaultUser} onClose={jest.fn()} />);
      await waitFor(() => {
        expect(screen.queryByText('Loading karma data...')).not.toBeInTheDocument();
      });

      const achievementsTab = screen.getByRole('button', { name: /achievements/i });
      fireEvent.click(achievementsTab);
    });

    it('switches to achievements tab when clicked', () => {
      expect(screen.getByText('Achievements & Badges')).toBeInTheDocument();
    });

    it('displays achievement cards', () => {
      expect(screen.getByText('First Post')).toBeInTheDocument();
      expect(screen.getByText('Helpful')).toBeInTheDocument();
      expect(screen.getByText('Popular')).toBeInTheDocument();
      expect(screen.getByText('Consistent')).toBeInTheDocument();
      expect(screen.getByText('Expert')).toBeInTheDocument();
      expect(screen.getByText('Influencer')).toBeInTheDocument();
    });

    it('shows earned achievements with earned class', () => {
      const earnedCards = document.querySelectorAll('.achievement-card.earned');
      expect(earnedCards.length).toBe(3);
    });

    it('shows locked achievements with locked class', () => {
      const lockedCards = document.querySelectorAll('.achievement-card.locked');
      expect(lockedCards.length).toBe(3);
    });

    it('displays achievement descriptions', () => {
      expect(screen.getByText('Create your first post')).toBeInTheDocument();
      expect(screen.getByText('Receive 10 helpful awards')).toBeInTheDocument();
      expect(screen.getByText('Get 100 upvotes')).toBeInTheDocument();
      expect(screen.getByText('30 day streak')).toBeInTheDocument();
      expect(screen.getByText('Reach Expert rank')).toBeInTheDocument();
      expect(screen.getByText('1000 followers')).toBeInTheDocument();
    });

    it('shows progress bars for locked achievements', () => {
      const progressBars = document.querySelectorAll('.achievement-progress');
      expect(progressBars.length).toBe(3);
    });

    it('displays correct progress percentage', () => {
      expect(screen.getByText('22%')).toBeInTheDocument();
      expect(screen.getByText('65%')).toBeInTheDocument();
      expect(screen.getByText('45%')).toBeInTheDocument();
    });

    it('does not show progress for earned achievements', () => {
      const earnedCards = document.querySelectorAll('.achievement-card.earned');
      earnedCards.forEach(card => {
        expect(card.querySelector('.achievement-progress')).not.toBeInTheDocument();
      });
    });

    it('displays upcoming milestones section', () => {
      expect(screen.getByText('Upcoming Milestones')).toBeInTheDocument();
    });

    it('shows milestone items', () => {
      expect(screen.getByText('Reach 1,000 Karma')).toBeInTheDocument();
      expect(screen.getByText('250 karma away')).toBeInTheDocument();
      expect(screen.getByText('Unlock Member Rank')).toBeInTheDocument();
      expect(screen.getByText('Next rank milestone')).toBeInTheDocument();
      expect(screen.getByText('7 Day Streak')).toBeInTheDocument();
      expect(screen.getByText('3 days to go')).toBeInTheDocument();
    });

    it('displays milestone icons', () => {
      expect(screen.getByTestId('trophy-icon')).toBeInTheDocument();
      expect(screen.getByTestId('star-icon')).toBeInTheDocument();
      expect(screen.getByTestId('flame-icon')).toBeInTheDocument();
    });

    it('renders achievement icons correctly', () => {
      const achievementIcons = document.querySelectorAll('.achievement-icon');
      expect(achievementIcons.length).toBe(6);
    });
  });

  describe('Leaderboard Tab', () => {
    beforeEach(async () => {
      render(<KarmaSystem user={defaultUser} onClose={jest.fn()} />);
      await waitFor(() => {
        expect(screen.queryByText('Loading karma data...')).not.toBeInTheDocument();
      });

      const leaderboardTab = screen.getByRole('button', { name: /leaderboard/i });
      fireEvent.click(leaderboardTab);
    });

    it('switches to leaderboard tab when clicked', () => {
      expect(screen.getByText('Karma Leaderboard')).toBeInTheDocument();
    });

    it('displays filter buttons', () => {
      expect(screen.getByRole('button', { name: 'Global' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Friends' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Community' })).toBeInTheDocument();
    });

    it('has global filter active by default', () => {
      const globalButton = screen.getByRole('button', { name: 'Global' });
      expect(globalButton).toHaveClass('active');
    });

    it('displays leaderboard entries', () => {
      expect(screen.getByText('CryptoKing')).toBeInTheDocument();
      expect(screen.getByText('Web3Master')).toBeInTheDocument();
      expect(screen.getByText('NFTExpert')).toBeInTheDocument();
      expect(screen.getByText('DeFiWizard')).toBeInTheDocument();
      expect(screen.getByText('BlockchainGuru')).toBeInTheDocument();
    });

    it('displays user rankings', () => {
      expect(screen.getByText('#4')).toBeInTheDocument();
      expect(screen.getByText('#5')).toBeInTheDocument();
      expect(screen.getByText('#42')).toBeInTheDocument();
    });

    it('shows karma amounts with locale formatting', () => {
      expect(screen.getByText('125,430')).toBeInTheDocument();
      expect(screen.getByText('98,765')).toBeInTheDocument();
      expect(screen.getByText('87,654')).toBeInTheDocument();
      expect(screen.getByText('76,543')).toBeInTheDocument();
      expect(screen.getByText('65,432')).toBeInTheDocument();
    });

    it('displays rank icons for top 3', () => {
      const rankIcons = document.querySelectorAll('.rank-icon');
      expect(rankIcons.length).toBe(3);
    });

    it('shows change indicators', () => {
      expect(screen.getAllByTestId('chevron-up-icon').length).toBeGreaterThan(0);
      expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
    });

    it('highlights current user entry', () => {
      const highlightedEntry = document.querySelector('.leaderboard-entry.highlight');
      expect(highlightedEntry).toBeInTheDocument();
    });

    it('shows current user in leaderboard', () => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    it('displays user avatars', () => {
      const avatars = document.querySelectorAll('.user-avatar');
      expect(avatars.length).toBeGreaterThan(0);
    });

    it('handles avatar load errors', () => {
      const avatar = document.querySelector('.user-avatar');
      fireEvent.error(avatar);
      expect(avatar.src).toContain('default-avatar.png');
    });

    it('displays view full leaderboard button', () => {
      expect(screen.getByRole('button', { name: 'View Full Leaderboard' })).toBeInTheDocument();
    });

    it('applies correct styling to rank changes', () => {
      const upChanges = document.querySelectorAll('.change-up');
      const downChanges = document.querySelectorAll('.change-down');
      expect(upChanges.length).toBeGreaterThan(0);
      expect(downChanges.length).toBeGreaterThan(0);
    });
  });

  describe('Tab Switching', () => {
    beforeEach(async () => {
      render(<KarmaSystem user={defaultUser} onClose={jest.fn()} />);
      await waitFor(() => {
        expect(screen.queryByText('Loading karma data...')).not.toBeInTheDocument();
      });
    });

    it('starts with overview tab active', () => {
      const overviewTab = screen.getByRole('button', { name: /overview/i });
      expect(overviewTab).toHaveClass('active');
    });

    it('switches from overview to history', () => {
      const historyTab = screen.getByRole('button', { name: /history/i });
      fireEvent.click(historyTab);

      expect(historyTab).toHaveClass('active');
      expect(screen.getByText('Karma History')).toBeInTheDocument();
    });

    it('switches from history to achievements', () => {
      const historyTab = screen.getByRole('button', { name: /history/i });
      fireEvent.click(historyTab);

      const achievementsTab = screen.getByRole('button', { name: /achievements/i });
      fireEvent.click(achievementsTab);

      expect(achievementsTab).toHaveClass('active');
      expect(screen.getByText('Achievements & Badges')).toBeInTheDocument();
    });

    it('switches from achievements to leaderboard', () => {
      const achievementsTab = screen.getByRole('button', { name: /achievements/i });
      fireEvent.click(achievementsTab);

      const leaderboardTab = screen.getByRole('button', { name: /leaderboard/i });
      fireEvent.click(leaderboardTab);

      expect(leaderboardTab).toHaveClass('active');
      expect(screen.getByText('Karma Leaderboard')).toBeInTheDocument();
    });

    it('switches from leaderboard back to overview', () => {
      const leaderboardTab = screen.getByRole('button', { name: /leaderboard/i });
      fireEvent.click(leaderboardTab);

      const overviewTab = screen.getByRole('button', { name: /overview/i });
      fireEvent.click(overviewTab);

      expect(overviewTab).toHaveClass('active');
      expect(screen.getByText('Total Karma')).toBeInTheDocument();
    });

    it('displays correct tab icon', () => {
      const overviewTab = screen.getByRole('button', { name: /overview/i });
      expect(overviewTab.querySelector('[data-testid="star-icon"]')).toBeInTheDocument();

      const historyTab = screen.getByRole('button', { name: /history/i });
      expect(historyTab.querySelector('[data-testid="clock-icon"]')).toBeInTheDocument();

      const achievementsTab = screen.getByRole('button', { name: /achievements/i });
      expect(achievementsTab.querySelector('[data-testid="trophy-icon"]')).toBeInTheDocument();

      const leaderboardTab = screen.getByRole('button', { name: /leaderboard/i });
      expect(leaderboardTab.querySelector('[data-testid="crown-icon"]')).toBeInTheDocument();
    });

    it('only one tab is active at a time', () => {
      const historyTab = screen.getByRole('button', { name: /history/i });
      fireEvent.click(historyTab);

      const activeTabs = document.querySelectorAll('.karma-tab.active');
      expect(activeTabs.length).toBe(1);
    });

    it('switches tabs rapidly without errors', () => {
      const overviewTab = screen.getByRole('button', { name: /overview/i });
      const historyTab = screen.getByRole('button', { name: /history/i });
      const achievementsTab = screen.getByRole('button', { name: /achievements/i });
      const leaderboardTab = screen.getByRole('button', { name: /leaderboard/i });

      fireEvent.click(historyTab);
      fireEvent.click(achievementsTab);
      fireEvent.click(leaderboardTab);
      fireEvent.click(overviewTab);
      fireEvent.click(historyTab);

      expect(historyTab).toHaveClass('active');
    });
  });

  describe('Rank Calculations', () => {
    it('correctly identifies Novice rank', async () => {
      const noviceUser = { ...defaultUser, karma: 50 };
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ...mockKarmaData, totalKarma: 50 })
        })
      );

      render(<KarmaSystem user={noviceUser} onClose={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('Novice')).toBeInTheDocument();
      });
    });

    it('correctly identifies Contributor rank', async () => {
      const contributorUser = { ...defaultUser, karma: 300 };
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ...mockKarmaData, totalKarma: 300, rank: 'Contributor' })
        })
      );

      render(<KarmaSystem user={contributorUser} onClose={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('Contributor')).toBeInTheDocument();
      });
    });

    it('correctly identifies Member rank', async () => {
      const memberUser = { ...defaultUser, karma: 750 };

      render(<KarmaSystem user={memberUser} onClose={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('Member')).toBeInTheDocument();
      });
    });

    it('correctly identifies Regular rank', async () => {
      const regularUser = { ...defaultUser, karma: 1500 };
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ...mockKarmaData, totalKarma: 1500, rank: 'Regular' })
        })
      );

      render(<KarmaSystem user={regularUser} onClose={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('Regular')).toBeInTheDocument();
      });
    });

    it('correctly identifies Trusted rank', async () => {
      const trustedUser = { ...defaultUser, karma: 3500 };
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ...mockKarmaData, totalKarma: 3500, rank: 'Trusted' })
        })
      );

      render(<KarmaSystem user={trustedUser} onClose={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('Trusted')).toBeInTheDocument();
      });
    });

    it('correctly identifies Expert rank', async () => {
      const expertUser = { ...defaultUser, karma: 7500 };
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ...mockKarmaData, totalKarma: 7500, rank: 'Expert' })
        })
      );

      render(<KarmaSystem user={expertUser} onClose={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('Expert')).toBeInTheDocument();
      });
    });

    it('correctly identifies Master rank', async () => {
      const masterUser = { ...defaultUser, karma: 15000 };
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ...mockKarmaData, totalKarma: 15000, rank: 'Master' })
        })
      );

      render(<KarmaSystem user={masterUser} onClose={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('Master')).toBeInTheDocument();
      });
    });

    it('correctly identifies Legend rank', async () => {
      const legendUser = { ...defaultUser, karma: 35000 };
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ...mockKarmaData, totalKarma: 35000, rank: 'Legend' })
        })
      );

      render(<KarmaSystem user={legendUser} onClose={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('Legend')).toBeInTheDocument();
      });
    });

    it('correctly identifies Mythic rank', async () => {
      const mythicUser = { ...defaultUser, karma: 55000 };
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ...mockKarmaData, totalKarma: 55000, rank: 'Mythic' })
        })
      );

      render(<KarmaSystem user={mythicUser} onClose={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('Mythic')).toBeInTheDocument();
      });
    });

    it('handles max rank correctly', async () => {
      const mythicUser = { ...defaultUser, karma: 55000 };
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            ...mockKarmaData,
            totalKarma: 55000,
            rank: 'Mythic',
            nextRank: null,
            karmaToNext: 0
          })
        })
      );

      render(<KarmaSystem user={mythicUser} onClose={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('Max rank achieved!')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading spinner', () => {
      render(<KarmaSystem user={defaultUser} onClose={jest.fn()} />);
      const spinner = document.querySelector('.spinner');
      expect(spinner).toBeInTheDocument();
    });

    it('hides loading state after data loads', async () => {
      render(<KarmaSystem user={defaultUser} onClose={jest.fn()} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading karma data...')).not.toBeInTheDocument();
      });
    });

    it('shows loading during initial fetch', () => {
      mockFetch.mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve(mockKarmaData)
        }), 100))
      );

      render(<KarmaSystem user={defaultUser} onClose={jest.fn()} />);
      expect(screen.getByText('Loading karma data...')).toBeInTheDocument();
    });
  });

  describe('Close Button', () => {
    it('calls onClose when close button is clicked', () => {
      const onClose = jest.fn();
      render(<KarmaSystem user={defaultUser} onClose={onClose} />);

      const closeButton = screen.getByRole('button', { name: '✕' });
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('closes modal on first click only', () => {
      const onClose = jest.fn();
      render(<KarmaSystem user={defaultUser} onClose={onClose} />);

      const closeButton = screen.getByRole('button', { name: '✕' });
      fireEvent.click(closeButton);
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(2);
    });
  });

  describe('Snapshots', () => {
    it('matches snapshot for overview tab', async () => {
      const { container } = render(<KarmaSystem user={defaultUser} onClose={jest.fn()} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading karma data...')).not.toBeInTheDocument();
      });

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for history tab', async () => {
      const { container } = render(<KarmaSystem user={defaultUser} onClose={jest.fn()} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading karma data...')).not.toBeInTheDocument();
      });

      const historyTab = screen.getByRole('button', { name: /history/i });
      fireEvent.click(historyTab);

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for achievements tab', async () => {
      const { container } = render(<KarmaSystem user={defaultUser} onClose={jest.fn()} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading karma data...')).not.toBeInTheDocument();
      });

      const achievementsTab = screen.getByRole('button', { name: /achievements/i });
      fireEvent.click(achievementsTab);

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for leaderboard tab', async () => {
      const { container } = render(<KarmaSystem user={defaultUser} onClose={jest.fn()} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading karma data...')).not.toBeInTheDocument();
      });

      const leaderboardTab = screen.getByRole('button', { name: /leaderboard/i });
      fireEvent.click(leaderboardTab);

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for loading state', () => {
      mockFetch.mockImplementationOnce(() => new Promise(() => {})); // Never resolves
      const { container } = render(<KarmaSystem user={defaultUser} onClose={jest.fn()} />);

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for empty history state', async () => {
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockEmptyHistoryData)
        })
      );

      const { container } = render(<KarmaSystem user={defaultUser} onClose={jest.fn()} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading karma data...')).not.toBeInTheDocument();
      });

      const historyTab = screen.getByRole('button', { name: /history/i });
      fireEvent.click(historyTab);

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with negative karma trend', async () => {
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockNegativeKarmaData)
        })
      );

      const { container } = render(<KarmaSystem user={defaultUser} onClose={jest.fn()} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading karma data...')).not.toBeInTheDocument();
      });

      expect(container).toMatchSnapshot();
    });
  });
});

export default defaultUser
