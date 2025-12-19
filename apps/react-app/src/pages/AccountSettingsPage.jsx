/**
 * AccountSettingsPage.jsx
 * Modernized account settings page with iOS aesthetic
 * Features: Explicit light theme colors, inline styles, iOS-style components
 */

import React, { memo } from 'react'
import { useResponsive } from '../hooks/useResponsive'

const AccountSettingsPage = () => {
  const { isMobile, isTablet } = useResponsive()

  const padding = isMobile ? '16px' : isTablet ? '24px' : '80px'
  const headerOffset = isMobile ? '56px' : '72px'

  return (
    <div
      role="main"
      aria-label="Account settings page"
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
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{
              color: '#000000',
              fontSize: isMobile ? '24px' : '32px',
              fontWeight: '600',
              marginBottom: '8px',
              margin: 0
            }}>
              Account Settings
            </h1>
            <p style={{
              color: '#666666',
              fontSize: isMobile ? '14px' : '16px',
              margin: '8px 0 0 0'
            }}>
              Manage your account preferences and settings
            </p>
          </div>
          <p style={{
            color: '#000000',
            fontSize: isMobile ? '14px' : '16px',
            lineHeight: '1.6',
            margin: 0
          }}>
            This is the Account Settings page. Content will be implemented here.
          </p>
        </div>
      </div>
    </div>
  )
}

export default memo(AccountSettingsPage)
