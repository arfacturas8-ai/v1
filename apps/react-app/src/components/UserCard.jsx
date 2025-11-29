import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import apiService from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useResponsive } from '../hooks/useResponsive'

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-0 p-3 sm:p-4 rounded-lg border border-white/10 w-full">
        <Link to={`/user/${user.username}`} className="flex items-center gap-3 flex-1 w-full sm:w-auto">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-cryb-primary to-cryb-secondary">
              <span className="text-white text-sm sm:text-base font-bold">{user.avatar}</span>
            </div>
            {user.isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-background"></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm sm:text-base text-foreground truncate">{user.displayName}</p>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">@{user.username}</p>
          </div>
        </Link>

        {showActions && !isSelf && (
          <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
            {hasIncomingRequest && (
              <button
                onClick={handleFriendRequest}
                disabled={isLoading}
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-white bg-cryb-primary hover:bg-cryb-primary/90 rounded transition-colors flex-1 sm:flex-none"
              >
                Accept
              </button>
            )}
            {!isFriend && !hasIncomingRequest && !hasPendingRequest && (
              <button
                onClick={handleFriendRequest}
                disabled={isLoading}
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-white bg-cryb-primary hover:bg-cryb-primary/90 rounded transition-colors flex-1 sm:flex-none"
              >
                Add
              </button>
            )}
            {hasPendingRequest && (
              <span className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-muted text-muted-foreground rounded text-center flex-1 sm:flex-none">
                Pending
              </span>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full rounded-lg border border-white/10 p-4 md:p-6">
      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        <Link to={`/user/${user.username}`} className="flex-shrink-0">
          <div className="relative">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-cryb-primary to-cryb-secondary">
              <span className="text-white text-xl md:text-2xl font-bold">{user.avatar}</span>
            </div>
            {user.isOnline && (
              <div className="absolute bottom-0 right-0 w-4 h-4 md:w-5 md:h-5 bg-green-500 rounded-full border-2 border-background"></div>
            )}
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <Link to={`/user/${user.username}`} className="group">
            <h3 className="text-base md:text-lg font-semibold text-foreground group-hover:text-cryb-primary transition-colors truncate">
              {user.displayName}
            </h3>
            <p className="text-sm md:text-base text-muted-foreground truncate">@{user.username}</p>
          </Link>

          {user.bio && (
            <p className="mt-2 text-sm md:text-base text-muted-foreground line-clamp-2">{user.bio}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-3 text-xs md:text-sm text-muted-foreground">
            <span className="font-medium">{user.karma} karma</span>
            <span>{user.friends?.length || 0} friends</span>
            <span>{user.followers?.length || 0} followers</span>
            {user.location && user.privacySettings?.showLocation && (
              <span className="flex items-center gap-1">
                📍 {user.location}
              </span>
            )}
          </div>

          {user.interests && user.interests.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {user.interests.slice(0, isMobile ? 2 : 3).map((interest, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs md:text-sm bg-muted text-muted-foreground rounded-full"
                >
                  {interest}
                </span>
              ))}
              {user.interests.length > (isMobile ? 2 : 3) && (
                <span className="px-2 py-1 text-xs md:text-sm bg-muted text-muted-foreground rounded-full">
                  +{user.interests.length - (isMobile ? 2 : 3)} more
                </span>
              )}
            </div>
          )}
        </div>

        {showActions && !isSelf && !isBlocked && (
          <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto">
            {hasIncomingRequest ? (
              <button
                onClick={handleFriendRequest}
                disabled={isLoading}
                className="flex-1 md:flex-none px-4 py-2 text-sm md:text-base text-white bg-cryb-primary hover:bg-cryb-primary/90 rounded transition-colors"
              >
                Accept Friend Request
              </button>
            ) : isFriend ? (
              <button
                onClick={handleFriendRequest}
                disabled={isLoading}
                className="flex-1 md:flex-none px-4 py-2 text-sm md:text-base text-white bg-cryb-primary hover:bg-cryb-primary/90 rounded transition-colors"
              >
                Remove Friend
              </button>
            ) : hasPendingRequest ? (
              <span className="flex-1 md:flex-none px-4 py-2 text-sm md:text-base bg-muted text-muted-foreground rounded text-center">
                Request Sent
              </span>
            ) : (
              <button
                onClick={handleFriendRequest}
                disabled={isLoading}
                className="flex-1 md:flex-none px-4 py-2 text-sm md:text-base text-white bg-cryb-primary hover:bg-cryb-primary/90 rounded transition-colors"
              >
                Add Friend
              </button>
            )}

            <button
              onClick={handleFollow}
              disabled={isLoading}
              className="flex-1 md:flex-none px-4 py-2 text-sm md:text-base bg-muted hover:bg-muted/80 text-foreground rounded transition-colors"
            >
              {isFollowing ? 'Unfollow' : 'Follow'}
            </button>

            <button
              onClick={handleBlock}
              disabled={isLoading}
              className="flex-1 md:flex-none px-4 py-2 text-sm md:text-base bg-muted hover:bg-muted/80 text-muted-foreground rounded transition-colors"
            >
              Block
            </button>
          </div>
        )}

        {isSelf && (
          <Link
            to="/settings"
            className="px-4 py-2 text-sm md:text-base text-white bg-cryb-primary hover:bg-cryb-primary/90 rounded transition-colors text-center"
          >
            Edit Profile
          </Link>
        )}
      </div>
    </div>
  )
}



export default UserCard