import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import PasskeySetupPage from '../PasskeySetupPage'

// Mock react-router-dom hooks
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Fingerprint: () => <div data-testid="fingerprint-icon">Fingerprint</div>,
  Smartphone: () => <div data-testid="smartphone-icon">Smartphone</div>,
  Key: () => <div data-testid="key-icon">Key</div>,
  Check: () => <div data-testid="check-icon">Check</div>,
  AlertCircle: () => <div data-testid="alert-icon">AlertCircle</div>,
  Loader2: (props) => <div data-testid="loader-icon" {...props}>Loader2</div>,
  QrCode: () => <div data-testid="qr-icon">QrCode</div>,
  ArrowLeft: () => <div data-testid="arrow-left-icon">ArrowLeft</div>,
  Shield: () => <div data-testid="shield-icon">Shield</div>,
}))

// Mock fetch globally
global.fetch = jest.fn()

// Mock PublicKeyCredential
Object.defineProperty(window, 'PublicKeyCredential', {
  writable: true,
  value: jest.fn(),
})

// Mock navigator.credentials
Object.defineProperty(navigator, 'credentials', {
  writable: true,
  value: {
    create: jest.fn(),
    get: jest.fn(),
  },
})

const mockCredential = {
  id: 'test-credential-id',
  rawId: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer,
  response: {
    clientDataJSON: new Uint8Array([10, 11, 12, 13]).buffer,
    attestationObject: new Uint8Array([20, 21, 22, 23]).buffer,
  },
  type: 'public-key',
}

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <PasskeySetupPage />
    </BrowserRouter>
  )
}

describe('PasskeySetupPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch.mockClear()
    navigator.credentials.create.mockClear()
    window.PublicKeyCredential = jest.fn()
  })

  describe('Initial Rendering', () => {
    it('renders without crashing', () => {
      renderComponent()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('displays the main heading', () => {
      renderComponent()
      expect(screen.getByRole('heading', { name: /Set Up Passkey/i })).toBeInTheDocument()
    })

    it('displays subtitle', () => {
      renderComponent()
      expect(screen.getByText(/Sign in faster and more securely with biometric authentication/i)).toBeInTheDocument()
    })

    it('renders fingerprint icon', () => {
      renderComponent()
      expect(screen.getByTestId('fingerprint-icon')).toBeInTheDocument()
    })

    it('has proper ARIA label', () => {
      renderComponent()
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Passkey setup')
    })

    it('displays back button', () => {
      renderComponent()
      expect(screen.getByRole('button', { name: /Go back/i })).toBeInTheDocument()
    })

    it('shows step 1 initially', () => {
      renderComponent()
      expect(screen.getByText(/Sign in faster and more securely/i)).toBeInTheDocument()
    })
  })

  describe('Browser Support Detection', () => {
    it('checks for WebAuthn support on mount', () => {
      renderComponent()
      expect(window.PublicKeyCredential).toBeDefined()
    })

    it('displays error when browser does not support passkeys', () => {
      delete window.PublicKeyCredential
      renderComponent()

      expect(screen.getByText(/Browser Not Supported/i)).toBeInTheDocument()
      expect(screen.getByText(/Your browser does not support passkeys/i)).toBeInTheDocument()
    })

    it('shows go back button on unsupported browser', () => {
      delete window.PublicKeyCredential
      renderComponent()

      const goBackButton = screen.getByRole('button', { name: /Go Back/i })
      expect(goBackButton).toBeInTheDocument()
    })

    it('navigates back when go back clicked on error screen', () => {
      delete window.PublicKeyCredential
      renderComponent()

      const goBackButton = screen.getByRole('button', { name: /Go Back/i })
      fireEvent.click(goBackButton)

      expect(mockNavigate).toHaveBeenCalledWith(-1)
    })

    it('shows alert icon on unsupported browser', () => {
      delete window.PublicKeyCredential
      renderComponent()

      expect(screen.getByTestId('alert-icon')).toBeInTheDocument()
    })
  })

  describe('Step 1: Introduction', () => {
    it('displays benefits of passkeys', () => {
      renderComponent()
      expect(screen.getByText(/More Secure/i)).toBeInTheDocument()
      expect(screen.getByText(/Faster Sign-In/i)).toBeInTheDocument()
      expect(screen.getByText(/No Password Needed/i)).toBeInTheDocument()
    })

    it('shows shield icon for security benefit', () => {
      renderComponent()
      const shieldIcons = screen.getAllByTestId('shield-icon')
      expect(shieldIcons.length).toBeGreaterThan(0)
    })

    it('shows fingerprint icon for faster sign-in benefit', () => {
      renderComponent()
      const fingerprintIcons = screen.getAllByTestId('fingerprint-icon')
      expect(fingerprintIcons.length).toBeGreaterThan(0)
    })

    it('shows key icon for no password benefit', () => {
      renderComponent()
      expect(screen.getByTestId('key-icon')).toBeInTheDocument()
    })

    it('displays continue button', () => {
      renderComponent()
      expect(screen.getByRole('button', { name: /Continue/i })).toBeInTheDocument()
    })

    it('navigates to step 2 when continue clicked', () => {
      renderComponent()
      const continueButton = screen.getByRole('button', { name: /Continue/i })

      fireEvent.click(continueButton)

      expect(screen.getByText(/Name Your Device/i)).toBeInTheDocument()
    })

    it('mentions biometric authentication types', () => {
      renderComponent()
      expect(screen.getByText(/Face ID, Touch ID, or Windows Hello/i)).toBeInTheDocument()
    })

    it('explains phishing resistance', () => {
      renderComponent()
      expect(screen.getByText(/resistant to phishing attacks/i)).toBeInTheDocument()
    })
  })

  describe('Step 2: Device Name Input', () => {
    beforeEach(() => {
      renderComponent()
      const continueButton = screen.getByRole('button', { name: /Continue/i })
      fireEvent.click(continueButton)
    })

    it('displays device name input field', () => {
      expect(screen.getByLabelText(/Device Name/i)).toBeInTheDocument()
    })

    it('auto-detects device name on mount', () => {
      const input = screen.getByLabelText(/Device Name/i)
      expect(input.value).toBeTruthy()
    })

    it('accepts custom device name', () => {
      const input = screen.getByLabelText(/Device Name/i)
      fireEvent.change(input, { target: { value: 'My Custom Device' } })

      expect(input.value).toBe('My Custom Device')
    })

    it('displays placeholder text', () => {
      const input = screen.getByLabelText(/Device Name/i)
      expect(input).toHaveAttribute('placeholder', 'e.g. iPhone 14, MacBook Pro')
    })

    it('shows QR code section', () => {
      expect(screen.getByText(/Set Up on Mobile/i)).toBeInTheDocument()
    })

    it('displays QR code image', () => {
      const qrImage = screen.getByAltText(/QR Code for mobile setup/i)
      expect(qrImage).toBeInTheDocument()
    })

    it('shows QR icon', () => {
      expect(screen.getByTestId('qr-icon')).toBeInTheDocument()
    })

    it('displays smartphone icon', () => {
      expect(screen.getByTestId('smartphone-icon')).toBeInTheDocument()
    })

    it('shows back button', () => {
      expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument()
    })

    it('navigates back to step 1 when back clicked', () => {
      const backButton = screen.getByRole('button', { name: /Back/i })
      fireEvent.click(backButton)

      expect(screen.getByText(/Sign in faster and more securely/i)).toBeInTheDocument()
    })

    it('displays create passkey button', () => {
      expect(screen.getByRole('button', { name: /Create Passkey/i })).toBeInTheDocument()
    })

    it('create button is disabled when device name is empty', () => {
      const input = screen.getByLabelText(/Device Name/i)
      fireEvent.change(input, { target: { value: '' } })

      const createButton = screen.getByRole('button', { name: /Create Passkey/i })
      expect(createButton).toBeDisabled()
    })

    it('create button is enabled when device name is provided', () => {
      const input = screen.getByLabelText(/Device Name/i)
      fireEvent.change(input, { target: { value: 'My Device' } })

      const createButton = screen.getByRole('button', { name: /Create Passkey/i })
      expect(createButton).not.toBeDisabled()
    })

    it('disables input during passkey creation', async () => {
      global.fetch.mockImplementationOnce(() => new Promise(() => {}))

      const input = screen.getByLabelText(/Device Name/i)
      fireEvent.change(input, { target: { value: 'My Device' } })

      const createButton = screen.getByRole('button', { name: /Create Passkey/i })
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(input).toBeDisabled()
      })
    })
  })

  describe('Passkey Creation Process', () => {
    beforeEach(() => {
      renderComponent()
      const continueButton = screen.getByRole('button', { name: /Continue/i })
      fireEvent.click(continueButton)
    })

    it('validates device name before creation', () => {
      const input = screen.getByLabelText(/Device Name/i)
      fireEvent.change(input, { target: { value: '' } })

      const createButton = screen.getByRole('button', { name: /Create Passkey/i })
      fireEvent.click(createButton)

      expect(screen.getByText(/Please enter a device name/i)).toBeInTheDocument()
    })

    it('fetches challenge from server', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          challenge: 'test-challenge',
          user: {
            id: 'user-123',
            email: 'test@example.com',
            username: 'testuser',
            displayName: 'Test User',
          },
        }),
      })

      navigator.credentials.create.mockResolvedValueOnce(mockCredential)

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ device: { name: 'Test Device' } }),
      })

      const input = screen.getByLabelText(/Device Name/i)
      fireEvent.change(input, { target: { value: 'Test Device' } })

      const createButton = screen.getByRole('button', { name: /Create Passkey/i })
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/passkey/challenge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })
      })
    })

    it('calls WebAuthn create with correct options', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          challenge: 'test-challenge',
          user: {
            id: 'user-123',
            email: 'test@example.com',
            username: 'testuser',
          },
        }),
      })

      navigator.credentials.create.mockResolvedValueOnce(mockCredential)

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ device: { name: 'Test Device' } }),
      })

      const input = screen.getByLabelText(/Device Name/i)
      fireEvent.change(input, { target: { value: 'Test Device' } })

      const createButton = screen.getByRole('button', { name: /Create Passkey/i })
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(navigator.credentials.create).toHaveBeenCalledWith({
          publicKey: expect.objectContaining({
            challenge: expect.any(Uint8Array),
            rp: expect.objectContaining({
              name: 'Cryb',
            }),
            user: expect.objectContaining({
              id: expect.any(Uint8Array),
            }),
            authenticatorSelection: expect.objectContaining({
              authenticatorAttachment: 'platform',
              requireResidentKey: true,
              userVerification: 'required',
            }),
          }),
        })
      })
    })

    it('sends credential to server for verification', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          challenge: 'test-challenge',
          user: {
            id: 'user-123',
            email: 'test@example.com',
            username: 'testuser',
          },
        }),
      })

      navigator.credentials.create.mockResolvedValueOnce(mockCredential)

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ device: { name: 'Test Device' } }),
      })

      const input = screen.getByLabelText(/Device Name/i)
      fireEvent.change(input, { target: { value: 'Test Device' } })

      const createButton = screen.getByRole('button', { name: /Create Passkey/i })
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/passkey/verify',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: expect.stringContaining('Test Device'),
          })
        )
      })
    })

    it('shows loading state during creation', async () => {
      global.fetch.mockImplementationOnce(() => new Promise(() => {}))

      const input = screen.getByLabelText(/Device Name/i)
      fireEvent.change(input, { target: { value: 'Test Device' } })

      const createButton = screen.getByRole('button', { name: /Create Passkey/i })
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByText(/Setting up.../i)).toBeInTheDocument()
      })
    })

    it('displays loader icon during creation', async () => {
      global.fetch.mockImplementationOnce(() => new Promise(() => {}))

      const input = screen.getByLabelText(/Device Name/i)
      fireEvent.change(input, { target: { value: 'Test Device' } })

      const createButton = screen.getByRole('button', { name: /Create Passkey/i })
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByTestId('loader-icon')).toBeInTheDocument()
      })
    })

    it('progresses to step 3 on successful creation', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          challenge: 'test-challenge',
          user: {
            id: 'user-123',
            email: 'test@example.com',
            username: 'testuser',
          },
        }),
      })

      navigator.credentials.create.mockResolvedValueOnce(mockCredential)

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ device: { name: 'Test Device' } }),
      })

      const input = screen.getByLabelText(/Device Name/i)
      fireEvent.change(input, { target: { value: 'Test Device' } })

      const createButton = screen.getByRole('button', { name: /Create Passkey/i })
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByText(/Passkey Created!/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      renderComponent()
      const continueButton = screen.getByRole('button', { name: /Continue/i })
      fireEvent.click(continueButton)
    })

    it('handles challenge fetch error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      const input = screen.getByLabelText(/Device Name/i)
      fireEvent.change(input, { target: { value: 'Test Device' } })

      const createButton = screen.getByRole('button', { name: /Create Passkey/i })
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByText(/Failed to set up passkey/i)).toBeInTheDocument()
      })
    })

    it('handles user cancellation error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          challenge: 'test-challenge',
          user: { id: 'user-123', email: 'test@example.com', username: 'testuser' },
        }),
      })

      const error = new Error('User cancelled')
      error.name = 'NotAllowedError'
      navigator.credentials.create.mockRejectedValueOnce(error)

      const input = screen.getByLabelText(/Device Name/i)
      fireEvent.change(input, { target: { value: 'Test Device' } })

      const createButton = screen.getByRole('button', { name: /Create Passkey/i })
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByText(/Passkey creation was cancelled/i)).toBeInTheDocument()
      })
    })

    it('handles duplicate passkey error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          challenge: 'test-challenge',
          user: { id: 'user-123', email: 'test@example.com', username: 'testuser' },
        }),
      })

      const error = new Error('Passkey already exists')
      error.name = 'InvalidStateError'
      navigator.credentials.create.mockRejectedValueOnce(error)

      const input = screen.getByLabelText(/Device Name/i)
      fireEvent.change(input, { target: { value: 'Test Device' } })

      const createButton = screen.getByRole('button', { name: /Create Passkey/i })
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByText(/A passkey already exists/i)).toBeInTheDocument()
      })
    })

    it('handles verification failure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          challenge: 'test-challenge',
          user: { id: 'user-123', email: 'test@example.com', username: 'testuser' },
        }),
      })

      navigator.credentials.create.mockResolvedValueOnce(mockCredential)

      global.fetch.mockResolvedValueOnce({
        ok: false,
      })

      const input = screen.getByLabelText(/Device Name/i)
      fireEvent.change(input, { target: { value: 'Test Device' } })

      const createButton = screen.getByRole('button', { name: /Create Passkey/i })
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByText(/Failed to verify passkey/i)).toBeInTheDocument()
      })
    })

    it('shows alert icon with errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      const input = screen.getByLabelText(/Device Name/i)
      fireEvent.change(input, { target: { value: 'Test Device' } })

      const createButton = screen.getByRole('button', { name: /Create Passkey/i })
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByTestId('alert-icon')).toBeInTheDocument()
      })
    })

    it('clears error when user retries', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      const input = screen.getByLabelText(/Device Name/i)
      fireEvent.change(input, { target: { value: 'Test Device' } })

      const createButton = screen.getByRole('button', { name: /Create Passkey/i })
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByText(/Failed to set up passkey/i)).toBeInTheDocument()
      })

      // Retry
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          challenge: 'test-challenge',
          user: { id: 'user-123', email: 'test@example.com', username: 'testuser' },
        }),
      })

      navigator.credentials.create.mockResolvedValueOnce(mockCredential)

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ device: { name: 'Test Device' } }),
      })

      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.queryByText(/Failed to set up passkey/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Step 3: Success', () => {
    beforeEach(async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          challenge: 'test-challenge',
          user: { id: 'user-123', email: 'test@example.com', username: 'testuser' },
        }),
      })

      navigator.credentials.create.mockResolvedValueOnce(mockCredential)

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ device: { name: 'My iPhone' } }),
      })

      renderComponent()
      const continueButton = screen.getByRole('button', { name: /Continue/i })
      fireEvent.click(continueButton)

      const input = screen.getByLabelText(/Device Name/i)
      fireEvent.change(input, { target: { value: 'My iPhone' } })

      const createButton = screen.getByRole('button', { name: /Create Passkey/i })
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByText(/Passkey Created!/i)).toBeInTheDocument()
      })
    })

    it('displays success heading', () => {
      expect(screen.getByText(/Passkey Created!/i)).toBeInTheDocument()
    })

    it('shows check icon', () => {
      expect(screen.getByTestId('check-icon')).toBeInTheDocument()
    })

    it('displays device name in success message', () => {
      expect(screen.getByText(/My iPhone/i)).toBeInTheDocument()
    })

    it('shows what\'s next section', () => {
      expect(screen.getByText(/What's Next\?/i)).toBeInTheDocument()
    })

    it('lists next steps', () => {
      expect(screen.getByText(/You can now sign in using biometric authentication/i)).toBeInTheDocument()
      expect(screen.getByText(/Set up passkeys on your other devices/i)).toBeInTheDocument()
      expect(screen.getByText(/You can manage your passkeys in Security Settings/i)).toBeInTheDocument()
    })

    it('displays manage passkeys button', () => {
      expect(screen.getByRole('button', { name: /Manage Passkeys/i })).toBeInTheDocument()
    })

    it('displays done button', () => {
      expect(screen.getByRole('button', { name: /Done/i })).toBeInTheDocument()
    })

    it('navigates to security settings when manage clicked', () => {
      const manageButton = screen.getByRole('button', { name: /Manage Passkeys/i })
      fireEvent.click(manageButton)

      expect(mockNavigate).toHaveBeenCalledWith('/settings/security')
    })

    it('navigates to home when done clicked', () => {
      const doneButton = screen.getByRole('button', { name: /Done/i })
      fireEvent.click(doneButton)

      expect(mockNavigate).toHaveBeenCalledWith('/home')
    })
  })

  describe('Back Button', () => {
    it('navigates back when clicked', () => {
      renderComponent()
      const backButton = screen.getByRole('button', { name: /Go back/i })

      fireEvent.click(backButton)
      expect(mockNavigate).toHaveBeenCalledWith(-1)
    })

    it('shows arrow left icon', () => {
      renderComponent()
      expect(screen.getByTestId('arrow-left-icon')).toBeInTheDocument()
    })
  })

  describe('Help Link', () => {
    it('displays help link on step 2', () => {
      renderComponent()
      const continueButton = screen.getByRole('button', { name: /Continue/i })
      fireEvent.click(continueButton)

      expect(screen.getByText(/Need help\?/i)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Learn more about passkeys/i })).toBeInTheDocument()
    })

    it('help link points to correct URL', () => {
      renderComponent()
      const continueButton = screen.getByRole('button', { name: /Continue/i })
      fireEvent.click(continueButton)

      const helpLink = screen.getByRole('link', { name: /Learn more about passkeys/i })
      expect(helpLink).toHaveAttribute('href', '/help')
    })
  })

  describe('QR Code Generation', () => {
    it('generates QR code on mount', () => {
      renderComponent()
      const continueButton = screen.getByRole('button', { name: /Continue/i })
      fireEvent.click(continueButton)

      const qrImage = screen.getByAltText(/QR Code for mobile setup/i)
      expect(qrImage).toBeInTheDocument()
      expect(qrImage).toHaveAttribute('src')
    })

    it('displays QR code instructions', () => {
      renderComponent()
      const continueButton = screen.getByRole('button', { name: /Continue/i })
      fireEvent.click(continueButton)

      expect(screen.getByText(/Scan this QR code with your phone/i)).toBeInTheDocument()
    })
  })

  describe('Device Detection', () => {
    it('detects iPhone', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true,
      })

      renderComponent()
      const continueButton = screen.getByRole('button', { name: /Continue/i })
      fireEvent.click(continueButton)

      const input = screen.getByLabelText(/Device Name/i)
      expect(input.value).toBe('iPhone')
    })

    it('detects Android', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10)',
        configurable: true,
      })

      renderComponent()
      const continueButton = screen.getByRole('button', { name: /Continue/i })
      fireEvent.click(continueButton)

      const input = screen.getByLabelText(/Device Name/i)
      expect(input.value).toBe('Android Device')
    })

    it('detects Mac', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        configurable: true,
      })

      renderComponent()
      const continueButton = screen.getByRole('button', { name: /Continue/i })
      fireEvent.click(continueButton)

      const input = screen.getByLabelText(/Device Name/i)
      expect(input.value).toBe('Mac')
    })

    it('detects Windows', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true,
      })

      renderComponent()
      const continueButton = screen.getByRole('button', { name: /Continue/i })
      fireEvent.click(continueButton)

      const input = screen.getByLabelText(/Device Name/i)
      expect(input.value).toBe('Windows PC')
    })
  })

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      renderComponent()
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('Set Up Passkey')
    })

    it('all buttons have accessible names', () => {
      renderComponent()
      expect(screen.getByRole('button', { name: /Go back/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Continue/i })).toBeInTheDocument()
    })

    it('input has accessible label', () => {
      renderComponent()
      const continueButton = screen.getByRole('button', { name: /Continue/i })
      fireEvent.click(continueButton)

      const input = screen.getByLabelText(/Device Name/i)
      expect(input).toHaveAccessibleName(/Device Name/i)
    })

    it('QR code has alt text', () => {
      renderComponent()
      const continueButton = screen.getByRole('button', { name: /Continue/i })
      fireEvent.click(continueButton)

      const qrImage = screen.getByAltText(/QR Code for mobile setup/i)
      expect(qrImage).toBeInTheDocument()
    })
  })

  describe('UI States', () => {
    it('disables buttons during loading', async () => {
      global.fetch.mockImplementationOnce(() => new Promise(() => {}))

      renderComponent()
      const continueButton = screen.getByRole('button', { name: /Continue/i })
      fireEvent.click(continueButton)

      const input = screen.getByLabelText(/Device Name/i)
      fireEvent.change(input, { target: { value: 'Test Device' } })

      const createButton = screen.getByRole('button', { name: /Create Passkey/i })
      fireEvent.click(createButton)

      await waitFor(() => {
        const backButton = screen.getByRole('button', { name: /Back/i })
        expect(backButton).toBeDisabled()
        expect(createButton).toBeDisabled()
      })
    })

    it('shows cursor-not-allowed on disabled button', () => {
      renderComponent()
      const continueButton = screen.getByRole('button', { name: /Continue/i })
      fireEvent.click(continueButton)

      const input = screen.getByLabelText(/Device Name/i)
      fireEvent.change(input, { target: { value: '' } })

      const createButton = screen.getByRole('button', { name: /Create Passkey/i })
      expect(createButton).toHaveClass('disabled:cursor-not-allowed')
    })
  })
})

export default mockNavigate
