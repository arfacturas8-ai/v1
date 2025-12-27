/**
 * React Hook for Platform Tour
 * Triggers the Driver.js tour for first-time users
 */

import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { startPlatformTour } from '../utils/platformTour'

export const usePlatformTour = () => {
  const location = useLocation()

  useEffect(() => {
    // Only start tour on /home page, and only once per session
    if ((location.pathname === '/home' || location.pathname === '/') && !sessionStorage.getItem('tour_triggered')) {
      sessionStorage.setItem('tour_triggered', 'true')
      startPlatformTour()
    }
  }, [location.pathname])
}
