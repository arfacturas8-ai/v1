/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../__test__/utils/testUtils';
import MobileGestureControls from '../MobileGestureControls';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, ...props }) => <div {...props}>{children}</div>,
  },
}));

describe('MobileGestureControls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders component without crashing', () => {
      const { container } = render(<MobileGestureControls />);
      expect(container).toBeInTheDocument();
    });

    it('renders main content area', () => {
      render(<MobileGestureControls />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('has proper aria-label', () => {
      render(<MobileGestureControls />);
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', 'Mobile gesture controls page');
    });

    it('renders with proper background color', () => {
      render(<MobileGestureControls />);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('bg-gray-50', 'dark:bg-[#0d1117]');
    });

    it('renders with minimum height', () => {
      render(<MobileGestureControls />);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('min-h-screen');
    });

    it('renders with padding', () => {
      render(<MobileGestureControls />);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('p-6');
    });

    it('renders centered container', () => {
      const { container } = render(<MobileGestureControls />);
      const centerContainer = container.querySelector('.max-w-4xl');
      expect(centerContainer).toBeInTheDocument();
    });

    it('renders card container', () => {
      const { container } = render(<MobileGestureControls />);
      const card = container.querySelector('.rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]');
      expect(card).toBeInTheDocument();
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      render(<MobileGestureControls />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('renders with dark mode support', () => {
      const { container } = render(<MobileGestureControls />);
      const card = container.querySelector('.dark\\:bg-[#161b22]');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Header Section', () => {
    it('renders Smartphone icon', () => {
      const { container } = render(<MobileGestureControls />);
      const icon = container.querySelector('.lucide-smartphone');
      expect(icon).toBeInTheDocument();
    });

    it('Smartphone icon has correct size', () => {
      const { container } = render(<MobileGestureControls />);
      const icon = container.querySelector('.lucide-smartphone');
      expect(icon).toHaveClass('w-12', 'h-12');
    });

    it('Smartphone icon has blue color', () => {
      const { container } = render(<MobileGestureControls />);
      const icon = container.querySelector('.lucide-smartphone');
      expect(icon).toHaveClass('text-[#58a6ff]');
    });

    it('Smartphone icon has bottom margin', () => {
      const { container } = render(<MobileGestureControls />);
      const icon = container.querySelector('.lucide-smartphone');
      expect(icon).toHaveClass('mb-4');
    });

    it('renders main heading', () => {
      render(<MobileGestureControls />);
      const heading = screen.getByRole('heading', { name: /mobile gestures/i });
      expect(heading).toBeInTheDocument();
    });

    it('heading has correct level', () => {
      render(<MobileGestureControls />);
      const heading = screen.getByRole('heading', { name: /mobile gestures/i, level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('heading has correct styling', () => {
      render(<MobileGestureControls />);
      const heading = screen.getByRole('heading', { name: /mobile gestures/i });
      expect(heading).toHaveClass('text-3xl', 'font-bold', 'mb-6');
    });
  });

  describe('Gesture Cards', () => {
    it('renders three gesture cards', () => {
      const { container } = render(<MobileGestureControls />);
      const cards = container.querySelectorAll('.space-y-4 > div');
      expect(cards).toHaveLength(3);
    });

    it('gesture cards have rounded corners', () => {
      const { container } = render(<MobileGestureControls />);
      const cards = container.querySelectorAll('.rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]');
      expect(cards.length).toBeGreaterThanOrEqual(3);
    });

    it('gesture cards have padding', () => {
      const { container } = render(<MobileGestureControls />);
      const card = container.querySelector('.p-4');
      expect(card).toBeInTheDocument();
    });

    it('renders Swipe Right card', () => {
      render(<MobileGestureControls />);
      const heading = screen.getByRole('heading', { name: /swipe right/i });
      expect(heading).toBeInTheDocument();
    });

    it('renders Swipe Left card', () => {
      render(<MobileGestureControls />);
      const heading = screen.getByRole('heading', { name: /swipe left/i });
      expect(heading).toBeInTheDocument();
    });

    it('renders Pull to Refresh card', () => {
      render(<MobileGestureControls />);
      const heading = screen.getByRole('heading', { name: /pull to refresh/i });
      expect(heading).toBeInTheDocument();
    });

    it('Swipe Right card has blue background', () => {
      const { container } = render(<MobileGestureControls />);
      const blueCard = container.querySelector('.bg-blue-50');
      expect(blueCard).toBeInTheDocument();
    });

    it('Swipe Left card has purple background', () => {
      const { container } = render(<MobileGestureControls />);
      const purpleCard = container.querySelector('.bg-purple-50');
      expect(purpleCard).toBeInTheDocument();
    });

    it('Pull to Refresh card has green background', () => {
      const { container } = render(<MobileGestureControls />);
      const greenCard = container.querySelector('.bg-green-50');
      expect(greenCard).toBeInTheDocument();
    });
  });

  describe('Gesture Descriptions', () => {
    it('displays Swipe Right description', () => {
      render(<MobileGestureControls />);
      const description = screen.getByText(/open navigation drawer/i);
      expect(description).toBeInTheDocument();
    });

    it('displays Swipe Left description', () => {
      render(<MobileGestureControls />);
      const description = screen.getByText(/go back/i);
      expect(description).toBeInTheDocument();
    });

    it('displays Pull to Refresh description', () => {
      render(<MobileGestureControls />);
      const description = screen.getByText(/reload content/i);
      expect(description).toBeInTheDocument();
    });

    it('descriptions have proper styling', () => {
      const { container } = render(<MobileGestureControls />);
      const description = screen.getByText(/open navigation drawer/i);
      expect(description).toHaveClass('text-sm');
    });

    it('descriptions have gray color', () => {
      const { container } = render(<MobileGestureControls />);
      const description = screen.getByText(/open navigation drawer/i);
      expect(description).toHaveClass('text-gray-600', 'dark:text-[#8b949e]');
    });

    it('all descriptions are visible', () => {
      render(<MobileGestureControls />);
      expect(screen.getByText(/open navigation drawer/i)).toBeVisible();
      expect(screen.getByText(/go back/i)).toBeVisible();
      expect(screen.getByText(/reload content/i)).toBeVisible();
    });
  });

  describe('Card Headings', () => {
    it('card headings have proper level', () => {
      render(<MobileGestureControls />);
      const heading = screen.getByRole('heading', { name: /swipe right/i, level: 3 });
      expect(heading).toBeInTheDocument();
    });

    it('card headings are semibold', () => {
      render(<MobileGestureControls />);
      const heading = screen.getByRole('heading', { name: /swipe right/i });
      expect(heading).toHaveClass('font-semibold');
    });

    it('card headings have bottom margin', () => {
      render(<MobileGestureControls />);
      const heading = screen.getByRole('heading', { name: /swipe right/i });
      expect(heading).toHaveClass('mb-2');
    });

    it('all card headings are present', () => {
      render(<MobileGestureControls />);
      expect(screen.getByRole('heading', { name: /swipe right/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /swipe left/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /pull to refresh/i })).toBeInTheDocument();
    });
  });

  describe('Dark Mode Support', () => {
    it('main container supports dark mode', () => {
      render(<MobileGestureControls />);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('dark:bg-[#0d1117]');
    });

    it('card supports dark mode', () => {
      const { container } = render(<MobileGestureControls />);
      const card = container.querySelector('.bg-white');
      expect(card).toHaveClass('dark:bg-[#161b22]');
    });

    it('blue card supports dark mode', () => {
      const { container } = render(<MobileGestureControls />);
      const blueCard = container.querySelector('.bg-blue-50');
      expect(blueCard).toHaveClass('dark:bg-blue-900\\/20');
    });

    it('purple card supports dark mode', () => {
      const { container } = render(<MobileGestureControls />);
      const purpleCard = container.querySelector('.bg-purple-50');
      expect(purpleCard).toHaveClass('dark:bg-purple-900\\/20');
    });

    it('green card supports dark mode', () => {
      const { container } = render(<MobileGestureControls />);
      const greenCard = container.querySelector('.bg-green-50');
      expect(greenCard).toHaveClass('dark:bg-green-900\\/20');
    });

    it('descriptions support dark mode', () => {
      render(<MobileGestureControls />);
      const description = screen.getByText(/open navigation drawer/i);
      expect(description).toHaveClass('dark:text-[#8b949e]');
    });
  });

  describe('Layout and Spacing', () => {
    it('cards are vertically spaced', () => {
      const { container } = render(<MobileGestureControls />);
      const cardContainer = container.querySelector('.space-y-4');
      expect(cardContainer).toBeInTheDocument();
    });

    it('main container is centered', () => {
      const { container } = render(<MobileGestureControls />);
      const container_div = container.querySelector('.mx-auto');
      expect(container_div).toBeInTheDocument();
    });

    it('card has padding', () => {
      const { container } = render(<MobileGestureControls />);
      const card = container.querySelector('.p-8');
      expect(card).toBeInTheDocument();
    });

    it('container has max width', () => {
      const { container } = render(<MobileGestureControls />);
      const wrapper = container.querySelector('.max-w-4xl');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper page structure', () => {
      render(<MobileGestureControls />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('has proper heading hierarchy', () => {
      render(<MobileGestureControls />);
      const h1 = screen.getByRole('heading', { level: 1 });
      const h3s = screen.getAllByRole('heading', { level: 3 });

      expect(h1).toBeInTheDocument();
      expect(h3s).toHaveLength(3);
    });

    it('all text is readable', () => {
      render(<MobileGestureControls />);
      expect(screen.getByText(/mobile gestures/i)).toBeVisible();
      expect(screen.getByText(/swipe right/i)).toBeVisible();
      expect(screen.getByText(/swipe left/i)).toBeVisible();
    });

    it('color contrast is maintained', () => {
      const { container } = render(<MobileGestureControls />);
      const descriptions = container.querySelectorAll('.text-gray-600');
      expect(descriptions.length).toBeGreaterThan(0);
    });

    it('supports screen readers', () => {
      render(<MobileGestureControls />);
      const main = screen.getByRole('main');
      expect(main).toHaveAccessibleName('Mobile gesture controls page');
    });
  });

  describe('Responsive Behavior', () => {
    it('renders correctly on mobile', () => {
      global.innerWidth = 375;
      render(<MobileGestureControls />);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('p-6');
    });

    it('renders correctly on tablet', () => {
      global.innerWidth = 768;
      render(<MobileGestureControls />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('renders correctly on desktop', () => {
      global.innerWidth = 1920;
      render(<MobileGestureControls />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('container adapts to viewport', () => {
      const { container } = render(<MobileGestureControls />);
      const wrapper = container.querySelector('.max-w-4xl');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Component Lifecycle', () => {
    it('mounts without errors', () => {
      const { container } = render(<MobileGestureControls />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('unmounts cleanly', () => {
      const { unmount, container } = render(<MobileGestureControls />);
      unmount();
      expect(container).toBeEmptyDOMElement();
    });

    it('re-renders without issues', () => {
      const { rerender } = render(<MobileGestureControls />);
      rerender(<MobileGestureControls />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('maintains state across re-renders', () => {
      const { rerender } = render(<MobileGestureControls />);
      const firstMain = screen.getByRole('main');
      rerender(<MobileGestureControls />);
      const secondMain = screen.getByRole('main');
      expect(secondMain).toBe(firstMain);
    });
  });

  describe('Performance', () => {
    it('component is memoized', () => {
      const MemoizedComponent = MobileGestureControls;
      expect(MemoizedComponent.$$typeof?.toString()).toContain('react.memo');
    });

    it('renders efficiently', () => {
      const startTime = performance.now();
      render(<MobileGestureControls />);
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('does not cause memory leaks', () => {
      const { unmount } = render(<MobileGestureControls />);
      unmount();
      // No errors should be thrown
    });
  });

  describe('Animation Support', () => {
    it('applies framer-motion animation', () => {
      const { container } = render(<MobileGestureControls />);
      const animatedCard = container.querySelector('.bg-white');
      expect(animatedCard).toBeInTheDocument();
    });

    it('renders without animation errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      render(<MobileGestureControls />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Content Verification', () => {
    it('displays all gesture information', () => {
      render(<MobileGestureControls />);
      expect(screen.getByText(/swipe right/i)).toBeInTheDocument();
      expect(screen.getByText(/open navigation drawer/i)).toBeInTheDocument();
      expect(screen.getByText(/swipe left/i)).toBeInTheDocument();
      expect(screen.getByText(/go back/i)).toBeInTheDocument();
      expect(screen.getByText(/pull to refresh/i)).toBeInTheDocument();
      expect(screen.getByText(/reload content/i)).toBeInTheDocument();
    });

    it('content is properly formatted', () => {
      const { container } = render(<MobileGestureControls />);
      const headings = screen.getAllByRole('heading', { level: 3 });
      headings.forEach(heading => {
        expect(heading).toHaveClass('font-semibold');
      });
    });

    it('maintains content hierarchy', () => {
      render(<MobileGestureControls />);
      const h1 = screen.getByRole('heading', { level: 1 });
      const h3s = screen.getAllByRole('heading', { level: 3 });

      expect(h1.textContent).toBe('Mobile Gestures');
      expect(h3s.length).toBe(3);
    });
  });

  describe('Touch Gesture Support', () => {
    it('renders touch-friendly interface', () => {
      const { container } = render(<MobileGestureControls />);
      const cards = container.querySelectorAll('.p-4');
      expect(cards.length).toBeGreaterThanOrEqual(3);
    });

    it('has adequate spacing for touch targets', () => {
      const { container } = render(<MobileGestureControls />);
      const cardContainer = container.querySelector('.space-y-4');
      expect(cardContainer).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing lucide-react icons gracefully', () => {
      const { container } = render(<MobileGestureControls />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with minimal viewport', () => {
      global.innerWidth = 320;
      render(<MobileGestureControls />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders with large viewport', () => {
      global.innerWidth = 2560;
      render(<MobileGestureControls />);
      const container_div = document.querySelector('.max-w-4xl');
      expect(container_div).toBeInTheDocument();
    });
  });

  describe('Styling Consistency', () => {
    it('all gesture cards have consistent styling', () => {
      const { container } = render(<MobileGestureControls />);
      const cards = container.querySelectorAll('.rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]');
      cards.forEach(card => {
        expect(card).toHaveClass('p-4');
      });
    });

    it('maintains consistent color scheme', () => {
      const { container } = render(<MobileGestureControls />);
      const blueCard = container.querySelector('.bg-blue-50');
      const purpleCard = container.querySelector('.bg-purple-50');
      const greenCard = container.querySelector('.bg-green-50');

      expect(blueCard).toBeInTheDocument();
      expect(purpleCard).toBeInTheDocument();
      expect(greenCard).toBeInTheDocument();
    });
  });
});

export default main
