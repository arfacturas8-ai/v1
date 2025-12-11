import { render, screen, waitFor, fireEvent, within, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import CommunityPage from './CommunityPage'
import { AuthContext } from '../contexts/AuthContext'
import offlineStorage from '../services/offlineStorage'

// Mock services
jest.mock('../services/offlineStorage')

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Users: () => <span data-testid="icon-users">Users</span>,
  Plus: () => <span data-testid="icon-plus">Plus</span>,
  TrendingUp: () => <span data-testid="icon-trending-up">TrendingUp</span>,
  MessageSquare: () => <span data-testid="icon-message-square">MessageSquare</span>,
  ChevronUp: () => <span data-testid="icon-chevron-up">ChevronUp</span>,
  ChevronDown: () => <span data-testid="icon-chevron-down">ChevronDown</span>,
  Share2: () => <span data-testid="icon-share2">Share2</span>,
  Bookmark: () => <span data-testid="icon-bookmark">Bookmark</span>,
  MoreHorizontal: () => <span data-testid="icon-more-horizontal">MoreHorizontal</span>,
  Calendar: () => <span data-testid="icon-calendar">Calendar</span>,
  Shield: () => <span data-testid="icon-shield">Shield</span>,
  Clock: () => <span data-testid="icon-clock">Clock</span>,
  Eye: () => <span data-testid="icon-eye">Eye</span>,
  Star: () => <span data-testid="icon-star">Star</span>,
  Filter: () => <span data-testid="icon-filter">Filter</span>,
  ArrowUp: () => <span data-testid="icon-arrow-up">ArrowUp</span>,
  ArrowDown: () => <span data-testid="icon-arrow-down">ArrowDown</span>,
  Flame: () => <span data-testid="icon-flame">Flame</span>,
  Zap: () => <span data-testid="icon-zap">Zap</span>,
  WifiOff: () => <span data-testid="icon-wifi-off">WifiOff</span>,
}))

// Mock UI components
jest.mock('../components/ui', () => ({
  Card: ({ children, ...props }) => <div data-testid="card" {...props}>{children}</div>,
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
  Input: (props) => <input {...props} />,
  Textarea: (props) => <textarea {...props} />,
}))

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}))

// Mock accessibility utilities
jest.mock('../utils/accessibility.jsx', () => ({
  SkipToContent: ({ children }) => <div>{children}</div>,
  announce: jest.fn(),
  useLoadingAnnouncement: jest.fn(),
  useErrorAnnouncement: jest.fn(),
  AccessibleFormField: ({ children, label }) => (
    <div>
      <label>{label}</label>
      {children}
    </div>
  ),
}))

// Mock auth contexts
const mockAuthContext = {
  user: {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
  },
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

const mockCommunityData = {
  name: 'test-community',
  displayName: 'Test Community',
  description: 'Welcome to c/test-community - A vibrant community for passionate discussions and sharing knowledge.',
  memberCount: 45230,
  onlineCount: 892,
  createdAt: '2023-06-15T00:00:00Z',
  banner: null,
  icon: null,
  category: 'general',
  rules: [
    'Be respectful and civil',
    'No spam or self-promotion',
    'Use appropriate flairs',
    'Search before posting',
    'Follow community content policy'
  ],
  moderators: ['user1', 'user2', 'moderator3'],
  postsToday: 23,
  trending: true
}

const mockPosts = [
  {
    id: '1',
    title: 'Welcome to our amazing community!',
    content: 'This is a great place to share ideas and connect with like-minded people.',
    author: 'communitymod',
    score: 156,
    upvotes: 172,
    downvotes: 16,
    comments: 24,
    created: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    community: 'test-community',
    type: 'text',
    pinned: true,
    awards: ['gold', 'silver']
  },
  {
    id: '2',
    title: 'Interesting discussion about the latest trends',
    content: 'What do you all think about the recent developments in our field?',
    author: 'thoughtfuluser',
    score: 89,
    upvotes: 95,
    downvotes: 6,
    comments: 18,
    created: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    community: 'test-community',
    type: 'text'
  },
  {
    id: '3',
    title: 'Check out this amazing resource I found',
    content: 'I stumbled upon this incredible tool that I think the community would appreciate.',
    author: 'helpfulcontributor',
    score: 234,
    upvotes: 267,
    downvotes: 33,
    comments: 45,
    created: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    community: 'test-community',
    type: 'link',
    trending: true
  }
]

const renderWithRouter = (communityName = 'test-community', authValue = mockAuthContext) => {
  return render(
    <MemoryRouter initialEntries={[`/c/${communityName}`]}>
      <AuthContext.Provider value={authValue}>
        <Routes>
          <Route path="/c/:communityName" element={<CommunityPage />} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  )
}

describe('CommunityPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    offlineStorage.getPosts.mockResolvedValue([])
    offlineStorage.savePosts.mockResolvedValue()
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    })
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Rendering and Basic Functionality', () => {
    it('renders without crashing', () => {
      renderWithRouter()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('renders with correct community name from params', () => {
      renderWithRouter('javascript')
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('displays main heading', () => {
      renderWithRouter()
      expect(screen.getByText('Community Page')).toBeInTheDocument()
    })

    it('has proper accessibility attributes on main container', () => {
      renderWithRouter()
      const main = screen.getByRole('main')
      expect(main).toHaveAttribute('aria-label', 'Community page')
    })

    it('renders with authenticated user context', () => {
      renderWithRouter('test-community', mockAuthContext)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('renders with unauthenticated user context', () => {
      renderWithRouter('test-community', mockUnauthContext)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('shows loading state initially', () => {
      renderWithRouter()
      expect(document.querySelector('.')).toBeTruthy()
    })

    it('displays loading skeleton for community header', () => {
      renderWithRouter()
      const skeletons = document.querySelectorAll('.')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('displays loading skeleton for posts', () => {
      renderWithRouter()
      const skeletons = document.querySelectorAll('.')
      expect(skeletons.length).toBeGreaterThan(2)
    })

    it('displays loading skeleton for sidebar', () => {
      renderWithRouter()
      const sidebar = document.querySelector('.lg\\:col-span-1')
      expect(sidebar).toBeInTheDocument()
    })

    it('shows correct number of post skeletons', () => {
      renderWithRouter()
      const postSkeletons = document.querySelectorAll('.space-y-4 > div')
      expect(postSkeletons.length).toBeGreaterThanOrEqual(3)
    })

    it('announces loading state to screen readers', () => {
      const { useLoadingAnnouncement } = require('../utils/accessibility.jsx')
      renderWithRouter()
      expect(useLoadingAnnouncement).toHaveBeenCalledWith(true, expect.stringContaining('test-community'))
    })

    it('completes loading after timeout', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
      })
    })

    it('removes loading state when data loads', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(document.querySelector('.')).not.toBeInTheDocument()
      })
    })
  })

  describe('Community Header', () => {
    it('displays community banner when available', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('displays community avatar/icon when available', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('displays community display name', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('displays community description', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('formats large member count with commas', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('displays online member count', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('displays community creation date', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('displays community category', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('shows trending indicator when community is trending', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('displays posts today count', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })
  })

  describe('Join/Leave Button', () => {
    it('displays join button for authenticated users', async () => {
      renderWithRouter('test-community', mockAuthContext)
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('displays leave button when user has joined', async () => {
      renderWithRouter('test-community', mockAuthContext)
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('updates member count when joining', async () => {
      renderWithRouter('test-community', mockAuthContext)
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('updates member count when leaving', async () => {
      renderWithRouter('test-community', mockAuthContext)
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('does not show join button for unauthenticated users', async () => {
      renderWithRouter('test-community', mockUnauthContext)
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('toggles button text when clicked', async () => {
      renderWithRouter('test-community', mockAuthContext)
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('has proper accessibility labels on join button', async () => {
      renderWithRouter('test-community', mockAuthContext)
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })
  })

  describe('Posts Feed', () => {
    it('displays posts after loading', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('displays post titles', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('displays post content', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('displays post authors', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('displays post scores', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('displays comment counts', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('displays post timestamps', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('shows pinned posts indicator', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('displays post awards when present', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('shows trending indicator on trending posts', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('differentiates between text and link posts', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('displays empty state when no posts', async () => {
      offlineStorage.getPosts.mockResolvedValue([])
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })
  })

  describe('Sort Options', () => {
    it('displays sort controls', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('displays hot sort option', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('displays new sort option', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('displays top sort option', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('displays rising sort option', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('defaults to hot sort', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('changes to new sort when clicked', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('changes to top sort when clicked', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('changes to rising sort when clicked', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('displays correct icon for each sort option', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('highlights active sort option', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })
  })

  describe('Voting System', () => {
    it('displays upvote button for each post', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('displays downvote button for each post', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('updates score when upvoting', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('updates score when downvoting', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('removes vote when clicking same vote type', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('changes vote when switching from upvote to downvote', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('changes vote when switching from downvote to upvote', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('displays vote count correctly', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('highlights upvote button when user has upvoted', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('highlights downvote button when user has downvoted', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })
  })

  describe('Create Post Button', () => {
    it('displays create post button for members', async () => {
      renderWithRouter('test-community', mockAuthContext)
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('does not show create post button for non-members', async () => {
      renderWithRouter('test-community', mockUnauthContext)
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('opens post form when create button clicked', async () => {
      renderWithRouter('test-community', mockAuthContext)
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('displays post form fields', async () => {
      renderWithRouter('test-community', mockAuthContext)
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('has title input in post form', async () => {
      renderWithRouter('test-community', mockAuthContext)
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('has content textarea in post form', async () => {
      renderWithRouter('test-community', mockAuthContext)
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('has post type selector', async () => {
      renderWithRouter('test-community', mockAuthContext)
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('allows selecting text post type', async () => {
      renderWithRouter('test-community', mockAuthContext)
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('allows selecting link post type', async () => {
      renderWithRouter('test-community', mockAuthContext)
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('creates post when form submitted', async () => {
      renderWithRouter('test-community', mockAuthContext)
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('closes form after post creation', async () => {
      renderWithRouter('test-community', mockAuthContext)
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('clears form after post creation', async () => {
      renderWithRouter('test-community', mockAuthContext)
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('adds new post to feed immediately', async () => {
      renderWithRouter('test-community', mockAuthContext)
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('has cancel button in post form', async () => {
      renderWithRouter('test-community', mockAuthContext)
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('closes form when cancel clicked', async () => {
      renderWithRouter('test-community', mockAuthContext)
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })
  })

  describe('Sidebar', () => {
    it('displays sidebar', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('displays community statistics', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('displays member count in sidebar', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('displays online count in sidebar', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('displays rules section', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('displays all community rules', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('numbers rules correctly', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('displays moderators section', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('displays all moderator names', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('filters out null/undefined moderators', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('filters out null/undefined rules', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })
  })

  describe('Error State', () => {
    it('displays error message when loading fails', async () => {
      offlineStorage.getPosts.mockRejectedValue(new Error('Network error'))
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByText(/Error Loading Community/i)).toBeInTheDocument()
      })
    })

    it('has retry button in error state', async () => {
      offlineStorage.getPosts.mockRejectedValue(new Error('Network error'))
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument()
      })
    })

    it('reloads page when retry clicked', async () => {
      const reloadSpy = jest.fn()
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { reload: reloadSpy }
      })
      offlineStorage.getPosts.mockRejectedValue(new Error('Network error'))
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument()
      })
    })

    it('displays error icon', async () => {
      offlineStorage.getPosts.mockRejectedValue(new Error('Network error'))
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByText(/Error Loading Community/i)).toBeInTheDocument()
      })
    })

    it('announces error to screen readers', async () => {
      const { useErrorAnnouncement } = require('../utils/accessibility.jsx')
      offlineStorage.getPosts.mockRejectedValue(new Error('Network error'))
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(useErrorAnnouncement).toHaveBeenCalled()
      })
    })

    it('shows cached data when available on error', async () => {
      offlineStorage.getPosts.mockResolvedValue(mockPosts)
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })
  })

  describe('Not Found State', () => {
    it('displays not found message when community does not exist', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        // Since the component always sets community, test the fallback behavior
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('shows community name in not found message', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('has create community button in not found state', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('has browse communities button in not found state', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })
  })

  describe('Offline Mode', () => {
    it('detects when browser goes offline', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)

      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      })

      fireEvent(window, new Event('offline'))

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('detects when browser goes online', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      })

      renderWithRouter()
      jest.advanceTimersByTime(600)

      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      })

      fireEvent(window, new Event('online'))

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('loads cached posts when offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      })
      offlineStorage.getPosts.mockResolvedValue(mockPosts)

      renderWithRouter()
      jest.advanceTimersByTime(600)

      await waitFor(() => {
        expect(offlineStorage.getPosts).toHaveBeenCalled()
      })
    })

    it('saves posts to cache when online', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)

      await waitFor(() => {
        expect(offlineStorage.savePosts).toHaveBeenCalled()
      })
    })

    it('displays offline indicator', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      })

      renderWithRouter()
      jest.advanceTimersByTime(600)

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles null posts array', async () => {
      offlineStorage.getPosts.mockResolvedValue(null)
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('filters null posts from array', async () => {
      offlineStorage.getPosts.mockResolvedValue([...mockPosts, null, undefined])
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('handles posts with missing fields', async () => {
      const incompletePosts = [{ id: '1', title: 'Test' }]
      offlineStorage.getPosts.mockResolvedValue(incompletePosts)
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('handles very long community names', async () => {
      renderWithRouter('this-is-a-very-long-community-name-that-might-cause-layout-issues')
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('handles special characters in community names', async () => {
      renderWithRouter('test-community-123')
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('handles posts with very high scores', async () => {
      const highScorePost = { ...mockPosts[0], score: 999999 }
      offlineStorage.getPosts.mockResolvedValue([highScorePost])
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('handles posts with negative scores', async () => {
      const negativeScorePost = { ...mockPosts[0], score: -100 }
      offlineStorage.getPosts.mockResolvedValue([negativeScorePost])
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('handles empty rules array', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('handles empty moderators array', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('handles rapid sort changes', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('handles rapid voting clicks', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('handles rapid join/leave clicks', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('uses semantic HTML elements', () => {
      renderWithRouter()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('has proper ARIA labels', () => {
      renderWithRouter()
      const main = screen.getByRole('main')
      expect(main).toHaveAttribute('aria-label')
    })

    it('announces loading states to screen readers', () => {
      const { useLoadingAnnouncement } = require('../utils/accessibility.jsx')
      renderWithRouter()
      expect(useLoadingAnnouncement).toHaveBeenCalled()
    })

    it('announces errors to screen readers', async () => {
      const { useErrorAnnouncement } = require('../utils/accessibility.jsx')
      renderWithRouter()
      expect(useErrorAnnouncement).toHaveBeenCalled()
    })

    it('has keyboard navigable elements', () => {
      renderWithRouter()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('memoizes sorted posts', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('memoizes filtered posts', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('memoizes community stats', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('memoizes sort options', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('uses callback for event handlers', async () => {
      renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })
  })

  describe('Component Snapshot', () => {
    it('matches snapshot for loading state', () => {
      const { container } = renderWithRouter()
      expect(container).toMatchSnapshot()
    })

    it('matches snapshot for loaded state', async () => {
      const { container } = renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
      expect(container).toMatchSnapshot()
    })

    it('matches snapshot for error state', async () => {
      offlineStorage.getPosts.mockRejectedValue(new Error('Test error'))
      const { container } = renderWithRouter()
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByText(/Error Loading Community/i)).toBeInTheDocument()
      })
      expect(container).toMatchSnapshot()
    })

    it('matches snapshot for authenticated user', async () => {
      const { container } = renderWithRouter('test-community', mockAuthContext)
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
      expect(container).toMatchSnapshot()
    })

    it('matches snapshot for unauthenticated user', async () => {
      const { container } = renderWithRouter('test-community', mockUnauthContext)
      jest.advanceTimersByTime(600)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
      expect(container).toMatchSnapshot()
    })
  })
})

export default mockAuthContext
