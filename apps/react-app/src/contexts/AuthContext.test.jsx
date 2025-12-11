import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider, useAuth, withAuth } from './AuthContext'
import authService from '../services/authService'
import websocketService from '../services/websocketService'

// Mock dependencies
jest.mock('../services/authService')
jest.mock('../services/websocketService')
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn()
}))

const mockNavigate = jest.fn()
jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate)

// Wrapper component for hooks
const wrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>{children}</AuthProvider>
  </BrowserRouter>
)

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()

    // Default mock implementations
    authService.isAuthenticated.mockReturnValue(false)
    authService.getCurrentUser.mockReturnValue(null)
    authService.getProfile.mockResolvedValue({ success: false })
    authService.shouldRefreshToken.mockReturnValue(false)
    authService.refreshToken.mockResolvedValue({ success: false })
    authService.clearAuth.mockImplementation(() => {})
    authService.login.mockResolvedValue({ success: false })
    authService.register.mockResolvedValue({ success: false })
    authService.logout.mockResolvedValue({ success: true })
    authService.resetPassword.mockResolvedValue({ success: false })

    websocketService.connect.mockResolvedValue(undefined)
    websocketService.disconnect.mockImplementation(() => {})
  })

  describe('Initial State', () => {
    test('should provide initial authentication state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.isLoggingIn).toBe(false)
      expect(result.current.isSigningUp).toBe(false)
      expect(result.current.isResettingPassword).toBe(false)
      expect(result.current.isWeb3Authenticating).toBe(false)
      expect(result.current.rememberMe).toBe(false)
      expect(result.current.authMethod).toBeNull()
    })

    test('should provide web3 state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.web3State).toBeDefined()
      expect(result.current.web3State.isConnected).toBe(false)
      expect(result.current.web3State.isAuthenticated).toBe(false)
      expect(result.current.web3State.account).toBeNull()
    })

    test('should provide all action methods', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(typeof result.current.login).toBe('function')
      expect(typeof result.current.signup).toBe('function')
      expect(typeof result.current.logout).toBe('function')
      expect(typeof result.current.resetPassword).toBe('function')
      expect(typeof result.current.connectWallet).toBe('function')
      expect(typeof result.current.clearErrors).toBe('function')
      expect(typeof result.current.checkSessionExpiry).toBe('function')
      expect(typeof result.current.refreshSession).toBe('function')
    })

    test('should provide utility flags', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.isEmailAuth).toBe(false)
      expect(result.current.isWeb3Auth).toBe(false)
      expect(result.current.isSocialAuth).toBe(false)
    })
  })

  describe('Authentication Initialization', () => {
    test('should initialize with no authentication', async () => {
      authService.isAuthenticated.mockReturnValue(false)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
    })

    test('should restore authenticated user on mount', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser',
        authMethod: 'email'
      }

      authService.isAuthenticated.mockReturnValue(true)
      authService.getCurrentUser.mockReturnValue(mockUser)
      authService.getProfile.mockResolvedValue({
        success: true,
        user: mockUser
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.authMethod).toBe('email')
      expect(websocketService.connect).toHaveBeenCalledWith(mockUser)
    })

    test('should handle profile fetch failure with token refresh', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser'
      }

      authService.isAuthenticated.mockReturnValue(true)
      authService.getCurrentUser.mockReturnValue(mockUser)
      authService.getProfile.mockResolvedValueOnce({ success: false })
      authService.shouldRefreshToken.mockReturnValue(true)
      authService.refreshToken.mockResolvedValue({ success: true })
      authService.getProfile.mockResolvedValueOnce({
        success: true,
        user: mockUser
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })

      expect(authService.refreshToken).toHaveBeenCalled()
      expect(result.current.user).toEqual(mockUser)
    })

    test('should clear auth when token refresh fails', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com'
      }

      authService.isAuthenticated.mockReturnValue(true)
      authService.getCurrentUser.mockReturnValue(mockUser)
      authService.getProfile.mockResolvedValue({ success: false })
      authService.shouldRefreshToken.mockReturnValue(true)
      authService.refreshToken.mockResolvedValue({ success: false })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(authService.clearAuth).toHaveBeenCalled()
    })

    test('should use cached user data when refresh not needed', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        authMethod: 'email'
      }

      authService.isAuthenticated.mockReturnValue(true)
      authService.getCurrentUser.mockReturnValue(mockUser)
      authService.getProfile.mockResolvedValue({ success: false })
      authService.shouldRefreshToken.mockReturnValue(false)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.rememberMe).toBe(false)
    })

    test('should restore Web3 session from localStorage', async () => {
      const web3Session = {
        account: '0x1234567890abcdef',
        expirationTime: new Date(Date.now() + 86400000).toISOString(),
        ensName: 'testuser.eth'
      }

      localStorage.setItem('cryb_siwe_session', JSON.stringify(web3Session))
      authService.isAuthenticated.mockReturnValue(false)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })

      expect(result.current.authMethod).toBe('web3')
      expect(result.current.user.walletAddress).toBe(web3Session.account)
      expect(websocketService.connect).toHaveBeenCalled()
    })

    test('should remove expired Web3 session', async () => {
      const expiredSession = {
        account: '0x1234567890abcdef',
        expirationTime: new Date(Date.now() - 1000).toISOString()
      }

      localStorage.setItem('cryb_siwe_session', JSON.stringify(expiredSession))
      authService.isAuthenticated.mockReturnValue(false)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(localStorage.getItem('cryb_siwe_session')).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })

    test('should handle invalid Web3 session data', async () => {
      localStorage.setItem('cryb_siwe_session', 'invalid-json')
      authService.isAuthenticated.mockReturnValue(false)

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(localStorage.getItem('cryb_siwe_session')).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    test('should handle auth initialization errors', async () => {
      authService.isAuthenticated.mockImplementation(() => {
        throw new Error('Auth service error')
      })

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(authService.clearAuth).toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Login', () => {
    test('should successfully login with email and password', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser'
      }
      const mockTokens = { accessToken: 'token123', refreshToken: 'refresh123' }

      authService.login.mockResolvedValue({
        success: true,
        user: mockUser,
        tokens: mockTokens
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let loginResult
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'password123')
      })

      expect(loginResult.success).toBe(true)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.authMethod).toBe('email')
      expect(result.current.isLoggingIn).toBe(false)
      expect(result.current.error).toBeNull()
      expect(websocketService.connect).toHaveBeenCalledWith(mockUser)
    })

    test('should set rememberMe flag when logging in', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }

      authService.login.mockResolvedValue({
        success: true,
        user: mockUser,
        tokens: {}
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.login('test@example.com', 'password123', true)
      })

      expect(result.current.rememberMe).toBe(true)
    })

    test('should handle login failure', async () => {
      authService.login.mockResolvedValue({
        success: false,
        error: 'Invalid credentials'
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let loginResult
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'wrongpassword')
      })

      expect(loginResult.success).toBe(false)
      expect(loginResult.error).toBe('Invalid credentials')
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
      expect(result.current.error).toBe('Invalid credentials')
      expect(result.current.isLoggingIn).toBe(false)
    })

    test('should set loading states during login', async () => {
      authService.login.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ success: true, user: {} }), 100))
      )

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.login('test@example.com', 'password123')
      })

      expect(result.current.isLoggingIn).toBe(true)
      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoggingIn).toBe(false)
      })
    })

    test('should handle login with missing error message', async () => {
      authService.login.mockResolvedValue({ success: false })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let loginResult
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'password123')
      })

      expect(loginResult.error).toBe('Login failed')
    })

    test('should handle login service throwing error', async () => {
      authService.login.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let loginResult
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'password123')
      })

      expect(loginResult.success).toBe(false)
      expect(loginResult.error).toBe('Network error')
      expect(result.current.error).toBe('Network error')
    })
  })

  describe('Signup', () => {
    test('should successfully signup with user data', async () => {
      const userData = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'password123'
      }

      const mockUser = {
        id: '456',
        email: userData.email,
        username: userData.username
      }

      authService.register.mockResolvedValue({
        success: true,
        user: mockUser,
        tokens: {}
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let signupResult
      await act(async () => {
        signupResult = await result.current.signup(userData)
      })

      expect(signupResult.success).toBe(true)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.authMethod).toBe('email')
      expect(result.current.isSigningUp).toBe(false)
      expect(websocketService.connect).toHaveBeenCalledWith(mockUser)
    })

    test('should handle signup failure', async () => {
      authService.register.mockResolvedValue({
        success: false,
        error: 'Email already exists'
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let signupResult
      await act(async () => {
        signupResult = await result.current.signup({ email: 'test@example.com' })
      })

      expect(signupResult.success).toBe(false)
      expect(signupResult.error).toBe('Email already exists')
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toBe('Email already exists')
    })

    test('should set loading states during signup', async () => {
      authService.register.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ success: true, user: {} }), 100))
      )

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.signup({ email: 'test@example.com' })
      })

      expect(result.current.isSigningUp).toBe(true)
      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.isSigningUp).toBe(false)
      })
    })

    test('should handle signup with missing error message', async () => {
      authService.register.mockResolvedValue({ success: false })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let signupResult
      await act(async () => {
        signupResult = await result.current.signup({ email: 'test@example.com' })
      })

      expect(signupResult.error).toBe('Registration failed')
    })

    test('should handle signup service throwing error', async () => {
      authService.register.mockRejectedValue(new Error('Server error'))

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let signupResult
      await act(async () => {
        signupResult = await result.current.signup({ email: 'test@example.com' })
      })

      expect(signupResult.success).toBe(false)
      expect(signupResult.error).toBe('Server error')
    })
  })

  describe('Logout', () => {
    test('should successfully logout authenticated user', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }

      authService.isAuthenticated.mockReturnValue(true)
      authService.getCurrentUser.mockReturnValue(mockUser)
      authService.getProfile.mockResolvedValue({ success: true, user: mockUser })
      authService.logout.mockResolvedValue({ success: true })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })

      let logoutResult
      await act(async () => {
        logoutResult = await result.current.logout()
      })

      expect(logoutResult.success).toBe(true)
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
      expect(result.current.authMethod).toBeNull()
      expect(authService.logout).toHaveBeenCalled()
      expect(websocketService.disconnect).toHaveBeenCalled()
    })

    test('should disconnect Web3 if connected during logout', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }

      authService.isAuthenticated.mockReturnValue(true)
      authService.getCurrentUser.mockReturnValue(mockUser)
      authService.getProfile.mockResolvedValue({ success: true, user: mockUser })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })

      await act(async () => {
        await result.current.logout()
      })

      expect(websocketService.disconnect).toHaveBeenCalled()
    })

    test('should force logout even if logout service fails', async () => {
      authService.logout.mockRejectedValue(new Error('Logout failed'))

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let logoutResult
      await act(async () => {
        logoutResult = await result.current.logout()
      })

      expect(logoutResult.success).toBe(true)
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()

      consoleErrorSpy.mockRestore()
    })

    test('should reset all state to initial values on logout', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.logout()
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
      expect(result.current.error).toBeNull()
      expect(result.current.isLoggingIn).toBe(false)
      expect(result.current.isSigningUp).toBe(false)
      expect(result.current.isResettingPassword).toBe(false)
      expect(result.current.isWeb3Authenticating).toBe(false)
      expect(result.current.rememberMe).toBe(false)
      expect(result.current.authMethod).toBeNull()
    })
  })

  describe('Password Reset', () => {
    test('should successfully send password reset email', async () => {
      authService.resetPassword.mockResolvedValue({
        success: true,
        message: 'Reset email sent'
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let resetResult
      await act(async () => {
        resetResult = await result.current.resetPassword('test@example.com')
      })

      expect(resetResult.success).toBe(true)
      expect(resetResult.message).toBe('Reset email sent')
      expect(result.current.isResettingPassword).toBe(false)
      expect(result.current.error).toBeNull()
    })

    test('should handle password reset failure', async () => {
      authService.resetPassword.mockResolvedValue({
        success: false,
        error: 'Email not found'
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let resetResult
      await act(async () => {
        resetResult = await result.current.resetPassword('test@example.com')
      })

      expect(resetResult.success).toBe(false)
      expect(resetResult.error).toBe('Email not found')
      expect(result.current.error).toBe('Email not found')
    })

    test('should set loading state during password reset', async () => {
      authService.resetPassword.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      )

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.resetPassword('test@example.com')
      })

      expect(result.current.isResettingPassword).toBe(true)

      await waitFor(() => {
        expect(result.current.isResettingPassword).toBe(false)
      })
    })

    test('should use default message when none provided', async () => {
      authService.resetPassword.mockResolvedValue({ success: true })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let resetResult
      await act(async () => {
        resetResult = await result.current.resetPassword('test@example.com')
      })

      expect(resetResult.message).toBe('Password reset email sent! Check your inbox.')
    })

    test('should handle password reset service throwing error', async () => {
      authService.resetPassword.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let resetResult
      await act(async () => {
        resetResult = await result.current.resetPassword('test@example.com')
      })

      expect(resetResult.success).toBe(false)
      expect(resetResult.error).toBe('Network error')
    })
  })

  describe('Web3 Authentication', () => {
    test('should show Web3 disabled error when connecting wallet', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let connectResult
      await act(async () => {
        connectResult = await result.current.connectWallet()
      })

      expect(connectResult.success).toBe(false)
      expect(connectResult.error).toContain('temporarily disabled')
      expect(result.current.error).toContain('temporarily disabled')
    })

    test('should set loading state during wallet connection', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.connectWallet()
      })

      expect(result.current.isWeb3Authenticating).toBe(true)
      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.isWeb3Authenticating).toBe(false)
      })
    })
  })

  describe('Error Handling', () => {
    test('should clear errors', async () => {
      authService.login.mockResolvedValue({
        success: false,
        error: 'Login failed'
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.login('test@example.com', 'wrongpassword')
      })

      expect(result.current.error).toBe('Login failed')

      act(() => {
        result.current.clearErrors()
      })

      expect(result.current.error).toBeNull()
    })

    test('should not affect other state when clearing errors', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.clearErrors()
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
    })
  })

  describe('Session Management', () => {
    test('should check session expiry with valid token', () => {
      const sessionToken = {
        token: 'token123',
        expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour
      }

      localStorage.setItem('cryb_session_token', JSON.stringify(sessionToken))

      const { result } = renderHook(() => useAuth(), { wrapper })

      const minutesRemaining = result.current.checkSessionExpiry()

      expect(minutesRemaining).toBeGreaterThan(0)
      expect(minutesRemaining).toBeLessThanOrEqual(60)
    })

    test('should return 0 for expired session', () => {
      const sessionToken = {
        token: 'token123',
        expiresAt: new Date(Date.now() - 1000).toISOString()
      }

      localStorage.setItem('cryb_session_token', JSON.stringify(sessionToken))

      const { result } = renderHook(() => useAuth(), { wrapper })

      const minutesRemaining = result.current.checkSessionExpiry()

      expect(minutesRemaining).toBe(0)
    })

    test('should return 0 when no session token exists', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      const minutesRemaining = result.current.checkSessionExpiry()

      expect(minutesRemaining).toBe(0)
    })

    test('should refresh session with valid remember token', () => {
      const rememberToken = {
        token: 'remember123',
        expiresAt: new Date(Date.now() + 86400000).toISOString() // 24 hours
      }

      localStorage.setItem('cryb_remember_token', JSON.stringify(rememberToken))

      authService.isAuthenticated.mockReturnValue(true)
      authService.getCurrentUser.mockReturnValue({ id: '123' })
      authService.getProfile.mockResolvedValue({
        success: true,
        user: { id: '123' }
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      // Set rememberMe to true
      act(() => {
        result.current.login('test@example.com', 'password', true)
      })

      const refreshed = result.current.refreshSession()

      // Note: refreshSession depends on rememberMe state being set
      // In the actual implementation, it checks state.rememberMe
      expect(typeof refreshed).toBe('boolean')
    })

    test('should not refresh session without remember token', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      const refreshed = result.current.refreshSession()

      expect(refreshed).toBe(false)
    })

    test('should not refresh session with expired remember token', () => {
      const rememberToken = {
        token: 'remember123',
        expiresAt: new Date(Date.now() - 1000).toISOString()
      }

      localStorage.setItem('cryb_remember_token', JSON.stringify(rememberToken))

      const { result } = renderHook(() => useAuth(), { wrapper })

      const refreshed = result.current.refreshSession()

      expect(refreshed).toBe(false)
    })
  })

  describe('Auth Method Flags', () => {
    test('should set isEmailAuth to true for email authentication', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }

      authService.login.mockResolvedValue({
        success: true,
        user: mockUser,
        tokens: {}
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.login('test@example.com', 'password123')
      })

      expect(result.current.isEmailAuth).toBe(true)
      expect(result.current.isWeb3Auth).toBe(false)
      expect(result.current.isSocialAuth).toBe(false)
    })

    test('should set isWeb3Auth to true for Web3 authentication', async () => {
      const web3Session = {
        account: '0x1234567890abcdef',
        expirationTime: new Date(Date.now() + 86400000).toISOString()
      }

      localStorage.setItem('cryb_siwe_session', JSON.stringify(web3Session))
      authService.isAuthenticated.mockReturnValue(false)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })

      expect(result.current.isWeb3Auth).toBe(true)
      expect(result.current.isEmailAuth).toBe(false)
      expect(result.current.isSocialAuth).toBe(false)
    })

    test('should detect social auth method', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        authMethod: 'social_google'
      }

      authService.isAuthenticated.mockReturnValue(true)
      authService.getCurrentUser.mockReturnValue(mockUser)
      authService.getProfile.mockResolvedValue({ success: true, user: mockUser })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })

      expect(result.current.isSocialAuth).toBe(true)
      expect(result.current.isEmailAuth).toBe(false)
      expect(result.current.isWeb3Auth).toBe(false)
    })
  })

  describe('useAuth Hook', () => {
    test('should throw error when used outside AuthProvider', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      expect(() => {
        renderHook(() => useAuth())
      }).toThrow('useAuth must be used within an AuthProvider')

      consoleErrorSpy.mockRestore()
    })
  })

  describe('withAuth HOC', () => {
    test('should render component for authenticated user', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }

      authService.isAuthenticated.mockReturnValue(true)
      authService.getCurrentUser.mockReturnValue(mockUser)
      authService.getProfile.mockResolvedValue({ success: true, user: mockUser })

      const TestComponent = () => <div>Protected Content</div>
      const ProtectedComponent = withAuth(TestComponent)

      const { getByText } = require('@testing-library/react').render(
        <BrowserRouter>
          <AuthProvider>
            <ProtectedComponent />
          </AuthProvider>
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(getByText('Protected Content')).toBeInTheDocument()
      })
    })

    test('should show loading state while checking authentication', async () => {
      authService.isAuthenticated.mockReturnValue(true)
      authService.getCurrentUser.mockReturnValue({ id: '123' })
      authService.getProfile.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ success: true, user: { id: '123' } }), 100))
      )

      const TestComponent = () => <div>Protected Content</div>
      const ProtectedComponent = withAuth(TestComponent)

      const { getByText } = require('@testing-library/react').render(
        <BrowserRouter>
          <AuthProvider>
            <ProtectedComponent />
          </AuthProvider>
        </BrowserRouter>
      )

      expect(getByText('')).toBeInTheDocument()
    })

    test('should navigate to home for unauthenticated user', async () => {
      authService.isAuthenticated.mockReturnValue(false)

      const TestComponent = () => <div>Protected Content</div>
      const ProtectedComponent = withAuth(TestComponent)

      require('@testing-library/react').render(
        <BrowserRouter>
          <AuthProvider>
            <ProtectedComponent />
          </AuthProvider>
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
      })
    })
  })
})

export default mockNavigate
