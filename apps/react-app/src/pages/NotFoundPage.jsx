/**
 * NotFoundPage.jsx
 * 404 error page with iOS-inspired design aesthetic
 * Features: Gradient text, soft shadows, smooth hover effects
 */

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
            marginBottom: isMobile ? '16px' : '20px',
            background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
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
          color: '#1A1A1A'
        }}>
          Page Not Found
        </h1>

        <p style={{
          fontSize: isMobile ? '16px' : '18px',
          marginBottom: isMobile ? '24px' : '32px',
          lineHeight: '1.6',
          color: '#666666'
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
              background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              borderRadius: '12px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              textDecoration: 'none',
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
            Get Help
          </Link>
        </nav>

        <div style={{
          marginTop: isMobile ? '32px' : '40px',
          fontSize: '14px',
          color: '#666666'
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
