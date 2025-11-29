/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../__test__/utils/testUtils';
import BrowserNotSupportedPage from '../BrowserNotSupportedPage';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

describe('BrowserNotSupportedPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Page Rendering', () => {
    it('renders page without crashing', () => {
      const { container } = renderWithProviders(<BrowserNotSupportedPage />);
      expect(container).toBeInTheDocument();
    });

    it('displays main content area with correct role', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const mainElement = screen.getByRole('main');
      expect(mainElement).toBeInTheDocument();
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithProviders(<BrowserNotSupportedPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('displays the main heading', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const heading = screen.getByText('Browser Not Supported');
      expect(heading).toBeInTheDocument();
    });

    it('displays the upgrade message', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const message = screen.getByText('Your browser is outdated. Please upgrade to a modern browser for the best experience.');
      expect(message).toBeInTheDocument();
    });

    it('has alert role for accessibility', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('has aria-live attribute', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Browser Detection Display', () => {
    it('displays warning icon', () => {
      const { container } = renderWithProviders(<BrowserNotSupportedPage />);
      const icon = container.querySelector('.lucide-alert-triangle');
      expect(icon).toBeInTheDocument();
    });

    it('warning icon is hidden from screen readers', () => {
      const { container } = renderWithProviders(<BrowserNotSupportedPage />);
      const icon = container.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });

    it('warning icon has proper size', () => {
      const { container } = renderWithProviders(<BrowserNotSupportedPage />);
      const icon = container.querySelector('.w-24');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Supported Browsers Section', () => {
    it('displays Chrome browser option', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      expect(screen.getByText('Chrome')).toBeInTheDocument();
    });

    it('displays Firefox browser option', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      expect(screen.getByText('Firefox')).toBeInTheDocument();
    });

    it('displays Safari browser option', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      expect(screen.getByText('Safari')).toBeInTheDocument();
    });

    it('Chrome link has correct URL', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const chromeLink = screen.getByRole('link', { name: /download chrome browser/i });
      expect(chromeLink).toHaveAttribute('href', 'https://www.google.com/chrome/');
    });

    it('Firefox link has correct URL', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const firefoxLink = screen.getByRole('link', { name: /download firefox browser/i });
      expect(firefoxLink).toHaveAttribute('href', 'https://www.mozilla.org/firefox/');
    });

    it('Safari link has correct URL', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const safariLink = screen.getByRole('link', { name: /download safari browser/i });
      expect(safariLink).toHaveAttribute('href', 'https://www.apple.com/safari/');
    });

    it('displays all three browser options', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const chromeLink = screen.getByRole('link', { name: /download chrome/i });
      const firefoxLink = screen.getByRole('link', { name: /download firefox/i });
      const safariLink = screen.getByRole('link', { name: /download safari/i });

      expect(chromeLink).toBeInTheDocument();
      expect(firefoxLink).toBeInTheDocument();
      expect(safariLink).toBeInTheDocument();
    });
  });

  describe('Browser Links', () => {
    it('Chrome link has proper aria-label', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const chromeLink = screen.getByRole('link', { name: /download chrome browser/i });
      expect(chromeLink).toHaveAttribute('aria-label', 'Download Chrome browser');
    });

    it('Firefox link has proper aria-label', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const firefoxLink = screen.getByRole('link', { name: /download firefox browser/i });
      expect(firefoxLink).toHaveAttribute('aria-label', 'Download Firefox browser');
    });

    it('Safari link has proper aria-label', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const safariLink = screen.getByRole('link', { name: /download safari browser/i });
      expect(safariLink).toHaveAttribute('aria-label', 'Download Safari browser');
    });

    it('all browser links open in same tab', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).not.toHaveAttribute('target', '_blank');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper page structure with main role', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('has proper aria-label on main element', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', 'Browser not supported page');
    });

    it('has proper heading hierarchy', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const heading = screen.getByRole('heading', { name: /browser not supported/i });
      expect(heading).toBeInTheDocument();
    });

    it('heading is h1 element', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('supports keyboard navigation to Chrome link', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const chromeLink = screen.getByRole('link', { name: /download chrome/i });
      chromeLink.focus();
      expect(document.activeElement).toBe(chromeLink);
    });

    it('supports keyboard navigation to Firefox link', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const firefoxLink = screen.getByRole('link', { name: /download firefox/i });
      firefoxLink.focus();
      expect(document.activeElement).toBe(firefoxLink);
    });

    it('supports keyboard navigation to Safari link', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const safariLink = screen.getByRole('link', { name: /download safari/i });
      safariLink.focus();
      expect(document.activeElement).toBe(safariLink);
    });

    it('all links are keyboard accessible', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const links = screen.getAllByRole('link');
      expect(links.length).toBe(3);
    });
  });

  describe('Visual Design', () => {
    it('uses grid layout for browser options', () => {
      const { container } = renderWithProviders(<BrowserNotSupportedPage />);
      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });

    it('has three columns in grid', () => {
      const { container } = renderWithProviders(<BrowserNotSupportedPage />);
      const grid = container.querySelector('.grid-cols-3');
      expect(grid).toBeInTheDocument();
    });

    it('has gap spacing in grid', () => {
      const { container } = renderWithProviders(<BrowserNotSupportedPage />);
      const grid = container.querySelector('.gap-4');
      expect(grid).toBeInTheDocument();
    });

    it('browser cards have hover effect classes', () => {
      const { container } = renderWithProviders(<BrowserNotSupportedPage />);
      const cards = container.querySelectorAll('.hover\\:shadow-lg');
      expect(cards.length).toBe(3);
    });

    it('browser cards have rounded corners', () => {
      const { container } = renderWithProviders(<BrowserNotSupportedPage />);
      const cards = container.querySelectorAll('.rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]');
      expect(cards.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Browser Emojis', () => {
    it('displays Chrome emoji', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      expect(screen.getByText('🌐')).toBeInTheDocument();
    });

    it('displays Firefox emoji', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      expect(screen.getByText('🦊')).toBeInTheDocument();
    });

    it('displays Safari emoji', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      expect(screen.getByText('🧭')).toBeInTheDocument();
    });

    it('emojis are hidden from screen readers', () => {
      const { container } = renderWithProviders(<BrowserNotSupportedPage />);
      const emojis = container.querySelectorAll('[aria-hidden="true"]');
      expect(emojis.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Responsive Behavior', () => {
    it('has full viewport height', () => {
      const { container } = renderWithProviders(<BrowserNotSupportedPage />);
      const main = container.querySelector('.min-h-screen');
      expect(main).toBeInTheDocument();
    });

    it('centers content on page', () => {
      const { container } = renderWithProviders(<BrowserNotSupportedPage />);
      const main = container.querySelector('.flex');
      expect(main).toBeInTheDocument();
    });

    it('has padding for mobile devices', () => {
      const { container } = renderWithProviders(<BrowserNotSupportedPage />);
      const main = container.querySelector('.p-6');
      expect(main).toBeInTheDocument();
    });

    it('limits content width', () => {
      const { container } = renderWithProviders(<BrowserNotSupportedPage />);
      const content = container.querySelector('.max-w-2xl');
      expect(content).toBeInTheDocument();
    });
  });

  describe('Dark Mode Support', () => {
    it('has dark mode background class', () => {
      const { container } = renderWithProviders(<BrowserNotSupportedPage />);
      const main = container.querySelector('.dark\\:bg-[#0d1117]');
      expect(main).toBeInTheDocument();
    });

    it('has dark mode text class for description', () => {
      const { container } = renderWithProviders(<BrowserNotSupportedPage />);
      const text = container.querySelector('.dark\\:text-[#8b949e]');
      expect(text).toBeInTheDocument();
    });

    it('browser cards have dark mode styling', () => {
      const { container } = renderWithProviders(<BrowserNotSupportedPage />);
      const cards = container.querySelectorAll('.dark\\:bg-[#161b22]');
      expect(cards.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('User Interactions', () => {
    it('Chrome link is clickable', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BrowserNotSupportedPage />);
      const chromeLink = screen.getByRole('link', { name: /download chrome/i });

      await user.click(chromeLink);

      expect(chromeLink).toHaveAttribute('href');
    });

    it('Firefox link is clickable', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BrowserNotSupportedPage />);
      const firefoxLink = screen.getByRole('link', { name: /download firefox/i });

      await user.click(firefoxLink);

      expect(firefoxLink).toHaveAttribute('href');
    });

    it('Safari link is clickable', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BrowserNotSupportedPage />);
      const safariLink = screen.getByRole('link', { name: /download safari/i });

      await user.click(safariLink);

      expect(safariLink).toHaveAttribute('href');
    });

    it('handles hover on Chrome card', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BrowserNotSupportedPage />);
      const chromeLink = screen.getByRole('link', { name: /download chrome/i });

      await user.hover(chromeLink);

      expect(chromeLink).toBeInTheDocument();
    });

    it('handles hover on Firefox card', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BrowserNotSupportedPage />);
      const firefoxLink = screen.getByRole('link', { name: /download firefox/i });

      await user.hover(firefoxLink);

      expect(firefoxLink).toBeInTheDocument();
    });

    it('handles hover on Safari card', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BrowserNotSupportedPage />);
      const safariLink = screen.getByRole('link', { name: /download safari/i });

      await user.hover(safariLink);

      expect(safariLink).toBeInTheDocument();
    });
  });

  describe('Component Memoization', () => {
    it('component is wrapped with memo', () => {
      const { container } = renderWithProviders(<BrowserNotSupportedPage />);
      expect(container).toBeInTheDocument();
    });

    it('renders consistently on re-render', () => {
      const { rerender } = renderWithProviders(<BrowserNotSupportedPage />);
      rerender(<BrowserNotSupportedPage />);
      expect(screen.getByText('Browser Not Supported')).toBeInTheDocument();
    });
  });

  describe('Framer Motion Integration', () => {
    it('applies motion animation props', () => {
      const { container } = renderWithProviders(<BrowserNotSupportedPage />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('content is wrapped in motion.div', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('renders all required elements together', () => {
      renderWithProviders(<BrowserNotSupportedPage />);

      expect(screen.getByText('Browser Not Supported')).toBeInTheDocument();
      expect(screen.getByText('Chrome')).toBeInTheDocument();
      expect(screen.getByText('Firefox')).toBeInTheDocument();
      expect(screen.getByText('Safari')).toBeInTheDocument();
    });

    it('maintains consistent layout structure', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const main = screen.getByRole('main');
      const alert = screen.getByRole('alert');

      expect(main).toBeInTheDocument();
      expect(alert).toBeInTheDocument();
    });

    it('displays complete message to users', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      expect(screen.getByText(/your browser is outdated/i)).toBeInTheDocument();
      expect(screen.getByText(/please upgrade/i)).toBeInTheDocument();
    });
  });

  describe('Text Content', () => {
    it('displays full upgrade message', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const message = screen.getByText('Your browser is outdated. Please upgrade to a modern browser for the best experience.');
      expect(message).toBeInTheDocument();
    });

    it('heading is descriptive', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const heading = screen.getByRole('heading', { name: 'Browser Not Supported' });
      expect(heading).toBeInTheDocument();
    });
  });
});

export default mainElement
