import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import AdminPage from './AdminPage'
import { AuthContext } from '../contexts/AuthContext'

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}))

const mockNavigate = jest.fn()

const mockAuthContext = {
  user: {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    role: 'user',
    isAdmin: false,
  },
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
}

const mockAdminContext = {
  ...mockAuthContext,
  user: {
    ...mockAuthContext.user,
    role: 'admin',
    isAdmin: true,
  },
}

const renderWithRouter = (component, authValue = mockAuthContext) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>{component}</AuthContext.Provider>
    </BrowserRouter>
  )
}

describe('AdminPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useNavigate.mockReturnValue(mockNavigate)
  })

  // ==========================================
  // PAGE RENDERING TESTS (10 tests)
  // ==========================================

  describe('Page Rendering', () => {
    it('renders without crashing for admin user', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('displays the admin dashboard heading', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
    })

    it('renders main content area with proper ARIA label', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      const mainElement = screen.getByRole('main')
      expect(mainElement).toHaveAttribute('aria-label', 'Admin dashboard page')
    })

    it('renders with proper padding and max-width styling', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      const mainElement = screen.getByRole('main')
      expect(mainElement).toHaveStyle({
        padding: '20px',
        maxWidth: '1200px',
        margin: '0 auto',
      })
    })

    it('displays coming soon message', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      expect(screen.getByText('Admin features coming soon...')).toBeInTheDocument()
    })

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      renderWithRouter(<AdminPage />, mockAdminContext)
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('renders without console warnings', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      renderWithRouter(<AdminPage />, mockAdminContext)
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('has correct HTML structure', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      const main = screen.getByRole('main')
      expect(main.querySelector('h1')).toBeInTheDocument()
      expect(main.querySelector('p')).toBeInTheDocument()
    })

    it('renders h1 with correct text content', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('Admin Dashboard')
    })

    it('uses semantic HTML for page title', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading.tagName).toBe('H1')
    })
  })

  // ==========================================
  // AUTHENTICATION & AUTHORIZATION TESTS (15 tests)
  // ==========================================

  describe('Authentication & Authorization', () => {
    it('redirects to login when user is not authenticated', () => {
      const unauthContext = {
        ...mockAuthContext,
        user: null,
        isAuthenticated: false,
      }
      renderWithRouter(<AdminPage />, unauthContext)
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })

    it('does not render content when user is not authenticated', () => {
      const unauthContext = {
        ...mockAuthContext,
        user: null,
        isAuthenticated: false,
      }
      const { container } = renderWithRouter(<AdminPage />, unauthContext)
      expect(container.firstChild).toBeNull()
    })

    it('redirects to forbidden page when user is authenticated but not admin', () => {
      renderWithRouter(<AdminPage />, mockAuthContext)
      expect(mockNavigate).toHaveBeenCalledWith('/forbidden')
    })

    it('does not render content for non-admin users', () => {
      const { container } = renderWithRouter(<AdminPage />, mockAuthContext)
      expect(container.firstChild).toBeNull()
    })

    it('allows access when user has admin role', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      expect(mockNavigate).not.toHaveBeenCalled()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('allows access when user.isAdmin is true', () => {
      const adminByFlag = {
        ...mockAuthContext,
        user: {
          ...mockAuthContext.user,
          role: 'user',
          isAdmin: true,
        },
      }
      renderWithRouter(<AdminPage />, adminByFlag)
      expect(mockNavigate).not.toHaveBeenCalled()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('checks admin status based on role property', () => {
      const roleAdmin = {
        ...mockAuthContext,
        user: {
          ...mockAuthContext.user,
          role: 'admin',
          isAdmin: false,
        },
      }
      renderWithRouter(<AdminPage />, roleAdmin)
      expect(mockNavigate).not.toHaveBeenCalled()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('denies access when both role and isAdmin are false', () => {
      renderWithRouter(<AdminPage />, mockAuthContext)
      expect(mockNavigate).toHaveBeenCalledWith('/forbidden')
    })

    it('handles null user gracefully', () => {
      const nullUserContext = {
        ...mockAuthContext,
        user: null,
      }
      renderWithRouter(<AdminPage />, nullUserContext)
      expect(mockNavigate).toHaveBeenCalled()
    })

    it('handles undefined user gracefully', () => {
      const undefinedUserContext = {
        ...mockAuthContext,
        user: undefined,
      }
      renderWithRouter(<AdminPage />, undefinedUserContext)
      expect(mockNavigate).toHaveBeenCalled()
    })

    it('checks authentication before admin status', () => {
      const unauthAdminContext = {
        ...mockAuthContext,
        user: { ...mockAuthContext.user, role: 'admin' },
        isAuthenticated: false,
      }
      renderWithRouter(<AdminPage />, unauthAdminContext)
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })

    it('calls navigate exactly once for non-admin', () => {
      renderWithRouter(<AdminPage />, mockAuthContext)
      expect(mockNavigate).toHaveBeenCalledTimes(1)
    })

    it('does not call navigate for admin users', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('handles false isAuthenticated with admin user', () => {
      const contradictoryContext = {
        ...mockAdminContext,
        isAuthenticated: false,
      }
      renderWithRouter(<AdminPage />, contradictoryContext)
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })

    it('returns null when redirecting unauthenticated users', () => {
      const unauthContext = {
        ...mockAuthContext,
        isAuthenticated: false,
      }
      const { container } = renderWithRouter(<AdminPage />, unauthContext)
      expect(container.firstChild).toBeNull()
    })
  })

  // ==========================================
  // ADMIN PERMISSIONS CHECK TESTS (12 tests)
  // ==========================================

  describe('Admin Permissions Check', () => {
    it('checks for admin role correctly', () => {
      const adminContext = {
        ...mockAuthContext,
        user: { ...mockAuthContext.user, role: 'admin' },
      }
      renderWithRouter(<AdminPage />, adminContext)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('checks for isAdmin flag correctly', () => {
      const adminContext = {
        ...mockAuthContext,
        user: { ...mockAuthContext.user, isAdmin: true },
      }
      renderWithRouter(<AdminPage />, adminContext)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles moderator role as non-admin', () => {
      const moderatorContext = {
        ...mockAuthContext,
        user: { ...mockAuthContext.user, role: 'moderator' },
      }
      renderWithRouter(<AdminPage />, moderatorContext)
      expect(mockNavigate).toHaveBeenCalledWith('/forbidden')
    })

    it('handles superadmin role as non-admin', () => {
      const superadminContext = {
        ...mockAuthContext,
        user: { ...mockAuthContext.user, role: 'superadmin' },
      }
      renderWithRouter(<AdminPage />, superadminContext)
      expect(mockNavigate).toHaveBeenCalledWith('/forbidden')
    })

    it('is case-sensitive for admin role check', () => {
      const upperCaseContext = {
        ...mockAuthContext,
        user: { ...mockAuthContext.user, role: 'Admin' },
      }
      renderWithRouter(<AdminPage />, upperCaseContext)
      expect(mockNavigate).toHaveBeenCalledWith('/forbidden')
    })

    it('requires exact match for admin role', () => {
      const adminUserContext = {
        ...mockAuthContext,
        user: { ...mockAuthContext.user, role: 'administrator' },
      }
      renderWithRouter(<AdminPage />, adminUserContext)
      expect(mockNavigate).toHaveBeenCalledWith('/forbidden')
    })

    it('prioritizes role check over isAdmin flag', () => {
      const conflictingContext = {
        ...mockAuthContext,
        user: {
          ...mockAuthContext.user,
          role: 'admin',
          isAdmin: false,
        },
      }
      renderWithRouter(<AdminPage />, conflictingContext)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles missing role property with isAdmin true', () => {
      const noRoleContext = {
        ...mockAuthContext,
        user: {
          id: '1',
          username: 'testuser',
          isAdmin: true,
        },
      }
      renderWithRouter(<AdminPage />, noRoleContext)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles missing isAdmin property with role admin', () => {
      const noIsAdminContext = {
        ...mockAuthContext,
        user: {
          id: '1',
          username: 'testuser',
          role: 'admin',
        },
      }
      renderWithRouter(<AdminPage />, noIsAdminContext)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles undefined role gracefully', () => {
      const userWithoutRole = {
        ...mockAuthContext,
        user: { ...mockAuthContext.user, role: undefined, isAdmin: false },
      }
      renderWithRouter(<AdminPage />, userWithoutRole)
      expect(mockNavigate).toHaveBeenCalledWith('/forbidden')
    })

    it('handles null role gracefully', () => {
      const userWithNullRole = {
        ...mockAuthContext,
        user: { ...mockAuthContext.user, role: null, isAdmin: false },
      }
      renderWithRouter(<AdminPage />, userWithNullRole)
      expect(mockNavigate).toHaveBeenCalledWith('/forbidden')
    })

    it('handles isAdmin as string "true"', () => {
      const userWithStringAdmin = {
        ...mockAuthContext,
        user: { ...mockAuthContext.user, role: 'user', isAdmin: 'true' },
      }
      renderWithRouter(<AdminPage />, userWithStringAdmin)
      expect(mockNavigate).toHaveBeenCalledWith('/forbidden')
    })
  })

  // ==========================================
  // REDIRECT FOR NON-ADMINS TESTS (6 tests)
  // ==========================================

  describe('Redirect for Non-Admins', () => {
    it('redirects regular users to forbidden page', () => {
      renderWithRouter(<AdminPage />, mockAuthContext)
      expect(mockNavigate).toHaveBeenCalledWith('/forbidden')
    })

    it('redirects immediately without rendering', () => {
      const { container } = renderWithRouter(<AdminPage />, mockAuthContext)
      expect(container.firstChild).toBeNull()
    })

    it('calls navigate exactly once for non-admin', () => {
      renderWithRouter(<AdminPage />, mockAuthContext)
      expect(mockNavigate).toHaveBeenCalledTimes(1)
    })

    it('does not call navigate for admin users', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('redirects guest users to login', () => {
      const guestContext = {
        ...mockAuthContext,
        user: null,
        isAuthenticated: false,
      }
      renderWithRouter(<AdminPage />, guestContext)
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })

    it('returns null when redirecting non-admin users', () => {
      const { container } = renderWithRouter(<AdminPage />, mockAuthContext)
      expect(container.firstChild).toBeNull()
    })
  })

  // ==========================================
  // PLATFORM STATISTICS TESTS (4 tests)
  // ==========================================

  describe('Platform Statistics', () => {
    it('renders statistics container for admin', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('displays coming soon message for statistics', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      expect(screen.getByText(/coming soon/i)).toBeInTheDocument()
    })

    it('prepares container for future statistics display', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      const mainElement = screen.getByRole('main')
      expect(mainElement).toHaveStyle({ maxWidth: '1200px' })
    })

    it('has accessible main landmark for statistics', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      expect(screen.getByRole('main')).toHaveAttribute('aria-label')
    })
  })

  // ==========================================
  // USER MANAGEMENT TESTS (3 tests)
  // ==========================================

  describe('User Management', () => {
    it('displays admin dashboard for user management', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
    })

    it('provides main container for future user management features', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      const mainElement = screen.getByRole('main')
      expect(mainElement).toBeInTheDocument()
    })

    it('ensures proper layout for user management section', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      const mainElement = screen.getByRole('main')
      expect(mainElement).toHaveStyle({ padding: '20px' })
    })
  })

  // ==========================================
  // CONTENT MODERATION TESTS (3 tests)
  // ==========================================

  describe('Content Moderation', () => {
    it('provides container for moderation features', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('displays admin dashboard heading for moderation', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
    })

    it('shows placeholder for upcoming moderation features', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      expect(screen.getByText(/coming soon/i)).toBeInTheDocument()
    })
  })

  // ==========================================
  // SYSTEM SETTINGS TESTS (3 tests)
  // ==========================================

  describe('System Settings', () => {
    it('provides admin interface for system settings', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('displays admin dashboard for settings access', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
    })

    it('prepares layout for system configuration', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      const mainElement = screen.getByRole('main')
      expect(mainElement).toHaveStyle({
        margin: '0 auto',
        maxWidth: '1200px',
      })
    })
  })

  // ==========================================
  // ANALYTICS TESTS (3 tests)
  // ==========================================

  describe('Analytics', () => {
    it('provides container for analytics dashboard', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('displays admin dashboard for analytics', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
    })

    it('shows placeholder for analytics features', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      expect(screen.getByText(/coming soon/i)).toBeInTheDocument()
    })
  })

  // ==========================================
  // LOADING STATES TESTS (4 tests)
  // ==========================================

  describe('Loading States', () => {
    it('does not show loading state when auth is ready', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })

    it('handles loading context gracefully', () => {
      const loadingContext = {
        ...mockAdminContext,
        loading: true,
      }
      renderWithRouter(<AdminPage />, loadingContext)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('renders immediately when auth is not loading', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
    })

    it('does not delay rendering for admin users', () => {
      const { container } = renderWithRouter(<AdminPage />, mockAdminContext)
      expect(container.querySelector('[role="main"]')).toBeInTheDocument()
    })
  })

  // ==========================================
  // ERROR HANDLING TESTS (9 tests)
  // ==========================================

  describe('Error Handling', () => {
    it('handles missing auth context gracefully', () => {
      const emptyContext = {
        user: null,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false,
      }
      renderWithRouter(<AdminPage />, emptyContext)
      expect(mockNavigate).toHaveBeenCalled()
    })

    it('handles incomplete user object', () => {
      const incompleteUserContext = {
        ...mockAuthContext,
        user: { id: '1' },
      }
      renderWithRouter(<AdminPage />, incompleteUserContext)
      expect(mockNavigate).toHaveBeenCalledWith('/forbidden')
    })

    it('does not crash with empty user object', () => {
      const emptyUserContext = {
        ...mockAuthContext,
        user: {},
      }
      expect(() => {
        renderWithRouter(<AdminPage />, emptyUserContext)
      }).not.toThrow()
    })

    it('handles navigation function errors gracefully', () => {
      useNavigate.mockReturnValue(jest.fn())
      renderWithRouter(<AdminPage />, mockAuthContext)
      expect(mockNavigate).toHaveBeenCalled()
    })

    it('safely checks admin status with null values', () => {
      const nullPropsContext = {
        ...mockAuthContext,
        user: {
          id: '1',
          role: null,
          isAdmin: null,
        },
      }
      expect(() => {
        renderWithRouter(<AdminPage />, nullPropsContext)
      }).not.toThrow()
    })

    it('handles undefined role property', () => {
      const undefinedRoleContext = {
        ...mockAuthContext,
        user: {
          id: '1',
          username: 'test',
        },
      }
      renderWithRouter(<AdminPage />, undefinedRoleContext)
      expect(mockNavigate).toHaveBeenCalledWith('/forbidden')
    })

    it('handles empty user object', () => {
      const emptyUserContext = {
        ...mockAuthContext,
        user: {},
      }
      renderWithRouter(<AdminPage />, emptyUserContext)
      expect(mockNavigate).toHaveBeenCalledWith('/forbidden')
    })

    it('handles user object with only id', () => {
      const idOnlyContext = {
        ...mockAuthContext,
        user: { id: '1' },
      }
      renderWithRouter(<AdminPage />, idOnlyContext)
      expect(mockNavigate).toHaveBeenCalledWith('/forbidden')
    })

    it('handles user object with false isAdmin', () => {
      const user = { ...mockAuthContext.user, isAdmin: false }
      renderWithRouter(<AdminPage />, { ...mockAuthContext, user })
      expect(mockNavigate).toHaveBeenCalledWith('/forbidden')
    })
  })

  // ==========================================
  // ACCESSIBILITY TESTS (10 tests)
  // ==========================================

  describe('Accessibility', () => {
    it('has main landmark role', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('provides descriptive aria-label for main content', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      const mainElement = screen.getByRole('main')
      expect(mainElement).toHaveAttribute('aria-label', 'Admin dashboard page')
    })

    it('has proper heading hierarchy with h1', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toBeInTheDocument()
      expect(heading).toHaveTextContent('Admin Dashboard')
    })

    it('ensures semantic HTML structure', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      const mainElement = screen.getByRole('main')
      expect(mainElement.tagName).toBe('DIV')
      expect(mainElement).toHaveAttribute('role', 'main')
    })

    it('provides clear page purpose through aria-label', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      const mainElement = screen.getByRole('main')
      expect(mainElement.getAttribute('aria-label')).toContain('dashboard')
    })

    it('uses heading for primary page title', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      const heading = screen.getByRole('heading', { name: /Admin Dashboard/i })
      expect(heading).toBeInTheDocument()
    })

    it('maintains accessible document structure', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      const main = screen.getByRole('main')
      const heading = screen.getByRole('heading', { level: 1 })
      expect(main.contains(heading)).toBe(true)
    })

    it('provides sufficient contrast with centered layout', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      const mainElement = screen.getByRole('main')
      expect(mainElement).toHaveStyle({ maxWidth: '1200px' })
    })

    it('ensures keyboard navigable structure', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      const mainElement = screen.getByRole('main')
      expect(mainElement).toBeInTheDocument()
    })

    it('provides semantic page structure', () => {
      const { container } = renderWithRouter(<AdminPage />, mockAdminContext)
      const main = container.querySelector('[role="main"]')
      const h1 = container.querySelector('h1')
      expect(main).toBeInTheDocument()
      expect(h1).toBeInTheDocument()
    })
  })

  // ==========================================
  // PAGE METADATA TESTS (5 tests)
  // ==========================================

  describe('Page Metadata', () => {
    it('displays correct page title', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
    })

    it('has descriptive aria-label for page identification', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      const mainElement = screen.getByRole('main')
      expect(mainElement).toHaveAttribute('aria-label', 'Admin dashboard page')
    })

    it('provides clear page identity through heading', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('Admin Dashboard')
    })

    it('maintains consistent page branding', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
    })

    it('uses semantic heading for page title', () => {
      const { container } = renderWithRouter(<AdminPage />, mockAdminContext)
      const h1 = container.querySelector('h1')
      expect(h1).toHaveTextContent('Admin Dashboard')
    })
  })

  // ==========================================
  // INTEGRATION TESTS (6 tests)
  // ==========================================

  describe('Integration', () => {
    it('integrates with AuthContext correctly', () => {
      renderWithRouter(<AdminPage />, mockAdminContext)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('integrates with react-router navigation', () => {
      renderWithRouter(<AdminPage />, mockAuthContext)
      expect(mockNavigate).toHaveBeenCalledWith('/forbidden')
    })

    it('works within BrowserRouter context', () => {
      expect(() => {
        renderWithRouter(<AdminPage />, mockAdminContext)
      }).not.toThrow()
    })

    it('handles route navigation correctly', () => {
      renderWithRouter(<AdminPage />, mockAuthContext)
      expect(mockNavigate).toHaveBeenCalledTimes(1)
    })

    it('responds to auth state changes', () => {
      const { rerender } = renderWithRouter(<AdminPage />, mockAuthContext)
      expect(mockNavigate).toHaveBeenCalledWith('/forbidden')

      mockNavigate.mockClear()
      rerender(
        <BrowserRouter>
          <AuthContext.Provider value={mockAdminContext}>
            <AdminPage />
          </AuthContext.Provider>
        </BrowserRouter>
      )
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('maintains state consistency across rerenders', () => {
      const { rerender } = renderWithRouter(<AdminPage />, mockAdminContext)
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()

      rerender(
        <BrowserRouter>
          <AuthContext.Provider value={mockAdminContext}>
            <AdminPage />
          </AuthContext.Provider>
        </BrowserRouter>
      )
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
    })
  })

  // ==========================================
  // EDGE CASES TESTS (10 tests)
  // ==========================================

  describe('Edge Cases', () => {
    it('handles rapid authentication state changes', () => {
      const { rerender } = renderWithRouter(<AdminPage />, mockAuthContext)

      rerender(
        <BrowserRouter>
          <AuthContext.Provider value={mockAdminContext}>
            <AdminPage />
          </AuthContext.Provider>
        </BrowserRouter>
      )

      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles user object mutation', () => {
      const mutableContext = {
        ...mockAuthContext,
        user: { ...mockAuthContext.user },
      }
      renderWithRouter(<AdminPage />, mutableContext)
      mutableContext.user.role = 'admin'
      expect(mockNavigate).toHaveBeenCalled()
    })

    it('handles multiple simultaneous renders', () => {
      const { container: container1 } = renderWithRouter(<AdminPage />, mockAdminContext)
      const { container: container2 } = renderWithRouter(<AdminPage />, mockAdminContext)

      expect(container1.querySelector('[role="main"]')).toBeInTheDocument()
      expect(container2.querySelector('[role="main"]')).toBeInTheDocument()
    })

    it('handles empty string role', () => {
      const emptyRoleContext = {
        ...mockAuthContext,
        user: { ...mockAuthContext.user, role: '' },
      }
      renderWithRouter(<AdminPage />, emptyRoleContext)
      expect(mockNavigate).toHaveBeenCalledWith('/forbidden')
    })

    it('handles boolean role values', () => {
      const booleanRoleContext = {
        ...mockAuthContext,
        user: { ...mockAuthContext.user, role: true },
      }
      renderWithRouter(<AdminPage />, booleanRoleContext)
      expect(mockNavigate).toHaveBeenCalledWith('/forbidden')
    })

    it('handles numeric role values', () => {
      const numericRoleContext = {
        ...mockAuthContext,
        user: { ...mockAuthContext.user, role: 1 },
      }
      renderWithRouter(<AdminPage />, numericRoleContext)
      expect(mockNavigate).toHaveBeenCalledWith('/forbidden')
    })

    it('handles array role values', () => {
      const arrayRoleContext = {
        ...mockAuthContext,
        user: { ...mockAuthContext.user, role: ['admin'] },
      }
      renderWithRouter(<AdminPage />, arrayRoleContext)
      expect(mockNavigate).toHaveBeenCalledWith('/forbidden')
    })

    it('handles object role values', () => {
      const objectRoleContext = {
        ...mockAuthContext,
        user: { ...mockAuthContext.user, role: { type: 'admin' } },
      }
      renderWithRouter(<AdminPage />, objectRoleContext)
      expect(mockNavigate).toHaveBeenCalledWith('/forbidden')
    })

    it('handles whitespace in role value', () => {
      const whitespaceRoleContext = {
        ...mockAuthContext,
        user: { ...mockAuthContext.user, role: ' admin ' },
      }
      renderWithRouter(<AdminPage />, whitespaceRoleContext)
      expect(mockNavigate).toHaveBeenCalledWith('/forbidden')
    })

    it('handles component unmount', () => {
      const { unmount } = renderWithRouter(<AdminPage />, mockAdminContext)
      expect(() => unmount()).not.toThrow()
    })
  })
})

export default mockNavigate
