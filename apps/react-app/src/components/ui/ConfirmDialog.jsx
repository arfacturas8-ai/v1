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
    iconBg: 'rgba(239, 68, 68, 0.1)',
    iconColor: '#EF4444',
    buttonBg: 'linear-gradient(135deg, rgba(220, 38, 38, 0.9) 0%, rgba(185, 28, 28, 0.9) 100%)'
  },
  warning: {
    iconBg: 'rgba(245, 158, 11, 0.1)',
    iconColor: '#F59E0B',
    buttonBg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.9) 0%, rgba(217, 119, 6, 0.9) 100%)'
  },
  info: {
    iconBg: 'rgba(88, 166, 255, 0.1)',
    iconColor: '#58a6ff',
    buttonBg: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)'
  },
  success: {
    iconBg: 'rgba(34, 197, 94, 0.1)',
    iconColor: '#10B981',
    buttonBg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%)'
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
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)'
            }}
          />

          {/* Dialog */}
          <div
            style={{
              position: 'relative',
              background: '#FFFFFF',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              border: '1px solid #E8EAED',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
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
              <X size={20} style={{ color: '#666666' }} />
            </button>

            {/* Icon */}
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: colors.iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Icon size={24} style={{ color: colors.iconColor }} />
            </div>

            {/* Content */}
            <h3 style={{
              fontWeight: '700',
              fontSize: '20px',
              color: '#1A1A1A',
              marginBottom: '8px'
            }}>
              {title}
            </h3>
            <p style={{
              color: '#666666',
              fontSize: '15px',
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
                  paddingLeft: '20px',
                  paddingRight: '20px',
                  paddingTop: '12px',
                  paddingBottom: '12px',
                  color: '#666666',
                  background: '#F8F9FA',
                  border: '1px solid #E8EAED',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#F0F2F5')}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.background = '#F8F9FA')}
              >
                {cancelLabel}
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                style={{
                  paddingLeft: '20px',
                  paddingRight: '20px',
                  paddingTop: '12px',
                  paddingBottom: '12px',
                  color: '#FFFFFF',
                  background: colors.buttonBg,
                  backdropFilter: 'blur(40px) saturate(200%)',
                  WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                  border: type === 'info' ? '1px solid rgba(88, 166, 255, 0.3)' : 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                  transition: 'opacity 0.2s',
                  boxShadow: type === 'info' ? '0 4px 16px rgba(88, 166, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)' : '0 4px 16px rgba(0, 0, 0, 0.2)'
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.opacity = '1')}
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
