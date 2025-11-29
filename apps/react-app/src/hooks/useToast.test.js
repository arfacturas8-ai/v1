/**
 * Tests for useToast hook
 */
import { renderHook, act } from '@testing-library/react';
import { useToast } from './useToast';

describe('useToast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes with empty toasts', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toEqual([]);
  });

  it('adds a toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.addToast({ type: 'info', message: 'Test message' });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Test message');
  });

  it('generates unique IDs for toasts', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.addToast({ message: 'First' });
      result.current.addToast({ message: 'Second' });
    });

    expect(result.current.toasts[0].id).not.toBe(result.current.toasts[1].id);
  });

  it('removes a toast by ID', () => {
    const { result } = renderHook(() => useToast());
    let toastId;

    act(() => {
      toastId = result.current.addToast({ message: 'Test' });
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      result.current.removeToast(toastId);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('removes all toasts', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.addToast({ message: 'First' });
      result.current.addToast({ message: 'Second' });
      result.current.addToast({ message: 'Third' });
    });

    expect(result.current.toasts).toHaveLength(3);

    act(() => {
      result.current.removeAllToasts();
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('limits number of toasts', () => {
    const { result } = renderHook(() => useToast({ maxToasts: 3 }));

    act(() => {
      result.current.addToast({ message: '1' });
      result.current.addToast({ message: '2' });
      result.current.addToast({ message: '3' });
      result.current.addToast({ message: '4' });
    });

    expect(result.current.toasts).toHaveLength(3);
    expect(result.current.toasts[0].message).toBe('2');
    expect(result.current.toasts[2].message).toBe('4');
  });

  it('shows success toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.success('Operation successful');
    });

    expect(result.current.toasts[0].type).toBe('success');
    expect(result.current.toasts[0].message).toBe('Operation successful');
    expect(result.current.toasts[0].title).toBe('Success');
  });

  it('shows error toast with longer duration', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.error('Something went wrong');
    });

    expect(result.current.toasts[0].type).toBe('error');
    expect(result.current.toasts[0].duration).toBe(7000);
  });

  it('shows warning toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.warning('Be careful');
    });

    expect(result.current.toasts[0].type).toBe('warning');
    expect(result.current.toasts[0].title).toBe('Warning');
  });

  it('shows info toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.info('Here is some info');
    });

    expect(result.current.toasts[0].type).toBe('info');
    expect(result.current.toasts[0].title).toBe('Info');
  });

  it('applies default options to toasts', () => {
    const { result } = renderHook(() => useToast({
      defaultPosition: 'bottom-left',
      defaultDuration: 3000
    }));

    act(() => {
      result.current.addToast({ message: 'Test' });
    });

    expect(result.current.toasts[0].position).toBe('bottom-left');
    expect(result.current.toasts[0].duration).toBe(3000);
  });

  it('allows custom options per toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.success('Test', {
        title: 'Custom Title',
        duration: 10000,
        position: 'top-center'
      });
    });

    expect(result.current.toasts[0].title).toBe('Custom Title');
    expect(result.current.toasts[0].duration).toBe(10000);
    expect(result.current.toasts[0].position).toBe('top-center');
  });

  it('handles promise toast - success', async () => {
    const { result } = renderHook(() => useToast());
    const mockPromise = Promise.resolve('Success data');

    await act(async () => {
      await result.current.promise(mockPromise, {
        loading: 'Loading...',
        success: 'Done!',
        error: 'Failed!'
      });
    });

    const finalToast = result.current.toasts[result.current.toasts.length - 1];
    expect(finalToast.type).toBe('success');
    expect(finalToast.message).toBe('Done!');
  });

  it('handles promise toast - error', async () => {
    const { result } = renderHook(() => useToast());
    const mockPromise = Promise.reject(new Error('Test error'));

    await act(async () => {
      try {
        await result.current.promise(mockPromise, {
          loading: 'Loading...',
          success: 'Done!',
          error: 'Failed!'
        });
      } catch (e) {
        // Expected
      }
    });

    const finalToast = result.current.toasts[result.current.toasts.length - 1];
    expect(finalToast.type).toBe('error');
    expect(finalToast.message).toBe('Failed!');
  });

  it('handles promise toast with function messages', async () => {
    const { result } = renderHook(() => useToast());
    const mockPromise = Promise.resolve({ value: 42 });

    await act(async () => {
      await result.current.promise(mockPromise, {
        loading: 'Loading...',
        success: (data) => `Got ${data.value}`,
        error: (err) => `Error: ${err.message}`
      });
    });

    const finalToast = result.current.toasts[result.current.toasts.length - 1];
    expect(finalToast.message).toBe('Got 42');
  });

  it('shows non-closable loading toast during promise', async () => {
    const { result } = renderHook(() => useToast());
    let resolvePromise;
    const mockPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    act(() => {
      result.current.promise(mockPromise);
    });

    // Check loading toast
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].type).toBe('info');
    expect(result.current.toasts[0].closable).toBe(false);
    expect(result.current.toasts[0].autoClose).toBe(false);

    await act(async () => {
      resolvePromise();
      await mockPromise;
    });

    // Loading toast should be removed
    const hasLoadingToast = result.current.toasts.some(t => t.closable === false);
    expect(hasLoadingToast).toBe(false);
  });

  it('sets default autoClose and closable', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.addToast({ message: 'Test' });
    });

    expect(result.current.toasts[0].autoClose).toBe(true);
    expect(result.current.toasts[0].closable).toBe(true);
  });

  it('returns toast ID from add functions', () => {
    const { result } = renderHook(() => useToast());
    let id1, id2;

    act(() => {
      id1 = result.current.success('Test 1');
      id2 = result.current.error('Test 2');
    });

    expect(typeof id1).toBe('string');
    expect(typeof id2).toBe('string');
    expect(id1).not.toBe(id2);
  });
});
