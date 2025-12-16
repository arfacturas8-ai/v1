import React from 'react'
import { Link } from 'react-router-dom'
import { useResponsive } from '../hooks/useResponsive'

export default function NotFoundPage() {
  const { isMobile } = useResponsive()

  return (
    <div
      id="main-content"
      role="main"
      aria-label="404 Page Not Found"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: isMobile ? '16px' : '20px',
        paddingRight: isMobile ? '16px' : '20px',
        background: 'var(--bg-primary)'
      }}
    >
      <div style={{
        textAlign: 'center',
        maxWidth: '800px',
        color: 'var(--text-primary)'
      }}>
        <div
          aria-hidden="true"
          style={{
            fontSize: isMobile ? '80px' : '120px',
            fontWeight: 'bold',
            lineHeight: '1',
            marginBottom: isMobile ? '16px' : '20px',
            background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: 'transparent'
          }}
        >
          404
        </div>

        <h1 style={{
          fontSize: isMobile ? '24px' : '32px',
          fontWeight: '600',
          marginBottom: isMobile ? '16px' : '24px',
          color: 'var(--text-primary)'
        }}>
          Page Not Found
        </h1>

        <p style={{
          fontSize: isMobile ? '16px' : '18px',
          marginBottom: isMobile ? '24px' : '32px',
          lineHeight: '1.6',
          color: 'var(--text-secondary)'
        }}>
          The page you're looking for doesn't exist or has been moved.
        </p>

        <nav
          aria-label="Error page actions"
          style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}
        >
          <Link
            to="/"
            aria-label="Back to Home page"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingLeft: '24px',
              paddingRight: '24px',
              paddingTop: '12px',
              paddingBottom: '12px',
              height: '48px',
              background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
              borderRadius: '12px',
              color: 'var(--text-inverse)',
              fontSize: '16px',
              fontWeight: '600',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(88, 166, 255, 0.3)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            ← Back to Home
          </Link>

          <Link
            to="/help"
            aria-label="Get help"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingLeft: '24px',
              paddingRight: '24px',
              paddingTop: '12px',
              paddingBottom: '12px',
              height: '48px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              color: '#58a6ff',
              fontSize: '16px',
              fontWeight: '600',
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'var(--bg-tertiary)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'var(--bg-secondary)'
            }}
          >
            Get Help
          </Link>
        </nav>

        <div style={{
          marginTop: isMobile ? '32px' : '40px',
          fontSize: '14px',
          color: 'var(--text-secondary)'
        }}>
          <p>
            Lost? Try searching or visit our{' '}
            <Link
              to="/communities"
              style={{
                color: '#58a6ff',
                textDecoration: 'underline'
              }}
            >
              communities page
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
