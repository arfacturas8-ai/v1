import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import apiService from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useResponsive } from '../hooks/useResponsive'
import './UserCard.css'

function UserCard({ user, showActions = true, compact = false, onUpdate }) {
  const { user: currentUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const { isMobile } = useResponsive()

  if (!user) return null

  const isFriend = currentUser?.friends?.includes(user.id)
  const isFollowing = currentUser?.following?.includes(user.id)
  const isBlocked = currentUser?.blockedUsers?.includes(user.id)
  const hasPendingRequest = currentUser?.pendingFriendRequests?.includes(user.id)
  const hasIncomingRequest = currentUser?.incomingFriendRequests?.includes(user.id)
  const isSelf = currentUser?.id === user.id

  const handleFriendRequest = async () => {
    if (isLoading) return
    setIsLoading(true)

    try {
      if (isFriend) {
        await apiService.delete(`/friends/${user.id}`)
      } else if (hasIncomingRequest) {
        await apiService.post(`/friends/requests/${user.id}/accept`)
      } else {
        await apiService.post(`/friends/requests/${user.id}`)
      }

      if (onUpdate) {
        onUpdate()
      } else {
        window.location.reload()
      }
    } catch (error) {
      console.error('Friend request error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFollow = async () => {
    if (isLoading) return
    setIsLoading(true)

    try {
      if (isFollowing) {
        await apiService.delete(`/users/${user.id}/follow`)
      } else {
        await apiService.post(`/users/${user.id}/follow`)
      }

      if (onUpdate) {
        onUpdate()
      } else {
        window.location.reload()
      }
    } catch (error) {
      console.error('Follow error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBlock = async () => {
    if (isLoading) return
    if (!confirm(`Are you sure you want to block ${user.displayName}?`)) return

    setIsLoading(true)

    try {
      await apiService.post(`/users/me/blocked/${user.id}`)

      if (onUpdate) {
        onUpdate()
      } else {
        window.location.reload()
      }
    } catch (error) {
      console.error('Block error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (compact) {
    return (
      <div className="user-card user-card--compact">
        <Link to={`/user/${user.username}`} className="user-card__link">
          <div className="user-card__avatar-wrapper">
            <div className="user-card__avatar">
              <span>{user.avatar}</span>
            </div>
            {user.isOnline && (
              <div className="user-card__online-indicator"></div>
            )}
          </div>
          <div className="user-card__info">
            <p className="user-card__name">{user.displayName}</p>
            <p className="user-card__username">@{user.username}</p>
          </div>
        </Link>

        {showActions && !isSelf && (
          <div className="user-card__actions">
            {hasIncomingRequest && (
              <button
                onClick={handleFriendRequest}
                disabled={isLoading}
                className="user-card__btn user-card__btn--primary"
              >
                Accept
              </button>
            )}
            {!isFriend && !hasIncomingRequest && !hasPendingRequest && (
              <button
                onClick={handleFriendRequest}
                disabled={isLoading}
                className="user-card__btn user-card__btn--primary"
              >
                Add
              </button>
            )}
            {hasPendingRequest && (
              <span className="user-card__btn user-card__btn--pending">
                Pending
              </span>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="user-card user-card--full">
      <div className="user-card__content">
        <Link to={`/user/${user.username}`}>
          <div className="user-card__avatar-wrapper">
            <div className="user-card__avatar user-card__avatar--large">
              <span>{user.avatar}</span>
            </div>
            {user.isOnline && (
              <div className="user-card__online-indicator user-card__online-indicator--large"></div>
            )}
          </div>
        </Link>

        <div className="user-card__details">
          <div className="user-card__header">
            <Link to={`/user/${user.username}`} className="user-card__header-link">
              <h3 className="user-card__name--large">
                {user.displayName}
              </h3>
              <p className="user-card__username--large">@{user.username}</p>
            </Link>
          </div>

          {user.bio && (
            <p className="user-card__bio">{user.bio}</p>
          )}

          <div className="user-card__meta">
            <span className="user-card__meta-item">{user.karma} karma</span>
            <span>{user.friends?.length || 0} friends</span>
            <span>{user.followers?.length || 0} followers</span>
            {user.location && user.privacySettings?.showLocation && (
              <span className="user-card__meta-location">
                📍 {user.location}
              </span>
            )}
          </div>

          {user.interests && user.interests.length > 0 && (
            <div className="user-card__interests">
              {user.interests.slice(0, isMobile ? 2 : 3).map((interest, index) => (
                <span
                  key={index}
                  className="user-card__interest"
                >
                  {interest}
                </span>
              ))}
              {user.interests.length > (isMobile ? 2 : 3) && (
                <span className="user-card__interest">
                  +{user.interests.length - (isMobile ? 2 : 3)} more
                </span>
              )}
            </div>
          )}
        </div>

        {showActions && !isSelf && !isBlocked && (
          <div className="user-card__actions--full">
            {hasIncomingRequest ? (
              <button
                onClick={handleFriendRequest}
                disabled={isLoading}
                className="user-card__btn user-card__btn--full user-card__btn--primary"
              >
                Accept Friend Request
              </button>
            ) : isFriend ? (
              <button
                onClick={handleFriendRequest}
                disabled={isLoading}
                className="user-card__btn user-card__btn--full user-card__btn--primary"
              >
                Remove Friend
              </button>
            ) : hasPendingRequest ? (
              <span className="user-card__btn user-card__btn--full user-card__btn--pending">
                Request Sent
              </span>
            ) : (
              <button
                onClick={handleFriendRequest}
                disabled={isLoading}
                className="user-card__btn user-card__btn--full user-card__btn--primary"
              >
                Add Friend
              </button>
            )}

            <button
              onClick={handleFollow}
              disabled={isLoading}
              className="user-card__btn user-card__btn--full user-card__btn--secondary"
            >
              {isFollowing ? 'Unfollow' : 'Follow'}
            </button>

            <button
              onClick={handleBlock}
              disabled={isLoading}
              className="user-card__btn user-card__btn--full user-card__btn--danger"
            >
              Block
            </button>
          </div>
        )}

        {isSelf && (
          <Link
            to="/settings"
            className="user-card__btn user-card__btn--full user-card__btn--settings"
          >
            Edit Profile
          </Link>
        )}
      </div>
    </div>
  )
}



export default UserCard