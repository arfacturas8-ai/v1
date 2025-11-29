/**
 * Sentry Error Tracking Integration for CRYB Platform
 *
 * Provides error monitoring, performance tracking,
 * and user session replay.
 */

import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || ''
const SENTRY_ENVIRONMENT = import.meta.env.VITE_ENVIRONMENT || 'production'
const SENTRY_RELEASE = import.meta.env.VITE_APP_VERSION || '1.0.0'

/**
 * Initialize Sentry
 * Call this in main.jsx before rendering the app
 */
export const initSentry = () => {
  if (!SENTRY_DSN) {
    return
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    release: `cryb-platform@${SENTRY_RELEASE}`,

    // Performance Monitoring
    integrations: [
      new BrowserTracing({
        tracePropagationTargets: [
          'localhost',
          'platform.cryb.ai',
          /^https:\/\/api\.cryb\.ai/,
        ],
      }),
    ],

    // Performance sampling
    tracesSampleRate: 0.2, // 20% of transactions for performance monitoring

    // Error sampling
    sampleRate: 1.0, // 100% of errors

    // Session Replay (optional, privacy-sensitive)
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of error sessions

    // PII Scrubbing (GDPR compliance)
    beforeSend(event, hint) {
      // Remove sensitive data
      if (event.request) {
        delete event.request.cookies
        if (event.request.headers) {
          delete event.request.headers.Authorization
          delete event.request.headers.Cookie
        }
      }

      // Filter out non-critical errors
      const error = hint.originalException
      if (error && error.message) {
        // Ignore network errors (user offline)
        if (error.message.includes('NetworkError')) {
          return null
        }
        // Ignore canceled requests
        if (error.message.includes('AbortError')) {
          return null
        }
      }

      return event
    },

    // Ignore specific errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'Network request failed',
      'Failed to fetch',
      'NetworkError',
      'AbortError',
    ],

    // Disable in development
    enabled: SENTRY_ENVIRONMENT !== 'development',
  })
}

/**
 * Capture an exception
 */
export const captureException = (error, context = {}) => {
  console.error('[Sentry] Error:', error, context)

  Sentry.captureException(error, {
    contexts: context,
    tags: {
      component: context.component,
      action: context.action,
    },
  })
}

/**
 * Capture a message
 */
export const captureMessage = (message, level = 'info', context = {}) => {

  Sentry.captureMessage(message, {
    level,
    contexts: context,
  })
}

/**
 * Set user context
 */
export const setUser = (user) => {
  if (!user) {
    Sentry.setUser(null)
    return
  }

  const sentryUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    // Don't send PII unless explicitly needed
  }

  Sentry.setUser(sentryUser)
}

/**
 * Add breadcrumb
 */
export const addBreadcrumb = (breadcrumb) => {

  Sentry.addBreadcrumb({
    category: breadcrumb.category || 'user-action',
    message: breadcrumb.message,
    level: breadcrumb.level || 'info',
    data: breadcrumb.data,
  })
}

/**
 * Start a performance transaction (Sentry v10+ API)
 */
export const startTransaction = (name, op = 'navigation') => {

  // Use Sentry v10+ startSpan API
  return Sentry.startSpan({
    name,
    op,
  }, (span) => span)
}

/**
 * Common error contexts
 */
export const ErrorContext = {
  // Authentication errors
  authError: (action) => ({
    component: 'Authentication',
    action,
    category: 'auth',
  }),

  // API errors
  apiError: (endpoint, status) => ({
    component: 'API',
    action: endpoint,
    status,
    category: 'api',
  }),

  // Web3 errors
  web3Error: (action, wallet) => ({
    component: 'Web3',
    action,
    wallet,
    category: 'web3',
  }),

  // UI errors
  uiError: (component) => ({
    component,
    category: 'ui',
  }),

  // Socket errors
  socketError: (event) => ({
    component: 'WebSocket',
    action: event,
    category: 'realtime',
  }),
}

export default {
  initSentry,
  captureException,
  captureMessage,
  setUser,
  addBreadcrumb,
  startTransaction,
  ErrorContext,
}
