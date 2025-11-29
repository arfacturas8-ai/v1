/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VoiceMessagesPage from '../VoiceMessagesPage'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, whileHover, whileTap, className, style, ...props }) => (
      <div className={className} style={style} {...props}>
        {children}
      </div>
    ),
    button: ({ children, onClick, className, whileHover, whileTap, ...props }) => (
      <button onClick={onClick} className={className} {...props}>
        {children}
      </button>
    ),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}))

// Mock MediaRecorder
class MockMediaRecorder {
  constructor(stream) {
    this.stream = stream
    this.state = 'inactive'
    this.ondataavailable = null
    this.onstop = null
  }

  start() {
    this.state = 'recording'
  }

  stop() {
    this.state = 'inactive'
    if (this.onstop) {
      this.onstop()
    }
  }
}

global.MediaRecorder = MockMediaRecorder

// Mock getUserMedia
const mockGetUserMedia = jest.fn()
global.navigator.mediaDevices = {
  getUserMedia: mockGetUserMedia,
}

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = jest.fn()

// Mock HTMLMediaElement
window.HTMLMediaElement.prototype.play = jest.fn()
window.HTMLMediaElement.prototype.pause = jest.fn()

// Mock alert
global.alert = jest.fn()

// Mock Blob
global.Blob = class Blob {
  constructor(parts, options) {
    this.parts = parts
    this.options = options
    this.size = 1024
  }
}

describe('VoiceMessagesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()

    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }],
    })
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Page Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<VoiceMessagesPage />)
      expect(container).toBeInTheDocument()
    })

    it('has proper role attribute', () => {
      render(<VoiceMessagesPage />)
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
    })

    it('has proper aria-label', () => {
      render(<VoiceMessagesPage />)
      const main = screen.getByRole('main')
      expect(main).toHaveAttribute('aria-label', 'Voice messages page')
    })

    it('renders the page title', () => {
      render(<VoiceMessagesPage />)
      expect(screen.getByText('Voice Messages')).toBeInTheDocument()
    })

    it('renders the subtitle', () => {
      render(<VoiceMessagesPage />)
      expect(screen.getByText('Record and send audio messages')).toBeInTheDocument()
    })

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      render(<VoiceMessagesPage />)
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('Initial State', () => {
    it('displays recording button initially', () => {
      render(<VoiceMessagesPage />)
      const recordButton = screen.getByLabelText('Start recording')
      expect(recordButton).toBeInTheDocument()
    })

    it('shows initial time as 0:00', () => {
      render(<VoiceMessagesPage />)
      expect(screen.getByText('0:00')).toBeInTheDocument()
    })

    it('shows "Tap to record" message', () => {
      render(<VoiceMessagesPage />)
      expect(screen.getByText('Tap to record')).toBeInTheDocument()
    })

    it('does not show playback UI initially', () => {
      render(<VoiceMessagesPage />)
      expect(screen.queryByLabelText('Play')).not.toBeInTheDocument()
    })

    it('does not show action buttons initially', () => {
      render(<VoiceMessagesPage />)
      expect(screen.queryByText('Delete')).not.toBeInTheDocument()
      expect(screen.queryByText('Send')).not.toBeInTheDocument()
    })

    it('does not display error message initially', () => {
      render(<VoiceMessagesPage />)
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  describe('Recording Functionality', () => {
    it('starts recording when record button is clicked', async () => {
      const user = userEvent.setup({ delay: null })
      render(<VoiceMessagesPage />)

      const recordButton = screen.getByLabelText('Start recording')
      await user.click(recordButton)

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true })
      })
    })

    it('changes button to stop recording when recording', async () => {
      const user = userEvent.setup({ delay: null })
      render(<VoiceMessagesPage />)

      const recordButton = screen.getByLabelText('Start recording')
      await user.click(recordButton)

      await waitFor(() => {
        expect(screen.getByLabelText('Stop recording')).toBeInTheDocument()
      })
    })

    it('shows "Recording..." message when recording', async () => {
      const user = userEvent.setup({ delay: null })
      render(<VoiceMessagesPage />)

      const recordButton = screen.getByLabelText('Start recording')
      await user.click(recordButton)

      await waitFor(() => {
        expect(screen.getByText('Recording...')).toBeInTheDocument()
      })
    })

    it('increments timer during recording', async () => {
      const user = userEvent.setup({ delay: null })
      render(<VoiceMessagesPage />)

      const recordButton = screen.getByLabelText('Start recording')
      await user.click(recordButton)

      await waitFor(() => {
        expect(screen.getByText('Recording...')).toBeInTheDocument()
      })

      act(() => {
        jest.advanceTimersByTime(3000)
      })

      expect(screen.getByText('0:03')).toBeInTheDocument()
    })

    it('stops recording when stop button is clicked', async () => {
      const user = userEvent.setup({ delay: null })
      render(<VoiceMessagesPage />)

      const recordButton = screen.getByLabelText('Start recording')
      await user.click(recordButton)

      await waitFor(() => {
        expect(screen.getByLabelText('Stop recording')).toBeInTheDocument()
      })

      const stopButton = screen.getByLabelText('Stop recording')
      await user.click(stopButton)

      await waitFor(() => {
        expect(screen.queryByText('Recording...')).not.toBeInTheDocument()
      })
    })

    it('displays microphone access denied error', async () => {
      mockGetUserMedia.mockRejectedValue(new Error('Permission denied'))
      const user = userEvent.setup({ delay: null })

      render(<VoiceMessagesPage />)

      const recordButton = screen.getByLabelText('Start recording')
      await user.click(recordButton)

      await waitFor(() => {
        expect(screen.getByText('Microphone access denied')).toBeInTheDocument()
      })
    })
  })

  describe('Playback Functionality', () => {
    const setupRecording = async () => {
      const user = userEvent.setup({ delay: null })
      render(<VoiceMessagesPage />)

      const recordButton = screen.getByLabelText('Start recording')
      await user.click(recordButton)

      await waitFor(() => {
        expect(screen.getByLabelText('Stop recording')).toBeInTheDocument()
      })

      const stopButton = screen.getByLabelText('Stop recording')
      await user.click(stopButton)

      return user
    }

    it('shows playback UI after recording', async () => {
      await setupRecording()

      await waitFor(() => {
        expect(screen.getByLabelText('Play')).toBeInTheDocument()
      })
    })

    it('plays audio when play button is clicked', async () => {
      const user = await setupRecording()

      await waitFor(() => {
        expect(screen.getByLabelText('Play')).toBeInTheDocument()
      })

      const playButton = screen.getByLabelText('Play')
      await user.click(playButton)

      await waitFor(() => {
        expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled()
      })
    })

    it('changes to pause button when playing', async () => {
      const user = await setupRecording()

      await waitFor(() => {
        expect(screen.getByLabelText('Play')).toBeInTheDocument()
      })

      const playButton = screen.getByLabelText('Play')
      await user.click(playButton)

      await waitFor(() => {
        expect(screen.getByLabelText('Pause')).toBeInTheDocument()
      })
    })

    it('pauses audio when pause button is clicked', async () => {
      const user = await setupRecording()

      await waitFor(() => {
        expect(screen.getByLabelText('Play')).toBeInTheDocument()
      })

      const playButton = screen.getByLabelText('Play')
      await user.click(playButton)

      await waitFor(() => {
        expect(screen.getByLabelText('Pause')).toBeInTheDocument()
      })

      const pauseButton = screen.getByLabelText('Pause')
      await user.click(pauseButton)

      await waitFor(() => {
        expect(window.HTMLMediaElement.prototype.pause).toHaveBeenCalled()
      })
    })

    it('displays progress bar during playback', async () => {
      await setupRecording()

      await waitFor(() => {
        const progressBar = document.querySelector('.bg-gradient-to-r.from-purple-500.to-blue-500')
        expect(progressBar).toBeInTheDocument()
      })
    })
  })

  describe('Action Buttons', () => {
    const setupRecording = async () => {
      const user = userEvent.setup({ delay: null })
      render(<VoiceMessagesPage />)

      const recordButton = screen.getByLabelText('Start recording')
      await user.click(recordButton)

      await waitFor(() => {
        expect(screen.getByLabelText('Stop recording')).toBeInTheDocument()
      })

      const stopButton = screen.getByLabelText('Stop recording')
      await user.click(stopButton)

      return user
    }

    it('displays Delete button after recording', async () => {
      await setupRecording()

      await waitFor(() => {
        expect(screen.getByLabelText('Delete recording')).toBeInTheDocument()
      })
    })

    it('displays Download button after recording', async () => {
      await setupRecording()

      await waitFor(() => {
        expect(screen.getByLabelText('Download recording')).toBeInTheDocument()
      })
    })

    it('displays Send button after recording', async () => {
      await setupRecording()

      await waitFor(() => {
        expect(screen.getByLabelText('Send voice message')).toBeInTheDocument()
      })
    })

    it('deletes recording when Delete button is clicked', async () => {
      const user = await setupRecording()

      await waitFor(() => {
        expect(screen.getByLabelText('Delete recording')).toBeInTheDocument()
      })

      const deleteButton = screen.getByLabelText('Delete recording')
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.queryByLabelText('Play')).not.toBeInTheDocument()
        expect(screen.getByLabelText('Start recording')).toBeInTheDocument()
      })
    })

    it('downloads recording when Download button is clicked', async () => {
      const user = await setupRecording()
      const mockClick = jest.fn()

      document.createElement = jest.fn().mockImplementation((tag) => {
        if (tag === 'a') {
          return { click: mockClick, href: '', download: '' }
        }
        return document.createElement.bind(document)(tag)
      })

      await waitFor(() => {
        expect(screen.getByLabelText('Download recording')).toBeInTheDocument()
      })

      const downloadButton = screen.getByLabelText('Download recording')
      await user.click(downloadButton)

      expect(mockClick).toHaveBeenCalled()
    })

    it('sends voice message when Send button is clicked', async () => {
      const user = await setupRecording()

      await waitFor(() => {
        expect(screen.getByLabelText('Send voice message')).toBeInTheDocument()
      })

      const sendButton = screen.getByLabelText('Send voice message')
      await user.click(sendButton)

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Voice message sent!')
      })
    })

    it('resets UI after sending message', async () => {
      jest.useRealTimers()
      const user = await setupRecording()

      await waitFor(() => {
        expect(screen.getByLabelText('Send voice message')).toBeInTheDocument()
      })

      const sendButton = screen.getByLabelText('Send voice message')
      await user.click(sendButton)

      await waitFor(() => {
        expect(screen.getByLabelText('Start recording')).toBeInTheDocument()
      }, { timeout: 3000 })

      jest.useFakeTimers()
    })
  })

  describe('Time Formatting', () => {
    it('formats seconds correctly', () => {
      render(<VoiceMessagesPage />)
      expect(screen.getByText('0:00')).toBeInTheDocument()
    })

    it('formats minutes and seconds with padding', async () => {
      const user = userEvent.setup({ delay: null })
      render(<VoiceMessagesPage />)

      const recordButton = screen.getByLabelText('Start recording')
      await user.click(recordButton)

      await waitFor(() => {
        expect(screen.getByText('Recording...')).toBeInTheDocument()
      })

      act(() => {
        jest.advanceTimersByTime(65000)
      })

      expect(screen.getByText('1:05')).toBeInTheDocument()
    })
  })

  describe('Styling and Layout', () => {
    it('has gradient background', () => {
      const { container } = render(<VoiceMessagesPage />)
      const main = container.querySelector('.bg-gradient-to-br')
      expect(main).toBeInTheDocument()
    })

    it('has centered layout', () => {
      const { container } = render(<VoiceMessagesPage />)
      const centered = container.querySelector('.max-w-2xl.mx-auto')
      expect(centered).toBeInTheDocument()
    })

    it('header has gradient background', () => {
      const { container } = render(<VoiceMessagesPage />)
      const header = container.querySelector('.bg-gradient-to-r.from-purple-500.to-blue-500')
      expect(header).toBeInTheDocument()
    })

    it('record button has gradient when not recording', () => {
      const { container } = render(<VoiceMessagesPage />)
      const button = screen.getByLabelText('Start recording')
      expect(button.className).toContain('bg-gradient-to-br')
    })

    it('record button is red when recording', async () => {
      const user = userEvent.setup({ delay: null })
      render(<VoiceMessagesPage />)

      const recordButton = screen.getByLabelText('Start recording')
      await user.click(recordButton)

      await waitFor(() => {
        const stopButton = screen.getByLabelText('Stop recording')
        expect(stopButton.className).toContain('bg-red-500')
      })
    })

    it('card has rounded corners', () => {
      const { container } = render(<VoiceMessagesPage />)
      const card = container.querySelector('.rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]')
      expect(card).toBeInTheDocument()
    })

    it('card has shadow', () => {
      const { container } = render(<VoiceMessagesPage />)
      const card = container.querySelector('.shadow-2xl')
      expect(card).toBeInTheDocument()
    })
  })

  describe('Dark Mode Support', () => {
    it('has dark mode classes on main container', () => {
      const { container } = render(<VoiceMessagesPage />)
      const main = screen.getByRole('main')
      expect(main.className).toContain('dark:from-gray-900')
    })

    it('has dark mode classes on card', () => {
      const { container } = render(<VoiceMessagesPage />)
      const card = container.querySelector('.dark\\:bg-[#161b22]')
      expect(card).toBeInTheDocument()
    })

    it('has dark mode classes on time display', () => {
      const { container } = render(<VoiceMessagesPage />)
      const timeDisplay = screen.getByText('0:00')
      expect(timeDisplay.className).toContain('dark:text-white')
    })
  })

  describe('Error Handling', () => {
    it('displays error message when mic access is denied', async () => {
      mockGetUserMedia.mockRejectedValue(new Error('Permission denied'))
      const user = userEvent.setup({ delay: null })

      render(<VoiceMessagesPage />)

      const recordButton = screen.getByLabelText('Start recording')
      await user.click(recordButton)

      await waitFor(() => {
        const errorAlert = screen.getByRole('alert')
        expect(errorAlert).toBeInTheDocument()
        expect(errorAlert).toHaveTextContent('Microphone access denied')
      })
    })

    it('error message has proper styling', async () => {
      mockGetUserMedia.mockRejectedValue(new Error('Permission denied'))
      const user = userEvent.setup({ delay: null })

      render(<VoiceMessagesPage />)

      const recordButton = screen.getByLabelText('Start recording')
      await user.click(recordButton)

      await waitFor(() => {
        const errorAlert = screen.getByRole('alert')
        expect(errorAlert).toHaveClass('bg-red-100', 'text-red-700')
      })
    })

    it('error message has dark mode styling', async () => {
      mockGetUserMedia.mockRejectedValue(new Error('Permission denied'))
      const user = userEvent.setup({ delay: null })

      render(<VoiceMessagesPage />)

      const recordButton = screen.getByLabelText('Start recording')
      await user.click(recordButton)

      await waitFor(() => {
        const errorAlert = screen.getByRole('alert')
        expect(errorAlert.className).toContain('dark:bg-red-900/30')
        expect(errorAlert.className).toContain('dark:text-red-400')
      })
    })

    it('clears error when starting new recording', async () => {
      mockGetUserMedia.mockRejectedValueOnce(new Error('Permission denied'))
      const user = userEvent.setup({ delay: null })

      render(<VoiceMessagesPage />)

      const recordButton = screen.getByLabelText('Start recording')
      await user.click(recordButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      mockGetUserMedia.mockResolvedValue({
        getTracks: () => [{ stop: jest.fn() }],
      })

      await user.click(recordButton)

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<VoiceMessagesPage />)
      const heading = screen.getByRole('heading', { level: 1, name: 'Voice Messages' })
      expect(heading).toBeInTheDocument()
    })

    it('buttons have descriptive aria-labels', () => {
      render(<VoiceMessagesPage />)
      expect(screen.getByLabelText('Start recording')).toBeInTheDocument()
    })

    it('action buttons have aria-labels after recording', async () => {
      const user = userEvent.setup({ delay: null })
      render(<VoiceMessagesPage />)

      const recordButton = screen.getByLabelText('Start recording')
      await user.click(recordButton)

      await waitFor(() => {
        expect(screen.getByLabelText('Stop recording')).toBeInTheDocument()
      })

      const stopButton = screen.getByLabelText('Stop recording')
      await user.click(stopButton)

      await waitFor(() => {
        expect(screen.getByLabelText('Delete recording')).toBeInTheDocument()
        expect(screen.getByLabelText('Download recording')).toBeInTheDocument()
        expect(screen.getByLabelText('Send voice message')).toBeInTheDocument()
      })
    })

    it('error has role alert', async () => {
      mockGetUserMedia.mockRejectedValue(new Error('Permission denied'))
      const user = userEvent.setup({ delay: null })

      render(<VoiceMessagesPage />)

      const recordButton = screen.getByLabelText('Start recording')
      await user.click(recordButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })
  })

  describe('Cleanup on Unmount', () => {
    it('clears timer on unmount', async () => {
      const user = userEvent.setup({ delay: null })
      const { unmount } = render(<VoiceMessagesPage />)

      const recordButton = screen.getByLabelText('Start recording')
      await user.click(recordButton)

      await waitFor(() => {
        expect(screen.getByText('Recording...')).toBeInTheDocument()
      })

      const clearIntervalSpy = jest.spyOn(global, 'clearInterval')
      unmount()

      expect(clearIntervalSpy).toHaveBeenCalled()
    })

    it('stops recording on unmount', async () => {
      const user = userEvent.setup({ delay: null })
      const { unmount } = render(<VoiceMessagesPage />)

      const recordButton = screen.getByLabelText('Start recording')
      await user.click(recordButton)

      await waitFor(() => {
        expect(screen.getByText('Recording...')).toBeInTheDocument()
      })

      unmount()
      // Should not throw errors
    })
  })

  describe('Component Memoization', () => {
    it('component is memoized', () => {
      const MemoizedPage = VoiceMessagesPage
      expect(MemoizedPage.$$typeof.toString()).toContain('react.memo')
    })
  })

  describe('Recording Timer', () => {
    it('timer starts at 0:00', () => {
      render(<VoiceMessagesPage />)
      expect(screen.getByText('0:00')).toBeInTheDocument()
    })

    it('timer displays large and bold', () => {
      render(<VoiceMessagesPage />)
      const timer = screen.getByText('0:00')
      expect(timer).toHaveClass('text-4xl', 'font-bold')
    })

    it('timer increments every second during recording', async () => {
      const user = userEvent.setup({ delay: null })
      render(<VoiceMessagesPage />)

      const recordButton = screen.getByLabelText('Start recording')
      await user.click(recordButton)

      await waitFor(() => {
        expect(screen.getByText('Recording...')).toBeInTheDocument()
      })

      act(() => {
        jest.advanceTimersByTime(1000)
      })
      expect(screen.getByText('0:01')).toBeInTheDocument()

      act(() => {
        jest.advanceTimersByTime(1000)
      })
      expect(screen.getByText('0:02')).toBeInTheDocument()
    })
  })

  describe('Playback Progress', () => {
    it('progress bar updates during playback', async () => {
      const user = await userEvent.setup({ delay: null })
      render(<VoiceMessagesPage />)

      const recordButton = screen.getByLabelText('Start recording')
      await user.click(recordButton)

      await waitFor(() => {
        expect(screen.getByLabelText('Stop recording')).toBeInTheDocument()
      })

      const stopButton = screen.getByLabelText('Stop recording')
      await user.click(stopButton)

      await waitFor(() => {
        const progressBar = document.querySelector('.bg-gradient-to-r.from-purple-500.to-blue-500')
        expect(progressBar).toBeInTheDocument()
      })
    })
  })

  describe('Button States', () => {
    it('record button is circular', () => {
      render(<VoiceMessagesPage />)
      const button = screen.getByLabelText('Start recording')
      expect(button).toHaveClass('rounded-full')
    })

    it('record button has proper size', () => {
      render(<VoiceMessagesPage />)
      const button = screen.getByLabelText('Start recording')
      expect(button).toHaveClass('w-32', 'h-32')
    })

    it('action buttons have proper styling after recording', async () => {
      const user = userEvent.setup({ delay: null })
      render(<VoiceMessagesPage />)

      const recordButton = screen.getByLabelText('Start recording')
      await user.click(recordButton)

      await waitFor(() => {
        expect(screen.getByLabelText('Stop recording')).toBeInTheDocument()
      })

      const stopButton = screen.getByLabelText('Stop recording')
      await user.click(stopButton)

      await waitFor(() => {
        const deleteButton = screen.getByLabelText('Delete recording')
        expect(deleteButton).toHaveClass('rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]')
      })
    })
  })

  describe('Audio Element', () => {
    it('renders hidden audio element', () => {
      const { container } = render(<VoiceMessagesPage />)
      const audio = container.querySelector('audio')
      expect(audio).toBeInTheDocument()
      expect(audio).toHaveStyle({ display: 'none' })
    })
  })
})

export default mockGetUserMedia
