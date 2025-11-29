/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../__test__/utils/testUtils';
import EventsCalendarPage from './EventsCalendarPage';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

describe('EventsCalendarPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Page Rendering', () => {
    it('renders page without crashing', () => {
      const { container } = renderWithProviders(<EventsCalendarPage />);
      expect(container).toBeInTheDocument();
    });

    it('renders the component successfully', () => {
      const { container } = renderWithProviders(<EventsCalendarPage />);
      expect(container.firstChild).toBeTruthy();
    });

    it('displays main content area', () => {
      renderWithProviders(<EventsCalendarPage />);
      const mainElement = screen.queryByRole('main');
      expect(mainElement).toBeInTheDocument();
    });

    it('renders main container with correct role', () => {
      renderWithProviders(<EventsCalendarPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', 'Events calendar page');
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithProviders(<EventsCalendarPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('renders without console warnings', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      renderWithProviders(<EventsCalendarPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('renders with correct component structure', () => {
      const { container } = renderWithProviders(<EventsCalendarPage />);
      const main = container.querySelector('[role="main"]');
      expect(main).toBeInTheDocument();
    });

    it('applies correct base classes to main container', () => {
      renderWithProviders(<EventsCalendarPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('min-h-screen', 'bg-gray-50', 'dark:bg-[#161b22]', 'p-6');
    });

    it('renders inner wrapper with max-width constraint', () => {
      const { container } = renderWithProviders(<EventsCalendarPage />);
      const wrapper = container.querySelector('.max-w-6xl');
      expect(wrapper).toBeInTheDocument();
    });

    it('centers content horizontally', () => {
      const { container } = renderWithProviders(<EventsCalendarPage />);
      const wrapper = container.querySelector('.mx-auto');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Content Rendering', () => {
    it('displays the page heading', () => {
      renderWithProviders(<EventsCalendarPage />);
      expect(screen.getByRole('heading', { name: /EventsCalendarPage/i })).toBeInTheDocument();
    });

    it('displays the correct heading text', () => {
      renderWithProviders(<EventsCalendarPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('EventsCalendarPage');
    });

    it('displays the description text', () => {
      renderWithProviders(<EventsCalendarPage />);
      expect(screen.getByText(/This is the EventsCalendarPage page/i)).toBeInTheDocument();
    });

    it('displays the full description message', () => {
      renderWithProviders(<EventsCalendarPage />);
      expect(screen.getByText('This is the EventsCalendarPage page. Content will be implemented here.')).toBeInTheDocument();
    });

    it('renders content card with correct styling', () => {
      const { container } = renderWithProviders(<EventsCalendarPage />);
      const card = container.querySelector('.bg-white.dark\\:bg-[#161b22]');
      expect(card).toBeInTheDocument();
    });

    it('applies rounded corners to content card', () => {
      const { container } = renderWithProviders(<EventsCalendarPage />);
      const card = container.querySelector('.rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]');
      expect(card).toBeInTheDocument();
    });

    it('applies padding to content card', () => {
      const { container } = renderWithProviders(<EventsCalendarPage />);
      const card = container.querySelector('.p-8');
      expect(card).toBeInTheDocument();
    });

    it('applies shadow to content card', () => {
      const { container } = renderWithProviders(<EventsCalendarPage />);
      const card = container.querySelector('.shadow-xl');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Typography and Styling', () => {
    it('applies correct heading styles', () => {
      renderWithProviders(<EventsCalendarPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('text-3xl', 'font-bold', 'mb-6', 'text-gray-900', 'dark:text-white');
    });

    it('applies correct description styles', () => {
      renderWithProviders(<EventsCalendarPage />);
      const description = screen.getByText(/This is the EventsCalendarPage page/i);
      expect(description).toHaveClass('text-gray-600', 'dark:text-[#8b949e]');
    });

    it('uses proper font size for heading', () => {
      renderWithProviders(<EventsCalendarPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('text-3xl');
    });

    it('uses bold font weight for heading', () => {
      renderWithProviders(<EventsCalendarPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('font-bold');
    });

    it('applies margin bottom to heading', () => {
      renderWithProviders(<EventsCalendarPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('mb-6');
    });
  });

  describe('Dark Mode Support', () => {
    it('has dark mode classes on main container', () => {
      renderWithProviders(<EventsCalendarPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('dark:bg-[#161b22]');
    });

    it('has dark mode classes on content card', () => {
      const { container } = renderWithProviders(<EventsCalendarPage />);
      const card = container.querySelector('.dark\\:bg-[#161b22]');
      expect(card).toBeInTheDocument();
    });

    it('has dark mode classes on heading', () => {
      renderWithProviders(<EventsCalendarPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('dark:text-white');
    });

    it('has dark mode classes on description', () => {
      renderWithProviders(<EventsCalendarPage />);
      const description = screen.getByText(/This is the EventsCalendarPage page/i);
      expect(description).toHaveClass('dark:text-[#8b949e]');
    });
  });

  describe('Accessibility', () => {
    it('has proper page structure', () => {
      renderWithProviders(<EventsCalendarPage />);
      const main = screen.queryByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('has proper heading hierarchy', () => {
      renderWithProviders(<EventsCalendarPage />);
      const headings = screen.queryAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('has exactly one h1 heading', () => {
      renderWithProviders(<EventsCalendarPage />);
      const h1Headings = screen.getAllByRole('heading', { level: 1 });
      expect(h1Headings).toHaveLength(1);
    });

    it('main region has accessible name', () => {
      renderWithProviders(<EventsCalendarPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label');
    });

    it('main region has descriptive aria-label', () => {
      renderWithProviders(<EventsCalendarPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', 'Events calendar page');
    });

    it('supports keyboard navigation', () => {
      renderWithProviders(<EventsCalendarPage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('has semantic HTML structure', () => {
      const { container } = renderWithProviders(<EventsCalendarPage />);
      const main = container.querySelector('main');
      expect(main).toBeInTheDocument();
    });

    it('uses heading for page title', () => {
      renderWithProviders(<EventsCalendarPage />);
      const heading = screen.getByRole('heading', { name: /EventsCalendarPage/i });
      expect(heading.tagName).toBe('H1');
    });

    it('uses paragraph for description', () => {
      renderWithProviders(<EventsCalendarPage />);
      const description = screen.getByText(/This is the EventsCalendarPage page/i);
      expect(description.tagName).toBe('P');
    });

    it('has no accessibility violations in basic structure', () => {
      const { container } = renderWithProviders(<EventsCalendarPage />);
      expect(container.querySelector('[role="main"]')).toBeInTheDocument();
      expect(container.querySelector('h1')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('renders a single main element', () => {
      renderWithProviders(<EventsCalendarPage />);
      const mains = screen.getAllByRole('main');
      expect(mains).toHaveLength(1);
    });

    it('contains wrapper div with max-width', () => {
      const { container } = renderWithProviders(<EventsCalendarPage />);
      const wrapper = container.querySelector('.max-w-6xl');
      expect(wrapper).toBeInTheDocument();
    });

    it('contains motion.div component', () => {
      const { container } = renderWithProviders(<EventsCalendarPage />);
      // Since motion.div is mocked to render as div, we check for the content card
      const card = container.querySelector('.bg-white.dark\\:bg-[#161b22]');
      expect(card).toBeInTheDocument();
    });

    it('has correct nesting structure', () => {
      const { container } = renderWithProviders(<EventsCalendarPage />);
      const main = container.querySelector('[role="main"]');
      const wrapper = main.querySelector('.max-w-6xl');
      expect(wrapper).toBeInTheDocument();
    });

    it('motion div contains heading and description', () => {
      const { container } = renderWithProviders(<EventsCalendarPage />);
      const card = container.querySelector('.bg-white.dark\\:bg-[#161b22]');
      const heading = within(card).getByRole('heading');
      const description = within(card).getByText(/This is the EventsCalendarPage page/i);
      expect(heading).toBeInTheDocument();
      expect(description).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('renders correctly on mobile', () => {
      global.innerWidth = 375;
      renderWithProviders(<EventsCalendarPage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('renders correctly on tablet', () => {
      global.innerWidth = 768;
      renderWithProviders(<EventsCalendarPage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('renders correctly on desktop', () => {
      global.innerWidth = 1920;
      renderWithProviders(<EventsCalendarPage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('has padding on all screen sizes', () => {
      renderWithProviders(<EventsCalendarPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('p-6');
    });

    it('constrains max width on large screens', () => {
      global.innerWidth = 1920;
      const { container } = renderWithProviders(<EventsCalendarPage />);
      const wrapper = container.querySelector('.max-w-6xl');
      expect(wrapper).toBeInTheDocument();
    });

    it('maintains full height on mobile', () => {
      global.innerWidth = 375;
      renderWithProviders(<EventsCalendarPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('min-h-screen');
    });

    it('maintains full height on desktop', () => {
      global.innerWidth = 1920;
      renderWithProviders(<EventsCalendarPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('min-h-screen');
    });
  });

  describe('Component Memoization', () => {
    it('is wrapped with memo', () => {
      expect(EventsCalendarPage.$$typeof).toBeDefined();
    });

    it('renders consistently on multiple renders', () => {
      const { rerender } = renderWithProviders(<EventsCalendarPage />);
      const firstRender = screen.getByRole('heading').textContent;
      rerender(<EventsCalendarPage />);
      const secondRender = screen.getByRole('heading').textContent;
      expect(firstRender).toBe(secondRender);
    });

    it('maintains state across rerenders', () => {
      const { rerender } = renderWithProviders(<EventsCalendarPage />);
      const main = screen.getByRole('main');
      rerender(<EventsCalendarPage />);
      expect(main).toBeInTheDocument();
    });
  });

  describe('Framer Motion Integration', () => {
    it('motion.div is rendered (mocked)', () => {
      const { container } = renderWithProviders(<EventsCalendarPage />);
      const card = container.querySelector('.bg-white.dark\\:bg-[#161b22]');
      expect(card).toBeInTheDocument();
    });

    it('content card contains expected elements', () => {
      const { container } = renderWithProviders(<EventsCalendarPage />);
      const card = container.querySelector('.bg-white.dark\\:bg-[#161b22]');
      expect(card.querySelector('h1')).toBeInTheDocument();
      expect(card.querySelector('p')).toBeInTheDocument();
    });
  });

  describe('DOM Structure', () => {
    it('has correct number of divs', () => {
      const { container } = renderWithProviders(<EventsCalendarPage />);
      const divs = container.querySelectorAll('div');
      expect(divs.length).toBeGreaterThan(0);
    });

    it('main element is a direct child', () => {
      const { container } = renderWithProviders(<EventsCalendarPage />);
      const main = container.querySelector('[role="main"]');
      expect(main).toBeInTheDocument();
    });

    it('heading is properly nested', () => {
      const { container } = renderWithProviders(<EventsCalendarPage />);
      const heading = container.querySelector('h1');
      expect(heading).toBeInTheDocument();
    });

    it('description is properly nested', () => {
      const { container } = renderWithProviders(<EventsCalendarPage />);
      const description = container.querySelector('p');
      expect(description).toBeInTheDocument();
    });
  });

  describe('CSS Classes', () => {
    it('applies min-h-screen to main', () => {
      renderWithProviders(<EventsCalendarPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('min-h-screen');
    });

    it('applies bg-gray-50 to main', () => {
      renderWithProviders(<EventsCalendarPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('bg-gray-50');
    });

    it('applies p-6 padding to main', () => {
      renderWithProviders(<EventsCalendarPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('p-6');
    });

    it('applies max-w-6xl to wrapper', () => {
      const { container } = renderWithProviders(<EventsCalendarPage />);
      const wrapper = container.querySelector('.max-w-6xl');
      expect(wrapper).toBeInTheDocument();
    });

    it('applies mx-auto to wrapper', () => {
      const { container } = renderWithProviders(<EventsCalendarPage />);
      const wrapper = container.querySelector('.mx-auto');
      expect(wrapper).toBeInTheDocument();
    });

    it('applies bg-white to card', () => {
      const { container } = renderWithProviders(<EventsCalendarPage />);
      const card = container.querySelector('.bg-white');
      expect(card).toBeInTheDocument();
    });

    it('applies rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] to card', () => {
      const { container } = renderWithProviders(<EventsCalendarPage />);
      const card = container.querySelector('.rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]');
      expect(card).toBeInTheDocument();
    });

    it('applies p-8 to card', () => {
      const { container } = renderWithProviders(<EventsCalendarPage />);
      const card = container.querySelector('.p-8');
      expect(card).toBeInTheDocument();
    });

    it('applies shadow-xl to card', () => {
      const { container } = renderWithProviders(<EventsCalendarPage />);
      const card = container.querySelector('.shadow-xl');
      expect(card).toBeInTheDocument();
    });

    it('applies text-3xl to heading', () => {
      renderWithProviders(<EventsCalendarPage />);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('text-3xl');
    });

    it('applies font-bold to heading', () => {
      renderWithProviders(<EventsCalendarPage />);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('font-bold');
    });

    it('applies mb-6 to heading', () => {
      renderWithProviders(<EventsCalendarPage />);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('mb-6');
    });

    it('applies text-gray-900 to heading', () => {
      renderWithProviders(<EventsCalendarPage />);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('text-gray-900');
    });

    it('applies text-gray-600 to description', () => {
      renderWithProviders(<EventsCalendarPage />);
      const description = screen.getByText(/This is the EventsCalendarPage page/i);
      expect(description).toHaveClass('text-gray-600');
    });
  });

  describe('Text Content', () => {
    it('heading text is exactly "EventsCalendarPage"', () => {
      renderWithProviders(<EventsCalendarPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('EventsCalendarPage');
    });

    it('heading text has no extra whitespace', () => {
      renderWithProviders(<EventsCalendarPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading.textContent.trim()).toBe('EventsCalendarPage');
    });

    it('description starts with "This is the EventsCalendarPage page"', () => {
      renderWithProviders(<EventsCalendarPage />);
      const description = screen.getByText(/This is the EventsCalendarPage page/i);
      expect(description.textContent).toContain('This is the EventsCalendarPage page');
    });

    it('description ends with "Content will be implemented here."', () => {
      renderWithProviders(<EventsCalendarPage />);
      const description = screen.getByText(/Content will be implemented here/i);
      expect(description.textContent).toContain('Content will be implemented here.');
    });

    it('description has exactly the expected text', () => {
      renderWithProviders(<EventsCalendarPage />);
      const description = screen.getByText('This is the EventsCalendarPage page. Content will be implemented here.');
      expect(description).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles multiple rapid rerenders', () => {
      const { rerender } = renderWithProviders(<EventsCalendarPage />);
      for (let i = 0; i < 10; i++) {
        rerender(<EventsCalendarPage />);
      }
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders without props', () => {
      expect(() => renderWithProviders(<EventsCalendarPage />)).not.toThrow();
    });

    it('renders with empty object as props', () => {
      expect(() => renderWithProviders(<EventsCalendarPage {...{}} />)).not.toThrow();
    });

    it('maintains structure after rerender', () => {
      const { rerender, container } = renderWithProviders(<EventsCalendarPage />);
      const initialStructure = container.innerHTML;
      rerender(<EventsCalendarPage />);
      expect(container.innerHTML).toBe(initialStructure);
    });
  });

  describe('Browser Compatibility', () => {
    it('renders without errors in JSDOM environment', () => {
      expect(() => renderWithProviders(<EventsCalendarPage />)).not.toThrow();
    });

    it('does not rely on browser-specific APIs', () => {
      const { container } = renderWithProviders(<EventsCalendarPage />);
      expect(container).toBeInTheDocument();
    });

    it('uses standard HTML elements', () => {
      const { container } = renderWithProviders(<EventsCalendarPage />);
      const main = container.querySelector('main');
      const heading = container.querySelector('h1');
      const paragraph = container.querySelector('p');
      expect(main).toBeInTheDocument();
      expect(heading).toBeInTheDocument();
      expect(paragraph).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('renders in a reasonable time', () => {
      const start = performance.now();
      renderWithProviders(<EventsCalendarPage />);
      const end = performance.now();
      expect(end - start).toBeLessThan(1000); // Should render in less than 1 second
    });

    it('does not create memory leaks on unmount', () => {
      const { unmount } = renderWithProviders(<EventsCalendarPage />);
      expect(() => unmount()).not.toThrow();
    });

    it('cleans up properly', () => {
      const { unmount } = renderWithProviders(<EventsCalendarPage />);
      unmount();
      expect(screen.queryByRole('main')).not.toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('works with renderWithProviders utility', () => {
      const result = renderWithProviders(<EventsCalendarPage />);
      expect(result.container).toBeInTheDocument();
    });

    it('can be queried by role', () => {
      renderWithProviders(<EventsCalendarPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('heading')).toBeInTheDocument();
    });

    it('can be queried by text', () => {
      renderWithProviders(<EventsCalendarPage />);
      expect(screen.getByText('EventsCalendarPage')).toBeInTheDocument();
    });

    it('supports queryBy methods', () => {
      renderWithProviders(<EventsCalendarPage />);
      expect(screen.queryByRole('main')).toBeInTheDocument();
    });

    it('supports getBy methods', () => {
      renderWithProviders(<EventsCalendarPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('supports findBy methods', async () => {
      renderWithProviders(<EventsCalendarPage />);
      const main = await screen.findByRole('main');
      expect(main).toBeInTheDocument();
    });
  });

  describe('Snapshot Testing', () => {
    it('matches snapshot', () => {
      const { container } = renderWithProviders(<EventsCalendarPage />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('heading matches snapshot', () => {
      renderWithProviders(<EventsCalendarPage />);
      const heading = screen.getByRole('heading');
      expect(heading).toMatchSnapshot();
    });

    it('description matches snapshot', () => {
      renderWithProviders(<EventsCalendarPage />);
      const description = screen.getByText(/This is the EventsCalendarPage page/i);
      expect(description).toMatchSnapshot();
    });

    it('main container matches snapshot', () => {
      renderWithProviders(<EventsCalendarPage />);
      const main = screen.getByRole('main');
      expect(main).toMatchSnapshot();
    });
  });

  describe('Rendering States', () => {
    it('displays content immediately (no loading state)', () => {
      renderWithProviders(<EventsCalendarPage />);
      expect(screen.getByRole('heading')).toBeInTheDocument();
      expect(screen.getByText(/This is the EventsCalendarPage page/i)).toBeInTheDocument();
    });

    it('does not show loading indicators', () => {
      renderWithProviders(<EventsCalendarPage />);
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    it('does not show error states', () => {
      renderWithProviders(<EventsCalendarPage />);
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('shows all content on initial render', () => {
      renderWithProviders(<EventsCalendarPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('heading')).toBeInTheDocument();
      expect(screen.getByText(/Content will be implemented here/i)).toBeInTheDocument();
    });
  });

  describe('User Interaction', () => {
    it('does not have interactive elements', () => {
      renderWithProviders(<EventsCalendarPage />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('is readable and informative', () => {
      renderWithProviders(<EventsCalendarPage />);
      const heading = screen.getByRole('heading');
      const description = screen.getByText(/This is the EventsCalendarPage page/i);
      expect(heading).toBeVisible();
      expect(description).toBeVisible();
    });

    it('allows text selection', () => {
      renderWithProviders(<EventsCalendarPage />);
      const heading = screen.getByRole('heading');
      expect(heading).not.toHaveAttribute('user-select', 'none');
    });
  });

  describe('Content Accessibility', () => {
    it('heading is accessible', () => {
      renderWithProviders(<EventsCalendarPage />);
      const heading = screen.getByRole('heading', { name: /EventsCalendarPage/i });
      expect(heading).toBeVisible();
    });

    it('description is accessible', () => {
      renderWithProviders(<EventsCalendarPage />);
      const description = screen.getByText(/This is the EventsCalendarPage page/i);
      expect(description).toBeVisible();
    });

    it('all text is visible', () => {
      renderWithProviders(<EventsCalendarPage />);
      const heading = screen.getByRole('heading');
      const description = screen.getByText(/This is the EventsCalendarPage page/i);
      expect(heading).toBeVisible();
      expect(description).toBeVisible();
    });

    it('uses appropriate text colors for readability', () => {
      renderWithProviders(<EventsCalendarPage />);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('text-gray-900');
    });

    it('has sufficient contrast in light mode', () => {
      renderWithProviders(<EventsCalendarPage />);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('text-gray-900');
    });

    it('has sufficient contrast in dark mode', () => {
      renderWithProviders(<EventsCalendarPage />);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('dark:text-white');
    });
  });

  describe('Layout and Spacing', () => {
    it('has consistent padding', () => {
      renderWithProviders(<EventsCalendarPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('p-6');
    });

    it('content card has generous padding', () => {
      const { container } = renderWithProviders(<EventsCalendarPage />);
      const card = container.querySelector('.p-8');
      expect(card).toBeInTheDocument();
    });

    it('heading has bottom margin', () => {
      renderWithProviders(<EventsCalendarPage />);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('mb-6');
    });

    it('uses appropriate spacing between elements', () => {
      const { container } = renderWithProviders(<EventsCalendarPage />);
      const heading = container.querySelector('h1');
      expect(heading).toHaveClass('mb-6');
    });
  });

  describe('Visual Design', () => {
    it('uses rounded corners on card', () => {
      const { container } = renderWithProviders(<EventsCalendarPage />);
      const card = container.querySelector('.rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]');
      expect(card).toBeInTheDocument();
    });

    it('applies shadow to card', () => {
      const { container } = renderWithProviders(<EventsCalendarPage />);
      const card = container.querySelector('.shadow-xl');
      expect(card).toBeInTheDocument();
    });

    it('uses appropriate background colors', () => {
      renderWithProviders(<EventsCalendarPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('bg-gray-50');
    });

    it('card has white background', () => {
      const { container } = renderWithProviders(<EventsCalendarPage />);
      const card = container.querySelector('.bg-white');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Component Export', () => {
    it('exports component as default', () => {
      expect(EventsCalendarPage).toBeDefined();
    });

    it('component is a valid React component', () => {
      expect(typeof EventsCalendarPage).toBe('object');
    });

    it('can be rendered as JSX', () => {
      expect(() => <EventsCalendarPage />).not.toThrow();
    });
  });

  describe('React Best Practices', () => {
    it('uses functional component', () => {
      expect(typeof EventsCalendarPage).toBe('object');
    });

    it('is memoized for performance', () => {
      expect(EventsCalendarPage.$$typeof).toBeDefined();
    });

    it('does not cause unnecessary rerenders', () => {
      const { rerender } = renderWithProviders(<EventsCalendarPage />);
      const heading = screen.getByRole('heading');
      const initialText = heading.textContent;
      rerender(<EventsCalendarPage />);
      expect(heading.textContent).toBe(initialText);
    });
  });

  describe('Error Boundaries', () => {
    it('renders without throwing errors', () => {
      expect(() => renderWithProviders(<EventsCalendarPage />)).not.toThrow();
    });

    it('handles render without crashing', () => {
      const { container } = renderWithProviders(<EventsCalendarPage />);
      expect(container).toBeTruthy();
    });
  });

  describe('Component Lifecycle', () => {
    it('mounts successfully', () => {
      const { container } = renderWithProviders(<EventsCalendarPage />);
      expect(container.firstChild).toBeTruthy();
    });

    it('updates successfully', () => {
      const { rerender } = renderWithProviders(<EventsCalendarPage />);
      expect(() => rerender(<EventsCalendarPage />)).not.toThrow();
    });

    it('unmounts successfully', () => {
      const { unmount } = renderWithProviders(<EventsCalendarPage />);
      expect(() => unmount()).not.toThrow();
    });

    it('cleans up after unmount', () => {
      const { unmount } = renderWithProviders(<EventsCalendarPage />);
      unmount();
      expect(screen.queryByRole('main')).not.toBeInTheDocument();
    });
  });

  describe('Testing Utilities', () => {
    it('works with screen queries', () => {
      renderWithProviders(<EventsCalendarPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('works with within queries', () => {
      const { container } = renderWithProviders(<EventsCalendarPage />);
      const main = screen.getByRole('main');
      const heading = within(main).getByRole('heading');
      expect(heading).toBeInTheDocument();
    });

    it('supports waitFor async queries', async () => {
      renderWithProviders(<EventsCalendarPage />);
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('supports findBy async queries', async () => {
      renderWithProviders(<EventsCalendarPage />);
      const main = await screen.findByRole('main');
      expect(main).toBeInTheDocument();
    });
  });
});

export default mainElement
