/**
 * VoiceMessagesPage - iOS Modern Aesthetic
 * Voice recording interface with clean iOS design patterns
 * - #FAFAFA background, #000 text, #666 secondary text, white cards
 * - No Tailwind classes, pure inline styles
 * - iOS-style shadows and border radius
 * - 52px inputs, 56px/48px buttons, 20px icons
 * - Smooth hover animations with translateY
 */

import React, { useState, useEffect, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, StopCircle, Play, Pause, Send, Trash2, Download } from 'lucide-react'
import { useResponsive } from '../hooks/useResponsive'

const VoiceMessagesPage = () => {
  const { isMobile } = useResponsive()
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackTime, setPlaybackTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState(null)

  const mediaRecorderRef = useRef(null)
  const audioRef = useRef(null)
  const timerRef = useRef(null)
  const chunksRef = useRef([])

  // Request microphone permission
  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        chunksRef.current = []

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      return true
    } catch (err) {
      setError('Microphone access denied')
      return false
    }
  }

  // Start recording
  const startRecording = async () => {
    const hasPermission = await requestMicrophonePermission()
    if (!hasPermission) return

    setAudioBlob(null)
    setRecordingTime(0)
    setError(null)

    mediaRecorderRef.current.start()
    setIsRecording(true)

    // Start timer
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1)
    }, 1000)
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      clearInterval(timerRef.current)
    }
  }

  // Play audio
  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  // Pause audio
  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  // Send voice message
  const sendVoiceMessage = async () => {
    if (!audioBlob) return

    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500))

      // Reset
      setAudioBlob(null)
      setRecordingTime(0)
      setPlaybackTime(0)
      setDuration(0)

      alert('Voice message sent!')
    } catch (err) {
      setError('Failed to send voice message')
    }
  }

  // Delete recording
  const deleteRecording = () => {
    setAudioBlob(null)
    setRecordingTime(0)
    setPlaybackTime(0)
    setDuration(0)
  }

  // Download recording
  const downloadRecording = () => {
    if (!audioBlob) return

    const url = URL.createObjectURL(audioBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `voice-message-${Date.now()}.webm`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Setup audio element listeners
  useEffect(() => {
    if (audioBlob && audioRef.current) {
      const url = URL.createObjectURL(audioBlob)
      audioRef.current.src = url

      audioRef.current.onloadedmetadata = () => {
        setDuration(Math.floor(audioRef.current.duration))
      }

      audioRef.current.ontimeupdate = () => {
        setPlaybackTime(Math.floor(audioRef.current.currentTime))
      }

      audioRef.current.onended = () => {
        setIsPlaying(false)
        setPlaybackTime(0)
      }

      return () => URL.revokeObjectURL(url)
    }
  }, [audioBlob])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current)
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  return (
    <div role="main" aria-label="Voice messages page" style={{ minHeight: '100vh', padding: isMobile ? '16px' : '24px', background: '#FAFAFA', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: '#FFFFFF',
            border: '1px solid #E0E0E0',
            borderRadius: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            color: '#FFFFFF',
            padding: isMobile ? '20px 24px' : '32px'
          }}>
            <h1 style={{ fontWeight: 600, fontSize: isMobile ? '20px' : '24px', marginBottom: isMobile ? '8px' : '12px', margin: '0 0 12px 0' }}>Voice Messages</h1>
            <p style={{ opacity: 0.9, fontSize: isMobile ? '14px' : '15px', margin: 0 }}>Record and send audio messages</p>
          </div>

          {/* Content */}
          <div style={{ padding: isMobile ? '20px 24px' : '32px' }}>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                role="alert"
                style={{
                  marginBottom: '24px',
                  padding: '16px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#EF4444',
                  borderRadius: '16px',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  fontSize: '14px'
                }}
              >
                {typeof error === 'string' ? error : 'An error occurred'}
              </motion.div>
            )}

            {/* Recording UI */}
            <div style={{ textAlign: 'center' }}>
              {!audioBlob && (
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  style={{ marginBottom: '32px' }}
                >
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <motion.button
                      onClick={isRecording ? stopRecording : startRecording}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                      style={{
                        position: 'relative',
                        width: isMobile ? '112px' : '128px',
                        height: isMobile ? '112px' : '128px',
                        borderRadius: '50%',
                        transition: 'all 0.3s',
                        background: isRecording ? '#EF4444' : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                        boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#FFFFFF'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = isRecording ? '0 12px 32px rgba(239, 68, 68, 0.4)' : '0 12px 32px rgba(99, 102, 241, 0.4)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.3)'
                      }}
                    >
                      {isRecording ? (
                        <StopCircle size={isMobile ? 56 : 64} />
                      ) : (
                        <Mic size={isMobile ? 56 : 64} />
                      )}
                    </motion.button>

                    {isRecording && (
                      <motion.div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: '50%',
                          border: '4px solid #EF4444'
                        }}
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [1, 0, 1]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity
                        }}
                      />
                    )}
                  </div>

                  <div style={{ marginTop: isMobile ? '20px' : '24px' }}>
                    <div style={{ fontWeight: 600, color: '#000000', fontSize: isMobile ? '32px' : '40px' }}>
                      {formatTime(recordingTime)}
                    </div>
                    <div style={{ color: '#666666', marginTop: isMobile ? '8px' : '12px', fontSize: isMobile ? '14px' : '15px' }}>
                      {isRecording ? 'Recording...' : 'Tap to record'}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Playback UI */}
              {audioBlob && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? '12px' : '16px',
                    padding: isMobile ? '16px' : '24px',
                    background: '#FAFAFA',
                    border: '1px solid #E0E0E0',
                    borderRadius: '16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}>
                    <button
                      onClick={isPlaying ? pauseAudio : playAudio}
                      aria-label={isPlaying ? 'Pause' : 'Play'}
                      style={{
                        padding: isMobile ? '12px' : '16px',
                        background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                        color: '#FFFFFF',
                        borderRadius: '50%',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        border: 'none',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      {isPlaying ? (
                        <Pause size={20} />
                      ) : (
                        <Play size={20} />
                      )}
                    </button>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isMobile ? '12px' : '13px', color: '#666666', marginBottom: '8px' }}>
                        <span>{formatTime(playbackTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                      <div style={{ height: '8px', background: '#E0E0E0', borderRadius: '4px', overflow: 'hidden' }}>
                        <motion.div
                          style={{
                            height: '100%',
                            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                            width: `${(playbackTime / duration) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: isMobile ? '8px' : '16px' }}>
                    <button
                      onClick={deleteRecording}
                      aria-label="Delete recording"
                      style={{
                        padding: isMobile ? '12px' : '16px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#EF4444',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '14px',
                        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.08)',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: isMobile ? '4px' : '8px',
                        fontSize: isMobile ? '12px' : '14px',
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.15)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.08)'
                      }}
                    >
                      <Trash2 size={20} />
                      <span>Delete</span>
                    </button>

                    <button
                      onClick={downloadRecording}
                      aria-label="Download recording"
                      style={{
                        padding: isMobile ? '12px' : '16px',
                        background: '#FAFAFA',
                        border: '1px solid #E0E0E0',
                        color: '#000000',
                        borderRadius: '14px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: isMobile ? '4px' : '8px',
                        fontSize: isMobile ? '12px' : '14px',
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#F0F0F0'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#FAFAFA'
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'
                      }}
                    >
                      <Download size={20} />
                      <span>Download</span>
                    </button>

                    <button
                      onClick={sendVoiceMessage}
                      aria-label="Send voice message"
                      style={{
                        padding: isMobile ? '12px' : '16px',
                        background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                        color: '#FFFFFF',
                        borderRadius: '14px',
                        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.2)',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: isMobile ? '4px' : '8px',
                        fontSize: isMobile ? '12px' : '14px',
                        fontWeight: 500,
                        border: 'none',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.2)'
                      }}
                    >
                      <Send size={20} />
                      <span>Send</span>
                    </button>
                  </div>
                </motion.div>
              )}

              <audio ref={audioRef} style={{ display: 'none' }} />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default memo(VoiceMessagesPage)
