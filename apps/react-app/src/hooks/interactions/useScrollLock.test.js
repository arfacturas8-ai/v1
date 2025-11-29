/**
 * Tests for useScrollLock hook
 */
import { renderHook } from '@testing-library/react';
import { useScrollLock } from './useScrollLock';

describe('useScrollLock', () => {
  beforeEach(() => {
    // Reset body styles
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';

    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    });

    Object.defineProperty(document.documentElement, 'clientWidth', {
      writable: true,
      configurable: true,
      value: 1000
    });
  });

  describe('Lock Scroll', () => {
    it('locks scroll when isLocked is true', () => {
      renderHook(() => useScrollLock(true));

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('does not lock scroll when isLocked is false', () => {
      renderHook(() => useScrollLock(false));

      expect(document.body.style.overflow).toBe('');
    });

    it('adds padding to compensate for scrollbar', () => {
      // Scrollbar width is 24px (1024 - 1000)
      renderHook(() => useScrollLock(true));

      expect(document.body.style.paddingRight).toBe('24px');
    });

    it('does not add padding when scrollbar width is 0', () => {
      Object.defineProperty(document.documentElement, 'clientWidth', {
        writable: true,
        configurable: true,
        value: 1024
      });

      renderHook(() => useScrollLock(true));

      expect(document.body.style.paddingRight).toBe('0px');
    });
  });

  describe('Unlock Scroll', () => {
    it('unlocks scroll when isLocked changes to false', () => {
      const { rerender } = renderHook(
        ({ locked }) => useScrollLock(locked),
        { initialProps: { locked: true } }
      );

      expect(document.body.style.overflow).toBe('hidden');

      rerender({ locked: false });

      expect(document.body.style.overflow).toBe('');
      expect(document.body.style.paddingRight).toBe('');
    });

    it('removes padding when unlocked', () => {
      const { rerender } = renderHook(
        ({ locked }) => useScrollLock(locked),
        { initialProps: { locked: true } }
      );

      expect(document.body.style.paddingRight).toBe('24px');

      rerender({ locked: false });

      expect(document.body.style.paddingRight).toBe('');
    });
  });

  describe('Toggle Behavior', () => {
    it('toggles between locked and unlocked states', () => {
      const { rerender } = renderHook(
        ({ locked }) => useScrollLock(locked),
        { initialProps: { locked: false } }
      );

      expect(document.body.style.overflow).toBe('');

      rerender({ locked: true });
      expect(document.body.style.overflow).toBe('hidden');

      rerender({ locked: false });
      expect(document.body.style.overflow).toBe('');

      rerender({ locked: true });
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('handles rapid toggles', () => {
      const { rerender } = renderHook(
        ({ locked }) => useScrollLock(locked),
        { initialProps: { locked: false } }
      );

      rerender({ locked: true });
      rerender({ locked: false });
      rerender({ locked: true });
      rerender({ locked: false });
      rerender({ locked: true });

      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  describe('Cleanup', () => {
    it('restores scroll on unmount when locked', () => {
      const { unmount } = renderHook(() => useScrollLock(true));

      expect(document.body.style.overflow).toBe('hidden');

      unmount();

      expect(document.body.style.overflow).toBe('');
      expect(document.body.style.paddingRight).toBe('');
    });

    it('leaves scroll unchanged on unmount when unlocked', () => {
      const { unmount } = renderHook(() => useScrollLock(false));

      expect(document.body.style.overflow).toBe('');

      unmount();

      expect(document.body.style.overflow).toBe('');
    });

    it('cleans up properly after multiple toggles', () => {
      const { rerender, unmount } = renderHook(
        ({ locked }) => useScrollLock(locked),
        { initialProps: { locked: false } }
      );

      rerender({ locked: true });
      rerender({ locked: false });
      rerender({ locked: true });

      unmount();

      expect(document.body.style.overflow).toBe('');
      expect(document.body.style.paddingRight).toBe('');
    });
  });

  describe('Different Scrollbar Widths', () => {
    it('handles scrollbar width of 10px', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1010
      });
      Object.defineProperty(document.documentElement, 'clientWidth', {
        writable: true,
        configurable: true,
        value: 1000
      });

      renderHook(() => useScrollLock(true));

      expect(document.body.style.paddingRight).toBe('10px');
    });

    it('handles scrollbar width of 17px (common on Windows)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1017
      });
      Object.defineProperty(document.documentElement, 'clientWidth', {
        writable: true,
        configurable: true,
        value: 1000
      });

      renderHook(() => useScrollLock(true));

      expect(document.body.style.paddingRight).toBe('17px');
    });

    it('handles no scrollbar (macOS overlay scrollbars)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1000
      });
      Object.defineProperty(document.documentElement, 'clientWidth', {
        writable: true,
        configurable: true,
        value: 1000
      });

      renderHook(() => useScrollLock(true));

      expect(document.body.style.paddingRight).toBe('0px');
    });
  });

  describe('Use Cases', () => {
    it('locks scroll when modal is open', () => {
      const { rerender } = renderHook(
        ({ isModalOpen }) => useScrollLock(isModalOpen),
        { initialProps: { isModalOpen: false } }
      );

      // Open modal
      rerender({ isModalOpen: true });

      expect(document.body.style.overflow).toBe('hidden');

      // Close modal
      rerender({ isModalOpen: false });

      expect(document.body.style.overflow).toBe('');
    });

    it('locks scroll when sidebar is open (mobile)', () => {
      const { rerender } = renderHook(
        ({ isSidebarOpen }) => useScrollLock(isSidebarOpen),
        { initialProps: { isSidebarOpen: false } }
      );

      rerender({ isSidebarOpen: true });

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('locks scroll when dropdown menu is open', () => {
      const { rerender } = renderHook(
        ({ isDropdownOpen }) => useScrollLock(isDropdownOpen),
        { initialProps: { isDropdownOpen: false } }
      );

      rerender({ isDropdownOpen: true });

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('locks scroll for fullscreen overlay', () => {
      renderHook(() => useScrollLock(true));

      expect(document.body.style.overflow).toBe('hidden');
      expect(document.body.style.paddingRight).toBe('24px');
    });
  });

  describe('Multiple Instances', () => {
    it('handles multiple hooks with different lock states', () => {
      renderHook(() => useScrollLock(false));
      renderHook(() => useScrollLock(false));
      renderHook(() => useScrollLock(true));

      // Last one wins
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('last mounted hook controls scroll lock', () => {
      const { unmount: unmount1 } = renderHook(() => useScrollLock(false));
      const { unmount: unmount2 } = renderHook(() => useScrollLock(true));

      expect(document.body.style.overflow).toBe('hidden');

      unmount2();

      expect(document.body.style.overflow).toBe('');

      unmount1();
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined isLocked', () => {
      renderHook(() => useScrollLock(undefined));

      // Falsy value, should not lock
      expect(document.body.style.overflow).toBe('');
    });

    it('handles null isLocked', () => {
      renderHook(() => useScrollLock(null));

      expect(document.body.style.overflow).toBe('');
    });

    it('handles isLocked as 0', () => {
      renderHook(() => useScrollLock(0));

      expect(document.body.style.overflow).toBe('');
    });

    it('handles isLocked as 1', () => {
      renderHook(() => useScrollLock(1));

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('handles isLocked as empty string', () => {
      renderHook(() => useScrollLock(''));

      expect(document.body.style.overflow).toBe('');
    });

    it('handles isLocked as non-empty string', () => {
      renderHook(() => useScrollLock('locked'));

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('preserves existing padding when unlocking', () => {
      document.body.style.paddingRight = '10px';

      const { rerender } = renderHook(
        ({ locked }) => useScrollLock(locked),
        { initialProps: { locked: true } }
      );

      rerender({ locked: false });

      expect(document.body.style.paddingRight).toBe('');
    });

    it('handles very large scrollbar width', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1100
      });
      Object.defineProperty(document.documentElement, 'clientWidth', {
        writable: true,
        configurable: true,
        value: 1000
      });

      renderHook(() => useScrollLock(true));

      expect(document.body.style.paddingRight).toBe('100px');
    });

    it('handles negative scrollbar width (edge case)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 900
      });
      Object.defineProperty(document.documentElement, 'clientWidth', {
        writable: true,
        configurable: true,
        value: 1000
      });

      renderHook(() => useScrollLock(true));

      expect(document.body.style.paddingRight).toBe('-100px');
    });
  });

  describe('State Changes', () => {
    it('updates immediately when isLocked changes', () => {
      const { rerender } = renderHook(
        ({ locked }) => useScrollLock(locked),
        { initialProps: { locked: false } }
      );

      expect(document.body.style.overflow).toBe('');

      rerender({ locked: true });

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('does not cause unnecessary updates when value does not change', () => {
      const { rerender } = renderHook(
        ({ locked }) => useScrollLock(locked),
        { initialProps: { locked: true } }
      );

      const overflowBefore = document.body.style.overflow;
      const paddingBefore = document.body.style.paddingRight;

      rerender({ locked: true });

      expect(document.body.style.overflow).toBe(overflowBefore);
      expect(document.body.style.paddingRight).toBe(paddingBefore);
    });
  });
});
