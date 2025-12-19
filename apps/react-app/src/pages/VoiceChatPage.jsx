/**
 * VoiceChatPage - Dedicated voice and video chat interface
 *
 * iOS Design System:
 * - Background: #FAFAFA (light gray)
 * - Text: #000 (primary), #666 (secondary)
 * - Cards: white with subtle shadows
 * - Border radius: 16-24px for modern iOS feel
 * - Shadows: 0 2px 8px rgba(0,0,0,0.04)
 * - Gradient: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)
 * - Icons: 20px standard size
 * - Hover: translateY(-2px) for interactive elements
 *
 * Features:
 * - WebRTC voice/video calling
 * - Screen sharing
 * - Participant management
 * - Audio controls (mute, deafen, volume)
 * - Channel switching
 * - Mobile-responsive design
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import EnhancedVoiceChannel from '../components/VoiceVideo/EnhancedVoiceChannel'
import { useAuth } from '../contexts/AuthContext'
import socketService from '../services/socket'
import {
  Mic,
  MicOff,
  Headphones,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  Users,
  Settings,
  PhoneOff,
  Volume2,
  VolumeX,
  Phone,
  Volume
} from 'lucide-react'

function VoiceChatPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()

  const [activeChannel, setActiveChannel] = useState(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isDeafened, setIsDeafened] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [volume, setVolume] = useState(100)
  const [channels, setChannels] = useState([])
  const [participants, setParticipants] = useState([])
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)

  const currentChannel = channels.find(c => c.id === activeChannel) || channels[0]

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/voice/channels`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('cryb_session_token')}`
          }
        })
        const data = await response.json()
        if (data.success && data.channels) {
          setChannels(data.channels)
          if (data.channels.length > 0 && !activeChannel) {
            setActiveChannel(data.channels[0].id)
          }
        }
      } catch (error) {
        console.error('Failed to fetch voice channels:', error)
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated) {
      fetchChannels()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated && activeChannel) {
      setTimeout(() => {
        setConnected(true)
        socketService.emit('voice_join', { channelId: activeChannel, userId: user?.id })
      }, 500)
    }
  }, [activeChannel, isAuthenticated, user])

  useEffect(() => {
    socketService.on('voice_user_joined', (data) => {
      setParticipants(prev => [...prev, data.user])
    })

    socketService.on('voice_user_left', (data) => {
      setParticipants(prev => prev.filter(p => p.id !== data.userId))
    })

    socketService.on('voice_user_muted', (data) => {
      setParticipants(prev => prev.map(p =>
        p.id === data.userId ? { ...p, isMuted: data.isMuted } : p
      ))
    })

    return () => {
      socketService.off('voice_user_joined')
      socketService.off('voice_user_left')
      socketService.off('voice_user_muted')
    }
  }, [])

  const handleMuteToggle = useCallback(() => {
    const newMutedState = !isMuted
    setIsMuted(newMutedState)
    socketService.emit('voice_mute', {
      channelId: activeChannel,
      userId: user?.id,
      isMuted: newMutedState
    })
  }, [isMuted, activeChannel, user])

  const handleDeafenToggle = useCallback(() => {
    const newDeafenedState = !isDeafened
    setIsDeafened(newDeafenedState)
    if (newDeafenedState) {
      setIsMuted(true)
    }
  }, [isDeafened])

  const handleVideoToggle = useCallback(() => {
    setIsVideoEnabled(prev => !prev)
  }, [])

  const handleScreenShareToggle = useCallback(() => {
    setIsScreenSharing(prev => !prev)
  }, [])

  const handleLeaveChannel = useCallback(() => {
    socketService.emit('voice_leave', { channelId: activeChannel, userId: user?.id })
    setConnected(false)
    navigate('/chat')
  }, [activeChannel, user, navigate])

  const handleChannelSwitch = useCallback((channelId) => {
    socketService.emit('voice_leave', { channelId: activeChannel, userId: user?.id })
    setActiveChannel(channelId)
    setConnected(false)
  }, [activeChannel, user])

  const isAdmin = user?.role === 'admin' || user?.isAdmin === true
  const isModerator = user?.role === 'moderator' || user?.isModerator === true

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA' }} role="main">
      {connected ? (
        <EnhancedVoiceChannel
          channel={currentChannel}
          currentUser={user}
          onLeave={handleLeaveChannel}
          isAdmin={isAdmin || isModerator}
          permissions={{
            canMute: isModerator || isAdmin,
            canKick: isModerator || isAdmin,
            canRecord: isAdmin
          }}
        />
      ) : (
        <div style={{ minHeight: '100vh', color: '#000' }}>
          {/* Header */}
          <div style={{
            background: '#fff',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
            padding: '16px 24px'
          }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Phone size={20} aria-hidden="true" style={{ color: '#6366F1', flexShrink: 0 }} />
                <div>
                  <h1 style={{ fontWeight: '600', fontSize: '20px', color: '#000', margin: 0 }}>{currentChannel?.name}</h1>
                  <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>{currentChannel?.description}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>

              {/* Participants Panel */}
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{
                  background: '#fff',
                  borderRadius: '24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  padding: '24px'
                }}>
                  <h2 style={{ fontWeight: '600', fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#000' }}>
                    <Users size={20} aria-hidden="true" style={{ flexShrink: 0 }} />
                    Participants ({participants.length})
                  </h2>

                  {connected ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                      {participants.map((participant) => (
                        <div
                          key={participant.id}
                          style={{
                            background: '#FAFAFA',
                            borderRadius: '16px',
                            padding: '16px',
                            border: participant.isSpeaking ? '2px solid #10b981' : '2px solid transparent',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ fontSize: '32px' }}>{participant.avatar}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: '500', color: '#000' }}>{participant.username}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                                {participant.isMuted ? (
                                  <MicOff size={20} style={{ flexShrink: 0, color: '#666' }} />
                                ) : (
                                  <Mic size={20} style={{ flexShrink: 0, color: '#666' }} />
                                )}
                                {participant.isDeafened && (
                                  <Volume size={20} style={{ flexShrink: 0, color: '#666' }} />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '48px 0', color: '#666' }}>
                      <Phone size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                      <p>Connecting to voice channel...</p>
                    </div>
                  )}
                </div>

                {/* Voice Controls */}
                <div style={{
                  background: '#fff',
                  borderRadius: '24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  padding: '24px',
                  marginTop: '24px'
                }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#000' }}>Voice Controls</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    <button
                      onClick={handleMuteToggle}
                      style={{
                        padding: '12px 24px',
                        borderRadius: '16px',
                        fontWeight: '500',
                        transition: 'transform 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#fff',
                        background: isMuted ? '#ef4444' : '#666',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                      aria-pressed={isMuted}
                    >
                      {isMuted ? <MicOff size={20} aria-hidden="true" style={{ flexShrink: 0 }} /> : <Mic size={20} aria-hidden="true" style={{ flexShrink: 0 }} />}
                      {isMuted ? 'Unmute' : 'Mute'}
                    </button>

                    <button
                      onClick={handleDeafenToggle}
                      style={{
                        padding: '12px 24px',
                        borderRadius: '16px',
                        fontWeight: '500',
                        transition: 'transform 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#fff',
                        background: isDeafened ? '#ef4444' : '#666',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      aria-label={isDeafened ? 'Undeafen audio' : 'Deafen audio'}
                      aria-pressed={isDeafened}
                    >
                      {isDeafened ? <Volume size={20} aria-hidden="true" style={{ flexShrink: 0 }} /> : <Headphones size={20} aria-hidden="true" style={{ flexShrink: 0 }} />}
                      {isDeafened ? 'Undeafen' : 'Deafen'}
                    </button>

                    <button
                      onClick={handleVideoToggle}
                      style={{
                        padding: '12px 24px',
                        borderRadius: '16px',
                        fontWeight: '500',
                        transition: 'transform 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#fff',
                        background: isVideoEnabled ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' : '#666',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      aria-label={isVideoEnabled ? 'Turn off video' : 'Turn on video'}
                      aria-pressed={isVideoEnabled}
                    >
                      {isVideoEnabled ? <Video size={20} aria-hidden="true" style={{ flexShrink: 0 }} /> : <VideoOff size={20} aria-hidden="true" style={{ flexShrink: 0 }} />}
                      Video
                    </button>

                    <button
                      onClick={handleScreenShareToggle}
                      style={{
                        padding: '12px 24px',
                        borderRadius: '16px',
                        fontWeight: '500',
                        transition: 'transform 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#fff',
                        background: isScreenSharing ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' : '#666',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      aria-label={isScreenSharing ? 'Stop screen sharing' : 'Start screen sharing'}
                      aria-pressed={isScreenSharing}
                    >
                      {isScreenSharing ? <Monitor size={20} aria-hidden="true" style={{ flexShrink: 0 }} /> : <MonitorOff size={20} aria-hidden="true" style={{ flexShrink: 0 }} />}
                      Screen Share
                    </button>
                  </div>

                  {/* Volume Control */}
                  <div style={{ marginTop: '24px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#000' }}>
                      {volume > 0 ? <Volume2 size={20} style={{ flexShrink: 0 }} /> : <VolumeX size={20} style={{ flexShrink: 0 }} />}
                      Volume: {volume}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#6366F1' }}
                    />
                  </div>
                </div>
              </div>

              {/* Available Channels Sidebar */}
              <div>
                <div style={{
                  background: '#fff',
                  borderRadius: '24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  padding: '24px'
                }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#000' }}>Voice Channels</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {channels.map((channel) => (
                      <button
                        key={channel.id}
                        onClick={() => handleChannelSwitch(channel.id)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '12px',
                          borderRadius: '16px',
                          transition: 'all 0.2s ease',
                          background: channel.id === activeChannel ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' : '#FAFAFA',
                          color: channel.id === activeChannel ? '#fff' : '#000',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          if (channel.id !== activeChannel) {
                            e.currentTarget.style.transform = 'translateY(-2px)'
                            e.currentTarget.style.background = '#f0f0f0'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (channel.id !== activeChannel) {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.background = '#FAFAFA'
                          }
                        }}
                      >
                        <div style={{ fontWeight: '500' }}>{channel.name}</div>
                        <div style={{ fontSize: '12px', opacity: 0.75, marginTop: '4px' }}>
                          {channel.participants.length}/{channel.maxParticipants} participants
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Quick Actions */}
                  <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#666' }}>Quick Actions</h4>
                    <button
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: '#FAFAFA',
                        borderRadius: '16px',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '8px',
                        color: '#000',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <Settings size={20} style={{ flexShrink: 0 }} />
                      Voice Settings
                    </button>
                    <button
                      onClick={() => navigate('/chat')}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: '#FAFAFA',
                        borderRadius: '16px',
                        fontSize: '14px',
                        color: '#000',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      Back to Chat
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VoiceChatPage
