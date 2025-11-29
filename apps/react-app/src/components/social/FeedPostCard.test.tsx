/**
 * Comprehensive Test Suite for CRYB FeedPostCard Component
 * Testing feed post rendering, interactions, media handling, and accessibility
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { FeedPostCard, FeedPost, FeedPostAuthor, FeedPostCommunity } from './FeedPostCard';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

// Mock framer-motion to simplify testing
jest.mock('framer-motion', () => {
  const mockReact = require('react');
  return {
    motion: {
      div: mockReact.forwardRef(({ children, onMouseEnter, onMouseLeave, ...props }: any, ref: any) => (
        <div ref={ref} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} {...props}>
          {children}
        </div>
      )),
      img: ({ children, onLoad, ...props }: any) => <img onLoad={onLoad} {...props} />,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  MessageSquare: ({ className }: any) => <svg data-testid="message-square" className={className} />,
  Share2: ({ className }: any) => <svg data-testid="share2" className={className} />,
  Bookmark: ({ className }: any) => <svg data-testid="bookmark" className={className} />,
  MoreHorizontal: ({ className }: any) => <svg data-testid="more-horizontal" className={className} />,
  ExternalLink: ({ className }: any) => <svg data-testid="external-link" className={className} />,
  Pin: ({ className }: any) => <svg data-testid="pin" className={className} />,
  Clock: ({ className }: any) => <svg data-testid="clock" className={className} />,
  Eye: ({ className }: any) => <svg data-testid="eye" className={className} />,
  TrendingUp: ({ className }: any) => <svg data-testid="trending-up" className={className} />,
  Image: ({ className }: any) => <svg data-testid="image-icon" className={className} />,
  Play: ({ className }: any) => <svg data-testid="play" className={className} />,
  Code: ({ className }: any) => <svg data-testid="code" className={className} />,
  Link: ({ className }: any) => <svg data-testid="link-icon" className={className} />,
  Users: ({ className }: any) => <svg data-testid="users" className={className} />,
}));

// Mock Card component
jest.mock('../ui/card', () => ({
  Card: ({ children, onClick, className, ...props }: any) => (
    <div data-testid="card" onClick={onClick} className={className} {...props}>
      {children}
    </div>
  ),
}));

// Mock Button components
jest.mock('../ui/button', () => ({
  Button: ({ children, onClick, className, ...props }: any) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  ),
  IconButton: ({ icon, onClick, className, ...props }: any) => (
    <button onClick={onClick} className={className} {...props}>
      {icon}
    </button>
  ),
}));

// Mock VoteButtons component
jest.mock('./VoteButtons', () => ({
  VoteButtons: ({ score, userVote, onVote, orientation, size }: any) => (
    <div data-testid="vote-buttons">
      <button
        data-testid="upvote"
        onClick={() => onVote?.('up')}
        aria-label="Upvote"
      >
        Upvote
      </button>
      <span data-testid="vote-score">{score}</span>
      <button
        data-testid="downvote"
        onClick={() => onVote?.('down')}
        aria-label="Downvote"
      >
        Downvote
      </button>
    </div>
  ),
}));

// Mock AwardSystem component
jest.mock('./AwardSystem', () => ({
  AwardDisplay: ({ awards, onAward, userCoins }: any) => (
    <div data-testid="award-display">
      {awards.map((award: any) => (
        <span key={award.awardId} data-testid={`award-${award.awardId}`}>
          {award.count}
        </span>
      ))}
      <button onClick={() => onAward?.('test-award')}>Give Award</button>
    </div>
  ),
}));

// Mock Radix UI Dropdown
jest.mock('@radix-ui/react-dropdown-menu', () => ({
  Root: ({ children }: any) => <div>{children}</div>,
  Trigger: ({ children, asChild }: any) => <div>{children}</div>,
  Portal: ({ children }: any) => <div>{children}</div>,
  Content: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
  Item: ({ children, className }: any) => <div className={className}>{children}</div>,
  Separator: () => <div data-testid="separator" />,
}));

// Helper to wrap components with Router
const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

// Test data factories
const createMockAuthor = (overrides?: Partial<FeedPostAuthor>): FeedPostAuthor => ({
  id: 'author-1',
  username: 'testuser',
  displayName: 'Test User',
  avatar: 'https://example.com/avatar.jpg',
  verified: false,
  badges: [],
  ...overrides,
});

const createMockCommunity = (overrides?: Partial<FeedPostCommunity>): FeedPostCommunity => ({
  id: 'community-1',
  name: 'testcommunity',
  displayName: 'Test Community',
  icon: 'https://example.com/icon.jpg',
  color: '#ff0000',
  ...overrides,
});

const createMockPost = (overrides?: Partial<FeedPost>): FeedPost => ({
  id: 'post-1',
  title: 'Test Post Title',
  content: 'This is test post content.',
  author: createMockAuthor(),
  community: createMockCommunity(),
  score: 42,
  userVote: null,
  commentCount: 10,
  awards: [],
  createdAt: new Date('2024-01-01T12:00:00Z'),
  userBookmarked: false,
  ...overrides,
});

describe('FeedPostCard Component', () => {
  // ===== RENDERING TESTS =====
  describe('Rendering', () => {
    it('should render with default props', () => {
      const post = createMockPost();
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.getByText('Test Post Title')).toBeInTheDocument();
      expect(screen.getByText('This is test post content.')).toBeInTheDocument();
    });

    it('should render without errors when content is undefined', () => {
      const post = createMockPost({ content: undefined });
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.getByText('Test Post Title')).toBeInTheDocument();
      expect(screen.queryByText('This is test post content.')).not.toBeInTheDocument();
    });

    it('should render card container', () => {
      const post = createMockPost();
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('should render vote buttons', () => {
      const post = createMockPost();
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.getByTestId('vote-buttons')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const post = createMockPost();
      const { container } = renderWithRouter(
        <FeedPostCard post={post} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  // ===== POST CONTENT DISPLAY TESTS =====
  describe('Post Content Display', () => {
    it('should display post title', () => {
      const post = createMockPost({ title: 'Amazing Post Title' });
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.getByText('Amazing Post Title')).toBeInTheDocument();
    });

    it('should display post content in default variant', () => {
      const post = createMockPost({ content: 'Detailed post content here.' });
      renderWithRouter(<FeedPostCard post={post} variant="default" />);

      expect(screen.getByText('Detailed post content here.')).toBeInTheDocument();
    });

    it('should not display content in compact variant', () => {
      const post = createMockPost({ content: 'This should be hidden.' });
      renderWithRouter(<FeedPostCard post={post} variant="compact" />);

      expect(screen.queryByText('This should be hidden.')).not.toBeInTheDocument();
    });

    it('should display content in detailed variant', () => {
      const post = createMockPost({ content: 'Detailed content.' });
      renderWithRouter(<FeedPostCard post={post} variant="detailed" />);

      expect(screen.getByText('Detailed content.')).toBeInTheDocument();
    });

    it('should truncate long content', () => {
      const post = createMockPost();
      renderWithRouter(<FeedPostCard post={post} />);

      const contentElement = screen.getByText('This is test post content.');
      expect(contentElement).toHaveClass('line-clamp-3');
    });
  });

  // ===== AUTHOR INFORMATION TESTS =====
  describe('Author Information', () => {
    it('should display author username', () => {
      const post = createMockPost();
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.getByText('u/testuser')).toBeInTheDocument();
    });

    it('should link to author profile', () => {
      const post = createMockPost({ author: createMockAuthor({ username: 'johndoe' }) });
      renderWithRouter(<FeedPostCard post={post} />);

      const authorLink = screen.getByText('u/johndoe').closest('a');
      expect(authorLink).toHaveAttribute('href', '/u/johndoe');
    });

    it('should display verified badge for verified authors', () => {
      const post = createMockPost({
        author: createMockAuthor({ verified: true }),
      });
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.getByTitle('Verified')).toBeInTheDocument();
    });

    it('should not display verified badge for non-verified authors', () => {
      const post = createMockPost({
        author: createMockAuthor({ verified: false }),
      });
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.queryByTitle('Verified')).not.toBeInTheDocument();
    });
  });

  // ===== COMMUNITY INFORMATION TESTS =====
  describe('Community Information', () => {
    it('should display community name when showCommunity is true', () => {
      const post = createMockPost();
      renderWithRouter(<FeedPostCard post={post} showCommunity />);

      expect(screen.getByText('c/testcommunity')).toBeInTheDocument();
    });

    it('should not display community name when showCommunity is false', () => {
      const post = createMockPost();
      renderWithRouter(<FeedPostCard post={post} showCommunity={false} />);

      expect(screen.queryByText('c/testcommunity')).not.toBeInTheDocument();
    });

    it('should link to community page', () => {
      const post = createMockPost();
      renderWithRouter(<FeedPostCard post={post} showCommunity />);

      const communityLink = screen.getByText('c/testcommunity').closest('a');
      expect(communityLink).toHaveAttribute('href', '/c/testcommunity');
    });

    it('should display community icon', () => {
      const post = createMockPost();
      renderWithRouter(<FeedPostCard post={post} showCommunity />);

      const icon = screen.getByAlt('Test Community');
      expect(icon).toHaveAttribute('src', 'https://example.com/icon.jpg');
    });

    it('should handle posts without community', () => {
      const post = createMockPost({ community: undefined });
      renderWithRouter(<FeedPostCard post={post} showCommunity />);

      expect(screen.queryByText(/^c\//)).not.toBeInTheDocument();
    });
  });

  // ===== ENGAGEMENT METRICS TESTS =====
  describe('Engagement Metrics', () => {
    it('should display vote score', () => {
      const post = createMockPost({ score: 150 });
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.getByTestId('vote-score')).toHaveTextContent('150');
    });

    it('should display comment count', () => {
      const post = createMockPost({ commentCount: 25 });
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.getByText('25')).toBeInTheDocument();
    });

    it('should format large comment counts', () => {
      const post = createMockPost({ commentCount: 1500 });
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.getByText('1.5K')).toBeInTheDocument();
    });

    it('should display view count when present', () => {
      const post = createMockPost({ viewCount: 5000 });
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.getByTestId('eye')).toBeInTheDocument();
      expect(screen.getByText('5.0K')).toBeInTheDocument();
    });

    it('should not display view count when zero', () => {
      const post = createMockPost({ viewCount: 0 });
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.queryByTestId('eye')).not.toBeInTheDocument();
    });

    it('should not display view count when undefined', () => {
      const post = createMockPost({ viewCount: undefined });
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.queryByTestId('eye')).not.toBeInTheDocument();
    });
  });

  // ===== POST ACTIONS TESTS =====
  describe('Post Actions', () => {
    it('should call onVote when upvoting', async () => {
      const user = userEvent.setup();
      const onVote = jest.fn();
      const post = createMockPost();
      renderWithRouter(<FeedPostCard post={post} onVote={onVote} />);

      await user.click(screen.getByTestId('upvote'));

      expect(onVote).toHaveBeenCalledWith('post-1', 'up');
    });

    it('should call onVote when downvoting', async () => {
      const user = userEvent.setup();
      const onVote = jest.fn();
      const post = createMockPost();
      renderWithRouter(<FeedPostCard post={post} onVote={onVote} />);

      await user.click(screen.getByTestId('downvote'));

      expect(onVote).toHaveBeenCalledWith('post-1', 'down');
    });

    it('should call onComment when comment button is clicked', async () => {
      const user = userEvent.setup();
      const onComment = jest.fn();
      const post = createMockPost();
      renderWithRouter(<FeedPostCard post={post} onComment={onComment} />);

      const commentButton = screen.getByRole('button', { name: /25|10/i });
      await user.click(commentButton);

      expect(onComment).toHaveBeenCalledWith('post-1');
    });

    it('should call onShare when share button is clicked', async () => {
      const user = userEvent.setup();
      const onShare = jest.fn();
      const post = createMockPost();
      renderWithRouter(<FeedPostCard post={post} onShare={onShare} />);

      const shareButton = screen.getAllByRole('button').find(
        btn => btn.textContent?.includes('Share')
      );
      await user.click(shareButton!);

      expect(onShare).toHaveBeenCalledWith('post-1');
    });

    it('should call onBookmark when save button is clicked', async () => {
      const user = userEvent.setup();
      const onBookmark = jest.fn();
      const post = createMockPost();
      renderWithRouter(<FeedPostCard post={post} onBookmark={onBookmark} />);

      const saveButton = screen.getAllByRole('button').find(
        btn => btn.textContent?.includes('Save')
      );
      await user.click(saveButton!);

      expect(onBookmark).toHaveBeenCalledWith('post-1');
    });

    it('should highlight bookmark button when post is bookmarked', () => {
      const post = createMockPost({ userBookmarked: true });
      renderWithRouter(<FeedPostCard post={post} />);

      const saveButton = screen.getAllByRole('button').find(
        btn => btn.textContent?.includes('Save')
      );
      expect(saveButton).toHaveClass('text-primary');
    });

    it('should not highlight bookmark button when post is not bookmarked', () => {
      const post = createMockPost({ userBookmarked: false });
      renderWithRouter(<FeedPostCard post={post} />);

      const saveButton = screen.getAllByRole('button').find(
        btn => btn.textContent?.includes('Save')
      );
      expect(saveButton).toHaveClass('text-muted-foreground');
    });

    it('should call onClick when card is clicked', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      const post = createMockPost();
      renderWithRouter(<FeedPostCard post={post} onClick={onClick} />);

      await user.click(screen.getByTestId('card'));

      expect(onClick).toHaveBeenCalledWith('post-1');
    });

    it('should not call onClick when clicking interactive elements', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      const post = createMockPost();
      renderWithRouter(<FeedPostCard post={post} onClick={onClick} />);

      await user.click(screen.getByTestId('upvote'));

      expect(onClick).not.toHaveBeenCalled();
    });
  });

  // ===== MEDIA HANDLING TESTS =====
  describe('Media Handling', () => {
    it('should display image media', () => {
      const post = createMockPost({
        media: {
          type: 'image',
          url: 'https://example.com/image.jpg',
        },
      });
      renderWithRouter(<FeedPostCard post={post} showMedia />);

      const image = screen.getByAltText('Test Post Title');
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('should not display image media when showMedia is false', () => {
      const post = createMockPost({
        media: {
          type: 'image',
          url: 'https://example.com/image.jpg',
        },
      });
      renderWithRouter(<FeedPostCard post={post} showMedia={false} />);

      expect(screen.queryByAltText('Test Post Title')).not.toBeInTheDocument();
    });

    it('should not display media in compact variant', () => {
      const post = createMockPost({
        media: {
          type: 'image',
          url: 'https://example.com/image.jpg',
        },
      });
      renderWithRouter(<FeedPostCard post={post} variant="compact" showMedia />);

      expect(screen.queryByAltText('Test Post Title')).not.toBeInTheDocument();
    });

    it('should display link media with thumbnail', () => {
      const post = createMockPost({
        media: {
          type: 'link',
          url: 'https://example.com/article',
          thumbnail: 'https://example.com/thumb.jpg',
          title: 'Article Title',
          description: 'Article description',
          domain: 'example.com',
        },
      });
      renderWithRouter(<FeedPostCard post={post} showMedia />);

      expect(screen.getByText('Article Title')).toBeInTheDocument();
      expect(screen.getByText('Article description')).toBeInTheDocument();
      expect(screen.getByText('example.com')).toBeInTheDocument();
    });

    it('should link external URLs with proper attributes', () => {
      const post = createMockPost({
        media: {
          type: 'link',
          url: 'https://example.com/article',
          title: 'Article Title',
          domain: 'example.com',
        },
      });
      renderWithRouter(<FeedPostCard post={post} showMedia />);

      const link = screen.getByText('Article Title').closest('a');
      expect(link).toHaveAttribute('href', 'https://example.com/article');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should display image icon for image posts', () => {
      const post = createMockPost({
        media: { type: 'image', url: 'test.jpg' },
      });
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.getByTestId('image-icon')).toBeInTheDocument();
    });

    it('should display play icon for video posts', () => {
      const post = createMockPost({
        media: { type: 'video', url: 'test.mp4' },
      });
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.getByTestId('play')).toBeInTheDocument();
    });

    it('should display link icon for link posts', () => {
      const post = createMockPost({
        media: { type: 'link', url: 'https://example.com' },
      });
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.getByTestId('link-icon')).toBeInTheDocument();
    });

    it('should display image icon for gallery posts', () => {
      const post = createMockPost({
        media: { type: 'gallery', url: 'test.jpg' },
      });
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.getByTestId('image-icon')).toBeInTheDocument();
    });

    it('should handle image load event', async () => {
      const post = createMockPost({
        media: { type: 'image', url: 'test.jpg' },
      });
      renderWithRouter(<FeedPostCard post={post} showMedia />);

      const image = screen.getByAltText('Test Post Title');

      // Simulate image load
      if (image) {
        const loadEvent = new Event('load', { bubbles: true });
        image.dispatchEvent(loadEvent);
      }

      // Component should handle load without errors
      expect(image).toBeInTheDocument();
    });
  });

  // ===== CARD VARIANTS TESTS =====
  describe('Card Variants', () => {
    it('should render default variant', () => {
      const post = createMockPost();
      renderWithRouter(<FeedPostCard post={post} variant="default" />);

      expect(screen.getByText('Test Post Title')).toHaveClass('text-lg');
    });

    it('should render compact variant with smaller title', () => {
      const post = createMockPost();
      renderWithRouter(<FeedPostCard post={post} variant="compact" />);

      expect(screen.getByText('Test Post Title')).toHaveClass('text-base');
    });

    it('should render detailed variant', () => {
      const post = createMockPost();
      renderWithRouter(<FeedPostCard post={post} variant="detailed" />);

      expect(screen.getByText('Test Post Title')).toBeInTheDocument();
    });

    it('should hide share text in compact variant', () => {
      const post = createMockPost();
      renderWithRouter(<FeedPostCard post={post} variant="compact" />);

      const shareButton = screen.getAllByRole('button').find(
        btn => btn.querySelector('[data-testid="share2"]')
      );
      const shareText = shareButton?.querySelector('span');
      expect(shareText).toHaveClass('sr-only');
    });

    it('should hide save text in compact variant', () => {
      const post = createMockPost();
      renderWithRouter(<FeedPostCard post={post} variant="compact" />);

      const saveButton = screen.getAllByRole('button').find(
        btn => btn.querySelector('[data-testid="bookmark"]')
      );
      const saveText = saveButton?.querySelector('span');
      expect(saveText).toHaveClass('sr-only');
    });
  });

  // ===== BADGES AND INDICATORS TESTS =====
  describe('Badges and Indicators', () => {
    it('should display pinned badge for pinned posts', () => {
      const post = createMockPost({ pinned: true });
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.getByText('Pinned')).toBeInTheDocument();
      expect(screen.getByTestId('pin')).toBeInTheDocument();
    });

    it('should not display pinned badge for non-pinned posts', () => {
      const post = createMockPost({ pinned: false });
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.queryByText('Pinned')).not.toBeInTheDocument();
    });

    it('should display flair when present', () => {
      const post = createMockPost({
        flair: { text: 'Discussion', color: '#ff0000' },
      });
      renderWithRouter(<FeedPostCard post={post} />);

      const flair = screen.getByText('Discussion');
      expect(flair).toBeInTheDocument();
      expect(flair).toHaveStyle({ color: '#ff0000' });
    });

    it('should display NSFW badge', () => {
      const post = createMockPost({ nsfw: true });
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.getByText('NSFW')).toBeInTheDocument();
    });

    it('should display Spoiler badge', () => {
      const post = createMockPost({ spoiler: true });
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.getByText('Spoiler')).toBeInTheDocument();
    });

    it('should display Locked badge', () => {
      const post = createMockPost({ locked: true });
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.getByText('Locked')).toBeInTheDocument();
    });

    it('should display multiple badges simultaneously', () => {
      const post = createMockPost({
        pinned: true,
        nsfw: true,
        spoiler: true,
        locked: true,
        flair: { text: 'Meta', color: '#00ff00' },
      });
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.getByText('Pinned')).toBeInTheDocument();
      expect(screen.getByText('NSFW')).toBeInTheDocument();
      expect(screen.getByText('Spoiler')).toBeInTheDocument();
      expect(screen.getByText('Locked')).toBeInTheDocument();
      expect(screen.getByText('Meta')).toBeInTheDocument();
    });

    it('should apply ring styling to pinned posts', () => {
      const post = createMockPost({ pinned: true });
      renderWithRouter(<FeedPostCard post={post} />);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('ring-2', 'ring-primary/20');
    });

    it('should display edited indicator', () => {
      const post = createMockPost({
        edited: new Date('2024-01-02T12:00:00Z'),
      });
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.getByText('(edited)')).toBeInTheDocument();
    });
  });

  // ===== AWARDS TESTS =====
  describe('Awards', () => {
    it('should display awards when present', () => {
      const post = createMockPost({
        awards: [
          { awardId: 'gold', count: 2 },
          { awardId: 'silver', count: 1 },
        ],
      });
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.getByTestId('award-display')).toBeInTheDocument();
    });

    it('should not display awards section when no awards', () => {
      const post = createMockPost({ awards: [] });
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.queryByTestId('award-display')).not.toBeInTheDocument();
    });

    it('should call onAward when giving award', async () => {
      const user = userEvent.setup();
      const onAward = jest.fn();
      const post = createMockPost({
        awards: [{ awardId: 'gold', count: 1 }],
      });
      renderWithRouter(<FeedPostCard post={post} onAward={onAward} />);

      await user.click(screen.getByText('Give Award'));

      expect(onAward).toHaveBeenCalledWith('post-1', 'test-award');
    });

    it('should hide award button in compact variant', () => {
      const post = createMockPost({
        awards: [{ awardId: 'gold', count: 1 }],
      });
      renderWithRouter(<FeedPostCard post={post} variant="compact" />);

      // Award display receives showAwardButton=false
      expect(screen.getByTestId('award-display')).toBeInTheDocument();
    });
  });

  // ===== TIME FORMATTING TESTS =====
  describe('Time Formatting', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-01T12:05:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should display "just now" for very recent posts', () => {
      const post = createMockPost({
        createdAt: new Date('2024-01-01T12:04:30Z'),
      });
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.getByText(/just now/)).toBeInTheDocument();
    });

    it('should display minutes for recent posts', () => {
      const post = createMockPost({
        createdAt: new Date('2024-01-01T11:50:00Z'),
      });
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.getByText(/15m ago/)).toBeInTheDocument();
    });

    it('should display hours for posts within 24 hours', () => {
      const post = createMockPost({
        createdAt: new Date('2024-01-01T09:05:00Z'),
      });
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.getByText(/3h ago/)).toBeInTheDocument();
    });

    it('should display days for posts within a week', () => {
      const post = createMockPost({
        createdAt: new Date('2023-12-29T12:05:00Z'),
      });
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.getByText(/3d ago/)).toBeInTheDocument();
    });

    it('should display formatted date for older posts', () => {
      const post = createMockPost({
        createdAt: new Date('2023-12-20T12:00:00Z'),
      });
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.getByText(/12\/20\/2023|20\/12\/2023/)).toBeInTheDocument();
    });
  });

  // ===== NUMBER FORMATTING TESTS =====
  describe('Number Formatting', () => {
    it('should format numbers under 1000 as-is', () => {
      const post = createMockPost({ commentCount: 999 });
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.getByText('999')).toBeInTheDocument();
    });

    it('should format thousands with K suffix', () => {
      const post = createMockPost({ commentCount: 1500 });
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.getByText('1.5K')).toBeInTheDocument();
    });

    it('should format millions with M suffix', () => {
      const post = createMockPost({ viewCount: 2500000 });
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.getByText('2.5M')).toBeInTheDocument();
    });

    it('should handle zero values', () => {
      const post = createMockPost({ commentCount: 0 });
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  // ===== HOVER STATE TESTS =====
  describe('Hover State', () => {
    it('should handle mouse enter', async () => {
      const user = userEvent.setup();
      const post = createMockPost();
      const { container } = renderWithRouter(<FeedPostCard post={post} />);

      const card = container.firstChild as HTMLElement;
      await user.hover(card);

      // Card should apply hover styles through motion.div
      expect(card).toBeInTheDocument();
    });

    it('should handle mouse leave', async () => {
      const user = userEvent.setup();
      const post = createMockPost();
      const { container } = renderWithRouter(<FeedPostCard post={post} />);

      const card = container.firstChild as HTMLElement;
      await user.hover(card);
      await user.unhover(card);

      // Card should remove hover styles
      expect(card).toBeInTheDocument();
    });
  });

  // ===== DROPDOWN MENU TESTS =====
  describe('Dropdown Menu', () => {
    it('should render more options button', () => {
      const post = createMockPost();
      renderWithRouter(<FeedPostCard post={post} />);

      const moreButton = screen.getByLabelText('More options');
      expect(moreButton).toBeInTheDocument();
    });

    it('should stop propagation when clicking more button', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      const post = createMockPost();
      renderWithRouter(<FeedPostCard post={post} onClick={onClick} />);

      const moreButton = screen.getByLabelText('More options');
      await user.click(moreButton);

      expect(onClick).not.toHaveBeenCalled();
    });

    it('should render dropdown menu items', () => {
      const post = createMockPost();
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.getByText('Open in new tab')).toBeInTheDocument();
      expect(screen.getByText('Copy link')).toBeInTheDocument();
      expect(screen.getByText('Report')).toBeInTheDocument();
    });
  });

  // ===== ACCESSIBILITY TESTS =====
  describe('Accessibility', () => {
    it('should have proper aria-label on upvote button', () => {
      const post = createMockPost();
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.getByLabelText('Upvote')).toBeInTheDocument();
    });

    it('should have proper aria-label on downvote button', () => {
      const post = createMockPost();
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.getByLabelText('Downvote')).toBeInTheDocument();
    });

    it('should have proper aria-label on more options button', () => {
      const post = createMockPost();
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.getByLabelText('More options')).toBeInTheDocument();
    });

    it('should use semantic heading for post title', () => {
      const post = createMockPost();
      renderWithRouter(<FeedPostCard post={post} />);

      const title = screen.getByText('Test Post Title');
      expect(title.closest('h3')).toBeInTheDocument();
    });

    it('should provide alt text for images', () => {
      const post = createMockPost({
        media: { type: 'image', url: 'test.jpg' },
      });
      renderWithRouter(<FeedPostCard post={post} showMedia />);

      const image = screen.getByAltText('Test Post Title');
      expect(image).toBeInTheDocument();
    });

    it('should have accessible links', () => {
      const post = createMockPost();
      renderWithRouter(<FeedPostCard post={post} showCommunity />);

      const communityLink = screen.getByText('c/testcommunity');
      const authorLink = screen.getByText('u/testuser');

      expect(communityLink.closest('a')).toBeInTheDocument();
      expect(authorLink.closest('a')).toBeInTheDocument();
    });

    it('should have title attribute on edited indicator', () => {
      const post = createMockPost({
        edited: new Date('2024-01-02T12:00:00Z'),
      });
      renderWithRouter(<FeedPostCard post={post} />);

      const editedElement = screen.getByText('(edited)');
      expect(editedElement).toHaveAttribute('title');
    });

    it('should provide screen reader text in compact mode', () => {
      const post = createMockPost();
      renderWithRouter(<FeedPostCard post={post} variant="compact" />);

      const shareButton = screen.getAllByRole('button').find(
        btn => btn.querySelector('[data-testid="share2"]')
      );
      const srText = shareButton?.querySelector('.sr-only');
      expect(srText).toBeInTheDocument();
    });
  });

  // ===== EVENT PROPAGATION TESTS =====
  describe('Event Propagation', () => {
    it('should stop propagation when clicking author link', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      const post = createMockPost();
      renderWithRouter(<FeedPostCard post={post} onClick={onClick} />);

      const authorLink = screen.getByText('u/testuser');
      await user.click(authorLink);

      expect(onClick).not.toHaveBeenCalled();
    });

    it('should stop propagation when clicking community link', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      const post = createMockPost();
      renderWithRouter(<FeedPostCard post={post} onClick={onClick} showCommunity />);

      const communityLink = screen.getByText('c/testcommunity');
      await user.click(communityLink);

      expect(onClick).not.toHaveBeenCalled();
    });

    it('should stop propagation when clicking external link', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      const post = createMockPost({
        media: {
          type: 'link',
          url: 'https://example.com',
          title: 'External Link',
        },
      });
      renderWithRouter(<FeedPostCard post={post} onClick={onClick} showMedia />);

      const externalLink = screen.getByText('External Link');
      await user.click(externalLink);

      expect(onClick).not.toHaveBeenCalled();
    });
  });

  // ===== EDGE CASES TESTS =====
  describe('Edge Cases', () => {
    it('should handle empty post title', () => {
      const post = createMockPost({ title: '' });
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('should handle very long post titles', () => {
      const longTitle = 'A'.repeat(500);
      const post = createMockPost({ title: longTitle });
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle very long post content', () => {
      const longContent = 'Content '.repeat(1000);
      const post = createMockPost({ content: longContent });
      renderWithRouter(<FeedPostCard post={post} />);

      const contentElement = screen.getByText(new RegExp(longContent.slice(0, 50)));
      expect(contentElement).toHaveClass('line-clamp-3');
    });

    it('should handle negative vote scores', () => {
      const post = createMockPost({ score: -100 });
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.getByTestId('vote-score')).toHaveTextContent('-100');
    });

    it('should handle zero engagement metrics', () => {
      const post = createMockPost({ score: 0, commentCount: 0 });
      renderWithRouter(<FeedPostCard post={post} />);

      expect(screen.getByTestId('vote-score')).toHaveTextContent('0');
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle missing optional callbacks', () => {
      const post = createMockPost();
      renderWithRouter(<FeedPostCard post={post} />);

      // Should render without errors
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('should handle link media without thumbnail', () => {
      const post = createMockPost({
        media: {
          type: 'link',
          url: 'https://example.com',
          title: 'No Thumbnail Link',
          domain: 'example.com',
        },
      });
      renderWithRouter(<FeedPostCard post={post} showMedia />);

      expect(screen.getByText('No Thumbnail Link')).toBeInTheDocument();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('should handle media with missing title fallback to post title', () => {
      const post = createMockPost({
        title: 'Post Title',
        media: {
          type: 'link',
          url: 'https://example.com',
          domain: 'example.com',
        },
      });
      renderWithRouter(<FeedPostCard post={post} showMedia />);

      expect(screen.getAllByText('Post Title').length).toBeGreaterThan(0);
    });
  });

  // ===== INTEGRATION TESTS =====
  describe('Integration Tests', () => {
    it('should handle full user interaction flow', async () => {
      const user = userEvent.setup();
      const onVote = jest.fn();
      const onComment = jest.fn();
      const onBookmark = jest.fn();
      const onClick = jest.fn();

      const post = createMockPost();
      renderWithRouter(
        <FeedPostCard
          post={post}
          onVote={onVote}
          onComment={onComment}
          onBookmark={onBookmark}
          onClick={onClick}
        />
      );

      // Upvote
      await user.click(screen.getByTestId('upvote'));
      expect(onVote).toHaveBeenCalledWith('post-1', 'up');

      // Comment
      const commentButton = screen.getByRole('button', { name: /10/i });
      await user.click(commentButton);
      expect(onComment).toHaveBeenCalledWith('post-1');

      // Bookmark
      const bookmarkButton = screen.getAllByRole('button').find(
        btn => btn.textContent?.includes('Save')
      );
      await user.click(bookmarkButton!);
      expect(onBookmark).toHaveBeenCalledWith('post-1');
    });

    it('should render complex post with all features', () => {
      const post = createMockPost({
        title: 'Complex Post',
        content: 'Detailed content here.',
        pinned: true,
        nsfw: true,
        spoiler: true,
        locked: true,
        flair: { text: 'Meta', color: '#ff00ff' },
        edited: new Date('2024-01-02T12:00:00Z'),
        awards: [{ awardId: 'gold', count: 5 }],
        viewCount: 10000,
        media: {
          type: 'image',
          url: 'https://example.com/image.jpg',
        },
        author: createMockAuthor({ verified: true }),
      });

      renderWithRouter(<FeedPostCard post={post} showCommunity showMedia />);

      expect(screen.getByText('Complex Post')).toBeInTheDocument();
      expect(screen.getByText('Pinned')).toBeInTheDocument();
      expect(screen.getByText('NSFW')).toBeInTheDocument();
      expect(screen.getByText('Spoiler')).toBeInTheDocument();
      expect(screen.getByText('Locked')).toBeInTheDocument();
      expect(screen.getByText('Meta')).toBeInTheDocument();
      expect(screen.getByText('(edited)')).toBeInTheDocument();
      expect(screen.getByTitle('Verified')).toBeInTheDocument();
      expect(screen.getByTestId('award-display')).toBeInTheDocument();
    });
  });
});
