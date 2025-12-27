import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';
import { IconButton } from './Button';
import { colors } from '../../design-system/tokens';

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

  const getSizeMaxWidth = () => {
    switch (size) {
      case 'sm': return '448px';
      case 'md': return '512px';
      case 'lg': return '672px';
      case 'xl': return '896px';
      case 'full': return 'calc(100% - 32px)';
      default: return '512px';
    }
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1100 // Modal layer
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      <div
        ref={modalRef}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: getSizeMaxWidth(),
          background: colors.bg.secondary,
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          maxHeight: '90vh',
          overflowY: 'auto',
          outline: 'none'
        }}
        className={className}
        tabIndex={-1}
      >
        {showCloseButton && !preventClose && (
          <button
            onClick={handleClose}
            aria-label="Close modal"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              color: colors.text.secondary,
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = colors.bg.hover}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
};

export const ModalHeader = ({ children, className, style }) => (
  <div
    className={className}
    style={{
      padding: '20px 24px',
      borderBottom: `1px solid ${colors.border.subtle}`,
      ...style
    }}
  >
    {children}
  </div>
);

export const ModalTitle = ({ children, className, style }) => (
  <h2
    className={className}
    style={{
      fontSize: '20px',
      fontWeight: '700',
      color: colors.text.primary,
      margin: 0,
      ...style
    }}
  >
    {children}
  </h2>
);

export const ModalBody = ({ children, className, style }) => (
  <div
    className={className}
    style={{
      padding: '24px',
      ...style
    }}
  >
    {children}
  </div>
);

export const ModalFooter = ({ children, className, style }) => (
  <div
    className={className}
    style={{
      padding: '20px 24px',
      borderTop: '1px solid #E8EAED',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: '12px',
      ...style
    }}
  >
    {children}
  </div>
);




export default Modal
