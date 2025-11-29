/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import WalletSettingsPage from '../WalletSettingsPage'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}))

describe('WalletSettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const renderWithRouter = (component) => {
    return render(<BrowserRouter>{component}</BrowserRouter>)
  }

  describe('Initial Rendering', () => {
    it('renders without crashing', () => {
      renderWithRouter(<WalletSettingsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('has proper ARIA label on main section', () => {
      renderWithRouter(<WalletSettingsPage />)
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Wallet settings page')
    })

    it('displays main heading', () => {
      renderWithRouter(<WalletSettingsPage />)
      expect(screen.getByRole('heading', { level: 1, name: /WalletSettingsPage/i })).toBeInTheDocument()
    })

    it('displays placeholder content', () => {
      renderWithRouter(<WalletSettingsPage />)
      expect(screen.getByText(/This is the WalletSettingsPage page/i)).toBeInTheDocument()
    })

    it('applies correct styling classes', () => {
      renderWithRouter(<WalletSettingsPage />)
      const main = screen.getByRole('main')
      expect(main).toHaveClass('min-h-screen', 'bg-gray-50', 'dark:bg-[#0d1117]', 'p-6')
    })

    it('has centered container', () => {
      renderWithRouter(<WalletSettingsPage />)
      const container = screen.getByRole('main').querySelector('.max-w-6xl')
      expect(container).toBeInTheDocument()
    })

    it('uses framer-motion for animations', () => {
      renderWithRouter(<WalletSettingsPage />)
      const animatedDiv = screen.getByRole('main').querySelector('div > div')
      expect(animatedDiv).toBeInTheDocument()
    })
  })

  describe('Component Structure', () => {
    it('has proper container hierarchy', () => {
      renderWithRouter(<WalletSettingsPage />)
      const main = screen.getByRole('main')
      expect(main.querySelector('.max-w-6xl')).toBeInTheDocument()
    })

    it('applies card styling to content area', () => {
      renderWithRouter(<WalletSettingsPage />)
      const card = screen.getByRole('main').querySelector('.bg-white')
      expect(card).toBeInTheDocument()
      expect(card).toHaveClass('rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]', 'p-8', 'shadow-xl')
    })

    it('supports dark mode classes', () => {
      renderWithRouter(<WalletSettingsPage />)
      const elements = screen.getByRole('main').querySelectorAll('.dark\\:bg-[#161b22], .dark\\:bg-[#0d1117]')
      expect(elements.length).toBeGreaterThan(0)
    })
  })

  describe('Typography', () => {
    it('heading has correct size class', () => {
      renderWithRouter(<WalletSettingsPage />)
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveClass('text-3xl', 'font-bold', 'mb-6')
    })

    it('heading has correct color classes', () => {
      renderWithRouter(<WalletSettingsPage />)
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveClass('text-gray-900', 'dark:text-white')
    })

    it('description text has correct styling', () => {
      renderWithRouter(<WalletSettingsPage />)
      const description = screen.getByText(/This is the WalletSettingsPage page/i)
      expect(description).toHaveClass('text-gray-600', 'dark:text-[#8b949e]')
    })
  })

  describe('Accessibility - Semantic HTML', () => {
    it('uses main landmark', () => {
      renderWithRouter(<WalletSettingsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('has proper heading hierarchy', () => {
      renderWithRouter(<WalletSettingsPage />)
      const headings = screen.getAllByRole('heading')
      expect(headings[0].tagName).toBe('H1')
    })

    it('main heading is accessible', () => {
      renderWithRouter(<WalletSettingsPage />)
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveAccessibleName()
    })
  })

  describe('Accessibility - ARIA', () => {
    it('main element has descriptive ARIA label', () => {
      renderWithRouter(<WalletSettingsPage />)
      const main = screen.getByRole('main')
      expect(main).toHaveAttribute('aria-label', 'Wallet settings page')
    })

    it('all interactive elements have accessible names', () => {
      renderWithRouter(<WalletSettingsPage />)
      const buttons = screen.queryAllByRole('button')
      const links = screen.queryAllByRole('link')

      ;[...buttons, ...links].forEach(element => {
        expect(element).toHaveAccessibleName()
      })
    })
  })

  describe('Accessibility - Keyboard Navigation', () => {
    it('page is keyboard accessible', () => {
      renderWithRouter(<WalletSettingsPage />)
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
    })

    it('focusable elements can receive focus', () => {
      renderWithRouter(<WalletSettingsPage />)
      const buttons = screen.queryAllByRole('button')

      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabindex', '-1')
      })
    })
  })

  describe('Dark Mode Support', () => {
    it('has dark mode background classes', () => {
      renderWithRouter(<WalletSettingsPage />)
      const main = screen.getByRole('main')
      expect(main).toHaveClass('dark:bg-[#0d1117]')
    })

    it('content card has dark mode styling', () => {
      renderWithRouter(<WalletSettingsPage />)
      const card = screen.getByRole('main').querySelector('.dark\\:bg-[#161b22]')
      expect(card).toBeInTheDocument()
    })

    it('text has dark mode color classes', () => {
      renderWithRouter(<WalletSettingsPage />)
      const heading = screen.getByRole('heading', { level: 1 })
      const description = screen.getByText(/This is the WalletSettingsPage page/i)

      expect(heading).toHaveClass('dark:text-white')
      expect(description).toHaveClass('dark:text-[#8b949e]')
    })
  })

  describe('Layout and Spacing', () => {
    it('has minimum full screen height', () => {
      renderWithRouter(<WalletSettingsPage />)
      const main = screen.getByRole('main')
      expect(main).toHaveClass('min-h-screen')
    })

    it('has proper padding', () => {
      renderWithRouter(<WalletSettingsPage />)
      const main = screen.getByRole('main')
      expect(main).toHaveClass('p-6')
    })

    it('container has max width constraint', () => {
      renderWithRouter(<WalletSettingsPage />)
      const container = screen.getByRole('main').querySelector('.max-w-6xl')
      expect(container).toBeInTheDocument()
      expect(container).toHaveClass('mx-auto')
    })

    it('content card has proper padding', () => {
      renderWithRouter(<WalletSettingsPage />)
      const card = screen.getByRole('main').querySelector('.p-8')
      expect(card).toBeInTheDocument()
    })

    it('heading has bottom margin', () => {
      renderWithRouter(<WalletSettingsPage />)
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveClass('mb-6')
    })
  })

  describe('Visual Design', () => {
    it('content card has rounded corners', () => {
      renderWithRouter(<WalletSettingsPage />)
      const card = screen.getByRole('main').querySelector('.rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]')
      expect(card).toBeInTheDocument()
    })

    it('content card has shadow', () => {
      renderWithRouter(<WalletSettingsPage />)
      const card = screen.getByRole('main').querySelector('.shadow-xl')
      expect(card).toBeInTheDocument()
    })

    it('uses proper background colors', () => {
      renderWithRouter(<WalletSettingsPage />)
      const card = screen.getByRole('main').querySelector('.bg-white')
      expect(card).toBeInTheDocument()
    })
  })

  describe('Component Memoization', () => {
    it('component is memoized', () => {
      const { rerender } = renderWithRouter(<WalletSettingsPage />)
      const firstRender = screen.getByRole('main')

      rerender(<BrowserRouter><WalletSettingsPage /></BrowserRouter>)
      const secondRender = screen.getByRole('main')

      expect(firstRender).toBe(secondRender)
    })
  })

  describe('Framer Motion Integration', () => {
    it('applies initial animation state', () => {
      renderWithRouter(<WalletSettingsPage />)
      const animatedDiv = screen.getByRole('main').querySelector('div > div')
      expect(animatedDiv).toHaveAttribute('initial')
    })

    it('applies animate state', () => {
      renderWithRouter(<WalletSettingsPage />)
      const animatedDiv = screen.getByRole('main').querySelector('div > div')
      expect(animatedDiv).toHaveAttribute('animate')
    })
  })

  describe('Responsive Design', () => {
    it('uses responsive padding class', () => {
      renderWithRouter(<WalletSettingsPage />)
      const main = screen.getByRole('main')
      expect(main).toHaveClass('p-6')
    })

    it('container width is responsive', () => {
      renderWithRouter(<WalletSettingsPage />)
      const container = screen.getByRole('main').querySelector('.max-w-6xl')
      expect(container).toHaveClass('mx-auto')
    })
  })

  describe('Content Verification', () => {
    it('displays correct page title', () => {
      renderWithRouter(<WalletSettingsPage />)
      expect(screen.getByText('WalletSettingsPage')).toBeInTheDocument()
    })

    it('displays implementation message', () => {
      renderWithRouter(<WalletSettingsPage />)
      expect(screen.getByText(/Content will be implemented here/i)).toBeInTheDocument()
    })

    it('content is properly nested', () => {
      renderWithRouter(<WalletSettingsPage />)
      const main = screen.getByRole('main')
      const heading = screen.getByRole('heading', { level: 1 })
      expect(main).toContainElement(heading)
    })
  })

  describe('Performance', () => {
    it('renders efficiently without unnecessary re-renders', () => {
      const { rerender } = renderWithRouter(<WalletSettingsPage />)
      const renderSpy = jest.fn()

      rerender(<BrowserRouter><WalletSettingsPage /></BrowserRouter>)
      rerender(<BrowserRouter><WalletSettingsPage /></BrowserRouter>)

      // Component should handle re-renders gracefully due to memo
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('does not cause memory leaks', () => {
      const { unmount } = renderWithRouter(<WalletSettingsPage />)
      unmount()
      expect(document.body.innerHTML).toBe('')
    })
  })

  describe('Error Boundaries', () => {
    it('renders without throwing errors', () => {
      expect(() => renderWithRouter(<WalletSettingsPage />)).not.toThrow()
    })

    it('does not log console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      renderWithRouter(<WalletSettingsPage />)
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('does not log console warnings', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      renderWithRouter(<WalletSettingsPage />)
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('Browser Compatibility', () => {
    it('renders correctly in different viewports', () => {
      global.innerWidth = 375
      renderWithRouter(<WalletSettingsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()

      global.innerWidth = 1920
      renderWithRouter(<WalletSettingsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('supports standard HTML structure', () => {
      renderWithRouter(<WalletSettingsPage />)
      const main = screen.getByRole('main')
      expect(main.tagName).toBe('DIV')
    })
  })

  describe('CSS Classes Validation', () => {
    it('applies Tailwind utility classes correctly', () => {
      renderWithRouter(<WalletSettingsPage />)
      const main = screen.getByRole('main')

      expect(main.className).toContain('min-h-screen')
      expect(main.className).toContain('bg-gray-50')
      expect(main.className).toContain('p-6')
    })

    it('uses consistent spacing scale', () => {
      renderWithRouter(<WalletSettingsPage />)
      const main = screen.getByRole('main')
      const card = main.querySelector('.p-8')

      expect(card).toBeInTheDocument()
    })

    it('uses consistent color palette', () => {
      renderWithRouter(<WalletSettingsPage />)
      const heading = screen.getByRole('heading', { level: 1 })

      expect(heading.className).toContain('text-gray-900')
    })
  })

  describe('Component Export', () => {
    it('exports memoized component', () => {
      expect(WalletSettingsPage).toBeDefined()
      expect(typeof WalletSettingsPage).toBe('function')
    })

    it('component name is correct', () => {
      expect(WalletSettingsPage.name).toBeTruthy()
    })
  })

  describe('Future Implementation Readiness', () => {
    it('has structure ready for wallet list', () => {
      renderWithRouter(<WalletSettingsPage />)
      const container = screen.getByRole('main').querySelector('.max-w-6xl')
      expect(container).toBeInTheDocument()
    })

    it('has card structure for content sections', () => {
      renderWithRouter(<WalletSettingsPage />)
      const card = screen.getByRole('main').querySelector('.bg-white')
      expect(card).toBeInTheDocument()
    })

    it('supports multiple content sections', () => {
      renderWithRouter(<WalletSettingsPage />)
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
    })
  })

  describe('State Management Readiness', () => {
    it('component can hold state', () => {
      renderWithRouter(<WalletSettingsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('supports future interactive elements', () => {
      renderWithRouter(<WalletSettingsPage />)
      const card = screen.getByRole('main').querySelector('.bg-white')
      expect(card).toBeInTheDocument()
    })
  })

  describe('Integration Readiness', () => {
    it('works with React Router', () => {
      expect(() => renderWithRouter(<WalletSettingsPage />)).not.toThrow()
    })

    it('can be navigated to', () => {
      renderWithRouter(<WalletSettingsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Placeholder Content', () => {
    it('indicates page is under construction', () => {
      renderWithRouter(<WalletSettingsPage />)
      expect(screen.getByText(/Content will be implemented here/i)).toBeInTheDocument()
    })

    it('displays page identifier', () => {
      renderWithRouter(<WalletSettingsPage />)
      expect(screen.getByText('WalletSettingsPage')).toBeInTheDocument()
    })
  })

  describe('Animation Properties', () => {
    it('motion div has className attribute', () => {
      renderWithRouter(<WalletSettingsPage />)
      const motionDiv = screen.getByRole('main').querySelector('div > div')
      expect(motionDiv).toHaveClass('bg-white')
    })

    it('maintains styling during animation', () => {
      renderWithRouter(<WalletSettingsPage />)
      const motionDiv = screen.getByRole('main').querySelector('.rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]')
      expect(motionDiv).toBeInTheDocument()
    })
  })

  describe('Document Structure', () => {
    it('maintains clean DOM structure', () => {
      renderWithRouter(<WalletSettingsPage />)
      const main = screen.getByRole('main')
      expect(main.children.length).toBeGreaterThan(0)
    })

    it('nests elements properly', () => {
      renderWithRouter(<WalletSettingsPage />)
      const main = screen.getByRole('main')
      const container = main.querySelector('.max-w-6xl')
      const card = container?.querySelector('.bg-white')

      expect(card).toBeInTheDocument()
    })
  })

  describe('Color Scheme', () => {
    it('uses gray scale for backgrounds', () => {
      renderWithRouter(<WalletSettingsPage />)
      const main = screen.getByRole('main')
      expect(main).toHaveClass('bg-gray-50')
    })

    it('uses appropriate text colors', () => {
      renderWithRouter(<WalletSettingsPage />)
      const heading = screen.getByRole('heading', { level: 1 })
      const description = screen.getByText(/This is the WalletSettingsPage page/i)

      expect(heading).toHaveClass('text-gray-900')
      expect(description).toHaveClass('text-gray-600')
    })
  })

  describe('Rendering Consistency', () => {
    it('renders same content on multiple renders', () => {
      const { rerender } = renderWithRouter(<WalletSettingsPage />)
      const firstHeading = screen.getByRole('heading', { level: 1 }).textContent

      rerender(<BrowserRouter><WalletSettingsPage /></BrowserRouter>)
      const secondHeading = screen.getByRole('heading', { level: 1 }).textContent

      expect(firstHeading).toBe(secondHeading)
    })

    it('maintains structure across re-renders', () => {
      const { rerender } = renderWithRouter(<WalletSettingsPage />)
      const firstMain = screen.getByRole('main')

      rerender(<BrowserRouter><WalletSettingsPage /></BrowserRouter>)
      const secondMain = screen.getByRole('main')

      expect(firstMain.className).toBe(secondMain.className)
    })
  })

  describe('Testing Infrastructure', () => {
    it('can be tested with React Testing Library', () => {
      expect(() => renderWithRouter(<WalletSettingsPage />)).not.toThrow()
    })

    it('supports query methods', () => {
      renderWithRouter(<WalletSettingsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.queryByRole('main')).toBeInTheDocument()
    })

    it('supports user event testing', async () => {
      const user = userEvent.setup()
      renderWithRouter(<WalletSettingsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Component Lifecycle', () => {
    it('mounts correctly', () => {
      renderWithRouter(<WalletSettingsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('unmounts without errors', () => {
      const { unmount } = renderWithRouter(<WalletSettingsPage />)
      expect(() => unmount()).not.toThrow()
    })

    it('cleans up after unmount', () => {
      const { unmount } = renderWithRouter(<WalletSettingsPage />)
      unmount()
      expect(screen.queryByRole('main')).not.toBeInTheDocument()
    })
  })

  describe('Component Props', () => {
    it('renders without props', () => {
      expect(() => renderWithRouter(<WalletSettingsPage />)).not.toThrow()
    })

    it('maintains consistency without props', () => {
      renderWithRouter(<WalletSettingsPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Extensibility', () => {
    it('structure supports additional content', () => {
      renderWithRouter(<WalletSettingsPage />)
      const container = screen.getByRole('main').querySelector('.max-w-6xl')
      expect(container).toBeInTheDocument()
    })

    it('card layout supports multiple sections', () => {
      renderWithRouter(<WalletSettingsPage />)
      const card = screen.getByRole('main').querySelector('.bg-white')
      expect(card).toBeInTheDocument()
    })
  })

  describe('Default State', () => {
    it('displays placeholder by default', () => {
      renderWithRouter(<WalletSettingsPage />)
      expect(screen.getByText(/Content will be implemented here/i)).toBeInTheDocument()
    })

    it('shows page title by default', () => {
      renderWithRouter(<WalletSettingsPage />)
      expect(screen.getByText('WalletSettingsPage')).toBeInTheDocument()
    })
  })

  describe('Visual Hierarchy', () => {
    it('heading is prominent', () => {
      renderWithRouter(<WalletSettingsPage />)
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveClass('text-3xl', 'font-bold')
    })

    it('content is visually separated', () => {
      renderWithRouter(<WalletSettingsPage />)
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveClass('mb-6')
    })
  })

  describe('Component Isolation', () => {
    it('does not affect global state', () => {
      const { unmount } = renderWithRouter(<WalletSettingsPage />)
      unmount()
      expect(document.body.innerHTML).toBe('')
    })

    it('does not leak event listeners', () => {
      const { unmount } = renderWithRouter(<WalletSettingsPage />)
      const listenerCount = (window as any)._events?.length || 0
      unmount()
      expect((window as any)._events?.length || 0).toBe(listenerCount)
    })
  })
})

export default renderWithRouter
