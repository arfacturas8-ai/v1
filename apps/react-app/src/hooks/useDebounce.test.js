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

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('debounces value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    // Change value
    rerender({ value: 'updated', delay: 500 });

    // Should still be initial before delay
    expect(result.current).toBe('initial');

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Should now be updated
    expect(result.current).toBe('updated');
  });

  it('cancels previous timeout on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'first', delay: 500 } }
    );

    // Rapid changes
    rerender({ value: 'second', delay: 500 });
    act(() => {
      jest.advanceTimersByTime(200);
    });

    rerender({ value: 'third', delay: 500 });
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Should still be initial
    expect(result.current).toBe('first');

    // Complete the delay from last change
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Should be the last value
    expect(result.current).toBe('third');
  });

  it('handles delay changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'test', delay: 500 } }
    );

    rerender({ value: 'test', delay: 1000 });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Should still be old value with new delay
    expect(result.current).toBe('test');

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe('test');
  });

  it('works with zero delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 0 } }
    );

    rerender({ value: 'instant', delay: 0 });

    act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(result.current).toBe('instant');
  });

  it('works with different data types', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 0, delay: 100 } }
    );

    expect(result.current).toBe(0);

    rerender({ value: 42, delay: 100 });
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBe(42);

    rerender({ value: null, delay: 100 });
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBe(null);

    rerender({ value: { key: 'value' }, delay: 100 });
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toEqual({ key: 'value' });
  });

  it('cleans up timeout on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    const { unmount } = renderHook(() => useDebounce('test', 500));

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});
