/**
 * Tests for touchGestures utility
 */
import { TouchGestureManager, MobileUtils } from './touchGestures';

describe('TouchGestureManager', () => {
  let element;
  let manager;

  beforeEach(() => {
    jest.useFakeTimers();
    element = document.createElement('div');
    document.body.appendChild(element);
  });

  afterEach(() => {
    if (manager) {
      manager.destroy();
    }
    jest.useRealTimers();
    document.body.innerHTML = '';
  });

  describe('Constructor', () => {
    it('initializes with element', () => {
      manager = new TouchGestureManager(element);

      expect(manager.element).toBe(element);
    });

    it('uses default options', () => {
      manager = new TouchGestureManager(element);

      expect(manager.options.swipeThreshold).toBe(50);
      expect(manager.options.longPressDelay).toBe(500);
      expect(manager.options.tapThreshold).toBe(10);
    });

    it('merges custom options', () => {
      manager = new TouchGestureManager(element, {
        swipeThreshold: 100,
        longPressDelay: 1000
      });

      expect(manager.options.swipeThreshold).toBe(100);
      expect(manager.options.longPressDelay).toBe(1000);
    });

    it('initializes state', () => {
      manager = new TouchGestureManager(element);

      expect(manager.state.isActive).toBe(false);
      expect(manager.state.scale).toBe(1);
    });

    it('initializes callbacks', () => {
      manager = new TouchGestureManager(element);

      expect(manager.callbacks.onSwipeLeft).toBe(null);
      expect(manager.callbacks.onTap).toBe(null);
      expect(manager.callbacks.onPinch).toBe(null);
    });
  });

  describe('Touch Start', () => {
    it('activates on touch start', () => {
      manager = new TouchGestureManager(element);

      const touchEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 }]
      });

      element.dispatchEvent(touchEvent);

      expect(manager.state.isActive).toBe(true);
    });

    it('records start position', () => {
      manager = new TouchGestureManager(element);

      const touchEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 150, clientY: 200 }]
      });

      element.dispatchEvent(touchEvent);

      expect(manager.state.startTouch).toEqual({ x: 150, y: 200 });
    });

    it('starts long press timer', () => {
      manager = new TouchGestureManager(element);
      const onLongPress = jest.fn();
      manager.on('longPress', onLongPress);

      const touchEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 }]
      });

      element.dispatchEvent(touchEvent);

      jest.advanceTimersByTime(500);

      expect(onLongPress).toHaveBeenCalledWith({ x: 100, y: 100 });
    });

    it('handles multi-touch for pinch', () => {
      manager = new TouchGestureManager(element);
      const onPinchStart = jest.fn();
      manager.on('pinchStart', onPinchStart);

      const touchEvent = new TouchEvent('touchstart', {
        touches: [
          { clientX: 100, clientY: 100 },
          { clientX: 200, clientY: 200 }
        ]
      });

      element.dispatchEvent(touchEvent);

      expect(onPinchStart).toHaveBeenCalled();
    });
  });

  describe('Touch Move', () => {
    it('updates current touch position', () => {
      manager = new TouchGestureManager(element);

      const startEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      element.dispatchEvent(startEvent);

      const moveEvent = new TouchEvent('touchmove', {
        touches: [{ clientX: 150, clientY: 150 }]
      });
      element.dispatchEvent(moveEvent);

      expect(manager.state.currentTouch).toEqual({ x: 150, y: 150 });
    });

    it('triggers drag callback', () => {
      manager = new TouchGestureManager(element);
      const onDrag = jest.fn();
      manager.on('drag', onDrag);

      const startEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      element.dispatchEvent(startEvent);

      const moveEvent = new TouchEvent('touchmove', {
        touches: [{ clientX: 150, clientY: 100 }]
      });
      element.dispatchEvent(moveEvent);

      expect(onDrag).toHaveBeenCalledWith(
        expect.objectContaining({
          startX: 100,
          startY: 100,
          currentX: 150,
          currentY: 100,
          deltaX: 50,
          deltaY: 0
        })
      );
    });

    it('cancels long press on movement', () => {
      manager = new TouchGestureManager(element);
      const onLongPress = jest.fn();
      manager.on('longPress', onLongPress);

      const startEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      element.dispatchEvent(startEvent);

      const moveEvent = new TouchEvent('touchmove', {
        touches: [{ clientX: 200, clientY: 100 }]
      });
      element.dispatchEvent(moveEvent);

      jest.advanceTimersByTime(500);

      expect(onLongPress).not.toHaveBeenCalled();
    });
  });

  describe('Swipe Detection', () => {
    it('detects swipe left', () => {
      manager = new TouchGestureManager(element);
      const onSwipeLeft = jest.fn();
      manager.on('swipeLeft', onSwipeLeft);

      const startEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 200, clientY: 100 }]
      });
      element.dispatchEvent(startEvent);

      const endEvent = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 50, clientY: 100 }]
      });
      element.dispatchEvent(endEvent);

      expect(onSwipeLeft).toHaveBeenCalled();
    });

    it('detects swipe right', () => {
      manager = new TouchGestureManager(element);
      const onSwipeRight = jest.fn();
      manager.on('swipeRight', onSwipeRight);

      const startEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 50, clientY: 100 }]
      });
      element.dispatchEvent(startEvent);

      const endEvent = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 200, clientY: 100 }]
      });
      element.dispatchEvent(endEvent);

      expect(onSwipeRight).toHaveBeenCalled();
    });

    it('detects swipe up', () => {
      manager = new TouchGestureManager(element);
      const onSwipeUp = jest.fn();
      manager.on('swipeUp', onSwipeUp);

      const startEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 200 }]
      });
      element.dispatchEvent(startEvent);

      const endEvent = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 100, clientY: 50 }]
      });
      element.dispatchEvent(endEvent);

      expect(onSwipeUp).toHaveBeenCalled();
    });

    it('detects swipe down', () => {
      manager = new TouchGestureManager(element);
      const onSwipeDown = jest.fn();
      manager.on('swipeDown', onSwipeDown);

      const startEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 50 }]
      });
      element.dispatchEvent(startEvent);

      const endEvent = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 100, clientY: 200 }]
      });
      element.dispatchEvent(endEvent);

      expect(onSwipeDown).toHaveBeenCalled();
    });

    it('ignores short swipes', () => {
      manager = new TouchGestureManager(element);
      const onSwipeLeft = jest.fn();
      manager.on('swipeLeft', onSwipeLeft);

      const startEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      element.dispatchEvent(startEvent);

      const endEvent = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 90, clientY: 100 }]
      });
      element.dispatchEvent(endEvent);

      expect(onSwipeLeft).not.toHaveBeenCalled();
    });
  });

  describe('Tap Detection', () => {
    it('detects single tap', () => {
      manager = new TouchGestureManager(element);
      const onTap = jest.fn();
      manager.on('tap', onTap);

      const startEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      element.dispatchEvent(startEvent);

      const endEvent = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 100, clientY: 100 }]
      });
      element.dispatchEvent(endEvent);

      jest.advanceTimersByTime(300);

      expect(onTap).toHaveBeenCalledWith({ x: 100, y: 100 });
    });

    it('detects double tap', () => {
      manager = new TouchGestureManager(element);
      const onDoubleTap = jest.fn();
      const onTap = jest.fn();
      manager.on('doubleTap', onDoubleTap);
      manager.on('tap', onTap);

      // First tap
      const start1 = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      element.dispatchEvent(start1);

      const end1 = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 100, clientY: 100 }]
      });
      element.dispatchEvent(end1);

      // Second tap (within 300ms)
      jest.advanceTimersByTime(100);

      const start2 = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      element.dispatchEvent(start2);

      const end2 = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 100, clientY: 100 }]
      });
      element.dispatchEvent(end2);

      expect(onDoubleTap).toHaveBeenCalled();
      expect(onTap).not.toHaveBeenCalled();
    });
  });

  describe('Long Press', () => {
    it('triggers after delay', () => {
      manager = new TouchGestureManager(element);
      const onLongPress = jest.fn();
      manager.on('longPress', onLongPress);

      const startEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      element.dispatchEvent(startEvent);

      jest.advanceTimersByTime(500);

      expect(onLongPress).toHaveBeenCalled();
    });

    it('does not trigger if touch ends early', () => {
      manager = new TouchGestureManager(element);
      const onLongPress = jest.fn();
      manager.on('longPress', onLongPress);

      const startEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      element.dispatchEvent(startEvent);

      jest.advanceTimersByTime(300);

      const endEvent = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 100, clientY: 100 }]
      });
      element.dispatchEvent(endEvent);

      jest.advanceTimersByTime(200);

      expect(onLongPress).not.toHaveBeenCalled();
    });
  });

  describe('Pinch Gestures', () => {
    it('triggers pinch start', () => {
      manager = new TouchGestureManager(element);
      const onPinchStart = jest.fn();
      manager.on('pinchStart', onPinchStart);

      const startEvent = new TouchEvent('touchstart', {
        touches: [
          { clientX: 100, clientY: 100 },
          { clientX: 200, clientY: 200 }
        ]
      });
      element.dispatchEvent(startEvent);

      expect(onPinchStart).toHaveBeenCalledWith(
        expect.objectContaining({
          center: expect.any(Object),
          distance: expect.any(Number)
        })
      );
    });

    it('triggers pinch move', () => {
      manager = new TouchGestureManager(element);
      const onPinch = jest.fn();
      manager.on('pinch', onPinch);

      const startEvent = new TouchEvent('touchstart', {
        touches: [
          { clientX: 100, clientY: 100 },
          { clientX: 200, clientY: 200 }
        ]
      });
      element.dispatchEvent(startEvent);

      const moveEvent = new TouchEvent('touchmove', {
        touches: [
          { clientX: 80, clientY: 100 },
          { clientX: 220, clientY: 200 }
        ]
      });
      element.dispatchEvent(moveEvent);

      expect(onPinch).toHaveBeenCalledWith(
        expect.objectContaining({
          scale: expect.any(Number),
          center: expect.any(Object)
        })
      );
    });

    it('triggers pinch end', () => {
      manager = new TouchGestureManager(element);
      const onPinchEnd = jest.fn();
      manager.on('pinchEnd', onPinchEnd);

      const startEvent = new TouchEvent('touchstart', {
        touches: [
          { clientX: 100, clientY: 100 },
          { clientX: 200, clientY: 200 }
        ]
      });
      element.dispatchEvent(startEvent);

      const endEvent = new TouchEvent('touchend', {
        touches: []
      });
      element.dispatchEvent(endEvent);

      expect(onPinchEnd).toHaveBeenCalled();
    });

    it('calculates distance correctly', () => {
      manager = new TouchGestureManager(element);

      const touch1 = { clientX: 0, clientY: 0 };
      const touch2 = { clientX: 3, clientY: 4 };

      const distance = manager.getDistance(touch1, touch2);

      expect(distance).toBe(5); // 3-4-5 triangle
    });

    it('calculates center correctly', () => {
      manager = new TouchGestureManager(element);

      const touch1 = { clientX: 100, clientY: 100 };
      const touch2 = { clientX: 200, clientY: 200 };

      const center = manager.getCenter(touch1, touch2);

      expect(center).toEqual({ x: 150, y: 150 });
    });
  });

  describe('API Methods', () => {
    it('registers callback with on()', () => {
      manager = new TouchGestureManager(element);
      const callback = jest.fn();

      manager.on('tap', callback);

      expect(manager.callbacks.onTap).toBe(callback);
    });

    it('removes callback with off()', () => {
      manager = new TouchGestureManager(element);
      const callback = jest.fn();

      manager.on('tap', callback);
      manager.off('tap');

      expect(manager.callbacks.onTap).toBe(null);
    });

    it('chains method calls', () => {
      manager = new TouchGestureManager(element);

      const result = manager.on('tap', jest.fn()).on('swipeLeft', jest.fn());

      expect(result).toBe(manager);
    });
  });

  describe('destroy', () => {
    it('removes event listeners', () => {
      manager = new TouchGestureManager(element);
      const removeEventListenerSpy = jest.spyOn(element, 'removeEventListener');

      manager.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchcancel', expect.any(Function));
    });

    it('clears timers', () => {
      manager = new TouchGestureManager(element);

      const startEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      element.dispatchEvent(startEvent);

      manager.destroy();

      expect(manager.longPressTimer).toBe(null);
      expect(manager.tapTimer).toBe(null);
    });

    it('clears element reference', () => {
      manager = new TouchGestureManager(element);

      manager.destroy();

      expect(manager.element).toBe(null);
    });

    it('clears callbacks', () => {
      manager = new TouchGestureManager(element);
      manager.on('tap', jest.fn());

      manager.destroy();

      expect(manager.callbacks).toEqual({});
    });
  });

  describe('Touch Cancel', () => {
    it('clears state on touch cancel', () => {
      manager = new TouchGestureManager(element);

      const startEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      element.dispatchEvent(startEvent);

      const cancelEvent = new TouchEvent('touchcancel');
      element.dispatchEvent(cancelEvent);

      expect(manager.state.isActive).toBe(false);
    });

    it('triggers pinch end on cancel', () => {
      manager = new TouchGestureManager(element);
      const onPinchEnd = jest.fn();
      manager.on('pinchEnd', onPinchEnd);

      const startEvent = new TouchEvent('touchstart', {
        touches: [
          { clientX: 100, clientY: 100 },
          { clientX: 200, clientY: 200 }
        ]
      });
      element.dispatchEvent(startEvent);

      const cancelEvent = new TouchEvent('touchcancel');
      element.dispatchEvent(cancelEvent);

      expect(onPinchEnd).toHaveBeenCalled();
    });
  });
});

describe('MobileUtils', () => {
  describe('isTouchDevice', () => {
    it('returns true for touch devices', () => {
      global.window.ontouchstart = true;

      const result = MobileUtils.isTouchDevice();

      expect(result).toBe(true);
    });

    it('checks maxTouchPoints', () => {
      global.navigator.maxTouchPoints = 5;

      const result = MobileUtils.isTouchDevice();

      expect(result).toBe(true);
    });

    it('returns false for non-touch devices', () => {
      delete global.window.ontouchstart;
      global.navigator.maxTouchPoints = 0;

      const result = MobileUtils.isTouchDevice();

      expect(result).toBe(false);
    });
  });

  describe('getDeviceType', () => {
    it('returns mobile for small screens', () => {
      global.innerWidth = 500;

      expect(MobileUtils.getDeviceType()).toBe('mobile');
    });

    it('returns tablet for medium screens', () => {
      global.innerWidth = 800;

      expect(MobileUtils.getDeviceType()).toBe('tablet');
    });

    it('returns desktop for large screens', () => {
      global.innerWidth = 1200;

      expect(MobileUtils.getDeviceType()).toBe('desktop');
    });
  });

  describe('isPortrait', () => {
    it('returns true when height > width', () => {
      global.innerHeight = 800;
      global.innerWidth = 400;

      expect(MobileUtils.isPortrait()).toBe(true);
    });

    it('returns false when width > height', () => {
      global.innerHeight = 400;
      global.innerWidth = 800;

      expect(MobileUtils.isPortrait()).toBe(false);
    });
  });

  describe('preventBodyScroll', () => {
    it('prevents scroll when true', () => {
      MobileUtils.preventBodyScroll(true);

      expect(document.body.style.overflow).toBe('hidden');
      expect(document.body.style.touchAction).toBe('none');
    });

    it('allows scroll when false', () => {
      MobileUtils.preventBodyScroll(true);
      MobileUtils.preventBodyScroll(false);

      expect(document.body.style.overflow).toBe('');
      expect(document.body.style.touchAction).toBe('');
    });
  });

  describe('vibrate', () => {
    it('triggers vibration', () => {
      global.navigator.vibrate = jest.fn();

      MobileUtils.vibrate(200);

      expect(navigator.vibrate).toHaveBeenCalledWith(200);
    });

    it('handles missing vibration support', () => {
      global.navigator.vibrate = undefined;

      expect(() => {
        MobileUtils.vibrate(200);
      }).not.toThrow();
    });
  });

  describe('getViewportDimensions', () => {
    it('returns viewport dimensions', () => {
      global.innerWidth = 800;
      global.innerHeight = 600;

      const dimensions = MobileUtils.getViewportDimensions();

      expect(dimensions.width).toBe(800);
      expect(dimensions.height).toBe(600);
    });

    it('includes visualViewport height', () => {
      global.window.visualViewport = { height: 500 };

      const dimensions = MobileUtils.getViewportDimensions();

      expect(dimensions.visualViewportHeight).toBe(500);
    });
  });
});

describe('Edge Cases', () => {
  let element;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('handles null element gracefully', () => {
    expect(() => {
      new TouchGestureManager(null);
    }).not.toThrow();
  });

  it('handles preventDefault option', () => {
    const manager = new TouchGestureManager(element, { preventDefault: false });

    const touchEvent = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 }]
    });

    expect(() => {
      element.dispatchEvent(touchEvent);
    }).not.toThrow();

    manager.destroy();
  });

  it('handles rapid gesture changes', () => {
    jest.useFakeTimers();
    const manager = new TouchGestureManager(element);

    // Start touch
    const start = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 }]
    });
    element.dispatchEvent(start);

    // Move
    const move = new TouchEvent('touchmove', {
      touches: [{ clientX: 150, clientY: 100 }]
    });
    element.dispatchEvent(move);

    // End
    const end = new TouchEvent('touchend', {
      changedTouches: [{ clientX: 200, clientY: 100 }]
    });
    element.dispatchEvent(end);

    expect(manager.state.isActive).toBe(false);

    manager.destroy();
    jest.useRealTimers();
  });
});
