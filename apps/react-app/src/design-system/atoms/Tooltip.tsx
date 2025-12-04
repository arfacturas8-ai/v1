import React, { useState, useRef, useEffect } from 'react';
import { colors, radii, spacing, typography, shadows } from '../tokens';

export interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'top',
  delay = 200,
}) => {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<NodeJS.Timeout>();
  const triggerRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({
          x: rect.left + rect.width / 2,
          y: rect.top,
        });
      }
      setVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getTooltipPosition = () => {
    const offset = 8;
    switch (position) {
      case 'top':
        return {
          left: `${coords.x}px`,
          bottom: `${window.innerHeight - coords.y + offset}px`,
          transform: 'translateX(-50%)',
        };
      case 'bottom':
        return {
          left: `${coords.x}px`,
          top: `${coords.y + offset}px`,
          transform: 'translateX(-50%)',
        };
      case 'left':
        return {
          right: `${window.innerWidth - coords.x + offset}px`,
          top: `${coords.y}px`,
          transform: 'translateY(-50%)',
        };
      case 'right':
        return {
          left: `${coords.x + offset}px`,
          top: `${coords.y}px`,
          transform: 'translateY(-50%)',
        };
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onTouchStart={showTooltip}
        onTouchEnd={hideTooltip}
        style={{ display: 'inline-block' }}
      >
        {children}
      </div>
      {visible && (
        <div
          style={{
            position: 'fixed',
            backgroundColor: colors.bg.elevated,
            color: colors.text.primary,
            padding: `${spacing[1]} ${spacing[2]}`,
            borderRadius: radii.sm,
            fontSize: typography.fontSize.xs,
            lineHeight: typography.lineHeight.tight,
            boxShadow: shadows.lg,
            zIndex: 9999,
            maxWidth: '200px',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            ...getTooltipPosition(),
          }}
        >
          {content}
        </div>
      )}
    </>
  );
};
