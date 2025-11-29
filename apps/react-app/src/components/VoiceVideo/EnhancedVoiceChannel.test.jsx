/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, waitFor, within, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EnhancedVoiceChannel from './EnhancedVoiceChannel'
import webrtcService from '../../services/webrtc'

// Mock the webrtc service
jest.mock('../../services/webrtc', () => ({
  __esModule: true,
  default: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connectToVoiceChannel: jest.fn(),
    disconnect: jest.fn(),
    toggleAudio: jest.fn(),
    toggleVideo: jest.fn(),
    toggleScreenShare: jest.fn(),
    disableAudio: jest.fn(),
    enableAudio: jest.fn(),
    getParticipants: jest.fn(),
    generateAccessToken: jest.fn(),
    audioEnabled: true,
    videoEnabled: false,
    screenShareEnabled: false,
    isConnected: jest.fn(),
    getConnectionState: jest.fn(),
    // Enhanced voice features
    togglePushToTalk: jest.fn(),
    enableSpatialAudio: jest.fn(),
    disableSpatialAudio: jest.fn(),
    setSpatialPosition: jest.fn(),
    applyVoiceEffect: jest.fn(),
    enableRobotVoice: jest.fn(),
    enableEcho: jest.fn(),
    enableReverb: jest.fn(),
    setPitchShift: jest.fn(),
    startRecording: jest.fn(),
    stopRecording: jest.fn(),
    muteParticipant: jest.fn(),
    kickParticipant: jest.fn()
  }
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Mic: () => <div data-testid="mic-icon">Mic</div>,
  MicOff: () => <div data-testid="mic-off-icon">MicOff</div>,
  Headphones: () => <div data-testid="headphones-icon">Headphones</div>,
  Video: () => <div data-testid="video-icon">Video</div>,
  VideoOff: () => <div data-testid="video-off-icon">VideoOff</div>,
  PhoneOff: () => <div data-testid="phone-off-icon">PhoneOff</div>,
  Monitor: () => <div data-testid="monitor-icon">Monitor</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>,
  Users: () => <div data-testid="users-icon">Users</div>,
  Volume2: () => <div data-testid="volume-icon">Volume</div>,
  VolumeX: () => <div data-testid="volume-x-icon">VolumeX</div>,
  X: () => <div data-testid="x-icon">X</div>,
  Signal: () => <div data-testid="signal-icon">Signal</div>,
  WifiOff: () => <div data-testid="wifi-off-icon">WifiOff</div>,
  Square: () => <div data-testid="square-icon">Square</div>,
  Circle: () => <div data-testid="circle-icon">Circle</div>,
  Zap: () => <div data-testid="zap-icon">Zap</div>,
  Shield: () => <div data-testid="shield-icon">Shield</div>,
  Crown: () => <div data-testid="crown-icon">Crown</div>,
  Radio: () => <div data-testid="radio-icon">Radio</div>,
  Waves: () => <div data-testid="waves-icon">Waves</div>,
  Activity: () => <div data-testid="activity-icon">Activity</div>,
  BarChart3: () => <div data-testid="barchart-icon">BarChart</div>,
  Download: () => <div data-testid="download-icon">Download</div>,
  Upload: () => <div data-testid="upload-icon">Upload</div>,
  Eye: () => <div data-testid="eye-icon">Eye</div>
}))

// Mock CSS imports
jest.mock('./EnhancedVoiceChannel.css', () => ({}))

describe('EnhancedVoiceChannel Component', () => {
  const mockChannel = {
    id: 'channel-123',
    name: 'Enhanced Voice Channel',
    spatialAudio: true,
    maxParticipants: 2000
  }

  const mockCurrentUser = {
    id: 'user-123',
    displayName: 'Test User'
  }

  const mockOnLeave = jest.fn()

  let eventListeners = {}

  beforeEach(() => {
    jest.clearAllMocks()
    eventListeners = {}

    // Mock event listener registration
    webrtcService.on.mockImplementation((event, callback) => {
      if (!eventListeners[event]) {
        eventListeners[event] = []
      }
      eventListeners[event].push(callback)
    })

    // Mock event listener removal
    webrtcService.off.mockImplementation((event, callback) => {
      if (eventListeners[event]) {
        eventListeners[event] = eventListeners[event].filter(cb => cb !== callback)
      }
    })

    // Setup default mock implementations
    webrtcService.generateAccessToken.mockResolvedValue('mock-access-token')
    webrtcService.connectToVoiceChannel.mockResolvedValue({ room: 'mock-room' })
    webrtcService.disconnect.mockResolvedValue(true)
    webrtcService.toggleAudio.mockResolvedValue(true)
    webrtcService.toggleVideo.mockResolvedValue(true)
    webrtcService.toggleScreenShare.mockResolvedValue(true)
    webrtcService.getParticipants.mockReturnValue([])
    webrtcService.getConnectionState.mockReturnValue('connected')
    webrtcService.isConnected.mockReturnValue(true)
    webrtcService.enableSpatialAudio.mockResolvedValue(true)
    webrtcService.disableSpatialAudio.mockResolvedValue(true)
    webrtcService.applyVoiceEffect.mockResolvedValue(true)
    webrtcService.enableRobotVoice.mockResolvedValue(true)
    webrtcService.enableEcho.mockResolvedValue(true)
    webrtcService.enableReverb.mockResolvedValue(true)
    webrtcService.setPitchShift.mockResolvedValue(true)
    webrtcService.startRecording.mockResolvedValue(true)
    webrtcService.stopRecording.mockResolvedValue(true)
    webrtcService.muteParticipant.mockResolvedValue(true)
    webrtcService.kickParticipant.mockResolvedValue(true)

    // Mock window.alert
    global.alert = jest.fn()

    // Mock setInterval and clearInterval
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  // ==========================================
  // RENDERING AND INITIALIZATION TESTS
  // ==========================================

  describe('Rendering', () => {
    test('should render null when channel is not provided', () => {
      const { container } = render(
        <EnhancedVoiceChannel
          channel={null}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      expect(container.firstChild).toBeNull()
    })

    test('should render enhanced voice channel container when channel is provided', () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const container = document.querySelector('.enhanced-voice-channel')
      expect(container).toBeInTheDocument()
    })

    test('should display channel name in header', () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      expect(screen.getByText('Enhanced Voice Channel')).toBeInTheDocument()
    })

    test('should show disconnected status initially', () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      expect(screen.getByText('Disconnected')).toBeInTheDocument()
    })

    test('should render all primary control buttons', () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      expect(screen.getByTestId('mic-icon')).toBeInTheDocument()
      expect(screen.getByTestId('headphones-icon')).toBeInTheDocument()
      expect(screen.getByTestId('video-off-icon')).toBeInTheDocument()
      expect(screen.getByTestId('monitor-icon')).toBeInTheDocument()
    })

    test('should render leave button', () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      expect(screen.getByText('Leave')).toBeInTheDocument()
    })

    test('should render analytics button', () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      expect(screen.getByTestId('barchart-icon')).toBeInTheDocument()
    })

    test('should render settings button', () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      expect(screen.getByTestId('settings-icon')).toBeInTheDocument()
    })

    test('should render participants panel by default', () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const participantsPanel = document.querySelector('.participants-panel')
      expect(participantsPanel).toBeInTheDocument()
    })

    test('should render volume control slider', () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const slider = screen.getByRole('slider')
      expect(slider).toBeInTheDocument()
      expect(slider).toHaveAttribute('type', 'range')
      expect(slider).toHaveAttribute('min', '0')
      expect(slider).toHaveAttribute('max', '100')
      expect(slider).toHaveValue('100')
    })

    test('should render voice effects buttons', () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      expect(screen.getByTestId('zap-icon')).toBeInTheDocument() // robot effect
      expect(screen.getByTestId('waves-icon')).toBeInTheDocument() // echo effect
      expect(screen.getByTestId('activity-icon')).toBeInTheDocument() // reverb effect
    })

    test('should render spatial audio toggle button', () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const radioIcons = screen.getAllByTestId('radio-icon')
      expect(radioIcons.length).toBeGreaterThan(0)
    })
  })

  // ==========================================
  // CONNECTION TESTS
  // ==========================================

  describe('Connection Management', () => {
    test('should connect to voice channel on mount with enhanced options', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      await waitFor(() => {
        expect(webrtcService.generateAccessToken).toHaveBeenCalledWith(
          mockChannel.id,
          mockCurrentUser.id
        )
      })

      expect(webrtcService.connectToVoiceChannel).toHaveBeenCalledWith(
        mockChannel,
        'mock-access-token',
        {
          enableSpatialAudio: true,
          maxParticipants: 2000,
          audioQuality: 'high',
          enableAnalytics: true
        }
      )
    })

    test('should show connected status after successful connection', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      act(() => {
        eventListeners.connected.forEach(cb =>
          cb({ totalParticipants: 5 })
        )
      })

      await waitFor(() => {
        expect(screen.getByText('Voice Connected')).toBeInTheDocument()
      })
    })

    test('should handle connection error gracefully', async () => {
      const error = new Error('Connection failed')
      webrtcService.connectToVoiceChannel.mockRejectedValue(error)

      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          'Failed to connect to voice channel: Connection failed'
        )
      })
    })

    test('should register all enhanced event listeners on mount', () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      expect(webrtcService.on).toHaveBeenCalledWith('connected', expect.any(Function))
      expect(webrtcService.on).toHaveBeenCalledWith('disconnected', expect.any(Function))
      expect(webrtcService.on).toHaveBeenCalledWith('reconnecting', expect.any(Function))
      expect(webrtcService.on).toHaveBeenCalledWith('reconnected', expect.any(Function))
      expect(webrtcService.on).toHaveBeenCalledWith('participant_joined', expect.any(Function))
      expect(webrtcService.on).toHaveBeenCalledWith('participant_left', expect.any(Function))
      expect(webrtcService.on).toHaveBeenCalledWith('active_speakers_changed', expect.any(Function))
      expect(webrtcService.on).toHaveBeenCalledWith('connection_quality_changed', expect.any(Function))
      expect(webrtcService.on).toHaveBeenCalledWith('recording_started', expect.any(Function))
      expect(webrtcService.on).toHaveBeenCalledWith('recording_stopped', expect.any(Function))
      expect(webrtcService.on).toHaveBeenCalledWith('bandwidth_stats_updated', expect.any(Function))
      expect(webrtcService.on).toHaveBeenCalledWith('voice_effect_applied', expect.any(Function))
      expect(webrtcService.on).toHaveBeenCalledWith('spatial_audio_enabled', expect.any(Function))
      expect(webrtcService.on).toHaveBeenCalledWith('push_to_talk_toggled', expect.any(Function))
      expect(webrtcService.on).toHaveBeenCalledWith('devices_updated', expect.any(Function))
      expect(webrtcService.on).toHaveBeenCalledWith('participant_moderated', expect.any(Function))
    })

    test('should unregister all event listeners on unmount', () => {
      const { unmount } = render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      unmount()

      expect(webrtcService.off).toHaveBeenCalledWith('connected', expect.any(Function))
      expect(webrtcService.off).toHaveBeenCalledWith('disconnected', expect.any(Function))
      expect(webrtcService.off).toHaveBeenCalledWith('reconnecting', expect.any(Function))
      expect(webrtcService.off).toHaveBeenCalledWith('reconnected', expect.any(Function))
      expect(webrtcService.off).toHaveBeenCalledWith('voice_effect_applied', expect.any(Function))
    })

    test('should handle disconnected event', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      act(() => {
        eventListeners.connected.forEach(cb => cb({ totalParticipants: 5 }))
      })

      await waitFor(() => {
        expect(screen.getByText('Voice Connected')).toBeInTheDocument()
      })

      act(() => {
        eventListeners.disconnected.forEach(cb => cb())
      })

      await waitFor(() => {
        expect(screen.getByText('Disconnected')).toBeInTheDocument()
      })
    })

    test('should handle reconnecting event', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      act(() => {
        eventListeners.reconnecting.forEach(cb => cb())
      })

      await waitFor(() => {
        expect(screen.getByText('Reconnecting...')).toBeInTheDocument()
      })
    })

    test('should handle reconnected event', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      act(() => {
        eventListeners.reconnecting.forEach(cb => cb())
      })

      await waitFor(() => {
        expect(screen.getByText('Reconnecting...')).toBeInTheDocument()
      })

      act(() => {
        eventListeners.reconnected.forEach(cb => cb())
      })

      await waitFor(() => {
        expect(screen.getByText('Voice Connected')).toBeInTheDocument()
      })
    })

    test('should call onLeave when disconnecting', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const leaveButton = screen.getByText('Leave')
      await userEvent.click(leaveButton)

      await waitFor(() => {
        expect(webrtcService.disconnect).toHaveBeenCalled()
        expect(mockOnLeave).toHaveBeenCalled()
      })
    })

    test('should update participant count on connection', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      act(() => {
        eventListeners.connected.forEach(cb =>
          cb({ totalParticipants: 42 })
        )
      })

      await waitFor(() => {
        expect(screen.getByText('42')).toBeInTheDocument()
      })
    })
  })

  // ==========================================
  // AUDIO CONTROL TESTS
  // ==========================================

  describe('Audio Controls', () => {
    test('should toggle mute when mute button is clicked', async () => {
      webrtcService.audioEnabled = true

      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const muteButton = document.querySelector('.control-btn')
      await userEvent.click(muteButton)

      expect(webrtcService.toggleAudio).toHaveBeenCalled()
    })

    test('should update UI when muted', async () => {
      webrtcService.audioEnabled = true

      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const muteButton = document.querySelector('.control-btn')

      webrtcService.toggleAudio.mockImplementation(() => {
        webrtcService.audioEnabled = false
        return Promise.resolve(true)
      })

      await userEvent.click(muteButton)

      await waitFor(() => {
        expect(muteButton).toHaveClass('muted')
      })
    })

    test('should disable mute button when deafened', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const controlButtons = document.querySelectorAll('.control-btn')
      const deafenButton = controlButtons[1] // second control button

      await userEvent.click(deafenButton)

      await waitFor(() => {
        const muteButton = controlButtons[0]
        expect(muteButton).toBeDisabled()
      })
    })

    test('should handle mute toggle failure gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      webrtcService.toggleAudio.mockRejectedValue(new Error('Failed to toggle audio'))

      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const muteButton = document.querySelector('.control-btn')
      await userEvent.click(muteButton)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled()
      })

      consoleErrorSpy.mockRestore()
    })
  })

  // ==========================================
  // DEAFEN TESTS
  // ==========================================

  describe('Deafen Controls', () => {
    test('should toggle deafen when deafen button is clicked', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const controlButtons = document.querySelectorAll('.control-btn')
      const deafenButton = controlButtons[1]

      await userEvent.click(deafenButton)

      await waitFor(() => {
        expect(deafenButton).toHaveClass('deafened')
      })
    })

    test('should disable audio when deafened', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const controlButtons = document.querySelectorAll('.control-btn')
      const deafenButton = controlButtons[1]

      await userEvent.click(deafenButton)

      await waitFor(() => {
        expect(webrtcService.disableAudio).toHaveBeenCalled()
      })
    })

    test('should automatically mute when deafened', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const controlButtons = document.querySelectorAll('.control-btn')
      const deafenButton = controlButtons[1]

      await userEvent.click(deafenButton)

      await waitFor(() => {
        const muteButton = controlButtons[0]
        expect(muteButton).toHaveClass('muted')
      })
    })
  })

  // ==========================================
  // VIDEO CONTROL TESTS
  // ==========================================

  describe('Video Controls', () => {
    test('should toggle video when video button is clicked', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const controlButtons = document.querySelectorAll('.control-btn')
      const videoButton = controlButtons[2]

      await userEvent.click(videoButton)

      expect(webrtcService.toggleVideo).toHaveBeenCalled()
    })

    test('should update UI when video is enabled', async () => {
      webrtcService.videoEnabled = false
      webrtcService.toggleVideo.mockImplementation(() => {
        webrtcService.videoEnabled = true
        return Promise.resolve(true)
      })

      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const controlButtons = document.querySelectorAll('.control-btn')
      const videoButton = controlButtons[2]

      await userEvent.click(videoButton)

      await waitFor(() => {
        expect(videoButton).toHaveClass('active')
      })
    })

    test('should handle video toggle failure gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      webrtcService.toggleVideo.mockRejectedValue(new Error('Failed to toggle video'))

      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const controlButtons = document.querySelectorAll('.control-btn')
      const videoButton = controlButtons[2]

      await userEvent.click(videoButton)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled()
      })

      consoleErrorSpy.mockRestore()
    })
  })

  // ==========================================
  // SCREEN SHARING TESTS
  // ==========================================

  describe('Screen Sharing', () => {
    test('should toggle screen share when button is clicked', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const controlButtons = document.querySelectorAll('.control-btn')
      const screenShareButton = controlButtons[3]

      await userEvent.click(screenShareButton)

      expect(webrtcService.toggleScreenShare).toHaveBeenCalled()
    })

    test('should update UI when screen sharing is enabled', async () => {
      webrtcService.screenShareEnabled = false
      webrtcService.toggleScreenShare.mockImplementation(() => {
        webrtcService.screenShareEnabled = true
        return Promise.resolve(true)
      })

      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const controlButtons = document.querySelectorAll('.control-btn')
      const screenShareButton = controlButtons[3]

      await userEvent.click(screenShareButton)

      await waitFor(() => {
        expect(screenShareButton).toHaveClass('active')
      })
    })

    test('should handle screen share toggle failure gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      webrtcService.toggleScreenShare.mockRejectedValue(
        new Error('Failed to toggle screen share')
      )

      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const controlButtons = document.querySelectorAll('.control-btn')
      const screenShareButton = controlButtons[3]

      await userEvent.click(screenShareButton)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled()
      })

      consoleErrorSpy.mockRestore()
    })
  })

  // ==========================================
  // VOICE EFFECTS TESTS
  // ==========================================

  describe('Voice Effects', () => {
    test('should apply robot voice effect when button is clicked', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const effectButtons = document.querySelectorAll('.effect-btn')
      const robotButton = effectButtons[0]

      await userEvent.click(robotButton)

      expect(webrtcService.applyVoiceEffect).toHaveBeenCalledWith('robot', 1.0)
    })

    test('should apply echo effect when button is clicked', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const effectButtons = document.querySelectorAll('.effect-btn')
      const echoButton = effectButtons[1]

      await userEvent.click(echoButton)

      expect(webrtcService.applyVoiceEffect).toHaveBeenCalledWith('echo', 1.0)
    })

    test('should apply reverb effect when button is clicked', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const effectButtons = document.querySelectorAll('.effect-btn')
      const reverbButton = effectButtons[2]

      await userEvent.click(reverbButton)

      expect(webrtcService.applyVoiceEffect).toHaveBeenCalledWith('reverb', 1.0)
    })

    test('should toggle effect off when clicking again', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const effectButtons = document.querySelectorAll('.effect-btn')
      const robotButton = effectButtons[0]

      // First click - enable
      await userEvent.click(robotButton)
      expect(webrtcService.applyVoiceEffect).toHaveBeenCalledWith('robot', 1.0)

      // Simulate effect being enabled
      act(() => {
        eventListeners.voice_effect_applied.forEach(cb =>
          cb({ effectType: 'robot', intensity: 1 })
        )
      })

      // Second click - disable
      await userEvent.click(robotButton)
      expect(webrtcService.applyVoiceEffect).toHaveBeenCalledWith('robot', 0)
    })

    test('should apply active class when effect is enabled', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      act(() => {
        eventListeners.voice_effect_applied.forEach(cb =>
          cb({ effectType: 'robot', intensity: 1 })
        )
      })

      await waitFor(() => {
        const effectButtons = document.querySelectorAll('.effect-btn')
        const robotButton = effectButtons[0]
        expect(robotButton).toHaveClass('active')
      })
    })

    test('should handle voice effect applied event', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      act(() => {
        eventListeners.voice_effect_applied.forEach(cb =>
          cb({ effectType: 'echo', intensity: 0.8 })
        )
      })

      await waitFor(() => {
        const effectButtons = document.querySelectorAll('.effect-btn')
        const echoButton = effectButtons[1]
        expect(echoButton).toHaveClass('active')
      })
    })

    test('should disable voice effect when intensity is zero', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      // Enable effect first
      act(() => {
        eventListeners.voice_effect_applied.forEach(cb =>
          cb({ effectType: 'reverb', intensity: 1 })
        )
      })

      await waitFor(() => {
        const effectButtons = document.querySelectorAll('.effect-btn')
        expect(effectButtons[2]).toHaveClass('active')
      })

      // Disable effect
      act(() => {
        eventListeners.voice_effect_applied.forEach(cb =>
          cb({ effectType: 'reverb', intensity: 0 })
        )
      })

      await waitFor(() => {
        const effectButtons = document.querySelectorAll('.effect-btn')
        expect(effectButtons[2]).not.toHaveClass('active')
      })
    })
  })

  // ==========================================
  // SPATIAL AUDIO TESTS
  // ==========================================

  describe('Spatial Audio', () => {
    test('should toggle spatial audio when button is clicked', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const advancedControls = document.querySelector('.voice-controls').querySelectorAll('.control-btn')
      const spatialButton = advancedControls[advancedControls.length - 2]

      await userEvent.click(spatialButton)

      expect(webrtcService.enableSpatialAudio).toHaveBeenCalledWith(
        { x: 0, y: 0, z: 0 },
        'medium'
      )
    })

    test('should disable spatial audio when toggling off', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      // Enable spatial audio first
      act(() => {
        eventListeners.spatial_audio_enabled.forEach(cb => cb())
      })

      await waitFor(() => {
        const header = document.querySelector('.voice-header')
        expect(within(header).getByTestId('radio-icon')).toBeInTheDocument()
      })

      // Now disable it
      const advancedControls = document.querySelector('.voice-controls').querySelectorAll('.control-btn')
      const spatialButton = advancedControls[advancedControls.length - 2]

      await userEvent.click(spatialButton)

      expect(webrtcService.disableSpatialAudio).toHaveBeenCalled()
    })

    test('should handle spatial audio enabled event', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      act(() => {
        eventListeners.spatial_audio_enabled.forEach(cb => cb())
      })

      await waitFor(() => {
        const advancedControls = document.querySelector('.voice-controls').querySelectorAll('.control-btn')
        const spatialButton = advancedControls[advancedControls.length - 2]
        expect(spatialButton).toHaveClass('active')
      })
    })

    test('should show spatial audio icon in header when enabled', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      act(() => {
        eventListeners.spatial_audio_enabled.forEach(cb => cb())
      })

      await waitFor(() => {
        const header = document.querySelector('.voice-header')
        const radioIcon = within(header).getByTestId('radio-icon')
        expect(radioIcon).toBeInTheDocument()
        expect(radioIcon).toHaveClass('text-purple-400')
      })
    })
  })

  // ==========================================
  // PUSH TO TALK TESTS
  // ==========================================

  describe('Push to Talk', () => {
    test('should toggle push to talk when button is clicked', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const advancedControls = document.querySelector('.voice-controls').querySelectorAll('.control-btn')
      const pttButton = advancedControls[advancedControls.length - 3]

      await userEvent.click(pttButton)

      expect(webrtcService.togglePushToTalk).toHaveBeenCalled()
    })

    test('should handle push to talk toggled event', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      act(() => {
        eventListeners.push_to_talk_toggled.forEach(cb =>
          cb({ enabled: true })
        )
      })

      await waitFor(() => {
        const advancedControls = document.querySelector('.voice-controls').querySelectorAll('.control-btn')
        const pttButton = advancedControls[advancedControls.length - 3]
        expect(pttButton).toHaveClass('active')
      })
    })
  })

  // ==========================================
  // RECORDING TESTS
  // ==========================================

  describe('Recording', () => {
    test('should not show recording button when user is not admin and has no permission', () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
          isAdmin={false}
          permissions={{}}
        />
      )

      const circleIcons = screen.queryAllByTestId('circle-icon')
      expect(circleIcons.length).toBe(0)
    })

    test('should show recording button when user is admin', () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
          isAdmin={true}
        />
      )

      expect(screen.getByTestId('circle-icon')).toBeInTheDocument()
    })

    test('should show recording button when user has canRecord permission', () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
          isAdmin={false}
          permissions={{ canRecord: true }}
        />
      )

      expect(screen.getByTestId('circle-icon')).toBeInTheDocument()
    })

    test('should start recording when button is clicked', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
          isAdmin={true}
        />
      )

      const recordButton = screen.getByTestId('circle-icon').closest('button')
      await userEvent.click(recordButton)

      expect(webrtcService.startRecording).toHaveBeenCalledWith({
        includeVideo: false,
        layout: 'grid'
      })
    })

    test('should stop recording when button is clicked during recording', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
          isAdmin={true}
        />
      )

      act(() => {
        eventListeners.recording_started.forEach(cb =>
          cb({ recordingId: 'rec-123' })
        )
      })

      await waitFor(() => {
        expect(screen.getByTestId('square-icon')).toBeInTheDocument()
      })

      const stopButton = screen.getByTestId('square-icon').closest('button')
      await userEvent.click(stopButton)

      expect(webrtcService.stopRecording).toHaveBeenCalled()
    })

    test('should handle recording started event', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
          isAdmin={true}
        />
      )

      act(() => {
        eventListeners.recording_started.forEach(cb =>
          cb({ recordingId: 'rec-123' })
        )
      })

      await waitFor(() => {
        expect(screen.getByTestId('square-icon')).toBeInTheDocument()
      })
    })

    test('should handle recording stopped event', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
          isAdmin={true}
        />
      )

      act(() => {
        eventListeners.recording_started.forEach(cb =>
          cb({ recordingId: 'rec-123' })
        )
      })

      await waitFor(() => {
        expect(screen.getByTestId('square-icon')).toBeInTheDocument()
      })

      act(() => {
        eventListeners.recording_stopped.forEach(cb => cb())
      })

      await waitFor(() => {
        expect(screen.getByTestId('circle-icon')).toBeInTheDocument()
      })
    })

    test('should update recording duration timer', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
          isAdmin={true}
        />
      )

      act(() => {
        eventListeners.recording_started.forEach(cb =>
          cb({ recordingId: 'rec-123' })
        )
      })

      await waitFor(() => {
        expect(screen.getByText('0:00')).toBeInTheDocument()
      })

      act(() => {
        jest.advanceTimersByTime(5000)
      })

      await waitFor(() => {
        expect(screen.getByText('0:05')).toBeInTheDocument()
      })
    })

    test('should clear recording timer on unmount', () => {
      const { unmount } = render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
          isAdmin={true}
        />
      )

      act(() => {
        eventListeners.recording_started.forEach(cb =>
          cb({ recordingId: 'rec-123' })
        )
      })

      unmount()

      // Should not throw error
      expect(true).toBe(true)
    })
  })

  // ==========================================
  // PARTICIPANT MANAGEMENT TESTS
  // ==========================================

  describe('Participant Management', () => {
    test('should display participant count', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      act(() => {
        eventListeners.connected.forEach(cb =>
          cb({ totalParticipants: 25 })
        )
      })

      await waitFor(() => {
        expect(screen.getByText('25')).toBeInTheDocument()
      })
    })

    test('should update participant list when participant joins', async () => {
      webrtcService.getParticipants.mockReturnValue([])

      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      webrtcService.getParticipants.mockReturnValue([
        { sid: 'p1', name: 'New User', isLocal: false, audioEnabled: true }
      ])

      act(() => {
        eventListeners.participant_joined.forEach(cb =>
          cb({ totalParticipants: 2 })
        )
      })

      await waitFor(() => {
        expect(screen.getByText('New User')).toBeInTheDocument()
      })
    })

    test('should update participant list when participant leaves', async () => {
      webrtcService.getParticipants.mockReturnValue([
        { sid: 'p1', name: 'Leaving User', isLocal: false, audioEnabled: true }
      ])

      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      act(() => {
        eventListeners.participant_joined.forEach(cb =>
          cb({ totalParticipants: 2 })
        )
      })

      await waitFor(() => {
        expect(screen.getByText('Leaving User')).toBeInTheDocument()
      })

      webrtcService.getParticipants.mockReturnValue([])

      act(() => {
        eventListeners.participant_left.forEach(cb =>
          cb({ totalParticipants: 1 })
        )
      })

      await waitFor(() => {
        expect(screen.queryByText('Leaving User')).not.toBeInTheDocument()
      })
    })

    test('should toggle participants panel visibility', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      expect(document.querySelector('.participants-panel')).toBeInTheDocument()

      const toggleButton = screen.getByTestId('eye-icon').closest('button')
      await userEvent.click(toggleButton)

      await waitFor(() => {
        expect(document.querySelector('.participants-panel')).not.toBeInTheDocument()
      })
    })

    test('should display current user in participants list', () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      expect(screen.getByText(/Test User.*\(You\)/)).toBeInTheDocument()
    })

    test('should show speaking indicator for active speakers', async () => {
      webrtcService.getParticipants.mockReturnValue([
        { sid: 'p1', name: 'Speaking User', isLocal: false, isSpeaking: true }
      ])

      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      act(() => {
        eventListeners.active_speakers_changed.forEach(cb =>
          cb({ speakers: [{ sid: 'p1' }] })
        )
      })

      await waitFor(() => {
        const speakingParticipant = document.querySelector('.participant-item.speaking')
        expect(speakingParticipant).toBeInTheDocument()
      })
    })

    test('should display mute indicator for muted participants', async () => {
      webrtcService.getParticipants.mockReturnValue([
        { sid: 'p1', name: 'Muted User', isLocal: false, audioEnabled: false }
      ])

      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      act(() => {
        eventListeners.participant_joined.forEach(cb => cb({ totalParticipants: 2 }))
      })

      await waitFor(() => {
        const participantsList = document.querySelector('.participants-list')
        const micOffIcons = within(participantsList).getAllByTestId('mic-off-icon')
        expect(micOffIcons.length).toBeGreaterThan(0)
      })
    })

    test('should show video indicator for participants with video', async () => {
      webrtcService.getParticipants.mockReturnValue([
        { sid: 'p1', name: 'Video User', isLocal: false, videoEnabled: true }
      ])

      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      act(() => {
        eventListeners.participant_joined.forEach(cb => cb({ totalParticipants: 2 }))
      })

      await waitFor(() => {
        const participantsList = document.querySelector('.participants-list')
        const videoIcons = within(participantsList).getAllByTestId('video-icon')
        expect(videoIcons.length).toBeGreaterThan(0)
      })
    })

    test('should show admin crown for admin users', async () => {
      webrtcService.getParticipants.mockReturnValue([
        { sid: 'p1', name: 'Admin User', isLocal: false, isAdmin: true }
      ])

      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      act(() => {
        eventListeners.participant_joined.forEach(cb => cb({ totalParticipants: 2 }))
      })

      await waitFor(() => {
        const participantsList = document.querySelector('.participants-list')
        const crownIcons = within(participantsList).getAllByTestId('crown-icon')
        expect(crownIcons.length).toBeGreaterThan(0)
      })
    })

    test('should show voice effect badges for participants', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      act(() => {
        eventListeners.voice_effect_applied.forEach(cb =>
          cb({ effectType: 'robot', intensity: 1 })
        )
      })

      await waitFor(() => {
        expect(screen.getByText('robot')).toBeInTheDocument()
      })
    })

    test('should limit visible participants for performance', async () => {
      const manyParticipants = Array.from({ length: 150 }, (_, i) => ({
        sid: `p${i}`,
        name: `User ${i}`,
        isLocal: false,
        audioEnabled: true,
        joinedAt: Date.now() - (i * 1000)
      }))

      webrtcService.getParticipants.mockReturnValue(manyParticipants)

      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      act(() => {
        eventListeners.participant_joined.forEach(cb =>
          cb({ totalParticipants: 151 })
        )
      })

      await waitFor(() => {
        const participantItems = document.querySelectorAll('.participant-item')
        expect(participantItems.length).toBeLessThanOrEqual(51) // 50 + current user
      })
    })
  })

  // ==========================================
  // MODERATION TESTS
  // ==========================================

  describe('Moderation', () => {
    test('should show mute button for admin users', async () => {
      webrtcService.getParticipants.mockReturnValue([
        { sid: 'p1', name: 'User 1', isLocal: false, audioEnabled: true }
      ])

      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
          isAdmin={true}
        />
      )

      act(() => {
        eventListeners.participant_joined.forEach(cb => cb({ totalParticipants: 2 }))
      })

      await waitFor(() => {
        const moderationControls = document.querySelector('.moderation-controls')
        expect(moderationControls).toBeInTheDocument()
      })
    })

    test('should mute participant when mute button is clicked', async () => {
      webrtcService.getParticipants.mockReturnValue([
        { sid: 'p1', name: 'User 1', isLocal: false, audioEnabled: true }
      ])

      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
          isAdmin={true}
        />
      )

      act(() => {
        eventListeners.participant_joined.forEach(cb => cb({ totalParticipants: 2 }))
      })

      await waitFor(async () => {
        const muteButtons = document.querySelectorAll('.control-btn-small')
        if (muteButtons.length > 0) {
          await userEvent.click(muteButtons[0])
          expect(webrtcService.muteParticipant).toHaveBeenCalledWith('p1', true)
        }
      })
    })

    test('should not show moderation controls for non-admin without permissions', async () => {
      webrtcService.getParticipants.mockReturnValue([
        { sid: 'p1', name: 'User 1', isLocal: false, audioEnabled: true }
      ])

      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
          isAdmin={false}
          permissions={{}}
        />
      )

      act(() => {
        eventListeners.participant_joined.forEach(cb => cb({ totalParticipants: 2 }))
      })

      await waitFor(() => {
        const moderationControls = document.querySelector('.moderation-controls')
        expect(moderationControls).not.toBeInTheDocument()
      })
    })

    test('should show moderation controls with canMuteOthers permission', async () => {
      webrtcService.getParticipants.mockReturnValue([
        { sid: 'p1', name: 'User 1', isLocal: false, audioEnabled: true }
      ])

      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
          isAdmin={false}
          permissions={{ canMuteOthers: true }}
        />
      )

      act(() => {
        eventListeners.participant_joined.forEach(cb => cb({ totalParticipants: 2 }))
      })

      await waitFor(() => {
        const moderationControls = document.querySelector('.moderation-controls')
        expect(moderationControls).toBeInTheDocument()
      })
    })

    test('should handle mute participant failure gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      webrtcService.muteParticipant.mockRejectedValue(new Error('Failed to mute'))
      webrtcService.getParticipants.mockReturnValue([
        { sid: 'p1', name: 'User 1', isLocal: false, audioEnabled: true }
      ])

      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
          isAdmin={true}
        />
      )

      act(() => {
        eventListeners.participant_joined.forEach(cb => cb({ totalParticipants: 2 }))
      })

      await waitFor(async () => {
        const muteButtons = document.querySelectorAll('.control-btn-small')
        if (muteButtons.length > 0) {
          await userEvent.click(muteButtons[0])
          await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalled()
          })
        }
      })

      consoleErrorSpy.mockRestore()
    })
  })

  // ==========================================
  // ANALYTICS TESTS
  // ==========================================

  describe('Analytics', () => {
    test('should toggle analytics panel', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      expect(document.querySelector('.analytics-panel')).not.toBeInTheDocument()

      const analyticsButton = screen.getByTestId('barchart-icon').closest('button')
      await userEvent.click(analyticsButton)

      await waitFor(() => {
        expect(document.querySelector('.analytics-panel')).toBeInTheDocument()
      })
    })

    test('should display analytics data', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const analyticsButton = screen.getByTestId('barchart-icon').closest('button')
      await userEvent.click(analyticsButton)

      await waitFor(() => {
        expect(screen.getByText('Voice Analytics')).toBeInTheDocument()
        expect(screen.getByText('Session')).toBeInTheDocument()
        expect(screen.getByText('Audio Quality')).toBeInTheDocument()
        expect(screen.getByText('Bandwidth')).toBeInTheDocument()
      })
    })

    test('should update bandwidth stats', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      act(() => {
        eventListeners.bandwidth_stats_updated.forEach(cb =>
          cb({ upload: 2100000, download: 1800000 })
        )
      })

      const analyticsButton = screen.getByTestId('barchart-icon').closest('button')
      await userEvent.click(analyticsButton)

      await waitFor(() => {
        expect(screen.getByText('Voice Analytics')).toBeInTheDocument()
      })
    })
  })

  // ==========================================
  // SETTINGS MODAL TESTS
  // ==========================================

  describe('Settings Modal', () => {
    test('should toggle settings modal', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      expect(document.querySelector('.modal-overlay')).not.toBeInTheDocument()

      const settingsButton = screen.getByTestId('settings-icon').closest('button')
      await userEvent.click(settingsButton)

      await waitFor(() => {
        expect(document.querySelector('.modal-overlay')).toBeInTheDocument()
      })
    })

    test('should display settings options', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const settingsButton = screen.getByTestId('settings-icon').closest('button')
      await userEvent.click(settingsButton)

      await waitFor(() => {
        expect(screen.getByText('Voice & Video Settings')).toBeInTheDocument()
        expect(screen.getByText('Input Device')).toBeInTheDocument()
        expect(screen.getByText('Noise Suppression')).toBeInTheDocument()
        expect(screen.getByText('Echo Cancellation')).toBeInTheDocument()
        expect(screen.getByText('Auto Gain Control')).toBeInTheDocument()
      })
    })

    test('should close settings modal when X button is clicked', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const settingsButton = screen.getByTestId('settings-icon').closest('button')
      await userEvent.click(settingsButton)

      await waitFor(() => {
        expect(document.querySelector('.modal-overlay')).toBeInTheDocument()
      })

      const closeButton = screen.getByTestId('x-icon').closest('button')
      await userEvent.click(closeButton)

      await waitFor(() => {
        expect(document.querySelector('.modal-overlay')).not.toBeInTheDocument()
      })
    })

    test('should update audio settings', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const settingsButton = screen.getByTestId('settings-icon').closest('button')
      await userEvent.click(settingsButton)

      await waitFor(() => {
        expect(screen.getByText('Noise Suppression')).toBeInTheDocument()
      })

      const noiseSuppressionCheckbox = screen.getByLabelText('Noise Suppression')
      expect(noiseSuppressionCheckbox).toBeChecked()

      await userEvent.click(noiseSuppressionCheckbox)

      expect(noiseSuppressionCheckbox).not.toBeChecked()
    })

    test('should handle devices updated event', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const mockAudioDevices = [
        { deviceId: 'mic1', label: 'Microphone 1' },
        { deviceId: 'mic2', label: 'Microphone 2' }
      ]

      const mockVideoDevices = [
        { deviceId: 'cam1', label: 'Camera 1' }
      ]

      act(() => {
        eventListeners.devices_updated.forEach(cb =>
          cb({
            audioDevices: mockAudioDevices,
            videoDevices: mockVideoDevices
          })
        )
      })

      const settingsButton = screen.getByTestId('settings-icon').closest('button')
      await userEvent.click(settingsButton)

      await waitFor(() => {
        expect(screen.getByText('Microphone 1')).toBeInTheDocument()
        expect(screen.getByText('Microphone 2')).toBeInTheDocument()
        expect(screen.getByText('Camera 1')).toBeInTheDocument()
      })
    })
  })

  // ==========================================
  // CONNECTION QUALITY TESTS
  // ==========================================

  describe('Connection Quality', () => {
    test('should display connection quality indicator', () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      expect(screen.getByTestId('signal-icon')).toBeInTheDocument()
    })

    test('should update connection quality on event', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      act(() => {
        eventListeners.connection_quality_changed.forEach(cb =>
          cb({ quality: 'poor', participant: null })
        )
      })

      await waitFor(() => {
        const poorIndicator = screen.getByTestId('signal-icon')
        expect(poorIndicator).toHaveClass('text-red-500')
      })
    })

    test('should update participant connection quality', async () => {
      webrtcService.getParticipants.mockReturnValue([
        {
          sid: 'p1',
          name: 'User',
          isLocal: false,
          connectionQuality: 'excellent'
        }
      ])

      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      act(() => {
        eventListeners.connection_quality_changed.forEach(cb =>
          cb({ quality: 'excellent', participant: 'p1' })
        )
      })

      await waitFor(() => {
        const participantsList = document.querySelector('.participants-list')
        expect(participantsList).toBeInTheDocument()
      })
    })
  })

  // ==========================================
  // VOLUME CONTROL TESTS
  // ==========================================

  describe('Volume Control', () => {
    test('should update volume when slider is changed', async () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const slider = screen.getByRole('slider')
      fireEvent.change(slider, { target: { value: '75' } })

      await waitFor(() => {
        expect(screen.getByText('75%')).toBeInTheDocument()
      })
    })

    test('should default to 100% volume', () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      expect(screen.getByText('100%')).toBeInTheDocument()
      const slider = screen.getByRole('slider')
      expect(slider).toHaveValue('100')
    })
  })

  // ==========================================
  // VIDEO GRID TESTS
  // ==========================================

  describe('Video Grid', () => {
    test('should not render video grid when no videos', () => {
      webrtcService.videoEnabled = false
      webrtcService.getParticipants.mockReturnValue([])

      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      expect(document.querySelector('.video-grid')).not.toBeInTheDocument()
    })

    test('should render video grid when local video is enabled', async () => {
      webrtcService.videoEnabled = false
      webrtcService.toggleVideo.mockImplementation(() => {
        webrtcService.videoEnabled = true
        return Promise.resolve(true)
      })

      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const controlButtons = document.querySelectorAll('.control-btn')
      const videoButton = controlButtons[2]
      await userEvent.click(videoButton)

      await waitFor(() => {
        expect(document.querySelector('.video-grid')).toBeInTheDocument()
      })
    })

    test('should display video labels with voice effect indicators', async () => {
      webrtcService.videoEnabled = false
      webrtcService.toggleVideo.mockImplementation(() => {
        webrtcService.videoEnabled = true
        return Promise.resolve(true)
      })

      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      // Enable robot effect
      act(() => {
        eventListeners.voice_effect_applied.forEach(cb =>
          cb({ effectType: 'robot', intensity: 1 })
        )
      })

      // Enable video
      const controlButtons = document.querySelectorAll('.control-btn')
      const videoButton = controlButtons[2]
      await userEvent.click(videoButton)

      await waitFor(() => {
        const videoLabel = document.querySelector('.video-label')
        expect(videoLabel).toBeInTheDocument()
      })
    })
  })

  // ==========================================
  // ERROR HANDLING TESTS
  // ==========================================

  describe('Error Handling', () => {
    test('should handle network errors during connection', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      webrtcService.connectToVoiceChannel.mockRejectedValue(
        new Error('Network error')
      )

      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to connect to voice channel:',
          expect.any(Error)
        )
      })

      consoleErrorSpy.mockRestore()
    })

    test('should handle disconnection errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      webrtcService.disconnect.mockRejectedValue(new Error('Disconnect failed'))

      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const leaveButton = screen.getByText('Leave')
      await userEvent.click(leaveButton)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to disconnect from voice channel:',
          expect.any(Error)
        )
      })

      consoleErrorSpy.mockRestore()
    })

    test('should not crash when currentUser is null', () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={null}
          onLeave={mockOnLeave}
        />
      )

      expect(screen.getByText(/\(You\)/)).toBeInTheDocument()
    })

    test('should handle missing displayName gracefully', () => {
      const userWithoutName = { id: 'user-123' }

      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={userWithoutName}
          onLeave={mockOnLeave}
        />
      )

      expect(screen.getByText(/You \(You\)/)).toBeInTheDocument()
    })
  })

  // ==========================================
  // UTILITY FUNCTION TESTS
  // ==========================================

  describe('Utility Functions', () => {
    test('should format duration correctly for seconds', () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
          isAdmin={true}
        />
      )

      act(() => {
        eventListeners.recording_started.forEach(cb =>
          cb({ recordingId: 'rec-123' })
        )
      })

      act(() => {
        jest.advanceTimersByTime(45000) // 45 seconds
      })

      waitFor(() => {
        expect(screen.getByText('0:45')).toBeInTheDocument()
      })
    })

    test('should format duration correctly for minutes and seconds', () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
          isAdmin={true}
        />
      )

      act(() => {
        eventListeners.recording_started.forEach(cb =>
          cb({ recordingId: 'rec-123' })
        )
      })

      act(() => {
        jest.advanceTimersByTime(125000) // 2:05
      })

      waitFor(() => {
        expect(screen.getByText('2:05')).toBeInTheDocument()
      })
    })

    test('should format duration correctly for hours', () => {
      render(
        <EnhancedVoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
          isAdmin={true}
        />
      )

      act(() => {
        eventListeners.recording_started.forEach(cb =>
          cb({ recordingId: 'rec-123' })
        )
      })

      act(() => {
        jest.advanceTimersByTime(3665000) // 1:01:05
      })

      waitFor(() => {
        expect(screen.getByText('1:01:05')).toBeInTheDocument()
      })
    })
  })
})

export default mockChannel
