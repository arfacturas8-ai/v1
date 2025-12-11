import React from 'react';
import { colors, spacing, typography, radii, animation } from '../../design-system/tokens';

interface ErrorStateProps {
  title?: string;
  message?: string;
  errorCode?: string;
  showRetry?: boolean;
  showSupport?: boolean;
  supportUrl?: string;
  supportEmail?: string;
  onRetry?: () => void;
  retryLabel?: string;
  customIcon?: React.ReactNode;
  maxWidth?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  errorCode,
  showRetry = true,
  showSupport = true,
  supportUrl,
  supportEmail = 'support@cryb.ai',
  onRetry,
  retryLabel = 'Try Again',
  customIcon,
  maxWidth = '450px',
}) => {
  const [retryHovered, setRetryHovered] = React.useState(false);
  const [supportHovered, setSupportHovered] = React.useState(false);
  const [retrying, setRetrying] = React.useState(false);

  const handleRetry = async () => {
    if (!onRetry) return;

    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setTimeout(() => setRetrying(false), 500);
    }
  };

  const handleSupportClick = () => {
    if (supportUrl) {
      window.open(supportUrl, '_blank');
    } else if (supportEmail) {
      const subject = encodeURIComponent(`Support Request${errorCode ? ` - Error ${errorCode}` : ''}`);
      const body = encodeURIComponent(
        `Error Details:\n${title}\n${message}\n${errorCode ? `Error Code: ${errorCode}` : ''}`
      );
      window.location.href = `mailto:${supportEmail}?subject=${subject}&body=${body}`;
    }
  };

  const defaultIcon = (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="38" fill={colors.semantic.error} opacity="0.1" />
      <circle cx="40" cy="40" r="30" fill={colors.semantic.error} opacity="0.2" />
      <circle cx="40" cy="40" r="24" fill={colors.semantic.error} />
      <path
        d="M40 28v16M40 52h.02"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: spacing[8],
        maxWidth,
        margin: '0 auto',
      }}
    >
      {/* Error Icon */}
      <div style={{ marginBottom: spacing[5] }}>
        {customIcon || defaultIcon}
      </div>

      {/* Error Code */}
      {errorCode && (
        <div
          style={{
            display: 'inline-block',
            padding: `${spacing[1]} ${spacing[3]}`,
            backgroundColor: colors.bg.tertiary,
            border: `1px solid ${colors.border.default}`,
            borderRadius: radii.full,
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.semibold,
            fontFamily: typography.fontFamily.mono,
            color: colors.text.tertiary,
            marginBottom: spacing[4],
            letterSpacing: '0.5px',
          }}
        >
          ERROR {errorCode}
        </div>
      )}

      {/* Title */}
      <h3
        style={{
          margin: 0,
          fontSize: typography.fontSize.xl,
          fontWeight: typography.fontWeight.bold,
          fontFamily: typography.fontFamily.sans,
          color: colors.text.primary,
          marginBottom: spacing[3],
          lineHeight: typography.lineHeight.snug,
        }}
      >
        {title}
      </h3>

      {/* Message */}
      <p
        style={{
          margin: 0,
          fontSize: typography.fontSize.base,
          fontFamily: typography.fontFamily.sans,
          color: colors.text.secondary,
          lineHeight: typography.lineHeight.relaxed,
          marginBottom: spacing[6],
          maxWidth: '90%',
        }}
      >
        {message}
      </p>

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing[3],
          alignItems: 'center',
          width: '100%',
        }}
      >
        {/* Retry Button */}
        {showRetry && onRetry && (
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            onMouseEnter={() => setRetryHovered(true)}
            onMouseLeave={() => setRetryHovered(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing[2],
              padding: `${spacing[3]} ${spacing[5]}`,
              backgroundColor: retryHovered && !retrying ? colors.brand.hover : colors.brand.primary,
              color: colors.text.primary,
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              fontFamily: typography.fontFamily.sans,
              border: 'none',
              borderRadius: radii.md,
              cursor: retrying ? 'not-allowed' : 'pointer',
              transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
              minWidth: '200px',
              opacity: retrying ? 0.7 : 1,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M2 9a7 7 0 0 1 7-7M16 9a7 7 0 0 1-7 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M9 2V6M13 9h-4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            {retryLabel}
          </button>
        )}

        {/* Support Link */}
        {showSupport && (supportUrl || supportEmail) && (
          <button
            type="button"
            onClick={handleSupportClick}
            onMouseEnter={() => setSupportHovered(true)}
            onMouseLeave={() => setSupportHovered(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
              padding: `${spacing[2]} ${spacing[3]}`,
              backgroundColor: 'transparent',
              color: supportHovered ? colors.brand.primary : colors.text.secondary,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              fontFamily: typography.fontFamily.sans,
              border: 'none',
              borderRadius: radii.md,
              cursor: 'pointer',
              transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M8 11v-1a2 2 0 0 1 2-2 2 2 0 0 0 0-4H9.5a2 2 0 0 0-2 2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            Contact Support
          </button>
        )}
      </div>

      {/* Technical Details (Collapsible) */}
      {errorCode && (
        <details
          style={{
            marginTop: spacing[6],
            width: '100%',
            maxWidth: '300px',
          }}
        >
          <summary
            style={{
              fontSize: typography.fontSize.xs,
              color: colors.text.tertiary,
              cursor: 'pointer',
              userSelect: 'none',
              padding: spacing[2],
              listStyle: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing[1],
            }}
          >
            <span>Technical Details</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </summary>
          <div
            style={{
              marginTop: spacing[2],
              padding: spacing[3],
              backgroundColor: colors.bg.tertiary,
              borderRadius: radii.md,
              fontSize: typography.fontSize.xs,
              fontFamily: typography.fontFamily.mono,
              color: colors.text.tertiary,
              textAlign: 'left',
              wordBreak: 'break-all',
            }}
          >
            <div>Error Code: {errorCode}</div>
            <div>Timestamp: {new Date().toISOString()}</div>
          </div>
        </details>
      )}

    </div>
  );
};

export default ErrorState;
