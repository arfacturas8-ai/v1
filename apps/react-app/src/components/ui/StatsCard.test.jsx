import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatsCard, { StatsPresets } from './StatsCard';

// Mock requestAnimationFrame and cancelAnimationFrame
beforeAll(() => {
  global.requestAnimationFrame = jest.fn((cb) => {
    cb();
    return 1;
  });
  global.cancelAnimationFrame = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('StatsCard Component', () => {
  describe('Basic Rendering', () => {
    it('should render the component with required props', () => {
      render(<StatsCard title="Test Title" value={100} />);
      expect(screen.getByText('TEST TITLE')).toBeInTheDocument();
    });

    it('should render the component without crashing when no props provided', () => {
      render(<StatsCard />);
      expect(document.querySelector('.card')).toBeInTheDocument();
    });

    it('should apply default className', () => {
      const { container } = render(<StatsCard title="Test" value={100} />);
      const card = container.querySelector('.card');
      expect(card).toHaveClass('depth-enhanced', 'hover-lift');
    });

    it('should apply custom className', () => {
      const { container } = render(
        <StatsCard title="Test" value={100} className="custom-class" />
      );
      const card = container.querySelector('.card');
      expect(card).toHaveClass('custom-class');
    });

    it('should render with all props provided', () => {
      render(
        <StatsCard
          title="Test Title"
          value={1000}
          icon="🚀"
          subtitle="Test subtitle"
          trend="up"
          trendValue="+10%"
          color="#FF0000"
          format="number"
        />
      );
      expect(screen.getByText('TEST TITLE')).toBeInTheDocument();
    });
  });

  describe('Title Display', () => {
    it('should render title in uppercase', () => {
      render(<StatsCard title="active users" value={100} />);
      expect(screen.getByText('ACTIVE USERS')).toBeInTheDocument();
    });

    it('should render title with correct styling classes', () => {
      render(<StatsCard title="Test Title" value={100} />);
      const titleElement = screen.getByText('TEST TITLE');
      expect(titleElement).toHaveClass('text-sm', 'font-medium', 'text-secondary', 'uppercase', 'tracking-wide');
    });

    it('should render without title when not provided', () => {
      render(<StatsCard value={100} />);
      expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
    });
  });

  describe('Value Display and Formatting', () => {
    it('should format number values correctly', () => {
      render(<StatsCard title="Test" value={1000} format="number" />);
      waitFor(() => {
        expect(screen.getByText('1,000')).toBeInTheDocument();
      });
    });

    it('should format currency values correctly', () => {
      render(<StatsCard title="Test" value={5000} format="currency" />);
      waitFor(() => {
        expect(screen.getByText('$5,000')).toBeInTheDocument();
      });
    });

    it('should format percentage values correctly', () => {
      render(<StatsCard title="Test" value={75} format="percentage" />);
      waitFor(() => {
        expect(screen.getByText('75%')).toBeInTheDocument();
      });
    });

    it('should format compact values for thousands', () => {
      render(<StatsCard title="Test" value={5500} format="compact" />);
      waitFor(() => {
        expect(screen.getByText('5.5K')).toBeInTheDocument();
      });
    });

    it('should format compact values for millions', () => {
      render(<StatsCard title="Test" value={2500000} format="compact" />);
      waitFor(() => {
        expect(screen.getByText('2.5M')).toBeInTheDocument();
      });
    });

    it('should format compact values for numbers under 1000', () => {
      render(<StatsCard title="Test" value={500} format="compact" />);
      waitFor(() => {
        expect(screen.getByText('500')).toBeInTheDocument();
      });
    });

    it('should handle string value that can be parsed as number', () => {
      render(<StatsCard title="Test" value="1000" format="number" />);
      waitFor(() => {
        expect(screen.getByText(/1,000/)).toBeInTheDocument();
      });
    });

    it('should handle zero value', () => {
      render(<StatsCard title="Test" value={0} format="number" />);
      waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument();
      });
    });

    it('should handle negative values', () => {
      render(<StatsCard title="Test" value={-500} format="number" />);
      waitFor(() => {
        expect(screen.getByText(/-500/)).toBeInTheDocument();
      });
    });

    it('should use default format when format prop not provided', () => {
      render(<StatsCard title="Test" value={1000} />);
      waitFor(() => {
        expect(screen.getByText('1,000')).toBeInTheDocument();
      });
    });

    it('should display value with custom color', () => {
      const { container } = render(
        <StatsCard title="Test" value={100} color="#FF0000" />
      );
      const valueElement = container.querySelector('.text-3xl');
      expect(valueElement).toHaveStyle({ color: '#FF0000' });
    });

    it('should apply default color when not specified', () => {
      const { container } = render(<StatsCard title="Test" value={100} />);
      const valueElement = container.querySelector('.text-3xl');
      expect(valueElement).toHaveStyle({ color: '#00D4FF' });
    });
  });

  describe('Icon Display', () => {
    it('should render icon when provided', () => {
      render(<StatsCard title="Test" value={100} icon="🚀" />);
      expect(screen.getByText('🚀')).toBeInTheDocument();
    });

    it('should not render icon container when icon not provided', () => {
      const { container } = render(<StatsCard title="Test" value={100} />);
      const iconContainer = container.querySelector('.w-10.h-10');
      expect(iconContainer).not.toBeInTheDocument();
    });

    it('should apply correct styling to icon container', () => {
      const { container } = render(
        <StatsCard title="Test" value={100} icon="🚀" color="#00FF00" />
      );
      const iconContainer = container.querySelector('.w-10');
      expect(iconContainer).toHaveClass('h-10', 'rounded-lg', 'flex', 'items-center', 'justify-center', 'text-lg');
    });

    it('should apply color to icon container background', () => {
      const { container } = render(
        <StatsCard title="Test" value={100} icon="🚀" color="#FF0000" />
      );
      const iconContainer = container.querySelector('.w-10');
      expect(iconContainer).toHaveStyle({ backgroundColor: '#FF000020', color: '#FF0000' });
    });
  });

  describe('Trend Indicator', () => {
    it('should render trend indicator when trend and trendValue provided', () => {
      render(<StatsCard title="Test" value={100} trend="up" trendValue="+10%" />);
      expect(screen.getByText('+10%')).toBeInTheDocument();
    });

    it('should not render trend indicator when trend not provided', () => {
      render(<StatsCard title="Test" value={100} trendValue="+10%" />);
      expect(screen.queryByText('+10%')).not.toBeInTheDocument();
    });

    it('should not render trend indicator when trendValue not provided', () => {
      render(<StatsCard title="Test" value={100} trend="up" />);
      expect(screen.queryByText('↗')).not.toBeInTheDocument();
    });

    it('should render up arrow for upward trend', () => {
      render(<StatsCard title="Test" value={100} trend="up" trendValue="+10%" />);
      expect(screen.getByText('↗')).toBeInTheDocument();
    });

    it('should render down arrow for downward trend', () => {
      render(<StatsCard title="Test" value={100} trend="down" trendValue="-5%" />);
      expect(screen.getByText('↙')).toBeInTheDocument();
    });

    it('should render horizontal arrow for neutral trend', () => {
      render(<StatsCard title="Test" value={100} trend="neutral" trendValue="0%" />);
      expect(screen.getByText('→')).toBeInTheDocument();
    });

    it('should apply success color for upward trend', () => {
      render(<StatsCard title="Test" value={100} trend="up" trendValue="+10%" />);
      const trendIcon = screen.getByText('↗');
      expect(trendIcon).toHaveStyle({ color: 'var(--success)' });
    });

    it('should apply error color for downward trend', () => {
      render(<StatsCard title="Test" value={100} trend="down" trendValue="-5%" />);
      const trendIcon = screen.getByText('↙');
      expect(trendIcon).toHaveStyle({ color: 'var(--error)' });
    });

    it('should apply tertiary color for neutral trend', () => {
      render(<StatsCard title="Test" value={100} trend="neutral" trendValue="0%" />);
      const trendIcon = screen.getByText('→');
      expect(trendIcon).toHaveStyle({ color: 'var(--text-tertiary)' });
    });

    it('should render trend value with correct styling', () => {
      render(<StatsCard title="Test" value={100} trend="up" trendValue="+10%" />);
      const trendValue = screen.getByText('+10%');
      expect(trendValue).toHaveClass('font-medium');
    });
  });

  describe('Subtitle Display', () => {
    it('should render subtitle when provided', () => {
      render(<StatsCard title="Test" value={100} subtitle="Test subtitle" />);
      expect(screen.getByText('Test subtitle')).toBeInTheDocument();
    });

    it('should not render subtitle when not provided', () => {
      const { container } = render(<StatsCard title="Test" value={100} />);
      const subtitle = container.querySelector('.text-tertiary');
      expect(subtitle).not.toBeInTheDocument();
    });

    it('should apply correct styling to subtitle', () => {
      render(<StatsCard title="Test" value={100} subtitle="Test subtitle" />);
      const subtitle = screen.getByText('Test subtitle');
      expect(subtitle).toHaveClass('text-sm', 'text-tertiary');
    });
  });

  describe('Progress Bar', () => {
    it('should render progress bar', () => {
      const { container } = render(<StatsCard title="Test" value={100} />);
      const progressBar = container.querySelector('.h-1.rounded-full.transition-all');
      expect(progressBar).toBeInTheDocument();
    });

    it('should apply color to progress bar', () => {
      const { container } = render(
        <StatsCard title="Test" value={100} color="#FF0000" />
      );
      const progressBar = container.querySelector('.h-1.rounded-full.transition-all');
      expect(progressBar).toHaveStyle({ backgroundColor: '#FF0000' });
    });

    it('should animate progress bar width on visibility', async () => {
      const { container } = render(<StatsCard title="Test" value={100} />);
      const progressBar = container.querySelector('.h-1.rounded-full.transition-all');

      await waitFor(() => {
        expect(progressBar).toHaveStyle({ width: '100%' });
      });
    });

    it('should render progress bar container with correct styling', () => {
      const { container } = render(<StatsCard title="Test" value={100} />);
      const progressContainer = container.querySelector('.w-full.bg-tertiary.rounded-full.h-1.overflow-hidden');
      expect(progressContainer).toBeInTheDocument();
    });
  });

  describe('Animation', () => {
    it('should animate value from 0 to target', async () => {
      jest.useFakeTimers();
      render(<StatsCard title="Test" value={100} format="number" />);

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(requestAnimationFrame).toHaveBeenCalled();
      });

      jest.useRealTimers();
    });

    it('should set isVisible to true after timeout', async () => {
      jest.useFakeTimers();
      render(<StatsCard title="Test" value={100} />);

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        const { container } = render(<StatsCard title="Test" value={100} />);
        const progressBar = container.querySelector('.h-1.rounded-full.transition-all');
        expect(progressBar).toHaveStyle({ width: '100%' });
      });

      jest.useRealTimers();
    });

    it('should cleanup animation frame on unmount', () => {
      const { unmount } = render(<StatsCard title="Test" value={100} />);
      unmount();
      expect(cancelAnimationFrame).toHaveBeenCalled();
    });

    it('should cleanup timeout on unmount', () => {
      jest.useFakeTimers();
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      const { unmount } = render(<StatsCard title="Test" value={100} />);
      unmount();
      expect(clearTimeoutSpy).toHaveBeenCalled();
      jest.useRealTimers();
    });
  });

  describe('StatsPresets', () => {
    it('should export users preset with correct configuration', () => {
      expect(StatsPresets.users).toEqual({
        title: 'Active Users',
        icon: '👥',
        color: '#00D4FF',
        format: 'compact',
        subtitle: 'Online now'
      });
    });

    it('should export volume preset with correct configuration', () => {
      expect(StatsPresets.volume).toEqual({
        title: 'Trading Volume',
        icon: '💰',
        color: '#00FF90',
        format: 'currency',
        subtitle: '24h volume'
      });
    });

    it('should export growth preset with correct configuration', () => {
      expect(StatsPresets.growth).toEqual({
        title: 'Growth Rate',
        icon: '📈',
        color: '#0052FF',
        format: 'percentage',
        subtitle: 'Month over month'
      });
    });

    it('should export communities preset with correct configuration', () => {
      expect(StatsPresets.communities).toEqual({
        title: 'Communities',
        icon: '🏘️',
        color: '#00D4FF',
        format: 'number',
        subtitle: 'Active communities'
      });
    });

    it('should export messages preset with correct configuration', () => {
      expect(StatsPresets.messages).toEqual({
        title: 'Messages',
        icon: '💬',
        color: '#00FF90',
        format: 'compact',
        subtitle: 'Sent today'
      });
    });

    it('should export trades preset with correct configuration', () => {
      expect(StatsPresets.trades).toEqual({
        title: 'Trades',
        icon: '⚡',
        color: '#0052FF',
        format: 'number',
        subtitle: 'Completed today'
      });
    });

    it('should render component with users preset', () => {
      render(<StatsCard {...StatsPresets.users} value={1500} />);
      expect(screen.getByText('ACTIVE USERS')).toBeInTheDocument();
      expect(screen.getByText('👥')).toBeInTheDocument();
    });

    it('should render component with volume preset', () => {
      render(<StatsCard {...StatsPresets.volume} value={50000} />);
      expect(screen.getByText('TRADING VOLUME')).toBeInTheDocument();
      expect(screen.getByText('💰')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible card structure', () => {
      const { container } = render(<StatsCard title="Test" value={100} />);
      const card = container.querySelector('.card');
      expect(card).toBeInTheDocument();
    });

    it('should render title as heading', () => {
      render(<StatsCard title="Test Title" value={100} />);
      const heading = screen.getByText('TEST TITLE');
      expect(heading.tagName).toBe('H3');
    });

    it('should have semantic HTML structure', () => {
      const { container } = render(
        <StatsCard
          title="Test"
          value={100}
          subtitle="Subtitle"
          trend="up"
          trendValue="+10%"
        />
      );
      expect(container.querySelector('h3')).toBeInTheDocument();
      expect(container.querySelector('p')).toBeInTheDocument();
    });

    it('should render all text content as readable text', () => {
      render(
        <StatsCard
          title="Test Title"
          value={100}
          subtitle="Test subtitle"
          trend="up"
          trendValue="+10%"
        />
      );
      expect(screen.getByText('TEST TITLE')).toBeVisible();
      expect(screen.getByText('Test subtitle')).toBeVisible();
      expect(screen.getByText('+10%')).toBeVisible();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large numbers', () => {
      render(<StatsCard title="Test" value={999999999} format="compact" />);
      waitFor(() => {
        expect(screen.getByText('1000.0M')).toBeInTheDocument();
      });
    });

    it('should handle decimal values in compact format', () => {
      render(<StatsCard title="Test" value={1234} format="compact" />);
      waitFor(() => {
        expect(screen.getByText('1.2K')).toBeInTheDocument();
      });
    });

    it('should handle invalid string value', () => {
      render(<StatsCard title="Test" value="invalid" format="number" />);
      waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument();
      });
    });

    it('should handle null value', () => {
      render(<StatsCard title="Test" value={null} format="number" />);
      waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument();
      });
    });

    it('should handle undefined value', () => {
      render(<StatsCard title="Test" value={undefined} format="number" />);
      waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument();
      });
    });

    it('should handle empty string title', () => {
      render(<StatsCard title="" value={100} />);
      const heading = document.querySelector('h3');
      expect(heading).toBeInTheDocument();
    });

    it('should handle multiple class names in className prop', () => {
      const { container } = render(
        <StatsCard title="Test" value={100} className="class1 class2 class3" />
      );
      const card = container.querySelector('.card');
      expect(card).toHaveClass('class1', 'class2', 'class3');
    });
  });
});

export default card
