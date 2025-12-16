import React, { memo } from 'react'
import { Ban, Mail, FileText } from 'lucide-react'
import { useResponsive } from '../hooks/useResponsive'

const AccountSuspendedPage = () => {
  const { isMobile } = useResponsive()

  return (
    <div
      role="main"
      aria-label="Account suspended page"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '20px' : '40px',
        background: 'var(--bg-primary)',
        color: 'var(--text-secondary)'
      }}
    >
      <div
        role="alert"
        aria-live="polite"
        style={{
          maxWidth: '672px',
          width: '100%',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: isMobile ? '32px' : '48px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}
      >
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: isMobile ? '80px' : '96px',
          height: isMobile ? '80px' : '96px',
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '50%',
          marginBottom: '24px'
        }}>
          <Ban
            style={{
              width: isMobile ? '40px' : '48px',
              height: isMobile ? '40px' : '48px',
              color: '#ef4444',
              flexShrink: 0
            }}
            aria-hidden="true"
          />
        </div>

        <h1 style={{
          fontSize: isMobile ? '30px' : '36px',
          fontWeight: 'bold',
          marginBottom: '16px',
          color: 'var(--text-primary)'
        }}>Account Suspended</h1>

        <p style={{
          fontSize: isMobile ? '14px' : '16px',
          marginBottom: '32px',
          lineHeight: '1.6',
          color: 'var(--text-secondary)',
          margin: '0 0 32px 0'
        }}>
          Your account has been suspended due to violation of our community guidelines.
        </p>

        <div style={{
          padding: '16px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '8px',
          marginBottom: '32px',
          textAlign: 'left'
        }}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#ef4444',
            marginBottom: '8px',
            margin: '0 0 8px 0'
          }}>Reason for suspension:</h3>
          <p style={{
            fontSize: '14px',
            margin: 0,
            color: 'var(--text-secondary)'
          }}>Multiple reports of spam and inappropriate content.</p>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '16px'
        }}>
          <button
            aria-label="Contact support about suspension"
            style={{
              flex: 1,
              minWidth: '140px',
              minHeight: '48px',
              padding: '12px 24px',
              background: 'linear-gradient(90deg, #58a6ff 0%, #a371f7 100%)',
              border: 'none',
              borderRadius: '12px',
              color: 'var(--text-primary)',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'opacity 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '0.9'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            <Mail style={{ width: "24px", height: "24px", flexShrink: 0 }} aria-hidden="true" />
            Contact Support
          </button>

          <button
            aria-label="Appeal account suspension"
            style={{
              flex: 1,
              minWidth: '140px',
              minHeight: '48px',
              padding: '12px 24px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              color: 'var(--text-secondary)',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = 'var(--border-primary)'
              e.target.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = 'var(--border-subtle)'
              e.target.style.color = 'var(--text-secondary)'
            }}
          >
            <FileText style={{ width: "24px", height: "24px", flexShrink: 0 }} aria-hidden="true" />
            Appeal Suspension
          </button>
        </div>
      </div>
    </div>
  )
}

export default memo(AccountSuspendedPage)
