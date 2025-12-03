/**
 * Loading Skeleton Components
 * Provides skeleton screens for better perceived performance
 */

import React from 'react';

// Base Skeleton component
export const Skeleton = ({ width = '100%', height = '20px', radius = '4px', className = '', style = {} }) => (
  <div
    className={`skeleton ${className}`}
    style={{
      width,
      height,
      borderRadius: radius,
      background: 'linear-gradient(90deg, #1A1A1A 25%, #30363d 50%, #1A1A1A 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      ...style
    }}
  />
);

// Post Card Skeleton
export const PostCardSkeleton = () => (
  <div style={{ padding: '16px', background: '#141414', borderRadius: '8px', marginBottom: '16px' }}>
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
      <Skeleton width="40px" height="40px" radius="50%" />
      <div style={{ marginLeft: '12px', flex: 1 }}>
        <Skeleton width="120px" height="16px" style={{ marginBottom: '6px' }} />
        <Skeleton width="80px" height="14px" />
      </div>
    </div>
    <Skeleton width="80%" height="24px" style={{ marginBottom: '12px' }} />
    <Skeleton width="100%" height="60px" style={{ marginBottom: '12px' }} />
    <Skeleton width="60%" height="16px" />
    <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
      <Skeleton width="60px" height="32px" />
      <Skeleton width="60px" height="32px" />
      <Skeleton width="60px" height="32px" />
    </div>
  </div>
);

// User Card Skeleton
export const UserCardSkeleton = () => (
  <div style={{ padding: '16px', background: '#141414', borderRadius: '8px' }}>
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <Skeleton width="48px" height="48px" radius="50%" />
      <div style={{ marginLeft: '12px', flex: 1 }}>
        <Skeleton width="140px" height="18px" style={{ marginBottom: '6px' }} />
        <Skeleton width="100px" height="14px" />
      </div>
      <Skeleton width="80px" height="36px" radius="6px" />
    </div>
  </div>
);

// Message Skeleton
export const MessageSkeleton = () => (
  <div style={{ padding: '12px 16px', display: 'flex', gap: '12px' }}>
    <Skeleton width="40px" height="40px" radius="50%" />
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
        <Skeleton width="100px" height="16px" style={{ marginRight: '8px' }} />
        <Skeleton width="60px" height="14px" />
      </div>
      <Skeleton width="90%" height="16px" style={{ marginBottom: '4px' }} />
      <Skeleton width="70%" height="16px" />
    </div>
  </div>
);

// Community Card Skeleton
export const CommunityCardSkeleton = () => (
  <div style={{ padding: '16px', background: '#141414', borderRadius: '8px' }}>
    <Skeleton width="100%" height="120px" radius="8px" style={{ marginBottom: '12px' }} />
    <Skeleton width="70%" height="20px" style={{ marginBottom: '8px' }} />
    <Skeleton width="100%" height="16px" style={{ marginBottom: '6px' }} />
    <Skeleton width="90%" height="16px" style={{ marginBottom: '12px' }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Skeleton width="100px" height="14px" />
      <Skeleton width="80px" height="36px" radius="6px" />
    </div>
  </div>
);

// Table Row Skeleton
export const TableRowSkeleton = ({ columns = 4 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '16px', padding: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
    {Array.from({ length: columns }).map((_, i) => (
      <Skeleton key={i} width="90%" height="20px" />
    ))}
  </div>
);

// Page Skeleton
export const PageSkeleton = ({ type = 'default' }) => {
  if (type === 'feed') {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        {[1, 2, 3, 4, 5].map(i => <PostCardSkeleton key={i} />)}
      </div>
    );
  }

  if (type === 'profile') {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <Skeleton width="100%" height="200px" radius="12px" style={{ marginBottom: '16px' }} />
          <div style={{ display: 'flex', gap: '16px' }}>
            <Skeleton width="120px" height="120px" radius="50%" />
            <div style={{ flex: 1 }}>
              <Skeleton width="200px" height="32px" style={{ marginBottom: '8px' }} />
              <Skeleton width="150px" height="20px" style={{ marginBottom: '12px' }} />
              <Skeleton width="100%" height="60px" />
            </div>
          </div>
        </div>
        {/* Content */}
        {[1, 2, 3].map(i => <PostCardSkeleton key={i} />)}
      </div>
    );
  }

  if (type === 'chat') {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Skeleton width="40px" height="40px" radius="50%" />
            <Skeleton width="150px" height="20px" />
          </div>
        </div>
        {/* Messages */}
        <div style={{ flex: 1, padding: '16px' }}>
          {[1, 2, 3, 4, 5, 6].map(i => <MessageSkeleton key={i} />)}
        </div>
        {/* Input */}
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Skeleton width="100%" height="48px" radius="24px" />
        </div>
      </div>
    );
  }

  if (type === 'grid') {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {[1, 2, 3, 4, 5, 6].map(i => <CommunityCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  // Default skeleton
  return (
    <div style={{ padding: '20px' }}>
      <Skeleton width="300px" height="32px" style={{ marginBottom: '16px' }} />
      <Skeleton width="100%" height="200px" radius="8px" style={{ marginBottom: '16px' }} />
      <Skeleton width="100%" height="20px" style={{ marginBottom: '8px' }} />
      <Skeleton width="90%" height="20px" style={{ marginBottom: '8px' }} />
      <Skeleton width="80%" height="20px" />
    </div>
  );
};

// Loading Spinner
export const LoadingSpinner = ({ size = 40, color = '#58a6ff' }) => (
  <div
    style={{
      width: `${size}px`,
      height: `${size}px`,
      border: `4px solid #1A1A1A`,
      borderTop: `4px solid ${color}`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}
  />
);

// Full Page Loader
export const FullPageLoader = ({ message = 'Loading...' }) => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 255, 255, 0.95)',
    zIndex: 9998
  }}>
    <LoadingSpinner size={50} />
    {message && (
      <p style={{
        marginTop: '20px',
        fontSize: '16px',
        color: '#6b7280',
        fontWeight: '500'
      }}>
        {message}
      </p>
    )}
  </div>
);

// Add CSS animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .skeleton {
      position: relative;
      overflow: hidden;
    }
  `;
  document.head.appendChild(style);
}




export default Skeleton
