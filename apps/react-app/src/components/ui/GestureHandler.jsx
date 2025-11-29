import React, { useRef, useEffect, useState } from 'react'

/**
 * Modern Gesture Handler Hook
 * Provides touch gesture recognition for mobile interactions
 */
export function useGestures({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onTap,
  onDoubleTap,
  onLongPress,
  threshold = 50,
  timeThreshold = 300
}) {
  const touchStartRef = useRef(null)
  const touchEndRef = useRef(null)
  const tapTimeoutRef = useRef(null)
  const longPressTimeoutRef = useRef(null)
  const [lastTap, setLastTap] = useState(0)

  const handleTouchStart = (e) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    }

    // Start long press detection
    if (onLongPress) {
      longPressTimeoutRef.current = setTimeout(() => {
        onLongPress(e)
      }, 500) // 500ms for long press
    }
  }

  const handleTouchMove = (e) => {
    // Cancel long press on move
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current)
      longPressTimeoutRef.current = null
    }
  }

  const handleTouchEnd = (e) => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current)
      longPressTimeoutRef.current = null
    }

    if (!touchStartRef.current) return

    touchEndRef.current = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
      time: Date.now()
    }

    const deltaX = touchEndRef.current.x - touchStartRef.current.x
    const deltaY = touchEndRef.current.y - touchStartRef.current.y
    const deltaTime = touchEndRef.current.time - touchStartRef.current.time

    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)

    // Check for swipes
    if (deltaTime < timeThreshold) {
      if (absDeltaX > threshold && absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight(e, { deltaX, deltaY, deltaTime })
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft(e, { deltaX, deltaY, deltaTime })
        }
      } else if (absDeltaY > threshold && absDeltaY > absDeltaX) {
        // Vertical swipe
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown(e, { deltaX, deltaY, deltaTime })
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp(e, { deltaX, deltaY, deltaTime })
        }
      } else if (absDeltaX < 10 && absDeltaY < 10) {
        // Tap detection
        const now = Date.now()
        const timeSinceLastTap = now - lastTap

        if (timeSinceLastTap < 300 && onDoubleTap) {
          // Double tap
          if (tapTimeoutRef.current) {
            clearTimeout(tapTimeoutRef.current)
            tapTimeoutRef.current = null
          }
          onDoubleTap(e)
          setLastTap(0)
        } else if (onTap) {
          // Single tap (with delay to check for double tap)
          setLastTap(now)
          tapTimeoutRef.current = setTimeout(() => {
            onTap(e)
          }, 300)
        }
      }
    }

    touchStartRef.current = null
    touchEndRef.current = null
  }

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  }
}

/**
 * Swipeable Container Component
 */
export function SwipeableContainer({ 
  children, 
  onSwipeLeft,
  onSwipeRight,
  className = '',
  ...props 
}) {
  const gestureHandlers = useGestures({
    onSwipeLeft,
    onSwipeRight
  })

  return (
    <div 
      className={`swipeable-container ${className}`}
      {...gestureHandlers}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Pull to Refresh Component
 */
export function PullToRefresh({ 
  children, 
  onRefresh, 
  refreshing = false,
  threshold = 80,
  className = ''
}) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(refreshing)
  const touchStartY = useRef(0)
  const scrollableRef = useRef(null)

  useEffect(() => {
    setIsRefreshing(refreshing)
  }, [refreshing])

  const handleTouchStart = (e) => {
    if (scrollableRef.current && scrollableRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY
      setIsPulling(true)
    }
  }

  const handleTouchMove = (e) => {
    if (!isPulling || isRefreshing) return

    const currentY = e.touches[0].clientY
    const distance = Math.max(0, currentY - touchStartY.current)
    
    if (distance > 0) {
      e.preventDefault()
      setPullDistance(Math.min(distance * 0.5, threshold * 1.5))
    }
  }

  const handleTouchEnd = () => {
    if (!isPulling) return

    if (pullDistance >= threshold && !isRefreshing && onRefresh) {
      setIsRefreshing(true)
      onRefresh().finally(() => {
        setIsRefreshing(false)
      })
    }

    setIsPulling(false)
    setPullDistance(0)
  }

  const pullProgress = Math.min(pullDistance / threshold, 1)

  return (
    <div className={`pull-to-refresh ${className}`}>
      <div 
        className="pull-refresh-indicator"
        style={{
          transform: `translateY(${pullDistance}px)`,
          opacity: pullProgress
        }}
      >
        <div 
          className={`refresh-spinner ${isRefreshing ? 'spinning' : ''}`}
          style={{
            transform: `rotate(${pullProgress * 360}deg)`
          }}
        >
          ↻
        </div>
        <span className="refresh-text">
          {isRefreshing ? 'Refreshing...' : pullProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
        </span>
      </div>
      
      <div
        ref={scrollableRef}
        className="pull-refresh-content"
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}

/**
 * Draggable Component
 */
export function Draggable({ 
  children, 
  onDrag, 
  onDragEnd,
  bounds,
  className = '',
  ...props 
}) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const elementRef = useRef(null)

  const handleTouchStart = (e) => {
    const touch = e.touches[0]
    dragStartRef.current = {
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    }
    setIsDragging(true)
    e.preventDefault()
  }

  const handleTouchMove = (e) => {
    if (!isDragging) return

    const touch = e.touches[0]
    let newX = touch.clientX - dragStartRef.current.x
    let newY = touch.clientY - dragStartRef.current.y

    // Apply bounds if specified
    if (bounds) {
      newX = Math.max(bounds.left, Math.min(bounds.right, newX))
      newY = Math.max(bounds.top, Math.min(bounds.bottom, newY))
    }

    const newPosition = { x: newX, y: newY }
    setPosition(newPosition)

    if (onDrag) {
      onDrag(newPosition)
    }

    e.preventDefault()
  }

  const handleTouchEnd = () => {
    if (isDragging) {
      setIsDragging(false)
      if (onDragEnd) {
        onDragEnd(position)
      }
    }
  }

  return (
    <div
      ref={elementRef}
      className={`draggable ${isDragging ? 'dragging' : ''} ${className}`}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        touchAction: 'none',
        userSelect: 'none'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      {...props}
    >
      {children}
    </div>
  )
}




export default useGestures
