import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import authService from '../services/authService'
import websocketService from '../services/websocketService'
// import { useWeb3Auth } from '../lib/hooks/useWeb3Auth'

// Auth action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS', 
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  SIGNUP_START: 'SIGNUP_START',
  SIGNUP_SUCCESS: 'SIGNUP_SUCCESS',
  SIGNUP_FAILURE: 'SIGNUP_FAILURE',
  LOGOUT: 'LOGOUT',
  CLEAR_ERRORS: 'CLEAR_ERRORS',
  SET_LOADING: 'SET_LOADING',
  PASSWORD_RESET_START: 'PASSWORD_RESET_START',
  PASSWORD_RESET_SUCCESS: 'PASSWORD_RESET_SUCCESS',
  PASSWORD_RESET_FAILURE: 'PASSWORD_RESET_FAILURE',
  WEB3_AUTH_START: 'WEB3_AUTH_START',
  WEB3_AUTH_SUCCESS: 'WEB3_AUTH_SUCCESS',
  WEB3_AUTH_FAILURE: 'WEB3_AUTH_FAILURE'
}

// Initial auth state
const initialState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
  isLoggingIn: false,
  isSigningUp: false,
  isResettingPassword: false,
  isWeb3Authenticating: false,
  rememberMe: false,
  authMethod: null
}

// Auth reducer
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoggingIn: true,
        loading: true,
        error: null
      }
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        authMethod: action.payload.authMethod,
        rememberMe: action.payload.rememberMe,
        isLoggingIn: false,
        loading: false,
        error: null
      }
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        isLoggingIn: false,
        loading: false,
        error: action.payload
      }
    case AUTH_ACTIONS.SIGNUP_START:
      return {
        ...state,
        isSigningUp: true,
        loading: true,
        error: null
      }
    case AUTH_ACTIONS.SIGNUP_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        authMethod: action.payload.authMethod,
        isSigningUp: false,
        loading: false,
        error: null
      }
    case AUTH_ACTIONS.SIGNUP_FAILURE:
      return {
        ...state,
        isSigningUp: false,
        loading: false,
        error: action.payload
      }
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        isAuthenticated: false,
        user: null,
        loading: false
      }
    case AUTH_ACTIONS.CLEAR_ERRORS:
      return {
        ...state,
        error: null
      }
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      }
    case AUTH_ACTIONS.PASSWORD_RESET_START:
      return {
        ...state,
        isResettingPassword: true,
        error: null
      }
    case AUTH_ACTIONS.PASSWORD_RESET_SUCCESS:
      return {
        ...state,
        isResettingPassword: false,
        error: null
      }
    case AUTH_ACTIONS.PASSWORD_RESET_FAILURE:
      return {
        ...state,
        isResettingPassword: false,
        error: action.payload
      }
    case AUTH_ACTIONS.WEB3_AUTH_START:
      return {
        ...state,
        isWeb3Authenticating: true,
        loading: true,
        error: null
      }
    case AUTH_ACTIONS.WEB3_AUTH_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        authMethod: 'web3',
        isWeb3Authenticating: false,
        loading: false,
        error: null
      }
    case AUTH_ACTIONS.WEB3_AUTH_FAILURE:
      return {
        ...state,
        isWeb3Authenticating: false,
        loading: false,
        error: action.payload
      }
    default:
      return state
  }
}

// Create context
const AuthContext = createContext()

// Auth provider component
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)
  // Web3Auth is disabled for now due to errors
  // const web3Auth = useWeb3Auth({
  //   autoConnect: false,
  //   autoAuthenticate: false
  // })
  const web3Auth = {
    state: {
      isConnected: false,
      isAuthenticated: false,
      account: null,
      chainId: null,
      balance: null,
      ensName: null
    },
    actions: {
      connect: () => Promise.resolve(),
      disconnect: () => Promise.resolve(),
      authenticate: () => Promise.resolve()
    }
  }

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth().catch(err => {
      console.warn('Auth initialization error (non-fatal):', err)
      // Always finish loading even on error
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Initialize authentication state
  const initializeAuth = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })

      // Check if user is authenticated with valid token
      if (authService.isAuthenticated()) {
        const user = authService.getCurrentUser()

        if (user) {
          // Try to get fresh profile from backend
          const profileResult = await authService.getProfile()

          if (profileResult.success) {
            // Use fresh profile data
            // Connect WebSocket (non-blocking)
            websocketService.connect(profileResult.user).catch(err =>
              console.warn('WebSocket connection failed:', err)
            )

            dispatch({
              type: AUTH_ACTIONS.LOGIN_SUCCESS,
              payload: {
                user: profileResult.user,
                authMethod: profileResult.user.authMethod || 'email',
                rememberMe: true
              }
            })
          } else {
            // Token might be expired, try to refresh
            if (authService.shouldRefreshToken()) {
              const refreshResult = await authService.refreshToken()
              
              if (refreshResult.success) {
                // Retry getting profile with new token
                const retryProfileResult = await authService.getProfile()
                
                if (retryProfileResult.success) {
                  websocketService.connect(retryProfileResult.user).catch(err =>
                    console.warn('WebSocket connection failed:', err)
                  )

                  dispatch({
                    type: AUTH_ACTIONS.LOGIN_SUCCESS,
                    payload: {
                      user: retryProfileResult.user,
                      authMethod: retryProfileResult.user.authMethod || 'email',
                      rememberMe: true
                    }
                  })
                } else {
                  // Still failed, clear auth
                  authService.clearAuth()
                }
              } else {
                // Refresh failed, clear auth
                authService.clearAuth()
              }
            } else {
              // No refresh token or other issue, use cached user data
              websocketService.connect(user).catch(err =>
                console.warn('WebSocket connection failed:', err)
              )

              dispatch({
                type: AUTH_ACTIONS.LOGIN_SUCCESS,
                payload: {
                  user,
                  authMethod: user.authMethod || 'email',
                  rememberMe: false
                }
              })
            }
          }
        }
      } else {
        // Check for Web3 session
        const web3Session = localStorage.getItem('cryb_siwe_session')
        if (web3Session) {
          try {
            const sessionData = JSON.parse(web3Session)
            if (sessionData.expirationTime && new Date(sessionData.expirationTime) > new Date()) {
              // Web3 session is still valid
              const web3User = {
                id: sessionData.account,
                username: sessionData.account.slice(0, 6) + '...' + sessionData.account.slice(-4),
                email: `${sessionData.account}@web3.cryb`,
                displayName: sessionData.ensName || sessionData.account.slice(0, 6) + '...',
                authMethod: 'web3',
                walletAddress: sessionData.account,
                avatar: sessionData.account[0].toUpperCase()
              }

              websocketService.connect(web3User).catch(err =>
                console.warn('WebSocket connection failed:', err)
              )

              dispatch({
                type: AUTH_ACTIONS.WEB3_AUTH_SUCCESS,
                payload: { user: web3User }
              })
            } else {
              // Web3 session expired
              localStorage.removeItem('cryb_siwe_session')
            }
          } catch (error) {
            console.error('Invalid Web3 session data:', error)
            localStorage.removeItem('cryb_siwe_session')
          }
        }
      }

    } catch (error) {
      console.error('Auth initialization failed:', error)
      // Clear potentially corrupted auth data
      authService.clearAuth()
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
    }
  }

  // Email/password login
  const login = async (email, password, rememberMe = false) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START })

      // Use backend authentication service
      const result = await authService.login(email, password, rememberMe)

      if (result.success) {
        const { user, tokens } = result

        // Connect WebSocket with authenticated user (non-blocking)
        websocketService.connect(user).catch(err =>
          console.warn('WebSocket connection failed during login:', err)
        )

        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user, authMethod: 'email', rememberMe }
        })

        return { success: true, user }
      } else {
        throw new Error(result.error || 'Login failed')
      }
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: error.message
      })
      return { success: false, error: error.message }
    }
  }

  // Email/password signup
  const signup = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SIGNUP_START })

      // Use backend authentication service
      const result = await authService.register(userData)

      if (result.success) {
        const { user, tokens } = result

        // Connect WebSocket with authenticated user (non-blocking)
        websocketService.connect(user).catch(err =>
          console.warn('WebSocket connection failed during signup:', err)
        )

        dispatch({
          type: AUTH_ACTIONS.SIGNUP_SUCCESS,
          payload: { user, authMethod: 'email' }
        })

        return { success: true, user }
      } else {
        throw new Error(result.error || 'Registration failed')
      }
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.SIGNUP_FAILURE,
        payload: error.message
      })
      return { success: false, error: error.message }
    }
  }

  // Password reset
  const resetPassword = async (email) => {
    try {
      dispatch({ type: AUTH_ACTIONS.PASSWORD_RESET_START })

      // Use backend authentication service
      const result = await authService.resetPassword(email)

      if (result.success) {
        dispatch({ type: AUTH_ACTIONS.PASSWORD_RESET_SUCCESS })
        return { success: true, message: result.message || 'Password reset email sent! Check your inbox.' }
      } else {
        throw new Error(result.error || 'Failed to send reset email')
      }
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.PASSWORD_RESET_FAILURE,
        payload: error.message
      })
      return { success: false, error: error.message }
    }
  }

  // Web3 wallet authentication (currently disabled)
  const connectWallet = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.WEB3_AUTH_START })

      // Simulate a short delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Web3 authentication is disabled for now
      throw new Error('Web3 authentication is temporarily disabled. Please use email/password login.')
      
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.WEB3_AUTH_FAILURE,
        payload: error.message
      })
      return { success: false, error: error.message }
    }
  }

  // Logout
  const logout = async () => {
    try {
      // Use backend authentication service
      await authService.logout()
      
      // Disconnect WebSocket
      websocketService.disconnect()
      
      // Disconnect Web3 if connected
      if (web3Auth.state.isConnected) {
        await web3Auth.actions.disconnect()
      }

      dispatch({ type: AUTH_ACTIONS.LOGOUT })
      return { success: true }
    } catch (error) {
      console.error('Logout error:', error)
      // Force logout even if there are errors
      dispatch({ type: AUTH_ACTIONS.LOGOUT })
      return { success: true }
    }
  }

  // Clear errors
  const clearErrors = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERRORS })
  }

  // Check if session is about to expire
  const checkSessionExpiry = () => {
    const sessionToken = localStorage.getItem('cryb_session_token')
    if (sessionToken) {
      const tokenData = JSON.parse(sessionToken)
      const expiresAt = new Date(tokenData.expiresAt)
      const now = new Date()
      const timeUntilExpiry = expiresAt.getTime() - now.getTime()
      
      // Return time until expiry in minutes
      return Math.max(0, Math.floor(timeUntilExpiry / (1000 * 60)))
    }
    return 0
  }

  // Refresh session token
  const refreshSession = () => {
    if (state.rememberMe) {
      const rememberToken = localStorage.getItem('cryb_remember_token')
      if (rememberToken) {
        const tokenData = JSON.parse(rememberToken)
        if (tokenData.expiresAt && new Date(tokenData.expiresAt) > new Date()) {
          const newSessionToken = {
            token: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
          }
          localStorage.setItem('cryb_session_token', JSON.stringify(newSessionToken))
          return true
        }
      }
    }
    return false
  }

  const value = {
    // State
    ...state,
    web3State: web3Auth.state,
    
    // Actions
    login,
    signup,
    logout,
    resetPassword,
    connectWallet,
    clearErrors,
    checkSessionExpiry,
    refreshSession,
    
    // Utility functions
    isEmailAuth: state.authMethod === 'email',
    isWeb3Auth: state.authMethod === 'web3',
    isSocialAuth: state.authMethod?.startsWith('social_')
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Higher-order component for protected routes
export function withAuth(Component) {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, loading } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
      if (!loading && !isAuthenticated) {
        navigate('/', { replace: true })
      }
    }, [isAuthenticated, loading, navigate])

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <div className="text-brand text-2xl font-bold">Loading...</div>
        </div>
      )
    }

    if (!isAuthenticated) {
      return null
    }

    return <Component {...props} />
  }
}

export { AuthContext }
export default AuthContext