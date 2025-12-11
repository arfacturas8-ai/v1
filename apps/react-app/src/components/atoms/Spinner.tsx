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
const Spinner: React.FC<SpinnerProps> = () => {
  return null;
};

export default Spinner;
