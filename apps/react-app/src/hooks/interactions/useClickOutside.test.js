/**
 * Tests for useClickOutside hook
 */
import { renderHook } from '@testing-library/react';
import { useClickOutside } from './useClickOutside';
import { useRef } from 'react';

describe('useClickOutside', () => {
  let element;
  let outsideElement;

  beforeEach(() => {
    // Create test elements
    element = document.createElement('div');
    element.id = 'inside';
    document.body.appendChild(element);

    outsideElement = document.createElement('div');
    outsideElement.id = 'outside';
    document.body.appendChild(outsideElement);
  });

  afterEach(() => {
    document.body.removeChild(element);
    document.body.removeChild(outsideElement);
  });

  describe('Mouse Events', () => {
    it('calls handler on click outside', () => {
      const handler = jest.fn();

      renderHook(() => {
        const ref = useRef(element);
        useClickOutside(ref, handler);
      });

      outsideElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

      expect(handler).toHaveBeenCalled();
    });

    it('does not call handler on click inside', () => {
      const handler = jest.fn();

      renderHook(() => {
        const ref = useRef(element);
        useClickOutside(ref, handler);
      });

      element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

      expect(handler).not.toHaveBeenCalled();
    });

    it('does not call handler when ref is null', () => {
      const handler = jest.fn();

      renderHook(() => {
        const ref = useRef(null);
        useClickOutside(ref, handler);
      });

      outsideElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

      expect(handler).not.toHaveBeenCalled();
    });

    it('passes event to handler', () => {
      const handler = jest.fn();

      renderHook(() => {
        const ref = useRef(element);
        useClickOutside(ref, handler);
      });

      const event = new MouseEvent('mousedown', { bubbles: true });
      outsideElement.dispatchEvent(event);

      expect(handler).toHaveBeenCalledWith(expect.any(MouseEvent));
    });
  });

  describe('Touch Events', () => {
    it('calls handler on touch outside', () => {
      const handler = jest.fn();

      renderHook(() => {
        const ref = useRef(element);
        useClickOutside(ref, handler);
      });

      outsideElement.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));

      expect(handler).toHaveBeenCalled();
    });

    it('does not call handler on touch inside', () => {
      const handler = jest.fn();

      renderHook(() => {
        const ref = useRef(element);
        useClickOutside(ref, handler);
      });

      element.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));

      expect(handler).not.toHaveBeenCalled();
    });

    it('passes touch event to handler', () => {
      const handler = jest.fn();

      renderHook(() => {
        const ref = useRef(element);
        useClickOutside(ref, handler);
      });

      outsideElement.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));

      expect(handler).toHaveBeenCalledWith(expect.any(TouchEvent));
    });
  });

  describe('Nested Elements', () => {
    it('does not call handler when clicking nested child', () => {
      const handler = jest.fn();
      const child = document.createElement('span');
      element.appendChild(child);

      renderHook(() => {
        const ref = useRef(element);
        useClickOutside(ref, handler);
      });

      child.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

      expect(handler).not.toHaveBeenCalled();
    });

    it('does not call handler when clicking deeply nested child', () => {
      const handler = jest.fn();
      const child = document.createElement('div');
      const grandchild = document.createElement('span');
      const greatGrandchild = document.createElement('button');

      element.appendChild(child);
      child.appendChild(grandchild);
      grandchild.appendChild(greatGrandchild);

      renderHook(() => {
        const ref = useRef(element);
        useClickOutside(ref, handler);
      });

      greatGrandchild.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Event Listener Management', () => {
    it('adds event listeners on mount', () => {
      const handler = jest.fn();
      const addSpy = jest.spyOn(document, 'addEventListener');

      renderHook(() => {
        const ref = useRef(element);
        useClickOutside(ref, handler);
      });

      expect(addSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(addSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
    });

    it('removes event listeners on unmount', () => {
      const handler = jest.fn();
      const removeSpy = jest.spyOn(document, 'removeEventListener');

      const { unmount } = renderHook(() => {
        const ref = useRef(element);
        useClickOutside(ref, handler);
      });

      unmount();

      expect(removeSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(removeSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
    });

    it('updates handler when ref changes', () => {
      const handler = jest.fn();
      const newElement = document.createElement('div');
      document.body.appendChild(newElement);

      const { rerender } = renderHook(
        ({ el }) => {
          const ref = useRef(el);
          useClickOutside(ref, handler);
        },
        { initialProps: { el: element } }
      );

      rerender({ el: newElement });

      // Click old element should trigger handler
      element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      expect(handler).toHaveBeenCalledTimes(1);

      // Click new element should not trigger handler
      handler.mockClear();
      newElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      expect(handler).not.toHaveBeenCalled();

      document.body.removeChild(newElement);
    });

    it('updates when handler changes', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      const { rerender } = renderHook(
        ({ h }) => {
          const ref = useRef(element);
          useClickOutside(ref, h);
        },
        { initialProps: { h: handler1 } }
      );

      outsideElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      expect(handler1).toHaveBeenCalledTimes(1);

      rerender({ h: handler2 });

      outsideElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Common Use Cases', () => {
    it('closes modal on outside click', () => {
      const closeModal = jest.fn();
      const modal = document.createElement('div');
      modal.classList.add('modal');
      document.body.appendChild(modal);

      renderHook(() => {
        const ref = useRef(modal);
        useClickOutside(ref, closeModal);
      });

      document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

      expect(closeModal).toHaveBeenCalled();

      document.body.removeChild(modal);
    });

    it('closes dropdown on outside click', () => {
      const closeDropdown = jest.fn();
      const dropdown = document.createElement('div');
      dropdown.classList.add('dropdown');
      document.body.appendChild(dropdown);

      renderHook(() => {
        const ref = useRef(dropdown);
        useClickOutside(ref, closeDropdown);
      });

      outsideElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

      expect(closeDropdown).toHaveBeenCalled();

      document.body.removeChild(dropdown);
    });

    it('closes menu on outside click', () => {
      const closeMenu = jest.fn();
      const menu = document.createElement('nav');
      menu.classList.add('menu');
      document.body.appendChild(menu);

      renderHook(() => {
        const ref = useRef(menu);
        useClickOutside(ref, closeMenu);
      });

      outsideElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

      expect(closeMenu).toHaveBeenCalled();

      document.body.removeChild(menu);
    });

    it('does not close when clicking menu item', () => {
      const closeMenu = jest.fn();
      const menu = document.createElement('nav');
      const menuItem = document.createElement('button');
      menu.appendChild(menuItem);
      document.body.appendChild(menu);

      renderHook(() => {
        const ref = useRef(menu);
        useClickOutside(ref, closeMenu);
      });

      menuItem.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

      expect(closeMenu).not.toHaveBeenCalled();

      document.body.removeChild(menu);
    });
  });

  describe('Edge Cases', () => {
    it('handles multiple clicks outside', () => {
      const handler = jest.fn();

      renderHook(() => {
        const ref = useRef(element);
        useClickOutside(ref, handler);
      });

      outsideElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      outsideElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      outsideElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

      expect(handler).toHaveBeenCalledTimes(3);
    });

    it('handles both mouse and touch events', () => {
      const handler = jest.fn();

      renderHook(() => {
        const ref = useRef(element);
        useClickOutside(ref, handler);
      });

      outsideElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      outsideElement.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('handles ref.current becoming null', () => {
      const handler = jest.fn();

      const { rerender } = renderHook(
        ({ current }) => {
          const ref = { current };
          useClickOutside(ref, handler);
        },
        { initialProps: { current: element } }
      );

      rerender({ current: null });

      outsideElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

      expect(handler).not.toHaveBeenCalled();
    });

    it('handles element removal from DOM', () => {
      const handler = jest.fn();
      const tempElement = document.createElement('div');
      document.body.appendChild(tempElement);

      renderHook(() => {
        const ref = useRef(tempElement);
        useClickOutside(ref, handler);
      });

      document.body.removeChild(tempElement);

      outsideElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

      expect(handler).toHaveBeenCalled();
    });
  });
});
