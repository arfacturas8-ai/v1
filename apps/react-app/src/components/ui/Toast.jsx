import React, { useEffect, useState, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { createPortal } from 'react-dom'
import { getErrorMessage } from '../../utils/errorUtils'

const Toast = ({
  id,
  title,
  message,
  type = 'info',
  duration = 5000,
  position = 'top-right',
  closable = true,
  onClose,
  action,
  autoClose = true,
  className = ''
}) => {
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [paused, setPaused] = useState(false)
  const [timeLeft, setTimeLeft] = useState(duration)

  // Icons for different toast types
  const icons = {
    success: <CheckCircle style={{
  width: '20px',
  height: '20px'
}} aria-hidden="true" />,
    error: <AlertCircle style={{
  width: '20px',
  height: '20px'
}} aria-hidden="true" />,
    warning: <AlertTriangle style={{
  width: '20px',
  height: '20px'
}} aria-hidden="true" />,
    info: <Info style={{
  width: '20px',
  height: '20px'
}} aria-hidden="true" />
  }

  // Colors for different toast types
  const typeClasses = {
    success: 'bg-success/10 border-success text-success',
    error: 'bg-error/10 border-error text-error', 
    warning: 'bg-warning/10 border-warning text-warning',
    info: 'bg-info/10 border-info text-info'
  }

  // Position classes
  const positionClasses = {
    'top-left': 'top-lg left-lg',
    'top-center': 'top-lg left-1/2 transform -translate-x-1/2',
    'top-right': 'top-lg right-lg',
    'bottom-left': 'bottom-lg left-lg',
    'bottom-center': 'bottom-lg left-1/2 transform -translate-x-1/2',
    'bottom-right': 'bottom-lg right-lg'
  }

  // Animation classes based on position
  const getAnimationClasses = () => {
    const isTop = position.includes('top')
    const isLeft = position.includes('left')
    const isRight = position.includes('right')
    const isCenter = position.includes('center')

    if (exiting) {
      if (isCenter) {
        return isTop ? 'animate-slide-up opacity-0' : 'animate-slide-down opacity-0'
      }
      return isLeft ? '-translate-x-full opacity-0' : 'translate-x-full opacity-0'
    }

    if (visible) {
      return 'translate-x-0 opacity-100'
    }

    // Initial state
    if (isCenter) {
      return isTop ? '-translate-y-full opacity-0' : 'translate-y-full opacity-0'
    }
    return isLeft ? '-translate-x-full opacity-0' : 'translate-x-full opacity-0'
  }

  // Handle close
  const handleClose = useCallback(() => {
    if (exiting) return

    setExiting(true)
    setTimeout(() => {
      onClose?.(id)
    }, 300) // Match animation duration
  }, [exiting, onClose, id])

  // Handle auto close
  useEffect(() => {
    if (!autoClose || duration <= 0 || paused || exiting) return

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 100) {
          handleClose()
          return 0
        }
        return prev - 100
      })
    }, 100)

    return () => clearInterval(interval)
  }, [autoClose, duration, paused, exiting, handleClose])

  // Show toast with animation
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && closable) {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [closable, handleClose])

  const progressPercentage = autoClose && duration > 0 ? (timeLeft / duration) * 100 : 100

  return (
    <div
      style={{
  position: 'fixed',
  width: '100%'
}}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        style={{
  position: 'relative',
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px'
}}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Progress bar */}
        {autoClose && duration > 0 && (
          <div style={{
  position: 'absolute',
  height: '4px',
  overflow: 'hidden'
}}>
            <div
              style={{
  height: '100%'
}}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}

        <div className="p-lg">
          <div style={{
  display: 'flex',
  alignItems: 'flex-start'
}}>
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {icons[type]}
            </div>

            {/* Content */}
            <div style={{
  flex: '1'
}}>
              {title && (
                <h3 style={{
  fontWeight: '600'
}}>
                  {title}
                </h3>
              )}
              {message && (
                <p className="text-secondary text-sm leading-relaxed">
                  {typeof message === 'string' ? message : getErrorMessage(message, 'An error occurred')}
                </p>
              )}

              {/* Action button */}
              {action && (
                <div className="mt-md">
                  <button
                    onClick={action.onClick}
                    style={{
  fontWeight: '500',
  paddingLeft: '0px',
  paddingRight: '0px'
}}
                    style={{ color: 'currentColor' }}
                  >
                    {action.label}
                  </button>
                </div>
              )}
            </div>

            {/* Close button */}
            {closable && (
              <button
                onClick={handleClose}
                style={{
  padding: '4px'
}}
                aria-label="Close notification"
              >
                <X style={{
  width: '16px',
  height: '16px'
}} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Toast Container Component
const ToastContainer = ({ toasts, position = 'top-right', className = '' }) => {
  if (!toasts || toasts.length === 0) return null

  return createPortal(
    <div style={{
  position: 'fixed'
}}>
      <div style={{
  position: 'absolute',
  display: 'flex',
  flexDirection: 'column'
}}>
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast {...toast} />
          </div>
        ))}
      </div>
    </div>,
    document.body
  )
}




export default Toast
