import React, { useState, useEffect, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, StopCircle, Play, Pause, Send, Trash2, Download } from 'lucide-react'
import { useResponsive } from '../hooks/useResponsive'

/**
 * VoiceMessagesPage Component
 * UI for recording, playing, and sending voice messages
 */
const VoiceMessagesPage = () => {
  const { isMobile, isTablet, spacing, fontSize, padding, containerMaxWidth } = useResponsive()
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
    <div className="min-h-screen p-4 md:p-6 bg-white" role="main" aria-label="Voice messages page">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 rounded-3xl shadow-lg overflow-hidden"
        >
          {/* Header */}
          <div style={{color: "var(--text-primary)"}} className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7]  p-5 md:p-8">
            <h1 className="font-bold text-xl md:text-2xl mb-2 md:mb-3">Voice Messages</h1>
            <p className="opacity-90 text-sm md:text-base">Record and send audio messages</p>
          </div>

          {/* Content */}
          <div className="p-5 md:p-8">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl shadow-md border border-red-200"
                role="alert"
              >
                {typeof error === 'string' ? error : 'An error occurred'}
              </motion.div>
            )}

            {/* Recording UI */}
            <div className="text-center">
              {!audioBlob && (
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="mb-8"
                >
                  <div className="relative inline-block">
                    <motion.button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`relative w-28 h-28 md:w-32 md:h-32 rounded-full transition-all ${
                        isRecording
                          ? 'bg-red-500 hover:bg-red-600'
                          : 'bg-gradient-to-br from-[#58a6ff] to-[#a371f7] hover:opacity-90'
                      } shadow-2xl flex items-center justify-center`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                    >
                      {isRecording ? (
                        <StopCircle style={{color: "var(--text-primary)"}} className="w-14 h-14 md:w-16 md:h-16 " />
                      ) : (
                        <Mic style={{color: "var(--text-primary)"}} className="w-14 h-14 md:w-16 md:h-16 " />
                      )}
                    </motion.button>

                    {isRecording && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-4 border-red-500"
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

                  <div className="mt-5 md:mt-6">
                    <div className="font-bold text-gray-900 text-3xl md:text-4xl">
                      {formatTime(recordingTime)}
                    </div>
                    <div className="text-gray-600 mt-2 md:mt-3 text-sm md:text-base">
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
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3 md:gap-4 p-4 md:p-6 bg-gray-50 border border-gray-200 rounded-2xl shadow-md">
                    <button
                      onClick={isPlaying ? pauseAudio : playAudio}
                      style={{color: "var(--text-primary)"}} className="p-3 md:p-4 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] hover:opacity-90 rounded-full  transition-all flex-shrink-0"
                      aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? (
                        <Pause style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                      ) : (
                        <Play style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-xs md:text-sm text-gray-600 mb-2">
                        <span>{formatTime(playbackTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-[#58a6ff] to-[#a371f7]"
                          style={{ width: `${(playbackTime / duration) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-2 md:gap-4">
                    <button
                      onClick={deleteRecording}
                      className="p-3 md:p-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-2xl shadow-md transition-colors flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 text-xs md:text-sm"
                      aria-label="Delete recording"
                    >
                      <Trash2 style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                      <span>Delete</span>
                    </button>

                    <button
                      onClick={downloadRecording}
                      className="p-3 md:p-4 bg-gray-100 border border-gray-200 hover:bg-gray-200 text-gray-900 rounded-2xl shadow-md transition-colors flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 text-xs md:text-sm"
                      aria-label="Download recording"
                    >
                      <Download style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                      <span>Download</span>
                    </button>

                    <button
                      onClick={sendVoiceMessage}
                      style={{color: "var(--text-primary)"}} className="p-3 md:p-4 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] hover:opacity-90  rounded-2xl shadow-lg transition-all flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 text-xs md:text-sm font-medium"
                      aria-label="Send voice message"
                    >
                      <Send style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                      <span>Send</span>
                    </button>
                  </div>
                </motion.div>
              )}

              <audio ref={audioRef} className="hidden" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default memo(VoiceMessagesPage)

