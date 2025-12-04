import React from 'react';
import { colors, spacing, typography, radii, animation, shadows, zIndex } from '../../design-system/tokens';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';
export type TooltipSize = 'sm' | 'md' | 'lg';

interface TooltipProps {
  content: React.ReactNode;
  placement?: TooltipPlacement;
  size?: TooltipSize;
  delay?: number;
  disabled?: boolean;
  children: React.ReactElement;
  arrow?: boolean;
  maxWidth?: string;
  interactive?: boolean;
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  placement = 'top',
  size = 'md',
  delay = 200,
  disabled = false,
  children,
  arrow = true,
  maxWidth = '240px',
  interactive = false,
  className,
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const [actualPlacement, setActualPlacement] = React.useState(placement);
  const timeoutRef = React.useRef<NodeJS.Timeout>();
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const [isTouchDevice, setIsTouchDevice] = React.useState(false);

  React.useEffect(() => {
    // Detect touch device
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  const getSizeStyles = () => {
    const sizes = {
      sm: { padding: `${spacing[1]} ${spacing[2]}`, fontSize: typography.fontSize.xs },
      md: { padding: `${spacing[2]} ${spacing[3]}`, fontSize: typography.fontSize.sm },
      lg: { padding: `${spacing[3]} ${spacing[4]}`, fontSize: typography.fontSize.base },
    };
    return sizes[size];
  };

  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const spacing = arrow ? 12 : 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = 0;
    let left = 0;
    let finalPlacement = placement;

    // Calculate initial position based on placement
    switch (placement) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - spacing;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;

        // Check if tooltip goes off top of viewport
        if (top < 0) {
          finalPlacement = 'bottom';
          top = triggerRect.bottom + spacing;
        }
        break;

      case 'bottom':
        top = triggerRect.bottom + spacing;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;

        // Check if tooltip goes off bottom of viewport
        if (top + tooltipRect.height > viewportHeight) {
          finalPlacement = 'top';
          top = triggerRect.top - tooltipRect.height - spacing;
        }
        break;

      case 'left':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left - tooltipRect.width - spacing;

        // Check if tooltip goes off left of viewport
        if (left < 0) {
          finalPlacement = 'right';
          left = triggerRect.right + spacing;
        }
        break;

      case 'right':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + spacing;

        // Check if tooltip goes off right of viewport
        if (left + tooltipRect.width > viewportWidth) {
          finalPlacement = 'left';
          left = triggerRect.left - tooltipRect.width - spacing;
        }
        break;
    }

    // Adjust horizontal position if tooltip goes off screen
    if (left < 8) {
      left = 8;
    } else if (left + tooltipRect.width > viewportWidth - 8) {
      left = viewportWidth - tooltipRect.width - 8;
    }

    // Adjust vertical position if tooltip goes off screen
    if (top < 8) {
      top = 8;
    } else if (top + tooltipRect.height > viewportHeight - 8) {
      top = viewportHeight - tooltipRect.height - 8;
    }

    setPosition({ top, left });
    setActualPlacement(finalPlacement);
  };

  const handleShow = () => {
    if (disabled) return;

    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      // Calculate position after render
      requestAnimationFrame(() => {
        calculatePosition();
      });
    }, delay);
  };

  const handleHide = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const handleTouch = () => {
    if (disabled) return;

    if (isVisible) {
      handleHide();
    } else {
      setIsVisible(true);
      requestAnimationFrame(() => {
        calculatePosition();
      });
    }
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (isVisible) {
      calculatePosition();
      window.addEventListener('scroll', calculatePosition, true);
      window.addEventListener('resize', calculatePosition);

      return () => {
        window.removeEventListener('scroll', calculatePosition, true);
        window.removeEventListener('resize', calculatePosition);
      };
    }
  }, [isVisible, placement]);

  const getArrowStyles = (): React.CSSProperties => {
    const arrowSize = 6;
    const arrowStyles: Record<TooltipPlacement, React.CSSProperties> = {
      top: {
        bottom: -arrowSize,
        left: '50%',
        transform: 'translateX(-50%)',
        borderLeft: `${arrowSize}px solid transparent`,
        borderRight: `${arrowSize}px solid transparent`,
        borderTop: `${arrowSize}px solid ${colors.bg.elevated}`,
      },
      bottom: {
        top: -arrowSize,
        left: '50%',
        transform: 'translateX(-50%)',
        borderLeft: `${arrowSize}px solid transparent`,
        borderRight: `${arrowSize}px solid transparent`,
        borderBottom: `${arrowSize}px solid ${colors.bg.elevated}`,
      },
      left: {
        right: -arrowSize,
        top: '50%',
        transform: 'translateY(-50%)',
        borderTop: `${arrowSize}px solid transparent`,
        borderBottom: `${arrowSize}px solid transparent`,
        borderLeft: `${arrowSize}px solid ${colors.bg.elevated}`,
      },
      right: {
        left: -arrowSize,
        top: '50%',
        transform: 'translateY(-50%)',
        borderTop: `${arrowSize}px solid transparent`,
        borderBottom: `${arrowSize}px solid transparent`,
        borderRight: `${arrowSize}px solid ${colors.bg.elevated}`,
      },
    };

    return arrowStyles[actualPlacement];
  };

  const styles = getSizeStyles();

  const trigger = React.cloneElement(children, {
    ref: triggerRef,
    onMouseEnter: !isTouchDevice ? handleShow : undefined,
    onMouseLeave: !isTouchDevice ? handleHide : undefined,
    onTouchStart: isTouchDevice ? handleTouch : undefined,
    onClick: isTouchDevice ? handleTouch : children.props.onClick,
  });

  return (
    <>
      {trigger}

      {isVisible && (
        <>
          {/* Backdrop for touch devices */}
          {isTouchDevice && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: zIndex.popover - 1,
              }}
              onClick={handleHide}
              onTouchStart={handleHide}
            />
          )}

          <div
            ref={tooltipRef}
            className={className}
            onMouseEnter={interactive ? handleShow : undefined}
            onMouseLeave={interactive ? handleHide : undefined}
            role="tooltip"
            style={{
              position: 'fixed',
              top: `${position.top}px`,
              left: `${position.left}px`,
              zIndex: zIndex.popover,
              ...styles,
              maxWidth,
              backgroundColor: colors.bg.elevated,
              color: colors.text.primary,
              borderRadius: radii.md,
              boxShadow: shadows.lg,
              fontFamily: typography.fontFamily.sans,
              lineHeight: typography.lineHeight.normal,
              wordWrap: 'break-word',
              pointerEvents: interactive || isTouchDevice ? 'auto' : 'none',
              opacity: position.top === 0 && position.left === 0 ? 0 : 1,
              animation: `tooltipFadeIn ${animation.duration.fast} ${animation.easing.easeOut}`,
              border: `1px solid ${colors.border.default}`,
            }}
          >
            {content}

            {arrow && (
              <div
                style={{
                  position: 'absolute',
                  width: 0,
                  height: 0,
                  ...getArrowStyles(),
                }}
              />
            )}
          </div>

          <style>
            {`
              @keyframes tooltipFadeIn {
                from {
                  opacity: 0;
                  transform: scale(0.95);
                }
                to {
                  opacity: 1;
                  transform: scale(1);
                }
              }
            `}
          </style>
        </>
      )}
    </>
  );
};

export default Tooltip;
