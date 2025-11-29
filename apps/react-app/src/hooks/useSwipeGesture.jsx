import { useEffect, useRef, useCallback } from 'react'

/**
 * Swipe gesture hook for mobile navigation
 * @param {Object} options - Configuration options
 * @param {Function} options.onSwipeLeft - Callback when swiping left
 * @param {Function} options.onSwipeRight - Callback when swiping right
 * @param {Function} options.onSwipeUp - Callback when swiping up
 * @param {Function} options.onSwipeDown - Callback when swiping down
 * @param {number} options.threshold - Minimum distance for swipe (default: 50px)
 * @param {boolean} options.enabled - Whether gestures are enabled (default: true)
 * @returns {Object} - Ref to attach to swipeable element
 */
export function useSwipeGesture(options = {}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    enabled = true
  } = options

  const elementRef = useRef(null)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const touchEndX = useRef(0)
  const touchEndY = useRef(0)

  const handleTouchStart = useCallback((e) => {
    if (!enabled) return
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }, [enabled])

  const handleTouchMove = useCallback((e) => {
    if (!enabled) return
    touchEndX.current = e.touches[0].clientX
    touchEndY.current = e.touches[0].clientY
  }, [enabled])

  const handleTouchEnd = useCallback(() => {
    if (!enabled) return

    const deltaX = touchEndX.current - touchStartX.current
    const deltaY = touchEndY.current - touchStartY.current

    // Determine if swipe is more horizontal or vertical
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    if (absX > absY) {
      // Horizontal swipe
      if (absX > threshold) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight()
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft()
        }
      }
    } else {
      // Vertical swipe
      if (absY > threshold) {
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown()
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp()
        }
      }
    }

    // Reset values
    touchStartX.current = 0
    touchStartY.current = 0
    touchEndX.current = 0
    touchEndY.current = 0
  }, [enabled, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown])

  useEffect(() => {
    const element = elementRef.current
    if (!element || !enabled) return

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd])

  return { ref: elementRef }
}

export default useSwipeGesture
