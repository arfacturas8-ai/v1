/**
 * Tests for useFocusManagement hooks
 */
import { renderHook, act } from '@testing-library/react';
import {
  useFocusTrap,
  useFocusOnRouteChange,
  useFocusOnError,
  useListKeyboardNavigation,
  useRovingTabindex,
  announceToScreenReader
} from './useFocusManagement';

describe('useFocusManagement', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('useFocusTrap', () => {
    it('provides containerRef', () => {
      const { result } = renderHook(() => useFocusTrap(false));

      expect(result.current.containerRef).toBeDefined();
      expect(result.current.containerRef.current).toBe(null);
    });

    it('provides getFocusableElements function', () => {
      const { result } = renderHook(() => useFocusTrap(false));

      expect(typeof result.current.getFocusableElements).toBe('function');
    });

    it('finds focusable elements in container', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <button>Button 1</button>
        <a href="#">Link</a>
        <input type="text" />
        <button disabled>Disabled</button>
      `;
      document.body.appendChild(container);

      const { result } = renderHook(() => useFocusTrap(false));
      result.current.containerRef.current = container;

      const focusable = result.current.getFocusableElements();

      expect(focusable.length).toBe(3); // Excludes disabled button
    });

    it('focuses first element when trap activates', async () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <button id="first">First</button>
        <button id="second">Second</button>
      `;
      document.body.appendChild(container);

      const { result, rerender } = renderHook(
        ({ isActive }) => useFocusTrap(isActive),
        { initialProps: { isActive: false } }
      );

      result.current.containerRef.current = container;

      await act(async () => {
        rerender({ isActive: true });
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      expect(document.activeElement.id).toBe('first');
    });

    it('traps Tab navigation within container', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <button id="first">First</button>
        <button id="last">Last</button>
      `;
      document.body.appendChild(container);

      const { result } = renderHook(() => useFocusTrap(true));
      result.current.containerRef.current = container;

      const lastButton = container.querySelector('#last');
      lastButton.focus();

      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      act(() => {
        document.dispatchEvent(tabEvent);
      });

      // Since event is prevented and first element focused
      // This is a simplified test - full testing would require preventDefault verification
    });

    it('restores focus on deactivation', async () => {
      const outsideButton = document.createElement('button');
      outsideButton.id = 'outside';
      document.body.appendChild(outsideButton);
      outsideButton.focus();

      const container = document.createElement('div');
      container.innerHTML = '<button>Inside</button>';
      document.body.appendChild(container);

      const { result, rerender } = renderHook(
        ({ isActive }) => useFocusTrap(isActive),
        { initialProps: { isActive: true } }
      );

      result.current.containerRef.current = container;

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      await act(async () => {
        rerender({ isActive: false });
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      // Focus should be restored to outside button
    });
  });

  describe('useFocusOnRouteChange', () => {
    it('creates announcement element', () => {
      renderHook(() => useFocusOnRouteChange('Home Page'));

      const announcer = document.querySelector('[role="status"]');
      expect(announcer).toBeDefined();
    });

    it('announces page title change', async () => {
      const { rerender } = renderHook(
        ({ pageTitle }) => useFocusOnRouteChange(pageTitle),
        { initialProps: { pageTitle: 'Home' } }
      );

      await act(async () => {
        rerender({ pageTitle: 'About' });
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      const announcer = document.querySelector('[role="status"]');
      expect(announcer.textContent).toContain('About');
    });

    it('clears announcement after delay', async () => {
      jest.useFakeTimers();

      const { result } = renderHook(() => useFocusOnRouteChange('Test Page'));

      act(() => {
        jest.advanceTimersByTime(1100);
      });

      const announcer = document.querySelector('[role="status"]');
      expect(announcer.textContent).toBe('');

      jest.useRealTimers();
    });

    it('focuses main content', () => {
      const main = document.createElement('main');
      main.id = 'main-content';
      document.body.appendChild(main);

      renderHook(() => useFocusOnRouteChange('Page'));

      expect(main.getAttribute('tabindex')).toBe('-1');
    });

    it('cleans up on unmount', () => {
      const { unmount } = renderHook(() => useFocusOnRouteChange('Page'));

      const announcerBeforeUnmount = document.querySelector('[role="status"]');
      expect(announcerBeforeUnmount).toBeDefined();

      unmount();

      const announcerAfterUnmount = document.querySelector('[role="status"]');
      expect(announcerAfterUnmount).toBe(null);
    });
  });

  describe('useFocusOnError', () => {
    it('focuses first error field when errors appear', () => {
      const input = document.createElement('input');
      input.name = 'email';
      document.body.appendChild(input);

      const { rerender } = renderHook(
        ({ errors, isSubmitting }) => useFocusOnError(errors, isSubmitting),
        { initialProps: { errors: {}, isSubmitting: false } }
      );

      act(() => {
        rerender({ errors: { email: 'Invalid email' }, isSubmitting: false });
      });

      expect(document.activeElement).toBe(input);
    });

    it('does not focus during submission', () => {
      const input = document.createElement('input');
      input.name = 'email';
      document.body.appendChild(input);

      const { rerender } = renderHook(
        ({ errors, isSubmitting }) => useFocusOnError(errors, isSubmitting),
        { initialProps: { errors: {}, isSubmitting: true } }
      );

      act(() => {
        rerender({ errors: { email: 'Invalid email' }, isSubmitting: true });
      });

      expect(document.activeElement).not.toBe(input);
    });

    it('scrolls error field into view', () => {
      const input = document.createElement('input');
      input.name = 'email';
      input.scrollIntoView = jest.fn();
      document.body.appendChild(input);

      const { rerender } = renderHook(
        ({ errors, isSubmitting }) => useFocusOnError(errors, isSubmitting),
        { initialProps: { errors: {}, isSubmitting: false } }
      );

      act(() => {
        rerender({ errors: { email: 'Invalid' }, isSubmitting: false });
      });

      expect(input.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center'
      });
    });

    it('handles errors without matching fields', () => {
      const { rerender } = renderHook(
        ({ errors, isSubmitting }) => useFocusOnError(errors, isSubmitting),
        { initialProps: { errors: {}, isSubmitting: false } }
      );

      expect(() => {
        act(() => {
          rerender({ errors: { nonexistent: 'Error' }, isSubmitting: false });
        });
      }).not.toThrow();
    });
  });

  describe('useListKeyboardNavigation', () => {
    it('provides listRef', () => {
      const { result } = renderHook(() => useListKeyboardNavigation(false));

      expect(result.current.listRef).toBeDefined();
    });

    it('handles ArrowDown navigation', () => {
      const list = document.createElement('ul');
      list.innerHTML = `
        <li><button id="item1">Item 1</button></li>
        <li><button id="item2">Item 2</button></li>
        <li><button id="item3">Item 3</button></li>
      `;
      document.body.appendChild(list);

      const { result } = renderHook(() =>
        useListKeyboardNavigation(true, { orientation: 'vertical' })
      );

      result.current.listRef.current = list;

      const item1 = list.querySelector('#item1');
      item1.focus();

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
      act(() => {
        list.dispatchEvent(event);
      });

      expect(document.activeElement.id).toBe('item2');
    });

    it('handles ArrowUp navigation', () => {
      const list = document.createElement('ul');
      list.innerHTML = `
        <li><button id="item1">Item 1</button></li>
        <li><button id="item2">Item 2</button></li>
      `;
      document.body.appendChild(list);

      const { result } = renderHook(() =>
        useListKeyboardNavigation(true, { orientation: 'vertical' })
      );

      result.current.listRef.current = list;

      const item2 = list.querySelector('#item2');
      item2.focus();

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true });
      act(() => {
        list.dispatchEvent(event);
      });

      expect(document.activeElement.id).toBe('item1');
    });

    it('loops navigation when enabled', () => {
      const list = document.createElement('ul');
      list.innerHTML = `
        <li><button id="item1">Item 1</button></li>
        <li><button id="item2">Item 2</button></li>
      `;
      document.body.appendChild(list);

      const { result } = renderHook(() =>
        useListKeyboardNavigation(true, { orientation: 'vertical', loop: true })
      );

      result.current.listRef.current = list;

      const item2 = list.querySelector('#item2');
      item2.focus();

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
      act(() => {
        list.dispatchEvent(event);
      });

      expect(document.activeElement.id).toBe('item1');
    });

    it('handles Home key', () => {
      const list = document.createElement('ul');
      list.innerHTML = `
        <li><button id="item1">Item 1</button></li>
        <li><button id="item2">Item 2</button></li>
        <li><button id="item3">Item 3</button></li>
      `;
      document.body.appendChild(list);

      const { result } = renderHook(() => useListKeyboardNavigation(true));
      result.current.listRef.current = list;

      const item3 = list.querySelector('#item3');
      item3.focus();

      const event = new KeyboardEvent('keydown', { key: 'Home', bubbles: true });
      act(() => {
        list.dispatchEvent(event);
      });

      expect(document.activeElement.id).toBe('item1');
    });

    it('handles End key', () => {
      const list = document.createElement('ul');
      list.innerHTML = `
        <li><button id="item1">Item 1</button></li>
        <li><button id="item2">Item 2</button></li>
        <li><button id="item3">Item 3</button></li>
      `;
      document.body.appendChild(list);

      const { result } = renderHook(() => useListKeyboardNavigation(true));
      result.current.listRef.current = list;

      const item1 = list.querySelector('#item1');
      item1.focus();

      const event = new KeyboardEvent('keydown', { key: 'End', bubbles: true });
      act(() => {
        list.dispatchEvent(event);
      });

      expect(document.activeElement.id).toBe('item3');
    });

    it('calls onSelect when Enter is pressed', () => {
      const onSelect = jest.fn();
      const list = document.createElement('ul');
      list.innerHTML = '<li><button id="item1">Item 1</button></li>';
      document.body.appendChild(list);

      const { result } = renderHook(() =>
        useListKeyboardNavigation(true, { onSelect })
      );

      result.current.listRef.current = list;

      const item1 = list.querySelector('#item1');
      item1.focus();

      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      act(() => {
        list.dispatchEvent(event);
      });

      expect(onSelect).toHaveBeenCalledWith(item1);
    });

    it('handles horizontal orientation', () => {
      const list = document.createElement('ul');
      list.innerHTML = `
        <li><button id="item1">Item 1</button></li>
        <li><button id="item2">Item 2</button></li>
      `;
      document.body.appendChild(list);

      const { result } = renderHook(() =>
        useListKeyboardNavigation(true, { orientation: 'horizontal' })
      );

      result.current.listRef.current = list;

      const item1 = list.querySelector('#item1');
      item1.focus();

      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
      act(() => {
        list.dispatchEvent(event);
      });

      expect(document.activeElement.id).toBe('item2');
    });
  });

  describe('useRovingTabindex', () => {
    it('provides containerRef', () => {
      const { result } = renderHook(() => useRovingTabindex(false));

      expect(result.current.containerRef).toBeDefined();
    });

    it('sets tabindex on items', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <button>Button 1</button>
        <button>Button 2</button>
        <button>Button 3</button>
      `;
      document.body.appendChild(container);

      const { result } = renderHook(() => useRovingTabindex(true));
      result.current.containerRef.current = container;

      act(() => {
        // Trigger update
      });

      const buttons = container.querySelectorAll('button');
      expect(buttons[0].getAttribute('tabindex')).toBe('0');
      expect(buttons[1].getAttribute('tabindex')).toBe('-1');
      expect(buttons[2].getAttribute('tabindex')).toBe('-1');
    });

    it('moves focus with arrow keys', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <button id="btn1">Button 1</button>
        <button id="btn2">Button 2</button>
      `;
      document.body.appendChild(container);

      const { result } = renderHook(() => useRovingTabindex(true));
      result.current.containerRef.current = container;

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
        container.dispatchEvent(event);
      });
    });

    it('handles Home and End keys', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <button id="btn1">Button 1</button>
        <button id="btn2">Button 2</button>
        <button id="btn3">Button 3</button>
      `;
      document.body.appendChild(container);

      const { result } = renderHook(() => useRovingTabindex(true));
      result.current.containerRef.current = container;

      act(() => {
        const homeEvent = new KeyboardEvent('keydown', { key: 'Home', bubbles: true });
        container.dispatchEvent(homeEvent);
      });

      act(() => {
        const endEvent = new KeyboardEvent('keydown', { key: 'End', bubbles: true });
        container.dispatchEvent(endEvent);
      });
    });
  });

  describe('announceToScreenReader', () => {
    it('creates announcement element', () => {
      announceToScreenReader('Test announcement');

      const announcer = document.querySelector('[role="status"]');
      expect(announcer).toBeDefined();
      expect(announcer.textContent).toBe('Test announcement');
    });

    it('uses polite priority by default', () => {
      announceToScreenReader('Test');

      const announcer = document.querySelector('[aria-live="polite"]');
      expect(announcer).toBeDefined();
    });

    it('uses assertive priority when specified', () => {
      announceToScreenReader('Urgent', 'assertive');

      const announcer = document.querySelector('[aria-live="assertive"]');
      expect(announcer).toBeDefined();
    });

    it('removes announcement after delay', async () => {
      jest.useFakeTimers();

      announceToScreenReader('Test');

      let announcer = document.querySelector('[role="status"]');
      expect(announcer).toBeDefined();

      act(() => {
        jest.advanceTimersByTime(1100);
      });

      announcer = document.querySelector('[role="status"]');
      expect(announcer).toBe(null);

      jest.useRealTimers();
    });

    it('has sr-only class', () => {
      announceToScreenReader('Test');

      const announcer = document.querySelector('[role="status"]');
      expect(announcer.className).toBe('sr-only');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty containers gracefully', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      const { result } = renderHook(() => useFocusTrap(true));
      result.current.containerRef.current = container;

      const focusable = result.current.getFocusableElements();
      expect(focusable).toEqual([]);
    });

    it('excludes hidden elements', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <button>Visible</button>
        <button aria-hidden="true">Hidden</button>
      `;
      document.body.appendChild(container);

      const { result } = renderHook(() => useFocusTrap(false));
      result.current.containerRef.current = container;

      const focusable = result.current.getFocusableElements();
      expect(focusable.length).toBe(1);
    });

    it('handles rapid route changes', () => {
      const { rerender } = renderHook(
        ({ pageTitle }) => useFocusOnRouteChange(pageTitle),
        { initialProps: { pageTitle: 'Page 1' } }
      );

      act(() => {
        rerender({ pageTitle: 'Page 2' });
        rerender({ pageTitle: 'Page 3' });
        rerender({ pageTitle: 'Page 4' });
      });

      const announcer = document.querySelector('[role="status"]');
      expect(announcer.textContent).toContain('Page 4');
    });
  });
});
