/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import CommunityCard from './CommunityCard';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('CommunityCard', () => {
  const baseCommunity = {
    name: 'Test Community',
    slug: 'test-community',
    description: 'A test community description',
    member_count: 1500,
    icon_url: 'https://example.com/icon.jpg',
    banner_image_url: 'https://example.com/banner.jpg',
    isJoined: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      renderWithRouter(<CommunityCard community={baseCommunity} />);
      expect(screen.getByText('Test Community')).toBeInTheDocument();
    });

    it('renders community name', () => {
      renderWithRouter(<CommunityCard community={baseCommunity} />);
      expect(screen.getByText('Test Community')).toBeInTheDocument();
    });

    it('renders community description', () => {
      renderWithRouter(<CommunityCard community={baseCommunity} />);
      expect(screen.getByText('A test community description')).toBeInTheDocument();
    });

    it('renders without description when not provided', () => {
      const communityWithoutDesc = { ...baseCommunity, description: null };
      renderWithRouter(<CommunityCard community={communityWithoutDesc} />);
      expect(screen.queryByText('A test community description')).not.toBeInTheDocument();
    });

    it('applies compact padding when compact prop is true', () => {
      const { container } = renderWithRouter(
        <CommunityCard community={baseCommunity} compact={true} />
      );
      const card = container.querySelector('[class*="overflow-hidden"]');
      expect(card).toBeInTheDocument();
    });

    it('applies default padding when compact is false', () => {
      const { container } = renderWithRouter(
        <CommunityCard community={baseCommunity} compact={false} />
      );
      const card = container.querySelector('[class*="overflow-hidden"]');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Community Icon', () => {
    it('renders community icon image when icon_url is provided', () => {
      renderWithRouter(<CommunityCard community={baseCommunity} />);
      const icon = screen.getByAltText('Test Community');
      expect(icon).toHaveAttribute('src', 'https://example.com/icon.jpg');
    });

    it('renders first letter fallback when no icon_url', () => {
      const communityWithoutIcon = { ...baseCommunity, icon_url: null };
      renderWithRouter(<CommunityCard community={communityWithoutIcon} />);
      expect(screen.getByText('T')).toBeInTheDocument();
    });

    it('capitalizes first letter in fallback icon', () => {
      const communityLowercase = { ...baseCommunity, name: 'gaming', icon_url: null };
      renderWithRouter(<CommunityCard community={communityLowercase} />);
      expect(screen.getByText('G')).toBeInTheDocument();
    });

    it('handles empty name gracefully in fallback', () => {
      const communityEmptyName = { ...baseCommunity, name: '', icon_url: null };
      renderWithRouter(<CommunityCard community={communityEmptyName} />);
      expect(screen.queryByText(/^[A-Z]$/)).not.toBeInTheDocument();
    });

    it('renders icon in container with proper styling', () => {
      const { container } = renderWithRouter(<CommunityCard community={baseCommunity} />);
      const iconContainer = container.querySelector('.w-16.h-16.rounded-lg');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Banner Image', () => {
    it('renders banner image when banner_image_url is provided', () => {
      renderWithRouter(<CommunityCard community={baseCommunity} />);
      const images = screen.getAllByAltText('Test Community');
      expect(images.length).toBeGreaterThan(0);
    });

    it('falls back to image_url when no banner_image_url', () => {
      const communityWithImageUrl = {
        ...baseCommunity,
        banner_image_url: null,
        image_url: 'https://example.com/image.jpg',
      };
      renderWithRouter(<CommunityCard community={communityWithImageUrl} />);
      expect(screen.getByText('Test Community')).toBeInTheDocument();
    });

    it('renders fallback icon when no images provided', () => {
      const communityNoImages = {
        ...baseCommunity,
        banner_image_url: null,
        image_url: null,
      };
      const { container } = renderWithRouter(<CommunityCard community={communityNoImages} />);
      const fallbackIcon = container.querySelector('svg');
      expect(fallbackIcon).toBeInTheDocument();
    });
  });

  describe('Member Count', () => {
    it('displays member count', () => {
      renderWithRouter(<CommunityCard community={baseCommunity} />);
      expect(screen.getByText('1.5K')).toBeInTheDocument();
    });

    it('formats large numbers with K suffix', () => {
      const communityManyMembers = { ...baseCommunity, member_count: 5500 };
      renderWithRouter(<CommunityCard community={communityManyMembers} />);
      expect(screen.getByText('5.5K')).toBeInTheDocument();
    });

    it('formats millions with M suffix', () => {
      const communityMillions = { ...baseCommunity, member_count: 2500000 };
      renderWithRouter(<CommunityCard community={communityMillions} />);
      expect(screen.getByText('2.5M')).toBeInTheDocument();
    });

    it('displays small numbers without formatting', () => {
      const communityFewMembers = { ...baseCommunity, member_count: 250 };
      renderWithRouter(<CommunityCard community={communityFewMembers} />);
      expect(screen.getByText('250')).toBeInTheDocument();
    });

    it('displays 0 when member_count is 0', () => {
      const communityNoMembers = { ...baseCommunity, member_count: 0 };
      renderWithRouter(<CommunityCard community={communityNoMembers} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('displays 0 when member_count is undefined', () => {
      const communityUndefined = { ...baseCommunity, member_count: undefined };
      renderWithRouter(<CommunityCard community={communityUndefined} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Post Count', () => {
    it('displays post count when provided', () => {
      const communityWithPosts = { ...baseCommunity, post_count: 1200 };
      renderWithRouter(<CommunityCard community={communityWithPosts} />);
      expect(screen.getByText('1.2K posts')).toBeInTheDocument();
    });

    it('does not display post count when undefined', () => {
      renderWithRouter(<CommunityCard community={baseCommunity} />);
      expect(screen.queryByText(/posts/)).not.toBeInTheDocument();
    });

    it('formats post count numbers correctly', () => {
      const communityManyPosts = { ...baseCommunity, post_count: 50 };
      renderWithRouter(<CommunityCard community={communityManyPosts} />);
      expect(screen.getByText('50 posts')).toBeInTheDocument();
    });
  });

  describe('Online Count', () => {
    it('displays online count when provided', () => {
      const communityWithOnline = { ...baseCommunity, online_count: 150 };
      renderWithRouter(<CommunityCard community={communityWithOnline} />);
      expect(screen.getByText('150 online')).toBeInTheDocument();
    });

    it('does not display online count when undefined', () => {
      renderWithRouter(<CommunityCard community={baseCommunity} />);
      expect(screen.queryByText(/online/)).not.toBeInTheDocument();
    });

    it('renders online indicator dot', () => {
      const communityWithOnline = { ...baseCommunity, online_count: 50 };
      const { container } = renderWithRouter(<CommunityCard community={communityWithOnline} />);
      const onlineDot = container.querySelector('.bg-success');
      expect(onlineDot).toBeInTheDocument();
    });
  });

  describe('Tags', () => {
    it('renders tags when provided', () => {
      const communityWithTags = {
        ...baseCommunity,
        tags: ['gaming', 'multiplayer', 'casual'],
      };
      renderWithRouter(<CommunityCard community={communityWithTags} />);
      expect(screen.getByText('gaming')).toBeInTheDocument();
      expect(screen.getByText('multiplayer')).toBeInTheDocument();
      expect(screen.getByText('casual')).toBeInTheDocument();
    });

    it('limits tags to first 3', () => {
      const communityManyTags = {
        ...baseCommunity,
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
      };
      renderWithRouter(<CommunityCard community={communityManyTags} />);
      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
      expect(screen.getByText('tag3')).toBeInTheDocument();
      expect(screen.queryByText('tag4')).not.toBeInTheDocument();
      expect(screen.queryByText('tag5')).not.toBeInTheDocument();
    });

    it('does not render tags section when empty', () => {
      const communityNoTags = { ...baseCommunity, tags: [] };
      const { container } = renderWithRouter(<CommunityCard community={communityNoTags} />);
      const tagsContainer = container.querySelector('.flex-wrap');
      expect(tagsContainer).not.toBeInTheDocument();
    });

    it('does not render tags section when undefined', () => {
      renderWithRouter(<CommunityCard community={baseCommunity} />);
      const { container } = render(<CommunityCard community={baseCommunity} />);
      expect(screen.queryByText('gaming')).not.toBeInTheDocument();
    });
  });

  describe('Join Button', () => {
    it('renders Join button when not joined', () => {
      renderWithRouter(<CommunityCard community={baseCommunity} />);
      expect(screen.getByRole('button', { name: /join/i })).toBeInTheDocument();
    });

    it('renders Leave button when joined', () => {
      const joinedCommunity = { ...baseCommunity, isJoined: true };
      renderWithRouter(<CommunityCard community={joinedCommunity} />);
      expect(screen.getByRole('button', { name: /leave/i })).toBeInTheDocument();
    });

    it('calls onJoin when Join button is clicked', async () => {
      const onJoin = jest.fn().mockResolvedValue();
      renderWithRouter(<CommunityCard community={baseCommunity} onJoin={onJoin} />);

      const joinButton = screen.getByRole('button', { name: /join/i });
      await userEvent.click(joinButton);

      await waitFor(() => {
        expect(onJoin).toHaveBeenCalledWith('Test Community');
      });
    });

    it('calls onLeave when Leave button is clicked', async () => {
      const onLeave = jest.fn().mockResolvedValue();
      const joinedCommunity = { ...baseCommunity, isJoined: true };
      renderWithRouter(<CommunityCard community={joinedCommunity} onLeave={onLeave} />);

      const leaveButton = screen.getByRole('button', { name: /leave/i });
      await userEvent.click(leaveButton);

      await waitFor(() => {
        expect(onLeave).toHaveBeenCalledWith('Test Community');
      });
    });

    it('toggles button state optimistically', async () => {
      const onJoin = jest.fn().mockResolvedValue();
      renderWithRouter(<CommunityCard community={baseCommunity} onJoin={onJoin} />);

      const joinButton = screen.getByRole('button', { name: /join/i });
      await userEvent.click(joinButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /leave/i })).toBeInTheDocument();
      });
    });

    it('reverts state on join error', async () => {
      const onJoin = jest.fn().mockRejectedValue(new Error('Failed to join'));
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      renderWithRouter(<CommunityCard community={baseCommunity} onJoin={onJoin} />);

      const joinButton = screen.getByRole('button', { name: /join/i });
      await userEvent.click(joinButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /join/i })).toBeInTheDocument();
      });

      consoleError.mockRestore();
    });

    it('reverts state on leave error', async () => {
      const onLeave = jest.fn().mockRejectedValue(new Error('Failed to leave'));
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      const joinedCommunity = { ...baseCommunity, isJoined: true };
      renderWithRouter(<CommunityCard community={joinedCommunity} onLeave={onLeave} />);

      const leaveButton = screen.getByRole('button', { name: /leave/i });
      await userEvent.click(leaveButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /leave/i })).toBeInTheDocument();
      });

      consoleError.mockRestore();
    });

    it('prevents multiple simultaneous join requests', async () => {
      const onJoin = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      renderWithRouter(<CommunityCard community={baseCommunity} onJoin={onJoin} />);

      const joinButton = screen.getByRole('button', { name: /join/i });

      await userEvent.click(joinButton);
      await userEvent.click(joinButton);
      await userEvent.click(joinButton);

      await waitFor(() => {
        expect(onJoin).toHaveBeenCalledTimes(1);
      });
    });

    it('stops propagation when button is clicked', async () => {
      const onJoin = jest.fn().mockResolvedValue();
      renderWithRouter(<CommunityCard community={baseCommunity} onJoin={onJoin} />);

      const joinButton = screen.getByRole('button', { name: /join/i });

      const clickEvent = new MouseEvent('click', { bubbles: true });
      const stopPropagation = jest.spyOn(clickEvent, 'stopPropagation');

      fireEvent(joinButton, clickEvent);

      expect(stopPropagation).toHaveBeenCalled();
    });

    it('handles missing onJoin callback gracefully', async () => {
      renderWithRouter(<CommunityCard community={baseCommunity} />);

      const joinButton = screen.getByRole('button', { name: /join/i });
      await userEvent.click(joinButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /leave/i })).toBeInTheDocument();
      });
    });

    it('handles missing onLeave callback gracefully', async () => {
      const joinedCommunity = { ...baseCommunity, isJoined: true };
      renderWithRouter(<CommunityCard community={joinedCommunity} />);

      const leaveButton = screen.getByRole('button', { name: /leave/i });
      await userEvent.click(leaveButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /join/i })).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('navigates to community on card click', async () => {
      renderWithRouter(<CommunityCard community={baseCommunity} />);

      const card = screen.getByText('Test Community').closest('[class*="overflow-hidden"]');
      await userEvent.click(card);

      expect(mockNavigate).toHaveBeenCalledWith('/community/test-community');
    });

    it('uses slug for navigation when available', async () => {
      renderWithRouter(<CommunityCard community={baseCommunity} />);

      const card = screen.getByText('Test Community').closest('[class*="overflow-hidden"]');
      await userEvent.click(card);

      expect(mockNavigate).toHaveBeenCalledWith('/community/test-community');
    });

    it('falls back to name when slug is not available', async () => {
      const communityWithoutSlug = { ...baseCommunity, slug: null };
      renderWithRouter(<CommunityCard community={communityWithoutSlug} />);

      const card = screen.getByText('Test Community').closest('[class*="overflow-hidden"]');
      await userEvent.click(card);

      expect(mockNavigate).toHaveBeenCalledWith('/community/Test Community');
    });
  });

  describe('Badges', () => {
    it('renders Private badge for private communities', () => {
      const privateCommunity = { ...baseCommunity, type: 'private' };
      renderWithRouter(<CommunityCard community={privateCommunity} />);
      expect(screen.getByText('Private')).toBeInTheDocument();
    });

    it('renders Restricted badge for restricted communities', () => {
      const restrictedCommunity = { ...baseCommunity, type: 'restricted' };
      renderWithRouter(<CommunityCard community={restrictedCommunity} />);
      expect(screen.getByText('Restricted')).toBeInTheDocument();
    });

    it('renders Featured badge for featured communities', () => {
      const featuredCommunity = { ...baseCommunity, featured: true };
      renderWithRouter(<CommunityCard community={featuredCommunity} />);
      expect(screen.getByText('Featured')).toBeInTheDocument();
    });

    it('prioritizes private badge over featured', () => {
      const privateFeatured = { ...baseCommunity, type: 'private', featured: true };
      renderWithRouter(<CommunityCard community={privateFeatured} />);
      expect(screen.getByText('Private')).toBeInTheDocument();
      expect(screen.queryByText('Featured')).not.toBeInTheDocument();
    });

    it('does not render badge for public non-featured communities', () => {
      renderWithRouter(<CommunityCard community={baseCommunity} />);
      expect(screen.queryByText('Private')).not.toBeInTheDocument();
      expect(screen.queryByText('Restricted')).not.toBeInTheDocument();
      expect(screen.queryByText('Featured')).not.toBeInTheDocument();
    });
  });

  describe('Verified Badge', () => {
    it('renders verified icon when community is verified', () => {
      const verifiedCommunity = { ...baseCommunity, verified: true };
      const { container } = renderWithRouter(<CommunityCard community={verifiedCommunity} />);
      const verifiedIcon = container.querySelector('svg[class*="text-primary"]');
      expect(verifiedIcon).toBeInTheDocument();
    });

    it('does not render verified icon when not verified', () => {
      const { container } = renderWithRouter(<CommunityCard community={baseCommunity} />);
      const verifiedIcons = container.querySelectorAll('svg[class*="text-primary"]');
      expect(verifiedIcons.length).toBe(0);
    });
  });

  describe('Lock Icon', () => {
    it('renders lock icon for private communities', () => {
      const privateCommunity = { ...baseCommunity, type: 'private' };
      const { container } = renderWithRouter(<CommunityCard community={privateCommunity} />);
      const lockIcon = container.querySelector('.h-4.w-4.text-text-tertiary');
      expect(lockIcon).toBeInTheDocument();
    });

    it('does not render lock icon for public communities', () => {
      const { container } = renderWithRouter(<CommunityCard community={baseCommunity} />);
      expect(screen.queryByText('Lock')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading state on join button', async () => {
      const onJoin = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
      renderWithRouter(<CommunityCard community={baseCommunity} onJoin={onJoin} />);

      const joinButton = screen.getByRole('button', { name: /join/i });
      await userEvent.click(joinButton);

      expect(joinButton).toBeDisabled();
    });

    it('disables button during loading', async () => {
      const onJoin = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
      renderWithRouter(<CommunityCard community={baseCommunity} onJoin={onJoin} />);

      const joinButton = screen.getByRole('button', { name: /join/i });
      await userEvent.click(joinButton);

      expect(joinButton).toBeDisabled();
    });

    it('re-enables button after join completes', async () => {
      const onJoin = jest.fn().mockResolvedValue();
      renderWithRouter(<CommunityCard community={baseCommunity} onJoin={onJoin} />);

      const joinButton = screen.getByRole('button', { name: /join/i });
      await userEvent.click(joinButton);

      await waitFor(() => {
        const leaveButton = screen.getByRole('button', { name: /leave/i });
        expect(leaveButton).not.toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('logs error when join fails', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Network error');
      const onJoin = jest.fn().mockRejectedValue(error);

      renderWithRouter(<CommunityCard community={baseCommunity} onJoin={onJoin} />);

      const joinButton = screen.getByRole('button', { name: /join/i });
      await userEvent.click(joinButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to update community membership:', error);
      });

      consoleError.mockRestore();
    });

    it('logs error when leave fails', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Network error');
      const onLeave = jest.fn().mockRejectedValue(error);

      const joinedCommunity = { ...baseCommunity, isJoined: true };
      renderWithRouter(<CommunityCard community={joinedCommunity} onLeave={onLeave} />);

      const leaveButton = screen.getByRole('button', { name: /leave/i });
      await userEvent.click(leaveButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to update community membership:', error);
      });

      consoleError.mockRestore();
    });
  });

  describe('Button Variants', () => {
    it('uses primary variant for Join button', () => {
      const { container } = renderWithRouter(<CommunityCard community={baseCommunity} />);
      const joinButton = screen.getByRole('button', { name: /join/i });
      expect(joinButton).toBeInTheDocument();
    });

    it('uses secondary variant for Leave button', () => {
      const joinedCommunity = { ...baseCommunity, isJoined: true };
      const { container } = renderWithRouter(<CommunityCard community={joinedCommunity} />);
      const leaveButton = screen.getByRole('button', { name: /leave/i });
      expect(leaveButton).toBeInTheDocument();
    });

    it('applies small size to button', () => {
      renderWithRouter(<CommunityCard community={baseCommunity} />);
      const button = screen.getByRole('button', { name: /join/i });
      expect(button).toBeInTheDocument();
    });

    it('applies full width to button', () => {
      renderWithRouter(<CommunityCard community={baseCommunity} />);
      const button = screen.getByRole('button', { name: /join/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles null community name', () => {
      const communityNoName = { ...baseCommunity, name: null };
      renderWithRouter(<CommunityCard community={communityNoName} />);
      expect(screen.getByRole('button', { name: /join/i })).toBeInTheDocument();
    });

    it('handles undefined community properties', () => {
      const minimalCommunity = { name: 'Minimal' };
      renderWithRouter(<CommunityCard community={minimalCommunity} />);
      expect(screen.getByText('Minimal')).toBeInTheDocument();
    });

    it('handles extremely long community names', () => {
      const longNameCommunity = {
        ...baseCommunity,
        name: 'This is a very long community name that should be truncated properly',
      };
      renderWithRouter(<CommunityCard community={longNameCommunity} />);
      const title = screen.getByText('This is a very long community name that should be truncated properly');
      expect(title).toHaveClass('truncate');
    });

    it('handles extremely long descriptions', () => {
      const longDescCommunity = {
        ...baseCommunity,
        description: 'This is a very long description that should be clamped to two lines maximum using the line-clamp-2 utility class',
      };
      renderWithRouter(<CommunityCard community={longDescCommunity} />);
      const desc = screen.getByText(/This is a very long description/);
      expect(desc).toHaveClass('line-clamp-2');
    });
  });
});

export default mockNavigate
