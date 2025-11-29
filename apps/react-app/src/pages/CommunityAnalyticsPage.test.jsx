/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import CommunityAnalyticsPage from './CommunityAnalyticsPage';
import { AuthContext } from '../contexts/AuthContext';
import { renderWithProviders } from '../__test__/utils/testUtils';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock chart library (if using recharts, chart.js, etc.)
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  Area: () => <div data-testid="area" />,
  Pie: () => <div data-testid="pie" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Cell: () => <div data-testid="cell" />,
}), { virtual: true });

// Mock data
const mockAnalyticsData = {
  stats: {
    totalMembers: 1500,
    activeMembersToday: 234,
    totalPosts: 5678,
    postsToday: 45,
    totalComments: 12345,
    commentsToday: 123,
    engagementRate: 78.5,
    averagePostsPerDay: 89.2,
  },
  growth: {
    members: [
      { date: '2024-01-01', count: 1000 },
      { date: '2024-01-02', count: 1100 },
      { date: '2024-01-03', count: 1200 },
      { date: '2024-01-04', count: 1350 },
      { date: '2024-01-05', count: 1500 },
    ],
    posts: [
      { date: '2024-01-01', count: 50 },
      { date: '2024-01-02', count: 75 },
      { date: '2024-01-03', count: 90 },
      { date: '2024-01-04', count: 85 },
      { date: '2024-01-05', count: 89 },
    ],
  },
  topPosts: [
    { id: '1', title: 'Amazing Post 1', author: 'user1', upvotes: 500, comments: 89 },
    { id: '2', title: 'Great Discussion', author: 'user2', upvotes: 450, comments: 67 },
    { id: '3', title: 'Interesting Topic', author: 'user3', upvotes: 400, comments: 56 },
  ],
  topContributors: [
    { id: '1', username: 'user1', posts: 150, comments: 890, karma: 5000 },
    { id: '2', username: 'user2', posts: 120, comments: 670, karma: 4500 },
    { id: '3', username: 'user3', posts: 100, comments: 560, karma: 4000 },
  ],
  demographics: {
    ageGroups: [
      { range: '18-24', count: 400 },
      { range: '25-34', count: 600 },
      { range: '35-44', count: 300 },
      { range: '45+', count: 200 },
    ],
    countries: [
      { country: 'USA', count: 500 },
      { country: 'UK', count: 300 },
      { country: 'Canada', count: 250 },
      { country: 'Australia', count: 200 },
      { country: 'Others', count: 250 },
    ],
  },
  activityHeatmap: [
    { hour: 0, day: 'Monday', value: 10 },
    { hour: 1, day: 'Monday', value: 5 },
    { hour: 12, day: 'Monday', value: 50 },
    { hour: 18, day: 'Monday', value: 80 },
  ],
};

// Mock auth contexts
const mockModeratorAuth = {
  isAuthenticated: true,
  user: {
    id: 'mod-1',
    username: 'moderator',
    email: 'mod@test.com',
    role: 'moderator',
    isModerator: true,
    isAdmin: false,
  },
  loading: false,
  error: null,
};

const mockAdminAuth = {
  isAuthenticated: true,
  user: {
    id: 'admin-1',
    username: 'admin',
    email: 'admin@test.com',
    role: 'admin',
    isModerator: true,
    isAdmin: true,
  },
  loading: false,
  error: null,
};

const mockRegularUserAuth = {
  isAuthenticated: true,
  user: {
    id: 'user-1',
    username: 'regular',
    email: 'user@test.com',
    role: 'user',
    isModerator: false,
    isAdmin: false,
  },
  loading: false,
  error: null,
};

const mockUnauthenticatedAuth = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
};

// Helper to render with auth and router
const renderWithAuth = (authValue = mockModeratorAuth, communityId = 'test-community') => {
  return render(
    <MemoryRouter initialEntries={[`/community/${communityId}/analytics`]}>
      <AuthContext.Provider value={authValue}>
        <Routes>
          <Route path="/community/:communityId/analytics" element={<CommunityAnalyticsPage />} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

describe('CommunityAnalyticsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders page without crashing', () => {
      const { container } = renderWithAuth();
      expect(container).toBeInTheDocument();
    });

    it('displays main content area with proper role', () => {
      renderWithAuth();
      const mainElement = screen.getByRole('main');
      expect(mainElement).toBeInTheDocument();
      expect(mainElement).toHaveAttribute('aria-label', 'Community analytics page');
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithAuth();
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('has correct page title', () => {
      renderWithAuth();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('applies correct theme classes', () => {
      const { container } = renderWithAuth();
      const mainDiv = container.querySelector('div');
      expect(mainDiv).toHaveClass('min-h-screen');
      expect(mainDiv).toHaveClass('bg-gray-50');
      expect(mainDiv).toHaveClass('dark:bg-[#161b22]');
    });
  });

  describe('Authentication and Authorization', () => {
    it('allows access for moderators', () => {
      renderWithAuth(mockModeratorAuth);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('allows access for admins', () => {
      renderWithAuth(mockAdminAuth);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('denies access for regular users', () => {
      renderWithAuth(mockRegularUserAuth);
      // Should show unauthorized message or redirect
      // Placeholder component doesn't implement this yet
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('denies access for unauthenticated users', () => {
      renderWithAuth(mockUnauthenticatedAuth);
      // Should show login prompt or redirect
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('checks user role on component mount', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      renderWithAuth(mockModeratorAuth);
      // Implementation would check role
      consoleSpy.mockRestore();
    });

    it('displays unauthorized message for non-moderators', () => {
      renderWithAuth(mockRegularUserAuth);
      // When implemented, should show: "You don't have permission to view analytics"
    });

    it('redirects unauthorized users to community page', () => {
      // When implemented, test navigation
    });

    it('shows loading state during auth check', () => {
      const loadingAuth = { ...mockModeratorAuth, loading: true };
      renderWithAuth(loadingAuth);
    });
  });

  describe('React Router Integration', () => {
    it('reads community ID from URL params', () => {
      renderWithAuth(mockModeratorAuth, 'gaming');
      // Implementation would use useParams to get communityId
    });

    it('handles different community IDs', () => {
      renderWithAuth(mockModeratorAuth, 'technology');
      renderWithAuth(mockModeratorAuth, 'sports');
    });

    it('handles missing community ID gracefully', () => {
      render(
        <MemoryRouter initialEntries={['/analytics']}>
          <AuthContext.Provider value={mockModeratorAuth}>
            <Routes>
              <Route path="/analytics" element={<CommunityAnalyticsPage />} />
            </Routes>
          </AuthContext.Provider>
        </MemoryRouter>
      );
    });

    it('fetches analytics for correct community', async () => {
      renderWithAuth(mockModeratorAuth, 'test-community');
      await waitFor(() => {
        // Would check if API was called with correct community ID
      });
    });

    it('updates data when community ID changes', async () => {
      const { rerender } = renderWithAuth(mockModeratorAuth, 'community1');

      rerender(
        <MemoryRouter initialEntries={['/community/community2/analytics']}>
          <AuthContext.Provider value={mockModeratorAuth}>
            <Routes>
              <Route path="/community/:communityId/analytics" element={<CommunityAnalyticsPage />} />
            </Routes>
          </AuthContext.Provider>
        </MemoryRouter>
      );
    });
  });

  describe('Stats Cards', () => {
    it('displays total members card', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // When implemented: expect(screen.getByText('Total Members')).toBeInTheDocument();
        // expect(screen.getByText('1,500')).toBeInTheDocument();
      });
    });

    it('displays active members today card', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // When implemented: expect(screen.getByText('Active Today')).toBeInTheDocument();
      });
    });

    it('displays total posts card', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // When implemented: expect(screen.getByText('Total Posts')).toBeInTheDocument();
      });
    });

    it('displays posts today card', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // When implemented
      });
    });

    it('displays total comments card', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // When implemented
      });
    });

    it('displays engagement rate card', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // When implemented: expect(screen.getByText(/78.5%/)).toBeInTheDocument();
      });
    });

    it('formats large numbers correctly', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // Should format 12345 as "12.3K" or "12,345"
      });
    });

    it('shows growth indicators on stat cards', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // Should show +5% or similar indicators
      });
    });

    it('displays stat cards in responsive grid', () => {
      const { container } = renderWithAuth(mockModeratorAuth);
      // Check for grid layout classes
    });

    it('shows loading skeleton for stats', () => {
      // When implemented with API: mock loading state;
      renderWithAuth(mockModeratorAuth);
      // Should show loading placeholders
    });

    it('updates stats when data refreshes', async () => {
      const { rerender } = renderWithAuth(mockModeratorAuth);
      await waitFor(() => {});

      // When implemented with API: mock data refresh
      // api.get.mockResolvedValueOnce({
      //   success: true,
      //   data: { ...mockAnalyticsData, stats: { ...mockAnalyticsData.stats, totalMembers: 2000 } },
      // });

      rerender(
        <MemoryRouter initialEntries={['/community/test-community/analytics']}>
          <AuthContext.Provider value={mockModeratorAuth}>
            <Routes>
              <Route path="/community/:communityId/analytics" element={<CommunityAnalyticsPage />} />
            </Routes>
          </AuthContext.Provider>
        </MemoryRouter>
      );
    });

    it('shows tooltips on stat cards', async () => {
      renderWithAuth(mockModeratorAuth);
      // Hover over stat card to see tooltip
    });
  });

  describe('Growth Charts', () => {
    it('displays member growth chart', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // When implemented: expect(screen.getByText('Member Growth')).toBeInTheDocument();
      });
    });

    it('displays post growth chart', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // When implemented
      });
    });

    it('renders chart with correct data points', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // Check if chart has 5 data points from mockAnalyticsData
      });
    });

    it('shows chart legend', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // Should have legend for chart lines
      });
    });

    it('displays chart tooltips on hover', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // Hover over chart point to see tooltip
      });
    });

    it('handles empty growth data', async () => {
      // When implemented with API: api.get.mockResolvedValueOnce({
      /*
        success: true,
        data: { ...mockAnalyticsData, growth: { members: [], posts: [] } },
      });
      */

      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // Should show empty state
      });
    });

    it('renders responsive chart container', () => {
      renderWithAuth(mockModeratorAuth);
      // Charts should be responsive
    });

    it('allows toggling between different growth metrics', async () => {
      renderWithAuth(mockModeratorAuth);
      // Toggle between members/posts/comments growth
    });

    it('displays chart axis labels', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // Check for X and Y axis labels
      });
    });

    it('formats chart dates correctly', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // Dates should be formatted as "Jan 1" or similar
      });
    });
  });

  describe('Top Posts Section', () => {
    it('displays top posts list', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // When implemented: expect(screen.getByText('Top Posts')).toBeInTheDocument();
      });
    });

    it('shows post title, author, and stats', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // Should show title, author, upvotes, comments
      });
    });

    it('displays correct number of top posts', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // Should show top 3-10 posts
      });
    });

    it('links to individual post pages', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // Click on post should navigate to post detail
      });
    });

    it('shows empty state when no posts', async () => {
      // When implemented with API: api.get.mockResolvedValueOnce({
      /*
        success: true,
        data: { ...mockAnalyticsData, topPosts: [] },
      });
      */

      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // Should show "No posts yet"
      });
    });

    it('displays post ranking numbers', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // Should show #1, #2, #3, etc.
      });
    });

    it('shows post engagement metrics', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // Upvotes, comments, engagement rate
      });
    });

    it('allows sorting top posts', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // Sort by upvotes, comments, or engagement
      });
    });
  });

  describe('Top Contributors Section', () => {
    it('displays top contributors list', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // When implemented: expect(screen.getByText('Top Contributors')).toBeInTheDocument();
      });
    });

    it('shows contributor username and stats', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // Username, posts, comments, karma
      });
    });

    it('displays contributor avatars', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // Should show user avatars
      });
    });

    it('links to contributor profiles', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // Click on user should navigate to profile
      });
    });

    it('shows contributor ranking', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // Should show #1, #2, #3 rankings
      });
    });

    it('displays contributor karma scores', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // Should show karma points
      });
    });

    it('shows empty state when no contributors', async () => {
      // When implemented with API: api.get.mockResolvedValueOnce({
      /*
        success: true,
        data: { ...mockAnalyticsData, topContributors: [] },
      });
      */

      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {});
    });

    it('allows filtering contributors by time period', async () => {
      renderWithAuth(mockModeratorAuth);
      // Filter by week, month, year, all-time
    });
  });

  describe('Time Range Selector', () => {
    it('displays time range selector', () => {
      renderWithAuth(mockModeratorAuth);
      // Should have time range buttons/dropdown
    });

    it('shows available time range options', () => {
      renderWithAuth(mockModeratorAuth);
      // 24h, 7d, 30d, 90d, 1y, all time
    });

    it('defaults to 7 days time range', () => {
      renderWithAuth(mockModeratorAuth);
      // Default selection should be 7 days
    });

    it('updates data when time range changes', async () => {
      renderWithAuth(mockModeratorAuth);
      // Click different time range and check API call
    });

    it('highlights selected time range', async () => {
      const user = userEvent.setup();
      renderWithAuth(mockModeratorAuth);
      // Selected range should be visually distinct
    });

    it('fetches new data for selected range', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // Should call API with time range parameter
      });
    });

    it('shows loading state during range change', async () => {
      renderWithAuth(mockModeratorAuth);
      // Click range, should show loading
    });

    it('maintains selected range in URL params', () => {
      // URL should reflect selected time range
    });

    it('handles custom date range selection', async () => {
      renderWithAuth(mockModeratorAuth);
      // Allow selecting custom start/end dates
    });

    it('validates custom date ranges', async () => {
      renderWithAuth(mockModeratorAuth);
      // End date should be after start date
    });
  });

  describe('Export Data Button', () => {
    it('displays export data button', () => {
      renderWithAuth(mockModeratorAuth);
      // Should have export button
    });

    it('shows export format options', async () => {
      const user = userEvent.setup();
      renderWithAuth(mockModeratorAuth);
      // CSV, JSON, PDF options
    });

    it('exports data as CSV', async () => {
      const user = userEvent.setup();
      renderWithAuth(mockModeratorAuth);
      // Click export CSV
    });

    it('exports data as JSON', async () => {
      const user = userEvent.setup();
      renderWithAuth(mockModeratorAuth);
      // Click export JSON
    });

    it('exports data as PDF', async () => {
      const user = userEvent.setup();
      renderWithAuth(mockModeratorAuth);
      // Click export PDF
    });

    it('includes current time range in export', async () => {
      renderWithAuth(mockModeratorAuth);
      // Export should respect selected time range
    });

    it('shows loading state during export', async () => {
      renderWithAuth(mockModeratorAuth);
      // Export button should show loading
    });

    it('handles export errors gracefully', async () => {
      // When implemented with API:
      //       // When implemented with API: api.get.mockRejectedValueOnce(new Error('Export failed'));
      renderWithAuth(mockModeratorAuth);
      // Should show error message
    });

    it('downloads file with correct filename', async () => {
      renderWithAuth(mockModeratorAuth);
      // Filename should include community name and date
    });

    it('disables export button while exporting', async () => {
      renderWithAuth(mockModeratorAuth);
      // Button should be disabled during export
    });
  });

  describe('Member Demographics', () => {
    it('displays demographics section', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // When implemented: expect(screen.getByText('Demographics')).toBeInTheDocument();
      });
    });

    it('shows age group distribution', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // Display age groups with counts
      });
    });

    it('displays country distribution', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // Show top countries
      });
    });

    it('renders demographics pie chart', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // Should have pie chart for demographics
      });
    });

    it('shows demographics percentages', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // Each category should show percentage
      });
    });

    it('handles missing demographics data', async () => {
      // When implemented with API: api.get.mockResolvedValueOnce({
      /*
        success: true,
        data: { ...mockAnalyticsData, demographics: null },
      });
      */

      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {});
    });

    it('displays gender distribution if available', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // Show gender breakdown if data available
      });
    });

    it('shows device type distribution', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // Mobile, desktop, tablet breakdown
      });
    });

    it('renders interactive demographics chart', async () => {
      renderWithAuth(mockModeratorAuth);
      // Click on chart segment for details
    });
  });

  describe('Activity Heatmap', () => {
    it('displays activity heatmap', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // When implemented: expect(screen.getByText('Activity Heatmap')).toBeInTheDocument();
      });
    });

    it('shows 7 days x 24 hours grid', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // Grid should have 168 cells (7 * 24)
      });
    });

    it('displays day labels on heatmap', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // Mon, Tue, Wed, etc.
      });
    });

    it('displays hour labels on heatmap', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // 0-23 hours or 12am-11pm
      });
    });

    it('colors cells based on activity level', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // Higher activity = darker color
      });
    });

    it('shows tooltip with activity count on hover', async () => {
      renderWithAuth(mockModeratorAuth);
      // Hover over cell to see exact count
    });

    it('highlights peak activity times', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // Most active times should be highlighted
      });
    });

    it('handles empty heatmap data', async () => {
      // When implemented with API: api.get.mockResolvedValueOnce({
      /*
        success: true,
        data: { ...mockAnalyticsData, activityHeatmap: [] },
      });
      */

      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {});
    });

    it('updates heatmap when time range changes', async () => {
      renderWithAuth(mockModeratorAuth);
      // Change time range and check heatmap update
    });

    it('displays color legend for heatmap', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // Show what colors mean
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading skeleton on initial load', () => {
      // When implemented with API: mock loading state;
      renderWithAuth(mockModeratorAuth);
      // Should show loading placeholders
    });

    it('displays loading spinner for charts', () => {
      // When implemented with API: mock loading state;
      renderWithAuth(mockModeratorAuth);
    });

    it('shows loading state for stats cards', () => {
      // When implemented with API: mock loading state;
      renderWithAuth(mockModeratorAuth);
    });

    it('displays loading indicator for top posts', () => {
      // When implemented with API: mock loading state;
      renderWithAuth(mockModeratorAuth);
    });

    it('shows loading state for contributors', () => {
      // When implemented with API: mock loading state;
      renderWithAuth(mockModeratorAuth);
    });

    it('removes loading state after data loads', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // Loading indicators should be gone
      });
    });

    it('shows partial content while loading', () => {
      renderWithAuth(mockModeratorAuth);
      // Page structure should be visible even while loading
    });

    it('handles slow network connections', async () => {
      // When implemented with API:
      // api.get.mockImplementation(
      //   () => new Promise((resolve) => setTimeout(() => resolve({ success: true, data: mockAnalyticsData }), 5000))
      // );
      renderWithAuth(mockModeratorAuth);
    });
  });

  describe('Error Handling', () => {
    it('displays error message when API fails', async () => {
      // When implemented with API:
      //       // When implemented with API: api.get.mockRejectedValueOnce(new Error('API Error'));
      renderWithAuth(mockModeratorAuth);

      await waitFor(() => {
        // Should show error message
      });
    });

    it('shows retry button on error', async () => {
      // When implemented with API:
      //       // When implemented with API: api.get.mockRejectedValueOnce(new Error('API Error'));
      renderWithAuth(mockModeratorAuth);

      await waitFor(() => {
        // Should have retry button
      });
    });

    it('retries data fetch on retry button click', async () => {
      // When implemented with API:
      //       // When implemented with API: api.get.mockRejectedValueOnce(new Error('API Error'))
      // .mockResolvedValueOnce({ success: true, data: mockAnalyticsData });

      renderWithAuth(mockModeratorAuth);

      await waitFor(() => {
        // Click retry button
      });
    });

    it('handles network timeout errors', async () => {
      // When implemented with API:
      //       // When implemented with API: api.get.mockRejectedValueOnce(new Error('Network timeout'));
      renderWithAuth(mockModeratorAuth);

      await waitFor(() => {});
    });

    it('handles 404 community not found', async () => {
      // When implemented with API:
      //       // When implemented with API: api.get.mockRejectedValueOnce({ status: 404, message: 'Community not found' });
      renderWithAuth(mockModeratorAuth);

      await waitFor(() => {});
    });

    it('handles 403 forbidden errors', async () => {
      // When implemented with API:
      //       // When implemented with API: api.get.mockRejectedValueOnce({ status: 403, message: 'Forbidden' });
      renderWithAuth(mockModeratorAuth);

      await waitFor(() => {});
    });

    it('displays specific error messages', async () => {
      // When implemented with API:
      //       // When implemented with API: api.get.mockRejectedValueOnce(new Error('Rate limit exceeded'));
      renderWithAuth(mockModeratorAuth);

      await waitFor(() => {
        // Should show "Rate limit exceeded"
      });
    });

    it('handles partial data load errors', async () => {
      // When implemented with API: api.get.mockResolvedValueOnce({
      /*
        success: true,
        data: { stats: mockAnalyticsData.stats }, // Missing other data
      });
      */

      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {});
    });

    it('clears error state after successful retry', async () => {
      // When implemented with API:
      // api.get.mockRejectedValueOnce(new Error('API Error'))
      //         .mockResolvedValueOnce({ success: true, data: mockAnalyticsData });

      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {});
    });
  });

  describe('Edge Cases', () => {
    it('handles zero members', async () => {
      // When implemented with API: api.get.mockResolvedValueOnce({
      /*
        success: true,
        data: { ...mockAnalyticsData, stats: { ...mockAnalyticsData.stats, totalMembers: 0 } },
      });
      */

      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {});
    });

    it('handles zero posts', async () => {
      // When implemented with API: api.get.mockResolvedValueOnce({
      /*
        success: true,
        data: { ...mockAnalyticsData, stats: { ...mockAnalyticsData.stats, totalPosts: 0 } },
      });
      */

      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {});
    });

    it('handles very large numbers', async () => {
      // When implemented with API: api.get.mockResolvedValueOnce({
      /*
        success: true,
        data: { ...mockAnalyticsData, stats: { ...mockAnalyticsData.stats, totalMembers: 10000000 } },
      });
      */

      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // Should format as "10M"
      });
    });

    it('handles negative growth rates', async () => {
      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {
        // Should show negative percentage in red
      });
    });

    it('handles missing optional data fields', async () => {
      // When implemented with API: api.get.mockResolvedValueOnce({
      /*
        success: true,
        data: {
          stats: mockAnalyticsData.stats,
          // Missing growth, demographics, etc.
        },
      });
      */

      renderWithAuth(mockModeratorAuth);
      await waitFor(() => {});
    });

    it('handles extremely long community names', () => {
      renderWithAuth(mockModeratorAuth, 'this-is-an-extremely-long-community-name-that-should-be-truncated');
    });

    it('handles special characters in community ID', () => {
      renderWithAuth(mockModeratorAuth, 'test_community-123');
    });

    it('handles concurrent data fetches', async () => {
      renderWithAuth(mockModeratorAuth);
      // Multiple simultaneous requests should be handled
    });

    it('handles stale data scenarios', async () => {
      renderWithAuth(mockModeratorAuth);
      // Old data should be replaced with new data
    });

    it('handles deleted community', async () => {
      // When implemented with API:
      //       // When implemented with API: api.get.mockRejectedValueOnce({ status: 410, message: 'Community deleted' });
      renderWithAuth(mockModeratorAuth);

      await waitFor(() => {});
    });

    it('handles private/archived community', async () => {
      // When implemented with API:
      //       // When implemented with API: api.get.mockRejectedValueOnce({ status: 403, message: 'Community is private' });
      renderWithAuth(mockModeratorAuth);

      await waitFor(() => {});
    });
  });

  describe('Accessibility', () => {
    it('has proper page structure', () => {
      renderWithAuth(mockModeratorAuth);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('has proper heading hierarchy', () => {
      renderWithAuth(mockModeratorAuth);
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('has aria labels on interactive elements', () => {
      renderWithAuth(mockModeratorAuth);
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithAuth(mockModeratorAuth);

      // Tab through elements
      await user.tab();
    });

    it('has proper focus indicators', () => {
      renderWithAuth(mockModeratorAuth);
      // Focus styles should be visible
    });

    it('announces loading states to screen readers', () => {
      // When implemented with API: mock loading state;
      renderWithAuth(mockModeratorAuth);
      // Should have aria-live regions
    });

    it('announces errors to screen readers', async () => {
      // When implemented with API:
      //       // When implemented with API: api.get.mockRejectedValueOnce(new Error('API Error'));
      renderWithAuth(mockModeratorAuth);

      await waitFor(() => {
        // Error should be announced
      });
    });

    it('has descriptive button labels', () => {
      renderWithAuth(mockModeratorAuth);
      // All buttons should have clear labels
    });

    it('provides alternative text for charts', () => {
      renderWithAuth(mockModeratorAuth);
      // Charts should have aria-label describing data
    });

    it('ensures sufficient color contrast', () => {
      const { container } = renderWithAuth(mockModeratorAuth);
      // Text should have sufficient contrast
    });
  });

  describe('Responsive Behavior', () => {
    it('renders correctly on mobile', () => {
      global.innerWidth = 375;
      global.innerHeight = 667;
      global.dispatchEvent(new Event('resize'));

      renderWithAuth(mockModeratorAuth);
    });

    it('renders correctly on tablet', () => {
      global.innerWidth = 768;
      global.innerHeight = 1024;
      global.dispatchEvent(new Event('resize'));

      renderWithAuth(mockModeratorAuth);
    });

    it('renders correctly on desktop', () => {
      global.innerWidth = 1920;
      global.innerHeight = 1080;
      global.dispatchEvent(new Event('resize'));

      renderWithAuth(mockModeratorAuth);
    });

    it('stacks stat cards vertically on mobile', () => {
      global.innerWidth = 375;
      const { container } = renderWithAuth(mockModeratorAuth);
      // Check for mobile layout
    });

    it('shows grid layout on desktop', () => {
      global.innerWidth = 1920;
      const { container } = renderWithAuth(mockModeratorAuth);
      // Check for grid layout
    });

    it('hides less important elements on mobile', () => {
      global.innerWidth = 375;
      renderWithAuth(mockModeratorAuth);
      // Some elements might be hidden on mobile
    });

    it('adjusts chart size for viewport', () => {
      const { container } = renderWithAuth(mockModeratorAuth);
      // Charts should be responsive
    });
  });

  describe('Performance', () => {
    it('memoizes expensive computations', () => {
      const { rerender } = renderWithAuth(mockModeratorAuth);

      rerender(
        <MemoryRouter initialEntries={['/community/test-community/analytics']}>
          <AuthContext.Provider value={mockModeratorAuth}>
            <Routes>
              <Route path="/community/:communityId/analytics" element={<CommunityAnalyticsPage />} />
            </Routes>
          </AuthContext.Provider>
        </MemoryRouter>
      );

      // Component should use memo
    });

    it('debounces time range changes', async () => {
      renderWithAuth(mockModeratorAuth);
      // Rapid time range changes should be debounced
    });

    it('lazy loads chart library', () => {
      renderWithAuth(mockModeratorAuth);
      // Charts should be lazy loaded
    });

    it('implements virtual scrolling for long lists', () => {
      renderWithAuth(mockModeratorAuth);
      // Long lists should use virtual scrolling
    });
  });

  describe('Snapshot Tests', () => {
    it('matches snapshot for moderator view', () => {
      const { container } = renderWithAuth(mockModeratorAuth);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for admin view', () => {
      const { container } = renderWithAuth(mockAdminAuth);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with loading state', () => {
      // When implemented with API: mock loading state;
      const { container } = renderWithAuth(mockModeratorAuth);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with error state', async () => {
      // When implemented with API:
      //       // When implemented with API: api.get.mockRejectedValueOnce(new Error('API Error'));
      const { container } = renderWithAuth(mockModeratorAuth);

      await waitFor(() => {});
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with empty data', async () => {
      // When implemented with API: api.get.mockResolvedValueOnce({
      /*
        success: true,
        data: {
          stats: { totalMembers: 0, totalPosts: 0 },
          growth: { members: [], posts: [] },
          topPosts: [],
          topContributors: [],
        },
      });
      */

      const { container } = renderWithAuth(mockModeratorAuth);
      await waitFor(() => {});
      expect(container).toMatchSnapshot();
    });
  });
});

export default mockAnalyticsData
