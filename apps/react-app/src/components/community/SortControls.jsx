import React, { useState, useRef } from 'react'

const SortControls = ({
  sortBy = 'hot',
  timeFilter = 'day',
  onSort,
  onTimeFilter,
  showTimeFilter = true,
  compact = false
}) => {
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [showTimeMenu, setShowTimeMenu] = useState(false)
  const sortMenuRef = useRef(null)
  const timeMenuRef = useRef(null)

  const sortOptions = [
    {
      id: 'hot',
      label: 'Hot',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 16c4.418 0 8-3.582 8-8 0-1.38-.35-2.68-.965-3.81L13 6.215C12.683 7.19 12 8 11 8c-1.657 0-3-1.343-3-3 0-.552.447-1 1-1s1 .448 1 1c0 .274.225.5.5.5s.5-.226.5-.5c0-1.102-.898-2-2-2S7 3.398 7 4.5c0 2.209 1.791 4 4 4 .827 0 1.587-.25 2.217-.678C13.748 9.145 14 10.531 14 12c0 3.309-2.691 6-6 6s-6-2.691-6-6c0-1.294.41-2.49 1.109-3.47L4 7.64C3.38 8.77 3 10.07 3 11.5c0 2.761 2.239 5 5 5z"/>
        </svg>
      ),
      description: 'Rising posts with high engagement'
    },
    {
      id: 'new',
      label: 'New',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zM1.5 8a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0z"/>
          <path d="M8 4.5a.5.5 0 0 0-.5.5v3.5H5a.5.5 0 0 0 0 1h3a.5.5 0 0 0 .5-.5V5a.5.5 0 0 0-.5-.5z"/>
        </svg>
      ),
      description: 'Most recent posts'
    },
    {
      id: 'top',
      label: 'Top',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M7.5 1l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4l2-4z"/>
        </svg>
      ),
      description: 'Highest scoring posts'
    },
    {
      id: 'rising',
      label: 'Rising',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M0 10l6-6 2 2 8-8v3l-8 8-2-2-4 4H0v-1z"/>
        </svg>
      ),
      description: 'Posts gaining momentum'
    },
    {
      id: 'controversial',
      label: 'Controversial',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zM4.5 7a.5.5 0 0 1 .5-.5h2V5a.5.5 0 0 1 1 0v1.5h2a.5.5 0 0 1 0 1H8V9a.5.5 0 0 1-1 0V7.5H5a.5.5 0 0 1-.5-.5z"/>
        </svg>
      ),
      description: 'Posts with mixed reactions'
    }
  ]

  const timeOptions = [
    { id: 'hour', label: 'Past Hour' },
    { id: 'day', label: 'Past 24 Hours' },
    { id: 'week', label: 'Past Week' },
    { id: 'month', label: 'Past Month' },
    { id: 'year', label: 'Past Year' },
    { id: 'all', label: 'All Time' }
  ]

  const currentSort = sortOptions.find(option => option.id === sortBy) || sortOptions[0]
  const currentTime = timeOptions.find(option => option.id === timeFilter) || timeOptions[1]

  const shouldShowTimeFilter = showTimeFilter && (sortBy === 'top' || sortBy === 'controversial')

  const handleSortChange = (newSort) => {
    onSort?.(newSort)
    setShowSortMenu(false)
  }

  const handleTimeFilterChange = (newTime) => {
    onTimeFilter?.(newTime)
    setShowTimeMenu(false)
  }

  return (
    <div style={{
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap'
}}>
      {/* Sort Dropdown */}
      <div style={{
  position: 'relative'
}}>
        <button
          ref={sortMenuRef}
          onClick={() => setShowSortMenu(!showSortMenu)}
          style={{
  display: 'flex',
  alignItems: 'center',
  border: '1px solid var(--border-subtle)'
}}
          aria-label="Sort posts"
          aria-expanded={showSortMenu}
        >
          <span className="text-accent">
            {currentSort.icon}
          </span>
          <span style={{
  fontWeight: '500'
}}>
            {currentSort.label}
          </span>
          <svg 
            width="12" 
            height="12" 
            viewBox="0 0 12 12" 
            fill="currentColor"
            className={`text-muted transition-transform ${showSortMenu ? 'rotate-180' : ''}`}
          >
            <path d="M3 4.5L6 7.5L9 4.5H3Z"/>
          </svg>
        </button>

        {/* Sort Dropdown Menu */}
        {showSortMenu && (
          <div style={{
  position: 'absolute',
  border: '1px solid var(--border-subtle)'
}}>
            {sortOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSortChange(option.id)}
                style={{
  width: '100%',
  display: 'flex',
  alignItems: 'flex-start'
}}
              >
                <span className="flex-shrink-0 mt-xs">
                  {option.icon}
                </span>
                <div style={{
  flex: '1'
}}>
                  <div style={{
  fontWeight: '500'
}}>
                    {option.label}
                  </div>
                  <div className="text-xs text-muted mt-xs">
                    {option.description}
                  </div>
                </div>
                {option.id === sortBy && (
                  <span className="flex-shrink-0 text-accent mt-xs">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                      <path d="M10.97 4.97a.75.75 0 0 0-1.08-1.04L5.5 8.44 2.66 5.6a.75.75 0 0 0-1.08 1.04l3.5 3.5a.75.75 0 0 0 1.08 0l5-5z"/>
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Time Filter Dropdown */}
      {shouldShowTimeFilter && (
        <div style={{
  position: 'relative'
}}>
          <button
            ref={timeMenuRef}
            onClick={() => setShowTimeMenu(!showTimeMenu)}
            style={{
  display: 'flex',
  alignItems: 'center',
  border: '1px solid var(--border-subtle)'
}}
            aria-label="Time filter"
            aria-expanded={showTimeMenu}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" className="text-accent">
              <path d="M7 0a7 7 0 1 0 0 14A7 7 0 0 0 7 0zM6.5 2a.5.5 0 0 1 1 0v5a.5.5 0 0 1-.146.354l-2 2a.5.5 0 0 1-.708-.708L6.5 6.793V2z"/>
            </svg>
            <span style={{
  fontWeight: '500'
}}>
              {currentTime.label}
            </span>
            <svg 
              width="12" 
              height="12" 
              viewBox="0 0 12 12" 
              fill="currentColor"
              className={`text-muted transition-transform ${showTimeMenu ? 'rotate-180' : ''}`}
            >
              <path d="M3 4.5L6 7.5L9 4.5H3Z"/>
            </svg>
          </button>

          {/* Time Filter Dropdown Menu */}
          {showTimeMenu && (
            <div style={{
  position: 'absolute',
  border: '1px solid var(--border-subtle)'
}}>
              {timeOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleTimeFilterChange(option.id)}
                  style={{
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}
                >
                  <span>{option.label}</span>
                  {option.id === timeFilter && (
                    <span className="text-accent">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                        <path d="M10.97 4.97a.75.75 0 0 0-1.08-1.04L5.5 8.44 2.66 5.6a.75.75 0 0 0-1.08 1.04l3.5 3.5a.75.75 0 0 0 1.08 0l5-5z"/>
                      </svg>
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mobile Sort Indicator */}
      <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M1 3h10v1H1V3zM1 7h6v1H1V7zM1 5h8v1H1V5z"/>
        </svg>
        <span>Sorted by {currentSort.label.toLowerCase()}</span>
      </div>

      {/* Click outside handlers */}
      {showSortMenu && (
        <div
          style={{
  position: 'fixed'
}}
          onClick={() => setShowSortMenu(false)}
        />
      )}
      
      {showTimeMenu && (
        <div
          style={{
  position: 'fixed'
}}
          onClick={() => setShowTimeMenu(false)}
        />
      )}
    </div>
  )
}



export default SortControls