import React from 'react';
import { colors, spacing, typography, radii } from '../tokens';

interface Segment {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface SegmentedControlProps {
  segments: Segment[];
  activeSegment: string;
  onChange: (segmentId: string) => void;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: {
    padding: `${spacing[1]} ${spacing[3]}`,
    fontSize: typography.fontSize.sm,
  },
  md: {
    padding: `${spacing[2]} ${spacing[4]}`,
    fontSize: typography.fontSize.base,
  },
  lg: {
    padding: `${spacing[3]} ${spacing[5]}`,
    fontSize: typography.fontSize.lg,
  },
};

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  segments,
  activeSegment,
  onChange,
  fullWidth = false,
  size = 'md',
}) => {
  const sizeStyle = sizeStyles[size];

  return (
    <div
      role="tablist"
      style={{
        display: 'inline-flex',
        padding: spacing[1],
        backgroundColor: colors.bg.secondary,
        borderRadius: radii.lg,
        gap: spacing[1],
        width: fullWidth ? '100%' : 'auto',
      }}
    >
      {segments.map((segment) => {
        const isActive = activeSegment === segment.id;
        return (
          <button
            key={segment.id}
            role="tab"
            aria-selected={isActive}
            aria-disabled={segment.disabled}
            onClick={() => !segment.disabled && onChange(segment.id)}
            disabled={segment.disabled}
            style={{
              flex: fullWidth ? 1 : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing[2],
              padding: sizeStyle.padding,
              borderRadius: radii.md,
              border: 'none',
              backgroundColor: isActive ? colors.bg.primary : 'transparent',
              color: isActive ? colors.text.primary : colors.text.secondary,
              fontSize: sizeStyle.fontSize,
              fontWeight: isActive ? typography.fontWeight.semibold : typography.fontWeight.medium,
              cursor: segment.disabled ? 'not-allowed' : 'pointer',
              opacity: segment.disabled ? 0.5 : 1,
              transition: 'all 150ms ease-out',
              whiteSpace: 'nowrap',
              boxShadow: isActive ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
            }}
            onMouseEnter={(e) => {
              if (!segment.disabled && !isActive) {
                e.currentTarget.style.backgroundColor = colors.bg.hover;
                e.currentTarget.style.color = colors.text.primary;
              }
            }}
            onMouseLeave={(e) => {
              if (!segment.disabled && !isActive) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.text.secondary;
              }
            }}
          >
            {segment.icon && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {segment.icon}
              </span>
            )}
            <span>{segment.label}</span>
          </button>
        );
      })}
    </div>
  );
};
