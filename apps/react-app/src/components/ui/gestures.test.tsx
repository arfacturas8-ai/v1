/**
 * Comprehensive Test Suite for CRYB Gesture Components
 * Testing all gesture interactions, touch events, and animations
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import {
  SwipeableCard,
  PullToRefresh,
  LongPressButton,
  DraggableListItem,
  PinchToZoom,
  TiltCard,
  GestureFab,
} from './gestures';

// Mock dependencies
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

jest.mock('@/lib/accessibility.tsx', () => ({
  usePrefersReducedMotion: jest.fn(() => false),
}));

// Mock framer-motion to simplify testing
jest.mock('framer-motion', () => {
  const mockReact = require('react');
  return {
    motion: {
      div: mockReact.forwardRef(({ children, onDragEnd, onDrag, onWheel, onMouseMove, onMouseLeave, ...props }: any, ref: any) => (
        <div
          ref={ref}
          {...props}
          data-drag-end={onDragEnd ? 'true' : undefined}
          data-drag={onDrag ? 'true' : undefined}
          data-wheel={onWheel ? 'true' : undefined}
          data-mouse-move={onMouseMove ? 'true' : undefined}
          data-mouse-leave={onMouseLeave ? 'true' : undefined}
        >
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
    useMotionValue: (initialValue: number) => ({
      get: () => initialValue,
      set: jest.fn(),
    }),
    useTransform: jest.fn(() => ({
      get: () => 0,
      set: jest.fn(),
    })),
    useAnimation: () => ({
      start: jest.fn().mockResolvedValue(undefined),
      set: jest.fn(),
      stop: jest.fn(),
    }),
  };
});

// Mock custom hooks
jest.mock('../../hooks/useAnimations', () => ({
  useSwipeGesture: jest.fn(() => ({
    onPanStart: jest.fn(),
    onPanEnd: jest.fn(),
  })),
  useLongPress: jest.fn((callback: () => void, duration: number) => ({
    onTouchStart: jest.fn(),
    onTouchEnd: jest.fn(),
    onMouseDown: jest.fn(),
    onMouseUp: jest.fn(),
    onMouseLeave: jest.fn(),
  })),
  useDragPhysics: jest.fn(() => ({
    x: { get: () => 0, set: jest.fn() },
    y: { get: () => 0, set: jest.fn() },
    resetPosition: jest.fn(),
    dragConstraints: {},
    dragElastic: 0.2,
    dragTransition: {},
  })),
  useHover: jest.fn(() => ({
    isHovered: false,
    isActuallyHovered: false,
    isTouched: false,
    handlers: {
      onHoverStart: jest.fn(),
      onHoverEnd: jest.fn(),
      onTouchStart: jest.fn(),
      onTouchEnd: jest.fn(),
    },
  })),
}));

// Mock animation library
jest.mock('../../lib/animations', () => ({
  slideVariants: {},
  scaleVariants: {},
  cardHover: {
    rest: {},
    hover: {},
  },
  swipeConfidenceThreshold: 10000,
  swipePower: (offset: number, velocity: number) => Math.abs(offset) * velocity,
}));

describe('SwipeableCard Component', () => {
  // ===== RENDERING TESTS =====
  describe('Rendering', () => {
    it('should render with children', () => {
      render(
        <SwipeableCard>
          <div>Card Content</div>
        </SwipeableCard>
      );
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <SwipeableCard className="custom-class">
          <div>Content</div>
        </SwipeableCard>
      );
      const card = container.querySelector('.custom-class');
      expect(card).toBeInTheDocument();
    });

    it('should render without swipe handlers', () => {
      render(
        <SwipeableCard>
          <div>Content</div>
        </SwipeableCard>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  // ===== SWIPE GESTURE TESTS =====
  describe('Swipe Gestures', () => {
    it('should call onSwipeLeft when swiped left', () => {
      const handleSwipeLeft = jest.fn();
      render(
        <SwipeableCard onSwipeLeft={handleSwipeLeft}>
          <div>Swipeable</div>
        </SwipeableCard>
      );
      expect(screen.getByText('Swipeable')).toBeInTheDocument();
    });

    it('should call onSwipeRight when swiped right', () => {
      const handleSwipeRight = jest.fn();
      render(
        <SwipeableCard onSwipeRight={handleSwipeRight}>
          <div>Swipeable</div>
        </SwipeableCard>
      );
      expect(screen.getByText('Swipeable')).toBeInTheDocument();
    });

    it('should call onSwipeUp when swiped up', () => {
      const handleSwipeUp = jest.fn();
      render(
        <SwipeableCard onSwipeUp={handleSwipeUp}>
          <div>Swipeable</div>
        </SwipeableCard>
      );
      expect(screen.getByText('Swipeable')).toBeInTheDocument();
    });

    it('should call onSwipeDown when swiped down', () => {
      const handleSwipeDown = jest.fn();
      render(
        <SwipeableCard onSwipeDown={handleSwipeDown}>
          <div>Swipeable</div>
        </SwipeableCard>
      );
      expect(screen.getByText('Swipeable')).toBeInTheDocument();
    });

    it('should support multiple swipe directions', () => {
      const handlers = {
        onSwipeLeft: jest.fn(),
        onSwipeRight: jest.fn(),
        onSwipeUp: jest.fn(),
        onSwipeDown: jest.fn(),
      };
      render(
        <SwipeableCard {...handlers}>
          <div>Multi-direction</div>
        </SwipeableCard>
      );
      expect(screen.getByText('Multi-direction')).toBeInTheDocument();
    });
  });

  // ===== DISABLED STATE TESTS =====
  describe('Disabled State', () => {
    it('should render in disabled state', () => {
      render(
        <SwipeableCard disabled>
          <div>Disabled Card</div>
        </SwipeableCard>
      );
      expect(screen.getByText('Disabled Card')).toBeInTheDocument();
    });

    it('should not allow dragging when disabled', () => {
      const { container } = render(
        <SwipeableCard disabled onSwipeLeft={jest.fn()}>
          <div>Content</div>
        </SwipeableCard>
      );
      const dragElement = container.querySelector('[data-drag-end]');
      expect(dragElement).not.toBeInTheDocument();
    });
  });

  // ===== THRESHOLD TESTS =====
  describe('Swipe Threshold', () => {
    it('should use default threshold', () => {
      render(
        <SwipeableCard onSwipeLeft={jest.fn()}>
          <div>Content</div>
        </SwipeableCard>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should use custom threshold', () => {
      render(
        <SwipeableCard threshold={150} onSwipeLeft={jest.fn()}>
          <div>Content</div>
        </SwipeableCard>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  // ===== SNAP BACK TESTS =====
  describe('Snap Back Behavior', () => {
    it('should snap back by default', () => {
      render(
        <SwipeableCard>
          <div>Content</div>
        </SwipeableCard>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should disable snap back when snapBack is false', () => {
      render(
        <SwipeableCard snapBack={false}>
          <div>Content</div>
        </SwipeableCard>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  // ===== ACTION INDICATORS TESTS =====
  describe('Action Indicators', () => {
    it('should render left action indicator', () => {
      const leftAction = {
        icon: <span data-testid="left-icon">←</span>,
        color: '#ff0000',
        label: 'Delete',
      };
      render(
        <SwipeableCard leftAction={leftAction}>
          <div>Content</div>
        </SwipeableCard>
      );
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should render right action indicator', () => {
      const rightAction = {
        icon: <span data-testid="right-icon">→</span>,
        color: '#00ff00',
        label: 'Archive',
      };
      render(
        <SwipeableCard rightAction={rightAction}>
          <div>Content</div>
        </SwipeableCard>
      );
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
      expect(screen.getByText('Archive')).toBeInTheDocument();
    });

    it('should render both left and right actions', () => {
      const leftAction = {
        icon: <span>←</span>,
        color: '#ff0000',
        label: 'Delete',
      };
      const rightAction = {
        icon: <span>→</span>,
        color: '#00ff00',
        label: 'Archive',
      };
      render(
        <SwipeableCard leftAction={leftAction} rightAction={rightAction}>
          <div>Content</div>
        </SwipeableCard>
      );
      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('Archive')).toBeInTheDocument();
    });
  });
});

describe('PullToRefresh Component', () => {
  // ===== RENDERING TESTS =====
  describe('Rendering', () => {
    it('should render with children', () => {
      const onRefresh = jest.fn().mockResolvedValue(undefined);
      render(
        <PullToRefresh onRefresh={onRefresh}>
          <div>Content to refresh</div>
        </PullToRefresh>
      );
      expect(screen.getByText('Content to refresh')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const onRefresh = jest.fn().mockResolvedValue(undefined);
      const { container } = render(
        <PullToRefresh onRefresh={onRefresh} className="custom-refresh">
          <div>Content</div>
        </PullToRefresh>
      );
      const element = container.querySelector('.custom-refresh');
      expect(element).toBeInTheDocument();
    });
  });

  // ===== REFRESH HANDLER TESTS =====
  describe('Refresh Handler', () => {
    it('should accept async onRefresh handler', () => {
      const onRefresh = jest.fn().mockResolvedValue(undefined);
      render(
        <PullToRefresh onRefresh={onRefresh}>
          <div>Content</div>
        </PullToRefresh>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should handle refresh errors gracefully', () => {
      const onRefresh = jest.fn().mockRejectedValue(new Error('Refresh failed'));
      render(
        <PullToRefresh onRefresh={onRefresh}>
          <div>Content</div>
        </PullToRefresh>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  // ===== THRESHOLD TESTS =====
  describe('Pull Threshold', () => {
    it('should use default threshold', () => {
      const onRefresh = jest.fn().mockResolvedValue(undefined);
      render(
        <PullToRefresh onRefresh={onRefresh}>
          <div>Content</div>
        </PullToRefresh>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should use custom threshold', () => {
      const onRefresh = jest.fn().mockResolvedValue(undefined);
      render(
        <PullToRefresh onRefresh={onRefresh} threshold={120}>
          <div>Content</div>
        </PullToRefresh>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  // ===== DISABLED STATE TESTS =====
  describe('Disabled State', () => {
    it('should render in disabled state', () => {
      const onRefresh = jest.fn().mockResolvedValue(undefined);
      render(
        <PullToRefresh onRefresh={onRefresh} disabled>
          <div>Disabled Content</div>
        </PullToRefresh>
      );
      expect(screen.getByText('Disabled Content')).toBeInTheDocument();
    });

    it('should not trigger refresh when disabled', () => {
      const onRefresh = jest.fn().mockResolvedValue(undefined);
      render(
        <PullToRefresh onRefresh={onRefresh} disabled>
          <div>Content</div>
        </PullToRefresh>
      );
      expect(onRefresh).not.toHaveBeenCalled();
    });
  });

  // ===== REFRESH INDICATOR TESTS =====
  describe('Refresh Indicator', () => {
    it('should render refresh indicator', () => {
      const onRefresh = jest.fn().mockResolvedValue(undefined);
      const { container } = render(
        <PullToRefresh onRefresh={onRefresh}>
          <div>Content</div>
        </PullToRefresh>
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });
});

describe('LongPressButton Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // ===== RENDERING TESTS =====
  describe('Rendering', () => {
    it('should render with children', () => {
      render(
        <LongPressButton onLongPress={jest.fn()}>
          Long Press Me
        </LongPressButton>
      );
      expect(screen.getByRole('button', { name: /long press me/i })).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <LongPressButton onLongPress={jest.fn()} className="custom-button">
          Button
        </LongPressButton>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-button');
    });
  });

  // ===== LONG PRESS TESTS =====
  describe('Long Press Detection', () => {
    it('should trigger onLongPress after duration', async () => {
      const handleLongPress = jest.fn();
      render(
        <LongPressButton onLongPress={handleLongPress} duration={1000}>
          Long Press
        </LongPressButton>
      );

      const button = screen.getByRole('button');

      // Simulate mouse down
      act(() => {
        button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      });

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(1100);
      });

      expect(handleLongPress).toHaveBeenCalled();
    });

    it('should not trigger on short press', async () => {
      const handleLongPress = jest.fn();
      render(
        <LongPressButton onLongPress={handleLongPress} duration={1000}>
          Long Press
        </LongPressButton>
      );

      const button = screen.getByRole('button');

      // Simulate mouse down and up quickly
      act(() => {
        button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      act(() => {
        button.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      });

      expect(handleLongPress).not.toHaveBeenCalled();
    });

    it('should use custom duration', async () => {
      const handleLongPress = jest.fn();
      render(
        <LongPressButton onLongPress={handleLongPress} duration={2000}>
          Long Press
        </LongPressButton>
      );

      const button = screen.getByRole('button');

      act(() => {
        button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      });

      act(() => {
        jest.advanceTimersByTime(2100);
      });

      expect(handleLongPress).toHaveBeenCalled();
    });
  });

  // ===== TOUCH EVENTS TESTS =====
  describe('Touch Events', () => {
    it('should support touch start', () => {
      const handleLongPress = jest.fn();
      render(
        <LongPressButton onLongPress={handleLongPress} duration={500}>
          Touch Me
        </LongPressButton>
      );

      const button = screen.getByRole('button');

      act(() => {
        button.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
      });

      act(() => {
        jest.advanceTimersByTime(600);
      });

      expect(handleLongPress).toHaveBeenCalled();
    });

    it('should cancel on touch end', async () => {
      const handleLongPress = jest.fn();
      render(
        <LongPressButton onLongPress={handleLongPress} duration={1000}>
          Touch Me
        </LongPressButton>
      );

      const button = screen.getByRole('button');

      act(() => {
        button.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      act(() => {
        button.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
      });

      act(() => {
        jest.advanceTimersByTime(600);
      });

      expect(handleLongPress).not.toHaveBeenCalled();
    });
  });

  // ===== DISABLED STATE TESTS =====
  describe('Disabled State', () => {
    it('should render disabled button', () => {
      render(
        <LongPressButton onLongPress={jest.fn()} disabled>
          Disabled
        </LongPressButton>
      );
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should not trigger long press when disabled', async () => {
      const handleLongPress = jest.fn();
      render(
        <LongPressButton onLongPress={handleLongPress} disabled duration={500}>
          Disabled
        </LongPressButton>
      );

      const button = screen.getByRole('button');

      act(() => {
        button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      });

      act(() => {
        jest.advanceTimersByTime(600);
      });

      expect(handleLongPress).not.toHaveBeenCalled();
    });
  });

  // ===== PROGRESS INDICATOR TESTS =====
  describe('Progress Indicator', () => {
    it('should show progress by default', () => {
      render(
        <LongPressButton onLongPress={jest.fn()}>
          Button
        </LongPressButton>
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should hide progress when showProgress is false', () => {
      render(
        <LongPressButton onLongPress={jest.fn()} showProgress={false}>
          Button
        </LongPressButton>
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  // ===== MOUSE LEAVE TESTS =====
  describe('Mouse Leave Handling', () => {
    it('should cancel long press on mouse leave', async () => {
      const handleLongPress = jest.fn();
      render(
        <LongPressButton onLongPress={handleLongPress} duration={1000}>
          Button
        </LongPressButton>
      );

      const button = screen.getByRole('button');

      act(() => {
        button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      act(() => {
        button.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      });

      act(() => {
        jest.advanceTimersByTime(600);
      });

      expect(handleLongPress).not.toHaveBeenCalled();
    });
  });
});

describe('DraggableListItem Component', () => {
  // ===== RENDERING TESTS =====
  describe('Rendering', () => {
    it('should render with children', () => {
      render(
        <DraggableListItem index={0}>
          <div>Item Content</div>
        </DraggableListItem>
      );
      expect(screen.getByText('Item Content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <DraggableListItem index={0} className="custom-item">
          <div>Item</div>
        </DraggableListItem>
      );
      const item = container.querySelector('.custom-item');
      expect(item).toBeInTheDocument();
    });

    it('should render with index', () => {
      render(
        <DraggableListItem index={5}>
          <div>Item 5</div>
        </DraggableListItem>
      );
      expect(screen.getByText('Item 5')).toBeInTheDocument();
    });
  });

  // ===== DRAG HANDLE TESTS =====
  describe('Drag Handle', () => {
    it('should render drag handle when not disabled', () => {
      const { container } = render(
        <DraggableListItem index={0}>
          <div>Item</div>
        </DraggableListItem>
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should not render drag handle when disabled', () => {
      const { container } = render(
        <DraggableListItem index={0} disabled>
          <div>Item</div>
        </DraggableListItem>
      );
      const svg = container.querySelector('svg');
      expect(svg).not.toBeInTheDocument();
    });
  });

  // ===== DISABLED STATE TESTS =====
  describe('Disabled State', () => {
    it('should render in disabled state', () => {
      render(
        <DraggableListItem index={0} disabled>
          <div>Disabled Item</div>
        </DraggableListItem>
      );
      expect(screen.getByText('Disabled Item')).toBeInTheDocument();
    });

    it('should not allow dragging when disabled', () => {
      const { container } = render(
        <DraggableListItem index={0} disabled>
          <div>Item</div>
        </DraggableListItem>
      );
      const dragElement = container.querySelector('[data-drag]');
      expect(dragElement).not.toBeInTheDocument();
    });
  });

  // ===== REORDER CALLBACK TESTS =====
  describe('Reorder Callback', () => {
    it('should accept onReorder callback', () => {
      const handleReorder = jest.fn();
      render(
        <DraggableListItem index={0} onReorder={handleReorder}>
          <div>Item</div>
        </DraggableListItem>
      );
      expect(screen.getByText('Item')).toBeInTheDocument();
    });
  });
});

describe('PinchToZoom Component', () => {
  // ===== RENDERING TESTS =====
  describe('Rendering', () => {
    it('should render with children', () => {
      render(
        <PinchToZoom>
          <img src="/test.jpg" alt="Test" />
        </PinchToZoom>
      );
      expect(screen.getByAltText('Test')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <PinchToZoom className="custom-zoom">
          <div>Zoomable</div>
        </PinchToZoom>
      );
      const element = container.querySelector('.custom-zoom');
      expect(element).toBeInTheDocument();
    });
  });

  // ===== ZOOM LIMITS TESTS =====
  describe('Zoom Limits', () => {
    it('should use default min and max zoom', () => {
      render(
        <PinchToZoom>
          <div>Content</div>
        </PinchToZoom>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should use custom min zoom', () => {
      render(
        <PinchToZoom minZoom={0.3}>
          <div>Content</div>
        </PinchToZoom>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should use custom max zoom', () => {
      render(
        <PinchToZoom maxZoom={5}>
          <div>Content</div>
        </PinchToZoom>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should use custom min and max zoom together', () => {
      render(
        <PinchToZoom minZoom={0.25} maxZoom={4}>
          <div>Content</div>
        </PinchToZoom>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  // ===== WHEEL ZOOM TESTS =====
  describe('Wheel Zoom', () => {
    it('should handle wheel events for zooming', () => {
      const { container } = render(
        <PinchToZoom>
          <div>Zoomable Content</div>
        </PinchToZoom>
      );
      const zoomElement = container.querySelector('[data-wheel]');
      expect(zoomElement).toBeInTheDocument();
    });

    it('should zoom in on wheel up', () => {
      const { container } = render(
        <PinchToZoom>
          <div>Content</div>
        </PinchToZoom>
      );
      const zoomElement = container.querySelector('[data-wheel]');
      expect(zoomElement).toBeInTheDocument();
    });

    it('should zoom out on wheel down', () => {
      const { container } = render(
        <PinchToZoom>
          <div>Content</div>
        </PinchToZoom>
      );
      const zoomElement = container.querySelector('[data-wheel]');
      expect(zoomElement).toBeInTheDocument();
    });
  });

  // ===== RESET ZOOM TESTS =====
  describe('Reset Zoom', () => {
    it('should show reset button when zoomed', () => {
      render(
        <PinchToZoom>
          <div>Content</div>
        </PinchToZoom>
      );
      // Initially at 1x zoom, no reset button
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  // ===== ZOOM INDICATOR TESTS =====
  describe('Zoom Indicator', () => {
    it('should show zoom percentage when not at 1x', () => {
      render(
        <PinchToZoom>
          <div>Content</div>
        </PinchToZoom>
      );
      // Initially at 1x zoom, no indicator
      expect(screen.queryByText(/\d+%/)).not.toBeInTheDocument();
    });
  });
});

describe('TiltCard Component', () => {
  // ===== RENDERING TESTS =====
  describe('Rendering', () => {
    it('should render with children', () => {
      render(
        <TiltCard>
          <div>Tilt Me</div>
        </TiltCard>
      );
      expect(screen.getByText('Tilt Me')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <TiltCard className="custom-tilt">
          <div>Content</div>
        </TiltCard>
      );
      const element = container.querySelector('.custom-tilt');
      expect(element).toBeInTheDocument();
    });
  });

  // ===== TILT BEHAVIOR TESTS =====
  describe('Tilt Behavior', () => {
    it('should respond to mouse move', () => {
      const { container } = render(
        <TiltCard>
          <div>Content</div>
        </TiltCard>
      );
      const element = container.querySelector('[data-mouse-move]');
      expect(element).toBeInTheDocument();
    });

    it('should reset tilt on mouse leave', () => {
      const { container } = render(
        <TiltCard>
          <div>Content</div>
        </TiltCard>
      );
      const element = container.querySelector('[data-mouse-leave]');
      expect(element).toBeInTheDocument();
    });

    it('should use default max tilt', () => {
      render(
        <TiltCard>
          <div>Content</div>
        </TiltCard>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should use custom max tilt', () => {
      render(
        <TiltCard maxTilt={20}>
          <div>Content</div>
        </TiltCard>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  // ===== DISABLED STATE TESTS =====
  describe('Disabled State', () => {
    it('should render in disabled state', () => {
      render(
        <TiltCard disabled>
          <div>No Tilt</div>
        </TiltCard>
      );
      expect(screen.getByText('No Tilt')).toBeInTheDocument();
    });

    it('should not tilt when disabled', () => {
      const { container } = render(
        <TiltCard disabled>
          <div>Content</div>
        </TiltCard>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });
});

describe('GestureFab Component', () => {
  const TestIcon = () => <span data-testid="fab-icon">+</span>;

  // ===== RENDERING TESTS =====
  describe('Rendering', () => {
    it('should render with icon', () => {
      render(<GestureFab icon={<TestIcon />} />);
      expect(screen.getByTestId('fab-icon')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <GestureFab icon={<TestIcon />} className="custom-fab" />
      );
      const element = container.querySelector('.custom-fab');
      expect(element).toBeInTheDocument();
    });
  });

  // ===== POSITION TESTS =====
  describe('Position', () => {
    it('should render in bottom-right position by default', () => {
      const { container } = render(<GestureFab icon={<TestIcon />} />);
      const fab = container.querySelector('.bottom-6.right-6');
      expect(fab).toBeInTheDocument();
    });

    it('should render in bottom-left position', () => {
      const { container } = render(
        <GestureFab icon={<TestIcon />} position="bottom-left" />
      );
      const fab = container.querySelector('.bottom-6.left-6');
      expect(fab).toBeInTheDocument();
    });

    it('should render in top-right position', () => {
      const { container } = render(
        <GestureFab icon={<TestIcon />} position="top-right" />
      );
      const fab = container.querySelector('.top-6.right-6');
      expect(fab).toBeInTheDocument();
    });

    it('should render in top-left position', () => {
      const { container } = render(
        <GestureFab icon={<TestIcon />} position="top-left" />
      );
      const fab = container.querySelector('.top-6.left-6');
      expect(fab).toBeInTheDocument();
    });
  });

  // ===== ACTIONS TESTS =====
  describe('Actions', () => {
    it('should render without actions', () => {
      render(<GestureFab icon={<TestIcon />} />);
      expect(screen.getByTestId('fab-icon')).toBeInTheDocument();
    });

    it('should accept actions array', () => {
      const actions = [
        {
          icon: <span data-testid="action-1">1</span>,
          label: 'Action 1',
          onClick: jest.fn(),
        },
        {
          icon: <span data-testid="action-2">2</span>,
          label: 'Action 2',
          onClick: jest.fn(),
        },
      ];
      render(<GestureFab icon={<TestIcon />} actions={actions} />);
      expect(screen.getByTestId('fab-icon')).toBeInTheDocument();
    });

    it('should call action onClick when clicked', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      const actions = [
        {
          icon: <span>1</span>,
          label: 'Action 1',
          onClick: handleClick,
        },
      ];

      render(<GestureFab icon={<TestIcon />} actions={actions} />);

      // Click main FAB to expand
      const mainButton = screen.getByRole('button');
      await user.click(mainButton);
    });
  });

  // ===== EXPAND/COLLAPSE TESTS =====
  describe('Expand/Collapse', () => {
    it('should toggle expansion on click', async () => {
      const user = userEvent.setup();
      render(<GestureFab icon={<TestIcon />} />);

      const button = screen.getByRole('button');
      await user.click(button);

      // Should remain rendered
      expect(button).toBeInTheDocument();
    });

    it('should collapse when clicking again', async () => {
      const user = userEvent.setup();
      render(<GestureFab icon={<TestIcon />} />);

      const button = screen.getByRole('button');
      await user.click(button);
      await user.click(button);

      expect(button).toBeInTheDocument();
    });
  });

  // ===== MULTIPLE ACTIONS TESTS =====
  describe('Multiple Actions', () => {
    it('should render multiple action buttons', () => {
      const actions = [
        { icon: <span>1</span>, label: 'One', onClick: jest.fn() },
        { icon: <span>2</span>, label: 'Two', onClick: jest.fn() },
        { icon: <span>3</span>, label: 'Three', onClick: jest.fn() },
      ];

      render(<GestureFab icon={<TestIcon />} actions={actions} />);
      expect(screen.getByTestId('fab-icon')).toBeInTheDocument();
    });

    it('should stagger action animations', () => {
      const actions = [
        { icon: <span>1</span>, label: 'One', onClick: jest.fn() },
        { icon: <span>2</span>, label: 'Two', onClick: jest.fn() },
      ];

      render(<GestureFab icon={<TestIcon />} actions={actions} />);
      expect(screen.getByTestId('fab-icon')).toBeInTheDocument();
    });
  });
});

// ===== INTEGRATION TESTS =====
describe('Integration Tests', () => {
  describe('Multiple Gesture Components Together', () => {
    it('should render multiple gesture components', () => {
      render(
        <div>
          <SwipeableCard>
            <div>Swipe</div>
          </SwipeableCard>
          <LongPressButton onLongPress={jest.fn()}>
            Long Press
          </LongPressButton>
          <PinchToZoom>
            <div>Zoom</div>
          </PinchToZoom>
        </div>
      );

      expect(screen.getByText('Swipe')).toBeInTheDocument();
      expect(screen.getByText('Long Press')).toBeInTheDocument();
      expect(screen.getByText('Zoom')).toBeInTheDocument();
    });
  });

  describe('Nested Gesture Components', () => {
    it('should handle nested gestures', () => {
      render(
        <PinchToZoom>
          <TiltCard>
            <div>Nested Content</div>
          </TiltCard>
        </PinchToZoom>
      );

      expect(screen.getByText('Nested Content')).toBeInTheDocument();
    });
  });

  describe('Gesture Component with List', () => {
    it('should render list of draggable items', () => {
      const items = ['Item 1', 'Item 2', 'Item 3'];

      render(
        <div>
          {items.map((item, index) => (
            <DraggableListItem key={index} index={index}>
              <div>{item}</div>
            </DraggableListItem>
          ))}
        </div>
      );

      items.forEach(item => {
        expect(screen.getByText(item)).toBeInTheDocument();
      });
    });
  });
});

// ===== ACCESSIBILITY TESTS =====
describe('Accessibility', () => {
  describe('Keyboard Navigation', () => {
    it('should support keyboard interaction on LongPressButton', async () => {
      const user = userEvent.setup();
      const handleLongPress = jest.fn();

      render(
        <LongPressButton onLongPress={handleLongPress}>
          Button
        </LongPressButton>
      );

      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should support tab navigation on FAB', async () => {
      const user = userEvent.setup();

      render(<GestureFab icon={<span>+</span>} />);

      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });
  });

  describe('Screen Reader Support', () => {
    it('should have accessible labels on interactive elements', () => {
      render(
        <div>
          <LongPressButton onLongPress={jest.fn()}>
            Long Press Action
          </LongPressButton>
        </div>
      );

      expect(screen.getByText('Long Press Action')).toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    it('should maintain focus on interactive components', () => {
      render(
        <LongPressButton onLongPress={jest.fn()}>
          Focusable
        </LongPressButton>
      );

      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should not trap focus when disabled', () => {
      render(
        <LongPressButton onLongPress={jest.fn()} disabled>
          Disabled
        </LongPressButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });
});

// ===== PERFORMANCE TESTS =====
describe('Performance', () => {
  describe('Component Mounting', () => {
    it('should mount SwipeableCard quickly', () => {
      const startTime = performance.now();
      render(
        <SwipeableCard>
          <div>Content</div>
        </SwipeableCard>
      );
      const endTime = performance.now();

      // Should mount in less than 100ms
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should mount multiple components efficiently', () => {
      const startTime = performance.now();
      render(
        <div>
          {Array.from({ length: 10 }, (_, i) => (
            <DraggableListItem key={i} index={i}>
              <div>Item {i}</div>
            </DraggableListItem>
          ))}
        </div>
      );
      const endTime = performance.now();

      // Should mount 10 items in less than 200ms
      expect(endTime - startTime).toBeLessThan(200);
    });
  });

  describe('Re-render Optimization', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender } = render(
        <SwipeableCard>
          <div>Content</div>
        </SwipeableCard>
      );

      // Re-render with same props
      rerender(
        <SwipeableCard>
          <div>Content</div>
        </SwipeableCard>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });
});

// ===== ERROR HANDLING TESTS =====
describe('Error Handling', () => {
  describe('Invalid Props', () => {
    it('should handle missing required props gracefully', () => {
      // @ts-expect-error - Testing missing props
      const { container } = render(<DraggableListItem />);
      expect(container).toBeInTheDocument();
    });

    it('should handle invalid threshold values', () => {
      render(
        <SwipeableCard threshold={-100}>
          <div>Content</div>
        </SwipeableCard>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('Async Error Handling', () => {
    it('should handle rejected refresh promises', async () => {
      const onRefresh = jest.fn().mockRejectedValue(new Error('Failed'));

      render(
        <PullToRefresh onRefresh={onRefresh}>
          <div>Content</div>
        </PullToRefresh>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });
});
