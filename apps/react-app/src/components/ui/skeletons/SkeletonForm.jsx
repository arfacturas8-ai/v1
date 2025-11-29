/**
 * CRYB Platform - Skeleton Form Component
 * Skeleton for form loading states
 */

import React from 'react';
import { cn } from '../../../lib/utils';

export const SkeletonForm = ({
  fieldCount = 3,
  showButton = true,
  className
}) => {
  const fields = Array.from({ length: fieldCount });

  return (
    <div className={cn('space-y-6', className)}>
      {fields.map((_, index) => (
        <div key={index} className="space-y-2">
          <div style={{
  height: '16px',
  borderRadius: '4px',
  width: '96px'
}} />
          <div style={{
  height: '40px',
  borderRadius: '12px',
  width: '100%'
}} />
        </div>
      ))}
      {showButton && (
        <div style={{
  height: '40px',
  borderRadius: '12px',
  width: '128px'
}} />
      )}
    </div>
  );
};




export default SkeletonForm
