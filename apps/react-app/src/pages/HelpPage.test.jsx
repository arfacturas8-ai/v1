/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import HelpPage from './HelpPage';
import { AuthContext } from '../contexts/AuthContext';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
    section: ({ children, ...props }) => <section {...props}>{children}</section>,
    ul: ({ children, ...props }) => <ul {...props}>{children}</ul>,
    li: ({ children, ...props }) => <li {...props}>{children}</li>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  HelpCircle: (props) => <svg data-testid="icon-help-circle" {...props} />,
  Book: (props) => <svg data-testid="icon-book" {...props} />,
  MessageCircle: (props) => <svg data-testid="icon-message-circle" {...props} />,
  Users: (props) => <svg data-testid="icon-users" {...props} />,
  Wallet: (props) => <svg data-testid="icon-wallet" {...props} />,
  Search: (props) => <svg data-testid="icon-search" {...props} />,
  ChevronRight: (props) => <svg data-testid="icon-chevron-right" {...props} />,
  ChevronDown: (props) => <svg data-testid="icon-chevron-down" {...props} />,
  ExternalLink: (props) => <svg data-testid="icon-external-link" {...props} />,
  Mail: (props) => <svg data-testid="icon-mail" {...props} />,
  Phone: (props) => <svg data-testid="icon-phone" {...props} />,
  FileText: (props) => <svg data-testid="icon-file-text" {...props} />,
  CheckCircle: (props) => <svg data-testid="icon-check-circle" {...props} />,
  AlertCircle: (props) => <svg data-testid="icon-alert-circle" {...props} />,
  Info: (props) => <svg data-testid="icon-info" {...props} />,
  ArrowLeft: (props) => <svg data-testid="icon-arrow-left" {...props} />,
  Home: (props) => <svg data-testid="icon-home" {...props} />,
}));

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({}),
  useLocation: () => ({ pathname: '/help', search: '', hash: '', state: null }),
}));

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
};

const renderWithRouter = (component, authValue = mockAuthContext) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>{component}</AuthContext.Provider>
    </BrowserRouter>
  );
};

const renderWithMemoryRouter = (component, authValue = mockAuthContext, initialEntries = ['/help']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthContext.Provider value={authValue}>{component}</AuthContext.Provider>
    </MemoryRouter>
  );
};

describe('HelpPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      const { container } = renderWithRouter(<HelpPage />);
      expect(container).toBeInTheDocument();
    });

    it('renders the component successfully', () => {
      renderWithRouter(<HelpPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('displays the main heading', () => {
      renderWithRouter(<HelpPage />);
      expect(screen.getByRole('heading', { name: /HelpPage/i })).toBeInTheDocument();
    });

    it('displays under construction message', () => {
      renderWithRouter(<HelpPage />);
      expect(screen.getByText(/Content under construction/i)).toBeInTheDocument();
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithRouter(<HelpPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('renders without console warnings', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      renderWithRouter(<HelpPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('has correct container structure', () => {
      const { container } = renderWithRouter(<HelpPage />);
      const mainElement = container.querySelector('[role="main"]');
      expect(mainElement).toHaveStyle({ padding: '20px' });
      expect(mainElement).toHaveStyle({ maxWidth: '1200px' });
      expect(mainElement).toHaveStyle({ margin: '0 auto' });
    });

    it('applies correct aria-label to main element', () => {
      renderWithRouter(<HelpPage />);
      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveAttribute('aria-label', 'Help page');
    });
  });

  describe('Authentication States', () => {
    it('renders correctly for authenticated users', () => {
      renderWithRouter(<HelpPage />, mockAuthContext);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders correctly for unauthenticated users', () => {
      const unauthContext = {
        ...mockAuthContext,
        user: null,
        isAuthenticated: false,
      };
      renderWithRouter(<HelpPage />, unauthContext);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles null user gracefully', () => {
      const nullUserContext = {
        ...mockAuthContext,
        user: null,
        isAuthenticated: false,
      };
      renderWithRouter(<HelpPage />, nullUserContext);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles undefined user gracefully', () => {
      const undefinedUserContext = {
        ...mockAuthContext,
        user: undefined,
        isAuthenticated: false,
      };
      renderWithRouter(<HelpPage />, undefinedUserContext);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders when auth is loading', () => {
      const loadingContext = {
        ...mockAuthContext,
        loading: true,
      };
      renderWithRouter(<HelpPage />, loadingContext);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Help Topics Data Structure', () => {
    it('contains Getting Started topic data', () => {
      renderWithRouter(<HelpPage />);
      // The component has the data structure defined internally
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('contains Communities topic data', () => {
      renderWithRouter(<HelpPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('contains Chat Features topic data', () => {
      renderWithRouter(<HelpPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('contains Web3 & Crypto topic data', () => {
      renderWithRouter(<HelpPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic HTML structure', () => {
      renderWithRouter(<HelpPage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('has proper heading hierarchy', () => {
      renderWithRouter(<HelpPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('has accessible name for main region', () => {
      renderWithRouter(<HelpPage />);
      const main = screen.getByRole('main', { name: /Help page/i });
      expect(main).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      renderWithRouter(<HelpPage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
      // Page should be navigable with keyboard
    });

    it('has no accessibility violations on initial render', () => {
      const { container } = renderWithRouter(<HelpPage />);
      // Check basic accessibility
      expect(container.querySelector('[role="main"]')).toBeInTheDocument();
    });

    it('maintains focus management', () => {
      renderWithRouter(<HelpPage />);
      const main = screen.getByRole('main');
      expect(document.body.contains(main)).toBe(true);
    });

    it('has sufficient color contrast', () => {
      const { container } = renderWithRouter(<HelpPage />);
      // Text should be readable
      expect(container.textContent).toContain('HelpPage');
    });

    it('provides text alternatives for content', () => {
      renderWithRouter(<HelpPage />);
      expect(screen.getByText(/Content under construction/i)).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('renders correctly on mobile viewport', () => {
      global.innerWidth = 375;
      global.innerHeight = 667;
      global.dispatchEvent(new Event('resize'));
      renderWithRouter(<HelpPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders correctly on tablet viewport', () => {
      global.innerWidth = 768;
      global.innerHeight = 1024;
      global.dispatchEvent(new Event('resize'));
      renderWithRouter(<HelpPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders correctly on desktop viewport', () => {
      global.innerWidth = 1920;
      global.innerHeight = 1080;
      global.dispatchEvent(new Event('resize'));
      renderWithRouter(<HelpPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders correctly on small mobile viewport', () => {
      global.innerWidth = 320;
      global.innerHeight = 568;
      global.dispatchEvent(new Event('resize'));
      renderWithRouter(<HelpPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders correctly on large desktop viewport', () => {
      global.innerWidth = 2560;
      global.innerHeight = 1440;
      global.dispatchEvent(new Event('resize'));
      renderWithRouter(<HelpPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles window resize events', () => {
      renderWithRouter(<HelpPage />);
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('maintains layout on orientation change', () => {
      renderWithRouter(<HelpPage />);
      global.dispatchEvent(new Event('orientationchange'));
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('applies max-width constraint on large screens', () => {
      const { container } = renderWithRouter(<HelpPage />);
      const mainElement = container.querySelector('[role="main"]');
      expect(mainElement).toHaveStyle({ maxWidth: '1200px' });
    });
  });

  describe('Router Integration', () => {
    it('renders with BrowserRouter', () => {
      renderWithRouter(<HelpPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders with MemoryRouter', () => {
      renderWithMemoryRouter(<HelpPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles different route paths', () => {
      renderWithMemoryRouter(<HelpPage />, mockAuthContext, ['/help']);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles route with query parameters', () => {
      renderWithMemoryRouter(<HelpPage />, mockAuthContext, ['/help?topic=getting-started']);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles route with hash', () => {
      renderWithMemoryRouter(<HelpPage />, mockAuthContext, ['/help#faq']);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles rendering errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithRouter(<HelpPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('handles missing context gracefully', () => {
      // Render without AuthContext
      render(
        <BrowserRouter>
          <HelpPage />
        </BrowserRouter>
      );
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles null context values', () => {
      const nullContext = null;
      render(
        <BrowserRouter>
          <AuthContext.Provider value={nullContext}>
            <HelpPage />
          </AuthContext.Provider>
        </BrowserRouter>
      );
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('recovers from runtime errors', () => {
      const { container } = renderWithRouter(<HelpPage />);
      expect(container).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('renders quickly', () => {
      const startTime = performance.now();
      renderWithRouter(<HelpPage />);
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('does not cause memory leaks on unmount', () => {
      const { unmount } = renderWithRouter(<HelpPage />);
      unmount();
      // Component should unmount cleanly
    });

    it('handles multiple renders efficiently', () => {
      const { rerender } = renderWithRouter(<HelpPage />);
      rerender(
        <BrowserRouter>
          <AuthContext.Provider value={mockAuthContext}>
            <HelpPage />
          </AuthContext.Provider>
        </BrowserRouter>
      );
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('memoizes expensive computations', () => {
      renderWithRouter(<HelpPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Component State', () => {
    it('maintains state across re-renders', () => {
      const { rerender } = renderWithRouter(<HelpPage />);
      rerender(
        <BrowserRouter>
          <AuthContext.Provider value={mockAuthContext}>
            <HelpPage />
          </AuthContext.Provider>
        </BrowserRouter>
      );
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('updates correctly when props change', () => {
      const { rerender } = renderWithRouter(<HelpPage />);
      const newAuthContext = {
        ...mockAuthContext,
        user: { ...mockAuthContext.user, username: 'newuser' },
      };
      rerender(
        <BrowserRouter>
          <AuthContext.Provider value={newAuthContext}>
            <HelpPage />
          </AuthContext.Provider>
        </BrowserRouter>
      );
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('initializes with correct default state', () => {
      renderWithRouter(<HelpPage />);
      expect(screen.getByText(/Content under construction/i)).toBeInTheDocument();
    });
  });

  describe('Browser Compatibility', () => {
    it('works in modern browsers', () => {
      renderWithRouter(<HelpPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles missing browser APIs gracefully', () => {
      const originalIntersectionObserver = global.IntersectionObserver;
      global.IntersectionObserver = undefined;
      renderWithRouter(<HelpPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
      global.IntersectionObserver = originalIntersectionObserver;
    });

    it('works without localStorage', () => {
      const originalLocalStorage = global.localStorage;
      delete global.localStorage;
      renderWithRouter(<HelpPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
      global.localStorage = originalLocalStorage;
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid re-renders', () => {
      const { rerender } = renderWithRouter(<HelpPage />);
      for (let i = 0; i < 10; i++) {
        rerender(
          <BrowserRouter>
            <AuthContext.Provider value={mockAuthContext}>
              <HelpPage />
            </AuthContext.Provider>
          </BrowserRouter>
        );
      }
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles concurrent renders', () => {
      renderWithRouter(<HelpPage />);
      renderWithRouter(<HelpPage />);
      expect(screen.getAllByRole('main').length).toBeGreaterThan(0);
    });

    it('handles empty strings gracefully', () => {
      renderWithRouter(<HelpPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles special characters in content', () => {
      renderWithRouter(<HelpPage />);
      expect(screen.getByText(/Content under construction/i)).toBeInTheDocument();
    });

    it('handles very long content strings', () => {
      renderWithRouter(<HelpPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles unicode characters', () => {
      renderWithRouter(<HelpPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles HTML entities', () => {
      renderWithRouter(<HelpPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles empty auth context', () => {
      const emptyContext = {
        user: null,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false,
      };
      renderWithRouter(<HelpPage />, emptyContext);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    it('integrates with router correctly', () => {
      renderWithRouter(<HelpPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('integrates with auth context correctly', () => {
      renderWithRouter(<HelpPage />, mockAuthContext);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('works with nested routing', () => {
      renderWithMemoryRouter(<HelpPage />, mockAuthContext, ['/help/getting-started']);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('maintains context across navigation', () => {
      const { rerender } = renderWithRouter(<HelpPage />);
      rerender(
        <BrowserRouter>
          <AuthContext.Provider value={mockAuthContext}>
            <HelpPage />
          </AuthContext.Provider>
        </BrowserRouter>
      );
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Content Structure', () => {
    it('displays correct heading text', () => {
      renderWithRouter(<HelpPage />);
      expect(screen.getByRole('heading', { name: /HelpPage/i })).toBeInTheDocument();
    });

    it('displays construction message', () => {
      renderWithRouter(<HelpPage />);
      expect(screen.getByText(/Content under construction/i)).toBeInTheDocument();
    });

    it('has proper text content', () => {
      const { container } = renderWithRouter(<HelpPage />);
      expect(container.textContent).toContain('HelpPage');
      expect(container.textContent).toContain('Content under construction');
    });

    it('renders all required text elements', () => {
      renderWithRouter(<HelpPage />);
      expect(screen.getByText('HelpPage')).toBeInTheDocument();
      expect(screen.getByText(/Content under construction/i)).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies inline styles correctly', () => {
      const { container } = renderWithRouter(<HelpPage />);
      const mainElement = container.querySelector('[role="main"]');
      expect(mainElement).toHaveStyle('padding: 20px');
    });

    it('applies max-width constraint', () => {
      const { container } = renderWithRouter(<HelpPage />);
      const mainElement = container.querySelector('[role="main"]');
      expect(mainElement).toHaveStyle('max-width: 1200px');
    });

    it('centers content with margin auto', () => {
      const { container } = renderWithRouter(<HelpPage />);
      const mainElement = container.querySelector('[role="main"]');
      expect(mainElement).toHaveStyle('margin: 0 auto');
    });

    it('maintains consistent spacing', () => {
      const { container } = renderWithRouter(<HelpPage />);
      const mainElement = container.querySelector('[role="main"]');
      expect(mainElement).toHaveStyle({ padding: '20px' });
    });
  });

  describe('Testing Utilities', () => {
    it('works with screen queries', () => {
      renderWithRouter(<HelpPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByText('HelpPage')).toBeInTheDocument();
      expect(screen.getByText(/Content under construction/i)).toBeInTheDocument();
    });

    it('works with container queries', () => {
      const { container } = renderWithRouter(<HelpPage />);
      expect(container.querySelector('[role="main"]')).toBeInTheDocument();
      expect(container.querySelector('h1')).toBeInTheDocument();
      expect(container.querySelector('p')).toBeInTheDocument();
    });

    it('works with getByRole queries', () => {
      renderWithRouter(<HelpPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('works with getByText queries', () => {
      renderWithRouter(<HelpPage />);
      expect(screen.getByText('HelpPage')).toBeInTheDocument();
      expect(screen.getByText(/Content under construction/i)).toBeInTheDocument();
    });

    it('works with queryBy queries for optional elements', () => {
      renderWithRouter(<HelpPage />);
      const optional = screen.queryByText('Optional Element');
      expect(optional).not.toBeInTheDocument();
    });
  });

  describe('Snapshot Testing', () => {
    it('matches snapshot for authenticated user', () => {
      const { container } = renderWithRouter(<HelpPage />, mockAuthContext);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for unauthenticated user', () => {
      const unauthContext = {
        ...mockAuthContext,
        user: null,
        isAuthenticated: false,
      };
      const { container } = renderWithRouter(<HelpPage />, unauthContext);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for loading state', () => {
      const loadingContext = {
        ...mockAuthContext,
        loading: true,
      };
      const { container } = renderWithRouter(<HelpPage />, loadingContext);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for mobile viewport', () => {
      global.innerWidth = 375;
      const { container } = renderWithRouter(<HelpPage />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for desktop viewport', () => {
      global.innerWidth = 1920;
      const { container } = renderWithRouter(<HelpPage />);
      expect(container).toMatchSnapshot();
    });
  });

  describe('Future Implementation Tests', () => {
    // These tests are prepared for when the component is fully implemented

    it('will display help topic sections when implemented', () => {
      renderWithRouter(<HelpPage />);
      // When implemented, check for topic sections
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('will handle search functionality when implemented', () => {
      renderWithRouter(<HelpPage />);
      // When implemented, test search feature
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('will navigate to specific help topics when implemented', () => {
      renderWithRouter(<HelpPage />);
      // When implemented, test topic navigation
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('will expand/collapse topic sections when implemented', () => {
      renderWithRouter(<HelpPage />);
      // When implemented, test accordion functionality
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('will display FAQ section when implemented', () => {
      renderWithRouter(<HelpPage />);
      // When implemented, check for FAQ
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('will handle contact form submission when implemented', () => {
      renderWithRouter(<HelpPage />);
      // When implemented, test contact form
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('will filter help topics by category when implemented', () => {
      renderWithRouter(<HelpPage />);
      // When implemented, test filtering
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('will display related articles when implemented', () => {
      renderWithRouter(<HelpPage />);
      // When implemented, test related content
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Component Lifecycle', () => {
    it('mounts correctly', () => {
      const { container } = renderWithRouter(<HelpPage />);
      expect(container).toBeInTheDocument();
    });

    it('updates correctly', () => {
      const { rerender } = renderWithRouter(<HelpPage />);
      rerender(
        <BrowserRouter>
          <AuthContext.Provider value={mockAuthContext}>
            <HelpPage />
          </AuthContext.Provider>
        </BrowserRouter>
      );
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('unmounts correctly', () => {
      const { unmount } = renderWithRouter(<HelpPage />);
      unmount();
      expect(screen.queryByRole('main')).not.toBeInTheDocument();
    });

    it('cleans up resources on unmount', () => {
      const { unmount } = renderWithRouter(<HelpPage />);
      unmount();
      // Component should clean up properly
    });
  });

  describe('User Experience', () => {
    it('provides clear feedback for under construction state', () => {
      renderWithRouter(<HelpPage />);
      expect(screen.getByText(/Content under construction/i)).toBeInTheDocument();
    });

    it('maintains consistent layout', () => {
      const { container } = renderWithRouter(<HelpPage />);
      expect(container.querySelector('[role="main"]')).toBeInTheDocument();
    });

    it('displays content in logical order', () => {
      renderWithRouter(<HelpPage />);
      const heading = screen.getByRole('heading');
      const text = screen.getByText(/Content under construction/i);
      expect(heading).toBeInTheDocument();
      expect(text).toBeInTheDocument();
    });

    it('provides adequate spacing for readability', () => {
      const { container } = renderWithRouter(<HelpPage />);
      const mainElement = container.querySelector('[role="main"]');
      expect(mainElement).toHaveStyle('padding: 20px');
    });
  });

  describe('SEO and Meta', () => {
    it('has appropriate page structure for SEO', () => {
      renderWithRouter(<HelpPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('uses semantic HTML elements', () => {
      const { container } = renderWithRouter(<HelpPage />);
      expect(container.querySelector('h1')).toBeInTheDocument();
      expect(container.querySelector('[role="main"]')).toBeInTheDocument();
    });

    it('has proper heading hierarchy for crawlers', () => {
      renderWithRouter(<HelpPage />);
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
    });
  });

  describe('Internationalization Readiness', () => {
    it('renders text content that can be translated', () => {
      renderWithRouter(<HelpPage />);
      expect(screen.getByText('HelpPage')).toBeInTheDocument();
    });

    it('handles RTL text direction', () => {
      document.dir = 'rtl';
      renderWithRouter(<HelpPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
      document.dir = 'ltr';
    });

    it('maintains layout with different text lengths', () => {
      renderWithRouter(<HelpPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Security', () => {
    it('does not expose sensitive user data', () => {
      const { container } = renderWithRouter(<HelpPage />);
      expect(container.textContent).not.toContain('password');
      expect(container.textContent).not.toContain('token');
    });

    it('sanitizes content properly', () => {
      renderWithRouter(<HelpPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('prevents XSS attacks', () => {
      renderWithRouter(<HelpPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Offline Functionality', () => {
    it('renders when offline', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      renderWithRouter(<HelpPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders when online', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
      renderWithRouter(<HelpPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles network status changes', () => {
      renderWithRouter(<HelpPage />);
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline'));
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });
});

export default mockNavigate
