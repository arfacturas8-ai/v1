import React from 'react'
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react'
import { captureException } from '../lib/sentry'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    const { errorCount } = this.state

    this.setState({
      error,
      errorInfo,
      errorCount: errorCount + 1
    })

    // Log error to console in development
    if (import.meta.env.MODE === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo)
    }

    // Report to Sentry
    captureException(error, {
      component: this.props.name || 'ErrorBoundary',
      componentStack: errorInfo.componentStack,
      errorCount: errorCount + 1
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  handleGoBack = () => {
    window.history.back()
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    const { hasError, error, errorInfo, errorCount } = this.state
    const { children, fallback, showDetails = false } = this.props

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return typeof fallback === 'function'
          ? fallback(error, this.handleReset)
          : fallback
      }

      // Default error UI with dark theme
      return (
        <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px'
}}>
          <div style={{
  width: '100%'
}}>
            <div style={{
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px',
  padding: '32px'
}}>
              {/* Error Icon */}
              <div style={{
  display: 'flex',
  justifyContent: 'center'
}}>
                <div style={{
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                  <AlertTriangle style={{
  width: '32px',
  height: '32px'
}} />
                </div>
              </div>

              {/* Error Title */}
              <h1 style={{
  fontWeight: 'bold',
  color: '#ffffff',
  textAlign: 'center'
}}>
                Something went wrong
              </h1>

              {/* Error Description */}
              <p style={{
  color: '#A0A0A0',
  textAlign: 'center'
}}>
                {errorCount > 2
                  ? "This error keeps happening. Try reloading the page or going back home."
                  : "We've encountered an unexpected error. Don't worry, your data is safe."}
              </p>

              {/* Error Details */}
              {error && (
                <div style={{
  padding: '16px',
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px'
}}>
                  <div className="text-sm font-mono text-red-400 mb-2">
                    {typeof error === 'string' ? error : (error?.message || 'An unexpected error occurred')}
                  </div>
                  {errorInfo && (
                    <details className="mt-2">
                      <summary style={{
  color: '#A0A0A0'
}}>
                        Component Stack
                      </summary>
                      <pre style={{
  color: '#A0A0A0',
  overflow: 'auto'
}}>
                        {errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Recovery Actions */}
              <div style={{
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
}}>
                <button
                  onClick={this.handleReset}
                  style={{
  flex: '1',
  paddingLeft: '24px',
  paddingRight: '24px',
  paddingTop: '12px',
  paddingBottom: '12px',
  color: '#ffffff',
  fontWeight: '500',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px'
}}
                >
                  <RefreshCw style={{
  width: '16px',
  height: '16px'
}} />
                  Try Again
                </button>

                <button
                  onClick={this.handleGoBack}
                  style={{
  flex: '1',
  paddingLeft: '24px',
  paddingRight: '24px',
  paddingTop: '12px',
  paddingBottom: '12px',
  color: '#ffffff',
  fontWeight: '500',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px'
}}
                >
                  <ArrowLeft style={{
  width: '16px',
  height: '16px'
}} />
                  Go Back
                </button>

                <button
                  onClick={this.handleGoHome}
                  style={{
  flex: '1',
  paddingLeft: '24px',
  paddingRight: '24px',
  paddingTop: '12px',
  paddingBottom: '12px',
  color: '#ffffff',
  fontWeight: '500',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px'
}}
                >
                  <Home style={{
  width: '16px',
  height: '16px'
}} />
                  Home
                </button>
              </div>

              {/* Reload if persists */}
              {errorCount > 1 && (
                <div className="mt-4 pt-4 border-t border-[#202225]">
                  <button
                    onClick={this.handleReload}
                    style={{
  width: '100%',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  color: '#ffffff'
}}
                  >
                    Reload entire page
                  </button>
                </div>
              )}

              {/* Support */}
              <div style={{
  textAlign: 'center',
  color: '#A0A0A0'
}}>
                Need help?{' '}
                <a href="/help" className="text-blue-500 hover:text-blue-400 underline">
                  Contact Support
                </a>
              </div>
            </div>

            {/* Error ID */}
            <div style={{
  textAlign: 'center',
  color: '#A0A0A0'
}}>
              Error ID: {Date.now().toString(36)}
            </div>
          </div>
        </div>
      )
    }

    return children
  }
}

/**
 * Simple error fallback
 */
export function SimpleErrorFallback({ error, reset }) {
  return (
    <div style={{
  padding: '24px',
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px'
}}>
      <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
        <AlertTriangle style={{
  width: '20px',
  height: '20px'
}} />
        <h3 style={{
  fontWeight: '600',
  color: '#ffffff'
}}>Something went wrong</h3>
      </div>
      <p style={{
  color: '#A0A0A0'
}}>
        {error?.message || 'An unexpected error occurred'}
      </p>
      <button
        onClick={reset}
        style={{
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  color: '#ffffff',
  borderRadius: '12px'
}}
      >
        Try again
      </button>
    </div>
  )
}

/**
 * HOC to wrap components
 */
export function withErrorBoundary(Component, errorBoundaryProps = {}) {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`
  return WrappedComponent
}



export default ErrorBoundary