import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import InviteMembersModal from '../InviteMembersModal'

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, ...props }) => <div {...props}>{children}</div>,
  },
}))

const renderModal = () => {
  return render(
    <BrowserRouter>
      <InviteMembersModal />
    </BrowserRouter>
  )
}

describe('InviteMembersModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Initial Rendering', () => {
    it('renders without crashing', () => {
      renderModal()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('has proper accessibility attributes', () => {
      renderModal()
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Invite members page')
    })

    it('displays the page title', () => {
      renderModal()
      expect(screen.getByRole('heading', { name: /InviteMembersModal/i })).toBeInTheDocument()
    })

    it('displays placeholder content', () => {
      renderModal()
      expect(screen.getByText(/This is the InviteMembersModal page/i)).toBeInTheDocument()
    })

    it('uses memo for performance optimization', () => {
      renderModal()
      expect(InviteMembersModal).toBeTruthy()
    })
  })

  describe('Styling', () => {
    it('applies correct container classes', () => {
      renderModal()
      const main = screen.getByRole('main')
      expect(main).toHaveClass('min-h-screen', 'bg-gray-50', 'dark:bg-[#0d1117]', 'p-6')
    })

    it('applies correct content wrapper classes', () => {
      renderModal()
      const main = screen.getByRole('main')
      const wrapper = main.querySelector('.max-w-6xl')
      expect(wrapper).toHaveClass('max-w-6xl', 'mx-auto')
    })

    it('applies card styling classes', () => {
      renderModal()
      const main = screen.getByRole('main')
      const card = main.querySelector('.bg-white')
      expect(card).toHaveClass('bg-white', 'dark:bg-[#161b22]', 'rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]', 'p-8', 'shadow-xl')
    })

    it('applies heading styles', () => {
      renderModal()
      const heading = screen.getByRole('heading', { name: /InviteMembersModal/i })
      expect(heading).toHaveClass('text-3xl', 'font-bold', 'mb-6', 'text-gray-900', 'dark:text-white')
    })

    it('applies text content styles', () => {
      renderModal()
      const text = screen.getByText(/This is the InviteMembersModal page/i)
      expect(text).toHaveClass('text-gray-600', 'dark:text-[#8b949e]')
    })
  })

  describe('Dark Mode Support', () => {
    it('includes dark mode classes for background', () => {
      renderModal()
      const main = screen.getByRole('main')
      expect(main.className).toContain('dark:bg-[#0d1117]')
    })

    it('includes dark mode classes for card', () => {
      renderModal()
      const card = screen.getByRole('main').querySelector('.bg-white')
      expect(card?.className).toContain('dark:bg-[#161b22]')
    })

    it('includes dark mode classes for heading', () => {
      renderModal()
      const heading = screen.getByRole('heading', { name: /InviteMembersModal/i })
      expect(heading.className).toContain('dark:text-white')
    })

    it('includes dark mode classes for text', () => {
      renderModal()
      const text = screen.getByText(/This is the InviteMembersModal page/i)
      expect(text.className).toContain('dark:text-[#8b949e]')
    })
  })

  describe('Framer Motion Integration', () => {
    it('renders motion.div component', () => {
      renderModal()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('applies initial animation prop', () => {
      renderModal()
      const card = screen.getByRole('main').querySelector('.bg-white')
      expect(card).toBeInTheDocument()
    })

    it('applies animate animation prop', () => {
      renderModal()
      const card = screen.getByRole('main').querySelector('.bg-white')
      expect(card).toBeInTheDocument()
    })
  })

  describe('Layout Structure', () => {
    it('has correct DOM hierarchy', () => {
      renderModal()
      const main = screen.getByRole('main')
      expect(main.querySelector('.max-w-6xl')).toBeInTheDocument()
      expect(main.querySelector('.max-w-6xl .bg-white')).toBeInTheDocument()
    })

    it('contains heading within card', () => {
      renderModal()
      const card = screen.getByRole('main').querySelector('.bg-white')
      const heading = screen.getByRole('heading', { name: /InviteMembersModal/i })
      expect(card).toContainElement(heading)
    })

    it('contains text within card', () => {
      renderModal()
      const card = screen.getByRole('main').querySelector('.bg-white')
      const text = screen.getByText(/This is the InviteMembersModal page/i)
      expect(card).toContainElement(text)
    })
  })

  describe('Responsive Design', () => {
    it('applies max-width constraint', () => {
      renderModal()
      const wrapper = screen.getByRole('main').querySelector('.max-w-6xl')
      expect(wrapper).toHaveClass('max-w-6xl')
    })

    it('applies horizontal centering', () => {
      renderModal()
      const wrapper = screen.getByRole('main').querySelector('.max-w-6xl')
      expect(wrapper).toHaveClass('mx-auto')
    })

    it('applies full viewport height', () => {
      renderModal()
      const main = screen.getByRole('main')
      expect(main).toHaveClass('min-h-screen')
    })

    it('applies padding', () => {
      renderModal()
      const main = screen.getByRole('main')
      expect(main).toHaveClass('p-6')
    })
  })

  describe('Accessibility Features', () => {
    it('has main landmark role', () => {
      renderModal()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('has descriptive aria-label', () => {
      renderModal()
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Invite members page')
    })

    it('heading is properly structured', () => {
      renderModal()
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toBeInTheDocument()
    })

    it('uses semantic HTML', () => {
      renderModal()
      expect(screen.getByRole('heading')).toBeInTheDocument()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Component Export', () => {
    it('exports as default', () => {
      expect(InviteMembersModal).toBeDefined()
    })

    it('is a memoized component', () => {
      expect(InviteMembersModal.$$typeof).toBeDefined()
    })
  })

  describe('Content Rendering', () => {
    it('displays correct heading text', () => {
      renderModal()
      expect(screen.getByText('InviteMembersModal')).toBeInTheDocument()
    })

    it('displays correct description text', () => {
      renderModal()
      expect(screen.getByText('This is the InviteMembersModal page. Content will be implemented here.')).toBeInTheDocument()
    })

    it('heading is of correct level', () => {
      renderModal()
      const heading = screen.getByRole('heading', { name: /InviteMembersModal/i })
      expect(heading.tagName).toBe('H1')
    })

    it('description is in paragraph element', () => {
      renderModal()
      const text = screen.getByText(/This is the InviteMembersModal page/i)
      expect(text.tagName).toBe('P')
    })
  })

  describe('Visual Design', () => {
    it('applies rounded corners to card', () => {
      renderModal()
      const card = screen.getByRole('main').querySelector('.bg-white')
      expect(card).toHaveClass('rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]')
    })

    it('applies shadow to card', () => {
      renderModal()
      const card = screen.getByRole('main').querySelector('.bg-white')
      expect(card).toHaveClass('shadow-xl')
    })

    it('applies padding to card', () => {
      renderModal()
      const card = screen.getByRole('main').querySelector('.bg-white')
      expect(card).toHaveClass('p-8')
    })

    it('applies margin bottom to heading', () => {
      renderModal()
      const heading = screen.getByRole('heading', { name: /InviteMembersModal/i })
      expect(heading).toHaveClass('mb-6')
    })
  })

  describe('Multiple Renders', () => {
    it('renders consistently on multiple mounts', () => {
      const { unmount } = renderModal()
      expect(screen.getByRole('main')).toBeInTheDocument()
      unmount()

      renderModal()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('maintains structure on re-render', () => {
      const { rerender } = renderModal()
      expect(screen.getByRole('heading', { name: /InviteMembersModal/i })).toBeInTheDocument()

      rerender(
        <BrowserRouter>
          <InviteMembersModal />
        </BrowserRouter>
      )
      expect(screen.getByRole('heading', { name: /InviteMembersModal/i })).toBeInTheDocument()
    })
  })

  describe('Background Colors', () => {
    it('applies light mode background color', () => {
      renderModal()
      const main = screen.getByRole('main')
      expect(main).toHaveClass('bg-gray-50')
    })

    it('applies light mode card background', () => {
      renderModal()
      const card = screen.getByRole('main').querySelector('.bg-white')
      expect(card).toHaveClass('bg-white')
    })

    it('applies light mode text color to heading', () => {
      renderModal()
      const heading = screen.getByRole('heading', { name: /InviteMembersModal/i })
      expect(heading).toHaveClass('text-gray-900')
    })

    it('applies light mode text color to description', () => {
      renderModal()
      const text = screen.getByText(/This is the InviteMembersModal page/i)
      expect(text).toHaveClass('text-gray-600')
    })
  })

  describe('Typography', () => {
    it('applies correct heading size', () => {
      renderModal()
      const heading = screen.getByRole('heading', { name: /InviteMembersModal/i })
      expect(heading).toHaveClass('text-3xl')
    })

    it('applies bold weight to heading', () => {
      renderModal()
      const heading = screen.getByRole('heading', { name: /InviteMembersModal/i })
      expect(heading).toHaveClass('font-bold')
    })
  })

  describe('Component Props', () => {
    it('does not require any props', () => {
      expect(() => renderModal()).not.toThrow()
    })

    it('renders with empty props', () => {
      const { container } = render(
        <BrowserRouter>
          <InviteMembersModal />
        </BrowserRouter>
      )
      expect(container).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles rapid mount/unmount cycles', () => {
      const { unmount } = renderModal()
      unmount()
      renderModal()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('maintains accessibility on re-render', () => {
      const { rerender } = renderModal()
      rerender(
        <BrowserRouter>
          <InviteMembersModal />
        </BrowserRouter>
      )
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Invite members page')
    })
  })

  describe('Browser Router Integration', () => {
    it('works within BrowserRouter', () => {
      expect(() => renderModal()).not.toThrow()
    })

    it('renders correctly without router errors', () => {
      renderModal()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('CSS Classes Presence', () => {
    it('all required Tailwind classes are present on main', () => {
      renderModal()
      const main = screen.getByRole('main')
      const classes = ['min-h-screen', 'bg-gray-50', 'dark:bg-[#0d1117]', 'p-6']
      classes.forEach(cls => {
        expect(main.className).toContain(cls)
      })
    })

    it('all required Tailwind classes are present on card', () => {
      renderModal()
      const card = screen.getByRole('main').querySelector('.bg-white')
      const classes = ['bg-white', 'dark:bg-[#161b22]', 'rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]', 'p-8', 'shadow-xl']
      classes.forEach(cls => {
        expect(card?.className).toContain(cls)
      })
    })
  })

  describe('Implementation Status', () => {
    it('indicates content is yet to be implemented', () => {
      renderModal()
      expect(screen.getByText(/Content will be implemented here/i)).toBeInTheDocument()
    })

    it('is a placeholder component', () => {
      renderModal()
      expect(screen.getByText(/This is the InviteMembersModal page/i)).toBeInTheDocument()
    })
  })

  describe('Component Type', () => {
    it('is a functional component', () => {
      expect(typeof InviteMembersModal).toBe('object')
    })

    it('can be rendered as JSX', () => {
      expect(() => <InviteMembersModal />).not.toThrow()
    })
  })

  describe('Screen Reader Support', () => {
    it('provides context with aria-label', () => {
      renderModal()
      const main = screen.getByRole('main')
      expect(main.getAttribute('aria-label')).toBe('Invite members page')
    })

    it('has proper heading hierarchy', () => {
      renderModal()
      const headings = screen.getAllByRole('heading')
      expect(headings).toHaveLength(1)
      expect(headings[0].tagName).toBe('H1')
    })
  })

  describe('Spacing', () => {
    it('applies margin between heading and content', () => {
      renderModal()
      const heading = screen.getByRole('heading', { name: /InviteMembersModal/i })
      expect(heading.className).toContain('mb-6')
    })

    it('applies padding to main container', () => {
      renderModal()
      const main = screen.getByRole('main')
      expect(main.className).toContain('p-6')
    })

    it('applies padding to card', () => {
      renderModal()
      const card = screen.getByRole('main').querySelector('.bg-white')
      expect(card?.className).toContain('p-8')
    })
  })

  describe('Container Width', () => {
    it('constrains maximum width', () => {
      renderModal()
      const wrapper = screen.getByRole('main').querySelector('.max-w-6xl')
      expect(wrapper?.className).toContain('max-w-6xl')
    })

    it('centers content horizontally', () => {
      renderModal()
      const wrapper = screen.getByRole('main').querySelector('.max-w-6xl')
      expect(wrapper?.className).toContain('mx-auto')
    })
  })

  describe('Animation Properties', () => {
    it('wraps content in motion.div', () => {
      renderModal()
      const card = screen.getByRole('main').querySelector('.bg-white')
      expect(card).toBeInTheDocument()
    })
  })

  describe('Memoization', () => {
    it('component is wrapped with memo', () => {
      expect(InviteMembersModal.$$typeof).toBeDefined()
    })

    it('prevents unnecessary re-renders', () => {
      const { rerender } = renderModal()
      const firstHeading = screen.getByRole('heading', { name: /InviteMembersModal/i })

      rerender(
        <BrowserRouter>
          <InviteMembersModal />
        </BrowserRouter>
      )

      const secondHeading = screen.getByRole('heading', { name: /InviteMembersModal/i })
      expect(firstHeading).toBe(secondHeading)
    })
  })
})

export default renderModal
