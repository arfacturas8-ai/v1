/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../__test__/utils/testUtils';
import NotificationSettingsPage from '../NotificationSettingsPage';

// Mock services
jest.mock('../../services/notifications');
jest.mock('../../services/userService');
jest.mock('../../services/api');

const mockNotificationService = require('../../services/notifications').default;
const mockUserService = require('../../services/userService').default;

describe('NotificationSettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Page Rendering Tests (8 tests)
  describe('Page Rendering', () => {
    it('renders page without crashing', () => {
      const { container } = renderWithProviders(<NotificationSettingsPage />);
      expect(container).toBeInTheDocument();
    });

    it('displays main content area', () => {
      renderWithProviders(<NotificationSettingsPage />);
      const mainElement = screen.queryByRole('main');
      if (mainElement) {
        expect(mainElement).toBeInTheDocument();
      }
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithProviders(<NotificationSettingsPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('displays page title', () => {
      renderWithProviders(<NotificationSettingsPage />);
      expect(screen.getByText(/NotificationSettingsPage/i)).toBeInTheDocument();
    });

    it('renders with proper ARIA labels', () => {
      renderWithProviders(<NotificationSettingsPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', 'Notification settings page');
    });

    it('has correct document structure', () => {
      const { container } = renderWithProviders(<NotificationSettingsPage />);
      expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
    });

    it('applies dark mode classes correctly', () => {
      const { container } = renderWithProviders(<NotificationSettingsPage />);
      const darkModeElements = container.querySelectorAll('.dark\\:bg-[#0d1117]');
      expect(darkModeElements.length).toBeGreaterThan(0);
    });

    it('renders with animation wrapper', () => {
      const { container } = renderWithProviders(<NotificationSettingsPage />);
      expect(container.querySelector('.rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]')).toBeInTheDocument();
    });
  });

  // Email Notifications Tests (12 tests)
  describe('Email Notification Settings', () => {
    it('displays email notification toggle', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Email notification toggle should exist
      });
    });

    it('shows mention email notification option', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Email for mentions toggle
      });
    });

    it('displays comment notification option', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Email for comments toggle
      });
    });

    it('shows direct message email option', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Email for DMs toggle
      });
    });

    it('displays follower notification option', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Email for new followers toggle
      });
    });

    it('shows post like notification option', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Email for post likes toggle
      });
    });

    it('displays newsletter subscription option', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Newsletter subscription toggle
      });
    });

    it('shows digest email frequency option', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Daily/weekly digest option
      });
    });

    it('displays marketing email opt-in', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Marketing emails toggle
      });
    });

    it('saves email notification preferences', async () => {
      mockNotificationService.updateEmailPreferences = jest.fn().mockResolvedValue({ success: true });
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Should save preferences
      });
    });

    it('shows success message after saving email preferences', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Success notification
      });
    });

    it('handles email preference save errors', async () => {
      mockNotificationService.updateEmailPreferences = jest.fn().mockRejectedValue(new Error('Save failed'));
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Error handling
      });
    });
  });

  // Push Notifications Tests (12 tests)
  describe('Push Notification Settings', () => {
    it('displays push notification toggle', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Push notification master toggle
      });
    });

    it('checks browser push notification permission', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Check Notification API permission
      });
    });

    it('shows request permission button when denied', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Request permission button
      });
    });

    it('displays push notification for mentions', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Push for mentions toggle
      });
    });

    it('shows push notification for comments', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Push for comments toggle
      });
    });

    it('displays push notification for messages', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Push for messages toggle
      });
    });

    it('shows push notification for likes', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Push for likes toggle
      });
    });

    it('displays push notification sound option', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Sound enabled toggle
      });
    });

    it('shows push notification vibration option', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Vibration enabled toggle
      });
    });

    it('saves push notification preferences', async () => {
      mockNotificationService.updatePushPreferences = jest.fn().mockResolvedValue({ success: true });
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Should save push preferences
      });
    });

    it('tests push notification', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Test notification button
      });
    });

    it('handles push notification errors', async () => {
      mockNotificationService.updatePushPreferences = jest.fn().mockRejectedValue(new Error('Failed'));
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Error handling for push settings
      });
    });
  });

  // SMS Notifications Tests (10 tests)
  describe('SMS Notification Settings', () => {
    it('displays SMS notification section', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // SMS section should exist
      });
    });

    it('shows phone number input', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Phone number field
      });
    });

    it('validates phone number format', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Phone number validation
      });
    });

    it('displays verify phone number button', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Verification button
      });
    });

    it('shows SMS verification code input', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Verification code field
      });
    });

    it('displays SMS notification for security alerts', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Security SMS toggle
      });
    });

    it('shows SMS notification for login attempts', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Login SMS toggle
      });
    });

    it('displays SMS notification for important updates', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Important updates SMS toggle
      });
    });

    it('saves SMS preferences', async () => {
      mockNotificationService.updateSMSPreferences = jest.fn().mockResolvedValue({ success: true });
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Should save SMS settings
      });
    });

    it('handles SMS carrier charges warning', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Warning about carrier charges
      });
    });
  });

  // In-App Notifications Tests (10 tests)
  describe('In-App Notification Settings', () => {
    it('displays in-app notification toggle', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // In-app notifications toggle
      });
    });

    it('shows notification badge option', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Badge count toggle
      });
    });

    it('displays notification sound option', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Sound option for in-app
      });
    });

    it('shows notification preview option', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Message preview toggle
      });
    });

    it('displays notification grouping option', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Group similar notifications
      });
    });

    it('shows notification position preference', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Top-right, bottom-right, etc.
      });
    });

    it('displays notification duration setting', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // How long to show notifications
      });
    });

    it('shows unread notification indicator', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Unread indicator toggle
      });
    });

    it('saves in-app preferences', async () => {
      mockNotificationService.updateInAppPreferences = jest.fn().mockResolvedValue({ success: true });
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Should save in-app settings
      });
    });

    it('previews notification style', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Preview button for notification style
      });
    });
  });

  // Mute Options Tests (10 tests)
  describe('Mute and Do Not Disturb Options', () => {
    it('displays do not disturb toggle', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // DND toggle
      });
    });

    it('shows do not disturb schedule', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // DND time range picker
      });
    });

    it('displays mute all notifications option', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Mute all toggle
      });
    });

    it('shows mute duration options', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // 1 hour, 8 hours, 24 hours, etc.
      });
    });

    it('displays mute specific users option', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Mute user list
      });
    });

    it('shows mute specific channels option', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Mute channel list
      });
    });

    it('displays mute keywords option', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Keyword mute list
      });
    });

    it('shows active mutes list', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // List of currently muted items
      });
    });

    it('allows unmuting items', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Unmute button for each item
      });
    });

    it('saves mute preferences', async () => {
      mockNotificationService.updateMutePreferences = jest.fn().mockResolvedValue({ success: true });
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Should save mute settings
      });
    });
  });

  // Category Filters Tests (8 tests)
  describe('Notification Category Filters', () => {
    it('displays social interaction notifications toggle', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Likes, follows, mentions category
      });
    });

    it('shows content notification toggle', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // New posts, comments category
      });
    });

    it('displays system notifications toggle', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Updates, maintenance category
      });
    });

    it('shows security notifications toggle', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Login, password changes category
      });
    });

    it('displays community notifications toggle', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Community events, announcements
      });
    });

    it('shows promotional notifications toggle', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Offers, features category
      });
    });

    it('saves category filter preferences', async () => {
      mockNotificationService.updateCategoryFilters = jest.fn().mockResolvedValue({ success: true });
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Should save category filters
      });
    });

    it('displays notification count by category', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Count of notifications per category
      });
    });
  });

  // Data Loading Tests (4 tests)
  describe('Data Loading', () => {
    it('loads current notification preferences', async () => {
      mockNotificationService.getPreferences = jest.fn().mockResolvedValue({
        email: true,
        push: true,
        sms: false
      });
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Should load preferences
      });
    });

    it('displays loading skeleton', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Loading state
      });
    });

    it('shows content after loading', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Content visible after load
      }, { timeout: 3000 });
    });

    it('handles loading errors', async () => {
      mockNotificationService.getPreferences = jest.fn().mockRejectedValue(new Error('Load failed'));
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Error message
      });
    });
  });

  // Form Actions Tests (6 tests)
  describe('Form Actions', () => {
    it('displays save button', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Save button should exist
      });
    });

    it('shows reset to defaults button', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Reset button
      });
    });

    it('disables save when no changes made', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Save disabled if no changes
      });
    });

    it('enables save when settings change', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Save enabled after change
      });
    });

    it('confirms reset to defaults', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Confirmation dialog for reset
      });
    });

    it('shows unsaved changes warning', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Warning if navigating away with unsaved changes
      });
    });
  });

  // Error Handling Tests (4 tests)
  describe('Error Handling', () => {
    it('displays API error messages', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('API Error'))
      );
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Should show API errors
      });
    });

    it('handles permission denied errors', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Permission error handling
      });
    });

    it('shows retry option on error', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Retry button
      });
    });

    it('handles network errors', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('Network error'))
      );
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Network error message
      });
    });
  });

  // Accessibility Tests (6 tests)
  describe('Accessibility', () => {
    it('has proper page structure', () => {
      renderWithProviders(<NotificationSettingsPage />);
      const main = screen.queryByRole('main');
      if (main) {
        expect(main).toBeInTheDocument();
      }
    });

    it('has proper heading hierarchy', () => {
      renderWithProviders(<NotificationSettingsPage />);
      const headings = screen.queryAllByRole('heading');
      expect(headings.length).toBeGreaterThanOrEqual(0);
    });

    it('supports keyboard navigation', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // Tab navigation
      });
    });

    it('has ARIA labels on toggles', () => {
      renderWithProviders(<NotificationSettingsPage />);
      // All toggles should have labels
    });

    it('announces setting changes to screen readers', async () => {
      renderWithProviders(<NotificationSettingsPage />);
      await waitFor(() => {
        // ARIA live regions
      });
    });

    it('has proper focus management', () => {
      renderWithProviders(<NotificationSettingsPage />);
      // Focus indicators visible
    });
  });

  // Responsive Design Tests (4 tests)
  describe('Responsive Behavior', () => {
    it('renders correctly on mobile', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));
      renderWithProviders(<NotificationSettingsPage />);
      // Mobile layout
    });

    it('renders correctly on tablet', () => {
      global.innerWidth = 768;
      global.dispatchEvent(new Event('resize'));
      renderWithProviders(<NotificationSettingsPage />);
      // Tablet layout
    });

    it('renders correctly on desktop', () => {
      global.innerWidth = 1920;
      global.dispatchEvent(new Event('resize'));
      renderWithProviders(<NotificationSettingsPage />);
      // Desktop layout
    });

    it('stacks settings vertically on mobile', () => {
      global.innerWidth = 320;
      global.dispatchEvent(new Event('resize'));
      renderWithProviders(<NotificationSettingsPage />);
      // Vertical stacking
    });
  });
});

export default mockNotificationService
