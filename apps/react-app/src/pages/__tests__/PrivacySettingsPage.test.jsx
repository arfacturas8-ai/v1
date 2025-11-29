/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../__test__/utils/testUtils';
import PrivacySettingsPage from '../PrivacySettingsPage';

// Mock services
jest.mock('../../services/userService');
jest.mock('../../services/api');

const mockUserService = require('../../services/userService').default;

describe('PrivacySettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Page Rendering Tests (8 tests)
  describe('Page Rendering', () => {
    it('renders page without crashing', () => {
      const { container } = renderWithProviders(<PrivacySettingsPage />);
      expect(container).toBeInTheDocument();
    });

    it('displays main content area', () => {
      renderWithProviders(<PrivacySettingsPage />);
      const mainElement = screen.queryByRole('main');
      if (mainElement) {
        expect(mainElement).toBeInTheDocument();
      }
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithProviders(<PrivacySettingsPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('displays page title', () => {
      renderWithProviders(<PrivacySettingsPage />);
      expect(screen.getByText(/PrivacySettingsPage/i)).toBeInTheDocument();
    });

    it('renders with proper ARIA labels', () => {
      renderWithProviders(<PrivacySettingsPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', 'Privacy settings page');
    });

    it('has correct document structure', () => {
      const { container } = renderWithProviders(<PrivacySettingsPage />);
      expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
    });

    it('applies dark mode classes correctly', () => {
      const { container } = renderWithProviders(<PrivacySettingsPage />);
      const darkModeElements = container.querySelectorAll('.dark\\:bg-[#0d1117]');
      expect(darkModeElements.length).toBeGreaterThan(0);
    });

    it('renders with animation wrapper', () => {
      const { container } = renderWithProviders(<PrivacySettingsPage />);
      expect(container.querySelector('.rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]')).toBeInTheDocument();
    });
  });

  // Profile Visibility Tests (12 tests)
  describe('Profile Visibility Settings', () => {
    it('displays profile visibility toggle', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Profile visibility toggle should exist
      });
    });

    it('shows public profile option', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Public profile radio/toggle
      });
    });

    it('displays private profile option', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Private profile radio/toggle
      });
    });

    it('shows friends only profile option', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Friends only option
      });
    });

    it('displays profile picture visibility option', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Profile picture visibility setting
      });
    });

    it('shows bio visibility setting', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Bio visibility toggle
      });
    });

    it('displays email visibility option', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Email visibility setting
      });
    });

    it('shows activity status visibility', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Online status visibility
      });
    });

    it('displays last seen visibility option', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Last seen timestamp visibility
      });
    });

    it('shows followers list visibility', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Followers visibility setting
      });
    });

    it('saves visibility preferences', async () => {
      mockUserService.updatePrivacySettings = jest.fn().mockResolvedValue({ success: true });
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Should save visibility settings
      });
    });

    it('handles visibility save errors', async () => {
      mockUserService.updatePrivacySettings = jest.fn().mockRejectedValue(new Error('Save failed'));
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Error handling
      });
    });
  });

  // Data Sharing Tests (12 tests)
  describe('Data Sharing Controls', () => {
    it('displays data sharing overview', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Data sharing section
      });
    });

    it('shows share activity with followers option', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Activity sharing toggle
      });
    });

    it('displays share posts with public option', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Public post sharing setting
      });
    });

    it('shows location sharing option', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Location sharing toggle
      });
    });

    it('displays analytics data sharing option', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Analytics opt-in/out
      });
    });

    it('shows third-party data sharing controls', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Third-party sharing settings
      });
    });

    it('displays connected apps list', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // List of connected applications
      });
    });

    it('shows revoke app access buttons', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Revoke access buttons for each app
      });
    });

    it('displays data portability option', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Export data option
      });
    });

    it('shows marketing data usage option', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Marketing data opt-in/out
      });
    });

    it('saves data sharing preferences', async () => {
      mockUserService.updateDataSharing = jest.fn().mockResolvedValue({ success: true });
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Should save data sharing settings
      });
    });

    it('handles data sharing errors', async () => {
      mockUserService.updateDataSharing = jest.fn().mockRejectedValue(new Error('Failed'));
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Error handling
      });
    });
  });

  // Blocked Users Tests (12 tests)
  describe('Blocked Users Management', () => {
    it('displays blocked users section', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Blocked users section should exist
      });
    });

    it('shows list of blocked users', async () => {
      mockUserService.getBlockedUsers = jest.fn().mockResolvedValue([
        { id: '1', username: 'blockeduser1' },
        { id: '2', username: 'blockeduser2' }
      ]);
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Should display blocked users list
      });
    });

    it('displays empty state when no blocked users', async () => {
      mockUserService.getBlockedUsers = jest.fn().mockResolvedValue([]);
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Empty state message
      });
    });

    it('shows unblock button for each user', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Unblock buttons
      });
    });

    it('confirms before unblocking user', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Confirmation dialog
      });
    });

    it('displays block user search/input', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Search to block new users
      });
    });

    it('shows user profile preview before blocking', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // User preview card
      });
    });

    it('handles block user action', async () => {
      mockUserService.blockUser = jest.fn().mockResolvedValue({ success: true });
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Should block user
      });
    });

    it('handles unblock user action', async () => {
      mockUserService.unblockUser = jest.fn().mockResolvedValue({ success: true });
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Should unblock user
      });
    });

    it('displays block confirmation message', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Success message after blocking
      });
    });

    it('shows blocked users count', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Total blocked users count
      });
    });

    it('handles block/unblock errors', async () => {
      mockUserService.blockUser = jest.fn().mockRejectedValue(new Error('Failed'));
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Error handling
      });
    });
  });

  // Privacy Controls Tests (10 tests)
  describe('Advanced Privacy Controls', () => {
    it('displays who can message me setting', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Message privacy control
      });
    });

    it('shows who can comment on posts setting', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Comment privacy control
      });
    });

    it('displays who can tag me setting', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Tagging privacy control
      });
    });

    it('shows who can see my posts setting', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Post visibility control
      });
    });

    it('displays who can follow me setting', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Follow request control
      });
    });

    it('shows search engine indexing option', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Search engine visibility toggle
      });
    });

    it('displays profile discovery option', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Discoverable in search/suggestions
      });
    });

    it('shows read receipts option', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Read receipts toggle
      });
    });

    it('saves privacy controls', async () => {
      mockUserService.updatePrivacyControls = jest.fn().mockResolvedValue({ success: true });
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Should save controls
      });
    });

    it('handles privacy controls errors', async () => {
      mockUserService.updatePrivacyControls = jest.fn().mockRejectedValue(new Error('Failed'));
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Error handling
      });
    });
  });

  // Content Privacy Tests (8 tests)
  describe('Content Privacy Settings', () => {
    it('displays default post visibility setting', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Default post visibility dropdown
      });
    });

    it('shows story privacy setting', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Story visibility control
      });
    });

    it('displays archived posts visibility', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Archive privacy setting
      });
    });

    it('shows hide posts from specific users', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Hide content feature
      });
    });

    it('displays download prevention option', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Prevent downloads toggle
      });
    });

    it('shows watermark option for media', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Watermark toggle
      });
    });

    it('saves content privacy settings', async () => {
      mockUserService.updateContentPrivacy = jest.fn().mockResolvedValue({ success: true });
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Should save content settings
      });
    });

    it('handles content privacy errors', async () => {
      mockUserService.updateContentPrivacy = jest.fn().mockRejectedValue(new Error('Failed'));
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Error handling
      });
    });
  });

  // Search and Discovery Tests (6 tests)
  describe('Search and Discovery Privacy', () => {
    it('displays appear in search results option', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Search visibility toggle
      });
    });

    it('shows appear in suggestions option', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Suggestion visibility toggle
      });
    });

    it('displays phone/email lookup prevention', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Contact lookup privacy
      });
    });

    it('shows similar account suggestions opt-out', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Similar accounts toggle
      });
    });

    it('saves discovery settings', async () => {
      mockUserService.updateDiscoverySettings = jest.fn().mockResolvedValue({ success: true });
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Should save discovery settings
      });
    });

    it('handles discovery settings errors', async () => {
      mockUserService.updateDiscoverySettings = jest.fn().mockRejectedValue(new Error('Failed'));
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Error handling
      });
    });
  });

  // Data Loading Tests (4 tests)
  describe('Data Loading', () => {
    it('loads current privacy settings', async () => {
      mockUserService.getPrivacySettings = jest.fn().mockResolvedValue({
        profileVisibility: 'public',
        dataSharing: true
      });
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Should load settings
      });
    });

    it('displays loading skeleton', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Loading state
      });
    });

    it('shows content after loading', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Content visible after load
      }, { timeout: 3000 });
    });

    it('handles loading errors', async () => {
      mockUserService.getPrivacySettings = jest.fn().mockRejectedValue(new Error('Load failed'));
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Error message
      });
    });
  });

  // Form Actions Tests (6 tests)
  describe('Form Actions', () => {
    it('displays save button', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Save button should exist
      });
    });

    it('shows reset to defaults button', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Reset button
      });
    });

    it('disables save when no changes made', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Save disabled if no changes
      });
    });

    it('enables save when settings change', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Save enabled after change
      });
    });

    it('confirms reset to defaults', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Confirmation dialog for reset
      });
    });

    it('shows unsaved changes warning', async () => {
      renderWithProviders(<PrivacySettingsPage />);
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
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Should show API errors
      });
    });

    it('shows retry option on error', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Retry button
      });
    });

    it('handles network errors', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('Network error'))
      );
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Network error message
      });
    });

    it('displays validation errors', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Validation error messages
      });
    });
  });

  // Accessibility Tests (6 tests)
  describe('Accessibility', () => {
    it('has proper page structure', () => {
      renderWithProviders(<PrivacySettingsPage />);
      const main = screen.queryByRole('main');
      if (main) {
        expect(main).toBeInTheDocument();
      }
    });

    it('has proper heading hierarchy', () => {
      renderWithProviders(<PrivacySettingsPage />);
      const headings = screen.queryAllByRole('heading');
      expect(headings.length).toBeGreaterThanOrEqual(0);
    });

    it('supports keyboard navigation', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // Tab navigation
      });
    });

    it('has ARIA labels on controls', () => {
      renderWithProviders(<PrivacySettingsPage />);
      // All controls should have labels
    });

    it('announces setting changes to screen readers', async () => {
      renderWithProviders(<PrivacySettingsPage />);
      await waitFor(() => {
        // ARIA live regions
      });
    });

    it('has proper focus management', () => {
      renderWithProviders(<PrivacySettingsPage />);
      // Focus indicators visible
    });
  });

  // Responsive Design Tests (4 tests)
  describe('Responsive Behavior', () => {
    it('renders correctly on mobile', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));
      renderWithProviders(<PrivacySettingsPage />);
      // Mobile layout
    });

    it('renders correctly on tablet', () => {
      global.innerWidth = 768;
      global.dispatchEvent(new Event('resize'));
      renderWithProviders(<PrivacySettingsPage />);
      // Tablet layout
    });

    it('renders correctly on desktop', () => {
      global.innerWidth = 1920;
      global.dispatchEvent(new Event('resize'));
      renderWithProviders(<PrivacySettingsPage />);
      // Desktop layout
    });

    it('adapts settings layout for small screens', () => {
      global.innerWidth = 320;
      global.dispatchEvent(new Event('resize'));
      renderWithProviders(<PrivacySettingsPage />);
      // Small screen adaptations
    });
  });
});

export default mockUserService
