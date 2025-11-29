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

  describe('Initialization', () => {
    it('initializes with empty toasts array', () => {
      const { result } = renderHook(() => useToast());

      expect(result.current.toasts).toEqual([]);
    });

    it('provides addToast function', () => {
      const { result } = renderHook(() => useToast());

      expect(typeof result.current.addToast).toBe('function');
    });

    it('provides removeToast function', () => {
      const { result } = renderHook(() => useToast());

      expect(typeof result.current.removeToast).toBe('function');
    });

    it('provides helper functions', () => {
      const { result } = renderHook(() => useToast());

      expect(typeof result.current.success).toBe('function');
      expect(typeof result.current.error).toBe('function');
      expect(typeof result.current.info).toBe('function');
    });
  });

  describe('AddToast Function', () => {
    it('adds toast with default type', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('Test message');
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].message).toBe('Test message');
      expect(result.current.toasts[0].type).toBe('info');
    });

    it('adds toast with custom type', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('Error message', 'error');
      });

      expect(result.current.toasts[0].type).toBe('error');
    });

    it('adds toast with default duration', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('Message');
      });

      expect(result.current.toasts[0].duration).toBe(5000);
    });

    it('adds toast with custom duration', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('Message', 'info', 3000);
      });

      expect(result.current.toasts[0].duration).toBe(3000);
    });

    it('generates unique ID for each toast', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('Message 1');
        result.current.addToast('Message 2');
        result.current.addToast('Message 3');
      });

      const ids = result.current.toasts.map(t => t.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(3);
    });

    it('returns toast ID', () => {
      const { result } = renderHook(() => useToast());

      let toastId;
      act(() => {
        toastId = result.current.addToast('Message');
      });

      expect(typeof toastId).toBe('number');
      expect(result.current.toasts[0].id).toBe(toastId);
    });

    it('adds multiple toasts', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('Message 1');
        result.current.addToast('Message 2');
        result.current.addToast('Message 3');
      });

      expect(result.current.toasts).toHaveLength(3);
    });
  });

  describe('RemoveToast Function', () => {
    it('removes toast by ID', () => {
      const { result } = renderHook(() => useToast());

      let toastId;
      act(() => {
        toastId = result.current.addToast('Message');
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        result.current.removeToast(toastId);
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('removes specific toast from multiple toasts', () => {
      const { result } = renderHook(() => useToast());

      let id1, id2, id3;
      act(() => {
        id1 = result.current.addToast('Message 1');
        id2 = result.current.addToast('Message 2');
        id3 = result.current.addToast('Message 3');
      });

      expect(result.current.toasts).toHaveLength(3);

      act(() => {
        result.current.removeToast(id2);
      });

      expect(result.current.toasts).toHaveLength(2);
      expect(result.current.toasts.find(t => t.id === id1)).toBeDefined();
      expect(result.current.toasts.find(t => t.id === id2)).toBeUndefined();
      expect(result.current.toasts.find(t => t.id === id3)).toBeDefined();
    });

    it('handles removing non-existent toast', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('Message');
      });

      act(() => {
        result.current.removeToast(999);
      });

      expect(result.current.toasts).toHaveLength(1);
    });
  });

  describe('Auto-Dismiss', () => {
    it('auto-dismisses toast after duration', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('Message', 'info', 3000);
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('does not auto-dismiss when duration is 0', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('Message', 'info', 0);
      });

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(result.current.toasts).toHaveLength(1);
    });

    it('does not auto-dismiss when duration is null', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('Message', 'info', null);
      });

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(result.current.toasts).toHaveLength(1);
    });

    it('auto-dismisses multiple toasts independently', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('Message 1', 'info', 2000);
        result.current.addToast('Message 2', 'info', 4000);
        result.current.addToast('Message 3', 'info', 6000);
      });

      expect(result.current.toasts).toHaveLength(3);

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.toasts).toHaveLength(2);

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.toasts).toHaveLength(0);
    });
  });

  describe('Helper Functions', () => {
    it('success helper adds success toast', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.success('Success message');
      });

      expect(result.current.toasts[0].type).toBe('success');
      expect(result.current.toasts[0].message).toBe('Success message');
    });

    it('error helper adds error toast', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.error('Error message');
      });

      expect(result.current.toasts[0].type).toBe('error');
      expect(result.current.toasts[0].message).toBe('Error message');
    });

    it('info helper adds info toast', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.info('Info message');
      });

      expect(result.current.toasts[0].type).toBe('info');
      expect(result.current.toasts[0].message).toBe('Info message');
    });

    it('helper functions accept custom duration', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.success('Message', 2000);
      });

      expect(result.current.toasts[0].duration).toBe(2000);
    });

    it('helper functions return toast ID', () => {
      const { result } = renderHook(() => useToast());

      let successId, errorId, infoId;
      act(() => {
        successId = result.current.success('Success');
        errorId = result.current.error('Error');
        infoId = result.current.info('Info');
      });

      expect(typeof successId).toBe('number');
      expect(typeof errorId).toBe('number');
      expect(typeof infoId).toBe('number');
    });
  });

  describe('Toast Structure', () => {
    it('creates toast with correct structure', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('Test message', 'info', 5000);
      });

      const toast = result.current.toasts[0];

      expect(toast).toHaveProperty('id');
      expect(toast).toHaveProperty('message');
      expect(toast).toHaveProperty('type');
      expect(toast).toHaveProperty('duration');
      expect(toast.message).toBe('Test message');
      expect(toast.type).toBe('info');
      expect(toast.duration).toBe(5000);
    });

    it('toast ID is a number', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('Message');
      });

      expect(typeof result.current.toasts[0].id).toBe('number');
    });
  });

  describe('Use Cases', () => {
    it('shows success notification after form submit', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.success('Form submitted successfully!');
      });

      expect(result.current.toasts[0].type).toBe('success');
      expect(result.current.toasts[0].message).toBe('Form submitted successfully!');
    });

    it('shows error notification on API failure', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.error('Failed to load data. Please try again.');
      });

      expect(result.current.toasts[0].type).toBe('error');
    });

    it('shows info notification for general messages', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.info('Your session will expire in 5 minutes');
      });

      expect(result.current.toasts[0].type).toBe('info');
    });

    it('shows multiple notifications simultaneously', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.info('Loading data...');
        result.current.success('User logged in');
        result.current.error('Connection lost');
      });

      expect(result.current.toasts).toHaveLength(3);
      expect(result.current.toasts[0].type).toBe('info');
      expect(result.current.toasts[1].type).toBe('success');
      expect(result.current.toasts[2].type).toBe('error');
    });

    it('manually dismisses persistent toast', () => {
      const { result } = renderHook(() => useToast());

      let toastId;
      act(() => {
        toastId = result.current.addToast('Permanent message', 'info', 0);
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        result.current.removeToast(toastId);
      });

      expect(result.current.toasts).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty message', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('');
      });

      expect(result.current.toasts[0].message).toBe('');
    });

    it('handles very long message', () => {
      const { result } = renderHook(() => useToast());

      const longMessage = 'a'.repeat(1000);

      act(() => {
        result.current.addToast(longMessage);
      });

      expect(result.current.toasts[0].message).toBe(longMessage);
    });

    it('handles special characters in message', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('Message with <html> & "quotes" and \'apostrophes\'');
      });

      expect(result.current.toasts[0].message).toContain('<html>');
      expect(result.current.toasts[0].message).toContain('&');
      expect(result.current.toasts[0].message).toContain('"quotes"');
    });

    it('handles very short duration', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('Message', 'info', 100);
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('handles very long duration', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('Message', 'info', 100000);
      });

      act(() => {
        jest.advanceTimersByTime(99999);
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        jest.advanceTimersByTime(1);
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('handles adding many toasts rapidly', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.addToast(`Message ${i}`);
        }
      });

      expect(result.current.toasts).toHaveLength(100);
    });

    it('handles removing toast that was already auto-dismissed', () => {
      const { result } = renderHook(() => useToast());

      let toastId;
      act(() => {
        toastId = result.current.addToast('Message', 'info', 1000);
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Toast already removed by auto-dismiss
      expect(result.current.toasts).toHaveLength(0);

      // Try to remove again manually
      act(() => {
        result.current.removeToast(toastId);
      });

      expect(result.current.toasts).toHaveLength(0);
    });
  });

  describe('Function Reference Stability', () => {
    it('addToast maintains reference equality', () => {
      const { result, rerender } = renderHook(() => useToast());

      const addToastFn = result.current.addToast;

      rerender();

      expect(result.current.addToast).toBe(addToastFn);
    });

    it('removeToast maintains reference equality', () => {
      const { result, rerender } = renderHook(() => useToast());

      const removeToastFn = result.current.removeToast;

      rerender();

      expect(result.current.removeToast).toBe(removeToastFn);
    });

    it('helper functions maintain reference equality', () => {
      const { result, rerender } = renderHook(() => useToast());

      const successFn = result.current.success;
      const errorFn = result.current.error;
      const infoFn = result.current.info;

      rerender();

      expect(result.current.success).toBe(successFn);
      expect(result.current.error).toBe(errorFn);
      expect(result.current.info).toBe(infoFn);
    });
  });
});
