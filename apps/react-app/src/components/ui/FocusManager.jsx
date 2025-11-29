import React, { useRef, useEffect, createContext, useContext, useState } from 'react'

/**
 * Focus Management Context
 */
const FocusContext = createContext()

/**
 * Focus Manager Provider
 * Handles focus trapping, restoration, and keyboard navigation
 */
export function FocusProvider({ children }) {
  const previousFocusRef = useRef(null)
  const focusStackRef = useRef([])

  const trapFocus = (container) => {
    if (!container) return

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    if (focusableElements.length === 0) return

    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault()
          lastFocusable.focus()
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault()
          firstFocusable.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    firstFocusable.focus()

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }

  const pushFocus = (element) => {
    previousFocusRef.current = document.activeElement
    focusStackRef.current.push(document.activeElement)
    if (element && element.focus) {
      element.focus()
    }
  }

  const popFocus = () => {
    const previousElement = focusStackRef.current.pop()
    if (previousElement && previousElement.focus) {
      previousElement.focus()
    }
  }

  const restoreFocus = () => {
    if (previousFocusRef.current && previousFocusRef.current.focus) {
      previousFocusRef.current.focus()
    }
  }

  const value = {
    trapFocus,
    pushFocus,
    popFocus,
    restoreFocus
  }

  return (
    <FocusContext.Provider value={value}>
      {children}
    </FocusContext.Provider>
  )
}

/**
 * Hook to use focus management
 */
export function useFocus() {
  const context = useContext(FocusContext)
  if (!context) {
    throw new Error('useFocus must be used within a FocusProvider')
  }
  return context
}

/**
 * Focus Trap Component
 * Traps focus within its children for modals, dialogs, etc.
 */
export function FocusTrap({ children, active = true, restoreFocus = true, className = '' }) {
  const containerRef = useRef(null)
  const { pushFocus, popFocus } = useFocus()

  useEffect(() => {
    if (!active || !containerRef.current) return

    const container = containerRef.current
    const previousElement = document.activeElement

    if (restoreFocus) {
      pushFocus()
    }

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    if (focusableElements.length === 0) return

    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault()
          lastFocusable.focus()
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault()
          firstFocusable.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    firstFocusable.focus()

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
      if (restoreFocus) {
        popFocus()
      }
    }
  }, [active, restoreFocus, pushFocus, popFocus])

  return (
    <div ref={containerRef} className={`focus-trap ${className}`}>
      {children}
    </div>
  )
}

/**
 * Skip Link Component
 * Provides keyboard navigation shortcuts
 */
export function SkipLink({ href, children, className = '' }) {
  return (
    <a
      href={href}
      className={`skip-link ${className}`}
      onFocus={(e) => e.target.classList.add('skip-link-focused')}
      onBlur={(e) => e.target.classList.remove('skip-link-focused')}
    >
      {children}
    </a>
  )
}

/**
 * Roving Tab Index Hook
 * For managing focus in lists, grids, etc.
 */
export function useRovingTabIndex(items, orientation = 'horizontal') {
  const [currentIndex, setCurrentIndex] = useState(0)

  const handleKeyDown = (e, index) => {
    const isHorizontal = orientation === 'horizontal'
    const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown'
    const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp'

    switch (e.key) {
      case nextKey:
        e.preventDefault()
        setCurrentIndex((prevIndex) => 
          prevIndex < items.length - 1 ? prevIndex + 1 : 0
        )
        break
      case prevKey:
        e.preventDefault()
        setCurrentIndex((prevIndex) => 
          prevIndex > 0 ? prevIndex - 1 : items.length - 1
        )
        break
      case 'Home':
        e.preventDefault()
        setCurrentIndex(0)
        break
      case 'End':
        e.preventDefault()
        setCurrentIndex(items.length - 1)
        break
    }
  }

  const getTabIndex = (index) => index === currentIndex ? 0 : -1

  const getItemProps = (index) => ({
    tabIndex: getTabIndex(index),
    onKeyDown: (e) => handleKeyDown(e, index),
    onFocus: () => setCurrentIndex(index)
  })

  return {
    currentIndex,
    setCurrentIndex,
    getItemProps
  }
}

/**
 * Announce Live Region Hook
 * For screen reader announcements
 */
export function useAnnouncer() {
  const liveRegionRef = useRef(null)

  useEffect(() => {
    // Create live region if it doesn't exist
    if (!liveRegionRef.current) {
      const liveRegion = document.createElement('div')
      liveRegion.setAttribute('aria-live', 'polite')
      liveRegion.setAttribute('aria-atomic', 'true')
      liveRegion.setAttribute('class', 'sr-only')
      liveRegion.setAttribute('id', 'live-region')
      document.body.appendChild(liveRegion)
      liveRegionRef.current = liveRegion
    }

    return () => {
      if (liveRegionRef.current && liveRegionRef.current.parentNode) {
        liveRegionRef.current.parentNode.removeChild(liveRegionRef.current)
      }
    }
  }, [])

  const announce = (message, priority = 'polite') => {
    if (liveRegionRef.current) {
      liveRegionRef.current.setAttribute('aria-live', priority)
      liveRegionRef.current.textContent = message
      
      // Clear after announcing
      setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = ''
        }
      }, 1000)
    }
  }

  return { announce }
}

/**
 * Keyboard Navigation Hook
 */
export function useKeyboardNavigation(onEscape, onEnter, onSpace) {
  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'Escape':
        if (onEscape) onEscape(e)
        break
      case 'Enter':
        if (onEnter) onEnter(e)
        break
      case ' ':
        if (onSpace) {
          e.preventDefault()
          onSpace(e)
        }
        break
    }
  }

  return { onKeyDown: handleKeyDown }
}




export default FocusContext
