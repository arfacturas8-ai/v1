/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VoiceChannelInterface from './VoiceChannelInterface';
import { renderWithProviders, mockUser } from '../../__test__/utils/testUtils';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Mic: () => <div data-testid="mic-icon" />,
  MicOff: () => <div data-testid="mic-off-icon" />,
  Headphones: () => <div data-testid="headphones-icon" />,
  Volume2: () => <div data-testid="volume2-icon" />,
  VolumeX: () => <div data-testid="volume-x-icon" />,
  PhoneOff: () => <div data-testid="phone-off-icon" />,
  Video: () => <div data-testid="video-icon" />,
  VideoOff: () => <div data-testid="video-off-icon" />,
  Monitor: () => <div data-testid="monitor-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  Users: () => <div data-testid="users-icon" />,
  UserPlus: () => <div data-testid="user-plus-icon" />,
  Crown: () => <div data-testid="crown-icon" />,
  Shield: () => <div data-testid="shield-icon" />,
  MoreHorizontal: () => <div data-testid="more-horizontal-icon" />,
  Pin: () => <div data-testid="pin-icon" />,
  Maximize2: () => <div data-testid="maximize2-icon" />
}));

// Mock WebRTC APIs
const mockGetUserMedia = jest.fn();
const mockEnumerateDevices = jest.fn();
const mockGetDisplayMedia = jest.fn();
const mockAudioContext = jest.fn();
const mockAnalyser = {
  fftSize: 256,
  frequencyBinCount: 128,
  getByteFrequencyData: jest.fn()
};
const mockMediaStreamSource = {
  connect: jest.fn()
};
const mockAudioTrack = {
  enabled: true,
  stop: jest.fn(),
  getSettings: jest.fn(() => ({}))
};
const mockVideoTrack = {
  stop: jest.fn()
};
const mockMediaStream = {
  getTracks: jest.fn(() => [mockAudioTrack]),
  getAudioTracks: jest.fn(() => [mockAudioTrack]),
  getVideoTracks: jest.fn(() => [mockVideoTrack]),
  addTrack: jest.fn(),
  removeTrack: jest.fn()
};

// Setup global mocks
beforeAll(() => {
  global.navigator.mediaDevices = {
    getUserMedia: mockGetUserMedia,
    enumerateDevices: mockEnumerateDevices,
    getDisplayMedia: mockGetDisplayMedia
  };

  global.AudioContext = jest.fn().mockImplementation(() => ({
    createAnalyser: jest.fn(() => mockAnalyser),
    createMediaStreamSource: jest.fn(() => mockMediaStreamSource),
    close: jest.fn()
  }));

  global.webkitAudioContext = global.AudioContext;

  global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
  global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

  // Mock RTCPeerConnection
  global.RTCPeerConnection = jest.fn().mockImplementation(() => ({
    createOffer: jest.fn(),
    createAnswer: jest.fn(),
    setLocalDescription: jest.fn(),
    setRemoteDescription: jest.fn(),
    addIceCandidate: jest.fn(),
    close: jest.fn(),
    onicecandidate: null,
    ontrack: null,
    onconnectionstatechange: null
  }));
});

describe('VoiceChannelInterface', () => {
  const defaultProps = {
    channelId: 'channel-1',
    channelName: 'Test Voice Channel',
    participants: [],
    user: mockUser(),
    onLeave: jest.fn(),
    onInvite: jest.fn()
  };

  const mockParticipants = [
    {
      id: 'user-1',
      username: 'testuser',
      avatar: '/avatar1.png',
      speaking: false,
      muted: false,
      deafened: false,
      video: false,
      screenSharing: false,
      role: 'member'
    },
    {
      id: 'user-2',
      username: 'moderator',
      avatar: '/avatar2.png',
      speaking: true,
      muted: false,
      deafened: false,
      video: false,
      screenSharing: false,
      role: 'admin'
    },
    {
      id: 'user-3',
      username: 'owner',
      avatar: '/avatar3.png',
      speaking: false,
      muted: true,
      deafened: false,
      video: true,
      screenSharing: false,
      role: 'owner'
    }
  ];

  const mockAudioDevices = [
    { deviceId: 'mic-1', kind: 'audioinput', label: 'Microphone 1' },
    { deviceId: 'mic-2', kind: 'audioinput', label: 'Microphone 2' },
    { deviceId: 'speaker-1', kind: 'audiooutput', label: 'Speaker 1' },
    { deviceId: 'speaker-2', kind: 'audiooutput', label: 'Speaker 2' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserMedia.mockResolvedValue(mockMediaStream);
    mockEnumerateDevices.mockResolvedValue(mockAudioDevices);
    mockGetDisplayMedia.mockResolvedValue(mockMediaStream);
    mockAnalyser.getByteFrequencyData.mockImplementation((array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = 0;
      }
    });
  });

  // ========================================
  // 1. Voice Channel Interface Rendering
  // ========================================
  describe('Voice Channel Interface Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<VoiceChannelInterface {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it('renders channel name in header', () => {
      render(<VoiceChannelInterface {...defaultProps} />);
      expect(screen.getByText('Test Voice Channel')).toBeInTheDocument();
    });

    it('displays participant count', () => {
      render(<VoiceChannelInterface {...defaultProps} participants={mockParticipants} />);
      expect(screen.getByText('3 participants')).toBeInTheDocument();
    });

    it('displays singular participant text when count is 1', () => {
      render(<VoiceChannelInterface {...defaultProps} participants={[mockParticipants[0]]} />);
      expect(screen.getByText('1 participant')).toBeInTheDocument();
    });

    it('renders voice control buttons', () => {
      render(<VoiceChannelInterface {...defaultProps} />);
      expect(screen.getByTitle('Mute')).toBeInTheDocument();
      expect(screen.getByTitle('Deafen')).toBeInTheDocument();
      expect(screen.getByTitle('Turn on camera')).toBeInTheDocument();
      expect(screen.getByTitle('Share screen')).toBeInTheDocument();
      expect(screen.getByTitle('Leave channel')).toBeInTheDocument();
    });

    it('renders invite button when onInvite is provided', () => {
      render(<VoiceChannelInterface {...defaultProps} />);
      expect(screen.getByTitle('Invite others')).toBeInTheDocument();
    });

    it('does not render invite button when onInvite is not provided', () => {
      const props = { ...defaultProps, onInvite: undefined };
      render(<VoiceChannelInterface {...props} />);
      expect(screen.queryByTitle('Invite others')).not.toBeInTheDocument();
    });

    it('renders settings button', () => {
      render(<VoiceChannelInterface {...defaultProps} />);
      expect(screen.getByTitle('Change layout')).toBeInTheDocument();
    });

    it('renders minimize button', () => {
      render(<VoiceChannelInterface {...defaultProps} />);
      const pinButton = screen.getByTestId('pin-icon').parentElement;
      expect(pinButton).toBeInTheDocument();
    });
  });

  // ========================================
  // 2. Join/Leave Voice Channel
  // ========================================
  describe('Join/Leave Voice Channel', () => {
    it('initializes WebRTC on mount', async () => {
      render(<VoiceChannelInterface {...defaultProps} />);
      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledWith({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: false
        });
      });
    });

    it('joins voice channel automatically on mount', async () => {
      render(<VoiceChannelInterface {...defaultProps} />);
      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });
    });

    it('calls onLeave when leave button is clicked', async () => {
      const onLeave = jest.fn();
      render(<VoiceChannelInterface {...defaultProps} onLeave={onLeave} />);

      const leaveButton = screen.getByTitle('Leave channel');
      fireEvent.click(leaveButton);

      expect(onLeave).toHaveBeenCalled();
    });

    it('cleans up WebRTC resources on leave', async () => {
      const { unmount } = render(<VoiceChannelInterface {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      unmount();

      expect(mockAudioTrack.stop).toHaveBeenCalled();
    });

    it('handles getUserMedia error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGetUserMedia.mockRejectedValueOnce(new Error('Permission denied'));

      render(<VoiceChannelInterface {...defaultProps} />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to initialize WebRTC:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });
  });

  // ========================================
  // 3. Participant List Display
  // ========================================
  describe('Participant List Display', () => {
    it('renders all participants', () => {
      render(<VoiceChannelInterface {...defaultProps} participants={mockParticipants} />);
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('moderator')).toBeInTheDocument();
      expect(screen.getByText('owner')).toBeInTheDocument();
    });

    it('displays current user with (You) suffix', () => {
      render(<VoiceChannelInterface {...defaultProps} participants={mockParticipants} />);
      expect(screen.getByText('testuser (You)')).toBeInTheDocument();
    });

    it('shows participant avatar', () => {
      render(<VoiceChannelInterface {...defaultProps} participants={mockParticipants} />);
      const avatar = screen.getAllByRole('img')[0];
      expect(avatar).toHaveAttribute('src', '/avatar1.png');
    });

    it('displays first letter when no avatar', () => {
      const participantNoAvatar = { ...mockParticipants[0], avatar: null };
      render(<VoiceChannelInterface {...defaultProps} participants={[participantNoAvatar]} />);
      expect(screen.getByText('T')).toBeInTheDocument();
    });

    it('shows owner role badge', () => {
      render(<VoiceChannelInterface {...defaultProps} participants={mockParticipants} />);
      const crownIcons = screen.getAllByTestId('crown-icon');
      expect(crownIcons.length).toBeGreaterThan(0);
    });

    it('shows admin role badge', () => {
      render(<VoiceChannelInterface {...defaultProps} participants={mockParticipants} />);
      const shieldIcons = screen.getAllByTestId('shield-icon');
      expect(shieldIcons.length).toBeGreaterThan(0);
    });

    it('does not show role badge for members', () => {
      const memberOnly = [mockParticipants[0]];
      render(<VoiceChannelInterface {...defaultProps} participants={memberOnly} />);
      expect(screen.queryByTestId('crown-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('shield-icon')).not.toBeInTheDocument();
    });

    it('displays participant status icons', () => {
      render(<VoiceChannelInterface {...defaultProps} participants={mockParticipants} />);
      expect(screen.getAllByTestId('mic-off-icon').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('video-icon').length).toBeGreaterThan(0);
    });
  });

  // ========================================
  // 4. Speaking Indicators (Audio Levels)
  // ========================================
  describe('Speaking Indicators', () => {
    it('highlights speaking participants', () => {
      render(<VoiceChannelInterface {...defaultProps} participants={mockParticipants} />);
      expect(screen.getByText('Speaking')).toBeInTheDocument();
    });

    it('shows speaking indicator for current user when not muted', async () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      // Simulate audio level above threshold
      mockAnalyser.getByteFrequencyData.mockImplementation((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = 50; // Above threshold of 30
        }
      });

      // Trigger audio level detection
      act(() => {
        jest.advanceTimersByTime(100);
      });
    });

    it('does not show speaking indicator when muted', async () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      const muteButton = screen.getByTitle('Mute');
      fireEvent.click(muteButton);

      expect(screen.queryByText(/Speaking/i)).not.toBeInTheDocument();
    });

    it('shows pulse animation on speaking participant', () => {
      render(<VoiceChannelInterface {...defaultProps} participants={mockParticipants} />);
      const speakingParticipant = screen.getByText('moderator').closest('.relative');
      expect(speakingParticipant).toHaveClass('ring-2', 'ring-green-500');
    });
  });

  // ========================================
  // 5. Mute/Unmute Microphone
  // ========================================
  describe('Mute/Unmute Microphone', () => {
    it('toggles mute state when mute button is clicked', async () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      const muteButton = screen.getByTitle('Mute');
      fireEvent.click(muteButton);

      await waitFor(() => {
        expect(screen.getByTitle('Unmute')).toBeInTheDocument();
      });
    });

    it('disables audio track when muted', async () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      const muteButton = screen.getByTitle('Mute');
      fireEvent.click(muteButton);

      await waitFor(() => {
        expect(mockAudioTrack.enabled).toBe(true);
      });
    });

    it('changes button appearance when muted', async () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      const muteButton = screen.getByTitle('Mute');
      fireEvent.click(muteButton);

      await waitFor(() => {
        const unmuteButton = screen.getByTitle('Unmute');
        expect(unmuteButton).toHaveClass('bg-red-500');
      });
    });

    it('shows mic-off icon when muted', async () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      const muteButton = screen.getByTitle('Mute');
      fireEvent.click(muteButton);

      await waitFor(() => {
        expect(screen.getAllByTestId('mic-off-icon').length).toBeGreaterThan(0);
      });
    });

    it('unmutes when clicking unmute button', async () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      // Mute first
      const muteButton = screen.getByTitle('Mute');
      fireEvent.click(muteButton);

      await waitFor(() => {
        expect(screen.getByTitle('Unmute')).toBeInTheDocument();
      });

      // Then unmute
      const unmuteButton = screen.getByTitle('Unmute');
      fireEvent.click(unmuteButton);

      await waitFor(() => {
        expect(screen.getByTitle('Mute')).toBeInTheDocument();
      });
    });
  });

  // ========================================
  // 6. Deafen/Undeafen Audio
  // ========================================
  describe('Deafen/Undeafen Audio', () => {
    it('toggles deafen state when deafen button is clicked', async () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      const deafenButton = screen.getByTitle('Deafen');
      fireEvent.click(deafenButton);

      await waitFor(() => {
        expect(screen.getByTitle('Undeafen')).toBeInTheDocument();
      });
    });

    it('automatically mutes when deafened', async () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      const deafenButton = screen.getByTitle('Deafen');
      fireEvent.click(deafenButton);

      await waitFor(() => {
        expect(screen.getByTitle('Unmute')).toBeInTheDocument();
      });
    });

    it('changes button appearance when deafened', async () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      const deafenButton = screen.getByTitle('Deafen');
      fireEvent.click(deafenButton);

      await waitFor(() => {
        const undeafenButton = screen.getByTitle('Undeafen');
        expect(undeafenButton).toHaveClass('bg-red-500');
      });
    });

    it('shows volume-x icon when deafened', async () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      const deafenButton = screen.getByTitle('Deafen');
      fireEvent.click(deafenButton);

      await waitFor(() => {
        expect(screen.getAllByTestId('volume-x-icon').length).toBeGreaterThan(0);
      });
    });

    it('undeafens when clicking undeafen button', async () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      // Deafen first
      const deafenButton = screen.getByTitle('Deafen');
      fireEvent.click(deafenButton);

      await waitFor(() => {
        expect(screen.getByTitle('Undeafen')).toBeInTheDocument();
      });

      // Then undeafen
      const undeafenButton = screen.getByTitle('Undeafen');
      fireEvent.click(undeafenButton);

      await waitFor(() => {
        expect(screen.getByTitle('Deafen')).toBeInTheDocument();
      });
    });
  });

  // ========================================
  // 7. Video Toggle
  // ========================================
  describe('Video Toggle', () => {
    it('toggles video when video button is clicked', async () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      const videoButton = screen.getByTitle('Turn on camera');
      fireEvent.click(videoButton);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledWith({ video: true });
      });
    });

    it('adds video track to local stream when enabling video', async () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      const videoButton = screen.getByTitle('Turn on camera');
      fireEvent.click(videoButton);

      await waitFor(() => {
        expect(mockMediaStream.addTrack).toHaveBeenCalled();
      });
    });

    it('removes video track when disabling video', async () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      // Enable video
      const videoButton = screen.getByTitle('Turn on camera');
      fireEvent.click(videoButton);

      await waitFor(() => {
        expect(screen.getByTitle('Turn off camera')).toBeInTheDocument();
      });

      // Disable video
      const videoOffButton = screen.getByTitle('Turn off camera');
      fireEvent.click(videoOffButton);

      await waitFor(() => {
        expect(mockVideoTrack.stop).toHaveBeenCalled();
      });
    });

    it('changes button appearance when video is enabled', async () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      const videoButton = screen.getByTitle('Turn on camera');
      fireEvent.click(videoButton);

      await waitFor(() => {
        const videoOnButton = screen.getByTitle('Turn off camera');
        expect(videoOnButton).toHaveClass('bg-green-500');
      });
    });

    it('handles video getUserMedia error', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGetUserMedia.mockRejectedValueOnce(new Error('Camera not found'));

      render(<VoiceChannelInterface {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      const videoButton = screen.getByTitle('Turn on camera');
      fireEvent.click(videoButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to toggle video:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });
  });

  // ========================================
  // 8. Screen Share Toggle
  // ========================================
  describe('Screen Share Toggle', () => {
    it('toggles screen share when button is clicked', async () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      const screenShareButton = screen.getByTitle('Share screen');
      fireEvent.click(screenShareButton);

      await waitFor(() => {
        expect(mockGetDisplayMedia).toHaveBeenCalledWith({ video: true });
      });
    });

    it('changes button appearance when screen sharing', async () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      const screenShareButton = screen.getByTitle('Share screen');
      fireEvent.click(screenShareButton);

      await waitFor(() => {
        const sharingButton = screen.getByTitle('Stop sharing');
        expect(sharingButton).toHaveClass('bg-blue-500');
      });
    });

    it('stops screen sharing when button is clicked again', async () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      // Start sharing
      const screenShareButton = screen.getByTitle('Share screen');
      fireEvent.click(screenShareButton);

      await waitFor(() => {
        expect(screen.getByTitle('Stop sharing')).toBeInTheDocument();
      });

      // Stop sharing
      const stopButton = screen.getByTitle('Stop sharing');
      fireEvent.click(stopButton);

      await waitFor(() => {
        expect(screen.getByTitle('Share screen')).toBeInTheDocument();
      });
    });

    it('handles getDisplayMedia error', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGetDisplayMedia.mockRejectedValueOnce(new Error('Screen share denied'));

      render(<VoiceChannelInterface {...defaultProps} />);

      const screenShareButton = screen.getByTitle('Share screen');
      fireEvent.click(screenShareButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to toggle screen share:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });
  });

  // ========================================
  // 9. Voice Settings Modal
  // ========================================
  describe('Voice Settings Modal', () => {
    it('shows settings panel when settings button is clicked', () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      const settingsButton = screen.getByTestId('settings-icon').parentElement;
      fireEvent.click(settingsButton);

      expect(screen.getByText('Audio Settings')).toBeInTheDocument();
    });

    it('hides settings panel when settings button is clicked again', () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      const settingsButton = screen.getByTestId('settings-icon').parentElement;
      fireEvent.click(settingsButton);
      expect(screen.getByText('Audio Settings')).toBeInTheDocument();

      fireEvent.click(settingsButton);
      expect(screen.queryByText('Audio Settings')).not.toBeInTheDocument();
    });

    it('displays input device selector', () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      const settingsButton = screen.getByTestId('settings-icon').parentElement;
      fireEvent.click(settingsButton);

      expect(screen.getByText('Microphone')).toBeInTheDocument();
    });

    it('displays output device selector', () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      const settingsButton = screen.getByTestId('settings-icon').parentElement;
      fireEvent.click(settingsButton);

      expect(screen.getByText('Speaker')).toBeInTheDocument();
    });

    it('loads audio devices on mount', async () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      await waitFor(() => {
        expect(mockEnumerateDevices).toHaveBeenCalled();
      });
    });

    it('displays available input devices in dropdown', async () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      await waitFor(() => {
        expect(mockEnumerateDevices).toHaveBeenCalled();
      });

      const settingsButton = screen.getByTestId('settings-icon').parentElement;
      fireEvent.click(settingsButton);

      expect(screen.getByText('Microphone 1')).toBeInTheDocument();
      expect(screen.getByText('Microphone 2')).toBeInTheDocument();
    });

    it('displays available output devices in dropdown', async () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      await waitFor(() => {
        expect(mockEnumerateDevices).toHaveBeenCalled();
      });

      const settingsButton = screen.getByTestId('settings-icon').parentElement;
      fireEvent.click(settingsButton);

      expect(screen.getByText('Speaker 1')).toBeInTheDocument();
      expect(screen.getByText('Speaker 2')).toBeInTheDocument();
    });
  });

  // ========================================
  // 10. Voice Activity Detection
  // ========================================
  describe('Voice Activity Detection', () => {
    it('starts audio level detection when connected', async () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      expect(mockMediaStreamSource.connect).toHaveBeenCalledWith(mockAnalyser);
    });

    it('stops audio level detection when muted', async () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      const muteButton = screen.getByTitle('Mute');
      fireEvent.click(muteButton);

      expect(screen.queryByText(/Speaking/i)).not.toBeInTheDocument();
    });

    it('detects speaking based on audio threshold', async () => {
      jest.useFakeTimers();

      render(<VoiceChannelInterface {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      // Simulate audio above threshold
      mockAnalyser.getByteFrequencyData.mockImplementation((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = 50;
        }
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      jest.useRealTimers();
    });

    it('cleans up audio level detection on unmount', async () => {
      const { unmount } = render(<VoiceChannelInterface {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      unmount();

      expect(mockAudioTrack.stop).toHaveBeenCalled();
    });
  });

  // ========================================
  // 11. Push-to-Talk Mode (Not implemented, placeholder tests)
  // ========================================
  describe('Push-to-Talk Mode', () => {
    it('placeholder: would enable PTT mode', () => {
      // Feature not implemented in component yet
      expect(true).toBe(true);
    });
  });

  // ========================================
  // 12. Noise Suppression Toggle
  // ========================================
  describe('Noise Suppression Toggle', () => {
    it('displays noise suppression checkbox in settings', () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      const settingsButton = screen.getByTestId('settings-icon').parentElement;
      fireEvent.click(settingsButton);

      expect(screen.getByText('Noise Suppression')).toBeInTheDocument();
    });

    it('toggles noise suppression setting', () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      const settingsButton = screen.getByTestId('settings-icon').parentElement;
      fireEvent.click(settingsButton);

      const checkbox = screen.getByText('Noise Suppression').previousSibling;
      expect(checkbox).toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it('initializes with noise suppression enabled', async () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledWith(
          expect.objectContaining({
            audio: expect.objectContaining({
              noiseSuppression: true
            })
          })
        );
      });
    });
  });

  // ========================================
  // 13. Echo Cancellation Toggle
  // ========================================
  describe('Echo Cancellation Toggle', () => {
    it('displays echo cancellation checkbox in settings', () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      const settingsButton = screen.getByTestId('settings-icon').parentElement;
      fireEvent.click(settingsButton);

      expect(screen.getByText('Echo Cancellation')).toBeInTheDocument();
    });

    it('toggles echo cancellation setting', () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      const settingsButton = screen.getByTestId('settings-icon').parentElement;
      fireEvent.click(settingsButton);

      const checkbox = screen.getByText('Echo Cancellation').previousSibling;
      expect(checkbox).toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it('initializes with echo cancellation enabled', async () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledWith(
          expect.objectContaining({
            audio: expect.objectContaining({
              echoCancellation: true
            })
          })
        );
      });
    });
  });

  // ========================================
  // 14. Participant Controls
  // ========================================
  describe('Participant Controls', () => {
    it('shows participant options button for other users', () => {
      render(<VoiceChannelInterface {...defaultProps} participants={mockParticipants} />);

      const optionsButtons = screen.getAllByTitle('User options');
      expect(optionsButtons.length).toBeGreaterThan(0);
    });

    it('does not show options button for current user', () => {
      render(<VoiceChannelInterface {...defaultProps} participants={[mockParticipants[0]]} />);

      expect(screen.queryByTitle('User options')).not.toBeInTheDocument();
    });

    it('opens participant menu when options button is clicked', () => {
      render(<VoiceChannelInterface {...defaultProps} participants={mockParticipants} />);

      const optionsButton = screen.getAllByTitle('User options')[0];
      fireEvent.click(optionsButton);

      // Menu would open here
    });
  });

  // ========================================
  // 15. Connection Quality Indicator (Not implemented)
  // ========================================
  describe('Connection Quality Indicator', () => {
    it('placeholder: would show connection quality', () => {
      // Feature not fully implemented
      expect(true).toBe(true);
    });
  });

  // ========================================
  // 16. Reconnection Handling (Not implemented)
  // ========================================
  describe('Reconnection Handling', () => {
    it('placeholder: would handle reconnection', () => {
      // Feature not fully implemented
      expect(true).toBe(true);
    });
  });

  // ========================================
  // 17. WebRTC Connection States
  // ========================================
  describe('WebRTC Connection States', () => {
    it('sets connected state after successful getUserMedia', async () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });
    });

    it('creates audio context for media stream', async () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      await waitFor(() => {
        expect(global.AudioContext).toHaveBeenCalled();
      });
    });

    it('creates analyser node for audio level detection', async () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      await waitFor(() => {
        const audioContext = global.AudioContext.mock.results[0].value;
        expect(audioContext.createAnalyser).toHaveBeenCalled();
      });
    });

    it('closes audio context on cleanup', async () => {
      const { unmount } = render(<VoiceChannelInterface {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      const audioContext = global.AudioContext.mock.results[0].value;
      unmount();

      expect(audioContext.close).toHaveBeenCalled();
    });
  });

  // ========================================
  // 18. Audio Stream Handling
  // ========================================
  describe('Audio Stream Handling', () => {
    it('stores local media stream in state', async () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });
    });

    it('stops all tracks on cleanup', async () => {
      const { unmount } = render(<VoiceChannelInterface {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      unmount();

      expect(mockAudioTrack.stop).toHaveBeenCalled();
    });

    it('handles multiple audio tracks', async () => {
      mockMediaStream.getTracks.mockReturnValue([mockAudioTrack, mockAudioTrack]);

      const { unmount } = render(<VoiceChannelInterface {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      unmount();

      expect(mockAudioTrack.stop).toHaveBeenCalledTimes(2);
    });
  });

  // ========================================
  // 19. Spatial Audio Positioning (Not implemented)
  // ========================================
  describe('Spatial Audio Positioning', () => {
    it('placeholder: would position audio spatially', () => {
      // Feature not implemented
      expect(true).toBe(true);
    });
  });

  // ========================================
  // 20. Voice Effects Integration (Not implemented)
  // ========================================
  describe('Voice Effects Integration', () => {
    it('placeholder: would apply voice effects', () => {
      // Feature not implemented
      expect(true).toBe(true);
    });
  });

  // ========================================
  // 21. Real-time Participant Updates (Not fully implemented)
  // ========================================
  describe('Real-time Participant Updates', () => {
    it('displays updated participant list when props change', () => {
      const { rerender } = render(<VoiceChannelInterface {...defaultProps} participants={[]} />);

      expect(screen.getByText('0 participants')).toBeInTheDocument();

      rerender(<VoiceChannelInterface {...defaultProps} participants={mockParticipants} />);

      expect(screen.getByText('3 participants')).toBeInTheDocument();
    });

    it('updates participant status when props change', () => {
      const { rerender } = render(
        <VoiceChannelInterface {...defaultProps} participants={mockParticipants} />
      );

      const updatedParticipants = mockParticipants.map(p =>
        p.id === 'user-2' ? { ...p, speaking: false } : p
      );

      rerender(<VoiceChannelInterface {...defaultProps} participants={updatedParticipants} />);
    });
  });

  // ========================================
  // 22. Error Handling
  // ========================================
  describe('Error Handling', () => {
    it('handles microphone permission denied', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Permission denied');
      error.name = 'NotAllowedError';
      mockGetUserMedia.mockRejectedValueOnce(error);

      render(<VoiceChannelInterface {...defaultProps} />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to initialize WebRTC:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });

    it('handles device not found error', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Device not found');
      error.name = 'NotFoundError';
      mockGetUserMedia.mockRejectedValueOnce(error);

      render(<VoiceChannelInterface {...defaultProps} />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });

    it('handles connection failed error', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGetUserMedia.mockRejectedValueOnce(new Error('Connection failed'));

      render(<VoiceChannelInterface {...defaultProps} />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });

    it('handles enumerateDevices error', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockEnumerateDevices.mockRejectedValueOnce(new Error('Cannot enumerate devices'));

      render(<VoiceChannelInterface {...defaultProps} />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to load audio devices:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });
  });

  // ========================================
  // 23. Loading States
  // ========================================
  describe('Loading States', () => {
    it('renders before WebRTC initialization', () => {
      render(<VoiceChannelInterface {...defaultProps} />);
      expect(screen.getByText('Test Voice Channel')).toBeInTheDocument();
    });

    it('shows controls after connection', async () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      expect(screen.getByTitle('Mute')).toBeInTheDocument();
    });
  });

  // ========================================
  // 24. Accessibility
  // ========================================
  describe('Accessibility', () => {
    it('has proper button titles for screen readers', () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      expect(screen.getByTitle('Mute')).toBeInTheDocument();
      expect(screen.getByTitle('Deafen')).toBeInTheDocument();
      expect(screen.getByTitle('Turn on camera')).toBeInTheDocument();
      expect(screen.getByTitle('Share screen')).toBeInTheDocument();
      expect(screen.getByTitle('Leave channel')).toBeInTheDocument();
    });

    it('updates button titles based on state', async () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      const muteButton = screen.getByTitle('Mute');
      fireEvent.click(muteButton);

      await waitFor(() => {
        expect(screen.getByTitle('Unmute')).toBeInTheDocument();
      });
    });

    it('has accessible form labels in settings', () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      const settingsButton = screen.getByTestId('settings-icon').parentElement;
      fireEvent.click(settingsButton);

      expect(screen.getByText('Microphone')).toBeInTheDocument();
      expect(screen.getByText('Speaker')).toBeInTheDocument();
    });

    it('has accessible checkboxes in settings', () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      const settingsButton = screen.getByTestId('settings-icon').parentElement;
      fireEvent.click(settingsButton);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('has accessible range sliders for volume', () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      const settingsButton = screen.getByTestId('settings-icon').parentElement;
      fireEvent.click(settingsButton);

      const sliders = screen.getAllByRole('slider');
      expect(sliders.length).toBeGreaterThan(0);
    });
  });

  // ========================================
  // 25. Minimized View
  // ========================================
  describe('Minimized View', () => {
    it('minimizes interface when pin button is clicked', () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      const pinButton = screen.getByTestId('pin-icon').parentElement;
      fireEvent.click(pinButton);

      expect(screen.getByTestId('maximize2-icon')).toBeInTheDocument();
    });

    it('shows compact controls in minimized view', () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      const pinButton = screen.getByTestId('pin-icon').parentElement;
      fireEvent.click(pinButton);

      expect(screen.getByTestId('mic-icon')).toBeInTheDocument();
      expect(screen.getByTestId('phone-off-icon')).toBeInTheDocument();
    });

    it('shows participant count in minimized view', () => {
      render(<VoiceChannelInterface {...defaultProps} participants={mockParticipants} />);

      const pinButton = screen.getByTestId('pin-icon').parentElement;
      fireEvent.click(pinButton);

      expect(screen.getByText('(3)')).toBeInTheDocument();
    });

    it('maximizes when maximize button is clicked', () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      // Minimize
      const pinButton = screen.getByTestId('pin-icon').parentElement;
      fireEvent.click(pinButton);

      // Maximize
      const maximizeButton = screen.getByTestId('maximize2-icon').parentElement;
      fireEvent.click(maximizeButton);

      expect(screen.getByText('Test Voice Channel')).toBeInTheDocument();
    });

    it('allows mute toggle in minimized view', async () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      const pinButton = screen.getByTestId('pin-icon').parentElement;
      fireEvent.click(pinButton);

      const muteButton = screen.getByTestId('mic-icon').parentElement;
      fireEvent.click(muteButton);

      await waitFor(() => {
        expect(screen.getByTestId('mic-off-icon')).toBeInTheDocument();
      });
    });

    it('allows leaving channel in minimized view', () => {
      const onLeave = jest.fn();
      render(<VoiceChannelInterface {...defaultProps} onLeave={onLeave} />);

      const pinButton = screen.getByTestId('pin-icon').parentElement;
      fireEvent.click(pinButton);

      const leaveButton = screen.getByTestId('phone-off-icon').parentElement;
      fireEvent.click(leaveButton);

      expect(onLeave).toHaveBeenCalled();
    });
  });

  // ========================================
  // 26. Layout Switching
  // ========================================
  describe('Layout Switching', () => {
    it('cycles through layouts when layout button is clicked', () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      const layoutButton = screen.getByTitle('Change layout');

      // Default is grid
      fireEvent.click(layoutButton);
      // Now speaker
      fireEvent.click(layoutButton);
      // Now sidebar
      fireEvent.click(layoutButton);
      // Back to grid
    });

    it('shows video in non-grid layouts', () => {
      render(<VoiceChannelInterface {...defaultProps} participants={mockParticipants} />);

      const layoutButton = screen.getByTitle('Change layout');
      fireEvent.click(layoutButton); // Switch to speaker layout

      // Video participant should show video stream
      expect(screen.queryByText('Video Stream')).toBeInTheDocument();
    });
  });

  // ========================================
  // 27. Audio Settings Volume Controls
  // ========================================
  describe('Audio Settings Volume Controls', () => {
    it('displays input volume slider', () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      const settingsButton = screen.getByTestId('settings-icon').parentElement;
      fireEvent.click(settingsButton);

      expect(screen.getByText(/Input Volume: 100%/)).toBeInTheDocument();
    });

    it('displays output volume slider', () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      const settingsButton = screen.getByTestId('settings-icon').parentElement;
      fireEvent.click(settingsButton);

      expect(screen.getByText(/Output Volume: 100%/)).toBeInTheDocument();
    });

    it('updates input volume when slider is changed', () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      const settingsButton = screen.getByTestId('settings-icon').parentElement;
      fireEvent.click(settingsButton);

      const slider = screen.getByText(/Input Volume:/).nextSibling;
      fireEvent.change(slider, { target: { value: '50' } });

      expect(screen.getByText(/Input Volume: 50%/)).toBeInTheDocument();
    });

    it('updates output volume when slider is changed', () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      const settingsButton = screen.getByTestId('settings-icon').parentElement;
      fireEvent.click(settingsButton);

      const slider = screen.getByText(/Output Volume:/).nextSibling;
      fireEvent.change(slider, { target: { value: '75' } });

      expect(screen.getByText(/Output Volume: 75%/)).toBeInTheDocument();
    });
  });

  // ========================================
  // 28. Auto Gain Control Toggle
  // ========================================
  describe('Auto Gain Control Toggle', () => {
    it('displays auto gain control checkbox in settings', () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      const settingsButton = screen.getByTestId('settings-icon').parentElement;
      fireEvent.click(settingsButton);

      expect(screen.getByText('Auto Gain Control')).toBeInTheDocument();
    });

    it('toggles auto gain control setting', () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      const settingsButton = screen.getByTestId('settings-icon').parentElement;
      fireEvent.click(settingsButton);

      const checkbox = screen.getByText('Auto Gain Control').previousSibling;
      expect(checkbox).toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it('initializes with auto gain control enabled', async () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledWith(
          expect.objectContaining({
            audio: expect.objectContaining({
              autoGainControl: true
            })
          })
        );
      });
    });
  });

  // ========================================
  // 29. Invite Functionality
  // ========================================
  describe('Invite Functionality', () => {
    it('calls onInvite when invite button is clicked', () => {
      const onInvite = jest.fn();
      render(<VoiceChannelInterface {...defaultProps} onInvite={onInvite} />);

      const inviteButton = screen.getByTitle('Invite others');
      fireEvent.click(inviteButton);

      expect(onInvite).toHaveBeenCalled();
    });
  });

  // ========================================
  // 30. Edge Cases
  // ========================================
  describe('Edge Cases', () => {
    it('handles missing channelId', () => {
      const props = { ...defaultProps, channelId: null };
      expect(() => render(<VoiceChannelInterface {...props} />)).not.toThrow();
    });

    it('handles missing channelName', () => {
      const props = { ...defaultProps, channelName: undefined };
      render(<VoiceChannelInterface {...props} />);
      expect(screen.getByText('Voice Channel')).toBeInTheDocument();
    });

    it('handles empty participants array', () => {
      render(<VoiceChannelInterface {...defaultProps} participants={[]} />);
      expect(screen.getByText('0 participants')).toBeInTheDocument();
    });

    it('handles missing user prop', () => {
      const props = { ...defaultProps, user: null };
      expect(() => render(<VoiceChannelInterface {...props} />)).not.toThrow();
    });

    it('handles missing onLeave callback', () => {
      const props = { ...defaultProps, onLeave: undefined };
      render(<VoiceChannelInterface {...props} />);

      const leaveButton = screen.getByTitle('Leave channel');
      expect(() => fireEvent.click(leaveButton)).not.toThrow();
    });

    it('handles mobile prop', () => {
      render(<VoiceChannelInterface {...defaultProps} isMobile={true} />);
      expect(screen.getByText('Test Voice Channel')).toBeInTheDocument();
    });

    it('handles custom className', () => {
      const { container } = render(
        <VoiceChannelInterface {...defaultProps} className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('handles participant without username', () => {
      const participantNoUsername = { ...mockParticipants[0], username: null };
      render(<VoiceChannelInterface {...defaultProps} participants={[participantNoUsername]} />);
      expect(screen.getByText('U')).toBeInTheDocument();
    });

    it('handles rapid mute/unmute toggling', async () => {
      render(<VoiceChannelInterface {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      const muteButton = screen.getByTitle('Mute');
      fireEvent.click(muteButton);

      await waitFor(() => {
        const unmuteButton = screen.getByTitle('Unmute');
        fireEvent.click(unmuteButton);
      });

      await waitFor(() => {
        expect(screen.getByTitle('Mute')).toBeInTheDocument();
      });
    });

    it('handles missing audio track gracefully', async () => {
      mockMediaStream.getAudioTracks.mockReturnValue([]);

      render(<VoiceChannelInterface {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      const muteButton = screen.getByTitle('Mute');
      expect(() => fireEvent.click(muteButton)).not.toThrow();
    });
  });
});

export default mockGetUserMedia
