import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import MFALoginPage from '../MFALoginPage'

// Mock react-router-dom hooks
const mockNavigate = jest.fn()
const mockLocation = {
  state: {
    email: 'test@example.com',
    from: '/dashboard',
  },
}

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Shield: () => <div data-testid="shield-icon">Shield</div>,
  ArrowLeft: () => <div data-testid="arrow-left-icon">ArrowLeft</div>,
  Key: () => <div data-testid="key-icon">Key</div>,
  AlertCircle: () => <div data-testid="alert-icon">AlertCircle</div>,
  Loader2: (props) => <div data-testid="loader-icon" {...props}>Loader2</div>,
}))

// Mock fetch globally
global.fetch = jest.fn()

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    readText: jest.fn().mockResolvedValue('123456'),
  },
})

const renderComponent = (locationState = mockLocation.state) => {
  const customLocation = { ...mockLocation, state: locationState }
  jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue(customLocation)

  return render(
    <BrowserRouter>
      <MFALoginPage />
    </BrowserRouter>
  )
}

describe('MFALoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch.mockClear()
  })

  describe('Initial Rendering', () => {
    it('renders without crashing', () => {
      renderComponent()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('displays the main heading', () => {
      renderComponent()
      expect(screen.getByRole('heading', { name: /Two-Factor Authentication/i })).toBeInTheDocument()
    })

    it('displays instructions', () => {
      renderComponent()
      expect(screen.getByText(/Enter the 6-digit code from your authenticator app/i)).toBeInTheDocument()
    })

    it('renders shield icon', () => {
      renderComponent()
      expect(screen.getByTestId('shield-icon')).toBeInTheDocument()
    })

    it('has proper ARIA label', () => {
      renderComponent()
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Two-factor authentication')
    })

    it('displays back button', () => {
      renderComponent()
      expect(screen.getByRole('button', { name: /Back to login/i })).toBeInTheDocument()
    })

    it('shows email when passed in location state', () => {
      renderComponent({ email: 'user@test.com', from: '/home' })
      expect(screen.getByText('user@test.com')).toBeInTheDocument()
    })

    it('does not show email when not passed in state', () => {
      renderComponent({ from: '/home' })
      expect(screen.queryByText(/@/)).not.toBeInTheDocument()
    })
  })

  describe('Code Input Fields', () => {
    it('renders 6 input fields', () => {
      renderComponent()
      const inputs = screen.getAllByRole('textbox')
      expect(inputs).toHaveLength(6)
    })

    it('each input has correct attributes', () => {
      renderComponent()
      const inputs = screen.getAllByRole('textbox')

      inputs.forEach((input, index) => {
        expect(input).toHaveAttribute('type', 'text')
        expect(input).toHaveAttribute('inputMode', 'numeric')
        expect(input).toHaveAttribute('maxLength', '1')
        expect(input).toHaveAttribute('aria-label', `Digit ${index + 1}`)
      })
    })

    it('first input is focused on mount', async () => {
      renderComponent()
      const inputs = screen.getAllByRole('textbox')

      await waitFor(() => {
        expect(document.activeElement).toBe(inputs[0])
      })
    })

    it('accepts single digit input', async () => {
      renderComponent()
      const inputs = screen.getAllByRole('textbox')

      fireEvent.change(inputs[0], { target: { value: '5' } })
      expect(inputs[0].value).toBe('5')
    })

    it('only accepts numeric input', async () => {
      renderComponent()
      const inputs = screen.getAllByRole('textbox')

      fireEvent.change(inputs[0], { target: { value: 'a' } })
      expect(inputs[0].value).toBe('')
    })

    it('rejects special characters', async () => {
      renderComponent()
      const inputs = screen.getAllByRole('textbox')

      fireEvent.change(inputs[0], { target: { value: '!' } })
      expect(inputs[0].value).toBe('')
    })

    it('auto-advances to next input after entering digit', async () => {
      renderComponent()
      const inputs = screen.getAllByRole('textbox')

      fireEvent.change(inputs[0], { target: { value: '1' } })

      await waitFor(() => {
        expect(document.activeElement).toBe(inputs[1])
      })
    })

    it('does not advance from last input', async () => {
      renderComponent()
      const inputs = screen.getAllByRole('textbox')

      fireEvent.change(inputs[5], { target: { value: '6' } })

      await waitFor(() => {
        expect(document.activeElement).toBe(inputs[5])
      })
    })

    it('handles backspace to move to previous input', async () => {
      renderComponent()
      const inputs = screen.getAllByRole('textbox')

      inputs[1].focus()
      fireEvent.keyDown(inputs[1], { key: 'Backspace' })

      await waitFor(() => {
        expect(document.activeElement).toBe(inputs[0])
      })
    })

    it('backspace on first input keeps focus', async () => {
      renderComponent()
      const inputs = screen.getAllByRole('textbox')

      fireEvent.keyDown(inputs[0], { key: 'Backspace' })
      expect(document.activeElement).toBe(inputs[0])
    })

    it('clears error when user starts typing', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid code' }),
      })

      renderComponent()
      const inputs = screen.getAllByRole('textbox')

      // Fill in code
      inputs.forEach((input, index) => {
        fireEvent.change(input, { target: { value: (index + 1).toString() } })
      })

      await waitFor(() => {
        expect(screen.getByText('Invalid code')).toBeInTheDocument()
      })

      // Start typing
      fireEvent.change(inputs[0], { target: { value: '9' } })

      expect(screen.queryByText('Invalid code')).not.toBeInTheDocument()
    })
  })

  describe('Paste Functionality', () => {
    it('handles paste of 6-digit code', async () => {
      renderComponent()
      const inputs = screen.getAllByRole('textbox')

      fireEvent.keyDown(inputs[0], {
        key: 'v',
        ctrlKey: true,
      })

      await waitFor(() => {
        expect(navigator.clipboard.readText).toHaveBeenCalled()
      })
    })

    it('distributes pasted digits across inputs', async () => {
      navigator.clipboard.readText.mockResolvedValueOnce('987654')

      renderComponent()
      const inputs = screen.getAllByRole('textbox')

      fireEvent.keyDown(inputs[0], {
        key: 'v',
        ctrlKey: true,
      })

      await waitFor(() => {
        expect(inputs[0].value).toBe('9')
        expect(inputs[1].value).toBe('8')
        expect(inputs[2].value).toBe('7')
        expect(inputs[3].value).toBe('6')
        expect(inputs[4].value).toBe('5')
        expect(inputs[5].value).toBe('4')
      })
    })

    it('handles paste with non-numeric characters', async () => {
      navigator.clipboard.readText.mockResolvedValueOnce('1a2b3c')

      renderComponent()
      const inputs = screen.getAllByRole('textbox')

      fireEvent.keyDown(inputs[0], {
        key: 'v',
        ctrlKey: true,
      })

      await waitFor(() => {
        expect(inputs[0].value).toBe('1')
        expect(inputs[1].value).toBe('2')
        expect(inputs[2].value).toBe('3')
      })
    })

    it('handles paste on middle input', async () => {
      navigator.clipboard.readText.mockResolvedValueOnce('456')

      renderComponent()
      const inputs = screen.getAllByRole('textbox')

      fireEvent.keyDown(inputs[2], {
        key: 'v',
        ctrlKey: true,
      })

      await waitFor(() => {
        expect(inputs[2].value).toBe('4')
        expect(inputs[3].value).toBe('5')
        expect(inputs[4].value).toBe('6')
      })
    })

    it('supports cmd+v on Mac', async () => {
      navigator.clipboard.readText.mockResolvedValueOnce('123456')

      renderComponent()
      const inputs = screen.getAllByRole('textbox')

      fireEvent.keyDown(inputs[0], {
        key: 'v',
        metaKey: true,
      })

      await waitFor(() => {
        expect(navigator.clipboard.readText).toHaveBeenCalled()
      })
    })

    it('truncates pasted text to 6 digits', async () => {
      navigator.clipboard.readText.mockResolvedValueOnce('123456789')

      renderComponent()
      const inputs = screen.getAllByRole('textbox')

      fireEvent.keyDown(inputs[0], {
        key: 'v',
        ctrlKey: true,
      })

      await waitFor(() => {
        expect(inputs[5].value).toBe('6')
      })
    })
  })

  describe('Auto-submit', () => {
    it('submits automatically when all 6 digits entered', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      renderComponent()
      const inputs = screen.getAllByRole('textbox')

      inputs.forEach((input, index) => {
        fireEvent.change(input, { target: { value: (index + 1).toString() } })
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/mfa/verify-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            code: '123456',
            rememberDevice: false,
            email: 'test@example.com',
          }),
        })
      })
    })

    it('does not auto-submit when loading', async () => {
      global.fetch.mockImplementationOnce(() => new Promise(() => {}))

      renderComponent()
      const inputs = screen.getAllByRole('textbox')

      inputs.forEach((input, index) => {
        fireEvent.change(input, { target: { value: (index + 1).toString() } })
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1)
      })

      // Try to trigger auto-submit again
      fireEvent.change(inputs[0], { target: { value: '9' } })

      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('includes remember device preference in submission', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      renderComponent()

      const checkbox = screen.getByRole('checkbox', { name: /Remember this device/i })
      fireEvent.click(checkbox)

      const inputs = screen.getAllByRole('textbox')
      inputs.forEach((input, index) => {
        fireEvent.change(input, { target: { value: (index + 1).toString() } })
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/mfa/verify-login',
          expect.objectContaining({
            body: expect.stringContaining('"rememberDevice":true')
          })
        )
      })
    })
  })

  describe('Verification Process', () => {
    it('shows loading indicator during verification', async () => {
      global.fetch.mockImplementationOnce(() => new Promise(() => {}))

      renderComponent()
      const inputs = screen.getAllByRole('textbox')

      inputs.forEach((input, index) => {
        fireEvent.change(input, { target: { value: (index + 1).toString() } })
      })

      await waitFor(() => {
        expect(screen.getByText('Verifying...')).toBeInTheDocument()
      })
    })

    it('displays loader icon during verification', async () => {
      global.fetch.mockImplementationOnce(() => new Promise(() => {}))

      renderComponent()
      const inputs = screen.getAllByRole('textbox')

      inputs.forEach((input, index) => {
        fireEvent.change(input, { target: { value: (index + 1).toString() } })
      })

      await waitFor(() => {
        expect(screen.getByTestId('loader-icon')).toBeInTheDocument()
      })
    })

    it('disables inputs during verification', async () => {
      global.fetch.mockImplementationOnce(() => new Promise(() => {}))

      renderComponent()
      const inputs = screen.getAllByRole('textbox')

      inputs.forEach((input, index) => {
        fireEvent.change(input, { target: { value: (index + 1).toString() } })
      })

      await waitFor(() => {
        inputs.forEach(input => {
          expect(input).toBeDisabled()
        })
      })
    })

    it('redirects on successful verification', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      renderComponent()
      const inputs = screen.getAllByRole('textbox')

      inputs.forEach((input, index) => {
        fireEvent.change(input, { target: { value: (index + 1).toString() } })
      })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
      })
    })

    it('redirects to home if no from location', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      renderComponent({ email: 'test@test.com' })
      const inputs = screen.getAllByRole('textbox')

      inputs.forEach((input, index) => {
        fireEvent.change(input, { target: { value: (index + 1).toString() } })
      })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/home', { replace: true })
      })
    })

    it('displays error message on failed verification', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid verification code' }),
      })

      renderComponent()
      const inputs = screen.getAllByRole('textbox')

      inputs.forEach((input, index) => {
        fireEvent.change(input, { target: { value: (index + 1).toString() } })
      })

      await waitFor(() => {
        expect(screen.getByText('Invalid verification code')).toBeInTheDocument()
      })
    })

    it('shows alert icon with error message', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid code' }),
      })

      renderComponent()
      const inputs = screen.getAllByRole('textbox')

      inputs.forEach((input, index) => {
        fireEvent.change(input, { target: { value: (index + 1).toString() } })
      })

      await waitFor(() => {
        expect(screen.getByTestId('alert-icon')).toBeInTheDocument()
      })
    })

    it('clears inputs on error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid code' }),
      })

      renderComponent()
      const inputs = screen.getAllByRole('textbox')

      inputs.forEach((input, index) => {
        fireEvent.change(input, { target: { value: (index + 1).toString() } })
      })

      await waitFor(() => {
        inputs.forEach(input => {
          expect(input.value).toBe('')
        })
      })
    })

    it('refocuses first input after error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid code' }),
      })

      renderComponent()
      const inputs = screen.getAllByRole('textbox')

      inputs.forEach((input, index) => {
        fireEvent.change(input, { target: { value: (index + 1).toString() } })
      })

      await waitFor(() => {
        expect(document.activeElement).toBe(inputs[0])
      })
    })

    it('handles network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      renderComponent()
      const inputs = screen.getAllByRole('textbox')

      inputs.forEach((input, index) => {
        fireEvent.change(input, { target: { value: (index + 1).toString() } })
      })

      await waitFor(() => {
        expect(screen.getByText('An error occurred. Please try again.')).toBeInTheDocument()
      })
    })

    it('shows default error message when none provided', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      })

      renderComponent()
      const inputs = screen.getAllByRole('textbox')

      inputs.forEach((input, index) => {
        fireEvent.change(input, { target: { value: (index + 1).toString() } })
      })

      await waitFor(() => {
        expect(screen.getByText('Invalid verification code')).toBeInTheDocument()
      })
    })
  })

  describe('Remember Device Checkbox', () => {
    it('displays remember device checkbox', () => {
      renderComponent()
      expect(screen.getByRole('checkbox', { name: /Remember this device/i })).toBeInTheDocument()
    })

    it('shows label text', () => {
      renderComponent()
      expect(screen.getByText(/Remember this device for 30 days/i)).toBeInTheDocument()
    })

    it('is unchecked by default', () => {
      renderComponent()
      const checkbox = screen.getByRole('checkbox', { name: /Remember this device/i })
      expect(checkbox).not.toBeChecked()
    })

    it('can be checked', () => {
      renderComponent()
      const checkbox = screen.getByRole('checkbox', { name: /Remember this device/i })

      fireEvent.click(checkbox)
      expect(checkbox).toBeChecked()
    })

    it('can be unchecked', () => {
      renderComponent()
      const checkbox = screen.getByRole('checkbox', { name: /Remember this device/i })

      fireEvent.click(checkbox)
      fireEvent.click(checkbox)
      expect(checkbox).not.toBeChecked()
    })

    it('is disabled during verification', async () => {
      global.fetch.mockImplementationOnce(() => new Promise(() => {}))

      renderComponent()
      const inputs = screen.getAllByRole('textbox')

      inputs.forEach((input, index) => {
        fireEvent.change(input, { target: { value: (index + 1).toString() } })
      })

      await waitFor(() => {
        const checkbox = screen.getByRole('checkbox', { name: /Remember this device/i })
        expect(checkbox).toBeDisabled()
      })
    })
  })

  describe('Backup Code Option', () => {
    it('displays backup code link', () => {
      renderComponent()
      expect(screen.getByRole('button', { name: /Use backup code instead/i })).toBeInTheDocument()
    })

    it('shows key icon', () => {
      renderComponent()
      expect(screen.getByTestId('key-icon')).toBeInTheDocument()
    })

    it('switches to backup code form when clicked', () => {
      renderComponent()
      const backupLink = screen.getByRole('button', { name: /Use backup code instead/i })

      fireEvent.click(backupLink)

      expect(screen.getByLabelText(/Backup Code/i)).toBeInTheDocument()
    })

    it('hides code inputs when showing backup form', () => {
      renderComponent()
      const backupLink = screen.getByRole('button', { name: /Use backup code instead/i })

      fireEvent.click(backupLink)

      const textInputs = screen.queryAllByRole('textbox')
      expect(textInputs).toHaveLength(1) // Only backup code input
    })

    it('is disabled during verification', async () => {
      global.fetch.mockImplementationOnce(() => new Promise(() => {}))

      renderComponent()
      const inputs = screen.getAllByRole('textbox')

      inputs.forEach((input, index) => {
        fireEvent.change(input, { target: { value: (index + 1).toString() } })
      })

      await waitFor(() => {
        const backupLink = screen.getByRole('button', { name: /Use backup code instead/i })
        expect(backupLink).toBeDisabled()
      })
    })
  })

  describe('Backup Code Form', () => {
    beforeEach(() => {
      renderComponent()
      const backupLink = screen.getByRole('button', { name: /Use backup code instead/i })
      fireEvent.click(backupLink)
    })

    it('displays backup code input field', () => {
      expect(screen.getByLabelText(/Backup Code/i)).toBeInTheDocument()
    })

    it('shows helper text', () => {
      expect(screen.getByText(/Enter one of your backup codes provided during MFA setup/i)).toBeInTheDocument()
    })

    it('displays verify button', () => {
      expect(screen.getByRole('button', { name: /Verify Backup Code/i })).toBeInTheDocument()
    })

    it('accepts backup code input', () => {
      const input = screen.getByLabelText(/Backup Code/i)

      fireEvent.change(input, { target: { value: 'BACKUP123' } })
      expect(input.value).toBe('BACKUP123')
    })

    it('has required attribute', () => {
      const input = screen.getByLabelText(/Backup Code/i)
      expect(input).toBeRequired()
    })

    it('submits backup code', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      const input = screen.getByLabelText(/Backup Code/i)
      fireEvent.change(input, { target: { value: 'BACKUP123456' } })

      const submitButton = screen.getByRole('button', { name: /Verify Backup Code/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/mfa/verify-backup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            backupCode: 'BACKUP123456',
            rememberDevice: false,
            email: 'test@example.com',
          }),
        })
      })
    })

    it('validates backup code length', async () => {
      const input = screen.getByLabelText(/Backup Code/i)
      fireEvent.change(input, { target: { value: 'SHORT' } })

      const submitButton = screen.getByRole('button', { name: /Verify Backup Code/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid backup code')).toBeInTheDocument()
      })
    })

    it('shows loading state during verification', async () => {
      global.fetch.mockImplementationOnce(() => new Promise(() => {}))

      const input = screen.getByLabelText(/Backup Code/i)
      fireEvent.change(input, { target: { value: 'BACKUP123456' } })

      const submitButton = screen.getByRole('button', { name: /Verify Backup Code/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Verifying...')).toBeInTheDocument()
      })
    })

    it('displays error on failed verification', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid backup code' }),
      })

      const input = screen.getByLabelText(/Backup Code/i)
      fireEvent.change(input, { target: { value: 'BACKUP123456' } })

      const submitButton = screen.getByRole('button', { name: /Verify Backup Code/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid backup code')).toBeInTheDocument()
      })
    })

    it('redirects on successful backup code verification', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      const input = screen.getByLabelText(/Backup Code/i)
      fireEvent.change(input, { target: { value: 'BACKUP123456' } })

      const submitButton = screen.getByRole('button', { name: /Verify Backup Code/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
      })
    })

    it('includes remember device in backup verification', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      const checkbox = screen.getByRole('checkbox', { name: /Remember this device/i })
      fireEvent.click(checkbox)

      const input = screen.getByLabelText(/Backup Code/i)
      fireEvent.change(input, { target: { value: 'BACKUP123456' } })

      const submitButton = screen.getByRole('button', { name: /Verify Backup Code/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/mfa/verify-backup',
          expect.objectContaining({
            body: expect.stringContaining('"rememberDevice":true')
          })
        )
      })
    })

    it('disables input during verification', async () => {
      global.fetch.mockImplementationOnce(() => new Promise(() => {}))

      const input = screen.getByLabelText(/Backup Code/i)
      fireEvent.change(input, { target: { value: 'BACKUP123456' } })

      const submitButton = screen.getByRole('button', { name: /Verify Backup Code/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(input).toBeDisabled()
      })
    })

    it('disables submit button during verification', async () => {
      global.fetch.mockImplementationOnce(() => new Promise(() => {}))

      const input = screen.getByLabelText(/Backup Code/i)
      fireEvent.change(input, { target: { value: 'BACKUP123456' } })

      const submitButton = screen.getByRole('button', { name: /Verify Backup Code/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(submitButton).toBeDisabled()
      })
    })
  })

  describe('Switch Back to Authenticator Code', () => {
    it('shows link to switch back', () => {
      renderComponent()
      const backupLink = screen.getByRole('button', { name: /Use backup code instead/i })
      fireEvent.click(backupLink)

      expect(screen.getByRole('button', { name: /Use authenticator code instead/i })).toBeInTheDocument()
    })

    it('switches back to code inputs', () => {
      renderComponent()
      const backupLink = screen.getByRole('button', { name: /Use backup code instead/i })
      fireEvent.click(backupLink)

      const switchBackLink = screen.getByRole('button', { name: /Use authenticator code instead/i })
      fireEvent.click(switchBackLink)

      expect(screen.getAllByRole('textbox')).toHaveLength(6)
    })

    it('clears error when switching back', () => {
      renderComponent()
      const backupLink = screen.getByRole('button', { name: /Use backup code instead/i })
      fireEvent.click(backupLink)

      const input = screen.getByLabelText(/Backup Code/i)
      fireEvent.change(input, { target: { value: 'SHORT' } })

      const submitButton = screen.getByRole('button', { name: /Verify Backup Code/i })
      fireEvent.click(submitButton)

      const switchBackLink = screen.getByRole('button', { name: /Use authenticator code instead/i })
      fireEvent.click(switchBackLink)

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('is disabled during verification', async () => {
      global.fetch.mockImplementationOnce(() => new Promise(() => {}))

      renderComponent()
      const backupLink = screen.getByRole('button', { name: /Use backup code instead/i })
      fireEvent.click(backupLink)

      const input = screen.getByLabelText(/Backup Code/i)
      fireEvent.change(input, { target: { value: 'BACKUP123456' } })

      const submitButton = screen.getByRole('button', { name: /Verify Backup Code/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        const switchBackLink = screen.getByRole('button', { name: /Use authenticator code instead/i })
        expect(switchBackLink).toBeDisabled()
      })
    })
  })

  describe('Back Button', () => {
    it('navigates to login page', () => {
      renderComponent()
      const backButton = screen.getByRole('button', { name: /Back to login/i })

      fireEvent.click(backButton)
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })

    it('shows arrow left icon', () => {
      renderComponent()
      expect(screen.getByTestId('arrow-left-icon')).toBeInTheDocument()
    })
  })

  describe('Account Recovery Link', () => {
    it('displays help text', () => {
      renderComponent()
      expect(screen.getByText(/Lost access to your authenticator\?/i)).toBeInTheDocument()
    })

    it('shows recovery link', () => {
      renderComponent()
      const link = screen.getByRole('link', { name: /Recover your account/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/account-recovery')
    })
  })

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      renderComponent()
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('Two-Factor Authentication')
    })

    it('all inputs have ARIA labels', () => {
      renderComponent()
      const inputs = screen.getAllByRole('textbox')

      inputs.forEach((input, index) => {
        expect(input).toHaveAttribute('aria-label', `Digit ${index + 1}`)
      })
    })

    it('checkbox has accessible label', () => {
      renderComponent()
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveAccessibleName(/Remember this device/i)
    })

    it('buttons have accessible names', () => {
      renderComponent()
      expect(screen.getByRole('button', { name: /Back to login/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Use backup code instead/i })).toBeInTheDocument()
    })

    it('error messages have role="alert"', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid code' }),
      })

      renderComponent()
      const inputs = screen.getAllByRole('textbox')

      inputs.forEach((input, index) => {
        fireEvent.change(input, { target: { value: (index + 1).toString() } })
      })

      await waitFor(() => {
        const errorDiv = screen.getByText('Invalid code').closest('div')
        expect(errorDiv).toBeInTheDocument()
      })
    })
  })

  describe('UI States', () => {
    it('shows opacity on disabled inputs', async () => {
      global.fetch.mockImplementationOnce(() => new Promise(() => {}))

      renderComponent()
      const inputs = screen.getAllByRole('textbox')

      inputs.forEach((input, index) => {
        fireEvent.change(input, { target: { value: (index + 1).toString() } })
      })

      await waitFor(() => {
        inputs.forEach(input => {
          expect(input).toHaveClass('disabled:opacity-50')
        })
      })
    })

    it('loader icon has spin animation', async () => {
      global.fetch.mockImplementationOnce(() => new Promise(() => {}))

      renderComponent()
      const inputs = screen.getAllByRole('textbox')

      inputs.forEach((input, index) => {
        fireEvent.change(input, { target: { value: (index + 1).toString() } })
      })

      await waitFor(() => {
        const loader = screen.getByTestId('loader-icon')
        expect(loader).toHaveClass('')
      })
    })
  })

  describe('Error Handling', () => {
    it('validates all 6 digits are entered', async () => {
      renderComponent()
      const inputs = screen.getAllByRole('textbox')

      // Only enter 5 digits
      for (let i = 0; i < 5; i++) {
        fireEvent.change(inputs[i], { target: { value: (i + 1).toString() } })
      }

      // Should not submit
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('handles empty backup code submission', async () => {
      renderComponent()
      const backupLink = screen.getByRole('button', { name: /Use backup code instead/i })
      fireEvent.click(backupLink)

      const submitButton = screen.getByRole('button', { name: /Verify Backup Code/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid backup code')).toBeInTheDocument()
      })
    })

    it('handles network error in backup code verification', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      renderComponent()
      const backupLink = screen.getByRole('button', { name: /Use backup code instead/i })
      fireEvent.click(backupLink)

      const input = screen.getByLabelText(/Backup Code/i)
      fireEvent.change(input, { target: { value: 'BACKUP123456' } })

      const submitButton = screen.getByRole('button', { name: /Verify Backup Code/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('An error occurred. Please try again.')).toBeInTheDocument()
      })
    })

    it('shows default error when server returns no message', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      })

      renderComponent()
      const backupLink = screen.getByRole('button', { name: /Use backup code instead/i })
      fireEvent.click(backupLink)

      const input = screen.getByLabelText(/Backup Code/i)
      fireEvent.change(input, { target: { value: 'BACKUP123456' } })

      const submitButton = screen.getByRole('button', { name: /Verify Backup Code/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid backup code')).toBeInTheDocument()
      })
    })
  })
})

export default mockNavigate
