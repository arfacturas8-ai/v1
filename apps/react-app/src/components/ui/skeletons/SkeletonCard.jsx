import React from 'react';
import { Skeleton, SkeletonText, SkeletonCircle, SkeletonButton, SkeletonImage } from './SkeletonBase';

/**
 * Card Skeleton Components
 * For loading post cards, community cards, and content cards
 */

export function SkeletonCard({
  showHeader = true,
  showFooter = true,
  showImage = false,
  contentLines = 3,
  className = '',
}) {
  return (
    <div
      style={{
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  padding: '16px'
}}
    >
      {showHeader && (
        <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
          <SkeletonCircle size="md" />
          <div style={{
  flex: '1'
}}>
            <Skeleton width="40%" height="1rem" className="mb-1" />
            <Skeleton width="60%" height="0.875rem" />
          </div>
        </div>
      )}

      {showImage && (
        <SkeletonImage aspectRatio="video" className="mb-4" />
      )}

      <div className="mb-4">
        <SkeletonText lines={contentLines} spacing="sm" />
      </div>

      {showFooter && (
        <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
            <SkeletonButton size="sm" />
            <SkeletonButton size="sm" />
          </div>
          <SkeletonButton size="sm" />
        </div>
      )}
    </div>
  );
}

export function SkeletonPostCard({
  showCommunity = true,
  showMedia = false,
  compact = false,
  className = '',
}) {
  return (
    <article
      style={{
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  overflow: 'hidden'
}}
    >
      <div style={{
  padding: '16px'
}}>
        {/* Post header */}
        <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flex: '1'
}}>
            {showCommunity && (
              <>
                <SkeletonCircle size="xs" />
                <Skeleton width="80px" height="0.875rem" />
                <span style={{
  color: '#c9d1d9'
}}>•</span>
              </>
            )}
            <Skeleton width="60px" height="0.875rem" />
            <span style={{
  color: '#c9d1d9'
}}>•</span>
            <Skeleton width="40px" height="0.875rem" />
          </div>
          <Skeleton width="32px" height="24px" rounded="full" />
        </div>

        {/* Post title */}
        <div className="mb-2">
          <SkeletonText lines={compact ? 1 : 2} spacing="xs" />
        </div>

        {/* Post content preview */}
        {!compact && (
          <div className="mb-3">
            <SkeletonText lines={2} spacing="xs" lastLineWidth="70%" />
          </div>
        )}

        {/* Media */}
        {showMedia && (
          <SkeletonImage aspectRatio="video" className="mb-3" />
        )}

        {/* Post actions */}
        <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
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
              <Skeleton width="24px" height="24px" rounded="md" />
              <Skeleton width="24px" height="24px" rounded="md" />
              <Skeleton width="32px" height="1rem" />
            </div>
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
              <Skeleton width="20px" height="20px" rounded="md" />
              <Skeleton width="32px" height="1rem" />
            </div>
          </div>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
            <Skeleton width="20px" height="20px" rounded="md" />
            <Skeleton width="20px" height="20px" rounded="md" />
            <Skeleton width="20px" height="20px" rounded="md" />
          </div>
        </div>
      </div>
    </article>
  );
}

export function SkeletonCommunityCard({ className = '' }) {
  return (
    <div
      style={{
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  overflow: 'hidden'
}}
    >
      {/* Cover image */}
      <SkeletonImage aspectRatio="landscape" rounded="none" />

      <div style={{
  padding: '16px'
}}>
        {/* Community icon & info */}
        <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px'
}}>
          <SkeletonCircle size="lg" className="-mt-8 border-4 border-white dark:border-gray-900" />
          <div style={{
  flex: '1'
}}>
            <Skeleton width="60%" height="1.25rem" className="mb-2" />
            <Skeleton width="40%" height="0.875rem" />
          </div>
        </div>

        {/* Description */}
        <div className="mb-4">
          <SkeletonText lines={2} spacing="sm" />
        </div>

        {/* Stats */}
        <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '16px'
}}>
          <Skeleton width="60px" height="1rem" />
          <Skeleton width="80px" height="1rem" />
          <Skeleton width="70px" height="1rem" />
        </div>

        {/* Action button */}
        <SkeletonButton size="md" fullWidth />
      </div>
    </div>
  );
}

export function SkeletonUserCard({ showBio = true, className = '' }) {
  return (
    <div
      style={{
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  padding: '16px'
}}
    >
      <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: '16px'
}}>
        <SkeletonCircle size="lg" />
        <div style={{
  flex: '1'
}}>
          <Skeleton width="50%" height="1.25rem" className="mb-2" />
          <Skeleton width="40%" height="0.875rem" className="mb-3" />

          {showBio && (
            <div className="mb-4">
              <SkeletonText lines={2} spacing="xs" />
            </div>
          )}

          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
            <Skeleton width="60px" height="1rem" />
            <Skeleton width="80px" height="1rem" />
            <Skeleton width="70px" height="1rem" />
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10 dark:border-gray-800">
        <SkeletonButton size="md" fullWidth />
      </div>
    </div>
  );
}

export function SkeletonCommentCard({ depth = 0, className = '' }) {
  const paddingLeft = depth * 16;

  return (
    <div
      style={{
  paddingTop: '12px',
  paddingBottom: '12px',
  paddingLeft
}}
    >
      <div style={{
  display: 'flex',
  gap: '12px'
}}>
        <SkeletonCircle size="sm" />
        <div style={{
  flex: '1'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
            <Skeleton width="80px" height="0.875rem" />
            <span style={{
  color: '#c9d1d9'
}}>•</span>
            <Skeleton width="40px" height="0.875rem" />
          </div>
          <SkeletonText lines={2} spacing="xs" />
          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '16px'
}}>
            <Skeleton width="50px" height="0.875rem" />
            <Skeleton width="50px" height="0.875rem" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SkeletonCard
