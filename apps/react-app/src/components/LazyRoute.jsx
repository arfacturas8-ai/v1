import React, { Suspense } from 'react'
import ErrorBoundary from './ErrorBoundary'
import PageLoader from './PageLoader'

/**
 * LazyRoute - Wrapper for lazy-loaded route components
 *
 * Fixes React error #306 by providing individual Suspense boundaries
 * for each lazy-loaded component, preventing Suspense updates during hydration
 *
 * @param {Object} props
 * @param {React.Component} props.component - Lazy-loaded component
 * @param {string} props.name - Route name for error tracking
 * @param {React.Component} props.fallback - Optional custom fallback
 */
function LazyRoute({ component: Component, name = 'Route', fallback, ...props }) {
  const defaultFallback = (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0A0A0B'
    }}>
      <PageLoader fullScreen />
    </div>
  )

  return (
    <ErrorBoundary name={name}>
      <Suspense fallback={fallback || defaultFallback}>
        <Component {...props} />
      </Suspense>
    </ErrorBoundary>
  )
}

export default LazyRoute
