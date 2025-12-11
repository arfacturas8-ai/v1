import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingState = ({
  type = 'default',
  message = '',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  if (type === 'spinner') {
    return (
      <div style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '32px'
}} role="status" aria-live="polite">
        <Loader2 className={`${sizeClasses[size]}  text-blue-500`} aria-hidden="true" />
        <p style={{
  color: '#A0A0A0'
}}>{message}</p>
      </div>
    );
  }

  if (type === 'skeleton-list') {
    return (
      <div className="space-y-4" role="status" aria-live="polite" aria-label={message}>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{
  display: 'flex'
}}>
            <div style={{
  borderRadius: '50%',
  background: 'rgba(20, 20, 20, 0.6)',
  height: '48px',
  width: '48px'
}}></div>
            <div style={{
  flex: '1',
  paddingTop: '4px',
  paddingBottom: '4px'
}}>
              <div style={{
  height: '16px',
  background: 'rgba(20, 20, 20, 0.6)',
  borderRadius: '4px'
}}></div>
              <div style={{
  height: '16px',
  background: 'rgba(20, 20, 20, 0.6)',
  borderRadius: '4px'
}}></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default: simple spinner
  return (
    <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '32px'
}} role="status" aria-live="polite">
      <div style={{
  borderRadius: '50%',
  height: '32px',
  width: '32px'
}} aria-hidden="true"></div>
      <span style={{
  color: '#A0A0A0'
}}>{message}</span>
    </div>
  );
};




export default LoadingState
