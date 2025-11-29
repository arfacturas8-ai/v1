/**
 * Tests for CallTimer component
 */
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CallTimer from './CallTimer';

jest.mock('lucide-react', () => ({
  Clock: ({ size }) => <svg data-testid="clock-icon" width={size} height={size} />,
  Square: ({ size }) => <svg data-testid="square-icon" width={size} height={size} />
}));

describe('CallTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<CallTimer />);
    });

    it('renders timer display', () => {
      render(<CallTimer isActive={true} />);
      expect(screen.getByText('0s')).toBeInTheDocument();
    });

    it('renders clock icon', () => {
      render(<CallTimer isActive={true} />);
      expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
    });

    it('shows inactive state by default', () => {
      render(<CallTimer />);
      expect(screen.getByText('Call ended')).toBeInTheDocument();
    });

    it('shows active state when isActive', () => {
      render(<CallTimer isActive={true} />);
      expect(screen.getByText('Call in progress')).toBeInTheDocument();
    });
  });

  describe('Timer Functionality', () => {
    it('increments timer every second', () => {
      render(<CallTimer isActive={true} />);

      expect(screen.getByText('0s')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(screen.getByText('1s')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(screen.getByText('2s')).toBeInTheDocument();
    });

    it('uses startTime when provided', () => {
      const startTime = Date.now() - 5000; // Started 5 seconds ago
      render(<CallTimer isActive={true} startTime={startTime} />);

      expect(screen.getByText('5s')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(screen.getByText('6s')).toBeInTheDocument();
    });

    it('stops incrementing when isActive is false', () => {
      const { rerender } = render(<CallTimer isActive={true} />);

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(screen.getByText('3s')).toBeInTheDocument();

      rerender(<CallTimer isActive={false} />);

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(screen.getByText('0s')).toBeInTheDocument();
    });

    it('resets timer when isActive changes to false', () => {
      const { rerender } = render(<CallTimer isActive={true} />);

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(screen.getByText('10s')).toBeInTheDocument();

      rerender(<CallTimer isActive={false} />);

      expect(screen.getByText('0s')).toBeInTheDocument();
    });
  });

  describe('Time Formatting', () => {
    describe('Standard Format', () => {
      it('formats seconds only', () => {
        render(<CallTimer isActive={true} />);

        act(() => {
          jest.advanceTimersByTime(30000); // 30 seconds
        });

        expect(screen.getByText('30s')).toBeInTheDocument();
      });

      it('formats minutes and seconds', () => {
        render(<CallTimer isActive={true} />);

        act(() => {
          jest.advanceTimersByTime(90000); // 1 minute 30 seconds
        });

        expect(screen.getByText('1m 30s')).toBeInTheDocument();
      });

      it('formats hours, minutes, and seconds', () => {
        render(<CallTimer isActive={true} />);

        act(() => {
          jest.advanceTimersByTime(3665000); // 1 hour 1 minute 5 seconds
        });

        expect(screen.getByText('1h 1m 5s')).toBeInTheDocument();
      });
    });

    describe('Compact Format', () => {
      it('formats seconds in compact mode', () => {
        render(<CallTimer isActive={true} compact={true} />);

        act(() => {
          jest.advanceTimersByTime(45000); // 45 seconds
        });

        expect(screen.getByText('0:45')).toBeInTheDocument();
      });

      it('formats minutes in compact mode', () => {
        render(<CallTimer isActive={true} compact={true} />);

        act(() => {
          jest.advanceTimersByTime(125000); // 2:05
        });

        expect(screen.getByText('2:05')).toBeInTheDocument();
      });

      it('formats hours in compact mode', () => {
        render(<CallTimer isActive={true} compact={true} />);

        act(() => {
          jest.advanceTimersByTime(3665000); // 1:01:05
        });

        expect(screen.getByText('1:01:05')).toBeInTheDocument();
      });

      it('pads zeros in compact mode', () => {
        render(<CallTimer isActive={true} compact={true} />);

        act(() => {
          jest.advanceTimersByTime(65000); // 1:05
        });

        expect(screen.getByText('1:05')).toBeInTheDocument();
      });
    });
  });

  describe('Compact Mode', () => {
    it('renders compact layout', () => {
      const { container } = render(<CallTimer isActive={true} compact={true} />);

      // Compact mode has fewer elements
      expect(container.querySelector('.flex.items-center.space-x-2')).toBeInTheDocument();
    });

    it('shows smaller clock icon in compact mode', () => {
      render(<CallTimer isActive={true} compact={true} />);
      const icon = screen.getByTestId('clock-icon');
      expect(icon).toHaveAttribute('width', '12');
      expect(icon).toHaveAttribute('height', '12');
    });

    it('shows recording indicator in compact mode', () => {
      render(
        <CallTimer
          isActive={true}
          compact={true}
          isRecording={true}
        />
      );

      expect(screen.getByText('REC')).toBeInTheDocument();
    });

    it('does not show full details in compact mode', () => {
      render(<CallTimer isActive={true} compact={true} />);

      expect(screen.queryByText('Call in progress')).not.toBeInTheDocument();
    });
  });

  describe('Recording Functionality', () => {
    it('shows recording indicator when isRecording', () => {
      render(
        <CallTimer
          isActive={true}
          isRecording={true}
        />
      );

      expect(screen.getByText('Recording')).toBeInTheDocument();
    });

    it('does not show recording indicator when not recording', () => {
      render(<CallTimer isActive={true} isRecording={false} />);

      expect(screen.queryByText('Recording')).not.toBeInTheDocument();
    });

    it('shows record button when showControls is true', () => {
      const onRecord = jest.fn();
      render(
        <CallTimer
          isActive={true}
          showControls={true}
          onRecord={onRecord}
        />
      );

      expect(screen.getByTitle('Start recording')).toBeInTheDocument();
    });

    it('calls onRecord when record button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      const onRecord = jest.fn();

      render(
        <CallTimer
          isActive={true}
          showControls={true}
          onRecord={onRecord}
        />
      );

      const recordButton = screen.getByTitle('Start recording');
      await user.click(recordButton);

      expect(onRecord).toHaveBeenCalledTimes(1);
    });

    it('shows stop recording button when recording', () => {
      const onRecord = jest.fn();
      render(
        <CallTimer
          isActive={true}
          showControls={true}
          onRecord={onRecord}
          isRecording={true}
        />
      );

      expect(screen.getByTitle('Stop recording')).toBeInTheDocument();
      expect(screen.getByTestId('square-icon')).toBeInTheDocument();
    });

    it('does not show controls when showControls is false', () => {
      const onRecord = jest.fn();
      render(
        <CallTimer
          isActive={true}
          showControls={false}
          onRecord={onRecord}
        />
      );

      expect(screen.queryByTitle('Start recording')).not.toBeInTheDocument();
    });

    it('does not show controls when onRecord is not provided', () => {
      render(
        <CallTimer
          isActive={true}
          showControls={true}
        />
      );

      expect(screen.queryByTitle('Start recording')).not.toBeInTheDocument();
    });
  });

  describe('Status Colors', () => {
    it('uses green color for short calls (< 60s)', () => {
      render(<CallTimer isActive={true} />);

      act(() => {
        jest.advanceTimersByTime(30000); // 30 seconds
      });

      const { container } = render(<CallTimer isActive={true} />);
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      // Visual indicator exists
      expect(container.querySelector('.text-green-400, [class*="green"]')).toBeTruthy();
    });

    it('uses blue color for medium calls (60s - 3600s)', () => {
      const { container } = render(<CallTimer isActive={true} />);

      act(() => {
        jest.advanceTimersByTime(120000); // 2 minutes
      });

      // Visual indicator exists
      expect(container.querySelector('.text-blue-400, [class*="blue"]')).toBeTruthy();
    });

    it('uses purple color for long calls (> 3600s)', () => {
      const { container } = render(<CallTimer isActive={true} />);

      act(() => {
        jest.advanceTimersByTime(4000000); // > 1 hour
      });

      // Visual indicator exists
      expect(container.querySelector('.text-purple-400, [class*="purple"]')).toBeTruthy();
    });
  });

  describe('Call Quality Badge', () => {
    it('does not show quality badge for short calls', () => {
      render(<CallTimer isActive={true} />);

      act(() => {
        jest.advanceTimersByTime(200000); // 3+ minutes
      });

      expect(screen.queryByText('Stable')).not.toBeInTheDocument();
    });

    it('shows quality badge after 5 minutes', () => {
      render(<CallTimer isActive={true} />);

      act(() => {
        jest.advanceTimersByTime(301000); // 5+ minutes
      });

      expect(screen.getByText('Stable')).toBeInTheDocument();
    });

    it('does not show quality badge when call is not active', () => {
      render(<CallTimer isActive={false} />);

      act(() => {
        jest.advanceTimersByTime(400000);
      });

      expect(screen.queryByText('Stable')).not.toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('handles isActive prop', () => {
      const { rerender } = render(<CallTimer isActive={false} />);
      expect(screen.getByText('Call ended')).toBeInTheDocument();

      rerender(<CallTimer isActive={true} />);
      expect(screen.getByText('Call in progress')).toBeInTheDocument();
    });

    it('handles compact prop', () => {
      const { rerender } = render(<CallTimer isActive={true} compact={false} />);
      expect(screen.getByText('Call in progress')).toBeInTheDocument();

      rerender(<CallTimer isActive={true} compact={true} />);
      expect(screen.queryByText('Call in progress')).not.toBeInTheDocument();
    });

    it('handles isRecording prop', () => {
      const { rerender } = render(<CallTimer isActive={true} isRecording={false} />);
      expect(screen.queryByText('Recording')).not.toBeInTheDocument();

      rerender(<CallTimer isActive={true} isRecording={true} />);
      expect(screen.getByText('Recording')).toBeInTheDocument();
    });
  });

  describe('Cleanup', () => {
    it('clears interval on unmount', () => {
      const { unmount } = render(<CallTimer isActive={true} />);

      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('clears interval when isActive becomes false', () => {
      const { rerender } = render(<CallTimer isActive={true} />);

      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      rerender(<CallTimer isActive={false} />);

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles 0 elapsed time', () => {
      render(<CallTimer isActive={true} />);
      expect(screen.getByText('0s')).toBeInTheDocument();
    });

    it('handles exactly 60 seconds', () => {
      render(<CallTimer isActive={true} />);

      act(() => {
        jest.advanceTimersByTime(60000);
      });

      expect(screen.getByText('1m 0s')).toBeInTheDocument();
    });

    it('handles exactly 3600 seconds', () => {
      render(<CallTimer isActive={true} />);

      act(() => {
        jest.advanceTimersByTime(3600000);
      });

      expect(screen.getByText('1h 0m 0s')).toBeInTheDocument();
    });

    it('handles startTime in the future', () => {
      const futureTime = Date.now() + 10000;
      render(<CallTimer isActive={true} startTime={futureTime} />);

      // Should show 0 or handle gracefully
      expect(screen.getByText(/\ds/)).toBeInTheDocument();
    });

    it('handles rapid prop changes', () => {
      const { rerender } = render(<CallTimer isActive={false} />);

      rerender(<CallTimer isActive={true} />);
      rerender(<CallTimer isActive={false} />);
      rerender(<CallTimer isActive={true} />);

      expect(screen.getByText('Call in progress')).toBeInTheDocument();
    });
  });

  describe('Snapshot', () => {
    it('matches snapshot in active state', () => {
      const { container } = render(<CallTimer isActive={true} />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot in inactive state', () => {
      const { container } = render(<CallTimer isActive={false} />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot in compact mode', () => {
      const { container } = render(<CallTimer isActive={true} compact={true} />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with recording', () => {
      const { container } = render(
        <CallTimer isActive={true} isRecording={true} />
      );
      expect(container).toMatchSnapshot();
    });
  });
});

export default startTime
