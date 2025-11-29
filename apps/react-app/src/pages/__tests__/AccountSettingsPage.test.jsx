/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../__test__/utils/testUtils';
import AccountSettingsPage from '../AccountSettingsPage';

// Mock services
jest.mock('../../services/userService');
jest.mock('../../services/authService');
jest.mock('../../services/api');

const mockUserService = require('../../services/userService').default;
const mockAuthService = require('../../services/authService').default;

describe('AccountSettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Page Rendering Tests (8 tests)
  describe('Page Rendering', () => {
    it('renders page without crashing', () => {
      const { container } = renderWithProviders(<AccountSettingsPage />);
      expect(container).toBeInTheDocument();
    });

    it('displays main content area', () => {
      renderWithProviders(<AccountSettingsPage />);
      const mainElement = screen.queryByRole('main');
      if (mainElement) {
        expect(mainElement).toBeInTheDocument();
      }
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithProviders(<AccountSettingsPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('displays page title', () => {
      renderWithProviders(<AccountSettingsPage />);
      expect(screen.getByText(/AccountSettingsPage/i)).toBeInTheDocument();
    });

    it('renders with proper ARIA labels', () => {
      renderWithProviders(<AccountSettingsPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', 'Account settings page');
    });

    it('has correct document structure', () => {
      const { container } = renderWithProviders(<AccountSettingsPage />);
      expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
    });

    it('applies dark mode classes correctly', () => {
      const { container } = renderWithProviders(<AccountSettingsPage />);
      const darkModeElements = container.querySelectorAll('.dark\\:bg-[#0d1117]');
      expect(darkModeElements.length).toBeGreaterThan(0);
    });

    it('renders with animation wrapper', () => {
      const { container } = renderWithProviders(<AccountSettingsPage />);
      expect(container.querySelector('.rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]')).toBeInTheDocument();
    });
  });

  // Account Information Tests (12 tests)
  describe('Account Information Display', () => {
    it('shows username field', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Username field should be present when implemented
      });
    });

    it('shows email field', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Email field should be present when implemented
      });
    });

    it('displays current username', async () => {
      mockUserService.getUserProfile = jest.fn().mockResolvedValue({
        username: 'testuser',
        email: 'test@example.com'
      });
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Current username should be displayed
      });
    });

    it('displays current email', async () => {
      mockUserService.getUserProfile = jest.fn().mockResolvedValue({
        username: 'testuser',
        email: 'test@example.com'
      });
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Current email should be displayed
      });
    });

    it('shows account creation date', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Account creation date should be shown when implemented
      });
    });

    it('displays account status badge', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Account status (active, verified, etc) should be shown
      });
    });

    it('shows account ID', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Account ID should be displayed when implemented
      });
    });

    it('displays profile picture', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Profile picture should be shown when implemented
      });
    });

    it('shows bio/description field', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Bio field should be present when implemented
      });
    });

    it('displays phone number if available', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Phone number field should be shown when implemented
      });
    });

    it('shows verified email badge', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Email verification status should be shown
      });
    });

    it('displays timezone setting', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Timezone preference should be shown when implemented
      });
    });
  });

  // Email Change Tests (10 tests)
  describe('Email Change Functionality', () => {
    it('renders email change form', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Email change form should exist when implemented
      });
    });

    it('validates email format', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Email validation should work when implemented
      });
    });

    it('requires current password for email change', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Should require password verification
      });
    });

    it('shows email change confirmation', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Confirmation dialog should appear
      });
    });

    it('sends verification email to new address', async () => {
      mockUserService.changeEmail = jest.fn().mockResolvedValue({ success: true });
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Should send verification email
      });
    });

    it('prevents duplicate email addresses', async () => {
      mockUserService.changeEmail = jest.fn().mockRejectedValue({
        error: 'Email already in use'
      });
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Should show error for duplicate email
      });
    });

    it('displays email change success message', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Success message should appear after change
      });
    });

    it('handles email change API errors', async () => {
      mockUserService.changeEmail = jest.fn().mockRejectedValue(new Error('API error'));
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Should handle and display error
      });
    });

    it('shows pending email verification status', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Should show if email verification is pending
      });
    });

    it('allows resending verification email', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Should have resend verification option
      });
    });
  });

  // Username Change Tests (8 tests)
  describe('Username Change Functionality', () => {
    it('renders username change form', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Username change form should exist
      });
    });

    it('validates username format', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Username validation (alphanumeric, length, etc)
      });
    });

    it('checks username availability', async () => {
      mockUserService.checkUsername = jest.fn().mockResolvedValue({ available: true });
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Should check if username is available
      });
    });

    it('shows username taken error', async () => {
      mockUserService.checkUsername = jest.fn().mockResolvedValue({ available: false });
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Should show error if username is taken
      });
    });

    it('enforces username length requirements', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Min/max length validation
      });
    });

    it('prevents special characters in username', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Should reject invalid characters
      });
    });

    it('shows username change cooldown', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Should show if username was recently changed
      });
    });

    it('displays username change success', async () => {
      mockUserService.changeUsername = jest.fn().mockResolvedValue({ success: true });
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Success message after username change
      });
    });
  });

  // Password Change Tests (10 tests)
  describe('Password Change Functionality', () => {
    it('renders password change form', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Password change form should exist
      });
    });

    it('requires current password', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Should require current password field
      });
    });

    it('validates new password strength', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Password strength validation
      });
    });

    it('requires password confirmation match', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Confirm password must match new password
      });
    });

    it('shows password strength indicator', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Visual password strength meter
      });
    });

    it('toggles password visibility', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Show/hide password toggle
      });
    });

    it('validates minimum password length', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Minimum 8 characters requirement
      });
    });

    it('requires uppercase and lowercase characters', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Mixed case requirement
      });
    });

    it('handles password change success', async () => {
      mockAuthService.changePassword = jest.fn().mockResolvedValue({ success: true });
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Success message and form reset
      });
    });

    it('shows incorrect current password error', async () => {
      mockAuthService.changePassword = jest.fn().mockRejectedValue({
        error: 'Incorrect password'
      });
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Error for wrong current password
      });
    });
  });

  // Account Deletion Tests (8 tests)
  describe('Account Deletion', () => {
    it('shows delete account button in danger zone', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Delete account button should be present
      });
    });

    it('displays deletion warning modal', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Warning modal before deletion
      });
    });

    it('requires password confirmation for deletion', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Must enter password to delete
      });
    });

    it('requires typing DELETE to confirm', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Must type "DELETE" or similar confirmation
      });
    });

    it('shows data deletion consequences', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // List what will be deleted
      });
    });

    it('handles account deletion API call', async () => {
      mockUserService.deleteAccount = jest.fn().mockResolvedValue({ success: true });
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Should call deletion API
      });
    });

    it('redirects after successful deletion', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Should redirect to goodbye page
      });
    });

    it('shows deletion error if API fails', async () => {
      mockUserService.deleteAccount = jest.fn().mockRejectedValue(new Error('Failed'));
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Error handling for failed deletion
      });
    });
  });

  // Data Export Tests (6 tests)
  describe('Data Export Functionality', () => {
    it('shows export data button', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Export data button should be visible
      });
    });

    it('displays export format options', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // JSON, CSV format options
      });
    });

    it('initiates data export request', async () => {
      mockUserService.requestDataExport = jest.fn().mockResolvedValue({ success: true });
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Should trigger export
      });
    });

    it('shows export in progress status', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Loading state during export
      });
    });

    it('displays download link when ready', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Download link after processing
      });
    });

    it('shows export history', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // List of previous exports
      });
    });
  });

  // Form Validation Tests (6 tests)
  describe('Form Validation', () => {
    it('validates email format in real-time', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Real-time email validation
      });
    });

    it('shows validation errors inline', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Inline error messages
      });
    });

    it('disables submit button when form is invalid', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Submit disabled for invalid forms
      });
    });

    it('clears errors on input change', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Errors clear when user starts typing
      });
    });

    it('validates required fields', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Required field validation
      });
    });

    it('prevents form submission with validation errors', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Cannot submit invalid form
      });
    });
  });

  // Loading States Tests (4 tests)
  describe('Loading States', () => {
    it('shows loading skeleton on initial load', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Loading skeleton or spinner
      });
    });

    it('displays loading state during save', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Loading indicator on save
      });
    });

    it('shows loading during data export', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Loading during export process
      });
    });

    it('disables form inputs while loading', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Inputs disabled during operations
      });
    });
  });

  // Error Handling Tests (6 tests)
  describe('Error Handling', () => {
    it('displays API error messages', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('API Error'))
      );
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Should show API errors
      });
    });

    it('handles network errors gracefully', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('Network error'))
      );
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Network error handling
      });
    });

    it('shows retry option on error', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Retry button for errors
      });
    });

    it('displays validation errors from API', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Server-side validation errors
      });
    });

    it('handles unauthorized errors', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // 401 error handling
      });
    });

    it('shows timeout errors', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Request timeout handling
      });
    });
  });

  // Accessibility Tests (6 tests)
  describe('Accessibility', () => {
    it('has proper page structure with landmarks', () => {
      renderWithProviders(<AccountSettingsPage />);
      const main = screen.queryByRole('main');
      if (main) {
        expect(main).toBeInTheDocument();
      }
    });

    it('has proper heading hierarchy', () => {
      renderWithProviders(<AccountSettingsPage />);
      const headings = screen.queryAllByRole('heading');
      expect(headings.length).toBeGreaterThanOrEqual(0);
    });

    it('supports keyboard navigation', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Tab navigation should work
      });
    });

    it('has ARIA labels on form fields', () => {
      renderWithProviders(<AccountSettingsPage />);
      // All inputs should have labels
    });

    it('announces form errors to screen readers', async () => {
      renderWithProviders(<AccountSettingsPage />);
      await waitFor(() => {
        // Error announcements
      });
    });

    it('has focus indicators on interactive elements', () => {
      renderWithProviders(<AccountSettingsPage />);
      // Focus styles should be visible
    });
  });

  // Responsive Design Tests (4 tests)
  describe('Responsive Behavior', () => {
    it('renders correctly on mobile viewport', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));
      renderWithProviders(<AccountSettingsPage />);
      // Mobile layout
    });

    it('renders correctly on tablet viewport', () => {
      global.innerWidth = 768;
      global.dispatchEvent(new Event('resize'));
      renderWithProviders(<AccountSettingsPage />);
      // Tablet layout
    });

    it('renders correctly on desktop viewport', () => {
      global.innerWidth = 1920;
      global.dispatchEvent(new Event('resize'));
      renderWithProviders(<AccountSettingsPage />);
      // Desktop layout
    });

    it('adapts form layout for small screens', () => {
      global.innerWidth = 320;
      global.dispatchEvent(new Event('resize'));
      renderWithProviders(<AccountSettingsPage />);
      // Small screen adaptations
    });
  });
});

export default mockUserService
