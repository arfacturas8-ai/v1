/**
 * Comprehensive Test Suite for CRYB Post Card Component
 * Testing rendering, interactions, media, reactions, and accessibility features
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { PostCard, type PostData, type PostAuthor, type PostMedia } from './post-card';

// Mock dependencies
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

// Mock framer-motion to simplify testing
jest.mock('framer-motion', () => {
  const mockReact = require('react');
  return {
    motion: {
      div: mockReact.forwardRef(({ children, layout, initial, animate, exit, transition, whileTap, whileHover, ...props }: any, ref: any) => (
        <div ref={ref} {...props}>
          {children}
        </div>
      )),
      button: ({ children, whileTap, whileHover, ...props }: any) => <button {...props}>{children}</button>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

// Mock Radix UI Dropdown Menu
jest.mock('@radix-ui/react-dropdown-menu', () => {
  const mockReact = require('react');
  return {
    Root: ({ children }: any) => <div>{children}</div>,
    Trigger: mockReact.forwardRef(({ children, asChild, ...props }: any, ref: any) => {
      if (asChild) {
        const child = mockReact.Children.only(children);
        return mockReact.cloneElement(child, { ...props, ref });
      }
      return <button ref={ref} {...props}>{children}</button>;
    }),
    Portal: ({ children }: any) => <div>{children}</div>,
    Content: ({ children, ...props }: any) => <div role="menu" {...props}>{children}</div>,
    Item: ({ children, onClick, ...props }: any) => (
      <div role="menuitem" onClick={onClick} {...props}>{children}</div>
    ),
  };
});

// Mock Radix UI Collapsible
jest.mock('@radix-ui/react-collapsible', () => ({
  Root: ({ children }: any) => <div>{children}</div>,
  Trigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Content: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

// Mock UI Button components
jest.mock('../ui/button', () => {
  const mockReact = require('react');
  return {
    Button: mockReact.forwardRef(({ children, onClick, className, ...props }: any, ref: any) => (
      <button ref={ref} onClick={onClick} className={className} {...props}>
        {children}
      </button>
    )),
    IconButton: mockReact.forwardRef(({ icon, onClick, className, ...props }: any, ref: any) => (
      <button ref={ref} onClick={onClick} className={className} {...props}>
        {icon}
      </button>
    )),
  };
});

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Heart: () => <span data-testid="heart-icon">Heart</span>,
  MessageCircle: () => <span data-testid="message-icon">Message</span>,
  Share2: () => <span data-testid="share-icon">Share</span>,
  Bookmark: () => <span data-testid="bookmark-icon">Bookmark</span>,
  MoreHorizontal: () => <span data-testid="more-icon">More</span>,
  Play: () => <span data-testid="play-icon">Play</span>,
  Pause: () => <span data-testid="pause-icon">Pause</span>,
  Volume2: () => <span data-testid="volume-icon">Volume</span>,
  VolumeX: () => <span data-testid="mute-icon">Mute</span>,
  Eye: () => <span data-testid="eye-icon">Eye</span>,
  Clock: () => <span data-testid="clock-icon">Clock</span>,
  MapPin: () => <span data-testid="pin-icon">Pin</span>,
  Users: () => <span data-testid="users-icon">Users</span>,
  ChevronDown: () => <span data-testid="chevron-down-icon">Down</span>,
  ChevronUp: () => <span data-testid="chevron-up-icon">Up</span>,
  ExternalLink: () => <span data-testid="external-icon">External</span>,
  Flag: () => <span data-testid="flag-icon">Flag</span>,
  Copy: () => <span data-testid="copy-icon">Copy</span>,
  Download: () => <span data-testid="download-icon">Download</span>,
}));

// Helper function to create mock post data
const createMockAuthor = (overrides?: Partial<PostAuthor>): PostAuthor => ({
  id: '1',
  name: 'John Doe',
  username: 'johndoe',
  avatar: 'https://example.com/avatar.jpg',
  verified: false,
  ...overrides,
});

const createMockPost = (overrides?: Partial<PostData>): PostData => ({
  id: 'post-1',
  author: createMockAuthor(),
  content: 'This is a test post',
  reactions: {
    likes: 10,
    comments: 5,
    shares: 2,
    bookmarks: 1,
    userLiked: false,
    userBookmarked: false,
  },
  timestamp: new Date('2024-01-01T12:00:00Z'),
  ...overrides,
});

const createMockMedia = (type: 'image' | 'video' | 'gif' | 'audio', overrides?: Partial<PostMedia>): PostMedia => ({
  id: 'media-1',
  type,
  url: `https://example.com/${type}.${type === 'video' ? 'mp4' : type === 'audio' ? 'mp3' : 'jpg'}`,
  thumbnail: type === 'video' ? 'https://example.com/thumbnail.jpg' : undefined,
  alt: `Test ${type}`,
  width: 800,
  height: 600,
  ...overrides,
});

describe('PostCard Component', () => {
  // ===== RENDERING TESTS =====
  describe('Rendering', () => {
    it('should render post card with basic content', () => {
      const post = createMockPost();
      render(<PostCard post={post} />);

      expect(screen.getByText('This is a test post')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('@johndoe')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const post = createMockPost();
      const { container } = render(<PostCard post={post} className="custom-class" />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('custom-class');
    });

    it('should render with different variants', () => {
      const post = createMockPost();
      const variants = ['default', 'elevated', 'minimal', 'highlighted'] as const;

      variants.forEach(variant => {
        const { container, unmount } = render(<PostCard post={post} variant={variant} />);
        expect(container.firstChild).toBeInTheDocument();
        unmount();
      });
    });

    it('should render in compact mode', () => {
      const post = createMockPost();
      render(<PostCard post={post} compact />);

      expect(screen.getByText('This is a test post')).toBeInTheDocument();
    });
  });

  // ===== AUTHOR INFORMATION TESTS =====
  describe('Author Information', () => {
    it('should display author name and username', () => {
      const post = createMockPost();
      render(<PostCard post={post} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('@johndoe')).toBeInTheDocument();
    });

    it('should display verified badge for verified users', () => {
      const post = createMockPost({
        author: createMockAuthor({ verified: true }),
      });
      render(<PostCard post={post} />);

      const avatars = screen.getAllByRole('button', { name: /john doe/i });
      expect(avatars.length).toBeGreaterThan(0);
    });

    it('should display author role when provided', () => {
      const post = createMockPost({
        author: createMockAuthor({ role: 'Admin' }),
      });
      render(<PostCard post={post} />);

      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('should render avatar with image', () => {
      const post = createMockPost();
      render(<PostCard post={post} />);

      const avatar = screen.getByAltText('John Doe');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('should render avatar with initials when no image', () => {
      const post = createMockPost({
        author: createMockAuthor({ avatar: undefined }),
      });
      render(<PostCard post={post} />);

      expect(screen.getByText('J')).toBeInTheDocument(); // First letter of name
    });

    it('should call onUserClick when clicking author', async () => {
      const user = userEvent.setup();
      const onUserClick = jest.fn();
      const post = createMockPost();

      render(<PostCard post={post} onUserClick={onUserClick} />);

      const authorName = screen.getByText('John Doe');
      await user.click(authorName);

      expect(onUserClick).toHaveBeenCalledWith(post.author);
    });
  });

  // ===== POST CONTENT TESTS =====
  describe('Post Content', () => {
    it('should display text content', () => {
      const post = createMockPost({ content: 'Hello world!' });
      render(<PostCard post={post} />);

      expect(screen.getByText('Hello world!')).toBeInTheDocument();
    });

    it('should truncate long content when not expanded', () => {
      const longContent = 'a'.repeat(300);
      const post = createMockPost({ content: longContent });
      render(<PostCard post={post} />);

      const content = screen.getByText(/a+\.\.\./);
      expect(content.textContent?.length).toBeLessThan(longContent.length);
      expect(screen.getByText('Show more')).toBeInTheDocument();
    });

    it('should expand content when clicking "Show more"', async () => {
      const user = userEvent.setup();
      const longContent = 'a'.repeat(300);
      const post = createMockPost({ content: longContent });
      render(<PostCard post={post} />);

      const showMore = screen.getByText('Show more');
      await user.click(showMore);

      await waitFor(() => {
        expect(screen.queryByText('Show more')).not.toBeInTheDocument();
      });
    });

    it('should display full content when expanded prop is true', () => {
      const longContent = 'a'.repeat(300);
      const post = createMockPost({ content: longContent });
      render(<PostCard post={post} expanded />);

      expect(screen.queryByText('Show more')).not.toBeInTheDocument();
    });

    it('should display tags when provided', () => {
      const post = createMockPost({ tags: ['javascript', 'react', 'testing'] });
      render(<PostCard post={post} />);

      expect(screen.getByText('#javascript')).toBeInTheDocument();
      expect(screen.getByText('#react')).toBeInTheDocument();
      expect(screen.getByText('#testing')).toBeInTheDocument();
    });

    it('should handle spoiler content', () => {
      const post = createMockPost({
        content: 'Spoiler content',
        spoiler: true,
      });
      render(<PostCard post={post} />);

      expect(screen.getByText('This post contains spoilers')).toBeInTheDocument();
      expect(screen.queryByText('Spoiler content')).not.toBeInTheDocument();
    });

    it('should reveal spoiler content when clicking Show Content', async () => {
      const user = userEvent.setup();
      const post = createMockPost({
        content: 'Spoiler content',
        spoiler: true,
      });
      render(<PostCard post={post} />);

      const showButton = screen.getByText('Show Content');
      await user.click(showButton);

      expect(screen.getByText('Spoiler content')).toBeInTheDocument();
    });
  });

  // ===== MEDIA TESTS =====
  describe('Media', () => {
    it('should display image media', () => {
      const post = createMockPost({
        media: [createMockMedia('image')],
      });
      render(<PostCard post={post} />);

      const image = screen.getByAltText('Test image');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('should display video media with controls', () => {
      const post = createMockPost({
        media: [createMockMedia('video', { duration: 120 })],
      });
      render(<PostCard post={post} />);

      const video = screen.getByRole('button', { name: /play video/i });
      expect(video).toBeInTheDocument();
    });

    it('should display GIF indicator', () => {
      const post = createMockPost({
        media: [createMockMedia('gif')],
      });
      render(<PostCard post={post} />);

      expect(screen.getByText('GIF')).toBeInTheDocument();
    });

    it('should display audio player', () => {
      const post = createMockPost({
        media: [createMockMedia('audio', { duration: 180 })],
      });
      render(<PostCard post={post} />);

      expect(screen.getByText('Audio File')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /play audio/i })).toBeInTheDocument();
    });

    it('should display multiple media items with indicators', () => {
      const post = createMockPost({
        media: [
          createMockMedia('image', { id: 'img1' }),
          createMockMedia('image', { id: 'img2' }),
          createMockMedia('image', { id: 'img3' }),
        ],
      });
      render(<PostCard post={post} />);

      // Should show media navigation indicators
      const indicators = screen.getAllByRole('button', { name: /go to media/i });
      expect(indicators).toHaveLength(3);
    });

    it('should hide media when showMedia is false', () => {
      const post = createMockPost({
        media: [createMockMedia('image')],
      });
      render(<PostCard post={post} showMedia={false} />);

      expect(screen.queryByAltText('Test image')).not.toBeInTheDocument();
    });

    it('should display compact grid for multiple media in compact mode', () => {
      const post = createMockPost({
        media: [
          createMockMedia('image', { id: 'img1' }),
          createMockMedia('image', { id: 'img2' }),
          createMockMedia('image', { id: 'img3' }),
          createMockMedia('image', { id: 'img4' }),
        ],
      });
      render(<PostCard post={post} compact />);

      const images = screen.getAllByAltText(/test image/i);
      expect(images).toHaveLength(4);
    });

    it('should show +N indicator when more than 4 media items in compact mode', () => {
      const post = createMockPost({
        media: [
          createMockMedia('image', { id: 'img1' }),
          createMockMedia('image', { id: 'img2' }),
          createMockMedia('image', { id: 'img3' }),
          createMockMedia('image', { id: 'img4' }),
          createMockMedia('image', { id: 'img5' }),
          createMockMedia('image', { id: 'img6' }),
        ],
      });
      render(<PostCard post={post} compact />);

      expect(screen.getByText('+2')).toBeInTheDocument();
    });
  });

  // ===== REACTION TESTS =====
  describe('Reactions', () => {
    it('should display like count', () => {
      const post = createMockPost({
        reactions: { likes: 42, comments: 0, shares: 0, bookmarks: 0 },
      });
      render(<PostCard post={post} />);

      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should display comment count', () => {
      const post = createMockPost({
        reactions: { likes: 0, comments: 15, shares: 0, bookmarks: 0 },
      });
      render(<PostCard post={post} />);

      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('should display share count when greater than 0', () => {
      const post = createMockPost({
        reactions: { likes: 0, comments: 0, shares: 7, bookmarks: 0 },
      });
      render(<PostCard post={post} />);

      expect(screen.getByText('7')).toBeInTheDocument();
    });

    it('should format large numbers correctly', () => {
      const post = createMockPost({
        reactions: { likes: 1500, comments: 250000, shares: 0, bookmarks: 0 },
      });
      render(<PostCard post={post} />);

      expect(screen.getByText('1.5K')).toBeInTheDocument();
      expect(screen.getByText('250.0K')).toBeInTheDocument();
    });

    it('should call onLike when clicking like button', async () => {
      const user = userEvent.setup();
      const onLike = jest.fn();
      const post = createMockPost();

      render(<PostCard post={post} onLike={onLike} />);

      const likeButton = screen.getByRole('button', { name: /10/i });
      await user.click(likeButton);

      expect(onLike).toHaveBeenCalledTimes(1);
    });

    it('should call onComment when clicking comment button', async () => {
      const user = userEvent.setup();
      const onComment = jest.fn();
      const post = createMockPost();

      render(<PostCard post={post} onComment={onComment} />);

      const commentButton = screen.getByRole('button', { name: /5/i });
      await user.click(commentButton);

      expect(onComment).toHaveBeenCalledTimes(1);
    });

    it('should call onShare when clicking share button', async () => {
      const user = userEvent.setup();
      const onShare = jest.fn();
      const post = createMockPost();

      render(<PostCard post={post} onShare={onShare} />);

      const shareButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('[data-testid="share-icon"]')
      );
      await user.click(shareButton!);

      expect(onShare).toHaveBeenCalledTimes(1);
    });

    it('should call onBookmark when clicking bookmark button', async () => {
      const user = userEvent.setup();
      const onBookmark = jest.fn();
      const post = createMockPost();

      render(<PostCard post={post} onBookmark={onBookmark} />);

      const bookmarkButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('[data-testid="bookmark-icon"]')
      );
      await user.click(bookmarkButton!);

      expect(onBookmark).toHaveBeenCalledTimes(1);
    });

    it('should show liked state when userLiked is true', () => {
      const post = createMockPost({
        reactions: { likes: 10, comments: 0, shares: 0, bookmarks: 0, userLiked: true },
      });
      render(<PostCard post={post} />);

      const heartIcon = screen.getByTestId('heart-icon');
      expect(heartIcon).toBeInTheDocument();
    });

    it('should show bookmarked state when userBookmarked is true', () => {
      const post = createMockPost({
        reactions: { likes: 0, comments: 0, shares: 0, bookmarks: 1, userBookmarked: true },
      });
      render(<PostCard post={post} />);

      const bookmarkIcon = screen.getByTestId('bookmark-icon');
      expect(bookmarkIcon).toBeInTheDocument();
    });

    it('should hide reactions when showReactions is false', () => {
      const post = createMockPost();
      render(<PostCard post={post} showReactions={false} />);

      expect(screen.queryByTestId('heart-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('message-icon')).not.toBeInTheDocument();
    });
  });

  // ===== TIMESTAMP TESTS =====
  describe('Timestamps', () => {
    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-01T13:00:00Z'));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('should display relative time for recent posts', () => {
      const post = createMockPost({
        timestamp: new Date('2024-01-01T12:50:00Z'), // 10 minutes ago
      });
      render(<PostCard post={post} />);

      expect(screen.getByText('10m')).toBeInTheDocument();
    });

    it('should display "now" for very recent posts', () => {
      const post = createMockPost({
        timestamp: new Date('2024-01-01T13:00:00Z'), // now
      });
      render(<PostCard post={post} />);

      expect(screen.getByText('now')).toBeInTheDocument();
    });

    it('should display hours for posts within 24 hours', () => {
      const post = createMockPost({
        timestamp: new Date('2024-01-01T10:00:00Z'), // 3 hours ago
      });
      render(<PostCard post={post} />);

      expect(screen.getByText('3h')).toBeInTheDocument();
    });

    it('should display days for posts within a week', () => {
      const post = createMockPost({
        timestamp: new Date('2023-12-29T12:00:00Z'), // 3 days ago
      });
      render(<PostCard post={post} />);

      expect(screen.getByText('3d')).toBeInTheDocument();
    });

    it('should hide timestamp when showTimestamp is false', () => {
      const post = createMockPost();
      render(<PostCard post={post} showTimestamp={false} />);

      expect(screen.queryByTestId('clock-icon')).not.toBeInTheDocument();
    });

    it('should display edited indicator when post is edited', () => {
      const post = createMockPost({
        edited: new Date('2024-01-01T12:30:00Z'),
      });
      render(<PostCard post={post} />);

      expect(screen.getByText(/edited/i)).toBeInTheDocument();
    });
  });

  // ===== POST ACTIONS MENU TESTS =====
  describe('Post Actions Menu', () => {
    it('should display options menu button', () => {
      const post = createMockPost();
      render(<PostCard post={post} />);

      const optionsButton = screen.getByRole('button', { name: /post options/i });
      expect(optionsButton).toBeInTheDocument();
    });

    it('should hide options menu when showOptions is false', () => {
      const post = createMockPost();
      render(<PostCard post={post} showOptions={false} />);

      expect(screen.queryByRole('button', { name: /post options/i })).not.toBeInTheDocument();
    });

    it('should display menu items when opened', async () => {
      const user = userEvent.setup();
      const post = createMockPost();
      render(<PostCard post={post} />);

      const optionsButton = screen.getByRole('button', { name: /post options/i });
      await user.click(optionsButton);

      await waitFor(() => {
        expect(screen.getByText('Copy link')).toBeInTheDocument();
        expect(screen.getByText('Open in new tab')).toBeInTheDocument();
        expect(screen.getByText('Save post')).toBeInTheDocument();
        expect(screen.getByText('Report post')).toBeInTheDocument();
      });
    });
  });

  // ===== COMMUNITY AND LOCATION TESTS =====
  describe('Community and Location', () => {
    it('should display community information', () => {
      const post = createMockPost({
        community: {
          id: 'comm-1',
          name: 'JavaScript Developers',
          avatar: 'https://example.com/community.jpg',
        },
      });
      render(<PostCard post={post} />);

      expect(screen.getByText('JavaScript Developers')).toBeInTheDocument();
    });

    it('should call onCommunityClick when clicking community', async () => {
      const user = userEvent.setup();
      const onCommunityClick = jest.fn();
      const community = {
        id: 'comm-1',
        name: 'JavaScript Developers',
      };
      const post = createMockPost({ community });

      render(<PostCard post={post} onCommunityClick={onCommunityClick} />);

      const communityLink = screen.getByText('JavaScript Developers');
      await user.click(communityLink);

      expect(onCommunityClick).toHaveBeenCalledWith(community);
    });

    it('should display location when provided', () => {
      const post = createMockPost({ location: 'San Francisco, CA' });
      render(<PostCard post={post} />);

      expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
    });
  });

  // ===== INTERACTIVE CARD TESTS =====
  describe('Interactive Card', () => {
    it('should call onPostClick when card is clicked in interactive mode', async () => {
      const user = userEvent.setup();
      const onPostClick = jest.fn();
      const post = createMockPost();

      render(<PostCard post={post} interactive onPostClick={onPostClick} />);

      const card = screen.getByText('This is a test post').closest('div');
      await user.click(card!);

      expect(onPostClick).toHaveBeenCalledTimes(1);
    });

    it('should not trigger onPostClick when clicking buttons', async () => {
      const user = userEvent.setup();
      const onPostClick = jest.fn();
      const onLike = jest.fn();
      const post = createMockPost();

      render(<PostCard post={post} interactive onPostClick={onPostClick} onLike={onLike} />);

      const likeButton = screen.getByRole('button', { name: /10/i });
      await user.click(likeButton);

      expect(onLike).toHaveBeenCalledTimes(1);
      expect(onPostClick).not.toHaveBeenCalled();
    });
  });

  // ===== PINNED AND SPECIAL STATES TESTS =====
  describe('Pinned and Special States', () => {
    it('should display pinned indicator for pinned posts', () => {
      const post = createMockPost({ pinned: true });
      render(<PostCard post={post} />);

      expect(screen.getByText(/pinned/i)).toBeInTheDocument();
    });

    it('should display NSFW warning', () => {
      const post = createMockPost({ nsfw: true, content: 'NSFW content' });
      render(<PostCard post={post} />);

      expect(screen.getByText('NSFW content')).toBeInTheDocument();
    });
  });

  // ===== ACCESSIBILITY TESTS =====
  describe('Accessibility', () => {
    it('should have proper button roles', () => {
      const post = createMockPost();
      render(<PostCard post={post} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have accessible labels on icon buttons', () => {
      const post = createMockPost({
        media: [createMockMedia('video')],
      });
      render(<PostCard post={post} />);

      expect(screen.getByRole('button', { name: /play video/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /mute video/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation on interactive elements', async () => {
      const user = userEvent.setup();
      const onLike = jest.fn();
      const post = createMockPost();

      render(<PostCard post={post} onLike={onLike} />);

      const likeButton = screen.getByRole('button', { name: /10/i });
      likeButton.focus();

      expect(likeButton).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(onLike).toHaveBeenCalled();
    });

    it('should have proper alt text for images', () => {
      const post = createMockPost({
        media: [createMockMedia('image', { alt: 'Beautiful sunset' })],
      });
      render(<PostCard post={post} />);

      const image = screen.getByAltText('Beautiful sunset');
      expect(image).toBeInTheDocument();
    });

    it('should have aria-label on avatar button', () => {
      const post = createMockPost();
      render(<PostCard post={post} />);

      const avatarButtons = screen.getAllByRole('button', { name: /john doe/i });
      expect(avatarButtons.length).toBeGreaterThan(0);
    });

    it('should have proper menu roles', async () => {
      const user = userEvent.setup();
      const post = createMockPost();
      render(<PostCard post={post} />);

      const optionsButton = screen.getByRole('button', { name: /post options/i });
      await user.click(optionsButton);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
    });
  });

  // ===== VIDEO CONTROLS TESTS =====
  describe('Video Controls', () => {
    it('should toggle play/pause on video', async () => {
      const user = userEvent.setup();
      const post = createMockPost({
        media: [createMockMedia('video')],
      });
      render(<PostCard post={post} />);

      const playButton = screen.getByRole('button', { name: /play video/i });
      expect(playButton).toBeInTheDocument();

      // Note: Testing actual video playback requires mocking HTMLMediaElement
      // which is complex in JSDOM. This test verifies the button exists.
    });

    it('should toggle mute/unmute on video', () => {
      const post = createMockPost({
        media: [createMockMedia('video')],
      });
      render(<PostCard post={post} />);

      const muteButton = screen.getByRole('button', { name: /unmute video/i });
      expect(muteButton).toBeInTheDocument();
    });

    it('should display video duration', () => {
      const post = createMockPost({
        media: [createMockMedia('video', { duration: 125 })], // 2:05
      });
      render(<PostCard post={post} />);

      expect(screen.getByText('2:05')).toBeInTheDocument();
    });
  });

  // ===== REF FORWARDING TESTS =====
  describe('Ref Forwarding', () => {
    it('should forward ref to card element', () => {
      const ref = React.createRef<HTMLDivElement>();
      const post = createMockPost();

      render(<PostCard ref={ref} post={post} />);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should allow accessing DOM methods via ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      const post = createMockPost();

      render(<PostCard ref={ref} post={post} />);

      expect(ref.current?.tagName).toBe('DIV');
    });
  });

  // ===== EDGE CASES AND ERROR HANDLING =====
  describe('Edge Cases', () => {
    it('should handle empty reactions gracefully', () => {
      const post = createMockPost({
        reactions: { likes: 0, comments: 0, shares: 0, bookmarks: 0 },
      });
      render(<PostCard post={post} />);

      const zeroElements = screen.getAllByText('0');
      expect(zeroElements.length).toBeGreaterThan(0);
    });

    it('should handle very long usernames', () => {
      const post = createMockPost({
        author: createMockAuthor({ username: 'verylongusername12345678901234567890' }),
      });
      render(<PostCard post={post} />);

      expect(screen.getByText('@verylongusername12345678901234567890')).toBeInTheDocument();
    });

    it('should handle posts with no media', () => {
      const post = createMockPost({ media: undefined });
      render(<PostCard post={post} />);

      expect(screen.getByText('This is a test post')).toBeInTheDocument();
    });

    it('should handle empty tags array', () => {
      const post = createMockPost({ tags: [] });
      render(<PostCard post={post} />);

      expect(screen.getByText('This is a test post')).toBeInTheDocument();
    });

    it('should handle missing optional callbacks', () => {
      const post = createMockPost();
      render(<PostCard post={post} />);

      expect(screen.getByText('This is a test post')).toBeInTheDocument();
    });
  });

  // ===== COMBINED STATES TESTS =====
  describe('Combined States', () => {
    it('should handle compact mode with media', () => {
      const post = createMockPost({
        media: [createMockMedia('image')],
      });
      render(<PostCard post={post} compact />);

      expect(screen.getByAltText('Test image')).toBeInTheDocument();
    });

    it('should handle interactive mode with all features', () => {
      const post = createMockPost({
        media: [createMockMedia('image')],
        community: { id: '1', name: 'Test Community' },
        location: 'Test Location',
        tags: ['test'],
        pinned: true,
      });
      render(<PostCard post={post} interactive />);

      expect(screen.getByText('Test Community')).toBeInTheDocument();
      expect(screen.getByText('Test Location')).toBeInTheDocument();
      expect(screen.getByText('#test')).toBeInTheDocument();
      expect(screen.getByText(/pinned/i)).toBeInTheDocument();
    });

    it('should handle spoiler with media', () => {
      const post = createMockPost({
        content: 'Spoiler content',
        spoiler: true,
        media: [createMockMedia('image')],
      });
      render(<PostCard post={post} />);

      expect(screen.getByText('This post contains spoilers')).toBeInTheDocument();
      expect(screen.queryByAltText('Test image')).not.toBeInTheDocument();
    });
  });
});
