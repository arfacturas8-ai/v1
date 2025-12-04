import React from 'react';
import { colors, spacing, typography, animation } from '../../design-system/tokens';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerVariant = 'default' | 'brand' | 'success' | 'warning' | 'error';

interface SpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  label?: string;
  centered?: boolean;
  fullScreen?: boolean;
  overlay?: boolean;
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'default',
  label,
  centered = false,
  fullScreen = false,
  overlay = false,
  className,
}) => {
  const getSizeStyles = () => {
    const sizes = {
      xs: { size: '16px', strokeWidth: '2' },
      sm: { size: '24px', strokeWidth: '2' },
      md: { size: '32px', strokeWidth: '3' },
      lg: { size: '48px', strokeWidth: '3' },
      xl: { size: '64px', strokeWidth: '4' },
    };
    return sizes[size];
  };

  const getVariantColor = () => {
    const variants = {
      default: colors.text.primary,
      brand: colors.brand.primary,
      success: colors.semantic.success,
      warning: colors.semantic.warning,
      error: colors.semantic.error,
    };
    return variants[variant];
  };

  const styles = getSizeStyles();
  const color = getVariantColor();

  const spinnerElement = (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: spacing[2],
      }}
    >
      <svg
        width={styles.size}
        height={styles.size}
        viewBox="0 0 24 24"
        fill="none"
        style={{
          animation: 'spin 1s linear infinite',
        }}
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke={color}
          strokeWidth={styles.strokeWidth}
          opacity="0.25"
        />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke={color}
          strokeWidth={styles.strokeWidth}
          strokeLinecap="round"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 12 12"
            to="360 12 12"
            dur="1s"
            repeatCount="indefinite"
          />
        </path>
      </svg>

      {label && (
        <span
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
            fontFamily: typography.fontFamily.sans,
            fontWeight: typography.fontWeight.medium,
          }}
        >
          {label}
        </span>
      )}

      <style>
        {`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );

  if (fullScreen || overlay) {
    return (
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
          backgroundColor: overlay ? 'rgba(0, 0, 0, 0.5)' : 'transparent',
          zIndex: 9999,
          backdropFilter: overlay ? 'blur(4px)' : 'none',
        }}
      >
        {spinnerElement}
      </div>
    );
  }

  if (centered) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          padding: spacing[6],
        }}
      >
        {spinnerElement}
      </div>
    );
  }

  return spinnerElement;
};

export default Spinner;
