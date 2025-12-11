import React from 'react';
import { colors, spacing, typography, radii, animation } from '../../design-system/tokens';

export type ProgressVariant = 'default' | 'success' | 'warning' | 'error' | 'brand';
export type ProgressSize = 'sm' | 'md' | 'lg';

interface BaseProgressProps {
  value?: number;
  max?: number;
  variant?: ProgressVariant;
  size?: ProgressSize;
  indeterminate?: boolean;
  showValue?: boolean;
  label?: string;
  className?: string;
}

interface BarProgressProps extends BaseProgressProps {
  type?: 'bar';
  striped?: boolean;
  animated?: boolean;
}

interface CircularProgressProps extends BaseProgressProps {
  type: 'circular';
  thickness?: number;
}

type ProgressProps = BarProgressProps | CircularProgressProps;

const Progress: React.FC<ProgressProps> = (props) => {
  const {
    value = 0,
    max = 100,
    variant = 'default',
    size = 'md',
    indeterminate = false,
    showValue = false,
    label,
    className,
    type = 'bar',
  } = props;

  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const getVariantColor = () => {
    const variants = {
      default: colors.text.primary,
      success: colors.semantic.success,
      warning: colors.semantic.warning,
      error: colors.semantic.error,
      brand: colors.brand.primary,
    };
    return variants[variant];
  };

  const color = getVariantColor();

  if (type === 'circular') {
    const { thickness = 4 } = props as CircularProgressProps;

    const getSizeStyles = () => {
      const sizes = {
        sm: { size: 32, fontSize: typography.fontSize.xs },
        md: { size: 48, fontSize: typography.fontSize.sm },
        lg: { size: 64, fontSize: typography.fontSize.base },
      };
      return sizes[size];
    };

    const styles = getSizeStyles();
    const radius = (styles.size - thickness * 2) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div
        className={className}
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: spacing[2],
        }}
      >
        <div style={{ position: 'relative' }}>
          <svg
            width={styles.size}
            height={styles.size}
            style={{
              transform: 'rotate(-90deg)',
            }}
          >
            {/* Background circle */}
            <circle
              cx={styles.size / 2}
              cy={styles.size / 2}
              r={radius}
              stroke={colors.bg.elevated}
              strokeWidth={thickness}
              fill="none"
            />

            {/* Progress circle */}
            <circle
              cx={styles.size / 2}
              cy={styles.size / 2}
              r={radius}
              stroke={color}
              strokeWidth={thickness}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{
                transition: `stroke-dashoffset ${animation.duration.normal} ${animation.easing.easeOut}`,
              }}
            />
          </svg>

          {showValue && !indeterminate && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: styles.fontSize,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary,
                fontFamily: typography.fontFamily.sans,
              }}
            >
              {Math.round(percentage)}%
            </div>
          )}
        </div>

        {label && (
          <span
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              fontFamily: typography.fontFamily.sans,
            }}
          >
            {label}
          </span>
        )}

        <style>
          {`
            @keyframes circularProgress {
              0% {
                stroke-dasharray: 1, ${circumference};
                stroke-dashoffset: 0;
              }
              50% {
                stroke-dasharray: ${circumference * 0.75}, ${circumference};
                stroke-dashoffset: ${-circumference * 0.25};
              }
              100% {
                stroke-dasharray: ${circumference * 0.75}, ${circumference};
                stroke-dashoffset: ${-circumference};
              }
            }
          `}
        </style>
      </div>
    );
  }

  // Bar progress
  const { striped = false, animated = false } = props as BarProgressProps;

  const getSizeStyles = () => {
    const sizes = {
      sm: { height: '4px' },
      md: { height: '8px' },
      lg: { height: '12px' },
    };
    return sizes[size];
  };

  const styles = getSizeStyles();

  return (
    <div className={className} style={{ width: '100%' }}>
      {(label || showValue) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing[2],
          }}
        >
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

          {showValue && !indeterminate && (
            <span
              style={{
                fontSize: typography.fontSize.sm,
                color: colors.text.primary,
                fontFamily: typography.fontFamily.sans,
                fontWeight: typography.fontWeight.semibold,
              }}
            >
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}

      <div
        style={{
          width: '100%',
          height: styles.height,
          backgroundColor: colors.bg.elevated,
          borderRadius: radii.full,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percentage}%`,
            backgroundColor: color,
            borderRadius: radii.full,
            transition: `width ${animation.duration.normal} ${animation.easing.easeOut}`,
            backgroundImage:
              striped
                ? `linear-gradient(
                    45deg,
                    rgba(255, 255, 255, 0.15) 25%,
                    transparent 25%,
                    transparent 50%,
                    rgba(255, 255, 255, 0.15) 50%,
                    rgba(255, 255, 255, 0.15) 75%,
                    transparent 75%,
                    transparent
                  )`
                : 'none',
            backgroundSize: striped ? `${styles.height} ${styles.height}` : 'auto',
          }}
        />
      </div>

      <style>
        {`
          @keyframes barProgress {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(250%);
            }
          }

          @keyframes barStripe {
            0% {
              background-position: 0 0;
            }
            100% {
              background-position: ${styles.height} 0;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Progress;
