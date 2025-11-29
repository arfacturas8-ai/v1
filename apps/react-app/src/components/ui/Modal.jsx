import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';
import { IconButton } from './Button';

export const Modal = ({
  isOpen,
  onClose,
  children,
  size = 'md',
  className,
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  preventClose = false,
  hasUnsavedChanges = false,
  confirmCloseMessage = 'You have unsaved changes. Are you sure you want to close?',
}) => {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Store the element that had focus before modal opened
      previousActiveElement.current = document.activeElement;
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle focus trap and return focus
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element when modal opens
    if (firstElement) {
      firstElement.focus();
    }

    // Trap focus within modal
    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTabKey);

    return () => {
      modal.removeEventListener('keydown', handleTabKey);
      // Return focus to previous element when modal closes
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape]);

  const handleClose = () => {
    if (preventClose) return;

    if (hasUnsavedChanges) {
      if (window.confirm(confirmCloseMessage)) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  return createPortal(
    <div
      style={{
  position: 'fixed',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px'
}}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
  position: 'absolute'
}}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      <div
        ref={modalRef}
        className={cn(
          'relative w-full bg-bg-secondary rounded-lg shadow-2xl',
          'border border-border',
          'max-h-[90vh] overflow-y-auto scrollbar-thin',
          'animate-zoom-in',
          'focus:outline-none',
          sizes[size],
          className
        )}
        tabIndex={-1}
      >
        {showCloseButton && !preventClose && (
          <IconButton
            variant="ghost"
            size="sm"
            aria-label="Close modal"
            onClick={handleClose}
            style={{
  position: 'absolute'
}}
          >
            <svg style={{
  width: '20px',
  height: '20px'
}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </IconButton>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
};

export const ModalHeader = ({ children, className }) => (
  <div className={cn('px-6 py-4 border-b border-border', className)}>
    {children}
  </div>
);

export const ModalTitle = ({ children, className }) => (
  <h2 className={cn('text-2xl font-semibold text-text-primary', className)}>
    {children}
  </h2>
);

export const ModalBody = ({ children, className }) => (
  <div className={cn('px-6 py-4', className)}>
    {children}
  </div>
);

export const ModalFooter = ({ children, className }) => (
  <div className={cn('px-6 py-4 border-t border-border flex items-center justify-end gap-3', className)}>
    {children}
  </div>
);




export default Modal
