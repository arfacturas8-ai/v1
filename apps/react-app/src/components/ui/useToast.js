// Re-export the useToast hook from the context for backward compatibility
export { useToast } from '../../contexts/ToastContext'

// For components still using the old interface, provide a compatibility wrapper
import { useToast as useToastContext } from '../../contexts/ToastContext'

export const useToastCompat = () => {
  const { showToast, removeToast, clearAllToasts } = useToastContext()
  
  // Create convenience methods
  const showSuccess = (message, duration) => showToast(message, 'success', duration)
  const showError = (message, duration) => showToast(message, 'error', duration)
  const showWarning = (message, duration) => showToast(message, 'warning', duration)
  const showInfo = (message, duration) => showToast(message, 'info', duration)
  
  return {
    showToast,
    showSuccess,
    showError, 
    showWarning,
    showInfo,
    removeToast,
    clearAllToasts,
    // Alias for backward compatibility
    toast: showToast,
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo
  }
}

export default useToastContext