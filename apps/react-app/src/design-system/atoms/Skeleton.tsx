import React from 'react';
import { colors, radii } from '../tokens';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

// Skeleton components removed - no loading UI per platform directive
export const Skeleton: React.FC<SkeletonProps> = () => {
  return null;
};

// SkeletonText component for text placeholders
interface SkeletonTextProps {
  lines?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const SkeletonText: React.FC<SkeletonTextProps> = () => {
  return null;
};

export default Skeleton;
