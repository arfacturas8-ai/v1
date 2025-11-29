import React from 'react'
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import FollowerSystem from './FollowerSystem'

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Users: ({ className, ...props }) => <div data-testid="users-icon" className={className} {...props} />,
  UserPlus: ({ className, ...props }) => <div data-testid="userplus-icon" className={className} {...props} />,
  UserMinus: ({ className, ...props }) => <div data-testid="userminus-icon" className={className} {...props} />,
  UserCheck: ({ className, ...props }) => <div data-testid="usercheck-icon" className={className} {...props} />,
  Search: ({ className, ...props }) => <div data-testid="search-icon" className={className} {...props} />,
  Filter: ({ className, ...props }) => <div data-testid="filter-icon" className={className} {...props} />,
  Star: ({ className, ...props }) => <div data-testid="star-icon" className={className} {...props} />,
  Crown: ({ className, ...props }) => <div data-testid="crown-icon" className={className} {...props} />,
  Shield: ({ className, ...props }) => <div data-testid="shield-icon" className={className} {...props} />,
  Heart: ({ className, ...props }) => <div data-testid="heart-icon" className={className} {...props} />,
  MessageCircle: ({ className, ...props }) => <div data-testid="messagecircle-icon" className={className} {...props} />,
  Eye: ({ className, ...props }) => <div data-testid="eye-icon" className={className} {...props} />,
  EyeOff: ({ className, ...props }) => <div data-testid="eyeoff-icon" className={className} {...props} />,
  Settings: ({ className, ...props }) => <div data-testid="settings-icon" className={className} {...props} />,
  MoreHorizontal: ({ className, ...props }) => <div data-testid="morehorizontal-icon" className={className} {...props} />,
  Check: ({ className, ...props }) => <div data-testid="check-icon" className={className} {...props} />,
  X: ({ className, ...props }) => <div data-testid="x-icon" className={className} {...props} />,
  Bell: ({ className, ...props }) => <div data-testid="bell-icon" className={className} {...props} />,
  BellOff: ({ className, ...props }) => <div data-testid="belloff-icon" className={className} {...props} />,
  Activity: ({ className, ...props }) => <div data-testid="activity-icon" className={className} {...props} />,
  Calendar: ({ className, ...props }) => <div data-testid="calendar-icon" className={className} {...props} />,
  Map: ({ className, ...props }) => <div data-testid="map-icon" className={className} {...props} />,
  Link: ({ className, ...props }) => <div data-testid="link-icon" className={className} {...props} />,
  Github: ({ className, ...props }) => <div data-testid="github-icon" className={className} {...props} />,
  Twitter: ({ className, ...props }) => <div data-testid="twitter-icon" className={className} {...props} />
}))

const mockUsers = [
  {
    id: '1',
    username: 'cryptowhale',
    displayName: 'Crypto Whale',
    avatar: 'https://example.com/avatar1.jpg',
    bio: 'DeFi enthusiast and early blockchain adopter',
    isVerified: true,
    isPremium: true,
    karma: 25430,
    followers: 15642,
    following: 892,
    lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    followedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    mutualFollowers: 23,
    location: 'New York, NY',
    socialLinks: {
      github: 'https://github.com/cryptowhale',
      twitter: 'https://twitter.com/cryptowhale'
    }
  },
  {
    id: '2',
    username: 'nftcollector',
    displayName: 'NFT Collector',
    avatar: null,
    bio: 'Collecting digital art and building Web3 communities',
    isVerified: false,
    isPremium: true,
    karma: 8950,
    followers: 3421,
    following: 567,
    lastActive: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    followedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    mutualFollowers: 8
  },
  {
    id: '3',
    username: 'defidev',
    displayName: 'DeFi Developer',
    avatar: null,
    bio: 'Building the future of decentralized finance',
    isVerified: true,
    isPremium: false,
    karma: 12340,
    followers: 5678,
    following: 234,
    lastActive: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    followedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    mutualFollowers: 15
  },
  {
    id: '4',
    username: 'activeuser',
    displayName: 'Active User',
    avatar: null,
    bio: 'Always online',
    isVerified: false,
    isPremium: false,
    karma: 1200,
    followers: 100,
    following: 50,
    lastActive: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    followedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    mutualFollowers: 0
  }
]

const mockFollowRequests = [
  {
    id: 'req1',
    user: {
      id: '5',
      username: 'newuser',
      displayName: 'New User',
      avatar: null,
      karma: 45,
      followers: 12,
      following: 5,
      lastActive: new Date().toISOString(),
      requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  },
  {
    id: 'req2',
    user: {
      id: '6',
      username: 'anotheruser',
      displayName: 'Another User',
      avatar: null,
      karma: 120,
      followers: 50,
      following: 30,
      lastActive: new Date().toISOString(),
      requestedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  }
]

const mockRelationships = {
  '1': { isFollowing: false, isFollower: true },
  '2': { isFollowing: true, isFollower: true },
  '3': { isFollowing: false, isFollower: true },
  '4': { isFollowing: true, isFollower: false }
}

describe('FollowerSystem', () => {
  let fetchMock

  beforeEach(() => {
    fetchMock = vi.spyOn(global, 'fetch').mockImplementation((url) => {
      if (url.includes('/followers')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ users: mockUsers })
        })
      }
      if (url.includes('/following')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ users: mockUsers.slice(0, 2) })
        })
      }
      if (url.includes('/relationship')) {
        const userId = url.split('/')[3]
        return Promise.resolve({
          ok: true,
          json: async () => mockRelationships[userId] || {}
        })
      }
      if (url.includes('/follow-requests')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ requests: mockFollowRequests })
        })
      }
      if (url.includes('/follow')) {
        return Promise.resolve({ ok: true })
      }
      if (url.includes('/unfollow')) {
        return Promise.resolve({ ok: true })
      }
      return Promise.reject(new Error('Not found'))
    })
  })

  afterEach(() => {
    fetchMock.mockRestore()
  })

  describe('Component Rendering', () => {
    it('should render the component with followers type', async () => {
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Followers')).toBeInTheDocument()
      })
    })

    it('should render the component with following type', async () => {
      render(<FollowerSystem userId="user123" type="following" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Following')).toBeInTheDocument()
      })
    })

    it('should display the modal overlay', () => {
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      const overlay = document.querySelector('.fixed.inset-0')
      expect(overlay).toBeInTheDocument()
    })

    it('should render close button', () => {
      const onClose = vi.fn()
      render(<FollowerSystem userId="user123" type="followers" onClose={onClose} />)

      const closeButtons = screen.getAllByTestId('x-icon')
      expect(closeButtons.length).toBeGreaterThan(0)
    })

    it('should call onClose when close button is clicked', async () => {
      const onClose = vi.fn()
      render(<FollowerSystem userId="user123" type="followers" onClose={onClose} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })

      const closeButton = screen.getAllByTestId('x-icon')[0].parentElement
      fireEvent.click(closeButton)

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should render the Users icon in header', () => {
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      const usersIcons = screen.getAllByTestId('users-icon')
      expect(usersIcons.length).toBeGreaterThan(0)
    })
  })

  describe('Data Fetching', () => {
    it('should fetch followers when type is followers', async () => {
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/users/user123/followers')
      })
    })

    it('should fetch following when type is following', async () => {
      render(<FollowerSystem userId="user123" type="following" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/users/user123/following')
      })
    })

    it('should fetch follow requests for followers type', async () => {
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/users/user123/follow-requests')
      })
    })

    it('should not fetch follow requests for following type', async () => {
      render(<FollowerSystem userId="user123" type="following" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('NFT Collector')).toBeInTheDocument()
      })

      expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('/follow-requests'))
    })

    it('should fetch relationships for each user', async () => {
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/users/1/relationship')
        expect(fetchMock).toHaveBeenCalledWith('/api/users/2/relationship')
      })
    })

    it('should handle fetch error gracefully with mock data', async () => {
      fetchMock.mockImplementation(() => Promise.reject(new Error('Network error')))

      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })
    })

    it('should refetch data when userId changes', async () => {
      const { rerender } = render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/users/user123/followers')
      })

      fetchMock.mockClear()

      rerender(<FollowerSystem userId="user456" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/users/user456/followers')
      })
    })

    it('should refetch data when type changes', async () => {
      const { rerender } = render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/users/user123/followers')
      })

      fetchMock.mockClear()

      rerender(<FollowerSystem userId="user123" type="following" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/users/user123/following')
      })
    })
  })

  describe('Loading States', () => {
    it('should display loading spinner initially', () => {
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('should hide loading spinner after data loads', async () => {
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        const spinner = document.querySelector('.animate-spin')
        expect(spinner).not.toBeInTheDocument()
      })
    })

    it('should display users after loading completes', async () => {
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
        expect(screen.getByText('NFT Collector')).toBeInTheDocument()
      })
    })
  })

  describe('Empty States', () => {
    it('should display empty state when no users found', async () => {
      fetchMock.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ users: [] })
        })
      )

      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('No followers found')).toBeInTheDocument()
      })
    })

    it('should display Users icon in empty state', async () => {
      fetchMock.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ users: [] })
        })
      )

      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('No followers found')).toBeInTheDocument()
      })

      const usersIcons = screen.getAllByTestId('users-icon')
      expect(usersIcons.length).toBeGreaterThan(0)
    })

    it('should display helper text when search returns no results', async () => {
      const user = userEvent.setup()
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search followers...')
      await user.type(searchInput, 'nonexistentuser')

      await waitFor(() => {
        expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument()
      })
    })
  })

  describe('User List Display', () => {
    it('should display all users from API', async () => {
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
        expect(screen.getByText('NFT Collector')).toBeInTheDocument()
        expect(screen.getByText('DeFi Developer')).toBeInTheDocument()
      })
    })

    it('should display usernames with @ prefix', async () => {
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('@cryptowhale')).toBeInTheDocument()
        expect(screen.getByText('@nftcollector')).toBeInTheDocument()
      })
    })

    it('should display user bios', async () => {
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('DeFi enthusiast and early blockchain adopter')).toBeInTheDocument()
      })
    })

    it('should display karma counts', async () => {
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('25,430 karma')).toBeInTheDocument()
        expect(screen.getByText('8,950 karma')).toBeInTheDocument()
      })
    })

    it('should display follower counts', async () => {
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('15,642 followers')).toBeInTheDocument()
        expect(screen.getByText('3,421 followers')).toBeInTheDocument()
      })
    })

    it('should display user count in header', async () => {
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText(/4 followers/)).toBeInTheDocument()
      })
    })
  })

  describe('User Avatars', () => {
    it('should display user avatar when available', async () => {
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        const avatar = screen.getByAlt('Crypto Whale')
        expect(avatar).toBeInTheDocument()
        expect(avatar).toHaveAttribute('src', 'https://example.com/avatar1.jpg')
      })
    })

    it('should display placeholder icon when avatar is null', async () => {
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('NFT Collector')).toBeInTheDocument()
      })

      const usersIcons = screen.getAllByTestId('users-icon')
      expect(usersIcons.length).toBeGreaterThan(1)
    })

    it('should display online indicator for active users', async () => {
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('DeFi Developer')).toBeInTheDocument()
      })

      const onlineIndicators = document.querySelectorAll('.bg-green-500')
      expect(onlineIndicators.length).toBeGreaterThan(0)
    })

    it('should display crown icon for premium users', async () => {
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })

      const crownIcons = screen.getAllByTestId('crown-icon')
      expect(crownIcons.length).toBeGreaterThan(0)
    })

    it('should display shield icon for verified users', async () => {
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })

      const shieldIcons = screen.getAllByTestId('shield-icon')
      expect(shieldIcons.length).toBeGreaterThan(0)
    })
  })

  describe('Mutual Followers', () => {
    it('should display mutual follower count', async () => {
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('23 mutual')).toBeInTheDocument()
        expect(screen.getByText('8 mutual')).toBeInTheDocument()
      })
    })

    it('should not display mutual count when zero', async () => {
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Active User')).toBeInTheDocument()
      })

      expect(screen.queryByText('0 mutual')).not.toBeInTheDocument()
    })

    it('should filter by mutual connections', async () => {
      const user = userEvent.setup()
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Active User')).toBeInTheDocument()
      })

      const filterSelect = screen.getByDisplayValue('All followers')
      await user.selectOptions(filterSelect, 'mutual')

      await waitFor(() => {
        expect(screen.queryByText('Active User')).not.toBeInTheDocument()
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })
    })
  })

  describe('Search Functionality', () => {
    it('should render search input', () => {
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      expect(screen.getByPlaceholderText('Search followers...')).toBeInTheDocument()
    })

    it('should filter users by username', async () => {
      const user = userEvent.setup()
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search followers...')
      await user.type(searchInput, 'crypto')

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
        expect(screen.queryByText('NFT Collector')).not.toBeInTheDocument()
      })
    })

    it('should filter users by display name', async () => {
      const user = userEvent.setup()
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('NFT Collector')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search followers...')
      await user.type(searchInput, 'Collector')

      await waitFor(() => {
        expect(screen.getByText('NFT Collector')).toBeInTheDocument()
        expect(screen.queryByText('Crypto Whale')).not.toBeInTheDocument()
      })
    })

    it('should be case insensitive', async () => {
      const user = userEvent.setup()
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search followers...')
      await user.type(searchInput, 'CRYPTO')

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })
    })

    it('should update filtered count when searching', async () => {
      const user = userEvent.setup()
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText(/4 followers/)).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search followers...')
      await user.type(searchInput, 'crypto')

      await waitFor(() => {
        expect(screen.getByText(/1 followers/)).toBeInTheDocument()
      })
    })

    it('should clear search results when input is cleared', async () => {
      const user = userEvent.setup()
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search followers...')
      await user.type(searchInput, 'crypto')

      await waitFor(() => {
        expect(screen.queryByText('NFT Collector')).not.toBeInTheDocument()
      })

      await user.clear(searchInput)

      await waitFor(() => {
        expect(screen.getByText('NFT Collector')).toBeInTheDocument()
      })
    })
  })

  describe('Filter Functionality', () => {
    it('should render filter dropdown', () => {
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      expect(screen.getByDisplayValue('All followers')).toBeInTheDocument()
    })

    it('should filter by verified users', async () => {
      const user = userEvent.setup()
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('NFT Collector')).toBeInTheDocument()
      })

      const filterSelect = screen.getByDisplayValue('All followers')
      await user.selectOptions(filterSelect, 'verified')

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
        expect(screen.queryByText('NFT Collector')).not.toBeInTheDocument()
      })
    })

    it('should filter by premium users', async () => {
      const user = userEvent.setup()
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('DeFi Developer')).toBeInTheDocument()
      })

      const filterSelect = screen.getByDisplayValue('All followers')
      await user.selectOptions(filterSelect, 'premium')

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
        expect(screen.queryByText('DeFi Developer')).not.toBeInTheDocument()
      })
    })

    it('should filter by recently active users', async () => {
      const user = userEvent.setup()
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })

      const filterSelect = screen.getByDisplayValue('All followers')
      await user.selectOptions(filterSelect, 'active')

      await waitFor(() => {
        expect(screen.getByText('DeFi Developer')).toBeInTheDocument()
        expect(screen.getByText('Active User')).toBeInTheDocument()
      })
    })

    it('should combine search and filter', async () => {
      const user = userEvent.setup()
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search followers...')
      await user.type(searchInput, 'crypto')

      const filterSelect = screen.getByDisplayValue('All followers')
      await user.selectOptions(filterSelect, 'verified')

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
        expect(screen.queryByText('NFT Collector')).not.toBeInTheDocument()
      })
    })
  })

  describe('Sort Functionality', () => {
    it('should render sort dropdown', () => {
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      expect(screen.getByDisplayValue('Most recent')).toBeInTheDocument()
    })

    it('should sort by most recent by default', async () => {
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Active User')).toBeInTheDocument()
      })

      const userCards = screen.getAllByText(/karma/)
      const firstCard = userCards[0].closest('.flex')
      expect(within(firstCard).getByText('Active User')).toBeInTheDocument()
    })

    it('should sort by karma', async () => {
      const user = userEvent.setup()
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })

      const sortSelect = screen.getByDisplayValue('Most recent')
      await user.selectOptions(sortSelect, 'karma')

      await waitFor(() => {
        const userCards = screen.getAllByText(/karma/)
        const firstCard = userCards[0].closest('.flex')
        expect(within(firstCard).getByText('Crypto Whale')).toBeInTheDocument()
      })
    })

    it('should sort alphabetically', async () => {
      const user = userEvent.setup()
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })

      const sortSelect = screen.getByDisplayValue('Most recent')
      await user.selectOptions(sortSelect, 'alphabetical')

      await waitFor(() => {
        const userCards = screen.getAllByText(/karma/)
        const firstCard = userCards[0].closest('.flex')
        expect(within(firstCard).getByText('Active User')).toBeInTheDocument()
      })
    })
  })

  describe('Follow/Unfollow Actions', () => {
    it('should display Follow button for non-followed users', async () => {
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })

      const followButtons = screen.getAllByText('Follow')
      expect(followButtons.length).toBeGreaterThan(0)
    })

    it('should display Following button for followed users', async () => {
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('NFT Collector')).toBeInTheDocument()
      })

      const followingButtons = screen.getAllByText('Following')
      expect(followingButtons.length).toBeGreaterThan(0)
    })

    it('should call follow API when Follow button is clicked', async () => {
      const user = userEvent.setup()
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })

      const whaleCard = screen.getByText('Crypto Whale').closest('.flex')
      const followButton = within(whaleCard).getByText('Follow')

      await user.click(followButton)

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/users/1/follow', { method: 'POST' })
      })
    })

    it('should update button state after following', async () => {
      const user = userEvent.setup()
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })

      const whaleCard = screen.getByText('Crypto Whale').closest('.flex')
      const followButton = within(whaleCard).getByText('Follow')

      await user.click(followButton)

      await waitFor(() => {
        expect(within(whaleCard).getByText('Following')).toBeInTheDocument()
      })
    })

    it('should call unfollow API when Following button is clicked', async () => {
      const user = userEvent.setup()
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('NFT Collector')).toBeInTheDocument()
      })

      const collectorCard = screen.getByText('NFT Collector').closest('.flex')
      const followingButton = within(collectorCard).getByText('Following')

      await user.click(followingButton)

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/users/2/unfollow', { method: 'POST' })
      })
    })

    it('should update button state after unfollowing', async () => {
      const user = userEvent.setup()
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('NFT Collector')).toBeInTheDocument()
      })

      const collectorCard = screen.getByText('NFT Collector').closest('.flex')
      const followingButton = within(collectorCard).getByText('Following')

      await user.click(followingButton)

      await waitFor(() => {
        expect(within(collectorCard).getByText('Follow')).toBeInTheDocument()
      })
    })

    it('should remove user from list when unfollowing in following view', async () => {
      const user = userEvent.setup()
      render(<FollowerSystem userId="user123" type="following" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('NFT Collector')).toBeInTheDocument()
      })

      const collectorCard = screen.getByText('NFT Collector').closest('.flex')
      const followingButton = within(collectorCard).getByText('Following')

      await user.click(followingButton)

      await waitFor(() => {
        expect(screen.queryByText('NFT Collector')).not.toBeInTheDocument()
      })
    })

    it('should handle follow API errors gracefully', async () => {
      const user = userEvent.setup()
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      fetchMock.mockImplementation((url) => {
        if (url.includes('/follow') && !url.includes('relationship')) {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ users: mockUsers })
        })
      })

      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })

      const whaleCard = screen.getByText('Crypto Whale').closest('.flex')
      const followButton = within(whaleCard).getByText('Follow')

      await user.click(followButton)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled()
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe('User Card Actions', () => {
    it('should display View Profile button', async () => {
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })

      const viewProfileButtons = screen.getAllByText('View Profile')
      expect(viewProfileButtons.length).toBeGreaterThan(0)
    })

    it('should navigate to profile when View Profile is clicked', async () => {
      const user = userEvent.setup()
      delete window.location
      window.location = { href: '' }

      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })

      const whaleCard = screen.getByText('Crypto Whale').closest('.flex')
      const viewProfileButton = within(whaleCard).getByText('View Profile')

      await user.click(viewProfileButton)

      expect(window.location.href).toBe('/u/cryptowhale')
    })

    it('should display more options button', async () => {
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })

      const moreIcons = screen.getAllByTestId('morehorizontal-icon')
      expect(moreIcons.length).toBeGreaterThan(0)
    })
  })

  describe('Last Active Display', () => {
    it('should show "Active now" for very recent activity', async () => {
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Active User')).toBeInTheDocument()
      })

      expect(screen.getByText('Active now')).toBeInTheDocument()
    })

    it('should show minutes for recent activity', async () => {
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('DeFi Developer')).toBeInTheDocument()
      })

      expect(screen.getByText(/Active \d+m ago/)).toBeInTheDocument()
    })

    it('should show hours for activity within a day', async () => {
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('NFT Collector')).toBeInTheDocument()
      })

      expect(screen.getByText(/Active \d+h ago/)).toBeInTheDocument()
    })
  })

  describe('Social Links', () => {
    it('should display GitHub link when available', async () => {
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })

      const githubLinks = screen.getAllByTestId('github-icon')
      expect(githubLinks.length).toBeGreaterThan(0)
    })

    it('should display Twitter link when available', async () => {
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })

      const twitterLinks = screen.getAllByTestId('twitter-icon')
      expect(twitterLinks.length).toBeGreaterThan(0)
    })

    it('should link to correct GitHub profile', async () => {
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })

      const githubIcon = screen.getAllByTestId('github-icon')[0]
      const githubLink = githubIcon.parentElement
      expect(githubLink).toHaveAttribute('href', 'https://github.com/cryptowhale')
      expect(githubLink).toHaveAttribute('target', '_blank')
    })

    it('should link to correct Twitter profile', async () => {
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })

      const twitterIcon = screen.getAllByTestId('twitter-icon')[0]
      const twitterLink = twitterIcon.parentElement
      expect(twitterLink).toHaveAttribute('href', 'https://twitter.com/cryptowhale')
      expect(twitterLink).toHaveAttribute('target', '_blank')
    })
  })

  describe('Follow Requests', () => {
    it('should display follow requests count in header', async () => {
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText(/2 pending requests/)).toBeInTheDocument()
      })
    })

    it('should display Show Requests button when requests exist', async () => {
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Show Requests (2)')).toBeInTheDocument()
      })
    })

    it('should show requests when Show Requests is clicked', async () => {
      const user = userEvent.setup()
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Show Requests (2)')).toBeInTheDocument()
      })

      const showRequestsButton = screen.getByText('Show Requests (2)')
      await user.click(showRequestsButton)

      await waitFor(() => {
        expect(screen.getByText('New User')).toBeInTheDocument()
        expect(screen.getByText('Another User')).toBeInTheDocument()
      })
    })

    it('should toggle button text when showing/hiding requests', async () => {
      const user = userEvent.setup()
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Show Requests (2)')).toBeInTheDocument()
      })

      const showRequestsButton = screen.getByText('Show Requests (2)')
      await user.click(showRequestsButton)

      await waitFor(() => {
        expect(screen.getByText('Hide Requests (2)')).toBeInTheDocument()
      })
    })

    it('should display Follow Requests section header', async () => {
      const user = userEvent.setup()
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Show Requests (2)')).toBeInTheDocument()
      })

      const showRequestsButton = screen.getByText('Show Requests (2)')
      await user.click(showRequestsButton)

      await waitFor(() => {
        expect(screen.getByText('Follow Requests')).toBeInTheDocument()
      })
    })

    it('should display Accept button for requests', async () => {
      const user = userEvent.setup()
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Show Requests (2)')).toBeInTheDocument()
      })

      const showRequestsButton = screen.getByText('Show Requests (2)')
      await user.click(showRequestsButton)

      await waitFor(() => {
        const checkIcons = screen.getAllByTestId('check-icon')
        expect(checkIcons.length).toBeGreaterThan(0)
      })
    })

    it('should display Reject button for requests', async () => {
      const user = userEvent.setup()
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Show Requests (2)')).toBeInTheDocument()
      })

      const showRequestsButton = screen.getByText('Show Requests (2)')
      await user.click(showRequestsButton)

      await waitFor(() => {
        const newUserCard = screen.getByText('New User').closest('.flex')
        const xIcons = within(newUserCard).getAllByTestId('x-icon')
        expect(xIcons.length).toBeGreaterThan(0)
      })
    })

    it('should accept follow request', async () => {
      const user = userEvent.setup()
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Show Requests (2)')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Show Requests (2)'))

      await waitFor(() => {
        expect(screen.getByText('New User')).toBeInTheDocument()
      })

      const newUserCard = screen.getByText('New User').closest('.flex')
      const acceptButton = within(newUserCard).getAllByTestId('check-icon')[0].parentElement

      await user.click(acceptButton)

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/follow-requests/req1/accept', { method: 'POST' })
      })
    })

    it('should reject follow request', async () => {
      const user = userEvent.setup()
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Show Requests (2)')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Show Requests (2)'))

      await waitFor(() => {
        expect(screen.getByText('New User')).toBeInTheDocument()
      })

      const newUserCard = screen.getByText('New User').closest('.flex')
      const rejectButton = within(newUserCard).getAllByTestId('x-icon').find(icon =>
        icon.parentElement.className.includes('bg-red')
      ).parentElement

      await user.click(rejectButton)

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/follow-requests/req1/reject', { method: 'POST' })
      })
    })

    it('should remove request from list after accepting', async () => {
      const user = userEvent.setup()
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Show Requests (2)')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Show Requests (2)'))

      await waitFor(() => {
        expect(screen.getByText('New User')).toBeInTheDocument()
      })

      const newUserCard = screen.getByText('New User').closest('.flex')
      const acceptButton = within(newUserCard).getAllByTestId('check-icon')[0].parentElement

      await user.click(acceptButton)

      await waitFor(() => {
        expect(screen.queryByText('New User')).not.toBeInTheDocument()
      })
    })

    it('should add user to followers list after accepting request', async () => {
      const user = userEvent.setup()
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Show Requests (2)')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Show Requests (2)'))

      await waitFor(() => {
        expect(screen.getByText('New User')).toBeInTheDocument()
      })

      const newUserCard = screen.getByText('New User').closest('.flex')
      const acceptButton = within(newUserCard).getAllByTestId('check-icon')[0].parentElement

      await user.click(acceptButton)

      // Hide requests to see the followers list
      await user.click(screen.getByText(/Hide Requests/))

      await waitFor(() => {
        const allNewUsers = screen.getAllByText('New User')
        expect(allNewUsers.length).toBeGreaterThan(0)
      })
    })

    it('should not show follow requests for following type', async () => {
      render(<FollowerSystem userId="user123" type="following" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('NFT Collector')).toBeInTheDocument()
      })

      expect(screen.queryByText(/pending requests/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Show Requests/)).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle relationship fetch errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      fetchMock.mockImplementation((url) => {
        if (url.includes('/relationship')) {
          return Promise.reject(new Error('Network error'))
        }
        if (url.includes('/followers')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ users: mockUsers })
          })
        }
        return Promise.resolve({ ok: true, json: async () => ({}) })
      })

      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })

      expect(consoleErrorSpy).toHaveBeenCalled()
      consoleErrorSpy.mockRestore()
    })

    it('should handle follow request fetch errors with mock data', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      fetchMock.mockImplementation((url) => {
        if (url.includes('/follow-requests')) {
          return Promise.reject(new Error('Network error'))
        }
        if (url.includes('/followers')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ users: mockUsers })
          })
        }
        return Promise.resolve({ ok: true, json: async () => ({}) })
      })

      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled()
      })

      consoleErrorSpy.mockRestore()
    })

    it('should handle accept request API errors', async () => {
      const user = userEvent.setup()
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      fetchMock.mockImplementation((url) => {
        if (url.includes('/accept')) {
          return Promise.reject(new Error('Network error'))
        }
        if (url.includes('/follow-requests')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ requests: mockFollowRequests })
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ users: mockUsers })
        })
      })

      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Show Requests (2)')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Show Requests (2)'))

      await waitFor(() => {
        expect(screen.getByText('New User')).toBeInTheDocument()
      })

      const newUserCard = screen.getByText('New User').closest('.flex')
      const acceptButton = within(newUserCard).getAllByTestId('check-icon')[0].parentElement

      await user.click(acceptButton)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled()
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Placeholder Text', () => {
    it('should update search placeholder for following type', () => {
      render(<FollowerSystem userId="user123" type="following" onClose={vi.fn()} />)

      expect(screen.getByPlaceholderText('Search following...')).toBeInTheDocument()
    })

    it('should update filter options text for following type', async () => {
      render(<FollowerSystem userId="user123" type="following" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('All following')).toBeInTheDocument()
      })
    })
  })

  describe('Integration Tests', () => {
    it('should work with complete user flow: search, filter, sort, and follow', async () => {
      const user = userEvent.setup()
      render(<FollowerSystem userId="user123" type="followers" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })

      // Search
      const searchInput = screen.getByPlaceholderText('Search followers...')
      await user.type(searchInput, 'crypto')

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
        expect(screen.queryByText('NFT Collector')).not.toBeInTheDocument()
      })

      // Clear search
      await user.clear(searchInput)

      // Filter
      const filterSelect = screen.getByDisplayValue('All followers')
      await user.selectOptions(filterSelect, 'verified')

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
        expect(screen.queryByText('NFT Collector')).not.toBeInTheDocument()
      })

      // Sort
      const sortSelect = screen.getByDisplayValue('Most recent')
      await user.selectOptions(sortSelect, 'karma')

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })

      // Follow
      const followButton = screen.getByText('Follow')
      await user.click(followButton)

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/users/1/follow', { method: 'POST' })
      })
    })
  })
})

export default mockUsers
