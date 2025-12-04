import React from 'react';
import { colors, radii } from '../tokens';

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

interface SpinnerProps {
  size?: SpinnerSize;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

const sizeMap: Record<SpinnerSize, string> = {
  sm: '16px',
  md: '24px',
  lg: '32px',
  xl: '48px',
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = colors['brand-primary'],
  className = '',
  style,
}) => {
  const spinnerSize = sizeMap[size];

  const spinnerStyle: React.CSSProperties = {
    width: spinnerSize,
    height: spinnerSize,
    border: `3px solid ${colors['bg-elevated']}`,
    borderTopColor: color,
    borderRadius: radii.full,
    animation: 'spin 0.6s linear infinite',
    ...style,
  };

  return <div className={className} style={spinnerStyle} />;
};

// Add keyframes for spinner animation
if (typeof document !== 'undefined') {
  const styleSheet = document.styleSheets[0];
  const keyframes = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  try {
    styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
  } catch (e) {
    // Already exists
  }
}

export default Spinner;
