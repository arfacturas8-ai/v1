import React, { useState } from 'react'
import Awards from './Awards'
import LoadingSpinner from './LoadingSpinner'

const UserProfile = ({
  user,
  isCurrentUser = false,
  onFollow,
  onUnfollow,
  onMessage,
  compact = false,
  showBio = true,
  className = ''
}) => {
  const [isFollowing, setIsFollowing] = useState(user?.isFollowing || false)
  const [followLoading, setFollowLoading] = useState(false)

  const handleFollowToggle = async () => {
    if (followLoading) return

    setFollowLoading(true)
    const wasFollowing = isFollowing

    try {
      // Optimistic update
      setIsFollowing(!wasFollowing)

      if (wasFollowing) {
        await onUnfollow?.(user.username)
      } else {
        await onFollow?.(user.username)
      }
    } catch (error) {
      // Revert on error
      setIsFollowing(wasFollowing)
      console.error('Failed to update follow status:', error)
    } finally {
      setFollowLoading(false)
    }
  }

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num?.toString() || '0'
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long'
    })
  }

  const getKarmaColor = (karma) => {
    if (karma >= 100000) return 'text-purple-500'
    if (karma >= 10000) return 'text-blue-500'
    if (karma >= 1000) return 'text-green-500'
    if (karma >= 100) return 'text-accent'
    return 'text-muted'
  }

  return (
    <div style={{
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}>
      <div style={{
  display: 'flex',
  alignItems: 'flex-start'
}}>
        {/* Avatar */}
        <div style={{
  position: 'relative',
  height: '80px'
}}>
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={`u/${user.username} avatar`}
              style={{
  width: '100%',
  height: '100%',
  borderRadius: '50%'
}}
              loading="lazy"
            />
          ) : (
            <div style={{
  width: '100%',
  height: '100%',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          
          {/* Online Indicator */}
          {user?.isOnline && (
            <div style={{
  position: 'absolute',
  width: '16px',
  height: '16px',
  borderRadius: '50%'
}} />
          )}
        </div>

        {/* User Info */}
        <div style={{
  flex: '1'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between'
}}>
            <div style={{
  flex: '1'
}}>
              <h2 style={{
  fontWeight: 'bold'
}}>
                <a 
                  href={`/u/${user?.username}`}
                  className="hover:text-accent/90 transition-colors duration-200"
                >
                  u/{user?.username}
                </a>
              </h2>
              
              {user?.displayName && (
                <p style={{
  fontWeight: '500'
}}>
                  {user.displayName}
                </p>
              )}

              {/* User Badges */}
              <div style={{
  display: 'flex',
  flexWrap: 'wrap'
}}>
                {user?.isPremium && (
                  <span style={{
  display: 'inline-flex',
  alignItems: 'center',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '0px',
  paddingBottom: '0px',
  borderRadius: '50%',
  fontWeight: '500',
  color: '#ffffff'
}}>
                    ✨ Premium
                  </span>
                )}
                {user?.isVerified && (
                  <span style={{
  display: 'inline-flex',
  alignItems: 'center',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '0px',
  paddingBottom: '0px',
  borderRadius: '50%',
  fontWeight: '500',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
                    ✓ Verified
                  </span>
                )}
                {user?.isModerator && (
                  <span style={{
  display: 'inline-flex',
  alignItems: 'center',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '0px',
  paddingBottom: '0px',
  borderRadius: '50%',
  fontWeight: '500',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
                    🛡️ Moderator
                  </span>
                )}
                {user?.isAdmin && (
                  <span style={{
  display: 'inline-flex',
  alignItems: 'center',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '0px',
  paddingBottom: '0px',
  borderRadius: '50%',
  fontWeight: '500',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
                    ⚙️ Admin
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {!isCurrentUser && (
              <div style={{
  display: 'flex'
}}>
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  style={{
  display: 'flex',
  alignItems: 'center',
  fontWeight: '500',
  color: '#ffffff',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}
                >
                  {followLoading ? (
                    <LoadingSpinner size="sm" color={isFollowing ? 'white' : 'accent'} />
                  ) : (
                    <>
                      {isFollowing ? (
                        <>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.5L5 7.5 3 5.5"/>
                          </svg>
                          Following
                        </>
                      ) : (
                        <>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 2v8M2 6h8"/>
                          </svg>
                          Follow
                        </>
                      )}
                    </>
                  )}
                </button>

                <button
                  onClick={() => onMessage?.(user?.username)}
                  style={{
  display: 'flex',
  alignItems: 'center',
  fontWeight: '500',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 2H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h1l2 2 2-2h1a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"/>
                  </svg>
                  Message
                </button>
              </div>
            )}
          </div>

          {/* User Stats */}
          <div style={{
  display: 'grid',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
            <div style={{
  textAlign: 'center'
}}>
              <div style={{
  fontWeight: 'bold'
}}>
                {formatNumber(user?.karma?.total || 0)}
              </div>
              <div style={{
  fontWeight: '500'
}}>Karma</div>
            </div>
            
            <div style={{
  textAlign: 'center'
}}>
              <div style={{
  fontWeight: 'bold'
}}>
                {formatNumber(user?.postCount || 0)}
              </div>
              <div style={{
  fontWeight: '500'
}}>Posts</div>
            </div>
            
            <div style={{
  textAlign: 'center'
}}>
              <div style={{
  fontWeight: 'bold'
}}>
                {formatNumber(user?.commentCount || 0)}
              </div>
              <div style={{
  fontWeight: '500'
}}>Comments</div>
            </div>
            
            <div style={{
  textAlign: 'center'
}}>
              <div style={{
  fontWeight: 'bold'
}}>
                {formatNumber(user?.followerCount || 0)}
              </div>
              <div style={{
  fontWeight: '500'
}}>Followers</div>
            </div>
          </div>

          {/* Karma Breakdown */}
          {user?.karma && !compact && (
            <div className="mb-md">
              <h4 style={{
  fontWeight: '500'
}}>Karma Breakdown</h4>
              <div style={{
  display: 'flex'
}}>
                <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="text-orange-500">
                    <path d="M6 1l1.5 3h3l-2.5 2.5 1 3.5L6 8l-3 2 1-3.5L1.5 4h3L6 1z"/>
                  </svg>
                  <span>Post: {formatNumber(user.karma.post || 0)}</span>
                </div>
                <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="text-blue-500">
                    <path d="M2 2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4l-4 4V2z"/>
                  </svg>
                  <span>Comment: {formatNumber(user.karma.comment || 0)}</span>
                </div>
                <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                  <span className="text-lg">🥇</span>
                  <span>Award: {formatNumber(user.karma.award || 0)}</span>
                </div>
              </div>
            </div>
          )}

          {/* User Bio */}
          {showBio && user?.bio && !compact && (
            <div style={{
  borderRadius: '12px'
}}>
              <p className="text-secondary/90 text-sm leading-relaxed italic">
                “{user.bio}”
              </p>
            </div>
          )}

          {/* Awards Received */}
          {user?.awards && user.awards.length > 0 && (
            <div className="mb-md">
              <h4 style={{
  fontWeight: '500'
}}>Awards Received</h4>
              <Awards awards={user.awards} size="sm" maxVisible={8} />
            </div>
          )}

          {/* Account Info */}
          <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
            {user?.cakeDay && (
              <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                <span>🎂</span>
                <span>Cake day: {formatDate(user.cakeDay)}</span>
              </div>
            )}
            
            {user?.joinedAt && (
              <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="6" cy="6" r="5"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 3v3l2 1"/>
                </svg>
                <span>Joined {formatDate(user.joinedAt)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}



export default UserProfile