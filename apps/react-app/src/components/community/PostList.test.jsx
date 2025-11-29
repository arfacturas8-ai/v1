import React from 'react'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import PostList from './PostList'
import Post from './Post'
import SortControls from './SortControls'
import LoadingSpinner from './LoadingSpinner'

// Mock dependencies
jest.mock('./Post', () => {
  return jest.fn(({ post, onVote, onComment, onShare, onSave, onReport, onAward, compact, showCommunity, className, style }) => (
    <div
      data-testid={`post-${post.id}`}
      className={className}
      style={style}
      data-compact={compact}
      data-show-community={showCommunity}
    >
      <div data-testid="post-title">{post.title}</div>
      <button onClick={() => onVote(post.id, 'upvote', true)} data-testid="vote-button">Vote</button>
      <button onClick={() => onComment?.(post.id)} data-testid="comment-button">Comment</button>
      <button onClick={() => onShare?.(post.id)} data-testid="share-button">Share</button>
      <button onClick={() => onSave?.(post.id)} data-testid="save-button">Save</button>
      <button onClick={() => onReport?.(post.id)} data-testid="report-button">Report</button>
      <button onClick={() => onAward?.(post.id)} data-testid="award-button">Award</button>
    </div>
  ))
})

jest.mock('./SortControls', () => {
  return jest.fn(({ sortBy, timeFilter, onSort, onTimeFilter }) => (
    <div data-testid="sort-controls">
      <button onClick={() => onSort?.('hot')} data-testid="sort-hot">Hot</button>
      <button onClick={() => onSort?.('new')} data-testid="sort-new">New</button>
      <button onClick={() => onSort?.('top')} data-testid="sort-top">Top</button>
      <button onClick={() => onTimeFilter?.('day')} data-testid="time-day">Day</button>
      <button onClick={() => onTimeFilter?.('week')} data-testid="time-week">Week</button>
      <div data-testid="current-sort">{sortBy}</div>
      <div data-testid="current-time">{timeFilter}</div>
    </div>
  ))
})

jest.mock('./LoadingSpinner', () => {
  return jest.fn(({ size }) => (
    <div data-testid="loading-spinner" data-size={size}>Loading...</div>
  ))
})

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn()
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
})
global.IntersectionObserver = mockIntersectionObserver

// Helper to create mock posts
const createMockPost = (id, title = `Post ${id}`) => ({
  id,
  title,
  content: `Content for post ${id}`,
  author: `author${id}`,
  votes: 10,
  comments: 5,
  createdAt: new Date().toISOString()
})

const createMockPosts = (count) => {
  return Array.from({ length: count }, (_, i) => createMockPost(i + 1))
}

describe('PostList Component', () => {
  let mockOnLoadMore
  let mockOnSort
  let mockOnTimeFilter
  let mockOnPostVote
  let mockOnPostComment
  let mockOnPostShare
  let mockOnPostSave
  let mockOnPostReport
  let mockOnPostAward

  beforeEach(() => {
    jest.clearAllMocks()
    mockOnLoadMore = jest.fn().mockResolvedValue()
    mockOnSort = jest.fn()
    mockOnTimeFilter = jest.fn()
    mockOnPostVote = jest.fn().mockResolvedValue()
    mockOnPostComment = jest.fn()
    mockOnPostShare = jest.fn()
    mockOnPostSave = jest.fn()
    mockOnPostReport = jest.fn()
    mockOnPostAward = jest.fn()
  })

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<PostList />)
      expect(screen.getByTestId('sort-controls')).toBeInTheDocument()
    })

    it('should render with custom className', () => {
      const { container } = render(<PostList className="custom-class" />)
      expect(container.querySelector('.post-list')).toHaveClass('custom-class')
    })

    it('should render SortControls component', () => {
      render(<PostList />)
      expect(SortControls).toHaveBeenCalled()
      expect(screen.getByTestId('sort-controls')).toBeInTheDocument()
    })

    it('should pass sortBy prop to SortControls', () => {
      render(<PostList sortBy="new" />)
      expect(SortControls).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: 'new' }),
        expect.anything()
      )
    })

    it('should pass timeFilter prop to SortControls', () => {
      render(<PostList timeFilter="week" />)
      expect(SortControls).toHaveBeenCalledWith(
        expect.objectContaining({ timeFilter: 'week' }),
        expect.anything()
      )
    })

    it('should render with default props', () => {
      render(<PostList />)
      expect(screen.getByText('No posts yet')).toBeInTheDocument()
    })
  })

  describe('Post List Rendering', () => {
    it('should render initial 10 posts from larger list', () => {
      const posts = createMockPosts(20)
      render(<PostList posts={posts} />)

      expect(screen.getAllByTestId(/^post-/)).toHaveLength(10)
    })

    it('should render all posts if less than 10', () => {
      const posts = createMockPosts(5)
      render(<PostList posts={posts} />)

      expect(screen.getAllByTestId(/^post-/)).toHaveLength(5)
    })

    it('should render posts with correct keys', () => {
      const posts = createMockPosts(3)
      render(<PostList posts={posts} />)

      expect(screen.getByTestId('post-1')).toBeInTheDocument()
      expect(screen.getByTestId('post-2')).toBeInTheDocument()
      expect(screen.getByTestId('post-3')).toBeInTheDocument()
    })

    it('should render posts in order', () => {
      const posts = createMockPosts(5)
      render(<PostList posts={posts} />)

      const postElements = screen.getAllByTestId(/^post-/)
      expect(postElements[0]).toHaveAttribute('data-testid', 'post-1')
      expect(postElements[4]).toHaveAttribute('data-testid', 'post-5')
    })

    it('should reset visible posts when posts prop changes', () => {
      const { rerender } = render(<PostList posts={createMockPosts(15)} />)
      expect(screen.getAllByTestId(/^post-/)).toHaveLength(10)

      rerender(<PostList posts={createMockPosts(5)} />)
      expect(screen.getAllByTestId(/^post-/)).toHaveLength(5)
    })

    it('should apply compact spacing class when compact is true', () => {
      const posts = createMockPosts(2)
      const { container } = render(<PostList posts={posts} compact={true} />)

      expect(container.querySelector('.space-y-sm')).toBeInTheDocument()
    })

    it('should apply normal spacing when compact is false', () => {
      const posts = createMockPosts(2)
      const { container } = render(<PostList posts={posts} compact={false} />)

      expect(container.querySelector('.space-y-md')).toBeInTheDocument()
      expect(container.querySelector('.space-y-sm')).not.toBeInTheDocument()
    })
  })

  describe('Post Component Props', () => {
    it('should pass post data to Post component', () => {
      const posts = [createMockPost(1, 'Test Post Title')]
      render(<PostList posts={posts} />)

      expect(Post).toHaveBeenCalledWith(
        expect.objectContaining({
          post: expect.objectContaining({ id: 1, title: 'Test Post Title' })
        }),
        expect.anything()
      )
    })

    it('should pass compact prop to Post components', () => {
      const posts = createMockPosts(2)
      render(<PostList posts={posts} compact={true} />)

      const postElements = screen.getAllByTestId(/^post-/)
      postElements.forEach(post => {
        expect(post).toHaveAttribute('data-compact', 'true')
      })
    })

    it('should pass showCommunity prop to Post components', () => {
      const posts = createMockPosts(2)
      render(<PostList posts={posts} showCommunity={false} />)

      const postElements = screen.getAllByTestId(/^post-/)
      postElements.forEach(post => {
        expect(post).toHaveAttribute('data-show-community', 'false')
      })
    })

    it('should apply animation delay to posts', () => {
      const posts = createMockPosts(3)
      render(<PostList posts={posts} />)

      const postElements = screen.getAllByTestId(/^post-/)
      expect(postElements[0]).toHaveStyle({ animationDelay: '0ms' })
      expect(postElements[1]).toHaveStyle({ animationDelay: '50ms' })
      expect(postElements[2]).toHaveStyle({ animationDelay: '100ms' })
    })

    it('should apply animate-fade-in class to posts', () => {
      const posts = createMockPosts(1)
      render(<PostList posts={posts} />)

      expect(screen.getByTestId('post-1')).toHaveClass('animate-fade-in')
    })
  })

  describe('Empty States', () => {
    it('should show empty state when no posts and not loading', () => {
      render(<PostList posts={[]} loading={false} />)

      expect(screen.getByText('No posts yet')).toBeInTheDocument()
      expect(screen.getByText('Be the first to share something with the community!')).toBeInTheDocument()
    })

    it('should render empty state SVG icon', () => {
      const { container } = render(<PostList posts={[]} loading={false} />)

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('width', '48')
      expect(svg).toHaveAttribute('height', '48')
    })

    it('should not show empty state when loading', () => {
      render(<PostList posts={[]} loading={true} />)

      expect(screen.queryByText('No posts yet')).not.toBeInTheDocument()
    })

    it('should not show empty state when posts exist', () => {
      const posts = createMockPosts(1)
      render(<PostList posts={posts} />)

      expect(screen.queryByText('No posts yet')).not.toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('should show loading spinner when loading and no posts', () => {
      render(<PostList posts={[]} loading={true} />)

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('should show loading spinner with large size when loading initially', () => {
      render(<PostList posts={[]} loading={true} />)

      const spinner = screen.getByTestId('loading-spinner')
      expect(spinner).toHaveAttribute('data-size', 'lg')
    })

    it('should show loading spinner at bottom when loading more posts', () => {
      const posts = createMockPosts(5)
      render(<PostList posts={posts} loading={true} />)

      const spinners = screen.getAllByTestId('loading-spinner')
      expect(spinners.length).toBeGreaterThan(0)
    })

    it('should not show loading spinner when not loading', () => {
      const posts = createMockPosts(5)
      render(<PostList posts={posts} loading={false} />)

      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should display error message when error prop is set', () => {
      render(<PostList error="Failed to load posts" />)

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText('Failed to load posts')).toBeInTheDocument()
    })

    it('should render error SVG icon', () => {
      const { container } = render(<PostList error="Error message" />)

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveClass('text-error')
    })

    it('should show Try Again button on error', () => {
      render(<PostList error="Error occurred" />)

      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })

    it('should reload page when Try Again is clicked', () => {
      const reloadSpy = jest.fn()
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { reload: reloadSpy }
      })

      render(<PostList error="Error occurred" />)

      fireEvent.click(screen.getByText('Try Again'))
      expect(reloadSpy).toHaveBeenCalled()
    })

    it('should not render posts when error exists', () => {
      const posts = createMockPosts(5)
      render(<PostList posts={posts} error="Error occurred" />)

      expect(screen.queryByTestId(/^post-/)).not.toBeInTheDocument()
    })

    it('should not render SortControls when error exists', () => {
      render(<PostList error="Error occurred" />)

      expect(screen.queryByTestId('sort-controls')).not.toBeInTheDocument()
    })

    it('should apply custom className to error container', () => {
      const { container } = render(<PostList error="Error" className="custom-error" />)

      const errorDiv = container.querySelector('.custom-error')
      expect(errorDiv).toBeInTheDocument()
    })
  })

  describe('Infinite Scroll', () => {
    it('should setup IntersectionObserver', () => {
      const posts = createMockPosts(15)
      render(<PostList posts={posts} hasMore={true} />)

      expect(mockIntersectionObserver).toHaveBeenCalled()
    })

    it('should observe load trigger element', () => {
      const mockObserve = jest.fn()
      mockIntersectionObserver.mockReturnValue({
        observe: mockObserve,
        unobserve: jest.fn(),
        disconnect: jest.fn()
      })

      const posts = createMockPosts(15)
      render(<PostList posts={posts} hasMore={true} />)

      expect(mockObserve).toHaveBeenCalled()
    })

    it('should configure IntersectionObserver with correct options', () => {
      const posts = createMockPosts(15)
      render(<PostList posts={posts} hasMore={true} />)

      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          threshold: 0.1,
          rootMargin: '100px'
        })
      )
    })

    it('should disconnect observer on unmount', () => {
      const mockDisconnect = jest.fn()
      mockIntersectionObserver.mockReturnValue({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: mockDisconnect
      })

      const posts = createMockPosts(15)
      const { unmount } = render(<PostList posts={posts} hasMore={true} />)

      unmount()
      expect(mockDisconnect).toHaveBeenCalled()
    })

    it('should trigger load more when intersection occurs', async () => {
      let intersectionCallback
      mockIntersectionObserver.mockImplementation((callback) => {
        intersectionCallback = callback
        return {
          observe: jest.fn(),
          unobserve: jest.fn(),
          disconnect: jest.fn()
        }
      })

      const posts = createMockPosts(15)
      render(<PostList posts={posts} hasMore={true} onLoadMore={mockOnLoadMore} />)

      intersectionCallback([{ isIntersecting: true }])

      await waitFor(() => {
        expect(screen.getAllByTestId(/^post-/).length).toBeGreaterThan(10)
      })
    })

    it('should not trigger load more when not intersecting', () => {
      let intersectionCallback
      mockIntersectionObserver.mockImplementation((callback) => {
        intersectionCallback = callback
        return {
          observe: jest.fn(),
          unobserve: jest.fn(),
          disconnect: jest.fn()
        }
      })

      const posts = createMockPosts(15)
      render(<PostList posts={posts} hasMore={true} onLoadMore={mockOnLoadMore} />)

      intersectionCallback([{ isIntersecting: false }])

      expect(screen.getAllByTestId(/^post-/)).toHaveLength(10)
    })

    it('should not load more when already loading', () => {
      let intersectionCallback
      mockIntersectionObserver.mockImplementation((callback) => {
        intersectionCallback = callback
        return {
          observe: jest.fn(),
          unobserve: jest.fn(),
          disconnect: jest.fn()
        }
      })

      const posts = createMockPosts(15)
      render(<PostList posts={posts} hasMore={true} loading={true} onLoadMore={mockOnLoadMore} />)

      intersectionCallback([{ isIntersecting: true }])

      expect(mockOnLoadMore).not.toHaveBeenCalled()
    })

    it('should not load more when hasMore is false', () => {
      let intersectionCallback
      mockIntersectionObserver.mockImplementation((callback) => {
        intersectionCallback = callback
        return {
          observe: jest.fn(),
          unobserve: jest.fn(),
          disconnect: jest.fn()
        }
      })

      const posts = createMockPosts(15)
      render(<PostList posts={posts} hasMore={false} onLoadMore={mockOnLoadMore} />)

      intersectionCallback([{ isIntersecting: true }])

      expect(mockOnLoadMore).not.toHaveBeenCalled()
    })
  })

  describe('Load More Functionality', () => {
    it('should show Load More button when hasMore is true', () => {
      const posts = createMockPosts(15)
      render(<PostList posts={posts} hasMore={true} loading={false} />)

      expect(screen.getByText('Load More Posts')).toBeInTheDocument()
    })

    it('should not show Load More button when hasMore is false', () => {
      const posts = createMockPosts(15)
      render(<PostList posts={posts} hasMore={false} />)

      expect(screen.queryByText('Load More Posts')).not.toBeInTheDocument()
    })

    it('should not show Load More button when loading', () => {
      const posts = createMockPosts(15)
      render(<PostList posts={posts} hasMore={true} loading={true} />)

      expect(screen.queryByText('Load More Posts')).not.toBeInTheDocument()
    })

    it('should load more posts from existing list when clicked', async () => {
      const posts = createMockPosts(25)
      render(<PostList posts={posts} hasMore={true} />)

      expect(screen.getAllByTestId(/^post-/)).toHaveLength(10)

      fireEvent.click(screen.getByText('Load More Posts'))

      await waitFor(() => {
        expect(screen.getAllByTestId(/^post-/)).toHaveLength(20)
      })
    })

    it('should call onLoadMore when all posts are visible', async () => {
      const posts = createMockPosts(10)
      render(<PostList posts={posts} hasMore={true} onLoadMore={mockOnLoadMore} />)

      fireEvent.click(screen.getByText('Load More Posts'))

      await waitFor(() => {
        expect(mockOnLoadMore).toHaveBeenCalled()
      })
    })

    it('should show loading spinner while loading more', async () => {
      const posts = createMockPosts(25)
      render(<PostList posts={posts} hasMore={true} />)

      fireEvent.click(screen.getByText('Load More Posts'))

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('should not trigger multiple loads simultaneously', async () => {
      const posts = createMockPosts(25)
      mockOnLoadMore.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      render(<PostList posts={posts} hasMore={true} onLoadMore={mockOnLoadMore} />)

      const button = screen.getByText('Load More Posts')
      fireEvent.click(button)
      fireEvent.click(button)

      await waitFor(() => {
        expect(mockOnLoadMore).toHaveBeenCalledTimes(1)
      })
    })

    it('should handle load more error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const posts = createMockPosts(10)
      mockOnLoadMore.mockRejectedValue(new Error('Load failed'))

      render(<PostList posts={posts} hasMore={true} onLoadMore={mockOnLoadMore} />)

      fireEvent.click(screen.getByText('Load More Posts'))

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load more posts:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })

    it('should load posts in increments of 10', async () => {
      const posts = createMockPosts(35)
      render(<PostList posts={posts} hasMore={true} />)

      expect(screen.getAllByTestId(/^post-/)).toHaveLength(10)

      fireEvent.click(screen.getByText('Load More Posts'))
      await waitFor(() => {
        expect(screen.getAllByTestId(/^post-/)).toHaveLength(20)
      })

      fireEvent.click(screen.getByText('Load More Posts'))
      await waitFor(() => {
        expect(screen.getAllByTestId(/^post-/)).toHaveLength(30)
      })
    })
  })

  describe('End of Feed', () => {
    it('should show end of feed message when no more posts', () => {
      const posts = createMockPosts(5)
      render(<PostList posts={posts} hasMore={false} />)

      expect(screen.getByText("You've reached the end! 🎉")).toBeInTheDocument()
    })

    it('should not show end of feed when hasMore is true', () => {
      const posts = createMockPosts(5)
      render(<PostList posts={posts} hasMore={true} />)

      expect(screen.queryByText("You've reached the end! 🎉")).not.toBeInTheDocument()
    })

    it('should not show end of feed when no posts', () => {
      render(<PostList posts={[]} hasMore={false} />)

      expect(screen.queryByText("You've reached the end! 🎉")).not.toBeInTheDocument()
    })
  })

  describe('Sorting', () => {
    it('should call onSort when sort option is clicked', () => {
      render(<PostList onSort={mockOnSort} />)

      fireEvent.click(screen.getByTestId('sort-hot'))
      expect(mockOnSort).toHaveBeenCalledWith('hot')
    })

    it('should call onSort with correct value for new sort', () => {
      render(<PostList onSort={mockOnSort} />)

      fireEvent.click(screen.getByTestId('sort-new'))
      expect(mockOnSort).toHaveBeenCalledWith('new')
    })

    it('should call onSort with correct value for top sort', () => {
      render(<PostList onSort={mockOnSort} />)

      fireEvent.click(screen.getByTestId('sort-top'))
      expect(mockOnSort).toHaveBeenCalledWith('top')
    })

    it('should display current sort value', () => {
      render(<PostList sortBy="new" />)

      expect(screen.getByTestId('current-sort')).toHaveTextContent('new')
    })

    it('should update when sortBy prop changes', () => {
      const { rerender } = render(<PostList sortBy="hot" />)
      expect(screen.getByTestId('current-sort')).toHaveTextContent('hot')

      rerender(<PostList sortBy="top" />)
      expect(screen.getByTestId('current-sort')).toHaveTextContent('top')
    })
  })

  describe('Time Filtering', () => {
    it('should call onTimeFilter when time option is clicked', () => {
      render(<PostList onTimeFilter={mockOnTimeFilter} />)

      fireEvent.click(screen.getByTestId('time-day'))
      expect(mockOnTimeFilter).toHaveBeenCalledWith('day')
    })

    it('should call onTimeFilter with correct value for week', () => {
      render(<PostList onTimeFilter={mockOnTimeFilter} />)

      fireEvent.click(screen.getByTestId('time-week'))
      expect(mockOnTimeFilter).toHaveBeenCalledWith('week')
    })

    it('should display current time filter value', () => {
      render(<PostList timeFilter="week" />)

      expect(screen.getByTestId('current-time')).toHaveTextContent('week')
    })

    it('should update when timeFilter prop changes', () => {
      const { rerender } = render(<PostList timeFilter="day" />)
      expect(screen.getByTestId('current-time')).toHaveTextContent('day')

      rerender(<PostList timeFilter="week" />)
      expect(screen.getByTestId('current-time')).toHaveTextContent('week')
    })
  })

  describe('Post Interactions', () => {
    it('should handle post vote action', async () => {
      const posts = createMockPosts(1)
      render(<PostList posts={posts} onPostVote={mockOnPostVote} />)

      fireEvent.click(screen.getByTestId('vote-button'))

      await waitFor(() => {
        expect(mockOnPostVote).toHaveBeenCalledWith(1, 'upvote', true)
      })
    })

    it('should handle post comment action', () => {
      const posts = createMockPosts(1)
      render(<PostList posts={posts} onPostComment={mockOnPostComment} />)

      fireEvent.click(screen.getByTestId('comment-button'))

      expect(mockOnPostComment).toHaveBeenCalledWith(1)
    })

    it('should handle post share action', () => {
      const posts = createMockPosts(1)
      render(<PostList posts={posts} onPostShare={mockOnPostShare} />)

      fireEvent.click(screen.getByTestId('share-button'))

      expect(mockOnPostShare).toHaveBeenCalledWith(1)
    })

    it('should handle post save action', () => {
      const posts = createMockPosts(1)
      render(<PostList posts={posts} onPostSave={mockOnPostSave} />)

      fireEvent.click(screen.getByTestId('save-button'))

      expect(mockOnPostSave).toHaveBeenCalledWith(1)
    })

    it('should handle post report action', () => {
      const posts = createMockPosts(1)
      render(<PostList posts={posts} onPostReport={mockOnPostReport} />)

      fireEvent.click(screen.getByTestId('report-button'))

      expect(mockOnPostReport).toHaveBeenCalledWith(1)
    })

    it('should handle post award action', () => {
      const posts = createMockPosts(1)
      render(<PostList posts={posts} onPostAward={mockOnPostAward} />)

      fireEvent.click(screen.getByTestId('award-button'))

      expect(mockOnPostAward).toHaveBeenCalledWith(1)
    })

    it('should handle vote error and rethrow', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const error = new Error('Vote failed')
      mockOnPostVote.mockRejectedValue(error)

      const posts = createMockPosts(1)
      render(<PostList posts={posts} onPostVote={mockOnPostVote} />)

      fireEvent.click(screen.getByTestId('vote-button'))

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Vote failed:', error)
      })

      consoleSpy.mockRestore()
    })

    it('should not call undefined callback handlers', () => {
      const posts = createMockPosts(1)
      render(<PostList posts={posts} />)

      expect(() => {
        fireEvent.click(screen.getByTestId('comment-button'))
        fireEvent.click(screen.getByTestId('share-button'))
      }).not.toThrow()
    })
  })

  describe('Virtual Scrolling Performance', () => {
    it('should initially load only 10 posts from large dataset', () => {
      const posts = createMockPosts(100)
      render(<PostList posts={posts} />)

      expect(screen.getAllByTestId(/^post-/)).toHaveLength(10)
    })

    it('should progressively load more posts as user scrolls', async () => {
      const posts = createMockPosts(50)
      render(<PostList posts={posts} hasMore={true} />)

      expect(screen.getAllByTestId(/^post-/)).toHaveLength(10)

      fireEvent.click(screen.getByText('Load More Posts'))
      await waitFor(() => {
        expect(screen.getAllByTestId(/^post-/)).toHaveLength(20)
      })
    })

    it('should maintain visible posts when props update', () => {
      const posts = createMockPosts(30)
      const { rerender } = render(<PostList posts={posts} />)

      expect(screen.getAllByTestId(/^post-/)).toHaveLength(10)

      rerender(<PostList posts={posts} sortBy="new" />)
      expect(screen.getAllByTestId(/^post-/)).toHaveLength(10)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty posts array', () => {
      render(<PostList posts={[]} />)

      expect(screen.getByText('No posts yet')).toBeInTheDocument()
    })

    it('should handle undefined posts prop', () => {
      render(<PostList />)

      expect(screen.getByText('No posts yet')).toBeInTheDocument()
    })

    it('should handle null onLoadMore callback', async () => {
      const posts = createMockPosts(15)
      render(<PostList posts={posts} hasMore={true} onLoadMore={null} />)

      expect(() => {
        fireEvent.click(screen.getByText('Load More Posts'))
      }).not.toThrow()
    })

    it('should handle posts with duplicate IDs', () => {
      const posts = [
        createMockPost(1, 'Post 1'),
        createMockPost(1, 'Post 1 Duplicate')
      ]

      render(<PostList posts={posts} />)

      const postElements = screen.getAllByTestId('post-1')
      expect(postElements.length).toBeGreaterThanOrEqual(1)
    })

    it('should handle rapid prop changes', () => {
      const { rerender } = render(<PostList posts={createMockPosts(5)} />)

      expect(() => {
        rerender(<PostList posts={createMockPosts(10)} />)
        rerender(<PostList posts={createMockPosts(3)} />)
        rerender(<PostList posts={createMockPosts(7)} />)
      }).not.toThrow()
    })

    it('should handle missing IntersectionObserver trigger ref', () => {
      const posts = createMockPosts(5)

      expect(() => {
        render(<PostList posts={posts} hasMore={false} />)
      }).not.toThrow()
    })

    it('should handle concurrent load more requests', async () => {
      const posts = createMockPosts(10)
      let resolveLoad
      mockOnLoadMore.mockImplementation(() => new Promise(resolve => {
        resolveLoad = resolve
      }))

      render(<PostList posts={posts} hasMore={true} onLoadMore={mockOnLoadMore} />)

      const button = screen.getByText('Load More Posts')
      fireEvent.click(button)
      fireEvent.click(button)
      fireEvent.click(button)

      expect(mockOnLoadMore).toHaveBeenCalledTimes(1)
    })
  })
})

export default mockIntersectionObserver
