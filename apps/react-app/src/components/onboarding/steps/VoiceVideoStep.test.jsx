import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import VoiceVideoStep from './VoiceVideoStep'

describe('VoiceVideoStep', () => {
  let mockGetUserMedia
  let mockMediaDevices
  let mockTracks

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()

    mockTracks = {
      audio: {
        stop: jest.fn()
      },
      video: {
        stop: jest.fn()
      }
    }

    mockGetUserMedia = jest.fn()
    mockMediaDevices = {
      getUserMedia: mockGetUserMedia
    }

    Object.defineProperty(global.navigator, 'mediaDevices', {
      writable: true,
      value: mockMediaDevices,
      configurable: true
    })
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Component Rendering', () => {
    test('renders the component with title and description', () => {
      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      expect(screen.getByText('Try Voice & Video')).toBeInTheDocument()
      expect(screen.getByText(/CRYB's real-time communication features/)).toBeInTheDocument()
    })

    test('renders audio and video permissions section', () => {
      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      expect(screen.getByText('🎤 Audio & Video Permissions')).toBeInTheDocument()
      expect(screen.getByText(/Grant permissions to use voice and video features/)).toBeInTheDocument()
    })

    test('renders microphone access status', () => {
      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      expect(screen.getByText('Microphone Access')).toBeInTheDocument()
    })

    test('renders camera access status', () => {
      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      expect(screen.getByText('Camera Access')).toBeInTheDocument()
    })

    test('renders check permissions button', () => {
      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      expect(screen.getByText('Check Permissions')).toBeInTheDocument()
    })

    test('renders voice chat features section', () => {
      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      expect(screen.getByText('🎙️ Voice Chat Features')).toBeInTheDocument()
      expect(screen.getByText('• Crystal clear audio quality')).toBeInTheDocument()
      expect(screen.getByText('• Push-to-talk or open mic')).toBeInTheDocument()
      expect(screen.getByText('• Noise suppression')).toBeInTheDocument()
      expect(screen.getByText('• Individual volume controls')).toBeInTheDocument()
    })

    test('renders video chat features section', () => {
      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      expect(screen.getByText('📹 Video Chat Features')).toBeInTheDocument()
      expect(screen.getByText('• HD video streaming')).toBeInTheDocument()
      expect(screen.getByText('• Screen sharing')).toBeInTheDocument()
      expect(screen.getByText('• Virtual backgrounds')).toBeInTheDocument()
      expect(screen.getByText('• Picture-in-picture mode')).toBeInTheDocument()
    })

    test('renders voice chat tips section', () => {
      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      expect(screen.getByText('💡 Voice Chat Tips')).toBeInTheDocument()
      expect(screen.getByText('• Use headphones to prevent echo')).toBeInTheDocument()
      expect(screen.getByText('• Mute when not speaking in large groups')).toBeInTheDocument()
      expect(screen.getByText('• Test your setup before important calls')).toBeInTheDocument()
      expect(screen.getByText('• Respect community voice chat rules')).toBeInTheDocument()
    })

    test('renders skip button', () => {
      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      expect(screen.getByText('Skip for now')).toBeInTheDocument()
    })

    test('renders continue button', () => {
      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      expect(screen.getByText('Continue')).toBeInTheDocument()
    })

    test('does not render test audio section initially', () => {
      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      expect(screen.queryByText('🔊 Test Your Audio')).not.toBeInTheDocument()
    })
  })

  describe('Initial Permission States', () => {
    test('microphone permission shows "Not checked" initially', () => {
      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      const micStatus = screen.getAllByText('Not checked')[0]
      expect(micStatus).toBeInTheDocument()
      expect(micStatus).toHaveClass('bg-gray-100', 'text-gray-600')
    })

    test('camera permission shows "Not checked" initially', () => {
      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      const cameraStatus = screen.getAllByText('Not checked')[1]
      expect(cameraStatus).toBeInTheDocument()
      expect(cameraStatus).toHaveClass('bg-gray-100', 'text-gray-600')
    })
  })

  describe('Permission Checking - Success Scenarios', () => {
    test('grants both microphone and camera permissions when allowed', async () => {
      const audioStream = {
        getTracks: jest.fn(() => [mockTracks.audio])
      }
      const videoStream = {
        getTracks: jest.fn(() => [mockTracks.video])
      }

      mockGetUserMedia
        .mockResolvedValueOnce(audioStream)
        .mockResolvedValueOnce(videoStream)

      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      const checkButton = screen.getByText('Check Permissions')
      await act(async () => {
        fireEvent.click(checkButton)
      })

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true })
        expect(mockGetUserMedia).toHaveBeenCalledWith({ video: true })
      })

      expect(screen.getByText('Granted')).toBeInTheDocument()
      expect(mockTracks.audio.stop).toHaveBeenCalled()
      expect(mockTracks.video.stop).toHaveBeenCalled()
    })

    test('displays granted status with correct styling for microphone', async () => {
      const audioStream = {
        getTracks: jest.fn(() => [mockTracks.audio])
      }
      const videoStream = {
        getTracks: jest.fn(() => [mockTracks.video])
      }

      mockGetUserMedia
        .mockResolvedValueOnce(audioStream)
        .mockResolvedValueOnce(videoStream)

      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      const checkButton = screen.getByText('Check Permissions')
      await act(async () => {
        fireEvent.click(checkButton)
      })

      await waitFor(() => {
        const grantedElements = screen.getAllByText('Granted')
        expect(grantedElements[0]).toHaveClass('bg-green-100', 'text-green-800')
      })
    })

    test('displays granted status with correct styling for camera', async () => {
      const audioStream = {
        getTracks: jest.fn(() => [mockTracks.audio])
      }
      const videoStream = {
        getTracks: jest.fn(() => [mockTracks.video])
      }

      mockGetUserMedia
        .mockResolvedValueOnce(audioStream)
        .mockResolvedValueOnce(videoStream)

      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      const checkButton = screen.getByText('Check Permissions')
      await act(async () => {
        fireEvent.click(checkButton)
      })

      await waitFor(() => {
        const grantedElements = screen.getAllByText('Granted')
        expect(grantedElements[1]).toHaveClass('bg-green-100', 'text-green-800')
      })
    })

    test('stops audio tracks after checking microphone permission', async () => {
      const audioStream = {
        getTracks: jest.fn(() => [mockTracks.audio])
      }
      const videoStream = {
        getTracks: jest.fn(() => [mockTracks.video])
      }

      mockGetUserMedia
        .mockResolvedValueOnce(audioStream)
        .mockResolvedValueOnce(videoStream)

      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      const checkButton = screen.getByText('Check Permissions')
      await act(async () => {
        fireEvent.click(checkButton)
      })

      await waitFor(() => {
        expect(mockTracks.audio.stop).toHaveBeenCalled()
      })
    })

    test('stops video tracks after checking camera permission', async () => {
      const audioStream = {
        getTracks: jest.fn(() => [mockTracks.audio])
      }
      const videoStream = {
        getTracks: jest.fn(() => [mockTracks.video])
      }

      mockGetUserMedia
        .mockResolvedValueOnce(audioStream)
        .mockResolvedValueOnce(videoStream)

      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      const checkButton = screen.getByText('Check Permissions')
      await act(async () => {
        fireEvent.click(checkButton)
      })

      await waitFor(() => {
        expect(mockTracks.video.stop).toHaveBeenCalled()
      })
    })
  })

  describe('Permission Checking - Failure Scenarios', () => {
    test('handles microphone permission denial', async () => {
      mockGetUserMedia.mockRejectedValueOnce(new Error('Permission denied'))

      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      const checkButton = screen.getByText('Check Permissions')
      await act(async () => {
        fireEvent.click(checkButton)
      })

      await waitFor(() => {
        const deniedElements = screen.getAllByText('Denied')
        expect(deniedElements).toHaveLength(2)
      })
    })

    test('handles camera permission denial when microphone is granted', async () => {
      const audioStream = {
        getTracks: jest.fn(() => [mockTracks.audio])
      }

      mockGetUserMedia
        .mockResolvedValueOnce(audioStream)
        .mockRejectedValueOnce(new Error('Permission denied'))

      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      const checkButton = screen.getByText('Check Permissions')
      await act(async () => {
        fireEvent.click(checkButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Granted')).toBeInTheDocument()
        expect(screen.getByText('Denied')).toBeInTheDocument()
      })
    })

    test('displays denied status with correct styling for microphone', async () => {
      mockGetUserMedia.mockRejectedValueOnce(new Error('Permission denied'))

      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      const checkButton = screen.getByText('Check Permissions')
      await act(async () => {
        fireEvent.click(checkButton)
      })

      await waitFor(() => {
        const deniedElements = screen.getAllByText('Denied')
        expect(deniedElements[0]).toHaveClass('bg-red-100', 'text-red-800')
      })
    })

    test('displays denied status with correct styling for camera', async () => {
      mockGetUserMedia.mockRejectedValueOnce(new Error('Permission denied'))

      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      const checkButton = screen.getByText('Check Permissions')
      await act(async () => {
        fireEvent.click(checkButton)
      })

      await waitFor(() => {
        const deniedElements = screen.getAllByText('Denied')
        expect(deniedElements[1]).toHaveClass('bg-red-100', 'text-red-800')
      })
    })

    test('sets both permissions to false when audio permission fails', async () => {
      mockGetUserMedia.mockRejectedValueOnce(new Error('Permission denied'))

      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      const checkButton = screen.getByText('Check Permissions')
      await act(async () => {
        fireEvent.click(checkButton)
      })

      await waitFor(() => {
        const deniedElements = screen.getAllByText('Denied')
        expect(deniedElements).toHaveLength(2)
      })

      expect(mockGetUserMedia).toHaveBeenCalledTimes(1)
    })

    test('does not check camera permission when microphone fails', async () => {
      mockGetUserMedia.mockRejectedValueOnce(new Error('Permission denied'))

      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      const checkButton = screen.getByText('Check Permissions')
      await act(async () => {
        fireEvent.click(checkButton)
      })

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true })
      })

      expect(mockGetUserMedia).not.toHaveBeenCalledWith({ video: true })
    })
  })

  describe('Test Audio Section Visibility', () => {
    test('shows test audio section when microphone permission is granted', async () => {
      const audioStream = {
        getTracks: jest.fn(() => [mockTracks.audio])
      }
      const videoStream = {
        getTracks: jest.fn(() => [mockTracks.video])
      }

      mockGetUserMedia
        .mockResolvedValueOnce(audioStream)
        .mockResolvedValueOnce(videoStream)

      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      const checkButton = screen.getByText('Check Permissions')
      await act(async () => {
        fireEvent.click(checkButton)
      })

      await waitFor(() => {
        expect(screen.getByText('🔊 Test Your Audio')).toBeInTheDocument()
      })
    })

    test('does not show test audio section when microphone permission is denied', async () => {
      mockGetUserMedia.mockRejectedValueOnce(new Error('Permission denied'))

      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      const checkButton = screen.getByText('Check Permissions')
      await act(async () => {
        fireEvent.click(checkButton)
      })

      await waitFor(() => {
        expect(screen.getAllByText('Denied')).toHaveLength(2)
      })

      expect(screen.queryByText('🔊 Test Your Audio')).not.toBeInTheDocument()
    })

    test('shows test audio description when microphone is granted', async () => {
      const audioStream = {
        getTracks: jest.fn(() => [mockTracks.audio])
      }
      const videoStream = {
        getTracks: jest.fn(() => [mockTracks.video])
      }

      mockGetUserMedia
        .mockResolvedValueOnce(audioStream)
        .mockResolvedValueOnce(videoStream)

      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      const checkButton = screen.getByText('Check Permissions')
      await act(async () => {
        fireEvent.click(checkButton)
      })

      await waitFor(() => {
        expect(screen.getByText(/Test your microphone to make sure it's working properly/)).toBeInTheDocument()
      })
    })

    test('shows test microphone button when microphone is granted', async () => {
      const audioStream = {
        getTracks: jest.fn(() => [mockTracks.audio])
      }
      const videoStream = {
        getTracks: jest.fn(() => [mockTracks.video])
      }

      mockGetUserMedia
        .mockResolvedValueOnce(audioStream)
        .mockResolvedValueOnce(videoStream)

      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      const checkButton = screen.getByText('Check Permissions')
      await act(async () => {
        fireEvent.click(checkButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Test Microphone')).toBeInTheDocument()
      })
    })
  })

  describe('Audio Testing Functionality', () => {
    test('starts audio test when test microphone button is clicked', async () => {
      const audioStream = {
        getTracks: jest.fn(() => [mockTracks.audio])
      }
      const videoStream = {
        getTracks: jest.fn(() => [mockTracks.video])
      }

      mockGetUserMedia
        .mockResolvedValueOnce(audioStream)
        .mockResolvedValueOnce(videoStream)
        .mockResolvedValueOnce(audioStream)

      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      const checkButton = screen.getByText('Check Permissions')
      await act(async () => {
        fireEvent.click(checkButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Test Microphone')).toBeInTheDocument()
      })

      const testButton = screen.getByText('Test Microphone')
      await act(async () => {
        fireEvent.click(testButton)
      })

      expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true })
    })

    test('changes button text to "Testing..." during audio test', async () => {
      const audioStream = {
        getTracks: jest.fn(() => [mockTracks.audio])
      }
      const videoStream = {
        getTracks: jest.fn(() => [mockTracks.video])
      }

      mockGetUserMedia
        .mockResolvedValueOnce(audioStream)
        .mockResolvedValueOnce(videoStream)
        .mockResolvedValueOnce(audioStream)

      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      const checkButton = screen.getByText('Check Permissions')
      await act(async () => {
        fireEvent.click(checkButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Test Microphone')).toBeInTheDocument()
      })

      const testButton = screen.getByText('Test Microphone')
      await act(async () => {
        fireEvent.click(testButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Testing...')).toBeInTheDocument()
      })
    })

    test('disables test button during audio test', async () => {
      const audioStream = {
        getTracks: jest.fn(() => [mockTracks.audio])
      }
      const videoStream = {
        getTracks: jest.fn(() => [mockTracks.video])
      }

      mockGetUserMedia
        .mockResolvedValueOnce(audioStream)
        .mockResolvedValueOnce(videoStream)
        .mockResolvedValueOnce(audioStream)

      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      const checkButton = screen.getByText('Check Permissions')
      await act(async () => {
        fireEvent.click(checkButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Test Microphone')).toBeInTheDocument()
      })

      const testButton = screen.getByText('Test Microphone')
      await act(async () => {
        fireEvent.click(testButton)
      })

      await waitFor(() => {
        const testingButton = screen.getByText('Testing...')
        expect(testingButton).toBeDisabled()
      })
    })

    test('applies disabled styling during audio test', async () => {
      const audioStream = {
        getTracks: jest.fn(() => [mockTracks.audio])
      }
      const videoStream = {
        getTracks: jest.fn(() => [mockTracks.video])
      }

      mockGetUserMedia
        .mockResolvedValueOnce(audioStream)
        .mockResolvedValueOnce(videoStream)
        .mockResolvedValueOnce(audioStream)

      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      const checkButton = screen.getByText('Check Permissions')
      await act(async () => {
        fireEvent.click(checkButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Test Microphone')).toBeInTheDocument()
      })

      const testButton = screen.getByText('Test Microphone')
      await act(async () => {
        fireEvent.click(testButton)
      })

      await waitFor(() => {
        const testingButton = screen.getByText('Testing...')
        expect(testingButton).toHaveClass('bg-gray-300', 'text-gray-500')
      })
    })

    test('stops audio tracks after test completes', async () => {
      const audioStream = {
        getTracks: jest.fn(() => [mockTracks.audio])
      }
      const videoStream = {
        getTracks: jest.fn(() => [mockTracks.video])
      }
      const testAudioStream = {
        getTracks: jest.fn(() => [{ stop: jest.fn() }])
      }

      mockGetUserMedia
        .mockResolvedValueOnce(audioStream)
        .mockResolvedValueOnce(videoStream)
        .mockResolvedValueOnce(testAudioStream)

      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      const checkButton = screen.getByText('Check Permissions')
      await act(async () => {
        fireEvent.click(checkButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Test Microphone')).toBeInTheDocument()
      })

      const testButton = screen.getByText('Test Microphone')
      await act(async () => {
        fireEvent.click(testButton)
      })

      await act(async () => {
        jest.advanceTimersByTime(2000)
      })

      await waitFor(() => {
        expect(testAudioStream.getTracks()[0].stop).toHaveBeenCalled()
      })
    })

    test('resets button text after test completes', async () => {
      const audioStream = {
        getTracks: jest.fn(() => [mockTracks.audio])
      }
      const videoStream = {
        getTracks: jest.fn(() => [mockTracks.video])
      }
      const testAudioStream = {
        getTracks: jest.fn(() => [{ stop: jest.fn() }])
      }

      mockGetUserMedia
        .mockResolvedValueOnce(audioStream)
        .mockResolvedValueOnce(videoStream)
        .mockResolvedValueOnce(testAudioStream)

      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      const checkButton = screen.getByText('Check Permissions')
      await act(async () => {
        fireEvent.click(checkButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Test Microphone')).toBeInTheDocument()
      })

      const testButton = screen.getByText('Test Microphone')
      await act(async () => {
        fireEvent.click(testButton)
      })

      await act(async () => {
        jest.advanceTimersByTime(2000)
      })

      await waitFor(() => {
        expect(screen.getByText('Test Microphone')).toBeInTheDocument()
      })
    })

    test('re-enables button after test completes', async () => {
      const audioStream = {
        getTracks: jest.fn(() => [mockTracks.audio])
      }
      const videoStream = {
        getTracks: jest.fn(() => [mockTracks.video])
      }
      const testAudioStream = {
        getTracks: jest.fn(() => [{ stop: jest.fn() }])
      }

      mockGetUserMedia
        .mockResolvedValueOnce(audioStream)
        .mockResolvedValueOnce(videoStream)
        .mockResolvedValueOnce(testAudioStream)

      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      const checkButton = screen.getByText('Check Permissions')
      await act(async () => {
        fireEvent.click(checkButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Test Microphone')).toBeInTheDocument()
      })

      const testButton = screen.getByText('Test Microphone')
      await act(async () => {
        fireEvent.click(testButton)
      })

      await act(async () => {
        jest.advanceTimersByTime(2000)
      })

      await waitFor(() => {
        const enabledButton = screen.getByText('Test Microphone')
        expect(enabledButton).not.toBeDisabled()
      })
    })

    test('handles audio test error gracefully', async () => {
      const audioStream = {
        getTracks: jest.fn(() => [mockTracks.audio])
      }
      const videoStream = {
        getTracks: jest.fn(() => [mockTracks.video])
      }

      mockGetUserMedia
        .mockResolvedValueOnce(audioStream)
        .mockResolvedValueOnce(videoStream)
        .mockRejectedValueOnce(new Error('Audio test failed'))

      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      const checkButton = screen.getByText('Check Permissions')
      await act(async () => {
        fireEvent.click(checkButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Test Microphone')).toBeInTheDocument()
      })

      const testButton = screen.getByText('Test Microphone')
      await act(async () => {
        fireEvent.click(testButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Test Microphone')).toBeInTheDocument()
      })
    })

    test('resets testing state on audio test error', async () => {
      const audioStream = {
        getTracks: jest.fn(() => [mockTracks.audio])
      }
      const videoStream = {
        getTracks: jest.fn(() => [mockTracks.video])
      }

      mockGetUserMedia
        .mockResolvedValueOnce(audioStream)
        .mockResolvedValueOnce(videoStream)
        .mockRejectedValueOnce(new Error('Audio test failed'))

      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      const checkButton = screen.getByText('Check Permissions')
      await act(async () => {
        fireEvent.click(checkButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Test Microphone')).toBeInTheDocument()
      })

      const testButton = screen.getByText('Test Microphone')
      await act(async () => {
        fireEvent.click(testButton)
      })

      await waitFor(() => {
        const enabledButton = screen.getByText('Test Microphone')
        expect(enabledButton).not.toBeDisabled()
      })
    })
  })

  describe('Button Actions', () => {
    test('calls onSkip when skip button is clicked', () => {
      const mockOnSkip = jest.fn()
      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={mockOnSkip} />)

      const skipButton = screen.getByText('Skip for now')
      fireEvent.click(skipButton)

      expect(mockOnSkip).toHaveBeenCalledTimes(1)
    })

    test('calls onComplete when continue button is clicked', () => {
      const mockOnComplete = jest.fn()
      render(<VoiceVideoStep onComplete={mockOnComplete} onSkip={jest.fn()} />)

      const continueButton = screen.getByText('Continue')
      fireEvent.click(continueButton)

      expect(mockOnComplete).toHaveBeenCalledTimes(1)
    })

    test('skip button has correct styling', () => {
      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      const skipButton = screen.getByText('Skip for now')
      expect(skipButton).toHaveClass('text-gray-500', 'hover:text-gray-700')
    })

    test('continue button has correct styling', () => {
      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      const continueButton = screen.getByText('Continue')
      expect(continueButton).toHaveClass('px-6', 'py-2', 'bg-blue-600', 'text-white', 'rounded-lg')
    })

    test('allows multiple clicks on skip button', () => {
      const mockOnSkip = jest.fn()
      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={mockOnSkip} />)

      const skipButton = screen.getByText('Skip for now')
      fireEvent.click(skipButton)
      fireEvent.click(skipButton)

      expect(mockOnSkip).toHaveBeenCalledTimes(2)
    })

    test('allows multiple clicks on continue button', () => {
      const mockOnComplete = jest.fn()
      render(<VoiceVideoStep onComplete={mockOnComplete} onSkip={jest.fn()} />)

      const continueButton = screen.getByText('Continue')
      fireEvent.click(continueButton)
      fireEvent.click(continueButton)

      expect(mockOnComplete).toHaveBeenCalledTimes(2)
    })
  })

  describe('Multiple Permission Checks', () => {
    test('allows checking permissions multiple times', async () => {
      const audioStream = {
        getTracks: jest.fn(() => [mockTracks.audio])
      }
      const videoStream = {
        getTracks: jest.fn(() => [mockTracks.video])
      }

      mockGetUserMedia
        .mockResolvedValue(audioStream)
        .mockResolvedValue(videoStream)

      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      const checkButton = screen.getByText('Check Permissions')

      await act(async () => {
        fireEvent.click(checkButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Granted')).toBeInTheDocument()
      })

      mockGetUserMedia.mockClear()
      mockGetUserMedia
        .mockResolvedValueOnce(audioStream)
        .mockResolvedValueOnce(videoStream)

      await act(async () => {
        fireEvent.click(checkButton)
      })

      expect(mockGetUserMedia).toHaveBeenCalled()
    })

    test('updates permission state on subsequent checks', async () => {
      const audioStream = {
        getTracks: jest.fn(() => [mockTracks.audio])
      }
      const videoStream = {
        getTracks: jest.fn(() => [mockTracks.video])
      }

      mockGetUserMedia
        .mockResolvedValueOnce(audioStream)
        .mockResolvedValueOnce(videoStream)

      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      const checkButton = screen.getByText('Check Permissions')

      await act(async () => {
        fireEvent.click(checkButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Granted')).toBeInTheDocument()
      })

      mockGetUserMedia.mockClear()
      mockGetUserMedia.mockRejectedValueOnce(new Error('Permission denied'))

      await act(async () => {
        fireEvent.click(checkButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Denied')).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    test('handles undefined navigator.mediaDevices gracefully', async () => {
      Object.defineProperty(global.navigator, 'mediaDevices', {
        writable: true,
        value: undefined,
        configurable: true
      })

      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      const checkButton = screen.getByText('Check Permissions')

      await act(async () => {
        fireEvent.click(checkButton)
      })

      expect(screen.getByText('Check Permissions')).toBeInTheDocument()
    })

    test('handles empty track arrays', async () => {
      const audioStream = {
        getTracks: jest.fn(() => [])
      }
      const videoStream = {
        getTracks: jest.fn(() => [])
      }

      mockGetUserMedia
        .mockResolvedValueOnce(audioStream)
        .mockResolvedValueOnce(videoStream)

      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      const checkButton = screen.getByText('Check Permissions')
      await act(async () => {
        fireEvent.click(checkButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Granted')).toBeInTheDocument()
      })
    })

    test('handles multiple tracks in stream', async () => {
      const audioStream = {
        getTracks: jest.fn(() => [
          { stop: jest.fn() },
          { stop: jest.fn() }
        ])
      }
      const videoStream = {
        getTracks: jest.fn(() => [
          { stop: jest.fn() }
        ])
      }

      mockGetUserMedia
        .mockResolvedValueOnce(audioStream)
        .mockResolvedValueOnce(videoStream)

      render(<VoiceVideoStep onComplete={jest.fn()} onSkip={jest.fn()} />)

      const checkButton = screen.getByText('Check Permissions')
      await act(async () => {
        fireEvent.click(checkButton)
      })

      await waitFor(() => {
        expect(audioStream.getTracks()[0].stop).toHaveBeenCalled()
        expect(audioStream.getTracks()[1].stop).toHaveBeenCalled()
      })
    })

    test('handles test audio with no onComplete callback', async () => {
      const audioStream = {
        getTracks: jest.fn(() => [mockTracks.audio])
      }
      const videoStream = {
        getTracks: jest.fn(() => [mockTracks.video])
      }

      mockGetUserMedia
        .mockResolvedValueOnce(audioStream)
        .mockResolvedValueOnce(videoStream)
        .mockResolvedValueOnce(audioStream)

      render(<VoiceVideoStep onSkip={jest.fn()} />)

      const checkButton = screen.getByText('Check Permissions')
      await act(async () => {
        fireEvent.click(checkButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Test Microphone')).toBeInTheDocument()
      })

      const testButton = screen.getByText('Test Microphone')
      await act(async () => {
        fireEvent.click(testButton)
      })

      expect(screen.getByText('Testing...')).toBeInTheDocument()
    })

    test('handles test audio with no onSkip callback', async () => {
      const audioStream = {
        getTracks: jest.fn(() => [mockTracks.audio])
      }
      const videoStream = {
        getTracks: jest.fn(() => [mockTracks.video])
      }

      mockGetUserMedia
        .mockResolvedValueOnce(audioStream)
        .mockResolvedValueOnce(videoStream)

      render(<VoiceVideoStep onComplete={jest.fn()} />)

      const checkButton = screen.getByText('Check Permissions')
      await act(async () => {
        fireEvent.click(checkButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Granted')).toBeInTheDocument()
      })
    })
  })
})

export default micStatus
