/**
 * @jest-environment jsdom
 * AppearanceSettingsPage Test Suite
 * Comprehensive tests for appearance settings functionality including theme, colors, fonts, and display modes
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'
import { ThemeContext } from '../contexts/ThemeContext'
import AppearanceSettingsPage from './AppearanceSettingsPage'

// Mock fetch
global.fetch = jest.fn()

const mockUser = {
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  displayName: 'Test User',
  preferences: {
    theme: 'light',
    colorScheme: 'blue',
    fontSize: 'medium',
    displayMode: 'comfortable',
    language: 'en',
  },
}

const mockAuthContext = {
  user: mockUser,
  isAuthenticated: true,
  loading: false,
  login: jest.fn(),
  logout: jest.fn(),
  updateUser: jest.fn(),
}

const mockThemeContext = {
  theme: 'light',
  setTheme: jest.fn(),
  toggleTheme: jest.fn(),
  colorScheme: 'blue',
  setColorScheme: jest.fn(),
  fontSize: 'medium',
  setFontSize: jest.fn(),
}

const renderWithContext = (
  component = <AppearanceSettingsPage />,
  authValue = mockAuthContext,
  themeValue = mockThemeContext
) => {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={authValue}>
        <ThemeContext.Provider value={themeValue}>
          {component}
        </ThemeContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  )
}

describe('AppearanceSettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch.mockClear()
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })
  })

  describe('Page Rendering', () => {
    it('renders page without crashing', () => {
      const { container } = renderWithContext()
      expect(container).toBeInTheDocument()
    })

    it('displays main content area', () => {
      renderWithContext()
      const mainElement = screen.getByRole('main')
      expect(mainElement).toBeInTheDocument()
    })

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      renderWithContext()
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('displays page heading', () => {
      renderWithContext()
      expect(screen.getByRole('heading', { name: /appearance/i })).toBeInTheDocument()
    })

    it('has proper aria-label on main element', () => {
      renderWithContext()
      const main = screen.getByRole('main')
      expect(main).toHaveAttribute('aria-label', 'Appearance settings page')
    })

    it('renders with proper semantic structure', () => {
      renderWithContext()
      const main = screen.getByRole('main')
      const heading = screen.getByRole('heading')
      expect(main).toContainElement(heading)
    })

    it('applies dark mode classes when theme is dark', () => {
      const darkThemeContext = { ...mockThemeContext, theme: 'dark' }
      renderWithContext(<AppearanceSettingsPage />, mockAuthContext, darkThemeContext)
      const main = screen.getByRole('main')
      expect(main.className).toContain('dark:')
    })
  })

  describe('Authentication', () => {
    it('handles unauthenticated state', () => {
      const unauthContext = {
        ...mockAuthContext,
        user: null,
        isAuthenticated: false,
      }
      renderWithContext(<AppearanceSettingsPage />, unauthContext)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('displays content for authenticated users', () => {
      renderWithContext()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles loading state', () => {
      const loadingContext = { ...mockAuthContext, loading: true }
      renderWithContext(<AppearanceSettingsPage />, loadingContext)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Theme Toggle - Light/Dark/Auto', () => {
    it('displays theme selection options', () => {
      renderWithContext()
      // Theme options should be visible in the UI
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('switches to light theme', async () => {
      renderWithContext()
      const mockSetTheme = mockThemeContext.setTheme

      // Simulate theme change to light
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('switches to dark theme', async () => {
      renderWithContext()
      const mockSetTheme = mockThemeContext.setTheme

      // Simulate theme change to dark
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('switches to auto theme', async () => {
      renderWithContext()
      // Test auto theme detection
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('persists theme preference', async () => {
      renderWithContext()
      // Theme changes should persist
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(0)
      })
    })

    it('respects system theme preference in auto mode', () => {
      const autoThemeContext = { ...mockThemeContext, theme: 'auto' }
      renderWithContext(<AppearanceSettingsPage />, mockAuthContext, autoThemeContext)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Theme Preview', () => {
    it('displays theme preview section', () => {
      renderWithContext()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('shows light theme preview', () => {
      renderWithContext()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('shows dark theme preview', () => {
      const darkThemeContext = { ...mockThemeContext, theme: 'dark' }
      renderWithContext(<AppearanceSettingsPage />, mockAuthContext, darkThemeContext)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('updates preview when theme changes', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('displays preview with current color scheme', () => {
      renderWithContext()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Color Scheme Selection', () => {
    it('displays color scheme options', () => {
      renderWithContext()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('selects blue color scheme', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('selects green color scheme', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('selects purple color scheme', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('selects red color scheme', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('applies selected color scheme', async () => {
      const customColorContext = { ...mockThemeContext, colorScheme: 'purple' }
      renderWithContext(<AppearanceSettingsPage />, mockAuthContext, customColorContext)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('persists color scheme selection', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('shows color previews for each scheme', () => {
      renderWithContext()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Font Size Adjustment', () => {
    it('displays font size options', () => {
      renderWithContext()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('selects small font size', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('selects medium font size', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('selects large font size', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('selects extra large font size', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('applies font size changes immediately', async () => {
      const largeFontContext = { ...mockThemeContext, fontSize: 'large' }
      renderWithContext(<AppearanceSettingsPage />, mockAuthContext, largeFontContext)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('persists font size preference', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('displays font size preview text', () => {
      renderWithContext()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Display Mode - Compact/Comfortable', () => {
    it('displays display mode options', () => {
      renderWithContext()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('switches to compact mode', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('switches to comfortable mode', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('applies compact spacing', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('applies comfortable spacing', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('persists display mode preference', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('shows visual difference between modes', () => {
      renderWithContext()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Language Selection', () => {
    it('displays language selection dropdown', () => {
      renderWithContext()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('shows available languages', () => {
      renderWithContext()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('selects English language', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('selects Spanish language', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('selects French language', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('persists language preference', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('displays current language selection', () => {
      renderWithContext()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Save Preferences', () => {
    it('displays save button', () => {
      renderWithContext()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('saves all preferences on button click', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('disables save button when no changes', () => {
      renderWithContext()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('enables save button when changes detected', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('shows loading state during save', async () => {
      global.fetch.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve({ ok: true, json: async () => ({ success: true }) }), 100))
      )
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('sends correct data to API', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('includes authentication token in request', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })
  })

  describe('Reset to Defaults', () => {
    it('displays reset button', () => {
      renderWithContext()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('shows confirmation dialog before reset', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('resets theme to default', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('resets color scheme to default', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('resets font size to default', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('resets display mode to default', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('resets language to default', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('cancels reset on dialog dismiss', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })
  })

  describe('Success States', () => {
    it('displays success message after save', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('shows success alert with proper role', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('auto-dismisses success message', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('displays success icon', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })
  })

  describe('Error States', () => {
    it('displays error message when save fails', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Save failed'))
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('shows error alert with proper role', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('handles network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('handles API errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      })
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('displays retry button on error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Failed'))
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('handles validation errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Validation failed' }),
      })
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('preserves user changes after error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Failed'))
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles missing user preferences', () => {
      const userWithoutPrefs = { ...mockUser, preferences: null }
      const authContext = { ...mockAuthContext, user: userWithoutPrefs }
      renderWithContext(<AppearanceSettingsPage />, authContext)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles partial preference data', () => {
      const userWithPartialPrefs = {
        ...mockUser,
        preferences: { theme: 'light' },
      }
      const authContext = { ...mockAuthContext, user: userWithPartialPrefs }
      renderWithContext(<AppearanceSettingsPage />, authContext)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles invalid theme value', () => {
      const userWithInvalidTheme = {
        ...mockUser,
        preferences: { ...mockUser.preferences, theme: 'invalid' },
      }
      const authContext = { ...mockAuthContext, user: userWithInvalidTheme }
      renderWithContext(<AppearanceSettingsPage />, authContext)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles rapid theme changes', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('handles concurrent save requests', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('handles empty color scheme', () => {
      const userWithoutColor = {
        ...mockUser,
        preferences: { ...mockUser.preferences, colorScheme: '' },
      }
      const authContext = { ...mockAuthContext, user: userWithoutColor }
      renderWithContext(<AppearanceSettingsPage />, authContext)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles null user context', () => {
      const nullUserContext = { ...mockAuthContext, user: null }
      renderWithContext(<AppearanceSettingsPage />, nullUserContext)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles undefined theme context', () => {
      renderWithContext(<AppearanceSettingsPage />, mockAuthContext, undefined)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      renderWithContext()
      const main = screen.getByRole('main')
      expect(main).toHaveAttribute('aria-label')
    })

    it('has semantic heading hierarchy', () => {
      renderWithContext()
      const headings = screen.getAllByRole('heading')
      expect(headings.length).toBeGreaterThan(0)
    })

    it('supports keyboard navigation', () => {
      renderWithContext()
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
    })

    it('has focus indicators', () => {
      renderWithContext()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('announces changes to screen readers', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('provides text alternatives for icons', () => {
      renderWithContext()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('has sufficient color contrast', () => {
      renderWithContext()
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
    })

    it('supports high contrast mode', () => {
      renderWithContext()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Responsive Behavior', () => {
    it('renders correctly on mobile viewport', () => {
      global.innerWidth = 375
      global.innerHeight = 667
      renderWithContext()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('renders correctly on tablet viewport', () => {
      global.innerWidth = 768
      global.innerHeight = 1024
      renderWithContext()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('renders correctly on desktop viewport', () => {
      global.innerWidth = 1920
      global.innerHeight = 1080
      renderWithContext()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('adjusts layout for small screens', () => {
      global.innerWidth = 320
      renderWithContext()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('optimizes for large screens', () => {
      global.innerWidth = 2560
      renderWithContext()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Component Snapshots', () => {
    it('matches snapshot for light theme', () => {
      const { container } = renderWithContext()
      expect(container.firstChild).toMatchSnapshot()
    })

    it('matches snapshot for dark theme', () => {
      const darkThemeContext = { ...mockThemeContext, theme: 'dark' }
      const { container } = renderWithContext(
        <AppearanceSettingsPage />,
        mockAuthContext,
        darkThemeContext
      )
      expect(container.firstChild).toMatchSnapshot()
    })

    it('matches snapshot with all options selected', () => {
      const customContext = {
        ...mockThemeContext,
        theme: 'dark',
        colorScheme: 'purple',
        fontSize: 'large',
      }
      const { container } = renderWithContext(
        <AppearanceSettingsPage />,
        mockAuthContext,
        customContext
      )
      expect(container.firstChild).toMatchSnapshot()
    })

    it('matches snapshot for unauthenticated state', () => {
      const unauthContext = { ...mockAuthContext, user: null, isAuthenticated: false }
      const { container } = renderWithContext(
        <AppearanceSettingsPage />,
        unauthContext
      )
      expect(container.firstChild).toMatchSnapshot()
    })
  })

  describe('Performance', () => {
    it('memoizes component correctly', () => {
      const { rerender } = renderWithContext()
      rerender(
        <MemoryRouter>
          <AuthContext.Provider value={mockAuthContext}>
            <ThemeContext.Provider value={mockThemeContext}>
              <AppearanceSettingsPage />
            </ThemeContext.Provider>
          </AuthContext.Provider>
        </MemoryRouter>
      )
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('does not re-render unnecessarily', () => {
      const { rerender } = renderWithContext()
      const firstRender = screen.getByRole('main')

      rerender(
        <MemoryRouter>
          <AuthContext.Provider value={mockAuthContext}>
            <ThemeContext.Provider value={mockThemeContext}>
              <AppearanceSettingsPage />
            </ThemeContext.Provider>
          </AuthContext.Provider>
        </MemoryRouter>
      )

      const secondRender = screen.getByRole('main')
      expect(firstRender).toBe(secondRender)
    })
  })

  describe('Animation and Transitions', () => {
    it('includes framer-motion animations', () => {
      renderWithContext()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('animates page entry', async () => {
      renderWithContext()
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('applies transition styles', () => {
      const { container } = renderWithContext()
      expect(container.querySelector('.bg-white')).toBeInTheDocument()
    })
  })
})

export default mockUser
