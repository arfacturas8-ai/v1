/**
 * CRYB Platform - Skeleton Dashboard Component
 * Skeleton for dashboard/stats pages
 */

import React from 'react';
import { cn } from '../../../lib/utils';

export const SkeletonDashboard = ({ className }) => {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Stats Cards */}
      <div style={{
  display: 'grid',
  gap: '16px'
}}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{
  borderRadius: '12px',
  padding: '24px',
  border: '1px solid var(--border-subtle)'
}}>
            <div style={{
  height: '16px',
  borderRadius: '4px',
  width: '96px'
}} />
            <div style={{
  height: '32px',
  borderRadius: '4px',
  width: '128px'
}} />
            <div style={{
  height: '12px',
  borderRadius: '4px',
  width: '80px'
}} />
          </div>
        ))}
      </div>

      {/* Chart Area */}
      <div style={{
  borderRadius: '12px',
  padding: '24px',
  border: '1px solid var(--border-subtle)'
}}>
        <div style={{
  height: '24px',
  borderRadius: '4px',
  width: '192px'
}} />
        <div style={{
  height: '256px',
  borderRadius: '12px'
}} />
      </div>

      {/* Table */}
      <div style={{
  borderRadius: '12px',
  padding: '24px',
  border: '1px solid var(--border-subtle)'
}}>
        <div style={{
  height: '24px',
  borderRadius: '4px',
  width: '160px'
}} />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{
  display: 'flex',
  gap: '16px'
}}>
              <div style={{
  flex: '1',
  height: '16px',
  borderRadius: '4px'
}} />
              <div style={{
  flex: '1',
  height: '16px',
  borderRadius: '4px'
}} />
              <div style={{
  flex: '1',
  height: '16px',
  borderRadius: '4px'
}} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};




export default SkeletonDashboard
