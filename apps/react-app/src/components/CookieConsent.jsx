import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { X, Cookie, Settings } from 'lucide-react'
import { useLocation } from 'react-router-dom'

/**
 * GDPR-compliant cookie consent banner
 * Shows on first visit, stores granular preferences in localStorage
 * Integrates with Google Analytics consent mode
 */
const CookieConsent = () => {
  const location = useLocation()
  const [isVisible, setIsVisible] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [preferences, setPreferences] = useState({
    necessary: true, // Always true, can't be disabled
    analytics: false,
    marketing: false,
    preferences: false,
  })

  // Don't show on doc-progress page
  if (location.pathname === '/doc-progress') {
    return null
  }

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookieConsent')
    if (!consent) {
      // Show banner after 1 second delay for better UX
      setTimeout(() => setIsVisible(true), 1000)
    }
  }, [])

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem('cookieConsent', JSON.stringify(allAccepted))
    setIsVisible(false)

    // Initialize analytics if accepted
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'granted',
      })
    }
  }

  const handleRejectAll = () => {
    const rejected = {
      necessary: true, // Necessary cookies always enabled
      analytics: false,
      marketing: false,
      preferences: false,
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem('cookieConsent', JSON.stringify(rejected))
    setIsVisible(false)

    // Deny analytics
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
      })
    }
  }

  const handleSavePreferences = () => {
    const savedPrefs = {
      ...preferences,
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem('cookieConsent', JSON.stringify(savedPrefs))
    setIsVisible(false)

    // Update analytics consent
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: preferences.analytics ? 'granted' : 'denied',
        ad_storage: preferences.marketing ? 'granted' : 'denied',
      })
    }
  }

  if (!isVisible) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1200, // Toast/notification layer
        padding: '0 var(--space-4) var(--space-4)',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          background: 'linear-gradient(135deg, rgba(22, 27, 34, 0.98), rgba(13, 17, 23, 0.98))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(88, 166, 255, 0.3)',
          borderRadius: 'var(--radius-2xl)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 80px rgba(88, 166, 255, 0.15)',
          padding: 'var(--space-6)',
          pointerEvents: 'auto',
          animation: 'slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <style>
          {`
            @keyframes slideUp {
              from {
                transform: translateY(100%);
                opacity: 0;
              }
              to {
                transform: translateY(0);
                opacity: 1;
              }
            }
          `}
        </style>

        {/* Close button */}
        <button
          onClick={handleRejectAll}
          style={{
            position: 'absolute',
            top: 'var(--space-4)',
            right: 'var(--space-4)',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: 'var(--space-2)',
            borderRadius: 'var(--radius-md)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
            e.currentTarget.style.color = 'var(--text-primary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {!showSettings ? (
          // Main banner
          <>
            <div style={{ display: 'flex', alignItems: 'start', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, var(--cryb-primary), var(--cryb-secondary))',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Cookie size={24} color="white" />
              </div>
              <div style={{ flex: 1, paddingRight: 'var(--space-8)' }}>
                <h3
                  style={{
                    color: 'var(--text-primary)',
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 700,
                    marginBottom: 'var(--space-2)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  We value your privacy
                </h3>
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: 'var(--font-size-sm)',
                    lineHeight: 1.6,
                    marginBottom: 'var(--space-3)',
                  }}
                >
                  We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic.
                  By clicking "Accept All", you consent to our use of cookies.{' '}
                  <Link
                    to="/privacy#cookies"
                    style={{
                      color: 'var(--cryb-primary)',
                      textDecoration: 'none',
                      fontWeight: 500,
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                  >
                    Read our Cookie Policy
                  </Link>
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--space-3)',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={() => setShowSettings(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-3) var(--space-4)',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 'var(--radius-lg)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                }}
              >
                <Settings size={16} />
                Customize
              </button>

              <button
                onClick={handleRejectAll}
                style={{
                  padding: 'var(--space-3) var(--space-5)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 'var(--radius-lg)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                }}
              >
                Reject All
              </button>

              <button
                onClick={handleAcceptAll}
                style={{
                  padding: 'var(--space-3) var(--space-5)',
                  background: 'linear-gradient(135deg, var(--cryb-primary), var(--cryb-secondary))',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  color: 'white',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(88, 166, 255, 0.3)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(88, 166, 255, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(88, 166, 255, 0.3)'
                }}
              >
                Accept All
              </button>
            </div>
          </>
        ) : (
          // Settings panel
          <>
            <h3
              style={{
                color: 'var(--text-primary)',
                fontSize: 'var(--font-size-lg)',
                fontWeight: 700,
                marginBottom: 'var(--space-4)',
                paddingRight: 'var(--space-8)',
              }}
            >
              Cookie Preferences
            </h3>

            <div style={{ marginBottom: 'var(--space-5)' }}>
              {/* Necessary Cookies */}
              <div
                style={{
                  padding: 'var(--space-4)',
                  background: 'rgba(88, 166, 255, 0.05)',
                  border: '1px solid rgba(88, 166, 255, 0.15)',
                  borderRadius: 'var(--radius-lg)',
                  marginBottom: 'var(--space-3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                  <h4 style={{ color: 'var(--text-primary)', fontSize: 'var(--font-size-md)', fontWeight: 600 }}>
                    Necessary Cookies
                  </h4>
                  <div
                    style={{
                      padding: 'var(--space-1) var(--space-3)',
                      background: 'rgba(88, 166, 255, 0.2)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      color: 'var(--cryb-primary)',
                    }}
                  >
                    Always Active
                  </div>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', lineHeight: 1.5 }}>
                  Required for the website to function properly. These cookies enable core functionality such as security, network management, and accessibility.
                </p>
              </div>

              {/* Analytics Cookies */}
              <CookieToggle
                label="Analytics Cookies"
                description="Help us understand how visitors interact with our website by collecting and reporting information anonymously."
                checked={preferences.analytics}
                onChange={(checked) => setPreferences(prev => ({ ...prev, analytics: checked }))}
              />

              {/* Marketing Cookies */}
              <CookieToggle
                label="Marketing Cookies"
                description="Used to track visitors across websites to display relevant advertisements and measure campaign performance."
                checked={preferences.marketing}
                onChange={(checked) => setPreferences(prev => ({ ...prev, marketing: checked }))}
              />

              {/* Preferences Cookies */}
              <CookieToggle
                label="Preference Cookies"
                description="Enable the website to remember information that changes the way it behaves or looks, like your preferred language or region."
                checked={preferences.preferences}
                onChange={(checked) => setPreferences(prev => ({ ...prev, preferences: checked }))}
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 'var(--space-3)',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                paddingTop: 'var(--space-4)',
              }}
            >
              <button
                onClick={() => setShowSettings(false)}
                style={{
                  padding: 'var(--space-3) var(--space-5)',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 'var(--radius-lg)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                Back
              </button>

              <button
                onClick={handleSavePreferences}
                style={{
                  padding: 'var(--space-3) var(--space-5)',
                  background: 'linear-gradient(135deg, var(--cryb-primary), var(--cryb-secondary))',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  color: 'white',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(88, 166, 255, 0.3)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(88, 166, 255, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(88, 166, 255, 0.3)'
                }}
              >
                Save Preferences
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Cookie toggle component
const CookieToggle = ({ label, description, checked, onChange }) => {
  return (
    <div
      style={{
        padding: 'var(--space-4)',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 'var(--space-3)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
        <h4 style={{ color: 'var(--text-primary)', fontSize: 'var(--font-size-md)', fontWeight: 600 }}>
          {label}
        </h4>
        <button
          onClick={() => onChange(!checked)}
          role="switch"
          aria-checked={checked}
          style={{
            width: '44px',
            height: '24px',
            background: checked
              ? 'linear-gradient(135deg, var(--cryb-primary), var(--cryb-secondary))'
              : 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            borderRadius: 'var(--radius-full)',
            cursor: 'pointer',
            position: 'relative',
            transition: 'all 0.3s ease',
            boxShadow: checked ? '0 2px 8px rgba(88, 166, 255, 0.4)' : 'none',
          }}
        >
          <div
            style={{
              width: '18px',
              height: '18px',
              background: 'white',
              borderRadius: '50%',
              position: 'absolute',
              top: '3px',
              left: checked ? '23px' : '3px',
              transition: 'left 0.3s ease',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            }}
          />
        </button>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', lineHeight: 1.5 }}>
        {description}
      </p>
    </div>
  )
}

export default CookieConsent
