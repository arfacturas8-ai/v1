/**
 * Comprehensive Test Suite for CRYB User Profile Card Component
 * Tests cover rendering, user interactions, badges, stats, social links, and accessibility
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import {
  UserProfileCard,
  ProfileAvatar,
  RoleBadge,
  UserBadges,
  ProfileStats,
  StatusIndicator,
  ProfileActions,
  type UserProfile,
  type UserBadge,
  type UserStats,
} from './user-profile-card';

// Mock dependencies
vi.mock('../../lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: any, ref: any) => (
      <div ref={ref} {...props}>
        {children}
      </div>
    )),
  },
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Users: ({ className }: any) => <svg className={className} data-testid="users-icon" />,
  MapPin: ({ className }: any) => <svg className={className} data-testid="mappin-icon" />,
  Calendar: ({ className }: any) => <svg className={className} data-testid="calendar-icon" />,
  Link: ({ className }: any) => <svg className={className} data-testid="link-icon" />,
  Crown: ({ className }: any) => <svg className={className} data-testid="crown-icon" />,
  Shield: ({ className }: any) => <svg className={className} data-testid="shield-icon" />,
  Star: ({ className }: any) => <svg className={className} data-testid="star-icon" />,
  MessageCircle: ({ className }: any) => <svg className={className} data-testid="message-circle-icon" />,
  UserPlus: ({ className }: any) => <svg className={className} data-testid="userplus-icon" />,
  UserMinus: ({ className }: any) => <svg className={className} data-testid="userminus-icon" />,
  MoreHorizontal: ({ className }: any) => <svg className={className} data-testid="morehorizontal-icon" />,
  Mail: ({ className }: any) => <svg className={className} data-testid="mail-icon" />,
  Globe: ({ className }: any) => <svg className={className} data-testid="globe-icon" />,
  Settings: ({ className }: any) => <svg className={className} data-testid="settings-icon" />,
  Flag: ({ className }: any) => <svg className={className} data-testid="flag-icon" />,
  Eye: ({ className }: any) => <svg className={className} data-testid="eye-icon" />,
  Award: ({ className }: any) => <svg className={className} data-testid="award-icon" />,
  Activity: ({ className }: any) => <svg className={className} data-testid="activity-icon" />,
  TrendingUp: ({ className }: any) => <svg className={className} data-testid="trendingup-icon" />,
  Badge: ({ className }: any) => <svg className={className} data-testid="badge-icon" />,
}));

// Mock Button component
vi.mock('../ui/button', () => ({
  Button: ({ children, onClick, variant, className, ...props }: any) => (
    <button
      onClick={onClick}
      data-variant={variant}
      className={className}
      {...props}
    >
      {children}
    </button>
  ),
  IconButton: ({ icon, onClick, variant, size, ...props }: any) => (
    <button
      onClick={onClick}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {icon}
    </button>
  ),
}));

// Mock Radix UI Dropdown Menu
vi.mock('@radix-ui/react-dropdown-menu', () => ({
  Root: ({ children }: any) => <div data-testid="dropdown-root">{children}</div>,
  Trigger: React.forwardRef(({ children, asChild }: any, ref: any) => (
    <div ref={ref} data-testid="dropdown-trigger">
      {children}
    </div>
  )),
  Portal: ({ children }: any) => <div data-testid="dropdown-portal">{children}</div>,
  Content: ({ children, ...props }: any) => (
    <div data-testid="dropdown-content" {...props}>
      {children}
    </div>
  ),
  Item: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} data-testid="dropdown-item" {...props}>
      {children}
    </button>
  ),
}));

// Mock Radix UI Tabs
vi.mock('@radix-ui/react-tabs', () => ({
  Root: ({ children }: any) => <div>{children}</div>,
  List: ({ children }: any) => <div>{children}</div>,
  Trigger: ({ children }: any) => <button>{children}</button>,
  Content: ({ children }: any) => <div>{children}</div>,
}));

// Mock Radix UI Accordion (used for BadgeComponent)
vi.mock('@radix-ui/react-accordion', () => ({
  Root: ({ children }: any) => <div>{children}</div>,
}));

describe('UserProfileCard Component', () => {
  // Helper function to create mock user profile
  const createMockProfile = (overrides?: Partial<UserProfile>): UserProfile => ({
    id: 'user-123',
    username: 'johndoe',
    displayName: 'John Doe',
    avatar: 'https://example.com/avatar.jpg',
    banner: 'https://example.com/banner.jpg',
    bio: 'Software developer and coffee enthusiast',
    location: 'San Francisco, CA',
    website: 'https://johndoe.com',
    joinDate: new Date('2023-01-15'),
    verified: false,
    premium: false,
    role: 'member',
    badges: [],
    stats: {
      posts: 150,
      comments: 320,
      likes: 1250,
      shares: 45,
      karma: 1500,
      reputation: 850,
      streak: 7,
      achievements: 12,
    },
    followers: 1234,
    following: 567,
    mutualConnections: 23,
    isFollowing: false,
    isBlocked: false,
    isMuted: false,
    isPrivate: false,
    status: 'online',
    ...overrides,
  });

  const mockCurrentUser = {
    id: 'current-user-123',
    username: 'currentuser',
  };

  describe('Rendering', () => {
    it('should render user profile card with basic information', () => {
      const profile = createMockProfile();
      render(<UserProfileCard profile={profile} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('@johndoe')).toBeInTheDocument();
      expect(screen.getByText('Software developer and coffee enthusiast')).toBeInTheDocument();
    });

    it('should render with default variant and size', () => {
      const profile = createMockProfile();
      const { container } = render(<UserProfileCard profile={profile} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('bg-card', 'border', 'border-border', 'rounded-lg');
    });

    it('should apply custom className', () => {
      const profile = createMockProfile();
      const { container } = render(
        <UserProfileCard profile={profile} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should render without banner', () => {
      const profile = createMockProfile({ banner: undefined });
      const { container } = render(<UserProfileCard profile={profile} />);

      const banner = container.querySelector('.h-24');
      expect(banner).not.toBeInTheDocument();
    });

    it('should render with banner', () => {
      const profile = createMockProfile({ banner: 'https://example.com/banner.jpg' });
      const { container } = render(<UserProfileCard profile={profile} />);

      const banner = container.querySelector('.h-24');
      expect(banner).toBeInTheDocument();
    });
  });

  describe('User Avatar', () => {
    it('should render avatar with image', () => {
      const profile = createMockProfile();
      render(<UserProfileCard profile={profile} />);

      const avatar = screen.getByAltText('John Doe');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('should render avatar fallback when no image provided', () => {
      const profile = createMockProfile({ avatar: undefined });
      render(<UserProfileCard profile={profile} />);

      expect(screen.getByText('J')).toBeInTheDocument(); // First letter of displayName
    });

    it('should be clickable and trigger onViewProfile', async () => {
      const onViewProfile = vi.fn();
      const profile = createMockProfile();
      render(<UserProfileCard profile={profile} onViewProfile={onViewProfile} />);

      const avatarButton = screen.getByRole('button', { name: /john doe/i });
      await userEvent.click(avatarButton);

      expect(onViewProfile).toHaveBeenCalledTimes(1);
    });
  });

  describe('Username and Display Name', () => {
    it('should render display name', () => {
      const profile = createMockProfile({ displayName: 'Jane Smith' });
      render(<UserProfileCard profile={profile} />);

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should render username with @ prefix', () => {
      const profile = createMockProfile({ username: 'janesmith' });
      render(<UserProfileCard profile={profile} />);

      expect(screen.getByText('@janesmith')).toBeInTheDocument();
    });

    it('should truncate long display names', () => {
      const profile = createMockProfile({
        displayName: 'This is a very long display name that should be truncated',
      });
      const { container } = render(<UserProfileCard profile={profile} />);

      const displayName = container.querySelector('.truncate');
      expect(displayName).toBeInTheDocument();
    });
  });

  describe('Bio/Description', () => {
    it('should render bio text', () => {
      const profile = createMockProfile({ bio: 'Love coding and hiking!' });
      render(<UserProfileCard profile={profile} />);

      expect(screen.getByText('Love coding and hiking!')).toBeInTheDocument();
    });

    it('should not render bio section when bio is undefined', () => {
      const profile = createMockProfile({ bio: undefined });
      render(<UserProfileCard profile={profile} />);

      const bioText = screen.queryByText('Software developer');
      expect(bioText).not.toBeInTheDocument();
    });

    it('should preserve line breaks in bio', () => {
      const profile = createMockProfile({ bio: 'Line 1\nLine 2\nLine 3' });
      const { container } = render(<UserProfileCard profile={profile} />);

      const bioElement = container.querySelector('.whitespace-pre-wrap');
      expect(bioElement).toBeInTheDocument();
      expect(bioElement).toHaveTextContent('Line 1\nLine 2\nLine 3');
    });
  });

  describe('Follow Button', () => {
    it('should render Follow button when not following', () => {
      const profile = createMockProfile({ isFollowing: false });
      render(<UserProfileCard profile={profile} currentUser={mockCurrentUser} />);

      expect(screen.getByText('Follow')).toBeInTheDocument();
      expect(screen.getByTestId('userplus-icon')).toBeInTheDocument();
    });

    it('should render Unfollow button when following', () => {
      const profile = createMockProfile({ isFollowing: true });
      render(<UserProfileCard profile={profile} currentUser={mockCurrentUser} />);

      expect(screen.getByText('Unfollow')).toBeInTheDocument();
      expect(screen.getByTestId('userminus-icon')).toBeInTheDocument();
    });

    it('should call onFollow when Follow button is clicked', async () => {
      const onFollow = vi.fn();
      const profile = createMockProfile({ isFollowing: false });
      render(
        <UserProfileCard
          profile={profile}
          currentUser={mockCurrentUser}
          onFollow={onFollow}
        />
      );

      const followButton = screen.getByText('Follow');
      await userEvent.click(followButton);

      expect(onFollow).toHaveBeenCalledTimes(1);
    });

    it('should call onUnfollow when Unfollow button is clicked', async () => {
      const onUnfollow = vi.fn();
      const profile = createMockProfile({ isFollowing: true });
      render(
        <UserProfileCard
          profile={profile}
          currentUser={mockCurrentUser}
          onUnfollow={onUnfollow}
        />
      );

      const unfollowButton = screen.getByText('Unfollow');
      await userEvent.click(unfollowButton);

      expect(onUnfollow).toHaveBeenCalledTimes(1);
    });

    it('should not render Follow button when allowFollows is false', () => {
      const profile = createMockProfile({
        preferences: { allowFollows: false },
      });
      render(<UserProfileCard profile={profile} currentUser={mockCurrentUser} />);

      expect(screen.queryByText('Follow')).not.toBeInTheDocument();
    });
  });

  describe('Stats (followers, following, posts)', () => {
    it('should render followers count', () => {
      const profile = createMockProfile({ followers: 1234 });
      render(<UserProfileCard profile={profile} />);

      expect(screen.getByText('1.2K')).toBeInTheDocument();
      expect(screen.getByText('Followers')).toBeInTheDocument();
    });

    it('should render following count', () => {
      const profile = createMockProfile({ following: 567 });
      render(<UserProfileCard profile={profile} />);

      expect(screen.getByText('567')).toBeInTheDocument();
      expect(screen.getByText('Following')).toBeInTheDocument();
    });

    it('should render mutual connections', () => {
      const profile = createMockProfile({ mutualConnections: 23 });
      render(<UserProfileCard profile={profile} />);

      expect(screen.getByText('23 mutual')).toBeInTheDocument();
    });

    it('should not render mutual connections when zero', () => {
      const profile = createMockProfile({ mutualConnections: 0 });
      render(<UserProfileCard profile={profile} />);

      expect(screen.queryByText(/mutual/)).not.toBeInTheDocument();
    });

    it('should render detailed stats when showStats and detailed are true', () => {
      const profile = createMockProfile();
      render(<UserProfileCard profile={profile} showStats={true} detailed={true} />);

      expect(screen.getByText('Posts')).toBeInTheDocument();
      expect(screen.getByText('Likes')).toBeInTheDocument();
      expect(screen.getByText('Comments')).toBeInTheDocument();
      expect(screen.getByText('Karma')).toBeInTheDocument();
    });

    it('should not render detailed stats when showStats is false', () => {
      const profile = createMockProfile();
      render(<UserProfileCard profile={profile} showStats={false} detailed={true} />);

      expect(screen.queryByText('Posts')).not.toBeInTheDocument();
    });

    it('should format large numbers correctly', () => {
      const profile = createMockProfile({ followers: 1500000 });
      render(<UserProfileCard profile={profile} />);

      expect(screen.getByText('1.5M')).toBeInTheDocument();
    });
  });

  describe('Profile Link Navigation', () => {
    it('should call onViewProfile when clicking followers', async () => {
      const onViewProfile = vi.fn();
      const profile = createMockProfile();
      render(<UserProfileCard profile={profile} onViewProfile={onViewProfile} />);

      const followersButton = screen.getByRole('button', { name: /1.2K Followers/i });
      await userEvent.click(followersButton);

      expect(onViewProfile).toHaveBeenCalledTimes(1);
    });

    it('should call onViewProfile when clicking following', async () => {
      const onViewProfile = vi.fn();
      const profile = createMockProfile();
      render(<UserProfileCard profile={profile} onViewProfile={onViewProfile} />);

      const followingButton = screen.getByRole('button', { name: /567 Following/i });
      await userEvent.click(followingButton);

      expect(onViewProfile).toHaveBeenCalledTimes(1);
    });
  });

  describe('Badge/Verification Display', () => {
    it('should display verification badge when verified', () => {
      const profile = createMockProfile({ verified: true });
      render(<UserProfileCard profile={profile} />);

      expect(screen.getByTestId('badge-icon')).toBeInTheDocument();
    });

    it('should not display verification badge when not verified', () => {
      const profile = createMockProfile({ verified: false });
      render(<UserProfileCard profile={profile} />);

      expect(screen.queryByTestId('badge-icon')).not.toBeInTheDocument();
    });

    it('should display premium badge when premium', () => {
      const profile = createMockProfile({ premium: true });
      const { container } = render(<UserProfileCard profile={profile} />);

      expect(screen.getAllByTestId('crown-icon')).toHaveLength(1); // Premium crown on avatar
    });

    it('should display admin role badge', () => {
      const profile = createMockProfile({ role: 'admin' });
      render(<UserProfileCard profile={profile} />);

      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.getByTestId('crown-icon')).toBeInTheDocument();
    });

    it('should display moderator role badge', () => {
      const profile = createMockProfile({ role: 'moderator' });
      render(<UserProfileCard profile={profile} />);

      expect(screen.getByText('Moderator')).toBeInTheDocument();
      expect(screen.getByTestId('shield-icon')).toBeInTheDocument();
    });

    it('should not display role badge for members', () => {
      const profile = createMockProfile({ role: 'member' });
      render(<UserProfileCard profile={profile} />);

      expect(screen.queryByText('Member')).not.toBeInTheDocument();
    });

    it('should display user badges', () => {
      const badges: UserBadge[] = [
        {
          id: 'badge-1',
          name: 'Early Adopter',
          description: 'Joined in the first month',
          icon: '🎖️',
          color: 'blue',
          rarity: 'legendary',
          earnedAt: new Date('2023-01-15'),
        },
        {
          id: 'badge-2',
          name: 'Top Contributor',
          description: '100+ contributions',
          icon: '⭐',
          color: 'gold',
          rarity: 'epic',
          earnedAt: new Date('2023-03-20'),
        },
      ];

      const profile = createMockProfile({ badges });
      render(<UserProfileCard profile={profile} showBadges={true} />);

      expect(screen.getByText('Early Adopter')).toBeInTheDocument();
      expect(screen.getByText('Top Contributor')).toBeInTheDocument();
    });

    it('should limit displayed badges to 3 by default', () => {
      const badges: UserBadge[] = [
        {
          id: 'badge-1',
          name: 'Badge 1',
          description: 'Badge 1',
          icon: '🎖️',
          color: 'blue',
          rarity: 'legendary',
          earnedAt: new Date(),
        },
        {
          id: 'badge-2',
          name: 'Badge 2',
          description: 'Badge 2',
          icon: '🎖️',
          color: 'blue',
          rarity: 'epic',
          earnedAt: new Date(),
        },
        {
          id: 'badge-3',
          name: 'Badge 3',
          description: 'Badge 3',
          icon: '🎖️',
          color: 'blue',
          rarity: 'rare',
          earnedAt: new Date(),
        },
        {
          id: 'badge-4',
          name: 'Badge 4',
          description: 'Badge 4',
          icon: '🎖️',
          color: 'blue',
          earnedAt: new Date(),
        },
      ];

      const profile = createMockProfile({ badges });
      render(<UserProfileCard profile={profile} showBadges={true} />);

      expect(screen.getByText('Badge 1')).toBeInTheDocument();
      expect(screen.getByText('Badge 2')).toBeInTheDocument();
      expect(screen.getByText('Badge 3')).toBeInTheDocument();
      expect(screen.getByText('+1 more')).toBeInTheDocument();
    });

    it('should not display badges when showBadges is false', () => {
      const badges: UserBadge[] = [
        {
          id: 'badge-1',
          name: 'Test Badge',
          description: 'Test',
          icon: '🎖️',
          color: 'blue',
          earnedAt: new Date(),
        },
      ];

      const profile = createMockProfile({ badges });
      render(<UserProfileCard profile={profile} showBadges={false} />);

      expect(screen.queryByText('Test Badge')).not.toBeInTheDocument();
    });
  });

  describe('Status Indicator', () => {
    it('should display online status', () => {
      const profile = createMockProfile({ status: 'online' });
      const { container } = render(<UserProfileCard profile={profile} />);

      const statusIndicator = container.querySelector('.bg-green-500');
      expect(statusIndicator).toBeInTheDocument();
    });

    it('should display away status', () => {
      const profile = createMockProfile({ status: 'away' });
      const { container } = render(<UserProfileCard profile={profile} />);

      const statusIndicator = container.querySelector('.bg-yellow-500');
      expect(statusIndicator).toBeInTheDocument();
    });

    it('should display busy status', () => {
      const profile = createMockProfile({ status: 'busy' });
      const { container } = render(<UserProfileCard profile={profile} />);

      const statusIndicator = container.querySelector('.bg-red-500');
      expect(statusIndicator).toBeInTheDocument();
    });

    it('should not display offline status indicator', () => {
      const profile = createMockProfile({ status: 'offline' });
      const { container } = render(<UserProfileCard profile={profile} />);

      const statusIndicator = container.querySelector('.bg-green-500, .bg-yellow-500, .bg-red-500');
      expect(statusIndicator).not.toBeInTheDocument();
    });
  });

  describe('Message Button', () => {
    it('should render Message button', () => {
      const profile = createMockProfile();
      render(<UserProfileCard profile={profile} currentUser={mockCurrentUser} />);

      const messageButton = screen.getByTestId('message-circle-icon');
      expect(messageButton).toBeInTheDocument();
    });

    it('should call onMessage when Message button is clicked', async () => {
      const onMessage = vi.fn();
      const profile = createMockProfile();
      render(
        <UserProfileCard
          profile={profile}
          currentUser={mockCurrentUser}
          onMessage={onMessage}
        />
      );

      const messageButton = screen.getByTestId('message-circle-icon').closest('button') as HTMLElement;
      await userEvent.click(messageButton);

      expect(onMessage).toHaveBeenCalledTimes(1);
    });

    it('should not render Message button when allowMessages is false', () => {
      const profile = createMockProfile({
        preferences: { allowMessages: false },
      });
      render(<UserProfileCard profile={profile} currentUser={mockCurrentUser} />);

      const messageButton = screen.queryByTestId('message-circle-icon');
      expect(messageButton).not.toBeInTheDocument();
    });
  });

  describe('Own Profile', () => {
    it('should render Edit Profile button for own profile', () => {
      const profile = createMockProfile({ id: 'current-user-123' });
      render(
        <UserProfileCard
          profile={profile}
          currentUser={{ id: 'current-user-123', username: 'johndoe' }}
        />
      );

      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
    });

    it('should call onEdit when Edit Profile button is clicked', async () => {
      const onEdit = vi.fn();
      const profile = createMockProfile({ id: 'current-user-123' });
      render(
        <UserProfileCard
          profile={profile}
          currentUser={{ id: 'current-user-123', username: 'johndoe' }}
          onEdit={onEdit}
        />
      );

      const editButton = screen.getByText('Edit Profile');
      await userEvent.click(editButton);

      expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it('should not render Follow/Message buttons for own profile', () => {
      const profile = createMockProfile({ id: 'current-user-123' });
      render(
        <UserProfileCard
          profile={profile}
          currentUser={{ id: 'current-user-123', username: 'johndoe' }}
        />
      );

      expect(screen.queryByText('Follow')).not.toBeInTheDocument();
      expect(screen.queryByTestId('message-circle-icon')).not.toBeInTheDocument();
    });
  });

  describe('Action Menu', () => {
    it('should render options menu button', () => {
      const profile = createMockProfile();
      render(<UserProfileCard profile={profile} currentUser={mockCurrentUser} />);

      expect(screen.getByTestId('morehorizontal-icon')).toBeInTheDocument();
    });

    it('should render Block option in menu', () => {
      const profile = createMockProfile({ isBlocked: false });
      render(<UserProfileCard profile={profile} currentUser={mockCurrentUser} />);

      expect(screen.getByText('Block User')).toBeInTheDocument();
    });

    it('should render Unblock option when user is blocked', () => {
      const profile = createMockProfile({ isBlocked: true });
      render(<UserProfileCard profile={profile} currentUser={mockCurrentUser} />);

      expect(screen.getByText('Unblock User')).toBeInTheDocument();
    });

    it('should render Report option in menu', () => {
      const profile = createMockProfile();
      render(<UserProfileCard profile={profile} currentUser={mockCurrentUser} />);

      expect(screen.getByText('Report User')).toBeInTheDocument();
    });

    it('should call onBlock when Block is clicked', async () => {
      const onBlock = vi.fn();
      const profile = createMockProfile();
      render(
        <UserProfileCard
          profile={profile}
          currentUser={mockCurrentUser}
          onBlock={onBlock}
        />
      );

      const blockButton = screen.getByText('Block User');
      await userEvent.click(blockButton);

      expect(onBlock).toHaveBeenCalledTimes(1);
    });

    it('should call onReport when Report is clicked', async () => {
      const onReport = vi.fn();
      const profile = createMockProfile();
      render(
        <UserProfileCard
          profile={profile}
          currentUser={mockCurrentUser}
          onReport={onReport}
        />
      );

      const reportButton = screen.getByText('Report User');
      await userEvent.click(reportButton);

      expect(onReport).toHaveBeenCalledTimes(1);
    });
  });

  describe('Metadata Display', () => {
    it('should render location when provided', () => {
      const profile = createMockProfile({ location: 'New York, NY' });
      render(<UserProfileCard profile={profile} />);

      expect(screen.getByText('New York, NY')).toBeInTheDocument();
      expect(screen.getByTestId('mappin-icon')).toBeInTheDocument();
    });

    it('should not render location when not provided', () => {
      const profile = createMockProfile({ location: undefined });
      render(<UserProfileCard profile={profile} />);

      expect(screen.queryByTestId('mappin-icon')).not.toBeInTheDocument();
    });

    it('should render website with link', () => {
      const profile = createMockProfile({ website: 'https://example.com' });
      render(<UserProfileCard profile={profile} />);

      const websiteLink = screen.getByRole('link', { name: /example.com/i });
      expect(websiteLink).toBeInTheDocument();
      expect(websiteLink).toHaveAttribute('href', 'https://example.com');
      expect(websiteLink).toHaveAttribute('target', '_blank');
    });

    it('should render join date', () => {
      const profile = createMockProfile({ joinDate: new Date('2023-01-15') });
      render(<UserProfileCard profile={profile} />);

      expect(screen.getByText(/Joined January 2023/i)).toBeInTheDocument();
      expect(screen.getByTestId('calendar-icon')).toBeInTheDocument();
    });

    it('should render last active time when detailed is true', () => {
      const profile = createMockProfile({
        lastActive: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      });
      render(<UserProfileCard profile={profile} detailed={true} />);

      expect(screen.getByText(/Active 5m ago/i)).toBeInTheDocument();
    });
  });

  describe('Social Links', () => {
    it('should render social links when provided', () => {
      const profile = createMockProfile({
        social: {
          twitter: 'https://twitter.com/johndoe',
          github: 'https://github.com/johndoe',
        },
      });
      render(<UserProfileCard profile={profile} showSocial={true} />);

      const socialLinks = screen.getAllByRole('link');
      const socialLinksFiltered = socialLinks.filter(
        (link) => link.getAttribute('href')?.includes('twitter') || link.getAttribute('href')?.includes('github')
      );
      expect(socialLinksFiltered.length).toBeGreaterThan(0);
    });

    it('should not render social links when showSocial is false', () => {
      const profile = createMockProfile({
        social: {
          twitter: 'https://twitter.com/johndoe',
        },
      });
      const { container } = render(
        <UserProfileCard profile={profile} showSocial={false} />
      );

      const socialLink = container.querySelector('a[href*="twitter"]');
      expect(socialLink).not.toBeInTheDocument();
    });

    it('should render custom social links', () => {
      const profile = createMockProfile({
        social: {
          custom: [
            { name: 'Portfolio', url: 'https://portfolio.com' },
          ],
        },
      });
      render(<UserProfileCard profile={profile} showSocial={true} />);

      const customLink = screen.getByRole('link', { name: /Portfolio/i });
      expect(customLink).toBeInTheDocument();
      expect(customLink).toHaveAttribute('href', 'https://portfolio.com');
    });
  });

  describe('Variants', () => {
    it('should apply default variant styles', () => {
      const profile = createMockProfile();
      const { container } = render(
        <UserProfileCard profile={profile} variant="default" />
      );

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('shadow-sm', 'hover:shadow-md');
    });

    it('should apply compact variant styles', () => {
      const profile = createMockProfile();
      const { container } = render(
        <UserProfileCard profile={profile} variant="compact" />
      );

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('shadow-sm');
    });

    it('should apply detailed variant styles', () => {
      const profile = createMockProfile();
      const { container } = render(
        <UserProfileCard profile={profile} variant="detailed" />
      );

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('shadow-md');
    });

    it('should apply modal variant styles', () => {
      const profile = createMockProfile();
      const { container } = render(
        <UserProfileCard profile={profile} variant="modal" />
      );

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('shadow-xl', 'max-w-2xl');
    });
  });

  describe('Sizes', () => {
    it('should apply default size', () => {
      const profile = createMockProfile();
      const { container } = render(<UserProfileCard profile={profile} size="default" />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('max-w-md');
    });

    it('should apply small size', () => {
      const profile = createMockProfile();
      const { container } = render(<UserProfileCard profile={profile} size="sm" />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('max-w-sm');
    });

    it('should apply large size', () => {
      const profile = createMockProfile();
      const { container } = render(<UserProfileCard profile={profile} size="lg" />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('max-w-lg');
    });

    it('should apply full width', () => {
      const profile = createMockProfile();
      const { container } = render(<UserProfileCard profile={profile} size="full" />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('w-full');
    });
  });

  describe('Action Visibility', () => {
    it('should not render actions when showActions is false', () => {
      const profile = createMockProfile();
      render(
        <UserProfileCard
          profile={profile}
          currentUser={mockCurrentUser}
          showActions={false}
        />
      );

      expect(screen.queryByText('Follow')).not.toBeInTheDocument();
      expect(screen.queryByTestId('message-circle-icon')).not.toBeInTheDocument();
    });

    it('should render actions when showActions is true', () => {
      const profile = createMockProfile();
      render(
        <UserProfileCard
          profile={profile}
          currentUser={mockCurrentUser}
          showActions={true}
        />
      );

      expect(screen.getByText('Follow')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible avatar button', () => {
      const profile = createMockProfile();
      render(<UserProfileCard profile={profile} />);

      const avatarButton = screen.getByRole('button', { name: /john doe/i });
      expect(avatarButton).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-ring');
    });

    it('should have accessible action buttons', () => {
      const profile = createMockProfile();
      render(<UserProfileCard profile={profile} currentUser={mockCurrentUser} />);

      const followButton = screen.getByRole('button', { name: /follow/i });
      expect(followButton).toBeInTheDocument();
    });

    it('should have aria-label for more options button', () => {
      const profile = createMockProfile();
      render(<UserProfileCard profile={profile} currentUser={mockCurrentUser} />);

      const optionsButton = screen.getByLabelText('More options');
      expect(optionsButton).toBeInTheDocument();
    });

    it('should have accessible external links', () => {
      const profile = createMockProfile({ website: 'https://example.com' });
      render(<UserProfileCard profile={profile} />);

      const websiteLink = screen.getByRole('link', { name: /example.com/i });
      expect(websiteLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should have clickable follower/following counts', () => {
      const profile = createMockProfile();
      render(<UserProfileCard profile={profile} />);

      const followersButton = screen.getByRole('button', { name: /1.2K Followers/i });
      const followingButton = screen.getByRole('button', { name: /567 Following/i });

      expect(followersButton).toHaveClass('hover:underline');
      expect(followingButton).toHaveClass('hover:underline');
    });

    it('should have alt text for banner image', () => {
      const profile = createMockProfile({ banner: 'https://example.com/banner.jpg' });
      render(<UserProfileCard profile={profile} />);

      const banner = screen.getByAltText("John Doe's banner");
      expect(banner).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero stats gracefully', () => {
      const profile = createMockProfile({
        stats: {
          posts: 0,
          comments: 0,
          likes: 0,
          shares: 0,
          karma: 0,
          reputation: 0,
        },
        followers: 0,
        following: 0,
      });
      render(<UserProfileCard profile={profile} showStats={true} detailed={true} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle missing optional fields', () => {
      const profile = createMockProfile({
        avatar: undefined,
        banner: undefined,
        bio: undefined,
        location: undefined,
        website: undefined,
        badges: undefined,
        social: undefined,
        mutualConnections: undefined,
      });

      const { container } = render(<UserProfileCard profile={profile} />);
      expect(container).toBeInTheDocument();
    });

    it('should handle very long bio text', () => {
      const longBio = 'Lorem ipsum dolor sit amet, '.repeat(50);
      const profile = createMockProfile({ bio: longBio });
      const { container } = render(<UserProfileCard profile={profile} />);

      const bioElement = container.querySelector('.break-words');
      expect(bioElement).toBeInTheDocument();
    });

    it('should handle private profiles', () => {
      const profile = createMockProfile({ isPrivate: true });
      render(<UserProfileCard profile={profile} currentUser={mockCurrentUser} />);

      // Private profiles should still render basic information
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });
});

describe('ProfileAvatar Component', () => {
  it('should render with image source', () => {
    render(
      <ProfileAvatar
        src="https://example.com/avatar.jpg"
        alt="Test User"
        size="default"
      />
    );

    const avatar = screen.getByAltText('Test User');
    expect(avatar).toBeInTheDocument();
  });

  it('should render fallback initial when no image', () => {
    render(<ProfileAvatar alt="Test User" size="default" />);

    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('should apply different sizes', () => {
    const { rerender, container } = render(
      <ProfileAvatar alt="User" size="sm" />
    );

    let button = container.querySelector('button');
    expect(button).toHaveClass('h-12', 'w-12');

    rerender(<ProfileAvatar alt="User" size="lg" />);
    button = container.querySelector('button');
    expect(button).toHaveClass('h-20', 'w-20');

    rerender(<ProfileAvatar alt="User" size="xl" />);
    button = container.querySelector('button');
    expect(button).toHaveClass('h-24', 'w-24');
  });

  it('should display verification badge', () => {
    render(<ProfileAvatar alt="User" verified={true} />);

    expect(screen.getByTestId('badge-icon')).toBeInTheDocument();
  });

  it('should display premium badge', () => {
    render(<ProfileAvatar alt="User" premium={true} />);

    expect(screen.getByTestId('crown-icon')).toBeInTheDocument();
  });

  it('should display status indicator', () => {
    const { container } = render(<ProfileAvatar alt="User" status="online" />);

    const statusIndicator = container.querySelector('.bg-green-500');
    expect(statusIndicator).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<ProfileAvatar alt="User" onClick={onClick} />);

    const button = screen.getByRole('button');
    await userEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('StatusIndicator Component', () => {
  it('should render online status', () => {
    const { container } = render(<StatusIndicator status="online" />);

    const indicator = container.querySelector('.bg-green-500');
    expect(indicator).toBeInTheDocument();
  });

  it('should render away status', () => {
    const { container } = render(<StatusIndicator status="away" />);

    const indicator = container.querySelector('.bg-yellow-500');
    expect(indicator).toBeInTheDocument();
  });

  it('should render busy status', () => {
    const { container } = render(<StatusIndicator status="busy" />);

    const indicator = container.querySelector('.bg-red-500');
    expect(indicator).toBeInTheDocument();
  });

  it('should render offline status', () => {
    const { container } = render(<StatusIndicator status="offline" />);

    const indicator = container.querySelector('.bg-gray-400');
    expect(indicator).toBeInTheDocument();
  });

  it('should apply different sizes', () => {
    const { container, rerender } = render(<StatusIndicator status="online" size="sm" />);

    let indicator = container.querySelector('.w-2');
    expect(indicator).toBeInTheDocument();

    rerender(<StatusIndicator status="online" size="lg" />);
    indicator = container.querySelector('.w-4');
    expect(indicator).toBeInTheDocument();
  });
});

describe('RoleBadge Component', () => {
  it('should render admin badge', () => {
    render(<RoleBadge role="admin" />);

    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByTestId('crown-icon')).toBeInTheDocument();
  });

  it('should render moderator badge', () => {
    render(<RoleBadge role="moderator" />);

    expect(screen.getByText('Moderator')).toBeInTheDocument();
    expect(screen.getByTestId('shield-icon')).toBeInTheDocument();
  });

  it('should not render for member role', () => {
    const { container } = render(<RoleBadge role="member" />);

    expect(container.firstChild).toBeNull();
  });

  it('should not render when role is undefined', () => {
    const { container } = render(<RoleBadge />);

    expect(container.firstChild).toBeNull();
  });
});

describe('ProfileStats Component', () => {
  const mockStats: UserStats = {
    posts: 150,
    comments: 320,
    likes: 1250,
    shares: 45,
    karma: 1500,
    reputation: 850,
  };

  it('should render all stats in detailed view', () => {
    render(<ProfileStats stats={mockStats} compact={false} />);

    expect(screen.getByText('Posts')).toBeInTheDocument();
    expect(screen.getByText('Likes')).toBeInTheDocument();
    expect(screen.getByText('Comments')).toBeInTheDocument();
    expect(screen.getByText('Karma')).toBeInTheDocument();
  });

  it('should render limited stats in compact view', () => {
    render(<ProfileStats stats={mockStats} compact={true} />);

    expect(screen.getByText('Posts')).toBeInTheDocument();
    expect(screen.getByText('Likes')).toBeInTheDocument();
    expect(screen.getByText('Comments')).toBeInTheDocument();
    // Karma should not be visible in compact mode (only first 3)
  });

  it('should format numbers correctly', () => {
    const largeStats: UserStats = {
      posts: 1500,
      comments: 3200,
      likes: 12500,
      shares: 450,
      karma: 150000,
      reputation: 8500,
    };

    render(<ProfileStats stats={largeStats} compact={false} />);

    expect(screen.getByText('1.5K')).toBeInTheDocument();
    expect(screen.getByText('150.0K')).toBeInTheDocument();
  });
});
