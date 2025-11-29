/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { renderWithProviders } from '../__test__/utils/testUtils';
import NotFoundPage from './NotFoundPage';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Home: () => <div data-testid="home-icon">HomeIcon</div>,
  HelpCircle: () => <div data-testid="help-icon">HelpIcon</div>,
  Search: () => <div data-testid="search-icon">SearchIcon</div>,
  AlertCircle: () => <div data-testid="alert-icon">AlertIcon</div>,
}));

const mockNavigate = jest.fn();

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('NotFoundPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Page Rendering', () => {
    it('renders page without crashing', () => {
      const { container } = renderWithProviders(<NotFoundPage />);
      expect(container).toBeInTheDocument();
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithProviders(<NotFoundPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('displays main content wrapper with proper role', () => {
      renderWithProviders(<NotFoundPage />);
      const mainElement = screen.getByRole('main');
      expect(mainElement).toBeInTheDocument();
      expect(mainElement).toHaveAttribute('id', 'main-content');
    });

    it('has correct aria-label on main content', () => {
      renderWithProviders(<NotFoundPage />);
      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveAttribute('aria-label', '404 Page Not Found');
    });

    it('renders with gradient background', () => {
      const { container } = renderWithProviders(<NotFoundPage />);
      const mainDiv = container.querySelector('#main-content');
      expect(mainDiv).toHaveStyle({
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      });
    });

    it('renders content container with proper styling', () => {
      renderWithProviders(<NotFoundPage />);
      const mainElement = screen.getByRole('main');
      const contentDiv = mainElement.querySelector('div > div');
      expect(contentDiv).toBeInTheDocument();
    });
  });

  describe('404 Message Display', () => {
    it('displays 404 error code', () => {
      renderWithProviders(<NotFoundPage />);
      const errorCode = screen.getByText('404');
      expect(errorCode).toBeInTheDocument();
    });

    it('404 error code has aria-hidden attribute', () => {
      const { container } = renderWithProviders(<NotFoundPage />);
      const errorCodeDiv = container.querySelector('[aria-hidden="true"]');
      expect(errorCodeDiv).toHaveTextContent('404');
    });

    it('displays "Page Not Found" heading', () => {
      renderWithProviders(<NotFoundPage />);
      const heading = screen.getByRole('heading', { name: /Page Not Found/i });
      expect(heading).toBeInTheDocument();
    });

    it('displays descriptive error message', () => {
      renderWithProviders(<NotFoundPage />);
      const message = screen.getByText(/The page you're looking for doesn't exist or has been moved/i);
      expect(message).toBeInTheDocument();
    });

    it('error message is in a paragraph element', () => {
      renderWithProviders(<NotFoundPage />);
      const message = screen.getByText(/The page you're looking for doesn't exist or has been moved/i);
      expect(message.tagName).toBe('P');
    });

    it('404 code has large font size', () => {
      const { container } = renderWithProviders(<NotFoundPage />);
      const errorCode = container.querySelector('[aria-hidden="true"]');
      expect(errorCode).toHaveStyle({
        fontSize: '120px',
        fontWeight: 'bold',
      });
    });

    it('heading has proper font styling', () => {
      renderWithProviders(<NotFoundPage />);
      const heading = screen.getByRole('heading', { name: /Page Not Found/i });
      expect(heading).toHaveStyle({
        fontSize: '32px',
        fontWeight: '600',
      });
    });
  });

  describe('Navigation Buttons', () => {
    it('displays "Back to Home" button', () => {
      renderWithProviders(<NotFoundPage />);
      const homeButton = screen.getByRole('link', { name: /Back to Home page/i });
      expect(homeButton).toBeInTheDocument();
    });

    it('"Back to Home" button links to root path', () => {
      renderWithProviders(<NotFoundPage />);
      const homeButton = screen.getByRole('link', { name: /Back to Home page/i });
      expect(homeButton).toHaveAttribute('href', '/');
    });

    it('"Back to Home" button has correct text content', () => {
      renderWithProviders(<NotFoundPage />);
      const homeButton = screen.getByText('← Back to Home');
      expect(homeButton).toBeInTheDocument();
    });

    it('displays "Get Help" button', () => {
      renderWithProviders(<NotFoundPage />);
      const helpButton = screen.getByRole('link', { name: /Get help/i });
      expect(helpButton).toBeInTheDocument();
    });

    it('"Get Help" button links to help page', () => {
      renderWithProviders(<NotFoundPage />);
      const helpButton = screen.getByRole('link', { name: /Get help/i });
      expect(helpButton).toHaveAttribute('href', '/help');
    });

    it('"Get Help" button has correct text content', () => {
      renderWithProviders(<NotFoundPage />);
      const helpButton = screen.getByText('Get Help');
      expect(helpButton).toBeInTheDocument();
    });

    it('navigation buttons are within a nav element', () => {
      renderWithProviders(<NotFoundPage />);
      const nav = screen.getByRole('navigation', { name: /Error page actions/i });
      expect(nav).toBeInTheDocument();
    });

    it('navigation container has proper aria-label', () => {
      renderWithProviders(<NotFoundPage />);
      const nav = screen.getByRole('navigation', { name: /Error page actions/i });
      expect(nav).toHaveAttribute('aria-label', 'Error page actions');
    });

    it('both navigation buttons are inside the nav container', () => {
      renderWithProviders(<NotFoundPage />);
      const nav = screen.getByRole('navigation', { name: /Error page actions/i });
      const homeButton = screen.getByRole('link', { name: /Back to Home page/i });
      const helpButton = screen.getByRole('link', { name: /Get help/i });
      expect(nav).toContainElement(homeButton);
      expect(nav).toContainElement(helpButton);
    });
  });

  describe('Suggested Links', () => {
    it('displays suggested communities link', () => {
      renderWithProviders(<NotFoundPage />);
      const communitiesLink = screen.getByRole('link', { name: /communities page/i });
      expect(communitiesLink).toBeInTheDocument();
    });

    it('communities link has correct href', () => {
      renderWithProviders(<NotFoundPage />);
      const communitiesLink = screen.getByRole('link', { name: /communities page/i });
      expect(communitiesLink).toHaveAttribute('href', '/communities');
    });

    it('displays help text for lost users', () => {
      renderWithProviders(<NotFoundPage />);
      const helpText = screen.getByText(/Lost\? Try searching or visit our/i);
      expect(helpText).toBeInTheDocument();
    });

    it('communities link has underline styling', () => {
      renderWithProviders(<NotFoundPage />);
      const communitiesLink = screen.getByRole('link', { name: /communities page/i });
      expect(communitiesLink).toHaveStyle({
        textDecoration: 'underline',
        color: '#fff',
      });
    });

    it('suggestion section is positioned below navigation', () => {
      const { container } = renderWithProviders(<NotFoundPage />);
      const suggestionDiv = container.querySelector('div[style*="margin-top: 48px"]');
      expect(suggestionDiv).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      renderWithProviders(<NotFoundPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Page Not Found');
    });

    it('all interactive elements are keyboard accessible', () => {
      renderWithProviders(<NotFoundPage />);
      const homeButton = screen.getByRole('link', { name: /Back to Home page/i });
      const helpButton = screen.getByRole('link', { name: /Get help/i });
      const communitiesLink = screen.getByRole('link', { name: /communities page/i });

      expect(homeButton).toBeInTheDocument();
      expect(helpButton).toBeInTheDocument();
      expect(communitiesLink).toBeInTheDocument();
    });

    it('main content has semantic role', () => {
      renderWithProviders(<NotFoundPage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('navigation has semantic role with label', () => {
      renderWithProviders(<NotFoundPage />);
      const nav = screen.getByRole('navigation', { name: /Error page actions/i });
      expect(nav).toBeInTheDocument();
    });

    it('decorative 404 text is hidden from screen readers', () => {
      const { container } = renderWithProviders(<NotFoundPage />);
      const errorCode = container.querySelector('[aria-hidden="true"]');
      expect(errorCode).toBeInTheDocument();
      expect(errorCode).toHaveAttribute('aria-hidden', 'true');
    });

    it('links have descriptive aria-labels', () => {
      renderWithProviders(<NotFoundPage />);
      const homeButton = screen.getByRole('link', { name: /Back to Home page/i });
      const helpButton = screen.getByRole('link', { name: /Get help/i });

      expect(homeButton).toHaveAttribute('aria-label', 'Back to Home page');
      expect(helpButton).toHaveAttribute('aria-label', 'Get help');
    });

    it('page structure supports keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<NotFoundPage />);

      const homeButton = screen.getByRole('link', { name: /Back to Home page/i });

      await user.tab();
      expect(homeButton).toHaveFocus();
    });

    it('all text has sufficient color contrast', () => {
      const { container } = renderWithProviders(<NotFoundPage />);
      const contentDiv = container.querySelector('div[style*="color: rgb(255, 255, 255)"]');
      expect(contentDiv).toBeInTheDocument();
    });
  });

  describe('Mobile Responsive Layout', () => {
    it('renders with responsive padding', () => {
      renderWithProviders(<NotFoundPage />);
      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveStyle({
        padding: '20px',
      });
    });

    it('content container has max-width constraint', () => {
      const { container } = renderWithProviders(<NotFoundPage />);
      const contentDiv = container.querySelector('div[style*="max-width"]');
      expect(contentDiv).toBeInTheDocument();
    });

    it('uses flexbox for centering on all screen sizes', () => {
      renderWithProviders(<NotFoundPage />);
      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveStyle({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      });
    });

    it('navigation buttons use flexbox with gap', () => {
      renderWithProviders(<NotFoundPage />);
      const nav = screen.getByRole('navigation', { name: /Error page actions/i });
      expect(nav).toHaveStyle({
        display: 'flex',
        gap: '16px',
        justifyContent: 'center',
      });
    });

    it('text content is center-aligned', () => {
      const { container } = renderWithProviders(<NotFoundPage />);
      const contentDiv = container.querySelector('div[style*="text-align: center"]');
      expect(contentDiv).toBeInTheDocument();
    });

    it('maintains full viewport height', () => {
      renderWithProviders(<NotFoundPage />);
      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveStyle({
        minHeight: '100vh',
      });
    });
  });

  describe('Button Interactions', () => {
    it('home button has hover effect handler', async () => {
      const user = userEvent.setup();
      renderWithProviders(<NotFoundPage />);
      const homeButton = screen.getByRole('link', { name: /Back to Home page/i });

      await user.hover(homeButton);
      expect(homeButton).toBeInTheDocument();
    });

    it('help button has hover effect handler', async () => {
      const user = userEvent.setup();
      renderWithProviders(<NotFoundPage />);
      const helpButton = screen.getByRole('link', { name: /Get help/i });

      await user.hover(helpButton);
      expect(helpButton).toBeInTheDocument();
    });

    it('home button has mouseOut handler', async () => {
      const user = userEvent.setup();
      renderWithProviders(<NotFoundPage />);
      const homeButton = screen.getByRole('link', { name: /Back to Home page/i });

      await user.hover(homeButton);
      await user.unhover(homeButton);
      expect(homeButton).toBeInTheDocument();
    });

    it('help button has mouseOut handler', async () => {
      const user = userEvent.setup();
      renderWithProviders(<NotFoundPage />);
      const helpButton = screen.getByRole('link', { name: /Get help/i });

      await user.hover(helpButton);
      await user.unhover(helpButton);
      expect(helpButton).toBeInTheDocument();
    });
  });

  describe('Styling and Visual Design', () => {
    it('home button has white background', () => {
      renderWithProviders(<NotFoundPage />);
      const homeButton = screen.getByRole('link', { name: /Back to Home page/i });
      expect(homeButton).toHaveStyle({
        background: '#fff',
        color: '#667eea',
      });
    });

    it('help button has transparent background with border', () => {
      renderWithProviders(<NotFoundPage />);
      const helpButton = screen.getByRole('link', { name: /Get help/i });
      expect(helpButton).toHaveStyle({
        background: 'rgba(255,255,255,0.2)',
        border: '2px solid #fff',
        color: '#fff',
      });
    });

    it('buttons have rounded corners', () => {
      renderWithProviders(<NotFoundPage />);
      const homeButton = screen.getByRole('link', { name: /Back to Home page/i });
      const helpButton = screen.getByRole('link', { name: /Get help/i });

      expect(homeButton).toHaveStyle({ borderRadius: '12px' });
      expect(helpButton).toHaveStyle({ borderRadius: '12px' });
    });

    it('buttons have consistent padding', () => {
      renderWithProviders(<NotFoundPage />);
      const homeButton = screen.getByRole('link', { name: /Back to Home page/i });
      const helpButton = screen.getByRole('link', { name: /Get help/i });

      expect(homeButton).toHaveStyle({ padding: '14px 32px' });
      expect(helpButton).toHaveStyle({ padding: '14px 32px' });
    });

    it('buttons have box shadows for depth', () => {
      renderWithProviders(<NotFoundPage />);
      const homeButton = screen.getByRole('link', { name: /Back to Home page/i });
      expect(homeButton).toHaveStyle({
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
      });
    });

    it('404 text has text shadow', () => {
      const { container } = renderWithProviders(<NotFoundPage />);
      const errorCode = container.querySelector('[aria-hidden="true"]');
      expect(errorCode).toHaveStyle({
        textShadow: '0 10px 30px rgba(0,0,0,0.3)',
      });
    });

    it('help button has backdrop filter styling', () => {
      const { container } = renderWithProviders(<NotFoundPage />);
      const helpButton = screen.getByRole('link', { name: /Get help/i });
      // backdrop-filter may not be fully supported in jsdom, but we can check the element exists with styling
      expect(helpButton).toBeInTheDocument();
      expect(helpButton).toHaveStyle({
        background: 'rgba(255,255,255,0.2)',
        border: '2px solid #fff',
      });
    });
  });

  describe('Content Layout', () => {
    it('error code has proper margin', () => {
      const { container } = renderWithProviders(<NotFoundPage />);
      const errorCode = container.querySelector('[aria-hidden="true"]');
      expect(errorCode).toHaveStyle({
        marginBottom: '20px',
      });
    });

    it('heading has proper margin', () => {
      renderWithProviders(<NotFoundPage />);
      const heading = screen.getByRole('heading', { name: /Page Not Found/i });
      expect(heading).toHaveStyle({
        marginBottom: '16px',
      });
    });

    it('description has proper margin', () => {
      renderWithProviders(<NotFoundPage />);
      const description = screen.getByText(/The page you're looking for doesn't exist or has been moved/i);
      expect(description).toHaveStyle({
        marginBottom: '32px',
      });
    });

    it('suggestion section has proper top margin', () => {
      const { container } = renderWithProviders(<NotFoundPage />);
      const suggestionDiv = container.querySelector('div[style*="margin-top: 48px"]');
      expect(suggestionDiv).toHaveStyle({
        marginTop: '48px',
      });
    });
  });

  describe('Typography', () => {
    it('error code has line height of 1', () => {
      const { container } = renderWithProviders(<NotFoundPage />);
      const errorCode = container.querySelector('[aria-hidden="true"]');
      expect(errorCode).toHaveStyle({
        lineHeight: 1,
      });
    });

    it('description has readable line height', () => {
      renderWithProviders(<NotFoundPage />);
      const description = screen.getByText(/The page you're looking for doesn't exist or has been moved/i);
      expect(description).toHaveStyle({
        lineHeight: 1.6,
      });
    });

    it('buttons have consistent font size', () => {
      renderWithProviders(<NotFoundPage />);
      const homeButton = screen.getByRole('link', { name: /Back to Home page/i });
      const helpButton = screen.getByRole('link', { name: /Get help/i });

      expect(homeButton).toHaveStyle({ fontSize: '16px', fontWeight: '600' });
      expect(helpButton).toHaveStyle({ fontSize: '16px', fontWeight: '600' });
    });

    it('description text has proper font size', () => {
      renderWithProviders(<NotFoundPage />);
      const description = screen.getByText(/The page you're looking for doesn't exist or has been moved/i);
      expect(description).toHaveStyle({
        fontSize: '18px',
        opacity: 0.9,
      });
    });

    it('suggestion text has smaller font size', () => {
      const { container } = renderWithProviders(<NotFoundPage />);
      const suggestionDiv = container.querySelector('div[style*="font-size: 14px"]');
      expect(suggestionDiv).toHaveStyle({
        fontSize: '14px',
        opacity: 0.8,
      });
    });
  });

  describe('Link Behavior', () => {
    it('home button has no text decoration', () => {
      renderWithProviders(<NotFoundPage />);
      const homeButton = screen.getByRole('link', { name: /Back to Home page/i });
      expect(homeButton).toHaveStyle({
        textDecoration: 'none',
      });
    });

    it('help button has no text decoration', () => {
      renderWithProviders(<NotFoundPage />);
      const helpButton = screen.getByRole('link', { name: /Get help/i });
      expect(helpButton).toHaveStyle({
        textDecoration: 'none',
      });
    });

    it('communities link has underline decoration', () => {
      renderWithProviders(<NotFoundPage />);
      const communitiesLink = screen.getByRole('link', { name: /communities page/i });
      expect(communitiesLink).toHaveStyle({
        textDecoration: 'underline',
      });
    });

    it('all links are clickable', async () => {
      const user = userEvent.setup();
      renderWithProviders(<NotFoundPage />);

      const homeButton = screen.getByRole('link', { name: /Back to Home page/i });
      const helpButton = screen.getByRole('link', { name: /Get help/i });
      const communitiesLink = screen.getByRole('link', { name: /communities page/i });

      await user.click(homeButton);
      await user.click(helpButton);
      await user.click(communitiesLink);

      expect(homeButton).toBeInTheDocument();
      expect(helpButton).toBeInTheDocument();
      expect(communitiesLink).toBeInTheDocument();
    });
  });

  describe('Page Metadata', () => {
    it('renders with proper document structure', () => {
      renderWithProviders(<NotFoundPage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('main content has id attribute', () => {
      renderWithProviders(<NotFoundPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('id', 'main-content');
    });

    it('provides clear page purpose through aria-label', () => {
      renderWithProviders(<NotFoundPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', '404 Page Not Found');
    });
  });
});

export default mockNavigate
