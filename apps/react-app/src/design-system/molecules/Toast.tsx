import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';
import { colors, spacing, typography, radii, shadows } from '../tokens';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  id: string;
  message: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose: (id: string) => void;
}

const variantConfig: Record<
  ToastVariant,
  {
    icon: React.ReactNode;
    color: string;
    backgroundColor: string;
  }
> = {
  success: {
    icon: <CheckCircle size={20} />,
    color: colors.semantic.success,
    backgroundColor: `${colors.semantic.success}20`,
  },
  error: {
    icon: <AlertCircle size={20} />,
    color: colors.semantic.error,
    backgroundColor: `${colors.semantic.error}20`,
  },
  warning: {
    icon: <AlertTriangle size={20} />,
    color: colors.semantic.warning,
    backgroundColor: `${colors.semantic.warning}20`,
  },
  info: {
    icon: <Info size={20} />,
    color: colors.semantic.info,
    backgroundColor: `${colors.semantic.info}20`,
  },
};

export const Toast: React.FC<ToastProps> = ({
  id,
  message,
  description,
  variant = 'info',
  duration = 5000,
  action,
  onClose,
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const config = variantConfig[variant];

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, id]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 200);
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        display: 'flex',
        gap: spacing[3],
        padding: spacing[4],
        backgroundColor: colors.bg.elevated,
        border: `1px solid ${colors.border.default}`,
        borderLeft: `4px solid ${config.color}`,
        borderRadius: radii.lg,
        boxShadow: shadows.lg,
        minWidth: '320px',
        maxWidth: '500px',
        animation: isExiting ? 'slideOut 200ms ease-out forwards' : 'slideIn 300ms ease-out',
      }}
    >
      {/* Icon */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          flexShrink: 0,
          color: config.color,
        }}
      >
        {config.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary,
            marginBottom: description ? spacing[1] : 0,
          }}
        >
          {message}
        </div>
        {description && (
          <div
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              lineHeight: typography.lineHeight.relaxed,
            }}
          >
            {description}
          </div>
        )}
        {action && (
          <button
            onClick={() => {
              action.onClick();
              handleClose();
            }}
            style={{
              marginTop: spacing[2],
              padding: 0,
              border: 'none',
              backgroundColor: 'transparent',
              color: config.color,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            {action.label}
          </button>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={handleClose}
        aria-label="Close notification"
        style={{
          width: '24px',
          height: '24px',
          borderRadius: radii.sm,
          border: 'none',
          backgroundColor: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'background-color 150ms ease-out',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.bg.hover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <X size={16} color={colors.text.tertiary} />
      </button>

      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }

          @keyframes slideOut {
            from {
              transform: translateX(0);
              opacity: 1;
            }
            to {
              transform: translateX(100%);
              opacity: 0;
            }
          }
        `}
      </style>
    </div>
  );
};

// Toast container component
interface ToastContainerProps {
  toasts: ToastProps[];
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

const positionStyles: Record<ToastContainerProps['position'], React.CSSProperties> = {
  'top-right': { top: spacing[4], right: spacing[4] },
  'top-left': { top: spacing[4], left: spacing[4] },
  'bottom-right': { bottom: spacing[4], right: spacing[4] },
  'bottom-left': { bottom: spacing[4], left: spacing[4] },
  'top-center': { top: spacing[4], left: '50%', transform: 'translateX(-50%)' },
  'bottom-center': { bottom: spacing[4], left: '50%', transform: 'translateX(-50%)' },
};

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, position = 'top-right' }) => {
  return (
    <div
      style={{
        position: 'fixed',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing[3],
        pointerEvents: 'none',
        ...positionStyles[position],
      }}
    >
      {toasts.map((toast) => (
        <div key={toast.id} style={{ pointerEvents: 'auto' }}>
          <Toast {...toast} />
        </div>
      ))}
    </div>
  );
};
