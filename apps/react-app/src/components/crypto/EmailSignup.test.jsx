import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EmailSignup from './EmailSignup'

describe('EmailSignup Component', () => {
  beforeEach(() => {
    jest.clearAllTimers()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Initial Render', () => {
    test('renders email input field', () => {
      render(<EmailSignup />)
      const emailInput = screen.getByPlaceholderText('Enter your email for early access')
      expect(emailInput).toBeInTheDocument()
    })

    test('renders submit button with correct text', () => {
      render(<EmailSignup />)
      expect(screen.getByRole('button', { name: /get early access/i })).toBeInTheDocument()
    })

    test('renders mail icon in input field', () => {
      render(<EmailSignup />)
      const container = screen.getByPlaceholderText('Enter your email for early access').closest('div')
      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    test('renders privacy notice', () => {
      render(<EmailSignup />)
      expect(screen.getByText(/we respect your privacy/i)).toBeInTheDocument()
    })

    test('submit button is disabled initially', () => {
      render(<EmailSignup />)
      expect(screen.getByRole('button', { name: /get early access/i })).toBeDisabled()
    })

    test('email input is not disabled initially', () => {
      render(<EmailSignup />)
      expect(screen.getByPlaceholderText('Enter your email for early access')).not.toBeDisabled()
    })

    test('no error message displayed initially', () => {
      render(<EmailSignup />)
      expect(screen.queryByText(/please enter a valid email/i)).not.toBeInTheDocument()
    })

    test('no success message displayed initially', () => {
      render(<EmailSignup />)
      expect(screen.queryByText(/welcome to early access/i)).not.toBeInTheDocument()
    })
  })

  describe('Variant Prop - Default', () => {
    test('applies default size classes to input', () => {
      render(<EmailSignup variant="default" />)
      const input = screen.getByPlaceholderText('Enter your email for early access')
      expect(input).toHaveClass('input', 'px-md', 'py-sm')
    })

    test('applies default size classes to button', () => {
      render(<EmailSignup variant="default" />)
      const button = screen.getByRole('button', { name: /get early access/i })
      expect(button).toHaveClass('btn', 'btn-primary', 'px-md', 'py-sm')
    })

    test('does not render benefits list for default variant', () => {
      render(<EmailSignup variant="default" />)
      expect(screen.queryByText(/early access benefits/i)).not.toBeInTheDocument()
    })

    test('applies correct max-width container class', () => {
      const { container } = render(<EmailSignup variant="default" />)
      expect(container.querySelector('.max-w-sm')).toBeInTheDocument()
    })
  })

  describe('Variant Prop - Large', () => {
    test('applies large size classes to input', () => {
      render(<EmailSignup variant="large" />)
      const input = screen.getByPlaceholderText('Enter your email for early access')
      expect(input).toHaveClass('input', 'text-lg', 'px-lg', 'py-md')
    })

    test('applies large size classes to button', () => {
      render(<EmailSignup variant="large" />)
      const button = screen.getByRole('button', { name: /get early access/i })
      expect(button).toHaveClass('btn', 'btn-primary', 'text-lg', 'px-lg', 'py-md')
    })

    test('renders benefits list for large variant', () => {
      render(<EmailSignup variant="large" />)
      expect(screen.getByText(/early access benefits/i)).toBeInTheDocument()
    })

    test('displays all four benefits in the list', () => {
      render(<EmailSignup variant="large" />)
      expect(screen.getByText(/first access to web3 features/i)).toBeInTheDocument()
      expect(screen.getByText(/exclusive beta testing opportunities/i)).toBeInTheDocument()
      expect(screen.getByText(/priority support and feedback/i)).toBeInTheDocument()
      expect(screen.getByText(/special launch rewards and nfts/i)).toBeInTheDocument()
    })

    test('applies correct max-width container class', () => {
      const { container } = render(<EmailSignup variant="large" />)
      expect(container.querySelector('.max-w-md')).toBeInTheDocument()
    })
  })

  describe('Email Input Interaction', () => {
    test('updates email value when user types', async () => {
      const user = userEvent.setup({ delay: null })
      render(<EmailSignup />)
      const input = screen.getByPlaceholderText('Enter your email for early access')

      await user.type(input, 'test@example.com')
      expect(input).toHaveValue('test@example.com')
    })

    test('enables submit button when email is entered', async () => {
      const user = userEvent.setup({ delay: null })
      render(<EmailSignup />)
      const button = screen.getByRole('button', { name: /get early access/i })

      await user.type(screen.getByPlaceholderText('Enter your email for early access'), 'test@example.com')
      expect(button).not.toBeDisabled()
    })

    test('keeps submit button disabled with empty email', async () => {
      const user = userEvent.setup({ delay: null })
      render(<EmailSignup />)
      const input = screen.getByPlaceholderText('Enter your email for early access')
      const button = screen.getByRole('button', { name: /get early access/i })

      await user.type(input, 'test')
      await user.clear(input)
      expect(button).toBeDisabled()
    })

    test('allows spaces in email input', async () => {
      const user = userEvent.setup({ delay: null })
      render(<EmailSignup />)
      const input = screen.getByPlaceholderText('Enter your email for early access')

      await user.type(input, 'test @example.com')
      expect(input).toHaveValue('test @example.com')
    })
  })

  describe('Form Validation', () => {
    test('shows error for empty email submission', async () => {
      const user = userEvent.setup({ delay: null })
      render(<EmailSignup />)
      const input = screen.getByPlaceholderText('Enter your email for early access')

      await user.type(input, 'a')
      await user.clear(input)
      await user.click(screen.getByRole('button', { name: /get early access/i }))

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
      })
    })

    test('shows error for email without @ symbol', async () => {
      const user = userEvent.setup({ delay: null })
      render(<EmailSignup />)
      const input = screen.getByPlaceholderText('Enter your email for early access')

      await user.type(input, 'invalidemail.com')
      await user.click(screen.getByRole('button', { name: /get early access/i }))

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
      })
    })

    test('accepts valid email format', async () => {
      const user = userEvent.setup({ delay: null })
      render(<EmailSignup />)

      await user.type(screen.getByPlaceholderText('Enter your email for early access'), 'valid@example.com')
      await user.click(screen.getByRole('button', { name: /get early access/i }))

      await waitFor(() => {
        expect(screen.getByText(/joining.../i)).toBeInTheDocument()
      })
    })

    test('displays error icon with error message', async () => {
      const user = userEvent.setup({ delay: null })
      render(<EmailSignup />)

      await user.type(screen.getByPlaceholderText('Enter your email for early access'), 'invalid')
      await user.click(screen.getByRole('button', { name: /get early access/i }))

      await waitFor(() => {
        const errorDiv = screen.getByText(/please enter a valid email address/i).closest('div')
        expect(errorDiv.querySelector('svg')).toBeInTheDocument()
      })
    })

    test('applies error border class to input on validation error', async () => {
      const user = userEvent.setup({ delay: null })
      render(<EmailSignup />)
      const input = screen.getByPlaceholderText('Enter your email for early access')

      await user.type(input, 'invalid')
      await user.click(screen.getByRole('button', { name: /get early access/i }))

      await waitFor(() => {
        expect(input).toHaveClass('border-error', 'focus:border-error')
      })
    })
  })

  describe('Loading State', () => {
    test('shows loading state on valid submission', async () => {
      const user = userEvent.setup({ delay: null })
      render(<EmailSignup />)

      await user.type(screen.getByPlaceholderText('Enter your email for early access'), 'test@example.com')
      await user.click(screen.getByRole('button', { name: /get early access/i }))

      expect(screen.getByText(/joining.../i)).toBeInTheDocument()
    })

    test('disables submit button during loading', async () => {
      const user = userEvent.setup({ delay: null })
      render(<EmailSignup />)

      await user.type(screen.getByPlaceholderText('Enter your email for early access'), 'test@example.com')
      const button = screen.getByRole('button', { name: /get early access/i })
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /joining.../i })).toBeDisabled()
      })
    })

    test('disables email input during loading', async () => {
      const user = userEvent.setup({ delay: null })
      render(<EmailSignup />)
      const input = screen.getByPlaceholderText('Enter your email for early access')

      await user.type(input, 'test@example.com')
      await user.click(screen.getByRole('button', { name: /get early access/i }))

      await waitFor(() => {
        expect(input).toBeDisabled()
      })
    })

    test('displays loading spinner icon', async () => {
      const user = userEvent.setup({ delay: null })
      render(<EmailSignup />)

      await user.type(screen.getByPlaceholderText('Enter your email for early access'), 'test@example.com')
      await user.click(screen.getByRole('button', { name: /get early access/i }))

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /joining.../i })
        const spinner = button.querySelector('.animate-spin')
        expect(spinner).toBeInTheDocument()
      })
    })

    test('applies opacity and cursor styles during loading', async () => {
      const user = userEvent.setup({ delay: null })
      render(<EmailSignup />)

      await user.type(screen.getByPlaceholderText('Enter your email for early access'), 'test@example.com')
      await user.click(screen.getByRole('button', { name: /get early access/i }))

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /joining.../i })
        expect(button).toHaveClass('opacity-50', 'cursor-not-allowed')
      })
    })
  })

  describe('Success State', () => {
    test('shows success message after submission', async () => {
      const user = userEvent.setup({ delay: null })
      render(<EmailSignup />)

      await user.type(screen.getByPlaceholderText('Enter your email for early access'), 'test@example.com')
      await user.click(screen.getByRole('button', { name: /get early access/i }))

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByText(/welcome to early access/i)).toBeInTheDocument()
      })
    })

    test('displays specific success notification text', async () => {
      const user = userEvent.setup({ delay: null })
      render(<EmailSignup />)

      await user.type(screen.getByPlaceholderText('Enter your email for early access'), 'test@example.com')
      await user.click(screen.getByRole('button', { name: /get early access/i }))

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByText(/you'll be notified when web3 features launch/i)).toBeInTheDocument()
      })
    })

    test('displays check icon in success state', async () => {
      const user = userEvent.setup({ delay: null })
      render(<EmailSignup />)

      await user.type(screen.getByPlaceholderText('Enter your email for early access'), 'test@example.com')
      await user.click(screen.getByRole('button', { name: /get early access/i }))

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        const successDiv = screen.getByText(/welcome to early access/i).closest('div').parentElement
        expect(successDiv.querySelector('.text-success')).toBeInTheDocument()
      })
    })

    test('clears email input after successful submission', async () => {
      const user = userEvent.setup({ delay: null })
      render(<EmailSignup />)
      const input = screen.getByPlaceholderText('Enter your email for early access')

      await user.type(input, 'test@example.com')
      await user.click(screen.getByRole('button', { name: /get early access/i }))

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByText(/welcome to early access/i)).toBeInTheDocument()
      })

      expect(input).toHaveValue('')
    })

    test('hides form when success message is shown', async () => {
      const user = userEvent.setup({ delay: null })
      render(<EmailSignup />)

      await user.type(screen.getByPlaceholderText('Enter your email for early access'), 'test@example.com')
      await user.click(screen.getByRole('button', { name: /get early access/i }))

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByText(/welcome to early access/i)).toBeInTheDocument()
      })

      expect(screen.queryByRole('button', { name: /get early access/i })).not.toBeInTheDocument()
    })

    test('resets to idle state after 3 seconds', async () => {
      const user = userEvent.setup({ delay: null })
      render(<EmailSignup />)

      await user.type(screen.getByPlaceholderText('Enter your email for early access'), 'test@example.com')
      await user.click(screen.getByRole('button', { name: /get early access/i }))

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByText(/welcome to early access/i)).toBeInTheDocument()
      })

      jest.advanceTimersByTime(3000)

      await waitFor(() => {
        expect(screen.queryByText(/welcome to early access/i)).not.toBeInTheDocument()
        expect(screen.getByPlaceholderText('Enter your email for early access')).toBeInTheDocument()
      })
    })

    test('applies success styling classes in success state', async () => {
      const user = userEvent.setup({ delay: null })
      render(<EmailSignup />)

      await user.type(screen.getByPlaceholderText('Enter your email for early access'), 'test@example.com')
      await user.click(screen.getByRole('button', { name: /get early access/i }))

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        const successDiv = screen.getByText(/welcome to early access/i).closest('div').parentElement
        expect(successDiv).toHaveClass('bg-success/10', 'border', 'border-success/20')
      })
    })

    test('applies correct max-width for success message in default variant', async () => {
      const user = userEvent.setup({ delay: null })
      render(<EmailSignup variant="default" />)

      await user.type(screen.getByPlaceholderText('Enter your email for early access'), 'test@example.com')
      await user.click(screen.getByRole('button', { name: /get early access/i }))

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        const successDiv = screen.getByText(/welcome to early access/i).closest('div').parentElement
        expect(successDiv).toHaveClass('max-w-sm')
      })
    })

    test('applies correct max-width for success message in large variant', async () => {
      const user = userEvent.setup({ delay: null })
      render(<EmailSignup variant="large" />)

      await user.type(screen.getByPlaceholderText('Enter your email for early access'), 'test@example.com')
      await user.click(screen.getByRole('button', { name: /get early access/i }))

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        const successDiv = screen.getByText(/welcome to early access/i).closest('div').parentElement
        expect(successDiv).toHaveClass('max-w-md')
      })
    })
  })

  describe('Keyboard Interaction', () => {
    test('submits form on Enter key press', async () => {
      const user = userEvent.setup({ delay: null })
      render(<EmailSignup />)
      const input = screen.getByPlaceholderText('Enter your email for early access')

      await user.type(input, 'test@example.com')
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(screen.getByText(/joining.../i)).toBeInTheDocument()
      })
    })

    test('does not submit invalid email on Enter key', async () => {
      const user = userEvent.setup({ delay: null })
      render(<EmailSignup />)
      const input = screen.getByPlaceholderText('Enter your email for early access')

      await user.type(input, 'invalid')
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
      })
    })

    test('can tab to submit button', async () => {
      const user = userEvent.setup({ delay: null })
      render(<EmailSignup />)

      await user.type(screen.getByPlaceholderText('Enter your email for early access'), 'test@example.com')
      await user.tab()

      expect(screen.getByRole('button', { name: /get early access/i })).toHaveFocus()
    })

    test('can activate submit button with Space key', async () => {
      const user = userEvent.setup({ delay: null })
      render(<EmailSignup />)

      await user.type(screen.getByPlaceholderText('Enter your email for early access'), 'test@example.com')
      await user.tab()
      await user.keyboard(' ')

      await waitFor(() => {
        expect(screen.getByText(/joining.../i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    test('error message clears when entering new email', async () => {
      const user = userEvent.setup({ delay: null })
      render(<EmailSignup />)
      const input = screen.getByPlaceholderText('Enter your email for early access')

      await user.type(input, 'invalid')
      await user.click(screen.getByRole('button', { name: /get early access/i }))

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
      })

      jest.advanceTimersByTime(3000)

      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument()
      })
    })

    test('does not clear email input on validation error', async () => {
      const user = userEvent.setup({ delay: null })
      render(<EmailSignup />)
      const input = screen.getByPlaceholderText('Enter your email for early access')

      await user.type(input, 'invalid')
      await user.click(screen.getByRole('button', { name: /get early access/i }))

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
      })

      expect(input).toHaveValue('invalid')
    })

    test('removes error styling after error timeout', async () => {
      const user = userEvent.setup({ delay: null })
      render(<EmailSignup />)
      const input = screen.getByPlaceholderText('Enter your email for early access')

      await user.type(input, 'invalid')
      await user.click(screen.getByRole('button', { name: /get early access/i }))

      await waitFor(() => {
        expect(input).toHaveClass('border-error')
      })

      jest.advanceTimersByTime(3000)

      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument()
      })
    })

    test('can submit again after error clears', async () => {
      const user = userEvent.setup({ delay: null })
      render(<EmailSignup />)
      const input = screen.getByPlaceholderText('Enter your email for early access')

      await user.type(input, 'invalid')
      await user.click(screen.getByRole('button', { name: /get early access/i }))

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
      })

      await user.clear(input)
      await user.type(input, 'valid@example.com')
      await user.click(screen.getByRole('button', { name: /get early access/i }))

      await waitFor(() => {
        expect(screen.getByText(/joining.../i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission Flow', () => {
    test('complete successful submission flow', async () => {
      const user = userEvent.setup({ delay: null })
      render(<EmailSignup />)

      const input = screen.getByPlaceholderText('Enter your email for early access')
      expect(screen.getByRole('button', { name: /get early access/i })).toBeDisabled()

      await user.type(input, 'user@example.com')
      expect(screen.getByRole('button', { name: /get early access/i })).not.toBeDisabled()

      await user.click(screen.getByRole('button', { name: /get early access/i }))
      expect(screen.getByText(/joining.../i)).toBeInTheDocument()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByText(/welcome to early access/i)).toBeInTheDocument()
      })

      expect(input).toHaveValue('')

      jest.advanceTimersByTime(3000)

      await waitFor(() => {
        expect(screen.queryByText(/welcome to early access/i)).not.toBeInTheDocument()
        expect(screen.getByPlaceholderText('Enter your email for early access')).toBeInTheDocument()
      })
    })

    test('complete error flow', async () => {
      const user = userEvent.setup({ delay: null })
      render(<EmailSignup />)

      const input = screen.getByPlaceholderText('Enter your email for early access')
      await user.type(input, 'notanemail')

      await user.click(screen.getByRole('button', { name: /get early access/i }))

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
      })

      expect(input).toHaveValue('notanemail')
      expect(input).toHaveClass('border-error')

      jest.advanceTimersByTime(3000)

      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument()
      })
    })

    test('prevents double submission during loading', async () => {
      const user = userEvent.setup({ delay: null })
      render(<EmailSignup />)

      await user.type(screen.getByPlaceholderText('Enter your email for early access'), 'test@example.com')
      const button = screen.getByRole('button', { name: /get early access/i })

      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText(/joining.../i)).toBeInTheDocument()
      })

      const loadingButton = screen.getByRole('button', { name: /joining.../i })
      expect(loadingButton).toBeDisabled()

      await user.click(loadingButton)

      expect(loadingButton).toBeDisabled()
    })
  })
})

export default emailInput
