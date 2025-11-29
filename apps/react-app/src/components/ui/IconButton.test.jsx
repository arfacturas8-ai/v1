import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import IconButton from './IconButton'

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Loader2: ({ className, size, ...props }) => (
    <svg
      data-testid="loader-icon"
      className={className}
      width={size}
      height={size}
      {...props}
    >
      <title>Loading</title>
    </svg>
  )
}))

// Mock icon component
const MockIcon = ({ size, ...props }) => (
  <svg
    data-testid="mock-icon"
    width={size}
    height={size}
    {...props}
  >
    <title>Icon</title>
  </svg>
)

describe('IconButton', () => {
  describe('Basic Rendering', () => {
    it('should render button element', () => {
      render(<IconButton icon={<MockIcon />} aria-label="Test button" />)
      const button = screen.getByRole('button', { name: /test button/i })
      expect(button).toBeInTheDocument()
    })

    it('should render with icon', () => {
      render(<IconButton icon={<MockIcon />} aria-label="Test button" />)
      expect(screen.getByTestId('mock-icon')).toBeInTheDocument()
    })

    it('should render without icon', () => {
      render(<IconButton aria-label="Test button" />)
      const button = screen.getByRole('button', { name: /test button/i })
      expect(button).toBeInTheDocument()
      expect(screen.queryByTestId('mock-icon')).not.toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(
        <IconButton
          icon={<MockIcon />}
          aria-label="Test button"
          className="custom-class"
        />
      )
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })

    it('should set displayName', () => {
      expect(IconButton.displayName).toBe('IconButton')
    })
  })

  describe('Icon Display', () => {
    it('should pass correct size to icon (xs)', () => {
      render(<IconButton icon={<MockIcon />} size="xs" aria-label="Test" />)
      const icon = screen.getByTestId('mock-icon')
      expect(icon).toHaveAttribute('width', '12')
      expect(icon).toHaveAttribute('height', '12')
    })

    it('should pass correct size to icon (sm)', () => {
      render(<IconButton icon={<MockIcon />} size="sm" aria-label="Test" />)
      const icon = screen.getByTestId('mock-icon')
      expect(icon).toHaveAttribute('width', '14')
      expect(icon).toHaveAttribute('height', '14')
    })

    it('should pass correct size to icon (md)', () => {
      render(<IconButton icon={<MockIcon />} size="md" aria-label="Test" />)
      const icon = screen.getByTestId('mock-icon')
      expect(icon).toHaveAttribute('width', '16')
      expect(icon).toHaveAttribute('height', '16')
    })

    it('should pass correct size to icon (lg)', () => {
      render(<IconButton icon={<MockIcon />} size="lg" aria-label="Test" />)
      const icon = screen.getByTestId('mock-icon')
      expect(icon).toHaveAttribute('width', '18')
      expect(icon).toHaveAttribute('height', '18')
    })

    it('should pass correct size to icon (xl)', () => {
      render(<IconButton icon={<MockIcon />} size="xl" aria-label="Test" />)
      const icon = screen.getByTestId('mock-icon')
      expect(icon).toHaveAttribute('width', '20')
      expect(icon).toHaveAttribute('height', '20')
    })

    it('should set aria-hidden on icon', () => {
      render(<IconButton icon={<MockIcon />} aria-label="Test" />)
      const icon = screen.getByTestId('mock-icon')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('Click Handler', () => {
    it('should call onClick when clicked', () => {
      const handleClick = vi.fn()
      render(
        <IconButton
          icon={<MockIcon />}
          onClick={handleClick}
          aria-label="Test button"
        />
      )
      const button = screen.getByRole('button')
      fireEvent.click(button)
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should not call onClick when disabled', () => {
      const handleClick = vi.fn()
      render(
        <IconButton
          icon={<MockIcon />}
          onClick={handleClick}
          disabled
          aria-label="Test button"
        />
      )
      const button = screen.getByRole('button')
      fireEvent.click(button)
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('should not call onClick when loading', () => {
      const handleClick = vi.fn()
      render(
        <IconButton
          icon={<MockIcon />}
          onClick={handleClick}
          loading
          aria-label="Test button"
        />
      )
      const button = screen.getByRole('button')
      fireEvent.click(button)
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('should receive event object in onClick', () => {
      const handleClick = vi.fn()
      render(
        <IconButton
          icon={<MockIcon />}
          onClick={handleClick}
          aria-label="Test button"
        />
      )
      const button = screen.getByRole('button')
      fireEvent.click(button)
      expect(handleClick).toHaveBeenCalledWith(expect.any(Object))
    })
  })

  describe('Tooltip', () => {
    it('should set title attribute with tooltip prop', () => {
      render(
        <IconButton
          icon={<MockIcon />}
          tooltip="Click me"
          aria-label="Test button"
        />
      )
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('title', 'Click me')
    })

    it('should use aria-label as title when tooltip not provided', () => {
      render(<IconButton icon={<MockIcon />} aria-label="Test button" />)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('title', 'Test button')
    })

    it('should prefer tooltip over aria-label for title', () => {
      render(
        <IconButton
          icon={<MockIcon />}
          tooltip="Tooltip text"
          aria-label="Aria label"
        />
      )
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('title', 'Tooltip text')
    })
  })

  describe('Size Variants', () => {
    it('should apply xs size classes', () => {
      render(<IconButton icon={<MockIcon />} size="xs" aria-label="Test" />)
      const button = screen.getByRole('button')
      expect(button.className).toContain('w-6')
      expect(button.className).toContain('h-6')
    })

    it('should apply sm size classes', () => {
      render(<IconButton icon={<MockIcon />} size="sm" aria-label="Test" />)
      const button = screen.getByRole('button')
      expect(button.className).toContain('w-8')
      expect(button.className).toContain('h-8')
    })

    it('should apply md size classes (default)', () => {
      render(<IconButton icon={<MockIcon />} aria-label="Test" />)
      const button = screen.getByRole('button')
      expect(button.className).toContain('w-10')
      expect(button.className).toContain('h-10')
    })

    it('should apply lg size classes', () => {
      render(<IconButton icon={<MockIcon />} size="lg" aria-label="Test" />)
      const button = screen.getByRole('button')
      expect(button.className).toContain('w-12')
      expect(button.className).toContain('h-12')
    })

    it('should apply xl size classes', () => {
      render(<IconButton icon={<MockIcon />} size="xl" aria-label="Test" />)
      const button = screen.getByRole('button')
      expect(button.className).toContain('w-14')
      expect(button.className).toContain('h-14')
    })
  })

  describe('Variant Styles', () => {
    it('should apply primary variant classes', () => {
      render(<IconButton icon={<MockIcon />} variant="primary" aria-label="Test" />)
      const button = screen.getByRole('button')
      expect(button.className).toContain('bg-gradient-accent')
    })

    it('should apply secondary variant classes', () => {
      render(<IconButton icon={<MockIcon />} variant="secondary" aria-label="Test" />)
      const button = screen.getByRole('button')
      expect(button.className).toContain('glass')
    })

    it('should apply ghost variant classes (default)', () => {
      render(<IconButton icon={<MockIcon />} aria-label="Test" />)
      const button = screen.getByRole('button')
      expect(button.className).toContain('bg-transparent')
    })

    it('should apply outline variant classes', () => {
      render(<IconButton icon={<MockIcon />} variant="outline" aria-label="Test" />)
      const button = screen.getByRole('button')
      expect(button.className).toContain('border')
      expect(button.className).toContain('border-accent-primary')
    })

    it('should apply danger variant classes', () => {
      render(<IconButton icon={<MockIcon />} variant="danger" aria-label="Test" />)
      const button = screen.getByRole('button')
      expect(button.className).toContain('text-error')
    })

    it('should apply success variant classes', () => {
      render(<IconButton icon={<MockIcon />} variant="success" aria-label="Test" />)
      const button = screen.getByRole('button')
      expect(button.className).toContain('text-success')
    })

    it('should apply warning variant classes', () => {
      render(<IconButton icon={<MockIcon />} variant="warning" aria-label="Test" />)
      const button = screen.getByRole('button')
      expect(button.className).toContain('text-warning')
    })

    it('should apply glass variant classes', () => {
      render(<IconButton icon={<MockIcon />} variant="glass" aria-label="Test" />)
      const button = screen.getByRole('button')
      expect(button.className).toContain('glass-light')
    })
  })

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<IconButton icon={<MockIcon />} disabled aria-label="Test" />)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should apply disabled classes', () => {
      render(<IconButton icon={<MockIcon />} disabled aria-label="Test" />)
      const button = screen.getByRole('button')
      expect(button.className).toContain('disabled:opacity-50')
    })

    it('should have pointer-events-none when disabled', () => {
      render(<IconButton icon={<MockIcon />} disabled aria-label="Test" />)
      const button = screen.getByRole('button')
      expect(button.className).toContain('disabled:pointer-events-none')
    })

    it('should not be disabled by default', () => {
      render(<IconButton icon={<MockIcon />} aria-label="Test" />)
      const button = screen.getByRole('button')
      expect(button).not.toBeDisabled()
    })
  })

  describe('Loading State', () => {
    it('should show loader icon when loading', () => {
      render(<IconButton icon={<MockIcon />} loading aria-label="Test" />)
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument()
      expect(screen.queryByTestId('mock-icon')).not.toBeInTheDocument()
    })

    it('should disable button when loading', () => {
      render(<IconButton icon={<MockIcon />} loading aria-label="Test" />)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should set aria-busy when loading', () => {
      render(<IconButton icon={<MockIcon />} loading aria-label="Test" />)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-busy', 'true')
    })

    it('should not set aria-busy when not loading', () => {
      render(<IconButton icon={<MockIcon />} aria-label="Test" />)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-busy', 'false')
    })

    it('should apply animate-spin to loader', () => {
      render(<IconButton icon={<MockIcon />} loading aria-label="Test" />)
      const loader = screen.getByTestId('loader-icon')
      expect(loader).toHaveClass('animate-spin')
    })

    it('should set aria-hidden on loader icon', () => {
      render(<IconButton icon={<MockIcon />} loading aria-label="Test" />)
      const loader = screen.getByTestId('loader-icon')
      expect(loader).toHaveAttribute('aria-hidden', 'true')
    })

    it('should pass correct size to loader (md)', () => {
      render(<IconButton icon={<MockIcon />} loading size="md" aria-label="Test" />)
      const loader = screen.getByTestId('loader-icon')
      expect(loader).toHaveAttribute('width', '16')
      expect(loader).toHaveAttribute('height', '16')
    })
  })

  describe('Button Type', () => {
    it('should default to button type', () => {
      render(<IconButton icon={<MockIcon />} aria-label="Test" />)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'button')
    })

    it('should accept submit type', () => {
      render(<IconButton icon={<MockIcon />} type="submit" aria-label="Test" />)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'submit')
    })

    it('should accept reset type', () => {
      render(<IconButton icon={<MockIcon />} type="reset" aria-label="Test" />)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'reset')
    })
  })

  describe('Accessibility', () => {
    it('should have aria-label', () => {
      render(<IconButton icon={<MockIcon />} aria-label="Close dialog" />)
      const button = screen.getByRole('button', { name: /close dialog/i })
      expect(button).toBeInTheDocument()
    })

    it('should support custom aria attributes', () => {
      render(
        <IconButton
          icon={<MockIcon />}
          aria-label="Menu"
          aria-expanded="true"
          aria-haspopup="true"
        />
      )
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-expanded', 'true')
      expect(button).toHaveAttribute('aria-haspopup', 'true')
    })

    it('should be keyboard accessible', () => {
      const handleClick = vi.fn()
      render(
        <IconButton
          icon={<MockIcon />}
          onClick={handleClick}
          aria-label="Test"
        />
      )
      const button = screen.getByRole('button')
      button.focus()
      expect(button).toHaveFocus()
    })

    it('should have proper focus ring classes', () => {
      render(<IconButton icon={<MockIcon />} aria-label="Test" />)
      const button = screen.getByRole('button')
      expect(button.className).toContain('focus:ring-4')
      expect(button.className).toContain('focus:outline-none')
    })

    it('should support data attributes', () => {
      render(
        <IconButton
          icon={<MockIcon />}
          aria-label="Test"
          data-testid="custom-test-id"
          data-tracking="button-click"
        />
      )
      const button = screen.getByTestId('custom-test-id')
      expect(button).toHaveAttribute('data-tracking', 'button-click')
    })
  })

  describe('Ref Forwarding', () => {
    it('should forward ref to button element', () => {
      const ref = React.createRef()
      render(<IconButton ref={ref} icon={<MockIcon />} aria-label="Test" />)
      expect(ref.current).toBeInstanceOf(HTMLButtonElement)
    })

    it('should allow calling focus on ref', () => {
      const ref = React.createRef()
      render(<IconButton ref={ref} icon={<MockIcon />} aria-label="Test" />)
      ref.current.focus()
      expect(ref.current).toHaveFocus()
    })
  })

  describe('Additional Props', () => {
    it('should spread additional props to button', () => {
      render(
        <IconButton
          icon={<MockIcon />}
          aria-label="Test"
          id="custom-id"
          name="custom-name"
        />
      )
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('id', 'custom-id')
      expect(button).toHaveAttribute('name', 'custom-name')
    })

    it('should support data-test attributes', () => {
      render(
        <IconButton
          icon={<MockIcon />}
          aria-label="Test"
          data-test="icon-button"
        />
      )
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('data-test', 'icon-button')
    })
  })

  describe('Base Classes', () => {
    it('should apply base layout classes', () => {
      render(<IconButton icon={<MockIcon />} aria-label="Test" />)
      const button = screen.getByRole('button')
      expect(button.className).toContain('inline-flex')
      expect(button.className).toContain('items-center')
      expect(button.className).toContain('justify-center')
    })

    it('should apply rounded-full class', () => {
      render(<IconButton icon={<MockIcon />} aria-label="Test" />)
      const button = screen.getByRole('button')
      expect(button.className).toContain('rounded-full')
    })

    it('should apply transition classes', () => {
      render(<IconButton icon={<MockIcon />} aria-label="Test" />)
      const button = screen.getByRole('button')
      expect(button.className).toContain('transition-all')
      expect(button.className).toContain('duration-200')
    })

    it('should apply select-none class', () => {
      render(<IconButton icon={<MockIcon />} aria-label="Test" />)
      const button = screen.getByRole('button')
      expect(button.className).toContain('select-none')
    })
  })
})

export default MockIcon
