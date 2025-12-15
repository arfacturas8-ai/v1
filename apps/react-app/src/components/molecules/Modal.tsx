import React from 'react';
import { colors, spacing, typography, radii, animation, shadows, zIndex } from '../../design-system/tokens';

export type ModalSize = 'sm' | 'md' | 'lg' | 'fullscreen';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: ModalSize;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  children,
  footer,
}) => {
  const [isAnimating, setIsAnimating] = React.useState(false);
  const modalRef = React.useRef<HTMLDivElement>(null);

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closeOnEscape, onClose]);

  // Animate on open/close
  React.useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  const getSizeStyles = (): React.CSSProperties => {
    if (size === 'fullscreen') {
      return {
        width: '100vw',
        height: '100vh',
        maxWidth: '100vw',
        maxHeight: '100vh',
        borderRadius: 0,
        margin: 0,
      };
    }

    const sizes = {
      sm: { maxWidth: '400px', margin: spacing[4] },
      md: { maxWidth: '600px', margin: spacing[4] },
      lg: { maxWidth: '900px', margin: spacing[4] },
    };

    return sizes[size];
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleAnimationEnd = () => {
    if (!isOpen) {
      setIsAnimating(false);
    }
  };

  if (!isOpen && !isAnimating) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: zIndex.modalBackdrop,
      }}
    >
      {/* Backdrop */}
      <div
        onClick={handleOverlayClick}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'var(--bg-tertiary)',
          backdropFilter: 'blur(4px)',
          animation: isOpen
            ? `fadeIn ${animation.duration.normal} ${animation.easing.easeOut}`
            : `fadeOut ${animation.duration.normal} ${animation.easing.easeOut}`,
        }}
        onAnimationEnd={handleAnimationEnd}
      />

      {/* Modal Container */}
      <div
        style={{
          position: 'relative',
          zIndex: zIndex.modal,
          display: 'flex',
          alignItems: size === 'fullscreen' ? 'stretch' : 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: size === 'fullscreen' ? 0 : undefined,
        }}
        onClick={handleOverlayClick}
      >
        {/* Modal Content */}
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          style={{
            ...getSizeStyles(),
            backgroundColor: colors.bg.elevated,
            borderRadius: size === 'fullscreen' ? 0 : radii.xl,
            boxShadow: shadows.xl,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: isOpen
              ? `slideUp ${animation.duration.normal} ${animation.easing.easeOut}`
              : `slideDown ${animation.duration.normal} ${animation.easing.easeOut}`,
          }}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: spacing[5],
                borderBottom: `1px solid ${colors.border.subtle}`,
              }}
            >
              {title && (
                <h2
                  id="modal-title"
                  style={{
                    margin: 0,
                    fontSize: typography.fontSize.xl,
                    fontWeight: typography.fontWeight.bold,
                    fontFamily: typography.fontFamily.sans,
                    color: colors.text.primary,
                  }}
                >
                  {title}
                </h2>
              )}
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close modal"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: colors.text.secondary,
                    cursor: 'pointer',
                    padding: spacing[2],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: radii.md,
                    marginLeft: 'auto',
                    transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bg.hover;
                    e.currentTarget.style.color = colors.text.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = colors.text.secondary;
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M18 6L6 18M6 6l12 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Body */}
          <div
            style={{
              flex: 1,
              padding: spacing[5],
              overflowY: 'auto',
              color: colors.text.primary,
            }}
          >
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div
              style={{
                padding: spacing[5],
                borderTop: `1px solid ${colors.border.subtle}`,
                display: 'flex',
                justifyContent: 'flex-end',
                gap: spacing[3],
              }}
            >
              {footer}
            </div>
          )}
        </div>
      </div>

      {/* Global Styles for Animations */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
          }
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          @keyframes slideDown {
            from {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
            to {
              opacity: 0;
              transform: translateY(20px) scale(0.95);
            }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default Modal;
