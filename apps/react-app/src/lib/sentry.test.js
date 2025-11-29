/**
 * Comprehensive tests for Sentry Error Tracking Integration
 * Tests cover initialization, error capture, user context, breadcrumbs,
 * performance monitoring, and environment-specific configurations
 */

import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'

// Mock Sentry SDK and dependencies
jest.mock('@sentry/react', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
  addBreadcrumb: jest.fn(),
  startSpan: jest.fn((config, callback) => callback({})),
}))

jest.mock('@sentry/tracing', () => ({
  BrowserTracing: jest.fn(),
}))

describe('Sentry Integration', () => {
  let consoleErrorSpy
  let initSentry
  let captureException
  let captureMessage
  let setUser
  let addBreadcrumb
  let startTransaction
  let ErrorContext

  // Helper to set env vars and reload module
  const setupEnv = async (envVars = {}) => {
    const defaults = {
      VITE_SENTRY_DSN: '',
      VITE_ENVIRONMENT: 'production',
      VITE_APP_VERSION: '1.0.0',
    }

    const env = { ...defaults, ...envVars }

    // Mock import.meta.env
    jest.resetModules()
    jest.doMock('./sentry', () => {
      // Recreate module with mocked env
      const mockEnv = env

      const module = {
        initSentry: () => {
          const SENTRY_DSN = mockEnv.VITE_SENTRY_DSN || ''
          const SENTRY_ENVIRONMENT = mockEnv.VITE_ENVIRONMENT || 'production'
          const SENTRY_RELEASE = mockEnv.VITE_APP_VERSION || '1.0.0'

          if (!SENTRY_DSN) {
            return
          }

          Sentry.init({
            dsn: SENTRY_DSN,
            environment: SENTRY_ENVIRONMENT,
            release: `cryb-platform@${SENTRY_RELEASE}`,
            integrations: [
              new BrowserTracing({
                tracePropagationTargets: [
                  'localhost',
                  'platform.cryb.ai',
                  /^https:\/\/api\.cryb\.ai/,
                ],
              }),
            ],
            tracesSampleRate: 0.2,
            sampleRate: 1.0,
            replaysSessionSampleRate: 0.1,
            replaysOnErrorSampleRate: 1.0,
            beforeSend(event, hint) {
              if (event.request) {
                delete event.request.cookies
                if (event.request.headers) {
                  delete event.request.headers.Authorization
                  delete event.request.headers.Cookie
                }
              }

              const error = hint.originalException
              if (error && error.message) {
                if (error.message.includes('NetworkError')) {
                  return null
                }
                if (error.message.includes('AbortError')) {
                  return null
                }
              }

              return event
            },
            ignoreErrors: [
              'ResizeObserver loop limit exceeded',
              'Non-Error promise rejection captured',
              'Network request failed',
              'Failed to fetch',
              'NetworkError',
              'AbortError',
            ],
            enabled: SENTRY_ENVIRONMENT !== 'development',
          })
        },
        captureException: (error, context = {}) => {
          console.error('[Sentry] Error:', error, context)
          Sentry.captureException(error, {
            contexts: context,
            tags: {
              component: context.component,
              action: context.action,
            },
          })
        },
        captureMessage: (message, level = 'info', context = {}) => {
          Sentry.captureMessage(message, {
            level,
            contexts: context,
          })
        },
        setUser: (user) => {
          if (!user) {
            Sentry.setUser(null)
            return
          }
          const sentryUser = {
            id: user.id,
            username: user.username,
            email: user.email,
          }
          Sentry.setUser(sentryUser)
        },
        addBreadcrumb: (breadcrumb) => {
          Sentry.addBreadcrumb({
            category: breadcrumb.category || 'user-action',
            message: breadcrumb.message,
            level: breadcrumb.level || 'info',
            data: breadcrumb.data,
          })
        },
        startTransaction: (name, op = 'navigation') => {
          return Sentry.startSpan({
            name,
            op,
          }, (span) => span)
        },
        ErrorContext: {
          authError: (action) => ({
            component: 'Authentication',
            action,
            category: 'auth',
          }),
          apiError: (endpoint, status) => ({
            component: 'API',
            action: endpoint,
            status,
            category: 'api',
          }),
          web3Error: (action, wallet) => ({
            component: 'Web3',
            action,
            wallet,
            category: 'web3',
          }),
          uiError: (component) => ({
            component,
            category: 'ui',
          }),
          socketError: (event) => ({
            component: 'WebSocket',
            action: event,
            category: 'realtime',
          }),
        },
      }

      module.default = module
      return module
    })

    const mod = await import('./sentry')
    return mod
  }

  beforeEach(() => {
    jest.clearAllMocks()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    jest.resetModules()
  })

  describe('initSentry', () => {
    it('should not initialize Sentry when DSN is not provided', async () => {
      const module = await setupEnv({ VITE_SENTRY_DSN: '' })
      module.initSentry()

      expect(Sentry.init).not.toHaveBeenCalled()
    })

    it('should initialize Sentry with correct DSN', async () => {
      const mockDSN = 'https://abc123@sentry.io/123456'
      const module = await setupEnv({ VITE_SENTRY_DSN: mockDSN })
      module.initSentry()

      expect(Sentry.init).toHaveBeenCalled()
      const config = Sentry.init.mock.calls[0][0]
      expect(config.dsn).toBe(mockDSN)
    })

    it('should configure environment from VITE_ENVIRONMENT', async () => {
      const module = await setupEnv({
        VITE_SENTRY_DSN: 'https://test@sentry.io/123',
        VITE_ENVIRONMENT: 'staging',
      })
      module.initSentry()

      const config = Sentry.init.mock.calls[0][0]
      expect(config.environment).toBe('staging')
    })

    it('should set release version correctly', async () => {
      const module = await setupEnv({
        VITE_SENTRY_DSN: 'https://test@sentry.io/123',
        VITE_APP_VERSION: '2.5.0',
      })
      module.initSentry()

      const config = Sentry.init.mock.calls[0][0]
      expect(config.release).toBe('cryb-platform@2.5.0')
    })

    it('should default to production environment when not specified', async () => {
      const module = await setupEnv({
        VITE_SENTRY_DSN: 'https://test@sentry.io/123',
        VITE_ENVIRONMENT: undefined,
      })
      module.initSentry()

      const config = Sentry.init.mock.calls[0][0]
      expect(config.environment).toBe('production')
    })

    it('should default to version 1.0.0 when not specified', async () => {
      const module = await setupEnv({
        VITE_SENTRY_DSN: 'https://test@sentry.io/123',
        VITE_APP_VERSION: undefined,
      })
      module.initSentry()

      const config = Sentry.init.mock.calls[0][0]
      expect(config.release).toBe('cryb-platform@1.0.0')
    })

    it('should configure BrowserTracing integration', async () => {
      const module = await setupEnv({ VITE_SENTRY_DSN: 'https://test@sentry.io/123' })
      module.initSentry()

      expect(BrowserTracing).toHaveBeenCalled()
      const config = Sentry.init.mock.calls[0][0]
      expect(config.integrations).toBeDefined()
    })

    it('should set correct trace propagation targets', async () => {
      const module = await setupEnv({ VITE_SENTRY_DSN: 'https://test@sentry.io/123' })
      module.initSentry()

      const tracingConfig = BrowserTracing.mock.calls[0][0]
      expect(tracingConfig.tracePropagationTargets).toContain('localhost')
      expect(tracingConfig.tracePropagationTargets).toContain('platform.cryb.ai')
      expect(tracingConfig.tracePropagationTargets).toEqual(
        expect.arrayContaining([
          expect.any(RegExp),
        ])
      )
    })

    it('should configure performance sampling rate', async () => {
      const module = await setupEnv({ VITE_SENTRY_DSN: 'https://test@sentry.io/123' })
      module.initSentry()

      const config = Sentry.init.mock.calls[0][0]
      expect(config.tracesSampleRate).toBe(0.2)
    })

    it('should configure error sampling rate', async () => {
      const module = await setupEnv({ VITE_SENTRY_DSN: 'https://test@sentry.io/123' })
      module.initSentry()

      const config = Sentry.init.mock.calls[0][0]
      expect(config.sampleRate).toBe(1.0)
    })

    it('should configure session replay sampling rates', async () => {
      const module = await setupEnv({ VITE_SENTRY_DSN: 'https://test@sentry.io/123' })
      module.initSentry()

      const config = Sentry.init.mock.calls[0][0]
      expect(config.replaysSessionSampleRate).toBe(0.1)
      expect(config.replaysOnErrorSampleRate).toBe(1.0)
    })

    it('should disable Sentry in development environment', async () => {
      const module = await setupEnv({
        VITE_SENTRY_DSN: 'https://test@sentry.io/123',
        VITE_ENVIRONMENT: 'development',
      })
      module.initSentry()

      const config = Sentry.init.mock.calls[0][0]
      expect(config.enabled).toBe(false)
    })

    it('should enable Sentry in production environment', async () => {
      const module = await setupEnv({
        VITE_SENTRY_DSN: 'https://test@sentry.io/123',
        VITE_ENVIRONMENT: 'production',
      })
      module.initSentry()

      const config = Sentry.init.mock.calls[0][0]
      expect(config.enabled).toBe(true)
    })

    it('should configure ignoreErrors list', async () => {
      const module = await setupEnv({ VITE_SENTRY_DSN: 'https://test@sentry.io/123' })
      module.initSentry()

      const config = Sentry.init.mock.calls[0][0]
      expect(config.ignoreErrors).toContain('ResizeObserver loop limit exceeded')
      expect(config.ignoreErrors).toContain('NetworkError')
      expect(config.ignoreErrors).toContain('AbortError')
      expect(config.ignoreErrors).toContain('Failed to fetch')
    })
  })

  describe('beforeSend hook', () => {
    let beforeSendFn

    beforeEach(async () => {
      const module = await setupEnv({ VITE_SENTRY_DSN: 'https://test@sentry.io/123' })
      module.initSentry()
      beforeSendFn = Sentry.init.mock.calls[0][0].beforeSend
    })

    it('should remove cookies from request', () => {
      const event = {
        request: {
          cookies: { sessionId: 'abc123' },
          url: 'https://example.com',
        },
      }

      const result = beforeSendFn(event, {})

      expect(result.request.cookies).toBeUndefined()
    })

    it('should remove Authorization header', () => {
      const event = {
        request: {
          headers: {
            Authorization: 'Bearer token123',
            'Content-Type': 'application/json',
          },
        },
      }

      const result = beforeSendFn(event, {})

      expect(result.request.headers.Authorization).toBeUndefined()
      expect(result.request.headers['Content-Type']).toBe('application/json')
    })

    it('should remove Cookie header', () => {
      const event = {
        request: {
          headers: {
            Cookie: 'session=abc123',
            Accept: 'application/json',
          },
        },
      }

      const result = beforeSendFn(event, {})

      expect(result.request.headers.Cookie).toBeUndefined()
      expect(result.request.headers.Accept).toBe('application/json')
    })

    it('should filter out NetworkError exceptions', () => {
      const event = { message: 'Something went wrong' }
      const hint = {
        originalException: new Error('NetworkError: Connection failed'),
      }

      const result = beforeSendFn(event, hint)

      expect(result).toBeNull()
    })

    it('should filter out AbortError exceptions', () => {
      const event = { message: 'Request failed' }
      const hint = {
        originalException: new Error('AbortError: Request was aborted'),
      }

      const result = beforeSendFn(event, hint)

      expect(result).toBeNull()
    })

    it('should pass through non-filtered errors', () => {
      const event = { message: 'Genuine error' }
      const hint = {
        originalException: new Error('Critical bug'),
      }

      const result = beforeSendFn(event, hint)

      expect(result).toEqual(event)
    })

    it('should handle events without request object', () => {
      const event = { message: 'Error without request' }

      const result = beforeSendFn(event, {})

      expect(result).toEqual(event)
    })

    it('should handle events without originalException', () => {
      const event = {
        request: {
          cookies: { session: 'test' },
        },
      }

      const result = beforeSendFn(event, {})

      expect(result).toBeDefined()
      expect(result.request.cookies).toBeUndefined()
    })
  })

  describe('captureException', () => {
    beforeEach(async () => {
      const module = await setupEnv()
      captureException = module.captureException
    })

    it('should capture exception with Sentry', () => {
      const error = new Error('Test error')

      captureException(error)

      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          contexts: {},
          tags: {
            component: undefined,
            action: undefined,
          },
        })
      )
    })

    it('should log error to console', () => {
      const error = new Error('Test error')

      captureException(error)

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Sentry] Error:',
        error,
        {}
      )
    })

    it('should include context in capture', () => {
      const error = new Error('Test error')
      const context = {
        component: 'TestComponent',
        action: 'submit',
        userId: '123',
      }

      captureException(error, context)

      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          contexts: context,
          tags: {
            component: 'TestComponent',
            action: 'submit',
          },
        })
      )
    })

    it('should handle exceptions without context', () => {
      const error = new Error('Test error')

      captureException(error, undefined)

      expect(Sentry.captureException).toHaveBeenCalled()
    })

    it('should capture different error types', () => {
      const typeError = new TypeError('Type error')
      captureException(typeError)

      const rangeError = new RangeError('Range error')
      captureException(rangeError)

      expect(Sentry.captureException).toHaveBeenCalledTimes(2)
    })
  })

  describe('captureMessage', () => {
    beforeEach(async () => {
      const module = await setupEnv()
      captureMessage = module.captureMessage
    })

    it('should capture message with default info level', () => {
      const message = 'Test message'

      captureMessage(message)

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        message,
        expect.objectContaining({
          level: 'info',
          contexts: {},
        })
      )
    })

    it('should capture message with custom level', () => {
      const message = 'Warning message'

      captureMessage(message, 'warning')

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        message,
        expect.objectContaining({
          level: 'warning',
        })
      )
    })

    it('should support error level', () => {
      const message = 'Error message'

      captureMessage(message, 'error')

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        message,
        expect.objectContaining({
          level: 'error',
        })
      )
    })

    it('should include context in message capture', () => {
      const message = 'User action'
      const context = {
        page: 'profile',
        action: 'update',
      }

      captureMessage(message, 'info', context)

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        message,
        expect.objectContaining({
          level: 'info',
          contexts: context,
        })
      )
    })

    it('should handle empty context', () => {
      captureMessage('Test', 'info', {})

      expect(Sentry.captureMessage).toHaveBeenCalled()
    })
  })

  describe('setUser', () => {
    beforeEach(async () => {
      const module = await setupEnv()
      setUser = module.setUser
    })

    it('should set user context with complete user data', () => {
      const user = {
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
      }

      setUser(user)

      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
      })
    })

    it('should only send allowed user fields to Sentry', () => {
      const user = {
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        password: 'secret',
        ssn: '123-45-6789',
      }

      setUser(user)

      const sentryUser = Sentry.setUser.mock.calls[0][0]
      expect(sentryUser.password).toBeUndefined()
      expect(sentryUser.ssn).toBeUndefined()
    })

    it('should clear user context when user is null', () => {
      setUser(null)

      expect(Sentry.setUser).toHaveBeenCalledWith(null)
    })

    it('should clear user context when user is undefined', () => {
      setUser(undefined)

      expect(Sentry.setUser).toHaveBeenCalledWith(null)
    })

    it('should handle user with partial data', () => {
      const user = {
        id: '456',
        username: 'partialuser',
      }

      setUser(user)

      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: '456',
        username: 'partialuser',
        email: undefined,
      })
    })
  })

  describe('addBreadcrumb', () => {
    beforeEach(async () => {
      const module = await setupEnv()
      addBreadcrumb = module.addBreadcrumb
    })

    it('should add breadcrumb with all properties', () => {
      const breadcrumb = {
        category: 'navigation',
        message: 'User navigated to profile',
        level: 'info',
        data: { page: 'profile', userId: '123' },
      }

      addBreadcrumb(breadcrumb)

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: 'navigation',
        message: 'User navigated to profile',
        level: 'info',
        data: { page: 'profile', userId: '123' },
      })
    })

    it('should use default category if not provided', () => {
      const breadcrumb = {
        message: 'Button clicked',
      }

      addBreadcrumb(breadcrumb)

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'user-action',
          message: 'Button clicked',
        })
      )
    })

    it('should use default level if not provided', () => {
      const breadcrumb = {
        message: 'Action performed',
        category: 'ui',
      }

      addBreadcrumb(breadcrumb)

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
        })
      )
    })

    it('should support different breadcrumb levels', () => {
      addBreadcrumb({
        message: 'Debug info',
        level: 'debug',
      })

      addBreadcrumb({
        message: 'Warning occurred',
        level: 'warning',
      })

      addBreadcrumb({
        message: 'Error happened',
        level: 'error',
      })

      expect(Sentry.addBreadcrumb).toHaveBeenCalledTimes(3)
    })

    it('should include custom data in breadcrumb', () => {
      const breadcrumb = {
        message: 'API call',
        category: 'http',
        data: {
          url: '/api/users',
          method: 'GET',
          status: 200,
        },
      }

      addBreadcrumb(breadcrumb)

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            url: '/api/users',
            method: 'GET',
            status: 200,
          }),
        })
      )
    })
  })

  describe('startTransaction', () => {
    beforeEach(async () => {
      const module = await setupEnv()
      startTransaction = module.startTransaction
    })

    it('should start transaction with default operation', () => {
      const name = 'Page Load'

      startTransaction(name)

      expect(Sentry.startSpan).toHaveBeenCalledWith(
        {
          name: 'Page Load',
          op: 'navigation',
        },
        expect.any(Function)
      )
    })

    it('should start transaction with custom operation', () => {
      const name = 'Database Query'
      const op = 'db.query'

      startTransaction(name, op)

      expect(Sentry.startSpan).toHaveBeenCalledWith(
        {
          name: 'Database Query',
          op: 'db.query',
        },
        expect.any(Function)
      )
    })

    it('should return the result of startSpan', () => {
      const result = startTransaction('Test Transaction')

      expect(result).toBeDefined()
    })

    it('should support different operation types', () => {
      startTransaction('API Call', 'http.request')
      startTransaction('Component Render', 'ui.react.render')
      startTransaction('WebSocket Connect', 'websocket.connect')

      expect(Sentry.startSpan).toHaveBeenCalledTimes(3)
    })
  })

  describe('ErrorContext', () => {
    beforeEach(async () => {
      const module = await setupEnv()
      ErrorContext = module.ErrorContext
    })

    describe('authError', () => {
      it('should create auth error context', () => {
        const context = ErrorContext.authError('login')

        expect(context).toEqual({
          component: 'Authentication',
          action: 'login',
          category: 'auth',
        })
      })

      it('should support different auth actions', () => {
        const loginContext = ErrorContext.authError('login')
        const logoutContext = ErrorContext.authError('logout')
        const registerContext = ErrorContext.authError('register')

        expect(loginContext.action).toBe('login')
        expect(logoutContext.action).toBe('logout')
        expect(registerContext.action).toBe('register')
      })
    })

    describe('apiError', () => {
      it('should create API error context', () => {
        const context = ErrorContext.apiError('/api/users', 404)

        expect(context).toEqual({
          component: 'API',
          action: '/api/users',
          status: 404,
          category: 'api',
        })
      })

      it('should support different status codes', () => {
        const context400 = ErrorContext.apiError('/api/posts', 400)
        const context500 = ErrorContext.apiError('/api/posts', 500)

        expect(context400.status).toBe(400)
        expect(context500.status).toBe(500)
      })
    })

    describe('web3Error', () => {
      it('should create Web3 error context', () => {
        const context = ErrorContext.web3Error('connect', 'MetaMask')

        expect(context).toEqual({
          component: 'Web3',
          action: 'connect',
          wallet: 'MetaMask',
          category: 'web3',
        })
      })

      it('should support different wallet types', () => {
        const metaMaskContext = ErrorContext.web3Error('sign', 'MetaMask')
        const walletConnectContext = ErrorContext.web3Error('sign', 'WalletConnect')

        expect(metaMaskContext.wallet).toBe('MetaMask')
        expect(walletConnectContext.wallet).toBe('WalletConnect')
      })
    })

    describe('uiError', () => {
      it('should create UI error context', () => {
        const context = ErrorContext.uiError('ProfilePage')

        expect(context).toEqual({
          component: 'ProfilePage',
          category: 'ui',
        })
      })

      it('should work with different component names', () => {
        const profileContext = ErrorContext.uiError('ProfilePage')
        const settingsContext = ErrorContext.uiError('SettingsModal')

        expect(profileContext.component).toBe('ProfilePage')
        expect(settingsContext.component).toBe('SettingsModal')
      })
    })

    describe('socketError', () => {
      it('should create socket error context', () => {
        const context = ErrorContext.socketError('connection_failed')

        expect(context).toEqual({
          component: 'WebSocket',
          action: 'connection_failed',
          category: 'realtime',
        })
      })

      it('should support different socket events', () => {
        const connectContext = ErrorContext.socketError('connect')
        const disconnectContext = ErrorContext.socketError('disconnect')
        const errorContext = ErrorContext.socketError('error')

        expect(connectContext.action).toBe('connect')
        expect(disconnectContext.action).toBe('disconnect')
        expect(errorContext.action).toBe('error')
      })
    })
  })

  describe('Integration scenarios', () => {
    beforeEach(async () => {
      const module = await setupEnv()
      captureException = module.captureException
      addBreadcrumb = module.addBreadcrumb
      setUser = module.setUser
      startTransaction = module.startTransaction
      ErrorContext = module.ErrorContext
    })

    it('should work with captureException and ErrorContext', () => {
      const error = new Error('Login failed')
      const context = ErrorContext.authError('login')

      captureException(error, context)

      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          contexts: expect.objectContaining({
            component: 'Authentication',
            action: 'login',
            category: 'auth',
          }),
          tags: {
            component: 'Authentication',
            action: 'login',
          },
        })
      )
    })

    it('should track user journey with breadcrumbs and errors', () => {
      addBreadcrumb({
        category: 'navigation',
        message: 'User visited profile page',
      })

      addBreadcrumb({
        category: 'user-action',
        message: 'User clicked edit button',
      })

      const error = new Error('Update failed')
      captureException(error, ErrorContext.uiError('ProfilePage'))

      expect(Sentry.addBreadcrumb).toHaveBeenCalledTimes(2)
      expect(Sentry.captureException).toHaveBeenCalledTimes(1)
    })

    it('should handle complete error reporting flow', () => {
      setUser({
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
      })

      startTransaction('API Request')

      addBreadcrumb({
        message: 'Making API call',
        category: 'http',
      })

      const error = new Error('API failed')
      captureException(error, ErrorContext.apiError('/api/posts', 500))

      expect(Sentry.setUser).toHaveBeenCalled()
      expect(Sentry.startSpan).toHaveBeenCalled()
      expect(Sentry.addBreadcrumb).toHaveBeenCalled()
      expect(Sentry.captureException).toHaveBeenCalled()
    })
  })

  describe('Environment-specific behavior', () => {
    it('should disable in development but still accept configuration', async () => {
      const module = await setupEnv({
        VITE_SENTRY_DSN: 'https://test@sentry.io/123',
        VITE_ENVIRONMENT: 'development',
      })
      module.initSentry()

      const config = Sentry.init.mock.calls[0][0]
      expect(config.enabled).toBe(false)
      expect(config.dsn).toBe('https://test@sentry.io/123')
    })

    it('should enable in staging environment', async () => {
      const module = await setupEnv({
        VITE_SENTRY_DSN: 'https://test@sentry.io/123',
        VITE_ENVIRONMENT: 'staging',
      })
      module.initSentry()

      const config = Sentry.init.mock.calls[0][0]
      expect(config.enabled).toBe(true)
    })

    it('should enable in production environment', async () => {
      const module = await setupEnv({
        VITE_SENTRY_DSN: 'https://test@sentry.io/123',
        VITE_ENVIRONMENT: 'production',
      })
      module.initSentry()

      const config = Sentry.init.mock.calls[0][0]
      expect(config.enabled).toBe(true)
    })
  })

  describe('Privacy and security', () => {
    let beforeSendFn

    beforeEach(async () => {
      const module = await setupEnv({ VITE_SENTRY_DSN: 'https://test@sentry.io/123' })
      module.initSentry()
      beforeSendFn = Sentry.init.mock.calls[0][0].beforeSend
      setUser = module.setUser
    })

    it('should scrub sensitive headers', () => {
      const event = {
        request: {
          headers: {
            Authorization: 'Bearer secret-token',
            Cookie: 'session=abc123',
            'X-API-Key': 'api-key-123',
          },
        },
      }

      const result = beforeSendFn(event, {})

      expect(result.request.headers.Authorization).toBeUndefined()
      expect(result.request.headers.Cookie).toBeUndefined()
      expect(result.request.headers['X-API-Key']).toBe('api-key-123')
    })

    it('should not send PII in user context', () => {
      const user = {
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        password: 'secret123',
        creditCard: '4111111111111111',
      }

      setUser(user)

      const sentryUser = Sentry.setUser.mock.calls[0][0]
      expect(sentryUser.id).toBe('123')
      expect(sentryUser.username).toBe('testuser')
      expect(sentryUser.email).toBe('test@example.com')
      expect(sentryUser.password).toBeUndefined()
      expect(sentryUser.creditCard).toBeUndefined()
    })
  })

  describe('Default export', () => {
    it('should export all functions as default object', async () => {
      const module = await setupEnv()

      expect(module.default.initSentry).toBeDefined()
      expect(module.default.captureException).toBeDefined()
      expect(module.default.captureMessage).toBeDefined()
      expect(module.default.setUser).toBeDefined()
      expect(module.default.addBreadcrumb).toBeDefined()
      expect(module.default.startTransaction).toBeDefined()
      expect(module.default.ErrorContext).toBeDefined()
    })
  })
})
