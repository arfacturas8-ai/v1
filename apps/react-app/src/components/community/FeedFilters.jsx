import React from 'react'
import SortControls from './SortControls'

const FeedFilters = ({
  feedType,
  communityName,
  sortBy,
  timeFilter,
  onSort,
  onTimeFilter,
  onRefresh,
  refreshing = false,
  className = ''
}) => {
  const getFeedTitle = () => {
    switch (feedType) {
      case 'home':
        return 'Home Feed'
      case 'popular':
        return 'Popular'
      case 'community':
        return `c/${communityName}`
      default:
        return 'Posts'
    }
  }

  const getFeedDescription = () => {
    switch (feedType) {
      case 'home':
        return 'Posts from communities you\'ve joined'
      case 'popular':
        return 'The most active posts on CRYB'
      case 'community':
        return `Posts from c/${communityName}`
      default:
        return null
    }
  }

  return (
    <div className={`feed-filters ${className}`} style={{
      backgroundColor: 'var(--bg-secondary)',
      padding: 'var(--space-4)',
      borderRadius: 'var(--radius-xl)',
      marginBottom: 'var(--space-4)'
    }}>
      {/* Feed Header */}
      <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 'var(--space-4)'
}}>
        <div style={{
  flex: '1'
}}>
          <h1 style={{
  fontSize: 'var(--text-2xl)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--text-primary)',
  marginBottom: 'var(--space-1)'
}}>
            {getFeedTitle()}
          </h1>
          {getFeedDescription() && (
            <p style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)'
            }}>
              {getFeedDescription()}
            </p>
          )}
        </div>

        {/* Refresh Button (Desktop) */}
        {onRefresh && (
          <button
            className="btn btn-ghost"
            onClick={onRefresh}
            disabled={refreshing}
            style={{
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  padding: 'var(--space-2) var(--space-3)',
  borderRadius: 'var(--radius-full)',
  transition: 'all var(--transition-normal)'
}}
            aria-label="Refresh feed"
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 16 16" 
              fill="currentColor"
              className={refreshing ? '' : ''}
            >
              <path d="M8 2a6 6 0 016 6h-1.5a4.5 4.5 0 10-.945 2.52l1.06 1.06A6 6 0 018 2z"/>
            </svg>
            <span style={{
  display: 'none'
}}>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </span>
          </button>
        )}
      </div>

      {/* Sort Controls */}
      <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingTop: 'var(--space-3)',
  borderTop: '1px solid var(--border-subtle)'
}}>
        <SortControls
          sortBy={sortBy}
          timeFilter={timeFilter}
          onSort={onSort}
          onTimeFilter={onTimeFilter}
          showTimeFilter={sortBy === 'top' || sortBy === 'controversial'}
        />

        {/* Create Post Button (Desktop) */}
        <div style={{
  display: 'none'
}}>
          <a
            href={feedType === 'community'
              ? `/c/${communityName}/submit`
              : '/submit'
            }
            className="btn btn-primary"
            style={{
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  textDecoration: 'none'
}}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 2a1 1 0 011 1v4h4a1 1 0 110 2H9v4a1 1 0 11-2 0V9H3a1 1 0 110-2h4V3a1 1 0 011-1z"/>
            </svg>
            Create Post
          </a>
        </div>
      </div>

      {/* Feed Stats (if available) */}
      {feedType === 'community' && (
        <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-4)',
  marginTop: 'var(--space-3)',
  paddingTop: 'var(--space-3)',
  borderTop: '1px solid var(--border-subtle)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-secondary)'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-1)'
}}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" style={{ color: 'var(--text-tertiary)' }}>
              <path d="M6 0a6 6 0 1 0 0 12A6 6 0 0 0 6 0zM3 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm6 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
            </svg>
            <span>25.4K members</span>
          </div>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-1)'
}}>
            <div style={{
  width: '8px',
  height: '8px',
  borderRadius: 'var(--radius-full)',
  backgroundColor: 'var(--color-success)'
}} />
            <span>847 online</span>
          </div>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-1)'
}}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" style={{ color: 'var(--text-tertiary)' }}>
              <path d="M6 0a6 6 0 1 0 0 12A6 6 0 0 0 6 0zM5.5 1.5a.5.5 0 0 1 1 0v4a.5.5 0 0 1-.146.354l-2 2a.5.5 0 0 1-.708-.708L5.5 5.293V1.5z"/>
            </svg>
            <span>Created 2019</span>
          </div>
        </div>
      )}
    </div>
  )
}



export default FeedFilters