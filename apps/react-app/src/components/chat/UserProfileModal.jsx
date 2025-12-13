import { X, MessageSquare, UserPlus, Crown, Shield, UserCircle } from 'lucide-react'
import { useResponsive } from '../../hooks/useResponsive'
import './UserProfileModal.css'

const UserProfileModal = ({ user, isOpen, onClose }) => {
  const { isMobile, isTablet } = useResponsive()

  if (!isOpen || !user) return null

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-success'
      case 'away': return 'bg-warning'  
      case 'busy': return 'bg-error'
      default: return 'bg-tertiary'
    }
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Crown size={16} className="text-warning" />
      case 'moderator': return <Shield size={16} className="text-accent-cyan" />
      default: return <UserCircle size={16} className="text-tertiary" />
    }
  }

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="user-profile-modal__role-badge user-profile-modal__role-badge--admin">Admin</span>
      case 'moderator':
        return <span className="user-profile-modal__role-badge user-profile-modal__role-badge--moderator">Moderator</span>
      default:
        return <span className="user-profile-modal__role-badge user-profile-modal__role-badge--member">Member</span>
    }
  }

  return (
    <div className="user-profile-modal-overlay" onClick={onClose}>
      <div
        className="user-profile-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="user-profile-modal__header">
          <h3 className="user-profile-modal__title">Profile</h3>
          <button
            onClick={onClose}
            className="user-profile-modal__close"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Avatar and Basic Info */}
        <div className="user-profile-modal__body">
          <div className="user-profile-modal__user-info">
            <div className="user-profile-modal__avatar-wrapper">
              <div className="user-profile-modal__avatar">
                {user.avatar || user.displayName?.[0] || user.username?.[0]}
              </div>
              <div className={`user-profile-modal__status-indicator user-profile-modal__status-indicator--${user.status || 'offline'}`}></div>
            </div>

            <div className="user-profile-modal__details">
              <div className="user-profile-modal__name-row">
                <h4 className="user-profile-modal__display-name">{user.displayName}</h4>
                {getRoleIcon(user.role)}
              </div>
              <p className="user-profile-modal__username">@{user.username}</p>
              <div className="user-profile-modal__status-row">
                <div className={`user-profile-modal__status-dot user-profile-modal__status-dot--${user.status || 'offline'}`}></div>
                <span className="user-profile-modal__status-text">{user.status}</span>
              </div>
              {getRoleBadge(user.role)}
            </div>
          </div>

          {/* User Stats */}
          <div className="user-profile-modal__stats">
            <div className="user-profile-modal__stat">
              <span className="user-profile-modal__stat-value">127</span>
              <span className="user-profile-modal__stat-label">Messages</span>
            </div>
            <div className="user-profile-modal__stat">
              <span className="user-profile-modal__stat-value">42</span>
              <span className="user-profile-modal__stat-label">Reactions</span>
            </div>
            <div className="user-profile-modal__stat">
              <span className="user-profile-modal__stat-value">15</span>
              <span className="user-profile-modal__stat-label">Days Active</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="user-profile-modal__actions">
            <button className="user-profile-modal__btn user-profile-modal__btn--primary">
              <MessageSquare size={16} />
              <span>Send Direct Message</span>
            </button>
          </div>

          <div className="user-profile-modal__secondary-actions">
            <button className="user-profile-modal__btn user-profile-modal__btn--secondary">
              <UserPlus size={16} />
              <span>Add Friend</span>
            </button>
            <button className="user-profile-modal__btn user-profile-modal__btn--danger">
              <span>Block User</span>
            </button>
          </div>

          {/* Additional Info */}
          <div className="user-profile-modal__additional-info">
            <p className="user-profile-modal__info-text">Joined: October 2024</p>
            <p className="user-profile-modal__info-text">Last seen: {user.status === 'online' ? 'Now' : '2 hours ago'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}



export default UserProfileModal