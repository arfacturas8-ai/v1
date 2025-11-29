import React, { useEffect, useRef, useState, useCallback } from 'react'

/**
 * Pull-to-refresh hook for mobile
 * @param {Function} onRefresh - Callback when user pulls to refresh
 * @param {Object} options - Configuration options
 * @returns {Object} - Ref to attach to scrollable container and refresh state
 */
export function usePullToRefresh(onRefresh, options = {}) {
  const {
    threshold = 80,
    enabled = true,
    pullDownColor = '#58a6ff',
    backgroundColor = 'rgba(10, 10, 10, 0.95)'
  } = options

  const containerRef = useRef(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)

  const touchStartY = useRef(0)
  const touchCurrentY = useRef(0)
  const isPulling = useRef(false)

  const handleTouchStart = useCallback((e) => {
    if (!enabled || isRefreshing) return

    const scrollTop = containerRef.current?.scrollTop || window.scrollY

    // Only allow pull to refresh when at the top
    if (scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY
      isPulling.current = true
    }
  }, [enabled, isRefreshing])

  const handleTouchMove = useCallback((e) => {
    if (!isPulling.current || !enabled || isRefreshing) return

    touchCurrentY.current = e.touches[0].clientY
    const distance = Math.max(0, touchCurrentY.current - touchStartY.current)

    if (distance > 0) {
      // Prevent default scroll behavior when pulling down
      e.preventDefault()

      // Apply diminishing returns to pull distance
      const adjustedDistance = Math.min(distance * 0.5, threshold * 1.5)
      setPullDistance(adjustedDistance)
    }
  }, [enabled, isRefreshing, threshold])

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current || !enabled) return

    isPulling.current = false

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      setPullDistance(threshold)

      try {
        await onRefresh()
      } catch (error) {
        console.error('Pull to refresh error:', error)
      } finally {
        // Smooth animation back
        setTimeout(() => {
          setIsRefreshing(false)
          setPullDistance(0)
        }, 300)
      }
    } else {
      setPullDistance(0)
    }

    touchStartY.current = 0
    touchCurrentY.current = 0
  }, [enabled, isRefreshing, pullDistance, threshold, onRefresh])

  useEffect(() => {
    const element = containerRef.current
    if (!element || !enabled) return

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd])

  const progress = Math.min(pullDistance / threshold, 1)
  const rotation = progress * 360

  const renderIndicator = () => (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: Math.max(pullDistance, 0),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor,
        transition: isRefreshing ? 'height 0.3s ease' : 'none',
        overflow: 'hidden',
        zIndex: 100
      }}
    >
      {pullDistance > 0 && (
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: `3px solid ${pullDownColor}`,
            borderTopColor: 'transparent',
            transform: `rotate(${rotation}deg)`,
            transition: isRefreshing ? 'transform 0.6s linear infinite' : 'transform 0.1s ease',
            animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
          }}
        />
      )}
    </div>
  )

  return {
    containerRef,
    isRefreshing,
    pullDistance,
    progress,
    rotation,
    indicator: renderIndicator()
  }
}

export default usePullToRefresh
