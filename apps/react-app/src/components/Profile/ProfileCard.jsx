import React, { useState } from 'react'
import { 
  User, Verified, UserPlus, UserMinus, MessageSquare, 
  MoreHorizontal, MapPin, Calendar, Star, ExternalLink,
  Users, Heart, Hash, Eye, EyeOff, Flag
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import profileService from '../../services/profileService'
import { useToast } from '../ui/useToast'


export default function ProfileCard({ 
  user, 
  variant = 'default', // 'default', 'compact', 'search', 'mention'
  showActions = true,
  showStats = true,
  showBio = true,
  onClick = null,
  className = ''
}) {
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()
  
  const [relationship, setRelationship] = useState({
    isFollowing: user.relationship?.isFollowing || false,
    isFollower: user.relationship?.isFollower || false,
    isBlocked: user.relationship?.isBlocked || false,
    isFriend: user.relationship?.isFriend || false
  })
  
  const [showMoreOptions, setShowMoreOptions] = useState(false)
  const [loading, setLoading] = useState(false)

  const isOwnProfile = currentUser?.id === user.id

  const handleFollow = async (e) => {
    e.stopPropagation()
    if (!currentUser) {
      showToast('Please log in to follow users', 'error')
      return
    }

    try {
      setLoading(true)
      await profileService.toggleFollow(user.id)
      
      setRelationship(prev => ({
        ...prev,
        isFollowing: !prev.isFollowing
      }))
      
      showToast(
        relationship.isFollowing ? 'Unfollowed user' : 'Following user',
        'success'
      )
    } catch (error) {
      console.error('Error toggling follow:', error)
      showToast('Failed to update follow status', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleBlock = async (e) => {
    e.stopPropagation()
    try {
      setLoading(true)
      await profileService.toggleBlock(user.id)
      
      setRelationship(prev => ({
        ...prev,
        isBlocked: !prev.isBlocked,
        isFollowing: false
      }))
      
      showToast(
        relationship.isBlocked ? 'User unblocked' : 'User blocked',
        'success'
      )
    } catch (error) {
      console.error('Error toggling block:', error)
      showToast('Failed to update block status', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleMessage = (e) => {
    e.stopPropagation()
    // Check if direct-messages route exists, otherwise show info
    const dmUrl = `/messages/@${user.username}`
    // Try to navigate to DM
    if (typeof window !== 'undefined') {
      window.location.href = dmUrl
    } else {
      showToast('Opening direct message...', 'info')
    }
  }

  const handleReport = (e) => {
    e.stopPropagation()
    showToast('User reported', 'success')
  }

  const handleCardClick = () => {
    if (onClick) {
      onClick(user)
    } else {
      // Navigate to user profile
      window.location.href = `/profile/${user.username || user.id}`
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    })
  }

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  if (variant === 'compact') {
    return (
      <div 
        className={`profile-card profile-card--compact ${className}`}
        onClick={handleCardClick}
      >
        <div className="profile-card__avatar">
          {user.avatar ? (
            <img src={user.avatar} alt={user.username} />
          ) : (
            <div className="avatar-placeholder">
              <User size={20} />
            </div>
          )}
          {user.isVerified && (
            <div className="verified-indicator">
              <Verified size={12} />
            </div>
          )}
        </div>
        
        <div className="profile-card__info">
          <div className="profile-card__name">
            <span className="display-name">{user.displayName}</span>
            <span className="username">@{user.username}</span>
          </div>
          
          {showStats && user.stats && (
            <div className="profile-card__stats">
              <span>{formatNumber(user.stats.followers || 0)} followers</span>
              <span>{formatNumber(user.stats.karma || 0)} karma</span>
            </div>
          )}
        </div>

        {showActions && !isOwnProfile && (
          <div className="profile-card__actions">
            <button
              className={`btn-follow btn-follow--compact ${relationship.isFollowing ? 'following' : ''}`}
              onClick={handleFollow}
              disabled={loading}
            >
              {relationship.isFollowing ? (
                <UserMinus size={16} />
              ) : (
                <UserPlus size={16} />
              )}
            </button>
          </div>
        )}
      </div>
    )
  }

  if (variant === 'mention') {
    return (
      <div 
        className={`profile-card profile-card--mention ${className}`}
        onClick={handleCardClick}
      >
        <div className="profile-card__avatar">
          {user.avatar ? (
            <img src={user.avatar} alt={user.username} />
          ) : (
            <div className="avatar-placeholder">
              <User size={16} />
            </div>
          )}
        </div>
        
        <div className="profile-card__info">
          <span className="display-name">
            {user.displayName}
            {user.isVerified && <Verified size={14} />}
          </span>
          <span className="username">@{user.username}</span>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`profile-card profile-card--${variant} ${className}`}
      onClick={onClick ? handleCardClick : undefined}
    >
      {/* Card Header */}
      <div className="profile-card__header">
        <div className="profile-card__avatar">
          {user.avatar ? (
            <img src={user.avatar} alt={user.username} />
          ) : (
            <div className="avatar-placeholder">
              <User size={variant === 'search' ? 24 : 32} />
            </div>
          )}
          {user.isVerified && (
            <div className="verified-indicator">
              <Verified size={16} />
            </div>
          )}
        </div>

        <div className="profile-card__info">
          <div className="profile-card__name">
            <h3 className="display-name">
              {user.displayName}
              {user.isVerified && <Verified size={16} />}
            </h3>
            <p className="username">@{user.username}</p>
          </div>

          {user.location && (
            <div className="profile-card__meta">
              <MapPin size={14} />
              <span>{user.location}</span>
            </div>
          )}
        </div>

        {showActions && (
          <div className="profile-card__header-actions">
            {!isOwnProfile && (
              <div className="profile-card__menu">
                <button
                  className="btn-menu"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMoreOptions(!showMoreOptions)
                  }}
                >
                  <MoreHorizontal size={16} />
                </button>
                
                {showMoreOptions && (
                  <div className="profile-card__dropdown">
                    <button onClick={handleMessage}>
                      <MessageSquare size={14} />
                      Message
                    </button>
                    <button onClick={handleReport}>
                      <Flag size={14} />
                      Report
                    </button>
                    <button onClick={handleBlock} className="btn-danger">
                      {relationship.isBlocked ? (
                        <><Eye size={14} /> Unblock</>
                      ) : (
                        <><EyeOff size={14} /> Block</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bio */}
      {showBio && user.bio && (
        <div className="profile-card__bio">
          <p>{user.bio}</p>
        </div>
      )}

      {/* Badges */}
      {user.badges && user.badges.length > 0 && (
        <div className="profile-card__badges">
          {user.badges.slice(0, 3).map((badge, idx) => (
            <div key={idx} className="badge-mini">
              <Star size={12} />
              <span>{badge}</span>
            </div>
          ))}
          {user.badges.length > 3 && (
            <span className="badges-more">+{user.badges.length - 3} more</span>
          )}
        </div>
      )}

      {/* Stats */}
      {showStats && (
        <div className="profile-card__stats">
          {user.stats?.posts !== undefined && (
            <div className="stat-item">
              <span className="stat-value">{formatNumber(user.stats.posts)}</span>
              <span className="stat-label">Posts</span>
            </div>
          )}
          
          {user.stats?.followers !== undefined && (
            <div className="stat-item">
              <Users size={14} />
              <span className="stat-value">{formatNumber(user.stats.followers)}</span>
              <span className="stat-label">Followers</span>
            </div>
          )}
          
          {user.stats?.karma !== undefined && (
            <div className="stat-item">
              <Heart size={14} />
              <span className="stat-value">{formatNumber(user.stats.karma)}</span>
              <span className="stat-label">Karma</span>
            </div>
          )}
          
          {user.stats?.communities !== undefined && (
            <div className="stat-item">
              <Hash size={14} />
              <span className="stat-value">{formatNumber(user.stats.communities)}</span>
              <span className="stat-label">Communities</span>
            </div>
          )}
          
          {user.createdAt && (
            <div className="stat-item">
              <Calendar size={14} />
              <span className="stat-value">{formatDate(user.createdAt)}</span>
              <span className="stat-label">Joined</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {showActions && !isOwnProfile && (
        <div className="profile-card__actions">
          <button
            className={`btn-follow ${relationship.isFollowing ? 'following' : ''}`}
            onClick={handleFollow}
            disabled={loading}
          >
            {relationship.isFollowing ? (
              <><UserMinus size={16} /> Unfollow</>
            ) : (
              <><UserPlus size={16} /> Follow</>
            )}
          </button>
          
          <button className="btn-message" onClick={handleMessage}>
            <MessageSquare size={16} />
            Message
          </button>
        </div>
      )}

      {/* Relationship Status */}
      {!isOwnProfile && (relationship.isFollower || relationship.isFriend) && (
        <div className="profile-card__relationship">
          {relationship.isFriend && (
            <span className="relationship-badge relationship-badge--friend">
              Friends
            </span>
          )}
          {relationship.isFollower && (
            <span className="relationship-badge relationship-badge--follower">
              Follows you
            </span>
          )}
        </div>
      )}
    </div>
  )
}
