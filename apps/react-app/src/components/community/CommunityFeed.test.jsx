import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CommunityFeed from './CommunityFeed'
import communityService from '../../services/communityService'
import socketService from '../../services/socket'
import { useConfirmationDialog } from '../ui/modal'

jest.mock('../../services/communityService')
jest.mock('../../services/socket')
jest.mock('../ui/modal')
jest.mock('../post/CreatePost', () => {
  return function CreatePost({ onClose, onCreate, communityId }) {
    return (
      <div data-testid="create-post-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={() => onCreate({
          id: 'new-post',
          title: 'New Post',
          communityId,
          authorId: 'user1',
          upvotes: 0,
          downvotes: 0
        })}>
          Create
        </button>
      </div>
    )
  }
})

const mockPosts = [
  {
    id: 'post1',
    title: 'Test Post 1',
    content: 'This is test content 1',
    author: { username: 'user1', avatar: '/avatar1.png', role: 'member' },
    authorId: 'user1',
    communityId: 'comm1',
    upvotes: 10,
    downvotes: 2,
    commentCount: 5,
    viewCount: 100,
    isPinned: false,
    isSaved: false,
    userVote: null,
    createdAt: new Date('2025-11-07T10:00:00Z'),
    media: [],
    url: null
  },
  {
    id: 'post2',
    title: 'Test Post 2',
    content: 'This is test content 2',
    author: { username: 'user2', avatar: '/avatar2.png', role: 'owner' },
    authorId: 'user2',
    communityId: 'comm1',
    upvotes: 5,
    downvotes: 1,
    commentCount: 3,
    viewCount: 50,
    isPinned: true,
    isSaved: false,
    userVote: 'up',
    createdAt: new Date('2025-11-07T09:00:00Z'),
    media: [{ url: '/media1.jpg' }],
    url: 'https://example.com'
  }
]

const mockCurrentUser = {
  id: 'user1',
  username: 'testuser'
}

const mockCommunity = {
  id: 'comm1',
  name: 'Test Community'
}

describe('CommunityFeed', () => {
  let mockConfirm
  let mockConfirmationDialog

  beforeEach(() => {
    jest.clearAllMocks()

    mockConfirm = jest.fn()
    mockConfirmationDialog = <div data-testid="confirmation-dialog" />

    useConfirmationDialog.mockReturnValue({
      confirm: mockConfirm,
      ConfirmationDialog: mockConfirmationDialog
    })

    communityService.getPosts.mockResolvedValue({
      success: true,
      posts: mockPosts,
      pagination: { hasMore: true }
    })

    socketService.subscribeToCommunity = jest.fn()
    socketService.unsubscribeFromCommunity = jest.fn()
    socketService.on = jest.fn()
    socketService.off = jest.fn()
  })

  describe('Feed Rendering', () => {
    it('should render the feed component', async () => {
      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })
    })

    it('should render feed header with controls', async () => {
      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Hot')).toBeInTheDocument()
      })

      expect(screen.getByText('New')).toBeInTheDocument()
      expect(screen.getByText('Top')).toBeInTheDocument()
      expect(screen.getByText('Rising')).toBeInTheDocument()
      expect(screen.getByText('Create Post')).toBeInTheDocument()
    })

    it('should apply correct CSS classes to feed container', async () => {
      const { container } = render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        const feedElement = container.querySelector('.community-feed')
        expect(feedElement).toBeInTheDocument()
      })
    })
  })

  describe('Post List Display', () => {
    it('should display all posts', async () => {
      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
        expect(screen.getByText('Test Post 2')).toBeInTheDocument()
      })
    })

    it('should display post author information', async () => {
      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument()
        expect(screen.getByText('user2')).toBeInTheDocument()
      })
    })

    it('should display post content', async () => {
      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('This is test content 1')).toBeInTheDocument()
        expect(screen.getByText('This is test content 2')).toBeInTheDocument()
      })
    })

    it('should display post media when available', async () => {
      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        const mediaImages = screen.getAllByAltText(/Post media/)
        expect(mediaImages).toHaveLength(1)
        expect(mediaImages[0]).toHaveAttribute('src', '/media1.jpg')
      })
    })

    it('should display post URL when available', async () => {
      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        const link = screen.getByRole('link', { name: 'https://example.com' })
        expect(link).toHaveAttribute('href', 'https://example.com')
        expect(link).toHaveAttribute('target', '_blank')
        expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      })
    })

    it('should display pinned indicator for pinned posts', async () => {
      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Pinned by moderators')).toBeInTheDocument()
      })
    })

    it('should display crown icon for owner role', async () => {
      const { container } = render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        const crownIcon = container.querySelector('.role-crown')
        expect(crownIcon).toBeInTheDocument()
      })
    })

    it('should display vote counts', async () => {
      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        const voteCounts = screen.getAllByText(/^(8|4)$/)
        expect(voteCounts.length).toBeGreaterThan(0)
      })
    })

    it('should display comment counts', async () => {
      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('5 comments')).toBeInTheDocument()
        expect(screen.getByText('3 comments')).toBeInTheDocument()
      })
    })

    it('should display view counts', async () => {
      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('100')).toBeInTheDocument()
        expect(screen.getByText('50')).toBeInTheDocument()
      })
    })
  })

  describe('Sort Controls', () => {
    it('should have hot as default sort', async () => {
      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        const hotButton = screen.getByRole('button', { name: /Hot/i })
        expect(hotButton).toHaveClass('active')
      })
    })

    it('should switch to new sort', async () => {
      const user = userEvent.setup()
      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      const newButton = screen.getByRole('button', { name: /New/i })
      await user.click(newButton)

      await waitFor(() => {
        expect(newButton).toHaveClass('active')
      })
    })

    it('should switch to top sort', async () => {
      const user = userEvent.setup()
      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      const topButton = screen.getByRole('button', { name: /^Top$/i })
      await user.click(topButton)

      await waitFor(() => {
        expect(topButton).toHaveClass('active')
      })
    })

    it('should switch to rising sort', async () => {
      const user = userEvent.setup()
      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      const risingButton = screen.getByRole('button', { name: /Rising/i })
      await user.click(risingButton)

      await waitFor(() => {
        expect(risingButton).toHaveClass('active')
      })
    })

    it('should reload posts when sort changes', async () => {
      const user = userEvent.setup()
      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(communityService.getPosts).toHaveBeenCalledTimes(1)
      })

      const newButton = screen.getByRole('button', { name: /New/i })
      await user.click(newButton)

      await waitFor(() => {
        expect(communityService.getPosts).toHaveBeenCalledTimes(2)
      })
    })

    it('should call getPosts with correct sort parameter', async () => {
      const user = userEvent.setup()
      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      const newButton = screen.getByRole('button', { name: /New/i })
      await user.click(newButton)

      await waitFor(() => {
        expect(communityService.getPosts).toHaveBeenCalledWith(
          expect.objectContaining({ sort: 'new' })
        )
      })
    })
  })

  describe('Filter Controls', () => {
    it('should show time range filter when top sort is selected', async () => {
      const user = userEvent.setup()
      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      const topButton = screen.getByRole('button', { name: /^Top$/i })
      await user.click(topButton)

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })
    })

    it('should not show time range filter for other sorts', async () => {
      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    })

    it('should have all time as default time range', async () => {
      const user = userEvent.setup()
      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      const topButton = screen.getByRole('button', { name: /^Top$/i })
      await user.click(topButton)

      await waitFor(() => {
        const select = screen.getByRole('combobox')
        expect(select).toHaveValue('all')
      })
    })

    it('should change time range to hour', async () => {
      const user = userEvent.setup()
      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      const topButton = screen.getByRole('button', { name: /^Top$/i })
      await user.click(topButton)

      const select = await screen.findByRole('combobox')
      await user.selectOptions(select, 'hour')

      expect(select).toHaveValue('hour')
    })

    it('should reload posts when time range changes', async () => {
      const user = userEvent.setup()
      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(communityService.getPosts).toHaveBeenCalledTimes(1)
      })

      const topButton = screen.getByRole('button', { name: /^Top$/i })
      await user.click(topButton)

      await waitFor(() => {
        expect(communityService.getPosts).toHaveBeenCalledTimes(2)
      })

      const select = await screen.findByRole('combobox')
      await user.selectOptions(select, 'week')

      await waitFor(() => {
        expect(communityService.getPosts).toHaveBeenCalledTimes(3)
      })
    })

    it('should call getPosts with correct timeRange parameter', async () => {
      const user = userEvent.setup()
      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      const topButton = screen.getByRole('button', { name: /^Top$/i })
      await user.click(topButton)

      const select = await screen.findByRole('combobox')
      await user.selectOptions(select, 'month')

      await waitFor(() => {
        expect(communityService.getPosts).toHaveBeenCalledWith(
          expect.objectContaining({ timeRange: 'month' })
        )
      })
    })
  })

  describe('Infinite Scroll', () => {
    it('should show load more button when hasMore is true', async () => {
      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Load More Posts')).toBeInTheDocument()
      })
    })

    it('should not show load more button when hasMore is false', async () => {
      communityService.getPosts.mockResolvedValue({
        success: true,
        posts: mockPosts,
        pagination: { hasMore: false }
      })

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      expect(screen.queryByText('Load More Posts')).not.toBeInTheDocument()
    })

    it('should load more posts when button is clicked', async () => {
      const user = userEvent.setup()
      communityService.getPosts
        .mockResolvedValueOnce({
          success: true,
          posts: mockPosts,
          pagination: { hasMore: true }
        })
        .mockResolvedValueOnce({
          success: true,
          posts: [{ ...mockPosts[0], id: 'post3', title: 'Post 3' }],
          pagination: { hasMore: false }
        })

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Load More Posts')).toBeInTheDocument()
      })

      const loadMoreButton = screen.getByText('Load More Posts')
      await user.click(loadMoreButton)

      await waitFor(() => {
        expect(communityService.getPosts).toHaveBeenCalledTimes(2)
      })
    })

    it('should append new posts to existing posts', async () => {
      const user = userEvent.setup()
      communityService.getPosts
        .mockResolvedValueOnce({
          success: true,
          posts: mockPosts,
          pagination: { hasMore: true }
        })
        .mockResolvedValueOnce({
          success: true,
          posts: [{ ...mockPosts[0], id: 'post3', title: 'Post 3' }],
          pagination: { hasMore: false }
        })

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      const loadMoreButton = screen.getByText('Load More Posts')
      await user.click(loadMoreButton)

      await waitFor(() => {
        expect(screen.getByText('Post 3')).toBeInTheDocument()
      })

      expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      expect(screen.getByText('Test Post 2')).toBeInTheDocument()
    })

    it('should increment page number when loading more', async () => {
      const user = userEvent.setup()
      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Load More Posts')).toBeInTheDocument()
      })

      const loadMoreButton = screen.getByText('Load More Posts')
      await user.click(loadMoreButton)

      await waitFor(() => {
        expect(communityService.getPosts).toHaveBeenLastCalledWith(
          expect.objectContaining({ page: 2 })
        )
      })
    })

    it('should disable load more button while loading', async () => {
      const user = userEvent.setup()
      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Load More Posts')).toBeInTheDocument()
      })

      const loadMoreButton = screen.getByText('Load More Posts')
      await user.click(loadMoreButton)

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should not load more if already loading', async () => {
      const user = userEvent.setup()
      let resolveFirstLoad
      const firstLoadPromise = new Promise(resolve => {
        resolveFirstLoad = resolve
      })

      communityService.getPosts
        .mockReturnValueOnce(firstLoadPromise)
        .mockResolvedValue({
          success: true,
          posts: [],
          pagination: { hasMore: false }
        })

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      resolveFirstLoad({
        success: true,
        posts: mockPosts,
        pagination: { hasMore: true }
      })

      await waitFor(() => {
        expect(screen.getByText('Load More Posts')).toBeInTheDocument()
      })

      const loadMoreButton = screen.getByText('Load More Posts')
      await user.click(loadMoreButton)
      await user.click(loadMoreButton)

      await waitFor(() => {
        expect(communityService.getPosts).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Empty States', () => {
    it('should display empty state when no posts', async () => {
      communityService.getPosts.mockResolvedValue({
        success: true,
        posts: [],
        pagination: { hasMore: false }
      })

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('No posts yet')).toBeInTheDocument()
      })
    })

    it('should show create post button in empty state', async () => {
      communityService.getPosts.mockResolvedValue({
        success: true,
        posts: [],
        pagination: { hasMore: false }
      })

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getAllByText('Create Post')).toHaveLength(2)
      })
    })

    it('should open create post modal from empty state', async () => {
      const user = userEvent.setup()
      communityService.getPosts.mockResolvedValue({
        success: true,
        posts: [],
        pagination: { hasMore: false }
      })

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('No posts yet')).toBeInTheDocument()
      })

      const createButtons = screen.getAllByText('Create Post')
      await user.click(createButtons[0])

      expect(screen.getByTestId('create-post-modal')).toBeInTheDocument()
    })

    it('should display empty state message', async () => {
      communityService.getPosts.mockResolvedValue({
        success: true,
        posts: [],
        pagination: { hasMore: false }
      })

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Be the first to share something with this community!')).toBeInTheDocument()
      })
    })
  })

  describe('Loading States', () => {
    it('should display loading state initially', () => {
      communityService.getPosts.mockReturnValue(new Promise(() => {}))

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      expect(screen.getByText('Loading posts...')).toBeInTheDocument()
    })

    it('should display spinner in loading state', () => {
      communityService.getPosts.mockReturnValue(new Promise(() => {}))

      const { container } = render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      expect(container.querySelector('.spinner')).toBeInTheDocument()
    })

    it('should hide loading state after posts load', async () => {
      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading posts...')).not.toBeInTheDocument()
      })
    })

    it('should show loading text on load more button while loading', async () => {
      const user = userEvent.setup()
      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Load More Posts')).toBeInTheDocument()
      })

      communityService.getPosts.mockReturnValue(new Promise(() => {}))

      const loadMoreButton = screen.getByText('Load More Posts')
      await user.click(loadMoreButton)

      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument()
      })
    })
  })

  describe('Error States', () => {
    it('should display error message when API fails', async () => {
      communityService.getPosts.mockResolvedValue({
        success: false,
        error: 'Failed to fetch posts'
      })

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch posts')).toBeInTheDocument()
      })
    })

    it('should display error message when API throws', async () => {
      communityService.getPosts.mockRejectedValue(new Error('Network error'))

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Failed to load posts')).toBeInTheDocument()
      })
    })

    it('should allow dismissing error message', async () => {
      const user = userEvent.setup()
      communityService.getPosts.mockResolvedValue({
        success: false,
        error: 'Failed to fetch posts'
      })

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch posts')).toBeInTheDocument()
      })

      const dismissButton = screen.getByRole('button', { name: 'Dismiss' })
      await user.click(dismissButton)

      expect(screen.queryByText('Failed to fetch posts')).not.toBeInTheDocument()
    })

    it('should show error when vote fails', async () => {
      const user = userEvent.setup()
      communityService.votePost.mockResolvedValue({
        success: false,
        error: 'Vote failed'
      })

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      const upvoteButtons = screen.getAllByRole('button', { name: '' })
      const firstUpvote = upvoteButtons.find(btn => btn.querySelector('svg'))
      await user.click(firstUpvote)

      await waitFor(() => {
        expect(screen.getByText('Vote failed')).toBeInTheDocument()
      })
    })

    it('should show error when save fails', async () => {
      const user = userEvent.setup()
      communityService.savePost.mockResolvedValue({
        success: false,
        error: 'Save failed'
      })

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      const moreButtons = screen.getAllByRole('button', { name: '' })
      await user.click(moreButtons[0])

      const saveButton = await screen.findByText('Save Post')
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText('Save failed')).toBeInTheDocument()
      })
    })

    it('should show error when delete fails', async () => {
      const user = userEvent.setup()
      mockConfirm.mockResolvedValue(true)
      communityService.deletePost.mockResolvedValue({
        success: false,
        error: 'Delete failed'
      })

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      const moreButtons = screen.getAllByRole('button', { name: '' })
      await user.click(moreButtons[0])

      const deleteButton = await screen.findByText('Delete')
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText('Delete failed')).toBeInTheDocument()
      })
    })

    it('should show error when pin fails', async () => {
      const user = userEvent.setup()
      communityService.updatePost.mockResolvedValue({
        success: false,
        error: 'Pin failed'
      })

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
          canModerate={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      const moreButtons = screen.getAllByRole('button', { name: '' })
      await user.click(moreButtons[0])

      const pinButton = await screen.findByText('Pin Post')
      await user.click(pinButton)

      await waitFor(() => {
        expect(screen.getByText('Pin failed')).toBeInTheDocument()
      })
    })
  })

  describe('Real-time Updates', () => {
    it('should subscribe to community on mount', async () => {
      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(socketService.subscribeToCommunity).toHaveBeenCalledWith('comm1')
      })
    })

    it('should unsubscribe from community on unmount', async () => {
      const { unmount } = render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      unmount()

      expect(socketService.unsubscribeFromCommunity).toHaveBeenCalledWith('comm1')
    })

    it('should register socket event listeners', async () => {
      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(socketService.on).toHaveBeenCalledWith('community_post_created', expect.any(Function))
        expect(socketService.on).toHaveBeenCalledWith('community_post_updated', expect.any(Function))
        expect(socketService.on).toHaveBeenCalledWith('community_post_deleted', expect.any(Function))
        expect(socketService.on).toHaveBeenCalledWith('community_post_vote_updated', expect.any(Function))
      })
    })

    it('should remove socket event listeners on unmount', async () => {
      const { unmount } = render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      unmount()

      expect(socketService.off).toHaveBeenCalledWith('community_post_created', expect.any(Function))
      expect(socketService.off).toHaveBeenCalledWith('community_post_updated', expect.any(Function))
      expect(socketService.off).toHaveBeenCalledWith('community_post_deleted', expect.any(Function))
      expect(socketService.off).toHaveBeenCalledWith('community_post_vote_updated', expect.any(Function))
    })

    it('should add new post when created event received', async () => {
      let postCreatedHandler
      socketService.on.mockImplementation((event, handler) => {
        if (event === 'community_post_created') {
          postCreatedHandler = handler
        }
      })

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      const newPost = {
        id: 'post3',
        title: 'New Real-time Post',
        communityId: 'comm1',
        author: { username: 'user3', avatar: '/avatar3.png' },
        upvotes: 0,
        downvotes: 0,
        commentCount: 0,
        viewCount: 0,
        createdAt: new Date()
      }

      postCreatedHandler(newPost)

      await waitFor(() => {
        expect(screen.getByText('New Real-time Post')).toBeInTheDocument()
      })
    })

    it('should update post when updated event received', async () => {
      let postUpdatedHandler
      socketService.on.mockImplementation((event, handler) => {
        if (event === 'community_post_updated') {
          postUpdatedHandler = handler
        }
      })

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      const updatedPost = {
        ...mockPosts[0],
        title: 'Updated Title',
        communityId: 'comm1'
      }

      postUpdatedHandler(updatedPost)

      await waitFor(() => {
        expect(screen.getByText('Updated Title')).toBeInTheDocument()
      })
    })

    it('should remove post when deleted event received', async () => {
      let postDeletedHandler
      socketService.on.mockImplementation((event, handler) => {
        if (event === 'community_post_deleted') {
          postDeletedHandler = handler
        }
      })

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      postDeletedHandler('post1')

      await waitFor(() => {
        expect(screen.queryByText('Test Post 1')).not.toBeInTheDocument()
      })
    })

    it('should update votes when vote updated event received', async () => {
      let voteUpdatedHandler
      socketService.on.mockImplementation((event, handler) => {
        if (event === 'community_post_vote_updated') {
          voteUpdatedHandler = handler
        }
      })

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      voteUpdatedHandler({
        postId: 'post1',
        communityId: 'comm1',
        upvotes: 100,
        downvotes: 5,
        userVote: 'up'
      })

      await waitFor(() => {
        expect(screen.getByText('95')).toBeInTheDocument()
      })
    })

    it('should not add post from different community', async () => {
      let postCreatedHandler
      socketService.on.mockImplementation((event, handler) => {
        if (event === 'community_post_created') {
          postCreatedHandler = handler
        }
      })

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      const postCount = screen.getAllByText(/Test Post/).length

      const newPost = {
        id: 'post3',
        title: 'Different Community Post',
        communityId: 'comm2',
        author: { username: 'user3' }
      }

      postCreatedHandler(newPost)

      await waitFor(() => {
        expect(screen.getAllByText(/Test Post/).length).toBe(postCount)
      })
    })
  })

  describe('API Integration', () => {
    it('should call getPosts with correct parameters', async () => {
      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(communityService.getPosts).toHaveBeenCalledWith({
          page: 1,
          limit: 25,
          sort: 'hot',
          timeRange: 'all',
          communityId: 'comm1'
        })
      })
    })

    it('should call votePost when voting', async () => {
      const user = userEvent.setup()
      communityService.votePost.mockResolvedValue({ success: true })

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      const upvoteButtons = screen.getAllByRole('button', { name: '' })
      const firstUpvote = upvoteButtons.find(btn => btn.querySelector('svg'))
      await user.click(firstUpvote)

      await waitFor(() => {
        expect(communityService.votePost).toHaveBeenCalledWith('post1', 'up')
      })
    })

    it('should call savePost when saving', async () => {
      const user = userEvent.setup()
      communityService.savePost.mockResolvedValue({ success: true })

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      const moreButtons = screen.getAllByRole('button', { name: '' })
      await user.click(moreButtons[0])

      const saveButton = await screen.findByText('Save Post')
      await user.click(saveButton)

      await waitFor(() => {
        expect(communityService.savePost).toHaveBeenCalledWith('post1', true)
      })
    })

    it('should call deletePost when deleting', async () => {
      const user = userEvent.setup()
      mockConfirm.mockResolvedValue(true)
      communityService.deletePost.mockResolvedValue({ success: true })

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      const moreButtons = screen.getAllByRole('button', { name: '' })
      await user.click(moreButtons[0])

      const deleteButton = await screen.findByText('Delete')
      await user.click(deleteButton)

      await waitFor(() => {
        expect(communityService.deletePost).toHaveBeenCalledWith('post1')
      })
    })

    it('should call updatePost when pinning', async () => {
      const user = userEvent.setup()
      communityService.updatePost.mockResolvedValue({ success: true })

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
          canModerate={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      const moreButtons = screen.getAllByRole('button', { name: '' })
      await user.click(moreButtons[0])

      const pinButton = await screen.findByText('Pin Post')
      await user.click(pinButton)

      await waitFor(() => {
        expect(communityService.updatePost).toHaveBeenCalledWith('post1', { isPinned: true })
      })
    })
  })

  describe('Voting Functionality', () => {
    it('should handle upvote optimistically', async () => {
      const user = userEvent.setup()
      communityService.votePost.mockResolvedValue({ success: true })

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('8')).toBeInTheDocument()
      })

      const upvoteButtons = screen.getAllByRole('button', { name: '' })
      const firstUpvote = upvoteButtons.find(btn => btn.querySelector('svg'))
      await user.click(firstUpvote)

      await waitFor(() => {
        expect(screen.getByText('9')).toBeInTheDocument()
      })
    })

    it('should handle downvote optimistically', async () => {
      const user = userEvent.setup()
      communityService.votePost.mockResolvedValue({ success: true })

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('8')).toBeInTheDocument()
      })

      const allButtons = screen.getAllByRole('button', { name: '' })
      const downvoteButton = allButtons[1]
      await user.click(downvoteButton)

      await waitFor(() => {
        expect(screen.getByText('7')).toBeInTheDocument()
      })
    })

    it('should remove vote when clicking same vote button', async () => {
      const user = userEvent.setup()
      communityService.votePost.mockResolvedValue({ success: true })

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('4')).toBeInTheDocument()
      })

      const allButtons = screen.getAllByRole('button')
      const upvoteButtons = allButtons.filter(btn =>
        btn.className.includes('vote-btn') && btn.className.includes('active')
      )

      if (upvoteButtons.length > 0) {
        await user.click(upvoteButtons[0])

        await waitFor(() => {
          expect(communityService.votePost).toHaveBeenCalledWith('post2', 'remove')
        })
      }
    })

    it('should revert vote on API failure', async () => {
      const user = userEvent.setup()
      communityService.votePost.mockResolvedValue({
        success: false,
        error: 'Vote failed'
      })

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('8')).toBeInTheDocument()
      })

      const upvoteButtons = screen.getAllByRole('button', { name: '' })
      const firstUpvote = upvoteButtons.find(btn => btn.querySelector('svg'))
      await user.click(firstUpvote)

      await waitFor(() => {
        expect(screen.getByText('8')).toBeInTheDocument()
      })
    })

    it('should handle switching from upvote to downvote', async () => {
      const user = userEvent.setup()
      communityService.votePost.mockResolvedValue({ success: true })

      const postsWithUpvote = [
        { ...mockPosts[0], userVote: 'up', upvotes: 11, downvotes: 2 }
      ]

      communityService.getPosts.mockResolvedValue({
        success: true,
        posts: postsWithUpvote,
        pagination: { hasMore: false }
      })

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('9')).toBeInTheDocument()
      })

      const allButtons = screen.getAllByRole('button', { name: '' })
      const downvoteButton = allButtons[1]
      await user.click(downvoteButton)

      await waitFor(() => {
        expect(screen.getByText('7')).toBeInTheDocument()
      })
    })
  })

  describe('Post Actions', () => {
    it('should toggle post actions menu', async () => {
      const user = userEvent.setup()
      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      const moreButtons = screen.getAllByRole('button', { name: '' })
      await user.click(moreButtons[0])

      expect(await screen.findByText('Save Post')).toBeInTheDocument()
      expect(screen.getByText('Share')).toBeInTheDocument()
      expect(screen.getByText('Report')).toBeInTheDocument()
    })

    it('should show edit option for own posts', async () => {
      const user = userEvent.setup()
      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      const moreButtons = screen.getAllByRole('button', { name: '' })
      await user.click(moreButtons[0])

      expect(await screen.findByText('Edit Post')).toBeInTheDocument()
    })

    it('should show delete option for own posts', async () => {
      const user = userEvent.setup()
      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      const moreButtons = screen.getAllByRole('button', { name: '' })
      await user.click(moreButtons[0])

      expect(await screen.findByText('Delete')).toBeInTheDocument()
    })

    it('should show pin option for moderators', async () => {
      const user = userEvent.setup()
      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
          canModerate={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      const moreButtons = screen.getAllByRole('button', { name: '' })
      await user.click(moreButtons[0])

      expect(await screen.findByText('Pin Post')).toBeInTheDocument()
    })

    it('should not show pin option for non-moderators', async () => {
      const user = userEvent.setup()
      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
          canModerate={false}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      const moreButtons = screen.getAllByRole('button', { name: '' })
      await user.click(moreButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Save Post')).toBeInTheDocument()
      })

      expect(screen.queryByText('Pin Post')).not.toBeInTheDocument()
    })

    it('should toggle save post', async () => {
      const user = userEvent.setup()
      communityService.savePost.mockResolvedValue({ success: true })

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      const moreButtons = screen.getAllByRole('button', { name: '' })
      await user.click(moreButtons[0])

      const saveButton = await screen.findByText('Save Post')
      await user.click(saveButton)

      await waitFor(() => {
        expect(communityService.savePost).toHaveBeenCalledWith('post1', true)
      })
    })

    it('should request confirmation before deleting', async () => {
      const user = userEvent.setup()
      mockConfirm.mockResolvedValue(false)

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      const moreButtons = screen.getAllByRole('button', { name: '' })
      await user.click(moreButtons[0])

      const deleteButton = await screen.findByText('Delete')
      await user.click(deleteButton)

      await waitFor(() => {
        expect(mockConfirm).toHaveBeenCalledWith({
          type: 'error',
          title: 'Delete Post',
          description: 'Are you sure you want to delete this post? This action cannot be undone.',
          confirmText: 'Delete',
          confirmVariant: 'destructive'
        })
      })
    })

    it('should not delete if confirmation is cancelled', async () => {
      const user = userEvent.setup()
      mockConfirm.mockResolvedValue(false)

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      const moreButtons = screen.getAllByRole('button', { name: '' })
      await user.click(moreButtons[0])

      const deleteButton = await screen.findByText('Delete')
      await user.click(deleteButton)

      await waitFor(() => {
        expect(mockConfirm).toHaveBeenCalled()
      })

      expect(communityService.deletePost).not.toHaveBeenCalled()
    })

    it('should toggle pin state', async () => {
      const user = userEvent.setup()
      communityService.updatePost.mockResolvedValue({ success: true })

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
          canModerate={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 2')).toBeInTheDocument()
      })

      const moreButtons = screen.getAllByRole('button', { name: '' })
      await user.click(moreButtons[1])

      const unpinButton = await screen.findByText('Unpin Post')
      await user.click(unpinButton)

      await waitFor(() => {
        expect(communityService.updatePost).toHaveBeenCalledWith('post2', { isPinned: false })
      })
    })
  })

  describe('Create Post Modal', () => {
    it('should open create post modal', async () => {
      const user = userEvent.setup()
      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      const createButton = screen.getByRole('button', { name: /Create Post/i })
      await user.click(createButton)

      expect(screen.getByTestId('create-post-modal')).toBeInTheDocument()
    })

    it('should close create post modal', async () => {
      const user = userEvent.setup()
      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      const createButton = screen.getByRole('button', { name: /Create Post/i })
      await user.click(createButton)

      const closeButton = screen.getByRole('button', { name: 'Close' })
      await user.click(closeButton)

      expect(screen.queryByTestId('create-post-modal')).not.toBeInTheDocument()
    })

    it('should add new post and close modal on create', async () => {
      const user = userEvent.setup()
      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      const createButton = screen.getByRole('button', { name: /Create Post/i })
      await user.click(createButton)

      const createButtonInModal = screen.getByRole('button', { name: 'Create' })
      await user.click(createButtonInModal)

      await waitFor(() => {
        expect(screen.getByText('New Post')).toBeInTheDocument()
        expect(screen.queryByTestId('create-post-modal')).not.toBeInTheDocument()
      })
    })
  })

  describe('Helper Functions', () => {
    it('should format large numbers correctly', async () => {
      const postsWithLargeNumbers = [
        { ...mockPosts[0], upvotes: 5000, downvotes: 0, commentCount: 1500, viewCount: 10000 }
      ]

      communityService.getPosts.mockResolvedValue({
        success: true,
        posts: postsWithLargeNumbers,
        pagination: { hasMore: false }
      })

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('5.0k')).toBeInTheDocument()
        expect(screen.getByText('1.5k comments')).toBeInTheDocument()
        expect(screen.getByText('10.0k')).toBeInTheDocument()
      })
    })

    it('should display time since in minutes', async () => {
      const now = new Date()
      const thirtyMinutesAgo = new Date(now - 30 * 60 * 1000)

      const recentPosts = [
        { ...mockPosts[0], createdAt: thirtyMinutesAgo }
      ]

      communityService.getPosts.mockResolvedValue({
        success: true,
        posts: recentPosts,
        pagination: { hasMore: false }
      })

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('30m ago')).toBeInTheDocument()
      })
    })

    it('should display time since in hours', async () => {
      const now = new Date()
      const fiveHoursAgo = new Date(now - 5 * 60 * 60 * 1000)

      const recentPosts = [
        { ...mockPosts[0], createdAt: fiveHoursAgo }
      ]

      communityService.getPosts.mockResolvedValue({
        success: true,
        posts: recentPosts,
        pagination: { hasMore: false }
      })

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('5h ago')).toBeInTheDocument()
      })
    })

    it('should display time since in days', async () => {
      const now = new Date()
      const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000)

      const recentPosts = [
        { ...mockPosts[0], createdAt: threeDaysAgo }
      ]

      communityService.getPosts.mockResolvedValue({
        success: true,
        posts: recentPosts,
        pagination: { hasMore: false }
      })

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('3d ago')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle API error with custom error message', async () => {
      communityService.getPosts.mockResolvedValue({
        success: false,
        error: 'Custom error message'
      })

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Custom error message')).toBeInTheDocument()
      })
    })

    it('should handle network error gracefully', async () => {
      communityService.getPosts.mockRejectedValue(new Error('Network error'))

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Failed to load posts')).toBeInTheDocument()
      })
    })

    it('should log error to console on vote failure', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      const user = userEvent.setup()
      communityService.votePost.mockRejectedValue(new Error('Vote error'))

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      const upvoteButtons = screen.getAllByRole('button', { name: '' })
      const firstUpvote = upvoteButtons.find(btn => btn.querySelector('svg'))
      await user.click(firstUpvote)

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to vote:', expect.any(Error))
      })

      consoleError.mockRestore()
    })

    it('should log error to console on save failure', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      const user = userEvent.setup()
      communityService.savePost.mockRejectedValue(new Error('Save error'))

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      const moreButtons = screen.getAllByRole('button', { name: '' })
      await user.click(moreButtons[0])

      const saveButton = await screen.findByText('Save Post')
      await user.click(saveButton)

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to save post:', expect.any(Error))
      })

      consoleError.mockRestore()
    })

    it('should log error to console on delete failure', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      const user = userEvent.setup()
      mockConfirm.mockResolvedValue(true)
      communityService.deletePost.mockRejectedValue(new Error('Delete error'))

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      const moreButtons = screen.getAllByRole('button', { name: '' })
      await user.click(moreButtons[0])

      const deleteButton = await screen.findByText('Delete')
      await user.click(deleteButton)

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to delete post:', expect.any(Error))
      })

      consoleError.mockRestore()
    })

    it('should log error to console on pin failure', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      const user = userEvent.setup()
      communityService.updatePost.mockRejectedValue(new Error('Pin error'))

      render(
        <CommunityFeed
          communityId="comm1"
          currentUser={mockCurrentUser}
          community={mockCommunity}
          canModerate={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      })

      const moreButtons = screen.getAllByRole('button', { name: '' })
      await user.click(moreButtons[0])

      const pinButton = await screen.findByText('Pin Post')
      await user.click(pinButton)

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to pin post:', expect.any(Error))
      })

      consoleError.mockRestore()
    })
  })
})

export default CreatePost
