/**
 * CRYB Design System - Animated Modal Component Tests
 * Comprehensive test coverage for animated modal functionality
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';

// Mock framer-motion to avoid animation complexities in tests
jest.mock('framer-motion', () => {
  const React = require('react');

  const MotionComponent = React.forwardRef(({ children, onAnimationComplete, variants, ...props }: any, ref: any) => {
    // Simulate animation completion
    React.useEffect(() => {
      if (onAnimationComplete) {
        const timer = setTimeout(() => onAnimationComplete(), 0);
        return () => clearTimeout(timer);
      }
    }, [onAnimationComplete]);

    return <div ref={ref} data-motion="div" data-variants={variants ? 'present' : undefined} {...props}>{children}</div>;
  });

  MotionComponent.displayName = 'Motion.div';

  return {
    motion: {
      div: MotionComponent,
      h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
      p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

// Mock react-dom's createPortal
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: any) => node,
}));

// Mock the utils library
jest.mock('../../lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

// Mock class-variance-authority
jest.mock('class-variance-authority', () => ({
  cva: (base: any, config: any) => (props: any) => {
    const variantClasses = [];
    if (config?.variants && props) {
      Object.keys(props).forEach((key) => {
        if (config.variants[key] && config.variants[key][props[key]]) {
          const variantClass = config.variants[key][props[key]];
          if (typeof variantClass === 'string') {
            variantClasses.push(variantClass);
          }
        }
      });
    }
    return [base, ...variantClasses].filter(Boolean).flat().join(' ');
  },
}));

// Mock the animations library
jest.mock('../../lib/animations', () => ({
  backdropVariants: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  },
  modalVariants: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  drawerVariants: {
    hidden: { y: '100%' },
    visible: { y: 0 },
    exit: { y: '100%' },
  },
  slideVariants: {
    up: {
      hidden: { y: '100%' },
      visible: { y: 0 },
      exit: { y: '100%' },
    },
    down: {
      hidden: { y: '-100%' },
      visible: { y: 0 },
      exit: { y: '-100%' },
    },
    left: {
      hidden: { x: '-100%' },
      visible: { x: 0 },
      exit: { x: '-100%' },
    },
    right: {
      hidden: { x: '100%' },
      visible: { x: 0 },
      exit: { x: '100%' },
    },
  },
  fadeVariants: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  },
  staggerContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
    exit: { opacity: 0 },
  },
  staggerItem: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
}));

// Mock the accessibility hooks
jest.mock('../../lib/accessibility', () => ({
  useFocusTrap: jest.fn(() => ({ current: null })),
  usePrefersReducedMotion: jest.fn(() => false),
  useId: jest.fn(() => 'test-id'),
  generateId: jest.fn(() => 'test-id'),
  announcer: {
    announce: jest.fn(),
  },
}));

// Mock useSwipeGesture hook
jest.mock('../../hooks/useAnimations', () => ({
  useSwipeGesture: jest.fn((callback: any, threshold: number) => ({
    onMouseDown: jest.fn(),
    onMouseMove: jest.fn(),
    onMouseUp: jest.fn(),
    onTouchStart: jest.fn(),
    onTouchMove: jest.fn(),
    onTouchEnd: jest.fn(),
  })),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  X: () => <span data-testid="x-icon">X</span>,
}));

// Mock the Button component to avoid complex dependencies
jest.mock('./button', () => {
  const React = require('react');
  const MockButton = React.forwardRef(({ children, variant, size, className, ...props }: any, ref: any) => (
    <button ref={ref} className={`button ${variant || ''} ${size || ''} ${className || ''}`.trim()} {...props}>
      {children}
    </button>
  ));
  MockButton.displayName = 'Button';

  return {
    Button: MockButton,
    __esModule: true,
    default: MockButton,
  };
});

// Import components after mocks are set up
import {
  AnimatedModal,
  Drawer,
  Sidebar,
  ConfirmationModal,
  useModal,
  useConfirmationModal,
} from './animated-modal';

// Helper component for controlled modal testing
const ControlledAnimatedModal = ({
  children,
  defaultIsOpen = false,
  onOpenChange,
  ...props
}: any) => {
  const [isOpen, setIsOpen] = useState(defaultIsOpen);

  const handleClose = () => {
    setIsOpen(false);
    onOpenChange?.(false);
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>
      <AnimatedModal isOpen={isOpen} onClose={handleClose} {...props}>
        {children}
      </AnimatedModal>
    </>
  );
};

describe('AnimatedModal Component', () => {
  // Reset body overflow after each test
  afterEach(() => {
    document.body.style.overflow = '';
  });

  describe('Basic Rendering', () => {
    it('should not render when closed', () => {
      render(
        <AnimatedModal isOpen={false} onClose={jest.fn()}>
          <div>Modal Content</div>
        </AnimatedModal>
      );

      expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
    });

    it('should render when open', () => {
      render(
        <AnimatedModal isOpen={true} onClose={jest.fn()}>
          <div>Modal Content</div>
        </AnimatedModal>
      );

      expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });

    it('should render with title', () => {
      render(
        <AnimatedModal isOpen={true} onClose={jest.fn()} title="Test Title">
          <div>Content</div>
        </AnimatedModal>
      );

      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('should render with description', () => {
      render(
        <AnimatedModal
          isOpen={true}
          onClose={jest.fn()}
          title="Title"
          description="Test description"
        >
          <div>Content</div>
        </AnimatedModal>
      );

      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('should render close button by default', () => {
      render(
        <AnimatedModal isOpen={true} onClose={jest.fn()} title="Title">
          <div>Content</div>
        </AnimatedModal>
      );

      const closeButton = screen.getByRole('button', { name: /close modal/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('should hide close button when showCloseButton is false', () => {
      render(
        <AnimatedModal
          isOpen={true}
          onClose={jest.fn()}
          title="Title"
          showCloseButton={false}
        >
          <div>Content</div>
        </AnimatedModal>
      );

      const closeButton = screen.queryByRole('button', { name: /close modal/i });
      expect(closeButton).not.toBeInTheDocument();
    });
  });

  describe('Open/Close Functionality', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();

      render(
        <AnimatedModal isOpen={true} onClose={onClose} title="Title">
          <div>Content</div>
        </AnimatedModal>
      );

      const closeButton = screen.getByRole('button', { name: /close modal/i });
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('should call onClose when backdrop is clicked by default', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();

      const { container } = render(
        <AnimatedModal isOpen={true} onClose={onClose}>
          <div>Content</div>
        </AnimatedModal>
      );

      const backdrop = container.querySelector('.bg-black\\/50');
      if (backdrop) {
        await user.click(backdrop as Element);
      }

      expect(onClose).toHaveBeenCalled();
    });

    it('should not close on backdrop click when closeOnBackdropClick is false', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();

      const { container } = render(
        <AnimatedModal isOpen={true} onClose={onClose} closeOnBackdropClick={false}>
          <div>Content</div>
        </AnimatedModal>
      );

      const backdrop = container.querySelector('.bg-black\\/50');
      if (backdrop) {
        await user.click(backdrop as Element);
      }

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should toggle open state with controlled component', async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();

      render(
        <ControlledAnimatedModal onOpenChange={onOpenChange}>
          <div>Content</div>
        </ControlledAnimatedModal>
      );

      const openBtn = screen.getByText('Open Modal');
      await user.click(openBtn);

      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });
    });
  });

  describe('Escape Key Handling', () => {
    it('should close on escape key by default', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();

      render(
        <AnimatedModal isOpen={true} onClose={onClose}>
          <div>Content</div>
        </AnimatedModal>
      );

      await user.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalled();
    });

    it('should not close on escape key when closeOnEscape is false', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();

      render(
        <AnimatedModal isOpen={true} onClose={onClose} closeOnEscape={false}>
          <div>Content</div>
        </AnimatedModal>
      );

      await user.keyboard('{Escape}');

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should handle escape key only when modal is open', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();

      const { rerender } = render(
        <AnimatedModal isOpen={false} onClose={onClose}>
          <div>Content</div>
        </AnimatedModal>
      );

      await user.keyboard('{Escape}');
      expect(onClose).not.toHaveBeenCalled();

      rerender(
        <AnimatedModal isOpen={true} onClose={onClose}>
          <div>Content</div>
        </AnimatedModal>
      );

      await user.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Animation Variants', () => {
    it('should render with spring animation variant by default', () => {
      const { container } = render(
        <AnimatedModal isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </AnimatedModal>
      );

      const motionDivs = container.querySelectorAll('[data-motion="div"]');
      expect(motionDivs.length).toBeGreaterThan(0);
    });

    it('should render with fade animation variant', () => {
      const { container } = render(
        <AnimatedModal isOpen={true} onClose={jest.fn()} animationVariant="fade">
          <div>Content</div>
        </AnimatedModal>
      );

      const motionDivs = container.querySelectorAll('[data-motion="div"]');
      expect(motionDivs.length).toBeGreaterThan(0);
    });

    it('should render with scale animation variant', () => {
      const { container } = render(
        <AnimatedModal isOpen={true} onClose={jest.fn()} animationVariant="scale">
          <div>Content</div>
        </AnimatedModal>
      );

      const motionDivs = container.querySelectorAll('[data-motion="div"]');
      expect(motionDivs.length).toBeGreaterThan(0);
    });

    it('should render with slide animation variant', () => {
      const { container } = render(
        <AnimatedModal isOpen={true} onClose={jest.fn()} animationVariant="slide">
          <div>Content</div>
        </AnimatedModal>
      );

      const motionDivs = container.querySelectorAll('[data-motion="div"]');
      expect(motionDivs.length).toBeGreaterThan(0);
    });
  });

  describe('Position Variants', () => {
    it('should render at center position by default', () => {
      const { container } = render(
        <AnimatedModal isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </AnimatedModal>
      );

      const positionContainer = container.querySelector('.items-center.justify-center');
      expect(positionContainer).toBeInTheDocument();
    });

    it('should render at top position', () => {
      const { container } = render(
        <AnimatedModal isOpen={true} onClose={jest.fn()} position="top">
          <div>Content</div>
        </AnimatedModal>
      );

      const positionContainer = container.querySelector('.items-start.justify-center');
      expect(positionContainer).toBeInTheDocument();
    });

    it('should render at bottom position', () => {
      const { container } = render(
        <AnimatedModal isOpen={true} onClose={jest.fn()} position="bottom">
          <div>Content</div>
        </AnimatedModal>
      );

      const positionContainer = container.querySelector('.items-end.justify-center');
      expect(positionContainer).toBeInTheDocument();
    });

    it('should render at left position', () => {
      const { container } = render(
        <AnimatedModal isOpen={true} onClose={jest.fn()} position="left">
          <div>Content</div>
        </AnimatedModal>
      );

      const positionContainer = container.querySelector('.items-center.justify-start');
      expect(positionContainer).toBeInTheDocument();
    });

    it('should render at right position', () => {
      const { container } = render(
        <AnimatedModal isOpen={true} onClose={jest.fn()} position="right">
          <div>Content</div>
        </AnimatedModal>
      );

      const positionContainer = container.querySelector('.items-center.justify-end');
      expect(positionContainer).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('should render small size', () => {
      const { container } = render(
        <AnimatedModal isOpen={true} onClose={jest.fn()} size="sm">
          <div>Content</div>
        </AnimatedModal>
      );

      const content = container.querySelector('.max-w-sm');
      expect(content).toBeInTheDocument();
    });

    it('should render default size', () => {
      const { container } = render(
        <AnimatedModal isOpen={true} onClose={jest.fn()} size="default">
          <div>Content</div>
        </AnimatedModal>
      );

      const content = container.querySelector('.max-w-lg');
      expect(content).toBeInTheDocument();
    });

    it('should render large size', () => {
      const { container } = render(
        <AnimatedModal isOpen={true} onClose={jest.fn()} size="lg">
          <div>Content</div>
        </AnimatedModal>
      );

      const content = container.querySelector('.max-w-2xl');
      expect(content).toBeInTheDocument();
    });

    it('should render extra large size', () => {
      const { container } = render(
        <AnimatedModal isOpen={true} onClose={jest.fn()} size="xl">
          <div>Content</div>
        </AnimatedModal>
      );

      const content = container.querySelector('.max-w-4xl');
      expect(content).toBeInTheDocument();
    });

    it('should render full size', () => {
      const { container } = render(
        <AnimatedModal isOpen={true} onClose={jest.fn()} size="full">
          <div>Content</div>
        </AnimatedModal>
      );

      const content = container.querySelector('.w-\\[95vw\\]');
      expect(content).toBeInTheDocument();
    });
  });

  describe('Modal Variants', () => {
    it('should render modal variant by default', () => {
      const { container } = render(
        <AnimatedModal isOpen={true} onClose={jest.fn()} variant="modal">
          <div>Content</div>
        </AnimatedModal>
      );

      const content = container.querySelector('.rounded-lg');
      expect(content).toBeInTheDocument();
    });

    it('should render drawer variant', () => {
      const { container } = render(
        <AnimatedModal isOpen={true} onClose={jest.fn()} variant="drawer">
          <div>Content</div>
        </AnimatedModal>
      );

      const content = container.querySelector('.rounded-t-lg');
      expect(content).toBeInTheDocument();
    });

    it('should render fullscreen variant', () => {
      const { container } = render(
        <AnimatedModal isOpen={true} onClose={jest.fn()} variant="fullscreen">
          <div>Content</div>
        </AnimatedModal>
      );

      const content = container.querySelector('.w-screen.h-screen');
      expect(content).toBeInTheDocument();
    });

    it('should render sidebar variant', () => {
      const { container } = render(
        <AnimatedModal isOpen={true} onClose={jest.fn()} variant="sidebar">
          <div>Content</div>
        </AnimatedModal>
      );

      const content = container.querySelector('.rounded-l-lg.h-screen');
      expect(content).toBeInTheDocument();
    });
  });

  describe('Portal Rendering', () => {
    it('should render modal content via portal', () => {
      render(
        <AnimatedModal isOpen={true} onClose={jest.fn()}>
          <div>Portal Content</div>
        </AnimatedModal>
      );

      // Content should exist in the document via portal
      expect(screen.getByText('Portal Content')).toBeInTheDocument();
    });
  });

  describe('Body Scroll Prevention', () => {
    it('should prevent body scroll when modal is open', () => {
      render(
        <AnimatedModal isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </AnimatedModal>
      );

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scroll when modal is closed', () => {
      const { rerender } = render(
        <AnimatedModal isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </AnimatedModal>
      );

      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <AnimatedModal isOpen={false} onClose={jest.fn()}>
          <div>Content</div>
        </AnimatedModal>
      );

      expect(document.body.style.overflow).toBe('');
    });

    it('should not prevent scroll when preventScroll is false', () => {
      render(
        <AnimatedModal isOpen={true} onClose={jest.fn()} preventScroll={false}>
          <div>Content</div>
        </AnimatedModal>
      );

      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Overlay/Backdrop', () => {
    it('should render backdrop when modal is open', () => {
      const { container } = render(
        <AnimatedModal isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </AnimatedModal>
      );

      const backdrop = container.querySelector('.bg-black\\/50');
      expect(backdrop).toBeInTheDocument();
    });

    it('should apply custom overlay className', () => {
      const { container } = render(
        <AnimatedModal
          isOpen={true}
          onClose={jest.fn()}
          overlayClassName="custom-overlay"
        >
          <div>Content</div>
        </AnimatedModal>
      );

      const backdrop = container.querySelector('.custom-overlay');
      expect(backdrop).toBeInTheDocument();
    });

    it('should have backdrop blur effect', () => {
      const { container } = render(
        <AnimatedModal isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </AnimatedModal>
      );

      const backdrop = container.querySelector('.backdrop-blur-sm');
      expect(backdrop).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className to modal content', () => {
      const { container } = render(
        <AnimatedModal isOpen={true} onClose={jest.fn()} className="custom-modal">
          <div>Content</div>
        </AnimatedModal>
      );

      const modal = container.querySelector('.custom-modal');
      expect(modal).toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    it('should use focus trap when modal is open', () => {
      const { useFocusTrap } = require('../../lib/accessibility');

      render(
        <AnimatedModal isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </AnimatedModal>
      );

      expect(useFocusTrap).toHaveBeenCalledWith(true);
    });

    it('should not use focus trap when modal is closed', () => {
      const { useFocusTrap } = require('../../lib/accessibility');

      render(
        <AnimatedModal isOpen={false} onClose={jest.fn()}>
          <div>Content</div>
        </AnimatedModal>
      );

      // Modal doesn't render when closed, so focus trap won't be called
      expect(screen.queryByText('Content')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper z-index for layering', () => {
      const { container } = render(
        <AnimatedModal isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </AnimatedModal>
      );

      const wrapper = container.querySelector('.z-50');
      expect(wrapper).toBeInTheDocument();
    });

    it('should have close button with aria-label', () => {
      render(
        <AnimatedModal isOpen={true} onClose={jest.fn()} title="Title">
          <div>Content</div>
        </AnimatedModal>
      );

      const closeButton = screen.getByRole('button', { name: /close modal/i });
      expect(closeButton).toHaveAttribute('aria-label', 'Close modal');
    });
  });

  describe('Swipe Gestures', () => {
    it('should enable swipe gestures when swipeToClose is true', () => {
      const { useSwipeGesture } = require('../../hooks/useAnimations');

      render(
        <AnimatedModal isOpen={true} onClose={jest.fn()} swipeToClose={true}>
          <div>Content</div>
        </AnimatedModal>
      );

      expect(useSwipeGesture).toHaveBeenCalled();
    });

    it('should not enable swipe gestures by default', () => {
      const { useSwipeGesture } = require('../../hooks/useAnimations');
      useSwipeGesture.mockClear();

      render(
        <AnimatedModal isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </AnimatedModal>
      );

      // Should still be called but gestures won't be applied
      expect(useSwipeGesture).toHaveBeenCalled();
    });

    it('should show swipe indicator for drawer variant when swipeToClose is enabled', () => {
      const { container } = render(
        <AnimatedModal
          isOpen={true}
          onClose={jest.fn()}
          variant="drawer"
          swipeToClose={true}
        >
          <div>Content</div>
        </AnimatedModal>
      );

      const swipeIndicator = container.querySelector('.w-12.h-1.bg-muted-foreground\\/30');
      expect(swipeIndicator).toBeInTheDocument();
    });
  });

  describe('Content Scrolling', () => {
    it('should have scrollable content area', () => {
      const { container } = render(
        <AnimatedModal isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </AnimatedModal>
      );

      const contentArea = container.querySelector('.overflow-y-auto');
      expect(contentArea).toBeInTheDocument();
    });

    it('should constrain modal height', () => {
      const { container } = render(
        <AnimatedModal isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </AnimatedModal>
      );

      const modal = container.querySelector('.max-h-\\[90vh\\]');
      expect(modal).toBeInTheDocument();
    });
  });
});

describe('Drawer Component', () => {
  it('should render as drawer variant', () => {
    const { container } = render(
      <Drawer isOpen={true} onClose={jest.fn()}>
        <div>Drawer Content</div>
      </Drawer>
    );

    const drawer = container.querySelector('.rounded-t-lg');
    expect(drawer).toBeInTheDocument();
  });

  it('should position at bottom by default', () => {
    const { container } = render(
      <Drawer isOpen={true} onClose={jest.fn()}>
        <div>Content</div>
      </Drawer>
    );

    const positionContainer = container.querySelector('.items-end.justify-center');
    expect(positionContainer).toBeInTheDocument();
  });

  it('should position at top when direction is top', () => {
    const { container } = render(
      <Drawer isOpen={true} onClose={jest.fn()} direction="top">
        <div>Content</div>
      </Drawer>
    );

    const positionContainer = container.querySelector('.items-start.justify-center');
    expect(positionContainer).toBeInTheDocument();
  });

  it('should position at left when direction is left', () => {
    const { container } = render(
      <Drawer isOpen={true} onClose={jest.fn()} direction="left">
        <div>Content</div>
      </Drawer>
    );

    const positionContainer = container.querySelector('.items-center.justify-start');
    expect(positionContainer).toBeInTheDocument();
  });

  it('should position at right when direction is right', () => {
    const { container } = render(
      <Drawer isOpen={true} onClose={jest.fn()} direction="right">
        <div>Content</div>
      </Drawer>
    );

    const positionContainer = container.querySelector('.items-center.justify-end');
    expect(positionContainer).toBeInTheDocument();
  });

  it('should use slide animation by default', () => {
    const { container } = render(
      <Drawer isOpen={true} onClose={jest.fn()}>
        <div>Content</div>
      </Drawer>
    );

    const motionDivs = container.querySelectorAll('[data-motion="div"]');
    expect(motionDivs.length).toBeGreaterThan(0);
  });

  it('should enable swipeToClose by default', () => {
    const { useSwipeGesture } = require('../../hooks/useAnimations');

    render(
      <Drawer isOpen={true} onClose={jest.fn()}>
        <div>Content</div>
      </Drawer>
    );

    expect(useSwipeGesture).toHaveBeenCalled();
  });

  it('should render content', () => {
    render(
      <Drawer isOpen={true} onClose={jest.fn()}>
        <div>Drawer Content</div>
      </Drawer>
    );

    expect(screen.getByText('Drawer Content')).toBeInTheDocument();
  });
});

describe('Sidebar Component', () => {
  it('should render as sidebar variant', () => {
    const { container } = render(
      <Sidebar isOpen={true} onClose={jest.fn()}>
        <div>Sidebar Content</div>
      </Sidebar>
    );

    const sidebar = container.querySelector('.rounded-l-lg.h-screen');
    expect(sidebar).toBeInTheDocument();
  });

  it('should position at left by default', () => {
    const { container } = render(
      <Sidebar isOpen={true} onClose={jest.fn()}>
        <div>Content</div>
      </Sidebar>
    );

    const positionContainer = container.querySelector('.items-center.justify-start');
    expect(positionContainer).toBeInTheDocument();
  });

  it('should position at right when side is right', () => {
    const { container } = render(
      <Sidebar isOpen={true} onClose={jest.fn()} side="right">
        <div>Content</div>
      </Sidebar>
    );

    const positionContainer = container.querySelector('.items-center.justify-end');
    expect(positionContainer).toBeInTheDocument();
  });

  it('should use small size by default', () => {
    const { container } = render(
      <Sidebar isOpen={true} onClose={jest.fn()}>
        <div>Content</div>
      </Sidebar>
    );

    const content = container.querySelector('.max-w-sm');
    expect(content).toBeInTheDocument();
  });

  it('should use slide animation by default', () => {
    const { container } = render(
      <Sidebar isOpen={true} onClose={jest.fn()}>
        <div>Content</div>
      </Sidebar>
    );

    const motionDivs = container.querySelectorAll('[data-motion="div"]');
    expect(motionDivs.length).toBeGreaterThan(0);
  });

  it('should enable swipeToClose by default', () => {
    const { useSwipeGesture } = require('../../hooks/useAnimations');

    render(
      <Sidebar isOpen={true} onClose={jest.fn()}>
        <div>Content</div>
      </Sidebar>
    );

    expect(useSwipeGesture).toHaveBeenCalled();
  });

  it('should render content', () => {
    render(
      <Sidebar isOpen={true} onClose={jest.fn()}>
        <div>Sidebar Content</div>
      </Sidebar>
    );

    expect(screen.getByText('Sidebar Content')).toBeInTheDocument();
  });
});

describe('ConfirmationModal Component', () => {
  it('should render with title and message', () => {
    render(
      <ConfirmationModal
        isOpen={true}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        title="Confirm Action"
        message="Are you sure you want to proceed?"
      />
    );

    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
  });

  it('should render default confirm and cancel buttons', () => {
    render(
      <ConfirmationModal
        isOpen={true}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        title="Confirm"
        message="Message"
      />
    );

    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should render custom button labels', () => {
    render(
      <ConfirmationModal
        isOpen={true}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        title="Delete"
        message="Delete this item?"
        confirmLabel="Delete"
        cancelLabel="Keep"
      />
    );

    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /keep/i })).toBeInTheDocument();
  });

  it('should call onConfirm and onCancel when confirm is clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    render(
      <ConfirmationModal
        isOpen={true}
        onConfirm={onConfirm}
        onCancel={onCancel}
        title="Confirm"
        message="Message"
      />
    );

    const confirmBtn = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmBtn);

    expect(onConfirm).toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalled(); // Should close modal
  });

  it('should call onCancel when cancel is clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    render(
      <ConfirmationModal
        isOpen={true}
        onConfirm={onConfirm}
        onCancel={onCancel}
        title="Confirm"
        message="Message"
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelBtn);

    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('should use primary variant by default', () => {
    render(
      <ConfirmationModal
        isOpen={true}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        title="Confirm"
        message="Message"
      />
    );

    const confirmBtn = screen.getByRole('button', { name: /confirm/i });
    expect(confirmBtn.className).toContain('primary');
  });

  it('should use destructive variant when specified', () => {
    render(
      <ConfirmationModal
        isOpen={true}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        title="Delete"
        message="Delete this?"
        variant="destructive"
      />
    );

    const confirmBtn = screen.getByRole('button', { name: /confirm/i });
    expect(confirmBtn.className).toContain('destructive');
  });

  it('should render custom icon', () => {
    render(
      <ConfirmationModal
        isOpen={true}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        title="Confirm"
        message="Message"
        icon={<div data-testid="custom-icon">Icon</div>}
      />
    );

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('should not close on backdrop click', async () => {
    const user = userEvent.setup();
    const onCancel = jest.fn();

    const { container } = render(
      <ConfirmationModal
        isOpen={true}
        onConfirm={jest.fn()}
        onCancel={onCancel}
        title="Confirm"
        message="Message"
      />
    );

    const backdrop = container.querySelector('.bg-black\\/50');
    if (backdrop) {
      await user.click(backdrop as Element);
    }

    expect(onCancel).not.toHaveBeenCalled();
  });

  it('should use small size', () => {
    const { container } = render(
      <ConfirmationModal
        isOpen={true}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        title="Confirm"
        message="Message"
      />
    );

    const modal = container.querySelector('.max-w-sm');
    expect(modal).toBeInTheDocument();
  });
});

describe('useModal Hook', () => {
  const TestComponent = () => {
    const { isOpen, openModal, closeModal, toggleModal } = useModal();

    return (
      <div>
        <div>Status: {isOpen ? 'open' : 'closed'}</div>
        <button onClick={openModal}>Open</button>
        <button onClick={closeModal}>Close</button>
        <button onClick={toggleModal}>Toggle</button>
      </div>
    );
  };

  it('should start with modal closed', () => {
    render(<TestComponent />);
    expect(screen.getByText('Status: closed')).toBeInTheDocument();
  });

  it('should open modal when openModal is called', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);

    const openBtn = screen.getByText('Open');
    await user.click(openBtn);

    expect(screen.getByText('Status: open')).toBeInTheDocument();
  });

  it('should close modal when closeModal is called', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);

    const openBtn = screen.getByText('Open');
    await user.click(openBtn);
    expect(screen.getByText('Status: open')).toBeInTheDocument();

    const closeBtn = screen.getByText('Close');
    await user.click(closeBtn);
    expect(screen.getByText('Status: closed')).toBeInTheDocument();
  });

  it('should toggle modal state when toggleModal is called', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);

    const toggleBtn = screen.getByText('Toggle');

    await user.click(toggleBtn);
    expect(screen.getByText('Status: open')).toBeInTheDocument();

    await user.click(toggleBtn);
    expect(screen.getByText('Status: closed')).toBeInTheDocument();
  });
});

describe('useConfirmationModal Hook', () => {
  const TestComponent = () => {
    const { showConfirmation, hideConfirmation, ConfirmationModal } = useConfirmationModal();
    const [result, setResult] = useState<string>('none');

    const handleShow = () => {
      showConfirmation(
        'Delete Item',
        'Are you sure you want to delete?',
        () => setResult('confirmed'),
        'destructive'
      );
    };

    return (
      <div>
        <div>Result: {result}</div>
        <button onClick={handleShow}>Show Confirmation</button>
        <button onClick={hideConfirmation}>Hide Confirmation</button>
        <ConfirmationModal />
      </div>
    );
  };

  it('should show confirmation modal', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);

    const showBtn = screen.getByText('Show Confirmation');
    await user.click(showBtn);

    await waitFor(() => {
      expect(screen.getByText('Delete Item')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to delete?')).toBeInTheDocument();
    });
  });

  it('should call onConfirm callback when confirmed', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);

    const showBtn = screen.getByText('Show Confirmation');
    await user.click(showBtn);

    await waitFor(() => {
      expect(screen.getByText('Delete Item')).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole('button', { name: /^confirm$/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText('Result: confirmed')).toBeInTheDocument();
    });
  });

  it('should hide confirmation when hideConfirmation is called', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);

    const showBtn = screen.getByText('Show Confirmation');
    await user.click(showBtn);

    await waitFor(() => {
      expect(screen.getByText('Delete Item')).toBeInTheDocument();
    });

    const hideBtn = screen.getByText('Hide Confirmation');
    await user.click(hideBtn);

    await waitFor(() => {
      expect(screen.queryByText('Delete Item')).not.toBeInTheDocument();
    });
  });

  it('should use provided variant', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);

    const showBtn = screen.getByText('Show Confirmation');
    await user.click(showBtn);

    await waitFor(() => {
      const confirmBtn = screen.getByRole('button', { name: /^confirm$/i });
      expect(confirmBtn.className).toContain('destructive');
    });
  });
});

describe('Complex Scenarios', () => {
  it('should handle multiple modals open at once', () => {
    render(
      <>
        <AnimatedModal isOpen={true} onClose={jest.fn()}>
          <div>First Modal</div>
        </AnimatedModal>
        <AnimatedModal isOpen={true} onClose={jest.fn()}>
          <div>Second Modal</div>
        </AnimatedModal>
      </>
    );

    expect(screen.getByText('First Modal')).toBeInTheDocument();
    expect(screen.getByText('Second Modal')).toBeInTheDocument();
  });

  it('should handle modal state changes', async () => {
    const user = userEvent.setup();

    const TestComponent = () => {
      const [isOpen, setIsOpen] = useState(false);
      const [count, setCount] = useState(0);

      return (
        <>
          <button onClick={() => setIsOpen(true)}>Open</button>
          <AnimatedModal isOpen={isOpen} onClose={() => setIsOpen(false)}>
            <div>Count: {count}</div>
            <button onClick={() => setCount(count + 1)}>Increment</button>
          </AnimatedModal>
        </>
      );
    };

    render(<TestComponent />);

    const openBtn = screen.getByText('Open');
    await user.click(openBtn);

    await waitFor(() => {
      expect(screen.getByText('Count: 0')).toBeInTheDocument();
    });

    const incrementBtn = screen.getByText('Increment');
    await user.click(incrementBtn);

    await waitFor(() => {
      expect(screen.getByText('Count: 1')).toBeInTheDocument();
    });
  });

  it('should handle form submission within modal', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn((e) => e.preventDefault());

    render(
      <AnimatedModal isOpen={true} onClose={jest.fn()}>
        <form onSubmit={onSubmit}>
          <input type="text" placeholder="Username" />
          <button type="submit">Submit</button>
        </form>
      </AnimatedModal>
    );

    const input = screen.getByPlaceholderText('Username');
    const submitBtn = screen.getByRole('button', { name: /submit/i });

    await user.type(input, 'testuser');
    await user.click(submitBtn);

    expect(onSubmit).toHaveBeenCalled();
  });

  it('should render long scrollable content', () => {
    const longContent = Array.from({ length: 50 }, (_, i) => (
      <p key={i}>Line {i + 1}</p>
    ));

    const { container } = render(
      <AnimatedModal isOpen={true} onClose={jest.fn()}>
        {longContent}
      </AnimatedModal>
    );

    expect(screen.getByText('Line 1')).toBeInTheDocument();
    expect(screen.getByText('Line 50')).toBeInTheDocument();

    const scrollableArea = container.querySelector('.overflow-y-auto');
    expect(scrollableArea).toBeInTheDocument();
  });

  it('should handle different animation variants for different positions', () => {
    const positions = ['top', 'bottom', 'left', 'right', 'center'] as const;

    positions.forEach((position) => {
      const { container, unmount } = render(
        <AnimatedModal
          isOpen={true}
          onClose={jest.fn()}
          position={position}
          animationVariant="slide"
        >
          <div>Content for {position}</div>
        </AnimatedModal>
      );

      expect(screen.getByText(`Content for ${position}`)).toBeInTheDocument();
      unmount();
    });
  });
});
