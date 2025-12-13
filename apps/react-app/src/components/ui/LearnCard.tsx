/**
 * CRYB Platform - LearnCard Component v.1
 * Tutorial/article cards with illustrations and skill badges
 * Matching design screenshots from Learn page
 */

import React from 'react';
import { Badge } from './Badge';

export interface LearnCardProps {
  /** Card title */
  title: string;
  /** Card subtitle/description */
  subtitle?: string;
  /** Author name */
  author?: string;
  /** Illustration/image URL or background color */
  illustration?: string | React.ReactNode;
  /** Background color for illustration area */
  illustrationBg?: string;
  /** Skill level */
  skillLevel?: 'beginner' | 'intermediate' | 'expert';
  /** Click handler */
  onClick?: () => void;
  /** Additional className */
  className?: string;
}

export const LearnCard: React.FC<LearnCardProps> = ({
  title,
  subtitle,
  author,
  illustration,
  illustrationBg,
  skillLevel,
  onClick,
  className = '',
}) => {
  return (
    <div className={`card card-interactive ${className}`} onClick={onClick} style={{ padding: 0, overflow: 'hidden' }}>
      {/* Illustration area */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '200px',
          background: illustrationBg || 'var(--bg-gradient-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {typeof illustration === 'string' ? (
          <img
            src={illustration}
            alt={title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          illustration
        )}

        {/* Skill badge in top-right */}
        {skillLevel && (
          <div style={{ position: 'absolute', top: 'var(--space-3)', right: 'var(--space-3)' }}>
            <Badge variant={skillLevel}>
              {skillLevel.charAt(0).toUpperCase() + skillLevel.slice(1)}
            </Badge>
          </div>
        )}
      </div>

      {/* Content area */}
      <div style={{ padding: 'var(--space-5)' }}>
        <h3
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-2)',
          }}
        >
          {title}
        </h3>

        {subtitle && (
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-2)',
            }}
          >
            {subtitle}
          </p>
        )}

        {author && (
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-tertiary)',
            }}
          >
            {author}
          </p>
        )}
      </div>
    </div>
  );
};

export default LearnCard;
