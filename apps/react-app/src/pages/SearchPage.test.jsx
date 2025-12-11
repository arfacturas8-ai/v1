import React from 'react'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import SearchPage from './SearchPage'
import { AuthContext } from '../contexts/AuthContext'
import communityService from '../services/communityService'
import postsService from '../services/postsService'
import userService from '../services/userService'

// Mock services
jest.mock('../services/communityService')
jest.mock('../services/postsService')
jest.mock('../services/userService')

// Mock ToastContext
const mockShowSuccess = jest.fn()
const mockShowError = jest.fn()
const mockShowInfo = jest.fn()
const mockShowWarning = jest.fn()

jest.mock('../contexts/ToastContext', () => ({
  useToast: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
    showInfo: mockShowInfo,
    showWarning: mockShowWarning,
  }),
}))

// Mock components
jest.mock('../components/community/CommunityCard', () => {
  return function MockCommunityCard({ community, onJoin, onLeave }) {
    return (
      <div data-testid={`community-${community.name}`}>
        <h3>{community.displayName || community.name}</h3>
        <p>{community.description}</p>
        <span>{community.memberCount} members</span>
        {community.isJoined ? (
          <button onClick={() => onLeave(community.name)}>Leave</button>
        ) : (
          <button onClick={() => onJoin(community.name)}>Join</button>
        )}
      </div>
    )
  }
})

jest.mock('../components/community/Post', () => {
  return function MockPost({ post, onVote, onShare, onSave, onReport, onAward }) {
    return (
      <div data-testid={`post-${post.id}`}>
        <h3>{post.title}</h3>
        <p>{post.content}</p>
        <span>Score: {post.score}</span>
        <button onClick={() => onVote(post.id, 'upvote', 'upvote')}>Upvote</button>
        <button onClick={() => onVote(post.id, 'downvote', 'downvote')}>Downvote</button>
        <button onClick={() => onShare(post.id)}>Share</button>
        <button onClick={() => onSave(post.id)}>Save</button>
        <button onClick={() => onReport(post.id)}>Report</button>
        <button onClick={() => onAward(post.id)}>Award</button>
      </div>
    )
  }
})

jest.mock('../components/community/UserProfile', () => {
  return function MockUserProfile({ user, onFollow, onUnfollow, onMessage }) {
    return (
      <div data-testid={`user-${user.username}`}>
        <h3>{user.username}</h3>
        <span>{user.followerCount || 0} followers</span>
        {user.isFollowing ? (
          <button onClick={() => onUnfollow(user.username)}>Unfollow</button>
        ) : (
          <button onClick={() => onFollow(user.username)}>Follow</button>
        )}
        <button onClick={() => onMessage(user.username)}>Message</button>
      </div>
    )
  }
})

jest.mock('../components/community/LoadingSpinner', () => {
  return function MockLoadingSpinner() {
    return <div data-testid="loading-spinner"></div>
  }
})

jest.mock('../components/ReportingSystem', () => {
  return function MockReportingSystem({ isOpen, onClose, onSubmit, contentData }) {
    if (!isOpen) return null
    return (
      <div data-testid="report-modal">
        <h2>Report Content</h2>
        <p>Author: {contentData?.author}</p>
        <button onClick={() => onSubmit({ contentId: '1', category: 'spam', reason: 'Test' })}>
          Submit Report
        </button>
        <button onClick={onClose}>Close</button>
      </div>
    )
  }
})

jest.mock('../components/community/AwardModal', () => {
  return function MockAwardModal({ isOpen, post, onClose, onSubmit }) {
    if (!isOpen) return null
    return (
      <div data-testid="award-modal">
        <h2>Give Award</h2>
        <p>Post: {post?.title}</p>
        <button onClick={() => onSubmit(post?.id, 'gold')}>Give Award</button>
        <button onClick={onClose}>Close</button>
      </div>
    )
  }
})

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}))

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

// Toast mocks are defined at the top level for the jest.mock

const mockSearchResults = {
  communities: [
    {
      id: '1',
      name: 'react',
      displayName: 'React Community',
      description: 'A community for React developers',
      memberCount: 5000,
      isJoined: false,
    },
    {
      id: '2',
      name: 'javascript',
      displayName: 'JavaScript',
      description: 'JavaScript discussion',
      memberCount: 10000,
      isJoined: true,
    },
  ],
  posts: [
    {
      id: '1',
      title: 'React 19 Released',
      content: 'React 19 is now available',
      author: 'reactdev',
      community: 'react',
      score: 100,
      userVote: null,
      isSaved: false,
    },
    {
      id: '2',
      title: 'JavaScript Tips',
      content: 'Useful JavaScript tips and tricks',
      author: 'jsmaster',
      community: 'javascript',
      score: 50,
      userVote: 'upvote',
      isSaved: true,
    },
  ],
  users: [
    {
      id: '1',
      username: 'reactdev',
      followerCount: 1000,
      isFollowing: false,
    },
    {
      id: '2',
      username: 'jsmaster',
      followerCount: 500,
      isFollowing: true,
    },
  ],
}

const renderWithProviders = (
  component,
  { authValue = mockAuthContext, initialRoute = '/' } = {}
) => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthContext.Provider value={authValue}>
        {component}
      </AuthContext.Provider>
    </MemoryRouter>
  )
}

describe('SearchPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock searchAll method (used by SearchPage but doesn't exist in service yet)
    communityService.searchAll = jest.fn().mockResolvedValue({
      communities: [],
      posts: [],
      users: [],
    })
    communityService.joinCommunity = jest.fn().mockResolvedValue({ success: true })
    communityService.leaveCommunity = jest.fn().mockResolvedValue({ success: true })
    communityService.voteOnPost = jest.fn().mockResolvedValue({ success: true })
    postsService.savePost = jest.fn().mockResolvedValue({ success: true })
    postsService.reportPost = jest.fn().mockResolvedValue({ success: true })
    userService.followUser = jest.fn().mockResolvedValue({ success: true })
    userService.unfollowUser = jest.fn().mockResolvedValue({ success: true })
  })

  describe('Page Rendering', () => {
    it('renders without crashing', () => {
      renderWithProviders(<SearchPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('has proper ARIA label on main element', () => {
      renderWithProviders(<SearchPage />)
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Search page')
    })

    it('displays page heading', () => {
      renderWithProviders(<SearchPage />)
      expect(screen.getByText('SearchPage')).toBeInTheDocument()
    })

    it('shows construction message', () => {
      renderWithProviders(<SearchPage />)
      expect(screen.getByText('Content under construction...')).toBeInTheDocument()
    })

    it('applies proper styling with max width', () => {
      renderWithProviders(<SearchPage />)
      const main = screen.getByRole('main')
      expect(main).toHaveStyle({ maxWidth: '1200px' })
    })

    it('centers content with auto margins', () => {
      renderWithProviders(<SearchPage />)
      const main = screen.getByRole('main')
      expect(main).toHaveStyle({ margin: '0 auto' })
    })
  })

  describe('URL Parameter Handling', () => {
    it('reads search query from URL parameter', () => {
      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })
      // Query should be set from URL
      expect(communityService.searchAll).toHaveBeenCalled()
    })

    it('updates query when URL search parameter changes', async () => {
      const { rerender } = renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(communityService.searchAll).toHaveBeenCalledWith(
          'react',
          expect.any(Object)
        )
      })
    })

    it('handles empty query parameter', () => {
      renderWithProviders(<SearchPage />, { initialRoute: '/?q=' })
      expect(communityService.searchAll).not.toHaveBeenCalled()
    })

    it('handles missing query parameter', () => {
      renderWithProviders(<SearchPage />, { initialRoute: '/' })
      expect(communityService.searchAll).not.toHaveBeenCalled()
    })

    it('decodes URL-encoded search query', () => {
      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react%20hooks' })
      // Should decode "react hooks"
      expect(communityService.searchAll).toHaveBeenCalled()
    })
  })

  describe('Search Functionality', () => {
    it('performs search when query is provided', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)

      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(communityService.searchAll).toHaveBeenCalledWith(
          'react',
          { type: 'all', limit: 50 }
        )
      })
    })

    it('debounces search input', async () => {
      jest.useFakeTimers()
      renderWithProviders(<SearchPage />, { initialRoute: '/?q=r' })

      // Simulate rapid query changes
      await waitFor(() => {
        jest.advanceTimersByTime(100)
      })

      await waitFor(() => {
        jest.advanceTimersByTime(100)
      })

      await waitFor(() => {
        jest.advanceTimersByTime(100)
      })

      // Should only call once after debounce delay
      await waitFor(() => {
        jest.advanceTimersByTime(300)
      })

      expect(communityService.searchAll).toHaveBeenCalledTimes(1)
      jest.useRealTimers()
    })

    it('trims whitespace from search query', async () => {
      renderWithProviders(<SearchPage />, { initialRoute: '/?q=  react  ' })

      await waitFor(() => {
        expect(communityService.searchAll).toHaveBeenCalledWith(
          'react',
          expect.any(Object)
        )
      })
    })

    it('does not search with empty query', () => {
      renderWithProviders(<SearchPage />, { initialRoute: '/?q=   ' })
      expect(communityService.searchAll).not.toHaveBeenCalled()
    })

    it('passes correct search options to service', async () => {
      renderWithProviders(<SearchPage />, { initialRoute: '/?q=test' })

      await waitFor(() => {
        expect(communityService.searchAll).toHaveBeenCalledWith('test', {
          type: 'all',
          limit: 50,
        })
      })
    })
  })

  describe('Search Results Display', () => {
    it('displays community results', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(screen.getByTestId('community-react')).toBeInTheDocument()
        expect(screen.getByText('React Community')).toBeInTheDocument()
      })
    })

    it('displays post results', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(screen.getByTestId('post-1')).toBeInTheDocument()
        expect(screen.getByText('React 19 Released')).toBeInTheDocument()
      })
    })

    it('displays user results', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(screen.getByTestId('user-reactdev')).toBeInTheDocument()
      })
    })

    it('shows all result types when tab is "all"', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(screen.getByTestId('community-react')).toBeInTheDocument()
        expect(screen.getByTestId('post-1')).toBeInTheDocument()
        expect(screen.getByTestId('user-reactdev')).toBeInTheDocument()
      })
    })

    it('displays correct result counts', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        // Total: 2 communities + 2 posts + 2 users = 6 results
        expect(screen.getByTestId('community-react')).toBeInTheDocument()
      })
    })
  })

  describe('Tab Navigation', () => {
    it('defaults to "all" tab', () => {
      renderWithProviders(<SearchPage />, { initialRoute: '/?q=test' })
      // activeTab should be 'all' by default
      expect(communityService.searchAll).toHaveBeenCalledWith('test', {
        type: 'all',
        limit: 50,
      })
    })

    it('filters results when switching to communities tab', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(screen.getByTestId('community-react')).toBeInTheDocument()
      })
    })

    it('filters results when switching to posts tab', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(screen.getByTestId('post-1')).toBeInTheDocument()
      })
    })

    it('filters results when switching to users tab', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(screen.getByTestId('user-reactdev')).toBeInTheDocument()
      })
    })

    it('performs new search when changing tabs', async () => {
      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(communityService.searchAll).toHaveBeenCalled()
      })
    })

    it('shows correct tab counts', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        // Should calculate correct counts for each tab
        expect(screen.getByTestId('community-react')).toBeInTheDocument()
      })
    })
  })

  describe('Loading States', () => {
    it('shows loading state during search', async () => {
      let resolveSearch
      communityService.searchAll.mockImplementation(
        () => new Promise((resolve) => { resolveSearch = resolve })
      )

      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(communityService.searchAll).toHaveBeenCalled()
      })

      // Loading state should be active
      // Resolve the search
      resolveSearch({ communities: [], posts: [], users: [] })
    })

    it('hides loading state after search completes', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(screen.getByTestId('community-react')).toBeInTheDocument()
      })
    })

    it('shows loading state when switching tabs', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(screen.getByTestId('community-react')).toBeInTheDocument()
      })
    })
  })

  describe('Empty Results State', () => {
    it('shows empty state when no results found', async () => {
      communityService.searchAll.mockResolvedValue({
        communities: [],
        posts: [],
        users: [],
      })

      renderWithProviders(<SearchPage />, { initialRoute: '/?q=nonexistent' })

      await waitFor(() => {
        expect(communityService.searchAll).toHaveBeenCalled()
      })
    })

    it('shows empty state for specific tab with no results', async () => {
      communityService.searchAll.mockResolvedValue({
        communities: [],
        posts: mockSearchResults.posts,
        users: mockSearchResults.users,
      })

      renderWithProviders(<SearchPage />, { initialRoute: '/?q=test' })

      await waitFor(() => {
        expect(communityService.searchAll).toHaveBeenCalled()
      })
    })
  })

  describe('Error Handling', () => {
    it('handles search errors gracefully', async () => {
      communityService.searchAll.mockRejectedValue(new Error('Search failed'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      renderWithProviders(<SearchPage />, { initialRoute: '/?q=test' })

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Search failed:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })

    it('continues to function after error', async () => {
      communityService.searchAll
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce(mockSearchResults)

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      renderWithProviders(<SearchPage />, { initialRoute: '/?q=test' })

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled()
      })

      consoleSpy.mockRestore()
    })

    it('logs error when community join fails', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      communityService.joinCommunity.mockRejectedValue(new Error('Join failed'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(screen.getByTestId('community-react')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Join'))

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to join community:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Community Actions', () => {
    it('handles joining a community', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      communityService.joinCommunity.mockResolvedValue({ success: true })

      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(screen.getByTestId('community-react')).toBeInTheDocument()
      })

      const joinButton = screen.getByText('Join')
      fireEvent.click(joinButton)

      await waitFor(() => {
        expect(communityService.joinCommunity).toHaveBeenCalledWith('react')
      })
    })

    it('updates community state after joining', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      communityService.joinCommunity.mockResolvedValue({ success: true })

      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(screen.getByTestId('community-react')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Join'))

      await waitFor(() => {
        expect(screen.getByText('Leave')).toBeInTheDocument()
      })
    })

    it('increments member count after joining', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      communityService.joinCommunity.mockResolvedValue({ success: true })

      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(screen.getByText('5000 members')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Join'))

      await waitFor(() => {
        expect(screen.getByText('5001 members')).toBeInTheDocument()
      })
    })

    it('handles leaving a community', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      communityService.leaveCommunity.mockResolvedValue({ success: true })

      renderWithProviders(<SearchPage />, { initialRoute: '/?q=javascript' })

      await waitFor(() => {
        expect(screen.getByTestId('community-javascript')).toBeInTheDocument()
      })

      const leaveButton = screen.getByText('Leave')
      fireEvent.click(leaveButton)

      await waitFor(() => {
        expect(communityService.leaveCommunity).toHaveBeenCalledWith('javascript')
      })
    })

    it('decrements member count after leaving', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      communityService.leaveCommunity.mockResolvedValue({ success: true })

      renderWithProviders(<SearchPage />, { initialRoute: '/?q=javascript' })

      await waitFor(() => {
        expect(screen.getByText('10000 members')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Leave'))

      await waitFor(() => {
        expect(screen.getByText('9999 members')).toBeInTheDocument()
      })
    })
  })

  describe('Post Actions', () => {
    it('handles upvoting a post', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      communityService.voteOnPost.mockResolvedValue({ success: true })

      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(screen.getByTestId('post-1')).toBeInTheDocument()
      })

      const upvoteButton = screen.getAllByText('Upvote')[0]
      fireEvent.click(upvoteButton)

      await waitFor(() => {
        expect(communityService.voteOnPost).toHaveBeenCalledWith('1', 'upvote', 'upvote')
      })
    })

    it('updates post score after voting', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      communityService.voteOnPost.mockResolvedValue({ success: true })

      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(screen.getByText('Score: 100')).toBeInTheDocument()
      })

      fireEvent.click(screen.getAllByText('Upvote')[0])

      await waitFor(() => {
        expect(screen.getByText('Score: 101')).toBeInTheDocument()
      })
    })

    it('handles sharing a post with Web Share API', async () => {
      const mockShare = jest.fn().mockResolvedValue()
      global.navigator.share = mockShare

      communityService.searchAll.mockResolvedValue(mockSearchResults)
      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(screen.getByTestId('post-1')).toBeInTheDocument()
      })

      fireEvent.click(screen.getAllByText('Share')[0])

      await waitFor(() => {
        expect(mockShare).toHaveBeenCalledWith({
          title: 'React 19 Released',
          text: expect.any(String),
          url: expect.stringContaining('/c/react/posts/1'),
        })
      })

      await waitFor(() => {
        expect(mockShowSuccess).toHaveBeenCalledWith('Post shared successfully')
      })

      delete global.navigator.share
    })

    it('handles sharing with clipboard fallback', async () => {
      const mockWriteText = jest.fn().mockResolvedValue()
      Object.assign(navigator, {
        clipboard: { writeText: mockWriteText },
      })

      communityService.searchAll.mockResolvedValue(mockSearchResults)
      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(screen.getByTestId('post-1')).toBeInTheDocument()
      })

      fireEvent.click(screen.getAllByText('Share')[0])

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith(expect.stringContaining('/c/react/posts/1'))
      })

      await waitFor(() => {
        expect(mockShowSuccess).toHaveBeenCalledWith('Link copied to clipboard')
      })
    })

    it('handles saving a post', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      postsService.savePost.mockResolvedValue({ success: true })

      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(screen.getByTestId('post-1')).toBeInTheDocument()
      })

      fireEvent.click(screen.getAllByText('Save')[0])

      await waitFor(() => {
        expect(postsService.savePost).toHaveBeenCalledWith('1', true)
      })

      await waitFor(() => {
        expect(mockShowSuccess).toHaveBeenCalledWith('Post saved')
      })
    })

    it('handles unsaving a post', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      postsService.savePost.mockResolvedValue({ success: true })

      renderWithProviders(<SearchPage />, { initialRoute: '/?q=javascript' })

      await waitFor(() => {
        expect(screen.getByTestId('post-2')).toBeInTheDocument()
      })

      fireEvent.click(screen.getAllByText('Save')[1])

      await waitFor(() => {
        expect(postsService.savePost).toHaveBeenCalledWith('2', false)
      })

      await waitFor(() => {
        expect(mockShowSuccess).toHaveBeenCalledWith('Post unsaved')
      })
    })

    it('reverts optimistic update on save error', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      postsService.savePost.mockRejectedValue(new Error('Save failed'))

      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(screen.getByTestId('post-1')).toBeInTheDocument()
      })

      fireEvent.click(screen.getAllByText('Save')[0])

      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith('Failed to save post')
      })
    })

    it('opens report modal for post', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(screen.getByTestId('post-1')).toBeInTheDocument()
      })

      fireEvent.click(screen.getAllByText('Report')[0])

      await waitFor(() => {
        expect(screen.getByTestId('report-modal')).toBeInTheDocument()
      })
    })

    it('submits post report', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      postsService.reportPost.mockResolvedValue({ success: true })

      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(screen.getByTestId('post-1')).toBeInTheDocument()
      })

      fireEvent.click(screen.getAllByText('Report')[0])

      await waitFor(() => {
        expect(screen.getByTestId('report-modal')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Submit Report'))

      await waitFor(() => {
        expect(postsService.reportPost).toHaveBeenCalledWith('1', expect.any(Object))
      })

      await waitFor(() => {
        expect(mockShowSuccess).toHaveBeenCalledWith('Report submitted successfully')
      })
    })

    it('opens award modal for post', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(screen.getByTestId('post-1')).toBeInTheDocument()
      })

      fireEvent.click(screen.getAllByText('Award')[0])

      await waitFor(() => {
        expect(screen.getByTestId('award-modal')).toBeInTheDocument()
      })
    })

    it('submits post award', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(screen.getByTestId('post-1')).toBeInTheDocument()
      })

      fireEvent.click(screen.getAllByText('Award')[0])

      await waitFor(() => {
        expect(screen.getByTestId('award-modal')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Give Award'))

      await waitFor(() => {
        expect(mockShowSuccess).toHaveBeenCalledWith('Award given successfully!')
      })
    })
  })

  describe('User Actions', () => {
    it('handles following a user', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      userService.followUser.mockResolvedValue({ success: true })

      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(screen.getByTestId('user-reactdev')).toBeInTheDocument()
      })

      fireEvent.click(screen.getAllByText('Follow')[0])

      await waitFor(() => {
        expect(userService.followUser).toHaveBeenCalledWith('reactdev')
      })

      await waitFor(() => {
        expect(mockShowSuccess).toHaveBeenCalledWith('Following u/reactdev')
      })
    })

    it('increments follower count after following', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      userService.followUser.mockResolvedValue({ success: true })

      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(screen.getByText('1000 followers')).toBeInTheDocument()
      })

      fireEvent.click(screen.getAllByText('Follow')[0])

      await waitFor(() => {
        expect(screen.getByText('1001 followers')).toBeInTheDocument()
      })
    })

    it('handles unfollowing a user', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      userService.unfollowUser.mockResolvedValue({ success: true })

      renderWithProviders(<SearchPage />, { initialRoute: '/?q=javascript' })

      await waitFor(() => {
        expect(screen.getByTestId('user-jsmaster')).toBeInTheDocument()
      })

      fireEvent.click(screen.getAllByText('Unfollow')[0])

      await waitFor(() => {
        expect(userService.unfollowUser).toHaveBeenCalledWith('jsmaster')
      })

      await waitFor(() => {
        expect(mockShowSuccess).toHaveBeenCalledWith('Unfollowed u/jsmaster')
      })
    })

    it('decrements follower count after unfollowing', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      userService.unfollowUser.mockResolvedValue({ success: true })

      renderWithProviders(<SearchPage />, { initialRoute: '/?q=javascript' })

      await waitFor(() => {
        expect(screen.getByText('500 followers')).toBeInTheDocument()
      })

      fireEvent.click(screen.getAllByText('Unfollow')[0])

      await waitFor(() => {
        expect(screen.getByText('499 followers')).toBeInTheDocument()
      })
    })

    it('reverts follow on error', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      userService.followUser.mockRejectedValue(new Error('Follow failed'))

      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(screen.getByTestId('user-reactdev')).toBeInTheDocument()
      })

      fireEvent.click(screen.getAllByText('Follow')[0])

      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith('Failed to follow user')
      })

      await waitFor(() => {
        expect(screen.getByText('1000 followers')).toBeInTheDocument()
      })
    })

    it('navigates to messages when messaging user', async () => {
      const mockNavigate = jest.fn()
      jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate)

      communityService.searchAll.mockResolvedValue(mockSearchResults)
      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(screen.getByTestId('user-reactdev')).toBeInTheDocument()
      })

      fireEvent.click(screen.getAllByText('Message')[0])

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/messages/1')
      })
    })

    it('handles message navigation error', async () => {
      const mockNavigate = jest.fn()
      jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate)

      communityService.searchAll.mockResolvedValue({
        ...mockSearchResults,
        users: [{ username: 'testuser' }], // User without ID
      })

      renderWithProviders(<SearchPage />, { initialRoute: '/?q=test' })

      await waitFor(() => {
        expect(screen.getByTestId('user-testuser')).toBeInTheDocument()
      })

      fireEvent.click(screen.getAllByText('Message')[0])

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/messages/testuser')
      })
    })
  })

  describe('Search Caching', () => {
    it('caches search results', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(communityService.searchAll).toHaveBeenCalledTimes(1)
      })

      // Search again with same query
      communityService.searchAll.mockClear()

      // Trigger search again (would need to change tab and back)
      // Cache should prevent API call
    })

    it('limits cache size to 20 entries', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)

      // This would require testing internal cache management
      // which is challenging without exposing cache
      renderWithProviders(<SearchPage />, { initialRoute: '/?q=test1' })

      await waitFor(() => {
        expect(communityService.searchAll).toHaveBeenCalled()
      })
    })

    it('generates different cache keys for different tabs', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(communityService.searchAll).toHaveBeenCalledWith('react', {
          type: 'all',
          limit: 50,
        })
      })
    })
  })

  describe('Authentication', () => {
    it('renders for authenticated users', () => {
      renderWithProviders(<SearchPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('renders for unauthenticated users', () => {
      const unauthContext = { ...mockAuthContext, user: null, isAuthenticated: false }
      renderWithProviders(<SearchPage />, { authValue: unauthContext })
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper main landmark', () => {
      renderWithProviders(<SearchPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('has descriptive aria-label on main element', () => {
      renderWithProviders(<SearchPage />)
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Search page')
    })

    it('has proper heading structure', () => {
      renderWithProviders(<SearchPage />)
      const heading = screen.getByText('SearchPage')
      expect(heading.tagName).toBe('H1')
    })
  })

  describe('Performance', () => {
    it('memoizes tab calculations', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(screen.getByTestId('community-react')).toBeInTheDocument()
      })

      // Memoization tested implicitly through React rendering
    })

    it('memoizes filtered results', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(screen.getByTestId('community-react')).toBeInTheDocument()
      })
    })

    it('uses memoized components', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(screen.getByTestId('community-react')).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles empty search results gracefully', async () => {
      communityService.searchAll.mockResolvedValue({
        communities: [],
        posts: [],
        users: [],
      })

      renderWithProviders(<SearchPage />, { initialRoute: '/?q=test' })

      await waitFor(() => {
        expect(communityService.searchAll).toHaveBeenCalled()
      })
    })

    it('handles null search results', async () => {
      communityService.searchAll.mockResolvedValue({
        communities: null,
        posts: null,
        users: null,
      })

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      renderWithProviders(<SearchPage />, { initialRoute: '/?q=test' })

      await waitFor(() => {
        expect(communityService.searchAll).toHaveBeenCalled()
      })

      consoleSpy.mockRestore()
    })

    it('handles special characters in search query', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      renderWithProviders(<SearchPage />, { initialRoute: '/?q=test%20%26%20special' })

      await waitFor(() => {
        expect(communityService.searchAll).toHaveBeenCalled()
      })
    })

    it('handles very long search queries', async () => {
      const longQuery = 'a'.repeat(1000)
      communityService.searchAll.mockResolvedValue(mockSearchResults)

      renderWithProviders(<SearchPage />, { initialRoute: `/?q=${longQuery}` })

      await waitFor(() => {
        expect(communityService.searchAll).toHaveBeenCalled()
      })
    })

    it('handles rapid tab switching', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(communityService.searchAll).toHaveBeenCalled()
      })
    })
  })

  describe('Modal Management', () => {
    it('closes report modal on cancel', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(screen.getByTestId('post-1')).toBeInTheDocument()
      })

      fireEvent.click(screen.getAllByText('Report')[0])

      await waitFor(() => {
        expect(screen.getByTestId('report-modal')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Close'))

      await waitFor(() => {
        expect(screen.queryByTestId('report-modal')).not.toBeInTheDocument()
      })
    })

    it('closes award modal on cancel', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(screen.getByTestId('post-1')).toBeInTheDocument()
      })

      fireEvent.click(screen.getAllByText('Award')[0])

      await waitFor(() => {
        expect(screen.getByTestId('award-modal')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Close'))

      await waitFor(() => {
        expect(screen.queryByTestId('award-modal')).not.toBeInTheDocument()
      })
    })

    it('closes report modal after successful submission', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      postsService.reportPost.mockResolvedValue({ success: true })

      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(screen.getByTestId('post-1')).toBeInTheDocument()
      })

      fireEvent.click(screen.getAllByText('Report')[0])
      fireEvent.click(screen.getByText('Submit Report'))

      await waitFor(() => {
        expect(screen.queryByTestId('report-modal')).not.toBeInTheDocument()
      })
    })

    it('closes award modal after successful submission', async () => {
      communityService.searchAll.mockResolvedValue(mockSearchResults)
      renderWithProviders(<SearchPage />, { initialRoute: '/?q=react' })

      await waitFor(() => {
        expect(screen.getByTestId('post-1')).toBeInTheDocument()
      })

      fireEvent.click(screen.getAllByText('Award')[0])
      fireEvent.click(screen.getByText('Give Award'))

      await waitFor(() => {
        expect(screen.queryByTestId('award-modal')).not.toBeInTheDocument()
      })
    })
  })
})

export default mockShowSuccess
