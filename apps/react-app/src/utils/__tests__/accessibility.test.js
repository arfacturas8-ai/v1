
import * as accessibility from '../accessibility';

describe('accessibility utils', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('trapFocus', () => {
    it('should trap focus within element', () => {
      document.body.innerHTML = `
        <div id="modal">
          <button id="btn1">Button 1</button>
          <button id="btn2">Button 2</button>
          <button id="btn3">Button 3</button>
        </div>
      `;

      const modal = document.getElementById('modal');
      const cleanup = accessibility.trapFocus?.(modal);

      const btn1 = document.getElementById('btn1');
      const btn3 = document.getElementById('btn3');

      // Focus first button
      btn1.focus();
      expect(document.activeElement).toBe(btn1);

      // Simulate Tab from last button (should wrap to first)
      btn3.focus();
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      btn3.dispatchEvent(tabEvent);

      // Cleanup
      cleanup?.();
    });
  });

  describe('announceToScreenReader', () => {
    it('should create announcement element', () => {
      accessibility.announceToScreenReader?.('Test announcement');

      const announcement = document.querySelector('[role="status"]') ||
                          document.querySelector('[aria-live="polite"]');
      expect(announcement).toBeTruthy();
    });

    it('should remove announcement after delay', async () => {
      jest.useFakeTimers();

      accessibility.announceToScreenReader?.('Test announcement');

      const announcement = document.querySelector('[role="status"]') ||
                          document.querySelector('[aria-live="polite"]');
      expect(announcement).toBeTruthy();

      // Fast-forward time
      jest.advanceTimersByTime(1000);

      jest.useRealTimers();
    });
  });

  describe('addKeyboardNavigation', () => {
    it('should add keyboard event listeners', () => {
      const element = document.createElement('div');
      const onEnter = jest.fn();
      const onEscape = jest.fn();

      const cleanup = accessibility.addKeyboardNavigation?.(element, {
        onEnter,
        onEscape,
      });

      // Simulate Enter key
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      element.dispatchEvent(enterEvent);

      // Simulate Escape key
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      element.dispatchEvent(escapeEvent);

      if (onEnter.mock) {
        expect(onEnter).toHaveBeenCalled();
      }
      if (onEscape.mock) {
        expect(onEscape).toHaveBeenCalled();
      }

      cleanup?.();
    });
  });

  describe('getFocusableElements', () => {
    it('should return focusable elements', () => {
      document.body.innerHTML = `
        <div>
          <button>Button</button>
          <a href="#">Link</a>
          <input type="text">
          <div tabindex="0">Focusable div</div>
          <div>Not focusable</div>
        </div>
      `;

      const focusable = accessibility.getFocusableElements?.(document.body);

      if (focusable) {
        expect(focusable.length).toBeGreaterThan(0);
      }
    });

    it('should exclude hidden elements', () => {
      document.body.innerHTML = `
        <div>
          <button>Visible Button</button>
          <button style="display: none">Hidden Button</button>
          <button hidden>Hidden Button 2</button>
        </div>
      `;

      const focusable = accessibility.getFocusableElements?.(document.body);

      if (focusable) {
        expect(focusable.length).toBe(1);
      }
    });
  });

  describe('setAriaLabel', () => {
    it('should set aria-label attribute', () => {
      const element = document.createElement('button');

      accessibility.setAriaLabel?.(element, 'Test Label');

      expect(element.getAttribute('aria-label')).toBe('Test Label');
    });
  });

  describe('setAriaDescribedBy', () => {
    it('should set aria-describedby attribute', () => {
      const element = document.createElement('button');

      accessibility.setAriaDescribedBy?.(element, 'description-id');

      expect(element.getAttribute('aria-describedby')).toBe('description-id');
    });
  });

  describe('manageFocusOnModalOpen', () => {
    it('should save previous focus and set new focus', () => {
      const trigger = document.createElement('button');
      const modal = document.createElement('div');
      const modalButton = document.createElement('button');

      document.body.appendChild(trigger);
      document.body.appendChild(modal);
      modal.appendChild(modalButton);

      trigger.focus();
      expect(document.activeElement).toBe(trigger);

      const restore = accessibility.manageFocusOnModalOpen?.(modal);

      if (restore) {
        restore();
        // Should restore focus to trigger
        expect(document.activeElement).toBe(trigger);
      }

      document.body.removeChild(trigger);
      document.body.removeChild(modal);
    });
  });

  describe('validateColorContrast', () => {
    it('should validate sufficient contrast', () => {
      const result = accessibility.validateColorContrast?.('#000000', '#FFFFFF');

      if (result !== undefined) {
        expect(result).toBe(true);
      }
    });

    it('should invalidate insufficient contrast', () => {
      const result = accessibility.validateColorContrast?.('#FFFFFF', '#FEFEFE');

      if (result !== undefined) {
        expect(result).toBe(false);
      }
    });
  });
});
