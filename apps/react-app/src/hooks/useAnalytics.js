/**
 * React Hook for Google Analytics
 *
 * Automatically tracks page views on route changes
 * and provides analytics tracking functions
 */

import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPageView, trackEvent, trackUserAction } from '../lib/analytics'

/**
 * Hook to automatically track page views
 */
export const usePageTracking = () => {
  const location = useLocation()

  useEffect(() => {
    // Track page view on route change
    trackPageView(location.pathname + location.search)
  }, [location])
}

/**
 * Hook to get analytics tracking functions
 */
export const useAnalytics = () => {
  return {
    trackEvent,
    trackUserAction,
    trackPageView,
  }
}

export default useAnalytics
