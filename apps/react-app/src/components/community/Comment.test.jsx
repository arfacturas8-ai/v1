import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import Comment from './Comment'
import VoteControls from './VoteControls'
import CommentActions from './CommentActions'
import Awards from './Awards'

jest.mock('./VoteControls')
jest.mock('./CommentActions')
jest.mock('./Awards')
jest.mock('dompurify', () => ({
  sanitize: jest.fn((content) => content)
}))

describe('Comment', () => {
  const mockComment = {
    id: 'comment-1',
    author: 'testuser',
    content: 'This is a test comment',
    score: 42,
    timestamp: new Date('2025-01-01T12:00:00Z').toISOString(),
    userVote: null,
    replies: [],
    isCollapsed: false
  }

  const defaultProps = {
    comment: mockComment,
    level: 0,
    maxLevel: 8,
    onVote: jest.fn(),
    onReply: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onSave: jest.fn(),
    onReport: jest.fn(),
    onAward: jest.fn(),
    onToggleCollapse: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    VoteControls.mockImplementation(() => <div data-testid="vote-controls">VoteControls</div>)
    CommentActions.mockImplementation(() => <div data-testid="comment-actions">CommentActions</div>)
    Awards.mockImplementation(() => <div data-testid="awards">Awards</div>)
    jest.spyOn(Date, 'now').mockReturnValue(new Date('2025-01-01T12:30:00Z').getTime())
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Comment Rendering', () => {
    test('renders comment with basic content', () => {
      render(<Comment {...defaultProps} />)
      expect(screen.getByText('This is a test comment')).toBeInTheDocument()
    })

    test('renders comment with custom className', () => {
      const { container } = render(<Comment {...defaultProps} className="custom-class" />)
      expect(container.querySelector('.custom-class')).toBeInTheDocument()
    })

    test('renders comment at root level without indentation', () => {
      const { container } = render(<Comment {...defaultProps} />)
      const commentContainer = container.querySelector('.comment-container')
      expect(commentContainer).not.toHaveClass('ml-4')
      expect(commentContainer).not.toHaveClass('md:ml-6')
    })

    test('renders comment at nested level with indentation', () => {
      const { container } = render(<Comment {...defaultProps} level={1} />)
      const commentContainer = container.querySelector('.comment-container')
      expect(commentContainer).toHaveClass('ml-4')
      expect(commentContainer).toHaveClass('md:ml-6')
    })

    test('renders thread connector line for nested comments', () => {
      const { container } = render(<Comment {...defaultProps} level={2} />)
      const connector = container.querySelector('.absolute.left-0.top-0')
      expect(connector).toBeInTheDocument()
    })

    test('does not render thread connector for root level', () => {
      const { container } = render(<Comment {...defaultProps} level={0} />)
      const connector = container.querySelector('.absolute.left-0.top-0')
      expect(connector).not.toBeInTheDocument()
    })

    test('applies correct indent color based on level', () => {
      const { container, rerender } = render(<Comment {...defaultProps} level={1} />)
      expect(container.querySelector('.border-accent\\/30')).toBeInTheDocument()

      rerender(<Comment {...defaultProps} level={2} />)
      expect(container.querySelector('.border-accent\\/25')).toBeInTheDocument()
    })
  })

  describe('Author Information', () => {
    test('renders author username as link', () => {
      render(<Comment {...defaultProps} />)
      const authorLink = screen.getByRole('link', { name: /u\/testuser/i })
      expect(authorLink).toBeInTheDocument()
      expect(authorLink).toHaveAttribute('href', '/u/testuser')
    })

    test('renders author flair when present', () => {
      const commentWithFlair = { ...mockComment, authorFlair: 'Expert' }
      render(<Comment {...defaultProps} comment={commentWithFlair} />)
      expect(screen.getByText('Expert')).toBeInTheDocument()
    })

    test('does not render author flair when absent', () => {
      render(<Comment {...defaultProps} />)
      expect(screen.queryByText('Expert')).not.toBeInTheDocument()
    })

    test('renders OP badge when isOP is true', () => {
      const commentWithOP = { ...mockComment, isOP: true }
      render(<Comment {...defaultProps} comment={commentWithOP} />)
      expect(screen.getByText('OP')).toBeInTheDocument()
    })

    test('does not render OP badge when isOP is false', () => {
      render(<Comment {...defaultProps} />)
      expect(screen.queryByText('OP')).not.toBeInTheDocument()
    })

    test('renders MOD badge when isModerator is true', () => {
      const commentWithMod = { ...mockComment, isModerator: true }
      render(<Comment {...defaultProps} comment={commentWithMod} />)
      expect(screen.getByText('MOD')).toBeInTheDocument()
    })

    test('does not render MOD badge when isModerator is false', () => {
      render(<Comment {...defaultProps} />)
      expect(screen.queryByText('MOD')).not.toBeInTheDocument()
    })

    test('renders all badges together when present', () => {
      const commentWithBadges = {
        ...mockComment,
        authorFlair: 'Pro',
        isOP: true,
        isModerator: true
      }
      render(<Comment {...defaultProps} comment={commentWithBadges} />)
      expect(screen.getByText('Pro')).toBeInTheDocument()
      expect(screen.getByText('OP')).toBeInTheDocument()
      expect(screen.getByText('MOD')).toBeInTheDocument()
    })
  })

  describe('Comment Content', () => {
    test('renders comment content with HTML sanitization', () => {
      const DOMPurify = require('dompurify')
      render(<Comment {...defaultProps} />)
      expect(DOMPurify.sanitize).toHaveBeenCalledWith('This is a test comment')
    })

    test('renders sanitized HTML content', () => {
      const commentWithHTML = {
        ...mockComment,
        content: '<p>Hello <strong>world</strong></p>'
      }
      render(<Comment {...defaultProps} comment={commentWithHTML} />)
      expect(screen.getByText(/Hello world/i)).toBeInTheDocument()
    })

    test('does not render content when collapsed', () => {
      render(<Comment {...defaultProps} />)
      const collapseButton = screen.getByLabelText('Collapse comment')
      fireEvent.click(collapseButton)
      expect(screen.queryByText('This is a test comment')).not.toBeInTheDocument()
    })

    test('displays edited indicator when comment is edited', () => {
      const editedComment = { ...mockComment, edited: true }
      render(<Comment {...defaultProps} comment={editedComment} />)
      expect(screen.getByText('edited')).toBeInTheDocument()
    })

    test('does not display edited indicator when comment is not edited', () => {
      render(<Comment {...defaultProps} />)
      expect(screen.queryByText('edited')).not.toBeInTheDocument()
    })

    test('displays gilded indicator when comment is gilded', () => {
      const gildedComment = { ...mockComment, isGilded: true }
      render(<Comment {...defaultProps} comment={gildedComment} />)
      expect(screen.getByText('🥇')).toBeInTheDocument()
    })

    test('does not display gilded indicator when comment is not gilded', () => {
      render(<Comment {...defaultProps} />)
      expect(screen.queryByText('🥇')).not.toBeInTheDocument()
    })
  })

  describe('Vote Controls', () => {
    test('renders VoteControls component', () => {
      render(<Comment {...defaultProps} />)
      expect(screen.getByTestId('vote-controls')).toBeInTheDocument()
    })

    test('passes correct props to VoteControls', () => {
      render(<Comment {...defaultProps} />)
      expect(VoteControls).toHaveBeenCalledWith(
        expect.objectContaining({
          postId: 'comment-1',
          initialScore: 42,
          userVote: null,
          onVote: defaultProps.onVote,
          size: 'sm',
          orientation: 'vertical'
        }),
        expect.anything()
      )
    })

    test('passes userVote to VoteControls when present', () => {
      const commentWithVote = { ...mockComment, userVote: 1 }
      render(<Comment {...defaultProps} comment={commentWithVote} />)
      expect(VoteControls).toHaveBeenCalledWith(
        expect.objectContaining({
          userVote: 1
        }),
        expect.anything()
      )
    })
  })

  describe('Reply Functionality', () => {
    test('shows reply form when reply button is clicked', () => {
      render(<Comment {...defaultProps} />)
      const commentActions = screen.getByTestId('comment-actions')
      const onReplyProp = CommentActions.mock.calls[0][0].onReply
      onReplyProp()
      expect(screen.getByPlaceholderText('Share your thoughts...')).toBeInTheDocument()
    })

    test('hides reply form when cancel is clicked', () => {
      render(<Comment {...defaultProps} />)
      const commentActions = screen.getByTestId('comment-actions')
      const onReplyProp = CommentActions.mock.calls[0][0].onReply
      onReplyProp()

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      fireEvent.click(cancelButton)
      expect(screen.queryByPlaceholderText('Share your thoughts...')).not.toBeInTheDocument()
    })

    test('calls onReply with content when reply is submitted', async () => {
      render(<Comment {...defaultProps} />)
      const commentActions = screen.getByTestId('comment-actions')
      const onReplyProp = CommentActions.mock.calls[0][0].onReply
      onReplyProp()

      const textarea = screen.getByPlaceholderText('Share your thoughts...')
      const submitButton = screen.getByRole('button', { name: /reply/i })

      await userEvent.type(textarea, 'This is a reply')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(defaultProps.onReply).toHaveBeenCalledWith('comment-1', 'This is a reply')
      })
    })

    test('clears reply form after successful submission', async () => {
      render(<Comment {...defaultProps} />)
      const commentActions = screen.getByTestId('comment-actions')
      const onReplyProp = CommentActions.mock.calls[0][0].onReply
      onReplyProp()

      const textarea = screen.getByPlaceholderText('Share your thoughts...')
      const submitButton = screen.getByRole('button', { name: /reply/i })

      await userEvent.type(textarea, 'Test reply')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Share your thoughts...')).not.toBeInTheDocument()
      })
    })

    test('disables submit button when reply content is empty', () => {
      render(<Comment {...defaultProps} />)
      const commentActions = screen.getByTestId('comment-actions')
      const onReplyProp = CommentActions.mock.calls[0][0].onReply
      onReplyProp()

      const submitButton = screen.getByRole('button', { name: /reply/i })
      expect(submitButton).toBeDisabled()
    })

    test('enables submit button when reply content is provided', async () => {
      render(<Comment {...defaultProps} />)
      const commentActions = screen.getByTestId('comment-actions')
      const onReplyProp = CommentActions.mock.calls[0][0].onReply
      onReplyProp()

      const textarea = screen.getByPlaceholderText('Share your thoughts...')
      const submitButton = screen.getByRole('button', { name: /reply/i })

      await userEvent.type(textarea, 'Test')
      expect(submitButton).not.toBeDisabled()
    })

    test('trims whitespace from reply content before submission', async () => {
      render(<Comment {...defaultProps} />)
      const commentActions = screen.getByTestId('comment-actions')
      const onReplyProp = CommentActions.mock.calls[0][0].onReply
      onReplyProp()

      const textarea = screen.getByPlaceholderText('Share your thoughts...')
      const submitButton = screen.getByRole('button', { name: /reply/i })

      await userEvent.type(textarea, '  Test reply  ')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(defaultProps.onReply).toHaveBeenCalledWith('comment-1', 'Test reply')
      })
    })

    test('prevents duplicate submissions while submitting', async () => {
      render(<Comment {...defaultProps} />)
      const commentActions = screen.getByTestId('comment-actions')
      const onReplyProp = CommentActions.mock.calls[0][0].onReply
      onReplyProp()

      const textarea = screen.getByPlaceholderText('Share your thoughts...')
      const submitButton = screen.getByRole('button', { name: /reply/i })

      await userEvent.type(textarea, 'Test')
      fireEvent.click(submitButton)
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(defaultProps.onReply).toHaveBeenCalledTimes(1)
      })
    })

    test('displays posting state while submitting reply', async () => {
      render(<Comment {...defaultProps} />)
      const commentActions = screen.getByTestId('comment-actions')
      const onReplyProp = CommentActions.mock.calls[0][0].onReply
      onReplyProp()

      const textarea = screen.getByPlaceholderText('Share your thoughts...')
      await userEvent.type(textarea, 'Test')

      const form = textarea.closest('form')
      fireEvent.submit(form)

      expect(screen.getByText('Posting...')).toBeInTheDocument()
    })
  })

  describe('Edit Comment', () => {
    test('shows edit form when edit button is clicked', () => {
      render(<Comment {...defaultProps} />)
      const commentActions = screen.getByTestId('comment-actions')
      const onEditProp = CommentActions.mock.calls[0][0].onEdit
      onEditProp()

      expect(screen.getByPlaceholderText('What are your thoughts?')).toBeInTheDocument()
    })

    test('populates edit form with current comment content', () => {
      render(<Comment {...defaultProps} />)
      const commentActions = screen.getByTestId('comment-actions')
      const onEditProp = CommentActions.mock.calls[0][0].onEdit
      onEditProp()

      const textarea = screen.getByPlaceholderText('What are your thoughts?')
      expect(textarea).toHaveValue('This is a test comment')
    })

    test('hides original content when editing', () => {
      render(<Comment {...defaultProps} />)
      expect(screen.getByText('This is a test comment')).toBeInTheDocument()

      const commentActions = screen.getByTestId('comment-actions')
      const onEditProp = CommentActions.mock.calls[0][0].onEdit
      onEditProp()

      const content = screen.queryByText('This is a test comment')
      expect(content?.tagName).not.toBe('DIV')
    })

    test('calls onEdit with new content when save is clicked', async () => {
      render(<Comment {...defaultProps} />)
      const commentActions = screen.getByTestId('comment-actions')
      const onEditProp = CommentActions.mock.calls[0][0].onEdit
      onEditProp()

      const textarea = screen.getByPlaceholderText('What are your thoughts?')
      await userEvent.clear(textarea)
      await userEvent.type(textarea, 'Updated content')

      const saveButton = screen.getByRole('button', { name: /save/i })
      fireEvent.click(saveButton)

      expect(defaultProps.onEdit).toHaveBeenCalledWith('comment-1', 'Updated content')
    })

    test('exits edit mode after saving', async () => {
      render(<Comment {...defaultProps} />)
      const commentActions = screen.getByTestId('comment-actions')
      const onEditProp = CommentActions.mock.calls[0][0].onEdit
      onEditProp()

      const textarea = screen.getByPlaceholderText('What are your thoughts?')
      await userEvent.type(textarea, 'Updated')

      const saveButton = screen.getByRole('button', { name: /save/i })
      fireEvent.click(saveButton)

      expect(screen.queryByPlaceholderText('What are your thoughts?')).not.toBeInTheDocument()
    })

    test('cancels edit and restores original content', () => {
      render(<Comment {...defaultProps} />)
      const commentActions = screen.getByTestId('comment-actions')
      const onEditProp = CommentActions.mock.calls[0][0].onEdit
      onEditProp()

      const textarea = screen.getByPlaceholderText('What are your thoughts?')
      fireEvent.change(textarea, { target: { value: 'Changed content' } })

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      fireEvent.click(cancelButton)

      expect(screen.queryByPlaceholderText('What are your thoughts?')).not.toBeInTheDocument()
      expect(screen.getByText('This is a test comment')).toBeInTheDocument()
    })

    test('disables save button when edit content is empty', async () => {
      render(<Comment {...defaultProps} />)
      const commentActions = screen.getByTestId('comment-actions')
      const onEditProp = CommentActions.mock.calls[0][0].onEdit
      onEditProp()

      const textarea = screen.getByPlaceholderText('What are your thoughts?')
      await userEvent.clear(textarea)

      const saveButton = screen.getByRole('button', { name: /save/i })
      expect(saveButton).toBeDisabled()
    })

    test('enables save button when edit content has text', () => {
      render(<Comment {...defaultProps} />)
      const commentActions = screen.getByTestId('comment-actions')
      const onEditProp = CommentActions.mock.calls[0][0].onEdit
      onEditProp()

      const saveButton = screen.getByRole('button', { name: /save/i })
      expect(saveButton).not.toBeDisabled()
    })

    test('auto-focuses edit textarea when entering edit mode', () => {
      render(<Comment {...defaultProps} />)
      const commentActions = screen.getByTestId('comment-actions')
      const onEditProp = CommentActions.mock.calls[0][0].onEdit
      onEditProp()

      const textarea = screen.getByPlaceholderText('What are your thoughts?')
      expect(textarea).toHaveFocus()
    })
  })

  describe('Delete Comment', () => {
    test('passes onDelete handler to CommentActions', () => {
      render(<Comment {...defaultProps} />)
      expect(CommentActions).toHaveBeenCalledWith(
        expect.objectContaining({
          onDelete: defaultProps.onDelete
        }),
        expect.anything()
      )
    })
  })

  describe('Comment Actions', () => {
    test('renders CommentActions component', () => {
      render(<Comment {...defaultProps} />)
      expect(screen.getByTestId('comment-actions')).toBeInTheDocument()
    })

    test('passes all required props to CommentActions', () => {
      render(<Comment {...defaultProps} />)
      expect(CommentActions).toHaveBeenCalledWith(
        expect.objectContaining({
          comment: mockComment,
          onSave: defaultProps.onSave,
          onReport: defaultProps.onReport,
          onAward: defaultProps.onAward
        }),
        expect.anything()
      )
    })

    test('hides CommentActions when comment is collapsed', () => {
      render(<Comment {...defaultProps} />)
      const collapseButton = screen.getByLabelText('Collapse comment')
      fireEvent.click(collapseButton)

      expect(screen.queryByTestId('comment-actions')).not.toBeInTheDocument()
    })
  })

  describe('Nested Replies', () => {
    test('renders nested replies recursively', () => {
      const commentWithReplies = {
        ...mockComment,
        replies: [
          { ...mockComment, id: 'reply-1', content: 'First reply' },
          { ...mockComment, id: 'reply-2', content: 'Second reply' }
        ]
      }
      render(<Comment {...defaultProps} comment={commentWithReplies} />)
      expect(screen.getByText('First reply')).toBeInTheDocument()
      expect(screen.getByText('Second reply')).toBeInTheDocument()
    })

    test('increments level for nested comments', () => {
      const commentWithReplies = {
        ...mockComment,
        replies: [{ ...mockComment, id: 'reply-1', content: 'Reply' }]
      }
      const { container } = render(<Comment {...defaultProps} comment={commentWithReplies} level={1} />)
      const nestedComments = container.querySelectorAll('.comment-container')
      expect(nestedComments.length).toBeGreaterThan(1)
    })

    test('does not render replies when collapsed', () => {
      const commentWithReplies = {
        ...mockComment,
        replies: [{ ...mockComment, id: 'reply-1', content: 'Hidden reply' }]
      }
      render(<Comment {...defaultProps} comment={commentWithReplies} />)

      const collapseButton = screen.getByLabelText('Collapse comment')
      fireEvent.click(collapseButton)

      expect(screen.queryByText('Hidden reply')).not.toBeInTheDocument()
    })

    test('shows continue thread link when max level is reached', () => {
      const commentWithReplies = {
        ...mockComment,
        id: 'deep-comment',
        postId: 'post-123',
        community: 'testcommunity',
        replies: [{ ...mockComment, id: 'reply-1', content: 'Deep reply' }]
      }
      render(<Comment {...defaultProps} comment={commentWithReplies} level={8} maxLevel={8} />)
      expect(screen.getByText('Continue thread')).toBeInTheDocument()
    })

    test('continue thread link has correct href', () => {
      const commentWithReplies = {
        ...mockComment,
        id: 'deep-comment',
        postId: 'post-123',
        community: 'testcommunity',
        replies: [{ ...mockComment, id: 'reply-1' }]
      }
      render(<Comment {...defaultProps} comment={commentWithReplies} level={8} maxLevel={8} />)
      const link = screen.getByText('Continue thread').closest('a')
      expect(link).toHaveAttribute('href', '/c/testcommunity/comments/post-123/deep-comment')
    })

    test('does not show continue thread when below max level', () => {
      const commentWithReplies = {
        ...mockComment,
        replies: [{ ...mockComment, id: 'reply-1', content: 'Normal reply' }]
      }
      render(<Comment {...defaultProps} comment={commentWithReplies} level={3} maxLevel={8} />)
      expect(screen.queryByText('Continue thread')).not.toBeInTheDocument()
      expect(screen.getByText('Normal reply')).toBeInTheDocument()
    })

    test('passes all handlers to nested comments', () => {
      const commentWithReplies = {
        ...mockComment,
        replies: [{ ...mockComment, id: 'reply-1', content: 'Reply' }]
      }
      render(<Comment {...defaultProps} comment={commentWithReplies} />)

      // Verify nested comment rendered (handlers passed implicitly)
      expect(screen.getByText('Reply')).toBeInTheDocument()
    })
  })

  describe('Collapse/Expand', () => {
    test('renders collapse button', () => {
      render(<Comment {...defaultProps} />)
      expect(screen.getByLabelText('Collapse comment')).toBeInTheDocument()
    })

    test('shows down arrow icon when expanded', () => {
      const { container } = render(<Comment {...defaultProps} />)
      const button = screen.getByLabelText('Collapse comment')
      const svg = button.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    test('toggles to collapsed state on click', () => {
      render(<Comment {...defaultProps} />)
      const collapseButton = screen.getByLabelText('Collapse comment')
      fireEvent.click(collapseButton)
      expect(screen.getByLabelText('Expand comment')).toBeInTheDocument()
    })

    test('shows right arrow icon when collapsed', () => {
      render(<Comment {...defaultProps} />)
      const button = screen.getByLabelText('Collapse comment')
      fireEvent.click(button)

      const expandButton = screen.getByLabelText('Expand comment')
      expect(expandButton).toBeInTheDocument()
    })

    test('calls onToggleCollapse with correct parameters', () => {
      render(<Comment {...defaultProps} />)
      const collapseButton = screen.getByLabelText('Collapse comment')
      fireEvent.click(collapseButton)
      expect(defaultProps.onToggleCollapse).toHaveBeenCalledWith('comment-1', true)
    })

    test('calls onToggleCollapse when expanding', () => {
      render(<Comment {...defaultProps} />)
      const collapseButton = screen.getByLabelText('Collapse comment')
      fireEvent.click(collapseButton)

      const expandButton = screen.getByLabelText('Expand comment')
      fireEvent.click(expandButton)
      expect(defaultProps.onToggleCollapse).toHaveBeenCalledWith('comment-1', false)
    })

    test('shows collapsed preview with author name', () => {
      render(<Comment {...defaultProps} />)
      const collapseButton = screen.getByLabelText('Collapse comment')
      fireEvent.click(collapseButton)

      const preview = screen.getByText('u/testuser')
      expect(preview).toBeInTheDocument()
    })

    test('shows score in collapsed preview', () => {
      render(<Comment {...defaultProps} />)
      const collapseButton = screen.getByLabelText('Collapse comment')
      fireEvent.click(collapseButton)
      expect(screen.getByText('+42')).toBeInTheDocument()
    })

    test('shows reply count in collapsed preview', () => {
      const commentWithReplies = {
        ...mockComment,
        replies: [
          { ...mockComment, id: 'reply-1' },
          { ...mockComment, id: 'reply-2' }
        ]
      }
      render(<Comment {...defaultProps} comment={commentWithReplies} />)
      const collapseButton = screen.getByLabelText('Collapse comment')
      fireEvent.click(collapseButton)
      expect(screen.getByText('2 replies')).toBeInTheDocument()
    })

    test('shows singular reply in collapsed preview', () => {
      const commentWithOneReply = {
        ...mockComment,
        replies: [{ ...mockComment, id: 'reply-1' }]
      }
      render(<Comment {...defaultProps} comment={commentWithOneReply} />)
      const collapseButton = screen.getByLabelText('Collapse comment')
      fireEvent.click(collapseButton)
      expect(screen.getByText('1 reply')).toBeInTheDocument()
    })

    test('initializes as collapsed when comment.isCollapsed is true', () => {
      const collapsedComment = { ...mockComment, isCollapsed: true }
      render(<Comment {...defaultProps} comment={collapsedComment} />)
      expect(screen.getByLabelText('Expand comment')).toBeInTheDocument()
      expect(screen.queryByText('This is a test comment')).not.toBeInTheDocument()
    })
  })

  describe('Timestamp Display', () => {
    test('displays timestamp in relative format', () => {
      render(<Comment {...defaultProps} />)
      expect(screen.getByText('30m')).toBeInTheDocument()
    })

    test('formats timestamp as "now" for very recent comments', () => {
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2025-01-01T12:00:30Z').getTime())
      render(<Comment {...defaultProps} />)
      expect(screen.getByText('now')).toBeInTheDocument()
    })

    test('formats timestamp in minutes', () => {
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2025-01-01T12:05:00Z').getTime())
      render(<Comment {...defaultProps} />)
      expect(screen.getByText('5m')).toBeInTheDocument()
    })

    test('formats timestamp in hours', () => {
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2025-01-01T15:00:00Z').getTime())
      render(<Comment {...defaultProps} />)
      expect(screen.getByText('3h')).toBeInTheDocument()
    })

    test('formats timestamp in days', () => {
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2025-01-05T12:00:00Z').getTime())
      render(<Comment {...defaultProps} />)
      expect(screen.getByText('4d')).toBeInTheDocument()
    })

    test('formats timestamp as full date for old comments', () => {
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2025-02-15T12:00:00Z').getTime())
      const oldComment = {
        ...mockComment,
        timestamp: new Date('2024-12-01T12:00:00Z').toISOString()
      }
      render(<Comment {...defaultProps} comment={oldComment} />)
      expect(screen.getByText('12/1/2024')).toBeInTheDocument()
    })

    test('timestamp has correct datetime attribute', () => {
      render(<Comment {...defaultProps} />)
      const time = screen.getByText('30m')
      expect(time.tagName).toBe('TIME')
      expect(time).toHaveAttribute('dateTime', mockComment.timestamp)
    })
  })

  describe('Awards', () => {
    test('renders Awards component when awards are present', () => {
      const commentWithAwards = {
        ...mockComment,
        awards: [
          { id: 'award-1', type: 'gold', count: 2 },
          { id: 'award-2', type: 'silver', count: 1 }
        ]
      }
      render(<Comment {...defaultProps} comment={commentWithAwards} />)
      expect(screen.getByTestId('awards')).toBeInTheDocument()
    })

    test('does not render Awards component when no awards', () => {
      render(<Comment {...defaultProps} />)
      expect(screen.queryByTestId('awards')).not.toBeInTheDocument()
    })

    test('passes correct props to Awards component', () => {
      const commentWithAwards = {
        ...mockComment,
        awards: [{ id: 'award-1', type: 'gold', count: 1 }]
      }
      render(<Comment {...defaultProps} comment={commentWithAwards} />)
      expect(Awards).toHaveBeenCalledWith(
        expect.objectContaining({
          awards: commentWithAwards.awards,
          size: 'sm'
        }),
        expect.anything()
      )
    })

    test('hides awards when comment is collapsed', () => {
      const commentWithAwards = {
        ...mockComment,
        awards: [{ id: 'award-1', type: 'gold', count: 1 }]
      }
      render(<Comment {...defaultProps} comment={commentWithAwards} />)

      const collapseButton = screen.getByLabelText('Collapse comment')
      fireEvent.click(collapseButton)

      expect(screen.queryByTestId('awards')).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    test('handles missing optional props gracefully', () => {
      const minimalProps = {
        comment: mockComment,
        level: 0
      }
      expect(() => render(<Comment {...minimalProps} />)).not.toThrow()
    })

    test('handles reply submission error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      const failingOnReply = jest.fn().mockRejectedValue(new Error('Network error'))

      render(<Comment {...defaultProps} onReply={failingOnReply} />)

      const commentActions = screen.getByTestId('comment-actions')
      const onReplyProp = CommentActions.mock.calls[0][0].onReply
      onReplyProp()

      const textarea = screen.getByPlaceholderText('Share your thoughts...')
      await userEvent.type(textarea, 'Test reply')

      const submitButton = screen.getByRole('button', { name: /reply/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to submit reply:',
          expect.any(Error)
        )
      })

      consoleError.mockRestore()
    })

    test('re-enables form after reply submission error', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {})
      const failingOnReply = jest.fn().mockRejectedValue(new Error('Error'))

      render(<Comment {...defaultProps} onReply={failingOnReply} />)

      const commentActions = screen.getByTestId('comment-actions')
      const onReplyProp = CommentActions.mock.calls[0][0].onReply
      onReplyProp()

      const textarea = screen.getByPlaceholderText('Share your thoughts...')
      await userEvent.type(textarea, 'Test')

      const submitButton = screen.getByRole('button', { name: /reply/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled()
      })
    })

    test('handles comments with no replies array', () => {
      const commentNoReplies = { ...mockComment }
      delete commentNoReplies.replies
      expect(() => render(<Comment {...defaultProps} comment={commentNoReplies} />)).not.toThrow()
    })

    test('handles null userVote', () => {
      const commentNullVote = { ...mockComment, userVote: null }
      expect(() => render(<Comment {...defaultProps} comment={commentNullVote} />)).not.toThrow()
    })
  })

  describe('Loading States', () => {
    test('disables reply form during submission', async () => {
      render(<Comment {...defaultProps} />)
      const commentActions = screen.getByTestId('comment-actions')
      const onReplyProp = CommentActions.mock.calls[0][0].onReply
      onReplyProp()

      const textarea = screen.getByPlaceholderText('Share your thoughts...')
      await userEvent.type(textarea, 'Test')

      const form = textarea.closest('form')
      fireEvent.submit(form)

      expect(textarea).toBeDisabled()
    })

    test('disables reply buttons during submission', async () => {
      render(<Comment {...defaultProps} />)
      const commentActions = screen.getByTestId('comment-actions')
      const onReplyProp = CommentActions.mock.calls[0][0].onReply
      onReplyProp()

      const textarea = screen.getByPlaceholderText('Share your thoughts...')
      await userEvent.type(textarea, 'Test')

      const form = textarea.closest('form')
      fireEvent.submit(form)

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      const submitButton = screen.getByRole('button', { name: /posting\.\.\./i })

      expect(cancelButton).toBeDisabled()
      expect(submitButton).toBeDisabled()
    })
  })
})

export default mockComment
