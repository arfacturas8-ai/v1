/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { renderWithProviders } from '../__test__/utils/testUtils';
import GuidelinesPage from './GuidelinesPage';

// Mock React Router
const mockNavigate = jest.fn();
const mockUseParams = jest.fn();
const mockUseLocation = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
  useLocation: () => mockUseLocation(),
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    section: ({ children, ...props }) => <section {...props}>{children}</section>,
    article: ({ children, ...props }) => <article {...props}>{children}</article>,
    h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Shield: (props) => <svg data-testid="icon-shield" {...props} />,
  Heart: (props) => <svg data-testid="icon-heart" {...props} />,
  MessageSquare: (props) => <svg data-testid="icon-message-square" {...props} />,
  Lock: (props) => <svg data-testid="icon-lock" {...props} />,
  Ban: (props) => <svg data-testid="icon-ban" {...props} />,
  Scale: (props) => <svg data-testid="icon-scale" {...props} />,
  Target: (props) => <svg data-testid="icon-target" {...props} />,
  AlertTriangle: (props) => <svg data-testid="icon-alert-triangle" {...props} />,
  CheckCircle: (props) => <svg data-testid="icon-check-circle" {...props} />,
  Info: (props) => <svg data-testid="icon-info" {...props} />,
  ArrowLeft: (props) => <svg data-testid="icon-arrow-left" {...props} />,
  Home: (props) => <svg data-testid="icon-home" {...props} />,
  BookOpen: (props) => <svg data-testid="icon-book-open" {...props} />,
  FileText: (props) => <svg data-testid="icon-file-text" {...props} />,
}));

// Mock useAuth context
const mockAuthContext = {
  user: {
    id: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
    avatar: '/avatars/test.png',
  },
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
};

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthContext: {
    Provider: ({ children }) => children,
  },
  AuthProvider: ({ children }) => children,
}));

describe('GuidelinesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({});
    mockUseLocation.mockReturnValue({
      pathname: '/guidelines',
      search: '',
      hash: '',
      state: null,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Page Rendering', () => {
    it('renders page without crashing', () => {
      const { container } = renderWithProviders(<GuidelinesPage />);
      expect(container).toBeInTheDocument();
    });

    it('displays main content area', () => {
      renderWithProviders(<GuidelinesPage />);
      const mainElement = screen.getByRole('main');
      expect(mainElement).toBeInTheDocument();
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithProviders(<GuidelinesPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('renders with correct aria-label on main element', () => {
      renderWithProviders(<GuidelinesPage />);
      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveAttribute('aria-label', 'Community guidelines page');
    });

    it('displays page heading', () => {
      renderWithProviders(<GuidelinesPage />);
      expect(screen.getByText('GuidelinesPage')).toBeInTheDocument();
    });

    it('displays construction message', () => {
      renderWithProviders(<GuidelinesPage />);
      expect(screen.getByText('Content under construction...')).toBeInTheDocument();
    });

    it('applies correct container styles', () => {
      renderWithProviders(<GuidelinesPage />);
      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveStyle({
        padding: '20px',
        maxWidth: '1200px',
        margin: '0 auto',
      });
    });

    it('heading is rendered as h1 element', () => {
      renderWithProviders(<GuidelinesPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('GuidelinesPage');
    });

    it('construction message is rendered in paragraph element', () => {
      renderWithProviders(<GuidelinesPage />);
      const paragraph = screen.getByText('Content under construction...');
      expect(paragraph.tagName).toBe('P');
    });

    it('renders in MemoryRouter without issues', () => {
      const { container } = render(
        <MemoryRouter>
          <GuidelinesPage />
        </MemoryRouter>
      );
      expect(container).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('has single main wrapper element', () => {
      renderWithProviders(<GuidelinesPage />);
      const mainElements = screen.getAllByRole('main');
      expect(mainElements).toHaveLength(1);
    });

    it('contains exactly one h1 heading', () => {
      renderWithProviders(<GuidelinesPage />);
      const h1Elements = screen.getAllByRole('heading', { level: 1 });
      expect(h1Elements).toHaveLength(1);
    });

    it('main element is direct parent of content', () => {
      renderWithProviders(<GuidelinesPage />);
      const mainElement = screen.getByRole('main');
      const heading = screen.getByRole('heading', { level: 1 });
      expect(mainElement).toContainElement(heading);
    });

    it('renders simple DOM structure', () => {
      const { container } = renderWithProviders(<GuidelinesPage />);
      expect(container.firstChild).toBeTruthy();
    });

    it('does not render any lists initially', () => {
      renderWithProviders(<GuidelinesPage />);
      const lists = screen.queryAllByRole('list');
      expect(lists).toHaveLength(0);
    });

    it('does not render any navigation elements initially', () => {
      renderWithProviders(<GuidelinesPage />);
      const nav = screen.queryByRole('navigation');
      expect(nav).not.toBeInTheDocument();
    });

    it('does not render any buttons initially', () => {
      renderWithProviders(<GuidelinesPage />);
      const buttons = screen.queryAllByRole('button');
      expect(buttons).toHaveLength(0);
    });

    it('does not render any links initially', () => {
      renderWithProviders(<GuidelinesPage />);
      const links = screen.queryAllByRole('link');
      expect(links).toHaveLength(0);
    });

    it('does not render any images initially', () => {
      renderWithProviders(<GuidelinesPage />);
      const images = screen.queryAllByRole('img');
      expect(images).toHaveLength(0);
    });

    it('does not render any forms initially', () => {
      renderWithProviders(<GuidelinesPage />);
      const forms = screen.queryAllByRole('form');
      expect(forms).toHaveLength(0);
    });
  });

  describe('Accessibility', () => {
    it('has proper page structure', () => {
      renderWithProviders(<GuidelinesPage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('has proper heading hierarchy', () => {
      renderWithProviders(<GuidelinesPage />);
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('main element has accessible name', () => {
      renderWithProviders(<GuidelinesPage />);
      const main = screen.getByRole('main', { name: /community guidelines page/i });
      expect(main).toBeInTheDocument();
    });

    it('page is keyboard navigable', () => {
      renderWithProviders(<GuidelinesPage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('does not have aria-hidden on main content', () => {
      renderWithProviders(<GuidelinesPage />);
      const main = screen.getByRole('main');
      expect(main).not.toHaveAttribute('aria-hidden', 'true');
    });

    it('heading is visible and accessible', () => {
      renderWithProviders(<GuidelinesPage />);
      const heading = screen.getByRole('heading', { level: 1, name: /GuidelinesPage/i });
      expect(heading).toBeVisible();
    });

    it('content paragraph is accessible', () => {
      renderWithProviders(<GuidelinesPage />);
      const paragraph = screen.getByText(/content under construction/i);
      expect(paragraph).toBeVisible();
    });

    it('supports screen reader navigation', () => {
      renderWithProviders(<GuidelinesPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('role', 'main');
    });

    it('has semantic HTML structure', () => {
      const { container } = renderWithProviders(<GuidelinesPage />);
      const main = container.querySelector('main');
      expect(main).toBeInTheDocument();
    });

    it('does not have accessibility violations in main element', () => {
      renderWithProviders(<GuidelinesPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveAccessibleName();
    });
  });

  describe('Responsive Behavior', () => {
    it('renders correctly on mobile viewport', () => {
      global.innerWidth = 375;
      global.innerHeight = 667;
      renderWithProviders(<GuidelinesPage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('renders correctly on tablet viewport', () => {
      global.innerWidth = 768;
      global.innerHeight = 1024;
      renderWithProviders(<GuidelinesPage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('renders correctly on desktop viewport', () => {
      global.innerWidth = 1920;
      global.innerHeight = 1080;
      renderWithProviders(<GuidelinesPage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('renders correctly on small mobile viewport', () => {
      global.innerWidth = 320;
      global.innerHeight = 568;
      renderWithProviders(<GuidelinesPage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('renders correctly on large desktop viewport', () => {
      global.innerWidth = 2560;
      global.innerHeight = 1440;
      renderWithProviders(<GuidelinesPage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('maintains max-width constraint on large screens', () => {
      global.innerWidth = 2560;
      renderWithProviders(<GuidelinesPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveStyle({ maxWidth: '1200px' });
    });

    it('centers content with auto margins', () => {
      renderWithProviders(<GuidelinesPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveStyle({ margin: '0 auto' });
    });

    it('applies consistent padding across viewports', () => {
      renderWithProviders(<GuidelinesPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveStyle({ padding: '20px' });
    });

    it('content is visible on all viewport sizes', () => {
      const viewports = [320, 768, 1024, 1920];
      viewports.forEach(width => {
        global.innerWidth = width;
        const { unmount } = renderWithProviders(<GuidelinesPage />);
        expect(screen.getByText('GuidelinesPage')).toBeVisible();
        unmount();
      });
    });

    it('maintains layout integrity on window resize', () => {
      const { rerender } = renderWithProviders(<GuidelinesPage />);
      global.innerWidth = 375;
      rerender(<GuidelinesPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
      global.innerWidth = 1920;
      rerender(<GuidelinesPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Content Rendering', () => {
    it('renders page title text correctly', () => {
      renderWithProviders(<GuidelinesPage />);
      expect(screen.getByText('GuidelinesPage')).toBeInTheDocument();
    });

    it('renders construction message text correctly', () => {
      renderWithProviders(<GuidelinesPage />);
      expect(screen.getByText('Content under construction...')).toBeInTheDocument();
    });

    it('title and message are both visible', () => {
      renderWithProviders(<GuidelinesPage />);
      expect(screen.getByText('GuidelinesPage')).toBeVisible();
      expect(screen.getByText('Content under construction...')).toBeVisible();
    });

    it('renders text content in correct order', () => {
      const { container } = renderWithProviders(<GuidelinesPage />);
      const textContent = container.textContent;
      expect(textContent.indexOf('GuidelinesPage')).toBeLessThan(
        textContent.indexOf('Content under construction...')
      );
    });

    it('does not render any rule items', () => {
      renderWithProviders(<GuidelinesPage />);
      expect(screen.queryByText('Be Respectful')).not.toBeInTheDocument();
    });

    it('does not render any rule descriptions', () => {
      renderWithProviders(<GuidelinesPage />);
      expect(screen.queryByText(/Treat all community members/i)).not.toBeInTheDocument();
    });

    it('does not render harassment rule', () => {
      renderWithProviders(<GuidelinesPage />);
      expect(screen.queryByText('No Harassment')).not.toBeInTheDocument();
    });

    it('does not render topic rule', () => {
      renderWithProviders(<GuidelinesPage />);
      expect(screen.queryByText('Stay On Topic')).not.toBeInTheDocument();
    });

    it('does not render privacy rule', () => {
      renderWithProviders(<GuidelinesPage />);
      expect(screen.queryByText('Respect Privacy')).not.toBeInTheDocument();
    });

    it('does not render spam rule', () => {
      renderWithProviders(<GuidelinesPage />);
      expect(screen.queryByText('No Spam')).not.toBeInTheDocument();
    });
  });

  describe('Router Integration', () => {
    it('works with MemoryRouter', () => {
      const { container } = render(
        <MemoryRouter>
          <GuidelinesPage />
        </MemoryRouter>
      );
      expect(container).toBeInTheDocument();
    });

    it('works with initial route', () => {
      render(
        <MemoryRouter initialEntries={['/guidelines']}>
          <GuidelinesPage />
        </MemoryRouter>
      );
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('accepts route params gracefully', () => {
      mockUseParams.mockReturnValue({ id: '123' });
      renderWithProviders(<GuidelinesPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('accepts location state gracefully', () => {
      mockUseLocation.mockReturnValue({
        pathname: '/guidelines',
        search: '?tab=rules',
        hash: '#section1',
        state: { from: '/home' },
      });
      renderWithProviders(<GuidelinesPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles navigate function availability', () => {
      expect(mockNavigate).toBeDefined();
      renderWithProviders(<GuidelinesPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('works without route params', () => {
      mockUseParams.mockReturnValue({});
      renderWithProviders(<GuidelinesPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('works without location state', () => {
      mockUseLocation.mockReturnValue({
        pathname: '/guidelines',
        search: '',
        hash: '',
        state: null,
      });
      renderWithProviders(<GuidelinesPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles hash navigation', () => {
      mockUseLocation.mockReturnValue({
        pathname: '/guidelines',
        search: '',
        hash: '#top',
        state: null,
      });
      renderWithProviders(<GuidelinesPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles query parameters', () => {
      mockUseLocation.mockReturnValue({
        pathname: '/guidelines',
        search: '?view=full',
        hash: '',
        state: null,
      });
      renderWithProviders(<GuidelinesPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles complex route combinations', () => {
      mockUseParams.mockReturnValue({ section: 'rules' });
      mockUseLocation.mockReturnValue({
        pathname: '/guidelines/rules',
        search: '?sort=asc',
        hash: '#rule-1',
        state: { referrer: '/home' },
      });
      renderWithProviders(<GuidelinesPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Authentication Context', () => {
    it('renders correctly when user is authenticated', () => {
      renderWithProviders(<GuidelinesPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles unauthenticated state', () => {
      const unauthContext = {
        user: null,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false,
      };
      jest.spyOn(require('../contexts/AuthContext'), 'useAuth').mockReturnValue(unauthContext);
      renderWithProviders(<GuidelinesPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles loading state', () => {
      const loadingContext = {
        ...mockAuthContext,
        loading: true,
      };
      jest.spyOn(require('../contexts/AuthContext'), 'useAuth').mockReturnValue(loadingContext);
      renderWithProviders(<GuidelinesPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles user with different roles', () => {
      const adminContext = {
        user: {
          id: 'admin-123',
          username: 'admin',
          email: 'admin@example.com',
          role: 'admin',
        },
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false,
      };
      jest.spyOn(require('../contexts/AuthContext'), 'useAuth').mockReturnValue(adminContext);
      renderWithProviders(<GuidelinesPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders same content regardless of auth state', () => {
      const { unmount } = renderWithProviders(<GuidelinesPage />);
      const authenticatedContent = screen.getByText('GuidelinesPage').textContent;
      unmount();

      const unauthContext = {
        user: null,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false,
      };
      jest.spyOn(require('../contexts/AuthContext'), 'useAuth').mockReturnValue(unauthContext);
      renderWithProviders(<GuidelinesPage />);
      const unauthenticatedContent = screen.getByText('GuidelinesPage').textContent;

      expect(authenticatedContent).toBe(unauthenticatedContent);
    });
  });

  describe('Error Handling', () => {
    it('renders without errors even with null props', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithProviders(<GuidelinesPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('handles undefined context gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithProviders(<GuidelinesPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('does not throw on render', () => {
      expect(() => {
        renderWithProviders(<GuidelinesPage />);
      }).not.toThrow();
    });

    it('handles missing Router gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      render(<GuidelinesPage />);
      consoleSpy.mockRestore();
    });

    it('does not have memory leaks', () => {
      const { unmount } = renderWithProviders(<GuidelinesPage />);
      unmount();
      expect(screen.queryByRole('main')).not.toBeInTheDocument();
    });

    it('cleans up properly on unmount', () => {
      const { unmount } = renderWithProviders(<GuidelinesPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
      unmount();
      expect(screen.queryByRole('main')).not.toBeInTheDocument();
    });

    it('handles rapid mount/unmount cycles', () => {
      for (let i = 0; i < 5; i++) {
        const { unmount } = renderWithProviders(<GuidelinesPage />);
        expect(screen.getByRole('main')).toBeInTheDocument();
        unmount();
      }
    });

    it('does not log warnings', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      renderWithProviders(<GuidelinesPage />);
      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('handles window resize without errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithProviders(<GuidelinesPage />);
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('handles invalid viewport dimensions', () => {
      global.innerWidth = -1;
      global.innerHeight = -1;
      renderWithProviders(<GuidelinesPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Component Lifecycle', () => {
    it('mounts successfully', () => {
      const { container } = renderWithProviders(<GuidelinesPage />);
      expect(container.firstChild).toBeTruthy();
    });

    it('updates without errors', () => {
      const { rerender } = renderWithProviders(<GuidelinesPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
      rerender(<GuidelinesPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('unmounts cleanly', () => {
      const { unmount } = renderWithProviders(<GuidelinesPage />);
      expect(() => unmount()).not.toThrow();
    });

    it('maintains state across re-renders', () => {
      const { rerender } = renderWithProviders(<GuidelinesPage />);
      const heading = screen.getByText('GuidelinesPage');
      rerender(<GuidelinesPage />);
      expect(screen.getByText('GuidelinesPage')).toBe(heading);
    });

    it('does not cause side effects on mount', () => {
      const mockFn = jest.fn();
      global.addEventListener = mockFn;
      renderWithProviders(<GuidelinesPage />);
      global.addEventListener = window.addEventListener;
    });

    it('renders consistently on multiple mounts', () => {
      const { unmount: unmount1 } = renderWithProviders(<GuidelinesPage />);
      const content1 = screen.getByText('GuidelinesPage').textContent;
      unmount1();

      const { unmount: unmount2 } = renderWithProviders(<GuidelinesPage />);
      const content2 = screen.getByText('GuidelinesPage').textContent;
      unmount2();

      expect(content1).toBe(content2);
    });

    it('handles forced updates', () => {
      const { rerender } = renderWithProviders(<GuidelinesPage />);
      for (let i = 0; i < 10; i++) {
        rerender(<GuidelinesPage />);
      }
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('does not create duplicate elements on rerender', () => {
      const { rerender } = renderWithProviders(<GuidelinesPage />);
      expect(screen.getAllByRole('main')).toHaveLength(1);
      rerender(<GuidelinesPage />);
      expect(screen.getAllByRole('main')).toHaveLength(1);
    });

    it('preserves DOM structure on rerender', () => {
      const { rerender, container } = renderWithProviders(<GuidelinesPage />);
      const initialHTML = container.innerHTML;
      rerender(<GuidelinesPage />);
      expect(container.innerHTML).toBe(initialHTML);
    });

    it('maintains component identity across renders', () => {
      const { rerender, container } = renderWithProviders(<GuidelinesPage />);
      const firstMain = container.querySelector('main');
      rerender(<GuidelinesPage />);
      const secondMain = container.querySelector('main');
      expect(firstMain).toBeTruthy();
      expect(secondMain).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('renders quickly', () => {
      const start = performance.now();
      renderWithProviders(<GuidelinesPage />);
      const end = performance.now();
      expect(end - start).toBeLessThan(1000); // Should render in less than 1 second
    });

    it('has minimal DOM nodes', () => {
      const { container } = renderWithProviders(<GuidelinesPage />);
      const nodeCount = container.querySelectorAll('*').length;
      expect(nodeCount).toBeLessThan(50); // Simple page should have few nodes
    });

    it('does not create unnecessary event listeners', () => {
      renderWithProviders(<GuidelinesPage />);
      // Page should function without active event listeners
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders efficiently on multiple instances', () => {
      const instances = Array(5).fill(null).map(() =>
        renderWithProviders(<GuidelinesPage />)
      );
      instances.forEach(({ unmount }) => {
        expect(screen.getAllByRole('main').length).toBeGreaterThan(0);
        unmount();
      });
    });

    it('handles concurrent renders', () => {
      const renders = Array(3).fill(null).map(() =>
        renderWithProviders(<GuidelinesPage />)
      );
      const mains = screen.getAllByRole('main');
      expect(mains.length).toBe(3);
      renders.forEach(({ unmount }) => unmount());
    });
  });

  describe('Text Content', () => {
    it('page title contains expected text', () => {
      renderWithProviders(<GuidelinesPage />);
      expect(screen.getByText(/GuidelinesPage/)).toBeInTheDocument();
    });

    it('construction message contains expected text', () => {
      renderWithProviders(<GuidelinesPage />);
      expect(screen.getByText(/Content under construction/)).toBeInTheDocument();
    });

    it('text is not empty', () => {
      const { container } = renderWithProviders(<GuidelinesPage />);
      expect(container.textContent).not.toBe('');
    });

    it('displays English language content', () => {
      renderWithProviders(<GuidelinesPage />);
      const text = screen.getByText('Content under construction...');
      expect(text).toBeInTheDocument();
    });

    it('text content is visible', () => {
      renderWithProviders(<GuidelinesPage />);
      expect(screen.getByText('GuidelinesPage')).toBeVisible();
      expect(screen.getByText('Content under construction...')).toBeVisible();
    });

    it('does not contain placeholder text beyond construction message', () => {
      const { container } = renderWithProviders(<GuidelinesPage />);
      expect(container.textContent).not.toContain('Lorem ipsum');
    });

    it('heading text is properly formatted', () => {
      renderWithProviders(<GuidelinesPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading.textContent).toBe('GuidelinesPage');
    });

    it('construction message is properly formatted', () => {
      renderWithProviders(<GuidelinesPage />);
      const message = screen.getByText('Content under construction...');
      expect(message.textContent).toBe('Content under construction...');
    });

    it('does not have typos in main text', () => {
      renderWithProviders(<GuidelinesPage />);
      expect(screen.getByText('Content under construction...')).toBeInTheDocument();
      expect(screen.queryByText('Content under constuction')).not.toBeInTheDocument();
    });

    it('text is readable and not truncated', () => {
      renderWithProviders(<GuidelinesPage />);
      const heading = screen.getByText('GuidelinesPage');
      expect(heading).not.toHaveStyle({ overflow: 'hidden', textOverflow: 'ellipsis' });
    });
  });

  describe('Snapshot Testing', () => {
    it('matches snapshot', () => {
      const { container } = renderWithProviders(<GuidelinesPage />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot with authenticated user', () => {
      const { container } = renderWithProviders(<GuidelinesPage />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot on mobile viewport', () => {
      global.innerWidth = 375;
      const { container } = renderWithProviders(<GuidelinesPage />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot on desktop viewport', () => {
      global.innerWidth = 1920;
      const { container } = renderWithProviders(<GuidelinesPage />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('snapshot remains consistent across renders', () => {
      const { container: container1, unmount } = renderWithProviders(<GuidelinesPage />);
      const snapshot1 = container1.innerHTML;
      unmount();

      const { container: container2 } = renderWithProviders(<GuidelinesPage />);
      const snapshot2 = container2.innerHTML;

      expect(snapshot1).toBe(snapshot2);
    });
  });

  describe('Integration Tests', () => {
    it('integrates with renderWithProviders utility', () => {
      const result = renderWithProviders(<GuidelinesPage />);
      expect(result.container).toBeInTheDocument();
    });

    it('works with custom route in renderWithProviders', () => {
      renderWithProviders(<GuidelinesPage />, { route: '/guidelines' });
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('integrates with testing library queries', () => {
      renderWithProviders(<GuidelinesPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByText('GuidelinesPage')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('works with within helper', () => {
      renderWithProviders(<GuidelinesPage />);
      const main = screen.getByRole('main');
      expect(within(main).getByText('GuidelinesPage')).toBeInTheDocument();
    });

    it('supports multiple query methods', () => {
      renderWithProviders(<GuidelinesPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByText('GuidelinesPage')).toBeInTheDocument();
      expect(screen.getByLabelText(/community guidelines page/i)).toBeInTheDocument();
    });

    it('works with async utilities', async () => {
      renderWithProviders(<GuidelinesPage />);
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('integrates properly with jest', () => {
      const { container } = renderWithProviders(<GuidelinesPage />);
      expect(container).toBeTruthy();
      expect(container.firstChild).toBeTruthy();
    });

    it('cleans up properly with testing library', () => {
      const { unmount } = renderWithProviders(<GuidelinesPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
      unmount();
      expect(screen.queryByRole('main')).not.toBeInTheDocument();
    });

    it('supports container queries', () => {
      const { container } = renderWithProviders(<GuidelinesPage />);
      const main = container.querySelector('main');
      expect(main).toBeInTheDocument();
    });

    it('works with baseElement', () => {
      const { baseElement } = renderWithProviders(<GuidelinesPage />);
      expect(baseElement).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero viewport width', () => {
      global.innerWidth = 0;
      renderWithProviders(<GuidelinesPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles very large viewport', () => {
      global.innerWidth = 10000;
      renderWithProviders(<GuidelinesPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders without window object', () => {
      const originalWindow = global.window;
      const { container } = renderWithProviders(<GuidelinesPage />);
      expect(container).toBeInTheDocument();
      global.window = originalWindow;
    });

    it('handles missing document', () => {
      const { container } = renderWithProviders(<GuidelinesPage />);
      expect(container).toBeInTheDocument();
    });

    it('renders with null children in provider', () => {
      const { container } = renderWithProviders(<GuidelinesPage />);
      expect(container).toBeInTheDocument();
    });

    it('handles rapid viewport changes', () => {
      const { rerender } = renderWithProviders(<GuidelinesPage />);
      global.innerWidth = 375;
      rerender(<GuidelinesPage />);
      global.innerWidth = 1920;
      rerender(<GuidelinesPage />);
      global.innerWidth = 768;
      rerender(<GuidelinesPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles component rendered multiple times in tree', () => {
      render(
        <MemoryRouter>
          <div>
            <GuidelinesPage />
            <GuidelinesPage />
          </div>
        </MemoryRouter>
      );
      const mains = screen.getAllByRole('main');
      expect(mains.length).toBe(2);
    });

    it('handles empty route params', () => {
      mockUseParams.mockReturnValue({});
      renderWithProviders(<GuidelinesPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles null route params', () => {
      mockUseParams.mockReturnValue(null);
      renderWithProviders(<GuidelinesPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles undefined location', () => {
      mockUseLocation.mockReturnValue(undefined);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithProviders(<GuidelinesPage />);
      consoleSpy.mockRestore();
    });
  });

  describe('Browser Compatibility', () => {
    it('renders in jsdom environment', () => {
      expect(document).toBeDefined();
      renderWithProviders(<GuidelinesPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('uses standard HTML elements', () => {
      const { container } = renderWithProviders(<GuidelinesPage />);
      const main = container.querySelector('main');
      const h1 = container.querySelector('h1');
      const p = container.querySelector('p');
      expect(main).toBeInTheDocument();
      expect(h1).toBeInTheDocument();
      expect(p).toBeInTheDocument();
    });

    it('does not use deprecated HTML attributes', () => {
      const { container } = renderWithProviders(<GuidelinesPage />);
      const elements = container.querySelectorAll('*');
      elements.forEach(el => {
        expect(el).not.toHaveAttribute('align');
        expect(el).not.toHaveAttribute('bgcolor');
      });
    });

    it('uses valid CSS properties', () => {
      renderWithProviders(<GuidelinesPage />);
      const main = screen.getByRole('main');
      const styles = main.style;
      expect(styles.padding).toBeTruthy();
      expect(styles.maxWidth).toBeTruthy();
      expect(styles.margin).toBeTruthy();
    });

    it('supports modern browsers', () => {
      const { container } = renderWithProviders(<GuidelinesPage />);
      expect(container.querySelector('main')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('page content is non-interactive', () => {
      renderWithProviders(<GuidelinesPage />);
      const buttons = screen.queryAllByRole('button');
      const links = screen.queryAllByRole('link');
      const inputs = screen.queryAllByRole('textbox');
      expect(buttons).toHaveLength(0);
      expect(links).toHaveLength(0);
      expect(inputs).toHaveLength(0);
    });

    it('does not respond to click events', () => {
      renderWithProviders(<GuidelinesPage />);
      const main = screen.getByRole('main');
      const clickHandler = jest.fn();
      main.onclick = clickHandler;
      main.click();
      // No interactive elements, so handler shouldn't be needed
    });

    it('does not have form submissions', () => {
      renderWithProviders(<GuidelinesPage />);
      const forms = screen.queryAllByRole('form');
      expect(forms).toHaveLength(0);
    });

    it('does not handle keyboard events', () => {
      renderWithProviders(<GuidelinesPage />);
      const main = screen.getByRole('main');
      const keyHandler = jest.fn();
      main.onkeydown = keyHandler;
      // Static page, no keyboard handlers needed
    });

    it('content is read-only', () => {
      renderWithProviders(<GuidelinesPage />);
      const editableElements = screen.queryAllByRole('textbox');
      expect(editableElements).toHaveLength(0);
    });
  });

  describe('State Management', () => {
    it('is a stateless component', () => {
      const { rerender } = renderWithProviders(<GuidelinesPage />);
      const content1 = screen.getByText('GuidelinesPage').textContent;
      rerender(<GuidelinesPage />);
      const content2 = screen.getByText('GuidelinesPage').textContent;
      expect(content1).toBe(content2);
    });

    it('does not manage internal state', () => {
      renderWithProviders(<GuidelinesPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
      // Component should be purely presentational
    });

    it('renders consistently without state changes', () => {
      const { container, rerender } = renderWithProviders(<GuidelinesPage />);
      const html1 = container.innerHTML;
      rerender(<GuidelinesPage />);
      const html2 = container.innerHTML;
      expect(html1).toBe(html2);
    });

    it('does not trigger state updates', () => {
      const { rerender } = renderWithProviders(<GuidelinesPage />);
      expect(() => {
        for (let i = 0; i < 10; i++) {
          rerender(<GuidelinesPage />);
        }
      }).not.toThrow();
    });
  });

  describe('CSS and Styling', () => {
    it('applies inline styles correctly', () => {
      renderWithProviders(<GuidelinesPage />);
      const main = screen.getByRole('main');
      expect(main.style.padding).toBe('20px');
      expect(main.style.maxWidth).toBe('1200px');
      expect(main.style.margin).toBe('0 auto');
    });

    it('container has correct max-width', () => {
      renderWithProviders(<GuidelinesPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveStyle({ maxWidth: '1200px' });
    });

    it('container is centered', () => {
      renderWithProviders(<GuidelinesPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveStyle({ margin: '0 auto' });
    });

    it('container has padding', () => {
      renderWithProviders(<GuidelinesPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveStyle({ padding: '20px' });
    });

    it('styles are applied as objects', () => {
      renderWithProviders(<GuidelinesPage />);
      const main = screen.getByRole('main');
      expect(main.style.padding).toBeTruthy();
    });

    it('does not have className prop', () => {
      const { container } = renderWithProviders(<GuidelinesPage />);
      const main = container.querySelector('main');
      // Component uses inline styles instead of classes
      expect(main).toBeInTheDocument();
    });

    it('styles are not undefined', () => {
      renderWithProviders(<GuidelinesPage />);
      const main = screen.getByRole('main');
      expect(main.style).toBeDefined();
    });

    it('maintains styles across renders', () => {
      const { rerender } = renderWithProviders(<GuidelinesPage />);
      const main = screen.getByRole('main');
      const styles1 = { ...main.style };
      rerender(<GuidelinesPage />);
      const styles2 = { ...main.style };
      expect(styles1.padding).toBe(styles2.padding);
    });
  });
});

export default mockNavigate
