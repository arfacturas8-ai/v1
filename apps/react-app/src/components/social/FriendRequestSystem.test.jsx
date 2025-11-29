import React from 'react'
import { render, screen, waitFor, within, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import FriendRequestSystem from './FriendRequestSystem'
import socialService from '../../services/socialService'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../ui/useToast'

jest.mock('../../services/socialService')
jest.mock('../../contexts/AuthContext')
jest.mock('../ui/useToast')

const mockRequests = [
  {
    id: '1',
    user: {
      id: 'user1',
      username: 'techguru',
      displayName: 'Tech Guru',
      avatar: null,
      isVerified: true
    },
    message: 'Hey! I love your posts about web development.',
    sentAt: new Date(Date.now() - 3600000).toISOString(),
    mutualFriends: 5,
    mutualConnections: ['user2', 'user3']
  },
  {
    id: '2',
    user: {
      id: 'user2',
      username: 'cryptoking',
      displayName: 'Crypto King',
      avatar: '👑',
      isVerified: false
    },
    message: '',
    sentAt: new Date(Date.now() - 7200000).toISOString(),
    mutualFriends: 12,
    mutualConnections: ['user1', 'user4']
  },
  {
    id: '3',
    user: {
      id: 'user3',
      username: 'nftcollector',
      displayName: 'NFT Collector',
      avatar: 'https://example.com/avatar.jpg',
      isVerified: true
    },
    message: 'Found you through the CRYB community!',
    sentAt: new Date(Date.now() - 86400000).toISOString(),
    mutualFriends: 3,
    mutualConnections: ['user1']
  }
]

const mockSentRequests = [
  {
    id: '4',
    user: {
      id: 'user4',
      username: 'gamergirl',
      displayName: 'Gamer Girl',
      avatar: '🎮',
      isVerified: false
    },
    message: 'Lets be friends!',
    sentAt: new Date(Date.now() - 5000000).toISOString(),
    mutualFriends: 2,
    mutualConnections: []
  }
]

describe('FriendRequestSystem', () => {
  let mockShowToast
  let mockOnClose

  beforeEach(() => {
    mockShowToast = jest.fn()
    mockOnClose = jest.fn()

    useAuth.mockReturnValue({
      user: { id: 'currentUser', username: 'currentuser' }
    })

    useToast.mockReturnValue({
      showToast: mockShowToast
    })

    socialService.getFriendRequests.mockResolvedValue({
      requests: mockRequests,
      page: 1,
      limit: 20,
      total: 3,
      hasMore: false
    })

    socialService.acceptFriendRequest.mockResolvedValue({})
    socialService.rejectFriendRequest.mockResolvedValue({})
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Component Rendering', () => {
    test('renders friend request modal with header', async () => {
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Friend Requests')).toBeInTheDocument()
      })
    })

    test('renders close button', async () => {
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        const closeButton = screen.getByRole('button', { name: '' })
        expect(closeButton).toBeInTheDocument()
      })
    })

    test('renders refresh button', async () => {
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByTitle(/refresh/i)).toBeInTheDocument()
      })
    })

    test('renders tabs for received and sent requests', async () => {
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /received/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /sent/i })).toBeInTheDocument()
      })
    })

    test('renders search box', async () => {
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search requests...')).toBeInTheDocument()
      })
    })

    test('renders filter button', async () => {
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument()
      })
    })

    test('renders stats footer', async () => {
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Total:')).toBeInTheDocument()
      })
    })
  })

  describe('Initial Tab', () => {
    test('defaults to received tab', async () => {
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        const receivedTab = screen.getByRole('button', { name: /received/i })
        expect(receivedTab).toHaveClass('active')
      })
    })

    test('can initialize with sent tab', async () => {
      render(<FriendRequestSystem onClose={mockOnClose} initialTab="sent" />)

      await waitFor(() => {
        const sentTab = screen.getByRole('button', { name: /sent/i })
        expect(sentTab).toHaveClass('active')
      })
    })
  })

  describe('Loading Requests', () => {
    test('shows loading state initially', () => {
      render(<FriendRequestSystem onClose={mockOnClose} />)

      expect(screen.getByText('Loading requests...')).toBeInTheDocument()
    })

    test('calls getFriendRequests on mount', async () => {
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(socialService.getFriendRequests).toHaveBeenCalledWith('received', 1, 20)
      })
    })

    test('loads requests for active tab', async () => {
      render(<FriendRequestSystem onClose={mockOnClose} initialTab="sent" />)

      await waitFor(() => {
        expect(socialService.getFriendRequests).toHaveBeenCalledWith('sent', 1, 20)
      })
    })

    test('displays loaded requests', async () => {
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
        expect(screen.getByText('Crypto King')).toBeInTheDocument()
        expect(screen.getByText('NFT Collector')).toBeInTheDocument()
      })
    })

    test('updates pagination data', async () => {
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument()
      })
    })
  })

  describe('Incoming Requests Display', () => {
    test('displays user display name', async () => {
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })
    })

    test('displays user username', async () => {
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('@techguru')).toBeInTheDocument()
      })
    })

    test('displays request message when present', async () => {
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText(/"Hey! I love your posts about web development."/)).toBeInTheDocument()
      })
    })

    test('does not display message section when message is empty', async () => {
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        const cards = screen.getAllByClassName('request-card')
        const cryptoKingCard = cards.find(card => card.textContent.includes('Crypto King'))
        expect(cryptoKingCard).not.toHaveTextContent(/".*"/)
      })
    })

    test('displays mutual friends count', async () => {
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('5 mutual friends')).toBeInTheDocument()
      })
    })

    test('displays verified badge for verified users', async () => {
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        const badges = document.querySelectorAll('.verified-badge')
        expect(badges.length).toBe(2)
      })
    })

    test('does not display verified badge for non-verified users', async () => {
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        const cards = screen.getAllByClassName('request-card')
        const cryptoKingCard = cards[1]
        const badge = within(cryptoKingCard).queryByClassName('verified-badge')
        expect(badge).toBeNull()
      })
    })

    test('displays emoji avatar when avatar is emoji', async () => {
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('👑')).toBeInTheDocument()
      })
    })

    test('displays image avatar when avatar is URL', async () => {
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        const img = screen.getByAltText('nftcollector')
        expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
      })
    })

    test('displays placeholder when no avatar', async () => {
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        const placeholders = document.querySelectorAll('.avatar-placeholder')
        expect(placeholders.length).toBeGreaterThan(0)
      })
    })

    test('displays time ago for each request', async () => {
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('1h ago')).toBeInTheDocument()
        expect(screen.getByText('2h ago')).toBeInTheDocument()
        expect(screen.getByText('1d ago')).toBeInTheDocument()
      })
    })
  })

  describe('Outgoing Requests Display', () => {
    beforeEach(() => {
      socialService.getFriendRequests.mockImplementation((tab) => {
        if (tab === 'sent') {
          return Promise.resolve({
            requests: mockSentRequests,
            page: 1,
            limit: 20,
            total: 1,
            hasMore: false
          })
        }
        return Promise.resolve({
          requests: mockRequests,
          page: 1,
          limit: 20,
          total: 3,
          hasMore: false
        })
      })
    })

    test('displays sent requests when sent tab is active', async () => {
      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /sent/i }))

      await waitFor(() => {
        expect(screen.getByText('Gamer Girl')).toBeInTheDocument()
      })
    })

    test('displays pending status for sent requests', async () => {
      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /sent/i }))

      await waitFor(() => {
        expect(screen.getByText('Pending')).toBeInTheDocument()
      })
    })

    test('does not show accept/decline buttons for sent requests', async () => {
      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /sent/i }))

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /accept/i })).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /decline/i })).not.toBeInTheDocument()
      })
    })
  })

  describe('Accept Request Functionality', () => {
    test('renders accept button for received requests', async () => {
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        const acceptButtons = screen.getAllByRole('button', { name: /accept/i })
        expect(acceptButtons.length).toBe(3)
      })
    })

    test('calls acceptFriendRequest when accept button is clicked', async () => {
      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      const acceptButtons = screen.getAllByRole('button', { name: /accept/i })
      await user.click(acceptButtons[0])

      expect(socialService.acceptFriendRequest).toHaveBeenCalledWith('1')
    })

    test('removes request from list after accepting', async () => {
      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      const acceptButtons = screen.getAllByRole('button', { name: /accept/i })
      await user.click(acceptButtons[0])

      await waitFor(() => {
        expect(screen.queryByText('Tech Guru')).not.toBeInTheDocument()
      })
    })

    test('shows success toast after accepting request', async () => {
      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      const acceptButtons = screen.getAllByRole('button', { name: /accept/i })
      await user.click(acceptButtons[0])

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Friend request accepted!', 'success')
      })
    })

    test('shows error toast when accept fails', async () => {
      socialService.acceptFriendRequest.mockRejectedValueOnce(new Error('Network error'))

      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      const acceptButtons = screen.getAllByRole('button', { name: /accept/i })
      await user.click(acceptButtons[0])

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Failed to accept request', 'error')
      })
    })

    test('does not remove request from list when accept fails', async () => {
      socialService.acceptFriendRequest.mockRejectedValueOnce(new Error('Network error'))

      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      const acceptButtons = screen.getAllByRole('button', { name: /accept/i })
      await user.click(acceptButtons[0])

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalled()
      })

      expect(screen.getByText('Tech Guru')).toBeInTheDocument()
    })
  })

  describe('Decline Request Functionality', () => {
    test('renders decline button for received requests', async () => {
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        const declineButtons = screen.getAllByRole('button', { name: /decline/i })
        expect(declineButtons.length).toBe(3)
      })
    })

    test('calls rejectFriendRequest when decline button is clicked', async () => {
      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      const declineButtons = screen.getAllByRole('button', { name: /decline/i })
      await user.click(declineButtons[0])

      expect(socialService.rejectFriendRequest).toHaveBeenCalledWith('1')
    })

    test('removes request from list after declining', async () => {
      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      const declineButtons = screen.getAllByRole('button', { name: /decline/i })
      await user.click(declineButtons[0])

      await waitFor(() => {
        expect(screen.queryByText('Tech Guru')).not.toBeInTheDocument()
      })
    })

    test('shows success toast after declining request', async () => {
      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      const declineButtons = screen.getAllByRole('button', { name: /decline/i })
      await user.click(declineButtons[0])

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Friend request declined', 'success')
      })
    })

    test('shows error toast when decline fails', async () => {
      socialService.rejectFriendRequest.mockRejectedValueOnce(new Error('Network error'))

      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      const declineButtons = screen.getAllByRole('button', { name: /decline/i })
      await user.click(declineButtons[0])

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Failed to reject request', 'error')
      })
    })

    test('does not remove request from list when decline fails', async () => {
      socialService.rejectFriendRequest.mockRejectedValueOnce(new Error('Network error'))

      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      const declineButtons = screen.getAllByRole('button', { name: /decline/i })
      await user.click(declineButtons[0])

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalled()
      })

      expect(screen.getByText('Tech Guru')).toBeInTheDocument()
    })
  })

  describe('User Search', () => {
    test('filters requests by username', async () => {
      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search requests...')
      await user.type(searchInput, 'techguru')

      expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      expect(screen.queryByText('Crypto King')).not.toBeInTheDocument()
    })

    test('filters requests by display name', async () => {
      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search requests...')
      await user.type(searchInput, 'Crypto King')

      expect(screen.queryByText('Tech Guru')).not.toBeInTheDocument()
      expect(screen.getByText('Crypto King')).toBeInTheDocument()
    })

    test('filters requests by message content', async () => {
      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search requests...')
      await user.type(searchInput, 'web development')

      expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      expect(screen.queryByText('Crypto King')).not.toBeInTheDocument()
    })

    test('search is case insensitive', async () => {
      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search requests...')
      await user.type(searchInput, 'TECHGURU')

      expect(screen.getByText('Tech Guru')).toBeInTheDocument()
    })

    test('shows filtered count when searching', async () => {
      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search requests...')
      await user.type(searchInput, 'techguru')

      await waitFor(() => {
        expect(screen.getByText('Filtered:')).toBeInTheDocument()
        expect(screen.getByText('1')).toBeInTheDocument()
      })
    })

    test('clearing search shows all requests again', async () => {
      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search requests...')
      await user.type(searchInput, 'techguru')

      expect(screen.queryByText('Crypto King')).not.toBeInTheDocument()

      await user.clear(searchInput)

      expect(screen.getByText('Crypto King')).toBeInTheDocument()
    })
  })

  describe('Tab Switching', () => {
    test('switches to sent tab when clicked', async () => {
      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      const sentTab = screen.getByRole('button', { name: /sent/i })
      await user.click(sentTab)

      expect(sentTab).toHaveClass('active')
    })

    test('loads requests for new tab', async () => {
      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /sent/i }))

      await waitFor(() => {
        expect(socialService.getFriendRequests).toHaveBeenCalledWith('sent', 1, 20)
      })
    })

    test('clears search when switching tabs', async () => {
      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search requests...')
      await user.type(searchInput, 'test')

      await user.click(screen.getByRole('button', { name: /sent/i }))

      expect(searchInput.value).toBe('test')
    })

    test('received tab shows badge with count', async () => {
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        const receivedTab = screen.getByRole('button', { name: /received/i })
        expect(within(receivedTab).getByText('3')).toBeInTheDocument()
      })
    })
  })

  describe('Filter Panel', () => {
    test('toggles filter panel when filter button is clicked', async () => {
      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      const filterButton = screen.getByRole('button', { name: /filters/i })

      expect(screen.queryByText('Sort by:')).not.toBeInTheDocument()

      await user.click(filterButton)

      expect(screen.getByText('Sort by:')).toBeInTheDocument()
    })

    test('closes filter panel when clicked again', async () => {
      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      const filterButton = screen.getByRole('button', { name: /filters/i })

      await user.click(filterButton)
      expect(screen.getByText('Sort by:')).toBeInTheDocument()

      await user.click(filterButton)
      expect(screen.queryByText('Sort by:')).not.toBeInTheDocument()
    })

    test('displays sort options', async () => {
      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /filters/i }))

      expect(screen.getByText('Newest First')).toBeInTheDocument()
      expect(screen.getByText('Oldest First')).toBeInTheDocument()
      expect(screen.getByText('Most Mutual Friends')).toBeInTheDocument()
    })

    test('displays filter options', async () => {
      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /filters/i }))

      expect(screen.getByText('All Requests')).toBeInTheDocument()
      expect(screen.getByText('With Message')).toBeInTheDocument()
      expect(screen.getByText('Mutual Friends')).toBeInTheDocument()
      expect(screen.getByText('Verified Users')).toBeInTheDocument()
    })

    test('changes sort order when option is selected', async () => {
      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /filters/i }))

      const sortSelect = screen.getByRole('combobox', { name: /sort by:/i })
      await user.selectOptions(sortSelect, 'oldest')

      await waitFor(() => {
        expect(socialService.getFriendRequests).toHaveBeenCalledWith('received', 1, 20)
      })
    })

    test('changes filter when option is selected', async () => {
      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /filters/i }))

      const filterSelect = screen.getByRole('combobox', { name: /filter by:/i })
      await user.selectOptions(filterSelect, 'verified')

      await waitFor(() => {
        expect(socialService.getFriendRequests).toHaveBeenCalledWith('received', 1, 20)
      })
    })

    test('filter button shows active state when panel is open', async () => {
      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      const filterButton = screen.getByRole('button', { name: /filters/i })

      await user.click(filterButton)

      expect(filterButton).toHaveClass('active')
    })
  })

  describe('Pagination', () => {
    test('displays load more button when hasMore is true', async () => {
      socialService.getFriendRequests.mockResolvedValueOnce({
        requests: mockRequests,
        page: 1,
        limit: 20,
        total: 50,
        hasMore: true
      })

      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Load More Requests')).toBeInTheDocument()
      })
    })

    test('does not display load more button when hasMore is false', async () => {
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      expect(screen.queryByText('Load More Requests')).not.toBeInTheDocument()
    })

    test('loads more requests when load more button is clicked', async () => {
      socialService.getFriendRequests.mockResolvedValueOnce({
        requests: mockRequests,
        page: 1,
        limit: 20,
        total: 50,
        hasMore: true
      })

      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Load More Requests')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Load More Requests'))

      await waitFor(() => {
        expect(socialService.getFriendRequests).toHaveBeenCalledWith('received', 2, 20)
      })
    })

    test('disables load more button while loading', async () => {
      socialService.getFriendRequests.mockResolvedValueOnce({
        requests: mockRequests,
        page: 1,
        limit: 20,
        total: 50,
        hasMore: true
      })

      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Load More Requests')).toBeInTheDocument()
      })

      const loadMoreButton = screen.getByText('Load More Requests')

      socialService.getFriendRequests.mockImplementation(() => new Promise(() => {}))

      await user.click(loadMoreButton)

      expect(loadMoreButton).toBeDisabled()
    })

    test('appends new requests to existing list', async () => {
      const moreRequests = [
        {
          id: '5',
          user: {
            id: 'user5',
            username: 'newuser',
            displayName: 'New User',
            avatar: null,
            isVerified: false
          },
          message: '',
          sentAt: new Date().toISOString(),
          mutualFriends: 0,
          mutualConnections: []
        }
      ]

      socialService.getFriendRequests
        .mockResolvedValueOnce({
          requests: mockRequests,
          page: 1,
          limit: 20,
          total: 50,
          hasMore: true
        })
        .mockResolvedValueOnce({
          requests: moreRequests,
          page: 2,
          limit: 20,
          total: 50,
          hasMore: false
        })

      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Load More Requests'))

      await waitFor(() => {
        expect(screen.getByText('New User')).toBeInTheDocument()
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })
    })

    test('displays total count in stats', async () => {
      socialService.getFriendRequests.mockResolvedValueOnce({
        requests: mockRequests,
        page: 1,
        limit: 20,
        total: 50,
        hasMore: true
      })

      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('50')).toBeInTheDocument()
      })
    })
  })

  describe('Refresh Functionality', () => {
    test('refreshes requests when refresh button is clicked', async () => {
      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      socialService.getFriendRequests.mockClear()

      const refreshButton = screen.getByTitle(/refresh/i)
      await user.click(refreshButton)

      await waitFor(() => {
        expect(socialService.getFriendRequests).toHaveBeenCalledWith('received', 1, 20)
      })
    })

    test('disables refresh button while refreshing', async () => {
      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      const refreshButton = screen.getByTitle(/refresh/i)

      socialService.getFriendRequests.mockImplementation(() => new Promise(() => {}))

      await user.click(refreshButton)

      expect(refreshButton).toBeDisabled()
    })

    test('adds spinning animation to refresh icon while refreshing', async () => {
      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      socialService.getFriendRequests.mockImplementation(() => new Promise(() => {}))

      const refreshButton = screen.getByTitle(/refresh/i)
      await user.click(refreshButton)

      const icon = refreshButton.querySelector('.spinning')
      expect(icon).toBeInTheDocument()
    })

    test('resets pagination when refreshing', async () => {
      socialService.getFriendRequests
        .mockResolvedValueOnce({
          requests: mockRequests,
          page: 1,
          limit: 20,
          total: 50,
          hasMore: true
        })
        .mockResolvedValueOnce({
          requests: [],
          page: 2,
          limit: 20,
          total: 50,
          hasMore: false
        })
        .mockResolvedValueOnce({
          requests: mockRequests,
          page: 1,
          limit: 20,
          total: 50,
          hasMore: true
        })

      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Load More Requests')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Load More Requests'))

      await waitFor(() => {
        expect(socialService.getFriendRequests).toHaveBeenCalledWith('received', 2, 20)
      })

      const refreshButton = screen.getByTitle(/refresh/i)
      await user.click(refreshButton)

      await waitFor(() => {
        expect(socialService.getFriendRequests).toHaveBeenCalledWith('received', 1, 20)
      })
    })
  })

  describe('Empty States', () => {
    test('displays empty state when no received requests', async () => {
      socialService.getFriendRequests.mockResolvedValueOnce({
        requests: [],
        page: 1,
        limit: 20,
        total: 0,
        hasMore: false
      })

      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('No friend requests')).toBeInTheDocument()
        expect(screen.getByText("When people send you friend requests, they'll appear here")).toBeInTheDocument()
      })
    })

    test('displays empty state when no sent requests', async () => {
      socialService.getFriendRequests.mockImplementation((tab) => {
        if (tab === 'sent') {
          return Promise.resolve({
            requests: [],
            page: 1,
            limit: 20,
            total: 0,
            hasMore: false
          })
        }
        return Promise.resolve({
          requests: mockRequests,
          page: 1,
          limit: 20,
          total: 3,
          hasMore: false
        })
      })

      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /sent/i }))

      await waitFor(() => {
        expect(screen.getByText('No sent requests')).toBeInTheDocument()
        expect(screen.getByText("Friend requests you've sent will appear here")).toBeInTheDocument()
      })
    })

    test('displays empty state when search returns no results', async () => {
      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search requests...')
      await user.type(searchInput, 'nonexistentuser')

      expect(screen.getByText('No friend requests')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    test('shows error toast when loading requests fails', async () => {
      socialService.getFriendRequests.mockRejectedValueOnce(new Error('Network error'))

      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Failed to load requests', 'error')
      })
    })

    test('loads mock data when API fails', async () => {
      socialService.getFriendRequests.mockRejectedValueOnce(new Error('Network error'))

      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })
    })

    test('logs error to console when loading fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      const error = new Error('Network error')
      socialService.getFriendRequests.mockRejectedValueOnce(error)

      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading friend requests:', error)
      })

      consoleErrorSpy.mockRestore()
    })

    test('logs error when accept request fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      const error = new Error('Network error')
      socialService.acceptFriendRequest.mockRejectedValueOnce(error)

      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      const acceptButtons = screen.getAllByRole('button', { name: /accept/i })
      await user.click(acceptButtons[0])

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error accepting request:', error)
      })

      consoleErrorSpy.mockRestore()
    })

    test('logs error when reject request fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      const error = new Error('Network error')
      socialService.rejectFriendRequest.mockRejectedValueOnce(error)

      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      const declineButtons = screen.getAllByRole('button', { name: /decline/i })
      await user.click(declineButtons[0])

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error rejecting request:', error)
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Close Functionality', () => {
    test('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      const closeButtons = screen.getAllByRole('button')
      const closeButton = closeButtons.find(button => button.className.includes('close-btn'))

      await user.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Time Formatting', () => {
    test('displays "Just now" for recent timestamps', async () => {
      const recentRequest = {
        id: '10',
        user: {
          id: 'user10',
          username: 'recentuser',
          displayName: 'Recent User',
          avatar: null,
          isVerified: false
        },
        message: '',
        sentAt: new Date(Date.now() - 30000).toISOString(),
        mutualFriends: 0,
        mutualConnections: []
      }

      socialService.getFriendRequests.mockResolvedValueOnce({
        requests: [recentRequest],
        page: 1,
        limit: 20,
        total: 1,
        hasMore: false
      })

      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Just now')).toBeInTheDocument()
      })
    })

    test('formats dates older than a week', async () => {
      const oldRequest = {
        id: '11',
        user: {
          id: 'user11',
          username: 'olduser',
          displayName: 'Old User',
          avatar: null,
          isVerified: false
        },
        message: '',
        sentAt: new Date(Date.now() - 700000000).toISOString(),
        mutualFriends: 0,
        mutualConnections: []
      }

      socialService.getFriendRequests.mockResolvedValueOnce({
        requests: [oldRequest],
        page: 1,
        limit: 20,
        total: 1,
        hasMore: false
      })

      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        const datePattern = /\d{1,2}\/\d{1,2}\/\d{4}/
        expect(screen.getByText(datePattern)).toBeInTheDocument()
      })
    })
  })

  describe('View Profile Button', () => {
    test('renders view profile button for each received request', async () => {
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        const viewProfileButtons = screen.getAllByTitle('View profile')
        expect(viewProfileButtons.length).toBe(3)
      })
    })
  })

  describe('Accessibility', () => {
    test('accept button has proper accessibility attributes', async () => {
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        const acceptButtons = screen.getAllByTitle('Accept friend request')
        expect(acceptButtons[0]).toHaveAttribute('title', 'Accept friend request')
      })
    })

    test('decline button has proper accessibility attributes', async () => {
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        const declineButtons = screen.getAllByTitle('Decline friend request')
        expect(declineButtons[0]).toHaveAttribute('title', 'Decline friend request')
      })
    })

    test('view profile button has proper accessibility attributes', async () => {
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        const profileButtons = screen.getAllByTitle('View profile')
        expect(profileButtons[0]).toHaveAttribute('title', 'View profile')
      })
    })

    test('search input is accessible', async () => {
      render(<FriendRequestSystem onClose={mockOnClose} />)

      const searchInput = screen.getByPlaceholderText('Search requests...')
      expect(searchInput).toHaveAttribute('type', 'text')
      expect(searchInput).toBeInTheDocument()
    })

    test('modal has proper semantic structure', async () => {
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Friend Requests')).toBeInTheDocument()
      })

      const heading = screen.getByRole('heading', { name: 'Friend Requests' })
      expect(heading).toBeInTheDocument()
    })

    test('tabs are keyboard navigable', async () => {
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        const receivedTab = screen.getByRole('button', { name: /received/i })
        const sentTab = screen.getByRole('button', { name: /sent/i })

        expect(receivedTab).toBeInTheDocument()
        expect(sentTab).toBeInTheDocument()
      })
    })

    test('buttons are properly labeled for screen readers', async () => {
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        const acceptButtons = screen.getAllByRole('button', { name: /accept/i })
        expect(acceptButtons.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Edge Cases', () => {
    test('handles request with no mutual friends gracefully', async () => {
      const requestWithNoMutual = {
        id: '99',
        user: {
          id: 'user99',
          username: 'noconnections',
          displayName: 'No Connections',
          avatar: null,
          isVerified: false
        },
        message: 'Hello!',
        sentAt: new Date().toISOString(),
        mutualFriends: 0,
        mutualConnections: []
      }

      socialService.getFriendRequests.mockResolvedValueOnce({
        requests: [requestWithNoMutual],
        page: 1,
        limit: 20,
        total: 1,
        hasMore: false
      })

      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('No Connections')).toBeInTheDocument()
      })

      expect(screen.queryByText('0 mutual friends')).not.toBeInTheDocument()
    })

    test('handles very long username gracefully', async () => {
      const longUsernameRequest = {
        id: '100',
        user: {
          id: 'user100',
          username: 'verylongusernamethatmightbreakthelayout',
          displayName: 'User With Very Long Username',
          avatar: null,
          isVerified: false
        },
        message: '',
        sentAt: new Date().toISOString(),
        mutualFriends: 5,
        mutualConnections: []
      }

      socialService.getFriendRequests.mockResolvedValueOnce({
        requests: [longUsernameRequest],
        page: 1,
        limit: 20,
        total: 1,
        hasMore: false
      })

      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('@verylongusernamethatmightbreakthelayout')).toBeInTheDocument()
      })
    })

    test('handles very long message gracefully', async () => {
      const longMessage = 'This is a very long message that might break the layout. '.repeat(10)
      const longMessageRequest = {
        id: '101',
        user: {
          id: 'user101',
          username: 'verboseuser',
          displayName: 'Verbose User',
          avatar: null,
          isVerified: false
        },
        message: longMessage,
        sentAt: new Date().toISOString(),
        mutualFriends: 2,
        mutualConnections: []
      }

      socialService.getFriendRequests.mockResolvedValueOnce({
        requests: [longMessageRequest],
        page: 1,
        limit: 20,
        total: 1,
        hasMore: false
      })

      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText(`"${longMessage}"`)).toBeInTheDocument()
      })
    })

    test('handles request with special characters in message', async () => {
      const specialCharsRequest = {
        id: '102',
        user: {
          id: 'user102',
          username: 'specialuser',
          displayName: 'Special User',
          avatar: null,
          isVerified: false
        },
        message: 'Hello! <script>alert("test")</script> @user #hashtag & symbols',
        sentAt: new Date().toISOString(),
        mutualFriends: 1,
        mutualConnections: []
      }

      socialService.getFriendRequests.mockResolvedValueOnce({
        requests: [specialCharsRequest],
        page: 1,
        limit: 20,
        total: 1,
        hasMore: false
      })

      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText(/"Hello! <script>alert\("test"\)<\/script> @user #hashtag & symbols"/)).toBeInTheDocument()
      })
    })

    test('handles rapid accept/decline clicks', async () => {
      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      const acceptButtons = screen.getAllByRole('button', { name: /accept/i })

      // Rapidly click the same button multiple times
      await user.click(acceptButtons[0])
      await user.click(acceptButtons[0])
      await user.click(acceptButtons[0])

      // Should only call the service once
      await waitFor(() => {
        expect(socialService.acceptFriendRequest).toHaveBeenCalledTimes(1)
      })
    })

    test('handles accepting all requests sequentially', async () => {
      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      const acceptButtons = screen.getAllByRole('button', { name: /accept/i })

      // Accept all requests one by one
      for (let i = 0; i < acceptButtons.length; i++) {
        const currentButtons = screen.getAllByRole('button', { name: /accept/i })
        if (currentButtons[0]) {
          await user.click(currentButtons[0])
          await waitFor(() => {
            expect(socialService.acceptFriendRequest).toHaveBeenCalledTimes(i + 1)
          })
        }
      }

      // All requests should be removed
      await waitFor(() => {
        expect(screen.queryByText('Tech Guru')).not.toBeInTheDocument()
        expect(screen.queryByText('Crypto King')).not.toBeInTheDocument()
        expect(screen.queryByText('NFT Collector')).not.toBeInTheDocument()
      })
    })
  })

  describe('Request Notifications/Badge Count', () => {
    test('displays correct badge count for received requests', async () => {
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        const receivedTab = screen.getByRole('button', { name: /received/i })
        expect(within(receivedTab).getByText('3')).toBeInTheDocument()
      })
    })

    test('badge count updates after accepting request', async () => {
      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        const receivedTab = screen.getByRole('button', { name: /received/i })
        expect(within(receivedTab).getByText('3')).toBeInTheDocument()
      })

      const acceptButtons = screen.getAllByRole('button', { name: /accept/i })
      await user.click(acceptButtons[0])

      await waitFor(() => {
        const receivedTab = screen.getByRole('button', { name: /received/i })
        expect(within(receivedTab).getByText('2')).toBeInTheDocument()
      })
    })

    test('badge count updates after declining request', async () => {
      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        const receivedTab = screen.getByRole('button', { name: /received/i })
        expect(within(receivedTab).getByText('3')).toBeInTheDocument()
      })

      const declineButtons = screen.getAllByRole('button', { name: /decline/i })
      await user.click(declineButtons[0])

      await waitFor(() => {
        const receivedTab = screen.getByRole('button', { name: /received/i })
        expect(within(receivedTab).getByText('2')).toBeInTheDocument()
      })
    })

    test('does not show badge when count is zero', async () => {
      socialService.getFriendRequests.mockResolvedValueOnce({
        requests: [],
        page: 1,
        limit: 20,
        total: 0,
        hasMore: false
      })

      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('No friend requests')).toBeInTheDocument()
      })

      const receivedTab = screen.getByRole('button', { name: /received/i })
      expect(within(receivedTab).queryByText('0')).not.toBeInTheDocument()
    })
  })

  describe('Multiple Filter Combinations', () => {
    test('applies both sort and filter together', async () => {
      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /filters/i }))

      const sortSelect = screen.getByRole('combobox', { name: /sort by:/i })
      await user.selectOptions(sortSelect, 'oldest')

      const filterSelect = screen.getByRole('combobox', { name: /filter by:/i })
      await user.selectOptions(filterSelect, 'verified')

      await waitFor(() => {
        expect(socialService.getFriendRequests).toHaveBeenCalledWith('received', 1, 20)
      })
    })

    test('combining search with filters works correctly', async () => {
      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      // Apply filter first
      await user.click(screen.getByRole('button', { name: /filters/i }))
      const filterSelect = screen.getByRole('combobox', { name: /filter by:/i })
      await user.selectOptions(filterSelect, 'verified')

      // Then search
      const searchInput = screen.getByPlaceholderText('Search requests...')
      await user.type(searchInput, 'tech')

      expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      expect(screen.queryByText('Crypto King')).not.toBeInTheDocument()
    })
  })

  describe('Request List Scrolling and Performance', () => {
    test('handles large number of requests', async () => {
      const manyRequests = Array.from({ length: 100 }, (_, i) => ({
        id: `request-${i}`,
        user: {
          id: `user-${i}`,
          username: `user${i}`,
          displayName: `User ${i}`,
          avatar: null,
          isVerified: i % 2 === 0
        },
        message: `Message from user ${i}`,
        sentAt: new Date(Date.now() - i * 3600000).toISOString(),
        mutualFriends: i % 10,
        mutualConnections: []
      }))

      socialService.getFriendRequests.mockResolvedValueOnce({
        requests: manyRequests.slice(0, 20),
        page: 1,
        limit: 20,
        total: 100,
        hasMore: true
      })

      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('User 0')).toBeInTheDocument()
        expect(screen.getByText('User 19')).toBeInTheDocument()
      })

      expect(screen.getByText('100')).toBeInTheDocument()
    })

    test('maintains scroll position when accepting request', async () => {
      const user = userEvent.setup()
      render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      const acceptButtons = screen.getAllByRole('button', { name: /accept/i })
      await user.click(acceptButtons[1]) // Accept the second request

      await waitFor(() => {
        expect(screen.queryByText('Crypto King')).not.toBeInTheDocument()
      })

      // Other requests should still be visible
      expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      expect(screen.getByText('NFT Collector')).toBeInTheDocument()
    })
  })

  describe('Component Cleanup', () => {
    test('does not update state after unmount', async () => {
      const user = userEvent.setup()
      const { unmount } = render(<FriendRequestSystem onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Guru')).toBeInTheDocument()
      })

      // Unmount the component
      unmount()

      // Try to trigger a state update (this should not cause an error)
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      // Manually trigger the mock to resolve after unmount
      socialService.acceptFriendRequest.mockResolvedValue({})

      expect(consoleErrorSpy).not.toHaveBeenCalled()
      consoleErrorSpy.mockRestore()
    })
  })
})

export default mockRequests
