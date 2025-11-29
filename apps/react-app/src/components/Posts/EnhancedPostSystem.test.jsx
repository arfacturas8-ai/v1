import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import EnhancedPostsFeed, { EnhancedPost, POST_TYPES } from './EnhancedPostSystem';
import reactionService from '../../services/reactionService';

// Mock all dependencies
vi.mock('../../services/reactionService', () => ({
  default: {
    getReactions: vi.fn(),
    toggleReaction: vi.fn(),
    joinContentRoom: vi.fn(),
    leaveContentRoom: vi.fn(),
  }
}));

vi.mock('../reactions/ReactionBar', () => ({
  default: ({ onReactionToggle, reactions, userReactions, totalReactions }) => (
    <div data-testid="reaction-bar">
      <button onClick={() => onReactionToggle({ type: 'like' }, false)}>Like</button>
      <span data-testid="total-reactions">{totalReactions}</span>
      <span data-testid="user-reactions">{JSON.stringify(userReactions)}</span>
    </div>
  )
}));

vi.mock('../reactions/ReactionPicker', () => ({
  default: () => <div data-testid="reaction-picker">Reaction Picker</div>
}));

vi.mock('../reactions/ReactionAnalytics', () => ({
  default: ({ contentType, contentId, showChart }) => (
    <div data-testid="reaction-analytics">
      Analytics for {contentType} {contentId}
      {showChart && <div data-testid="analytics-chart">Chart</div>}
    </div>
  )
}));

vi.mock('../FileUpload/FileUploadSystem', () => ({
  default: () => <div data-testid="file-upload">File Upload</div>,
  FileAttachment: ({ attachment, compact }) => (
    <div data-testid="file-attachment" data-compact={compact}>
      {attachment.name}
    </div>
  )
}));

vi.mock('../Comments/ThreadedComments', () => ({
  default: ({ comments, onAddComment, onReply, onEdit, onDelete, placeholder }) => (
    <div data-testid="threaded-comments">
      <textarea
        data-testid="comment-input"
        placeholder={placeholder}
        onChange={(e) => {}}
      />
      <button onClick={() => onAddComment('Test comment')}>Add Comment</button>
      <div data-testid="comments-list">
        {comments.map(comment => (
          <div key={comment.id} data-testid={`comment-${comment.id}`}>
            {comment.content}
            <button onClick={() => onReply(comment.id, 'Reply')}>Reply</button>
            <button onClick={() => onEdit(comment.id, 'Edited')}>Edit</button>
            <button onClick={() => onDelete(comment.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  )
}));

vi.mock('../ui/Card', () => ({
  Card: ({ children, variant, hoverEffect, className, onClick }) => (
    <div data-testid="card" data-variant={variant} data-hover={hoverEffect} className={className} onClick={onClick}>
      {children}
    </div>
  ),
  CardHeader: ({ children, className }) => (
    <div data-testid="card-header" className={className}>{children}</div>
  ),
  CardTitle: ({ children, className }) => (
    <h3 data-testid="card-title" className={className}>{children}</h3>
  ),
  CardDescription: ({ children, className }) => (
    <p data-testid="card-description" className={className}>{children}</p>
  ),
  CardContent: ({ children, className }) => (
    <div data-testid="card-content" className={className}>{children}</div>
  ),
  CardFooter: ({ children, className }) => (
    <div data-testid="card-footer" className={className}>{children}</div>
  )
}));

vi.mock('../ui/Button', () => ({
  Button: ({ children, onClick, variant, size, leftIcon, className, disabled }) => (
    <button
      onClick={onClick}
      data-variant={variant}
      data-size={size}
      className={className}
      disabled={disabled}
    >
      {leftIcon}
      {children}
    </button>
  ),
  IconButton: ({ children, onClick, variant, size, 'aria-label': ariaLabel, disabled }) => (
    <button
      onClick={onClick}
      data-variant={variant}
      data-size={size}
      aria-label={ariaLabel}
      disabled={disabled}
    >
      {children}
    </button>
  )
}));

const mockCurrentUser = {
  id: 'user1',
  username: 'TestUser',
  avatar: 'https://example.com/avatar.jpg',
  reputation: 1500
};

const mockPost = {
  id: 'post1',
  type: 'DISCUSSION',
  title: 'Test Post Title',
  content: 'This is test post content',
  author: {
    id: 'author1',
    username: 'AuthorUser',
    avatar: 'https://example.com/author.jpg',
    reputation: 2000
  },
  timestamp: new Date('2025-01-01T12:00:00Z').toISOString(),
  views: 150,
  commentCount: 5,
  tags: ['test', 'discussion', 'react'],
  attachments: [],
  comments: [],
  rewards: 0
};

const mockReactionsData = {
  summary: {
    like_count: 10,
    love_count: 5,
    laugh_count: 2,
    wow_count: 1,
    sad_count: 0,
    angry_count: 0,
    fire_count: 3,
    rocket_count: 4,
    heart_eyes_count: 2,
    thinking_count: 1,
    clap_count: 6,
    thumbs_up_count: 8,
    thumbs_down_count: 1,
    upvote_count: 12,
    downvote_count: 2
  },
  userReactions: [{ reaction_type: 'like' }],
  reactions: [
    {
      user_id: 'user1',
      username: 'TestUser',
      display_name: 'Test User',
      avatar: 'avatar.jpg',
      reaction_type: 'like'
    }
  ]
};

describe('EnhancedPost Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reactionService.getReactions.mockResolvedValue(mockReactionsData);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Post Rendering', () => {
    it('should render post with all basic information', () => {
      render(
        <EnhancedPost
          post={mockPost}
          currentUser={mockCurrentUser}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      expect(screen.getByText('Test Post Title')).toBeInTheDocument();
      expect(screen.getByText('This is test post content')).toBeInTheDocument();
      expect(screen.getByText('AuthorUser')).toBeInTheDocument();
    });

    it('should render post type badge with correct styling', () => {
      render(
        <EnhancedPost
          post={mockPost}
          currentUser={mockCurrentUser}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      expect(screen.getByText('Discussion')).toBeInTheDocument();
    });

    it('should display author avatar when provided', () => {
      render(
        <EnhancedPost
          post={mockPost}
          currentUser={mockCurrentUser}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      const avatar = screen.getByAltText('AuthorUser');
      expect(avatar).toHaveAttribute('src', 'https://example.com/author.jpg');
    });

    it('should display author initial when avatar not provided', () => {
      const postWithoutAvatar = { ...mockPost, author: { ...mockPost.author, avatar: null } };

      render(
        <EnhancedPost
          post={postWithoutAvatar}
          currentUser={mockCurrentUser}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('should format and display author reputation', () => {
      render(
        <EnhancedPost
          post={mockPost}
          currentUser={mockCurrentUser}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      expect(screen.getByText('2.0k rep')).toBeInTheDocument();
    });

    it('should display view count', () => {
      render(
        <EnhancedPost
          post={mockPost}
          currentUser={mockCurrentUser}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      expect(screen.getByText('150')).toBeInTheDocument();
    });

    it('should display formatted view count for large numbers', () => {
      const postWithManyViews = { ...mockPost, views: 1500 };

      render(
        <EnhancedPost
          post={postWithManyViews}
          currentUser={mockCurrentUser}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      expect(screen.getByText('1.5k')).toBeInTheDocument();
    });

    it('should render post tags when provided', () => {
      render(
        <EnhancedPost
          post={mockPost}
          currentUser={mockCurrentUser}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      expect(screen.getByText('test')).toBeInTheDocument();
      expect(screen.getByText('discussion')).toBeInTheDocument();
      expect(screen.getByText('react')).toBeInTheDocument();
    });

    it('should limit displayed tags to 3 and show count', () => {
      const postWithManyTags = { ...mockPost, tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'] };

      render(
        <EnhancedPost
          post={postWithManyTags}
          currentUser={mockCurrentUser}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
      expect(screen.getByText('tag3')).toBeInTheDocument();
      expect(screen.getByText('+2')).toBeInTheDocument();
    });

    it('should render in compact mode when specified', () => {
      render(
        <EnhancedPost
          post={mockPost}
          currentUser={mockCurrentUser}
          onReaction={vi.fn()}
          onComment={vi.fn()}
          compact={true}
        />
      );

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('compact');
      expect(screen.queryByText('This is test post content')).not.toBeInTheDocument();
    });

    it('should render attachments when provided', () => {
      const postWithAttachments = {
        ...mockPost,
        attachments: [
          { id: 'att1', name: 'document.pdf', type: 'pdf' },
          { id: 'att2', name: 'image.jpg', type: 'image' }
        ]
      };

      render(
        <EnhancedPost
          post={postWithAttachments}
          currentUser={mockCurrentUser}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      expect(screen.getByText('document.pdf')).toBeInTheDocument();
      expect(screen.getByText('image.jpg')).toBeInTheDocument();
    });

    it('should display rewards when greater than 0', () => {
      const postWithRewards = { ...mockPost, rewards: 100 };

      render(
        <EnhancedPost
          post={postWithRewards}
          currentUser={mockCurrentUser}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      expect(screen.getByText('100 CRYB')).toBeInTheDocument();
    });

    it('should not display rewards section when 0', () => {
      render(
        <EnhancedPost
          post={mockPost}
          currentUser={mockCurrentUser}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      expect(screen.queryByText(/CRYB/)).not.toBeInTheDocument();
    });
  });

  describe('Reaction System Integration', () => {
    it('should load reactions on mount', async () => {
      render(
        <EnhancedPost
          post={mockPost}
          currentUser={mockCurrentUser}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(reactionService.getReactions).toHaveBeenCalledWith('post', 'post1');
      });
    });

    it('should join reaction room on mount', () => {
      render(
        <EnhancedPost
          post={mockPost}
          currentUser={mockCurrentUser}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      expect(reactionService.joinContentRoom).toHaveBeenCalledWith('post', 'post1');
    });

    it('should leave reaction room on unmount', () => {
      const { unmount } = render(
        <EnhancedPost
          post={mockPost}
          currentUser={mockCurrentUser}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      unmount();

      expect(reactionService.leaveContentRoom).toHaveBeenCalledWith('post', 'post1');
    });

    it('should render reaction bar with correct data', async () => {
      render(
        <EnhancedPost
          post={mockPost}
          currentUser={mockCurrentUser}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('reaction-bar')).toBeInTheDocument();
      });
    });

    it('should handle reaction toggle', async () => {
      reactionService.toggleReaction.mockResolvedValue({});

      render(
        <EnhancedPost
          post={mockPost}
          currentUser={mockCurrentUser}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      const likeButton = await screen.findByText('Like');
      fireEvent.click(likeButton);

      await waitFor(() => {
        expect(reactionService.toggleReaction).toHaveBeenCalledWith('post', 'post1', 'like', false);
      });
    });

    it('should prevent multiple simultaneous reaction toggles', async () => {
      reactionService.toggleReaction.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(
        <EnhancedPost
          post={mockPost}
          currentUser={mockCurrentUser}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      const likeButton = await screen.findByText('Like');
      fireEvent.click(likeButton);
      fireEvent.click(likeButton);

      await waitFor(() => {
        expect(reactionService.toggleReaction).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle reaction load error gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      reactionService.getReactions.mockRejectedValue(new Error('Load failed'));

      render(
        <EnhancedPost
          post={mockPost}
          currentUser={mockCurrentUser}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error loading reactions:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('should handle reaction toggle error gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      reactionService.toggleReaction.mockRejectedValue(new Error('Toggle failed'));

      render(
        <EnhancedPost
          post={mockPost}
          currentUser={mockCurrentUser}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      const likeButton = await screen.findByText('Like');
      fireEvent.click(likeButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error toggling reaction:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('should update reactions on real-time event', async () => {
      render(
        <EnhancedPost
          post={mockPost}
          currentUser={mockCurrentUser}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      const event = new CustomEvent('reactionAdded', {
        detail: {
          contentType: 'post',
          contentId: 'post1',
          summary: { like_count: 20, love_count: 10 }
        }
      });

      window.dispatchEvent(event);

      await waitFor(() => {
        expect(screen.getByTestId('reaction-bar')).toBeInTheDocument();
      });
    });

    it('should ignore real-time events for other posts', async () => {
      render(
        <EnhancedPost
          post={mockPost}
          currentUser={mockCurrentUser}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      const event = new CustomEvent('reactionAdded', {
        detail: {
          contentType: 'post',
          contentId: 'other-post',
          summary: { like_count: 20 }
        }
      });

      window.dispatchEvent(event);

      await waitFor(() => {
        expect(screen.getByTestId('reaction-bar')).toBeInTheDocument();
      });
    });
  });

  describe('Comments Section', () => {
    it('should toggle comments visibility', async () => {
      render(
        <EnhancedPost
          post={mockPost}
          currentUser={mockCurrentUser}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      const commentButton = screen.getByText('5');
      expect(screen.queryByTestId('threaded-comments')).not.toBeInTheDocument();

      fireEvent.click(commentButton);

      await waitFor(() => {
        expect(screen.getByTestId('threaded-comments')).toBeInTheDocument();
      });

      fireEvent.click(commentButton);

      await waitFor(() => {
        expect(screen.queryByTestId('threaded-comments')).not.toBeInTheDocument();
      });
    });

    it('should display comment count', () => {
      render(
        <EnhancedPost
          post={mockPost}
          currentUser={mockCurrentUser}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should handle adding a comment', async () => {
      const onComment = vi.fn();

      render(
        <EnhancedPost
          post={mockPost}
          currentUser={mockCurrentUser}
          onReaction={vi.fn()}
          onComment={onComment}
        />
      );

      const commentButton = screen.getByText('5');
      fireEvent.click(commentButton);

      const addCommentButton = await screen.findByText('Add Comment');
      fireEvent.click(addCommentButton);

      expect(onComment).toHaveBeenCalledWith('post1', expect.objectContaining({
        content: 'Test comment',
        postId: 'post1',
        author: expect.objectContaining({
          id: 'user1',
          username: 'TestUser'
        })
      }));
    });

    it('should render existing comments', async () => {
      const postWithComments = {
        ...mockPost,
        comments: [
          { id: 'c1', content: 'First comment', author: { username: 'User1' } },
          { id: 'c2', content: 'Second comment', author: { username: 'User2' } }
        ]
      };

      render(
        <EnhancedPost
          post={postWithComments}
          currentUser={mockCurrentUser}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      const commentButton = screen.getByText('5');
      fireEvent.click(commentButton);

      await waitFor(() => {
        expect(screen.getByText('First comment')).toBeInTheDocument();
        expect(screen.getByText('Second comment')).toBeInTheDocument();
      });
    });

    it('should handle comment reply', async () => {
      const onReply = vi.fn();
      const postWithComments = {
        ...mockPost,
        comments: [{ id: 'c1', content: 'Comment', author: { username: 'User1' } }]
      };

      render(
        <EnhancedPost
          post={postWithComments}
          currentUser={mockCurrentUser}
          onReaction={vi.fn()}
          onComment={vi.fn()}
          onReply={onReply}
        />
      );

      fireEvent.click(screen.getByText('5'));

      const replyButton = await screen.findByText('Reply');
      fireEvent.click(replyButton);

      expect(onReply).toHaveBeenCalledWith('c1', 'Reply');
    });

    it('should handle comment edit', async () => {
      const onEditComment = vi.fn();
      const postWithComments = {
        ...mockPost,
        comments: [{ id: 'c1', content: 'Comment', author: { username: 'User1' } }]
      };

      render(
        <EnhancedPost
          post={postWithComments}
          currentUser={mockCurrentUser}
          onReaction={vi.fn()}
          onComment={vi.fn()}
          onEditComment={onEditComment}
        />
      );

      fireEvent.click(screen.getByText('5'));

      const editButton = await screen.findByText('Edit');
      fireEvent.click(editButton);

      expect(onEditComment).toHaveBeenCalledWith('c1', 'Edited');
    });

    it('should handle comment delete', async () => {
      const onDeleteComment = vi.fn();
      const postWithComments = {
        ...mockPost,
        comments: [{ id: 'c1', content: 'Comment', author: { username: 'User1' } }]
      };

      render(
        <EnhancedPost
          post={postWithComments}
          currentUser={mockCurrentUser}
          onReaction={vi.fn()}
          onComment={vi.fn()}
          onDeleteComment={onDeleteComment}
        />
      );

      fireEvent.click(screen.getByText('5'));

      const deleteButton = await screen.findByText('Delete');
      fireEvent.click(deleteButton);

      expect(onDeleteComment).toHaveBeenCalledWith('c1');
    });
  });

  describe('Analytics', () => {
    it('should show analytics button when showAnalytics is true', () => {
      render(
        <EnhancedPost
          post={mockPost}
          currentUser={mockCurrentUser}
          onReaction={vi.fn()}
          onComment={vi.fn()}
          showAnalytics={true}
        />
      );

      const analyticsButton = screen.getByLabelText('View analytics');
      expect(analyticsButton).toBeInTheDocument();
    });

    it('should not show analytics button when showAnalytics is false', () => {
      render(
        <EnhancedPost
          post={mockPost}
          currentUser={mockCurrentUser}
          onReaction={vi.fn()}
          onComment={vi.fn()}
          showAnalytics={false}
        />
      );

      const analyticsButton = screen.queryByLabelText('View analytics');
      expect(analyticsButton).not.toBeInTheDocument();
    });

    it('should open analytics modal on button click', async () => {
      render(
        <EnhancedPost
          post={mockPost}
          currentUser={mockCurrentUser}
          onReaction={vi.fn()}
          onComment={vi.fn()}
          showAnalytics={true}
        />
      );

      const analyticsButton = screen.getByLabelText('View analytics');
      fireEvent.click(analyticsButton);

      await waitFor(() => {
        expect(screen.getByText('Post Analytics')).toBeInTheDocument();
        expect(screen.getByTestId('reaction-analytics')).toBeInTheDocument();
      });
    });

    it('should close analytics modal on close button click', async () => {
      render(
        <EnhancedPost
          post={mockPost}
          currentUser={mockCurrentUser}
          onReaction={vi.fn()}
          onComment={vi.fn()}
          showAnalytics={true}
        />
      );

      const analyticsButton = screen.getByLabelText('View analytics');
      fireEvent.click(analyticsButton);

      const closeButton = await screen.findByLabelText('Close');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Post Analytics')).not.toBeInTheDocument();
      });
    });

    it('should close analytics modal on backdrop click', async () => {
      render(
        <EnhancedPost
          post={mockPost}
          currentUser={mockCurrentUser}
          onReaction={vi.fn()}
          onComment={vi.fn()}
          showAnalytics={true}
        />
      );

      const analyticsButton = screen.getByLabelText('View analytics');
      fireEvent.click(analyticsButton);

      await waitFor(() => {
        expect(screen.getByText('Post Analytics')).toBeInTheDocument();
      });

      const backdrop = screen.getByText('Post Analytics').closest('.fixed');
      fireEvent.click(backdrop);

      await waitFor(() => {
        expect(screen.queryByText('Post Analytics')).not.toBeInTheDocument();
      });
    });

    it('should not close modal when clicking modal content', async () => {
      render(
        <EnhancedPost
          post={mockPost}
          currentUser={mockCurrentUser}
          onReaction={vi.fn()}
          onComment={vi.fn()}
          showAnalytics={true}
        />
      );

      const analyticsButton = screen.getByLabelText('View analytics');
      fireEvent.click(analyticsButton);

      const modalContent = await screen.findByTestId('reaction-analytics');
      fireEvent.click(modalContent);

      expect(screen.getByText('Post Analytics')).toBeInTheDocument();
    });
  });

  describe('Time Formatting', () => {
    it('should display "now" for recent posts', () => {
      const recentPost = { ...mockPost, timestamp: new Date().toISOString() };

      render(
        <EnhancedPost
          post={recentPost}
          currentUser={mockCurrentUser}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      expect(screen.getByText('now')).toBeInTheDocument();
    });

    it('should display minutes ago for posts within an hour', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const recentPost = { ...mockPost, timestamp: fiveMinutesAgo };

      render(
        <EnhancedPost
          post={recentPost}
          currentUser={mockCurrentUser}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      expect(screen.getByText('5m')).toBeInTheDocument();
    });

    it('should display hours ago for posts within a day', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const recentPost = { ...mockPost, timestamp: twoHoursAgo };

      render(
        <EnhancedPost
          post={recentPost}
          currentUser={mockCurrentUser}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      expect(screen.getByText('2h')).toBeInTheDocument();
    });

    it('should display days ago for older posts', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const oldPost = { ...mockPost, timestamp: threeDaysAgo };

      render(
        <EnhancedPost
          post={oldPost}
          currentUser={mockCurrentUser}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      expect(screen.getByText('3d')).toBeInTheDocument();
    });
  });
});

describe('EnhancedPostsFeed Component', () => {
  const mockPosts = [
    {
      ...mockPost,
      id: 'post1',
      title: 'First Post',
      timestamp: new Date('2025-01-01T12:00:00Z').toISOString(),
      reactions: { total: 10 },
      commentCount: 5
    },
    {
      ...mockPost,
      id: 'post2',
      title: 'Second Post',
      timestamp: new Date('2025-01-02T12:00:00Z').toISOString(),
      reactions: { total: 20 },
      commentCount: 10
    },
    {
      ...mockPost,
      id: 'post3',
      title: 'Third Post',
      timestamp: new Date('2025-01-03T12:00:00Z').toISOString(),
      reactions: { total: 5 },
      commentCount: 2
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    reactionService.getReactions.mockResolvedValue(mockReactionsData);
  });

  describe('Feed Rendering', () => {
    it('should render feed header', () => {
      render(
        <EnhancedPostsFeed
          posts={mockPosts}
          currentUser={mockCurrentUser}
          onCreatePost={vi.fn()}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      expect(screen.getByText('Community Posts')).toBeInTheDocument();
    });

    it('should render all posts', () => {
      render(
        <EnhancedPostsFeed
          posts={mockPosts}
          currentUser={mockCurrentUser}
          onCreatePost={vi.fn()}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      expect(screen.getByText('First Post')).toBeInTheDocument();
      expect(screen.getByText('Second Post')).toBeInTheDocument();
      expect(screen.getByText('Third Post')).toBeInTheDocument();
    });

    it('should render create post button', () => {
      render(
        <EnhancedPostsFeed
          posts={mockPosts}
          currentUser={mockCurrentUser}
          onCreatePost={vi.fn()}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      expect(screen.getByText('Create Post')).toBeInTheDocument();
    });

    it('should display empty state when no posts', () => {
      render(
        <EnhancedPostsFeed
          posts={[]}
          currentUser={mockCurrentUser}
          onCreatePost={vi.fn()}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      expect(screen.getByText('No posts yet')).toBeInTheDocument();
      expect(screen.getByText('Be the first to start a discussion in this channel!')).toBeInTheDocument();
    });

    it('should render create first post button in empty state', () => {
      render(
        <EnhancedPostsFeed
          posts={[]}
          currentUser={mockCurrentUser}
          onCreatePost={vi.fn()}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      expect(screen.getByText('Create First Post')).toBeInTheDocument();
    });
  });

  describe('Sorting Functionality', () => {
    it('should render all sort options', () => {
      render(
        <EnhancedPostsFeed
          posts={mockPosts}
          currentUser={mockCurrentUser}
          onCreatePost={vi.fn()}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      expect(screen.getByText('Hot')).toBeInTheDocument();
      expect(screen.getByText('New')).toBeInTheDocument();
      expect(screen.getByText('Top')).toBeInTheDocument();
    });

    it('should default to hot sorting', () => {
      render(
        <EnhancedPostsFeed
          posts={mockPosts}
          currentUser={mockCurrentUser}
          onCreatePost={vi.fn()}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      const hotButton = screen.getByText('Hot').closest('button');
      expect(hotButton).toHaveClass('active');
    });

    it('should switch to new sorting', () => {
      render(
        <EnhancedPostsFeed
          posts={mockPosts}
          currentUser={mockCurrentUser}
          onCreatePost={vi.fn()}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      const newButton = screen.getByText('New').closest('button');
      fireEvent.click(newButton);

      expect(newButton).toHaveClass('active');
    });

    it('should switch to top sorting', () => {
      render(
        <EnhancedPostsFeed
          posts={mockPosts}
          currentUser={mockCurrentUser}
          onCreatePost={vi.fn()}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      const topButton = screen.getByText('Top').closest('button');
      fireEvent.click(topButton);

      expect(topButton).toHaveClass('active');
    });

    it('should sort posts by newest first when "new" is selected', () => {
      render(
        <EnhancedPostsFeed
          posts={mockPosts}
          currentUser={mockCurrentUser}
          onCreatePost={vi.fn()}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      const newButton = screen.getByText('New').closest('button');
      fireEvent.click(newButton);

      const titles = screen.getAllByTestId('card-title');
      expect(titles[0]).toHaveTextContent('Third Post');
      expect(titles[1]).toHaveTextContent('Second Post');
      expect(titles[2]).toHaveTextContent('First Post');
    });

    it('should sort posts by reaction count when "top" is selected', () => {
      render(
        <EnhancedPostsFeed
          posts={mockPosts}
          currentUser={mockCurrentUser}
          onCreatePost={vi.fn()}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      const topButton = screen.getByText('Top').closest('button');
      fireEvent.click(topButton);

      const titles = screen.getAllByTestId('card-title');
      expect(titles[0]).toHaveTextContent('Second Post');
      expect(titles[1]).toHaveTextContent('First Post');
      expect(titles[2]).toHaveTextContent('Third Post');
    });
  });

  describe('Create Post Modal', () => {
    it('should open create post modal on button click', () => {
      render(
        <EnhancedPostsFeed
          posts={mockPosts}
          currentUser={mockCurrentUser}
          onCreatePost={vi.fn()}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      const createButton = screen.getByText('Create Post').closest('button');
      fireEvent.click(createButton);

      expect(screen.getByText('Create Post Modal - Enhanced with reaction options')).toBeInTheDocument();
    });

    it('should close create post modal', () => {
      render(
        <EnhancedPostsFeed
          posts={mockPosts}
          currentUser={mockCurrentUser}
          onCreatePost={vi.fn()}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      const createButton = screen.getByText('Create Post').closest('button');
      fireEvent.click(createButton);

      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      expect(screen.queryByText('Create Post Modal - Enhanced with reaction options')).not.toBeInTheDocument();
    });

    it('should open create post modal from empty state', () => {
      render(
        <EnhancedPostsFeed
          posts={[]}
          currentUser={mockCurrentUser}
          onCreatePost={vi.fn()}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      const createButton = screen.getByText('Create First Post');
      fireEvent.click(createButton);

      expect(screen.getByText('Create Post Modal - Enhanced with reaction options')).toBeInTheDocument();
    });
  });

  describe('Trending Section', () => {
    it('should toggle trending section', () => {
      render(
        <EnhancedPostsFeed
          posts={mockPosts}
          currentUser={mockCurrentUser}
          onCreatePost={vi.fn()}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      const trendingButton = screen.getByTitle('Show Trending');
      expect(screen.queryByTestId('reaction-analytics')).not.toBeInTheDocument();

      fireEvent.click(trendingButton);

      expect(screen.getByTestId('reaction-analytics')).toBeInTheDocument();
      expect(trendingButton).toHaveClass('active');
    });

    it('should hide trending section when toggled off', () => {
      render(
        <EnhancedPostsFeed
          posts={mockPosts}
          currentUser={mockCurrentUser}
          onCreatePost={vi.fn()}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      const trendingButton = screen.getByTitle('Show Trending');
      fireEvent.click(trendingButton);
      fireEvent.click(trendingButton);

      expect(screen.queryByTestId('reaction-analytics')).not.toBeInTheDocument();
      expect(trendingButton).not.toHaveClass('active');
    });
  });

  describe('Post Interactions', () => {
    it('should pass onReaction handler to posts', async () => {
      const onReaction = vi.fn();

      render(
        <EnhancedPostsFeed
          posts={mockPosts}
          currentUser={mockCurrentUser}
          onCreatePost={vi.fn()}
          onReaction={onReaction}
          onComment={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByTestId('reaction-bar').length).toBeGreaterThan(0);
      });
    });

    it('should pass onComment handler to posts', () => {
      const onComment = vi.fn();

      render(
        <EnhancedPostsFeed
          posts={mockPosts}
          currentUser={mockCurrentUser}
          onCreatePost={vi.fn()}
          onReaction={vi.fn()}
          onComment={onComment}
        />
      );

      const commentButtons = screen.getAllByText('5');
      fireEvent.click(commentButtons[0]);
    });

    it('should pass currentUser to posts', () => {
      render(
        <EnhancedPostsFeed
          posts={mockPosts}
          currentUser={mockCurrentUser}
          onCreatePost={vi.fn()}
          onReaction={vi.fn()}
          onComment={vi.fn()}
        />
      );

      expect(screen.getAllByTestId('card').length).toBe(mockPosts.length);
    });

    it('should show analytics on posts when enabled', () => {
      render(
        <EnhancedPostsFeed
          posts={mockPosts}
          currentUser={mockCurrentUser}
          onCreatePost={vi.fn()}
          onReaction={vi.fn()}
          onComment={vi.fn()}
          showAnalytics={true}
        />
      );

      const analyticsButtons = screen.getAllByLabelText('View analytics');
      expect(analyticsButtons.length).toBe(mockPosts.length);
    });
  });
});

describe('POST_TYPES', () => {
  it('should export all post types', () => {
    expect(POST_TYPES).toBeDefined();
    expect(POST_TYPES.DISCUSSION).toBeDefined();
    expect(POST_TYPES.NEWS).toBeDefined();
    expect(POST_TYPES.ANALYSIS).toBeDefined();
    expect(POST_TYPES.MEME).toBeDefined();
    expect(POST_TYPES.PREDICTION).toBeDefined();
    expect(POST_TYPES.ALERT).toBeDefined();
  });

  it('should have correct structure for each post type', () => {
    Object.values(POST_TYPES).forEach(postType => {
      expect(postType).toHaveProperty('icon');
      expect(postType).toHaveProperty('label');
      expect(postType).toHaveProperty('color');
    });
  });
});

export default mockCurrentUser
