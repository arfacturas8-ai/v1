// Mobile Accessibility Utilities
// Enhances mobile app accessibility for screen readers, keyboard navigation, and assistive technologies

import { useEffect } from 'react'

/**
 * Screen Reader Utilities
 */
export const ScreenReader = {
  // Announce text to screen readers
  announce: (text, priority = 'polite') => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.style.position = 'absolute'
    announcement.style.left = '-10000px'
    announcement.style.width = '1px'
    announcement.style.height = '1px'
    announcement.style.overflow = 'hidden'
    
    document.body.appendChild(announcement)
    announcement.textContent = text
    
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  },
  
  // Create visually hidden text for screen readers
  createHiddenText: (text) => {
    const span = document.createElement('span')
    span.className = 'sr-only'
    span.textContent = text
    return span
  }
}

/**
 * Focus Management for Mobile
 */
export class FocusManager {
  constructor() {
    this.focusStack = []
    this.setupTrapListeners()
  }
  
  // Save current focus and move to new element
  moveFocus(element, saveCurrentFocus = true) {
    if (saveCurrentFocus && document.activeElement) {
      this.focusStack.push(document.activeElement)
    }
    
    if (element) {
      element.focus()
      
      // Ensure focus is visible on mobile
      if (element.scrollIntoView) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        })
      }
    }
  }
  
  // Return focus to previous element
  restoreFocus() {
    const previousElement = this.focusStack.pop()
    if (previousElement && typeof previousElement.focus === 'function') {
      previousElement.focus()
    }
  }
  
  // Create focus trap for modals/dialogs
  trapFocus(container) {
    if (!container) return null
    
    const focusableElements = this.getFocusableElements(container)
    if (focusableElements.length === 0) return null
    
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
      
      if (e.key === 'Escape') {
        this.restoreFocus()
      }
    }
    
    container.addEventListener('keydown', handleKeyDown)
    firstElement.focus()
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }
  
  // Get all focusable elements in container
  getFocusableElements(container) {
    const focusableSelectors = [
      'button',
      '[href]',
      'input',
      'select',
      'textarea',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(',')
    
    const elements = container.querySelectorAll(focusableSelectors)
    return Array.from(elements).filter(element => {
      return !element.disabled && 
             !element.getAttribute('aria-hidden') &&
             element.offsetParent !== null
    })
  }
  
  setupTrapListeners() {
    // Handle escape key globally
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.focusStack.length > 0) {
        this.restoreFocus()
      }
    })
  }
}

/**
 * Touch and Voice Navigation Utilities
 */
export const TouchNavigation = {
  // Make element accessible via touch
  makeTouchAccessible: (element, options = {}) => {
    const {
      role = 'button',
      label = '',
      description = '',
      onActivate = null
    } = options
    
    element.setAttribute('role', role)
    element.setAttribute('tabindex', '0')
    
    if (label) {
      element.setAttribute('aria-label', label)
    }
    
    if (description) {
      element.setAttribute('aria-describedby', description)
    }
    
    // Handle activation
    const handleActivation = (e) => {
      if (onActivate && (e.type === 'click' || 
          (e.type === 'keydown' && (e.key === 'Enter' || e.key === ' ')))) {
        e.preventDefault()
        onActivate(e)
      }
    }
    
    element.addEventListener('click', handleActivation)
    element.addEventListener('keydown', handleActivation)
    
    return () => {
      element.removeEventListener('click', handleActivation)
      element.removeEventListener('keydown', handleActivation)
    }
  },
  
  // Add swipe gestures for screen readers
  addSwipeNavigation: (container, options = {}) => {
    const {
      onSwipeLeft = null,
      onSwipeRight = null,
      onSwipeUp = null,
      onSwipeDown = null
    } = options
    
    let touchStart = null
    let touchEnd = null
    
    const handleTouchStart = (e) => {
      touchStart = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      }
    }
    
    const handleTouchEnd = (e) => {
      if (!touchStart) return
      
      touchEnd = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY
      }
      
      const deltaX = touchStart.x - touchEnd.x
      const deltaY = touchStart.y - touchEnd.y
      const minSwipeDistance = 50
      
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > minSwipeDistance) {
          if (deltaX > 0 && onSwipeLeft) {
            onSwipeLeft()
            ScreenReader.announce('Swiped left')
          } else if (deltaX < 0 && onSwipeRight) {
            onSwipeRight()
            ScreenReader.announce('Swiped right')
          }
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) > minSwipeDistance) {
          if (deltaY > 0 && onSwipeUp) {
            onSwipeUp()
            ScreenReader.announce('Swiped up')
          } else if (deltaY < 0 && onSwipeDown) {
            onSwipeDown()
            ScreenReader.announce('Swiped down')
          }
        }
      }
    }
    
    container.addEventListener('touchstart', handleTouchStart)
    container.addEventListener('touchend', handleTouchEnd)
    
    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }
}

/**
 * ARIA Live Region Manager
 */
export class LiveRegionManager {
  constructor() {
    this.regions = new Map()
    this.createDefaultRegions()
  }
  
  createDefaultRegions() {
    this.createRegion('polite', 'polite')
    this.createRegion('assertive', 'assertive')
    this.createRegion('status', 'polite', 'status')
  }
  
  createRegion(id, liveLevel, role = null) {
    const region = document.createElement('div')
    region.id = `live-region-${id}`
    region.setAttribute('aria-live', liveLevel)
    region.setAttribute('aria-atomic', 'true')
    
    if (role) {
      region.setAttribute('role', role)
    }
    
    // Hide visually but keep accessible
    region.className = 'sr-only'
    
    document.body.appendChild(region)
    this.regions.set(id, region)
    
    return region
  }
  
  announce(message, regionId = 'polite') {
    const region = this.regions.get(regionId)
    if (region) {
      region.textContent = message
      
      // Clear after announcement
      setTimeout(() => {
        region.textContent = ''
      }, 1000)
    }
  }
  
  updateStatus(status, regionId = 'status') {
    const region = this.regions.get(regionId)
    if (region) {
      region.textContent = status
    }
  }
}

/**
 * Mobile Form Accessibility
 */
export const FormAccessibility = {
  // Enhance form field accessibility
  enhanceFormField: (field, options = {}) => {
    const {
      label,
      description,
      errorMessage,
      required = false,
      invalid = false
    } = options
    
    // Ensure proper labeling
    if (label) {
      const labelElement = document.querySelector(`label[for="${field.id}"]`) ||
                          field.closest('.form-group')?.querySelector('label')
      
      if (labelElement) {
        labelElement.setAttribute('for', field.id)
        field.setAttribute('aria-labelledby', labelElement.id || 'label-' + field.id)
      } else {
        field.setAttribute('aria-label', label)
      }
    }
    
    // Add description
    if (description) {
      const descId = field.id + '-desc'
      let descElement = document.getElementById(descId)
      
      if (!descElement) {
        descElement = document.createElement('div')
        descElement.id = descId
        descElement.className = 'form-help'
        descElement.textContent = description
        field.parentNode.insertBefore(descElement, field.nextSibling)
      }
      
      field.setAttribute('aria-describedby', descId)
    }
    
    // Handle validation states
    field.setAttribute('aria-required', required.toString())
    field.setAttribute('aria-invalid', invalid.toString())
    
    if (invalid && errorMessage) {
      const errorId = field.id + '-error'
      let errorElement = document.getElementById(errorId)
      
      if (!errorElement) {
        errorElement = document.createElement('div')
        errorElement.id = errorId
        errorElement.className = 'form-error'
        errorElement.setAttribute('role', 'alert')
        errorElement.textContent = errorMessage
        field.parentNode.insertBefore(errorElement, field.nextSibling)
      }
      
      const describedBy = field.getAttribute('aria-describedby') || ''
      field.setAttribute('aria-describedby', `${describedBy} ${errorId}`.trim())
    }
  },
  
  // Add mobile-friendly validation
  addMobileValidation: (form) => {
    form.addEventListener('invalid', (e) => {
      e.preventDefault()
      
      const field = e.target
      const message = field.validationMessage
      
      FormAccessibility.enhanceFormField(field, {
        errorMessage: message,
        invalid: true
      })
      
      // Focus and scroll to invalid field
      field.focus()
      field.scrollIntoView({ behavior: 'smooth', block: 'center' })
      
      // Announce error
      ScreenReader.announce(`Error in ${field.name || 'form field'}: ${message}`, 'assertive')
    }, true)
  }
}

/**
 * Mobile Menu Accessibility
 */
export const MenuAccessibility = {
  // Make mobile menu accessible
  enhanceMobileMenu: (menuButton, menu) => {
    const menuId = menu.id || 'mobile-menu'
    menu.id = menuId
    
    // Set up button attributes
    menuButton.setAttribute('aria-expanded', 'false')
    menuButton.setAttribute('aria-controls', menuId)
    menuButton.setAttribute('aria-label', 'Open navigation menu')
    
    // Set up menu attributes
    menu.setAttribute('role', 'menu')
    menu.setAttribute('aria-labelledby', menuButton.id)
    
    // Enhance menu items
    const menuItems = menu.querySelectorAll('a, button')
    menuItems.forEach((item, index) => {
      item.setAttribute('role', 'menuitem')
      item.setAttribute('tabindex', '-1')
      
      if (index === 0) {
        item.setAttribute('tabindex', '0')
      }
    })
    
    // Handle menu interactions
    const handleMenuToggle = () => {
      const isOpen = menuButton.getAttribute('aria-expanded') === 'true'
      menuButton.setAttribute('aria-expanded', (!isOpen).toString())
      
      if (!isOpen) {
        menu.style.display = 'block'
        menuItems[0]?.focus()
        ScreenReader.announce('Navigation menu opened')
      } else {
        menu.style.display = 'none'
        menuButton.focus()
        ScreenReader.announce('Navigation menu closed')
      }
    }
    
    // Handle keyboard navigation in menu
    const handleMenuKeydown = (e) => {
      const currentIndex = Array.from(menuItems).indexOf(document.activeElement)
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          const nextIndex = (currentIndex + 1) % menuItems.length
          menuItems[nextIndex].focus()
          break
          
        case 'ArrowUp':
          e.preventDefault()
          const prevIndex = currentIndex === 0 ? menuItems.length - 1 : currentIndex - 1
          menuItems[prevIndex].focus()
          break
          
        case 'Escape':
          handleMenuToggle()
          break
          
        case 'Home':
          e.preventDefault()
          menuItems[0].focus()
          break
          
        case 'End':
          e.preventDefault()
          menuItems[menuItems.length - 1].focus()
          break
      }
    }
    
    menuButton.addEventListener('click', handleMenuToggle)
    menu.addEventListener('keydown', handleMenuKeydown)
    
    return () => {
      menuButton.removeEventListener('click', handleMenuToggle)
      menu.removeEventListener('keydown', handleMenuKeydown)
    }
  }
}

/**
 * Color Contrast and Theme Utilities
 */
export const ContrastUtils = {
  // Check if user prefers high contrast
  prefersHighContrast: () => {
    return window.matchMedia('(prefers-contrast: high)').matches
  },
  
  // Check if user prefers reduced motion
  prefersReducedMotion: () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  },
  
  // Apply high contrast styles
  applyHighContrast: () => {
    document.documentElement.classList.add('high-contrast')
  },
  
  // Apply reduced motion
  applyReducedMotion: () => {
    document.documentElement.classList.add('reduced-motion')
  }
}

// Initialize accessibility features
export const initMobileAccessibility = () => {
  const liveRegionManager = new LiveRegionManager()
  const focusManager = new FocusManager()
  
  // Apply user preferences
  if (ContrastUtils.prefersHighContrast()) {
    ContrastUtils.applyHighContrast()
  }
  
  if (ContrastUtils.prefersReducedMotion()) {
    ContrastUtils.applyReducedMotion()
  }
  
  // Enhance all forms
  document.querySelectorAll('form').forEach(form => {
    FormAccessibility.addMobileValidation(form)
  })
  
  return {
    liveRegionManager,
    focusManager,
    ScreenReader,
    TouchNavigation,
    FormAccessibility,
    MenuAccessibility
  }
}

// React hooks for accessibility announcements
export function useLoadingAnnouncement(isLoading, message = 'Loading') {
  useEffect(() => {
    if (isLoading && typeof ScreenReader !== 'undefined') {
      ScreenReader.announce(message)
    }
  }, [isLoading, message])
}

export function useErrorAnnouncement(error, prefix = 'Error') {
  useEffect(() => {
    if (error && typeof ScreenReader !== 'undefined') {
      const errorMessage = typeof error === 'string' ? error : error.message || 'An error occurred'
      ScreenReader.announce(`${prefix}: ${errorMessage}`, 'assertive')
    }
  }, [error, prefix])
}

export default {
  initMobileAccessibility,
  ScreenReader,
  FocusManager,
  TouchNavigation,
  LiveRegionManager,
  FormAccessibility,
  MenuAccessibility,
  ContrastUtils,
  useLoadingAnnouncement,
  useErrorAnnouncement
}