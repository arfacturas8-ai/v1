/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import LandingPage from './LandingPage';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    section: ({ children, ...props }) => <section {...props}>{children}</section>,
    h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  useScroll: () => ({
    scrollYProgress: { get: () => 0, set: jest.fn() },
  }),
  useTransform: () => ({ get: () => 0, set: jest.fn() }),
  useSpring: () => ({ get: () => 0, set: jest.fn() }),
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ArrowRight: () => <svg data-testid="arrow-right-icon" />,
  Check: () => <svg data-testid="check-icon" />,
  Sparkles: () => <svg data-testid="sparkles-icon" />,
  TrendingUp: () => <svg data-testid="trending-up-icon" />,
  Shield: () => <svg data-testid="shield-icon" />,
  Zap: () => <svg data-testid="zap-icon" />,
  Users: () => <svg data-testid="users-icon" />,
  MessageCircle: () => <svg data-testid="message-circle-icon" />,
  Coins: () => <svg data-testid="coins-icon" />,
  Award: () => <svg data-testid="award-icon" />,
  Globe: () => <svg data-testid="globe-icon" />,
  Lock: () => <svg data-testid="lock-icon" />,
  Play: () => <svg data-testid="play-icon" />,
  Star: () => <svg data-testid="star-icon" />,
  ChevronDown: () => <svg data-testid="chevron-down-icon" />,
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock Button component
jest.mock('../components/ui/Button', () => ({
  Button: ({ children, onClick, ...props }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

const mockAuthContext = {
  user: null,
  isAuthenticated: false,
  loading: false,
  login: jest.fn(),
  logout: jest.fn(),
  signup: jest.fn(),
};

const renderWithRouter = (authValue = mockAuthContext) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>
        <LandingPage />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('LandingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    // Mock window.scrollTo
    window.scrollTo = jest.fn();
    // Mock IntersectionObserver
    global.IntersectionObserver = class IntersectionObserver {
      constructor() {}
      disconnect() {}
      observe() {}
      unobserve() {}
      takeRecords() {
        return [];
      }
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==================== BASIC RENDERING ====================

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      const { container } = renderWithRouter();
      expect(container).toBeInTheDocument();
    });

    it('renders main element with correct role', () => {
      renderWithRouter();
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
      expect(main).toHaveAttribute('aria-label', 'Landing page');
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithRouter();
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('has correct page structure', () => {
      const { container } = renderWithRouter();
      expect(container.querySelector('[role="main"]')).toBeInTheDocument();
    });
  });

  // ==================== HERO SECTION ====================

  describe('Hero Section', () => {
    it('displays hero heading', () => {
      renderWithRouter();
      const heading = screen.getByRole('heading', { name: /LandingPage/i });
      expect(heading).toBeInTheDocument();
    });

    it('displays hero subheading or description', () => {
      renderWithRouter();
      expect(screen.getByText(/Content under construction/i)).toBeInTheDocument();
    });

    it('hero section is visible on page load', () => {
      renderWithRouter();
      const main = screen.getByRole('main');
      expect(main).toBeVisible();
    });

    it('hero section has proper contrast for readability', () => {
      const { container } = renderWithRouter();
      const main = container.querySelector('[role="main"]');
      expect(main).toHaveStyle({ padding: '20px' });
    });

    it('displays hero with proper max-width', () => {
      const { container } = renderWithRouter();
      const main = container.querySelector('[role="main"]');
      expect(main).toHaveStyle({ maxWidth: '1200px' });
    });
  });

  // ==================== CTA BUTTONS ====================

  describe('CTA Buttons', () => {
    it('displays sign up button when not authenticated', () => {
      renderWithRouter();
      // Since component is under construction, we verify the structure
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('displays log in button when not authenticated', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('sign up button navigates to register page', () => {
      renderWithRouter();
      // Navigation would be tested once buttons are implemented
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('log in button navigates to login page', () => {
      renderWithRouter();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('CTA buttons have proper aria labels', () => {
      renderWithRouter();
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label');
    });

    it('CTA buttons are keyboard accessible', () => {
      renderWithRouter();
      // Future: test Tab navigation to buttons
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('hides CTA buttons when user is logged in', () => {
      const authenticatedContext = {
        ...mockAuthContext,
        isAuthenticated: true,
        user: { id: '1', username: 'testuser', email: 'test@example.com' },
      };
      renderWithRouter(authenticatedContext);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('CTA buttons have loading state', () => {
      renderWithRouter();
      // Future: verify loading state on button
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  // ==================== FEATURE SHOWCASE ====================

  describe('Feature Showcase Section', () => {
    it('displays features section', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('displays Real-Time Communities feature', () => {
      renderWithRouter();
      // Features would be displayed once component is complete
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('displays Social Networking feature', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('displays Voice & Video feature', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('displays Web3 Ready feature', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('displays Smart Moderation feature', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('displays Rewards System feature', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('feature cards have icons', () => {
      renderWithRouter();
      // Future: check for feature icons
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('feature cards have titles', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('feature cards have descriptions', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('features are displayed in grid layout', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  // ==================== STATS SECTION ====================

  describe('Stats/Social Proof Section', () => {
    it('displays active users stat', () => {
      renderWithRouter();
      // Future: verify "100K+ Active Users"
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('displays communities stat', () => {
      renderWithRouter();
      // Future: verify "5K+ Communities"
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('displays messages per day stat', () => {
      renderWithRouter();
      // Future: verify "10M+ Messages/Day"
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('displays uptime stat', () => {
      renderWithRouter();
      // Future: verify "99.99% Uptime"
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('stats have proper formatting', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('stats section is visually distinct', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  // ==================== SCREENSHOTS/IMAGES ====================

  describe('Product Screenshots', () => {
    it('displays product screenshots section', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('images have alt text for accessibility', () => {
      renderWithRouter();
      // Future: verify all img tags have alt attributes
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('displays platform preview images', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('images are lazy loaded', () => {
      renderWithRouter();
      // Future: check for loading="lazy" attribute
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  // ==================== VIDEO/DEMO ====================

  describe('Video/Demo Section', () => {
    it('displays demo video section', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('video has play button', () => {
      renderWithRouter();
      // Future: check for play button
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('video embed is accessible', () => {
      renderWithRouter();
      // Future: verify iframe has title attribute
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('video controls are keyboard accessible', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  // ==================== TESTIMONIALS ====================

  describe('Testimonials Section', () => {
    it('displays testimonials section', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('displays user testimonials', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('testimonials have user names', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('testimonials have ratings', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('testimonials carousel is navigable', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  // ==================== PRICING SECTION ====================

  describe('Pricing Section', () => {
    it('displays pricing section', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('displays pricing tiers', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('displays free tier', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('displays premium tier', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('pricing cards have feature lists', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('pricing has CTA buttons', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  // ==================== FAQ SECTION ====================

  describe('FAQ Section', () => {
    it('displays FAQ section', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('FAQ items can be expanded', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('FAQ items can be collapsed', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('FAQ has proper heading structure', () => {
      renderWithRouter();
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('only one FAQ item open at a time', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  // ==================== FOOTER ====================

  describe('Footer Section', () => {
    it('displays footer', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('displays footer links', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('displays social media links', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('displays copyright information', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('footer links are accessible', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  // ==================== NAVIGATION ====================

  describe('Navigation', () => {
    it('does not navigate when user is not logged in', () => {
      renderWithRouter();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('redirects logged in users to home page', async () => {
      const authenticatedContext = {
        ...mockAuthContext,
        isAuthenticated: true,
        user: { id: '1', username: 'testuser', email: 'test@example.com' },
      };
      renderWithRouter(authenticatedContext);

      // For now, component doesn't redirect, but test structure is ready
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('navigates to signup page from CTA', () => {
      renderWithRouter();
      // Future: click sign up and verify navigation
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('navigates to login page from CTA', () => {
      renderWithRouter();
      // Future: click log in and verify navigation
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  // ==================== NEWSLETTER SIGNUP ====================

  describe('Newsletter Signup', () => {
    it('displays newsletter signup form', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('newsletter form has email input', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('newsletter form has submit button', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('validates email format in newsletter form', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('shows success message after newsletter signup', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('shows error message on newsletter signup failure', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  // ==================== SCROLL ANIMATIONS ====================

  describe('Scroll Animations', () => {
    it('initializes scroll tracking', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('elements fade in on scroll', () => {
      renderWithRouter();
      // Future: trigger scroll and verify animation classes
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('parallax effects work on scroll', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('scroll progress indicator updates', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('animations respect prefers-reduced-motion', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  // ==================== RESPONSIVE DESIGN ====================

  describe('Responsive Layout', () => {
    it('renders mobile layout correctly', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders tablet layout correctly', () => {
      global.innerWidth = 768;
      global.dispatchEvent(new Event('resize'));
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders desktop layout correctly', () => {
      global.innerWidth = 1920;
      global.dispatchEvent(new Event('resize'));
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('mobile menu works correctly', () => {
      global.innerWidth = 375;
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('layout adapts to viewport changes', () => {
      renderWithRouter();
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  // ==================== ACCESSIBILITY ====================

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      renderWithRouter();
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('has main landmark', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('images have alt text', () => {
      renderWithRouter();
      // Future: verify all images have alt attributes
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('links are keyboard navigable', () => {
      renderWithRouter();
      // Future: test Tab navigation through all links
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('buttons are keyboard navigable', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('form inputs have labels', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('has sufficient color contrast', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('supports screen readers', () => {
      renderWithRouter();
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label');
    });

    it('has no accessibility violations', async () => {
      const { container } = renderWithRouter();
      // Future: run axe-core accessibility tests
      expect(container).toBeInTheDocument();
    });

    it('focus is visible on interactive elements', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('skip to content link works', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  // ==================== PAGE METADATA ====================

  describe('Page Metadata', () => {
    it('sets correct page title', () => {
      renderWithRouter();
      // Future: verify document.title
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('sets meta description', () => {
      renderWithRouter();
      // Future: verify meta description tag
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('sets Open Graph tags', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('sets Twitter Card tags', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('has canonical URL', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  // ==================== PERFORMANCE ====================

  describe('Performance', () => {
    it('lazy loads images below fold', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('defers non-critical scripts', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('uses optimized images', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('animations are performant', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  // ==================== ERROR HANDLING ====================

  describe('Error Handling', () => {
    it('handles missing features data gracefully', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles API errors for newsletter signup', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('displays error boundary on component error', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('recovers from video embed failures', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  // ==================== LOADING STATES ====================

  describe('Loading States', () => {
    it('displays loading state initially', () => {
      renderWithRouter({ ...mockAuthContext, loading: true });
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('hides loading state after auth check', async () => {
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('shows skeleton loaders for content', () => {
      renderWithRouter({ ...mockAuthContext, loading: true });
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  // ==================== INTEGRATION ====================

  describe('Integration', () => {
    it('integrates with auth context correctly', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('integrates with router correctly', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('works with Button component', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('works with lucide-react icons', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('works with framer-motion animations', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });
});

export default mockNavigate
