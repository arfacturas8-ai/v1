import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      // Check localStorage first
      const savedTheme = localStorage.getItem('cryb-theme') as Theme | null
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme
      }

      // Check system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light'
      }
    } catch (error) {
      console.warn('Theme initialization error:', error)
    }

    // Default to dark mode (80% user preference as per design system)
    return 'dark'
  })

  useEffect(() => {
    // Apply theme to document root
    const root = document.documentElement

    // Remove previous theme
    root.removeAttribute('data-theme')

    // Add transition class for smooth theme changes
    root.classList.add('theme-transitioning')

    // Set new theme
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light')
    }

    // Remove transition class after animation completes
    const timeout = setTimeout(() => {
      root.classList.remove('theme-transitioning')
    }, 300)

    // Save to localStorage
    localStorage.setItem('cryb-theme', theme)

    return () => clearTimeout(timeout)
  }, [theme])

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)')

    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't manually set a preference
      const savedTheme = localStorage.getItem('cryb-theme')
      if (!savedTheme) {
        setThemeState(e.matches ? 'light' : 'dark')
      }
    }

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
    // Legacy browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
  }, [])

  const toggleTheme = () => {
    setThemeState(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    setTheme
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export default ThemeContext
