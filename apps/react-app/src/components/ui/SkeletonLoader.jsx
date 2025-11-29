import React from 'react'

/**
 * Skeleton Loader Component
 * Provides loading placeholders with shimmer effect
 */

export const SkeletonCard = ({ className = '' }) => (
  <div style={{
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '12px',
  padding: '24px'
}}>
    <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '16px'
}}>
      <div style={{
  width: '48px',
  height: '48px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '50%'
}}></div>
      <div style={{
  flex: '1'
}}>
        <div style={{
  height: '16px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '4px'
}}></div>
        <div style={{
  height: '12px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '4px'
}}></div>
      </div>
    </div>
    <div className="space-y-3">
      <div style={{
  height: '16px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '4px'
}}></div>
      <div style={{
  height: '16px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '4px'
}}></div>
      <div style={{
  height: '16px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '4px'
}}></div>
    </div>
  </div>
)

export const SkeletonPost = ({ className = '' }) => (
  <div style={{
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '12px',
  padding: '24px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
    {/* Header */}
    <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
      <div style={{
  width: '40px',
  height: '40px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '50%'
}}></div>
      <div style={{
  flex: '1'
}}>
        <div style={{
  height: '16px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '4px'
}}></div>
        <div style={{
  height: '12px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '4px'
}}></div>
      </div>
    </div>
    {/* Content */}
    <div className="space-y-3 mb-4">
      <div style={{
  height: '24px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '4px'
}}></div>
      <div style={{
  height: '16px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '4px'
}}></div>
      <div style={{
  height: '16px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '4px'
}}></div>
      <div style={{
  height: '16px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '4px'
}}></div>
    </div>
    {/* Actions */}
    <div style={{
  display: 'flex',
  gap: '24px'
}}>
      <div style={{
  height: '32px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '4px',
  width: '64px'
}}></div>
      <div style={{
  height: '32px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '4px',
  width: '64px'
}}></div>
      <div style={{
  height: '32px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '4px',
  width: '64px'
}}></div>
    </div>
  </div>
)

export const SkeletonProfile = ({ className = '' }) => (
  <div className={`animate-pulse ${className}`}>
    {/* Banner */}
    <div style={{
  height: '192px',
  background: 'rgba(22, 27, 34, 0.6)'
}}></div>
    {/* Avatar */}
    <div style={{
  paddingLeft: '24px',
  paddingRight: '24px'
}}>
      <div style={{
  width: '128px',
  height: '128px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '50%'
}}></div>
    </div>
    {/* Info */}
    <div style={{
  paddingLeft: '24px',
  paddingRight: '24px'
}}>
      <div style={{
  height: '32px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '4px'
}}></div>
      <div style={{
  height: '16px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '4px'
}}></div>
      <div style={{
  height: '16px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '4px'
}}></div>
    </div>
  </div>
)

export const SkeletonList = ({ count = 3, className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} style={{
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  padding: '16px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
        <div style={{
  width: '48px',
  height: '48px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '50%'
}}></div>
        <div style={{
  flex: '1'
}}>
          <div style={{
  height: '16px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '4px'
}}></div>
          <div style={{
  height: '12px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '4px'
}}></div>
        </div>
      </div>
    ))}
  </div>
)

export const SkeletonTable = ({ rows = 5, cols = 4, className = '' }) => (
  <div className={`animate-pulse ${className}`}>
    {/* Header */}
    <div style={{
  display: 'flex',
  gap: '16px',
  padding: '16px'
}}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} style={{
  flex: '1',
  height: '16px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '4px'
}}></div>
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} style={{
  display: 'flex',
  gap: '16px',
  padding: '16px'
}}>
        {Array.from({ length: cols }).map((_, colIndex) => (
          <div key={colIndex} style={{
  flex: '1',
  height: '16px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '4px'
}}></div>
        ))}
      </div>
    ))}
  </div>
)

export const SkeletonText = ({ lines = 3, className = '' }) => (
  <div className={`animate-pulse space-y-3 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        style={{
  height: '16px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '4px',
  width: i === lines - 1 ? '80%' : '100%'
}}
      ></div>
    ))}
  </div>
)

export const SkeletonGrid = ({ items = 6, cols = 3, className = '' }) => (
  <div style={{
  display: 'grid',
  gap: '24px'
}}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} style={{
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  overflow: 'hidden'
}}>
        <div style={{
  height: '192px',
  background: 'rgba(22, 27, 34, 0.6)'
}}></div>
        <div style={{
  padding: '16px'
}}>
          <div style={{
  height: '20px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '4px'
}}></div>
          <div style={{
  height: '16px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '4px'
}}></div>
          <div style={{
  height: '16px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '4px'
}}></div>
        </div>
      </div>
    ))}
  </div>
)

// Default export for convenience
const SkeletonLoader = {
  Card: SkeletonCard,
  Post: SkeletonPost,
  Profile: SkeletonProfile,
  List: SkeletonList,
  Table: SkeletonTable,
  Text: SkeletonText,
  Grid: SkeletonGrid
}




export default SkeletonCard
