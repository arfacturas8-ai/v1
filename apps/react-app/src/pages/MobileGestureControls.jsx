import React, { memo } from 'react'
import { Smartphone } from 'lucide-react'
import { useResponsive } from '../hooks/useResponsive'

const MobileGestureControls = () => {
  const { isMobile, isTablet, spacing, fontSize, padding, containerMaxWidth } = useResponsive()

  const compactSpacing = {
    formGap: isMobile ? 16 : isTablet ? 14 : 12,
    headerMargin: isMobile ? 20 : isTablet ? 18 : 16,
    logoMargin: isMobile ? 12 : isTablet ? 10 : 8,
    labelMargin: isMobile ? 8 : 6,
    inputPadding: isMobile ? 12 : 10,
    dividerMargin: isMobile ? 20 : isTablet ? 18 : 14,
    cardPadding: isMobile ? 20 : isTablet ? 24 : 20,
    sectionGap: isMobile ? 16 : isTablet ? 14 : 12
  }

  const styles = {
    container: {
      minHeight: '100vh',
      padding: isMobile ? `${spacing.lg}px` : '20px',
      background: 'var(--bg-primary)'
    },
    wrapper: {
      maxWidth: containerMaxWidth.lg,
      margin: '0 auto'
    },
    card: {
      background: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(12px)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '12px',
      padding: padding.card,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
    },
    icon: {
      width: isMobile ? '40px' : '48px',
      height: isMobile ? '40px' : '48px',
      color: '#000000',
      marginBottom: `${spacing.md}px`
    },
    title: {
      fontSize: `${fontSize['2xl']}px`,
      fontWeight: 'bold',
      marginBottom: `${spacing.lg}px`,
      color: '#ffffff'
    },
    gestureList: {
      display: 'flex',
      flexDirection: 'column',
      gap: `${spacing.md}px`
    },
    gestureItem: {
      padding: `${spacing.md}px`,
      borderRadius: '12px',
      border: '1px solid var(--border-subtle)'
    },
    gestureTitle: {
      fontWeight: '600',
      marginBottom: '8px',
      color: '#ffffff',
      fontSize: `${fontSize.base}px`
    },
    gestureDescription: {
      fontSize: `${fontSize.sm}px`,
      color: '#666666',
      margin: 0
    }
  }

  return (
    <div style={styles.container} role="main" aria-label="Mobile gesture controls page">
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <Smartphone style={styles.icon} />
          <h1 style={styles.title}>Mobile Gestures</h1>
          <div style={styles.gestureList}>
            <div style={{...styles.gestureItem, background: 'rgba(88, 166, 255, 0.1)'}}>
              <h3 style={styles.gestureTitle}>Swipe Right</h3>
              <p style={styles.gestureDescription}>Open navigation drawer</p>
            </div>
            <div style={{...styles.gestureItem, background: 'rgba(163, 113, 247, 0.1)'}}>
              <h3 style={styles.gestureTitle}>Swipe Left</h3>
              <p style={styles.gestureDescription}>Go back</p>
            </div>
            <div style={{...styles.gestureItem, background: 'rgba(34, 197, 94, 0.1)'}}>
              <h3 style={styles.gestureTitle}>Pull to Refresh</h3>
              <p style={styles.gestureDescription}>Reload content</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(MobileGestureControls)

