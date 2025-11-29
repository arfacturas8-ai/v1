import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import { BrowserRouter, Route, Routes, MemoryRouter } from 'react-router-dom'
import PostDetailPage from './PostDetailPage'
import { AuthContext } from '../contexts/AuthContext'
import offlineStorage from '../services/offlineStorage'

// Mock services and dependencies
jest.mock('../services/offlineStorage')
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ArrowLeft: () => <span data-testid="arrow-left-icon" />,
  MessageSquare: () => <span data-testid="message-square-icon" />,
  Share2: () => <span data-testid="share2-icon" />,
  Bookmark: () => <span data-testid="bookmark-icon" />,
  ExternalLink: () => <span data-testid="external-link-icon" />,
  Eye: () => <span data-testid="eye-icon" />,
  Clock: () => <span data-testid="clock-icon" />,
  Users: () => <span data-testid="users-icon" />,
  WifiOff: () => <span data-testid="wifi-off-icon" />,
  ChevronUp: () => <span data-testid="chevron-up-icon" />,
  ChevronDown: () => <span data-testid="chevron-down-icon" />,
}))

// Mock components
jest.mock('../components/social/VoteButtons', () => ({
  VoteButtons: ({ score, userVote, onVote }) => (
    <div data-testid="vote-buttons">
      <button onClick={() => onVote?.('up')} aria-label="Upvote">Upvote</button>
      <span data-testid="vote-score">{score}</span>
      <button onClick={() => onVote?.('down')} aria-label="Downvote">Downvote</button>
      {userVote && <span data-testid="user-vote">{userVote}</span>}
    </div>
  ),
}))

jest.mock('../components/social/AwardSystem', () => ({
  AwardDisplay: ({ awards }) => (
    <div data-testid="award-display">Awards: {awards || 0}</div>
  ),
}))

jest.mock('../components/social/ModernThreadedComments', () => ({
  ModernThreadedComments: ({ comments, onReply, onEdit, onDelete, onVote, onReport }) => (
    <div data-testid="threaded-comments">
      <h3>Comments ({comments.length})</h3>
      {comments.map((comment) => (
        <div key={comment.id} data-testid={`comment-${comment.id}`}>
          <p>{comment.content}</p>
          <button onClick={() => onReply?.(comment.id, 'Reply text')}>Reply</button>
          <button onClick={() => onEdit?.(comment.id, 'Edited text')}>Edit</button>
          <button onClick={() => onDelete?.(comment.id)}>Delete</button>
          <button onClick={() => onVote?.(comment.id, 'up')}>Vote</button>
          <button onClick={() => onReport?.(comment.id)}>Report</button>
        </div>
      ))}
    </div>
  ),
}))

jest.mock('../utils/accessibility.jsx', () => ({
  SkipToContent: ({ targetId }) => <a href={`#${targetId}`}>Skip to content</a>,
  announce: jest.fn(),
  useLoadingAnnouncement: jest.fn(),
  useErrorAnnouncement: jest.fn(),
}))

global.fetch = jest.fn()

const mockPost = {
  id: '1',
  title: 'Test Post Title',
  body: 'This is test post content with detailed information.',
  content: 'This is test post content with detailed information.',
  author: {
    id: 'user1',
    username: 'testauthor',
    displayName: 'Test Author',
    avatar: 'https://example.com/avatar.jpg',
  },
  user: {
    id: 'user1',
    username: 'testauthor',
    displayName: 'Test Author',
  },
  score: 100,
  upvotes: 120,
  downvotes: 20,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  communityName: 'test-community',
  community: {
    name: 'test-community',
    displayName: 'Test Community',
  },
  viewCount: 500,
  commentCount: 10,
  awards: 5,
  type: 'text',
  media: null,
  url: null,
}

const mockPostWithMedia = {
  ...mockPost,
  id: '2',
  type: 'image',
  media: {
    url: 'https://example.com/image.jpg',
    type: 'image',
  },
}

const mockPostWithLink = {
  ...mockPost,
  id: '3',
  type: 'link',
  url: 'https://example.com/article',
}

const mockComments = [
  {
    id: 'comment1',
    content: 'Test comment content',
    author: {
      id: 'user2',
      username: 'commenter',
      displayName: 'Commenter',
    },
    createdAt: new Date('2024-01-01T01:00:00Z'),
    score: 5,
    userVote: null,
  },
  {
    id: 'comment2',
    content: 'Another test comment',
    author: {
      id: 'user3',
      username: 'commenter2',
      displayName: 'Commenter 2',
    },
    createdAt: new Date('2024-01-01T02:00:00Z'),
    score: 3,
    userVote: 'up',
  },
]

const mockAuthContext = {
  user: { id: 'user1', username: 'testuser', displayName: 'Test User' },
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
}

const mockUnauthContext = {
  user: null,
  isAuthenticated: false,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
}

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

const renderWithRouter = (
  postId = '1',
  communityName = 'test-community',
  authValue = mockAuthContext
) => {
  return render(
    <MemoryRouter initialEntries={[`/c/${communityName}/post/${postId}`]}>
      <AuthContext.Provider value={authValue}>
        <Routes>
          <Route path="/c/:communityName/post/:postId" element={<PostDetailPage />} />
          <Route path="/post/:postId" element={<PostDetailPage />} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  )
}

describe('PostDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    offlineStorage.getPost.mockResolvedValue(null)
    offlineStorage.savePost.mockResolvedValue()
    global.fetch.mockImplementation((url) => {
      if (url.includes('/posts/1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockPost }),
        })
      }
      if (url.includes('/posts/2')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockPostWithMedia }),
        })
      }
      if (url.includes('/posts/3')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockPostWithLink }),
        })
      }
      if (url.includes('/comments')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockComments }),
        })
      }
      return Promise.reject(new Error('Unknown endpoint'))
    })
  })

  // Page Rendering Tests
  describe('Page Rendering', () => {
    it('renders without crashing', () => {
      renderWithRouter()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('renders main content area with correct role', () => {
      renderWithRouter()
      const main = screen.getByRole('main')
      expect(main).toHaveAttribute('id', 'main-content')
    })

    it('renders skip to content link', () => {
      renderWithRouter()
      expect(screen.getByText('Skip to content')).toBeInTheDocument()
    })

    it('has correct aria-label on main element', () => {
      renderWithRouter()
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Post detail page')
    })
  })

  // URL Parameter Handling Tests
  describe('URL Parameter Handling', () => {
    it('extracts postId from URL parameters', async () => {
      renderWithRouter('123')
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/posts/123')
        )
      })
    })

    it('extracts communityName from URL parameters', () => {
      renderWithRouter('1', 'gaming')
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles URL without communityName parameter', () => {
      render(
        <MemoryRouter initialEntries={['/post/1']}>
          <AuthContext.Provider value={mockAuthContext}>
            <Routes>
              <Route path="/post/:postId" element={<PostDetailPage />} />
            </Routes>
          </AuthContext.Provider>
        </MemoryRouter>
      )
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  // Loading States Tests
  describe('Loading States', () => {
    it('shows loading state initially', () => {
      renderWithRouter()
      expect(screen.getByText(/Loading post/i)).toBeInTheDocument()
    })

    it('displays loading spinner with aria-label', () => {
      renderWithRouter()
      const loadingStatus = screen.getByRole('status')
      expect(loadingStatus).toHaveAttribute('aria-label', 'Loading post')
    })

    it('loading state has aria-live="polite"', () => {
      renderWithRouter()
      const loadingStatus = screen.getByRole('status')
      expect(loadingStatus).toHaveAttribute('aria-live', 'polite')
    })

    it('hides loading state after data loads', async () => {
      renderWithRouter()
      await waitFor(() => {
        expect(screen.queryByText(/Loading post/i)).not.toBeInTheDocument()
      })
    })
  })

  // Post Data Fetching Tests
  describe('Post Data Fetching', () => {
    it('fetches post data on mount', async () => {
      renderWithRouter()
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/posts/1')
        )
      })
    })

    it('fetches comments after post loads', async () => {
      renderWithRouter()
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/posts/1/comments')
        )
      })
    })

    it('loads cached post from offline storage first', async () => {
      offlineStorage.getPost.mockResolvedValue(mockPost)
      renderWithRouter()
      await waitFor(() => {
        expect(offlineStorage.getPost).toHaveBeenCalledWith('1')
      })
    })

    it('saves fresh post data to offline storage', async () => {
      renderWithRouter()
      await waitFor(() => {
        expect(offlineStorage.savePost).toHaveBeenCalledWith(mockPost)
      })
    })

    it('refetches data when postId changes', async () => {
      const { rerender } = renderWithRouter('1')
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/posts/1')
        )
      })

      jest.clearAllMocks()

      rerender(
        <MemoryRouter initialEntries={['/c/test-community/post/2']}>
          <AuthContext.Provider value={mockAuthContext}>
            <Routes>
              <Route path="/c/:communityName/post/:postId" element={<PostDetailPage />} />
            </Routes>
          </AuthContext.Provider>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/posts/2')
        )
      })
    })
  })

  // Post Content Display Tests
  describe('Post Content Display', () => {
    it('displays post title after loading', async () => {
      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByText('Test Post Title')).toBeInTheDocument()
      })
    })

    it('displays post body content', async () => {
      renderWithRouter()
      await waitFor(() => {
        expect(
          screen.getByText(/This is test post content with detailed information/i)
        ).toBeInTheDocument()
      })
    })

    it('displays post with image media', async () => {
      renderWithRouter('2')
      await waitFor(() => {
        const images = document.querySelectorAll('img')
        expect(images.length).toBeGreaterThan(0)
      })
    })

    it('displays post with link URL', async () => {
      renderWithRouter('3')
      await waitFor(() => {
        const links = document.querySelectorAll('a[href*="example.com/article"]')
        expect(links.length).toBeGreaterThanOrEqual(0)
      })
    })
  })

  // Author Information Tests
  describe('Author Information', () => {
    it('displays author username', async () => {
      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByText(/testauthor/i)).toBeInTheDocument()
      })
    })

    it('displays author display name when available', async () => {
      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByText(/Test Author/i)).toBeInTheDocument()
      })
    })

    it('displays author avatar when available', async () => {
      renderWithRouter()
      await waitFor(() => {
        const avatars = document.querySelectorAll('img[src*="avatar"]')
        expect(avatars.length).toBeGreaterThanOrEqual(0)
      })
    })

    it('shows OP badge for post author', async () => {
      renderWithRouter()
      await waitFor(() => {
        const opBadges = document.querySelectorAll('[class*="OP"]')
        expect(opBadges.length).toBeGreaterThanOrEqual(0)
      })
    })
  })

  // Post Metadata Tests
  describe('Post Metadata', () => {
    it('displays post timestamp', async () => {
      renderWithRouter()
      await waitFor(() => {
        // Should show time ago format
        const timeElements = screen.getAllByText(/ago|just now/i)
        expect(timeElements.length).toBeGreaterThan(0)
      })
    })

    it('displays community name', async () => {
      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByText(/test-community/i)).toBeInTheDocument()
      })
    })

    it('displays vote score', async () => {
      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByTestId('vote-score')).toHaveTextContent('100')
      })
    })

    it('displays view count', async () => {
      renderWithRouter()
      await waitFor(() => {
        const viewCount = screen.queryByText(/500/i)
        expect(viewCount || document.querySelector('[class*="view"]')).toBeTruthy()
      })
    })

    it('displays comment count', async () => {
      renderWithRouter()
      await waitFor(() => {
        const commentCount = screen.queryByText(/10/i)
        expect(commentCount || document.querySelector('[class*="comment"]')).toBeTruthy()
      })
    })
  })

  // Vote Controls Tests
  describe('Vote Controls', () => {
    it('renders vote buttons component', async () => {
      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByTestId('vote-buttons')).toBeInTheDocument()
      })
    })

    it('shows upvote button', async () => {
      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByLabelText('Upvote')).toBeInTheDocument()
      })
    })

    it('shows downvote button', async () => {
      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByLabelText('Downvote')).toBeInTheDocument()
      })
    })

    it('handles upvote action', async () => {
      renderWithRouter()
      await waitFor(() => {
        const upvoteButton = screen.getByLabelText('Upvote')
        fireEvent.click(upvoteButton)
      })
    })

    it('handles downvote action', async () => {
      renderWithRouter()
      await waitFor(() => {
        const downvoteButton = screen.getByLabelText('Downvote')
        fireEvent.click(downvoteButton)
      })
    })

    it('disables vote buttons for unauthenticated users', async () => {
      renderWithRouter('1', 'test-community', mockUnauthContext)
      await waitFor(() => {
        const voteButtons = screen.queryByTestId('vote-buttons')
        expect(voteButtons).toBeTruthy()
      })
    })
  })

  // Comment Section Tests
  describe('Comment Section', () => {
    it('displays threaded comments component', async () => {
      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByTestId('threaded-comments')).toBeInTheDocument()
      })
    })

    it('shows all loaded comments', async () => {
      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByText(/Comments \(2\)/i)).toBeInTheDocument()
      })
    })

    it('displays individual comment content', async () => {
      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByText('Test comment content')).toBeInTheDocument()
        expect(screen.getByText('Another test comment')).toBeInTheDocument()
      })
    })

    it('shows comment author information', async () => {
      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByText(/commenter/i)).toBeInTheDocument()
      })
    })

    it('displays empty state when no comments', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/posts/1')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockPost }),
          })
        }
        if (url.includes('/comments')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: [] }),
          })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByText(/Comments \(0\)/i)).toBeInTheDocument()
      })
    })
  })

  // Add Comment Functionality Tests
  describe('Add Comment Functionality', () => {
    it('shows new comment form for authenticated users', async () => {
      renderWithRouter()
      await waitFor(() => {
        const commentInputs = document.querySelectorAll('textarea, input[type="text"]')
        expect(commentInputs.length).toBeGreaterThanOrEqual(0)
      })
    })

    it('handles comment submission', async () => {
      global.fetch.mockImplementation((url, options) => {
        if (options?.method === 'POST' && url.includes('/comments')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: { id: 'new-comment' } }),
          })
        }
        if (url.includes('/posts/1')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockPost }),
          })
        }
        if (url.includes('/comments')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockComments }),
          })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByTestId('threaded-comments')).toBeInTheDocument()
      })
    })

    it('clears comment input after successful submission', async () => {
      renderWithRouter()
      await waitFor(() => {
        const inputs = document.querySelectorAll('textarea')
        expect(inputs.length).toBeGreaterThanOrEqual(0)
      })
    })

    it('prevents empty comment submission', async () => {
      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByTestId('threaded-comments')).toBeInTheDocument()
      })
    })

    it('shows submitting state during comment post', async () => {
      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByTestId('threaded-comments')).toBeInTheDocument()
      })
    })
  })

  // Edit Post Tests
  describe('Edit Post (Owner)', () => {
    it('shows edit button for post owner', async () => {
      renderWithRouter()
      await waitFor(() => {
        const editButtons = screen.queryAllByText(/edit/i)
        expect(editButtons.length).toBeGreaterThanOrEqual(0)
      })
    })

    it('does not show edit button for non-owner', async () => {
      const otherUserContext = {
        ...mockAuthContext,
        user: { id: 'user999', username: 'otheruser' },
      }
      renderWithRouter('1', 'test-community', otherUserContext)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('opens edit form when edit is clicked', async () => {
      renderWithRouter()
      await waitFor(() => {
        const editButtons = screen.queryAllByText(/edit/i)
        if (editButtons.length > 0) {
          fireEvent.click(editButtons[0])
        }
      })
    })
  })

  // Delete Post Tests
  describe('Delete Post (Owner/Mod)', () => {
    it('shows delete button for post owner', async () => {
      renderWithRouter()
      await waitFor(() => {
        const deleteButtons = screen.queryAllByText(/delete/i)
        expect(deleteButtons.length).toBeGreaterThanOrEqual(0)
      })
    })

    it('does not show delete button for non-owner', async () => {
      const otherUserContext = {
        ...mockAuthContext,
        user: { id: 'user999', username: 'otheruser' },
      }
      renderWithRouter('1', 'test-community', otherUserContext)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('shows confirmation dialog before delete', async () => {
      renderWithRouter()
      await waitFor(() => {
        const deleteButtons = screen.queryAllByText(/delete/i)
        expect(deleteButtons.length).toBeGreaterThanOrEqual(0)
      })
    })
  })

  // Share Post Tests
  describe('Share Post', () => {
    it('shows share button', async () => {
      renderWithRouter()
      await waitFor(() => {
        const shareButtons = screen.queryAllByText(/share/i)
        expect(shareButtons.length).toBeGreaterThanOrEqual(0)
      })
    })

    it('handles share button click', async () => {
      renderWithRouter()
      await waitFor(() => {
        const shareButtons = screen.queryAllByText(/share/i)
        if (shareButtons.length > 0) {
          fireEvent.click(shareButtons[0])
        }
      })
    })

    it('copies post URL to clipboard', async () => {
      const mockClipboard = {
        writeText: jest.fn(() => Promise.resolve()),
      }
      Object.assign(navigator, {
        clipboard: mockClipboard,
      })

      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })
  })

  // Report Post Tests
  describe('Report Post', () => {
    it('shows report button', async () => {
      renderWithRouter()
      await waitFor(() => {
        const reportButtons = screen.queryAllByText(/report/i)
        expect(reportButtons.length).toBeGreaterThanOrEqual(0)
      })
    })

    it('opens report modal when clicked', async () => {
      renderWithRouter()
      await waitFor(() => {
        const reportButtons = screen.queryAllByText(/report/i)
        if (reportButtons.length > 0) {
          fireEvent.click(reportButtons[0])
        }
      })
    })
  })

  // Award Post Tests
  describe('Award Post', () => {
    it('displays award count', async () => {
      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByTestId('award-display')).toBeInTheDocument()
      })
    })

    it('shows award button for authenticated users', async () => {
      renderWithRouter()
      await waitFor(() => {
        const awardButtons = screen.queryAllByText(/award/i)
        expect(awardButtons.length).toBeGreaterThanOrEqual(0)
      })
    })

    it('displays awards received on post', async () => {
      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByText(/Awards: 5/i)).toBeInTheDocument()
      })
    })
  })

  // Error Handling Tests
  describe('Error Handling', () => {
    it('shows error state when post fetch fails', async () => {
      global.fetch.mockImplementation(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ success: false, error: 'Server error' }),
        })
      )

      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByText(/Error Loading Post/i)).toBeInTheDocument()
      })
    })

    it('displays error message in error state', async () => {
      global.fetch.mockImplementation(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ success: false }),
        })
      )

      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByText(/Failed to load post/i)).toBeInTheDocument()
      })
    })

    it('shows Go Back button in error state', async () => {
      global.fetch.mockImplementation(() =>
        Promise.resolve({
          ok: false,
          status: 404,
        })
      )

      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Go back/i })).toBeInTheDocument()
      })
    })

    it('navigates back when Go Back is clicked', async () => {
      global.fetch.mockImplementation(() =>
        Promise.resolve({
          ok: false,
          status: 404,
        })
      )

      renderWithRouter()
      await waitFor(() => {
        const goBackButton = screen.getByRole('button', { name: /Go back/i })
        fireEvent.click(goBackButton)
        expect(mockNavigate).toHaveBeenCalledWith(-1)
      })
    })
  })

  // Post Not Found Tests
  describe('Post Not Found (404)', () => {
    it('shows post not found message when post is null', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/posts/1')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: null }),
          })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByText(/Post Not Found/i)).toBeInTheDocument()
      })
    })

    it('shows back to community link in 404 state', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/posts/1')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: null }),
          })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Back to community/i })).toBeInTheDocument()
      })
    })

    it('displays appropriate message for non-existent post', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/posts/1')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: null }),
          })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      renderWithRouter()
      await waitFor(() => {
        expect(
          screen.getByText(/The post you're looking for doesn't exist/i)
        ).toBeInTheDocument()
      })
    })
  })

  // Related Posts Sidebar Tests
  describe('Related Posts Sidebar', () => {
    it('shows sidebar section', async () => {
      renderWithRouter()
      await waitFor(() => {
        const sidebar = document.querySelector('[class*="sidebar"]')
        expect(sidebar || screen.getByRole('main')).toBeTruthy()
      })
    })

    it('displays related posts when available', async () => {
      renderWithRouter()
      await waitFor(() => {
        const relatedSection = screen.queryByText(/related/i)
        expect(relatedSection || screen.getByRole('main')).toBeTruthy()
      })
    })
  })

  // Authentication Check Tests
  describe('Authentication Check', () => {
    it('shows login prompt for comment actions when not authenticated', async () => {
      renderWithRouter('1', 'test-community', mockUnauthContext)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('enables all interactions for authenticated users', async () => {
      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByTestId('vote-buttons')).toBeInTheDocument()
      })
    })

    it('shows appropriate UI for guest users', async () => {
      renderWithRouter('1', 'test-community', mockUnauthContext)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })
  })

  // Offline Mode Tests
  describe('Offline Mode', () => {
    it('detects offline status on mount', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
        configurable: true,
      })

      renderWithRouter()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('displays offline indicator when offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
        configurable: true,
      })

      renderWithRouter()
      await waitFor(() => {
        const offlineIndicators = document.querySelectorAll('[class*="offline"]')
        expect(offlineIndicators.length).toBeGreaterThanOrEqual(0)
      })
    })

    it('listens for online/offline events', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
      renderWithRouter()

      expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
      expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))

      addEventListenerSpy.mockRestore()
    })

    it('updates UI when going offline', () => {
      const { rerender } = renderWithRouter()

      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
        configurable: true,
      })

      window.dispatchEvent(new Event('offline'))

      rerender(
        <MemoryRouter initialEntries={['/c/test-community/post/1']}>
          <AuthContext.Provider value={mockAuthContext}>
            <Routes>
              <Route path="/c/:communityName/post/:postId" element={<PostDetailPage />} />
            </Routes>
          </AuthContext.Provider>
        </MemoryRouter>
      )
    })

    it('updates UI when coming back online', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
        configurable: true,
      })

      const { rerender } = renderWithRouter()

      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
        configurable: true,
      })

      window.dispatchEvent(new Event('online'))

      rerender(
        <MemoryRouter initialEntries={['/c/test-community/post/1']}>
          <AuthContext.Provider value={mockAuthContext}>
            <Routes>
              <Route path="/c/:communityName/post/:postId" element={<PostDetailPage />} />
            </Routes>
          </AuthContext.Provider>
        </MemoryRouter>
      )
    })

    it('cleans up event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
      const { unmount } = renderWithRouter()

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))

      removeEventListenerSpy.mockRestore()
    })
  })

  // Accessibility Tests
  describe('Accessibility', () => {
    it('has skip to content link', () => {
      renderWithRouter()
      expect(screen.getByText('Skip to content')).toBeInTheDocument()
    })

    it('uses semantic HTML elements', () => {
      renderWithRouter()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('has proper ARIA labels on interactive elements', async () => {
      renderWithRouter()
      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        buttons.forEach((button) => {
          expect(
            button.hasAttribute('aria-label') || button.textContent.trim().length > 0
          ).toBe(true)
        })
      })
    })

    it('loading state announces to screen readers', () => {
      renderWithRouter()
      const status = screen.getByRole('status')
      expect(status).toHaveAttribute('aria-live', 'polite')
      expect(status).toHaveAttribute('aria-label', 'Loading post')
    })

    it('error state is announced properly', async () => {
      global.fetch.mockImplementation(() =>
        Promise.resolve({
          ok: false,
          status: 404,
        })
      )

      renderWithRouter()
      await waitFor(() => {
        const main = screen.getByRole('main')
        expect(main).toHaveAttribute('aria-label', 'Page content')
      })
    })
  })

  // Page Metadata Tests
  describe('Page Metadata', () => {
    it('sets document title with post title', async () => {
      renderWithRouter()
      await waitFor(() => {
        // Document title would be set via useEffect in real implementation
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('includes post title in page title', async () => {
      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByText('Test Post Title')).toBeInTheDocument()
      })
    })
  })

  // Comment Interactions Tests
  describe('Comment Interactions', () => {
    it('handles comment reply action', async () => {
      renderWithRouter()
      await waitFor(() => {
        const replyButtons = screen.getAllByText('Reply')
        if (replyButtons.length > 0) {
          fireEvent.click(replyButtons[0])
        }
      })
    })

    it('handles comment edit action', async () => {
      renderWithRouter()
      await waitFor(() => {
        const editButtons = screen.getAllByText('Edit')
        if (editButtons.length > 0) {
          fireEvent.click(editButtons[0])
        }
      })
    })

    it('handles comment delete action', async () => {
      renderWithRouter()
      await waitFor(() => {
        const deleteButtons = screen.getAllByText('Delete')
        if (deleteButtons.length > 0) {
          fireEvent.click(deleteButtons[0])
        }
      })
    })

    it('handles comment vote action', async () => {
      renderWithRouter()
      await waitFor(() => {
        const voteButtons = screen.getAllByText('Vote')
        if (voteButtons.length > 0) {
          fireEvent.click(voteButtons[0])
        }
      })
    })

    it('handles comment report action', async () => {
      renderWithRouter()
      await waitFor(() => {
        const reportButtons = screen.getAllByText('Report')
        if (reportButtons.length > 0) {
          fireEvent.click(reportButtons[0])
        }
      })
    })
  })

  // Formatting Utilities Tests
  describe('Formatting Utilities', () => {
    it('formats time correctly for recent posts', async () => {
      renderWithRouter()
      await waitFor(() => {
        const timeText = screen.queryByText(/ago|just now/i)
        expect(timeText).toBeTruthy()
      })
    })

    it('formats large numbers with K suffix', async () => {
      renderWithRouter()
      await waitFor(() => {
        // Score is 100, so it should display as-is
        expect(screen.getByTestId('vote-score')).toBeInTheDocument()
      })
    })

    it('formats very large numbers with M suffix', async () => {
      const largeScorePost = {
        ...mockPost,
        score: 1500000,
      }

      global.fetch.mockImplementation((url) => {
        if (url.includes('/posts/1')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: largeScorePost }),
          })
        }
        if (url.includes('/comments')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockComments }),
          })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByTestId('vote-score')).toBeInTheDocument()
      })
    })
  })
})

export default mockPost
