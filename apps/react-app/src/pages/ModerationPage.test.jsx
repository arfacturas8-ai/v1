/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import ModerationPage from './ModerationPage';

// Mock react-router-dom navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Helper to render with AuthContext and Router
const renderWithAuth = (component, authValue) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>
        {component}
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

// Mock user data
const mockModeratorUser = {
  id: 'user-1',
  username: 'moderator',
  email: 'moderator@example.com',
  role: 'moderator',
  isVerified: true,
};

const mockAdminUser = {
  id: 'user-2',
  username: 'admin',
  email: 'admin@example.com',
  role: 'admin',
  isVerified: true,
};

const mockRegularUser = {
  id: 'user-3',
  username: 'user',
  email: 'user@example.com',
  role: 'user',
  isVerified: true,
};

// Mock auth contexts
const mockModeratorContext = {
  user: mockModeratorUser,
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
  error: null,
};

const mockAdminContext = {
  user: mockAdminUser,
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
  error: null,
};

const mockUserContext = {
  user: mockRegularUser,
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
  error: null,
};

const mockUnauthContext = {
  user: null,
  isAuthenticated: false,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
  error: null,
};

describe('ModerationPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('Page Rendering', () => {
    it('renders page without crashing with moderator role', () => {
      const { container } = renderWithAuth(<ModerationPage />, mockModeratorContext);
      expect(container).toBeInTheDocument();
    });

    it('renders page without crashing with admin role', () => {
      const { container } = renderWithAuth(<ModerationPage />, mockAdminContext);
      expect(container).toBeInTheDocument();
    });

    it('renders main content area', () => {
      renderWithAuth(<ModerationPage />, mockModeratorContext);
      const mainElement = screen.getByRole('main');
      expect(mainElement).toBeInTheDocument();
    });

    it('displays page title', () => {
      renderWithAuth(<ModerationPage />, mockModeratorContext);
      expect(screen.getByText('Moderation Dashboard')).toBeInTheDocument();
    });

    it('displays coming soon message', () => {
      renderWithAuth(<ModerationPage />, mockModeratorContext);
      expect(screen.getByText('Moderation features coming soon...')).toBeInTheDocument();
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithAuth(<ModerationPage />, mockModeratorContext);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('renders without console warnings', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      renderWithAuth(<ModerationPage />, mockModeratorContext);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('applies correct styling to container', () => {
      renderWithAuth(<ModerationPage />, mockModeratorContext);
      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveStyle({
        padding: '20px',
        maxWidth: '1200px',
        margin: '0 auto',
      });
    });
  });

  describe('User Permissions - Moderator Access', () => {
    it('allows moderator to access page', () => {
      renderWithAuth(<ModerationPage />, mockModeratorContext);
      expect(mockNavigate).not.toHaveBeenCalledWith('/forbidden');
      expect(screen.getByText('Moderation Dashboard')).toBeInTheDocument();
    });

    it('allows admin to access page', () => {
      renderWithAuth(<ModerationPage />, mockAdminContext);
      expect(mockNavigate).not.toHaveBeenCalledWith('/forbidden');
      expect(screen.getByText('Moderation Dashboard')).toBeInTheDocument();
    });

    it('displays content for moderator', () => {
      renderWithAuth(<ModerationPage />, mockModeratorContext);
      const mainElement = screen.getByRole('main');
      expect(mainElement).toBeInTheDocument();
    });

    it('displays content for admin', () => {
      renderWithAuth(<ModerationPage />, mockAdminContext);
      const mainElement = screen.getByRole('main');
      expect(mainElement).toBeInTheDocument();
    });

    it('does not show error for moderator', () => {
      renderWithAuth(<ModerationPage />, mockModeratorContext);
      expect(screen.queryByText(/unauthorized/i)).not.toBeInTheDocument();
    });

    it('does not show error for admin', () => {
      renderWithAuth(<ModerationPage />, mockAdminContext);
      expect(screen.queryByText(/unauthorized/i)).not.toBeInTheDocument();
    });
  });

  describe('User Permissions - Denied Access', () => {
    it('redirects unauthenticated user to login', () => {
      renderWithAuth(<ModerationPage />, mockUnauthContext);
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('redirects regular user to forbidden page', () => {
      renderWithAuth(<ModerationPage />, mockUserContext);
      expect(mockNavigate).toHaveBeenCalledWith('/forbidden');
    });

    it('returns null for unauthenticated user', () => {
      const { container } = renderWithAuth(<ModerationPage />, mockUnauthContext);
      expect(container.firstChild).toBeNull();
    });

    it('returns null for non-moderator user', () => {
      const { container } = renderWithAuth(<ModerationPage />, mockUserContext);
      expect(container.firstChild).toBeNull();
    });

    it('does not render content for unauthenticated user', () => {
      renderWithAuth(<ModerationPage />, mockUnauthContext);
      expect(screen.queryByText('Moderation Dashboard')).not.toBeInTheDocument();
    });

    it('does not render content for regular user', () => {
      renderWithAuth(<ModerationPage />, mockUserContext);
      expect(screen.queryByText('Moderation Dashboard')).not.toBeInTheDocument();
    });

    it('blocks user with null role', () => {
      const nullRoleContext = {
        ...mockUserContext,
        user: { ...mockRegularUser, role: null },
      };
      renderWithAuth(<ModerationPage />, nullRoleContext);
      expect(mockNavigate).toHaveBeenCalledWith('/forbidden');
    });

    it('blocks user with undefined role', () => {
      const undefinedRoleContext = {
        ...mockUserContext,
        user: { ...mockRegularUser, role: undefined },
      };
      renderWithAuth(<ModerationPage />, undefinedRoleContext);
      expect(mockNavigate).toHaveBeenCalledWith('/forbidden');
    });

    it('blocks user with empty string role', () => {
      const emptyRoleContext = {
        ...mockUserContext,
        user: { ...mockRegularUser, role: '' },
      };
      renderWithAuth(<ModerationPage />, emptyRoleContext);
      expect(mockNavigate).toHaveBeenCalledWith('/forbidden');
    });

    it('blocks user with invalid role', () => {
      const invalidRoleContext = {
        ...mockUserContext,
        user: { ...mockRegularUser, role: 'invalid' },
      };
      renderWithAuth(<ModerationPage />, invalidRoleContext);
      expect(mockNavigate).toHaveBeenCalledWith('/forbidden');
    });
  });

  describe('Authentication State', () => {
    it('checks authentication before role', () => {
      renderWithAuth(<ModerationPage />, mockUnauthContext);
      expect(mockNavigate).toHaveBeenCalledWith('/login');
      expect(mockNavigate).not.toHaveBeenCalledWith('/forbidden');
    });

    it('handles null user object', () => {
      const nullUserContext = {
        ...mockUnauthContext,
        user: null,
        isAuthenticated: false,
      };
      renderWithAuth(<ModerationPage />, nullUserContext);
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('handles authenticated but no user data', () => {
      const noUserDataContext = {
        ...mockModeratorContext,
        user: null,
        isAuthenticated: true,
      };
      renderWithAuth(<ModerationPage />, noUserDataContext);
      expect(mockNavigate).toHaveBeenCalled();
    });

    it('respects isAuthenticated flag as false', () => {
      renderWithAuth(<ModerationPage />, mockUnauthContext);
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('respects isAuthenticated flag as true', () => {
      renderWithAuth(<ModerationPage />, mockModeratorContext);
      expect(mockNavigate).not.toHaveBeenCalledWith('/login');
    });
  });

  describe('Role-Based Logic', () => {
    it('correctly identifies moderator role', () => {
      renderWithAuth(<ModerationPage />, mockModeratorContext);
      expect(screen.getByText('Moderation Dashboard')).toBeInTheDocument();
    });

    it('correctly identifies admin role', () => {
      renderWithAuth(<ModerationPage />, mockAdminContext);
      expect(screen.getByText('Moderation Dashboard')).toBeInTheDocument();
    });

    it('treats admin as moderator', () => {
      renderWithAuth(<ModerationPage />, mockAdminContext);
      expect(mockNavigate).not.toHaveBeenCalledWith('/forbidden');
    });

    it('rejects user role', () => {
      renderWithAuth(<ModerationPage />, mockUserContext);
      expect(mockNavigate).toHaveBeenCalledWith('/forbidden');
    });

    it('is case-sensitive for roles', () => {
      const capitalizedRoleContext = {
        ...mockUserContext,
        user: { ...mockRegularUser, role: 'Moderator' },
      };
      renderWithAuth(<ModerationPage />, capitalizedRoleContext);
      expect(mockNavigate).toHaveBeenCalledWith('/forbidden');
    });
  });

  describe('Accessibility', () => {
    it('has proper main landmark', () => {
      renderWithAuth(<ModerationPage />, mockModeratorContext);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('has aria-label on main element', () => {
      renderWithAuth(<ModerationPage />, mockModeratorContext);
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', 'Moderation page');
    });

    it('has proper heading hierarchy', () => {
      renderWithAuth(<ModerationPage />, mockModeratorContext);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Moderation Dashboard');
    });

    it('heading is properly nested in main', () => {
      renderWithAuth(<ModerationPage />, mockModeratorContext);
      const main = screen.getByRole('main');
      const heading = within(main).getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('uses semantic HTML for content', () => {
      renderWithAuth(<ModerationPage />, mockModeratorContext);
      const main = screen.getByRole('main');
      const heading = screen.getByRole('heading', { level: 1 });
      expect(main).toContainElement(heading);
    });

    it('text content is readable', () => {
      renderWithAuth(<ModerationPage />, mockModeratorContext);
      expect(screen.getByText('Moderation Dashboard')).toBeVisible();
      expect(screen.getByText('Moderation features coming soon...')).toBeVisible();
    });

    it('no accessibility violations in main structure', () => {
      renderWithAuth(<ModerationPage />, mockModeratorContext);
      const main = screen.getByRole('main');
      expect(main.tagName).toBe('DIV');
      expect(main).toHaveAttribute('role', 'main');
    });
  });

  describe('Page Metadata', () => {
    it('renders with correct component name', () => {
      renderWithAuth(<ModerationPage />, mockModeratorContext);
      expect(screen.getByText('Moderation Dashboard')).toBeInTheDocument();
    });

    it('displays appropriate title text', () => {
      renderWithAuth(<ModerationPage />, mockModeratorContext);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Moderation Dashboard');
    });

    it('shows coming soon placeholder', () => {
      renderWithAuth(<ModerationPage />, mockModeratorContext);
      expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('renders single main container', () => {
      renderWithAuth(<ModerationPage />, mockModeratorContext);
      const mains = screen.getAllByRole('main');
      expect(mains).toHaveLength(1);
    });

    it('renders heading inside main', () => {
      renderWithAuth(<ModerationPage />, mockModeratorContext);
      const main = screen.getByRole('main');
      expect(main).toContainHTML('<h1>');
    });

    it('renders paragraph inside main', () => {
      renderWithAuth(<ModerationPage />, mockModeratorContext);
      const main = screen.getByRole('main');
      expect(main).toContainHTML('<p>');
    });

    it('has correct DOM hierarchy', () => {
      renderWithAuth(<ModerationPage />, mockModeratorContext);
      const main = screen.getByRole('main');
      expect(main.children).toHaveLength(2); // h1 and p
    });
  });

  describe('Layout and Styling', () => {
    it('has responsive max-width', () => {
      renderWithAuth(<ModerationPage />, mockModeratorContext);
      const main = screen.getByRole('main');
      expect(main).toHaveStyle({ maxWidth: '1200px' });
    });

    it('has centered layout', () => {
      renderWithAuth(<ModerationPage />, mockModeratorContext);
      const main = screen.getByRole('main');
      expect(main).toHaveStyle({ margin: '0 auto' });
    });

    it('has proper padding', () => {
      renderWithAuth(<ModerationPage />, mockModeratorContext);
      const main = screen.getByRole('main');
      expect(main).toHaveStyle({ padding: '20px' });
    });

    it('layout persists across renders', () => {
      const { rerender } = renderWithAuth(<ModerationPage />, mockModeratorContext);
      const main1 = screen.getByRole('main');
      const style1 = main1.style;

      rerender(
        <BrowserRouter>
          <AuthContext.Provider value={mockModeratorContext}>
            <ModerationPage />
          </AuthContext.Provider>
        </BrowserRouter>
      );

      const main2 = screen.getByRole('main');
      expect(main2.style).toEqual(style1);
    });
  });

  describe('Edge Cases', () => {
    it('handles missing user object gracefully', () => {
      const missingUserContext = {
        ...mockModeratorContext,
        user: undefined,
      };
      renderWithAuth(<ModerationPage />, missingUserContext);
      expect(mockNavigate).toHaveBeenCalled();
    });

    it('handles missing role field', () => {
      const noRoleContext = {
        ...mockModeratorContext,
        user: { ...mockModeratorUser, role: undefined },
      };
      renderWithAuth(<ModerationPage />, noRoleContext);
      expect(mockNavigate).toHaveBeenCalledWith('/forbidden');
    });

    it('handles empty auth context', () => {
      const emptyContext = {};
      renderWithAuth(<ModerationPage />, emptyContext);
      expect(mockNavigate).toHaveBeenCalled();
    });

    it('handles isAuthenticated undefined', () => {
      const undefinedAuthContext = {
        ...mockModeratorContext,
        isAuthenticated: undefined,
      };
      renderWithAuth(<ModerationPage />, undefinedAuthContext);
      expect(mockNavigate).toHaveBeenCalled();
    });

    it('does not crash with null context provider value', () => {
      expect(() => {
        render(
          <BrowserRouter>
            <AuthContext.Provider value={null}>
              <ModerationPage />
            </AuthContext.Provider>
          </BrowserRouter>
        );
      }).not.toThrow();
    });
  });

  describe('Navigation Behavior', () => {
    it('calls navigate with correct path for unauthenticated', () => {
      renderWithAuth(<ModerationPage />, mockUnauthContext);
      expect(mockNavigate).toHaveBeenCalledWith('/login');
      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });

    it('calls navigate with correct path for unauthorized', () => {
      renderWithAuth(<ModerationPage />, mockUserContext);
      expect(mockNavigate).toHaveBeenCalledWith('/forbidden');
      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });

    it('does not navigate for authorized moderator', () => {
      renderWithAuth(<ModerationPage />, mockModeratorContext);
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('does not navigate for authorized admin', () => {
      renderWithAuth(<ModerationPage />, mockAdminContext);
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('navigation happens immediately', () => {
      renderWithAuth(<ModerationPage />, mockUnauthContext);
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('prevents render after navigation for unauth', () => {
      const { container } = renderWithAuth(<ModerationPage />, mockUnauthContext);
      expect(container.firstChild).toBeNull();
    });

    it('prevents render after navigation for unauthorized', () => {
      const { container } = renderWithAuth(<ModerationPage />, mockUserContext);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Component Lifecycle', () => {
    it('renders consistently on multiple renders', () => {
      const { rerender } = renderWithAuth(<ModerationPage />, mockModeratorContext);
      expect(screen.getByText('Moderation Dashboard')).toBeInTheDocument();

      rerender(
        <BrowserRouter>
          <AuthContext.Provider value={mockModeratorContext}>
            <ModerationPage />
          </AuthContext.Provider>
        </BrowserRouter>
      );
      expect(screen.getByText('Moderation Dashboard')).toBeInTheDocument();
    });

    it('updates correctly when auth changes', () => {
      const { rerender } = renderWithAuth(<ModerationPage />, mockModeratorContext);
      expect(screen.getByText('Moderation Dashboard')).toBeInTheDocument();

      rerender(
        <BrowserRouter>
          <AuthContext.Provider value={mockUnauthContext}>
            <ModerationPage />
          </AuthContext.Provider>
        </BrowserRouter>
      );
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('handles role change from moderator to user', () => {
      const { rerender } = renderWithAuth(<ModerationPage />, mockModeratorContext);
      expect(screen.getByText('Moderation Dashboard')).toBeInTheDocument();

      rerender(
        <BrowserRouter>
          <AuthContext.Provider value={mockUserContext}>
            <ModerationPage />
          </AuthContext.Provider>
        </BrowserRouter>
      );
      expect(mockNavigate).toHaveBeenCalledWith('/forbidden');
    });
  });

  describe('Context Integration', () => {
    it('uses AuthContext properly', () => {
      renderWithAuth(<ModerationPage />, mockModeratorContext);
      expect(screen.getByText('Moderation Dashboard')).toBeInTheDocument();
    });

    it('accesses user from context', () => {
      renderWithAuth(<ModerationPage />, mockModeratorContext);
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('accesses isAuthenticated from context', () => {
      renderWithAuth(<ModerationPage />, mockUnauthContext);
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('responds to context changes', () => {
      const { rerender } = renderWithAuth(<ModerationPage />, mockModeratorContext);
      mockNavigate.mockClear();

      rerender(
        <BrowserRouter>
          <AuthContext.Provider value={mockUnauthContext}>
            <ModerationPage />
          </AuthContext.Provider>
        </BrowserRouter>
      );
      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  describe('Future Features Preparation', () => {
    it('displays coming soon message for features', () => {
      renderWithAuth(<ModerationPage />, mockModeratorContext);
      expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
    });

    it('has structure ready for dashboard expansion', () => {
      renderWithAuth(<ModerationPage />, mockModeratorContext);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('maintains semantic structure for future additions', () => {
      renderWithAuth(<ModerationPage />, mockModeratorContext);
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });

  describe('Text Content', () => {
    it('displays correct dashboard title', () => {
      renderWithAuth(<ModerationPage />, mockModeratorContext);
      expect(screen.getByText('Moderation Dashboard')).toBeInTheDocument();
    });

    it('title is in heading tag', () => {
      renderWithAuth(<ModerationPage />, mockModeratorContext);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Moderation Dashboard');
    });

    it('displays placeholder message', () => {
      renderWithAuth(<ModerationPage />, mockModeratorContext);
      const paragraph = screen.getByText('Moderation features coming soon...');
      expect(paragraph).toBeInTheDocument();
    });

    it('placeholder message is in paragraph', () => {
      renderWithAuth(<ModerationPage />, mockModeratorContext);
      const main = screen.getByRole('main');
      const p = main.querySelector('p');
      expect(p).toHaveTextContent('Moderation features coming soon...');
    });
  });
});

export default mockNavigate
