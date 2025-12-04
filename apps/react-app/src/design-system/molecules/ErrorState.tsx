import React from 'react';
import { colors, spacing, typography } from '../tokens';
import { Button } from '../atoms/Button';
import { AlertCircle } from 'lucide-react';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onSupport?: () => void;
  retryLabel?: string;
  supportLabel?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  onSupport,
  retryLabel = 'Try Again',
  supportLabel = 'Contact Support',
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
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: `${colors.semantic.error}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing[6],
        }}
      >
        <AlertCircle size={32} color={colors.semantic.error} />
      </div>
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
        {message}
      </p>
      <div style={{ display: 'flex', gap: spacing[3], flexWrap: 'wrap', justifyContent: 'center' }}>
        {onRetry && (
          <Button onClick={onRetry} size="lg">
            {retryLabel}
          </Button>
        )}
        {onSupport && (
          <Button onClick={onSupport} variant="outline" size="lg">
            {supportLabel}
          </Button>
        )}
      </div>
    </div>
  );
};
