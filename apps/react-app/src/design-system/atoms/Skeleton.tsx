import React from 'react';
import { colors, radii } from '../tokens';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  circle = false,
  className = '',
  style,
}) => {
  const skeletonStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: circle ? radii.full : radii.md,
    backgroundColor: colors['bg-elevated'],
    animation: 'pulse 1.5s ease-in-out infinite',
    ...style,
  };

  return <div className={className} style={skeletonStyle} />;
};

// Add keyframes for pulse animation
if (typeof document !== 'undefined') {
  const styleSheet = document.styleSheets[0];
  const keyframes = `
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }
  `;
  try {
    styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
  } catch (e) {
    // Already exists
  }
}

// SkeletonText component for text placeholders
interface SkeletonTextProps {
  lines?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  className = '',
  style,
}) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    ...style,
  };

  return (
    <div className={className} style={containerStyle}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height="12px"
          width={index === lines - 1 ? '60%' : '100%'}
        />
      ))}
    </div>
  );
};

export default Skeleton;
