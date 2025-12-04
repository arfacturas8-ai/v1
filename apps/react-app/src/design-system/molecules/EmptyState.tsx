import React from 'react';
import { colors, spacing, typography } from '../tokens';
import { Button } from '../atoms/Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${spacing[16]} ${spacing[8]}`,
        textAlign: 'center',
        minHeight: '400px',
      }}
    >
      {icon && (
        <div
          style={{
            color: colors.text.tertiary,
            marginBottom: spacing[6],
            opacity: 0.5,
          }}
        >
          {icon}
        </div>
      )}
      <h3
        style={{
          fontSize: typography.fontSize['2xl'],
          fontWeight: typography.fontWeight.bold,
          color: colors.text.primary,
          marginBottom: spacing[3],
          fontFamily: typography.fontFamily.sans,
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            fontSize: typography.fontSize.base,
            color: colors.text.secondary,
            maxWidth: '400px',
            marginBottom: spacing[8],
            lineHeight: typography.lineHeight.relaxed,
            fontFamily: typography.fontFamily.sans,
          }}
        >
          {description}
        </p>
      )}
      {action && (
        <div style={{ display: 'flex', gap: spacing[3], flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button onClick={action.onClick} size="lg">
            {action.label}
          </Button>
          {secondaryAction && (
            <Button onClick={secondaryAction.onClick} variant="outline" size="lg">
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
