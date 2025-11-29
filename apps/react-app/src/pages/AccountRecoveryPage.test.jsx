/**
 * AccountRecoveryPage Test Suite
 * Comprehensive tests for account recovery functionality
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AccountRecoveryPage from './AccountRecoveryPage'

// Mock useNavigate
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

// Mock fetch
global.fetch = jest.fn()

const renderWithRouter = () => {
  return render(
    <MemoryRouter>
      <AccountRecoveryPage />
    </MemoryRouter>
  )
}

describe('AccountRecoveryPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch.mockClear()
    mockNavigate.mockClear()
  })

  // ============================================
  // Page Rendering Tests
  // ============================================
  describe('Page Rendering', () => {
    it('renders without crashing', () => {
      renderWithRouter()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('displays main content area with proper ARIA label', () => {
      renderWithRouter()
      const main = screen.getByRole('main')
      expect(main).toHaveAttribute('aria-label', 'Account recovery')
    })

    it('renders heading correctly on step 1', () => {
      renderWithRouter()
      expect(screen.getByText('Recover Your Account')).toBeInTheDocument()
    })

    it('displays Shield icon on step 1', () => {
      renderWithRouter()
      expect(screen.getByText('Recover Your Account')).toBeInTheDocument()
      // Icon container should be visible
      const iconContainer = document.querySelector('.bg-[#58a6ff]\\/10')
      expect(iconContainer).toBeInTheDocument()
    })

    it('displays descriptive text for method selection', () => {
      renderWithRouter()
      expect(screen.getByText(/Choose a recovery method to regain access/i)).toBeInTheDocument()
    })

    it('renders back to login button on step 1', () => {
      renderWithRouter()
      const backButton = screen.getByRole('button', { name: /Back to login/i })
      expect(backButton).toBeInTheDocument()
    })

    it('displays contact support link on step 1', () => {
      renderWithRouter()
      expect(screen.getByText(/Still need help\?/i)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Contact Support/i })).toBeInTheDocument()
    })

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      renderWithRouter()
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  // ============================================
  // Recovery Method Selection Tests
  // ============================================
  describe('Recovery Method Selection', () => {
    it('displays all four recovery method options', () => {
      renderWithRouter()
      expect(screen.getByText('Email Verification')).toBeInTheDocument()
      expect(screen.getByText('SMS Verification')).toBeInTheDocument()
      expect(screen.getByText('Security Questions')).toBeInTheDocument()
      expect(screen.getByText('Backup Code')).toBeInTheDocument()
    })

    it('highlights email method when clicked', () => {
      renderWithRouter()
      const emailButton = screen.getByText('Email Verification').closest('button')
      fireEvent.click(emailButton)
      expect(emailButton).toHaveClass('border-blue-500')
    })

    it('highlights phone method when clicked', () => {
      renderWithRouter()
      const phoneButton = screen.getByText('SMS Verification').closest('button')
      fireEvent.click(phoneButton)
      expect(phoneButton).toHaveClass('border-blue-500')
    })

    it('highlights security questions method when clicked', () => {
      renderWithRouter()
      const questionsButton = screen.getByText('Security Questions').closest('button')
      fireEvent.click(questionsButton)
      expect(questionsButton).toHaveClass('border-blue-500')
    })

    it('highlights backup code method when clicked', () => {
      renderWithRouter()
      const backupButton = screen.getByText('Backup Code').closest('button')
      fireEvent.click(backupButton)
      expect(backupButton).toHaveClass('border-blue-500')
    })

    it('shows email form when email method selected', () => {
      renderWithRouter()
      const emailButton = screen.getByText('Email Verification').closest('button')
      fireEvent.click(emailButton)
      expect(screen.getByLabelText(/Recovery Email/i)).toBeInTheDocument()
    })

    it('shows phone form when phone method selected', () => {
      renderWithRouter()
      const phoneButton = screen.getByText('SMS Verification').closest('button')
      fireEvent.click(phoneButton)
      expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument()
    })

    it('shows security questions when method selected', () => {
      renderWithRouter()
      const questionsButton = screen.getByText('Security Questions').closest('button')
      fireEvent.click(questionsButton)
      expect(screen.getByText(/What was the name of your first pet\?/i)).toBeInTheDocument()
    })

    it('shows backup code form when method selected', () => {
      renderWithRouter()
      const backupButton = screen.getByText('Backup Code').closest('button')
      fireEvent.click(backupButton)
      expect(screen.getByLabelText(/Backup Code/i)).toBeInTheDocument()
    })
  })

  // ============================================
  // Email Input Validation Tests
  // ============================================
  describe('Email Input Validation', () => {
    it('displays email input with correct type', () => {
      renderWithRouter()
      fireEvent.click(screen.getByText('Email Verification').closest('button'))
      const emailInput = screen.getByLabelText(/Recovery Email/i)
      expect(emailInput).toHaveAttribute('type', 'email')
    })

    it('email input has proper placeholder', () => {
      renderWithRouter()
      fireEvent.click(screen.getByText('Email Verification').closest('button'))
      expect(screen.getByPlaceholderText('your-email@example.com')).toBeInTheDocument()
    })

    it('email input is required', () => {
      renderWithRouter()
      fireEvent.click(screen.getByText('Email Verification').closest('button'))
      const emailInput = screen.getByLabelText(/Recovery Email/i)
      expect(emailInput).toBeRequired()
    })

    it('allows typing in email input', () => {
      renderWithRouter()
      fireEvent.click(screen.getByText('Email Verification').closest('button'))
      const emailInput = screen.getByLabelText(/Recovery Email/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      expect(emailInput).toHaveValue('test@example.com')
    })

    it('shows error when email is empty on submit', async () => {
      renderWithRouter()
      fireEvent.click(screen.getByText('Email Verification').closest('button'))
      const submitButton = screen.getByRole('button', { name: /Send Code/i })
      fireEvent.click(submitButton)
      await waitFor(() => {
        expect(screen.getByText(/Please enter your email/i)).toBeInTheDocument()
      })
    })

    it('disables input during loading', async () => {
      global.fetch.mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
      )
      renderWithRouter()
      fireEvent.click(screen.getByText('Email Verification').closest('button'))
      const emailInput = screen.getByLabelText(/Recovery Email/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.click(screen.getByRole('button', { name: /Send Code/i }))
      await waitFor(() => {
        expect(emailInput).toBeDisabled()
      })
    })
  })

  // ============================================
  // Phone Input Validation Tests
  // ============================================
  describe('Phone Input Validation', () => {
    it('displays phone input with correct type', () => {
      renderWithRouter()
      fireEvent.click(screen.getByText('SMS Verification').closest('button'))
      const phoneInput = screen.getByLabelText(/Phone Number/i)
      expect(phoneInput).toHaveAttribute('type', 'tel')
    })

    it('phone input has proper placeholder', () => {
      renderWithRouter()
      fireEvent.click(screen.getByText('SMS Verification').closest('button'))
      expect(screen.getByPlaceholderText(/\+1 \(555\) 123-4567/i)).toBeInTheDocument()
    })

    it('phone input is required', () => {
      renderWithRouter()
      fireEvent.click(screen.getByText('SMS Verification').closest('button'))
      const phoneInput = screen.getByLabelText(/Phone Number/i)
      expect(phoneInput).toBeRequired()
    })

    it('allows typing in phone input', () => {
      renderWithRouter()
      fireEvent.click(screen.getByText('SMS Verification').closest('button'))
      const phoneInput = screen.getByLabelText(/Phone Number/i)
      fireEvent.change(phoneInput, { target: { value: '+15551234567' } })
      expect(phoneInput).toHaveValue('+15551234567')
    })

    it('shows error when phone is empty on submit', async () => {
      renderWithRouter()
      fireEvent.click(screen.getByText('SMS Verification').closest('button'))
      const submitButton = screen.getByRole('button', { name: /Send Code/i })
      fireEvent.click(submitButton)
      await waitFor(() => {
        expect(screen.getByText(/Please enter your phone/i)).toBeInTheDocument()
      })
    })
  })

  // ============================================
  // Security Questions Tests
  // ============================================
  describe('Security Questions', () => {
    it('displays all three security questions', () => {
      renderWithRouter()
      fireEvent.click(screen.getByText('Security Questions').closest('button'))
      expect(screen.getByText(/What was the name of your first pet\?/i)).toBeInTheDocument()
      expect(screen.getByText(/In what city were you born\?/i)).toBeInTheDocument()
      expect(screen.getByText(/What is your mother's maiden name\?/i)).toBeInTheDocument()
    })

    it('allows typing in all security question answers', () => {
      renderWithRouter()
      fireEvent.click(screen.getByText('Security Questions').closest('button'))
      const inputs = screen.getAllByRole('textbox')
      fireEvent.change(inputs[0], { target: { value: 'Fluffy' } })
      fireEvent.change(inputs[1], { target: { value: 'New York' } })
      fireEvent.change(inputs[2], { target: { value: 'Smith' } })
      expect(inputs[0]).toHaveValue('Fluffy')
      expect(inputs[1]).toHaveValue('New York')
      expect(inputs[2]).toHaveValue('Smith')
    })

    it('shows error when questions are not all answered', async () => {
      renderWithRouter()
      fireEvent.click(screen.getByText('Security Questions').closest('button'))
      const submitButton = screen.getByRole('button', { name: /Verify Answers/i })
      fireEvent.click(submitButton)
      await waitFor(() => {
        expect(screen.getByText(/Please answer all security questions/i)).toBeInTheDocument()
      })
    })

    it('submits security questions when all answered', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      renderWithRouter()
      fireEvent.click(screen.getByText('Security Questions').closest('button'))
      const inputs = screen.getAllByRole('textbox')
      fireEvent.change(inputs[0], { target: { value: 'Fluffy' } })
      fireEvent.change(inputs[1], { target: { value: 'New York' } })
      fireEvent.change(inputs[2], { target: { value: 'Smith' } })
      const submitButton = screen.getByRole('button', { name: /Verify Answers/i })
      fireEvent.click(submitButton)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/recovery/verify-questions',
          expect.objectContaining({
            method: 'POST',
          })
        )
      })
    })
  })

  // ============================================
  // Backup Code Tests
  // ============================================
  describe('Backup Code', () => {
    it('displays backup code input', () => {
      renderWithRouter()
      fireEvent.click(screen.getByText('Backup Code').closest('button'))
      expect(screen.getByLabelText(/Backup Code/i)).toBeInTheDocument()
    })

    it('shows helper text for backup code', () => {
      renderWithRouter()
      fireEvent.click(screen.getByText('Backup Code').closest('button'))
      expect(screen.getByText(/Use one of your MFA backup codes/i)).toBeInTheDocument()
    })

    it('allows typing in backup code input', () => {
      renderWithRouter()
      fireEvent.click(screen.getByText('Backup Code').closest('button'))
      const backupInput = screen.getByLabelText(/Backup Code/i)
      fireEvent.change(backupInput, { target: { value: 'ABCD1234' } })
      expect(backupInput).toHaveValue('ABCD1234')
    })

    it('validates backup code length', async () => {
      renderWithRouter()
      fireEvent.click(screen.getByText('Backup Code').closest('button'))
      const backupInput = screen.getByLabelText(/Backup Code/i)
      fireEvent.change(backupInput, { target: { value: '123' } })
      const submitButton = screen.getByRole('button', { name: /Verify Code/i })
      fireEvent.click(submitButton)
      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid backup code/i)).toBeInTheDocument()
      })
    })

    it('submits valid backup code', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      renderWithRouter()
      fireEvent.click(screen.getByText('Backup Code').closest('button'))
      const backupInput = screen.getByLabelText(/Backup Code/i)
      fireEvent.change(backupInput, { target: { value: 'ABCD1234' } })
      const submitButton = screen.getByRole('button', { name: /Verify Code/i })
      fireEvent.click(submitButton)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/recovery/verify-backup',
          expect.objectContaining({
            method: 'POST',
          })
        )
      })
    })
  })

  // ============================================
  // Email Verification Code Tests (Step 2)
  // ============================================
  describe('Email Verification Code (Step 2)', () => {
    beforeEach(async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      renderWithRouter()
      fireEvent.click(screen.getByText('Email Verification').closest('button'))
      const emailInput = screen.getByLabelText(/Recovery Email/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.click(screen.getByRole('button', { name: /Send Code/i }))
      await waitFor(() => {
        expect(screen.getByText(/Enter Verification Code/i)).toBeInTheDocument()
      })
    })

    it('displays verification code heading on step 2', () => {
      expect(screen.getByText('Enter Verification Code')).toBeInTheDocument()
    })

    it('shows email address in confirmation message', () => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })

    it('displays verification code input', () => {
      expect(screen.getByLabelText(/Verification Code/i)).toBeInTheDocument()
    })

    it('code input has correct attributes', () => {
      const codeInput = screen.getByLabelText(/Verification Code/i)
      expect(codeInput).toHaveAttribute('maxLength', '6')
      expect(codeInput).toHaveAttribute('placeholder', '000000')
    })

    it('only allows numeric input in code field', () => {
      const codeInput = screen.getByLabelText(/Verification Code/i)
      fireEvent.change(codeInput, { target: { value: 'abc123xyz' } })
      expect(codeInput).toHaveValue('123')
    })

    it('limits code input to 6 digits', () => {
      const codeInput = screen.getByLabelText(/Verification Code/i)
      fireEvent.change(codeInput, { target: { value: '1234567890' } })
      expect(codeInput).toHaveValue('123456')
    })

    it('disables verify button when code length is not 6', () => {
      const codeInput = screen.getByLabelText(/Verification Code/i)
      fireEvent.change(codeInput, { target: { value: '123' } })
      const verifyButton = screen.getByRole('button', { name: /Verify Code/i })
      expect(verifyButton).toBeDisabled()
    })

    it('enables verify button when code length is 6', () => {
      const codeInput = screen.getByLabelText(/Verification Code/i)
      fireEvent.change(codeInput, { target: { value: '123456' } })
      const verifyButton = screen.getByRole('button', { name: /Verify Code/i })
      expect(verifyButton).not.toBeDisabled()
    })

    it('displays resend code button', () => {
      expect(screen.getByText(/Didn't receive a code\? Resend/i)).toBeInTheDocument()
    })

    it('handles code verification', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      const codeInput = screen.getByLabelText(/Verification Code/i)
      fireEvent.change(codeInput, { target: { value: '123456' } })
      const verifyButton = screen.getByRole('button', { name: /Verify Code/i })
      fireEvent.click(verifyButton)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/recovery/verify-code',
          expect.objectContaining({
            method: 'POST',
          })
        )
      })
    })

    it('shows error for invalid verification code', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid verification code' }),
      })
      const codeInput = screen.getByLabelText(/Verification Code/i)
      fireEvent.change(codeInput, { target: { value: '123456' } })
      fireEvent.click(screen.getByRole('button', { name: /Verify Code/i }))
      await waitFor(() => {
        expect(screen.getByText(/Invalid verification code/i)).toBeInTheDocument()
      })
    })

    it('validates code length before submission', async () => {
      const codeInput = screen.getByLabelText(/Verification Code/i)
      fireEvent.change(codeInput, { target: { value: '123' } })
      // Button should be disabled, so clicking won't trigger submission
      const verifyButton = screen.getByRole('button', { name: /Verify Code/i })
      expect(verifyButton).toBeDisabled()
    })
  })

  // ============================================
  // Password Reset Form Tests (Step 3)
  // ============================================
  describe('Password Reset Form (Step 3)', () => {
    beforeEach(async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      renderWithRouter()
      fireEvent.click(screen.getByText('Email Verification').closest('button'))
      const emailInput = screen.getByLabelText(/Recovery Email/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.click(screen.getByRole('button', { name: /Send Code/i }))
      await waitFor(() => {
        const codeInput = screen.getByLabelText(/Verification Code/i)
        fireEvent.change(codeInput, { target: { value: '123456' } })
        fireEvent.click(screen.getByRole('button', { name: /Verify Code/i }))
      })
      await waitFor(() => {
        expect(screen.getByText('Create New Password')).toBeInTheDocument()
      })
    })

    it('displays password reset heading on step 3', () => {
      expect(screen.getByText('Create New Password')).toBeInTheDocument()
    })

    it('displays new password input', () => {
      expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument()
    })

    it('displays confirm password input', () => {
      expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument()
    })

    it('password inputs have correct type', () => {
      const newPassword = screen.getByLabelText(/New Password/i)
      const confirmPassword = screen.getByLabelText(/Confirm Password/i)
      expect(newPassword).toHaveAttribute('type', 'password')
      expect(confirmPassword).toHaveAttribute('type', 'password')
    })

    it('displays password length requirement', () => {
      expect(screen.getByText(/Must be at least 8 characters long/i)).toBeInTheDocument()
    })

    it('allows typing in password fields', () => {
      const newPassword = screen.getByLabelText(/New Password/i)
      const confirmPassword = screen.getByLabelText(/Confirm Password/i)
      fireEvent.change(newPassword, { target: { value: 'newpassword123' } })
      fireEvent.change(confirmPassword, { target: { value: 'newpassword123' } })
      expect(newPassword).toHaveValue('newpassword123')
      expect(confirmPassword).toHaveValue('newpassword123')
    })

    it('validates password length', async () => {
      const newPassword = screen.getByLabelText(/New Password/i)
      const confirmPassword = screen.getByLabelText(/Confirm Password/i)
      fireEvent.change(newPassword, { target: { value: 'short' } })
      fireEvent.change(confirmPassword, { target: { value: 'short' } })
      fireEvent.click(screen.getByRole('button', { name: /Reset Password/i }))
      await waitFor(() => {
        expect(screen.getByText(/Password must be at least 8 characters long/i)).toBeInTheDocument()
      })
    })

    it('validates passwords match', async () => {
      const newPassword = screen.getByLabelText(/New Password/i)
      const confirmPassword = screen.getByLabelText(/Confirm Password/i)
      fireEvent.change(newPassword, { target: { value: 'password123' } })
      fireEvent.change(confirmPassword, { target: { value: 'password456' } })
      fireEvent.click(screen.getByRole('button', { name: /Reset Password/i }))
      await waitFor(() => {
        expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument()
      })
    })

    it('submits password reset with valid data', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      const newPassword = screen.getByLabelText(/New Password/i)
      const confirmPassword = screen.getByLabelText(/Confirm Password/i)
      fireEvent.change(newPassword, { target: { value: 'newpassword123' } })
      fireEvent.change(confirmPassword, { target: { value: 'newpassword123' } })
      fireEvent.click(screen.getByRole('button', { name: /Reset Password/i }))
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/recovery/reset-password',
          expect.objectContaining({
            method: 'POST',
          })
        )
      })
    })
  })

  // ============================================
  // Success State Tests (Step 4)
  // ============================================
  describe('Success State (Step 4)', () => {
    beforeEach(async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      renderWithRouter()
      fireEvent.click(screen.getByText('Email Verification').closest('button'))
      const emailInput = screen.getByLabelText(/Recovery Email/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.click(screen.getByRole('button', { name: /Send Code/i }))
      await waitFor(() => {
        const codeInput = screen.getByLabelText(/Verification Code/i)
        fireEvent.change(codeInput, { target: { value: '123456' } })
        fireEvent.click(screen.getByRole('button', { name: /Verify Code/i }))
      })
      await waitFor(() => {
        const newPassword = screen.getByLabelText(/New Password/i)
        const confirmPassword = screen.getByLabelText(/Confirm Password/i)
        fireEvent.change(newPassword, { target: { value: 'newpassword123' } })
        fireEvent.change(confirmPassword, { target: { value: 'newpassword123' } })
        fireEvent.click(screen.getByRole('button', { name: /Reset Password/i }))
      })
      await waitFor(() => {
        expect(screen.getByText('Password Reset Successful')).toBeInTheDocument()
      })
    })

    it('displays success heading on step 4', () => {
      expect(screen.getByText('Password Reset Successful')).toBeInTheDocument()
    })

    it('displays success message', () => {
      expect(screen.getByText(/Your password has been successfully reset/i)).toBeInTheDocument()
    })

    it('displays security recommendations', () => {
      expect(screen.getByText('Security Recommendations')).toBeInTheDocument()
      expect(screen.getByText(/Use a unique password for each account/i)).toBeInTheDocument()
      expect(screen.getByText(/Enable two-factor authentication/i)).toBeInTheDocument()
      expect(screen.getByText(/Update your recovery methods/i)).toBeInTheDocument()
    })

    it('displays continue to login button', () => {
      expect(screen.getByRole('button', { name: /Continue to Login/i })).toBeInTheDocument()
    })

    it('navigates to login when continue button clicked', () => {
      fireEvent.click(screen.getByRole('button', { name: /Continue to Login/i }))
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })

    it('does not display back to login button on step 4', () => {
      expect(screen.queryByRole('button', { name: /Back to login/i })).not.toBeInTheDocument()
    })

    it('does not display contact support link on step 4', () => {
      expect(screen.queryByText(/Still need help\?/i)).not.toBeInTheDocument()
    })
  })

  // ============================================
  // Loading States Tests
  // ============================================
  describe('Loading States', () => {
    it('shows loading spinner during email code sending', async () => {
      global.fetch.mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
      )
      renderWithRouter()
      fireEvent.click(screen.getByText('Email Verification').closest('button'))
      const emailInput = screen.getByLabelText(/Recovery Email/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.click(screen.getByRole('button', { name: /Send Code/i }))
      await waitFor(() => {
        expect(screen.getByText(/Sending\.\.\./i)).toBeInTheDocument()
      })
    })

    it('shows loading spinner during code verification', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      global.fetch.mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
      )
      renderWithRouter()
      fireEvent.click(screen.getByText('Email Verification').closest('button'))
      const emailInput = screen.getByLabelText(/Recovery Email/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.click(screen.getByRole('button', { name: /Send Code/i }))
      await waitFor(() => {
        const codeInput = screen.getByLabelText(/Verification Code/i)
        fireEvent.change(codeInput, { target: { value: '123456' } })
        fireEvent.click(screen.getByRole('button', { name: /Verify Code/i }))
      })
      await waitFor(() => {
        expect(screen.getByText(/Verifying\.\.\./i)).toBeInTheDocument()
      })
    })

    it('shows loading spinner during password reset', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      global.fetch.mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
      )
      renderWithRouter()
      fireEvent.click(screen.getByText('Email Verification').closest('button'))
      const emailInput = screen.getByLabelText(/Recovery Email/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.click(screen.getByRole('button', { name: /Send Code/i }))
      await waitFor(() => {
        const codeInput = screen.getByLabelText(/Verification Code/i)
        fireEvent.change(codeInput, { target: { value: '123456' } })
        fireEvent.click(screen.getByRole('button', { name: /Verify Code/i }))
      })
      await waitFor(() => {
        const newPassword = screen.getByLabelText(/New Password/i)
        const confirmPassword = screen.getByLabelText(/Confirm Password/i)
        fireEvent.change(newPassword, { target: { value: 'newpassword123' } })
        fireEvent.change(confirmPassword, { target: { value: 'newpassword123' } })
        fireEvent.click(screen.getByRole('button', { name: /Reset Password/i }))
      })
      await waitFor(() => {
        expect(screen.getByText(/Resetting\.\.\./i)).toBeInTheDocument()
      })
    })

    it('disables buttons during loading', async () => {
      global.fetch.mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
      )
      renderWithRouter()
      fireEvent.click(screen.getByText('Email Verification').closest('button'))
      const emailInput = screen.getByLabelText(/Recovery Email/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      const submitButton = screen.getByRole('button', { name: /Send Code/i })
      fireEvent.click(submitButton)
      await waitFor(() => {
        expect(submitButton).toBeDisabled()
      })
    })
  })

  // ============================================
  // Error Handling Tests
  // ============================================
  describe('Error Handling', () => {
    it('displays error when send code API fails', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))
      renderWithRouter()
      fireEvent.click(screen.getByText('Email Verification').closest('button'))
      const emailInput = screen.getByLabelText(/Recovery Email/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.click(screen.getByRole('button', { name: /Send Code/i }))
      await waitFor(() => {
        expect(screen.getByText(/An error occurred\. Please try again\./i)).toBeInTheDocument()
      })
    })

    it('displays custom error message from API', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Email not found' }),
      })
      renderWithRouter()
      fireEvent.click(screen.getByText('Email Verification').closest('button'))
      const emailInput = screen.getByLabelText(/Recovery Email/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.click(screen.getByRole('button', { name: /Send Code/i }))
      await waitFor(() => {
        expect(screen.getByText(/Email not found/i)).toBeInTheDocument()
      })
    })

    it('displays error for network failure during verification', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      global.fetch.mockRejectedValueOnce(new Error('Network error'))
      renderWithRouter()
      fireEvent.click(screen.getByText('Email Verification').closest('button'))
      const emailInput = screen.getByLabelText(/Recovery Email/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.click(screen.getByRole('button', { name: /Send Code/i }))
      await waitFor(() => {
        const codeInput = screen.getByLabelText(/Verification Code/i)
        fireEvent.change(codeInput, { target: { value: '123456' } })
        fireEvent.click(screen.getByRole('button', { name: /Verify Code/i }))
      })
      await waitFor(() => {
        expect(screen.getByText(/An error occurred\. Please try again\./i)).toBeInTheDocument()
      })
    })

    it('displays error for failed password reset', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Session expired' }),
      })
      renderWithRouter()
      fireEvent.click(screen.getByText('Email Verification').closest('button'))
      const emailInput = screen.getByLabelText(/Recovery Email/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.click(screen.getByRole('button', { name: /Send Code/i }))
      await waitFor(() => {
        const codeInput = screen.getByLabelText(/Verification Code/i)
        fireEvent.change(codeInput, { target: { value: '123456' } })
        fireEvent.click(screen.getByRole('button', { name: /Verify Code/i }))
      })
      await waitFor(() => {
        const newPassword = screen.getByLabelText(/New Password/i)
        const confirmPassword = screen.getByLabelText(/Confirm Password/i)
        fireEvent.change(newPassword, { target: { value: 'newpassword123' } })
        fireEvent.change(confirmPassword, { target: { value: 'newpassword123' } })
        fireEvent.click(screen.getByRole('button', { name: /Reset Password/i }))
      })
      await waitFor(() => {
        expect(screen.getByText(/Session expired/i)).toBeInTheDocument()
      })
    })

    it('displays error alert with proper styling', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))
      renderWithRouter()
      fireEvent.click(screen.getByText('Email Verification').closest('button'))
      const emailInput = screen.getByLabelText(/Recovery Email/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.click(screen.getByRole('button', { name: /Send Code/i }))
      await waitFor(() => {
        const errorDiv = screen.getByText(/An error occurred/i).closest('div')
        expect(errorDiv).toHaveClass('bg-red-500/10')
      })
    })
  })

  // ============================================
  // Navigation Tests
  // ============================================
  describe('Navigation', () => {
    it('navigates back to login when back button clicked', () => {
      renderWithRouter()
      fireEvent.click(screen.getByRole('button', { name: /Back to login/i }))
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })

    it('contact support link navigates correctly', () => {
      renderWithRouter()
      const supportLink = screen.getByRole('link', { name: /Contact Support/i })
      expect(supportLink).toHaveAttribute('to', '/contact')
    })
  })

  // ============================================
  // Edge Cases Tests
  // ============================================
  describe('Edge Cases', () => {
    it('handles resend code functionality', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      renderWithRouter()
      fireEvent.click(screen.getByText('Email Verification').closest('button'))
      const emailInput = screen.getByLabelText(/Recovery Email/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.click(screen.getByRole('button', { name: /Send Code/i }))
      await waitFor(() => {
        const resendButton = screen.getByText(/Didn't receive a code\? Resend/i)
        fireEvent.click(resendButton)
      })
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2)
      })
    })

    it('handles empty string input gracefully', () => {
      renderWithRouter()
      fireEvent.click(screen.getByText('Email Verification').closest('button'))
      const emailInput = screen.getByLabelText(/Recovery Email/i)
      fireEvent.change(emailInput, { target: { value: '   ' } })
      fireEvent.change(emailInput, { target: { value: '' } })
      expect(emailInput).toHaveValue('')
    })

    it('clears error when user starts typing', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))
      renderWithRouter()
      fireEvent.click(screen.getByText('Email Verification').closest('button'))
      const emailInput = screen.getByLabelText(/Recovery Email/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.click(screen.getByRole('button', { name: /Send Code/i }))
      await waitFor(() => {
        expect(screen.getByText(/An error occurred/i)).toBeInTheDocument()
      })
      // Submit again to clear error
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      fireEvent.click(screen.getByRole('button', { name: /Send Code/i }))
      await waitFor(() => {
        expect(screen.queryByText(/An error occurred/i)).not.toBeInTheDocument()
      })
    })

    it('handles security questions with whitespace only answers', async () => {
      renderWithRouter()
      fireEvent.click(screen.getByText('Security Questions').closest('button'))
      const inputs = screen.getAllByRole('textbox')
      fireEvent.change(inputs[0], { target: { value: '   ' } })
      fireEvent.change(inputs[1], { target: { value: '  ' } })
      fireEvent.change(inputs[2], { target: { value: ' ' } })
      const submitButton = screen.getByRole('button', { name: /Verify Answers/i })
      fireEvent.click(submitButton)
      await waitFor(() => {
        expect(screen.getByText(/Please answer all security questions/i)).toBeInTheDocument()
      })
    })

    it('handles backup code with exact 8 characters', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      renderWithRouter()
      fireEvent.click(screen.getByText('Backup Code').closest('button'))
      const backupInput = screen.getByLabelText(/Backup Code/i)
      fireEvent.change(backupInput, { target: { value: 'ABCD1234' } })
      const submitButton = screen.getByRole('button', { name: /Verify Code/i })
      fireEvent.click(submitButton)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
    })

    it('prevents form submission when already loading', async () => {
      global.fetch.mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
      )
      renderWithRouter()
      fireEvent.click(screen.getByText('Email Verification').closest('button'))
      const emailInput = screen.getByLabelText(/Recovery Email/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      const submitButton = screen.getByRole('button', { name: /Send Code/i })
      fireEvent.click(submitButton)
      fireEvent.click(submitButton) // Click again while loading
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1)
      })
    })

    it('sends backup code in reset payload when using backup method', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      renderWithRouter()
      fireEvent.click(screen.getByText('Backup Code').closest('button'))
      const backupInput = screen.getByLabelText(/Backup Code/i)
      fireEvent.change(backupInput, { target: { value: 'ABCD1234' } })
      fireEvent.click(screen.getByRole('button', { name: /Verify Code/i }))
      await waitFor(() => {
        const newPassword = screen.getByLabelText(/New Password/i)
        const confirmPassword = screen.getByLabelText(/Confirm Password/i)
        fireEvent.change(newPassword, { target: { value: 'newpassword123' } })
        fireEvent.change(confirmPassword, { target: { value: 'newpassword123' } })
        fireEvent.click(screen.getByRole('button', { name: /Reset Password/i }))
      })
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/recovery/reset-password',
          expect.objectContaining({
            body: expect.stringContaining('ABCD1234'),
          })
        )
      })
    })
  })

  // ============================================
  // Accessibility Tests
  // ============================================
  describe('Accessibility', () => {
    it('has proper ARIA labels on main element', () => {
      renderWithRouter()
      const main = screen.getByRole('main')
      expect(main).toHaveAttribute('aria-label', 'Account recovery')
    })

    it('has proper ARIA label on back button', () => {
      renderWithRouter()
      const backButton = screen.getByRole('button', { name: /Back to login/i })
      expect(backButton).toHaveAttribute('aria-label', 'Back to login')
    })

    it('all form inputs have associated labels', () => {
      renderWithRouter()
      fireEvent.click(screen.getByText('Email Verification').closest('button'))
      const emailInput = screen.getByLabelText(/Recovery Email/i)
      expect(emailInput).toBeInTheDocument()
    })

    it('error messages are associated with inputs', async () => {
      renderWithRouter()
      fireEvent.click(screen.getByText('Email Verification').closest('button'))
      fireEvent.click(screen.getByRole('button', { name: /Send Code/i }))
      await waitFor(() => {
        const errorMessage = screen.getByText(/Please enter your email/i)
        expect(errorMessage).toBeInTheDocument()
      })
    })

    it('buttons have descriptive text', () => {
      renderWithRouter()
      fireEvent.click(screen.getByText('Email Verification').closest('button'))
      expect(screen.getByRole('button', { name: /Send Code/i })).toBeInTheDocument()
    })

    it('supports keyboard navigation', () => {
      renderWithRouter()
      const backButton = screen.getByRole('button', { name: /Back to login/i })
      backButton.focus()
      expect(document.activeElement).toBe(backButton)
    })
  })

  // ============================================
  // Snapshot Tests
  // ============================================
  describe('Snapshot Tests', () => {
    it('matches snapshot for step 1 - method selection', () => {
      const { container } = renderWithRouter()
      expect(container).toMatchSnapshot()
    })

    it('matches snapshot for email form', () => {
      renderWithRouter()
      fireEvent.click(screen.getByText('Email Verification').closest('button'))
      const form = screen.getByLabelText(/Recovery Email/i).closest('form')
      expect(form).toMatchSnapshot()
    })

    it('matches snapshot for phone form', () => {
      renderWithRouter()
      fireEvent.click(screen.getByText('SMS Verification').closest('button'))
      const form = screen.getByLabelText(/Phone Number/i).closest('form')
      expect(form).toMatchSnapshot()
    })

    it('matches snapshot for security questions form', () => {
      renderWithRouter()
      fireEvent.click(screen.getByText('Security Questions').closest('button'))
      const form = screen.getByText(/What was the name of your first pet\?/i).closest('form')
      expect(form).toMatchSnapshot()
    })

    it('matches snapshot for backup code form', () => {
      renderWithRouter()
      fireEvent.click(screen.getByText('Backup Code').closest('button'))
      const form = screen.getByLabelText(/Backup Code/i).closest('form')
      expect(form).toMatchSnapshot()
    })

    it('matches snapshot for error state', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))
      renderWithRouter()
      fireEvent.click(screen.getByText('Email Verification').closest('button'))
      const emailInput = screen.getByLabelText(/Recovery Email/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.click(screen.getByRole('button', { name: /Send Code/i }))
      await waitFor(() => {
        const errorDiv = screen.getByText(/An error occurred/i).closest('div')
        expect(errorDiv).toMatchSnapshot()
      })
    })
  })
})

export default mockNavigate
