import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AnalyticsDashboard from './AnalyticsDashboard';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  TrendingUp: (props) => <div data-testid="trending-up-icon" {...props} />,
  TrendingDown: (props) => <div data-testid="trending-down-icon" {...props} />,
  Users: (props) => <div data-testid="users-icon" {...props} />,
  MessageSquare: (props) => <div data-testid="message-square-icon" {...props} />,
  Heart: (props) => <div data-testid="heart-icon" {...props} />,
  Eye: (props) => <div data-testid="eye-icon" {...props} />,
  Activity: (props) => <div data-testid="activity-icon" {...props} />,
  Clock: (props) => <div data-testid="clock-icon" {...props} />,
  Calendar: (props) => <div data-testid="calendar-icon" {...props} />,
  BarChart3: (props) => <div data-testid="bar-chart3-icon" {...props} />,
  PieChart: (props) => <div data-testid="pie-chart-icon" {...props} />,
  Filter: (props) => <div data-testid="filter-icon" {...props} />,
  Download: (props) => <div data-testid="download-icon" {...props} />,
  RefreshCw: (props) => <div data-testid="refresh-cw-icon" {...props} />,
  ChevronUp: (props) => <div data-testid="chevron-up-icon" {...props} />,
  ChevronDown: (props) => <div data-testid="chevron-down-icon" {...props} />,
  Globe: (props) => <div data-testid="globe-icon" {...props} />,
  Zap: (props) => <div data-testid="zap-icon" {...props} />,
  Target: (props) => <div data-testid="target-icon" {...props} />,
  Award: (props) => <div data-testid="award-icon" {...props} />,
  Layers: (props) => <div data-testid="layers-icon" {...props} />,
  Hash: (props) => <div data-testid="hash-icon" {...props} />,
  AlertCircle: (props) => <div data-testid="alert-circle-icon" {...props} />,
}));

// Mock fetch
global.fetch = jest.fn();

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock document.createElement for export
const mockClickElement = {
  href: '',
  download: '',
  click: jest.fn(),
};
document.createElement = jest.fn((tag) => {
  if (tag === 'a') {
    return mockClickElement;
  }
  return document.createElementNS('http://www.w3.org/1999/xhtml', tag);
});

describe('AnalyticsDashboard', () => {
  let mockOnClose;

  beforeEach(() => {
    mockOnClose = jest.fn();
    localStorage.clear();
    localStorage.setItem('token', 'test-token');
    global.fetch.mockClear();
    mockClickElement.click.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering and UI', () => {
    it('renders the analytics dashboard', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Your Analytics')).toBeInTheDocument();
      });
    });

    it('renders community analytics header', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      const community = { id: 'comm1', name: 'Technology' };
      render(<AnalyticsDashboard user={{ id: '1' }} community={community} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Technology Analytics')).toBeInTheDocument();
      });
    });

    it('renders header subtitle', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Track performance and gain insights')).toBeInTheDocument();
      });
    });

    it('renders close button', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('✕')).toBeInTheDocument();
      });
    });

    it('renders time range selector', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Last 7 Days')).toBeInTheDocument();
      });
    });

    it('renders export button', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Export')).toBeInTheDocument();
      });
    });

    it('renders download icon', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByTestId('download-icon')).toBeInTheDocument();
      });
    });

    it('renders hash icon for community', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      const community = { id: 'comm1', name: 'Technology' };
      render(<AnalyticsDashboard user={{ id: '1' }} community={community} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByTestId('hash-icon')).toBeInTheDocument();
      });
    });

    it('matches snapshot', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      const { container } = render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading analytics data...')).not.toBeInTheDocument();
      });

      expect(container).toMatchSnapshot();
    });
  });

  describe('Tabs Navigation', () => {
    it('renders all tabs', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
        expect(screen.getByText('Engagement')).toBeInTheDocument();
        expect(screen.getByText('Audience')).toBeInTheDocument();
        expect(screen.getByText('Performance')).toBeInTheDocument();
      });
    });

    it('overview tab is active by default', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        const overviewTab = screen.getByText('Overview').closest('button');
        expect(overviewTab).toHaveClass('active');
      });
    });

    it('switches to engagement tab', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Engagement'));

      await waitFor(() => {
        const engagementTab = screen.getByText('Engagement').closest('button');
        expect(engagementTab).toHaveClass('active');
      });
    });

    it('switches to audience tab', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Audience'));

      await waitFor(() => {
        const audienceTab = screen.getByText('Audience').closest('button');
        expect(audienceTab).toHaveClass('active');
      });
    });

    it('switches to performance tab', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Performance'));

      await waitFor(() => {
        const performanceTab = screen.getByText('Performance').closest('button');
        expect(performanceTab).toHaveClass('active');
      });
    });

    it('fetches data when tab changes', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      const initialCallCount = global.fetch.mock.calls.length;

      await user.click(screen.getByText('Engagement'));

      await waitFor(() => {
        expect(global.fetch.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });
  });

  describe('Time Range Selection', () => {
    it('renders all time range options', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Last 24 Hours')).toBeInTheDocument();
        expect(screen.getByText('Last 7 Days')).toBeInTheDocument();
        expect(screen.getByText('Last 30 Days')).toBeInTheDocument();
        expect(screen.getByText('Last 90 Days')).toBeInTheDocument();
        expect(screen.getByText('Last Year')).toBeInTheDocument();
      });
    });

    it('default time range is 7 days', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        const select = screen.getByDisplayValue('Last 7 Days');
        expect(select).toHaveValue('7d');
      });
    });

    it('changes time range to 24 hours', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      const select = screen.getByDisplayValue('Last 7 Days');
      await user.selectOptions(select, '24h');

      expect(select).toHaveValue('24h');
    });

    it('changes time range to 30 days', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      const select = screen.getByDisplayValue('Last 7 Days');
      await user.selectOptions(select, '30d');

      expect(select).toHaveValue('30d');
    });

    it('fetches data when time range changes', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      const initialCallCount = global.fetch.mock.calls.length;

      const select = screen.getByDisplayValue('Last 7 Days');
      await user.selectOptions(select, '30d');

      await waitFor(() => {
        expect(global.fetch.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });

    it('includes time range in API request', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('range=7d'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Loading State', () => {
    it('shows loading state initially', () => {
      global.fetch.mockImplementation(() => new Promise(() => {}));

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      expect(screen.getByText('Loading analytics data...')).toBeInTheDocument();
    });

    it('shows spinner during loading', () => {
      global.fetch.mockImplementation(() => new Promise(() => {}));

      const { container } = render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      expect(container.querySelector('.spinner')).toBeInTheDocument();
    });

    it('hides loading state after data loads', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading analytics data...')).not.toBeInTheDocument();
      });
    });

    it('shows loading when switching tabs', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading analytics data...')).not.toBeInTheDocument();
      });

      global.fetch.mockImplementation(() => new Promise(() => {}));

      await user.click(screen.getByText('Engagement'));

      expect(screen.getByText('Loading analytics data...')).toBeInTheDocument();
    });
  });

  describe('Overview Tab', () => {
    it('renders overview metrics', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          analytics: {
            totalViews: 1500,
            uniqueVisitors: 800,
            avgSessionDuration: '5m',
            bounceRate: 45,
          },
        }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Total Views')).toBeInTheDocument();
        expect(screen.getByText('Unique Visitors')).toBeInTheDocument();
        expect(screen.getByText('Avg. Session')).toBeInTheDocument();
        expect(screen.getByText('Bounce Rate')).toBeInTheDocument();
      });
    });

    it('displays formatted view count', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          analytics: {
            totalViews: 1500,
          },
        }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('1.5K')).toBeInTheDocument();
      });
    });

    it('displays traffic overview section', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Traffic Overview')).toBeInTheDocument();
      });
    });

    it('displays refresh button in chart', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        const refreshIcons = screen.getAllByTestId('refresh-cw-icon');
        expect(refreshIcons.length).toBeGreaterThan(0);
      });
    });

    it('displays top performing content section', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Top Performing Content')).toBeInTheDocument();
      });
    });

    it('displays content when available', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          analytics: {
            topContent: [
              {
                id: '1',
                title: 'Popular Post',
                views: 1000,
                likes: 50,
                comments: 25,
                engagementRate: 15,
              },
            ],
          },
        }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Popular Post')).toBeInTheDocument();
      });
    });

    it('displays empty state when no content', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          analytics: {
            topContent: [],
          },
        }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('No content data available yet')).toBeInTheDocument();
      });
    });

    it('refreshes analytics data', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Traffic Overview')).toBeInTheDocument();
      });

      const initialCallCount = global.fetch.mock.calls.length;

      const refreshButtons = screen.getAllByTestId('refresh-cw-icon');
      await user.click(refreshButtons[0].closest('button'));

      await waitFor(() => {
        expect(global.fetch.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });
  });

  describe('Engagement Tab', () => {
    it('renders engagement metrics', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          analytics: {
            totalLikes: 500,
            totalComments: 200,
            totalShares: 100,
            avgEngagementRate: 12,
          },
        }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Engagement'));

      await waitFor(() => {
        expect(screen.getByText('Total Likes')).toBeInTheDocument();
        expect(screen.getByText('Total Comments')).toBeInTheDocument();
        expect(screen.getByText('Total Shares')).toBeInTheDocument();
        expect(screen.getByText('Engagement Rate')).toBeInTheDocument();
      });
    });

    it('displays peak activity hours', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Engagement'));

      await waitFor(() => {
        expect(screen.getByText('Peak Activity Hours')).toBeInTheDocument();
      });
    });

    it('displays content type performance', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Engagement'));

      await waitFor(() => {
        expect(screen.getByText('Content Type Performance')).toBeInTheDocument();
      });
    });

    it('displays most engaging posts', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Engagement'));

      await waitFor(() => {
        expect(screen.getByText('Most Engaging Posts')).toBeInTheDocument();
      });
    });

    it('displays posts table with data', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          analytics: {
            topPosts: [
              {
                id: '1',
                title: 'Engaging Post',
                type: 'text',
                engagementRate: 20,
                reach: 5000,
                score: 95,
                createdAt: new Date().toISOString(),
              },
            ],
          },
        }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Engagement'));

      await waitFor(() => {
        expect(screen.getByText('Engaging Post')).toBeInTheDocument();
      });
    });

    it('displays empty state for posts table', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          analytics: {
            topPosts: [],
          },
        }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Engagement'));

      await waitFor(() => {
        expect(screen.getByText('No posts data available')).toBeInTheDocument();
      });
    });

    it('displays pie chart icon', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Engagement'));

      await waitFor(() => {
        expect(screen.getByTestId('pie-chart-icon')).toBeInTheDocument();
      });
    });
  });

  describe('Audience Tab', () => {
    it('renders audience metrics', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          analytics: {
            activeUsers: 300,
            newUsers: 50,
            returningUsers: 250,
          },
        }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Audience'));

      await waitFor(() => {
        expect(screen.getByText('Active Users')).toBeInTheDocument();
        expect(screen.getByText('New Users')).toBeInTheDocument();
        expect(screen.getByText('Returning Users')).toBeInTheDocument();
      });
    });

    it('displays geographic distribution', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Audience'));

      await waitFor(() => {
        expect(screen.getByText('Geographic Distribution')).toBeInTheDocument();
      });
    });

    it('displays location data', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          analytics: {
            locations: [
              { country: 'Canada', percentage: 25 },
              { country: 'Germany', percentage: 15 },
            ],
          },
        }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Audience'));

      await waitFor(() => {
        expect(screen.getByText('Canada')).toBeInTheDocument();
        expect(screen.getByText('Germany')).toBeInTheDocument();
      });
    });

    it('displays default locations when no data', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          analytics: {
            locations: [],
          },
        }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Audience'));

      await waitFor(() => {
        expect(screen.getByText('United States')).toBeInTheDocument();
        expect(screen.getByText('United Kingdom')).toBeInTheDocument();
      });
    });

    it('displays device breakdown', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Audience'));

      await waitFor(() => {
        expect(screen.getByText('Device Breakdown')).toBeInTheDocument();
        expect(screen.getByText('Desktop')).toBeInTheDocument();
        expect(screen.getByText('Mobile')).toBeInTheDocument();
        expect(screen.getByText('Tablet')).toBeInTheDocument();
      });
    });

    it('displays user interests', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Audience'));

      await waitFor(() => {
        expect(screen.getByText('User Interests')).toBeInTheDocument();
        expect(screen.getByText('Technology')).toBeInTheDocument();
        expect(screen.getByText('Gaming')).toBeInTheDocument();
        expect(screen.getByText('Crypto')).toBeInTheDocument();
      });
    });

    it('displays globe icon', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Audience'));

      await waitFor(() => {
        expect(screen.getByTestId('globe-icon')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Tab', () => {
    it('renders performance metrics', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          analytics: {
            loadTime: 250,
            errorRate: 0.5,
            uptime: 99.9,
            apiLatency: 120,
          },
        }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Performance'));

      await waitFor(() => {
        expect(screen.getByText('Load Time')).toBeInTheDocument();
        expect(screen.getByText('Error Rate')).toBeInTheDocument();
        expect(screen.getByText('Uptime')).toBeInTheDocument();
        expect(screen.getByText('API Latency')).toBeInTheDocument();
      });
    });

    it('displays system health section', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Performance'));

      await waitFor(() => {
        expect(screen.getByText('System Health')).toBeInTheDocument();
      });
    });

    it('displays health metrics', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Performance'));

      await waitFor(() => {
        expect(screen.getByText('CPU Usage')).toBeInTheDocument();
        expect(screen.getByText('Memory')).toBeInTheDocument();
        expect(screen.getByText('Disk I/O')).toBeInTheDocument();
        expect(screen.getByText('Network')).toBeInTheDocument();
      });
    });

    it('displays response times section', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Performance'));

      await waitFor(() => {
        expect(screen.getByText('Response Times')).toBeInTheDocument();
      });
    });

    it('displays service response times', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Performance'));

      await waitFor(() => {
        expect(screen.getByText('API')).toBeInTheDocument();
        expect(screen.getByText('Database')).toBeInTheDocument();
        expect(screen.getByText('Cache')).toBeInTheDocument();
        expect(screen.getByText('CDN')).toBeInTheDocument();
        expect(screen.getByText('External')).toBeInTheDocument();
      });
    });

    it('displays recent alerts', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Performance'));

      await waitFor(() => {
        expect(screen.getByText('Recent Alerts')).toBeInTheDocument();
      });
    });

    it('displays alert messages', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Performance'));

      await waitFor(() => {
        expect(screen.getByText('High memory usage detected on server-2')).toBeInTheDocument();
        expect(screen.getByText('CDN cache purge completed successfully')).toBeInTheDocument();
      });
    });
  });

  describe('Data Fetching', () => {
    it('fetches user analytics by default', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/user/analytics'),
          expect.any(Object)
        );
      });
    });

    it('fetches community analytics when community provided', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      const community = { id: 'comm1', name: 'Technology' };
      render(<AnalyticsDashboard user={{ id: '1' }} community={community} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/communities/comm1/analytics'),
          expect.any(Object)
        );
      });
    });

    it('includes authorization header', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer test-token',
            }),
          })
        );
      });
    });

    it('includes tab parameter in request', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('tab=overview'),
          expect.any(Object)
        );
      });
    });

    it('handles fetch failure gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading analytics data...')).not.toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });

    it('handles non-ok response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading analytics data...')).not.toBeInTheDocument();
      });
    });

    it('refetches when time range changes', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      global.fetch.mockClear();

      const select = screen.getByDisplayValue('Last 7 Days');
      await user.selectOptions(select, '30d');

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('range=30d'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Export Functionality', () => {
    it('exports analytics as CSV', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Export')).toBeInTheDocument();
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['data'], { type: 'text/csv' }),
      });

      await user.click(screen.getByText('Export'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('export'),
          expect.any(Object)
        );
      });
    });

    it('creates download link for export', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Export')).toBeInTheDocument();
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['data'], { type: 'text/csv' }),
      });

      await user.click(screen.getByText('Export'));

      await waitFor(() => {
        expect(mockClickElement.click).toHaveBeenCalled();
      });
    });

    it('includes time range in export filename', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Export')).toBeInTheDocument();
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['data'], { type: 'text/csv' }),
      });

      await user.click(screen.getByText('Export'));

      await waitFor(() => {
        expect(mockClickElement.download).toContain('analytics-7d');
      });
    });

    it('handles export failure gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const user = userEvent.setup();
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Export')).toBeInTheDocument();
      });

      global.fetch.mockRejectedValueOnce(new Error('Export failed'));

      await user.click(screen.getByText('Export'));

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Number Formatting', () => {
    it('formats numbers over 1 million', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          analytics: {
            totalViews: 1500000,
          },
        }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('1.5M')).toBeInTheDocument();
      });
    });

    it('formats numbers over 1 thousand', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          analytics: {
            totalViews: 5000,
          },
        }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('5.0K')).toBeInTheDocument();
      });
    });

    it('formats numbers under 1 thousand', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          analytics: {
            totalViews: 500,
          },
        }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('500')).toBeInTheDocument();
      });
    });
  });

  describe('Close Functionality', () => {
    it('calls onClose when close button clicked', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('✕')).toBeInTheDocument();
      });

      await user.click(screen.getByText('✕'));

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing analytics data', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading analytics data...')).not.toBeInTheDocument();
      });
    });

    it('handles null analytics values', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          analytics: {
            totalViews: null,
            uniqueVisitors: null,
          },
        }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading analytics data...')).not.toBeInTheDocument();
      });
    });

    it('handles very large numbers', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          analytics: {
            totalViews: 999999999,
          },
        }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('1000.0M')).toBeInTheDocument();
      });
    });

    it('handles zero values', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          analytics: {
            totalViews: 0,
            uniqueVisitors: 0,
          },
        }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getAllByText('0').length).toBeGreaterThan(0);
      });
    });

    it('handles rapid tab switching', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Engagement'));
      await user.click(screen.getByText('Audience'));
      await user.click(screen.getByText('Performance'));
      await user.click(screen.getByText('Overview'));

      await waitFor(() => {
        const overviewTab = screen.getByText('Overview').closest('button');
        expect(overviewTab).toHaveClass('active');
      });
    });

    it('handles missing user prop', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Your Analytics')).toBeInTheDocument();
      });
    });

    it('handles missing onClose prop', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      render(<AnalyticsDashboard user={{ id: '1' }} />);

      await waitFor(() => {
        expect(screen.getByText('Your Analytics')).toBeInTheDocument();
      });
    });

    it('handles invalid JSON response', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading analytics data...')).not.toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });

    it('maintains state when community changes', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      const community1 = { id: 'comm1', name: 'Technology' };
      const { rerender } = render(
        <AnalyticsDashboard user={{ id: '1' }} community={community1} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(screen.getByText('Technology Analytics')).toBeInTheDocument();
      });

      const community2 = { id: 'comm2', name: 'Gaming' };
      rerender(<AnalyticsDashboard user={{ id: '1' }} community={community2} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Gaming Analytics')).toBeInTheDocument();
      });
    });
  });

  describe('Snapshot Tests', () => {
    it('matches snapshot for overview tab', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          analytics: {
            totalViews: 1500,
            uniqueVisitors: 800,
            topContent: [],
          },
        }),
      });

      const { container } = render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading analytics data...')).not.toBeInTheDocument();
      });

      expect(container).toMatchSnapshot('overview');
    });

    it('matches snapshot for engagement tab', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          analytics: {
            totalLikes: 500,
            totalComments: 200,
            topPosts: [],
          },
        }),
      });

      const { container } = render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Engagement'));

      await waitFor(() => {
        expect(screen.queryByText('Loading analytics data...')).not.toBeInTheDocument();
      });

      expect(container).toMatchSnapshot('engagement');
    });

    it('matches snapshot for audience tab', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          analytics: {
            activeUsers: 300,
            locations: [],
          },
        }),
      });

      const { container } = render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Audience'));

      await waitFor(() => {
        expect(screen.queryByText('Loading analytics data...')).not.toBeInTheDocument();
      });

      expect(container).toMatchSnapshot('audience');
    });

    it('matches snapshot for performance tab', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          analytics: {
            loadTime: 250,
            errorRate: 0.5,
          },
        }),
      });

      const { container } = render(<AnalyticsDashboard user={{ id: '1' }} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Performance'));

      await waitFor(() => {
        expect(screen.queryByText('Loading analytics data...')).not.toBeInTheDocument();
      });

      expect(container).toMatchSnapshot('performance');
    });

    it('matches snapshot with community', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ analytics: {} }),
      });

      const community = { id: 'comm1', name: 'Technology' };
      const { container } = render(
        <AnalyticsDashboard user={{ id: '1' }} community={community} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading analytics data...')).not.toBeInTheDocument();
      });

      expect(container).toMatchSnapshot('with-community');
    });
  });
});

export default mockClickElement
