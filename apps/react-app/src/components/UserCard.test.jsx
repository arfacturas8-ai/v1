/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import UserCard from './UserCard';

// Mock React Router
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ to, children, className }) => (
    <a href={to} className={className}>
      {children}
    </a>
  )
}));

// Mock useAuth hook
const mockUseAuth = jest.fn();
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

// Mock apiService
const mockApiService = {
  delete: jest.fn(),
  post: jest.fn()
};
jest.mock('../services/api', () => ({
  __esModule: true,
  default: mockApiService
}));

// Mock window.confirm
global.confirm = jest.fn();

// Mock window.location.reload
delete window.location;
window.location = { reload: jest.fn() };

describe('UserCard', () => {
  const mockCurrentUser = {
    id: 'current-user-123',
    username: 'currentuser',
    displayName: 'Current User',
    friends: [],
    following: [],
    blockedUsers: [],
    pendingFriendRequests: [],
    incomingFriendRequests: []
  };

  const mockUser = {
    id: 'user-456',
    username: 'testuser',
    displayName: 'Test User',
    avatar: 'TU',
    bio: 'This is a test bio',
    karma: 150,
    friends: ['friend1', 'friend2'],
    followers: ['follower1', 'follower2', 'follower3'],
    interests: ['Gaming', 'Music', 'Art', 'Technology'],
    location: 'New York, NY',
    isOnline: true,
    privacySettings: {
      showLocation: true
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: mockCurrentUser });
    mockApiService.delete.mockResolvedValue({});
    mockApiService.post.mockResolvedValue({});
    global.confirm.mockReturnValue(true);
  });

  describe('Rendering - Basic', () => {
    it('renders without crashing', () => {
      const { container } = render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );
      expect(container).toBeInTheDocument();
    });

    it('returns null when user prop is not provided', () => {
      const { container } = render(
        <BrowserRouter>
          <UserCard user={null} />
        </BrowserRouter>
      );
      expect(container.firstChild).toBeNull();
    });

    it('returns null when user prop is undefined', () => {
      const { container } = render(
        <BrowserRouter>
          <UserCard />
        </BrowserRouter>
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Rendering - Compact Mode', () => {
    it('renders compact card when compact prop is true', () => {
      render(
        <BrowserRouter>
          <UserCard user={mockUser} compact={true} />
        </BrowserRouter>
      );

      expect(screen.getByText(mockUser.displayName)).toBeInTheDocument();
      expect(screen.getByText(`@${mockUser.username}`)).toBeInTheDocument();
    });

    it('renders avatar in compact mode', () => {
      render(
        <BrowserRouter>
          <UserCard user={mockUser} compact={true} />
        </BrowserRouter>
      );

      expect(screen.getByText(mockUser.avatar)).toBeInTheDocument();
    });

    it('renders online status indicator in compact mode when user is online', () => {
      const { container } = render(
        <BrowserRouter>
          <UserCard user={mockUser} compact={true} />
        </BrowserRouter>
      );

      const onlineIndicator = container.querySelector('.bg-green-400');
      expect(onlineIndicator).toBeInTheDocument();
    });

    it('does not render online status indicator in compact mode when user is offline', () => {
      const offlineUser = { ...mockUser, isOnline: false };
      const { container } = render(
        <BrowserRouter>
          <UserCard user={offlineUser} compact={true} />
        </BrowserRouter>
      );

      const onlineIndicator = container.querySelector('.bg-green-400');
      expect(onlineIndicator).not.toBeInTheDocument();
    });

    it('renders link to user profile in compact mode', () => {
      render(
        <BrowserRouter>
          <UserCard user={mockUser} compact={true} />
        </BrowserRouter>
      );

      const link = screen.getAllByRole('link')[0];
      expect(link).toHaveAttribute('href', `/user/${mockUser.username}`);
    });

    it('does not render bio in compact mode', () => {
      render(
        <BrowserRouter>
          <UserCard user={mockUser} compact={true} />
        </BrowserRouter>
      );

      expect(screen.queryByText(mockUser.bio)).not.toBeInTheDocument();
    });

    it('does not render interests in compact mode', () => {
      render(
        <BrowserRouter>
          <UserCard user={mockUser} compact={true} />
        </BrowserRouter>
      );

      expect(screen.queryByText('Gaming')).not.toBeInTheDocument();
    });

    it('does not render karma in compact mode', () => {
      render(
        <BrowserRouter>
          <UserCard user={mockUser} compact={true} />
        </BrowserRouter>
      );

      expect(screen.queryByText(`${mockUser.karma} karma`)).not.toBeInTheDocument();
    });
  });

  describe('Rendering - Full Mode', () => {
    it('renders full card when compact prop is false', () => {
      render(
        <BrowserRouter>
          <UserCard user={mockUser} compact={false} />
        </BrowserRouter>
      );

      expect(screen.getByText(mockUser.displayName)).toBeInTheDocument();
      expect(screen.getByText(`@${mockUser.username}`)).toBeInTheDocument();
    });

    it('renders full card by default', () => {
      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      expect(screen.getByText(mockUser.displayName)).toBeInTheDocument();
    });

    it('renders avatar in full mode', () => {
      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      expect(screen.getByText(mockUser.avatar)).toBeInTheDocument();
    });

    it('renders online status indicator in full mode when user is online', () => {
      const { container } = render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      const onlineIndicator = container.querySelector('.bg-green-400');
      expect(onlineIndicator).toBeInTheDocument();
    });

    it('does not render online status indicator in full mode when user is offline', () => {
      const offlineUser = { ...mockUser, isOnline: false };
      const { container } = render(
        <BrowserRouter>
          <UserCard user={offlineUser} />
        </BrowserRouter>
      );

      const onlineIndicator = container.querySelector('.bg-green-400');
      expect(onlineIndicator).not.toBeInTheDocument();
    });

    it('renders bio in full mode', () => {
      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      expect(screen.getByText(mockUser.bio)).toBeInTheDocument();
    });

    it('does not render bio section when bio is not provided', () => {
      const userWithoutBio = { ...mockUser, bio: null };
      render(
        <BrowserRouter>
          <UserCard user={userWithoutBio} />
        </BrowserRouter>
      );

      expect(screen.queryByText(mockUser.bio)).not.toBeInTheDocument();
    });

    it('does not render bio section when bio is empty string', () => {
      const userWithoutBio = { ...mockUser, bio: '' };
      render(
        <BrowserRouter>
          <UserCard user={userWithoutBio} />
        </BrowserRouter>
      );

      const bioElement = screen.queryByText((content, element) => {
        return element?.className?.includes('line-clamp-2');
      });
      expect(bioElement).not.toBeInTheDocument();
    });

    it('renders karma in full mode', () => {
      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      expect(screen.getByText(`${mockUser.karma} karma`)).toBeInTheDocument();
    });

    it('renders friends count in full mode', () => {
      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      expect(screen.getByText(`${mockUser.friends.length} friends`)).toBeInTheDocument();
    });

    it('renders friends count as 0 when friends array is empty', () => {
      const userWithoutFriends = { ...mockUser, friends: [] };
      render(
        <BrowserRouter>
          <UserCard user={userWithoutFriends} />
        </BrowserRouter>
      );

      expect(screen.getByText('0 friends')).toBeInTheDocument();
    });

    it('renders friends count as 0 when friends is undefined', () => {
      const userWithoutFriends = { ...mockUser, friends: undefined };
      render(
        <BrowserRouter>
          <UserCard user={userWithoutFriends} />
        </BrowserRouter>
      );

      expect(screen.getByText('0 friends')).toBeInTheDocument();
    });

    it('renders followers count in full mode', () => {
      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      expect(screen.getByText(`${mockUser.followers.length} followers`)).toBeInTheDocument();
    });

    it('renders followers count as 0 when followers is undefined', () => {
      const userWithoutFollowers = { ...mockUser, followers: undefined };
      render(
        <BrowserRouter>
          <UserCard user={userWithoutFollowers} />
        </BrowserRouter>
      );

      expect(screen.getByText('0 followers')).toBeInTheDocument();
    });

    it('renders location when showLocation is true', () => {
      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      expect(screen.getByText(`📍 ${mockUser.location}`)).toBeInTheDocument();
    });

    it('does not render location when showLocation is false', () => {
      const userWithPrivateLocation = {
        ...mockUser,
        privacySettings: { showLocation: false }
      };
      render(
        <BrowserRouter>
          <UserCard user={userWithPrivateLocation} />
        </BrowserRouter>
      );

      expect(screen.queryByText(`📍 ${mockUser.location}`)).not.toBeInTheDocument();
    });

    it('does not render location when location is not provided', () => {
      const userWithoutLocation = {
        ...mockUser,
        location: null,
        privacySettings: { showLocation: true }
      };
      render(
        <BrowserRouter>
          <UserCard user={userWithoutLocation} />
        </BrowserRouter>
      );

      expect(screen.queryByText(/📍/)).not.toBeInTheDocument();
    });

    it('does not render location when privacySettings is not provided', () => {
      const userWithoutPrivacy = {
        ...mockUser,
        privacySettings: null
      };
      render(
        <BrowserRouter>
          <UserCard user={userWithoutPrivacy} />
        </BrowserRouter>
      );

      expect(screen.queryByText(/📍/)).not.toBeInTheDocument();
    });
  });

  describe('Rendering - Interests', () => {
    it('renders first 3 interests in full mode', () => {
      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      expect(screen.getByText('Gaming')).toBeInTheDocument();
      expect(screen.getByText('Music')).toBeInTheDocument();
      expect(screen.getByText('Art')).toBeInTheDocument();
    });

    it('does not render 4th interest directly', () => {
      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      expect(screen.queryByText('Technology')).not.toBeInTheDocument();
    });

    it('renders +more indicator when there are more than 3 interests', () => {
      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      expect(screen.getByText('+1 more')).toBeInTheDocument();
    });

    it('does not render +more indicator when there are exactly 3 interests', () => {
      const userWith3Interests = {
        ...mockUser,
        interests: ['Gaming', 'Music', 'Art']
      };
      render(
        <BrowserRouter>
          <UserCard user={userWith3Interests} />
        </BrowserRouter>
      );

      expect(screen.queryByText(/\+.*more/)).not.toBeInTheDocument();
    });

    it('renders correct +more count for multiple extra interests', () => {
      const userWithManyInterests = {
        ...mockUser,
        interests: ['Gaming', 'Music', 'Art', 'Tech', 'Sports', 'Reading']
      };
      render(
        <BrowserRouter>
          <UserCard user={userWithManyInterests} />
        </BrowserRouter>
      );

      expect(screen.getByText('+3 more')).toBeInTheDocument();
    });

    it('does not render interests section when interests array is empty', () => {
      const userWithoutInterests = { ...mockUser, interests: [] };
      render(
        <BrowserRouter>
          <UserCard user={userWithoutInterests} />
        </BrowserRouter>
      );

      expect(screen.queryByText('Gaming')).not.toBeInTheDocument();
    });

    it('does not render interests section when interests is undefined', () => {
      const userWithoutInterests = { ...mockUser, interests: undefined };
      render(
        <BrowserRouter>
          <UserCard user={userWithoutInterests} />
        </BrowserRouter>
      );

      expect(screen.queryByText('Gaming')).not.toBeInTheDocument();
    });

    it('does not render interests section when interests is null', () => {
      const userWithoutInterests = { ...mockUser, interests: null };
      render(
        <BrowserRouter>
          <UserCard user={userWithoutInterests} />
        </BrowserRouter>
      );

      expect(screen.queryByText('Gaming')).not.toBeInTheDocument();
    });
  });

  describe('Friend Actions - Add Friend', () => {
    it('renders Add Friend button when not friends and no pending request', () => {
      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      expect(screen.getByText('Add Friend')).toBeInTheDocument();
    });

    it('calls apiService.post when Add Friend is clicked', async () => {
      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      const addButton = screen.getByText('Add Friend');
      await userEvent.click(addButton);

      await waitFor(() => {
        expect(mockApiService.post).toHaveBeenCalledWith(`/friends/requests/${mockUser.id}`);
      });
    });

    it('reloads page after Add Friend when onUpdate is not provided', async () => {
      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      const addButton = screen.getByText('Add Friend');
      await userEvent.click(addButton);

      await waitFor(() => {
        expect(window.location.reload).toHaveBeenCalled();
      });
    });

    it('calls onUpdate after Add Friend when provided', async () => {
      const onUpdate = jest.fn();
      render(
        <BrowserRouter>
          <UserCard user={mockUser} onUpdate={onUpdate} />
        </BrowserRouter>
      );

      const addButton = screen.getByText('Add Friend');
      await userEvent.click(addButton);

      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalled();
      });
    });

    it('does not reload page when onUpdate is provided', async () => {
      const onUpdate = jest.fn();
      render(
        <BrowserRouter>
          <UserCard user={mockUser} onUpdate={onUpdate} />
        </BrowserRouter>
      );

      const addButton = screen.getByText('Add Friend');
      await userEvent.click(addButton);

      await waitFor(() => {
        expect(window.location.reload).not.toHaveBeenCalled();
      });
    });

    it('renders Add button in compact mode', () => {
      render(
        <BrowserRouter>
          <UserCard user={mockUser} compact={true} />
        </BrowserRouter>
      );

      expect(screen.getByText('Add')).toBeInTheDocument();
    });
  });

  describe('Friend Actions - Accept Friend Request', () => {
    it('renders Accept Friend Request button when hasIncomingRequest', () => {
      const currentUserWithIncoming = {
        ...mockCurrentUser,
        incomingFriendRequests: [mockUser.id]
      };
      mockUseAuth.mockReturnValue({ user: currentUserWithIncoming });

      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      expect(screen.getByText('Accept Friend Request')).toBeInTheDocument();
    });

    it('calls apiService.post with accept endpoint when Accept is clicked', async () => {
      const currentUserWithIncoming = {
        ...mockCurrentUser,
        incomingFriendRequests: [mockUser.id]
      };
      mockUseAuth.mockReturnValue({ user: currentUserWithIncoming });

      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      const acceptButton = screen.getByText('Accept Friend Request');
      await userEvent.click(acceptButton);

      await waitFor(() => {
        expect(mockApiService.post).toHaveBeenCalledWith(`/friends/requests/${mockUser.id}/accept`);
      });
    });

    it('renders Accept button in compact mode when hasIncomingRequest', () => {
      const currentUserWithIncoming = {
        ...mockCurrentUser,
        incomingFriendRequests: [mockUser.id]
      };
      mockUseAuth.mockReturnValue({ user: currentUserWithIncoming });

      render(
        <BrowserRouter>
          <UserCard user={mockUser} compact={true} />
        </BrowserRouter>
      );

      expect(screen.getByText('Accept')).toBeInTheDocument();
    });

    it('calls onUpdate after accepting friend request', async () => {
      const currentUserWithIncoming = {
        ...mockCurrentUser,
        incomingFriendRequests: [mockUser.id]
      };
      mockUseAuth.mockReturnValue({ user: currentUserWithIncoming });

      const onUpdate = jest.fn();
      render(
        <BrowserRouter>
          <UserCard user={mockUser} onUpdate={onUpdate} />
        </BrowserRouter>
      );

      const acceptButton = screen.getByText('Accept Friend Request');
      await userEvent.click(acceptButton);

      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalled();
      });
    });
  });

  describe('Friend Actions - Remove Friend', () => {
    it('renders Remove Friend button when already friends', () => {
      const currentUserWithFriend = {
        ...mockCurrentUser,
        friends: [mockUser.id]
      };
      mockUseAuth.mockReturnValue({ user: currentUserWithFriend });

      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      expect(screen.getByText('Remove Friend')).toBeInTheDocument();
    });

    it('calls apiService.delete when Remove Friend is clicked', async () => {
      const currentUserWithFriend = {
        ...mockCurrentUser,
        friends: [mockUser.id]
      };
      mockUseAuth.mockReturnValue({ user: currentUserWithFriend });

      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      const removeButton = screen.getByText('Remove Friend');
      await userEvent.click(removeButton);

      await waitFor(() => {
        expect(mockApiService.delete).toHaveBeenCalledWith(`/friends/${mockUser.id}`);
      });
    });

    it('calls onUpdate after removing friend', async () => {
      const currentUserWithFriend = {
        ...mockCurrentUser,
        friends: [mockUser.id]
      };
      mockUseAuth.mockReturnValue({ user: currentUserWithFriend });

      const onUpdate = jest.fn();
      render(
        <BrowserRouter>
          <UserCard user={mockUser} onUpdate={onUpdate} />
        </BrowserRouter>
      );

      const removeButton = screen.getByText('Remove Friend');
      await userEvent.click(removeButton);

      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalled();
      });
    });
  });

  describe('Friend Actions - Pending Request', () => {
    it('renders Request Sent indicator when hasPendingRequest', () => {
      const currentUserWithPending = {
        ...mockCurrentUser,
        pendingFriendRequests: [mockUser.id]
      };
      mockUseAuth.mockReturnValue({ user: currentUserWithPending });

      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      expect(screen.getByText('Request Sent')).toBeInTheDocument();
    });

    it('does not render Request Sent as clickable button', () => {
      const currentUserWithPending = {
        ...mockCurrentUser,
        pendingFriendRequests: [mockUser.id]
      };
      mockUseAuth.mockReturnValue({ user: currentUserWithPending });

      const { container } = render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      const requestSent = screen.getByText('Request Sent');
      expect(requestSent.tagName).toBe('SPAN');
    });

    it('renders Pending in compact mode when hasPendingRequest', () => {
      const currentUserWithPending = {
        ...mockCurrentUser,
        pendingFriendRequests: [mockUser.id]
      };
      mockUseAuth.mockReturnValue({ user: currentUserWithPending });

      render(
        <BrowserRouter>
          <UserCard user={mockUser} compact={true} />
        </BrowserRouter>
      );

      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });

  describe('Follow/Unfollow Actions', () => {
    it('renders Follow button when not following', () => {
      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      expect(screen.getByText('Follow')).toBeInTheDocument();
    });

    it('renders Unfollow button when already following', () => {
      const currentUserFollowing = {
        ...mockCurrentUser,
        following: [mockUser.id]
      };
      mockUseAuth.mockReturnValue({ user: currentUserFollowing });

      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      expect(screen.getByText('Unfollow')).toBeInTheDocument();
    });

    it('calls apiService.post when Follow is clicked', async () => {
      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      const followButton = screen.getByText('Follow');
      await userEvent.click(followButton);

      await waitFor(() => {
        expect(mockApiService.post).toHaveBeenCalledWith(`/users/${mockUser.id}/follow`);
      });
    });

    it('calls apiService.delete when Unfollow is clicked', async () => {
      const currentUserFollowing = {
        ...mockCurrentUser,
        following: [mockUser.id]
      };
      mockUseAuth.mockReturnValue({ user: currentUserFollowing });

      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      const unfollowButton = screen.getByText('Unfollow');
      await userEvent.click(unfollowButton);

      await waitFor(() => {
        expect(mockApiService.delete).toHaveBeenCalledWith(`/users/${mockUser.id}/follow`);
      });
    });

    it('calls onUpdate after following', async () => {
      const onUpdate = jest.fn();
      render(
        <BrowserRouter>
          <UserCard user={mockUser} onUpdate={onUpdate} />
        </BrowserRouter>
      );

      const followButton = screen.getByText('Follow');
      await userEvent.click(followButton);

      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalled();
      });
    });

    it('calls onUpdate after unfollowing', async () => {
      const currentUserFollowing = {
        ...mockCurrentUser,
        following: [mockUser.id]
      };
      mockUseAuth.mockReturnValue({ user: currentUserFollowing });

      const onUpdate = jest.fn();
      render(
        <BrowserRouter>
          <UserCard user={mockUser} onUpdate={onUpdate} />
        </BrowserRouter>
      );

      const unfollowButton = screen.getByText('Unfollow');
      await userEvent.click(unfollowButton);

      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalled();
      });
    });

    it('does not render Follow button in compact mode', () => {
      render(
        <BrowserRouter>
          <UserCard user={mockUser} compact={true} />
        </BrowserRouter>
      );

      expect(screen.queryByText('Follow')).not.toBeInTheDocument();
    });
  });

  describe('Block Action', () => {
    it('renders Block button', () => {
      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      expect(screen.getByText('Block')).toBeInTheDocument();
    });

    it('shows confirmation dialog when Block is clicked', async () => {
      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      const blockButton = screen.getByText('Block');
      await userEvent.click(blockButton);

      expect(global.confirm).toHaveBeenCalledWith(`Are you sure you want to block ${mockUser.displayName}?`);
    });

    it('calls apiService.post when Block is confirmed', async () => {
      global.confirm.mockReturnValue(true);

      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      const blockButton = screen.getByText('Block');
      await userEvent.click(blockButton);

      await waitFor(() => {
        expect(mockApiService.post).toHaveBeenCalledWith(`/users/me/blocked/${mockUser.id}`);
      });
    });

    it('does not call apiService.post when Block is cancelled', async () => {
      global.confirm.mockReturnValue(false);

      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      const blockButton = screen.getByText('Block');
      await userEvent.click(blockButton);

      await waitFor(() => {
        expect(mockApiService.post).not.toHaveBeenCalled();
      });
    });

    it('calls onUpdate after blocking when confirmation is accepted', async () => {
      global.confirm.mockReturnValue(true);
      const onUpdate = jest.fn();

      render(
        <BrowserRouter>
          <UserCard user={mockUser} onUpdate={onUpdate} />
        </BrowserRouter>
      );

      const blockButton = screen.getByText('Block');
      await userEvent.click(blockButton);

      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalled();
      });
    });

    it('does not render Block button in compact mode', () => {
      render(
        <BrowserRouter>
          <UserCard user={mockUser} compact={true} />
        </BrowserRouter>
      );

      expect(screen.queryByText('Block')).not.toBeInTheDocument();
    });

    it('does not render Block button when user is already blocked', () => {
      const currentUserWithBlocked = {
        ...mockCurrentUser,
        blockedUsers: [mockUser.id]
      };
      mockUseAuth.mockReturnValue({ user: currentUserWithBlocked });

      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      expect(screen.queryByText('Block')).not.toBeInTheDocument();
    });
  });

  describe('isSelf State - Edit Profile', () => {
    it('renders Edit Profile button when user is viewing their own card', () => {
      const selfUser = { ...mockUser, id: mockCurrentUser.id };

      render(
        <BrowserRouter>
          <UserCard user={selfUser} />
        </BrowserRouter>
      );

      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });

    it('does not render action buttons when isSelf is true', () => {
      const selfUser = { ...mockUser, id: mockCurrentUser.id };

      render(
        <BrowserRouter>
          <UserCard user={selfUser} />
        </BrowserRouter>
      );

      expect(screen.queryByText('Add Friend')).not.toBeInTheDocument();
      expect(screen.queryByText('Follow')).not.toBeInTheDocument();
      expect(screen.queryByText('Block')).not.toBeInTheDocument();
    });

    it('Edit Profile links to /settings', () => {
      const selfUser = { ...mockUser, id: mockCurrentUser.id };

      render(
        <BrowserRouter>
          <UserCard user={selfUser} />
        </BrowserRouter>
      );

      const editLink = screen.getByText('Edit Profile');
      expect(editLink).toHaveAttribute('href', '/settings');
    });

    it('does not render Edit Profile in compact mode even for self', () => {
      const selfUser = { ...mockUser, id: mockCurrentUser.id };

      render(
        <BrowserRouter>
          <UserCard user={selfUser} compact={true} />
        </BrowserRouter>
      );

      expect(screen.queryByText('Edit Profile')).not.toBeInTheDocument();
    });
  });

  describe('showActions Prop', () => {
    it('renders actions by default', () => {
      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      expect(screen.getByText('Add Friend')).toBeInTheDocument();
    });

    it('does not render actions when showActions is false', () => {
      render(
        <BrowserRouter>
          <UserCard user={mockUser} showActions={false} />
        </BrowserRouter>
      );

      expect(screen.queryByText('Add Friend')).not.toBeInTheDocument();
      expect(screen.queryByText('Follow')).not.toBeInTheDocument();
      expect(screen.queryByText('Block')).not.toBeInTheDocument();
    });

    it('does not render actions in compact mode when showActions is false', () => {
      render(
        <BrowserRouter>
          <UserCard user={mockUser} compact={true} showActions={false} />
        </BrowserRouter>
      );

      expect(screen.queryByText('Add')).not.toBeInTheDocument();
    });

    it('renders actions in compact mode when showActions is true', () => {
      render(
        <BrowserRouter>
          <UserCard user={mockUser} compact={true} showActions={true} />
        </BrowserRouter>
      );

      expect(screen.getByText('Add')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('disables Add Friend button while loading', async () => {
      mockApiService.post.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({}), 100))
      );

      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      const addButton = screen.getByText('Add Friend');
      await userEvent.click(addButton);

      expect(addButton).toBeDisabled();
    });

    it('disables Follow button while loading', async () => {
      mockApiService.post.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({}), 100))
      );

      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      const followButton = screen.getByText('Follow');
      await userEvent.click(followButton);

      expect(followButton).toBeDisabled();
    });

    it('disables Block button while loading', async () => {
      global.confirm.mockReturnValue(true);
      mockApiService.post.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({}), 100))
      );

      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      const blockButton = screen.getByText('Block');
      await userEvent.click(blockButton);

      expect(blockButton).toBeDisabled();
    });

    it('does not trigger multiple friend requests when clicked multiple times', async () => {
      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      const addButton = screen.getByText('Add Friend');
      await userEvent.click(addButton);
      await userEvent.click(addButton);
      await userEvent.click(addButton);

      await waitFor(() => {
        expect(mockApiService.post).toHaveBeenCalledTimes(1);
      });
    });

    it('does not trigger multiple follow requests when clicked multiple times', async () => {
      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      const followButton = screen.getByText('Follow');
      await userEvent.click(followButton);
      await userEvent.click(followButton);
      await userEvent.click(followButton);

      await waitFor(() => {
        expect(mockApiService.post).toHaveBeenCalledTimes(1);
      });
    });

    it('re-enables button after successful action', async () => {
      const onUpdate = jest.fn();
      render(
        <BrowserRouter>
          <UserCard user={mockUser} onUpdate={onUpdate} />
        </BrowserRouter>
      );

      const addButton = screen.getByText('Add Friend');
      await userEvent.click(addButton);

      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalled();
      });

      expect(addButton).not.toBeDisabled();
    });
  });

  describe('Error Handling - Friend Request', () => {
    it('logs error when friend request fails', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockApiService.post.mockRejectedValue(new Error('API Error'));

      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      const addButton = screen.getByText('Add Friend');
      await userEvent.click(addButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Friend request error:', expect.any(Error));
      });

      consoleError.mockRestore();
    });

    it('re-enables button after error', async () => {
      mockApiService.post.mockRejectedValue(new Error('API Error'));
      jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      const addButton = screen.getByText('Add Friend');
      await userEvent.click(addButton);

      await waitFor(() => {
        expect(addButton).not.toBeDisabled();
      });

      console.error.mockRestore();
    });

    it('does not call onUpdate when error occurs', async () => {
      mockApiService.post.mockRejectedValue(new Error('API Error'));
      jest.spyOn(console, 'error').mockImplementation(() => {});
      const onUpdate = jest.fn();

      render(
        <BrowserRouter>
          <UserCard user={mockUser} onUpdate={onUpdate} />
        </BrowserRouter>
      );

      const addButton = screen.getByText('Add Friend');
      await userEvent.click(addButton);

      await waitFor(() => {
        expect(mockApiService.post).toHaveBeenCalled();
      });

      expect(onUpdate).not.toHaveBeenCalled();
      console.error.mockRestore();
    });
  });

  describe('Error Handling - Follow', () => {
    it('logs error when follow fails', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockApiService.post.mockRejectedValue(new Error('API Error'));

      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      const followButton = screen.getByText('Follow');
      await userEvent.click(followButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Follow error:', expect.any(Error));
      });

      consoleError.mockRestore();
    });

    it('re-enables button after follow error', async () => {
      mockApiService.post.mockRejectedValue(new Error('API Error'));
      jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      const followButton = screen.getByText('Follow');
      await userEvent.click(followButton);

      await waitFor(() => {
        expect(followButton).not.toBeDisabled();
      });

      console.error.mockRestore();
    });
  });

  describe('Error Handling - Block', () => {
    it('logs error when block fails', async () => {
      global.confirm.mockReturnValue(true);
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockApiService.post.mockRejectedValue(new Error('API Error'));

      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      const blockButton = screen.getByText('Block');
      await userEvent.click(blockButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Block error:', expect.any(Error));
      });

      consoleError.mockRestore();
    });

    it('re-enables button after block error', async () => {
      global.confirm.mockReturnValue(true);
      mockApiService.post.mockRejectedValue(new Error('API Error'));
      jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      const blockButton = screen.getByText('Block');
      await userEvent.click(blockButton);

      await waitFor(() => {
        expect(blockButton).not.toBeDisabled();
      });

      console.error.mockRestore();
    });
  });

  describe('Edge Cases - Blocked User', () => {
    it('does not render action buttons when user is blocked', () => {
      const currentUserWithBlocked = {
        ...mockCurrentUser,
        blockedUsers: [mockUser.id]
      };
      mockUseAuth.mockReturnValue({ user: currentUserWithBlocked });

      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      expect(screen.queryByText('Add Friend')).not.toBeInTheDocument();
      expect(screen.queryByText('Follow')).not.toBeInTheDocument();
      expect(screen.queryByText('Block')).not.toBeInTheDocument();
    });

    it('still renders user information when user is blocked', () => {
      const currentUserWithBlocked = {
        ...mockCurrentUser,
        blockedUsers: [mockUser.id]
      };
      mockUseAuth.mockReturnValue({ user: currentUserWithBlocked });

      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      expect(screen.getByText(mockUser.displayName)).toBeInTheDocument();
      expect(screen.getByText(`@${mockUser.username}`)).toBeInTheDocument();
    });
  });

  describe('Edge Cases - No Current User', () => {
    it('handles null currentUser gracefully', () => {
      mockUseAuth.mockReturnValue({ user: null });

      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      expect(screen.getByText(mockUser.displayName)).toBeInTheDocument();
    });

    it('does not crash when currentUser is undefined', () => {
      mockUseAuth.mockReturnValue({ user: undefined });

      expect(() => {
        render(
          <BrowserRouter>
            <UserCard user={mockUser} />
          </BrowserRouter>
        );
      }).not.toThrow();
    });

    it('renders card without actions when currentUser is null', () => {
      mockUseAuth.mockReturnValue({ user: null });

      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      expect(screen.queryByText('Add Friend')).not.toBeInTheDocument();
    });
  });

  describe('Snapshot Tests - Compact Mode', () => {
    it('matches snapshot for compact mode with online user', () => {
      const { container } = render(
        <BrowserRouter>
          <UserCard user={mockUser} compact={true} />
        </BrowserRouter>
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for compact mode with offline user', () => {
      const offlineUser = { ...mockUser, isOnline: false };
      const { container } = render(
        <BrowserRouter>
          <UserCard user={offlineUser} compact={true} />
        </BrowserRouter>
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for compact mode with Add button', () => {
      const { container } = render(
        <BrowserRouter>
          <UserCard user={mockUser} compact={true} showActions={true} />
        </BrowserRouter>
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for compact mode with Accept button', () => {
      const currentUserWithIncoming = {
        ...mockCurrentUser,
        incomingFriendRequests: [mockUser.id]
      };
      mockUseAuth.mockReturnValue({ user: currentUserWithIncoming });

      const { container } = render(
        <BrowserRouter>
          <UserCard user={mockUser} compact={true} />
        </BrowserRouter>
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for compact mode with Pending indicator', () => {
      const currentUserWithPending = {
        ...mockCurrentUser,
        pendingFriendRequests: [mockUser.id]
      };
      mockUseAuth.mockReturnValue({ user: currentUserWithPending });

      const { container } = render(
        <BrowserRouter>
          <UserCard user={mockUser} compact={true} />
        </BrowserRouter>
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for compact mode without actions', () => {
      const { container } = render(
        <BrowserRouter>
          <UserCard user={mockUser} compact={true} showActions={false} />
        </BrowserRouter>
      );

      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Snapshot Tests - Full Mode', () => {
    it('matches snapshot for full mode with all features', () => {
      const { container } = render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for full mode without bio', () => {
      const userWithoutBio = { ...mockUser, bio: null };
      const { container } = render(
        <BrowserRouter>
          <UserCard user={userWithoutBio} />
        </BrowserRouter>
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for full mode without interests', () => {
      const userWithoutInterests = { ...mockUser, interests: [] };
      const { container } = render(
        <BrowserRouter>
          <UserCard user={userWithoutInterests} />
        </BrowserRouter>
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for full mode without location', () => {
      const userWithoutLocation = {
        ...mockUser,
        location: null,
        privacySettings: { showLocation: false }
      };
      const { container } = render(
        <BrowserRouter>
          <UserCard user={userWithoutLocation} />
        </BrowserRouter>
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for full mode with offline user', () => {
      const offlineUser = { ...mockUser, isOnline: false };
      const { container } = render(
        <BrowserRouter>
          <UserCard user={offlineUser} />
        </BrowserRouter>
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for full mode as friend', () => {
      const currentUserWithFriend = {
        ...mockCurrentUser,
        friends: [mockUser.id]
      };
      mockUseAuth.mockReturnValue({ user: currentUserWithFriend });

      const { container } = render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for full mode following user', () => {
      const currentUserFollowing = {
        ...mockCurrentUser,
        following: [mockUser.id]
      };
      mockUseAuth.mockReturnValue({ user: currentUserFollowing });

      const { container } = render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for full mode with incoming friend request', () => {
      const currentUserWithIncoming = {
        ...mockCurrentUser,
        incomingFriendRequests: [mockUser.id]
      };
      mockUseAuth.mockReturnValue({ user: currentUserWithIncoming });

      const { container } = render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for full mode with pending request', () => {
      const currentUserWithPending = {
        ...mockCurrentUser,
        pendingFriendRequests: [mockUser.id]
      };
      mockUseAuth.mockReturnValue({ user: currentUserWithPending });

      const { container } = render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for full mode viewing own profile', () => {
      const selfUser = { ...mockUser, id: mockCurrentUser.id };

      const { container } = render(
        <BrowserRouter>
          <UserCard user={selfUser} />
        </BrowserRouter>
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for full mode with blocked user', () => {
      const currentUserWithBlocked = {
        ...mockCurrentUser,
        blockedUsers: [mockUser.id]
      };
      mockUseAuth.mockReturnValue({ user: currentUserWithBlocked });

      const { container } = render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for full mode without actions', () => {
      const { container } = render(
        <BrowserRouter>
          <UserCard user={mockUser} showActions={false} />
        </BrowserRouter>
      );

      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Accessibility', () => {
    it('has accessible links to user profile', () => {
      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });

    it('has accessible buttons', () => {
      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('buttons have proper disabled state', async () => {
      mockApiService.post.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({}), 100))
      );

      render(
        <BrowserRouter>
          <UserCard user={mockUser} />
        </BrowserRouter>
      );

      const addButton = screen.getByText('Add Friend');
      await userEvent.click(addButton);

      expect(addButton).toHaveAttribute('disabled');
    });
  });
});

export default mockUseAuth
