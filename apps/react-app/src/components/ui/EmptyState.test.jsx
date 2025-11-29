import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmptyState } from './EmptyState'
import { FileText, Users, MessageSquare, Inbox, Search } from 'lucide-react'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, transition, ...props }) => (
      <div data-testid="motion-div" {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}))

// Mock Button component
jest.mock('./button', () => ({
  Button: ({ children, onClick, variant, size, style, ...props }) => (
    <button onClick={onClick} data-variant={variant} data-size={size} style={style} {...props}>
      {children}
    </button>
  ),
}))

// Mock cn utility
jest.mock('../../lib/utils', () => ({
  cn: (...classes) => classes.filter(Boolean).join(' '),
}))

describe('EmptyState Component', () => {
  const mockAction = jest.fn()
  const mockSecondaryAction = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<EmptyState icon={<FileText size={64} />} title="No content" description="Add some content" />)
      expect(screen.getByText('No content')).toBeInTheDocument()
    })

    it('renders with minimal props', () => {
      render(<EmptyState title="Empty" />)
      expect(screen.getByText('Empty')).toBeInTheDocument()
    })

    it('renders title correctly', () => {
      render(<EmptyState title="Test Title" />)
      expect(screen.getByText('Test Title')).toBeInTheDocument()
    })

    it('renders description when provided', () => {
      render(<EmptyState title="Title" description="Test description" />)
      expect(screen.getByText('Test description')).toBeInTheDocument()
    })

    it('does not render description when not provided', () => {
      const { container } = render(<EmptyState title="Title" />)
      const paragraphs = container.querySelectorAll('p')
      expect(paragraphs.length).toBe(0)
    })

    it('applies custom className', () => {
      const { container } = render(<EmptyState title="Test" className="custom-class" />)
      expect(container.querySelector('.custom-class')).toBeInTheDocument()
    })

    it('renders motion.div wrapper', () => {
      render(<EmptyState title="Test" />)
      expect(screen.getByTestId('motion-div')).toBeInTheDocument()
    })

    it('applies default layout classes', () => {
      const { container } = render(<EmptyState title="Test" />)
      const wrapper = container.querySelector('.flex.flex-col')
      expect(wrapper).toBeInTheDocument()
    })
  })

  describe('Icon Variants', () => {
    it('renders FileText icon', () => {
      const { container } = render(<EmptyState icon={<FileText size={64} data-testid="file-icon" />} title="No files" />)
      expect(screen.getByTestId('file-icon')).toBeInTheDocument()
    })

    it('renders Users icon', () => {
      const { container } = render(<EmptyState icon={<Users size={64} data-testid="users-icon" />} title="No users" />)
      expect(screen.getByTestId('users-icon')).toBeInTheDocument()
    })

    it('renders MessageSquare icon', () => {
      const { container } = render(
        <EmptyState icon={<MessageSquare size={64} data-testid="message-icon" />} title="No messages" />
      )
      expect(screen.getByTestId('message-icon')).toBeInTheDocument()
    })

    it('renders Inbox icon', () => {
      const { container } = render(<EmptyState icon={<Inbox size={64} data-testid="inbox-icon" />} title="Empty inbox" />)
      expect(screen.getByTestId('inbox-icon')).toBeInTheDocument()
    })

    it('renders Search icon', () => {
      const { container } = render(
        <EmptyState icon={<Search size={64} data-testid="search-icon" />} title="No results" />
      )
      expect(screen.getByTestId('search-icon')).toBeInTheDocument()
    })

    it('renders custom icon component', () => {
      const CustomIcon = () => <div data-testid="custom-icon">Custom</div>
      render(<EmptyState icon={<CustomIcon />} title="Test" />)
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
    })

    it('wraps icon in styled container', () => {
      const { container } = render(<EmptyState icon={<FileText size={64} />} title="Test" />)
      const iconContainer = container.querySelector('.mb-6.rounded-full.p-6')
      expect(iconContainer).toBeInTheDocument()
    })

    it('applies CSS variables to icon container', () => {
      const { container } = render(<EmptyState icon={<FileText size={64} />} title="Test" />)
      const iconContainer = container.querySelector('.mb-6.rounded-full.p-6')
      expect(iconContainer).toHaveStyle({
        background: 'var(--bg-secondary)',
        color: 'var(--text-secondary)',
      })
    })

    it('does not render icon container when illustration is provided', () => {
      const illustration = <div data-testid="custom-illustration">Illustration</div>
      const { container } = render(<EmptyState illustration={illustration} title="Test" />)
      expect(container.querySelector('.mb-6.rounded-full.p-6')).not.toBeInTheDocument()
    })
  })

  describe('Messages and Text', () => {
    it('displays short title', () => {
      render(<EmptyState title="Empty" />)
      expect(screen.getByText('Empty')).toBeInTheDocument()
    })

    it('displays long title', () => {
      const longTitle = 'This is a very long title that should still be displayed properly without any issues'
      render(<EmptyState title={longTitle} />)
      expect(screen.getByText(longTitle)).toBeInTheDocument()
    })

    it('displays short description', () => {
      render(<EmptyState title="Title" description="Short description" />)
      expect(screen.getByText('Short description')).toBeInTheDocument()
    })

    it('displays long description', () => {
      const longDesc =
        'This is a very long description that provides detailed information about the empty state and what the user should do next'
      render(<EmptyState title="Title" description={longDesc} />)
      expect(screen.getByText(longDesc)).toBeInTheDocument()
    })

    it('renders title with proper heading level', () => {
      render(<EmptyState title="Test Title" />)
      const heading = screen.getByRole('heading', { level: 3 })
      expect(heading).toBeInTheDocument()
      expect(heading).toHaveTextContent('Test Title')
    })

    it('applies text styling to title', () => {
      render(<EmptyState title="Test" />)
      const title = screen.getByText('Test')
      expect(title).toHaveClass('text-2xl', 'font-bold', 'mb-3')
      expect(title).toHaveStyle({ color: 'var(--text-primary)' })
    })

    it('applies text styling to description', () => {
      render(<EmptyState title="Title" description="Description" />)
      const description = screen.getByText('Description')
      expect(description).toHaveClass('text-base', 'mb-6', 'max-w-md')
      expect(description).toHaveStyle({
        color: 'var(--text-secondary)',
        lineHeight: '1.6',
      })
    })

    it('handles multiline description', () => {
      const multilineDesc = 'Line one\nLine two\nLine three'
      render(<EmptyState title="Title" description={multilineDesc} />)
      expect(screen.getByText(multilineDesc)).toBeInTheDocument()
    })

    it('handles special characters in title', () => {
      render(<EmptyState title="No Results Found! (0)" />)
      expect(screen.getByText('No Results Found! (0)')).toBeInTheDocument()
    })

    it('handles special characters in description', () => {
      render(<EmptyState title="Title" description="Try searching with different terms & filters..." />)
      expect(screen.getByText(/Try searching with different terms & filters/)).toBeInTheDocument()
    })

    it('handles HTML entities correctly', () => {
      render(<EmptyState title="No items > 0" description="Count < 1" />)
      expect(screen.getByText('No items > 0')).toBeInTheDocument()
      expect(screen.getByText('Count < 1')).toBeInTheDocument()
    })
  })

  describe('Actions', () => {
    it('renders primary action button', () => {
      render(<EmptyState title="Test" actionLabel="Click Me" onAction={mockAction} />)
      expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument()
    })

    it('calls onAction when primary button is clicked', async () => {
      const user = userEvent.setup()
      render(<EmptyState title="Test" actionLabel="Click Me" onAction={mockAction} />)

      await user.click(screen.getByRole('button', { name: 'Click Me' }))
      expect(mockAction).toHaveBeenCalledTimes(1)
    })

    it('does not render action button without actionLabel', () => {
      const { container } = render(<EmptyState title="Test" onAction={mockAction} />)
      const buttons = container.querySelectorAll('button')
      expect(buttons.length).toBe(0)
    })

    it('does not render action button without onAction', () => {
      const { container } = render(<EmptyState title="Test" actionLabel="Click Me" />)
      const buttons = container.querySelectorAll('button')
      expect(buttons.length).toBe(0)
    })

    it('renders secondary action button', () => {
      render(
        <EmptyState
          title="Test"
          actionLabel="Primary"
          onAction={mockAction}
          secondaryActionLabel="Secondary"
          onSecondaryAction={mockSecondaryAction}
        />
      )
      expect(screen.getByRole('button', { name: 'Secondary' })).toBeInTheDocument()
    })

    it('calls onSecondaryAction when secondary button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <EmptyState
          title="Test"
          actionLabel="Primary"
          onAction={mockAction}
          secondaryActionLabel="Secondary"
          onSecondaryAction={mockSecondaryAction}
        />
      )

      await user.click(screen.getByRole('button', { name: 'Secondary' }))
      expect(mockSecondaryAction).toHaveBeenCalledTimes(1)
    })

    it('does not render secondary button without primary button', () => {
      render(<EmptyState title="Test" secondaryActionLabel="Secondary" onSecondaryAction={mockSecondaryAction} />)
      expect(screen.queryByRole('button', { name: 'Secondary' })).not.toBeInTheDocument()
    })

    it('applies correct button size', () => {
      render(<EmptyState title="Test" actionLabel="Click Me" onAction={mockAction} />)
      const button = screen.getByRole('button', { name: 'Click Me' })
      expect(button).toHaveAttribute('data-size', 'lg')
    })

    it('applies gradient style to primary button', () => {
      render(<EmptyState title="Test" actionLabel="Click Me" onAction={mockAction} />)
      const button = screen.getByRole('button', { name: 'Click Me' })
      expect(button).toHaveStyle({
        background: 'linear-gradient(135deg, var(--cryb-primary), var(--cryb-secondary))',
      })
    })

    it('applies outline variant to secondary button', () => {
      render(
        <EmptyState
          title="Test"
          actionLabel="Primary"
          onAction={mockAction}
          secondaryActionLabel="Secondary"
          onSecondaryAction={mockSecondaryAction}
        />
      )
      const button = screen.getByRole('button', { name: 'Secondary' })
      expect(button).toHaveAttribute('data-variant', 'outline')
    })

    it('renders both buttons side by side', () => {
      const { container } = render(
        <EmptyState
          title="Test"
          actionLabel="Primary"
          onAction={mockAction}
          secondaryActionLabel="Secondary"
          onSecondaryAction={mockSecondaryAction}
        />
      )
      const buttonContainer = container.querySelector('.flex.flex-col.sm\\:flex-row.gap-3')
      expect(buttonContainer).toBeInTheDocument()
    })

    it('handles multiple rapid clicks on primary button', async () => {
      const user = userEvent.setup()
      render(<EmptyState title="Test" actionLabel="Click Me" onAction={mockAction} />)

      const button = screen.getByRole('button', { name: 'Click Me' })
      await user.click(button)
      await user.click(button)
      await user.click(button)

      expect(mockAction).toHaveBeenCalledTimes(3)
    })

    it('handles multiple rapid clicks on secondary button', async () => {
      const user = userEvent.setup()
      render(
        <EmptyState
          title="Test"
          actionLabel="Primary"
          onAction={mockAction}
          secondaryActionLabel="Secondary"
          onSecondaryAction={mockSecondaryAction}
        />
      )

      const button = screen.getByRole('button', { name: 'Secondary' })
      await user.click(button)
      await user.click(button)

      expect(mockSecondaryAction).toHaveBeenCalledTimes(2)
    })
  })

  describe('Illustrations', () => {
    it('renders custom illustration', () => {
      const illustration = <div data-testid="custom-illustration">Custom Illustration</div>
      render(<EmptyState illustration={illustration} title="Test" />)
      expect(screen.getByTestId('custom-illustration')).toBeInTheDocument()
    })

    it('prefers illustration over icon', () => {
      const illustration = <div data-testid="illustration">Illustration</div>
      const { container } = render(<EmptyState illustration={illustration} icon={<FileText />} title="Test" />)

      expect(screen.getByTestId('illustration')).toBeInTheDocument()
      expect(container.querySelector('.mb-6.rounded-full.p-6')).not.toBeInTheDocument()
    })

    it('renders SVG illustration', () => {
      const illustration = (
        <svg data-testid="svg-illustration" width="200" height="200">
          <circle cx="100" cy="100" r="50" />
        </svg>
      )
      render(<EmptyState illustration={illustration} title="Test" />)
      expect(screen.getByTestId('svg-illustration')).toBeInTheDocument()
    })

    it('renders image illustration', () => {
      const illustration = <img src="/empty.png" alt="Empty state" data-testid="img-illustration" />
      render(<EmptyState illustration={illustration} title="Test" />)
      expect(screen.getByTestId('img-illustration')).toBeInTheDocument()
    })

    it('renders complex illustration component', () => {
      const ComplexIllustration = () => (
        <div data-testid="complex-illustration">
          <svg width="100" height="100">
            <rect width="100" height="100" />
          </svg>
          <div>Decorative elements</div>
        </div>
      )
      render(<EmptyState illustration={<ComplexIllustration />} title="Test" />)
      expect(screen.getByTestId('complex-illustration')).toBeInTheDocument()
    })
  })

  describe('Layout and Styling', () => {
    it('centers content', () => {
      const { container } = render(<EmptyState title="Test" />)
      const wrapper = screen.getByTestId('motion-div')
      expect(wrapper).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center')
    })

    it('applies padding', () => {
      const { container } = render(<EmptyState title="Test" />)
      const wrapper = screen.getByTestId('motion-div')
      expect(wrapper).toHaveClass('py-16', 'px-8')
    })

    it('applies text-center class', () => {
      const { container } = render(<EmptyState title="Test" />)
      const wrapper = screen.getByTestId('motion-div')
      expect(wrapper).toHaveClass('text-center')
    })

    it('constrains description width', () => {
      render(<EmptyState title="Title" description="Description" />)
      const description = screen.getByText('Description')
      expect(description).toHaveClass('max-w-md')
    })

    it('applies proper spacing to title', () => {
      render(<EmptyState title="Test" />)
      const title = screen.getByText('Test')
      expect(title).toHaveClass('mb-3')
    })

    it('applies proper spacing to description', () => {
      render(<EmptyState title="Title" description="Description" />)
      const description = screen.getByText('Description')
      expect(description).toHaveClass('mb-6')
    })

    it('combines custom className with default classes', () => {
      const { container } = render(<EmptyState title="Test" className="custom extra-class" />)
      const wrapper = screen.getByTestId('motion-div')
      expect(wrapper).toHaveClass('custom', 'extra-class')
    })
  })

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<EmptyState title="Main Title" />)
      const heading = screen.getByRole('heading', { level: 3 })
      expect(heading).toBeInTheDocument()
    })

    it('uses semantic HTML for title', () => {
      render(<EmptyState title="Test" />)
      const title = screen.getByText('Test')
      expect(title.tagName).toBe('H3')
    })

    it('uses semantic HTML for description', () => {
      render(<EmptyState title="Title" description="Description" />)
      const description = screen.getByText('Description')
      expect(description.tagName).toBe('P')
    })

    it('buttons are keyboard accessible', async () => {
      const user = userEvent.setup()
      render(<EmptyState title="Test" actionLabel="Click Me" onAction={mockAction} />)

      const button = screen.getByRole('button', { name: 'Click Me' })
      button.focus()
      expect(button).toHaveFocus()

      await user.keyboard('{Enter}')
      expect(mockAction).toHaveBeenCalled()
    })

    it('maintains focus management with multiple buttons', async () => {
      const user = userEvent.setup()
      render(
        <EmptyState
          title="Test"
          actionLabel="Primary"
          onAction={mockAction}
          secondaryActionLabel="Secondary"
          onSecondaryAction={mockSecondaryAction}
        />
      )

      const primaryButton = screen.getByRole('button', { name: 'Primary' })
      const secondaryButton = screen.getByRole('button', { name: 'Secondary' })

      await user.tab()
      expect(primaryButton).toHaveFocus()

      await user.tab()
      expect(secondaryButton).toHaveFocus()
    })

    it('has proper color contrast on title', () => {
      render(<EmptyState title="Test" />)
      const title = screen.getByText('Test')
      expect(title).toHaveStyle({ color: 'var(--text-primary)' })
    })

    it('has proper color contrast on description', () => {
      render(<EmptyState title="Title" description="Description" />)
      const description = screen.getByText('Description')
      expect(description).toHaveStyle({ color: 'var(--text-secondary)' })
    })
  })

  describe('Responsive Design', () => {
    it('uses responsive flex direction for buttons', () => {
      const { container } = render(
        <EmptyState
          title="Test"
          actionLabel="Primary"
          onAction={mockAction}
          secondaryActionLabel="Secondary"
          onSecondaryAction={mockSecondaryAction}
        />
      )
      const buttonContainer = container.querySelector('.flex-col.sm\\:flex-row')
      expect(buttonContainer).toBeInTheDocument()
    })

    it('maintains proper spacing on small screens', () => {
      const { container } = render(<EmptyState title="Test" />)
      const wrapper = screen.getByTestId('motion-div')
      expect(wrapper).toHaveClass('px-8')
    })
  })

  describe('Edge Cases', () => {
    it('handles empty string title', () => {
      render(<EmptyState title="" />)
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument()
    })

    it('handles empty string description', () => {
      render(<EmptyState title="Title" description="" />)
      const paragraphs = document.querySelectorAll('p')
      expect(paragraphs.length).toBe(1)
    })

    it('handles null icon gracefully', () => {
      const { container } = render(<EmptyState icon={null} title="Test" />)
      expect(container.querySelector('.mb-6.rounded-full.p-6')).toBeInTheDocument()
    })

    it('handles undefined props', () => {
      expect(() => {
        render(<EmptyState title="Test" description={undefined} actionLabel={undefined} />)
      }).not.toThrow()
    })

    it('handles action without label', () => {
      const { container } = render(<EmptyState title="Test" onAction={mockAction} />)
      const buttons = container.querySelectorAll('button')
      expect(buttons.length).toBe(0)
    })

    it('handles label without action', () => {
      const { container } = render(<EmptyState title="Test" actionLabel="Click" />)
      const buttons = container.querySelectorAll('button')
      expect(buttons.length).toBe(0)
    })

    it('does not crash with all props undefined', () => {
      expect(() => {
        render(<EmptyState />)
      }).not.toThrow()
    })
  })

  describe('Animation', () => {
    it('renders with motion.div for animations', () => {
      render(<EmptyState title="Test" />)
      expect(screen.getByTestId('motion-div')).toBeInTheDocument()
    })

    it('applies animation classes correctly', () => {
      const { container } = render(<EmptyState title="Test" />)
      expect(screen.getByTestId('motion-div')).toBeInTheDocument()
    })
  })
})

export default mockAction
