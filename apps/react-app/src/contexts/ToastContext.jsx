import React, { createContext, useContext, useState, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

const ToastContext = createContext()

const TOAST_TYPES = {
  success: {
    icon: CheckCircle,
    className: 'bg-green-50 border-green-200 text-green-800',
    iconColor: 'text-green-500'
  },
  error: {
    icon: AlertCircle,
    className: 'bg-red-50 border-red-200 text-red-800',
    iconColor: 'text-red-500'
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-orange-50 border-orange-200 text-orange-800',
    iconColor: 'text-orange-500'
  },
  info: {
    icon: Info,
    className: 'bg-blue-50 border-blue-200 text-blue-800',
    iconColor: 'text-blue-500'
  }
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Math.random().toString(36).substr(2, 9)
    const toast = {
      id,
      message,
      type,
      duration,
      timestamp: Date.now()
    }

    setToasts(prev => [...prev, toast])

    // Auto remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const clearAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  // Convenience methods
  const showSuccess = useCallback((message, duration) => showToast(message, 'success', duration), [showToast])
  const showError = useCallback((message, duration) => showToast(message, 'error', duration), [showToast])
  const showWarning = useCallback((message, duration) => showToast(message, 'warning', duration), [showToast])
  const showInfo = useCallback((message, duration) => showToast(message, 'info', duration), [showToast])

  const value = {
    toasts,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast,
    clearAllToasts
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

function Toast({ toast, onRemove }) {
  const config = TOAST_TYPES[toast.type] || TOAST_TYPES.info
  const Icon = config.icon

  const handleRemove = () => {
    onRemove(toast.id)
  }

  return (
    <div 
      className={`
        flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-sm
        pointer-events-auto transform transition-all duration-300 ease-out
        animate-slide-in
        ${config.className}
      `}
      role="alert"
      aria-live="polite"
    >
      <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${config.iconColor}`} />
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-5">
          {toast.message}
        </p>
      </div>
      
      <button
        onClick={handleRemove}
        className="flex-shrink-0 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export default ToastContext