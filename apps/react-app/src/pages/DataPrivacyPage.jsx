import React, { memo } from 'react'
import { useResponsive } from '../hooks/useResponsive'

const DataPrivacyPage = () => {
  const { isMobile, isTablet } = useResponsive()

  const padding = isMobile ? '16px' : isTablet ? '24px' : '80px'
  const headerOffset = isMobile ? '56px' : '72px'

  return (
    <div
      role="main"
      aria-label="Data privacy page"
      style={{
        minHeight: '100vh',
        paddingTop: headerOffset,
        paddingLeft: padding,
        paddingRight: padding,
        paddingBottom: '48px',
        background: 'var(--bg-primary)'
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: isMobile ? '24px' : '32px',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.1)'
          }}
        >
          <h1 style={{
            color: 'var(--text-primary)',
            fontSize: isMobile ? '24px' : '32px',
            fontWeight: 'bold',
            marginBottom: '24px'
          }}>
            Data Privacy
          </h1>
          <p style={{
            color: 'var(--text-primary)',
            fontSize: isMobile ? '14px' : '16px',
            lineHeight: '1.6'
          }}>
            This is the Data Privacy page. Content will be implemented here.
          </p>
        </div>
      </div>
    </div>
  )
}

export default memo(DataPrivacyPage)
