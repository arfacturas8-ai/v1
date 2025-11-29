// Advanced Touch Gesture Utilities for Mobile Interactions
// Provides comprehensive gesture recognition for mobile devices

/**
 * Touch Gesture Manager
 * Handles swipe, pinch, tap, long press, and drag gestures
 */
export class TouchGestureManager {
  constructor(element, options = {}) {
    this.element = element
    this.options = {
      swipeThreshold: 50,
      longPressDelay: 500,
      tapThreshold: 10,
      pinchThreshold: 10,
      preventDefault: true,
      ...options
    }
    
    this.state = {
      isActive: false,
      startTime: null,
      startTouch: null,
      currentTouch: null,
      touches: [],
      distance: 0,
      angle: 0,
      scale: 1,
      lastScale: 1
    }
    
    this.callbacks = {
      onSwipeLeft: null,
      onSwipeRight: null,
      onSwipeUp: null,
      onSwipeDown: null,
      onTap: null,
      onDoubleTap: null,
      onLongPress: null,
      onPinchStart: null,
      onPinch: null,
      onPinchEnd: null,
      onDragStart: null,
      onDrag: null,
      onDragEnd: null
    }
    
    this.longPressTimer = null
    this.tapTimer = null
    this.lastTap = null
    
    this.init()
  }
  
  init() {
    if (!this.element) return
    
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false })
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false })
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false })
    this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this))
  }
  
  handleTouchStart(e) {
    if (this.options.preventDefault) {
      e.preventDefault()
    }
    
    this.state.isActive = true
    this.state.startTime = Date.now()
    this.state.touches = Array.from(e.touches)
    
    if (e.touches.length === 1) {
      // Single touch
      this.state.startTouch = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      }
      this.state.currentTouch = { ...this.state.startTouch }
      
      // Start long press timer
      this.longPressTimer = setTimeout(() => {
        if (this.state.isActive && this.callbacks.onLongPress) {
          this.callbacks.onLongPress(this.state.startTouch)
        }
      }, this.options.longPressDelay)
      
    } else if (e.touches.length === 2) {
      // Multi-touch for pinch
      this.clearTimers()
      this.handlePinchStart(e)
    }
  }
  
  handleTouchMove(e) {
    if (!this.state.isActive) return
    
    if (this.options.preventDefault) {
      e.preventDefault()
    }
    
    if (e.touches.length === 1) {
      this.state.currentTouch = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      }
      
      const deltaX = this.state.currentTouch.x - this.state.startTouch.x
      const deltaY = this.state.currentTouch.y - this.state.startTouch.y
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      
      // Cancel long press if moved too much
      if (distance > this.options.tapThreshold) {
        this.clearTimers()
        
        // Handle drag
        if (this.callbacks.onDrag) {
          this.callbacks.onDrag({
            startX: this.state.startTouch.x,
            startY: this.state.startTouch.y,
            currentX: this.state.currentTouch.x,
            currentY: this.state.currentTouch.y,
            deltaX,
            deltaY,
            distance
          })
        }
      }
      
    } else if (e.touches.length === 2) {
      this.handlePinchMove(e)
    }
  }
  
  handleTouchEnd(e) {
    if (!this.state.isActive) return
    
    this.clearTimers()
    
    const touchDuration = Date.now() - this.state.startTime
    
    if (e.changedTouches.length === 1) {
      const endTouch = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY
      }
      
      const deltaX = endTouch.x - this.state.startTouch.x
      const deltaY = endTouch.y - this.state.startTouch.y
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      
      if (distance < this.options.tapThreshold) {
        // Handle tap/double tap
        this.handleTap(endTouch)
      } else if (distance >= this.options.swipeThreshold) {
        // Handle swipe
        this.handleSwipe(deltaX, deltaY, distance)
      } else {
        // Handle drag end
        if (this.callbacks.onDragEnd) {
          this.callbacks.onDragEnd({
            startX: this.state.startTouch.x,
            startY: this.state.startTouch.y,
            endX: endTouch.x,
            endY: endTouch.y,
            deltaX,
            deltaY,
            distance,
            duration: touchDuration
          })
        }
      }
    } else if (e.touches.length === 0) {
      // All touches ended
      this.handlePinchEnd()
    }
    
    this.state.isActive = false
  }
  
  handleTouchCancel() {
    this.clearTimers()
    this.state.isActive = false
    this.handlePinchEnd()
  }
  
  handleTap(position) {
    const now = Date.now()
    
    if (this.lastTap && (now - this.lastTap.time) < 300) {
      // Double tap
      if (this.callbacks.onDoubleTap) {
        this.callbacks.onDoubleTap(position)
      }
      this.lastTap = null
    } else {
      // Single tap (with delay to check for double tap)
      this.lastTap = { time: now, position }
      
      this.tapTimer = setTimeout(() => {
        if (this.callbacks.onTap) {
          this.callbacks.onTap(this.lastTap.position)
        }
        this.lastTap = null
      }, 300)
    }
  }
  
  handleSwipe(deltaX, deltaY, distance) {
    const angle = Math.atan2(Math.abs(deltaY), Math.abs(deltaX)) * 180 / Math.PI
    
    // Determine swipe direction
    if (angle < 45) {
      // Horizontal swipe
      if (deltaX > 0 && this.callbacks.onSwipeRight) {
        this.callbacks.onSwipeRight({ deltaX, deltaY, distance, angle })
      } else if (deltaX < 0 && this.callbacks.onSwipeLeft) {
        this.callbacks.onSwipeLeft({ deltaX, deltaY, distance, angle })
      }
    } else {
      // Vertical swipe
      if (deltaY > 0 && this.callbacks.onSwipeDown) {
        this.callbacks.onSwipeDown({ deltaX, deltaY, distance, angle })
      } else if (deltaY < 0 && this.callbacks.onSwipeUp) {
        this.callbacks.onSwipeUp({ deltaX, deltaY, distance, angle })
      }
    }
  }
  
  handlePinchStart(e) {
    const touch1 = e.touches[0]
    const touch2 = e.touches[1]
    
    this.state.lastScale = this.getDistance(touch1, touch2)
    
    if (this.callbacks.onPinchStart) {
      this.callbacks.onPinchStart({
        center: this.getCenter(touch1, touch2),
        distance: this.state.lastScale
      })
    }
  }
  
  handlePinchMove(e) {
    const touch1 = e.touches[0]
    const touch2 = e.touches[1]
    
    const currentDistance = this.getDistance(touch1, touch2)
    const scale = currentDistance / this.state.lastScale
    
    if (this.callbacks.onPinch) {
      this.callbacks.onPinch({
        scale,
        center: this.getCenter(touch1, touch2),
        distance: currentDistance
      })
    }
  }
  
  handlePinchEnd() {
    if (this.callbacks.onPinchEnd) {
      this.callbacks.onPinchEnd()
    }
    this.state.lastScale = 1
  }
  
  getDistance(touch1, touch2) {
    const deltaX = touch2.clientX - touch1.clientX
    const deltaY = touch2.clientY - touch1.clientY
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  }
  
  getCenter(touch1, touch2) {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    }
  }
  
  clearTimers() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }
    
    if (this.tapTimer) {
      clearTimeout(this.tapTimer)
      this.tapTimer = null
    }
  }
  
  // Public API for setting callbacks
  on(event, callback) {
    if (this.callbacks.hasOwnProperty(`on${event.charAt(0).toUpperCase()}${event.slice(1)}`)) {
      this.callbacks[`on${event.charAt(0).toUpperCase()}${event.slice(1)}`] = callback
    }
    return this
  }
  
  off(event) {
    if (this.callbacks.hasOwnProperty(`on${event.charAt(0).toUpperCase()}${event.slice(1)}`)) {
      this.callbacks[`on${event.charAt(0).toUpperCase()}${event.slice(1)}`] = null
    }
    return this
  }
  
  destroy() {
    this.clearTimers()
    
    if (this.element) {
      this.element.removeEventListener('touchstart', this.handleTouchStart)
      this.element.removeEventListener('touchmove', this.handleTouchMove)
      this.element.removeEventListener('touchend', this.handleTouchEnd)
      this.element.removeEventListener('touchcancel', this.handleTouchCancel)
    }
    
    this.element = null
    this.callbacks = {}
  }
}

/**
 * React Hook for Touch Gestures
 */
export function useTouchGestures(ref, options = {}) {
  const [gestureManager, setGestureManager] = React.useState(null)
  
  React.useEffect(() => {
    if (ref.current) {
      const manager = new TouchGestureManager(ref.current, options)
      setGestureManager(manager)
      
      return () => manager.destroy()
    }
  }, [ref, options])
  
  const on = React.useCallback((event, callback) => {
    if (gestureManager) {
      gestureManager.on(event, callback)
    }
  }, [gestureManager])
  
  const off = React.useCallback((event) => {
    if (gestureManager) {
      gestureManager.off(event)
    }
  }, [gestureManager])
  
  return { on, off }
}

/**
 * Swipe Detection Utility
 */
export function useSwipeGesture(ref, callbacks = {}, options = {}) {
  React.useEffect(() => {
    if (!ref.current) return
    
    const manager = new TouchGestureManager(ref.current, {
      swipeThreshold: 50,
      ...options
    })
    
    // Set up callbacks
    Object.keys(callbacks).forEach(key => {
      if (callbacks[key]) {
        manager.on(key.replace('on', '').toLowerCase(), callbacks[key])
      }
    })
    
    return () => manager.destroy()
  }, [ref, callbacks, options])
}

/**
 * Pull-to-Refresh Utility
 */
export function usePullToRefresh(ref, onRefresh, options = {}) {
  const [isPulling, setIsPulling] = React.useState(false)
  const [pullDistance, setPullDistance] = React.useState(0)
  
  React.useEffect(() => {
    if (!ref.current) return
    
    const threshold = options.threshold || 80
    const resistance = options.resistance || 2.5
    let startY = 0
    let currentY = 0
    
    const handleTouchStart = (e) => {
      if (window.scrollY > 0) return
      
      startY = e.touches[0].clientY
      setIsPulling(false)
      setPullDistance(0)
    }
    
    const handleTouchMove = (e) => {
      if (window.scrollY > 0) return
      
      currentY = e.touches[0].clientY
      const deltaY = currentY - startY
      
      if (deltaY > 0) {
        e.preventDefault()
        
        const distance = deltaY / resistance
        setPullDistance(distance)
        setIsPulling(true)
      }
    }
    
    const handleTouchEnd = () => {
      if (!isPulling) return
      
      if (pullDistance > threshold && onRefresh) {
        onRefresh()
      }
      
      setPullDistance(0)
      setIsPulling(false)
    }
    
    const element = ref.current
    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd)
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [ref, onRefresh, isPulling, pullDistance, options])
  
  return { isPulling, pullDistance }
}

/**
 * Long Press Utility
 */
export function useLongPress(ref, onLongPress, options = {}) {
  React.useEffect(() => {
    if (!ref.current) return
    
    const manager = new TouchGestureManager(ref.current, {
      longPressDelay: options.delay || 500,
      ...options
    })
    
    manager.on('longPress', onLongPress)
    
    return () => manager.destroy()
  }, [ref, onLongPress, options])
}

/**
 * Drag and Drop Utility
 */
export function useDragGesture(ref, callbacks = {}, options = {}) {
  React.useEffect(() => {
    if (!ref.current) return
    
    const manager = new TouchGestureManager(ref.current, options)
    
    if (callbacks.onDragStart) manager.on('dragStart', callbacks.onDragStart)
    if (callbacks.onDrag) manager.on('drag', callbacks.onDrag)
    if (callbacks.onDragEnd) manager.on('dragEnd', callbacks.onDragEnd)
    
    return () => manager.destroy()
  }, [ref, callbacks, options])
}

/**
 * Pinch Zoom Utility
 */
export function usePinchZoom(ref, callbacks = {}, options = {}) {
  React.useEffect(() => {
    if (!ref.current) return
    
    const manager = new TouchGestureManager(ref.current, options)
    
    if (callbacks.onPinchStart) manager.on('pinchStart', callbacks.onPinchStart)
    if (callbacks.onPinch) manager.on('pinch', callbacks.onPinch)
    if (callbacks.onPinchEnd) manager.on('pinchEnd', callbacks.onPinchEnd)
    
    return () => manager.destroy()
  }, [ref, callbacks, options])
}

/**
 * Utility functions for mobile interactions
 */
export const MobileUtils = {
  // Check if device supports touch
  isTouchDevice: () => {
    return ('ontouchstart' in window) || 
           (navigator.maxTouchPoints > 0) || 
           (navigator.msMaxTouchPoints > 0)
  },
  
  // Get device type
  getDeviceType: () => {
    const width = window.innerWidth
    if (width < 768) return 'mobile'
    if (width < 1024) return 'tablet'
    return 'desktop'
  },
  
  // Check if device is in portrait mode
  isPortrait: () => {
    return window.innerHeight > window.innerWidth
  },
  
  // Get safe area insets (for notched devices)
  getSafeAreaInsets: () => {
    const style = getComputedStyle(document.documentElement)
    return {
      top: style.getPropertyValue('--sat') || style.getPropertyValue('env(safe-area-inset-top)') || '0px',
      bottom: style.getPropertyValue('--sab') || style.getPropertyValue('env(safe-area-inset-bottom)') || '0px',
      left: style.getPropertyValue('--sal') || style.getPropertyValue('env(safe-area-inset-left)') || '0px',
      right: style.getPropertyValue('--sar') || style.getPropertyValue('env(safe-area-inset-right)') || '0px'
    }
  },
  
  // Prevent body scroll (for modals)
  preventBodyScroll: (prevent = true) => {
    if (prevent) {
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
    } else {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
  },
  
  // Vibrate device (if supported)
  vibrate: (pattern = 200) => {
    if (navigator.vibrate) {
      navigator.vibrate(pattern)
    }
  },
  
  // Get viewport dimensions including mobile browser chrome
  getViewportDimensions: () => {
    return {
      width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
      height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0),
      visualViewportHeight: window.visualViewport?.height || window.innerHeight
    }
  }
}

export default TouchGestureManager