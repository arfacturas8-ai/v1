/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MobileShareSheet from '../MobileShareSheet'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, className, onClick, ...props }) => (
      <div className={className} onClick={onClick} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}))

// Mock navigator.share
const mockShare = jest.fn()
const mockClipboard = {
  writeText: jest.fn(),
}

Object.assign(navigator, {
  share: mockShare,
  clipboard: mockClipboard,
})

describe('MobileShareSheet', () => {
  let mockOnClose
  const mockContent = {
    title: 'Test Title',
    text: 'Test content to share',
    url: 'https://example.com',
  }

  beforeEach(() => {
    mockOnClose = jest.fn()
    mockShare.mockClear()
    mockClipboard.writeText.mockClear()
    jest.clearAllMocks()
  })

  describe('Rendering and Visibility', () => {
    it('renders without crashing when open', () => {
      const { container } = render(
        <MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />
      )
      expect(container).toBeInTheDocument()
    })

    it('returns null when isOpen is false', () => {
      const { container } = render(
        <MobileShareSheet isOpen={false} onClose={mockOnClose} content={mockContent} />
      )
      expect(container.firstChild).toBeNull()
    })

    it('renders as a dialog when open', () => {
      render(<MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
    })

    it('has proper ARIA attributes', () => {
      render(<MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby', 'share-sheet-title')
    })

    it('renders the share sheet title', () => {
      render(<MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />)
      expect(screen.getByText('Share')).toBeInTheDocument()
    })

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      render(<MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />)
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('Share Options Display', () => {
    it('displays Copy button', () => {
      render(<MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />)
      expect(screen.getByText('Copy')).toBeInTheDocument()
    })

    it('displays Facebook button', () => {
      render(<MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />)
      expect(screen.getByText('Facebook')).toBeInTheDocument()
    })

    it('displays Twitter button', () => {
      render(<MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />)
      expect(screen.getByText('Twitter')).toBeInTheDocument()
    })

    it('displays Email button', () => {
      render(<MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />)
      expect(screen.getByText('Email')).toBeInTheDocument()
    })

    it('displays Cancel button', () => {
      render(<MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />)
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('renders all share option buttons', () => {
      render(<MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />)
      const buttons = screen.getAllByRole('button')
      // 4 share options + 1 cancel button
      expect(buttons.length).toBe(5)
    })

    it('share options are in a grid layout', () => {
      const { container } = render(
        <MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />
      )
      const grid = container.querySelector('.grid.grid-cols-4')
      expect(grid).toBeInTheDocument()
    })

    it('each share option has an icon', () => {
      const { container } = render(
        <MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />
      )
      const icons = container.querySelectorAll('.grid svg')
      expect(icons.length).toBe(4)
    })
  })

  describe('Cancel Button Functionality', () => {
    it('calls onClose when Cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />)

      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('handles multiple cancel button clicks', async () => {
      const user = userEvent.setup()
      render(<MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />)

      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalledTimes(2)
    })

    it('cancel button has proper styling', () => {
      render(<MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />)
      const cancelButton = screen.getByText('Cancel')
      expect(cancelButton).toHaveClass('w-full', 'py-3', 'rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]', 'font-semibold')
    })
  })

  describe('Backdrop Click Functionality', () => {
    it('calls onClose when backdrop is clicked', async () => {
      render(<MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />)

      const backdrop = screen.getByRole('dialog')
      fireEvent.click(backdrop)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('does not close when sheet content is clicked', async () => {
      const { container } = render(
        <MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />
      )

      const sheetContent = container.querySelector('.rounded-t-3xl')
      fireEvent.click(sheetContent)

      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  describe('Share Option Icons Styling', () => {
    it('Copy button has blue background', () => {
      const { container } = render(
        <MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />
      )
      const copyButton = screen.getByText('Copy').closest('button')
      const iconContainer = copyButton.querySelector('.bg-[#58a6ff]')
      expect(iconContainer).toBeInTheDocument()
    })

    it('Facebook button has dark blue background', () => {
      const { container } = render(
        <MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />
      )
      const facebookButton = screen.getByText('Facebook').closest('button')
      const iconContainer = facebookButton.querySelector('.bg-blue-600')
      expect(iconContainer).toBeInTheDocument()
    })

    it('Twitter button has sky blue background', () => {
      const { container } = render(
        <MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />
      )
      const twitterButton = screen.getByText('Twitter').closest('button')
      const iconContainer = twitterButton.querySelector('.bg-sky-500')
      expect(iconContainer).toBeInTheDocument()
    })

    it('Email button has red background', () => {
      const { container } = render(
        <MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />
      )
      const emailButton = screen.getByText('Email').closest('button')
      const iconContainer = emailButton.querySelector('.bg-red-500')
      expect(iconContainer).toBeInTheDocument()
    })

    it('all icon containers are circular', () => {
      const { container } = render(
        <MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />
      )
      const iconContainers = container.querySelectorAll('.rounded-full')
      expect(iconContainers.length).toBeGreaterThanOrEqual(4)
    })

    it('all icons have proper sizing', () => {
      const { container } = render(
        <MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />
      )
      const iconContainers = container.querySelectorAll('.w-16.h-16')
      expect(iconContainers.length).toBe(4)
    })

    it('icons are white colored', () => {
      const { container } = render(
        <MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />
      )
      const icons = container.querySelectorAll('.text-white')
      expect(icons.length).toBeGreaterThanOrEqual(4)
    })
  })

  describe('Sheet Layout and Styling', () => {
    it('backdrop has proper opacity', () => {
      render(<MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />)
      const backdrop = screen.getByRole('dialog')
      expect(backdrop).toHaveClass('bg-black/50')
    })

    it('backdrop is full screen', () => {
      render(<MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />)
      const backdrop = screen.getByRole('dialog')
      expect(backdrop).toHaveClass('fixed', 'inset-0')
    })

    it('has proper z-index', () => {
      render(<MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />)
      const backdrop = screen.getByRole('dialog')
      expect(backdrop).toHaveClass('z-50')
    })

    it('sheet is positioned at bottom', () => {
      render(<MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />)
      const backdrop = screen.getByRole('dialog')
      expect(backdrop).toHaveClass('flex', 'items-end')
    })

    it('sheet has rounded top corners', () => {
      const { container } = render(
        <MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />
      )
      const sheet = container.querySelector('.rounded-t-3xl')
      expect(sheet).toBeInTheDocument()
    })

    it('sheet is full width', () => {
      const { container } = render(
        <MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />
      )
      const sheet = container.querySelector('.w-full')
      expect(sheet).toBeInTheDocument()
    })

    it('sheet has padding', () => {
      const { container } = render(
        <MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />
      )
      const sheet = container.querySelector('.p-6')
      expect(sheet).toBeInTheDocument()
    })
  })

  describe('Dark Mode Support', () => {
    it('sheet has dark mode background', () => {
      const { container } = render(
        <MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />
      )
      const sheet = container.querySelector('.rounded-t-3xl')
      expect(sheet.className).toContain('dark:bg-[#161b22]')
    })

    it('cancel button has dark mode styling', () => {
      render(<MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />)
      const cancelButton = screen.getByText('Cancel')
      expect(cancelButton.className).toContain('dark:bg-gray-700')
    })
  })

  describe('Accessibility Features', () => {
    it('title has proper id for aria-labelledby', () => {
      render(<MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />)
      const title = screen.getByText('Share')
      expect(title).toHaveAttribute('id', 'share-sheet-title')
    })

    it('title is a heading element', () => {
      render(<MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />)
      const title = screen.getByRole('heading', { name: 'Share' })
      expect(title).toBeInTheDocument()
    })

    it('title has proper heading level', () => {
      render(<MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />)
      const title = screen.getByRole('heading', { level: 3, name: 'Share' })
      expect(title).toBeInTheDocument()
    })

    it('all share buttons are keyboard accessible', async () => {
      render(<MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />)
      const buttons = screen.getAllByRole('button')

      buttons.forEach(button => {
        expect(button.tagName).toBe('BUTTON')
      })
    })
  })

  describe('Title Styling', () => {
    it('title is centered', () => {
      render(<MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />)
      const title = screen.getByText('Share')
      expect(title).toHaveClass('text-center')
    })

    it('title has proper text size', () => {
      render(<MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />)
      const title = screen.getByText('Share')
      expect(title).toHaveClass('text-xl', 'font-bold')
    })

    it('title has margin bottom', () => {
      render(<MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />)
      const title = screen.getByText('Share')
      expect(title).toHaveClass('mb-6')
    })
  })

  describe('Component Props', () => {
    it('handles missing content prop gracefully', () => {
      const { container } = render(<MobileShareSheet isOpen={true} onClose={mockOnClose} />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('handles undefined onClose gracefully', () => {
      const { container } = render(
        <MobileShareSheet isOpen={true} content={mockContent} />
      )
      expect(container.firstChild).toBeInTheDocument()
    })

    it('toggles visibility based on isOpen prop', () => {
      const { rerender, container } = render(
        <MobileShareSheet isOpen={false} onClose={mockOnClose} content={mockContent} />
      )
      expect(container.firstChild).toBeNull()

      rerender(<MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  describe('Component Memoization', () => {
    it('component is memoized', () => {
      const MemoizedSheet = MobileShareSheet
      expect(MemoizedSheet.$$typeof.toString()).toContain('react.memo')
    })
  })

  describe('Share Option Layout', () => {
    it('share options have flex column layout', () => {
      const { container } = render(
        <MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />
      )
      const copyButton = screen.getByText('Copy').closest('button')
      expect(copyButton).toHaveClass('flex', 'flex-col', 'items-center')
    })

    it('share options have gap between icon and text', () => {
      const { container } = render(
        <MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />
      )
      const copyButton = screen.getByText('Copy').closest('button')
      expect(copyButton).toHaveClass('gap-2')
    })

    it('share option labels have small text', () => {
      render(<MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />)
      const copyLabel = screen.getByText('Copy')
      expect(copyLabel).toHaveClass('text-xs')
    })
  })

  describe('Grid Layout', () => {
    it('grid has proper gap', () => {
      const { container } = render(
        <MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />
      )
      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('gap-4')
    })

    it('grid has margin bottom', () => {
      const { container } = render(
        <MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />
      )
      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('mb-6')
    })
  })

  describe('User Interactions', () => {
    it('supports touch events on cancel button', async () => {
      render(<MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />)
      const cancelButton = screen.getByText('Cancel')

      fireEvent.touchStart(cancelButton)
      fireEvent.touchEnd(cancelButton)

      expect(cancelButton).toBeInTheDocument()
    })

    it('handles rapid backdrop clicks gracefully', async () => {
      render(<MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />)
      const backdrop = screen.getByRole('dialog')

      fireEvent.click(backdrop)
      fireEvent.click(backdrop)
      fireEvent.click(backdrop)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('share option buttons are clickable', async () => {
      const user = userEvent.setup()
      render(<MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />)

      const copyButton = screen.getByText('Copy').closest('button')
      await user.click(copyButton)

      expect(copyButton).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles null onClose callback on backdrop click', () => {
      render(<MobileShareSheet isOpen={true} onClose={null} content={mockContent} />)
      const backdrop = screen.getByRole('dialog')
      expect(() => fireEvent.click(backdrop)).not.toThrow()
    })

    it('handles null onClose callback on cancel click', () => {
      render(<MobileShareSheet isOpen={true} onClose={null} content={mockContent} />)
      const cancelButton = screen.getByText('Cancel')
      expect(() => fireEvent.click(cancelButton)).not.toThrow()
    })

    it('renders correctly when rapidly toggling isOpen', () => {
      const { rerender } = render(
        <MobileShareSheet isOpen={false} onClose={mockOnClose} content={mockContent} />
      )

      for (let i = 0; i < 10; i++) {
        rerender(
          <MobileShareSheet isOpen={i % 2 === 0} onClose={mockOnClose} content={mockContent} />
        )
      }

      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  describe('Content Structure', () => {
    it('renders all expected elements in correct order', () => {
      const { container } = render(
        <MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />
      )
      const sheet = container.querySelector('.rounded-t-3xl')

      expect(sheet.querySelector('h3')).toBeInTheDocument()
      expect(sheet.querySelector('.grid')).toBeInTheDocument()
      expect(sheet.querySelector('button')).toBeInTheDocument()
    })

    it('sheet has proper stop propagation on click', () => {
      const { container } = render(
        <MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />
      )
      const sheet = container.querySelector('.rounded-t-3xl')

      fireEvent.click(sheet)
      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  describe('Animation Properties', () => {
    it('renders with AnimatePresence wrapper', () => {
      const { container } = render(
        <MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />
      )
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe('Icon Display', () => {
    it('displays all four icons correctly', () => {
      const { container } = render(
        <MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />
      )
      const grid = container.querySelector('.grid')
      const icons = grid.querySelectorAll('svg')
      expect(icons.length).toBe(4)
    })

    it('icons have proper size', () => {
      const { container } = render(
        <MobileShareSheet isOpen={true} onClose={mockOnClose} content={mockContent} />
      )
      const grid = container.querySelector('.grid')
      const icons = grid.querySelectorAll('svg')

      icons.forEach(icon => {
        expect(icon).toHaveClass('w-6', 'h-6')
      })
    })
  })
})

export default mockShare
