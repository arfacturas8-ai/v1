/**
 * Comprehensive Test Suite for CRYB VoteButtons Component
 * Testing vote interactions, states, animations, and accessibility
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { VoteButtons } from './VoteButtons';

// Mock dependencies
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

// Mock framer-motion to simplify testing
jest.mock('framer-motion', () => {
  const mockReact = require('react');
  return {
    motion: {
      div: mockReact.forwardRef(({ children, ...props }: any, ref: any) => (
        <div ref={ref} {...props}>
          {children}
        </div>
      )),
      span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ChevronUp: ({ className }: any) => (
    <svg data-testid="chevron-up" className={className}>
      <path d="M18 15l-6-6-6 6" />
    </svg>
  ),
  ChevronDown: ({ className }: any) => (
    <svg data-testid="chevron-down" className={className}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  TrendingUp: ({ className }: any) => (
    <svg data-testid="trending-up" className={className}>
      <path d="M23 6l-9.5 9.5-5-5L1 18" />
    </svg>
  ),
}));

// Mock IconButton component
jest.mock('../ui/button', () => ({
  IconButton: mockReact.forwardRef(
    ({ icon, onClick, disabled, className, ...props }: any, ref: any) => (
      <button
        ref={ref}
        onClick={onClick}
        disabled={disabled}
        className={className}
        {...props}
      >
        {icon}
      </button>
    )
  ),
}));

describe('VoteButtons Component', () => {
  // ===== RENDERING TESTS =====
  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<VoteButtons score={0} />);
      const upvoteButton = screen.getByLabelText('Upvote');
      const downvoteButton = screen.getByLabelText('Downvote');
      expect(upvoteButton).toBeInTheDocument();
      expect(downvoteButton).toBeInTheDocument();
    });

    it('should render upvote button', () => {
      render(<VoteButtons score={10} />);
      const upvoteButton = screen.getByLabelText('Upvote');
      expect(upvoteButton).toBeInTheDocument();
      expect(screen.getByTestId('chevron-up')).toBeInTheDocument();
    });

    it('should render downvote button', () => {
      render(<VoteButtons score={10} />);
      const downvoteButton = screen.getByLabelText('Downvote');
      expect(downvoteButton).toBeInTheDocument();
      expect(screen.getByTestId('chevron-down')).toBeInTheDocument();
    });

    it('should render without errors when score is undefined', () => {
      render(<VoteButtons score={undefined as any} />);
      const upvoteButton = screen.getByLabelText('Upvote');
      expect(upvoteButton).toBeInTheDocument();
    });
  });

  // ===== VOTE SCORE DISPLAY TESTS =====
  describe('Vote Score Display', () => {
    it('should display vote score', () => {
      render(<VoteButtons score={42} />);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should display zero score', () => {
      render(<VoteButtons score={0} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should display negative score', () => {
      render(<VoteButtons score={-15} />);
      expect(screen.getByText('-15')).toBeInTheDocument();
    });

    it('should format large scores with K suffix', () => {
      render(<VoteButtons score={1500} />);
      expect(screen.getByText('1.5K')).toBeInTheDocument();
    });

    it('should format scores above 10k with K suffix', () => {
      render(<VoteButtons score={15000} />);
      expect(screen.getByText('15.0K')).toBeInTheDocument();
    });

    it('should format scores above 1M with M suffix', () => {
      render(<VoteButtons score={2500000} />);
      expect(screen.getByText('2.5M')).toBeInTheDocument();
    });

    it('should format negative large scores correctly', () => {
      render(<VoteButtons score={-2500} />);
      expect(screen.getByText('-2.5K')).toBeInTheDocument();
    });

    it('should not format scores below 1000', () => {
      render(<VoteButtons score={999} />);
      expect(screen.getByText('999')).toBeInTheDocument();
    });
  });

  // ===== ACTIVE/INACTIVE STATE TESTS =====
  describe('Active/Inactive States', () => {
    it('should show upvote as active when userVote is up', () => {
      render(<VoteButtons score={10} userVote="up" />);
      const upvoteButton = screen.getByLabelText('Upvote');
      expect(upvoteButton).toHaveClass('text-orange-500');
    });

    it('should show downvote as active when userVote is down', () => {
      render(<VoteButtons score={10} userVote="down" />);
      const downvoteButton = screen.getByLabelText('Downvote');
      expect(downvoteButton).toHaveClass('text-blue-500');
    });

    it('should show both buttons as inactive when userVote is null', () => {
      render(<VoteButtons score={10} userVote={null} />);
      const upvoteButton = screen.getByLabelText('Upvote');
      const downvoteButton = screen.getByLabelText('Downvote');
      expect(upvoteButton).toHaveClass('text-muted-foreground');
      expect(downvoteButton).toHaveClass('text-muted-foreground');
    });

    it('should show both buttons as inactive by default', () => {
      render(<VoteButtons score={10} />);
      const upvoteButton = screen.getByLabelText('Upvote');
      const downvoteButton = screen.getByLabelText('Downvote');
      expect(upvoteButton).toHaveClass('text-muted-foreground');
      expect(downvoteButton).toHaveClass('text-muted-foreground');
    });
  });

  // ===== CLICK HANDLING TESTS =====
  describe('Click Handling', () => {
    it('should call onVote with "up" when upvote button is clicked', async () => {
      const user = userEvent.setup();
      const onVote = jest.fn();
      render(<VoteButtons score={10} onVote={onVote} />);

      const upvoteButton = screen.getByLabelText('Upvote');
      await user.click(upvoteButton);

      expect(onVote).toHaveBeenCalledWith('up');
    });

    it('should call onVote with "down" when downvote button is clicked', async () => {
      const user = userEvent.setup();
      const onVote = jest.fn();
      render(<VoteButtons score={10} onVote={onVote} />);

      const downvoteButton = screen.getByLabelText('Downvote');
      await user.click(downvoteButton);

      expect(onVote).toHaveBeenCalledWith('down');
    });

    it('should call onVote with null when clicking active upvote (toggle off)', async () => {
      const user = userEvent.setup();
      const onVote = jest.fn();
      render(<VoteButtons score={10} userVote="up" onVote={onVote} />);

      const upvoteButton = screen.getByLabelText('Upvote');
      await user.click(upvoteButton);

      expect(onVote).toHaveBeenCalledWith(null);
    });

    it('should call onVote with null when clicking active downvote (toggle off)', async () => {
      const user = userEvent.setup();
      const onVote = jest.fn();
      render(<VoteButtons score={10} userVote="down" onVote={onVote} />);

      const downvoteButton = screen.getByLabelText('Downvote');
      await user.click(downvoteButton);

      expect(onVote).toHaveBeenCalledWith(null);
    });

    it('should not call onVote when onVote is not provided', async () => {
      const user = userEvent.setup();
      render(<VoteButtons score={10} />);

      const upvoteButton = screen.getByLabelText('Upvote');
      await user.click(upvoteButton);

      // No error should be thrown
      expect(upvoteButton).toBeInTheDocument();
    });

    it('should handle switching from upvote to downvote', async () => {
      const user = userEvent.setup();
      const onVote = jest.fn();
      render(<VoteButtons score={10} userVote="up" onVote={onVote} />);

      const downvoteButton = screen.getByLabelText('Downvote');
      await user.click(downvoteButton);

      expect(onVote).toHaveBeenCalledWith('down');
    });

    it('should handle switching from downvote to upvote', async () => {
      const user = userEvent.setup();
      const onVote = jest.fn();
      render(<VoteButtons score={10} userVote="down" onVote={onVote} />);

      const upvoteButton = screen.getByLabelText('Upvote');
      await user.click(upvoteButton);

      expect(onVote).toHaveBeenCalledWith('up');
    });
  });

  // ===== OPTIMISTIC UPDATES TESTS =====
  describe('Optimistic Updates', () => {
    it('should optimistically increase score when upvoting from neutral', async () => {
      const user = userEvent.setup();
      render(<VoteButtons score={10} userVote={null} />);

      const upvoteButton = screen.getByLabelText('Upvote');
      await user.click(upvoteButton);

      expect(screen.getByText('11')).toBeInTheDocument();
    });

    it('should optimistically decrease score when downvoting from neutral', async () => {
      const user = userEvent.setup();
      render(<VoteButtons score={10} userVote={null} />);

      const downvoteButton = screen.getByLabelText('Downvote');
      await user.click(downvoteButton);

      expect(screen.getByText('9')).toBeInTheDocument();
    });

    it('should optimistically decrease score when removing upvote', async () => {
      const user = userEvent.setup();
      render(<VoteButtons score={10} userVote="up" />);

      const upvoteButton = screen.getByLabelText('Upvote');
      await user.click(upvoteButton);

      expect(screen.getByText('9')).toBeInTheDocument();
    });

    it('should optimistically increase score when removing downvote', async () => {
      const user = userEvent.setup();
      render(<VoteButtons score={10} userVote="down" />);

      const downvoteButton = screen.getByLabelText('Downvote');
      await user.click(downvoteButton);

      expect(screen.getByText('11')).toBeInTheDocument();
    });

    it('should adjust score by 2 when switching from upvote to downvote', async () => {
      const user = userEvent.setup();
      render(<VoteButtons score={10} userVote="up" />);

      const downvoteButton = screen.getByLabelText('Downvote');
      await user.click(downvoteButton);

      expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('should adjust score by 2 when switching from downvote to upvote', async () => {
      const user = userEvent.setup();
      render(<VoteButtons score={10} userVote="down" />);

      const upvoteButton = screen.getByLabelText('Upvote');
      await user.click(upvoteButton);

      expect(screen.getByText('12')).toBeInTheDocument();
    });
  });

  // ===== DISABLED STATE TESTS =====
  describe('Disabled State', () => {
    it('should disable upvote button when disabled prop is true', () => {
      render(<VoteButtons score={10} disabled />);
      const upvoteButton = screen.getByLabelText('Upvote');
      expect(upvoteButton).toBeDisabled();
    });

    it('should disable downvote button when disabled prop is true', () => {
      render(<VoteButtons score={10} disabled />);
      const downvoteButton = screen.getByLabelText('Downvote');
      expect(downvoteButton).toBeDisabled();
    });

    it('should not call onVote when disabled and upvote is clicked', async () => {
      const user = userEvent.setup();
      const onVote = jest.fn();
      render(<VoteButtons score={10} disabled onVote={onVote} />);

      const upvoteButton = screen.getByLabelText('Upvote');
      await user.click(upvoteButton);

      expect(onVote).not.toHaveBeenCalled();
    });

    it('should not call onVote when disabled and downvote is clicked', async () => {
      const user = userEvent.setup();
      const onVote = jest.fn();
      render(<VoteButtons score={10} disabled onVote={onVote} />);

      const downvoteButton = screen.getByLabelText('Downvote');
      await user.click(downvoteButton);

      expect(onVote).not.toHaveBeenCalled();
    });

    it('should apply opacity when disabled', () => {
      const { container } = render(<VoteButtons score={10} disabled />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('opacity-50');
    });

    it('should apply pointer-events-none when disabled', () => {
      const { container } = render(<VoteButtons score={10} disabled />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('pointer-events-none');
    });
  });

  // ===== LOADING/ANIMATION STATE TESTS =====
  describe('Loading/Animation State', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('should prevent clicks during animation period', async () => {
      const user = userEvent.setup({ delay: null });
      const onVote = jest.fn();
      render(<VoteButtons score={10} onVote={onVote} />);

      const upvoteButton = screen.getByLabelText('Upvote');
      await user.click(upvoteButton);

      // Try clicking again immediately
      await user.click(upvoteButton);

      // Should only be called once because animation is still running
      expect(onVote).toHaveBeenCalledTimes(1);
    });

    it('should allow clicks after animation completes', async () => {
      const user = userEvent.setup({ delay: null });
      const onVote = jest.fn();
      render(<VoteButtons score={10} onVote={onVote} />);

      const upvoteButton = screen.getByLabelText('Upvote');
      await user.click(upvoteButton);

      // Advance timers past the animation duration
      jest.advanceTimersByTime(400);

      await user.click(upvoteButton);

      expect(onVote).toHaveBeenCalledTimes(2);
    });
  });

  // ===== ORIENTATION TESTS =====
  describe('Orientation', () => {
    it('should render vertical orientation by default', () => {
      const { container } = render(<VoteButtons score={10} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex-col');
    });

    it('should render vertical orientation when specified', () => {
      const { container } = render(<VoteButtons score={10} orientation="vertical" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex-col');
    });

    it('should render horizontal orientation when specified', () => {
      const { container } = render(<VoteButtons score={10} orientation="horizontal" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex-row');
    });
  });

  // ===== SIZE VARIANT TESTS =====
  describe('Size Variants', () => {
    it('should render default size', () => {
      render(<VoteButtons score={10} size="default" />);
      const upvoteIcon = screen.getByTestId('chevron-up');
      expect(upvoteIcon).toHaveClass('w-5 h-5');
    });

    it('should render small size', () => {
      render(<VoteButtons score={10} size="sm" />);
      const upvoteIcon = screen.getByTestId('chevron-up');
      expect(upvoteIcon).toHaveClass('w-4 h-4');
    });

    it('should render large size', () => {
      render(<VoteButtons score={10} size="lg" />);
      const upvoteIcon = screen.getByTestId('chevron-up');
      expect(upvoteIcon).toHaveClass('w-6 h-6');
    });

    it('should apply correct font size for small score', () => {
      render(<VoteButtons score={10} size="sm" />);
      const score = screen.getByText('10');
      expect(score).toHaveClass('text-xs');
    });

    it('should apply correct font size for default score', () => {
      render(<VoteButtons score={10} size="default" />);
      const score = screen.getByText('10');
      expect(score).toHaveClass('text-sm');
    });

    it('should apply correct font size for large score', () => {
      render(<VoteButtons score={10} size="lg" />);
      const score = screen.getByText('10');
      expect(score).toHaveClass('text-base');
    });
  });

  // ===== COMPACT MODE TESTS =====
  describe('Compact Mode', () => {
    it('should hide score display when compact is true', () => {
      render(<VoteButtons score={42} compact />);
      expect(screen.queryByText('42')).not.toBeInTheDocument();
    });

    it('should show score display when compact is false', () => {
      render(<VoteButtons score={42} compact={false} />);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should show score display by default', () => {
      render(<VoteButtons score={42} />);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should still render buttons in compact mode', () => {
      render(<VoteButtons score={42} compact />);
      expect(screen.getByLabelText('Upvote')).toBeInTheDocument();
      expect(screen.getByLabelText('Downvote')).toBeInTheDocument();
    });
  });

  // ===== TRENDING INDICATOR TESTS =====
  describe('Trending Indicator', () => {
    it('should show trending indicator when score exceeds threshold', () => {
      render(<VoteButtons score={150} trendingThreshold={100} />);
      expect(screen.getByTestId('trending-up')).toBeInTheDocument();
    });

    it('should not show trending indicator when score is below threshold', () => {
      render(<VoteButtons score={50} trendingThreshold={100} />);
      expect(screen.queryByTestId('trending-up')).not.toBeInTheDocument();
    });

    it('should use default trending threshold of 100', () => {
      render(<VoteButtons score={150} />);
      expect(screen.getByTestId('trending-up')).toBeInTheDocument();
    });

    it('should not show trending indicator when showTrending is false', () => {
      render(<VoteButtons score={150} showTrending={false} trendingThreshold={100} />);
      expect(screen.queryByTestId('trending-up')).not.toBeInTheDocument();
    });

    it('should show trending indicator at exact threshold', () => {
      render(<VoteButtons score={100} trendingThreshold={100} />);
      expect(screen.getByTestId('trending-up')).toBeInTheDocument();
    });

    it('should update trending indicator based on optimistic score', async () => {
      const user = userEvent.setup();
      render(<VoteButtons score={99} userVote={null} trendingThreshold={100} />);

      expect(screen.queryByTestId('trending-up')).not.toBeInTheDocument();

      const upvoteButton = screen.getByLabelText('Upvote');
      await user.click(upvoteButton);

      // Score should be 100 now, triggering trending
      expect(screen.getByTestId('trending-up')).toBeInTheDocument();
    });

    it('should hide trending indicator in compact mode', () => {
      render(<VoteButtons score={150} compact trendingThreshold={100} />);
      expect(screen.queryByTestId('trending-up')).not.toBeInTheDocument();
    });
  });

  // ===== ACCESSIBILITY TESTS =====
  describe('Accessibility', () => {
    it('should have proper aria-label on upvote button', () => {
      render(<VoteButtons score={10} />);
      const upvoteButton = screen.getByLabelText('Upvote');
      expect(upvoteButton).toBeInTheDocument();
    });

    it('should have proper aria-label on downvote button', () => {
      render(<VoteButtons score={10} />);
      const downvoteButton = screen.getByLabelText('Downvote');
      expect(downvoteButton).toBeInTheDocument();
    });

    it('should be keyboard accessible - upvote with Enter', async () => {
      const user = userEvent.setup();
      const onVote = jest.fn();
      render(<VoteButtons score={10} onVote={onVote} />);

      const upvoteButton = screen.getByLabelText('Upvote');
      upvoteButton.focus();
      await user.keyboard('{Enter}');

      expect(onVote).toHaveBeenCalledWith('up');
    });

    it('should be keyboard accessible - downvote with Enter', async () => {
      const user = userEvent.setup();
      const onVote = jest.fn();
      render(<VoteButtons score={10} onVote={onVote} />);

      const downvoteButton = screen.getByLabelText('Downvote');
      downvoteButton.focus();
      await user.keyboard('{Enter}');

      expect(onVote).toHaveBeenCalledWith('down');
    });

    it('should be keyboard accessible - upvote with Space', async () => {
      const user = userEvent.setup();
      const onVote = jest.fn();
      render(<VoteButtons score={10} onVote={onVote} />);

      const upvoteButton = screen.getByLabelText('Upvote');
      upvoteButton.focus();
      await user.keyboard(' ');

      expect(onVote).toHaveBeenCalledWith('up');
    });

    it('should be keyboard accessible - downvote with Space', async () => {
      const user = userEvent.setup();
      const onVote = jest.fn();
      render(<VoteButtons score={10} onVote={onVote} />);

      const downvoteButton = screen.getByLabelText('Downvote');
      downvoteButton.focus();
      await user.keyboard(' ');

      expect(onVote).toHaveBeenCalledWith('down');
    });

    it('should allow Tab navigation between buttons', async () => {
      const user = userEvent.setup();
      render(<VoteButtons score={10} />);

      const upvoteButton = screen.getByLabelText('Upvote');
      const downvoteButton = screen.getByLabelText('Downvote');

      upvoteButton.focus();
      expect(upvoteButton).toHaveFocus();

      await user.tab();
      expect(downvoteButton).toHaveFocus();
    });

    it('should have tabular-nums for consistent score width', () => {
      render(<VoteButtons score={10} />);
      const score = screen.getByText('10');
      expect(score).toHaveClass('tabular-nums');
    });

    it('should use semantic color indicators for vote state', () => {
      render(<VoteButtons score={10} userVote="up" />);
      const score = screen.getByText('11');
      expect(score).toHaveClass('text-orange-500');
    });
  });

  // ===== REF FORWARDING TESTS =====
  describe('Ref Forwarding', () => {
    it('should forward ref to container element', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<VoteButtons score={10} ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should allow accessing container via ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<VoteButtons score={10} ref={ref} />);
      expect(ref.current?.tagName).toBe('DIV');
    });
  });

  // ===== VOTE SCORE CALCULATION TESTS =====
  describe('Vote Score Calculation', () => {
    it('should maintain original score when no user interaction', () => {
      render(<VoteButtons score={100} userVote={null} />);
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('should display score + 1 when upvoted from neutral', async () => {
      const user = userEvent.setup();
      render(<VoteButtons score={100} userVote={null} />);

      await user.click(screen.getByLabelText('Upvote'));
      expect(screen.getByText('101')).toBeInTheDocument();
    });

    it('should display score - 1 when downvoted from neutral', async () => {
      const user = userEvent.setup();
      render(<VoteButtons score={100} userVote={null} />);

      await user.click(screen.getByLabelText('Downvote'));
      expect(screen.getByText('99')).toBeInTheDocument();
    });

    it('should handle zero score correctly with votes', async () => {
      const user = userEvent.setup();
      render(<VoteButtons score={0} userVote={null} />);

      await user.click(screen.getByLabelText('Upvote'));
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should handle negative scores correctly', async () => {
      const user = userEvent.setup();
      render(<VoteButtons score={-5} userVote={null} />);

      await user.click(screen.getByLabelText('Upvote'));
      expect(screen.getByText('-4')).toBeInTheDocument();
    });

    it('should show existing vote state correctly', () => {
      render(<VoteButtons score={100} userVote="up" />);
      // Score already includes the upvote
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  // ===== COMBINED STATES TESTS =====
  describe('Combined States', () => {
    it('should handle disabled state with active vote', () => {
      render(<VoteButtons score={10} userVote="up" disabled />);
      const upvoteButton = screen.getByLabelText('Upvote');
      expect(upvoteButton).toBeDisabled();
      expect(upvoteButton).toHaveClass('text-orange-500');
    });

    it('should handle compact mode with trending score', () => {
      render(<VoteButtons score={150} compact trendingThreshold={100} />);
      expect(screen.queryByText('150')).not.toBeInTheDocument();
      expect(screen.queryByTestId('trending-up')).not.toBeInTheDocument();
    });

    it('should handle all size variants with both orientations', () => {
      const sizes: Array<'sm' | 'default' | 'lg'> = ['sm', 'default', 'lg'];
      const orientations: Array<'vertical' | 'horizontal'> = ['vertical', 'horizontal'];

      sizes.forEach((size) => {
        orientations.forEach((orientation) => {
          const { unmount } = render(
            <VoteButtons score={10} size={size} orientation={orientation} />
          );
          expect(screen.getByLabelText('Upvote')).toBeInTheDocument();
          unmount();
        });
      });
    });

    it('should handle vertical orientation with all states', () => {
      render(<VoteButtons score={10} orientation="vertical" userVote="up" disabled />);
      const container = screen.getByLabelText('Upvote').closest('div');
      expect(container).toHaveClass('flex-col');
    });

    it('should handle horizontal orientation with large size', () => {
      const { container } = render(
        <VoteButtons score={10} orientation="horizontal" size="lg" />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex-row');
      expect(screen.getByTestId('chevron-up')).toHaveClass('w-6 h-6');
    });
  });

  // ===== SCORE COLOR TESTS =====
  describe('Score Color', () => {
    it('should use orange color when upvoted', async () => {
      const user = userEvent.setup();
      render(<VoteButtons score={10} />);

      await user.click(screen.getByLabelText('Upvote'));
      const score = screen.getByText('11');
      expect(score).toHaveClass('text-orange-500');
    });

    it('should use blue color when downvoted', async () => {
      const user = userEvent.setup();
      render(<VoteButtons score={10} />);

      await user.click(screen.getByLabelText('Downvote'));
      const score = screen.getByText('9');
      expect(score).toHaveClass('text-blue-500');
    });

    it('should use foreground color for positive score when not voted', () => {
      render(<VoteButtons score={10} userVote={null} />);
      const score = screen.getByText('10');
      expect(score).toHaveClass('text-foreground');
    });

    it('should use muted color for zero score when not voted', () => {
      render(<VoteButtons score={0} userVote={null} />);
      const score = screen.getByText('0');
      expect(score).toHaveClass('text-muted-foreground');
    });

    it('should use muted color for negative score when not voted', () => {
      render(<VoteButtons score={-5} userVote={null} />);
      const score = screen.getByText('-5');
      expect(score).toHaveClass('text-muted-foreground');
    });
  });

  // ===== EDGE CASES TESTS =====
  describe('Edge Cases', () => {
    it('should handle very large positive scores', () => {
      render(<VoteButtons score={999999999} />);
      expect(screen.getByText('1000.0M')).toBeInTheDocument();
    });

    it('should handle very large negative scores', () => {
      render(<VoteButtons score={-999999999} />);
      expect(screen.getByText('-1000.0M')).toBeInTheDocument();
    });

    it('should handle rapid vote changes', async () => {
      const user = userEvent.setup({ delay: null });
      const onVote = jest.fn();
      render(<VoteButtons score={10} onVote={onVote} />);

      const upvoteButton = screen.getByLabelText('Upvote');
      const downvoteButton = screen.getByLabelText('Downvote');

      await user.click(upvoteButton);
      jest.advanceTimersByTime(400);
      await user.click(downvoteButton);
      jest.advanceTimersByTime(400);
      await user.click(upvoteButton);

      expect(onVote).toHaveBeenCalledTimes(3);
    });

    it('should maintain state across prop updates', () => {
      const { rerender } = render(<VoteButtons score={10} userVote={null} />);

      rerender(<VoteButtons score={15} userVote={null} />);
      expect(screen.getByText('15')).toBeInTheDocument();

      rerender(<VoteButtons score={15} userVote="up" />);
      const upvoteButton = screen.getByLabelText('Upvote');
      expect(upvoteButton).toHaveClass('text-orange-500');
    });

    it('should handle undefined onVote callback gracefully', async () => {
      const user = userEvent.setup();
      render(<VoteButtons score={10} />);

      const upvoteButton = screen.getByLabelText('Upvote');
      await user.click(upvoteButton);

      // Should still update local state
      expect(screen.getByText('11')).toBeInTheDocument();
    });
  });
});
