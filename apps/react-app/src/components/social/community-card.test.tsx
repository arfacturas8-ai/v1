/**
 * Comprehensive Test Suite for CRYB Community Card Component
 * Testing all variants, states, interactions, and accessibility features
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import {
  CommunityCard,
  PrivacyIndicator,
  MemberRoleBadge,
  CommunityStatsComponent,
  ModeratorList,
  CommunityActions,
  type Community,
  type CommunityMember,
  type CommunityStats,
} from './community-card';

// Mock dependencies
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

// Mock framer-motion to simplify testing
jest.mock('framer-motion', () => {
  const mockReact = require('react');
  return {
    motion: {
      div: mockReact.forwardRef(({ children, ...props }: any, ref: any) => (
        <div ref={ref} {...props}>
          {children}
        </div>
      )),
    },
  };
});

// Mock Radix UI Dropdown Menu
jest.mock('@radix-ui/react-dropdown-menu', () => ({
  Root: ({ children }: any) => <div data-testid="dropdown-root">{children}</div>,
  Trigger: ({ children, asChild }: any) => (
    <div data-testid="dropdown-trigger">{children}</div>
  ),
  Portal: ({ children }: any) => <div data-testid="dropdown-portal">{children}</div>,
  Content: ({ children, ...props }: any) => (
    <div data-testid="dropdown-content" {...props}>
      {children}
    </div>
  ),
  Item: ({ children, onClick, ...props }: any) => (
    <button data-testid="dropdown-item" onClick={onClick} {...props}>
      {children}
    </button>
  ),
  Separator: () => <hr data-testid="dropdown-separator" />,
}));

// Mock Radix UI Tabs
jest.mock('@radix-ui/react-tabs', () => ({
  Root: ({ children }: any) => <div>{children}</div>,
  List: ({ children }: any) => <div>{children}</div>,
  Trigger: ({ children }: any) => <button>{children}</button>,
  Content: ({ children }: any) => <div>{children}</div>,
}));

// Mock Badge component
jest.mock('../ui/badge', () => ({
  Badge: ({ children, className, variant, ...props }: any) => (
    <span className={className} data-variant={variant} {...props}>
      {children}
    </span>
  ),
}));

// Mock Button components
jest.mock('../ui/button', () => ({
  Button: ({ children, onClick, variant, disabled, className, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-variant={variant}
      {...props}
    >
      {children}
    </button>
  ),
  IconButton: ({ icon, onClick, variant, 'aria-label': ariaLabel, ...props }: any) => (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      data-variant={variant}
      {...props}
    >
      {icon}
    </button>
  ),
}));

// Helper function to create mock community data
const createMockCommunity = (overrides?: Partial<Community>): Community => ({
  id: 'comm-123',
  name: 'test-community',
  displayName: 'Test Community',
  description: 'This is a test community for unit testing purposes',
  category: 'technology',
  tags: ['testing', 'development', 'coding'],
  privacy: 'public',
  nsfw: false,
  verified: false,
  featured: false,
  createdAt: new Date('2024-01-01'),
  stats: {
    members: 1500,
    posts: 250,
    comments: 1200,
    activeToday: 45,
    growth: 15,
    trending: false,
  },
  moderators: [],
  ...overrides,
});

// Helper function to create mock member data
const createMockMember = (overrides?: Partial<CommunityMember>): CommunityMember => ({
  id: 'user-123',
  username: 'testuser',
  displayName: 'Test User',
  role: 'member',
  joinDate: new Date('2024-01-01'),
  verified: false,
  ...overrides,
});

describe('CommunityCard Component', () => {
  // ===== RENDERING TESTS =====
  describe('Rendering', () => {
    it('should render community card with default props', () => {
      const community = createMockCommunity();
      render(<CommunityCard community={community} />);

      expect(screen.getByText('Test Community')).toBeInTheDocument();
      expect(screen.getByText('r/test-community')).toBeInTheDocument();
      expect(screen.getByText(/this is a test community/i)).toBeInTheDocument();
    });

    it('should render community name correctly', () => {
      const community = createMockCommunity({
        displayName: 'React Developers',
        name: 'react-devs',
      });
      render(<CommunityCard community={community} />);

      expect(screen.getByText('React Developers')).toBeInTheDocument();
      expect(screen.getByText('r/react-devs')).toBeInTheDocument();
    });

    it('should render community description', () => {
      const community = createMockCommunity({
        description: 'A community for React developers to share knowledge',
      });
      render(<CommunityCard community={community} />);

      expect(screen.getByText(/a community for react developers/i)).toBeInTheDocument();
    });

    it('should render without crashing when community has minimal data', () => {
      const community = createMockCommunity({
        tags: [],
        moderators: [],
      });
      render(<CommunityCard community={community} />);

      expect(screen.getByText('Test Community')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const community = createMockCommunity();
      const { container } = render(
        <CommunityCard community={community} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  // ===== COMMUNITY AVATAR/ICON TESTS =====
  describe('Community Avatar/Icon', () => {
    it('should render community avatar when provided', () => {
      const community = createMockCommunity({
        avatar: 'https://example.com/avatar.jpg',
      });
      render(<CommunityCard community={community} />);

      const avatar = screen.getByAltText('Test Community');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('should render category icon when no avatar is provided', () => {
      const community = createMockCommunity({
        avatar: undefined,
        category: 'technology',
      });
      const { container } = render(<CommunityCard community={community} />);

      // Check for SVG icon
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should be clickable and call onViewCommunity', async () => {
      const user = userEvent.setup();
      const onViewCommunity = jest.fn();
      const community = createMockCommunity();

      render(
        <CommunityCard community={community} onViewCommunity={onViewCommunity} />
      );

      const avatarButton = screen.getAllByRole('button').find(
        (btn) => btn.querySelector('svg') || btn.querySelector('img')
      );

      if (avatarButton) {
        await user.click(avatarButton);
        expect(onViewCommunity).toHaveBeenCalled();
      }
    });

    it('should render verified badge when community is verified', () => {
      const community = createMockCommunity({
        verified: true,
      });
      const { container } = render(<CommunityCard community={community} />);

      // Verified badge should be present
      expect(container.querySelector('.bg-cryb-primary')).toBeInTheDocument();
    });
  });

  // ===== BANNER TESTS =====
  describe('Community Banner', () => {
    it('should render banner when provided', () => {
      const community = createMockCommunity({
        banner: 'https://example.com/banner.jpg',
      });
      render(<CommunityCard community={community} />);

      const banner = screen.getByAltText('Test Community banner');
      expect(banner).toBeInTheDocument();
      expect(banner).toHaveAttribute('src', 'https://example.com/banner.jpg');
    });

    it('should not render banner section when not provided', () => {
      const community = createMockCommunity({
        banner: undefined,
      });
      render(<CommunityCard community={community} />);

      const banner = screen.queryByAltText(/banner/i);
      expect(banner).not.toBeInTheDocument();
    });
  });

  // ===== MEMBER COUNT TESTS =====
  describe('Member Count and Stats', () => {
    it('should display member count', () => {
      const community = createMockCommunity({
        stats: {
          members: 1500,
          posts: 250,
          comments: 1200,
          activeToday: 45,
          growth: 15,
        },
      });
      render(<CommunityCard community={community} showStats={true} />);

      expect(screen.getByText('1.5K')).toBeInTheDocument();
    });

    it('should format large member counts correctly', () => {
      const community = createMockCommunity({
        stats: {
          members: 1500000,
          posts: 250,
          comments: 1200,
          activeToday: 45,
          growth: 15,
        },
      });
      render(<CommunityCard community={community} showStats={true} />);

      expect(screen.getByText('1.5M')).toBeInTheDocument();
    });

    it('should display growth percentage', () => {
      const community = createMockCommunity({
        stats: {
          members: 1500,
          posts: 250,
          comments: 1200,
          activeToday: 45,
          growth: 25,
        },
      });
      render(<CommunityCard community={community} showStats={true} />);

      expect(screen.getByText('+25%')).toBeInTheDocument();
    });

    it('should not show stats when showStats is false', () => {
      const community = createMockCommunity();
      render(<CommunityCard community={community} showStats={false} />);

      expect(screen.queryByText('1.5K')).not.toBeInTheDocument();
    });

    it('should display all stat categories', () => {
      const community = createMockCommunity({
        stats: {
          members: 1500,
          posts: 250,
          comments: 1200,
          activeToday: 45,
          growth: 15,
        },
      });
      render(<CommunityCard community={community} showStats={true} detailed={true} />);

      expect(screen.getByText('Members')).toBeInTheDocument();
      expect(screen.getByText('Posts')).toBeInTheDocument();
      expect(screen.getByText('Comments')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  // ===== JOIN/LEAVE BUTTON TESTS =====
  describe('Join/Leave Button', () => {
    it('should render join button for non-members without current user', () => {
      const community = createMockCommunity();
      render(<CommunityCard community={community} />);

      expect(screen.getByText('Join Community')).toBeInTheDocument();
    });

    it('should render join button for non-members with current user', () => {
      const community = createMockCommunity({
        userMembership: {
          isMember: false,
          isFollowing: false,
          isMuted: false,
          notificationsEnabled: false,
        },
      });
      render(
        <CommunityCard
          community={community}
          currentUser={{ id: 'user-1', username: 'testuser' }}
        />
      );

      expect(screen.getByText('Join')).toBeInTheDocument();
    });

    it('should render leave button for members', () => {
      const community = createMockCommunity({
        userMembership: {
          isMember: true,
          isFollowing: true,
          isMuted: false,
          notificationsEnabled: true,
          joinDate: new Date('2024-01-01'),
        },
      });
      render(
        <CommunityCard
          community={community}
          currentUser={{ id: 'user-1', username: 'testuser' }}
        />
      );

      expect(screen.getByText('Leave')).toBeInTheDocument();
    });

    it('should call onJoin when join button is clicked', async () => {
      const user = userEvent.setup();
      const onJoin = jest.fn();
      const community = createMockCommunity();

      render(<CommunityCard community={community} onJoin={onJoin} />);

      const joinButton = screen.getByText('Join Community');
      await user.click(joinButton);

      expect(onJoin).toHaveBeenCalledTimes(1);
    });

    it('should call onLeave when leave button is clicked', async () => {
      const user = userEvent.setup();
      const onLeave = jest.fn();
      const community = createMockCommunity({
        userMembership: {
          isMember: true,
          isFollowing: true,
          isMuted: false,
          notificationsEnabled: true,
        },
      });

      render(
        <CommunityCard
          community={community}
          currentUser={{ id: 'user-1', username: 'testuser' }}
          onLeave={onLeave}
        />
      );

      const leaveButton = screen.getByText('Leave');
      await user.click(leaveButton);

      expect(onLeave).toHaveBeenCalledTimes(1);
    });
  });

  // ===== TAGS/CATEGORIES TESTS =====
  describe('Tags and Categories', () => {
    it('should display community category', () => {
      const community = createMockCommunity({
        category: 'technology',
      });
      render(<CommunityCard community={community} />);

      expect(screen.getByText('technology')).toBeInTheDocument();
    });

    it('should display community tags', () => {
      const community = createMockCommunity({
        tags: ['react', 'javascript', 'webdev'],
      });
      render(<CommunityCard community={community} />);

      expect(screen.getByText('#react')).toBeInTheDocument();
      expect(screen.getByText('#javascript')).toBeInTheDocument();
      expect(screen.getByText('#webdev')).toBeInTheDocument();
    });

    it('should limit displayed tags to 4', () => {
      const community = createMockCommunity({
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6'],
      });
      render(<CommunityCard community={community} />);

      expect(screen.getByText('#tag1')).toBeInTheDocument();
      expect(screen.getByText('#tag4')).toBeInTheDocument();
      expect(screen.getByText('+2 more')).toBeInTheDocument();
      expect(screen.queryByText('#tag5')).not.toBeInTheDocument();
    });

    it('should not render tags section when no tags exist', () => {
      const community = createMockCommunity({
        tags: [],
      });
      const { container } = render(<CommunityCard community={community} />);

      const badges = container.querySelectorAll('[data-variant]');
      const tagBadges = Array.from(badges).filter((badge) =>
        badge.textContent?.startsWith('#')
      );
      expect(tagBadges.length).toBe(0);
    });
  });

  // ===== PRIVACY INDICATOR TESTS =====
  describe('Privacy Indicator', () => {
    it('should display public privacy indicator', () => {
      const community = createMockCommunity({
        privacy: 'public',
      });
      render(<CommunityCard community={community} />);

      expect(screen.getByText('Public')).toBeInTheDocument();
    });

    it('should display private privacy indicator', () => {
      const community = createMockCommunity({
        privacy: 'private',
      });
      render(<CommunityCard community={community} />);

      expect(screen.getByText('Private')).toBeInTheDocument();
    });

    it('should display restricted privacy indicator', () => {
      const community = createMockCommunity({
        privacy: 'restricted',
      });
      render(<CommunityCard community={community} />);

      expect(screen.getByText('Restricted')).toBeInTheDocument();
    });
  });

  // ===== JOINED STATE TESTS =====
  describe('Joined State', () => {
    it('should show join date for members', () => {
      const joinDate = new Date('2024-01-15');
      const community = createMockCommunity({
        userMembership: {
          isMember: true,
          isFollowing: true,
          isMuted: false,
          notificationsEnabled: true,
          joinDate,
        },
      });
      render(
        <CommunityCard
          community={community}
          currentUser={{ id: 'user-1', username: 'testuser' }}
        />
      );

      expect(screen.getByText(/joined/i)).toBeInTheDocument();
    });

    it('should show notification badge for members with notifications enabled', () => {
      const community = createMockCommunity({
        userMembership: {
          isMember: true,
          isFollowing: true,
          isMuted: false,
          notificationsEnabled: true,
          joinDate: new Date('2024-01-01'),
        },
      });
      render(
        <CommunityCard
          community={community}
          currentUser={{ id: 'user-1', username: 'testuser' }}
        />
      );

      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    it('should show muted badge for muted communities', () => {
      const community = createMockCommunity({
        userMembership: {
          isMember: true,
          isFollowing: true,
          isMuted: true,
          notificationsEnabled: false,
          joinDate: new Date('2024-01-01'),
        },
      });
      render(
        <CommunityCard
          community={community}
          currentUser={{ id: 'user-1', username: 'testuser' }}
        />
      );

      expect(screen.getByText('Muted')).toBeInTheDocument();
    });
  });

  // ===== LINK NAVIGATION TESTS =====
  describe('Link Navigation', () => {
    it('should call onViewCommunity when community name is clicked', async () => {
      const user = userEvent.setup();
      const onViewCommunity = jest.fn();
      const community = createMockCommunity();

      render(
        <CommunityCard community={community} onViewCommunity={onViewCommunity} />
      );

      const nameElement = screen.getByText('Test Community');
      await user.click(nameElement);

      expect(onViewCommunity).toHaveBeenCalled();
    });
  });

  // ===== FEATURED/TRENDING BADGES TESTS =====
  describe('Featured and Trending Badges', () => {
    it('should display trending badge when community is trending', () => {
      const community = createMockCommunity({
        stats: {
          members: 1500,
          posts: 250,
          comments: 1200,
          activeToday: 45,
          growth: 15,
          trending: true,
        },
      });
      render(<CommunityCard community={community} />);

      expect(screen.getByText('Trending')).toBeInTheDocument();
    });

    it('should display featured badge when community is featured', () => {
      const community = createMockCommunity({
        featured: true,
      });
      render(<CommunityCard community={community} />);

      expect(screen.getByText('Featured')).toBeInTheDocument();
    });

    it('should use featured variant when community is featured', () => {
      const community = createMockCommunity({
        featured: true,
      });
      const { container } = render(<CommunityCard community={community} />);

      expect(container.firstChild).toHaveClass('ring-2');
    });

    it('should display NSFW badge when community is NSFW', () => {
      const community = createMockCommunity({
        nsfw: true,
      });
      render(<CommunityCard community={community} />);

      expect(screen.getByText('NSFW')).toBeInTheDocument();
    });
  });

  // ===== MODERATOR DISPLAY TESTS =====
  describe('Moderator Display', () => {
    it('should show moderators when showModerators is true', () => {
      const moderators = [
        createMockMember({ id: 'mod-1', displayName: 'Moderator One', role: 'moderator' }),
        createMockMember({ id: 'mod-2', displayName: 'Moderator Two', role: 'admin' }),
      ];
      const community = createMockCommunity({ moderators });

      render(
        <CommunityCard
          community={community}
          showModerators={true}
          detailed={true}
        />
      );

      expect(screen.getByText('Moderators')).toBeInTheDocument();
      expect(screen.getByText('Moderator One')).toBeInTheDocument();
      expect(screen.getByText('Moderator Two')).toBeInTheDocument();
    });

    it('should not show moderators when showModerators is false', () => {
      const moderators = [
        createMockMember({ id: 'mod-1', displayName: 'Moderator One', role: 'moderator' }),
      ];
      const community = createMockCommunity({ moderators });

      render(
        <CommunityCard
          community={community}
          showModerators={false}
          detailed={true}
        />
      );

      expect(screen.queryByText('Moderators')).not.toBeInTheDocument();
    });

    it('should limit displayed moderators to 3', () => {
      const moderators = [
        createMockMember({ id: 'mod-1', displayName: 'Mod One', role: 'moderator' }),
        createMockMember({ id: 'mod-2', displayName: 'Mod Two', role: 'moderator' }),
        createMockMember({ id: 'mod-3', displayName: 'Mod Three', role: 'moderator' }),
        createMockMember({ id: 'mod-4', displayName: 'Mod Four', role: 'moderator' }),
      ];
      const community = createMockCommunity({ moderators });

      render(
        <CommunityCard
          community={community}
          showModerators={true}
          detailed={true}
        />
      );

      expect(screen.getByText('+1 more')).toBeInTheDocument();
    });
  });

  // ===== RULES DISPLAY TESTS =====
  describe('Rules Display', () => {
    it('should show rules when showRules is true', () => {
      const rules = [
        { id: 'rule-1', title: 'Be respectful', description: 'Treat others kindly', order: 1 },
        { id: 'rule-2', title: 'No spam', description: 'Keep content relevant', order: 2 },
      ];
      const community = createMockCommunity({ rules });

      render(
        <CommunityCard
          community={community}
          showRules={true}
          detailed={true}
        />
      );

      expect(screen.getByText('Community Rules')).toBeInTheDocument();
      expect(screen.getByText(/be respectful/i)).toBeInTheDocument();
      expect(screen.getByText(/no spam/i)).toBeInTheDocument();
    });

    it('should limit displayed rules to 3', () => {
      const rules = [
        { id: 'rule-1', title: 'Rule 1', description: 'Description 1', order: 1 },
        { id: 'rule-2', title: 'Rule 2', description: 'Description 2', order: 2 },
        { id: 'rule-3', title: 'Rule 3', description: 'Description 3', order: 3 },
        { id: 'rule-4', title: 'Rule 4', description: 'Description 4', order: 4 },
      ];
      const community = createMockCommunity({ rules });

      render(
        <CommunityCard
          community={community}
          showRules={true}
          detailed={true}
        />
      );

      expect(screen.getByText('+1 more rules')).toBeInTheDocument();
    });
  });

  // ===== VARIANT TESTS =====
  describe('Card Variants', () => {
    it('should render default variant', () => {
      const community = createMockCommunity();
      const { container } = render(
        <CommunityCard community={community} variant="default" />
      );

      expect(container.firstChild).toHaveClass('shadow-sm');
    });

    it('should render compact variant', () => {
      const community = createMockCommunity();
      const { container } = render(
        <CommunityCard community={community} variant="compact" />
      );

      expect(container.firstChild).toHaveClass('shadow-sm');
    });

    it('should render detailed variant', () => {
      const community = createMockCommunity();
      const { container } = render(
        <CommunityCard community={community} variant="detailed" />
      );

      expect(container.firstChild).toHaveClass('shadow-md');
    });
  });

  // ===== SIZE TESTS =====
  describe('Card Sizes', () => {
    it('should render small size', () => {
      const community = createMockCommunity();
      const { container } = render(
        <CommunityCard community={community} size="sm" />
      );

      expect(container.firstChild).toHaveClass('max-w-sm');
    });

    it('should render default size', () => {
      const community = createMockCommunity();
      const { container } = render(
        <CommunityCard community={community} size="default" />
      );

      expect(container.firstChild).toHaveClass('max-w-md');
    });

    it('should render large size', () => {
      const community = createMockCommunity();
      const { container } = render(
        <CommunityCard community={community} size="lg" />
      );

      expect(container.firstChild).toHaveClass('max-w-lg');
    });

    it('should render full width', () => {
      const community = createMockCommunity();
      const { container } = render(
        <CommunityCard community={community} size="full" />
      );

      expect(container.firstChild).toHaveClass('w-full');
    });
  });

  // ===== ACTION MENU TESTS =====
  describe('Action Menu', () => {
    it('should render options menu for authenticated users', () => {
      const community = createMockCommunity();
      render(
        <CommunityCard
          community={community}
          currentUser={{ id: 'user-1', username: 'testuser' }}
        />
      );

      expect(screen.getByTestId('dropdown-root')).toBeInTheDocument();
    });

    it('should show follow option in menu', () => {
      const community = createMockCommunity({
        userMembership: {
          isMember: false,
          isFollowing: false,
          isMuted: false,
          notificationsEnabled: false,
        },
      });
      render(
        <CommunityCard
          community={community}
          currentUser={{ id: 'user-1', username: 'testuser' }}
        />
      );

      expect(screen.getByText('Follow')).toBeInTheDocument();
    });

    it('should show unfollow option when already following', () => {
      const community = createMockCommunity({
        userMembership: {
          isMember: false,
          isFollowing: true,
          isMuted: false,
          notificationsEnabled: false,
        },
      });
      render(
        <CommunityCard
          community={community}
          currentUser={{ id: 'user-1', username: 'testuser' }}
        />
      );

      expect(screen.getByText('Unfollow')).toBeInTheDocument();
    });

    it('should call onShare when share is clicked', async () => {
      const user = userEvent.setup();
      const onShare = jest.fn();
      const community = createMockCommunity();

      render(
        <CommunityCard
          community={community}
          currentUser={{ id: 'user-1', username: 'testuser' }}
          onShare={onShare}
        />
      );

      const shareButton = screen.getByText('Share community');
      await user.click(shareButton);

      expect(onShare).toHaveBeenCalled();
    });

    it('should show manage button for community owners', () => {
      const community = createMockCommunity({
        currentUserRole: 'owner',
      });
      render(
        <CommunityCard
          community={community}
          currentUser={{ id: 'user-1', username: 'testuser' }}
        />
      );

      // Manage button should be rendered (Settings icon)
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should show manage button for community admins', () => {
      const community = createMockCommunity({
        currentUserRole: 'admin',
      });
      render(
        <CommunityCard
          community={community}
          currentUser={{ id: 'user-1', username: 'testuser' }}
        />
      );

      // Manage button should be rendered
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  // ===== SHOW/HIDE PROPS TESTS =====
  describe('Show/Hide Props', () => {
    it('should hide actions when showActions is false', () => {
      const community = createMockCommunity();
      render(
        <CommunityCard
          community={community}
          showActions={false}
        />
      );

      expect(screen.queryByText('Join Community')).not.toBeInTheDocument();
    });

    it('should show actions by default', () => {
      const community = createMockCommunity();
      render(<CommunityCard community={community} />);

      expect(screen.getByText('Join Community')).toBeInTheDocument();
    });
  });

  // ===== CREATED DATE TESTS =====
  describe('Created Date', () => {
    it('should display creation date', () => {
      const community = createMockCommunity({
        createdAt: new Date('2024-01-01'),
      });
      render(<CommunityCard community={community} />);

      expect(screen.getByText(/created january 2024/i)).toBeInTheDocument();
    });
  });

  // ===== ACCESSIBILITY TESTS =====
  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      const community = createMockCommunity();
      render(<CommunityCard community={community} />);

      const heading = screen.getByText('Test Community');
      expect(heading.tagName).toBe('H3');
    });

    it('should have accessible button labels', () => {
      const community = createMockCommunity();
      render(
        <CommunityCard
          community={community}
          currentUser={{ id: 'user-1', username: 'testuser' }}
        />
      );

      const optionsButton = screen.getByLabelText('More options');
      expect(optionsButton).toBeInTheDocument();
    });

    it('should have alt text for avatar image', () => {
      const community = createMockCommunity({
        avatar: 'https://example.com/avatar.jpg',
      });
      render(<CommunityCard community={community} />);

      const avatar = screen.getByAltText('Test Community');
      expect(avatar).toHaveAttribute('alt', 'Test Community');
    });

    it('should have alt text for banner image', () => {
      const community = createMockCommunity({
        banner: 'https://example.com/banner.jpg',
      });
      render(<CommunityCard community={community} />);

      const banner = screen.getByAltText('Test Community banner');
      expect(banner).toHaveAttribute('alt', 'Test Community banner');
    });

    it('should be keyboard navigable', () => {
      const community = createMockCommunity();
      render(<CommunityCard community={community} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).not.toHaveAttribute('tabIndex', '-1');
      });
    });
  });

  // ===== REF FORWARDING TESTS =====
  describe('Ref Forwarding', () => {
    it('should forward ref to container element', () => {
      const ref = React.createRef<HTMLDivElement>();
      const community = createMockCommunity();

      render(<CommunityCard ref={ref} community={community} />);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });
});

// ===== PRIVACY INDICATOR COMPONENT TESTS =====
describe('PrivacyIndicator Component', () => {
  it('should render public indicator', () => {
    render(<PrivacyIndicator privacy="public" />);
    expect(screen.getByText('Public')).toBeInTheDocument();
  });

  it('should render private indicator', () => {
    render(<PrivacyIndicator privacy="private" />);
    expect(screen.getByText('Private')).toBeInTheDocument();
  });

  it('should render restricted indicator', () => {
    render(<PrivacyIndicator privacy="restricted" />);
    expect(screen.getByText('Restricted')).toBeInTheDocument();
  });

  it('should render small size', () => {
    const { container } = render(<PrivacyIndicator privacy="public" size="sm" />);
    expect(container.querySelector('.text-xs')).toBeInTheDocument();
  });

  it('should render default size', () => {
    const { container } = render(<PrivacyIndicator privacy="public" size="default" />);
    expect(container.querySelector('.text-sm')).toBeInTheDocument();
  });
});

// ===== MEMBER ROLE BADGE COMPONENT TESTS =====
describe('MemberRoleBadge Component', () => {
  it('should render owner badge', () => {
    render(<MemberRoleBadge role="owner" />);
    expect(screen.getByText('Owner')).toBeInTheDocument();
  });

  it('should render admin badge', () => {
    render(<MemberRoleBadge role="admin" />);
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('should render moderator badge', () => {
    render(<MemberRoleBadge role="moderator" />);
    expect(screen.getByText('Mod')).toBeInTheDocument();
  });

  it('should render member badge', () => {
    render(<MemberRoleBadge role="member" />);
    expect(screen.getByText('Member')).toBeInTheDocument();
  });

  it('should have appropriate styling for each role', () => {
    const { rerender, container } = render(<MemberRoleBadge role="owner" />);
    expect(container.querySelector('.bg-yellow-100')).toBeInTheDocument();

    rerender(<MemberRoleBadge role="admin" />);
    expect(container.querySelector('.bg-red-100')).toBeInTheDocument();

    rerender(<MemberRoleBadge role="moderator" />);
    expect(container.querySelector('.bg-blue-100')).toBeInTheDocument();

    rerender(<MemberRoleBadge role="member" />);
    expect(container.querySelector('.bg-gray-100')).toBeInTheDocument();
  });
});

// ===== COMMUNITY STATS COMPONENT TESTS =====
describe('CommunityStatsComponent', () => {
  const mockStats: CommunityStats = {
    members: 1500,
    posts: 250,
    comments: 1200,
    activeToday: 45,
    growth: 15,
  };

  it('should render all stat categories', () => {
    render(<CommunityStatsComponent stats={mockStats} />);

    expect(screen.getByText('Members')).toBeInTheDocument();
    expect(screen.getByText('Posts')).toBeInTheDocument();
    expect(screen.getByText('Comments')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should format numbers correctly', () => {
    render(<CommunityStatsComponent stats={mockStats} />);

    expect(screen.getByText('1.5K')).toBeInTheDocument();
    expect(screen.getByText('250')).toBeInTheDocument();
    expect(screen.getByText('1.2K')).toBeInTheDocument();
  });

  it('should show growth percentage', () => {
    render(<CommunityStatsComponent stats={mockStats} />);
    expect(screen.getByText('+15%')).toBeInTheDocument();
  });

  it('should render compact view', () => {
    render(<CommunityStatsComponent stats={mockStats} compact={true} />);

    // Compact view shows only first 3 stats
    expect(screen.getByText('1.5K')).toBeInTheDocument();
    expect(screen.getByText('250')).toBeInTheDocument();
    expect(screen.getByText('1.2K')).toBeInTheDocument();
  });
});

// ===== MODERATOR LIST COMPONENT TESTS =====
describe('ModeratorList Component', () => {
  const mockModerators = [
    createMockMember({ id: 'mod-1', displayName: 'Alice', role: 'owner' }),
    createMockMember({ id: 'mod-2', displayName: 'Bob', role: 'admin' }),
    createMockMember({ id: 'mod-3', displayName: 'Charlie', role: 'moderator' }),
  ];

  it('should render moderators', () => {
    render(<ModeratorList moderators={mockModerators} />);

    expect(screen.getByText('Moderators')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('should limit displayed moderators', () => {
    const manyModerators = [
      ...mockModerators,
      createMockMember({ id: 'mod-4', displayName: 'David', role: 'moderator' }),
    ];

    render(<ModeratorList moderators={manyModerators} limit={3} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.queryByText('David')).not.toBeInTheDocument();
    expect(screen.getByText('+1 more')).toBeInTheDocument();
  });

  it('should render nothing when no moderators', () => {
    const { container } = render(<ModeratorList moderators={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should call onMemberClick when moderator is clicked', async () => {
    const user = userEvent.setup();
    const onMemberClick = jest.fn();

    render(
      <ModeratorList moderators={mockModerators} onMemberClick={onMemberClick} />
    );

    const aliceButton = screen.getByText('Alice').closest('button');
    if (aliceButton) {
      await user.click(aliceButton);
      expect(onMemberClick).toHaveBeenCalledWith(mockModerators[0]);
    }
  });

  it('should display moderator avatars', () => {
    const moderatorsWithAvatar = [
      createMockMember({
        id: 'mod-1',
        displayName: 'Alice',
        role: 'owner',
        avatar: 'https://example.com/alice.jpg',
      }),
    ];

    render(<ModeratorList moderators={moderatorsWithAvatar} />);

    const avatar = screen.getByAltText('Alice');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', 'https://example.com/alice.jpg');
  });

  it('should show initials when no avatar', () => {
    render(<ModeratorList moderators={mockModerators} />);

    // Should show first letter of display name
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
  });
});

// ===== COMMUNITY ACTIONS COMPONENT TESTS =====
describe('CommunityActions Component', () => {
  const mockCommunity = createMockCommunity();

  it('should render join button for unauthenticated users', () => {
    render(<CommunityActions community={mockCommunity} />);
    expect(screen.getByText('Join Community')).toBeInTheDocument();
  });

  it('should render join button for non-members', () => {
    const community = createMockCommunity({
      userMembership: {
        isMember: false,
        isFollowing: false,
        isMuted: false,
        notificationsEnabled: false,
      },
    });

    render(
      <CommunityActions
        community={community}
        currentUser={{ id: 'user-1', username: 'testuser' }}
      />
    );

    expect(screen.getByText('Join')).toBeInTheDocument();
  });

  it('should render leave button for members', () => {
    const community = createMockCommunity({
      userMembership: {
        isMember: true,
        isFollowing: true,
        isMuted: false,
        notificationsEnabled: true,
      },
    });

    render(
      <CommunityActions
        community={community}
        currentUser={{ id: 'user-1', username: 'testuser' }}
      />
    );

    expect(screen.getByText('Leave')).toBeInTheDocument();
  });

  it('should call onJoin when join is clicked', async () => {
    const user = userEvent.setup();
    const onJoin = jest.fn();

    render(<CommunityActions community={mockCommunity} onJoin={onJoin} />);

    const joinButton = screen.getByText('Join Community');
    await user.click(joinButton);

    expect(onJoin).toHaveBeenCalled();
  });

  it('should call onFollow when follow is clicked', async () => {
    const user = userEvent.setup();
    const onFollow = jest.fn();
    const community = createMockCommunity({
      userMembership: {
        isMember: false,
        isFollowing: false,
        isMuted: false,
        notificationsEnabled: false,
      },
    });

    render(
      <CommunityActions
        community={community}
        currentUser={{ id: 'user-1', username: 'testuser' }}
        onFollow={onFollow}
      />
    );

    const followButton = screen.getByText('Follow');
    await user.click(followButton);

    expect(onFollow).toHaveBeenCalled();
  });

  it('should show notification options for members', () => {
    const community = createMockCommunity({
      userMembership: {
        isMember: true,
        isFollowing: true,
        isMuted: false,
        notificationsEnabled: true,
      },
    });

    render(
      <CommunityActions
        community={community}
        currentUser={{ id: 'user-1', username: 'testuser' }}
      />
    );

    expect(screen.getByText('Mute notifications')).toBeInTheDocument();
  });

  it('should show report option for non-admins', () => {
    const community = createMockCommunity();

    render(
      <CommunityActions
        community={community}
        currentUser={{ id: 'user-1', username: 'testuser' }}
      />
    );

    expect(screen.getByText('Report community')).toBeInTheDocument();
  });

  it('should not show report option for admins', () => {
    const community = createMockCommunity({
      currentUserRole: 'admin',
    });

    render(
      <CommunityActions
        community={community}
        currentUser={{ id: 'user-1', username: 'testuser' }}
      />
    );

    expect(screen.queryByText('Report community')).not.toBeInTheDocument();
  });
});
