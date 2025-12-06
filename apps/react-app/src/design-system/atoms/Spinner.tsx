import React from 'react';

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

interface SpinnerProps {
  size?: SpinnerSize;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

// Empty component - spinners removed from platform
export const Spinner: React.FC<SpinnerProps> = () => {
  return null;
};

export default Spinner;
