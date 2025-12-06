import React from 'react';
import { spacing } from '../../design-system/tokens';

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

// Empty component - spinners removed from platform
const Spinner: React.FC<SpinnerProps> = ({
  label,
  centered = false,
  fullScreen = false,
  className,
}) => {
  // Just return label if provided, otherwise return null
  if (label) {
    const content = (
      <div className={className} style={{ padding: spacing[2] }}>
        <span style={{ fontSize: '14px', color: '#A0A0A0' }}>{label}</span>
      </div>
    );

    if (centered) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          {content}
        </div>
      );
    }

    return content;
  }

  return null;
};

export default Spinner;
