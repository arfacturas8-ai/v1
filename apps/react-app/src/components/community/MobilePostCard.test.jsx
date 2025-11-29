import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import MobilePostCard from './MobilePostCard'
import VoteControls from './VoteControls'
import MediaPreview from './MediaPreview'
import Awards from './Awards'

jest.mock('./VoteControls')
jest.mock('./MediaPreview')
jest.mock('./Awards')

describe('MobilePostCard Component', () => {
  const mockPost = {
    id: 'post-1',
    title: 'Test Post Title',
    content: 'This is test content for the post',
    author: 'testuser',
    community: 'testcommunity',
    timestamp: '2024-01-15T12:00:00Z',
    score: 42,
    commentCount: 15,
    userVote: null,
    isSaved: false,
    edited: false
  }

  const mockHandlers = {
    onVote: jest.fn(),
    onComment: jest.fn(),
    onShare: jest.fn(),
    onSave: jest.fn(),
    onReport: jest.fn(),
    onAward: jest.fn(),
    onSwipeLeft: jest.fn(),
    onSwipeRight: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    VoteControls.mockImplementation(({ postId, initialScore, userVote, onVote }) => (
      <div data-testid="vote-controls">
        <button onClick={() => onVote('upvote')}>Upvote</button>
        <span>{initialScore}</span>
      </div>
    ))
    MediaPreview.mockImplementation(({ media, title }) => (
      <div data-testid="media-preview">{title}</div>
    ))
    Awards.mockImplementation(({ awards }) => (
      <div data-testid="awards">{awards.length} awards</div>
    ))
  })

  describe('Basic Rendering', () => {
    it('should render the post card with basic structure', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      expect(screen.getByRole('article')).toBeInTheDocument()
      expect(screen.getByRole('article')).toHaveClass('mobile-post-card')
    })

    it('should apply custom className when provided', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} className="custom-class" />)
      expect(screen.getByRole('article')).toHaveClass('custom-class')
    })

    it('should render with default card classes', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      const article = screen.getByRole('article')
      expect(article).toHaveClass('card', 'p-md', 'relative', 'overflow-hidden')
    })

    it('should have initial transform style of 0px', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      const article = screen.getByRole('article')
      expect(article).toHaveStyle({ transform: 'translateX(0px)' })
    })

    it('should render all main sections', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      expect(screen.getByRole('heading', { name: mockPost.title })).toBeInTheDocument()
      expect(screen.getByTestId('vote-controls')).toBeInTheDocument()
    })
  })

  describe('Title Display', () => {
    it('should render post title correctly', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      expect(screen.getByText(mockPost.title)).toBeInTheDocument()
    })

    it('should render title as h2 element', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      const title = screen.getByRole('heading', { name: mockPost.title })
      expect(title.tagName).toBe('H2')
    })

    it('should apply correct title styling', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      const title = screen.getByRole('heading', { name: mockPost.title })
      expect(title).toHaveClass('font-semibold', 'text-primary', 'mb-sm', 'text-base')
    })

    it('should render long title without truncation', () => {
      const longTitle = 'A'.repeat(200)
      const post = { ...mockPost, title: longTitle }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      expect(screen.getByText(longTitle)).toBeInTheDocument()
    })
  })

  describe('Content Display', () => {
    it('should render post content when provided', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      expect(screen.getByText(mockPost.content)).toBeInTheDocument()
    })

    it('should not render content section when content is null', () => {
      const post = { ...mockPost, content: null }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      expect(screen.queryByText('This is test content')).not.toBeInTheDocument()
    })

    it('should not render content section when content is empty string', () => {
      const post = { ...mockPost, content: '' }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      const article = screen.getByRole('article')
      expect(within(article).queryByText('')).not.toBeInTheDocument()
    })

    it('should apply line-clamp to content', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      const content = screen.getByText(mockPost.content)
      expect(content).toHaveClass('line-clamp-3')
    })

    it('should strip HTML tags from content', () => {
      const post = { ...mockPost, content: '<p>Test <strong>content</strong></p>' }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      expect(screen.getByText('Test content')).toBeInTheDocument()
    })

    it('should strip multiple HTML tags correctly', () => {
      const post = { ...mockPost, content: '<div><p>Test</p><span>content</span></div>' }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      expect(screen.getByText('Testcontent')).toBeInTheDocument()
    })
  })

  describe('Author Information', () => {
    it('should display author username with u/ prefix', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      expect(screen.getByText(`u/${mockPost.author}`)).toBeInTheDocument()
    })

    it('should render author link with correct href', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      const authorLink = screen.getByRole('link', { name: `u/${mockPost.author}` })
      expect(authorLink).toHaveAttribute('href', `/u/${mockPost.author}`)
    })

    it('should apply hover styles to author link', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      const authorLink = screen.getByRole('link', { name: `u/${mockPost.author}` })
      expect(authorLink).toHaveClass('hover:text-primary')
    })

    it('should render author with flex-shrink-0', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      const authorLink = screen.getByRole('link', { name: `u/${mockPost.author}` })
      expect(authorLink).toHaveClass('flex-shrink-0')
    })
  })

  describe('Community Information', () => {
    it('should display community name when showCommunity is true', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} showCommunity={true} />)
      expect(screen.getByText(`c/${mockPost.community}`)).toBeInTheDocument()
    })

    it('should not display community name when showCommunity is false', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} showCommunity={false} />)
      expect(screen.queryByText(`c/${mockPost.community}`)).not.toBeInTheDocument()
    })

    it('should render community link with correct href', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} showCommunity={true} />)
      const communityLink = screen.getByRole('link', { name: `c/${mockPost.community}` })
      expect(communityLink).toHaveAttribute('href', `/c/${mockPost.community}`)
    })

    it('should apply accent color to community link', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} showCommunity={true} />)
      const communityLink = screen.getByRole('link', { name: `c/${mockPost.community}` })
      expect(communityLink).toHaveClass('text-accent', 'hover:text-accent-light')
    })

    it('should show community by default', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      expect(screen.getByText(`c/${mockPost.community}`)).toBeInTheDocument()
    })
  })

  describe('Timestamp Display', () => {
    it('should render timestamp with time element', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      const timeElement = screen.getByRole('time')
      expect(timeElement).toBeInTheDocument()
    })

    it('should have correct dateTime attribute', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      const timeElement = screen.getByRole('time')
      expect(timeElement).toHaveAttribute('dateTime', mockPost.timestamp)
    })

    it('should display "now" for very recent posts', () => {
      const recentPost = { ...mockPost, timestamp: new Date().toISOString() }
      render(<MobilePostCard post={recentPost} {...mockHandlers} />)
      expect(screen.getByText('now')).toBeInTheDocument()
    })

    it('should display hours for posts less than 24 hours old', () => {
      const hoursAgo = new Date(Date.now() - 5 * 3600000).toISOString()
      const post = { ...mockPost, timestamp: hoursAgo }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      expect(screen.getByText('5h')).toBeInTheDocument()
    })

    it('should display days for posts less than 7 days old', () => {
      const daysAgo = new Date(Date.now() - 3 * 86400000).toISOString()
      const post = { ...mockPost, timestamp: daysAgo }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      expect(screen.getByText('3d')).toBeInTheDocument()
    })

    it('should display full date for posts older than 7 days', () => {
      const oldDate = new Date(Date.now() - 10 * 86400000).toISOString()
      const post = { ...mockPost, timestamp: oldDate }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      const timeElement = screen.getByRole('time')
      expect(timeElement).toHaveTextContent(/\d{1,2}\/\d{1,2}\/\d{4}/)
    })
  })

  describe('Edited Indicator', () => {
    it('should display edited indicator when post is edited', () => {
      const post = { ...mockPost, edited: true }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      expect(screen.getByText('edited')).toBeInTheDocument()
    })

    it('should not display edited indicator when post is not edited', () => {
      const post = { ...mockPost, edited: false }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      expect(screen.queryByText('edited')).not.toBeInTheDocument()
    })

    it('should apply italic style to edited text', () => {
      const post = { ...mockPost, edited: true }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      const editedText = screen.getByText('edited')
      expect(editedText).toHaveClass('italic')
    })
  })

  describe('Vote Score Display', () => {
    it('should display formatted score in header', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      expect(screen.getByText('42')).toBeInTheDocument()
    })

    it('should format large scores with K suffix', () => {
      const post = { ...mockPost, score: 5500 }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      expect(screen.getByText('5.5K')).toBeInTheDocument()
    })

    it('should format million scores with M suffix', () => {
      const post = { ...mockPost, score: 2500000 }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      expect(screen.getByText('2.5M')).toBeInTheDocument()
    })

    it('should apply upvote styling when userVote is upvote', () => {
      const post = { ...mockPost, userVote: 'upvote' }
      const { container } = render(<MobilePostCard post={post} {...mockHandlers} />)
      const scoreContainer = container.querySelector('.bg-orange-500\\/10')
      expect(scoreContainer).toBeInTheDocument()
      expect(scoreContainer).toHaveClass('text-orange-500')
    })

    it('should apply downvote styling when userVote is downvote', () => {
      const post = { ...mockPost, userVote: 'downvote' }
      const { container } = render(<MobilePostCard post={post} {...mockHandlers} />)
      const scoreContainer = container.querySelector('.bg-blue-500\\/10')
      expect(scoreContainer).toBeInTheDocument()
      expect(scoreContainer).toHaveClass('text-blue-500')
    })

    it('should apply neutral styling when no userVote', () => {
      const post = { ...mockPost, userVote: null }
      const { container } = render(<MobilePostCard post={post} {...mockHandlers} />)
      const scoreContainer = container.querySelector('.bg-bg-tertiary')
      expect(scoreContainer).toBeInTheDocument()
      expect(scoreContainer).toHaveClass('text-muted')
    })
  })

  describe('Flair Display', () => {
    it('should display flair when provided', () => {
      const post = { ...mockPost, flair: 'Discussion' }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      expect(screen.getByText('Discussion')).toBeInTheDocument()
    })

    it('should not display flair section when flair is null', () => {
      const post = { ...mockPost, flair: null }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      expect(screen.queryByText('Discussion')).not.toBeInTheDocument()
    })

    it('should apply badge styling to flair', () => {
      const post = { ...mockPost, flair: 'Question' }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      const flair = screen.getByText('Question')
      expect(flair).toHaveClass('badge', 'secondary', 'text-xs')
    })
  })

  describe('Media Preview', () => {
    it('should render MediaPreview when media is provided', () => {
      const post = { ...mockPost, media: { type: 'image', url: 'test.jpg' } }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      expect(screen.getByTestId('media-preview')).toBeInTheDocument()
    })

    it('should pass correct props to MediaPreview', () => {
      const media = { type: 'video', url: 'test.mp4' }
      const post = { ...mockPost, media }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      expect(MediaPreview).toHaveBeenCalledWith(
        expect.objectContaining({
          media,
          title: mockPost.title,
          compact: false
        }),
        expect.anything()
      )
    })

    it('should not render MediaPreview when media is null', () => {
      const post = { ...mockPost, media: null }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      expect(screen.queryByTestId('media-preview')).not.toBeInTheDocument()
    })
  })

  describe('Link Preview', () => {
    it('should render link preview when linkUrl is provided', () => {
      const post = { ...mockPost, linkUrl: 'https://example.com', linkTitle: 'Example' }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      expect(screen.getByRole('link', { name: /Example/ })).toBeInTheDocument()
    })

    it('should display link thumbnail when provided', () => {
      const post = {
        ...mockPost,
        linkUrl: 'https://example.com',
        linkThumbnail: 'thumb.jpg',
        linkTitle: 'Example'
      }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      const img = screen.getByRole('img', { name: '' })
      expect(img).toHaveAttribute('src', 'thumb.jpg')
    })

    it('should display link title when provided', () => {
      const post = {
        ...mockPost,
        linkUrl: 'https://example.com',
        linkTitle: 'Example Site'
      }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      expect(screen.getByText('Example Site')).toBeInTheDocument()
    })

    it('should display linkUrl as fallback when linkTitle not provided', () => {
      const post = {
        ...mockPost,
        linkUrl: 'https://example.com'
      }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      expect(screen.getByText('https://example.com')).toBeInTheDocument()
    })

    it('should display hostname of link', () => {
      const post = {
        ...mockPost,
        linkUrl: 'https://www.example.com/path',
        linkTitle: 'Example'
      }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      expect(screen.getByText('www.example.com')).toBeInTheDocument()
    })

    it('should open link in new tab with noopener noreferrer', () => {
      const post = {
        ...mockPost,
        linkUrl: 'https://example.com',
        linkTitle: 'Example'
      }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      const link = screen.getByRole('link', { name: /Example/ })
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })

  describe('Awards Display', () => {
    it('should render Awards component when awards are provided', () => {
      const post = { ...mockPost, awards: [{ type: 'gold', id: 1 }] }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      expect(screen.getByTestId('awards')).toBeInTheDocument()
    })

    it('should pass correct props to Awards component', () => {
      const awards = [{ type: 'gold', id: 1 }, { type: 'silver', id: 2 }]
      const post = { ...mockPost, awards }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      expect(Awards).toHaveBeenCalledWith(
        expect.objectContaining({
          awards,
          size: 'sm',
          maxVisible: 6
        }),
        expect.anything()
      )
    })

    it('should not render Awards when awards array is empty', () => {
      const post = { ...mockPost, awards: [] }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      expect(screen.queryByTestId('awards')).not.toBeInTheDocument()
    })

    it('should not render Awards when awards is null', () => {
      const post = { ...mockPost, awards: null }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      expect(screen.queryByTestId('awards')).not.toBeInTheDocument()
    })
  })

  describe('Vote Controls', () => {
    it('should render VoteControls component', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      expect(screen.getByTestId('vote-controls')).toBeInTheDocument()
    })

    it('should pass correct props to VoteControls', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      expect(VoteControls).toHaveBeenCalledWith(
        expect.objectContaining({
          postId: mockPost.id,
          initialScore: mockPost.score,
          userVote: mockPost.userVote,
          onVote: mockHandlers.onVote,
          size: 'sm',
          orientation: 'horizontal'
        }),
        expect.anything()
      )
    })

    it('should call onVote handler when voting', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      const upvoteButton = screen.getByText('Upvote')
      fireEvent.click(upvoteButton)
      expect(mockHandlers.onVote).toHaveBeenCalled()
    })
  })

  describe('Comment Button', () => {
    it('should render comment button with icon', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      const buttons = screen.getAllByRole('button')
      const commentButton = buttons.find(btn => btn.querySelector('svg'))
      expect(commentButton).toBeInTheDocument()
    })

    it('should display comment count', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      expect(screen.getByText('15')).toBeInTheDocument()
    })

    it('should format large comment counts with K suffix', () => {
      const post = { ...mockPost, commentCount: 3500 }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      expect(screen.getByText('3.5K')).toBeInTheDocument()
    })

    it('should display 0 when commentCount is null', () => {
      const post = { ...mockPost, commentCount: null }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('should call onComment handler when clicked', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      const commentButton = screen.getByText('15').closest('button')
      fireEvent.click(commentButton)
      expect(mockHandlers.onComment).toHaveBeenCalledWith(mockPost.id)
    })

    it('should not call onComment when handler is not provided', () => {
      const handlers = { ...mockHandlers, onComment: undefined }
      render(<MobilePostCard post={mockPost} {...handlers} />)
      const commentButton = screen.getByText('15').closest('button')
      fireEvent.click(commentButton)
      expect(mockHandlers.onComment).not.toHaveBeenCalled()
    })
  })

  describe('Share Button', () => {
    it('should render share button', () => {
      const { container } = render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      const shareButtons = container.querySelectorAll('button')
      const shareButton = Array.from(shareButtons).find(btn => {
        const svg = btn.querySelector('svg')
        return svg && svg.querySelector('path[d*="11 2.5"]')
      })
      expect(shareButton).toBeInTheDocument()
    })

    it('should call onShare handler when clicked', () => {
      const { container } = render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      const shareButtons = container.querySelectorAll('button')
      const shareButton = Array.from(shareButtons).find(btn => {
        const svg = btn.querySelector('svg')
        return svg && svg.querySelector('path[d*="11 2.5"]')
      })
      fireEvent.click(shareButton)
      expect(mockHandlers.onShare).toHaveBeenCalledWith(mockPost.id)
    })

    it('should apply hover styles to share button', () => {
      const { container } = render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      const shareButtons = container.querySelectorAll('button')
      const shareButton = Array.from(shareButtons).find(btn => {
        const svg = btn.querySelector('svg')
        return svg && svg.querySelector('path[d*="11 2.5"]')
      })
      expect(shareButton).toHaveClass('hover:text-primary')
    })
  })

  describe('Save Button', () => {
    it('should render save button', () => {
      const { container } = render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      const saveButtons = container.querySelectorAll('button')
      const saveButton = Array.from(saveButtons).find(btn => {
        const svg = btn.querySelector('svg')
        return svg && svg.querySelector('path[d*="M2 2a2 2 0 012-2h8"]')
      })
      expect(saveButton).toBeInTheDocument()
    })

    it('should call onSave with true when post is not saved', () => {
      const post = { ...mockPost, isSaved: false }
      const { container } = render(<MobilePostCard post={post} {...mockHandlers} />)
      const saveButtons = container.querySelectorAll('button')
      const saveButton = Array.from(saveButtons).find(btn => {
        const svg = btn.querySelector('svg')
        return svg && svg.querySelector('path[d*="M2 2a2 2 0 012-2h8"]')
      })
      fireEvent.click(saveButton)
      expect(mockHandlers.onSave).toHaveBeenCalledWith(mockPost.id, true)
    })

    it('should call onSave with false when post is saved', () => {
      const post = { ...mockPost, isSaved: true }
      const { container } = render(<MobilePostCard post={post} {...mockHandlers} />)
      const saveButtons = container.querySelectorAll('button')
      const saveButton = Array.from(saveButtons).find(btn => {
        const svg = btn.querySelector('svg')
        return svg && svg.querySelector('path[d*="M2 2a2 2 0 012-2h8"]')
      })
      fireEvent.click(saveButton)
      expect(mockHandlers.onSave).toHaveBeenCalledWith(mockPost.id, false)
    })

    it('should apply accent color when post is saved', () => {
      const post = { ...mockPost, isSaved: true }
      const { container } = render(<MobilePostCard post={post} {...mockHandlers} />)
      const saveButtons = container.querySelectorAll('button')
      const saveButton = Array.from(saveButtons).find(btn => {
        const svg = btn.querySelector('svg')
        return svg && svg.querySelector('path[d*="M2 2a2 2 0 012-2h8"]')
      })
      expect(saveButton).toHaveClass('text-accent')
    })

    it('should apply muted color when post is not saved', () => {
      const post = { ...mockPost, isSaved: false }
      const { container } = render(<MobilePostCard post={post} {...mockHandlers} />)
      const saveButtons = container.querySelectorAll('button')
      const saveButton = Array.from(saveButtons).find(btn => {
        const svg = btn.querySelector('svg')
        return svg && svg.querySelector('path[d*="M2 2a2 2 0 012-2h8"]')
      })
      expect(saveButton).toHaveClass('text-muted')
    })

    it('should fill icon when post is saved', () => {
      const post = { ...mockPost, isSaved: true }
      const { container } = render(<MobilePostCard post={post} {...mockHandlers} />)
      const saveButtons = container.querySelectorAll('button')
      const saveButton = Array.from(saveButtons).find(btn => {
        const svg = btn.querySelector('svg')
        return svg && svg.querySelector('path[d*="M2 2a2 2 0 012-2h8"]')
      })
      const svg = saveButton.querySelector('svg')
      expect(svg).toHaveAttribute('fill', 'currentColor')
    })

    it('should not fill icon when post is not saved', () => {
      const post = { ...mockPost, isSaved: false }
      const { container } = render(<MobilePostCard post={post} {...mockHandlers} />)
      const saveButtons = container.querySelectorAll('button')
      const saveButton = Array.from(saveButtons).find(btn => {
        const svg = btn.querySelector('svg')
        return svg && svg.querySelector('path[d*="M2 2a2 2 0 012-2h8"]')
      })
      const svg = saveButton.querySelector('svg')
      expect(svg).toHaveAttribute('fill', 'none')
    })
  })

  describe('Touch Interactions', () => {
    it('should handle touch start event', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      const article = screen.getByRole('article')
      fireEvent.touchStart(article, {
        targetTouches: [{ clientX: 100 }]
      })
      expect(article).toHaveStyle({ transform: 'translateX(0px)' })
    })

    it('should handle touch move to the right', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      const article = screen.getByRole('article')

      fireEvent.touchStart(article, {
        targetTouches: [{ clientX: 100 }]
      })

      fireEvent.touchMove(article, {
        targetTouches: [{ clientX: 150 }]
      })

      expect(article).toHaveStyle({ transform: 'translateX(50px)' })
    })

    it('should handle touch move to the left', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      const article = screen.getByRole('article')

      fireEvent.touchStart(article, {
        targetTouches: [{ clientX: 100 }]
      })

      fireEvent.touchMove(article, {
        targetTouches: [{ clientX: 50 }]
      })

      expect(article).toHaveStyle({ transform: 'translateX(-50px)' })
    })

    it('should limit swipe distance to 100px to right', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      const article = screen.getByRole('article')

      fireEvent.touchStart(article, {
        targetTouches: [{ clientX: 100 }]
      })

      fireEvent.touchMove(article, {
        targetTouches: [{ clientX: 300 }]
      })

      expect(article).toHaveStyle({ transform: 'translateX(100px)' })
    })

    it('should limit swipe distance to -100px to left', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      const article = screen.getByRole('article')

      fireEvent.touchStart(article, {
        targetTouches: [{ clientX: 100 }]
      })

      fireEvent.touchMove(article, {
        targetTouches: [{ clientX: -100 }]
      })

      expect(article).toHaveStyle({ transform: 'translateX(-100px)' })
    })

    it('should not update offset if touchStart was not set', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      const article = screen.getByRole('article')

      fireEvent.touchMove(article, {
        targetTouches: [{ clientX: 150 }]
      })

      expect(article).toHaveStyle({ transform: 'translateX(0px)' })
    })
  })

  describe('Swipe Gestures', () => {
    it('should call onSwipeLeft when swiping left past threshold', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      const article = screen.getByRole('article')

      fireEvent.touchStart(article, {
        targetTouches: [{ clientX: 200 }]
      })

      fireEvent.touchMove(article, {
        targetTouches: [{ clientX: 140 }]
      })

      fireEvent.touchEnd(article)

      expect(mockHandlers.onSwipeLeft).toHaveBeenCalledWith(mockPost.id)
    })

    it('should call onSwipeRight when swiping right past threshold', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      const article = screen.getByRole('article')

      fireEvent.touchStart(article, {
        targetTouches: [{ clientX: 100 }]
      })

      fireEvent.touchMove(article, {
        targetTouches: [{ clientX: 160 }]
      })

      fireEvent.touchEnd(article)

      expect(mockHandlers.onSwipeRight).toHaveBeenCalledWith(mockPost.id)
    })

    it('should not call swipe handlers when swipe is below threshold', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      const article = screen.getByRole('article')

      fireEvent.touchStart(article, {
        targetTouches: [{ clientX: 100 }]
      })

      fireEvent.touchMove(article, {
        targetTouches: [{ clientX: 120 }]
      })

      fireEvent.touchEnd(article)

      expect(mockHandlers.onSwipeLeft).not.toHaveBeenCalled()
      expect(mockHandlers.onSwipeRight).not.toHaveBeenCalled()
    })

    it('should reset offset after swipe ends', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      const article = screen.getByRole('article')

      fireEvent.touchStart(article, {
        targetTouches: [{ clientX: 100 }]
      })

      fireEvent.touchMove(article, {
        targetTouches: [{ clientX: 160 }]
      })

      fireEvent.touchEnd(article)

      expect(article).toHaveStyle({ transform: 'translateX(0px)' })
    })

    it('should not trigger swipe if touchEnd not set', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      const article = screen.getByRole('article')

      fireEvent.touchStart(article, {
        targetTouches: [{ clientX: 100 }]
      })

      fireEvent.touchEnd(article)

      expect(mockHandlers.onSwipeLeft).not.toHaveBeenCalled()
      expect(mockHandlers.onSwipeRight).not.toHaveBeenCalled()
    })

    it('should handle swipe when handler is undefined', () => {
      const handlers = { ...mockHandlers, onSwipeLeft: undefined }
      render(<MobilePostCard post={mockPost} {...handlers} />)
      const article = screen.getByRole('article')

      fireEvent.touchStart(article, {
        targetTouches: [{ clientX: 200 }]
      })

      fireEvent.touchMove(article, {
        targetTouches: [{ clientX: 140 }]
      })

      expect(() => fireEvent.touchEnd(article)).not.toThrow()
    })
  })

  describe('Swipe Action Indicators', () => {
    it('should show left swipe save indicator when swiping left', () => {
      const { container } = render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      const article = screen.getByRole('article')

      fireEvent.touchStart(article, {
        targetTouches: [{ clientX: 100 }]
      })

      fireEvent.touchMove(article, {
        targetTouches: [{ clientX: 50 }]
      })

      const indicator = container.querySelector('.bg-accent\\/20')
      expect(indicator).toBeInTheDocument()
    })

    it('should show right swipe upvote indicator when swiping right', () => {
      const { container } = render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      const article = screen.getByRole('article')

      fireEvent.touchStart(article, {
        targetTouches: [{ clientX: 100 }]
      })

      fireEvent.touchMove(article, {
        targetTouches: [{ clientX: 150 }]
      })

      const indicator = container.querySelector('.bg-orange-500\\/20')
      expect(indicator).toBeInTheDocument()
    })

    it('should not show indicators when swipe offset is 0', () => {
      const { container } = render(<MobilePostCard post={mockPost} {...mockHandlers} />)

      const leftIndicator = container.querySelector('.bg-accent\\/20')
      const rightIndicator = container.querySelector('.bg-orange-500\\/20')

      expect(leftIndicator).not.toBeInTheDocument()
      expect(rightIndicator).not.toBeInTheDocument()
    })

    it('should position left indicator on the right side', () => {
      const { container } = render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      const article = screen.getByRole('article')

      fireEvent.touchStart(article, {
        targetTouches: [{ clientX: 100 }]
      })

      fireEvent.touchMove(article, {
        targetTouches: [{ clientX: 50 }]
      })

      const indicator = container.querySelector('.bg-accent\\/20')
      expect(indicator).toHaveClass('right-0')
    })

    it('should position right indicator on the left side', () => {
      const { container } = render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      const article = screen.getByRole('article')

      fireEvent.touchStart(article, {
        targetTouches: [{ clientX: 100 }]
      })

      fireEvent.touchMove(article, {
        targetTouches: [{ clientX: 150 }]
      })

      const indicator = container.querySelector('.bg-orange-500\\/20')
      expect(indicator).toHaveClass('left-0')
    })
  })

  describe('Score Formatting', () => {
    it('should format scores under 1000 as plain numbers', () => {
      const post = { ...mockPost, score: 999 }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      expect(screen.getByText('999')).toBeInTheDocument()
    })

    it('should format 1000 with K suffix', () => {
      const post = { ...mockPost, score: 1000 }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      expect(screen.getByText('1.0K')).toBeInTheDocument()
    })

    it('should format 1000000 with M suffix', () => {
      const post = { ...mockPost, score: 1000000 }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      expect(screen.getByText('1.0M')).toBeInTheDocument()
    })

    it('should format negative scores correctly', () => {
      const post = { ...mockPost, score: -5000 }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      expect(screen.getByText('-5.0K')).toBeInTheDocument()
    })

    it('should round to 1 decimal place', () => {
      const post = { ...mockPost, score: 1234 }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      expect(screen.getByText('1.2K')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle post with all optional fields missing', () => {
      const minimalPost = {
        id: 'post-1',
        title: 'Title',
        author: 'user',
        community: 'comm',
        timestamp: new Date().toISOString(),
        score: 0
      }
      render(<MobilePostCard post={minimalPost} {...mockHandlers} />)
      expect(screen.getByText('Title')).toBeInTheDocument()
    })

    it('should handle very long author names', () => {
      const post = { ...mockPost, author: 'a'.repeat(100) }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      expect(screen.getByText(`u/${'a'.repeat(100)}`)).toBeInTheDocument()
    })

    it('should handle very long community names', () => {
      const post = { ...mockPost, community: 'c'.repeat(100) }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      expect(screen.getByText(`c/${'c'.repeat(100)}`)).toBeInTheDocument()
    })

    it('should handle zero score', () => {
      const post = { ...mockPost, score: 0 }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('should handle zero comments', () => {
      const post = { ...mockPost, commentCount: 0 }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('should handle missing optional handlers gracefully', () => {
      render(<MobilePostCard post={mockPost} />)
      expect(screen.getByRole('article')).toBeInTheDocument()
    })

    it('should handle empty className prop', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} className="" />)
      expect(screen.getByRole('article')).toHaveClass('mobile-post-card')
    })

    it('should handle content with only HTML tags', () => {
      const post = { ...mockPost, content: '<div></div>' }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      expect(screen.getByText('')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should use semantic article element', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      expect(screen.getByRole('article')).toBeInTheDocument()
    })

    it('should use semantic time element for timestamp', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      expect(screen.getByRole('time')).toBeInTheDocument()
    })

    it('should use semantic heading for title', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      expect(screen.getByRole('heading', { name: mockPost.title })).toBeInTheDocument()
    })

    it('should provide href for author link', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      const authorLink = screen.getByRole('link', { name: `u/${mockPost.author}` })
      expect(authorLink).toHaveAttribute('href')
    })

    it('should provide href for community link', () => {
      render(<MobilePostCard post={mockPost} {...mockHandlers} showCommunity={true} />)
      const communityLink = screen.getByRole('link', { name: `c/${mockPost.community}` })
      expect(communityLink).toHaveAttribute('href')
    })

    it('should have proper alt text for link thumbnail', () => {
      const post = {
        ...mockPost,
        linkUrl: 'https://example.com',
        linkThumbnail: 'thumb.jpg'
      }
      render(<MobilePostCard post={post} {...mockHandlers} />)
      const img = screen.getByRole('img', { name: '' })
      expect(img).toHaveAttribute('alt', '')
    })
  })

  describe('Action Button States', () => {
    it('should render all action buttons', () => {
      const { container } = render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      const buttons = container.querySelectorAll('button')
      expect(buttons.length).toBeGreaterThan(2)
    })

    it('should apply transition classes to action buttons', () => {
      const { container } = render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      const commentButton = screen.getByText('15').closest('button')
      expect(commentButton).toHaveClass('transition-colors')
    })

    it('should apply muted color to action buttons by default', () => {
      const { container } = render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      const commentButton = screen.getByText('15').closest('button')
      expect(commentButton).toHaveClass('text-muted')
    })

    it('should apply hover styles to action buttons', () => {
      const { container } = render(<MobilePostCard post={mockPost} {...mockHandlers} />)
      const commentButton = screen.getByText('15').closest('button')
      expect(commentButton).toHaveClass('hover:text-primary')
    })
  })
})

export default mockPost
