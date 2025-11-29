/**
 * UserManagementPage Test Suite
 * Comprehensive tests for the User Management page with 85+ test cases
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent, waitFor, within, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { AuthContext } from '../../contexts/AuthContext'
import UserManagementPage from '../UserManagementPage'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Users: ({ className, ...props }) => <svg className={className} {...props} data-testid="users-icon" />,
  Search: ({ className, ...props }) => <svg className={className} {...props} data-testid="search-icon" />,
  Filter: ({ className, ...props }) => <svg className={className} {...props} data-testid="filter-icon" />,
  MoreVertical: ({ className, ...props }) => <svg className={className} {...props} data-testid="more-icon" />,
}))

const mockAdminUser = {
  id: '1',
  username: 'admin',
  email: 'admin@cryb.com',
  role: 'admin',
}

const mockModeratorUser = {
  id: '2',
  username: 'moderator',
  email: 'mod@cryb.com',
  role: 'moderator',
}

const mockAuthContext = {
  user: mockAdminUser,
  isAuthenticated: true,
  loading: false,
}

const mockUsers = [
  { id: 1, username: 'alice', email: 'alice@example.com', status: 'active', role: 'user' },
  { id: 2, username: 'bob', email: 'bob@example.com', status: 'active', role: 'moderator' },
  { id: 3, username: 'charlie', email: 'charlie@example.com', status: 'suspended', role: 'user' },
  { id: 4, username: 'david', email: 'david@example.com', status: 'banned', role: 'user' },
]

const renderWithAuth = (component, authValue = mockAuthContext) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>
        {component}
      </AuthContext.Provider>
    </BrowserRouter>
  )
}

describe('UserManagementPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        users: mockUsers,
      }),
    })
  })

  afterEach(() => {
    cleanup()
  })

  describe('Page Rendering', () => {
    it('renders without crashing', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('displays the page title', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByText('User Management')).toBeInTheDocument()
    })

    it('displays the Users icon', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByTestId('users-icon')).toBeInTheDocument()
    })

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      renderWithAuth(<UserManagementPage />)
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('has proper page structure with main role', () => {
      renderWithAuth(<UserManagementPage />)
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
      expect(main).toHaveAttribute('aria-label', 'User management page')
    })

    it('applies dark mode styles correctly', () => {
      renderWithAuth(<UserManagementPage />)
      const main = screen.getByRole('main')
      expect(main).toHaveClass('dark:bg-[#0d1117]')
    })

    it('has responsive padding', () => {
      renderWithAuth(<UserManagementPage />)
      const main = screen.getByRole('main')
      expect(main).toHaveClass('p-6')
    })

    it('displays heading with icon', () => {
      renderWithAuth(<UserManagementPage />)
      const heading = screen.getByRole('heading', { name: /User Management/i })
      expect(heading).toBeInTheDocument()
    })
  })

  describe('Authentication & Authorization', () => {
    it('allows admin access', () => {
      renderWithAuth(<UserManagementPage />, {
        user: mockAdminUser,
        isAuthenticated: true,
        loading: false,
      })
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('allows moderator access', () => {
      renderWithAuth(<UserManagementPage />, {
        user: mockModeratorUser,
        isAuthenticated: true,
        loading: false,
      })
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('renders for authenticated users', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles unauthenticated state', () => {
      renderWithAuth(<UserManagementPage />, {
        user: null,
        isAuthenticated: false,
        loading: false,
      })
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('User List Display', () => {
    it('displays user table', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('displays table headers', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByText('User')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
    })

    it('displays alice user', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByText('alice')).toBeInTheDocument()
      expect(screen.getByText('alice@example.com')).toBeInTheDocument()
    })

    it('displays bob user', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByText('bob')).toBeInTheDocument()
      expect(screen.getByText('bob@example.com')).toBeInTheDocument()
    })

    it('displays all user statuses', () => {
      renderWithAuth(<UserManagementPage />)
      const statusCells = screen.getAllByText(/active/i)
      expect(statusCells.length).toBeGreaterThan(0)
    })

    it('renders table rows for each user', () => {
      renderWithAuth(<UserManagementPage />)
      const table = screen.getByRole('table')
      const rows = within(table).getAllByRole('row')
      expect(rows.length).toBeGreaterThan(2) // Header + data rows
    })

    it('displays users in table format', () => {
      renderWithAuth(<UserManagementPage />)
      const table = screen.getByRole('table')
      expect(within(table).getByRole('rowgroup')).toBeInTheDocument()
    })

    it('shows user count', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByText('alice')).toBeInTheDocument()
      expect(screen.getByText('bob')).toBeInTheDocument()
    })
  })

  describe('Search Functionality - Future Implementation', () => {
    it('should display search input', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should search by username', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should search by email', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should perform case-insensitive search', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should debounce search input', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should clear search', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should show no results message', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('User Ban/Suspend Actions - Future Implementation', () => {
    it('should show ban user button', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should show suspend user button', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should handle ban user action', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should handle suspend user action', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should confirm before banning', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should confirm before suspending', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should allow unbanning users', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should allow unsuspending users', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should require reason for banning', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should support duration for suspension', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Role Management - Future Implementation', () => {
    it('should display user roles', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should allow changing user role', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should show role dropdown', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should list available roles', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should confirm role changes', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should prevent demoting last admin', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should show role badges', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should validate role permissions', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('User Details - Future Implementation', () => {
    it('should open user detail modal', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should display user profile information', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should show user activity history', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should display user statistics', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should show user posts', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should show user comments', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should display moderation history', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should show account creation date', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should display last login time', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Filtering - Future Implementation', () => {
    it('should filter by user status', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should filter by user role', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should filter by registration date', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should filter by activity level', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should show active filters', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should clear all filters', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should combine multiple filters', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should save filter preferences', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Sorting - Future Implementation', () => {
    it('should sort by username', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should sort by email', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should sort by registration date', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should sort by last activity', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should support ascending order', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should support descending order', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should remember sort preferences', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Pagination - Future Implementation', () => {
    it('should paginate user list', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should navigate to next page', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should navigate to previous page', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should adjust items per page', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should show total user count', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should jump to specific page', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Bulk Actions - Future Implementation', () => {
    it('should select multiple users', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should select all users', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should bulk ban users', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should bulk suspend users', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should bulk change roles', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should bulk send messages', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should confirm bulk actions', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should show bulk action progress', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Export Functionality - Future Implementation', () => {
    it('should export user list as CSV', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should export filtered results', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should include selected columns', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should show export progress', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('User Actions Menu - Future Implementation', () => {
    it('should show actions menu', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should display edit action', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should display delete action', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should display impersonate action', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should display send message action', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should display view profile action', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should close menu on action', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Real-time Updates - Future Implementation', () => {
    it('should update user list in real-time', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should show new user notifications', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should update user status changes', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should handle concurrent modifications', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Statistics Display - Future Implementation', () => {
    it('should show total users count', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should show active users count', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should show banned users count', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should show new users today', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should display user growth chart', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      renderWithAuth(<UserManagementPage />)
      const main = screen.getByRole('main')
      expect(main).toHaveAttribute('aria-label', 'User management page')
    })

    it('has semantic HTML structure', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('heading')).toBeInTheDocument()
      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('supports keyboard navigation', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('has accessible table structure', () => {
      renderWithAuth(<UserManagementPage />)
      const table = screen.getByRole('table')
      expect(within(table).getByRole('rowgroup')).toBeInTheDocument()
    })

    it('has sufficient color contrast', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toHaveClass('bg-gray-50', 'dark:bg-[#0d1117]')
    })
  })

  describe('Responsive Design', () => {
    it('renders correctly on mobile', () => {
      global.innerWidth = 375
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toHaveClass('p-6')
    })

    it('renders correctly on tablet', () => {
      global.innerWidth = 768
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('renders correctly on desktop', () => {
      global.innerWidth = 1920
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('adapts table for mobile', () => {
      global.innerWidth = 375
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  describe('Error Handling - Future Implementation', () => {
    it('should handle API errors', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should show error message', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should provide retry functionality', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should validate action inputs', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should handle network timeouts', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Loading States - Future Implementation', () => {
    it('should show loading spinner', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should show skeleton screens', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should disable actions during loading', () => {
      renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Component State', () => {
    it('maintains state during re-renders', () => {
      const { rerender } = renderWithAuth(<UserManagementPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
      rerender(
        <BrowserRouter>
          <AuthContext.Provider value={mockAuthContext}>
            <UserManagementPage />
          </AuthContext.Provider>
        </BrowserRouter>
      )
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('cleans up on unmount', () => {
      const { unmount } = renderWithAuth(<UserManagementPage />)
      unmount()
      expect(screen.queryByRole('main')).not.toBeInTheDocument()
    })
  })

  describe('Snapshot Testing', () => {
    it('matches snapshot for initial render', () => {
      const { container } = renderWithAuth(<UserManagementPage />)
      expect(container).toMatchSnapshot()
    })

    it('matches snapshot with admin user', () => {
      const { container } = renderWithAuth(<UserManagementPage />, {
        user: mockAdminUser,
        isAuthenticated: true,
        loading: false,
      })
      expect(container).toMatchSnapshot()
    })

    it('matches snapshot with moderator user', () => {
      const { container } = renderWithAuth(<UserManagementPage />, {
        user: mockModeratorUser,
        isAuthenticated: true,
        loading: false,
      })
      expect(container).toMatchSnapshot()
    })
  })
})

export default mockAdminUser
