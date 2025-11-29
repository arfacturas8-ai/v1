import { renderHook, act } from '@testing-library/react';

import useConnectionStatus from '../useConnectionStatus';

describe('useConnectionStatus', () => {
  beforeEach(() => {
    // Set navigator.onLine to true by default
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return online status', () => {
    const { result } = renderHook(() => useConnectionStatus());
    expect(result.current.isOnline).toBe(true);
  });

  it('should detect offline status', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const { result } = renderHook(() => useConnectionStatus());
    expect(result.current.isOnline).toBe(false);
  });

  it('should update status when going offline', () => {
    const { result } = renderHook(() => useConnectionStatus());

    expect(result.current.isOnline).toBe(true);

    // Simulate going offline
    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isOnline).toBe(false);
  });

  it('should update status when going online', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const { result } = renderHook(() => useConnectionStatus());

    expect(result.current.isOnline).toBe(false);

    // Simulate going online
    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.isOnline).toBe(true);
  });

  it('should cleanup event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useConnectionStatus());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
  });
});
