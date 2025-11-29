/**
 * Tests for useModal hook
 */
import { renderHook, act } from '@testing-library/react';
import { useModal } from './useModal';

describe('useModal', () => {
  it('initializes with closed state by default', () => {
    const { result } = renderHook(() => useModal());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.modalData).toBe(null);
  });

  it('initializes with custom initial state', () => {
    const { result } = renderHook(() => useModal(true));

    expect(result.current.isOpen).toBe(true);
  });

  it('opens modal', () => {
    const { result } = renderHook(() => useModal());

    act(() => {
      result.current.open();
    });

    expect(result.current.isOpen).toBe(true);
  });

  it('opens modal with data', () => {
    const { result } = renderHook(() => useModal());
    const testData = { id: 1, name: 'Test' };

    act(() => {
      result.current.open(testData);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.modalData).toEqual(testData);
  });

  it('closes modal', () => {
    const { result } = renderHook(() => useModal(true));

    act(() => {
      result.current.close();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.modalData).toBe(null);
  });

  it('toggles modal state', () => {
    const { result } = renderHook(() => useModal());

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('calls onOpen callback', () => {
    const onOpen = jest.fn();
    const { result } = renderHook(() => useModal(false, { onOpen }));
    const testData = { test: 'data' };

    act(() => {
      result.current.open(testData);
    });

    expect(onOpen).toHaveBeenCalledWith(testData);
  });

  it('calls onClose callback', () => {
    const onClose = jest.fn();
    const { result } = renderHook(() => useModal(true, { onClose }));

    act(() => {
      result.current.close();
    });

    expect(onClose).toHaveBeenCalled();
  });

  it('prevents close when preventClose is true', () => {
    const { result } = renderHook(() => useModal(true, { preventClose: true }));

    act(() => {
      result.current.close();
    });

    expect(result.current.isOpen).toBe(true);
  });

  it('handles escape key to close modal', () => {
    const { result } = renderHook(() => useModal(true, { closeOnEscape: true }));

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);
    });

    expect(result.current.isOpen).toBe(false);
  });

  it('does not close on escape when closeOnEscape is false', () => {
    const { result } = renderHook(() => useModal(true, { closeOnEscape: false }));

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);
    });

    expect(result.current.isOpen).toBe(true);
  });

  it('does not listen for escape when modal is closed', () => {
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    const { result } = renderHook(() => useModal(false, { closeOnEscape: true }));

    // Should not add listener when closed
    expect(addEventListenerSpy).not.toHaveBeenCalledWith('keydown', expect.any(Function));

    // Open modal
    act(() => {
      result.current.open();
    });

    // Should add listener when opened
    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    addEventListenerSpy.mockRestore();
  });

  it('cleans up event listener on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => useModal(true, { closeOnEscape: true }));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    removeEventListenerSpy.mockRestore();
  });

  it('allows updating modalData directly', () => {
    const { result } = renderHook(() => useModal());
    const newData = { updated: true };

    act(() => {
      result.current.setModalData(newData);
    });

    expect(result.current.modalData).toEqual(newData);
  });

  it('handles multiple rapid toggles', () => {
    const { result } = renderHook(() => useModal());

    act(() => {
      result.current.toggle();
      result.current.toggle();
      result.current.toggle();
    });

    expect(result.current.isOpen).toBe(true);
  });

  it('ignores non-escape keys', () => {
    const { result } = renderHook(() => useModal(true, { closeOnEscape: true }));

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(event);
    });

    expect(result.current.isOpen).toBe(true);
  });

  it('respects preventClose with escape key', () => {
    const { result } = renderHook(() => useModal(true, {
      closeOnEscape: true,
      preventClose: true
    }));

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);
    });

    expect(result.current.isOpen).toBe(true);
  });
});
