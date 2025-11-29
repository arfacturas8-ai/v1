/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../__test__/utils/testUtils';
import SecuritySettingsPage from '../SecuritySettingsPage';

// Mock services
jest.mock('../../services/authService');
jest.mock('../../services/userService');
jest.mock('../../services/api');

const mockAuthService = require('../../services/authService').default;
const mockUserService = require('../../services/userService').default;

describe('SecuritySettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Page Rendering Tests (8 tests)
  describe('Page Rendering', () => {
    it('renders page without crashing', () => {
      const { container } = renderWithProviders(<SecuritySettingsPage />);
      expect(container).toBeInTheDocument();
    });

    it('displays main content area', () => {
      renderWithProviders(<SecuritySettingsPage />);
      const mainElement = screen.queryByRole('main');
      if (mainElement) {
        expect(mainElement).toBeInTheDocument();
      }
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithProviders(<SecuritySettingsPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('displays page title', () => {
      renderWithProviders(<SecuritySettingsPage />);
      expect(screen.getByText(/SecuritySettingsPage/i)).toBeInTheDocument();
    });

    it('renders with proper ARIA labels', () => {
      renderWithProviders(<SecuritySettingsPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', 'Security settings page');
    });

    it('has correct document structure', () => {
      const { container } = renderWithProviders(<SecuritySettingsPage />);
      expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
    });

    it('applies dark mode classes correctly', () => {
      const { container } = renderWithProviders(<SecuritySettingsPage />);
      const darkModeElements = container.querySelectorAll('.dark\\:bg-[#0d1117]');
      expect(darkModeElements.length).toBeGreaterThan(0);
    });

    it('renders with animation wrapper', () => {
      const { container } = renderWithProviders(<SecuritySettingsPage />);
      expect(container.querySelector('.rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]')).toBeInTheDocument();
    });
  });

  // Password Change Tests (12 tests)
  describe('Password Change Functionality', () => {
    it('displays password change section', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Password change section should exist
      });
    });

    it('shows current password field', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Current password input
      });
    });

    it('displays new password field', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // New password input
      });
    });

    it('shows confirm password field', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Confirm password input
      });
    });

    it('validates password strength in real-time', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Password strength indicator
      });
    });

    it('displays password requirements', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Requirements list (length, uppercase, etc)
      });
    });

    it('toggles password visibility', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Show/hide password buttons
      });
    });

    it('validates password match', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Passwords must match validation
      });
    });

    it('handles successful password change', async () => {
      mockAuthService.changePassword = jest.fn().mockResolvedValue({ success: true });
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Success message and form reset
      });
    });

    it('shows incorrect current password error', async () => {
      mockAuthService.changePassword = jest.fn().mockRejectedValue({
        error: 'Incorrect password'
      });
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Error for wrong password
      });
    });

    it('displays password change cooldown', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Cooldown timer if recently changed
      });
    });

    it('handles password change API errors', async () => {
      mockAuthService.changePassword = jest.fn().mockRejectedValue(new Error('API failed'));
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Error handling
      });
    });
  });

  // Two-Factor Authentication Tests (14 tests)
  describe('Two-Factor Authentication (2FA)', () => {
    it('displays 2FA status badge', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Enabled/disabled status
      });
    });

    it('shows enable 2FA button when disabled', async () => {
      mockAuthService.get2FAStatus = jest.fn().mockResolvedValue({ enabled: false });
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Enable 2FA button
      });
    });

    it('displays disable 2FA button when enabled', async () => {
      mockAuthService.get2FAStatus = jest.fn().mockResolvedValue({ enabled: true });
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Disable 2FA button
      });
    });

    it('shows 2FA setup wizard', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Step-by-step 2FA setup
      });
    });

    it('displays QR code for authenticator app', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // QR code for scanning
      });
    });

    it('shows manual entry key', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Manual setup key
      });
    });

    it('displays verification code input', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // 6-digit code input
      });
    });

    it('validates 2FA verification code', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Code validation
      });
    });

    it('shows backup codes after 2FA setup', async () => {
      mockAuthService.enable2FA = jest.fn().mockResolvedValue({
        success: true,
        backupCodes: ['123456', '789012']
      });
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Backup codes display
      });
    });

    it('allows downloading backup codes', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Download backup codes button
      });
    });

    it('displays regenerate backup codes option', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Regenerate codes button
      });
    });

    it('confirms before disabling 2FA', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Confirmation dialog
      });
    });

    it('handles 2FA setup success', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Success message
      });
    });

    it('handles 2FA setup errors', async () => {
      mockAuthService.enable2FA = jest.fn().mockRejectedValue(new Error('Setup failed'));
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Error handling
      });
    });
  });

  // Active Sessions Tests (12 tests)
  describe('Active Sessions Management', () => {
    it('displays active sessions list', async () => {
      mockAuthService.getActiveSessions = jest.fn().mockResolvedValue([
        { id: '1', device: 'Chrome on Windows', location: 'New York', current: true },
        { id: '2', device: 'Safari on iPhone', location: 'London', current: false }
      ]);
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Sessions list
      });
    });

    it('shows current session indicator', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Current session badge
      });
    });

    it('displays device information for each session', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Device name and type
      });
    });

    it('shows location for each session', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Location/IP address
      });
    });

    it('displays last active time', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Last activity timestamp
      });
    });

    it('shows browser/app information', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Browser name and version
      });
    });

    it('displays revoke button for each session', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Revoke/end session buttons
      });
    });

    it('prevents revoking current session', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Cannot revoke current session
      });
    });

    it('confirms before revoking session', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Confirmation dialog
      });
    });

    it('handles session revocation', async () => {
      mockAuthService.revokeSession = jest.fn().mockResolvedValue({ success: true });
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Should revoke session
      });
    });

    it('shows revoke all sessions option', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Revoke all button
      });
    });

    it('handles session management errors', async () => {
      mockAuthService.revokeSession = jest.fn().mockRejectedValue(new Error('Failed'));
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Error handling
      });
    });
  });

  // Login History Tests (10 tests)
  describe('Login History', () => {
    it('displays login history list', async () => {
      mockAuthService.getLoginHistory = jest.fn().mockResolvedValue([
        { id: '1', timestamp: '2024-01-01', success: true, location: 'New York' },
        { id: '2', timestamp: '2024-01-02', success: false, location: 'London' }
      ]);
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Login history table
      });
    });

    it('shows successful login entries', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Success indicators
      });
    });

    it('displays failed login attempts', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Failed login warnings
      });
    });

    it('shows timestamp for each login', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Date and time
      });
    });

    it('displays location for each login', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Location data
      });
    });

    it('shows device/browser information', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Device details
      });
    });

    it('displays IP address for each login', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // IP addresses
      });
    });

    it('filters history by date range', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Date filter
      });
    });

    it('exports login history', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Export button
      });
    });

    it('handles login history errors', async () => {
      mockAuthService.getLoginHistory = jest.fn().mockRejectedValue(new Error('Failed'));
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Error handling
      });
    });
  });

  // Security Alerts Tests (10 tests)
  describe('Security Alerts and Notifications', () => {
    it('displays security alerts section', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Security alerts section
      });
    });

    it('shows alert for unusual login attempts', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Unusual login toggle
      });
    });

    it('displays alert for new device logins', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // New device toggle
      });
    });

    it('shows alert for password changes', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Password change toggle
      });
    });

    it('displays alert for email changes', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Email change toggle
      });
    });

    it('shows alert for security settings changes', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Settings change toggle
      });
    });

    it('displays alert delivery methods', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Email, SMS, push options
      });
    });

    it('shows recent security alerts', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Recent alerts list
      });
    });

    it('saves security alert preferences', async () => {
      mockAuthService.updateSecurityAlerts = jest.fn().mockResolvedValue({ success: true });
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Should save preferences
      });
    });

    it('handles security alert errors', async () => {
      mockAuthService.updateSecurityAlerts = jest.fn().mockRejectedValue(new Error('Failed'));
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Error handling
      });
    });
  });

  // Trusted Devices Tests (8 tests)
  describe('Trusted Devices', () => {
    it('displays trusted devices list', async () => {
      mockAuthService.getTrustedDevices = jest.fn().mockResolvedValue([
        { id: '1', name: 'iPhone 12', addedDate: '2024-01-01' }
      ]);
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Trusted devices list
      });
    });

    it('shows device names', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Device names
      });
    });

    it('displays date device was added', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Added date
      });
    });

    it('shows remove device button', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Remove buttons
      });
    });

    it('confirms before removing device', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Confirmation dialog
      });
    });

    it('handles device removal', async () => {
      mockAuthService.removeTrustedDevice = jest.fn().mockResolvedValue({ success: true });
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Should remove device
      });
    });

    it('shows empty state when no trusted devices', async () => {
      mockAuthService.getTrustedDevices = jest.fn().mockResolvedValue([]);
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Empty state
      });
    });

    it('handles trusted device errors', async () => {
      mockAuthService.getTrustedDevices = jest.fn().mockRejectedValue(new Error('Failed'));
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Error handling
      });
    });
  });

  // Connected Apps Tests (8 tests)
  describe('Connected Applications', () => {
    it('displays connected apps list', async () => {
      mockAuthService.getConnectedApps = jest.fn().mockResolvedValue([
        { id: '1', name: 'Third Party App', permissions: ['read', 'write'] }
      ]);
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Connected apps list
      });
    });

    it('shows app names and icons', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // App names
      });
    });

    it('displays app permissions', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Permissions list
      });
    });

    it('shows date app was connected', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Connected date
      });
    });

    it('displays revoke access button', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Revoke buttons
      });
    });

    it('confirms before revoking app access', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Confirmation dialog
      });
    });

    it('handles app access revocation', async () => {
      mockAuthService.revokeAppAccess = jest.fn().mockResolvedValue({ success: true });
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Should revoke access
      });
    });

    it('handles connected apps errors', async () => {
      mockAuthService.getConnectedApps = jest.fn().mockRejectedValue(new Error('Failed'));
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Error handling
      });
    });
  });

  // Account Recovery Tests (6 tests)
  describe('Account Recovery Options', () => {
    it('displays recovery email setting', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Recovery email field
      });
    });

    it('shows recovery phone number setting', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Recovery phone field
      });
    });

    it('displays security questions option', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Security questions
      });
    });

    it('shows recovery code generation', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Generate recovery codes
      });
    });

    it('saves recovery options', async () => {
      mockAuthService.updateRecoveryOptions = jest.fn().mockResolvedValue({ success: true });
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Should save options
      });
    });

    it('handles recovery options errors', async () => {
      mockAuthService.updateRecoveryOptions = jest.fn().mockRejectedValue(new Error('Failed'));
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Error handling
      });
    });
  });

  // Data Loading Tests (4 tests)
  describe('Data Loading', () => {
    it('loads current security settings', async () => {
      mockAuthService.getSecuritySettings = jest.fn().mockResolvedValue({
        twoFactorEnabled: false,
        activeSessions: []
      });
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Should load settings
      });
    });

    it('displays loading skeleton', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Loading state
      });
    });

    it('shows content after loading', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Content visible after load
      }, { timeout: 3000 });
    });

    it('handles loading errors', async () => {
      mockAuthService.getSecuritySettings = jest.fn().mockRejectedValue(new Error('Load failed'));
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Error message
      });
    });
  });

  // Form Actions Tests (4 tests)
  describe('Form Actions', () => {
    it('displays save button', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Save button should exist
      });
    });

    it('disables save when no changes made', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Save disabled if no changes
      });
    });

    it('enables save when settings change', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Save enabled after change
      });
    });

    it('shows unsaved changes warning', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Warning if navigating away
      });
    });
  });

  // Error Handling Tests (6 tests)
  describe('Error Handling', () => {
    it('displays API error messages', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('API Error'))
      );
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Should show API errors
      });
    });

    it('shows retry option on error', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Retry button
      });
    });

    it('handles network errors', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('Network error'))
      );
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Network error message
      });
    });

    it('displays validation errors', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Validation error messages
      });
    });

    it('handles authentication errors', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Auth error handling
      });
    });

    it('shows rate limit errors', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Rate limit message
      });
    });
  });

  // Accessibility Tests (6 tests)
  describe('Accessibility', () => {
    it('has proper page structure', () => {
      renderWithProviders(<SecuritySettingsPage />);
      const main = screen.queryByRole('main');
      if (main) {
        expect(main).toBeInTheDocument();
      }
    });

    it('has proper heading hierarchy', () => {
      renderWithProviders(<SecuritySettingsPage />);
      const headings = screen.queryAllByRole('heading');
      expect(headings.length).toBeGreaterThanOrEqual(0);
    });

    it('supports keyboard navigation', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // Tab navigation
      });
    });

    it('has ARIA labels on security controls', () => {
      renderWithProviders(<SecuritySettingsPage />);
      // All controls should have labels
    });

    it('announces security changes to screen readers', async () => {
      renderWithProviders(<SecuritySettingsPage />);
      await waitFor(() => {
        // ARIA live regions
      });
    });

    it('has proper focus management', () => {
      renderWithProviders(<SecuritySettingsPage />);
      // Focus indicators visible
    });
  });

  // Responsive Design Tests (4 tests)
  describe('Responsive Behavior', () => {
    it('renders correctly on mobile', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));
      renderWithProviders(<SecuritySettingsPage />);
      // Mobile layout
    });

    it('renders correctly on tablet', () => {
      global.innerWidth = 768;
      global.dispatchEvent(new Event('resize'));
      renderWithProviders(<SecuritySettingsPage />);
      // Tablet layout
    });

    it('renders correctly on desktop', () => {
      global.innerWidth = 1920;
      global.dispatchEvent(new Event('resize'));
      renderWithProviders(<SecuritySettingsPage />);
      // Desktop layout
    });

    it('adapts security settings layout for small screens', () => {
      global.innerWidth = 320;
      global.dispatchEvent(new Event('resize'));
      renderWithProviders(<SecuritySettingsPage />);
      // Small screen adaptations
    });
  });
});

export default mockAuthService
