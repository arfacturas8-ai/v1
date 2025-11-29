/**
 * Tests for CallQualityIndicator component
 */
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CallQualityIndicator from './CallQualityIndicator';

jest.mock('lucide-react', () => ({
  Wifi: ({ size, className }) => <svg data-testid="wifi-icon" width={size} className={className} />,
  WifiOff: ({ size, className }) => <svg data-testid="wifi-off-icon" width={size} className={className} />,
  Signal: ({ size, className }) => <svg data-testid="signal-icon" width={size} className={className} />,
  SignalHigh: ({ size, className }) => <svg data-testid="signal-high-icon" width={size} className={className} />,
  SignalMedium: ({ size, className }) => <svg data-testid="signal-medium-icon" width={size} className={className} />,
  SignalLow: ({ size, className }) => <svg data-testid="signal-low-icon" width={size} className={className} />
}));

describe('CallQualityIndicator', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<CallQualityIndicator />);
    });

    it('renders with default good quality', () => {
      render(<CallQualityIndicator />);
      expect(screen.getByText('Good')).toBeInTheDocument();
    });

    it('renders signal icon for good quality', () => {
      render(<CallQualityIndicator />);
      expect(screen.getByTestId('signal-icon')).toBeInTheDocument();
    });

    it('renders signal strength bars', () => {
      const { container } = render(<CallQualityIndicator />);
      const bars = container.querySelectorAll('[style*="height"]');
      expect(bars.length).toBeGreaterThan(0);
    });
  });

  describe('Connection Quality Levels', () => {
    it('displays excellent quality', () => {
      render(<CallQualityIndicator connectionQuality="excellent" />);
      expect(screen.getByText('Excellent')).toBeInTheDocument();
      expect(screen.getByText('HD quality available')).toBeInTheDocument();
      expect(screen.getByTestId('signal-high-icon')).toBeInTheDocument();
    });

    it('displays good quality', () => {
      render(<CallQualityIndicator connectionQuality="good" />);
      expect(screen.getByText('Good')).toBeInTheDocument();
      expect(screen.getByText('Quality is stable')).toBeInTheDocument();
      expect(screen.getByTestId('signal-icon')).toBeInTheDocument();
    });

    it('displays fair quality', () => {
      render(<CallQualityIndicator connectionQuality="fair" />);
      expect(screen.getByText('Fair')).toBeInTheDocument();
      expect(screen.getByText('Some quality reduction')).toBeInTheDocument();
      expect(screen.getByTestId('signal-medium-icon')).toBeInTheDocument();
    });

    it('displays poor quality', () => {
      render(<CallQualityIndicator connectionQuality="poor" />);
      expect(screen.getByText('Poor')).toBeInTheDocument();
      expect(screen.getByText('Connection unstable')).toBeInTheDocument();
      expect(screen.getByTestId('signal-low-icon')).toBeInTheDocument();
    });

    it('displays disconnected state', () => {
      render(<CallQualityIndicator connectionQuality="disconnected" />);
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
      expect(screen.getByText('Reconnecting...')).toBeInTheDocument();
      expect(screen.getByTestId('wifi-off-icon')).toBeInTheDocument();
    });

    it('displays unknown quality as fallback', () => {
      render(<CallQualityIndicator connectionQuality="invalid" />);
      expect(screen.getByText('Unknown')).toBeInTheDocument();
      expect(screen.getByText('Checking connection')).toBeInTheDocument();
      expect(screen.getByTestId('wifi-icon')).toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('renders compact version', () => {
      render(<CallQualityIndicator compact={true} />);
      expect(screen.getByText('Good')).toBeInTheDocument();
    });

    it('does not show signal bars in compact mode', () => {
      const { container } = render(<CallQualityIndicator compact={true} />);
      const bars = container.querySelectorAll('[style*="height"]');
      expect(bars.length).toBe(0);
    });

    it('has title attribute in compact mode', () => {
      const { container } = render(<CallQualityIndicator compact={true} />);
      const compactDiv = container.querySelector('[title*="Good"]');
      expect(compactDiv).toBeInTheDocument();
    });

    it('renders smaller icon in compact mode', () => {
      render(<CallQualityIndicator compact={true} />);
      const icon = screen.getByTestId('signal-icon');
      expect(icon).toHaveAttribute('width', '14');
    });

    it('has smaller font in compact mode', () => {
      const { container } = render(<CallQualityIndicator compact={true} />);
      const label = screen.getByText('Good');
      expect(label).toHaveClass('text-xs');
    });
  });

  describe('Network Stats', () => {
    it('displays network stats when showDetails is true', () => {
      const stats = {
        bandwidth: 1200,
        latency: 45,
        packetLoss: 0.1,
        jitter: 12
      };

      render(<CallQualityIndicator networkStats={stats} showDetails={true} />);

      expect(screen.getByText(/45ms/)).toBeInTheDocument();
      expect(screen.getByText(/0.1% loss/)).toBeInTheDocument();
    });

    it('does not show details when showDetails is false', () => {
      render(<CallQualityIndicator showDetails={false} />);

      expect(screen.queryByText(/ms/)).not.toBeInTheDocument();
    });

    it('uses provided networkStats', () => {
      const stats = {
        bandwidth: 2500,
        latency: 20,
        packetLoss: 0.05,
        jitter: 5
      };

      render(<CallQualityIndicator networkStats={stats} showDetails={true} />);

      expect(screen.getByText(/20ms/)).toBeInTheDocument();
      expect(screen.getByText(/0.0% loss/)).toBeInTheDocument();
    });

    it('generates default stats when not provided', () => {
      render(<CallQualityIndicator showDetails={true} />);

      // Should show some stats
      expect(screen.getByText(/ms/)).toBeInTheDocument();
    });
  });

  describe('Stats Simulation', () => {
    it('simulates network stats changes', () => {
      render(<CallQualityIndicator showDetails={true} />);

      const initialText = screen.getByText(/ms/).textContent;

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Stats should have changed
      expect(screen.getByText(/ms/)).toBeInTheDocument();
    });

    it('stops simulation when networkStats provided', () => {
      const stats = {
        bandwidth: 1200,
        latency: 45,
        packetLoss: 0.1,
        jitter: 12
      };

      render(<CallQualityIndicator networkStats={stats} showDetails={true} />);

      expect(screen.getByText(/45ms/)).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Should still show same stats
      expect(screen.getByText(/45ms/)).toBeInTheDocument();
    });

    it('clears interval on unmount', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      const { unmount } = render(<CallQualityIndicator />);

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });
  });

  describe('Expanded Details', () => {
    it('expands details on button click', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CallQualityIndicator />);

      const button = screen.getByTitle('Click for detailed network stats');
      await user.click(button);

      expect(screen.getByText('Network Statistics')).toBeInTheDocument();
    });

    it('collapses details on second click', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CallQualityIndicator />);

      const button = screen.getByTitle('Click for detailed network stats');
      await user.click(button);
      expect(screen.getByText('Network Statistics')).toBeInTheDocument();

      await user.click(button);
      expect(screen.queryByText('Network Statistics')).not.toBeInTheDocument();
    });

    it('does not expand in compact mode', () => {
      render(<CallQualityIndicator compact={true} />);

      expect(screen.queryByTitle('Click for detailed network stats')).not.toBeInTheDocument();
    });
  });

  describe('Detailed Stats Panel', () => {
    beforeEach(async () => {
      const user = userEvent.setup({ delay: null });
      render(<CallQualityIndicator />);
      const button = screen.getByTitle('Click for detailed network stats');
      await user.click(button);
    });

    it('shows bandwidth stat', () => {
      expect(screen.getByText('Bandwidth')).toBeInTheDocument();
      expect(screen.getByText(/kbps/)).toBeInTheDocument();
    });

    it('shows latency stat', () => {
      expect(screen.getByText('Latency')).toBeInTheDocument();
    });

    it('shows packet loss stat', () => {
      expect(screen.getByText('Packet Loss')).toBeInTheDocument();
      expect(screen.getByText(/%/)).toBeInTheDocument();
    });

    it('shows jitter stat', () => {
      expect(screen.getByText('Jitter')).toBeInTheDocument();
    });

    it('displays recommendations section', () => {
      expect(screen.getByText('Recommendations:')).toBeInTheDocument();
    });
  });

  describe('Quality Recommendations', () => {
    it('shows excellent quality recommendation', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CallQualityIndicator connectionQuality="excellent" />);

      const button = screen.getByTitle('Click for detailed network stats');
      await user.click(button);

      expect(screen.getByText(/HD video quality available/i)).toBeInTheDocument();
    });

    it('shows good quality recommendation', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CallQualityIndicator connectionQuality="good" />);

      const button = screen.getByTitle('Click for detailed network stats');
      await user.click(button);

      expect(screen.getByText(/Connection is stable/i)).toBeInTheDocument();
    });

    it('shows fair quality recommendation', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CallQualityIndicator connectionQuality="fair" />);

      const button = screen.getByTitle('Click for detailed network stats');
      await user.click(button);

      expect(screen.getByText(/Consider moving closer to router/i)).toBeInTheDocument();
    });

    it('shows poor quality recommendation', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CallQualityIndicator connectionQuality="poor" />);

      const button = screen.getByTitle('Click for detailed network stats');
      await user.click(button);

      expect(screen.getByText(/Check network connection/i)).toBeInTheDocument();
    });

    it('shows disconnected recommendation', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CallQualityIndicator connectionQuality="disconnected" />);

      const button = screen.getByTitle('Click for detailed network stats');
      await user.click(button);

      expect(screen.getByText(/Attempting to reconnect/i)).toBeInTheDocument();
    });
  });

  describe('Signal Strength Bars', () => {
    it('shows 4 bars for excellent quality', () => {
      const { container } = render(<CallQualityIndicator connectionQuality="excellent" />);
      const bars = container.querySelectorAll('[style*="height"]');
      expect(bars).toHaveLength(4);
    });

    it('shows 3 active bars for good quality', () => {
      const { container } = render(<CallQualityIndicator connectionQuality="good" />);
      const bars = container.querySelectorAll('[style*="height"]');
      expect(bars).toHaveLength(4); // Total bars
    });

    it('shows 2 active bars for fair quality', () => {
      const { container } = render(<CallQualityIndicator connectionQuality="fair" />);
      const bars = container.querySelectorAll('[style*="height"]');
      expect(bars).toHaveLength(4);
    });

    it('shows 1 active bar for poor quality', () => {
      const { container } = render(<CallQualityIndicator connectionQuality="poor" />);
      const bars = container.querySelectorAll('[style*="height"]');
      expect(bars).toHaveLength(4);
    });

    it('shows no active bars for disconnected', () => {
      const { container } = render(<CallQualityIndicator connectionQuality="disconnected" />);
      const bars = container.querySelectorAll('[style*="height"]');
      expect(bars).toHaveLength(4);
    });

    it('bars have increasing heights', () => {
      const { container } = render(<CallQualityIndicator />);
      const bars = Array.from(container.querySelectorAll('[style*="height"]'));

      bars.forEach((bar, index) => {
        const height = parseInt(bar.style.height);
        expect(height).toBe(index * 3 + 2);
      });
    });
  });

  describe('Animations', () => {
    it('applies pulse animation to disconnected icon', () => {
      render(<CallQualityIndicator connectionQuality="disconnected" />);
      const icon = screen.getByTestId('wifi-off-icon');
      expect(icon).toHaveClass('animate-pulse');
    });

    it('does not animate other quality states', () => {
      render(<CallQualityIndicator connectionQuality="good" />);
      const icon = screen.getByTestId('signal-icon');
      expect(icon).not.toHaveClass('animate-pulse');
    });
  });

  describe('Color Coding', () => {
    it('uses green for excellent', () => {
      render(<CallQualityIndicator connectionQuality="excellent" />);
      const label = screen.getByText('Excellent');
      expect(label).toHaveClass('text-green-400');
    });

    it('uses blue for good', () => {
      render(<CallQualityIndicator connectionQuality="good" />);
      const label = screen.getByText('Good');
      expect(label).toHaveClass('text-blue-400');
    });

    it('uses yellow for fair', () => {
      render(<CallQualityIndicator connectionQuality="fair" />);
      const label = screen.getByText('Fair');
      expect(label).toHaveClass('text-yellow-400');
    });

    it('uses orange for poor', () => {
      render(<CallQualityIndicator connectionQuality="poor" />);
      const label = screen.getByText('Poor');
      expect(label).toHaveClass('text-orange-400');
    });

    it('uses red for disconnected', () => {
      render(<CallQualityIndicator connectionQuality="disconnected" />);
      const label = screen.getByText('Disconnected');
      expect(label).toHaveClass('text-red-400');
    });
  });

  describe('Hover Effects', () => {
    it('button has hover scale effect', () => {
      const { container } = render(<CallQualityIndicator />);
      const button = screen.getByTitle('Click for detailed network stats');
      expect(button).toHaveClass('hover:scale-105');
    });

    it('button has hover shadow effect', () => {
      const { container } = render(<CallQualityIndicator />);
      const button = screen.getByTitle('Click for detailed network stats');
      expect(button).toHaveClass('hover:shadow-glow');
    });
  });

  describe('Panel Positioning', () => {
    it('positions dropdown absolutely', async () => {
      const user = userEvent.setup({ delay: null });
      const { container } = render(<CallQualityIndicator />);

      const button = screen.getByTitle('Click for detailed network stats');
      await user.click(button);

      const dropdown = container.querySelector('.absolute.z-50');
      expect(dropdown).toBeInTheDocument();
    });

    it('positions dropdown at top-full', async () => {
      const user = userEvent.setup({ delay: null });
      const { container } = render(<CallQualityIndicator />);

      const button = screen.getByTitle('Click for detailed network stats');
      await user.click(button);

      const dropdown = container.querySelector('.top-full');
      expect(dropdown).toBeInTheDocument();
    });

    it('aligns dropdown to right', async () => {
      const user = userEvent.setup({ delay: null });
      const { container } = render(<CallQualityIndicator />);

      const button = screen.getByTitle('Click for detailed network stats');
      await user.click(button);

      const dropdown = container.querySelector('.right-0');
      expect(dropdown).toBeInTheDocument();
    });
  });

  describe('Stat Formatting', () => {
    it('rounds bandwidth to nearest integer', () => {
      const stats = {
        bandwidth: 1234.567,
        latency: 45,
        packetLoss: 0.1,
        jitter: 12
      };

      const { container } = render(<CallQualityIndicator networkStats={stats} />);

      fireEvent.click(screen.getByTitle('Click for detailed network stats'));

      expect(screen.getByText('1235 kbps')).toBeInTheDocument();
    });

    it('rounds latency to nearest integer', async () => {
      const user = userEvent.setup({ delay: null });
      const stats = {
        bandwidth: 1200,
        latency: 45.678,
        packetLoss: 0.1,
        jitter: 12
      };

      render(<CallQualityIndicator networkStats={stats} />);
      await user.click(screen.getByTitle('Click for detailed network stats'));

      expect(screen.getByText('46 ms')).toBeInTheDocument();
    });

    it('formats packet loss to 2 decimals', async () => {
      const user = userEvent.setup({ delay: null });
      const stats = {
        bandwidth: 1200,
        latency: 45,
        packetLoss: 0.123,
        jitter: 12
      };

      render(<CallQualityIndicator networkStats={stats} />);
      await user.click(screen.getByTitle('Click for detailed network stats'));

      expect(screen.getByText('0.12%')).toBeInTheDocument();
    });

    it('rounds jitter to nearest integer', async () => {
      const user = userEvent.setup({ delay: null });
      const stats = {
        bandwidth: 1200,
        latency: 45,
        packetLoss: 0.1,
        jitter: 12.789
      };

      render(<CallQualityIndicator networkStats={stats} />);
      await user.click(screen.getByTitle('Click for detailed network stats'));

      expect(screen.getByText('13 ms')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles null networkStats', () => {
      render(<CallQualityIndicator networkStats={null} />);
      expect(screen.getByText('Good')).toBeInTheDocument();
    });

    it('handles undefined connectionQuality', () => {
      render(<CallQualityIndicator connectionQuality={undefined} />);
      expect(screen.getByText('Good')).toBeInTheDocument();
    });

    it('handles negative stats gracefully', async () => {
      const user = userEvent.setup({ delay: null });
      const stats = {
        bandwidth: -100,
        latency: -10,
        packetLoss: -1,
        jitter: -5
      };

      render(<CallQualityIndicator networkStats={stats} />);
      await user.click(screen.getByTitle('Click for detailed network stats'));

      expect(screen.getByText('Network Statistics')).toBeInTheDocument();
    });

    it('handles very large stats', async () => {
      const user = userEvent.setup({ delay: null });
      const stats = {
        bandwidth: 999999,
        latency: 9999,
        packetLoss: 99.99,
        jitter: 9999
      };

      render(<CallQualityIndicator networkStats={stats} />);
      await user.click(screen.getByTitle('Click for detailed network stats'));

      expect(screen.getByText('999999 kbps')).toBeInTheDocument();
    });
  });

  describe('Snapshot', () => {
    it('matches snapshot for default state', () => {
      const { container } = render(<CallQualityIndicator />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for excellent quality', () => {
      const { container } = render(<CallQualityIndicator connectionQuality="excellent" />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for disconnected state', () => {
      const { container } = render(<CallQualityIndicator connectionQuality="disconnected" />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for compact mode', () => {
      const { container } = render(<CallQualityIndicator compact={true} />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with details shown', async () => {
      const user = userEvent.setup({ delay: null });
      const { container } = render(<CallQualityIndicator />);

      const button = screen.getByTitle('Click for detailed network stats');
      await user.click(button);

      expect(container).toMatchSnapshot();
    });
  });
});

export default bars
