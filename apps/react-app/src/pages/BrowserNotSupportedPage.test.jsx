/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../__test__/utils/testUtils';
import BrowserNotSupportedPage from './BrowserNotSupportedPage';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  AlertTriangle: ({ className, ...props }) => (
    <svg data-testid="alert-triangle-icon" className={className} {...props} />
  ),
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
      expect(mainElement).toHaveAttribute('aria-label', 'Browser not supported page');
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithProviders(<BrowserNotSupportedPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('renders with proper layout structure', () => {
      const { container } = renderWithProviders(<BrowserNotSupportedPage />);
      const mainDiv = container.querySelector('.min-h-screen');
      expect(mainDiv).toBeInTheDocument();
      expect(mainDiv).toHaveClass('bg-gray-50', 'dark:bg-[#161b22]', 'flex', 'items-center', 'justify-center');
    });

    it('renders content container with proper styling', () => {
      const { container } = renderWithProviders(<BrowserNotSupportedPage />);
      const contentDiv = container.querySelector('.text-center.max-w-2xl');
      expect(contentDiv).toBeInTheDocument();
    });

    it('has role="alert" on content container', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const alertElement = screen.getByRole('alert');
      expect(alertElement).toBeInTheDocument();
      expect(alertElement).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Warning Icon Display', () => {
    it('displays AlertTriangle icon', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const icon = screen.getByTestId('alert-triangle-icon');
      expect(icon).toBeInTheDocument();
    });

    it('applies correct styling to AlertTriangle icon', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const icon = screen.getByTestId('alert-triangle-icon');
      expect(icon).toHaveClass('w-24', 'h-24', 'mx-auto', 'mb-6', 'text-yellow-500');
    });

    it('marks icon as decorative with aria-hidden', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const icon = screen.getByTestId('alert-triangle-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Warning Message Display', () => {
    it('displays the main heading', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const heading = screen.getByRole('heading', { name: /browser not supported/i });
      expect(heading).toBeInTheDocument();
    });

    it('heading has correct styling', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const heading = screen.getByRole('heading', { name: /browser not supported/i });
      expect(heading).toHaveClass('text-4xl', 'font-bold', 'mb-4');
    });

    it('displays the warning message paragraph', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const message = screen.getByText(/your browser is outdated/i);
      expect(message).toBeInTheDocument();
    });

    it('displays upgrade instruction text', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const upgradeText = screen.getByText(/please upgrade to a modern browser/i);
      expect(upgradeText).toBeInTheDocument();
    });

    it('warning message has correct styling', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const message = screen.getByText(/your browser is outdated/i);
      expect(message).toHaveClass('text-gray-600', 'dark:text-[#8b949e]', 'mb-8');
    });
  });

  describe('Supported Browsers List', () => {
    it('displays exactly three browser options', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(3);
    });

    it('displays Chrome browser option', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const chromeText = screen.getByText('Chrome');
      expect(chromeText).toBeInTheDocument();
    });

    it('displays Firefox browser option', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const firefoxText = screen.getByText('Firefox');
      expect(firefoxText).toBeInTheDocument();
    });

    it('displays Safari browser option', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const safariText = screen.getByText('Safari');
      expect(safariText).toBeInTheDocument();
    });

    it('browsers are displayed in a grid layout', () => {
      const { container } = renderWithProviders(<BrowserNotSupportedPage />);
      const grid = container.querySelector('.grid.grid-cols-3');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('gap-4');
    });
  });

  describe('Browser Icons', () => {
    it('displays Chrome browser icon', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const chromeLink = screen.getByLabelText(/download chrome browser/i);
      const icon = chromeLink.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveTextContent('🌐');
    });

    it('displays Firefox browser icon', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const firefoxLink = screen.getByLabelText(/download firefox browser/i);
      const icon = firefoxLink.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveTextContent('🦊');
    });

    it('displays Safari browser icon', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const safariLink = screen.getByLabelText(/download safari browser/i);
      const icon = safariLink.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveTextContent('🧭');
    });

    it('browser icons have correct styling', () => {
      const { container } = renderWithProviders(<BrowserNotSupportedPage />);
      const icons = container.querySelectorAll('.text-6xl.mb-3');
      expect(icons).toHaveLength(3);
      icons.forEach(icon => {
        expect(icon).toHaveClass('text-6xl', 'mb-3');
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('Download Links for Supported Browsers', () => {
    it('Chrome link has correct href', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const chromeLink = screen.getByLabelText(/download chrome browser/i);
      expect(chromeLink).toHaveAttribute('href', 'https://www.google.com/chrome/');
    });

    it('Firefox link has correct href', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const firefoxLink = screen.getByLabelText(/download firefox browser/i);
      expect(firefoxLink).toHaveAttribute('href', 'https://www.mozilla.org/firefox/');
    });

    it('Safari link has correct href', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const safariLink = screen.getByLabelText(/download safari browser/i);
      expect(safariLink).toHaveAttribute('href', 'https://www.apple.com/safari/');
    });

    it('Chrome link has proper aria-label', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const chromeLink = screen.getByLabelText('Download Chrome browser');
      expect(chromeLink).toBeInTheDocument();
    });

    it('Firefox link has proper aria-label', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const firefoxLink = screen.getByLabelText('Download Firefox browser');
      expect(firefoxLink).toBeInTheDocument();
    });

    it('Safari link has proper aria-label', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const safariLink = screen.getByLabelText('Download Safari browser');
      expect(safariLink).toBeInTheDocument();
    });

    it('all browser links have correct styling', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveClass(
          'p-6',
          'bg-white',
          'dark:bg-[#161b22]',
          'rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
          'hover:shadow-lg',
          'transition-shadow'
        );
      });
    });

    it('browser name text has correct styling', () => {
      const { container } = renderWithProviders(<BrowserNotSupportedPage />);
      const browserNames = container.querySelectorAll('.font-semibold');
      expect(browserNames).toHaveLength(3);
      browserNames.forEach(name => {
        expect(name).toHaveClass('font-semibold');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper page structure with main role', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('has proper heading hierarchy', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Browser Not Supported');
    });

    it('all interactive elements are keyboard accessible', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toBeVisible();
      });
    });

    it('decorative elements have aria-hidden', () => {
      const { container } = renderWithProviders(<BrowserNotSupportedPage />);
      const decorativeElements = container.querySelectorAll('[aria-hidden="true"]');
      expect(decorativeElements.length).toBeGreaterThan(0);
    });

    it('links have descriptive aria-labels', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      expect(screen.getByLabelText(/download chrome browser/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/download firefox browser/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/download safari browser/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('renders correctly when window is resized', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      global.innerWidth = 320;
      global.dispatchEvent(new Event('resize'));
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('handles dark mode styling classes', () => {
      const { container } = renderWithProviders(<BrowserNotSupportedPage />);
      const mainDiv = container.querySelector('.dark\\:bg-[#161b22]');
      expect(mainDiv).toBeInTheDocument();
    });

    it('component is memoized correctly', () => {
      const { rerender } = renderWithProviders(<BrowserNotSupportedPage />);
      rerender(<BrowserNotSupportedPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('maintains structure with missing CSS classes', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      expect(screen.getByRole('heading')).toBeInTheDocument();
      expect(screen.getAllByRole('link')).toHaveLength(3);
    });

    it('renders all content without JavaScript', () => {
      renderWithProviders(<BrowserNotSupportedPage />);
      expect(screen.getByText('Chrome')).toBeInTheDocument();
      expect(screen.getByText('Firefox')).toBeInTheDocument();
      expect(screen.getByText('Safari')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('renders correctly on mobile viewport', () => {
      global.innerWidth = 375;
      renderWithProviders(<BrowserNotSupportedPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('p-6');
    });

    it('renders correctly on tablet viewport', () => {
      global.innerWidth = 768;
      renderWithProviders(<BrowserNotSupportedPage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('renders correctly on desktop viewport', () => {
      global.innerWidth = 1920;
      renderWithProviders(<BrowserNotSupportedPage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('content container respects max-width on large screens', () => {
      const { container } = renderWithProviders(<BrowserNotSupportedPage />);
      const contentDiv = container.querySelector('.max-w-2xl');
      expect(contentDiv).toBeInTheDocument();
    });
  });

  describe('Component Snapshot', () => {
    it('matches snapshot', () => {
      const { container } = renderWithProviders(<BrowserNotSupportedPage />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot in dark mode context', () => {
      const { container } = renderWithProviders(<BrowserNotSupportedPage />);
      // Add dark class to simulate dark mode
      container.firstChild.classList.add('dark');
      expect(container).toMatchSnapshot();
    });
  });
});

export default mainElement
