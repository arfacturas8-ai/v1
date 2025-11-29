/**
 * Comprehensive Test Suite for CRYB AwardSystem Component
 * Testing award display, selection, giving flow, animations, and accessibility
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { AwardDisplay, AWARDS, AwardType, PostAward } from './AwardSystem';

// Mock dependencies
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

// Mock framer-motion to simplify testing
jest.mock('framer-motion', () => {
  const mockReact = require('react');
  return {
    motion: {
      div: mockReact.forwardRef(({ children, animate, whileHover, whileTap, ...props }: any, ref: any) => (
        <div ref={ref} data-animate={JSON.stringify(animate)} {...props}>
          {children}
        </div>
      )),
      button: mockReact.forwardRef(({ children, animate, whileHover, whileTap, ...props }: any, ref: any) => (
        <button ref={ref} data-animate={JSON.stringify(animate)} {...props}>
          {children}
        </button>
      )),
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Star: ({ className }: any) => <svg data-testid="star-icon" className={className} />,
  Heart: ({ className }: any) => <svg data-testid="heart-icon" className={className} />,
  Zap: ({ className }: any) => <svg data-testid="zap-icon" className={className} />,
  Crown: ({ className }: any) => <svg data-testid="crown-icon" className={className} />,
  Trophy: ({ className }: any) => <svg data-testid="trophy-icon" className={className} />,
  Sparkles: ({ className }: any) => <svg data-testid="sparkles-icon" className={className} />,
  Gift: ({ className }: any) => <svg data-testid="gift-icon" className={className} />,
  X: ({ className }: any) => <svg data-testid="x-icon" className={className} />,
}));

// Mock Button components
jest.mock('../ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  IconButton: React.forwardRef(({ icon, onClick, disabled, className, ...props }: any, ref: any) => (
    <button ref={ref} onClick={onClick} disabled={disabled} className={className} {...props}>
      {icon}
    </button>
  )),
}));

// Mock Card component
jest.mock('../ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
}));

// Mock Radix Dialog
jest.mock('@radix-ui/react-dialog', () => ({
  Root: ({ children, open, onOpenChange }: any) => (
    <div data-testid="dialog-root" data-open={open}>
      {children}
    </div>
  ),
  Trigger: ({ children, asChild, ...props }: any) => (
    <div data-testid="dialog-trigger" {...props}>
      {children}
    </div>
  ),
  Portal: ({ children }: any) => <div data-testid="dialog-portal">{children}</div>,
  Overlay: ({ className }: any) => <div data-testid="dialog-overlay" className={className} />,
  Content: ({ children, className }: any) => (
    <div data-testid="dialog-content" className={className}>
      {children}
    </div>
  ),
  Title: ({ children, className }: any) => (
    <h2 data-testid="dialog-title" className={className}>
      {children}
    </h2>
  ),
  Description: ({ children, className }: any) => (
    <p data-testid="dialog-description" className={className}>
      {children}
    </p>
  ),
  Close: ({ children, asChild, ...props }: any) => (
    <div data-testid="dialog-close" {...props}>
      {children}
    </div>
  ),
}));

describe('AwardSystem Component', () => {
  // ===== AWARDS CONSTANTS TESTS =====
  describe('AWARDS Constants', () => {
    it('should have 6 predefined award types', () => {
      expect(AWARDS).toHaveLength(6);
    });

    it('should have helpful award with correct properties', () => {
      const helpful = AWARDS.find(a => a.id === 'helpful');
      expect(helpful).toBeDefined();
      expect(helpful?.name).toBe('Helpful');
      expect(helpful?.price).toBe(50);
      expect(helpful?.color).toBe('text-yellow-500');
      expect(helpful?.description).toBe('This was really helpful!');
    });

    it('should have love award with correct properties', () => {
      const love = AWARDS.find(a => a.id === 'love');
      expect(love).toBeDefined();
      expect(love?.name).toBe('Love');
      expect(love?.price).toBe(100);
      expect(love?.color).toBe('text-red-500');
    });

    it('should have genius award with correct properties', () => {
      const genius = AWARDS.find(a => a.id === 'genius');
      expect(genius).toBeDefined();
      expect(genius?.name).toBe('Genius');
      expect(genius?.price).toBe(150);
      expect(genius?.color).toBe('text-purple-500');
    });

    it('should have premium award with correct properties', () => {
      const premium = AWARDS.find(a => a.id === 'premium');
      expect(premium).toBeDefined();
      expect(premium?.name).toBe('Premium');
      expect(premium?.price).toBe(300);
      expect(premium?.color).toBe('text-amber-500');
    });

    it('should have legendary award with correct properties', () => {
      const legendary = AWARDS.find(a => a.id === 'legendary');
      expect(legendary).toBeDefined();
      expect(legendary?.name).toBe('Legendary');
      expect(legendary?.price).toBe(500);
      expect(legendary?.color).toBe('text-orange-500');
    });

    it('should have masterpiece award with correct properties', () => {
      const masterpiece = AWARDS.find(a => a.id === 'masterpiece');
      expect(masterpiece).toBeDefined();
      expect(masterpiece?.name).toBe('Masterpiece');
      expect(masterpiece?.price).toBe(1000);
      expect(masterpiece?.color).toBe('text-cyan-500');
    });

    it('should have awards sorted by price ascending', () => {
      const prices = AWARDS.map(a => a.price);
      const sortedPrices = [...prices].sort((a, b) => a - b);
      expect(prices).toEqual(sortedPrices);
    });
  });

  // ===== RENDERING TESTS =====
  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<AwardDisplay awards={[]} />);
      expect(screen.getByLabelText('Give award')).toBeInTheDocument();
    });

    it('should render without award button when showAwardButton is false', () => {
      render(<AwardDisplay awards={[]} showAwardButton={false} />);
      expect(screen.queryByLabelText('Give award')).not.toBeInTheDocument();
    });

    it('should render empty state with no awards', () => {
      render(<AwardDisplay awards={[]} />);
      expect(screen.getByLabelText('Give award')).toBeInTheDocument();
    });

    it('should render with single award', () => {
      const awards: PostAward[] = [{ awardId: 'helpful', count: 1 }];
      render(<AwardDisplay awards={awards} />);
      expect(screen.getByTitle('Helpful (1)')).toBeInTheDocument();
    });

    it('should render with multiple awards', () => {
      const awards: PostAward[] = [
        { awardId: 'helpful', count: 2 },
        { awardId: 'love', count: 3 },
      ];
      render(<AwardDisplay awards={awards} />);
      expect(screen.getByTitle('Helpful (2)')).toBeInTheDocument();
      expect(screen.getByTitle('Love (3)')).toBeInTheDocument();
    });
  });

  // ===== AWARD DISPLAY TESTS =====
  describe('Award Display', () => {
    it('should display award count when count > 1', () => {
      const awards: PostAward[] = [{ awardId: 'helpful', count: 5 }];
      render(<AwardDisplay awards={awards} />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should not display count when count is 1', () => {
      const awards: PostAward[] = [{ awardId: 'helpful', count: 1 }];
      render(<AwardDisplay awards={awards} />);
      const awardElement = screen.getByTitle('Helpful (1)');
      expect(within(awardElement).queryByText('1')).not.toBeInTheDocument();
    });

    it('should display correct icon for each award type', () => {
      const awards: PostAward[] = [
        { awardId: 'helpful', count: 1 },
        { awardId: 'love', count: 1 },
      ];
      render(<AwardDisplay awards={awards} />);
      expect(screen.getByTestId('star-icon')).toBeInTheDocument();
      expect(screen.getByTestId('heart-icon')).toBeInTheDocument();
    });

    it('should apply correct color class to award icon', () => {
      const awards: PostAward[] = [{ awardId: 'helpful', count: 1 }];
      render(<AwardDisplay awards={awards} />);
      const awardElement = screen.getByTitle('Helpful (1)');
      const icon = within(awardElement).getByTestId('star-icon');
      expect(icon.parentElement).toHaveClass('text-yellow-500');
    });

    it('should display awards up to maxDisplay limit', () => {
      const awards: PostAward[] = [
        { awardId: 'helpful', count: 1 },
        { awardId: 'love', count: 1 },
        { awardId: 'genius', count: 1 },
        { awardId: 'premium', count: 1 },
        { awardId: 'legendary', count: 1 },
        { awardId: 'masterpiece', count: 1 },
      ];
      render(<AwardDisplay awards={awards} maxDisplay={3} />);
      expect(screen.getByTitle('Helpful (1)')).toBeInTheDocument();
      expect(screen.getByTitle('Love (1)')).toBeInTheDocument();
      expect(screen.getByTitle('Genius (1)')).toBeInTheDocument();
      expect(screen.queryByTitle('Premium (1)')).not.toBeInTheDocument();
    });

    it('should show remaining count when awards exceed maxDisplay', () => {
      const awards: PostAward[] = [
        { awardId: 'helpful', count: 2 },
        { awardId: 'love', count: 3 },
        { awardId: 'genius', count: 4 },
      ];
      render(<AwardDisplay awards={awards} maxDisplay={2} />);
      expect(screen.getByText('+4')).toBeInTheDocument();
    });

    it('should not show remaining count when all awards fit within maxDisplay', () => {
      const awards: PostAward[] = [
        { awardId: 'helpful', count: 1 },
        { awardId: 'love', count: 1 },
      ];
      render(<AwardDisplay awards={awards} maxDisplay={5} />);
      expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
    });

    it('should handle invalid award IDs gracefully', () => {
      const awards: PostAward[] = [
        { awardId: 'invalid-award', count: 1 },
        { awardId: 'helpful', count: 2 },
      ];
      render(<AwardDisplay awards={awards} />);
      expect(screen.getByTitle('Helpful (2)')).toBeInTheDocument();
    });
  });

  // ===== SIZE VARIANT TESTS =====
  describe('Size Variants', () => {
    it('should render default size icons', () => {
      const awards: PostAward[] = [{ awardId: 'helpful', count: 1 }];
      render(<AwardDisplay awards={awards} size="default" />);
      const icon = screen.getByTestId('star-icon');
      expect(icon).toHaveClass('w-5 h-5');
    });

    it('should render small size icons', () => {
      const awards: PostAward[] = [{ awardId: 'helpful', count: 1 }];
      render(<AwardDisplay awards={awards} size="sm" />);
      const icon = screen.getByTestId('star-icon');
      expect(icon).toHaveClass('w-4 h-4');
    });

    it('should apply correct size to give award button icon', () => {
      render(<AwardDisplay awards={[]} size="sm" />);
      const giftIcon = screen.getByTestId('gift-icon');
      expect(giftIcon).toHaveClass('w-4 h-4');
    });
  });

  // ===== GIVE AWARD DIALOG TESTS =====
  describe('Give Award Dialog', () => {
    it('should not show dialog initially', () => {
      render(<AwardDisplay awards={[]} userCoins={100} />);
      const dialogContent = screen.queryByTestId('dialog-content');
      expect(dialogContent).not.toBeInTheDocument();
    });

    it('should open dialog when give award button is clicked', async () => {
      const user = userEvent.setup();
      render(<AwardDisplay awards={[]} userCoins={100} />);

      const giveAwardButton = screen.getByLabelText('Give award');
      await user.click(giveAwardButton);

      await waitFor(() => {
        expect(screen.getByTestId('dialog-title')).toHaveTextContent('Give Award');
      });
    });

    it('should show dialog description', async () => {
      const user = userEvent.setup();
      render(<AwardDisplay awards={[]} userCoins={100} />);

      const giveAwardButton = screen.getByLabelText('Give award');
      await user.click(giveAwardButton);

      await waitFor(() => {
        expect(screen.getByTestId('dialog-description')).toHaveTextContent(
          'Show your appreciation with an award'
        );
      });
    });

    it('should display close button in dialog', async () => {
      const user = userEvent.setup();
      render(<AwardDisplay awards={[]} userCoins={100} />);

      const giveAwardButton = screen.getByLabelText('Give award');
      await user.click(giveAwardButton);

      await waitFor(() => {
        expect(screen.getByTestId('x-icon')).toBeInTheDocument();
      });
    });

    it('should display all available awards in dialog', async () => {
      const user = userEvent.setup();
      render(<AwardDisplay awards={[]} userCoins={10000} />);

      await user.click(screen.getByLabelText('Give award'));

      await waitFor(() => {
        expect(screen.getByText('Helpful')).toBeInTheDocument();
        expect(screen.getByText('Love')).toBeInTheDocument();
        expect(screen.getByText('Genius')).toBeInTheDocument();
        expect(screen.getByText('Premium')).toBeInTheDocument();
        expect(screen.getByText('Legendary')).toBeInTheDocument();
        expect(screen.getByText('Masterpiece')).toBeInTheDocument();
      });
    });

    it('should display footer message', async () => {
      const user = userEvent.setup();
      render(<AwardDisplay awards={[]} userCoins={100} />);

      await user.click(screen.getByLabelText('Give award'));

      await waitFor(() => {
        expect(screen.getByText('Awards help creators and show your appreciation')).toBeInTheDocument();
      });
    });
  });

  // ===== USER BALANCE/COINS TESTS =====
  describe('User Balance/Coins', () => {
    it('should display user coin balance in dialog', async () => {
      const user = userEvent.setup();
      render(<AwardDisplay awards={[]} userCoins={500} />);

      await user.click(screen.getByLabelText('Give award'));

      await waitFor(() => {
        expect(screen.getByText('500 coins')).toBeInTheDocument();
      });
    });

    it('should display zero coins when userCoins is 0', async () => {
      const user = userEvent.setup();
      render(<AwardDisplay awards={[]} userCoins={0} />);

      await user.click(screen.getByLabelText('Give award'));

      await waitFor(() => {
        expect(screen.getByText('0 coins')).toBeInTheDocument();
      });
    });

    it('should display balance label', async () => {
      const user = userEvent.setup();
      render(<AwardDisplay awards={[]} userCoins={100} />);

      await user.click(screen.getByLabelText('Give award'));

      await waitFor(() => {
        expect(screen.getByText('Your Balance')).toBeInTheDocument();
      });
    });

    it('should show sparkles icon in balance section', async () => {
      const user = userEvent.setup();
      render(<AwardDisplay awards={[]} userCoins={100} />);

      await user.click(screen.getByLabelText('Give award'));

      await waitFor(() => {
        const sparklesIcons = screen.getAllByTestId('sparkles-icon');
        expect(sparklesIcons.length).toBeGreaterThan(0);
      });
    });
  });

  // ===== AWARD COST DISPLAY TESTS =====
  describe('Award Cost Display', () => {
    it('should display award prices in dialog', async () => {
      const user = userEvent.setup();
      render(<AwardDisplay awards={[]} userCoins={10000} />);

      await user.click(screen.getByLabelText('Give award'));

      await waitFor(() => {
        expect(screen.getByText('50')).toBeInTheDocument(); // Helpful
        expect(screen.getByText('100')).toBeInTheDocument(); // Love
        expect(screen.getByText('150')).toBeInTheDocument(); // Genius
        expect(screen.getByText('300')).toBeInTheDocument(); // Premium
        expect(screen.getByText('500')).toBeInTheDocument(); // Legendary
        expect(screen.getByText('1000')).toBeInTheDocument(); // Masterpiece
      });
    });

    it('should display award descriptions', async () => {
      const user = userEvent.setup();
      render(<AwardDisplay awards={[]} userCoins={10000} />);

      await user.click(screen.getByLabelText('Give award'));

      await waitFor(() => {
        expect(screen.getByText('This was really helpful!')).toBeInTheDocument();
        expect(screen.getByText('I love this post!')).toBeInTheDocument();
        expect(screen.getByText('Pure genius!')).toBeInTheDocument();
      });
    });
  });

  // ===== AWARD AFFORDABILITY TESTS =====
  describe('Award Affordability', () => {
    it('should enable affordable awards', async () => {
      const user = userEvent.setup();
      render(<AwardDisplay awards={[]} userCoins={200} />);

      await user.click(screen.getByLabelText('Give award'));

      await waitFor(() => {
        const helpfulButton = screen.getByText('Helpful').closest('button');
        expect(helpfulButton).not.toBeDisabled();
      });
    });

    it('should disable awards user cannot afford', async () => {
      const user = userEvent.setup();
      render(<AwardDisplay awards={[]} userCoins={50} />);

      await user.click(screen.getByLabelText('Give award'));

      await waitFor(() => {
        const loveButton = screen.getByText('Love').closest('button');
        expect(loveButton).toBeDisabled();
      });
    });

    it('should apply opacity to unaffordable awards', async () => {
      const user = userEvent.setup();
      render(<AwardDisplay awards={[]} userCoins={50} />);

      await user.click(screen.getByLabelText('Give award'));

      await waitFor(() => {
        const loveButton = screen.getByText('Love').closest('button');
        expect(loveButton).toHaveClass('opacity-50');
      });
    });

    it('should apply cursor-not-allowed to unaffordable awards', async () => {
      const user = userEvent.setup();
      render(<AwardDisplay awards={[]} userCoins={50} />);

      await user.click(screen.getByLabelText('Give award'));

      await waitFor(() => {
        const loveButton = screen.getByText('Love').closest('button');
        expect(loveButton).toHaveClass('cursor-not-allowed');
      });
    });

    it('should enable award when user has exact amount', async () => {
      const user = userEvent.setup();
      render(<AwardDisplay awards={[]} userCoins={100} />);

      await user.click(screen.getByLabelText('Give award'));

      await waitFor(() => {
        const loveButton = screen.getByText('Love').closest('button');
        expect(loveButton).not.toBeDisabled();
      });
    });
  });

  // ===== AWARD SELECTION TESTS =====
  describe('Award Selection', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('should call onAward when affordable award is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      const onAward = jest.fn();
      render(<AwardDisplay awards={[]} userCoins={200} onAward={onAward} />);

      await user.click(screen.getByLabelText('Give award'));

      await waitFor(() => {
        expect(screen.getByText('Helpful')).toBeInTheDocument();
      });

      const helpfulButton = screen.getByText('Helpful').closest('button');
      await user.click(helpfulButton!);

      // Fast-forward the timeout
      jest.advanceTimersByTime(500);

      expect(onAward).toHaveBeenCalledWith('helpful');
    });

    it('should not call onAward when unaffordable award is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      const onAward = jest.fn();
      render(<AwardDisplay awards={[]} userCoins={50} onAward={onAward} />);

      await user.click(screen.getByLabelText('Give award'));

      await waitFor(() => {
        expect(screen.getByText('Love')).toBeInTheDocument();
      });

      const loveButton = screen.getByText('Love').closest('button');
      await user.click(loveButton!);

      jest.advanceTimersByTime(500);

      expect(onAward).not.toHaveBeenCalled();
    });

    it('should handle onAward not provided', async () => {
      const user = userEvent.setup({ delay: null });
      render(<AwardDisplay awards={[]} userCoins={200} />);

      await user.click(screen.getByLabelText('Give award'));

      await waitFor(() => {
        expect(screen.getByText('Helpful')).toBeInTheDocument();
      });

      const helpfulButton = screen.getByText('Helpful').closest('button');
      await user.click(helpfulButton!);

      // Should not throw error
      jest.advanceTimersByTime(500);
    });

    it('should call onAward with correct award ID for each award', async () => {
      const user = userEvent.setup({ delay: null });
      const onAward = jest.fn();
      render(<AwardDisplay awards={[]} userCoins={10000} onAward={onAward} />);

      await user.click(screen.getByLabelText('Give award'));

      await waitFor(() => {
        expect(screen.getByText('Genius')).toBeInTheDocument();
      });

      const geniusButton = screen.getByText('Genius').closest('button');
      await user.click(geniusButton!);

      jest.advanceTimersByTime(500);

      expect(onAward).toHaveBeenCalledWith('genius');
    });
  });

  // ===== AWARD CONFIRMATION/ANIMATION TESTS =====
  describe('Award Confirmation/Animation', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('should show selected state when award is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      const onAward = jest.fn();
      render(<AwardDisplay awards={[]} userCoins={200} onAward={onAward} />);

      await user.click(screen.getByLabelText('Give award'));

      await waitFor(() => {
        expect(screen.getByText('Helpful')).toBeInTheDocument();
      });

      const helpfulButton = screen.getByText('Helpful').closest('button');
      await user.click(helpfulButton!);

      expect(helpfulButton).toHaveClass('border-primary');
    });

    it('should show checkmark icon when award is selected', async () => {
      const user = userEvent.setup({ delay: null });
      const onAward = jest.fn();
      render(<AwardDisplay awards={[]} userCoins={200} onAward={onAward} />);

      await user.click(screen.getByLabelText('Give award'));

      await waitFor(() => {
        expect(screen.getByText('Helpful')).toBeInTheDocument();
      });

      const helpfulButton = screen.getByText('Helpful').closest('button');
      await user.click(helpfulButton!);

      // Check for SVG checkmark path
      const checkmark = helpfulButton!.querySelector('path[d="M5 13l4 4L19 7"]');
      expect(checkmark).toBeInTheDocument();
    });

    it('should clear selected state after timeout', async () => {
      const user = userEvent.setup({ delay: null });
      const onAward = jest.fn();
      render(<AwardDisplay awards={[]} userCoins={200} onAward={onAward} />);

      await user.click(screen.getByLabelText('Give award'));

      await waitFor(() => {
        expect(screen.getByText('Helpful')).toBeInTheDocument();
      });

      const helpfulButton = screen.getByText('Helpful').closest('button');
      await user.click(helpfulButton!);

      // Award should be selected
      expect(helpfulButton).toHaveClass('border-primary');

      // Fast-forward past the timeout
      jest.advanceTimersByTime(500);

      // Selected state should be cleared (onAward called and state reset)
      expect(onAward).toHaveBeenCalled();
    });
  });

  // ===== AWARD TYPES TESTS =====
  describe('Award Types', () => {
    it('should display gold-tier awards (premium, legendary, masterpiece)', async () => {
      const user = userEvent.setup();
      render(<AwardDisplay awards={[]} userCoins={10000} />);

      await user.click(screen.getByLabelText('Give award'));

      await waitFor(() => {
        expect(screen.getByText('Premium')).toBeInTheDocument();
        expect(screen.getByText('Legendary')).toBeInTheDocument();
        expect(screen.getByText('Masterpiece')).toBeInTheDocument();
      });
    });

    it('should display silver-tier awards (love, genius)', async () => {
      const user = userEvent.setup();
      render(<AwardDisplay awards={[]} userCoins={10000} />);

      await user.click(screen.getByLabelText('Give award'));

      await waitFor(() => {
        expect(screen.getByText('Love')).toBeInTheDocument();
        expect(screen.getByText('Genius')).toBeInTheDocument();
      });
    });

    it('should display bronze-tier awards (helpful)', async () => {
      const user = userEvent.setup();
      render(<AwardDisplay awards={[]} userCoins={10000} />);

      await user.click(screen.getByLabelText('Give award'));

      await waitFor(() => {
        expect(screen.getByText('Helpful')).toBeInTheDocument();
      });
    });

    it('should display unique icon for each award type', async () => {
      const user = userEvent.setup();
      render(<AwardDisplay awards={[]} userCoins={10000} />);

      await user.click(screen.getByLabelText('Give award'));

      await waitFor(() => {
        expect(screen.getByTestId('crown-icon')).toBeInTheDocument(); // Premium
        expect(screen.getByTestId('trophy-icon')).toBeInTheDocument(); // Legendary
        expect(screen.getByTestId('zap-icon')).toBeInTheDocument(); // Genius
      });
    });
  });

  // ===== ACCESSIBILITY TESTS =====
  describe('Accessibility', () => {
    it('should have aria-label on give award button', () => {
      render(<AwardDisplay awards={[]} userCoins={100} />);
      expect(screen.getByLabelText('Give award')).toBeInTheDocument();
    });

    it('should have aria-label on close button', async () => {
      const user = userEvent.setup();
      render(<AwardDisplay awards={[]} userCoins={100} />);

      await user.click(screen.getByLabelText('Give award'));

      await waitFor(() => {
        expect(screen.getByLabelText('Close')).toBeInTheDocument();
      });
    });

    it('should have descriptive title on award displays', () => {
      const awards: PostAward[] = [{ awardId: 'helpful', count: 3 }];
      render(<AwardDisplay awards={awards} />);
      expect(screen.getByTitle('Helpful (3)')).toBeInTheDocument();
    });

    it('should be keyboard accessible - open dialog with Enter', async () => {
      const user = userEvent.setup();
      render(<AwardDisplay awards={[]} userCoins={100} />);

      const giveAwardButton = screen.getByLabelText('Give award');
      giveAwardButton.focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByTestId('dialog-title')).toBeInTheDocument();
      });
    });

    it('should be keyboard accessible - open dialog with Space', async () => {
      const user = userEvent.setup();
      render(<AwardDisplay awards={[]} userCoins={100} />);

      const giveAwardButton = screen.getByLabelText('Give award');
      giveAwardButton.focus();
      await user.keyboard(' ');

      await waitFor(() => {
        expect(screen.getByTestId('dialog-title')).toBeInTheDocument();
      });
    });

    it('should be keyboard accessible - select award with Enter', async () => {
      const user = userEvent.setup({ delay: null });
      const onAward = jest.fn();
      render(<AwardDisplay awards={[]} userCoins={200} onAward={onAward} />);

      await user.click(screen.getByLabelText('Give award'));

      await waitFor(() => {
        expect(screen.getByText('Helpful')).toBeInTheDocument();
      });

      const helpfulButton = screen.getByText('Helpful').closest('button');
      helpfulButton!.focus();
      await user.keyboard('{Enter}');

      jest.useFakeTimers();
      jest.advanceTimersByTime(500);

      expect(onAward).toHaveBeenCalledWith('helpful');
      jest.useRealTimers();
    });

    it('should have semantic HTML structure', async () => {
      const user = userEvent.setup();
      render(<AwardDisplay awards={[]} userCoins={100} />);

      await user.click(screen.getByLabelText('Give award'));

      await waitFor(() => {
        const title = screen.getByTestId('dialog-title');
        expect(title.tagName).toBe('H2');
      });
    });

    it('should have descriptive dialog title', async () => {
      const user = userEvent.setup();
      render(<AwardDisplay awards={[]} userCoins={100} />);

      await user.click(screen.getByLabelText('Give award'));

      await waitFor(() => {
        expect(screen.getByText('Give Award')).toBeInTheDocument();
      });
    });

    it('should have descriptive dialog description', async () => {
      const user = userEvent.setup();
      render(<AwardDisplay awards={[]} userCoins={100} />);

      await user.click(screen.getByLabelText('Give award'));

      await waitFor(() => {
        const description = screen.getByTestId('dialog-description');
        expect(description).toHaveTextContent('Show your appreciation with an award');
      });
    });
  });

  // ===== ERROR HANDLING TESTS =====
  describe('Error Handling', () => {
    it('should handle empty awards array', () => {
      render(<AwardDisplay awards={[]} />);
      expect(screen.getByLabelText('Give award')).toBeInTheDocument();
    });

    it('should handle undefined awards prop gracefully', () => {
      render(<AwardDisplay awards={undefined as any} />);
      expect(screen.getByLabelText('Give award')).toBeInTheDocument();
    });

    it('should handle negative userCoins', async () => {
      const user = userEvent.setup();
      render(<AwardDisplay awards={[]} userCoins={-100} />);

      await user.click(screen.getByLabelText('Give award'));

      await waitFor(() => {
        expect(screen.getByText('-100 coins')).toBeInTheDocument();
      });
    });

    it('should handle very large userCoins', async () => {
      const user = userEvent.setup();
      render(<AwardDisplay awards={[]} userCoins={999999999} />);

      await user.click(screen.getByLabelText('Give award'));

      await waitFor(() => {
        expect(screen.getByText('999999999 coins')).toBeInTheDocument();
      });
    });

    it('should handle invalid award ID in awards array', () => {
      const awards: PostAward[] = [
        { awardId: 'non-existent-award', count: 5 },
      ];
      const { container } = render(<AwardDisplay awards={awards} />);
      // Should not render the invalid award
      expect(container.querySelector('[title*="non-existent-award"]')).not.toBeInTheDocument();
    });

    it('should handle award with zero count', () => {
      const awards: PostAward[] = [{ awardId: 'helpful', count: 0 }];
      render(<AwardDisplay awards={awards} />);
      // Award should still render but with count 0
      const awardElement = screen.getByTitle('Helpful (0)');
      expect(awardElement).toBeInTheDocument();
    });

    it('should handle award with negative count', () => {
      const awards: PostAward[] = [{ awardId: 'helpful', count: -5 }];
      render(<AwardDisplay awards={awards} />);
      expect(screen.getByTitle('Helpful (-5)')).toBeInTheDocument();
    });
  });

  // ===== INTEGRATION TESTS =====
  describe('Integration Tests', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('should complete full award giving flow', async () => {
      const user = userEvent.setup({ delay: null });
      const onAward = jest.fn();
      const awards: PostAward[] = [{ awardId: 'helpful', count: 3 }];

      render(<AwardDisplay awards={awards} userCoins={500} onAward={onAward} />);

      // Step 1: Awards are displayed
      expect(screen.getByTitle('Helpful (3)')).toBeInTheDocument();

      // Step 2: Open award dialog
      await user.click(screen.getByLabelText('Give award'));

      // Step 3: Dialog is shown with user balance
      await waitFor(() => {
        expect(screen.getByText('500 coins')).toBeInTheDocument();
      });

      // Step 4: Select an award
      const loveButton = screen.getByText('Love').closest('button');
      await user.click(loveButton!);

      // Step 5: Award is selected with animation
      expect(loveButton).toHaveClass('border-primary');

      // Step 6: After timeout, onAward is called
      jest.advanceTimersByTime(500);
      expect(onAward).toHaveBeenCalledWith('love');
    });

    it('should handle multiple award selections', async () => {
      const user = userEvent.setup({ delay: null });
      const onAward = jest.fn();

      render(<AwardDisplay awards={[]} userCoins={1000} onAward={onAward} />);

      // First award
      await user.click(screen.getByLabelText('Give award'));
      await waitFor(() => expect(screen.getByText('Helpful')).toBeInTheDocument());

      const helpfulButton = screen.getByText('Helpful').closest('button');
      await user.click(helpfulButton!);
      jest.advanceTimersByTime(500);

      expect(onAward).toHaveBeenCalledWith('helpful');

      // Second award (simulate reopening dialog)
      onAward.mockClear();
      const { rerender } = render(<AwardDisplay awards={[]} userCoins={950} onAward={onAward} />);

      await user.click(screen.getByLabelText('Give award'));
      await waitFor(() => expect(screen.getByText('Love')).toBeInTheDocument());

      const loveButton = screen.getByText('Love').closest('button');
      await user.click(loveButton!);
      jest.advanceTimersByTime(500);

      expect(onAward).toHaveBeenCalledWith('love');
    });

    it('should prevent giving award when insufficient coins', async () => {
      const user = userEvent.setup({ delay: null });
      const onAward = jest.fn();

      render(<AwardDisplay awards={[]} userCoins={25} onAward={onAward} />);

      await user.click(screen.getByLabelText('Give award'));

      await waitFor(() => {
        expect(screen.getByText('Helpful')).toBeInTheDocument();
      });

      // Try to click Helpful (costs 50, but user has 25)
      const helpfulButton = screen.getByText('Helpful').closest('button');
      expect(helpfulButton).toBeDisabled();

      await user.click(helpfulButton!);
      jest.advanceTimersByTime(500);

      expect(onAward).not.toHaveBeenCalled();
    });
  });

  // ===== MAXDISPLAY EDGE CASES =====
  describe('MaxDisplay Edge Cases', () => {
    it('should handle maxDisplay of 0', () => {
      const awards: PostAward[] = [
        { awardId: 'helpful', count: 1 },
        { awardId: 'love', count: 2 },
      ];
      render(<AwardDisplay awards={awards} maxDisplay={0} />);
      expect(screen.queryByTitle('Helpful (1)')).not.toBeInTheDocument();
      expect(screen.getByText('+3')).toBeInTheDocument();
    });

    it('should handle maxDisplay larger than awards array', () => {
      const awards: PostAward[] = [
        { awardId: 'helpful', count: 1 },
        { awardId: 'love', count: 2 },
      ];
      render(<AwardDisplay awards={awards} maxDisplay={10} />);
      expect(screen.getByTitle('Helpful (1)')).toBeInTheDocument();
      expect(screen.getByTitle('Love (2)')).toBeInTheDocument();
      expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
    });

    it('should use default maxDisplay of 5', () => {
      const awards: PostAward[] = [
        { awardId: 'helpful', count: 1 },
        { awardId: 'love', count: 1 },
        { awardId: 'genius', count: 1 },
        { awardId: 'premium', count: 1 },
        { awardId: 'legendary', count: 1 },
        { awardId: 'masterpiece', count: 1 },
      ];
      render(<AwardDisplay awards={awards} />);

      // First 5 should be visible
      expect(screen.getByTitle('Helpful (1)')).toBeInTheDocument();
      expect(screen.getByTitle('Love (1)')).toBeInTheDocument();
      expect(screen.getByTitle('Genius (1)')).toBeInTheDocument();
      expect(screen.getByTitle('Premium (1)')).toBeInTheDocument();
      expect(screen.getByTitle('Legendary (1)')).toBeInTheDocument();

      // 6th should not be visible
      expect(screen.queryByTitle('Masterpiece (1)')).not.toBeInTheDocument();
      expect(screen.getByText('+1')).toBeInTheDocument();
    });
  });

  // ===== COMPONENT DISPLAY NAME TESTS =====
  describe('Component Properties', () => {
    it('should have correct displayName', () => {
      expect(AwardDisplay.displayName).toBe('AwardDisplay');
    });
  });
});
