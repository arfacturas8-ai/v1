import React, { useState, useEffect } from 'react'
import { useResponsive } from '../hooks/useResponsive'
import { useLocation } from 'react-router-dom'

const CookieConsent = () => {
  const { isMobile } = useResponsive()
  const location = useLocation()
  const [showConsent, setShowConsent] = useState(false)

  // Don't show on doc-progress page
  if (location.pathname === '/doc-progress') {
    return null
  }

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent')
    if (!consent) {
      setShowConsent(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted')
    setShowConsent(false)
  }

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'declined')
    setShowConsent(false)
  }

  if (!showConsent) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[10000] p-4 bg-gray-900/95 backdrop-blur-xl border-t border-white/10">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1 text-sm sm:text-base text-gray-300">
          <p className="mb-2">
            <strong className="text-white">🍪 We use cookies</strong>
          </p>
          <p>
            We use cookies to enhance your experience, analyze site traffic, and for marketing purposes.
            By clicking "Accept", you consent to our use of cookies.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleDecline}
            className="px-4 sm:px-6 py-2.5 sm:py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm sm:text-base font-medium transition-colors min-h-[44px]"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="px-4 sm:px-6 py-2.5 sm:py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg text-sm sm:text-base font-medium transition-all min-h-[44px]"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}

export default CookieConsent
