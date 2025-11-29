/**
 * Accessibility Utilities for WCAG 2.1 AA Compliance
 * Provides helper functions and HOCs for accessible components
 */

import React, { useEffect, useRef, useState } from 'react'

/**
 * Focus management hook
 * Traps focus within a container (for modals, dialogs)
 */
export const useFocusTrap = (isActive = true) => {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTab = (e) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleTab)
    firstElement?.focus()

    return () => {
      container.removeEventListener('keydown', handleTab)
    }
  }, [isActive])

  return containerRef
}

/**
 * Announce to screen readers
 * Creates a live region for dynamic announcements
 */
export const announce = (message, priority = 'polite') => {
  const liveRegion = document.getElementById('aria-live-region') || createLiveRegion()
  liveRegion.setAttribute('aria-live', priority)
  liveRegion.textContent = message

  // Clear after announcement
  setTimeout(() => {
    liveRegion.textContent = ''
  }, 1000)
}

const createLiveRegion = () => {
  const region = document.createElement('div')
  region.id = 'aria-live-region'
  region.setAttribute('aria-live', 'polite')
  region.setAttribute('aria-atomic', 'true')
  region.className = 'sr-only'
  region.style.cssText = 'position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden;'
  document.body.appendChild(region)
  return region
}

/**
 * Screen reader only text component
 */
export const VisuallyHidden = ({ children, ...props }) => (
  <span
    style={{
      position: 'absolute',
      left: '-10000px',
      width: '1px',
      height: '1px',
      overflow: 'hidden'
    }}
    {...props}
  >
    {children}
  </span>
)

/**
 * Skip to main content link
 */
export const SkipToContent = ({ targetId = 'main-content' }) => (
  <a
    href={`#${targetId}`}
    className="skip-to-content"
    style={{
      position: 'absolute',
      left: '-10000px',
      top: 'auto',
      width: '1px',
      height: '1px',
      overflow: 'hidden',
      zIndex: 9999
    }}
    onFocus={(e) => {
      e.target.style.position = 'fixed'
      e.target.style.top = '0'
      e.target.style.left = '0'
      e.target.style.width = 'auto'
      e.target.style.height = 'auto'
      e.target.style.padding = '1rem 2rem'
      e.target.style.background = 'var(--color-primary-500, #58a6ff)'
      e.target.style.color = '#ffffff'
      e.target.style.textDecoration = 'none'
    }}
    onBlur={(e) => {
      e.target.style.position = 'absolute'
      e.target.style.left = '-10000px'
      e.target.style.top = 'auto'
      e.target.style.width = '1px'
      e.target.style.height = '1px'
    }}
  >
    Skip to main content
  </a>
)

/**
 * Accessible Button HOC
 * Ensures buttons have proper ARIA attributes
 */
export const withAccessibleButton = (Component) => {
  return React.forwardRef(({
    ariaLabel,
    ariaDescribedBy,
    ariaPressed,
    ariaExpanded,
    ariaHaspopup,
    disabled,
    children,
    ...props
  }, ref) => {
    const hasTextContent = typeof children === 'string' ||
      (React.isValidElement(children) && typeof children.props.children === 'string')

    return (
      <Component
        ref={ref}
        aria-label={!hasTextContent && ariaLabel ? ariaLabel : undefined}
        aria-describedby={ariaDescribedBy}
        aria-pressed={ariaPressed}
        aria-expanded={ariaExpanded}
        aria-haspopup={ariaHaspopup}
        aria-disabled={disabled}
        disabled={disabled}
        role="button"
        tabIndex={disabled ? -1 : 0}
        {...props}
      >
        {children}
      </Component>
    )
  })
}

/**
 * Accessible Modal wrapper
 */
export const AccessibleModal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className = ''
}) => {
  const modalRef = useFocusTrap(isOpen)
  const titleId = `modal-title-${React.useId ? React.useId() : Math.random()}`
  const descId = `modal-desc-${React.useId ? React.useId() : Math.random()}`

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      announce(`${title} dialog opened`, 'assertive')
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, title])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
        announce(`${title} dialog closed`, 'polite')
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose, title])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      ref={modalRef}
      className={`fixed inset-0 z-50 ${className}`}
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="rounded-xl max-w-2xl w-full p-6" style={{ background: 'rgba(22, 27, 34, 0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <h2 id={titleId} className="text-2xl font-bold mb-4 text-white">
            {title}
          </h2>
          {description && (
            <p id={descId} className="text-[#8b949e] mb-4">
              {description}
            </p>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}

/**
 * Accessible form field with error handling
 */
export const AccessibleFormField = ({
  label,
  error,
  required,
  helpText,
  children,
  id
}) => {
  const fieldId = id || `field-${React.useId ? React.useId() : Math.random()}`
  const errorId = `${fieldId}-error`
  const helpId = `${fieldId}-help`

  return (
    <div className="mb-4">
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium mb-2"
      >
        {label}
        {required && (
          <span aria-label="required" className="text-red-500 ml-1">
            *
          </span>
        )}
      </label>

      {helpText && (
        <p id={helpId} className="text-sm text-gray-500 mb-2">
          {helpText}
        </p>
      )}

      {React.cloneElement(children, {
        id: fieldId,
        'aria-required': required,
        'aria-invalid': !!error,
        'aria-describedby': [
          error ? errorId : null,
          helpText ? helpId : null
        ].filter(Boolean).join(' ') || undefined
      })}

      {error && (
        <p
          id={errorId}
          role="alert"
          aria-live="polite"
          className="text-sm text-red-600 mt-1"
        >
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * Accessible tabs component
 */
export const AccessibleTabs = ({ tabs, activeTab, onChange, children }) => {
  const [focusedIndex, setFocusedIndex] = useState(0)
  const tabRefs = useRef([])

  useEffect(() => {
    const activeIndex = tabs.findIndex(tab => tab.id === activeTab)
    if (activeIndex !== -1) {
      setFocusedIndex(activeIndex)
    }
  }, [activeTab, tabs])

  const handleKeyDown = (e, index) => {
    let newIndex = index

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        newIndex = (index + 1) % tabs.length
        break
      case 'ArrowLeft':
        e.preventDefault()
        newIndex = (index - 1 + tabs.length) % tabs.length
        break
      case 'Home':
        e.preventDefault()
        newIndex = 0
        break
      case 'End':
        e.preventDefault()
        newIndex = tabs.length - 1
        break
      default:
        return
    }

    setFocusedIndex(newIndex)
    tabRefs.current[newIndex]?.focus()
    onChange(tabs[newIndex].id)
  }

  return (
    <div>
      <div role="tablist" className="flex border-b border-white/10">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={el => tabRefs.current[index] = el}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={activeTab !== tab.id}
          tabIndex={0}
          className="py-4"
        >
          {activeTab === tab.id && children(tab)}
        </div>
      ))}
    </div>
  )
}

/**
 * Keyboard navigation hints
 */
export const KeyboardHint = ({ keys, action }) => (
  <VisuallyHidden>
    Press {keys.join(' + ')} to {action}
  </VisuallyHidden>
)

/**
 * Loading state announcer
 */
export const useLoadingAnnouncement = (isLoading, message = 'Loading') => {
  useEffect(() => {
    if (isLoading) {
      announce(`${message}, please wait`, 'polite')
    } else {
      announce('Content loaded', 'polite')
    }
  }, [isLoading, message])
}

/**
 * Error announcer
 */
export const useErrorAnnouncement = (error) => {
  useEffect(() => {
    if (error) {
      announce(`Error: ${error}`, 'assertive')
    }
  }, [error])
}

export default {
  useFocusTrap,
  announce,
  VisuallyHidden,
  SkipToContent,
  withAccessibleButton,
  AccessibleModal,
  AccessibleFormField,
  AccessibleTabs,
  KeyboardHint,
  useLoadingAnnouncement,
  useErrorAnnouncement
}

