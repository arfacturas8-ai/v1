/**
 * NetworkOfflinePage.jsx
 * Network offline error page with iOS-inspired design aesthetic
 * Features: Soft shadows, rounded corners, smooth hover effects
 */

import React, { memo } from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'
import { useResponsive } from '../hooks/useResponsive'

const NetworkOfflinePage = () => {
  const { isMobile } = useResponsive()

  return (
    <div
      role="main"
      aria-label="Network offline page"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: '#FAFAFA'
      }}
    >
      <div style={{
        textAlign: 'center',
        maxWidth: '640px',
        width: '100%',
        color: '#000000'
      }}>
        <div style={{
          width: isMobile ? '96px' : '120px',
          height: isMobile ? '96px' : '120px',
          background: 'white',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)'
        }}>
          <WifiOff
            style={{
              width: '64px',
              height: '64px',
              flexShrink: 0,
              color: '#666666'
            }}
            aria-hidden="true"
          />
        </div>
        <h1 style={{
          color: '#000000',
          fontSize: isMobile ? '24px' : '32px',
          fontWeight: 'bold',
          marginBottom: '16px'
        }}>
          No Internet Connection
        </h1>
        <p style={{
          color: '#666666',
          fontSize: isMobile ? '14px' : '16px',
          marginBottom: '32px',
          lineHeight: '1.6'
        }}>
          Please check your network connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          aria-label="Reload page"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            paddingLeft: '28px',
            paddingRight: '28px',
            paddingTop: '14px',
            paddingBottom: '14px',
            height: '48px',
            background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
            border: 'none',
            borderRadius: '16px',
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
          <RefreshCw
            style={{ width: '24px', height: '24px', flexShrink: 0 }}
            aria-hidden="true"
          />
          Try Again
        </button>
      </div>
    </div>
  )
}

export default memo(NetworkOfflinePage)
