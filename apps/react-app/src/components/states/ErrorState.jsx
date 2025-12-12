import React from 'react';
import { getErrorMessage } from "../../utils/errorUtils";
import { AlertCircle, RefreshCw, HelpCircle } from 'lucide-react';

export const ErrorState = ({
  error = 'Something went wrong',
  onRetry,
  showSupport = true,
  errorId
}) => {
  return (
    <div style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '32px',
  textAlign: 'center'
}} role="alert">
      <AlertCircle style={{
  height: '64px',
  width: '64px'
}} aria-hidden="true" />
      <h3 style={{
  fontWeight: '600',
  color: '#ffffff'
}}>Oops! Something went wrong</h3>
      <p style={{
  color: '#A0A0A0'
}}>{typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}</p>

      <div style={{
  display: 'flex',
  gap: '16px'
}}>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
  paddingLeft: '24px',
  paddingRight: '24px',
  paddingTop: '12px',
  paddingBottom: '12px',
  borderRadius: '12px',
  fontWeight: '500',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}
            aria-label="Retry action"
          >
            <RefreshCw style={{
  height: '16px',
  width: '16px'
}} aria-hidden="true" />
            Try Again
          </button>
        )}

        {showSupport && (
          <a
            href="/help"
            style={{
  paddingLeft: '24px',
  paddingRight: '24px',
  paddingTop: '12px',
  paddingBottom: '12px',
  background: 'rgba(20, 20, 20, 0.6)',
  borderRadius: '12px',
  fontWeight: '500',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}
            aria-label="Get help from support"
          >
            <HelpCircle style={{
  height: '16px',
  width: '16px'
}} aria-hidden="true" />
            Get Help
          </a>
        )}
      </div>

      {errorId && (
        <p style={{
  color: '#A0A0A0'
}}>Error ID: {errorId}</p>
      )}
    </div>
  );
};




export default ErrorState
