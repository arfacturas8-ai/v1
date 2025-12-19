/**
 * NotificationSettingsPage.jsx
 * Modernized notification settings page with iOS aesthetic
 * Features: Explicit light theme colors, inline styles, iOS-style components
 */

import React, { memo } from 'react'
import { useResponsive } from '../hooks/useResponsive'

const NotificationSettingsPage = () => {
  const { isMobile, isTablet } = useResponsive()

  const padding = isMobile ? '16px' : isTablet ? '24px' : '80px'
  const headerOffset = isMobile ? '56px' : '72px'

  return (
    <div
      role="main"
      aria-label="Notification settings page"
      style={{
        minHeight: '100vh',
        paddingTop: headerOffset,
        paddingLeft: padding,
        paddingRight: padding,
        paddingBottom: '48px',
        background: '#FAFAFA'
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div
          style={{
            background: 'white',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            borderRadius: '16px',
            padding: isMobile ? '24px' : '32px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
          }}
        >
          <h1 style={{
            color: '#000000',
            fontSize: isMobile ? '24px' : '32px',
            fontWeight: 'bold',
            marginBottom: '24px',
            margin: 0
          }}>
            Notification Settings
          </h1>
          <p style={{
            color: '#666666',
            fontSize: isMobile ? '14px' : '16px',
            lineHeight: '1.6',
            margin: '24px 0 0 0'
          }}>
            Component placeholder - functional but needs full implementation
          </p>
        </div>
      </div>
    </div>
  )
}

export default memo(NotificationSettingsPage)
