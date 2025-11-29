import React, { useState, useRef } from 'react'
import ShareModal from './ShareModal'
import AwardModal from './AwardModal'

const PostActions = ({
  post,
  onComment,
  onShare,
  onSave,
  onReport,
  onAward,
  compact = false
}) => {
  const [showShareModal, setShowShareModal] = useState(false)
  const [showAwardModal, setShowAwardModal] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const moreMenuRef = useRef(null)

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const handleSave = () => {
    onSave?.(post.id, !post.isSaved)
  }

  const handleShare = () => {
    if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      navigator.share({
        title: post.title,
        url: window.location.origin + `/c/${post.community}/comments/${post.id}`
      })
    } else {
      setShowShareModal(true)
    }
  }

  const actions = [
    {
      id: 'comment',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 3a1 1 0 011-1h10a1 1 0 011 1v6a1 1 0 01-1 1H6.414l-2.707 2.707A1 1 0 012 12V3z"/>
        </svg>
      ),
      label: `${formatNumber(post.commentCount || 0)} Comments`,
      shortLabel: formatNumber(post.commentCount || 0),
      onClick: () => onComment?.(post.id),
      ariaLabel: `${post.commentCount || 0} comments`
    },
    {
      id: 'award',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1l2.5 5.5L16 7.5l-4 4 1 5.5L8 14l-5 3 1-5.5-4-4 5.5-1L8 1z"/>
        </svg>
      ),
      label: 'Award',
      shortLabel: 'Award',
      onClick: () => setShowAwardModal(true),
      ariaLabel: 'Give award'
    },
    {
      id: 'share',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M11 2.5a2.5 2.5 0 11.603 1.628l-6.718 3.12a2.499 2.499 0 010 1.504l6.718 3.12a2.5 2.5 0 11-.488.876l-6.718-3.12a2.5 2.5 0 110-3.256l6.718-3.12A2.5 2.5 0 0111 2.5z"/>
        </svg>
      ),
      label: 'Share',
      shortLabel: 'Share',
      onClick: handleShare,
      ariaLabel: 'Share post'
    },
    {
      id: 'save',
      icon: post.isSaved ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 2a2 2 0 012-2h8a2 2 0 012 2v13.5a.5.5 0 01-.777.416L8 13.101l-5.223 2.815A.5.5 0 012 15.5V2z"/>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 2a2 2 0 012-2h8a2 2 0 012 2v13.5a.5.5 0 01-.777.416L8 13.101l-5.223 2.815A.5.5 0 012 15.5V2z"/>
        </svg>
      ),
      label: post.isSaved ? 'Unsave' : 'Save',
      shortLabel: post.isSaved ? 'Saved' : 'Save',
      onClick: handleSave,
      ariaLabel: post.isSaved ? 'Unsave post' : 'Save post'
    }
  ]

  const moreActions = [
    {
      id: 'report',
      label: 'Report',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M1 2.5A1.5 1.5 0 012.5 1h3.793a1 1 0 01.707.293L8.5 2.793A1 1 0 009.207 3H12.5a1.5 1.5 0 011.5 1.5v2a.5.5 0 01-.5.5H2a.5.5 0 01-.5-.5v-4zM2.5 2a.5.5 0 00-.5.5V6h11V4.5a.5.5 0 00-.5-.5h-3.293a1 1 0 01-.707-.293L7 2.707A1 1 0 006.293 2H2.5z"/>
          <path d="M2 7v6.5A1.5 1.5 0 003.5 15h9a1.5 1.5 0 001.5-1.5V7H2zm3.5 6a.5.5 0 01-.5-.5v-3a.5.5 0 011 0v3a.5.5 0 01-.5.5zm2.5 0a.5.5 0 01-.5-.5v-3a.5.5 0 011 0v3a.5.5 0 01-.5.5zm2.5 0a.5.5 0 01-.5-.5v-3a.5.5 0 011 0v3a.5.5 0 01-.5.5z"/>
        </svg>
      ),
      onClick: () => {
        onReport?.(post.id)
        setShowMoreMenu(false)
      },
      danger: true
    }
  ]

  return (
    <div style={{
  position: 'relative'
}}>
      <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
        {/* Main Actions */}
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  paddingLeft: '4px',
  paddingRight: '4px',
  paddingTop: '4px',
  paddingBottom: '4px'
}}
            aria-label={action.ariaLabel}
          >
            <span className="flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
              {action.icon}
            </span>
            <span style={{
  fontWeight: '500'
}}>
              {compact ? action.shortLabel : action.label}
            </span>
          </button>
        ))}

        {/* More Menu */}
        <div style={{
  position: 'relative'
}}>
          <button
            ref={moreMenuRef}
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  paddingLeft: '4px',
  paddingRight: '4px',
  paddingTop: '4px',
  paddingBottom: '4px'
}}
            aria-label="More options"
            aria-expanded={showMoreMenu}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="group-hover:scale-105 transition-transform duration-200">
              <circle cx="7" cy="3" r="0.5"/>
              <circle cx="7" cy="7" r="0.5"/>
              <circle cx="7" cy="11" r="0.5"/>
            </svg>
            {!compact && <span style={{
  fontWeight: '500'
}}>More</span>}
          </button>

          {/* Dropdown Menu */}
          {showMoreMenu && (
            <div style={{
  position: 'absolute',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  paddingTop: '4px',
  paddingBottom: '4px'
}}>
              {moreActions.map((action) => (
                <button
                  key={action.id}
                  onClick={action.onClick}
                  style={{
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px'
}}
                >
                  <span style={{
  width: '16px',
  height: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                    {action.icon}
                  </span>
                  <span style={{
  fontWeight: '500'
}}>{action.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showShareModal && (
        <ShareModal
          post={post}
          onClose={() => setShowShareModal(false)}
          onShare={onShare}
        />
      )}

      {showAwardModal && (
        <AwardModal
          post={post}
          onClose={() => setShowAwardModal(false)}
          onAward={onAward}
        />
      )}

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



export default PostActions