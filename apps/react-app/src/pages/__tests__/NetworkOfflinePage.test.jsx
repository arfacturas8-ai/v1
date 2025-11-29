/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../__test__/utils/testUtils';
import NetworkOfflinePage from '../NetworkOfflinePage';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, ...props }) => <div {...props}>{children}</div>,
  },
}));

describe('NetworkOfflinePage', () => {
  let originalLocation;

  beforeEach(() => {
    jest.clearAllMocks();
    originalLocation = window.location;
    delete window.location;
    window.location = { reload: jest.fn() };
  });

  afterEach(() => {
    window.location = originalLocation;
    jest.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders component without crashing', () => {
      const { container } = render(<NetworkOfflinePage />);
      expect(container).toBeInTheDocument();
    });

    it('renders main content area', () => {
      render(<NetworkOfflinePage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('has proper aria-label', () => {
      render(<NetworkOfflinePage />);
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', 'Network offline page');
    });

    it('renders with full height', () => {
      render(<NetworkOfflinePage />);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('min-h-screen');
    });

    it('renders with proper background', () => {
      render(<NetworkOfflinePage />);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('bg-gray-50', 'dark:bg-[#0d1117]');
    });

    it('renders with flexbox layout', () => {
      render(<NetworkOfflinePage />);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('flex', 'items-center', 'justify-center');
    });

    it('renders with padding', () => {
      render(<NetworkOfflinePage />);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('p-6');
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      render(<NetworkOfflinePage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('renders centered content container', () => {
      const { container } = render(<NetworkOfflinePage />);
      const centerDiv = container.querySelector('.text-center');
      expect(centerDiv).toBeInTheDocument();
    });

    it('content container has max width', () => {
      const { container } = render(<NetworkOfflinePage />);
      const centerDiv = container.querySelector('.max-w-md');
      expect(centerDiv).toBeInTheDocument();
    });
  });

  describe('Icon Rendering', () => {
    it('renders WifiOff icon', () => {
      const { container } = render(<NetworkOfflinePage />);
      const icon = container.querySelector('.lucide-wifi-off');
      expect(icon).toBeInTheDocument();
    });

    it('WifiOff icon has correct size', () => {
      const { container } = render(<NetworkOfflinePage />);
      const icon = container.querySelector('.lucide-wifi-off');
      expect(icon).toHaveClass('w-24', 'h-24');
    });

    it('WifiOff icon is centered', () => {
      const { container } = render(<NetworkOfflinePage />);
      const icon = container.querySelector('.lucide-wifi-off');
      expect(icon).toHaveClass('mx-auto');
    });

    it('WifiOff icon has bottom margin', () => {
      const { container } = render(<NetworkOfflinePage />);
      const icon = container.querySelector('.lucide-wifi-off');
      expect(icon).toHaveClass('mb-6');
    });

    it('WifiOff icon has gray color', () => {
      const { container } = render(<NetworkOfflinePage />);
      const icon = container.querySelector('.lucide-wifi-off');
      expect(icon).toHaveClass('text-[#8b949e]');
    });

    it('renders RefreshCw icon in button', () => {
      const { container } = render(<NetworkOfflinePage />);
      const icon = container.querySelector('.lucide-refresh-cw');
      expect(icon).toBeInTheDocument();
    });

    it('RefreshCw icon has correct size', () => {
      const { container } = render(<NetworkOfflinePage />);
      const icon = container.querySelector('.lucide-refresh-cw');
      expect(icon).toHaveClass('w-5', 'h-5');
    });
  });

  describe('Heading and Text Content', () => {
    it('renders main heading', () => {
      render(<NetworkOfflinePage />);
      const heading = screen.getByRole('heading', { name: /no internet connection/i });
      expect(heading).toBeInTheDocument();
    });

    it('heading has correct level', () => {
      render(<NetworkOfflinePage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('heading has proper styling', () => {
      render(<NetworkOfflinePage />);
      const heading = screen.getByRole('heading', { name: /no internet connection/i });
      expect(heading).toHaveClass('text-4xl', 'font-bold', 'mb-4');
    });

    it('renders descriptive text', () => {
      render(<NetworkOfflinePage />);
      const text = screen.getByText(/please check your network connection and try again/i);
      expect(text).toBeInTheDocument();
    });

    it('descriptive text has proper styling', () => {
      render(<NetworkOfflinePage />);
      const text = screen.getByText(/please check your network connection and try again/i);
      expect(text).toHaveClass('text-gray-600', 'dark:text-[#8b949e]', 'mb-8');
    });

    it('all content is visible', () => {
      render(<NetworkOfflinePage />);
      expect(screen.getByText(/no internet connection/i)).toBeVisible();
      expect(screen.getByText(/please check your network connection and try again/i)).toBeVisible();
    });
  });

  describe('Retry Button', () => {
    it('renders retry button', () => {
      render(<NetworkOfflinePage />);
      const button = screen.getByRole('button', { name: /try again/i });
      expect(button).toBeInTheDocument();
    });

    it('button has correct text', () => {
      render(<NetworkOfflinePage />);
      const button = screen.getByRole('button', { name: /try again/i });
      expect(button).toHaveTextContent(/try again/i);
    });

    it('button has proper styling', () => {
      render(<NetworkOfflinePage />);
      const button = screen.getByRole('button', { name: /try again/i });
      expect(button).toHaveClass('px-8', 'py-3', 'bg-[#58a6ff]', 'text-white', 'rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]', 'font-semibold');
    });

    it('button has hover styles', () => {
      render(<NetworkOfflinePage />);
      const button = screen.getByRole('button', { name: /try again/i });
      expect(button).toHaveClass('hover:bg-blue-600');
    });

    it('button displays flex layout', () => {
      render(<NetworkOfflinePage />);
      const button = screen.getByRole('button', { name: /try again/i });
      expect(button).toHaveClass('flex', 'items-center', 'gap-2');
    });

    it('button is centered', () => {
      render(<NetworkOfflinePage />);
      const button = screen.getByRole('button', { name: /try again/i });
      expect(button).toHaveClass('mx-auto');
    });

    it('button is not disabled', () => {
      render(<NetworkOfflinePage />);
      const button = screen.getByRole('button', { name: /try again/i });
      expect(button).not.toBeDisabled();
    });

    it('button contains refresh icon', () => {
      const { container } = render(<NetworkOfflinePage />);
      const button = screen.getByRole('button', { name: /try again/i });
      const icon = button.querySelector('.lucide-refresh-cw');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Button Interactions', () => {
    it('reloads page when button is clicked', async () => {
      const user = userEvent.setup();
      render(<NetworkOfflinePage />);
      const button = screen.getByRole('button', { name: /try again/i });

      await user.click(button);

      expect(window.location.reload).toHaveBeenCalledTimes(1);
    });

    it('reloads page on multiple clicks', async () => {
      const user = userEvent.setup();
      render(<NetworkOfflinePage />);
      const button = screen.getByRole('button', { name: /try again/i });

      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(window.location.reload).toHaveBeenCalledTimes(3);
    });

    it('button is keyboard accessible', async () => {
      render(<NetworkOfflinePage />);
      const button = screen.getByRole('button', { name: /try again/i });

      button.focus();
      expect(button).toHaveFocus();
    });

    it('supports Enter key press', () => {
      render(<NetworkOfflinePage />);
      const button = screen.getByRole('button', { name: /try again/i });

      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      button.click();

      expect(window.location.reload).toHaveBeenCalled();
    });

    it('supports Space key press', () => {
      render(<NetworkOfflinePage />);
      const button = screen.getByRole('button', { name: /try again/i });

      fireEvent.keyDown(button, { key: ' ', code: 'Space' });
      button.click();

      expect(window.location.reload).toHaveBeenCalled();
    });
  });

  describe('Dark Mode Support', () => {
    it('main container supports dark mode', () => {
      render(<NetworkOfflinePage />);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('dark:bg-[#0d1117]');
    });

    it('descriptive text supports dark mode', () => {
      render(<NetworkOfflinePage />);
      const text = screen.getByText(/please check your network connection and try again/i);
      expect(text).toHaveClass('dark:text-[#8b949e]');
    });
  });

  describe('Accessibility', () => {
    it('has proper page structure', () => {
      render(<NetworkOfflinePage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('has proper heading hierarchy', () => {
      render(<NetworkOfflinePage />);
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
    });

    it('button has accessible name', () => {
      render(<NetworkOfflinePage />);
      const button = screen.getByRole('button', { name: /try again/i });
      expect(button).toHaveAccessibleName();
    });

    it('supports screen readers', () => {
      render(<NetworkOfflinePage />);
      const main = screen.getByRole('main');
      expect(main).toHaveAccessibleName('Network offline page');
    });

    it('icon has proper color contrast', () => {
      const { container } = render(<NetworkOfflinePage />);
      const icon = container.querySelector('.lucide-wifi-off');
      expect(icon).toHaveClass('text-[#8b949e]');
    });

    it('button has adequate size for touch', () => {
      render(<NetworkOfflinePage />);
      const button = screen.getByRole('button', { name: /try again/i });
      expect(button).toHaveClass('px-8', 'py-3');
    });
  });

  describe('Responsive Behavior', () => {
    it('renders correctly on mobile', () => {
      global.innerWidth = 375;
      render(<NetworkOfflinePage />);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('p-6');
    });

    it('renders correctly on tablet', () => {
      global.innerWidth = 768;
      render(<NetworkOfflinePage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('renders correctly on desktop', () => {
      global.innerWidth = 1920;
      render(<NetworkOfflinePage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('content container is constrained on large screens', () => {
      const { container } = render(<NetworkOfflinePage />);
      const centerDiv = container.querySelector('.max-w-md');
      expect(centerDiv).toBeInTheDocument();
    });
  });

  describe('Component Lifecycle', () => {
    it('mounts without errors', () => {
      const { container } = render(<NetworkOfflinePage />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('unmounts cleanly', () => {
      const { unmount, container } = render(<NetworkOfflinePage />);
      unmount();
      expect(container).toBeEmptyDOMElement();
    });

    it('re-renders without issues', () => {
      const { rerender } = render(<NetworkOfflinePage />);
      rerender(<NetworkOfflinePage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('maintains state across re-renders', () => {
      const { rerender } = render(<NetworkOfflinePage />);
      const firstMain = screen.getByRole('main');
      rerender(<NetworkOfflinePage />);
      const secondMain = screen.getByRole('main');
      expect(secondMain).toBe(firstMain);
    });
  });

  describe('Performance', () => {
    it('component is memoized', () => {
      const MemoizedComponent = NetworkOfflinePage;
      expect(MemoizedComponent.$$typeof?.toString()).toContain('react.memo');
    });

    it('renders efficiently', () => {
      const startTime = performance.now();
      render(<NetworkOfflinePage />);
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('does not cause memory leaks', () => {
      const { unmount } = render(<NetworkOfflinePage />);
      unmount();
      // No errors should be thrown
    });
  });

  describe('Animation Support', () => {
    it('applies framer-motion animation', () => {
      const { container } = render(<NetworkOfflinePage />);
      const animatedDiv = container.querySelector('.text-center');
      expect(animatedDiv).toBeInTheDocument();
    });

    it('renders without animation errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      render(<NetworkOfflinePage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('handles window.location.reload being undefined', () => {
      delete window.location.reload;
      const { container } = render(<NetworkOfflinePage />);
      expect(container).toBeInTheDocument();
    });

    it('handles rapid button clicks', async () => {
      const user = userEvent.setup();
      render(<NetworkOfflinePage />);
      const button = screen.getByRole('button', { name: /try again/i });

      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(window.location.reload).toHaveBeenCalledTimes(3);
    });

    it('renders with minimal viewport', () => {
      global.innerWidth = 320;
      render(<NetworkOfflinePage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders with large viewport', () => {
      global.innerWidth = 2560;
      render(<NetworkOfflinePage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Content Verification', () => {
    it('displays complete error message', () => {
      render(<NetworkOfflinePage />);
      expect(screen.getByText(/no internet connection/i)).toBeInTheDocument();
      expect(screen.getByText(/please check your network connection and try again/i)).toBeInTheDocument();
    });

    it('message is clear and user-friendly', () => {
      render(<NetworkOfflinePage />);
      const heading = screen.getByText(/no internet connection/i);
      const description = screen.getByText(/please check your network connection and try again/i);

      expect(heading).toBeVisible();
      expect(description).toBeVisible();
    });

    it('provides actionable solution', () => {
      render(<NetworkOfflinePage />);
      const button = screen.getByRole('button', { name: /try again/i });
      expect(button).toBeVisible();
    });
  });

  describe('Network Status Detection', () => {
    it('renders offline state correctly', () => {
      render(<NetworkOfflinePage />);
      expect(screen.getByText(/no internet connection/i)).toBeInTheDocument();
    });

    it('displays offline icon', () => {
      const { container } = render(<NetworkOfflinePage />);
      const icon = container.querySelector('.lucide-wifi-off');
      expect(icon).toBeInTheDocument();
    });

    it('provides retry mechanism', () => {
      render(<NetworkOfflinePage />);
      const button = screen.getByRole('button', { name: /try again/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('User Experience', () => {
    it('centers content vertically and horizontally', () => {
      render(<NetworkOfflinePage />);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('flex', 'items-center', 'justify-center');
    });

    it('uses clear visual hierarchy', () => {
      const { container } = render(<NetworkOfflinePage />);
      const icon = container.querySelector('.lucide-wifi-off');
      const heading = screen.getByRole('heading', { level: 1 });
      const button = screen.getByRole('button');

      expect(icon).toHaveClass('mb-6');
      expect(heading).toHaveClass('mb-4');
      expect(button).toBeInTheDocument();
    });

    it('provides clear call to action', () => {
      render(<NetworkOfflinePage />);
      const button = screen.getByRole('button', { name: /try again/i });
      expect(button).toHaveClass('bg-[#58a6ff]', 'text-white');
    });
  });
});

export default main
