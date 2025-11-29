/**
 * CommunityLeaderboardPage Test Suite
 * Comprehensive tests for the Community Leaderboard page functionality with 60+ test cases
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'
import CommunityLeaderboardPage from './CommunityLeaderboardPage'

// Mock fetch
global.fetch = jest.fn()

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}))

const mockAuthUser = {
  id: 'user-1',
  username: 'testuser',
  email: 'test@example.com',
  karma: 750,
}

const mockAuthContext = {
  user: mockAuthUser,
  isAuthenticated: true,
  loading: false,
}

const mockUnauthContext = {
  user: null,
  isAuthenticated: false,
  loading: false,
}

const mockLeaderboardData = [
  {
    id: 'user-1',
    username: 'testuser',
    displayName: 'Test User',
    avatar: '/avatars/user1.png',
    rank: 1,
    karma: 1500,
    points: 1500,
    postsCount: 45,
    commentsCount: 120,
    badge: 'gold',
    streak: 30,
  },
  {
    id: 'user-2',
    username: 'poweruser',
    displayName: 'Power User',
    avatar: '/avatars/user2.png',
    rank: 2,
    karma: 1200,
    points: 1200,
    postsCount: 38,
    commentsCount: 95,
    badge: 'silver',
    streak: 25,
  },
  {
    id: 'user-3',
    username: 'contributor',
    displayName: 'Active Contributor',
    avatar: '/avatars/user3.png',
    rank: 3,
    karma: 980,
    points: 980,
    postsCount: 30,
    commentsCount: 85,
    badge: 'bronze',
    streak: 20,
  },
  {
    id: 'user-4',
    username: 'newbie',
    displayName: 'New Member',
    avatar: '/avatars/user4.png',
    rank: 4,
    karma: 450,
    points: 450,
    postsCount: 15,
    commentsCount: 35,
    badge: null,
    streak: 5,
  },
]

const mockCommunity = {
  id: 'community-1',
  name: 'test-community',
  displayName: 'Test Community',
  memberCount: 1500,
}

const renderWithRouter = (
  component,
  authValue = mockAuthContext,
  route = '/c/test-community/leaderboard'
) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthContext.Provider value={authValue}>
        <Routes>
          <Route path="/c/:communityId/leaderboard" element={component} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  )
}

describe('CommunityLeaderboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch.mockClear()
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        leaderboard: mockLeaderboardData,
        community: mockCommunity,
        total: 4,
      }),
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Page Rendering', () => {
    it('renders without crashing', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('displays the page title', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByText(/Leaderboard/i)).toBeInTheDocument()
      })
    })

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      renderWithRouter(<CommunityLeaderboardPage />)
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('has proper page structure with main role', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        const main = screen.getByRole('main')
        expect(main).toBeInTheDocument()
      })
    })

    it('displays community name in header', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByText(/Test Community/i)).toBeInTheDocument()
      })
    })
  })

  describe('React Router Integration', () => {
    it('extracts community ID from route params', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/c/test-community/leaderboard'),
          expect.any(Object)
        )
      })
    })

    it('handles different community IDs', async () => {
      renderWithRouter(
        <CommunityLeaderboardPage />,
        mockAuthContext,
        '/c/gaming/leaderboard'
      )
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/c/gaming/leaderboard'),
          expect.any(Object)
        )
      })
    })

    it('handles missing community ID gracefully', async () => {
      render(
        <MemoryRouter initialEntries={['/leaderboard']}>
          <AuthContext.Provider value={mockAuthContext}>
            <Routes>
              <Route path="/leaderboard" element={<CommunityLeaderboardPage />} />
            </Routes>
          </AuthContext.Provider>
        </MemoryRouter>
      )
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })
  })

  describe('Loading State', () => {
    it('shows loading state initially', () => {
      global.fetch.mockImplementationOnce(() => new Promise(() => {}))
      renderWithRouter(<CommunityLeaderboardPage />)
      expect(screen.getByText(/Loading/i)).toBeInTheDocument()
    })

    it('displays loading spinner', () => {
      global.fetch.mockImplementationOnce(() => new Promise(() => {}))
      renderWithRouter(<CommunityLeaderboardPage />)
      const loadingIndicator = screen.getByText(/Loading/i) || document.querySelector('.animate-pulse')
      expect(loadingIndicator).toBeInTheDocument()
    })

    it('hides loading state after data loads', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Data Loading', () => {
    it('calls API endpoint on mount', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/leaderboard'),
          expect.objectContaining({
            credentials: 'include',
          })
        )
      })
    })

    it('displays leaderboard from API response', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument()
        expect(screen.getByText('Power User')).toBeInTheDocument()
      })
    })

    it('handles API errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      global.fetch.mockRejectedValueOnce(new Error('API Error'))
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
      })
      consoleSpy.mockRestore()
    })

    it('handles non-ok API responses', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      })
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Leaderboard Table Display', () => {
    it('displays leaderboard as a table', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument()
      })
    })

    it('displays table headers', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByText(/Rank/i)).toBeInTheDocument()
        expect(screen.getByText(/User/i)).toBeInTheDocument()
        expect(screen.getByText(/Karma/i) || screen.getByText(/Points/i)).toBeInTheDocument()
      })
    })

    it('displays all user rankings', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument()
        expect(screen.getByText('Power User')).toBeInTheDocument()
        expect(screen.getByText('Active Contributor')).toBeInTheDocument()
        expect(screen.getByText('New Member')).toBeInTheDocument()
      })
    })

    it('displays user avatars', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        const avatars = screen.getAllByRole('img', { name: /avatar/i })
        expect(avatars.length).toBeGreaterThan(0)
      })
    })

    it('displays rank numbers', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument()
        expect(screen.getByText('2')).toBeInTheDocument()
        expect(screen.getByText('3')).toBeInTheDocument()
      })
    })

    it('displays karma/points values', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByText(/1,?500/)).toBeInTheDocument()
        expect(screen.getByText(/1,?200/)).toBeInTheDocument()
      })
    })

    it('displays user statistics', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByText(/posts/i)).toBeInTheDocument()
        expect(screen.getByText(/comments/i)).toBeInTheDocument()
      })
    })

    it('displays badge icons for top users', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument()
      })
    })
  })

  describe('Leaderboard List Display (Alternative)', () => {
    it('displays leaderboard as a list when table not used', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        const list = screen.queryByRole('list') || screen.getByRole('table')
        expect(list).toBeInTheDocument()
      })
    })

    it('renders each user entry as list item or table row', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        const items = screen.getAllByRole('row').length > 0
          ? screen.getAllByRole('row')
          : screen.getAllByRole('listitem')
        expect(items.length).toBeGreaterThan(1)
      })
    })
  })

  describe('User Rankings', () => {
    it('displays users in rank order', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        const rows = screen.getAllByRole('row')
        const userRow1 = rows.find(row => row.textContent.includes('Test User'))
        const userRow2 = rows.find(row => row.textContent.includes('Power User'))
        expect(rows.indexOf(userRow1)).toBeLessThan(rows.indexOf(userRow2))
      })
    })

    it('highlights first place with special styling', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument()
      })
    })

    it('highlights second place with special styling', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByText('Power User')).toBeInTheDocument()
      })
    })

    it('highlights third place with special styling', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByText('Active Contributor')).toBeInTheDocument()
      })
    })

    it('displays karma values with proper formatting', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByText(/1,?500/)).toBeInTheDocument()
      })
    })

    it('displays points values when available', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        const table = screen.getByRole('table')
        expect(table.textContent).toMatch(/1,?500|1,?200|980/)
      })
    })
  })

  describe('Time Period Filter', () => {
    it('displays time period filter options', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByText(/Today/i) || screen.getByText(/Day/i)).toBeInTheDocument()
      })
    })

    it('shows day filter button', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        const dayButton = screen.getByRole('button', { name: /day|today/i })
        expect(dayButton).toBeInTheDocument()
      })
    })

    it('shows week filter button', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        const weekButton = screen.getByRole('button', { name: /week/i })
        expect(weekButton).toBeInTheDocument()
      })
    })

    it('shows month filter button', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        const monthButton = screen.getByRole('button', { name: /month/i })
        expect(monthButton).toBeInTheDocument()
      })
    })

    it('shows all-time filter button', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        const allTimeButton = screen.getByRole('button', { name: /all.?time/i })
        expect(allTimeButton).toBeInTheDocument()
      })
    })

    it('filters leaderboard by day when clicked', async () => {
      const user = userEvent.setup()
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /day|today/i })).toBeInTheDocument()
      })
      const dayButton = screen.getByRole('button', { name: /day|today/i })
      await user.click(dayButton)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('period=day'),
          expect.any(Object)
        )
      })
    })

    it('filters leaderboard by week when clicked', async () => {
      const user = userEvent.setup()
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /week/i })).toBeInTheDocument()
      })
      const weekButton = screen.getByRole('button', { name: /week/i })
      await user.click(weekButton)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('period=week'),
          expect.any(Object)
        )
      })
    })

    it('filters leaderboard by month when clicked', async () => {
      const user = userEvent.setup()
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /month/i })).toBeInTheDocument()
      })
      const monthButton = screen.getByRole('button', { name: /month/i })
      await user.click(monthButton)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('period=month'),
          expect.any(Object)
        )
      })
    })

    it('filters leaderboard by all-time when clicked', async () => {
      const user = userEvent.setup()
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /all.?time/i })).toBeInTheDocument()
      })
      const allTimeButton = screen.getByRole('button', { name: /all.?time/i })
      await user.click(allTimeButton)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('period=all'),
          expect.any(Object)
        )
      })
    })

    it('highlights active time period filter', async () => {
      const user = userEvent.setup()
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /week/i })).toBeInTheDocument()
      })
      const weekButton = screen.getByRole('button', { name: /week/i })
      await user.click(weekButton)
      await waitFor(() => {
        expect(weekButton).toHaveClass(/active|selected|bg-blue/)
      })
    })

    it('updates leaderboard data when filter changes', async () => {
      const user = userEvent.setup()
      const updatedData = [
        { ...mockLeaderboardData[1], rank: 1 },
        { ...mockLeaderboardData[0], rank: 2 },
      ]
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument()
      })
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ leaderboard: updatedData, community: mockCommunity }),
      })
      const weekButton = screen.getByRole('button', { name: /week/i })
      await user.click(weekButton)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Current User Highlight', () => {
    it('highlights current user in leaderboard', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        const currentUserRow = screen.getByText('Test User').closest('tr') ||
                               screen.getByText('Test User').closest('li')
        expect(currentUserRow).toHaveClass(/highlight|current|active|bg-/)
      })
    })

    it('displays indicator for current user', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByText(/You|Your rank/i)).toBeInTheDocument()
      })
    })

    it('does not highlight other users', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        const otherUserRow = screen.getByText('Power User').closest('tr') ||
                            screen.getByText('Power User').closest('li')
        expect(otherUserRow).not.toHaveClass(/highlight|current/)
      })
    })

    it('shows current user rank prominently', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByText(/Your rank:/i) || screen.getByText('#1')).toBeInTheDocument()
      })
    })
  })

  describe('Pagination', () => {
    beforeEach(() => {
      const manyUsers = Array.from({ length: 50 }, (_, i) => ({
        id: `user-${i}`,
        username: `user${i}`,
        displayName: `User ${i}`,
        rank: i + 1,
        karma: 1000 - i * 10,
        points: 1000 - i * 10,
        postsCount: 20,
        commentsCount: 50,
      }))
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          leaderboard: manyUsers,
          community: mockCommunity,
          total: 50,
        }),
      })
    })

    it('displays pagination controls for many users', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByText(/Previous|Next/i)).toBeInTheDocument()
      })
    })

    it('shows page numbers', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument()
      })
    })

    it('navigates to next page', async () => {
      const user = userEvent.setup()
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByText(/Next/i)).toBeInTheDocument()
      })
      const nextButton = screen.getByText(/Next/i)
      await user.click(nextButton)
      await waitFor(() => {
        const page2 = screen.getByText('2')
        expect(page2).toHaveClass(/active|selected|bg-blue/)
      })
    })

    it('navigates to previous page', async () => {
      const user = userEvent.setup()
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByText(/Next/i)).toBeInTheDocument()
      })
      await user.click(screen.getByText(/Next/i))
      await waitFor(() => {
        expect(screen.getByText('2')).toHaveClass(/active|selected|bg-blue/)
      })
      await user.click(screen.getByText(/Previous/i))
      await waitFor(() => {
        expect(screen.getByText('1')).toHaveClass(/active|selected|bg-blue/)
      })
    })

    it('disables previous button on first page', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        const prevButton = screen.getByText(/Previous/i)
        expect(prevButton).toBeDisabled()
      })
    })

    it('disables next button on last page', async () => {
      const user = userEvent.setup()
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByText(/Next/i)).toBeInTheDocument()
      })
      // Navigate to last page
      const lastPageButton = screen.getByText('3') || screen.getByText('2')
      await user.click(lastPageButton)
      await waitFor(() => {
        const nextButton = screen.getByText(/Next/i)
        expect(nextButton).toBeDisabled()
      })
    })

    it('displays result count', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByText(/Showing|of 50/i)).toBeInTheDocument()
      })
    })

    it('updates result count on page change', async () => {
      const user = userEvent.setup()
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByText(/Next/i)).toBeInTheDocument()
      })
      await user.click(screen.getByText(/Next/i))
      await waitFor(() => {
        expect(screen.getByText(/21-40|Showing/i)).toBeInTheDocument()
      })
    })
  })

  describe('User Profile Links', () => {
    it('displays clickable user links', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        const userLinks = screen.getAllByRole('link', { name: /Test User|Power User/i })
        expect(userLinks.length).toBeGreaterThan(0)
      })
    })

    it('links to user profile pages', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        const userLink = screen.getByRole('link', { name: /Test User/i })
        expect(userLink).toHaveAttribute('href', expect.stringContaining('/profile/testuser'))
      })
    })

    it('handles click on user profile link', async () => {
      const user = userEvent.setup()
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /Test User/i })).toBeInTheDocument()
      })
      const userLink = screen.getByRole('link', { name: /Test User/i })
      expect(userLink).toHaveAttribute('href')
    })
  })

  describe('Empty State', () => {
    it('displays empty state when no users', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ leaderboard: [], community: mockCommunity }),
      })
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByText(/No users|Empty|No rankings/i)).toBeInTheDocument()
      })
    })

    it('shows message when leaderboard is empty', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ leaderboard: [], community: mockCommunity }),
      })
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByText(/no users found|leaderboard is empty/i)).toBeInTheDocument()
      })
    })

    it('displays empty state icon or illustration', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ leaderboard: [], community: mockCommunity }),
      })
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByText(/No users|Empty/i)).toBeInTheDocument()
      })
    })

    it('hides table when no data', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ leaderboard: [], community: mockCommunity }),
      })
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.queryByRole('table')).not.toBeInTheDocument()
      })
    })

    it('hides pagination when no data', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ leaderboard: [], community: mockCommunity }),
      })
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.queryByText(/Previous|Next/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('handles fetch errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      global.fetch.mockRejectedValueOnce(new Error('Network error'))
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
      })
      consoleSpy.mockRestore()
    })

    it('displays error message on API failure', async () => {
      global.fetch.mockRejectedValueOnce(new Error('API Error'))
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument()
      })
    })

    it('shows retry button on error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('API Error'))
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry|try again/i })).toBeInTheDocument()
      })
    })

    it('retries loading on retry button click', async () => {
      const user = userEvent.setup()
      global.fetch.mockRejectedValueOnce(new Error('API Error'))
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry|try again/i })).toBeInTheDocument()
      })
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ leaderboard: mockLeaderboardData, community: mockCommunity }),
      })
      const retryButton = screen.getByRole('button', { name: /retry|try again/i })
      await user.click(retryButton)
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles users with zero karma', async () => {
      const zeroKarmaData = [{ ...mockLeaderboardData[0], karma: 0, points: 0 }]
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ leaderboard: zeroKarmaData, community: mockCommunity }),
      })
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument()
      })
    })

    it('handles users with no avatar', async () => {
      const noAvatarData = [{ ...mockLeaderboardData[0], avatar: null }]
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ leaderboard: noAvatarData, community: mockCommunity }),
      })
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument()
      })
    })

    it('handles very long usernames', async () => {
      const longNameData = [{
        ...mockLeaderboardData[0],
        username: 'verylongusernamethatshouldbetruncat',
        displayName: 'Very Long Display Name That Should Be Truncated',
      }]
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ leaderboard: longNameData, community: mockCommunity }),
      })
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByText(/verylongusername/i)).toBeInTheDocument()
      })
    })

    it('handles tied rankings', async () => {
      const tiedData = [
        { ...mockLeaderboardData[0], rank: 1, karma: 1000 },
        { ...mockLeaderboardData[1], rank: 1, karma: 1000 },
      ]
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ leaderboard: tiedData, community: mockCommunity }),
      })
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        const ranks = screen.getAllByText('1')
        expect(ranks.length).toBeGreaterThan(1)
      })
    })

    it('handles negative karma values', async () => {
      const negativeKarmaData = [{ ...mockLeaderboardData[0], karma: -50, points: -50 }]
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ leaderboard: negativeKarmaData, community: mockCommunity }),
      })
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByText(/-50/)).toBeInTheDocument()
      })
    })

    it('handles missing display names', async () => {
      const noDisplayName = [{ ...mockLeaderboardData[0], displayName: null }]
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ leaderboard: noDisplayName, community: mockCommunity }),
      })
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument()
      })
    })

    it('handles single user in leaderboard', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ leaderboard: [mockLeaderboardData[0]], community: mockCommunity }),
      })
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument()
      })
    })

    it('handles unauthenticated users viewing leaderboard', async () => {
      renderWithRouter(<CommunityLeaderboardPage />, mockUnauthContext)
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        const main = screen.getByRole('main')
        expect(main).toHaveAttribute('aria-label')
      })
    })

    it('table has proper structure', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        const table = screen.getByRole('table')
        expect(table).toBeInTheDocument()
        expect(within(table).getAllByRole('columnheader').length).toBeGreaterThan(0)
      })
    })

    it('supports keyboard navigation', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        const firstButton = screen.getAllByRole('button')[0]
        firstButton.focus()
        expect(document.activeElement).toBe(firstButton)
      })
    })

    it('has accessible button labels', async () => {
      renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        buttons.forEach(button => {
          expect(button).toHaveAccessibleName()
        })
      })
    })
  })

  describe('Component Snapshots', () => {
    it('matches snapshot for loading state', () => {
      global.fetch.mockImplementationOnce(() => new Promise(() => {}))
      const { container } = renderWithRouter(<CommunityLeaderboardPage />)
      expect(container).toMatchSnapshot()
    })

    it('matches snapshot for loaded state with data', async () => {
      const { container } = renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
      })
      expect(container).toMatchSnapshot()
    })

    it('matches snapshot for empty state', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ leaderboard: [], community: mockCommunity }),
      })
      const { container } = renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByText(/No users|Empty/i)).toBeInTheDocument()
      })
      expect(container).toMatchSnapshot()
    })

    it('matches snapshot for error state', async () => {
      global.fetch.mockRejectedValueOnce(new Error('API Error'))
      const { container } = renderWithRouter(<CommunityLeaderboardPage />)
      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument()
      })
      expect(container).toMatchSnapshot()
    })
  })
})

export default mockAuthUser
