import React, { useState, useRef, useEffect } from 'react'

const PullToRefresh = ({ 
  onRefresh,
  refreshing = false,
  threshold = 80,
  resistance = 2.5,
  className = ''
}) => {
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const [canRefresh, setCanRefresh] = useState(false)
  const touchStartY = useRef(0)
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let startY = 0
    let currentY = 0

    const handleTouchStart = (e) => {
      // Only start pull to refresh if we're at the top of the scroll
      if (window.scrollY > 0) return

      startY = e.touches[0].clientY
      touchStartY.current = startY
      setIsPulling(false)
    }

    const handleTouchMove = (e) => {
      if (refreshing || window.scrollY > 0) return

      currentY = e.touches[0].clientY
      const deltaY = currentY - startY

      if (deltaY > 0) {
        // Prevent default scrolling
        e.preventDefault()

        // Apply resistance
        const distance = deltaY / resistance
        setPullDistance(distance)
        setIsPulling(true)
        setCanRefresh(distance > threshold)
      }
    }

    const handleTouchEnd = () => {
      if (!isPulling) return

      if (canRefresh && !refreshing) {
        onRefresh?.()
      }

      // Reset state
      setPullDistance(0)
      setIsPulling(false)
      setCanRefresh(false)
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd)

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isPulling, canRefresh, refreshing, onRefresh, threshold, resistance])

  // Reset pull distance when refreshing completes
  useEffect(() => {
    if (!refreshing) {
      setPullDistance(0)
      setIsPulling(false)
      setCanRefresh(false)
    }
  }, [refreshing])

  const getIconRotation = () => {
    if (refreshing) return 'animate-spin'
    if (canRefresh) return 'rotate-180'
    return ''
  }

  const getIndicatorOpacity = () => {
    if (refreshing || isPulling) return 1
    return 0
  }

  const getIndicatorScale = () => {
    const scale = Math.min(pullDistance / threshold, 1)
    return refreshing ? 1 : scale
  }

  return (
    <>
      {/* Pull to Refresh Indicator */}
      <div
        style={{
  position: 'fixed',
  display: 'flex',
  alignItems: 'center'
}}
        style={{
          opacity: getIndicatorOpacity(),
          transform: `translateY(${Math.min(pullDistance, threshold + 20)}px)`,
          pointerEvents: 'none'
        }}
      >
        <div
          style={{
  border: '1px solid rgba(255, 255, 255, 0.1)',
  display: 'flex',
  alignItems: 'center'
}}
          style={{
            transform: `scale(${getIndicatorScale()})`
          }}
        >
          <div className={`text-accent transition-transform duration-200 ${getIconRotation()}`}>
            {refreshing ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a8 8 0 018 8h-2a6 6 0 10-1.26 3.36l1.42 1.42A8 8 0 0110 2z"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2l-4 4h3v8h2V6h3l-4-4z"/>
              </svg>
            )}
          </div>
          
          <span style={{
  fontWeight: '500'
}}>
            {refreshing 
              ? 'Refreshing...' 
              : canRefresh 
                ? 'Release to refresh'
                : 'Pull to refresh'
            }
          </span>
        </div>
      </div>

      {/* Touch Area */}
      <div 
        ref={containerRef}
        style={{
  position: 'absolute'
}}
        style={{
          height: '100vh',
          width: '100vw',
          top: 0,
          left: 0,
          zIndex: -1
        }}
      />

      {/* Progress Bar */}
      {(isPulling || refreshing) && (
        <div style={{
  position: 'fixed',
  height: '4px'
}}>
          <div
            style={{
  height: '100%'
}}
            style={{
              width: refreshing 
                ? '100%' 
                : `${Math.min((pullDistance / threshold) * 100, 100)}%`
            }}
          />
        </div>
      )}
    </>
  )
}



export default PullToRefresh