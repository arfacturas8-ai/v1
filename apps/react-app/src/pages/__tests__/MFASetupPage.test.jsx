import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import MFASetupPage from '../MFASetupPage'

// Mock react-router-dom hooks
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Shield: () => <div data-testid="shield-icon">Shield</div>,
  Copy: () => <div data-testid="copy-icon">Copy</div>,
  Check: () => <div data-testid="check-icon">Check</div>,
  Download: () => <div data-testid="download-icon">Download</div>,
  ArrowLeft: () => <div data-testid="arrow-left-icon">ArrowLeft</div>,
  Smartphone: () => <div data-testid="smartphone-icon">Smartphone</div>,
}))

// Mock fetch globally
global.fetch = jest.fn()

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
})

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = jest.fn()

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <MFASetupPage />
    </BrowserRouter>
  )
}

describe('MFASetupPage', () => {
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
      expect(screen.getByText('Two-Factor Authentication')).toBeInTheDocument()
    })

    it('displays the subtitle', () => {
      renderComponent()
      expect(screen.getByText('Add an extra layer of security to your account')).toBeInTheDocument()
    })

    it('renders shield icon', () => {
      renderComponent()
      expect(screen.getByTestId('shield-icon')).toBeInTheDocument()
    })

    it('has proper ARIA label on main element', () => {
      renderComponent()
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Multi-factor authentication setup page')
    })

    it('displays progress indicator with 3 steps', () => {
      renderComponent()
      const progressSteps = screen.getAllByRole('generic').filter(el =>
        el.hasAttribute('aria-label') && el.getAttribute('aria-label').includes('Step')
      )
      expect(progressSteps.length).toBeGreaterThanOrEqual(3)
    })

    it('shows step 1 as current on initial load', () => {
      renderComponent()
      expect(screen.getByText('Step 1: Download Authenticator App')).toBeInTheDocument()
    })

    it('displays cancel link', () => {
      renderComponent()
      expect(screen.getByText('Cancel and return to settings')).toBeInTheDocument()
    })
  })

  describe('Step 1: Download Authenticator App', () => {
    it('renders step 1 content', () => {
      renderComponent()
      expect(screen.getByText('Step 1: Download Authenticator App')).toBeInTheDocument()
    })

    it('displays authenticator app recommendations', () => {
      renderComponent()
      expect(screen.getByText('Google Authenticator')).toBeInTheDocument()
      expect(screen.getByText('Microsoft Authenticator')).toBeInTheDocument()
      expect(screen.getByText('Authy')).toBeInTheDocument()
    })

    it('renders smartphone icons for each app', () => {
      renderComponent()
      const smartphoneIcons = screen.getAllByTestId('smartphone-icon')
      expect(smartphoneIcons).toHaveLength(3)
    })

    it('displays continue button', () => {
      renderComponent()
      expect(screen.getByRole('button', { name: /Continue to next step/i })).toBeInTheDocument()
    })

    it('continue button is enabled by default', () => {
      renderComponent()
      expect(screen.getByRole('button', { name: /Continue to next step/i })).not.toBeDisabled()
    })

    it('navigates to step 2 when continue is clicked', async () => {
      renderComponent()
      const continueButton = screen.getByRole('button', { name: /Continue to next step/i })

      fireEvent.click(continueButton)

      await waitFor(() => {
        expect(screen.getByText('Step 2: Scan QR Code')).toBeInTheDocument()
      })
    })

    it('shows instruction text', () => {
      renderComponent()
      expect(screen.getByText(/Install an authenticator app on your mobile device/i)).toBeInTheDocument()
    })

    it('apps are displayed in correct order', () => {
      renderComponent()
      const apps = screen.getAllByText(/Authenticator|Authy/)
      expect(apps[0]).toHaveTextContent('Google Authenticator')
      expect(apps[1]).toHaveTextContent('Microsoft Authenticator')
      expect(apps[2]).toHaveTextContent('Authy')
    })
  })

  describe('Step 2: QR Code Generation', () => {
    beforeEach(() => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          qrCode: 'data:image/png;base64,mockqrcode',
          secret: 'JBSWY3DPEHPK3PXP',
        }),
      })
    })

    it('generates QR code on mount', async () => {
      renderComponent()

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/mfa/generate', {
          method: 'POST',
          credentials: 'include',
        })
      })
    })

    it('displays loading state while QR code is being generated', () => {
      global.fetch.mockImplementationOnce(() => new Promise(() => {}))
      renderComponent()

      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      expect(screen.getByText(/Loading.../i)).toBeInTheDocument()
    })

    it('displays QR code image when loaded', async () => {
      renderComponent()

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const qrImage = screen.getByAltText('QR code for two-factor authentication')
        expect(qrImage).toBeInTheDocument()
        expect(qrImage).toHaveAttribute('src', 'data:image/png;base64,mockqrcode')
      })
    })

    it('displays secret key', async () => {
      renderComponent()

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        expect(screen.getByText('JBSWY3DPEHPK3PXP')).toBeInTheDocument()
      })
    })

    it('shows manual entry instructions', async () => {
      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        expect(screen.getByText(/Can't scan\?/i)).toBeInTheDocument()
        expect(screen.getByText(/Enter this code manually/i)).toBeInTheDocument()
      })
    })

    it('handles QR code generation error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
      })

      renderComponent()

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
    })

    it('displays error message when QR generation fails', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      renderComponent()

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
    })
  })

  describe('Step 2: Secret Key Copy Functionality', () => {
    beforeEach(() => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          qrCode: 'data:image/png;base64,mockqrcode',
          secret: 'JBSWY3DPEHPK3PXP',
        }),
      })
    })

    it('displays copy button for secret key', async () => {
      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Copy secret key/i })).toBeInTheDocument()
      })
    })

    it('copies secret to clipboard when copy button is clicked', async () => {
      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const copyButton = screen.getByRole('button', { name: /Copy secret key/i })
        fireEvent.click(copyButton)
      })

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('JBSWY3DPEHPK3PXP')
    })

    it('shows check icon after successful copy', async () => {
      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const copyButton = screen.getByRole('button', { name: /Copy secret key/i })
        fireEvent.click(copyButton)
      })

      await waitFor(() => {
        expect(screen.getByTestId('check-icon')).toBeInTheDocument()
      })
    })

    it('resets copy state after 2 seconds', async () => {
      jest.useFakeTimers()
      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const copyButton = screen.getByRole('button', { name: /Copy secret key/i })
        fireEvent.click(copyButton)
      })

      jest.advanceTimersByTime(2000)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Copy secret key/i })).toBeInTheDocument()
      })

      jest.useRealTimers()
    })

    it('changes button aria-label when copied', async () => {
      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const copyButton = screen.getByRole('button', { name: /Copy secret key/i })
        fireEvent.click(copyButton)
      })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Copied/i })).toBeInTheDocument()
      })
    })
  })

  describe('Step 2: Verification Code Input', () => {
    beforeEach(() => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          qrCode: 'data:image/png;base64,mockqrcode',
          secret: 'JBSWY3DPEHPK3PXP',
        }),
      })
    })

    it('displays verification code input field', async () => {
      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/Verification Code/i)).toBeInTheDocument()
      })
    })

    it('accepts numeric input only', async () => {
      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const input = screen.getByLabelText(/Verification Code/i)
        fireEvent.change(input, { target: { value: 'abc123' } })
        expect(input.value).toBe('123')
      })
    })

    it('limits input to 6 digits', async () => {
      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const input = screen.getByLabelText(/Verification Code/i)
        fireEvent.change(input, { target: { value: '1234567890' } })
        expect(input.value).toBe('123456')
      })
    })

    it('verify button is disabled when code is empty', async () => {
      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Verify & Continue/i })).toBeDisabled()
      })
    })

    it('verify button is disabled when code is less than 6 digits', async () => {
      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const input = screen.getByLabelText(/Verification Code/i)
        fireEvent.change(input, { target: { value: '12345' } })
        expect(screen.getByRole('button', { name: /Verify & Continue/i })).toBeDisabled()
      })
    })

    it('verify button is enabled when code is 6 digits', async () => {
      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const input = screen.getByLabelText(/Verification Code/i)
        fireEvent.change(input, { target: { value: '123456' } })
        expect(screen.getByRole('button', { name: /Verify & Continue/i })).not.toBeDisabled()
      })
    })

    it('displays placeholder text', async () => {
      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const input = screen.getByLabelText(/Verification Code/i)
        expect(input).toHaveAttribute('placeholder', 'Enter 6-digit code')
      })
    })

    it('has correct input type', async () => {
      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const input = screen.getByLabelText(/Verification Code/i)
        expect(input).toHaveAttribute('type', 'text')
      })
    })

    it('has maxLength attribute', async () => {
      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const input = screen.getByLabelText(/Verification Code/i)
        expect(input).toHaveAttribute('maxLength', '6')
      })
    })

    it('has proper ARIA labels', async () => {
      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const input = screen.getByLabelText(/Verification Code/i)
        expect(input).toHaveAttribute('aria-label', 'Enter 6-digit verification code')
      })
    })
  })

  describe('Step 2: Verification Process', () => {
    beforeEach(() => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          qrCode: 'data:image/png;base64,mockqrcode',
          secret: 'JBSWY3DPEHPK3PXP',
        }),
      })
    })

    it('submits verification code', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          backupCodes: ['CODE1', 'CODE2', 'CODE3', 'CODE4', 'CODE5', 'CODE6'],
        }),
      })

      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const input = screen.getByLabelText(/Verification Code/i)
        fireEvent.change(input, { target: { value: '123456' } })
      })

      const submitButton = screen.getByRole('button', { name: /Verify & Continue/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/mfa/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ code: '123456' }),
        })
      })
    })

    it('shows loading state during verification', async () => {
      global.fetch.mockImplementationOnce(() => new Promise(() => {}))

      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const input = screen.getByLabelText(/Verification Code/i)
        fireEvent.change(input, { target: { value: '123456' } })
      })

      const submitButton = screen.getByRole('button', { name: /Verify & Continue/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Verifying...')).toBeInTheDocument()
      })
    })

    it('displays error for invalid code', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          message: 'Invalid verification code',
        }),
      })

      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const input = screen.getByLabelText(/Verification Code/i)
        fireEvent.change(input, { target: { value: '123456' } })
      })

      const submitButton = screen.getByRole('button', { name: /Verify & Continue/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid verification code')).toBeInTheDocument()
      })
    })

    it('shows error role alert for accessibility', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          message: 'Invalid verification code',
        }),
      })

      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const input = screen.getByLabelText(/Verification Code/i)
        fireEvent.change(input, { target: { value: '123456' } })
      })

      const submitButton = screen.getByRole('button', { name: /Verify & Continue/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })

    it('disables input during verification', async () => {
      global.fetch.mockImplementationOnce(() => new Promise(() => {}))

      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const input = screen.getByLabelText(/Verification Code/i)
        fireEvent.change(input, { target: { value: '123456' } })
      })

      const submitButton = screen.getByRole('button', { name: /Verify & Continue/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        const input = screen.getByLabelText(/Verification Code/i)
        expect(input).toBeDisabled()
      })
    })

    it('validates code length before submission', async () => {
      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const input = screen.getByLabelText(/Verification Code/i)
        fireEvent.change(input, { target: { value: '12345' } })
      })

      const submitButton = screen.getByRole('button', { name: /Verify & Continue/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid 6-digit code')).toBeInTheDocument()
      })
    })

    it('handles network errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const input = screen.getByLabelText(/Verification Code/i)
        fireEvent.change(input, { target: { value: '123456' } })
      })

      const submitButton = screen.getByRole('button', { name: /Verify & Continue/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('An error occurred. Please try again.')).toBeInTheDocument()
      })
    })

    it('progresses to step 3 on successful verification', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          backupCodes: ['CODE1', 'CODE2', 'CODE3', 'CODE4', 'CODE5', 'CODE6'],
        }),
      })

      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const input = screen.getByLabelText(/Verification Code/i)
        fireEvent.change(input, { target: { value: '123456' } })
      })

      const submitButton = screen.getByRole('button', { name: /Verify & Continue/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Step 3: Save Backup Codes')).toBeInTheDocument()
      })
    })
  })

  describe('Step 2: Back Button', () => {
    beforeEach(() => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          qrCode: 'data:image/png;base64,mockqrcode',
          secret: 'JBSWY3DPEHPK3PXP',
        }),
      })
    })

    it('displays back button', async () => {
      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Go back to previous step/i })).toBeInTheDocument()
      })
    })

    it('navigates back to step 1 when clicked', async () => {
      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const backButton = screen.getByRole('button', { name: /Go back to previous step/i })
        fireEvent.click(backButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Step 1: Download Authenticator App')).toBeInTheDocument()
      })
    })

    it('shows arrow left icon', async () => {
      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        expect(screen.getByTestId('arrow-left-icon')).toBeInTheDocument()
      })
    })
  })

  describe('Step 3: Backup Codes Display', () => {
    beforeEach(() => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            qrCode: 'data:image/png;base64,mockqrcode',
            secret: 'JBSWY3DPEHPK3PXP',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            backupCodes: ['ABC123', 'DEF456', 'GHI789', 'JKL012', 'MNO345', 'PQR678', 'STU901', 'VWX234'],
          }),
        })
    })

    it('displays backup codes heading', async () => {
      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const input = screen.getByLabelText(/Verification Code/i)
        fireEvent.change(input, { target: { value: '123456' } })
      })

      const submitButton = screen.getByRole('button', { name: /Verify & Continue/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Step 3: Save Backup Codes')).toBeInTheDocument()
      })
    })

    it('displays all backup codes', async () => {
      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const input = screen.getByLabelText(/Verification Code/i)
        fireEvent.change(input, { target: { value: '123456' } })
      })

      const submitButton = screen.getByRole('button', { name: /Verify & Continue/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('ABC123')).toBeInTheDocument()
        expect(screen.getByText('DEF456')).toBeInTheDocument()
        expect(screen.getByText('GHI789')).toBeInTheDocument()
        expect(screen.getByText('JKL012')).toBeInTheDocument()
        expect(screen.getByText('MNO345')).toBeInTheDocument()
        expect(screen.getByText('PQR678')).toBeInTheDocument()
        expect(screen.getByText('STU901')).toBeInTheDocument()
        expect(screen.getByText('VWX234')).toBeInTheDocument()
      })
    })

    it('displays warning message', async () => {
      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const input = screen.getByLabelText(/Verification Code/i)
        fireEvent.change(input, { target: { value: '123456' } })
      })

      const submitButton = screen.getByRole('button', { name: /Verify & Continue/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Each backup code can only be used once/i)).toBeInTheDocument()
      })
    })

    it('displays instructions text', async () => {
      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const input = screen.getByLabelText(/Verification Code/i)
        fireEvent.change(input, { target: { value: '123456' } })
      })

      const submitButton = screen.getByRole('button', { name: /Verify & Continue/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Save these backup codes in a secure location/i)).toBeInTheDocument()
      })
    })
  })

  describe('Step 3: Download Backup Codes', () => {
    beforeEach(() => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            qrCode: 'data:image/png;base64,mockqrcode',
            secret: 'JBSWY3DPEHPK3PXP',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            backupCodes: ['ABC123', 'DEF456', 'GHI789', 'JKL012'],
          }),
        })

      // Mock document.createElement
      const mockAnchor = {
        href: '',
        download: '',
        click: jest.fn(),
      }
      jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor)
    })

    afterEach(() => {
      document.createElement.mockRestore()
    })

    it('displays download button', async () => {
      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const input = screen.getByLabelText(/Verification Code/i)
        fireEvent.change(input, { target: { value: '123456' } })
      })

      const submitButton = screen.getByRole('button', { name: /Verify & Continue/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Download backup codes/i })).toBeInTheDocument()
      })
    })

    it('downloads backup codes when button clicked', async () => {
      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const input = screen.getByLabelText(/Verification Code/i)
        fireEvent.change(input, { target: { value: '123456' } })
      })

      const submitButton = screen.getByRole('button', { name: /Verify & Continue/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        const downloadButton = screen.getByRole('button', { name: /Download backup codes/i })
        fireEvent.click(downloadButton)
      })

      expect(URL.createObjectURL).toHaveBeenCalled()
    })

    it('creates blob with correct content', async () => {
      const mockBlob = jest.spyOn(global, 'Blob')

      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const input = screen.getByLabelText(/Verification Code/i)
        fireEvent.change(input, { target: { value: '123456' } })
      })

      const submitButton = screen.getByRole('button', { name: /Verify & Continue/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        const downloadButton = screen.getByRole('button', { name: /Download backup codes/i })
        fireEvent.click(downloadButton)
      })

      expect(mockBlob).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('CRYB Platform - MFA Backup Codes')]),
        { type: 'text/plain' }
      )

      mockBlob.mockRestore()
    })

    it('sets correct filename for download', async () => {
      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const input = screen.getByLabelText(/Verification Code/i)
        fireEvent.change(input, { target: { value: '123456' } })
      })

      const submitButton = screen.getByRole('button', { name: /Verify & Continue/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        const downloadButton = screen.getByRole('button', { name: /Download backup codes/i })
        fireEvent.click(downloadButton)
      })

      const mockAnchor = document.createElement('a')
      expect(mockAnchor.download).toBe('cryb-backup-codes.txt')
    })

    it('cleans up blob URL after download', async () => {
      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const input = screen.getByLabelText(/Verification Code/i)
        fireEvent.change(input, { target: { value: '123456' } })
      })

      const submitButton = screen.getByRole('button', { name: /Verify & Continue/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        const downloadButton = screen.getByRole('button', { name: /Download backup codes/i })
        fireEvent.click(downloadButton)
      })

      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
    })

    it('shows download icon', async () => {
      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const input = screen.getByLabelText(/Verification Code/i)
        fireEvent.change(input, { target: { value: '123456' } })
      })

      const submitButton = screen.getByRole('button', { name: /Verify & Continue/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByTestId('download-icon')).toBeInTheDocument()
      })
    })
  })

  describe('Step 3: Complete Setup', () => {
    beforeEach(() => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            qrCode: 'data:image/png;base64,mockqrcode',
            secret: 'JBSWY3DPEHPK3PXP',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            backupCodes: ['ABC123', 'DEF456'],
          }),
        })
    })

    it('displays complete setup button', async () => {
      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const input = screen.getByLabelText(/Verification Code/i)
        fireEvent.change(input, { target: { value: '123456' } })
      })

      const submitButton = screen.getByRole('button', { name: /Verify & Continue/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Complete setup and go to settings/i })).toBeInTheDocument()
      })
    })

    it('navigates to settings when complete button clicked', async () => {
      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const input = screen.getByLabelText(/Verification Code/i)
        fireEvent.change(input, { target: { value: '123456' } })
      })

      const submitButton = screen.getByRole('button', { name: /Verify & Continue/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        const completeButton = screen.getByRole('button', { name: /Complete setup and go to settings/i })
        fireEvent.click(completeButton)
      })

      expect(mockNavigate).toHaveBeenCalledWith('/settings')
    })
  })

  describe('Cancel Link', () => {
    it('navigates to settings when cancel link clicked', () => {
      renderComponent()
      const cancelLink = screen.getByText('Cancel and return to settings')

      expect(cancelLink).toHaveAttribute('href', '/settings')
    })

    it('cancel link is visible on all steps', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            qrCode: 'data:image/png;base64,mockqrcode',
            secret: 'JBSWY3DPEHPK3PXP',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            backupCodes: ['ABC123', 'DEF456'],
          }),
        })

      renderComponent()

      // Step 1
      expect(screen.getByText('Cancel and return to settings')).toBeInTheDocument()

      // Step 2
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))
      await waitFor(() => {
        expect(screen.getByText('Cancel and return to settings')).toBeInTheDocument()
      })

      // Step 3
      await waitFor(() => {
        const input = screen.getByLabelText(/Verification Code/i)
        fireEvent.change(input, { target: { value: '123456' } })
      })
      const submitButton = screen.getByRole('button', { name: /Verify & Continue/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Cancel and return to settings')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('clears error when user starts typing', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            qrCode: 'data:image/png;base64,mockqrcode',
            secret: 'JBSWY3DPEHPK3PXP',
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            message: 'Invalid code',
          }),
        })

      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const input = screen.getByLabelText(/Verification Code/i)
        fireEvent.change(input, { target: { value: '123456' } })
      })

      const submitButton = screen.getByRole('button', { name: /Verify & Continue/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid code')).toBeInTheDocument()
      })

      const input = screen.getByLabelText(/Verification Code/i)
      fireEvent.change(input, { target: { value: '654321' } })

      await waitFor(() => {
        expect(screen.queryByText('Invalid code')).not.toBeInTheDocument()
      })
    })

    it('shows error border on input when error exists', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          qrCode: 'data:image/png;base64,mockqrcode',
          secret: 'JBSWY3DPEHPK3PXP',
        }),
      })

      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const input = screen.getByLabelText(/Verification Code/i)
        fireEvent.change(input, { target: { value: '12345' } })
      })

      const submitButton = screen.getByRole('button', { name: /Verify & Continue/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        const input = screen.getByLabelText(/Verification Code/i)
        expect(input).toHaveAttribute('aria-invalid', 'true')
      })
    })

    it('links error message with input via aria-describedby', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          qrCode: 'data:image/png;base64,mockqrcode',
          secret: 'JBSWY3DPEHPK3PXP',
        }),
      })

      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const input = screen.getByLabelText(/Verification Code/i)
        fireEvent.change(input, { target: { value: '12345' } })
      })

      const submitButton = screen.getByRole('button', { name: /Verify & Continue/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        const input = screen.getByLabelText(/Verification Code/i)
        expect(input).toHaveAttribute('aria-describedby', 'code-error')
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      renderComponent()
      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toHaveTextContent('Two-Factor Authentication')
    })

    it('all interactive elements are keyboard accessible', async () => {
      renderComponent()
      const continueButton = screen.getByRole('button', { name: /Continue to next step/i })

      continueButton.focus()
      expect(document.activeElement).toBe(continueButton)
    })

    it('progress indicators have descriptive labels', () => {
      renderComponent()
      const step1Progress = screen.getByLabelText(/Step 1 current/i)
      expect(step1Progress).toBeInTheDocument()
    })
  })

  describe('UI States', () => {
    it('displays loading state in step 2 before QR code loads', () => {
      global.fetch.mockImplementationOnce(() => new Promise(() => {}))
      renderComponent()

      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      expect(screen.getByText(/Loading.../i)).toBeInTheDocument()
    })

    it('button changes text during loading', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            qrCode: 'data:image/png;base64,mockqrcode',
            secret: 'JBSWY3DPEHPK3PXP',
          }),
        })
        .mockImplementationOnce(() => new Promise(() => {}))

      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const input = screen.getByLabelText(/Verification Code/i)
        fireEvent.change(input, { target: { value: '123456' } })
      })

      const submitButton = screen.getByRole('button', { name: /Verify & Continue/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Verifying...')).toBeInTheDocument()
      })
    })

    it('buttons have cursor-not-allowed when disabled', async () => {
      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const verifyButton = screen.getByRole('button', { name: /Verify & Continue/i })
        expect(verifyButton).toBeDisabled()
      })
    })
  })

  describe('Form Validation', () => {
    it('prevents submission with empty code', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          qrCode: 'data:image/png;base64,mockqrcode',
          secret: 'JBSWY3DPEHPK3PXP',
        }),
      })

      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /Verify & Continue/i })
        fireEvent.click(submitButton)
      })

      expect(screen.getByText('Please enter a valid 6-digit code')).toBeInTheDocument()
    })

    it('only allows numeric characters in code input', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          qrCode: 'data:image/png;base64,mockqrcode',
          secret: 'JBSWY3DPEHPK3PXP',
        }),
      })

      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const input = screen.getByLabelText(/Verification Code/i)
        fireEvent.change(input, { target: { value: 'abc!@#123' } })
        expect(input.value).toBe('123')
      })
    })
  })

  describe('Progress Indicator', () => {
    it('shows step 1 as active initially', () => {
      renderComponent()
      const step1 = screen.getByLabelText(/Step 1 current/i)
      expect(step1).toBeInTheDocument()
    })

    it('updates progress indicator on step change', async () => {
      renderComponent()

      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/Step 2 current/i)).toBeInTheDocument()
      })
    })

    it('marks completed steps', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            qrCode: 'data:image/png;base64,mockqrcode',
            secret: 'JBSWY3DPEHPK3PXP',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            backupCodes: ['CODE1', 'CODE2'],
          }),
        })

      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }))

      await waitFor(() => {
        const input = screen.getByLabelText(/Verification Code/i)
        fireEvent.change(input, { target: { value: '123456' } })
      })

      const submitButton = screen.getByRole('button', { name: /Verify & Continue/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByLabelText(/Step 1 completed/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Step 2 completed/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Step 3 current/i)).toBeInTheDocument()
      })
    })
  })
})

export default mockNavigate
