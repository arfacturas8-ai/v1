import React from 'react';
import { colors, radii, spacing } from '../tokens';

export type ProgressSize = 'sm' | 'md' | 'lg';
export type ProgressType = 'bar' | 'circular';

export interface ProgressProps {
  value: number;
  max?: number;
  size?: ProgressSize;
  type?: ProgressType;
  indeterminate?: boolean;
  showValue?: boolean;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  size = 'md',
  type = 'bar',
  indeterminate = false,
  showValue = false,
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  const sizeStyles = {
    sm: { height: '4px', circleSize: 40, strokeWidth: 3 },
    md: { height: '8px', circleSize: 64, strokeWidth: 4 },
    lg: { height: '12px', circleSize: 96, strokeWidth: 6 },
  };

  if (type === 'circular') {
    const { circleSize, strokeWidth } = sizeStyles[size];
    const radius = (circleSize - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = indeterminate ? 0 : circumference - (percentage / 100) * circumference;

    return (
      <div style={{ position: 'relative', width: circleSize, height: circleSize }}>
        <svg width={circleSize} height={circleSize} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            fill="none"
            stroke={colors.bg.tertiary}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            fill="none"
            stroke={colors.brand.primary}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: indeterminate ? 'none' : 'stroke-dashoffset 0.3s ease',
              animation: indeterminate ? 'spin 1s linear infinite' : 'none',
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
              fontSize: size === 'sm' ? '10px' : size === 'md' ? '14px' : '18px',
              fontWeight: 600,
              color: colors.text.primary,
            }}
          >
            {Math.round(percentage)}%
          </div>
        )}
        <style>
          {`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          width: '100%',
          height: sizeStyles[size].height,
          backgroundColor: colors.bg.tertiary,
          borderRadius: radii.full,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            height: '100%',
            width: indeterminate ? '30%' : `${percentage}%`,
            backgroundColor: colors.brand.primary,
            borderRadius: radii.full,
            transition: indeterminate ? 'none' : 'width 0.3s ease',
            animation: indeterminate ? 'progressIndeterminate 1.5s ease-in-out infinite' : 'none',
          }}
        />
      </div>
      {showValue && !indeterminate && (
        <div
          style={{
            marginTop: spacing[1],
            fontSize: '12px',
            color: colors.text.secondary,
            textAlign: 'right',
          }}
        >
          {Math.round(percentage)}%
        </div>
      )}
      <style>
        {`
          @keyframes progressIndeterminate {
            0% { margin-left: -30%; }
            50% { margin-left: 100%; }
            100% { margin-left: 100%; }
          }
        `}
      </style>
    </div>
  );
};
