/**
 * CRYB Design System - Modern Threaded Comments Component Tests
 * Comprehensive test suite for the threaded comment system
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModernThreadedComments, Comment, CommentAuthor } from './ModernThreadedComments';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock child components
jest.mock('./VoteButtons', () => ({
  VoteButtons: ({ score, userVote, onVote, orientation, size }: any) => (
    <div data-testid="vote-buttons">
      <button onClick={() => onVote('up')} aria-label="Upvote">
        Upvote
      </button>
      <span data-testid="vote-score">{score}</span>
      <button onClick={() => onVote('down')} aria-label="Downvote">
        Downvote
      </button>
      <span data-testid="user-vote">{userVote || 'none'}</span>
    </div>
  ),
}));

jest.mock('./RichTextEditor', () => ({
  RichTextEditor: ({ value, onChange, placeholder, autoFocus }: any) => (
    <textarea
      data-testid="rich-text-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
    />
  ),
}));

jest.mock('../ui/card', () => ({
  Card: ({ children, className, variant, ...props }: any) => (
    <div className={className} data-variant={variant} {...props}>
      {children}
    </div>
  ),
}));

jest.mock('../ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, className, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-variant={variant}
      data-size={size}
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
jest.mock('@radix-ui/react-dropdown-menu', () => ({
  Root: ({ children }: any) => <div data-testid="dropdown-root">{children}</div>,
  Trigger: ({ children, asChild }: any) => <div data-testid="dropdown-trigger">{children}</div>,
  Portal: ({ children }: any) => <div data-testid="dropdown-portal">{children}</div>,
  Content: ({ children, ...props }: any) => (
    <div data-testid="dropdown-content" {...props}>
      {children}
    </div>
  ),
  Item: ({ children, onClick, ...props }: any) => (
    <div data-testid="dropdown-item" onClick={onClick} {...props}>
      {children}
    </div>
  ),
  Separator: () => <div data-testid="dropdown-separator" />,
}));

// Test data helpers
const createMockAuthor = (overrides?: Partial<CommentAuthor>): CommentAuthor => ({
  id: 'user-1',
  username: 'testuser',
  displayName: 'Test User',
  avatar: 'https://example.com/avatar.jpg',
  verified: false,
  badges: [],
  ...overrides,
});

const createMockComment = (overrides?: Partial<Comment>): Comment => ({
  id: 'comment-1',
  content: 'This is a test comment',
  author: createMockAuthor(),
  score: 10,
  userVote: null,
  createdAt: new Date('2025-01-01T12:00:00Z'),
  replies: [],
  depth: 0,
  ...overrides,
});

describe('ModernThreadedComments', () => {
  const mockHandlers = {
    onReply: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onVote: jest.fn(),
    onReport: jest.fn(),
    onSortChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Date.now() for consistent time calculations
    jest.spyOn(Date, 'now').mockImplementation(() => new Date('2025-01-01T12:30:00Z').getTime());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the component with no comments', () => {
      render(<ModernThreadedComments comments={[]} />);

      expect(screen.getByText('0 Comments')).toBeInTheDocument();
      expect(screen.getByText('No comments yet. Be the first to share your thoughts!')).toBeInTheDocument();
    });

    it('should render comment count correctly (singular)', () => {
      const comments = [createMockComment()];
      render(<ModernThreadedComments comments={comments} />);

      expect(screen.getByText('1 Comment')).toBeInTheDocument();
    });

    it('should render comment count correctly (plural)', () => {
      const comments = [
        createMockComment({ id: 'comment-1' }),
        createMockComment({ id: 'comment-2' }),
      ];
      render(<ModernThreadedComments comments={comments} />);

      expect(screen.getByText('2 Comments')).toBeInTheDocument();
    });

    it('should render new comment form', () => {
      render(<ModernThreadedComments comments={[]} />);

      expect(screen.getByPlaceholderText('What are your thoughts?')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /comment/i })).toBeInTheDocument();
    });

    it('should render sort dropdown with default value', () => {
      render(<ModernThreadedComments comments={[]} />);

      const sortSelect = screen.getByRole('combobox');
      expect(sortSelect).toHaveValue('best');
      expect(screen.getByText('Sort by:')).toBeInTheDocument();
    });
  });

  describe('Comment Thread Rendering', () => {
    it('should render a single comment', () => {
      const comment = createMockComment({
        content: 'Test comment content',
        author: createMockAuthor({ displayName: 'John Doe' }),
      });
      render(<ModernThreadedComments comments={[comment]} />);

      expect(screen.getByText('Test comment content')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should render comment author avatar', () => {
      const comment = createMockComment({
        author: createMockAuthor({
          displayName: 'Jane Doe',
          avatar: 'https://example.com/avatar.jpg',
        }),
      });
      render(<ModernThreadedComments comments={[comment]} />);

      const avatar = screen.getByAltText('Jane Doe');
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('should render author initials when no avatar provided', () => {
      const comment = createMockComment({
        author: createMockAuthor({
          displayName: 'Test User',
          avatar: undefined,
        }),
      });
      render(<ModernThreadedComments comments={[comment]} />);

      expect(screen.getByText('T')).toBeInTheDocument();
    });

    it('should render verified badge for verified authors', () => {
      const comment = createMockComment({
        author: createMockAuthor({ verified: true }),
      });
      render(<ModernThreadedComments comments={[comment]} />);

      const verifiedBadge = screen.getByTitle('Verified');
      expect(verifiedBadge).toHaveTextContent('✓');
    });

    it('should render OP badge for original poster', () => {
      const comment = createMockComment({ isOP: true });
      render(<ModernThreadedComments comments={[comment]} />);

      expect(screen.getByText('OP')).toBeInTheDocument();
    });

    it('should render MOD badge for moderators', () => {
      const comment = createMockComment({ isMod: true });
      render(<ModernThreadedComments comments={[comment]} />);

      expect(screen.getByText('MOD')).toBeInTheDocument();
    });

    it('should render custom author badges', () => {
      const comment = createMockComment({
        author: createMockAuthor({ badges: ['Contributor', 'Early Adopter'] }),
      });
      render(<ModernThreadedComments comments={[comment]} />);

      expect(screen.getByText('Contributor')).toBeInTheDocument();
      expect(screen.getByText('Early Adopter')).toBeInTheDocument();
    });

    it('should render edited indicator', () => {
      const comment = createMockComment({
        edited: new Date('2025-01-01T12:15:00Z'),
      });
      render(<ModernThreadedComments comments={[comment]} />);

      expect(screen.getByText('(edited)')).toBeInTheDocument();
    });

    it('should render awards count', () => {
      const comment = createMockComment({ awards: 5 });
      render(<ModernThreadedComments comments={[comment]} />);

      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  describe('Nested Comments/Replies', () => {
    it('should render nested replies', () => {
      const comment = createMockComment({
        id: 'parent',
        content: 'Parent comment',
        replies: [
          createMockComment({
            id: 'child-1',
            content: 'Child comment 1',
          }),
          createMockComment({
            id: 'child-2',
            content: 'Child comment 2',
          }),
        ],
      });
      render(<ModernThreadedComments comments={[comment]} />);

      expect(screen.getByText('Parent comment')).toBeInTheDocument();
      expect(screen.getByText('Child comment 1')).toBeInTheDocument();
      expect(screen.getByText('Child comment 2')).toBeInTheDocument();
    });

    it('should render reply count badge', () => {
      const comment = createMockComment({
        replies: [createMockComment({ id: 'reply-1' })],
      });
      render(<ModernThreadedComments comments={[comment]} />);

      expect(screen.getByText('1 reply')).toBeInTheDocument();
    });

    it('should render reply count badge with plural form', () => {
      const comment = createMockComment({
        replies: [
          createMockComment({ id: 'reply-1' }),
          createMockComment({ id: 'reply-2' }),
        ],
      });
      render(<ModernThreadedComments comments={[comment]} />);

      expect(screen.getByText('2 replies')).toBeInTheDocument();
    });

    it('should render deeply nested comments up to max depth', () => {
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
                replies: [
                  createMockComment({
                    id: 'level-3',
                    content: 'Level 3',
                  }),
                ],
              }),
            ],
          }),
        ],
      });
      render(<ModernThreadedComments comments={[comment]} maxDepth={8} />);

      expect(screen.getByText('Level 0')).toBeInTheDocument();
      expect(screen.getByText('Level 1')).toBeInTheDocument();
      expect(screen.getByText('Level 2')).toBeInTheDocument();
      expect(screen.getByText('Level 3')).toBeInTheDocument();
    });

    it('should show "Continue this thread" link when max depth reached', () => {
      const comment = createMockComment({
        id: 'level-0',
        replies: [
          createMockComment({
            id: 'level-1',
            replies: [
              createMockComment({
                id: 'level-2',
                replies: [createMockComment({ id: 'level-3' })],
              }),
            ],
          }),
        ],
      });
      render(<ModernThreadedComments comments={[comment]} maxDepth={2} />);

      expect(screen.getByText(/Continue this thread/)).toBeInTheDocument();
    });
  });

  describe('Comment Submission', () => {
    it('should allow submitting a new comment', async () => {
      const user = userEvent.setup();
      render(<ModernThreadedComments comments={[]} {...mockHandlers} />);

      const editor = screen.getByPlaceholderText('What are your thoughts?');
      await user.type(editor, 'This is my new comment');

      const submitButton = screen.getByRole('button', { name: /comment/i });
      await user.click(submitButton);

      expect(mockHandlers.onReply).toHaveBeenCalledWith('root', 'This is my new comment');
    });

    it('should clear input after submitting comment', async () => {
      const user = userEvent.setup();
      render(<ModernThreadedComments comments={[]} {...mockHandlers} />);

      const editor = screen.getByPlaceholderText('What are your thoughts?');
      await user.type(editor, 'New comment');

      const submitButton = screen.getByRole('button', { name: /comment/i });
      await user.click(submitButton);

      expect(editor).toHaveValue('');
    });

    it('should disable submit button when input is empty', () => {
      render(<ModernThreadedComments comments={[]} {...mockHandlers} />);

      const submitButton = screen.getByRole('button', { name: /comment/i });
      expect(submitButton).toBeDisabled();
    });

    it('should not submit empty or whitespace-only comments', async () => {
      const user = userEvent.setup();
      render(<ModernThreadedComments comments={[]} {...mockHandlers} />);

      const editor = screen.getByPlaceholderText('What are your thoughts?');
      await user.type(editor, '   ');

      const submitButton = screen.getByRole('button', { name: /comment/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Reply to Comment', () => {
    it('should show reply form when Reply button clicked', async () => {
      const user = userEvent.setup();
      const comment = createMockComment({
        author: createMockAuthor({ displayName: 'John Doe' }),
      });
      render(<ModernThreadedComments comments={[comment]} {...mockHandlers} />);

      const replyButton = screen.getByRole('button', { name: /reply/i });
      await user.click(replyButton);

      expect(screen.getByPlaceholderText('Reply to John Doe...')).toBeInTheDocument();
    });

    it('should submit reply when Reply button in form clicked', async () => {
      const user = userEvent.setup();
      const comment = createMockComment({ id: 'comment-123' });
      render(<ModernThreadedComments comments={[comment]} {...mockHandlers} />);

      const replyButton = screen.getByRole('button', { name: /reply/i });
      await user.click(replyButton);

      const replyEditor = screen.getByPlaceholderText(/Reply to/);
      await user.type(replyEditor, 'This is my reply');

      const submitReplyButton = screen.getAllByRole('button', { name: /reply/i })[1];
      await user.click(submitReplyButton);

      expect(mockHandlers.onReply).toHaveBeenCalledWith('comment-123', 'This is my reply');
    });

    it('should close reply form after submitting', async () => {
      const user = userEvent.setup();
      const comment = createMockComment();
      render(<ModernThreadedComments comments={[comment]} {...mockHandlers} />);

      const replyButton = screen.getByRole('button', { name: /reply/i });
      await user.click(replyButton);

      const replyEditor = screen.getByPlaceholderText(/Reply to/);
      await user.type(replyEditor, 'Reply text');

      const submitReplyButton = screen.getAllByRole('button', { name: /reply/i })[1];
      await user.click(submitReplyButton);

      expect(screen.queryByPlaceholderText(/Reply to/)).not.toBeInTheDocument();
    });

    it('should cancel reply form when Cancel clicked', async () => {
      const user = userEvent.setup();
      const comment = createMockComment();
      render(<ModernThreadedComments comments={[comment]} {...mockHandlers} />);

      const replyButton = screen.getByRole('button', { name: /reply/i });
      await user.click(replyButton);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(screen.queryByPlaceholderText(/Reply to/)).not.toBeInTheDocument();
    });

    it('should disable reply submit button when reply is empty', async () => {
      const user = userEvent.setup();
      const comment = createMockComment();
      render(<ModernThreadedComments comments={[comment]} {...mockHandlers} />);

      const replyButton = screen.getByRole('button', { name: /reply/i });
      await user.click(replyButton);

      const submitReplyButton = screen.getAllByRole('button', { name: /reply/i })[1];
      expect(submitReplyButton).toBeDisabled();
    });

    it('should not show reply button when max depth reached', () => {
      const deepComment = createMockComment({ id: 'deep' });
      render(
        <ModernThreadedComments
          comments={[deepComment]}
          maxDepth={0}
          {...mockHandlers}
        />
      );

      expect(screen.queryByRole('button', { name: /reply/i })).not.toBeInTheDocument();
    });
  });

  describe('Comment Editing', () => {
    it('should show edit form when Edit menu item clicked', async () => {
      const user = userEvent.setup();
      const comment = createMockComment({
        author: createMockAuthor({ id: 'current-user' }),
      });
      render(
        <ModernThreadedComments
          comments={[comment]}
          currentUserId="current-user"
          {...mockHandlers}
        />
      );

      // Find and click the dropdown trigger
      const dropdownTrigger = screen.getByLabelText('More options');
      await user.click(dropdownTrigger);

      // Click Edit option
      const editItems = screen.getAllByText('Edit');
      await user.click(editItems[0]);

      expect(screen.getByPlaceholderText('Edit your comment...')).toBeInTheDocument();
    });

    it('should populate edit form with current comment content', async () => {
      const user = userEvent.setup();
      const comment = createMockComment({
        content: 'Original content',
        author: createMockAuthor({ id: 'current-user' }),
      });
      render(
        <ModernThreadedComments
          comments={[comment]}
          currentUserId="current-user"
          {...mockHandlers}
        />
      );

      const dropdownTrigger = screen.getByLabelText('More options');
      await user.click(dropdownTrigger);

      const editItems = screen.getAllByText('Edit');
      await user.click(editItems[0]);

      const editor = screen.getByPlaceholderText('Edit your comment...');
      expect(editor).toHaveValue('Original content');
    });

    it('should submit edited comment when Save clicked', async () => {
      const user = userEvent.setup();
      const comment = createMockComment({
        id: 'comment-123',
        content: 'Original content',
        author: createMockAuthor({ id: 'current-user' }),
      });
      render(
        <ModernThreadedComments
          comments={[comment]}
          currentUserId="current-user"
          {...mockHandlers}
        />
      );

      const dropdownTrigger = screen.getByLabelText('More options');
      await user.click(dropdownTrigger);

      const editItems = screen.getAllByText('Edit');
      await user.click(editItems[0]);

      const editor = screen.getByPlaceholderText('Edit your comment...');
      await user.clear(editor);
      await user.type(editor, 'Updated content');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(mockHandlers.onEdit).toHaveBeenCalledWith('comment-123', 'Updated content');
    });

    it('should cancel editing when Cancel clicked', async () => {
      const user = userEvent.setup();
      const comment = createMockComment({
        content: 'Original content',
        author: createMockAuthor({ id: 'current-user' }),
      });
      render(
        <ModernThreadedComments
          comments={[comment]}
          currentUserId="current-user"
          {...mockHandlers}
        />
      );

      const dropdownTrigger = screen.getByLabelText('More options');
      await user.click(dropdownTrigger);

      const editItems = screen.getAllByText('Edit');
      await user.click(editItems[0]);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(screen.queryByPlaceholderText('Edit your comment...')).not.toBeInTheDocument();
      expect(screen.getByText('Original content')).toBeInTheDocument();
    });

    it('should not submit edit if content unchanged', async () => {
      const user = userEvent.setup();
      const comment = createMockComment({
        content: 'Original content',
        author: createMockAuthor({ id: 'current-user' }),
      });
      render(
        <ModernThreadedComments
          comments={[comment]}
          currentUserId="current-user"
          {...mockHandlers}
        />
      );

      const dropdownTrigger = screen.getByLabelText('More options');
      await user.click(dropdownTrigger);

      const editItems = screen.getAllByText('Edit');
      await user.click(editItems[0]);

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(mockHandlers.onEdit).not.toHaveBeenCalled();
    });

    it('should not show Edit option for comments by other users', async () => {
      const user = userEvent.setup();
      const comment = createMockComment({
        author: createMockAuthor({ id: 'other-user' }),
      });
      render(
        <ModernThreadedComments
          comments={[comment]}
          currentUserId="current-user"
          {...mockHandlers}
        />
      );

      const dropdownTrigger = screen.getByLabelText('More options');
      await user.click(dropdownTrigger);

      const editItems = screen.queryAllByText('Edit');
      expect(editItems.length).toBe(0);
    });
  });

  describe('Comment Deletion', () => {
    it('should call onDelete when Delete menu item clicked', async () => {
      const user = userEvent.setup();
      const comment = createMockComment({
        id: 'comment-123',
        author: createMockAuthor({ id: 'current-user' }),
      });
      render(
        <ModernThreadedComments
          comments={[comment]}
          currentUserId="current-user"
          {...mockHandlers}
        />
      );

      const dropdownTrigger = screen.getByLabelText('More options');
      await user.click(dropdownTrigger);

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      expect(mockHandlers.onDelete).toHaveBeenCalledWith('comment-123');
    });

    it('should not show Delete option for comments by other users', async () => {
      const user = userEvent.setup();
      const comment = createMockComment({
        author: createMockAuthor({ id: 'other-user' }),
      });
      render(
        <ModernThreadedComments
          comments={[comment]}
          currentUserId="current-user"
          {...mockHandlers}
        />
      );

      const dropdownTrigger = screen.getByLabelText('More options');
      await user.click(dropdownTrigger);

      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });
  });

  describe('Comment Voting', () => {
    it('should render vote buttons with score', () => {
      const comment = createMockComment({ score: 42 });
      render(<ModernThreadedComments comments={[comment]} {...mockHandlers} />);

      expect(screen.getByTestId('vote-score')).toHaveTextContent('42');
    });

    it('should call onVote when upvote clicked', async () => {
      const user = userEvent.setup();
      const comment = createMockComment({ id: 'comment-123' });
      render(<ModernThreadedComments comments={[comment]} {...mockHandlers} />);

      const upvoteButton = screen.getByLabelText('Upvote');
      await user.click(upvoteButton);

      expect(mockHandlers.onVote).toHaveBeenCalledWith('comment-123', 'up');
    });

    it('should call onVote when downvote clicked', async () => {
      const user = userEvent.setup();
      const comment = createMockComment({ id: 'comment-123' });
      render(<ModernThreadedComments comments={[comment]} {...mockHandlers} />);

      const downvoteButton = screen.getByLabelText('Downvote');
      await user.click(downvoteButton);

      expect(mockHandlers.onVote).toHaveBeenCalledWith('comment-123', 'down');
    });

    it('should display user vote state', () => {
      const comment = createMockComment({ userVote: 'up' });
      render(<ModernThreadedComments comments={[comment]} {...mockHandlers} />);

      expect(screen.getByTestId('user-vote')).toHaveTextContent('up');
    });
  });

  describe('Comment Sorting', () => {
    it('should render sort options', () => {
      render(<ModernThreadedComments comments={[]} {...mockHandlers} />);

      const sortSelect = screen.getByRole('combobox');
      const options = within(sortSelect).getAllByRole('option');

      expect(options).toHaveLength(4);
      expect(options[0]).toHaveTextContent('Best');
      expect(options[1]).toHaveTextContent('Top');
      expect(options[2]).toHaveTextContent('New');
      expect(options[3]).toHaveTextContent('Controversial');
    });

    it('should call onSortChange when sort option selected', async () => {
      const user = userEvent.setup();
      render(<ModernThreadedComments comments={[]} {...mockHandlers} />);

      const sortSelect = screen.getByRole('combobox');
      await user.selectOptions(sortSelect, 'top');

      expect(mockHandlers.onSortChange).toHaveBeenCalledWith('top');
    });

    it('should display current sort value', () => {
      render(<ModernThreadedComments comments={[]} sortBy="new" {...mockHandlers} />);

      const sortSelect = screen.getByRole('combobox');
      expect(sortSelect).toHaveValue('new');
    });

    it('should handle all sort options', async () => {
      const user = userEvent.setup();
      render(<ModernThreadedComments comments={[]} {...mockHandlers} />);

      const sortSelect = screen.getByRole('combobox');

      await user.selectOptions(sortSelect, 'top');
      expect(mockHandlers.onSortChange).toHaveBeenCalledWith('top');

      await user.selectOptions(sortSelect, 'new');
      expect(mockHandlers.onSortChange).toHaveBeenCalledWith('new');

      await user.selectOptions(sortSelect, 'controversial');
      expect(mockHandlers.onSortChange).toHaveBeenCalledWith('controversial');
    });
  });

  describe('Collapsed Threads', () => {
    it('should collapse thread when avatar clicked', async () => {
      const user = userEvent.setup();
      const comment = createMockComment({
        content: 'Comment content',
        author: createMockAuthor({ displayName: 'John Doe' }),
      });
      render(<ModernThreadedComments comments={[comment]} />);

      expect(screen.getByText('Comment content')).toBeInTheDocument();

      const avatar = screen.getByAltText('John Doe');
      await user.click(avatar);

      // Content should be hidden when collapsed
      expect(screen.queryByText('Comment content')).not.toBeInTheDocument();
    });

    it('should collapse thread when author name clicked', async () => {
      const user = userEvent.setup();
      const comment = createMockComment({
        content: 'Comment content',
        author: createMockAuthor({ displayName: 'John Doe' }),
      });
      render(<ModernThreadedComments comments={[comment]} />);

      const authorButton = screen.getByRole('button', { name: 'John Doe' });
      await user.click(authorButton);

      expect(screen.queryByText('Comment content')).not.toBeInTheDocument();
    });

    it('should toggle thread when reply count badge clicked', async () => {
      const user = userEvent.setup();
      const comment = createMockComment({
        content: 'Parent content',
        replies: [
          createMockComment({
            id: 'child',
            content: 'Child content',
          }),
        ],
      });
      render(<ModernThreadedComments comments={[comment]} />);

      const replyBadge = screen.getByRole('button', { name: /1 reply/i });
      await user.click(replyBadge);

      expect(screen.queryByText('Child content')).not.toBeInTheDocument();

      await user.click(replyBadge);

      expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('should hide nested replies when parent collapsed', async () => {
      const user = userEvent.setup();
      const comment = createMockComment({
        author: createMockAuthor({ displayName: 'Parent Author' }),
        replies: [
          createMockComment({
            id: 'child',
            content: 'Nested reply',
          }),
        ],
      });
      render(<ModernThreadedComments comments={[comment]} />);

      expect(screen.getByText('Nested reply')).toBeInTheDocument();

      const avatar = screen.getByAltText('Parent Author');
      await user.click(avatar);

      expect(screen.queryByText('Nested reply')).not.toBeInTheDocument();
    });
  });

  describe('Comment Actions Menu', () => {
    it('should render Report option for all users', async () => {
      const user = userEvent.setup();
      const comment = createMockComment();
      render(<ModernThreadedComments comments={[comment]} {...mockHandlers} />);

      const dropdownTrigger = screen.getByLabelText('More options');
      await user.click(dropdownTrigger);

      expect(screen.getByText('Report')).toBeInTheDocument();
    });

    it('should call onReport when Report clicked', async () => {
      const user = userEvent.setup();
      const comment = createMockComment({ id: 'comment-123' });
      render(<ModernThreadedComments comments={[comment]} {...mockHandlers} />);

      const dropdownTrigger = screen.getByLabelText('More options');
      await user.click(dropdownTrigger);

      const reportButton = screen.getByText('Report');
      await user.click(reportButton);

      expect(mockHandlers.onReport).toHaveBeenCalledWith('comment-123');
    });

    it('should show separator between author actions and report', async () => {
      const user = userEvent.setup();
      const comment = createMockComment({
        author: createMockAuthor({ id: 'current-user' }),
      });
      render(
        <ModernThreadedComments
          comments={[comment]}
          currentUserId="current-user"
          {...mockHandlers}
        />
      );

      const dropdownTrigger = screen.getByLabelText('More options');
      await user.click(dropdownTrigger);

      expect(screen.getByTestId('dropdown-separator')).toBeInTheDocument();
    });
  });

  describe('Time Formatting', () => {
    it('should display "just now" for very recent comments', () => {
      const comment = createMockComment({
        createdAt: new Date('2025-01-01T12:29:50Z'), // 10 seconds ago
      });
      render(<ModernThreadedComments comments={[comment]} />);

      expect(screen.getByText('just now')).toBeInTheDocument();
    });

    it('should display minutes ago', () => {
      const comment = createMockComment({
        createdAt: new Date('2025-01-01T12:15:00Z'), // 15 minutes ago
      });
      render(<ModernThreadedComments comments={[comment]} />);

      expect(screen.getByText('15m')).toBeInTheDocument();
    });

    it('should display hours ago', () => {
      const comment = createMockComment({
        createdAt: new Date('2025-01-01T10:30:00Z'), // 2 hours ago
      });
      render(<ModernThreadedComments comments={[comment]} />);

      expect(screen.getByText('2h')).toBeInTheDocument();
    });

    it('should display days ago', () => {
      const comment = createMockComment({
        createdAt: new Date('2024-12-29T12:30:00Z'), // 3 days ago
      });
      render(<ModernThreadedComments comments={[comment]} />);

      expect(screen.getByText('3d')).toBeInTheDocument();
    });

    it('should display full date for old comments', () => {
      const oldDate = new Date('2024-12-01T12:00:00Z');
      const comment = createMockComment({
        createdAt: oldDate,
      });
      render(<ModernThreadedComments comments={[comment]} />);

      expect(screen.getByText(oldDate.toLocaleDateString())).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button labels', () => {
      const comment = createMockComment();
      render(<ModernThreadedComments comments={[comment]} {...mockHandlers} />);

      expect(screen.getByLabelText('More options')).toBeInTheDocument();
      expect(screen.getByLabelText('Upvote')).toBeInTheDocument();
      expect(screen.getByLabelText('Downvote')).toBeInTheDocument();
    });

    it('should have proper alt text for avatars', () => {
      const comment = createMockComment({
        author: createMockAuthor({ displayName: 'John Doe' }),
      });
      render(<ModernThreadedComments comments={[comment]} />);

      expect(screen.getByAltText('John Doe')).toBeInTheDocument();
    });

    it('should have accessible form labels and placeholders', () => {
      const comment = createMockComment({
        author: createMockAuthor({ displayName: 'Jane Doe' }),
      });
      render(<ModernThreadedComments comments={[comment]} {...mockHandlers} />);

      expect(screen.getByPlaceholderText('What are your thoughts?')).toBeInTheDocument();
    });

    it('should support keyboard navigation for buttons', async () => {
      const user = userEvent.setup();
      const comment = createMockComment();
      render(<ModernThreadedComments comments={[comment]} {...mockHandlers} />);

      const replyButton = screen.getByRole('button', { name: /reply/i });

      await user.tab();
      // Button should be focusable
      replyButton.focus();
      expect(replyButton).toHaveFocus();
    });

    it('should have proper title attributes for context', () => {
      const comment = createMockComment({
        author: createMockAuthor({ verified: true }),
        edited: new Date('2025-01-01T12:15:00Z'),
      });
      render(<ModernThreadedComments comments={[comment]} />);

      expect(screen.getByTitle('Verified')).toBeInTheDocument();
      expect(screen.getByTitle(/Edited/)).toBeInTheDocument();
    });

    it('should auto-focus reply editor when opened', async () => {
      const user = userEvent.setup();
      const comment = createMockComment();
      render(<ModernThreadedComments comments={[comment]} {...mockHandlers} />);

      const replyButton = screen.getByRole('button', { name: /reply/i });
      await user.click(replyButton);

      const editor = screen.getByPlaceholderText(/Reply to/);
      expect(editor).toHaveAttribute('autoFocus', 'true');
    });

    it('should auto-focus edit editor when opened', async () => {
      const user = userEvent.setup();
      const comment = createMockComment({
        author: createMockAuthor({ id: 'current-user' }),
      });
      render(
        <ModernThreadedComments
          comments={[comment]}
          currentUserId="current-user"
          {...mockHandlers}
        />
      );

      const dropdownTrigger = screen.getByLabelText('More options');
      await user.click(dropdownTrigger);

      const editItems = screen.getAllByText('Edit');
      await user.click(editItems[0]);

      const editor = screen.getByPlaceholderText('Edit your comment...');
      expect(editor).toHaveAttribute('autoFocus', 'true');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing optional fields gracefully', () => {
      const minimalComment: Comment = {
        id: 'minimal',
        content: 'Minimal comment',
        author: {
          id: 'user-1',
          username: 'user',
          displayName: 'User',
        },
        score: 0,
        createdAt: new Date(),
      };
      render(<ModernThreadedComments comments={[minimalComment]} />);

      expect(screen.getByText('Minimal comment')).toBeInTheDocument();
    });

    it('should handle empty replies array', () => {
      const comment = createMockComment({ replies: [] });
      render(<ModernThreadedComments comments={[comment]} />);

      expect(screen.queryByText(/reply/i)).toBeInTheDocument(); // Reply button
      expect(screen.queryByText(/replies/)).not.toBeInTheDocument(); // No reply count
    });

    it('should trim whitespace from submitted content', async () => {
      const user = userEvent.setup();
      render(<ModernThreadedComments comments={[]} {...mockHandlers} />);

      const editor = screen.getByPlaceholderText('What are your thoughts?');
      await user.type(editor, '  Content with spaces  ');

      const submitButton = screen.getByRole('button', { name: /comment/i });
      await user.click(submitButton);

      expect(mockHandlers.onReply).toHaveBeenCalledWith('root', 'Content with spaces');
    });

    it('should handle maxDepth of 0', () => {
      const comment = createMockComment();
      render(<ModernThreadedComments comments={[comment]} maxDepth={0} />);

      // Should not show reply button at depth 0 with maxDepth 0
      expect(screen.queryByRole('button', { name: /reply/i })).not.toBeInTheDocument();
    });

    it('should handle very long comment content', () => {
      const longContent = 'A'.repeat(5000);
      const comment = createMockComment({ content: longContent });
      render(<ModernThreadedComments comments={[comment]} />);

      expect(screen.getByText(longContent)).toBeInTheDocument();
    });

    it('should handle special characters in content', () => {
      const specialContent = '<script>alert("xss")</script> & " \' \n\t';
      const comment = createMockComment({ content: specialContent });
      render(<ModernThreadedComments comments={[comment]} />);

      expect(screen.getByText(specialContent)).toBeInTheDocument();
    });

    it('should handle multiple badges', () => {
      const comment = createMockComment({
        author: createMockAuthor({
          badges: ['Badge 1', 'Badge 2', 'Badge 3', 'Badge 4'],
        }),
      });
      render(<ModernThreadedComments comments={[comment]} />);

      expect(screen.getByText('Badge 1')).toBeInTheDocument();
      expect(screen.getByText('Badge 2')).toBeInTheDocument();
      expect(screen.getByText('Badge 3')).toBeInTheDocument();
      expect(screen.getByText('Badge 4')).toBeInTheDocument();
    });

    it('should handle negative scores', () => {
      const comment = createMockComment({ score: -15 });
      render(<ModernThreadedComments comments={[comment]} />);

      expect(screen.getByTestId('vote-score')).toHaveTextContent('-15');
    });

    it('should handle zero score', () => {
      const comment = createMockComment({ score: 0 });
      render(<ModernThreadedComments comments={[comment]} />);

      expect(screen.getByTestId('vote-score')).toHaveTextContent('0');
    });

    it('should handle missing currentUserId', () => {
      const comment = createMockComment();
      render(<ModernThreadedComments comments={[comment]} {...mockHandlers} />);

      // Should still render but not show author-specific actions
      expect(screen.getByText(comment.content)).toBeInTheDocument();
    });

    it('should handle missing handlers gracefully', () => {
      const comment = createMockComment();
      render(<ModernThreadedComments comments={[comment]} />);

      // Should render without errors
      expect(screen.getByText(comment.content)).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should render VoteButtons with correct props', () => {
      const comment = createMockComment({
        score: 42,
        userVote: 'up',
      });
      render(<ModernThreadedComments comments={[comment]} {...mockHandlers} />);

      const voteButtons = screen.getByTestId('vote-buttons');
      expect(voteButtons).toBeInTheDocument();
      expect(screen.getByTestId('vote-score')).toHaveTextContent('42');
      expect(screen.getByTestId('user-vote')).toHaveTextContent('up');
    });

    it('should render RichTextEditor for new comments', () => {
      render(<ModernThreadedComments comments={[]} />);

      const editor = screen.getByTestId('rich-text-editor');
      expect(editor).toBeInTheDocument();
    });

    it('should render RichTextEditor for replies', async () => {
      const user = userEvent.setup();
      const comment = createMockComment();
      render(<ModernThreadedComments comments={[comment]} />);

      const replyButton = screen.getByRole('button', { name: /reply/i });
      await user.click(replyButton);

      const editors = screen.getAllByTestId('rich-text-editor');
      expect(editors.length).toBeGreaterThan(1);
    });

    it('should render RichTextEditor for editing', async () => {
      const user = userEvent.setup();
      const comment = createMockComment({
        author: createMockAuthor({ id: 'current-user' }),
      });
      render(
        <ModernThreadedComments
          comments={[comment]}
          currentUserId="current-user"
          {...mockHandlers}
        />
      );

      const dropdownTrigger = screen.getByLabelText('More options');
      await user.click(dropdownTrigger);

      const editItems = screen.getAllByText('Edit');
      await user.click(editItems[0]);

      const editor = screen.getByPlaceholderText('Edit your comment...');
      expect(editor).toBeInTheDocument();
    });
  });

  describe('Display Name', () => {
    it('should have correct display name', () => {
      expect(ModernThreadedComments.displayName).toBe('ModernThreadedComments');
    });
  });
});
