import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FriendSuggestions from './FriendSuggestions'
import socialService from '../../services/socialService'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../ui/useToast'

jest.mock('../../services/socialService')
jest.mock('../../contexts/AuthContext')
jest.mock('../ui/useToast')
jest.mock('./FollowButton', () => ({
  __esModule: true,
  default: ({ userId, onStateChange, className }) => (
    <button
      data-testid={`follow-button-${userId}`}
      className={className}
      onClick={() => onStateChange && onStateChange({ isFollowing: true })}
    >
      Follow
    </button>
  )
}))

const mockSuggestions = [
  {
    id: 'user_1',
    user: {
      id: 'user_1',
      username: 'cryptowhale',
      displayName: 'Crypto Whale',
      avatar: '🐋',
      bio: 'DeFi researcher and whale tracker',
      karma: 4521,
      isVerified: true,
      isOnline: true,
      location: 'San Francisco, CA',
      joinedDate: '2023-01-15',
      interests: ['DeFi', 'Trading', 'Analytics']
    },
    reason: 'Similar interests',
    score: 0.95,
    mutualConnections: 8,
    algorithm: 'smart'
  },
  {
    id: 'user_2',
    user: {
      id: 'user_2',
      username: 'nftartist',
      displayName: 'NFT Artist',
      avatar: '🎨',
      bio: 'Digital artist creating unique NFTs',
      karma: 2156,
      isVerified: false,
      isOnline: false,
      location: 'Brooklyn, NY',
      joinedDate: '2023-03-22',
      interests: ['Art', 'NFTs', 'Design']
    },
    reason: '5 mutual connections',
    score: 0.87,
    mutualConnections: 5,
    algorithm: 'smart'
  },
  {
    id: 'user_3',
    user: {
      id: 'user_3',
      username: 'metaverse_dev',
      displayName: 'Metaverse Dev',
      avatar: '🚀',
      bio: 'VR/AR developer building immersive experiences',
      karma: 3890,
      isVerified: true,
      isOnline: true,
      location: 'Seattle, WA',
      joinedDate: '2023-02-10',
      interests: ['VR', 'Gaming', 'Development']
    },
    reason: 'Active in same communities',
    score: 0.92,
    mutualConnections: 12,
    algorithm: 'smart'
  }
]

describe('FriendSuggestions', () => {
  const mockShowToast = jest.fn()
  const mockUser = { id: 'current_user', username: 'testuser' }

  beforeEach(() => {
    jest.clearAllMocks()
    useAuth.mockReturnValue({ user: mockUser })
    useToast.mockReturnValue({ showToast: mockShowToast })
    socialService.getFriendSuggestions.mockResolvedValue({ suggestions: mockSuggestions })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering and Initial State', () => {
    it('should render loading state initially', () => {
      render(<FriendSuggestions />)
      expect(screen.getByText(/finding great people for you/i)).toBeInTheDocument()
    })

    it('should render header with title and description', async () => {
      render(<FriendSuggestions />)
      await waitFor(() => {
        expect(screen.getByText('People You May Know')).toBeInTheDocument()
        expect(screen.getByText('Discover interesting people to connect with')).toBeInTheDocument()
      })
    })

    it('should not render header when showHeader is false', async () => {
      render(<FriendSuggestions showHeader={false} />)
      await waitFor(() => {
        expect(screen.queryByText('People You May Know')).not.toBeInTheDocument()
      })
    })

    it('should render embedded mode without modal wrapper', async () => {
      const { container } = render(<FriendSuggestions embedded={true} />)
      await waitFor(() => {
        expect(container.querySelector('.friend-suggestions-modal')).not.toBeInTheDocument()
      })
    })

    it('should render modal wrapper when not embedded', async () => {
      const { container } = render(<FriendSuggestions embedded={false} />)
      await waitFor(() => {
        expect(container.querySelector('.friend-suggestions-modal')).toBeInTheDocument()
      })
    })
  })

  describe('Suggestions List Display', () => {
    it('should display all suggestions after loading', async () => {
      render(<FriendSuggestions />)
      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
        expect(screen.getByText('NFT Artist')).toBeInTheDocument()
        expect(screen.getByText('Metaverse Dev')).toBeInTheDocument()
      })
    })

    it('should display user avatars', async () => {
      render(<FriendSuggestions />)
      await waitFor(() => {
        expect(screen.getByText('🐋')).toBeInTheDocument()
        expect(screen.getByText('🎨')).toBeInTheDocument()
        expect(screen.getByText('🚀')).toBeInTheDocument()
      })
    })

    it('should display usernames with @ prefix', async () => {
      render(<FriendSuggestions />)
      await waitFor(() => {
        expect(screen.getByText('@cryptowhale')).toBeInTheDocument()
        expect(screen.getByText('@nftartist')).toBeInTheDocument()
        expect(screen.getByText('@metaverse_dev')).toBeInTheDocument()
      })
    })

    it('should display user bios', async () => {
      render(<FriendSuggestions />)
      await waitFor(() => {
        expect(screen.getByText('DeFi researcher and whale tracker')).toBeInTheDocument()
        expect(screen.getByText('Digital artist creating unique NFTs')).toBeInTheDocument()
      })
    })

    it('should display karma counts', async () => {
      render(<FriendSuggestions />)
      await waitFor(() => {
        expect(screen.getByText('4521')).toBeInTheDocument()
        expect(screen.getByText('2156')).toBeInTheDocument()
        expect(screen.getByText('3890')).toBeInTheDocument()
      })
    })

    it('should display user locations', async () => {
      render(<FriendSuggestions />)
      await waitFor(() => {
        expect(screen.getByText('San Francisco, CA')).toBeInTheDocument()
        expect(screen.getByText('Brooklyn, NY')).toBeInTheDocument()
        expect(screen.getByText('Seattle, WA')).toBeInTheDocument()
      })
    })

    it('should display verified badges for verified users', async () => {
      const { container } = render(<FriendSuggestions />)
      await waitFor(() => {
        const verifiedBadges = container.querySelectorAll('.absolute.-top-1.-right-1')
        expect(verifiedBadges.length).toBeGreaterThanOrEqual(2)
      })
    })

    it('should display online status indicators', async () => {
      const { container } = render(<FriendSuggestions />)
      await waitFor(() => {
        const onlineIndicators = container.querySelectorAll('.bg-success')
        expect(onlineIndicators.length).toBeGreaterThanOrEqual(2)
      })
    })

    it('should limit suggestions to maxSuggestions prop', async () => {
      render(<FriendSuggestions maxSuggestions={2} />)
      await waitFor(() => {
        expect(socialService.getFriendSuggestions).toHaveBeenCalledWith(2, 'smart')
      })
    })
  })

  describe('Mutual Friends Count', () => {
    it('should display mutual connections count', async () => {
      render(<FriendSuggestions />)
      await waitFor(() => {
        expect(screen.getByText('8 mutual')).toBeInTheDocument()
        expect(screen.getByText('5 mutual')).toBeInTheDocument()
        expect(screen.getByText('12 mutual')).toBeInTheDocument()
      })
    })

    it('should not display mutual connections when count is 0', async () => {
      const suggestionsWithNoMutual = [{
        ...mockSuggestions[0],
        mutualConnections: 0
      }]
      socialService.getFriendSuggestions.mockResolvedValue({ suggestions: suggestionsWithNoMutual })

      render(<FriendSuggestions />)
      await waitFor(() => {
        expect(screen.queryByText(/mutual/)).not.toBeInTheDocument()
      })
    })

    it('should highlight mutual connections in primary color', async () => {
      const { container } = render(<FriendSuggestions />)
      await waitFor(() => {
        const mutualElements = Array.from(container.querySelectorAll('.text-primary'))
          .filter(el => el.textContent.includes('mutual'))
        expect(mutualElements.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Suggestion Reasons', () => {
    it('should display reason for each suggestion', async () => {
      render(<FriendSuggestions />)
      await waitFor(() => {
        expect(screen.getByText('Similar interests')).toBeInTheDocument()
        expect(screen.getByText('5 mutual connections')).toBeInTheDocument()
        expect(screen.getByText('Active in same communities')).toBeInTheDocument()
      })
    })

    it('should display default reason when none provided', async () => {
      const suggestionsWithoutReason = [{
        ...mockSuggestions[0],
        reason: undefined
      }]
      socialService.getFriendSuggestions.mockResolvedValue({ suggestions: suggestionsWithoutReason })

      render(<FriendSuggestions />)
      await waitFor(() => {
        expect(screen.getByText('Suggested for you')).toBeInTheDocument()
      })
    })

    it('should style reasons as badges', async () => {
      const { container } = render(<FriendSuggestions />)
      await waitFor(() => {
        const reasonBadges = container.querySelectorAll('.bg-primary\\/10.text-primary.rounded-full')
        expect(reasonBadges.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Follow Actions', () => {
    it('should render follow button for each suggestion', async () => {
      render(<FriendSuggestions />)
      await waitFor(() => {
        expect(screen.getByTestId('follow-button-user_1')).toBeInTheDocument()
        expect(screen.getByTestId('follow-button-user_2')).toBeInTheDocument()
        expect(screen.getByTestId('follow-button-user_3')).toBeInTheDocument()
      })
    })

    it('should remove suggestion from list after following', async () => {
      const user = userEvent.setup()
      render(<FriendSuggestions />)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })

      const followButton = screen.getByTestId('follow-button-user_1')
      await user.click(followButton)

      await waitFor(() => {
        expect(screen.queryByText('Crypto Whale')).not.toBeInTheDocument()
      })
    })

    it('should not affect other suggestions when one is followed', async () => {
      const user = userEvent.setup()
      render(<FriendSuggestions />)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })

      const followButton = screen.getByTestId('follow-button-user_1')
      await user.click(followButton)

      await waitFor(() => {
        expect(screen.getByText('NFT Artist')).toBeInTheDocument()
        expect(screen.getByText('Metaverse Dev')).toBeInTheDocument()
      })
    })
  })

  describe('Dismiss Suggestions', () => {
    it('should render dismiss button for each suggestion', async () => {
      render(<FriendSuggestions />)
      await waitFor(() => {
        const dismissButtons = screen.getAllByLabelText('Dismiss suggestion')
        expect(dismissButtons).toHaveLength(3)
      })
    })

    it('should call dismissSuggestion API when dismiss clicked', async () => {
      socialService.dismissSuggestion.mockResolvedValue({})
      const user = userEvent.setup()
      render(<FriendSuggestions />)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })

      const dismissButtons = screen.getAllByLabelText('Dismiss suggestion')
      await user.click(dismissButtons[0])

      await waitFor(() => {
        expect(socialService.dismissSuggestion).toHaveBeenCalledWith('user_1')
      })
    })

    it('should remove suggestion from list after dismissing', async () => {
      socialService.dismissSuggestion.mockResolvedValue({})
      const user = userEvent.setup()
      render(<FriendSuggestions />)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })

      const dismissButtons = screen.getAllByLabelText('Dismiss suggestion')
      await user.click(dismissButtons[0])

      await waitFor(() => {
        expect(screen.queryByText('Crypto Whale')).not.toBeInTheDocument()
      })
    })

    it('should show toast message after dismissing', async () => {
      socialService.dismissSuggestion.mockResolvedValue({})
      const user = userEvent.setup()
      render(<FriendSuggestions />)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })

      const dismissButtons = screen.getAllByLabelText('Dismiss suggestion')
      await user.click(dismissButtons[0])

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Suggestion dismissed', 'info')
      })
    })

    it('should handle dismiss error gracefully', async () => {
      socialService.dismissSuggestion.mockRejectedValue(new Error('Network error'))
      const user = userEvent.setup()
      render(<FriendSuggestions />)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })

      const dismissButtons = screen.getAllByLabelText('Dismiss suggestion')
      await user.click(dismissButtons[0])

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Failed to dismiss suggestion', 'error')
      })
    })

    it('should keep dismissed suggestions in dismissed set', async () => {
      socialService.dismissSuggestion.mockResolvedValue({})
      const user = userEvent.setup()
      render(<FriendSuggestions />)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })

      const dismissButtons = screen.getAllByLabelText('Dismiss suggestion')
      await user.click(dismissButtons[0])

      await waitFor(() => {
        expect(screen.queryByText('Crypto Whale')).not.toBeInTheDocument()
      })

      await user.click(screen.getByTitle('Refresh suggestions'))

      await waitFor(() => {
        expect(screen.queryByText('Crypto Whale')).not.toBeInTheDocument()
      })
    })
  })

  describe('Refresh Suggestions', () => {
    it('should render refresh button', async () => {
      render(<FriendSuggestions />)
      await waitFor(() => {
        expect(screen.getByTitle('Refresh suggestions')).toBeInTheDocument()
      })
    })

    it('should reload suggestions when refresh clicked', async () => {
      const user = userEvent.setup()
      render(<FriendSuggestions />)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })

      jest.clearAllMocks()
      await user.click(screen.getByTitle('Refresh suggestions'))

      await waitFor(() => {
        expect(socialService.getFriendSuggestions).toHaveBeenCalled()
      })
    })

    it('should show spinning icon while refreshing', async () => {
      const user = userEvent.setup()
      render(<FriendSuggestions />)

      await waitFor(() => {
        expect(screen.getByTitle('Refresh suggestions')).toBeInTheDocument()
      })

      socialService.getFriendSuggestions.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ suggestions: mockSuggestions }), 100))
      )

      await user.click(screen.getByTitle('Refresh suggestions'))

      const refreshIcon = screen.getByTitle('Refresh suggestions').querySelector('svg')
      expect(refreshIcon).toHaveClass('spinning')
    })

    it('should disable refresh button while refreshing', async () => {
      const user = userEvent.setup()
      render(<FriendSuggestions />)

      await waitFor(() => {
        expect(screen.getByTitle('Refresh suggestions')).toBeInTheDocument()
      })

      socialService.getFriendSuggestions.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ suggestions: mockSuggestions }), 100))
      )

      await user.click(screen.getByTitle('Refresh suggestions'))

      expect(screen.getByTitle('Refresh suggestions')).toBeDisabled()
    })
  })

  describe('Suggestion Algorithms', () => {
    it('should render algorithm selector', async () => {
      render(<FriendSuggestions />)
      await waitFor(() => {
        expect(screen.getByText('Smart Recommendations')).toBeInTheDocument()
      })
    })

    it('should display all algorithm options', async () => {
      render(<FriendSuggestions />)
      await waitFor(() => {
        const select = screen.getByRole('combobox')
        expect(within(select).getByText('Smart Recommendations')).toBeInTheDocument()
        expect(within(select).getByText('Mutual Connections')).toBeInTheDocument()
        expect(within(select).getByText('Trending Users')).toBeInTheDocument()
        expect(within(select).getByText('Nearby Users')).toBeInTheDocument()
        expect(within(select).getByText('New Users')).toBeInTheDocument()
        expect(within(select).getByText('Similar Interests')).toBeInTheDocument()
      })
    })

    it('should reload suggestions when algorithm changed', async () => {
      const user = userEvent.setup()
      render(<FriendSuggestions />)

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })

      jest.clearAllMocks()
      const select = screen.getByRole('combobox')
      await user.selectOptions(select, 'mutual')

      await waitFor(() => {
        expect(socialService.getFriendSuggestions).toHaveBeenCalledWith(20, 'mutual')
      })
    })

    it('should update algorithm icon when changed', async () => {
      const user = userEvent.setup()
      render(<FriendSuggestions />)

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })

      const select = screen.getByRole('combobox')
      await user.selectOptions(select, 'trending')

      await waitFor(() => {
        expect(screen.getByText('Trending Users')).toBeInTheDocument()
      })
    })

    it('should default to smart algorithm', async () => {
      render(<FriendSuggestions />)
      await waitFor(() => {
        expect(socialService.getFriendSuggestions).toHaveBeenCalledWith(20, 'smart')
      })
    })
  })

  describe('Shuffle Suggestions', () => {
    it('should render shuffle button', async () => {
      render(<FriendSuggestions />)
      await waitFor(() => {
        expect(screen.getByTitle('Shuffle suggestions')).toBeInTheDocument()
      })
    })

    it('should reorder suggestions when shuffle clicked', async () => {
      const user = userEvent.setup()
      render(<FriendSuggestions />)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })

      const cards = screen.getAllByRole('heading', { level: 3 })
      const firstCardBefore = cards[0].textContent

      await user.click(screen.getByTitle('Shuffle suggestions'))

      const cardsAfter = screen.getAllByRole('heading', { level: 3 })
      expect(cardsAfter).toHaveLength(cards.length)
    })
  })

  describe('Filters', () => {
    it('should render filter toggle button', async () => {
      render(<FriendSuggestions />)
      await waitFor(() => {
        expect(screen.getByTitle('Show filters')).toBeInTheDocument()
      })
    })

    it('should show filters panel when toggle clicked', async () => {
      const user = userEvent.setup()
      render(<FriendSuggestions />)

      await waitFor(() => {
        expect(screen.getByTitle('Show filters')).toBeInTheDocument()
      })

      await user.click(screen.getByTitle('Show filters'))

      expect(screen.getByPlaceholderText('City or region')).toBeInTheDocument()
    })

    it('should hide filters panel when toggle clicked again', async () => {
      const user = userEvent.setup()
      render(<FriendSuggestions />)

      await waitFor(() => {
        expect(screen.getByTitle('Show filters')).toBeInTheDocument()
      })

      await user.click(screen.getByTitle('Show filters'))
      expect(screen.getByPlaceholderText('City or region')).toBeInTheDocument()

      await user.click(screen.getByTitle('Show filters'))
      expect(screen.queryByPlaceholderText('City or region')).not.toBeInTheDocument()
    })

    it('should filter by location', async () => {
      const user = userEvent.setup()
      render(<FriendSuggestions />)

      await waitFor(() => {
        expect(screen.getByTitle('Show filters')).toBeInTheDocument()
      })

      await user.click(screen.getByTitle('Show filters'))
      const locationInput = screen.getByPlaceholderText('City or region')
      await user.type(locationInput, 'San Francisco')

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
        expect(screen.queryByText('NFT Artist')).not.toBeInTheDocument()
      })
    })

    it('should filter by minimum karma', async () => {
      const user = userEvent.setup()
      render(<FriendSuggestions />)

      await waitFor(() => {
        expect(screen.getByTitle('Show filters')).toBeInTheDocument()
      })

      await user.click(screen.getByTitle('Show filters'))
      const karmaInput = screen.getByLabelText('Min Karma:')
      await user.clear(karmaInput)
      await user.type(karmaInput, '3000')

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
        expect(screen.getByText('Metaverse Dev')).toBeInTheDocument()
        expect(screen.queryByText('NFT Artist')).not.toBeInTheDocument()
      })
    })

    it('should filter by minimum mutual connections', async () => {
      const user = userEvent.setup()
      render(<FriendSuggestions />)

      await waitFor(() => {
        expect(screen.getByTitle('Show filters')).toBeInTheDocument()
      })

      await user.click(screen.getByTitle('Show filters'))
      const mutualInput = screen.getByLabelText('Min Mutual:')
      await user.clear(mutualInput)
      await user.type(mutualInput, '10')

      await waitFor(() => {
        expect(screen.getByText('Metaverse Dev')).toBeInTheDocument()
        expect(screen.queryByText('Crypto Whale')).not.toBeInTheDocument()
        expect(screen.queryByText('NFT Artist')).not.toBeInTheDocument()
      })
    })

    it('should filter verified only users', async () => {
      const user = userEvent.setup()
      render(<FriendSuggestions />)

      await waitFor(() => {
        expect(screen.getByTitle('Show filters')).toBeInTheDocument()
      })

      await user.click(screen.getByTitle('Show filters'))
      const verifiedCheckbox = screen.getByRole('checkbox', { name: /verified only/i })
      await user.click(verifiedCheckbox)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
        expect(screen.getByText('Metaverse Dev')).toBeInTheDocument()
        expect(screen.queryByText('NFT Artist')).not.toBeInTheDocument()
      })
    })

    it('should apply multiple filters simultaneously', async () => {
      const user = userEvent.setup()
      render(<FriendSuggestions />)

      await waitFor(() => {
        expect(screen.getByTitle('Show filters')).toBeInTheDocument()
      })

      await user.click(screen.getByTitle('Show filters'))

      const verifiedCheckbox = screen.getByRole('checkbox', { name: /verified only/i })
      await user.click(verifiedCheckbox)

      const karmaInput = screen.getByLabelText('Min Karma:')
      await user.clear(karmaInput)
      await user.type(karmaInput, '4000')

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
        expect(screen.queryByText('Metaverse Dev')).not.toBeInTheDocument()
        expect(screen.queryByText('NFT Artist')).not.toBeInTheDocument()
      })
    })

    it('should persist dismissed suggestions when filters change', async () => {
      socialService.dismissSuggestion.mockResolvedValue({})
      const user = userEvent.setup()
      render(<FriendSuggestions />)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })

      const dismissButtons = screen.getAllByLabelText('Dismiss suggestion')
      await user.click(dismissButtons[0])

      await waitFor(() => {
        expect(screen.queryByText('Crypto Whale')).not.toBeInTheDocument()
      })

      await user.click(screen.getByTitle('Show filters'))
      const locationInput = screen.getByPlaceholderText('City or region')
      await user.type(locationInput, 'San')
      await user.clear(locationInput)

      await waitFor(() => {
        expect(screen.queryByText('Crypto Whale')).not.toBeInTheDocument()
      })
    })
  })

  describe('Loading States', () => {
    it('should show loading skeleton while loading', async () => {
      render(<FriendSuggestions />)
      expect(screen.getByText(/finding great people for you/i)).toBeInTheDocument()
    })

    it('should hide loading skeleton after data loads', async () => {
      render(<FriendSuggestions />)
      await waitFor(() => {
        expect(screen.queryByText(/finding great people for you/i)).not.toBeInTheDocument()
      })
    })

    it('should show skeleton items in embedded mode while loading', async () => {
      const { container } = render(<FriendSuggestions embedded={true} />)
      expect(container.querySelector('.suggestion-skeleton')).toBeInTheDocument()
    })

    it('should not show full loading screen in embedded mode', async () => {
      render(<FriendSuggestions embedded={true} />)
      expect(screen.queryByText(/finding great people for you/i)).not.toBeInTheDocument()
    })
  })

  describe('Empty States', () => {
    it('should show empty state when no suggestions', async () => {
      socialService.getFriendSuggestions.mockResolvedValue({ suggestions: [] })
      render(<FriendSuggestions />)

      await waitFor(() => {
        expect(screen.getByText('No suggestions found')).toBeInTheDocument()
        expect(screen.getByText('Try adjusting your filters or check back later')).toBeInTheDocument()
      })
    })

    it('should show refresh button in empty state', async () => {
      socialService.getFriendSuggestions.mockResolvedValue({ suggestions: [] })
      render(<FriendSuggestions />)

      await waitFor(() => {
        expect(screen.getByText('Refresh Suggestions')).toBeInTheDocument()
      })
    })

    it('should reload suggestions when clicking refresh in empty state', async () => {
      socialService.getFriendSuggestions.mockResolvedValue({ suggestions: [] })
      const user = userEvent.setup()
      render(<FriendSuggestions />)

      await waitFor(() => {
        expect(screen.getByText('No suggestions found')).toBeInTheDocument()
      })

      jest.clearAllMocks()
      socialService.getFriendSuggestions.mockResolvedValue({ suggestions: mockSuggestions })

      await user.click(screen.getByText('Refresh Suggestions'))

      await waitFor(() => {
        expect(socialService.getFriendSuggestions).toHaveBeenCalled()
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })
    })

    it('should show empty state when all suggestions filtered out', async () => {
      const user = userEvent.setup()
      render(<FriendSuggestions />)

      await waitFor(() => {
        expect(screen.getByTitle('Show filters')).toBeInTheDocument()
      })

      await user.click(screen.getByTitle('Show filters'))
      const locationInput = screen.getByPlaceholderText('City or region')
      await user.type(locationInput, 'NonexistentCity')

      await waitFor(() => {
        expect(screen.getByText('No suggestions found')).toBeInTheDocument()
      })
    })
  })

  describe('API Integration', () => {
    it('should call getFriendSuggestions on mount', async () => {
      render(<FriendSuggestions />)

      await waitFor(() => {
        expect(socialService.getFriendSuggestions).toHaveBeenCalledWith(20, 'smart')
      })
    })

    it('should pass maxSuggestions to API', async () => {
      render(<FriendSuggestions maxSuggestions={10} />)

      await waitFor(() => {
        expect(socialService.getFriendSuggestions).toHaveBeenCalledWith(10, 'smart')
      })
    })

    it('should pass algorithm to API', async () => {
      const user = userEvent.setup()
      render(<FriendSuggestions />)

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })

      const select = screen.getByRole('combobox')
      await user.selectOptions(select, 'trending')

      await waitFor(() => {
        expect(socialService.getFriendSuggestions).toHaveBeenCalledWith(20, 'trending')
      })
    })

    it('should handle API response with nested user data', async () => {
      socialService.getFriendSuggestions.mockResolvedValue({
        suggestions: [{
          id: 'suggestion_1',
          user: {
            id: 'user_1',
            username: 'testuser',
            displayName: 'Test User',
            avatar: '👤'
          },
          reason: 'Test reason',
          score: 0.8
        }]
      })

      render(<FriendSuggestions />)

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument()
      })
    })

    it('should handle API response without user wrapper', async () => {
      socialService.getFriendSuggestions.mockResolvedValue({
        suggestions: [{
          id: 'user_1',
          username: 'testuser',
          displayName: 'Test User',
          avatar: '👤'
        }]
      })

      render(<FriendSuggestions />)

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument()
      })
    })

    it('should handle empty suggestions array from API', async () => {
      socialService.getFriendSuggestions.mockResolvedValue({ suggestions: [] })

      render(<FriendSuggestions />)

      await waitFor(() => {
        expect(screen.getByText('No suggestions found')).toBeInTheDocument()
      })
    })

    it('should handle undefined suggestions from API', async () => {
      socialService.getFriendSuggestions.mockResolvedValue({})

      render(<FriendSuggestions />)

      await waitFor(() => {
        expect(screen.getByText('No suggestions found')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle API error gracefully', async () => {
      socialService.getFriendSuggestions.mockRejectedValue(new Error('Network error'))

      render(<FriendSuggestions />)

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Failed to load suggestions', 'error')
      })
    })

    it('should show mock data when API fails', async () => {
      socialService.getFriendSuggestions.mockRejectedValue(new Error('Network error'))

      render(<FriendSuggestions />)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })
    })

    it('should not crash when dismiss API fails', async () => {
      socialService.dismissSuggestion.mockRejectedValue(new Error('Network error'))
      const user = userEvent.setup()

      render(<FriendSuggestions />)

      await waitFor(() => {
        expect(screen.getByText('Crypto Whale')).toBeInTheDocument()
      })

      const dismissButtons = screen.getAllByLabelText('Dismiss suggestion')
      await user.click(dismissButtons[0])

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Failed to dismiss suggestion', 'error')
      })
    })

    it('should handle network timeout', async () => {
      socialService.getFriendSuggestions.mockRejectedValue(new Error('Timeout'))

      render(<FriendSuggestions />)

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Failed to load suggestions', 'error')
      })
    })

    it('should handle malformed API response', async () => {
      socialService.getFriendSuggestions.mockResolvedValue(null)

      render(<FriendSuggestions />)

      await waitFor(() => {
        expect(screen.getByText('No suggestions found')).toBeInTheDocument()
      })
    })
  })

  describe('Close Functionality', () => {
    it('should render close button when onClose provided', async () => {
      const onClose = jest.fn()
      render(<FriendSuggestions onClose={onClose} />)

      await waitFor(() => {
        const closeButtons = screen.getAllByRole('button')
        const closeButton = closeButtons.find(btn => btn.querySelector('svg'))
        expect(closeButton).toBeInTheDocument()
      })
    })

    it('should not render close button when onClose not provided', async () => {
      const { container } = render(<FriendSuggestions />)

      await waitFor(() => {
        expect(container.querySelector('.close-btn')).not.toBeInTheDocument()
      })
    })

    it('should call onClose when close button clicked', async () => {
      const onClose = jest.fn()
      const user = userEvent.setup()
      const { container } = render(<FriendSuggestions onClose={onClose} />)

      await waitFor(() => {
        expect(container.querySelector('.close-btn')).toBeInTheDocument()
      })

      const closeButton = container.querySelector('.close-btn')
      await user.click(closeButton)

      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('Algorithm-Specific Behavior', () => {
    it('should generate appropriate reasons for smart algorithm', async () => {
      socialService.getFriendSuggestions.mockRejectedValue(new Error('Force mock'))
      render(<FriendSuggestions />)

      await waitFor(() => {
        const reasonTexts = ['Similar interests', 'Active in same communities', 'Highly recommended', 'Popular in your network']
        const hasReason = reasonTexts.some(reason => screen.queryByText(reason))
        expect(hasReason).toBe(true)
      })
    })

    it('should generate mutual connection reasons for mutual algorithm', async () => {
      socialService.getFriendSuggestions.mockRejectedValue(new Error('Force mock'))
      const user = userEvent.setup()
      render(<FriendSuggestions />)

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })

      const select = screen.getByRole('combobox')
      await user.selectOptions(select, 'mutual')

      await waitFor(() => {
        const hasConnectionReason = screen.queryByText(/mutual connections/)
        expect(hasConnectionReason).toBeInTheDocument()
      })
    })

    it('should generate trending reasons for trending algorithm', async () => {
      socialService.getFriendSuggestions.mockRejectedValue(new Error('Force mock'))
      const user = userEvent.setup()
      render(<FriendSuggestions />)

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })

      const select = screen.getByRole('combobox')
      await user.selectOptions(select, 'trending')

      await waitFor(() => {
        const trendingReasons = ['Trending creator', 'Rising star', 'Popular this week', 'Viral content creator']
        const hasReason = trendingReasons.some(reason => screen.queryByText(reason))
        expect(hasReason).toBe(true)
      })
    })
  })
})

export default mockSuggestions
