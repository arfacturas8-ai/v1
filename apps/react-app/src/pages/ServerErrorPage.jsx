import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'
import {
  SkipToContent,
  announce
} from '../utils/accessibility.jsx'

export default function ServerErrorPage() {
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState(false)

  // Generate a unique error ID for support reference
  const errorId = React.useMemo(() => {
    return `ERR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
  }, [])

  useEffect(() => {
    // Trigger entrance animation
    setIsVisible(true)

    // Announce error to screen readers
    announce('Server error occurred. Error 500.', 'assertive')
  }, [])

  const handleRefresh = () => {
    window.location.reload()
  }

  const handleGoHome = () => {
    navigate('/')
  }

  return (
    <>
      <SkipToContent />
      <div
        className="error-page-container min-h-screen flex items-center justify-center bg-[#0d1117] px-3 sm:px-5 font-sans"
        role="main"
        aria-label="Server error page"
      >
        <div
          className={`error-content max-w-2xl w-full text-center transition-all duration-600 ease-in-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          }`}
        >
          {/* Error Icon */}
          <div className={`inline-flex items-center justify-center w-[120px] h-[120px] rounded-full bg-red-500/10 border-2 border-red-500/30 mb-6 sm:mb-8 ${isVisible ? '-slow' : ''}`}>
            <AlertTriangle
              size={56}
              className="text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]"
              aria-hidden="true"
            />
          </div>

          {/* Error Heading */}
          <h1 className="text-[32px] sm:text-5xl font-bold text-white mb-4 sm:mb-6 tracking-tight">
            500 - Server Error
          </h1>

          {/* Error Message */}
          <p className="text-base sm:text-lg text-[#94a3b8] leading-relaxed mb-3 max-w-[480px] mx-auto">
            Oops! Something went wrong on our end. Our team has been notified and we're working to fix the issue.
          </p>

          {/* Error ID */}
          <div className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-md sm:rounded-lg mb-6 sm:mb-10">
            <p className="text-xs text-[#64748b] m-0">
              Error ID: <span className="text-[#94a3b8] font-mono">{errorId}</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center flex-wrap mt-6 sm:mt-10">
            {/* Try Again Button with Gradient */}
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-5 sm:px-8 py-3 sm:py-3.5 text-base font-semibold text-white bg-gradient-to-br from-[#58a6ff] to-[#a371f7] border-none rounded-xl cursor-pointer transition-all shadow-[0_4px_12px_rgba(88,166,255,0.4)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(59,130,246,0.5)]"
              aria-label="Try again by refreshing the page"
            >
              <RefreshCw size={18} aria-hidden="true" />
              Try Again
            </button>

            {/* Go Home Button */}
            <button
              onClick={handleGoHome}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-5 sm:px-8 py-3 sm:py-3.5 text-base font-semibold text-[#e2e8f0] bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] cursor-pointer transition-all backdrop-blur-[10px] hover:bg-[#161b22]/60 backdrop-blur-xl hover:border-white/10 hover:-translate-y-0.5"
              aria-label="Go to home page"
            >
              <Home size={18} aria-hidden="true" />
              Go Home
            </button>
          </div>
        </div>

        {/* Keyframe animation for pulse effect */}
        <style>{`
          @keyframes pulse-slow {
            0%, 100% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.05);
              opacity: 0.8;
            }
          }
          .-slow {
            animation: pulse-slow 2s ease-in-out infinite;
          }
        `}</style>
      </div>
    </>
  )
}

