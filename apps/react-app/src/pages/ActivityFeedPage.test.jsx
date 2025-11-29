/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ActivityFeedPage from './ActivityFeedPage';
import { AuthContext } from '../contexts/AuthContext';
import { mockAuthContext, mockUnauthContext, mockUser } from '../../tests/utils/testUtils';
import apiService from '../services/api';

// Mock API service
jest.mock('../services/api', () => ({
  default: {
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Helper function to render with router and auth context
const renderWithRouter = (component, authValue = mockAuthContext) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>{component}</AuthContext.Provider>
    </BrowserRouter>
  );
};

// Mock activity data
const mockActivities = [
  {
    id: '1',
    type: 'post_created',
    username: 'john_doe',
    displayName: 'John Doe',
    avatar: 'JD',
    timestamp: new Date().toISOString(),
    content: {
      title: 'My First Post',
      excerpt: 'This is an excerpt of my first post',
    },
  },
  {
    id: '2',
    type: 'comment_created',
    username: 'jane_smith',
    displayName: 'Jane Smith',
    avatar: 'JS',
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    content: {
      comment: 'Great post!',
    },
  },
  {
    id: '3',
    type: 'post_liked',
    username: 'bob_wilson',
    displayName: 'Bob Wilson',
    avatar: 'BW',
    timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    content: {
      title: 'Amazing Article',
    },
  },
  {
    id: '4',
    type: 'user_followed',
    username: 'alice_jones',
    displayName: 'Alice Jones',
    avatar: 'AJ',
    timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    content: {
      targetUsername: 'charlie_brown',
      targetName: 'Charlie Brown',
    },
  },
  {
    id: '5',
    type: 'community_joined',
    username: 'david_miller',
    displayName: 'David Miller',
    avatar: 'DM',
    timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    content: {
      communityName: 'tech-enthusiasts',
    },
  },
  {
    id: '6',
    type: 'achievement_earned',
    username: 'eve_davis',
    displayName: 'Eve Davis',
    avatar: 'ED',
    timestamp: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
    content: {
      badgeName: 'Top Contributor',
    },
  },
  {
    id: '7',
    type: 'friend_added',
    username: 'frank_white',
    displayName: 'Frank White',
    avatar: 'FW',
    timestamp: new Date(Date.now() - 1209600000).toISOString(), // 2 weeks ago
    content: {
      friendUsername: 'grace_lee',
      friendName: 'Grace Lee',
    },
  },
];

describe('ActivityFeedPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    apiService.get.mockResolvedValue({
      success: true,
      data: {
        activities: mockActivities,
      },
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      renderWithRouter(<ActivityFeedPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders with proper ARIA labels', () => {
      renderWithRouter(<ActivityFeedPage />);
      expect(screen.getByRole('main', { name: /activity feed page/i })).toBeInTheDocument();
    });

    it('displays the page title', () => {
      renderWithRouter(<ActivityFeedPage />);
      expect(screen.getByText('Activity Feed')).toBeInTheDocument();
    });

    it('displays the page description', () => {
      renderWithRouter(<ActivityFeedPage />);
      expect(screen.getByText(/Stay updated with what your friends and followed users are up to/i)).toBeInTheDocument();
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      renderWithRouter(<ActivityFeedPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('has proper semantic HTML structure', () => {
      renderWithRouter(<ActivityFeedPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });

  describe('useAuth Hook Integration', () => {
    it('uses the authenticated user from useAuth', () => {
      renderWithRouter(<ActivityFeedPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders with authenticated context', () => {
      renderWithRouter(<ActivityFeedPage />, mockAuthContext);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders with unauthenticated context', () => {
      renderWithRouter(<ActivityFeedPage />, mockUnauthContext);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('does not crash when user is null', () => {
      renderWithRouter(<ActivityFeedPage />, { ...mockAuthContext, user: null });
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('React Router Integration', () => {
    it('renders links to user profiles', async () => {
      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        const userLinks = screen.getAllByRole('link');
        expect(userLinks.length).toBeGreaterThan(0);
      });
    });

    it('creates correct link for user profile', async () => {
      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        const link = screen.getByRole('link', { name: /John Doe/i });
        expect(link).toHaveAttribute('href', '/user/john_doe');
      });
    });

    it('creates correct link for community', async () => {
      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        const communityLink = screen.getByRole('link', { name: /tech-enthusiasts/i });
        expect(communityLink).toHaveAttribute('href', '/c/tech-enthusiasts');
      });
    });

    it('renders discover users link in empty state', async () => {
      apiService.get.mockResolvedValueOnce({
        success: true,
        data: { activities: [] },
      });
      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        const discoverLink = screen.getByRole('link', { name: /Discover Users/i });
        expect(discoverLink).toHaveAttribute('href', '/users');
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading state initially', () => {
      renderWithRouter(<ActivityFeedPage />);
      const loadingSkeletons = document.querySelectorAll('.animate-pulse');
      expect(loadingSkeletons.length).toBeGreaterThan(0);
    });

    it('displays 5 loading skeleton items', () => {
      renderWithRouter(<ActivityFeedPage />);
      const loadingSkeletons = document.querySelectorAll('.animate-pulse .flex.items-start.gap-lg');
      expect(loadingSkeletons.length).toBe(5);
    });

    it('hides loading state after data loads', async () => {
      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.queryByText('John Doe')).toBeInTheDocument();
      });
      const loadingSkeletons = document.querySelectorAll('.animate-pulse');
      expect(loadingSkeletons.length).toBe(0);
    });

    it('shows loading when switching filters', async () => {
      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.queryByText('John Doe')).toBeInTheDocument();
      });

      const friendsTab = screen.getByRole('button', { name: /Show friends activity/i });
      fireEvent.click(friendsTab);

      // Loading state should appear briefly
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Activity Feed Display', () => {
    it('displays all activities after loading', async () => {
      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('renders activity avatars', async () => {
      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText('JD')).toBeInTheDocument();
        expect(screen.getByText('JS')).toBeInTheDocument();
      });
    });

    it('renders activity icons for each type', async () => {
      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        const icons = document.querySelectorAll('.w-8.h-8.rounded-lg');
        expect(icons.length).toBeGreaterThan(0);
      });
    });

    it('displays activity content correctly', async () => {
      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText('My First Post')).toBeInTheDocument();
        expect(screen.getByText('This is an excerpt of my first post')).toBeInTheDocument();
      });
    });

    it('renders engagement buttons', async () => {
      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getAllByText('Like').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Comment').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Share').length).toBeGreaterThan(0);
      });
    });

    it('renders hover-lift class on cards', async () => {
      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        const cards = document.querySelectorAll('.hover-lift');
        expect(cards.length).toBe(mockActivities.length);
      });
    });
  });

  describe('Filter Tabs', () => {
    it('displays all filter tabs', () => {
      renderWithRouter(<ActivityFeedPage />);
      expect(screen.getByRole('button', { name: /Show all activity activity/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Show friends activity/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Show following activity/i })).toBeInTheDocument();
    });

    it('has proper navigation ARIA label', () => {
      renderWithRouter(<ActivityFeedPage />);
      expect(screen.getByRole('navigation', { name: /Activity filter/i })).toBeInTheDocument();
    });

    it('marks all tab as active by default', () => {
      renderWithRouter(<ActivityFeedPage />);
      const allTab = screen.getByRole('button', { name: /Show all activity activity/i });
      expect(allTab).toHaveAttribute('aria-pressed', 'true');
    });

    it('switches to friends filter', async () => {
      renderWithRouter(<ActivityFeedPage />);
      const friendsTab = screen.getByRole('button', { name: /Show friends activity/i });
      fireEvent.click(friendsTab);

      await waitFor(() => {
        expect(friendsTab).toHaveAttribute('aria-pressed', 'true');
      });
    });

    it('switches to following filter', async () => {
      renderWithRouter(<ActivityFeedPage />);
      const followingTab = screen.getByRole('button', { name: /Show following activity/i });
      fireEvent.click(followingTab);

      await waitFor(() => {
        expect(followingTab).toHaveAttribute('aria-pressed', 'true');
      });
    });

    it('calls API with correct filter parameter for friends', async () => {
      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/activity/feed?');
      });

      const friendsTab = screen.getByRole('button', { name: /Show friends activity/i });
      fireEvent.click(friendsTab);

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/activity/feed?filter=friends');
      });
    });

    it('calls API with correct filter parameter for following', async () => {
      renderWithRouter(<ActivityFeedPage />);
      const followingTab = screen.getByRole('button', { name: /Show following activity/i });
      fireEvent.click(followingTab);

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/activity/feed?filter=following');
      });
    });

    it('updates content when filter changes', async () => {
      const friendsActivities = [
        {
          id: '100',
          type: 'post_created',
          username: 'friend_user',
          displayName: 'Friend User',
          avatar: 'FU',
          timestamp: new Date().toISOString(),
          content: { title: 'Friend Post' },
        },
      ];

      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      apiService.get.mockResolvedValueOnce({
        success: true,
        data: { activities: friendsActivities },
      });

      const friendsTab = screen.getByRole('button', { name: /Show friends activity/i });
      fireEvent.click(friendsTab);

      await waitFor(() => {
        expect(screen.getByText('Friend User')).toBeInTheDocument();
      });
    });
  });

  describe('Activity Types', () => {
    it('renders post_created activity correctly', async () => {
      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText(/created a new post/i)).toBeInTheDocument();
        expect(screen.getByText('My First Post')).toBeInTheDocument();
      });
    });

    it('renders comment_created activity correctly', async () => {
      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText(/commented on a post/i)).toBeInTheDocument();
        expect(screen.getByText('Great post!')).toBeInTheDocument();
      });
    });

    it('renders post_liked activity correctly', async () => {
      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
        expect(screen.getByText(/liked a post:/i)).toBeInTheDocument();
        expect(screen.getByText('Amazing Article')).toBeInTheDocument();
      });
    });

    it('renders user_followed activity correctly', async () => {
      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText('Alice Jones')).toBeInTheDocument();
        expect(screen.getByText(/started following/i)).toBeInTheDocument();
        expect(screen.getByText('Charlie Brown')).toBeInTheDocument();
      });
    });

    it('renders community_joined activity correctly', async () => {
      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText('David Miller')).toBeInTheDocument();
        expect(screen.getByText(/joined the/i)).toBeInTheDocument();
        expect(screen.getByText(/community/i)).toBeInTheDocument();
      });
    });

    it('renders achievement_earned activity correctly', async () => {
      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText('Eve Davis')).toBeInTheDocument();
        expect(screen.getByText(/earned the/i)).toBeInTheDocument();
        expect(screen.getByText('Top Contributor')).toBeInTheDocument();
        expect(screen.getByText(/achievement/i)).toBeInTheDocument();
      });
    });

    it('renders friend_added activity correctly', async () => {
      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText('Frank White')).toBeInTheDocument();
        expect(screen.getByText(/and/i)).toBeInTheDocument();
        expect(screen.getByText('Grace Lee')).toBeInTheDocument();
        expect(screen.getByText(/are now friends/i)).toBeInTheDocument();
      });
    });

    it('renders default activity type correctly', async () => {
      const defaultActivity = [
        {
          id: '999',
          type: 'unknown_type',
          username: 'unknown_user',
          displayName: 'Unknown User',
          avatar: 'UU',
          timestamp: new Date().toISOString(),
          content: { message: 'did something' },
        },
      ];

      apiService.get.mockResolvedValueOnce({
        success: true,
        data: { activities: defaultActivity },
      });

      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText('Unknown User')).toBeInTheDocument();
        expect(screen.getByText('did something')).toBeInTheDocument();
      });
    });

    it('displays correct icon for post_created', async () => {
      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        const icons = document.querySelectorAll('.bg-primary-trust');
        expect(icons.length).toBeGreaterThan(0);
      });
    });

    it('displays correct icon for comment_created', async () => {
      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        const icons = document.querySelectorAll('.bg-accent-cyan');
        expect(icons.length).toBeGreaterThan(0);
      });
    });

    it('displays correct icon for post_liked', async () => {
      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        const icons = document.querySelectorAll('.bg-error');
        expect(icons.length).toBeGreaterThan(0);
      });
    });

    it('displays correct icon for user_followed', async () => {
      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        const icons = document.querySelectorAll('.bg-success');
        expect(icons.length).toBeGreaterThan(0);
      });
    });

    it('displays correct icon for community_joined', async () => {
      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        const icons = document.querySelectorAll('.bg-warning');
        expect(icons.length).toBeGreaterThan(0);
      });
    });

    it('displays correct icon for achievement_earned', async () => {
      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        const icons = document.querySelectorAll('.bg-accent-green');
        expect(icons.length).toBeGreaterThan(0);
      });
    });

    it('displays correct icon for friend_added', async () => {
      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        const icons = document.querySelectorAll('.bg-info');
        expect(icons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Timestamps and Formatting', () => {
    it('formats "just now" correctly', async () => {
      const recentActivity = [
        {
          ...mockActivities[0],
          timestamp: new Date(Date.now() - 30000).toISOString(), // 30 seconds ago
        },
      ];

      apiService.get.mockResolvedValueOnce({
        success: true,
        data: { activities: recentActivity },
      });

      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText('just now')).toBeInTheDocument();
      });
    });

    it('formats minutes correctly (singular)', async () => {
      const activity = [
        {
          ...mockActivities[0],
          timestamp: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
        },
      ];

      apiService.get.mockResolvedValueOnce({
        success: true,
        data: { activities: activity },
      });

      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText('1 minute ago')).toBeInTheDocument();
      });
    });

    it('formats minutes correctly (plural)', async () => {
      const activity = [
        {
          ...mockActivities[0],
          timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        },
      ];

      apiService.get.mockResolvedValueOnce({
        success: true,
        data: { activities: activity },
      });

      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText('5 minutes ago')).toBeInTheDocument();
      });
    });

    it('formats hours correctly (singular)', async () => {
      const activity = [
        {
          ...mockActivities[0],
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        },
      ];

      apiService.get.mockResolvedValueOnce({
        success: true,
        data: { activities: activity },
      });

      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText('1 hour ago')).toBeInTheDocument();
      });
    });

    it('formats hours correctly (plural)', async () => {
      const activity = [
        {
          ...mockActivities[0],
          timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        },
      ];

      apiService.get.mockResolvedValueOnce({
        success: true,
        data: { activities: activity },
      });

      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText('2 hours ago')).toBeInTheDocument();
      });
    });

    it('formats days correctly (singular)', async () => {
      const activity = [
        {
          ...mockActivities[0],
          timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        },
      ];

      apiService.get.mockResolvedValueOnce({
        success: true,
        data: { activities: activity },
      });

      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText('1 day ago')).toBeInTheDocument();
      });
    });

    it('formats days correctly (plural)', async () => {
      const activity = [
        {
          ...mockActivities[0],
          timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        },
      ];

      apiService.get.mockResolvedValueOnce({
        success: true,
        data: { activities: activity },
      });

      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText('2 days ago')).toBeInTheDocument();
      });
    });

    it('formats old dates as locale date string', async () => {
      const oldDate = new Date('2024-01-01');
      const activity = [
        {
          ...mockActivities[0],
          timestamp: oldDate.toISOString(),
        },
      ];

      apiService.get.mockResolvedValueOnce({
        success: true,
        data: { activities: activity },
      });

      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText(oldDate.toLocaleDateString())).toBeInTheDocument();
      });
    });

    it('displays all timestamps for activities', async () => {
      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        const timestamps = screen.getAllByText(/ago|just now/);
        expect(timestamps.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Empty States', () => {
    it('shows empty state when no activities', async () => {
      apiService.get.mockResolvedValueOnce({
        success: true,
        data: { activities: [] },
      });

      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText('No activity yet')).toBeInTheDocument();
      });
    });

    it('displays empty state icon', async () => {
      apiService.get.mockResolvedValueOnce({
        success: true,
        data: { activities: [] },
      });

      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        const svg = document.querySelector('.h-16.w-16');
        expect(svg).toBeInTheDocument();
      });
    });

    it('shows correct message for all filter empty state', async () => {
      apiService.get.mockResolvedValueOnce({
        success: true,
        data: { activities: [] },
      });

      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText(/Start following users and making friends to see their activity/i)).toBeInTheDocument();
      });
    });

    it('shows correct message for friends filter empty state', async () => {
      apiService.get.mockResolvedValueOnce({
        success: true,
        data: { activities: mockActivities },
      });

      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      apiService.get.mockResolvedValueOnce({
        success: true,
        data: { activities: [] },
      });

      const friendsTab = screen.getByRole('button', { name: /Show friends activity/i });
      fireEvent.click(friendsTab);

      await waitFor(() => {
        expect(screen.getByText(/Your friends haven't been active recently/i)).toBeInTheDocument();
      });
    });

    it('shows correct message for following filter empty state', async () => {
      apiService.get.mockResolvedValueOnce({
        success: true,
        data: { activities: mockActivities },
      });

      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      apiService.get.mockResolvedValueOnce({
        success: true,
        data: { activities: [] },
      });

      const followingTab = screen.getByRole('button', { name: /Show following activity/i });
      fireEvent.click(followingTab);

      await waitFor(() => {
        expect(screen.getByText(/Users you follow haven't been active recently/i)).toBeInTheDocument();
      });
    });

    it('shows "View All Activity" button in filtered empty states', async () => {
      apiService.get.mockResolvedValueOnce({
        success: true,
        data: { activities: [] },
      });

      renderWithRouter(<ActivityFeedPage />);
      const friendsTab = screen.getByRole('button', { name: /Show friends activity/i });
      fireEvent.click(friendsTab);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /View All Activity/i })).toBeInTheDocument();
      });
    });

    it('shows "Discover Users" link in all filter empty state', async () => {
      apiService.get.mockResolvedValueOnce({
        success: true,
        data: { activities: [] },
      });

      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /Discover Users/i })).toBeInTheDocument();
      });
    });

    it('switches back to all filter when clicking "View All Activity"', async () => {
      apiService.get.mockResolvedValueOnce({
        success: true,
        data: { activities: [] },
      });

      renderWithRouter(<ActivityFeedPage />);
      const friendsTab = screen.getByRole('button', { name: /Show friends activity/i });
      fireEvent.click(friendsTab);

      await waitFor(() => {
        const viewAllButton = screen.getByRole('button', { name: /View All Activity/i });
        fireEvent.click(viewAllButton);
      });

      const allTab = screen.getByRole('button', { name: /Show all activity activity/i });
      expect(allTab).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Error Handling', () => {
    it('displays error message when API fails', async () => {
      apiService.get.mockRejectedValueOnce(new Error('Network error'));

      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText(/Error Loading Activity Feed/i)).toBeInTheDocument();
        expect(screen.getByText(/Failed to load activity feed. Please try again./i)).toBeInTheDocument();
      });
    });

    it('shows error alert with proper ARIA attributes', async () => {
      apiService.get.mockRejectedValueOnce(new Error('Network error'));

      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('displays retry button on error', async () => {
      apiService.get.mockRejectedValueOnce(new Error('Network error'));

      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
      });
    });

    it('retries loading when clicking retry button', async () => {
      apiService.get.mockRejectedValueOnce(new Error('Network error'));

      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText(/Error Loading Activity Feed/i)).toBeInTheDocument();
      });

      apiService.get.mockResolvedValueOnce({
        success: true,
        data: { activities: mockActivities },
      });

      const retryButton = screen.getByRole('button', { name: /Try Again/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('handles empty response data', async () => {
      apiService.get.mockResolvedValueOnce({
        success: true,
        data: null,
      });

      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText('No activity yet')).toBeInTheDocument();
      });
    });

    it('handles response without activities field', async () => {
      apiService.get.mockResolvedValueOnce({
        success: true,
        data: {},
      });

      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText('No activity yet')).toBeInTheDocument();
      });
    });

    it('handles unsuccessful response', async () => {
      apiService.get.mockResolvedValueOnce({
        success: false,
        data: null,
      });

      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText('No activity yet')).toBeInTheDocument();
      });
    });

    it('logs errors to console', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      apiService.get.mockRejectedValueOnce(new Error('Test error'));

      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error loading activity feed:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Load More / Infinite Scroll', () => {
    it('shows load more button when activities are divisible by 10', async () => {
      const tenActivities = Array.from({ length: 10 }, (_, i) => ({
        ...mockActivities[0],
        id: `activity-${i}`,
      }));

      apiService.get.mockResolvedValueOnce({
        success: true,
        data: { activities: tenActivities },
      });

      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Load More Activity/i })).toBeInTheDocument();
      });
    });

    it('does not show load more button when activities count is not divisible by 10', async () => {
      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Load More Activity/i })).not.toBeInTheDocument();
      });
    });

    it('shows load more button for exactly 20 activities', async () => {
      const twentyActivities = Array.from({ length: 20 }, (_, i) => ({
        ...mockActivities[0],
        id: `activity-${i}`,
      }));

      apiService.get.mockResolvedValueOnce({
        success: true,
        data: { activities: twentyActivities },
      });

      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Load More Activity/i })).toBeInTheDocument();
      });
    });

    it('hides load more button when there are no activities', async () => {
      apiService.get.mockResolvedValueOnce({
        success: true,
        data: { activities: [] },
      });

      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Load More Activity/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles activity without content field', async () => {
      const activityWithoutContent = [
        {
          id: '1',
          type: 'post_liked',
          username: 'testuser',
          displayName: 'Test User',
          avatar: 'TU',
          timestamp: new Date().toISOString(),
        },
      ];

      apiService.get.mockResolvedValueOnce({
        success: true,
        data: { activities: activityWithoutContent },
      });

      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText('Untitled')).toBeInTheDocument();
      });
    });

    it('handles activity with null content', async () => {
      const activityWithNullContent = [
        {
          id: '1',
          type: 'post_created',
          username: 'testuser',
          displayName: 'Test User',
          avatar: 'TU',
          timestamp: new Date().toISOString(),
          content: null,
        },
      ];

      apiService.get.mockResolvedValueOnce({
        success: true,
        data: { activities: activityWithNullContent },
      });

      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });
    });

    it('handles activity without excerpt in post_created', async () => {
      const activityWithoutExcerpt = [
        {
          id: '1',
          type: 'post_created',
          username: 'testuser',
          displayName: 'Test User',
          avatar: 'TU',
          timestamp: new Date().toISOString(),
          content: { title: 'Test Post' },
        },
      ];

      apiService.get.mockResolvedValueOnce({
        success: true,
        data: { activities: activityWithoutExcerpt },
      });

      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText('Test Post')).toBeInTheDocument();
      });
    });

    it('handles very long activity content', async () => {
      const longContent = 'A'.repeat(1000);
      const activityWithLongContent = [
        {
          id: '1',
          type: 'comment_created',
          username: 'testuser',
          displayName: 'Test User',
          avatar: 'TU',
          timestamp: new Date().toISOString(),
          content: { comment: longContent },
        },
      ];

      apiService.get.mockResolvedValueOnce({
        success: true,
        data: { activities: activityWithLongContent },
      });

      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText(longContent)).toBeInTheDocument();
      });
    });

    it('handles activity with special characters in username', async () => {
      const specialCharActivity = [
        {
          id: '1',
          type: 'post_created',
          username: 'user-name_123',
          displayName: 'User Name 123',
          avatar: 'UN',
          timestamp: new Date().toISOString(),
          content: { title: 'Test' },
        },
      ];

      apiService.get.mockResolvedValueOnce({
        success: true,
        data: { activities: specialCharActivity },
      });

      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        const link = screen.getByRole('link', { name: /User Name 123/i });
        expect(link).toHaveAttribute('href', '/user/user-name_123');
      });
    });

    it('handles activity with HTML in content', async () => {
      const htmlActivity = [
        {
          id: '1',
          type: 'post_created',
          username: 'testuser',
          displayName: 'Test User',
          avatar: 'TU',
          timestamp: new Date().toISOString(),
          content: { title: '<script>alert("xss")</script>' },
        },
      ];

      apiService.get.mockResolvedValueOnce({
        success: true,
        data: { activities: htmlActivity },
      });

      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText('<script>alert("xss")</script>')).toBeInTheDocument();
      });
    });

    it('handles very old timestamp', async () => {
      const veryOldActivity = [
        {
          id: '1',
          type: 'post_created',
          username: 'testuser',
          displayName: 'Test User',
          avatar: 'TU',
          timestamp: new Date('2000-01-01').toISOString(),
          content: { title: 'Old Post' },
        },
      ];

      apiService.get.mockResolvedValueOnce({
        success: true,
        data: { activities: veryOldActivity },
      });

      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText(new Date('2000-01-01').toLocaleDateString())).toBeInTheDocument();
      });
    });

    it('handles future timestamp gracefully', async () => {
      const futureActivity = [
        {
          id: '1',
          type: 'post_created',
          username: 'testuser',
          displayName: 'Test User',
          avatar: 'TU',
          timestamp: new Date(Date.now() + 86400000).toISOString(), // 1 day in future
          content: { title: 'Future Post' },
        },
      ];

      apiService.get.mockResolvedValueOnce({
        success: true,
        data: { activities: futureActivity },
      });

      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });
    });

    it('handles invalid timestamp', async () => {
      const invalidTimestampActivity = [
        {
          id: '1',
          type: 'post_created',
          username: 'testuser',
          displayName: 'Test User',
          avatar: 'TU',
          timestamp: 'invalid-date',
          content: { title: 'Test Post' },
        },
      ];

      apiService.get.mockResolvedValueOnce({
        success: true,
        data: { activities: invalidTimestampActivity },
      });

      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for filter tabs', () => {
      renderWithRouter(<ActivityFeedPage />);
      expect(screen.getByRole('button', { name: /Show all activity activity/i })).toHaveAttribute('aria-pressed');
    });

    it('has proper ARIA labels for retry button', async () => {
      apiService.get.mockRejectedValueOnce(new Error('Network error'));

      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /Retry loading activity feed/i });
        expect(retryButton).toBeInTheDocument();
      });
    });

    it('uses semantic HTML for activity cards', async () => {
      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        const main = screen.getByRole('main');
        expect(main).toBeInTheDocument();
      });
    });

    it('has proper heading hierarchy', () => {
      renderWithRouter(<ActivityFeedPage />);
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
      expect(h1).toHaveTextContent('Activity Feed');
    });

    it('has aria-hidden on decorative icons', async () => {
      apiService.get.mockRejectedValueOnce(new Error('Network error'));

      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        const decorativeIcons = document.querySelectorAll('[aria-hidden="true"]');
        expect(decorativeIcons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Component Snapshots', () => {
    it('matches snapshot with activities', async () => {
      const { container } = renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot in loading state', () => {
      const { container } = renderWithRouter(<ActivityFeedPage />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot in empty state', async () => {
      apiService.get.mockResolvedValueOnce({
        success: true,
        data: { activities: [] },
      });

      const { container } = renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText('No activity yet')).toBeInTheDocument();
      });
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot in error state', async () => {
      apiService.get.mockRejectedValueOnce(new Error('Network error'));

      const { container } = renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText(/Error Loading Activity Feed/i)).toBeInTheDocument();
      });
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with friends filter', async () => {
      renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const friendsTab = screen.getByRole('button', { name: /Show friends activity/i });
      fireEvent.click(friendsTab);

      const { container } = renderWithRouter(<ActivityFeedPage />);
      await waitFor(() => {
        expect(friendsTab).toHaveAttribute('aria-pressed', 'true');
      });
      expect(container).toMatchSnapshot();
    });
  });
});

export default renderWithRouter
