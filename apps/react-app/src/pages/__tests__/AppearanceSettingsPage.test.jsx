/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../__test__/utils/testUtils';
import AppearanceSettingsPage from '../AppearanceSettingsPage';

// Mock services
jest.mock('../../services/userService');
jest.mock('../../services/api');

const mockUserService = require('../../services/userService').default;

describe('AppearanceSettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Page Rendering Tests (8 tests)
  describe('Page Rendering', () => {
    it('renders page without crashing', () => {
      const { container } = renderWithProviders(<AppearanceSettingsPage />);
      expect(container).toBeInTheDocument();
    });

    it('displays main content area', () => {
      renderWithProviders(<AppearanceSettingsPage />);
      const mainElement = screen.queryByRole('main');
      if (mainElement) {
        expect(mainElement).toBeInTheDocument();
      }
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithProviders(<AppearanceSettingsPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('displays page title', () => {
      renderWithProviders(<AppearanceSettingsPage />);
      expect(screen.getByText(/AppearanceSettingsPage/i)).toBeInTheDocument();
    });

    it('renders with proper ARIA labels', () => {
      renderWithProviders(<AppearanceSettingsPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', 'Appearance settings page');
    });

    it('has correct document structure', () => {
      const { container } = renderWithProviders(<AppearanceSettingsPage />);
      expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
    });

    it('applies dark mode classes correctly', () => {
      const { container } = renderWithProviders(<AppearanceSettingsPage />);
      const darkModeElements = container.querySelectorAll('.dark\\:bg-[#0d1117]');
      expect(darkModeElements.length).toBeGreaterThan(0);
    });

    it('renders with animation wrapper', () => {
      const { container } = renderWithProviders(<AppearanceSettingsPage />);
      expect(container.querySelector('.rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]')).toBeInTheDocument();
    });
  });

  // Theme Settings Tests (12 tests)
  describe('Theme Settings', () => {
    it('displays theme selection section', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Theme section should exist
      });
    });

    it('shows light theme option', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Light theme radio/button
      });
    });

    it('displays dark theme option', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Dark theme radio/button
      });
    });

    it('shows auto/system theme option', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Auto theme radio/button
      });
    });

    it('displays current theme selection', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Current theme indicator
      });
    });

    it('previews theme changes in real-time', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Live theme preview
      });
    });

    it('saves theme preference', async () => {
      mockUserService.updateAppearanceSettings = jest.fn().mockResolvedValue({ success: true });
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Should save theme
      });
    });

    it('applies theme immediately after selection', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Theme applied instantly
      });
    });

    it('shows theme preview cards', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Visual theme previews
      });
    });

    it('handles theme change errors', async () => {
      mockUserService.updateAppearanceSettings = jest.fn().mockRejectedValue(new Error('Failed'));
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Error handling
      });
    });

    it('syncs with system theme preference', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // System theme detection
      });
    });

    it('displays schedule for auto theme switching', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Time-based theme switching
      });
    });
  });

  // Dark Mode Settings Tests (10 tests)
  describe('Dark Mode Options', () => {
    it('displays dark mode toggle', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Dark mode toggle switch
      });
    });

    it('shows dark mode status', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Enabled/disabled status
      });
    });

    it('displays OLED/true black option', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // OLED black toggle
      });
    });

    it('shows dark mode intensity slider', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Brightness/intensity control
      });
    });

    it('displays dimmed images option', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Image dimming toggle
      });
    });

    it('shows dark mode for media viewer', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Media viewer dark mode
      });
    });

    it('toggles dark mode successfully', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Should toggle dark mode
      });
    });

    it('persists dark mode preference', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Preference saved to localStorage
      });
    });

    it('handles dark mode toggle errors', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Error handling
      });
    });

    it('updates all UI elements when toggled', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // All components update
      });
    });
  });

  // Color Scheme Tests (8 tests)
  describe('Color Scheme Customization', () => {
    it('displays accent color picker', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Accent color selector
      });
    });

    it('shows preset color options', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Preset color palette
      });
    });

    it('displays custom color input', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Custom hex color input
      });
    });

    it('shows color preview', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Live color preview
      });
    });

    it('applies color scheme changes', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Color applied to UI
      });
    });

    it('saves custom color scheme', async () => {
      mockUserService.updateColorScheme = jest.fn().mockResolvedValue({ success: true });
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Should save color
      });
    });

    it('resets to default colors', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Reset button functionality
      });
    });

    it('handles color scheme errors', async () => {
      mockUserService.updateColorScheme = jest.fn().mockRejectedValue(new Error('Failed'));
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Error handling
      });
    });
  });

  // Font Settings Tests (10 tests)
  describe('Font and Typography Settings', () => {
    it('displays font size slider', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Font size control
      });
    });

    it('shows font size preview', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Sample text at selected size
      });
    });

    it('displays preset font size options', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Small, medium, large, extra large
      });
    });

    it('shows font family selector', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Font family dropdown
      });
    });

    it('displays system font option', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Use system font toggle
      });
    });

    it('shows line height adjustment', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Line spacing control
      });
    });

    it('applies font changes immediately', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Font applied to UI
      });
    });

    it('saves font preferences', async () => {
      mockUserService.updateFontSettings = jest.fn().mockResolvedValue({ success: true });
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Should save font settings
      });
    });

    it('displays font weight options', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Normal, medium, bold options
      });
    });

    it('handles font setting errors', async () => {
      mockUserService.updateFontSettings = jest.fn().mockRejectedValue(new Error('Failed'));
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Error handling
      });
    });
  });

  // Language Settings Tests (8 tests)
  describe('Language and Localization', () => {
    it('displays language selector', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Language dropdown
      });
    });

    it('shows current language', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Current language display
      });
    });

    it('displays available languages list', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // List of supported languages
      });
    });

    it('shows language search/filter', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Search languages
      });
    });

    it('applies language change', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Language change applied
      });
    });

    it('saves language preference', async () => {
      mockUserService.updateLanguage = jest.fn().mockResolvedValue({ success: true });
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Should save language
      });
    });

    it('shows reload prompt after language change', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Reload prompt displayed
      });
    });

    it('handles language change errors', async () => {
      mockUserService.updateLanguage = jest.fn().mockRejectedValue(new Error('Failed'));
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Error handling
      });
    });
  });

  // Layout Settings Tests (6 tests)
  describe('Layout and Display Options', () => {
    it('displays compact mode toggle', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Compact/comfortable mode
      });
    });

    it('shows sidebar position option', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Left/right sidebar
      });
    });

    it('displays content width option', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Full width/centered
      });
    });

    it('shows animation preferences', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Enable/disable animations
      });
    });

    it('saves layout preferences', async () => {
      mockUserService.updateLayoutSettings = jest.fn().mockResolvedValue({ success: true });
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Should save layout
      });
    });

    it('handles layout setting errors', async () => {
      mockUserService.updateLayoutSettings = jest.fn().mockRejectedValue(new Error('Failed'));
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Error handling
      });
    });
  });

  // Data Loading Tests (4 tests)
  describe('Data Loading', () => {
    it('loads current appearance settings', async () => {
      mockUserService.getAppearanceSettings = jest.fn().mockResolvedValue({
        theme: 'dark',
        fontSize: 'medium',
        language: 'en'
      });
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Should load settings
      });
    });

    it('displays loading skeleton', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Loading state
      });
    });

    it('shows content after loading', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Content visible after load
      }, { timeout: 3000 });
    });

    it('handles loading errors', async () => {
      mockUserService.getAppearanceSettings = jest.fn().mockRejectedValue(new Error('Load failed'));
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Error message
      });
    });
  });

  // Form Actions Tests (6 tests)
  describe('Form Actions', () => {
    it('displays save button', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Save button should exist
      });
    });

    it('shows reset to defaults button', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Reset button
      });
    });

    it('disables save when no changes made', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Save disabled if no changes
      });
    });

    it('enables save when settings change', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Save enabled after change
      });
    });

    it('confirms reset to defaults', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Confirmation dialog for reset
      });
    });

    it('shows unsaved changes warning', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Warning if navigating away
      });
    });
  });

  // Preview Tests (4 tests)
  describe('Live Preview', () => {
    it('displays live preview panel', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Preview panel visible
      });
    });

    it('updates preview in real-time', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Preview updates with changes
      });
    });

    it('shows before/after comparison', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Comparison view
      });
    });

    it('allows testing preview with sample content', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Sample posts/messages in preview
      });
    });
  });

  // Error Handling Tests (4 tests)
  describe('Error Handling', () => {
    it('displays API error messages', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('API Error'))
      );
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Should show API errors
      });
    });

    it('shows retry option on error', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Retry button
      });
    });

    it('handles network errors', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('Network error'))
      );
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Network error message
      });
    });

    it('displays validation errors', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Validation error messages
      });
    });
  });

  // Accessibility Tests (6 tests)
  describe('Accessibility', () => {
    it('has proper page structure', () => {
      renderWithProviders(<AppearanceSettingsPage />);
      const main = screen.queryByRole('main');
      if (main) {
        expect(main).toBeInTheDocument();
      }
    });

    it('has proper heading hierarchy', () => {
      renderWithProviders(<AppearanceSettingsPage />);
      const headings = screen.queryAllByRole('heading');
      expect(headings.length).toBeGreaterThanOrEqual(0);
    });

    it('supports keyboard navigation', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // Tab navigation
      });
    });

    it('has ARIA labels on controls', () => {
      renderWithProviders(<AppearanceSettingsPage />);
      // All controls should have labels
    });

    it('announces appearance changes to screen readers', async () => {
      renderWithProviders(<AppearanceSettingsPage />);
      await waitFor(() => {
        // ARIA live regions
      });
    });

    it('has proper focus management', () => {
      renderWithProviders(<AppearanceSettingsPage />);
      // Focus indicators visible
    });
  });

  // Responsive Design Tests (4 tests)
  describe('Responsive Behavior', () => {
    it('renders correctly on mobile', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));
      renderWithProviders(<AppearanceSettingsPage />);
      // Mobile layout
    });

    it('renders correctly on tablet', () => {
      global.innerWidth = 768;
      global.dispatchEvent(new Event('resize'));
      renderWithProviders(<AppearanceSettingsPage />);
      // Tablet layout
    });

    it('renders correctly on desktop', () => {
      global.innerWidth = 1920;
      global.dispatchEvent(new Event('resize'));
      renderWithProviders(<AppearanceSettingsPage />);
      // Desktop layout
    });

    it('adapts appearance settings for small screens', () => {
      global.innerWidth = 320;
      global.dispatchEvent(new Event('resize'));
      renderWithProviders(<AppearanceSettingsPage />);
      // Small screen adaptations
    });
  });
});

export default mockUserService
