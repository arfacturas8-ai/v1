import React from 'react';
import { SkeletonPostCard, SkeletonCommunityCard, SkeletonUserCard, SkeletonCommentCard } from './SkeletonCard';

/**
 * Grid and List Skeleton Components
 * For loading grids, lists, and feeds
 */

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function SkeletonGrid({
  items = 6,
  columns = 3,
  gap = 4,
  type = 'card',
  className = '',
}) {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6',
  };

  const gapClasses = {
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8',
  };

  const renderItem = (index) => {
    switch (type) {
      case 'community':
        return <SkeletonCommunityCard key={index} />;
      case 'user':
        return <SkeletonUserCard key={index} />;
      case 'post':
        return <SkeletonPostCard key={index} />;
      default:
        return (
          <div
            key={index}
            style={{
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '12px',
  border: '1px solid var(--border-subtle)',
  padding: '24px'
}}
          >
            <div style={{
  borderRadius: '12px'
}} />
            <div className="space-y-2">
              <div style={{
  height: '16px',
  borderRadius: '4px'
}} />
              <div style={{
  height: '16px',
  borderRadius: '4px'
}} />
            </div>
          </div>
        );
    }
  };

  return (
    <div
      style={{
  display: 'grid'
}}
      initial="hidden"
      animate="show"
    >
      {Array.from({ length: items }, (_, i) => renderItem(i))}
    </div>
  );
}

export function SkeletonFeed({
  items = 5,
  type = 'post',
  showMedia = true,
  className = '',
}) {
  return (
    <div
      className={`space-y-4 ${className}`}
      initial="hidden"
      animate="show"
    >
      {Array.from({ length: items }, (_, i) => (
        <div key={i}>
          <SkeletonPostCard
            showMedia={showMedia && i % 3 === 0}
            showCommunity={i % 2 === 0}
          />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({
  items = 10,
  showAvatar = true,
  showSecondary = true,
  showAction = false,
  className = '',
}) {
  return (
    <div
      className={`divide-y divide-gray-200 dark:divide-gray-800 ${className}`}
      initial="hidden"
      animate="show"
    >
      {Array.from({ length: items }, (_, i) => (
        <div
          key={i}
          style={{
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  paddingTop: '12px',
  paddingBottom: '12px',
  paddingLeft: '16px',
  paddingRight: '16px'
}}
        >
          {showAvatar && (
            <div style={{
  width: '40px',
  height: '40px',
  borderRadius: '50%'
}} />
          )}

          <div style={{
  flex: '1'
}}>
            <div style={{
  height: '16px',
  borderRadius: '4px'
}} />
            {showSecondary && (
              <div style={{
  height: '12px',
  borderRadius: '4px'
}} />
            )}
          </div>

          {showAction && (
            <div style={{
  width: '80px',
  height: '32px',
  borderRadius: '12px'
}} />
          )}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCommentList({ items = 5, nested = false, className = '' }) {
  return (
    <div
      className={`divide-y divide-gray-200 dark:divide-gray-800 ${className}`}
      initial="hidden"
      animate="show"
    >
      {Array.from({ length: items }, (_, i) => (
        <React.Fragment key={i}>
          <div>
            <SkeletonCommentCard depth={0} />
          </div>
          {nested && i % 2 === 0 && (
            <div>
              <SkeletonCommentCard depth={1} />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  showHeader = true,
  className = '',
}) {
  return (
    <div
      style={{
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '12px',
  border: '1px solid var(--border-subtle)',
  overflow: 'hidden'
}}
    >
      {showHeader && (
        <div style={{
  display: 'grid',
  gap: '16px',
  padding: '16px',
  gridTemplateColumns: `repeat(${columns}, 1fr)`
}}>
          {Array.from({ length: columns }, (_, i) => (
            <div key={i} style={{
  height: '16px',
  borderRadius: '4px'
}} />
          ))}
        </div>
      )}

      <div initial="hidden" animate="show">
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div
            key={rowIndex}
            style={{
  display: 'grid',
  gap: '16px',
  padding: '16px'
}}
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }, (_, colIndex) => (
              <div key={colIndex} style={{
  height: '16px',
  borderRadius: '4px'
}} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default container
