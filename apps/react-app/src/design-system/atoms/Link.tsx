/**
 * Link Atom Component
 * Styled anchor element with design system integration
 */

import React from 'react';
import { colors, typography, animation } from '../tokens';

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: 'primary' | 'secondary' | 'muted' | 'error';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  underline?: 'always' | 'hover' | 'none';
  external?: boolean;
  children: React.ReactNode;
}

export const Link: React.FC<LinkProps> = ({
  variant = 'primary',
  size = 'base',
  underline = 'hover',
  external = false,
  className,
  style,
  children,
  href,
  ...props
}) => {
  const variantColors: Record<string, string> = {
    primary: colors['text-link'],
    secondary: colors['text-secondary'],
    muted: colors['text-tertiary'],
    error: colors['error'],
  };

  const linkStyle: React.CSSProperties = {
    color: variantColors[variant],
    fontSize: typography.fontSize[size],
    fontFamily: typography.fontFamily.sans,
    fontWeight: typography.fontWeight.medium,
    textDecoration: underline === 'always' ? 'underline' : 'none',
    cursor: 'pointer',
    transition: animation.transitions.fast,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    ...style,
  };

  return (
    <a
      href={href}
      className={className}
      style={linkStyle}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      onMouseEnter={(e) => {
        if (underline === 'hover') {
          e.currentTarget.style.textDecoration = 'underline';
        }
        e.currentTarget.style.color = colors['text-link-hover'];
      }}
      onMouseLeave={(e) => {
        if (underline === 'hover') {
          e.currentTarget.style.textDecoration = 'none';
        }
        e.currentTarget.style.color = variantColors[variant];
      }}
      {...props}
    >
      {children}
      {external && <span style={{ fontSize: '0.8em' }}>—</span>}
    </a>
  );
};

export default Link;
