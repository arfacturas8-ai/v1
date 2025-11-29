/**
 * Comprehensive Recording Manager for CRYB Platform
 * Handles voice/video recording with cloud storage integration and enterprise features
 * Supports multiple formats, real-time transcription, and AI-powered features
 */

class RecordingManager {
  constructor() {
    this.recordings = new Map()
    this.activeRecordings = new Map()
    this.uploadQueue = []
    this.isProcessingUploads = false
    
    // Recording configurations
    this.recordingConfigs = {
      'audio-only': {
        audio: {
          codec: 'opus',
          bitrate: 128000,
          sampleRate: 48000,
          channels: 2,
          mimeType: 'audio/webm;codecs=opus'
        },
        video: false,
        format: 'webm',
        fileExtension: 'webm'
      },
      'video-hd': {
        audio: {
          codec: 'opus',
          bitrate: 128000,
          sampleRate: 48000,
          channels: 2
        },
        video: {
          codec: 'h264',
          width: 1280,
          height: 720,
          frameRate: 30,
          bitrate: 2500000
        },
        mimeType: 'video/webm;codecs=h264,opus',
        format: 'webm',
        fileExtension: 'webm'
      },
      'video-4k': {
        audio: {
          codec: 'opus',
          bitrate: 256000,
          sampleRate: 48000,
          channels: 2
        },
        video: {
          codec: 'h264',
          width: 3840,
          height: 2160,
          frameRate: 30,
          bitrate: 8000000
        },
        mimeType: 'video/webm;codecs=h264,opus',
        format: 'webm',
        fileExtension: 'webm'
      },
      'screen-share': {
        audio: {
          codec: 'opus',
          bitrate: 128000,
          sampleRate: 48000,
          channels: 2
        },
        video: {
          codec: 'vp9',
          width: 1920,
          height: 1080,
          frameRate: 15,
          bitrate: 3000000
        },
        mimeType: 'video/webm;codecs=vp9,opus',
        format: 'webm',
        fileExtension: 'webm'
      }
    }
    
    // Cloud storage configuration
    this.cloudConfig = {
      provider: 'aws-s3', // aws-s3, gcp-storage, azure-blob
      bucket: import.meta.env.VITE_RECORDING_BUCKET || 'cryb-recordings',
      region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
      endpoint: import.meta.env.VITE_S3_ENDPOINT,
      accessKey: import.meta.env.VITE_S3_ACCESS_KEY,
      secretKey: import.meta.env.VITE_S3_SECRET_KEY,
      encryption: true,
      retention: {
        default: 30, // days
        premium: 365, // days
        legal: 2555 // 7 years
      }
    }
    
    // Transcription configuration
    this.transcriptionConfig = {
      enabled: true,
      provider: 'aws-transcribe', // aws-transcribe, google-speech, azure-speech
      language: 'en-US',
      realTime: true,
      speakerIdentification: true,
      confidenceThreshold: 0.8,
      profanityFilter: false,
      vocabularyFilter: []
    }
    
    // AI features
    this.aiFeatures = {
      summaryGeneration: true,
      sentimentAnalysis: true,
      topicDetection: true,
      actionItemExtraction: true,
      keyMomentsDetection: true,
      speakerAnalysis: true
    }
    
    // Recording state
    this.webrtcService = null
    this.currentRecordingId = null
    this.recordingStartTime = null
    this.recordingPaused = false
    this.totalRecordingTime = 0
    
    // Real-time features
    this.realTimeTranscription = new Map() // recordingId -> transcription data
    this.liveStream = null
    this.recordingAnalytics = new Map()
    
    // Batch processing
    this.processingQueue = []
    this.maxConcurrentProcessing = 3
    this.currentProcessingJobs = 0
    
    this.initialize()
  }

  async initialize() {
    // Set up cloud storage client
    await this.initializeCloudStorage()
    
    // Set up transcription service
    await this.initializeTranscriptionService()
    
    // Set up periodic cleanup
    this.setupPeriodicCleanup()
    
  }

  async initializeCloudStorage() {
    try {
      // Initialize cloud storage SDK based on provider
      switch (this.cloudConfig.provider) {
        case 'aws-s3':
          if (typeof window !== 'undefined' && window.AWS) {
            this.cloudClient = new window.AWS.S3({
              accessKeyId: this.cloudConfig.accessKey,
              secretAccessKey: this.cloudConfig.secretKey,
              region: this.cloudConfig.region,
              endpoint: this.cloudConfig.endpoint
            })
          }
          break
        // Add other providers as needed
      }
      
    } catch (error) {
      console.error('Failed to initialize cloud storage:', error)
    }
  }

  async initializeTranscriptionService() {
    try {
      // Initialize transcription service
      if (this.transcriptionConfig.enabled) {
        // Set up real-time transcription if supported
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          this.speechRecognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)()
          this.speechRecognition.continuous = true
          this.speechRecognition.interimResults = true
          this.speechRecognition.lang = this.transcriptionConfig.language
        }
        
      }
    } catch (error) {
      console.error('Failed to initialize transcription service:', error)
    }
  }

  setupPeriodicCleanup() {
    // Clean up old temporary files every hour
    setInterval(() => {
      this.cleanupOldFiles()
    }, 3600000) // 1 hour
    
    // Process upload queue every 10 seconds
    setInterval(() => {
      this.processUploadQueue()
    }, 10000)
  }

  // Recording control methods
  async startRecording(options = {}) {
    const {
      config = 'audio-only',
      participants = [],
      metadata = {},
      channelId,
      userId,
      roomLayout = 'grid',
      enableTranscription = true,
      enableAI = true,
      customConfig = null
    } = options

    try {
      // Generate unique recording ID
      const recordingId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Use custom config or predefined config
      const recordingConfig = customConfig || this.recordingConfigs[config]
      if (!recordingConfig) {
        throw new Error(`Unknown recording configuration: ${config}`)
      }

      // Create recording session
      const recording = {
        id: recordingId,
        status: 'starting',
        config: recordingConfig,
        metadata: {
          ...metadata,
          channelId,
          userId,
          participants: participants.map(p => ({
            id: p.id,
            name: p.name,
            joinedAt: Date.now()
          })),
          roomLayout,
          startTime: Date.now(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        chunks: [],
        duration: 0,
        fileSize: 0,
        transcription: enableTranscription ? {
          enabled: true,
          segments: [],
          speakers: new Map(),
          confidence: 0,
          language: this.transcriptionConfig.language
        } : null,
        ai: enableAI ? {
          enabled: true,
          summary: null,
          topics: [],
          sentiment: null,
          keyMoments: [],
          actionItems: []
        } : null,
        analytics: {
          participantStats: new Map(),
          qualityMetrics: [],
          networkStats: []
        }
      }

      // Store recording
      this.recordings.set(recordingId, recording)
      this.activeRecordings.set(recordingId, {
        mediaRecorder: null,
        transcriptionActive: false,
        analyticsTimer: null
      })

      // Start media recording
      await this.startMediaRecording(recordingId)
      
      // Start real-time transcription if enabled
      if (enableTranscription) {
        await this.startRealTimeTranscription(recordingId)
      }
      
      // Start analytics collection
      this.startRecordingAnalytics(recordingId)
      
      // Update global state
      this.currentRecordingId = recordingId
      this.recordingStartTime = Date.now()
      this.recordingPaused = false
      
      // Update recording status
      recording.status = 'recording'
      
      this.emit('recording_started', { recordingId, recording })
      
      return recordingId
      
    } catch (error) {
      console.error('Failed to start recording:', error)
      throw error
    }
  }

  async startMediaRecording(recordingId) {
    const recording = this.recordings.get(recordingId)
    const activeRecording = this.activeRecordings.get(recordingId)
    
    if (!recording || !activeRecording) {
      throw new Error('Recording not found')
    }

    // Get media streams from WebRTC service
    const mediaStreams = await this.getRecordingStreams(recording.config)
    
    // Configure MediaRecorder
    const mediaRecorder = new MediaRecorder(mediaStreams.combined, {
      mimeType: recording.config.mimeType,
      audioBitsPerSecond: recording.config.audio?.bitrate,
      videoBitsPerSecond: recording.config.video?.bitrate
    })

    // Handle data available
    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recording.chunks.push(event.data)
        recording.fileSize += event.data.size
        
        // Update analytics
        this.updateRecordingAnalytics(recordingId, {
          chunkSize: event.data.size,
          timestamp: Date.now()
        })
      }
    }

    // Handle recording stop
    mediaRecorder.onstop = () => {
      this.handleRecordingStop(recordingId)
    }

    // Handle errors
    mediaRecorder.onerror = (error) => {
      console.error('MediaRecorder error:', error)
      this.handleRecordingError(recordingId, error)
    }

    // Start recording with time slice for real-time processing
    mediaRecorder.start(1000) // 1 second chunks
    
    activeRecording.mediaRecorder = mediaRecorder
  }

  async getRecordingStreams(config) {
    if (!this.webrtcService) {
      throw new Error('WebRTC service not available')
    }

    const streams = {
      audio: null,
      video: null,
      screen: null,
      combined: null
    }

    // Get audio stream
    if (config.audio) {
      const audioTrack = this.webrtcService.localParticipant?.audioTracks.values().next().value?.track
      if (audioTrack) {
        streams.audio = new MediaStream([audioTrack.mediaStreamTrack])
      }
    }

    // Get video stream
    if (config.video) {
      const videoTrack = this.webrtcService.localParticipant?.videoTracks.values().next().value?.track
      if (videoTrack) {
        streams.video = new MediaStream([videoTrack.mediaStreamTrack])
      }
    }

    // Combine streams
    const combinedTracks = []
    if (streams.audio) {
      combinedTracks.push(...streams.audio.getAudioTracks())
    }
    if (streams.video) {
      combinedTracks.push(...streams.video.getVideoTracks())
    }

    streams.combined = new MediaStream(combinedTracks)
    
    return streams
  }

  async startRealTimeTranscription(recordingId) {
    if (!this.speechRecognition || !this.transcriptionConfig.enabled) {
      return
    }

    const recording = this.recordings.get(recordingId)
    const activeRecording = this.activeRecordings.get(recordingId)
    
    if (!recording || !activeRecording) return

    try {
      this.speechRecognition.onresult = (event) => {
        this.handleTranscriptionResult(recordingId, event)
      }

      this.speechRecognition.onerror = (error) => {
      }

      this.speechRecognition.start()
      activeRecording.transcriptionActive = true
      
    } catch (error) {
      console.error('Failed to start real-time transcription:', error)
    }
  }

  handleTranscriptionResult(recordingId, event) {
    const recording = this.recordings.get(recordingId)
    if (!recording || !recording.transcription) return

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i]
      const transcript = result[0].transcript
      const confidence = result[0].confidence
      const isFinal = result.isFinal

      if (isFinal && confidence >= this.transcriptionConfig.confidenceThreshold) {
        const segmentTimestamp = Date.now()
        const previousSegment = recording.transcription.segments[recording.transcription.segments.length - 1]

        // Calculate segment duration based on time since last segment
        // Estimate duration based on character count and average speaking rate (150 words/min)
        const estimatedDuration = this.estimateSegmentDuration(transcript)

        // Identify speaker based on audio context and participant info
        const speakerId = this.identifySpeaker(recording, segmentTimestamp)

        // Add to transcription segments
        recording.transcription.segments.push({
          text: transcript,
          confidence,
          timestamp: segmentTimestamp,
          speaker: speakerId,
          duration: estimatedDuration,
          wordCount: transcript.split(/\s+/).length
        })

        // Update overall confidence
        recording.transcription.confidence = this.calculateAverageConfidence(recording.transcription.segments)

        // Emit real-time transcription event
        this.emit('transcription_update', {
          recordingId,
          segment: transcript,
          confidence,
          timestamp: segmentTimestamp,
          speaker: speakerId,
          duration: estimatedDuration
        })
      }
    }
  }

  calculateAverageConfidence(segments) {
    if (segments.length === 0) return 0
    const sum = segments.reduce((acc, segment) => acc + segment.confidence, 0)
    return sum / segments.length
  }

  /**
   * Estimate segment duration based on transcript content
   * Uses average speaking rate of ~150 words per minute
   * @param {string} transcript - The transcribed text
   * @returns {number} - Estimated duration in milliseconds
   */
  estimateSegmentDuration(transcript) {
    if (!transcript || transcript.trim().length === 0) return 0

    // Count words in transcript
    const wordCount = transcript.trim().split(/\s+/).length

    // Average speaking rate: 150 words per minute (2.5 words per second)
    const wordsPerSecond = 2.5
    const durationSeconds = wordCount / wordsPerSecond

    // Convert to milliseconds and add small buffer for natural pauses
    return Math.round(durationSeconds * 1000 * 1.1) // 10% buffer for pauses
  }

  /**
   * Identify speaker based on recording context and participant information
   * In multi-participant recordings, uses WebRTC track info to identify speakers
   * @param {Object} recording - The recording object
   * @param {number} timestamp - Current timestamp
   * @returns {string} - Speaker identifier
   */
  identifySpeaker(recording, timestamp) {
    try {
      // If WebRTC service is available, try to identify active speaker
      if (this.webrtcService) {
        const participants = this.webrtcService.getParticipants?.()

        if (participants && participants.length > 0) {
          // Get the participant who is currently speaking (active audio track)
          const activeSpeaker = participants.find(p => p.isAudioActive || p.isSpeaking)

          if (activeSpeaker) {
            return activeSpeaker.id || activeSpeaker.userId || activeSpeaker.name || 'unknown'
          }
        }
      }

      // Fall back to recording initiator
      if (recording.userId) {
        return recording.userId
      }

      // Default to local user
      return 'local'
    } catch (error) {
      console.error('Speaker identification error:', error)
      return 'unknown'
    }
  }

  startRecordingAnalytics(recordingId) {
    const activeRecording = this.activeRecordings.get(recordingId)
    if (!activeRecording) return

    // Collect analytics every 5 seconds
    activeRecording.analyticsTimer = setInterval(() => {
      this.collectRecordingAnalytics(recordingId)
    }, 5000)
  }

  collectRecordingAnalytics(recordingId) {
    const recording = this.recordings.get(recordingId)
    if (!recording || !this.webrtcService) return

    // Get current participants
    const participants = this.webrtcService.getParticipants()
    
    // Get connection quality
    const qualityMetrics = this.webrtcService.getQualityMetrics()
    
    // Update recording analytics
    recording.analytics.participantStats.set(Date.now(), {
      count: participants.length,
      activeSpeakers: participants.filter(p => p.isSpeaking).length,
      videoParticipants: participants.filter(p => p.videoEnabled).length
    })
    
    if (qualityMetrics) {
      recording.analytics.qualityMetrics.push({
        timestamp: Date.now(),
        ...qualityMetrics
      })
    }
    
    // Update duration
    recording.duration = Date.now() - recording.metadata.startTime
  }

  updateRecordingAnalytics(recordingId, data) {
    const recording = this.recordings.get(recordingId)
    if (!recording) return

    // Update file size and chunk information
    if (data.chunkSize) {
      recording.fileSize += data.chunkSize
    }
  }

  async pauseRecording(recordingId) {
    const activeRecording = this.activeRecordings.get(recordingId)
    const recording = this.recordings.get(recordingId)
    
    if (!activeRecording || !recording) {
      throw new Error('Recording not found')
    }

    if (activeRecording.mediaRecorder && activeRecording.mediaRecorder.state === 'recording') {
      activeRecording.mediaRecorder.pause()
      recording.status = 'paused'
      this.recordingPaused = true
      
      // Pause transcription
      if (this.speechRecognition && activeRecording.transcriptionActive) {
        this.speechRecognition.stop()
        activeRecording.transcriptionActive = false
      }
      
      this.emit('recording_paused', { recordingId })
    }
  }

  async resumeRecording(recordingId) {
    const activeRecording = this.activeRecordings.get(recordingId)
    const recording = this.recordings.get(recordingId)
    
    if (!activeRecording || !recording) {
      throw new Error('Recording not found')
    }

    if (activeRecording.mediaRecorder && activeRecording.mediaRecorder.state === 'paused') {
      activeRecording.mediaRecorder.resume()
      recording.status = 'recording'
      this.recordingPaused = false
      
      // Resume transcription
      if (this.speechRecognition && recording.transcription?.enabled) {
        await this.startRealTimeTranscription(recordingId)
      }
      
      this.emit('recording_resumed', { recordingId })
    }
  }

  async stopRecording(recordingId) {
    const activeRecording = this.activeRecordings.get(recordingId)
    const recording = this.recordings.get(recordingId)
    
    if (!activeRecording || !recording) {
      throw new Error('Recording not found')
    }

    try {
      // Stop media recorder
      if (activeRecording.mediaRecorder && activeRecording.mediaRecorder.state !== 'inactive') {
        activeRecording.mediaRecorder.stop()
      }
      
      // Stop transcription
      if (this.speechRecognition && activeRecording.transcriptionActive) {
        this.speechRecognition.stop()
        activeRecording.transcriptionActive = false
      }
      
      // Stop analytics collection
      if (activeRecording.analyticsTimer) {
        clearInterval(activeRecording.analyticsTimer)
        activeRecording.analyticsTimer = null
      }
      
      // Update recording status
      recording.status = 'processing'
      recording.metadata.endTime = Date.now()
      recording.duration = recording.metadata.endTime - recording.metadata.startTime
      
      this.emit('recording_stopped', { recordingId, recording })
      
      // Process and upload
      this.processRecording(recordingId)
      
    } catch (error) {
      console.error('Failed to stop recording:', error)
      this.handleRecordingError(recordingId, error)
    }
  }

  handleRecordingStop(recordingId) {
    // The recording has been stopped, now process it
  }

  handleRecordingError(recordingId, error) {
    const recording = this.recordings.get(recordingId)
    if (recording) {
      recording.status = 'error'
      recording.error = error.message
    }
    
    this.emit('recording_error', { recordingId, error: error.message })
    console.error(`Recording error for ${recordingId}:`, error)
  }

  async processRecording(recordingId) {
    const recording = this.recordings.get(recordingId)
    if (!recording) return

    try {
      
      // Create blob from chunks
      const blob = new Blob(recording.chunks, { 
        type: recording.config.mimeType 
      })
      
      // Generate filename
      const filename = this.generateFilename(recording)
      
      // Store processed recording
      recording.blob = blob
      recording.filename = filename
      recording.status = 'completed'
      
      // Add to upload queue
      this.uploadQueue.push({
        recordingId,
        blob,
        filename,
        metadata: recording.metadata,
        priority: recording.metadata.priority || 'normal'
      })
      
      // Process AI features if enabled
      if (recording.ai?.enabled) {
        await this.processAIFeatures(recordingId)
      }
      
      this.emit('recording_processed', { recordingId, recording })
      
    } catch (error) {
      console.error('Failed to process recording:', error)
      this.handleRecordingError(recordingId, error)
    }
  }

  generateFilename(recording) {
    const date = new Date(recording.metadata.startTime)
    const dateStr = date.toISOString().split('T')[0]
    const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-')
    
    const prefix = recording.config.video ? 'video' : 'audio'
    const channelName = recording.metadata.channelName || 'channel'
    const extension = recording.config.fileExtension
    
    return `${prefix}_${channelName}_${dateStr}_${timeStr}.${extension}`
  }

  async processAIFeatures(recordingId) {
    const recording = this.recordings.get(recordingId)
    if (!recording || !recording.ai) return

    try {
      // Generate summary from transcription
      if (recording.transcription?.segments.length > 0) {
        recording.ai.summary = await this.generateSummary(recording.transcription.segments)
        recording.ai.topics = await this.detectTopics(recording.transcription.segments)
        recording.ai.sentiment = await this.analyzeSentiment(recording.transcription.segments)
        recording.ai.actionItems = await this.extractActionItems(recording.transcription.segments)
        recording.ai.keyMoments = await this.detectKeyMoments(recording)
      }
      
    } catch (error) {
      console.error('AI processing failed:', error)
    }
  }

  async generateSummary(transcriptionSegments) {
    try {
      // Import API service dynamically to avoid circular dependencies
      const { default: apiService } = await import('./api.js')

      const fullText = transcriptionSegments.map(s => s.text).join(' ')

      // Call backend AI service for summary generation
      const response = await apiService.post('/ai/summarize', {
        text: fullText,
        segments: transcriptionSegments,
        options: {
          briefLength: 200,
          detailedLength: 500,
          extractKeyPoints: true
        }
      })

      if (response.success && response.data) {
        return {
          brief: response.data.brief,
          detailed: response.data.detailed,
          keyPoints: response.data.keyPoints || []
        }
      }

      throw new Error('AI summary generation failed')
    } catch (error) {
      console.error('Failed to generate AI summary:', error)

      // Fallback to basic text truncation
      const fullText = transcriptionSegments.map(s => s.text).join(' ')
      return {
        brief: fullText.slice(0, 200) + (fullText.length > 200 ? '...' : ''),
        detailed: fullText.slice(0, 500) + (fullText.length > 500 ? '...' : ''),
        keyPoints: [],
        error: 'AI summary unavailable - showing transcript excerpt'
      }
    }
  }

  async detectTopics(transcriptionSegments) {
    try {
      const { default: apiService } = await import('./api.js')

      const fullText = transcriptionSegments.map(s => s.text).join(' ')

      // Call backend AI service for topic detection
      const response = await apiService.post('/ai/detect-topics', {
        text: fullText,
        segments: transcriptionSegments,
        options: {
          maxTopics: 10,
          minConfidence: 0.6
        }
      })

      if (response.success && response.data?.topics) {
        return response.data.topics
      }

      throw new Error('Topic detection failed')
    } catch (error) {
      console.error('Failed to detect topics:', error)

      // Fallback to basic keyword extraction
      return this.extractBasicKeywords(transcriptionSegments)
    }
  }

  async analyzeSentiment(transcriptionSegments) {
    try {
      const { default: apiService } = await import('./api.js')

      const fullText = transcriptionSegments.map(s => s.text).join(' ')

      // Call backend AI service for sentiment analysis
      const response = await apiService.post('/ai/analyze-sentiment', {
        text: fullText,
        segments: transcriptionSegments.map(s => ({
          text: s.text,
          timestamp: s.timestamp
        }))
      })

      if (response.success && response.data) {
        return {
          overall: response.data.overall,
          confidence: response.data.confidence,
          segments: response.data.segments || []
        }
      }

      throw new Error('Sentiment analysis failed')
    } catch (error) {
      console.error('Failed to analyze sentiment:', error)

      // Fallback to neutral sentiment
      return {
        overall: 'neutral',
        confidence: 0.5,
        segments: transcriptionSegments.map(s => ({
          text: s.text,
          sentiment: 'neutral',
          confidence: 0.5
        })),
        error: 'AI sentiment analysis unavailable'
      }
    }
  }

  /**
   * Extract basic keywords as fallback for topic detection
   * @private
   */
  extractBasicKeywords(transcriptionSegments) {
    const fullText = transcriptionSegments.map(s => s.text).join(' ')

    // Common stop words to filter out
    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
      'in', 'with', 'to', 'for', 'of', 'as', 'by', 'this', 'that', 'it'
    ])

    // Extract words and count frequency
    const words = fullText.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word))

    const wordCount = {}
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1
    })

    // Get top 5 most frequent words as topics
    return Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1))
  }

  async extractActionItems(transcriptionSegments) {
    try {
      const { default: apiService } = await import('./api.js')

      const fullText = transcriptionSegments.map(s => s.text).join(' ')

      // Call backend AI service for action item extraction
      const response = await apiService.post('/ai/extract-action-items', {
        text: fullText,
        segments: transcriptionSegments,
        options: {
          minConfidence: 0.7,
          extractAssignees: true,
          extractDueDates: true
        }
      })

      if (response.success && response.data?.actionItems) {
        return response.data.actionItems
      }

      throw new Error('Action item extraction failed')
    } catch (error) {
      console.error('Failed to extract action items:', error)

      // Fallback to basic pattern matching
      return this.extractBasicActionItems(transcriptionSegments)
    }
  }

  async detectKeyMoments(recording) {
    try {
      const { default: apiService } = await import('./api.js')

      // Call backend AI service for key moment detection
      const response = await apiService.post('/ai/detect-key-moments', {
        recordingId: recording.id,
        segments: recording.transcription?.segments || [],
        duration: recording.metadata.duration,
        options: {
          minConfidence: 0.7,
          maxMoments: 10
        }
      })

      if (response.success && response.data?.keyMoments) {
        return response.data.keyMoments
      }

      throw new Error('Key moment detection failed')
    } catch (error) {
      console.error('Failed to detect key moments:', error)

      // Return empty array as fallback
      return []
    }
  }

  /**
   * Extract basic action items using pattern matching as fallback
   * @private
   */
  extractBasicActionItems(transcriptionSegments) {
    const actionItems = []

    // Common action item patterns
    const patterns = [
      /(?:need to|should|must|have to|will)\s+([^.!?]+)/gi,
      /(?:action item|todo|task):\s*([^.!?]+)/gi,
      /(?:follow up|reach out|contact)\s+(?:to|with)?\s*([^.!?]+)/gi
    ]

    transcriptionSegments.forEach(segment => {
      patterns.forEach(pattern => {
        const matches = segment.text.matchAll(pattern)
        for (const match of matches) {
          if (match[1] && match[1].trim().length > 5) {
            actionItems.push({
              text: match[1].trim(),
              confidence: 0.6,
              assignee: null,
              dueDate: null,
              source: 'pattern_matching',
              timestamp: segment.timestamp
            })
          }
        }
      })
    })

    // Limit to top 10 most relevant
    return actionItems.slice(0, 10)
  }

  async processUploadQueue() {
    if (this.isProcessingUploads || this.uploadQueue.length === 0) {
      return
    }

    this.isProcessingUploads = true

    try {
      // Sort by priority (high, normal, low)
      this.uploadQueue.sort((a, b) => {
        const priorities = { high: 3, normal: 2, low: 1 }
        return priorities[b.priority] - priorities[a.priority]
      })

      // Process uploads in parallel (up to max concurrent)
      const uploadsToProcess = this.uploadQueue.splice(0, this.maxConcurrentProcessing)
      
      const uploadPromises = uploadsToProcess.map(upload => 
        this.uploadToCloud(upload)
      )

      await Promise.allSettled(uploadPromises)
      
    } catch (error) {
      console.error('Upload processing error:', error)
    } finally {
      this.isProcessingUploads = false
    }
  }

  async uploadToCloud(upload) {
    try {
      
      // Generate cloud storage path
      const cloudPath = this.generateCloudPath(upload)
      
      // Upload file
      const uploadResult = await this.performCloudUpload(
        upload.blob, 
        cloudPath, 
        upload.metadata
      )
      
      // Update recording with cloud information
      const recording = this.recordings.get(upload.recordingId)
      if (recording) {
        recording.cloudStorage = {
          uploaded: true,
          path: cloudPath,
          url: uploadResult.url,
          uploadedAt: Date.now(),
          size: upload.blob.size,
          etag: uploadResult.etag
        }
        recording.status = 'uploaded'
      }
      
      this.emit('recording_uploaded', { 
        recordingId: upload.recordingId, 
        cloudPath, 
        url: uploadResult.url 
      })
      
      
    } catch (error) {
      console.error('Upload failed:', error)
      
      // Re-add to queue for retry (with exponential backoff)
      upload.retryCount = (upload.retryCount || 0) + 1
      if (upload.retryCount < 3) {
        setTimeout(() => {
          this.uploadQueue.push(upload)
        }, Math.pow(2, upload.retryCount) * 1000)
      }
    }
  }

  generateCloudPath(upload) {
    const date = new Date(upload.metadata.startTime)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    
    return `recordings/${year}/${month}/${day}/${upload.metadata.channelId}/${upload.filename}`
  }

  async performCloudUpload(blob, path, metadata) {
    if (!this.cloudClient) {
      throw new Error('Cloud storage not configured')
    }

    // Convert blob to array buffer for upload
    const arrayBuffer = await blob.arrayBuffer()
    
    const uploadParams = {
      Bucket: this.cloudConfig.bucket,
      Key: path,
      Body: arrayBuffer,
      ContentType: blob.type,
      Metadata: {
        recordingId: metadata.recordingId,
        channelId: metadata.channelId,
        userId: metadata.userId,
        startTime: metadata.startTime.toString(),
        duration: metadata.duration?.toString(),
        participants: JSON.stringify(metadata.participants)
      }
    }

    // Add encryption if enabled
    if (this.cloudConfig.encryption) {
      uploadParams.ServerSideEncryption = 'AES256'
    }

    const result = await this.cloudClient.upload(uploadParams).promise()
    
    return {
      url: result.Location,
      etag: result.ETag,
      versionId: result.VersionId
    }
  }

  // Utility methods
  getRecording(recordingId) {
    return this.recordings.get(recordingId)
  }

  getAllRecordings() {
    return Array.from(this.recordings.values())
  }

  getActiveRecordings() {
    return Array.from(this.recordings.values()).filter(r => 
      r.status === 'recording' || r.status === 'paused'
    )
  }

  isRecording() {
    return this.currentRecordingId !== null
  }

  getCurrentRecordingId() {
    return this.currentRecordingId
  }

  cleanupOldFiles() {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000) // 24 hours ago
    
    for (const [recordingId, recording] of this.recordings) {
      if (recording.metadata.startTime < cutoffTime && 
          recording.status === 'uploaded' && 
          recording.blob) {
        // Remove blob from memory but keep metadata
        delete recording.blob
        delete recording.chunks
      }
    }
  }

  // Event system
  emit(eventName, data) {
    // This would integrate with the main WebRTC service event system
    
    // Forward to WebRTC service if available
    if (this.webrtcService && this.webrtcService.emit) {
      this.webrtcService.emit(eventName, data)
    }
  }

  // Integration with WebRTC service
  initialize(webrtcService) {
    this.webrtcService = webrtcService
  }

  // Cleanup
  async destroy() {
    // Stop all active recordings
    for (const recordingId of this.activeRecordings.keys()) {
      try {
        await this.stopRecording(recordingId)
      } catch (error) {
        console.error(`Failed to stop recording ${recordingId}:`, error)
      }
    }
    
    // Process remaining uploads
    if (this.uploadQueue.length > 0) {
      await this.processUploadQueue()
    }
    
    // Clear all data
    this.recordings.clear()
    this.activeRecordings.clear()
    this.uploadQueue = []
    
    // Stop speech recognition
    if (this.speechRecognition) {
      this.speechRecognition.stop()
    }
    
  }
}

export default RecordingManager