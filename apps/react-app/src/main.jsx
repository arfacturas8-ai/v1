import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Theme } from '@radix-ui/themes'
import '@radix-ui/themes/styles.css'
import './styles/radix-theme.css'
import './index.css'
import './styles/mobileOptimizations.css'
import App from './App'
import { initGoogleAnalytics } from './lib/analytics'
import { initSentry } from './lib/sentry'
import { logEnvironmentStatus } from './lib/envValidation'

// Validate environment variables
logEnvironmentStatus()

// Initialize error tracking and analytics
initSentry()
initGoogleAnalytics()

// Error boundary for production
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('App Error:', error, info)
    console.error('Error stack:', error.stack)
    console.error('Component stack:', info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          background: 'var(--bg-primary)',
          color: '#00D4FF',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ color: '#FF4444', marginBottom: '1rem' }}>Something went wrong</h1>
            <p style={{ color: '#888', marginBottom: '2rem' }}>Please refresh the page to try again</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #0052FF 0%, #00D4FF 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// Mount app
const container = document.getElementById('root')
const root = ReactDOM.createRoot(container)


try {
  root.render(
    <ErrorBoundary>
      <BrowserRouter>
        <Theme appearance="light" accentColor="violet" grayColor="gray" radius="medium">
          <App />
        </Theme>
      </BrowserRouter>
    </ErrorBoundary>
  )
} catch (error) {
  console.error('Failed to render React app:', error)
  document.getElementById('root').innerHTML = '<div style="color: red; padding: 20px;">React failed to load: ' + error.message + '</div>'
  // Remove loading screen on error
  const loading = document.getElementById('loading')
  if (loading) loading.remove()
}
export default container
