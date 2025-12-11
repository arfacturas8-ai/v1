import React from 'react';
import { colors, spacing, radii, animation } from '../../design-system/tokens';

export type SkeletonVariant =
  | 'text'
  | 'heading'
  | 'avatar'
  | 'thumbnail'
  | 'card'
  | 'listItem'
  | 'button'
  | 'input'
  | 'custom';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string;
  height?: string;
  circle?: boolean;
  count?: number;
  spacing?: keyof typeof spacing;
  animate?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

// Skeleton components removed - no loading UI per platform directive
const Skeleton: React.FC<SkeletonProps> = () => {
  return null;
};

// Composite Skeleton Components
export const SkeletonText: React.FC<Omit<SkeletonProps, 'variant'>> = () => null;

export const SkeletonHeading: React.FC<Omit<SkeletonProps, 'variant'>> = () => null;

export const SkeletonAvatar: React.FC<Omit<SkeletonProps, 'variant'>> = () => null;

export const SkeletonCard: React.FC<Omit<SkeletonProps, 'variant'>> = () => null;

export const SkeletonListItem: React.FC<{ showAvatar?: boolean; showSubtitle?: boolean }> = () => null;

export const SkeletonCardWithImage: React.FC = () => null;

export const SkeletonProfile: React.FC = () => null;

export const SkeletonForm: React.FC<{ fields?: number }> = () => null;

export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = () => null;

export default Skeleton;
