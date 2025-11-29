/**
 * CRYB Platform - Skeleton List Component
 * Skeleton for list items with shimmer effect
 */

import React from 'react';
import { cn } from '../../../lib/utils';

export const SkeletonList = ({
  count = 3,
  className,
  itemClassName,
  variant = 'default'
}) => {
  const items = Array.from({ length: count });

  if (variant === 'message') {
    return (
      <div className={cn('space-y-4', className)}>
        {items.map((_, index) => (
          <div key={index} className={cn('flex gap-3', itemClassName)}>
            <div style={{
  width: '40px',
  height: '40px',
  borderRadius: '50%'
}} />
            <div style={{
  flex: '1'
}}>
              <div style={{
  height: '16px',
  borderRadius: '4px',
  width: '128px'
}} />
              <div style={{
  height: '12px',
  borderRadius: '4px',
  width: '100%'
}} />
              <div style={{
  height: '12px',
  borderRadius: '4px'
}} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'post') {
    return (
      <div className={cn('space-y-6', className)}>
        {items.map((_, index) => (
          <div key={index} className={cn('bg-bg-secondary rounded-lg p-6 border border-border', itemClassName)}>
            <div style={{
  display: 'flex',
  gap: '12px'
}}>
              <div style={{
  width: '48px',
  height: '48px',
  borderRadius: '50%'
}} />
              <div style={{
  flex: '1'
}}>
                <div style={{
  height: '16px',
  borderRadius: '4px',
  width: '160px'
}} />
                <div style={{
  height: '12px',
  borderRadius: '4px',
  width: '96px'
}} />
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div style={{
  height: '12px',
  borderRadius: '4px',
  width: '100%'
}} />
              <div style={{
  height: '12px',
  borderRadius: '4px'
}} />
              <div style={{
  height: '12px',
  borderRadius: '4px'
}} />
            </div>
            <div style={{
  height: '192px',
  borderRadius: '12px'
}} />
            <div style={{
  display: 'flex',
  gap: '16px'
}}>
              <div style={{
  height: '32px',
  borderRadius: '4px',
  width: '80px'
}} />
              <div style={{
  height: '32px',
  borderRadius: '4px',
  width: '80px'
}} />
              <div style={{
  height: '32px',
  borderRadius: '4px',
  width: '80px'
}} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={cn('space-y-2', className)}>
        <div style={{
  display: 'grid',
  gap: '16px',
  padding: '16px'
}}>
          <div style={{
  height: '16px',
  borderRadius: '4px'
}} />
          <div style={{
  height: '16px',
  borderRadius: '4px'
}} />
          <div style={{
  height: '16px',
  borderRadius: '4px'
}} />
          <div style={{
  height: '16px',
  borderRadius: '4px'
}} />
        </div>
        {items.map((_, index) => (
          <div key={index} style={{
  display: 'grid',
  gap: '16px',
  padding: '16px'
}}>
            <div style={{
  height: '12px',
  borderRadius: '4px'
}} />
            <div style={{
  height: '12px',
  borderRadius: '4px'
}} />
            <div style={{
  height: '12px',
  borderRadius: '4px'
}} />
            <div style={{
  height: '12px',
  borderRadius: '4px'
}} />
          </div>
        ))}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn('space-y-3', className)}>
      {items.map((_, index) => (
        <div key={index} className={cn('flex items-center gap-3 p-4 bg-bg-secondary rounded-lg border border-border', itemClassName)}>
          <div style={{
  width: '48px',
  height: '48px',
  borderRadius: '4px'
}} />
          <div style={{
  flex: '1'
}}>
            <div style={{
  height: '16px',
  borderRadius: '4px'
}} />
            <div style={{
  height: '12px',
  borderRadius: '4px'
}} />
          </div>
        </div>
      ))}
    </div>
  );
};




export default SkeletonList
