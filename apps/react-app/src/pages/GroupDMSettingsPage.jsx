import React, { useState, memo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Users, UserPlus, UserMinus, Crown, Shield,
  Bell, BellOff, Image, Trash2, LogOut, Settings
} from 'lucide-react'
import { useResponsive } from '../hooks/useResponsive'

const GroupDMSettingsPage = () => {
  const { isMobile, isTablet, spacing, fontSize, padding, containerMaxWidth } = useResponsive()

  const navigate = useNavigate()
  const { groupId } = useParams()
  const [groupName, setGroupName] = useState('Team Chat')
  const [groupIcon, setGroupIcon] = useState('👥')
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [members, setMembers] = useState([
    { id: 1, username: 'alice', avatar: '🐱', role: 'owner', isOnline: true },
    { id: 2, username: 'bob', avatar: '🐶', role: 'admin', isOnline: true },
    { id: 3, username: 'charlie', avatar: '🦊', role: 'member', isOnline: false },
    { id: 4, username: 'diana', avatar: '🐼', role: 'member', isOnline: true }
  ])

  const currentUserId = 1

  const removeMember = (memberId) => {
    if (window.confirm('Remove this member from the group?')) {
      setMembers(prev => prev.filter(m => m.id !== memberId))
    }
  }

  const changeMemberRole = (memberId, newRole) => {
    setMembers(prev =>
      prev.map(m => (m.id === memberId ? { ...m, role: newRole } : m))
    )
  }

  const leaveGroup = () => {
    if (window.confirm('Are you sure you want to leave this group?')) {
      navigate('/messages')
    }
  }

  const deleteGroup = () => {
    if (window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      navigate('/messages')
    }
  }

  const getRoleBadge = (role) => {
    switch (role) {
      case 'owner':
        return <Crown style={{ width: "24px", height: "24px", flexShrink: 0 }} />
      case 'admin':
        return <Shield style={{ width: "24px", height: "24px", flexShrink: 0 }} />
      default:
        return null
    }
  }

  const currentUserRole = members.find(m => m.id === currentUserId)?.role

  return (
    <div style={{background: "var(--bg-primary)"}} className="min-h-screen " role="main" aria-label="Group DM settings page">
      <div style={{borderColor: "var(--border-subtle)"}} className="card   border-b ">
        <div className="max-w-3xl mx-auto px-3 md:px-6 py-3 md:py-4 flex items-center gap-3 md:gap-4">
          <button
            onClick={() => navigate(-1)}
            style={{color: "var(--text-primary)"}} className="card p-2 bg-transparent border-none  cursor-pointer rounded-lg hover:  transition-colors flex items-center justify-center"
            aria-label="Go back"
          >
            <ArrowLeft style={{ width: "24px", height: "24px", flexShrink: 0 }} />
          </button>
          <div>
            <h1 style={{color: "var(--text-primary)"}} className="text-lg md:text-xl font-bold  m-0">Group Settings</h1>
            <p style={{color: "var(--text-secondary)"}} className="text-xs md:text-sm  m-0">{members.length} members</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-3 md:px-6 py-4 md:py-8 flex flex-col gap-5 md:gap-6">
        <div style={{borderColor: "var(--border-subtle)"}} className="card   border  rounded-xl p-5 md:p-8 ">
          <h2 style={{color: "var(--text-primary)"}} className="text-base md:text-lg font-semibold mb-3 md:mb-4  flex items-center gap-2">
            <Settings style={{ width: "24px", height: "24px", flexShrink: 0 }} />
            Group Information
          </h2>

          <div className="flex flex-col gap-3 md:gap-4">
            <div className="flex flex-col">
              <label style={{color: "var(--text-primary)"}} className="block text-xs md:text-sm font-medium mb-2 ">Group Icon</label>
              <div className="flex items-center gap-3 md:gap-4">
                <div className="text-5xl md:text-6xl">{groupIcon}</div>
                <button style={{color: "var(--text-primary)"}} className="py-2 md:py-2.5 px-3 md:px-4 bg-gradient-to-r from-[#58a6ff] to-[#a371f7]  border-none rounded-lg cursor-pointer flex items-center gap-2 text-xs md:text-sm font-medium">
                  <Image style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                  Change Icon
                </button>
              </div>
            </div>

            <div className="flex flex-col">
              <label style={{color: "var(--text-primary)"}} className="block text-xs md:text-sm font-medium mb-2 ">Group Name</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                style={{borderColor: "var(--border-subtle)"}} className="card w-full py-2.5 md:py-3 px-3 md:px-4 /80 border  rounded-2xl  text-sm md:text-base  outline-none"
                disabled={currentUserRole !== 'owner' && currentUserRole !== 'admin'}
              />
            </div>

            <div className="card flex items-center justify-between p-3 md:p-4 /80 rounded-2xl ">
              <div className="flex items-center gap-2 md:gap-3">
                {notificationsEnabled ? (
                  <Bell style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                ) : (
                  <BellOff style={{ color: "var(--text-secondary)", width: "24px", height: "24px", flexShrink: 0 }} />
                )}
                <div>
                  <div style={{color: "var(--text-primary)"}} className="font-medium  mb-1 text-sm md:text-base">Notifications</div>
                  <div style={{color: "var(--text-secondary)"}} className="text-xs md:text-sm ">Get notified of new messages</div>
                </div>
              </div>
              <button
                onClick={() => setNotificationsEnabled(prev => !prev)}
                className={`relative w-14 h-8 rounded-2xl  border-none cursor-pointer transition-colors ${
                  notificationsEnabled ? 'bg-[#58a6ff]' : 'bg-[#8b949e]'
                }`}
                aria-pressed={notificationsEnabled}
              >
                <div className={`absolute top-1 left-1 w-6 h-6 bg-[#161b22] rounded-full shadow-md transition-transform ${
                  notificationsEnabled ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        </div>

        <div style={{borderColor: "var(--border-subtle)"}} className="card   border  rounded-xl p-5 md:p-8 ">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 style={{color: "var(--text-primary)"}} className="text-base md:text-lg font-semibold  flex items-center gap-2 m-0">
              <Users style={{ width: "24px", height: "24px", flexShrink: 0 }} />
              Members ({members.length})
            </h2>
            {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
              <button style={{color: "var(--text-primary)"}} className="py-2 md:py-2.5 px-3 md:px-4 bg-gradient-to-r from-[#58a6ff] to-[#a371f7]  border-none rounded-lg cursor-pointer flex items-center gap-2 text-xs md:text-sm font-medium">
                <UserPlus style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                Add Members
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {members.map((member) => (
              <div key={member.id} className="card flex items-center justify-between p-3 md:p-4 rounded-2xl  hover:  transition-colors">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="relative">
                    <div className="text-2xl md:text-3xl">{member.avatar}</div>
                    {member.isOnline && <div style={{ width: "24px", height: "24px", flexShrink: 0 }} />}
                  </div>
                  <div>
                    <div style={{color: "var(--text-primary)"}} className="flex items-center gap-2 font-medium  text-sm md:text-base">
                      <span>{member.username}</span>
                      {getRoleBadge(member.role)}
                      {member.id === currentUserId && (
                        <span style={{color: "var(--text-secondary)"}} className="text-xs ">(You)</span>
                      )}
                    </div>
                    <div style={{color: "var(--text-secondary)"}} className="text-xs md:text-sm  capitalize">{member.role}</div>
                  </div>
                </div>

                {currentUserRole === 'owner' && member.id !== currentUserId && (
                  <div className="flex items-center gap-2">
                    <select
                      value={member.role}
                      onChange={(e) => changeMemberRole(member.id, e.target.value)}
                      style={{borderColor: "var(--border-subtle)"}} className="card py-1.5 md:py-2 px-2 md:px-3 /80 border  rounded-lg  text-xs md:text-sm cursor-pointer"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      onClick={() => removeMember(member.id)}
                      className="card p-2 bg-transparent border-none text-red-500 cursor-pointer rounded-lg hover:  transition-colors flex items-center justify-center"
                      aria-label={`Remove ${member.username}`}
                    >
                      <UserMinus style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card   border-2 border-red-500/30 rounded-xl p-5 md:p-8 ">
          <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-red-500">Danger Zone</h2>

          <div className="flex flex-col gap-2 md:gap-3">
            <button
              onClick={leaveGroup}
              className="w-full py-3 md:py-4 px-4 bg-red-500/10 text-red-500 border border-red-500/30 rounded-2xl  cursor-pointer flex items-center justify-center gap-2 text-sm md:text-base font-medium hover:bg-red-500/20 transition-colors"
            >
              <LogOut style={{ width: "24px", height: "24px", flexShrink: 0 }} />
              Leave Group
            </button>

            {currentUserRole === 'owner' && (
              <button
                onClick={deleteGroup}
                className="w-full py-3 md:py-4 px-4 bg-red-500/20 text-red-500 border border-red-500/40 rounded-2xl  cursor-pointer flex items-center justify-center gap-2 text-sm md:text-base font-medium hover:bg-red-500/30 transition-colors"
              >
                <Trash2 style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                Delete Group
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(GroupDMSettingsPage)

