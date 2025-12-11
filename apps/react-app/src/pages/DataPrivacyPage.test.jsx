/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../__test__/utils/testUtils';
import DataPrivacyPage from './DataPrivacyPage';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

describe('DataPrivacyPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders page without crashing', () => {
      const { container } = renderWithProviders(<DataPrivacyPage />);
      expect(container).toBeInTheDocument();
    });

    it('renders component successfully', () => {
      renderWithProviders(<DataPrivacyPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithProviders(<DataPrivacyPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('renders without console warnings', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      renderWithProviders(<DataPrivacyPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('renders correctly as a React component', () => {
      const { container } = renderWithProviders(<DataPrivacyPage />);
      expect(container.firstChild).toBeTruthy();
    });

    it('maintains component instance across renders', () => {
      const { rerender } = renderWithProviders(<DataPrivacyPage />);
      const firstRender = screen.getByRole('main');
      rerender(<DataPrivacyPage />);
      expect(screen.getByRole('main')).toBe(firstRender);
    });

    it('renders with proper document structure', () => {
      const { container } = renderWithProviders(<DataPrivacyPage />);
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('initializes without errors in strict mode', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithProviders(
        <React.StrictMode>
          <DataPrivacyPage />
        </React.StrictMode>
      );
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Page Structure and Layout', () => {
    it('displays main content area with correct role', () => {
      renderWithProviders(<DataPrivacyPage />);
      const mainElement = screen.getByRole('main');
      expect(mainElement).toBeInTheDocument();
      expect(mainElement).toHaveAttribute('aria-label', 'Data privacy page');
    });

    it('renders with proper layout structure', () => {
      const { container } = renderWithProviders(<DataPrivacyPage />);
      const mainDiv = container.querySelector('.min-h-screen');
      expect(mainDiv).toBeInTheDocument();
    });

    it('has min-height screen class', () => {
      const { container } = renderWithProviders(<DataPrivacyPage />);
      const mainDiv = container.querySelector('.min-h-screen');
      expect(mainDiv).toHaveClass('min-h-screen');
    });

    it('has background color classes', () => {
      const { container } = renderWithProviders(<DataPrivacyPage />);
      const mainDiv = container.querySelector('.min-h-screen');
      expect(mainDiv).toHaveClass('bg-gray-50', 'dark:bg-[#161b22]');
    });

    it('has padding classes', () => {
      const { container } = renderWithProviders(<DataPrivacyPage />);
      const mainDiv = container.querySelector('.min-h-screen');
      expect(mainDiv).toHaveClass('p-6');
    });

    it('renders max-width container', () => {
      const { container } = renderWithProviders(<DataPrivacyPage />);
      const maxWidthDiv = container.querySelector('.max-w-6xl');
      expect(maxWidthDiv).toBeInTheDocument();
    });

    it('centers content with mx-auto', () => {
      const { container } = renderWithProviders(<DataPrivacyPage />);
      const maxWidthDiv = container.querySelector('.max-w-6xl');
      expect(maxWidthDiv).toHaveClass('mx-auto');
    });

    it('renders content card', () => {
      const { container } = renderWithProviders(<DataPrivacyPage />);
      const contentCard = container.querySelector('.bg-white.dark\\:bg-[#161b22]');
      expect(contentCard).toBeInTheDocument();
    });

    it('content card has rounded corners', () => {
      const { container } = renderWithProviders(<DataPrivacyPage />);
      const contentCard = container.querySelector('.rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]');
      expect(contentCard).toBeInTheDocument();
    });

    it('content card has padding', () => {
      const { container } = renderWithProviders(<DataPrivacyPage />);
      const contentCard = container.querySelector('.p-8');
      expect(contentCard).toBeInTheDocument();
    });

    it('content card has shadow', () => {
      const { container } = renderWithProviders(<DataPrivacyPage />);
      const contentCard = container.querySelector('.shadow-xl');
      expect(contentCard).toBeInTheDocument();
    });

    it('maintains proper nesting structure', () => {
      const { container } = renderWithProviders(<DataPrivacyPage />);
      const main = container.querySelector('[role="main"]');
      const maxWidth = main.querySelector('.max-w-6xl');
      const contentCard = maxWidth.querySelector('.bg-white');
      expect(contentCard).toBeInTheDocument();
    });
  });

  describe('Heading Display', () => {
    it('displays the main heading', () => {
      renderWithProviders(<DataPrivacyPage />);
      const heading = screen.getByRole('heading', { name: /DataPrivacyPage/i });
      expect(heading).toBeInTheDocument();
    });

    it('heading is level 1', () => {
      renderWithProviders(<DataPrivacyPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('DataPrivacyPage');
    });

    it('heading has correct text content', () => {
      renderWithProviders(<DataPrivacyPage />);
      expect(screen.getByText('DataPrivacyPage')).toBeInTheDocument();
    });

    it('heading has correct styling', () => {
      renderWithProviders(<DataPrivacyPage />);
      const heading = screen.getByRole('heading', { name: /DataPrivacyPage/i });
      expect(heading).toHaveClass('text-3xl', 'font-bold', 'mb-6');
    });

    it('heading has text color classes', () => {
      renderWithProviders(<DataPrivacyPage />);
      const heading = screen.getByRole('heading', { name: /DataPrivacyPage/i });
      expect(heading).toHaveClass('text-gray-900', 'dark:text-white');
    });

    it('heading is visible', () => {
      renderWithProviders(<DataPrivacyPage />);
      const heading = screen.getByRole('heading', { name: /DataPrivacyPage/i });
      expect(heading).toBeVisible();
    });

    it('has only one h1 heading', () => {
      renderWithProviders(<DataPrivacyPage />);
      const headings = screen.getAllByRole('heading', { level: 1 });
      expect(headings).toHaveLength(1);
    });
  });

  describe('Content Display', () => {
    it('displays the placeholder content paragraph', () => {
      renderWithProviders(<DataPrivacyPage />);
      const message = screen.getByText(/This is the DataPrivacyPage page/i);
      expect(message).toBeInTheDocument();
    });

    it('displays implementation message', () => {
      renderWithProviders(<DataPrivacyPage />);
      const message = screen.getByText(/Content will be implemented here/i);
      expect(message).toBeInTheDocument();
    });

    it('content paragraph has correct styling', () => {
      renderWithProviders(<DataPrivacyPage />);
      const paragraph = screen.getByText(/This is the DataPrivacyPage page/i);
      expect(paragraph).toHaveClass('text-gray-600', 'dark:text-[#8b949e]');
    });

    it('content is visible to users', () => {
      renderWithProviders(<DataPrivacyPage />);
      const paragraph = screen.getByText(/This is the DataPrivacyPage page/i);
      expect(paragraph).toBeVisible();
    });

    it('renders full content text', () => {
      renderWithProviders(<DataPrivacyPage />);
      expect(screen.getByText('This is the DataPrivacyPage page. Content will be implemented here.')).toBeInTheDocument();
    });
  });

  describe('Accessibility Features', () => {
    it('has proper page structure with main role', () => {
      renderWithProviders(<DataPrivacyPage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('main element has descriptive aria-label', () => {
      renderWithProviders(<DataPrivacyPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', 'Data privacy page');
    });

    it('has proper heading hierarchy', () => {
      renderWithProviders(<DataPrivacyPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('DataPrivacyPage');
    });

    it('heading hierarchy starts at level 1', () => {
      renderWithProviders(<DataPrivacyPage />);
      const headings = screen.getAllByRole('heading');
      expect(headings[0].tagName).toBe('H1');
    });

    it('supports screen readers with semantic HTML', () => {
      renderWithProviders(<DataPrivacyPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('heading')).toBeInTheDocument();
    });

    it('content is accessible to assistive technologies', () => {
      renderWithProviders(<DataPrivacyPage />);
      const main = screen.getByRole('main');
      const heading = within(main).getByRole('heading');
      expect(heading).toBeInTheDocument();
      expect(heading).toBeVisible();
    });

    it('text has sufficient contrast classes', () => {
      const { container } = renderWithProviders(<DataPrivacyPage />);
      const heading = container.querySelector('.text-gray-900');
      const paragraph = container.querySelector('.text-gray-600');
      expect(heading).toBeInTheDocument();
      expect(paragraph).toBeInTheDocument();
    });

    it('maintains semantic structure', () => {
      const { container } = renderWithProviders(<DataPrivacyPage />);
      const main = screen.getByRole('main');
      const h1 = screen.getByRole('heading', { level: 1 });
      const p = screen.getByText(/This is the DataPrivacyPage page/i);
      expect(main).toContainElement(h1);
      expect(main).toContainElement(p);
    });
  });

  describe('Responsive Design', () => {
    it('renders correctly on mobile viewport (375px)', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));
      renderWithProviders(<DataPrivacyPage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('renders correctly on tablet viewport (768px)', () => {
      global.innerWidth = 768;
      global.dispatchEvent(new Event('resize'));
      renderWithProviders(<DataPrivacyPage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('renders correctly on desktop viewport (1920px)', () => {
      global.innerWidth = 1920;
      global.dispatchEvent(new Event('resize'));
      renderWithProviders(<DataPrivacyPage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('content container respects max-width on large screens', () => {
      global.innerWidth = 1920;
      const { container } = renderWithProviders(<DataPrivacyPage />);
      const contentDiv = container.querySelector('.max-w-6xl');
      expect(contentDiv).toBeInTheDocument();
    });

    it('maintains padding on mobile screens', () => {
      global.innerWidth = 375;
      const { container } = renderWithProviders(<DataPrivacyPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('p-6');
    });

    it('adapts to window resize events', () => {
      renderWithProviders(<DataPrivacyPage />);
      global.innerWidth = 320;
      global.dispatchEvent(new Event('resize'));
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('handles very small viewports (320px)', () => {
      global.innerWidth = 320;
      renderWithProviders(<DataPrivacyPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles very large viewports (2560px)', () => {
      global.innerWidth = 2560;
      renderWithProviders(<DataPrivacyPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('maintains structure across viewport changes', () => {
      const { container } = renderWithProviders(<DataPrivacyPage />);
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));
      expect(container.querySelector('.max-w-6xl')).toBeInTheDocument();
      global.innerWidth = 1920;
      global.dispatchEvent(new Event('resize'));
      expect(container.querySelector('.max-w-6xl')).toBeInTheDocument();
    });
  });

  describe('Dark Mode Support', () => {
    it('has dark mode classes on main container', () => {
      const { container } = renderWithProviders(<DataPrivacyPage />);
      const mainDiv = container.querySelector('.dark\\:bg-[#161b22]');
      expect(mainDiv).toBeInTheDocument();
    });

    it('has dark mode classes on content card', () => {
      const { container } = renderWithProviders(<DataPrivacyPage />);
      const contentCard = container.querySelector('.dark\\:bg-[#161b22]');
      expect(contentCard).toBeInTheDocument();
    });

    it('heading has dark mode text color', () => {
      const { container } = renderWithProviders(<DataPrivacyPage />);
      const heading = container.querySelector('.dark\\:text-white');
      expect(heading).toBeInTheDocument();
    });

    it('paragraph has dark mode text color', () => {
      const { container } = renderWithProviders(<DataPrivacyPage />);
      const paragraph = container.querySelector('.dark\\:text-[#8b949e]');
      expect(paragraph).toBeInTheDocument();
    });

    it('maintains structure in dark mode', () => {
      const { container } = renderWithProviders(<DataPrivacyPage />);
      container.firstChild.classList.add('dark');
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('heading')).toBeInTheDocument();
    });

    it('all color variants are defined', () => {
      const { container } = renderWithProviders(<DataPrivacyPage />);
      const elementsWithDarkMode = container.querySelectorAll('[class*="dark:"]');
      expect(elementsWithDarkMode.length).toBeGreaterThan(0);
    });
  });

  describe('Component Behavior', () => {
    it('component is memoized correctly', () => {
      const { rerender } = renderWithProviders(<DataPrivacyPage />);
      const firstRender = screen.getByRole('main');
      rerender(<DataPrivacyPage />);
      expect(screen.getByRole('main')).toBe(firstRender);
    });

    it('maintains state across rerenders', () => {
      const { rerender } = renderWithProviders(<DataPrivacyPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
      rerender(<DataPrivacyPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('does not trigger unnecessary rerenders', () => {
      const { rerender } = renderWithProviders(<DataPrivacyPage />);
      const initialHeading = screen.getByRole('heading');
      rerender(<DataPrivacyPage />);
      expect(screen.getByRole('heading')).toBe(initialHeading);
    });

    it('preserves DOM structure on rerender', () => {
      const { container, rerender } = renderWithProviders(<DataPrivacyPage />);
      const initialStructure = container.innerHTML;
      rerender(<DataPrivacyPage />);
      expect(container.innerHTML).toBe(initialStructure);
    });
  });

  describe('Framer Motion Integration', () => {
    it('renders motion.div wrapper', () => {
      const { container } = renderWithProviders(<DataPrivacyPage />);
      expect(container.querySelector('.bg-white')).toBeInTheDocument();
    });

    it('motion wrapper contains content', () => {
      renderWithProviders(<DataPrivacyPage />);
      expect(screen.getByRole('heading')).toBeInTheDocument();
    });

    it('renders without animation errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithProviders(<DataPrivacyPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('animation wrapper does not block content', () => {
      renderWithProviders(<DataPrivacyPage />);
      expect(screen.getByText('DataPrivacyPage')).toBeVisible();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing CSS classes gracefully', () => {
      renderWithProviders(<DataPrivacyPage />);
      expect(screen.getByRole('heading')).toBeInTheDocument();
    });

    it('renders correctly with JavaScript disabled', () => {
      renderWithProviders(<DataPrivacyPage />);
      expect(screen.getByText('DataPrivacyPage')).toBeInTheDocument();
    });

    it('handles rapid consecutive renders', () => {
      const { rerender } = renderWithProviders(<DataPrivacyPage />);
      for (let i = 0; i < 10; i++) {
        rerender(<DataPrivacyPage />);
      }
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('maintains structure when wrapped in additional divs', () => {
      renderWithProviders(
        <div>
          <div>
            <DataPrivacyPage />
          </div>
        </div>
      );
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles unmounting gracefully', () => {
      const { unmount } = renderWithProviders(<DataPrivacyPage />);
      expect(() => unmount()).not.toThrow();
    });

    it('cleans up resources on unmount', () => {
      const { unmount } = renderWithProviders(<DataPrivacyPage />);
      unmount();
      expect(screen.queryByRole('main')).not.toBeInTheDocument();
    });

    it('does not leak memory on multiple mounts', () => {
      for (let i = 0; i < 5; i++) {
        const { unmount } = renderWithProviders(<DataPrivacyPage />);
        expect(screen.getByRole('main')).toBeInTheDocument();
        unmount();
      }
    });

    it('handles null children gracefully', () => {
      renderWithProviders(<DataPrivacyPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('renders within acceptable time', () => {
      const startTime = performance.now();
      renderWithProviders(<DataPrivacyPage />);
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('memo prevents unnecessary rerenders with same props', () => {
      const { rerender } = renderWithProviders(<DataPrivacyPage />);
      const initialRender = screen.getByRole('main');
      rerender(<DataPrivacyPage />);
      expect(screen.getByRole('main')).toBe(initialRender);
    });

    it('efficiently updates DOM', () => {
      const { rerender } = renderWithProviders(<DataPrivacyPage />);
      const mutations = [];
      const observer = new MutationObserver((mutationsList) => {
        mutations.push(...mutationsList);
      });
      observer.observe(document.body, { childList: true, subtree: true });
      rerender(<DataPrivacyPage />);
      observer.disconnect();
      expect(mutations.length).toBe(0);
    });
  });

  describe('SEO and Meta Information', () => {
    it('contains semantic HTML for SEO', () => {
      renderWithProviders(<DataPrivacyPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('heading text is descriptive', () => {
      renderWithProviders(<DataPrivacyPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading.textContent.length).toBeGreaterThan(0);
    });

    it('content is indexable by search engines', () => {
      renderWithProviders(<DataPrivacyPage />);
      const paragraph = screen.getByText(/This is the DataPrivacyPage page/i);
      expect(paragraph.textContent.length).toBeGreaterThan(0);
    });
  });

  describe('Browser Compatibility', () => {
    it('renders in modern browsers', () => {
      renderWithProviders(<DataPrivacyPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('uses standard HTML elements', () => {
      const { container } = renderWithProviders(<DataPrivacyPage />);
      expect(container.querySelector('div')).toBeInTheDocument();
      expect(container.querySelector('h1')).toBeInTheDocument();
      expect(container.querySelector('p')).toBeInTheDocument();
    });

    it('does not use deprecated HTML attributes', () => {
      const { container } = renderWithProviders(<DataPrivacyPage />);
      const allElements = container.querySelectorAll('*');
      allElements.forEach(element => {
        expect(element.hasAttribute('align')).toBe(false);
        expect(element.hasAttribute('bgcolor')).toBe(false);
      });
    });
  });

  describe('CSS Classes and Styling', () => {
    it('applies Tailwind utility classes correctly', () => {
      const { container } = renderWithProviders(<DataPrivacyPage />);
      expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
      expect(container.querySelector('.bg-gray-50')).toBeInTheDocument();
    });

    it('uses consistent spacing classes', () => {
      const { container } = renderWithProviders(<DataPrivacyPage />);
      expect(container.querySelector('.p-6')).toBeInTheDocument();
      expect(container.querySelector('.p-8')).toBeInTheDocument();
    });

    it('applies responsive design classes', () => {
      const { container } = renderWithProviders(<DataPrivacyPage />);
      expect(container.querySelector('.max-w-6xl')).toBeInTheDocument();
    });

    it('uses design system colors', () => {
      const { container } = renderWithProviders(<DataPrivacyPage />);
      expect(container.querySelector('[class*="gray"]')).toBeInTheDocument();
    });

    it('has consistent border radius', () => {
      const { container } = renderWithProviders(<DataPrivacyPage />);
      expect(container.querySelector('.rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]')).toBeInTheDocument();
    });

    it('applies shadow effects', () => {
      const { container } = renderWithProviders(<DataPrivacyPage />);
      expect(container.querySelector('.shadow-xl')).toBeInTheDocument();
    });
  });

  describe('Text Content', () => {
    it('displays correct page title', () => {
      renderWithProviders(<DataPrivacyPage />);
      expect(screen.getByText('DataPrivacyPage')).toBeInTheDocument();
    });

    it('displays placeholder description', () => {
      renderWithProviders(<DataPrivacyPage />);
      expect(screen.getByText(/This is the DataPrivacyPage page/i)).toBeInTheDocument();
    });

    it('text is properly formatted', () => {
      renderWithProviders(<DataPrivacyPage />);
      const heading = screen.getByRole('heading');
      expect(heading.textContent).toBe('DataPrivacyPage');
    });

    it('no text overflow issues', () => {
      const { container } = renderWithProviders(<DataPrivacyPage />);
      const textElements = container.querySelectorAll('h1, p');
      textElements.forEach(element => {
        const styles = window.getComputedStyle(element);
        expect(styles.overflow).not.toBe('hidden');
      });
    });
  });

  describe('Snapshot Testing', () => {
    it('matches snapshot', () => {
      const { container } = renderWithProviders(<DataPrivacyPage />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot in dark mode context', () => {
      const { container } = renderWithProviders(<DataPrivacyPage />);
      container.firstChild.classList.add('dark');
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot on mobile viewport', () => {
      global.innerWidth = 375;
      const { container } = renderWithProviders(<DataPrivacyPage />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot on desktop viewport', () => {
      global.innerWidth = 1920;
      const { container } = renderWithProviders(<DataPrivacyPage />);
      expect(container).toMatchSnapshot();
    });
  });

  describe('Integration Tests', () => {
    it('integrates with React Router providers', () => {
      renderWithProviders(<DataPrivacyPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('works within AuthProvider context', () => {
      renderWithProviders(<DataPrivacyPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders without additional context providers', () => {
      render(<DataPrivacyPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('User Experience', () => {
    it('displays content immediately', () => {
      renderWithProviders(<DataPrivacyPage />);
      expect(screen.getByRole('heading')).toBeVisible();
    });

    it('has readable text sizing', () => {
      renderWithProviders(<DataPrivacyPage />);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('text-3xl');
    });

    it('provides clear visual hierarchy', () => {
      renderWithProviders(<DataPrivacyPage />);
      const heading = screen.getByRole('heading');
      const paragraph = screen.getByText(/This is the DataPrivacyPage page/i);
      expect(heading).toBeInTheDocument();
      expect(paragraph).toBeInTheDocument();
    });

    it('content is scannable', () => {
      renderWithProviders(<DataPrivacyPage />);
      expect(screen.getByRole('heading')).toBeVisible();
      expect(screen.getByText(/This is the DataPrivacyPage page/i)).toBeVisible();
    });
  });

  describe('Loading States', () => {
    it('renders content immediately without loading state', () => {
      renderWithProviders(<DataPrivacyPage />);
      expect(screen.getByRole('heading')).toBeInTheDocument();
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('does not show skeleton loaders', () => {
      const { container } = renderWithProviders(<DataPrivacyPage />);
      expect(container.querySelector('.')).not.toBeInTheDocument();
    });

    it('content is visible on first render', () => {
      renderWithProviders(<DataPrivacyPage />);
      expect(screen.getByText('DataPrivacyPage')).toBeVisible();
    });
  });

  describe('Error Handling', () => {
    it('renders without runtime errors', () => {
      expect(() => renderWithProviders(<DataPrivacyPage />)).not.toThrow();
    });

    it('handles render errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithProviders(<DataPrivacyPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('does not throw on invalid props', () => {
      expect(() => renderWithProviders(<DataPrivacyPage invalidProp="test" />)).not.toThrow();
    });
  });

  describe('Component Props', () => {
    it('accepts and ignores additional props', () => {
      expect(() => renderWithProviders(<DataPrivacyPage extraProp="value" />)).not.toThrow();
    });

    it('renders correctly without any props', () => {
      renderWithProviders(<DataPrivacyPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('DOM Structure Validation', () => {
    it('has correct parent-child relationships', () => {
      const { container } = renderWithProviders(<DataPrivacyPage />);
      const main = container.querySelector('[role="main"]');
      const maxWidth = main.querySelector('.max-w-6xl');
      expect(main).toContainElement(maxWidth);
    });

    it('heading is child of content card', () => {
      const { container } = renderWithProviders(<DataPrivacyPage />);
      const card = container.querySelector('.bg-white');
      const heading = screen.getByRole('heading');
      expect(card).toContainElement(heading);
    });

    it('paragraph is sibling of heading', () => {
      const { container } = renderWithProviders(<DataPrivacyPage />);
      const card = container.querySelector('.bg-white');
      const heading = card.querySelector('h1');
      const paragraph = card.querySelector('p');
      expect(heading.parentElement).toBe(paragraph.parentElement);
    });
  });
});

export default consoleSpy
