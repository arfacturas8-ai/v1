import React from 'react';
import { Skeleton, SkeletonText, SkeletonCircle, SkeletonButton, SkeletonImage } from './SkeletonBase';

/**
 * Profile Skeleton Components
 * For loading user profiles and related content
 */

export function SkeletonProfile({ className = '' }) {
  return (
    <div
      className={`${className}`}
    >
      {/* Cover image */}
      <div style={{
  position: 'relative'
}}>
        <SkeletonImage aspectRatio="ultrawide" rounded="none" style={{
  width: '100%'
}} />

        {/* Avatar overlapping cover */}
        <div style={{
  position: 'absolute'
}}>
          <SkeletonCircle size="3xl" className="border-4 border-white dark:border-gray-900" />
        </div>
      </div>

      {/* Profile info */}
      <div style={{
  paddingLeft: '24px',
  paddingRight: '24px'
}}>
        <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between'
}}>
          <div style={{
  flex: '1'
}}>
            <Skeleton width="200px" height="2rem" className="mb-2" />
            <Skeleton width="150px" height="1rem" className="mb-3" />

            <div className="mb-4">
              <SkeletonText lines={3} spacing="sm" />
            </div>

            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '16px'
}}>
              <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                <Skeleton width="20px" height="20px" rounded="sm" />
                <Skeleton width="100px" height="1rem" />
              </div>
              <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                <Skeleton width="20px" height="20px" rounded="sm" />
                <Skeleton width="120px" height="1rem" />
              </div>
            </div>

            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '24px'
}}>
              <Skeleton width="80px" height="1rem" />
              <Skeleton width="100px" height="1rem" />
              <Skeleton width="90px" height="1rem" />
            </div>
          </div>

          <div style={{
  display: 'flex',
  gap: '8px'
}}>
            <SkeletonButton size="md" />
            <SkeletonButton size="md" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
  paddingLeft: '24px',
  paddingRight: '24px'
}}>
        <div style={{
  display: 'flex',
  gap: '32px'
}}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} width="80px" height="40px" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonProfileHeader({ compact = false, className = '' }) {
  return (
    <div
      style={{
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  padding: '24px'
}}
    >
      <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: '16px'
}}>
        <SkeletonCircle size={compact ? 'lg' : '2xl'} />

        <div style={{
  flex: '1'
}}>
          <Skeleton width="60%" height={compact ? '1.25rem' : '1.5rem'} className="mb-2" />
          <Skeleton width="40%" height="1rem" className="mb-3" />

          {!compact && (
            <>
              <div className="mb-4">
                <SkeletonText lines={2} spacing="sm" />
              </div>

              <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '16px'
}}>
                <Skeleton width="100px" height="1rem" />
                <Skeleton width="120px" height="1rem" />
                <Skeleton width="80px" height="1rem" />
              </div>
            </>
          )}

          <div style={{
  display: 'flex',
  gap: '8px'
}}>
            <SkeletonButton size="md" />
            <SkeletonButton size="md" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonProfileStats({ className = '' }) {
  return (
    <div
      style={{
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  padding: '24px'
}}
    >
      <Skeleton width="150px" height="1.25rem" className="mb-4" />

      <div style={{
  display: 'grid',
  gap: '16px'
}}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{
  textAlign: 'center'
}}>
            <Skeleton width="60px" height="2rem" className="mb-2 mx-auto" />
            <Skeleton width="80px" height="0.875rem" className="mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonProfileActivity({ items = 5, className = '' }) {
  return (
    <div
      style={{
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}
    >
      <div style={{
  padding: '16px'
}}>
        <Skeleton width="120px" height="1.25rem" />
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-800">
        {Array.from({ length: items }, (_, i) => (
          <div key={i} style={{
  padding: '16px'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px'
}}>
              <SkeletonCircle size="xs" />
              <div style={{
  flex: '1'
}}>
                <Skeleton width="70%" height="1rem" className="mb-2" />
                <SkeletonText lines={2} spacing="xs" />
                <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '16px'
}}>
                  <Skeleton width="60px" height="0.875rem" />
                  <Skeleton width="80px" height="0.875rem" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonProfileBadges({ count = 6, className = '' }) {
  return (
    <div
      style={{
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  padding: '24px'
}}
    >
      <Skeleton width="100px" height="1.25rem" className="mb-4" />

      <div style={{
  display: 'grid',
  gap: '16px'
}}>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px'
}}>
            <SkeletonCircle size="lg" />
            <Skeleton width="60px" height="0.75rem" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default SkeletonProfile
