import { render, screen, waitFor, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import OAuthCallbackPage from '../OAuthCallbackPage'

const mockNavigate = jest.fn()
const mockSearchParams = new URLSearchParams()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams],
}))

jest.mock('lucide-react', () => ({
  CheckCircle: () => <div data-testid="check-circle-icon">CheckCircle</div>,
  XCircle: () => <div data-testid="x-circle-icon">XCircle</div>,
  Loader: () => <div data-testid="loader-icon">Loader</div>,
}))

const renderPage = () => {
  return render(
    <BrowserRouter>
      <OAuthCallbackPage />
    </BrowserRouter>
  )
}

describe('OAuthCallbackPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSearchParams.delete('code')
    mockSearchParams.delete('state')
    mockSearchParams.delete('error')
    mockSearchParams.delete('provider')
    global.fetch = jest.fn()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Initial Rendering', () => {
    it('renders without crashing', () => {
      renderPage()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('has proper accessibility attributes', () => {
      renderPage()
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'OAuth callback page')
    })

    it('displays processing state initially', () => {
      renderPage()
      expect(screen.getByText('Authenticating...')).toBeInTheDocument()
      expect(screen.getByText('Completing authentication...')).toBeInTheDocument()
    })

    it('shows loader icon during processing', () => {
      renderPage()
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument()
    })

    it('displays processing animation dots', () => {
      renderPage()
      expect(screen.getByText('Please do not close this window')).toBeInTheDocument()
    })

    it('applies correct gradient background for processing state', () => {
      renderPage()
      const main = screen.getByRole('main')
      expect(main).toHaveStyle({
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      })
    })

    it('renders with correct container styling', () => {
      renderPage()
      const main = screen.getByRole('main')
      expect(main).toHaveStyle({
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      })
    })
  })

  describe('Error Parameter Handling', () => {
    it('displays error when error parameter is present', async () => {
      mockSearchParams.set('error', 'access_denied')
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Authentication Failed')).toBeInTheDocument()
        expect(screen.getByText(/Authentication failed: access_denied/)).toBeInTheDocument()
      })
    })

    it('shows error icon for error state', async () => {
      mockSearchParams.set('error', 'server_error')
      renderPage()

      await waitFor(() => {
        expect(screen.getByTestId('x-circle-icon')).toBeInTheDocument()
      })
    })

    it('navigates to login after 3 seconds on error', async () => {
      mockSearchParams.set('error', 'invalid_request')
      renderPage()

      act(() => {
        jest.advanceTimersByTime(3000)
      })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login')
      })
    })

    it('displays return to login button on error', async () => {
      mockSearchParams.set('error', 'unauthorized')
      renderPage()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Return to login/i })).toBeInTheDocument()
      })
    })

    it('applies error gradient background', async () => {
      mockSearchParams.set('error', 'access_denied')
      renderPage()

      await waitFor(() => {
        const main = screen.getByRole('main')
        expect(main).toHaveStyle({
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
        })
      })
    })

    it('handles manual return to login button click', async () => {
      const user = userEvent.setup({ delay: null })
      mockSearchParams.set('error', 'access_denied')
      renderPage()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Return to login/i })).toBeInTheDocument()
      })

      const button = screen.getByRole('button', { name: /Return to login/i })
      await user.click(button)

      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })

    it('displays different error messages for different errors', async () => {
      const errors = [
        'access_denied',
        'invalid_scope',
        'server_error',
        'temporarily_unavailable'
      ]

      for (const error of errors) {
        mockSearchParams.delete('error')
        mockSearchParams.set('error', error)
        const { unmount } = renderPage()

        await waitFor(() => {
          expect(screen.getByText(`Authentication failed: ${error}`)).toBeInTheDocument()
        })

        unmount()
      }
    })
  })

  describe('Missing Code Handling', () => {
    it('displays error when code is missing', async () => {
      mockSearchParams.delete('code')
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Authentication Failed')).toBeInTheDocument()
        expect(screen.getByText('Missing authentication code')).toBeInTheDocument()
      })
    })

    it('navigates to login after 3 seconds when code is missing', async () => {
      mockSearchParams.delete('code')
      renderPage()

      act(() => {
        jest.advanceTimersByTime(3000)
      })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login')
      })
    })

    it('shows error state UI when code is missing', async () => {
      mockSearchParams.delete('code')
      renderPage()

      await waitFor(() => {
        expect(screen.getByTestId('x-circle-icon')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Return to login/i })).toBeInTheDocument()
      })
    })
  })

  describe('Successful OAuth Flow', () => {
    beforeEach(() => {
      mockSearchParams.set('code', 'auth_code_123')
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ isNewUser: false })
      })
    })

    it('calls OAuth callback API with correct parameters', async () => {
      mockSearchParams.set('code', 'auth_code_123')
      mockSearchParams.set('state', 'state_xyz')
      mockSearchParams.set('provider', 'google')

      renderPage()

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/oauth/callback',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              code: 'auth_code_123',
              state: 'state_xyz',
              provider: 'google'
            })
          })
        )
      })
    })

    it('uses default provider when not specified', async () => {
      mockSearchParams.set('code', 'auth_code_123')
      renderPage()

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/oauth/callback',
          expect.objectContaining({
            body: JSON.stringify({
              code: 'auth_code_123',
              state: null,
              provider: 'oauth'
            })
          })
        )
      })
    })

    it('displays success message on successful authentication', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Success!')).toBeInTheDocument()
        expect(screen.getByText('Authentication successful! Redirecting...')).toBeInTheDocument()
      })
    })

    it('shows success icon on successful authentication', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument()
      })
    })

    it('applies success gradient background', async () => {
      renderPage()

      await waitFor(() => {
        const main = screen.getByRole('main')
        expect(main).toHaveStyle({
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
        })
      })
    })

    it('navigates to home for existing users', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Success!')).toBeInTheDocument()
      })

      act(() => {
        jest.advanceTimersByTime(1500)
      })

      expect(mockNavigate).toHaveBeenCalledWith('/home')
    })

    it('navigates to onboarding for new users', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ isNewUser: true })
      })

      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Success!')).toBeInTheDocument()
      })

      act(() => {
        jest.advanceTimersByTime(1500)
      })

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding')
    })

    it('handles successful authentication with all parameters', async () => {
      mockSearchParams.set('code', 'test_code')
      mockSearchParams.set('state', 'test_state')
      mockSearchParams.set('provider', 'github')

      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Success!')).toBeInTheDocument()
      })
    })
  })

  describe('API Error Handling', () => {
    it('displays error message on failed API response', async () => {
      mockSearchParams.set('code', 'auth_code_123')
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Invalid authorization code' })
      })

      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Authentication Failed')).toBeInTheDocument()
        expect(screen.getByText('Invalid authorization code')).toBeInTheDocument()
      })
    })

    it('displays generic error when no message in response', async () => {
      mockSearchParams.set('code', 'auth_code_123')
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: async () => ({})
      })

      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Authentication failed')).toBeInTheDocument()
      })
    })

    it('navigates to login after error from API', async () => {
      mockSearchParams.set('code', 'auth_code_123')
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Token expired' })
      })

      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Token expired')).toBeInTheDocument()
      })

      act(() => {
        jest.advanceTimersByTime(3000)
      })

      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })

    it('handles network errors gracefully', async () => {
      mockSearchParams.set('code', 'auth_code_123')
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

      renderPage()

      await waitFor(() => {
        expect(screen.getByText('An error occurred during authentication')).toBeInTheDocument()
      })
    })

    it('logs errors to console', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      mockSearchParams.set('code', 'auth_code_123')
      global.fetch = jest.fn().mockRejectedValue(new Error('Test error'))

      renderPage()

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'OAuth callback error:',
          expect.any(Error)
        )
      })

      consoleErrorSpy.mockRestore()
    })

    it('handles JSON parsing errors', async () => {
      mockSearchParams.set('code', 'auth_code_123')
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON')
        }
      })

      renderPage()

      await waitFor(() => {
        expect(screen.getByText('An error occurred during authentication')).toBeInTheDocument()
      })
    })
  })

  describe('Provider-Specific Handling', () => {
    beforeEach(() => {
      mockSearchParams.set('code', 'auth_code_123')
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ isNewUser: false })
      })
    })

    it('handles Google OAuth provider', async () => {
      mockSearchParams.set('provider', 'google')
      renderPage()

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/oauth/callback',
          expect.objectContaining({
            body: expect.stringContaining('"provider":"google"')
          })
        )
      })
    })

    it('handles GitHub OAuth provider', async () => {
      mockSearchParams.set('provider', 'github')
      renderPage()

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/oauth/callback',
          expect.objectContaining({
            body: expect.stringContaining('"provider":"github"')
          })
        )
      })
    })

    it('handles Facebook OAuth provider', async () => {
      mockSearchParams.set('provider', 'facebook')
      renderPage()

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/oauth/callback',
          expect.objectContaining({
            body: expect.stringContaining('"provider":"facebook"')
          })
        )
      })
    })

    it('handles Discord OAuth provider', async () => {
      mockSearchParams.set('provider', 'discord')
      renderPage()

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/oauth/callback',
          expect.objectContaining({
            body: expect.stringContaining('"provider":"discord"')
          })
        )
      })
    })
  })

  describe('State Parameter Handling', () => {
    beforeEach(() => {
      mockSearchParams.set('code', 'auth_code_123')
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ isNewUser: false })
      })
    })

    it('includes state parameter when present', async () => {
      mockSearchParams.set('state', 'csrf_token_xyz')
      renderPage()

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/oauth/callback',
          expect.objectContaining({
            body: expect.stringContaining('"state":"csrf_token_xyz"')
          })
        )
      })
    })

    it('handles missing state parameter', async () => {
      mockSearchParams.delete('state')
      renderPage()

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/oauth/callback',
          expect.objectContaining({
            body: expect.stringContaining('"state":null')
          })
        )
      })
    })

    it('sends empty state as null', async () => {
      mockSearchParams.set('state', '')
      renderPage()

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
    })
  })

  describe('Timing and Navigation', () => {
    it('does not navigate before timeout completes', async () => {
      mockSearchParams.set('code', 'auth_code_123')
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ isNewUser: false })
      })

      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Success!')).toBeInTheDocument()
      })

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      expect(mockNavigate).not.toHaveBeenCalled()

      act(() => {
        jest.advanceTimersByTime(500)
      })

      expect(mockNavigate).toHaveBeenCalled()
    })

    it('uses correct timeout for success (1500ms)', async () => {
      mockSearchParams.set('code', 'auth_code_123')
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ isNewUser: false })
      })

      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Success!')).toBeInTheDocument()
      })

      act(() => {
        jest.advanceTimersByTime(1500)
      })

      expect(mockNavigate).toHaveBeenCalledWith('/home')
    })

    it('uses correct timeout for error (3000ms)', async () => {
      mockSearchParams.set('error', 'access_denied')
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Authentication Failed')).toBeInTheDocument()
      })

      act(() => {
        jest.advanceTimersByTime(2999)
      })

      expect(mockNavigate).not.toHaveBeenCalled()

      act(() => {
        jest.advanceTimersByTime(1)
      })

      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })

  describe('UI Interactions', () => {
    it('button hover effect works', async () => {
      const user = userEvent.setup({ delay: null })
      mockSearchParams.set('error', 'access_denied')
      renderPage()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Return to login/i })).toBeInTheDocument()
      })

      const button = screen.getByRole('button', { name: /Return to login/i })
      await user.hover(button)

      expect(button).toHaveStyle({ transform: 'scale(1.05)' })
    })

    it('shows warning message about closing window', () => {
      renderPage()
      expect(screen.getByText('Please do not close this window')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles empty code parameter', async () => {
      mockSearchParams.set('code', '')
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Missing authentication code')).toBeInTheDocument()
      })
    })

    it('handles both error and code present (error takes precedence)', async () => {
      mockSearchParams.set('code', 'auth_code_123')
      mockSearchParams.set('error', 'access_denied')
      renderPage()

      await waitFor(() => {
        expect(screen.getByText(/Authentication failed: access_denied/)).toBeInTheDocument()
      })

      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('handles special characters in error message', async () => {
      mockSearchParams.set('error', 'error_with_special_chars_!@#')
      renderPage()

      await waitFor(() => {
        expect(screen.getByText(/Authentication failed: error_with_special_chars_!@#/)).toBeInTheDocument()
      })
    })

    it('handles very long error messages', async () => {
      const longError = 'a'.repeat(200)
      mockSearchParams.set('error', longError)
      renderPage()

      await waitFor(() => {
        expect(screen.getByText(new RegExp(longError))).toBeInTheDocument()
      })
    })

    it('handles multiple consecutive authentications', async () => {
      mockSearchParams.set('code', 'code_1')
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ isNewUser: false })
      })

      const { unmount } = renderPage()

      await waitFor(() => {
        expect(screen.getByText('Success!')).toBeInTheDocument()
      })

      unmount()

      mockSearchParams.set('code', 'code_2')
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Success!')).toBeInTheDocument()
      })
    })
  })

  describe('API Response Variations', () => {
    it('handles response with additional user data', async () => {
      mockSearchParams.set('code', 'auth_code_123')
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          isNewUser: false,
          user: { id: 1, email: 'test@example.com' },
          token: 'jwt_token'
        })
      })

      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Success!')).toBeInTheDocument()
      })
    })

    it('handles response with custom redirect', async () => {
      mockSearchParams.set('code', 'auth_code_123')
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          isNewUser: false,
          redirectUrl: '/dashboard'
        })
      })

      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Success!')).toBeInTheDocument()
      })
    })
  })

  describe('CSS Animations', () => {
    it('includes spin animation styles', () => {
      renderPage()
      const style = screen.getByRole('main').querySelector('style')
      expect(style?.textContent).toContain('@keyframes spin')
    })

    it('includes scaleIn animation styles', () => {
      renderPage()
      const style = screen.getByRole('main').querySelector('style')
      expect(style?.textContent).toContain('@keyframes scaleIn')
    })

    it('includes bounce animation styles', () => {
      renderPage()
      const style = screen.getByRole('main').querySelector('style')
      expect(style?.textContent).toContain('@keyframes bounce')
    })
  })

  describe('Accessibility', () => {
    it('has accessible button label', async () => {
      mockSearchParams.set('error', 'access_denied')
      renderPage()

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /Return to login/i })
        expect(button).toHaveAttribute('aria-label', 'Return to login')
      })
    })

    it('maintains focus management', async () => {
      mockSearchParams.set('error', 'access_denied')
      renderPage()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Return to login/i })).toBeInTheDocument()
      })
    })
  })

  describe('Concurrent Operations', () => {
    it('handles useEffect running only once', async () => {
      mockSearchParams.set('code', 'auth_code_123')
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ isNewUser: false })
      })

      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Success!')).toBeInTheDocument()
      })

      expect(global.fetch).toHaveBeenCalledTimes(1)
    })
  })
})

export default mockNavigate
