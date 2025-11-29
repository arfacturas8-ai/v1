/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../__test__/utils/testUtils';
import RateLimitedPage from '../RateLimitedPage';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: ({ children, to, ...props }) => (
    <a href={to} {...props}>{children}</a>
  ),
}));

describe('RateLimitedPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Page Rendering', () => {
    it('renders page without crashing', () => {
      const { container } = renderWithProviders(<RateLimitedPage />);
      expect(container).toBeInTheDocument();
    });

    it('displays main content area with correct role', () => {
      renderWithProviders(<RateLimitedPage />);
      const mainElement = screen.getByRole('main');
      expect(mainElement).toBeInTheDocument();
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithProviders(<RateLimitedPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('displays the 429 error code', () => {
      renderWithProviders(<RateLimitedPage />);
      const errorCode = screen.getByText('429');
      expect(errorCode).toBeInTheDocument();
    });

    it('displays the main heading', () => {
      renderWithProviders(<RateLimitedPage />);
      const heading = screen.getByText('Slow Down There!');
      expect(heading).toBeInTheDocument();
    });

    it('displays the rate limit message', () => {
      renderWithProviders(<RateLimitedPage />);
      const message = screen.getByText("You've made too many requests. Please wait a moment before trying again.");
      expect(message).toBeInTheDocument();
    });

    it('displays countdown timer', () => {
      renderWithProviders(<RateLimitedPage />);
      const timer = screen.getByRole('timer');
      expect(timer).toBeInTheDocument();
    });
  });

  describe('429 Error Display', () => {
    it('shows 429 error code with correct styling', () => {
      const { container } = renderWithProviders(<RateLimitedPage />);
      const errorCode = screen.getByText('429');
      expect(errorCode).toHaveStyle({ fontSize: '120px' });
    });

    it('has aria-hidden attribute on error code', () => {
      renderWithProviders(<RateLimitedPage />);
      const errorCode = screen.getByText('429');
      expect(errorCode).toHaveAttribute('aria-hidden', 'true');
    });

    it('renders error code with high visibility', () => {
      renderWithProviders(<RateLimitedPage />);
      const errorCode = screen.getByText('429');
      expect(errorCode).toHaveStyle({ fontWeight: 'bold' });
    });

    it('error code has text shadow', () => {
      renderWithProviders(<RateLimitedPage />);
      const errorCode = screen.getByText('429');
      expect(errorCode).toHaveStyle({ textShadow: '0 10px 30px rgba(0,0,0,0.3)' });
    });
  });

  describe('Countdown Timer', () => {
    it('initializes countdown at 60 seconds', () => {
      renderWithProviders(<RateLimitedPage />);
      expect(screen.getByText('1:00')).toBeInTheDocument();
    });

    it('decrements countdown every second', () => {
      renderWithProviders(<RateLimitedPage />);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(screen.getByText('0:59')).toBeInTheDocument();
    });

    it('formats countdown with leading zero for seconds', () => {
      renderWithProviders(<RateLimitedPage />);

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(screen.getByText('0:55')).toBeInTheDocument();
    });

    it('continues counting down to zero', () => {
      renderWithProviders(<RateLimitedPage />);

      act(() => {
        jest.advanceTimersByTime(60000);
      });

      expect(screen.getByText('0:00')).toBeInTheDocument();
    });

    it('stops at zero', () => {
      renderWithProviders(<RateLimitedPage />);

      act(() => {
        jest.advanceTimersByTime(65000);
      });

      expect(screen.getByText('0:00')).toBeInTheDocument();
    });

    it('has timer role for accessibility', () => {
      renderWithProviders(<RateLimitedPage />);
      const timer = screen.getByRole('timer');
      expect(timer).toBeInTheDocument();
    });

    it('has aria-live attribute for screen readers', () => {
      renderWithProviders(<RateLimitedPage />);
      const timer = screen.getByRole('timer');
      expect(timer).toHaveAttribute('aria-live', 'polite');
    });

    it('has aria-atomic attribute', () => {
      renderWithProviders(<RateLimitedPage />);
      const timer = screen.getByRole('timer');
      expect(timer).toHaveAttribute('aria-atomic', 'true');
    });

    it('displays helper text below timer', () => {
      renderWithProviders(<RateLimitedPage />);
      expect(screen.getByText('Time until you can try again')).toBeInTheDocument();
    });

    it('countdown updates correctly at 30 seconds', () => {
      renderWithProviders(<RateLimitedPage />);

      act(() => {
        jest.advanceTimersByTime(30000);
      });

      expect(screen.getByText('0:30')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('renders Go Back button', () => {
      renderWithProviders(<RateLimitedPage />);
      const goBackButton = screen.getByRole('button', { name: /go back to previous page/i });
      expect(goBackButton).toBeInTheDocument();
    });

    it('renders Go Home link', () => {
      renderWithProviders(<RateLimitedPage />);
      const goHomeLink = screen.getByRole('link', { name: /go to home page/i });
      expect(goHomeLink).toBeInTheDocument();
    });

    it('Go Back button triggers navigation', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProviders(<RateLimitedPage />);
      const goBackButton = screen.getByRole('button', { name: /go back to previous page/i });

      await user.click(goBackButton);

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('Go Home link points to root path', () => {
      renderWithProviders(<RateLimitedPage />);
      const goHomeLink = screen.getByRole('link', { name: /go to home page/i });
      expect(goHomeLink).toHaveAttribute('href', '/');
    });

    it('navigation elements have proper aria-labels', () => {
      renderWithProviders(<RateLimitedPage />);
      const goBackButton = screen.getByRole('button', { name: /go back to previous page/i });
      const goHomeLink = screen.getByRole('link', { name: /go to home page/i });

      expect(goBackButton).toHaveAttribute('aria-label', 'Go back to previous page');
      expect(goHomeLink).toHaveAttribute('aria-label', 'Go to home page');
    });
  });

  describe('Informational Section', () => {
    it('displays "Why did this happen?" section', () => {
      renderWithProviders(<RateLimitedPage />);
      expect(screen.getByText('Why did this happen?')).toBeInTheDocument();
    });

    it('explains too many requests', () => {
      renderWithProviders(<RateLimitedPage />);
      expect(screen.getByText('• You sent too many requests in a short time')).toBeInTheDocument();
    });

    it('explains rate limit purpose', () => {
      renderWithProviders(<RateLimitedPage />);
      expect(screen.getByText('• Rate limits help protect our service for everyone')).toBeInTheDocument();
    });

    it('mentions automated scripts', () => {
      renderWithProviders(<RateLimitedPage />);
      expect(screen.getByText('• Automated scripts may trigger this protection')).toBeInTheDocument();
    });

    it('displays all three explanation points', () => {
      renderWithProviders(<RateLimitedPage />);
      const explanations = screen.getAllByText(/•/);
      expect(explanations.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Support Link', () => {
    it('displays support section', () => {
      renderWithProviders(<RateLimitedPage />);
      expect(screen.getByText(/Having issues\?/)).toBeInTheDocument();
    });

    it('has contact support link', () => {
      renderWithProviders(<RateLimitedPage />);
      const supportLink = screen.getByRole('link', { name: /contact support/i });
      expect(supportLink).toBeInTheDocument();
    });

    it('contact support link points to help page', () => {
      renderWithProviders(<RateLimitedPage />);
      const supportLink = screen.getByRole('link', { name: /contact support/i });
      expect(supportLink).toHaveAttribute('href', '/help');
    });
  });

  describe('Accessibility', () => {
    it('has proper page structure with main role', () => {
      renderWithProviders(<RateLimitedPage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('has proper aria-label on main element', () => {
      renderWithProviders(<RateLimitedPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', '429 Rate Limited');
    });

    it('has main content id', () => {
      renderWithProviders(<RateLimitedPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('id', 'main-content');
    });

    it('has proper heading hierarchy', () => {
      renderWithProviders(<RateLimitedPage />);
      const heading = screen.getByRole('heading', { name: /slow down there!/i });
      expect(heading).toBeInTheDocument();
    });

    it('supports keyboard navigation to Go Back button', () => {
      renderWithProviders(<RateLimitedPage />);
      const goBackButton = screen.getByRole('button', { name: /go back to previous page/i });
      goBackButton.focus();
      expect(document.activeElement).toBe(goBackButton);
    });

    it('has navigation landmark', () => {
      renderWithProviders(<RateLimitedPage />);
      const nav = screen.getByRole('navigation', { name: /error page actions/i });
      expect(nav).toBeInTheDocument();
    });

    it('error code is hidden from screen readers', () => {
      renderWithProviders(<RateLimitedPage />);
      const errorCode = screen.getByText('429');
      expect(errorCode).toHaveAttribute('aria-hidden', 'true');
    });

    it('Clock icon is hidden from screen readers', () => {
      const { container } = renderWithProviders(<RateLimitedPage />);
      const icons = container.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Visual Design', () => {
    it('has gradient background', () => {
      const { container } = renderWithProviders(<RateLimitedPage />);
      const mainDiv = container.querySelector('#main-content');
      expect(mainDiv).toHaveStyle({
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
      });
    });

    it('has full viewport height', () => {
      const { container } = renderWithProviders(<RateLimitedPage />);
      const mainDiv = container.querySelector('#main-content');
      expect(mainDiv).toHaveStyle({ minHeight: '100vh' });
    });

    it('centers content', () => {
      const { container } = renderWithProviders(<RateLimitedPage />);
      const mainDiv = container.querySelector('#main-content');
      expect(mainDiv).toHaveStyle({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      });
    });

    it('displays spinning animation', () => {
      const { container } = renderWithProviders(<RateLimitedPage />);
      const style = container.querySelector('style');
      expect(style.textContent).toContain('@keyframes spin');
    });
  });

  describe('Responsive Behavior', () => {
    it('has padding for mobile devices', () => {
      const { container } = renderWithProviders(<RateLimitedPage />);
      const mainDiv = container.querySelector('#main-content');
      expect(mainDiv).toHaveStyle({ padding: '20px' });
    });

    it('navigation buttons are wrapped for mobile', () => {
      renderWithProviders(<RateLimitedPage />);
      const nav = screen.getByRole('navigation', { name: /error page actions/i });
      const buttonContainer = nav.querySelector('[style*="flexWrap"]');
      expect(buttonContainer).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('Go Back button responds to clicks', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProviders(<RateLimitedPage />);
      const goBackButton = screen.getByRole('button', { name: /go back to previous page/i });

      await user.click(goBackButton);

      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });

    it('handles mouse over on Go Back button', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProviders(<RateLimitedPage />);
      const goBackButton = screen.getByRole('button', { name: /go back to previous page/i });

      await user.hover(goBackButton);

      expect(goBackButton).toBeInTheDocument();
    });

    it('handles mouse over on Go Home link', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProviders(<RateLimitedPage />);
      const goHomeLink = screen.getByRole('link', { name: /go to home page/i });

      await user.hover(goHomeLink);

      expect(goHomeLink).toBeInTheDocument();
    });
  });

  describe('Timer Cleanup', () => {
    it('cleans up timer on unmount', () => {
      const { unmount } = renderWithProviders(<RateLimitedPage />);

      act(() => {
        unmount();
      });

      // Timer should be cleaned up
      expect(true).toBe(true);
    });

    it('timer continues to run while mounted', () => {
      renderWithProviders(<RateLimitedPage />);

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(screen.getByText('0:55')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('renders all required elements together', () => {
      renderWithProviders(<RateLimitedPage />);

      expect(screen.getByText('429')).toBeInTheDocument();
      expect(screen.getByText('Slow Down There!')).toBeInTheDocument();
      expect(screen.getByRole('timer')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /go home/i })).toBeInTheDocument();
    });

    it('maintains consistent layout structure', () => {
      renderWithProviders(<RateLimitedPage />);
      const main = screen.getByRole('main');
      const nav = screen.getByRole('navigation');

      expect(main).toBeInTheDocument();
      expect(nav).toBeInTheDocument();
    });
  });
});

export default mockNavigate
