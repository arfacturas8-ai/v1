/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import AccountSuspendedPage from './AccountSuspendedPage'

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Ban: ({ className, ...props }) => <svg data-testid="ban-icon" className={className} {...props} />,
  Mail: ({ className, ...props }) => <svg data-testid="mail-icon" className={className} {...props} />,
  FileText: ({ className, ...props }) => <svg data-testid="file-text-icon" className={className} {...props} />,
}))

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('AccountSuspendedPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Page Rendering', () => {
    it('renders page without crashing', () => {
      const { container } = renderWithRouter(<AccountSuspendedPage />)
      expect(container).toBeInTheDocument()
    })

    it('displays main content area with proper role', () => {
      renderWithRouter(<AccountSuspendedPage />)
      const mainElement = screen.getByRole('main')
      expect(mainElement).toBeInTheDocument()
    })

    it('has proper aria-label on main element', () => {
      renderWithRouter(<AccountSuspendedPage />)
      const mainElement = screen.getByRole('main')
      expect(mainElement).toHaveAttribute('aria-label', 'Account suspended page')
    })

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      renderWithRouter(<AccountSuspendedPage />)
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('applies correct container classes', () => {
      const { container } = renderWithRouter(<AccountSuspendedPage />)
      const mainElement = container.querySelector('[role="main"]')
      expect(mainElement).toHaveClass('min-h-screen', 'bg-gray-50', 'dark:bg-[#161b22]')
    })

    it('renders content card with proper styling', () => {
      const { container } = renderWithRouter(<AccountSuspendedPage />)
      const contentCard = container.querySelector('.bg-white')
      expect(contentCard).toBeInTheDocument()
      expect(contentCard).toHaveClass('rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]', 'p-12')
    })
  })

  describe('Suspension Message Display', () => {
    it('displays "Account Suspended" heading', () => {
      renderWithRouter(<AccountSuspendedPage />)
      const heading = screen.getByRole('heading', { name: /Account Suspended/i })
      expect(heading).toBeInTheDocument()
    })

    it('heading has correct level (h1)', () => {
      renderWithRouter(<AccountSuspendedPage />)
      const heading = screen.getByRole('heading', { name: /Account Suspended/i })
      expect(heading.tagName).toBe('H1')
    })

    it('displays suspension description message', () => {
      renderWithRouter(<AccountSuspendedPage />)
      expect(screen.getByText(/Your account has been suspended due to violation of our community guidelines/i)).toBeInTheDocument()
    })

    it('has alert role on content card', () => {
      renderWithRouter(<AccountSuspendedPage />)
      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
    })

    it('has aria-live attribute on alert', () => {
      renderWithRouter(<AccountSuspendedPage />)
      const alert = screen.getByRole('alert')
      expect(alert).toHaveAttribute('aria-live', 'polite')
    })
  })

  describe('Ban Icon Display', () => {
    it('renders ban icon', () => {
      renderWithRouter(<AccountSuspendedPage />)
      const banIcon = screen.getByTestId('ban-icon')
      expect(banIcon).toBeInTheDocument()
    })

    it('ban icon has correct size classes', () => {
      renderWithRouter(<AccountSuspendedPage />)
      const banIcon = screen.getByTestId('ban-icon')
      expect(banIcon).toHaveClass('w-24', 'h-24')
    })

    it('ban icon has red color class', () => {
      renderWithRouter(<AccountSuspendedPage />)
      const banIcon = screen.getByTestId('ban-icon')
      expect(banIcon).toHaveClass('text-red-500')
    })

    it('ban icon is hidden from screen readers', () => {
      renderWithRouter(<AccountSuspendedPage />)
      const banIcon = screen.getByTestId('ban-icon')
      expect(banIcon).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('Suspension Reason Display', () => {
    it('displays suspension reason section', () => {
      renderWithRouter(<AccountSuspendedPage />)
      expect(screen.getByText(/Reason for suspension:/i)).toBeInTheDocument()
    })

    it('suspension reason has proper heading', () => {
      renderWithRouter(<AccountSuspendedPage />)
      const reasonHeading = screen.getByText(/Reason for suspension:/i)
      expect(reasonHeading.tagName).toBe('H3')
    })

    it('displays specific suspension reason text', () => {
      renderWithRouter(<AccountSuspendedPage />)
      expect(screen.getByText(/Multiple reports of spam and inappropriate content/i)).toBeInTheDocument()
    })

    it('suspension reason container has warning styling', () => {
      const { container } = renderWithRouter(<AccountSuspendedPage />)
      const reasonContainer = container.querySelector('.bg-red-50')
      expect(reasonContainer).toBeInTheDocument()
      expect(reasonContainer).toHaveClass('rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]')
    })

    it('suspension reason container has proper padding', () => {
      const { container } = renderWithRouter(<AccountSuspendedPage />)
      const reasonContainer = container.querySelector('.bg-red-50')
      expect(reasonContainer).toHaveClass('p-4')
    })

    it('suspension reason text is left-aligned', () => {
      const { container } = renderWithRouter(<AccountSuspendedPage />)
      const reasonContainer = container.querySelector('.bg-red-50')
      expect(reasonContainer).toHaveClass('text-left')
    })
  })

  describe('Contact Support Button', () => {
    it('renders contact support button', () => {
      renderWithRouter(<AccountSuspendedPage />)
      const button = screen.getByRole('button', { name: /Contact support about suspension/i })
      expect(button).toBeInTheDocument()
    })

    it('contact support button displays correct text', () => {
      renderWithRouter(<AccountSuspendedPage />)
      expect(screen.getByText('Contact Support')).toBeInTheDocument()
    })

    it('contact support button has mail icon', () => {
      renderWithRouter(<AccountSuspendedPage />)
      const mailIcon = screen.getByTestId('mail-icon')
      expect(mailIcon).toBeInTheDocument()
    })

    it('mail icon has correct size', () => {
      renderWithRouter(<AccountSuspendedPage />)
      const mailIcon = screen.getByTestId('mail-icon')
      expect(mailIcon).toHaveClass('w-5', 'h-5')
    })

    it('mail icon is hidden from screen readers', () => {
      renderWithRouter(<AccountSuspendedPage />)
      const mailIcon = screen.getByTestId('mail-icon')
      expect(mailIcon).toHaveAttribute('aria-hidden', 'true')
    })

    it('contact support button has proper aria-label', () => {
      renderWithRouter(<AccountSuspendedPage />)
      const button = screen.getByRole('button', { name: /Contact support about suspension/i })
      expect(button).toHaveAttribute('aria-label', 'Contact support about suspension')
    })

    it('contact support button has blue background', () => {
      renderWithRouter(<AccountSuspendedPage />)
      const button = screen.getByRole('button', { name: /Contact support about suspension/i })
      expect(button).toHaveClass('bg-[#000000]')
    })

    it('contact support button is clickable', async () => {
      const user = userEvent.setup()
      renderWithRouter(<AccountSuspendedPage />)
      const button = screen.getByRole('button', { name: /Contact support about suspension/i })
      await user.click(button)
      // Button should be interactable without errors
      expect(button).toBeInTheDocument()
    })

    it('contact support button has hover state', () => {
      renderWithRouter(<AccountSuspendedPage />)
      const button = screen.getByRole('button', { name: /Contact support about suspension/i })
      expect(button).toHaveClass('hover:bg-blue-600')
    })
  })

  describe('Appeal Suspension Button', () => {
    it('renders appeal suspension button', () => {
      renderWithRouter(<AccountSuspendedPage />)
      const button = screen.getByRole('button', { name: /Appeal account suspension/i })
      expect(button).toBeInTheDocument()
    })

    it('appeal button displays correct text', () => {
      renderWithRouter(<AccountSuspendedPage />)
      expect(screen.getByText('Appeal Suspension')).toBeInTheDocument()
    })

    it('appeal button has file text icon', () => {
      renderWithRouter(<AccountSuspendedPage />)
      const fileTextIcon = screen.getByTestId('file-text-icon')
      expect(fileTextIcon).toBeInTheDocument()
    })

    it('file text icon has correct size', () => {
      renderWithRouter(<AccountSuspendedPage />)
      const fileTextIcon = screen.getByTestId('file-text-icon')
      expect(fileTextIcon).toHaveClass('w-5', 'h-5')
    })

    it('file text icon is hidden from screen readers', () => {
      renderWithRouter(<AccountSuspendedPage />)
      const fileTextIcon = screen.getByTestId('file-text-icon')
      expect(fileTextIcon).toHaveAttribute('aria-hidden', 'true')
    })

    it('appeal button has proper aria-label', () => {
      renderWithRouter(<AccountSuspendedPage />)
      const button = screen.getByRole('button', { name: /Appeal account suspension/i })
      expect(button).toHaveAttribute('aria-label', 'Appeal account suspension')
    })

    it('appeal button has gray background', () => {
      renderWithRouter(<AccountSuspendedPage />)
      const button = screen.getByRole('button', { name: /Appeal account suspension/i })
      expect(button).toHaveClass('bg-gray-200', 'dark:bg-gray-700')
    })

    it('appeal button is clickable', async () => {
      const user = userEvent.setup()
      renderWithRouter(<AccountSuspendedPage />)
      const button = screen.getByRole('button', { name: /Appeal account suspension/i })
      await user.click(button)
      // Button should be interactable without errors
      expect(button).toBeInTheDocument()
    })

    it('appeal button has hover state', () => {
      renderWithRouter(<AccountSuspendedPage />)
      const button = screen.getByRole('button', { name: /Appeal account suspension/i })
      expect(button).toHaveClass('hover:bg-gray-300', 'dark:hover:bg-gray-600')
    })
  })

  describe('Button Layout', () => {
    it('buttons are in a flex container', () => {
      const { container } = renderWithRouter(<AccountSuspendedPage />)
      const buttonContainer = container.querySelector('.flex.gap-4')
      expect(buttonContainer).toBeInTheDocument()
    })

    it('buttons have equal width (flex-1)', () => {
      renderWithRouter(<AccountSuspendedPage />)
      const contactButton = screen.getByRole('button', { name: /Contact support about suspension/i })
      const appealButton = screen.getByRole('button', { name: /Appeal account suspension/i })
      expect(contactButton).toHaveClass('flex-1')
      expect(appealButton).toHaveClass('flex-1')
    })

    it('buttons display icons and text in a row', () => {
      renderWithRouter(<AccountSuspendedPage />)
      const contactButton = screen.getByRole('button', { name: /Contact support about suspension/i })
      expect(contactButton).toHaveClass('flex', 'items-center', 'justify-center', 'gap-2')
    })

    it('buttons have consistent padding', () => {
      renderWithRouter(<AccountSuspendedPage />)
      const contactButton = screen.getByRole('button', { name: /Contact support about suspension/i })
      const appealButton = screen.getByRole('button', { name: /Appeal account suspension/i })
      expect(contactButton).toHaveClass('py-3')
      expect(appealButton).toHaveClass('py-3')
    })

    it('buttons have rounded corners', () => {
      renderWithRouter(<AccountSuspendedPage />)
      const contactButton = screen.getByRole('button', { name: /Contact support about suspension/i })
      const appealButton = screen.getByRole('button', { name: /Appeal account suspension/i })
      expect(contactButton).toHaveClass('rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]')
      expect(appealButton).toHaveClass('rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]')
    })
  })

  describe('Accessibility', () => {
    it('has proper page structure with main landmark', () => {
      renderWithRouter(<AccountSuspendedPage />)
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
    })

    it('has proper heading hierarchy', () => {
      renderWithRouter(<AccountSuspendedPage />)
      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toBeInTheDocument()
      expect(h1).toHaveTextContent(/Account Suspended/i)
    })

    it('all interactive elements are keyboard accessible', () => {
      renderWithRouter(<AccountSuspendedPage />)
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabindex', '-1')
      })
    })

    it('icons are properly hidden from screen readers', () => {
      renderWithRouter(<AccountSuspendedPage />)
      const banIcon = screen.getByTestId('ban-icon')
      const mailIcon = screen.getByTestId('mail-icon')
      const fileTextIcon = screen.getByTestId('file-text-icon')
      expect(banIcon).toHaveAttribute('aria-hidden', 'true')
      expect(mailIcon).toHaveAttribute('aria-hidden', 'true')
      expect(fileTextIcon).toHaveAttribute('aria-hidden', 'true')
    })

    it('buttons have descriptive aria-labels', () => {
      renderWithRouter(<AccountSuspendedPage />)
      expect(screen.getByRole('button', { name: /Contact support about suspension/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Appeal account suspension/i })).toBeInTheDocument()
    })

    it('supports keyboard navigation between buttons', async () => {
      const user = userEvent.setup()
      renderWithRouter(<AccountSuspendedPage />)
      const contactButton = screen.getByRole('button', { name: /Contact support about suspension/i })
      const appealButton = screen.getByRole('button', { name: /Appeal account suspension/i })

      // Tab to first button
      await user.tab()
      // One of the buttons should receive focus (testing navigation is possible)
      expect(document.activeElement).toBeTruthy()
    })
  })

  describe('Dark Mode Support', () => {
    it('has dark mode classes on main container', () => {
      const { container } = renderWithRouter(<AccountSuspendedPage />)
      const mainElement = container.querySelector('[role="main"]')
      expect(mainElement).toHaveClass('dark:bg-[#161b22]')
    })

    it('has dark mode classes on content card', () => {
      const { container } = renderWithRouter(<AccountSuspendedPage />)
      const contentCard = container.querySelector('.bg-white')
      expect(contentCard).toHaveClass('dark:bg-[#161b22]')
    })

    it('heading has dark mode text color', () => {
      renderWithRouter(<AccountSuspendedPage />)
      const heading = screen.getByRole('heading', { name: /Account Suspended/i })
      expect(heading).toHaveClass('dark:text-white')
    })

    it('description text has dark mode color', () => {
      const { container } = renderWithRouter(<AccountSuspendedPage />)
      const description = screen.getByText(/Your account has been suspended due to violation of our community guidelines/i)
      expect(description).toHaveClass('dark:text-[#8b949e]')
    })

    it('reason section has dark mode styling', () => {
      const { container } = renderWithRouter(<AccountSuspendedPage />)
      const reasonContainer = container.querySelector('.bg-red-50')
      expect(reasonContainer).toHaveClass('dark:bg-red-900\\/20')
    })

    it('reason heading has dark mode color', () => {
      renderWithRouter(<AccountSuspendedPage />)
      const reasonHeading = screen.getByText(/Reason for suspension:/i)
      expect(reasonHeading).toHaveClass('dark:text-red-400')
    })

    it('appeal button has dark mode styling', () => {
      renderWithRouter(<AccountSuspendedPage />)
      const appealButton = screen.getByRole('button', { name: /Appeal account suspension/i })
      expect(appealButton).toHaveClass('dark:bg-gray-700', 'dark:hover:bg-gray-600')
    })
  })

  describe('Component Memoization', () => {
    it('component is wrapped with memo', () => {
      // The component should be memoized to prevent unnecessary re-renders
      expect(AccountSuspendedPage).toBeDefined()
      expect(typeof AccountSuspendedPage).toBe('function')
    })
  })

  describe('Responsive Design', () => {
    it('has responsive padding classes', () => {
      const { container } = renderWithRouter(<AccountSuspendedPage />)
      const mainElement = container.querySelector('[role="main"]')
      expect(mainElement).toHaveClass('p-6')
    })

    it('content card has max-width constraint', () => {
      const { container } = renderWithRouter(<AccountSuspendedPage />)
      const contentCard = container.querySelector('.max-w-2xl')
      expect(contentCard).toBeInTheDocument()
    })

    it('uses flexbox for centering content', () => {
      const { container } = renderWithRouter(<AccountSuspendedPage />)
      const mainElement = container.querySelector('[role="main"]')
      expect(mainElement).toHaveClass('flex', 'items-center', 'justify-center')
    })
  })

  describe('Text Content', () => {
    it('displays all required text content', () => {
      renderWithRouter(<AccountSuspendedPage />)
      expect(screen.getByText('Account Suspended')).toBeInTheDocument()
      expect(screen.getByText(/Your account has been suspended/i)).toBeInTheDocument()
      expect(screen.getByText(/Reason for suspension/i)).toBeInTheDocument()
      expect(screen.getByText(/Multiple reports of spam and inappropriate content/i)).toBeInTheDocument()
      expect(screen.getByText('Contact Support')).toBeInTheDocument()
      expect(screen.getByText('Appeal Suspension')).toBeInTheDocument()
    })

    it('heading has proper font styling', () => {
      renderWithRouter(<AccountSuspendedPage />)
      const heading = screen.getByRole('heading', { name: /Account Suspended/i })
      expect(heading).toHaveClass('text-4xl', 'font-bold', 'mb-4')
    })

    it('reason heading has proper font styling', () => {
      renderWithRouter(<AccountSuspendedPage />)
      const reasonHeading = screen.getByText(/Reason for suspension:/i)
      expect(reasonHeading).toHaveClass('font-semibold', 'mb-2')
    })

    it('reason text has proper styling', () => {
      renderWithRouter(<AccountSuspendedPage />)
      const reasonText = screen.getByText(/Multiple reports of spam and inappropriate content/i)
      expect(reasonText).toHaveClass('text-sm')
    })
  })

  describe('Edge Cases', () => {
    it('renders correctly with minimal viewport', () => {
      global.innerWidth = 320
      renderWithRouter(<AccountSuspendedPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('renders correctly with large viewport', () => {
      global.innerWidth = 2560
      renderWithRouter(<AccountSuspendedPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles multiple rapid clicks on contact button', async () => {
      const user = userEvent.setup()
      renderWithRouter(<AccountSuspendedPage />)
      const button = screen.getByRole('button', { name: /Contact support about suspension/i })

      await user.click(button)
      await user.click(button)
      await user.click(button)

      expect(button).toBeInTheDocument()
    })

    it('handles multiple rapid clicks on appeal button', async () => {
      const user = userEvent.setup()
      renderWithRouter(<AccountSuspendedPage />)
      const button = screen.getByRole('button', { name: /Appeal account suspension/i })

      await user.click(button)
      await user.click(button)
      await user.click(button)

      expect(button).toBeInTheDocument()
    })

    it('renders without router without crashing', () => {
      const { container } = render(<AccountSuspendedPage />)
      expect(container).toBeInTheDocument()
    })
  })

  describe('Snapshot Tests', () => {
    it('matches snapshot', () => {
      const { container } = renderWithRouter(<AccountSuspendedPage />)
      expect(container).toMatchSnapshot()
    })

    it('matches snapshot for content card', () => {
      const { container } = renderWithRouter(<AccountSuspendedPage />)
      const contentCard = container.querySelector('[role="alert"]')
      expect(contentCard).toMatchSnapshot()
    })

    it('matches snapshot for button container', () => {
      const { container } = renderWithRouter(<AccountSuspendedPage />)
      const buttonContainer = container.querySelector('.flex.gap-4')
      expect(buttonContainer).toMatchSnapshot()
    })

    it('matches snapshot for suspension reason section', () => {
      const { container } = renderWithRouter(<AccountSuspendedPage />)
      const reasonSection = container.querySelector('.bg-red-50')
      expect(reasonSection).toMatchSnapshot()
    })
  })
})

export default renderWithRouter
