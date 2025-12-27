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
        style={{background: "var(--bg-primary)"}} className="error-page-container min-h-screen flex items-center justify-center  px-3 sm:px-5 font-sans"
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
          <h1 style={{color: "var(--text-primary)"}} className="text-[32px] sm:text-5xl font-bold  mb-4 sm:mb-6 tracking-tight">
            500 - Server Error
          </h1>

          {/* Error Message */}
          <p className="text-base sm:text-lg text-[#94a3b8] leading-relaxed mb-3 max-w-[480px] mx-auto">
            Oops! Something went wrong on our end. Our team has been notified and we're working to fix the issue.
          </p>

          {/* Error ID */}
          <div style={{borderColor: "var(--border-subtle)"}} className="card inline-block px-3 sm:px-4 py-1.5 sm:py-2   border  rounded-md sm:rounded-lg mb-6 sm:mb-10">
            <p className="text-xs text-[#64748b] m-0">
              Error ID: <span className="text-[#94a3b8] font-mono">{errorId}</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center flex-wrap mt-6 sm:mt-10">
            {/* Try Again Button with Gradient */}
            <button
              onClick={handleRefresh}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 32px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#FFFFFF',
                background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(88, 166, 255, 0.4)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 6px 20px rgba(88, 166, 255, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 4px 12px rgba(88, 166, 255, 0.4)'
              }}
              aria-label="Try again by refreshing the page"
            >
              <RefreshCw size={18} aria-hidden="true" />
              Try Again
            </button>

            {/* Go Home Button */}
            <button
              onClick={handleGoHome}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 32px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#1A1A1A',
                background: '#FFFFFF',
                border: '1px solid #E8EAED',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.background = '#F9FAFB'
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.background = '#FFFFFF'
                e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}
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

