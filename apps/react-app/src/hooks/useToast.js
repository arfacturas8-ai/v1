/**
 * CRYB Platform - Toast Hook
 * Manage toast notifications with queue and auto-dismiss
 */

import { useState, useCallback, useRef } from 'react';

let toastIdCounter = 0;

export const useToast = (options = {}) => {
  const {
    defaultPosition = 'top-right',
    defaultDuration = 5000,
    maxToasts = 5,
  } = options;

  const [toasts, setToasts] = useState([]);
  const toastTimeouts = useRef({});

  // Generate unique ID
  const generateId = () => {
    toastIdCounter += 1;
    return `toast-${toastIdCounter}-${Date.now()}`;
  };

  // Add toast
  const addToast = useCallback((toastOptions) => {
    const id = generateId();
    const toast = {
      id,
      position: defaultPosition,
      duration: defaultDuration,
      autoClose: true,
      closable: true,
      ...toastOptions,
    };

    setToasts(prev => {
      // Limit number of toasts
      const newToasts = [...prev, toast];
      if (newToasts.length > maxToasts) {
        // Remove oldest toast
        const removed = newToasts.shift();
        if (toastTimeouts.current[removed.id]) {
          clearTimeout(toastTimeouts.current[removed.id]);
          delete toastTimeouts.current[removed.id];
        }
      }
      return newToasts;
    });

    return id;
  }, [defaultPosition, defaultDuration, maxToasts]);

  // Remove toast
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
    if (toastTimeouts.current[id]) {
      clearTimeout(toastTimeouts.current[id]);
      delete toastTimeouts.current[id];
    }
  }, []);

  // Remove all toasts
  const removeAllToasts = useCallback(() => {
    setToasts([]);
    Object.values(toastTimeouts.current).forEach(timeout => clearTimeout(timeout));
    toastTimeouts.current = {};
  }, []);

  // Toast variants
  const success = useCallback((message, options = {}) => {
    return addToast({
      type: 'success',
      title: options.title || 'Success',
      message,
      ...options,
    });
  }, [addToast]);

  const error = useCallback((message, options = {}) => {
    return addToast({
      type: 'error',
      title: options.title || 'Error',
      message,
      duration: options.duration || 7000, // Longer for errors
      ...options,
    });
  }, [addToast]);

  const warning = useCallback((message, options = {}) => {
    return addToast({
      type: 'warning',
      title: options.title || 'Warning',
      message,
      ...options,
    });
  }, [addToast]);

  const info = useCallback((message, options = {}) => {
    return addToast({
      type: 'info',
      title: options.title || 'Info',
      message,
      ...options,
    });
  }, [addToast]);

  // Promise toast (for async operations)
  const promise = useCallback(async (promiseOrFn, options = {}) => {
    const {
      loading = '',
      success: successMessage = 'Success!',
      error: errorMessage = 'Error occurred',
    } = options;

    // Show loading toast
    const loadingId = addToast({
      type: 'info',
      title: 'Loading',
      message: loading,
      autoClose: false,
      closable: false,
    });

    try {
      const result = typeof promiseOrFn === 'function' ? await promiseOrFn() : await promiseOrFn;

      // Remove loading toast
      removeToast(loadingId);

      // Show success toast
      addToast({
        type: 'success',
        title: 'Success',
        message: typeof successMessage === 'function' ? successMessage(result) : successMessage,
      });

      return result;
    } catch (err) {
      // Remove loading toast
      removeToast(loadingId);

      // Show error toast
      addToast({
        type: 'error',
        title: 'Error',
        message: typeof errorMessage === 'function' ? errorMessage(err) : errorMessage,
        duration: 7000,
      });

      throw err;
    }
  }, [addToast, removeToast]);

  return {
    toasts,
    addToast,
    removeToast,
    removeAllToasts,
    success,
    error,
    warning,
    info,
    promise,
  };
};

export default useToast;
