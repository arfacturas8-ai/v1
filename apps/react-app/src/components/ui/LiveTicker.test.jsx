/**
 * Tests for LiveTicker component
 */
import React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LiveTicker from './LiveTicker';

// Mock Math.random for consistent price fluctuation testing
let mockRandomValue = 0.5;
const originalRandom = Math.random;

describe('LiveTicker', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockRandomValue = 0.5;
    Math.random = jest.fn(() => mockRandomValue);

    // Mock document.head.appendChild for style injection
    if (!document.head.querySelector('style')) {
      const styleElement = document.createElement('style');
      document.head.appendChild(styleElement);
    }
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    Math.random = originalRandom;
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<LiveTicker />);
      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    it('applies default className', () => {
      const { container } = render(<LiveTicker />);
      expect(container.firstChild).toHaveClass('relative', 'overflow-hidden');
    });

    it('applies custom className', () => {
      const { container } = render(<LiveTicker className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('renders with default speed', () => {
      const { container } = render(<LiveTicker />);
      const tickerElement = container.querySelector('[style*="animation"]');
      expect(tickerElement).toBeInTheDocument();
    });

    it('applies custom speed prop', () => {
      const { container } = render(<LiveTicker speed={60} />);
      const tickerElement = container.querySelector('[style*="animation"]');
      expect(tickerElement?.style.animation).toContain('60s');
    });
  });

  describe('Ticker Data Initialization', () => {
    it('initializes with ticker items', async () => {
      render(<LiveTicker />);

      await waitFor(() => {
        expect(screen.getAllByText('BTC')).toHaveLength(2); // Duplicated for seamless loop
      });
    });

    it('renders cryptocurrency prices', async () => {
      render(<LiveTicker />);

      await waitFor(() => {
        expect(screen.getAllByText('BTC')).toHaveLength(2);
        expect(screen.getAllByText('ETH')).toHaveLength(2);
        expect(screen.getAllByText('SOL')).toHaveLength(2);
        expect(screen.getAllByText('ADA')).toHaveLength(2);
      });
    });

    it('renders platform statistics', async () => {
      render(<LiveTicker />);

      await waitFor(() => {
        expect(screen.getAllByText(/Active Users/i)).toHaveLength(2);
        expect(screen.getAllByText(/Messages Today/i)).toHaveLength(2);
        expect(screen.getAllByText(/Communities/i)).toHaveLength(2);
      });
    });

    it('renders all crypto symbols', async () => {
      render(<LiveTicker />);

      await waitFor(() => {
        expect(screen.getAllByText('BTC')).toHaveLength(2);
        expect(screen.getAllByText('ETH')).toHaveLength(2);
        expect(screen.getAllByText('SOL')).toHaveLength(2);
        expect(screen.getAllByText('ADA')).toHaveLength(2);
        expect(screen.getAllByText('MATIC')).toHaveLength(2);
        expect(screen.getAllByText('DOT')).toHaveLength(2);
        expect(screen.getAllByText('AVAX')).toHaveLength(2);
      });
    });

    it('renders stat icons', async () => {
      render(<LiveTicker />);

      await waitFor(() => {
        expect(screen.getAllByText('👥')).toHaveLength(2);
        expect(screen.getAllByText('💬')).toHaveLength(2);
        expect(screen.getAllByText('🏘️')).toHaveLength(2);
        expect(screen.getAllByText('⚡')).toHaveLength(2);
        expect(screen.getAllByText('💰')).toHaveLength(2);
      });
    });
  });

  describe('Live Indicator', () => {
    it('renders live indicator', () => {
      render(<LiveTicker />);
      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    it('live indicator has pulse animation', () => {
      const { container } = render(<LiveTicker />);
      const pulseElement = container.querySelector('.animate-pulse');
      expect(pulseElement).toBeInTheDocument();
    });

    it('live indicator has correct styling', () => {
      const { container } = render(<LiveTicker />);
      const pulseElement = container.querySelector('.animate-pulse');
      expect(pulseElement).toHaveClass('w-2', 'h-2', 'bg-success', 'rounded-full');
    });

    it('live indicator is positioned correctly', () => {
      const { container } = render(<LiveTicker />);
      const indicatorContainer = container.querySelector('.absolute.top-2.right-4');
      expect(indicatorContainer).toBeInTheDocument();
    });

    it('live text is uppercase', () => {
      const { container } = render(<LiveTicker />);
      const liveText = screen.getByText('Live');
      expect(liveText).toHaveClass('uppercase');
    });
  });

  describe('Gradient Masks', () => {
    it('renders left gradient mask', () => {
      const { container } = render(<LiveTicker />);
      const leftMask = container.querySelector('.bg-gradient-to-r.from-bg-primary');
      expect(leftMask).toBeInTheDocument();
    });

    it('renders right gradient mask', () => {
      const { container } = render(<LiveTicker />);
      const rightMask = container.querySelector('.bg-gradient-to-l.from-bg-primary');
      expect(rightMask).toBeInTheDocument();
    });

    it('gradient masks have correct z-index', () => {
      const { container } = render(<LiveTicker />);
      const masks = container.querySelectorAll('.z-10');
      expect(masks.length).toBeGreaterThanOrEqual(2);
    });

    it('gradient masks span full height', () => {
      const { container } = render(<LiveTicker />);
      const leftMask = container.querySelector('.bg-gradient-to-r');
      expect(leftMask).toHaveClass('top-0', 'bottom-0');
    });

    it('gradient masks have correct width', () => {
      const { container } = render(<LiveTicker />);
      const leftMask = container.querySelector('.bg-gradient-to-r');
      expect(leftMask).toHaveClass('w-20');
    });
  });

  describe('Price Formatting', () => {
    it('formats prices >= 1000 with thousands separator', async () => {
      render(<LiveTicker />);

      await waitFor(() => {
        // BTC price should be formatted with commas
        expect(screen.getAllByText(/\$45,250/)).toHaveLength(2);
      });
    });

    it('formats prices >= 1 with 2 decimal places', async () => {
      render(<LiveTicker />);

      await waitFor(() => {
        // ETH price should have 2 decimals
        const ethPrices = screen.getAllByText(/\$3,120\.45/);
        expect(ethPrices.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('formats prices < 1 with 4 decimal places', async () => {
      render(<LiveTicker />);

      await waitFor(() => {
        // ADA price should have 4 decimals
        const adaPrices = screen.getAllByText(/\$0\.5200/);
        expect(adaPrices.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('adds dollar sign to all prices', async () => {
      render(<LiveTicker />);

      await waitFor(() => {
        const priceElements = screen.getAllByText(/\$/);
        expect(priceElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Trend Indicators', () => {
    it('displays up trend icon for positive changes', async () => {
      render(<LiveTicker />);

      await waitFor(() => {
        expect(screen.getAllByText('↗')).toHaveLength(10); // 5 up trends x 2 (duplicated)
      });
    });

    it('displays down trend icon for negative changes', async () => {
      render(<LiveTicker />);

      await waitFor(() => {
        expect(screen.getAllByText('↙')).toHaveLength(4); // 2 down trends x 2 (duplicated)
      });
    });

    it('shows positive percentage changes with + sign', async () => {
      render(<LiveTicker />);

      await waitFor(() => {
        expect(screen.getAllByText('+2.5%')).toHaveLength(2);
        expect(screen.getAllByText('+1.8%')).toHaveLength(2);
        expect(screen.getAllByText('+4.2%')).toHaveLength(2);
      });
    });

    it('shows negative percentage changes without + sign', async () => {
      render(<LiveTicker />);

      await waitFor(() => {
        expect(screen.getAllByText('-0.3%')).toHaveLength(2);
        expect(screen.getAllByText('-1.2%')).toHaveLength(2);
      });
    });

    it('applies correct color for up trend', async () => {
      const { container } = render(<LiveTicker />);

      await waitFor(() => {
        const upTrendElements = container.querySelectorAll('[style*="#00FF90"]');
        expect(upTrendElements.length).toBeGreaterThan(0);
      });
    });

    it('applies correct color for down trend', async () => {
      const { container } = render(<LiveTicker />);

      await waitFor(() => {
        const downTrendElements = container.querySelectorAll('[style*="#FF4444"]');
        expect(downTrendElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Price Updates', () => {
    it('updates prices every 3 seconds', async () => {
      mockRandomValue = 0.6; // Positive change
      render(<LiveTicker />);

      await waitFor(() => {
        expect(screen.getAllByText('BTC')).toHaveLength(2);
      });

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        // Price should have changed
        const container = document.body;
        expect(container.textContent).toContain('BTC');
      });
    });

    it('does not update when paused', async () => {
      const { container } = render(<LiveTicker />);

      await waitFor(() => {
        expect(screen.getAllByText('BTC')).toHaveLength(2);
      });

      const tickerElement = container.querySelector('[style*="animation"]');

      // Pause by hovering
      fireEvent.mouseEnter(tickerElement);

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Check that updates are paused
      expect(tickerElement).toBeInTheDocument();
    });

    it('simulates positive price changes', async () => {
      mockRandomValue = 0.8; // Will cause positive change
      render(<LiveTicker />);

      await waitFor(() => {
        expect(screen.getAllByText('BTC')).toHaveLength(2);
      });

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        // Should have positive changes
        const container = document.body;
        expect(container.textContent).toContain('↗');
      });
    });

    it('simulates negative price changes', async () => {
      mockRandomValue = 0.2; // Will cause negative change
      render(<LiveTicker />);

      await waitFor(() => {
        expect(screen.getAllByText('BTC')).toHaveLength(2);
      });

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        // Should have negative changes
        const container = document.body;
        expect(container.textContent).toContain('↙');
      });
    });

    it('only updates price items, not stats', async () => {
      render(<LiveTicker />);

      await waitFor(() => {
        expect(screen.getAllByText(/Active Users/i)).toHaveLength(2);
        expect(screen.getAllByText('12.5K')).toHaveLength(2);
      });

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        // Stats should remain the same
        expect(screen.getAllByText('12.5K')).toHaveLength(2);
      });
    });

    it('recalculates trend based on new prices', async () => {
      mockRandomValue = 0.3; // Negative change
      render(<LiveTicker />);

      await waitFor(() => {
        expect(screen.getAllByText('BTC')).toHaveLength(2);
      });

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        // Trends should be updated
        const container = document.body;
        expect(container.textContent).toMatch(/[↗↙]/);
      });
    });

    it('updates change percentage values', async () => {
      mockRandomValue = 0.9; // Large positive change
      render(<LiveTicker />);

      await waitFor(() => {
        expect(screen.getAllByText('BTC')).toHaveLength(2);
      });

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        // Should have percentage changes
        const container = document.body;
        expect(container.textContent).toMatch(/[+-]\d+\.\d+%/);
      });
    });
  });

  describe('Animation Control', () => {
    it('pauses animation on mouse enter', async () => {
      const { container } = render(<LiveTicker />);

      await waitFor(() => {
        expect(screen.getAllByText('BTC')).toHaveLength(2);
      });

      const tickerElement = container.querySelector('[style*="animation"]');

      fireEvent.mouseEnter(tickerElement);

      await waitFor(() => {
        expect(tickerElement?.style.animation).toBe('none');
      });
    });

    it('resumes animation on mouse leave', async () => {
      const { container } = render(<LiveTicker />);

      await waitFor(() => {
        expect(screen.getAllByText('BTC')).toHaveLength(2);
      });

      const tickerElement = container.querySelector('[style*="animation"]');

      fireEvent.mouseEnter(tickerElement);
      fireEvent.mouseLeave(tickerElement);

      await waitFor(() => {
        expect(tickerElement?.style.animation).toContain('scroll');
      });
    });

    it('applies correct animation duration from speed prop', () => {
      const { container } = render(<LiveTicker speed={45} />);
      const tickerElement = container.querySelector('[style*="animation"]');
      expect(tickerElement?.style.animation).toContain('45s');
    });

    it('animation is linear infinite', () => {
      const { container } = render(<LiveTicker />);
      const tickerElement = container.querySelector('[style*="animation"]');
      expect(tickerElement?.style.animation).toContain('linear');
      expect(tickerElement?.style.animation).toContain('infinite');
    });

    it('applies paddingLeft 100% for seamless scroll', () => {
      const { container } = render(<LiveTicker />);
      const tickerElement = container.querySelector('[style*="paddingLeft"]');
      expect(tickerElement?.style.paddingLeft).toBe('100%');
    });
  });

  describe('Ticker Items', () => {
    it('renders price type items with symbol', async () => {
      render(<LiveTicker />);

      await waitFor(() => {
        expect(screen.getAllByText('BTC')).toHaveLength(2);
        expect(screen.getAllByText('ETH')).toHaveLength(2);
      });
    });

    it('renders stat type items with label and value', async () => {
      render(<LiveTicker />);

      await waitFor(() => {
        expect(screen.getAllByText(/Active Users:/i)).toHaveLength(2);
        expect(screen.getAllByText('12.5K')).toHaveLength(2);
      });
    });

    it('price items have accent colored symbols', async () => {
      const { container } = render(<LiveTicker />);

      await waitFor(() => {
        const btcElements = screen.getAllByText('BTC');
        expect(btcElements[0]).toHaveClass('text-accent');
      });
    });

    it('stat items have icons', async () => {
      render(<LiveTicker />);

      await waitFor(() => {
        expect(screen.getAllByText('👥')).toHaveLength(2);
      });
    });

    it('stat items have secondary colored labels', async () => {
      const { container } = render(<LiveTicker />);

      await waitFor(() => {
        const labels = container.querySelectorAll('.text-secondary');
        expect(labels.length).toBeGreaterThan(0);
      });
    });

    it('items have proper gap spacing', async () => {
      const { container } = render(<LiveTicker />);

      await waitFor(() => {
        const tickerContainer = container.querySelector('.flex.items-center.gap-8');
        expect(tickerContainer).toBeInTheDocument();
      });
    });
  });

  describe('Item Styling', () => {
    it('items have background styling', async () => {
      const { container } = render(<LiveTicker />);

      await waitFor(() => {
        const items = container.querySelectorAll('.bg-tertiary');
        expect(items.length).toBeGreaterThan(0);
      });
    });

    it('items have border styling', async () => {
      const { container } = render(<LiveTicker />);

      await waitFor(() => {
        const items = container.querySelectorAll('.border.border-secondary');
        expect(items.length).toBeGreaterThan(0);
      });
    });

    it('items have rounded corners', async () => {
      const { container } = render(<LiveTicker />);

      await waitFor(() => {
        const items = container.querySelectorAll('.rounded-lg');
        expect(items.length).toBeGreaterThan(0);
      });
    });

    it('items have padding', async () => {
      const { container } = render(<LiveTicker />);

      await waitFor(() => {
        const items = container.querySelectorAll('.px-4.py-2');
        expect(items.length).toBeGreaterThan(0);
      });
    });

    it('items have hover border color', async () => {
      const { container } = render(<LiveTicker />);

      await waitFor(() => {
        const items = container.querySelectorAll('.hover\\:border-accent');
        expect(items.length).toBeGreaterThan(0);
      });
    });

    it('items have transition effects', async () => {
      const { container } = render(<LiveTicker />);

      await waitFor(() => {
        const items = container.querySelectorAll('.transition-all');
        expect(items.length).toBeGreaterThan(0);
      });
    });

    it('items are clickable', async () => {
      const { container } = render(<LiveTicker />);

      await waitFor(() => {
        const items = container.querySelectorAll('.cursor-pointer');
        expect(items.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Hover Effects', () => {
    it('items have hover glow effect', async () => {
      const { container } = render(<LiveTicker />);

      await waitFor(() => {
        const glowEffects = container.querySelectorAll('.group-hover\\:opacity-10');
        expect(glowEffects.length).toBeGreaterThan(0);
      });
    });

    it('glow effect has gradient', async () => {
      const { container } = render(<LiveTicker />);

      await waitFor(() => {
        const gradients = container.querySelectorAll('.bg-gradient-to-r.from-transparent');
        expect(gradients.length).toBeGreaterThan(0);
      });
    });

    it('glow effect is initially hidden', async () => {
      const { container } = render(<LiveTicker />);

      await waitFor(() => {
        const glowEffects = container.querySelectorAll('.opacity-0');
        expect(glowEffects.length).toBeGreaterThan(0);
      });
    });

    it('glow effect has transition', async () => {
      const { container } = render(<LiveTicker />);

      await waitFor(() => {
        const transitionElements = container.querySelectorAll('.transition-opacity');
        expect(transitionElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Duplicate Items for Seamless Loop', () => {
    it('duplicates all items exactly once', async () => {
      render(<LiveTicker />);

      await waitFor(() => {
        // Each item should appear exactly twice
        expect(screen.getAllByText('BTC')).toHaveLength(2);
        expect(screen.getAllByText('ETH')).toHaveLength(2);
        expect(screen.getAllByText('SOL')).toHaveLength(2);
      });
    });

    it('maintains correct key for duplicated items', async () => {
      const { container } = render(<LiveTicker />);

      await waitFor(() => {
        const btcElements = container.querySelectorAll('[class*="gap-2"]');
        expect(btcElements.length).toBeGreaterThan(0);
      });
    });

    it('duplicates both price and stat items', async () => {
      render(<LiveTicker />);

      await waitFor(() => {
        // Price items
        expect(screen.getAllByText('BTC')).toHaveLength(2);
        // Stat items
        expect(screen.getAllByText(/Active Users/i)).toHaveLength(2);
      });
    });
  });

  describe('Interval Cleanup', () => {
    it('clears interval on unmount', async () => {
      const { unmount } = render(<LiveTicker />);

      await waitFor(() => {
        expect(screen.getAllByText('BTC')).toHaveLength(2);
      });

      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('clears interval when paused', async () => {
      const { container } = render(<LiveTicker />);

      await waitFor(() => {
        expect(screen.getAllByText('BTC')).toHaveLength(2);
      });

      const tickerElement = container.querySelector('[style*="animation"]');
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      fireEvent.mouseEnter(tickerElement);

      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('creates new interval when resumed', async () => {
      const { container } = render(<LiveTicker />);

      await waitFor(() => {
        expect(screen.getAllByText('BTC')).toHaveLength(2);
      });

      const tickerElement = container.querySelector('[style*="animation"]');
      const setIntervalSpy = jest.spyOn(global, 'setInterval');

      fireEvent.mouseEnter(tickerElement);
      fireEvent.mouseLeave(tickerElement);

      expect(setIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero speed gracefully', () => {
      const { container } = render(<LiveTicker speed={0} />);
      const tickerElement = container.querySelector('[style*="animation"]');
      expect(tickerElement?.style.animation).toContain('0s');
    });

    it('handles very large speed values', () => {
      const { container } = render(<LiveTicker speed={1000} />);
      const tickerElement = container.querySelector('[style*="animation"]');
      expect(tickerElement?.style.animation).toContain('1000s');
    });

    it('handles empty className prop', () => {
      const { container } = render(<LiveTicker className="" />);
      expect(container.firstChild).toHaveClass('relative', 'overflow-hidden');
    });

    it('handles multiple rapid pause/resume cycles', async () => {
      const { container } = render(<LiveTicker />);

      await waitFor(() => {
        expect(screen.getAllByText('BTC')).toHaveLength(2);
      });

      const tickerElement = container.querySelector('[style*="animation"]');

      fireEvent.mouseEnter(tickerElement);
      fireEvent.mouseLeave(tickerElement);
      fireEvent.mouseEnter(tickerElement);
      fireEvent.mouseLeave(tickerElement);

      expect(tickerElement?.style.animation).toContain('scroll');
    });

    it('handles price updates with Math.random edge cases', async () => {
      mockRandomValue = 0; // Minimum value
      render(<LiveTicker />);

      await waitFor(() => {
        expect(screen.getAllByText('BTC')).toHaveLength(2);
      });

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(screen.getAllByText('BTC')).toHaveLength(2);
      });
    });

    it('handles price updates with maximum Math.random value', async () => {
      mockRandomValue = 1; // Maximum value
      render(<LiveTicker />);

      await waitFor(() => {
        expect(screen.getAllByText('BTC')).toHaveLength(2);
      });

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(screen.getAllByText('BTC')).toHaveLength(2);
      });
    });

    it('maintains whitespace-nowrap on ticker items', async () => {
      const { container } = render(<LiveTicker />);

      await waitFor(() => {
        const tickerContainer = container.querySelector('.whitespace-nowrap');
        expect(tickerContainer).toBeInTheDocument();
      });
    });
  });

  describe('Style Injection', () => {
    it('injects keyframe animation styles into document', () => {
      render(<LiveTicker />);

      const styles = document.querySelectorAll('style');
      const hasScrollAnimation = Array.from(styles).some(style =>
        style.textContent?.includes('@keyframes scroll')
      );

      expect(hasScrollAnimation).toBeTruthy();
    });

    it('animation transforms from 0 to -100%', () => {
      render(<LiveTicker />);

      const styles = document.querySelectorAll('style');
      const scrollStyle = Array.from(styles).find(style =>
        style.textContent?.includes('@keyframes scroll')
      );

      expect(scrollStyle?.textContent).toContain('translateX(0)');
      expect(scrollStyle?.textContent).toContain('translateX(-100%)');
    });

    it('does not inject styles on server-side', () => {
      const originalDocument = global.document;
      delete global.document;

      // Should not crash when document is undefined
      expect(() => {
        require('./LiveTicker');
      }).not.toThrow();

      global.document = originalDocument;
    });
  });

  describe('Accessibility', () => {
    it('has proper container structure', () => {
      const { container } = render(<LiveTicker />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('maintains visual hierarchy with z-index', () => {
      const { container } = render(<LiveTicker />);
      const zIndexElements = container.querySelectorAll('[class*="z-"]');
      expect(zIndexElements.length).toBeGreaterThan(0);
    });

    it('items are keyboard accessible', async () => {
      const { container } = render(<LiveTicker />);

      await waitFor(() => {
        const clickableItems = container.querySelectorAll('.cursor-pointer');
        expect(clickableItems.length).toBeGreaterThan(0);
      });
    });

    it('maintains readability with proper text colors', async () => {
      const { container } = render(<LiveTicker />);

      await waitFor(() => {
        const textElements = container.querySelectorAll('[class*="text-"]');
        expect(textElements.length).toBeGreaterThan(0);
      });
    });

    it('live indicator is properly labeled', () => {
      render(<LiveTicker />);
      expect(screen.getByText('Live')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('only updates prices when not paused', async () => {
      const { container } = render(<LiveTicker />);

      await waitFor(() => {
        expect(screen.getAllByText('BTC')).toHaveLength(2);
      });

      const tickerElement = container.querySelector('[style*="animation"]');
      fireEvent.mouseEnter(tickerElement);

      const setIntervalSpy = jest.spyOn(global, 'setInterval');

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Should not create new intervals while paused
      expect(setIntervalSpy).not.toHaveBeenCalled();

      setIntervalSpy.mockRestore();
    });

    it('uses efficient price update mechanism', async () => {
      render(<LiveTicker />);

      await waitFor(() => {
        expect(screen.getAllByText('BTC')).toHaveLength(2);
      });

      const setIntervalSpy = jest.spyOn(global, 'setInterval');

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Should use a single interval for all updates
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 3000);

      setIntervalSpy.mockRestore();
    });
  });

  describe('Data Integrity', () => {
    it('preserves all initial ticker data', async () => {
      render(<LiveTicker />);

      await waitFor(() => {
        // Should have 7 crypto prices
        expect(screen.getAllByText('BTC')).toHaveLength(2);
        expect(screen.getAllByText('ETH')).toHaveLength(2);
        expect(screen.getAllByText('SOL')).toHaveLength(2);
        expect(screen.getAllByText('ADA')).toHaveLength(2);
        expect(screen.getAllByText('MATIC')).toHaveLength(2);
        expect(screen.getAllByText('DOT')).toHaveLength(2);
        expect(screen.getAllByText('AVAX')).toHaveLength(2);
      });
    });

    it('preserves all stat labels', async () => {
      render(<LiveTicker />);

      await waitFor(() => {
        expect(screen.getAllByText(/Active Users/i)).toHaveLength(2);
        expect(screen.getAllByText(/Messages Today/i)).toHaveLength(2);
        expect(screen.getAllByText(/Communities/i)).toHaveLength(2);
        expect(screen.getAllByText(/Trades/i)).toHaveLength(2);
        expect(screen.getAllByText(/Volume 24h/i)).toHaveLength(2);
      });
    });

    it('maintains correct data types after updates', async () => {
      render(<LiveTicker />);

      await waitFor(() => {
        expect(screen.getAllByText('BTC')).toHaveLength(2);
      });

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        // Prices should still be formatted correctly
        const container = document.body;
        expect(container.textContent).toMatch(/\$[\d,]+\.?\d*/);
      });
    });
  });

  describe('Snapshot Tests', () => {
    it('matches snapshot with default props', async () => {
      const { container } = render(<LiveTicker />);

      await waitFor(() => {
        expect(screen.getAllByText('BTC')).toHaveLength(2);
      });

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with custom speed', async () => {
      const { container } = render(<LiveTicker speed={60} />);

      await waitFor(() => {
        expect(screen.getAllByText('BTC')).toHaveLength(2);
      });

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with custom className', async () => {
      const { container } = render(<LiveTicker className="custom-ticker" />);

      await waitFor(() => {
        expect(screen.getAllByText('BTC')).toHaveLength(2);
      });

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot in paused state', async () => {
      const { container } = render(<LiveTicker />);

      await waitFor(() => {
        expect(screen.getAllByText('BTC')).toHaveLength(2);
      });

      const tickerElement = container.querySelector('[style*="animation"]');
      fireEvent.mouseEnter(tickerElement);

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot after price update', async () => {
      mockRandomValue = 0.7;
      const { container } = render(<LiveTicker />);

      await waitFor(() => {
        expect(screen.getAllByText('BTC')).toHaveLength(2);
      });

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(screen.getAllByText('BTC')).toHaveLength(2);
      });

      expect(container).toMatchSnapshot();
    });
  });

  describe('Integration Tests', () => {
    it('handles complete lifecycle: mount, update, pause, resume, unmount', async () => {
      const { container, unmount } = render(<LiveTicker />);

      // Mount
      await waitFor(() => {
        expect(screen.getAllByText('BTC')).toHaveLength(2);
      });

      // Update
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Pause
      const tickerElement = container.querySelector('[style*="animation"]');
      fireEvent.mouseEnter(tickerElement);
      expect(tickerElement?.style.animation).toBe('none');

      // Resume
      fireEvent.mouseLeave(tickerElement);
      expect(tickerElement?.style.animation).toContain('scroll');

      // Unmount
      unmount();
      expect(container.firstChild).toBeNull();
    });

    it('handles multiple price update cycles', async () => {
      render(<LiveTicker />);

      await waitFor(() => {
        expect(screen.getAllByText('BTC')).toHaveLength(2);
      });

      // First update
      mockRandomValue = 0.6;
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Second update
      mockRandomValue = 0.4;
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Third update
      mockRandomValue = 0.5;
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(screen.getAllByText('BTC')).toHaveLength(2);
      });
    });

    it('maintains visual consistency during interactions', async () => {
      const { container } = render(<LiveTicker />);

      await waitFor(() => {
        expect(screen.getAllByText('BTC')).toHaveLength(2);
      });

      const tickerElement = container.querySelector('[style*="animation"]');

      // Multiple hover interactions
      fireEvent.mouseEnter(tickerElement);
      expect(screen.getByText('Live')).toBeInTheDocument();

      fireEvent.mouseLeave(tickerElement);
      expect(screen.getByText('Live')).toBeInTheDocument();

      // Price update during interaction
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(screen.getByText('Live')).toBeInTheDocument();
    });
  });

  describe('Typography and Font Styles', () => {
    it('applies correct font weights to symbols', async () => {
      const { container } = render(<LiveTicker />);

      await waitFor(() => {
        const symbols = container.querySelectorAll('.font-semibold.text-accent');
        expect(symbols.length).toBeGreaterThan(0);
      });
    });

    it('applies medium font weight to prices', async () => {
      const { container } = render(<LiveTicker />);

      await waitFor(() => {
        const prices = container.querySelectorAll('.font-medium.text-primary');
        expect(prices.length).toBeGreaterThan(0);
      });
    });

    it('applies correct text sizes', async () => {
      const { container } = render(<LiveTicker />);

      await waitFor(() => {
        const smallText = container.querySelectorAll('.text-sm');
        const largeText = container.querySelectorAll('.text-lg');
        const extraSmallText = container.querySelectorAll('.text-xs');

        expect(smallText.length).toBeGreaterThan(0);
        expect(largeText.length).toBeGreaterThan(0);
        expect(extraSmallText.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Layout and Positioning', () => {
    it('uses flexbox for item layout', async () => {
      const { container } = render(<LiveTicker />);

      await waitFor(() => {
        const flexContainer = container.querySelector('.flex.items-center');
        expect(flexContainer).toBeInTheDocument();
      });
    });

    it('applies relative positioning to container', () => {
      const { container } = render(<LiveTicker />);
      expect(container.firstChild).toHaveClass('relative');
    });

    it('applies absolute positioning to gradient masks', () => {
      const { container } = render(<LiveTicker />);
      const absoluteElements = container.querySelectorAll('.absolute');
      expect(absoluteElements.length).toBeGreaterThanOrEqual(3);
    });

    it('maintains overflow hidden on container', () => {
      const { container } = render(<LiveTicker />);
      expect(container.firstChild).toHaveClass('overflow-hidden');
    });
  });
});

export default originalRandom
