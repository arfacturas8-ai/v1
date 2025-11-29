import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import AdvancedThreadedComments from './AdvancedThreadedComments'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  MessageSquare: ({ className }) => <span data-testid="message-square-icon" className={className} />,
  ChevronDown: ({ className }) => <span data-testid="chevron-down-icon" className={className} />,
  ChevronRight: ({ className }) => <span data-testid="chevron-right-icon" className={className} />,
  ChevronUp: ({ className }) => <span data-testid="chevron-up-icon" className={className} />,
  MoreVertical: ({ className }) => <span data-testid="more-vertical-icon" className={className} />,
  Reply: ({ className }) => <span data-testid="reply-icon" className={className} />,
  Heart: ({ className }) => <span data-testid="heart-icon" className={className} />,
  Flag: ({ className }) => <span data-testid="flag-icon" className={className} />,
  Edit: ({ className }) => <span data-testid="edit-icon" className={className} />,
  Trash: ({ className }) => <span data-testid="trash-icon" className={className} />,
  User: ({ className }) => <span data-testid="user-icon" className={className} />,
  Clock: ({ className }) => <span data-testid="clock-icon" className={className} />,
  Award: ({ className }) => <span data-testid="award-icon" className={className} />,
  Crown: ({ className }) => <span data-testid="crown-icon" className={className} />,
  Shield: ({ className }) => <span data-testid="shield-icon" className={className} />,
  ArrowUp: ({ className }) => <span data-testid="arrow-up-icon" className={className} />,
  ArrowDown: ({ className }) => <span data-testid="arrow-down-icon" className={className} />,
  Bookmark: ({ className }) => <span data-testid="bookmark-icon" className={className} />,
  Share: ({ className }) => <span data-testid="share-icon" className={className} />,
  Eye: ({ className }) => <span data-testid="eye-icon" className={className} />,
  EyeOff: ({ className }) => <span data-testid="eye-off-icon" className={className} />,
  Filter: ({ className }) => <span data-testid="filter-icon" className={className} />,
  Search: ({ className }) => <span data-testid="search-icon" className={className} />,
  RefreshCw: ({ className }) => <span data-testid="refresh-icon" className={className} />,
}))

// Mock Socket.IO
const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
}

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
}))

describe('AdvancedThreadedComments', () => {
  const mockCurrentUser = {
    id: 'user-1',
    username: 'TestUser',
    avatar: 'https://example.com/avatar.jpg'
  }

  const mockComments = [
    {
      id: 'comment-1',
      content: 'This is the first comment',
      author: {
        id: 'user-1',
        username: 'TestUser',
        avatar: 'https://example.com/avatar.jpg',
        isOP: false,
        isVerified: false,
        isPremium: false,
      },
      timestamp: new Date('2025-01-01T10:00:00').toISOString(),
      score: 15,
      userVote: null,
      edited: false,
      deleted: false,
      removed: false,
      stickied: false,
      distinguished: false,
      gilded: false,
      controversialScore: 0,
      awards: [],
      replies: []
    },
    {
      id: 'comment-2',
      content: 'This is the second comment',
      author: {
        id: 'user-2',
        username: 'AnotherUser',
        isOP: true,
        isVerified: true,
        isPremium: false,
      },
      timestamp: new Date('2025-01-01T11:00:00').toISOString(),
      score: 8,
      userVote: 'up',
      edited: true,
      deleted: false,
      removed: false,
      stickied: true,
      distinguished: false,
      gilded: true,
      controversialScore: 0.3,
      awards: [{ icon: '🏆', count: 2 }],
      replies: [
        {
          id: 'comment-3',
          content: 'This is a reply',
          author: {
            id: 'user-3',
            username: 'ReplyUser',
            isOP: false,
            isVerified: false,
            isPremium: true,
          },
          timestamp: new Date('2025-01-01T12:00:00').toISOString(),
          score: 3,
          userVote: null,
          edited: false,
          deleted: false,
          removed: false,
          stickied: false,
          distinguished: true,
          gilded: false,
          controversialScore: 0,
          awards: [],
          replies: []
        }
      ]
    }
  ]

  const mockHandlers = {
    onAddComment: jest.fn(),
    onReply: jest.fn(),
    onVote: jest.fn(),
    onReact: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onReport: jest.fn(),
    onAward: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={[]}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      expect(screen.getByPlaceholderText('Add a comment...')).toBeInTheDocument()
    })

    it('should render comments header with count', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          totalCount={2}
          {...mockHandlers}
        />
      )
      expect(screen.getByText('2 Comments')).toBeInTheDocument()
    })

    it('should render singular comment text when count is 1', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={[mockComments[0]]}
          currentUser={mockCurrentUser}
          totalCount={1}
          {...mockHandlers}
        />
      )
      expect(screen.getByText('1 Comment')).toBeInTheDocument()
    })

    it('should render current user information in comment form', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={[]}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      expect(screen.getByText('TestUser')).toBeInTheDocument()
      expect(screen.getByAltText('TestUser')).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    })

    it('should display "Anonymous" when no current user is provided', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={[]}
          currentUser={null}
          {...mockHandlers}
        />
      )
      expect(screen.getByText('Anonymous')).toBeInTheDocument()
    })

    it('should show user icon when current user has no avatar', () => {
      const userWithoutAvatar = { id: 'user-1', username: 'TestUser' }
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={[]}
          currentUser={userWithoutAvatar}
          {...mockHandlers}
        />
      )
      expect(screen.getAllByTestId('user-icon')[0]).toBeInTheDocument()
    })

    it('should render comment form with submit button', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={[]}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      expect(screen.getByRole('button', { name: /comment/i })).toBeInTheDocument()
    })

    it('should render comments when provided', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      expect(screen.getByText('This is the first comment')).toBeInTheDocument()
      expect(screen.getByText('This is the second comment')).toBeInTheDocument()
    })

    it('should render comment author information', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      expect(screen.getAllByText('TestUser').length).toBeGreaterThan(0)
      expect(screen.getByText('AnotherUser')).toBeInTheDocument()
    })

    it('should render OP badge for original poster', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      expect(screen.getByText('OP')).toBeInTheDocument()
    })

    it('should render verified badge', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      expect(screen.getByTestId('shield-icon')).toBeInTheDocument()
    })

    it('should render premium badge', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      expect(screen.getByTestId('crown-icon')).toBeInTheDocument()
    })

    it('should render pinned badge for stickied comments', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      expect(screen.getByText('Pinned')).toBeInTheDocument()
    })

    it('should render mod badge for distinguished comments', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      expect(screen.getByText('Mod')).toBeInTheDocument()
    })

    it('should render award icon for gilded comments', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      const awardIcons = screen.getAllByTestId('award-icon')
      expect(awardIcons.length).toBeGreaterThan(0)
    })

    it('should render edited indicator', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      expect(screen.getByText('(edited)')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should render empty state when no comments exist', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={[]}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      expect(screen.getByText('No comments yet')).toBeInTheDocument()
      expect(screen.getByText('Be the first to share your thoughts!')).toBeInTheDocument()
    })

    it('should render empty state icon', () => {
      const { container } = render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={[]}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      const emptyStateIcons = screen.getAllByTestId('message-square-icon')
      expect(emptyStateIcons.length).toBeGreaterThan(0)
    })
  })

  describe('Loading State', () => {
    it('should render loading spinner when loading is true', () => {
      const { container } = render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={[]}
          currentUser={mockCurrentUser}
          loading={true}
          {...mockHandlers}
        />
      )
      expect(container.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('should not render comments when loading', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          loading={true}
          {...mockHandlers}
        />
      )
      expect(screen.queryByText('This is the first comment')).not.toBeInTheDocument()
    })
  })

  describe('Add Comment Functionality', () => {
    it('should update textarea value when typing', async () => {
      const user = userEvent.setup()
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={[]}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      const textarea = screen.getByPlaceholderText('Add a comment...')
      await user.type(textarea, 'New comment text')
      expect(textarea).toHaveValue('New comment text')
    })

    it('should have disabled submit button when textarea is empty', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={[]}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      const submitButton = screen.getByRole('button', { name: /comment/i })
      expect(submitButton).toBeDisabled()
    })

    it('should enable submit button when textarea has content', async () => {
      const user = userEvent.setup()
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={[]}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      const textarea = screen.getByPlaceholderText('Add a comment...')
      const submitButton = screen.getByRole('button', { name: /comment/i })

      await user.type(textarea, 'New comment')
      expect(submitButton).not.toBeDisabled()
    })

    it('should call onAddComment when form is submitted', async () => {
      const user = userEvent.setup()
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={[]}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      const textarea = screen.getByPlaceholderText('Add a comment...')
      await user.type(textarea, 'New comment text')
      await user.click(screen.getByRole('button', { name: /comment/i }))

      expect(mockHandlers.onAddComment).toHaveBeenCalledWith('New comment text')
    })

    it('should clear textarea after successful submission', async () => {
      const user = userEvent.setup()
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={[]}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      const textarea = screen.getByPlaceholderText('Add a comment...')
      await user.type(textarea, 'New comment')
      await user.click(screen.getByRole('button', { name: /comment/i }))

      expect(textarea).toHaveValue('')
    })

    it('should trim whitespace from comment before submitting', async () => {
      const user = userEvent.setup()
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={[]}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      const textarea = screen.getByPlaceholderText('Add a comment...')
      await user.type(textarea, '  New comment  ')
      await user.click(screen.getByRole('button', { name: /comment/i }))

      expect(mockHandlers.onAddComment).toHaveBeenCalledWith('New comment')
    })

    it('should not submit when textarea contains only whitespace', async () => {
      const user = userEvent.setup()
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={[]}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      const textarea = screen.getByPlaceholderText('Add a comment...')
      await user.type(textarea, '   ')

      const submitButton = screen.getByRole('button', { name: /comment/i })
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Nested Comments Display', () => {
    it('should render nested replies', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      expect(screen.getByText('This is a reply')).toBeInTheDocument()
    })

    it('should apply correct depth class to nested comments', () => {
      const { container } = render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      expect(container.querySelector('.depth-0')).toBeInTheDocument()
      expect(container.querySelector('.depth-1')).toBeInTheDocument()
    })

    it('should render thread lines for nested comments', () => {
      const { container } = render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      expect(container.querySelector('.thread-lines')).toBeInTheDocument()
    })

    it('should render collapse button when comment has replies', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      const collapseButtons = screen.getAllByTestId('chevron-down-icon')
      expect(collapseButtons.length).toBeGreaterThan(0)
    })

    it('should not render collapse button when comment has no replies', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={[mockComments[0]]}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      expect(screen.queryByTestId('chevron-down-icon')).not.toBeInTheDocument()
    })
  })

  describe('Collapse/Expand Functionality', () => {
    it('should collapse thread when collapse button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const collapseButton = screen.getByTitle('Collapse thread')
      await user.click(collapseButton)

      await waitFor(() => {
        expect(screen.queryByText('This is a reply')).not.toBeInTheDocument()
      })
    })

    it('should show chevron right icon when thread is collapsed', async () => {
      const user = userEvent.setup()
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const collapseButton = screen.getByTitle('Collapse thread')
      await user.click(collapseButton)

      await waitFor(() => {
        expect(screen.getByTestId('chevron-right-icon')).toBeInTheDocument()
      })
    })

    it('should expand thread when clicked again', async () => {
      const user = userEvent.setup()
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const collapseButton = screen.getByTitle('Collapse thread')
      await user.click(collapseButton)

      await waitFor(() => {
        expect(screen.getByTitle('Expand thread')).toBeInTheDocument()
      })

      const expandButton = screen.getByTitle('Expand thread')
      await user.click(expandButton)

      expect(screen.getByText('This is a reply')).toBeInTheDocument()
    })

    it('should show reply count when collapsed', async () => {
      const user = userEvent.setup()
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const collapseButton = screen.getByTitle('Collapse thread')
      await user.click(collapseButton)

      await waitFor(() => {
        expect(screen.getByText(/1 replies/)).toBeInTheDocument()
      })
    })

    it('should show score when collapsed', async () => {
      const user = userEvent.setup()
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const collapseButton = screen.getByTitle('Collapse thread')
      await user.click(collapseButton)

      await waitFor(() => {
        expect(screen.getByText(/8 points/)).toBeInTheDocument()
      })
    })
  })

  describe('Reply to Comment Functionality', () => {
    it('should show reply form when reply button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const replyButtons = screen.getAllByRole('button', { name: /reply/i })
      await user.click(replyButtons[0])

      expect(screen.getByPlaceholderText(/Reply to/)).toBeInTheDocument()
    })

    it('should focus reply textarea when reply form is shown', async () => {
      const user = userEvent.setup()
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const replyButtons = screen.getAllByRole('button', { name: /reply/i })
      await user.click(replyButtons[0])

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Reply to/)).toHaveFocus()
      })
    })

    it('should hide reply form when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const replyButtons = screen.getAllByRole('button', { name: /reply/i })
      await user.click(replyButtons[0])

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(screen.queryByPlaceholderText(/Reply to/)).not.toBeInTheDocument()
    })

    it('should update reply textarea value when typing', async () => {
      const user = userEvent.setup()
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const replyButtons = screen.getAllByRole('button', { name: /reply/i })
      await user.click(replyButtons[0])

      const replyTextarea = screen.getByPlaceholderText(/Reply to/)
      await user.type(replyTextarea, 'This is my reply')

      expect(replyTextarea).toHaveValue('This is my reply')
    })

    it('should disable reply submit button when textarea is empty', async () => {
      const user = userEvent.setup()
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const replyButtons = screen.getAllByRole('button', { name: /reply/i })
      await user.click(replyButtons[0])

      const submitButton = screen.getAllByRole('button', { name: /reply/i }).find(btn =>
        btn.getAttribute('type') === 'submit'
      )
      expect(submitButton).toBeDisabled()
    })

    it('should enable reply submit button when textarea has content', async () => {
      const user = userEvent.setup()
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const replyButtons = screen.getAllByRole('button', { name: /reply/i })
      await user.click(replyButtons[0])

      const replyTextarea = screen.getByPlaceholderText(/Reply to/)
      await user.type(replyTextarea, 'This is my reply')

      const submitButton = screen.getAllByRole('button', { name: /reply/i }).find(btn =>
        btn.getAttribute('type') === 'submit'
      )
      expect(submitButton).not.toBeDisabled()
    })

    it('should call onReply with comment id and reply text when submitted', async () => {
      const user = userEvent.setup()
      mockHandlers.onReply.mockResolvedValue({})
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const replyButtons = screen.getAllByRole('button', { name: /reply/i })
      await user.click(replyButtons[0])

      const replyTextarea = screen.getByPlaceholderText(/Reply to/)
      await user.type(replyTextarea, 'This is my reply')

      const submitButton = screen.getAllByRole('button', { name: /reply/i }).find(btn =>
        btn.getAttribute('type') === 'submit'
      )
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockHandlers.onReply).toHaveBeenCalledWith('comment-1', 'This is my reply')
      })
    })

    it('should clear reply textarea after submission', async () => {
      const user = userEvent.setup()
      mockHandlers.onReply.mockResolvedValue({})
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const replyButtons = screen.getAllByRole('button', { name: /reply/i })
      await user.click(replyButtons[0])

      const replyTextarea = screen.getByPlaceholderText(/Reply to/)
      await user.type(replyTextarea, 'This is my reply')

      const submitButton = screen.getAllByRole('button', { name: /reply/i }).find(btn =>
        btn.getAttribute('type') === 'submit'
      )
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/Reply to/)).not.toBeInTheDocument()
      })
    })

    it('should trim whitespace from reply before submitting', async () => {
      const user = userEvent.setup()
      mockHandlers.onReply.mockResolvedValue({})
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const replyButtons = screen.getAllByRole('button', { name: /reply/i })
      await user.click(replyButtons[0])

      const replyTextarea = screen.getByPlaceholderText(/Reply to/)
      await user.type(replyTextarea, '  This is my reply  ')

      const submitButton = screen.getAllByRole('button', { name: /reply/i }).find(btn =>
        btn.getAttribute('type') === 'submit'
      )
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockHandlers.onReply).toHaveBeenCalledWith('comment-1', 'This is my reply')
      })
    })

    it('should handle reply error gracefully', async () => {
      const user = userEvent.setup()
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      mockHandlers.onReply.mockRejectedValue(new Error('Failed to reply'))

      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const replyButtons = screen.getAllByRole('button', { name: /reply/i })
      await user.click(replyButtons[0])

      const replyTextarea = screen.getByPlaceholderText(/Reply to/)
      await user.type(replyTextarea, 'This is my reply')

      const submitButton = screen.getAllByRole('button', { name: /reply/i }).find(btn =>
        btn.getAttribute('type') === 'submit'
      )
      await user.click(submitButton)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to reply:', expect.any(Error))
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Edit Comment Functionality', () => {
    it('should show edit button for user own comments', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      expect(editButtons.length).toBeGreaterThan(0)
    })

    it('should not show edit button for other users comments', () => {
      const otherUserComments = [mockComments[1]]
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={otherUserComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
    })

    it('should show edit form when edit button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])

      const editTextarea = screen.getByDisplayValue('This is the first comment')
      expect(editTextarea).toBeInTheDocument()
    })

    it('should populate edit textarea with current comment content', async () => {
      const user = userEvent.setup()
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])

      const editTextarea = screen.getByDisplayValue('This is the first comment')
      expect(editTextarea).toHaveValue('This is the first comment')
    })

    it('should update edit textarea value when typing', async () => {
      const user = userEvent.setup()
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])

      const editTextarea = screen.getByDisplayValue('This is the first comment')
      await user.clear(editTextarea)
      await user.type(editTextarea, 'Updated comment text')

      expect(editTextarea).toHaveValue('Updated comment text')
    })

    it('should call onEdit when save button is clicked', async () => {
      const user = userEvent.setup()
      mockHandlers.onEdit.mockResolvedValue({})
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])

      const editTextarea = screen.getByDisplayValue('This is the first comment')
      await user.clear(editTextarea)
      await user.type(editTextarea, 'Updated comment')

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockHandlers.onEdit).toHaveBeenCalledWith('comment-1', 'Updated comment')
      })
    })

    it('should not call onEdit when content is unchanged', async () => {
      const user = userEvent.setup()
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      expect(mockHandlers.onEdit).not.toHaveBeenCalled()
    })

    it('should exit edit mode when save button is clicked', async () => {
      const user = userEvent.setup()
      mockHandlers.onEdit.mockResolvedValue({})
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])

      const editTextarea = screen.getByDisplayValue('This is the first comment')
      await user.clear(editTextarea)
      await user.type(editTextarea, 'Updated comment')

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.queryByDisplayValue('Updated comment')).not.toBeInTheDocument()
      })
    })

    it('should cancel edit when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])

      const editTextarea = screen.getByDisplayValue('This is the first comment')
      await user.clear(editTextarea)
      await user.type(editTextarea, 'Updated comment')

      const cancelButton = screen.getAllByRole('button', { name: /cancel/i })[0]
      await user.click(cancelButton)

      expect(screen.queryByDisplayValue('Updated comment')).not.toBeInTheDocument()
    })

    it('should restore original content when cancel is clicked', async () => {
      const user = userEvent.setup()
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])

      const editTextarea = screen.getByDisplayValue('This is the first comment')
      await user.clear(editTextarea)
      await user.type(editTextarea, 'Updated comment')

      const cancelButton = screen.getAllByRole('button', { name: /cancel/i })[0]
      await user.click(cancelButton)

      expect(screen.getByText('This is the first comment')).toBeInTheDocument()
    })

    it('should trim whitespace from edited comment before saving', async () => {
      const user = userEvent.setup()
      mockHandlers.onEdit.mockResolvedValue({})
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])

      const editTextarea = screen.getByDisplayValue('This is the first comment')
      await user.clear(editTextarea)
      await user.type(editTextarea, '  Updated comment  ')

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockHandlers.onEdit).toHaveBeenCalledWith('comment-1', 'Updated comment')
      })
    })

    it('should handle edit error gracefully', async () => {
      const user = userEvent.setup()
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      mockHandlers.onEdit.mockRejectedValue(new Error('Failed to edit'))

      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])

      const editTextarea = screen.getByDisplayValue('This is the first comment')
      await user.clear(editTextarea)
      await user.type(editTextarea, 'Updated comment')

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to edit comment:', expect.any(Error))
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Delete Comment Functionality', () => {
    it('should show delete button for user own comments', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      expect(deleteButtons.length).toBeGreaterThan(0)
    })

    it('should not show delete button for other users comments', () => {
      const otherUserComments = [mockComments[1]]
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={otherUserComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
    })

    it('should call onDelete when delete button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      await user.click(deleteButtons[0])

      expect(mockHandlers.onDelete).toHaveBeenCalledWith('comment-1')
    })
  })

  describe('Comment Voting/Reactions', () => {
    it('should display vote score', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('15')).toBeInTheDocument()
      expect(screen.getByText('8')).toBeInTheDocument()
    })

    it('should call onVote when upvote button is clicked', async () => {
      const user = userEvent.setup()
      mockHandlers.onVote.mockResolvedValue({})
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const upvoteButtons = screen.getAllByTestId('arrow-up-icon')
      await user.click(upvoteButtons[0].closest('button'))

      await waitFor(() => {
        expect(mockHandlers.onVote).toHaveBeenCalledWith('comment-1', 'up')
      })
    })

    it('should call onVote when downvote button is clicked', async () => {
      const user = userEvent.setup()
      mockHandlers.onVote.mockResolvedValue({})
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const downvoteButtons = screen.getAllByTestId('arrow-down-icon')
      await user.click(downvoteButtons[0].closest('button'))

      await waitFor(() => {
        expect(mockHandlers.onVote).toHaveBeenCalledWith('comment-1', 'down')
      })
    })

    it('should update score optimistically on upvote', async () => {
      const user = userEvent.setup()
      mockHandlers.onVote.mockResolvedValue({})
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const upvoteButtons = screen.getAllByTestId('arrow-up-icon')
      await user.click(upvoteButtons[0].closest('button'))

      await waitFor(() => {
        expect(screen.getByText('16')).toBeInTheDocument()
      })
    })

    it('should update score optimistically on downvote', async () => {
      const user = userEvent.setup()
      mockHandlers.onVote.mockResolvedValue({})
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const downvoteButtons = screen.getAllByTestId('arrow-down-icon')
      await user.click(downvoteButtons[0].closest('button'))

      await waitFor(() => {
        expect(screen.getByText('14')).toBeInTheDocument()
      })
    })

    it('should revert score on vote error', async () => {
      const user = userEvent.setup()
      mockHandlers.onVote.mockRejectedValue(new Error('Vote failed'))
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const upvoteButtons = screen.getAllByTestId('arrow-up-icon')
      await user.click(upvoteButtons[0].closest('button'))

      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument()
      })
    })

    it('should apply correct color for positive score', () => {
      const { container } = render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const scoreElements = container.querySelectorAll('.text-green-500')
      expect(scoreElements.length).toBeGreaterThan(0)
    })

    it('should apply correct color for negative score', () => {
      const negativeScoreComment = [{
        ...mockComments[0],
        score: -5
      }]
      const { container } = render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={negativeScoreComment}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const scoreElements = container.querySelectorAll('.text-red-500')
      expect(scoreElements.length).toBeGreaterThan(0)
    })

    it('should toggle vote when same button clicked twice', async () => {
      const user = userEvent.setup()
      mockHandlers.onVote.mockResolvedValue({})
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const upvoteButtons = screen.getAllByTestId('arrow-up-icon')
      const upvoteButton = upvoteButtons[0].closest('button')

      await user.click(upvoteButton)
      await user.click(upvoteButton)

      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument()
      })
    })
  })

  describe('Comment Sorting', () => {
    it('should default to best sort', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const sortSelect = screen.getByDisplayValue('Best')
      expect(sortSelect).toBeInTheDocument()
    })

    it('should have all sort options available', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByRole('option', { name: 'Best' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Top' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'New' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Old' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Controversial' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Q&A' })).toBeInTheDocument()
    })

    it('should change sort order when option is selected', async () => {
      const user = userEvent.setup()
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const sortSelect = screen.getAllByRole('combobox')[0]
      await user.selectOptions(sortSelect, 'new')

      expect(sortSelect).toHaveValue('new')
    })

    it('should sort comments by newest first', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const sortSelect = screen.getAllByRole('combobox')[0]
      await user.selectOptions(sortSelect, 'new')

      const commentTexts = Array.from(container.querySelectorAll('.prose p'))
        .map(p => p.textContent)
      expect(commentTexts[0]).toBe('This is the second comment')
    })

    it('should sort comments by oldest first', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const sortSelect = screen.getAllByRole('combobox')[0]
      await user.selectOptions(sortSelect, 'old')

      const commentTexts = Array.from(container.querySelectorAll('.prose p'))
        .map(p => p.textContent)
      expect(commentTexts[0]).toBe('This is the first comment')
    })

    it('should sort comments by score for top sort', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const sortSelect = screen.getAllByRole('combobox')[0]
      await user.selectOptions(sortSelect, 'top')

      const commentTexts = Array.from(container.querySelectorAll('.prose p'))
        .map(p => p.textContent)
      expect(commentTexts[0]).toBe('This is the first comment')
    })

    it('should sort by Q&A mode with OP comments first', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const sortSelect = screen.getAllByRole('combobox')[0]
      await user.selectOptions(sortSelect, 'qa')

      const commentTexts = Array.from(container.querySelectorAll('.prose p'))
        .map(p => p.textContent)
      expect(commentTexts[0]).toBe('This is the second comment')
    })
  })

  describe('Comment Filtering', () => {
    it('should default to all filter', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const filterSelect = screen.getAllByRole('combobox')[1]
      expect(filterSelect).toHaveValue('all')
    })

    it('should have all filter options available', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByRole('option', { name: 'All comments' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Top comments' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Controversial' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Recent' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'By author' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Awarded' })).toBeInTheDocument()
    })

    it('should filter to show only top comments', async () => {
      const user = userEvent.setup()
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const filterSelect = screen.getAllByRole('combobox')[1]
      await user.selectOptions(filterSelect, 'top')

      expect(screen.getByText('This is the first comment')).toBeInTheDocument()
      expect(screen.queryByText('This is the second comment')).not.toBeInTheDocument()
    })

    it('should filter to show only author comments', async () => {
      const user = userEvent.setup()
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const filterSelect = screen.getAllByRole('combobox')[1]
      await user.selectOptions(filterSelect, 'author')

      expect(screen.getByText('This is the first comment')).toBeInTheDocument()
      expect(screen.queryByText('This is the second comment')).not.toBeInTheDocument()
    })

    it('should filter to show only awarded comments', async () => {
      const user = userEvent.setup()
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const filterSelect = screen.getAllByRole('combobox')[1]
      await user.selectOptions(filterSelect, 'awarded')

      expect(screen.queryByText('This is the first comment')).not.toBeInTheDocument()
      expect(screen.getByText('This is the second comment')).toBeInTheDocument()
    })
  })

  describe('Comment Search', () => {
    it('should render search input', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByPlaceholderText('Search comments...')).toBeInTheDocument()
    })

    it('should filter comments by content search', async () => {
      const user = userEvent.setup()
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const searchInput = screen.getByPlaceholderText('Search comments...')
      await user.type(searchInput, 'first')

      expect(screen.getByText('This is the first comment')).toBeInTheDocument()
      expect(screen.queryByText('This is the second comment')).not.toBeInTheDocument()
    })

    it('should filter comments by author username search', async () => {
      const user = userEvent.setup()
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const searchInput = screen.getByPlaceholderText('Search comments...')
      await user.type(searchInput, 'AnotherUser')

      expect(screen.queryByText('This is the first comment')).not.toBeInTheDocument()
      expect(screen.getByText('This is the second comment')).toBeInTheDocument()
    })

    it('should be case-insensitive search', async () => {
      const user = userEvent.setup()
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const searchInput = screen.getByPlaceholderText('Search comments...')
      await user.type(searchInput, 'FIRST')

      expect(screen.getByText('This is the first comment')).toBeInTheDocument()
    })

    it('should show all comments when search is cleared', async () => {
      const user = userEvent.setup()
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const searchInput = screen.getByPlaceholderText('Search comments...')
      await user.type(searchInput, 'first')
      await user.clear(searchInput)

      expect(screen.getByText('This is the first comment')).toBeInTheDocument()
      expect(screen.getByText('This is the second comment')).toBeInTheDocument()
    })
  })

  describe('Awards Display', () => {
    it('should display awards on comments', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('🏆')).toBeInTheDocument()
    })

    it('should display award count when greater than 1', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('should call onAward when award button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const awardButtons = screen.getAllByRole('button', { name: /award/i })
      await user.click(awardButtons[0])

      expect(mockHandlers.onAward).toHaveBeenCalledWith('comment-1')
    })
  })

  describe('Deleted and Removed Comments', () => {
    it('should show deleted comment placeholder', () => {
      const deletedComment = [{
        ...mockComments[0],
        deleted: true
      }]
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={deletedComment}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('[deleted]')).toBeInTheDocument()
    })

    it('should show removed comment placeholder', () => {
      const removedComment = [{
        ...mockComments[0],
        removed: true
      }]
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={removedComment}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('[removed]')).toBeInTheDocument()
    })

    it('should show deleted comments when showDeleted is enabled', async () => {
      const user = userEvent.setup()
      const deletedComment = [{
        ...mockComments[0],
        deleted: true
      }]
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={deletedComment}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const showDeletedButton = screen.getByRole('button', { name: /show deleted/i })
      await user.click(showDeletedButton)

      expect(screen.getByText(/hide deleted/i)).toBeInTheDocument()
    })

    it('should show reply count for deleted comments with replies', () => {
      const deletedCommentWithReplies = [{
        ...mockComments[1],
        deleted: true
      }]
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={deletedCommentWithReplies}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText(/1 replies/)).toBeInTheDocument()
    })

    it('should allow showing/hiding replies on deleted comments', async () => {
      const user = userEvent.setup()
      const deletedCommentWithReplies = [{
        ...mockComments[1],
        deleted: true
      }]
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={deletedCommentWithReplies}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const showButton = screen.getByRole('button', { name: /show 1 replies/i })
      await user.click(showButton)

      expect(screen.getByText('This is a reply')).toBeInTheDocument()
    })
  })

  describe('Hidden Comments', () => {
    it('should hide comment when hide button is clicked', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const commentCards = container.querySelectorAll('.comment-card')
      fireEvent.mouseEnter(commentCards[0])

      await waitFor(() => {
        const hideButton = screen.getByTitle('Hide comment')
        user.click(hideButton)
      })

      await waitFor(() => {
        expect(screen.getByText('[+] Show hidden comment')).toBeInTheDocument()
      })
    })

    it('should show hidden comment when show button is clicked', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const commentCards = container.querySelectorAll('.comment-card')
      fireEvent.mouseEnter(commentCards[0])

      await waitFor(async () => {
        const hideButton = screen.getByTitle('Hide comment')
        await user.click(hideButton)
      })

      await waitFor(async () => {
        const showButton = screen.getByText('[+] Show hidden comment')
        await user.click(showButton)
      })

      await waitFor(() => {
        expect(screen.getByText('This is the first comment')).toBeInTheDocument()
      })
    })
  })

  describe('Auto-collapse Feature', () => {
    it('should show auto-collapse toggle button', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByRole('button', { name: /auto-collapse/i })).toBeInTheDocument()
    })

    it('should toggle auto-collapse setting', async () => {
      const user = userEvent.setup()
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const autoCollapseButton = screen.getByRole('button', { name: /auto-collapse/i })
      const initialClasses = autoCollapseButton.className

      await user.click(autoCollapseButton)

      expect(autoCollapseButton.className).not.toBe(initialClasses)
    })
  })

  describe('Max Depth and Continue Thread', () => {
    it('should show continue thread link at max depth', () => {
      const deeplyNestedComments = [{
        ...mockComments[0],
        replies: Array(8).fill(null).map((_, i) => ({
          id: `deep-${i}`,
          content: `Level ${i}`,
          author: { id: `user-${i}`, username: `User${i}` },
          timestamp: new Date().toISOString(),
          score: 1,
          replies: i < 7 ? [{}] : []
        }))
      }]

      // Manually build deep nesting
      for (let i = 0; i < 7; i++) {
        if (i < 6) {
          deeplyNestedComments[0].replies[i].replies = [deeplyNestedComments[0].replies[i + 1]]
        }
      }

      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={deeplyNestedComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText(/Continue this thread/)).toBeInTheDocument()
    })
  })

  describe('View Mode', () => {
    it('should have view mode selector', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const viewModeSelect = screen.getAllByRole('combobox')[2]
      expect(viewModeSelect).toBeInTheDocument()
    })

    it('should have all view mode options', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByRole('option', { name: 'Threaded' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Flat' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Single thread' })).toBeInTheDocument()
    })

    it('should default to threaded view mode', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const viewModeSelect = screen.getAllByRole('combobox')[2]
      expect(viewModeSelect).toHaveValue('threaded')
    })
  })

  describe('Timestamp Display', () => {
    it('should display "now" for very recent comments', () => {
      const recentComment = [{
        ...mockComments[0],
        timestamp: new Date().toISOString()
      }]

      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={recentComment}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('now')).toBeInTheDocument()
    })

    it('should display minutes for comments less than an hour old', () => {
      const minutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
      const recentComment = [{
        ...mockComments[0],
        timestamp: minutesAgo
      }]

      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={recentComment}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText(/\d+m/)).toBeInTheDocument()
    })

    it('should display hours for comments less than a day old', () => {
      const hoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      const recentComment = [{
        ...mockComments[0],
        timestamp: hoursAgo
      }]

      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={recentComment}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText(/\d+h/)).toBeInTheDocument()
    })

    it('should display days for comments less than a week old', () => {
      const daysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      const recentComment = [{
        ...mockComments[0],
        timestamp: daysAgo
      }]

      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={recentComment}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText(/\d+d/)).toBeInTheDocument()
    })
  })

  describe('Share and Report Buttons', () => {
    it('should render share button', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const shareButtons = screen.getAllByRole('button', { name: /share/i })
      expect(shareButtons.length).toBeGreaterThan(0)
    })

    it('should render report button', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const reportButtons = screen.getAllByRole('button', { name: /report/i })
      expect(reportButtons.length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    it('should have proper title attributes for buttons', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByTitle('Collapse thread')).toBeInTheDocument()
    })

    it('should allow keyboard navigation on buttons', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={[]}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const submitButton = screen.getByRole('button', { name: /comment/i })
      expect(submitButton).toBeInTheDocument()
      submitButton.focus()
      expect(submitButton).toHaveFocus()
    })

    it('should have proper alt text for images', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const avatarImages = screen.getAllByAltText('TestUser')
      expect(avatarImages.length).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty comments array', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={[]}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('No comments yet')).toBeInTheDocument()
    })

    it('should handle undefined comments prop', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('No comments yet')).toBeInTheDocument()
    })

    it('should handle missing currentUser prop', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={null}
          {...mockHandlers}
        />
      )

      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
    })

    it('should handle comment without score', () => {
      const commentNoScore = [{
        ...mockComments[0],
        score: undefined
      }]

      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={commentNoScore}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('should handle deeply nested comment threads', () => {
      const deepComment = {
        ...mockComments[0],
        replies: [{
          id: 'l1',
          content: 'Level 1',
          author: { id: 'u1', username: 'U1' },
          timestamp: new Date().toISOString(),
          score: 1,
          replies: [{
            id: 'l2',
            content: 'Level 2',
            author: { id: 'u2', username: 'U2' },
            timestamp: new Date().toISOString(),
            score: 1,
            replies: [{
              id: 'l3',
              content: 'Level 3',
              author: { id: 'u3', username: 'U3' },
              timestamp: new Date().toISOString(),
              score: 1,
              replies: []
            }]
          }]
        }]
      }

      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={[deepComment]}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('Level 1')).toBeInTheDocument()
      expect(screen.getByText('Level 2')).toBeInTheDocument()
      expect(screen.getByText('Level 3')).toBeInTheDocument()
    })

    it('should handle comment with empty replies array', () => {
      const commentEmptyReplies = [{
        ...mockComments[0],
        replies: []
      }]

      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={commentEmptyReplies}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.queryByTestId('chevron-down-icon')).not.toBeInTheDocument()
    })

    it('should handle comment without replies property', () => {
      const commentNoReplies = {
        ...mockComments[0]
      }
      delete commentNoReplies.replies

      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={[commentNoReplies]}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.queryByTestId('chevron-down-icon')).not.toBeInTheDocument()
    })

    it('should handle zero totalCount', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={[]}
          currentUser={mockCurrentUser}
          totalCount={0}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('Comments')).toBeInTheDocument()
    })

    it('should handle large comment counts', () => {
      render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={[]}
          currentUser={mockCurrentUser}
          totalCount={1234567}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('1,234,567 Comments')).toBeInTheDocument()
    })
  })

  describe('Comment Action Visibility', () => {
    it('should show action buttons on mouse enter', async () => {
      const { container } = render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const commentCard = container.querySelector('.comment-card')
      fireEvent.mouseEnter(commentCard)

      await waitFor(() => {
        expect(screen.getByTestId('eye-off-icon')).toBeInTheDocument()
      })
    })

    it('should hide action buttons on mouse leave', async () => {
      const { container } = render(
        <AdvancedThreadedComments
          postId="post-1"
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const commentCard = container.querySelector('.comment-card')
      fireEvent.mouseEnter(commentCard)
      fireEvent.mouseLeave(commentCard)

      await waitFor(() => {
        expect(screen.queryByTestId('eye-off-icon')).not.toBeInTheDocument()
      })
    })
  })
})

export default mockSocket
