/**
 * CRYB Platform - Badge Component v.1
 * Pill-shaped badges matching design spec
 * Skill level badges: Beginner, Intermediate, Expert
 */

import React from 'react';

export interface BadgeProps {
  /** Badge variant/type */
  variant?: 'beginner' | 'intermediate' | 'expert' | 'new' | 'premium' | 'coming-soon' | 'count' | 'default';
  /** Badge content */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className = '',
}) => {
  const badgeClass = [
    'badge',
    variant !== 'default' && `badge-${variant}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={badgeClass}>
      {children}
    </span>
  );
};

export default Badge;
