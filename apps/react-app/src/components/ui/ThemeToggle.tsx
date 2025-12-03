import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

interface ThemeToggleProps {
  variant?: 'icon' | 'switch' | 'full'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ThemeToggle({ variant = 'switch', size = 'md', className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()

  // Icon-only button variant
  if (variant === 'icon') {
    return (
      <button
        onClick={toggleTheme}
        className={`theme-toggle-icon theme-toggle-${size} ${className}`}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        <div className="theme-toggle-icon-wrapper">
          <Sun
            className="theme-toggle-sun"
            size={size === 'sm' ? 16 : size === 'md' ? 20 : 24}
          />
          <Moon
            className="theme-toggle-moon"
            size={size === 'sm' ? 16 : size === 'md' ? 20 : 24}
          />
        </div>
      </button>
    )
  }

  // Full button with text
  if (variant === 'full') {
    return (
      <button
        onClick={toggleTheme}
        className={`theme-toggle-full theme-toggle-${size} ${className}`}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        <div className="theme-toggle-icon-wrapper">
          <Sun className="theme-toggle-sun" size={20} />
          <Moon className="theme-toggle-moon" size={20} />
        </div>
        <span className="theme-toggle-text">
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </span>
      </button>
    )
  }

  // Animated switch variant (default)
  return (
    <button
      onClick={toggleTheme}
      className={`theme-toggle-switch theme-toggle-${size} ${className}`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      role="switch"
      aria-checked={theme === 'light'}
    >
      <div className="theme-toggle-track">
        <div className="theme-toggle-thumb">
          <Sun className="theme-toggle-thumb-sun" size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />
          <Moon className="theme-toggle-thumb-moon" size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />
        </div>
      </div>
    </button>
  )
}



const styles = {
  card: {
    background: 'rgba(20, 20, 20, 0.6)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    padding: '16px'
  },
  button: {
    background: 'linear-gradient(to right, #58a6ff, #a371f7)',
    border: 'none',
    borderRadius: '12px',
    color: '#ffffff',
    padding: '12px 24px',
    cursor: 'pointer',
    fontWeight: '600',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
  },
  container: {
    background: '#0d1117',
    padding: '16px'
  },
  title: {
    color: '#ffffff',
    fontSize: '20px',
    fontWeight: '600',
    margin: '0 0 16px 0'
  },
  text: {
    color: '#A0A0A0',
    fontSize: '14px',
    margin: '0'
  },
  textTertiary: {
    color: '#666666',
    fontSize: '14px'
  }
}

export default ThemeToggle
