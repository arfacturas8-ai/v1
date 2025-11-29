/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderHook } from '@testing-library/react';
import {
  useGestures,
  SwipeableContainer,
  PullToRefresh,
  Draggable
} from './GestureHandler';

// Helper function to create touch events
const createTouchEvent = (type, touches, changedTouches = touches) => {
  const event = new Event(type, { bubbles: true, cancelable: true });
  event.touches = touches;
  event.changedTouches = changedTouches;
  return event;
};

// Helper to create touch object
const createTouch = (x, y, identifier = 0) => ({
  clientX: x,
  clientY: y,
  identifier,
  pageX: x,
  pageY: y,
  screenX: x,
  screenY: y,
  target: document.body
});

describe('useGestures Hook', () => {
  let handlers;
  let mockCallbacks;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockCallbacks = {
      onSwipeLeft: jest.fn(),
      onSwipeRight: jest.fn(),
      onSwipeUp: jest.fn(),
      onSwipeDown: jest.fn(),
      onTap: jest.fn(),
      onDoubleTap: jest.fn(),
      onLongPress: jest.fn()
    };
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Hook Initialization', () => {
    it('should return gesture handler functions', () => {
      const { result } = renderHook(() => useGestures(mockCallbacks));

      expect(result.current).toHaveProperty('onTouchStart');
      expect(result.current).toHaveProperty('onTouchMove');
      expect(result.current).toHaveProperty('onTouchEnd');
      expect(typeof result.current.onTouchStart).toBe('function');
      expect(typeof result.current.onTouchMove).toBe('function');
      expect(typeof result.current.onTouchEnd).toBe('function');
    });

    it('should work with default threshold values', () => {
      const { result } = renderHook(() => useGestures(mockCallbacks));

      expect(result.current).toBeTruthy();
    });

    it('should work with custom threshold values', () => {
      const { result } = renderHook(() =>
        useGestures({ ...mockCallbacks, threshold: 100, timeThreshold: 500 })
      );

      expect(result.current).toBeTruthy();
    });

    it('should work with minimal callbacks', () => {
      const { result } = renderHook(() => useGestures({ onTap: jest.fn() }));

      expect(result.current).toBeTruthy();
    });

    it('should work with no callbacks', () => {
      const { result } = renderHook(() => useGestures({}));

      expect(result.current).toBeTruthy();
    });
  });

  describe('Swipe Right Detection', () => {
    it('should detect horizontal swipe right', () => {
      const { result } = renderHook(() => useGestures(mockCallbacks));

      const startTouch = createTouch(100, 100);
      const endTouch = createTouch(200, 100);

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [startTouch]));
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [], [endTouch]));
      });

      expect(mockCallbacks.onSwipeRight).toHaveBeenCalledTimes(1);
      expect(mockCallbacks.onSwipeLeft).not.toHaveBeenCalled();
    });

    it('should pass correct delta values on swipe right', () => {
      const { result } = renderHook(() => useGestures(mockCallbacks));

      const startTouch = createTouch(100, 100);
      const endTouch = createTouch(250, 110);

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [startTouch]));
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [], [endTouch]));
      });

      expect(mockCallbacks.onSwipeRight).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          deltaX: 150,
          deltaY: 10
        })
      );
    });

    it('should detect fast swipe right', () => {
      const { result } = renderHook(() => useGestures(mockCallbacks));

      const startTouch = createTouch(50, 100);
      const endTouch = createTouch(200, 100);

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [startTouch]));
      });

      act(() => {
        jest.advanceTimersByTime(100);
        result.current.onTouchEnd(createTouchEvent('touchend', [], [endTouch]));
      });

      expect(mockCallbacks.onSwipeRight).toHaveBeenCalledTimes(1);
    });

    it('should require minimum threshold for swipe right', () => {
      const { result } = renderHook(() =>
        useGestures({ ...mockCallbacks, threshold: 100 })
      );

      const startTouch = createTouch(100, 100);
      const endTouch = createTouch(149, 100);

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [startTouch]));
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [], [endTouch]));
      });

      expect(mockCallbacks.onSwipeRight).not.toHaveBeenCalled();
    });

    it('should detect swipe right with custom threshold', () => {
      const { result } = renderHook(() =>
        useGestures({ ...mockCallbacks, threshold: 30 })
      );

      const startTouch = createTouch(100, 100);
      const endTouch = createTouch(140, 100);

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [startTouch]));
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [], [endTouch]));
      });

      expect(mockCallbacks.onSwipeRight).toHaveBeenCalledTimes(1);
    });
  });

  describe('Swipe Left Detection', () => {
    it('should detect horizontal swipe left', () => {
      const { result } = renderHook(() => useGestures(mockCallbacks));

      const startTouch = createTouch(200, 100);
      const endTouch = createTouch(100, 100);

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [startTouch]));
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [], [endTouch]));
      });

      expect(mockCallbacks.onSwipeLeft).toHaveBeenCalledTimes(1);
      expect(mockCallbacks.onSwipeRight).not.toHaveBeenCalled();
    });

    it('should pass correct delta values on swipe left', () => {
      const { result } = renderHook(() => useGestures(mockCallbacks));

      const startTouch = createTouch(250, 100);
      const endTouch = createTouch(100, 110);

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [startTouch]));
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [], [endTouch]));
      });

      expect(mockCallbacks.onSwipeLeft).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          deltaX: -150,
          deltaY: 10
        })
      );
    });

    it('should detect diagonal swipe as left when horizontal dominates', () => {
      const { result } = renderHook(() => useGestures(mockCallbacks));

      const startTouch = createTouch(200, 100);
      const endTouch = createTouch(100, 130);

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [startTouch]));
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [], [endTouch]));
      });

      expect(mockCallbacks.onSwipeLeft).toHaveBeenCalledTimes(1);
      expect(mockCallbacks.onSwipeDown).not.toHaveBeenCalled();
    });

    it('should require minimum threshold for swipe left', () => {
      const { result } = renderHook(() =>
        useGestures({ ...mockCallbacks, threshold: 100 })
      );

      const startTouch = createTouch(150, 100);
      const endTouch = createTouch(51, 100);

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [startTouch]));
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [], [endTouch]));
      });

      expect(mockCallbacks.onSwipeLeft).not.toHaveBeenCalled();
    });
  });

  describe('Swipe Up Detection', () => {
    it('should detect vertical swipe up', () => {
      const { result } = renderHook(() => useGestures(mockCallbacks));

      const startTouch = createTouch(100, 200);
      const endTouch = createTouch(100, 100);

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [startTouch]));
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [], [endTouch]));
      });

      expect(mockCallbacks.onSwipeUp).toHaveBeenCalledTimes(1);
      expect(mockCallbacks.onSwipeDown).not.toHaveBeenCalled();
    });

    it('should pass correct delta values on swipe up', () => {
      const { result } = renderHook(() => useGestures(mockCallbacks));

      const startTouch = createTouch(100, 250);
      const endTouch = createTouch(110, 100);

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [startTouch]));
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [], [endTouch]));
      });

      expect(mockCallbacks.onSwipeUp).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          deltaX: 10,
          deltaY: -150
        })
      );
    });

    it('should detect diagonal swipe as up when vertical dominates', () => {
      const { result } = renderHook(() => useGestures(mockCallbacks));

      const startTouch = createTouch(100, 200);
      const endTouch = createTouch(130, 100);

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [startTouch]));
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [], [endTouch]));
      });

      expect(mockCallbacks.onSwipeUp).toHaveBeenCalledTimes(1);
      expect(mockCallbacks.onSwipeRight).not.toHaveBeenCalled();
    });

    it('should require minimum threshold for swipe up', () => {
      const { result } = renderHook(() =>
        useGestures({ ...mockCallbacks, threshold: 100 })
      );

      const startTouch = createTouch(100, 150);
      const endTouch = createTouch(100, 51);

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [startTouch]));
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [], [endTouch]));
      });

      expect(mockCallbacks.onSwipeUp).not.toHaveBeenCalled();
    });
  });

  describe('Swipe Down Detection', () => {
    it('should detect vertical swipe down', () => {
      const { result } = renderHook(() => useGestures(mockCallbacks));

      const startTouch = createTouch(100, 100);
      const endTouch = createTouch(100, 200);

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [startTouch]));
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [], [endTouch]));
      });

      expect(mockCallbacks.onSwipeDown).toHaveBeenCalledTimes(1);
      expect(mockCallbacks.onSwipeUp).not.toHaveBeenCalled();
    });

    it('should pass correct delta values on swipe down', () => {
      const { result } = renderHook(() => useGestures(mockCallbacks));

      const startTouch = createTouch(100, 100);
      const endTouch = createTouch(110, 250);

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [startTouch]));
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [], [endTouch]));
      });

      expect(mockCallbacks.onSwipeDown).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          deltaX: 10,
          deltaY: 150
        })
      );
    });

    it('should require minimum threshold for swipe down', () => {
      const { result } = renderHook(() =>
        useGestures({ ...mockCallbacks, threshold: 100 })
      );

      const startTouch = createTouch(100, 100);
      const endTouch = createTouch(100, 149);

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [startTouch]));
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [], [endTouch]));
      });

      expect(mockCallbacks.onSwipeDown).not.toHaveBeenCalled();
    });
  });

  describe('Tap Detection', () => {
    it('should detect single tap', () => {
      const { result } = renderHook(() => useGestures(mockCallbacks));

      const touch = createTouch(100, 100);

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [touch]));
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [], [touch]));
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(mockCallbacks.onTap).toHaveBeenCalledTimes(1);
    });

    it('should detect tap with minimal movement', () => {
      const { result } = renderHook(() => useGestures(mockCallbacks));

      const startTouch = createTouch(100, 100);
      const endTouch = createTouch(105, 105);

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [startTouch]));
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [], [endTouch]));
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(mockCallbacks.onTap).toHaveBeenCalledTimes(1);
    });

    it('should not detect tap if movement exceeds threshold', () => {
      const { result } = renderHook(() => useGestures(mockCallbacks));

      const startTouch = createTouch(100, 100);
      const endTouch = createTouch(115, 100);

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [startTouch]));
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [], [endTouch]));
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(mockCallbacks.onTap).not.toHaveBeenCalled();
    });

    it('should delay tap to check for double tap', () => {
      const { result } = renderHook(() => useGestures(mockCallbacks));

      const touch = createTouch(100, 100);

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [touch]));
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [], [touch]));
      });

      expect(mockCallbacks.onTap).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(mockCallbacks.onTap).toHaveBeenCalledTimes(1);
    });
  });

  describe('Double Tap Detection', () => {
    it('should detect double tap', () => {
      const { result } = renderHook(() => useGestures(mockCallbacks));

      const touch = createTouch(100, 100);

      // First tap
      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [touch]));
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [], [touch]));
      });

      // Second tap within 300ms
      act(() => {
        jest.advanceTimersByTime(100);
        result.current.onTouchStart(createTouchEvent('touchstart', [touch]));
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [], [touch]));
      });

      expect(mockCallbacks.onDoubleTap).toHaveBeenCalledTimes(1);
      expect(mockCallbacks.onTap).not.toHaveBeenCalled();
    });

    it('should cancel single tap on double tap', () => {
      const { result } = renderHook(() => useGestures(mockCallbacks));

      const touch = createTouch(100, 100);

      // First tap
      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [touch]));
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [], [touch]));
      });

      // Second tap quickly
      act(() => {
        jest.advanceTimersByTime(50);
        result.current.onTouchStart(createTouchEvent('touchstart', [touch]));
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [], [touch]));
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(mockCallbacks.onDoubleTap).toHaveBeenCalledTimes(1);
      expect(mockCallbacks.onTap).not.toHaveBeenCalled();
    });

    it('should not detect double tap if taps are too far apart', () => {
      const { result } = renderHook(() => useGestures(mockCallbacks));

      const touch = createTouch(100, 100);

      // First tap
      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [touch]));
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [], [touch]));
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(mockCallbacks.onTap).toHaveBeenCalledTimes(1);

      // Second tap after 300ms
      act(() => {
        jest.advanceTimersByTime(100);
        result.current.onTouchStart(createTouchEvent('touchstart', [touch]));
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [], [touch]));
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(mockCallbacks.onDoubleTap).not.toHaveBeenCalled();
      expect(mockCallbacks.onTap).toHaveBeenCalledTimes(2);
    });

    it('should reset last tap after double tap', () => {
      const { result } = renderHook(() => useGestures(mockCallbacks));

      const touch = createTouch(100, 100);

      // Double tap
      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [touch]));
        result.current.onTouchEnd(createTouchEvent('touchend', [], [touch]));
        jest.advanceTimersByTime(100);
        result.current.onTouchStart(createTouchEvent('touchstart', [touch]));
        result.current.onTouchEnd(createTouchEvent('touchend', [], [touch]));
      });

      expect(mockCallbacks.onDoubleTap).toHaveBeenCalledTimes(1);

      // Third tap should be single tap
      act(() => {
        jest.advanceTimersByTime(400);
        result.current.onTouchStart(createTouchEvent('touchstart', [touch]));
        result.current.onTouchEnd(createTouchEvent('touchend', [], [touch]));
        jest.advanceTimersByTime(300);
      });

      expect(mockCallbacks.onTap).toHaveBeenCalledTimes(1);
    });
  });

  describe('Long Press Detection', () => {
    it('should detect long press', () => {
      const { result } = renderHook(() => useGestures(mockCallbacks));

      const touch = createTouch(100, 100);

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [touch]));
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(mockCallbacks.onLongPress).toHaveBeenCalledTimes(1);
    });

    it('should not trigger long press if released early', () => {
      const { result } = renderHook(() => useGestures(mockCallbacks));

      const touch = createTouch(100, 100);

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [touch]));
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [], [touch]));
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(mockCallbacks.onLongPress).not.toHaveBeenCalled();
    });

    it('should cancel long press on touch move', () => {
      const { result } = renderHook(() => useGestures(mockCallbacks));

      const touch = createTouch(100, 100);

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [touch]));
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      act(() => {
        result.current.onTouchMove(createTouchEvent('touchmove', [touch]));
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(mockCallbacks.onLongPress).not.toHaveBeenCalled();
    });

    it('should not start long press timer if callback not provided', () => {
      const { result } = renderHook(() =>
        useGestures({ onTap: jest.fn() })
      );

      const touch = createTouch(100, 100);

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [touch]));
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should not throw error
      expect(true).toBe(true);
    });

    it('should cleanup long press timer on touch end', () => {
      const { result } = renderHook(() => useGestures(mockCallbacks));

      const touch = createTouch(100, 100);

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [touch]));
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [], [touch]));
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(mockCallbacks.onLongPress).not.toHaveBeenCalled();
    });
  });

  describe('Time Threshold', () => {
    it('should not detect swipe if time exceeds threshold', () => {
      const { result } = renderHook(() =>
        useGestures({ ...mockCallbacks, timeThreshold: 200 })
      );

      const startTouch = createTouch(100, 100);
      const endTouch = createTouch(200, 100);

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [startTouch]));
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [], [endTouch]));
      });

      expect(mockCallbacks.onSwipeRight).not.toHaveBeenCalled();
    });

    it('should detect swipe within time threshold', () => {
      const { result } = renderHook(() =>
        useGestures({ ...mockCallbacks, timeThreshold: 400 })
      );

      const startTouch = createTouch(100, 100);
      const endTouch = createTouch(200, 100);

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [startTouch]));
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [], [endTouch]));
      });

      expect(mockCallbacks.onSwipeRight).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle touch end without touch start', () => {
      const { result } = renderHook(() => useGestures(mockCallbacks));

      const endTouch = createTouch(200, 100);

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [], [endTouch]));
      });

      expect(mockCallbacks.onSwipeRight).not.toHaveBeenCalled();
    });

    it('should handle touch move without touch start', () => {
      const { result } = renderHook(() => useGestures(mockCallbacks));

      const touch = createTouch(200, 100);

      act(() => {
        result.current.onTouchMove(createTouchEvent('touchmove', [touch]));
      });

      // Should not throw
      expect(true).toBe(true);
    });

    it('should handle same position touch start and end', () => {
      const { result } = renderHook(() => useGestures(mockCallbacks));

      const touch = createTouch(100, 100);

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [touch]));
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [], [touch]));
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(mockCallbacks.onTap).toHaveBeenCalledTimes(1);
    });

    it('should handle zero threshold', () => {
      const { result } = renderHook(() =>
        useGestures({ ...mockCallbacks, threshold: 0 })
      );

      const startTouch = createTouch(100, 100);
      const endTouch = createTouch(101, 100);

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [startTouch]));
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [], [endTouch]));
      });

      expect(mockCallbacks.onSwipeRight).toHaveBeenCalledTimes(1);
    });

    it('should handle negative coordinates', () => {
      const { result } = renderHook(() => useGestures(mockCallbacks));

      const startTouch = createTouch(-100, -100);
      const endTouch = createTouch(-200, -100);

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [startTouch]));
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [], [endTouch]));
      });

      expect(mockCallbacks.onSwipeLeft).toHaveBeenCalledTimes(1);
    });

    it('should handle very large coordinates', () => {
      const { result } = renderHook(() => useGestures(mockCallbacks));

      const startTouch = createTouch(10000, 10000);
      const endTouch = createTouch(10200, 10000);

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [startTouch]));
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [], [endTouch]));
      });

      expect(mockCallbacks.onSwipeRight).toHaveBeenCalledTimes(1);
    });
  });

  describe('Callback Combinations', () => {
    it('should handle only swipe callbacks', () => {
      const callbacks = {
        onSwipeLeft: jest.fn(),
        onSwipeRight: jest.fn()
      };

      const { result } = renderHook(() => useGestures(callbacks));

      const startTouch = createTouch(100, 100);
      const endTouch = createTouch(200, 100);

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [startTouch]));
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [], [endTouch]));
      });

      expect(callbacks.onSwipeRight).toHaveBeenCalledTimes(1);
    });

    it('should handle only tap callbacks', () => {
      const callbacks = {
        onTap: jest.fn(),
        onDoubleTap: jest.fn()
      };

      const { result } = renderHook(() => useGestures(callbacks));

      const touch = createTouch(100, 100);

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [touch]));
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [], [touch]));
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(callbacks.onTap).toHaveBeenCalledTimes(1);
    });
  });
});

describe('SwipeableContainer Component', () => {
  let mockCallbacks;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCallbacks = {
      onSwipeLeft: jest.fn(),
      onSwipeRight: jest.fn()
    };
  });

  describe('Component Rendering', () => {
    it('should render children', () => {
      render(
        <SwipeableContainer {...mockCallbacks}>
          <div data-testid="child">Test Content</div>
        </SwipeableContainer>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should apply default className', () => {
      const { container } = render(
        <SwipeableContainer {...mockCallbacks}>
          <div>Content</div>
        </SwipeableContainer>
      );

      const swipeableDiv = container.querySelector('.swipeable-container');
      expect(swipeableDiv).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <SwipeableContainer {...mockCallbacks} className="custom-class">
          <div>Content</div>
        </SwipeableContainer>
      );

      const swipeableDiv = container.querySelector('.swipeable-container.custom-class');
      expect(swipeableDiv).toBeInTheDocument();
    });

    it('should pass through additional props', () => {
      const { container } = render(
        <SwipeableContainer
          {...mockCallbacks}
          data-testid="swipeable"
          aria-label="Swipeable content"
        >
          <div>Content</div>
        </SwipeableContainer>
      );

      const swipeableDiv = screen.getByTestId('swipeable');
      expect(swipeableDiv).toHaveAttribute('aria-label', 'Swipeable content');
    });
  });

  describe('Swipe Interactions', () => {
    it('should detect swipe left', () => {
      const { container } = render(
        <SwipeableContainer {...mockCallbacks}>
          <div>Content</div>
        </SwipeableContainer>
      );

      const swipeableDiv = container.querySelector('.swipeable-container');

      const startTouch = createTouch(200, 100);
      const endTouch = createTouch(100, 100);

      act(() => {
        swipeableDiv.dispatchEvent(createTouchEvent('touchstart', [startTouch]));
      });

      act(() => {
        swipeableDiv.dispatchEvent(createTouchEvent('touchend', [], [endTouch]));
      });

      expect(mockCallbacks.onSwipeLeft).toHaveBeenCalledTimes(1);
    });

    it('should detect swipe right', () => {
      const { container } = render(
        <SwipeableContainer {...mockCallbacks}>
          <div>Content</div>
        </SwipeableContainer>
      );

      const swipeableDiv = container.querySelector('.swipeable-container');

      const startTouch = createTouch(100, 100);
      const endTouch = createTouch(200, 100);

      act(() => {
        swipeableDiv.dispatchEvent(createTouchEvent('touchstart', [startTouch]));
      });

      act(() => {
        swipeableDiv.dispatchEvent(createTouchEvent('touchend', [], [endTouch]));
      });

      expect(mockCallbacks.onSwipeRight).toHaveBeenCalledTimes(1);
    });

    it('should work without swipe callbacks', () => {
      const { container } = render(
        <SwipeableContainer>
          <div>Content</div>
        </SwipeableContainer>
      );

      const swipeableDiv = container.querySelector('.swipeable-container');

      const startTouch = createTouch(100, 100);
      const endTouch = createTouch(200, 100);

      act(() => {
        swipeableDiv.dispatchEvent(createTouchEvent('touchstart', [startTouch]));
      });

      act(() => {
        swipeableDiv.dispatchEvent(createTouchEvent('touchend', [], [endTouch]));
      });

      // Should not throw
      expect(true).toBe(true);
    });
  });
});

describe('PullToRefresh Component', () => {
  let mockOnRefresh;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnRefresh = jest.fn(() => Promise.resolve());
  });

  describe('Component Rendering', () => {
    it('should render children', () => {
      render(
        <PullToRefresh onRefresh={mockOnRefresh}>
          <div data-testid="child">Test Content</div>
        </PullToRefresh>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should apply default className', () => {
      const { container } = render(
        <PullToRefresh onRefresh={mockOnRefresh}>
          <div>Content</div>
        </PullToRefresh>
      );

      const pullToRefreshDiv = container.querySelector('.pull-to-refresh');
      expect(pullToRefreshDiv).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <PullToRefresh onRefresh={mockOnRefresh} className="custom-class">
          <div>Content</div>
        </PullToRefresh>
      );

      const pullToRefreshDiv = container.querySelector('.pull-to-refresh.custom-class');
      expect(pullToRefreshDiv).toBeInTheDocument();
    });

    it('should render refresh indicator', () => {
      const { container } = render(
        <PullToRefresh onRefresh={mockOnRefresh}>
          <div>Content</div>
        </PullToRefresh>
      );

      const indicator = container.querySelector('.pull-refresh-indicator');
      expect(indicator).toBeInTheDocument();
    });

    it('should render refresh spinner', () => {
      const { container } = render(
        <PullToRefresh onRefresh={mockOnRefresh}>
          <div>Content</div>
        </PullToRefresh>
      );

      const spinner = container.querySelector('.refresh-spinner');
      expect(spinner).toBeInTheDocument();
    });

    it('should render refresh text', () => {
      render(
        <PullToRefresh onRefresh={mockOnRefresh}>
          <div>Content</div>
        </PullToRefresh>
      );

      expect(screen.getByText('Pull to refresh')).toBeInTheDocument();
    });
  });

  describe('Pull Gesture', () => {
    it('should start pulling when at top of scroll', () => {
      const { container } = render(
        <PullToRefresh onRefresh={mockOnRefresh}>
          <div>Content</div>
        </PullToRefresh>
      );

      const content = container.querySelector('.pull-refresh-content');
      Object.defineProperty(content, 'scrollTop', { value: 0, writable: true });

      const startTouch = createTouch(100, 100);

      act(() => {
        content.dispatchEvent(createTouchEvent('touchstart', [startTouch]));
      });

      const moveTouch = createTouch(100, 150);

      act(() => {
        content.dispatchEvent(createTouchEvent('touchmove', [moveTouch]));
      });

      // Pull distance should be set
      expect(container.querySelector('.pull-refresh-content').style.transform).toContain('translateY');
    });

    it('should not start pulling when scrolled down', () => {
      const { container } = render(
        <PullToRefresh onRefresh={mockOnRefresh}>
          <div>Content</div>
        </PullToRefresh>
      );

      const content = container.querySelector('.pull-refresh-content');
      Object.defineProperty(content, 'scrollTop', { value: 100, writable: true });

      const startTouch = createTouch(100, 100);

      act(() => {
        content.dispatchEvent(createTouchEvent('touchstart', [startTouch]));
      });

      const moveTouch = createTouch(100, 150);

      act(() => {
        content.dispatchEvent(createTouchEvent('touchmove', [moveTouch]));
      });

      // Should not pull
      const transform = container.querySelector('.pull-refresh-content').style.transform;
      expect(transform === '' || transform === 'translateY(0px)').toBe(true);
    });

    it('should update pull distance on move', () => {
      const { container } = render(
        <PullToRefresh onRefresh={mockOnRefresh}>
          <div>Content</div>
        </PullToRefresh>
      );

      const content = container.querySelector('.pull-refresh-content');
      Object.defineProperty(content, 'scrollTop', { value: 0, writable: true });

      const startTouch = createTouch(100, 100);

      act(() => {
        content.dispatchEvent(createTouchEvent('touchstart', [startTouch]));
      });

      const moveTouch = createTouch(100, 200);

      act(() => {
        content.dispatchEvent(createTouchEvent('touchmove', [moveTouch]));
      });

      const transform = container.querySelector('.pull-refresh-content').style.transform;
      expect(transform).toContain('translateY');
      expect(transform).not.toBe('translateY(0px)');
    });

    it('should limit pull distance', () => {
      const { container } = render(
        <PullToRefresh onRefresh={mockOnRefresh} threshold={80}>
          <div>Content</div>
        </PullToRefresh>
      );

      const content = container.querySelector('.pull-refresh-content');
      Object.defineProperty(content, 'scrollTop', { value: 0, writable: true });

      const startTouch = createTouch(100, 100);

      act(() => {
        content.dispatchEvent(createTouchEvent('touchstart', [startTouch]));
      });

      const moveTouch = createTouch(100, 500);

      act(() => {
        content.dispatchEvent(createTouchEvent('touchmove', [moveTouch]));
      });

      const transform = container.querySelector('.pull-refresh-content').style.transform;
      const translateY = parseFloat(transform.match(/translateY\(([\d.]+)px\)/)?.[1] || 0);

      // Should not exceed threshold * 1.5
      expect(translateY).toBeLessThanOrEqual(120);
    });
  });

  describe('Refresh Trigger', () => {
    it('should trigger refresh when threshold is reached', async () => {
      const { container } = render(
        <PullToRefresh onRefresh={mockOnRefresh} threshold={80}>
          <div>Content</div>
        </PullToRefresh>
      );

      const content = container.querySelector('.pull-refresh-content');
      Object.defineProperty(content, 'scrollTop', { value: 0, writable: true });

      const startTouch = createTouch(100, 100);

      act(() => {
        content.dispatchEvent(createTouchEvent('touchstart', [startTouch]));
      });

      const moveTouch = createTouch(100, 300);

      act(() => {
        content.dispatchEvent(createTouchEvent('touchmove', [moveTouch]));
      });

      act(() => {
        content.dispatchEvent(createTouchEvent('touchend', []));
      });

      await waitFor(() => {
        expect(mockOnRefresh).toHaveBeenCalledTimes(1);
      });
    });

    it('should not trigger refresh when threshold is not reached', async () => {
      const { container } = render(
        <PullToRefresh onRefresh={mockOnRefresh} threshold={80}>
          <div>Content</div>
        </PullToRefresh>
      );

      const content = container.querySelector('.pull-refresh-content');
      Object.defineProperty(content, 'scrollTop', { value: 0, writable: true });

      const startTouch = createTouch(100, 100);

      act(() => {
        content.dispatchEvent(createTouchEvent('touchstart', [startTouch]));
      });

      const moveTouch = createTouch(100, 150);

      act(() => {
        content.dispatchEvent(createTouchEvent('touchmove', [moveTouch]));
      });

      act(() => {
        content.dispatchEvent(createTouchEvent('touchend', []));
      });

      await waitFor(() => {
        expect(mockOnRefresh).not.toHaveBeenCalled();
      });
    });

    it('should show refreshing state', async () => {
      const { container } = render(
        <PullToRefresh onRefresh={mockOnRefresh} threshold={80}>
          <div>Content</div>
        </PullToRefresh>
      );

      const content = container.querySelector('.pull-refresh-content');
      Object.defineProperty(content, 'scrollTop', { value: 0, writable: true });

      const startTouch = createTouch(100, 100);

      act(() => {
        content.dispatchEvent(createTouchEvent('touchstart', [startTouch]));
      });

      const moveTouch = createTouch(100, 300);

      act(() => {
        content.dispatchEvent(createTouchEvent('touchmove', [moveTouch]));
      });

      act(() => {
        content.dispatchEvent(createTouchEvent('touchend', []));
      });

      await waitFor(() => {
        expect(screen.getByText('Refreshing...')).toBeInTheDocument();
      });
    });

    it('should reset state after refresh completes', async () => {
      const { container } = render(
        <PullToRefresh onRefresh={mockOnRefresh} threshold={80}>
          <div>Content</div>
        </PullToRefresh>
      );

      const content = container.querySelector('.pull-refresh-content');
      Object.defineProperty(content, 'scrollTop', { value: 0, writable: true });

      const startTouch = createTouch(100, 100);

      act(() => {
        content.dispatchEvent(createTouchEvent('touchstart', [startTouch]));
      });

      const moveTouch = createTouch(100, 300);

      act(() => {
        content.dispatchEvent(createTouchEvent('touchmove', [moveTouch]));
      });

      act(() => {
        content.dispatchEvent(createTouchEvent('touchend', []));
      });

      await waitFor(() => {
        expect(mockOnRefresh).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(screen.getByText('Pull to refresh')).toBeInTheDocument();
      });
    });
  });

  describe('Refresh Text States', () => {
    it('should show "Pull to refresh" initially', () => {
      render(
        <PullToRefresh onRefresh={mockOnRefresh}>
          <div>Content</div>
        </PullToRefresh>
      );

      expect(screen.getByText('Pull to refresh')).toBeInTheDocument();
    });

    it('should show "Release to refresh" when threshold reached', () => {
      const { container } = render(
        <PullToRefresh onRefresh={mockOnRefresh} threshold={80}>
          <div>Content</div>
        </PullToRefresh>
      );

      const content = container.querySelector('.pull-refresh-content');
      Object.defineProperty(content, 'scrollTop', { value: 0, writable: true });

      const startTouch = createTouch(100, 100);

      act(() => {
        content.dispatchEvent(createTouchEvent('touchstart', [startTouch]));
      });

      const moveTouch = createTouch(100, 300);

      act(() => {
        content.dispatchEvent(createTouchEvent('touchmove', [moveTouch]));
      });

      expect(screen.getByText('Release to refresh')).toBeInTheDocument();
    });

    it('should show "Refreshing..." during refresh', async () => {
      const { container } = render(
        <PullToRefresh onRefresh={mockOnRefresh} threshold={80}>
          <div>Content</div>
        </PullToRefresh>
      );

      const content = container.querySelector('.pull-refresh-content');
      Object.defineProperty(content, 'scrollTop', { value: 0, writable: true });

      const startTouch = createTouch(100, 100);

      act(() => {
        content.dispatchEvent(createTouchEvent('touchstart', [startTouch]));
      });

      const moveTouch = createTouch(100, 300);

      act(() => {
        content.dispatchEvent(createTouchEvent('touchmove', [moveTouch]));
      });

      act(() => {
        content.dispatchEvent(createTouchEvent('touchend', []));
      });

      await waitFor(() => {
        expect(screen.getByText('Refreshing...')).toBeInTheDocument();
      });
    });
  });

  describe('Spinner Animation', () => {
    it('should rotate spinner based on pull progress', () => {
      const { container } = render(
        <PullToRefresh onRefresh={mockOnRefresh} threshold={80}>
          <div>Content</div>
        </PullToRefresh>
      );

      const content = container.querySelector('.pull-refresh-content');
      Object.defineProperty(content, 'scrollTop', { value: 0, writable: true });

      const startTouch = createTouch(100, 100);

      act(() => {
        content.dispatchEvent(createTouchEvent('touchstart', [startTouch]));
      });

      const moveTouch = createTouch(100, 180);

      act(() => {
        content.dispatchEvent(createTouchEvent('touchmove', [moveTouch]));
      });

      const spinner = container.querySelector('.refresh-spinner');
      expect(spinner.style.transform).toContain('rotate');
    });

    it('should add spinning class when refreshing', async () => {
      const { container } = render(
        <PullToRefresh onRefresh={mockOnRefresh} threshold={80}>
          <div>Content</div>
        </PullToRefresh>
      );

      const content = container.querySelector('.pull-refresh-content');
      Object.defineProperty(content, 'scrollTop', { value: 0, writable: true });

      const startTouch = createTouch(100, 100);

      act(() => {
        content.dispatchEvent(createTouchEvent('touchstart', [startTouch]));
      });

      const moveTouch = createTouch(100, 300);

      act(() => {
        content.dispatchEvent(createTouchEvent('touchmove', [moveTouch]));
      });

      act(() => {
        content.dispatchEvent(createTouchEvent('touchend', []));
      });

      await waitFor(() => {
        const spinner = container.querySelector('.refresh-spinner.spinning');
        expect(spinner).toBeInTheDocument();
      });
    });
  });

  describe('Controlled Refreshing Prop', () => {
    it('should show refreshing state when prop is true', () => {
      render(
        <PullToRefresh onRefresh={mockOnRefresh} refreshing={true}>
          <div>Content</div>
        </PullToRefresh>
      );

      expect(screen.getByText('Refreshing...')).toBeInTheDocument();
    });

    it('should update when refreshing prop changes', () => {
      const { rerender } = render(
        <PullToRefresh onRefresh={mockOnRefresh} refreshing={false}>
          <div>Content</div>
        </PullToRefresh>
      );

      expect(screen.getByText('Pull to refresh')).toBeInTheDocument();

      rerender(
        <PullToRefresh onRefresh={mockOnRefresh} refreshing={true}>
          <div>Content</div>
        </PullToRefresh>
      );

      expect(screen.getByText('Refreshing...')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should not pull when already refreshing', () => {
      const { container } = render(
        <PullToRefresh onRefresh={mockOnRefresh} refreshing={true} threshold={80}>
          <div>Content</div>
        </PullToRefresh>
      );

      const content = container.querySelector('.pull-refresh-content');
      Object.defineProperty(content, 'scrollTop', { value: 0, writable: true });

      const startTouch = createTouch(100, 100);

      act(() => {
        content.dispatchEvent(createTouchEvent('touchstart', [startTouch]));
      });

      const moveTouch = createTouch(100, 300);

      act(() => {
        content.dispatchEvent(createTouchEvent('touchmove', [moveTouch]));
      });

      // Pull distance should remain 0
      const transform = container.querySelector('.pull-refresh-content').style.transform;
      expect(transform === '' || transform === 'translateY(0px)').toBe(true);
    });

    it('should handle onRefresh returning rejected promise', async () => {
      const failingRefresh = jest.fn(() => Promise.reject(new Error('Refresh failed')));

      const { container } = render(
        <PullToRefresh onRefresh={failingRefresh} threshold={80}>
          <div>Content</div>
        </PullToRefresh>
      );

      const content = container.querySelector('.pull-refresh-content');
      Object.defineProperty(content, 'scrollTop', { value: 0, writable: true });

      const startTouch = createTouch(100, 100);

      act(() => {
        content.dispatchEvent(createTouchEvent('touchstart', [startTouch]));
      });

      const moveTouch = createTouch(100, 300);

      act(() => {
        content.dispatchEvent(createTouchEvent('touchmove', [moveTouch]));
      });

      act(() => {
        content.dispatchEvent(createTouchEvent('touchend', []));
      });

      await waitFor(() => {
        expect(screen.getByText('Pull to refresh')).toBeInTheDocument();
      });
    });

    it('should not trigger refresh without onRefresh callback', async () => {
      const { container } = render(
        <PullToRefresh threshold={80}>
          <div>Content</div>
        </PullToRefresh>
      );

      const content = container.querySelector('.pull-refresh-content');
      Object.defineProperty(content, 'scrollTop', { value: 0, writable: true });

      const startTouch = createTouch(100, 100);

      act(() => {
        content.dispatchEvent(createTouchEvent('touchstart', [startTouch]));
      });

      const moveTouch = createTouch(100, 300);

      act(() => {
        content.dispatchEvent(createTouchEvent('touchmove', [moveTouch]));
      });

      act(() => {
        content.dispatchEvent(createTouchEvent('touchend', []));
      });

      // Should not throw
      expect(true).toBe(true);
    });

    it('should handle custom threshold', () => {
      const { container } = render(
        <PullToRefresh onRefresh={mockOnRefresh} threshold={120}>
          <div>Content</div>
        </PullToRefresh>
      );

      expect(container.querySelector('.pull-to-refresh')).toBeInTheDocument();
    });
  });
});

describe('Draggable Component', () => {
  let mockCallbacks;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCallbacks = {
      onDrag: jest.fn(),
      onDragEnd: jest.fn()
    };
  });

  describe('Component Rendering', () => {
    it('should render children', () => {
      render(
        <Draggable {...mockCallbacks}>
          <div data-testid="child">Drag Me</div>
        </Draggable>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Drag Me')).toBeInTheDocument();
    });

    it('should apply draggable className', () => {
      const { container } = render(
        <Draggable {...mockCallbacks}>
          <div>Content</div>
        </Draggable>
      );

      const draggableDiv = container.querySelector('.draggable');
      expect(draggableDiv).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <Draggable {...mockCallbacks} className="custom-drag">
          <div>Content</div>
        </Draggable>
      );

      const draggableDiv = container.querySelector('.draggable.custom-drag');
      expect(draggableDiv).toBeInTheDocument();
    });

    it('should apply initial styles', () => {
      const { container } = render(
        <Draggable {...mockCallbacks}>
          <div>Content</div>
        </Draggable>
      );

      const draggableDiv = container.querySelector('.draggable');
      expect(draggableDiv.style.transform).toBe('translate3d(0px, 0px, 0)');
      expect(draggableDiv.style.touchAction).toBe('none');
      expect(draggableDiv.style.userSelect).toBe('none');
    });

    it('should pass through additional props', () => {
      const { container } = render(
        <Draggable
          {...mockCallbacks}
          data-testid="draggable"
          aria-label="Draggable item"
        >
          <div>Content</div>
        </Draggable>
      );

      const draggableDiv = screen.getByTestId('draggable');
      expect(draggableDiv).toHaveAttribute('aria-label', 'Draggable item');
    });
  });

  describe('Drag Interactions', () => {
    it('should handle drag start', () => {
      const { container } = render(
        <Draggable {...mockCallbacks}>
          <div>Content</div>
        </Draggable>
      );

      const draggableDiv = container.querySelector('.draggable');
      const startTouch = createTouch(100, 100);

      act(() => {
        draggableDiv.dispatchEvent(createTouchEvent('touchstart', [startTouch]));
      });

      expect(draggableDiv.classList.contains('dragging')).toBe(true);
    });

    it('should update position during drag', () => {
      const { container } = render(
        <Draggable {...mockCallbacks}>
          <div>Content</div>
        </Draggable>
      );

      const draggableDiv = container.querySelector('.draggable');

      const startTouch = createTouch(100, 100);

      act(() => {
        draggableDiv.dispatchEvent(createTouchEvent('touchstart', [startTouch]));
      });

      const moveTouch = createTouch(150, 150);

      act(() => {
        draggableDiv.dispatchEvent(createTouchEvent('touchmove', [moveTouch]));
      });

      expect(draggableDiv.style.transform).toContain('translate3d(50px, 50px');
    });

    it('should call onDrag callback during drag', () => {
      const { container } = render(
        <Draggable {...mockCallbacks}>
          <div>Content</div>
        </Draggable>
      );

      const draggableDiv = container.querySelector('.draggable');

      const startTouch = createTouch(100, 100);

      act(() => {
        draggableDiv.dispatchEvent(createTouchEvent('touchstart', [startTouch]));
      });

      const moveTouch = createTouch(150, 150);

      act(() => {
        draggableDiv.dispatchEvent(createTouchEvent('touchmove', [moveTouch]));
      });

      expect(mockCallbacks.onDrag).toHaveBeenCalledWith({ x: 50, y: 50 });
    });

    it('should handle drag end', () => {
      const { container } = render(
        <Draggable {...mockCallbacks}>
          <div>Content</div>
        </Draggable>
      );

      const draggableDiv = container.querySelector('.draggable');

      const startTouch = createTouch(100, 100);

      act(() => {
        draggableDiv.dispatchEvent(createTouchEvent('touchstart', [startTouch]));
      });

      const moveTouch = createTouch(150, 150);

      act(() => {
        draggableDiv.dispatchEvent(createTouchEvent('touchmove', [moveTouch]));
      });

      act(() => {
        draggableDiv.dispatchEvent(createTouchEvent('touchend', []));
      });

      expect(draggableDiv.classList.contains('dragging')).toBe(false);
      expect(mockCallbacks.onDragEnd).toHaveBeenCalledWith({ x: 50, y: 50 });
    });

    it('should maintain position after drag', () => {
      const { container } = render(
        <Draggable {...mockCallbacks}>
          <div>Content</div>
        </Draggable>
      );

      const draggableDiv = container.querySelector('.draggable');

      const startTouch = createTouch(100, 100);

      act(() => {
        draggableDiv.dispatchEvent(createTouchEvent('touchstart', [startTouch]));
      });

      const moveTouch = createTouch(200, 200);

      act(() => {
        draggableDiv.dispatchEvent(createTouchEvent('touchmove', [moveTouch]));
      });

      act(() => {
        draggableDiv.dispatchEvent(createTouchEvent('touchend', []));
      });

      expect(draggableDiv.style.transform).toContain('translate3d(100px, 100px');
    });

    it('should handle multiple drag sequences', () => {
      const { container } = render(
        <Draggable {...mockCallbacks}>
          <div>Content</div>
        </Draggable>
      );

      const draggableDiv = container.querySelector('.draggable');

      // First drag
      act(() => {
        draggableDiv.dispatchEvent(createTouchEvent('touchstart', [createTouch(100, 100)]));
        draggableDiv.dispatchEvent(createTouchEvent('touchmove', [createTouch(150, 150)]));
        draggableDiv.dispatchEvent(createTouchEvent('touchend', []));
      });

      expect(draggableDiv.style.transform).toContain('translate3d(50px, 50px');

      // Second drag
      act(() => {
        draggableDiv.dispatchEvent(createTouchEvent('touchstart', [createTouch(150, 150)]));
        draggableDiv.dispatchEvent(createTouchEvent('touchmove', [createTouch(200, 200)]));
        draggableDiv.dispatchEvent(createTouchEvent('touchend', []));
      });

      expect(draggableDiv.style.transform).toContain('translate3d(100px, 100px');
    });
  });

  describe('Bounds Constraints', () => {
    it('should constrain drag to bounds', () => {
      const bounds = { left: 0, right: 100, top: 0, bottom: 100 };

      const { container } = render(
        <Draggable {...mockCallbacks} bounds={bounds}>
          <div>Content</div>
        </Draggable>
      );

      const draggableDiv = container.querySelector('.draggable');

      const startTouch = createTouch(50, 50);

      act(() => {
        draggableDiv.dispatchEvent(createTouchEvent('touchstart', [startTouch]));
      });

      const moveTouch = createTouch(250, 250);

      act(() => {
        draggableDiv.dispatchEvent(createTouchEvent('touchmove', [moveTouch]));
      });

      expect(draggableDiv.style.transform).toContain('translate3d(100px, 100px');
    });

    it('should constrain left boundary', () => {
      const bounds = { left: 0, right: 200, top: 0, bottom: 200 };

      const { container } = render(
        <Draggable {...mockCallbacks} bounds={bounds}>
          <div>Content</div>
        </Draggable>
      );

      const draggableDiv = container.querySelector('.draggable');

      act(() => {
        draggableDiv.dispatchEvent(createTouchEvent('touchstart', [createTouch(100, 100)]));
        draggableDiv.dispatchEvent(createTouchEvent('touchmove', [createTouch(-100, 100)]));
      });

      expect(draggableDiv.style.transform).toContain('translate3d(0px');
    });

    it('should constrain right boundary', () => {
      const bounds = { left: 0, right: 100, top: 0, bottom: 200 };

      const { container } = render(
        <Draggable {...mockCallbacks} bounds={bounds}>
          <div>Content</div>
        </Draggable>
      );

      const draggableDiv = container.querySelector('.draggable');

      act(() => {
        draggableDiv.dispatchEvent(createTouchEvent('touchstart', [createTouch(50, 50)]));
        draggableDiv.dispatchEvent(createTouchEvent('touchmove', [createTouch(250, 50)]));
      });

      expect(draggableDiv.style.transform).toContain('translate3d(100px');
    });

    it('should constrain top boundary', () => {
      const bounds = { left: 0, right: 200, top: 0, bottom: 200 };

      const { container } = render(
        <Draggable {...mockCallbacks} bounds={bounds}>
          <div>Content</div>
        </Draggable>
      );

      const draggableDiv = container.querySelector('.draggable');

      act(() => {
        draggableDiv.dispatchEvent(createTouchEvent('touchstart', [createTouch(100, 100)]));
        draggableDiv.dispatchEvent(createTouchEvent('touchmove', [createTouch(100, -100)]));
      });

      expect(draggableDiv.style.transform).toContain('0px, 0)');
    });

    it('should constrain bottom boundary', () => {
      const bounds = { left: 0, right: 200, top: 0, bottom: 100 };

      const { container } = render(
        <Draggable {...mockCallbacks} bounds={bounds}>
          <div>Content</div>
        </Draggable>
      );

      const draggableDiv = container.querySelector('.draggable');

      act(() => {
        draggableDiv.dispatchEvent(createTouchEvent('touchstart', [createTouch(50, 50)]));
        draggableDiv.dispatchEvent(createTouchEvent('touchmove', [createTouch(50, 250)]));
      });

      expect(draggableDiv.style.transform).toContain('100px, 0)');
    });

    it('should work without bounds', () => {
      const { container } = render(
        <Draggable {...mockCallbacks}>
          <div>Content</div>
        </Draggable>
      );

      const draggableDiv = container.querySelector('.draggable');

      act(() => {
        draggableDiv.dispatchEvent(createTouchEvent('touchstart', [createTouch(100, 100)]));
        draggableDiv.dispatchEvent(createTouchEvent('touchmove', [createTouch(500, 500)]));
      });

      expect(draggableDiv.style.transform).toContain('translate3d(400px, 400px');
    });
  });

  describe('Edge Cases', () => {
    it('should not drag when not started', () => {
      const { container } = render(
        <Draggable {...mockCallbacks}>
          <div>Content</div>
        </Draggable>
      );

      const draggableDiv = container.querySelector('.draggable');

      act(() => {
        draggableDiv.dispatchEvent(createTouchEvent('touchmove', [createTouch(150, 150)]));
      });

      expect(mockCallbacks.onDrag).not.toHaveBeenCalled();
    });

    it('should work without callbacks', () => {
      const { container } = render(
        <Draggable>
          <div>Content</div>
        </Draggable>
      );

      const draggableDiv = container.querySelector('.draggable');

      act(() => {
        draggableDiv.dispatchEvent(createTouchEvent('touchstart', [createTouch(100, 100)]));
        draggableDiv.dispatchEvent(createTouchEvent('touchmove', [createTouch(150, 150)]));
        draggableDiv.dispatchEvent(createTouchEvent('touchend', []));
      });

      expect(draggableDiv.style.transform).toContain('translate3d(50px, 50px');
    });

    it('should handle negative coordinates', () => {
      const { container } = render(
        <Draggable {...mockCallbacks}>
          <div>Content</div>
        </Draggable>
      );

      const draggableDiv = container.querySelector('.draggable');

      act(() => {
        draggableDiv.dispatchEvent(createTouchEvent('touchstart', [createTouch(100, 100)]));
        draggableDiv.dispatchEvent(createTouchEvent('touchmove', [createTouch(50, 50)]));
      });

      expect(draggableDiv.style.transform).toContain('translate3d(-50px, -50px');
    });

    it('should not call onDragEnd if not dragging', () => {
      const { container } = render(
        <Draggable {...mockCallbacks}>
          <div>Content</div>
        </Draggable>
      );

      const draggableDiv = container.querySelector('.draggable');

      act(() => {
        draggableDiv.dispatchEvent(createTouchEvent('touchend', []));
      });

      expect(mockCallbacks.onDragEnd).not.toHaveBeenCalled();
    });

    it('should prevent default on touch events', () => {
      const { container } = render(
        <Draggable {...mockCallbacks}>
          <div>Content</div>
        </Draggable>
      );

      const draggableDiv = container.querySelector('.draggable');

      const startEvent = createTouchEvent('touchstart', [createTouch(100, 100)]);
      const preventDefaultSpy = jest.spyOn(startEvent, 'preventDefault');

      act(() => {
        draggableDiv.dispatchEvent(startEvent);
      });

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });
});

describe('Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle multiple gesture components together', () => {
    const mockSwipe = jest.fn();
    const mockRefresh = jest.fn(() => Promise.resolve());

    render(
      <div>
        <SwipeableContainer onSwipeRight={mockSwipe}>
          <div>Swipeable</div>
        </SwipeableContainer>
        <PullToRefresh onRefresh={mockRefresh}>
          <div>Refreshable</div>
        </PullToRefresh>
        <Draggable>
          <div>Draggable</div>
        </Draggable>
      </div>
    );

    expect(screen.getByText('Swipeable')).toBeInTheDocument();
    expect(screen.getByText('Refreshable')).toBeInTheDocument();
    expect(screen.getByText('Draggable')).toBeInTheDocument();
  });

  it('should handle nested gesture components', () => {
    const mockSwipe = jest.fn();

    const { container } = render(
      <SwipeableContainer onSwipeRight={mockSwipe}>
        <Draggable>
          <div>Nested Content</div>
        </Draggable>
      </SwipeableContainer>
    );

    expect(screen.getByText('Nested Content')).toBeInTheDocument();
  });
});

export default createTouchEvent
