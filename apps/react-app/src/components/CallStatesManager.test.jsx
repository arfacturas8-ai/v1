import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CallStatesManager, { CallStatesContext, useCallStates, CallStateIndicator } from './CallStatesManager';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Phone: (props) => <div data-testid="phone-icon" {...props} />,
  PhoneOff: (props) => <div data-testid="phone-off-icon" {...props} />,
  PhoneIncoming: (props) => <div data-testid="phone-incoming-icon" {...props} />,
  PhoneOutgoing: (props) => <div data-testid="phone-outgoing-icon" {...props} />,
  Loader: (props) => <div data-testid="loader-icon" {...props} />,
  AlertCircle: (props) => <div data-testid="alert-circle-icon" {...props} />,
  CheckCircle: (props) => <div data-testid="check-circle-icon" {...props} />,
  WifiOff: (props) => <div data-testid="wifi-off-icon" {...props} />,
  RefreshCw: (props) => <div data-testid="refresh-cw-icon" {...props} />,
  X: (props) => <div data-testid="x-icon" {...props} />,
}));

// Test component that uses the context
const TestConsumer = () => {
  const { state, startCall, endCall, setReconnecting, setConnected, setDisconnected, setFailed } = useCallStates();

  return (
    <div>
      <div data-testid="call-state">{state.callState}</div>
      <div data-testid="call-duration">{state.callDuration}</div>
      <div data-testid="reconnect-attempts">{state.reconnectAttempts}</div>
      <button onClick={() => startCall({ userId: 'user1', type: 'voice' })}>Start Call</button>
      <button onClick={endCall}>End Call</button>
      <button onClick={setReconnecting}>Set Reconnecting</button>
      <button onClick={setConnected}>Set Connected</button>
      <button onClick={setDisconnected}>Set Disconnected</button>
      <button onClick={setFailed}>Set Failed</button>
    </div>
  );
};

describe('CallStatesManager', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Provider Rendering', () => {
    it('renders children', () => {
      render(
        <CallStatesManager>
          <div>Test Child</div>
        </CallStatesManager>
      );
      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    it('provides initial state', () => {
      render(
        <CallStatesManager>
          <TestConsumer />
        </CallStatesManager>
      );

      expect(screen.getByTestId('call-state')).toHaveTextContent('idle');
      expect(screen.getByTestId('call-duration')).toHaveTextContent('0');
      expect(screen.getByTestId('reconnect-attempts')).toHaveTextContent('0');
    });

    it('matches snapshot', () => {
      const { container } = render(
        <CallStatesManager>
          <div>Test</div>
        </CallStatesManager>
      );
      expect(container).toMatchSnapshot();
    });
  });

  describe('Call State Transitions', () => {
    it('transitions from idle to connecting', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <CallStatesManager>
          <TestConsumer />
        </CallStatesManager>
      );

      await user.click(screen.getByText('Start Call'));

      expect(screen.getByTestId('call-state')).toHaveTextContent('connecting');
    });

    it('transitions to connected state', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <CallStatesManager>
          <TestConsumer />
        </CallStatesManager>
      );

      await user.click(screen.getByText('Start Call'));
      await user.click(screen.getByText('Set Connected'));

      expect(screen.getByTestId('call-state')).toHaveTextContent('connected');
    });

    it('transitions to reconnecting state', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <CallStatesManager>
          <TestConsumer />
        </CallStatesManager>
      );

      await user.click(screen.getByText('Start Call'));
      await user.click(screen.getByText('Set Connected'));
      await user.click(screen.getByText('Set Reconnecting'));

      expect(screen.getByTestId('call-state')).toHaveTextContent('reconnecting');
    });

    it('increments reconnect attempts', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <CallStatesManager>
          <TestConsumer />
        </CallStatesManager>
      );

      await user.click(screen.getByText('Start Call'));
      await user.click(screen.getByText('Set Connected'));
      await user.click(screen.getByText('Set Reconnecting'));

      expect(screen.getByTestId('reconnect-attempts')).toHaveTextContent('1');
    });

    it('transitions to disconnected state', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <CallStatesManager>
          <TestConsumer />
        </CallStatesManager>
      );

      await user.click(screen.getByText('Start Call'));
      await user.click(screen.getByText('Set Disconnected'));

      expect(screen.getByTestId('call-state')).toHaveTextContent('disconnected');
    });

    it('transitions to failed state', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <CallStatesManager>
          <TestConsumer />
        </CallStatesManager>
      );

      await user.click(screen.getByText('Start Call'));
      await user.click(screen.getByText('Set Failed'));

      expect(screen.getByTestId('call-state')).toHaveTextContent('failed');
    });

    it('transitions to ended state', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <CallStatesManager>
          <TestConsumer />
        </CallStatesManager>
      );

      await user.click(screen.getByText('Start Call'));
      await user.click(screen.getByText('Set Connected'));
      await user.click(screen.getByText('End Call'));

      expect(screen.getByTestId('call-state')).toHaveTextContent('ended');
    });

    it('resets to idle after ended', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <CallStatesManager>
          <TestConsumer />
        </CallStatesManager>
      );

      await user.click(screen.getByText('Start Call'));
      await user.click(screen.getByText('End Call'));

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(screen.getByTestId('call-state')).toHaveTextContent('idle');
      });
    });
  });

  describe('Call Duration Tracking', () => {
    it('starts tracking duration when connected', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <CallStatesManager>
          <TestConsumer />
        </CallStatesManager>
      );

      await user.click(screen.getByText('Start Call'));
      await user.click(screen.getByText('Set Connected'));

      expect(screen.getByTestId('call-duration')).toHaveTextContent('0');

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByTestId('call-duration')).toHaveTextContent('1');
      });
    });

    it('continues duration during reconnecting', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <CallStatesManager>
          <TestConsumer />
        </CallStatesManager>
      );

      await user.click(screen.getByText('Start Call'));
      await user.click(screen.getByText('Set Connected'));

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await user.click(screen.getByText('Set Reconnecting'));

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(parseInt(screen.getByTestId('call-duration').textContent)).toBeGreaterThanOrEqual(9);
      });
    });

    it('stops duration when call ends', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <CallStatesManager>
          <TestConsumer />
        </CallStatesManager>
      );

      await user.click(screen.getByText('Start Call'));
      await user.click(screen.getByText('Set Connected'));

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await user.click(screen.getByText('End Call'));

      const durationAtEnd = parseInt(screen.getByTestId('call-duration').textContent);

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(parseInt(screen.getByTestId('call-duration').textContent)).toBe(durationAtEnd);
    });

    it('resets duration on new call', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <CallStatesManager>
          <TestConsumer />
        </CallStatesManager>
      );

      await user.click(screen.getByText('Start Call'));
      await user.click(screen.getByText('Set Connected'));

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      await user.click(screen.getByText('End Call'));

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await user.click(screen.getByText('Start Call'));

      expect(screen.getByTestId('call-duration')).toHaveTextContent('0');
    });
  });

  describe('Reconnection Attempts', () => {
    it('tracks reconnection attempts', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <CallStatesManager>
          <TestConsumer />
        </CallStatesManager>
      );

      await user.click(screen.getByText('Start Call'));
      await user.click(screen.getByText('Set Connected'));

      await user.click(screen.getByText('Set Reconnecting'));
      expect(screen.getByTestId('reconnect-attempts')).toHaveTextContent('1');

      await user.click(screen.getByText('Set Connected'));
      await user.click(screen.getByText('Set Reconnecting'));
      expect(screen.getByTestId('reconnect-attempts')).toHaveTextContent('2');
    });

    it('resets reconnection attempts on successful reconnection', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <CallStatesManager>
          <TestConsumer />
        </CallStatesManager>
      );

      await user.click(screen.getByText('Start Call'));
      await user.click(screen.getByText('Set Connected'));
      await user.click(screen.getByText('Set Reconnecting'));

      expect(screen.getByTestId('reconnect-attempts')).toHaveTextContent('1');

      await user.click(screen.getByText('Set Connected'));

      expect(screen.getByTestId('reconnect-attempts')).toHaveTextContent('0');
    });

    it('resets reconnection attempts on new call', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <CallStatesManager>
          <TestConsumer />
        </CallStatesManager>
      );

      await user.click(screen.getByText('Start Call'));
      await user.click(screen.getByText('Set Connected'));
      await user.click(screen.getByText('Set Reconnecting'));
      await user.click(screen.getByText('Set Reconnecting'));

      expect(screen.getByTestId('reconnect-attempts')).toHaveTextContent('2');

      await user.click(screen.getByText('End Call'));

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await user.click(screen.getByText('Start Call'));

      expect(screen.getByTestId('reconnect-attempts')).toHaveTextContent('0');
    });
  });

  describe('Call Metadata', () => {
    it('stores call type', async () => {
      const TestCallType = () => {
        const { state, startCall } = useCallStates();
        return (
          <div>
            <div data-testid="call-type">{state.callType || 'none'}</div>
            <button onClick={() => startCall({ userId: 'user1', type: 'voice' })}>
              Voice Call
            </button>
            <button onClick={() => startCall({ userId: 'user1', type: 'video' })}>
              Video Call
            </button>
          </div>
        );
      };

      const user = userEvent.setup({ delay: null });
      render(
        <CallStatesManager>
          <TestCallType />
        </CallStatesManager>
      );

      await user.click(screen.getByText('Voice Call'));
      expect(screen.getByTestId('call-type')).toHaveTextContent('voice');
    });

    it('stores participant ID', async () => {
      const TestParticipant = () => {
        const { state, startCall } = useCallStates();
        return (
          <div>
            <div data-testid="participant-id">{state.participantId || 'none'}</div>
            <button onClick={() => startCall({ userId: 'user123', type: 'voice' })}>
              Start Call
            </button>
          </div>
        );
      };

      const user = userEvent.setup({ delay: null });
      render(
        <CallStatesManager>
          <TestParticipant />
        </CallStatesManager>
      );

      await user.click(screen.getByText('Start Call'));
      expect(screen.getByTestId('participant-id')).toHaveTextContent('user123');
    });

    it('stores start time', async () => {
      const TestStartTime = () => {
        const { state, startCall } = useCallStates();
        return (
          <div>
            <div data-testid="start-time">{state.startTime || 'none'}</div>
            <button onClick={() => startCall({ userId: 'user1', type: 'voice' })}>
              Start Call
            </button>
          </div>
        );
      };

      const user = userEvent.setup({ delay: null });
      render(
        <CallStatesManager>
          <TestStartTime />
        </CallStatesManager>
      );

      await user.click(screen.getByText('Start Call'));
      expect(screen.getByTestId('start-time')).not.toHaveTextContent('none');
    });
  });

  describe('useCallStates Hook', () => {
    it('throws error when used outside provider', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow();

      consoleErrorSpy.mockRestore();
    });

    it('provides all context methods', () => {
      const TestMethods = () => {
        const context = useCallStates();
        return (
          <div>
            <div data-testid="has-start-call">{typeof context.startCall === 'function' ? 'yes' : 'no'}</div>
            <div data-testid="has-end-call">{typeof context.endCall === 'function' ? 'yes' : 'no'}</div>
            <div data-testid="has-set-reconnecting">{typeof context.setReconnecting === 'function' ? 'yes' : 'no'}</div>
            <div data-testid="has-set-connected">{typeof context.setConnected === 'function' ? 'yes' : 'no'}</div>
          </div>
        );
      };

      render(
        <CallStatesManager>
          <TestMethods />
        </CallStatesManager>
      );

      expect(screen.getByTestId('has-start-call')).toHaveTextContent('yes');
      expect(screen.getByTestId('has-end-call')).toHaveTextContent('yes');
      expect(screen.getByTestId('has-set-reconnecting')).toHaveTextContent('yes');
      expect(screen.getByTestId('has-set-connected')).toHaveTextContent('yes');
    });
  });

  describe('CallStateIndicator Component', () => {
    it('renders idle state', () => {
      render(
        <CallStatesManager>
          <CallStateIndicator />
        </CallStatesManager>
      );

      expect(screen.getByText(/idle/i)).toBeInTheDocument();
    });

    it('renders connecting state', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <CallStatesManager>
          <TestConsumer />
          <CallStateIndicator />
        </CallStatesManager>
      );

      await user.click(screen.getByText('Start Call'));

      expect(screen.getByText(/connecting/i)).toBeInTheDocument();
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    });

    it('renders connected state', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <CallStatesManager>
          <TestConsumer />
          <CallStateIndicator />
        </CallStatesManager>
      );

      await user.click(screen.getByText('Start Call'));
      await user.click(screen.getByText('Set Connected'));

      expect(screen.getByText(/connected/i)).toBeInTheDocument();
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
    });

    it('renders reconnecting state', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <CallStatesManager>
          <TestConsumer />
          <CallStateIndicator />
        </CallStatesManager>
      );

      await user.click(screen.getByText('Start Call'));
      await user.click(screen.getByText('Set Connected'));
      await user.click(screen.getByText('Set Reconnecting'));

      expect(screen.getByText(/reconnecting/i)).toBeInTheDocument();
      expect(screen.getByTestId('refresh-cw-icon')).toBeInTheDocument();
    });

    it('shows reconnect attempt count', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <CallStatesManager>
          <TestConsumer />
          <CallStateIndicator />
        </CallStatesManager>
      );

      await user.click(screen.getByText('Start Call'));
      await user.click(screen.getByText('Set Connected'));
      await user.click(screen.getByText('Set Reconnecting'));

      expect(screen.getByText(/attempt 1/i)).toBeInTheDocument();
    });

    it('renders failed state', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <CallStatesManager>
          <TestConsumer />
          <CallStateIndicator />
        </CallStatesManager>
      );

      await user.click(screen.getByText('Start Call'));
      await user.click(screen.getByText('Set Failed'));

      expect(screen.getByText(/failed/i)).toBeInTheDocument();
      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
    });

    it('renders disconnected state', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <CallStatesManager>
          <TestConsumer />
          <CallStateIndicator />
        </CallStatesManager>
      );

      await user.click(screen.getByText('Start Call'));
      await user.click(screen.getByText('Set Disconnected'));

      expect(screen.getByText(/disconnected/i)).toBeInTheDocument();
      expect(screen.getByTestId('wifi-off-icon')).toBeInTheDocument();
    });

    it('shows call duration when connected', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <CallStatesManager>
          <TestConsumer />
          <CallStateIndicator />
        </CallStatesManager>
      );

      await user.click(screen.getByText('Start Call'));
      await user.click(screen.getByText('Set Connected'));

      act(() => {
        jest.advanceTimersByTime(65000); // 1 minute 5 seconds
      });

      await waitFor(() => {
        expect(screen.getByText(/1:0/i)).toBeInTheDocument();
      });
    });

    it('renders in compact mode', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <CallStatesManager>
          <TestConsumer />
          <CallStateIndicator compact={true} />
        </CallStatesManager>
      );

      await user.click(screen.getByText('Start Call'));
      await user.click(screen.getByText('Set Connected'));

      // In compact mode, should show icon only
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <CallStatesManager>
          <CallStateIndicator className="custom-class" />
        </CallStatesManager>
      );

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('matches snapshot for each state', async () => {
      const user = userEvent.setup({ delay: null });
      const { container } = render(
        <CallStatesManager>
          <TestConsumer />
          <CallStateIndicator />
        </CallStatesManager>
      );

      // Idle
      expect(container).toMatchSnapshot('idle');

      // Connecting
      await user.click(screen.getByText('Start Call'));
      expect(container).toMatchSnapshot('connecting');

      // Connected
      await user.click(screen.getByText('Set Connected'));
      expect(container).toMatchSnapshot('connected');
    });
  });

  describe('Error Handling', () => {
    it('handles invalid call start parameters', async () => {
      const TestInvalid = () => {
        const { startCall } = useCallStates();
        return (
          <button onClick={() => startCall(null)}>
            Invalid Start
          </button>
        );
      };

      const user = userEvent.setup({ delay: null });
      render(
        <CallStatesManager>
          <TestInvalid />
        </CallStatesManager>
      );

      // Should not throw
      await user.click(screen.getByText('Invalid Start'));
    });

    it('handles state transitions from invalid states', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <CallStatesManager>
          <TestConsumer />
        </CallStatesManager>
      );

      // Try to end call when not in call
      await user.click(screen.getByText('End Call'));

      expect(screen.getByTestId('call-state')).toHaveTextContent('idle');
    });
  });

  describe('Cleanup', () => {
    it('clears timers on unmount', () => {
      const { unmount } = render(
        <CallStatesManager>
          <TestConsumer />
        </CallStatesManager>
      );

      unmount();

      // Should not throw when advancing timers after unmount
      expect(() => {
        act(() => {
          jest.advanceTimersByTime(10000);
        });
      }).not.toThrow();
    });

    it('clears duration timer when ending call', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <CallStatesManager>
          <TestConsumer />
        </CallStatesManager>
      );

      await user.click(screen.getByText('Start Call'));
      await user.click(screen.getByText('Set Connected'));

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await user.click(screen.getByText('End Call'));

      const durationAfterEnd = parseInt(screen.getByTestId('call-duration').textContent);

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      // Duration should not change after call ended
      expect(parseInt(screen.getByTestId('call-duration').textContent)).toBe(durationAfterEnd);
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid state changes', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <CallStatesManager>
          <TestConsumer />
        </CallStatesManager>
      );

      await user.click(screen.getByText('Start Call'));
      await user.click(screen.getByText('Set Connected'));
      await user.click(screen.getByText('Set Reconnecting'));
      await user.click(screen.getByText('Set Connected'));
      await user.click(screen.getByText('Set Reconnecting'));
      await user.click(screen.getByText('Set Connected'));

      expect(screen.getByTestId('call-state')).toHaveTextContent('connected');
    });

    it('handles multiple start calls', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <CallStatesManager>
          <TestConsumer />
        </CallStatesManager>
      );

      await user.click(screen.getByText('Start Call'));
      await user.click(screen.getByText('Start Call'));
      await user.click(screen.getByText('Start Call'));

      expect(screen.getByTestId('call-state')).toHaveTextContent('connecting');
    });

    it('handles very long call durations', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <CallStatesManager>
          <TestConsumer />
        </CallStatesManager>
      );

      await user.click(screen.getByText('Start Call'));
      await user.click(screen.getByText('Set Connected'));

      act(() => {
        jest.advanceTimersByTime(7200000); // 2 hours
      });

      await waitFor(() => {
        const duration = parseInt(screen.getByTestId('call-duration').textContent);
        expect(duration).toBeGreaterThan(7000);
      });
    });

    it('handles many reconnection attempts', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <CallStatesManager>
          <TestConsumer />
        </CallStatesManager>
      );

      await user.click(screen.getByText('Start Call'));
      await user.click(screen.getByText('Set Connected'));

      for (let i = 0; i < 10; i++) {
        await user.click(screen.getByText('Set Reconnecting'));
        await user.click(screen.getByText('Set Connected'));
      }

      await user.click(screen.getByText('Set Reconnecting'));

      expect(screen.getByTestId('reconnect-attempts')).toHaveTextContent('1');
    });
  });
});

export default TestConsumer
