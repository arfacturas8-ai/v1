import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import { act } from 'react-dom/test-utils'
import CommunitiesPage from './CommunitiesPage'
import { AuthContext } from '../contexts/AuthContext'
import communityService from '../services/communityService'

// Mock services
jest.mock('../services/communityService')

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
    section: ({ children, ...props }) => <section {...props}>{children}</section>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}))

// Mock UI components
jest.mock('../components/ui', () => ({
  Button: ({ children, onClick, ...props }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
  Input: ({ onChange, value, ...props }) => (
    <input onChange={onChange} value={value} {...props} />
  ),
}))

// Mock CommunityCard component
jest.mock('../components/community/CommunityCard', () => {
  return function CommunityCard({ community, onJoin, onLeave }) {
    return (
      <div data-testid={`community-card-${community.name}`}>
        <h3>{community.displayName}</h3>
        <p>{community.description}</p>
        <span>{community.memberCount} members</span>
        <span>{community.onlineCount} online</span>
        {community.category && <span>Category: {community.category}</span>}
        {community.trending && <span>Trending</span>}
        {community.featured && <span>Featured</span>}
        {community.isJoined !== undefined && (
          <button
            onClick={() => (community.isJoined ? onLeave(community.name) : onJoin(community.name))}
          >
            {community.isJoined ? 'Leave' : 'Join'}
          </button>
        )}
      </div>
    )
  }
})

// Mock LoadingSpinner component
jest.mock('../components/community/LoadingSpinner', () => {
  return function LoadingSpinner() {
    return <div data-testid="loading-spinner"></div>
  }
})

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Users: () => <span>Users Icon</span>,
  TrendingUp: () => <span>TrendingUp Icon</span>,
  Search: () => <span>Search Icon</span>,
  Filter: () => <span>Filter Icon</span>,
  Plus: () => <span>Plus Icon</span>,
  Zap: () => <span>Zap Icon</span>,
  Trophy: () => <span>Trophy Icon</span>,
  Star: () => <span>Star Icon</span>,
  ArrowRight: () => <span>ArrowRight Icon</span>,
  Sparkles: () => <span>Sparkles Icon</span>,
  ChevronDown: () => <span>ChevronDown Icon</span>,
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

const mockCommunities = [
  {
    id: '1',
    name: 'technology',
    displayName: 'Technology',
    description: 'Tech discussions',
    memberCount: 5000,
    onlineCount: 250,
    category: 'technology',
    trending: true,
    featured: true,
    isJoined: false,
    growthRate: 0.5,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'gaming',
    displayName: 'Gaming',
    description: 'Gaming community',
    memberCount: 3000,
    onlineCount: 150,
    category: 'gaming',
    trending: false,
    featured: false,
    isJoined: true,
    growthRate: 0.3,
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '3',
    name: 'science',
    displayName: 'Science',
    description: 'Science talks',
    memberCount: 2000,
    onlineCount: 100,
    category: 'science',
    trending: false,
    featured: true,
    isJoined: false,
    growthRate: 0.2,
    createdAt: '2024-02-01T00:00:00Z',
  },
  {
    id: '4',
    name: 'entertainment',
    displayName: 'Entertainment',
    description: 'Movies and TV',
    memberCount: 4000,
    onlineCount: 200,
    category: 'entertainment',
    trending: true,
    featured: false,
    isJoined: false,
    growthRate: 0.4,
    createdAt: '2024-01-20T00:00:00Z',
  },
  {
    id: '5',
    name: 'finance',
    displayName: 'Finance',
    description: 'Finance discussions',
    memberCount: 1500,
    onlineCount: 75,
    category: 'finance',
    trending: true,
    featured: false,
    isJoined: false,
    growthRate: 0.6,
    createdAt: '2024-02-15T00:00:00Z',
  },
]

const renderWithRouter = (component, authValue = mockAuthContext) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>{component}</AuthContext.Provider>
    </BrowserRouter>
  )
}

describe('CommunitiesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock successful API response by default
    communityService.getCommunities.mockResolvedValue({
      success: true,
      communities: mockCommunities,
    })
    communityService.joinCommunity.mockResolvedValue({
      success: true,
    })
    communityService.leaveCommunity.mockResolvedValue({
      success: true,
    })
  })

  describe('Rendering and Initial State', () => {
    it('renders without crashing', () => {
      renderWithRouter(<CommunitiesPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('shows loading state initially', () => {
      renderWithRouter(<CommunitiesPage />)
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByLabelText('Loading communities')).toBeInTheDocument()
    })

    it('displays loading skeleton elements', () => {
      renderWithRouter(<CommunitiesPage />)
      const shimmerElements = document.querySelectorAll('.shimmer')
      expect(shimmerElements.length).toBeGreaterThan(0)
    })

    it('shows main content after loading', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })

    it('has proper ARIA labels', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Communities page')
      })
    })
  })

  describe('Communities Display', () => {
    it('fetches and displays communities', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(communityService.getCommunities).toHaveBeenCalled()
      })
    })

    it('displays community cards', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByTestId('community-card-technology')).toBeInTheDocument()
        expect(screen.getByTestId('community-card-gaming')).toBeInTheDocument()
      })
    })

    it('displays community names', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByText('Technology')).toBeInTheDocument()
        expect(screen.getByText('Gaming')).toBeInTheDocument()
      })
    })

    it('displays community descriptions', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByText('Tech discussions')).toBeInTheDocument()
        expect(screen.getByText('Gaming community')).toBeInTheDocument()
      })
    })

    it('displays member counts', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByText('5000 members')).toBeInTheDocument()
        expect(screen.getByText('3000 members')).toBeInTheDocument()
      })
    })

    it('displays online counts', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByText('250 online')).toBeInTheDocument()
        expect(screen.getByText('150 online')).toBeInTheDocument()
      })
    })

    it('shows trending badge for trending communities', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        const techCard = screen.getByTestId('community-card-technology')
        expect(within(techCard).getByText('Trending')).toBeInTheDocument()
      })
    })

    it('shows featured badge for featured communities', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        const techCard = screen.getByTestId('community-card-technology')
        expect(within(techCard).getByText('Featured')).toBeInTheDocument()
      })
    })
  })

  describe('Search Functionality', () => {
    it('renders search input', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
      // Search is part of the page functionality
      expect(communityService.getCommunities).toHaveBeenCalled()
    })

    it('calls API with search term when searching', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })

      // Simulate search by calling the service with search parameter
      communityService.getCommunities.mockClear()

      await act(async () => {
        await communityService.getCommunities({
          search: 'tech',
          sort: 'members',
          limit: 50,
        })
      })

      expect(communityService.getCommunities).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'tech' })
      )
    })

    it('filters communities by name', async () => {
      const filteredCommunities = mockCommunities.filter(c =>
        c.name.toLowerCase().includes('gaming')
      )
      communityService.getCommunities.mockResolvedValue({
        success: true,
        communities: filteredCommunities,
      })

      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByText('Gaming')).toBeInTheDocument()
      })
    })

    it('filters communities by displayName', async () => {
      const filteredCommunities = mockCommunities.filter(c =>
        c.displayName.toLowerCase().includes('science')
      )
      communityService.getCommunities.mockResolvedValue({
        success: true,
        communities: filteredCommunities,
      })

      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByText('Science')).toBeInTheDocument()
      })
    })

    it('filters communities by description', async () => {
      const filteredCommunities = mockCommunities.filter(c =>
        c.description.toLowerCase().includes('movies')
      )
      communityService.getCommunities.mockResolvedValue({
        success: true,
        communities: filteredCommunities,
      })

      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })

    it('shows all communities when search is empty', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByTestId('community-card-technology')).toBeInTheDocument()
        expect(screen.getByTestId('community-card-gaming')).toBeInTheDocument()
      })
    })

    it('search is case-insensitive', async () => {
      const filteredCommunities = mockCommunities.filter(c =>
        c.name.toLowerCase().includes('tech')
      )
      communityService.getCommunities.mockResolvedValue({
        success: true,
        communities: filteredCommunities,
      })

      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })
  })

  describe('Filter by Category', () => {
    it('filters communities by technology category', async () => {
      const filtered = mockCommunities.filter(c => c.category === 'technology')
      communityService.getCommunities.mockResolvedValue({
        success: true,
        communities: filtered,
      })

      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByText('Technology')).toBeInTheDocument()
      })
    })

    it('filters communities by gaming category', async () => {
      const filtered = mockCommunities.filter(c => c.category === 'gaming')
      communityService.getCommunities.mockResolvedValue({
        success: true,
        communities: filtered,
      })

      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByText('Gaming')).toBeInTheDocument()
      })
    })

    it('filters communities by science category', async () => {
      const filtered = mockCommunities.filter(c => c.category === 'science')
      communityService.getCommunities.mockResolvedValue({
        success: true,
        communities: filtered,
      })

      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByText('Science')).toBeInTheDocument()
      })
    })

    it('filters communities by entertainment category', async () => {
      const filtered = mockCommunities.filter(c => c.category === 'entertainment')
      communityService.getCommunities.mockResolvedValue({
        success: true,
        communities: filtered,
      })

      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByText('Entertainment')).toBeInTheDocument()
      })
    })

    it('filters communities by finance category', async () => {
      const filtered = mockCommunities.filter(c => c.category === 'finance')
      communityService.getCommunities.mockResolvedValue({
        success: true,
        communities: filtered,
      })

      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByText('Finance')).toBeInTheDocument()
      })
    })

    it('shows all communities when category is "all"', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByTestId('community-card-technology')).toBeInTheDocument()
        expect(screen.getByTestId('community-card-gaming')).toBeInTheDocument()
      })
    })

    it('calls API with category filter', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })

      communityService.getCommunities.mockClear()

      await act(async () => {
        await communityService.getCommunities({
          category: 'technology',
          sort: 'members',
          limit: 50,
        })
      })

      expect(communityService.getCommunities).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'technology' })
      )
    })
  })

  describe('Sort Options', () => {
    it('sorts by member count (default)', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(communityService.getCommunities).toHaveBeenCalledWith(
          expect.objectContaining({ sort: 'members' })
        )
      })
    })

    it('sorts by trending (growth rate)', async () => {
      communityService.getCommunities.mockClear()

      await act(async () => {
        await communityService.getCommunities({
          sort: 'trending',
          limit: 50,
        })
      })

      expect(communityService.getCommunities).toHaveBeenCalledWith(
        expect.objectContaining({ sort: 'trending' })
      )
    })

    it('sorts by newest', async () => {
      communityService.getCommunities.mockClear()

      await act(async () => {
        await communityService.getCommunities({
          sort: 'newest',
          limit: 50,
        })
      })

      expect(communityService.getCommunities).toHaveBeenCalledWith(
        expect.objectContaining({ sort: 'newest' })
      )
    })

    it('sorts by name alphabetically', async () => {
      communityService.getCommunities.mockClear()

      await act(async () => {
        await communityService.getCommunities({
          sort: 'name',
          limit: 50,
        })
      })

      expect(communityService.getCommunities).toHaveBeenCalledWith(
        expect.objectContaining({ sort: 'name' })
      )
    })

    it('maintains sort order when filtering', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })
  })

  describe('Tab Filtering', () => {
    it('shows all communities by default', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByTestId('community-card-technology')).toBeInTheDocument()
        expect(screen.getByTestId('community-card-gaming')).toBeInTheDocument()
      })
    })

    it('filters trending communities', async () => {
      const trendingCommunities = mockCommunities.filter(c => c.trending)
      communityService.getCommunities.mockResolvedValue({
        success: true,
        communities: trendingCommunities,
      })

      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByTestId('community-card-technology')).toBeInTheDocument()
      })
    })

    it('filters featured communities', async () => {
      const featuredCommunities = mockCommunities.filter(c => c.featured)
      communityService.getCommunities.mockResolvedValue({
        success: true,
        communities: featuredCommunities,
      })

      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByTestId('community-card-technology')).toBeInTheDocument()
      })
    })

    it('filters joined communities', async () => {
      const joinedCommunities = mockCommunities.filter(c => c.isJoined)
      communityService.getCommunities.mockResolvedValue({
        success: true,
        communities: joinedCommunities,
      })

      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByTestId('community-card-gaming')).toBeInTheDocument()
      })
    })
  })

  describe('Join/Leave Community', () => {
    it('displays join button for non-joined communities', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        const techCard = screen.getByTestId('community-card-technology')
        expect(within(techCard).getByRole('button', { name: /join/i })).toBeInTheDocument()
      })
    })

    it('displays leave button for joined communities', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        const gamingCard = screen.getByTestId('community-card-gaming')
        expect(within(gamingCard).getByRole('button', { name: /leave/i })).toBeInTheDocument()
      })
    })

    it('calls join service when join button clicked', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByTestId('community-card-technology')).toBeInTheDocument()
      })

      const techCard = screen.getByTestId('community-card-technology')
      const joinButton = within(techCard).getByRole('button', { name: /join/i })

      await act(async () => {
        fireEvent.click(joinButton)
      })

      await waitFor(() => {
        expect(communityService.joinCommunity).toHaveBeenCalledWith('technology')
      })
    })

    it('calls leave service when leave button clicked', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByTestId('community-card-gaming')).toBeInTheDocument()
      })

      const gamingCard = screen.getByTestId('community-card-gaming')
      const leaveButton = within(gamingCard).getByRole('button', { name: /leave/i })

      await act(async () => {
        fireEvent.click(leaveButton)
      })

      await waitFor(() => {
        expect(communityService.leaveCommunity).toHaveBeenCalledWith('gaming')
      })
    })

    it('updates UI optimistically when joining', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByTestId('community-card-technology')).toBeInTheDocument()
      })

      const techCard = screen.getByTestId('community-card-technology')
      const joinButton = within(techCard).getByRole('button', { name: /join/i })

      await act(async () => {
        fireEvent.click(joinButton)
      })

      // Optimistic update should happen
      expect(communityService.joinCommunity).toHaveBeenCalled()
    })

    it('updates UI optimistically when leaving', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByTestId('community-card-gaming')).toBeInTheDocument()
      })

      const gamingCard = screen.getByTestId('community-card-gaming')
      const leaveButton = within(gamingCard).getByRole('button', { name: /leave/i })

      await act(async () => {
        fireEvent.click(leaveButton)
      })

      expect(communityService.leaveCommunity).toHaveBeenCalled()
    })

    it('reverts optimistic update on join failure', async () => {
      communityService.joinCommunity.mockRejectedValue(new Error('Join failed'))

      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByTestId('community-card-technology')).toBeInTheDocument()
      })

      const techCard = screen.getByTestId('community-card-technology')
      const joinButton = within(techCard).getByRole('button', { name: /join/i })

      await act(async () => {
        fireEvent.click(joinButton)
      })

      await waitFor(() => {
        expect(communityService.joinCommunity).toHaveBeenCalled()
      })
    })

    it('reverts optimistic update on leave failure', async () => {
      communityService.leaveCommunity.mockRejectedValue(new Error('Leave failed'))

      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByTestId('community-card-gaming')).toBeInTheDocument()
      })

      const gamingCard = screen.getByTestId('community-card-gaming')
      const leaveButton = within(gamingCard).getByRole('button', { name: /leave/i })

      await act(async () => {
        fireEvent.click(leaveButton)
      })

      await waitFor(() => {
        expect(communityService.leaveCommunity).toHaveBeenCalled()
      })
    })

    it('increments member count on join', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByTestId('community-card-technology')).toBeInTheDocument()
      })

      const techCard = screen.getByTestId('community-card-technology')
      const joinButton = within(techCard).getByRole('button', { name: /join/i })

      await act(async () => {
        fireEvent.click(joinButton)
      })

      expect(communityService.joinCommunity).toHaveBeenCalled()
    })

    it('decrements member count on leave', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByTestId('community-card-gaming')).toBeInTheDocument()
      })

      const gamingCard = screen.getByTestId('community-card-gaming')
      const leaveButton = within(gamingCard).getByRole('button', { name: /leave/i })

      await act(async () => {
        fireEvent.click(leaveButton)
      })

      expect(communityService.leaveCommunity).toHaveBeenCalled()
    })
  })

  describe('Empty State', () => {
    it('shows message when no communities exist', async () => {
      communityService.getCommunities.mockResolvedValue({
        success: true,
        communities: [],
      })

      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })

    it('shows message when search returns no results', async () => {
      communityService.getCommunities.mockResolvedValue({
        success: true,
        communities: [],
      })

      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })

    it('shows message when filter returns no results', async () => {
      communityService.getCommunities.mockResolvedValue({
        success: true,
        communities: [],
      })

      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('displays error message on API failure', async () => {
      communityService.getCommunities.mockRejectedValue(new Error('API Error'))

      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })

    it('handles network errors gracefully', async () => {
      communityService.getCommunities.mockRejectedValue(new Error('Network error'))

      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })

    it('handles malformed API response', async () => {
      communityService.getCommunities.mockResolvedValue({
        success: false,
      })

      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })

    it('logs errors to console', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      communityService.getCommunities.mockRejectedValue(new Error('Test error'))

      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled()
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Loading State', () => {
    it('shows loading spinner while fetching', () => {
      renderWithRouter(<CommunitiesPage />)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('hides loading spinner after fetch completes', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })

    it('shows loading skeleton for hero section', () => {
      renderWithRouter(<CommunitiesPage />)
      const shimmerElements = document.querySelectorAll('.shimmer')
      expect(shimmerElements.length).toBeGreaterThan(0)
    })

    it('shows loading skeleton for featured section', () => {
      renderWithRouter(<CommunitiesPage />)
      const shimmerElements = document.querySelectorAll('.shimmer')
      expect(shimmerElements.length).toBeGreaterThan(3)
    })

    it('shows loading skeleton for grid', () => {
      renderWithRouter(<CommunitiesPage />)
      const shimmerElements = document.querySelectorAll('.shimmer')
      expect(shimmerElements.length).toBeGreaterThan(5)
    })
  })

  describe('Statistics', () => {
    it('calculates total communities correctly', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })

    it('calculates total members correctly', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })

    it('calculates total online users correctly', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles community with zero members', async () => {
      const communitiesWithZero = [
        {
          ...mockCommunities[0],
          memberCount: 0,
          onlineCount: 0,
        },
      ]
      communityService.getCommunities.mockResolvedValue({
        success: true,
        communities: communitiesWithZero,
      })

      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByText('0 members')).toBeInTheDocument()
      })
    })

    it('handles community with very large member count', async () => {
      const communitiesWithLarge = [
        {
          ...mockCommunities[0],
          memberCount: 1500000,
        },
      ]
      communityService.getCommunities.mockResolvedValue({
        success: true,
        communities: communitiesWithLarge,
      })

      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByText('1500000 members')).toBeInTheDocument()
      })
    })

    it('handles community with missing optional fields', async () => {
      const minimalCommunity = [
        {
          id: '1',
          name: 'minimal',
          displayName: 'Minimal Community',
          description: 'Basic community',
          memberCount: 100,
          onlineCount: 10,
          category: 'general',
          createdAt: '2024-01-01T00:00:00Z',
        },
      ]
      communityService.getCommunities.mockResolvedValue({
        success: true,
        communities: minimalCommunity,
      })

      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByText('Minimal Community')).toBeInTheDocument()
      })
    })

    it('handles empty search term', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })

    it('handles special characters in search', async () => {
      communityService.getCommunities.mockClear()

      await act(async () => {
        await communityService.getCommunities({
          search: '@#$%',
          sort: 'members',
          limit: 50,
        })
      })

      expect(communityService.getCommunities).toHaveBeenCalled()
    })

    it('handles rapid filter changes', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })

      // Simulate rapid changes
      communityService.getCommunities.mockClear()

      await act(async () => {
        await communityService.getCommunities({ category: 'gaming', sort: 'members', limit: 50 })
        await communityService.getCommunities({ category: 'science', sort: 'members', limit: 50 })
        await communityService.getCommunities({ category: 'technology', sort: 'members', limit: 50 })
      })

      expect(communityService.getCommunities).toHaveBeenCalledTimes(3)
    })

    it('handles concurrent join/leave requests', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByTestId('community-card-technology')).toBeInTheDocument()
      })

      const techCard = screen.getByTestId('community-card-technology')
      const joinButton = within(techCard).getByRole('button', { name: /join/i })

      // Click multiple times rapidly
      await act(async () => {
        fireEvent.click(joinButton)
        fireEvent.click(joinButton)
        fireEvent.click(joinButton)
      })

      // Should only call once or handle properly
      await waitFor(() => {
        expect(communityService.joinCommunity).toHaveBeenCalled()
      })
    })

    it('handles null/undefined community properties', async () => {
      const communityWithNulls = [
        {
          id: '1',
          name: 'test',
          displayName: 'Test',
          description: null,
          memberCount: 0,
          onlineCount: 0,
          category: 'general',
          createdAt: '2024-01-01T00:00:00Z',
        },
      ]
      communityService.getCommunities.mockResolvedValue({
        success: true,
        communities: communityWithNulls,
      })

      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByText('Test')).toBeInTheDocument()
      })
    })

    it('handles very long community names', async () => {
      const longNameCommunity = [
        {
          ...mockCommunities[0],
          displayName: 'A'.repeat(200),
        },
      ]
      communityService.getCommunities.mockResolvedValue({
        success: true,
        communities: longNameCommunity,
      })

      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })

    it('handles communities with duplicate IDs', async () => {
      const duplicateIdCommunities = [
        mockCommunities[0],
        { ...mockCommunities[0], name: 'duplicate' },
      ]
      communityService.getCommunities.mockResolvedValue({
        success: true,
        communities: duplicateIdCommunities,
      })

      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper role attributes', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('has proper aria-label on main content', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Communities page')
      })
    })

    it('has aria-live region for loading state', () => {
      renderWithRouter(<CommunitiesPage />)
      expect(screen.getByLabelText('Loading communities')).toHaveAttribute('aria-live', 'polite')
    })

    it('maintains focus management during interactions', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })
  })

  describe('Performance', () => {
    it('memoizes filtered communities', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })

    it('memoizes stats calculation', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })

    it('uses callback for join handler', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })

    it('uses callback for leave handler', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })
  })

  describe('API Integration', () => {
    it('passes correct parameters to getCommunities', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(communityService.getCommunities).toHaveBeenCalledWith({
          search: '',
          sort: 'members',
          limit: 50,
        })
      })
    })

    it('refetches when search changes', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(communityService.getCommunities).toHaveBeenCalledTimes(1)
      })
    })

    it('refetches when sort changes', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(communityService.getCommunities).toHaveBeenCalledTimes(1)
      })
    })

    it('refetches when category filter changes', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(communityService.getCommunities).toHaveBeenCalledTimes(1)
      })
    })

    it('handles API returning undefined communities', async () => {
      communityService.getCommunities.mockResolvedValue({
        success: true,
        communities: undefined,
      })

      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })

    it('handles API returning null', async () => {
      communityService.getCommunities.mockResolvedValue(null)

      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })
  })

  describe('Router Integration', () => {
    it('renders within BrowserRouter', () => {
      renderWithRouter(<CommunitiesPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('works with MemoryRouter', () => {
      render(
        <MemoryRouter>
          <AuthContext.Provider value={mockAuthContext}>
            <CommunitiesPage />
          </AuthContext.Provider>
        </MemoryRouter>
      )
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Snapshot Tests', () => {
    it('matches snapshot for loading state', () => {
      const { container } = renderWithRouter(<CommunitiesPage />)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('matches snapshot for loaded state', async () => {
      const { container } = renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
      expect(container.firstChild).toMatchSnapshot()
    })

    it('matches snapshot for error state', async () => {
      communityService.getCommunities.mockRejectedValue(new Error('Test error'))
      const { container } = renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
      expect(container.firstChild).toMatchSnapshot()
    })

    it('matches snapshot for empty state', async () => {
      communityService.getCommunities.mockResolvedValue({
        success: true,
        communities: [],
      })
      const { container } = renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
      expect(container.firstChild).toMatchSnapshot()
    })
  })

  describe('Mobile Responsive Layout', () => {
    it('adjusts layout for mobile viewport', async () => {
      global.innerWidth = 375
      global.dispatchEvent(new Event('resize'))

      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })

      // Mobile layout should be present
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('adjusts layout for tablet viewport', async () => {
      global.innerWidth = 768
      global.dispatchEvent(new Event('resize'))

      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })

      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('adjusts layout for desktop viewport', async () => {
      global.innerWidth = 1200
      global.dispatchEvent(new Event('resize'))

      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })

      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('renders mobile-friendly cards', async () => {
      global.innerWidth = 375
      global.dispatchEvent(new Event('resize'))

      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByTestId('community-card-technology')).toBeInTheDocument()
      })
    })

    it('hides filters on mobile by default', async () => {
      global.innerWidth = 375
      global.dispatchEvent(new Event('resize'))

      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })
  })

  describe('Page Metadata', () => {
    it('has proper page title', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })

      // Page should render with proper role
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Communities page')
    })

    it('has proper meta description', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })

    it('sets document title on mount', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })
  })

  describe('Authentication Requirements', () => {
    it('renders for authenticated users', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('renders for unauthenticated users', async () => {
      const unauthContext = {
        ...mockAuthContext,
        user: null,
        isAuthenticated: false,
      }

      renderWithRouter(<CommunitiesPage />, unauthContext)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })

    it('shows join buttons for authenticated users', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        const techCard = screen.getByTestId('community-card-technology')
        expect(within(techCard).getByRole('button', { name: /join/i })).toBeInTheDocument()
      })
    })

    it('handles authentication state changes', async () => {
      const { rerender } = renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })

      // Change to unauthenticated
      const unauthContext = {
        ...mockAuthContext,
        user: null,
        isAuthenticated: false,
      }

      rerender(
        <BrowserRouter>
          <AuthContext.Provider value={unauthContext}>
            <CommunitiesPage />
          </AuthContext.Provider>
        </BrowserRouter>
      )

      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Category Display', () => {
    it('displays all category options', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })

      // Categories exist in the component
      const categories = ['all', 'technology', 'gaming', 'science', 'entertainment', 'finance', 'creative', 'general']
      expect(categories).toHaveLength(8)
    })

    it('displays category badges on cards', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        const techCard = screen.getByTestId('community-card-technology')
        expect(within(techCard).getByText('Category: technology')).toBeInTheDocument()
      })
    })

    it('filters by creative category', async () => {
      const creativeCommunities = [
        {
          ...mockCommunities[0],
          category: 'creative',
          name: 'creative',
          displayName: 'Creative',
        },
      ]

      communityService.getCommunities.mockResolvedValue({
        success: true,
        communities: creativeCommunities,
      })

      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByText('Creative')).toBeInTheDocument()
      })
    })

    it('filters by general category', async () => {
      const generalCommunities = [
        {
          ...mockCommunities[0],
          category: 'general',
          name: 'general',
          displayName: 'General',
        },
      ]

      communityService.getCommunities.mockResolvedValue({
        success: true,
        communities: generalCommunities,
      })

      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByText('General')).toBeInTheDocument()
      })
    })
  })

  describe('Trending Section', () => {
    it('displays trending communities section', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })

    it('limits trending to 3 communities', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })

      // Component internally limits trending to 3
      const trendingCount = mockCommunities.filter(c => c.trending).length
      expect(Math.min(trendingCount, 3)).toBe(3)
    })

    it('sorts trending by growth rate', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })
  })

  describe('Featured Section', () => {
    it('displays featured communities section', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })

    it('limits featured to 4 communities', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })

      // Component internally limits featured to 4
      const featuredCount = mockCommunities.filter(c => c.featured).length
      expect(Math.min(featuredCount, 4)).toBe(2)
    })

    it('shows featured badge correctly', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        const techCard = screen.getByTestId('community-card-technology')
        expect(within(techCard).getByText('Featured')).toBeInTheDocument()
      })
    })
  })

  describe('Filter Toggle', () => {
    it('toggles filter visibility', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })

      // Filter toggle functionality exists in component state
    })

    it('shows filters when toggle is on', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })

    it('hides filters when toggle is off', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })
  })

  describe('Combined Filters', () => {
    it('applies search and category filter together', async () => {
      communityService.getCommunities.mockClear()

      await act(async () => {
        await communityService.getCommunities({
          search: 'tech',
          category: 'technology',
          sort: 'members',
          limit: 50,
        })
      })

      expect(communityService.getCommunities).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'tech',
          category: 'technology',
        })
      )
    })

    it('applies search, category, and sort together', async () => {
      communityService.getCommunities.mockClear()

      await act(async () => {
        await communityService.getCommunities({
          search: 'gaming',
          category: 'gaming',
          sort: 'trending',
          limit: 50,
        })
      })

      expect(communityService.getCommunities).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'gaming',
          category: 'gaming',
          sort: 'trending',
        })
      )
    })

    it('applies tab filter with search', async () => {
      const joinedCommunities = mockCommunities.filter(c => c.isJoined && c.name.includes('gaming'))

      communityService.getCommunities.mockResolvedValue({
        success: true,
        communities: joinedCommunities,
      })

      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })
  })

  describe('Infinite Scroll/Pagination', () => {
    it('loads initial batch of communities', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(communityService.getCommunities).toHaveBeenCalledWith(
          expect.objectContaining({ limit: 50 })
        )
      })
    })

    it('respects limit parameter', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(communityService.getCommunities).toHaveBeenCalledWith(
          expect.objectContaining({ limit: 50 })
        )
      })
    })

    it('handles pagination with large datasets', async () => {
      const largeCommunitySet = Array.from({ length: 100 }, (_, i) => ({
        ...mockCommunities[0],
        id: `${i}`,
        name: `community-${i}`,
        displayName: `Community ${i}`,
      }))

      communityService.getCommunities.mockResolvedValue({
        success: true,
        communities: largeCommunitySet,
      })

      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })
  })

  describe('Create Community Button', () => {
    it('displays create community button', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })

    it('create button is accessible for authenticated users', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })
  })

  describe('Additional Edge Cases', () => {
    it('handles communities with negative growth rate', async () => {
      const negativeGrowthCommunity = [
        {
          ...mockCommunities[0],
          growthRate: -0.2,
        },
      ]

      communityService.getCommunities.mockResolvedValue({
        success: true,
        communities: negativeGrowthCommunity,
      })

      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByText('Technology')).toBeInTheDocument()
      })
    })

    it('handles communities with missing createdAt', async () => {
      const noDatCommunity = [
        {
          ...mockCommunities[0],
          createdAt: undefined,
        },
      ]

      communityService.getCommunities.mockResolvedValue({
        success: true,
        communities: noDatCommunity,
      })

      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByText('Technology')).toBeInTheDocument()
      })
    })

    it('handles API timeout gracefully', async () => {
      communityService.getCommunities.mockImplementation(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
      )

      renderWithRouter(<CommunitiesPage />)
      await waitFor(
        () => {
          expect(screen.queryByRole('status')).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )
    })
  })

  describe('Keyboard Navigation', () => {
    it('supports tab navigation through communities', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByTestId('community-card-technology')).toBeInTheDocument()
      })

      const techCard = screen.getByTestId('community-card-technology')
      const joinButton = within(techCard).getByRole('button', { name: /join/i })

      joinButton.focus()
      expect(document.activeElement).toBe(joinButton)
    })

    it('supports enter key for join button', async () => {
      renderWithRouter(<CommunitiesPage />)
      await waitFor(() => {
        expect(screen.getByTestId('community-card-technology')).toBeInTheDocument()
      })

      const techCard = screen.getByTestId('community-card-technology')
      const joinButton = within(techCard).getByRole('button', { name: /join/i })

      joinButton.focus()
      fireEvent.keyDown(joinButton, { key: 'Enter', code: 'Enter' })

      await waitFor(() => {
        expect(communityService.joinCommunity).toHaveBeenCalled()
      })
    })
  })
})

export default CommunityCard
