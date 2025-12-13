/**
 * CRYB Platform - Modal Component v.1
 * Light theme modals matching design spec
 * Clean, accessible modal/dialog system
 */

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from './button';

// ===== MODAL OVERLAY =====
interface ModalProps {
  /** Whether modal is open */
  open: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal content */
  children: React.ReactNode;
  /** Modal size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Disable close on overlay click */
  disableOverlayClose?: boolean;
  /** Disable close on escape key */
  disableEscapeClose?: boolean;
  /** Show close button */
  showCloseButton?: boolean;
  /** Custom className for modal content */
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  children,
  size = 'md',
  disableOverlayClose = false,
  disableEscapeClose = false,
  showCloseButton = true,
  className = '',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Handle escape key
  useEffect(() => {
    if (!open || disableEscapeClose) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose, disableEscapeClose]);

  // Focus management
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();
    } else {
      previousFocusRef.current?.focus();
    }
  }, [open]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const sizeStyles = {
    sm: { maxWidth: '400px' },
    md: { maxWidth: '600px' },
    lg: { maxWidth: '800px' },
    xl: { maxWidth: '1200px' },
    full: { maxWidth: '95vw', height: '95vh' }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !disableOverlayClose) {
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-modal-backdrop)',
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
        animation: 'fadeIn 200ms ease-out'
      }}
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={modalRef}
        className={`card ${className}`}
        style={{
          position: 'relative',
          width: '100%',
          ...sizeStyles[size],
          maxHeight: size === 'full' ? '95vh' : '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'scaleIn 200ms ease-out',
          zIndex: 'var(--z-modal)'
        }}
        tabIndex={-1}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 'var(--space-4)',
              right: 'var(--space-4)',
              zIndex: 1,
              background: 'none',
              border: 'none',
              padding: 'var(--space-2)',
              cursor: 'pointer',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--text-secondary)',
              transition: 'all var(--transition-normal)'
            }}
            aria-label="Close modal"
            className="hover:bg-[var(--bg-hover)]"
          >
            <X size={24} />
          </button>
        )}

        {children}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

// ===== MODAL HEADER =====
export interface ModalHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({ children, className = '' }) => {
  return (
    <div
      className={className}
      style={{
        padding: 'var(--space-6)',
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0
      }}
    >
      {children}
    </div>
  );
};

// ===== MODAL TITLE =====
export interface ModalTitleProps {
  children: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
}

export const ModalTitle: React.FC<ModalTitleProps> = ({ children, as: Component = 'h2', className = '' }) => {
  return (
    <Component
      className={className}
      style={{
        fontSize: 'var(--text-2xl)',
        fontWeight: 'var(--font-bold)',
        color: 'var(--text-primary)',
        lineHeight: 'var(--leading-tight)',
        margin: 0
      }}
    >
      {children}
    </Component>
  );
};

// ===== MODAL DESCRIPTION =====
export interface ModalDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalDescription: React.FC<ModalDescriptionProps> = ({ children, className = '' }) => {
  return (
    <p
      className={className}
      style={{
        fontSize: 'var(--text-base)',
        color: 'var(--text-secondary)',
        lineHeight: 'var(--leading-normal)',
        marginTop: 'var(--space-2)',
        marginBottom: 0
      }}
    >
      {children}
    </p>
  );
};

// ===== MODAL BODY =====
export interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalBody: React.FC<ModalBodyProps> = ({ children, className = '' }) => {
  return (
    <div
      className={className}
      style={{
        padding: 'var(--space-6)',
        overflow: 'auto',
        flex: 1
      }}
    >
      {children}
    </div>
  );
};

// ===== MODAL FOOTER =====
export interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({ children, className = '' }) => {
  return (
    <div
      className={className}
      style={{
        padding: 'var(--space-6)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        gap: 'var(--space-3)',
        justifyContent: 'flex-end',
        flexShrink: 0
      }}
    >
      {children}
    </div>
  );
};

// ===== CONFIRMATION DIALOG =====
export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false,
}) => {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <ModalHeader>
        <ModalTitle>{title}</ModalTitle>
        {description && <ModalDescription>{description}</ModalDescription>}
      </ModalHeader>

      <ModalFooter>
        <Button
          variant="ghost"
          onClick={onClose}
          disabled={loading}
        >
          {cancelText}
        </Button>
        <Button
          variant={variant === 'danger' ? 'destructive' : 'default'}
          onClick={onConfirm}
          disabled={loading}
        >
          {confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

// ===== EXPORTS =====
export default Modal;
