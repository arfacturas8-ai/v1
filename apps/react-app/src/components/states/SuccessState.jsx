import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useResponsive } from '../../hooks/useResponsive';

export const SuccessState = ({
  title = 'Success!',
  message = 'Your action was completed successfully',
  actionLabel,
  onAction,
  autoHideDuration
}) => {
  const { isMobile, isTablet } = useResponsive()

  React.useEffect(() => {
    if (autoHideDuration && onAction) {
      const timer = setTimeout(onAction, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [autoHideDuration, onAction]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
        textAlign: 'center'
      }}
      role="status"
      aria-live="polite"
    >
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'rgba(34, 197, 94, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px'
        }}
      >
        <CheckCircle2 style={{
          height: '64px',
          width: '64px',
          color: '#22C55E'
        }} aria-hidden="true" />
      </div>
      <h3 style={{
        fontWeight: '600',
        fontSize: isMobile ? '22px' : isTablet ? '20px' : '20px',
        color: '#ffffff',
        marginBottom: '12px'
      }}>{title}</h3>
      <p style={{
        color: '#c9d1d9',
        fontSize: '14px',
        lineHeight: '1.5',
        maxWidth: '400px',
        marginBottom: '24px'
      }}>{message}</p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            paddingLeft: '24px',
            paddingRight: '24px',
            paddingTop: '12px',
            paddingBottom: '12px',
            background: 'linear-gradient(to right, #58a6ff, #a371f7)',
            border: 'none',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#ffffff',
            cursor: 'pointer'
          }}
          aria-label={actionLabel}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};




export default SuccessState
