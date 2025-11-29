import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import PostActions from './PostActions'

jest.mock('./ShareModal', () => {
  return function ShareModal({ post, onClose, onShare }) {
    return (
      <div data-testid="share-modal">
        <button onClick={() => onShare?.(post.id, 'twitter')}>Share on Twitter</button>
        <button onClick={onClose}>Close Share Modal</button>
      </div>
    )
  }
})

jest.mock('./AwardModal', () => {
  return function AwardModal({ post, onClose, onAward }) {
    return (
      <div data-testid="award-modal">
        <button onClick={() => onAward?.(post.id, 'gold')}>Give Gold Award</button>
        <button onClick={onClose}>Close Award Modal</button>
      </div>
    )
  }
})

describe('PostActions', () => {
  const mockPost = {
    id: 'post-123',
    title: 'Test Post Title',
    community: 'testcommunity',
    author: 'testuser',
    commentCount: 42,
    isSaved: false
  }

  const mockHandlers = {
    onComment: jest.fn(),
    onShare: jest.fn(),
    onSave: jest.fn(),
    onReport: jest.fn(),
    onAward: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    delete window.location
    window.location = { origin: 'http://localhost:3000' }
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0',
      configurable: true
    })
  })

  describe('Actions Menu Rendering', () => {
    it('should render all main action buttons', () => {
      render(<PostActions post={mockPost} {...mockHandlers} />)

      expect(screen.getByLabelText(/comments/i)).toBeInTheDocument()
      expect(screen.getByLabelText('Give award')).toBeInTheDocument()
      expect(screen.getByLabelText('Share post')).toBeInTheDocument()
      expect(screen.getByLabelText('Save post')).toBeInTheDocument()
    })

    it('should render comment count correctly', () => {
      render(<PostActions post={mockPost} {...mockHandlers} />)

      expect(screen.getByText(/42 Comments/i)).toBeInTheDocument()
    })

    it('should render comment count as 0 when undefined', () => {
      const postWithoutComments = { ...mockPost, commentCount: undefined }
      render(<PostActions post={postWithoutComments} {...mockHandlers} />)

      expect(screen.getByText(/0 Comments/i)).toBeInTheDocument()
    })

    it('should render more options button', () => {
      render(<PostActions post={mockPost} {...mockHandlers} />)

      expect(screen.getByLabelText('More options')).toBeInTheDocument()
    })

    it('should render all action icons', () => {
      const { container } = render(<PostActions post={mockPost} {...mockHandlers} />)

      const svgs = container.querySelectorAll('svg')
      expect(svgs.length).toBeGreaterThan(3)
    })
  })

  describe('Comment Action', () => {
    it('should call onComment with post id when comment button is clicked', () => {
      render(<PostActions post={mockPost} {...mockHandlers} />)

      const commentButton = screen.getByLabelText(/comments/i)
      fireEvent.click(commentButton)

      expect(mockHandlers.onComment).toHaveBeenCalledTimes(1)
      expect(mockHandlers.onComment).toHaveBeenCalledWith(mockPost.id)
    })

    it('should not call onComment if handler is not provided', () => {
      const { onComment, ...handlersWithoutComment } = mockHandlers
      render(<PostActions post={mockPost} {...handlersWithoutComment} />)

      const commentButton = screen.getByLabelText(/comments/i)
      expect(() => fireEvent.click(commentButton)).not.toThrow()
    })

    it('should display formatted comment count for thousands', () => {
      const postWithManyComments = { ...mockPost, commentCount: 1500 }
      render(<PostActions post={postWithManyComments} {...mockHandlers} />)

      expect(screen.getByText(/1.5K Comments/i)).toBeInTheDocument()
    })

    it('should display formatted comment count for millions', () => {
      const postWithMillionsComments = { ...mockPost, commentCount: 2500000 }
      render(<PostActions post={postWithMillionsComments} {...mockHandlers} />)

      expect(screen.getByText(/2.5M Comments/i)).toBeInTheDocument()
    })
  })

  describe('Share Action', () => {
    it('should open share modal when share button is clicked on desktop', () => {
      render(<PostActions post={mockPost} {...mockHandlers} />)

      const shareButton = screen.getByLabelText('Share post')
      fireEvent.click(shareButton)

      expect(screen.getByTestId('share-modal')).toBeInTheDocument()
    })

    it('should use native share API on mobile devices', () => {
      const mockShare = jest.fn()
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true
      })
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        configurable: true
      })

      render(<PostActions post={mockPost} {...mockHandlers} />)

      const shareButton = screen.getByLabelText('Share post')
      fireEvent.click(shareButton)

      expect(mockShare).toHaveBeenCalledWith({
        title: mockPost.title,
        url: `http://localhost:3000/c/${mockPost.community}/comments/${mockPost.id}`
      })
    })

    it('should use native share API on Android devices', () => {
      const mockShare = jest.fn()
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10)',
        configurable: true
      })
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        configurable: true
      })

      render(<PostActions post={mockPost} {...mockHandlers} />)

      const shareButton = screen.getByLabelText('Share post')
      fireEvent.click(shareButton)

      expect(mockShare).toHaveBeenCalled()
    })

    it('should close share modal when close button is clicked', () => {
      render(<PostActions post={mockPost} {...mockHandlers} />)

      const shareButton = screen.getByLabelText('Share post')
      fireEvent.click(shareButton)

      expect(screen.getByTestId('share-modal')).toBeInTheDocument()

      const closeButton = screen.getByText('Close Share Modal')
      fireEvent.click(closeButton)

      expect(screen.queryByTestId('share-modal')).not.toBeInTheDocument()
    })

    it('should call onShare callback when sharing from modal', () => {
      render(<PostActions post={mockPost} {...mockHandlers} />)

      const shareButton = screen.getByLabelText('Share post')
      fireEvent.click(shareButton)

      const twitterButton = screen.getByText('Share on Twitter')
      fireEvent.click(twitterButton)

      expect(mockHandlers.onShare).toHaveBeenCalledWith(mockPost.id, 'twitter')
    })

    it('should not throw if onShare handler is not provided', () => {
      const { onShare, ...handlersWithoutShare } = mockHandlers
      render(<PostActions post={mockPost} {...handlersWithoutShare} />)

      const shareButton = screen.getByLabelText('Share post')
      expect(() => fireEvent.click(shareButton)).not.toThrow()
    })
  })

  describe('Save/Bookmark Action', () => {
    it('should call onSave with post id and true when saving unsaved post', () => {
      render(<PostActions post={mockPost} {...mockHandlers} />)

      const saveButton = screen.getByLabelText('Save post')
      fireEvent.click(saveButton)

      expect(mockHandlers.onSave).toHaveBeenCalledTimes(1)
      expect(mockHandlers.onSave).toHaveBeenCalledWith(mockPost.id, true)
    })

    it('should call onSave with post id and false when unsaving saved post', () => {
      const savedPost = { ...mockPost, isSaved: true }
      render(<PostActions post={savedPost} {...mockHandlers} />)

      const unsaveButton = screen.getByLabelText('Unsave post')
      fireEvent.click(unsaveButton)

      expect(mockHandlers.onSave).toHaveBeenCalledTimes(1)
      expect(mockHandlers.onSave).toHaveBeenCalledWith(mockPost.id, false)
    })

    it('should show Save label when post is not saved', () => {
      render(<PostActions post={mockPost} {...mockHandlers} />)

      expect(screen.getByText('Save')).toBeInTheDocument()
      expect(screen.getByLabelText('Save post')).toBeInTheDocument()
    })

    it('should show Unsave label when post is saved', () => {
      const savedPost = { ...mockPost, isSaved: true }
      render(<PostActions post={savedPost} {...mockHandlers} />)

      expect(screen.getByText('Saved')).toBeInTheDocument()
      expect(screen.getByLabelText('Unsave post')).toBeInTheDocument()
    })

    it('should apply active class when post is saved', () => {
      const savedPost = { ...mockPost, isSaved: true }
      render(<PostActions post={savedPost} {...mockHandlers} />)

      const saveButton = screen.getByLabelText('Unsave post')
      expect(saveButton).toHaveClass('text-accent')
    })

    it('should not apply active class when post is not saved', () => {
      render(<PostActions post={mockPost} {...mockHandlers} />)

      const saveButton = screen.getByLabelText('Save post')
      expect(saveButton).not.toHaveClass('text-accent')
    })

    it('should not throw if onSave handler is not provided', () => {
      const { onSave, ...handlersWithoutSave } = mockHandlers
      render(<PostActions post={mockPost} {...handlersWithoutSave} />)

      const saveButton = screen.getByLabelText('Save post')
      expect(() => fireEvent.click(saveButton)).not.toThrow()
    })

    it('should toggle save state correctly on multiple clicks', () => {
      const { rerender } = render(<PostActions post={mockPost} {...mockHandlers} />)

      const saveButton = screen.getByLabelText('Save post')
      fireEvent.click(saveButton)

      expect(mockHandlers.onSave).toHaveBeenCalledWith(mockPost.id, true)

      const savedPost = { ...mockPost, isSaved: true }
      rerender(<PostActions post={savedPost} {...mockHandlers} />)

      const unsaveButton = screen.getByLabelText('Unsave post')
      fireEvent.click(unsaveButton)

      expect(mockHandlers.onSave).toHaveBeenCalledWith(mockPost.id, false)
    })
  })

  describe('Award Action', () => {
    it('should open award modal when award button is clicked', () => {
      render(<PostActions post={mockPost} {...mockHandlers} />)

      const awardButton = screen.getByLabelText('Give award')
      fireEvent.click(awardButton)

      expect(screen.getByTestId('award-modal')).toBeInTheDocument()
    })

    it('should close award modal when close button is clicked', () => {
      render(<PostActions post={mockPost} {...mockHandlers} />)

      const awardButton = screen.getByLabelText('Give award')
      fireEvent.click(awardButton)

      expect(screen.getByTestId('award-modal')).toBeInTheDocument()

      const closeButton = screen.getByText('Close Award Modal')
      fireEvent.click(closeButton)

      expect(screen.queryByTestId('award-modal')).not.toBeInTheDocument()
    })

    it('should call onAward callback when giving award from modal', () => {
      render(<PostActions post={mockPost} {...mockHandlers} />)

      const awardButton = screen.getByLabelText('Give award')
      fireEvent.click(awardButton)

      const giveAwardButton = screen.getByText('Give Gold Award')
      fireEvent.click(giveAwardButton)

      expect(mockHandlers.onAward).toHaveBeenCalledWith(mockPost.id, 'gold')
    })

    it('should not throw if onAward handler is not provided', () => {
      const { onAward, ...handlersWithoutAward } = mockHandlers
      render(<PostActions post={mockPost} {...handlersWithoutAward} />)

      const awardButton = screen.getByLabelText('Give award')
      expect(() => fireEvent.click(awardButton)).not.toThrow()
    })
  })

  describe('More Menu', () => {
    it('should toggle more menu on button click', () => {
      render(<PostActions post={mockPost} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')
      expect(moreButton).toHaveAttribute('aria-expanded', 'false')

      fireEvent.click(moreButton)
      expect(moreButton).toHaveAttribute('aria-expanded', 'true')

      fireEvent.click(moreButton)
      expect(moreButton).toHaveAttribute('aria-expanded', 'false')
    })

    it('should show dropdown menu when more button is clicked', () => {
      render(<PostActions post={mockPost} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')
      fireEvent.click(moreButton)

      expect(screen.getByText('Report')).toBeInTheDocument()
    })

    it('should hide dropdown menu by default', () => {
      render(<PostActions post={mockPost} {...mockHandlers} />)

      expect(screen.queryByText('Report')).not.toBeInTheDocument()
    })

    it('should close dropdown when clicking outside', () => {
      render(<PostActions post={mockPost} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')
      fireEvent.click(moreButton)

      expect(screen.getByText('Report')).toBeInTheDocument()

      const backdrop = document.querySelector('.fixed.inset-0.z-40')
      fireEvent.click(backdrop)

      expect(screen.queryByText('Report')).not.toBeInTheDocument()
    })

    it('should render backdrop when more menu is open', () => {
      render(<PostActions post={mockPost} {...mockHandlers} />)

      expect(document.querySelector('.fixed.inset-0.z-40')).not.toBeInTheDocument()

      const moreButton = screen.getByLabelText('More options')
      fireEvent.click(moreButton)

      expect(document.querySelector('.fixed.inset-0.z-40')).toBeInTheDocument()
    })

    it('should remove backdrop when more menu is closed', () => {
      render(<PostActions post={mockPost} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')
      fireEvent.click(moreButton)

      expect(document.querySelector('.fixed.inset-0.z-40')).toBeInTheDocument()

      fireEvent.click(moreButton)

      expect(document.querySelector('.fixed.inset-0.z-40')).not.toBeInTheDocument()
    })
  })

  describe('Report Action', () => {
    it('should render report option in more menu', () => {
      render(<PostActions post={mockPost} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')
      fireEvent.click(moreButton)

      expect(screen.getByText('Report')).toBeInTheDocument()
    })

    it('should call onReport with post id when report is clicked', () => {
      render(<PostActions post={mockPost} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')
      fireEvent.click(moreButton)

      const reportButton = screen.getByText('Report')
      fireEvent.click(reportButton)

      expect(mockHandlers.onReport).toHaveBeenCalledTimes(1)
      expect(mockHandlers.onReport).toHaveBeenCalledWith(mockPost.id)
    })

    it('should close more menu after clicking report', () => {
      render(<PostActions post={mockPost} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')
      fireEvent.click(moreButton)

      const reportButton = screen.getByText('Report')
      fireEvent.click(reportButton)

      expect(screen.queryByText('Report')).not.toBeInTheDocument()
    })

    it('should apply danger class to report button', () => {
      render(<PostActions post={mockPost} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')
      fireEvent.click(moreButton)

      const reportButton = screen.getByText('Report')
      expect(reportButton).toHaveClass('text-error')
    })

    it('should not throw if onReport handler is not provided', () => {
      const { onReport, ...handlersWithoutReport } = mockHandlers
      render(<PostActions post={mockPost} {...handlersWithoutReport} />)

      const moreButton = screen.getByLabelText('More options')
      fireEvent.click(moreButton)

      const reportButton = screen.getByText('Report')
      expect(() => fireEvent.click(reportButton)).not.toThrow()
    })
  })

  describe('Compact Mode', () => {
    it('should apply compact styles when compact prop is true', () => {
      const { container } = render(<PostActions post={mockPost} {...mockHandlers} compact={true} />)

      const actionsContainer = container.querySelector('.flex.items-center')
      expect(actionsContainer).toHaveClass('gap-xs')
      expect(actionsContainer).toHaveClass('text-xs')
    })

    it('should apply normal styles when compact prop is false', () => {
      const { container } = render(<PostActions post={mockPost} {...mockHandlers} compact={false} />)

      const actionsContainer = container.querySelector('.flex.items-center')
      expect(actionsContainer).toHaveClass('gap-sm')
      expect(actionsContainer).toHaveClass('text-sm')
    })

    it('should show short labels in compact mode', () => {
      render(<PostActions post={mockPost} {...mockHandlers} compact={true} />)

      const commentButton = screen.getByLabelText(/comments/i)
      expect(commentButton.textContent).toContain('42')
    })

    it('should hide More text label in compact mode', () => {
      render(<PostActions post={mockPost} {...mockHandlers} compact={true} />)

      const moreButton = screen.getByLabelText('More options')
      expect(moreButton.textContent).not.toContain('More')
    })

    it('should show More text label in normal mode', () => {
      render(<PostActions post={mockPost} {...mockHandlers} compact={false} />)

      const moreButton = screen.getByLabelText('More options')
      expect(moreButton.textContent).toContain('More')
    })
  })

  describe('Number Formatting', () => {
    it('should format numbers less than 1000 as is', () => {
      const post = { ...mockPost, commentCount: 999 }
      render(<PostActions post={post} {...mockHandlers} />)

      expect(screen.getByText(/999/)).toBeInTheDocument()
    })

    it('should format numbers over 1000 with K suffix', () => {
      const post = { ...mockPost, commentCount: 1234 }
      render(<PostActions post={post} {...mockHandlers} />)

      expect(screen.getByText(/1.2K/)).toBeInTheDocument()
    })

    it('should format numbers over 1 million with M suffix', () => {
      const post = { ...mockPost, commentCount: 1234567 }
      render(<PostActions post={post} {...mockHandlers} />)

      expect(screen.getByText(/1.2M/)).toBeInTheDocument()
    })

    it('should format exactly 1000 as 1.0K', () => {
      const post = { ...mockPost, commentCount: 1000 }
      render(<PostActions post={post} {...mockHandlers} />)

      expect(screen.getByText(/1.0K/)).toBeInTheDocument()
    })

    it('should format exactly 1000000 as 1.0M', () => {
      const post = { ...mockPost, commentCount: 1000000 }
      render(<PostActions post={post} {...mockHandlers} />)

      expect(screen.getByText(/1.0M/)).toBeInTheDocument()
    })
  })

  describe('Multiple Action Interactions', () => {
    it('should handle multiple button clicks in sequence', () => {
      render(<PostActions post={mockPost} {...mockHandlers} />)

      fireEvent.click(screen.getByLabelText(/comments/i))
      fireEvent.click(screen.getByLabelText('Give award'))
      fireEvent.click(screen.getByLabelText('Save post'))

      expect(mockHandlers.onComment).toHaveBeenCalledTimes(1)
      expect(screen.getByTestId('award-modal')).toBeInTheDocument()
      expect(mockHandlers.onSave).toHaveBeenCalledTimes(1)
    })

    it('should handle opening and closing more menu multiple times', () => {
      render(<PostActions post={mockPost} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')

      fireEvent.click(moreButton)
      expect(screen.getByText('Report')).toBeInTheDocument()

      fireEvent.click(moreButton)
      expect(screen.queryByText('Report')).not.toBeInTheDocument()

      fireEvent.click(moreButton)
      expect(screen.getByText('Report')).toBeInTheDocument()
    })

    it('should allow share modal and award modal to open in sequence', () => {
      render(<PostActions post={mockPost} {...mockHandlers} />)

      const shareButton = screen.getByLabelText('Share post')
      fireEvent.click(shareButton)
      expect(screen.getByTestId('share-modal')).toBeInTheDocument()

      const closeShareButton = screen.getByText('Close Share Modal')
      fireEvent.click(closeShareButton)

      const awardButton = screen.getByLabelText('Give award')
      fireEvent.click(awardButton)
      expect(screen.getByTestId('award-modal')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper aria-label for comment button', () => {
      render(<PostActions post={mockPost} {...mockHandlers} />)
      expect(screen.getByLabelText('42 comments')).toBeInTheDocument()
    })

    it('should have proper aria-label for award button', () => {
      render(<PostActions post={mockPost} {...mockHandlers} />)
      expect(screen.getByLabelText('Give award')).toBeInTheDocument()
    })

    it('should have proper aria-label for share button', () => {
      render(<PostActions post={mockPost} {...mockHandlers} />)
      expect(screen.getByLabelText('Share post')).toBeInTheDocument()
    })

    it('should have proper aria-label for save button', () => {
      render(<PostActions post={mockPost} {...mockHandlers} />)
      expect(screen.getByLabelText('Save post')).toBeInTheDocument()
    })

    it('should have proper aria-label for unsave button', () => {
      const savedPost = { ...mockPost, isSaved: true }
      render(<PostActions post={savedPost} {...mockHandlers} />)
      expect(screen.getByLabelText('Unsave post')).toBeInTheDocument()
    })

    it('should have proper aria-label for more options button', () => {
      render(<PostActions post={mockPost} {...mockHandlers} />)
      expect(screen.getByLabelText('More options')).toBeInTheDocument()
    })

    it('should have aria-expanded attribute on more button', () => {
      render(<PostActions post={mockPost} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')
      expect(moreButton).toHaveAttribute('aria-expanded')
    })

    it('should update aria-expanded when menu opens', () => {
      render(<PostActions post={mockPost} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')
      expect(moreButton).toHaveAttribute('aria-expanded', 'false')

      fireEvent.click(moreButton)
      expect(moreButton).toHaveAttribute('aria-expanded', 'true')
    })

    it('should update aria-expanded when menu closes', () => {
      render(<PostActions post={mockPost} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')
      fireEvent.click(moreButton)
      expect(moreButton).toHaveAttribute('aria-expanded', 'true')

      fireEvent.click(moreButton)
      expect(moreButton).toHaveAttribute('aria-expanded', 'false')
    })
  })

  describe('Edge Cases', () => {
    it('should handle post without id', () => {
      const postWithoutId = { ...mockPost, id: undefined }
      render(<PostActions post={postWithoutId} {...mockHandlers} />)

      expect(screen.getByLabelText(/comments/i)).toBeInTheDocument()
    })

    it('should handle post with zero comments', () => {
      const postWithZeroComments = { ...mockPost, commentCount: 0 }
      render(<PostActions post={postWithZeroComments} {...mockHandlers} />)

      expect(screen.getByText(/0 Comments/i)).toBeInTheDocument()
    })

    it('should handle post with null comment count', () => {
      const postWithNullComments = { ...mockPost, commentCount: null }
      render(<PostActions post={postWithNullComments} {...mockHandlers} />)

      expect(screen.getByText(/0 Comments/i)).toBeInTheDocument()
    })

    it('should handle missing handlers gracefully', () => {
      render(<PostActions post={mockPost} />)

      const commentButton = screen.getByLabelText(/comments/i)
      const saveButton = screen.getByLabelText('Save post')

      expect(() => {
        fireEvent.click(commentButton)
        fireEvent.click(saveButton)
      }).not.toThrow()
    })

    it('should handle all handlers as undefined', () => {
      render(
        <PostActions
          post={mockPost}
          onComment={undefined}
          onShare={undefined}
          onSave={undefined}
          onReport={undefined}
          onAward={undefined}
        />
      )

      expect(screen.getByLabelText(/comments/i)).toBeInTheDocument()
    })
  })

  describe('Modal State Management', () => {
    it('should only show one modal at a time - share modal', () => {
      render(<PostActions post={mockPost} {...mockHandlers} />)

      const shareButton = screen.getByLabelText('Share post')
      fireEvent.click(shareButton)

      expect(screen.getByTestId('share-modal')).toBeInTheDocument()
      expect(screen.queryByTestId('award-modal')).not.toBeInTheDocument()
    })

    it('should only show one modal at a time - award modal', () => {
      render(<PostActions post={mockPost} {...mockHandlers} />)

      const awardButton = screen.getByLabelText('Give award')
      fireEvent.click(awardButton)

      expect(screen.getByTestId('award-modal')).toBeInTheDocument()
      expect(screen.queryByTestId('share-modal')).not.toBeInTheDocument()
    })

    it('should not show modals by default', () => {
      render(<PostActions post={mockPost} {...mockHandlers} />)

      expect(screen.queryByTestId('share-modal')).not.toBeInTheDocument()
      expect(screen.queryByTestId('award-modal')).not.toBeInTheDocument()
    })

    it('should maintain more menu state independently of modals', () => {
      render(<PostActions post={mockPost} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')
      fireEvent.click(moreButton)

      expect(screen.getByText('Report')).toBeInTheDocument()

      const awardButton = screen.getByLabelText('Give award')
      fireEvent.click(awardButton)

      expect(screen.getByTestId('award-modal')).toBeInTheDocument()
      expect(screen.getByText('Report')).toBeInTheDocument()
    })
  })

  describe('Visual States', () => {
    it('should apply hover styles to action buttons', () => {
      const { container } = render(<PostActions post={mockPost} {...mockHandlers} />)

      const commentButton = screen.getByLabelText(/comments/i)
      expect(commentButton).toHaveClass('hover:text-primary/90')
      expect(commentButton).toHaveClass('hover:bg-hover-bg/60')
    })

    it('should apply transition styles to action buttons', () => {
      render(<PostActions post={mockPost} {...mockHandlers} />)

      const commentButton = screen.getByLabelText(/comments/i)
      expect(commentButton).toHaveClass('transition-all')
      expect(commentButton).toHaveClass('duration-200')
    })

    it('should show saved state visually with accent colors', () => {
      const savedPost = { ...mockPost, isSaved: true }
      render(<PostActions post={savedPost} {...mockHandlers} />)

      const saveButton = screen.getByLabelText('Unsave post')
      expect(saveButton).toHaveClass('text-accent')
      expect(saveButton).toHaveClass('bg-accent/5')
    })

    it('should apply danger styles to report action', () => {
      render(<PostActions post={mockPost} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')
      fireEvent.click(moreButton)

      const reportButton = screen.getByText('Report')
      expect(reportButton).toHaveClass('text-error')
      expect(reportButton).toHaveClass('hover:text-error')
      expect(reportButton).toHaveClass('hover:bg-error/5')
    })
  })

  describe('Dropdown Menu Positioning', () => {
    it('should position dropdown menu above button', () => {
      const { container } = render(<PostActions post={mockPost} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')
      fireEvent.click(moreButton)

      const dropdown = container.querySelector('.absolute.bottom-full')
      expect(dropdown).toBeInTheDocument()
    })

    it('should apply proper z-index to dropdown', () => {
      const { container } = render(<PostActions post={mockPost} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')
      fireEvent.click(moreButton)

      const dropdown = container.querySelector('.z-50')
      expect(dropdown).toBeInTheDocument()
    })

    it('should apply backdrop blur to dropdown', () => {
      const { container } = render(<PostActions post={mockPost} {...mockHandlers} />)

      const moreButton = screen.getByLabelText('More options')
      fireEvent.click(moreButton)

      const dropdown = container.querySelector('.backdrop-blur-sm')
      expect(dropdown).toBeInTheDocument()
    })
  })
})

export default ShareModal
