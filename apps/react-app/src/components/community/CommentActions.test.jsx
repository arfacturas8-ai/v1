import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import CommentActions from './CommentActions'

describe('CommentActions', () => {
  const mockComment = {
    id: 'comment-123',
    isCurrentUser: false,
    isDeleted: false,
    isSaved: false
  }

  const mockHandlers = {
    onReply: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onSave: jest.fn(),
    onReport: jest.fn(),
    onAward: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Main Actions Rendering', () => {
    it('should render reply button', () => {
      render(<CommentActions comment={mockComment} {...mockHandlers} />)
      expect(screen.getByLabelText('Reply')).toBeInTheDocument()
    })

    it('should render award button', () => {
      render(<CommentActions comment={mockComment} {...mockHandlers} />)
      expect(screen.getByLabelText('Award')).toBeInTheDocument()
    })

    it('should render save button', () => {
      render(<CommentActions comment={mockComment} {...mockHandlers} />)
      expect(screen.getByLabelText('Save')).toBeInTheDocument()
    })

    it('should render all main actions for non-deleted comment', () => {
      render(<CommentActions comment={mockComment} {...mockHandlers} />)
      expect(screen.getByLabelText('Reply')).toBeInTheDocument()
      expect(screen.getByLabelText('Award')).toBeInTheDocument()
      expect(screen.getByLabelText('Save')).toBeInTheDocument()
    })

    it('should hide reply button for deleted comments', () => {
      const deletedComment = { ...mockComment, isDeleted: true }
      render(<CommentActions comment={deletedComment} {...mockHandlers} />)
      expect(screen.queryByLabelText('Reply')).not.toBeInTheDocument()
    })

    it('should hide award button for deleted comments', () => {
      const deletedComment = { ...mockComment, isDeleted: true }
      render(<CommentActions comment={deletedComment} {...mockHandlers} />)
      expect(screen.queryByLabelText('Award')).not.toBeInTheDocument()
    })

    it('should always show save button regardless of deletion status', () => {
      const deletedComment = { ...mockComment, isDeleted: true }
      render(<CommentActions comment={deletedComment} {...mockHandlers} />)
      expect(screen.getByLabelText('Unsave')).toBeInTheDocument()
    })

    it('should show "Save" label when comment is not saved', () => {
      render(<CommentActions comment={mockComment} {...mockHandlers} />)
      expect(screen.getByLabelText('Save')).toBeInTheDocument()
    })

    it('should show "Unsave" label when comment is saved', () => {
      const savedComment = { ...mockComment, isSaved: true }
      render(<CommentActions comment={savedComment} {...mockHandlers} />)
      expect(screen.getByLabelText('Unsave')).toBeInTheDocument()
    })

    it('should apply active class to save button when saved', () => {
      const savedComment = { ...mockComment, isSaved: true }
      render(<CommentActions comment={savedComment} {...mockHandlers} />)
      const saveButton = screen.getByLabelText('Unsave')
      expect(saveButton).toHaveClass('text-accent')
    })

    it('should not apply active class to save button when not saved', () => {
      render(<CommentActions comment={mockComment} {...mockHandlers} />)
      const saveButton = screen.getByLabelText('Save')
      expect(saveButton).not.toHaveClass('text-accent')
    })
  })

  describe('More Menu Rendering', () => {
    it('should render more menu button when more actions are available', () => {
      const authorComment = { ...mockComment, isCurrentUser: true }
      render(<CommentActions comment={authorComment} {...mockHandlers} />)
      expect(screen.getByLabelText('More options')).toBeInTheDocument()
    })

    it('should not render more menu when no more actions are available', () => {
      const deletedComment = { ...mockComment, isDeleted: true }
      render(<CommentActions comment={deletedComment} {...mockHandlers} />)
      expect(screen.queryByLabelText('More options')).not.toBeInTheDocument()
    })

    it('should toggle more menu on button click', () => {
      const authorComment = { ...mockComment, isCurrentUser: true }
      render(<CommentActions comment={authorComment} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')
      expect(moreButton).toHaveAttribute('aria-expanded', 'false')

      fireEvent.click(moreButton)
      expect(moreButton).toHaveAttribute('aria-expanded', 'true')

      fireEvent.click(moreButton)
      expect(moreButton).toHaveAttribute('aria-expanded', 'false')
    })

    it('should show dropdown menu when more button is clicked', () => {
      const authorComment = { ...mockComment, isCurrentUser: true }
      render(<CommentActions comment={authorComment} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')
      fireEvent.click(moreButton)

      expect(screen.getByText('Edit')).toBeInTheDocument()
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    it('should close dropdown when clicking outside', () => {
      const authorComment = { ...mockComment, isCurrentUser: true }
      render(<CommentActions comment={authorComment} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')
      fireEvent.click(moreButton)

      expect(screen.getByText('Edit')).toBeInTheDocument()

      const backdrop = document.querySelector('.fixed.inset-0.z-40')
      fireEvent.click(backdrop)

      expect(screen.queryByText('Edit')).not.toBeInTheDocument()
    })

    it('should show edit and delete options for author', () => {
      const authorComment = { ...mockComment, isCurrentUser: true }
      render(<CommentActions comment={authorComment} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')
      fireEvent.click(moreButton)

      expect(screen.getByText('Edit')).toBeInTheDocument()
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    it('should show report option for non-author', () => {
      render(<CommentActions comment={mockComment} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')
      fireEvent.click(moreButton)

      expect(screen.getByText('Report')).toBeInTheDocument()
    })

    it('should not show edit option for non-author', () => {
      render(<CommentActions comment={mockComment} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')
      fireEvent.click(moreButton)

      expect(screen.queryByText('Edit')).not.toBeInTheDocument()
    })

    it('should not show delete option for non-author', () => {
      render(<CommentActions comment={mockComment} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')
      fireEvent.click(moreButton)

      expect(screen.queryByText('Delete')).not.toBeInTheDocument()
    })

    it('should not show report option for author', () => {
      const authorComment = { ...mockComment, isCurrentUser: true }
      render(<CommentActions comment={authorComment} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')
      fireEvent.click(moreButton)

      expect(screen.queryByText('Report')).not.toBeInTheDocument()
    })
  })

  describe('Permissions and Visibility', () => {
    it('should hide edit option for deleted comments even if author', () => {
      const deletedAuthorComment = { ...mockComment, isCurrentUser: true, isDeleted: true }
      render(<CommentActions comment={deletedAuthorComment} {...mockHandlers} />)

      expect(screen.queryByLabelText('More options')).not.toBeInTheDocument()
    })

    it('should hide delete option for deleted comments even if author', () => {
      const deletedAuthorComment = { ...mockComment, isCurrentUser: true, isDeleted: true }
      render(<CommentActions comment={deletedAuthorComment} {...mockHandlers} />)

      expect(screen.queryByLabelText('More options')).not.toBeInTheDocument()
    })

    it('should hide report option for deleted comments', () => {
      const deletedComment = { ...mockComment, isDeleted: true }
      render(<CommentActions comment={deletedComment} {...mockHandlers} />)

      expect(screen.queryByLabelText('More options')).not.toBeInTheDocument()
    })

    it('should allow edit for non-deleted comments by author', () => {
      const authorComment = { ...mockComment, isCurrentUser: true }
      render(<CommentActions comment={authorComment} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')
      fireEvent.click(moreButton)

      expect(screen.getByText('Edit')).toBeInTheDocument()
    })

    it('should allow delete for non-deleted comments by author', () => {
      const authorComment = { ...mockComment, isCurrentUser: true }
      render(<CommentActions comment={authorComment} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')
      fireEvent.click(moreButton)

      expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    it('should apply danger class to delete button', () => {
      const authorComment = { ...mockComment, isCurrentUser: true }
      render(<CommentActions comment={authorComment} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')
      fireEvent.click(moreButton)

      const deleteButton = screen.getByText('Delete')
      expect(deleteButton).toHaveClass('text-error')
    })

    it('should apply danger class to report button', () => {
      render(<CommentActions comment={mockComment} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')
      fireEvent.click(moreButton)

      const reportButton = screen.getByText('Report')
      expect(reportButton).toHaveClass('text-error')
    })
  })

  describe('Reply Action', () => {
    it('should call onReply when reply button is clicked', () => {
      render(<CommentActions comment={mockComment} {...mockHandlers} />)

      const replyButton = screen.getByLabelText('Reply')
      fireEvent.click(replyButton)

      expect(mockHandlers.onReply).toHaveBeenCalledTimes(1)
    })

    it('should not call onReply if handler is not provided', () => {
      const { onReply, ...handlersWithoutReply } = mockHandlers
      render(<CommentActions comment={mockComment} {...handlersWithoutReply} />)

      const replyButton = screen.getByLabelText('Reply')
      expect(() => fireEvent.click(replyButton)).not.toThrow()
    })
  })

  describe('Award Action', () => {
    it('should call onAward with comment id when award button is clicked', () => {
      render(<CommentActions comment={mockComment} {...mockHandlers} />)

      const awardButton = screen.getByLabelText('Award')
      fireEvent.click(awardButton)

      expect(mockHandlers.onAward).toHaveBeenCalledTimes(1)
      expect(mockHandlers.onAward).toHaveBeenCalledWith(mockComment.id)
    })

    it('should not call onAward if handler is not provided', () => {
      const { onAward, ...handlersWithoutAward } = mockHandlers
      render(<CommentActions comment={mockComment} {...handlersWithoutAward} />)

      const awardButton = screen.getByLabelText('Award')
      expect(() => fireEvent.click(awardButton)).not.toThrow()
    })
  })

  describe('Save Action', () => {
    it('should call onSave with comment id and true when saving unsaved comment', () => {
      render(<CommentActions comment={mockComment} {...mockHandlers} />)

      const saveButton = screen.getByLabelText('Save')
      fireEvent.click(saveButton)

      expect(mockHandlers.onSave).toHaveBeenCalledTimes(1)
      expect(mockHandlers.onSave).toHaveBeenCalledWith(mockComment.id, true)
    })

    it('should call onSave with comment id and false when unsaving saved comment', () => {
      const savedComment = { ...mockComment, isSaved: true }
      render(<CommentActions comment={savedComment} {...mockHandlers} />)

      const unsaveButton = screen.getByLabelText('Unsave')
      fireEvent.click(unsaveButton)

      expect(mockHandlers.onSave).toHaveBeenCalledTimes(1)
      expect(mockHandlers.onSave).toHaveBeenCalledWith(mockComment.id, false)
    })

    it('should not call onSave if handler is not provided', () => {
      const { onSave, ...handlersWithoutSave } = mockHandlers
      render(<CommentActions comment={mockComment} {...handlersWithoutSave} />)

      const saveButton = screen.getByLabelText('Save')
      expect(() => fireEvent.click(saveButton)).not.toThrow()
    })
  })

  describe('Edit Action', () => {
    it('should call onEdit when edit button is clicked', () => {
      const authorComment = { ...mockComment, isCurrentUser: true }
      render(<CommentActions comment={authorComment} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')
      fireEvent.click(moreButton)

      const editButton = screen.getByText('Edit')
      fireEvent.click(editButton)

      expect(mockHandlers.onEdit).toHaveBeenCalledTimes(1)
    })

    it('should close more menu after clicking edit', () => {
      const authorComment = { ...mockComment, isCurrentUser: true }
      render(<CommentActions comment={authorComment} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')
      fireEvent.click(moreButton)

      const editButton = screen.getByText('Edit')
      fireEvent.click(editButton)

      expect(screen.queryByText('Edit')).not.toBeInTheDocument()
    })

    it('should not call onEdit if handler is not provided', () => {
      const authorComment = { ...mockComment, isCurrentUser: true }
      const { onEdit, ...handlersWithoutEdit } = mockHandlers
      render(<CommentActions comment={authorComment} {...handlersWithoutEdit} />)

      const moreButton = screen.getByLabelText('More options')
      fireEvent.click(moreButton)

      const editButton = screen.getByText('Edit')
      expect(() => fireEvent.click(editButton)).not.toThrow()
    })
  })

  describe('Delete Action', () => {
    beforeEach(() => {
      global.confirm = jest.fn()
    })

    afterEach(() => {
      global.confirm.mockRestore()
    })

    it('should show confirmation dialog when delete is clicked', () => {
      global.confirm.mockReturnValue(false)
      const authorComment = { ...mockComment, isCurrentUser: true }
      render(<CommentActions comment={authorComment} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')
      fireEvent.click(moreButton)

      const deleteButton = screen.getByText('Delete')
      fireEvent.click(deleteButton)

      expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete this comment?')
    })

    it('should call onDelete with comment id when deletion is confirmed', () => {
      global.confirm.mockReturnValue(true)
      const authorComment = { ...mockComment, isCurrentUser: true }
      render(<CommentActions comment={authorComment} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')
      fireEvent.click(moreButton)

      const deleteButton = screen.getByText('Delete')
      fireEvent.click(deleteButton)

      expect(mockHandlers.onDelete).toHaveBeenCalledTimes(1)
      expect(mockHandlers.onDelete).toHaveBeenCalledWith(mockComment.id)
    })

    it('should not call onDelete when deletion is cancelled', () => {
      global.confirm.mockReturnValue(false)
      const authorComment = { ...mockComment, isCurrentUser: true }
      render(<CommentActions comment={authorComment} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')
      fireEvent.click(moreButton)

      const deleteButton = screen.getByText('Delete')
      fireEvent.click(deleteButton)

      expect(mockHandlers.onDelete).not.toHaveBeenCalled()
    })

    it('should close more menu after delete action regardless of confirmation', () => {
      global.confirm.mockReturnValue(false)
      const authorComment = { ...mockComment, isCurrentUser: true }
      render(<CommentActions comment={authorComment} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')
      fireEvent.click(moreButton)

      const deleteButton = screen.getByText('Delete')
      fireEvent.click(deleteButton)

      expect(screen.queryByText('Delete')).not.toBeInTheDocument()
    })

    it('should close more menu even when deletion is confirmed', () => {
      global.confirm.mockReturnValue(true)
      const authorComment = { ...mockComment, isCurrentUser: true }
      render(<CommentActions comment={authorComment} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')
      fireEvent.click(moreButton)

      const deleteButton = screen.getByText('Delete')
      fireEvent.click(deleteButton)

      expect(screen.queryByText('Delete')).not.toBeInTheDocument()
    })

    it('should not call onDelete if handler is not provided', () => {
      global.confirm.mockReturnValue(true)
      const authorComment = { ...mockComment, isCurrentUser: true }
      const { onDelete, ...handlersWithoutDelete } = mockHandlers
      render(<CommentActions comment={authorComment} {...handlersWithoutDelete} />)

      const moreButton = screen.getByLabelText('More options')
      fireEvent.click(moreButton)

      const deleteButton = screen.getByText('Delete')
      expect(() => fireEvent.click(deleteButton)).not.toThrow()
    })
  })

  describe('Report Action', () => {
    it('should call onReport with comment id when report is clicked', () => {
      render(<CommentActions comment={mockComment} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')
      fireEvent.click(moreButton)

      const reportButton = screen.getByText('Report')
      fireEvent.click(reportButton)

      expect(mockHandlers.onReport).toHaveBeenCalledTimes(1)
      expect(mockHandlers.onReport).toHaveBeenCalledWith(mockComment.id)
    })

    it('should close more menu after clicking report', () => {
      render(<CommentActions comment={mockComment} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')
      fireEvent.click(moreButton)

      const reportButton = screen.getByText('Report')
      fireEvent.click(reportButton)

      expect(screen.queryByText('Report')).not.toBeInTheDocument()
    })

    it('should not call onReport if handler is not provided', () => {
      const { onReport, ...handlersWithoutReport } = mockHandlers
      render(<CommentActions comment={mockComment} {...handlersWithoutReport} />)

      const moreButton = screen.getByLabelText('More options')
      fireEvent.click(moreButton)

      const reportButton = screen.getByText('Report')
      expect(() => fireEvent.click(reportButton)).not.toThrow()
    })
  })

  describe('Comment State Variations', () => {
    it('should handle comment without id', () => {
      const commentWithoutId = { ...mockComment, id: undefined }
      render(<CommentActions comment={commentWithoutId} {...mockHandlers} />)

      expect(screen.getByLabelText('Reply')).toBeInTheDocument()
    })

    it('should handle all flags as false', () => {
      const plainComment = {
        id: 'test-id',
        isCurrentUser: false,
        isDeleted: false,
        isSaved: false
      }
      render(<CommentActions comment={plainComment} {...mockHandlers} />)

      expect(screen.getByLabelText('Reply')).toBeInTheDocument()
      expect(screen.getByLabelText('Award')).toBeInTheDocument()
      expect(screen.getByLabelText('Save')).toBeInTheDocument()
    })

    it('should handle all flags as true', () => {
      const fullyFlaggedComment = {
        id: 'test-id',
        isCurrentUser: true,
        isDeleted: true,
        isSaved: true
      }
      render(<CommentActions comment={fullyFlaggedComment} {...mockHandlers} />)

      expect(screen.queryByLabelText('Reply')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Award')).not.toBeInTheDocument()
      expect(screen.getByLabelText('Unsave')).toBeInTheDocument()
    })
  })

  describe('Multiple Action Interactions', () => {
    it('should handle multiple button clicks in sequence', () => {
      render(<CommentActions comment={mockComment} {...mockHandlers} />)

      fireEvent.click(screen.getByLabelText('Reply'))
      fireEvent.click(screen.getByLabelText('Award'))
      fireEvent.click(screen.getByLabelText('Save'))

      expect(mockHandlers.onReply).toHaveBeenCalledTimes(1)
      expect(mockHandlers.onAward).toHaveBeenCalledTimes(1)
      expect(mockHandlers.onSave).toHaveBeenCalledTimes(1)
    })

    it('should toggle save state correctly on multiple clicks', () => {
      const { rerender } = render(<CommentActions comment={mockComment} {...mockHandlers} />)

      const saveButton = screen.getByLabelText('Save')
      fireEvent.click(saveButton)

      expect(mockHandlers.onSave).toHaveBeenCalledWith(mockComment.id, true)

      const savedComment = { ...mockComment, isSaved: true }
      rerender(<CommentActions comment={savedComment} {...mockHandlers} />)

      const unsaveButton = screen.getByLabelText('Unsave')
      fireEvent.click(unsaveButton)

      expect(mockHandlers.onSave).toHaveBeenCalledWith(mockComment.id, false)
    })

    it('should handle opening and closing more menu multiple times', () => {
      const authorComment = { ...mockComment, isCurrentUser: true }
      render(<CommentActions comment={authorComment} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')

      fireEvent.click(moreButton)
      expect(screen.getByText('Edit')).toBeInTheDocument()

      fireEvent.click(moreButton)
      expect(screen.queryByText('Edit')).not.toBeInTheDocument()

      fireEvent.click(moreButton)
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper aria-label for reply button', () => {
      render(<CommentActions comment={mockComment} {...mockHandlers} />)
      expect(screen.getByLabelText('Reply')).toBeInTheDocument()
    })

    it('should have proper aria-label for award button', () => {
      render(<CommentActions comment={mockComment} {...mockHandlers} />)
      expect(screen.getByLabelText('Award')).toBeInTheDocument()
    })

    it('should have proper aria-label for save button', () => {
      render(<CommentActions comment={mockComment} {...mockHandlers} />)
      expect(screen.getByLabelText('Save')).toBeInTheDocument()
    })

    it('should have proper aria-label for more options button', () => {
      const authorComment = { ...mockComment, isCurrentUser: true }
      render(<CommentActions comment={authorComment} {...mockHandlers} />)
      expect(screen.getByLabelText('More options')).toBeInTheDocument()
    })

    it('should have aria-expanded attribute on more button', () => {
      const authorComment = { ...mockComment, isCurrentUser: true }
      render(<CommentActions comment={authorComment} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')
      expect(moreButton).toHaveAttribute('aria-expanded')
    })

    it('should update aria-expanded when menu opens', () => {
      const authorComment = { ...mockComment, isCurrentUser: true }
      render(<CommentActions comment={authorComment} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')
      expect(moreButton).toHaveAttribute('aria-expanded', 'false')

      fireEvent.click(moreButton)
      expect(moreButton).toHaveAttribute('aria-expanded', 'true')
    })
  })
})

export default mockComment
