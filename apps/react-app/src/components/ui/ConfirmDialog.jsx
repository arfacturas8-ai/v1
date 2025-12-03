import React, { useState, useEffect } from 'react'
import { AlertTriangle, Info, CheckCircle, XCircle, X } from 'lucide-react'
/**
 * ConfirmDialog Component
 * Modern replacement for window.confirm() with better UX
 */

const iconMap = {
  danger: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
  error: XCircle
}

const colorMap = {
  danger: {
    bg: 'bg-red-500/10',
    text: 'text-red-500',
    button: 'bg-red-600 hover:bg-red-700'
  },
  warning: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-500',
    button: 'bg-yellow-600 hover:bg-yellow-700'
  },
  info: {
    bg: 'bg-[#58a6ff]/10',
    text: 'text-blue-500',
    button: 'bg-[#58a6ff] hover:bg-blue-700'
  },
  success: {
    bg: 'bg-green-500/10',
    text: 'text-green-500',
    button: 'bg-green-600 hover:bg-green-700'
  }
}

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  type = 'info', // danger, warning, info, success
  loading = false
}) => {
  const [isClosing, setIsClosing] = useState(false)

  const Icon = iconMap[type] || iconMap.info
  const colors = colorMap[type] || colorMap.info

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, loading])

  const handleClose = () => {
    if (loading) return
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 200)
  }

  const handleConfirm = async () => {
    await onConfirm()
    handleClose()
  }

  if (!isOpen && !isClosing) return null

  return (
    <div>
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          {/* Backdrop */}
          <div
            onClick={handleClose}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(4px)'
            }}
          />

          {/* Dialog */}
          <div
            style={{
              position: 'relative',
              background: 'rgba(20, 20, 20, 0.6)',
              backdropFilter: 'blur(12px)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              disabled={loading}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                padding: '4px',
                background: 'transparent',
                border: 'none',
                borderRadius: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              <X size={20} style={{
                color: '#666666'
              }} />
            </button>

            {/* Icon */}
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: `${type === 'danger' ? 'rgba(239, 68, 68, 0.1)' : type === 'warning' ? 'rgba(245, 158, 11, 0.1)' : type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(59, 130, 246, 0.1)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Icon className={colors.text} size={24} />
            </div>

            {/* Content */}
            <h3 style={{
              fontWeight: '600',
              fontSize: '20px',
              color: '#ffffff',
              marginBottom: '8px'
            }}>
              {title}
            </h3>
            <p style={{
              color: '#666666',
              fontSize: '14px',
              lineHeight: '1.5',
              marginBottom: '24px'
            }}>
              {message}
            </p>

            {/* Actions */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleClose}
                disabled={loading}
                style={{
                  paddingLeft: '16px',
                  paddingRight: '16px',
                  paddingTop: '10px',
                  paddingBottom: '10px',
                  color: '#666666',
                  background: 'rgba(20, 20, 20, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1
                }}
              >
                {cancelLabel}
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                style={{
                  paddingLeft: '16px',
                  paddingRight: '16px',
                  paddingTop: '10px',
                  paddingBottom: '10px',
                  color: '#ffffff',
                  background: `${type === 'danger' ? 'linear-gradient(to right, #DC2626, #B91C1C)' : 'linear-gradient(to right, #58a6ff, #a371f7)'}`,
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1
                }}
              >
                {loading && (
                  <svg style={{
                    height: '16px',
                    width: '16px',
                    animation: 'spin 1s linear infinite'
                  }} viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Hook for easier usage
export const useConfirmDialog = () => {
  const [dialog, setDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {}
  })

  const confirm = ({ title, message, type = 'info', confirmLabel, cancelLabel }) => {
    return new Promise((resolve) => {
      setDialog({
        isOpen: true,
        title,
        message,
        type,
        confirmLabel,
        cancelLabel,
        onConfirm: () => {
          resolve(true)
          setDialog(prev => ({ ...prev, isOpen: false }))
        }
      })
    })
  }

  const Dialog = () => (
    <ConfirmDialog
      {...dialog}
      onClose={() => setDialog(prev => ({ ...prev, isOpen: false }))}
    />
  )

  return { confirm, Dialog }
}




export default iconMap
