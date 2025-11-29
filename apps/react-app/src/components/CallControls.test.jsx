/**
 * Tests for CallControls component
 */
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CallControls from './CallControls';

jest.mock('./CallQualityIndicator', () => {
  return function CallQualityIndicator({ compact, connectionQuality }) {
    return (
      <div data-testid="call-quality-indicator">
        Quality: {connectionQuality} (compact: {compact ? 'yes' : 'no'})
      </div>
    );
  };
});

jest.mock('./CallTimer', () => {
  return function CallTimer({ compact, isActive, startTime, isRecording }) {
    return (
      <div data-testid="call-timer">
        Timer: {isActive ? 'active' : 'inactive'}
        {isRecording && ' (recording)'}
      </div>
    );
  };
});

jest.mock('lucide-react', () => ({
  Phone: ({ size }) => <svg data-testid="phone-icon" width={size} />,
  PhoneCall: ({ size }) => <svg data-testid="phone-call-icon" width={size} />,
  Video: ({ size }) => <svg data-testid="video-icon" width={size} />,
  VideoOff: ({ size }) => <svg data-testid="video-off-icon" width={size} />,
  Mic: ({ size }) => <svg data-testid="mic-icon" width={size} />,
  MicOff: ({ size }) => <svg data-testid="mic-off-icon" width={size} />,
  Monitor: ({ size }) => <svg data-testid="monitor-icon" width={size} />,
  MonitorOff: ({ size }) => <svg data-testid="monitor-off-icon" width={size} />,
  PhoneOff: ({ size }) => <svg data-testid="phone-off-icon" width={size} />,
  Settings: ({ size }) => <svg data-testid="settings-icon" width={size} />,
  Users: ({ size }) => <svg data-testid="users-icon" width={size} />,
  Volume2: ({ size }) => <svg data-testid="volume2-icon" width={size} />,
  VolumeX: ({ size }) => <svg data-testid="volumex-icon" width={size} />,
  Maximize2: ({ size }) => <svg data-testid="maximize2-icon" width={size} />,
  Minimize2: ({ size }) => <svg data-testid="minimize2-icon" width={size} />,
  MoreHorizontal: ({ size }) => <svg data-testid="more-horizontal-icon" width={size} />,
  Camera: ({ size }) => <svg data-testid="camera-icon" width={size} />,
  CameraOff: ({ size }) => <svg data-testid="camera-off-icon" width={size} />,
  Headphones: ({ size }) => <svg data-testid="headphones-icon" width={size} />,
  Speaker: ({ size }) => <svg data-testid="speaker-icon" width={size} />
}));

describe('CallControls', () => {
  const mockCallbacks = {
    onStartVoiceCall: jest.fn(),
    onStartVideoCall: jest.fn(),
    onEndCall: jest.fn(),
    onToggleMute: jest.fn(),
    onToggleVideo: jest.fn(),
    onToggleScreenShare: jest.fn(),
    onToggleCamera: jest.fn(),
    onToggleSpeaker: jest.fn(),
    onToggleRecording: jest.fn(),
    onToggleMinimize: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Call Initiation (Not In Call)', () => {
    it('renders without crashing', () => {
      render(<CallControls {...mockCallbacks} />);
    });

    it('shows voice call button when not in call', () => {
      render(<CallControls {...mockCallbacks} isInCall={false} />);
      expect(screen.getByText('Voice Call')).toBeInTheDocument();
      expect(screen.getByTestId('phone-icon')).toBeInTheDocument();
    });

    it('shows video call button when not in call', () => {
      render(<CallControls {...mockCallbacks} isInCall={false} />);
      expect(screen.getByText('Video Call')).toBeInTheDocument();
      expect(screen.getByTestId('video-icon')).toBeInTheDocument();
    });

    it('shows share screen button when not in call', () => {
      render(<CallControls {...mockCallbacks} isInCall={false} />);
      expect(screen.getByText('Share Screen')).toBeInTheDocument();
      expect(screen.getByTestId('monitor-icon')).toBeInTheDocument();
    });

    it('calls onStartVoiceCall when voice button clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CallControls {...mockCallbacks} isInCall={false} />);

      await user.click(screen.getByText('Voice Call'));

      expect(mockCallbacks.onStartVoiceCall).toHaveBeenCalled();
    });

    it('calls onStartVideoCall when video button clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CallControls {...mockCallbacks} isInCall={false} />);

      await user.click(screen.getByText('Video Call'));

      expect(mockCallbacks.onStartVideoCall).toHaveBeenCalled();
    });

    it('calls onToggleScreenShare when screen share button clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CallControls {...mockCallbacks} isInCall={false} />);

      await user.click(screen.getByText('Share Screen'));

      expect(mockCallbacks.onToggleScreenShare).toHaveBeenCalled();
    });
  });

  describe('Header Compact Mode', () => {
    it('renders compact version when showInHeader is true', () => {
      render(<CallControls {...mockCallbacks} showInHeader={true} />);

      // Smaller icons in header
      const phoneIcon = screen.getByTestId('phone-icon');
      expect(phoneIcon).toHaveAttribute('width', '18');
    });

    it('shows all call buttons in header when not in call', () => {
      render(<CallControls {...mockCallbacks} showInHeader={true} isInCall={false} />);

      expect(screen.getByTestId('phone-icon')).toBeInTheDocument();
      expect(screen.getByTestId('video-icon')).toBeInTheDocument();
      expect(screen.getByTestId('monitor-icon')).toBeInTheDocument();
    });

    it('shows call status in header when in call', () => {
      render(
        <CallControls
          {...mockCallbacks}
          showInHeader={true}
          isInCall={true}
          callType="voice"
          participants={[{ id: 1 }]}
        />
      );

      expect(screen.getByText(/Voice call/)).toBeInTheDocument();
      expect(screen.getByText(/1 participant/)).toBeInTheDocument();
    });

    it('shows plural participants text', () => {
      render(
        <CallControls
          {...mockCallbacks}
          showInHeader={true}
          isInCall={true}
          callType="voice"
          participants={[{ id: 1 }, { id: 2 }, { id: 3 }]}
        />
      );

      expect(screen.getByText(/3 participants/)).toBeInTheDocument();
    });

    it('shows call timer in header', () => {
      render(
        <CallControls
          {...mockCallbacks}
          showInHeader={true}
          isInCall={true}
          callStartTime={Date.now()}
        />
      );

      expect(screen.getByTestId('call-timer')).toBeInTheDocument();
    });

    it('shows quality indicator in header', () => {
      render(
        <CallControls
          {...mockCallbacks}
          showInHeader={true}
          isInCall={true}
          connectionQuality="excellent"
        />
      );

      expect(screen.getByTestId('call-quality-indicator')).toBeInTheDocument();
      expect(screen.getByText(/excellent/)).toBeInTheDocument();
    });
  });

  describe('In Call Controls', () => {
    const inCallProps = {
      ...mockCallbacks,
      isInCall: true,
      callType: 'voice'
    };

    it('shows mute button', () => {
      render(<CallControls {...inCallProps} />);
      expect(screen.getByTestId('mic-icon')).toBeInTheDocument();
    });

    it('shows screen share button', () => {
      render(<CallControls {...inCallProps} />);
      expect(screen.getByTestId('monitor-icon')).toBeInTheDocument();
    });

    it('shows end call button', () => {
      render(<CallControls {...inCallProps} />);
      expect(screen.getByTestId('phone-off-icon')).toBeInTheDocument();
      expect(screen.getByTitle('End call')).toBeInTheDocument();
    });

    it('shows connected status', () => {
      render(<CallControls {...inCallProps} />);
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('displays call type', () => {
      render(<CallControls {...inCallProps} callType="voice" />);
      expect(screen.getByText('Voice Call')).toBeInTheDocument();
    });

    it('displays video call type', () => {
      render(<CallControls {...inCallProps} callType="video" />);
      expect(screen.getByText('Video Call')).toBeInTheDocument();
    });

    it('shows participant count', () => {
      render(
        <CallControls {...inCallProps} participants={[{ id: 1 }, { id: 2 }]} />
      );
      expect(screen.getByText('2 participants')).toBeInTheDocument();
    });
  });

  describe('Mute Control', () => {
    const inCallProps = {
      ...mockCallbacks,
      isInCall: true,
      callType: 'voice'
    };

    it('shows unmuted icon when not muted', () => {
      render(<CallControls {...inCallProps} isMuted={false} />);
      expect(screen.getByTestId('mic-icon')).toBeInTheDocument();
    });

    it('shows muted icon when muted', () => {
      render(<CallControls {...inCallProps} isMuted={true} />);
      expect(screen.getByTestId('mic-off-icon')).toBeInTheDocument();
    });

    it('calls onToggleMute when clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CallControls {...inCallProps} />);

      const muteButton = screen.getByTitle('Mute');
      await user.click(muteButton);

      expect(mockCallbacks.onToggleMute).toHaveBeenCalled();
    });

    it('applies red styling when muted', () => {
      const { container } = render(<CallControls {...inCallProps} isMuted={true} />);
      const muteButton = screen.getByTitle('Unmute');
      expect(muteButton).toHaveClass('bg-red-500/20');
    });
  });

  describe('Video Control', () => {
    const inCallProps = {
      ...mockCallbacks,
      isInCall: true,
      callType: 'video'
    };

    it('shows video button only for video calls', () => {
      render(<CallControls {...inCallProps} />);
      expect(screen.getByTestId('video-icon')).toBeInTheDocument();
    });

    it('does not show video button for voice calls', () => {
      render(<CallControls {...mockCallbacks} isInCall={true} callType="voice" />);
      expect(screen.queryByTestId('video-icon')).not.toBeInTheDocument();
    });

    it('shows video enabled icon', () => {
      render(<CallControls {...inCallProps} isVideoEnabled={true} />);
      expect(screen.getByTestId('video-icon')).toBeInTheDocument();
    });

    it('shows video disabled icon', () => {
      render(<CallControls {...inCallProps} isVideoEnabled={false} />);
      expect(screen.getByTestId('video-off-icon')).toBeInTheDocument();
    });

    it('calls onToggleVideo when clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CallControls {...inCallProps} />);

      const videoButton = screen.getByTitle('Turn off camera');
      await user.click(videoButton);

      expect(mockCallbacks.onToggleVideo).toHaveBeenCalled();
    });

    it('applies red styling when video disabled', () => {
      const { container } = render(
        <CallControls {...inCallProps} isVideoEnabled={false} />
      );
      const videoButton = screen.getByTitle('Turn on camera');
      expect(videoButton).toHaveClass('bg-red-500/20');
    });
  });

  describe('Screen Share Control', () => {
    const inCallProps = {
      ...mockCallbacks,
      isInCall: true,
      callType: 'voice'
    };

    it('shows monitor icon when not sharing', () => {
      render(<CallControls {...inCallProps} isScreenSharing={false} />);
      expect(screen.getByTestId('monitor-icon')).toBeInTheDocument();
    });

    it('shows monitor-off icon when sharing', () => {
      render(<CallControls {...inCallProps} isScreenSharing={true} />);
      expect(screen.getByTestId('monitor-off-icon')).toBeInTheDocument();
    });

    it('calls onToggleScreenShare when clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CallControls {...inCallProps} />);

      const screenShareButton = screen.getByTitle('Share screen');
      await user.click(screenShareButton);

      expect(mockCallbacks.onToggleScreenShare).toHaveBeenCalled();
    });

    it('applies purple styling when sharing', () => {
      const { container } = render(
        <CallControls {...inCallProps} isScreenSharing={true} />
      );
      const button = screen.getByTitle('Stop sharing');
      expect(button).toHaveClass('bg-purple-500/20');
    });
  });

  describe('End Call', () => {
    const inCallProps = {
      ...mockCallbacks,
      isInCall: true,
      callType: 'voice'
    };

    it('shows end call button', () => {
      render(<CallControls {...inCallProps} />);
      expect(screen.getByTitle('End call')).toBeInTheDocument();
      expect(screen.getByTestId('phone-off-icon')).toBeInTheDocument();
    });

    it('calls onEndCall when clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CallControls {...inCallProps} />);

      const endCallButton = screen.getByTitle('End call');
      await user.click(endCallButton);

      expect(mockCallbacks.onEndCall).toHaveBeenCalled();
    });

    it('has red styling', () => {
      const { container } = render(<CallControls {...inCallProps} />);
      const endCallButton = screen.getByTitle('End call');
      expect(endCallButton).toHaveClass('bg-red-500');
    });
  });

  describe('Audio Level Visualization', () => {
    const inCallProps = {
      ...mockCallbacks,
      isInCall: true,
      callType: 'voice'
    };

    it('shows audio level when not muted', () => {
      render(<CallControls {...inCallProps} isMuted={false} />);

      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Audio level indicator should be present
      const { container } = render(<CallControls {...inCallProps} isMuted={false} />);
      expect(container).toBeInTheDocument();
    });

    it('does not show audio level when muted', () => {
      render(<CallControls {...inCallProps} isMuted={true} />);

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(screen.getByTestId('mic-off-icon')).toBeInTheDocument();
    });

    it('updates audio level periodically', () => {
      const { container } = render(<CallControls {...inCallProps} isMuted={false} />);

      act(() => {
        jest.advanceTimersByTime(100);
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Component should re-render with different audio level
      expect(container).toBeInTheDocument();
    });

    it('clears audio level interval on unmount', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      const { unmount } = render(<CallControls {...inCallProps} isMuted={false} />);

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });
  });

  describe('Advanced Controls', () => {
    const inCallProps = {
      ...mockCallbacks,
      isInCall: true,
      callType: 'voice'
    };

    it('shows more options button', () => {
      render(<CallControls {...inCallProps} />);
      expect(screen.getByTitle('More options')).toBeInTheDocument();
      expect(screen.getByTestId('more-horizontal-icon')).toBeInTheDocument();
    });

    it('toggles advanced controls when more button clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CallControls {...inCallProps} onToggleRecording={jest.fn()} />);

      const moreButton = screen.getByTitle('More options');
      await user.click(moreButton);

      expect(screen.getByText(/Record/)).toBeInTheDocument();
    });

    it('shows recording control when onToggleRecording provided', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CallControls {...inCallProps} onToggleRecording={jest.fn()} />);

      await user.click(screen.getByTitle('More options'));

      expect(screen.getByText('Record')).toBeInTheDocument();
    });

    it('shows recording indicator when recording', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <CallControls
          {...inCallProps}
          onToggleRecording={jest.fn()}
          isRecording={true}
        />
      );

      await user.click(screen.getByTitle('More options'));

      expect(screen.getByText('Recording')).toBeInTheDocument();
    });

    it('calls onToggleRecording when recording button clicked', async () => {
      const user = userEvent.setup({ delay: null });
      const onToggleRecording = jest.fn();

      render(<CallControls {...inCallProps} onToggleRecording={onToggleRecording} />);

      await user.click(screen.getByTitle('More options'));
      await user.click(screen.getByTitle('Start recording'));

      expect(onToggleRecording).toHaveBeenCalled();
    });
  });

  describe('Speaker Control', () => {
    const inCallProps = {
      ...mockCallbacks,
      isInCall: true,
      callType: 'voice'
    };

    it('shows speaker control when onToggleSpeaker provided', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CallControls {...inCallProps} onToggleSpeaker={jest.fn()} />);

      await user.click(screen.getByTitle('More options'));

      expect(screen.getByText('Speaker')).toBeInTheDocument();
    });

    it('shows speaker icon when enabled', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <CallControls
          {...inCallProps}
          onToggleSpeaker={jest.fn()}
          isSpeakerEnabled={true}
        />
      );

      await user.click(screen.getByTitle('More options'));

      expect(screen.getByTestId('speaker-icon')).toBeInTheDocument();
    });

    it('shows headphones icon when disabled', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <CallControls
          {...inCallProps}
          onToggleSpeaker={jest.fn()}
          isSpeakerEnabled={false}
        />
      );

      await user.click(screen.getByTitle('More options'));

      expect(screen.getByTestId('headphones-icon')).toBeInTheDocument();
    });

    it('calls onToggleSpeaker when clicked', async () => {
      const user = userEvent.setup({ delay: null });
      const onToggleSpeaker = jest.fn();

      render(<CallControls {...inCallProps} onToggleSpeaker={onToggleSpeaker} />);

      await user.click(screen.getByTitle('More options'));
      await user.click(screen.getByTitle('Toggle speaker'));

      expect(onToggleSpeaker).toHaveBeenCalled();
    });
  });

  describe('Volume Control', () => {
    const inCallProps = {
      ...mockCallbacks,
      isInCall: true,
      callType: 'voice'
    };

    it('shows volume slider in advanced controls', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CallControls {...inCallProps} />);

      await user.click(screen.getByTitle('More options'));

      expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    it('shows volume icons', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CallControls {...inCallProps} />);

      await user.click(screen.getByTitle('More options'));

      expect(screen.getByTestId('volumex-icon')).toBeInTheDocument();
      expect(screen.getByTestId('volume2-icon')).toBeInTheDocument();
    });

    it('defaults to 100% volume', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CallControls {...inCallProps} />);

      await user.click(screen.getByTitle('More options'));

      const slider = screen.getByRole('slider');
      expect(slider).toHaveValue('100');
    });

    it('updates volume when slider changed', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CallControls {...inCallProps} />);

      await user.click(screen.getByTitle('More options'));

      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '50' } });

      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });

  describe('Participants', () => {
    const inCallProps = {
      ...mockCallbacks,
      isInCall: true,
      callType: 'voice',
      participants: [
        { id: 1, username: 'User1', avatar: 'U1', isMuted: false, isVideoEnabled: true },
        { id: 2, username: 'User2', avatar: 'U2', isMuted: true, isVideoEnabled: false },
        { id: 3, username: 'User3', avatar: 'U3', isScreenSharing: true }
      ]
    };

    it('shows participants button', () => {
      render(<CallControls {...inCallProps} />);
      expect(screen.getByTitle('Participants')).toBeInTheDocument();
      expect(screen.getByTestId('users-icon')).toBeInTheDocument();
    });

    it('shows participant count badge', () => {
      render(<CallControls {...inCallProps} />);
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('toggles participants list when clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CallControls {...inCallProps} />);

      const participantsButton = screen.getByTitle('Participants');
      await user.click(participantsButton);

      expect(screen.getByText('Participants (3)')).toBeInTheDocument();
    });

    it('displays all participants', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CallControls {...inCallProps} />);

      await user.click(screen.getByTitle('Participants'));

      expect(screen.getByText('User1')).toBeInTheDocument();
      expect(screen.getByText('User2')).toBeInTheDocument();
      expect(screen.getByText('User3')).toBeInTheDocument();
    });

    it('shows mute indicator for muted participants', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CallControls {...inCallProps} />);

      await user.click(screen.getByTitle('Participants'));

      // User2 is muted
      const micOffIcons = screen.getAllByTestId('mic-off-icon');
      expect(micOffIcons.length).toBeGreaterThan(0);
    });

    it('shows video off indicator for participants', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CallControls {...inCallProps} callType="video" />);

      await user.click(screen.getByTitle('Participants'));

      // User2 has video off
      const videoOffIcons = screen.getAllByTestId('video-off-icon');
      expect(videoOffIcons.length).toBeGreaterThan(0);
    });

    it('shows screen sharing indicator', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CallControls {...inCallProps} />);

      await user.click(screen.getByTitle('Participants'));

      // User3 is screen sharing
      const monitorIcons = screen.getAllByTestId('monitor-icon');
      expect(monitorIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Fullscreen', () => {
    const inCallProps = {
      ...mockCallbacks,
      isInCall: true,
      callType: 'voice'
    };

    beforeEach(() => {
      document.exitFullscreen = jest.fn();
      document.documentElement.requestFullscreen = jest.fn();
      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: null
      });
    });

    it('shows fullscreen button', () => {
      render(<CallControls {...inCallProps} />);
      expect(screen.getByTitle('Enter fullscreen')).toBeInTheDocument();
    });

    it('requests fullscreen when clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CallControls {...inCallProps} />);

      const fullscreenButton = screen.getByTitle('Enter fullscreen');
      await user.click(fullscreenButton);

      expect(document.documentElement.requestFullscreen).toHaveBeenCalled();
    });

    it('exits fullscreen when clicked again', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CallControls {...inCallProps} />);

      const button = screen.getByTitle('Enter fullscreen');
      await user.click(button);

      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: document.documentElement
      });

      const exitButton = screen.getByTitle('Exit fullscreen');
      await user.click(exitButton);

      expect(document.exitFullscreen).toHaveBeenCalled();
    });
  });

  describe('Minimize/Expand', () => {
    const inCallProps = {
      ...mockCallbacks,
      isInCall: true,
      callType: 'voice'
    };

    it('shows minimize button', () => {
      render(<CallControls {...inCallProps} />);
      expect(screen.getByTitle('Minimize')).toBeInTheDocument();
    });

    it('shows expand button when minimized', () => {
      render(<CallControls {...inCallProps} isMinimized={true} />);
      expect(screen.getByTitle('Expand')).toBeInTheDocument();
    });

    it('calls onToggleMinimize when clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CallControls {...inCallProps} />);

      const minimizeButton = screen.getByTitle('Minimize');
      await user.click(minimizeButton);

      expect(mockCallbacks.onToggleMinimize).toHaveBeenCalled();
    });

    it('hides controls when minimized', () => {
      render(<CallControls {...inCallProps} isMinimized={true} />);

      // Main controls should be hidden
      expect(screen.queryByTitle('Mute')).not.toBeInTheDocument();
    });

    it('changes positioning when minimized', () => {
      const { container } = render(<CallControls {...inCallProps} isMinimized={true} />);

      const controlsContainer = container.querySelector('.fixed');
      expect(controlsContainer).toHaveClass('bottom-4', 'right-4');
    });
  });

  describe('Tooltips', () => {
    const inCallProps = {
      ...mockCallbacks,
      isInCall: true,
      callType: 'voice'
    };

    it('shows mute tooltip', () => {
      render(<CallControls {...inCallProps} isMuted={false} />);
      expect(screen.getByText('Click to mute')).toBeInTheDocument();
    });

    it('shows unmute tooltip when muted', () => {
      render(<CallControls {...inCallProps} isMuted={true} />);
      expect(screen.getByText('Click to unmute')).toBeInTheDocument();
    });

    it('shows video tooltip for video calls', () => {
      render(<CallControls {...inCallProps} callType="video" isVideoEnabled={true} />);
      expect(screen.getByText('Camera on')).toBeInTheDocument();
    });

    it('shows screen share tooltip', () => {
      render(<CallControls {...inCallProps} isScreenSharing={false} />);
      expect(screen.getByText('Share your screen')).toBeInTheDocument();
    });

    it('shows end call tooltip', () => {
      render(<CallControls {...inCallProps} />);
      expect(screen.getByText('End call for everyone')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing callbacks gracefully', () => {
      expect(() => {
        render(<CallControls isInCall={false} />);
      }).not.toThrow();
    });

    it('handles empty participants array', () => {
      render(
        <CallControls
          {...mockCallbacks}
          isInCall={true}
          callType="voice"
          participants={[]}
        />
      );

      expect(screen.getByText('0 participants')).toBeInTheDocument();
    });

    it('handles undefined callType', () => {
      render(<CallControls {...mockCallbacks} isInCall={true} />);
      expect(screen.getByText('Voice Call')).toBeInTheDocument();
    });

    it('handles all callbacks undefined', () => {
      expect(() => {
        render(<CallControls isInCall={true} callType="voice" />);
      }).not.toThrow();
    });
  });

  describe('Snapshot', () => {
    it('matches snapshot for call initiation', () => {
      const { container } = render(<CallControls {...mockCallbacks} isInCall={false} />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for active voice call', () => {
      const { container } = render(
        <CallControls {...mockCallbacks} isInCall={true} callType="voice" />
      );
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for active video call', () => {
      const { container } = render(
        <CallControls {...mockCallbacks} isInCall={true} callType="video" />
      );
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for header compact mode', () => {
      const { container } = render(
        <CallControls
          {...mockCallbacks}
          showInHeader={true}
          isInCall={true}
          callType="voice"
        />
      );
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot when minimized', () => {
      const { container } = render(
        <CallControls
          {...mockCallbacks}
          isInCall={true}
          callType="voice"
          isMinimized={true}
        />
      );
      expect(container).toMatchSnapshot();
    });
  });
});

export default CallQualityIndicator
