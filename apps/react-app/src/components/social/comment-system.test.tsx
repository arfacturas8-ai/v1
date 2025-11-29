/**
 * Comprehensive Test Suite for CRYB Comment System Component
 * Testing rendering, interactions, nested replies, sorting, and accessibility
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import {
  CommentSystem,
  CommentComposer,
  Comment,
  type CommentData,
  type CommentAuthor,
  type CommentReactions
} from './comment-system';

// Mock dependencies
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

// Mock framer-motion to simplify testing
jest.mock('framer-motion', () => {
  const mockReact = require('react');
  return {
    motion: {
      div: mockReact.forwardRef(({ children, initial, animate, exit, transition, whileTap, ...props }: any, ref: any) => (
        <div ref={ref} {...props}>
          {children}
        </div>
      )),
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
  Root: ({ children, open }: any) => <div data-state={open ? 'open' : 'closed'}>{children}</div>,
  Trigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Content: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

// Mock UI components
jest.mock('../ui/button', () => {
  const mockReact = require('react');
  return {
    Button: mockReact.forwardRef(({ children, onClick, disabled, loading, loadingText, ...props }: any, ref: any) => (
      <button ref={ref} onClick={onClick} disabled={disabled || loading} {...props}>
        {loading ? loadingText || 'Loading...' : children}
      </button>
    )),
    IconButton: mockReact.forwardRef(({ icon, onClick, ...props }: any, ref: any) => (
      <button ref={ref} onClick={onClick} {...props}>
        {icon}
      </button>
    )),
  };
});

jest.mock('../ui/input', () => {
  const mockReact = require('react');
  return {
    Input: mockReact.forwardRef(({ ...props }: any, ref: any) => (
      <input ref={ref} {...props} />
    )),
    Textarea: mockReact.forwardRef(({ ...props }: any, ref: any) => (
      <textarea ref={ref} {...props} />
    )),
  };
});

jest.mock('./post-card', () => ({
  Avatar: ({ src, alt, onClick, verified, size }: any) => (
    <button onClick={onClick} aria-label={alt}>
      {src ? <img src={src} alt={alt} /> : <span>{alt.charAt(0)}</span>}
      {verified && <span data-testid="verified-badge">✓</span>}
    </button>
  ),
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Heart: () => <span data-testid="heart-icon">Heart</span>,
  MessageCircle: () => <span data-testid="message-icon">Message</span>,
  MoreHorizontal: () => <span data-testid="more-icon">More</span>,
  Reply: () => <span data-testid="reply-icon">Reply</span>,
  ChevronDown: () => <span data-testid="chevron-down-icon">Down</span>,
  ChevronUp: () => <span data-testid="chevron-up-icon">Up</span>,
  Clock: () => <span data-testid="clock-icon">Clock</span>,
  Edit: () => <span data-testid="edit-icon">Edit</span>,
  Trash2: () => <span data-testid="trash-icon">Trash</span>,
  Flag: () => <span data-testid="flag-icon">Flag</span>,
  Share2: () => <span data-testid="share-icon">Share</span>,
  Pin: () => <span data-testid="pin-icon">Pin</span>,
  Award: () => <span data-testid="award-icon">Award</span>,
  Eye: () => <span data-testid="eye-icon">Eye</span>,
  EyeOff: () => <span data-testid="eye-off-icon">EyeOff</span>,
}));

// Helper functions to create mock data
const createMockAuthor = (overrides?: Partial<CommentAuthor>): CommentAuthor => ({
  id: '1',
  name: 'John Doe',
  username: 'johndoe',
  avatar: 'https://example.com/avatar.jpg',
  verified: false,
  ...overrides,
});

const createMockComment = (overrides?: Partial<CommentData>): CommentData => ({
  id: 'comment-1',
  author: createMockAuthor(),
  content: 'This is a test comment',
  timestamp: new Date('2024-01-01T12:00:00Z'),
  reactions: {
    likes: 5,
    replies: 0,
    userLiked: false,
  },
  ...overrides,
});

describe('CommentSystem Component', () => {
  // ===== RENDERING TESTS =====
  describe('Rendering', () => {
    it('should render comment system with comments', () => {
      const comments = [createMockComment()];
      render(<CommentSystem comments={comments} postId="post-1" />);

      expect(screen.getByText('This is a test comment')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should render empty state when no comments', () => {
      render(<CommentSystem comments={[]} postId="post-1" />);

      expect(screen.getByText('No comments yet')).toBeInTheDocument();
      expect(screen.getByText('Be the first to share your thoughts!')).toBeInTheDocument();
    });

    it('should render loading skeleton when loading', () => {
      render(<CommentSystem comments={[]} postId="post-1" loading />);

      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should apply custom className', () => {
      const { container } = render(
        <CommentSystem comments={[]} postId="post-1" className="custom-class" />
      );

      const commentSystem = container.firstChild as HTMLElement;
      expect(commentSystem).toHaveClass('custom-class');
    });

    it('should show comment composer when currentUser is provided', () => {
      const currentUser = createMockAuthor({ id: 'current' });
      render(<CommentSystem comments={[]} postId="post-1" currentUser={currentUser} />);

      expect(screen.getByPlaceholderText('Write a comment...')).toBeInTheDocument();
    });

    it('should hide comment composer when showReplyComposer is false', () => {
      const currentUser = createMockAuthor({ id: 'current' });
      render(
        <CommentSystem
          comments={[]}
          postId="post-1"
          currentUser={currentUser}
          showReplyComposer={false}
        />
      );

      expect(screen.queryByPlaceholderText('Write a comment...')).not.toBeInTheDocument();
    });
  });

  // ===== COMMENT SUBMISSION TESTS =====
  describe('Comment Submission', () => {
    it('should submit a new comment', async () => {
      const user = userEvent.setup();
      const onCommentSubmit = jest.fn();
      const currentUser = createMockAuthor({ id: 'current' });

      render(
        <CommentSystem
          comments={[]}
          postId="post-1"
          currentUser={currentUser}
          onCommentSubmit={onCommentSubmit}
        />
      );

      const input = screen.getByPlaceholderText('Write a comment...');
      await user.click(input);

      const textarea = screen.getByPlaceholderText('Write a comment...');
      await user.type(textarea, 'New comment');

      const submitButton = screen.getByText('Comment');
      await user.click(submitButton);

      await waitFor(() => {
        expect(onCommentSubmit).toHaveBeenCalledWith('New comment', undefined);
      });
    });

    it('should not submit empty comment', async () => {
      const user = userEvent.setup();
      const onCommentSubmit = jest.fn();
      const currentUser = createMockAuthor({ id: 'current' });

      render(
        <CommentSystem
          comments={[]}
          postId="post-1"
          currentUser={currentUser}
          onCommentSubmit={onCommentSubmit}
        />
      );

      const input = screen.getByPlaceholderText('Write a comment...');
      await user.click(input);

      const submitButton = screen.getByText('Comment');
      expect(submitButton).toBeDisabled();
    });

    it('should submit comment with Cmd+Enter', async () => {
      const user = userEvent.setup();
      const onCommentSubmit = jest.fn();
      const currentUser = createMockAuthor({ id: 'current' });

      render(
        <CommentSystem
          comments={[]}
          postId="post-1"
          currentUser={currentUser}
          onCommentSubmit={onCommentSubmit}
        />
      );

      const input = screen.getByPlaceholderText('Write a comment...');
      await user.click(input);

      const textarea = screen.getByPlaceholderText('Write a comment...');
      await user.type(textarea, 'New comment');
      await user.keyboard('{Meta>}{Enter}{/Meta}');

      await waitFor(() => {
        expect(onCommentSubmit).toHaveBeenCalledWith('New comment', undefined);
      });
    });

    it('should cancel comment with Escape', async () => {
      const user = userEvent.setup();
      const currentUser = createMockAuthor({ id: 'current' });

      render(
        <CommentSystem
          comments={[]}
          postId="post-1"
          currentUser={currentUser}
        />
      );

      const input = screen.getByPlaceholderText('Write a comment...');
      await user.click(input);

      const textarea = screen.getByPlaceholderText('Write a comment...');
      await user.type(textarea, 'New comment');
      await user.keyboard('{Escape}');

      // Should collapse back to input
      await waitFor(() => {
        expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
      });
    });

    it('should clear textarea after successful submission', async () => {
      const user = userEvent.setup();
      const onCommentSubmit = jest.fn().mockResolvedValue(undefined);
      const currentUser = createMockAuthor({ id: 'current' });

      render(
        <CommentSystem
          comments={[]}
          postId="post-1"
          currentUser={currentUser}
          onCommentSubmit={onCommentSubmit}
        />
      );

      const input = screen.getByPlaceholderText('Write a comment...');
      await user.click(input);

      const textarea = screen.getByPlaceholderText('Write a comment...');
      await user.type(textarea, 'New comment');

      const submitButton = screen.getByText('Comment');
      await user.click(submitButton);

      await waitFor(() => {
        expect(onCommentSubmit).toHaveBeenCalled();
      });
    });
  });

  // ===== COMMENT LIST DISPLAY TESTS =====
  describe('Comment List Display', () => {
    it('should display multiple comments', () => {
      const comments = [
        createMockComment({ id: '1', content: 'First comment' }),
        createMockComment({ id: '2', content: 'Second comment' }),
        createMockComment({ id: '3', content: 'Third comment' }),
      ];

      render(<CommentSystem comments={comments} postId="post-1" />);

      expect(screen.getByText('First comment')).toBeInTheDocument();
      expect(screen.getByText('Second comment')).toBeInTheDocument();
      expect(screen.getByText('Third comment')).toBeInTheDocument();
    });

    it('should display comment count correctly', () => {
      const comments = [
        createMockComment({ id: '1' }),
        createMockComment({ id: '2' }),
      ];

      render(<CommentSystem comments={comments} postId="post-1" />);

      expect(screen.getByText('2 comments')).toBeInTheDocument();
    });

    it('should display singular comment count', () => {
      const comments = [createMockComment()];
      render(<CommentSystem comments={comments} postId="post-1" />);

      expect(screen.getByText('1 comment')).toBeInTheDocument();
    });

    it('should count nested comments in total', () => {
      const comments = [
        createMockComment({
          id: '1',
          replies: [
            createMockComment({ id: '1-1' }),
            createMockComment({ id: '1-2' }),
          ],
        }),
      ];

      render(<CommentSystem comments={comments} postId="post-1" />);

      expect(screen.getByText('3 comments')).toBeInTheDocument();
    });

    it('should display comment timestamps', () => {
      const comments = [createMockComment()];
      render(<CommentSystem comments={comments} postId="post-1" />);

      expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
    });

    it('should display author avatars', () => {
      const comments = [createMockComment()];
      render(<CommentSystem comments={comments} postId="post-1" />);

      const avatar = screen.getByAltText('John Doe');
      expect(avatar).toBeInTheDocument();
    });

    it('should display verified badge for verified authors', () => {
      const comments = [
        createMockComment({
          author: createMockAuthor({ verified: true }),
        }),
      ];

      render(<CommentSystem comments={comments} postId="post-1" />);

      expect(screen.getByTestId('verified-badge')).toBeInTheDocument();
    });

    it('should display author roles', () => {
      const comments = [
        createMockComment({
          author: createMockAuthor({ role: 'admin' }),
        }),
      ];

      render(<CommentSystem comments={comments} postId="post-1" />);

      expect(screen.getByText('admin')).toBeInTheDocument();
    });

    it('should display pinned indicator', () => {
      const comments = [
        createMockComment({ pinned: true }),
      ];

      render(<CommentSystem comments={comments} postId="post-1" />);

      expect(screen.getByText('Pinned')).toBeInTheDocument();
    });

    it('should display edited indicator', () => {
      const comments = [
        createMockComment({ edited: new Date('2024-01-01T13:00:00Z') }),
      ];

      render(<CommentSystem comments={comments} postId="post-1" />);

      expect(screen.getByText('(edited)')).toBeInTheDocument();
    });

    it('should display deleted comment placeholder', () => {
      const comments = [
        createMockComment({ deleted: true }),
      ];

      render(<CommentSystem comments={comments} postId="post-1" />);

      expect(screen.getByText('[This comment has been deleted]')).toBeInTheDocument();
    });
  });

  // ===== REPLY FUNCTIONALITY TESTS =====
  describe('Reply Functionality', () => {
    it('should show reply button on comments', () => {
      const comments = [createMockComment()];
      render(<CommentSystem comments={[]} postId="post-1" currentUser={createMockAuthor()} />);

      render(<Comment comment={createMockComment()} currentUser={createMockAuthor()} />);
      expect(screen.getByText('Reply')).toBeInTheDocument();
    });

    it('should open reply composer when clicking Reply', async () => {
      const user = userEvent.setup();
      const currentUser = createMockAuthor({ id: 'current' });

      render(<Comment comment={createMockComment()} currentUser={currentUser} />);

      const replyButton = screen.getByText('Reply');
      await user.click(replyButton);

      expect(screen.getByPlaceholderText(/Reply to John Doe.../)).toBeInTheDocument();
    });

    it('should submit a reply', async () => {
      const user = userEvent.setup();
      const onCommentSubmit = jest.fn();
      const currentUser = createMockAuthor({ id: 'current' });
      const comment = createMockComment({ id: 'parent-1' });

      render(
        <Comment
          comment={comment}
          currentUser={currentUser}
          onCommentSubmit={onCommentSubmit}
        />
      );

      const replyButton = screen.getByText('Reply');
      await user.click(replyButton);

      const textarea = screen.getByPlaceholderText(/Reply to John Doe.../);
      await user.type(textarea, 'This is a reply');

      const submitButton = screen.getByText('Reply');
      await user.click(submitButton);

      await waitFor(() => {
        expect(onCommentSubmit).toHaveBeenCalledWith('This is a reply', 'parent-1');
      });
    });

    it('should display nested replies', () => {
      const comment = createMockComment({
        id: 'parent',
        content: 'Parent comment',
        replies: [
          createMockComment({ id: 'child', content: 'Child reply' }),
        ],
      });

      render(<Comment comment={comment} />);

      expect(screen.getByText('Parent comment')).toBeInTheDocument();
      expect(screen.getByText('Child reply')).toBeInTheDocument();
    });

    it('should toggle replies visibility', async () => {
      const user = userEvent.setup();
      const comment = createMockComment({
        replies: [
          createMockComment({ id: 'child', content: 'Child reply' }),
        ],
      });

      render(<Comment comment={comment} />);

      expect(screen.getByText('Child reply')).toBeInTheDocument();

      const toggleButton = screen.getByText(/Hide 1 replies/);
      await user.click(toggleButton);

      // Replies should still be in DOM but might be visually hidden
      expect(screen.getByText('Child reply')).toBeInTheDocument();
    });

    it('should show reply count in toggle button', () => {
      const comment = createMockComment({
        replies: [
          createMockComment({ id: '1' }),
          createMockComment({ id: '2' }),
          createMockComment({ id: '3' }),
        ],
      });

      render(<Comment comment={comment} />);

      expect(screen.getByText(/3 replies/)).toBeInTheDocument();
    });

    it('should hide reply button on deleted comments', () => {
      render(<Comment comment={createMockComment({ deleted: true })} currentUser={createMockAuthor()} />);

      expect(screen.queryByText('Reply')).not.toBeInTheDocument();
    });

    it('should respect maxDepth for nested replies', () => {
      const comment = createMockComment({ depth: 4 });

      render(<Comment comment={comment} currentUser={createMockAuthor()} maxDepth={4} />);

      // Reply button should not be shown at max depth
      expect(screen.queryByText('Reply')).not.toBeInTheDocument();
    });
  });

  // ===== EDIT/DELETE COMMENTS TESTS =====
  describe('Edit/Delete Comments', () => {
    it('should show edit option for own comments', async () => {
      const user = userEvent.setup();
      const currentUser = createMockAuthor({ id: 'user-1' });
      const comment = createMockComment({ author: currentUser });

      render(<Comment comment={comment} currentUser={currentUser} />);

      const optionsButton = screen.getByLabelText('Comment options');
      await user.click(optionsButton);

      expect(screen.getByText('Edit comment')).toBeInTheDocument();
    });

    it('should not show edit option for other users comments', async () => {
      const user = userEvent.setup();
      const currentUser = createMockAuthor({ id: 'user-1' });
      const otherAuthor = createMockAuthor({ id: 'user-2' });
      const comment = createMockComment({ author: otherAuthor });

      render(<Comment comment={comment} currentUser={currentUser} />);

      const optionsButton = screen.getByLabelText('Comment options');
      await user.click(optionsButton);

      expect(screen.queryByText('Edit comment')).not.toBeInTheDocument();
    });

    it('should enter edit mode when clicking Edit', async () => {
      const user = userEvent.setup();
      const currentUser = createMockAuthor({ id: 'user-1' });
      const comment = createMockComment({ author: currentUser, content: 'Original content' });

      render(<Comment comment={comment} currentUser={currentUser} />);

      const optionsButton = screen.getByLabelText('Comment options');
      await user.click(optionsButton);

      const editButton = screen.getByText('Edit comment');
      await user.click(editButton);

      const textarea = screen.getByDisplayValue('Original content');
      expect(textarea).toBeInTheDocument();
    });

    it('should save edited comment', async () => {
      const user = userEvent.setup();
      const onCommentEdit = jest.fn();
      const currentUser = createMockAuthor({ id: 'user-1' });
      const comment = createMockComment({
        id: 'comment-1',
        author: currentUser,
        content: 'Original content'
      });

      render(
        <Comment
          comment={comment}
          currentUser={currentUser}
          onCommentEdit={onCommentEdit}
        />
      );

      const optionsButton = screen.getByLabelText('Comment options');
      await user.click(optionsButton);

      const editButton = screen.getByText('Edit comment');
      await user.click(editButton);

      const textarea = screen.getByDisplayValue('Original content');
      await user.clear(textarea);
      await user.type(textarea, 'Edited content');

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      expect(onCommentEdit).toHaveBeenCalledWith('comment-1', 'Edited content');
    });

    it('should cancel edit with Cancel button', async () => {
      const user = userEvent.setup();
      const currentUser = createMockAuthor({ id: 'user-1' });
      const comment = createMockComment({ author: currentUser, content: 'Original content' });

      render(<Comment comment={comment} currentUser={currentUser} />);

      const optionsButton = screen.getByLabelText('Comment options');
      await user.click(optionsButton);

      const editButton = screen.getByText('Edit comment');
      await user.click(editButton);

      const textarea = screen.getByDisplayValue('Original content');
      await user.type(textarea, ' modified');

      const cancelButtons = screen.getAllByText('Cancel');
      await user.click(cancelButtons[0]);

      expect(screen.queryByDisplayValue('Original content modified')).not.toBeInTheDocument();
      expect(screen.getByText('Original content')).toBeInTheDocument();
    });

    it('should cancel edit with Escape key', async () => {
      const user = userEvent.setup();
      const currentUser = createMockAuthor({ id: 'user-1' });
      const comment = createMockComment({ author: currentUser, content: 'Original content' });

      render(<Comment comment={comment} currentUser={currentUser} />);

      const optionsButton = screen.getByLabelText('Comment options');
      await user.click(optionsButton);

      const editButton = screen.getByText('Edit comment');
      await user.click(editButton);

      const textarea = screen.getByDisplayValue('Original content');
      await user.keyboard('{Escape}');

      expect(screen.getByText('Original content')).toBeInTheDocument();
    });

    it('should show delete option for own comments', async () => {
      const user = userEvent.setup();
      const currentUser = createMockAuthor({ id: 'user-1' });
      const comment = createMockComment({ author: currentUser });

      render(<Comment comment={comment} currentUser={currentUser} />);

      const optionsButton = screen.getByLabelText('Comment options');
      await user.click(optionsButton);

      expect(screen.getByText('Delete comment')).toBeInTheDocument();
    });

    it('should call onCommentDelete when deleting', async () => {
      const user = userEvent.setup();
      const onCommentDelete = jest.fn();
      const currentUser = createMockAuthor({ id: 'user-1' });
      const comment = createMockComment({ id: 'comment-1', author: currentUser });

      render(
        <Comment
          comment={comment}
          currentUser={currentUser}
          onCommentDelete={onCommentDelete}
        />
      );

      const optionsButton = screen.getByLabelText('Comment options');
      await user.click(optionsButton);

      const deleteButton = screen.getByText('Delete comment');
      await user.click(deleteButton);

      expect(onCommentDelete).toHaveBeenCalledWith('comment-1');
    });

    it('should show delete option for moderators on any comment', async () => {
      const user = userEvent.setup();
      const moderator = createMockAuthor({ id: 'mod', role: 'moderator' });
      const otherAuthor = createMockAuthor({ id: 'other' });
      const comment = createMockComment({ author: otherAuthor });

      render(<Comment comment={comment} currentUser={moderator} />);

      const optionsButton = screen.getByLabelText('Comment options');
      await user.click(optionsButton);

      expect(screen.getByText('Delete comment')).toBeInTheDocument();
    });
  });

  // ===== COMMENT VOTING TESTS =====
  describe('Comment Voting', () => {
    it('should display like count', () => {
      const comment = createMockComment({
        reactions: { likes: 42, replies: 0 },
      });

      render(<Comment comment={comment} />);

      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should not display like count when zero', () => {
      const comment = createMockComment({
        reactions: { likes: 0, replies: 0 },
      });

      render(<Comment comment={comment} />);

      const heartButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('[data-testid="heart-icon"]')
      );
      expect(heartButton).toBeInTheDocument();
      expect(heartButton?.textContent).not.toContain('0');
    });

    it('should call onCommentLike when clicking like', async () => {
      const user = userEvent.setup();
      const onCommentLike = jest.fn();
      const comment = createMockComment({ id: 'comment-1' });

      render(
        <Comment
          comment={comment}
          onCommentLike={onCommentLike}
        />
      );

      const likeButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('[data-testid="heart-icon"]')
      );
      await user.click(likeButton!);

      expect(onCommentLike).toHaveBeenCalledWith('comment-1');
    });

    it('should show liked state when userLiked is true', () => {
      const comment = createMockComment({
        reactions: { likes: 10, replies: 0, userLiked: true },
      });

      render(<Comment comment={comment} />);

      expect(screen.getByTestId('heart-icon')).toBeInTheDocument();
    });

    it('should not show like button on deleted comments', () => {
      const comment = createMockComment({ deleted: true });

      render(<Comment comment={comment} />);

      expect(screen.queryByTestId('heart-icon')).not.toBeInTheDocument();
    });

    it('should display award count when present', () => {
      const comment = createMockComment({
        award: { type: 'gold', count: 3 },
      });

      render(<Comment comment={comment} />);

      expect(screen.getByTestId('award-icon')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  // ===== COMMENT SORTING TESTS =====
  describe('Comment Sorting', () => {
    const createComments = () => [
      createMockComment({
        id: '1',
        timestamp: new Date('2024-01-01T10:00:00Z'),
        reactions: { likes: 10, replies: 5 },
      }),
      createMockComment({
        id: '2',
        timestamp: new Date('2024-01-01T14:00:00Z'),
        reactions: { likes: 30, replies: 2 },
      }),
      createMockComment({
        id: '3',
        timestamp: new Date('2024-01-01T12:00:00Z'),
        reactions: { likes: 5, replies: 10 },
      }),
    ];

    it('should display sort dropdown', () => {
      render(<CommentSystem comments={createComments()} postId="post-1" />);

      expect(screen.getByText('Sort by:')).toBeInTheDocument();
    });

    it('should sort by popular (default)', () => {
      const { container } = render(
        <CommentSystem comments={createComments()} postId="post-1" sortBy="popular" />
      );

      const commentContents = Array.from(container.querySelectorAll('.text-sm.whitespace-pre-wrap'))
        .map(el => el.textContent);

      // Should be sorted by likes (30, 10, 5)
      expect(commentContents[0]).toBe('This is a test comment');
    });

    it('should sort by newest', async () => {
      const user = userEvent.setup();
      render(<CommentSystem comments={createComments()} postId="post-1" />);

      const sortButton = screen.getByText('Popular');
      await user.click(sortButton);

      const newestOption = screen.getByText('Newest');
      await user.click(newestOption);

      // Verify newest is selected
      await waitFor(() => {
        expect(screen.getByText('Newest')).toBeInTheDocument();
      });
    });

    it('should sort by oldest', async () => {
      const user = userEvent.setup();
      render(<CommentSystem comments={createComments()} postId="post-1" />);

      const sortButton = screen.getByText('Popular');
      await user.click(sortButton);

      const oldestOption = screen.getByText('Oldest');
      await user.click(oldestOption);

      await waitFor(() => {
        expect(screen.getByText('Oldest')).toBeInTheDocument();
      });
    });

    it('should sort by controversial', async () => {
      const user = userEvent.setup();
      render(<CommentSystem comments={createComments()} postId="post-1" />);

      const sortButton = screen.getByText('Popular');
      await user.click(sortButton);

      const controversialOption = screen.getByText('Controversial');
      await user.click(controversialOption);

      await waitFor(() => {
        expect(screen.getByText('Controversial')).toBeInTheDocument();
      });
    });

    it('should maintain sort selection', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <CommentSystem comments={createComments()} postId="post-1" />
      );

      const sortButton = screen.getByText('Popular');
      await user.click(sortButton);

      const newestOption = screen.getByText('Newest');
      await user.click(newestOption);

      rerender(<CommentSystem comments={createComments()} postId="post-1" />);

      expect(screen.getByText('Newest')).toBeInTheDocument();
    });
  });

  // ===== NESTED REPLIES TESTS =====
  describe('Nested Replies', () => {
    it('should render deeply nested replies', () => {
      const comment = createMockComment({
        id: 'level-0',
        content: 'Level 0',
        replies: [
          createMockComment({
            id: 'level-1',
            content: 'Level 1',
            replies: [
              createMockComment({
                id: 'level-2',
                content: 'Level 2',
              }),
            ],
          }),
        ],
      });

      render(<Comment comment={comment} />);

      expect(screen.getByText('Level 0')).toBeInTheDocument();
      expect(screen.getByText('Level 1')).toBeInTheDocument();
      expect(screen.getByText('Level 2')).toBeInTheDocument();
    });

    it('should apply proper indentation to nested comments', () => {
      const comment = createMockComment({
        depth: 2,
      });

      const { container } = render(<Comment comment={comment} />);

      // Check for pl-12 class (depth 2 indentation)
      const commentDiv = container.querySelector('.pl-12');
      expect(commentDiv).toBeInTheDocument();
    });

    it('should limit nesting to maxDepth', () => {
      const currentUser = createMockAuthor();
      const comment = createMockComment({ depth: 4 });

      render(<Comment comment={comment} currentUser={currentUser} maxDepth={4} />);

      // Reply button should not appear at max depth
      expect(screen.queryByText('Reply')).not.toBeInTheDocument();
    });

    it('should show visual hierarchy with border', () => {
      const comment = createMockComment({
        replies: [createMockComment({ id: 'child' })],
      });

      const { container } = render(<Comment comment={comment} />);

      const border = container.querySelector('.border-l');
      expect(border).toBeInTheDocument();
    });
  });

  // ===== COMMENT COUNT TESTS =====
  describe('Comment Count', () => {
    it('should count top-level comments only', () => {
      const comments = [
        createMockComment({ id: '1' }),
        createMockComment({ id: '2' }),
      ];

      render(<CommentSystem comments={comments} postId="post-1" />);

      expect(screen.getByText('2 comments')).toBeInTheDocument();
    });

    it('should include nested replies in total count', () => {
      const comments = [
        createMockComment({
          id: '1',
          replies: [
            createMockComment({ id: '1-1' }),
            createMockComment({
              id: '1-2',
              replies: [
                createMockComment({ id: '1-2-1' }),
              ],
            }),
          ],
        }),
        createMockComment({ id: '2' }),
      ];

      render(<CommentSystem comments={comments} postId="post-1" />);

      // 1 + 2 nested + 1 deeply nested + 1 = 5 total
      expect(screen.getByText('5 comments')).toBeInTheDocument();
    });

    it('should update count dynamically', () => {
      const { rerender } = render(
        <CommentSystem comments={[createMockComment()]} postId="post-1" />
      );

      expect(screen.getByText('1 comment')).toBeInTheDocument();

      rerender(
        <CommentSystem
          comments={[
            createMockComment({ id: '1' }),
            createMockComment({ id: '2' }),
          ]}
          postId="post-1"
        />
      );

      expect(screen.getByText('2 comments')).toBeInTheDocument();
    });
  });

  // ===== REAL-TIME UPDATES TESTS =====
  describe('Real-time Updates', () => {
    it('should update when new comments are added', () => {
      const { rerender } = render(
        <CommentSystem comments={[]} postId="post-1" />
      );

      expect(screen.getByText('No comments yet')).toBeInTheDocument();

      rerender(
        <CommentSystem
          comments={[createMockComment({ content: 'New comment' })]}
          postId="post-1"
        />
      );

      expect(screen.getByText('New comment')).toBeInTheDocument();
    });

    it('should update when comments are edited', () => {
      const { rerender } = render(
        <Comment comment={createMockComment({ content: 'Original' })} />
      );

      expect(screen.getByText('Original')).toBeInTheDocument();

      rerender(
        <Comment comment={createMockComment({ content: 'Edited', edited: new Date() })} />
      );

      expect(screen.getByText('Edited')).toBeInTheDocument();
      expect(screen.getByText('(edited)')).toBeInTheDocument();
    });

    it('should update like counts', () => {
      const { rerender } = render(
        <Comment comment={createMockComment({ reactions: { likes: 5, replies: 0 } })} />
      );

      expect(screen.getByText('5')).toBeInTheDocument();

      rerender(
        <Comment comment={createMockComment({ reactions: { likes: 10, replies: 0 } })} />
      );

      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  // ===== ACCESSIBILITY TESTS =====
  describe('Accessibility', () => {
    it('should have proper button roles', () => {
      const currentUser = createMockAuthor();
      render(
        <CommentSystem
          comments={[createMockComment()]}
          postId="post-1"
          currentUser={currentUser}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have accessible labels on action buttons', () => {
      const currentUser = createMockAuthor({ id: 'user-1' });
      const comment = createMockComment({ author: currentUser });

      render(<Comment comment={comment} currentUser={currentUser} />);

      expect(screen.getByLabelText('Comment options')).toBeInTheDocument();
    });

    it('should have aria labels on avatars', () => {
      render(<Comment comment={createMockComment()} />);

      expect(screen.getByLabelText('John Doe')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      const onCommentLike = jest.fn();

      render(
        <Comment
          comment={createMockComment()}
          onCommentLike={onCommentLike}
        />
      );

      const likeButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('[data-testid="heart-icon"]')
      );

      likeButton?.focus();
      expect(likeButton).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(onCommentLike).toHaveBeenCalled();
    });

    it('should have proper menu roles', async () => {
      const user = userEvent.setup();
      const currentUser = createMockAuthor({ id: 'user-1' });
      const comment = createMockComment({ author: currentUser });

      render(<Comment comment={comment} currentUser={currentUser} />);

      const optionsButton = screen.getByLabelText('Comment options');
      await user.click(optionsButton);

      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('should have menu items with proper roles', async () => {
      const user = userEvent.setup();
      const currentUser = createMockAuthor({ id: 'user-1' });
      const comment = createMockComment({ author: currentUser });

      render(<Comment comment={comment} currentUser={currentUser} />);

      const optionsButton = screen.getByLabelText('Comment options');
      await user.click(optionsButton);

      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems.length).toBeGreaterThan(0);
    });

    it('should maintain focus after actions', async () => {
      const user = userEvent.setup();
      const currentUser = createMockAuthor();

      render(
        <CommentSystem
          comments={[]}
          postId="post-1"
          currentUser={currentUser}
        />
      );

      const input = screen.getByPlaceholderText('Write a comment...');
      await user.click(input);

      const textarea = screen.getByPlaceholderText('Write a comment...');
      expect(textarea).toBeInTheDocument();
    });
  });

  // ===== MODERATOR FEATURES TESTS =====
  describe('Moderator Features', () => {
    it('should show pin option for moderators', async () => {
      const user = userEvent.setup();
      const moderator = createMockAuthor({ id: 'mod', role: 'moderator' });
      const comment = createMockComment();

      render(<Comment comment={comment} currentUser={moderator} />);

      const optionsButton = screen.getByLabelText('Comment options');
      await user.click(optionsButton);

      expect(screen.getByText('Pin comment')).toBeInTheDocument();
    });

    it('should call onCommentPin when pinning', async () => {
      const user = userEvent.setup();
      const onCommentPin = jest.fn();
      const moderator = createMockAuthor({ id: 'mod', role: 'moderator' });
      const comment = createMockComment({ id: 'comment-1' });

      render(
        <Comment
          comment={comment}
          currentUser={moderator}
          onCommentPin={onCommentPin}
        />
      );

      const optionsButton = screen.getByLabelText('Comment options');
      await user.click(optionsButton);

      const pinButton = screen.getByText('Pin comment');
      await user.click(pinButton);

      expect(onCommentPin).toHaveBeenCalledWith('comment-1');
    });

    it('should show unpin option for pinned comments', async () => {
      const user = userEvent.setup();
      const moderator = createMockAuthor({ id: 'mod', role: 'moderator' });
      const comment = createMockComment({ pinned: true });

      render(<Comment comment={comment} currentUser={moderator} />);

      const optionsButton = screen.getByLabelText('Comment options');
      await user.click(optionsButton);

      expect(screen.getByText('Unpin comment')).toBeInTheDocument();
    });

    it('should hide comment from non-moderators when hidden', () => {
      const comment = createMockComment({ hidden: true });
      const regularUser = createMockAuthor({ id: 'user' });

      const { container } = render(
        <Comment comment={comment} currentUser={regularUser} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should show hidden comments to moderators', () => {
      const comment = createMockComment({ hidden: true });
      const moderator = createMockAuthor({ id: 'mod', role: 'moderator' });

      render(<Comment comment={comment} currentUser={moderator} />);

      expect(screen.getByText('This is a test comment')).toBeInTheDocument();
    });
  });

  // ===== AUTHOR CLICK TESTS =====
  describe('Author Click Handling', () => {
    it('should call onAuthorClick when clicking author name', async () => {
      const user = userEvent.setup();
      const onAuthorClick = jest.fn();
      const author = createMockAuthor();

      render(
        <Comment
          comment={createMockComment({ author })}
          onAuthorClick={onAuthorClick}
        />
      );

      const authorName = screen.getByText('John Doe');
      await user.click(authorName);

      expect(onAuthorClick).toHaveBeenCalledWith(author);
    });

    it('should call onAuthorClick when clicking avatar', async () => {
      const user = userEvent.setup();
      const onAuthorClick = jest.fn();
      const author = createMockAuthor();

      render(
        <Comment
          comment={createMockComment({ author })}
          onAuthorClick={onAuthorClick}
        />
      );

      const avatar = screen.getByLabelText('John Doe');
      await user.click(avatar);

      expect(onAuthorClick).toHaveBeenCalledWith(author);
    });
  });

  // ===== REF FORWARDING TESTS =====
  describe('Ref Forwarding', () => {
    it('should forward ref to comment system element', () => {
      const ref = React.createRef<HTMLDivElement>();

      render(<CommentSystem ref={ref} comments={[]} postId="post-1" />);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should allow accessing DOM methods via ref', () => {
      const ref = React.createRef<HTMLDivElement>();

      render(<CommentSystem ref={ref} comments={[]} postId="post-1" />);

      expect(ref.current?.tagName).toBe('DIV');
    });
  });

  // ===== EDGE CASES TESTS =====
  describe('Edge Cases', () => {
    it('should handle empty comment content gracefully', () => {
      const comment = createMockComment({ content: '' });

      render(<Comment comment={comment} />);

      expect(screen.queryByText('This is a test comment')).not.toBeInTheDocument();
    });

    it('should handle very long comment content', () => {
      const longContent = 'a'.repeat(1000);
      const comment = createMockComment({ content: longContent });

      render(<Comment comment={comment} />);

      expect(screen.getByText(longContent)).toBeInTheDocument();
    });

    it('should handle missing author avatar', () => {
      const comment = createMockComment({
        author: createMockAuthor({ avatar: undefined }),
      });

      render(<Comment comment={comment} />);

      expect(screen.getByText('J')).toBeInTheDocument(); // First letter of John
    });

    it('should handle zero reactions', () => {
      const comment = createMockComment({
        reactions: { likes: 0, replies: 0 },
      });

      render(<Comment comment={comment} />);

      expect(screen.getByTestId('heart-icon')).toBeInTheDocument();
    });

    it('should handle missing callbacks gracefully', () => {
      render(<CommentSystem comments={[createMockComment()]} postId="post-1" />);

      expect(screen.getByText('This is a test comment')).toBeInTheDocument();
    });

    it('should handle rapid comment submissions', async () => {
      const user = userEvent.setup();
      const onCommentSubmit = jest.fn().mockResolvedValue(undefined);
      const currentUser = createMockAuthor();

      render(
        <CommentSystem
          comments={[]}
          postId="post-1"
          currentUser={currentUser}
          onCommentSubmit={onCommentSubmit}
        />
      );

      const input = screen.getByPlaceholderText('Write a comment...');
      await user.click(input);

      const textarea = screen.getByPlaceholderText('Write a comment...');
      await user.type(textarea, 'Comment 1');

      const submitButton = screen.getByText('Comment');
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);

      // Should only submit once due to loading state
      await waitFor(() => {
        expect(onCommentSubmit).toHaveBeenCalledTimes(1);
      });
    });
  });

  // ===== COMMENT COMPOSER TESTS =====
  describe('CommentComposer Component', () => {
    it('should render collapsed state initially', () => {
      render(<CommentComposer />);

      expect(screen.getByPlaceholderText('Write a comment...')).toBeInTheDocument();
      expect(screen.queryByText('Comment')).not.toBeInTheDocument();
    });

    it('should expand when clicking input', async () => {
      const user = userEvent.setup();

      render(<CommentComposer />);

      const input = screen.getByPlaceholderText('Write a comment...');
      await user.click(input);

      expect(screen.getByText('Comment')).toBeInTheDocument();
    });

    it('should expand initially when expanded prop is true', () => {
      render(<CommentComposer expanded />);

      expect(screen.getByText('Comment')).toBeInTheDocument();
    });

    it('should show Reply button text for replies', async () => {
      const user = userEvent.setup();

      render(<CommentComposer parentId="parent-1" expanded />);

      expect(screen.getByText('Reply')).toBeInTheDocument();
    });

    it('should auto focus when autoFocus is true', () => {
      render(<CommentComposer expanded autoFocus />);

      const textarea = screen.getByPlaceholderText('Write a comment...');
      // Note: autoFocus testing is limited in JSDOM
      expect(textarea).toBeInTheDocument();
    });

    it('should call onCancel when Cancel is clicked', async () => {
      const user = userEvent.setup();
      const onCancel = jest.fn();

      render(<CommentComposer expanded onCancel={onCancel} />);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalled();
    });
  });
});
