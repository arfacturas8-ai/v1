import React from 'react';
import { colors, typography } from '../tokens';

export type TextVariant = 'primary' | 'secondary' | 'muted' | 'link' | 'error' | 'success';
export type TextSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';

interface TextProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: TextVariant;
  size?: TextSize;
  weight?: TextWeight;
  truncate?: boolean;
  numberOfLines?: number;
  as?: 'span' | 'p' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  children: React.ReactNode;
}

const variantStyles: Record<TextVariant, string> = {
  primary: colors['text-primary'],
  secondary: colors['text-secondary'],
  muted: colors['text-muted'],
  link: colors['link'],
  error: colors['error'],
  success: colors['success'],
};

export const Text: React.FC<TextProps> = ({
  variant = 'primary',
  size = 'base',
  weight = 'regular',
  truncate = false,
  numberOfLines,
  as: Component = 'span',
  className = '',
  style,
  children,
  ...props
}) => {
  const textStyle: React.CSSProperties = {
    color: variantStyles[variant],
    fontSize: typography.fontSize[size],
    lineHeight: typography.lineHeight[size],
    fontWeight: typography.fontWeight[weight],
    fontFamily: typography.fontFamily.sans,
    ...(truncate && {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }),
    ...(numberOfLines && {
      overflow: 'hidden',
      display: '-webkit-box',
      WebkitLineClamp: numberOfLines,
      WebkitBoxOrient: 'vertical',
      textOverflow: 'ellipsis',
    }),
    ...style,
  };

  return (
    <Component className={className} style={textStyle} {...props}>
      {children}
    </Component>
  );
};

export default Text;
