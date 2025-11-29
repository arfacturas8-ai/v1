/**
 * Tests for usePrevious hook
 */
import { renderHook } from '@testing-library/react';
import { usePrevious } from './usePrevious';

describe('usePrevious', () => {
  describe('Initialization', () => {
    it('returns undefined on first render', () => {
      const { result } = renderHook(() => usePrevious('initial'));

      expect(result.current).toBeUndefined();
    });

    it('handles different value types on first render', () => {
      const { result: numberResult } = renderHook(() => usePrevious(42));
      expect(numberResult.current).toBeUndefined();

      const { result: objectResult } = renderHook(() => usePrevious({ key: 'value' }));
      expect(objectResult.current).toBeUndefined();

      const { result: arrayResult } = renderHook(() => usePrevious([1, 2, 3]));
      expect(arrayResult.current).toBeUndefined();

      const { result: nullResult } = renderHook(() => usePrevious(null));
      expect(nullResult.current).toBeUndefined();
    });
  });

  describe('Value Tracking', () => {
    it('returns previous value after rerender', () => {
      const { result, rerender } = renderHook(
        ({ value }) => usePrevious(value),
        { initialProps: { value: 'first' } }
      );

      expect(result.current).toBeUndefined();

      rerender({ value: 'second' });

      expect(result.current).toBe('first');
    });

    it('tracks multiple value changes', () => {
      const { result, rerender } = renderHook(
        ({ value }) => usePrevious(value),
        { initialProps: { value: 'first' } }
      );

      rerender({ value: 'second' });
      expect(result.current).toBe('first');

      rerender({ value: 'third' });
      expect(result.current).toBe('second');

      rerender({ value: 'fourth' });
      expect(result.current).toBe('third');
    });

    it('handles same value multiple times', () => {
      const { result, rerender } = renderHook(
        ({ value }) => usePrevious(value),
        { initialProps: { value: 'same' } }
      );

      rerender({ value: 'same' });
      expect(result.current).toBe('same');

      rerender({ value: 'same' });
      expect(result.current).toBe('same');
    });
  });

  describe('Primitive Types', () => {
    it('tracks string values', () => {
      const { result, rerender } = renderHook(
        ({ value }) => usePrevious(value),
        { initialProps: { value: 'hello' } }
      );

      rerender({ value: 'world' });

      expect(result.current).toBe('hello');
    });

    it('tracks number values', () => {
      const { result, rerender } = renderHook(
        ({ value }) => usePrevious(value),
        { initialProps: { value: 1 } }
      );

      rerender({ value: 2 });
      expect(result.current).toBe(1);

      rerender({ value: 3 });
      expect(result.current).toBe(2);
    });

    it('tracks boolean values', () => {
      const { result, rerender } = renderHook(
        ({ value }) => usePrevious(value),
        { initialProps: { value: false } }
      );

      rerender({ value: true });
      expect(result.current).toBe(false);

      rerender({ value: false });
      expect(result.current).toBe(true);
    });

    it('tracks null and undefined', () => {
      const { result, rerender } = renderHook(
        ({ value }) => usePrevious(value),
        { initialProps: { value: null } }
      );

      rerender({ value: undefined });
      expect(result.current).toBe(null);

      rerender({ value: 'value' });
      expect(result.current).toBe(undefined);
    });
  });

  describe('Complex Types', () => {
    it('tracks object references', () => {
      const obj1 = { id: 1, name: 'first' };
      const obj2 = { id: 2, name: 'second' };

      const { result, rerender } = renderHook(
        ({ value }) => usePrevious(value),
        { initialProps: { value: obj1 } }
      );

      rerender({ value: obj2 });

      expect(result.current).toBe(obj1);
      expect(result.current).toEqual({ id: 1, name: 'first' });
    });

    it('tracks array references', () => {
      const arr1 = [1, 2, 3];
      const arr2 = [4, 5, 6];

      const { result, rerender } = renderHook(
        ({ value }) => usePrevious(value),
        { initialProps: { value: arr1 } }
      );

      rerender({ value: arr2 });

      expect(result.current).toBe(arr1);
      expect(result.current).toEqual([1, 2, 3]);
    });

    it('tracks function references', () => {
      const fn1 = () => 'first';
      const fn2 = () => 'second';

      const { result, rerender } = renderHook(
        ({ value }) => usePrevious(value),
        { initialProps: { value: fn1 } }
      );

      rerender({ value: fn2 });

      expect(result.current).toBe(fn1);
      expect(result.current()).toBe('first');
    });
  });

  describe('Reference Equality', () => {
    it('preserves object reference identity', () => {
      const obj = { count: 0 };

      const { result, rerender } = renderHook(
        ({ value }) => usePrevious(value),
        { initialProps: { value: obj } }
      );

      const newObj = { count: 1 };
      rerender({ value: newObj });

      expect(result.current).toBe(obj);
      expect(result.current === obj).toBe(true);
    });

    it('detects object mutations but keeps reference', () => {
      const obj = { count: 0 };

      const { result, rerender } = renderHook(
        ({ value }) => usePrevious(value),
        { initialProps: { value: obj } }
      );

      obj.count = 1; // Mutate
      rerender({ value: obj });

      // Previous is the mutated object (same reference)
      expect(result.current).toBe(obj);
      expect(result.current.count).toBe(1);
    });
  });

  describe('Use Cases', () => {
    it('can compare current vs previous for change detection', () => {
      const { result, rerender } = renderHook(
        ({ value }) => {
          const previous = usePrevious(value);
          return { current: value, previous, changed: value !== previous };
        },
        { initialProps: { value: 'a' } }
      );

      expect(result.current.changed).toBe(true); // first render

      rerender({ value: 'b' });
      expect(result.current.changed).toBe(true);
      expect(result.current.current).toBe('b');
      expect(result.current.previous).toBe('a');

      rerender({ value: 'b' });
      expect(result.current.changed).toBe(false);
    });

    it('tracks state increments', () => {
      const { result, rerender } = renderHook(
        ({ count }) => usePrevious(count),
        { initialProps: { count: 0 } }
      );

      rerender({ count: 1 });
      expect(result.current).toBe(0);

      rerender({ count: 2 });
      expect(result.current).toBe(1);

      rerender({ count: 3 });
      expect(result.current).toBe(2);
    });

    it('tracks form input values', () => {
      const { result, rerender } = renderHook(
        ({ input }) => usePrevious(input),
        { initialProps: { input: '' } }
      );

      rerender({ input: 'h' });
      expect(result.current).toBe('');

      rerender({ input: 'he' });
      expect(result.current).toBe('h');

      rerender({ input: 'hel' });
      expect(result.current).toBe('he');

      rerender({ input: 'hell' });
      expect(result.current).toBe('hel');

      rerender({ input: 'hello' });
      expect(result.current).toBe('hell');
    });
  });
});
