import React from 'react';
import { colors, spacing, typography, radii, animation } from '../../design-system/tokens';

interface Segment {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface SegmentedControlProps {
  segments: Segment[];
  value: string;
  onChange: (value: string) => void;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({
  segments,
  value,
  onChange,
  fullWidth = false,
  size = 'md',
}) => {
  const [hoveredSegment, setHoveredSegment] = React.useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = React.useState<React.CSSProperties>({});

  // Validate segments count
  if (segments.length < 2 || segments.length > 5) {
    console.warn('SegmentedControl should have between 2 and 5 segments');
  }

  const getSizeStyles = () => {
    const sizes = {
      sm: { height: '32px', fontSize: typography.fontSize.sm, padding: spacing[2] },
      md: { height: '40px', fontSize: typography.fontSize.base, padding: spacing[3] },
      lg: { height: '48px', fontSize: typography.fontSize.lg, padding: spacing[4] },
    };
    return sizes[size];
  };

  // Update indicator position and size
  React.useEffect(() => {
    const updateIndicator = () => {
      if (!containerRef.current) return;

      const activeIndex = segments.findIndex((seg) => seg.id === value);
      if (activeIndex === -1) return;

      const segmentWidth = 100 / segments.length;
      const leftPosition = activeIndex * segmentWidth;

      setIndicatorStyle({
        width: `${segmentWidth}%`,
        left: `${leftPosition}%`,
      });
    };

    updateIndicator();
  }, [value, segments]);

  const handleClick = (segment: Segment) => {
    if (!segment.disabled && segment.id !== value) {
      onChange(segment.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, segment: Segment, index: number) => {
    if (segment.disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(segment);
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      const prevSegment = segments[index - 1];
      if (!prevSegment.disabled) {
        onChange(prevSegment.id);
      }
    } else if (e.key === 'ArrowRight' && index < segments.length - 1) {
      e.preventDefault();
      const nextSegment = segments[index + 1];
      if (!nextSegment.disabled) {
        onChange(nextSegment.id);
      }
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <div
      ref={containerRef}
      role="tablist"
      style={{
        position: 'relative',
        display: 'inline-flex',
        width: fullWidth ? '100%' : 'auto',
        backgroundColor: colors.bg.secondary,
        borderRadius: radii.md,
        padding: '2px',
        border: `1px solid ${colors.border.default}`,
      }}
    >
      {/* Active Indicator */}
      <div
        style={{
          position: 'absolute',
          top: '2px',
          bottom: '2px',
          backgroundColor: colors.bg.elevated,
          borderRadius: radii.sm,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
          transition: `all ${animation.duration.normal} ${animation.easing.easeOut}`,
          zIndex: 0,
          ...indicatorStyle,
        }}
      />

      {/* Segments */}
      {segments.map((segment, index) => {
        const isActive = segment.id === value;
        const isHovered = hoveredSegment === segment.id;

        return (
          <button
            key={segment.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            aria-disabled={segment.disabled}
            tabIndex={segment.disabled ? -1 : 0}
            onClick={() => handleClick(segment)}
            onKeyDown={(e) => handleKeyDown(e, segment, index)}
            onMouseEnter={() => !segment.disabled && setHoveredSegment(segment.id)}
            onMouseLeave={() => setHoveredSegment(null)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing[2],
              height: sizeStyles.height,
              padding: `0 ${sizeStyles.padding}`,
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: radii.sm,
              fontSize: sizeStyles.fontSize,
              fontWeight: isActive ? typography.fontWeight.semibold : typography.fontWeight.medium,
              fontFamily: typography.fontFamily.sans,
              color: segment.disabled
                ? colors.text.tertiary
                : isActive
                ? colors.text.primary
                : isHovered
                ? colors.text.primary
                : colors.text.secondary,
              cursor: segment.disabled ? 'not-allowed' : 'pointer',
              opacity: segment.disabled ? 0.5 : 1,
              position: 'relative',
              zIndex: 1,
              transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
          >
            {segment.icon && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: 'currentColor',
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

export default SegmentedControl;
