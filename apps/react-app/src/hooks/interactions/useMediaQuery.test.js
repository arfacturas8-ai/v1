/**
 * Tests for useMediaQuery hook
 */
import { renderHook, act } from '@testing-library/react';
import { useMediaQuery } from './useMediaQuery';

describe('useMediaQuery', () => {
  let mockMatchMedia;

  beforeEach(() => {
    mockMatchMedia = jest.fn();
    window.matchMedia = mockMatchMedia;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('initializes with false when media query does not match', () => {
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      });

      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

      expect(result.current).toBe(false);
    });

    it('initializes with true when media query matches', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      });

      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

      expect(result.current).toBe(true);
    });

    it('calls matchMedia with correct query', () => {
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      });

      renderHook(() => useMediaQuery('(min-width: 1024px)'));

      expect(mockMatchMedia).toHaveBeenCalledWith('(min-width: 1024px)');
    });
  });

  describe('Media Query Updates', () => {
    it('updates when media query matches change', () => {
      let changeHandler;
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: jest.fn((event, handler) => {
          changeHandler = handler;
        }),
        removeEventListener: jest.fn()
      });

      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

      expect(result.current).toBe(false);

      act(() => {
        changeHandler({ matches: true });
      });

      expect(result.current).toBe(true);

      act(() => {
        changeHandler({ matches: false });
      });

      expect(result.current).toBe(false);
    });

    it('subscribes to media query changes', () => {
      const addEventListener = jest.fn();
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener,
        removeEventListener: jest.fn()
      });

      renderHook(() => useMediaQuery('(min-width: 768px)'));

      expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });
  });

  describe('Cleanup', () => {
    it('removes event listener on unmount', () => {
      const removeEventListener = jest.fn();
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener
      });

      const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));

      unmount();

      expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('cleans up when query changes', () => {
      const removeEventListener = jest.fn();
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener
      });

      const { rerender } = renderHook(
        ({ query }) => useMediaQuery(query),
        { initialProps: { query: '(min-width: 768px)' } }
      );

      rerender({ query: '(min-width: 1024px)' });

      expect(removeEventListener).toHaveBeenCalled();
    });
  });

  describe('Common Media Queries', () => {
    it('detects mobile viewport', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      });

      const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));

      expect(result.current).toBe(true);
    });

    it('detects tablet viewport', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      });

      const { result } = renderHook(() =>
        useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
      );

      expect(result.current).toBe(true);
    });

    it('detects desktop viewport', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      });

      const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'));

      expect(result.current).toBe(true);
    });

    it('detects portrait orientation', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      });

      const { result } = renderHook(() => useMediaQuery('(orientation: portrait)'));

      expect(result.current).toBe(true);
    });

    it('detects landscape orientation', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      });

      const { result } = renderHook(() => useMediaQuery('(orientation: landscape)'));

      expect(result.current).toBe(true);
    });

    it('detects dark mode preference', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      });

      const { result } = renderHook(() => useMediaQuery('(prefers-color-scheme: dark)'));

      expect(result.current).toBe(true);
    });

    it('detects reduced motion preference', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      });

      const { result } = renderHook(() => useMediaQuery('(prefers-reduced-motion: reduce)'));

      expect(result.current).toBe(true);
    });

    it('detects high resolution displays', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      });

      const { result } = renderHook(() => useMediaQuery('(min-resolution: 2dppx)'));

      expect(result.current).toBe(true);
    });
  });

  describe('Responsive Breakpoints', () => {
    it('detects small screen breakpoint', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      });

      const { result } = renderHook(() => useMediaQuery('(max-width: 640px)'));

      expect(result.current).toBe(true);
    });

    it('detects medium screen breakpoint', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      });

      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

      expect(result.current).toBe(true);
    });

    it('detects large screen breakpoint', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      });

      const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'));

      expect(result.current).toBe(true);
    });

    it('detects extra large screen breakpoint', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      });

      const { result } = renderHook(() => useMediaQuery('(min-width: 1280px)'));

      expect(result.current).toBe(true);
    });
  });

  describe('Dynamic Query Changes', () => {
    it('handles query changes', () => {
      mockMatchMedia.mockImplementation((query) => ({
        matches: query === '(min-width: 768px)',
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      }));

      const { result, rerender } = renderHook(
        ({ query }) => useMediaQuery(query),
        { initialProps: { query: '(min-width: 768px)' } }
      );

      expect(result.current).toBe(true);

      rerender({ query: '(min-width: 1024px)' });

      expect(result.current).toBe(false);
    });

    it('re-evaluates on query change', () => {
      let callCount = 0;
      mockMatchMedia.mockImplementation(() => {
        callCount++;
        return {
          matches: false,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn()
        };
      });

      const { rerender } = renderHook(
        ({ query }) => useMediaQuery(query),
        { initialProps: { query: '(min-width: 768px)' } }
      );

      const initialCallCount = callCount;

      rerender({ query: '(min-width: 1024px)' });

      expect(callCount).toBeGreaterThan(initialCallCount);
    });
  });

  describe('Use Cases', () => {
    it('conditionally renders mobile navigation', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      });

      const { result } = renderHook(() => {
        const isMobile = useMediaQuery('(max-width: 767px)');
        return { showMobileNav: isMobile };
      });

      expect(result.current.showMobileNav).toBe(true);
    });

    it('adapts layout for different screen sizes', () => {
      mockMatchMedia.mockImplementation((query) => ({
        matches: query === '(min-width: 1024px)',
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      }));

      const { result } = renderHook(() => {
        const isDesktop = useMediaQuery('(min-width: 1024px)');
        const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
        const isMobile = useMediaQuery('(max-width: 767px)');

        return { isDesktop, isTablet, isMobile };
      });

      expect(result.current.isDesktop).toBe(true);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isMobile).toBe(false);
    });

    it('respects user dark mode preference', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      });

      const { result } = renderHook(() => {
        const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
        return { theme: prefersDark ? 'dark' : 'light' };
      });

      expect(result.current.theme).toBe('dark');
    });

    it('disables animations for reduced motion', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      });

      const { result } = renderHook(() => {
        const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
        return { enableAnimations: !prefersReducedMotion };
      });

      expect(result.current.enableAnimations).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('handles invalid media query', () => {
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      });

      const { result } = renderHook(() => useMediaQuery('invalid query'));

      expect(result.current).toBe(false);
    });

    it('handles empty query string', () => {
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      });

      const { result } = renderHook(() => useMediaQuery(''));

      expect(result.current).toBe(false);
    });

    it('handles multiple simultaneous queries', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      });

      const { result: result1 } = renderHook(() => useMediaQuery('(min-width: 768px)'));
      const { result: result2 } = renderHook(() => useMediaQuery('(min-width: 1024px)'));
      const { result: result3 } = renderHook(() => useMediaQuery('(orientation: portrait)'));

      expect(result1.current).toBe(true);
      expect(result2.current).toBe(true);
      expect(result3.current).toBe(true);
    });
  });
});
