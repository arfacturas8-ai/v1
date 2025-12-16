import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useResponsive } from '../hooks/useResponsive'

export default function ForbiddenPage() {
  const navigate = useNavigate()
  const { isMobile } = useResponsive()

  return (
    <div
      role="main"
      aria-label="Forbidden page"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: isMobile ? '12px' : '16px',
        paddingRight: isMobile ? '12px' : '16px',
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
            marginBottom: isMobile ? '20px' : '24px',
            background: 'linear-gradient(90deg, #58a6ff 0%, #a371f7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: 'transparent'
          }}
        >
          403
        </div>

        <h1 style={{
          color: 'var(--text-primary)',
          fontSize: isMobile ? '20px' : '24px',
          fontWeight: '600',
          marginBottom: isMobile ? '16px' : '24px'
        }}>
          Access Forbidden
        </h1>

        <p style={{
          color: 'var(--text-primary)',
          fontSize: isMobile ? '16px' : '18px',
          marginBottom: isMobile ? '24px' : '32px',
          lineHeight: '1.6'
        }}>
          You don't have permission to access this page.
        </p>

        <nav
          aria-label="Navigation"
          style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              paddingLeft: isMobile ? '24px' : '32px',
              paddingRight: isMobile ? '24px' : '32px',
              paddingTop: '12px',
              paddingBottom: '12px',
              height: '48px',
              background: 'linear-gradient(90deg, #58a6ff 0%, #a371f7 100%)',
              border: 'none',
              borderRadius: '12px',
              color: 'var(--text-inverse)',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            Go Back
          </button>

          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingLeft: isMobile ? '24px' : '32px',
              paddingRight: isMobile ? '24px' : '32px',
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
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'var(--bg-tertiary)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'var(--bg-secondary)'
            }}
          >
            Go Home
          </Link>
        </nav>
      </div>
    </div>
  )
}
