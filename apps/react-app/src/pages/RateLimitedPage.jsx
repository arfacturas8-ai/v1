import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Clock, ArrowLeft, Home, AlertCircle } from 'lucide-react'

export default function RateLimitedPage() {
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(60)

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleGoBack = () => {
    navigate(-1)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div id="main-content" role="main" aria-label="429 Rate Limited" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#FAFAFA',
      padding: isMobile ? '16px' : '32px'
    }}>
      <div style={{
        textAlign: 'center',
        color: '#1A1A1A',
        maxWidth: '720px',
        width: '100%'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: isMobile ? '96px' : '120px',
          height: isMobile ? '96px' : '120px',
          background: 'rgba(88, 166, 255, 0.1)',
          border: '1px solid rgba(88, 166, 255, 0.3)',
          borderRadius: '50%',
          marginBottom: isMobile ? '24px' : '32px',
          position: 'relative'
        }} aria-hidden="true">
          <Clock size={isMobile ? 48 : 64} style={{ color: '#58a6ff' }} aria-hidden="true" />
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '4px solid rgba(88, 166, 255, 0.3)',
            borderTop: '4px solid #58a6ff',
            animation: 'spin 2s linear infinite'
          }} aria-hidden="true" />
        </div>

        <div style={{
          fontSize: isMobile ? '72px' : '112px',
          fontWeight: '700',
          lineHeight: 1,
          marginBottom: '20px',
          background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }} aria-hidden="true">
          429
        </div>

        <h1 style={{
          fontSize: isMobile ? '28px' : '36px',
          fontWeight: '600',
          color: '#1A1A1A',
          marginBottom: isMobile ? '16px' : '24px'
        }}>
          Slow Down There!
        </h1>

        <p style={{
          fontSize: isMobile ? '16px' : '18px',
          color: '#666666',
          marginBottom: isMobile ? '24px' : '32px',
          lineHeight: '1.6'
        }}>
          You've made too many requests. Please wait a moment before trying again.
        </p>

        <div style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          padding: isMobile ? '24px' : '32px',
          marginBottom: isMobile ? '24px' : '32px',
          border: '1px solid #E8EAED',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
        }} role="timer" aria-live="polite" aria-atomic="true">
          <div style={{
            fontSize: isMobile ? '48px' : '64px',
            fontWeight: '700',
            marginBottom: '12px',
            letterSpacing: '0.05em',
            color: '#58a6ff'
          }} aria-label={`${countdown} seconds remaining`}>
            {formatTime(countdown)}
          </div>
          <p style={{
            fontSize: '14px',
            color: '#666666',
            margin: 0
          }}>
            Time until you can try again
          </p>
        </div>

        <div style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          padding: isMobile ? '16px' : '20px',
          marginBottom: isMobile ? '24px' : '32px',
          border: '1px solid #E8EAED',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
          textAlign: 'left'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: isMobile ? '12px' : '16px'
          }}>
            <AlertCircle size={20} style={{
              marginTop: '2px',
              flexShrink: 0,
              color: '#58a6ff'
            }} aria-hidden="true" />
            <div>
              <h3 style={{
                fontSize: isMobile ? '14px' : '16px',
                fontWeight: '600',
                color: '#1A1A1A',
                marginBottom: '8px'
              }}>
                Why did this happen?
              </h3>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                fontSize: isMobile ? '13px' : '14px',
                color: '#666666',
                lineHeight: '1.6'
              }}>
                <li style={{ marginBottom: '4px' }}>• You sent too many requests in a short time</li>
                <li style={{ marginBottom: '4px' }}>• Rate limits help protect our service for everyone</li>
                <li>• Automated scripts may trigger this protection</li>
              </ul>
            </div>
          </div>
        </div>

        <nav style={{
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? '12px' : '16px',
          alignItems: 'center'
        }} aria-label="Error page actions">
          <div style={{
            display: 'flex',
            gap: isMobile ? '12px' : '16px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <button
              onClick={handleGoBack}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: isMobile ? '12px 20px' : '14px 32px',
                background: 'linear-gradient(90deg, #58a6ff 0%, #a371f7 100%)',
                color: '#FFFFFF',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: isMobile ? '14px' : '16px',
                border: 'none',
                boxShadow: '0 4px 12px rgba(88, 166, 255, 0.3)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              aria-label="Go back to previous page"
            >
              <ArrowLeft size={20} aria-hidden="true" />
              Go Back
            </button>

            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: isMobile ? '12px 20px' : '14px 32px',
                background: '#FFFFFF',
                color: '#58a6ff',
                border: '1px solid #E8EAED',
                borderRadius: '12px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: isMobile ? '14px' : '16px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F5F5F5'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#FFFFFF'}
              aria-label="Go to home page"
            >
              <Home size={20} aria-hidden="true" />
              Go Home
            </Link>
          </div>
        </nav>

        <div style={{
          marginTop: isMobile ? '32px' : '48px',
          fontSize: isMobile ? '12px' : '14px',
          color: '#666666'
        }}>
          <p>
            Having issues?{' '}
            <Link
              to="/help"
              style={{
                color: '#58a6ff',
                textDecoration: 'underline',
                fontWeight: '600',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#a371f7'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#58a6ff'}
            >
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
