/**
 * Tests for useIntersectionObserver hook
 */
import { renderHook, act } from '@testing-library/react';
import { useIntersectionObserver } from './useIntersectionObserver';

describe('useIntersectionObserver', () => {
  let mockObserver;
  let observeCallback;

  beforeEach(() => {
    mockObserver = {
      observe: jest.fn(),
      disconnect: jest.fn(),
      unobserve: jest.fn()
    };

    global.IntersectionObserver = jest.fn((callback) => {
      observeCallback = callback;
      return mockObserver;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('initializes with isIntersecting false', () => {
      const { result } = renderHook(() => useIntersectionObserver());

      expect(result.current.isIntersecting).toBe(false);
    });

    it('initializes with hasIntersected false', () => {
      const { result } = renderHook(() => useIntersectionObserver());

      expect(result.current.hasIntersected).toBe(false);
    });

    it('returns ref object', () => {
      const { result } = renderHook(() => useIntersectionObserver());

      expect(result.current.ref).toBeDefined();
      expect(result.current.ref.current).toBe(null);
    });

    it('does not create observer when ref is null', () => {
      renderHook(() => useIntersectionObserver());

      expect(mockObserver.observe).not.toHaveBeenCalled();
    });
  });

  describe('Observer Creation', () => {
    it('creates IntersectionObserver with default options', () => {
      const { result } = renderHook(() => useIntersectionObserver());

      const element = document.createElement('div');
      result.current.ref.current = element;

      act(() => {
        result.current.ref.current = element;
      });

      // Rerender to trigger useEffect
      renderHook(() => useIntersectionObserver());

      expect(global.IntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        {}
      );
    });

    it('creates IntersectionObserver with custom options', () => {
      const options = {
        root: null,
        rootMargin: '10px',
        threshold: 0.5
      };

      renderHook(() => useIntersectionObserver(options));

      expect(global.IntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        options
      );
    });

    it('observes element when ref is set', () => {
      const { result, rerender } = renderHook(() => useIntersectionObserver());

      const element = document.createElement('div');
      result.current.ref.current = element;

      rerender();

      expect(mockObserver.observe).toHaveBeenCalledWith(element);
    });
  });

  describe('Intersection Detection', () => {
    it('sets isIntersecting to true when element enters viewport', () => {
      const { result, rerender } = renderHook(() => useIntersectionObserver());

      const element = document.createElement('div');
      result.current.ref.current = element;
      rerender();

      act(() => {
        observeCallback([{ isIntersecting: true }]);
      });

      expect(result.current.isIntersecting).toBe(true);
    });

    it('sets isIntersecting to false when element leaves viewport', () => {
      const { result, rerender } = renderHook(() => useIntersectionObserver());

      const element = document.createElement('div');
      result.current.ref.current = element;
      rerender();

      act(() => {
        observeCallback([{ isIntersecting: true }]);
      });

      expect(result.current.isIntersecting).toBe(true);

      act(() => {
        observeCallback([{ isIntersecting: false }]);
      });

      expect(result.current.isIntersecting).toBe(false);
    });

    it('sets hasIntersected to true once element has intersected', () => {
      const { result, rerender } = renderHook(() => useIntersectionObserver());

      const element = document.createElement('div');
      result.current.ref.current = element;
      rerender();

      act(() => {
        observeCallback([{ isIntersecting: true }]);
      });

      expect(result.current.hasIntersected).toBe(true);
    });

    it('keeps hasIntersected true even after leaving viewport', () => {
      const { result, rerender } = renderHook(() => useIntersectionObserver());

      const element = document.createElement('div');
      result.current.ref.current = element;
      rerender();

      act(() => {
        observeCallback([{ isIntersecting: true }]);
      });

      expect(result.current.hasIntersected).toBe(true);

      act(() => {
        observeCallback([{ isIntersecting: false }]);
      });

      expect(result.current.hasIntersected).toBe(true);
      expect(result.current.isIntersecting).toBe(false);
    });
  });

  describe('Observer Options', () => {
    it('passes threshold option', () => {
      const options = { threshold: [0, 0.25, 0.5, 0.75, 1] };

      renderHook(() => useIntersectionObserver(options));

      expect(global.IntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        options
      );
    });

    it('passes rootMargin option', () => {
      const options = { rootMargin: '50px 20px' };

      renderHook(() => useIntersectionObserver(options));

      expect(global.IntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        options
      );
    });

    it('passes root option', () => {
      const root = document.createElement('div');
      const options = { root };

      renderHook(() => useIntersectionObserver(options));

      expect(global.IntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        options
      );
    });

    it('handles multiple threshold values', () => {
      const options = { threshold: [0, 0.5, 1] };

      renderHook(() => useIntersectionObserver(options));

      expect(global.IntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        options
      );
    });
  });

  describe('Cleanup', () => {
    it('disconnects observer on unmount', () => {
      const { result, rerender, unmount } = renderHook(() => useIntersectionObserver());

      const element = document.createElement('div');
      result.current.ref.current = element;
      rerender();

      unmount();

      expect(mockObserver.disconnect).toHaveBeenCalled();
    });

    it('disconnects observer when options change', () => {
      const { rerender } = renderHook(
        ({ options }) => useIntersectionObserver(options),
        { initialProps: { options: { threshold: 0.5 } } }
      );

      rerender({ options: { threshold: 1.0 } });

      expect(mockObserver.disconnect).toHaveBeenCalled();
    });

    it('disconnects and recreates observer when element changes', () => {
      const { result, rerender } = renderHook(() => useIntersectionObserver());

      const element1 = document.createElement('div');
      result.current.ref.current = element1;
      rerender();

      const element2 = document.createElement('div');
      result.current.ref.current = element2;
      rerender();

      expect(mockObserver.disconnect).toHaveBeenCalled();
    });
  });

  describe('Use Cases', () => {
    it('detects when image enters viewport (lazy loading)', () => {
      const { result, rerender } = renderHook(() => useIntersectionObserver());

      const img = document.createElement('img');
      result.current.ref.current = img;
      rerender();

      expect(result.current.hasIntersected).toBe(false);

      act(() => {
        observeCallback([{ isIntersecting: true }]);
      });

      expect(result.current.hasIntersected).toBe(true);
      // Would trigger image load here in real component
    });

    it('triggers animation when section enters viewport', () => {
      const { result, rerender } = renderHook(() =>
        useIntersectionObserver({ threshold: 0.3 })
      );

      const section = document.createElement('section');
      result.current.ref.current = section;
      rerender();

      act(() => {
        observeCallback([{ isIntersecting: true }]);
      });

      expect(result.current.isIntersecting).toBe(true);
      // Would start animation here in real component
    });

    it('tracks infinite scroll trigger', () => {
      const { result, rerender } = renderHook(() =>
        useIntersectionObserver({ rootMargin: '100px' })
      );

      const sentinel = document.createElement('div');
      result.current.ref.current = sentinel;
      rerender();

      act(() => {
        observeCallback([{ isIntersecting: true }]);
      });

      expect(result.current.isIntersecting).toBe(true);
      // Would load more items here in real component
    });

    it('implements scroll-triggered animations', () => {
      const { result, rerender } = renderHook(() =>
        useIntersectionObserver({ threshold: 0.5, once: true })
      );

      const element = document.createElement('div');
      result.current.ref.current = element;
      rerender();

      act(() => {
        observeCallback([{ isIntersecting: true }]);
      });

      expect(result.current.hasIntersected).toBe(true);

      // Leave and re-enter viewport
      act(() => {
        observeCallback([{ isIntersecting: false }]);
      });

      act(() => {
        observeCallback([{ isIntersecting: true }]);
      });

      // hasIntersected remains true (animation only once)
      expect(result.current.hasIntersected).toBe(true);
    });
  });

  describe('Multiple Elements', () => {
    it('tracks multiple elements independently', () => {
      const { result: result1, rerender: rerender1 } = renderHook(() =>
        useIntersectionObserver()
      );
      const { result: result2, rerender: rerender2 } = renderHook(() =>
        useIntersectionObserver()
      );

      const element1 = document.createElement('div');
      const element2 = document.createElement('div');

      result1.current.ref.current = element1;
      result2.current.ref.current = element2;

      rerender1();
      rerender2();

      expect(result1.current.isIntersecting).toBe(false);
      expect(result2.current.isIntersecting).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('handles ref being set to null', () => {
      const { result, rerender } = renderHook(() => useIntersectionObserver());

      const element = document.createElement('div');
      result.current.ref.current = element;
      rerender();

      result.current.ref.current = null;
      rerender();

      // Should not throw error
      expect(result.current.isIntersecting).toBe(false);
    });

    it('handles observer callback with empty entries', () => {
      const { result, rerender } = renderHook(() => useIntersectionObserver());

      const element = document.createElement('div');
      result.current.ref.current = element;
      rerender();

      act(() => {
        observeCallback([]);
      });

      // Should not crash
      expect(result.current).toBeDefined();
    });

    it('handles multiple intersection events', () => {
      const { result, rerender } = renderHook(() => useIntersectionObserver());

      const element = document.createElement('div');
      result.current.ref.current = element;
      rerender();

      act(() => {
        observeCallback([{ isIntersecting: true }]);
        observeCallback([{ isIntersecting: false }]);
        observeCallback([{ isIntersecting: true }]);
        observeCallback([{ isIntersecting: false }]);
      });

      expect(result.current.isIntersecting).toBe(false);
      expect(result.current.hasIntersected).toBe(true);
    });

    it('handles threshold of 0 (any pixel visible)', () => {
      const { result, rerender } = renderHook(() =>
        useIntersectionObserver({ threshold: 0 })
      );

      const element = document.createElement('div');
      result.current.ref.current = element;
      rerender();

      act(() => {
        observeCallback([{ isIntersecting: true }]);
      });

      expect(result.current.isIntersecting).toBe(true);
    });

    it('handles threshold of 1 (fully visible)', () => {
      const { result, rerender } = renderHook(() =>
        useIntersectionObserver({ threshold: 1 })
      );

      const element = document.createElement('div');
      result.current.ref.current = element;
      rerender();

      act(() => {
        observeCallback([{ isIntersecting: true }]);
      });

      expect(result.current.isIntersecting).toBe(true);
    });

    it('handles negative rootMargin', () => {
      const { result, rerender } = renderHook(() =>
        useIntersectionObserver({ rootMargin: '-50px' })
      );

      const element = document.createElement('div');
      result.current.ref.current = element;
      rerender();

      expect(global.IntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        { rootMargin: '-50px' }
      );
    });
  });

  describe('Return Values', () => {
    it('returns object with ref, isIntersecting, and hasIntersected', () => {
      const { result } = renderHook(() => useIntersectionObserver());

      expect(result.current).toHaveProperty('ref');
      expect(result.current).toHaveProperty('isIntersecting');
      expect(result.current).toHaveProperty('hasIntersected');
    });

    it('ref is a React ref object', () => {
      const { result } = renderHook(() => useIntersectionObserver());

      expect(result.current.ref).toHaveProperty('current');
    });

    it('isIntersecting is a boolean', () => {
      const { result } = renderHook(() => useIntersectionObserver());

      expect(typeof result.current.isIntersecting).toBe('boolean');
    });

    it('hasIntersected is a boolean', () => {
      const { result } = renderHook(() => useIntersectionObserver());

      expect(typeof result.current.hasIntersected).toBe('boolean');
    });
  });
});
