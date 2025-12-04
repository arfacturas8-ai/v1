import React from 'react';
import { colors, spacing, typography, radii, animation, shadows, zIndex } from '../../design-system/tokens';

export type AlertVariant = 'default' | 'destructive';

interface AlertAction {
  label: string;
  variant?: 'primary' | 'secondary' | 'destructive';
  onClick: () => void;
}

interface AlertProps {
  isOpen: boolean;
  variant?: AlertVariant;
  title: string;
  message?: string;
  icon?: React.ReactNode;
  actions: AlertAction[];
  onClose?: () => void;
  closeOnOverlayClick?: boolean;
}

const Alert: React.FC<AlertProps> = ({
  isOpen,
  variant = 'default',
  title,
  message,
  icon,
  actions,
  onClose,
  closeOnOverlayClick = false,
}) => {
  const [isAnimating, setIsAnimating] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && onClose && e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleAnimationEnd = () => {
    if (!isOpen) {
      setIsAnimating(false);
    }
  };

  const getDefaultIcon = () => {
    if (icon) return icon;

    if (variant === 'destructive') {
      return (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="22" fill={colors.semantic.error} opacity="0.15" />
          <circle cx="24" cy="24" r="18" fill={colors.semantic.error} />
          <path
            d="M18 18l12 12M18 30l12-12"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      );
    }

    return (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="22" fill={colors.semantic.info} opacity="0.15" />
        <circle cx="24" cy="24" r="18" stroke={colors.semantic.info} strokeWidth="3" />
        <path
          d="M24 16v12M24 34h.01"
          stroke={colors.semantic.info}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    );
  };

  const getButtonVariantStyles = (buttonVariant: string, isHovered: boolean) => {
    if (buttonVariant === 'destructive') {
      return {
        backgroundColor: isHovered ? '#E63535' : colors.semantic.error,
        color: colors.text.primary,
        border: 'none',
      };
    }

    if (buttonVariant === 'primary') {
      return {
        backgroundColor: isHovered ? colors.brand.hover : colors.brand.primary,
        color: colors.text.primary,
        border: 'none',
      };
    }

    return {
      backgroundColor: isHovered ? colors.bg.hover : 'transparent',
      color: colors.text.primary,
      border: `1px solid ${colors.border.default}`,
    };
  };

  if (!isOpen && !isAnimating) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleOverlayClick}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: zIndex.modalBackdrop,
          animation: isOpen
            ? `fadeIn ${animation.duration.normal} ${animation.easing.easeOut}`
            : `fadeOut ${animation.duration.normal} ${animation.easing.easeOut}`,
        }}
        onAnimationEnd={handleAnimationEnd}
      />

      {/* Alert Dialog */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-title"
        aria-describedby={message ? 'alert-message' : undefined}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: zIndex.modal,
          width: '90%',
          maxWidth: '400px',
          backgroundColor: colors.bg.elevated,
          borderRadius: radii.xl,
          boxShadow: shadows.xl,
          padding: spacing[6],
          textAlign: 'center',
          animation: isOpen
            ? `alertSlideIn ${animation.duration.normal} ${animation.easing.easeOut}`
            : `alertSlideOut ${animation.duration.normal} ${animation.easing.easeOut}`,
        }}
      >
        {/* Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: spacing[4] }}>
          {getDefaultIcon()}
        </div>

        {/* Title */}
        <h2
          id="alert-title"
          style={{
            margin: 0,
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.bold,
            fontFamily: typography.fontFamily.sans,
            color: colors.text.primary,
            marginBottom: message ? spacing[3] : spacing[5],
            lineHeight: typography.lineHeight.snug,
          }}
        >
          {title}
        </h2>

        {/* Message */}
        {message && (
          <p
            id="alert-message"
            style={{
              margin: 0,
              fontSize: typography.fontSize.base,
              fontFamily: typography.fontFamily.sans,
              color: colors.text.secondary,
              lineHeight: typography.lineHeight.relaxed,
              marginBottom: spacing[5],
            }}
          >
            {message}
          </p>
        )}

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            flexDirection: actions.length > 2 ? 'column' : 'row',
            gap: spacing[3],
            justifyContent: 'stretch',
          }}
        >
          {actions.map((action, index) => {
            const [isHovered, setIsHovered] = React.useState(false);
            const buttonVariant = action.variant || (index === 0 ? 'primary' : 'secondary');
            const variantStyles = getButtonVariantStyles(buttonVariant, isHovered);

            return (
              <button
                key={index}
                type="button"
                onClick={action.onClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                  flex: actions.length <= 2 ? 1 : undefined,
                  padding: `${spacing[3]} ${spacing[4]}`,
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.semibold,
                  fontFamily: typography.fontFamily.sans,
                  borderRadius: radii.md,
                  cursor: 'pointer',
                  transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
                  ...variantStyles,
                }}
              >
                {action.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Animations */}
      <style>
        {`
          @keyframes alertSlideIn {
            from {
              opacity: 0;
              transform: translate(-50%, -50%) scale(0.9);
            }
            to {
              opacity: 1;
              transform: translate(-50%, -50%) scale(1);
            }
          }
          @keyframes alertSlideOut {
            from {
              opacity: 1;
              transform: translate(-50%, -50%) scale(1);
            }
            to {
              opacity: 0;
              transform: translate(-50%, -50%) scale(0.9);
            }
          }
        `}
      </style>
    </>
  );
};

export default Alert;
