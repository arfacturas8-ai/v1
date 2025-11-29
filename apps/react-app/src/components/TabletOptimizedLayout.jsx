import React, { useState, useEffect } from 'react'
import { useOrientation } from './mobile/TabletLayout'

/**
 * Enhanced Layout Component for Tablet Optimization
 * Provides adaptive layouts that work perfectly on tablets and mobile devices
 */
function TabletOptimizedLayout({ 
  children, 
  sidebar = null, 
  className = '', 
  enablePullToRefresh = false,
  onRefresh = null
}) {
  const { orientation, isTablet, isPortrait, isLandscape } = useOrientation()
  const [refreshing, setRefreshing] = useState(false)
  const [pullY, setPullY] = useState(0)
  const [startY, setStartY] = useState(0)
  
  // Handle pull to refresh
  const handleTouchStart = (e) => {
    if (!enablePullToRefresh) return
    setStartY(e.touches[0].clientY)
  }
  
  const handleTouchMove = (e) => {
    if (!enablePullToRefresh || refreshing) return
    
    const currentY = e.touches[0].clientY
    const diff = currentY - startY
    
    if (diff > 0 && window.scrollY === 0) {
      setPullY(Math.min(diff * 0.5, 100))
      e.preventDefault()
    }
  }
  
  const handleTouchEnd = () => {
    if (!enablePullToRefresh) return
    
    if (pullY > 60 && onRefresh) {
      setRefreshing(true)
      onRefresh().finally(() => {
        setRefreshing(false)
        setPullY(0)
      })
    } else {
      setPullY(0)
    }
  }
  
  useEffect(() => {
    if (!enablePullToRefresh) return
    
    const element = document.querySelector('.tablet-optimized-layout')
    if (element) {
      element.addEventListener('touchstart', handleTouchStart, { passive: false })
      element.addEventListener('touchmove', handleTouchMove, { passive: false })
      element.addEventListener('touchend', handleTouchEnd, { passive: true })
      
      return () => {
        element.removeEventListener('touchstart', handleTouchStart)
        element.removeEventListener('touchmove', handleTouchMove)
        element.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [enablePullToRefresh, startY, pullY])
  
  // Determine layout type based on screen size and orientation
  const getLayoutType = () => {
    const width = window.innerWidth
    
    if (width < 768) return 'mobile'
    if (width >= 768 && width < 1024) {
      return isLandscape ? 'tablet-landscape' : 'tablet-portrait'
    }
    return 'desktop'
  }
  
  const layoutType = getLayoutType()
  
  // Layout styles based on screen type
  const getLayoutStyles = () => {
    const baseStyles = {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }
    
    switch (layoutType) {
      case 'mobile':
        return {
          ...baseStyles,
          paddingBottom: 'calc(var(--touch-target-lg) + env(safe-area-inset-bottom))'
        }
        
      case 'tablet-portrait':
        return {
          ...baseStyles,
          display: 'grid',
          gridTemplateColumns: '1fr',
          gridTemplateRows: sidebar ? 'auto 1fr' : '1fr',
          padding: 'var(--space-md)'
        }
        
      case 'tablet-landscape':
        return {
          ...baseStyles,
          display: 'grid',
          gridTemplateColumns: sidebar ? '280px 1fr' : '1fr',
          padding: 'var(--space-lg)'
        }
        
      case 'desktop':
        return {
          ...baseStyles,
          display: 'grid',
          gridTemplateColumns: sidebar ? '320px 1fr' : '1fr',
          padding: 'var(--space-xl)'
        }
        
      default:
        return baseStyles
    }
  }
  
  return (
    <div 
      className={`tablet-optimized-layout ${className}`}
      style={{
        ...getLayoutStyles(),
        transform: `translateY(${pullY}px)`,
        transition: pullY === 0 ? 'transform 0.3s ease' : 'none'
      }}
    >
      {/* Pull to refresh indicator */}
      {enablePullToRefresh && pullY > 0 && (
        <div 
          className="pull-to-refresh-indicator"
          style={{
            position: 'absolute',
            top: `-${60 - pullY}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: 'var(--space-md)',
            background: 'var(--bg-glass)',
            borderRadius: 'var(--radius-full)',
            backdropFilter: 'blur(var(--blur-md))',
            opacity: Math.min(pullY / 60, 1),
            zIndex: 1000
          }}
        >
          {refreshing ? (
            <div style={{
  width: '24px',
  height: '24px',
  borderRadius: '50%'
}}></div>
          ) : (
            <div style={{ 
              transform: `rotate(${Math.min(pullY * 3, 180)}deg)`,
              transition: 'transform 0.1s ease'
            }}>
              ↓
            </div>
          )}
        </div>
      )}
      
      {/* Sidebar for larger screens */}
      {sidebar && layoutType !== 'mobile' && (
        <aside className="layout-sidebar">
          {React.cloneElement(sidebar, { layoutType, isTablet, orientation })}
        </aside>
      )}
      
      {/* Main content area */}
      <main className="layout-main" style={{ overflow: 'auto' }}>
        {React.cloneElement(children, { layoutType, isTablet, orientation })}
      </main>
    </div>
  )
}

/**
 * Responsive Card Grid for Tablets
 * Automatically adjusts columns based on screen size
 */
function TabletCardGrid({ 
  items = [], 
  renderCard, 
  className = '',
  minCardWidth = '280px',
  gap = 'var(--space-md)',
  loading = false,
  loadingCount = 6
}) {
  const { isTablet, orientation } = useOrientation()
  
  const getColumns = () => {
    const width = window.innerWidth
    
    if (width < 480) return 1
    if (width < 768) return 2
    if (width < 1024) return orientation === 'landscape' ? 3 : 2
    return 4
  }
  
  const columns = getColumns()
  
  const gridStyles = {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}, 1fr))`,
    gap,
    width: '100%',
    maxWidth: isTablet ? '100%' : '1200px',
    margin: '0 auto'
  }
  
  if (loading) {
    return (
      <div className={`tablet-card-grid ${className}`} style={gridStyles}>
        {Array(loadingCount).fill(0).map((_, index) => (
          <div 
            key={index} 
            className="card animate-pulse"
            style={{ 
              height: '200px',
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-lg)'
            }}
          />
        ))}
      </div>
    )
  }
  
  return (
    <div className={`tablet-card-grid ${className}`} style={gridStyles}>
      {items.map((item, index) => (
        <div key={item.id || index} className="tablet-card-item">
          {renderCard(item, index)}
        </div>
      ))}
    </div>
  )
}

/**
 * Tablet-Optimized List View
 * Better spacing and layout for tablet screens
 */
function TabletListView({ 
  items = [], 
  renderItem, 
  className = '',
  divided = true,
  padding = 'var(--space-md)'
}) {
  const { isTablet, orientation } = useOrientation()
  
  const listStyles = {
    width: '100%',
    maxWidth: isTablet && orientation === 'landscape' ? '800px' : '100%',
    margin: '0 auto'
  }
  
  return (
    <div 
      className={`tablet-list-view ${className} ${divided ? 'divide-y' : ''}`} 
      style={listStyles}
    >
      {items.map((item, index) => (
        <div 
          key={item.id || index} 
          className="tablet-list-item"
          style={{ padding }}
        >
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  )
}

/**
 * Split View for Tablet Master-Detail Interfaces
 */
function TabletSplitView({
  masterPanel,
  detailPanel,
  masterWidth = '300px',
  showDetail = true,
  className = ''
}) {
  const { isTablet, orientation } = useOrientation()
  
  // On tablet portrait or mobile, show one panel at a time
  if (!isTablet || orientation === 'portrait') {
    return (
      <div className={`tablet-split-mobile ${className}`}>
        {showDetail ? detailPanel : masterPanel}
      </div>
    )
  }
  
  // Tablet landscape - show both panels
  return (
    <div 
      className={`tablet-split-landscape ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `${masterWidth} 1fr`,
        height: '100%',
        gap: 'var(--space-lg)'
      }}
    >
      <div className="master-panel" style={{ overflowY: 'auto' }}>
        {masterPanel}
      </div>
      <div className="detail-panel" style={{ overflowY: 'auto' }}>
        {detailPanel}
      </div>
    </div>
  )
}

/**
 * Tablet FAB with adaptive positioning
 */
function TabletFAB({ 
  icon, 
  label, 
  onClick, 
  position = 'bottom-right',
  className = ''
}) {
  const { isTablet, orientation } = useOrientation()
  
  const getPosition = () => {
    if (!isTablet) {
      // Mobile - avoid bottom navigation
      if (position.includes('bottom')) {
        return position.replace('bottom', 'bottom-16')
      }
    }
    
    return position
  }
  
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-16-right': 'bottom-20 right-6', // Above mobile nav
    'bottom-16-left': 'bottom-20 left-6'
  }
  
  const actualPosition = getPosition()
  
  return (
    <button
      onClick={onClick}
      style={{
  position: 'fixed',
  width: '56px',
  height: '56px',
  color: '#ffffff',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center'
}}
      title={label}
      aria-label={label}
    >
      {icon}
    </button>
  )
}



export default TabletOptimizedLayout
export { TabletCardGrid, TabletListView, TabletSplitView, TabletFAB }
