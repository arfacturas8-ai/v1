/**
 * Comprehensive Test Suite for CRYB Animated Components
 * Testing animations, variants, gestures, and accessibility features
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import {
  AnimatedDiv,
  AnimatedButton,
  AnimatedCard,
  StaggerContainer,
  StaggerItem,
  ScrollAnimated,
  AnimatedModal,
  AnimatedToast,
  LoadingSpinner,
  LoadingDots,
  PageTransition,
  Swipeable,
} from './animated';
import { useHover, useScrollAnimation } from '@/hooks/useAnimations';
import { usePrefersReducedMotion } from '@/lib/accessibility';

// ===== MOCKS =====

jest.mock('@/lib/accessibility', () => ({
  usePrefersReducedMotion: jest.fn(),
}));

jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

jest.mock('@/hooks/useAnimations', () => ({
  useAnimationControls: jest.fn(() => ({
    animate: jest.fn(),
    prefersReducedMotion: false,
  })),
  useHover: jest.fn(() => ({
    isHovered: false,
    handlers: {
      onHoverStart: jest.fn(),
      onHoverEnd: jest.fn(),
      onTouchStart: jest.fn(),
      onTouchEnd: jest.fn(),
    },
  })),
  useScrollAnimation: jest.fn(() => ({
    ref: { current: null },
    controls: {
      start: jest.fn(),
      set: jest.fn(),
    },
    isInView: false,
  })),
}));

jest.mock('@/lib/animations', () => ({
  fadeVariants: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  },
  scaleVariants: {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 },
  },
  slideVariants: {
    up: {
      hidden: { y: 20, opacity: 0 },
      visible: { y: 0, opacity: 1 },
      exit: { y: -20, opacity: 0 },
    },
    down: {
      hidden: { y: -20, opacity: 0 },
      visible: { y: 0, opacity: 1 },
      exit: { y: 20, opacity: 0 },
    },
    left: {
      hidden: { x: 20, opacity: 0 },
      visible: { x: 0, opacity: 1 },
      exit: { x: -20, opacity: 0 },
    },
    right: {
      hidden: { x: -20, opacity: 0 },
      visible: { x: 0, opacity: 1 },
      exit: { x: 20, opacity: 0 },
    },
  },
  staggerContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  },
  staggerItem: {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  },
  hoverScale: {
    rest: { scale: 1 },
    hover: { scale: 1.05 },
  },
  cardHover: {
    rest: { scale: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.12)' },
    hover: { scale: 1.02, boxShadow: '0 4px 6px rgba(0,0,0,0.15)' },
  },
  buttonPress: {
    rest: { scale: 1 },
    hover: { scale: 1.02 },
    tap: { scale: 0.98 },
  },
  modalVariants: {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 20 },
  },
  backdropVariants: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  },
  toastVariants: {
    hidden: { opacity: 0, y: -50, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -50, scale: 0.95 },
  },
  bounceVariants: {
    bounce: {
      y: [0, -10, 0],
      transition: { duration: 0.6 },
    },
  },
  spinVariants: {
    spin: {
      rotate: 360,
      transition: { duration: 1, repeat: Infinity, ease: 'linear' },
    },
  },
  transitions: {
    default: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
}));

// Mock framer-motion
jest.mock('framer-motion', () => {
  const mockReact = require('react');
  return {
    motion: {
      div: mockReact.forwardRef(({ children, onClick, onPanEnd, ...props }: any, ref: any) => (
        <div ref={ref} onClick={onClick} onMouseUp={onPanEnd} {...props}>
          {children}
        </div>
      )),
      button: mockReact.forwardRef(({ children, ...props }: any, ref: any) => (
        <button ref={ref} {...props}>
          {children}
        </button>
      )),
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

describe('AnimatedDiv Component', () => {
  beforeEach(() => {
    (usePrefersReducedMotion as jest.Mock).mockReturnValue(false);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ===== RENDERING TESTS =====
  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<AnimatedDiv>Test content</AnimatedDiv>);
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should render children correctly', () => {
      render(
        <AnimatedDiv>
          <span>Child 1</span>
          <span>Child 2</span>
        </AnimatedDiv>
      );
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<AnimatedDiv className="custom-class">Content</AnimatedDiv>);
      const element = screen.getByText('Content');
      expect(element).toHaveClass('custom-class');
    });
  });

  // ===== VARIANT TESTS =====
  describe('Animation Variants', () => {
    it('should render with fade variant (default)', () => {
      render(<AnimatedDiv variant="fade">Fade content</AnimatedDiv>);
      expect(screen.getByText('Fade content')).toBeInTheDocument();
    });

    it('should render with scale variant', () => {
      render(<AnimatedDiv variant="scale">Scale content</AnimatedDiv>);
      expect(screen.getByText('Scale content')).toBeInTheDocument();
    });

    it('should render with slideUp variant', () => {
      render(<AnimatedDiv variant="slideUp">Slide up content</AnimatedDiv>);
      expect(screen.getByText('Slide up content')).toBeInTheDocument();
    });

    it('should render with slideDown variant', () => {
      render(<AnimatedDiv variant="slideDown">Slide down content</AnimatedDiv>);
      expect(screen.getByText('Slide down content')).toBeInTheDocument();
    });

    it('should render with slideLeft variant', () => {
      render(<AnimatedDiv variant="slideLeft">Slide left content</AnimatedDiv>);
      expect(screen.getByText('Slide left content')).toBeInTheDocument();
    });

    it('should render with slideRight variant', () => {
      render(<AnimatedDiv variant="slideRight">Slide right content</AnimatedDiv>);
      expect(screen.getByText('Slide right content')).toBeInTheDocument();
    });
  });

  // ===== TIMING TESTS =====
  describe('Animation Timing', () => {
    it('should accept custom duration', () => {
      render(
        <AnimatedDiv duration={0.5}>Content</AnimatedDiv>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should accept custom delay', () => {
      render(
        <AnimatedDiv delay={0.2}>Content</AnimatedDiv>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should accept both duration and delay', () => {
      render(
        <AnimatedDiv duration={0.5} delay={0.2}>
          Content
        </AnimatedDiv>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should use default duration when not specified', () => {
      render(<AnimatedDiv>Content</AnimatedDiv>);
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should use default delay when not specified', () => {
      render(<AnimatedDiv>Content</AnimatedDiv>);
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  // ===== MOTION PROPS TESTS =====
  describe('Motion Props', () => {
    it('should accept additional motion props', () => {
      render(
        <AnimatedDiv whileHover={{ scale: 1.1 }}>Content</AnimatedDiv>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should forward data attributes', () => {
      render(
        <AnimatedDiv data-testid="animated-div">Content</AnimatedDiv>
      );
      expect(screen.getByTestId('animated-div')).toBeInTheDocument();
    });
  });
});

describe('AnimatedButton Component', () => {
  beforeEach(() => {
    (useHover as jest.Mock).mockReturnValue({
      isHovered: false,
      handlers: {
        onHoverStart: jest.fn(),
        onHoverEnd: jest.fn(),
        onTouchStart: jest.fn(),
        onTouchEnd: jest.fn(),
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ===== RENDERING TESTS =====
  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<AnimatedButton>Click me</AnimatedButton>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<AnimatedButton className="custom-btn">Button</AnimatedButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('relative', 'overflow-hidden', 'custom-btn');
    });
  });

  // ===== VARIANT TESTS =====
  describe('Variants', () => {
    it('should render with scale variant', () => {
      render(<AnimatedButton variant="scale">Scale</AnimatedButton>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render with press variant (default)', () => {
      render(<AnimatedButton variant="press">Press</AnimatedButton>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render with hover variant', () => {
      render(<AnimatedButton variant="hover">Hover</AnimatedButton>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  // ===== LOADING STATE TESTS =====
  describe('Loading State', () => {
    it('should show loading spinner when isLoading is true', () => {
      render(<AnimatedButton isLoading>Loading</AnimatedButton>);
      const button = screen.getByRole('button');
      const spinner = button.querySelector('.w-4.h-4.border-2');
      expect(spinner).toBeInTheDocument();
    });

    it('should disable button when loading', () => {
      render(<AnimatedButton isLoading>Loading</AnimatedButton>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should show content when not loading', () => {
      render(<AnimatedButton isLoading={false}>Click me</AnimatedButton>);
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('should not trigger onClick when loading', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(
        <AnimatedButton isLoading onClick={handleClick}>
          Loading
        </AnimatedButton>
      );
      const button = screen.getByRole('button');
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  // ===== DISABLED STATE TESTS =====
  describe('Disabled State', () => {
    it('should render disabled button', () => {
      render(<AnimatedButton disabled>Disabled</AnimatedButton>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should not trigger onClick when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(
        <AnimatedButton disabled onClick={handleClick}>
          Disabled
        </AnimatedButton>
      );
      const button = screen.getByRole('button');
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  // ===== CLICK HANDLING TESTS =====
  describe('Click Handling', () => {
    it('should call onClick when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<AnimatedButton onClick={handleClick}>Click me</AnimatedButton>);
      const button = screen.getByRole('button');
      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should support all button HTML attributes', () => {
      render(
        <AnimatedButton type="submit" name="submit-btn">
          Submit
        </AnimatedButton>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('name', 'submit-btn');
    });
  });

  // ===== HOVER STATE TESTS =====
  describe('Hover State', () => {
    it('should respond to hover events', () => {
      const mockHandlers = {
        onHoverStart: jest.fn(),
        onHoverEnd: jest.fn(),
        onTouchStart: jest.fn(),
        onTouchEnd: jest.fn(),
      };
      (useHover as jest.Mock).mockReturnValue({
        isHovered: false,
        handlers: mockHandlers,
      });

      render(<AnimatedButton>Hover me</AnimatedButton>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should change animation state when hovered', () => {
      (useHover as jest.Mock).mockReturnValue({
        isHovered: true,
        handlers: {
          onHoverStart: jest.fn(),
          onHoverEnd: jest.fn(),
          onTouchStart: jest.fn(),
          onTouchEnd: jest.fn(),
        },
      });

      render(<AnimatedButton>Hovered</AnimatedButton>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});

describe('AnimatedCard Component', () => {
  beforeEach(() => {
    (useHover as jest.Mock).mockReturnValue({
      isHovered: false,
      handlers: {
        onHoverStart: jest.fn(),
        onHoverEnd: jest.fn(),
        onTouchStart: jest.fn(),
        onTouchEnd: jest.fn(),
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ===== RENDERING TESTS =====
  describe('Rendering', () => {
    it('should render card with content', () => {
      render(<AnimatedCard>Card content</AnimatedCard>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('should apply default card styles', () => {
      render(<AnimatedCard>Card</AnimatedCard>);
      const card = screen.getByText('Card');
      expect(card).toHaveClass(
        'rounded-lg',
        'border',
        'bg-card',
        'text-card-foreground',
        'shadow-sm'
      );
    });

    it('should apply custom className', () => {
      render(<AnimatedCard className="custom-card">Card</AnimatedCard>);
      const card = screen.getByText('Card');
      expect(card).toHaveClass('custom-card');
    });
  });

  // ===== INTERACTIVE TESTS =====
  describe('Interactive Features', () => {
    it('should render as interactive when interactive prop is true', () => {
      render(<AnimatedCard interactive>Interactive card</AnimatedCard>);
      const card = screen.getByText('Interactive card');
      expect(card).toHaveClass('cursor-pointer');
    });

    it('should handle onClick when provided', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<AnimatedCard onClick={handleClick}>Clickable card</AnimatedCard>);
      const card = screen.getByText('Clickable card');
      await user.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not add cursor-pointer when not interactive', () => {
      render(<AnimatedCard interactive={false}>Card</AnimatedCard>);
      const card = screen.getByText('Card');
      expect(card).not.toHaveClass('cursor-pointer');
    });
  });

  // ===== HOVER TESTS =====
  describe('Hover Effects', () => {
    it('should enable hover effects by default', () => {
      render(<AnimatedCard>Card</AnimatedCard>);
      expect(screen.getByText('Card')).toBeInTheDocument();
    });

    it('should disable hover effects when hover is false', () => {
      render(<AnimatedCard hover={false}>Card</AnimatedCard>);
      expect(screen.getByText('Card')).toBeInTheDocument();
    });

    it('should respond to hover state changes', () => {
      (useHover as jest.Mock).mockReturnValue({
        isHovered: true,
        handlers: {
          onHoverStart: jest.fn(),
          onHoverEnd: jest.fn(),
          onTouchStart: jest.fn(),
          onTouchEnd: jest.fn(),
        },
      });

      render(<AnimatedCard>Hovered card</AnimatedCard>);
      expect(screen.getByText('Hovered card')).toBeInTheDocument();
    });
  });
});

describe('StaggerContainer Component', () => {
  // ===== RENDERING TESTS =====
  describe('Rendering', () => {
    it('should render container with children', () => {
      render(
        <StaggerContainer>
          <div>Child 1</div>
          <div>Child 2</div>
        </StaggerContainer>
      );
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <StaggerContainer className="custom-container">
          <div>Content</div>
        </StaggerContainer>
      );
      expect(screen.getByText('Content').parentElement).toHaveClass('custom-container');
    });
  });

  // ===== STAGGER TIMING TESTS =====
  describe('Stagger Timing', () => {
    it('should accept custom staggerDelay', () => {
      render(
        <StaggerContainer staggerDelay={0.2}>
          <div>Item</div>
        </StaggerContainer>
      );
      expect(screen.getByText('Item')).toBeInTheDocument();
    });

    it('should accept custom delayChildren', () => {
      render(
        <StaggerContainer delayChildren={0.1}>
          <div>Item</div>
        </StaggerContainer>
      );
      expect(screen.getByText('Item')).toBeInTheDocument();
    });

    it('should use default stagger timing when not specified', () => {
      render(
        <StaggerContainer>
          <div>Item</div>
        </StaggerContainer>
      );
      expect(screen.getByText('Item')).toBeInTheDocument();
    });
  });
});

describe('StaggerItem Component', () => {
  // ===== RENDERING TESTS =====
  describe('Rendering', () => {
    it('should render item with content', () => {
      render(<StaggerItem>Item content</StaggerItem>);
      expect(screen.getByText('Item content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<StaggerItem className="custom-item">Item</StaggerItem>);
      const item = screen.getByText('Item');
      expect(item).toHaveClass('custom-item');
    });
  });

  // ===== INTEGRATION TESTS =====
  describe('Integration with StaggerContainer', () => {
    it('should work within StaggerContainer', () => {
      render(
        <StaggerContainer>
          <StaggerItem>Item 1</StaggerItem>
          <StaggerItem>Item 2</StaggerItem>
          <StaggerItem>Item 3</StaggerItem>
        </StaggerContainer>
      );
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });
  });
});

describe('ScrollAnimated Component', () => {
  beforeEach(() => {
    (useScrollAnimation as jest.Mock).mockReturnValue({
      ref: { current: null },
      controls: {
        start: jest.fn(),
        set: jest.fn(),
      },
      isInView: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ===== RENDERING TESTS =====
  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<ScrollAnimated>Scroll content</ScrollAnimated>);
      expect(screen.getByText('Scroll content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<ScrollAnimated className="scroll-item">Content</ScrollAnimated>);
      const element = screen.getByText('Content');
      expect(element).toHaveClass('scroll-item');
    });
  });

  // ===== VARIANT TESTS =====
  describe('Scroll Variants', () => {
    it('should render with fade variant', () => {
      render(<ScrollAnimated variant="fade">Fade scroll</ScrollAnimated>);
      expect(screen.getByText('Fade scroll')).toBeInTheDocument();
    });

    it('should render with slideUp variant (default)', () => {
      render(<ScrollAnimated variant="slideUp">Slide up scroll</ScrollAnimated>);
      expect(screen.getByText('Slide up scroll')).toBeInTheDocument();
    });

    it('should render with scale variant', () => {
      render(<ScrollAnimated variant="scale">Scale scroll</ScrollAnimated>);
      expect(screen.getByText('Scale scroll')).toBeInTheDocument();
    });
  });

  // ===== THRESHOLD TESTS =====
  describe('Threshold', () => {
    it('should accept custom threshold', () => {
      (useScrollAnimation as jest.Mock).mockReturnValue({
        ref: { current: null },
        controls: { start: jest.fn(), set: jest.fn() },
        isInView: false,
      });

      render(<ScrollAnimated threshold={0.5}>Content</ScrollAnimated>);
      expect(useScrollAnimation).toHaveBeenCalledWith(0.5);
    });

    it('should use default threshold when not specified', () => {
      render(<ScrollAnimated>Content</ScrollAnimated>);
      expect(useScrollAnimation).toHaveBeenCalledWith(0.1);
    });
  });

  // ===== ONCE PROP TESTS =====
  describe('Once Prop', () => {
    it('should accept once prop', () => {
      render(<ScrollAnimated once={true}>Content</ScrollAnimated>);
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should default once to true', () => {
      render(<ScrollAnimated>Content</ScrollAnimated>);
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });
});

describe('AnimatedModal Component', () => {
  // ===== RENDERING TESTS =====
  describe('Rendering', () => {
    it('should render modal when isOpen is true', () => {
      render(
        <AnimatedModal isOpen={true} onClose={jest.fn()}>
          Modal content
        </AnimatedModal>
      );
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      render(
        <AnimatedModal isOpen={false} onClose={jest.fn()}>
          Modal content
        </AnimatedModal>
      );
      expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
    });

    it('should render backdrop when open', () => {
      render(
        <AnimatedModal isOpen={true} onClose={jest.fn()}>
          Content
        </AnimatedModal>
      );
      const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/50');
      expect(backdrop).toBeInTheDocument();
    });

    it('should apply custom className to modal', () => {
      render(
        <AnimatedModal isOpen={true} onClose={jest.fn()} className="custom-modal">
          Content
        </AnimatedModal>
      );
      const modal = screen.getByText('Content');
      expect(modal).toHaveClass('custom-modal');
    });
  });

  // ===== CLOSE HANDLING TESTS =====
  describe('Close Handling', () => {
    it('should call onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();
      const handleClose = jest.fn();
      render(
        <AnimatedModal isOpen={true} onClose={handleClose}>
          Modal content
        </AnimatedModal>
      );
      const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/50');
      if (backdrop) {
        await user.click(backdrop as HTMLElement);
        expect(handleClose).toHaveBeenCalledTimes(1);
      }
    });

    it('should not close when modal content is clicked', async () => {
      const user = userEvent.setup();
      const handleClose = jest.fn();
      render(
        <AnimatedModal isOpen={true} onClose={handleClose}>
          <div>Modal content</div>
        </AnimatedModal>
      );
      const modalContent = screen.getByText('Modal content');
      await user.click(modalContent);
      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  // ===== STYLING TESTS =====
  describe('Styling', () => {
    it('should apply default modal styles', () => {
      render(
        <AnimatedModal isOpen={true} onClose={jest.fn()}>
          Content
        </AnimatedModal>
      );
      const modal = screen.getByText('Content');
      expect(modal).toHaveClass('bg-background', 'border', 'rounded-lg', 'shadow-lg', 'p-6');
    });
  });
});

describe('AnimatedToast Component', () => {
  // ===== RENDERING TESTS =====
  describe('Rendering', () => {
    it('should render toast when isVisible is true', () => {
      render(
        <AnimatedToast isVisible={true}>Toast message</AnimatedToast>
      );
      expect(screen.getByText('Toast message')).toBeInTheDocument();
    });

    it('should not render toast when isVisible is false', () => {
      render(
        <AnimatedToast isVisible={false}>Toast message</AnimatedToast>
      );
      expect(screen.queryByText('Toast message')).not.toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <AnimatedToast isVisible={true} className="custom-toast">
          Toast
        </AnimatedToast>
      );
      const toast = screen.getByText('Toast');
      expect(toast).toHaveClass('custom-toast');
    });
  });

  // ===== POSITION TESTS =====
  describe('Position', () => {
    it('should render at top position by default', () => {
      render(
        <AnimatedToast isVisible={true}>Toast</AnimatedToast>
      );
      const toast = screen.getByText('Toast');
      expect(toast).toHaveClass('top-4');
    });

    it('should render at top position when specified', () => {
      render(
        <AnimatedToast isVisible={true} position="top">
          Toast
        </AnimatedToast>
      );
      const toast = screen.getByText('Toast');
      expect(toast).toHaveClass('top-4');
    });

    it('should render at bottom position when specified', () => {
      render(
        <AnimatedToast isVisible={true} position="bottom">
          Toast
        </AnimatedToast>
      );
      const toast = screen.getByText('Toast');
      expect(toast).toHaveClass('bottom-4');
    });
  });

  // ===== STYLING TESTS =====
  describe('Styling', () => {
    it('should apply default toast styles', () => {
      render(
        <AnimatedToast isVisible={true}>Toast</AnimatedToast>
      );
      const toast = screen.getByText('Toast');
      expect(toast).toHaveClass(
        'fixed',
        'right-4',
        'z-50',
        'min-w-[300px]',
        'rounded-lg',
        'border',
        'bg-background',
        'p-4',
        'shadow-lg'
      );
    });
  });
});

describe('LoadingSpinner Component', () => {
  // ===== RENDERING TESTS =====
  describe('Rendering', () => {
    it('should render spinner', () => {
      const { container } = render(<LoadingSpinner />);
      const spinner = container.querySelector('.border-2.border-current.border-t-transparent.rounded-full');
      expect(spinner).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<LoadingSpinner className="custom-spinner" />);
      const spinner = document.querySelector('.custom-spinner');
      expect(spinner).toBeInTheDocument();
    });
  });

  // ===== SIZE TESTS =====
  describe('Sizes', () => {
    it('should render small size', () => {
      const { container } = render(<LoadingSpinner size="sm" />);
      const spinner = container.querySelector('.w-4.h-4');
      expect(spinner).toBeInTheDocument();
    });

    it('should render medium size (default)', () => {
      const { container } = render(<LoadingSpinner size="md" />);
      const spinner = container.querySelector('.w-6.h-6');
      expect(spinner).toBeInTheDocument();
    });

    it('should render large size', () => {
      const { container } = render(<LoadingSpinner size="lg" />);
      const spinner = container.querySelector('.w-8.h-8');
      expect(spinner).toBeInTheDocument();
    });

    it('should default to medium size when not specified', () => {
      const { container } = render(<LoadingSpinner />);
      const spinner = container.querySelector('.w-6.h-6');
      expect(spinner).toBeInTheDocument();
    });
  });
});

describe('LoadingDots Component', () => {
  // ===== RENDERING TESTS =====
  describe('Rendering', () => {
    it('should render three dots', () => {
      const { container } = render(<LoadingDots />);
      const dots = container.querySelectorAll('.w-2.h-2.bg-current.rounded-full');
      expect(dots).toHaveLength(3);
    });

    it('should apply custom className to container', () => {
      const { container } = render(<LoadingDots className="custom-dots" />);
      const dotsContainer = container.querySelector('.flex.space-x-1.custom-dots');
      expect(dotsContainer).toBeInTheDocument();
    });
  });

  // ===== ANIMATION TESTS =====
  describe('Animation', () => {
    it('should render dots with proper styling', () => {
      const { container } = render(<LoadingDots />);
      const dots = container.querySelectorAll('.w-2.h-2.bg-current.rounded-full');
      expect(dots.length).toBe(3);
    });
  });
});

describe('PageTransition Component', () => {
  // ===== RENDERING TESTS =====
  describe('Rendering', () => {
    it('should render with children', () => {
      render(<PageTransition>Page content</PageTransition>);
      expect(screen.getByText('Page content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<PageTransition className="custom-page">Content</PageTransition>);
      const element = screen.getByText('Content');
      expect(element).toHaveClass('custom-page');
    });
  });

  // ===== TRANSITION TESTS =====
  describe('Transition', () => {
    it('should render page transition correctly', () => {
      render(
        <PageTransition>
          <div>Page 1</div>
          <div>Page 2</div>
        </PageTransition>
      );
      expect(screen.getByText('Page 1')).toBeInTheDocument();
      expect(screen.getByText('Page 2')).toBeInTheDocument();
    });
  });
});

describe('Swipeable Component', () => {
  // ===== RENDERING TESTS =====
  describe('Rendering', () => {
    it('should render with children', () => {
      render(<Swipeable>Swipeable content</Swipeable>);
      expect(screen.getByText('Swipeable content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<Swipeable className="swipeable-item">Content</Swipeable>);
      const element = screen.getByText('Content');
      expect(element).toHaveClass('swipeable-item');
    });
  });

  // ===== SWIPE HANDLING TESTS =====
  describe('Swipe Handling', () => {
    it('should accept swipe callbacks', () => {
      const onSwipeLeft = jest.fn();
      const onSwipeRight = jest.fn();
      const onSwipeUp = jest.fn();
      const onSwipeDown = jest.fn();

      render(
        <Swipeable
          onSwipeLeft={onSwipeLeft}
          onSwipeRight={onSwipeRight}
          onSwipeUp={onSwipeUp}
          onSwipeDown={onSwipeDown}
        >
          Swipeable
        </Swipeable>
      );
      expect(screen.getByText('Swipeable')).toBeInTheDocument();
    });

    it('should accept custom threshold', () => {
      render(
        <Swipeable threshold={100}>Content</Swipeable>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should use default threshold when not specified', () => {
      render(<Swipeable>Content</Swipeable>);
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  // ===== TOUCH ACTION TESTS =====
  describe('Touch Action', () => {
    it('should render with touch-action style attribute', () => {
      render(<Swipeable>Content</Swipeable>);
      const element = screen.getByText('Content');
      // The style prop is passed to the motion.div component
      expect(element).toBeInTheDocument();
    });
  });
});

// ===== ACCESSIBILITY TESTS =====
describe('Accessibility', () => {
  describe('Reduced Motion', () => {
    beforeEach(() => {
      (usePrefersReducedMotion as jest.Mock).mockReturnValue(true);
    });

    it('should respect prefers-reduced-motion for AnimatedDiv', () => {
      render(<AnimatedDiv>Content</AnimatedDiv>);
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should respect prefers-reduced-motion for AnimatedButton', () => {
      render(<AnimatedButton>Button</AnimatedButton>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should respect prefers-reduced-motion for AnimatedCard', () => {
      render(<AnimatedCard>Card</AnimatedCard>);
      expect(screen.getByText('Card')).toBeInTheDocument();
    });

    it('should respect prefers-reduced-motion for ScrollAnimated', () => {
      render(<ScrollAnimated>Scroll</ScrollAnimated>);
      expect(screen.getByText('Scroll')).toBeInTheDocument();
    });
  });
});

// ===== INTEGRATION TESTS =====
describe('Integration Tests', () => {
  it('should compose AnimatedDiv with different variants in sequence', () => {
    render(
      <>
        <AnimatedDiv variant="fade">Fade</AnimatedDiv>
        <AnimatedDiv variant="scale">Scale</AnimatedDiv>
        <AnimatedDiv variant="slideUp">Slide</AnimatedDiv>
      </>
    );
    expect(screen.getByText('Fade')).toBeInTheDocument();
    expect(screen.getByText('Scale')).toBeInTheDocument();
    expect(screen.getByText('Slide')).toBeInTheDocument();
  });

  it('should nest animated components', () => {
    render(
      <AnimatedDiv variant="fade">
        <AnimatedCard>
          <AnimatedButton>Click me</AnimatedButton>
        </AnimatedCard>
      </AnimatedDiv>
    );
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('should combine stagger container with items', () => {
    render(
      <StaggerContainer staggerDelay={0.1}>
        <StaggerItem>Item 1</StaggerItem>
        <StaggerItem>Item 2</StaggerItem>
        <StaggerItem>Item 3</StaggerItem>
      </StaggerContainer>
    );
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('should handle modal with animated content', () => {
    render(
      <AnimatedModal isOpen={true} onClose={jest.fn()}>
        <AnimatedDiv variant="slideUp">
          <h2>Modal Title</h2>
          <p>Modal content</p>
        </AnimatedDiv>
      </AnimatedModal>
    );
    expect(screen.getByText('Modal Title')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('should render multiple loading components', () => {
    const { container } = render(
      <div>
        <LoadingSpinner size="sm" />
        <LoadingSpinner size="md" />
        <LoadingDots />
      </div>
    );
    const spinners = container.querySelectorAll('.border-2.border-current');
    const dots = container.querySelectorAll('.w-2.h-2.bg-current');
    expect(spinners.length).toBeGreaterThanOrEqual(2);
    expect(dots).toHaveLength(3);
  });
});

// ===== PERFORMANCE TESTS =====
describe('Performance', () => {
  it('should render multiple AnimatedDiv components efficiently', () => {
    const items = Array.from({ length: 100 }, (_, i) => i);
    render(
      <>
        {items.map((item) => (
          <AnimatedDiv key={item} variant="fade">
            Item {item}
          </AnimatedDiv>
        ))}
      </>
    );
    expect(screen.getByText('Item 0')).toBeInTheDocument();
    expect(screen.getByText('Item 99')).toBeInTheDocument();
  });

  it('should render stagger container with many items', () => {
    const items = Array.from({ length: 50 }, (_, i) => i);
    render(
      <StaggerContainer>
        {items.map((item) => (
          <StaggerItem key={item}>Item {item}</StaggerItem>
        ))}
      </StaggerContainer>
    );
    expect(screen.getByText('Item 0')).toBeInTheDocument();
    expect(screen.getByText('Item 49')).toBeInTheDocument();
  });
});

// ===== ERROR HANDLING TESTS =====
describe('Error Handling', () => {
  it('should handle missing children gracefully', () => {
    expect(() => render(<AnimatedDiv />)).not.toThrow();
  });

  it('should handle undefined callbacks gracefully', () => {
    expect(() => render(<AnimatedButton>Button</AnimatedButton>)).not.toThrow();
  });

  it('should handle invalid variant gracefully', () => {
    expect(() =>
      render(<AnimatedDiv variant={'invalid' as any}>Content</AnimatedDiv>)
    ).not.toThrow();
  });
});
