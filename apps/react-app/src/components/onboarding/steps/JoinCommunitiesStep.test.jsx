import React from 'react'
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import JoinCommunitiesStep from './JoinCommunitiesStep'

global.fetch = jest.fn()

const mockCommunities = [
  { id: 1, name: 'Welcome & General', description: 'General discussions and introductions', members: 15420, category: 'General', isDefault: true },
  { id: 2, name: 'Tech & Innovation', description: 'Latest in technology and innovation', members: 8930, category: 'Technology' },
  { id: 3, name: 'Crypto & Web3', description: 'Cryptocurrency and blockchain discussions', members: 12340, category: 'Crypto' },
  { id: 4, name: 'Gaming Hub', description: 'All things gaming and esports', members: 7650, category: 'Gaming' },
  { id: 5, name: 'Art & Creativity', description: 'Share and discuss art, music, and creative works', members: 5430, category: 'Art' },
  { id: 6, name: 'Startup Corner', description: 'Entrepreneurs and startup discussions', members: 4320, category: 'Business' },
  { id: 7, name: 'Learning & Education', description: 'Share knowledge and learn together', members: 6780, category: 'Education' },
  { id: 8, name: 'Fitness & Health', description: 'Health, fitness, and wellness community', members: 3450, category: 'Health' },
  { id: 9, name: 'Travel & Culture', description: 'Share travel experiences and cultural insights', members: 2890, category: 'Travel' },
  { id: 10, name: 'Food & Cooking', description: 'Recipes, cooking tips, and food discussions', members: 4100, category: 'Food' },
  { id: 11, name: 'Books & Literature', description: 'Book recommendations and literary discussions', members: 2340, category: 'Books' },
  { id: 12, name: 'Music & Audio', description: 'Music sharing and audio discussions', members: 5670, category: 'Music' }
]

describe('JoinCommunitiesStep', () => {
  let onComplete
  let onSkip

  beforeEach(() => {
    onComplete = jest.fn()
    onSkip = jest.fn()
    jest.clearAllMocks()
    global.fetch.mockClear()
    localStorage.clear()
    localStorage.setItem('token', 'test-token')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Initial Rendering', () => {
    test('should display loading state initially', () => {
      global.fetch.mockImplementation(() => new Promise(() => {}))
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      expect(screen.getByText(/loading communities/i)).toBeInTheDocument()
      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument()
    })

    test('should show loading spinner with correct styling', () => {
      global.fetch.mockImplementation(() => new Promise(() => {}))
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      const spinner = screen.getByRole('status', { hidden: true })
      expect(spinner).toHaveClass('animate-spin', 'rounded-full', 'h-12', 'w-12', 'border-b-2', 'border-blue-600')
    })

    test('should render main heading after loading', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ communities: mockCommunities })
      })

      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Join Communities')).toBeInTheDocument()
      })
    })

    test('should render description text after loading', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ communities: mockCommunities })
      })

      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText(/discover communities that match your interests/i)).toBeInTheDocument()
      })
    })

    test('should render Popular Communities header', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ communities: mockCommunities })
      })

      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Popular Communities')).toBeInTheDocument()
      })
    })

    test('should show "0 selected" initially', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ communities: mockCommunities })
      })

      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('0 selected')).toBeInTheDocument()
      })
    })

    test('should render Community Tips section', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ communities: mockCommunities })
      })

      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText(/community tips/i)).toBeInTheDocument()
      })
    })

    test('should render all four community tips', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ communities: mockCommunities })
      })

      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText(/start by introducing yourself/i)).toBeInTheDocument()
        expect(screen.getByText(/read community rules/i)).toBeInTheDocument()
        expect(screen.getByText(/use voice chat/i)).toBeInTheDocument()
        expect(screen.getByText(/join communities that match/i)).toBeInTheDocument()
      })
    })

    test('should render Skip button', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ communities: mockCommunities })
      })

      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /skip for now/i })).toBeInTheDocument()
      })
    })

    test('should render Continue button initially', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ communities: mockCommunities })
      })

      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^continue$/i })).toBeInTheDocument()
      })
    })
  })

  describe('API Integration', () => {
    test('should fetch communities on mount with correct parameters', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ communities: mockCommunities })
      })

      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/communities?featured=true&limit=12')
      })
    })

    test('should fetch communities only once on mount', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ communities: mockCommunities })
      })

      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1)
      })
    })

    test('should handle successful API response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ communities: mockCommunities })
      })

      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Welcome & General')).toBeInTheDocument()
      })
    })

    test('should handle empty communities array from API', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ communities: [] })
      })

      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.queryByText('Welcome & General')).not.toBeInTheDocument()
      })
    })

    test('should use fallback data when API response is not ok', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false
      })

      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Welcome & General')).toBeInTheDocument()
      })
    })

    test('should use fallback data when API call fails', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Welcome & General')).toBeInTheDocument()
      })
    })

    test('should handle null communities in API response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ communities: null })
      })

      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.queryByText('Welcome & General')).not.toBeInTheDocument()
      })
    })

    test('should handle missing communities field in API response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      })

      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.queryByText('Welcome & General')).not.toBeInTheDocument()
      })
    })

    test('should stop loading after successful API call', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ communities: mockCommunities })
      })

      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.queryByText(/loading communities/i)).not.toBeInTheDocument()
      })
    })

    test('should stop loading after failed API call', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.queryByText(/loading communities/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Community List Rendering', () => {
    beforeEach(() => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ communities: mockCommunities })
      })
    })

    test('should render all 12 communities', async () => {
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        mockCommunities.forEach(community => {
          expect(screen.getByText(community.name)).toBeInTheDocument()
        })
      })
    })

    test('should render community names correctly', async () => {
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Tech & Innovation')).toBeInTheDocument()
        expect(screen.getByText('Crypto & Web3')).toBeInTheDocument()
        expect(screen.getByText('Gaming Hub')).toBeInTheDocument()
      })
    })

    test('should render community descriptions', async () => {
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('General discussions and introductions')).toBeInTheDocument()
        expect(screen.getByText('Latest in technology and innovation')).toBeInTheDocument()
      })
    })

    test('should render community member counts', async () => {
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('15,420 members')).toBeInTheDocument()
        expect(screen.getByText('8,930 members')).toBeInTheDocument()
      })
    })

    test('should format member counts with commas', async () => {
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        const memberCounts = screen.getAllByText(/\d{1,2},\d{3} members/)
        expect(memberCounts.length).toBeGreaterThan(0)
      })
    })

    test('should render community categories', async () => {
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('General')).toBeInTheDocument()
        expect(screen.getByText('Technology')).toBeInTheDocument()
        expect(screen.getByText('Crypto')).toBeInTheDocument()
      })
    })

    test('should show Recommended badge for default communities', async () => {
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Recommended')).toBeInTheDocument()
      })
    })

    test('should only show Recommended badge for communities with isDefault true', async () => {
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        const recommendedBadges = screen.getAllByText('Recommended')
        expect(recommendedBadges).toHaveLength(1)
      })
    })

    test('should render checkboxes for all communities', async () => {
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('generic').filter(el =>
          el.className.includes('rounded-full') && el.className.includes('border-2')
        )
        expect(checkboxes.length).toBeGreaterThan(0)
      })
    })

    test('should render communities in a grid layout', async () => {
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        const grid = screen.getByText('Welcome & General').closest('.grid')
        expect(grid).toHaveClass('md:grid-cols-2', 'lg:grid-cols-3', 'gap-4')
      })
    })
  })

  describe('Category Icons', () => {
    beforeEach(() => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ communities: mockCommunities })
      })
    })

    test('should render icon for General category', async () => {
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        const generalCommunity = screen.getByText('Welcome & General')
        const communityCard = generalCommunity.closest('div[class*="border-2"]')
        expect(communityCard.textContent).toContain('💬')
      })
    })

    test('should render icon for Technology category', async () => {
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        const techCommunity = screen.getByText('Tech & Innovation')
        const communityCard = techCommunity.closest('div[class*="border-2"]')
        expect(communityCard.textContent).toContain('💻')
      })
    })

    test('should render icon for Crypto category', async () => {
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        const cryptoCommunity = screen.getByText('Crypto & Web3')
        const communityCard = cryptoCommunity.closest('div[class*="border-2"]')
        expect(communityCard.textContent).toContain('💰')
      })
    })

    test('should render icon for Gaming category', async () => {
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        const gamingCommunity = screen.getByText('Gaming Hub')
        const communityCard = gamingCommunity.closest('div[class*="border-2"]')
        expect(communityCard.textContent).toContain('🎮')
      })
    })

    test('should render icons for all categories', async () => {
      const categoriesWithIcons = [
        { category: 'General', icon: '💬' },
        { category: 'Technology', icon: '💻' },
        { category: 'Crypto', icon: '💰' },
        { category: 'Gaming', icon: '🎮' },
        { category: 'Art', icon: '🎨' },
        { category: 'Business', icon: '💼' },
        { category: 'Education', icon: '📚' },
        { category: 'Health', icon: '💪' },
        { category: 'Travel', icon: '✈️' },
        { category: 'Food', icon: '🍳' },
        { category: 'Books', icon: '📖' },
        { category: 'Music', icon: '🎵' }
      ]

      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        categoriesWithIcons.forEach(({ icon }) => {
          expect(screen.getByText(icon, { exact: false })).toBeInTheDocument()
        })
      })
    })
  })

  describe('Community Selection', () => {
    beforeEach(() => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ communities: mockCommunities })
      })
    })

    test('should select community when clicked', async () => {
      const user = userEvent.setup()
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Welcome & General')).toBeInTheDocument()
      })

      const communityCard = screen.getByText('Welcome & General').closest('div[class*="border-2"]')
      await user.click(communityCard)

      expect(screen.getByText('1 selected')).toBeInTheDocument()
    })

    test('should update selected count after selection', async () => {
      const user = userEvent.setup()
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Tech & Innovation')).toBeInTheDocument()
      })

      const techCard = screen.getByText('Tech & Innovation').closest('div[class*="border-2"]')
      await user.click(techCard)

      expect(screen.getByText('1 selected')).toBeInTheDocument()
    })

    test('should deselect community when clicked again', async () => {
      const user = userEvent.setup()
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Gaming Hub')).toBeInTheDocument()
      })

      const gamingCard = screen.getByText('Gaming Hub').closest('div[class*="border-2"]')
      await user.click(gamingCard)
      expect(screen.getByText('1 selected')).toBeInTheDocument()

      await user.click(gamingCard)
      expect(screen.getByText('0 selected')).toBeInTheDocument()
    })

    test('should apply selected styling to selected community', async () => {
      const user = userEvent.setup()
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto & Web3')).toBeInTheDocument()
      })

      const cryptoCard = screen.getByText('Crypto & Web3').closest('div[class*="border-2"]')
      await user.click(cryptoCard)

      expect(cryptoCard).toHaveClass('border-blue-500', 'bg-blue-50')
    })

    test('should remove selected styling when deselected', async () => {
      const user = userEvent.setup()
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Art & Creativity')).toBeInTheDocument()
      })

      const artCard = screen.getByText('Art & Creativity').closest('div[class*="border-2"]')
      await user.click(artCard)
      expect(artCard).toHaveClass('border-blue-500', 'bg-blue-50')

      await user.click(artCard)
      expect(artCard).toHaveClass('border-gray-200', 'bg-white')
    })

    test('should show checkmark when community is selected', async () => {
      const user = userEvent.setup()
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Startup Corner')).toBeInTheDocument()
      })

      const startupCard = screen.getByText('Startup Corner').closest('div[class*="border-2"]')
      await user.click(startupCard)

      const checkmark = within(startupCard).getByRole('img', { hidden: true })
      expect(checkmark).toBeInTheDocument()
    })

    test('should select multiple communities', async () => {
      const user = userEvent.setup()
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Learning & Education')).toBeInTheDocument()
      })

      const educationCard = screen.getByText('Learning & Education').closest('div[class*="border-2"]')
      const healthCard = screen.getByText('Fitness & Health').closest('div[class*="border-2"]')
      const travelCard = screen.getByText('Travel & Culture').closest('div[class*="border-2"]')

      await user.click(educationCard)
      await user.click(healthCard)
      await user.click(travelCard)

      expect(screen.getByText('3 selected')).toBeInTheDocument()
    })

    test('should maintain selection state across multiple clicks', async () => {
      const user = userEvent.setup()
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Food & Cooking')).toBeInTheDocument()
      })

      const foodCard = screen.getByText('Food & Cooking').closest('div[class*="border-2"]')
      const booksCard = screen.getByText('Books & Literature').closest('div[class*="border-2"]')

      await user.click(foodCard)
      await user.click(booksCard)
      expect(screen.getByText('2 selected')).toBeInTheDocument()

      await user.click(foodCard)
      expect(screen.getByText('1 selected')).toBeInTheDocument()

      await user.click(booksCard)
      expect(screen.getByText('0 selected')).toBeInTheDocument()
    })

    test('should handle rapid consecutive clicks on same community', async () => {
      const user = userEvent.setup()
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Music & Audio')).toBeInTheDocument()
      })

      const musicCard = screen.getByText('Music & Audio').closest('div[class*="border-2"]')

      await user.click(musicCard)
      await user.click(musicCard)
      await user.click(musicCard)

      expect(screen.getByText('1 selected')).toBeInTheDocument()
    })
  })

  describe('Selected Communities Display', () => {
    beforeEach(() => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ communities: mockCommunities })
      })
    })

    test('should not show selected communities section initially', async () => {
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Popular Communities')).toBeInTheDocument()
      })

      expect(screen.queryByText(/communities you'll join/i)).not.toBeInTheDocument()
    })

    test('should show selected communities section after selection', async () => {
      const user = userEvent.setup()
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Welcome & General')).toBeInTheDocument()
      })

      const communityCard = screen.getByText('Welcome & General').closest('div[class*="border-2"]')
      await user.click(communityCard)

      expect(screen.getByText(/communities you'll join/i)).toBeInTheDocument()
    })

    test('should display selected community names in the section', async () => {
      const user = userEvent.setup()
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Tech & Innovation')).toBeInTheDocument()
      })

      const techCard = screen.getByText('Tech & Innovation').closest('div[class*="border-2"]')
      await user.click(techCard)

      const selectedSection = screen.getByText(/communities you'll join/i).closest('div')
      expect(within(selectedSection).getAllByText('Tech & Innovation')).toHaveLength(1)
    })

    test('should show icons in selected communities section', async () => {
      const user = userEvent.setup()
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Gaming Hub')).toBeInTheDocument()
      })

      const gamingCard = screen.getByText('Gaming Hub').closest('div[class*="border-2"]')
      await user.click(gamingCard)

      const selectedSection = screen.getByText(/communities you'll join/i).closest('div')
      expect(selectedSection.textContent).toContain('🎮')
    })

    test('should display multiple selected communities', async () => {
      const user = userEvent.setup()
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto & Web3')).toBeInTheDocument()
      })

      const cryptoCard = screen.getByText('Crypto & Web3').closest('div[class*="border-2"]')
      const artCard = screen.getByText('Art & Creativity').closest('div[class*="border-2"]')
      const startupCard = screen.getByText('Startup Corner').closest('div[class*="border-2"]')

      await user.click(cryptoCard)
      await user.click(artCard)
      await user.click(startupCard)

      const selectedSection = screen.getByText(/communities you'll join/i).closest('div')
      expect(within(selectedSection).getByText('Crypto & Web3')).toBeInTheDocument()
      expect(within(selectedSection).getByText('Art & Creativity')).toBeInTheDocument()
      expect(within(selectedSection).getByText('Startup Corner')).toBeInTheDocument()
    })

    test('should hide selected communities section when all deselected', async () => {
      const user = userEvent.setup()
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Learning & Education')).toBeInTheDocument()
      })

      const educationCard = screen.getByText('Learning & Education').closest('div[class*="border-2"]')
      await user.click(educationCard)
      expect(screen.getByText(/communities you'll join/i)).toBeInTheDocument()

      await user.click(educationCard)
      expect(screen.queryByText(/communities you'll join/i)).not.toBeInTheDocument()
    })
  })

  describe('Continue Button Behavior', () => {
    beforeEach(() => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ communities: mockCommunities })
      })
    })

    test('should show "Continue" button when no communities selected', async () => {
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^continue$/i })).toBeInTheDocument()
      })
    })

    test('should change button text when communities are selected', async () => {
      const user = userEvent.setup()
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Fitness & Health')).toBeInTheDocument()
      })

      const healthCard = screen.getByText('Fitness & Health').closest('div[class*="border-2"]')
      await user.click(healthCard)

      expect(screen.getByRole('button', { name: /join 1 communities/i })).toBeInTheDocument()
    })

    test('should update button text with correct count', async () => {
      const user = userEvent.setup()
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Travel & Culture')).toBeInTheDocument()
      })

      const travelCard = screen.getByText('Travel & Culture').closest('div[class*="border-2"]')
      const foodCard = screen.getByText('Food & Cooking').closest('div[class*="border-2"]')
      const booksCard = screen.getByText('Books & Literature').closest('div[class*="border-2"]')

      await user.click(travelCard)
      await user.click(foodCard)
      await user.click(booksCard)

      expect(screen.getByRole('button', { name: /join 3 communities/i })).toBeInTheDocument()
    })

    test('should call onSkip when Continue clicked with no selection', async () => {
      const user = userEvent.setup()
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^continue$/i })).toBeInTheDocument()
      })

      const continueButton = screen.getByRole('button', { name: /^continue$/i })
      await user.click(continueButton)

      expect(onSkip).toHaveBeenCalledTimes(1)
    })

    test('should not call onComplete when Continue clicked with no selection', async () => {
      const user = userEvent.setup()
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^continue$/i })).toBeInTheDocument()
      })

      const continueButton = screen.getByRole('button', { name: /^continue$/i })
      await user.click(continueButton)

      expect(onComplete).not.toHaveBeenCalled()
    })

    test('should revert to "Continue" when all selections removed', async () => {
      const user = userEvent.setup()
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Music & Audio')).toBeInTheDocument()
      })

      const musicCard = screen.getByText('Music & Audio').closest('div[class*="border-2"]')
      await user.click(musicCard)
      expect(screen.getByRole('button', { name: /join 1 communities/i })).toBeInTheDocument()

      await user.click(musicCard)
      expect(screen.getByRole('button', { name: /^continue$/i })).toBeInTheDocument()
    })
  })

  describe('Skip Functionality', () => {
    beforeEach(() => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ communities: mockCommunities })
      })
    })

    test('should call onSkip when Skip button clicked', async () => {
      const user = userEvent.setup()
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /skip for now/i })).toBeInTheDocument()
      })

      const skipButton = screen.getByRole('button', { name: /skip for now/i })
      await user.click(skipButton)

      expect(onSkip).toHaveBeenCalledTimes(1)
    })

    test('should not call onComplete when Skip button clicked', async () => {
      const user = userEvent.setup()
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /skip for now/i })).toBeInTheDocument()
      })

      const skipButton = screen.getByRole('button', { name: /skip for now/i })
      await user.click(skipButton)

      expect(onComplete).not.toHaveBeenCalled()
    })

    test('should skip even with selected communities', async () => {
      const user = userEvent.setup()
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Welcome & General')).toBeInTheDocument()
      })

      const communityCard = screen.getByText('Welcome & General').closest('div[class*="border-2"]')
      await user.click(communityCard)

      const skipButton = screen.getByRole('button', { name: /skip for now/i })
      await user.click(skipButton)

      expect(onSkip).toHaveBeenCalledTimes(1)
    })

    test('should not make API calls when skipped', async () => {
      const user = userEvent.setup()
      const joinFetch = jest.fn()
      global.fetch.mockImplementation((url) => {
        if (url.includes('/join')) {
          return joinFetch()
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ communities: mockCommunities })
        })
      })

      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Tech & Innovation')).toBeInTheDocument()
      })

      const techCard = screen.getByText('Tech & Innovation').closest('div[class*="border-2"]')
      await user.click(techCard)

      const skipButton = screen.getByRole('button', { name: /skip for now/i })
      await user.click(skipButton)

      expect(joinFetch).not.toHaveBeenCalled()
    })
  })

  describe('Join Communities Action', () => {
    beforeEach(() => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ communities: mockCommunities })
      })
    })

    test('should call join API for selected community', async () => {
      const user = userEvent.setup()
      const joinFetch = jest.fn().mockResolvedValue({ ok: true })
      global.fetch.mockImplementation((url) => {
        if (url.includes('/join')) {
          return joinFetch()
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ communities: mockCommunities })
        })
      })

      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto & Web3')).toBeInTheDocument()
      })

      const cryptoCard = screen.getByText('Crypto & Web3').closest('div[class*="border-2"]')
      await user.click(cryptoCard)

      const joinButton = screen.getByRole('button', { name: /join 1 communities/i })
      await user.click(joinButton)

      await waitFor(() => {
        expect(joinFetch).toHaveBeenCalledTimes(1)
      })
    })

    test('should call join API for multiple selected communities', async () => {
      const user = userEvent.setup()
      const joinFetch = jest.fn().mockResolvedValue({ ok: true })
      global.fetch.mockImplementation((url) => {
        if (url.includes('/join')) {
          return joinFetch()
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ communities: mockCommunities })
        })
      })

      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Gaming Hub')).toBeInTheDocument()
      })

      const gamingCard = screen.getByText('Gaming Hub').closest('div[class*="border-2"]')
      const artCard = screen.getByText('Art & Creativity').closest('div[class*="border-2"]')
      const startupCard = screen.getByText('Startup Corner').closest('div[class*="border-2"]')

      await user.click(gamingCard)
      await user.click(artCard)
      await user.click(startupCard)

      const joinButton = screen.getByRole('button', { name: /join 3 communities/i })
      await user.click(joinButton)

      await waitFor(() => {
        expect(joinFetch).toHaveBeenCalledTimes(3)
      })
    })

    test('should include auth token in join requests', async () => {
      const user = userEvent.setup()
      let capturedHeaders = null
      global.fetch.mockImplementation((url, options) => {
        if (url.includes('/join')) {
          capturedHeaders = options.headers
          return Promise.resolve({ ok: true })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ communities: mockCommunities })
        })
      })

      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Learning & Education')).toBeInTheDocument()
      })

      const educationCard = screen.getByText('Learning & Education').closest('div[class*="border-2"]')
      await user.click(educationCard)

      const joinButton = screen.getByRole('button', { name: /join 1 communities/i })
      await user.click(joinButton)

      await waitFor(() => {
        expect(capturedHeaders).toEqual({
          'Authorization': 'Bearer test-token'
        })
      })
    })

    test('should call onComplete after successful join', async () => {
      const user = userEvent.setup()
      global.fetch.mockImplementation((url) => {
        if (url.includes('/join')) {
          return Promise.resolve({ ok: true })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ communities: mockCommunities })
        })
      })

      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Fitness & Health')).toBeInTheDocument()
      })

      const healthCard = screen.getByText('Fitness & Health').closest('div[class*="border-2"]')
      await user.click(healthCard)

      const joinButton = screen.getByRole('button', { name: /join 1 communities/i })
      await user.click(joinButton)

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledTimes(1)
      })
    })

    test('should call onComplete even if join fails', async () => {
      const user = userEvent.setup()
      global.fetch.mockImplementation((url) => {
        if (url.includes('/join')) {
          return Promise.reject(new Error('Join failed'))
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ communities: mockCommunities })
        })
      })

      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Travel & Culture')).toBeInTheDocument()
      })

      const travelCard = screen.getByText('Travel & Culture').closest('div[class*="border-2"]')
      await user.click(travelCard)

      const joinButton = screen.getByRole('button', { name: /join 1 communities/i })
      await user.click(joinButton)

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledTimes(1)
      })
    })

    test('should use POST method for join requests', async () => {
      const user = userEvent.setup()
      let capturedMethod = null
      global.fetch.mockImplementation((url, options) => {
        if (url.includes('/join')) {
          capturedMethod = options.method
          return Promise.resolve({ ok: true })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ communities: mockCommunities })
        })
      })

      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Food & Cooking')).toBeInTheDocument()
      })

      const foodCard = screen.getByText('Food & Cooking').closest('div[class*="border-2"]')
      await user.click(foodCard)

      const joinButton = screen.getByRole('button', { name: /join 1 communities/i })
      await user.click(joinButton)

      await waitFor(() => {
        expect(capturedMethod).toBe('POST')
      })
    })

    test('should call correct endpoint for each community', async () => {
      const user = userEvent.setup()
      const urls = []
      global.fetch.mockImplementation((url, options) => {
        if (url.includes('/join')) {
          urls.push(url)
          return Promise.resolve({ ok: true })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ communities: mockCommunities })
        })
      })

      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Books & Literature')).toBeInTheDocument()
      })

      const booksCard = screen.getByText('Books & Literature').closest('div[class*="border-2"]')
      await user.click(booksCard)

      const joinButton = screen.getByRole('button', { name: /join 1 communities/i })
      await user.click(joinButton)

      await waitFor(() => {
        expect(urls).toContain('/api/communities/11/join')
      })
    })

    test('should handle partial join failures gracefully', async () => {
      const user = userEvent.setup()
      let callCount = 0
      global.fetch.mockImplementation((url) => {
        if (url.includes('/join')) {
          callCount++
          if (callCount === 2) {
            return Promise.reject(new Error('Join failed'))
          }
          return Promise.resolve({ ok: true })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ communities: mockCommunities })
        })
      })

      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Music & Audio')).toBeInTheDocument()
      })

      const musicCard = screen.getByText('Music & Audio').closest('div[class*="border-2"]')
      const generalCard = screen.getByText('Welcome & General').closest('div[class*="border-2"]')

      await user.click(musicCard)
      await user.click(generalCard)

      const joinButton = screen.getByRole('button', { name: /join 2 communities/i })
      await user.click(joinButton)

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Empty States', () => {
    test('should handle empty communities list gracefully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ communities: [] })
      })

      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Join Communities')).toBeInTheDocument()
      })

      expect(screen.queryByText('Welcome & General')).not.toBeInTheDocument()
    })

    test('should show "0 selected" with empty communities', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ communities: [] })
      })

      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('0 selected')).toBeInTheDocument()
      })
    })

    test('should show Continue button with empty communities', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ communities: [] })
      })

      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^continue$/i })).toBeInTheDocument()
      })
    })

    test('should show Skip button with empty communities', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ communities: [] })
      })

      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /skip for now/i })).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    test('should handle network errors during fetch', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Welcome & General')).toBeInTheDocument()
      })

      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch communities:', expect.any(Error))
      consoleSpy.mockRestore()
    })

    test('should handle join errors silently', async () => {
      const user = userEvent.setup()
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      global.fetch.mockImplementation((url) => {
        if (url.includes('/join')) {
          return Promise.reject(new Error('Join failed'))
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ communities: mockCommunities })
        })
      })

      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Tech & Innovation')).toBeInTheDocument()
      })

      const techCard = screen.getByText('Tech & Innovation').closest('div[class*="border-2"]')
      await user.click(techCard)

      const joinButton = screen.getByRole('button', { name: /join 1 communities/i })
      await user.click(joinButton)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to join communities:', expect.any(Error))
        expect(onComplete).toHaveBeenCalled()
      })

      consoleSpy.mockRestore()
    })

    test('should handle malformed API response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'data' })
      })

      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Join Communities')).toBeInTheDocument()
      })

      expect(screen.queryByText('Welcome & General')).not.toBeInTheDocument()
    })

    test('should handle missing localStorage token', async () => {
      const user = userEvent.setup()
      localStorage.removeItem('token')
      global.fetch.mockImplementation((url, options) => {
        if (url.includes('/join')) {
          return Promise.resolve({ ok: true })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ communities: mockCommunities })
        })
      })

      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Crypto & Web3')).toBeInTheDocument()
      })

      const cryptoCard = screen.getByText('Crypto & Web3').closest('div[class*="border-2"]')
      await user.click(cryptoCard)

      const joinButton = screen.getByRole('button', { name: /join 1 communities/i })
      await user.click(joinButton)

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled()
      })
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ communities: mockCommunities })
      })
    })

    test('should have clickable community cards', async () => {
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Gaming Hub')).toBeInTheDocument()
      })

      const gamingCard = screen.getByText('Gaming Hub').closest('div[class*="cursor-pointer"]')
      expect(gamingCard).toBeInTheDocument()
    })

    test('should apply hover styles to community cards', async () => {
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Art & Creativity')).toBeInTheDocument()
      })

      const artCard = screen.getByText('Art & Creativity').closest('div[class*="border-2"]')
      expect(artCard).toHaveClass('hover:shadow-md')
    })

    test('should have accessible button text', async () => {
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /skip for now/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /^continue$/i })).toBeInTheDocument()
      })
    })
  })

  describe('Layout and Styling', () => {
    beforeEach(() => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ communities: mockCommunities })
      })
    })

    test('should apply correct container styling', async () => {
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        expect(screen.getByText('Join Communities')).toBeInTheDocument()
      })

      const container = screen.getByText('Join Communities').closest('div[class*="max-w-4xl"]')
      expect(container).toHaveClass('max-w-4xl', 'mx-auto', 'py-4')
    })

    test('should apply correct heading styling', async () => {
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        const heading = screen.getByText('Join Communities')
        expect(heading).toHaveClass('text-2xl', 'font-bold', 'text-gray-800', 'mb-2')
      })
    })

    test('should apply correct grid layout', async () => {
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        const grid = screen.getByText('Welcome & General').closest('.grid')
        expect(grid).toHaveClass('md:grid-cols-2', 'lg:grid-cols-3', 'gap-4')
      })
    })

    test('should apply correct button styling', async () => {
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        const continueButton = screen.getByRole('button', { name: /^continue$/i })
        expect(continueButton).toHaveClass('px-6', 'py-2', 'bg-blue-600', 'text-white', 'rounded-lg', 'hover:bg-blue-700')
      })
    })

    test('should show Community Tips section with correct styling', async () => {
      render(<JoinCommunitiesStep onComplete={onComplete} onSkip={onSkip} />)

      await waitFor(() => {
        const tipsSection = screen.getByText(/community tips/i).closest('div[class*="bg-gray-50"]')
        expect(tipsSection).toHaveClass('bg-gray-50', 'p-6', 'rounded-xl', 'mb-6')
      })
    })
  })
})

export default mockCommunities
