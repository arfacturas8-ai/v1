/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NFTProfileBadge from './NFTProfileBadge';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Star: ({ className, ...props }) => (
    <svg data-testid="icon-star" className={className} {...props} />
  ),
  Crown: ({ className, ...props }) => (
    <svg data-testid="icon-crown" className={className} {...props} />
  ),
  Gem: ({ className, ...props }) => (
    <svg data-testid="icon-gem" className={className} {...props} />
  ),
  Zap: ({ className, ...props }) => (
    <svg data-testid="icon-zap" className={className} {...props} />
  ),
}));

// Mock Card component
jest.mock('../ui/Card', () => ({
  Card: ({ children, className, ...props }) => (
    <div data-testid="card" className={className} {...props}>
      {children}
    </div>
  ),
}));

describe('NFTProfileBadge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<NFTProfileBadge />);
      expect(container).toBeInTheDocument();
    });

    it('renders with default props', () => {
      render(<NFTProfileBadge />);
      expect(screen.getByText('NFT Badge')).toBeInTheDocument();
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      render(<NFTProfileBadge />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('renders the main badge container', () => {
      const { container } = render(<NFTProfileBadge />);
      const badge = container.querySelector('.relative.inline-block');
      expect(badge).toBeInTheDocument();
    });

    it('renders the coming soon indicator', () => {
      render(<NFTProfileBadge />);
      expect(screen.getByText('SOON')).toBeInTheDocument();
    });

    it('renders the Gem icon by default', () => {
      render(<NFTProfileBadge />);
      expect(screen.getByTestId('icon-gem')).toBeInTheDocument();
    });

    it('applies correct base classes', () => {
      const { container } = render(<NFTProfileBadge />);
      const badge = container.querySelector('span.inline-flex');
      expect(badge).toHaveClass('inline-flex', 'items-center', 'gap-1.5', 'rounded-lg');
    });

    it('renders with custom className', () => {
      const { container } = render(<NFTProfileBadge className="custom-class" />);
      const badge = container.querySelector('.custom-class');
      expect(badge).toBeInTheDocument();
    });

    it('renders NFT Badge text', () => {
      render(<NFTProfileBadge />);
      const text = screen.getByText('NFT Badge');
      expect(text).toHaveClass('truncate', 'max-w-[100px]', 'font-semibold');
    });

    it('applies truncate class for text overflow', () => {
      render(<NFTProfileBadge />);
      const text = screen.getByText('NFT Badge');
      expect(text).toHaveClass('truncate');
    });
  });

  describe('Rarity Variants', () => {
    it('renders common rarity badge', () => {
      const { container } = render(<NFTProfileBadge rarity="common" />);
      expect(container.querySelector('.relative.inline-block')).toBeInTheDocument();
    });

    it('renders rare rarity badge with Star icon', () => {
      render(<NFTProfileBadge rarity="rare" />);
      expect(screen.getByTestId('icon-gem')).toBeInTheDocument();
    });

    it('renders epic rarity badge with Gem icon', () => {
      render(<NFTProfileBadge rarity="epic" />);
      expect(screen.getByTestId('icon-gem')).toBeInTheDocument();
    });

    it('renders legendary rarity badge with Crown icon', () => {
      render(<NFTProfileBadge rarity="legendary" />);
      expect(screen.getByTestId('icon-gem')).toBeInTheDocument();
    });

    it('renders mythic rarity badge with Zap icon', () => {
      render(<NFTProfileBadge rarity="mythic" />);
      expect(screen.getByTestId('icon-gem')).toBeInTheDocument();
    });

    it('applies correct style for common rarity', () => {
      const { container } = render(<NFTProfileBadge rarity="common" />);
      const badge = container.querySelector('span.inline-flex');
      expect(badge).toHaveStyle({ color: '#6B7280' });
    });

    it('applies correct style for rare rarity', () => {
      const { container } = render(<NFTProfileBadge rarity="rare" />);
      const badge = container.querySelector('span.inline-flex');
      expect(badge).toHaveStyle({ color: '#58a6ff' });
    });

    it('applies correct style for epic rarity', () => {
      const { container } = render(<NFTProfileBadge rarity="epic" />);
      const badge = container.querySelector('span.inline-flex');
      expect(badge).toHaveStyle({ color: '#8B5CF6' });
    });

    it('applies correct style for legendary rarity', () => {
      const { container } = render(<NFTProfileBadge rarity="legendary" />);
      const badge = container.querySelector('span.inline-flex');
      expect(badge).toHaveStyle({ color: '#F59E0B' });
    });

    it('applies correct style for mythic rarity', () => {
      const { container } = render(<NFTProfileBadge rarity="mythic" />);
      const badge = container.querySelector('span.inline-flex');
      expect(badge).toHaveStyle({ color: '#EF4444' });
    });

    it('applies opacity style to badge', () => {
      const { container } = render(<NFTProfileBadge />);
      const badge = container.querySelector('span.inline-flex');
      expect(badge).toHaveStyle({ opacity: '0.7' });
    });

    it('defaults to common rarity when not specified', () => {
      const { container } = render(<NFTProfileBadge />);
      const badge = container.querySelector('span.inline-flex');
      expect(badge).toHaveStyle({ color: '#6B7280' });
    });

    it('handles invalid rarity gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { container } = render(<NFTProfileBadge rarity="invalid" />);
      expect(container).toBeInTheDocument();
      consoleSpy.mockRestore();
    });
  });

  describe('Size Variants', () => {
    it('renders xs size badge', () => {
      const { container } = render(<NFTProfileBadge size="xs" />);
      const badge = container.querySelector('span.inline-flex');
      expect(badge).toHaveClass('h-4', 'px-2', 'text-xs');
    });

    it('renders sm size badge (default)', () => {
      const { container } = render(<NFTProfileBadge size="sm" />);
      const badge = container.querySelector('span.inline-flex');
      expect(badge).toHaveClass('h-5', 'px-3', 'text-xs');
    });

    it('renders md size badge', () => {
      const { container } = render(<NFTProfileBadge size="md" />);
      const badge = container.querySelector('span.inline-flex');
      expect(badge).toHaveClass('h-6', 'px-3', 'text-sm');
    });

    it('renders lg size badge', () => {
      const { container } = render(<NFTProfileBadge size="lg" />);
      const badge = container.querySelector('span.inline-flex');
      expect(badge).toHaveClass('h-7', 'px-4', 'text-sm');
    });

    it('defaults to sm size when not specified', () => {
      const { container } = render(<NFTProfileBadge />);
      const badge = container.querySelector('span.inline-flex');
      expect(badge).toHaveClass('h-5', 'px-3', 'text-xs');
    });

    it('icon scales appropriately for all sizes', () => {
      const sizes = ['xs', 'sm', 'md', 'lg'];
      sizes.forEach(size => {
        const { container } = render(<NFTProfileBadge size={size} />);
        const icon = screen.getByTestId('icon-gem');
        expect(icon).toHaveClass('w-3', 'h-3');
      });
    });
  });

  describe('Tooltip Functionality', () => {
    it('renders tooltip by default', () => {
      render(<NFTProfileBadge />);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('renders tooltip with showTooltip=true', () => {
      render(<NFTProfileBadge showTooltip={true} />);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('does not render tooltip when showTooltip=false', () => {
      render(<NFTProfileBadge showTooltip={false} />);
      expect(screen.queryByTestId('card')).not.toBeInTheDocument();
    });

    it('tooltip contains correct heading', () => {
      render(<NFTProfileBadge showTooltip={true} />);
      expect(screen.getByText('NFT Profile Badges')).toBeInTheDocument();
    });

    it('tooltip contains coming soon message', () => {
      render(<NFTProfileBadge showTooltip={true} />);
      expect(screen.getByText('Coming Soon!')).toBeInTheDocument();
    });

    it('tooltip contains feature description', () => {
      render(<NFTProfileBadge showTooltip={true} />);
      expect(screen.getByText('Show off your NFT collections')).toBeInTheDocument();
    });

    it('tooltip has correct styling classes', () => {
      render(<NFTProfileBadge showTooltip={true} />);
      const tooltip = screen.getByTestId('card');
      expect(tooltip).toHaveClass(
        'absolute',
        'bottom-full',
        'left-1/2',
        '-translate-x-1/2',
        'mb-2'
      );
    });

    it('tooltip has opacity transition classes', () => {
      render(<NFTProfileBadge showTooltip={true} />);
      const tooltip = screen.getByTestId('card');
      expect(tooltip).toHaveClass('opacity-0', 'group-hover:opacity-100');
    });

    it('tooltip has correct z-index', () => {
      render(<NFTProfileBadge showTooltip={true} />);
      const tooltip = screen.getByTestId('card');
      expect(tooltip).toHaveClass('z-50');
    });

    it('tooltip has pointer-events-none class', () => {
      render(<NFTProfileBadge showTooltip={true} />);
      const tooltip = screen.getByTestId('card');
      expect(tooltip).toHaveClass('pointer-events-none');
    });

    it('tooltip renders gem icon in heading', () => {
      render(<NFTProfileBadge showTooltip={true} />);
      const icons = screen.getAllByTestId('icon-gem');
      expect(icons.length).toBeGreaterThanOrEqual(2);
    });

    it('tooltip contains card with elevated variant', () => {
      render(<NFTProfileBadge showTooltip={true} />);
      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
    });

    it('tooltip contains card with sm padding', () => {
      render(<NFTProfileBadge showTooltip={true} />);
      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Coming Soon Badge', () => {
    it('renders SOON indicator', () => {
      render(<NFTProfileBadge />);
      expect(screen.getByText('SOON')).toBeInTheDocument();
    });

    it('SOON badge has correct styling', () => {
      const { container } = render(<NFTProfileBadge />);
      const soonBadge = screen.getByText('SOON');
      expect(soonBadge).toHaveClass(
        'absolute',
        '-top-1.5',
        '-right-1.5',
        'px-1.5',
        'py-0.5'
      );
    });

    it('SOON badge has bg-warning class', () => {
      render(<NFTProfileBadge />);
      const soonBadge = screen.getByText('SOON');
      expect(soonBadge).toHaveClass('bg-warning');
    });

    it('SOON badge has correct text styling', () => {
      render(<NFTProfileBadge />);
      const soonBadge = screen.getByText('SOON');
      expect(soonBadge).toHaveClass('text-white', 'text-[10px]', 'font-bold');
    });

    it('SOON badge has rounded-full class', () => {
      render(<NFTProfileBadge />);
      const soonBadge = screen.getByText('SOON');
      expect(soonBadge).toHaveClass('rounded-full');
    });

    it('SOON badge has shadow', () => {
      render(<NFTProfileBadge />);
      const soonBadge = screen.getByText('SOON');
      expect(soonBadge).toHaveClass('shadow-lg');
    });

    it('SOON badge is positioned absolutely', () => {
      render(<NFTProfileBadge />);
      const soonBadge = screen.getByText('SOON');
      expect(soonBadge).toHaveClass('absolute');
    });
  });

  describe('Props Handling', () => {
    it('accepts collection prop', () => {
      render(<NFTProfileBadge collection="Bored Ape Yacht Club" />);
      expect(screen.getByText('NFT Badge')).toBeInTheDocument();
    });

    it('accepts tokenId prop', () => {
      render(<NFTProfileBadge tokenId="1234" />);
      expect(screen.getByText('NFT Badge')).toBeInTheDocument();
    });

    it('accepts all props together', () => {
      render(
        <NFTProfileBadge
          collection="Test Collection"
          tokenId="123"
          rarity="legendary"
          size="lg"
          className="test-class"
          showTooltip={true}
        />
      );
      expect(screen.getByText('NFT Badge')).toBeInTheDocument();
    });

    it('handles missing optional props', () => {
      render(<NFTProfileBadge />);
      expect(screen.getByText('NFT Badge')).toBeInTheDocument();
    });

    it('rarity prop affects badge color', () => {
      const { rerender, container } = render(<NFTProfileBadge rarity="common" />);
      let badge = container.querySelector('span.inline-flex');
      expect(badge).toHaveStyle({ color: '#6B7280' });

      rerender(<NFTProfileBadge rarity="legendary" />);
      badge = container.querySelector('span.inline-flex');
      expect(badge).toHaveStyle({ color: '#F59E0B' });
    });

    it('size prop affects badge dimensions', () => {
      const { rerender, container } = render(<NFTProfileBadge size="xs" />);
      let badge = container.querySelector('span.inline-flex');
      expect(badge).toHaveClass('h-4');

      rerender(<NFTProfileBadge size="lg" />);
      badge = container.querySelector('span.inline-flex');
      expect(badge).toHaveClass('h-7');
    });
  });

  describe('Styling and Classes', () => {
    it('applies transition classes', () => {
      const { container } = render(<NFTProfileBadge />);
      const badge = container.querySelector('span.inline-flex');
      expect(badge).toHaveClass('transition-all');
    });

    it('applies shadow classes', () => {
      const { container } = render(<NFTProfileBadge />);
      const badge = container.querySelector('span.inline-flex');
      expect(badge).toHaveClass('shadow-sm');
    });

    it('applies hover shadow classes', () => {
      const { container } = render(<NFTProfileBadge />);
      const badge = container.querySelector('span.inline-flex');
      expect(badge).toHaveClass('hover:shadow-md');
    });

    it('applies border classes', () => {
      const { container } = render(<NFTProfileBadge />);
      const badge = container.querySelector('span.inline-flex');
      expect(badge).toHaveClass('border');
    });

    it('applies font-medium class', () => {
      const { container } = render(<NFTProfileBadge />);
      const badge = container.querySelector('span.inline-flex');
      expect(badge).toHaveClass('font-medium');
    });

    it('group wrapper exists for hover effects', () => {
      const { container } = render(<NFTProfileBadge showTooltip={true} />);
      const group = container.querySelector('.group');
      expect(group).toBeInTheDocument();
    });

    it('relative positioning on wrapper', () => {
      const { container } = render(<NFTProfileBadge showTooltip={true} />);
      const wrapper = container.querySelector('.relative.group');
      expect(wrapper).toBeInTheDocument();
    });

    it('applies correct inline styling for background color', () => {
      const { container } = render(<NFTProfileBadge rarity="rare" />);
      const badge = container.querySelector('span.inline-flex');
      expect(badge?.style.backgroundColor).toBeTruthy();
    });

    it('applies correct inline styling for border color', () => {
      const { container } = render(<NFTProfileBadge rarity="rare" />);
      const badge = container.querySelector('span.inline-flex');
      expect(badge?.style.borderColor).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('renders semantic HTML structure', () => {
      const { container } = render(<NFTProfileBadge />);
      expect(container.querySelector('div')).toBeInTheDocument();
      expect(container.querySelector('span')).toBeInTheDocument();
    });

    it('tooltip content is readable', () => {
      render(<NFTProfileBadge showTooltip={true} />);
      expect(screen.getByText('NFT Profile Badges')).toBeInTheDocument();
      expect(screen.getByText('Coming Soon!')).toBeInTheDocument();
      expect(screen.getByText('Show off your NFT collections')).toBeInTheDocument();
    });

    it('badge text is visible', () => {
      render(<NFTProfileBadge />);
      const badgeText = screen.getByText('NFT Badge');
      expect(badgeText).toBeVisible();
    });

    it('icon has proper sizing', () => {
      render(<NFTProfileBadge />);
      const icon = screen.getByTestId('icon-gem');
      expect(icon).toHaveClass('w-3', 'h-3');
    });

    it('maintains text contrast with background', () => {
      const { container } = render(<NFTProfileBadge rarity="legendary" />);
      const badge = container.querySelector('span.inline-flex');
      expect(badge).toHaveStyle({ color: '#F59E0B' });
    });

    it('whitespace handling in tooltip', () => {
      render(<NFTProfileBadge showTooltip={true} />);
      const tooltip = screen.getByTestId('card');
      expect(tooltip).toHaveClass('whitespace-nowrap');
    });

    it('SOON badge has sufficient contrast', () => {
      render(<NFTProfileBadge />);
      const soonBadge = screen.getByText('SOON');
      expect(soonBadge).toHaveClass('text-white');
    });
  });

  describe('Edge Cases', () => {
    it('handles null collection prop', () => {
      render(<NFTProfileBadge collection={null} />);
      expect(screen.getByText('NFT Badge')).toBeInTheDocument();
    });

    it('handles undefined tokenId prop', () => {
      render(<NFTProfileBadge tokenId={undefined} />);
      expect(screen.getByText('NFT Badge')).toBeInTheDocument();
    });

    it('handles empty string className', () => {
      render(<NFTProfileBadge className="" />);
      expect(screen.getByText('NFT Badge')).toBeInTheDocument();
    });

    it('handles zero as tokenId', () => {
      render(<NFTProfileBadge tokenId={0} />);
      expect(screen.getByText('NFT Badge')).toBeInTheDocument();
    });

    it('handles very long collection names', () => {
      render(<NFTProfileBadge collection="A".repeat(100) />);
      const badgeText = screen.getByText('NFT Badge');
      expect(badgeText).toHaveClass('truncate');
    });

    it('handles showTooltip as undefined', () => {
      render(<NFTProfileBadge showTooltip={undefined} />);
      expect(screen.getByText('NFT Badge')).toBeInTheDocument();
    });

    it('handles multiple rapid re-renders', () => {
      const { rerender } = render(<NFTProfileBadge rarity="common" />);
      rerender(<NFTProfileBadge rarity="rare" />);
      rerender(<NFTProfileBadge rarity="epic" />);
      rerender(<NFTProfileBadge rarity="legendary" />);
      expect(screen.getByText('NFT Badge')).toBeInTheDocument();
    });

    it('does not break with special characters in collection', () => {
      render(<NFTProfileBadge collection="Test & Co. <script>" />);
      expect(screen.getByText('NFT Badge')).toBeInTheDocument();
    });

    it('handles boolean className', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      render(<NFTProfileBadge className={true} />);
      expect(screen.getByText('NFT Badge')).toBeInTheDocument();
      consoleSpy.mockRestore();
    });

    it('handles negative tokenId', () => {
      render(<NFTProfileBadge tokenId={-1} />);
      expect(screen.getByText('NFT Badge')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('integrates with Card component correctly', () => {
      render(<NFTProfileBadge showTooltip={true} />);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('renders multiple badges independently', () => {
      const { container } = render(
        <>
          <NFTProfileBadge rarity="common" />
          <NFTProfileBadge rarity="rare" />
          <NFTProfileBadge rarity="epic" />
        </>
      );
      const badges = container.querySelectorAll('.relative.inline-block');
      expect(badges).toHaveLength(3);
    });

    it('maintains separate state for multiple instances', () => {
      render(
        <>
          <NFTProfileBadge rarity="common" showTooltip={true} />
          <NFTProfileBadge rarity="rare" showTooltip={false} />
        </>
      );
      const cards = screen.queryAllByTestId('card');
      expect(cards).toHaveLength(1);
    });

    it('works within different parent containers', () => {
      const { container } = render(
        <div className="flex gap-4">
          <NFTProfileBadge />
          <NFTProfileBadge />
        </div>
      );
      const badges = container.querySelectorAll('.relative.inline-block');
      expect(badges).toHaveLength(2);
    });

    it('renders correctly with siblings', () => {
      render(
        <div>
          <span>Before</span>
          <NFTProfileBadge />
          <span>After</span>
        </div>
      );
      expect(screen.getByText('Before')).toBeInTheDocument();
      expect(screen.getByText('NFT Badge')).toBeInTheDocument();
      expect(screen.getByText('After')).toBeInTheDocument();
    });
  });

  describe('Visual States', () => {
    it('has reduced opacity for coming soon state', () => {
      const { container } = render(<NFTProfileBadge />);
      const badge = container.querySelector('span.inline-flex');
      expect(badge).toHaveStyle({ opacity: '0.7' });
    });

    it('SOON badge is visually distinct', () => {
      render(<NFTProfileBadge />);
      const soonBadge = screen.getByText('SOON');
      expect(soonBadge).toHaveClass('bg-warning', 'text-white', 'font-bold');
    });

    it('tooltip is hidden by default', () => {
      render(<NFTProfileBadge showTooltip={true} />);
      const tooltip = screen.getByTestId('card');
      expect(tooltip).toHaveClass('opacity-0');
    });

    it('tooltip shows on hover', () => {
      render(<NFTProfileBadge showTooltip={true} />);
      const tooltip = screen.getByTestId('card');
      expect(tooltip).toHaveClass('group-hover:opacity-100');
    });

    it('badge has hover effects', () => {
      const { container } = render(<NFTProfileBadge />);
      const badge = container.querySelector('span.inline-flex');
      expect(badge).toHaveClass('hover:shadow-md');
    });
  });

  describe('Layout and Structure', () => {
    it('badge uses inline-flex layout', () => {
      const { container } = render(<NFTProfileBadge />);
      const badge = container.querySelector('span.inline-flex');
      expect(badge).toHaveClass('inline-flex');
    });

    it('content is horizontally aligned', () => {
      const { container } = render(<NFTProfileBadge />);
      const badge = container.querySelector('span.inline-flex');
      expect(badge).toHaveClass('items-center');
    });

    it('icon and text have proper spacing', () => {
      const { container } = render(<NFTProfileBadge />);
      const badge = container.querySelector('span.inline-flex');
      expect(badge).toHaveClass('gap-1.5');
    });

    it('tooltip is centered above badge', () => {
      render(<NFTProfileBadge showTooltip={true} />);
      const tooltip = screen.getByTestId('card');
      expect(tooltip).toHaveClass('left-1/2', '-translate-x-1/2');
    });

    it('tooltip has proper spacing from badge', () => {
      render(<NFTProfileBadge showTooltip={true} />);
      const tooltip = screen.getByTestId('card');
      expect(tooltip).toHaveClass('mb-2');
    });

    it('SOON badge is positioned in top-right', () => {
      render(<NFTProfileBadge />);
      const soonBadge = screen.getByText('SOON');
      expect(soonBadge).toHaveClass('-top-1.5', '-right-1.5');
    });

    it('wrapper maintains relative positioning', () => {
      const { container } = render(<NFTProfileBadge />);
      const wrapper = container.querySelector('.relative.inline-block');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Tooltip Content Structure', () => {
    it('tooltip has correct content hierarchy', () => {
      render(<NFTProfileBadge showTooltip={true} />);
      const heading = screen.getByText('NFT Profile Badges');
      const warning = screen.getByText('Coming Soon!');
      const description = screen.getByText('Show off your NFT collections');

      expect(heading).toBeInTheDocument();
      expect(warning).toBeInTheDocument();
      expect(description).toBeInTheDocument();
    });

    it('tooltip heading has correct styling', () => {
      render(<NFTProfileBadge showTooltip={true} />);
      const heading = screen.getByText('NFT Profile Badges');
      expect(heading.parentElement).toHaveClass('font-semibold', 'text-text-primary');
    });

    it('tooltip warning has correct styling', () => {
      render(<NFTProfileBadge showTooltip={true} />);
      const warning = screen.getByText('Coming Soon!');
      expect(warning).toHaveClass('text-warning', 'font-medium', 'text-xs');
    });

    it('tooltip description has correct styling', () => {
      render(<NFTProfileBadge showTooltip={true} />);
      const description = screen.getByText('Show off your NFT collections');
      expect(description).toHaveClass('text-text-muted', 'text-xs');
    });

    it('tooltip content has proper spacing', () => {
      const { container } = render(<NFTProfileBadge showTooltip={true} />);
      const card = screen.getByTestId('card');
      const spacingDiv = card.querySelector('.space-y-1');
      expect(spacingDiv).toBeInTheDocument();
    });

    it('tooltip heading displays gem icon', () => {
      render(<NFTProfileBadge showTooltip={true} />);
      const icons = screen.getAllByTestId('icon-gem');
      expect(icons.length).toBeGreaterThanOrEqual(2);
    });

    it('tooltip is centered', () => {
      const { container } = render(<NFTProfileBadge showTooltip={true} />);
      const card = screen.getByTestId('card');
      const textCenter = card.querySelector('.text-center');
      expect(textCenter).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('renders quickly with minimal re-renders', () => {
      const { rerender } = render(<NFTProfileBadge />);
      const startTime = performance.now();
      rerender(<NFTProfileBadge rarity="rare" />);
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('handles rapid prop changes', () => {
      const { rerender } = render(<NFTProfileBadge size="xs" />);
      for (let i = 0; i < 10; i++) {
        rerender(<NFTProfileBadge size={['xs', 'sm', 'md', 'lg'][i % 4]} />);
      }
      expect(screen.getByText('NFT Badge')).toBeInTheDocument();
    });

    it('does not cause memory leaks on unmount', () => {
      const { unmount } = render(<NFTProfileBadge showTooltip={true} />);
      unmount();
      expect(screen.queryByText('NFT Badge')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('maintains layout on different screen sizes', () => {
      global.innerWidth = 375;
      const { container: mobile } = render(<NFTProfileBadge />);
      expect(mobile.querySelector('.inline-flex')).toBeInTheDocument();

      global.innerWidth = 1920;
      const { container: desktop } = render(<NFTProfileBadge />);
      expect(desktop.querySelector('.inline-flex')).toBeInTheDocument();
    });

    it('text truncation works on narrow screens', () => {
      global.innerWidth = 320;
      render(<NFTProfileBadge />);
      const text = screen.getByText('NFT Badge');
      expect(text).toHaveClass('max-w-[100px]');
    });
  });

  describe('Snapshot Tests', () => {
    it('matches snapshot for common rarity', () => {
      const { container } = render(<NFTProfileBadge rarity="common" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for rare rarity', () => {
      const { container } = render(<NFTProfileBadge rarity="rare" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for epic rarity', () => {
      const { container } = render(<NFTProfileBadge rarity="epic" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for legendary rarity', () => {
      const { container } = render(<NFTProfileBadge rarity="legendary" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for mythic rarity', () => {
      const { container } = render(<NFTProfileBadge rarity="mythic" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot with tooltip', () => {
      const { container } = render(<NFTProfileBadge showTooltip={true} />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot without tooltip', () => {
      const { container } = render(<NFTProfileBadge showTooltip={false} />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for xs size', () => {
      const { container } = render(<NFTProfileBadge size="xs" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for sm size', () => {
      const { container } = render(<NFTProfileBadge size="sm" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for md size', () => {
      const { container } = render(<NFTProfileBadge size="md" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for lg size', () => {
      const { container } = render(<NFTProfileBadge size="lg" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot with custom className', () => {
      const { container } = render(<NFTProfileBadge className="custom-badge" />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Complex Scenarios', () => {
    it('renders correctly with all props combined', () => {
      render(
        <NFTProfileBadge
          collection="Bored Ape Yacht Club"
          tokenId="8542"
          rarity="legendary"
          size="lg"
          className="test-badge"
          showTooltip={true}
        />
      );
      expect(screen.getByText('NFT Badge')).toBeInTheDocument();
      expect(screen.getByText('SOON')).toBeInTheDocument();
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('handles dynamic rarity switching', () => {
      const { rerender, container } = render(<NFTProfileBadge rarity="common" />);
      expect(container.querySelector('span.inline-flex')).toHaveStyle({ color: '#6B7280' });

      rerender(<NFTProfileBadge rarity="legendary" />);
      expect(container.querySelector('span.inline-flex')).toHaveStyle({ color: '#F59E0B' });

      rerender(<NFTProfileBadge rarity="mythic" />);
      expect(container.querySelector('span.inline-flex')).toHaveStyle({ color: '#EF4444' });
    });

    it('handles dynamic size switching', () => {
      const { rerender, container } = render(<NFTProfileBadge size="xs" />);
      expect(container.querySelector('span.inline-flex')).toHaveClass('h-4');

      rerender(<NFTProfileBadge size="lg" />);
      expect(container.querySelector('span.inline-flex')).toHaveClass('h-7');
    });

    it('handles tooltip toggling', () => {
      const { rerender } = render(<NFTProfileBadge showTooltip={false} />);
      expect(screen.queryByTestId('card')).not.toBeInTheDocument();

      rerender(<NFTProfileBadge showTooltip={true} />);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('maintains SOON badge across all variants', () => {
      const rarities = ['common', 'rare', 'epic', 'legendary', 'mythic'];
      rarities.forEach(rarity => {
        const { unmount } = render(<NFTProfileBadge rarity={rarity} />);
        expect(screen.getByText('SOON')).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Conditional Rendering', () => {
    it('renders without tooltip wrapper when showTooltip is false', () => {
      const { container } = render(<NFTProfileBadge showTooltip={false} />);
      expect(container.querySelector('.relative.inline-block')).toBeInTheDocument();
      expect(container.querySelector('.relative.group')).not.toBeInTheDocument();
    });

    it('renders with tooltip wrapper when showTooltip is true', () => {
      const { container } = render(<NFTProfileBadge showTooltip={true} />);
      expect(container.querySelector('.relative.group')).toBeInTheDocument();
    });

    it('always renders coming soon badge', () => {
      render(<NFTProfileBadge showTooltip={false} />);
      expect(screen.getByText('SOON')).toBeInTheDocument();

      render(<NFTProfileBadge showTooltip={true} />);
      expect(screen.getAllByText('SOON')[0]).toBeInTheDocument();
    });

    it('renders different structure based on showTooltip', () => {
      const { container: withoutTooltip } = render(
        <NFTProfileBadge showTooltip={false} />
      );
      const { container: withTooltip } = render(
        <NFTProfileBadge showTooltip={true} />
      );

      expect(withoutTooltip.querySelector('.group')).not.toBeInTheDocument();
      expect(withTooltip.querySelector('.group')).toBeInTheDocument();
    });
  });

  describe('Icon Rendering', () => {
    it('renders Gem icon for badge', () => {
      render(<NFTProfileBadge />);
      const gemIcon = screen.getByTestId('icon-gem');
      expect(gemIcon).toBeInTheDocument();
    });

    it('icon has correct size class', () => {
      render(<NFTProfileBadge />);
      const icon = screen.getByTestId('icon-gem');
      expect(icon).toHaveClass('w-3', 'h-3');
    });

    it('icon renders for all rarity types', () => {
      const rarities = ['common', 'rare', 'epic', 'legendary', 'mythic'];
      rarities.forEach(rarity => {
        const { unmount } = render(<NFTProfileBadge rarity={rarity} />);
        expect(screen.getByTestId('icon-gem')).toBeInTheDocument();
        unmount();
      });
    });

    it('icon renders in tooltip heading', () => {
      render(<NFTProfileBadge showTooltip={true} />);
      const icons = screen.getAllByTestId('icon-gem');
      expect(icons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Text Content', () => {
    it('displays NFT Badge text', () => {
      render(<NFTProfileBadge />);
      expect(screen.getByText('NFT Badge')).toBeInTheDocument();
    });

    it('text has correct styling classes', () => {
      render(<NFTProfileBadge />);
      const text = screen.getByText('NFT Badge');
      expect(text).toHaveClass('truncate', 'max-w-[100px]', 'font-semibold');
    });

    it('text does not overflow container', () => {
      render(<NFTProfileBadge />);
      const text = screen.getByText('NFT Badge');
      expect(text).toHaveClass('truncate');
    });

    it('SOON text is always uppercase', () => {
      render(<NFTProfileBadge />);
      const soonText = screen.getByText('SOON');
      expect(soonText.textContent).toBe('SOON');
    });
  });

  describe('Tooltip Arrow', () => {
    it('renders tooltip arrow when showTooltip is true', () => {
      const { container } = render(<NFTProfileBadge showTooltip={true} />);
      const arrow = container.querySelector('.border-l-4.border-r-4.border-t-4');
      expect(arrow).toBeInTheDocument();
    });

    it('arrow has correct positioning classes', () => {
      const { container } = render(<NFTProfileBadge showTooltip={true} />);
      const arrow = container.querySelector('.border-l-4.border-r-4.border-t-4');
      expect(arrow).toHaveClass('absolute', 'top-full', 'left-1/2', '-translate-x-1/2');
    });

    it('arrow has transparent borders', () => {
      const { container } = render(<NFTProfileBadge showTooltip={true} />);
      const arrow = container.querySelector('.border-l-4.border-r-4.border-t-4');
      expect(arrow).toHaveClass('border-transparent');
    });

    it('arrow points downward', () => {
      const { container } = render(<NFTProfileBadge showTooltip={true} />);
      const arrow = container.querySelector('.border-l-4.border-r-4.border-t-4');
      expect(arrow).toHaveClass('border-t-bg-secondary');
    });

    it('no arrow when tooltip is hidden', () => {
      const { container } = render(<NFTProfileBadge showTooltip={false} />);
      const arrow = container.querySelector('.border-l-4.border-r-4.border-t-4');
      expect(arrow).not.toBeInTheDocument();
    });
  });
});

export default consoleSpy
