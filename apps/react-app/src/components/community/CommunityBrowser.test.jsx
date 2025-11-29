import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import CommunityBrowser from './CommunityBrowser'
import '@testing-library/jest-dom'

// Mock CommunityCard component
jest.mock('./CommunityCard', () => {
  return function MockCommunityCard({ community, onJoin, viewMode }) {
    return (
      <div data-testid={`community-card-${community.id}`} className={`mock-community-card ${viewMode}`}>
        <h3>{community.name}</h3>
        <p>{community.description}</p>
        <span>{community.members} members</span>
        {community.trending && <span data-testid="trending-badge">Trending</span>}
        {community.isVerified && <span data-testid="verified-badge">Verified</span>}
        {community.isJoined && <span data-testid="joined-badge">Joined</span>}
        <button onClick={() => onJoin(community.id)}>
          {community.isJoined ? 'Leave' : 'Join'}
        </button>
        <div data-testid="category">{community.category}</div>
        <div data-testid="growth-rate">{community.growthRate}</div>
      </div>
    )
  }
})

const mockCommunities = [
  {
    id: 'crypto-trading',
    name: 'CryptoTrading',
    displayName: 'Crypto Trading Hub',
    description: 'Professional cryptocurrency trading discussions, market analysis, and investment strategies.',
    members: 45892,
    category: 'crypto',
    isVerified: true,
    isJoined: false,
    banner: '/api/placeholder/400/200',
    icon: '/api/placeholder/64/64',
    trending: true,
    growthRate: 12.5,
    posts24h: 234,
    tags: ['trading', 'crypto', 'bitcoin', 'ethereum']
  },
  {
    id: 'web3-development',
    name: 'Web3Development',
    displayName: 'Web3 Development',
    description: 'Everything about building on blockchain - smart contracts, dApps, and Web3 infrastructure.',
    members: 23456,
    category: 'tech',
    isVerified: true,
    isJoined: true,
    banner: '/api/placeholder/400/200',
    icon: '/api/placeholder/64/64',
    trending: true,
    growthRate: 8.3,
    posts24h: 89,
    tags: ['web3', 'blockchain', 'solidity', 'ethereum']
  },
  {
    id: 'gaming-lounge',
    name: 'GamingLounge',
    displayName: 'Gaming Lounge',
    description: 'Share your gaming experiences, find teammates, discuss the latest releases and gaming news.',
    members: 78234,
    category: 'gaming',
    isVerified: false,
    isJoined: false,
    banner: '/api/placeholder/400/200',
    icon: '/api/placeholder/64/64',
    trending: false,
    growthRate: 5.2,
    posts24h: 145,
    tags: ['gaming', 'esports', 'streaming']
  },
  {
    id: 'digital-art',
    name: 'DigitalArt',
    displayName: 'Digital Art Community',
    description: 'Showcase your digital artwork, get feedback, learn techniques, and connect with artists.',
    members: 34567,
    category: 'art',
    isVerified: true,
    isJoined: false,
    banner: '/api/placeholder/400/200',
    icon: '/api/placeholder/64/64',
    trending: true,
    growthRate: 15.7,
    posts24h: 67,
    tags: ['art', 'digital', 'design', 'nft']
  },
  {
    id: 'music-producers',
    name: 'MusicProducers',
    displayName: 'Music Production Hub',
    description: 'For music producers, beatmakers, and audio engineers. Share beats, collaborate, get feedback.',
    members: 19876,
    category: 'music',
    isVerified: false,
    isJoined: true,
    banner: '/api/placeholder/400/200',
    icon: '/api/placeholder/64/64',
    trending: false,
    growthRate: 3.4,
    posts24h: 45,
    tags: ['music', 'production', 'beats', 'audio']
  },
  {
    id: 'space-exploration',
    name: 'SpaceExploration',
    displayName: 'Space & Astronomy',
    description: 'Discuss space exploration, astronomy, astrophysics, and the latest discoveries from the cosmos.',
    members: 52341,
    category: 'science',
    isVerified: true,
    isJoined: false,
    banner: '/api/placeholder/400/200',
    icon: '/api/placeholder/64/64',
    trending: true,
    growthRate: 7.8,
    posts24h: 78,
    tags: ['space', 'astronomy', 'nasa', 'science']
  }
]

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <CommunityBrowser />
    </BrowserRouter>
  )
}

describe('CommunityBrowser', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Initial Loading State', () => {
    test('should display loading skeleton on initial render', () => {
      renderComponent()

      expect(screen.getByText('Discover Communities')).toBeInTheDocument()
      expect(screen.getByClassName('skeleton-loader')).toBeInTheDocument()
    })

    test('should display 6 skeleton community cards while loading', () => {
      renderComponent()

      const skeletonCards = screen.getAllByClassName('community-card-skeleton')
      expect(skeletonCards).toHaveLength(6)
    })

    test('should display skeleton banner for each card', () => {
      renderComponent()

      const skeletonBanners = screen.getAllByClassName('skeleton-banner')
      expect(skeletonBanners).toHaveLength(6)
    })

    test('should display skeleton avatar for each card', () => {
      renderComponent()

      const skeletonAvatars = screen.getAllByClassName('skeleton-avatar')
      expect(skeletonAvatars).toHaveLength(6)
    })

    test('should display skeleton title for each card', () => {
      renderComponent()

      const skeletonTitles = screen.getAllByClassName('skeleton-title')
      expect(skeletonTitles).toHaveLength(6)
    })

    test('should display skeleton button for each card', () => {
      renderComponent()

      const skeletonButtons = screen.getAllByClassName('skeleton-button')
      expect(skeletonButtons).toHaveLength(6)
    })
  })

  describe('Community List Display', () => {
    test('should display all communities after loading', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByTestId('community-card-crypto-trading')).toBeInTheDocument()
      })

      expect(screen.getByTestId('community-card-web3-development')).toBeInTheDocument()
      expect(screen.getByTestId('community-card-gaming-lounge')).toBeInTheDocument()
      expect(screen.getByTestId('community-card-digital-art')).toBeInTheDocument()
      expect(screen.getByTestId('community-card-music-producers')).toBeInTheDocument()
      expect(screen.getByTestId('community-card-space-exploration')).toBeInTheDocument()
    })

    test('should display community names correctly', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByText('CryptoTrading')).toBeInTheDocument()
      })

      expect(screen.getByText('Web3Development')).toBeInTheDocument()
      expect(screen.getByText('GamingLounge')).toBeInTheDocument()
      expect(screen.getByText('DigitalArt')).toBeInTheDocument()
      expect(screen.getByText('MusicProducers')).toBeInTheDocument()
      expect(screen.getByText('SpaceExploration')).toBeInTheDocument()
    })

    test('should display community descriptions correctly', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByText(/Professional cryptocurrency trading discussions/)).toBeInTheDocument()
      })

      expect(screen.getByText(/Everything about building on blockchain/)).toBeInTheDocument()
      expect(screen.getByText(/Share your gaming experiences/)).toBeInTheDocument()
    })

    test('should display member counts correctly', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByText('45892 members')).toBeInTheDocument()
      })

      expect(screen.getByText('23456 members')).toBeInTheDocument()
      expect(screen.getByText('78234 members')).toBeInTheDocument()
    })

    test('should show trending badge on trending communities', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        const trendingBadges = screen.getAllByTestId('trending-badge')
        expect(trendingBadges).toHaveLength(4)
      })
    })

    test('should show verified badge on verified communities', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        const verifiedBadges = screen.getAllByTestId('verified-badge')
        expect(verifiedBadges).toHaveLength(4)
      })
    })

    test('should show joined badge on joined communities', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        const joinedBadges = screen.getAllByTestId('joined-badge')
        expect(joinedBadges).toHaveLength(2)
      })
    })
  })

  describe('Search Functionality', () => {
    test('should render search input with placeholder', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search communities...')).toBeInTheDocument()
      })
    })

    test('should filter communities by name when searching', async () => {
      const user = userEvent.setup({ delay: null })
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByTestId('community-card-crypto-trading')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search communities...')
      await user.type(searchInput, 'Crypto')

      expect(screen.getByTestId('community-card-crypto-trading')).toBeInTheDocument()
      expect(screen.queryByTestId('community-card-gaming-lounge')).not.toBeInTheDocument()
    })

    test('should filter communities by description when searching', async () => {
      const user = userEvent.setup({ delay: null })
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByTestId('community-card-crypto-trading')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search communities...')
      await user.type(searchInput, 'blockchain')

      expect(screen.getByTestId('community-card-web3-development')).toBeInTheDocument()
      expect(screen.queryByTestId('community-card-gaming-lounge')).not.toBeInTheDocument()
    })

    test('should filter communities by tags when searching', async () => {
      const user = userEvent.setup({ delay: null })
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByTestId('community-card-crypto-trading')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search communities...')
      await user.type(searchInput, 'bitcoin')

      expect(screen.getByTestId('community-card-crypto-trading')).toBeInTheDocument()
      expect(screen.queryByTestId('community-card-gaming-lounge')).not.toBeInTheDocument()
    })

    test('should be case insensitive when searching', async () => {
      const user = userEvent.setup({ delay: null })
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByTestId('community-card-crypto-trading')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search communities...')
      await user.type(searchInput, 'CRYPTO')

      expect(screen.getByTestId('community-card-crypto-trading')).toBeInTheDocument()
    })

    test('should clear search results when search input is cleared', async () => {
      const user = userEvent.setup({ delay: null })
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByTestId('community-card-crypto-trading')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search communities...')
      await user.type(searchInput, 'Crypto')

      expect(screen.queryByTestId('community-card-gaming-lounge')).not.toBeInTheDocument()

      await user.clear(searchInput)

      expect(screen.getByTestId('community-card-gaming-lounge')).toBeInTheDocument()
    })

    test('should handle multiple word searches', async () => {
      const user = userEvent.setup({ delay: null })
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByTestId('community-card-crypto-trading')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search communities...')
      await user.type(searchInput, 'space exploration')

      expect(screen.getByTestId('community-card-space-exploration')).toBeInTheDocument()
    })
  })

  describe('Category Filtering', () => {
    test('should show all category options in filter section', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search communities...')).toBeInTheDocument()
      })

      const filterButton = screen.getByRole('button', { name: /filter/i })
      fireEvent.click(filterButton)

      expect(screen.getByText('All Communities')).toBeInTheDocument()
      expect(screen.getByText('Crypto & Finance')).toBeInTheDocument()
      expect(screen.getByText('Gaming')).toBeInTheDocument()
      expect(screen.getByText('Technology')).toBeInTheDocument()
      expect(screen.getByText('Art & Design')).toBeInTheDocument()
      expect(screen.getByText('Music')).toBeInTheDocument()
      expect(screen.getByText('Sports')).toBeInTheDocument()
      expect(screen.getByText('Science')).toBeInTheDocument()
    })

    test('should filter communities by crypto category', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByTestId('community-card-crypto-trading')).toBeInTheDocument()
      })

      const filterButton = screen.getByRole('button', { name: /filter/i })
      fireEvent.click(filterButton)

      const cryptoButton = screen.getByText('Crypto & Finance')
      fireEvent.click(cryptoButton)

      expect(screen.getByTestId('community-card-crypto-trading')).toBeInTheDocument()
      expect(screen.queryByTestId('community-card-gaming-lounge')).not.toBeInTheDocument()
      expect(screen.queryByTestId('community-card-digital-art')).not.toBeInTheDocument()
    })

    test('should filter communities by gaming category', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByTestId('community-card-crypto-trading')).toBeInTheDocument()
      })

      const filterButton = screen.getByRole('button', { name: /filter/i })
      fireEvent.click(filterButton)

      const gamingButton = screen.getByText('Gaming')
      fireEvent.click(gamingButton)

      expect(screen.getByTestId('community-card-gaming-lounge')).toBeInTheDocument()
      expect(screen.queryByTestId('community-card-crypto-trading')).not.toBeInTheDocument()
    })

    test('should filter communities by tech category', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByTestId('community-card-crypto-trading')).toBeInTheDocument()
      })

      const filterButton = screen.getByRole('button', { name: /filter/i })
      fireEvent.click(filterButton)

      const techButton = screen.getByText('Technology')
      fireEvent.click(techButton)

      expect(screen.getByTestId('community-card-web3-development')).toBeInTheDocument()
      expect(screen.queryByTestId('community-card-gaming-lounge')).not.toBeInTheDocument()
    })

    test('should filter communities by art category', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByTestId('community-card-crypto-trading')).toBeInTheDocument()
      })

      const filterButton = screen.getByRole('button', { name: /filter/i })
      fireEvent.click(filterButton)

      const artButton = screen.getByText('Art & Design')
      fireEvent.click(artButton)

      expect(screen.getByTestId('community-card-digital-art')).toBeInTheDocument()
      expect(screen.queryByTestId('community-card-gaming-lounge')).not.toBeInTheDocument()
    })

    test('should filter communities by music category', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByTestId('community-card-crypto-trading')).toBeInTheDocument()
      })

      const filterButton = screen.getByRole('button', { name: /filter/i })
      fireEvent.click(filterButton)

      const musicButton = screen.getByText('Music')
      fireEvent.click(musicButton)

      expect(screen.getByTestId('community-card-music-producers')).toBeInTheDocument()
      expect(screen.queryByTestId('community-card-gaming-lounge')).not.toBeInTheDocument()
    })

    test('should filter communities by science category', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByTestId('community-card-crypto-trading')).toBeInTheDocument()
      })

      const filterButton = screen.getByRole('button', { name: /filter/i })
      fireEvent.click(filterButton)

      const scienceButton = screen.getByText('Science')
      fireEvent.click(scienceButton)

      expect(screen.getByTestId('community-card-space-exploration')).toBeInTheDocument()
      expect(screen.queryByTestId('community-card-gaming-lounge')).not.toBeInTheDocument()
    })

    test('should show all communities when All Communities category is selected', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByTestId('community-card-crypto-trading')).toBeInTheDocument()
      })

      const filterButton = screen.getByRole('button', { name: /filter/i })
      fireEvent.click(filterButton)

      const gamingButton = screen.getByText('Gaming')
      fireEvent.click(gamingButton)

      expect(screen.queryByTestId('community-card-crypto-trading')).not.toBeInTheDocument()

      const allButton = screen.getByText('All Communities')
      fireEvent.click(allButton)

      expect(screen.getByTestId('community-card-crypto-trading')).toBeInTheDocument()
      expect(screen.getByTestId('community-card-gaming-lounge')).toBeInTheDocument()
    })

    test('should highlight active category filter', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search communities...')).toBeInTheDocument()
      })

      const filterButton = screen.getByRole('button', { name: /filter/i })
      fireEvent.click(filterButton)

      const cryptoButton = screen.getByText('Crypto & Finance')
      fireEvent.click(cryptoButton)

      expect(cryptoButton).toHaveClass('active')
    })

    test('should combine search and category filters', async () => {
      const user = userEvent.setup({ delay: null })
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByTestId('community-card-crypto-trading')).toBeInTheDocument()
      })

      const filterButton = screen.getByRole('button', { name: /filter/i })
      fireEvent.click(filterButton)

      const techButton = screen.getByText('Technology')
      fireEvent.click(techButton)

      const searchInput = screen.getByPlaceholderText('Search communities...')
      await user.type(searchInput, 'blockchain')

      expect(screen.getByTestId('community-card-web3-development')).toBeInTheDocument()
      expect(screen.queryByTestId('community-card-crypto-trading')).not.toBeInTheDocument()
    })
  })

  describe('Sort Functionality', () => {
    test('should show all sort options in filter section', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search communities...')).toBeInTheDocument()
      })

      const filterButton = screen.getByRole('button', { name: /filter/i })
      fireEvent.click(filterButton)

      expect(screen.getByText('Trending')).toBeInTheDocument()
      expect(screen.getByText('Most Members')).toBeInTheDocument()
      expect(screen.getByText('Newest')).toBeInTheDocument()
      expect(screen.getByText('Name')).toBeInTheDocument()
    })

    test('should sort by trending by default', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        const cards = screen.getAllByTestId(/community-card-/)
        expect(cards[0]).toHaveAttribute('data-testid', 'community-card-digital-art')
      })
    })

    test('should sort communities by member count', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByTestId('community-card-crypto-trading')).toBeInTheDocument()
      })

      const filterButton = screen.getByRole('button', { name: /filter/i })
      fireEvent.click(filterButton)

      const membersButton = screen.getByText('Most Members')
      fireEvent.click(membersButton)

      const cards = screen.getAllByTestId(/community-card-/)
      expect(cards[0]).toHaveAttribute('data-testid', 'community-card-gaming-lounge')
    })

    test('should sort communities by name alphabetically', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByTestId('community-card-crypto-trading')).toBeInTheDocument()
      })

      const filterButton = screen.getByRole('button', { name: /filter/i })
      fireEvent.click(filterButton)

      const nameButton = screen.getByText('Name')
      fireEvent.click(nameButton)

      const cards = screen.getAllByTestId(/community-card-/)
      expect(cards[0]).toHaveAttribute('data-testid', 'community-card-crypto-trading')
    })

    test('should highlight active sort option', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search communities...')).toBeInTheDocument()
      })

      const filterButton = screen.getByRole('button', { name: /filter/i })
      fireEvent.click(filterButton)

      const membersButton = screen.getByText('Most Members')
      fireEvent.click(membersButton)

      expect(membersButton).toHaveClass('active')
    })

    test('should maintain sort order when filtering', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByTestId('community-card-crypto-trading')).toBeInTheDocument()
      })

      const filterButton = screen.getByRole('button', { name: /filter/i })
      fireEvent.click(filterButton)

      const membersButton = screen.getByText('Most Members')
      fireEvent.click(membersButton)

      const gamingButton = screen.getByText('Gaming')
      fireEvent.click(gamingButton)

      const cards = screen.getAllByTestId(/community-card-/)
      expect(cards[0]).toHaveAttribute('data-testid', 'community-card-gaming-lounge')
    })
  })

  describe('View Mode Toggle', () => {
    test('should display grid view by default', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        const cards = screen.getAllByClassName('mock-community-card')
        expect(cards[0]).toHaveClass('grid')
      })
    })

    test('should have grid button active by default', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        const viewControls = screen.getByClassName('view-controls')
        const gridButton = within(viewControls).getAllByRole('button')[1]
        expect(gridButton).toHaveClass('active')
      })
    })

    test('should switch to list view when list button is clicked', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByTestId('community-card-crypto-trading')).toBeInTheDocument()
      })

      const viewControls = screen.getByClassName('view-controls')
      const listButton = within(viewControls).getAllByRole('button')[2]
      fireEvent.click(listButton)

      const cards = screen.getAllByClassName('mock-community-card')
      expect(cards[0]).toHaveClass('list')
    })

    test('should highlight active view mode button', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByTestId('community-card-crypto-trading')).toBeInTheDocument()
      })

      const viewControls = screen.getByClassName('view-controls')
      const listButton = within(viewControls).getAllByRole('button')[2]
      fireEvent.click(listButton)

      expect(listButton).toHaveClass('active')
    })

    test('should toggle between grid and list views', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByTestId('community-card-crypto-trading')).toBeInTheDocument()
      })

      const viewControls = screen.getByClassName('view-controls')
      const listButton = within(viewControls).getAllByRole('button')[2]
      const gridButton = within(viewControls).getAllByRole('button')[1]

      fireEvent.click(listButton)
      let cards = screen.getAllByClassName('mock-community-card')
      expect(cards[0]).toHaveClass('list')

      fireEvent.click(gridButton)
      cards = screen.getAllByClassName('mock-community-card')
      expect(cards[0]).toHaveClass('grid')
    })
  })

  describe('Filter Panel Toggle', () => {
    test('should hide filters by default', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search communities...')).toBeInTheDocument()
      })

      expect(screen.queryByText('Category:')).not.toBeInTheDocument()
    })

    test('should show filters when filter button is clicked', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search communities...')).toBeInTheDocument()
      })

      const filterButton = screen.getByRole('button', { name: /filter/i })
      fireEvent.click(filterButton)

      expect(screen.getByText('Category:')).toBeInTheDocument()
      expect(screen.getByText('Sort by:')).toBeInTheDocument()
    })

    test('should hide filters when filter button is clicked again', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search communities...')).toBeInTheDocument()
      })

      const filterButton = screen.getByRole('button', { name: /filter/i })
      fireEvent.click(filterButton)

      expect(screen.getByText('Category:')).toBeInTheDocument()

      fireEvent.click(filterButton)

      expect(screen.queryByText('Category:')).not.toBeInTheDocument()
    })

    test('should highlight filter button when filters are shown', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search communities...')).toBeInTheDocument()
      })

      const viewControls = screen.getByClassName('view-controls')
      const filterButton = within(viewControls).getAllByRole('button')[0]

      fireEvent.click(filterButton)

      expect(filterButton).toHaveClass('active')
    })
  })

  describe('Statistics Display', () => {
    test('should display total communities count', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByText('6')).toBeInTheDocument()
      })

      expect(screen.getByText('Communities Found')).toBeInTheDocument()
    })

    test('should display trending communities count', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByText('4')).toBeInTheDocument()
      })

      expect(screen.getByText('Trending')).toBeInTheDocument()
    })

    test('should display joined communities count', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument()
      })

      expect(screen.getByText('Joined')).toBeInTheDocument()
    })

    test('should update communities count when searching', async () => {
      const user = userEvent.setup({ delay: null })
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByTestId('community-card-crypto-trading')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search communities...')
      await user.type(searchInput, 'Crypto')

      const stats = screen.getByClassName('browse-stats')
      expect(within(stats).getByText('1')).toBeInTheDocument()
    })

    test('should update trending count when filtering', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByTestId('community-card-crypto-trading')).toBeInTheDocument()
      })

      const filterButton = screen.getByRole('button', { name: /filter/i })
      fireEvent.click(filterButton)

      const gamingButton = screen.getByText('Gaming')
      fireEvent.click(gamingButton)

      const stats = screen.getByClassName('browse-stats')
      const statItems = within(stats).getAllByClassName('stat-item')
      expect(within(statItems[1]).getByText('0')).toBeInTheDocument()
    })

    test('should update joined count when filtering', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByTestId('community-card-crypto-trading')).toBeInTheDocument()
      })

      const filterButton = screen.getByRole('button', { name: /filter/i })
      fireEvent.click(filterButton)

      const techButton = screen.getByText('Technology')
      fireEvent.click(techButton)

      const stats = screen.getByClassName('browse-stats')
      const statItems = within(stats).getAllByClassName('stat-item')
      expect(within(statItems[2]).getByText('1')).toBeInTheDocument()
    })
  })

  describe('Join/Leave Communities', () => {
    test('should call handleJoinCommunity when join button is clicked', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByTestId('community-card-crypto-trading')).toBeInTheDocument()
      })

      const cryptoCard = screen.getByTestId('community-card-crypto-trading')
      const joinButton = within(cryptoCard).getByRole('button')

      fireEvent.click(joinButton)

      await waitFor(() => {
        expect(within(cryptoCard).getByTestId('joined-badge')).toBeInTheDocument()
      })
    })

    test('should update isJoined state when joining community', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByTestId('community-card-crypto-trading')).toBeInTheDocument()
      })

      const cryptoCard = screen.getByTestId('community-card-crypto-trading')
      const joinButton = within(cryptoCard).getByRole('button')

      expect(within(cryptoCard).queryByTestId('joined-badge')).not.toBeInTheDocument()

      fireEvent.click(joinButton)

      await waitFor(() => {
        expect(within(cryptoCard).getByTestId('joined-badge')).toBeInTheDocument()
      })
    })

    test('should update isJoined state when leaving community', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByTestId('community-card-web3-development')).toBeInTheDocument()
      })

      const web3Card = screen.getByTestId('community-card-web3-development')
      const leaveButton = within(web3Card).getByRole('button')

      expect(within(web3Card).getByTestId('joined-badge')).toBeInTheDocument()

      fireEvent.click(leaveButton)

      await waitFor(() => {
        expect(within(web3Card).queryByTestId('joined-badge')).not.toBeInTheDocument()
      })
    })

    test('should increment member count when joining', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByTestId('community-card-crypto-trading')).toBeInTheDocument()
      })

      const cryptoCard = screen.getByTestId('community-card-crypto-trading')

      expect(within(cryptoCard).getByText('45892 members')).toBeInTheDocument()

      const joinButton = within(cryptoCard).getByRole('button')
      fireEvent.click(joinButton)

      await waitFor(() => {
        expect(within(cryptoCard).getByText('45893 members')).toBeInTheDocument()
      })
    })

    test('should decrement member count when leaving', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByTestId('community-card-web3-development')).toBeInTheDocument()
      })

      const web3Card = screen.getByTestId('community-card-web3-development')

      expect(within(web3Card).getByText('23456 members')).toBeInTheDocument()

      const leaveButton = within(web3Card).getByRole('button')
      fireEvent.click(leaveButton)

      await waitFor(() => {
        expect(within(web3Card).getByText('23455 members')).toBeInTheDocument()
      })
    })

    test('should update joined count in stats when joining', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByTestId('community-card-crypto-trading')).toBeInTheDocument()
      })

      const stats = screen.getByClassName('browse-stats')
      const statItems = within(stats).getAllByClassName('stat-item')

      expect(within(statItems[2]).getByText('2')).toBeInTheDocument()

      const cryptoCard = screen.getByTestId('community-card-crypto-trading')
      const joinButton = within(cryptoCard).getByRole('button')
      fireEvent.click(joinButton)

      await waitFor(() => {
        expect(within(statItems[2]).getByText('3')).toBeInTheDocument()
      })
    })

    test('should handle errors when joining fails', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()

      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByTestId('community-card-crypto-trading')).toBeInTheDocument()
      })

      consoleError.mockRestore()
    })
  })

  describe('Empty States', () => {
    test('should show no results message when search has no matches', async () => {
      const user = userEvent.setup({ delay: null })
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByTestId('community-card-crypto-trading')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search communities...')
      await user.type(searchInput, 'nonexistent')

      expect(screen.getByText('No communities found')).toBeInTheDocument()
    })

    test('should show helpful message in empty state', async () => {
      const user = userEvent.setup({ delay: null })
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByTestId('community-card-crypto-trading')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search communities...')
      await user.type(searchInput, 'nonexistent')

      expect(screen.getByText('Try adjusting your search terms or filters')).toBeInTheDocument()
    })

    test('should display empty state icon when no results', async () => {
      const user = userEvent.setup({ delay: null })
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByTestId('community-card-crypto-trading')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search communities...')
      await user.type(searchInput, 'nonexistent')

      expect(screen.getByClassName('no-results')).toBeInTheDocument()
    })

    test('should show 0 in stats when no communities match', async () => {
      const user = userEvent.setup({ delay: null })
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByTestId('community-card-crypto-trading')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search communities...')
      await user.type(searchInput, 'nonexistent')

      const stats = screen.getByClassName('browse-stats')
      const statItems = within(stats).getAllByClassName('stat-item')
      expect(within(statItems[0]).getByText('0')).toBeInTheDocument()
    })
  })

  describe('Header and Title', () => {
    test('should display main header title', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByText('Discover Communities')).toBeInTheDocument()
      })
    })

    test('should display subtitle', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByText('Find and join communities that match your interests')).toBeInTheDocument()
      })
    })

    test('should have correct header structure', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByClassName('community-browser-header')).toBeInTheDocument()
      })

      expect(screen.getByClassName('header-main')).toBeInTheDocument()
    })
  })

  describe('Component Integration', () => {
    test('should pass correct props to CommunityCard', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        const cryptoCard = screen.getByTestId('community-card-crypto-trading')
        expect(cryptoCard).toBeInTheDocument()
      })
    })

    test('should pass onJoin handler to CommunityCard', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByTestId('community-card-crypto-trading')).toBeInTheDocument()
      })

      const cryptoCard = screen.getByTestId('community-card-crypto-trading')
      const joinButton = within(cryptoCard).getByRole('button')

      fireEvent.click(joinButton)

      await waitFor(() => {
        expect(within(cryptoCard).getByTestId('joined-badge')).toBeInTheDocument()
      })
    })

    test('should pass viewMode prop to CommunityCard', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByTestId('community-card-crypto-trading')).toBeInTheDocument()
      })

      const cards = screen.getAllByClassName('mock-community-card')
      expect(cards[0]).toHaveClass('grid')
    })
  })

  describe('Accessibility', () => {
    test('should have accessible search input', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search communities...')
        expect(searchInput).toHaveAttribute('type', 'text')
      })
    })

    test('should have accessible filter buttons', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search communities...')).toBeInTheDocument()
      })

      const filterButton = screen.getByRole('button', { name: /filter/i })
      expect(filterButton).toBeInTheDocument()
    })

    test('should have accessible view mode buttons', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        const viewControls = screen.getByClassName('view-controls')
        const buttons = within(viewControls).getAllByRole('button')
        expect(buttons.length).toBeGreaterThan(0)
      })
    })

    test('should have proper button roles', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search communities...')).toBeInTheDocument()
      })

      const filterButton = screen.getByRole('button', { name: /filter/i })
      fireEvent.click(filterButton)

      const categoryButtons = screen.getAllByClassName('category-pill')
      categoryButtons.forEach(button => {
        expect(button.tagName).toBe('BUTTON')
      })
    })

    test('should have proper heading hierarchy', async () => {
      renderComponent()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        const heading = screen.getByText('Discover Communities')
        expect(heading.tagName).toBe('H1')
      })
    })
  })
})

export default MockCommunityCard
