
/**
 * Modern Skeleton Loading Component
 * Provides accessible loading states with smooth animations
 */
function Skeleton({ 
  variant = 'text', 
  width, 
  height, 
  className = '', 
  rounded = false,
  animation = 'pulse',
  lines = 1,
  ...props 
}) {
  const baseClasses = [
    'skeleton',
    `skeleton-${variant}`,
    `skeleton-${animation}`,
    rounded && 'skeleton-rounded',
    className
  ].filter(Boolean).join(' ')

  const style = {
    width: width || undefined,
    height: height || undefined,
    ...props.style
  }

  // For text with multiple lines
  if (variant === 'text' && lines > 1) {
    return (
      <div className="skeleton-text-container" role="status" aria-label="Loading content">
        {Array.from({ length: lines }, (_, i) => (
          <div 
            key={i} 
            className={baseClasses}
            style={{
              ...style,
              width: i === lines - 1 ? '60%' : '100%' // Last line shorter
            }}
          />
        ))}
        <span className="sr-only"></span>
      </div>
    )
  }

  return (
    <div 
      className={baseClasses} 
      style={style}
      role="status"
      aria-label="Loading content"
      {...props}
    >
      <span className="sr-only"></span>
    </div>
  )
}

// Skeleton variants for common UI patterns
export function SkeletonCard({ showImage = true, lines = 3 }) {
  return (
    <div className="card skeleton-card">
      {showImage && (
        <Skeleton 
          variant="rectangle" 
          height="200px" 
          className="skeleton-card-image"
          rounded
        />
      )}
      <div className="skeleton-card-content">
        <Skeleton variant="text" height="1.5rem" className="skeleton-title" />
        <Skeleton variant="text" lines={lines} className="skeleton-text" />
        <div className="skeleton-actions">
          <Skeleton variant="rectangle" width="80px" height="32px" rounded />
          <Skeleton variant="rectangle" width="60px" height="32px" rounded />
        </div>
      </div>
    </div>
  )
}

export function SkeletonAvatar({ size = 'md' }) {
  return (
    <Skeleton 
      variant="circular" 
      className={`skeleton-avatar skeleton-avatar-${size}`}
      rounded
    />
  )
}

export function SkeletonButton({ width = '80px' }) {
  return (
    <Skeleton 
      variant="rectangle" 
      width={width} 
      height="40px" 
      rounded 
      className="skeleton-button"
    />
  )
}

export function SkeletonList({ items = 5 }) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: items }, (_, i) => (
        <div key={i} className="skeleton-list-item">
          <SkeletonAvatar size="sm" />
          <div className="skeleton-list-content">
            <Skeleton variant="text" height="1rem" className="skeleton-list-title" />
            <Skeleton variant="text" width="70%" height="0.875rem" className="skeleton-list-subtitle" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonPost() {
  return (
    <div className="card skeleton-post">
      <div className="skeleton-post-header">
        <SkeletonAvatar size="sm" />
        <div className="skeleton-post-meta">
          <Skeleton variant="text" width="120px" height="1rem" />
          <Skeleton variant="text" width="80px" height="0.875rem" />
        </div>
      </div>
      <Skeleton variant="text" lines={3} className="skeleton-post-content" />
      <Skeleton variant="rectangle" height="200px" className="skeleton-post-image" rounded />
      <div className="skeleton-post-actions">
        <SkeletonButton width="60px" />
        <SkeletonButton width="80px" />
        <SkeletonButton width="70px" />
      </div>
    </div>
  )
}




export default Skeleton
