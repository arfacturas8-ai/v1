import { X, MessageSquare, UserPlus, Crown, Shield, UserCircle } from 'lucide-react'
import { useResponsive } from '../../hooks/useResponsive'

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
        return <span className="px-2 py-1 rounded-lg bg-warning/20 text-warning font-medium text-xs">Admin</span>
      case 'moderator':
        return <span className="px-2 py-1 rounded-lg bg-accent-cyan/20 text-accent-cyan font-medium text-xs">Moderator</span>
      default:
        return <span className="px-2 py-1 rounded-lg bg-white/10 text-tertiary text-xs">Member</span>
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md sm:max-w-lg md:max-w-xl bg-[rgba(22,27,34,0.6)] backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.4),0_8px_32px_rgba(0,82,255,0.1)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 flex items-center justify-between border-b border-white/10">
          <h3 className="font-semibold text-base sm:text-lg">Profile</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/5 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X size={18} className="text-tertiary group-hover:text-primary" />
          </button>
        </div>
        
        {/* User Avatar and Basic Info */}
        <div className="px-4 sm:px-6 py-4 space-y-4 overflow-y-auto">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center font-bold text-white text-xl sm:text-2xl">
                {user.avatar || user.displayName?.[0] || user.username?.[0]}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-[rgba(22,27,34,0.6)] ${getStatusColor(user.status)}`}></div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-base sm:text-lg truncate">{user.displayName}</h4>
                {getRoleIcon(user.role)}
              </div>
              <p className="text-secondary text-sm mb-2 truncate">@{user.username}</p>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(user.status)}`}></div>
                <span className="text-xs sm:text-sm text-tertiary capitalize">{user.status}</span>
              </div>
              {getRoleBadge(user.role)}
            </div>
          </div>
        
          {/* User Stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="text-center">
              <div className="font-bold text-base sm:text-lg">127</div>
              <div className="text-xs text-tertiary">Messages</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-base sm:text-lg">42</div>
              <div className="text-xs text-tertiary">Reactions</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-base sm:text-lg">15</div>
              <div className="text-xs text-tertiary">Days Active</div>
            </div>
          </div>
        
          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
            <button className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-accent-cyan to-accent-purple rounded-xl font-medium hover:opacity-90 transition-opacity min-h-[44px]">
              <MessageSquare size={16} />
              <span className="text-sm sm:text-base">Send Direct Message</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-medium transition-colors border border-white/10 min-h-[44px]">
              <UserPlus size={16} />
              <span className="text-sm sm:text-base">Add Friend</span>
            </button>
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-error/20 rounded-xl font-medium transition-colors border border-white/10 hover:border-error min-h-[44px]">
              <span className="text-sm sm:text-base">Block User</span>
            </button>
          </div>
        </div>
        
          {/* Additional Info */}
          <div className="pt-4 border-t border-white/20">
            <div className="text-xs sm:text-sm text-tertiary space-y-1">
              <p>Joined: October 2024</p>
              <p>Last seen: {user.status === 'online' ? 'Now' : '2 hours ago'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



export default UserProfileModal