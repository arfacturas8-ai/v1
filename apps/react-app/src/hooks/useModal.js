/**
 * CRYB Platform - Modal Hook
 * Manage modal state and interactions
 */

import { useState, useCallback, useEffect } from 'react';

export const useModal = (initialState = false, options = {}) => {
  const {
    onOpen,
    onClose,
    closeOnEscape = true,
    preventClose = false,
  } = options;

  const [isOpen, setIsOpen] = useState(initialState);
  const [modalData, setModalData] = useState(null);

  // Open modal
  const open = useCallback((data = null) => {
    setIsOpen(true);
    setModalData(data);
    onOpen?.(data);
  }, [onOpen]);

  // Close modal
  const close = useCallback(() => {
    if (preventClose) return;

    setIsOpen(false);
    setModalData(null);
    onClose?.();
  }, [preventClose, onClose]);

  // Toggle modal
  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, close]);

  return {
    isOpen,
    open,
    close,
    toggle,
    modalData,
    setModalData,
  };
};

export default useModal;
