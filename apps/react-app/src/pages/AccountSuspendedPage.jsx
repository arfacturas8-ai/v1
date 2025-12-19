/**
 * AccountSuspendedPage.jsx
 * Account suspension page with iOS-inspired design aesthetic
 * Features: Card-based layout, soft shadows, smooth hover effects
 */

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
        background: '#FAFAFA',
        color: '#666666'
      }}
    >
      <div
        role="alert"
        aria-live="polite"
        style={{
          maxWidth: '672px',
          width: '100%',
          background: 'white',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          borderRadius: '16px',
          padding: isMobile ? '32px' : '48px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
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
          color: '#000000'
        }}>Account Suspended</h1>

        <p style={{
          fontSize: isMobile ? '14px' : '16px',
          marginBottom: '32px',
          lineHeight: '1.6',
          color: '#666666',
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
            color: '#666666'
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
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
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
              background: 'white',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              borderRadius: '12px',
              color: '#666666',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = 'rgba(0, 0, 0, 0.08)'
              e.target.style.color = '#000000'
              e.target.style.background = '#F9FAFB'
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = 'rgba(0, 0, 0, 0.06)'
              e.target.style.color = '#666666'
              e.target.style.background = 'white'
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)'
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
