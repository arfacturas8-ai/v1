import React, { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Mic, MicOff, Headphones, Volume2, VolumeX, 
  PhoneOff, Video, VideoOff, Monitor, Settings,
  Users, UserPlus, Crown, Shield, MoreHorizontal, Pin, Maximize2
} from 'lucide-react'

/**
 * VoiceChannelInterface - Discord-style voice channel with WebRTC
 * Features: Voice/video calls, screen sharing, participant management, audio controls
 */
function VoiceChannelInterface({
  channelId,
  channelName = 'Voice Channel',
  participants = [],
  user,
  onLeave,
  onInvite,
  isMobile = false,
  className = ''
}) {
  // Audio/Video state
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isDeafened, setIsDeafened] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  
  // UI state
  const [isMinimized, setIsMinimized] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showParticipants, setShowParticipants] = useState(true)
  const [selectedParticipant, setSelectedParticipant] = useState(null)
  const [layout, setLayout] = useState('grid') // 'grid', 'speaker', 'sidebar'
  
  // Audio settings
  const [audioSettings, setAudioSettings] = useState({
    inputDevice: null,
    outputDevice: null,
    inputVolume: 100,
    outputVolume: 100,
    noiseSuppression: true,
    echoCancellation: true,
    autoGainControl: true
  })
  
  // WebRTC state
  const [localStream, setLocalStream] = useState(null)
  const [remoteStreams, setRemoteStreams] = useState(new Map())
  const [peerConnections, setPeerConnections] = useState(new Map())
  const [audioDevices, setAudioDevices] = useState({ input: [], output: [] })
  
  // Refs
  const localVideoRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const dataArrayRef = useRef(null)
  const animationFrameRef = useRef(null)

  // Initialize WebRTC
  useEffect(() => {
    initializeWebRTC()
    loadAudioDevices()
    
    return () => {
      cleanup()
    }
  }, [])

  // Join voice channel
  useEffect(() => {
    if (channelId && !isConnected) {
      joinVoiceChannel()
    }
  }, [channelId])

  // Audio level detection
  useEffect(() => {
    if (localStream && !isMuted) {
      startAudioLevelDetection()
    } else {
      stopAudioLevelDetection()
    }
    
    return () => stopAudioLevelDetection()
  }, [localStream, isMuted])

  // Initialize WebRTC
  const initializeWebRTC = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: audioSettings.echoCancellation,
          noiseSuppression: audioSettings.noiseSuppression,
          autoGainControl: audioSettings.autoGainControl
        },
        video: false
      })
      
      setLocalStream(stream)
      
      // Setup audio context for volume analysis
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)
      
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount)
      
      setIsConnected(true)
    } catch (error) {
      console.error('Failed to initialize WebRTC:', error)
    }
  }

  // Load available audio devices
  const loadAudioDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const inputDevices = devices.filter(device => device.kind === 'audioinput')
      const outputDevices = devices.filter(device => device.kind === 'audiooutput')
      
      setAudioDevices({ input: inputDevices, output: outputDevices })
    } catch (error) {
      console.error('Failed to load audio devices:', error)
    }
  }

  // Start audio level detection
  const startAudioLevelDetection = () => {
    if (!analyserRef.current || !dataArrayRef.current) return
    
    const detectAudioLevel = () => {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current)
      
      // Calculate average volume
      const average = dataArrayRef.current.reduce((a, b) => a + b) / dataArrayRef.current.length
      const threshold = 30 // Adjust this threshold as needed
      
      setIsSpeaking(average > threshold)
      
      animationFrameRef.current = requestAnimationFrame(detectAudioLevel)
    }
    
    detectAudioLevel()
  }

  const stopAudioLevelDetection = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    setIsSpeaking(false)
  }

  // Join voice channel
  const joinVoiceChannel = async () => {
    try {
      // Send join request to server
      // This would integrate with your WebRTC signaling server
      
      // Mock successful connection
      setIsConnected(true)
    } catch (error) {
      console.error('Failed to join voice channel:', error)
    }
  }

  // Leave voice channel
  const leaveVoiceChannel = () => {
    cleanup()
    setIsConnected(false)
    onLeave && onLeave()
  }

  // Cleanup WebRTC resources
  const cleanup = () => {
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
      setLocalStream(null)
    }
    
    // Close peer connections
    peerConnections.forEach(pc => pc.close())
    setPeerConnections(new Map())
    
    // Clean up audio context
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    
    stopAudioLevelDetection()
  }

  // Toggle mute
  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = isMuted
        setIsMuted(!isMuted)
      }
    }
  }

  // Toggle deafen
  const toggleDeafen = () => {
    setIsDeafened(!isDeafened)
    // This would also mute the user
    if (!isDeafened) {
      setIsMuted(true)
    }
  }

  // Toggle video
  const toggleVideo = async () => {
    try {
      if (!isVideoEnabled) {
        // Add video track
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true })
        const videoTrack = videoStream.getVideoTracks()[0]
        
        if (localStream) {
          localStream.addTrack(videoTrack)
        }
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream
        }
        
        setIsVideoEnabled(true)
      } else {
        // Remove video track
        if (localStream) {
          const videoTracks = localStream.getVideoTracks()
          videoTracks.forEach(track => {
            track.stop()
            localStream.removeTrack(track)
          })
        }
        
        setIsVideoEnabled(false)
      }
    } catch (error) {
      console.error('Failed to toggle video:', error)
    }
  }

  // Toggle screen sharing
  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        // Replace video track with screen share
        setIsScreenSharing(true)
      } else {
        // Stop screen sharing and revert to camera
        setIsScreenSharing(false)
      }
    } catch (error) {
      console.error('Failed to toggle screen share:', error)
    }
  }

  // Update audio settings
  const updateAudioSetting = (key, value) => {
    setAudioSettings(prev => ({ ...prev, [key]: value }))
    
    // Apply settings to local stream
    if (localStream && key === 'inputVolume') {
      // Adjust input volume
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack && audioTrack.getSettings) {
        // Note: Not all browsers support volume adjustment via constraints
      }
    }
  }

  // Format duration
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  // Get participant status
  const getParticipantStatus = (participant) => {
    if (participant.speaking) return 'speaking'
    if (participant.muted) return 'muted'
    if (participant.deafened) return 'deafened'
    return 'connected'
  }

  // Render participant
  const renderParticipant = (participant) => {
    const isCurrentUser = participant.id === user?.id
    const status = getParticipantStatus(participant)
    
    return (
      <div
        key={participant.id}
        style={{
  position: 'relative',
  padding: '12px',
  borderRadius: '12px',
  background: 'rgba(22, 27, 34, 0.6)'
}}
      >
        <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
          {/* Avatar */}
          <div style={{
  position: 'relative'
}}>
            <div style={{
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  background: 'rgba(22, 27, 34, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
              {participant.avatar ? (
                <img 
                  src={participant.avatar} 
                  alt={participant.username}
                  style={{
  width: '100%',
  height: '100%',
  borderRadius: '50%'
}}
                />
              ) : (
                <span style={{
  fontWeight: '500',
  color: '#ffffff'
}}>
                  {participant.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            
            {/* Speaking indicator */}
            {status === 'speaking' && (
              <div style={{
  position: 'absolute',
  borderRadius: '50%'
}} />
            )}
          </div>
          
          {/* Info */}
          <div style={{
  flex: '1'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <span style={{
  fontWeight: '500',
  color: '#ffffff'
}}>
                {participant.username}
                {isCurrentUser && ' (You)'}
              </span>
              
              {/* Role badge */}
              {participant.role && participant.role !== 'member' && (
                <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                  {participant.role === 'owner' && <Crown style={{
  width: '12px',
  height: '12px'
}} />}
                  {participant.role === 'admin' && <Shield style={{
  width: '12px',
  height: '12px'
}} />}
                </div>
              )}
            </div>
            
            <div style={{
  display: 'flex',
  alignItems: 'center',
  color: '#A0A0A0'
}}>
              {/* Voice status indicators */}
              {participant.muted && <MicOff style={{
  width: '12px',
  height: '12px'
}} />}
              {participant.deafened && <VolumeX style={{
  width: '12px',
  height: '12px'
}} />}
              {participant.video && <Video style={{
  width: '12px',
  height: '12px'
}} />}
              {participant.screenSharing && <Monitor style={{
  width: '12px',
  height: '12px'
}} />}
              
              <span>{status === 'speaking' ? 'Speaking' : 'Connected'}</span>
            </div>
          </div>
          
          {/* Actions */}
          {!isCurrentUser && (
            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <button
                onClick={() => setSelectedParticipant(participant.id)}
                style={{
  padding: '4px',
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)'
}}
                title="User options"
              >
                <MoreHorizontal style={{
  width: '16px',
  height: '16px'
}} />
              </button>
            </div>
          )}
        </div>
        
        {/* Video display */}
        {participant.video && layout !== 'grid' && (
          <div style={{
  borderRadius: '4px',
  overflow: 'hidden'
}}>
            {/* Video element would go here */}
            <div style={{
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ffffff'
}}>
              Video Stream
            </div>
          </div>
        )}
      </div>
    )
  }

  if (isMinimized) {
    return (
      <div style={{
  position: 'fixed',
  background: 'rgba(22, 27, 34, 0.6)',
  color: '#ffffff',
  borderRadius: '12px',
  padding: '12px'
}}>
        <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
            <Volume2 style={{
  width: '16px',
  height: '16px'
}} />
            <span style={{
  fontWeight: '500'
}}>{channelName}</span>
            <span style={{
  color: '#A0A0A0'
}}>({participants.length})</span>
          </div>
          
          <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
            <button
              onClick={toggleMute}
              style={{
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)'
}}
            >
              {isMuted ? <MicOff style={{
  width: '12px',
  height: '12px'
}} /> : <Mic style={{
  width: '12px',
  height: '12px'
}} />}
            </button>
            
            <button
              onClick={() => setIsMinimized(false)}
              style={{
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)'
}}
            >
              <Maximize2 style={{
  width: '12px',
  height: '12px'
}} />
            </button>
            
            <button
              onClick={leaveVoiceChannel}
              style={{
  borderRadius: '4px'
}}
            >
              <PhoneOff style={{
  width: '12px',
  height: '12px'
}} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
  background: 'rgba(22, 27, 34, 0.6)'
}}>
      {/* Voice Channel Header */}
      <div style={{
  padding: '16px'
}}>
        <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
            <Volume2 style={{
  width: '20px',
  height: '20px'
}} />
            <div>
              <h3 style={{
  fontWeight: '600',
  color: '#ffffff'
}}>
                {channelName}
              </h3>
              <p style={{
  color: '#A0A0A0'
}}>
                {participants.length} participant{participants.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
            <button
              onClick={() => setLayout(layout === 'grid' ? 'speaker' : layout === 'speaker' ? 'sidebar' : 'grid')}
              style={{
  padding: '8px',
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)'
}}
              title="Change layout"
            >
              <Users style={{
  width: '16px',
  height: '16px'
}} />
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              style={{
  padding: '8px',
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)'
}}
            >
              <Settings style={{
  width: '16px',
  height: '16px'
}} />
            </button>
            
            <button
              onClick={() => setIsMinimized(true)}
              style={{
  padding: '8px',
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)'
}}
            >
              <Pin style={{
  width: '16px',
  height: '16px'
}} />
            </button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div style={{
  padding: '16px',
  background: 'rgba(22, 27, 34, 0.6)'
}}>
          <h4 style={{
  fontWeight: '500',
  color: '#ffffff'
}}>Audio Settings</h4>
          
          <div style={{
  display: 'grid',
  gap: '16px'
}}>
            {/* Input Device */}
            <div>
              <label style={{
  display: 'block',
  fontWeight: '500',
  color: '#A0A0A0'
}}>
                Microphone
              </label>
              <select
                value={audioSettings.inputDevice || ''}
                onChange={(e) => updateAudioSetting('inputDevice', e.target.value)}
                style={{
  width: '100%',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  background: 'rgba(22, 27, 34, 0.6)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '4px'
}}
              >
                <option value="">Default</option>
                {audioDevices.input.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Output Device */}
            <div>
              <label style={{
  display: 'block',
  fontWeight: '500',
  color: '#A0A0A0'
}}>
                Speaker
              </label>
              <select
                value={audioSettings.outputDevice || ''}
                onChange={(e) => updateAudioSetting('outputDevice', e.target.value)}
                style={{
  width: '100%',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  background: 'rgba(22, 27, 34, 0.6)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '4px'
}}
              >
                <option value="">Default</option>
                {audioDevices.output.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Speaker ${device.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Input Volume */}
            <div>
              <label style={{
  display: 'block',
  fontWeight: '500',
  color: '#A0A0A0'
}}>
                Input Volume: {audioSettings.inputVolume}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={audioSettings.inputVolume}
                onChange={(e) => updateAudioSetting('inputVolume', parseInt(e.target.value))}
                style={{
  width: '100%'
}}
              />
            </div>
            
            {/* Output Volume */}
            <div>
              <label style={{
  display: 'block',
  fontWeight: '500',
  color: '#A0A0A0'
}}>
                Output Volume: {audioSettings.outputVolume}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={audioSettings.outputVolume}
                onChange={(e) => updateAudioSetting('outputVolume', parseInt(e.target.value))}
                style={{
  width: '100%'
}}
              />
            </div>
          </div>
          
          {/* Audio Processing */}
          <div className="mt-4 space-y-2">
            <label style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <input
                type="checkbox"
                checked={audioSettings.noiseSuppression}
                onChange={(e) => updateAudioSetting('noiseSuppression', e.target.checked)}
                style={{
  borderRadius: '4px'
}}
              />
              <span className="text-sm">Noise Suppression</span>
            </label>
            
            <label style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <input
                type="checkbox"
                checked={audioSettings.echoCancellation}
                onChange={(e) => updateAudioSetting('echoCancellation', e.target.checked)}
                style={{
  borderRadius: '4px'
}}
              />
              <span className="text-sm">Echo Cancellation</span>
            </label>
            
            <label style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <input
                type="checkbox"
                checked={audioSettings.autoGainControl}
                onChange={(e) => updateAudioSetting('autoGainControl', e.target.checked)}
                style={{
  borderRadius: '4px'
}}
              />
              <span className="text-sm">Auto Gain Control</span>
            </label>
          </div>
        </div>
      )}

      {/* Participants */}
      <div style={{
  padding: '16px'
}}>
        <div style={{
  display: 'grid',
  gap: '12px'
}}>
          {participants.map(renderParticipant)}
        </div>
      </div>

      {/* Controls */}
      <div style={{
  padding: '16px',
  background: 'rgba(22, 27, 34, 0.6)'
}}>
        <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
          {/* Mute */}
          <button
            onClick={toggleMute}
            style={{
  padding: '12px',
  borderRadius: '50%',
  color: '#ffffff',
  background: 'rgba(22, 27, 34, 0.6)'
}}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff style={{
  width: '20px',
  height: '20px'
}} /> : <Mic style={{
  width: '20px',
  height: '20px'
}} />}
          </button>
          
          {/* Deafen */}
          <button
            onClick={toggleDeafen}
            style={{
  padding: '12px',
  borderRadius: '50%',
  color: '#ffffff',
  background: 'rgba(22, 27, 34, 0.6)'
}}
            title={isDeafened ? 'Undeafen' : 'Deafen'}
          >
            {isDeafened ? <VolumeX style={{
  width: '20px',
  height: '20px'
}} /> : <Headphones style={{
  width: '20px',
  height: '20px'
}} />}
          </button>
          
          {/* Video */}
          <button
            onClick={toggleVideo}
            style={{
  padding: '12px',
  borderRadius: '50%',
  color: '#ffffff',
  background: 'rgba(22, 27, 34, 0.6)'
}}
            title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoEnabled ? <Video style={{
  width: '20px',
  height: '20px'
}} /> : <VideoOff style={{
  width: '20px',
  height: '20px'
}} />}
          </button>
          
          {/* Screen Share */}
          <button
            onClick={toggleScreenShare}
            style={{
  padding: '12px',
  borderRadius: '50%',
  color: '#ffffff',
  background: 'rgba(22, 27, 34, 0.6)'
}}
            title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
          >
            {isScreenSharing ? <Monitor style={{
  width: '20px',
  height: '20px'
}} /> : <Monitor style={{
  width: '20px',
  height: '20px'
}} />}
          </button>
          
          {/* Invite */}
          {onInvite && (
            <button
              onClick={onInvite}
              style={{
  padding: '12px',
  borderRadius: '50%',
  background: 'rgba(22, 27, 34, 0.6)'
}}
              title="Invite others"
            >
              <UserPlus style={{
  width: '20px',
  height: '20px'
}} />
            </button>
          )}
          
          {/* Leave */}
          <button
            onClick={leaveVoiceChannel}
            style={{
  padding: '12px',
  borderRadius: '50%',
  color: '#ffffff'
}}
            title="Leave channel"
          >
            <PhoneOff style={{
  width: '20px',
  height: '20px'
}} />
          </button>
        </div>
        
        {/* Speaking indicator */}
        {isSpeaking && !isMuted && (
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '50%'
}}>
              <div style={{
  width: '8px',
  height: '8px',
  borderRadius: '50%'
}} />
              <span style={{
  fontWeight: '500'
}}>Speaking</span>
            </div>
          </div>
        )}
      </div>

      {/* Hidden video element for local stream */}
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        style={{
  display: 'none'
}}
      />
    </div>
  )
}



export default VoiceChannelInterface