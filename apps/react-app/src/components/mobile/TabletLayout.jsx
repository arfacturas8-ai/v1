import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Tablet-Optimized Layout Components
 * Provides adaptive layouts that work great on tablets in both orientations
 */

/**
 * Responsive Layout Container
 * Adapts layout based on screen size and orientation
 */
export const ResponsiveLayout = ({ 
  children,
  className = '',
  sidebar = null,
  header = null,
  footer = null,
  sidebarWidth = '280px',
  collapsibleSidebar = true
}) => {
  const [isTablet, setIsTablet] = useState(false)
  const [isLandscape, setIsLandscape] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  useEffect(() => {
    const checkViewport = () => {
      const width = window.innerWidth
      const height = window.innerHeight

      setIsTablet(width >= 768 && width < 1024)
      setIsLandscape(width > height)

      // Auto-collapse sidebar on small tablets in portrait
      if (width < 900 && height > width) {
        setSidebarCollapsed(true)
      }
    }

    const handleOrientationChange = () => {
      setTimeout(checkViewport, 100)
    }

    checkViewport()
    window.addEventListener('resize', checkViewport)
    window.addEventListener('orientationchange', handleOrientationChange)

    return () => {
      window.removeEventListener('resize', checkViewport)
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  }, [])
  
  const layoutStyles = {
    display: 'grid',
    minHeight: '100vh',
    gridTemplateRows: header ? 'auto 1fr auto' : '1fr auto',
    gridTemplateColumns: sidebar && !sidebarCollapsed && (isTablet || !isTablet) 
      ? `${sidebarWidth} 1fr` 
      : '1fr',
    gridTemplateAreas: sidebar && !sidebarCollapsed 
      ? header 
        ? `"sidebar header" "sidebar main" "sidebar footer"`
        : `"sidebar main" "sidebar footer"`
      : header
        ? `"header" "main" "footer"`
        : `"main" "footer"`
  }
  
  return (
    <div className={`responsive-layout ${className}`} style={layoutStyles}>
      {/* Header */}
      {header && (
        <header 
          className="layout-header"
          style={{ gridArea: 'header' }}
        >
          {React.cloneElement(header, {
            isTablet,
            isLandscape,
            sidebarCollapsed,
            onToggleSidebar: collapsibleSidebar ? () => setSidebarCollapsed(!sidebarCollapsed) : undefined
          })}
        </header>
      )}
      
      {/* Sidebar */}
      {sidebar && !sidebarCollapsed && (
        <aside 
          className="layout-sidebar"
          style={{ 
            gridArea: 'sidebar',
            width: sidebarWidth,
            borderRight: '1px solid var(--border-primary)',
            background: 'var(--bg-secondary)'
          }}
        >
          {React.cloneElement(sidebar, { isTablet, isLandscape })}
        </aside>
      )}
      
      {/* Main Content */}
      <main 
        className="layout-main"
        style={{ gridArea: 'main', overflow: 'auto' }}
      >
        {React.cloneElement(children, { isTablet, isLandscape, sidebarCollapsed })}
      </main>
      
      {/* Footer */}
      {footer && (
        <footer 
          className="layout-footer"
          style={{ gridArea: 'footer' }}
        >
          {React.cloneElement(footer, { isTablet, isLandscape })}
        </footer>
      )}
    </div>
  )
}

/**
 * Split View Layout for Tablets
 * Perfect for master-detail interfaces
 */
export const SplitViewLayout = ({
  masterPanel,
  detailPanel,
  masterWidth = '40%',
  className = '',
  showDetail = true,
  onBackToMaster = null
}) => {
  const [isTablet, setIsTablet] = useState(false)
  const [orientation, setOrientation] = useState('portrait')
  
  useEffect(() => {
    const checkOrientation = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setIsTablet(width >= 768 && width < 1280)
      setOrientation(width > height ? 'landscape' : 'portrait')
    }
    
    const handleOrientationChangeDelayed = () => {
      setTimeout(checkOrientation, 100)
    }

    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', handleOrientationChangeDelayed)

    return () => {
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', handleOrientationChangeDelayed)
    }
  }, [])
  
  // On tablet portrait or mobile, show only one panel at a time
  if (!isTablet || orientation === 'portrait') {
    return (
      <div className={`split-view-mobile ${className}`}>
        {showDetail ? (
          <div className="detail-panel">
            {onBackToMaster && (
              <button 
                onClick={onBackToMaster}
                className="btn btn-ghost mb-md visible-tablet"
              >
                ← Back
              </button>
            )}
            {detailPanel}
          </div>
        ) : (
          <div className="master-panel">
            {masterPanel}
          </div>
        )}
      </div>
    )
  }
  
  // Tablet landscape - show both panels
  return (
    <div 
      className={`split-view-tablet ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `${masterWidth} 1fr`,
        height: '100%',
        overflow: 'hidden'
      }}
    >
      <div 
        className="master-panel"
        style={{
          borderRight: '1px solid var(--border-primary)',
          overflowY: 'auto'
        }}
      >
        {masterPanel}
      </div>
      
      <div 
        className="detail-panel"
        style={{ overflowY: 'auto' }}
      >
        {detailPanel}
      </div>
    </div>
  )
}

/**
 * Adaptive Grid Layout
 * Automatically adjusts grid columns based on screen size
 */
export const AdaptiveGrid = ({
  children,
  minItemWidth = '280px',
  gap = 'var(--space-md)',
  className = ''
}) => {
  const gridStyles = {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fill, minmax(${minItemWidth}, 1fr))`,
    gap,
    width: '100%'
  }
  
  return (
    <div className={`adaptive-grid ${className}`} style={gridStyles}>
      {children}
    </div>
  )
}

/**
 * Tablet Navigation Drawer
 * Collapsible navigation suitable for tablets
 */
export const TabletDrawer = ({
  isOpen,
  onClose,
  children,
  position = 'left',
  width = '320px',
  className = ''
}) => {
  const [isTablet, setIsTablet] = useState(false)
  
  useEffect(() => {
    const checkTablet = () => {
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024)
    }
    
    checkTablet()
    window.addEventListener('resize', checkTablet)
    return () => window.removeEventListener('resize', checkTablet)
  }, [])
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])
  
  if (!isTablet) return null
  
  const drawerStyles = {
    position: 'fixed',
    top: 0,
    [position]: isOpen ? 0 : `-${width}`,
    width,
    height: '100vh',
    background: 'var(--bg-secondary)',
    borderRight: position === 'left' ? '1px solid var(--border-primary)' : 'none',
    borderLeft: position === 'right' ? '1px solid var(--border-primary)' : 'none',
    zIndex: 'var(--z-modal)',
    transform: `translateX(${isOpen ? '0' : position === 'left' ? '-100%' : '100%'})`,
    transition: 'transform 0.3s ease',
    overflowY: 'auto'
  }
  
  const overlayStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'var(--bg-tertiary)',
    zIndex: 'var(--z-modal-backdrop)',
    opacity: isOpen ? 1 : 0,
    visibility: isOpen ? 'visible' : 'hidden',
    transition: 'opacity 0.3s ease, visibility 0.3s ease'
  }
  
  return (
    <>
      {/* Overlay */}
      <div style={overlayStyles} onClick={onClose} />
      
      {/* Drawer */}
      <div className={`tablet-drawer ${className}`} style={drawerStyles}>
        {children}
      </div>
    </>
  )
}

/**
 * Orientation Handler Hook
 */
export const useOrientation = () => {
  const [orientation, setOrientation] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
    }
    return 'portrait'
  })
  
  const [isTablet, setIsTablet] = useState(() => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth
      return width >= 768 && width < 1024
    }
    return false
  })
  
  useEffect(() => {
    const handleOrientationChange = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setOrientation(width > height ? 'landscape' : 'portrait')
      setIsTablet(width >= 768 && width < 1024)
    }
    
    const handleOrientationChangeDelayed = () => {
      setTimeout(handleOrientationChange, 100)
    }

    handleOrientationChange()

    window.addEventListener('resize', handleOrientationChange)
    window.addEventListener('orientationchange', handleOrientationChangeDelayed)

    return () => {
      window.removeEventListener('resize', handleOrientationChange)
      window.removeEventListener('orientationchange', handleOrientationChangeDelayed)
    }
  }, [])
  
  return {
    orientation,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
    isTablet
  }
}

/**
 * Tablet-Optimized Card Layout
 */
export const TabletCardLayout = ({
  cards = [],
  columns = 'auto',
  className = '',
  onCardSelect = null,
  selectedCard = null
}) => {
  const { isTablet, isLandscape } = useOrientation()
  
  const getColumns = () => {
    if (columns !== 'auto') return columns
    
    if (!isTablet) return 1
    if (isLandscape) return 3
    return 2
  }
  
  const gridColumns = getColumns()
  
  const gridStyles = {
    display: 'grid',
    gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
    gap: 'var(--space-md)',
    width: '100%'
  }
  
  return (
    <div className={`tablet-card-layout ${className}`} style={gridStyles}>
      {cards.map((card, index) => (
        <div
          key={card.id || index}
          className={`
            card cursor-pointer transition-all duration-200
            ${selectedCard === index ? 'ring-2 ring-accent' : ''}
            ${onCardSelect ? 'hover:shadow-md hover:scale-[1.02]' : ''}
          `}
          onClick={() => onCardSelect?.(index, card)}
        >
          {card}
        </div>
      ))}
    </div>
  )
}

/**
 * Floating Action Button for Tablets
 */
export const TabletFAB = ({
  icon,
  label,
  onClick,
  position = 'bottom-right',
  size = 'md',
  className = ''
}) => {
  const { isTablet } = useOrientation()
  
  if (!isTablet) return null
  
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-16 h-16'
  }
  
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  }
  
  return (
    <button
      onClick={onClick}
      style={{
  position: 'fixed',
  color: '#ffffff',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center'
}}
      title={label}
    >
      {icon}
    </button>
  )
}

/**
 * Tablet Breadcrumb Navigation
 */
export const TabletBreadcrumb = ({
  items = [],
  separator = '/',
  className = ''
}) => {
  const { isTablet } = useOrientation()
  const location = useLocation()
  
  if (!isTablet || items.length <= 1) return null
  
  return (
    <nav style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span className="text-muted">{separator}</span>
          )}
          
          {index === items.length - 1 ? (
            <span style={{
  fontWeight: '500'
}}>{item.label}</span>
          ) : (
            <a
              href={item.href || '#'}
              className="text-accent hover:text-accent-light transition-colors"
              onClick={(e) => {
                if (item.onClick) {
                  e.preventDefault()
                  item.onClick()
                }
              }}
            >
              {item.label}
            </a>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}




export default ResponsiveLayout
