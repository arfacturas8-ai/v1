import React, { useState } from 'react'

const CreatePostFab = ({ 
  communityName = null,
  className = ''
}) => {
  const [showQuickActions, setShowQuickActions] = useState(false)

  const quickActions = [
    {
      id: 'text',
      label: 'Text Post',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 3a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H3a1 1 0 01-1-1V3zm2 2v12h12V5H4zm2 2h8v1H6V7zm0 2h8v1H6V9zm0 2h5v1H6v-1z"/>
        </svg>
      ),
      href: communityName ? `/r/${communityName}/submit?type=text` : '/submit?type=text',
      color: 'bg-[#58a6ff]'
    },
    {
      id: 'image',
      label: 'Image Post',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 3a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H3a1 1 0 01-1-1V3zm2 2v12h12V5H4zm2 8l2-2 1.5 1.5L12 10l4 4H6l2-2z"/>
          <circle cx="8" cy="8" r="1"/>
        </svg>
      ),
      href: communityName ? `/r/${communityName}/submit?type=image` : '/submit?type=image',
      color: 'bg-green-500'
    },
    {
      id: 'link',
      label: 'Link Post', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10.5 8.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
          <path d="M10.828 7.172a4 4 0 00-5.656 0l-2 2a4 4 0 105.656 5.656l1.5-1.5a.5.5 0 00-.708-.708l-1.5 1.5a3 3 0 11-4.242-4.242l2-2a3 3 0 014.242 0 .5.5 0 00.708-.708z"/>
        </svg>
      ),
      href: communityName ? `/r/${communityName}/submit?type=link` : '/submit?type=link',
      color: 'bg-[#a371f7]'
    }
  ]

  return (
    <div style={{
  position: 'fixed'
}}>
      {/* Quick Action Buttons */}
      {showQuickActions && (
        <div style={{
  display: 'flex',
  flexDirection: 'column'
}}>
          {quickActions.map((action) => (
            <a
              key={action.id}
              href={action.href}
              style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '48px',
  height: '48px',
  color: '#ffffff'
}}
              onClick={() => setShowQuickActions(false)}
            >
              {action.icon}
              <span className="sr-only">{action.label}</span>
            </a>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={() => setShowQuickActions(!showQuickActions)}
        style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '56px',
  color: '#ffffff',
  borderRadius: '50%'
}}
        aria-label="Create post"
      >
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="currentColor"
          className="transition-transform duration-200"
        >
          <path d="M12 2a1 1 0 011 1v8h8a1 1 0 110 2h-8v8a1 1 0 11-2 0v-8H3a1 1 0 110-2h8V3a1 1 0 011-1z"/>
        </svg>
      </button>

      {/* Quick Actions Labels (only show on hover/focus) */}
      {showQuickActions && (
        <div style={{
  position: 'absolute'
}}>
          {quickActions.map((action, index) => (
            <div
              key={action.id}
              style={{
  color: '#ffffff'
}}
              style={{
                animationDelay: `${index * 50}ms`,
                animationFillMode: 'forwards'
              }}
            >
              {action.label}
            </div>
          ))}
        </div>
      )}

      {/* Backdrop */}
      {showQuickActions && (
        <div
          style={{
  position: 'fixed',
  background: 'transparent'
}}
          onClick={() => setShowQuickActions(false)}
        />
      )}
    </div>
  )
}



export default CreatePostFab