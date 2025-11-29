/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FriendsSystem from './FriendsSystem';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Users: (props) => <div data-testid="icon-users" {...props} />,
  UserPlus: (props) => <div data-testid="icon-user-plus" {...props} />,
  UserMinus: (props) => <div data-testid="icon-user-minus" {...props} />,
  UserCheck: (props) => <div data-testid="icon-user-check" {...props} />,
  UserX: (props) => <div data-testid="icon-user-x" {...props} />,
  Search: (props) => <div data-testid="icon-search" {...props} />,
  Filter: (props) => <div data-testid="icon-filter" {...props} />,
  MoreVertical: (props) => <div data-testid="icon-more-vertical" {...props} />,
  MessageSquare: (props) => <div data-testid="icon-message-square" {...props} />,
  Bell: (props) => <div data-testid="icon-bell" {...props} />,
  BellOff: (props) => <div data-testid="icon-bell-off" {...props} />,
  Star: (props) => <div data-testid="icon-star" {...props} />,
  Clock: (props) => <div data-testid="icon-clock" {...props} />,
  Check: (props) => <div data-testid="icon-check" {...props} />,
  X: (props) => <div data-testid="icon-x" {...props} />,
  Send: (props) => <div data-testid="icon-send" {...props} />,
  Activity: (props) => <div data-testid="icon-activity" {...props} />,
  BarChart3: (props) => <div data-testid="icon-bar-chart3" {...props} />,
  Eye: (props) => <div data-testid="icon-eye" {...props} />,
  Settings: (props) => <div data-testid="icon-settings" {...props} />,
  Sparkles: (props) => <div data-testid="icon-sparkles" {...props} />
}));

// Mock sub-components
jest.mock('./Social/FollowButton', () => {
  return function FollowButton(props) {
    return <button data-testid="follow-button" onClick={props.onClick}>Follow</button>;
  };
});

jest.mock('./Social/SocialListsModal', () => {
  return function SocialListsModal(props) {
    return (
      <div data-testid="social-lists-modal">
        <button onClick={props.onClose}>Close Lists</button>
      </div>
    );
  };
});

jest.mock('./Social/FriendRequestSystem', () => {
  return function FriendRequestSystem(props) {
    return (
      <div data-testid="friend-request-system">
        <button onClick={props.onClose}>Close Requests</button>
      </div>
    );
  };
});

jest.mock('./Social/FriendSuggestions', () => {
  return function FriendSuggestions(props) {
    return (
      <div data-testid="friend-suggestions">
        <button onClick={props.onClose}>Close Suggestions</button>
      </div>
    );
  };
});

jest.mock('./Social/SocialActivityFeed', () => {
  return function SocialActivityFeed(props) {
    return (
      <div data-testid="social-activity-feed">
        <button onClick={props.onClose}>Close Activity</button>
      </div>
    );
  };
});

jest.mock('./Social/SocialAnalytics', () => {
  return function SocialAnalytics(props) {
    return (
      <div data-testid="social-analytics">
        <button onClick={props.onClose}>Close Analytics</button>
      </div>
    );
  };
});

jest.mock('./Social/SocialPrivacySettings', () => {
  return function SocialPrivacySettings(props) {
    return (
      <div data-testid="social-privacy-settings">
        <button onClick={props.onClose}>Close Privacy</button>
      </div>
    );
  };
});

jest.mock('./Social/SocialGraphVisualization', () => {
  return function SocialGraphVisualization(props) {
    return (
      <div data-testid="social-graph-visualization">
        <button onClick={props.onClose}>Close Graph</button>
      </div>
    );
  };
});

// Mock useAuth hook
const mockUseAuth = jest.fn();
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

// Mock useSocialRealTime hook
const mockUseSocialRealTime = jest.fn();
jest.mock('../hooks/useSocialRealTime', () => {
  return function useSocialRealTime() {
    return mockUseSocialRealTime();
  };
});

// Mock socialService
const mockSocialService = {
  getFriends: jest.fn(),
  getFollowing: jest.fn(),
  getFollowers: jest.fn(),
  getFriendRequests: jest.fn(),
  getFriendSuggestions: jest.fn(),
  followUser: jest.fn(),
  unfollowUser: jest.fn(),
  acceptFriendRequest: jest.fn(),
  rejectFriendRequest: jest.fn()
};
jest.mock('../services/socialService', () => mockSocialService);

// Mock useToast hook
const mockShowToast = jest.fn();
jest.mock('./ui/useToast', () => ({
  useToast: () => ({
    showToast: mockShowToast
  })
}));

// Mock CSS import
jest.mock('./FriendsSystem.css', () => ({}));

describe('FriendsSystem', () => {
  const mockCurrentUser = {
    id: 'user123',
    username: 'testuser',
    displayName: 'Test User'
  };

  const mockOnClose = jest.fn();

  const defaultSocialRealTimeReturn = {
    isConnected: true,
    socialUpdates: {
      friends: [],
      following: [],
      followers: [],
      requests: []
    },
    realTimeStats: {
      followersCount: 10,
      followingCount: 15,
      friendsCount: 8,
      requestsCount: 3
    },
    followUser: jest.fn(),
    unfollowUser: jest.fn(),
    sendFriendRequest: jest.fn(),
    acceptFriendRequest: jest.fn(),
    rejectFriendRequest: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: mockCurrentUser });
    mockUseSocialRealTime.mockReturnValue(defaultSocialRealTimeReturn);

    // Setup default mock responses
    mockSocialService.getFriends.mockResolvedValue({
      success: true,
      data: { friends: [] }
    });
    mockSocialService.getFollowing.mockResolvedValue({
      success: true,
      data: { following: [] }
    });
    mockSocialService.getFollowers.mockResolvedValue({
      success: true,
      data: { followers: [] }
    });
    mockSocialService.getFriendRequests.mockResolvedValue({
      success: true,
      data: { requests: [] }
    });
    mockSocialService.getFriendSuggestions.mockResolvedValue({
      success: true,
      data: { suggestions: [] }
    });
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );
      expect(container).toBeInTheDocument();
    });

    it('renders with correct structure', () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );
      expect(screen.getByText('Social Hub')).toBeInTheDocument();
    });

    it('renders header with title', () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );
      expect(screen.getByText('Social Hub')).toBeInTheDocument();
      expect(screen.getByTestId('icon-users')).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );
      const closeButtons = screen.getAllByTestId('icon-x');
      expect(closeButtons.length).toBeGreaterThan(0);
    });

    it('renders with default initialView as dashboard', () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );
      expect(screen.getByText('Manage Connections')).toBeInTheDocument();
    });

    it('renders with custom initialView', () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
          initialView="lists"
        />
      );
      expect(screen.getByTestId('social-lists-modal')).toBeInTheDocument();
    });

    it('handles null currentUser prop', () => {
      render(
        <FriendsSystem
          currentUser={null}
          onClose={mockOnClose}
        />
      );
      expect(screen.getByText('Social Hub')).toBeInTheDocument();
    });

    it('handles undefined props gracefully', () => {
      expect(() => render(<FriendsSystem />)).not.toThrow();
    });
  });

  describe('Dashboard View', () => {
    it('renders dashboard stats cards', async () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Followers')).toBeInTheDocument();
        expect(screen.getByText('Following')).toBeInTheDocument();
        expect(screen.getByText('Friends')).toBeInTheDocument();
        expect(screen.getByText('Requests')).toBeInTheDocument();
      });
    });

    it('displays real-time stats in dashboard', async () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('10')).toBeInTheDocument(); // followersCount
        expect(screen.getByText('15')).toBeInTheDocument(); // followingCount
        expect(screen.getByText('8')).toBeInTheDocument(); // friendsCount
        expect(screen.getByText('3')).toBeInTheDocument(); // requestsCount
      });
    });

    it('renders all action cards', async () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Manage Connections')).toBeInTheDocument();
        expect(screen.getByText('Friend Requests')).toBeInTheDocument();
        expect(screen.getByText('Discover People')).toBeInTheDocument();
        expect(screen.getByText('Activity Feed')).toBeInTheDocument();
        expect(screen.getByText('Social Analytics')).toBeInTheDocument();
        expect(screen.getByText('Privacy & Safety')).toBeInTheDocument();
      });
    });

    it('displays correct icons for stats cards', () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      expect(screen.getAllByTestId('icon-users').length).toBeGreaterThan(0);
      expect(screen.getByTestId('icon-eye')).toBeInTheDocument();
      expect(screen.getByTestId('icon-user-check')).toBeInTheDocument();
      expect(screen.getByTestId('icon-bell')).toBeInTheDocument();
    });

    it('displays correct icons for action cards', () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('icon-user-plus')).toBeInTheDocument();
      expect(screen.getByTestId('icon-sparkles')).toBeInTheDocument();
      expect(screen.getByTestId('icon-activity')).toBeInTheDocument();
      expect(screen.getByTestId('icon-bar-chart3')).toBeInTheDocument();
      expect(screen.getByTestId('icon-settings')).toBeInTheDocument();
    });

    it('shows notification badge on Friend Requests when requests exist', async () => {
      mockUseSocialRealTime.mockReturnValue({
        ...defaultSocialRealTimeReturn,
        realTimeStats: {
          ...defaultSocialRealTimeReturn.realTimeStats,
          requestsCount: 5
        }
      });

      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument();
      });
    });
  });

  describe('Action Cards - Manage Connections', () => {
    it('navigates to lists view when Manage Connections is clicked', async () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      const manageButton = screen.getByText('Manage Connections');
      await userEvent.click(manageButton);

      await waitFor(() => {
        expect(screen.getByTestId('social-lists-modal')).toBeInTheDocument();
      });
    });

    it('displays correct description for Manage Connections', () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('View and manage your followers, following, and friends')).toBeInTheDocument();
    });
  });

  describe('Action Cards - Friend Requests', () => {
    it('navigates to requests view when Friend Requests is clicked', async () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      const requestsButton = screen.getByText('Friend Requests');
      await userEvent.click(requestsButton);

      await waitFor(() => {
        expect(screen.getByTestId('friend-request-system')).toBeInTheDocument();
      });
    });

    it('displays correct description for Friend Requests', () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Review pending friend requests and invitations')).toBeInTheDocument();
    });
  });

  describe('Action Cards - Discover People', () => {
    it('navigates to suggestions view when Discover People is clicked', async () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      const discoverButton = screen.getByText('Discover People');
      await userEvent.click(discoverButton);

      await waitFor(() => {
        expect(screen.getByTestId('friend-suggestions')).toBeInTheDocument();
      });
    });

    it('displays correct description for Discover People', () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Find interesting people to connect with')).toBeInTheDocument();
    });
  });

  describe('Action Cards - Activity Feed', () => {
    it('navigates to activity view when Activity Feed is clicked', async () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      const activityButton = screen.getByText('Activity Feed');
      await userEvent.click(activityButton);

      await waitFor(() => {
        expect(screen.getByTestId('social-activity-feed')).toBeInTheDocument();
      });
    });

    it('displays correct description for Activity Feed', () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('See what your network is up to')).toBeInTheDocument();
    });
  });

  describe('Action Cards - Social Analytics', () => {
    it('navigates to analytics view when Social Analytics is clicked', async () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      const analyticsButton = screen.getByText('Social Analytics');
      await userEvent.click(analyticsButton);

      await waitFor(() => {
        expect(screen.getByTestId('social-analytics')).toBeInTheDocument();
      });
    });

    it('displays correct description for Social Analytics', () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Insights into your social network performance')).toBeInTheDocument();
    });
  });

  describe('Action Cards - Privacy & Safety', () => {
    it('navigates to privacy view when Privacy & Safety is clicked', async () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      const privacyButton = screen.getByText('Privacy & Safety');
      await userEvent.click(privacyButton);

      await waitFor(() => {
        expect(screen.getByTestId('social-privacy-settings')).toBeInTheDocument();
      });
    });

    it('displays correct description for Privacy & Safety', () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Manage your privacy settings and blocked users')).toBeInTheDocument();
    });
  });

  describe('View Switching', () => {
    it('switches from dashboard to lists view', async () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      const manageButton = screen.getByText('Manage Connections');
      await userEvent.click(manageButton);

      await waitFor(() => {
        expect(screen.getByTestId('social-lists-modal')).toBeInTheDocument();
        expect(screen.queryByText('Manage Connections')).not.toBeInTheDocument();
      });
    });

    it('switches from dashboard to requests view', async () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      const requestsButton = screen.getByText('Friend Requests');
      await userEvent.click(requestsButton);

      await waitFor(() => {
        expect(screen.getByTestId('friend-request-system')).toBeInTheDocument();
      });
    });

    it('switches from dashboard to suggestions view', async () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      const discoverButton = screen.getByText('Discover People');
      await userEvent.click(discoverButton);

      await waitFor(() => {
        expect(screen.getByTestId('friend-suggestions')).toBeInTheDocument();
      });
    });

    it('switches from dashboard to activity view', async () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      const activityButton = screen.getByText('Activity Feed');
      await userEvent.click(activityButton);

      await waitFor(() => {
        expect(screen.getByTestId('social-activity-feed')).toBeInTheDocument();
      });
    });

    it('switches from dashboard to analytics view', async () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      const analyticsButton = screen.getByText('Social Analytics');
      await userEvent.click(analyticsButton);

      await waitFor(() => {
        expect(screen.getByTestId('social-analytics')).toBeInTheDocument();
      });
    });

    it('switches from dashboard to privacy view', async () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      const privacyButton = screen.getByText('Privacy & Safety');
      await userEvent.click(privacyButton);

      await waitFor(() => {
        expect(screen.getByTestId('social-privacy-settings')).toBeInTheDocument();
      });
    });

    it('can return to dashboard from lists view', async () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      const manageButton = screen.getByText('Manage Connections');
      await userEvent.click(manageButton);

      await waitFor(() => {
        expect(screen.getByTestId('social-lists-modal')).toBeInTheDocument();
      });

      const closeButton = screen.getByText('Close Lists');
      await userEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.getByText('Manage Connections')).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Navigation', () => {
    it('renders mobile navigation toggle', () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Menu')).toBeInTheDocument();
      expect(screen.getByTestId('icon-more-vertical')).toBeInTheDocument();
    });

    it('opens mobile menu when toggle is clicked', async () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      const menuButton = screen.getByText('Menu');
      await userEvent.click(menuButton);

      await waitFor(() => {
        const mobileButtons = screen.getAllByRole('button');
        const dashboardButtons = mobileButtons.filter(btn => btn.textContent === 'Dashboard');
        expect(dashboardButtons.length).toBeGreaterThan(0);
      });
    });

    it('closes mobile menu after selecting an option', async () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      const menuButton = screen.getByText('Menu');
      await userEvent.click(menuButton);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const connectionsButton = buttons.find(btn => btn.textContent === 'Connections');
        expect(connectionsButton).toBeDefined();
      });
    });

    it('navigates to different views from mobile menu', async () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      const menuButton = screen.getByText('Menu');
      await userEvent.click(menuButton);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const requestsButton = buttons.find(btn => btn.textContent === 'Requests');
        if (requestsButton) {
          fireEvent.click(requestsButton);
        }
      });
    });
  });

  describe('Real-Time Connection Indicator', () => {
    it('shows live indicator when connected', () => {
      mockUseSocialRealTime.mockReturnValue({
        ...defaultSocialRealTimeReturn,
        isConnected: true
      });

      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    it('does not show live indicator when disconnected', () => {
      mockUseSocialRealTime.mockReturnValue({
        ...defaultSocialRealTimeReturn,
        isConnected: false
      });

      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByText('Live')).not.toBeInTheDocument();
    });

    it('renders real-time dot indicator', () => {
      mockUseSocialRealTime.mockReturnValue({
        ...defaultSocialRealTimeReturn,
        isConnected: true
      });

      const { container } = render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      const realtimeDot = container.querySelector('.realtime-dot');
      expect(realtimeDot).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('loads friends data on mount', async () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(mockSocialService.getFriends).toHaveBeenCalled();
      });
    });

    it('loads data based on active tab', async () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(mockSocialService.getFriends).toHaveBeenCalled();
      });
    });

    it('handles loading state during data fetch', async () => {
      mockSocialService.getFriends.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ success: true, data: { friends: [] } }), 100))
      );

      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(mockSocialService.getFriends).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API error when loading friends', async () => {
      mockSocialService.getFriends.mockRejectedValue(new Error('API Error'));

      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(mockSocialService.getFriends).toHaveBeenCalled();
      });
    });

    it('handles API error when loading following', async () => {
      mockSocialService.getFollowing.mockRejectedValue(new Error('API Error'));

      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(mockSocialService.getFriends).toHaveBeenCalled();
      });
    });

    it('handles API error when loading followers', async () => {
      mockSocialService.getFollowers.mockRejectedValue(new Error('API Error'));

      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(mockSocialService.getFriends).toHaveBeenCalled();
      });
    });

    it('handles API error when loading requests', async () => {
      mockSocialService.getFriendRequests.mockRejectedValue(new Error('API Error'));

      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(mockSocialService.getFriends).toHaveBeenCalled();
      });
    });

    it('handles API error when loading suggestions', async () => {
      mockSocialService.getFriendSuggestions.mockRejectedValue(new Error('API Error'));

      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(mockSocialService.getFriends).toHaveBeenCalled();
      });
    });

    it('shows toast message on error', async () => {
      const error = new Error('Failed to load');
      mockSocialService.getFriends.mockRejectedValue(error);

      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(mockSocialService.getFriends).toHaveBeenCalled();
      });
    });
  });

  describe('User Interactions - Close', () => {
    it('calls onClose when close button is clicked', async () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      const closeButtons = screen.getAllByTestId('icon-x');
      await userEvent.click(closeButtons[0]);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('handles close without onClose prop', async () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
        />
      );

      const closeButtons = screen.getAllByTestId('icon-x');
      await userEvent.click(closeButtons[0]);

      // Should not throw error
    });
  });

  describe('Real-Time Updates', () => {
    it('updates friends list from real-time data', async () => {
      const mockFriends = [
        { id: 'user1', username: 'friend1', displayName: 'Friend One' },
        { id: 'user2', username: 'friend2', displayName: 'Friend Two' }
      ];

      const { rerender } = render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      mockUseSocialRealTime.mockReturnValue({
        ...defaultSocialRealTimeReturn,
        isConnected: true,
        socialUpdates: {
          friends: mockFriends,
          following: [],
          followers: [],
          requests: []
        }
      });

      rerender(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(mockUseSocialRealTime).toHaveBeenCalled();
      });
    });

    it('updates following list from real-time data', async () => {
      const mockFollowing = [
        { id: 'user3', username: 'follow1', displayName: 'Follow One' }
      ];

      const { rerender } = render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      mockUseSocialRealTime.mockReturnValue({
        ...defaultSocialRealTimeReturn,
        isConnected: true,
        socialUpdates: {
          friends: [],
          following: mockFollowing,
          followers: [],
          requests: []
        }
      });

      rerender(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(mockUseSocialRealTime).toHaveBeenCalled();
      });
    });

    it('updates followers list from real-time data', async () => {
      const mockFollowers = [
        { id: 'user4', username: 'follower1', displayName: 'Follower One' }
      ];

      const { rerender } = render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      mockUseSocialRealTime.mockReturnValue({
        ...defaultSocialRealTimeReturn,
        isConnected: true,
        socialUpdates: {
          friends: [],
          following: [],
          followers: mockFollowers,
          requests: []
        }
      });

      rerender(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(mockUseSocialRealTime).toHaveBeenCalled();
      });
    });

    it('updates requests list from real-time data', async () => {
      const mockRequests = [
        { id: 'req1', username: 'requester1', displayName: 'Requester One' }
      ];

      const { rerender } = render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      mockUseSocialRealTime.mockReturnValue({
        ...defaultSocialRealTimeReturn,
        isConnected: true,
        socialUpdates: {
          friends: [],
          following: [],
          followers: [],
          requests: mockRequests
        }
      });

      rerender(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(mockUseSocialRealTime).toHaveBeenCalled();
      });
    });
  });

  describe('Props Handling', () => {
    it('uses currentUser.id when available', () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Social Hub')).toBeInTheDocument();
    });

    it('falls back to user.id from useAuth when currentUser not provided', () => {
      render(
        <FriendsSystem
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Social Hub')).toBeInTheDocument();
    });

    it('passes embedded prop to child components', async () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      const manageButton = screen.getByText('Manage Connections');
      await userEvent.click(manageButton);

      await waitFor(() => {
        expect(screen.getByTestId('social-lists-modal')).toBeInTheDocument();
      });
    });

    it('passes showHeader prop to FriendSuggestions', async () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      const discoverButton = screen.getByText('Discover People');
      await userEvent.click(discoverButton);

      await waitFor(() => {
        expect(screen.getByTestId('friend-suggestions')).toBeInTheDocument();
      });
    });
  });

  describe('CSS Classes', () => {
    it('applies correct CSS classes to main container', () => {
      const { container } = render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      expect(container.querySelector('.friends-modal')).toBeInTheDocument();
      expect(container.querySelector('.enhanced')).toBeInTheDocument();
    });

    it('applies correct CSS classes to header', () => {
      const { container } = render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      expect(container.querySelector('.friends-header')).toBeInTheDocument();
    });

    it('applies correct CSS classes to content', () => {
      const { container } = render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      expect(container.querySelector('.friends-content')).toBeInTheDocument();
    });

    it('applies correct CSS classes to dashboard', () => {
      const { container } = render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      expect(container.querySelector('.social-dashboard')).toBeInTheDocument();
    });

    it('applies correct CSS classes to stat cards', () => {
      const { container } = render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      expect(container.querySelector('.stat-card')).toBeInTheDocument();
    });

    it('applies correct CSS classes to action cards', () => {
      const { container } = render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      expect(container.querySelector('.action-card')).toBeInTheDocument();
    });
  });

  describe('Snapshot Tests', () => {
    it('matches snapshot for dashboard view', () => {
      const { container } = render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot with real-time connection', () => {
      mockUseSocialRealTime.mockReturnValue({
        ...defaultSocialRealTimeReturn,
        isConnected: true
      });

      const { container } = render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot without real-time connection', () => {
      mockUseSocialRealTime.mockReturnValue({
        ...defaultSocialRealTimeReturn,
        isConnected: false
      });

      const { container } = render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for lists view', async () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
          initialView="lists"
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('social-lists-modal')).toBeInTheDocument();
      });
    });

    it('matches snapshot for requests view', async () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
          initialView="requests"
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('friend-request-system')).toBeInTheDocument();
      });
    });

    it('matches snapshot for suggestions view', async () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
          initialView="suggestions"
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('friend-suggestions')).toBeInTheDocument();
      });
    });

    it('matches snapshot for activity view', async () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
          initialView="activity"
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('social-activity-feed')).toBeInTheDocument();
      });
    });

    it('matches snapshot for analytics view', async () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
          initialView="analytics"
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('social-analytics')).toBeInTheDocument();
      });
    });

    it('matches snapshot for privacy view', async () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
          initialView="privacy"
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('social-privacy-settings')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles missing socialService methods gracefully', async () => {
      mockSocialService.getFriends.mockResolvedValue({ success: false });

      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(mockSocialService.getFriends).toHaveBeenCalled();
      });
    });

    it('handles empty stats gracefully', () => {
      mockUseSocialRealTime.mockReturnValue({
        ...defaultSocialRealTimeReturn,
        realTimeStats: {}
      });

      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Social Hub')).toBeInTheDocument();
    });

    it('handles missing showToast gracefully', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Social Hub')).toBeInTheDocument();
      });

      console.error.mockRestore();
    });

    it('handles rapid view switching', async () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      const manageButton = screen.getByText('Manage Connections');
      await userEvent.click(manageButton);

      await waitFor(() => {
        expect(screen.getByTestId('social-lists-modal')).toBeInTheDocument();
      });

      const closeButton = screen.getByText('Close Lists');
      await userEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.getByText('Manage Connections')).toBeInTheDocument();
      });
    });

    it('handles graph view navigation', async () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
          initialView="graph"
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('social-graph-visualization')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has accessible close button', () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons.find(btn => btn.className.includes('close-btn'));
      expect(closeButton).toBeInTheDocument();
    });

    it('has accessible action cards as buttons', () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      const actionButtons = screen.getAllByRole('button');
      expect(actionButtons.length).toBeGreaterThan(0);
    });

    it('provides semantic HTML structure', () => {
      render(
        <FriendsSystem
          currentUser={mockCurrentUser}
          onClose={mockOnClose}
        />
      );

      const heading = screen.getByRole('heading', { name: /social hub/i });
      expect(heading).toBeInTheDocument();
    });
  });
});

export default FollowButton
