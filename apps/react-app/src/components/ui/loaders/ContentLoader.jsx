import React from 'react';
import { Spinner, DotLoader } from './PageLoader';

/**
 * ContentLoader Component
 * For loading content sections within pages
 */

export function ContentLoader({
  message = 'Loading content...',
  type = 'spinner',
  center = true,
  overlay = false,
  className = '',
}) {
  const content = (
    <div style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px',
  padding: '32px'
}}>
      {type === 'spinner' && <Spinner size="lg" />}
      {type === 'dots' && <DotLoader size="lg" />}
      {type === 'pulse' && (
        <div
          style={{
  width: '48px',
  height: '48px',
  borderRadius: '50%'
}}
        />
      )}
      {message && (
        <p
          style={{
  color: '#A0A0A0'
}}
        >
          {message}
        </p>
      )}
    </div>
  );

  if (overlay) {
    return (
      
        <div
          style={{
  position: 'absolute',
  background: 'rgba(20, 20, 20, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}
        >
          {content}
        </div>
      
    );
  }

  if (center) {
    return (
      <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
        {content}
      </div>
    );
  }

  return content;
}

export function InlineLoader({
  size = 'sm',
  message = '',
  className = '',
}) {
  return (
    <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
      <Spinner size={size} />
      {message && (
        <span style={{
  color: '#A0A0A0'
}}>
          {message}
        </span>
      )}
    </div>
  );
}

export function ButtonLoader({
  size = 'sm',
  color = 'white',
  className = '',
}) {
  return (
    <Spinner
      size={size}
      color={color}
      className={className}
    />
  );
}

export function InfiniteLoader({
  message = 'Loading more...',
  className = '',
}) {
  return (
    <div
      style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  paddingTop: '32px',
  paddingBottom: '32px'
}}
    >
      <div style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '12px'
}}>
        <Spinner size="md" />
        <p style={{
  color: '#A0A0A0'
}}>{message}</p>
      </div>
    </div>
  );
}

export function LoadingOverlay({
  message = 'Processing...',
  progress = null,
  className = '',
}) {
  return (
    
      <div
        style={{
  position: 'fixed',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}
      >
        <div
          style={{
  background: 'rgba(20, 20, 20, 0.6)',
  borderRadius: '24px',
  padding: '32px',
  width: '100%',
  marginLeft: '16px',
  marginRight: '16px'
}}
        >
          <div style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '24px'
}}>
            <Spinner size="xl" />

            <div style={{
  textAlign: 'center'
}}>
              <p style={{
  fontWeight: '500',
  color: '#A0A0A0'
}}>
                {message}
              </p>
            </div>

            {progress !== null && (
              <div style={{
  width: '100%'
}}>
                <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                  <span style={{
  color: '#A0A0A0'
}}>
                    Progress
                  </span>
                  <span style={{
  fontWeight: '500',
  color: '#A0A0A0'
}}>
                    {progress}%
                  </span>
                </div>
                <div style={{
  height: '8px',
  background: 'rgba(20, 20, 20, 0.6)',
  borderRadius: '50%',
  overflow: 'hidden'
}}>
                  <div
                    style={{
  height: '100%',
  borderRadius: '50%'
}` }}}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    
  );
}

export function CardLoader({
  count = 3,
  className = '',
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          style={{
  background: 'rgba(20, 20, 20, 0.6)',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  padding: '24px'
}}
        >
          <div className="animate-pulse space-y-4">
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
              <div style={{
  width: '40px',
  height: '40px',
  background: 'rgba(20, 20, 20, 0.6)',
  borderRadius: '50%'
}} />
              <div style={{
  flex: '1'
}}>
                <div style={{
  height: '16px',
  background: 'rgba(20, 20, 20, 0.6)',
  borderRadius: '4px'
}} />
                <div style={{
  height: '12px',
  background: 'rgba(20, 20, 20, 0.6)',
  borderRadius: '4px'
}} />
              </div>
            </div>
            <div className="space-y-2">
              <div style={{
  height: '16px',
  background: 'rgba(20, 20, 20, 0.6)',
  borderRadius: '4px'
}} />
              <div style={{
  height: '16px',
  background: 'rgba(20, 20, 20, 0.6)',
  borderRadius: '4px'
}} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListLoader({
  count = 5,
  showAvatar = true,
  className = '',
}) {
  return (
    <div className={`divide-y divide-gray-200 dark:divide-gray-800 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          style={{
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  paddingTop: '12px',
  paddingBottom: '12px'
}}
        >
          {showAvatar && (
            <div style={{
  width: '40px',
  height: '40px',
  background: 'rgba(20, 20, 20, 0.6)',
  borderRadius: '50%'
}} />
          )}
          <div style={{
  flex: '1'
}}>
            <div style={{
  height: '16px',
  background: 'rgba(20, 20, 20, 0.6)',
  borderRadius: '4px'
}} />
            <div style={{
  height: '12px',
  background: 'rgba(20, 20, 20, 0.6)',
  borderRadius: '4px'
}} />
          </div>
        </div>
      ))}
    </div>
  );
}




export default ContentLoader
