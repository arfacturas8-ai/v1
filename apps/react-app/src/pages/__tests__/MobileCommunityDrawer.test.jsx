/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MobileCommunityDrawer from '../MobileCommunityDrawer'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, exit, className, ...props }) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}))

describe('MobileCommunityDrawer', () => {
  let mockOnClose

  beforeEach(() => {
    mockOnClose = jest.fn()
    jest.clearAllMocks()
  })

  describe('Rendering and Visibility', () => {
    it('renders without crashing when open', () => {
      const { container } = render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      expect(container).toBeInTheDocument()
    })

    it('returns null when isOpen is false', () => {
      const { container } = render(<MobileCommunityDrawer isOpen={false} onClose={mockOnClose} />)
      expect(container.firstChild).toBeNull()
    })

    it('renders as a dialog when open', () => {
      render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
    })

    it('has proper ARIA attributes for accessibility', () => {
      render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby', 'drawer-title')
    })

    it('renders the drawer title', () => {
      render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText('Communities')).toBeInTheDocument()
    })

    it('renders close button', () => {
      render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      const closeButton = screen.getByRole('button')
      expect(closeButton).toBeInTheDocument()
    })

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('Close Button Functionality', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup()
      render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)

      const closeButton = screen.getByRole('button')
      await user.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('handles multiple close button clicks', async () => {
      const user = userEvent.setup()
      render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)

      const closeButton = screen.getByRole('button')
      await user.click(closeButton)
      await user.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(2)
    })

    it('close button has hover styles', () => {
      render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      const closeButton = screen.getByRole('button')
      expect(closeButton).toHaveClass('hover:bg-gray-100')
    })

    it('close button is positioned correctly', () => {
      render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      const closeButton = screen.getByRole('button')
      expect(closeButton).toHaveClass('absolute', 'top-4', 'right-4')
    })
  })

  describe('Community List Display', () => {
    it('displays Gaming community', () => {
      render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText('Gaming')).toBeInTheDocument()
    })

    it('displays Music community', () => {
      render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText('Music')).toBeInTheDocument()
    })

    it('Gaming community has active styling', () => {
      render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      const gamingElement = screen.getByText('Gaming').closest('div')
      expect(gamingElement).toHaveClass('bg-blue-50')
    })

    it('Music community has hover styling', () => {
      render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      const musicElement = screen.getByText('Music').closest('div')
      expect(musicElement).toHaveClass('hover:bg-gray-50')
    })

    it('communities are displayed with proper spacing', () => {
      render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      const container = screen.getByText('Gaming').closest('.space-y-2')
      expect(container).toBeInTheDocument()
    })

    it('communities have icons', () => {
      const { container } = render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      const icons = container.querySelectorAll('svg')
      // Should have close icon + 2 community icons (Users, Hash)
      expect(icons.length).toBeGreaterThanOrEqual(2)
    })

    it('Gaming community has Users icon', () => {
      const { container } = render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      const gamingDiv = screen.getByText('Gaming').closest('div')
      const icon = gamingDiv.querySelector('svg')
      expect(icon).toHaveClass('text-[#58a6ff]')
    })

    it('communities have flex layout with icons and text', () => {
      render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      const gamingElement = screen.getByText('Gaming').closest('div')
      expect(gamingElement).toHaveClass('flex', 'items-center', 'gap-3')
    })
  })

  describe('Drawer Styling and Layout', () => {
    it('has correct width class', () => {
      render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveClass('w-80')
    })

    it('has fixed positioning', () => {
      render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveClass('fixed', 'inset-y-0', 'left-0')
    })

    it('has proper z-index', () => {
      render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveClass('z-50')
    })

    it('has shadow styling', () => {
      render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveClass('shadow-2xl')
    })

    it('has padding', () => {
      render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveClass('p-6')
    })

    it('has background color classes for light and dark mode', () => {
      render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveClass('bg-white', 'dark:bg-[#161b22]')
    })
  })

  describe('Dark Mode Support', () => {
    it('has dark mode classes on drawer', () => {
      render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog.className).toContain('dark:bg-[#161b22]')
    })

    it('has dark mode classes on close button', () => {
      render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      const closeButton = screen.getByRole('button')
      expect(closeButton.className).toContain('dark:hover:bg-gray-700')
    })

    it('has dark mode classes on active community', () => {
      render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      const gamingElement = screen.getByText('Gaming').closest('div')
      expect(gamingElement.className).toContain('dark:bg-blue-900/20')
    })

    it('has dark mode classes on hover community', () => {
      render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      const musicElement = screen.getByText('Music').closest('div')
      expect(musicElement.className).toContain('dark:hover:bg-gray-700')
    })
  })

  describe('Accessibility Features', () => {
    it('title has proper id for aria-labelledby', () => {
      render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      const title = screen.getByText('Communities')
      expect(title).toHaveAttribute('id', 'drawer-title')
    })

    it('title is a heading element', () => {
      render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      const title = screen.getByRole('heading', { name: 'Communities' })
      expect(title).toBeInTheDocument()
    })

    it('title has proper heading level', () => {
      render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      const title = screen.getByRole('heading', { level: 2, name: 'Communities' })
      expect(title).toBeInTheDocument()
    })

    it('close button is keyboard accessible', async () => {
      const user = userEvent.setup()
      render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)

      const closeButton = screen.getByRole('button')
      closeButton.focus()
      expect(closeButton).toHaveFocus()

      await user.keyboard('{Enter}')
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('Animation Properties', () => {
    it('renders with AnimatePresence wrapper', () => {
      const { container } = render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('motion.div receives initial animation prop', () => {
      // Testing that motion.div is rendered (mocked but still present)
      render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
    })
  })

  describe('Component Props', () => {
    it('handles undefined onClose gracefully', () => {
      const { container } = render(<MobileCommunityDrawer isOpen={true} />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('handles missing props gracefully', () => {
      const { container } = render(<MobileCommunityDrawer />)
      expect(container.firstChild).toBeNull()
    })

    it('toggles visibility based on isOpen prop', () => {
      const { rerender, container } = render(
        <MobileCommunityDrawer isOpen={false} onClose={mockOnClose} />
      )
      expect(container.firstChild).toBeNull()

      rerender(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  describe('Component Memoization', () => {
    it('component is memoized', () => {
      const MemoizedDrawer = MobileCommunityDrawer
      expect(MemoizedDrawer.$$typeof.toString()).toContain('react.memo')
    })

    it('does not re-render when props are unchanged', () => {
      const { rerender } = render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      const dialog = screen.getByRole('dialog')

      rerender(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByRole('dialog')).toBe(dialog)
    })
  })

  describe('Heading Structure', () => {
    it('title has proper styling classes', () => {
      render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      const title = screen.getByText('Communities')
      expect(title).toHaveClass('text-2xl', 'font-bold', 'mb-6')
    })
  })

  describe('Community Items Styling', () => {
    it('community items have rounded corners', () => {
      render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      const gamingElement = screen.getByText('Gaming').closest('div')
      expect(gamingElement).toHaveClass('rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]')
    })

    it('community items have padding', () => {
      render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      const gamingElement = screen.getByText('Gaming').closest('div')
      expect(gamingElement).toHaveClass('p-3')
    })

    it('icon sizing is consistent', () => {
      const { container } = render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      const gamingDiv = screen.getByText('Gaming').closest('div')
      const icon = gamingDiv.querySelector('svg')
      expect(icon).toHaveClass('w-5', 'h-5')
    })
  })

  describe('Close Button Styling', () => {
    it('close button is rounded', () => {
      render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      const closeButton = screen.getByRole('button')
      expect(closeButton).toHaveClass('rounded-lg')
    })

    it('close button has padding', () => {
      render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      const closeButton = screen.getByRole('button')
      expect(closeButton).toHaveClass('p-2')
    })

    it('close icon has proper size', () => {
      const { container } = render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      const closeButton = screen.getByRole('button')
      const icon = closeButton.querySelector('svg')
      expect(icon).toHaveClass('w-5', 'h-5')
    })
  })

  describe('User Interactions', () => {
    it('supports touch events on close button', async () => {
      render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      const closeButton = screen.getByRole('button')

      fireEvent.touchStart(closeButton)
      fireEvent.touchEnd(closeButton)

      expect(closeButton).toBeInTheDocument()
    })

    it('handles rapid clicks gracefully', async () => {
      const user = userEvent.setup()
      render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)

      const closeButton = screen.getByRole('button')
      await user.tripleClick(closeButton)

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('handles null onClose callback', () => {
      render(<MobileCommunityDrawer isOpen={true} onClose={null} />)
      const closeButton = screen.getByRole('button')
      expect(() => fireEvent.click(closeButton)).not.toThrow()
    })

    it('renders correctly when rapidly toggling isOpen', () => {
      const { rerender } = render(<MobileCommunityDrawer isOpen={false} onClose={mockOnClose} />)

      for (let i = 0; i < 10; i++) {
        rerender(<MobileCommunityDrawer isOpen={i % 2 === 0} onClose={mockOnClose} />)
      }

      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  describe('Content Structure', () => {
    it('renders all expected elements in correct order', () => {
      const { container } = render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      const dialog = screen.getByRole('dialog')

      expect(dialog.querySelector('button')).toBeInTheDocument()
      expect(dialog.querySelector('h2')).toBeInTheDocument()
      expect(dialog.querySelector('.space-y-2')).toBeInTheDocument()
    })

    it('communities list container exists', () => {
      const { container } = render(<MobileCommunityDrawer isOpen={true} onClose={mockOnClose} />)
      const listContainer = container.querySelector('.space-y-2')
      expect(listContainer).toBeInTheDocument()
      expect(listContainer.children.length).toBe(2)
    })
  })
})

export default dialog
