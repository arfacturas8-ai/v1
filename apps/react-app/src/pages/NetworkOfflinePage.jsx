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
        background: 'var(--bg-primary)'
      }}
    >
      <div style={{
        textAlign: 'center',
        maxWidth: '640px',
        width: '100%',
        color: 'var(--text-primary)'
      }}>
        <div style={{
          width: isMobile ? '96px' : '120px',
          height: isMobile ? '96px' : '120px',
          background: 'rgba(139, 148, 158, 0.1)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <WifiOff
            style={{
              width: '64px',
              height: '64px',
              flexShrink: 0,
              color: 'var(--text-secondary)'
            }}
            aria-hidden="true"
          />
        </div>
        <h1 style={{
          color: 'var(--text-primary)',
          fontSize: isMobile ? '24px' : '32px',
          fontWeight: 'bold',
          marginBottom: '16px'
        }}>
          No Internet Connection
        </h1>
        <p style={{
          color: 'var(--text-secondary)',
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
            background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
            border: 'none',
            borderRadius: '16px',
            color: 'var(--text-inverse)',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.opacity = '0.9'}
          onMouseLeave={(e) => e.target.style.opacity = '1'}
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
