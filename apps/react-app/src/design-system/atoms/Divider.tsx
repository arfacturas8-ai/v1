import React from 'react';
import { colors, spacing, typography } from '../tokens';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  label,
  className = '',
  style,
}) => {
  if (orientation === 'vertical') {
    const verticalStyle: React.CSSProperties = {
      width: '1px',
      height: '100%',
      backgroundColor: colors['border-default'],
      ...style,
    };

    return <div className={className} style={verticalStyle} />;
  }

  if (label) {
    const containerStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      gap: spacing[3],
      width: '100%',
      ...style,
    };

    const lineStyle: React.CSSProperties = {
      flex: 1,
      height: '1px',
      backgroundColor: colors['border-default'],
    };

    const labelStyle: React.CSSProperties = {
      fontSize: typography.fontSize.sm,
      color: colors['text-muted'],
      fontFamily: typography.fontFamily.sans,
      whiteSpace: 'nowrap',
    };

    return (
      <div className={className} style={containerStyle}>
        <div style={lineStyle} />
        <span style={labelStyle}>{label}</span>
        <div style={lineStyle} />
      </div>
    );
  }

  const horizontalStyle: React.CSSProperties = {
    width: '100%',
    height: '1px',
    backgroundColor: colors['border-default'],
    ...style,
  };

  return <div className={className} style={horizontalStyle} />;
};

export default Divider;
