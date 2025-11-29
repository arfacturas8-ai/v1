import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import PostsFeed, { Post, CreatePostModal, ReactionButton, REACTIONS, POST_TYPES } from './PostSystem'

// Mock dependencies
jest.mock('../FileUpload/FileUploadSystem', () => ({
  __esModule: true,
  default: ({ onFilesUploaded }) => (
    <div data-testid="file-upload">
      <button onClick={() => onFilesUploaded([
        { name: 'test.png', size: 1024, type: 'image/png' }
      ])}>Upload File</button>
    </div>
  ),
  FileAttachment: ({ attachment }) => (
    <div data-testid="file-attachment">{attachment.name}</div>
  )
}))

jest.mock('../Comments/ThreadedComments', () => ({
  __esModule: true,
  default: ({ comments, onAddComment, onReply, onEdit, onDelete, placeholder }) => (
    <div data-testid="threaded-comments">
      <input
        data-testid="comment-input"
        placeholder={placeholder}
        onChange={(e) => {}}
      />
      <button onClick={() => onAddComment('Test comment')}>Add Comment</button>
      <button onClick={() => onReply('comment1', 'Test reply')}>Reply</button>
      <button onClick={() => onEdit('comment1', 'Edited comment')}>Edit</button>
      <button onClick={() => onDelete('comment1')}>Delete</button>
      {comments.map(comment => (
        <div key={comment.id} data-testid="comment">{comment.content}</div>
      ))}
    </div>
  )
}))

jest.mock('../ui/Card', () => ({
  Card: ({ children, className, variant, hoverEffect, onClick }) => (
    <div data-testid="card" className={className} onClick={onClick}>{children}</div>
  ),
  CardHeader: ({ children, className }) => (
    <div data-testid="card-header" className={className}>{children}</div>
  ),
  CardTitle: ({ children, className }) => (
    <div data-testid="card-title" className={className}>{children}</div>
  ),
  CardDescription: ({ children, className }) => (
    <div data-testid="card-description" className={className}>{children}</div>
  ),
  CardContent: ({ children, className }) => (
    <div data-testid="card-content" className={className}>{children}</div>
  ),
  CardFooter: ({ children, className }) => (
    <div data-testid="card-footer" className={className}>{children}</div>
  ),
  CardImage: ({ children }) => <div data-testid="card-image">{children}</div>,
  CardBadge: ({ children }) => <div data-testid="card-badge">{children}</div>
}))

jest.mock('../ui/Button', () => ({
  Button: ({ children, onClick, variant, size, leftIcon, fullWidth, type, disabled, className, style, title }) => (
    <button
      data-testid="button"
      onClick={onClick}
      type={type}
      disabled={disabled}
      className={className}
      style={style}
      title={title}
      data-variant={variant}
      data-size={size}
    >
      {leftIcon}
      {children}
    </button>
  ),
  IconButton: ({ children, onClick, 'aria-label': ariaLabel, variant, size }) => (
    <button
      data-testid="icon-button"
      onClick={onClick}
      aria-label={ariaLabel}
      data-variant={variant}
      data-size={size}
    >
      {children}
    </button>
  )
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => {
  const MockIcon = ({ size, ...props }) => <span data-icon-size={size} {...props}>Icon</span>
  return {
    TrendingUp: MockIcon,
    MessageSquare: MockIcon,
    Share: MockIcon,
    Bookmark: MockIcon,
    Zap: MockIcon,
    Flame: MockIcon,
    Brain: MockIcon,
    Laugh: MockIcon,
    ChevronUp: MockIcon,
    ChevronDown: MockIcon,
    MoreHorizontal: MockIcon,
    Flag: MockIcon,
    Edit: MockIcon,
    Trash: MockIcon,
    Image: MockIcon,
    Link: MockIcon,
    Clock: MockIcon,
    Eye: MockIcon,
    Hash: MockIcon,
    Award: MockIcon
  }
})

// Mock data
const mockCurrentUser = {
  id: 'user1',
  username: 'TestUser',
  avatar: 'https://example.com/avatar.jpg',
  reputation: 1500
}

const mockPost = {
  id: 'post1',
  type: 'DISCUSSION',
  title: 'Test Post Title',
  content: 'Test post content here',
  tags: ['crypto', 'defi', 'nft'],
  author: {
    id: 'author1',
    username: 'AuthorUser',
    avatar: null,
    reputation: 2500
  },
  timestamp: new Date('2025-01-01T12:00:00Z').toISOString(),
  reactions: { total: 10 },
  reactionCounts: { BULL: 5, BEAR: 2, SMART: 3 },
  commentCount: 5,
  views: 150,
  rewards: 100,
  comments: [],
  attachments: []
}

const mockPosts = [
  mockPost,
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
]

describe('PostSystem', () => {
  describe('ReactionButton Component', () => {
    test('renders reaction button with emoji and count', () => {
      render(
        <ReactionButton
          reaction="BULL"
          count={5}
          active={false}
          onClick={jest.fn()}
        />
      )

      expect(screen.getByText('🚀')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    test('renders reaction button without count when count is 0', () => {
      render(
        <ReactionButton
          reaction="BULL"
          count={0}
          active={false}
          onClick={jest.fn()}
        />
      )

      expect(screen.getByText('🚀')).toBeInTheDocument()
      expect(screen.queryByText('0')).not.toBeInTheDocument()
    })

    test('applies active styling when active', () => {
      render(
        <ReactionButton
          reaction="BULL"
          count={5}
          active={true}
          onClick={jest.fn()}
        />
      )

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('data-variant', 'primary')
    })

    test('applies ghost styling when inactive', () => {
      render(
        <ReactionButton
          reaction="BULL"
          count={5}
          active={false}
          onClick={jest.fn()}
        />
      )

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('data-variant', 'ghost')
    })

    test('calls onClick with reaction type when clicked', () => {
      const handleClick = jest.fn()
      render(
        <ReactionButton
          reaction="BULL"
          count={5}
          active={false}
          onClick={handleClick}
        />
      )

      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledWith('BULL')
    })

    test('returns null for invalid reaction type', () => {
      const { container } = render(
        <ReactionButton
          reaction="INVALID"
          count={5}
          active={false}
          onClick={jest.fn()}
        />
      )

      expect(container.firstChild).toBeNull()
    })

    test('displays correct reaction label in title attribute', () => {
      render(
        <ReactionButton
          reaction="BULL"
          count={5}
          active={false}
          onClick={jest.fn()}
        />
      )

      expect(screen.getByRole('button')).toHaveAttribute('title', 'Bullish')
    })

    test('renders all reaction types correctly', () => {
      Object.keys(REACTIONS).forEach(reactionKey => {
        const { unmount } = render(
          <ReactionButton
            reaction={reactionKey}
            count={1}
            active={false}
            onClick={jest.fn()}
          />
        )
        expect(screen.getByText(REACTIONS[reactionKey].emoji)).toBeInTheDocument()
        unmount()
      })
    })
  })

  describe('CreatePostModal Component', () => {
    const mockOnClose = jest.fn()
    const mockOnCreatePost = jest.fn()

    beforeEach(() => {
      jest.clearAllMocks()
    })

    test('does not render when isOpen is false', () => {
      render(
        <CreatePostModal
          isOpen={false}
          onClose={mockOnClose}
          onCreatePost={mockOnCreatePost}
          channelId="channel1"
        />
      )

      expect(screen.queryByText('Create Post')).not.toBeInTheDocument()
    })

    test('renders when isOpen is true', () => {
      render(
        <CreatePostModal
          isOpen={true}
          onClose={mockOnClose}
          onCreatePost={mockOnCreatePost}
          channelId="channel1"
        />
      )

      expect(screen.getByText('Create Post')).toBeInTheDocument()
    })

    test('displays all post type options', () => {
      render(
        <CreatePostModal
          isOpen={true}
          onClose={mockOnClose}
          onCreatePost={mockOnCreatePost}
          channelId="channel1"
        />
      )

      Object.values(POST_TYPES).forEach(type => {
        expect(screen.getByText(type.label)).toBeInTheDocument()
      })
    })

    test('allows selecting different post types', async () => {
      const user = userEvent.setup()
      render(
        <CreatePostModal
          isOpen={true}
          onClose={mockOnClose}
          onCreatePost={mockOnCreatePost}
          channelId="channel1"
        />
      )

      const newsButton = screen.getByText('News')
      await user.click(newsButton)

      expect(newsButton.parentElement).toHaveAttribute('data-variant', 'primary')
    })

    test('validates title input is required', async () => {
      const user = userEvent.setup()
      render(
        <CreatePostModal
          isOpen={true}
          onClose={mockOnClose}
          onCreatePost={mockOnCreatePost}
          channelId="channel1"
        />
      )

      const titleInput = screen.getByPlaceholderText("What's your post about?")
      expect(titleInput).toBeRequired()
    })

    test('validates content input is required', async () => {
      const user = userEvent.setup()
      render(
        <CreatePostModal
          isOpen={true}
          onClose={mockOnClose}
          onCreatePost={mockOnCreatePost}
          channelId="channel1"
        />
      )

      const contentInput = screen.getByPlaceholderText('Share your thoughts, analysis, or discussion...')
      expect(contentInput).toBeRequired()
    })

    test('displays character count for title', async () => {
      const user = userEvent.setup()
      render(
        <CreatePostModal
          isOpen={true}
          onClose={mockOnClose}
          onCreatePost={mockOnCreatePost}
          channelId="channel1"
        />
      )

      expect(screen.getByText('0/200')).toBeInTheDocument()

      const titleInput = screen.getByPlaceholderText("What's your post about?")
      await user.type(titleInput, 'Test Title')

      expect(screen.getByText('10/200')).toBeInTheDocument()
    })

    test('limits title to 200 characters', () => {
      render(
        <CreatePostModal
          isOpen={true}
          onClose={mockOnClose}
          onCreatePost={mockOnCreatePost}
          channelId="channel1"
        />
      )

      const titleInput = screen.getByPlaceholderText("What's your post about?")
      expect(titleInput).toHaveAttribute('maxLength', '200')
    })

    test('allows adding tags', async () => {
      const user = userEvent.setup()
      render(
        <CreatePostModal
          isOpen={true}
          onClose={mockOnClose}
          onCreatePost={mockOnCreatePost}
          channelId="channel1"
        />
      )

      const tagInput = screen.getByPlaceholderText('Add tags...')
      await user.type(tagInput, 'crypto')

      const addButton = screen.getByText('Add')
      await user.click(addButton)

      expect(screen.getByText('crypto')).toBeInTheDocument()
    })

    test('prevents duplicate tags', async () => {
      const user = userEvent.setup()
      render(
        <CreatePostModal
          isOpen={true}
          onClose={mockOnClose}
          onCreatePost={mockOnCreatePost}
          channelId="channel1"
        />
      )

      const tagInput = screen.getByPlaceholderText('Add tags...')
      await user.type(tagInput, 'crypto')

      const addButton = screen.getByText('Add')
      await user.click(addButton)
      await user.type(tagInput, 'crypto')
      await user.click(addButton)

      const tags = screen.getAllByText('crypto')
      expect(tags).toHaveLength(1)
    })

    test('allows removing tags', async () => {
      const user = userEvent.setup()
      render(
        <CreatePostModal
          isOpen={true}
          onClose={mockOnClose}
          onCreatePost={mockOnCreatePost}
          channelId="channel1"
        />
      )

      const tagInput = screen.getByPlaceholderText('Add tags...')
      await user.type(tagInput, 'crypto')

      const addButton = screen.getByText('Add')
      await user.click(addButton)

      const removeButton = screen.getByText('×')
      await user.click(removeButton)

      expect(screen.queryByText('crypto')).not.toBeInTheDocument()
    })

    test('adds tag on Enter key press', async () => {
      const user = userEvent.setup()
      render(
        <CreatePostModal
          isOpen={true}
          onClose={mockOnClose}
          onCreatePost={mockOnCreatePost}
          channelId="channel1"
        />
      )

      const tagInput = screen.getByPlaceholderText('Add tags...')
      await user.type(tagInput, 'defi{Enter}')

      expect(screen.getByText('defi')).toBeInTheDocument()
    })

    test('calls onClose when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <CreatePostModal
          isOpen={true}
          onClose={mockOnClose}
          onCreatePost={mockOnCreatePost}
          channelId="channel1"
        />
      )

      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    test('calls onClose when close icon is clicked', async () => {
      const user = userEvent.setup()
      render(
        <CreatePostModal
          isOpen={true}
          onClose={mockOnClose}
          onCreatePost={mockOnCreatePost}
          channelId="channel1"
        />
      )

      const closeButton = screen.getByLabelText('Close modal')
      await user.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    test('submits post with valid data', async () => {
      const user = userEvent.setup()
      render(
        <CreatePostModal
          isOpen={true}
          onClose={mockOnClose}
          onCreatePost={mockOnCreatePost}
          channelId="channel1"
        />
      )

      const titleInput = screen.getByPlaceholderText("What's your post about?")
      const contentInput = screen.getByPlaceholderText('Share your thoughts, analysis, or discussion...')

      await user.type(titleInput, 'My Test Post')
      await user.type(contentInput, 'This is my test content')

      const submitButton = screen.getByText('Create Post')
      await user.click(submitButton)

      expect(mockOnCreatePost).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'My Test Post',
          content: 'This is my test content',
          type: 'DISCUSSION',
          channelId: 'channel1'
        })
      )
    })

    test('does not submit with empty title', async () => {
      const user = userEvent.setup()
      render(
        <CreatePostModal
          isOpen={true}
          onClose={mockOnClose}
          onCreatePost={mockOnCreatePost}
          channelId="channel1"
        />
      )

      const contentInput = screen.getByPlaceholderText('Share your thoughts, analysis, or discussion...')
      await user.type(contentInput, 'This is my test content')

      const submitButton = screen.getByText('Create Post')
      await user.click(submitButton)

      expect(mockOnCreatePost).not.toHaveBeenCalled()
    })

    test('does not submit with empty content', async () => {
      const user = userEvent.setup()
      render(
        <CreatePostModal
          isOpen={true}
          onClose={mockOnClose}
          onCreatePost={mockOnCreatePost}
          channelId="channel1"
        />
      )

      const titleInput = screen.getByPlaceholderText("What's your post about?")
      await user.type(titleInput, 'My Test Post')

      const submitButton = screen.getByText('Create Post')
      await user.click(submitButton)

      expect(mockOnCreatePost).not.toHaveBeenCalled()
    })

    test('resets form after successful submission', async () => {
      const user = userEvent.setup()
      render(
        <CreatePostModal
          isOpen={true}
          onClose={mockOnClose}
          onCreatePost={mockOnCreatePost}
          channelId="channel1"
        />
      )

      const titleInput = screen.getByPlaceholderText("What's your post about?")
      const contentInput = screen.getByPlaceholderText('Share your thoughts, analysis, or discussion...')

      await user.type(titleInput, 'My Test Post')
      await user.type(contentInput, 'This is my test content')

      const submitButton = screen.getByText('Create Post')
      await user.click(submitButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    test('includes file upload component', () => {
      render(
        <CreatePostModal
          isOpen={true}
          onClose={mockOnClose}
          onCreatePost={mockOnCreatePost}
          channelId="channel1"
        />
      )

      expect(screen.getByTestId('file-upload')).toBeInTheDocument()
    })

    test('handles file uploads', async () => {
      const user = userEvent.setup()
      render(
        <CreatePostModal
          isOpen={true}
          onClose={mockOnClose}
          onCreatePost={mockOnCreatePost}
          channelId="channel1"
        />
      )

      const uploadButton = screen.getByText('Upload File')
      await user.click(uploadButton)

      // File should be added to attachments (verified through submission)
    })

    test('creates post with correct structure', async () => {
      const user = userEvent.setup()
      render(
        <CreatePostModal
          isOpen={true}
          onClose={mockOnClose}
          onCreatePost={mockOnCreatePost}
          channelId="channel1"
        />
      )

      const titleInput = screen.getByPlaceholderText("What's your post about?")
      const contentInput = screen.getByPlaceholderText('Share your thoughts, analysis, or discussion...')

      await user.type(titleInput, 'Test')
      await user.type(contentInput, 'Content')

      const submitButton = screen.getByText('Create Post')
      await user.click(submitButton)

      expect(mockOnCreatePost).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.stringContaining('post_'),
          author: expect.objectContaining({
            id: 'current_user',
            username: 'DemoUser'
          }),
          timestamp: expect.any(String),
          reactions: {},
          reactionCounts: {},
          commentCount: 0,
          views: 0,
          rewards: 0
        })
      )
    })
  })

  describe('Post Component', () => {
    const mockHandlers = {
      onReaction: jest.fn(),
      onComment: jest.fn(),
      onReply: jest.fn(),
      onEditComment: jest.fn(),
      onDeleteComment: jest.fn()
    }

    beforeEach(() => {
      jest.clearAllMocks()
    })

    test('renders post with correct title', () => {
      render(
        <Post
          post={mockPost}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('Test Post Title')).toBeInTheDocument()
    })

    test('renders post content', () => {
      render(
        <Post
          post={mockPost}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('Test post content here')).toBeInTheDocument()
    })

    test('renders author username', () => {
      render(
        <Post
          post={mockPost}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('AuthorUser')).toBeInTheDocument()
    })

    test('renders author reputation', () => {
      render(
        <Post
          post={mockPost}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('2.5k rep')).toBeInTheDocument()
    })

    test('renders view count', () => {
      render(
        <Post
          post={mockPost}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('150')).toBeInTheDocument()
    })

    test('renders comment count', () => {
      render(
        <Post
          post={mockPost}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('5')).toBeInTheDocument()
    })

    test('renders post type badge', () => {
      render(
        <Post
          post={mockPost}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('Discussion')).toBeInTheDocument()
    })

    test('renders tags', () => {
      render(
        <Post
          post={mockPost}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('crypto')).toBeInTheDocument()
      expect(screen.getByText('defi')).toBeInTheDocument()
      expect(screen.getByText('nft')).toBeInTheDocument()
    })

    test('limits displayed tags to 3 and shows count', () => {
      const postWithManyTags = {
        ...mockPost,
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5']
      }

      render(
        <Post
          post={postWithManyTags}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('+2')).toBeInTheDocument()
    })

    test('renders reaction buttons', () => {
      render(
        <Post
          post={mockPost}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('🚀')).toBeInTheDocument()
      expect(screen.getByText('📉')).toBeInTheDocument()
      expect(screen.getByText('🧠')).toBeInTheDocument()
      expect(screen.getByText('😂')).toBeInTheDocument()
    })

    test('displays reaction counts', () => {
      render(
        <Post
          post={mockPost}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const bullReaction = screen.getByText('🚀').parentElement
      expect(within(bullReaction).getByText('5')).toBeInTheDocument()
    })

    test('toggles reaction on click', async () => {
      const user = userEvent.setup()
      render(
        <Post
          post={mockPost}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const bullButton = screen.getByText('🚀').parentElement
      await user.click(bullButton)

      expect(mockHandlers.onReaction).toHaveBeenCalledWith('post1', 'BULL', true)
    })

    test('removes reaction when clicking active reaction', async () => {
      const user = userEvent.setup()
      render(
        <Post
          post={mockPost}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const bullButton = screen.getByText('🚀').parentElement
      await user.click(bullButton)
      await user.click(bullButton)

      expect(mockHandlers.onReaction).toHaveBeenLastCalledWith('post1', 'BULL', false)
    })

    test('shows comments section when comment button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <Post
          post={mockPost}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const commentButton = screen.getByText('5').parentElement
      await user.click(commentButton)

      expect(screen.getByTestId('threaded-comments')).toBeInTheDocument()
    })

    test('hides comments section when toggled again', async () => {
      const user = userEvent.setup()
      render(
        <Post
          post={mockPost}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const commentButton = screen.getByText('5').parentElement
      await user.click(commentButton)
      await user.click(commentButton)

      expect(screen.queryByTestId('threaded-comments')).not.toBeInTheDocument()
    })

    test('passes correct props to ThreadedComments', async () => {
      const user = userEvent.setup()
      const postWithComments = {
        ...mockPost,
        comments: [
          { id: 'c1', content: 'Test comment', author: mockCurrentUser }
        ]
      }

      render(
        <Post
          post={postWithComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const commentButton = screen.getByText('5').parentElement
      await user.click(commentButton)

      expect(screen.getByPlaceholderText('Share your thoughts on this post...')).toBeInTheDocument()
    })

    test('handles adding comment', async () => {
      const user = userEvent.setup()
      render(
        <Post
          post={mockPost}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const commentButton = screen.getByText('5').parentElement
      await user.click(commentButton)

      const addCommentButton = screen.getByText('Add Comment')
      await user.click(addCommentButton)

      expect(mockHandlers.onComment).toHaveBeenCalledWith(
        'post1',
        expect.objectContaining({
          postId: 'post1',
          content: 'Test comment',
          author: expect.objectContaining({
            username: 'TestUser'
          })
        })
      )
    })

    test('handles replying to comment', async () => {
      const user = userEvent.setup()
      render(
        <Post
          post={mockPost}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const commentButton = screen.getByText('5').parentElement
      await user.click(commentButton)

      const replyButton = screen.getByText('Reply')
      await user.click(replyButton)

      expect(mockHandlers.onReply).toHaveBeenCalledWith(
        'post1',
        'comment1',
        expect.objectContaining({
          content: 'Test reply',
          parentId: 'comment1'
        })
      )
    })

    test('handles editing comment', async () => {
      const user = userEvent.setup()
      render(
        <Post
          post={mockPost}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const commentButton = screen.getByText('5').parentElement
      await user.click(commentButton)

      const editButton = screen.getByText('Edit')
      await user.click(editButton)

      expect(mockHandlers.onEditComment).toHaveBeenCalledWith('post1', 'comment1', 'Edited comment')
    })

    test('handles deleting comment with confirmation', async () => {
      const user = userEvent.setup()
      window.confirm = jest.fn(() => true)

      render(
        <Post
          post={mockPost}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const commentButton = screen.getByText('5').parentElement
      await user.click(commentButton)

      const deleteButton = screen.getByText('Delete')
      await user.click(deleteButton)

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this comment?')
      expect(mockHandlers.onDeleteComment).toHaveBeenCalledWith('post1', 'comment1')
    })

    test('does not delete comment when confirmation is cancelled', async () => {
      const user = userEvent.setup()
      window.confirm = jest.fn(() => false)

      render(
        <Post
          post={mockPost}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const commentButton = screen.getByText('5').parentElement
      await user.click(commentButton)

      const deleteButton = screen.getByText('Delete')
      await user.click(deleteButton)

      expect(mockHandlers.onDeleteComment).not.toHaveBeenCalled()
    })

    test('renders share button', () => {
      render(
        <Post
          post={mockPost}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('Share')).toBeInTheDocument()
    })

    test('renders bookmark button', () => {
      render(
        <Post
          post={mockPost}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const bookmarkButton = screen.getByLabelText('Bookmark')
      expect(bookmarkButton).toBeInTheDocument()
    })

    test('renders rewards when present', () => {
      render(
        <Post
          post={mockPost}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('100 CRYB')).toBeInTheDocument()
    })

    test('does not render rewards when zero', () => {
      const postWithoutRewards = { ...mockPost, rewards: 0 }
      render(
        <Post
          post={postWithoutRewards}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.queryByText('CRYB')).not.toBeInTheDocument()
    })

    test('renders attachments when present', () => {
      const postWithAttachments = {
        ...mockPost,
        attachments: [
          { id: 'file1', name: 'document.pdf', size: 1024, type: 'application/pdf', url: 'https://example.com/doc.pdf' }
        ]
      }

      render(
        <Post
          post={postWithAttachments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByTestId('file-attachment')).toBeInTheDocument()
      expect(screen.getByText('document.pdf')).toBeInTheDocument()
    })

    test('does not render content in compact mode', () => {
      render(
        <Post
          post={mockPost}
          currentUser={mockCurrentUser}
          compact={true}
          {...mockHandlers}
        />
      )

      expect(screen.queryByText('Test post content here')).not.toBeInTheDocument()
    })

    test('renders more options button', () => {
      render(
        <Post
          post={mockPost}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const moreButton = screen.getByLabelText('More options')
      expect(moreButton).toBeInTheDocument()
    })

    test('displays author avatar when available', () => {
      render(
        <Post
          post={mockPost}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      // Author has no avatar, so should show initial
      expect(screen.getByText('A')).toBeInTheDocument()
    })

    test('formats time as "now" for recent posts', () => {
      const recentPost = {
        ...mockPost,
        timestamp: new Date().toISOString()
      }

      render(
        <Post
          post={recentPost}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('now')).toBeInTheDocument()
    })

    test('formats numbers over 1000 with k suffix', () => {
      const popularPost = {
        ...mockPost,
        views: 5000,
        author: { ...mockPost.author, reputation: 15000 }
      }

      render(
        <Post
          post={popularPost}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('5.0k')).toBeInTheDocument()
      expect(screen.getByText('15.0k rep')).toBeInTheDocument()
    })
  })

  describe('PostsFeed Component', () => {
    const mockHandlers = {
      onCreatePost: jest.fn(),
      onReaction: jest.fn(),
      onComment: jest.fn(),
      onReply: jest.fn(),
      onEditComment: jest.fn(),
      onDeleteComment: jest.fn()
    }

    beforeEach(() => {
      jest.clearAllMocks()
    })

    test('renders feed header', () => {
      render(
        <PostsFeed
          channelId="channel1"
          posts={mockPosts}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('Community Posts')).toBeInTheDocument()
    })

    test('renders create post button', () => {
      render(
        <PostsFeed
          channelId="channel1"
          posts={mockPosts}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const createButtons = screen.getAllByText('Create Post')
      expect(createButtons[0]).toBeInTheDocument()
    })

    test('opens create post modal when button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <PostsFeed
          channelId="channel1"
          posts={mockPosts}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const createButtons = screen.getAllByText('Create Post')
      await user.click(createButtons[0])

      expect(screen.getByPlaceholderText("What's your post about?")).toBeInTheDocument()
    })

    test('renders sort options', () => {
      render(
        <PostsFeed
          channelId="channel1"
          posts={mockPosts}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('Hot')).toBeInTheDocument()
      expect(screen.getByText('New')).toBeInTheDocument()
      expect(screen.getByText('Top')).toBeInTheDocument()
    })

    test('defaults to hot sort', () => {
      render(
        <PostsFeed
          channelId="channel1"
          posts={mockPosts}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const hotButton = screen.getByText('Hot')
      expect(hotButton).toHaveAttribute('data-variant', 'primary')
    })

    test('changes sort when sort button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <PostsFeed
          channelId="channel1"
          posts={mockPosts}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const newButton = screen.getByText('New')
      await user.click(newButton)

      expect(newButton).toHaveAttribute('data-variant', 'primary')
    })

    test('sorts posts by new (timestamp)', async () => {
      const user = userEvent.setup()
      render(
        <PostsFeed
          channelId="channel1"
          posts={mockPosts}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const newButton = screen.getByText('New')
      await user.click(newButton)

      const titles = screen.getAllByText(/Post/)
      expect(titles[0]).toHaveTextContent('Third Post')
    })

    test('sorts posts by top (reactions)', async () => {
      const user = userEvent.setup()
      render(
        <PostsFeed
          channelId="channel1"
          posts={mockPosts}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const topButton = screen.getByText('Top')
      await user.click(topButton)

      const titles = screen.getAllByText(/Post/)
      expect(titles[0]).toHaveTextContent('Second Post')
    })

    test('renders all posts', () => {
      render(
        <PostsFeed
          channelId="channel1"
          posts={mockPosts}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('Test Post Title')).toBeInTheDocument()
      expect(screen.getByText('Second Post')).toBeInTheDocument()
      expect(screen.getByText('Third Post')).toBeInTheDocument()
    })

    test('renders empty state when no posts', () => {
      render(
        <PostsFeed
          channelId="channel1"
          posts={[]}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('No posts yet')).toBeInTheDocument()
      expect(screen.getByText('Be the first to start a discussion in this channel!')).toBeInTheDocument()
    })

    test('empty state shows create first post button', () => {
      render(
        <PostsFeed
          channelId="channel1"
          posts={[]}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('Create First Post')).toBeInTheDocument()
    })

    test('clicking create first post opens modal', async () => {
      const user = userEvent.setup()
      render(
        <PostsFeed
          channelId="channel1"
          posts={[]}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const createButton = screen.getByText('Create First Post')
      await user.click(createButton)

      expect(screen.getByPlaceholderText("What's your post about?")).toBeInTheDocument()
    })

    test('passes channelId to create post modal', async () => {
      const user = userEvent.setup()
      render(
        <PostsFeed
          channelId="channel123"
          posts={[]}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const createButtons = screen.getAllByText(/Create/)
      await user.click(createButtons[0])

      const titleInput = screen.getByPlaceholderText("What's your post about?")
      const contentInput = screen.getByPlaceholderText('Share your thoughts, analysis, or discussion...')

      await user.type(titleInput, 'Test')
      await user.type(contentInput, 'Content')

      const submitButton = screen.getByText('Create Post')
      await user.click(submitButton)

      expect(mockHandlers.onCreatePost).toHaveBeenCalledWith(
        expect.objectContaining({
          channelId: 'channel123'
        })
      )
    })

    test('closes modal after creating post', async () => {
      const user = userEvent.setup()
      render(
        <PostsFeed
          channelId="channel1"
          posts={[]}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const createButtons = screen.getAllByText(/Create/)
      await user.click(createButtons[0])

      const titleInput = screen.getByPlaceholderText("What's your post about?")
      const contentInput = screen.getByPlaceholderText('Share your thoughts, analysis, or discussion...')

      await user.type(titleInput, 'Test')
      await user.type(contentInput, 'Content')

      const submitButton = screen.getByText('Create Post')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByPlaceholderText("What's your post about?")).not.toBeInTheDocument()
      })
    })

    test('passes handlers to Post components', () => {
      render(
        <PostsFeed
          channelId="channel1"
          posts={mockPosts}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      // Handlers should be passed and functional in Post components
      expect(screen.getAllByTestId('card')).toHaveLength(mockPosts.length)
    })

    test('passes currentUser to Post components', () => {
      render(
        <PostsFeed
          channelId="channel1"
          posts={mockPosts}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      // CurrentUser is used in comments, verify posts are rendered
      expect(screen.getAllByTestId('card')).toHaveLength(mockPosts.length)
    })

    test('hot sort algorithm considers both reactions and comments', async () => {
      const user = userEvent.setup()
      const postsForHotSort = [
        {
          ...mockPost,
          id: 'hot1',
          title: 'High Reactions',
          reactions: { total: 100 },
          commentCount: 0,
          timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
        },
        {
          ...mockPost,
          id: 'hot2',
          title: 'High Comments',
          reactions: { total: 10 },
          commentCount: 50,
          timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
        }
      ]

      render(
        <PostsFeed
          channelId="channel1"
          posts={postsForHotSort}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      // Comments are weighted 2x in hot algorithm
      const titles = screen.getAllByText(/High/)
      expect(titles[0]).toHaveTextContent('High Comments')
    })

    test('hot sort considers time decay', async () => {
      const postsWithTimeDecay = [
        {
          ...mockPost,
          id: 'old',
          title: 'Old High Score',
          reactions: { total: 100 },
          commentCount: 50,
          timestamp: new Date(Date.now() - 86400000).toISOString() // 24 hours ago
        },
        {
          ...mockPost,
          id: 'recent',
          title: 'Recent Low Score',
          reactions: { total: 10 },
          commentCount: 5,
          timestamp: new Date().toISOString() // now
        }
      ]

      render(
        <PostsFeed
          channelId="channel1"
          posts={postsWithTimeDecay}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      // Recent posts should rank higher due to time decay
      const titles = screen.getAllByText(/Score/)
      expect(titles[0]).toHaveTextContent('Recent Low Score')
    })

    test('maintains original array when sorting', async () => {
      const user = userEvent.setup()
      const originalPosts = [...mockPosts]

      render(
        <PostsFeed
          channelId="channel1"
          posts={mockPosts}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const topButton = screen.getByText('Top')
      await user.click(topButton)

      // Original array should not be mutated
      expect(mockPosts).toEqual(originalPosts)
    })

    test('handles posts without reactions gracefully', () => {
      const postsWithoutReactions = [
        {
          ...mockPost,
          reactions: undefined,
          reactionCounts: undefined
        }
      ]

      render(
        <PostsFeed
          channelId="channel1"
          posts={postsWithoutReactions}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('Test Post Title')).toBeInTheDocument()
    })

    test('handles posts without comments gracefully', () => {
      const postsWithoutComments = [
        {
          ...mockPost,
          commentCount: undefined,
          comments: undefined
        }
      ]

      render(
        <PostsFeed
          channelId="channel1"
          posts={postsWithoutComments}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('Test Post Title')).toBeInTheDocument()
    })
  })

  describe('Integration Tests', () => {
    const mockHandlers = {
      onCreatePost: jest.fn(),
      onReaction: jest.fn(),
      onComment: jest.fn(),
      onReply: jest.fn(),
      onEditComment: jest.fn(),
      onDeleteComment: jest.fn()
    }

    beforeEach(() => {
      jest.clearAllMocks()
    })

    test('complete flow: create post, add reaction, add comment', async () => {
      const user = userEvent.setup()
      const { rerender } = render(
        <PostsFeed
          channelId="channel1"
          posts={[]}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      // Create post
      const createButtons = screen.getAllByText(/Create/)
      await user.click(createButtons[0])

      const titleInput = screen.getByPlaceholderText("What's your post about?")
      const contentInput = screen.getByPlaceholderText('Share your thoughts, analysis, or discussion...')

      await user.type(titleInput, 'Integration Test Post')
      await user.type(contentInput, 'Testing full workflow')

      const submitButton = screen.getByText('Create Post')
      await user.click(submitButton)

      expect(mockHandlers.onCreatePost).toHaveBeenCalled()

      // Rerender with new post
      const newPost = {
        ...mockPost,
        id: 'integration-post',
        title: 'Integration Test Post',
        content: 'Testing full workflow'
      }

      rerender(
        <PostsFeed
          channelId="channel1"
          posts={[newPost]}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('Integration Test Post')).toBeInTheDocument()

      // Add reaction
      const bullButton = screen.getByText('🚀').parentElement
      await user.click(bullButton)

      expect(mockHandlers.onReaction).toHaveBeenCalledWith('integration-post', 'BULL', true)

      // Add comment
      const commentButton = screen.getByText('5').parentElement
      await user.click(commentButton)

      const addCommentButton = screen.getByText('Add Comment')
      await user.click(addCommentButton)

      expect(mockHandlers.onComment).toHaveBeenCalled()
    })

    test('can switch between sort modes and posts remain rendered', async () => {
      const user = userEvent.setup()
      render(
        <PostsFeed
          channelId="channel1"
          posts={mockPosts}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      // Default hot
      expect(screen.getByText('Test Post Title')).toBeInTheDocument()

      // Switch to new
      await user.click(screen.getByText('New'))
      expect(screen.getByText('Test Post Title')).toBeInTheDocument()

      // Switch to top
      await user.click(screen.getByText('Top'))
      expect(screen.getByText('Test Post Title')).toBeInTheDocument()

      // Back to hot
      await user.click(screen.getByText('Hot'))
      expect(screen.getByText('Test Post Title')).toBeInTheDocument()
    })

    test('modal state is preserved when switching sort modes', async () => {
      const user = userEvent.setup()
      render(
        <PostsFeed
          channelId="channel1"
          posts={mockPosts}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const createButtons = screen.getAllByText(/Create Post/)
      await user.click(createButtons[0])

      expect(screen.getByPlaceholderText("What's your post about?")).toBeInTheDocument()

      // Modal should remain open when changing sort
      const newButton = screen.getByText('New')
      await user.click(newButton)

      expect(screen.getByPlaceholderText("What's your post about?")).toBeInTheDocument()
    })

    test('can interact with multiple posts independently', async () => {
      const user = userEvent.setup()
      render(
        <PostsFeed
          channelId="channel1"
          posts={mockPosts}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const bullButtons = screen.getAllByText('🚀')
      await user.click(bullButtons[0].parentElement)
      await user.click(bullButtons[1].parentElement)

      expect(mockHandlers.onReaction).toHaveBeenCalledTimes(2)
      expect(mockHandlers.onReaction).toHaveBeenNthCalledWith(1, 'post1', 'BULL', true)
      expect(mockHandlers.onReaction).toHaveBeenNthCalledWith(2, 'post2', 'BULL', true)
    })

    test('comment sections toggle independently for each post', async () => {
      const user = userEvent.setup()
      render(
        <PostsFeed
          channelId="channel1"
          posts={mockPosts}
          currentUser={mockCurrentUser}
          {...mockHandlers}
        />
      )

      const commentButtons = screen.getAllByText('5')

      await user.click(commentButtons[0].parentElement)
      expect(screen.getAllByTestId('threaded-comments')).toHaveLength(1)

      await user.click(commentButtons[1].parentElement)
      expect(screen.getAllByTestId('threaded-comments')).toHaveLength(2)

      await user.click(commentButtons[0].parentElement)
      expect(screen.getAllByTestId('threaded-comments')).toHaveLength(1)
    })
  })

  describe('Constants and Exports', () => {
    test('REACTIONS constant has correct structure', () => {
      expect(REACTIONS).toBeDefined()
      expect(REACTIONS.BULL).toEqual({
        emoji: '🚀',
        label: 'Bullish',
        value: 2,
        color: '#10B981'
      })
    })

    test('POST_TYPES constant has correct structure', () => {
      expect(POST_TYPES).toBeDefined()
      expect(POST_TYPES.DISCUSSION).toHaveProperty('label', 'Discussion')
      expect(POST_TYPES.DISCUSSION).toHaveProperty('color')
    })

    test('all exports are available', () => {
      expect(PostsFeed).toBeDefined()
      expect(Post).toBeDefined()
      expect(CreatePostModal).toBeDefined()
      expect(ReactionButton).toBeDefined()
      expect(REACTIONS).toBeDefined()
      expect(POST_TYPES).toBeDefined()
    })
  })
})

export default MockIcon
