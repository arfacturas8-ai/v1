/**
 * Hook to manage Undo Toast notifications
 */

import { useState, useCallback } from 'react';

let toastId = 0;

export const useUndoToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((options) => {
    const id = toastId++;
    const toast = {
      id,
      message: options.message || 'Action completed',
      type: options.type || 'success',
      duration: options.duration || 5000,
      onUndo: options.onUndo,
    };

    setToasts(prev => [...prev, toast]);

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showSuccess = useCallback((message, onUndo) => {
    return showToast({ message, type: 'success', onUndo });
  }, [showToast]);

  const showError = useCallback((message) => {
    return showToast({ message, type: 'error' });
  }, [showToast]);

  const showInfo = useCallback((message) => {
    return showToast({ message, type: 'info' });
  }, [showToast]);

  return {
    toasts,
    showToast,
    removeToast,
    showSuccess,
    showError,
    showInfo,
  };
};
