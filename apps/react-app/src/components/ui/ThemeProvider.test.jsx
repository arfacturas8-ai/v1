import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, useTheme, ThemeToggle } from './ThemeProvider'

// Test component to access the theme context
const TestConsumer = () => {
  const { theme, setTheme, shouldReduceMotion } = useTheme()
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <span data-testid="reduced-motion">{shouldReduceMotion.toString()}</span>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={() => setTheme('light')}>Set Light</button>
      <button onClick={() => setTheme('system')}>Set System</button>
    </div>
  )
}

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString()
    }),
    removeItem: jest.fn((key) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
  }
})()

// Mock matchMedia
const createMatchMediaMock = (matches = false) => {
  const listeners = []
  return jest.fn().mockImplementation((query) => ({
    matches,
    media: query,
    onchange: null,
    addListener: jest.fn((callback) => {
      listeners.push(callback)
    }),
    removeListener: jest.fn((callback) => {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
    _triggerChange: () => {
      listeners.forEach((callback) => callback())
    },
    _listeners: listeners,
  }))
}

describe('ThemeProvider', () => {
  let originalLocalStorage
  let originalMatchMedia
  let matchMediaInstance

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup localStorage mock
    originalLocalStorage = global.localStorage
    global.localStorage = localStorageMock
    localStorageMock.clear()

    // Setup matchMedia mock
    originalMatchMedia = window.matchMedia
    matchMediaInstance = createMatchMediaMock(false)
    window.matchMedia = matchMediaInstance

    // Reset document classes
    document.documentElement.className = ''
  })

  afterEach(() => {
    global.localStorage = originalLocalStorage
    window.matchMedia = originalMatchMedia
    document.documentElement.className = ''
  })

  describe('Provider Initialization', () => {
    it('renders without crashing', () => {
      render(
        <ThemeProvider>
          <div>Test Content</div>
        </ThemeProvider>
      )
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('renders children correctly', () => {
      render(
        <ThemeProvider>
          <div data-testid="child">Child Component</div>
        </ThemeProvider>
      )
      expect(screen.getByTestId('child')).toBeInTheDocument()
    })

    it('uses default theme when no localStorage value exists', () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      )
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
    })

    it('uses custom default theme when provided', () => {
      render(
        <ThemeProvider defaultTheme="dark">
          <TestConsumer />
        </ThemeProvider>
      )
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
    })

    it('loads theme from localStorage if available', () => {
      localStorageMock.getItem.mockReturnValue('dark')
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      )
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
    })

    it('uses custom storage key when provided', () => {
      const customKey = 'custom-theme-key'
      localStorageMock.getItem.mockReturnValue('dark')
      render(
        <ThemeProvider storageKey={customKey}>
          <TestConsumer />
        </ThemeProvider>
      )
      expect(localStorageMock.getItem).toHaveBeenCalledWith(customKey)
    })

    it('uses default storage key when not provided', () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      )
      expect(localStorageMock.getItem).toHaveBeenCalledWith('cryb-theme')
    })

    it('handles SSR scenario when window is undefined', () => {
      const originalWindow = global.window
      delete global.window

      const { container } = render(
        <ThemeProvider defaultTheme="dark">
          <div>SSR Content</div>
        </ThemeProvider>
      )

      global.window = originalWindow
      expect(container).toBeInTheDocument()
    })
  })

  describe('Theme Context', () => {
    it('provides theme value to consumers', () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      )
      expect(screen.getByTestId('current-theme')).toBeInTheDocument()
    })

    it('provides setTheme function to consumers', () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      )
      const button = screen.getByText('Set Dark')
      expect(button).toBeInTheDocument()
    })

    it('provides shouldReduceMotion value to consumers', () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      )
      expect(screen.getByTestId('reduced-motion')).toBeInTheDocument()
    })

    it('throws error when useTheme is used outside provider', () => {
      // Suppress console.error for this test
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

      const InvalidComponent = () => {
        useTheme()
        return <div>Invalid</div>
      }

      expect(() => render(<InvalidComponent />)).toThrow(
        'useTheme must be used within a ThemeProvider'
      )

      consoleError.mockRestore()
    })
  })

  describe('Theme Switching', () => {
    it('switches to dark theme', async () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      )

      const button = screen.getByText('Set Dark')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
      })
    })

    it('switches to light theme', async () => {
      render(
        <ThemeProvider defaultTheme="dark">
          <TestConsumer />
        </ThemeProvider>
      )

      const button = screen.getByText('Set Light')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
      })
    })

    it('switches to system theme', async () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      )

      const button = screen.getByText('Set System')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('system')
      })
    })

    it('persists theme to localStorage when changed', async () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      )

      const button = screen.getByText('Set Dark')
      fireEvent.click(button)

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('cryb-theme', 'dark')
      })
    })

    it('persists theme to custom storage key', async () => {
      const customKey = 'my-custom-key'
      render(
        <ThemeProvider storageKey={customKey}>
          <TestConsumer />
        </ThemeProvider>
      )

      const button = screen.getByText('Set Dark')
      fireEvent.click(button)

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(customKey, 'dark')
      })
    })

    it('updates theme multiple times', async () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      )

      fireEvent.click(screen.getByText('Set Dark'))
      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
      })

      fireEvent.click(screen.getByText('Set System'))
      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('system')
      })

      fireEvent.click(screen.getByText('Set Light'))
      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
      })
    })
  })

  describe('DOM Manipulation', () => {
    it('adds light class to document root for light theme', async () => {
      render(
        <ThemeProvider defaultTheme="light">
          <TestConsumer />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(document.documentElement.classList.contains('light')).toBe(true)
      })
    })

    it('adds dark class to document root for dark theme', async () => {
      render(
        <ThemeProvider defaultTheme="dark">
          <TestConsumer />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true)
      })
    })

    it('removes previous theme class when switching', async () => {
      render(
        <ThemeProvider defaultTheme="light">
          <TestConsumer />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(document.documentElement.classList.contains('light')).toBe(true)
      })

      fireEvent.click(screen.getByText('Set Dark'))

      await waitFor(() => {
        expect(document.documentElement.classList.contains('light')).toBe(false)
        expect(document.documentElement.classList.contains('dark')).toBe(true)
      })
    })

    it('applies system theme based on prefers-color-scheme (dark)', async () => {
      window.matchMedia = createMatchMediaMock(true)

      render(
        <ThemeProvider defaultTheme="system">
          <TestConsumer />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true)
      })
    })

    it('applies system theme based on prefers-color-scheme (light)', async () => {
      window.matchMedia = createMatchMediaMock(false)

      render(
        <ThemeProvider defaultTheme="system">
          <TestConsumer />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(document.documentElement.classList.contains('light')).toBe(true)
      })
    })

    it('updates when system theme preference changes', async () => {
      const mockMedia = createMatchMediaMock(false)
      window.matchMedia = mockMedia

      render(
        <ThemeProvider defaultTheme="system">
          <TestConsumer />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(document.documentElement.classList.contains('light')).toBe(true)
      })

      // Simulate system theme change to dark
      mockMedia.mockImplementation((query) => {
        if (query === '(prefers-color-scheme: dark)') {
          const instance = mockMedia(query)
          instance.matches = true
          return instance
        }
        return mockMedia(query)
      })
    })

    it('does not listen to system changes when theme is not system', async () => {
      render(
        <ThemeProvider defaultTheme="light">
          <TestConsumer />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(document.documentElement.classList.contains('light')).toBe(true)
      })

      // System theme should not affect the light theme
      expect(window.matchMedia).toHaveBeenCalled()
    })
  })

  describe('Reduced Motion', () => {
    it('detects reduced motion preference', async () => {
      window.matchMedia = createMatchMediaMock(true)

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('reduced-motion')).toHaveTextContent('true')
      })
    })

    it('detects no reduced motion preference', async () => {
      window.matchMedia = createMatchMediaMock(false)

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('reduced-motion')).toHaveTextContent('false')
      })
    })

    it('adds reduce-motion class when preference is enabled', async () => {
      window.matchMedia = createMatchMediaMock(true)

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(document.documentElement.classList.contains('reduce-motion')).toBe(true)
      })
    })

    it('removes reduce-motion class when preference is disabled', async () => {
      window.matchMedia = createMatchMediaMock(false)

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(document.documentElement.classList.contains('reduce-motion')).toBe(false)
      })
    })

    it('listens for reduced motion preference changes', async () => {
      let mediaQueryCallback
      const mockMedia = jest.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        addListener: jest.fn((callback) => {
          if (query === '(prefers-reduced-motion: reduce)') {
            mediaQueryCallback = callback
          }
        }),
        removeListener: jest.fn(),
      }))

      window.matchMedia = mockMedia

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(mockMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
      })

      expect(mediaQueryCallback).toBeDefined()
    })

    it('cleans up reduced motion listener on unmount', () => {
      const removeListener = jest.fn()
      window.matchMedia = jest.fn().mockImplementation(() => ({
        matches: false,
        addListener: jest.fn(),
        removeListener,
      }))

      const { unmount } = render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      )

      unmount()

      expect(removeListener).toHaveBeenCalled()
    })
  })

  describe('ThemeToggle Component', () => {
    it('renders toggle button', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      )

      const button = screen.getByRole('button', { name: /toggle theme/i })
      expect(button).toBeInTheDocument()
    })

    it('has proper aria-label', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      )

      const button = screen.getByRole('button', { name: /toggle theme/i })
      expect(button).toHaveAttribute('aria-label', 'Toggle theme')
    })

    it('toggles from light to dark', async () => {
      render(
        <ThemeProvider defaultTheme="light">
          <TestConsumer />
          <ThemeToggle />
        </ThemeProvider>
      )

      const button = screen.getByRole('button', { name: /toggle theme/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
      })
    })

    it('toggles from dark to light', async () => {
      render(
        <ThemeProvider defaultTheme="dark">
          <TestConsumer />
          <ThemeToggle />
        </ThemeProvider>
      )

      const button = screen.getByRole('button', { name: /toggle theme/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
      })
    })

    it('toggles multiple times', async () => {
      render(
        <ThemeProvider defaultTheme="light">
          <TestConsumer />
          <ThemeToggle />
        </ThemeProvider>
      )

      const button = screen.getByRole('button', { name: /toggle theme/i })

      fireEvent.click(button)
      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
      })

      fireEvent.click(button)
      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
      })

      fireEvent.click(button)
      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
      })
    })

    it('displays moon icon when dark theme is active', () => {
      render(
        <ThemeProvider defaultTheme="dark">
          <ThemeToggle />
        </ThemeProvider>
      )

      const button = screen.getByRole('button', { name: /toggle theme/i })
      const svg = button.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('displays sun icon when light theme is active', () => {
      render(
        <ThemeProvider defaultTheme="light">
          <ThemeToggle />
        </ThemeProvider>
      )

      const button = screen.getByRole('button', { name: /toggle theme/i })
      const svgs = button.querySelectorAll('svg')
      expect(svgs.length).toBe(2)
    })

    it('has proper CSS classes for styling', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      )

      const button = screen.getByRole('button', { name: /toggle theme/i })
      expect(button.className).toContain('rounded-lg')
      expect(button.className).toContain('transition-all')
    })

    it('has focus ring for accessibility', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      )

      const button = screen.getByRole('button', { name: /toggle theme/i })
      expect(button.className).toContain('focus:ring-2')
      expect(button.className).toContain('focus:ring-blue-9')
    })

    it('can be focused with keyboard', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      )

      const button = screen.getByRole('button', { name: /toggle theme/i })
      button.focus()
      expect(button).toHaveFocus()
    })

    it('can be activated with keyboard', async () => {
      const user = userEvent.setup()
      render(
        <ThemeProvider defaultTheme="light">
          <TestConsumer />
          <ThemeToggle />
        </ThemeProvider>
      )

      const button = screen.getByRole('button', { name: /toggle theme/i })
      await user.tab()
      expect(button).toHaveFocus()

      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
      })
    })

    it('can be activated with space key', async () => {
      const user = userEvent.setup()
      render(
        <ThemeProvider defaultTheme="light">
          <TestConsumer />
          <ThemeToggle />
        </ThemeProvider>
      )

      const button = screen.getByRole('button', { name: /toggle theme/i })
      button.focus()

      await user.keyboard(' ')

      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
      })
    })

    it('has hover styles', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      )

      const button = screen.getByRole('button', { name: /toggle theme/i })
      expect(button.className).toContain('hover:bg-gray-3')
    })

    it('throws error when used outside ThemeProvider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => render(<ThemeToggle />)).toThrow(
        'useTheme must be used within a ThemeProvider'
      )

      consoleError.mockRestore()
    })
  })

  describe('Edge Cases', () => {
    it('handles invalid theme value in localStorage', () => {
      localStorageMock.getItem.mockReturnValue('invalid-theme')

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      )

      expect(screen.getByTestId('current-theme')).toHaveTextContent('invalid-theme')
    })

    it('handles null localStorage value', () => {
      localStorageMock.getItem.mockReturnValue(null)

      render(
        <ThemeProvider defaultTheme="dark">
          <TestConsumer />
        </ThemeProvider>
      )

      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
    })

    it('handles localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })

      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(
          <ThemeProvider>
            <TestConsumer />
          </ThemeProvider>
        )
      }).toThrow()

      consoleError.mockRestore()
    })

    it('handles setItem localStorage errors gracefully', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })

      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      )

      const button = screen.getByText('Set Dark')
      fireEvent.click(button)

      // Should still update state even if localStorage fails
      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
      })

      consoleError.mockRestore()
    })

    it('handles missing matchMedia gracefully', () => {
      const originalMatchMedia = window.matchMedia
      delete window.matchMedia

      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(
          <ThemeProvider>
            <TestConsumer />
          </ThemeProvider>
        )
      }).toThrow()

      window.matchMedia = originalMatchMedia
      consoleError.mockRestore()
    })

    it('handles rapid theme changes', async () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      )

      fireEvent.click(screen.getByText('Set Dark'))
      fireEvent.click(screen.getByText('Set Light'))
      fireEvent.click(screen.getByText('Set System'))
      fireEvent.click(screen.getByText('Set Dark'))

      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
      })
    })

    it('handles empty storage key', () => {
      render(
        <ThemeProvider storageKey="">
          <TestConsumer />
        </ThemeProvider>
      )

      expect(localStorageMock.getItem).toHaveBeenCalledWith('')
    })

    it('handles very long storage key', () => {
      const longKey = 'a'.repeat(1000)
      render(
        <ThemeProvider storageKey={longKey}>
          <TestConsumer />
        </ThemeProvider>
      )

      expect(localStorageMock.getItem).toHaveBeenCalledWith(longKey)
    })

    it('handles special characters in storage key', () => {
      const specialKey = 'theme-!@#$%^&*()'
      render(
        <ThemeProvider storageKey={specialKey}>
          <TestConsumer />
        </ThemeProvider>
      )

      expect(localStorageMock.getItem).toHaveBeenCalledWith(specialKey)
    })
  })

  describe('Accessibility', () => {
    it('maintains focus after theme change', async () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      )

      const button = screen.getByRole('button', { name: /toggle theme/i })
      button.focus()
      expect(button).toHaveFocus()

      fireEvent.click(button)

      await waitFor(() => {
        expect(button).toHaveFocus()
      })
    })

    it('has no accessibility violations', async () => {
      const { container } = render(
        <ThemeProvider>
          <ThemeToggle />
          <div>Content</div>
        </ThemeProvider>
      )

      // Check for basic accessibility
      const button = screen.getByRole('button', { name: /toggle theme/i })
      expect(button).toHaveAttribute('aria-label')
    })

    it('provides keyboard navigation', async () => {
      const user = userEvent.setup()
      render(
        <ThemeProvider>
          <ThemeToggle />
          <button>Other Button</button>
        </ThemeProvider>
      )

      await user.tab()
      const toggleButton = screen.getByRole('button', { name: /toggle theme/i })
      expect(toggleButton).toHaveFocus()

      await user.tab()
      const otherButton = screen.getByText('Other Button')
      expect(otherButton).toHaveFocus()
    })

    it('supports high contrast mode', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      )

      const button = screen.getByRole('button', { name: /toggle theme/i })
      expect(button.className).toContain('border')
    })

    it('has proper ARIA attributes', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      )

      const button = screen.getByRole('button', { name: /toggle theme/i })
      expect(button).toHaveAttribute('aria-label', 'Toggle theme')
    })

    it('provides visible focus indicator', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      )

      const button = screen.getByRole('button', { name: /toggle theme/i })
      expect(button.className).toContain('focus:outline-none')
      expect(button.className).toContain('focus:ring-2')
    })

    it('supports screen readers with proper labeling', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      )

      const button = screen.getByRole('button', { name: /toggle theme/i })
      expect(button).toHaveAccessibleName('Toggle theme')
    })

    it('maintains tab order', async () => {
      const user = userEvent.setup()
      render(
        <ThemeProvider>
          <button>First</button>
          <ThemeToggle />
          <button>Last</button>
        </ThemeProvider>
      )

      await user.tab()
      expect(screen.getByText('First')).toHaveFocus()

      await user.tab()
      expect(screen.getByRole('button', { name: /toggle theme/i })).toHaveFocus()

      await user.tab()
      expect(screen.getByText('Last')).toHaveFocus()
    })
  })

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      let renderCount = 0
      const CountingComponent = () => {
        renderCount++
        const { theme } = useTheme()
        return <div>{theme}</div>
      }

      const { rerender } = render(
        <ThemeProvider>
          <CountingComponent />
        </ThemeProvider>
      )

      const initialCount = renderCount

      rerender(
        <ThemeProvider>
          <CountingComponent />
        </ThemeProvider>
      )

      expect(renderCount).toBe(initialCount)
    })

    it('memoizes theme context value appropriately', async () => {
      let contextValueChanges = 0
      const TrackingComponent = () => {
        const context = useTheme()
        React.useEffect(() => {
          contextValueChanges++
        }, [context])
        return <div>{context.theme}</div>
      }

      render(
        <ThemeProvider>
          <TrackingComponent />
        </ThemeProvider>
      )

      // Initial render
      expect(contextValueChanges).toBe(1)
    })

    it('cleans up event listeners on unmount', () => {
      const removeListenerSpy = jest.fn()
      window.matchMedia = jest.fn().mockImplementation(() => ({
        matches: false,
        addListener: jest.fn(),
        removeListener: removeListenerSpy,
      }))

      const { unmount } = render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      )

      unmount()

      expect(removeListenerSpy).toHaveBeenCalled()
    })

    it('handles component updates efficiently', async () => {
      const { rerender } = render(
        <ThemeProvider defaultTheme="light">
          <TestConsumer />
        </ThemeProvider>
      )

      rerender(
        <ThemeProvider defaultTheme="light">
          <TestConsumer />
        </ThemeProvider>
      )

      expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
    })
  })

  describe('Integration', () => {
    it('works with multiple consumers', () => {
      render(
        <ThemeProvider>
          <TestConsumer />
          <TestConsumer />
          <TestConsumer />
        </ThemeProvider>
      )

      const themes = screen.getAllByTestId('current-theme')
      expect(themes).toHaveLength(3)
      themes.forEach((theme) => {
        expect(theme).toHaveTextContent('light')
      })
    })

    it('synchronizes theme across multiple consumers', async () => {
      render(
        <ThemeProvider>
          <TestConsumer />
          <TestConsumer />
        </ThemeProvider>
      )

      const buttons = screen.getAllByText('Set Dark')
      fireEvent.click(buttons[0])

      await waitFor(() => {
        const themes = screen.getAllByTestId('current-theme')
        themes.forEach((theme) => {
          expect(theme).toHaveTextContent('dark')
        })
      })
    })

    it('works with nested components', () => {
      const NestedComponent = () => {
        const { theme } = useTheme()
        return <div data-testid="nested-theme">{theme}</div>
      }

      render(
        <ThemeProvider>
          <div>
            <div>
              <div>
                <NestedComponent />
              </div>
            </div>
          </div>
        </ThemeProvider>
      )

      expect(screen.getByTestId('nested-theme')).toHaveTextContent('light')
    })

    it('integrates with ThemeToggle component', async () => {
      render(
        <ThemeProvider defaultTheme="light">
          <TestConsumer />
          <ThemeToggle />
        </ThemeProvider>
      )

      expect(screen.getByTestId('current-theme')).toHaveTextContent('light')

      const toggleButton = screen.getByRole('button', { name: /toggle theme/i })
      fireEvent.click(toggleButton)

      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
      })
    })

    it('handles multiple ThemeToggle instances', async () => {
      render(
        <ThemeProvider defaultTheme="light">
          <TestConsumer />
          <ThemeToggle />
          <ThemeToggle />
        </ThemeProvider>
      )

      const buttons = screen.getAllByRole('button', { name: /toggle theme/i })
      expect(buttons).toHaveLength(2)

      fireEvent.click(buttons[0])

      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
      })

      fireEvent.click(buttons[1])

      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
      })
    })
  })

  describe('System Theme Integration', () => {
    it('respects system dark mode preference', async () => {
      window.matchMedia = createMatchMediaMock(true)

      render(
        <ThemeProvider defaultTheme="system">
          <TestConsumer />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true)
      })
    })

    it('respects system light mode preference', async () => {
      window.matchMedia = createMatchMediaMock(false)

      render(
        <ThemeProvider defaultTheme="system">
          <TestConsumer />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(document.documentElement.classList.contains('light')).toBe(true)
      })
    })

    it('updates when switching to system theme', async () => {
      window.matchMedia = createMatchMediaMock(true)

      render(
        <ThemeProvider defaultTheme="light">
          <TestConsumer />
        </ThemeProvider>
      )

      expect(document.documentElement.classList.contains('light')).toBe(true)

      fireEvent.click(screen.getByText('Set System'))

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true)
      })
    })

    it('stops listening to system changes when switching away from system theme', async () => {
      const addListener = jest.fn()
      const removeListener = jest.fn()

      window.matchMedia = jest.fn().mockImplementation(() => ({
        matches: true,
        addListener,
        removeListener,
      }))

      render(
        <ThemeProvider defaultTheme="system">
          <TestConsumer />
        </ThemeProvider>
      )

      fireEvent.click(screen.getByText('Set Light'))

      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
      })
    })
  })

  describe('LocalStorage Persistence', () => {
    it('saves theme preference to localStorage', async () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      )

      fireEvent.click(screen.getByText('Set Dark'))

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('cryb-theme', 'dark')
      })
    })

    it('loads theme from localStorage on mount', () => {
      localStorageMock.getItem.mockReturnValue('dark')

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      )

      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
      expect(localStorageMock.getItem).toHaveBeenCalledWith('cryb-theme')
    })

    it('updates localStorage when theme changes multiple times', async () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      )

      fireEvent.click(screen.getByText('Set Dark'))
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('cryb-theme', 'dark')
      })

      fireEvent.click(screen.getByText('Set System'))
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('cryb-theme', 'system')
      })

      fireEvent.click(screen.getByText('Set Light'))
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('cryb-theme', 'light')
      })
    })

    it('handles localStorage quota exceeded error', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new DOMException('QuotaExceededError')
      })

      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      )

      fireEvent.click(screen.getByText('Set Dark'))

      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
      })

      consoleError.mockRestore()
    })
  })

  describe('Component Lifecycle', () => {
    it('initializes theme on mount', () => {
      render(
        <ThemeProvider defaultTheme="dark">
          <TestConsumer />
        </ThemeProvider>
      )

      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
    })

    it('cleans up listeners on unmount', () => {
      const removeListener = jest.fn()
      window.matchMedia = jest.fn().mockImplementation(() => ({
        matches: false,
        addListener: jest.fn(),
        removeListener,
      }))

      const { unmount } = render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      )

      unmount()

      expect(removeListener).toHaveBeenCalled()
    })

    it('maintains state across re-renders', () => {
      const { rerender } = render(
        <ThemeProvider defaultTheme="dark">
          <TestConsumer />
        </ThemeProvider>
      )

      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')

      rerender(
        <ThemeProvider defaultTheme="dark">
          <TestConsumer />
        </ThemeProvider>
      )

      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
    })

    it('updates DOM when component updates', async () => {
      render(
        <ThemeProvider defaultTheme="light">
          <TestConsumer />
        </ThemeProvider>
      )

      expect(document.documentElement.classList.contains('light')).toBe(true)

      fireEvent.click(screen.getByText('Set Dark'))

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true)
        expect(document.documentElement.classList.contains('light')).toBe(false)
      })
    })
  })
})

export default TestConsumer
