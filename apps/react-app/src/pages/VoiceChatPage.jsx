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

/**
 * VoiceChatPage - Dedicated voice and video chat interface
 * Features:
 * - WebRTC voice/video calling
 * - Screen sharing
 * - Participant management
 * - Audio controls (mute, deafen, volume)
 * - Channel switching
 * - Mobile-responsive design
 */

function VoiceChatPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()

  // Voice state
  const [activeChannel, setActiveChannel] = useState(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isDeafened, setIsDeafened] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [volume, setVolume] = useState(100)

  // Data state - fetch from API
  const [channels, setChannels] = useState([])
  const [participants, setParticipants] = useState([])
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)

  // Get current channel
  const currentChannel = channels.find(c => c.id === activeChannel) || channels[0]


  // Fetch voice channels from API
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

  // Auto-connect to voice channel
  useEffect(() => {
    if (isAuthenticated && activeChannel) {
      setTimeout(() => {
        setConnected(true)
        socketService.emit('voice_join', { channelId: activeChannel, userId: user?.id })
      }, 500)
    }
  }, [activeChannel, isAuthenticated, user])

  // Handle voice channel events
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

  // Event handlers
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
      setIsMuted(true) // Auto-mute when deafened
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

  // Check if user has admin/moderator permissions
  const isAdmin = user?.role === 'admin' || user?.isAdmin === true
  const isModerator = user?.role === 'moderator' || user?.isModerator === true
  return (
    <div className="min-h-screen" role="main">
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
        <div className="min-h-screen text-gray-900">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-3 md:p-4 lg:p-6">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3 md:gap-4">
                <Phone className="w-5 h-5 md:w-6 md:h-6 text-[#58a6ff]" aria-hidden="true" />
                <div>
                  <h1 className="font-bold text-lg md:text-xl text-gray-900">{currentChannel?.name}</h1>
                  <p className="text-gray-600 text-xs md:text-sm">{currentChannel?.description}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Participants Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 md:p-6">
              <h2 className="font-semibold flex items-center text-base md:text-lg mb-4 gap-2 text-gray-900">
                <Users className="w-5 h-5" aria-hidden="true" />
                Participants ({participants.length})
              </h2>

              {connected ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className={`
                        bg-gray-50 rounded-lg p-4 border-2 transition-all
                        ${participant.isSpeaking
                          ? 'border-green-500 shadow-lg shadow-green-500/20'
                          : 'border-transparent'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{participant.avatar}</div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{participant.username}</div>
                          <div className="flex items-center gap-2 text-sm">
                            {participant.isMuted ? (
                              <MicOff className="w-4 h-4 text-red-500" />
                            ) : (
                              <Mic className="w-4 h-4 text-green-500" />
                            )}
                            {participant.isDeafened && (
                              <Volume className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-600">
                  <Phone className="w-12 h-12 mx-auto mb-3 " />
                  <p>Connecting to voice channel...</p>
                </div>
              )}
            </div>

            {/* Voice Controls */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 md:p-6 mt-6">
              <h3 className="text-base md:text-lg font-semibold mb-4 text-gray-900">Voice Controls</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleMuteToggle}
                  className={`
                    px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 text-white
                    ${isMuted
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                    }
                  `}
                  aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                  aria-pressed={isMuted}
                >
                  {isMuted ? <MicOff className="w-5 h-5" aria-hidden="true" /> : <Mic className="w-5 h-5" aria-hidden="true" />}
                  {isMuted ? 'Unmute' : 'Mute'}
                </button>

                <button
                  onClick={handleDeafenToggle}
                  className={`
                    px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 text-white
                    ${isDeafened
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                    }
                  `}
                  aria-label={isDeafened ? 'Undeafen audio' : 'Deafen audio'}
                  aria-pressed={isDeafened}
                >
                  {isDeafened ? <Volume className="w-5 h-5" aria-hidden="true" /> : <Headphones className="w-5 h-5" aria-hidden="true" />}
                  {isDeafened ? 'Undeafen' : 'Deafen'}
                </button>

                <button
                  onClick={handleVideoToggle}
                  className={`
                    px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 text-white
                    ${isVideoEnabled
                      ? 'bg-[#58a6ff] hover:bg-blue-700'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                    }
                  `}
                  aria-label={isVideoEnabled ? 'Turn off video' : 'Turn on video'}
                  aria-pressed={isVideoEnabled}
                >
                  {isVideoEnabled ? <Video className="w-5 h-5" aria-hidden="true" /> : <VideoOff className="w-5 h-5" aria-hidden="true" />}
                  Video
                </button>

                <button
                  onClick={handleScreenShareToggle}
                  className={`
                    px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 text-white
                    ${isScreenSharing
                      ? 'bg-[#a371f7] hover:bg-purple-700'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                    }
                  `}
                  aria-label={isScreenSharing ? 'Stop screen sharing' : 'Start screen sharing'}
                  aria-pressed={isScreenSharing}
                >
                  {isScreenSharing ? <Monitor className="w-5 h-5" aria-hidden="true" /> : <MonitorOff className="w-5 h-5" aria-hidden="true" />}
                  Screen Share
                </button>
              </div>

              {/* Volume Control */}
              <div className="mt-6">
                <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-900">
                  {volume > 0 ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  Volume: {volume}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Available Channels Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Voice Channels</h3>
              <div className="space-y-2">
                {channels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => handleChannelSwitch(channel.id)}
                    className={`
                      w-full text-left p-3 rounded-lg transition-all
                      ${channel.id === activeChannel
                        ? 'bg-[#58a6ff] text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                      }
                    `}
                  >
                    <div className="font-medium">{channel.name}</div>
                    <div className="text-xs opacity-75 mt-1">
                      {channel.participants.length}/{channel.maxParticipants} participants
                    </div>
                  </button>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold mb-3 text-gray-600">Quick Actions</h4>
                <button className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm flex items-center gap-2 mb-2 text-gray-900">
                  <Settings className="w-4 h-4" />
                  Voice Settings
                </button>
                <button
                  onClick={() => navigate('/chat')}
                  className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-900"
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
