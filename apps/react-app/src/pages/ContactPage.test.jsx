/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import ContactPage from './ContactPage'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}))

// Mock Math.random for consistent testing
const mockMathRandom = jest.spyOn(global.Math, 'random')

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('ContactPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    mockMathRandom.mockReturnValue(0.5) // Default to success (not < 0.1)
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Initial Rendering', () => {
    it('renders without crashing', () => {
      const { container } = renderWithRouter(<ContactPage />)
      expect(container).toBeInTheDocument()
    })

    it('renders the main heading', () => {
      renderWithRouter(<ContactPage />)
      expect(screen.getByRole('heading', { name: /Contact Us/i })).toBeInTheDocument()
    })

    it('renders the subtitle text', () => {
      renderWithRouter(<ContactPage />)
      expect(screen.getByText(/Have a question or need help\?/i)).toBeInTheDocument()
    })

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      renderWithRouter(<ContactPage />)
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('has correct aria-label on main container', () => {
      renderWithRouter(<ContactPage />)
      const mainContainer = screen.getByRole('main', { name: /Contact page/i })
      expect(mainContainer).toBeInTheDocument()
    })

    it('renders all form fields', () => {
      renderWithRouter(<ContactPage />)
      expect(screen.getByPlaceholderText(/Enter your name/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/your@email.com/i)).toBeInTheDocument()
      expect(screen.getByRole('combobox')).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/Tell us how we can help/i)).toBeInTheDocument()
    })

    it('renders submit button', () => {
      renderWithRouter(<ContactPage />)
      expect(screen.getByRole('button', { name: /Send Message/i })).toBeInTheDocument()
    })

    it('renders help center link', () => {
      renderWithRouter(<ContactPage />)
      expect(screen.getByRole('link', { name: /Visit Help Center/i })).toBeInTheDocument()
    })

    it('renders back to home link', () => {
      renderWithRouter(<ContactPage />)
      expect(screen.getByRole('link', { name: /← Back to Home/i })).toBeInTheDocument()
    })

    it('displays all required field indicators', () => {
      renderWithRouter(<ContactPage />)
      const asterisks = screen.getAllByText('*')
      expect(asterisks).toHaveLength(4) // Name, Email, Subject, Message
    })
  })

  describe('Form Labels', () => {
    it('renders name label', () => {
      renderWithRouter(<ContactPage />)
      expect(screen.getByText(/Your Name/i)).toBeInTheDocument()
    })

    it('renders email label', () => {
      renderWithRouter(<ContactPage />)
      expect(screen.getByText(/Email Address/i)).toBeInTheDocument()
    })

    it('renders subject label', () => {
      renderWithRouter(<ContactPage />)
      expect(screen.getByText(/^Subject/i)).toBeInTheDocument()
    })

    it('renders message label', () => {
      renderWithRouter(<ContactPage />)
      expect(screen.getByText(/^Message/i)).toBeInTheDocument()
    })
  })

  describe('Name Field Validation', () => {
    it('shows error when name is empty and form is submitted', async () => {
      renderWithRouter(<ContactPage />)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Name is required/i)).toBeInTheDocument()
      })
    })

    it('shows error when name is only whitespace', async () => {
      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(nameInput, { target: { value: '   ' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Name is required/i)).toBeInTheDocument()
      })
    })

    it('shows error when name is less than 2 characters', async () => {
      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(nameInput, { target: { value: 'A' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Name must be at least 2 characters/i)).toBeInTheDocument()
      })
    })

    it('accepts valid name with 2 characters', async () => {
      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(nameInput, { target: { value: 'Jo' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(subjectSelect, { target: { value: 'general' } })
      fireEvent.change(messageInput, { target: { value: 'This is a test message.' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByText(/Name must be at least 2 characters/i)).not.toBeInTheDocument()
      })
    })

    it('clears name error when user starts typing', async () => {
      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Name is required/i)).toBeInTheDocument()
      })

      fireEvent.change(nameInput, { target: { value: 'John' } })

      await waitFor(() => {
        expect(screen.queryByText(/Name is required/i)).not.toBeInTheDocument()
      })
    })

    it('applies error styling to name field when invalid', async () => {
      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(nameInput).toHaveClass('border-danger')
      })
    })
  })

  describe('Email Field Validation', () => {
    it('shows error when email is empty', async () => {
      renderWithRouter(<ContactPage />)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Email is required/i)).toBeInTheDocument()
      })
    })

    it('shows error when email is only whitespace', async () => {
      renderWithRouter(<ContactPage />)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(emailInput, { target: { value: '   ' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Email is required/i)).toBeInTheDocument()
      })
    })

    it('shows error for invalid email format - no @', async () => {
      renderWithRouter(<ContactPage />)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Email is invalid/i)).toBeInTheDocument()
      })
    })

    it('shows error for invalid email format - no domain', async () => {
      renderWithRouter(<ContactPage />)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(emailInput, { target: { value: 'test@' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Email is invalid/i)).toBeInTheDocument()
      })
    })

    it('shows error for invalid email format - no extension', async () => {
      renderWithRouter(<ContactPage />)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(emailInput, { target: { value: 'test@example' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Email is invalid/i)).toBeInTheDocument()
      })
    })

    it('accepts valid email format', async () => {
      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(subjectSelect, { target: { value: 'general' } })
      fireEvent.change(messageInput, { target: { value: 'This is a test message.' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByText(/Email is invalid/i)).not.toBeInTheDocument()
      })
    })

    it('clears email error when user starts typing', async () => {
      renderWithRouter(<ContactPage />)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Email is required/i)).toBeInTheDocument()
      })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      await waitFor(() => {
        expect(screen.queryByText(/Email is required/i)).not.toBeInTheDocument()
      })
    })

    it('applies error styling to email field when invalid', async () => {
      renderWithRouter(<ContactPage />)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(emailInput).toHaveClass('border-danger')
      })
    })

    it('has correct input type for email field', () => {
      renderWithRouter(<ContactPage />)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      expect(emailInput).toHaveAttribute('type', 'email')
    })
  })

  describe('Subject Field Validation', () => {
    it('shows error when subject is not selected', async () => {
      renderWithRouter(<ContactPage />)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Please select a subject/i)).toBeInTheDocument()
      })
    })

    it('renders all subject options', () => {
      renderWithRouter(<ContactPage />)
      const subjectSelect = screen.getByRole('combobox')

      expect(subjectSelect).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /Select a subject/i })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /General Question/i })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /Technical Support/i })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /Account Issues/i })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /Community Guidelines/i })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /Billing & Payments/i })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /Other/i })).toBeInTheDocument()
    })

    it('allows selecting general subject', async () => {
      renderWithRouter(<ContactPage />)
      const subjectSelect = screen.getByRole('combobox')

      fireEvent.change(subjectSelect, { target: { value: 'general' } })

      expect(subjectSelect.value).toBe('general')
    })

    it('allows selecting technical support subject', async () => {
      renderWithRouter(<ContactPage />)
      const subjectSelect = screen.getByRole('combobox')

      fireEvent.change(subjectSelect, { target: { value: 'technical' } })

      expect(subjectSelect.value).toBe('technical')
    })

    it('allows selecting account issues subject', async () => {
      renderWithRouter(<ContactPage />)
      const subjectSelect = screen.getByRole('combobox')

      fireEvent.change(subjectSelect, { target: { value: 'account' } })

      expect(subjectSelect.value).toBe('account')
    })

    it('allows selecting community guidelines subject', async () => {
      renderWithRouter(<ContactPage />)
      const subjectSelect = screen.getByRole('combobox')

      fireEvent.change(subjectSelect, { target: { value: 'community' } })

      expect(subjectSelect.value).toBe('community')
    })

    it('allows selecting billing subject', async () => {
      renderWithRouter(<ContactPage />)
      const subjectSelect = screen.getByRole('combobox')

      fireEvent.change(subjectSelect, { target: { value: 'billing' } })

      expect(subjectSelect.value).toBe('billing')
    })

    it('allows selecting other subject', async () => {
      renderWithRouter(<ContactPage />)
      const subjectSelect = screen.getByRole('combobox')

      fireEvent.change(subjectSelect, { target: { value: 'other' } })

      expect(subjectSelect.value).toBe('other')
    })

    it('clears subject error when user selects an option', async () => {
      renderWithRouter(<ContactPage />)
      const subjectSelect = screen.getByRole('combobox')
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Please select a subject/i)).toBeInTheDocument()
      })

      fireEvent.change(subjectSelect, { target: { value: 'general' } })

      await waitFor(() => {
        expect(screen.queryByText(/Please select a subject/i)).not.toBeInTheDocument()
      })
    })

    it('applies error styling to subject field when invalid', async () => {
      renderWithRouter(<ContactPage />)
      const subjectSelect = screen.getByRole('combobox')
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(subjectSelect).toHaveClass('border-danger')
      })
    })
  })

  describe('Message Field Validation', () => {
    it('shows error when message is empty', async () => {
      renderWithRouter(<ContactPage />)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Message is required/i)).toBeInTheDocument()
      })
    })

    it('shows error when message is only whitespace', async () => {
      renderWithRouter(<ContactPage />)
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(messageInput, { target: { value: '   ' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Message is required/i)).toBeInTheDocument()
      })
    })

    it('shows error when message is less than 10 characters', async () => {
      renderWithRouter(<ContactPage />)
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(messageInput, { target: { value: 'Short' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Message must be at least 10 characters/i)).toBeInTheDocument()
      })
    })

    it('shows error when message exceeds 1000 characters', async () => {
      renderWithRouter(<ContactPage />)
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      const longMessage = 'a'.repeat(1001)
      fireEvent.change(messageInput, { target: { value: longMessage } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Message must not exceed 1000 characters/i)).toBeInTheDocument()
      })
    })

    it('accepts message with exactly 10 characters', async () => {
      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(subjectSelect, { target: { value: 'general' } })
      fireEvent.change(messageInput, { target: { value: '1234567890' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByText(/Message must be at least 10 characters/i)).not.toBeInTheDocument()
      })
    })

    it('accepts message with exactly 1000 characters', async () => {
      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      const maxMessage = 'a'.repeat(1000)
      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(subjectSelect, { target: { value: 'general' } })
      fireEvent.change(messageInput, { target: { value: maxMessage } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByText(/Message must not exceed 1000 characters/i)).not.toBeInTheDocument()
      })
    })

    it('displays character counter', () => {
      renderWithRouter(<ContactPage />)
      expect(screen.getByText(/0\/1000 characters/i)).toBeInTheDocument()
    })

    it('updates character counter as user types', async () => {
      renderWithRouter(<ContactPage />)
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)

      fireEvent.change(messageInput, { target: { value: 'Hello World' } })

      await waitFor(() => {
        expect(screen.getByText(/11\/1000 characters/i)).toBeInTheDocument()
      })
    })

    it('replaces character counter with error message when present', async () => {
      renderWithRouter(<ContactPage />)
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(messageInput, { target: { value: 'Short' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Message must be at least 10 characters/i)).toBeInTheDocument()
        expect(screen.queryByText(/5\/1000 characters/i)).not.toBeInTheDocument()
      })
    })

    it('clears message error when user starts typing', async () => {
      renderWithRouter(<ContactPage />)
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Message is required/i)).toBeInTheDocument()
      })

      fireEvent.change(messageInput, { target: { value: 'This is a test message.' } })

      await waitFor(() => {
        expect(screen.queryByText(/Message is required/i)).not.toBeInTheDocument()
      })
    })

    it('applies error styling to message field when invalid', async () => {
      renderWithRouter(<ContactPage />)
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(messageInput).toHaveClass('border-danger')
      })
    })

    it('has correct number of rows for textarea', () => {
      renderWithRouter(<ContactPage />)
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      expect(messageInput).toHaveAttribute('rows', '6')
    })
  })

  describe('Form Submission', () => {
    it('submits form with valid data', async () => {
      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
      fireEvent.change(subjectSelect, { target: { value: 'general' } })
      fireEvent.change(messageInput, { target: { value: 'This is a test message with enough characters.' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Sending.../i)).toBeInTheDocument()
      })
    })

    it('prevents default form submission behavior', async () => {
      renderWithRouter(<ContactPage />)
      const form = screen.getByRole('button', { name: /Send Message/i }).closest('form')
      const handleSubmit = jest.fn((e) => e.preventDefault())
      form.onsubmit = handleSubmit

      const submitButton = screen.getByRole('button', { name: /Send Message/i })
      fireEvent.click(submitButton)

      expect(handleSubmit).toHaveBeenCalled()
    })

    it('does not submit when validation fails', async () => {
      renderWithRouter(<ContactPage />)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByText(/Sending.../i)).not.toBeInTheDocument()
      })
    })

    it('clears previous errors on new submission', async () => {
      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Name is required/i)).toBeInTheDocument()
      })

      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByText(/Name is required/i)).not.toBeInTheDocument()
      })
    })

    it('validates all fields before submission', async () => {
      renderWithRouter(<ContactPage />)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Name is required/i)).toBeInTheDocument()
        expect(screen.getByText(/Email is required/i)).toBeInTheDocument()
        expect(screen.getByText(/Please select a subject/i)).toBeInTheDocument()
        expect(screen.getByText(/Message is required/i)).toBeInTheDocument()
      })
    })
  })

  describe('Loading State', () => {
    it('displays loading spinner during submission', async () => {
      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
      fireEvent.change(subjectSelect, { target: { value: 'general' } })
      fireEvent.change(messageInput, { target: { value: 'This is a test message.' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Sending.../i)).toBeInTheDocument()
      })
    })

    it('disables submit button during loading', async () => {
      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
      fireEvent.change(subjectSelect, { target: { value: 'general' } })
      fireEvent.change(messageInput, { target: { value: 'This is a test message.' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /Sending.../i })
        expect(button).toBeDisabled()
      })
    })

    it('disables all form fields during loading', async () => {
      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
      fireEvent.change(subjectSelect, { target: { value: 'general' } })
      fireEvent.change(messageInput, { target: { value: 'This is a test message.' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(nameInput).toBeDisabled()
        expect(emailInput).toBeDisabled()
        expect(subjectSelect).toBeDisabled()
        expect(messageInput).toBeDisabled()
      })
    })

    it('disables help center link during loading', async () => {
      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
      fireEvent.change(subjectSelect, { target: { value: 'general' } })
      fireEvent.change(messageInput, { target: { value: 'This is a test message.' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        const helpLink = screen.getByRole('link', { name: /Visit Help Center/i })
        expect(helpLink).toHaveClass('pointer-events-none', 'opacity-50')
      })
    })
  })

  describe('Success State', () => {
    it('displays success message after submission', async () => {
      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
      fireEvent.change(subjectSelect, { target: { value: 'general' } })
      fireEvent.change(messageInput, { target: { value: 'This is a test message.' } })
      fireEvent.click(submitButton)

      jest.advanceTimersByTime(1500)

      await waitFor(() => {
        expect(screen.getByText(/Message Sent!/i)).toBeInTheDocument()
      })
    })

    it('displays thank you message on success', async () => {
      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
      fireEvent.change(subjectSelect, { target: { value: 'general' } })
      fireEvent.change(messageInput, { target: { value: 'This is a test message.' } })
      fireEvent.click(submitButton)

      jest.advanceTimersByTime(1500)

      await waitFor(() => {
        expect(screen.getByText(/Thank you for contacting us/i)).toBeInTheDocument()
      })
    })

    it('displays 24-hour response time message', async () => {
      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
      fireEvent.change(subjectSelect, { target: { value: 'general' } })
      fireEvent.change(messageInput, { target: { value: 'This is a test message.' } })
      fireEvent.click(submitButton)

      jest.advanceTimersByTime(1500)

      await waitFor(() => {
        expect(screen.getByText(/within 24 hours/i)).toBeInTheDocument()
      })
    })

    it('displays success icon', async () => {
      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
      fireEvent.change(subjectSelect, { target: { value: 'general' } })
      fireEvent.change(messageInput, { target: { value: 'This is a test message.' } })
      fireEvent.click(submitButton)

      jest.advanceTimersByTime(1500)

      await waitFor(() => {
        const successIcon = document.querySelector('.text-success svg')
        expect(successIcon).toBeInTheDocument()
      })
    })

    it('displays Back to Home button on success', async () => {
      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
      fireEvent.change(subjectSelect, { target: { value: 'general' } })
      fireEvent.change(messageInput, { target: { value: 'This is a test message.' } })
      fireEvent.click(submitButton)

      jest.advanceTimersByTime(1500)

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /Back to Home/i })).toBeInTheDocument()
      })
    })

    it('displays Send Another Message button on success', async () => {
      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
      fireEvent.change(subjectSelect, { target: { value: 'general' } })
      fireEvent.change(messageInput, { target: { value: 'This is a test message.' } })
      fireEvent.click(submitButton)

      jest.advanceTimersByTime(1500)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Send Another Message/i })).toBeInTheDocument()
      })
    })

    it('resets form when Send Another Message is clicked', async () => {
      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
      fireEvent.change(subjectSelect, { target: { value: 'general' } })
      fireEvent.change(messageInput, { target: { value: 'This is a test message.' } })
      fireEvent.click(submitButton)

      jest.advanceTimersByTime(1500)

      await waitFor(() => {
        expect(screen.getByText(/Message Sent!/i)).toBeInTheDocument()
      })

      const sendAnotherButton = screen.getByRole('button', { name: /Send Another Message/i })
      fireEvent.click(sendAnotherButton)

      await waitFor(() => {
        expect(screen.queryByText(/Message Sent!/i)).not.toBeInTheDocument()
        expect(screen.getByRole('heading', { name: /Contact Us/i })).toBeInTheDocument()
      })
    })

    it('clears form data on successful submission', async () => {
      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
      fireEvent.change(subjectSelect, { target: { value: 'general' } })
      fireEvent.change(messageInput, { target: { value: 'This is a test message.' } })
      fireEvent.click(submitButton)

      jest.advanceTimersByTime(1500)

      await waitFor(() => {
        expect(screen.getByText(/Message Sent!/i)).toBeInTheDocument()
      })

      const sendAnotherButton = screen.getByRole('button', { name: /Send Another Message/i })
      fireEvent.click(sendAnotherButton)

      await waitFor(() => {
        const newNameInput = screen.getByPlaceholderText(/Enter your name/i)
        const newEmailInput = screen.getByPlaceholderText(/your@email.com/i)
        const newSubjectSelect = screen.getByRole('combobox')
        const newMessageInput = screen.getByPlaceholderText(/Tell us how we can help/i)

        expect(newNameInput.value).toBe('')
        expect(newEmailInput.value).toBe('')
        expect(newSubjectSelect.value).toBe('')
        expect(newMessageInput.value).toBe('')
      })
    })

    it('has correct main content aria-label on success screen', async () => {
      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
      fireEvent.change(subjectSelect, { target: { value: 'general' } })
      fireEvent.change(messageInput, { target: { value: 'This is a test message.' } })
      fireEvent.click(submitButton)

      jest.advanceTimersByTime(1500)

      await waitFor(() => {
        expect(screen.getByRole('main', { name: /Page content/i })).toBeInTheDocument()
      })
    })
  })

  describe('Error State', () => {
    it('displays error message on submission failure', async () => {
      mockMathRandom.mockReturnValue(0.05) // Force error (< 0.1)

      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
      fireEvent.change(subjectSelect, { target: { value: 'general' } })
      fireEvent.change(messageInput, { target: { value: 'This is a test message.' } })
      fireEvent.click(submitButton)

      jest.advanceTimersByTime(1500)

      await waitFor(() => {
        expect(screen.getByText(/Failed to send message/i)).toBeInTheDocument()
      })
    })

    it('displays error icon on submission failure', async () => {
      mockMathRandom.mockReturnValue(0.05)

      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
      fireEvent.change(subjectSelect, { target: { value: 'general' } })
      fireEvent.change(messageInput, { target: { value: 'This is a test message.' } })
      fireEvent.click(submitButton)

      jest.advanceTimersByTime(1500)

      await waitFor(() => {
        const errorIcon = screen.getByText(/Failed to send message/i).closest('div').querySelector('svg')
        expect(errorIcon).toBeInTheDocument()
      })
    })

    it('displays Error heading in error alert', async () => {
      mockMathRandom.mockReturnValue(0.05)

      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
      fireEvent.change(subjectSelect, { target: { value: 'general' } })
      fireEvent.change(messageInput, { target: { value: 'This is a test message.' } })
      fireEvent.click(submitButton)

      jest.advanceTimersByTime(1500)

      await waitFor(() => {
        expect(screen.getByText(/^Error$/i)).toBeInTheDocument()
      })
    })

    it('allows retry after error', async () => {
      mockMathRandom.mockReturnValue(0.05)

      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      let submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
      fireEvent.change(subjectSelect, { target: { value: 'general' } })
      fireEvent.change(messageInput, { target: { value: 'This is a test message.' } })
      fireEvent.click(submitButton)

      jest.advanceTimersByTime(1500)

      await waitFor(() => {
        expect(screen.getByText(/Failed to send message/i)).toBeInTheDocument()
      })

      // Now allow success
      mockMathRandom.mockReturnValue(0.5)

      submitButton = screen.getByRole('button', { name: /Send Message/i })
      fireEvent.click(submitButton)

      jest.advanceTimersByTime(1500)

      await waitFor(() => {
        expect(screen.getByText(/Message Sent!/i)).toBeInTheDocument()
      })
    })

    it('clears error message on new submission', async () => {
      mockMathRandom.mockReturnValue(0.05)

      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      let submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
      fireEvent.change(subjectSelect, { target: { value: 'general' } })
      fireEvent.change(messageInput, { target: { value: 'This is a test message.' } })
      fireEvent.click(submitButton)

      jest.advanceTimersByTime(1500)

      await waitFor(() => {
        expect(screen.getByText(/Failed to send message/i)).toBeInTheDocument()
      })

      submitButton = screen.getByRole('button', { name: /Send Message/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByText(/Failed to send message/i)).not.toBeInTheDocument()
      })
    })

    it('does not clear form data on error', async () => {
      mockMathRandom.mockReturnValue(0.05)

      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
      fireEvent.change(subjectSelect, { target: { value: 'general' } })
      fireEvent.change(messageInput, { target: { value: 'This is a test message.' } })
      fireEvent.click(submitButton)

      jest.advanceTimersByTime(1500)

      await waitFor(() => {
        expect(screen.getByText(/Failed to send message/i)).toBeInTheDocument()
        expect(nameInput.value).toBe('John Doe')
        expect(emailInput.value).toBe('john@example.com')
        expect(subjectSelect.value).toBe('general')
        expect(messageInput.value).toBe('This is a test message.')
      })
    })
  })

  describe('Navigation Links', () => {
    it('has correct href for home link', () => {
      renderWithRouter(<ContactPage />)
      const homeLink = screen.getByRole('link', { name: /← Back to Home/i })
      expect(homeLink).toHaveAttribute('href', '/home')
    })

    it('has correct href for help center link', () => {
      renderWithRouter(<ContactPage />)
      const helpLink = screen.getByRole('link', { name: /Visit Help Center/i })
      expect(helpLink).toHaveAttribute('href', '/help')
    })

    it('has correct href for success back to home link', async () => {
      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
      fireEvent.change(subjectSelect, { target: { value: 'general' } })
      fireEvent.change(messageInput, { target: { value: 'This is a test message.' } })
      fireEvent.click(submitButton)

      jest.advanceTimersByTime(1500)

      await waitFor(() => {
        const homeLink = screen.getByRole('link', { name: /Back to Home/i })
        expect(homeLink).toHaveAttribute('href', '/home')
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA roles', () => {
      renderWithRouter(<ContactPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Send Message/i })).toBeInTheDocument()
    })

    it('has proper heading hierarchy', () => {
      renderWithRouter(<ContactPage />)
      const heading = screen.getByRole('heading', { name: /Contact Us/i })
      expect(heading).toBeInTheDocument()
      expect(heading.tagName).toBe('H1')
    })

    it('form fields have associated labels', () => {
      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)

      expect(nameInput.previousElementSibling).toHaveTextContent(/Your Name/)
      expect(emailInput.previousElementSibling).toHaveTextContent(/Email Address/)
      expect(subjectSelect.previousElementSibling).toHaveTextContent(/Subject/)
      expect(messageInput.previousElementSibling).toHaveTextContent(/Message/)
    })

    it('error messages are associated with form fields', async () => {
      renderWithRouter(<ContactPage />)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.click(submitButton)

      await waitFor(() => {
        const nameError = screen.getByText(/Name is required/i)
        expect(nameError).toBeInTheDocument()
        expect(nameError.className).toContain('text-danger')
      })
    })

    it('success heading has proper hierarchy', async () => {
      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
      fireEvent.change(subjectSelect, { target: { value: 'general' } })
      fireEvent.change(messageInput, { target: { value: 'This is a test message.' } })
      fireEvent.click(submitButton)

      jest.advanceTimersByTime(1500)

      await waitFor(() => {
        const successHeading = screen.getByRole('heading', { name: /Message Sent!/i })
        expect(successHeading).toBeInTheDocument()
        expect(successHeading.tagName).toBe('H1')
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles rapid form submissions', async () => {
      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
      fireEvent.change(subjectSelect, { target: { value: 'general' } })
      fireEvent.change(messageInput, { target: { value: 'This is a test message.' } })

      fireEvent.click(submitButton)
      fireEvent.click(submitButton)
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Sending.../i)).toBeInTheDocument()
      })
    })

    it('handles special characters in name', async () => {
      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(nameInput, { target: { value: "O'Brien-Smith" } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(subjectSelect, { target: { value: 'general' } })
      fireEvent.change(messageInput, { target: { value: 'This is a test message.' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByText(/Name is required/i)).not.toBeInTheDocument()
      })
    })

    it('handles unicode characters in message', async () => {
      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(subjectSelect, { target: { value: 'general' } })
      fireEvent.change(messageInput, { target: { value: 'Testing émojis 😀 and spëcial çhars' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByText(/Message is required/i)).not.toBeInTheDocument()
      })
    })

    it('handles very long names', async () => {
      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)

      const longName = 'A'.repeat(200)
      fireEvent.change(nameInput, { target: { value: longName } })

      expect(nameInput.value).toBe(longName)
    })

    it('handles email with plus addressing', async () => {
      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'test+tag@example.com' } })
      fireEvent.change(subjectSelect, { target: { value: 'general' } })
      fireEvent.change(messageInput, { target: { value: 'This is a test message.' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByText(/Email is invalid/i)).not.toBeInTheDocument()
      })
    })

    it('handles message with exactly boundary characters', async () => {
      renderWithRouter(<ContactPage />)
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)

      const message999 = 'a'.repeat(999)
      fireEvent.change(messageInput, { target: { value: message999 } })

      await waitFor(() => {
        expect(screen.getByText(/999\/1000 characters/i)).toBeInTheDocument()
      })
    })

    it('trims whitespace from name during validation', async () => {
      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(nameInput, { target: { value: '  John Doe  ' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(subjectSelect, { target: { value: 'general' } })
      fireEvent.change(messageInput, { target: { value: 'This is a test message.' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByText(/Name is required/i)).not.toBeInTheDocument()
      })
    })

    it('trims whitespace from email during validation', async () => {
      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: '  test@example.com  ' } })
      fireEvent.change(subjectSelect, { target: { value: 'general' } })
      fireEvent.change(messageInput, { target: { value: 'This is a test message.' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByText(/Email is invalid/i)).not.toBeInTheDocument()
      })
    })

    it('trims whitespace from message during validation', async () => {
      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(subjectSelect, { target: { value: 'general' } })
      fireEvent.change(messageInput, { target: { value: '  This is a test message.  ' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByText(/Message is required/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('User Event Library Tests', () => {
    it('handles typing in name field with userEvent', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)

      await user.type(nameInput, 'Jane Doe')

      expect(nameInput.value).toBe('Jane Doe')
    })

    it('handles typing in email field with userEvent', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithRouter(<ContactPage />)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)

      await user.type(emailInput, 'jane@example.com')

      expect(emailInput.value).toBe('jane@example.com')
    })

    it('handles selecting subject with userEvent', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithRouter(<ContactPage />)
      const subjectSelect = screen.getByRole('combobox')

      await user.selectOptions(subjectSelect, 'technical')

      expect(subjectSelect.value).toBe('technical')
    })

    it('handles typing in message field with userEvent', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithRouter(<ContactPage />)
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)

      await user.type(messageInput, 'This is my message')

      expect(messageInput.value).toBe('This is my message')
    })

    it('handles clicking submit button with userEvent', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithRouter(<ContactPage />)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Name is required/i)).toBeInTheDocument()
      })
    })

    it('handles complete form flow with userEvent', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithRouter(<ContactPage />)

      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      await user.type(nameInput, 'Test User')
      await user.type(emailInput, 'test@example.com')
      await user.selectOptions(subjectSelect, 'billing')
      await user.type(messageInput, 'I need help with my billing.')
      await user.click(submitButton)

      jest.advanceTimersByTime(1500)

      await waitFor(() => {
        expect(screen.getByText(/Message Sent!/i)).toBeInTheDocument()
      })
    })

    it('handles tab navigation with userEvent', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithRouter(<ContactPage />)

      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)

      nameInput.focus()
      expect(document.activeElement).toBe(nameInput)

      await user.tab()
      expect(document.activeElement).toBe(emailInput)
    })

    it('handles clearing and retyping with userEvent', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)

      await user.type(nameInput, 'Initial Name')
      expect(nameInput.value).toBe('Initial Name')

      await user.clear(nameInput)
      expect(nameInput.value).toBe('')

      await user.type(nameInput, 'New Name')
      expect(nameInput.value).toBe('New Name')
    })
  })

  describe('Snapshot Tests', () => {
    it('matches snapshot for initial render', () => {
      const { container } = renderWithRouter(<ContactPage />)
      expect(container).toMatchSnapshot()
    })

    it('matches snapshot with validation errors', async () => {
      const { container } = renderWithRouter(<ContactPage />)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Name is required/i)).toBeInTheDocument()
      })

      expect(container).toMatchSnapshot()
    })

    it('matches snapshot during loading state', async () => {
      const { container } = renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
      fireEvent.change(subjectSelect, { target: { value: 'general' } })
      fireEvent.change(messageInput, { target: { value: 'This is a test message.' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Sending.../i)).toBeInTheDocument()
      })

      expect(container).toMatchSnapshot()
    })

    it('matches snapshot for success state', async () => {
      const { container } = renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
      fireEvent.change(subjectSelect, { target: { value: 'general' } })
      fireEvent.change(messageInput, { target: { value: 'This is a test message.' } })
      fireEvent.click(submitButton)

      jest.advanceTimersByTime(1500)

      await waitFor(() => {
        expect(screen.getByText(/Message Sent!/i)).toBeInTheDocument()
      })

      expect(container).toMatchSnapshot()
    })

    it('matches snapshot for error state', async () => {
      mockMathRandom.mockReturnValue(0.05)

      const { container } = renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
      fireEvent.change(subjectSelect, { target: { value: 'general' } })
      fireEvent.change(messageInput, { target: { value: 'This is a test message.' } })
      fireEvent.click(submitButton)

      jest.advanceTimersByTime(1500)

      await waitFor(() => {
        expect(screen.getByText(/Failed to send message/i)).toBeInTheDocument()
      })

      expect(container).toMatchSnapshot()
    })
  })

  describe('Form State Management', () => {
    it('maintains form state across field changes', async () => {
      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)

      fireEvent.change(nameInput, { target: { value: 'John' } })
      fireEvent.change(emailInput, { target: { value: 'john@test.com' } })
      fireEvent.change(subjectSelect, { target: { value: 'account' } })
      fireEvent.change(messageInput, { target: { value: 'Help needed' } })

      expect(nameInput.value).toBe('John')
      expect(emailInput.value).toBe('john@test.com')
      expect(subjectSelect.value).toBe('account')
      expect(messageInput.value).toBe('Help needed')
    })

    it('preserves form data when validation fails', async () => {
      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(nameInput, { target: { value: 'J' } })
      fireEvent.change(emailInput, { target: { value: 'invalid' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Name must be at least 2 characters/i)).toBeInTheDocument()
        expect(nameInput.value).toBe('J')
        expect(emailInput.value).toBe('invalid')
      })
    })

    it('initializes all form fields with empty values', () => {
      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)

      expect(nameInput.value).toBe('')
      expect(emailInput.value).toBe('')
      expect(subjectSelect.value).toBe('')
      expect(messageInput.value).toBe('')
    })
  })

  describe('Button States', () => {
    it('submit button has correct default styling', () => {
      renderWithRouter(<ContactPage />)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })
      expect(submitButton).toHaveClass('btn', 'btn-primary')
    })

    it('help center link has correct styling', () => {
      renderWithRouter(<ContactPage />)
      const helpLink = screen.getByRole('link', { name: /Visit Help Center/i })
      expect(helpLink).toHaveClass('btn', 'btn-secondary')
    })

    it('back to home link has correct styling', () => {
      renderWithRouter(<ContactPage />)
      const homeLink = screen.getByRole('link', { name: /← Back to Home/i })
      expect(homeLink).toHaveClass('btn', 'btn-ghost')
    })

    it('success buttons have correct styling', async () => {
      renderWithRouter(<ContactPage />)
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      const subjectSelect = screen.getByRole('combobox')
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)
      const submitButton = screen.getByRole('button', { name: /Send Message/i })

      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
      fireEvent.change(subjectSelect, { target: { value: 'general' } })
      fireEvent.change(messageInput, { target: { value: 'This is a test message.' } })
      fireEvent.click(submitButton)

      jest.advanceTimersByTime(1500)

      await waitFor(() => {
        const homeLink = screen.getByRole('link', { name: /Back to Home/i })
        const anotherMessageButton = screen.getByRole('button', { name: /Send Another Message/i })
        expect(homeLink).toHaveClass('btn', 'btn-primary')
        expect(anotherMessageButton).toHaveClass('btn', 'btn-secondary')
      })
    })
  })

  describe('Character Counter Edge Cases', () => {
    it('shows correct count for multiline text', async () => {
      renderWithRouter(<ContactPage />)
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)

      fireEvent.change(messageInput, { target: { value: 'Line 1\nLine 2\nLine 3' } })

      await waitFor(() => {
        expect(screen.getByText(/20\/1000 characters/i)).toBeInTheDocument()
      })
    })

    it('counts special characters correctly', async () => {
      renderWithRouter(<ContactPage />)
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)

      fireEvent.change(messageInput, { target: { value: '!@#$%^&*()' } })

      await waitFor(() => {
        expect(screen.getByText(/10\/1000 characters/i)).toBeInTheDocument()
      })
    })

    it('updates counter in real-time', async () => {
      renderWithRouter(<ContactPage />)
      const messageInput = screen.getByPlaceholderText(/Tell us how we can help/i)

      expect(screen.getByText(/0\/1000 characters/i)).toBeInTheDocument()

      fireEvent.change(messageInput, { target: { value: 'Hello' } })
      await waitFor(() => {
        expect(screen.getByText(/5\/1000 characters/i)).toBeInTheDocument()
      })

      fireEvent.change(messageInput, { target: { value: 'Hello World' } })
      await waitFor(() => {
        expect(screen.getByText(/11\/1000 characters/i)).toBeInTheDocument()
      })
    })
  })
})

export default mockMathRandom
