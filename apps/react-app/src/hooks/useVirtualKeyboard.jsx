import { useEffect, useState, useCallback } from 'react'

/**
 * Virtual keyboard handler for mobile devices
 * Detects when virtual keyboard opens/closes and adjusts viewport
 * @param {Object} options - Configuration options
 * @param {boolean} options.adjustViewport - Whether to adjust viewport height (default: true)
 * @param {Function} options.onKeyboardShow - Callback when keyboard shows
 * @param {Function} options.onKeyboardHide - Callback when keyboard hides
 * @returns {Object} - Keyboard state and height
 */
export function useVirtualKeyboard(options = {}) {
  const {
    adjustViewport = true,
    onKeyboardShow,
    onKeyboardHide
  } = options

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight)

  const handleResize = useCallback(() => {
    const newHeight = window.innerHeight
    const heightDiff = viewportHeight - newHeight

    // If height decreased by significant amount, keyboard likely opened
    if (heightDiff > 150) {
      setIsKeyboardVisible(true)
      setKeyboardHeight(heightDiff)

      if (adjustViewport) {
        document.documentElement.style.setProperty('--keyboard-height', `${heightDiff}px`)
        document.documentElement.style.setProperty('--viewport-height', `${newHeight}px`)
      }

      onKeyboardShow?.(heightDiff)
    }
    // If height increased significantly, keyboard likely closed
    else if (heightDiff < -150) {
      setIsKeyboardVisible(false)
      setKeyboardHeight(0)

      if (adjustViewport) {
        document.documentElement.style.setProperty('--keyboard-height', '0px')
        document.documentElement.style.setProperty('--viewport-height', `${newHeight}px`)
      }

      onKeyboardHide?.()
    }

    setViewportHeight(newHeight)
  }, [viewportHeight, adjustViewport, onKeyboardShow, onKeyboardHide])

  // Handle focus on input fields
  const handleFocusIn = useCallback((e) => {
    // Scroll focused element into view on mobile
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      setTimeout(() => {
        e.target.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        })
      }, 300) // Wait for keyboard animation
    }
  }, [])

  useEffect(() => {
    window.addEventListener('resize', handleResize)
    window.addEventListener('focusin', handleFocusIn)

    // Set initial viewport height
    setViewportHeight(window.innerHeight)
    if (adjustViewport) {
      document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`)
      document.documentElement.style.setProperty('--keyboard-height', '0px')
    }

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('focusin', handleFocusIn)
    }
  }, [handleResize, handleFocusIn, adjustViewport])

  return {
    isKeyboardVisible,
    keyboardHeight,
    viewportHeight
  }
}

export default useVirtualKeyboard
