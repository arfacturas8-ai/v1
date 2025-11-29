/**
 * Tests for useAnimations hooks
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  usePrefersReducedMotion,
  useScrollAnimation,
  useStaggerAnimation,
  useLoadingState,
  usePageTransition,
  useInfiniteScroll,
  useAnimationVariants,
  useSequentialReveal,
  useHoverAnimation,
  useScrollProgress,
  useDebouncedAnimation,
  useAnimationQueue,
  usePerformanceMode,
  useSwipeAnimation
} from './useAnimations';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  useInView: jest.fn()
}));

import { useInView } from 'framer-motion';

describe('useAnimations', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    window.matchMedia = jest.fn().mockReturnValue({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('usePrefersReducedMotion', () => {
    it('returns false when user does not prefer reduced motion', () => {
      const { result } = renderHook(() => usePrefersReducedMotion());

      expect(result.current).toBe(false);
    });

    it('returns true when user prefers reduced motion', () => {
      window.matchMedia = jest.fn().mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      });

      const { result } = renderHook(() => usePrefersReducedMotion());

      expect(result.current).toBe(true);
    });

    it('updates when preference changes', () => {
      let changeHandler;
      window.matchMedia = jest.fn().mockReturnValue({
        matches: false,
        addEventListener: jest.fn((event, handler) => {
          changeHandler = handler;
        }),
        removeEventListener: jest.fn()
      });

      const { result } = renderHook(() => usePrefersReducedMotion());

      expect(result.current).toBe(false);

      // Simulate preference change
      act(() => {
        changeHandler({ matches: true });
      });

      expect(result.current).toBe(true);
    });
  });

  describe('useScrollAnimation', () => {
    it('returns ref and inView status', () => {
      useInView.mockReturnValue(false);

      const { result } = renderHook(() => useScrollAnimation());

      expect(result.current.ref).toBeDefined();
      expect(result.current.isInView).toBe(false);
    });

    it('passes options to useInView', () => {
      useInView.mockReturnValue(true);

      renderHook(() => useScrollAnimation({
        once: true,
        margin: '-50px',
        amount: 0.5
      }));

      expect(useInView).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          once: true,
          margin: '-50px',
          amount: 0.5
        })
      );
    });

    it('uses default options', () => {
      useInView.mockReturnValue(true);

      renderHook(() => useScrollAnimation());

      expect(useInView).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          once: true,
          margin: '-100px',
          amount: 0.3
        })
      );
    });
  });

  describe('useStaggerAnimation', () => {
    it('reveals items sequentially', () => {
      const { result } = renderHook(() => useStaggerAnimation(5, 0.1));

      expect(result.current).toBe(0);

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current).toBe(1);

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current).toBe(2);
    });

    it('reveals all items immediately with reduced motion', () => {
      window.matchMedia = jest.fn().mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      });

      const { result } = renderHook(() => useStaggerAnimation(5, 0.1));

      expect(result.current).toBe(5);
    });

    it('clears interval on unmount', () => {
      const { unmount } = renderHook(() => useStaggerAnimation(5, 0.1));

      const spy = jest.spyOn(global, 'clearInterval');

      unmount();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('useLoadingState', () => {
    it('shows loading immediately when true', () => {
      const { result } = renderHook(() => useLoadingState(true, 500));

      expect(result.current).toBe(true);
    });

    it('maintains minimum display time', () => {
      const { result, rerender } = renderHook(
        ({ isLoading }) => useLoadingState(isLoading, 500),
        { initialProps: { isLoading: true } }
      );

      expect(result.current).toBe(true);

      // Stop loading after 100ms
      act(() => {
        jest.advanceTimersByTime(100);
      });

      rerender({ isLoading: false });

      // Should still be showing
      expect(result.current).toBe(true);

      // Advance to minimum time
      act(() => {
        jest.advanceTimersByTime(400);
      });

      expect(result.current).toBe(false);
    });

    it('hides immediately if minimum time has passed', () => {
      const { result, rerender } = renderHook(
        ({ isLoading }) => useLoadingState(isLoading, 500),
        { initialProps: { isLoading: true } }
      );

      act(() => {
        jest.advanceTimersByTime(600);
      });

      rerender({ isLoading: false });

      act(() => {
        jest.advanceTimersByTime(1);
      });

      expect(result.current).toBe(false);
    });
  });

  describe('usePageTransition', () => {
    it('initializes with not transitioning', () => {
      const { result } = renderHook(() => usePageTransition());

      expect(result.current.isTransitioning).toBe(false);
    });

    it('starts transition', () => {
      const { result } = renderHook(() => usePageTransition());

      act(() => {
        result.current.startTransition();
      });

      expect(result.current.isTransitioning).toBe(true);
    });

    it('ends transition', () => {
      const { result } = renderHook(() => usePageTransition());

      act(() => {
        result.current.startTransition();
        result.current.endTransition();
      });

      expect(result.current.isTransitioning).toBe(false);
    });
  });

  describe('useInfiniteScroll', () => {
    it('creates intersection observer', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useInfiniteScroll(callback));

      expect(result.current.targetRef).toBeDefined();
      expect(result.current.isIntersecting).toBe(false);
    });

    it('calls callback when intersecting', () => {
      const callback = jest.fn();
      let observerCallback;

      global.IntersectionObserver = jest.fn().mockImplementation((cb) => {
        observerCallback = cb;
        return {
          observe: jest.fn(),
          unobserve: jest.fn()
        };
      });

      renderHook(() => useInfiniteScroll(callback));

      // Simulate intersection
      act(() => {
        observerCallback([{ isIntersecting: true }]);
      });

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('useAnimationVariants', () => {
    it('returns original variants without reduced motion', () => {
      const variants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      };

      const { result } = renderHook(() => useAnimationVariants(variants));

      expect(result.current).toEqual(variants);
    });

    it('returns simplified variants with reduced motion', () => {
      window.matchMedia = jest.fn().mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      });

      const variants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      };

      const { result } = renderHook(() => useAnimationVariants(variants));

      expect(result.current).toEqual({
        hidden: { opacity: 0 },
        show: { opacity: 1 },
        exit: { opacity: 0 }
      });
    });
  });

  describe('useSequentialReveal', () => {
    it('reveals items sequentially', () => {
      const items = ['a', 'b', 'c'];
      const { result } = renderHook(() => useSequentialReveal(items, 100));

      expect(result.current(0)).toBe(false);
      expect(result.current(1)).toBe(false);

      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(result.current(0)).toBe(true);

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current(1)).toBe(true);
    });

    it('reveals all immediately with reduced motion', () => {
      window.matchMedia = jest.fn().mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      });

      const items = ['a', 'b', 'c'];
      const { result } = renderHook(() => useSequentialReveal(items, 100));

      expect(result.current(0)).toBe(true);
      expect(result.current(1)).toBe(true);
      expect(result.current(2)).toBe(true);
    });
  });

  describe('useHoverAnimation', () => {
    it('initializes with not hovered', () => {
      const { result } = renderHook(() => useHoverAnimation());

      expect(result.current.isHovered).toBe(false);
    });

    it('sets hovered on mouse enter', () => {
      const { result } = renderHook(() => useHoverAnimation());

      act(() => {
        result.current.bind.onMouseEnter();
      });

      expect(result.current.isHovered).toBe(true);
    });

    it('sets not hovered on mouse leave', () => {
      const { result } = renderHook(() => useHoverAnimation());

      act(() => {
        result.current.bind.onMouseEnter();
        result.current.bind.onMouseLeave();
      });

      expect(result.current.isHovered).toBe(false);
    });
  });

  describe('useScrollProgress', () => {
    it('calculates scroll progress', () => {
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 2000,
        writable: true
      });
      Object.defineProperty(window, 'innerHeight', {
        value: 1000,
        writable: true
      });
      Object.defineProperty(window, 'pageYOffset', {
        value: 500,
        writable: true
      });

      const { result } = renderHook(() => useScrollProgress());

      expect(result.current).toBe(50);
    });

    it('clamps progress to 0-100', () => {
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 2000,
        writable: true
      });
      Object.defineProperty(window, 'innerHeight', {
        value: 1000,
        writable: true
      });
      Object.defineProperty(window, 'pageYOffset', {
        value: 2000,
        writable: true
      });

      const { result } = renderHook(() => useScrollProgress());

      expect(result.current).toBe(100);
    });
  });

  describe('useDebouncedAnimation', () => {
    it('debounces value changes', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebouncedAnimation(value, 300),
        { initialProps: { value: 'initial' } }
      );

      expect(result.current).toBe('initial');

      rerender({ value: 'changed' });

      expect(result.current).toBe('initial');

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toBe('changed');
    });

    it('uses custom delay', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebouncedAnimation(value, 500),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'changed' });

      act(() => {
        jest.advanceTimersByTime(400);
      });

      expect(result.current).toBe('initial');

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current).toBe('changed');
    });
  });

  describe('useAnimationQueue', () => {
    const animations = ['anim1', 'anim2', 'anim3'];

    it('starts at first animation', () => {
      const { result } = renderHook(() => useAnimationQueue(animations));

      expect(result.current.current).toBe('anim1');
      expect(result.current.currentIndex).toBe(0);
      expect(result.current.isComplete).toBe(false);
    });

    it('advances to next animation', () => {
      const { result } = renderHook(() => useAnimationQueue(animations));

      act(() => {
        result.current.next();
      });

      expect(result.current.current).toBe('anim2');
      expect(result.current.currentIndex).toBe(1);
    });

    it('marks as complete at end', () => {
      const { result } = renderHook(() => useAnimationQueue(animations));

      act(() => {
        result.current.next();
        result.current.next();
        result.current.next();
      });

      expect(result.current.isComplete).toBe(true);
    });

    it('resets to beginning', () => {
      const { result } = renderHook(() => useAnimationQueue(animations));

      act(() => {
        result.current.next();
        result.current.next();
        result.current.reset();
      });

      expect(result.current.currentIndex).toBe(0);
      expect(result.current.isComplete).toBe(false);
    });
  });

  describe('usePerformanceMode', () => {
    it('detects low memory devices', () => {
      Object.defineProperty(navigator, 'deviceMemory', {
        value: 2,
        configurable: true
      });

      const { result } = renderHook(() => usePerformanceMode());

      expect(result.current).toBe(true);
    });

    it('detects low core count', () => {
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        value: 2,
        configurable: true
      });

      const { result } = renderHook(() => usePerformanceMode());

      expect(result.current).toBe(true);
    });

    it('detects mobile devices', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'iPhone',
        configurable: true
      });

      const { result } = renderHook(() => usePerformanceMode());

      expect(result.current).toBe(true);
    });

    it('returns false for high performance devices', () => {
      Object.defineProperty(navigator, 'deviceMemory', {
        value: 8,
        configurable: true
      });
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        value: 8,
        configurable: true
      });
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Desktop',
        configurable: true
      });

      const { result } = renderHook(() => usePerformanceMode());

      expect(result.current).toBe(false);
    });
  });

  describe('useSwipeAnimation', () => {
    it('detects swipe left', () => {
      const onSwipeLeft = jest.fn();
      const onSwipeRight = jest.fn();

      const { result } = renderHook(() =>
        useSwipeAnimation(onSwipeLeft, onSwipeRight, 50)
      );

      act(() => {
        result.current.onTouchStart({ touches: [{ clientX: 200 }] });
      });

      act(() => {
        result.current.onTouchEnd({ changedTouches: [{ clientX: 100 }] });
      });

      expect(onSwipeLeft).toHaveBeenCalled();
      expect(onSwipeRight).not.toHaveBeenCalled();
    });

    it('detects swipe right', () => {
      const onSwipeLeft = jest.fn();
      const onSwipeRight = jest.fn();

      const { result } = renderHook(() =>
        useSwipeAnimation(onSwipeLeft, onSwipeRight, 50)
      );

      act(() => {
        result.current.onTouchStart({ touches: [{ clientX: 100 }] });
      });

      act(() => {
        result.current.onTouchEnd({ changedTouches: [{ clientX: 200 }] });
      });

      expect(onSwipeRight).toHaveBeenCalled();
      expect(onSwipeLeft).not.toHaveBeenCalled();
    });

    it('ignores small swipes', () => {
      const onSwipeLeft = jest.fn();
      const onSwipeRight = jest.fn();

      const { result } = renderHook(() =>
        useSwipeAnimation(onSwipeLeft, onSwipeRight, 50)
      );

      act(() => {
        result.current.onTouchStart({ touches: [{ clientX: 100 }] });
      });

      act(() => {
        result.current.onTouchEnd({ changedTouches: [{ clientX: 120 }] });
      });

      expect(onSwipeLeft).not.toHaveBeenCalled();
      expect(onSwipeRight).not.toHaveBeenCalled();
    });
  });
});
