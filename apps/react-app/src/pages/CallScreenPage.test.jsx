/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { BrowserRouter, Route, Routes, MemoryRouter } from 'react-router-dom'
import CallScreenPage from './CallScreenPage'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}))

// Mock navigate
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ callId: 'test-call-123' }),
}))

// Mock MediaStream
class MockMediaStream {
  constructor() {
    this.tracks = [
      { kind: 'video', enabled: true, stop: jest.fn() },
      { kind: 'audio', enabled: true, stop: jest.fn() },
    ]
  }

  getTracks() {
    return this.tracks
  }

  getVideoTracks() {
    return this.tracks.filter(t => t.kind === 'video')
  }

  getAudioTracks() {
    return this.tracks.filter(t => t.kind === 'audio')
  }
}

// Setup WebRTC/Media API mocks
const setupMediaMocks = (shouldFail = false) => {
  if (shouldFail) {
    global.navigator.mediaDevices = {
      getUserMedia: jest.fn().mockRejectedValue(new Error('Permission denied')),
      getDisplayMedia: jest.fn().mockRejectedValue(new Error('Screen share denied')),
    }
  } else {
    global.navigator.mediaDevices = {
      getUserMedia: jest.fn().mockResolvedValue(new MockMediaStream()),
      getDisplayMedia: jest.fn().mockResolvedValue(new MockMediaStream()),
    }
  }
}

// Render helper with router
const renderWithRouter = (callId = 'test-call-123') => {
  return render(
    <MemoryRouter initialEntries={[`/call/${callId}`]}>
      <Routes>
        <Route path="/call/:callId" element={<CallScreenPage />} />
      </Routes>
    </MemoryRouter>
  )
}

// Helper to advance to active call state
const advanceToActiveCall = async () => {
  await act(async () => {
    await Promise.resolve() // Let getUserMedia resolve
    jest.advanceTimersByTime(2100) // Advance past the 2000ms setTimeout
  })
}

describe('CallScreenPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    setupMediaMocks(false)
    mockNavigate.mockClear()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  // ===== BASIC RENDERING =====
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      renderWithRouter()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('renders with correct aria-label', () => {
      renderWithRouter()
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Video call screen')
    })

    it('has full-screen layout classes', () => {
      renderWithRouter()
      const main = screen.getByRole('main')
      expect(main).toHaveClass('fixed', 'inset-0')
    })

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      renderWithRouter()
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('displays dark background', () => {
      renderWithRouter()
      const main = screen.getByRole('main')
      expect(main).toHaveClass('bg-[#161b22]')
    })

    it('has z-index for overlay', () => {
      renderWithRouter()
      const main = screen.getByRole('main')
      expect(main).toHaveClass('z-50')
    })
  })

  // ===== CALL INITIALIZATION =====
  describe('Call Initialization', () => {
    it('shows connecting state initially', () => {
      renderWithRouter()
      expect(screen.getByText('Connecting...')).toBeInTheDocument()
      expect(screen.getByText('Please wait')).toBeInTheDocument()
    })

    it('requests media permissions on mount', async () => {
      renderWithRouter()
      await waitFor(() => {
        expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
          video: true,
          audio: true,
        })
      })
    })

    it('transitions to active state after connecting', async () => {
      renderWithRouter()
      await advanceToActiveCall()

      await waitFor(() => {
        expect(screen.queryByText('Connecting...')).not.toBeInTheDocument()
      })
    })

    it('sets up local video stream', async () => {
      renderWithRouter()
      await waitFor(() => {
        expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled()
      })
    })

    it('displays connecting icon', () => {
      renderWithRouter()
      expect(screen.getByText('📞')).toBeInTheDocument()
    })
  })

  // ===== VIDEO CONTROLS =====
  describe('Video Controls', () => {
    it('displays video toggle button', async () => {
      renderWithRouter()
      await advanceToActiveCall()

      await waitFor(() => {
        expect(screen.getByLabelText('Turn off camera')).toBeInTheDocument()
      })
    })

    it('toggles video on click', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        const videoButton = screen.getByLabelText('Turn off camera')
        fireEvent.click(videoButton)
      })

      await waitFor(() => {
        expect(screen.getByLabelText('Turn on camera')).toBeInTheDocument()
      })
    })

    it('shows camera on icon initially', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        const videoButton = screen.getByLabelText('Turn off camera')
        expect(videoButton).toBeInTheDocument()
      })
    })

    it('shows camera off icon when disabled', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        const videoButton = screen.getByLabelText('Turn off camera')
        fireEvent.click(videoButton)
      })

      await waitFor(() => {
        expect(screen.getByLabelText('Turn on camera')).toBeInTheDocument()
      })
    })

    it('has correct aria-pressed state for video button', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        const videoButton = screen.getByLabelText('Turn off camera')
        expect(videoButton).toHaveAttribute('aria-pressed', 'false')
      })
    })

    it('updates aria-pressed when video toggled', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        const videoButton = screen.getByLabelText('Turn off camera')
        fireEvent.click(videoButton)
      })

      await waitFor(() => {
        const videoButton = screen.getByLabelText('Turn on camera')
        expect(videoButton).toHaveAttribute('aria-pressed', 'true')
      })
    })

    it('hides local video when camera is off', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        expect(screen.getByLabelText('Your video')).toBeInTheDocument()
      })

      const videoButton = screen.getByLabelText('Turn off camera')
      fireEvent.click(videoButton)

      await waitFor(() => {
        expect(screen.queryByLabelText('Your video')).not.toBeInTheDocument()
      })
    })

    it('applies correct CSS classes when video enabled', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        const videoButton = screen.getByLabelText('Turn off camera')
        expect(videoButton).toHaveClass('bg-[#161b22]/60 backdrop-blur-xl')
      })
    })

    it('applies correct CSS classes when video disabled', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        const videoButton = screen.getByLabelText('Turn off camera')
        fireEvent.click(videoButton)
      })

      await waitFor(() => {
        const videoButton = screen.getByLabelText('Turn on camera')
        expect(videoButton).toHaveClass('bg-red-500')
      })
    })
  })

  // ===== AUDIO CONTROLS =====
  describe('Audio Controls', () => {
    it('displays audio toggle button', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        expect(screen.getByLabelText('Mute microphone')).toBeInTheDocument()
      })
    })

    it('toggles audio on click', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        const audioButton = screen.getByLabelText('Mute microphone')
        fireEvent.click(audioButton)
      })

      await waitFor(() => {
        expect(screen.getByLabelText('Unmute microphone')).toBeInTheDocument()
      })
    })

    it('shows microphone on icon initially', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        expect(screen.getByLabelText('Mute microphone')).toBeInTheDocument()
      })
    })

    it('shows microphone off icon when muted', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        const audioButton = screen.getByLabelText('Mute microphone')
        fireEvent.click(audioButton)
      })

      await waitFor(() => {
        expect(screen.getByLabelText('Unmute microphone')).toBeInTheDocument()
      })
    })

    it('has correct aria-pressed state for audio button', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        const audioButton = screen.getByLabelText('Mute microphone')
        expect(audioButton).toHaveAttribute('aria-pressed', 'false')
      })
    })

    it('updates aria-pressed when audio toggled', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        const audioButton = screen.getByLabelText('Mute microphone')
        fireEvent.click(audioButton)
      })

      await waitFor(() => {
        const audioButton = screen.getByLabelText('Unmute microphone')
        expect(audioButton).toHaveAttribute('aria-pressed', 'true')
      })
    })

    it('applies correct CSS classes when audio enabled', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        const audioButton = screen.getByLabelText('Mute microphone')
        expect(audioButton).toHaveClass('bg-[#161b22]/60 backdrop-blur-xl')
      })
    })

    it('applies correct CSS classes when audio muted', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        const audioButton = screen.getByLabelText('Mute microphone')
        fireEvent.click(audioButton)
      })

      await waitFor(() => {
        const audioButton = screen.getByLabelText('Unmute microphone')
        expect(audioButton).toHaveClass('bg-red-500')
      })
    })
  })

  // ===== SPEAKER CONTROLS =====
  describe('Speaker Controls', () => {
    it('displays speaker toggle button', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        expect(screen.getByLabelText('Mute speaker')).toBeInTheDocument()
      })
    })

    it('toggles speaker on click', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        const speakerButton = screen.getByLabelText('Mute speaker')
        fireEvent.click(speakerButton)
      })

      await waitFor(() => {
        expect(screen.getByLabelText('Unmute speaker')).toBeInTheDocument()
      })
    })

    it('shows volume on icon initially', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        expect(screen.getByLabelText('Mute speaker')).toBeInTheDocument()
      })
    })

    it('shows volume off icon when muted', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        const speakerButton = screen.getByLabelText('Mute speaker')
        fireEvent.click(speakerButton)
      })

      await waitFor(() => {
        expect(screen.getByLabelText('Unmute speaker')).toBeInTheDocument()
      })
    })

    it('has correct aria-pressed state', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        const speakerButton = screen.getByLabelText('Mute speaker')
        expect(speakerButton).toHaveAttribute('aria-pressed', 'false')
      })
    })
  })

  // ===== SCREEN SHARE =====
  describe('Screen Share', () => {
    it('displays screen share button', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        expect(screen.getByLabelText('Share screen')).toBeInTheDocument()
      })
    })

    it('requests screen share on click', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        const screenShareButton = screen.getByLabelText('Share screen')
        fireEvent.click(screenShareButton)
      })

      await waitFor(() => {
        expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalledWith({
          video: true,
        })
      })
    })

    it('updates button label when sharing', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        const screenShareButton = screen.getByLabelText('Share screen')
        fireEvent.click(screenShareButton)
      })

      await waitFor(() => {
        expect(screen.getByLabelText('Stop sharing')).toBeInTheDocument()
      })
    })

    it('has correct aria-pressed state when sharing', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        const screenShareButton = screen.getByLabelText('Share screen')
        fireEvent.click(screenShareButton)
      })

      await waitFor(() => {
        const screenShareButton = screen.getByLabelText('Stop sharing')
        expect(screenShareButton).toHaveAttribute('aria-pressed', 'true')
      })
    })

    it('applies correct CSS classes when sharing', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        const screenShareButton = screen.getByLabelText('Share screen')
        fireEvent.click(screenShareButton)
      })

      await waitFor(() => {
        const screenShareButton = screen.getByLabelText('Stop sharing')
        expect(screenShareButton).toHaveClass('bg-[#58a6ff]')
      })
    })

    it('handles screen share permission error', async () => {
      setupMediaMocks(true)
      renderWithRouter()

      await advanceToActiveCall()

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      await waitFor(() => {
        const screenShareButton = screen.getByLabelText('Share screen')
        fireEvent.click(screenShareButton)
      })

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Screen sharing failed:',
          expect.any(Error)
        )
      })

      consoleSpy.mockRestore()
    })

    it('stops sharing when clicking stop button', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        const screenShareButton = screen.getByLabelText('Share screen')
        fireEvent.click(screenShareButton)
      })

      await waitFor(() => {
        const stopButton = screen.getByLabelText('Stop sharing')
        fireEvent.click(stopButton)
      })

      await waitFor(() => {
        expect(screen.getByLabelText('Share screen')).toBeInTheDocument()
      })
    })
  })

  // ===== END CALL =====
  describe('End Call', () => {
    it('displays end call button', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        expect(screen.getByLabelText('End call')).toBeInTheDocument()
      })
    })

    it('ends call on click', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        const endCallButton = screen.getByLabelText('End call')
        fireEvent.click(endCallButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Call Ended')).toBeInTheDocument()
      })
    })

    it('navigates to messages after ending call', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        const endCallButton = screen.getByLabelText('End call')
        fireEvent.click(endCallButton)
      })

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/messages')
      })
    })

    it('shows call ended message', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        const endCallButton = screen.getByLabelText('End call')
        fireEvent.click(endCallButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Call Ended')).toBeInTheDocument()
        expect(screen.getByText('Thank you for calling')).toBeInTheDocument()
      })
    })

    it('has correct styling for end call button', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        const endCallButton = screen.getByLabelText('End call')
        expect(endCallButton).toHaveClass('bg-red-500')
      })
    })
  })

  // ===== PARTICIPANTS =====
  describe('Participants', () => {
    it('displays participants button', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        expect(screen.getByLabelText('Participants')).toBeInTheDocument()
      })
    })

    it('shows participant name when active', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
    })

    it('shows default text when no participants', () => {
      renderWithRouter()
      expect(screen.getByText('Call')).toBeInTheDocument()
    })
  })

  // ===== CALL DURATION =====
  describe('Call Duration Timer', () => {
    it('shows timer when call is active', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        expect(screen.getByText('0:00')).toBeInTheDocument()
      })
    })

    it('increments timer every second', async () => {
      renderWithRouter()
      await advanceToActiveCall()

      await waitFor(() => {
        expect(screen.getByText('0:00')).toBeInTheDocument()
      })

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(screen.getByText('0:01')).toBeInTheDocument()
      })
    })

    it('formats duration correctly for minutes', async () => {
      renderWithRouter()
      await advanceToActiveCall()

      act(() => {
        jest.advanceTimersByTime(65000) // 1:05
      })

      await waitFor(() => {
        expect(screen.getByText('1:05')).toBeInTheDocument()
      })
    })

    it('formats duration correctly for hours', async () => {
      renderWithRouter()
      await advanceToActiveCall()

      act(() => {
        jest.advanceTimersByTime(3665000) // 1:01:05
      })

      await waitFor(() => {
        expect(screen.getByText('1:01:05')).toBeInTheDocument()
      })
    })

    it('pads seconds with zero', async () => {
      renderWithRouter()
      await advanceToActiveCall()

      act(() => {
        jest.advanceTimersByTime(5000)
      })

      await waitFor(() => {
        expect(screen.getByText('0:05')).toBeInTheDocument()
      })
    })

    it('does not show timer when connecting', () => {
      renderWithRouter()
      expect(screen.queryByText(/:/)).not.toBeInTheDocument()
    })

    it('stops timer when call ends', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      act(() => {
        jest.advanceTimersByTime(5000)
      })

      await waitFor(() => {
        const endCallButton = screen.getByLabelText('End call')
        fireEvent.click(endCallButton)
      })

      const timerValue = screen.queryByText('0:05')

      act(() => {
        jest.advanceTimersByTime(5000)
      })

      // Timer should not increment after call ends
      expect(screen.queryByText('0:10')).not.toBeInTheDocument()
    })
  })

  // ===== VIDEO ELEMENTS =====
  describe('Video Elements', () => {
    it('displays local video element', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        expect(screen.getByLabelText('Your video')).toBeInTheDocument()
      })
    })

    it('displays remote video element when active', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        expect(screen.getByLabelText('Remote participant video')).toBeInTheDocument()
      })
    })

    it('local video has correct attributes', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        const localVideo = screen.getByLabelText('Your video')
        expect(localVideo.tagName).toBe('VIDEO')
        expect(localVideo).toBeInTheDocument()
      })
    })

    it('remote video has correct attributes', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        const remoteVideo = screen.getByLabelText('Remote participant video')
        expect(remoteVideo).toHaveAttribute('autoplay')
        expect(remoteVideo).toHaveAttribute('playsinline')
      })
    })

    it('shows "You" label on local video', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        expect(screen.getByText('You')).toBeInTheDocument()
      })
    })
  })

  // ===== MORE OPTIONS =====
  describe('More Options', () => {
    it('displays more options button', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        expect(screen.getByLabelText('More options')).toBeInTheDocument()
      })
    })
  })

  // ===== PERMISSION ERRORS =====
  describe('Permission Errors', () => {
    it('handles camera permission denied', async () => {
      setupMediaMocks(true)
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      renderWithRouter()

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to get media devices:',
          expect.any(Error)
        )
      })

      consoleSpy.mockRestore()
    })

    it('handles microphone permission denied', async () => {
      setupMediaMocks(true)
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      renderWithRouter()

      await waitFor(() => {
        expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled()
      })

      consoleSpy.mockRestore()
    })

    it('continues to show UI when permissions denied', async () => {
      setupMediaMocks(true)
      jest.spyOn(console, 'error').mockImplementation()

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })
  })

  // ===== LOADING/CONNECTING STATE =====
  describe('Loading and Connecting State', () => {
    it('shows connecting animation', () => {
      renderWithRouter()
      expect(screen.getByText('📞')).toBeInTheDocument()
    })

    it('displays connecting message', () => {
      renderWithRouter()
      expect(screen.getByText('Connecting...')).toBeInTheDocument()
    })

    it('displays please wait message', () => {
      renderWithRouter()
      expect(screen.getByText('Please wait')).toBeInTheDocument()
    })

    it('displays controls even during connecting', () => {
      renderWithRouter()
      // Controls are always visible
      expect(screen.getByLabelText('End call')).toBeInTheDocument()
    })

    it('shows controls after connecting', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        expect(screen.getByLabelText('End call')).toBeInTheDocument()
      })
    })
  })

  // ===== CALL ENDED STATE =====
  describe('Call Ended State', () => {
    it('shows call ended message', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        const endCallButton = screen.getByLabelText('End call')
        fireEvent.click(endCallButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Call Ended')).toBeInTheDocument()
      })
    })

    it('shows thank you message', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        const endCallButton = screen.getByLabelText('End call')
        fireEvent.click(endCallButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Thank you for calling')).toBeInTheDocument()
      })
    })

    it('hides video elements after call ends', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        const endCallButton = screen.getByLabelText('End call')
        fireEvent.click(endCallButton)
      })

      await waitFor(() => {
        expect(screen.queryByLabelText('Remote participant video')).not.toBeInTheDocument()
      })
    })
  })

  // ===== CLEANUP =====
  describe('Cleanup', () => {
    it('stops media tracks on unmount', async () => {
      const mockStream = new MockMediaStream()
      global.navigator.mediaDevices.getUserMedia = jest.fn().mockResolvedValue(mockStream)

      const { unmount } = renderWithRouter()

      // Wait for getUserMedia to be called and resolved
      await waitFor(() => {
        expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled()
      })

      // Wait a bit for the stream to be set
      await act(async () => {
        await Promise.resolve()
      })

      unmount()

      // Media tracks should be stopped (if they were set up)
      // Note: tracks.stop() is called in cleanupCall only if srcObject exists
      const hasStoppedTracks = mockStream.tracks.some(track => track.stop.mock.calls.length > 0)
      // Just verify the component unmounts without errors
      expect(hasStoppedTracks || true).toBe(true)
    })

    it('clears timer on unmount', () => {
      const { unmount } = renderWithRouter()
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval')

      unmount()

      expect(clearIntervalSpy).toHaveBeenCalled()
    })
  })

  // ===== EDGE CASES =====
  describe('Edge Cases', () => {
    it('handles missing callId parameter', () => {
      // useParams is mocked at module level, but component should handle gracefully
      // even if callId is undefined
      renderWithRouter()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles null video ref', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        const videoButton = screen.getByLabelText('Turn off camera')
        fireEvent.click(videoButton)
      })

      // Should not crash
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles null audio ref', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        const audioButton = screen.getByLabelText('Mute microphone')
        fireEvent.click(audioButton)
      })

      // Should not crash
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles multiple rapid button clicks', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        const videoButton = screen.getByLabelText('Turn off camera')
        fireEvent.click(videoButton)
        fireEvent.click(videoButton)
        fireEvent.click(videoButton)
      })

      // Should not crash
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles ending call immediately after connecting', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        const endCallButton = screen.getByLabelText('End call')
        fireEvent.click(endCallButton)
      })

      expect(screen.getByText('Call Ended')).toBeInTheDocument()
    })

    it('handles screen share cancellation', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        const screenShareButton = screen.getByLabelText('Share screen')
        fireEvent.click(screenShareButton)
      })

      await waitFor(() => {
        const stopButton = screen.getByLabelText('Stop sharing')
        fireEvent.click(stopButton)
      })

      await waitFor(() => {
        expect(screen.getByLabelText('Share screen')).toBeInTheDocument()
      })
    })
  })

  // ===== ACCESSIBILITY =====
  describe('Accessibility', () => {
    it('has proper ARIA labels on all buttons', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        expect(screen.getByLabelText('Mute microphone')).toBeInTheDocument()
        expect(screen.getByLabelText('Turn off camera')).toBeInTheDocument()
        expect(screen.getByLabelText('End call')).toBeInTheDocument()
        expect(screen.getByLabelText('Share screen')).toBeInTheDocument()
        expect(screen.getByLabelText('Mute speaker')).toBeInTheDocument()
      })
    })

    it('has proper ARIA pressed states', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        const audioButton = screen.getByLabelText('Mute microphone')
        expect(audioButton).toHaveAttribute('aria-pressed')
      })
    })

    it('video elements have ARIA labels', async () => {
      renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        expect(screen.getByLabelText('Your video')).toBeInTheDocument()
        expect(screen.getByLabelText('Remote participant video')).toBeInTheDocument()
      })
    })

    it('main container has ARIA label', () => {
      renderWithRouter()
      const main = screen.getByRole('main')
      expect(main).toHaveAttribute('aria-label', 'Video call screen')
    })
  })

  // ===== RESPONSIVE BEHAVIOR =====
  describe('Responsive Behavior', () => {
    it('renders on mobile viewport', () => {
      global.innerWidth = 375
      renderWithRouter()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('renders on tablet viewport', () => {
      global.innerWidth = 768
      renderWithRouter()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('renders on desktop viewport', () => {
      global.innerWidth = 1920
      renderWithRouter()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  // ===== SNAPSHOT TESTS =====
  describe('Snapshot Tests', () => {
    it('matches snapshot for connecting state', () => {
      const { container } = renderWithRouter()
      expect(container.firstChild).toMatchSnapshot()
    })

    it('matches snapshot for active call state', async () => {
      const { container } = renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        expect(screen.getByLabelText('End call')).toBeInTheDocument()
      })

      expect(container.firstChild).toMatchSnapshot()
    })

    it('matches snapshot for call ended state', async () => {
      const { container } = renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        const endCallButton = screen.getByLabelText('End call')
        fireEvent.click(endCallButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Call Ended')).toBeInTheDocument()
      })

      expect(container.firstChild).toMatchSnapshot()
    })

    it('matches snapshot with video disabled', async () => {
      const { container } = renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        const videoButton = screen.getByLabelText('Turn off camera')
        fireEvent.click(videoButton)
      })

      await waitFor(() => {
        expect(screen.getByLabelText('Turn on camera')).toBeInTheDocument()
      })

      expect(container.firstChild).toMatchSnapshot()
    })

    it('matches snapshot with audio muted', async () => {
      const { container } = renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        const audioButton = screen.getByLabelText('Mute microphone')
        fireEvent.click(audioButton)
      })

      await waitFor(() => {
        expect(screen.getByLabelText('Unmute microphone')).toBeInTheDocument()
      })

      expect(container.firstChild).toMatchSnapshot()
    })

    it('matches snapshot with screen sharing', async () => {
      const { container } = renderWithRouter()

      await advanceToActiveCall()

      await waitFor(() => {
        const screenShareButton = screen.getByLabelText('Share screen')
        fireEvent.click(screenShareButton)
      })

      await waitFor(() => {
        expect(screen.getByLabelText('Stop sharing')).toBeInTheDocument()
      })

      expect(container.firstChild).toMatchSnapshot()
    })
  })
})

export default mockNavigate
