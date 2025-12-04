/**
 * Icon Atom Component
 * Wrapper for SVG icons with consistent sizing and colors
 */

import React from 'react';
import { colors } from '../tokens';

export interface IconProps extends React.SVGAttributes<SVGElement> {
  size?: number | string;
  color?: keyof typeof colors | string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export const Icon: React.FC<IconProps> = ({
  size = 20,
  color = 'text-secondary',
  className,
  style,
  children,
  ...props
}) => {
  const iconColor = color in colors ? colors[color as keyof typeof colors] : color;

  const iconStyle: React.CSSProperties = {
    width: typeof size === 'number' ? `${size}px` : size,
    height: typeof size === 'number' ? `${size}px` : size,
    color: iconColor,
    fill: 'currentColor',
    display: 'inline-flex',
    flexShrink: 0,
    ...style,
  };

  return (
    <span className={className} style={iconStyle} {...props}>
      {children}
    </span>
  );
};

export default Icon;
