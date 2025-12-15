import React, { useState, useEffect, useRef, memo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Phone, PhoneOff, Mic, MicOff, Video, VideoOff,
  Volume2, VolumeX, Monitor, MoreVertical, Users, MessageSquare
} from 'lucide-react'

/**
 * CallScreenPage Component
 * Full-screen video/audio call interface
 */
const CallScreenPage = () => {
  const navigate = useNavigate()
  const { callId } = useParams()
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [callStatus, setCallStatus] = useState('connecting') // connecting, active, ended
  const [participants, setParticipants] = useState([])

  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)

  useEffect(() => {
    // Initialize call
    initializeCall()

    // Call duration timer
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
      // Request media permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Mock: Set call as active after connecting
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
    // Stop all media tracks
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
    <div role="main" aria-label="Video call screen" className="fixed inset-0 bg-white z-50">
      {/* Remote Video */}
      <div className="absolute inset-0">
        {callStatus === 'active' ? (
          <video
            aria-label="Remote participant video"
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center px-4"
            >
              <div className="text-6xl md:text-8xl mb-4 md:mb-6">📞</div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {callStatus === 'connecting' ? 'Connecting...' : 'Call Ended'}
              </h2>
              <p className="text-sm md:text-base text-gray-600">
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
          className="absolute top-4 right-4 md:top-6 md:right-6 w-32 h-24 md:w-48 md:h-36 bg-gray-100 rounded-xl md:rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-300"
          drag
          dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            aria-label="Your video"
          />
          <div style={{background: "var(--bg-primary)"}} style={{color: "var(--text-primary)"}} className="absolute bottom-1 left-1 md:bottom-2 md:left-2 px-1.5 py-0.5 md:px-2 md:py-1 /60 rounded  text-[10px] md:text-xs">
            You
          </div>
        </motion.div>
      )}

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-b from-white/90 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-gray-900 text-lg md:text-xl font-semibold">
              {participants[0]?.name || 'Call'}
            </h3>
            {callStatus === 'active' && (
              <p className="text-gray-600 text-xs md:text-sm">{formatDuration(callDuration)}</p>
            )}
          </div>
          <div className="flex gap-2 md:gap-3">
            <button
              className="p-2 md:p-3 bg-white/90 hover:bg-white rounded-lg md:rounded-2xl shadow-lg backdrop-blur-sm transition-colors border border-gray-200"
              aria-label="Participants"
            >
              <Users className="w-4 h-4 md:w-5 md:h-5 text-gray-900" />
            </button>
            <button
              className="p-2 md:p-3 bg-white/90 hover:bg-white rounded-lg md:rounded-2xl shadow-lg backdrop-blur-sm transition-colors border border-gray-200"
              aria-label="More options"
            >
              <MoreVertical className="w-4 h-4 md:w-5 md:h-5 text-gray-900" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 bg-gradient-to-t from-white/95 via-white/80 to-transparent">
        <div className="max-w-2xl mx-auto flex items-center justify-center gap-3 md:gap-6">
          {/* Audio Toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleAudio}
            className={`p-4 md:p-6 rounded-full transition-all border ${
              isAudioEnabled
                ? 'bg-white hover:bg-gray-50 border-gray-300'
                : 'bg-red-500 hover:bg-red-600 border-red-600'
            }`}
            aria-label={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
            aria-pressed={!isAudioEnabled}
          >
            {isAudioEnabled ? (
              <Mic className="w-5 h-5 md:w-6 md:h-6 text-gray-900" />
            ) : (
              <MicOff style={{color: "var(--text-primary)"}} className="w-5 h-5 md:w-6 md:h-6 " />
            )}
          </motion.button>

          {/* Video Toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleVideo}
            className={`p-4 md:p-6 rounded-full transition-all border ${
              isVideoEnabled
                ? 'bg-white hover:bg-gray-50 border-gray-300'
                : 'bg-red-500 hover:bg-red-600 border-red-600'
            }`}
            aria-label={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
            aria-pressed={!isVideoEnabled}
          >
            {isVideoEnabled ? (
              <Video className="w-5 h-5 md:w-6 md:h-6 text-gray-900" />
            ) : (
              <VideoOff style={{color: "var(--text-primary)"}} className="w-5 h-5 md:w-6 md:h-6 " />
            )}
          </motion.button>

          {/* End Call */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={endCall}
            className="p-5 md:p-8 bg-red-500 hover:bg-red-600 rounded-full transition-all shadow-2xl"
            aria-label="End call"
          >
            <PhoneOff style={{color: "var(--text-primary)"}} className="w-6 h-6 md:w-7 md:h-7 " />
          </motion.button>

          {/* Screen Share */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleScreenShare}
            className={`p-4 md:p-6 rounded-full transition-all border ${
              isScreenSharing
                ? 'bg-[#58a6ff] hover:bg-[#1a6fc7] border-[#58a6ff]'
                : 'bg-white hover:bg-gray-50 border-gray-300'
            }`}
            aria-label={isScreenSharing ? 'Stop sharing' : 'Share screen'}
            aria-pressed={isScreenSharing}
          >
            <Monitor className={`w-5 h-5 md:w-6 md:h-6 ${isScreenSharing ? 'text-white' : 'text-gray-900'}`} />
          </motion.button>

          {/* Speaker Toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsSpeakerOn(prev => !prev)}
            className="p-4 md:p-6 bg-white hover:bg-gray-50 rounded-full transition-all border border-gray-300"
            aria-label={isSpeakerOn ? 'Mute speaker' : 'Unmute speaker'}
            aria-pressed={!isSpeakerOn}
          >
            {isSpeakerOn ? (
              <Volume2 className="w-5 h-5 md:w-6 md:h-6 text-gray-900" />
            ) : (
              <VolumeX className="w-5 h-5 md:w-6 md:h-6 text-gray-900" />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  )
}

export default memo(CallScreenPage)

