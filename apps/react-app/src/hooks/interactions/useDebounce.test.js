/**
 * Tests for useDebounce hook
 */
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('returns initial value immediately', () => {
      const { result } = renderHook(() => useDebounce('initial'));

      expect(result.current).toBe('initial');
    });

    it('uses default delay of 500ms', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value),
        { initialProps: { value: 'first' } }
      );

      rerender({ value: 'second' });

      expect(result.current).toBe('first');

      act(() => {
        jest.advanceTimersByTime(499);
      });

      expect(result.current).toBe('first');

      act(() => {
        jest.advanceTimersByTime(1);
      });

      expect(result.current).toBe('second');
    });

    it('handles different value types', () => {
      const { result: stringResult } = renderHook(() => useDebounce('text'));
      expect(stringResult.current).toBe('text');

      const { result: numberResult } = renderHook(() => useDebounce(42));
      expect(numberResult.current).toBe(42);

      const { result: boolResult } = renderHook(() => useDebounce(true));
      expect(boolResult.current).toBe(true);

      const obj = { key: 'value' };
      const { result: objectResult } = renderHook(() => useDebounce(obj));
      expect(objectResult.current).toBe(obj);
    });
  });

  describe('Debouncing Behavior', () => {
    it('debounces value changes', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'changed' });

      expect(result.current).toBe('initial');

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toBe('changed');
    });

    it('resets timer on rapid changes', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'first' } }
      );

      // Change value multiple times rapidly
      rerender({ value: 'second' });
      act(() => {
        jest.advanceTimersByTime(200);
      });

      rerender({ value: 'third' });
      act(() => {
        jest.advanceTimersByTime(200);
      });

      rerender({ value: 'fourth' });
      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Still showing initial value
      expect(result.current).toBe('first');

      // After full delay from last change
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toBe('fourth');
    });

    it('only updates after delay expires', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 1000),
        { initialProps: { value: 'start' } }
      );

      rerender({ value: 'end' });

      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(result.current).toBe('start');

      act(() => {
        jest.advanceTimersByTime(400);
      });
      expect(result.current).toBe('start');

      act(() => {
        jest.advanceTimersByTime(400);
      });
      expect(result.current).toBe('start');

      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(result.current).toBe('end');
    });
  });

  describe('Custom Delay', () => {
    it('uses custom delay', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });

      act(() => {
        jest.advanceTimersByTime(99);
      });
      expect(result.current).toBe('initial');

      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(result.current).toBe('updated');
    });

    it('handles zero delay', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 0),
        { initialProps: { value: 'first' } }
      );

      rerender({ value: 'second' });

      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(result.current).toBe('second');
    });

    it('handles long delays', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 5000),
        { initialProps: { value: 'start' } }
      );

      rerender({ value: 'end' });

      act(() => {
        jest.advanceTimersByTime(4999);
      });
      expect(result.current).toBe('start');

      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(result.current).toBe('end');
    });
  });

  describe('Multiple Value Changes', () => {
    it('tracks last value after multiple rapid changes', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: '1' } }
      );

      rerender({ value: '2' });
      rerender({ value: '3' });
      rerender({ value: '4' });
      rerender({ value: '5' });

      expect(result.current).toBe('1');

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toBe('5');
    });

    it('handles mixed timing changes', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 200),
        { initialProps: { value: 'a' } }
      );

      rerender({ value: 'b' });
      act(() => {
        jest.advanceTimersByTime(150);
      });

      rerender({ value: 'c' }); // Reset timer
      act(() => {
        jest.advanceTimersByTime(150);
      });

      expect(result.current).toBe('a');

      rerender({ value: 'd' }); // Reset timer again
      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current).toBe('d');
    });
  });

  describe('Cleanup', () => {
    it('clears timeout on unmount', () => {
      const { result, rerender, unmount } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'changed' });

      const spy = jest.spyOn(global, 'clearTimeout');

      unmount();

      expect(spy).toHaveBeenCalled();
    });

    it('clears previous timeout on value change', () => {
      const { rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'first' } }
      );

      const spy = jest.spyOn(global, 'clearTimeout');

      rerender({ value: 'second' });

      expect(spy).toHaveBeenCalled();
    });

    it('clears timeout on delay change', () => {
      const { rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'test', delay: 500 } }
      );

      const spy = jest.spyOn(global, 'clearTimeout');

      rerender({ value: 'test', delay: 300 });

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Use Cases', () => {
    it('debounces search input', () => {
      const { result, rerender } = renderHook(
        ({ searchTerm }) => useDebounce(searchTerm, 500),
        { initialProps: { searchTerm: '' } }
      );

      // User types "hello"
      rerender({ searchTerm: 'h' });
      rerender({ searchTerm: 'he' });
      rerender({ searchTerm: 'hel' });
      rerender({ searchTerm: 'hell' });
      rerender({ searchTerm: 'hello' });

      // Search not triggered yet
      expect(result.current).toBe('');

      // After typing stops for 500ms
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current).toBe('hello');
    });

    it('debounces window resize', () => {
      const { result, rerender } = renderHook(
        ({ width }) => useDebounce(width, 200),
        { initialProps: { width: 1024 } }
      );

      // Rapid resize events
      rerender({ width: 1020 });
      rerender({ width: 1015 });
      rerender({ width: 1010 });
      rerender({ width: 1000 });

      expect(result.current).toBe(1024);

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current).toBe(1000);
    });

    it('debounces API calls', () => {
      const { result, rerender } = renderHook(
        ({ query }) => useDebounce(query, 300),
        { initialProps: { query: 'a' } }
      );

      // User types quickly
      rerender({ query: 'ab' });
      act(() => {
        jest.advanceTimersByTime(100);
      });

      rerender({ query: 'abc' });
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // No API call yet
      expect(result.current).toBe('a');

      // User pauses typing
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Now trigger API call
      expect(result.current).toBe('abc');
    });

    it('debounces form validation', () => {
      const { result, rerender } = renderHook(
        ({ email }) => useDebounce(email, 400),
        { initialProps: { email: '' } }
      );

      rerender({ email: 'user@' });
      rerender({ email: 'user@ex' });
      rerender({ email: 'user@exa' });
      rerender({ email: 'user@exam' });
      rerender({ email: 'user@examp' });
      rerender({ email: 'user@exampl' });
      rerender({ email: 'user@example' });
      rerender({ email: 'user@example.' });
      rerender({ email: 'user@example.c' });
      rerender({ email: 'user@example.co' });
      rerender({ email: 'user@example.com' });

      // Validation not triggered yet
      expect(result.current).toBe('');

      act(() => {
        jest.advanceTimersByTime(400);
      });

      // Now validate
      expect(result.current).toBe('user@example.com');
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined values', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: undefined } }
      );

      expect(result.current).toBeUndefined();

      rerender({ value: 'defined' });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toBe('defined');
    });

    it('handles null values', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: null } }
      );

      expect(result.current).toBe(null);

      rerender({ value: 'not null' });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toBe('not null');
    });

    it('handles object references', () => {
      const obj1 = { id: 1 };
      const obj2 = { id: 2 };

      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: obj1 } }
      );

      expect(result.current).toBe(obj1);

      rerender({ value: obj2 });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toBe(obj2);
    });
  });
});
