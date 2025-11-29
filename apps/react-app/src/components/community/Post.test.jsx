import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Post from './Post'
import VoteControls from './VoteControls'
import PostActions from './PostActions'
import Awards from './Awards'
import MediaPreview from './MediaPreview'

// Mock dependencies
jest.mock('./VoteControls', () => jest.fn(() => <div data-testid="vote-controls">VoteControls</div>))
jest.mock('./PostActions', () => jest.fn(() => <div data-testid="post-actions">PostActions</div>))
jest.mock('./Awards', () => jest.fn(() => <div data-testid="awards">Awards</div>))
jest.mock('./MediaPreview', () => jest.fn(() => <div data-testid="media-preview">MediaPreview</div>))
jest.mock('dompurify', () => ({
  sanitize: jest.fn((content) => content)
}))

// Mock window.location
delete window.location
window.location = { href: '', origin: 'http://localhost' }

describe('Post Component', () => {
  let mockPost
  let mockHandlers

  beforeEach(() => {
    jest.clearAllMocks()

    // Reset window.location
    window.location.href = ''

    mockPost = {
      id: 'post-123',
      title: 'Test Post Title',
      content: 'This is test content',
      author: 'testuser',
      community: 'testcommunity',
      timestamp: new Date('2024-01-01T12:00:00').toISOString(),
      score: 42,
      userVote: null,
      commentCount: 10,
      edited: false,
      isSaved: false
    }

    mockHandlers = {
      onVote: jest.fn(),
      onComment: jest.fn(),
      onShare: jest.fn(),
      onSave: jest.fn(),
      onReport: jest.fn(),
      onAward: jest.fn()
    }
  })

  describe('Basic Rendering', () => {
    it('should render post article with correct role', () => {
      render(<Post post={mockPost} {...mockHandlers} />)
      const article = screen.getByRole('article')
      expect(article).toBeInTheDocument()
    })

    it('should render post title', () => {
      render(<Post post={mockPost} {...mockHandlers} />)
      expect(screen.getByText('Test Post Title')).toBeInTheDocument()
    })

    it('should render post content', () => {
      render(<Post post={mockPost} {...mockHandlers} />)
      expect(screen.getByText('This is test content')).toBeInTheDocument()
    })

    it('should have correct aria-labelledby attribute', () => {
      render(<Post post={mockPost} {...mockHandlers} />)
      const article = screen.getByRole('article')
      expect(article).toHaveAttribute('aria-labelledby', 'post-post-123-title')
    })

    it('should render with custom className', () => {
      render(<Post post={mockPost} {...mockHandlers} className="custom-class" />)
      const article = screen.getByRole('article')
      expect(article).toHaveClass('custom-class')
    })

    it('should apply compact styling when compact prop is true', () => {
      const { container } = render(<Post post={mockPost} {...mockHandlers} compact={true} />)
      const article = container.querySelector('article')
      expect(article).toHaveClass('p-md')
    })

    it('should apply non-compact styling by default', () => {
      const { container } = render(<Post post={mockPost} {...mockHandlers} />)
      const article = container.querySelector('article')
      expect(article).toHaveClass('p-lg')
    })
  })

  describe('Author Information', () => {
    it('should render author username with link', () => {
      render(<Post post={mockPost} {...mockHandlers} />)
      const authorLink = screen.getByText('u/testuser')
      expect(authorLink).toBeInTheDocument()
      expect(authorLink.closest('a')).toHaveAttribute('href', '/u/testuser')
    })

    it('should render "by" text before author', () => {
      render(<Post post={mockPost} {...mockHandlers} />)
      expect(screen.getByText('by')).toBeInTheDocument()
    })

    it('should stop propagation when clicking author link', () => {
      render(<Post post={mockPost} {...mockHandlers} />)
      const authorLink = screen.getByText('u/testuser').closest('a')
      const event = new MouseEvent('click', { bubbles: true })
      const stopPropagation = jest.spyOn(event, 'stopPropagation')
      fireEvent(authorLink, event)
      expect(stopPropagation).toHaveBeenCalled()
    })
  })

  describe('Community Information', () => {
    it('should render community name when showCommunity is true', () => {
      render(<Post post={mockPost} {...mockHandlers} showCommunity={true} />)
      expect(screen.getByText('c/testcommunity')).toBeInTheDocument()
    })

    it('should not render community name when showCommunity is false', () => {
      render(<Post post={mockPost} {...mockHandlers} showCommunity={false} />)
      expect(screen.queryByText('c/testcommunity')).not.toBeInTheDocument()
    })

    it('should render community link with correct href', () => {
      render(<Post post={mockPost} {...mockHandlers} showCommunity={true} />)
      const communityLink = screen.getByText('c/testcommunity')
      expect(communityLink.closest('a')).toHaveAttribute('href', '/c/testcommunity')
    })

    it('should stop propagation when clicking community link', () => {
      render(<Post post={mockPost} {...mockHandlers} showCommunity={true} />)
      const communityLink = screen.getByText('c/testcommunity').closest('a')
      const event = new MouseEvent('click', { bubbles: true })
      const stopPropagation = jest.spyOn(event, 'stopPropagation')
      fireEvent(communityLink, event)
      expect(stopPropagation).toHaveBeenCalled()
    })
  })

  describe('Timestamp Formatting', () => {
    it('should render timestamp', () => {
      render(<Post post={mockPost} {...mockHandlers} />)
      const timeElement = screen.getByText(/ago|now/)
      expect(timeElement).toBeInTheDocument()
    })

    it('should format timestamp as "now" for very recent posts', () => {
      const recentPost = { ...mockPost, timestamp: new Date(Date.now() - 30000).toISOString() }
      render(<Post post={recentPost} {...mockHandlers} />)
      expect(screen.getByText('now')).toBeInTheDocument()
    })

    it('should format timestamp in minutes for posts under 1 hour old', () => {
      const recentPost = { ...mockPost, timestamp: new Date(Date.now() - 1800000).toISOString() }
      render(<Post post={recentPost} {...mockHandlers} />)
      expect(screen.getByText(/\d+m ago/)).toBeInTheDocument()
    })

    it('should format timestamp in hours for posts under 24 hours old', () => {
      const recentPost = { ...mockPost, timestamp: new Date(Date.now() - 7200000).toISOString() }
      render(<Post post={recentPost} {...mockHandlers} />)
      expect(screen.getByText(/\d+h ago/)).toBeInTheDocument()
    })

    it('should format timestamp in days for posts under 30 days old', () => {
      const recentPost = { ...mockPost, timestamp: new Date(Date.now() - 172800000).toISOString() }
      render(<Post post={recentPost} {...mockHandlers} />)
      expect(screen.getByText(/\d+d ago/)).toBeInTheDocument()
    })

    it('should render dateTime attribute on time element', () => {
      render(<Post post={mockPost} {...mockHandlers} />)
      const timeElement = screen.getByText(/ago|now/).closest('time')
      expect(timeElement).toHaveAttribute('dateTime', mockPost.timestamp)
    })
  })

  describe('Edited Status', () => {
    it('should show "edited" indicator when post is edited', () => {
      const editedPost = { ...mockPost, edited: true }
      render(<Post post={editedPost} {...mockHandlers} />)
      expect(screen.getByText('edited')).toBeInTheDocument()
    })

    it('should not show "edited" indicator when post is not edited', () => {
      render(<Post post={mockPost} {...mockHandlers} />)
      expect(screen.queryByText('edited')).not.toBeInTheDocument()
    })
  })

  describe('Post Title', () => {
    it('should render title with correct ID', () => {
      render(<Post post={mockPost} {...mockHandlers} />)
      const title = screen.getByText('Test Post Title')
      expect(title).toHaveAttribute('id', 'post-post-123-title')
    })

    it('should apply compact text size in compact mode', () => {
      render(<Post post={mockPost} {...mockHandlers} compact={true} />)
      const title = screen.getByText('Test Post Title')
      expect(title).toHaveClass('text-sm')
    })

    it('should navigate to post detail on title click', () => {
      render(<Post post={mockPost} {...mockHandlers} />)
      const title = screen.getByText('Test Post Title')
      fireEvent.click(title)
      expect(window.location.href).toBe('/c/testcommunity/posts/post-123')
    })
  })

  describe('Post Flair', () => {
    it('should render flair when present', () => {
      const postWithFlair = { ...mockPost, flair: 'Discussion' }
      render(<Post post={postWithFlair} {...mockHandlers} />)
      expect(screen.getByText('Discussion')).toBeInTheDocument()
    })

    it('should not render flair when not present', () => {
      render(<Post post={mockPost} {...mockHandlers} />)
      expect(screen.queryByText('Discussion')).not.toBeInTheDocument()
    })
  })

  describe('Post Content', () => {
    it('should render content with dangerouslySetInnerHTML', () => {
      const { container } = render(<Post post={mockPost} {...mockHandlers} />)
      const contentDiv = container.querySelector('[dangerouslySetInnerHTML]')
      expect(contentDiv).toBeInTheDocument()
    })

    it('should not render content section when content is null', () => {
      const postWithoutContent = { ...mockPost, content: null }
      const { container } = render(<Post post={postWithoutContent} {...mockHandlers} />)
      const contentDiv = container.querySelector('[dangerouslySetInnerHTML]')
      expect(contentDiv).not.toBeInTheDocument()
    })

    it('should not render content section when content is empty', () => {
      const postWithoutContent = { ...mockPost, content: '' }
      const { container } = render(<Post post={postWithoutContent} {...mockHandlers} />)
      const contentDiv = container.querySelector('[dangerouslySetInnerHTML]')
      expect(contentDiv).not.toBeInTheDocument()
    })
  })

  describe('Long Content Expansion', () => {
    const longContent = 'a'.repeat(600)

    it('should show "Show more" button for content longer than 500 characters', () => {
      const longPost = { ...mockPost, content: longContent }
      render(<Post post={longPost} {...mockHandlers} />)
      expect(screen.getByText('Show more')).toBeInTheDocument()
    })

    it('should not show expand button for short content', () => {
      render(<Post post={mockPost} {...mockHandlers} />)
      expect(screen.queryByText('Show more')).not.toBeInTheDocument()
    })

    it('should truncate long content initially', () => {
      const longPost = { ...mockPost, content: longContent }
      const { container } = render(<Post post={longPost} {...mockHandlers} />)
      const contentDiv = container.querySelector('[dangerouslySetInnerHTML]')
      expect(contentDiv.innerHTML).toContain('...')
    })

    it('should expand content when clicking "Show more"', () => {
      const longPost = { ...mockPost, content: longContent }
      render(<Post post={longPost} {...mockHandlers} />)
      const expandButton = screen.getByText('Show more')
      fireEvent.click(expandButton)
      expect(screen.getByText('Show less')).toBeInTheDocument()
    })

    it('should collapse content when clicking "Show less"', () => {
      const longPost = { ...mockPost, content: longContent }
      render(<Post post={longPost} {...mockHandlers} />)
      const expandButton = screen.getByText('Show more')
      fireEvent.click(expandButton)
      const collapseButton = screen.getByText('Show less')
      fireEvent.click(collapseButton)
      expect(screen.getByText('Show more')).toBeInTheDocument()
    })

    it('should stop propagation when clicking expand button', () => {
      const longPost = { ...mockPost, content: longContent }
      render(<Post post={longPost} {...mockHandlers} />)
      const expandButton = screen.getByText('Show more')
      const event = new MouseEvent('click', { bubbles: true })
      const stopPropagation = jest.spyOn(event, 'stopPropagation')
      fireEvent(expandButton, event)
      expect(stopPropagation).toHaveBeenCalled()
    })

    it('should update content height when expanding', () => {
      const longPost = { ...mockPost, content: longContent }
      const { container } = render(<Post post={longPost} {...mockHandlers} />)
      const expandButton = screen.getByText('Show more')
      fireEvent.click(expandButton)
      const contentDiv = container.querySelector('[dangerouslySetInnerHTML]')
      expect(contentDiv).toHaveStyle({ maxHeight: 'auto' })
    })

    it('should update content height when collapsing', async () => {
      const longPost = { ...mockPost, content: longContent }
      const { container } = render(<Post post={longPost} {...mockHandlers} />)
      const expandButton = screen.getByText('Show more')
      fireEvent.click(expandButton)
      const collapseButton = screen.getByText('Show less')
      fireEvent.click(collapseButton)
      await waitFor(() => {
        const contentDiv = container.querySelector('[dangerouslySetInnerHTML]')
        expect(contentDiv).toHaveStyle({ maxHeight: '120px' })
      })
    })
  })

  describe('VoteControls Integration', () => {
    it('should render VoteControls component', () => {
      render(<Post post={mockPost} {...mockHandlers} />)
      expect(screen.getByTestId('vote-controls')).toBeInTheDocument()
    })

    it('should pass postId to VoteControls', () => {
      render(<Post post={mockPost} {...mockHandlers} />)
      expect(VoteControls).toHaveBeenCalledWith(
        expect.objectContaining({ postId: 'post-123' }),
        expect.anything()
      )
    })

    it('should pass initialScore to VoteControls', () => {
      render(<Post post={mockPost} {...mockHandlers} />)
      expect(VoteControls).toHaveBeenCalledWith(
        expect.objectContaining({ initialScore: 42 }),
        expect.anything()
      )
    })

    it('should pass userVote to VoteControls', () => {
      render(<Post post={mockPost} {...mockHandlers} />)
      expect(VoteControls).toHaveBeenCalledWith(
        expect.objectContaining({ userVote: null }),
        expect.anything()
      )
    })

    it('should pass onVote handler to VoteControls', () => {
      render(<Post post={mockPost} {...mockHandlers} />)
      expect(VoteControls).toHaveBeenCalledWith(
        expect.objectContaining({ onVote: mockHandlers.onVote }),
        expect.anything()
      )
    })

    it('should pass vertical orientation to VoteControls', () => {
      render(<Post post={mockPost} {...mockHandlers} />)
      expect(VoteControls).toHaveBeenCalledWith(
        expect.objectContaining({ orientation: 'vertical' }),
        expect.anything()
      )
    })

    it('should pass small size to VoteControls in compact mode', () => {
      render(<Post post={mockPost} {...mockHandlers} compact={true} />)
      expect(VoteControls).toHaveBeenCalledWith(
        expect.objectContaining({ size: 'sm' }),
        expect.anything()
      )
    })

    it('should pass medium size to VoteControls in normal mode', () => {
      render(<Post post={mockPost} {...mockHandlers} />)
      expect(VoteControls).toHaveBeenCalledWith(
        expect.objectContaining({ size: 'md' }),
        expect.anything()
      )
    })
  })

  describe('PostActions Integration', () => {
    it('should render PostActions component', () => {
      render(<Post post={mockPost} {...mockHandlers} />)
      expect(screen.getByTestId('post-actions')).toBeInTheDocument()
    })

    it('should pass post to PostActions', () => {
      render(<Post post={mockPost} {...mockHandlers} />)
      expect(PostActions).toHaveBeenCalledWith(
        expect.objectContaining({ post: mockPost }),
        expect.anything()
      )
    })

    it('should pass onComment handler to PostActions', () => {
      render(<Post post={mockPost} {...mockHandlers} />)
      expect(PostActions).toHaveBeenCalledWith(
        expect.objectContaining({ onComment: mockHandlers.onComment }),
        expect.anything()
      )
    })

    it('should pass onShare handler to PostActions', () => {
      render(<Post post={mockPost} {...mockHandlers} />)
      expect(PostActions).toHaveBeenCalledWith(
        expect.objectContaining({ onShare: mockHandlers.onShare }),
        expect.anything()
      )
    })

    it('should pass onSave handler to PostActions', () => {
      render(<Post post={mockPost} {...mockHandlers} />)
      expect(PostActions).toHaveBeenCalledWith(
        expect.objectContaining({ onSave: mockHandlers.onSave }),
        expect.anything()
      )
    })

    it('should pass onReport handler to PostActions', () => {
      render(<Post post={mockPost} {...mockHandlers} />)
      expect(PostActions).toHaveBeenCalledWith(
        expect.objectContaining({ onReport: mockHandlers.onReport }),
        expect.anything()
      )
    })

    it('should pass onAward handler to PostActions', () => {
      render(<Post post={mockPost} {...mockHandlers} />)
      expect(PostActions).toHaveBeenCalledWith(
        expect.objectContaining({ onAward: mockHandlers.onAward }),
        expect.anything()
      )
    })

    it('should pass compact prop to PostActions', () => {
      render(<Post post={mockPost} {...mockHandlers} compact={true} />)
      expect(PostActions).toHaveBeenCalledWith(
        expect.objectContaining({ compact: true }),
        expect.anything()
      )
    })
  })

  describe('Awards Display', () => {
    it('should render Awards component when awards exist', () => {
      const postWithAwards = {
        ...mockPost,
        awards: [{ type: 'gold', name: 'Gold' }]
      }
      render(<Post post={postWithAwards} {...mockHandlers} />)
      expect(screen.getByTestId('awards')).toBeInTheDocument()
    })

    it('should not render Awards when awards array is empty', () => {
      const postWithNoAwards = { ...mockPost, awards: [] }
      render(<Post post={postWithNoAwards} {...mockHandlers} />)
      expect(screen.queryByTestId('awards')).not.toBeInTheDocument()
    })

    it('should not render Awards when awards is null', () => {
      render(<Post post={mockPost} {...mockHandlers} />)
      expect(screen.queryByTestId('awards')).not.toBeInTheDocument()
    })

    it('should pass awards to Awards component', () => {
      const awards = [{ type: 'gold', name: 'Gold' }]
      const postWithAwards = { ...mockPost, awards }
      render(<Post post={postWithAwards} {...mockHandlers} />)
      expect(Awards).toHaveBeenCalledWith(
        expect.objectContaining({ awards }),
        expect.anything()
      )
    })

    it('should pass small size to Awards in compact mode', () => {
      const postWithAwards = {
        ...mockPost,
        awards: [{ type: 'gold', name: 'Gold' }]
      }
      render(<Post post={postWithAwards} {...mockHandlers} compact={true} />)
      expect(Awards).toHaveBeenCalledWith(
        expect.objectContaining({ size: 'sm' }),
        expect.anything()
      )
    })

    it('should pass medium size to Awards in normal mode', () => {
      const postWithAwards = {
        ...mockPost,
        awards: [{ type: 'gold', name: 'Gold' }]
      }
      render(<Post post={postWithAwards} {...mockHandlers} />)
      expect(Awards).toHaveBeenCalledWith(
        expect.objectContaining({ size: 'md' }),
        expect.anything()
      )
    })
  })

  describe('Media Display', () => {
    it('should render MediaPreview when media exists in normal mode', () => {
      const postWithMedia = {
        ...mockPost,
        media: { type: 'image', url: 'test.jpg' }
      }
      render(<Post post={postWithMedia} {...mockHandlers} />)
      expect(screen.getByTestId('media-preview')).toBeInTheDocument()
    })

    it('should not render MediaPreview when media is null', () => {
      render(<Post post={mockPost} {...mockHandlers} />)
      expect(screen.queryByTestId('media-preview')).not.toBeInTheDocument()
    })

    it('should render MediaPreview in compact section when compact mode', () => {
      const postWithMedia = {
        ...mockPost,
        media: { type: 'image', url: 'test.jpg' }
      }
      render(<Post post={postWithMedia} {...mockHandlers} compact={true} />)
      expect(screen.getByTestId('media-preview')).toBeInTheDocument()
    })

    it('should pass media to MediaPreview component', () => {
      const media = { type: 'image', url: 'test.jpg' }
      const postWithMedia = { ...mockPost, media }
      render(<Post post={postWithMedia} {...mockHandlers} />)
      expect(MediaPreview).toHaveBeenCalledWith(
        expect.objectContaining({ media }),
        expect.anything()
      )
    })

    it('should pass title to MediaPreview', () => {
      const postWithMedia = {
        ...mockPost,
        media: { type: 'image', url: 'test.jpg' }
      }
      render(<Post post={postWithMedia} {...mockHandlers} />)
      expect(MediaPreview).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Test Post Title' }),
        expect.anything()
      )
    })

    it('should pass compact prop to MediaPreview in compact mode', () => {
      const postWithMedia = {
        ...mockPost,
        media: { type: 'image', url: 'test.jpg' }
      }
      render(<Post post={postWithMedia} {...mockHandlers} compact={true} />)
      expect(MediaPreview).toHaveBeenCalledWith(
        expect.objectContaining({ compact: true }),
        expect.anything()
      )
    })

    it('should not render MediaPreview in main section when compact mode', () => {
      const postWithMedia = {
        ...mockPost,
        media: { type: 'image', url: 'test.jpg' }
      }
      const { container } = render(<Post post={postWithMedia} {...mockHandlers} compact={true} />)
      const mediaPreview = screen.getByTestId('media-preview')
      const compactSection = mediaPreview.closest('.mt-md')
      expect(compactSection).toBeInTheDocument()
    })
  })

  describe('Link Preview', () => {
    it('should render link preview when linkUrl exists', () => {
      const postWithLink = {
        ...mockPost,
        linkUrl: 'https://example.com',
        linkTitle: 'Example Site'
      }
      render(<Post post={postWithLink} {...mockHandlers} />)
      expect(screen.getByText('Example Site')).toBeInTheDocument()
    })

    it('should not render link preview when linkUrl is null', () => {
      render(<Post post={mockPost} {...mockHandlers} />)
      const links = screen.queryAllByRole('link')
      const externalLink = links.find(link => link.target === '_blank')
      expect(externalLink).toBeUndefined()
    })

    it('should not render link preview in compact mode', () => {
      const postWithLink = {
        ...mockPost,
        linkUrl: 'https://example.com',
        linkTitle: 'Example Site'
      }
      render(<Post post={postWithLink} {...mockHandlers} compact={true} />)
      expect(screen.queryByText('Example Site')).not.toBeInTheDocument()
    })

    it('should render link with correct href', () => {
      const postWithLink = {
        ...mockPost,
        linkUrl: 'https://example.com',
        linkTitle: 'Example Site'
      }
      render(<Post post={postWithLink} {...mockHandlers} />)
      const link = screen.getByText('Example Site').closest('a')
      expect(link).toHaveAttribute('href', 'https://example.com')
    })

    it('should open link in new tab with security attributes', () => {
      const postWithLink = {
        ...mockPost,
        linkUrl: 'https://example.com',
        linkTitle: 'Example Site'
      }
      render(<Post post={postWithLink} {...mockHandlers} />)
      const link = screen.getByText('Example Site').closest('a')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('should render link thumbnail when provided', () => {
      const postWithLink = {
        ...mockPost,
        linkUrl: 'https://example.com',
        linkTitle: 'Example Site',
        linkThumbnail: 'https://example.com/thumb.jpg'
      }
      render(<Post post={postWithLink} {...mockHandlers} />)
      const thumbnail = screen.getByAltText('')
      expect(thumbnail).toHaveAttribute('src', 'https://example.com/thumb.jpg')
    })

    it('should render link description when provided', () => {
      const postWithLink = {
        ...mockPost,
        linkUrl: 'https://example.com',
        linkTitle: 'Example Site',
        linkDescription: 'This is a test description'
      }
      render(<Post post={postWithLink} {...mockHandlers} />)
      expect(screen.getByText('This is a test description')).toBeInTheDocument()
    })

    it('should display link hostname', () => {
      const postWithLink = {
        ...mockPost,
        linkUrl: 'https://example.com/page',
        linkTitle: 'Example Site'
      }
      render(<Post post={postWithLink} {...mockHandlers} />)
      expect(screen.getByText('example.com')).toBeInTheDocument()
    })

    it('should use linkUrl as title when linkTitle is not provided', () => {
      const postWithLink = {
        ...mockPost,
        linkUrl: 'https://example.com'
      }
      render(<Post post={postWithLink} {...mockHandlers} />)
      expect(screen.getByText('https://example.com')).toBeInTheDocument()
    })

    it('should stop propagation when clicking link', () => {
      const postWithLink = {
        ...mockPost,
        linkUrl: 'https://example.com',
        linkTitle: 'Example Site'
      }
      render(<Post post={postWithLink} {...mockHandlers} />)
      const link = screen.getByText('Example Site').closest('a')
      const event = new MouseEvent('click', { bubbles: true })
      const stopPropagation = jest.spyOn(event, 'stopPropagation')
      fireEvent(link, event)
      expect(stopPropagation).toHaveBeenCalled()
    })
  })

  describe('Post Click Navigation', () => {
    it('should navigate to post detail when clicking post', () => {
      const { container } = render(<Post post={mockPost} {...mockHandlers} />)
      const article = container.querySelector('article')
      fireEvent.click(article)
      expect(window.location.href).toBe('/c/testcommunity/posts/post-123')
    })

    it('should not navigate when clicking on buttons', () => {
      const longPost = { ...mockPost, content: 'a'.repeat(600) }
      render(<Post post={longPost} {...mockHandlers} />)
      const expandButton = screen.getByText('Show more')
      fireEvent.click(expandButton)
      expect(window.location.href).toBe('')
    })

    it('should not navigate when clicking on links', () => {
      render(<Post post={mockPost} {...mockHandlers} />)
      const authorLink = screen.getByText('u/testuser')
      fireEvent.click(authorLink)
      expect(window.location.href).toBe('')
    })

    it('should not navigate when clicking on vote controls', () => {
      const { container } = render(<Post post={mockPost} {...mockHandlers} />)
      const voteControls = screen.getByTestId('vote-controls')
      voteControls.className = 'vote-controls'
      fireEvent.click(voteControls)
      expect(window.location.href).toBe('')
    })
  })

  describe('DOMPurify Integration', () => {
    it('should sanitize HTML content', () => {
      const DOMPurify = require('dompurify')
      const postWithHTML = {
        ...mockPost,
        content: '<script>alert("xss")</script><p>Safe content</p>'
      }
      render(<Post post={postWithHTML} {...mockHandlers} />)
      expect(DOMPurify.sanitize).toHaveBeenCalled()
    })

    it('should sanitize truncated content for long posts', () => {
      const DOMPurify = require('dompurify')
      const longPost = { ...mockPost, content: 'a'.repeat(600) }
      render(<Post post={longPost} {...mockHandlers} />)
      expect(DOMPurify.sanitize).toHaveBeenCalled()
    })
  })

  describe('Responsive Layout', () => {
    it('should apply responsive gap classes', () => {
      const { container } = render(<Post post={mockPost} {...mockHandlers} />)
      const mainContent = container.querySelector('.flex-1')
      expect(mainContent).toBeInTheDocument()
    })

    it('should apply compact gap in compact mode', () => {
      const { container } = render(<Post post={mockPost} {...mockHandlers} compact={true} />)
      const flexContainer = container.querySelector('.gap-sm')
      expect(flexContainer).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<Post post={mockPost} {...mockHandlers} />)
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toBeInTheDocument()
      expect(heading).toHaveTextContent('Test Post Title')
    })

    it('should have semantic HTML structure', () => {
      const { container } = render(<Post post={mockPost} {...mockHandlers} />)
      expect(container.querySelector('article')).toBeInTheDocument()
      expect(container.querySelector('header')).toBeInTheDocument()
      expect(container.querySelector('h2')).toBeInTheDocument()
      expect(container.querySelector('time')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing commentCount gracefully', () => {
      const postWithoutCount = { ...mockPost, commentCount: undefined }
      render(<Post post={postWithoutCount} {...mockHandlers} />)
      expect(screen.getByTestId('post-actions')).toBeInTheDocument()
    })

    it('should handle posts with zero score', () => {
      const postWithZeroScore = { ...mockPost, score: 0 }
      render(<Post post={postWithZeroScore} {...mockHandlers} />)
      expect(VoteControls).toHaveBeenCalledWith(
        expect.objectContaining({ initialScore: 0 }),
        expect.anything()
      )
    })

    it('should handle posts with negative score', () => {
      const postWithNegativeScore = { ...mockPost, score: -5 }
      render(<Post post={postWithNegativeScore} {...mockHandlers} />)
      expect(VoteControls).toHaveBeenCalledWith(
        expect.objectContaining({ initialScore: -5 }),
        expect.anything()
      )
    })

    it('should handle very long titles', () => {
      const longTitlePost = { ...mockPost, title: 'a'.repeat(300) }
      render(<Post post={longTitlePost} {...mockHandlers} />)
      expect(screen.getByText('a'.repeat(300))).toBeInTheDocument()
    })

    it('should handle empty title gracefully', () => {
      const emptyTitlePost = { ...mockPost, title: '' }
      render(<Post post={emptyTitlePost} {...mockHandlers} />)
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toBeInTheDocument()
    })

    it('should handle community as object with name property', () => {
      const postWithCommunityObject = {
        ...mockPost,
        community: { name: 'testcommunity' }
      }
      render(<Post post={postWithCommunityObject} {...mockHandlers} showCommunity={true} />)
      expect(screen.getByText('c/testcommunity')).toBeInTheDocument()
    })

    it('should handle optional handlers being undefined', () => {
      expect(() => {
        render(<Post post={mockPost} />)
      }).not.toThrow()
    })
  })

  describe('State Management', () => {
    it('should manage expanded state for long content', () => {
      const longPost = { ...mockPost, content: 'a'.repeat(600) }
      render(<Post post={longPost} {...mockHandlers} />)
      const expandButton = screen.getByText('Show more')
      fireEvent.click(expandButton)
      expect(screen.getByText('Show less')).toBeInTheDocument()
      fireEvent.click(screen.getByText('Show less'))
      expect(screen.getByText('Show more')).toBeInTheDocument()
    })

    it('should manage showFullImage state for media', () => {
      const postWithMedia = {
        ...mockPost,
        media: { type: 'image', url: 'test.jpg' }
      }
      render(<Post post={postWithMedia} {...mockHandlers} />)
      expect(MediaPreview).toHaveBeenCalledWith(
        expect.objectContaining({ isExpanded: false }),
        expect.anything()
      )
    })
  })

  describe('Performance', () => {
    it('should render efficiently with minimal re-renders', () => {
      const { rerender } = render(<Post post={mockPost} {...mockHandlers} />)
      const renderCount = VoteControls.mock.calls.length
      rerender(<Post post={mockPost} {...mockHandlers} />)
      expect(VoteControls.mock.calls.length).toBe(renderCount * 2)
    })

    it('should handle rapid clicks on expand/collapse', () => {
      const longPost = { ...mockPost, content: 'a'.repeat(600) }
      render(<Post post={longPost} {...mockHandlers} />)
      const expandButton = screen.getByText('Show more')
      fireEvent.click(expandButton)
      fireEvent.click(screen.getByText('Show less'))
      fireEvent.click(screen.getByText('Show more'))
      expect(screen.getByText('Show less')).toBeInTheDocument()
    })
  })
})

export default article
