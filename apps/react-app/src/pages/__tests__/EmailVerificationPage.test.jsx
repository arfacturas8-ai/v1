import { render, screen, waitFor, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import EmailVerificationPage from '../EmailVerificationPage'
import authService from '../../services/authService'

const mockNavigate = jest.fn()
const mockSearchParams = new URLSearchParams()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams],
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>
}))

jest.mock('../../services/authService')

const renderPage = () => {
  return render(
    <BrowserRouter>
      <EmailVerificationPage />
    </BrowserRouter>
  )
}

describe('EmailVerificationPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSearchParams.delete('token')
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Initial Rendering', () => {
    it('renders without crashing', () => {
      mockSearchParams.set('token', 'valid_token')
      renderPage()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('has proper accessibility attributes', () => {
      mockSearchParams.set('token', 'valid_token')
      renderPage()
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Email verification page')
    })

    it('displays verifying state initially', () => {
      mockSearchParams.set('token', 'valid_token')
      authService.verifyEmail.mockImplementation(() => new Promise(() => {}))
      renderPage()
      expect(screen.getByText('Verifying Email')).toBeInTheDocument()
    })

    it('shows verifying message', () => {
      mockSearchParams.set('token', 'valid_token')
      authService.verifyEmail.mockImplementation(() => new Promise(() => {}))
      renderPage()
      expect(screen.getByText('Verifying your email address...')).toBeInTheDocument()
    })

    it('displays spinner during verification', () => {
      mockSearchParams.set('token', 'valid_token')
      authService.verifyEmail.mockImplementation(() => new Promise(() => {}))
      renderPage()
      expect(screen.getByRole('status', { name: 'Verifying email' })).toBeInTheDocument()
    })

    it('shows helpful text during verification', () => {
      mockSearchParams.set('token', 'valid_token')
      authService.verifyEmail.mockImplementation(() => new Promise(() => {}))
      renderPage()
      expect(screen.getByText('This may take a few seconds...')).toBeInTheDocument()
    })
  })

  describe('Missing Token Handling', () => {
    it('displays error when no token is provided', () => {
      mockSearchParams.delete('token')
      renderPage()
      expect(screen.getByText('Verification Failed')).toBeInTheDocument()
    })

    it('shows specific error message for missing token', () => {
      mockSearchParams.delete('token')
      renderPage()
      expect(screen.getByText('Invalid verification link. No token provided.')).toBeInTheDocument()
    })

    it('does not call verifyEmail when token is missing', () => {
      mockSearchParams.delete('token')
      renderPage()
      expect(authService.verifyEmail).not.toHaveBeenCalled()
    })

    it('shows error icon when token is missing', () => {
      mockSearchParams.delete('token')
      renderPage()
      expect(screen.getByText('❌')).toBeInTheDocument()
    })

    it('displays resend button when token is missing', () => {
      mockSearchParams.delete('token')
      renderPage()
      expect(screen.getByRole('button', { name: /Resend verification email/i })).toBeInTheDocument()
    })

    it('displays back to home link when token is missing', () => {
      mockSearchParams.delete('token')
      renderPage()
      expect(screen.getByRole('link', { name: /Back to home page/i })).toBeInTheDocument()
    })
  })

  describe('Successful Verification', () => {
    beforeEach(() => {
      mockSearchParams.set('token', 'valid_token')
      authService.verifyEmail.mockResolvedValue({
        success: true,
        message: 'Email verified successfully!'
      })
    })

    it('calls verifyEmail with correct token', async () => {
      renderPage()

      await waitFor(() => {
        expect(authService.verifyEmail).toHaveBeenCalledWith('valid_token')
      })
    })

    it('displays success message', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Email Verified!')).toBeInTheDocument()
        expect(screen.getByText('Email verified successfully!')).toBeInTheDocument()
      })
    })

    it('shows success icon', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('✅')).toBeInTheDocument()
      })
    })

    it('displays go to home button', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /Go to home page/i })).toBeInTheDocument()
      })
    })

    it('shows auto-redirect message', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Redirecting automatically in 3 seconds...')).toBeInTheDocument()
      })
    })

    it('navigates to home after 3 seconds', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Email Verified!')).toBeInTheDocument()
      })

      act(() => {
        jest.advanceTimersByTime(3000)
      })

      expect(mockNavigate).toHaveBeenCalledWith('/home')
    })

    it('handles custom success message from API', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: true,
        message: 'Welcome! Your email has been confirmed.'
      })

      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Welcome! Your email has been confirmed.')).toBeInTheDocument()
      })
    })

    it('does not navigate before timeout', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Email Verified!')).toBeInTheDocument()
      })

      act(() => {
        jest.advanceTimersByTime(2999)
      })

      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  describe('Expired Token Handling', () => {
    beforeEach(() => {
      mockSearchParams.set('token', 'expired_token')
      authService.verifyEmail.mockResolvedValue({
        success: false,
        error: 'This verification link has expired or is invalid.'
      })
    })

    it('displays expired status', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Link Expired')).toBeInTheDocument()
      })
    })

    it('shows expired message', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('This verification link has expired or is invalid.')).toBeInTheDocument()
      })
    })

    it('displays clock icon for expired state', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('⏰')).toBeInTheDocument()
      })
    })

    it('shows resend verification button', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Resend verification email/i })).toBeInTheDocument()
      })
    })

    it('does not auto-redirect on expired token', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Link Expired')).toBeInTheDocument()
      })

      act(() => {
        jest.advanceTimersByTime(5000)
      })

      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      mockSearchParams.set('token', 'test_token')
    })

    it('handles verification errors', async () => {
      authService.verifyEmail.mockRejectedValue(new Error('Network error'))

      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Verification Failed')).toBeInTheDocument()
        expect(screen.getByText('An error occurred while verifying your email. Please try again.')).toBeInTheDocument()
      })
    })

    it('logs errors to console', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      authService.verifyEmail.mockRejectedValue(new Error('Test error'))

      renderPage()

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Email verification error:',
          expect.any(Error)
        )
      })

      consoleErrorSpy.mockRestore()
    })

    it('shows error icon on failure', async () => {
      authService.verifyEmail.mockRejectedValue(new Error('Network error'))

      renderPage()

      await waitFor(() => {
        expect(screen.getByText('❌')).toBeInTheDocument()
      })
    })

    it('displays resend button on error', async () => {
      authService.verifyEmail.mockRejectedValue(new Error('Network error'))

      renderPage()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Resend verification email/i })).toBeInTheDocument()
      })
    })

    it('has alert role for error messages', async () => {
      authService.verifyEmail.mockRejectedValue(new Error('Network error'))

      renderPage()

      await waitFor(() => {
        const message = screen.getByText('An error occurred while verifying your email. Please try again.')
        expect(message).toHaveAttribute('role', 'alert')
      })
    })

    it('has live region for status updates', async () => {
      authService.verifyEmail.mockRejectedValue(new Error('Network error'))

      renderPage()

      await waitFor(() => {
        const message = screen.getByText('An error occurred while verifying your email. Please try again.')
        expect(message).toHaveAttribute('aria-live', 'polite')
      })
    })
  })

  describe('Resend Verification', () => {
    beforeEach(() => {
      mockSearchParams.delete('token')
    })

    it('calls resendVerification when button is clicked', async () => {
      const user = userEvent.setup({ delay: null })
      authService.resendVerification.mockResolvedValue({
        success: true,
        message: 'Verification email sent!'
      })

      renderPage()

      const button = screen.getByRole('button', { name: /Resend verification email/i })
      await user.click(button)

      expect(authService.resendVerification).toHaveBeenCalled()
    })

    it('shows verifying state during resend', async () => {
      const user = userEvent.setup({ delay: null })
      authService.resendVerification.mockImplementation(() => new Promise(() => {}))

      renderPage()

      const button = screen.getByRole('button', { name: /Resend verification email/i })
      await user.click(button)

      expect(screen.getByText('Sending new verification email...')).toBeInTheDocument()
    })

    it('displays success message after resend', async () => {
      const user = userEvent.setup({ delay: null })
      authService.resendVerification.mockResolvedValue({
        success: true,
        message: 'A new verification email has been sent! Check your inbox.'
      })

      renderPage()

      const button = screen.getByRole('button', { name: /Resend verification email/i })
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('A new verification email has been sent! Check your inbox.')).toBeInTheDocument()
      })
    })

    it('handles custom success message from resend', async () => {
      const user = userEvent.setup({ delay: null })
      authService.resendVerification.mockResolvedValue({
        success: true,
        message: 'Email sent to your inbox!'
      })

      renderPage()

      const button = screen.getByRole('button', { name: /Resend verification email/i })
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Email sent to your inbox!')).toBeInTheDocument()
      })
    })

    it('handles resend failure', async () => {
      const user = userEvent.setup({ delay: null })
      authService.resendVerification.mockResolvedValue({
        success: false,
        error: 'Failed to resend verification email. Please try again later.'
      })

      renderPage()

      const button = screen.getByRole('button', { name: /Resend verification email/i })
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Failed to resend verification email. Please try again later.')).toBeInTheDocument()
      })
    })

    it('handles resend error exception', async () => {
      const user = userEvent.setup({ delay: null })
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      authService.resendVerification.mockRejectedValue(new Error('Network error'))

      renderPage()

      const button = screen.getByRole('button', { name: /Resend verification email/i })
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Failed to resend verification email. Please try again later.')).toBeInTheDocument()
        expect(consoleErrorSpy).toHaveBeenCalledWith('Resend verification error:', expect.any(Error))
      })

      consoleErrorSpy.mockRestore()
    })

    it('can resend from expired state', async () => {
      const user = userEvent.setup({ delay: null })
      mockSearchParams.set('token', 'expired_token')
      authService.verifyEmail.mockResolvedValue({
        success: false,
        error: 'Link expired'
      })
      authService.resendVerification.mockResolvedValue({
        success: true,
        message: 'New email sent!'
      })

      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Link Expired')).toBeInTheDocument()
      })

      const button = screen.getByRole('button', { name: /Resend verification email/i })
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('New email sent!')).toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    it('go to home link has correct href', async () => {
      mockSearchParams.set('token', 'valid_token')
      authService.verifyEmail.mockResolvedValue({
        success: true,
        message: 'Success'
      })

      renderPage()

      await waitFor(() => {
        const link = screen.getByRole('link', { name: /Go to home page/i })
        expect(link).toHaveAttribute('href', '/home')
      })
    })

    it('back to home link has correct href', async () => {
      mockSearchParams.delete('token')
      renderPage()

      const link = screen.getByRole('link', { name: /Back to home page/i })
      expect(link).toHaveAttribute('href', '/')
    })

    it('contact support link is present', () => {
      renderPage()
      expect(screen.getByRole('link', { name: /Contact Support/i })).toBeInTheDocument()
    })

    it('contact support link has correct href', () => {
      renderPage()
      const link = screen.getByRole('link', { name: /Contact Support/i })
      expect(link).toHaveAttribute('href', '/help')
    })
  })

  describe('UI Styling', () => {
    it('applies correct container styling', () => {
      mockSearchParams.set('token', 'test')
      renderPage()
      const main = screen.getByRole('main')
      expect(main).toHaveStyle({
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      })
    })

    it('applies gradient background', () => {
      mockSearchParams.set('token', 'test')
      renderPage()
      const main = screen.getByRole('main')
      expect(main).toHaveStyle({
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      })
    })

    it('has proper card styling', () => {
      mockSearchParams.set('token', 'test')
      renderPage()
      const main = screen.getByRole('main')
      const card = main.querySelector('div > div')
      expect(card).toHaveStyle({
        backgroundColor: '#0A0A0B',
        borderRadius: '16px',
        padding: '48px'
      })
    })
  })

  describe('Icon Rendering', () => {
    it('shows spinner icon when verifying', () => {
      mockSearchParams.set('token', 'test')
      authService.verifyEmail.mockImplementation(() => new Promise(() => {}))
      renderPage()
      expect(screen.getByRole('status', { name: 'Verifying email' })).toBeInTheDocument()
    })

    it('shows checkmark for success', async () => {
      mockSearchParams.set('token', 'test')
      authService.verifyEmail.mockResolvedValue({ success: true, message: 'Success' })
      renderPage()
      await waitFor(() => {
        expect(screen.getByText('✅')).toBeInTheDocument()
      })
    })

    it('shows X mark for error', async () => {
      mockSearchParams.set('token', 'test')
      authService.verifyEmail.mockRejectedValue(new Error('Error'))
      renderPage()
      await waitFor(() => {
        expect(screen.getByText('❌')).toBeInTheDocument()
      })
    })

    it('shows clock for expired', async () => {
      mockSearchParams.set('token', 'test')
      authService.verifyEmail.mockResolvedValue({ success: false, error: 'Expired' })
      renderPage()
      await waitFor(() => {
        expect(screen.getByText('⏰')).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles empty token string', () => {
      mockSearchParams.set('token', '')
      renderPage()
      expect(screen.getByText('Invalid verification link. No token provided.')).toBeInTheDocument()
    })

    it('handles very long token', async () => {
      const longToken = 'a'.repeat(500)
      mockSearchParams.set('token', longToken)
      authService.verifyEmail.mockResolvedValue({ success: true, message: 'Success' })

      renderPage()

      await waitFor(() => {
        expect(authService.verifyEmail).toHaveBeenCalledWith(longToken)
      })
    })

    it('handles special characters in token', async () => {
      const specialToken = 'token-with-special_chars.123'
      mockSearchParams.set('token', specialToken)
      authService.verifyEmail.mockResolvedValue({ success: true, message: 'Success' })

      renderPage()

      await waitFor(() => {
        expect(authService.verifyEmail).toHaveBeenCalledWith(specialToken)
      })
    })

    it('handles multiple clicks on resend button', async () => {
      const user = userEvent.setup({ delay: null })
      mockSearchParams.delete('token')
      authService.resendVerification.mockResolvedValue({
        success: true,
        message: 'Sent'
      })

      renderPage()

      const button = screen.getByRole('button', { name: /Resend verification email/i })
      await user.click(button)
      await user.click(button)

      await waitFor(() => {
        expect(authService.resendVerification).toHaveBeenCalledTimes(2)
      })
    })

    it('handles rapid token changes', async () => {
      mockSearchParams.set('token', 'token1')
      authService.verifyEmail.mockResolvedValue({ success: true, message: 'Success' })

      const { unmount } = renderPage()

      await waitFor(() => {
        expect(screen.getByText('Email Verified!')).toBeInTheDocument()
      })

      unmount()

      mockSearchParams.set('token', 'token2')
      renderPage()

      await waitFor(() => {
        expect(authService.verifyEmail).toHaveBeenCalledWith('token2')
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper button accessibility labels', () => {
      mockSearchParams.delete('token')
      renderPage()
      expect(screen.getByRole('button', { name: /Resend verification email/i })).toHaveAttribute('aria-label', 'Resend verification email')
    })

    it('has proper link accessibility labels', async () => {
      mockSearchParams.set('token', 'test')
      authService.verifyEmail.mockResolvedValue({ success: true, message: 'Success' })
      renderPage()

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /Go to home page/i })).toHaveAttribute('aria-label', 'Go to home page')
      })
    })

    it('error messages have alert role', async () => {
      mockSearchParams.set('token', 'test')
      authService.verifyEmail.mockRejectedValue(new Error('Error'))
      renderPage()

      await waitFor(() => {
        const message = screen.getByText('An error occurred while verifying your email. Please try again.')
        expect(message).toHaveAttribute('role', 'alert')
      })
    })

    it('success message has status role', async () => {
      mockSearchParams.set('token', 'test')
      authService.verifyEmail.mockResolvedValue({ success: true, message: 'Success' })
      renderPage()

      await waitFor(() => {
        const message = screen.getByText('Success')
        expect(message).toHaveAttribute('role', 'status')
      })
    })

    it('spinner has status role', () => {
      mockSearchParams.set('token', 'test')
      authService.verifyEmail.mockImplementation(() => new Promise(() => {}))
      renderPage()
      expect(screen.getByRole('status', { name: 'Verifying email' })).toBeInTheDocument()
    })
  })

  describe('CSS Animations', () => {
    it('includes spin animation styles', () => {
      mockSearchParams.set('token', 'test')
      renderPage()
      const style = screen.getByRole('main').querySelector('style')
      expect(style?.textContent).toContain('@keyframes spin')
    })

    it('spinner has animation style', () => {
      mockSearchParams.set('token', 'test')
      authService.verifyEmail.mockImplementation(() => new Promise(() => {}))
      renderPage()
      const spinner = screen.getByRole('status', { name: 'Verifying email' })
      expect(spinner).toHaveStyle({ animation: 'spin 1s linear infinite' })
    })
  })

  describe('Button Interactions', () => {
    it('resend button is clickable', async () => {
      const user = userEvent.setup({ delay: null })
      mockSearchParams.delete('token')
      authService.resendVerification.mockResolvedValue({ success: true, message: 'Sent' })

      renderPage()

      const button = screen.getByRole('button', { name: /Resend verification email/i })
      await user.click(button)

      expect(authService.resendVerification).toHaveBeenCalled()
    })

    it('button has proper styling', () => {
      mockSearchParams.delete('token')
      renderPage()
      const button = screen.getByRole('button', { name: /Resend verification email/i })
      expect(button).toHaveStyle({
        cursor: 'pointer',
        border: 'none'
      })
    })
  })

  describe('Multiple State Transitions', () => {
    it('transitions from verifying to success', async () => {
      mockSearchParams.set('token', 'test')
      authService.verifyEmail.mockResolvedValue({ success: true, message: 'Success' })

      renderPage()

      expect(screen.getByText('Verifying Email')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByText('Email Verified!')).toBeInTheDocument()
      })
    })

    it('transitions from error to verifying on resend', async () => {
      const user = userEvent.setup({ delay: null })
      mockSearchParams.delete('token')
      authService.resendVerification.mockResolvedValue({ success: true, message: 'Sent' })

      renderPage()

      expect(screen.getByText('Verification Failed')).toBeInTheDocument()

      const button = screen.getByRole('button', { name: /Resend verification email/i })
      await user.click(button)

      expect(screen.getByText('Verifying Email')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByText('Email Verified!')).toBeInTheDocument()
      })
    })
  })
})

export default mockNavigate
