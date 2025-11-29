import React from 'react'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react-dom/test-utils'
import UserSearch from './UserSearch'
import { useAuth } from '../../contexts/AuthContext'
import profileService from '../../services/profileService'
import { useToast } from '../ui/useToast'

jest.mock('../../contexts/AuthContext')
jest.mock('../../services/profileService')
jest.mock('../ui/useToast')
jest.mock('./ProfileCard', () => ({
  __esModule: true,
  default: ({ user, onClick, variant }) => (
    <div
      data-testid={`profile-card-${user.id}`}
      onClick={() => onClick?.(user)}
      data-variant={variant}
    >
      <span>{user.username}</span>
      <span>{user.displayName}</span>
    </div>
  )
}))

const mockCurrentUser = {
  id: 'user1',
  username: 'testuser',
  displayName: 'Test User'
}

const mockRecommendedUsers = [
  {
    id: 'rec1',
    username: 'recommended1',
    displayName: 'Recommended User 1',
    avatar: null,
    bio: 'First recommended user',
    stats: { followers: 100, karma: 50, posts: 10 }
  },
  {
    id: 'rec2',
    username: 'recommended2',
    displayName: 'Recommended User 2',
    avatar: null,
    bio: 'Second recommended user',
    stats: { followers: 200, karma: 150, posts: 20 }
  }
]

const mockSearchResults = [
  {
    id: 'search1',
    username: 'searchresult1',
    displayName: 'Search Result 1',
    avatar: null,
    bio: 'First search result',
    stats: { followers: 500, karma: 300, posts: 50 }
  },
  {
    id: 'search2',
    username: 'searchresult2',
    displayName: 'Search Result 2',
    avatar: null,
    bio: 'Second search result',
    stats: { followers: 800, karma: 600, posts: 75 }
  }
]

const mockShowToast = jest.fn()

describe('UserSearch Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    localStorage.clear()

    useAuth.mockReturnValue({
      user: mockCurrentUser
    })

    useToast.mockReturnValue({
      showToast: mockShowToast
    })

    profileService.getRecommendedUsers.mockResolvedValue({
      users: mockRecommendedUsers
    })

    profileService.searchUsers.mockResolvedValue({
      users: mockSearchResults
    })
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Initial Rendering', () => {
    it('should render search input with correct placeholder', () => {
      render(<UserSearch />)
      expect(screen.getByPlaceholderText(/search for users by name, username, or interests/i)).toBeInTheDocument()
    })

    it('should render filter button', () => {
      render(<UserSearch />)
      expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument()
    })

    it('should load recommended users on mount', async () => {
      render(<UserSearch />)

      await waitFor(() => {
        expect(profileService.getRecommendedUsers).toHaveBeenCalledWith(8)
      })
    })

    it('should not load recommendations when showRecommendations is false', async () => {
      render(<UserSearch showRecommendations={false} />)

      await waitFor(() => {
        expect(profileService.getRecommendedUsers).not.toHaveBeenCalled()
      })
    })

    it('should display trending users section', async () => {
      render(<UserSearch />)

      await waitFor(() => {
        expect(screen.getByText(/trending this week/i)).toBeInTheDocument()
      })
    })

    it('should display recommended users section when loaded', async () => {
      render(<UserSearch />)

      await waitFor(() => {
        expect(screen.getByText(/suggested for you/i)).toBeInTheDocument()
      })
    })

    it('should apply custom className', () => {
      const { container } = render(<UserSearch className="custom-class" />)
      expect(container.querySelector('.custom-class')).toBeInTheDocument()
    })
  })

  describe('Search Input', () => {
    it('should update search query on input change', async () => {
      const user = userEvent.setup({ delay: null })
      render(<UserSearch />)

      const input = screen.getByPlaceholderText(/search for users by name, username, or interests/i)
      await user.type(input, 'test query')

      expect(input).toHaveValue('test query')
    })

    it('should show clear button when search query exists', async () => {
      const user = userEvent.setup({ delay: null })
      render(<UserSearch />)

      const input = screen.getByPlaceholderText(/search for users by name, username, or interests/i)
      await user.type(input, 'test')

      expect(screen.getByRole('button', { name: '' })).toBeInTheDocument()
    })

    it('should clear search when clear button is clicked', async () => {
      const user = userEvent.setup({ delay: null })
      render(<UserSearch />)

      const input = screen.getByPlaceholderText(/search for users by name, username, or interests/i)
      await user.type(input, 'test query')

      const clearButtons = screen.getAllByRole('button')
      const clearButton = clearButtons.find(btn => btn.className.includes('clear-search'))
      await user.click(clearButton)

      expect(input).toHaveValue('')
    })

    it('should focus input after clearing search', async () => {
      const user = userEvent.setup({ delay: null })
      render(<UserSearch />)

      const input = screen.getByPlaceholderText(/search for users by name, username, or interests/i)
      await user.type(input, 'test')

      const clearButtons = screen.getAllByRole('button')
      const clearButton = clearButtons.find(btn => btn.className.includes('clear-search'))
      await user.click(clearButton)

      expect(input).toHaveFocus()
    })
  })

  describe('Debounced Search', () => {
    it('should debounce search by 300ms', async () => {
      const user = userEvent.setup({ delay: null })
      render(<UserSearch />)

      const input = screen.getByPlaceholderText(/search for users by name, username, or interests/i)
      await user.type(input, 'test')

      expect(profileService.searchUsers).not.toHaveBeenCalled()

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(profileService.searchUsers).toHaveBeenCalledWith('test', expect.any(Object))
      })
    })

    it('should cancel previous debounced search when typing', async () => {
      const user = userEvent.setup({ delay: null })
      render(<UserSearch />)

      const input = screen.getByPlaceholderText(/search for users by name, username, or interests/i)
      await user.type(input, 't')

      act(() => {
        jest.advanceTimersByTime(100)
      })

      await user.type(input, 'e')

      act(() => {
        jest.advanceTimersByTime(100)
      })

      await user.type(input, 's')

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(profileService.searchUsers).toHaveBeenCalledTimes(1)
        expect(profileService.searchUsers).toHaveBeenCalledWith('tes', expect.any(Object))
      })
    })

    it('should not search when query is empty', async () => {
      const user = userEvent.setup({ delay: null })
      render(<UserSearch />)

      const input = screen.getByPlaceholderText(/search for users by name, username, or interests/i)
      await user.type(input, 'test')

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(profileService.searchUsers).toHaveBeenCalled()
      })

      jest.clearAllMocks()

      await user.clear(input)

      act(() => {
        jest.advanceTimersByTime(300)
      })

      expect(profileService.searchUsers).not.toHaveBeenCalled()
    })

    it('should trigger search when filters change', async () => {
      const user = userEvent.setup({ delay: null })
      render(<UserSearch />)

      const input = screen.getByPlaceholderText(/search for users by name, username, or interests/i)
      await user.type(input, 'test')

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(profileService.searchUsers).toHaveBeenCalledTimes(1)
      })

      const filterButton = screen.getByRole('button', { name: /filters/i })
      await user.click(filterButton)

      const verifiedCheckbox = screen.getByLabelText(/verified users only/i)
      await user.click(verifiedCheckbox)

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(profileService.searchUsers).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Search Results Display', () => {
    it('should display search results after search', async () => {
      const user = userEvent.setup({ delay: null })
      render(<UserSearch />)

      const input = screen.getByPlaceholderText(/search for users by name, username, or interests/i)
      await user.type(input, 'test')

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(screen.getByTestId('profile-card-search1')).toBeInTheDocument()
        expect(screen.getByTestId('profile-card-search2')).toBeInTheDocument()
      })
    })

    it('should display results count', async () => {
      const user = userEvent.setup({ delay: null })
      render(<UserSearch />)

      const input = screen.getByPlaceholderText(/search for users by name, username, or interests/i)
      await user.type(input, 'test')

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(screen.getByText(/2 users found for "test"/i)).toBeInTheDocument()
      })
    })

    it('should display empty state when no results found', async () => {
      profileService.searchUsers.mockResolvedValue({ users: [] })

      const user = userEvent.setup({ delay: null })
      render(<UserSearch />)

      const input = screen.getByPlaceholderText(/search for users by name, username, or interests/i)
      await user.type(input, 'nonexistent')

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(screen.getByText(/no users found/i)).toBeInTheDocument()
        expect(screen.getByText(/try adjusting your search terms or filters/i)).toBeInTheDocument()
      })
    })

    it('should clear results when search query is cleared', async () => {
      const user = userEvent.setup({ delay: null })
      render(<UserSearch />)

      const input = screen.getByPlaceholderText(/search for users by name, username, or interests/i)
      await user.type(input, 'test')

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(screen.getByTestId('profile-card-search1')).toBeInTheDocument()
      })

      await user.clear(input)

      await waitFor(() => {
        expect(screen.queryByTestId('profile-card-search1')).not.toBeInTheDocument()
      })
    })
  })

  describe('Loading States', () => {
    it('should show loading state during initial data load', () => {
      render(<UserSearch />)

      expect(screen.getByText(/searching users/i)).toBeInTheDocument()
    })

    it('should show loading state during search', async () => {
      profileService.searchUsers.mockImplementation(() => new Promise(() => {}))

      const user = userEvent.setup({ delay: null })
      render(<UserSearch />)

      await waitFor(() => {
        expect(screen.queryByText(/searching users/i)).not.toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText(/search for users by name, username, or interests/i)
      await user.type(input, 'test')

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(screen.getByText(/searching users/i)).toBeInTheDocument()
      })
    })

    it('should hide loading state after search completes', async () => {
      const user = userEvent.setup({ delay: null })
      render(<UserSearch />)

      const input = screen.getByPlaceholderText(/search for users by name, username, or interests/i)
      await user.type(input, 'test')

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(screen.queryByText(/searching users/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Filter Options', () => {
    it('should toggle filters panel when filter button is clicked', async () => {
      const user = userEvent.setup({ delay: null })
      render(<UserSearch />)

      const filterButton = screen.getByRole('button', { name: /filters/i })

      expect(screen.queryByLabelText(/verified users only/i)).not.toBeInTheDocument()

      await user.click(filterButton)

      expect(screen.getByLabelText(/verified users only/i)).toBeInTheDocument()

      await user.click(filterButton)

      expect(screen.queryByLabelText(/verified users only/i)).not.toBeInTheDocument()
    })

    it('should apply verified filter', async () => {
      const user = userEvent.setup({ delay: null })
      render(<UserSearch />)

      const input = screen.getByPlaceholderText(/search for users by name, username, or interests/i)
      await user.type(input, 'test')

      const filterButton = screen.getByRole('button', { name: /filters/i })
      await user.click(filterButton)

      const verifiedCheckbox = screen.getByLabelText(/verified users only/i)
      await user.click(verifiedCheckbox)

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(profileService.searchUsers).toHaveBeenCalledWith('test', expect.objectContaining({
          verified: true
        }))
      })
    })

    it('should apply hasAvatar filter', async () => {
      const user = userEvent.setup({ delay: null })
      render(<UserSearch />)

      const input = screen.getByPlaceholderText(/search for users by name, username, or interests/i)
      await user.type(input, 'test')

      const filterButton = screen.getByRole('button', { name: /filters/i })
      await user.click(filterButton)

      const avatarCheckbox = screen.getByLabelText(/has profile picture/i)
      await user.click(avatarCheckbox)

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(profileService.searchUsers).toHaveBeenCalledWith('test', expect.objectContaining({
          hasAvatar: true
        }))
      })
    })

    it('should apply location filter', async () => {
      const user = userEvent.setup({ delay: null })
      render(<UserSearch />)

      const input = screen.getByPlaceholderText(/search for users by name, username, or interests/i)
      await user.type(input, 'test')

      const filterButton = screen.getByRole('button', { name: /filters/i })
      await user.click(filterButton)

      const locationInput = screen.getByPlaceholderText(/city, country/i)
      await user.type(locationInput, 'New York')

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(profileService.searchUsers).toHaveBeenCalledWith('test', expect.objectContaining({
          location: 'New York'
        }))
      })
    })

    it('should apply minKarma filter', async () => {
      const user = userEvent.setup({ delay: null })
      render(<UserSearch />)

      const input = screen.getByPlaceholderText(/search for users by name, username, or interests/i)
      await user.type(input, 'test')

      const filterButton = screen.getByRole('button', { name: /filters/i })
      await user.click(filterButton)

      const karmaInput = screen.getByPlaceholderText('1000')
      await user.type(karmaInput, '500')

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(profileService.searchUsers).toHaveBeenCalledWith('test', expect.objectContaining({
          minKarma: '500'
        }))
      })
    })

    it('should apply minFollowers filter', async () => {
      const user = userEvent.setup({ delay: null })
      render(<UserSearch />)

      const input = screen.getByPlaceholderText(/search for users by name, username, or interests/i)
      await user.type(input, 'test')

      const filterButton = screen.getByRole('button', { name: /filters/i })
      await user.click(filterButton)

      const followersInput = screen.getByPlaceholderText('100')
      await user.type(followersInput, '250')

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(profileService.searchUsers).toHaveBeenCalledWith('test', expect.objectContaining({
          minFollowers: '250'
        }))
      })
    })

    it('should clear all filters when clear button is clicked', async () => {
      const user = userEvent.setup({ delay: null })
      render(<UserSearch />)

      const filterButton = screen.getByRole('button', { name: /filters/i })
      await user.click(filterButton)

      const verifiedCheckbox = screen.getByLabelText(/verified users only/i)
      await user.click(verifiedCheckbox)

      const locationInput = screen.getByPlaceholderText(/city, country/i)
      await user.type(locationInput, 'Boston')

      const clearFiltersButton = screen.getByRole('button', { name: /clear filters/i })
      await user.click(clearFiltersButton)

      expect(verifiedCheckbox).not.toBeChecked()
      expect(locationInput).toHaveValue('')
    })
  })

  describe('Sort Options', () => {
    it('should apply relevance sort', async () => {
      const user = userEvent.setup({ delay: null })
      render(<UserSearch />)

      const input = screen.getByPlaceholderText(/search for users by name, username, or interests/i)
      await user.type(input, 'test')

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(profileService.searchUsers).toHaveBeenCalledWith('test', expect.objectContaining({
          sortBy: 'relevance'
        }))
      })
    })

    it('should apply followers sort', async () => {
      const user = userEvent.setup({ delay: null })
      render(<UserSearch />)

      const input = screen.getByPlaceholderText(/search for users by name, username, or interests/i)
      await user.type(input, 'test')

      const filterButton = screen.getByRole('button', { name: /filters/i })
      await user.click(filterButton)

      const sortSelect = screen.getByDisplayValue(/relevance/i)
      await user.selectOptions(sortSelect, 'followers')

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(profileService.searchUsers).toHaveBeenCalledWith('test', expect.objectContaining({
          sortBy: 'followers'
        }))
      })
    })

    it('should apply karma sort', async () => {
      const user = userEvent.setup({ delay: null })
      render(<UserSearch />)

      const input = screen.getByPlaceholderText(/search for users by name, username, or interests/i)
      await user.type(input, 'test')

      const filterButton = screen.getByRole('button', { name: /filters/i })
      await user.click(filterButton)

      const sortSelect = screen.getByDisplayValue(/relevance/i)
      await user.selectOptions(sortSelect, 'karma')

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(profileService.searchUsers).toHaveBeenCalledWith('test', expect.objectContaining({
          sortBy: 'karma'
        }))
      })
    })

    it('should apply recent sort', async () => {
      const user = userEvent.setup({ delay: null })
      render(<UserSearch />)

      const input = screen.getByPlaceholderText(/search for users by name, username, or interests/i)
      await user.type(input, 'test')

      const filterButton = screen.getByRole('button', { name: /filters/i })
      await user.click(filterButton)

      const sortSelect = screen.getByDisplayValue(/relevance/i)
      await user.selectOptions(sortSelect, 'recent')

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(profileService.searchUsers).toHaveBeenCalledWith('test', expect.objectContaining({
          sortBy: 'recent'
        }))
      })
    })
  })

  describe('Timeframe Options', () => {
    it('should apply all time timeframe by default', async () => {
      const user = userEvent.setup({ delay: null })
      render(<UserSearch />)

      const input = screen.getByPlaceholderText(/search for users by name, username, or interests/i)
      await user.type(input, 'test')

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(profileService.searchUsers).toHaveBeenCalledWith('test', expect.objectContaining({
          timeframe: 'all'
        }))
      })
    })

    it('should apply year timeframe', async () => {
      const user = userEvent.setup({ delay: null })
      render(<UserSearch />)

      const input = screen.getByPlaceholderText(/search for users by name, username, or interests/i)
      await user.type(input, 'test')

      const filterButton = screen.getByRole('button', { name: /filters/i })
      await user.click(filterButton)

      const timeframeSelect = screen.getByDisplayValue(/all time/i)
      await user.selectOptions(timeframeSelect, 'year')

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(profileService.searchUsers).toHaveBeenCalledWith('test', expect.objectContaining({
          timeframe: 'year'
        }))
      })
    })

    it('should apply month timeframe', async () => {
      const user = userEvent.setup({ delay: null })
      render(<UserSearch />)

      const input = screen.getByPlaceholderText(/search for users by name, username, or interests/i)
      await user.type(input, 'test')

      const filterButton = screen.getByRole('button', { name: /filters/i })
      await user.click(filterButton)

      const timeframeSelect = screen.getByDisplayValue(/all time/i)
      await user.selectOptions(timeframeSelect, 'month')

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(profileService.searchUsers).toHaveBeenCalledWith('test', expect.objectContaining({
          timeframe: 'month'
        }))
      })
    })

    it('should apply week timeframe', async () => {
      const user = userEvent.setup({ delay: null })
      render(<UserSearch />)

      const input = screen.getByPlaceholderText(/search for users by name, username, or interests/i)
      await user.type(input, 'test')

      const filterButton = screen.getByRole('button', { name: /filters/i })
      await user.click(filterButton)

      const timeframeSelect = screen.getByDisplayValue(/all time/i)
      await user.selectOptions(timeframeSelect, 'week')

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(profileService.searchUsers).toHaveBeenCalledWith('test', expect.objectContaining({
          timeframe: 'week'
        }))
      })
    })
  })

  describe('Recent Searches', () => {
    it('should load recent searches from localStorage on mount', () => {
      const recentSearches = ['test1', 'test2', 'test3']
      localStorage.setItem('cryb_recent_searches', JSON.stringify(recentSearches))

      render(<UserSearch />)

      waitFor(() => {
        expect(screen.getByText('test1')).toBeInTheDocument()
      })
    })

    it('should save search query to recent searches', async () => {
      const user = userEvent.setup({ delay: null })
      render(<UserSearch />)

      const input = screen.getByPlaceholderText(/search for users by name, username, or interests/i)
      await user.type(input, 'test query')

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        const saved = JSON.parse(localStorage.getItem('cryb_recent_searches'))
        expect(saved).toContain('test query')
      })
    })

    it('should limit recent searches to 5 items', async () => {
      const user = userEvent.setup({ delay: null })
      render(<UserSearch />)

      const input = screen.getByPlaceholderText(/search for users by name, username, or interests/i)

      for (let i = 1; i <= 6; i++) {
        await user.clear(input)
        await user.type(input, `query${i}`)

        act(() => {
          jest.advanceTimersByTime(300)
        })

        await waitFor(() => {
          expect(profileService.searchUsers).toHaveBeenCalled()
        })
      }

      const saved = JSON.parse(localStorage.getItem('cryb_recent_searches'))
      expect(saved).toHaveLength(5)
      expect(saved[0]).toBe('query6')
    })

    it('should clear recent searches when clear button is clicked', async () => {
      localStorage.setItem('cryb_recent_searches', JSON.stringify(['test1', 'test2']))

      const user = userEvent.setup({ delay: null })
      render(<UserSearch />)

      await waitFor(() => {
        expect(screen.getByText(/recent searches/i)).toBeInTheDocument()
      })

      const clearButton = screen.getByRole('button', { name: /clear/i })
      await user.click(clearButton)

      await waitFor(() => {
        expect(localStorage.getItem('cryb_recent_searches')).toBeNull()
      })
    })

    it('should populate search input when recent search is clicked', async () => {
      localStorage.setItem('cryb_recent_searches', JSON.stringify(['previous search']))

      const user = userEvent.setup({ delay: null })
      render(<UserSearch />)

      await waitFor(() => {
        expect(screen.getByText('previous search')).toBeInTheDocument()
      })

      const recentSearchItem = screen.getByText('previous search')
      await user.click(recentSearchItem.closest('button'))

      const input = screen.getByPlaceholderText(/search for users by name, username, or interests/i)
      expect(input).toHaveValue('previous search')
    })

    it('should handle localStorage errors gracefully', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('localStorage error')
      })

      expect(() => render(<UserSearch />)).not.toThrow()
    })
  })

  describe('User Interaction', () => {
    it('should call onUserSelect when user card is clicked and prop is provided', async () => {
      const onUserSelect = jest.fn()
      const user = userEvent.setup({ delay: null })

      render(<UserSearch onUserSelect={onUserSelect} />)

      const input = screen.getByPlaceholderText(/search for users by name, username, or interests/i)
      await user.type(input, 'test')

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(screen.getByTestId('profile-card-search1')).toBeInTheDocument()
      })

      const profileCard = screen.getByTestId('profile-card-search1')
      await user.click(profileCard)

      expect(onUserSelect).toHaveBeenCalledWith(mockSearchResults[0])
    })

    it('should navigate to profile when user card is clicked without onUserSelect', async () => {
      delete window.location
      window.location = { href: '' }

      const user = userEvent.setup({ delay: null })
      render(<UserSearch />)

      const input = screen.getByPlaceholderText(/search for users by name, username, or interests/i)
      await user.type(input, 'test')

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(screen.getByTestId('profile-card-search1')).toBeInTheDocument()
      })

      const profileCard = screen.getByTestId('profile-card-search1')
      await user.click(profileCard)

      expect(window.location.href).toBe('/profile/searchresult1')
    })

    it('should handle user selection from recommended users', async () => {
      const onUserSelect = jest.fn()
      const user = userEvent.setup({ delay: null })

      render(<UserSearch onUserSelect={onUserSelect} />)

      await waitFor(() => {
        expect(screen.getByTestId('profile-card-rec1')).toBeInTheDocument()
      })

      const profileCard = screen.getByTestId('profile-card-rec1')
      await user.click(profileCard)

      expect(onUserSelect).toHaveBeenCalledWith(mockRecommendedUsers[0])
    })
  })

  describe('Error Handling', () => {
    it('should show error toast when search fails', async () => {
      profileService.searchUsers.mockRejectedValue(new Error('Search failed'))

      const user = userEvent.setup({ delay: null })
      render(<UserSearch />)

      const input = screen.getByPlaceholderText(/search for users by name, username, or interests/i)
      await user.type(input, 'test')

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Search failed. Please try again.', 'error')
      })
    })

    it('should set empty results when search fails', async () => {
      profileService.searchUsers.mockRejectedValue(new Error('Search failed'))

      const user = userEvent.setup({ delay: null })
      render(<UserSearch />)

      const input = screen.getByPlaceholderText(/search for users by name, username, or interests/i)
      await user.type(input, 'test')

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(screen.getByText(/no users found/i)).toBeInTheDocument()
      })
    })

    it('should handle initial data load error gracefully', async () => {
      profileService.getRecommendedUsers.mockRejectedValue(new Error('Load failed'))

      render(<UserSearch />)

      await waitFor(() => {
        expect(screen.queryByText(/searching users/i)).not.toBeInTheDocument()
      })
    })

    it('should handle localStorage save errors gracefully', async () => {
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('localStorage error')
      })

      const user = userEvent.setup({ delay: null })
      render(<UserSearch />)

      const input = screen.getByPlaceholderText(/search for users by name, username, or interests/i)
      await user.type(input, 'test')

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(profileService.searchUsers).toHaveBeenCalled()
      })
    })
  })

  describe('Modal Variant', () => {
    it('should render modal variant with different layout', () => {
      render(<UserSearch variant="modal" />)

      const container = screen.getByPlaceholderText(/search for users/i).closest('.user-search')
      expect(container).toHaveClass('user-search--modal')
    })

    it('should render autofocus input in modal variant', () => {
      render(<UserSearch variant="modal" />)

      const input = screen.getByPlaceholderText(/search for users/i)
      expect(input).toHaveAttribute('autoFocus')
    })

    it('should display search suggestions in modal variant', async () => {
      localStorage.setItem('cryb_recent_searches', JSON.stringify(['test search']))

      render(<UserSearch variant="modal" />)

      await waitFor(() => {
        expect(screen.getByText(/recent/i)).toBeInTheDocument()
      })
    })

    it('should show recommended users in modal variant', async () => {
      render(<UserSearch variant="modal" />)

      await waitFor(() => {
        expect(screen.getByText(/suggested/i)).toBeInTheDocument()
      })
    })

    it('should limit recommended users to 5 in modal variant', async () => {
      const manyUsers = Array.from({ length: 10 }, (_, i) => ({
        id: `user${i}`,
        username: `user${i}`,
        displayName: `User ${i}`
      }))

      profileService.getRecommendedUsers.mockResolvedValue({ users: manyUsers })

      render(<UserSearch variant="modal" />)

      await waitFor(() => {
        const profileCards = screen.getAllByTestId(/profile-card-user/)
        expect(profileCards.length).toBeLessThanOrEqual(5)
      })
    })
  })

  describe('Inline Variant', () => {
    it('should render inline variant with correct class', () => {
      const { container } = render(<UserSearch variant="inline" />)

      expect(container.querySelector('.user-search--inline')).toBeInTheDocument()
    })
  })

  describe('API Integration', () => {
    it('should pass limit parameter to search API', async () => {
      const user = userEvent.setup({ delay: null })
      render(<UserSearch />)

      const input = screen.getByPlaceholderText(/search for users by name, username, or interests/i)
      await user.type(input, 'test')

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(profileService.searchUsers).toHaveBeenCalledWith('test', expect.objectContaining({
          limit: 20
        }))
      })
    })

    it('should handle empty response from API', async () => {
      profileService.searchUsers.mockResolvedValue({})

      const user = userEvent.setup({ delay: null })
      render(<UserSearch />)

      const input = screen.getByPlaceholderText(/search for users by name, username, or interests/i)
      await user.type(input, 'test')

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(screen.getByText(/no users found/i)).toBeInTheDocument()
      })
    })

    it('should handle null users array from API', async () => {
      profileService.searchUsers.mockResolvedValue({ users: null })

      const user = userEvent.setup({ delay: null })
      render(<UserSearch />)

      const input = screen.getByPlaceholderText(/search for users by name, username, or interests/i)
      await user.type(input, 'test')

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(screen.getByText(/no users found/i)).toBeInTheDocument()
      })
    })
  })

  describe('Cleanup', () => {
    it('should cleanup debounce timer on unmount', async () => {
      const user = userEvent.setup({ delay: null })
      const { unmount } = render(<UserSearch />)

      const input = screen.getByPlaceholderText(/search for users by name, username, or interests/i)
      await user.type(input, 'test')

      unmount()

      act(() => {
        jest.advanceTimersByTime(300)
      })

      expect(profileService.searchUsers).not.toHaveBeenCalled()
    })
  })
})

export default mockCurrentUser
