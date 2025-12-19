/**
 * CallScreenPage - Full-screen video/audio call interface
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
 */

import React, { useState, useEffect, useRef, memo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Phone, PhoneOff, Mic, MicOff, Video, VideoOff,
  Volume2, VolumeX, Monitor, MoreVertical, Users, MessageSquare
} from 'lucide-react'

const CallScreenPage = () => {
  const navigate = useNavigate()
  const { callId } = useParams()
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [callStatus, setCallStatus] = useState('connecting')
  const [participants, setParticipants] = useState([])

  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)

  useEffect(() => {
    initializeCall()

    const timer = setInterval(() => {
      if (callStatus === 'active') {
        setCallDuration(prev => prev + 1)
      }
    }, 1000)

    return () => {
      clearInterval(timer)
      cleanupCall()
    }
  }, [callStatus])

  const initializeCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      setTimeout(() => {
        setCallStatus('active')
        setParticipants([
          { id: 1, name: 'John Doe', avatar: '🧑', isMuted: false, isVideoOff: false }
        ])
      }, 2000)
    } catch (err) {
      console.error('Failed to get media devices:', err)
    }
  }

  const cleanupCall = () => {
    if (localVideoRef.current?.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach(track => track.stop())
    }
  }

  const toggleVideo = () => {
    setIsVideoEnabled(prev => !prev)
    if (localVideoRef.current?.srcObject) {
      const videoTrack = localVideoRef.current.srcObject.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled
      }
    }
  }

  const toggleAudio = () => {
    setIsAudioEnabled(prev => !prev)
    if (localVideoRef.current?.srcObject) {
      const audioTrack = localVideoRef.current.srcObject.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled
      }
    }
  }

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        })
        setIsScreenSharing(true)

        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false)
        }
      } catch (err) {
        console.error('Screen sharing failed:', err)
      }
    } else {
      setIsScreenSharing(false)
    }
  }

  const endCall = () => {
    setCallStatus('ended')
    cleanupCall()
    setTimeout(() => {
      navigate('/messages')
    }, 1000)
  }

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div role="main" aria-label="Video call screen" style={{
      position: 'fixed',
      inset: 0,
      background: '#FAFAFA',
      zIndex: 50
    }}>
      {/* Remote Video */}
      <div style={{ position: 'absolute', inset: 0 }}>
        {callStatus === 'active' ? (
          <video
            aria-label="Remote participant video"
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: 'center', padding: '0 16px' }}
            >
              <div style={{ fontSize: '64px', marginBottom: '24px' }}>📞</div>
              <h2 style={{ fontSize: '28px', fontWeight: '600', color: '#000', marginBottom: '8px' }}>
                {callStatus === 'connecting' ? 'Connecting...' : 'Call Ended'}
              </h2>
              <p style={{ fontSize: '14px', color: '#666' }}>
                {callStatus === 'connecting' ? 'Please wait' : 'Thank you for calling'}
              </p>
            </motion.div>
          </div>
        )}
      </div>

      {/* Local Video (Picture-in-Picture) */}
      {isVideoEnabled && callStatus === 'active' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            width: '192px',
            height: '144px',
            background: '#FAFAFA',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            border: '2px solid #fff'
          }}
          drag
          dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            aria-label="Your video"
          />
          <div style={{
            position: 'absolute',
            bottom: '8px',
            left: '8px',
            padding: '4px 8px',
            background: 'rgba(0,0,0,0.6)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '12px'
          }}>
            You
          </div>
        </motion.div>
      )}

      {/* Top Bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '24px',
        background: 'linear-gradient(to bottom, rgba(255,255,255,0.9), transparent)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ color: '#000', fontSize: '20px', fontWeight: '600' }}>
              {participants[0]?.name || 'Call'}
            </h3>
            {callStatus === 'active' && (
              <p style={{ color: '#666', fontSize: '14px' }}>{formatDuration(callDuration)}</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              style={{
                padding: '12px',
                background: 'rgba(255,255,255,0.9)',
                borderRadius: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'transform 0.2s ease',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              aria-label="Participants"
            >
              <Users size={20} style={{ color: '#000' }} />
            </button>
            <button
              style={{
                padding: '12px',
                background: 'rgba(255,255,255,0.9)',
                borderRadius: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'transform 0.2s ease',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              aria-label="More options"
            >
              <MoreVertical size={20} style={{ color: '#000' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '32px',
        background: 'linear-gradient(to top, rgba(255,255,255,0.95), rgba(255,255,255,0.8), transparent)'
      }}>
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px'
        }}>
          {/* Audio Toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleAudio}
            style={{
              padding: '24px',
              borderRadius: '50%',
              transition: 'all 0.2s ease',
              border: 'none',
              cursor: 'pointer',
              background: isAudioEnabled ? '#fff' : '#ef4444',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
            aria-label={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
            aria-pressed={!isAudioEnabled}
          >
            {isAudioEnabled ? (
              <Mic size={20} style={{ color: '#000' }} />
            ) : (
              <MicOff size={20} style={{ color: '#fff' }} />
            )}
          </motion.button>

          {/* Video Toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleVideo}
            style={{
              padding: '24px',
              borderRadius: '50%',
              transition: 'all 0.2s ease',
              border: 'none',
              cursor: 'pointer',
              background: isVideoEnabled ? '#fff' : '#ef4444',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
            aria-label={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
            aria-pressed={!isVideoEnabled}
          >
            {isVideoEnabled ? (
              <Video size={20} style={{ color: '#000' }} />
            ) : (
              <VideoOff size={20} style={{ color: '#fff' }} />
            )}
          </motion.button>

          {/* End Call */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={endCall}
            style={{
              padding: '32px',
              background: '#ef4444',
              borderRadius: '50%',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              border: 'none',
              cursor: 'pointer'
            }}
            aria-label="End call"
          >
            <PhoneOff size={20} style={{ color: '#fff' }} />
          </motion.button>

          {/* Screen Share */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleScreenShare}
            style={{
              padding: '24px',
              borderRadius: '50%',
              transition: 'all 0.2s ease',
              border: 'none',
              cursor: 'pointer',
              background: isScreenSharing ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' : '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
            aria-label={isScreenSharing ? 'Stop sharing' : 'Share screen'}
            aria-pressed={isScreenSharing}
          >
            <Monitor size={20} style={{ color: isScreenSharing ? '#fff' : '#000' }} />
          </motion.button>

          {/* Speaker Toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsSpeakerOn(prev => !prev)}
            style={{
              padding: '24px',
              background: '#fff',
              borderRadius: '50%',
              transition: 'all 0.2s ease',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
            aria-label={isSpeakerOn ? 'Mute speaker' : 'Unmute speaker'}
            aria-pressed={!isSpeakerOn}
          >
            {isSpeakerOn ? (
              <Volume2 size={20} style={{ color: '#000' }} />
            ) : (
              <VolumeX size={20} style={{ color: '#000' }} />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  )
}

export default memo(CallScreenPage)
