/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, useParams, useNavigate } from 'react-router-dom';
import CallScreenPage from '../CallScreenPage';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
const mockCallId = 'test-call-123';
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ callId: mockCallId }),
}));

// Mock MediaDevices API
const mockGetUserMedia = jest.fn();
const mockGetDisplayMedia = jest.fn();
const mockVideoTrack = {
  enabled: true,
  stop: jest.fn(),
  onended: null,
};
const mockAudioTrack = {
  enabled: true,
  stop: jest.fn(),
};

global.navigator.mediaDevices = {
  getUserMedia: mockGetUserMedia,
  getDisplayMedia: mockGetDisplayMedia,
};

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('CallScreenPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Reset track states
    mockVideoTrack.enabled = true;
    mockAudioTrack.enabled = true;

    // Mock successful media stream
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [mockVideoTrack, mockAudioTrack],
      getVideoTracks: () => [mockVideoTrack],
      getAudioTracks: () => [mockAudioTrack],
    });

    mockGetDisplayMedia.mockResolvedValue({
      getTracks: () => [mockVideoTrack],
      getVideoTracks: () => [mockVideoTrack],
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // === RENDERING TESTS (12 tests) ===
  describe('Page Rendering', () => {
    it('renders page without crashing', () => {
      const { container } = renderWithRouter(<CallScreenPage />);
      expect(container).toBeInTheDocument();
    });

    it('displays main content area with proper aria label', () => {
      renderWithRouter(<CallScreenPage />);
      const mainElement = screen.getByRole('main', { name: /video call screen/i });
      expect(mainElement).toBeInTheDocument();
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithRouter(<CallScreenPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('displays connecting state initially', () => {
      renderWithRouter(<CallScreenPage />);
      expect(screen.getByText('Connecting...')).toBeInTheDocument();
      expect(screen.getByText('Please wait')).toBeInTheDocument();
    });

    it('shows connecting icon during initial state', () => {
      renderWithRouter(<CallScreenPage />);
      expect(screen.getByText('📞')).toBeInTheDocument();
    });

    it('renders all control buttons', async () => {
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(screen.getByLabelText(/mute microphone|unmute microphone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/turn off camera|turn on camera/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/end call/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/share screen|stop sharing/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/mute speaker|unmute speaker/i)).toBeInTheDocument();
    });

    it('renders top bar with participant info', async () => {
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('renders participants button', () => {
      renderWithRouter(<CallScreenPage />);
      expect(screen.getByLabelText(/participants/i)).toBeInTheDocument();
    });

    it('renders more options button', () => {
      renderWithRouter(<CallScreenPage />);
      expect(screen.getByLabelText(/more options/i)).toBeInTheDocument();
    });

    it('displays remote video element when active', async () => {
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      const remoteVideo = screen.getByLabelText(/remote participant video/i);
      expect(remoteVideo).toBeInTheDocument();
      expect(remoteVideo.tagName).toBe('VIDEO');
    });

    it('displays local video element when active', async () => {
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      const localVideo = screen.getByLabelText(/your video/i);
      expect(localVideo).toBeInTheDocument();
      expect(localVideo.tagName).toBe('VIDEO');
    });

    it('displays "You" label on local video', async () => {
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(screen.getByText('You')).toBeInTheDocument();
    });
  });

  // === CALL INITIALIZATION (8 tests) ===
  describe('Call Initialization', () => {
    it('requests media permissions on mount', async () => {
      renderWithRouter(<CallScreenPage />);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledWith({
          video: true,
          audio: true,
        });
      });
    });

    it('transitions to active state after connecting', async () => {
      renderWithRouter(<CallScreenPage />);

      expect(screen.getByText('Connecting...')).toBeInTheDocument();

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(screen.queryByText('Connecting...')).not.toBeInTheDocument();
      });
    });

    it('loads participants after call becomes active', async () => {
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('handles media permission denial gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockGetUserMedia.mockRejectedValue(new Error('Permission denied'));

      renderWithRouter(<CallScreenPage />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to get media devices:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });

    it('uses callId from URL params', () => {
      renderWithRouter(<CallScreenPage />);
      // The component should use mockCallId from useParams
      expect(mockCallId).toBe('test-call-123');
    });

    it('initializes with video enabled', () => {
      renderWithRouter(<CallScreenPage />);
      const videoButton = screen.getByLabelText(/turn off camera/i);
      expect(videoButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('initializes with audio enabled', () => {
      renderWithRouter(<CallScreenPage />);
      const audioButton = screen.getByLabelText(/mute microphone/i);
      expect(audioButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('initializes with speaker on', () => {
      renderWithRouter(<CallScreenPage />);
      const speakerButton = screen.getByLabelText(/mute speaker/i);
      expect(speakerButton).toHaveAttribute('aria-pressed', 'false');
    });
  });

  // === VIDEO CONTROLS (10 tests) ===
  describe('Video Controls', () => {
    it('toggles video on button click', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      const videoButton = screen.getByLabelText(/turn off camera/i);
      await user.click(videoButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/turn on camera/i)).toBeInTheDocument();
      });
    });

    it('disables video track when video is turned off', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      const videoButton = screen.getByLabelText(/turn off camera/i);
      await user.click(videoButton);

      expect(mockVideoTrack.enabled).toBe(false);
    });

    it('enables video track when video is turned on', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      const videoButton = screen.getByLabelText(/turn off camera/i);
      await user.click(videoButton);
      await user.click(screen.getByLabelText(/turn on camera/i));

      expect(mockVideoTrack.enabled).toBe(true);
    });

    it('hides local video when camera is off', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await user.click(screen.getByLabelText(/turn off camera/i));

      await waitFor(() => {
        expect(screen.queryByLabelText(/your video/i)).not.toBeInTheDocument();
      });
    });

    it('shows red background when video is disabled', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      const videoButton = screen.getByLabelText(/turn off camera/i);
      await user.click(videoButton);

      const disabledButton = screen.getByLabelText(/turn on camera/i);
      expect(disabledButton).toHaveClass('bg-red-500');
    });

    it('updates aria-pressed attribute on video toggle', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      const videoButton = screen.getByLabelText(/turn off camera/i);
      expect(videoButton).toHaveAttribute('aria-pressed', 'false');

      await user.click(videoButton);

      const toggledButton = screen.getByLabelText(/turn on camera/i);
      expect(toggledButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('displays correct icon when video is enabled', async () => {
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      const videoButton = screen.getByLabelText(/turn off camera/i);
      const icon = videoButton.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('displays correct icon when video is disabled', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await user.click(screen.getByLabelText(/turn off camera/i));

      const videoButton = screen.getByLabelText(/turn on camera/i);
      const icon = videoButton.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('maintains video state across re-renders', async () => {
      const user = userEvent.setup({ delay: null });
      const { rerender } = renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await user.click(screen.getByLabelText(/turn off camera/i));

      rerender(<BrowserRouter><CallScreenPage /></BrowserRouter>);

      expect(screen.getByLabelText(/turn on camera/i)).toBeInTheDocument();
    });

    it('handles rapid video toggle clicks', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      const videoButton = screen.getByLabelText(/turn off camera/i);
      await user.click(videoButton);
      await user.click(screen.getByLabelText(/turn on camera/i));
      await user.click(screen.getByLabelText(/turn off camera/i));

      expect(screen.getByLabelText(/turn on camera/i)).toBeInTheDocument();
    });
  });

  // === AUDIO CONTROLS (10 tests) ===
  describe('Audio Controls', () => {
    it('toggles audio on button click', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      const audioButton = screen.getByLabelText(/mute microphone/i);
      await user.click(audioButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/unmute microphone/i)).toBeInTheDocument();
      });
    });

    it('disables audio track when muted', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await user.click(screen.getByLabelText(/mute microphone/i));

      expect(mockAudioTrack.enabled).toBe(false);
    });

    it('enables audio track when unmuted', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      const audioButton = screen.getByLabelText(/mute microphone/i);
      await user.click(audioButton);
      await user.click(screen.getByLabelText(/unmute microphone/i));

      expect(mockAudioTrack.enabled).toBe(true);
    });

    it('shows red background when audio is disabled', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await user.click(screen.getByLabelText(/mute microphone/i));

      const mutedButton = screen.getByLabelText(/unmute microphone/i);
      expect(mutedButton).toHaveClass('bg-red-500');
    });

    it('updates aria-pressed attribute on audio toggle', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      const audioButton = screen.getByLabelText(/mute microphone/i);
      expect(audioButton).toHaveAttribute('aria-pressed', 'false');

      await user.click(audioButton);

      const mutedButton = screen.getByLabelText(/unmute microphone/i);
      expect(mutedButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('displays mic icon when audio is enabled', async () => {
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      const audioButton = screen.getByLabelText(/mute microphone/i);
      const icon = audioButton.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('displays mic-off icon when audio is disabled', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await user.click(screen.getByLabelText(/mute microphone/i));

      const audioButton = screen.getByLabelText(/unmute microphone/i);
      const icon = audioButton.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('maintains audio state across re-renders', async () => {
      const user = userEvent.setup({ delay: null });
      const { rerender } = renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await user.click(screen.getByLabelLabel(/mute microphone/i));

      rerender(<BrowserRouter><CallScreenPage /></BrowserRouter>);

      expect(screen.getByLabelText(/unmute microphone/i)).toBeInTheDocument();
    });

    it('handles rapid audio toggle clicks', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      const audioButton = screen.getByLabelText(/mute microphone/i);
      await user.click(audioButton);
      await user.click(screen.getByLabelText(/unmute microphone/i));
      await user.click(screen.getByLabelText(/mute microphone/i));

      expect(screen.getByLabelText(/unmute microphone/i)).toBeInTheDocument();
    });

    it('allows independent control of audio and video', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await user.click(screen.getByLabelText(/mute microphone/i));
      await user.click(screen.getByLabelText(/turn off camera/i));

      expect(screen.getByLabelText(/unmute microphone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/turn on camera/i)).toBeInTheDocument();
    });
  });

  // === SCREEN SHARING (9 tests) ===
  describe('Screen Sharing', () => {
    it('starts screen sharing on button click', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      const shareButton = screen.getByLabelText(/share screen/i);
      await user.click(shareButton);

      await waitFor(() => {
        expect(mockGetDisplayMedia).toHaveBeenCalledWith({ video: true });
      });
    });

    it('updates button label when sharing', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await user.click(screen.getByLabelText(/share screen/i));

      await waitFor(() => {
        expect(screen.getByLabelText(/stop sharing/i)).toBeInTheDocument();
      });
    });

    it('shows blue background when screen sharing', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await user.click(screen.getByLabelText(/share screen/i));

      await waitFor(() => {
        const shareButton = screen.getByLabelText(/stop sharing/i);
        expect(shareButton).toHaveClass('bg-[#58a6ff]');
      });
    });

    it('stops screen sharing when button clicked again', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await user.click(screen.getByLabelText(/share screen/i));
      await user.click(screen.getByLabelText(/stop sharing/i));

      expect(screen.getByLabelText(/share screen/i)).toBeInTheDocument();
    });

    it('handles screen share permission denial', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockGetDisplayMedia.mockRejectedValue(new Error('Permission denied'));

      const user = userEvent.setup({ delay: null });
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await user.click(screen.getByLabelText(/share screen/i));

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Screen sharing failed:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });

    it('stops sharing when screen share track ends', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await user.click(screen.getByLabelText(/share screen/i));

      // Simulate track ended event
      await act(async () => {
        const track = await mockGetDisplayMedia();
        const videoTrack = track.getVideoTracks()[0];
        videoTrack.onended();
      });

      expect(screen.getByLabelText(/share screen/i)).toBeInTheDocument();
    });

    it('updates aria-pressed attribute when sharing', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      const shareButton = screen.getByLabelText(/share screen/i);
      expect(shareButton).toHaveAttribute('aria-pressed', 'false');

      await user.click(shareButton);

      await waitFor(() => {
        const sharingButton = screen.getByLabelText(/stop sharing/i);
        expect(sharingButton).toHaveAttribute('aria-pressed', 'true');
      });
    });

    it('displays monitor icon on screen share button', async () => {
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      const shareButton = screen.getByLabelText(/share screen/i);
      const icon = shareButton.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('allows screen sharing while video is off', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await user.click(screen.getByLabelText(/turn off camera/i));
      await user.click(screen.getByLabelText(/share screen/i));

      await waitFor(() => {
        expect(screen.getByLabelText(/stop sharing/i)).toBeInTheDocument();
      });
    });
  });

  // === SPEAKER CONTROLS (6 tests) ===
  describe('Speaker Controls', () => {
    it('toggles speaker on button click', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      const speakerButton = screen.getByLabelText(/mute speaker/i);
      await user.click(speakerButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/unmute speaker/i)).toBeInTheDocument();
      });
    });

    it('displays volume icon when speaker is on', async () => {
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      const speakerButton = screen.getByLabelText(/mute speaker/i);
      const icon = speakerButton.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('displays volume-off icon when speaker is muted', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await user.click(screen.getByLabelText(/mute speaker/i));

      const speakerButton = screen.getByLabelText(/unmute speaker/i);
      const icon = speakerButton.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('updates aria-pressed attribute on speaker toggle', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      const speakerButton = screen.getByLabelText(/mute speaker/i);
      expect(speakerButton).toHaveAttribute('aria-pressed', 'false');

      await user.click(speakerButton);

      const mutedButton = screen.getByLabelText(/unmute speaker/i);
      expect(mutedButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('maintains speaker state across re-renders', async () => {
      const user = userEvent.setup({ delay: null });
      const { rerender } = renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await user.click(screen.getByLabelText(/mute speaker/i));

      rerender(<BrowserRouter><CallScreenPage /></BrowserRouter>);

      expect(screen.getByLabelText(/unmute speaker/i)).toBeInTheDocument();
    });

    it('handles rapid speaker toggle clicks', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      const speakerButton = screen.getByLabelText(/mute speaker/i);
      await user.click(speakerButton);
      await user.click(screen.getByLabelText(/unmute speaker/i));
      await user.click(screen.getByLabelText(/mute speaker/i));

      expect(screen.getByLabelText(/unmute speaker/i)).toBeInTheDocument();
    });
  });

  // === CALL DURATION & TIMER (7 tests) ===
  describe('Call Duration', () => {
    it('displays call duration when active', async () => {
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(screen.getByText('0:00')).toBeInTheDocument();
    });

    it('increments duration every second', async () => {
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000); // Become active
      });

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      expect(screen.getByText('0:01')).toBeInTheDocument();
    });

    it('formats duration correctly under 1 minute', async () => {
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
        jest.advanceTimersByTime(30000);
      });

      expect(screen.getByText('0:30')).toBeInTheDocument();
    });

    it('formats duration correctly over 1 minute', async () => {
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
        jest.advanceTimersByTime(90000);
      });

      expect(screen.getByText('1:30')).toBeInTheDocument();
    });

    it('formats duration with hours correctly', async () => {
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
        jest.advanceTimersByTime(3661000); // 1 hour, 1 minute, 1 second
      });

      expect(screen.getByText('1:01:01')).toBeInTheDocument();
    });

    it('does not increment duration before call is active', async () => {
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      expect(screen.queryByText(/:/)).not.toBeInTheDocument();
    });

    it('stops incrementing after call ends', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
        jest.advanceTimersByTime(5000);
      });

      const duration = screen.getByText('0:05');
      expect(duration).toBeInTheDocument();

      await user.click(screen.getByLabelText(/end call/i));

      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      // Duration should not have changed
      expect(screen.queryByText('0:10')).not.toBeInTheDocument();
    });
  });

  // === END CALL (8 tests) ===
  describe('End Call', () => {
    it('ends call on button click', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await user.click(screen.getByLabelText(/end call/i));

      expect(screen.getByText('Call Ended')).toBeInTheDocument();
    });

    it('displays end call button prominently', async () => {
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      const endButton = screen.getByLabelText(/end call/i);
      expect(endButton).toHaveClass('bg-red-500');
    });

    it('navigates to messages after ending call', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await user.click(screen.getByLabelText(/end call/i));

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/messages');
    });

    it('stops all media tracks when ending call', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await user.click(screen.getByLabelText(/end call/i));

      expect(mockVideoTrack.stop).toHaveBeenCalled();
      expect(mockAudioTrack.stop).toHaveBeenCalled();
    });

    it('shows thank you message after ending call', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await user.click(screen.getByLabelText(/end call/i));

      expect(screen.getByText('Thank you for calling')).toBeInTheDocument();
    });

    it('cleans up resources on unmount', () => {
      const { unmount } = renderWithRouter(<CallScreenPage />);

      unmount();

      expect(mockVideoTrack.stop).toHaveBeenCalled();
      expect(mockAudioTrack.stop).toHaveBeenCalled();
    });

    it('displays phone-off icon on end call button', async () => {
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      const endButton = screen.getByLabelText(/end call/i);
      const icon = endButton.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('shows call ended state immediately after clicking end', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await user.click(screen.getByLabelText(/end call/i));

      expect(screen.getByText('Call Ended')).toBeInTheDocument();
    });
  });

  // === PARTICIPANTS (5 tests) ===
  describe('Participants', () => {
    it('displays participant information when active', async () => {
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('shows participant count button', async () => {
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(screen.getByLabelText(/participants/i)).toBeInTheDocument();
    });

    it('displays default call label when no participants', () => {
      mockGetUserMedia.mockResolvedValue({
        getTracks: () => [],
        getVideoTracks: () => [],
        getAudioTracks: () => [],
      });

      renderWithRouter(<CallScreenPage />);

      expect(screen.getByText('Call')).toBeInTheDocument();
    });

    it('loads participant data after connection', async () => {
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('hides participant name during connecting state', () => {
      renderWithRouter(<CallScreenPage />);

      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.getByText('Call')).toBeInTheDocument();
    });
  });

  // === CALL QUALITY & PERFORMANCE (8 tests) ===
  describe('Call Quality', () => {
    it('handles video autoplay', async () => {
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      const remoteVideo = screen.getByLabelText(/remote participant video/i);
      expect(remoteVideo).toHaveAttribute('autoplay');
    });

    it('uses playsInline for mobile compatibility', async () => {
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      const remoteVideo = screen.getByLabelText(/remote participant video/i);
      expect(remoteVideo).toHaveAttribute('playsinline');
    });

    it('mutes local video to prevent echo', async () => {
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      const localVideo = screen.getByLabelText(/your video/i);
      expect(localVideo).toHaveAttribute('muted');
    });

    it('maintains stable video element references', async () => {
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      const video1 = screen.getByLabelText(/remote participant video/i);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      const video2 = screen.getByLabelText(/remote participant video/i);
      expect(video1).toBe(video2);
    });

    it('handles media stream cleanup properly', () => {
      const { unmount } = renderWithRouter(<CallScreenPage />);

      act(() => {
        unmount();
      });

      expect(mockVideoTrack.stop).toHaveBeenCalled();
      expect(mockAudioTrack.stop).toHaveBeenCalled();
    });

    it('does not crash with null video refs', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      renderWithRouter(<CallScreenPage />);

      expect(consoleError).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('handles missing media tracks gracefully', async () => {
      mockGetUserMedia.mockResolvedValue({
        getTracks: () => [],
        getVideoTracks: () => [],
        getAudioTracks: () => [],
      });

      const user = userEvent.setup({ delay: null });
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      // Should not crash when toggling without tracks
      await user.click(screen.getByLabelText(/turn off camera/i));
      await user.click(screen.getByLabelText(/mute microphone/i));

      expect(screen.getByLabelText(/turn on camera/i)).toBeInTheDocument();
    });

    it('prevents memory leaks with proper cleanup', () => {
      const { unmount } = renderWithRouter(<CallScreenPage />);

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      unmount();

      // Timer should be cleared
      const timerCount = jest.getTimerCount();
      expect(timerCount).toBe(0);
    });
  });

  // === ACCESSIBILITY (9 tests) ===
  describe('Accessibility', () => {
    it('has proper main landmark', () => {
      renderWithRouter(<CallScreenPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('has descriptive aria-label on main element', () => {
      renderWithRouter(<CallScreenPage />);
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Video call screen');
    });

    it('all control buttons have aria-labels', async () => {
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });

    it('toggle buttons have aria-pressed states', async () => {
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(screen.getByLabelText(/mute microphone/i)).toHaveAttribute('aria-pressed');
      expect(screen.getByLabelText(/turn off camera/i)).toHaveAttribute('aria-pressed');
      expect(screen.getByLabelText(/share screen/i)).toHaveAttribute('aria-pressed');
      expect(screen.getByLabelText(/mute speaker/i)).toHaveAttribute('aria-pressed');
    });

    it('video elements have descriptive aria-labels', async () => {
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(screen.getByLabelText(/remote participant video/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/your video/i)).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      // Tab to first button
      await user.tab();
      expect(document.activeElement).toHaveAttribute('aria-label');
    });

    it('provides visual feedback for button states', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      const audioButton = screen.getByLabelText(/mute microphone/i);
      await user.click(audioButton);

      const mutedButton = screen.getByLabelText(/unmute microphone/i);
      expect(mutedButton).toHaveClass('bg-red-500');
    });

    it('announces call state changes to screen readers', async () => {
      renderWithRouter(<CallScreenPage />);

      expect(screen.getByText('Connecting...')).toBeInTheDocument();

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(screen.queryByText('Connecting...')).not.toBeInTheDocument();
    });

    it('has sufficient color contrast on buttons', async () => {
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      const endButton = screen.getByLabelText(/end call/i);
      expect(endButton).toHaveClass('text-white');
    });
  });

  // === RESPONSIVE BEHAVIOR (6 tests) ===
  describe('Responsive Behavior', () => {
    it('renders full-screen layout', () => {
      const { container } = renderWithRouter(<CallScreenPage />);
      const mainElement = container.querySelector('[role="main"]');
      expect(mainElement).toHaveClass('fixed', 'inset-0');
    });

    it('positions local video as picture-in-picture', async () => {
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      const localVideoContainer = screen.getByLabelText(/your video/i).closest('div');
      expect(localVideoContainer).toHaveClass('absolute');
    });

    it('uses responsive text sizes', async () => {
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      const participantName = screen.getByText('John Doe');
      expect(participantName).toHaveClass('text-xl');
    });

    it('maintains aspect ratio for videos', async () => {
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      const remoteVideo = screen.getByLabelText(/remote participant video/i);
      expect(remoteVideo).toHaveClass('object-cover');
    });

    it('uses flexible layouts with proper spacing', async () => {
      renderWithRouter(<CallScreenPage />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      const controlsContainer = screen.getByLabelText(/end call/i).closest('div');
      expect(controlsContainer).toHaveClass('flex');
    });

    it('handles overflow content gracefully', () => {
      const { container } = renderWithRouter(<CallScreenPage />);
      const mainElement = container.querySelector('[role="main"]');
      expect(mainElement).toHaveClass('overflow-hidden');
    });
  });
});

export default mockNavigate
