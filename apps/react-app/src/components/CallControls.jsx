import React, { useState, useEffect } from 'react'
import { 
  Phone, 
  PhoneCall, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Monitor, 
  MonitorOff,
  PhoneOff,
  Settings,
  Users,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Camera,
  CameraOff,
  Headphones,
  Speaker
} from 'lucide-react'
import CallQualityIndicator from './CallQualityIndicator'
import CallTimer from './CallTimer'

function CallControls({ 
  isInCall = false, 
  callType = null, // 'voice' | 'video' | null
  onStartVoiceCall,
  onStartVideoCall,
  onEndCall,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onToggleCamera,
  onToggleSpeaker,
  isMuted = false,
  isVideoEnabled = true,
  isScreenSharing = false,
  isCameraEnabled = true,
  isSpeakerEnabled = true,
  participants = [],
  showInHeader = false,
  connectionQuality = 'good',
  callStartTime = null,
  isRecording = false,
  onToggleRecording,
  showAdvancedControls = false,
  isMinimized = false,
  onToggleMinimize
}) {
  const [showParticipants, setShowParticipants] = useState(false)
  const [volume, setVolume] = useState(100)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [audioDevice, setAudioDevice] = useState('default')
  const [videoDevice, setVideoDevice] = useState('default')
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // Audio level visualization
  const [audioLevel, setAudioLevel] = useState(0)
  
  useEffect(() => {
    if (isInCall && !isMuted) {
      // Simulate audio level changes
      const interval = setInterval(() => {
        setAudioLevel(Math.random() * 100)
      }, 100)
      return () => clearInterval(interval)
    } else {
      setAudioLevel(0)
    }
  }, [isInCall, isMuted])
  
  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  if (showInHeader) {
    // Compact version for chat header
    return (
      <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
        {!isInCall ? (
          <>
            <button
              onClick={onStartVoiceCall}
              style={{
  padding: '8px',
  color: '#ffffff',
  borderRadius: '12px'
}}
              title="Start voice call"
            >
              <Phone size={18} />
            </button>
            <button
              onClick={onStartVideoCall}
              style={{
  padding: '8px',
  color: '#ffffff',
  borderRadius: '12px'
}}
              title="Start video call"
            >
              <Video size={18} />
            </button>
            <button
              onClick={() => onToggleScreenShare?.()}
              style={{
  padding: '8px',
  color: '#ffffff',
  borderRadius: '12px'
}}
              title="Share screen"
            >
              <Monitor size={18} />
            </button>
          </>
        ) : (
          <div style={{
  display: 'flex',
  alignItems: 'center'
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
}}></div>
              <span style={{
  fontWeight: '500'
}}>
                {callType === 'video' ? 'Video call' : 'Voice call'} - {participants.length} participant{participants.length !== 1 ? 's' : ''}
              </span>
            </div>
            <CallTimer compact={true} isActive={isInCall} startTime={callStartTime} />
            <CallQualityIndicator compact={true} connectionQuality={connectionQuality} />
          </div>
        )}
      </div>
    )
  }

  if (!isInCall) {
    // Call initiation buttons
    return (
      <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
        <button
          onClick={onStartVoiceCall}
          style={{
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}
        >
          <Phone size={18} />
          <span style={{
  fontWeight: '500'
}}>Voice Call</span>
        </button>
        
        <button
          onClick={onStartVideoCall}
          style={{
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}
        >
          <Video size={18} />
          <span style={{
  fontWeight: '500'
}}>Video Call</span>
        </button>
        
        <button
          onClick={() => onToggleScreenShare?.()}
          style={{
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}
        >
          <Monitor size={18} />
          <span style={{
  fontWeight: '500'
}}>Share Screen</span>
        </button>
      </div>
    )
  }

  // Full call controls when in a call
  return (
    <div style={{
  position: 'fixed'
}}>
      <div style={{
  background: 'rgba(22, 27, 34, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  overflow: 'hidden'
}}>
        {/* Header with call info and minimize */}
        <div style={{
  padding: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <div style={{
  width: '8px',
  height: '8px',
  borderRadius: '50%'
}}></div>
              <span style={{
  color: '#ffffff',
  fontWeight: '500'
}}>Connected</span>
            </div>
            <CallTimer compact={true} isActive={isInCall} startTime={callStartTime} isRecording={isRecording} />
            <CallQualityIndicator compact={true} connectionQuality={connectionQuality} />
          </div>
          <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
            <button
              onClick={onToggleMinimize}
              style={{
  padding: '4px'
}}
              title={isMinimized ? 'Expand' : 'Minimize'}
            >
              {isMinimized ? <Maximize2 size={14} style={{
  color: '#ffffff'
}} /> : <Minimize2 size={14} style={{
  color: '#ffffff'
}} />}
            </button>
          </div>
        </div>
        
        <div style={{
  padding: '16px'
}}>
        <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
          {/* Mute Control with Audio Level */}
          <div style={{
  position: 'relative'
}}>
            <button
              onClick={onToggleMute}
              style={{
  padding: '16px',
  borderRadius: '50%',
  position: 'relative',
  overflow: 'hidden',
  color: '#ffffff'
}}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              
              {/* Audio level indicator */}
              {!isMuted && audioLevel > 0 && (
                <div 
                  style={{
  position: 'absolute'
}}
                  style={{ height: `${(audioLevel / 100) * 100}%` }}
                />
              )}
            </button>
            
            {/* Microphone status tooltip */}
            <div style={{
  position: 'absolute'
}}>
              <div style={{
  background: 'rgba(22, 27, 34, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '4px',
  paddingBottom: '4px',
  color: '#ffffff'
}}>
                {isMuted ? 'Click to unmute' : 'Click to mute'}
              </div>
            </div>
          </div>

          {/* Video Control (only for video calls) */}
          {callType === 'video' && (
            <div style={{
  position: 'relative'
}}>
              <button
                onClick={onToggleVideo}
                style={{
  padding: '16px',
  borderRadius: '50%',
  color: '#ffffff'
}}
                title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
              >
                {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
              </button>
              
              {/* Camera dropdown */}
              <div style={{
  position: 'absolute'
}}>
                <div style={{
  background: 'rgba(22, 27, 34, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '4px',
  paddingBottom: '4px',
  color: '#ffffff'
}}>
                  {isVideoEnabled ? 'Camera on' : 'Camera off'}
                </div>
              </div>
            </div>
          )}

          {/* Screen Share Control */}
          <div style={{
  position: 'relative'
}}>
            <button
              onClick={onToggleScreenShare}
              style={{
  padding: '16px',
  borderRadius: '50%',
  color: '#ffffff'
}}
              title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
            >
              {isScreenSharing ? <MonitorOff size={24} /> : <Monitor size={24} />}
            </button>
            
            <div style={{
  position: 'absolute'
}}>
              <div style={{
  background: 'rgba(22, 27, 34, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '4px',
  paddingBottom: '4px',
  color: '#ffffff'
}}>
                {isScreenSharing ? 'Stop screen share' : 'Share your screen'}
              </div>
            </div>
          </div>

          {/* End Call */}
          <div style={{
  position: 'relative'
}}>
            <button
              onClick={onEndCall}
              style={{
  padding: '16px',
  borderRadius: '50%',
  color: '#ffffff'
}}
              title="End call"
            >
              <PhoneOff size={24} />
            </button>
            
            <div style={{
  position: 'absolute'
}}>
              <div style={{
  background: 'rgba(22, 27, 34, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '4px',
  paddingBottom: '4px',
  color: '#ffffff'
}}>
                End call for everyone
              </div>
            </div>
          </div>
        </div>
        
        {/* Secondary Controls Row */}
        <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
          {/* More Controls Button */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
  padding: '12px',
  borderRadius: '50%',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: '#ffffff'
}}
            title="More options"
          >
            <MoreHorizontal size={18} />
          </button>
          
          {/* Participants Toggle */}
          <div style={{
  position: 'relative'
}}>
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              style={{
  padding: '12px',
  borderRadius: '50%',
  position: 'relative',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: '#ffffff'
}}
              title="Participants"
            >
              <Users size={18} />
              {participants.length > 1 && (
                <span style={{
  position: 'absolute',
  color: '#ffffff',
  fontWeight: 'bold',
  borderRadius: '50%',
  width: '20px',
  height: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                  {participants.length}
                </span>
              )}
            </button>

            {/* Participants List */}
            {showParticipants && (
              <div style={{
  position: 'absolute',
  width: '256px'
}}>
                <div style={{
  background: 'rgba(22, 27, 34, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  overflow: 'hidden'
}}>
                  <div style={{
  padding: '12px'
}}>
                    <h4 style={{
  fontWeight: '500',
  color: '#ffffff'
}}>
                      Participants ({participants.length})
                    </h4>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {participants.map((participant) => (
                      <div key={participant.id} style={{
  display: 'flex',
  alignItems: 'center',
  padding: '12px'
}}>
                        <div style={{
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ffffff',
  fontWeight: 'bold'
}}>
                          {participant.avatar}
                        </div>
                        <div style={{
  flex: '1'
}}>
                          <div style={{
  fontWeight: '500',
  color: '#ffffff'
}}>{participant.username}</div>
                          <div style={{
  display: 'flex',
  alignItems: 'center',
  color: '#ffffff'
}}>
                            {participant.isMuted && <MicOff size={12} />}
                            {!participant.isVideoEnabled && callType === 'video' && <VideoOff size={12} />}
                            {participant.isScreenSharing && <Monitor size={12} />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Fullscreen Toggle */}
          <button
            onClick={handleFullscreenToggle}
            style={{
  padding: '12px',
  borderRadius: '50%',
  color: '#ffffff',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
        
        {/* Advanced Controls (Expandable) */}
        {showAdvanced && (
          <div style={{
  padding: '12px',
  borderRadius: '12px'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
              {/* Recording Control */}
              {onToggleRecording && (
                <button
                  onClick={onToggleRecording}
                  style={{
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: '#ffffff'
}}
                  title={isRecording ? 'Stop recording' : 'Start recording'}
                >
                  {isRecording ? (
                    <div style={{
  width: '8px',
  height: '8px',
  borderRadius: '50%'
}} />
                  ) : (
                    <div style={{
  width: '8px',
  height: '8px',
  borderRadius: '50%'
}} />
                  )}
                  <span className="text-xs">{isRecording ? 'Recording' : 'Record'}</span>
                </button>
              )}
              
              {/* Speaker Toggle */}
              {onToggleSpeaker && (
                <button
                  onClick={onToggleSpeaker}
                  style={{
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '12px',
  color: '#ffffff',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}
                  title="Toggle speaker"
                >
                  {isSpeakerEnabled ? <Speaker size={16} /> : <Headphones size={16} />}
                  <span className="text-xs">{isSpeakerEnabled ? 'Speaker' : 'Headphones'}</span>
                </button>
              )}
            </div>
            
            {/* Volume Control */}
            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <VolumeX size={14} style={{
  color: '#ffffff'
}} />
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                style={{
  flex: '1',
  height: '8px',
  borderRadius: '12px'
}}
                style={{
                  background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${volume}%, rgba(255,255,255,0.2) ${volume}%, rgba(255,255,255,0.2) 100%)`
                }}
              />
              <Volume2 size={14} style={{
  color: '#ffffff'
}} />
              <span style={{
  color: '#ffffff',
  width: '32px'
}}>{volume}%</span>
            </div>
          </div>
        )}

        {/* Call Info */}
        <div style={{
  textAlign: 'center'
}}>
          <div style={{
  color: '#ffffff',
  fontWeight: '500'
}}>
            {callType === 'video' ? 'Video Call' : 'Voice Call'}
          </div>
          <div style={{
  color: '#ffffff'
}}>
            {participants.length} participant{participants.length !== 1 ? 's' : ''}
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}



export default CallControls