import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  SkeletonBox,
  SkeletonCircle,
  SkeletonText,
  WalletConnectSkeleton,
  TokenBalanceSkeleton,
  NetworkSwitcherSkeleton,
  GasEstimatorSkeleton,
  TransactionConfirmationSkeleton,
  TransactionHistorySkeleton,
  NFTProfileBadgeSkeleton,
  CryptoTippingSkeleton,
  ComingSoonWrapperSkeleton,
  Web3OperationSkeleton,
  Web3LoadingStates,
} from './Web3Skeletons';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

describe('SkeletonBox', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<SkeletonBox />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with default props', () => {
      const { container } = render(<SkeletonBox />);
      const element = container.firstChild;
      expect(element).toHaveClass('bg-muted/50');
      expect(element).toHaveClass('rounded');
      expect(element).toHaveClass('w-full');
      expect(element).toHaveClass('h-4');
    });

    it('renders as a div element', () => {
      const { container } = render(<SkeletonBox />);
      expect(container.firstChild.tagName).toBe('DIV');
    });
  });

  describe('Width Variants', () => {
    it('renders with custom width', () => {
      const { container } = render(<SkeletonBox width="w-1/2" />);
      expect(container.firstChild).toHaveClass('w-1/2');
    });

    it('renders with w-32 width', () => {
      const { container } = render(<SkeletonBox width="w-32" />);
      expect(container.firstChild).toHaveClass('w-32');
    });

    it('renders with w-64 width', () => {
      const { container } = render(<SkeletonBox width="w-64" />);
      expect(container.firstChild).toHaveClass('w-64');
    });

    it('renders with w-3/4 width', () => {
      const { container } = render(<SkeletonBox width="w-3/4" />);
      expect(container.firstChild).toHaveClass('w-3/4');
    });

    it('renders with w-1/4 width', () => {
      const { container } = render(<SkeletonBox width="w-1/4" />);
      expect(container.firstChild).toHaveClass('w-1/4');
    });
  });

  describe('Height Variants', () => {
    it('renders with custom height', () => {
      const { container } = render(<SkeletonBox height="h-8" />);
      expect(container.firstChild).toHaveClass('h-8');
    });

    it('renders with h-2 height', () => {
      const { container } = render(<SkeletonBox height="h-2" />);
      expect(container.firstChild).toHaveClass('h-2');
    });

    it('renders with h-6 height', () => {
      const { container } = render(<SkeletonBox height="h-6" />);
      expect(container.firstChild).toHaveClass('h-6');
    });

    it('renders with h-12 height', () => {
      const { container } = render(<SkeletonBox height="h-12" />);
      expect(container.firstChild).toHaveClass('h-12');
    });

    it('renders with h-16 height', () => {
      const { container } = render(<SkeletonBox height="h-16" />);
      expect(container.firstChild).toHaveClass('h-16');
    });
  });

  describe('Custom Classes', () => {
    it('accepts additional className', () => {
      const { container } = render(<SkeletonBox className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('merges multiple classes', () => {
      const { container } = render(<SkeletonBox className="class1 class2" />);
      expect(container.firstChild).toHaveClass('class1');
      expect(container.firstChild).toHaveClass('class2');
    });

    it('preserves default classes with custom className', () => {
      const { container } = render(<SkeletonBox className="custom" />);
      expect(container.firstChild).toHaveClass('bg-muted/50');
      expect(container.firstChild).toHaveClass('rounded');
      expect(container.firstChild).toHaveClass('custom');
    });
  });

  describe('Combined Props', () => {
    it('renders with all props combined', () => {
      const { container } = render(
        <SkeletonBox width="w-48" height="h-10" className="my-custom-class" />
      );
      const element = container.firstChild;
      expect(element).toHaveClass('w-48');
      expect(element).toHaveClass('h-10');
      expect(element).toHaveClass('my-custom-class');
      expect(element).toHaveClass('bg-muted/50');
      expect(element).toHaveClass('rounded');
    });
  });
});

describe('SkeletonCircle', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<SkeletonCircle />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with default props', () => {
      const { container } = render(<SkeletonCircle />);
      const element = container.firstChild;
      expect(element).toHaveClass('bg-muted/50');
      expect(element).toHaveClass('rounded-full');
      expect(element).toHaveClass('w-8');
      expect(element).toHaveClass('h-8');
    });

    it('has rounded-full class for circular shape', () => {
      const { container } = render(<SkeletonCircle />);
      expect(container.firstChild).toHaveClass('rounded-full');
    });
  });

  describe('Size Variants', () => {
    it('renders with custom size', () => {
      const { container } = render(<SkeletonCircle size="w-12 h-12" />);
      expect(container.firstChild).toHaveClass('w-12');
      expect(container.firstChild).toHaveClass('h-12');
    });

    it('renders with small size', () => {
      const { container } = render(<SkeletonCircle size="w-4 h-4" />);
      expect(container.firstChild).toHaveClass('w-4');
      expect(container.firstChild).toHaveClass('h-4');
    });

    it('renders with large size', () => {
      const { container } = render(<SkeletonCircle size="w-16 h-16" />);
      expect(container.firstChild).toHaveClass('w-16');
      expect(container.firstChild).toHaveClass('h-16');
    });

    it('renders with extra large size', () => {
      const { container } = render(<SkeletonCircle size="w-24 h-24" />);
      expect(container.firstChild).toHaveClass('w-24');
      expect(container.firstChild).toHaveClass('h-24');
    });
  });

  describe('Custom Classes', () => {
    it('accepts additional className', () => {
      const { container } = render(<SkeletonCircle className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('combines size and className', () => {
      const { container } = render(
        <SkeletonCircle size="w-10 h-10" className="border-2" />
      );
      expect(container.firstChild).toHaveClass('w-10');
      expect(container.firstChild).toHaveClass('h-10');
      expect(container.firstChild).toHaveClass('border-2');
    });
  });
});

describe('SkeletonText', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<SkeletonText />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders single line by default', () => {
      const { container } = render(<SkeletonText />);
      const lines = container.querySelectorAll('.bg-muted\\/50');
      expect(lines).toHaveLength(1);
    });

    it('has animate-pulse class', () => {
      const { container } = render(<SkeletonText />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('has space-y-2 class for spacing', () => {
      const { container } = render(<SkeletonText lines={2} />);
      expect(container.querySelector('.space-y-2')).toBeInTheDocument();
    });
  });

  describe('Multiple Lines', () => {
    it('renders 2 lines', () => {
      const { container } = render(<SkeletonText lines={2} />);
      const lines = container.querySelectorAll('.bg-muted\\/50');
      expect(lines).toHaveLength(2);
    });

    it('renders 3 lines', () => {
      const { container } = render(<SkeletonText lines={3} />);
      const lines = container.querySelectorAll('.bg-muted\\/50');
      expect(lines).toHaveLength(3);
    });

    it('renders 5 lines', () => {
      const { container } = render(<SkeletonText lines={5} />);
      const lines = container.querySelectorAll('.bg-muted\\/50');
      expect(lines).toHaveLength(5);
    });

    it('renders 10 lines', () => {
      const { container } = render(<SkeletonText lines={10} />);
      const lines = container.querySelectorAll('.bg-muted\\/50');
      expect(lines).toHaveLength(10);
    });
  });

  describe('Last Line Width', () => {
    it('last line is shorter when multiple lines', () => {
      const { container } = render(<SkeletonText lines={3} />);
      const lines = container.querySelectorAll('.bg-muted\\/50');
      expect(lines[2]).toHaveClass('w-3/4');
    });

    it('first lines are full width when multiple lines', () => {
      const { container } = render(<SkeletonText lines={3} />);
      const lines = container.querySelectorAll('.bg-muted\\/50');
      expect(lines[0]).toHaveClass('w-full');
      expect(lines[1]).toHaveClass('w-full');
    });

    it('single line is full width', () => {
      const { container } = render(<SkeletonText lines={1} />);
      const line = container.querySelector('.bg-muted\\/50');
      expect(line).toHaveClass('w-full');
      expect(line).not.toHaveClass('w-3/4');
    });
  });

  describe('Custom Classes', () => {
    it('accepts additional className', () => {
      const { container } = render(<SkeletonText className="custom-class" />);
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('preserves space-y-2 with custom className', () => {
      const { container } = render(<SkeletonText className="custom" />);
      const wrapper = container.querySelector('.space-y-2');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass('custom');
    });
  });

  describe('Line Heights', () => {
    it('each line has h-4 height', () => {
      const { container } = render(<SkeletonText lines={3} />);
      const lines = container.querySelectorAll('.bg-muted\\/50');
      lines.forEach(line => {
        expect(line).toHaveClass('h-4');
      });
    });
  });
});

describe('WalletConnectSkeleton', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<WalletConnectSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('has animate-pulse class', () => {
      const { container } = render(<WalletConnectSkeleton />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('renders with default medium size', () => {
      const { container } = render(<WalletConnectSkeleton />);
      const skeleton = container.querySelector('.bg-muted\\/50');
      expect(skeleton).toHaveClass('h-10');
      expect(skeleton).toHaveClass('w-36');
    });
  });

  describe('Size Variants', () => {
    it('renders small size', () => {
      const { container } = render(<WalletConnectSkeleton size="sm" />);
      const skeleton = container.querySelector('.bg-muted\\/50');
      expect(skeleton).toHaveClass('h-8');
      expect(skeleton).toHaveClass('w-32');
    });

    it('renders medium size', () => {
      const { container } = render(<WalletConnectSkeleton size="md" />);
      const skeleton = container.querySelector('.bg-muted\\/50');
      expect(skeleton).toHaveClass('h-10');
      expect(skeleton).toHaveClass('w-36');
    });

    it('renders large size', () => {
      const { container } = render(<WalletConnectSkeleton size="lg" />);
      const skeleton = container.querySelector('.bg-muted\\/50');
      expect(skeleton).toHaveClass('h-12');
      expect(skeleton).toHaveClass('w-40');
    });
  });

  describe('Styling', () => {
    it('has rounded-lg class', () => {
      const { container } = render(<WalletConnectSkeleton />);
      const skeleton = container.querySelector('.bg-muted\\/50');
      expect(skeleton).toHaveClass('rounded-lg');
    });

    it('accepts custom className', () => {
      const { container } = render(<WalletConnectSkeleton className="custom-class" />);
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('combines size with custom className', () => {
      const { container } = render(
        <WalletConnectSkeleton size="lg" className="mt-4" />
      );
      expect(container.querySelector('.mt-4')).toBeInTheDocument();
      const skeleton = container.querySelector('.bg-muted\\/50');
      expect(skeleton).toHaveClass('h-12');
    });
  });
});

describe('TokenBalanceSkeleton', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<TokenBalanceSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('has animate-pulse class', () => {
      const { container } = render(<TokenBalanceSkeleton />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('has border styling', () => {
      const { container } = render(<TokenBalanceSkeleton />);
      const wrapper = container.querySelector('.border-accent-primary\\/20');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass('bg-secondary');
      expect(wrapper).toHaveClass('rounded-lg');
      expect(wrapper).toHaveClass('p-4');
    });
  });

  describe('Structure', () => {
    it('renders header section with icon and text', () => {
      const { container } = render(<TokenBalanceSkeleton />);
      const circles = container.querySelectorAll('.rounded-full');
      expect(circles.length).toBeGreaterThan(0);
    });

    it('renders balance section', () => {
      const { container } = render(<TokenBalanceSkeleton />);
      const boxes = container.querySelectorAll('.bg-muted\\/50');
      expect(boxes.length).toBeGreaterThan(0);
    });

    it('renders token list with 3 items', () => {
      const { container } = render(<TokenBalanceSkeleton />);
      const tokenItems = container.querySelectorAll('.py-2');
      expect(tokenItems).toHaveLength(3);
    });
  });

  describe('USD Display', () => {
    it('shows USD balance by default', () => {
      const { container } = render(<TokenBalanceSkeleton />);
      const boxes = container.querySelectorAll('.bg-muted\\/50');
      // Should have extra box for USD value
      expect(boxes.length).toBeGreaterThan(5);
    });

    it('hides USD balance when showUSD is false', () => {
      const { container } = render(<TokenBalanceSkeleton showUSD={false} />);
      const containerWithUSD = render(<TokenBalanceSkeleton showUSD={true} />);
      const boxesWithoutUSD = container.querySelectorAll('.bg-muted\\/50').length;
      const boxesWithUSD = containerWithUSD.container.querySelectorAll('.bg-muted\\/50').length;
      expect(boxesWithUSD).toBeGreaterThan(boxesWithoutUSD);
    });

    it('renders correctly with showUSD true', () => {
      const { container } = render(<TokenBalanceSkeleton showUSD={true} />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Custom Classes', () => {
    it('accepts custom className', () => {
      const { container } = render(<TokenBalanceSkeleton className="custom-class" />);
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });

  describe('Token List Items', () => {
    it('each token item has circle icon', () => {
      const { container } = render(<TokenBalanceSkeleton />);
      const tokenItems = container.querySelectorAll('.py-2');
      tokenItems.forEach(item => {
        const circle = item.querySelector('.rounded-full');
        expect(circle).toBeInTheDocument();
      });
    });

    it('each token item has balance info', () => {
      const { container } = render(<TokenBalanceSkeleton />);
      const tokenItems = container.querySelectorAll('.py-2');
      tokenItems.forEach(item => {
        const boxes = item.querySelectorAll('.bg-muted\\/50');
        expect(boxes.length).toBeGreaterThan(0);
      });
    });
  });
});

describe('NetworkSwitcherSkeleton', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<NetworkSwitcherSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('has animate-pulse class', () => {
      const { container } = render(<NetworkSwitcherSkeleton />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('renders with default medium size', () => {
      const { container } = render(<NetworkSwitcherSkeleton />);
      const skeleton = container.querySelector('.bg-muted\\/50');
      expect(skeleton).toHaveClass('h-10');
      expect(skeleton).toHaveClass('w-32');
    });
  });

  describe('Size Variants', () => {
    it('renders small size', () => {
      const { container } = render(<NetworkSwitcherSkeleton size="sm" />);
      const skeleton = container.querySelector('.bg-muted\\/50');
      expect(skeleton).toHaveClass('h-8');
      expect(skeleton).toHaveClass('w-28');
    });

    it('renders medium size', () => {
      const { container } = render(<NetworkSwitcherSkeleton size="md" />);
      const skeleton = container.querySelector('.bg-muted\\/50');
      expect(skeleton).toHaveClass('h-10');
      expect(skeleton).toHaveClass('w-32');
    });

    it('renders large size', () => {
      const { container } = render(<NetworkSwitcherSkeleton size="lg" />);
      const skeleton = container.querySelector('.bg-muted\\/50');
      expect(skeleton).toHaveClass('h-12');
      expect(skeleton).toHaveClass('w-36');
    });
  });

  describe('Styling', () => {
    it('has rounded-lg class', () => {
      const { container } = render(<NetworkSwitcherSkeleton />);
      const skeleton = container.querySelector('.bg-muted\\/50');
      expect(skeleton).toHaveClass('rounded-lg');
    });

    it('accepts custom className', () => {
      const { container } = render(<NetworkSwitcherSkeleton className="custom-class" />);
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });
});

describe('GasEstimatorSkeleton', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<GasEstimatorSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('has animate-pulse class', () => {
      const { container } = render(<GasEstimatorSkeleton />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('has proper styling', () => {
      const { container } = render(<GasEstimatorSkeleton />);
      const wrapper = container.querySelector('.border-accent-primary\\/20');
      expect(wrapper).toHaveClass('bg-secondary');
      expect(wrapper).toHaveClass('rounded-lg');
      expect(wrapper).toHaveClass('p-4');
    });
  });

  describe('Structure', () => {
    it('renders header section', () => {
      const { container } = render(<GasEstimatorSkeleton />);
      const circles = container.querySelectorAll('.rounded-full');
      expect(circles.length).toBeGreaterThan(0);
    });

    it('renders network status section', () => {
      const { container } = render(<GasEstimatorSkeleton />);
      const networkStatus = container.querySelector('.bg-muted\\/20');
      expect(networkStatus).toBeInTheDocument();
      expect(networkStatus).toHaveClass('rounded-lg');
      expect(networkStatus).toHaveClass('p-3');
    });

    it('renders 3 gas options', () => {
      const { container } = render(<GasEstimatorSkeleton />);
      const gasOptions = container.querySelectorAll('.border-muted\\/30');
      expect(gasOptions).toHaveLength(3);
    });
  });

  describe('Gas Options', () => {
    it('each option has proper structure', () => {
      const { container } = render(<GasEstimatorSkeleton />);
      const options = container.querySelectorAll('.border-muted\\/30');
      options.forEach(option => {
        expect(option).toHaveClass('rounded-lg');
        expect(option).toHaveClass('p-3');
        const circle = option.querySelector('.rounded-full');
        expect(circle).toBeInTheDocument();
      });
    });

    it('each option has text and amount sections', () => {
      const { container } = render(<GasEstimatorSkeleton />);
      const options = container.querySelectorAll('.border-muted\\/30');
      options.forEach(option => {
        const boxes = option.querySelectorAll('.bg-muted\\/50');
        expect(boxes.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Custom Classes', () => {
    it('accepts custom className', () => {
      const { container } = render(<GasEstimatorSkeleton className="custom-class" />);
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });
});

describe('TransactionConfirmationSkeleton', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<TransactionConfirmationSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders as overlay with backdrop', () => {
      const { container } = render(<TransactionConfirmationSkeleton />);
      const overlay = container.querySelector('.fixed');
      expect(overlay).toHaveClass('inset-0');
      expect(overlay).toHaveClass('bg-black\\/50');
      expect(overlay).toHaveClass('backdrop-blur-sm');
      expect(overlay).toHaveClass('z-50');
    });

    it('has animate-pulse class', () => {
      const { container } = render(<TransactionConfirmationSkeleton />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('Structure', () => {
    it('renders modal with proper styling', () => {
      const { container } = render(<TransactionConfirmationSkeleton />);
      const modal = container.querySelector('.rounded-xl');
      expect(modal).toHaveClass('bg-secondary');
      expect(modal).toHaveClass('border-accent-primary\\/20');
      expect(modal).toHaveClass('max-w-md');
    });

    it('renders header section', () => {
      const { container } = render(<TransactionConfirmationSkeleton />);
      const header = container.querySelector('.border-b');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('p-6');
    });

    it('renders content section', () => {
      const { container } = render(<TransactionConfirmationSkeleton />);
      const sections = container.querySelectorAll('.bg-muted\\/30');
      expect(sections.length).toBeGreaterThan(0);
    });

    it('renders actions section', () => {
      const { container } = render(<TransactionConfirmationSkeleton />);
      const actions = container.querySelector('.border-t');
      expect(actions).toBeInTheDocument();
      expect(actions).toHaveClass('p-6');
    });
  });

  describe('Content Sections', () => {
    it('renders amount section', () => {
      const { container } = render(<TransactionConfirmationSkeleton />);
      const sections = container.querySelectorAll('.bg-muted\\/30');
      expect(sections.length).toBeGreaterThanOrEqual(3);
    });

    it('renders gas fee section', () => {
      const { container } = render(<TransactionConfirmationSkeleton />);
      const sections = container.querySelectorAll('.bg-muted\\/30');
      expect(sections.length).toBeGreaterThan(1);
    });

    it('renders progress section with progress bar', () => {
      const { container } = render(<TransactionConfirmationSkeleton />);
      const progressBar = container.querySelector('.bg-muted\\/50.rounded-full.h-2');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('renders two action buttons', () => {
      const { container } = render(<TransactionConfirmationSkeleton />);
      const actions = container.querySelector('.border-t');
      const buttons = actions.querySelectorAll('.flex-1');
      expect(buttons).toHaveLength(2);
    });
  });

  describe('Custom Classes', () => {
    it('accepts custom className', () => {
      const { container } = render(<TransactionConfirmationSkeleton className="custom-class" />);
      const overlay = container.querySelector('.fixed');
      expect(overlay).toHaveClass('custom-class');
    });
  });

  describe('Accessibility', () => {
    it('centers modal on screen', () => {
      const { container } = render(<TransactionConfirmationSkeleton />);
      const overlay = container.querySelector('.fixed');
      expect(overlay).toHaveClass('flex');
      expect(overlay).toHaveClass('items-center');
      expect(overlay).toHaveClass('justify-center');
    });
  });
});

describe('TransactionHistorySkeleton', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<TransactionHistorySkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('has animate-pulse class', () => {
      const { container } = render(<TransactionHistorySkeleton />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('has proper styling', () => {
      const { container } = render(<TransactionHistorySkeleton />);
      const wrapper = container.querySelector('.border-accent-primary\\/20');
      expect(wrapper).toHaveClass('bg-secondary');
      expect(wrapper).toHaveClass('rounded-lg');
    });
  });

  describe('Item Count', () => {
    it('renders default 5 items', () => {
      const { container } = render(<TransactionHistorySkeleton />);
      const items = container.querySelectorAll('.divide-y > div');
      expect(items).toHaveLength(5);
    });

    it('renders custom item count - 3 items', () => {
      const { container } = render(<TransactionHistorySkeleton itemCount={3} />);
      const items = container.querySelectorAll('.divide-y > div');
      expect(items).toHaveLength(3);
    });

    it('renders custom item count - 10 items', () => {
      const { container } = render(<TransactionHistorySkeleton itemCount={10} />);
      const items = container.querySelectorAll('.divide-y > div');
      expect(items).toHaveLength(10);
    });

    it('renders custom item count - 1 item', () => {
      const { container } = render(<TransactionHistorySkeleton itemCount={1} />);
      const items = container.querySelectorAll('.divide-y > div');
      expect(items).toHaveLength(1);
    });

    it('renders custom item count - 20 items', () => {
      const { container } = render(<TransactionHistorySkeleton itemCount={20} />);
      const items = container.querySelectorAll('.divide-y > div');
      expect(items).toHaveLength(20);
    });
  });

  describe('Header Structure', () => {
    it('renders header with title area', () => {
      const { container } = render(<TransactionHistorySkeleton />);
      const header = container.querySelector('.border-b');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('p-6');
    });

    it('renders search bar', () => {
      const { container } = render(<TransactionHistorySkeleton />);
      const searchBar = container.querySelector('div[class*="w-full"][class*="h-10"]');
      expect(searchBar).toBeInTheDocument();
    });

    it('renders 4 filter buttons', () => {
      const { container } = render(<TransactionHistorySkeleton />);
      const filters = container.querySelector('.grid-cols-2');
      const filterButtons = filters.querySelectorAll('.h-9');
      expect(filterButtons).toHaveLength(4);
    });
  });

  describe('Transaction Items', () => {
    it('each item has icon', () => {
      const { container } = render(<TransactionHistorySkeleton />);
      const items = container.querySelectorAll('.divide-y > div');
      items.forEach(item => {
        const icon = item.querySelector('.w-10.h-10');
        expect(icon).toBeInTheDocument();
      });
    });

    it('each item has info section', () => {
      const { container } = render(<TransactionHistorySkeleton />);
      const items = container.querySelectorAll('.divide-y > div');
      items.forEach(item => {
        const info = item.querySelector('.flex-1');
        expect(info).toBeInTheDocument();
      });
    });

    it('each item has amount section', () => {
      const { container } = render(<TransactionHistorySkeleton />);
      const items = container.querySelectorAll('.divide-y > div');
      items.forEach(item => {
        const amount = item.querySelector('.text-right');
        expect(amount).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('renders pagination section', () => {
      const { container } = render(<TransactionHistorySkeleton />);
      const pagination = container.querySelectorAll('.border-t')[1];
      expect(pagination).toBeInTheDocument();
      expect(pagination).toHaveClass('p-4');
    });

    it('pagination has navigation controls', () => {
      const { container } = render(<TransactionHistorySkeleton />);
      const pagination = container.querySelectorAll('.border-t')[1];
      const controls = pagination.querySelectorAll('.h-8');
      expect(controls.length).toBeGreaterThan(0);
    });
  });

  describe('Custom Classes', () => {
    it('accepts custom className', () => {
      const { container } = render(<TransactionHistorySkeleton className="custom-class" />);
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });
});

describe('NFTProfileBadgeSkeleton', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<NFTProfileBadgeSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('has animate-pulse class', () => {
      const { container } = render(<NFTProfileBadgeSkeleton />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('renders with default medium size', () => {
      const { container } = render(<NFTProfileBadgeSkeleton />);
      const badge = container.querySelector('.rounded-lg');
      expect(badge).toHaveClass('w-12');
      expect(badge).toHaveClass('h-12');
    });
  });

  describe('Size Variants', () => {
    it('renders small size', () => {
      const { container } = render(<NFTProfileBadgeSkeleton size="sm" />);
      const badge = container.querySelector('.rounded-lg');
      expect(badge).toHaveClass('w-8');
      expect(badge).toHaveClass('h-8');
    });

    it('renders medium size', () => {
      const { container } = render(<NFTProfileBadgeSkeleton size="md" />);
      const badge = container.querySelector('.rounded-lg');
      expect(badge).toHaveClass('w-12');
      expect(badge).toHaveClass('h-12');
    });

    it('renders large size', () => {
      const { container } = render(<NFTProfileBadgeSkeleton size="lg" />);
      const badge = container.querySelector('.rounded-lg');
      expect(badge).toHaveClass('w-16');
      expect(badge).toHaveClass('h-16');
    });
  });

  describe('Badge Structure', () => {
    it('has relative positioning', () => {
      const { container } = render(<NFTProfileBadgeSkeleton />);
      const wrapper = container.querySelector('.relative');
      expect(wrapper).toBeInTheDocument();
    });

    it('renders notification badge indicator', () => {
      const { container } = render(<NFTProfileBadgeSkeleton />);
      const indicator = container.querySelector('.absolute');
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveClass('-top-1');
      expect(indicator).toHaveClass('-right-1');
      expect(indicator).toHaveClass('w-4');
      expect(indicator).toHaveClass('h-4');
      expect(indicator).toHaveClass('rounded-full');
    });
  });

  describe('Custom Classes', () => {
    it('accepts custom className', () => {
      const { container } = render(<NFTProfileBadgeSkeleton className="custom-class" />);
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('combines size with custom className', () => {
      const { container } = render(
        <NFTProfileBadgeSkeleton size="lg" className="mx-auto" />
      );
      expect(container.querySelector('.mx-auto')).toBeInTheDocument();
      const badge = container.querySelector('.rounded-lg');
      expect(badge).toHaveClass('w-16');
    });
  });
});

describe('CryptoTippingSkeleton', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<CryptoTippingSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('has animate-pulse class', () => {
      const { container } = render(<CryptoTippingSkeleton />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('has proper styling', () => {
      const { container } = render(<CryptoTippingSkeleton />);
      const wrapper = container.querySelector('.border-accent-primary\\/20');
      expect(wrapper).toHaveClass('bg-secondary');
      expect(wrapper).toHaveClass('rounded-lg');
      expect(wrapper).toHaveClass('p-4');
    });
  });

  describe('Structure', () => {
    it('renders header section', () => {
      const { container } = render(<CryptoTippingSkeleton />);
      const circles = container.querySelectorAll('.rounded-full');
      expect(circles.length).toBeGreaterThan(0);
    });

    it('renders 6 amount buttons', () => {
      const { container } = render(<CryptoTippingSkeleton />);
      const grid = container.querySelector('.grid-cols-3');
      const buttons = grid.querySelectorAll('.h-10');
      expect(buttons).toHaveLength(6);
    });

    it('renders custom amount input', () => {
      const { container } = render(<CryptoTippingSkeleton />);
      const inputs = container.querySelectorAll('.h-10');
      // 6 amount buttons + 1 custom input + 1 send button
      expect(inputs.length).toBeGreaterThanOrEqual(7);
    });

    it('renders message input', () => {
      const { container } = render(<CryptoTippingSkeleton />);
      const messageInput = container.querySelector('.h-20');
      expect(messageInput).toBeInTheDocument();
      expect(messageInput).toHaveClass('rounded-lg');
    });

    it('renders send button', () => {
      const { container } = render(<CryptoTippingSkeleton />);
      const boxes = container.querySelectorAll('.bg-muted\\/50');
      const lastBox = boxes[boxes.length - 1];
      expect(lastBox).toHaveClass('h-10');
      expect(lastBox).toHaveClass('rounded-lg');
    });
  });

  describe('Amount Buttons Grid', () => {
    it('uses 3-column grid', () => {
      const { container } = render(<CryptoTippingSkeleton />);
      const grid = container.querySelector('.grid-cols-3');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('gap-2');
    });

    it('all buttons have consistent styling', () => {
      const { container } = render(<CryptoTippingSkeleton />);
      const grid = container.querySelector('.grid-cols-3');
      const buttons = grid.querySelectorAll('.h-10');
      buttons.forEach(button => {
        expect(button).toHaveClass('rounded-lg');
        expect(button).toHaveClass('w-full');
      });
    });
  });

  describe('Custom Classes', () => {
    it('accepts custom className', () => {
      const { container } = render(<CryptoTippingSkeleton className="custom-class" />);
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });
});

describe('ComingSoonWrapperSkeleton', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<ComingSoonWrapperSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('has animate-pulse class', () => {
      const { container } = render(<ComingSoonWrapperSkeleton />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('has relative positioning', () => {
      const { container } = render(<ComingSoonWrapperSkeleton />);
      const wrapper = container.querySelector('.relative');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Children Handling', () => {
    it('renders children', () => {
      const { getByText } = render(
        <ComingSoonWrapperSkeleton>
          <div>Test Content</div>
        </ComingSoonWrapperSkeleton>
      );
      expect(getByText('Test Content')).toBeInTheDocument();
    });

    it('makes children semi-transparent', () => {
      const { container } = render(
        <ComingSoonWrapperSkeleton>
          <div>Test</div>
        </ComingSoonWrapperSkeleton>
      );
      const childWrapper = container.querySelector('.opacity-50');
      expect(childWrapper).toBeInTheDocument();
    });

    it('disables pointer events on children', () => {
      const { container } = render(
        <ComingSoonWrapperSkeleton>
          <button>Click me</button>
        </ComingSoonWrapperSkeleton>
      );
      const childWrapper = container.querySelector('.pointer-events-none');
      expect(childWrapper).toBeInTheDocument();
    });

    it('renders multiple children', () => {
      const { getByText } = render(
        <ComingSoonWrapperSkeleton>
          <div>Child 1</div>
          <div>Child 2</div>
        </ComingSoonWrapperSkeleton>
      );
      expect(getByText('Child 1')).toBeInTheDocument();
      expect(getByText('Child 2')).toBeInTheDocument();
    });
  });

  describe('Overlay', () => {
    it('renders overlay with proper styling', () => {
      const { container } = render(<ComingSoonWrapperSkeleton />);
      const overlay = container.querySelector('.absolute.inset-0');
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass('bg-secondary\\/80');
      expect(overlay).toHaveClass('backdrop-blur-sm');
      expect(overlay).toHaveClass('rounded-lg');
    });

    it('centers overlay content', () => {
      const { container } = render(<ComingSoonWrapperSkeleton />);
      const overlay = container.querySelector('.absolute.inset-0');
      expect(overlay).toHaveClass('flex');
      expect(overlay).toHaveClass('items-center');
      expect(overlay).toHaveClass('justify-center');
    });

    it('renders text placeholders in overlay', () => {
      const { container } = render(<ComingSoonWrapperSkeleton />);
      const textBoxes = container.querySelectorAll('.text-center .bg-muted\\/50');
      expect(textBoxes.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Custom Classes', () => {
    it('accepts custom className', () => {
      const { container } = render(<ComingSoonWrapperSkeleton className="custom-class" />);
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('preserves relative positioning with custom className', () => {
      const { container } = render(<ComingSoonWrapperSkeleton className="custom" />);
      const wrapper = container.querySelector('.relative.custom');
      expect(wrapper).toBeInTheDocument();
    });
  });
});

describe('Web3LoadingStates', () => {
  describe('Constants', () => {
    it('exports CONNECTING state', () => {
      expect(Web3LoadingStates.CONNECTING).toBe('Connecting to wallet...');
    });

    it('exports SWITCHING_NETWORK state', () => {
      expect(Web3LoadingStates.SWITCHING_NETWORK).toBe('Switching network...');
    });

    it('exports ESTIMATING_GAS state', () => {
      expect(Web3LoadingStates.ESTIMATING_GAS).toBe('Estimating gas fees...');
    });

    it('exports PREPARING_TRANSACTION state', () => {
      expect(Web3LoadingStates.PREPARING_TRANSACTION).toBe('Preparing transaction...');
    });

    it('exports WAITING_SIGNATURE state', () => {
      expect(Web3LoadingStates.WAITING_SIGNATURE).toBe('Waiting for signature...');
    });

    it('exports BROADCASTING state', () => {
      expect(Web3LoadingStates.BROADCASTING).toBe('Broadcasting transaction...');
    });

    it('exports CONFIRMING state', () => {
      expect(Web3LoadingStates.CONFIRMING).toBe('Waiting for confirmations...');
    });

    it('exports LOADING_BALANCE state', () => {
      expect(Web3LoadingStates.LOADING_BALANCE).toBe('Loading balances...');
    });

    it('exports LOADING_HISTORY state', () => {
      expect(Web3LoadingStates.LOADING_HISTORY).toBe('Loading transaction history...');
    });

    it('exports LOADING_NFTS state', () => {
      expect(Web3LoadingStates.LOADING_NFTS).toBe('Loading NFT collection...');
    });
  });

  describe('State Values', () => {
    it('all states are strings', () => {
      Object.values(Web3LoadingStates).forEach(state => {
        expect(typeof state).toBe('string');
      });
    });

    it('all states end with ellipsis', () => {
      Object.values(Web3LoadingStates).forEach(state => {
        expect(state).toMatch(/\.\.\.$/);
      });
    });

    it('has exactly 10 loading states', () => {
      expect(Object.keys(Web3LoadingStates)).toHaveLength(10);
    });
  });
});

describe('Web3OperationSkeleton', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<Web3OperationSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('has animate-pulse class', () => {
      const { container } = render(<Web3OperationSkeleton />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('has proper styling', () => {
      const { container } = render(<Web3OperationSkeleton />);
      const wrapper = container.querySelector('.border-accent-primary\\/20');
      expect(wrapper).toHaveClass('bg-secondary');
      expect(wrapper).toHaveClass('rounded-lg');
      expect(wrapper).toHaveClass('p-6');
    });
  });

  describe('Loading Icon', () => {
    it('renders loading icon', () => {
      const { container } = render(<Web3OperationSkeleton />);
      const iconWrapper = container.querySelector('.w-12.h-12');
      expect(iconWrapper).toBeInTheDocument();
      expect(iconWrapper).toHaveClass('bg-accent-primary\\/20');
      expect(iconWrapper).toHaveClass('rounded-full');
    });

    it('renders animated ping element', () => {
      const { container } = render(<Web3OperationSkeleton />);
      const ping = container.querySelector('.animate-ping');
      expect(ping).toBeInTheDocument();
      expect(ping).toHaveClass('w-6');
      expect(ping).toHaveClass('h-6');
      expect(ping).toHaveClass('bg-accent-primary\\/40');
    });

    it('centers loading icon', () => {
      const { container } = render(<Web3OperationSkeleton />);
      const iconWrapper = container.querySelector('.w-12.h-12');
      expect(iconWrapper).toHaveClass('mx-auto');
      expect(iconWrapper).toHaveClass('flex');
      expect(iconWrapper).toHaveClass('items-center');
      expect(iconWrapper).toHaveClass('justify-center');
    });
  });

  describe('Operation Text', () => {
    it('renders default operation text', () => {
      const { container } = render(<Web3OperationSkeleton />);
      const textBoxes = container.querySelectorAll('.bg-muted\\/50');
      expect(textBoxes.length).toBeGreaterThan(0);
    });

    it('accepts custom operation text', () => {
      const { container } = render(<Web3OperationSkeleton operation="Custom operation" />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Progress Bar', () => {
    it('hides progress bar by default', () => {
      const { container } = render(<Web3OperationSkeleton />);
      const progressBars = container.querySelectorAll('.rounded-full.h-2');
      // Should only have progress bar if showProgress is true
      expect(progressBars.length).toBeLessThanOrEqual(1);
    });

    it('shows progress bar when showProgress is true', () => {
      const { container } = render(<Web3OperationSkeleton showProgress={true} />);
      const progressBar = container.querySelector('.bg-muted\\/50.rounded-full.h-2');
      expect(progressBar).toBeInTheDocument();
    });

    it('applies progress percentage', () => {
      const { container } = render(
        <Web3OperationSkeleton showProgress={true} progress={50} />
      );
      const progressFill = container.querySelector('.bg-accent-primary.h-2');
      expect(progressFill).toBeInTheDocument();
      expect(progressFill).toHaveStyle({ width: '50%' });
    });

    it('applies 0% progress', () => {
      const { container } = render(
        <Web3OperationSkeleton showProgress={true} progress={0} />
      );
      const progressFill = container.querySelector('.bg-accent-primary.h-2');
      expect(progressFill).toHaveStyle({ width: '0%' });
    });

    it('applies 100% progress', () => {
      const { container } = render(
        <Web3OperationSkeleton showProgress={true} progress={100} />
      );
      const progressFill = container.querySelector('.bg-accent-primary.h-2');
      expect(progressFill).toHaveStyle({ width: '100%' });
    });

    it('applies 75% progress', () => {
      const { container } = render(
        <Web3OperationSkeleton showProgress={true} progress={75} />
      );
      const progressFill = container.querySelector('.bg-accent-primary.h-2');
      expect(progressFill).toHaveStyle({ width: '75%' });
    });

    it('progress bar has transition animation', () => {
      const { container } = render(
        <Web3OperationSkeleton showProgress={true} progress={50} />
      );
      const progressFill = container.querySelector('.bg-accent-primary.h-2');
      expect(progressFill).toHaveClass('transition-all');
      expect(progressFill).toHaveClass('duration-500');
    });
  });

  describe('Additional Info', () => {
    it('renders additional info skeleton', () => {
      const { container } = render(<Web3OperationSkeleton />);
      const infoBoxes = container.querySelectorAll('.bg-muted\\/50');
      expect(infoBoxes.length).toBeGreaterThan(0);
    });
  });

  describe('Layout', () => {
    it('centers content', () => {
      const { container } = render(<Web3OperationSkeleton />);
      const centerWrapper = container.querySelector('.text-center');
      expect(centerWrapper).toBeInTheDocument();
    });

    it('uses proper spacing', () => {
      const { container } = render(<Web3OperationSkeleton />);
      const spacedWrapper = container.querySelector('.space-y-4');
      expect(spacedWrapper).toBeInTheDocument();
    });
  });

  describe('Custom Classes', () => {
    it('accepts custom className', () => {
      const { container } = render(<Web3OperationSkeleton className="custom-class" />);
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('combines all props', () => {
      const { container } = render(
        <Web3OperationSkeleton
          operation="Loading NFTs"
          showProgress={true}
          progress={60}
          className="my-custom-class"
        />
      );
      expect(container.querySelector('.my-custom-class')).toBeInTheDocument();
      const progressFill = container.querySelector('.bg-accent-primary.h-2');
      expect(progressFill).toHaveStyle({ width: '60%' });
    });
  });
});

describe('Integration Tests', () => {
  describe('Multiple Skeletons Together', () => {
    it('renders multiple skeleton types simultaneously', () => {
      const { container } = render(
        <div>
          <SkeletonBox />
          <SkeletonCircle />
          <SkeletonText lines={3} />
        </div>
      );
      expect(container.querySelector('.rounded')).toBeInTheDocument();
      expect(container.querySelector('.rounded-full')).toBeInTheDocument();
      expect(container.querySelector('.space-y-2')).toBeInTheDocument();
    });

    it('renders wallet and network skeletons together', () => {
      const { container } = render(
        <div>
          <WalletConnectSkeleton />
          <NetworkSwitcherSkeleton />
        </div>
      );
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThanOrEqual(2);
    });

    it('renders transaction components together', () => {
      const { container } = render(
        <div>
          <GasEstimatorSkeleton />
          <TransactionHistorySkeleton itemCount={3} />
        </div>
      );
      const borders = container.querySelectorAll('.border-accent-primary\\/20');
      expect(borders.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Nested Skeletons', () => {
    it('renders nested skeleton structures', () => {
      const { container } = render(
        <div>
          <SkeletonBox>
            <SkeletonCircle />
          </SkeletonBox>
        </div>
      );
      expect(container.querySelector('.rounded-full')).toBeInTheDocument();
    });

    it('renders ComingSoonWrapper with nested content', () => {
      const { container } = render(
        <ComingSoonWrapperSkeleton>
          <TokenBalanceSkeleton />
        </ComingSoonWrapperSkeleton>
      );
      expect(container.querySelector('.opacity-50')).toBeInTheDocument();
      expect(container.querySelector('.bg-secondary')).toBeInTheDocument();
    });
  });
});

describe('Accessibility', () => {
  describe('ARIA Attributes', () => {
    it('skeleton components are decorative', () => {
      const { container } = render(<SkeletonBox />);
      // Skeletons should not have interactive ARIA roles
      expect(container.querySelector('[role="button"]')).not.toBeInTheDocument();
    });

    it('loading states provide text alternatives', () => {
      expect(typeof Web3LoadingStates.CONNECTING).toBe('string');
      expect(Web3LoadingStates.CONNECTING.length).toBeGreaterThan(0);
    });
  });

  describe('Screen Reader Compatibility', () => {
    it('transaction confirmation overlay is visible to screen readers', () => {
      const { container } = render(<TransactionConfirmationSkeleton />);
      const overlay = container.querySelector('.fixed');
      expect(overlay).toBeInTheDocument();
    });
  });
});

describe('Performance', () => {
  describe('Rendering Efficiency', () => {
    it('renders large transaction history efficiently', () => {
      const startTime = performance.now();
      render(<TransactionHistorySkeleton itemCount={50} />);
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should render in less than 1 second
    });

    it('renders multiple text lines efficiently', () => {
      const startTime = performance.now();
      render(<SkeletonText lines={20} />);
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(500);
    });

    it('renders multiple gas options efficiently', () => {
      const startTime = performance.now();
      render(<GasEstimatorSkeleton />);
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(500);
    });
  });
});

describe('Edge Cases', () => {
  describe('Zero Values', () => {
    it('handles zero lines in SkeletonText', () => {
      const { container } = render(<SkeletonText lines={0} />);
      const lines = container.querySelectorAll('.bg-muted\\/50');
      expect(lines).toHaveLength(0);
    });

    it('handles zero items in TransactionHistory', () => {
      const { container } = render(<TransactionHistorySkeleton itemCount={0} />);
      const items = container.querySelectorAll('.divide-y > div');
      expect(items).toHaveLength(0);
    });

    it('handles 0% progress', () => {
      const { container } = render(
        <Web3OperationSkeleton showProgress={true} progress={0} />
      );
      const progressFill = container.querySelector('.bg-accent-primary.h-2');
      expect(progressFill).toHaveStyle({ width: '0%' });
    });
  });

  describe('Extreme Values', () => {
    it('handles very large line count', () => {
      const { container } = render(<SkeletonText lines={100} />);
      const lines = container.querySelectorAll('.bg-muted\\/50');
      expect(lines).toHaveLength(100);
    });

    it('handles very large item count', () => {
      const { container } = render(<TransactionHistorySkeleton itemCount={100} />);
      const items = container.querySelectorAll('.divide-y > div');
      expect(items).toHaveLength(100);
    });

    it('handles progress over 100%', () => {
      const { container } = render(
        <Web3OperationSkeleton showProgress={true} progress={150} />
      );
      const progressFill = container.querySelector('.bg-accent-primary.h-2');
      expect(progressFill).toHaveStyle({ width: '150%' });
    });

    it('handles negative progress', () => {
      const { container } = render(
        <Web3OperationSkeleton showProgress={true} progress={-10} />
      );
      const progressFill = container.querySelector('.bg-accent-primary.h-2');
      expect(progressFill).toHaveStyle({ width: '-10%' });
    });
  });

  describe('Invalid Props', () => {
    it('handles invalid size gracefully', () => {
      const { container } = render(<WalletConnectSkeleton size="invalid" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles undefined className', () => {
      const { container } = render(<SkeletonBox className={undefined} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles null children in ComingSoonWrapper', () => {
      const { container } = render(
        <ComingSoonWrapperSkeleton>{null}</ComingSoonWrapperSkeleton>
      );
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('handles empty operation string', () => {
      const { container } = render(<Web3OperationSkeleton operation="" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles empty className', () => {
      const { container } = render(<SkeletonBox className="" />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});

describe('Snapshot Tests', () => {
  it('SkeletonBox matches snapshot', () => {
    const { container } = render(<SkeletonBox />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('SkeletonCircle matches snapshot', () => {
    const { container } = render(<SkeletonCircle />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('SkeletonText with multiple lines matches snapshot', () => {
    const { container } = render(<SkeletonText lines={3} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('WalletConnectSkeleton matches snapshot', () => {
    const { container } = render(<WalletConnectSkeleton />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('TokenBalanceSkeleton matches snapshot', () => {
    const { container } = render(<TokenBalanceSkeleton />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('NetworkSwitcherSkeleton matches snapshot', () => {
    const { container } = render(<NetworkSwitcherSkeleton />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('GasEstimatorSkeleton matches snapshot', () => {
    const { container } = render(<GasEstimatorSkeleton />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('TransactionConfirmationSkeleton matches snapshot', () => {
    const { container } = render(<TransactionConfirmationSkeleton />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('TransactionHistorySkeleton matches snapshot', () => {
    const { container } = render(<TransactionHistorySkeleton />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('NFTProfileBadgeSkeleton matches snapshot', () => {
    const { container } = render(<NFTProfileBadgeSkeleton />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('CryptoTippingSkeleton matches snapshot', () => {
    const { container } = render(<CryptoTippingSkeleton />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('ComingSoonWrapperSkeleton matches snapshot', () => {
    const { container } = render(
      <ComingSoonWrapperSkeleton>
        <div>Content</div>
      </ComingSoonWrapperSkeleton>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('Web3OperationSkeleton matches snapshot', () => {
    const { container } = render(<Web3OperationSkeleton />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('Web3OperationSkeleton with progress matches snapshot', () => {
    const { container } = render(
      <Web3OperationSkeleton showProgress={true} progress={50} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe('Default Export', () => {
  it('exports all components in default object', async () => {
    const Web3Skeletons = await import('./Web3Skeletons');
    expect(Web3Skeletons.default).toBeDefined();
    expect(Web3Skeletons.default.SkeletonBox).toBeDefined();
    expect(Web3Skeletons.default.SkeletonCircle).toBeDefined();
    expect(Web3Skeletons.default.SkeletonText).toBeDefined();
    expect(Web3Skeletons.default.WalletConnectSkeleton).toBeDefined();
    expect(Web3Skeletons.default.TokenBalanceSkeleton).toBeDefined();
    expect(Web3Skeletons.default.NetworkSwitcherSkeleton).toBeDefined();
    expect(Web3Skeletons.default.GasEstimatorSkeleton).toBeDefined();
    expect(Web3Skeletons.default.TransactionConfirmationSkeleton).toBeDefined();
    expect(Web3Skeletons.default.TransactionHistorySkeleton).toBeDefined();
    expect(Web3Skeletons.default.NFTProfileBadgeSkeleton).toBeDefined();
    expect(Web3Skeletons.default.CryptoTippingSkeleton).toBeDefined();
    expect(Web3Skeletons.default.ComingSoonWrapperSkeleton).toBeDefined();
    expect(Web3Skeletons.default.Web3OperationSkeleton).toBeDefined();
    expect(Web3Skeletons.default.Web3LoadingStates).toBeDefined();
  });
});

export default element
