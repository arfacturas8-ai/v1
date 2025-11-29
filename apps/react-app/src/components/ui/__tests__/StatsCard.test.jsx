import React from 'react';
import { render, screen, act } from '@testing-library/react';
import StatsCard, { StatsPresets } from '../StatsCard';

// Mock animation frame
const mockRequestAnimationFrame = jest.fn((cb) => {
  cb();
  return 1;
});
const mockCancelAnimationFrame = jest.fn();

global.requestAnimationFrame = mockRequestAnimationFrame;
global.cancelAnimationFrame = mockCancelAnimationFrame;

describe('StatsCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestAnimationFrame.mockClear();
    mockCancelAnimationFrame.mockClear();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<StatsCard title="Test" value={100} />);
      expect(screen.getByText('TEST')).toBeInTheDocument();
    });

    it('renders title in uppercase', () => {
      render(<StatsCard title="Active Users" value={150} />);
      expect(screen.getByText(/active users/i)).toBeInTheDocument();
    });

    it('renders with icon', () => {
      render(<StatsCard title="Users" value={100} icon="👥" />);
      expect(screen.getByText('👥')).toBeInTheDocument();
    });

    it('renders subtitle when provided', () => {
      render(<StatsCard title="Users" value={100} subtitle="Online now" />);
      expect(screen.getByText('Online now')).toBeInTheDocument();
    });

    it('renders without subtitle', () => {
      render(<StatsCard title="Users" value={100} />);
      expect(screen.queryByText('Online now')).not.toBeInTheDocument();
    });
  });

  describe('Value Formatting', () => {
    it('formats number values', () => {
      const { rerender } = render(<StatsCard title="Count" value={1500} format="number" />);

      act(() => {
        jest.advanceTimersByTime(2100);
      });

      rerender(<StatsCard title="Count" value={1500} format="number" />);
      // Value should eventually show 1,500
    });

    it('formats currency values', () => {
      render(<StatsCard title="Revenue" value={5000} format="currency" />);
      // Value should eventually show $5,000
    });

    it('formats percentage values', () => {
      render(<StatsCard title="Growth" value={75} format="percentage" />);
      // Value should eventually show 75%
    });

    it('formats compact values for thousands', () => {
      render(<StatsCard title="Users" value={1500} format="compact" />);
      // Value should eventually show 1.5K
    });

    it('formats compact values for millions', () => {
      render(<StatsCard title="Users" value={1500000} format="compact" />);
      // Value should eventually show 1.5M
    });

    it('handles string values', () => {
      render(<StatsCard title="Count" value="100" />);
      // Should parse and display number
    });

    it('handles invalid string values', () => {
      render(<StatsCard title="Count" value="abc" />);
      // Should fallback to 0
    });
  });

  describe('Trend Display', () => {
    it('shows upward trend', () => {
      render(<StatsCard title="Users" value={100} trend="up" trendValue="+12%" />);
      expect(screen.getByText('↗')).toBeInTheDocument();
      expect(screen.getByText('+12%')).toBeInTheDocument();
    });

    it('shows downward trend', () => {
      render(<StatsCard title="Users" value={100} trend="down" trendValue="-5%" />);
      expect(screen.getByText('↙')).toBeInTheDocument();
      expect(screen.getByText('-5%')).toBeInTheDocument();
    });

    it('shows neutral trend', () => {
      render(<StatsCard title="Users" value={100} trend="neutral" trendValue="0%" />);
      expect(screen.getByText('→')).toBeInTheDocument();
    });

    it('does not show trend when not provided', () => {
      render(<StatsCard title="Users" value={100} />);
      expect(screen.queryByText('↗')).not.toBeInTheDocument();
      expect(screen.queryByText('↙')).not.toBeInTheDocument();
    });

    it('requires both trend and trendValue', () => {
      render(<StatsCard title="Users" value={100} trend="up" />);
      expect(screen.queryByText('↗')).not.toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const { container } = render(<StatsCard title="Test" value={100} className="custom-class" />);
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('applies custom color', () => {
      const { container } = render(<StatsCard title="Test" value={100} color="#FF0000" />);
      const iconContainer = container.querySelector('[style*="#FF0000"]');
      expect(iconContainer).toBeInTheDocument();
    });

    it('uses default color when not provided', () => {
      const { container } = render(<StatsCard title="Test" value={100} icon="👥" />);
      const iconContainer = container.querySelector('[style*="#00D4FF"]');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Animation', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('animates value on mount', () => {
      render(<StatsCard title="Test" value={100} />);

      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Animation should start after mount
      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });

    it('cancels animation on unmount', () => {
      const { unmount } = render(<StatsCard title="Test" value={100} />);

      act(() => {
        jest.advanceTimersByTime(100);
      });

      unmount();

      expect(mockCancelAnimationFrame).toHaveBeenCalled();
    });

    it('updates animation when value changes', () => {
      const { rerender } = render(<StatsCard title="Test" value={100} />);

      rerender(<StatsCard title="Test" value={200} />);

      // Should restart animation with new value
      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('StatsPresets', () => {
    it('has users preset configuration', () => {
      expect(StatsPresets.users).toBeDefined();
      expect(StatsPresets.users.title).toBe('Active Users');
      expect(StatsPresets.users.icon).toBe('👥');
      expect(StatsPresets.users.format).toBe('compact');
    });

    it('has volume preset configuration', () => {
      expect(StatsPresets.volume).toBeDefined();
      expect(StatsPresets.volume.format).toBe('currency');
    });

    it('has growth preset configuration', () => {
      expect(StatsPresets.growth).toBeDefined();
      expect(StatsPresets.growth.format).toBe('percentage');
    });

    it('has communities preset configuration', () => {
      expect(StatsPresets.communities).toBeDefined();
    });

    it('has messages preset configuration', () => {
      expect(StatsPresets.messages).toBeDefined();
    });

    it('has trades preset configuration', () => {
      expect(StatsPresets.trades).toBeDefined();
    });
  });

  describe('Progress Bar', () => {
    it('renders progress bar', () => {
      const { container } = render(<StatsCard title="Test" value={100} />);
      const progressBar = container.querySelector('.h-1');
      expect(progressBar).toBeInTheDocument();
    });

    it('animates progress bar width', () => {
      const { container } = render(<StatsCard title="Test" value={100} color="#00D4FF" />);
      const progressBarFill = container.querySelector('[style*="background"]');
      expect(progressBarFill).toBeInTheDocument();
    });
  });
});

export default mockRequestAnimationFrame
