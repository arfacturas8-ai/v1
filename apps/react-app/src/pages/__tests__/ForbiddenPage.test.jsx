/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../__test__/utils/testUtils';
import ForbiddenPage from '../ForbiddenPage';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: ({ children, to, ...props }) => (
    <a href={to} {...props}>{children}</a>
  ),
}));

describe('ForbiddenPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Page Rendering', () => {
    it('renders page without crashing', () => {
      const { container } = renderWithProviders(<ForbiddenPage />);
      expect(container).toBeInTheDocument();
    });

    it('displays main content area with correct role', () => {
      renderWithProviders(<ForbiddenPage />);
      const mainElement = screen.getByRole('main');
      expect(mainElement).toBeInTheDocument();
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithProviders(<ForbiddenPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('displays the 403 error code', () => {
      renderWithProviders(<ForbiddenPage />);
      const errorCode = screen.getByText('403');
      expect(errorCode).toBeInTheDocument();
    });

    it('displays the Access Forbidden heading', () => {
      renderWithProviders(<ForbiddenPage />);
      const heading = screen.getByText('Access Forbidden');
      expect(heading).toBeInTheDocument();
    });

    it('displays the permission message', () => {
      renderWithProviders(<ForbiddenPage />);
      const message = screen.getByText("You don't have permission to access this page.");
      expect(message).toBeInTheDocument();
    });

    it('renders Go Back button', () => {
      renderWithProviders(<ForbiddenPage />);
      const goBackButton = screen.getByRole('button', { name: /go back/i });
      expect(goBackButton).toBeInTheDocument();
    });

    it('renders Go Home link', () => {
      renderWithProviders(<ForbiddenPage />);
      const goHomeLink = screen.getByRole('link', { name: /go home/i });
      expect(goHomeLink).toBeInTheDocument();
    });
  });

  describe('403 Error Display', () => {
    it('shows 403 error code with correct styling', () => {
      const { container } = renderWithProviders(<ForbiddenPage />);
      const errorCode = screen.getByText('403');
      expect(errorCode).toHaveStyle({ fontSize: '120px' });
    });

    it('has aria-hidden attribute on error code', () => {
      renderWithProviders(<ForbiddenPage />);
      const errorCode = screen.getByText('403');
      expect(errorCode).toHaveAttribute('aria-hidden', 'true');
    });

    it('renders error code with high visibility', () => {
      const { container } = renderWithProviders(<ForbiddenPage />);
      const errorCode = screen.getByText('403');
      expect(errorCode).toHaveStyle({ fontWeight: 'bold' });
    });

    it('displays error code before heading', () => {
      const { container } = renderWithProviders(<ForbiddenPage />);
      const errorCode = screen.getByText('403');
      const heading = screen.getByText('Access Forbidden');
      const parent = errorCode.parentElement;
      expect(parent.contains(errorCode)).toBe(true);
      expect(parent.contains(heading)).toBe(true);
    });
  });

  describe('Navigation', () => {
    it('Go Back button triggers navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ForbiddenPage />);
      const goBackButton = screen.getByRole('button', { name: /go back/i });

      await user.click(goBackButton);

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('Go Home link points to root path', () => {
      renderWithProviders(<ForbiddenPage />);
      const goHomeLink = screen.getByRole('link', { name: /go home/i });
      expect(goHomeLink).toHaveAttribute('href', '/');
    });

    it('navigation elements are within a nav element', () => {
      renderWithProviders(<ForbiddenPage />);
      const nav = screen.getByRole('navigation', { name: /navigation/i });
      expect(nav).toBeInTheDocument();
    });

    it('Go Back button is clickable', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ForbiddenPage />);
      const goBackButton = screen.getByRole('button', { name: /go back/i });

      await user.click(goBackButton);

      expect(mockNavigate).toHaveBeenCalled();
    });

    it('both navigation options are visible', () => {
      renderWithProviders(<ForbiddenPage />);
      const goBackButton = screen.getByRole('button', { name: /go back/i });
      const goHomeLink = screen.getByRole('link', { name: /go home/i });

      expect(goBackButton).toBeVisible();
      expect(goHomeLink).toBeVisible();
    });
  });

  describe('User Interactions', () => {
    it('Go Back button responds to clicks', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ForbiddenPage />);
      const goBackButton = screen.getByRole('button', { name: /go back/i });

      await user.click(goBackButton);

      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });

    it('Go Back button responds to multiple clicks', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ForbiddenPage />);
      const goBackButton = screen.getByRole('button', { name: /go back/i });

      await user.click(goBackButton);
      await user.click(goBackButton);

      expect(mockNavigate).toHaveBeenCalledTimes(2);
    });

    it('handles mouse over on Go Back button', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ForbiddenPage />);
      const goBackButton = screen.getByRole('button', { name: /go back/i });

      await user.hover(goBackButton);

      expect(goBackButton).toBeInTheDocument();
    });

    it('handles mouse out on Go Back button', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ForbiddenPage />);
      const goBackButton = screen.getByRole('button', { name: /go back/i });

      await user.hover(goBackButton);
      await user.unhover(goBackButton);

      expect(goBackButton).toBeInTheDocument();
    });

    it('handles mouse over on Go Home link', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ForbiddenPage />);
      const goHomeLink = screen.getByRole('link', { name: /go home/i });

      await user.hover(goHomeLink);

      expect(goHomeLink).toBeInTheDocument();
    });

    it('handles mouse out on Go Home link', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ForbiddenPage />);
      const goHomeLink = screen.getByRole('link', { name: /go home/i });

      await user.hover(goHomeLink);
      await user.unhover(goHomeLink);

      expect(goHomeLink).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper page structure with main role', () => {
      renderWithProviders(<ForbiddenPage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('has proper aria-label on main element', () => {
      renderWithProviders(<ForbiddenPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', 'Forbidden page');
    });

    it('has proper heading hierarchy', () => {
      renderWithProviders(<ForbiddenPage />);
      const heading = screen.getByRole('heading', { name: /access forbidden/i });
      expect(heading).toBeInTheDocument();
    });

    it('supports keyboard navigation to Go Back button', () => {
      renderWithProviders(<ForbiddenPage />);
      const goBackButton = screen.getByRole('button', { name: /go back/i });
      goBackButton.focus();
      expect(document.activeElement).toBe(goBackButton);
    });

    it('supports keyboard navigation to Go Home link', () => {
      renderWithProviders(<ForbiddenPage />);
      const goHomeLink = screen.getByRole('link', { name: /go home/i });
      goHomeLink.focus();
      expect(document.activeElement).toBe(goHomeLink);
    });

    it('has navigation landmark', () => {
      renderWithProviders(<ForbiddenPage />);
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('navigation has proper aria-label', () => {
      renderWithProviders(<ForbiddenPage />);
      const nav = screen.getByRole('navigation', { name: /navigation/i });
      expect(nav).toBeInTheDocument();
    });

    it('error code is hidden from screen readers', () => {
      renderWithProviders(<ForbiddenPage />);
      const errorCode = screen.getByText('403');
      expect(errorCode).toHaveAttribute('aria-hidden', 'true');
    });

    it('buttons have descriptive text', () => {
      renderWithProviders(<ForbiddenPage />);
      const goBackButton = screen.getByRole('button', { name: /go back/i });
      expect(goBackButton.textContent).toBe('Go Back');
    });

    it('links have descriptive text', () => {
      renderWithProviders(<ForbiddenPage />);
      const goHomeLink = screen.getByRole('link', { name: /go home/i });
      expect(goHomeLink.textContent).toBe('Go Home');
    });
  });

  describe('Responsive Behavior', () => {
    it('renders with full height viewport', () => {
      const { container } = renderWithProviders(<ForbiddenPage />);
      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveStyle({ minHeight: '100vh' });
    });

    it('has padding for mobile devices', () => {
      const { container } = renderWithProviders(<ForbiddenPage />);
      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveStyle({ padding: '20px' });
    });

    it('uses flexbox for centering', () => {
      const { container } = renderWithProviders(<ForbiddenPage />);
      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveStyle({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      });
    });

    it('has max width constraint on content', () => {
      const { container } = renderWithProviders(<ForbiddenPage />);
      const contentDiv = container.querySelector('[style*="maxWidth"]');
      expect(contentDiv).toBeInTheDocument();
    });
  });

  describe('Visual Design', () => {
    it('has gradient background', () => {
      const { container } = renderWithProviders(<ForbiddenPage />);
      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveStyle({
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
      });
    });

    it('displays content in white color', () => {
      const { container } = renderWithProviders(<ForbiddenPage />);
      const contentDiv = container.querySelector('[style*="color"]');
      expect(contentDiv).toBeInTheDocument();
    });

    it('centers text content', () => {
      const { container } = renderWithProviders(<ForbiddenPage />);
      const contentDiv = container.querySelector('[style*="textAlign"]');
      expect(contentDiv).toBeInTheDocument();
    });

    it('Go Back button has white background', () => {
      renderWithProviders(<ForbiddenPage />);
      const goBackButton = screen.getByRole('button', { name: /go back/i });
      expect(goBackButton).toHaveStyle({ background: '#fff' });
    });

    it('Go Home link has transparent background', () => {
      renderWithProviders(<ForbiddenPage />);
      const goHomeLink = screen.getByRole('link', { name: /go home/i });
      expect(goHomeLink).toHaveStyle({ background: 'rgba(255,255,255,0.2)' });
    });

    it('navigation elements have gap spacing', () => {
      renderWithProviders(<ForbiddenPage />);
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveStyle({ gap: '16px' });
    });

    it('error code has text shadow', () => {
      renderWithProviders(<ForbiddenPage />);
      const errorCode = screen.getByText('403');
      expect(errorCode).toHaveStyle({ textShadow: '0 10px 30px rgba(0,0,0,0.3)' });
    });
  });

  describe('Button Styling', () => {
    it('Go Back button has proper padding', () => {
      renderWithProviders(<ForbiddenPage />);
      const goBackButton = screen.getByRole('button', { name: /go back/i });
      expect(goBackButton).toHaveStyle({ padding: '14px 32px' });
    });

    it('Go Back button has rounded corners', () => {
      renderWithProviders(<ForbiddenPage />);
      const goBackButton = screen.getByRole('button', { name: /go back/i });
      expect(goBackButton).toHaveStyle({ borderRadius: '12px' });
    });

    it('Go Back button has no border', () => {
      renderWithProviders(<ForbiddenPage />);
      const goBackButton = screen.getByRole('button', { name: /go back/i });
      expect(goBackButton).toHaveStyle({ border: 'none' });
    });

    it('Go Back button has pointer cursor', () => {
      renderWithProviders(<ForbiddenPage />);
      const goBackButton = screen.getByRole('button', { name: /go back/i });
      expect(goBackButton).toHaveStyle({ cursor: 'pointer' });
    });

    it('Go Home link has border', () => {
      renderWithProviders(<ForbiddenPage />);
      const goHomeLink = screen.getByRole('link', { name: /go home/i });
      expect(goHomeLink).toHaveStyle({ border: '2px solid #fff' });
    });

    it('Go Home link has proper padding', () => {
      renderWithProviders(<ForbiddenPage />);
      const goHomeLink = screen.getByRole('link', { name: /go home/i });
      expect(goHomeLink).toHaveStyle({ padding: '14px 32px' });
    });

    it('Go Home link has no text decoration', () => {
      renderWithProviders(<ForbiddenPage />);
      const goHomeLink = screen.getByRole('link', { name: /go home/i });
      expect(goHomeLink).toHaveStyle({ textDecoration: 'none' });
    });
  });

  describe('Content Display', () => {
    it('displays heading with correct size', () => {
      renderWithProviders(<ForbiddenPage />);
      const heading = screen.getByRole('heading', { name: /access forbidden/i });
      expect(heading).toHaveStyle({ fontSize: '32px' });
    });

    it('displays message with correct opacity', () => {
      renderWithProviders(<ForbiddenPage />);
      const message = screen.getByText("You don't have permission to access this page.");
      expect(message).toHaveStyle({ opacity: 0.9 });
    });

    it('displays error message content', () => {
      renderWithProviders(<ForbiddenPage />);
      expect(screen.getByText("You don't have permission to access this page.")).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('renders all required elements together', () => {
      renderWithProviders(<ForbiddenPage />);

      expect(screen.getByText('403')).toBeInTheDocument();
      expect(screen.getByText('Access Forbidden')).toBeInTheDocument();
      expect(screen.getByText("You don't have permission to access this page.")).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /go home/i })).toBeInTheDocument();
    });

    it('maintains layout structure', () => {
      renderWithProviders(<ForbiddenPage />);
      const main = screen.getByRole('main');
      const nav = screen.getByRole('navigation');

      expect(main).toBeInTheDocument();
      expect(nav).toBeInTheDocument();
    });
  });
});

export default mockNavigate
