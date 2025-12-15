import React, { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Menu, X, ArrowLeft, MoreVertical, Send, Paperclip, 
  Mic, Camera, Search, Phone, Video, Users, Settings,
  ChevronDown, ChevronUp, Maximize2, Minimize2
} from 'lucide-react'

/**
 * MobileOptimizations - Mobile-first chat interface optimizations
 * Features: Touch gestures, responsive layouts, mobile navigation, touch-friendly controls
 */

// Hook for detecting mobile device
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 || 
                   /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setIsMobile(mobile)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  return isMobile
}

// Hook for touch gestures
export const useTouchGestures = (element, options = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onLongPress,
    onDoubleTap,
    swipeThreshold = 50,
    longPressDelay = 500
  } = options

  const touchStartRef = useRef(null)
  const touchEndRef = useRef(null)
  const longPressTimeoutRef = useRef(null)
  const lastTapRef = useRef(0)

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0]
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    }
    
    // Start long press timer
    if (onLongPress) {
      longPressTimeoutRef.current = setTimeout(() => {
        onLongPress(e)
        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate(50)
        }
      }, longPressDelay)
    }
  }, [onLongPress, longPressDelay])

  const handleTouchMove = useCallback((e) => {
    // Cancel long press if user moves finger
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current)
      longPressTimeoutRef.current = null
    }
  }, [])

  const handleTouchEnd = useCallback((e) => {
    // Clear long press timer
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current)
      longPressTimeoutRef.current = null
    }

    if (!touchStartRef.current) return

    const touch = e.changedTouches[0]
    touchEndRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    }

    const deltaX = touchEndRef.current.x - touchStartRef.current.x
    const deltaY = touchEndRef.current.y - touchStartRef.current.y
    const deltaTime = touchEndRef.current.timestamp - touchStartRef.current.timestamp

    // Check for double tap
    const now = Date.now()
    if (onDoubleTap && now - lastTapRef.current < 300) {
      onDoubleTap(e)
      lastTapRef.current = 0
      return
    }
    lastTapRef.current = now

    // Check for swipe gestures
    if (Math.abs(deltaX) > swipeThreshold || Math.abs(deltaY) > swipeThreshold) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight(e, deltaX)
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft(e, Math.abs(deltaX))
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown(e, deltaY)
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp(e, Math.abs(deltaY))
        }
      }
    }

    touchStartRef.current = null
    touchEndRef.current = null
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onDoubleTap, swipeThreshold])

  useEffect(() => {
    const el = element?.current
    if (!el) return

    el.addEventListener('touchstart', handleTouchStart, { passive: false })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    el.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [element, handleTouchStart, handleTouchMove, handleTouchEnd])

  return { touchStartRef, touchEndRef }
}

// Mobile-optimized header component
export const MobileHeader = ({
  title,
  subtitle,
  onBack,
  onMenu,
  actions = [],
  avatar,
  showBack = false,
  className = ''
}) => {
  return (
    <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px',
  background: 'white',
  borderBottom: '1px solid var(--border-subtle)'
}}>
      <div style={{
  display: 'flex',
  alignItems: 'center',
  flex: '1'
}}>
        {showBack ? (
          <button
            onClick={onBack}
            style={{
  padding: '8px',
  borderRadius: '50%',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)'
}}
          >
            <ArrowLeft style={{
  width: '20px',
  height: '20px'
}} />
          </button>
        ) : (
          <button
            onClick={onMenu}
            style={{
  padding: '8px',
  borderRadius: '50%',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)'
}}
          >
            <Menu style={{
  width: '20px',
  height: '20px'
}} />
          </button>
        )}

        {avatar && (
          <div style={{
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  background: 'var(--bg-secondary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
            {avatar}
          </div>
        )}

        <div style={{
  flex: '1'
}}>
          <h1 style={{
  fontWeight: '600',
  color: 'var(--text-primary)'
}}>
            {title}
          </h1>
          {subtitle && (
            <p style={{
  color: 'var(--text-secondary)'
}}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {actions.length > 0 && (
        <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              style={{
  padding: '8px',
  borderRadius: '50%',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)'
}}
              title={action.title}
            >
              <action.icon style={{
  width: '20px',
  height: '20px'
}} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Mobile-optimized bottom navigation
export const MobileBottomNav = ({
  items = [],
  activeItem,
  onItemSelect,
  className = ''
}) => {
  return (
    <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-around',
  padding: '8px',
  background: 'white',
  borderTop: '1px solid var(--border-subtle)'
}}>
      {items.map((item, index) => (
        <button
          key={index}
          onClick={() => onItemSelect(item.id)}
          style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px',
  borderRadius: '12px',
  flex: '1',
  color: 'var(--text-secondary)'
}}
        >
          <item.icon style={{
  width: '20px',
  height: '20px'
}} />
          <span style={{
  fontWeight: '500'
}}>{item.label}</span>
          {item.badge && (
            <span style={{
  position: 'absolute',
  color: '#ffffff',
  borderRadius: '50%',
  width: '16px',
  height: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#58a6ff'
}}>
              {item.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// Swipeable message item
export const SwipeableMessage = ({ 
  message, 
  onSwipeReply, 
  onSwipeActions,
  onLongPress,
  children,
  className = '' 
}) => {
  const elementRef = useRef(null)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isSwipeActive, setIsSwipeActive] = useState(false)

  useTouchGestures(elementRef, {
    onSwipeRight: (e, distance) => {
      if (distance > 80) {
        onSwipeReply && onSwipeReply(message)
        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate(30)
        }
      }
    },
    onSwipeLeft: (e, distance) => {
      if (distance > 80) {
        onSwipeActions && onSwipeActions(message)
        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate(30)
        }
      }
    },
    onLongPress: (e) => {
      onLongPress && onLongPress(message)
    }
  })

  return (
    <div
      ref={elementRef}
      style={{
  position: 'relative',
  transform: `translateX(${swipeOffset}px)`
}}
    >
      {children}
      
      {/* Swipe indicators */}
      {isSwipeActive && (
        <>
          {swipeOffset > 0 && (
            <div style={{
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '64px',
  color: 'var(--text-primary)'
}}>
              <ArrowLeft style={{
  width: '20px',
  height: '20px'
}} />
            </div>
          )}
          {swipeOffset < 0 && (
            <div style={{
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '64px',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)'
}}>
              <MoreVertical style={{
  width: '20px',
  height: '20px'
}} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Pull-to-refresh component
export const PullToRefresh = ({ 
  onRefresh, 
  isRefreshing, 
  threshold = 100,
  children,
  className = '' 
}) => {
  const containerRef = useRef(null)
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)

  useTouchGestures(containerRef, {
    onSwipeDown: (e, distance) => {
      const container = containerRef.current
      if (container && container.scrollTop === 0 && distance > threshold) {
        setIsPulling(true)
        onRefresh && onRefresh()
      }
    }
  })

  useEffect(() => {
    if (isRefreshing) {
      setIsPulling(false)
      setPullDistance(0)
    }
  }, [isRefreshing])

  return (
    <div ref={containerRef} style={{
  position: 'relative'
}}>
      {/* Pull indicator */}
      {(isPulling || isRefreshing) && (
        <div style={{
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px'
}}>
          {isRefreshing ? (
            <div style={{
  borderRadius: '50%',
  height: '24px',
  width: '24px'
}} />
          ) : (
            <ChevronDown style={{
  width: '24px',
  height: '24px'
}} />
          )}
        </div>
      )}
      
      <div style={{ transform: `translateY(${pullDistance}px)` }}>
        {children}
      </div>
    </div>
  )
}

// Mobile-optimized input with autocomplete
export const MobileInput = ({ 
  value, 
  onChange, 
  onSend, 
  placeholder = "Type a message...",
  multiline = true,
  showAttachment = true,
  showVoice = true,
  showCamera = true,
  attachments = [],
  onAttachment,
  onVoiceRecord,
  onCameraCapture,
  disabled = false,
  className = '' 
}) => {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const inputRef = useRef(null)
  const recordingTimerRef = useRef(null)

  const handleSend = () => {
    if (value.trim() || attachments.length > 0) {
      onSend && onSend(value, attachments)
    }
  }

  const handleVoiceRecord = async () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false)
      setRecordingDuration(0)
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
      onVoiceRecord && onVoiceRecord('stop')
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        setIsRecording(true)
        setRecordingDuration(0)
        
        recordingTimerRef.current = setInterval(() => {
          setRecordingDuration(prev => prev + 1)
        }, 1000)
        
        onVoiceRecord && onVoiceRecord('start', stream)
      } catch (error) {
        console.error('Failed to start recording:', error)
      }
    }
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={` border-t ${className}`} style={{ background: 'white', borderColor: 'var(--border-subtle)' }}>
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div style={{
  padding: '12px'
}}>
          <div style={{
  display: 'flex'
}}>
            {attachments.map((attachment, index) => (
              <div key={index} style={{
  position: 'relative'
}}>
                <div style={{
  width: '64px',
  height: '64px',
  background: 'var(--bg-secondary)',
  borderRadius: '4px',
  border: '1px solid var(--border-subtle)'
}}>
                  {attachment.type.startsWith('image/') ? (
                    <img 
                      src={attachment.url} 
                      alt={attachment.name}
                      style={{
  width: '100%',
  height: '100%',
  borderRadius: '4px'
}}
                    />
                  ) : (
                    <div style={{
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                      <Paperclip style={{
  width: '24px',
  height: '24px',
  color: 'var(--text-secondary)'
}} />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {/* Remove attachment */}}
                  style={{
  position: 'absolute',
  color: 'white',
  borderRadius: '50%',
  width: '20px',
  height: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#58a6ff'
}}
                >
                  <X style={{
  width: '12px',
  height: '12px'
}} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recording indicator */}
      {isRecording && (
        <div style={{
  padding: '12px'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <div style={{
  width: '12px',
  height: '12px',
  borderRadius: '50%'
}} />
              <span style={{
  fontWeight: '500',
  color: 'var(--text-primary)'
}}>
                Recording voice message
              </span>
            </div>
            <span className="text-sm" style={{ color: '#ef4444' }}>
              {formatDuration(recordingDuration)}
            </span>
          </div>
        </div>
      )}

      {/* Input area */}
      <div style={{
  display: 'flex',
  alignItems: 'flex-end',
  padding: '12px'
}}>
        {/* Attachment button */}
        {showAttachment && (
          <button
            onClick={onAttachment}
            disabled={disabled}
            style={{
  padding: '12px',
  borderRadius: '50%',
  background: 'var(--bg-secondary)'
}}
          >
            <Paperclip style={{
  width: '20px',
  height: '20px',
  color: 'var(--text-secondary)'
}} />
          </button>
        )}

        {/* Text input */}
        <div style={{
  flex: '1',
  position: 'relative'
}}>
          {multiline ? (
            <textarea
              ref={inputRef}
              value={value}
              onChange={(e) => onChange && onChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              style={{
  width: '100%',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '12px',
  paddingBottom: '12px',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '50%',
  minHeight: '48px',
  color: 'var(--text-primary)'
}}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
            />
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => onChange && onChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              style={{
  width: '100%',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '12px',
  paddingBottom: '12px',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '50%',
  color: 'var(--text-primary)'
}}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSend()
                }
              }}
            />
          )}
        </div>

        {/* Action buttons */}
        <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
          {/* Camera button */}
          {showCamera && !value.trim() && (
            <button
              onClick={onCameraCapture}
              disabled={disabled}
              style={{
  padding: '12px',
  borderRadius: '50%',
  background: 'var(--bg-secondary)'
}}
            >
              <Camera style={{
  width: '20px',
  height: '20px',
  color: 'var(--text-secondary)'
}} />
            </button>
          )}

          {/* Voice record button */}
          {showVoice && !value.trim() && (
            <button
              onClick={handleVoiceRecord}
              disabled={disabled}
              style={{
  padding: '12px',
  borderRadius: '50%',
  color: 'var(--text-secondary)',
  background: 'var(--bg-secondary)'
}}
            >
              <Mic style={{
  width: '20px',
  height: '20px'
}} />
            </button>
          )}

          {/* Send button */}
          {(value.trim() || attachments.length > 0) && (
            <button
              onClick={handleSend}
              disabled={disabled}
              className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7]"
              style={{
  padding: '12px',
  color: 'white',
  borderRadius: '50%'
}}
            >
              <Send style={{
  width: '20px',
  height: '20px'
}} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Mobile-friendly modal
export const MobileModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  fullScreen = false,
  className = '' 
}) => {
  if (!isOpen) return null

  return (
    <div style={{
  position: 'fixed',
  background: 'rgba(0, 0, 0, 0.5)'
}}>
      <div style={{
  background: 'white',
  borderRadius: '16px'
}}>
        <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px',
  borderBottom: '1px solid var(--border-subtle)'
}}>
          <h2 style={{
  fontWeight: '600',
  color: 'var(--text-primary)'
}}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
  padding: '8px',
  borderRadius: '50%',
  background: 'var(--bg-secondary)'
}}
          >
            <X style={{
  width: '20px',
  height: '20px',
  color: 'var(--text-primary)'
}} />
          </button>
        </div>
        
        <div className="overflow-y-auto max-h-[calc(90vh-64px)]">
          {children}
        </div>
      </div>
    </div>
  )
}

// Custom CSS for mobile optimizations
export const mobileStyles = `
  /* Touch target size */
  .touch-target {
    min-height: 44px;
    min-width: 44px;
  }

  /* Hide scrollbars on mobile */
  @media (max-width: 768px) {
    .hide-scrollbar {
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    .hide-scrollbar::-webkit-scrollbar {
      display: none;
    }
  }

  /* Smooth scrolling for mobile */
  .mobile-scroll {
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }

  /* Prevent text selection on mobile */
  .no-select {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  /* Safe area for notched devices */
  .safe-area-top {
    padding-top: env(safe-area-inset-top);
  }

  .safe-area-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }

  /* Haptic feedback class */
  .haptic-feedback {
    transform: scale(0.95);
    transition: transform 0.1s ease;
  }

  /* Mobile animations */
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(100%);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .slide-up {
    animation: slideUp 0.3s ease-out;
  }

  /* Reduce motion for accessibility */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation: none !important;
      transition: none !important;
    }
  }
`



export default {
  useIsMobile,
  useTouchGestures,
  MobileHeader,
  MobileBottomNav,
  SwipeableMessage,
  PullToRefresh,
  MobileInput,
  MobileModal,
  mobileStyles
}
