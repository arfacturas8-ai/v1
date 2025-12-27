/**
 * ForbiddenPage.jsx
 * 403 access forbidden page with iOS-inspired design aesthetic
 * Features: Gradient text, soft shadows, smooth hover effects
 */

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
        background: '#FAFAFA'
      }}
    >
      <div style={{
        textAlign: 'center',
        maxWidth: '800px',
        color: '#1A1A1A'
      }}>
        <div
          aria-hidden="true"
          style={{
            fontSize: isMobile ? '80px' : '120px',
            fontWeight: 'bold',
            lineHeight: '1',
            marginBottom: isMobile ? '20px' : '24px',
            background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: 'transparent'
          }}
        >
          403
        </div>

        <h1 style={{
          color: '#1A1A1A',
          fontSize: isMobile ? '20px' : '24px',
          fontWeight: '600',
          marginBottom: isMobile ? '16px' : '24px'
        }}>
          Access Forbidden
        </h1>

        <p style={{
          color: '#666666',
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
              background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 4px 16px rgba(99, 102, 241, 0.3)'
            }}
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
              background: 'white',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              borderRadius: '12px',
              color: '#1A1A1A',
              fontSize: '16px',
              fontWeight: '600',
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#F9FAFB'
              e.target.style.borderColor = 'rgba(0, 0, 0, 0.08)'
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white'
              e.target.style.borderColor = 'rgba(0, 0, 0, 0.06)'
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}
          >
            Go Home
          </Link>
        </nav>
      </div>
    </div>
  )
}
