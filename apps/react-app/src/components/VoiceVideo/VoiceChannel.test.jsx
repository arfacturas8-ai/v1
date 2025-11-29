import React from 'react'
import { render, screen, waitFor, within, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VoiceChannel, { VoiceStatus } from './VoiceChannel'
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
    getConnectionState: jest.fn()
  }
}))

// Mock socket service
jest.mock('../../services/socket', () => ({
  __esModule: true,
  default: {
    joinVoiceChannel: jest.fn(),
    leaveVoiceChannel: jest.fn()
  }
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Mic: () => <div data-testid="mic-icon">Mic</div>,
  MicOff: () => <div data-testid="mic-off-icon">MicOff</div>,
  Headphones: () => <div data-testid="headphones-icon">Headphones</div>,
  Video: () => <div data-testid="video-icon">Video</div>,
  VideoOff: () => <div data-testid="video-off-icon">VideoOff</div>,
  Phone: () => <div data-testid="phone-icon">Phone</div>,
  PhoneOff: () => <div data-testid="phone-off-icon">PhoneOff</div>,
  Monitor: () => <div data-testid="monitor-icon">Monitor</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>,
  Users: () => <div data-testid="users-icon">Users</div>,
  Volume2: () => <div data-testid="volume-icon">Volume</div>,
  VolumeX: () => <div data-testid="volume-x-icon">VolumeX</div>,
  MoreVertical: () => <div data-testid="more-icon">More</div>,
  UserPlus: () => <div data-testid="user-plus-icon">UserPlus</div>,
  X: () => <div data-testid="x-icon">X</div>,
  ChevronUp: () => <div data-testid="chevron-up-icon">ChevronUp</div>,
  ChevronDown: () => <div data-testid="chevron-down-icon">ChevronDown</div>,
  Signal: () => <div data-testid="signal-icon">Signal</div>,
  SignalLow: () => <div data-testid="signal-low-icon">SignalLow</div>,
  SignalMedium: () => <div data-testid="signal-medium-icon">SignalMedium</div>,
  SignalHigh: () => <div data-testid="signal-high-icon">SignalHigh</div>,
  Wifi: () => <div data-testid="wifi-icon">Wifi</div>,
  WifiOff: () => <div data-testid="wifi-off-icon">WifiOff</div>
}))

// Mock CSS imports
jest.mock('./VoiceChannel.css', () => ({}))

describe('VoiceChannel Component', () => {
  const mockChannel = {
    id: 'channel-123',
    name: 'General Voice'
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

    // Mock window.alert
    global.alert = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  // ==========================================
  // RENDERING AND INITIALIZATION TESTS
  // ==========================================

  describe('Rendering', () => {
    test('should render null when channel is not provided', () => {
      const { container } = render(
        <VoiceChannel
          channel={null}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      expect(container.firstChild).toBeNull()
    })

    test('should render voice channel container when channel is provided', () => {
      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const container = document.querySelector('.voice-channel-container')
      expect(container).toBeInTheDocument()
    })

    test('should display channel name', () => {
      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      expect(screen.getByText('General Voice')).toBeInTheDocument()
    })

    test('should show connecting status initially', () => {
      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      expect(screen.getByText('Connecting...')).toBeInTheDocument()
    })

    test('should render all control buttons', () => {
      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      expect(screen.getByText('Mute')).toBeInTheDocument()
      expect(screen.getByText('Deafen')).toBeInTheDocument()
      expect(screen.getByText('Start Video')).toBeInTheDocument()
      expect(screen.getByText('Share Screen')).toBeInTheDocument()
      expect(screen.getByText('Leave')).toBeInTheDocument()
    })

    test('should render settings button', () => {
      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      expect(screen.getByTestId('settings-icon')).toBeInTheDocument()
    })

    test('should render participants toggle button', () => {
      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      expect(screen.getByTestId('users-icon')).toBeInTheDocument()
    })

    test('should render volume control slider', () => {
      render(
        <VoiceChannel
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
    })
  })

  // ==========================================
  // CONNECTION TESTS
  // ==========================================

  describe('Connection Management', () => {
    test('should connect to voice channel on mount', async () => {
      render(
        <VoiceChannel
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
        'mock-access-token'
      )
    })

    test('should show connected status after successful connection', async () => {
      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      // Trigger connected event
      act(() => {
        eventListeners.connected.forEach(cb =>
          cb({ localParticipant: {}, room: {} })
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
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          'Failed to connect to voice channel. Please try again.'
        )
      })
    })

    test('should clean up event listeners on unmount', async () => {
      const { unmount } = render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      // Simulate successful connection by triggering the connected event
      await act(async () => {
        eventListeners.connected.forEach(cb =>
          cb({ localParticipant: {}, room: {} })
        )
      })

      // Wait for UI to update
      await waitFor(() => {
        expect(screen.getByText('Voice Connected')).toBeInTheDocument()
      })

      // Clear mock calls before unmount
      jest.clearAllMocks()

      // Now unmount - should remove event listeners
      unmount()

      // Verify event listeners were removed (not checking disconnect since it's async)
      expect(webrtcService.off).toHaveBeenCalledWith('connected', expect.any(Function))
      expect(webrtcService.off).toHaveBeenCalledWith('disconnected', expect.any(Function))
      expect(webrtcService.off).toHaveBeenCalledWith('participant_joined', expect.any(Function))
      expect(webrtcService.off).toHaveBeenCalledWith('participant_left', expect.any(Function))
    })

    test('should register all event listeners on mount', () => {
      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      expect(webrtcService.on).toHaveBeenCalledWith('connected', expect.any(Function))
      expect(webrtcService.on).toHaveBeenCalledWith('disconnected', expect.any(Function))
      expect(webrtcService.on).toHaveBeenCalledWith('participant_joined', expect.any(Function))
      expect(webrtcService.on).toHaveBeenCalledWith('participant_left', expect.any(Function))
      expect(webrtcService.on).toHaveBeenCalledWith('active_speakers_changed', expect.any(Function))
      expect(webrtcService.on).toHaveBeenCalledWith('connection_quality_changed', expect.any(Function))
    })

    test('should unregister all event listeners on unmount', () => {
      const { unmount } = render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      unmount()

      expect(webrtcService.off).toHaveBeenCalledWith('connected', expect.any(Function))
      expect(webrtcService.off).toHaveBeenCalledWith('disconnected', expect.any(Function))
      expect(webrtcService.off).toHaveBeenCalledWith('participant_joined', expect.any(Function))
      expect(webrtcService.off).toHaveBeenCalledWith('participant_left', expect.any(Function))
      expect(webrtcService.off).toHaveBeenCalledWith('active_speakers_changed', expect.any(Function))
      expect(webrtcService.off).toHaveBeenCalledWith('connection_quality_changed', expect.any(Function))
    })

    test('should handle disconnected event', async () => {
      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      // First connect
      act(() => {
        eventListeners.connected.forEach(cb =>
          cb({ localParticipant: {}, room: {} })
        )
      })

      // Then disconnect
      act(() => {
        eventListeners.disconnected.forEach(cb => cb())
      })

      await waitFor(() => {
        expect(screen.getByText('Connecting...')).toBeInTheDocument()
      })
    })

    test('should handle access token generation failure', async () => {
      webrtcService.generateAccessToken.mockRejectedValue(
        new Error('Failed to generate token')
      )

      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          'Failed to connect to voice channel. Please try again.'
        )
      })
    })

    test('should call onLeave when disconnecting', async () => {
      render(
        <VoiceChannel
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
  })

  // ==========================================
  // AUDIO CONTROL TESTS
  // ==========================================

  describe('Audio Controls', () => {
    test('should toggle mute when mute button is clicked', async () => {
      webrtcService.audioEnabled = true

      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const muteButton = screen.getByText('Mute')
      await userEvent.click(muteButton)

      expect(webrtcService.toggleAudio).toHaveBeenCalled()
    })

    test('should update UI when muted', async () => {
      webrtcService.audioEnabled = true

      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const muteButton = screen.getByText('Mute')

      // Mock the toggle to change audioEnabled state
      webrtcService.toggleAudio.mockImplementation(() => {
        webrtcService.audioEnabled = false
        return Promise.resolve(true)
      })

      await userEvent.click(muteButton)

      await waitFor(() => {
        expect(screen.getByText('Unmute')).toBeInTheDocument()
      }, { timeout: 2000 })
    })

    test('should disable mute button when deafened', async () => {
      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      // First deafen
      const deafenButton = screen.getByText('Deafen')
      await userEvent.click(deafenButton)

      await waitFor(() => {
        const muteButton = screen.getByText('Unmute').closest('button')
        expect(muteButton).toBeDisabled()
      })
    })

    test('should handle mute toggle failure gracefully', async () => {
      webrtcService.toggleAudio.mockRejectedValue(new Error('Failed to toggle audio'))

      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const muteButton = screen.getByText('Mute')
      await userEvent.click(muteButton)

      // Should not crash or show error to user (console.error is called)
      expect(screen.getByText('Mute')).toBeInTheDocument()
    })

    test('should show mic icon when not muted', () => {
      webrtcService.audioEnabled = true

      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const muteButton = screen.getByText('Mute').closest('button')
      expect(within(muteButton).getByTestId('mic-icon')).toBeInTheDocument()
    })

    test('should show mic-off icon when muted', async () => {
      webrtcService.audioEnabled = true

      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      // Mock successful toggle
      webrtcService.toggleAudio.mockImplementation(() => {
        webrtcService.audioEnabled = false
        return Promise.resolve(true)
      })

      const muteButton = screen.getByText('Mute')
      await userEvent.click(muteButton)

      await waitFor(() => {
        const unmuteButton = screen.getByText('Unmute').closest('button')
        expect(within(unmuteButton).getByTestId('mic-off-icon')).toBeInTheDocument()
      })
    })
  })

  // ==========================================
  // DEAFEN TESTS
  // ==========================================

  describe('Deafen Controls', () => {
    test('should toggle deafen when deafen button is clicked', async () => {
      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const deafenButton = screen.getByText('Deafen')
      await userEvent.click(deafenButton)

      await waitFor(() => {
        expect(screen.getByText('Undeafen')).toBeInTheDocument()
      })
    })

    test('should disable audio when deafened', async () => {
      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const deafenButton = screen.getByText('Deafen')
      await userEvent.click(deafenButton)

      await waitFor(() => {
        expect(webrtcService.disableAudio).toHaveBeenCalled()
      })
    })

    test('should show volume-x icon when deafened', async () => {
      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const deafenButton = screen.getByText('Deafen')
      await userEvent.click(deafenButton)

      await waitFor(() => {
        const undeafenButton = screen.getByText('Undeafen').closest('button')
        expect(within(undeafenButton).getByTestId('volume-x-icon')).toBeInTheDocument()
      })
    })

    test('should show headphones icon when not deafened', () => {
      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const deafenButton = screen.getByText('Deafen').closest('button')
      expect(within(deafenButton).getByTestId('headphones-icon')).toBeInTheDocument()
    })

    test('should automatically mute when deafened', async () => {
      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const deafenButton = screen.getByText('Deafen')
      await userEvent.click(deafenButton)

      await waitFor(() => {
        expect(screen.getByText('Unmute')).toBeInTheDocument()
      })
    })
  })

  // ==========================================
  // VIDEO CONTROL TESTS
  // ==========================================

  describe('Video Controls', () => {
    test('should toggle video when video button is clicked', async () => {
      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const videoButton = screen.getByText('Start Video')
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
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const videoButton = screen.getByText('Start Video')
      await userEvent.click(videoButton)

      await waitFor(() => {
        expect(screen.getByText('Stop Video')).toBeInTheDocument()
      })
    })

    test('should handle video toggle failure gracefully', async () => {
      webrtcService.toggleVideo.mockRejectedValue(new Error('Failed to toggle video'))

      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const videoButton = screen.getByText('Start Video')
      await userEvent.click(videoButton)

      expect(screen.getByText('Start Video')).toBeInTheDocument()
    })

    test('should show video icon when video is off', () => {
      webrtcService.videoEnabled = false

      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const videoButton = screen.getByText('Start Video').closest('button')
      expect(within(videoButton).getByTestId('video-icon')).toBeInTheDocument()
    })

    test('should show video-off icon when video is on', async () => {
      webrtcService.videoEnabled = false
      webrtcService.toggleVideo.mockImplementation(() => {
        webrtcService.videoEnabled = true
        return Promise.resolve(true)
      })

      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const videoButton = screen.getByText('Start Video')
      await userEvent.click(videoButton)

      await waitFor(() => {
        const stopButton = screen.getByText('Stop Video').closest('button')
        expect(within(stopButton).getByTestId('video-off-icon')).toBeInTheDocument()
      })
    })

    test('should render local video element when video is enabled', async () => {
      webrtcService.videoEnabled = false
      webrtcService.toggleVideo.mockImplementation(() => {
        webrtcService.videoEnabled = true
        return Promise.resolve(true)
      })

      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const videoButton = screen.getByText('Start Video')
      await userEvent.click(videoButton)

      await waitFor(() => {
        const videoGrid = document.querySelector('.video-grid')
        expect(videoGrid).toBeInTheDocument()
      })
    })
  })

  // ==========================================
  // SCREEN SHARING TESTS
  // ==========================================

  describe('Screen Sharing', () => {
    test('should toggle screen share when button is clicked', async () => {
      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const shareButton = screen.getByText('Share Screen')
      await userEvent.click(shareButton)

      expect(webrtcService.toggleScreenShare).toHaveBeenCalled()
    })

    test('should update UI when screen sharing is enabled', async () => {
      webrtcService.screenShareEnabled = false
      webrtcService.toggleScreenShare.mockImplementation(() => {
        webrtcService.screenShareEnabled = true
        return Promise.resolve(true)
      })

      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const shareButton = screen.getByText('Share Screen')
      await userEvent.click(shareButton)

      await waitFor(() => {
        expect(screen.getByText('Stop Share')).toBeInTheDocument()
      })
    })

    test('should handle screen share toggle failure gracefully', async () => {
      webrtcService.toggleScreenShare.mockRejectedValue(
        new Error('Failed to toggle screen share')
      )

      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const shareButton = screen.getByText('Share Screen')
      await userEvent.click(shareButton)

      expect(screen.getByText('Share Screen')).toBeInTheDocument()
    })

    test('should show monitor icon for screen share button', () => {
      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const shareButton = screen.getByText('Share Screen').closest('button')
      expect(within(shareButton).getByTestId('monitor-icon')).toBeInTheDocument()
    })

    test('should apply active class when screen sharing', async () => {
      webrtcService.screenShareEnabled = false
      webrtcService.toggleScreenShare.mockImplementation(() => {
        webrtcService.screenShareEnabled = true
        return Promise.resolve(true)
      })

      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const shareButton = screen.getByText('Share Screen')
      await userEvent.click(shareButton)

      await waitFor(() => {
        const button = screen.getByText('Stop Share').closest('button')
        expect(button).toHaveClass('active')
      })
    })
  })

  // ==========================================
  // PARTICIPANT MANAGEMENT TESTS
  // ==========================================

  describe('Participant Management', () => {
    test('should display participant count', async () => {
      webrtcService.getParticipants.mockReturnValue([
        { sid: 'p1', name: 'User 1', isLocal: false },
        { sid: 'p2', name: 'User 2', isLocal: false }
      ])

      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      // Trigger connected event to update participants
      act(() => {
        eventListeners.connected.forEach(cb =>
          cb({ localParticipant: {}, room: {} })
        )
      })

      await waitFor(() => {
        const participantCount = screen.getByText('2')
        expect(participantCount).toBeInTheDocument()
      })
    })

    test('should update participant list when participant joins', async () => {
      webrtcService.getParticipants.mockReturnValue([])

      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      // Initially no participants
      expect(screen.getByText('0')).toBeInTheDocument()

      // Simulate participant joining
      webrtcService.getParticipants.mockReturnValue([
        { sid: 'p1', name: 'New User', isLocal: false }
      ])

      act(() => {
        eventListeners.participant_joined.forEach(cb => cb())
      })

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument()
      })
    })

    test('should update participant list when participant leaves', async () => {
      webrtcService.getParticipants.mockReturnValue([
        { sid: 'p1', name: 'User 1', isLocal: false }
      ])

      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      // First trigger connected to show initial participant
      act(() => {
        eventListeners.connected.forEach(cb =>
          cb({ localParticipant: {}, room: {} })
        )
      })

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument()
      })

      // Simulate participant leaving
      webrtcService.getParticipants.mockReturnValue([])

      act(() => {
        eventListeners.participant_left.forEach(cb => cb())
      })

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument()
      })
    })

    test('should toggle participants panel visibility', async () => {
      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      // Participants panel should be visible by default
      expect(document.querySelector('.participants-panel')).toBeInTheDocument()

      // Click to hide
      const toggleButton = screen.getByTestId('users-icon').closest('button')
      await userEvent.click(toggleButton)

      await waitFor(() => {
        expect(document.querySelector('.participants-panel')).not.toBeInTheDocument()
      })

      // Click to show again
      await userEvent.click(toggleButton)

      await waitFor(() => {
        expect(document.querySelector('.participants-panel')).toBeInTheDocument()
      })
    })

    test('should display current user in participants list', () => {
      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      expect(screen.getByText(/Test User.*\(You\)/)).toBeInTheDocument()
    })

    test('should display remote participants in list', async () => {
      webrtcService.getParticipants.mockReturnValue([
        { sid: 'p1', name: 'Remote User', isLocal: false, audioEnabled: true }
      ])

      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      // Trigger participant update
      act(() => {
        eventListeners.participant_joined.forEach(cb => cb())
      })

      await waitFor(() => {
        expect(screen.getByText('Remote User')).toBeInTheDocument()
      })
    })

    test('should show mute indicator for muted participants', async () => {
      webrtcService.getParticipants.mockReturnValue([
        {
          sid: 'p1',
          name: 'Muted User',
          isLocal: false,
          audioEnabled: false
        }
      ])

      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      act(() => {
        eventListeners.participant_joined.forEach(cb => cb())
      })

      await waitFor(() => {
        const participantsList = document.querySelector('.participants-list')
        const micOffIcons = within(participantsList).getAllByTestId('mic-off-icon')
        expect(micOffIcons.length).toBeGreaterThan(0)
      })
    })

    test('should show video indicator for participants with video', async () => {
      webrtcService.getParticipants.mockReturnValue([
        {
          sid: 'p1',
          name: 'Video User',
          isLocal: false,
          videoEnabled: true
        }
      ])

      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      act(() => {
        eventListeners.participant_joined.forEach(cb => cb())
      })

      await waitFor(() => {
        const participantsList = document.querySelector('.participants-list')
        const videoIcons = within(participantsList).getAllByTestId('video-icon')
        expect(videoIcons.length).toBeGreaterThan(0)
      })
    })

    test('should show screen share indicator for participants sharing screen', async () => {
      webrtcService.getParticipants.mockReturnValue([
        {
          sid: 'p1',
          name: 'Sharing User',
          isLocal: false,
          screenShareEnabled: true
        }
      ])

      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      act(() => {
        eventListeners.participant_joined.forEach(cb => cb())
      })

      await waitFor(() => {
        const participantsList = document.querySelector('.participants-list')
        const monitorIcons = within(participantsList).getAllByTestId('monitor-icon')
        expect(monitorIcons.length).toBeGreaterThan(0)
      })
    })

    test('should show speaking indicator for active speakers', async () => {
      webrtcService.getParticipants.mockReturnValue([
        {
          sid: 'p1',
          name: 'Speaking User',
          isLocal: false,
          isSpeaking: true
        }
      ])

      render(
        <VoiceChannel
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
  })

  // ==========================================
  // CONNECTION QUALITY TESTS
  // ==========================================

  describe('Connection Quality', () => {
    test('should display connection quality indicator', () => {
      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const qualityIndicator = document.querySelector('.connection-indicator')
      expect(qualityIndicator).toBeInTheDocument()
    })

    test('should update connection quality on event', async () => {
      render(
        <VoiceChannel
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
        const qualityIndicator = document.querySelector('.connection-indicator')
        expect(qualityIndicator).toHaveStyle({ color: '#d63031' })
      })
    })

    test('should show excellent quality icon', async () => {
      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      act(() => {
        eventListeners.connection_quality_changed.forEach(cb =>
          cb({ quality: 'excellent', participant: null })
        )
      })

      await waitFor(() => {
        expect(screen.getByTestId('signal-high-icon')).toBeInTheDocument()
      })
    })

    test('should show good quality icon', () => {
      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      // Default quality is 'good'
      expect(screen.getByTestId('signal-icon')).toBeInTheDocument()
    })

    test('should show medium quality icon', async () => {
      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      act(() => {
        eventListeners.connection_quality_changed.forEach(cb =>
          cb({ quality: 'medium', participant: null })
        )
      })

      await waitFor(() => {
        expect(screen.getByTestId('signal-medium-icon')).toBeInTheDocument()
      })
    })

    test('should show poor quality icon', async () => {
      render(
        <VoiceChannel
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
        expect(screen.getByTestId('signal-low-icon')).toBeInTheDocument()
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
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      act(() => {
        eventListeners.participant_joined.forEach(cb => cb())
      })

      await waitFor(() => {
        const participantsList = document.querySelector('.participants-list')
        const signalIcons = within(participantsList).getAllByTestId('signal-high-icon')
        expect(signalIcons.length).toBeGreaterThan(0)
      })
    })
  })

  // ==========================================
  // SETTINGS PANEL TESTS
  // ==========================================

  describe('Settings Panel', () => {
    test('should toggle settings panel', async () => {
      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      // Settings panel should be hidden by default
      expect(document.querySelector('.voice-settings')).not.toBeInTheDocument()

      // Click to show
      const settingsButton = screen.getByTestId('settings-icon').closest('button')
      await userEvent.click(settingsButton)

      await waitFor(() => {
        expect(document.querySelector('.voice-settings')).toBeInTheDocument()
      })
    })

    test('should display settings options', async () => {
      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const settingsButton = screen.getByTestId('settings-icon').closest('button')
      await userEvent.click(settingsButton)

      await waitFor(() => {
        expect(screen.getByText('Voice Settings')).toBeInTheDocument()
        expect(screen.getByText('Input Device')).toBeInTheDocument()
        expect(screen.getByText('Output Device')).toBeInTheDocument()
        expect(screen.getByText('Noise Suppression')).toBeInTheDocument()
        expect(screen.getByText('Echo Cancellation')).toBeInTheDocument()
        expect(screen.getByText('Automatic Gain Control')).toBeInTheDocument()
      })
    })

    test('should close settings panel when X button is clicked', async () => {
      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const settingsButton = screen.getByTestId('settings-icon').closest('button')
      await userEvent.click(settingsButton)

      await waitFor(() => {
        expect(document.querySelector('.voice-settings')).toBeInTheDocument()
      })

      const closeButton = screen.getByTestId('x-icon').closest('button')
      await userEvent.click(closeButton)

      await waitFor(() => {
        expect(document.querySelector('.voice-settings')).not.toBeInTheDocument()
      })
    })

    test('should have checkboxes checked by default', async () => {
      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const settingsButton = screen.getByTestId('settings-icon').closest('button')
      await userEvent.click(settingsButton)

      await waitFor(() => {
        const checkboxes = document.querySelectorAll('.voice-settings input[type="checkbox"]')
        checkboxes.forEach(checkbox => {
          expect(checkbox).toBeChecked()
        })
      })
    })
  })

  // ==========================================
  // VOLUME CONTROL TESTS
  // ==========================================

  describe('Volume Control', () => {
    test('should update volume when slider is changed', async () => {
      const { container } = render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const slider = screen.getByRole('slider')

      // Simulate slider change by firing change event
      fireEvent.change(slider, { target: { value: '50' } })

      // Check if volume display is updated
      await waitFor(() => {
        expect(screen.getByText('50%')).toBeInTheDocument()
      })
    })

    test('should default to 100% volume', () => {
      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      expect(screen.getByText('100%')).toBeInTheDocument()
      const slider = screen.getByRole('slider')
      expect(slider).toHaveValue('100')
    })

    test('should display volume icon', () => {
      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const volumeControl = document.querySelector('.volume-control')
      expect(within(volumeControl).getByTestId('volume-icon')).toBeInTheDocument()
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
        <VoiceChannel
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
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const videoButton = screen.getByText('Start Video')
      await userEvent.click(videoButton)

      await waitFor(() => {
        expect(document.querySelector('.video-grid')).toBeInTheDocument()
      })
    })

    test('should render video grid when remote participant has video', async () => {
      webrtcService.getParticipants.mockReturnValue([
        {
          sid: 'p1',
          name: 'Video User',
          isLocal: false,
          videoEnabled: true,
          hasVideo: true
        }
      ])

      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      act(() => {
        eventListeners.participant_joined.forEach(cb => cb())
      })

      await waitFor(() => {
        expect(document.querySelector('.video-grid')).toBeInTheDocument()
      }, { timeout: 2000 })
    })

    test('should render local video element with correct attributes', async () => {
      webrtcService.videoEnabled = false

      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      webrtcService.toggleVideo.mockImplementation(() => {
        webrtcService.videoEnabled = true
        return Promise.resolve(true)
      })

      const videoButton = screen.getByText('Start Video')
      await userEvent.click(videoButton)

      await waitFor(() => {
        const localVideo = document.querySelector('.video-container.local video')
        expect(localVideo).toBeInTheDocument()
        expect(localVideo.autoplay).toBe(true)
        expect(localVideo.muted).toBe(true)
        expect(localVideo.playsInline).toBe(true)
      }, { timeout: 2000 })
    })

    test('should render remote video elements', async () => {
      webrtcService.getParticipants.mockReturnValue([
        {
          sid: 'p1',
          name: 'Video User',
          isLocal: false,
          videoEnabled: true,
          hasVideo: true
        }
      ])

      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      act(() => {
        eventListeners.participant_joined.forEach(cb => cb())
      })

      await waitFor(() => {
        const remoteVideos = document.querySelectorAll('.video-container:not(.local) video')
        expect(remoteVideos.length).toBe(1)
      }, { timeout: 2000 })
    })

    test('should display video labels', async () => {
      webrtcService.videoEnabled = false
      webrtcService.toggleVideo.mockImplementation(() => {
        webrtcService.videoEnabled = true
        return Promise.resolve(true)
      })

      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      const videoButton = screen.getByText('Start Video')
      await userEvent.click(videoButton)

      await waitFor(() => {
        const videoLabel = document.querySelector('.video-label')
        expect(videoLabel).toHaveTextContent('You')
      })
    })

    test('should show screen share indicator on video', async () => {
      webrtcService.getParticipants.mockReturnValue([
        {
          sid: 'p1',
          name: 'Sharing User',
          isLocal: false,
          screenShareEnabled: true,
          isScreenSharing: true
        }
      ])

      render(
        <VoiceChannel
          channel={mockChannel}
          currentUser={mockCurrentUser}
          onLeave={mockOnLeave}
        />
      )

      act(() => {
        eventListeners.participant_joined.forEach(cb => cb())
      })

      await waitFor(() => {
        expect(screen.getByText('Screen Share')).toBeInTheDocument()
      }, { timeout: 2000 })
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
        <VoiceChannel
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
        <VoiceChannel
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
        <VoiceChannel
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
        <VoiceChannel
          channel={mockChannel}
          currentUser={userWithoutName}
          onLeave={mockOnLeave}
        />
      )

      expect(screen.getByText(/You \(You\)/)).toBeInTheDocument()
    })
  })
})

// ==========================================
// VOICE STATUS COMPONENT TESTS
// ==========================================

describe('VoiceStatus Component', () => {
  const mockChannel = {
    id: 'channel-123',
    name: 'General Voice'
  }

  const mockOnToggleMute = jest.fn()
  const mockOnReopen = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    test('should render null when channel is not provided', () => {
      const { container } = render(
        <VoiceStatus
          channel={null}
          isConnected={true}
          isMuted={false}
          onToggleMute={mockOnToggleMute}
          onReopen={mockOnReopen}
        />
      )

      expect(container.firstChild).toBeNull()
    })

    test('should render null when not connected', () => {
      const { container } = render(
        <VoiceStatus
          channel={mockChannel}
          isConnected={false}
          isMuted={false}
          onToggleMute={mockOnToggleMute}
          onReopen={mockOnReopen}
        />
      )

      expect(container.firstChild).toBeNull()
    })

    test('should render voice status bar when connected', () => {
      render(
        <VoiceStatus
          channel={mockChannel}
          isConnected={true}
          isMuted={false}
          onToggleMute={mockOnToggleMute}
          onReopen={mockOnReopen}
        />
      )

      const statusBar = document.querySelector('.voice-status-bar')
      expect(statusBar).toBeInTheDocument()
    })

    test('should display channel name', () => {
      render(
        <VoiceStatus
          channel={mockChannel}
          isConnected={true}
          isMuted={false}
          onToggleMute={mockOnToggleMute}
          onReopen={mockOnReopen}
        />
      )

      expect(screen.getByText('Voice Connected - General Voice')).toBeInTheDocument()
    })

    test('should render mute button', () => {
      render(
        <VoiceStatus
          channel={mockChannel}
          isConnected={true}
          isMuted={false}
          onToggleMute={mockOnToggleMute}
          onReopen={mockOnReopen}
        />
      )

      const muteButton = document.querySelector('.mini-mute')
      expect(muteButton).toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    test('should call onReopen when status bar is clicked', async () => {
      render(
        <VoiceStatus
          channel={mockChannel}
          isConnected={true}
          isMuted={false}
          onToggleMute={mockOnToggleMute}
          onReopen={mockOnReopen}
        />
      )

      const statusBar = document.querySelector('.voice-status-bar')
      await userEvent.click(statusBar)

      expect(mockOnReopen).toHaveBeenCalledTimes(1)
    })

    test('should call onToggleMute when mute button is clicked', async () => {
      render(
        <VoiceStatus
          channel={mockChannel}
          isConnected={true}
          isMuted={false}
          onToggleMute={mockOnToggleMute}
          onReopen={mockOnReopen}
        />
      )

      const muteButton = document.querySelector('.mini-mute')
      await userEvent.click(muteButton)

      expect(mockOnToggleMute).toHaveBeenCalledTimes(1)
    })

    test('should not call onReopen when mute button is clicked', async () => {
      render(
        <VoiceStatus
          channel={mockChannel}
          isConnected={true}
          isMuted={false}
          onToggleMute={mockOnToggleMute}
          onReopen={mockOnReopen}
        />
      )

      const muteButton = document.querySelector('.mini-mute')
      await userEvent.click(muteButton)

      expect(mockOnReopen).not.toHaveBeenCalled()
    })

    test('should show mic icon when not muted', () => {
      render(
        <VoiceStatus
          channel={mockChannel}
          isConnected={true}
          isMuted={false}
          onToggleMute={mockOnToggleMute}
          onReopen={mockOnReopen}
        />
      )

      expect(screen.getByTestId('mic-icon')).toBeInTheDocument()
    })

    test('should show mic-off icon when muted', () => {
      render(
        <VoiceStatus
          channel={mockChannel}
          isConnected={true}
          isMuted={true}
          onToggleMute={mockOnToggleMute}
          onReopen={mockOnReopen}
        />
      )

      expect(screen.getByTestId('mic-off-icon')).toBeInTheDocument()
    })

    test('should apply muted class when muted', () => {
      render(
        <VoiceStatus
          channel={mockChannel}
          isConnected={true}
          isMuted={true}
          onToggleMute={mockOnToggleMute}
          onReopen={mockOnReopen}
        />
      )

      const muteButton = document.querySelector('.mini-mute')
      expect(muteButton).toHaveClass('muted')
    })

    test('should not apply muted class when not muted', () => {
      render(
        <VoiceStatus
          channel={mockChannel}
          isConnected={true}
          isMuted={false}
          onToggleMute={mockOnToggleMute}
          onReopen={mockOnReopen}
        />
      )

      const muteButton = document.querySelector('.mini-mute')
      expect(muteButton).not.toHaveClass('muted')
    })
  })
})

export default mockChannel
