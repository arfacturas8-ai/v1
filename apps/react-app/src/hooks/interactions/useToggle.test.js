/**
 * Tests for useToggle hook
 */
import { renderHook, act } from '@testing-library/react';
import { useToggle } from './useToggle';

describe('useToggle', () => {
  describe('Initialization', () => {
    it('initializes with false by default', () => {
      const { result } = renderHook(() => useToggle());

      expect(result.current[0]).toBe(false);
    });

    it('initializes with provided value', () => {
      const { result } = renderHook(() => useToggle(true));

      expect(result.current[0]).toBe(true);
    });

    it('returns array with value and functions', () => {
      const { result } = renderHook(() => useToggle());

      expect(result.current).toHaveLength(4);
      expect(typeof result.current[0]).toBe('boolean');
      expect(typeof result.current[1]).toBe('function');
      expect(typeof result.current[2]).toBe('function');
      expect(typeof result.current[3]).toBe('function');
    });
  });

  describe('Toggle Function', () => {
    it('toggles value from false to true', () => {
      const { result } = renderHook(() => useToggle(false));

      act(() => {
        result.current[1](); // toggle
      });

      expect(result.current[0]).toBe(true);
    });

    it('toggles value from true to false', () => {
      const { result } = renderHook(() => useToggle(true));

      act(() => {
        result.current[1](); // toggle
      });

      expect(result.current[0]).toBe(false);
    });

    it('toggles multiple times', () => {
      const { result } = renderHook(() => useToggle(false));

      act(() => {
        result.current[1](); // false -> true
      });
      expect(result.current[0]).toBe(true);

      act(() => {
        result.current[1](); // true -> false
      });
      expect(result.current[0]).toBe(false);

      act(() => {
        result.current[1](); // false -> true
      });
      expect(result.current[0]).toBe(true);
    });

    it('maintains referential equality', () => {
      const { result, rerender } = renderHook(() => useToggle());

      const toggleFn = result.current[1];

      act(() => {
        result.current[1]();
      });

      rerender();

      expect(result.current[1]).toBe(toggleFn);
    });
  });

  describe('SetTrue Function', () => {
    it('sets value to true', () => {
      const { result } = renderHook(() => useToggle(false));

      act(() => {
        result.current[2](); // setTrue
      });

      expect(result.current[0]).toBe(true);
    });

    it('keeps value true when already true', () => {
      const { result } = renderHook(() => useToggle(true));

      act(() => {
        result.current[2](); // setTrue
      });

      expect(result.current[0]).toBe(true);
    });

    it('maintains referential equality', () => {
      const { result, rerender } = renderHook(() => useToggle());

      const setTrueFn = result.current[2];

      act(() => {
        result.current[2]();
      });

      rerender();

      expect(result.current[2]).toBe(setTrueFn);
    });
  });

  describe('SetFalse Function', () => {
    it('sets value to false', () => {
      const { result } = renderHook(() => useToggle(true));

      act(() => {
        result.current[3](); // setFalse
      });

      expect(result.current[0]).toBe(false);
    });

    it('keeps value false when already false', () => {
      const { result } = renderHook(() => useToggle(false));

      act(() => {
        result.current[3](); // setFalse
      });

      expect(result.current[0]).toBe(false);
    });

    it('maintains referential equality', () => {
      const { result, rerender } = renderHook(() => useToggle());

      const setFalseFn = result.current[3];

      act(() => {
        result.current[3]();
      });

      rerender();

      expect(result.current[3]).toBe(setFalseFn);
    });
  });

  describe('Combined Usage', () => {
    it('can combine all functions', () => {
      const { result } = renderHook(() => useToggle(false));

      act(() => {
        result.current[2](); // setTrue
      });
      expect(result.current[0]).toBe(true);

      act(() => {
        result.current[1](); // toggle
      });
      expect(result.current[0]).toBe(false);

      act(() => {
        result.current[2](); // setTrue
      });
      expect(result.current[0]).toBe(true);

      act(() => {
        result.current[3](); // setFalse
      });
      expect(result.current[0]).toBe(false);
    });
  });

  describe('Destructuring Support', () => {
    it('supports array destructuring', () => {
      const { result } = renderHook(() => useToggle(false));
      const [value, toggle, setTrue, setFalse] = result.current;

      expect(value).toBe(false);
      expect(typeof toggle).toBe('function');
      expect(typeof setTrue).toBe('function');
      expect(typeof setFalse).toBe('function');
    });

    it('works with partial destructuring', () => {
      const { result } = renderHook(() => useToggle(true));
      const [value, toggle] = result.current;

      expect(value).toBe(true);

      act(() => {
        toggle();
      });

      expect(result.current[0]).toBe(false);
    });
  });
});
