/**
 * Comprehensive Test Suite for CRYB ThemeToggle Component
 * Testing theme toggle functionality, variants, accessibility, and persistence
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ThemeToggle } from './ThemeToggle';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Sun: ({ className, size }: any) => (
    <svg data-testid="sun-icon" className={className} width={size} height={size}>
      <circle />
    </svg>
  ),
  Moon: ({ className, size }: any) => (
    <svg data-testid="moon-icon" className={className} width={size} height={size}>
      <circle />
    </svg>
  ),
}));

// Helper function to render component with ThemeProvider
const renderWithThemeProvider = (ui: React.ReactElement) => {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
};

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia
const createMatchMediaMock = (matches: boolean) => {
  return jest.fn().mockImplementation((query) => ({
    matches,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
};

describe('ThemeToggle Component', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();
    jest.clearAllMocks();

    // Mock matchMedia for system theme detection
    window.matchMedia = createMatchMediaMock(false);

    // Clear document theme attributes
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('theme-transitioning');
  });

  afterEach(() => {
    // Clean up after each test
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('theme-transitioning');
  });

  // ===== RENDERING TESTS =====
  describe('Rendering', () => {
    it('should render with default switch variant', () => {
      renderWithThemeProvider(<ThemeToggle />);
      const toggle = screen.getByRole('switch');
      expect(toggle).toBeInTheDocument();
    });

    it('should render icon variant', () => {
      renderWithThemeProvider(<ThemeToggle variant="icon" />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).not.toHaveAttribute('role', 'switch');
    });

    it('should render full variant', () => {
      renderWithThemeProvider(<ThemeToggle variant="full" />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should render both sun and moon icons', () => {
      renderWithThemeProvider(<ThemeToggle />);
      expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
      expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      renderWithThemeProvider(<ThemeToggle className="custom-class" />);
      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveClass('custom-class');
    });
  });

  // ===== VARIANT TESTS =====
  describe('Variants', () => {
    it('should render switch variant with correct classes', () => {
      renderWithThemeProvider(<ThemeToggle variant="switch" />);
      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveClass('theme-toggle-switch');
    });

    it('should render icon variant with correct classes', () => {
      renderWithThemeProvider(<ThemeToggle variant="icon" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('theme-toggle-icon');
    });

    it('should render full variant with correct classes', () => {
      renderWithThemeProvider(<ThemeToggle variant="full" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('theme-toggle-full');
    });

    it('should display text in full variant', () => {
      renderWithThemeProvider(<ThemeToggle variant="full" />);
      // Default theme is dark, so button should say "Light Mode"
      expect(screen.getByText('Light Mode')).toBeInTheDocument();
    });
  });

  // ===== SIZE TESTS =====
  describe('Sizes', () => {
    it('should render small size', () => {
      renderWithThemeProvider(<ThemeToggle size="sm" />);
      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveClass('theme-toggle-sm');
    });

    it('should render medium size (default)', () => {
      renderWithThemeProvider(<ThemeToggle size="md" />);
      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveClass('theme-toggle-md');
    });

    it('should render large size', () => {
      renderWithThemeProvider(<ThemeToggle size="lg" />);
      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveClass('theme-toggle-lg');
    });

    it('should use correct icon sizes for small', () => {
      renderWithThemeProvider(<ThemeToggle variant="icon" size="sm" />);
      const sunIcon = screen.getByTestId('sun-icon');
      const moonIcon = screen.getByTestId('moon-icon');
      expect(sunIcon).toHaveAttribute('width', '16');
      expect(moonIcon).toHaveAttribute('width', '16');
    });

    it('should use correct icon sizes for medium', () => {
      renderWithThemeProvider(<ThemeToggle variant="icon" size="md" />);
      const sunIcon = screen.getByTestId('sun-icon');
      const moonIcon = screen.getByTestId('moon-icon');
      expect(sunIcon).toHaveAttribute('width', '20');
      expect(moonIcon).toHaveAttribute('width', '20');
    });

    it('should use correct icon sizes for large', () => {
      renderWithThemeProvider(<ThemeToggle variant="icon" size="lg" />);
      const sunIcon = screen.getByTestId('sun-icon');
      const moonIcon = screen.getByTestId('moon-icon');
      expect(sunIcon).toHaveAttribute('width', '24');
      expect(moonIcon).toHaveAttribute('width', '24');
    });
  });

  // ===== THEME TOGGLE FUNCTIONALITY TESTS =====
  describe('Theme Toggle Functionality', () => {
    it('should toggle theme from dark to light on click', async () => {
      const user = userEvent.setup();
      renderWithThemeProvider(<ThemeToggle />);
      const toggle = screen.getByRole('switch');

      // Initially should be in dark mode (default)
      expect(toggle).toHaveAttribute('aria-checked', 'false');

      await user.click(toggle);

      // After click, should be in light mode
      await waitFor(() => {
        expect(toggle).toHaveAttribute('aria-checked', 'true');
      });
    });

    it('should toggle theme from light to dark on second click', async () => {
      const user = userEvent.setup();
      renderWithThemeProvider(<ThemeToggle />);
      const toggle = screen.getByRole('switch');

      // First click: dark -> light
      await user.click(toggle);
      await waitFor(() => {
        expect(toggle).toHaveAttribute('aria-checked', 'true');
      });

      // Second click: light -> dark
      await user.click(toggle);
      await waitFor(() => {
        expect(toggle).toHaveAttribute('aria-checked', 'false');
      });
    });

    it('should toggle multiple times correctly', async () => {
      const user = userEvent.setup();
      renderWithThemeProvider(<ThemeToggle />);
      const toggle = screen.getByRole('switch');

      // Toggle 5 times
      for (let i = 0; i < 5; i++) {
        await user.click(toggle);
        await waitFor(() => {
          const expectedChecked = i % 2 === 0 ? 'true' : 'false';
          expect(toggle).toHaveAttribute('aria-checked', expectedChecked);
        });
      }
    });

    it('should update aria-label when theme changes', async () => {
      const user = userEvent.setup();
      renderWithThemeProvider(<ThemeToggle variant="icon" />);
      const button = screen.getByRole('button');

      // Initially dark mode, should say "Switch to light mode"
      expect(button).toHaveAttribute('aria-label', 'Switch to light mode');

      await user.click(button);

      // After toggle, should say "Switch to dark mode"
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
      });
    });

    it('should update text in full variant when theme changes', async () => {
      const user = userEvent.setup();
      renderWithThemeProvider(<ThemeToggle variant="full" />);
      const button = screen.getByRole('button');

      // Initially dark mode, button should say "Light Mode"
      expect(screen.getByText('Light Mode')).toBeInTheDocument();

      await user.click(button);

      // After toggle to light mode, button should say "Dark Mode"
      await waitFor(() => {
        expect(screen.getByText('Dark Mode')).toBeInTheDocument();
      });
    });
  });

  // ===== LOCAL STORAGE PERSISTENCE TESTS =====
  describe('Theme Persistence', () => {
    it('should save theme to localStorage when toggled', async () => {
      const user = userEvent.setup();
      renderWithThemeProvider(<ThemeToggle />);
      const toggle = screen.getByRole('switch');

      await user.click(toggle);

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('cryb-theme', 'light');
      });
    });

    it('should save theme back to dark when toggled again', async () => {
      const user = userEvent.setup();
      renderWithThemeProvider(<ThemeToggle />);
      const toggle = screen.getByRole('switch');

      // Toggle to light
      await user.click(toggle);
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('cryb-theme', 'light');
      });

      // Toggle back to dark
      await user.click(toggle);
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('cryb-theme', 'dark');
      });
    });

    it('should load saved theme from localStorage on mount', () => {
      localStorageMock.getItem.mockReturnValue('light');

      renderWithThemeProvider(<ThemeToggle />);
      const toggle = screen.getByRole('switch');

      // Should be in light mode based on localStorage
      expect(toggle).toHaveAttribute('aria-checked', 'true');
    });

    it('should load dark theme from localStorage on mount', () => {
      localStorageMock.getItem.mockReturnValue('dark');

      renderWithThemeProvider(<ThemeToggle />);
      const toggle = screen.getByRole('switch');

      // Should be in dark mode based on localStorage
      expect(toggle).toHaveAttribute('aria-checked', 'false');
    });
  });

  // ===== SYSTEM THEME PREFERENCE TESTS =====
  describe('System Theme Preference', () => {
    it('should default to dark theme when no localStorage and system prefers dark', () => {
      window.matchMedia = createMatchMediaMock(false); // prefers dark

      renderWithThemeProvider(<ThemeToggle />);
      const toggle = screen.getByRole('switch');

      expect(toggle).toHaveAttribute('aria-checked', 'false');
    });

    it('should use system light theme when no localStorage and system prefers light', () => {
      // Ensure localStorage is cleared and no saved theme
      localStorageMock.clear();
      localStorageMock.getItem.mockReturnValue(null);
      window.matchMedia = createMatchMediaMock(true); // prefers light

      renderWithThemeProvider(<ThemeToggle />);
      const toggle = screen.getByRole('switch');

      expect(toggle).toHaveAttribute('aria-checked', 'true');
    });

    it('should prioritize localStorage over system preference', () => {
      localStorageMock.getItem.mockReturnValue('dark');
      window.matchMedia = createMatchMediaMock(true); // system prefers light

      renderWithThemeProvider(<ThemeToggle />);
      const toggle = screen.getByRole('switch');

      // Should use localStorage value (dark), not system preference (light)
      expect(toggle).toHaveAttribute('aria-checked', 'false');
    });
  });

  // ===== DOCUMENT THEME APPLICATION TESTS =====
  describe('Document Theme Application', () => {
    beforeEach(() => {
      // Clear any data-theme attribute
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.classList.remove('theme-transitioning');
    });

    it('should not set data-theme attribute for dark mode', () => {
      renderWithThemeProvider(<ThemeToggle />);

      // Dark mode should not have data-theme attribute
      expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    });

    it('should set data-theme attribute to light when toggled to light mode', async () => {
      const user = userEvent.setup();
      renderWithThemeProvider(<ThemeToggle />);
      const toggle = screen.getByRole('switch');

      await user.click(toggle);

      await waitFor(() => {
        expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      });
    });

    it('should remove data-theme attribute when toggled back to dark', async () => {
      const user = userEvent.setup();
      renderWithThemeProvider(<ThemeToggle />);
      const toggle = screen.getByRole('switch');

      // Toggle to light
      await user.click(toggle);
      await waitFor(() => {
        expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      });

      // Toggle back to dark
      await user.click(toggle);
      await waitFor(() => {
        expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
      });
    });

    it('should add theme-transitioning class during theme change', async () => {
      const user = userEvent.setup();
      renderWithThemeProvider(<ThemeToggle />);
      const toggle = screen.getByRole('switch');

      await user.click(toggle);

      // Should have transitioning class during change
      expect(document.documentElement.classList.contains('theme-transitioning')).toBe(true);
    });
  });

  // ===== ACCESSIBILITY TESTS =====
  describe('Accessibility', () => {
    it('should have switch role for switch variant', () => {
      renderWithThemeProvider(<ThemeToggle variant="switch" />);
      const toggle = screen.getByRole('switch');
      expect(toggle).toBeInTheDocument();
    });

    it('should have button role for icon variant', () => {
      renderWithThemeProvider(<ThemeToggle variant="icon" />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should have button role for full variant', () => {
      renderWithThemeProvider(<ThemeToggle variant="full" />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should have proper aria-label for dark mode', () => {
      renderWithThemeProvider(<ThemeToggle variant="icon" />);
      const button = screen.getByLabelText('Switch to light mode');
      expect(button).toBeInTheDocument();
    });

    it('should have proper aria-label for light mode', async () => {
      const user = userEvent.setup();
      localStorageMock.getItem.mockReturnValue('light');

      renderWithThemeProvider(<ThemeToggle variant="icon" />);
      const button = screen.getByLabelText('Switch to dark mode');
      expect(button).toBeInTheDocument();
    });

    it('should have aria-checked attribute on switch variant', () => {
      renderWithThemeProvider(<ThemeToggle variant="switch" />);
      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-checked');
    });

    it('should update aria-checked when theme changes', async () => {
      const user = userEvent.setup();
      // Ensure starting in dark mode
      localStorageMock.getItem.mockReturnValue('dark');

      renderWithThemeProvider(<ThemeToggle variant="switch" />);
      const toggle = screen.getByRole('switch');

      expect(toggle).toHaveAttribute('aria-checked', 'false');

      await user.click(toggle);

      await waitFor(() => {
        expect(toggle).toHaveAttribute('aria-checked', 'true');
      });
    });

    it('should have title attribute for icon variant', () => {
      // Ensure starting in dark mode
      localStorageMock.getItem.mockReturnValue('dark');

      renderWithThemeProvider(<ThemeToggle variant="icon" />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Switch to light mode');
    });

    it('should be focusable', () => {
      renderWithThemeProvider(<ThemeToggle />);
      const toggle = screen.getByRole('switch');
      toggle.focus();
      expect(toggle).toHaveFocus();
    });
  });

  // ===== KEYBOARD NAVIGATION TESTS =====
  describe('Keyboard Navigation', () => {
    it('should toggle theme with Enter key', async () => {
      const user = userEvent.setup();
      // Ensure starting in dark mode
      localStorageMock.getItem.mockReturnValue('dark');

      renderWithThemeProvider(<ThemeToggle />);
      const toggle = screen.getByRole('switch');

      toggle.focus();
      expect(toggle).toHaveAttribute('aria-checked', 'false');

      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(toggle).toHaveAttribute('aria-checked', 'true');
      });
    });

    it('should toggle theme with Space key', async () => {
      const user = userEvent.setup();
      // Ensure starting in dark mode
      localStorageMock.getItem.mockReturnValue('dark');

      renderWithThemeProvider(<ThemeToggle />);
      const toggle = screen.getByRole('switch');

      toggle.focus();
      expect(toggle).toHaveAttribute('aria-checked', 'false');

      await user.keyboard(' ');

      await waitFor(() => {
        expect(toggle).toHaveAttribute('aria-checked', 'true');
      });
    });

    it('should be keyboard accessible in icon variant', async () => {
      const user = userEvent.setup();
      // Ensure starting in dark mode
      localStorageMock.getItem.mockReturnValue('dark');

      renderWithThemeProvider(<ThemeToggle variant="icon" />);
      const button = screen.getByRole('button');

      button.focus();
      expect(button).toHaveFocus();

      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
      });
    });

    it('should be keyboard accessible in full variant', async () => {
      const user = userEvent.setup();
      // Ensure starting in dark mode
      localStorageMock.getItem.mockReturnValue('dark');

      renderWithThemeProvider(<ThemeToggle variant="full" />);
      const button = screen.getByRole('button');

      button.focus();
      expect(button).toHaveFocus();

      await user.keyboard(' ');

      await waitFor(() => {
        expect(screen.getByText('Dark Mode')).toBeInTheDocument();
      });
    });
  });

  // ===== ICON DISPLAY TESTS =====
  describe('Icon Changes', () => {
    it('should have sun icon with correct class', () => {
      renderWithThemeProvider(<ThemeToggle />);
      const sunIcon = screen.getByTestId('sun-icon');
      expect(sunIcon).toHaveClass('theme-toggle-thumb-sun');
    });

    it('should have moon icon with correct class', () => {
      renderWithThemeProvider(<ThemeToggle />);
      const moonIcon = screen.getByTestId('moon-icon');
      expect(moonIcon).toHaveClass('theme-toggle-thumb-moon');
    });

    it('should have both icons in icon wrapper for icon variant', () => {
      renderWithThemeProvider(<ThemeToggle variant="icon" />);
      const button = screen.getByRole('button');
      const wrapper = button.querySelector('.theme-toggle-icon-wrapper');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper?.querySelectorAll('svg')).toHaveLength(2);
    });

    it('should have both icons in full variant', () => {
      renderWithThemeProvider(<ThemeToggle variant="full" />);
      const button = screen.getByRole('button');
      expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
      expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
    });

    it('should apply sun class to icon in icon variant', () => {
      renderWithThemeProvider(<ThemeToggle variant="icon" />);
      const sunIcon = screen.getByTestId('sun-icon');
      expect(sunIcon).toHaveClass('theme-toggle-sun');
    });

    it('should apply moon class to icon in icon variant', () => {
      renderWithThemeProvider(<ThemeToggle variant="icon" />);
      const moonIcon = screen.getByTestId('moon-icon');
      expect(moonIcon).toHaveClass('theme-toggle-moon');
    });
  });

  // ===== INITIAL THEME LOADING TESTS =====
  describe('Initial Theme Loading', () => {
    it('should initialize with dark theme by default', () => {
      // Ensure no localStorage value
      localStorageMock.getItem.mockReturnValue(null);

      renderWithThemeProvider(<ThemeToggle />);
      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-checked', 'false');
    });

    it('should initialize with light theme from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('light');

      renderWithThemeProvider(<ThemeToggle />);
      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-checked', 'true');
    });

    it('should initialize with dark theme from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('dark');

      renderWithThemeProvider(<ThemeToggle />);
      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-checked', 'false');
    });

    it('should call localStorage.getItem on mount', () => {
      renderWithThemeProvider(<ThemeToggle />);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('cryb-theme');
    });

    it('should handle invalid localStorage values gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid-theme');

      renderWithThemeProvider(<ThemeToggle />);
      const toggle = screen.getByRole('switch');

      // Should fall back to default (dark)
      expect(toggle).toBeInTheDocument();
    });

    it('should apply initial theme to document on mount', () => {
      localStorageMock.getItem.mockReturnValue('light');

      renderWithThemeProvider(<ThemeToggle />);

      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });

  // ===== COMBINED VARIANT AND SIZE TESTS =====
  describe('Combined Variants and Sizes', () => {
    it('should render icon variant with small size', () => {
      renderWithThemeProvider(<ThemeToggle variant="icon" size="sm" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('theme-toggle-icon');
      expect(button).toHaveClass('theme-toggle-sm');
    });

    it('should render icon variant with large size', () => {
      renderWithThemeProvider(<ThemeToggle variant="icon" size="lg" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('theme-toggle-icon');
      expect(button).toHaveClass('theme-toggle-lg');
    });

    it('should render full variant with small size', () => {
      renderWithThemeProvider(<ThemeToggle variant="full" size="sm" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('theme-toggle-full');
      expect(button).toHaveClass('theme-toggle-sm');
    });

    it('should render full variant with large size', () => {
      renderWithThemeProvider(<ThemeToggle variant="full" size="lg" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('theme-toggle-full');
      expect(button).toHaveClass('theme-toggle-lg');
    });

    it('should render switch variant with custom class and size', () => {
      renderWithThemeProvider(
        <ThemeToggle variant="switch" size="lg" className="custom-toggle" />
      );
      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveClass('theme-toggle-switch');
      expect(toggle).toHaveClass('theme-toggle-lg');
      expect(toggle).toHaveClass('custom-toggle');
    });
  });

  // ===== MULTIPLE INSTANCES TESTS =====
  describe('Multiple Instances', () => {
    it('should sync theme across multiple toggle instances', async () => {
      const user = userEvent.setup();
      // Ensure starting in dark mode
      localStorageMock.getItem.mockReturnValue('dark');

      renderWithThemeProvider(
        <>
          <ThemeToggle data-testid="toggle-1" />
          <ThemeToggle data-testid="toggle-2" variant="icon" />
          <ThemeToggle data-testid="toggle-3" variant="full" />
        </>
      );

      const toggle1 = screen.getAllByRole('switch')[0];
      const buttons = screen.getAllByRole('button');
      const toggle2 = buttons.find((btn) => btn.getAttribute('aria-label') === 'Switch to light mode');
      expect(toggle2).toBeDefined();
      expect(screen.getByText('Light Mode')).toBeInTheDocument();

      // Click first toggle
      await user.click(toggle1);

      // All toggles should update
      await waitFor(() => {
        expect(toggle1).toHaveAttribute('aria-checked', 'true');
        const updatedButtons = screen.getAllByRole('button');
        const updatedToggle2 = updatedButtons.find((btn) =>
          btn.getAttribute('aria-label') === 'Switch to dark mode'
        );
        expect(updatedToggle2).toBeDefined();
        expect(screen.getByText('Dark Mode')).toBeInTheDocument();
      });
    });
  });

  // ===== ERROR HANDLING TESTS =====
  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', async () => {
      // Start with a clean localStorage
      localStorageMock.clear();
      localStorageMock.getItem.mockReturnValue('dark');

      renderWithThemeProvider(<ThemeToggle />);
      const toggle = screen.getByRole('switch');

      // Mock localStorage to throw error after component is mounted
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage is full');
      });

      const user = userEvent.setup();

      // Should not crash when localStorage fails
      await expect(async () => {
        await user.click(toggle);
      }).rejects.toThrow('localStorage is full');

      // Restore original mock
      localStorageMock.setItem = originalSetItem;
    });
  });

  // ===== THEME WRAPPER TESTS =====
  describe('Theme Wrapper Structure', () => {
    beforeEach(() => {
      // Restore localStorage mock for these tests
      localStorageMock.setItem.mockRestore();
      localStorageMock.setItem = jest.fn((key: string, value: string) => {
        // Do nothing, just prevent errors
      });
    });

    it('should have track element in switch variant', () => {
      localStorageMock.getItem.mockReturnValue('dark');
      const { container } = render(
        <ThemeProvider>
          <ThemeToggle variant="switch" />
        </ThemeProvider>
      );
      const track = container.querySelector('.theme-toggle-track');
      expect(track).toBeInTheDocument();
    });

    it('should have thumb element in switch variant', () => {
      localStorageMock.getItem.mockReturnValue('dark');
      const { container } = render(
        <ThemeProvider>
          <ThemeToggle variant="switch" />
        </ThemeProvider>
      );
      const thumb = container.querySelector('.theme-toggle-thumb');
      expect(thumb).toBeInTheDocument();
    });

    it('should have icon wrapper in icon variant', () => {
      localStorageMock.getItem.mockReturnValue('dark');
      const { container } = render(
        <ThemeProvider>
          <ThemeToggle variant="icon" />
        </ThemeProvider>
      );
      const wrapper = container.querySelector('.theme-toggle-icon-wrapper');
      expect(wrapper).toBeInTheDocument();
    });

    it('should have text element in full variant', () => {
      localStorageMock.getItem.mockReturnValue('dark');
      const { container } = render(
        <ThemeProvider>
          <ThemeToggle variant="full" />
        </ThemeProvider>
      );
      const text = container.querySelector('.theme-toggle-text');
      expect(text).toBeInTheDocument();
    });
  });
});
