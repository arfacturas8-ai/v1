/**
 * Tests for useAsync hook
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAsync } from './useAsync';

describe('useAsync', () => {
  describe('Initialization', () => {
    it('initializes with idle status', () => {
      const asyncFn = jest.fn();
      const { result } = renderHook(() => useAsync(asyncFn));

      expect(result.current.status).toBe('idle');
      expect(result.current.isIdle).toBe(true);
    });

    it('initializes with null data', () => {
      const asyncFn = jest.fn();
      const { result } = renderHook(() => useAsync(asyncFn));

      expect(result.current.data).toBe(null);
    });

    it('initializes with null error', () => {
      const asyncFn = jest.fn();
      const { result } = renderHook(() => useAsync(asyncFn));

      expect(result.current.error).toBe(null);
    });

    it('initializes with all status flags correct', () => {
      const asyncFn = jest.fn();
      const { result } = renderHook(() => useAsync(asyncFn));

      expect(result.current.isIdle).toBe(true);
      expect(result.current.isPending).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(false);
    });

    it('provides execute function', () => {
      const asyncFn = jest.fn();
      const { result } = renderHook(() => useAsync(asyncFn));

      expect(typeof result.current.execute).toBe('function');
    });

    it('provides reset function', () => {
      const asyncFn = jest.fn();
      const { result } = renderHook(() => useAsync(asyncFn));

      expect(typeof result.current.reset).toBe('function');
    });
  });

  describe('Execute Function', () => {
    it('sets status to pending when executed', async () => {
      const asyncFn = jest.fn().mockResolvedValue('result');
      const { result } = renderHook(() => useAsync(asyncFn));

      act(() => {
        result.current.execute();
      });

      expect(result.current.status).toBe('pending');
      expect(result.current.isPending).toBe(true);

      await waitFor(() => {
        expect(result.current.status).toBe('success');
      });
    });

    it('sets status to success on resolve', async () => {
      const asyncFn = jest.fn().mockResolvedValue('success data');
      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.status).toBe('success');
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toBe('success data');
    });

    it('sets status to error on reject', async () => {
      const error = new Error('Test error');
      const asyncFn = jest.fn().mockRejectedValue(error);
      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        try {
          await result.current.execute();
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.status).toBe('error');
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBe(error);
    });

    it('calls async function with provided parameters', async () => {
      const asyncFn = jest.fn().mockResolvedValue('result');
      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        await result.current.execute('param1', 'param2', 123);
      });

      expect(asyncFn).toHaveBeenCalledWith('param1', 'param2', 123);
    });

    it('returns result from async function', async () => {
      const asyncFn = jest.fn().mockResolvedValue('return value');
      const { result } = renderHook(() => useAsync(asyncFn));

      let returnValue;
      await act(async () => {
        returnValue = await result.current.execute();
      });

      expect(returnValue).toBe('return value');
    });

    it('throws error from async function', async () => {
      const error = new Error('Async error');
      const asyncFn = jest.fn().mockRejectedValue(error);
      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        await expect(result.current.execute()).rejects.toThrow('Async error');
      });
    });
  });

  describe('State Updates During Execution', () => {
    it('clears data when starting new execution', async () => {
      const asyncFn = jest.fn()
        .mockResolvedValueOnce('first')
        .mockResolvedValueOnce('second');

      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toBe('first');

      act(() => {
        result.current.execute();
      });

      expect(result.current.data).toBe(null);

      await waitFor(() => {
        expect(result.current.data).toBe('second');
      });
    });

    it('clears error when starting new execution', async () => {
      const asyncFn = jest.fn()
        .mockRejectedValueOnce(new Error('Error'))
        .mockResolvedValueOnce('success');

      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        try {
          await result.current.execute();
        } catch (e) {
          // Expected
        }
      });

      expect(result.current.error).toBeTruthy();

      act(() => {
        result.current.execute();
      });

      expect(result.current.error).toBe(null);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('updates status through complete lifecycle', async () => {
      const asyncFn = jest.fn().mockResolvedValue('data');
      const { result } = renderHook(() => useAsync(asyncFn));

      expect(result.current.status).toBe('idle');

      act(() => {
        result.current.execute();
      });

      expect(result.current.status).toBe('pending');

      await waitFor(() => {
        expect(result.current.status).toBe('success');
      });
    });
  });

  describe('Reset Function', () => {
    it('resets to initial state', async () => {
      const asyncFn = jest.fn().mockResolvedValue('data');
      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.status).toBe('success');
      expect(result.current.data).toBe('data');

      act(() => {
        result.current.reset();
      });

      expect(result.current.status).toBe('idle');
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('resets after error', async () => {
      const asyncFn = jest.fn().mockRejectedValue(new Error('Error'));
      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        try {
          await result.current.execute();
        } catch (e) {
          // Expected
        }
      });

      expect(result.current.isError).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.isIdle).toBe(true);
      expect(result.current.error).toBe(null);
    });

    it('can execute again after reset', async () => {
      const asyncFn = jest.fn().mockResolvedValue('new data');
      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        await result.current.execute();
      });

      act(() => {
        result.current.reset();
      });

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.status).toBe('success');
      expect(result.current.data).toBe('new data');
    });
  });

  describe('Multiple Executions', () => {
    it('handles sequential executions', async () => {
      const asyncFn = jest.fn()
        .mockResolvedValueOnce('first')
        .mockResolvedValueOnce('second')
        .mockResolvedValueOnce('third');

      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        await result.current.execute();
      });
      expect(result.current.data).toBe('first');

      await act(async () => {
        await result.current.execute();
      });
      expect(result.current.data).toBe('second');

      await act(async () => {
        await result.current.execute();
      });
      expect(result.current.data).toBe('third');
    });

    it('handles different parameters in multiple executions', async () => {
      const asyncFn = jest.fn().mockImplementation((x) => Promise.resolve(x * 2));
      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        await result.current.execute(5);
      });
      expect(result.current.data).toBe(10);

      await act(async () => {
        await result.current.execute(10);
      });
      expect(result.current.data).toBe(20);

      await act(async () => {
        await result.current.execute(15);
      });
      expect(result.current.data).toBe(30);
    });
  });

  describe('Use Cases', () => {
    it('fetches data from API', async () => {
      const fetchUser = jest.fn().mockResolvedValue({ id: 1, name: 'John' });
      const { result } = renderHook(() => useAsync(fetchUser));

      await act(async () => {
        await result.current.execute(1);
      });

      expect(result.current.data).toEqual({ id: 1, name: 'John' });
      expect(result.current.isSuccess).toBe(true);
    });

    it('handles API error', async () => {
      const fetchUser = jest.fn().mockRejectedValue(new Error('User not found'));
      const { result } = renderHook(() => useAsync(fetchUser));

      await act(async () => {
        try {
          await result.current.execute(999);
        } catch (e) {
          // Expected
        }
      });

      expect(result.current.error.message).toBe('User not found');
      expect(result.current.isError).toBe(true);
    });

    it('submits form data', async () => {
      const submitForm = jest.fn().mockResolvedValue({ success: true });
      const { result } = renderHook(() => useAsync(submitForm));

      const formData = { name: 'Alice', email: 'alice@example.com' };

      await act(async () => {
        await result.current.execute(formData);
      });

      expect(submitForm).toHaveBeenCalledWith(formData);
      expect(result.current.data).toEqual({ success: true });
    });

    it('uploads file', async () => {
      const uploadFile = jest.fn().mockResolvedValue({ url: 'http://example.com/file.jpg' });
      const { result } = renderHook(() => useAsync(uploadFile));

      const file = new File(['content'], 'test.jpg');

      await act(async () => {
        await result.current.execute(file);
      });

      expect(result.current.data.url).toBe('http://example.com/file.jpg');
    });
  });

  describe('Status Flags', () => {
    it('has correct flags in idle state', () => {
      const asyncFn = jest.fn();
      const { result } = renderHook(() => useAsync(asyncFn));

      expect(result.current.isIdle).toBe(true);
      expect(result.current.isPending).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(false);
    });

    it('has correct flags in pending state', () => {
      const asyncFn = jest.fn().mockImplementation(() => new Promise(() => {}));
      const { result } = renderHook(() => useAsync(asyncFn));

      act(() => {
        result.current.execute();
      });

      expect(result.current.isIdle).toBe(false);
      expect(result.current.isPending).toBe(true);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(false);
    });

    it('has correct flags in success state', async () => {
      const asyncFn = jest.fn().mockResolvedValue('data');
      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.isIdle).toBe(false);
      expect(result.current.isPending).toBe(false);
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.isError).toBe(false);
    });

    it('has correct flags in error state', async () => {
      const asyncFn = jest.fn().mockRejectedValue(new Error('Error'));
      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        try {
          await result.current.execute();
        } catch (e) {
          // Expected
        }
      });

      expect(result.current.isIdle).toBe(false);
      expect(result.current.isPending).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('handles async function that returns undefined', async () => {
      const asyncFn = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toBeUndefined();
      expect(result.current.isSuccess).toBe(true);
    });

    it('handles async function that returns null', async () => {
      const asyncFn = jest.fn().mockResolvedValue(null);
      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toBe(null);
      expect(result.current.isSuccess).toBe(true);
    });

    it('handles async function that returns 0', async () => {
      const asyncFn = jest.fn().mockResolvedValue(0);
      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toBe(0);
      expect(result.current.isSuccess).toBe(true);
    });

    it('handles async function that returns false', async () => {
      const asyncFn = jest.fn().mockResolvedValue(false);
      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toBe(false);
      expect(result.current.isSuccess).toBe(true);
    });

    it('handles error with no message', async () => {
      const asyncFn = jest.fn().mockRejectedValue(new Error());
      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        try {
          await result.current.execute();
        } catch (e) {
          // Expected
        }
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.isError).toBe(true);
    });

    it('handles non-Error rejection', async () => {
      const asyncFn = jest.fn().mockRejectedValue('String error');
      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        try {
          await result.current.execute();
        } catch (e) {
          // Expected
        }
      });

      expect(result.current.error).toBe('String error');
      expect(result.current.isError).toBe(true);
    });
  });

  describe('Function Reference Stability', () => {
    it('execute function maintains reference equality', () => {
      const asyncFn = jest.fn().mockResolvedValue('data');
      const { result, rerender } = renderHook(() => useAsync(asyncFn));

      const executeFn = result.current.execute;

      rerender();

      expect(result.current.execute).toBe(executeFn);
    });

    it('reset function maintains reference equality', () => {
      const asyncFn = jest.fn().mockResolvedValue('data');
      const { result, rerender } = renderHook(() => useAsync(asyncFn));

      const resetFn = result.current.reset;

      rerender();

      expect(result.current.reset).toBe(resetFn);
    });
  });
});
