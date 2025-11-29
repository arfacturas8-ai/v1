import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import ThreadedComments, { Comment } from './ThreadedComments'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  MessageSquare: ({ size }) => <span data-testid="message-square-icon" data-size={size} />,
  ChevronDown: ({ size }) => <span data-testid="chevron-down-icon" data-size={size} />,
  ChevronRight: ({ size }) => <span data-testid="chevron-right-icon" data-size={size} />,
  MoreVertical: ({ size }) => <span data-testid="more-vertical-icon" data-size={size} />,
  Reply: ({ size }) => <span data-testid="reply-icon" data-size={size} />,
  Heart: ({ size }) => <span data-testid="heart-icon" data-size={size} />,
  Flag: ({ size }) => <span data-testid="flag-icon" data-size={size} />,
  Edit: ({ size }) => <span data-testid="edit-icon" data-size={size} />,
  Trash: ({ size }) => <span data-testid="trash-icon" data-size={size} />,
  User: ({ size }) => <span data-testid="user-icon" data-size={size} />,
  Clock: ({ size }) => <span data-testid="clock-icon" data-size={size} />,
}))

describe('ThreadedComments', () => {
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
        reputation: 100
      },
      timestamp: new Date('2025-01-01T10:00:00').toISOString(),
      likes: 5,
      userReacted: false,
      edited: false,
      replies: []
    },
    {
      id: 'comment-2',
      content: 'This is the second comment',
      author: {
        id: 'user-2',
        username: 'AnotherUser',
        reputation: 50
      },
      timestamp: new Date('2025-01-01T11:00:00').toISOString(),
      likes: 3,
      userReacted: true,
      edited: true,
      replies: [
        {
          id: 'comment-3',
          content: 'This is a reply',
          author: {
            id: 'user-3',
            username: 'ReplyUser'
          },
          timestamp: new Date('2025-01-01T12:00:00').toISOString(),
          likes: 1,
          userReacted: false,
          edited: false,
          replies: []
        }
      ]
    }
  ]

  const mockHandlers = {
    onAddComment: jest.fn(),
    onReply: jest.fn(),
    onReact: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render the component without crashing', () => {
      render(
        <ThreadedComments
          comments={[]}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      expect(screen.getByPlaceholderText('Add a comment...')).toBeInTheDocument()
    })

    it('should render with custom placeholder text', () => {
      render(
        <ThreadedComments
          comments={[]}
          currentUser={mockCurrentUser}
          placeholder="Write your thoughts..."
          {...mockHandlers}
        />
      )
      expect(screen.getByPlaceholderText('Write your thoughts...')).toBeInTheDocument()
    })

    it('should display current user information in comment form', () => {
      render(
        <ThreadedComments
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
        <ThreadedComments
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
        <ThreadedComments
          comments={[]}
          currentUser={userWithoutAvatar}
          {...mockHandlers}
        />
      )
      expect(screen.getAllByTestId('user-icon')[0]).toBeInTheDocument()
    })

    it('should render comment form with submit button', () => {
      render(
        <ThreadedComments
          comments={[]}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      expect(screen.getByRole('button', { name: /comment/i })).toBeInTheDocument()
    })

    it('should render empty state when no comments exist', () => {
      render(
        <ThreadedComments
          comments={[]}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      expect(screen.getByText('No comments yet')).toBeInTheDocument()
      expect(screen.getByText('Be the first to share your thoughts!')).toBeInTheDocument()
    })

    it('should render comments list when comments are provided', () => {
      render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      expect(screen.getByText('This is the first comment')).toBeInTheDocument()
      expect(screen.getByText('This is the second comment')).toBeInTheDocument()
    })

    it('should render comments count correctly', () => {
      render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      expect(screen.getByText('2 comments')).toBeInTheDocument()
    })

    it('should render singular comment text when only one comment', () => {
      render(
        <ThreadedComments
          comments={[mockComments[0]]}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      expect(screen.getByText('1 comment')).toBeInTheDocument()
    })

    it('should render sort dropdown when comments exist', () => {
      render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('should not render comments header when no comments exist', () => {
      render(
        <ThreadedComments
          comments={[]}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      expect(screen.queryByText(/comments/i)).not.toBeInTheDocument()
    })
  })

  describe('Add Comment Functionality', () => {
    it('should update textarea value when typing', async () => {
      const user = userEvent.setup()
      render(
        <ThreadedComments
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
        <ThreadedComments
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
        <ThreadedComments
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
        <ThreadedComments
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
        <ThreadedComments
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
        <ThreadedComments
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
        <ThreadedComments
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

    it('should submit form on Enter key press', async () => {
      render(
        <ThreadedComments
          comments={[]}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      const textarea = screen.getByPlaceholderText('Add a comment...')
      fireEvent.change(textarea, { target: { value: 'New comment' } })
      fireEvent.submit(textarea.closest('form'))

      expect(mockHandlers.onAddComment).toHaveBeenCalledWith('New comment')
    })
  })

  describe('Comment Rendering', () => {
    it('should render comment content', () => {
      render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      expect(screen.getByText('This is the first comment')).toBeInTheDocument()
    })

    it('should render comment author information', () => {
      render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      expect(screen.getByText('TestUser')).toBeInTheDocument()
      expect(screen.getByText('AnotherUser')).toBeInTheDocument()
    })

    it('should render author avatar when provided', () => {
      render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      const avatars = screen.getAllByAltText('TestUser')
      expect(avatars[0]).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    })

    it('should render user icon when author has no avatar', () => {
      render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      expect(screen.getAllByTestId('user-icon').length).toBeGreaterThan(0)
    })

    it('should render author reputation when provided', () => {
      render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      expect(screen.getByText('100')).toBeInTheDocument()
      expect(screen.getByText('50')).toBeInTheDocument()
    })

    it('should render timestamp for comment', () => {
      render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      expect(screen.getAllByTestId('clock-icon').length).toBeGreaterThan(0)
    })

    it('should render edited indicator for edited comments', () => {
      render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      expect(screen.getByText('(edited)')).toBeInTheDocument()
    })

    it('should not render edited indicator for non-edited comments', () => {
      const nonEditedComments = [mockComments[0]]
      render(
        <ThreadedComments
          comments={nonEditedComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      expect(screen.queryByText('(edited)')).not.toBeInTheDocument()
    })

    it('should render like count for comment', () => {
      render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should render reply button for each comment', () => {
      render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      const replyButtons = screen.getAllByRole('button', { name: /reply/i })
      expect(replyButtons.length).toBeGreaterThan(0)
    })

    it('should render report button for each comment', () => {
      render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      const reportButtons = screen.getAllByRole('button', { name: /report/i })
      expect(reportButtons.length).toBeGreaterThan(0)
    })
  })

  describe('Nested Replies', () => {
    it('should render nested replies', () => {
      render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      expect(screen.getByText('This is a reply')).toBeInTheDocument()
    })

    it('should apply correct depth class to nested comments', () => {
      const { container } = render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      expect(container.querySelector('.depth-0')).toBeInTheDocument()
      expect(container.querySelector('.depth-1')).toBeInTheDocument()
    })

    it('should render collapse button when comment has replies', () => {
      render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      const collapseButtons = screen.getAllByTestId('chevron-down-icon')
      expect(collapseButtons.length).toBeGreaterThan(0)
    })

    it('should not render collapse button when comment has no replies', () => {
      const commentWithoutReplies = [mockComments[0]]
      render(
        <ThreadedComments
          comments={commentWithoutReplies}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )
      expect(screen.queryByTestId('chevron-down-icon')).not.toBeInTheDocument()
    })
  })

  describe('Collapse/Expand Threads', () => {
    it('should collapse thread when collapse button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const collapseButton = screen.getAllByRole('button', { name: '' })[0]
      await user.click(collapseButton)

      await waitFor(() => {
        expect(screen.queryByText('This is a reply')).not.toBeInTheDocument()
      })
    })

    it('should show chevron right icon when thread is collapsed', async () => {
      const user = userEvent.setup()
      render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const collapseButton = screen.getAllByRole('button', { name: '' })[0]
      await user.click(collapseButton)

      await waitFor(() => {
        expect(screen.getByTestId('chevron-right-icon')).toBeInTheDocument()
      })
    })

    it('should expand thread when clicked again', async () => {
      const user = userEvent.setup()
      render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const collapseButton = screen.getAllByRole('button', { name: '' })[0]
      await user.click(collapseButton)
      await user.click(collapseButton)

      expect(screen.getByText('This is a reply')).toBeInTheDocument()
    })

    it('should hide comment content when collapsed', async () => {
      const user = userEvent.setup()
      render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const collapseButton = screen.getAllByRole('button', { name: '' })[0]
      await user.click(collapseButton)

      await waitFor(() => {
        expect(screen.queryByText('This is the second comment')).not.toBeInTheDocument()
      })
    })
  })

  describe('Reply to Comment', () => {
    it('should show reply form when reply button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const replyButtons = screen.getAllByRole('button', { name: /reply/i })
      await user.click(replyButtons[0])

      expect(screen.getByPlaceholderText('Write a reply...')).toBeInTheDocument()
    })

    it('should focus reply textarea when reply form is shown', async () => {
      const user = userEvent.setup()
      render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const replyButtons = screen.getAllByRole('button', { name: /reply/i })
      await user.click(replyButtons[0])

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Write a reply...')).toHaveFocus()
      })
    })

    it('should hide reply form when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const replyButtons = screen.getAllByRole('button', { name: /reply/i })
      await user.click(replyButtons[0])

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(screen.queryByPlaceholderText('Write a reply...')).not.toBeInTheDocument()
    })

    it('should update reply textarea value when typing', async () => {
      const user = userEvent.setup()
      render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const replyButtons = screen.getAllByRole('button', { name: /reply/i })
      await user.click(replyButtons[0])

      const replyTextarea = screen.getByPlaceholderText('Write a reply...')
      await user.type(replyTextarea, 'This is my reply')

      expect(replyTextarea).toHaveValue('This is my reply')
    })

    it('should disable reply submit button when textarea is empty', async () => {
      const user = userEvent.setup()
      render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const replyButtons = screen.getAllByRole('button', { name: /reply/i })
      await user.click(replyButtons[0])

      const submitButton = screen.getAllByRole('button', { name: /reply/i })[0]
      expect(submitButton).toBeDisabled()
    })

    it('should enable reply submit button when textarea has content', async () => {
      const user = userEvent.setup()
      render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const replyButtons = screen.getAllByRole('button', { name: /reply/i })
      await user.click(replyButtons[0])

      const replyTextarea = screen.getByPlaceholderText('Write a reply...')
      await user.type(replyTextarea, 'This is my reply')

      const submitButton = screen.getAllByRole('button', { name: /reply/i })[0]
      expect(submitButton).not.toBeDisabled()
    })

    it('should call onReply with comment id and reply text when submitted', async () => {
      const user = userEvent.setup()
      render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const replyButtons = screen.getAllByRole('button', { name: /reply/i })
      await user.click(replyButtons[0])

      const replyTextarea = screen.getByPlaceholderText('Write a reply...')
      await user.type(replyTextarea, 'This is my reply')

      const submitButton = screen.getAllByRole('button', { name: /reply/i })[0]
      await user.click(submitButton)

      expect(mockHandlers.onReply).toHaveBeenCalledWith('comment-1', 'This is my reply')
    })

    it('should clear reply textarea after submission', async () => {
      const user = userEvent.setup()
      render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const replyButtons = screen.getAllByRole('button', { name: /reply/i })
      await user.click(replyButtons[0])

      const replyTextarea = screen.getByPlaceholderText('Write a reply...')
      await user.type(replyTextarea, 'This is my reply')

      const submitButton = screen.getAllByRole('button', { name: /reply/i })[0]
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Write a reply...')).not.toBeInTheDocument()
      })
    })

    it('should trim whitespace from reply before submitting', async () => {
      const user = userEvent.setup()
      render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const replyButtons = screen.getAllByRole('button', { name: /reply/i })
      await user.click(replyButtons[0])

      const replyTextarea = screen.getByPlaceholderText('Write a reply...')
      await user.type(replyTextarea, '  This is my reply  ')

      const submitButton = screen.getAllByRole('button', { name: /reply/i })[0]
      await user.click(submitButton)

      expect(mockHandlers.onReply).toHaveBeenCalledWith('comment-1', 'This is my reply')
    })

    it('should toggle reply form visibility when reply button is clicked multiple times', async () => {
      const user = userEvent.setup()
      render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const replyButtons = screen.getAllByRole('button', { name: /reply/i })
      await user.click(replyButtons[0])
      expect(screen.getByPlaceholderText('Write a reply...')).toBeInTheDocument()

      await user.click(replyButtons[0])
      expect(screen.queryByPlaceholderText('Write a reply...')).not.toBeInTheDocument()
    })
  })

  describe('Edit Comment', () => {
    it('should show edit button for user own comments', () => {
      render(
        <ThreadedComments
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
        <ThreadedComments
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
        <ThreadedComments
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
        <ThreadedComments
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
        <ThreadedComments
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
      render(
        <ThreadedComments
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

      expect(mockHandlers.onEdit).toHaveBeenCalledWith('comment-1', 'Updated comment')
    })

    it('should not call onEdit when content is unchanged', async () => {
      const user = userEvent.setup()
      render(
        <ThreadedComments
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
      render(
        <ThreadedComments
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
        <ThreadedComments
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
        <ThreadedComments
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
      render(
        <ThreadedComments
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

      expect(mockHandlers.onEdit).toHaveBeenCalledWith('comment-1', 'Updated comment')
    })

    it('should hide comment content when in edit mode', async () => {
      const user = userEvent.setup()
      render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])

      const commentParagraphs = screen.queryAllByText('This is the first comment')
      const isInEditForm = commentParagraphs.some(el => el.tagName.toLowerCase() === 'p')
      expect(isInEditForm).toBe(false)
    })
  })

  describe('Delete Comment', () => {
    it('should show delete button for user own comments', () => {
      render(
        <ThreadedComments
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
        <ThreadedComments
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
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      await user.click(deleteButtons[0])

      expect(mockHandlers.onDelete).toHaveBeenCalledWith('comment-1')
    })

    it('should have danger class on delete button', () => {
      const { container } = render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const deleteButton = container.querySelector('.control-btn.danger')
      expect(deleteButton).toBeInTheDocument()
    })
  })

  describe('Comment Voting', () => {
    it('should call onReact when like button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const likeButtons = screen.getAllByTestId('heart-icon')
      await user.click(likeButtons[0].closest('button'))

      expect(mockHandlers.onReact).toHaveBeenCalledWith('comment-1', 'like')
    })

    it('should display current like count', () => {
      render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should display 0 when comment has no likes', () => {
      const commentWithNoLikes = [{
        ...mockComments[0],
        likes: 0
      }]
      render(
        <ThreadedComments
          comments={commentWithNoLikes}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('should apply active class when user has reacted', () => {
      const { container } = render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const activeReactionButton = container.querySelector('.reaction-btn.active')
      expect(activeReactionButton).toBeInTheDocument()
    })

    it('should not apply active class when user has not reacted', () => {
      const commentWithoutReaction = [mockComments[0]]
      const { container } = render(
        <ThreadedComments
          comments={commentWithoutReaction}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const reactionButton = container.querySelector('.reaction-btn')
      expect(reactionButton).not.toHaveClass('active')
    })
  })

  describe('Sort Options', () => {
    it('should default to best sort', () => {
      render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const sortSelect = screen.getByRole('combobox')
      expect(sortSelect).toHaveValue('best')
    })

    it('should have all sort options available', () => {
      render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByRole('option', { name: 'Best' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Newest' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Oldest' })).toBeInTheDocument()
    })

    it('should change sort order when option is selected', async () => {
      const user = userEvent.setup()
      render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const sortSelect = screen.getByRole('combobox')
      await user.selectOptions(sortSelect, 'newest')

      expect(sortSelect).toHaveValue('newest')
    })

    it('should sort comments by newest first', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const sortSelect = screen.getByRole('combobox')
      await user.selectOptions(sortSelect, 'newest')

      const commentContents = Array.from(container.querySelectorAll('.comment-content p'))
      expect(commentContents[0]).toHaveTextContent('This is the second comment')
    })

    it('should sort comments by oldest first', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const sortSelect = screen.getByRole('combobox')
      await user.selectOptions(sortSelect, 'oldest')

      const commentContents = Array.from(container.querySelectorAll('.comment-content p'))
      expect(commentContents[0]).toHaveTextContent('This is the first comment')
    })

    it('should sort comments by best (likes and replies)', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const sortSelect = screen.getByRole('combobox')
      await user.selectOptions(sortSelect, 'best')

      const commentContents = Array.from(container.querySelectorAll('.comment-content p'))
      expect(commentContents[0]).toHaveTextContent('This is the second comment')
    })
  })

  describe('Load More Replies', () => {
    it('should show load more button when depth exceeds maxDepth', () => {
      const deeplyNestedComment = {
        ...mockComments[0],
        replies: [
          {
            id: 'reply-1',
            content: 'Level 1',
            author: { id: 'user-2', username: 'User2' },
            timestamp: new Date().toISOString(),
            replies: []
          }
        ]
      }

      const { container } = render(
        <Comment
          comment={deeplyNestedComment}
          depth={5}
          onReply={mockHandlers.onReply}
          onReact={mockHandlers.onReact}
          onEdit={mockHandlers.onEdit}
          onDelete={mockHandlers.onDelete}
          currentUserId="user-1"
          maxDepth={5}
        />
      )

      expect(container.querySelector('.load-more-replies')).toBeInTheDocument()
    })

    it('should display correct reply count in load more button', () => {
      const commentWithManyReplies = {
        ...mockComments[0],
        replies: Array(5).fill(null).map((_, i) => ({
          id: `reply-${i}`,
          content: `Reply ${i}`,
          author: { id: `user-${i}`, username: `User${i}` },
          timestamp: new Date().toISOString(),
          replies: []
        }))
      }

      render(
        <Comment
          comment={commentWithManyReplies}
          depth={5}
          onReply={mockHandlers.onReply}
          onReact={mockHandlers.onReact}
          onEdit={mockHandlers.onEdit}
          onDelete={mockHandlers.onDelete}
          currentUserId="user-1"
          maxDepth={5}
        />
      )

      expect(screen.getByText(/View 5 more replies/i)).toBeInTheDocument()
    })

    it('should not show load more button when depth is below maxDepth', () => {
      const { container } = render(
        <Comment
          comment={mockComments[1]}
          depth={0}
          onReply={mockHandlers.onReply}
          onReact={mockHandlers.onReact}
          onEdit={mockHandlers.onEdit}
          onDelete={mockHandlers.onDelete}
          currentUserId="user-1"
          maxDepth={5}
        />
      )

      expect(container.querySelector('.load-more-replies')).not.toBeInTheDocument()
    })

    it('should not show load more button when comment has no replies', () => {
      const { container } = render(
        <Comment
          comment={mockComments[0]}
          depth={5}
          onReply={mockHandlers.onReply}
          onReact={mockHandlers.onReact}
          onEdit={mockHandlers.onEdit}
          onDelete={mockHandlers.onDelete}
          currentUserId="user-1"
          maxDepth={5}
        />
      )

      expect(container.querySelector('.load-more-replies')).not.toBeInTheDocument()
    })

    it('should not show load more when thread is collapsed', async () => {
      const user = userEvent.setup()
      const commentWithReplies = {
        ...mockComments[0],
        replies: [
          {
            id: 'reply-1',
            content: 'Level 1',
            author: { id: 'user-2', username: 'User2' },
            timestamp: new Date().toISOString(),
            replies: []
          }
        ]
      }

      const { container } = render(
        <Comment
          comment={commentWithReplies}
          depth={5}
          onReply={mockHandlers.onReply}
          onReact={mockHandlers.onReact}
          onEdit={mockHandlers.onEdit}
          onDelete={mockHandlers.onDelete}
          currentUserId="user-1"
          maxDepth={5}
        />
      )

      const collapseButton = screen.getByRole('button', { name: '' })
      await user.click(collapseButton)

      await waitFor(() => {
        expect(container.querySelector('.load-more-replies')).not.toBeInTheDocument()
      })
    })
  })

  describe('Comment Actions Visibility', () => {
    it('should show action buttons on mouse enter', async () => {
      const { container } = render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const commentCard = container.querySelector('.comment-card')
      fireEvent.mouseEnter(commentCard)

      await waitFor(() => {
        expect(container.querySelector('.comment-actions')).toBeInTheDocument()
      })
    })

    it('should hide action buttons on mouse leave', async () => {
      const { container } = render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const commentCard = container.querySelector('.comment-card')
      fireEvent.mouseEnter(commentCard)
      fireEvent.mouseLeave(commentCard)

      await waitFor(() => {
        expect(container.querySelector('.comment-actions')).not.toBeInTheDocument()
      })
    })

    it('should render more options button in actions', async () => {
      const { container } = render(
        <ThreadedComments
          comments={mockComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const commentCard = container.querySelector('.comment-card')
      fireEvent.mouseEnter(commentCard)

      await waitFor(() => {
        expect(screen.getByTitle('More options')).toBeInTheDocument()
      })
    })
  })

  describe('Time Display', () => {
    it('should display "now" for very recent comments', () => {
      const recentComment = [{
        ...mockComments[0],
        timestamp: new Date().toISOString()
      }]

      render(
        <ThreadedComments
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
        <ThreadedComments
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
        <ThreadedComments
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
        <ThreadedComments
          comments={recentComment}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText(/\d+d/)).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty comments array', () => {
      render(
        <ThreadedComments
          comments={[]}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('No comments yet')).toBeInTheDocument()
    })

    it('should handle undefined comments prop', () => {
      render(
        <ThreadedComments
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('No comments yet')).toBeInTheDocument()
    })

    it('should handle comment without author reputation', () => {
      const commentNoReputation = [{
        ...mockComments[0],
        author: {
          id: 'user-1',
          username: 'TestUser'
        }
      }]

      render(
        <ThreadedComments
          comments={commentNoReputation}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.queryByText('100')).not.toBeInTheDocument()
    })

    it('should handle comment without likes', () => {
      const commentNoLikes = [{
        ...mockComments[0],
        likes: undefined
      }]

      render(
        <ThreadedComments
          comments={commentNoLikes}
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
          replies: [{
            id: 'l2',
            content: 'Level 2',
            author: { id: 'u2', username: 'U2' },
            timestamp: new Date().toISOString(),
            replies: [{
              id: 'l3',
              content: 'Level 3',
              author: { id: 'u3', username: 'U3' },
              timestamp: new Date().toISOString(),
              replies: []
            }]
          }]
        }]
      }

      render(
        <ThreadedComments
          comments={[deepComment]}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('Level 1')).toBeInTheDocument()
      expect(screen.getByText('Level 2')).toBeInTheDocument()
      expect(screen.getByText('Level 3')).toBeInTheDocument()
    })

    it('should cap depth class at maxDepth', () => {
      const { container } = render(
        <Comment
          comment={mockComments[0]}
          depth={10}
          onReply={mockHandlers.onReply}
          onReact={mockHandlers.onReact}
          onEdit={mockHandlers.onEdit}
          onDelete={mockHandlers.onDelete}
          currentUserId="user-1"
          maxDepth={5}
        />
      )

      expect(container.querySelector('.depth-5')).toBeInTheDocument()
      expect(container.querySelector('.depth-10')).not.toBeInTheDocument()
    })

    it('should handle missing currentUser prop', () => {
      render(
        <ThreadedComments
          comments={mockComments}
          currentUser={null}
          {...mockHandlers}
        />
      )

      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
    })

    it('should handle comment with empty replies array', () => {
      const commentEmptyReplies = [{
        ...mockComments[0],
        replies: []
      }]

      render(
        <ThreadedComments
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
        <ThreadedComments
          comments={[commentNoReplies]}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.queryByTestId('chevron-down-icon')).not.toBeInTheDocument()
    })
  })
})

export default mockCurrentUser
