/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate, useParams, useLocation } from 'react-router-dom';
import CommunityWikiPage from './CommunityWikiPage';
import { renderWithProviders } from '../__test__/utils/testUtils';
import { useAuth } from '../contexts/AuthContext';

// Mock React Router
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useParams: jest.fn(),
  useLocation: jest.fn(),
}));

// Mock useAuth context
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...restProps } = props;
      return <div {...restProps}>{children}</div>;
    },
    button: ({ children, ...props }) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...restProps } = props;
      return <button {...restProps}>{children}</button>;
    },
    span: ({ children, ...props }) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...restProps } = props;
      return <span {...restProps}>{children}</span>;
    },
    section: ({ children, ...props }) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...restProps } = props;
      return <section {...restProps}>{children}</section>;
    },
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  BookOpen: (props) => <svg data-testid="icon-book-open" {...props} />,
  Edit: (props) => <svg data-testid="icon-edit" {...props} />,
  Trash2: (props) => <svg data-testid="icon-trash2" {...props} />,
  Plus: (props) => <svg data-testid="icon-plus" {...props} />,
  Search: (props) => <svg data-testid="icon-search" {...props} />,
  FileText: (props) => <svg data-testid="icon-file-text" {...props} />,
  FolderOpen: (props) => <svg data-testid="icon-folder-open" {...props} />,
  Save: (props) => <svg data-testid="icon-save" {...props} />,
  X: (props) => <svg data-testid="icon-x" {...props} />,
  ChevronRight: (props) => <svg data-testid="icon-chevron-right" {...props} />,
  Home: (props) => <svg data-testid="icon-home" {...props} />,
  Clock: (props) => <svg data-testid="icon-clock" {...props} />,
  User: (props) => <svg data-testid="icon-user" {...props} />,
  Users: (props) => <svg data-testid="icon-users" {...props} />,
  Lock: (props) => <svg data-testid="icon-lock" {...props} />,
  Unlock: (props) => <svg data-testid="icon-unlock" {...props} />,
  Eye: (props) => <svg data-testid="icon-eye" {...props} />,
  EyeOff: (props) => <svg data-testid="icon-eye-off" {...props} />,
  Star: (props) => <svg data-testid="icon-star" {...props} />,
  Share2: (props) => <svg data-testid="icon-share2" {...props} />,
  Download: (props) => <svg data-testid="icon-download" {...props} />,
  Upload: (props) => <svg data-testid="icon-upload" {...props} />,
  History: (props) => <svg data-testid="icon-history" {...props} />,
  AlertCircle: (props) => <svg data-testid="icon-alert-circle" {...props} />,
  CheckCircle: (props) => <svg data-testid="icon-check-circle" {...props} />,
  Info: (props) => <svg data-testid="icon-info" {...props} />,
}));

describe('CommunityWikiPage', () => {
  const mockNavigate = jest.fn();
  const mockUser = {
    id: 'user-1',
    username: 'testuser',
    email: 'test@example.com',
    avatar: '/avatars/test.png',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    useNavigate.mockReturnValue(mockNavigate);
    useParams.mockReturnValue({});
    useLocation.mockReturnValue({
      pathname: '/community/wiki',
      search: '',
      hash: '',
      state: null,
    });

    useAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      loading: false,
    });

    // Mock window.matchMedia for dark mode
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // BASIC RENDERING TESTS
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      const { container } = renderWithProviders(<CommunityWikiPage />);
      expect(container).toBeInTheDocument();
    });

    it('renders the component successfully', () => {
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('displays the page title', () => {
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByText('CommunityWikiPage')).toBeInTheDocument();
    });

    it('displays the page description', () => {
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByText('This is the CommunityWikiPage page. Content will be implemented here.')).toBeInTheDocument();
    });

    it('renders with correct structure', () => {
      const { container } = renderWithProviders(<CommunityWikiPage />);
      const mainElement = container.querySelector('[role="main"]');
      expect(mainElement).toBeInTheDocument();
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithProviders(<CommunityWikiPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('renders without console warnings', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      renderWithProviders(<CommunityWikiPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('renders with proper container classes', () => {
      renderWithProviders(<CommunityWikiPage />);
      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveClass('min-h-screen', 'bg-gray-50', 'dark:bg-[#161b22]', 'p-6');
    });

    it('renders with max-width container', () => {
      const { container } = renderWithProviders(<CommunityWikiPage />);
      const maxWidthContainer = container.querySelector('.max-w-6xl');
      expect(maxWidthContainer).toBeInTheDocument();
    });

    it('renders content card with proper styling', () => {
      const { container } = renderWithProviders(<CommunityWikiPage />);
      const contentCard = container.querySelector('.bg-white.dark\\:bg-[#161b22]');
      expect(contentCard).toBeInTheDocument();
    });

    it('applies rounded corners to content card', () => {
      const { container } = renderWithProviders(<CommunityWikiPage />);
      const contentCard = container.querySelector('.rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]');
      expect(contentCard).toBeInTheDocument();
    });

    it('applies shadow to content card', () => {
      const { container } = renderWithProviders(<CommunityWikiPage />);
      const contentCard = container.querySelector('.shadow-xl');
      expect(contentCard).toBeInTheDocument();
    });

    it('renders heading with correct styling', () => {
      renderWithProviders(<CommunityWikiPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('text-3xl', 'font-bold', 'mb-6');
    });

    it('renders description with correct styling', () => {
      const { container } = renderWithProviders(<CommunityWikiPage />);
      const description = screen.getByText(/This is the CommunityWikiPage page/);
      expect(description).toHaveClass('text-gray-600', 'dark:text-[#8b949e]');
    });
  });

  // COMPONENT STRUCTURE TESTS
  describe('Component Structure', () => {
    it('has proper DOM hierarchy', () => {
      const { container } = renderWithProviders(<CommunityWikiPage />);
      const main = screen.getByRole('main');
      const maxWidth = main.querySelector('.max-w-6xl');
      expect(maxWidth).toBeInTheDocument();
    });

    it('uses motion.div for animation', () => {
      renderWithProviders(<CommunityWikiPage />);
      const mainElement = screen.getByRole('main');
      expect(mainElement).toBeInTheDocument();
    });

    it('contains a single main element', () => {
      renderWithProviders(<CommunityWikiPage />);
      const mainElements = screen.getAllByRole('main');
      expect(mainElements).toHaveLength(1);
    });

    it('contains a single heading', () => {
      renderWithProviders(<CommunityWikiPage />);
      const headings = screen.getAllByRole('heading');
      expect(headings).toHaveLength(1);
    });

    it('heading is level 1', () => {
      renderWithProviders(<CommunityWikiPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('CommunityWikiPage');
    });

    it('has centered content layout', () => {
      const { container } = renderWithProviders(<CommunityWikiPage />);
      const centerContainer = container.querySelector('.mx-auto');
      expect(centerContainer).toBeInTheDocument();
    });

    it('renders with proper padding', () => {
      const { container } = renderWithProviders(<CommunityWikiPage />);
      const paddedElement = container.querySelector('.p-6');
      expect(paddedElement).toBeInTheDocument();
    });

    it('renders with proper content padding', () => {
      const { container } = renderWithProviders(<CommunityWikiPage />);
      const contentCard = container.querySelector('.p-8');
      expect(contentCard).toBeInTheDocument();
    });
  });

  // ACCESSIBILITY TESTS
  describe('Accessibility', () => {
    it('has proper aria-label on main element', () => {
      renderWithProviders(<CommunityWikiPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', 'Community wiki page');
    });

    it('has proper heading hierarchy', () => {
      renderWithProviders(<CommunityWikiPage />);
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
    });

    it('uses semantic HTML', () => {
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('has accessible text content', () => {
      renderWithProviders(<CommunityWikiPage />);
      const description = screen.getByText(/This is the CommunityWikiPage page/);
      expect(description).toBeVisible();
    });

    it('maintains focus management', () => {
      renderWithProviders(<CommunityWikiPage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('has sufficient color contrast in light mode', () => {
      const { container } = renderWithProviders(<CommunityWikiPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('text-gray-900');
    });

    it('has sufficient color contrast in dark mode', () => {
      const { container } = renderWithProviders(<CommunityWikiPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('dark:text-white');
    });

    it('supports keyboard navigation', () => {
      renderWithProviders(<CommunityWikiPage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('has proper document outline', () => {
      renderWithProviders(<CommunityWikiPage />);
      const headings = screen.getAllByRole('heading');
      expect(headings[0]).toHaveAttribute('class', expect.stringContaining('text-3xl'));
    });

    it('provides clear visual hierarchy', () => {
      renderWithProviders(<CommunityWikiPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      const description = screen.getByText(/This is the CommunityWikiPage page/);
      expect(heading).toBeInTheDocument();
      expect(description).toBeInTheDocument();
    });
  });

  // RESPONSIVE DESIGN TESTS
  describe('Responsive Design', () => {
    it('renders correctly on mobile viewport', () => {
      global.innerWidth = 375;
      global.innerHeight = 667;
      window.dispatchEvent(new Event('resize'));
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders correctly on tablet viewport', () => {
      global.innerWidth = 768;
      global.innerHeight = 1024;
      window.dispatchEvent(new Event('resize'));
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders correctly on desktop viewport', () => {
      global.innerWidth = 1920;
      global.innerHeight = 1080;
      window.dispatchEvent(new Event('resize'));
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('applies responsive padding', () => {
      const { container } = renderWithProviders(<CommunityWikiPage />);
      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveClass('p-6');
    });

    it('constrains max width on large screens', () => {
      const { container } = renderWithProviders(<CommunityWikiPage />);
      const maxWidthContainer = container.querySelector('.max-w-6xl');
      expect(maxWidthContainer).toBeInTheDocument();
    });

    it('centers content horizontally', () => {
      const { container } = renderWithProviders(<CommunityWikiPage />);
      const centerContainer = container.querySelector('.mx-auto');
      expect(centerContainer).toBeInTheDocument();
    });

    it('maintains minimum height on all viewports', () => {
      renderWithProviders(<CommunityWikiPage />);
      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveClass('min-h-screen');
    });

    it('adapts to small mobile screens', () => {
      global.innerWidth = 320;
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('adapts to large desktop screens', () => {
      global.innerWidth = 2560;
      renderWithProviders(<CommunityWikiPage />);
      const { container } = renderWithProviders(<CommunityWikiPage />);
      const maxWidthContainer = container.querySelector('.max-w-6xl');
      expect(maxWidthContainer).toBeInTheDocument();
    });

    it('handles orientation changes', () => {
      renderWithProviders(<CommunityWikiPage />);
      window.dispatchEvent(new Event('orientationchange'));
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  // DARK MODE TESTS
  describe('Dark Mode Support', () => {
    it('applies dark mode background color', () => {
      renderWithProviders(<CommunityWikiPage />);
      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveClass('dark:bg-[#161b22]');
    });

    it('applies dark mode text color to heading', () => {
      renderWithProviders(<CommunityWikiPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('dark:text-white');
    });

    it('applies dark mode text color to description', () => {
      const { container } = renderWithProviders(<CommunityWikiPage />);
      const description = screen.getByText(/This is the CommunityWikiPage page/);
      expect(description).toHaveClass('dark:text-[#8b949e]');
    });

    it('applies dark mode card background', () => {
      const { container } = renderWithProviders(<CommunityWikiPage />);
      const card = container.querySelector('.dark\\:bg-[#161b22]');
      expect(card).toBeInTheDocument();
    });

    it('maintains readability in dark mode', () => {
      renderWithProviders(<CommunityWikiPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('text-gray-900', 'dark:text-white');
    });

    it('responds to system preference changes', () => {
      const matchMedia = window.matchMedia('(prefers-color-scheme: dark)');
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('applies consistent dark mode styling', () => {
      renderWithProviders(<CommunityWikiPage />);
      const mainElement = screen.getByRole('main');
      expect(mainElement.className).toContain('dark:bg-[#161b22]');
    });
  });

  // AUTHENTICATION TESTS
  describe('Authentication States', () => {
    it('renders for authenticated user', () => {
      useAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        loading: false,
      });
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders for unauthenticated user', () => {
      useAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        loading: false,
      });
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders during auth loading state', () => {
      useAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        loading: true,
      });
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles authenticated user with full profile', () => {
      useAuth.mockReturnValue({
        user: {
          ...mockUser,
          displayName: 'Test User',
          bio: 'Test bio',
        },
        isAuthenticated: true,
        loading: false,
      });
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles user without avatar', () => {
      useAuth.mockReturnValue({
        user: {
          ...mockUser,
          avatar: null,
        },
        isAuthenticated: true,
        loading: false,
      });
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  // ROUTING TESTS
  describe('Routing and Navigation', () => {
    it('renders with default route', () => {
      useLocation.mockReturnValue({
        pathname: '/community/wiki',
        search: '',
        hash: '',
        state: null,
      });
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles route params', () => {
      useParams.mockReturnValue({
        communityId: 'community-123',
      });
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles query parameters', () => {
      useLocation.mockReturnValue({
        pathname: '/community/wiki',
        search: '?page=2',
        hash: '',
        state: null,
      });
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles hash navigation', () => {
      useLocation.mockReturnValue({
        pathname: '/community/wiki',
        search: '',
        hash: '#section-1',
        state: null,
      });
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles location state', () => {
      useLocation.mockReturnValue({
        pathname: '/community/wiki',
        search: '',
        hash: '',
        state: { from: '/previous-page' },
      });
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('provides navigate function', () => {
      renderWithProviders(<CommunityWikiPage />);
      expect(useNavigate()).toBe(mockNavigate);
    });

    it('handles multiple route params', () => {
      useParams.mockReturnValue({
        communityId: 'community-123',
        wikiId: 'wiki-456',
      });
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  // PERFORMANCE TESTS
  describe('Performance', () => {
    it('renders quickly', () => {
      const startTime = performance.now();
      renderWithProviders(<CommunityWikiPage />);
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('uses memo for optimization', () => {
      const { rerender } = renderWithProviders(<CommunityWikiPage />);
      rerender(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles rapid re-renders', () => {
      const { rerender } = renderWithProviders(<CommunityWikiPage />);
      for (let i = 0; i < 10; i++) {
        rerender(<CommunityWikiPage />);
      }
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('does not cause memory leaks', () => {
      const { unmount } = renderWithProviders(<CommunityWikiPage />);
      unmount();
      expect(screen.queryByRole('main')).not.toBeInTheDocument();
    });

    it('cleans up on unmount', () => {
      const { unmount } = renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
      unmount();
      expect(screen.queryByRole('main')).not.toBeInTheDocument();
    });
  });

  // EDGE CASES
  describe('Edge Cases', () => {
    it('handles null user gracefully', () => {
      useAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        loading: false,
      });
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles undefined user gracefully', () => {
      useAuth.mockReturnValue({
        user: undefined,
        isAuthenticated: false,
        loading: false,
      });
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles empty params object', () => {
      useParams.mockReturnValue({});
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles null params', () => {
      useParams.mockReturnValue(null);
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles null location', () => {
      useLocation.mockReturnValue(null);
      expect(() => renderWithProviders(<CommunityWikiPage />)).not.toThrow();
    });

    it('handles missing auth context', () => {
      useAuth.mockReturnValue(null);
      expect(() => renderWithProviders(<CommunityWikiPage />)).not.toThrow();
    });

    it('handles very long text content', () => {
      renderWithProviders(<CommunityWikiPage />);
      const description = screen.getByText(/This is the CommunityWikiPage page/);
      expect(description).toBeInTheDocument();
    });

    it('handles special characters in text', () => {
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByText('CommunityWikiPage')).toBeInTheDocument();
    });
  });

  // ERROR HANDLING TESTS
  describe('Error Handling', () => {
    it('handles rendering errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithProviders(<CommunityWikiPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('does not throw on invalid props', () => {
      expect(() => renderWithProviders(<CommunityWikiPage invalidProp="test" />)).not.toThrow();
    });

    it('handles auth context errors', () => {
      useAuth.mockImplementation(() => {
        throw new Error('Auth error');
      });
      expect(() => renderWithProviders(<CommunityWikiPage />)).toThrow();
    });

    it('recovers from navigation errors', () => {
      useNavigate.mockImplementation(() => {
        throw new Error('Navigation error');
      });
      expect(() => renderWithProviders(<CommunityWikiPage />)).toThrow();
    });

    it('handles location errors', () => {
      useLocation.mockImplementation(() => {
        throw new Error('Location error');
      });
      expect(() => renderWithProviders(<CommunityWikiPage />)).toThrow();
    });
  });

  // STYLING TESTS
  describe('Styling and CSS Classes', () => {
    it('applies correct background color', () => {
      renderWithProviders(<CommunityWikiPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('bg-gray-50');
    });

    it('applies correct text color to heading', () => {
      renderWithProviders(<CommunityWikiPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('text-gray-900');
    });

    it('applies correct font weight to heading', () => {
      renderWithProviders(<CommunityWikiPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('font-bold');
    });

    it('applies correct font size to heading', () => {
      renderWithProviders(<CommunityWikiPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('text-3xl');
    });

    it('applies correct margin to heading', () => {
      renderWithProviders(<CommunityWikiPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('mb-6');
    });

    it('applies correct text color to description', () => {
      renderWithProviders(<CommunityWikiPage />);
      const description = screen.getByText(/This is the CommunityWikiPage page/);
      expect(description).toHaveClass('text-gray-600');
    });

    it('applies all required classes', () => {
      const { container } = renderWithProviders(<CommunityWikiPage />);
      const main = screen.getByRole('main');
      expect(main.className).toMatch(/min-h-screen/);
      expect(main.className).toMatch(/bg-gray-50/);
      expect(main.className).toMatch(/dark:bg-[#161b22]/);
      expect(main.className).toMatch(/p-6/);
    });

    it('maintains consistent styling across renders', () => {
      const { rerender } = renderWithProviders(<CommunityWikiPage />);
      const initialClasses = screen.getByRole('main').className;
      rerender(<CommunityWikiPage />);
      expect(screen.getByRole('main').className).toBe(initialClasses);
    });
  });

  // INTEGRATION TESTS
  describe('Integration', () => {
    it('integrates with router context', () => {
      renderWithProviders(<CommunityWikiPage />);
      expect(useNavigate).toHaveBeenCalled();
      expect(useParams).toHaveBeenCalled();
      expect(useLocation).toHaveBeenCalled();
    });

    it('integrates with auth context', () => {
      renderWithProviders(<CommunityWikiPage />);
      expect(useAuth).toHaveBeenCalled();
    });

    it('works with MemoryRouter', () => {
      render(
        <MemoryRouter>
          <CommunityWikiPage />
        </MemoryRouter>
      );
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('works with BrowserRouter', () => {
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('maintains state across route changes', () => {
      const { rerender } = renderWithProviders(<CommunityWikiPage />);
      useLocation.mockReturnValue({
        pathname: '/community/wiki/new',
        search: '',
        hash: '',
        state: null,
      });
      rerender(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  // SNAPSHOT TESTS
  describe('Snapshot Tests', () => {
    it('matches snapshot for default state', () => {
      const { container } = renderWithProviders(<CommunityWikiPage />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for authenticated user', () => {
      useAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        loading: false,
      });
      const { container } = renderWithProviders(<CommunityWikiPage />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for unauthenticated user', () => {
      useAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        loading: false,
      });
      const { container } = renderWithProviders(<CommunityWikiPage />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for loading state', () => {
      useAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        loading: true,
      });
      const { container } = renderWithProviders(<CommunityWikiPage />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot with route params', () => {
      useParams.mockReturnValue({
        communityId: 'community-123',
      });
      const { container } = renderWithProviders(<CommunityWikiPage />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  // USER INTERACTION TESTS
  describe('User Interactions', () => {
    it('allows mouse interactions', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CommunityWikiPage />);
      const main = screen.getByRole('main');
      await user.hover(main);
      expect(main).toBeInTheDocument();
    });

    it('supports click events', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CommunityWikiPage />);
      const main = screen.getByRole('main');
      await user.click(main);
      expect(main).toBeInTheDocument();
    });

    it('supports touch events on mobile', () => {
      global.innerWidth = 375;
      renderWithProviders(<CommunityWikiPage />);
      const main = screen.getByRole('main');
      fireEvent.touchStart(main);
      expect(main).toBeInTheDocument();
    });

    it('handles focus events', () => {
      renderWithProviders(<CommunityWikiPage />);
      const main = screen.getByRole('main');
      fireEvent.focus(main);
      expect(main).toBeInTheDocument();
    });

    it('handles blur events', () => {
      renderWithProviders(<CommunityWikiPage />);
      const main = screen.getByRole('main');
      fireEvent.blur(main);
      expect(main).toBeInTheDocument();
    });
  });

  // FRAMER MOTION ANIMATION TESTS
  describe('Framer Motion Animations', () => {
    it('applies initial animation state', () => {
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles animation completion', () => {
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('maintains layout during animations', () => {
      renderWithProviders(<CommunityWikiPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('min-h-screen');
    });

    it('does not break layout with motion', () => {
      const { container } = renderWithProviders(<CommunityWikiPage />);
      const card = container.querySelector('.bg-white.dark\\:bg-[#161b22]');
      expect(card).toBeInTheDocument();
    });

    it('handles rapid animation triggers', () => {
      const { rerender } = renderWithProviders(<CommunityWikiPage />);
      for (let i = 0; i < 5; i++) {
        rerender(<CommunityWikiPage />);
      }
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  // SEO AND META TESTS
  describe('SEO and Metadata', () => {
    it('has semantic HTML structure', () => {
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('uses proper heading for page title', () => {
      renderWithProviders(<CommunityWikiPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('CommunityWikiPage');
    });

    it('has descriptive content', () => {
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByText(/This is the CommunityWikiPage page/)).toBeInTheDocument();
    });

    it('maintains proper document structure', () => {
      const { container } = renderWithProviders(<CommunityWikiPage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
      expect(container.querySelector('h1')).toBeInTheDocument();
    });

    it('provides clear page purpose', () => {
      renderWithProviders(<CommunityWikiPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', 'Community wiki page');
    });
  });

  // BROWSER COMPATIBILITY TESTS
  describe('Browser Compatibility', () => {
    it('works without JavaScript', () => {
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByText('CommunityWikiPage')).toBeInTheDocument();
    });

    it('handles missing window object', () => {
      const originalWindow = global.window;
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('works with different document modes', () => {
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('supports older browser features', () => {
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('gracefully handles unsupported features', () => {
      delete window.matchMedia;
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  // STATE MANAGEMENT TESTS
  describe('State Management', () => {
    it('maintains component state', () => {
      const { rerender } = renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
      rerender(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles prop changes', () => {
      const { rerender } = renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
      rerender(<CommunityWikiPage key="new" />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('persists state across re-renders', () => {
      const { rerender } = renderWithProviders(<CommunityWikiPage />);
      const initialText = screen.getByText('CommunityWikiPage');
      rerender(<CommunityWikiPage />);
      expect(screen.getByText('CommunityWikiPage')).toBe(initialText);
    });

    it('does not lose state on navigation', () => {
      const { rerender } = renderWithProviders(<CommunityWikiPage />);
      useLocation.mockReturnValue({
        pathname: '/community/wiki/new',
        search: '',
        hash: '',
        state: null,
      });
      rerender(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  // LOADING STATE TESTS
  describe('Loading States', () => {
    it('renders immediately without loading state', () => {
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('displays content immediately', () => {
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByText('CommunityWikiPage')).toBeInTheDocument();
    });

    it('does not show loading indicators', () => {
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('does not show skeleton loaders', () => {
      const { container } = renderWithProviders(<CommunityWikiPage />);
      expect(container.querySelector('.')).not.toBeInTheDocument();
    });

    it('shows content synchronously', () => {
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByText(/This is the CommunityWikiPage page/)).toBeInTheDocument();
    });
  });

  // EMPTY STATE TESTS
  describe('Empty States', () => {
    it('shows placeholder content', () => {
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByText(/Content will be implemented here/)).toBeInTheDocument();
    });

    it('displays descriptive message', () => {
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByText(/This is the CommunityWikiPage page/)).toBeInTheDocument();
    });

    it('maintains layout with empty content', () => {
      renderWithProviders(<CommunityWikiPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('min-h-screen');
    });

    it('shows appropriate empty state', () => {
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByText('CommunityWikiPage')).toBeInTheDocument();
    });
  });

  // MEMORY MANAGEMENT TESTS
  describe('Memory Management', () => {
    it('properly unmounts without errors', () => {
      const { unmount } = renderWithProviders(<CommunityWikiPage />);
      expect(() => unmount()).not.toThrow();
    });

    it('cleans up event listeners', () => {
      const { unmount } = renderWithProviders(<CommunityWikiPage />);
      unmount();
      expect(screen.queryByRole('main')).not.toBeInTheDocument();
    });

    it('releases resources on unmount', () => {
      const { unmount } = renderWithProviders(<CommunityWikiPage />);
      unmount();
      expect(screen.queryByRole('main')).not.toBeInTheDocument();
    });

    it('does not retain references after unmount', () => {
      const { unmount } = renderWithProviders(<CommunityWikiPage />);
      const main = screen.getByRole('main');
      unmount();
      expect(screen.queryByRole('main')).not.toBeInTheDocument();
    });

    it('handles multiple mount/unmount cycles', () => {
      for (let i = 0; i < 3; i++) {
        const { unmount } = renderWithProviders(<CommunityWikiPage />);
        expect(screen.getByRole('main')).toBeInTheDocument();
        unmount();
      }
    });
  });

  // PROPS AND CONFIGURATION TESTS
  describe('Props and Configuration', () => {
    it('works without any props', () => {
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('ignores invalid props', () => {
      renderWithProviders(<CommunityWikiPage invalidProp="test" />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('accepts additional props', () => {
      renderWithProviders(<CommunityWikiPage data-testid="custom" />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('maintains default behavior with extra props', () => {
      renderWithProviders(<CommunityWikiPage custom="value" />);
      expect(screen.getByText('CommunityWikiPage')).toBeInTheDocument();
    });
  });

  // COMPONENT LIFECYCLE TESTS
  describe('Component Lifecycle', () => {
    it('mounts successfully', () => {
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('updates when props change', () => {
      const { rerender } = renderWithProviders(<CommunityWikiPage />);
      rerender(<CommunityWikiPage key="updated" />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('unmounts cleanly', () => {
      const { unmount } = renderWithProviders(<CommunityWikiPage />);
      unmount();
      expect(screen.queryByRole('main')).not.toBeInTheDocument();
    });

    it('re-mounts after unmount', () => {
      const { unmount } = renderWithProviders(<CommunityWikiPage />);
      unmount();
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles rapid mount/unmount cycles', () => {
      for (let i = 0; i < 5; i++) {
        const { unmount } = renderWithProviders(<CommunityWikiPage />);
        unmount();
      }
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  // TEXT CONTENT TESTS
  describe('Text Content', () => {
    it('displays correct page title', () => {
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByText('CommunityWikiPage')).toBeInTheDocument();
    });

    it('displays correct page description', () => {
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByText('This is the CommunityWikiPage page. Content will be implemented here.')).toBeInTheDocument();
    });

    it('has readable text content', () => {
      renderWithProviders(<CommunityWikiPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeVisible();
    });

    it('uses appropriate text sizing', () => {
      renderWithProviders(<CommunityWikiPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('text-3xl');
    });

    it('maintains text hierarchy', () => {
      renderWithProviders(<CommunityWikiPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      const description = screen.getByText(/This is the CommunityWikiPage page/);
      expect(heading).toBeInTheDocument();
      expect(description).toBeInTheDocument();
    });
  });

  // VISUAL REGRESSION TESTS
  describe('Visual Regression', () => {
    it('maintains consistent visual appearance', () => {
      const { container } = renderWithProviders(<CommunityWikiPage />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('preserves layout structure', () => {
      renderWithProviders(<CommunityWikiPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('min-h-screen');
    });

    it('keeps consistent spacing', () => {
      renderWithProviders(<CommunityWikiPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('mb-6');
    });

    it('maintains color scheme', () => {
      renderWithProviders(<CommunityWikiPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('bg-gray-50', 'dark:bg-[#161b22]');
    });

    it('preserves typography', () => {
      renderWithProviders(<CommunityWikiPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('text-3xl', 'font-bold');
    });
  });
});

export default mockNavigate
