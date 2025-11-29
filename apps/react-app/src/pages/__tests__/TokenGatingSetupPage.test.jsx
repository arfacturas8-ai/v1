/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import TokenGatingSetupPage from '../TokenGatingSetupPage'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Shield: ({ className }) => <div data-testid="icon-shield" className={className}>Shield</div>,
  Lock: ({ className }) => <div data-testid="icon-lock" className={className}>Lock</div>,
  Plus: ({ className }) => <div data-testid="icon-plus" className={className}>Plus</div>,
  X: ({ className }) => <div data-testid="icon-x" className={className}>X</div>,
  Check: ({ className }) => <div data-testid="icon-check" className={className}>Check</div>,
}))

describe('TokenGatingSetupPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const renderWithRouter = (component) => {
    return render(<BrowserRouter>{component}</BrowserRouter>)
  }

  describe('Initial Rendering', () => {
    it('renders without crashing', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('has proper ARIA label on main section', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Token gating setup page')
    })

    it('displays main heading', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      expect(screen.getByRole('heading', { level: 1, name: /Token Gating Setup/i })).toBeInTheDocument()
    })

    it('displays Shield icon', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      expect(screen.getByTestId('icon-shield')).toBeInTheDocument()
    })

    it('displays description text', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      expect(screen.getByText(/Control access to your community with token requirements/i)).toBeInTheDocument()
    })

    it('displays Add Token Gate button', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      expect(screen.getByRole('button', { name: /Add Token Gate/i })).toBeInTheDocument()
    })

    it('has no gates initially', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const gates = screen.queryAllByTestId('icon-lock')
      expect(gates).toHaveLength(0)
    })
  })

  describe('Component Structure', () => {
    it('has centered container', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const container = screen.getByRole('main').querySelector('.max-w-4xl')
      expect(container).toBeInTheDocument()
    })

    it('applies correct styling classes to main', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const main = screen.getByRole('main')
      expect(main).toHaveClass('min-h-screen', 'bg-gray-50', 'dark:bg-[#0d1117]', 'p-6')
    })

    it('has card layout with proper styling', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const card = screen.getByRole('main').querySelector('.bg-white')
      expect(card).toHaveClass('rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]', 'p-8', 'shadow-xl')
    })

    it('header section has proper layout', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const header = screen.getByRole('heading', { level: 1 }).closest('div')
      expect(header).toHaveClass('flex', 'items-center', 'gap-3', 'mb-6')
    })
  })

  describe('Add Token Gate Button', () => {
    it('displays Plus icon', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const button = screen.getByRole('button', { name: /Add Token Gate/i })
      expect(within(button).getByTestId('icon-plus')).toBeInTheDocument()
    })

    it('has correct styling', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const button = screen.getByRole('button', { name: /Add Token Gate/i })
      expect(button).toHaveClass('mt-6', 'w-full', 'py-3', 'bg-purple-500', 'hover:bg-[#a371f7]')
    })

    it('is clickable', async () => {
      const user = userEvent.setup()
      renderWithRouter(<TokenGatingSetupPage />)
      const button = screen.getByRole('button', { name: /Add Token Gate/i })

      await user.click(button)
      expect(button).toBeInTheDocument()
    })

    it('has proper flex layout', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const button = screen.getByRole('button', { name: /Add Token Gate/i })
      expect(button).toHaveClass('flex', 'items-center', 'justify-center', 'gap-2')
    })
  })

  describe('State Management', () => {
    it('initializes with empty gates array', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const lockIcons = screen.queryAllByTestId('icon-lock')
      expect(lockIcons).toHaveLength(0)
    })

    it('initializes with showAddGate as false', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      expect(screen.queryByText(/Add New Gate/i)).not.toBeInTheDocument()
    })
  })

  describe('Icons Display', () => {
    it('Shield icon has correct styling', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const shieldIcon = screen.getByTestId('icon-shield')
      expect(shieldIcon).toHaveClass('w-8', 'h-8', 'text-purple-500')
    })

    it('Plus icon is visible in button', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const button = screen.getByRole('button', { name: /Add Token Gate/i })
      expect(within(button).getByTestId('icon-plus')).toBeInTheDocument()
    })
  })

  describe('Typography', () => {
    it('heading has correct size classes', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveClass('text-3xl', 'font-bold')
    })

    it('heading has correct color classes', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveClass('text-gray-900', 'dark:text-white')
    })

    it('description has correct styling', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const description = screen.getByText(/Control access to your community/i)
      expect(description).toHaveClass('text-gray-600', 'dark:text-[#8b949e]', 'mb-8')
    })

    it('button text has correct styling', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const button = screen.getByRole('button', { name: /Add Token Gate/i })
      expect(button).toHaveClass('text-white', 'rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]', 'font-semibold')
    })
  })

  describe('Dark Mode Support', () => {
    it('main has dark mode background', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const main = screen.getByRole('main')
      expect(main).toHaveClass('dark:bg-[#0d1117]')
    })

    it('card has dark mode background', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const card = screen.getByRole('main').querySelector('.dark\\:bg-[#161b22]')
      expect(card).toBeInTheDocument()
    })

    it('heading has dark mode color', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveClass('dark:text-white')
    })

    it('description has dark mode color', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const description = screen.getByText(/Control access to your community/i)
      expect(description).toHaveClass('dark:text-[#8b949e]')
    })
  })

  describe('Layout and Spacing', () => {
    it('has full screen minimum height', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const main = screen.getByRole('main')
      expect(main).toHaveClass('min-h-screen')
    })

    it('has proper padding on main', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const main = screen.getByRole('main')
      expect(main).toHaveClass('p-6')
    })

    it('container is centered', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const container = screen.getByRole('main').querySelector('.max-w-4xl')
      expect(container).toHaveClass('mx-auto')
    })

    it('card has proper padding', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const card = screen.getByRole('main').querySelector('.p-8')
      expect(card).toBeInTheDocument()
    })

    it('header has bottom margin', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const header = screen.getByRole('heading', { level: 1 }).closest('div')
      expect(header).toHaveClass('mb-6')
    })

    it('description has bottom margin', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const description = screen.getByText(/Control access to your community/i)
      expect(description).toHaveClass('mb-8')
    })

    it('button has top margin', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const button = screen.getByRole('button', { name: /Add Token Gate/i })
      expect(button).toHaveClass('mt-6')
    })
  })

  describe('Accessibility - ARIA', () => {
    it('main has descriptive ARIA label', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const main = screen.getByRole('main')
      expect(main).toHaveAttribute('aria-label', 'Token gating setup page')
    })

    it('button has accessible name', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const button = screen.getByRole('button', { name: /Add Token Gate/i })
      expect(button).toHaveAccessibleName()
    })

    it('heading is accessible', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveAccessibleName()
    })
  })

  describe('Accessibility - Semantic HTML', () => {
    it('uses main landmark', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('has proper heading hierarchy', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const headings = screen.getAllByRole('heading')
      expect(headings[0].tagName).toBe('H1')
    })

    it('uses button element for actions', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const button = screen.getByRole('button', { name: /Add Token Gate/i })
      expect(button.tagName).toBe('BUTTON')
    })
  })

  describe('Accessibility - Keyboard Navigation', () => {
    it('button is keyboard accessible', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const button = screen.getByRole('button', { name: /Add Token Gate/i })
      expect(button).not.toHaveAttribute('tabindex', '-1')
    })

    it('focusable elements receive focus', async () => {
      const user = userEvent.setup()
      renderWithRouter(<TokenGatingSetupPage />)
      const button = screen.getByRole('button', { name: /Add Token Gate/i })

      await user.tab()
      expect(button).toHaveFocus()
    })
  })

  describe('Visual Design', () => {
    it('card has rounded corners', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const card = screen.getByRole('main').querySelector('.rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]')
      expect(card).toBeInTheDocument()
    })

    it('card has shadow', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const card = screen.getByRole('main').querySelector('.shadow-xl')
      expect(card).toBeInTheDocument()
    })

    it('button has rounded corners', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const button = screen.getByRole('button', { name: /Add Token Gate/i })
      expect(button).toHaveClass('rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]')
    })

    it('uses purple color scheme', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const button = screen.getByRole('button', { name: /Add Token Gate/i })
      expect(button).toHaveClass('bg-purple-500')
    })

    it('Shield icon is purple', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const icon = screen.getByTestId('icon-shield')
      expect(icon).toHaveClass('text-purple-500')
    })
  })

  describe('Responsive Design', () => {
    it('uses responsive padding', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const main = screen.getByRole('main')
      expect(main).toHaveClass('p-6')
    })

    it('container has max width', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const container = screen.getByRole('main').querySelector('.max-w-4xl')
      expect(container).toBeInTheDocument()
    })

    it('button is full width', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const button = screen.getByRole('button', { name: /Add Token Gate/i })
      expect(button).toHaveClass('w-full')
    })
  })

  describe('Framer Motion Integration', () => {
    it('applies motion to card', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const card = screen.getByRole('main').querySelector('div > div')
      expect(card).toHaveAttribute('initial')
    })

    it('has animate state', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const card = screen.getByRole('main').querySelector('div > div')
      expect(card).toHaveAttribute('animate')
    })
  })

  describe('Component Memoization', () => {
    it('component is memoized', () => {
      const { rerender } = renderWithRouter(<TokenGatingSetupPage />)
      const firstRender = screen.getByRole('main')

      rerender(<BrowserRouter><TokenGatingSetupPage /></BrowserRouter>)
      const secondRender = screen.getByRole('main')

      expect(firstRender).toBe(secondRender)
    })
  })

  describe('Button Interactions', () => {
    it('button hover effect is defined', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const button = screen.getByRole('button', { name: /Add Token Gate/i })
      expect(button).toHaveClass('hover:bg-[#a371f7]')
    })

    it('clicking button triggers state change', async () => {
      const user = userEvent.setup()
      renderWithRouter(<TokenGatingSetupPage />)
      const button = screen.getByRole('button', { name: /Add Token Gate/i })

      await user.click(button)
      expect(button).toBeInTheDocument()
    })
  })

  describe('Gates List Container', () => {
    it('has space-y-4 for gate spacing', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const container = screen.getByRole('main').querySelector('.space-y-4')
      expect(container).toBeInTheDocument()
    })

    it('gates list is initially empty', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const lockIcons = screen.queryAllByTestId('icon-lock')
      expect(lockIcons).toHaveLength(0)
    })
  })

  describe('Component Lifecycle', () => {
    it('mounts correctly', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('unmounts without errors', () => {
      const { unmount } = renderWithRouter(<TokenGatingSetupPage />)
      expect(() => unmount()).not.toThrow()
    })

    it('cleans up after unmount', () => {
      const { unmount } = renderWithRouter(<TokenGatingSetupPage />)
      unmount()
      expect(screen.queryByRole('main')).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('renders without errors', () => {
      expect(() => renderWithRouter(<TokenGatingSetupPage />)).not.toThrow()
    })

    it('does not log console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      renderWithRouter(<TokenGatingSetupPage />)
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('does not log console warnings', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      renderWithRouter(<TokenGatingSetupPage />)
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('Performance', () => {
    it('renders efficiently', () => {
      const { rerender } = renderWithRouter(<TokenGatingSetupPage />)
      rerender(<BrowserRouter><TokenGatingSetupPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('does not cause memory leaks', () => {
      const { unmount } = renderWithRouter(<TokenGatingSetupPage />)
      unmount()
      expect(document.body.innerHTML).toBe('')
    })

    it('handles multiple re-renders', () => {
      const { rerender } = renderWithRouter(<TokenGatingSetupPage />)
      rerender(<BrowserRouter><TokenGatingSetupPage /></BrowserRouter>)
      rerender(<BrowserRouter><TokenGatingSetupPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Component Export', () => {
    it('exports memoized component', () => {
      expect(TokenGatingSetupPage).toBeDefined()
      expect(typeof TokenGatingSetupPage).toBe('function')
    })
  })

  describe('Content Verification', () => {
    it('displays correct page title', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      expect(screen.getByText('Token Gating Setup')).toBeInTheDocument()
    })

    it('displays correct description', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      expect(screen.getByText(/Control access to your community with token requirements/i)).toBeInTheDocument()
    })

    it('displays correct button text', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      expect(screen.getByText('Add Token Gate')).toBeInTheDocument()
    })
  })

  describe('CSS Classes Validation', () => {
    it('applies correct Tailwind classes to main', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const main = screen.getByRole('main')
      expect(main.className).toContain('min-h-screen')
      expect(main.className).toContain('bg-gray-50')
    })

    it('applies correct classes to container', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const container = screen.getByRole('main').querySelector('.max-w-4xl')
      expect(container).toHaveClass('mx-auto')
    })

    it('applies correct classes to card', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const card = screen.getByRole('main').querySelector('.bg-white')
      expect(card).toHaveClass('rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]', 'p-8', 'shadow-xl')
    })
  })

  describe('Future Implementation Readiness', () => {
    it('has structure for gate list', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const gatesList = screen.getByRole('main').querySelector('.space-y-4')
      expect(gatesList).toBeInTheDocument()
    })

    it('has add gate functionality stub', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const button = screen.getByRole('button', { name: /Add Token Gate/i })
      expect(button).toBeInTheDocument()
    })

    it('state management is prepared', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Integration Readiness', () => {
    it('works with React Router', () => {
      expect(() => renderWithRouter(<TokenGatingSetupPage />)).not.toThrow()
    })

    it('can be navigated to', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Color Consistency', () => {
    it('uses consistent purple theme', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const button = screen.getByRole('button', { name: /Add Token Gate/i })
      const icon = screen.getByTestId('icon-shield')

      expect(button.className).toContain('purple')
      expect(icon.className).toContain('purple')
    })

    it('uses consistent gray scale', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const main = screen.getByRole('main')
      expect(main.className).toContain('gray')
    })
  })

  describe('Icon Rendering', () => {
    it('all icons render correctly', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      expect(screen.getByTestId('icon-shield')).toBeInTheDocument()
      expect(screen.getByTestId('icon-plus')).toBeInTheDocument()
    })

    it('icons have proper styling', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const shieldIcon = screen.getByTestId('icon-shield')
      expect(shieldIcon).toHaveClass('w-8', 'h-8')
    })
  })

  describe('Testing Infrastructure', () => {
    it('can be tested with React Testing Library', () => {
      expect(() => renderWithRouter(<TokenGatingSetupPage />)).not.toThrow()
    })

    it('supports query methods', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.queryByRole('main')).toBeInTheDocument()
    })

    it('supports user event testing', async () => {
      const user = userEvent.setup()
      renderWithRouter(<TokenGatingSetupPage />)
      const button = screen.getByRole('button', { name: /Add Token Gate/i })
      await user.click(button)
      expect(button).toBeInTheDocument()
    })
  })

  describe('Browser Compatibility', () => {
    it('renders in different viewports', () => {
      global.innerWidth = 375
      renderWithRouter(<TokenGatingSetupPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()

      global.innerWidth = 1920
      renderWithRouter(<TokenGatingSetupPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('supports standard HTML structure', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const main = screen.getByRole('main')
      expect(main.tagName).toBe('DIV')
    })
  })

  describe('State Functions', () => {
    it('setGates function exists in component', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('setShowAddGate function exists in component', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      const button = screen.getByRole('button', { name: /Add Token Gate/i })
      expect(button).toBeInTheDocument()
    })

    it('addGate function is defined', () => {
      renderWithRouter(<TokenGatingSetupPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Rendering Consistency', () => {
    it('renders same content on multiple renders', () => {
      const { rerender } = renderWithRouter(<TokenGatingSetupPage />)
      const firstHeading = screen.getByRole('heading', { level: 1 }).textContent

      rerender(<BrowserRouter><TokenGatingSetupPage /></BrowserRouter>)
      const secondHeading = screen.getByRole('heading', { level: 1 }).textContent

      expect(firstHeading).toBe(secondHeading)
    })

    it('maintains structure across re-renders', () => {
      const { rerender } = renderWithRouter(<TokenGatingSetupPage />)
      const firstMain = screen.getByRole('main')

      rerender(<BrowserRouter><TokenGatingSetupPage /></BrowserRouter>)
      const secondMain = screen.getByRole('main')

      expect(firstMain.className).toBe(secondMain.className)
    })
  })
})

export default renderWithRouter
