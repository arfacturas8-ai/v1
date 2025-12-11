import React, { useState, useEffect } from 'react'
import { UserPlus, UserMinus, UserCheck, MessageCircle, MoreHorizontal, Users, Heart } from 'lucide-react'
import socialService from '../../services/socialService'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../ui/useToast'
import { Button, IconButton } from '../ui/Button'
import { Card } from '../ui/Card'
const FollowButton = ({ 
  userId, 
  initialState = null,
  size = 'medium',
  variant = 'default',
  showDropdown = true,
  className = '',
  onStateChange = null,
  disabled = false
}) => {
  const allowDropdown = showDropdown
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()
  
  const [relationshipState, setRelationshipState] = useState({
    isFollowing: false,
    isFollower: false,
    isFriend: false,
    isBlocked: false,
    hasPendingRequest: false,
    mutualCount: 0,
    loading: false
  })
  
  const [isDropdownOpen, setShowDropdownState] = useState(false)
  const [optimisticUpdate, setOptimisticUpdate] = useState(null)

  // Initialize state
  useEffect(() => {
    if (initialState) {
      setRelationshipState(prev => ({ ...prev, ...initialState }))
    } else if (userId && currentUser?.id !== userId) {
      fetchRelationshipStatus()
    }
  }, [userId, initialState, currentUser])

  // Handle state change callback
  useEffect(() => {
    if (onStateChange) {
      onStateChange(relationshipState)
    }
  }, [relationshipState, onStateChange])

  const fetchRelationshipStatus = async () => {
    if (!userId || userId === currentUser?.id) return

    try {
      setRelationshipState(prev => ({ ...prev, loading: true }))
      const response = await socialService.getRelationshipStatus(userId)
      
      setRelationshipState(prev => ({
        ...prev,
        isFollowing: response.isFollowing || false,
        isFollower: response.isFollower || false,
        isFriend: response.isFriend || false,
        isBlocked: response.isBlocked || false,
        hasPendingRequest: response.hasPendingRequest || false,
        mutualCount: response.mutualCount || 0,
        loading: false
      }))
    } catch (error) {
      console.error('Error fetching relationship status:', error)
      setRelationshipState(prev => ({ ...prev, loading: false }))
    }
  }

  const handleFollow = async () => {
    if (!currentUser || disabled) return

    // Optimistic update
    const previousState = { ...relationshipState }
    setOptimisticUpdate('following')
    setRelationshipState(prev => ({ 
      ...prev, 
      isFollowing: true,
      loading: true 
    }))

    try {
      await socialService.followUser(userId)
      
      setRelationshipState(prev => ({
        ...prev,
        isFollowing: true,
        loading: false
      }))

      showToast(`Started following user`, 'success')
      setOptimisticUpdate(null)
      
    } catch (error) {
      // Revert optimistic update
      setRelationshipState(previousState)
      setOptimisticUpdate(null)
      showToast('Failed to follow user', 'error')
      console.error('Error following user:', error)
    }
  }

  const handleUnfollow = async () => {
    if (!currentUser || disabled) return

    // Optimistic update
    const previousState = { ...relationshipState }
    setOptimisticUpdate('unfollowing')
    setRelationshipState(prev => ({ 
      ...prev, 
      isFollowing: false,
      loading: true 
    }))

    try {
      await socialService.unfollowUser(userId)
      
      setRelationshipState(prev => ({
        ...prev,
        isFollowing: false,
        loading: false
      }))

      showToast(`Unfollowed user`, 'success')
      setOptimisticUpdate(null)
      
    } catch (error) {
      // Revert optimistic update
      setRelationshipState(previousState)
      setOptimisticUpdate(null)
      showToast('Failed to unfollow user', 'error')
      console.error('Error unfollowing user:', error)
    }
  }

  const handleSendFriendRequest = async () => {
    if (!currentUser || disabled) return

    try {
      await socialService.sendFriendRequest(userId)
      
      setRelationshipState(prev => ({
        ...prev,
        hasPendingRequest: true
      }))

      showToast('Friend request sent', 'success')
      setShowDropdownState(false)
      
    } catch (error) {
      showToast('Failed to send friend request', 'error')
      console.error('Error sending friend request:', error)
    }
  }

  const handleBlock = async () => {
    if (!currentUser || disabled) return

    try {
      await socialService.blockUser(userId)
      
      setRelationshipState(prev => ({
        ...prev,
        isBlocked: true,
        isFollowing: false,
        isFriend: false
      }))

      showToast('User blocked', 'success')
      setShowDropdownState(false)
      
    } catch (error) {
      showToast('Failed to block user', 'error')
      console.error('Error blocking user:', error)
    }
  }

  // Don't render for own profile
  if (!userId || userId === currentUser?.id) {
    return null
  }

  // Don't render if blocked
  if (relationshipState.isBlocked) {
    return (
      <button 
        className={`follow-button blocked ${size} ${className}`}
        disabled
      >
        Blocked
      </button>
    )
  }

  const handleButtonClick = () => {
    if (disabled || relationshipState.loading) return

    if (relationshipState.isFollowing || relationshipState.isFriend) {
      handleUnfollow()
    } else {
      handleFollow()
    }
  }

  const getButtonIcon = () => {
    if (relationshipState.isFriend) return <Users size={size === 'small' ? 14 : 16} />
    if (relationshipState.hasPendingRequest) return <UserCheck size={size === 'small' ? 14 : 16} />
    if (relationshipState.isFollowing) return <UserCheck size={size === 'small' ? 14 : 16} />
    return <UserPlus size={size === 'small' ? 14 : 16} />
  }

  const getButtonText = () => {
    if (optimisticUpdate === 'following') return 'Following...'
    if (optimisticUpdate === 'unfollowing') return 'Unfollowing...'
    if (relationshipState.loading) return ''
    if (relationshipState.isFriend) return 'Friends'
    if (relationshipState.hasPendingRequest) return 'Pending'
    if (relationshipState.isFollowing) return 'Following'
    return relationshipState.isFollower ? 'Follow Back' : 'Follow'
  }

  const getButtonVariant = () => {
    if (relationshipState.isFollowing || relationshipState.isFriend) return 'secondary'
    return variant === 'default' ? 'primary' : variant
  }

  return (
    <div style={{
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px'
}}>
      <Button
        variant={getButtonVariant()}
        size={size}
        onClick={handleButtonClick}
        disabled={disabled || relationshipState.loading || !!optimisticUpdate}
        loading={relationshipState.loading || !!optimisticUpdate}
        leftIcon={!relationshipState.loading && !optimisticUpdate && getButtonIcon()}
        className="shadow-md hover:shadow-lg transition-all"
      >
        {getButtonText()}
      </Button>

      {allowDropdown && !relationshipState.loading && (
        <div style={{
  position: 'relative'
}}>
          <IconButton
            variant={isDropdownOpen ? 'primary' : 'secondary'}
            size={size === 'small' ? 'icon-sm' : size === 'medium' ? 'icon' : 'icon-lg'}
            onClick={(e) => {
              e.stopPropagation()
              setShowDropdownState(!isDropdownOpen)
            }}
            disabled={disabled}
            aria-label="More options"
            className="shadow-md hover:shadow-lg"
          >
            <MoreHorizontal size={16} />
          </IconButton>

          {isDropdownOpen && (
            <Card
              variant="elevated"
              padding="sm"
              style={{
  position: 'absolute',
  width: '224px'
}}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-1">
                <div style={{
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px'
}}>
                  <p style={{
  fontWeight: '500'
}}>Actions</p>
                  {relationshipState.mutualCount > 0 && (
                    <p style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                      <Users size={12} />
                      {relationshipState.mutualCount} mutual
                    </p>
                  )}
                </div>

                <div style={{
  paddingTop: '4px',
  paddingBottom: '4px'
}}>
                  {!relationshipState.isFriend && !relationshipState.hasPendingRequest && (
                    <button
                      style={{
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '4px'
}}
                      onClick={handleSendFriendRequest}
                    >
                      <Heart size={14} />
                      Send Friend Request
                    </button>
                  )}

                  <button
                    style={{
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '4px'
}}
                    onClick={() => {
                      setShowDropdownState(false)
                    }}
                  >
                    <MessageCircle size={14} />
                    Send Message
                  </button>

                  <button
                    style={{
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '4px'
}}
                    onClick={handleBlock}
                  >
                    <UserMinus size={14} />
                    Block User
                  </button>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Follower badge for mutual following */}
      {relationshipState.isFollower && !relationshipState.isFollowing && (
        <span style={{
  position: 'absolute',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '0px',
  paddingBottom: '0px',
  borderRadius: '50%'
}}>
          Follows you
        </span>
      )}
    </div>
  )
}



export default FollowButton