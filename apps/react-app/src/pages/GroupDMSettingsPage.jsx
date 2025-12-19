/**
 * GroupDMSettingsPage - iOS Modern Aesthetic
 * Group messaging settings with clean iOS design patterns
 * - #FAFAFA background, #000 text, #666 secondary text, white cards
 * - No Tailwind classes, pure inline styles
 * - iOS-style shadows and border radius
 * - 52px inputs, 56px/48px buttons, 20px icons
 * - Smooth hover animations with translateY
 */

import React, { useState, memo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Users, UserPlus, UserMinus, Crown, Shield,
  Bell, BellOff, Image, Trash2, LogOut, Settings
} from 'lucide-react'
import { useResponsive } from '../hooks/useResponsive'

const GroupDMSettingsPage = () => {
  const { isMobile } = useResponsive()
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
        return <Crown size={20} style={{ color: '#6366F1' }} />
      case 'admin':
        return <Shield size={20} style={{ color: '#8B5CF6' }} />
      default:
        return null
    }
  }

  const currentUserRole = members.find(m => m.id === currentUserId)?.role

  return (
    <div role="main" aria-label="Group DM settings page" style={{ minHeight: '100vh', background: '#FAFAFA', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E0E0E0' }}>
        <div style={{ maxWidth: '768px', margin: '0 auto', padding: isMobile ? '16px 16px' : '20px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#000000',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F5F5F5'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 600, margin: 0, color: '#000000' }}>Group Settings</h1>
            <p style={{ fontSize: isMobile ? '12px' : '14px', color: '#666666', margin: 0 }}>{members.length} members</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '768px', margin: '0 auto', padding: isMobile ? '16px 16px' : '32px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Group Information */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E0E0E0',
          borderRadius: '20px',
          padding: isMobile ? '20px' : '32px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 600, marginBottom: '20px', color: '#000000', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={20} />
            Group Information
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ display: 'block', fontSize: isMobile ? '12px' : '14px', fontWeight: 500, marginBottom: '8px', color: '#000000' }}>Group Icon</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: isMobile ? '48px' : '60px' }}>{groupIcon}</div>
                <button
                  style={{
                    padding: isMobile ? '10px 16px' : '12px 20px',
                    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: isMobile ? '12px' : '14px',
                    fontWeight: 500,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <Image size={20} />
                  Change Icon
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ display: 'block', fontSize: isMobile ? '12px' : '14px', fontWeight: 500, marginBottom: '8px', color: '#000000' }}>Group Name</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                disabled={currentUserRole !== 'owner' && currentUserRole !== 'admin'}
                style={{
                  width: '100%',
                  height: '52px',
                  padding: '0 16px',
                  background: '#FAFAFA',
                  border: '1px solid #E0E0E0',
                  borderRadius: '16px',
                  color: '#000000',
                  fontSize: isMobile ? '14px' : '15px',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => {
                  if (currentUserRole === 'owner' || currentUserRole === 'admin') {
                    e.target.style.borderColor = '#6366F1'
                    e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E0E0E0'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: isMobile ? '12px' : '16px',
              background: '#FAFAFA',
              borderRadius: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {notificationsEnabled ? (
                  <Bell size={20} style={{ color: '#000000' }} />
                ) : (
                  <BellOff size={20} style={{ color: '#666666' }} />
                )}
                <div>
                  <div style={{ fontSize: isMobile ? '14px' : '15px', fontWeight: 500, color: '#000000', marginBottom: '4px' }}>Notifications</div>
                  <div style={{ fontSize: isMobile ? '12px' : '13px', color: '#666666' }}>Get notified of new messages</div>
                </div>
              </div>
              <button
                onClick={() => setNotificationsEnabled(prev => !prev)}
                aria-pressed={notificationsEnabled}
                style={{
                  position: 'relative',
                  width: '56px',
                  height: '32px',
                  borderRadius: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  background: notificationsEnabled ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' : '#CCCCCC'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '4px',
                  left: notificationsEnabled ? '28px' : '4px',
                  width: '24px',
                  height: '24px',
                  background: '#FFFFFF',
                  borderRadius: '50%',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  transition: 'all 0.3s'
                }} />
              </button>
            </div>
          </div>
        </div>

        {/* Members */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E0E0E0',
          borderRadius: '20px',
          padding: isMobile ? '20px' : '32px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 600, margin: 0, color: '#000000', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} />
              Members ({members.length})
            </h2>
            {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
              <button
                style={{
                  padding: isMobile ? '10px 16px' : '12px 20px',
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: isMobile ? '12px' : '14px',
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <UserPlus size={20} />
                Add Members
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {members.map((member) => (
              <div
                key={member.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: isMobile ? '12px' : '16px',
                  borderRadius: '16px',
                  background: '#FAFAFA',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F0F0F0'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#FAFAFA'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ fontSize: isMobile ? '28px' : '32px' }}>{member.avatar}</div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: isMobile ? '14px' : '15px', fontWeight: 500, color: '#000000' }}>
                      <span>{member.username}</span>
                      {getRoleBadge(member.role)}
                      {member.id === currentUserId && (
                        <span style={{ fontSize: '12px', color: '#666666' }}>(You)</span>
                      )}
                    </div>
                    <div style={{ fontSize: isMobile ? '12px' : '13px', color: '#666666', textTransform: 'capitalize' }}>{member.role}</div>
                  </div>
                </div>

                {currentUserRole === 'owner' && member.id !== currentUserId && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <select
                      value={member.role}
                      onChange={(e) => changeMemberRole(member.id, e.target.value)}
                      style={{
                        padding: isMobile ? '6px 8px' : '8px 12px',
                        background: '#FFFFFF',
                        border: '1px solid #E0E0E0',
                        borderRadius: '12px',
                        color: '#000000',
                        fontSize: isMobile ? '12px' : '13px',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      onClick={() => removeMember(member.id)}
                      aria-label={`Remove ${member.username}`}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#EF4444',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                        e.currentTarget.style.transform = 'translateY(-1px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      <UserMinus size={20} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div style={{
          background: '#FFFFFF',
          border: '2px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '20px',
          padding: isMobile ? '20px' : '32px',
          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.08)'
        }}>
          <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 600, marginBottom: '16px', color: '#EF4444' }}>Danger Zone</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={leaveGroup}
              style={{
                width: '100%',
                height: isMobile ? '48px' : '56px',
                padding: '0 16px',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#EF4444',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: isMobile ? '14px' : '15px',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <LogOut size={20} />
              Leave Group
            </button>

            {currentUserRole === 'owner' && (
              <button
                onClick={deleteGroup}
                style={{
                  width: '100%',
                  height: isMobile ? '48px' : '56px',
                  padding: '0 16px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#EF4444',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: isMobile ? '14px' : '15px',
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.25)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <Trash2 size={20} />
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
