import React, { useState, useRef } from 'react'

const CommentActions = ({
  comment,
  onReply,
  onEdit,
  onDelete,
  onSave,
  onReport,
  onAward
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const moreMenuRef = useRef(null)

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const handleSave = () => {
    onSave?.(comment.id, !comment.isSaved)
  }

  const isAuthor = comment.isCurrentUser
  const canEdit = isAuthor && !comment.isDeleted
  const canDelete = isAuthor && !comment.isDeleted

  const mainActions = [
    {
      id: 'reply',
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <path d="M2 2a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H6l-4 4V2z"/>
        </svg>
      ),
      label: 'Reply',
      onClick: onReply,
      show: !comment.isDeleted
    },
    {
      id: 'award',
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <path d="M7 0l1.5 3.5L12 4.5l-2.5 2.5L10 11l-3-1.5L4 11l.5-4L2 4.5l3.5-1L7 0z"/>
        </svg>
      ),
      label: 'Award',
      onClick: () => onAward?.(comment.id),
      show: !comment.isDeleted
    },
    {
      id: 'save',
      icon: comment.isSaved ? (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <path d="M2 2a2 2 0 012-2h8a2 2 0 012 2v11l-6-3-6 3V2z"/>
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 2a2 2 0 012-2h8a2 2 0 012 2v11l-6-3-6 3V2z"/>
        </svg>
      ),
      label: comment.isSaved ? 'Unsave' : 'Save',
      onClick: handleSave,
      show: true,
      active: comment.isSaved
    }
  ]

  const moreActions = [
    {
      id: 'edit',
      label: 'Edit',
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <path d="M11.5 1a2.5 2.5 0 013.5 3.5L6 13.5 1 12l1.5-5L11.5 1z"/>
        </svg>
      ),
      onClick: () => {
        onEdit?.()
        setShowMoreMenu(false)
      },
      show: canEdit
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <path d="M1 3h12v1H1V3zM2 5v7a2 2 0 002 2h6a2 2 0 002-2V5H2zm2 1h1v6H4V6zm3 0h1v6H7V6zm3 0h1v6h-1V6z"/>
          <path d="M5 1V0h4v1h3v1H2V1h3z"/>
        </svg>
      ),
      onClick: () => {
        if (window.confirm('Are you sure you want to delete this comment?')) {
          onDelete?.(comment.id)
        }
        setShowMoreMenu(false)
      },
      show: canDelete,
      danger: true
    },
    {
      id: 'report',
      label: 'Report',
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <path d="M1 2.5A1.5 1.5 0 012.5 1h2.793a1 1 0 01.707.293L7.5 2.793A1 1 0 008.207 3H11.5a1.5 1.5 0 011.5 1.5v1a.5.5 0 01-.5.5H2a.5.5 0 01-.5-.5v-3zM2.5 2a.5.5 0 00-.5.5V5h10V3.5a.5.5 0 00-.5-.5H8.207a1 1 0 01-.707-.293L6 1.707A1 1 0 005.293 1H2.5z"/>
          <path d="M2 6v5.5A1.5 1.5 0 003.5 13h7a1.5 1.5 0 001.5-1.5V6H2z"/>
        </svg>
      ),
      onClick: () => {
        onReport?.(comment.id)
        setShowMoreMenu(false)
      },
      show: !isAuthor && !comment.isDeleted,
      danger: true
    }
  ]

  const visibleMainActions = mainActions.filter(action => action.show)
  const visibleMoreActions = moreActions.filter(action => action.show)

  return (
    <div style={{
  position: 'relative'
}}>
      <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
        {/* Main Actions */}
        {visibleMainActions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            style={{
  display: 'flex',
  alignItems: 'center'
}}
            aria-label={action.label}
          >
            <span className="flex-shrink-0">
              {action.icon}
            </span>
            <span style={{
  display: 'none'
}}>
              {action.label}
            </span>
          </button>
        ))}

        {/* More Menu */}
        {visibleMoreActions.length > 0 && (
          <div style={{
  position: 'relative'
}}>
            <button
              ref={moreMenuRef}
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              style={{
  display: 'flex',
  alignItems: 'center'
}}
              aria-label="More options"
              aria-expanded={showMoreMenu}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M3 7a1 1 0 11-2 0 1 1 0 012 0zM7 6a1 1 0 100 2 1 1 0 000-2zM13 7a1 1 0 11-2 0 1 1 0 012 0z"/>
              </svg>
              <span style={{
  display: 'none'
}}>More</span>
            </button>

            {/* Dropdown Menu */}
            {showMoreMenu && (
              <div style={{
  position: 'absolute',
  border: '1px solid var(--border-subtle)'
}}>
                {visibleMoreActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={action.onClick}
                    style={{
  width: '100%',
  display: 'flex',
  alignItems: 'center'
}}
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Click outside handler for more menu */}
      {showMoreMenu && (
        <div
          style={{
  position: 'fixed'
}}
          onClick={() => setShowMoreMenu(false)}
        />
      )}
    </div>
  )
}



export default CommentActions