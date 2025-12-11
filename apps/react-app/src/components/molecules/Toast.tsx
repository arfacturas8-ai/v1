import React from 'react';
import { colors, spacing, typography, radii, animation, shadows, zIndex } from '../../design-system/tokens';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';
export type ToastPosition = 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface ToastProps {
  variant?: ToastVariant;
  position?: ToastPosition;
  message: string;
  description?: string;
  duration?: number;
  showProgress?: boolean;
  dismissible?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  icon?: React.ReactNode;
}

const Toast: React.FC<ToastProps> = ({
  variant = 'info',
  position = 'bottom',
  message,
  description,
  duration = 4000,
  showProgress = true,
  dismissible = true,
  actionLabel,
  onAction,
  onDismiss,
  icon,
}) => {
  const [isVisible, setIsVisible] = React.useState(true);
  const [progress, setProgress] = React.useState(100);
  const timerRef = React.useRef<NodeJS.Timeout>();
  const progressIntervalRef = React.useRef<NodeJS.Timeout>();

  React.useEffect(() => {
    if (duration > 0) {
      // Progress bar animation
      if (showProgress) {
        const interval = 50;
        const decrement = (interval / duration) * 100;
        progressIntervalRef.current = setInterval(() => {
          setProgress((prev) => {
            const newProgress = prev - decrement;
            if (newProgress <= 0) {
              clearInterval(progressIntervalRef.current);
              return 0;
            }
            return newProgress;
          });
        }, interval);
      }

      // Auto dismiss
      timerRef.current = setTimeout(() => {
        handleDismiss();
      }, duration);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [duration, showProgress]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onDismiss) onDismiss();
    }, 300);
  };

  const handleAction = () => {
    if (onAction) onAction();
    handleDismiss();
  };

  const getVariantStyles = () => {
    const styles: Record<ToastVariant, { bg: string; border: string; icon: React.ReactNode }> = {
      info: {
        bg: colors.bg.elevated,
        border: colors.border.default,
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" stroke={colors.semantic.info} strokeWidth="2" />
            <path d="M10 6v4M10 14h.01" stroke={colors.semantic.info} strokeWidth="2" strokeLinecap="round" />
          </svg>
        ),
      },
      success: {
        bg: colors.bg.elevated,
        border: colors.semantic.success,
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" fill={colors.semantic.success} />
            <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
      },
      warning: {
        bg: colors.bg.elevated,
        border: colors.semantic.warning,
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 2l8 14H2L10 2z"
              fill={colors.semantic.warning}
              stroke={colors.semantic.warning}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path d="M10 8v3M10 14h.01" stroke={colors.bg.primary} strokeWidth="2" strokeLinecap="round" />
          </svg>
        ),
      },
      error: {
        bg: colors.bg.elevated,
        border: colors.semantic.error,
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" fill={colors.semantic.error} />
            <path d="M13 7l-6 6M7 7l6 6" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ),
      },
    };
    return styles[variant];
  };

  const getPositionStyles = (): React.CSSProperties => {
    const positions: Record<ToastPosition, React.CSSProperties> = {
      top: { top: spacing[4], left: '50%', transform: 'translateX(-50%)' },
      bottom: { bottom: spacing[4], left: '50%', transform: 'translateX(-50%)' },
      'top-left': { top: spacing[4], left: spacing[4] },
      'top-right': { top: spacing[4], right: spacing[4] },
      'bottom-left': { bottom: spacing[4], left: spacing[4] },
      'bottom-right': { bottom: spacing[4], right: spacing[4] },
    };
    return positions[position];
  };

  const variantStyles = getVariantStyles();

  if (!isVisible) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position: 'fixed',
        ...getPositionStyles(),
        minWidth: '320px',
        maxWidth: '480px',
        backgroundColor: variantStyles.bg,
        border: `1px solid ${variantStyles.border}`,
        borderRadius: radii.lg,
        boxShadow: shadows.xl,
        zIndex: zIndex.toast,
        overflow: 'hidden',
        animation: `toastSlideIn ${animation.duration.normal} ${animation.easing.easeOut}`,
      }}
    >
      {/* Content */}
      <div style={{ padding: spacing[4], display: 'flex', gap: spacing[3] }}>
        {/* Icon */}
        <div style={{ flexShrink: 0 }}>{icon || variantStyles.icon}</div>

        {/* Message */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              fontFamily: typography.fontFamily.sans,
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
                fontFamily: typography.fontFamily.sans,
                color: colors.text.secondary,
                lineHeight: typography.lineHeight.normal,
              }}
            >
              {description}
            </div>
          )}
        </div>

        {/* Action & Dismiss */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing[2] }}>
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={handleAction}
              style={{
                background: 'none',
                border: 'none',
                color: colors.brand.primary,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                fontFamily: typography.fontFamily.sans,
                cursor: 'pointer',
                padding: `${spacing[1]} ${spacing[2]}`,
                borderRadius: radii.sm,
                transition: `background-color ${animation.duration.fast} ${animation.easing.easeOut}`,
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {actionLabel}
            </button>
          )}

          {dismissible && (
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss"
              style={{
                background: 'none',
                border: 'none',
                color: colors.text.tertiary,
                cursor: 'pointer',
                padding: spacing[1],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: radii.sm,
                transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg.hover;
                e.currentTarget.style.color = colors.text.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.text.tertiary;
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M12 4L4 12M4 4l8 8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Animations */}
      <style>
        {`
          @keyframes toastSlideIn {
            from {
              opacity: 0;
              transform: ${
                position.includes('top')
                  ? 'translateY(-100%) translateX(-50%)'
                  : 'translateY(100%) translateX(-50%)'
              };
            }
            to {
              opacity: 1;
              transform: translateY(0) translateX(-50%);
            }
          }
        `}
      </style>
    </div>
  );
};

export default Toast;
