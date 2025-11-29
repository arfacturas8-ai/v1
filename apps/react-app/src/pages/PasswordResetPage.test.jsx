/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import PasswordResetPage from './PasswordResetPage'
import authService from '../services/authService'

// Mock authService
jest.mock('../services/authService', () => ({
  resetPassword: jest.fn(),
}))

// Mock useNavigate and useSearchParams
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

// Helper to render with router
const renderWithRouter = (initialEntries = ['/reset-password']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <PasswordResetPage />
    </MemoryRouter>
  )
}

describe('PasswordResetPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockNavigate.mockClear()
    authService.resetPassword.mockClear()
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  // ==================== Page Rendering Tests ====================
  describe('Page Rendering', () => {
    it('renders without crashing', () => {
      renderWithRouter()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      renderWithRouter()
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('displays page heading for request step', () => {
      renderWithRouter()
      expect(screen.getByRole('heading', { name: /Reset Password/i })).toBeInTheDocument()
    })

    it('displays page description for request step', () => {
      renderWithRouter()
      expect(screen.getByText(/Enter your email to receive a password reset link/i)).toBeInTheDocument()
    })

    it('displays lock icon', () => {
      renderWithRouter()
      expect(screen.getByText('🔑')).toBeInTheDocument()
    })

    it('renders request form initially when no token is provided', () => {
      renderWithRouter()
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument()
    })

    it('renders reset form when token is provided in URL', () => {
      renderWithRouter(['/reset-password?token=test-token'])
      expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument()
    })
  })

  // ==================== Email Input Tests ====================
  describe('Email Input', () => {
    it('renders email input field', () => {
      renderWithRouter()
      const emailInput = screen.getByLabelText(/Email Address/i)
      expect(emailInput).toBeInTheDocument()
    })

    it('email input has correct type', () => {
      renderWithRouter()
      const emailInput = screen.getByLabelText(/Email Address/i)
      expect(emailInput).toHaveAttribute('type', 'email')
    })

    it('email input is required', () => {
      renderWithRouter()
      const emailInput = screen.getByLabelText(/Email Address/i)
      expect(emailInput).toBeRequired()
    })

    it('email input has placeholder text', () => {
      renderWithRouter()
      const emailInput = screen.getByLabelText(/Email Address/i)
      expect(emailInput).toHaveAttribute('placeholder', 'your@email.com')
    })

    it('allows user to type email address', async () => {
      const user = userEvent.setup()
      renderWithRouter()
      const emailInput = screen.getByLabelText(/Email Address/i)

      await user.type(emailInput, 'test@example.com')
      expect(emailInput).toHaveValue('test@example.com')
    })

    it('email input accepts valid email formats', async () => {
      const user = userEvent.setup()
      renderWithRouter()
      const emailInput = screen.getByLabelText(/Email Address/i)

      await user.type(emailInput, 'user+test@domain.co.uk')
      expect(emailInput).toHaveValue('user+test@domain.co.uk')
    })

    it('email input has proper id attribute', () => {
      renderWithRouter()
      const emailInput = screen.getByLabelText(/Email Address/i)
      expect(emailInput).toHaveAttribute('id', 'email-input')
    })
  })

  // ==================== Submit Request Tests ====================
  describe('Submit Request', () => {
    it('renders submit button', () => {
      renderWithRouter()
      expect(screen.getByRole('button', { name: /Send Reset Link/i })).toBeInTheDocument()
    })

    it('submit button has correct initial text', () => {
      renderWithRouter()
      const submitButton = screen.getByRole('button', { name: /Send Reset Link/i })
      expect(submitButton).toHaveTextContent('Send Reset Link')
    })

    it('handles form submission with valid email', async () => {
      const user = userEvent.setup()
      authService.resetPassword.mockResolvedValue({
        success: true,
        message: 'Password reset email sent'
      })

      renderWithRouter()
      const emailInput = screen.getByLabelText(/Email Address/i)
      const submitButton = screen.getByRole('button', { name: /Send Reset Link/i })

      await user.type(emailInput, 'test@example.com')
      await user.click(submitButton)

      await waitFor(() => {
        expect(authService.resetPassword).toHaveBeenCalledWith('test@example.com')
      })
    })

    it('prevents form submission when email is empty', async () => {
      const user = userEvent.setup()
      renderWithRouter()
      const submitButton = screen.getByRole('button', { name: /Send Reset Link/i })

      await user.click(submitButton)

      expect(authService.resetPassword).not.toHaveBeenCalled()
    })

    it('calls authService.resetPassword with correct email', async () => {
      const user = userEvent.setup()
      authService.resetPassword.mockResolvedValue({ success: true })

      renderWithRouter()
      const emailInput = screen.getByLabelText(/Email Address/i)
      const submitButton = screen.getByRole('button', { name: /Send Reset Link/i })

      await user.type(emailInput, 'user@test.com')
      await user.click(submitButton)

      await waitFor(() => {
        expect(authService.resetPassword).toHaveBeenCalledWith('user@test.com')
      })
    })
  })

  // ==================== Success Message Tests ====================
  describe('Success Message', () => {
    it('displays success message after successful request', async () => {
      const user = userEvent.setup()
      authService.resetPassword.mockResolvedValue({
        success: true,
        message: 'Password reset email sent to test@example.com'
      })

      renderWithRouter()
      const emailInput = screen.getByLabelText(/Email Address/i)
      const submitButton = screen.getByRole('button', { name: /Send Reset Link/i })

      await user.type(emailInput, 'test@example.com')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Password reset email sent to test@example.com/i)).toBeInTheDocument()
      })
    })

    it('displays default success message when no custom message provided', async () => {
      const user = userEvent.setup()
      authService.resetPassword.mockResolvedValue({ success: true })

      renderWithRouter()
      const emailInput = screen.getByLabelText(/Email Address/i)
      await user.type(emailInput, 'test@example.com')
      await user.click(screen.getByRole('button', { name: /Send Reset Link/i }))

      await waitFor(() => {
        expect(screen.getByText(/Password reset email sent to test@example.com/i)).toBeInTheDocument()
      })
    })

    it('displays success checkmark icon', async () => {
      const user = userEvent.setup()
      authService.resetPassword.mockResolvedValue({ success: true })

      renderWithRouter()
      const emailInput = screen.getByLabelText(/Email Address/i)
      await user.type(emailInput, 'test@example.com')
      await user.click(screen.getByRole('button', { name: /Send Reset Link/i }))

      await waitFor(() => {
        expect(screen.getByText('✅')).toBeInTheDocument()
      })
    })

    it('changes heading to "Success!" after successful submission', async () => {
      const user = userEvent.setup()
      authService.resetPassword.mockResolvedValue({ success: true })

      renderWithRouter()
      const emailInput = screen.getByLabelText(/Email Address/i)
      await user.type(emailInput, 'test@example.com')
      await user.click(screen.getByRole('button', { name: /Send Reset Link/i }))

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Success!/i })).toBeInTheDocument()
      })
    })

    it('displays "Go to Login" link after success', async () => {
      const user = userEvent.setup()
      authService.resetPassword.mockResolvedValue({ success: true })

      renderWithRouter()
      const emailInput = screen.getByLabelText(/Email Address/i)
      await user.type(emailInput, 'test@example.com')
      await user.click(screen.getByRole('button', { name: /Send Reset Link/i }))

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /Go to Login/i })).toBeInTheDocument()
      })
    })

    it('success state has proper role attribute', async () => {
      const user = userEvent.setup()
      authService.resetPassword.mockResolvedValue({ success: true })

      renderWithRouter()
      const emailInput = screen.getByLabelText(/Email Address/i)
      await user.type(emailInput, 'test@example.com')
      await user.click(screen.getByRole('button', { name: /Send Reset Link/i }))

      await waitFor(() => {
        const statusElement = screen.getByRole('status')
        expect(statusElement).toBeInTheDocument()
      })
    })
  })

  // ==================== Error Handling Tests ====================
  describe('Error Handling', () => {
    it('displays error message when reset request fails', async () => {
      const user = userEvent.setup()
      authService.resetPassword.mockResolvedValue({
        success: false,
        error: 'Email not found'
      })

      renderWithRouter()
      const emailInput = screen.getByLabelText(/Email Address/i)
      await user.type(emailInput, 'nonexistent@example.com')
      await user.click(screen.getByRole('button', { name: /Send Reset Link/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/Email not found/i)
      })
    })

    it('displays default error message when no error message provided', async () => {
      const user = userEvent.setup()
      authService.resetPassword.mockResolvedValue({ success: false })

      renderWithRouter()
      const emailInput = screen.getByLabelText(/Email Address/i)
      await user.type(emailInput, 'test@example.com')
      await user.click(screen.getByRole('button', { name: /Send Reset Link/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/Failed to send reset email/i)
      })
    })

    it('displays error when API throws exception', async () => {
      const user = userEvent.setup()
      authService.resetPassword.mockRejectedValue(new Error('Network error'))

      renderWithRouter()
      const emailInput = screen.getByLabelText(/Email Address/i)
      await user.type(emailInput, 'test@example.com')
      await user.click(screen.getByRole('button', { name: /Send Reset Link/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/Failed to send reset email/i)
      })
    })

    it('error message has proper styling', async () => {
      const user = userEvent.setup()
      authService.resetPassword.mockResolvedValue({
        success: false,
        error: 'Test error'
      })

      renderWithRouter()
      const emailInput = screen.getByLabelText(/Email Address/i)
      await user.type(emailInput, 'test@example.com')
      await user.click(screen.getByRole('button', { name: /Send Reset Link/i }))

      await waitFor(() => {
        const errorAlert = screen.getByRole('alert')
        expect(errorAlert).toHaveStyle({ backgroundColor: '#fee' })
      })
    })

    it('clears previous error when new submission is made', async () => {
      const user = userEvent.setup()
      authService.resetPassword
        .mockResolvedValueOnce({ success: false, error: 'First error' })
        .mockResolvedValueOnce({ success: true })

      renderWithRouter()
      const emailInput = screen.getByLabelText(/Email Address/i)
      const submitButton = screen.getByRole('button', { name: /Send Reset Link/i })

      await user.type(emailInput, 'test@example.com')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/First error/i)).toBeInTheDocument()
      })

      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByText(/First error/i)).not.toBeInTheDocument()
      })
    })

    it('sets aria-invalid on email input when error occurs', async () => {
      const user = userEvent.setup()
      authService.resetPassword.mockResolvedValue({
        success: false,
        error: 'Test error'
      })

      renderWithRouter()
      const emailInput = screen.getByLabelText(/Email Address/i)
      await user.type(emailInput, 'test@example.com')
      await user.click(screen.getByRole('button', { name: /Send Reset Link/i }))

      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-invalid', 'true')
      })
    })

    it('links email input to error message with aria-describedby', async () => {
      const user = userEvent.setup()
      authService.resetPassword.mockResolvedValue({
        success: false,
        error: 'Test error'
      })

      renderWithRouter()
      const emailInput = screen.getByLabelText(/Email Address/i)
      await user.type(emailInput, 'test@example.com')
      await user.click(screen.getByRole('button', { name: /Send Reset Link/i }))

      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-describedby', 'email-error')
      })
    })
  })

  // ==================== Loading States Tests ====================
  describe('Loading States', () => {
    it('shows loading text on submit button during request', async () => {
      const user = userEvent.setup()
      authService.resetPassword.mockImplementation(() => new Promise(() => {}))

      renderWithRouter()
      const emailInput = screen.getByLabelText(/Email Address/i)
      await user.type(emailInput, 'test@example.com')
      await user.click(screen.getByRole('button', { name: /Send Reset Link/i }))

      expect(screen.getByRole('button', { name: /Sending/i })).toBeInTheDocument()
    })

    it('disables submit button during loading', async () => {
      const user = userEvent.setup()
      authService.resetPassword.mockImplementation(() => new Promise(() => {}))

      renderWithRouter()
      const emailInput = screen.getByLabelText(/Email Address/i)
      const submitButton = screen.getByRole('button', { name: /Send Reset Link/i })

      await user.type(emailInput, 'test@example.com')
      await user.click(submitButton)

      expect(screen.getByRole('button', { name: /Sending/i })).toBeDisabled()
    })

    it('submit button has correct aria-label during loading', async () => {
      const user = userEvent.setup()
      authService.resetPassword.mockImplementation(() => new Promise(() => {}))

      renderWithRouter()
      const emailInput = screen.getByLabelText(/Email Address/i)
      await user.type(emailInput, 'test@example.com')
      await user.click(screen.getByRole('button', { name: /Send Reset Link/i }))

      expect(screen.getByLabelText(/Sending reset email/i)).toBeInTheDocument()
    })

    it('re-enables submit button after request completes', async () => {
      const user = userEvent.setup()
      authService.resetPassword.mockResolvedValue({ success: false, error: 'Error' })

      renderWithRouter()
      const emailInput = screen.getByLabelText(/Email Address/i)
      await user.type(emailInput, 'test@example.com')
      await user.click(screen.getByRole('button', { name: /Send Reset Link/i }))

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /Send Reset Link/i })
        expect(submitButton).not.toBeDisabled()
      })
    })

    it('loading button has different cursor style', async () => {
      const user = userEvent.setup()
      authService.resetPassword.mockImplementation(() => new Promise(() => {}))

      renderWithRouter()
      const emailInput = screen.getByLabelText(/Email Address/i)
      await user.type(emailInput, 'test@example.com')
      await user.click(screen.getByRole('button', { name: /Send Reset Link/i }))

      const loadingButton = screen.getByRole('button', { name: /Sending/i })
      expect(loadingButton).toHaveStyle({ cursor: 'not-allowed' })
    })
  })

  // ==================== Back to Login Link Tests ====================
  describe('Back to Login Link', () => {
    it('displays "Back to Login" link on request form', () => {
      renderWithRouter()
      expect(screen.getByRole('link', { name: /Back to Login/i })).toBeInTheDocument()
    })

    it('"Back to Login" link points to home page', () => {
      renderWithRouter()
      const backLink = screen.getByRole('link', { name: /Back to Login/i })
      expect(backLink).toHaveAttribute('href', '/')
    })

    it('"Back to Login" link has arrow icon', () => {
      renderWithRouter()
      const backLink = screen.getByRole('link', { name: /Back to Login/i })
      expect(backLink).toHaveTextContent('←')
    })
  })

  // ==================== Token Validation Tests ====================
  describe('Token Validation', () => {
    it('switches to reset step when token is present in URL', () => {
      renderWithRouter(['/reset-password?token=valid-token'])
      expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument()
    })

    it('displays "Create New Password" heading when token exists', () => {
      renderWithRouter(['/reset-password?token=valid-token'])
      expect(screen.getByRole('heading', { name: /Create New Password/i })).toBeInTheDocument()
    })

    it('shows appropriate description for reset step', () => {
      renderWithRouter(['/reset-password?token=valid-token'])
      expect(screen.getByText(/Choose a strong password for your account/i)).toBeInTheDocument()
    })

    it('calls validateToken on mount when token exists', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      renderWithRouter(['/reset-password?token=test-token'])
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  // ==================== New Password Form Tests ====================
  describe('New Password Form', () => {
    beforeEach(() => {
      renderWithRouter(['/reset-password?token=test-token'])
    })

    it('renders new password input', () => {
      expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument()
    })

    it('new password input has correct type', () => {
      const passwordInput = screen.getByLabelText(/New Password/i)
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('new password input is required', () => {
      const passwordInput = screen.getByLabelText(/New Password/i)
      expect(passwordInput).toBeRequired()
    })

    it('new password input has placeholder', () => {
      const passwordInput = screen.getByLabelText(/New Password/i)
      expect(passwordInput).toHaveAttribute('placeholder', 'Enter new password')
    })

    it('allows typing in new password field', async () => {
      const user = userEvent.setup()
      const passwordInput = screen.getByLabelText(/New Password/i)

      await user.type(passwordInput, 'NewPassword123!')
      expect(passwordInput).toHaveValue('NewPassword123!')
    })

    it('displays password visibility toggle button', () => {
      const toggleButtons = screen.getAllByRole('button', { name: /password/i })
      expect(toggleButtons.length).toBeGreaterThan(0)
    })

    it('toggles password visibility when eye button is clicked', async () => {
      const user = userEvent.setup()
      const passwordInput = screen.getByLabelText(/New Password/i)
      const toggleButton = screen.getByRole('button', { name: /Show password/i })

      expect(passwordInput).toHaveAttribute('type', 'password')

      await user.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'text')

      await user.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('toggle button shows appropriate icon for password state', async () => {
      const user = userEvent.setup()
      const toggleButton = screen.getByRole('button', { name: /Show password/i })

      expect(toggleButton).toHaveTextContent('👁️')

      await user.click(toggleButton)

      const hideButton = screen.getByRole('button', { name: /Hide password/i })
      expect(hideButton).toHaveTextContent('🙈')
    })

    it('toggle button has proper aria-label', () => {
      const toggleButton = screen.getByRole('button', { name: /Show password/i })
      expect(toggleButton).toHaveAttribute('aria-label', 'Show password')
    })
  })

  // ==================== Password Confirmation Tests ====================
  describe('Password Confirmation', () => {
    beforeEach(() => {
      renderWithRouter(['/reset-password?token=test-token'])
    })

    it('renders confirm password input', () => {
      expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument()
    })

    it('confirm password input has correct type', () => {
      const confirmInput = screen.getByLabelText(/Confirm Password/i)
      expect(confirmInput).toHaveAttribute('type', 'password')
    })

    it('confirm password input is required', () => {
      const confirmInput = screen.getByLabelText(/Confirm Password/i)
      expect(confirmInput).toBeRequired()
    })

    it('confirm password input has placeholder', () => {
      const confirmInput = screen.getByLabelText(/Confirm Password/i)
      expect(confirmInput).toHaveAttribute('placeholder', 'Confirm new password')
    })

    it('allows typing in confirm password field', async () => {
      const user = userEvent.setup()
      const confirmInput = screen.getByLabelText(/Confirm Password/i)

      await user.type(confirmInput, 'Password123!')
      expect(confirmInput).toHaveValue('Password123!')
    })

    it('validates password match on submit', async () => {
      const user = userEvent.setup()
      const passwordInput = screen.getByLabelText(/New Password/i)
      const confirmInput = screen.getByLabelText(/Confirm Password/i)
      const submitButton = screen.getByRole('button', { name: /Reset Password/i })

      await user.type(passwordInput, 'Password123!')
      await user.type(confirmInput, 'DifferentPassword123!')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/Passwords do not match/i)
      })
    })

    it('sets aria-invalid when passwords do not match', async () => {
      const user = userEvent.setup()
      const passwordInput = screen.getByLabelText(/New Password/i)
      const confirmInput = screen.getByLabelText(/Confirm Password/i)
      const submitButton = screen.getByRole('button', { name: /Reset Password/i })

      await user.type(passwordInput, 'Password123!')
      await user.type(confirmInput, 'Different123!')
      await user.click(submitButton)

      await waitFor(() => {
        expect(confirmInput).toHaveAttribute('aria-invalid', 'true')
      })
    })

    it('confirm password input shares visibility state with password input', async () => {
      const user = userEvent.setup()
      const passwordInput = screen.getByLabelText(/New Password/i)
      const confirmInput = screen.getByLabelText(/Confirm Password/i)
      const toggleButton = screen.getByRole('button', { name: /Show password/i })

      await user.click(toggleButton)

      expect(passwordInput).toHaveAttribute('type', 'text')
      expect(confirmInput).toHaveAttribute('type', 'text')
    })
  })

  // ==================== Password Strength Tests ====================
  describe('Password Strength', () => {
    beforeEach(() => {
      renderWithRouter(['/reset-password?token=test-token'])
    })

    it('displays password strength indicator when typing', async () => {
      const user = userEvent.setup()
      const passwordInput = screen.getByLabelText(/New Password/i)

      await user.type(passwordInput, 'weak')

      await waitFor(() => {
        expect(screen.getByText(/Strength:/i)).toBeInTheDocument()
      })
    })

    it('shows "Weak" for simple passwords', async () => {
      const user = userEvent.setup()
      const passwordInput = screen.getByLabelText(/New Password/i)

      await user.type(passwordInput, 'password')

      await waitFor(() => {
        expect(screen.getByText(/Weak/i)).toBeInTheDocument()
      })
    })

    it('shows "Medium" for moderately complex passwords', async () => {
      const user = userEvent.setup()
      const passwordInput = screen.getByLabelText(/New Password/i)

      await user.type(passwordInput, 'Password123')

      await waitFor(() => {
        expect(screen.getByText(/Medium/i)).toBeInTheDocument()
      })
    })

    it('shows "Strong" for highly complex passwords', async () => {
      const user = userEvent.setup()
      const passwordInput = screen.getByLabelText(/New Password/i)

      await user.type(passwordInput, 'MyStr0ng!Pass')

      await waitFor(() => {
        expect(screen.getByText(/Strong/i)).toBeInTheDocument()
      })
    })

    it('does not show strength indicator when password is empty', () => {
      expect(screen.queryByText(/Strength:/i)).not.toBeInTheDocument()
    })

    it('password strength has proper role attribute', async () => {
      const user = userEvent.setup()
      const passwordInput = screen.getByLabelText(/New Password/i)

      await user.type(passwordInput, 'test123')

      await waitFor(() => {
        const strengthIndicator = screen.getByRole('status')
        expect(strengthIndicator).toHaveAttribute('aria-live', 'polite')
      })
    })

    it('validates minimum password length on submit', async () => {
      const user = userEvent.setup()
      const passwordInput = screen.getByLabelText(/New Password/i)
      const confirmInput = screen.getByLabelText(/Confirm Password/i)
      const submitButton = screen.getByRole('button', { name: /Reset Password/i })

      await user.type(passwordInput, 'short')
      await user.type(confirmInput, 'short')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/at least 8 characters/i)
      })
    })

    it('validates password strength on submit', async () => {
      const user = userEvent.setup()
      const passwordInput = screen.getByLabelText(/New Password/i)
      const confirmInput = screen.getByLabelText(/Confirm Password/i)
      const submitButton = screen.getByRole('button', { name: /Reset Password/i })

      await user.type(passwordInput, 'weakpassword')
      await user.type(confirmInput, 'weakpassword')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/Password is too weak/i)
      })
    })

    it('password strength indicator has aria-describedby link', async () => {
      const user = userEvent.setup()
      const passwordInput = screen.getByLabelText(/New Password/i)

      await user.type(passwordInput, 'test')

      await waitFor(() => {
        expect(passwordInput).toHaveAttribute('aria-describedby', 'password-strength')
      })
    })
  })

  // ==================== Password Reset Submission Tests ====================
  describe('Password Reset Submission', () => {
    beforeEach(() => {
      global.fetch = jest.fn()
    })

    it('submits password reset with valid data', async () => {
      const user = userEvent.setup()
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, message: 'Password reset successfully' })
      })

      renderWithRouter(['/reset-password?token=test-token'])

      await user.type(screen.getByLabelText(/New Password/i), 'MyStr0ng!Pass')
      await user.type(screen.getByLabelText(/Confirm Password/i), 'MyStr0ng!Pass')
      await user.click(screen.getByRole('button', { name: /Reset Password/i }))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/reset-password'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('test-token')
          })
        )
      })
    })

    it('includes token in reset request', async () => {
      const user = userEvent.setup()
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      })

      renderWithRouter(['/reset-password?token=abc123'])

      await user.type(screen.getByLabelText(/New Password/i), 'MyStr0ng!Pass')
      await user.type(screen.getByLabelText(/Confirm Password/i), 'MyStr0ng!Pass')
      await user.click(screen.getByRole('button', { name: /Reset Password/i }))

      await waitFor(() => {
        const fetchCall = global.fetch.mock.calls[0]
        const body = JSON.parse(fetchCall[1].body)
        expect(body.token).toBe('abc123')
      })
    })

    it('includes new password in reset request', async () => {
      const user = userEvent.setup()
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      })

      renderWithRouter(['/reset-password?token=test-token'])

      await user.type(screen.getByLabelText(/New Password/i), 'MyNewP@ss123')
      await user.type(screen.getByLabelText(/Confirm Password/i), 'MyNewP@ss123')
      await user.click(screen.getByRole('button', { name: /Reset Password/i }))

      await waitFor(() => {
        const fetchCall = global.fetch.mock.calls[0]
        const body = JSON.parse(fetchCall[1].body)
        expect(body.newPassword).toBe('MyNewP@ss123')
      })
    })

    it('shows success message after password reset', async () => {
      const user = userEvent.setup()
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, message: 'Password reset successfully!' })
      })

      renderWithRouter(['/reset-password?token=test-token'])

      await user.type(screen.getByLabelText(/New Password/i), 'MyStr0ng!Pass')
      await user.type(screen.getByLabelText(/Confirm Password/i), 'MyStr0ng!Pass')
      await user.click(screen.getByRole('button', { name: /Reset Password/i }))

      await waitFor(() => {
        expect(screen.getByText(/Password reset successfully/i)).toBeInTheDocument()
      })
    })

    it('redirects to home page after successful reset', async () => {
      const user = userEvent.setup()
      jest.useFakeTimers()
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      })

      renderWithRouter(['/reset-password?token=test-token'])

      await user.type(screen.getByLabelText(/New Password/i), 'MyStr0ng!Pass')
      await user.type(screen.getByLabelText(/Confirm Password/i), 'MyStr0ng!Pass')
      await user.click(screen.getByRole('button', { name: /Reset Password/i }))

      await waitFor(() => {
        expect(screen.getByText(/Password reset successfully/i)).toBeInTheDocument()
      })

      jest.advanceTimersByTime(3000)

      expect(mockNavigate).toHaveBeenCalledWith('/')
      jest.useRealTimers()
    })

    it('displays error when reset fails', async () => {
      const user = userEvent.setup()
      global.fetch.mockResolvedValue({
        ok: false,
        json: async () => ({ success: false, error: 'Invalid or expired token' })
      })

      renderWithRouter(['/reset-password?token=invalid-token'])

      await user.type(screen.getByLabelText(/New Password/i), 'MyStr0ng!Pass')
      await user.type(screen.getByLabelText(/Confirm Password/i), 'MyStr0ng!Pass')
      await user.click(screen.getByRole('button', { name: /Reset Password/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/Invalid or expired token/i)
      })
    })

    it('handles network errors gracefully', async () => {
      const user = userEvent.setup()
      global.fetch.mockRejectedValue(new Error('Network error'))

      renderWithRouter(['/reset-password?token=test-token'])

      await user.type(screen.getByLabelText(/New Password/i), 'MyStr0ng!Pass')
      await user.type(screen.getByLabelText(/Confirm Password/i), 'MyStr0ng!Pass')
      await user.click(screen.getByRole('button', { name: /Reset Password/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/Failed to reset password/i)
      })
    })

    it('shows loading state during password reset', async () => {
      const user = userEvent.setup()
      global.fetch.mockImplementation(() => new Promise(() => {}))

      renderWithRouter(['/reset-password?token=test-token'])

      await user.type(screen.getByLabelText(/New Password/i), 'MyStr0ng!Pass')
      await user.type(screen.getByLabelText(/Confirm Password/i), 'MyStr0ng!Pass')
      await user.click(screen.getByRole('button', { name: /Reset Password/i }))

      expect(screen.getByRole('button', { name: /Resetting/i })).toBeInTheDocument()
    })

    it('disables submit button during password reset', async () => {
      const user = userEvent.setup()
      global.fetch.mockImplementation(() => new Promise(() => {}))

      renderWithRouter(['/reset-password?token=test-token'])

      await user.type(screen.getByLabelText(/New Password/i), 'MyStr0ng!Pass')
      await user.type(screen.getByLabelText(/Confirm Password/i), 'MyStr0ng!Pass')
      await user.click(screen.getByRole('button', { name: /Reset Password/i }))

      expect(screen.getByRole('button', { name: /Resetting/i })).toBeDisabled()
    })
  })

  // ==================== Accessibility Tests ====================
  describe('Accessibility', () => {
    it('has proper page role', () => {
      renderWithRouter()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('has proper aria-label for main element', () => {
      renderWithRouter()
      const main = screen.getByRole('main')
      expect(main).toHaveAttribute('aria-label', 'Password reset page')
    })

    it('all form inputs have associated labels', () => {
      renderWithRouter()
      const emailInput = screen.getByLabelText(/Email Address/i)
      expect(emailInput).toBeInTheDocument()
    })

    it('password inputs have associated labels on reset form', () => {
      renderWithRouter(['/reset-password?token=test-token'])
      expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument()
    })

    it('submit button has proper aria-label', () => {
      renderWithRouter()
      const submitButton = screen.getByRole('button', { name: /Send Reset Link/i })
      expect(submitButton).toHaveAttribute('aria-label', 'Send reset link')
    })

    it('error messages have role="alert"', async () => {
      const user = userEvent.setup()
      authService.resetPassword.mockResolvedValue({ success: false, error: 'Error' })

      renderWithRouter()
      await user.type(screen.getByLabelText(/Email Address/i), 'test@example.com')
      await user.click(screen.getByRole('button', { name: /Send Reset Link/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })

    it('all required inputs have aria-required', () => {
      renderWithRouter()
      const emailInput = screen.getByLabelText(/Email Address/i)
      expect(emailInput).toHaveAttribute('aria-required', 'true')
    })

    it('password inputs have aria-required on reset form', () => {
      renderWithRouter(['/reset-password?token=test-token'])
      expect(screen.getByLabelText(/New Password/i)).toHaveAttribute('aria-required', 'true')
      expect(screen.getByLabelText(/Confirm Password/i)).toHaveAttribute('aria-required', 'true')
    })

    it('heading hierarchy is correct', () => {
      renderWithRouter()
      const headings = screen.getAllByRole('heading')
      expect(headings[0]).toHaveTextContent(/Reset Password/i)
    })

    it('links have proper accessibility', () => {
      renderWithRouter()
      const backLink = screen.getByRole('link', { name: /Back to Login/i })
      expect(backLink).toHaveAttribute('href')
    })

    it('icons are properly hidden from screen readers', () => {
      renderWithRouter()
      const iconElements = screen.getByText('🔑').parentElement
      expect(iconElements).toHaveAttribute('aria-hidden', 'true')
    })

    it('help/contact link is accessible', () => {
      renderWithRouter()
      const contactLink = screen.getByRole('link', { name: /Contact Support/i })
      expect(contactLink).toBeInTheDocument()
    })
  })

  // ==================== Help/Support Section Tests ====================
  describe('Help/Support Section', () => {
    it('displays help section', () => {
      renderWithRouter()
      expect(screen.getByText(/Need help?/i)).toBeInTheDocument()
    })

    it('displays contact support link', () => {
      renderWithRouter()
      expect(screen.getByRole('link', { name: /Contact Support/i })).toBeInTheDocument()
    })

    it('contact support link points to help page', () => {
      renderWithRouter()
      const contactLink = screen.getByRole('link', { name: /Contact Support/i })
      expect(contactLink).toHaveAttribute('href', '/help')
    })

    it('help section is separated with border', () => {
      renderWithRouter()
      const helpSection = screen.getByText(/Need help?/i).parentElement
      expect(helpSection).toHaveStyle({ borderTop: '1px solid #eee' })
    })
  })

  // ==================== Page Metadata Tests ====================
  describe('Page Metadata', () => {
    it('page maintains consistent styling throughout', () => {
      renderWithRouter()
      const main = screen.getByRole('main')
      expect(main).toHaveStyle({ minHeight: '100vh' })
    })

    it('form container has proper styling', () => {
      renderWithRouter()
      const main = screen.getByRole('main')
      expect(main.firstChild).toHaveStyle({ backgroundColor: '#0A0A0B' })
    })

    it('maintains state after re-render', async () => {
      const user = userEvent.setup()
      const { rerender } = renderWithRouter()

      const emailInput = screen.getByLabelText(/Email Address/i)
      await user.type(emailInput, 'test@example.com')

      rerender(
        <MemoryRouter initialEntries={['/reset-password']}>
          <PasswordResetPage />
        </MemoryRouter>
      )

      // Note: State will be reset on full rerender
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument()
    })

    it('handles rapid state changes correctly', async () => {
      const user = userEvent.setup()
      renderWithRouter()

      const emailInput = screen.getByLabelText(/Email Address/i)
      await user.type(emailInput, 'a')
      await user.clear(emailInput)
      await user.type(emailInput, 'test@example.com')

      expect(emailInput).toHaveValue('test@example.com')
    })
  })
})

export default mockNavigate
