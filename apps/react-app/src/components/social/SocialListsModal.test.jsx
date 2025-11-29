/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, mockUser } from '../../__test__/utils/testUtils'
import SocialListsModal from './SocialListsModal'
import socialService from '../../services/socialService'

// Mock dependencies
jest.mock('../../services/socialService')
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser({ id: 'current-user' })
  })
}))
jest.mock('../ui/useToast', () => ({
  useToast: () => ({
    showToast: jest.fn()
  })
}))
jest.mock('./FollowButton', () => ({
  __esModule: true,
  default: ({ userId, initialState, onStateChange }) => (
    <button
      data-testid={`follow-button-${userId}`}
      onClick={() => onStateChange({ isFollowing: !initialState.isFollowing })}
    >
      {initialState.isFollowing ? 'Unfollow' : 'Follow'}
    </button>
  )
}))

describe('SocialListsModal', () => {
  const mockUsers = [
    {
      id: 'user1',
      username: 'techguru',
      displayName: 'Tech Guru',
      avatar: null,
      bio: 'Full-stack developer passionate about Web3',
      isVerified: true,
      isOnline: true,
      joinedDate: '2023-01-15',
      location: 'San Francisco, CA',
      mutualConnections: 15,
      karma: 2456,
      relationship: {
        isFollowing: true,
        isFollower: false,
        isFriend: false,
        followedAt: '2023-06-15'
      }
    },
    {
      id: 'user2',
      username: 'cryptoking',
      displayName: 'Crypto King',
      avatar: '👑',
      bio: 'DeFi enthusiast and crypto trader',
      isVerified: false,
      isOnline: false,
      joinedDate: '2023-03-20',
      location: 'New York, NY',
      mutualConnections: 8,
      karma: 1823,
      relationship: {
        isFollowing: false,
        isFollower: true,
        isFriend: false,
        followedAt: '2023-07-10'
      }
    },
    {
      id: 'user3',
      username: 'nftcollector',
      displayName: 'NFT Collector',
      avatar: '🎨',
      bio: 'Digital art collector and NFT enthusiast',
      isVerified: true,
      isOnline: true,
      joinedDate: '2023-02-08',
      location: 'London, UK',
      mutualConnections: 12,
      karma: 3190,
      relationship: {
        isFollowing: true,
        isFollower: true,
        isFriend: true,
        followedAt: '2023-05-22'
      }
    }
  ]

  const mockStats = {
    followers: 1234,
    following: 567,
    friends: 89,
    mutualConnections: 23
  }

  const defaultProps = {
    userId: 'test-user-id',
    initialTab: 'followers',
    onClose: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    socialService.getFollowers.mockResolvedValue({
      users: mockUsers.filter(u => u.relationship.isFollower),
      page: 1,
      limit: 20,
      total: 1,
      hasMore: false
    })
    socialService.getFollowing.mockResolvedValue({
      users: mockUsers.filter(u => u.relationship.isFollowing),
      page: 1,
      limit: 20,
      total: 2,
      hasMore: false
    })
    socialService.getFriends.mockResolvedValue({
      users: mockUsers.filter(u => u.relationship.isFriend),
      page: 1,
      limit: 20,
      total: 1,
      hasMore: false
    })
    socialService.getMutualConnections.mockResolvedValue({
      users: mockUsers.filter(u => u.mutualConnections > 0),
      page: 1,
      limit: 10,
      total: 3,
      hasMore: false
    })
    socialService.getNetworkStats.mockResolvedValue(mockStats)
  })

  describe('Modal Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<SocialListsModal {...defaultProps} />)
      expect(container).toBeInTheDocument()
    })

    it('renders modal with correct title', () => {
      render(<SocialListsModal {...defaultProps} />)
      expect(screen.getByText('Social Connections')).toBeInTheDocument()
    })

    it('renders close button', () => {
      render(<SocialListsModal {...defaultProps} />)
      const closeButton = screen.getByRole('button', { name: /close/i })
      expect(closeButton).toBeInTheDocument()
    })

    it('calls onClose when close button is clicked', async () => {
      const onClose = jest.fn()
      render(<SocialListsModal {...defaultProps} onClose={onClose} />)

      const closeButtons = screen.getAllByRole('button')
      const closeButton = closeButtons.find(btn => btn.classList.contains('close-btn'))

      await userEvent.click(closeButton)
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('renders refresh button', () => {
      render(<SocialListsModal {...defaultProps} />)
      const refreshButton = screen.getByRole('button', { name: /refresh/i })
      expect(refreshButton).toBeInTheDocument()
    })

    it('renders all tab buttons', () => {
      render(<SocialListsModal {...defaultProps} />)
      expect(screen.getByText('Followers')).toBeInTheDocument()
      expect(screen.getByText('Following')).toBeInTheDocument()
      expect(screen.getByText('Friends')).toBeInTheDocument()
      expect(screen.getByText('Mutual')).toBeInTheDocument()
    })

    it('renders search input', () => {
      render(<SocialListsModal {...defaultProps} />)
      expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument()
    })

    it('renders filter button', () => {
      render(<SocialListsModal {...defaultProps} />)
      expect(screen.getByText('Filters')).toBeInTheDocument()
    })
  })

  describe('Initial Tab Display', () => {
    it('displays followers tab as active by default', async () => {
      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        const followersTab = screen.getByText('Followers').closest('button')
        expect(followersTab).toHaveClass('active')
      })
    })

    it('displays specified initial tab', async () => {
      render(<SocialListsModal {...defaultProps} initialTab="following" />)

      await waitFor(() => {
        const followingTab = screen.getByText('Following').closest('button')
        expect(followingTab).toHaveClass('active')
      })
    })

    it('displays friends tab when specified', async () => {
      render(<SocialListsModal {...defaultProps} initialTab="friends" />)

      await waitFor(() => {
        const friendsTab = screen.getByText('Friends').closest('button')
        expect(friendsTab).toHaveClass('active')
      })
    })

    it('displays mutual tab when specified', async () => {
      render(<SocialListsModal {...defaultProps} initialTab="mutual" />)

      await waitFor(() => {
        const mutualTab = screen.getByText('Mutual').closest('button')
        expect(mutualTab).toHaveClass('active')
      })
    })
  })

  describe('Tab Navigation', () => {
    it('switches to following tab when clicked', async () => {
      render(<SocialListsModal {...defaultProps} />)

      const followingTab = screen.getByText('Following').closest('button')
      await userEvent.click(followingTab)

      expect(followingTab).toHaveClass('active')
      await waitFor(() => {
        expect(socialService.getFollowing).toHaveBeenCalled()
      })
    })

    it('switches to friends tab when clicked', async () => {
      render(<SocialListsModal {...defaultProps} />)

      const friendsTab = screen.getByText('Friends').closest('button')
      await userEvent.click(friendsTab)

      expect(friendsTab).toHaveClass('active')
      await waitFor(() => {
        expect(socialService.getFriends).toHaveBeenCalled()
      })
    })

    it('switches to mutual tab when clicked', async () => {
      render(<SocialListsModal {...defaultProps} />)

      const mutualTab = screen.getByText('Mutual').closest('button')
      await userEvent.click(mutualTab)

      expect(mutualTab).toHaveClass('active')
      await waitFor(() => {
        expect(socialService.getMutualConnections).toHaveBeenCalled()
      })
    })

    it('loads correct users when switching tabs', async () => {
      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('cryptoking')).toBeInTheDocument()
      })

      const followingTab = screen.getByText('Following').closest('button')
      await userEvent.click(followingTab)

      await waitFor(() => {
        expect(screen.getByText('techguru')).toBeInTheDocument()
      })
    })
  })

  describe('Loading States', () => {
    it('shows loading state on initial load', () => {
      render(<SocialListsModal {...defaultProps} />)
      expect(screen.getByText('Loading users...')).toBeInTheDocument()
    })

    it('hides loading state after data loads', async () => {
      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading users...')).not.toBeInTheDocument()
      })
    })

    it('shows loading state when switching tabs', async () => {
      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading users...')).not.toBeInTheDocument()
      })

      const followingTab = screen.getByText('Following').closest('button')
      await userEvent.click(followingTab)

      expect(screen.getByText('Loading users...')).toBeInTheDocument()
    })
  })

  describe('API Integration', () => {
    it('calls getFollowers API on mount', async () => {
      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(socialService.getFollowers).toHaveBeenCalledWith(
          'test-user-id',
          1,
          20,
          ''
        )
      })
    })

    it('calls getNetworkStats API on mount', async () => {
      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(socialService.getNetworkStats).toHaveBeenCalledWith('test-user-id')
      })
    })

    it('calls getFollowing when switching to following tab', async () => {
      render(<SocialListsModal {...defaultProps} />)

      const followingTab = screen.getByText('Following').closest('button')
      await userEvent.click(followingTab)

      await waitFor(() => {
        expect(socialService.getFollowing).toHaveBeenCalledWith(
          'test-user-id',
          1,
          20,
          ''
        )
      })
    })

    it('calls getFriends when switching to friends tab', async () => {
      render(<SocialListsModal {...defaultProps} />)

      const friendsTab = screen.getByText('Friends').closest('button')
      await userEvent.click(friendsTab)

      await waitFor(() => {
        expect(socialService.getFriends).toHaveBeenCalledWith(
          'test-user-id',
          1,
          20,
          ''
        )
      })
    })

    it('calls getMutualConnections when switching to mutual tab', async () => {
      render(<SocialListsModal {...defaultProps} />)

      const mutualTab = screen.getByText('Mutual').closest('button')
      await userEvent.click(mutualTab)

      await waitFor(() => {
        expect(socialService.getMutualConnections).toHaveBeenCalledWith(
          'test-user-id',
          20
        )
      })
    })
  })

  describe('Error Handling', () => {
    it('displays mock data when API fails', async () => {
      socialService.getFollowers.mockRejectedValueOnce(new Error('API Error'))

      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading users...')).not.toBeInTheDocument()
      })

      expect(screen.getByText(/cryptoking/i)).toBeInTheDocument()
    })

    it('displays mock stats when stats API fails', async () => {
      socialService.getNetworkStats.mockRejectedValueOnce(new Error('Stats Error'))

      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('1234')).toBeInTheDocument()
      })
    })

    it('continues to function after API error', async () => {
      socialService.getFollowers.mockRejectedValueOnce(new Error('API Error'))

      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading users...')).not.toBeInTheDocument()
      })

      const followingTab = screen.getByText('Following').closest('button')
      await userEvent.click(followingTab)

      await waitFor(() => {
        expect(socialService.getFollowing).toHaveBeenCalled()
      })
    })
  })

  describe('User List Display', () => {
    it('displays user avatars', async () => {
      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        const avatars = screen.getAllByText('👑')
        expect(avatars.length).toBeGreaterThan(0)
      })
    })

    it('displays user display names', async () => {
      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto King')).toBeInTheDocument()
      })
    })

    it('displays user usernames', async () => {
      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('@cryptoking')).toBeInTheDocument()
      })
    })

    it('displays user bios', async () => {
      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText(/DeFi enthusiast/i)).toBeInTheDocument()
      })
    })

    it('displays verified badges for verified users', async () => {
      render(<SocialListsModal {...defaultProps} initialTab="following" />)

      await waitFor(() => {
        const verifiedBadges = document.querySelectorAll('.verified-badge')
        expect(verifiedBadges.length).toBeGreaterThan(0)
      })
    })

    it('displays online indicators for online users', async () => {
      render(<SocialListsModal {...defaultProps} initialTab="following" />)

      await waitFor(() => {
        const onlineIndicators = document.querySelectorAll('.online-indicator')
        expect(onlineIndicators.length).toBeGreaterThan(0)
      })
    })

    it('displays user karma', async () => {
      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText(/1823 karma/i)).toBeInTheDocument()
      })
    })

    it('displays mutual connections count', async () => {
      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText(/8 mutual/i)).toBeInTheDocument()
      })
    })

    it('displays user location', async () => {
      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('New York, NY')).toBeInTheDocument()
      })
    })

    it('displays join date', async () => {
      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText(/Joined/i)).toBeInTheDocument()
      })
    })
  })

  describe('Search Functionality', () => {
    it('filters users by username', async () => {
      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto King')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search users...')
      await userEvent.type(searchInput, 'tech')

      await waitFor(() => {
        expect(screen.queryByText('Crypto King')).not.toBeInTheDocument()
      })
    })

    it('filters users by display name', async () => {
      render(<SocialListsModal {...defaultProps} initialTab="following" />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search users...')
      await userEvent.type(searchInput, 'guru')

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })
    })

    it('filters users by bio content', async () => {
      render(<SocialListsModal {...defaultProps} initialTab="following" />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search users...')
      await userEvent.type(searchInput, 'web3')

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })
    })

    it('shows empty state when no search results', async () => {
      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto King')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search users...')
      await userEvent.type(searchInput, 'nonexistentuser')

      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument()
      })
    })

    it('debounces search API calls', async () => {
      jest.useFakeTimers()
      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading users...')).not.toBeInTheDocument()
      })

      const initialCallCount = socialService.getFollowers.mock.calls.length

      const searchInput = screen.getByPlaceholderText('Search users...')
      await userEvent.type(searchInput, 'test')

      jest.advanceTimersByTime(100)
      expect(socialService.getFollowers.mock.calls.length).toBe(initialCallCount)

      jest.advanceTimersByTime(250)
      await waitFor(() => {
        expect(socialService.getFollowers.mock.calls.length).toBeGreaterThan(initialCallCount)
      })

      jest.useRealTimers()
    })
  })

  describe('Filter Functionality', () => {
    it('toggles filter panel when filter button clicked', async () => {
      render(<SocialListsModal {...defaultProps} />)

      expect(screen.queryByText('Sort by:')).not.toBeInTheDocument()

      const filterButton = screen.getByText('Filters').closest('button')
      await userEvent.click(filterButton)

      expect(screen.getByText('Sort by:')).toBeInTheDocument()
      expect(screen.getByText('Filter by:')).toBeInTheDocument()
    })

    it('hides filter panel when toggled off', async () => {
      render(<SocialListsModal {...defaultProps} />)

      const filterButton = screen.getByText('Filters').closest('button')
      await userEvent.click(filterButton)
      expect(screen.getByText('Sort by:')).toBeInTheDocument()

      await userEvent.click(filterButton)
      expect(screen.queryByText('Sort by:')).not.toBeInTheDocument()
    })

    it('displays sort options', async () => {
      render(<SocialListsModal {...defaultProps} />)

      const filterButton = screen.getByText('Filters').closest('button')
      await userEvent.click(filterButton)

      const sortSelect = screen.getByLabelText('Sort by:')
      expect(within(sortSelect).getByText('Most Recent')).toBeInTheDocument()
      expect(within(sortSelect).getByText('Alphabetical')).toBeInTheDocument()
      expect(within(sortSelect).getByText('Highest Karma')).toBeInTheDocument()
      expect(within(sortSelect).getByText('Most Mutual')).toBeInTheDocument()
    })

    it('displays filter options', async () => {
      render(<SocialListsModal {...defaultProps} />)

      const filterButton = screen.getByText('Filters').closest('button')
      await userEvent.click(filterButton)

      const filterSelect = screen.getByLabelText('Filter by:')
      expect(within(filterSelect).getByText('All Users')).toBeInTheDocument()
      expect(within(filterSelect).getByText('Verified Only')).toBeInTheDocument()
      expect(within(filterSelect).getByText('Online Now')).toBeInTheDocument()
      expect(within(filterSelect).getByText('Mutual Connections')).toBeInTheDocument()
      expect(within(filterSelect).getByText('Recent Follows')).toBeInTheDocument()
    })
  })

  describe('Sort Functionality', () => {
    it('sorts users alphabetically', async () => {
      render(<SocialListsModal {...defaultProps} initialTab="mutual" />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      const filterButton = screen.getByText('Filters').closest('button')
      await userEvent.click(filterButton)

      const sortSelect = screen.getByLabelText('Sort by:')
      await userEvent.selectOptions(sortSelect, 'alphabetical')

      await waitFor(() => {
        const userItems = screen.getAllByText(/Tech Guru|Crypto King|NFT Collector/)
        expect(userItems[0]).toHaveTextContent('Crypto King')
      })
    })

    it('sorts users by karma', async () => {
      render(<SocialListsModal {...defaultProps} initialTab="mutual" />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      const filterButton = screen.getByText('Filters').closest('button')
      await userEvent.click(filterButton)

      const sortSelect = screen.getByLabelText('Sort by:')
      await userEvent.selectOptions(sortSelect, 'karma')

      await waitFor(() => {
        const userItems = screen.getAllByText(/Tech Guru|Crypto King|NFT Collector/)
        expect(userItems[0]).toHaveTextContent('NFT Collector')
      })
    })

    it('sorts users by mutual connections', async () => {
      render(<SocialListsModal {...defaultProps} initialTab="mutual" />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      const filterButton = screen.getByText('Filters').closest('button')
      await userEvent.click(filterButton)

      const sortSelect = screen.getByLabelText('Sort by:')
      await userEvent.selectOptions(sortSelect, 'mutual')

      await waitFor(() => {
        const userItems = screen.getAllByText(/15 mutual|8 mutual|12 mutual/)
        expect(userItems[0]).toHaveTextContent('15 mutual')
      })
    })
  })

  describe('Filter by Type', () => {
    it('filters to show only verified users', async () => {
      render(<SocialListsModal {...defaultProps} initialTab="mutual" />)

      await waitFor(() => {
        expect(screen.getByText('Crypto King')).toBeInTheDocument()
      })

      const filterButton = screen.getByText('Filters').closest('button')
      await userEvent.click(filterButton)

      const filterSelect = screen.getByLabelText('Filter by:')
      await userEvent.selectOptions(filterSelect, 'verified')

      await waitFor(() => {
        expect(screen.queryByText('Crypto King')).not.toBeInTheDocument()
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })
    })

    it('filters to show only online users', async () => {
      render(<SocialListsModal {...defaultProps} initialTab="mutual" />)

      await waitFor(() => {
        expect(screen.getByText('Crypto King')).toBeInTheDocument()
      })

      const filterButton = screen.getByText('Filters').closest('button')
      await userEvent.click(filterButton)

      const filterSelect = screen.getByLabelText('Filter by:')
      await userEvent.selectOptions(filterSelect, 'online')

      await waitFor(() => {
        expect(screen.queryByText('Crypto King')).not.toBeInTheDocument()
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })
    })

    it('filters to show only users with mutual connections', async () => {
      socialService.getFollowers.mockResolvedValue({
        users: [
          ...mockUsers,
          {
            id: 'user4',
            username: 'nomutual',
            displayName: 'No Mutual',
            avatar: null,
            bio: 'User with no mutual connections',
            isVerified: false,
            isOnline: false,
            joinedDate: '2023-04-15',
            location: null,
            mutualConnections: 0,
            karma: 100,
            relationship: {
              isFollowing: false,
              isFollower: true,
              isFriend: false,
              followedAt: '2023-08-01'
            }
          }
        ],
        page: 1,
        limit: 20,
        total: 4,
        hasMore: false
      })

      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('No Mutual')).toBeInTheDocument()
      })

      const filterButton = screen.getByText('Filters').closest('button')
      await userEvent.click(filterButton)

      const filterSelect = screen.getByLabelText('Filter by:')
      await userEvent.selectOptions(filterSelect, 'mutual')

      await waitFor(() => {
        expect(screen.queryByText('No Mutual')).not.toBeInTheDocument()
        expect(screen.getByText('Crypto King')).toBeInTheDocument()
      })
    })
  })

  describe('Stats Display', () => {
    it('displays follower count', async () => {
      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('1234')).toBeInTheDocument()
      })
    })

    it('displays following count', async () => {
      render(<SocialListsModal {...defaultProps} initialTab="following" />)

      await waitFor(() => {
        expect(screen.getByText('567')).toBeInTheDocument()
      })
    })

    it('displays friends count', async () => {
      render(<SocialListsModal {...defaultProps} initialTab="friends" />)

      await waitFor(() => {
        expect(screen.getByText('89')).toBeInTheDocument()
      })
    })

    it('displays total connections', async () => {
      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('1801')).toBeInTheDocument()
      })
    })

    it('displays filtered count when searching', async () => {
      render(<SocialListsModal {...defaultProps} initialTab="mutual" />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search users...')
      await userEvent.type(searchInput, 'guru')

      await waitFor(() => {
        expect(screen.getByText('filtered')).toBeInTheDocument()
      })
    })
  })

  describe('Refresh Functionality', () => {
    it('refreshes data when refresh button clicked', async () => {
      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(socialService.getFollowers).toHaveBeenCalledTimes(1)
      })

      const refreshButtons = screen.getAllByRole('button')
      const refreshButton = refreshButtons.find(btn => btn.classList.contains('refresh-btn'))

      await userEvent.click(refreshButton)

      await waitFor(() => {
        expect(socialService.getFollowers).toHaveBeenCalledTimes(2)
        expect(socialService.getNetworkStats).toHaveBeenCalledTimes(2)
      })
    })

    it('disables refresh button while refreshing', async () => {
      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading users...')).not.toBeInTheDocument()
      })

      const refreshButtons = screen.getAllByRole('button')
      const refreshButton = refreshButtons.find(btn => btn.classList.contains('refresh-btn'))

      await userEvent.click(refreshButton)

      expect(refreshButton).toBeDisabled()

      await waitFor(() => {
        expect(refreshButton).not.toBeDisabled()
      })
    })
  })

  describe('Pagination', () => {
    it('shows load more button when hasMore is true', async () => {
      socialService.getFollowers.mockResolvedValue({
        users: mockUsers.filter(u => u.relationship.isFollower),
        page: 1,
        limit: 20,
        total: 50,
        hasMore: true
      })

      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Load More Users')).toBeInTheDocument()
      })
    })

    it('hides load more button when hasMore is false', async () => {
      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.queryByText('Load More Users')).not.toBeInTheDocument()
      })
    })

    it('loads more users when load more button clicked', async () => {
      socialService.getFollowers
        .mockResolvedValueOnce({
          users: [mockUsers[0]],
          page: 1,
          limit: 20,
          total: 50,
          hasMore: true
        })
        .mockResolvedValueOnce({
          users: [mockUsers[1]],
          page: 2,
          limit: 20,
          total: 50,
          hasMore: false
        })

      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      const loadMoreButton = screen.getByText('Load More Users')
      await userEvent.click(loadMoreButton)

      await waitFor(() => {
        expect(screen.getByText('Crypto King')).toBeInTheDocument()
      })
    })

    it('disables load more button while loading', async () => {
      socialService.getFollowers.mockResolvedValue({
        users: mockUsers.filter(u => u.relationship.isFollower),
        page: 1,
        limit: 20,
        total: 50,
        hasMore: true
      })

      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Load More Users')).toBeInTheDocument()
      })

      const loadMoreButton = screen.getByText('Load More Users')
      expect(loadMoreButton).not.toBeDisabled()
    })
  })

  describe('Empty States', () => {
    it('shows empty state when no followers', async () => {
      socialService.getFollowers.mockResolvedValue({
        users: [],
        page: 1,
        limit: 20,
        total: 0,
        hasMore: false
      })

      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('No followers yet')).toBeInTheDocument()
        expect(screen.getByText('Your followers will appear here')).toBeInTheDocument()
      })
    })

    it('shows empty state when no following', async () => {
      socialService.getFollowing.mockResolvedValue({
        users: [],
        page: 1,
        limit: 20,
        total: 0,
        hasMore: false
      })

      render(<SocialListsModal {...defaultProps} initialTab="following" />)

      await waitFor(() => {
        expect(screen.getByText('No following yet')).toBeInTheDocument()
        expect(screen.getByText('Users you follow will appear here')).toBeInTheDocument()
      })
    })

    it('shows empty state when no friends', async () => {
      socialService.getFriends.mockResolvedValue({
        users: [],
        page: 1,
        limit: 20,
        total: 0,
        hasMore: false
      })

      render(<SocialListsModal {...defaultProps} initialTab="friends" />)

      await waitFor(() => {
        expect(screen.getByText('No friends yet')).toBeInTheDocument()
        expect(screen.getByText('Your friends will appear here')).toBeInTheDocument()
      })
    })

    it('shows search empty state when no results', async () => {
      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto King')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search users...')
      await userEvent.type(searchInput, 'nonexistent')

      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument()
        expect(screen.getByText('Try adjusting your search terms or filters')).toBeInTheDocument()
      })
    })
  })

  describe('User Actions', () => {
    it('renders follow button for each user', async () => {
      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('follow-button-user2')).toBeInTheDocument()
      })
    })

    it('renders message button for each user', async () => {
      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        const messageButtons = document.querySelectorAll('[title="Send message"]')
        expect(messageButtons.length).toBeGreaterThan(0)
      })
    })

    it('renders more options button for each user', async () => {
      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        const moreButtons = document.querySelectorAll('[title="More options"]')
        expect(moreButtons.length).toBeGreaterThan(0)
      })
    })

    it('updates user state when follow button clicked', async () => {
      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('follow-button-user2')).toBeInTheDocument()
      })

      const followButton = screen.getByTestId('follow-button-user2')
      expect(followButton).toHaveTextContent('Follow')

      await userEvent.click(followButton)

      await waitFor(() => {
        expect(followButton).toHaveTextContent('Unfollow')
      })
    })
  })

  describe('User Selection', () => {
    it('calls onUserSelect when user is clicked', async () => {
      const onUserSelect = jest.fn()
      render(<SocialListsModal {...defaultProps} onUserSelect={onUserSelect} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto King')).toBeInTheDocument()
      })

      const userMain = screen.getByText('Crypto King').closest('.user-main')
      await userEvent.click(userMain)

      expect(onUserSelect).toHaveBeenCalledWith(expect.objectContaining({
        id: 'user2',
        username: 'cryptoking'
      }))
    })

    it('does not call onUserSelect when not provided', async () => {
      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto King')).toBeInTheDocument()
      })

      const userMain = screen.getByText('Crypto King').closest('.user-main')
      expect(() => userEvent.click(userMain)).not.toThrow()
    })
  })

  describe('Avatar Display', () => {
    it('displays emoji avatars', async () => {
      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        const emojiAvatars = document.querySelectorAll('.avatar-emoji')
        expect(emojiAvatars.length).toBeGreaterThan(0)
      })
    })

    it('displays image avatars when URL provided', async () => {
      const usersWithImages = [{
        ...mockUsers[0],
        avatar: 'https://example.com/avatar.jpg'
      }]

      socialService.getFollowers.mockResolvedValue({
        users: usersWithImages,
        page: 1,
        limit: 20,
        total: 1,
        hasMore: false
      })

      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        const avatarImages = document.querySelectorAll('.user-avatar img')
        expect(avatarImages.length).toBeGreaterThan(0)
      })
    })

    it('displays placeholder for users without avatars', async () => {
      render(<SocialListsModal {...defaultProps} initialTab="following" />)

      await waitFor(() => {
        const placeholders = document.querySelectorAll('.avatar-placeholder')
        expect(placeholders.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Tab Counts', () => {
    it('displays correct count for followers tab', async () => {
      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        const followersTab = screen.getByText('Followers').closest('button')
        const count = within(followersTab).getByText('1234')
        expect(count).toBeInTheDocument()
      })
    })

    it('displays correct count for following tab', async () => {
      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        const followingTab = screen.getByText('Following').closest('button')
        const count = within(followingTab).getByText('567')
        expect(count).toBeInTheDocument()
      })
    })

    it('displays correct count for friends tab', async () => {
      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        const friendsTab = screen.getByText('Friends').closest('button')
        const count = within(friendsTab).getByText('89')
        expect(count).toBeInTheDocument()
      })
    })

    it('displays correct count for mutual tab', async () => {
      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        const mutualTab = screen.getByText('Mutual').closest('button')
        const count = within(mutualTab).getByText('23')
        expect(count).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles null userId', () => {
      render(<SocialListsModal {...defaultProps} userId={null} />)
      expect(screen.getByText('Social Connections')).toBeInTheDocument()
    })

    it('handles missing user bio gracefully', async () => {
      const usersWithoutBio = [{
        ...mockUsers[0],
        bio: null
      }]

      socialService.getFollowers.mockResolvedValue({
        users: usersWithoutBio,
        page: 1,
        limit: 20,
        total: 1,
        hasMore: false
      })

      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })
    })

    it('handles missing user location gracefully', async () => {
      const usersWithoutLocation = [{
        ...mockUsers[0],
        location: null
      }]

      socialService.getFollowers.mockResolvedValue({
        users: usersWithoutLocation,
        page: 1,
        limit: 20,
        total: 1,
        hasMore: false
      })

      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })
    })

    it('handles users with zero karma', async () => {
      const usersWithZeroKarma = [{
        ...mockUsers[0],
        karma: 0
      }]

      socialService.getFollowers.mockResolvedValue({
        users: usersWithZeroKarma,
        page: 1,
        limit: 20,
        total: 1,
        hasMore: false
      })

      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.queryByText('0 karma')).not.toBeInTheDocument()
      })
    })

    it('handles response with data property instead of users', async () => {
      socialService.getFollowers.mockResolvedValue({
        data: mockUsers.filter(u => u.relationship.isFollower),
        page: 1,
        limit: 20,
        total: 1,
        hasMore: false
      })

      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto King')).toBeInTheDocument()
      })
    })

    it('handles empty response gracefully', async () => {
      socialService.getFollowers.mockResolvedValue({})

      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('No followers yet')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('has accessible modal structure', () => {
      render(<SocialListsModal {...defaultProps} />)
      expect(screen.getByText('Social Connections')).toBeInTheDocument()
    })

    it('has accessible tab navigation', async () => {
      render(<SocialListsModal {...defaultProps} />)

      const tabs = screen.getAllByRole('button').filter(btn =>
        btn.textContent.includes('Followers') ||
        btn.textContent.includes('Following') ||
        btn.textContent.includes('Friends') ||
        btn.textContent.includes('Mutual')
      )

      expect(tabs.length).toBe(4)
    })

    it('has accessible search input with placeholder', () => {
      render(<SocialListsModal {...defaultProps} />)
      const searchInput = screen.getByPlaceholderText('Search users...')
      expect(searchInput).toHaveAttribute('type', 'text')
    })

    it('has accessible filter controls with labels', async () => {
      render(<SocialListsModal {...defaultProps} />)

      const filterButton = screen.getByText('Filters').closest('button')
      await userEvent.click(filterButton)

      expect(screen.getByLabelText('Sort by:')).toBeInTheDocument()
      expect(screen.getByLabelText('Filter by:')).toBeInTheDocument()
    })

    it('has accessible button titles for icon buttons', async () => {
      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto King')).toBeInTheDocument()
      })

      const messageButtons = document.querySelectorAll('[title="Send message"]')
      expect(messageButtons.length).toBeGreaterThan(0)

      const moreButtons = document.querySelectorAll('[title="More options"]')
      expect(moreButtons.length).toBeGreaterThan(0)
    })

    it('provides online status indicators with titles', async () => {
      render(<SocialListsModal {...defaultProps} initialTab="following" />)

      await waitFor(() => {
        const onlineIndicators = document.querySelectorAll('[title="Online now"]')
        expect(onlineIndicators.length).toBeGreaterThan(0)
      })
    })

    it('provides verified status indicators with titles', async () => {
      render(<SocialListsModal {...defaultProps} initialTab="following" />)

      await waitFor(() => {
        const verifiedBadges = document.querySelectorAll('[title="Verified user"]')
        expect(verifiedBadges.length).toBeGreaterThan(0)
      })
    })

    it('has keyboard accessible close button', async () => {
      const onClose = jest.fn()
      render(<SocialListsModal {...defaultProps} onClose={onClose} />)

      const closeButtons = screen.getAllByRole('button')
      const closeButton = closeButtons.find(btn => btn.classList.contains('close-btn'))

      closeButton.focus()
      expect(document.activeElement).toBe(closeButton)
    })
  })

  describe('Date Formatting', () => {
    it('formats join dates correctly', async () => {
      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        const joinedText = screen.getAllByText(/Joined/i)
        expect(joinedText.length).toBeGreaterThan(0)
      })
    })

    it('handles invalid date strings gracefully', async () => {
      const usersWithInvalidDate = [{
        ...mockUsers[0],
        joinedDate: 'invalid-date'
      }]

      socialService.getFollowers.mockResolvedValue({
        users: usersWithInvalidDate,
        page: 1,
        limit: 20,
        total: 1,
        hasMore: false
      })

      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })
    })
  })

  describe('Component Cleanup', () => {
    it('cleans up timeout on unmount', async () => {
      const { unmount } = render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading users...')).not.toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search users...')
      await userEvent.type(searchInput, 'test')

      unmount()

      // Component should unmount without errors
      expect(true).toBe(true)
    })

    it('handles rapid tab switching without errors', async () => {
      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading users...')).not.toBeInTheDocument()
      })

      const followingTab = screen.getByText('Following').closest('button')
      const friendsTab = screen.getByText('Friends').closest('button')
      const mutualTab = screen.getByText('Mutual').closest('button')
      const followersTab = screen.getByText('Followers').closest('button')

      await userEvent.click(followingTab)
      await userEvent.click(friendsTab)
      await userEvent.click(mutualTab)
      await userEvent.click(followersTab)

      // Should handle rapid switching without errors
      expect(screen.getByText('Social Connections')).toBeInTheDocument()
    })
  })

  describe('Combined Filters and Search', () => {
    it('applies both search and filters together', async () => {
      render(<SocialListsModal {...defaultProps} initialTab="mutual" />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
        expect(screen.getByText('Crypto King')).toBeInTheDocument()
      })

      const filterButton = screen.getByText('Filters').closest('button')
      await userEvent.click(filterButton)

      const filterSelect = screen.getByLabelText('Filter by:')
      await userEvent.selectOptions(filterSelect, 'verified')

      await waitFor(() => {
        expect(screen.queryByText('Crypto King')).not.toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search users...')
      await userEvent.type(searchInput, 'tech')

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })
    })

    it('applies both sort and filter together', async () => {
      render(<SocialListsModal {...defaultProps} initialTab="mutual" />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      const filterButton = screen.getByText('Filters').closest('button')
      await userEvent.click(filterButton)

      const sortSelect = screen.getByLabelText('Sort by:')
      await userEvent.selectOptions(sortSelect, 'alphabetical')

      const filterSelect = screen.getByLabelText('Filter by:')
      await userEvent.selectOptions(filterSelect, 'verified')

      await waitFor(() => {
        expect(screen.queryByText('Crypto King')).not.toBeInTheDocument()
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })
    })
  })

  describe('User Relationship States', () => {
    it('displays correct state for users you follow', async () => {
      render(<SocialListsModal {...defaultProps} initialTab="following" />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      const followButton = screen.getByTestId('follow-button-user1')
      expect(followButton).toHaveTextContent('Unfollow')
    })

    it('displays correct state for users who follow you', async () => {
      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto King')).toBeInTheDocument()
      })

      const followButton = screen.getByTestId('follow-button-user2')
      expect(followButton).toHaveTextContent('Follow')
    })

    it('displays correct state for mutual friends', async () => {
      render(<SocialListsModal {...defaultProps} initialTab="friends" />)

      await waitFor(() => {
        expect(screen.getByText('NFT Collector')).toBeInTheDocument()
      })

      const followButton = screen.getByTestId('follow-button-user3')
      expect(followButton).toHaveTextContent('Unfollow')
    })
  })

  describe('Recent Follows Filter', () => {
    it('filters to show only recent follows', async () => {
      const oldFollowDate = new Date('2023-01-01').toISOString()
      const recentFollowDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()

      const usersWithMixedDates = [
        {
          ...mockUsers[0],
          relationship: { ...mockUsers[0].relationship, followedAt: oldFollowDate }
        },
        {
          ...mockUsers[1],
          relationship: { ...mockUsers[1].relationship, followedAt: recentFollowDate }
        }
      ]

      socialService.getFollowers.mockResolvedValue({
        users: usersWithMixedDates,
        page: 1,
        limit: 20,
        total: 2,
        hasMore: false
      })

      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
        expect(screen.getByText('Crypto King')).toBeInTheDocument()
      })

      const filterButton = screen.getByText('Filters').closest('button')
      await userEvent.click(filterButton)

      const filterSelect = screen.getByLabelText('Filter by:')
      await userEvent.selectOptions(filterSelect, 'recent')

      await waitFor(() => {
        expect(screen.queryByText('Tech Guru')).not.toBeInTheDocument()
        expect(screen.getByText('Crypto King')).toBeInTheDocument()
      })
    })
  })

  describe('Multiple User Actions Persistence', () => {
    it('maintains user state changes across filters', async () => {
      render(<SocialListsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto King')).toBeInTheDocument()
      })

      const followButton = screen.getByTestId('follow-button-user2')
      await userEvent.click(followButton)

      await waitFor(() => {
        expect(followButton).toHaveTextContent('Unfollow')
      })

      const filterButton = screen.getByText('Filters').closest('button')
      await userEvent.click(filterButton)

      const filterSelect = screen.getByLabelText('Filter by:')
      await userEvent.selectOptions(filterSelect, 'all')

      await waitFor(() => {
        const updatedFollowButton = screen.getByTestId('follow-button-user2')
        expect(updatedFollowButton).toHaveTextContent('Unfollow')
      })
    })
  })
})

export default mockUsers
