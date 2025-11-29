/**
 * Tests for useKeyPress hook
 */
import { renderHook, act } from '@testing-library/react';
import { useKeyPress } from './useKeyPress';

describe('useKeyPress', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Key Press', () => {
    it('initializes with false', () => {
      const { result } = renderHook(() => useKeyPress('Enter'));

      expect(result.current).toBe(false);
    });

    it('detects key press', () => {
      const { result } = renderHook(() => useKeyPress('Enter'));

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      });

      expect(result.current).toBe(true);
    });

    it('detects key release', () => {
      const { result } = renderHook(() => useKeyPress('Enter'));

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      });

      expect(result.current).toBe(true);

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
      });

      expect(result.current).toBe(false);
    });

    it('ignores different keys', () => {
      const { result } = renderHook(() => useKeyPress('Enter'));

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      });

      expect(result.current).toBe(false);
    });
  });

  describe('Modifier Keys', () => {
    it('detects Ctrl+key combination', () => {
      const { result } = renderHook(() => useKeyPress('s', { ctrl: true }));

      // Without Ctrl
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }));
      });
      expect(result.current).toBe(false);

      // With Ctrl
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true }));
      });
      expect(result.current).toBe(true);
    });

    it('detects Cmd+key combination on Mac', () => {
      const { result } = renderHook(() => useKeyPress('s', { ctrl: true }));

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', metaKey: true }));
      });

      expect(result.current).toBe(true);
    });

    it('detects Shift+key combination', () => {
      const { result } = renderHook(() => useKeyPress('A', { shift: true }));

      // Without Shift
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'A' }));
      });
      expect(result.current).toBe(false);

      // With Shift
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'A', shiftKey: true }));
      });
      expect(result.current).toBe(true);
    });

    it('detects Alt+key combination', () => {
      const { result } = renderHook(() => useKeyPress('F4', { alt: true }));

      // Without Alt
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F4' }));
      });
      expect(result.current).toBe(false);

      // With Alt
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F4', altKey: true }));
      });
      expect(result.current).toBe(true);
    });

    it('detects multiple modifiers', () => {
      const { result } = renderHook(() =>
        useKeyPress('s', { ctrl: true, shift: true })
      );

      // Only Ctrl
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true }));
      });
      expect(result.current).toBe(false);

      // Ctrl+Shift
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', {
          key: 's',
          ctrlKey: true,
          shiftKey: true
        }));
      });
      expect(result.current).toBe(true);
    });

    it('requires exact modifier match', () => {
      const { result } = renderHook(() => useKeyPress('s', { ctrl: true }));

      // Ctrl+Shift+s should not match Ctrl+s
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', {
          key: 's',
          ctrlKey: true,
          shiftKey: true
        }));
      });
      expect(result.current).toBe(false);

      // Just Ctrl+s should match
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', {
          key: 's',
          ctrlKey: true
        }));
      });
      expect(result.current).toBe(true);
    });
  });

  describe('Prevent Default', () => {
    it('prevents default behavior on keydown', () => {
      renderHook(() => useKeyPress('Enter'));

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      act(() => {
        window.dispatchEvent(event);
      });

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('does not prevent default for non-matching keys', () => {
      renderHook(() => useKeyPress('Enter'));

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      act(() => {
        window.dispatchEvent(event);
      });

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('prevents default for modifier combinations', () => {
      renderHook(() => useKeyPress('s', { ctrl: true }));

      const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      act(() => {
        window.dispatchEvent(event);
      });

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Event Listeners Cleanup', () => {
    it('removes event listeners on unmount', () => {
      const addSpy = jest.spyOn(window, 'addEventListener');
      const removeSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useKeyPress('Enter'));

      expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(addSpy).toHaveBeenCalledWith('keyup', expect.any(Function));

      unmount();

      expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(removeSpy).toHaveBeenCalledWith('keyup', expect.any(Function));
    });

    it('re-subscribes when target key changes', () => {
      const removeSpy = jest.spyOn(window, 'removeEventListener');
      const addSpy = jest.spyOn(window, 'addEventListener');

      const { rerender } = renderHook(
        ({ key }) => useKeyPress(key),
        { initialProps: { key: 'Enter' } }
      );

      const initialAddCalls = addSpy.mock.calls.length;

      rerender({ key: 'Escape' });

      expect(removeSpy).toHaveBeenCalled();
      expect(addSpy.mock.calls.length).toBeGreaterThan(initialAddCalls);
    });

    it('re-subscribes when modifiers change', () => {
      const removeSpy = jest.spyOn(window, 'removeEventListener');

      const { rerender } = renderHook(
        ({ options }) => useKeyPress('s', options),
        { initialProps: { options: { ctrl: false } } }
      );

      rerender({ options: { ctrl: true } });

      expect(removeSpy).toHaveBeenCalled();
    });
  });

  describe('Common Key Combinations', () => {
    it('detects Ctrl+S (Save)', () => {
      const { result } = renderHook(() => useKeyPress('s', { ctrl: true }));

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', {
          key: 's',
          ctrlKey: true
        }));
      });

      expect(result.current).toBe(true);
    });

    it('detects Ctrl+C (Copy)', () => {
      const { result } = renderHook(() => useKeyPress('c', { ctrl: true }));

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'c',
          ctrlKey: true
        }));
      });

      expect(result.current).toBe(true);
    });

    it('detects Ctrl+V (Paste)', () => {
      const { result } = renderHook(() => useKeyPress('v', { ctrl: true }));

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'v',
          ctrlKey: true
        }));
      });

      expect(result.current).toBe(true);
    });

    it('detects Ctrl+Z (Undo)', () => {
      const { result } = renderHook(() => useKeyPress('z', { ctrl: true }));

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'z',
          ctrlKey: true
        }));
      });

      expect(result.current).toBe(true);
    });

    it('detects Escape key', () => {
      const { result } = renderHook(() => useKeyPress('Escape'));

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      });

      expect(result.current).toBe(true);
    });

    it('detects Enter key', () => {
      const { result } = renderHook(() => useKeyPress('Enter'));

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      });

      expect(result.current).toBe(true);
    });

    it('detects Arrow keys', () => {
      const { result: upResult } = renderHook(() => useKeyPress('ArrowUp'));
      const { result: downResult } = renderHook(() => useKeyPress('ArrowDown'));
      const { result: leftResult } = renderHook(() => useKeyPress('ArrowLeft'));
      const { result: rightResult } = renderHook(() => useKeyPress('ArrowRight'));

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
      });
      expect(upResult.current).toBe(true);

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      });
      expect(downResult.current).toBe(true);

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
      });
      expect(leftResult.current).toBe(true);

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      });
      expect(rightResult.current).toBe(true);
    });
  });

  describe('Multiple Key Press States', () => {
    it('tracks multiple keys independently', () => {
      const { result: enterResult } = renderHook(() => useKeyPress('Enter'));
      const { result: escapeResult } = renderHook(() => useKeyPress('Escape'));

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      });

      expect(enterResult.current).toBe(true);
      expect(escapeResult.current).toBe(false);

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      });

      expect(enterResult.current).toBe(true);
      expect(escapeResult.current).toBe(true);

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
      });

      expect(enterResult.current).toBe(false);
      expect(escapeResult.current).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid key presses', () => {
      const { result } = renderHook(() => useKeyPress('a'));

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
        window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
        window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      });

      expect(result.current).toBe(true);
    });

    it('handles empty options object', () => {
      const { result } = renderHook(() => useKeyPress('Enter', {}));

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      });

      expect(result.current).toBe(true);
    });

    it('handles keyup without prior keydown', () => {
      const { result } = renderHook(() => useKeyPress('Enter'));

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
      });

      expect(result.current).toBe(false);
    });

    it('handles case-sensitive keys', () => {
      const { result } = renderHook(() => useKeyPress('A'));

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      });
      expect(result.current).toBe(false);

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'A' }));
      });
      expect(result.current).toBe(true);
    });
  });
});
