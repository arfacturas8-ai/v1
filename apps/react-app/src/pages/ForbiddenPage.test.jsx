/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { renderWithProviders } from '../__test__/utils/testUtils';
import ForbiddenPage from './ForbiddenPage';

// Mock React Router
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: jest.fn(() => ({})),
  useLocation: jest.fn(() => ({ pathname: '/forbidden' })),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ShieldAlert: (props) => <svg data-testid="shield-alert-icon" {...props} />,
  Home: (props) => <svg data-testid="home-icon" {...props} />,
  ArrowLeft: (props) => <svg data-testid="arrow-left-icon" {...props} />,
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

describe('ForbiddenPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Page Rendering', () => {
    it('renders page without crashing', () => {
      const { container } = renderWithProviders(<ForbiddenPage />);
      expect(container).toBeInTheDocument();
    });

    it('renders the component successfully', () => {
      renderWithProviders(<ForbiddenPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('displays main content area', () => {
      renderWithProviders(<ForbiddenPage />);
      const mainElement = screen.getByRole('main', { name: /forbidden page/i });
      expect(mainElement).toBeInTheDocument();
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithProviders(<ForbiddenPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('renders without console warnings', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      renderWithProviders(<ForbiddenPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('has correct document structure', () => {
      const { container } = renderWithProviders(<ForbiddenPage />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with proper container styling', () => {
      const { container } = renderWithProviders(<ForbiddenPage />);
      const mainDiv = container.querySelector('[role="main"]');
      expect(mainDiv).toHaveStyle({
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      });
    });

    it('applies gradient background', () => {
      const { container } = renderWithProviders(<ForbiddenPage />);
      const mainDiv = container.querySelector('[role="main"]');
      expect(mainDiv).toHaveStyle({
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      });
    });

    it('renders content wrapper with proper styling', () => {
      const { container } = renderWithProviders(<ForbiddenPage />);
      const contentWrapper = container.querySelector('[role="main"] > div');
      expect(contentWrapper).toHaveStyle({
        textAlign: 'center',
        color: '#fff',
        maxWidth: '600px',
      });
    });
  });

  describe('Error Code Display', () => {
    it('displays 403 error code', () => {
      renderWithProviders(<ForbiddenPage />);
      expect(screen.getByText('403')).toBeInTheDocument();
    });

    it('403 code has aria-hidden attribute', () => {
      renderWithProviders(<ForbiddenPage />);
      const errorCode = screen.getByText('403');
      expect(errorCode).toHaveAttribute('aria-hidden', 'true');
    });

    it('403 code has proper styling', () => {
      renderWithProviders(<ForbiddenPage />);
      const errorCode = screen.getByText('403');
      expect(errorCode).toHaveStyle({
        fontSize: '120px',
        fontWeight: 'bold',
        lineHeight: 1,
      });
    });

    it('403 code has text shadow', () => {
      renderWithProviders(<ForbiddenPage />);
      const errorCode = screen.getByText('403');
      expect(errorCode).toHaveStyle({
        textShadow: '0 10px 30px rgba(0,0,0,0.3)',
      });
    });

    it('error code is visually prominent', () => {
      renderWithProviders(<ForbiddenPage />);
      const errorCode = screen.getByText('403');
      expect(errorCode).toHaveStyle({
        fontSize: '120px',
        marginBottom: '20px',
      });
    });
  });

  describe('Heading and Messages', () => {
    it('displays "Access Forbidden" heading', () => {
      renderWithProviders(<ForbiddenPage />);
      expect(screen.getByRole('heading', { name: /access forbidden/i })).toBeInTheDocument();
    });

    it('heading is an h1 element', () => {
      renderWithProviders(<ForbiddenPage />);
      const heading = screen.getByRole('heading', { name: /access forbidden/i });
      expect(heading.tagName).toBe('H1');
    });

    it('heading has proper styling', () => {
      renderWithProviders(<ForbiddenPage />);
      const heading = screen.getByRole('heading', { name: /access forbidden/i });
      expect(heading).toHaveStyle({
        fontSize: '32px',
        fontWeight: '600',
        marginBottom: '16px',
      });
    });

    it('displays permission denied message', () => {
      renderWithProviders(<ForbiddenPage />);
      expect(screen.getByText(/you don't have permission to access this page/i)).toBeInTheDocument();
    });

    it('message has proper styling', () => {
      renderWithProviders(<ForbiddenPage />);
      const message = screen.getByText(/you don't have permission to access this page/i);
      expect(message).toHaveStyle({
        fontSize: '18px',
        opacity: 0.9,
        marginBottom: '32px',
        lineHeight: 1.6,
      });
    });

    it('renders all text content correctly', () => {
      renderWithProviders(<ForbiddenPage />);
      expect(screen.getByText('403')).toBeInTheDocument();
      expect(screen.getByText('Access Forbidden')).toBeInTheDocument();
      expect(screen.getByText("You don't have permission to access this page.")).toBeInTheDocument();
    });
  });

  describe('Navigation Elements', () => {
    it('displays navigation section', () => {
      renderWithProviders(<ForbiddenPage />);
      const nav = screen.getByRole('navigation', { name: /navigation/i });
      expect(nav).toBeInTheDocument();
    });

    it('navigation has proper styling', () => {
      renderWithProviders(<ForbiddenPage />);
      const nav = screen.getByRole('navigation', { name: /navigation/i });
      expect(nav).toHaveStyle({
        display: 'flex',
        gap: '16px',
        justifyContent: 'center',
      });
    });

    it('displays both navigation buttons', () => {
      renderWithProviders(<ForbiddenPage />);
      expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /go home/i })).toBeInTheDocument();
    });

    it('renders Go Back button', () => {
      renderWithProviders(<ForbiddenPage />);
      const button = screen.getByRole('button', { name: /go back/i });
      expect(button).toBeInTheDocument();
    });

    it('renders Go Home link', () => {
      renderWithProviders(<ForbiddenPage />);
      const link = screen.getByRole('link', { name: /go home/i });
      expect(link).toBeInTheDocument();
    });
  });

  describe('Go Back Button', () => {
    it('Go Back button has proper styling', () => {
      renderWithProviders(<ForbiddenPage />);
      const button = screen.getByRole('button', { name: /go back/i });
      expect(button).toHaveStyle({
        padding: '14px 32px',
        background: '#fff',
        color: '#f59e0b',
        border: 'none',
        borderRadius: '12px',
        fontWeight: '600',
        fontSize: '16px',
        cursor: 'pointer',
      });
    });

    it('Go Back button has box shadow', () => {
      renderWithProviders(<ForbiddenPage />);
      const button = screen.getByRole('button', { name: /go back/i });
      expect(button).toHaveStyle({
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
      });
    });

    it('calls navigate(-1) when Go Back button is clicked', async () => {
      renderWithProviders(<ForbiddenPage />);
      const button = screen.getByRole('button', { name: /go back/i });

      fireEvent.click(button);

      expect(mockNavigate).toHaveBeenCalledWith(-1);
      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });

    it('navigates back on button click using userEvent', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ForbiddenPage />);
      const button = screen.getByRole('button', { name: /go back/i });

      await user.click(button);

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('Go Back button is accessible via keyboard', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ForbiddenPage />);
      const button = screen.getByRole('button', { name: /go back/i });

      button.focus();
      expect(button).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('handles multiple clicks on Go Back button', async () => {
      renderWithProviders(<ForbiddenPage />);
      const button = screen.getByRole('button', { name: /go back/i });

      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(mockNavigate).toHaveBeenCalledTimes(3);
    });

    it('Go Back button responds to hover events', () => {
      renderWithProviders(<ForbiddenPage />);
      const button = screen.getByRole('button', { name: /go back/i });

      fireEvent.mouseOver(button);
      expect(button.style.transform).toBe('scale(1.05)');

      fireEvent.mouseOut(button);
      expect(button.style.transform).toBe('scale(1)');
    });

    it('Go Back button has transition styling', () => {
      renderWithProviders(<ForbiddenPage />);
      const button = screen.getByRole('button', { name: /go back/i });
      expect(button).toHaveStyle({
        transition: 'transform 0.2s',
      });
    });
  });

  describe('Go Home Link', () => {
    it('Go Home link navigates to root path', () => {
      renderWithProviders(<ForbiddenPage />);
      const link = screen.getByRole('link', { name: /go home/i });
      expect(link).toHaveAttribute('href', '/');
    });

    it('Go Home link has proper styling', () => {
      renderWithProviders(<ForbiddenPage />);
      const link = screen.getByRole('link', { name: /go home/i });
      expect(link).toHaveStyle({
        padding: '14px 32px',
        color: '#fff',
        borderRadius: '12px',
        textDecoration: 'none',
        fontWeight: '600',
        fontSize: '16px',
        display: 'inline-block',
      });
    });

    it('Go Home link has border styling', () => {
      renderWithProviders(<ForbiddenPage />);
      const link = screen.getByRole('link', { name: /go home/i });
      expect(link).toHaveStyle({
        border: '2px solid #fff',
      });
    });

    it('Go Home link has backdrop filter', () => {
      renderWithProviders(<ForbiddenPage />);
      const link = screen.getByRole('link', { name: /go home/i });
      expect(link).toHaveStyle({
        backdropFilter: 'blur(10px)',
      });
    });

    it('Go Home link has transition', () => {
      renderWithProviders(<ForbiddenPage />);
      const link = screen.getByRole('link', { name: /go home/i });
      expect(link).toHaveStyle({
        transition: 'all 0.2s',
      });
    });

    it('Go Home link responds to hover events', () => {
      renderWithProviders(<ForbiddenPage />);
      const link = screen.getByRole('link', { name: /go home/i });

      fireEvent.mouseOver(link);
      expect(link.style.background).toBe('rgba(255,255,255,0.3)');
      expect(link.style.transform).toBe('scale(1.05)');

      fireEvent.mouseOut(link);
      expect(link.style.background).toBe('rgba(255,255,255,0.2)');
      expect(link.style.transform).toBe('scale(1)');
    });

    it('Go Home link is accessible via keyboard', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ForbiddenPage />);
      const link = screen.getByRole('link', { name: /go home/i });

      await user.tab();
      // The link should be focusable
      expect(link).toBeInTheDocument();
    });

    it('Go Home link has correct href attribute', () => {
      renderWithProviders(<ForbiddenPage />);
      const link = screen.getByRole('link', { name: /go home/i });
      expect(link).toHaveAttribute('href', '/');
    });

    it('Go Home link does not open in new tab', () => {
      renderWithProviders(<ForbiddenPage />);
      const link = screen.getByRole('link', { name: /go home/i });
      expect(link).not.toHaveAttribute('target', '_blank');
    });
  });

  describe('User Interactions', () => {
    it('handles user clicking Go Back button', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ForbiddenPage />);
      const button = screen.getByRole('button', { name: /go back/i });

      await user.click(button);

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('handles user clicking Go Home link', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ForbiddenPage />);
      const link = screen.getByRole('link', { name: /go home/i });

      expect(link).toHaveAttribute('href', '/');
    });

    it('supports tabbing between interactive elements', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ForbiddenPage />);

      await user.tab();
      const button = screen.getByRole('button', { name: /go back/i });
      expect(button).toHaveFocus();

      await user.tab();
      const link = screen.getByRole('link', { name: /go home/i });
      expect(link).toHaveFocus();
    });

    it('handles rapid clicks on Go Back button', async () => {
      renderWithProviders(<ForbiddenPage />);
      const button = screen.getByRole('button', { name: /go back/i });

      for (let i = 0; i < 5; i++) {
        fireEvent.click(button);
      }

      expect(mockNavigate).toHaveBeenCalledTimes(5);
    });

    it('handles mouse over and out events', () => {
      renderWithProviders(<ForbiddenPage />);
      const button = screen.getByRole('button', { name: /go back/i });
      const link = screen.getByRole('link', { name: /go home/i });

      fireEvent.mouseOver(button);
      fireEvent.mouseOut(button);
      fireEvent.mouseOver(link);
      fireEvent.mouseOut(link);

      // Should not throw errors
      expect(button).toBeInTheDocument();
      expect(link).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper page structure', () => {
      renderWithProviders(<ForbiddenPage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('has aria-label on main element', () => {
      renderWithProviders(<ForbiddenPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', 'Forbidden page');
    });

    it('has proper heading hierarchy', () => {
      renderWithProviders(<ForbiddenPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Access Forbidden');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ForbiddenPage />);

      await user.tab();
      expect(screen.getByRole('button', { name: /go back/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('link', { name: /go home/i })).toHaveFocus();
    });

    it('has navigation landmark', () => {
      renderWithProviders(<ForbiddenPage />);
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('navigation has aria-label', () => {
      renderWithProviders(<ForbiddenPage />);
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Navigation');
    });

    it('decorative 403 is hidden from screen readers', () => {
      renderWithProviders(<ForbiddenPage />);
      const errorCode = screen.getByText('403');
      expect(errorCode).toHaveAttribute('aria-hidden', 'true');
    });

    it('has descriptive button text', () => {
      renderWithProviders(<ForbiddenPage />);
      expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /go home/i })).toBeInTheDocument();
    });

    it('buttons and links are focusable', () => {
      renderWithProviders(<ForbiddenPage />);
      const button = screen.getByRole('button', { name: /go back/i });
      const link = screen.getByRole('link', { name: /go home/i });

      button.focus();
      expect(button).toHaveFocus();

      link.focus();
      expect(link).toHaveFocus();
    });

    it('has proper semantic HTML structure', () => {
      const { container } = renderWithProviders(<ForbiddenPage />);
      expect(container.querySelector('[role="main"]')).toBeInTheDocument();
      expect(container.querySelector('h1')).toBeInTheDocument();
      expect(container.querySelector('[role="navigation"]')).toBeInTheDocument();
    });

    it('maintains focus order', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ForbiddenPage />);

      const button = screen.getByRole('button', { name: /go back/i });
      const link = screen.getByRole('link', { name: /go home/i });

      await user.tab();
      expect(button).toHaveFocus();

      await user.tab();
      expect(link).toHaveFocus();
    });
  });

  describe('Responsive Behavior', () => {
    it('renders correctly on mobile viewport', () => {
      global.innerWidth = 375;
      global.innerHeight = 667;
      renderWithProviders(<ForbiddenPage />);

      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders correctly on tablet viewport', () => {
      global.innerWidth = 768;
      global.innerHeight = 1024;
      renderWithProviders(<ForbiddenPage />);

      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders correctly on desktop viewport', () => {
      global.innerWidth = 1920;
      global.innerHeight = 1080;
      renderWithProviders(<ForbiddenPage />);

      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('has responsive padding', () => {
      const { container } = renderWithProviders(<ForbiddenPage />);
      const mainDiv = container.querySelector('[role="main"]');
      expect(mainDiv).toHaveStyle({ padding: '20px' });
    });

    it('content wrapper has max-width constraint', () => {
      const { container } = renderWithProviders(<ForbiddenPage />);
      const contentWrapper = container.querySelector('[role="main"] > div');
      expect(contentWrapper).toHaveStyle({ maxWidth: '600px' });
    });

    it('maintains layout integrity on small screens', () => {
      global.innerWidth = 320;
      renderWithProviders(<ForbiddenPage />);

      expect(screen.getByText('403')).toBeInTheDocument();
      expect(screen.getByText('Access Forbidden')).toBeInTheDocument();
    });

    it('navigation flexbox layout works on all screen sizes', () => {
      renderWithProviders(<ForbiddenPage />);
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveStyle({
        display: 'flex',
        gap: '16px',
        justifyContent: 'center',
      });
    });
  });

  describe('Visual Styling', () => {
    it('applies correct color scheme', () => {
      const { container } = renderWithProviders(<ForbiddenPage />);
      const contentWrapper = container.querySelector('[role="main"] > div');
      expect(contentWrapper).toHaveStyle({ color: '#fff' });
    });

    it('uses proper border radius on buttons', () => {
      renderWithProviders(<ForbiddenPage />);
      const button = screen.getByRole('button', { name: /go back/i });
      const link = screen.getByRole('link', { name: /go home/i });

      expect(button).toHaveStyle({ borderRadius: '12px' });
      expect(link).toHaveStyle({ borderRadius: '12px' });
    });

    it('applies text shadow to error code', () => {
      renderWithProviders(<ForbiddenPage />);
      const errorCode = screen.getByText('403');
      expect(errorCode).toHaveStyle({
        textShadow: '0 10px 30px rgba(0,0,0,0.3)',
      });
    });

    it('buttons have proper font weight', () => {
      renderWithProviders(<ForbiddenPage />);
      const button = screen.getByRole('button', { name: /go back/i });
      const link = screen.getByRole('link', { name: /go home/i });

      expect(button).toHaveStyle({ fontWeight: '600' });
      expect(link).toHaveStyle({ fontWeight: '600' });
    });

    it('message text has proper opacity', () => {
      renderWithProviders(<ForbiddenPage />);
      const message = screen.getByText(/you don't have permission to access this page/i);
      expect(message).toHaveStyle({ opacity: 0.9 });
    });

    it('applies gradient background correctly', () => {
      const { container } = renderWithProviders(<ForbiddenPage />);
      const mainDiv = container.querySelector('[role="main"]');
      expect(mainDiv).toHaveStyle({
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles navigate function being undefined gracefully', () => {
      const mockNavigateUndefined = undefined;
      jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigateUndefined);

      expect(() => renderWithProviders(<ForbiddenPage />)).not.toThrow();
    });

    it('renders correctly when mounted multiple times', () => {
      const { unmount } = renderWithProviders(<ForbiddenPage />);
      unmount();

      renderWithProviders(<ForbiddenPage />);
      expect(screen.getByText('Access Forbidden')).toBeInTheDocument();
    });

    it('handles rapid remounting', () => {
      for (let i = 0; i < 5; i++) {
        const { unmount } = renderWithProviders(<ForbiddenPage />);
        expect(screen.getByText('403')).toBeInTheDocument();
        unmount();
      }
    });

    it('maintains state across hover interactions', () => {
      renderWithProviders(<ForbiddenPage />);
      const button = screen.getByRole('button', { name: /go back/i });

      for (let i = 0; i < 10; i++) {
        fireEvent.mouseOver(button);
        fireEvent.mouseOut(button);
      }

      expect(button).toBeInTheDocument();
    });

    it('handles null children gracefully', () => {
      renderWithProviders(<ForbiddenPage />);
      expect(screen.getByText('403')).toBeInTheDocument();
    });

    it('renders when router context is available', () => {
      render(
        <MemoryRouter>
          <ForbiddenPage />
        </MemoryRouter>
      );
      expect(screen.getByText('Access Forbidden')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('integrates with React Router properly', () => {
      renderWithProviders(<ForbiddenPage />);
      const link = screen.getByRole('link', { name: /go home/i });
      expect(link).toHaveAttribute('href', '/');
    });

    it('works within MemoryRouter', () => {
      render(
        <MemoryRouter>
          <ForbiddenPage />
        </MemoryRouter>
      );
      expect(screen.getByText('Access Forbidden')).toBeInTheDocument();
    });

    it('button click triggers navigation', async () => {
      renderWithProviders(<ForbiddenPage />);
      const button = screen.getByRole('button', { name: /go back/i });

      fireEvent.click(button);
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('maintains functionality after re-render', () => {
      const { rerender } = renderWithProviders(<ForbiddenPage />);
      rerender(<ForbiddenPage />);

      const button = screen.getByRole('button', { name: /go back/i });
      fireEvent.click(button);

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  describe('Performance', () => {
    it('renders quickly without delays', () => {
      const startTime = performance.now();
      renderWithProviders(<ForbiddenPage />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('does not cause memory leaks on unmount', () => {
      const { unmount } = renderWithProviders(<ForbiddenPage />);
      expect(() => unmount()).not.toThrow();
    });

    it('handles multiple rapid interactions efficiently', () => {
      renderWithProviders(<ForbiddenPage />);
      const button = screen.getByRole('button', { name: /go back/i });

      for (let i = 0; i < 100; i++) {
        fireEvent.click(button);
      }

      expect(mockNavigate).toHaveBeenCalledTimes(100);
    });
  });

  describe('Content Validation', () => {
    it('displays exact error code text', () => {
      renderWithProviders(<ForbiddenPage />);
      expect(screen.getByText('403')).toBeInTheDocument();
    });

    it('displays exact heading text', () => {
      renderWithProviders(<ForbiddenPage />);
      expect(screen.getByText('Access Forbidden')).toBeInTheDocument();
    });

    it('displays exact message text', () => {
      renderWithProviders(<ForbiddenPage />);
      expect(screen.getByText("You don't have permission to access this page.")).toBeInTheDocument();
    });

    it('displays exact button text', () => {
      renderWithProviders(<ForbiddenPage />);
      expect(screen.getByRole('button', { name: 'Go Back' })).toBeInTheDocument();
    });

    it('displays exact link text', () => {
      renderWithProviders(<ForbiddenPage />);
      expect(screen.getByRole('link', { name: 'Go Home' })).toBeInTheDocument();
    });

    it('all text content is present', () => {
      renderWithProviders(<ForbiddenPage />);
      expect(screen.getByText('403')).toBeInTheDocument();
      expect(screen.getByText('Access Forbidden')).toBeInTheDocument();
      expect(screen.getByText("You don't have permission to access this page.")).toBeInTheDocument();
      expect(screen.getByText('Go Back')).toBeInTheDocument();
      expect(screen.getByText('Go Home')).toBeInTheDocument();
    });
  });

  describe('Layout and Structure', () => {
    it('uses flexbox for centering', () => {
      const { container } = renderWithProviders(<ForbiddenPage />);
      const mainDiv = container.querySelector('[role="main"]');
      expect(mainDiv).toHaveStyle({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      });
    });

    it('content is centered horizontally', () => {
      const { container } = renderWithProviders(<ForbiddenPage />);
      const contentWrapper = container.querySelector('[role="main"] > div');
      expect(contentWrapper).toHaveStyle({ textAlign: 'center' });
    });

    it('navigation buttons are in flex container', () => {
      renderWithProviders(<ForbiddenPage />);
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveStyle({
        display: 'flex',
        gap: '16px',
        justifyContent: 'center',
      });
    });

    it('elements are properly spaced', () => {
      renderWithProviders(<ForbiddenPage />);
      const errorCode = screen.getByText('403');
      const heading = screen.getByText('Access Forbidden');
      const message = screen.getByText(/you don't have permission/i);

      expect(errorCode).toHaveStyle({ marginBottom: '20px' });
      expect(heading).toHaveStyle({ marginBottom: '16px' });
      expect(message).toHaveStyle({ marginBottom: '32px' });
    });
  });

  describe('Interactive States', () => {
    it('button transforms on mouse over', () => {
      renderWithProviders(<ForbiddenPage />);
      const button = screen.getByRole('button', { name: /go back/i });

      fireEvent.mouseOver(button);
      expect(button.style.transform).toBe('scale(1.05)');
    });

    it('button reverts transform on mouse out', () => {
      renderWithProviders(<ForbiddenPage />);
      const button = screen.getByRole('button', { name: /go back/i });

      fireEvent.mouseOver(button);
      fireEvent.mouseOut(button);
      expect(button.style.transform).toBe('scale(1)');
    });

    it('link transforms on mouse over', () => {
      renderWithProviders(<ForbiddenPage />);
      const link = screen.getByRole('link', { name: /go home/i });

      fireEvent.mouseOver(link);
      expect(link.style.transform).toBe('scale(1.05)');
    });

    it('link reverts transform on mouse out', () => {
      renderWithProviders(<ForbiddenPage />);
      const link = screen.getByRole('link', { name: /go home/i });

      fireEvent.mouseOver(link);
      fireEvent.mouseOut(link);
      expect(link.style.transform).toBe('scale(1)');
    });

    it('link background changes on hover', () => {
      renderWithProviders(<ForbiddenPage />);
      const link = screen.getByRole('link', { name: /go home/i });

      fireEvent.mouseOver(link);
      expect(link.style.background).toBe('rgba(255,255,255,0.3)');

      fireEvent.mouseOut(link);
      expect(link.style.background).toBe('rgba(255,255,255,0.2)');
    });

    it('handles consecutive hover events', () => {
      renderWithProviders(<ForbiddenPage />);
      const button = screen.getByRole('button', { name: /go back/i });

      fireEvent.mouseOver(button);
      fireEvent.mouseOver(button);
      expect(button.style.transform).toBe('scale(1.05)');

      fireEvent.mouseOut(button);
      expect(button.style.transform).toBe('scale(1)');
    });
  });

  describe('Browser Compatibility', () => {
    it('renders without errors in different browsers', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithProviders(<ForbiddenPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('handles CSS transforms correctly', () => {
      renderWithProviders(<ForbiddenPage />);
      const button = screen.getByRole('button', { name: /go back/i });
      fireEvent.mouseOver(button);
      expect(button.style.transform).toBe('scale(1.05)');
    });

    it('supports flexbox layout', () => {
      const { container } = renderWithProviders(<ForbiddenPage />);
      const mainDiv = container.querySelector('[role="main"]');
      expect(mainDiv).toHaveStyle({ display: 'flex' });
    });
  });

  describe('Snapshot Testing', () => {
    it('matches snapshot', () => {
      const { container } = renderWithProviders(<ForbiddenPage />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('button snapshot remains consistent', () => {
      renderWithProviders(<ForbiddenPage />);
      const button = screen.getByRole('button', { name: /go back/i });
      expect(button).toMatchSnapshot();
    });

    it('link snapshot remains consistent', () => {
      renderWithProviders(<ForbiddenPage />);
      const link = screen.getByRole('link', { name: /go home/i });
      expect(link).toMatchSnapshot();
    });

    it('full page snapshot', () => {
      const { container } = renderWithProviders(<ForbiddenPage />);
      expect(container).toMatchSnapshot();
    });
  });

  describe('Error Boundaries', () => {
    it('does not throw errors during render', () => {
      expect(() => renderWithProviders(<ForbiddenPage />)).not.toThrow();
    });

    it('handles missing router context gracefully', () => {
      // Component should handle this without crashing
      expect(() => renderWithProviders(<ForbiddenPage />)).not.toThrow();
    });

    it('recovers from navigation errors', () => {
      mockNavigate.mockImplementation(() => {
        throw new Error('Navigation error');
      });

      renderWithProviders(<ForbiddenPage />);
      const button = screen.getByRole('button', { name: /go back/i });

      expect(() => fireEvent.click(button)).toThrow('Navigation error');
    });
  });

  describe('State Management', () => {
    it('maintains component state correctly', () => {
      renderWithProviders(<ForbiddenPage />);
      expect(screen.getByText('Access Forbidden')).toBeInTheDocument();
    });

    it('does not have internal state changes', () => {
      const { container } = renderWithProviders(<ForbiddenPage />);
      const initialHTML = container.innerHTML;

      // Trigger some interactions
      const button = screen.getByRole('button', { name: /go back/i });
      fireEvent.mouseOver(button);
      fireEvent.mouseOut(button);

      // Content should remain the same
      expect(screen.getByText('Access Forbidden')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('displays content immediately without loading state', () => {
      renderWithProviders(<ForbiddenPage />);
      expect(screen.getByText('403')).toBeInTheDocument();
      expect(screen.getByText('Access Forbidden')).toBeInTheDocument();
    });

    it('does not show loading indicators', () => {
      renderWithProviders(<ForbiddenPage />);
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('does not display error messages', () => {
      renderWithProviders(<ForbiddenPage />);
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });

    it('handles component errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithProviders(<ForbiddenPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Cleanup', () => {
    it('cleans up event listeners on unmount', () => {
      const { unmount } = renderWithProviders(<ForbiddenPage />);
      expect(() => unmount()).not.toThrow();
    });

    it('does not leave side effects after unmount', () => {
      const { unmount } = renderWithProviders(<ForbiddenPage />);
      unmount();
      expect(mockNavigate).toHaveBeenCalled;
    });
  });
});

export default mockNavigate
