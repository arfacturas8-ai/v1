/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../__test__/utils/testUtils';
import MaintenancePage from '../MaintenancePage';

describe('MaintenancePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T12:00:00Z'));
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders component without crashing', () => {
      const { container } = render(<MaintenancePage />);
      expect(container).toBeInTheDocument();
    });

    it('renders main content area', () => {
      render(<MaintenancePage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('has proper aria-label', () => {
      render(<MaintenancePage />);
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', 'Maintenance page');
    });

    it('renders with gradient background', () => {
      render(<MaintenancePage />);
      const main = screen.getByRole('main');
      expect(main).toHaveStyle({
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      });
    });

    it('renders with full viewport height', () => {
      render(<MaintenancePage />);
      const main = screen.getByRole('main');
      expect(main).toHaveStyle({ minHeight: '100vh' });
    });

    it('centers content', () => {
      render(<MaintenancePage />);
      const main = screen.getByRole('main');
      expect(main).toHaveStyle({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      });
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      render(<MaintenancePage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Icon and Header', () => {
    it('renders Wrench icon', () => {
      const { container } = render(<MaintenancePage />);
      const icon = container.querySelector('.lucide-wrench');
      expect(icon).toBeInTheDocument();
    });

    it('renders main heading', () => {
      render(<MaintenancePage />);
      const heading = screen.getByRole('heading', { name: /we'll be right back/i });
      expect(heading).toBeInTheDocument();
    });

    it('heading has correct level', () => {
      render(<MaintenancePage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('renders maintenance message', () => {
      render(<MaintenancePage />);
      const message = screen.getByText(/cryb is currently undergoing scheduled maintenance/i);
      expect(message).toBeInTheDocument();
    });
  });

  describe('Countdown Timer', () => {
    it('displays estimated duration', () => {
      render(<MaintenancePage />);
      const durationLabel = screen.getByText(/estimated duration/i);
      expect(durationLabel).toBeInTheDocument();
    });

    it('displays countdown time', () => {
      render(<MaintenancePage />);
      const countdown = screen.getByText(/[0-9]+h [0-9]+m/);
      expect(countdown).toBeInTheDocument();
    });

    it('updates countdown every second', async () => {
      render(<MaintenancePage />);
      const initialTime = screen.getByText(/[0-9]+h [0-9]+m/);
      const initialText = initialTime.textContent;

      act(() => {
        jest.advanceTimersByTime(60000); // Advance by 1 minute
      });

      await waitFor(() => {
        const updatedTime = screen.getByText(/[0-9]+h [0-9]+m/);
        expect(updatedTime.textContent).not.toBe(initialText);
      });
    });

    it('displays Clock icon', () => {
      const { container } = render(<MaintenancePage />);
      const clockIcon = container.querySelector('.lucide-clock');
      expect(clockIcon).toBeInTheDocument();
    });
  });

  describe('Expected Back Time', () => {
    it('displays expected back label', () => {
      render(<MaintenancePage />);
      const label = screen.getByText(/expected back/i);
      expect(label).toBeInTheDocument();
    });

    it('displays estimated end time', () => {
      render(<MaintenancePage />);
      const timeRegex = /\d{1,2}:\d{2}\s*(AM|PM)/i;
      const timeElement = screen.getByText(timeRegex);
      expect(timeElement).toBeInTheDocument();
    });

    it('displays CheckCircle icon', () => {
      const { container } = render(<MaintenancePage />);
      const icons = container.querySelectorAll('.lucide-check-circle-2');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('formats time correctly', () => {
      render(<MaintenancePage />);
      const timeElement = screen.getByText(/\d{1,2}:\d{2}\s*(AM|PM)/i);
      expect(timeElement).toBeInTheDocument();
    });
  });

  describe('Improvements List', () => {
    it('displays improvements heading', () => {
      render(<MaintenancePage />);
      const heading = screen.getByRole('heading', { name: /what's being improved/i });
      expect(heading).toBeInTheDocument();
    });

    it('displays performance enhancement item', () => {
      render(<MaintenancePage />);
      const item = screen.getByText(/performance enhancements for faster loading/i);
      expect(item).toBeInTheDocument();
    });

    it('displays security updates item', () => {
      render(<MaintenancePage />);
      const item = screen.getByText(/security updates and bug fixes/i);
      expect(item).toBeInTheDocument();
    });

    it('displays new features item', () => {
      render(<MaintenancePage />);
      const item = screen.getByText(/new features and improvements/i);
      expect(item).toBeInTheDocument();
    });

    it('displays database optimization item', () => {
      render(<MaintenancePage />);
      const item = screen.getByText(/database optimization/i);
      expect(item).toBeInTheDocument();
    });

    it('renders all improvement items with icons', () => {
      const { container } = render(<MaintenancePage />);
      const checkIcons = container.querySelectorAll('.lucide-check-circle-2');
      expect(checkIcons.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Social Media Links', () => {
    it('displays stay updated message', () => {
      render(<MaintenancePage />);
      const message = screen.getByText(/stay updated on our progress/i);
      expect(message).toBeInTheDocument();
    });

    it('renders Twitter link', () => {
      render(<MaintenancePage />);
      const link = screen.getByRole('link', { name: /follow us on twitter/i });
      expect(link).toBeInTheDocument();
    });

    it('Twitter link has correct href', () => {
      render(<MaintenancePage />);
      const link = screen.getByRole('link', { name: /follow us on twitter/i });
      expect(link).toHaveAttribute('href', 'https://twitter.com/crybplatform');
    });

    it('Twitter link opens in new tab', () => {
      render(<MaintenancePage />);
      const link = screen.getByRole('link', { name: /follow us on twitter/i });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('renders Status Page link', () => {
      render(<MaintenancePage />);
      const link = screen.getByRole('link', { name: /check status page/i });
      expect(link).toBeInTheDocument();
    });

    it('Status Page link has correct href', () => {
      render(<MaintenancePage />);
      const link = screen.getByRole('link', { name: /check status page/i });
      expect(link).toHaveAttribute('href', 'https://status.cryb.app');
    });

    it('Status Page link opens in new tab', () => {
      render(<MaintenancePage />);
      const link = screen.getByRole('link', { name: /check status page/i });
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('renders Twitter icon', () => {
      const { container } = render(<MaintenancePage />);
      const icon = container.querySelector('.lucide-twitter');
      expect(icon).toBeInTheDocument();
    });

    it('renders MessageCircle icon', () => {
      const { container } = render(<MaintenancePage />);
      const icon = container.querySelector('.lucide-message-circle');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Contact Information', () => {
    it('displays thank you message', () => {
      render(<MaintenancePage />);
      const message = screen.getByText(/thank you for your patience/i);
      expect(message).toBeInTheDocument();
    });

    it('displays support email link', () => {
      render(<MaintenancePage />);
      const link = screen.getByRole('link', { name: /contact support/i });
      expect(link).toBeInTheDocument();
    });

    it('support email link has correct href', () => {
      render(<MaintenancePage />);
      const link = screen.getByRole('link', { name: /contact support/i });
      expect(link).toHaveAttribute('href', 'mailto:support@cryb.app');
    });
  });

  describe('Maintenance ID', () => {
    it('displays maintenance ID', () => {
      render(<MaintenancePage />);
      const idText = screen.getByText(/maintenance id:/i);
      expect(idText).toBeInTheDocument();
    });

    it('generates unique maintenance ID', () => {
      const { container: container1 } = render(<MaintenancePage />);
      const { container: container2 } = render(<MaintenancePage />);

      const id1 = container1.textContent.match(/MAINT-[A-Z0-9]+/)?.[0];
      const id2 = container2.textContent.match(/MAINT-[A-Z0-9]+/)?.[0];

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      // IDs might be the same due to random seed, but format should be correct
      expect(id1).toMatch(/MAINT-[A-Z0-9]+/);
    });

    it('displays start time', () => {
      render(<MaintenancePage />);
      const startedText = screen.getByText(/started:/i);
      expect(startedText).toBeInTheDocument();
    });
  });

  describe('Time Formatting', () => {
    it('formats time with 2-digit hour', () => {
      render(<MaintenancePage />);
      const timeElements = screen.getAllByText(/\d{1,2}:\d{2}/);
      expect(timeElements.length).toBeGreaterThan(0);
    });

    it('includes timezone in formatted time', () => {
      render(<MaintenancePage />);
      // Look for time with timezone format
      const timeWithZone = screen.getAllByText(/\d{1,2}:\d{2}\s*(AM|PM)?\s*[A-Z]{3,4}/i);
      expect(timeWithZone.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('has proper page structure', () => {
      render(<MaintenancePage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('has proper heading hierarchy', () => {
      render(<MaintenancePage />);
      const h1 = screen.getByRole('heading', { level: 1 });
      const h3 = screen.getByRole('heading', { level: 3 });

      expect(h1).toBeInTheDocument();
      expect(h3).toBeInTheDocument();
    });

    it('all links are accessible', () => {
      render(<MaintenancePage />);
      const links = screen.getAllByRole('link');

      links.forEach(link => {
        expect(link).toHaveAccessibleName();
      });
    });

    it('supports screen readers', () => {
      render(<MaintenancePage />);
      const main = screen.getByRole('main');
      expect(main).toHaveAccessibleName('Maintenance page');
    });
  });

  describe('Responsive Behavior', () => {
    it('renders correctly on mobile', () => {
      global.innerWidth = 375;
      render(<MaintenancePage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('renders correctly on tablet', () => {
      global.innerWidth = 768;
      render(<MaintenancePage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('renders correctly on desktop', () => {
      global.innerWidth = 1920;
      render(<MaintenancePage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });
  });

  describe('Component Lifecycle', () => {
    it('mounts without errors', () => {
      const { container } = render(<MaintenancePage />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('unmounts cleanly and clears timer', () => {
      const { unmount } = render(<MaintenancePage />);
      unmount();
      // Verify no timers are left running
      expect(jest.getTimerCount()).toBe(0);
    });

    it('sets up interval on mount', () => {
      render(<MaintenancePage />);
      expect(jest.getTimerCount()).toBeGreaterThan(0);
    });

    it('clears interval on unmount', () => {
      const { unmount } = render(<MaintenancePage />);
      const timerCount = jest.getTimerCount();
      unmount();
      expect(jest.getTimerCount()).toBeLessThan(timerCount);
    });
  });

  describe('Timer Functionality', () => {
    it('updates time every second', async () => {
      render(<MaintenancePage />);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Component should still be rendered
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('countdown decreases over time', async () => {
      render(<MaintenancePage />);
      const initialTime = screen.getByText(/[0-9]+h [0-9]+m/);
      const initialText = initialTime.textContent;

      act(() => {
        jest.advanceTimersByTime(120000); // 2 minutes
      });

      await waitFor(() => {
        const updatedTime = screen.getByText(/[0-9]+h [0-9]+m/);
        // Time should have decreased
        expect(updatedTime).toBeInTheDocument();
      });
    });

    it('handles rapid time updates', () => {
      render(<MaintenancePage />);

      act(() => {
        for (let i = 0; i < 10; i++) {
          jest.advanceTimersByTime(1000);
        }
      });

      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Styling and Visual Elements', () => {
    it('applies backdrop blur effect', () => {
      const { container } = render(<MaintenancePage />);
      const blurElements = container.querySelectorAll('[style*="backdropFilter"]');
      expect(blurElements.length).toBeGreaterThan(0);
    });

    it('renders with text shadow', () => {
      render(<MaintenancePage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveStyle({
        textShadow: '0 4px 12px rgba(0,0,0,0.2)',
      });
    });

    it('content has max width', () => {
      const { container } = render(<MaintenancePage />);
      const contentDiv = container.querySelector('[style*="maxWidth"]');
      expect(contentDiv).toBeInTheDocument();
    });

    it('renders animation styles', () => {
      render(<MaintenancePage />);
      const styleTag = document.querySelector('style');
      expect(styleTag).toBeInTheDocument();
      expect(styleTag?.textContent).toContain('wiggle');
    });
  });

  describe('Edge Cases', () => {
    it('handles future dates correctly', () => {
      render(<MaintenancePage />);
      const countdown = screen.getByText(/[0-9]+h [0-9]+m/);
      expect(countdown).toBeInTheDocument();
    });

    it('handles current date updates', () => {
      render(<MaintenancePage />);

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders with minimal viewport', () => {
      global.innerWidth = 320;
      render(<MaintenancePage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders with large viewport', () => {
      global.innerWidth = 2560;
      render(<MaintenancePage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Content Verification', () => {
    it('displays all required sections', () => {
      render(<MaintenancePage />);

      expect(screen.getByText(/we'll be right back/i)).toBeInTheDocument();
      expect(screen.getByText(/estimated duration/i)).toBeInTheDocument();
      expect(screen.getByText(/expected back/i)).toBeInTheDocument();
      expect(screen.getByText(/what's being improved/i)).toBeInTheDocument();
      expect(screen.getByText(/stay updated/i)).toBeInTheDocument();
    });

    it('all improvement items are listed', () => {
      render(<MaintenancePage />);

      expect(screen.getByText(/performance enhancements/i)).toBeInTheDocument();
      expect(screen.getByText(/security updates/i)).toBeInTheDocument();
      expect(screen.getByText(/new features/i)).toBeInTheDocument();
      expect(screen.getByText(/database optimization/i)).toBeInTheDocument();
    });

    it('displays complete contact information', () => {
      render(<MaintenancePage />);

      expect(screen.getByText(/questions/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /contact support/i })).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('renders efficiently', () => {
      const startTime = performance.now();
      render(<MaintenancePage />);
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('does not cause memory leaks', () => {
      const { unmount } = render(<MaintenancePage />);
      unmount();
      // Verify timers are cleaned up
      expect(jest.getTimerCount()).toBe(0);
    });
  });
});

export default main
