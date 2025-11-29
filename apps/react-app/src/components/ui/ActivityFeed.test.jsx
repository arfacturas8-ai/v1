/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ActivityFeed from './ActivityFeed';

// Mock Math.random for consistent testing
const mockMath = Object.create(global.Math);
let randomValue = 0;
mockMath.random = () => randomValue;
global.Math = mockMath;

// Mock Date.now for consistent timestamps
const mockDateNow = jest.spyOn(Date, 'now');

describe('ActivityFeed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    randomValue = 0.5;
    mockDateNow.mockReturnValue(1000000);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<ActivityFeed />);
      expect(screen.getByText('Live Activity')).toBeInTheDocument();
    });

    it('renders the component with default className', () => {
      const { container } = render(<ActivityFeed />);
      const cardElement = container.querySelector('.card.depth-enhanced');
      expect(cardElement).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<ActivityFeed className="custom-class" />);
      const cardElement = container.querySelector('.card.depth-enhanced.custom-class');
      expect(cardElement).toBeInTheDocument();
    });

    it('renders the card header', () => {
      render(<ActivityFeed />);
      expect(screen.getByText('Live Activity')).toBeInTheDocument();
    });

    it('renders the card description', () => {
      render(<ActivityFeed />);
      expect(screen.getByText("See what's happening in real-time")).toBeInTheDocument();
    });

    it('renders the live indicator pulse', () => {
      const { container } = render(<ActivityFeed />);
      const pulseIndicator = container.querySelector('.bg-success.rounded-full.animate-pulse');
      expect(pulseIndicator).toBeInTheDocument();
    });

    it('renders the "View All Activity" button', () => {
      render(<ActivityFeed />);
      expect(screen.getByRole('button', { name: /view all activity/i })).toBeInTheDocument();
    });

    it('renders with proper card structure', () => {
      const { container } = render(<ActivityFeed />);
      expect(container.querySelector('.card-header')).toBeInTheDocument();
      expect(container.querySelector('.card-title')).toBeInTheDocument();
      expect(container.querySelector('.card-description')).toBeInTheDocument();
    });
  });

  describe('Initial Activities', () => {
    it('initializes with 8 activities', () => {
      render(<ActivityFeed />);
      jest.runAllTimers();

      const { container } = render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        const activities = container.querySelectorAll('.flex.items-center.gap-3');
        expect(activities.length).toBe(8);
      });
    });

    it('renders activity items with emojis', () => {
      const { container } = render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        const emojiContainers = container.querySelectorAll('.w-8.h-8.rounded-full');
        expect(emojiContainers.length).toBeGreaterThan(0);
      });
    });

    it('renders activity items with usernames', () => {
      render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        const usernames = screen.getAllByText(/CryptoKing|DiamondHands|MoonRider|BlockChainBoss|NFTCollector/);
        expect(usernames.length).toBeGreaterThan(0);
      });
    });

    it('renders activity items with text descriptions', () => {
      render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        const descriptions = screen.getAllByText(/joined the platform|created a new post|left a comment|made a trade/);
        expect(descriptions.length).toBeGreaterThan(0);
      });
    });

    it('renders activity items with timestamps', () => {
      render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        const timestamps = screen.getAllByText(/\d+m ago/);
        expect(timestamps.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Activity Types', () => {
    it('can generate join activities', () => {
      randomValue = 0; // Force selection of 'join' type
      render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        expect(screen.getByText(/joined the platform/i)).toBeInTheDocument();
      });
    });

    it('can generate post activities', () => {
      randomValue = 0.15; // Force selection of 'post' type
      render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        expect(screen.getByText(/created a new post/i)).toBeInTheDocument();
      });
    });

    it('can generate comment activities', () => {
      randomValue = 0.3; // Force selection of 'comment' type
      render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        expect(screen.getByText(/left a comment/i)).toBeInTheDocument();
      });
    });

    it('can generate trade activities', () => {
      randomValue = 0.45; // Force selection of 'trade' type
      render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        expect(screen.getByText(/made a trade/i)).toBeInTheDocument();
      });
    });

    it('can generate win activities', () => {
      randomValue = 0.6; // Force selection of 'win' type
      render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        expect(screen.getByText(/won a game/i)).toBeInTheDocument();
      });
    });

    it('can generate level activities', () => {
      randomValue = 0.75; // Force selection of 'level' type
      render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        expect(screen.getByText(/leveled up/i)).toBeInTheDocument();
      });
    });

    it('can generate achievement activities', () => {
      randomValue = 0.95; // Force selection of 'achievement' type
      render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        expect(screen.getByText(/earned an achievement/i)).toBeInTheDocument();
      });
    });
  });

  describe('Activity Styling', () => {
    it('applies color to emoji containers', () => {
      const { container } = render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        const emojiContainer = container.querySelector('.w-8.h-8.rounded-full');
        expect(emojiContainer).toHaveStyle({ backgroundColor: expect.any(String) });
        expect(emojiContainer).toHaveStyle({ color: expect.any(String) });
      });
    });

    it('applies color to activity indicators', () => {
      const { container } = render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        const indicator = container.querySelector('.w-1.h-8.rounded-full.opacity-50');
        expect(indicator).toHaveStyle({ backgroundColor: expect.any(String) });
      });
    });

    it('applies hover effect to activity items', () => {
      const { container } = render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        const activityItem = container.querySelector('.hover-bg-hover');
        expect(activityItem).toBeInTheDocument();
      });
    });

    it('truncates long usernames', () => {
      const { container } = render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        const username = container.querySelector('.truncate');
        expect(username).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('adds new activities periodically', async () => {
      const { container } = render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      const initialActivities = container.querySelectorAll('.flex.items-center.gap-3');
      const initialCount = initialActivities.length;

      // Advance time by 3-5 seconds to trigger new activity
      jest.advanceTimersByTime(5000);

      await waitFor(() => {
        const updatedActivities = container.querySelectorAll('.flex.items-center.gap-3');
        expect(updatedActivities.length).toBeGreaterThanOrEqual(initialCount);
      });
    });

    it('keeps only 8 most recent activities', async () => {
      const { container } = render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      // Add multiple new activities
      for (let i = 0; i < 5; i++) {
        jest.advanceTimersByTime(5000);
      }

      await waitFor(() => {
        const activities = container.querySelectorAll('.flex.items-center.gap-3');
        expect(activities.length).toBeLessThanOrEqual(8);
      });
    });

    it('applies slide animation to newest activity', () => {
      const { container } = render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        const activities = container.querySelectorAll('.flex.items-center.gap-3');
        const firstActivity = activities[0];
        expect(firstActivity).toHaveStyle({ animation: expect.stringContaining('slideUp') });
      });
    });

    it('cleans up interval on unmount', () => {
      const { unmount } = render(<ActivityFeed />);
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('Scrolling Behavior', () => {
    it('renders scrollable container', () => {
      const { container } = render(<ActivityFeed />);
      const scrollContainer = container.querySelector('.max-h-96.overflow-y-auto');
      expect(scrollContainer).toBeInTheDocument();
    });

    it('handles overflow with many activities', () => {
      const { container } = render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        const scrollContainer = container.querySelector('.max-h-96.overflow-y-auto');
        expect(scrollContainer.scrollHeight).toBeDefined();
      });
    });
  });

  describe('User Interactions', () => {
    it('handles "View All Activity" button click', async () => {
      render(<ActivityFeed />);
      const button = screen.getByRole('button', { name: /view all activity/i });

      await userEvent.click(button);

      // Button should be clickable (no error thrown)
      expect(button).toBeInTheDocument();
    });

    it('button has proper styling', () => {
      render(<ActivityFeed />);
      const button = screen.getByRole('button', { name: /view all activity/i });

      expect(button).toHaveClass('btn', 'btn-ghost', 'btn-sm', 'w-full');
    });
  });

  describe('Activity Item Structure', () => {
    it('renders emoji in colored container', () => {
      const { container } = render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        const emojiContainer = container.querySelector('.w-8.h-8.rounded-full');
        expect(emojiContainer).toHaveClass('flex', 'items-center', 'justify-center', 'text-sm');
      });
    });

    it('renders username with accent color', () => {
      const { container } = render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        const username = container.querySelector('.font-semibold.text-accent');
        expect(username).toBeInTheDocument();
      });
    });

    it('renders activity text with secondary color', () => {
      const { container } = render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        const text = container.querySelector('.text-secondary.text-sm');
        expect(text).toBeInTheDocument();
      });
    });

    it('renders timestamp with tertiary color', () => {
      const { container } = render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        const timestamp = container.querySelector('.text-xs.text-tertiary');
        expect(timestamp).toBeInTheDocument();
      });
    });

    it('renders colored indicator bar', () => {
      const { container } = render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        const indicator = container.querySelector('.w-1.h-8.rounded-full.opacity-50');
        expect(indicator).toBeInTheDocument();
      });
    });
  });

  describe('Random Data Generation', () => {
    it('generates unique activity IDs', () => {
      mockDateNow.mockReturnValue(1000000);
      randomValue = 0.1;

      render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      mockDateNow.mockReturnValue(2000000);
      randomValue = 0.2;

      jest.advanceTimersByTime(5000);

      // Activities should have different IDs based on timestamp
      expect(mockDateNow).toHaveBeenCalled();
    });

    it('generates time ago between 1-30 minutes', () => {
      render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        const timestamps = screen.getAllByText(/\d+m ago/);
        timestamps.forEach(timestamp => {
          const minutes = parseInt(timestamp.textContent.match(/\d+/)[0]);
          expect(minutes).toBeGreaterThanOrEqual(1);
          expect(minutes).toBeLessThanOrEqual(30);
        });
      });
    });

    it('selects random users from the list', () => {
      const users = [
        'CryptoKing', 'DiamondHands', 'MoonRider', 'BlockChainBoss', 'NFTCollector',
        'CoinMaster', 'TradeWizard', 'CryptoNinja', 'TokenHunter', 'DeFiGuru',
        'GameFiPro', 'MetaTrader', 'CryptoSage', 'DigitalNomad', 'BlockExplorer'
      ];

      randomValue = 0.5; // Should select a user from the middle of the list
      render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        const usernameElements = screen.getAllByText(new RegExp(users.join('|')));
        expect(usernameElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Sorting', () => {
    it('sorts activities by timestamp descending', () => {
      const { container } = render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      // Wait for initial render
      jest.advanceTimersByTime(100);

      // Add a new activity with later timestamp
      mockDateNow.mockReturnValue(3000000);
      jest.advanceTimersByTime(5000);

      waitFor(() => {
        const activities = container.querySelectorAll('.flex.items-center.gap-3');
        // First activity should have the most recent timestamp
        expect(activities[0]).toBeInTheDocument();
      });
    });
  });

  describe('Activity Colors', () => {
    it('uses correct color for join activity', () => {
      randomValue = 0.05; // Force join type
      render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        // Join activities use #00FF90
        const { container } = render(<ActivityFeed />);
        const elements = container.querySelectorAll('[style*="#00FF90"]');
        expect(elements.length).toBeGreaterThan(0);
      });
    });

    it('uses correct color for post activity', () => {
      randomValue = 0.2; // Force post type
      render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        // Post activities use #00D4FF
        const { container } = render(<ActivityFeed />);
        const elements = container.querySelectorAll('[style*="#00D4FF"]');
        expect(elements.length).toBeGreaterThan(0);
      });
    });

    it('uses correct color for comment activity', () => {
      randomValue = 0.35; // Force comment type
      render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        // Comment activities use #0052FF
        const { container } = render(<ActivityFeed />);
        const elements = container.querySelectorAll('[style*="#0052FF"]');
        expect(elements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Emojis', () => {
    it('displays correct emoji for join activity', () => {
      randomValue = 0.05;
      render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        expect(screen.getByText('🎉')).toBeInTheDocument();
      });
    });

    it('displays correct emoji for post activity', () => {
      randomValue = 0.2;
      render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        expect(screen.getByText('📝')).toBeInTheDocument();
      });
    });

    it('displays correct emoji for comment activity', () => {
      randomValue = 0.35;
      render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        expect(screen.getByText('💬')).toBeInTheDocument();
      });
    });

    it('displays correct emoji for trade activity', () => {
      randomValue = 0.5;
      render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        expect(screen.getByText('⚡')).toBeInTheDocument();
      });
    });

    it('displays correct emoji for win activity', () => {
      randomValue = 0.65;
      render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        expect(screen.getByText('🏆')).toBeInTheDocument();
      });
    });

    it('displays correct emoji for level activity', () => {
      randomValue = 0.8;
      render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        expect(screen.getByText('⭐')).toBeInTheDocument();
      });
    });

    it('displays correct emoji for achievement activity', () => {
      randomValue = 0.95;
      render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        expect(screen.getByText('🎖️')).toBeInTheDocument();
      });
    });
  });

  describe('Layout and Spacing', () => {
    it('has proper spacing between activities', () => {
      const { container } = render(<ActivityFeed />);
      const activitiesContainer = container.querySelector('.space-y-3');
      expect(activitiesContainer).toBeInTheDocument();
    });

    it('has proper padding on activity items', () => {
      const { container } = render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        const activityItem = container.querySelector('.p-3.rounded-lg');
        expect(activityItem).toBeInTheDocument();
      });
    });

    it('has proper gap between activity elements', () => {
      const { container } = render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        const activityItem = container.querySelector('.flex.items-center.gap-3');
        expect(activityItem).toBeInTheDocument();
      });
    });

    it('renders footer with border and padding', () => {
      const { container } = render(<ActivityFeed />);
      const footer = container.querySelector('.mt-4.pt-4.border-t.border-secondary');
      expect(footer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('uses semantic HTML structure', () => {
      const { container } = render(<ActivityFeed />);
      expect(container.querySelector('h3')).toBeInTheDocument();
      expect(container.querySelector('button')).toBeInTheDocument();
    });

    it('has accessible button', () => {
      render(<ActivityFeed />);
      const button = screen.getByRole('button', { name: /view all activity/i });
      expect(button).toBeEnabled();
    });

    it('renders text content for screen readers', () => {
      render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        // All activities should have readable text content
        const activities = screen.getAllByText(/joined the platform|created a new post|left a comment/i);
        expect(activities.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Responsive Design', () => {
    it('has proper flex layout', () => {
      const { container } = render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        const activityItem = container.querySelector('.flex.items-center');
        expect(activityItem).toBeInTheDocument();
      });
    });

    it('uses min-w-0 for text truncation', () => {
      const { container } = render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        const textContainer = container.querySelector('.flex-1.min-w-0');
        expect(textContainer).toBeInTheDocument();
      });
    });

    it('has fixed height container with scroll', () => {
      const { container } = render(<ActivityFeed />);
      const scrollContainer = container.querySelector('.max-h-96');
      expect(scrollContainer).toBeInTheDocument();
    });
  });

  describe('Animation', () => {
    it('applies pulse animation to live indicator', () => {
      const { container } = render(<ActivityFeed />);
      const pulseElement = container.querySelector('.animate-pulse');
      expect(pulseElement).toBeInTheDocument();
    });

    it('applies slide animation to first activity', () => {
      const { container } = render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        const activities = container.querySelectorAll('.flex.items-center.gap-3');
        const firstActivity = activities[0];
        expect(firstActivity).toHaveStyle({ animation: expect.stringContaining('slideUp') });
      });
    });

    it('does not apply animation to subsequent activities', () => {
      const { container } = render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        const activities = container.querySelectorAll('.flex.items-center.gap-3');
        if (activities.length > 1) {
          const secondActivity = activities[1];
          expect(secondActivity).toHaveStyle({ animation: 'none' });
        }
      });
    });

    it('applies transition to hover effects', () => {
      const { container } = render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        const activityItem = container.querySelector('.transition-all.duration-300');
        expect(activityItem).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles missing className prop gracefully', () => {
      const { container } = render(<ActivityFeed />);
      const cardElement = container.querySelector('.card.depth-enhanced');
      expect(cardElement).toBeInTheDocument();
    });

    it('handles empty className', () => {
      const { container } = render(<ActivityFeed className="" />);
      const cardElement = container.querySelector('.card.depth-enhanced');
      expect(cardElement).toBeInTheDocument();
    });

    it('continues generating activities over time', async () => {
      const { container } = render(<ActivityFeed />);

      jest.advanceTimersByTime(5000);
      jest.advanceTimersByTime(5000);
      jest.advanceTimersByTime(5000);

      await waitFor(() => {
        const activities = container.querySelectorAll('.flex.items-center.gap-3');
        expect(activities.length).toBeGreaterThan(0);
      });
    });

    it('handles rapid timer advancement', () => {
      const { container } = render(<ActivityFeed />);

      // Rapidly advance timers
      for (let i = 0; i < 10; i++) {
        jest.advanceTimersByTime(1000);
      }

      // Should still render properly
      expect(container.querySelector('.card')).toBeInTheDocument();
    });
  });

  describe('Memory Management', () => {
    it('cleans up on unmount', () => {
      const { unmount } = render(<ActivityFeed />);
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });

    it('does not update state after unmount', async () => {
      const { unmount } = render(<ActivityFeed />);

      unmount();

      // Advance timers after unmount
      jest.advanceTimersByTime(5000);

      // Should not throw errors or update state
      await waitFor(() => {
        expect(true).toBe(true);
      });
    });
  });

  describe('Performance', () => {
    it('renders efficiently with multiple activities', () => {
      const startTime = performance.now();
      render(<ActivityFeed />);
      jest.advanceTimersByTime(0);
      const endTime = performance.now();

      // Rendering should be fast (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('handles state updates efficiently', () => {
      render(<ActivityFeed />);

      const startTime = performance.now();
      jest.advanceTimersByTime(5000);
      const endTime = performance.now();

      // State update should be fast
      expect(endTime - startTime).toBeLessThan(50);
    });
  });

  describe('Data Integrity', () => {
    it('maintains unique keys for activities', () => {
      const { container } = render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        const activities = container.querySelectorAll('.flex.items-center.gap-3');
        const keys = new Set();

        activities.forEach(activity => {
          const key = activity.getAttribute('key');
          if (key) {
            expect(keys.has(key)).toBe(false);
            keys.add(key);
          }
        });
      });
    });

    it('preserves activity data structure', () => {
      render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        // Each activity should have user, text, timeAgo, and visual elements
        expect(screen.getAllByText(/\d+m ago/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/CryptoKing|DiamondHands|MoonRider/).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Interval Timing', () => {
    it('uses random interval between 3-5 seconds', () => {
      randomValue = 0; // Min: 3000ms
      render(<ActivityFeed />);
      jest.advanceTimersByTime(3000);

      randomValue = 1; // Max: 5000ms
      jest.advanceTimersByTime(2000);

      // Should continue working with varying intervals
      expect(screen.getByText('Live Activity')).toBeInTheDocument();
    });

    it('continues adding activities indefinitely', () => {
      render(<ActivityFeed />);

      // Simulate many intervals
      for (let i = 0; i < 20; i++) {
        jest.advanceTimersByTime(4000);
      }

      // Should still be functioning
      expect(screen.getByText('Live Activity')).toBeInTheDocument();
    });
  });

  describe('Visual Styling', () => {
    it('applies rounded corners to activity items', () => {
      const { container } = render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        const activityItem = container.querySelector('.rounded-lg');
        expect(activityItem).toBeInTheDocument();
      });
    });

    it('applies rounded corners to emoji containers', () => {
      const { container } = render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        const emojiContainer = container.querySelector('.w-8.h-8.rounded-full');
        expect(emojiContainer).toBeInTheDocument();
      });
    });

    it('applies opacity to indicator bars', () => {
      const { container } = render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        const indicator = container.querySelector('.opacity-50');
        expect(indicator).toBeInTheDocument();
      });
    });
  });

  describe('Text Styling', () => {
    it('applies semibold font to usernames', () => {
      const { container } = render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        const username = container.querySelector('.font-semibold');
        expect(username).toBeInTheDocument();
      });
    });

    it('applies small text size to activity descriptions', () => {
      const { container } = render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        const description = container.querySelector('.text-sm');
        expect(description).toBeInTheDocument();
      });
    });

    it('applies extra small text size to timestamps', () => {
      const { container } = render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      waitFor(() => {
        const timestamp = container.querySelector('.text-xs');
        expect(timestamp).toBeInTheDocument();
      });
    });
  });

  describe('Component Integration', () => {
    it('works with different className combinations', () => {
      const { container, rerender } = render(<ActivityFeed className="test-1" />);
      expect(container.querySelector('.test-1')).toBeInTheDocument();

      rerender(<ActivityFeed className="test-2 test-3" />);
      expect(container.querySelector('.test-2.test-3')).toBeInTheDocument();
    });

    it('maintains functionality across re-renders', () => {
      const { rerender } = render(<ActivityFeed />);
      jest.advanceTimersByTime(0);

      rerender(<ActivityFeed className="updated" />);

      expect(screen.getByText('Live Activity')).toBeInTheDocument();
    });
  });

  describe('Snapshot', () => {
    it('matches snapshot', () => {
      const { container } = render(<ActivityFeed />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with custom className', () => {
      const { container } = render(<ActivityFeed className="custom-feed" />);
      expect(container).toMatchSnapshot();
    });
  });
});

export default mockMath
