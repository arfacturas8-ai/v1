import React from 'react'
import { AlertCircle, RefreshCw, HelpCircle } from 'lucide-react'
import { Button } from './button'
import { cn } from '../../lib/utils'
import { useResponsive } from '../../hooks/useResponsive'
import { getErrorMessage } from '../../utils/errorUtils'

/**
 * ErrorState Component
 *
 * A reusable component for displaying error states with retry functionality.
 * Provides friendly error messages and actionable recovery options.
 *
 * @example
 * ```jsx
 * <ErrorState
 *   error={error}
 *   title="Failed to load posts"
 *   onRetry={() => fetchPosts()}
 *   retryLabel="Try Again"
 *   showErrorDetails={process.env.NODE_ENV === 'development'}
 * />
 * ```
 */
export function ErrorState({
  error,
  title = 'Something went wrong',
  onRetry,
  retryLabel = 'Try Again',
  showErrorDetails = false,
  errorCode,
  supportLink,
  className,
}) {
  const { isMobile, isTablet } = useResponsive()
  const errorMessage = getErrorMessage(error, 'Unknown error');
  const friendlyMessage = getFriendlyErrorMessage(errorMessage);

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-8 text-center',
        className
      )}
    >
      <div
        style={{
          borderRadius: '50%',
          padding: '24px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          marginBottom: '24px'
        }}
      >
        <AlertCircle
          size={64}
          className="text-red-500"
        />
      </div>

      <h3
        style={{
          fontWeight: 'bold',
          fontSize: isMobile ? '22px' : isTablet ? '20px' : '20px',
          color: '#ffffff',
          marginBottom: '12px'
        }}
      >
        {title}
      </h3>

      <p
        style={{
          color: '#666666',
          fontSize: '14px',
          lineHeight: '1.6',
          maxWidth: '480px',
          marginBottom: '24px'
        }}
      >
        {friendlyMessage}
      </p>

      {showErrorDetails && (
        <div
          style={{
            padding: '16px',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '600px',
            textAlign: 'left',
            background: 'rgba(20, 20, 20, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: '16px'
          }}
        >
          <code
            style={{
              color: '#666666',
              fontSize: '12px',
              wordBreak: 'break-word'
            }}
          >
            {errorMessage}
          </code>
        </div>
      )}

      {errorCode && (
        <p
          style={{
            color: '#666666',
            fontSize: '14px',
            marginBottom: '24px'
          }}
        >
          Error Code: <code className="font-mono">{errorCode}</code>
        </p>
      )}

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        {onRetry && (
          <Button
            onClick={onRetry}
            size="lg"
            style={{
              background: 'linear-gradient(135deg, var(--cryb-primary), var(--cryb-secondary))',
            }}
          >
            <RefreshCw size={20} className="mr-2" />
            {retryLabel}
          </Button>
        )}

        {supportLink && (
          <Button
            onClick={() => window.open(supportLink, '_blank')}
            variant="outline"
            size="lg"
          >
            <HelpCircle size={20} className="mr-2" />
            Contact Support
          </Button>
        )}
      </div>

      <p
        style={{
          color: '#666666',
          fontSize: '12px'
        }}
      >
        If this problem persists, please contact our support team for assistance.
      </p>
    </div>
  )
}

/**
 * Maps technical error messages to user-friendly messages
 */
function getFriendlyErrorMessage(errorMessage) {
  const lowercaseError = errorMessage.toLowerCase();

  if (lowercaseError.includes('network') || lowercaseError.includes('fetch')) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }

  if (lowercaseError.includes('timeout')) {
    return 'The request took too long to complete. Please try again.';
  }

  if (lowercaseError.includes('unauthorized') || lowercaseError.includes('401')) {
    return 'Your session has expired. Please log in again.';
  }

  if (lowercaseError.includes('forbidden') || lowercaseError.includes('403')) {
    return 'You do not have permission to access this resource.';
  }

  if (lowercaseError.includes('not found') || lowercaseError.includes('404')) {
    return 'The requested resource could not be found.';
  }

  if (lowercaseError.includes('server') || lowercaseError.includes('500')) {
    return 'A server error occurred. Our team has been notified and is working on a fix.';
  }

  // Default friendly message
  return 'An unexpected error occurred. Please try again.';
}




export default ErrorState
