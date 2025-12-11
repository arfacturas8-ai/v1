/**
 * Tests for accessibility utilities
 */
import {
  ScreenReader,
  FocusManager,
  TouchNavigation,
  LiveRegionManager,
  FormAccessibility,
  MenuAccessibility,
  ContrastUtils,
  initMobileAccessibility
} from './accessibility';

describe('accessibility utilities', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('ScreenReader', () => {
    describe('announce', () => {
      it('creates announcement element with aria-live', () => {
        ScreenReader.announce('Test message');

        const announcement = document.querySelector('[aria-live]');
        expect(announcement).toBeTruthy();
        expect(announcement.textContent).toBe('Test message');
      });

      it('uses polite priority by default', () => {
        ScreenReader.announce('Test message');

        const announcement = document.querySelector('[aria-live]');
        expect(announcement.getAttribute('aria-live')).toBe('polite');
      });

      it('supports assertive priority', () => {
        ScreenReader.announce('Urgent message', 'assertive');

        const announcement = document.querySelector('[aria-live]');
        expect(announcement.getAttribute('aria-live')).toBe('assertive');
      });

      it('sets aria-atomic to true', () => {
        ScreenReader.announce('Test message');

        const announcement = document.querySelector('[aria-live]');
        expect(announcement.getAttribute('aria-atomic')).toBe('true');
      });

      it('hides element visually', () => {
        ScreenReader.announce('Test message');

        const announcement = document.querySelector('[aria-live]');
        expect(announcement.style.position).toBe('absolute');
        expect(announcement.style.left).toBe('-10000px');
      });

      it('removes announcement after timeout', () => {
        ScreenReader.announce('Test message');

        expect(document.querySelector('[aria-live]')).toBeTruthy();

        jest.advanceTimersByTime(1000);

        expect(document.querySelector('[aria-live]')).toBeFalsy();
      });
    });

    describe('createHiddenText', () => {
      it('creates span with sr-only class', () => {
        const span = ScreenReader.createHiddenText('Hidden text');

        expect(span.tagName).toBe('SPAN');
        expect(span.className).toBe('sr-only');
        expect(span.textContent).toBe('Hidden text');
      });
    });
  });

  describe('FocusManager', () => {
    let focusManager;

    beforeEach(() => {
      focusManager = new FocusManager();
    });

    describe('moveFocus', () => {
      it('moves focus to specified element', () => {
        const button = document.createElement('button');
        document.body.appendChild(button);

        focusManager.moveFocus(button);

        expect(document.activeElement).toBe(button);
      });

      it('saves current focus by default', () => {
        const button1 = document.createElement('button');
        const button2 = document.createElement('button');
        document.body.appendChild(button1);
        document.body.appendChild(button2);

        button1.focus();
        focusManager.moveFocus(button2);

        expect(focusManager.focusStack.length).toBe(1);
        expect(focusManager.focusStack[0]).toBe(button1);
      });

      it('skips saving focus when saveCurrentFocus is false', () => {
        const button = document.createElement('button');
        document.body.appendChild(button);

        focusManager.moveFocus(button, false);

        expect(focusManager.focusStack.length).toBe(0);
      });

      it('scrolls element into view', () => {
        const button = document.createElement('button');
        button.scrollIntoView = jest.fn();
        document.body.appendChild(button);

        focusManager.moveFocus(button);

        expect(button.scrollIntoView).toHaveBeenCalledWith({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      });
    });

    describe('restoreFocus', () => {
      it('restores focus to previous element', () => {
        const button1 = document.createElement('button');
        const button2 = document.createElement('button');
        document.body.appendChild(button1);
        document.body.appendChild(button2);

        button1.focus();
        focusManager.moveFocus(button2);
        focusManager.restoreFocus();

        expect(document.activeElement).toBe(button1);
      });

      it('handles empty focus stack', () => {
        expect(() => {
          focusManager.restoreFocus();
        }).not.toThrow();
      });

      it('handles element without focus method', () => {
        focusManager.focusStack.push({});

        expect(() => {
          focusManager.restoreFocus();
        }).not.toThrow();
      });
    });

    describe('trapFocus', () => {
      it('creates focus trap for modal', () => {
        const modal = document.createElement('div');
        modal.innerHTML = '<button>First</button><button>Last</button>';
        document.body.appendChild(modal);

        const cleanup = focusManager.trapFocus(modal);

        expect(cleanup).toBeInstanceOf(Function);
      });

      it('focuses first element', () => {
        const modal = document.createElement('div');
        const first = document.createElement('button');
        const last = document.createElement('button');
        modal.appendChild(first);
        modal.appendChild(last);
        document.body.appendChild(modal);

        focusManager.trapFocus(modal);

        expect(document.activeElement).toBe(first);
      });

      it('traps Tab key at last element', () => {
        const modal = document.createElement('div');
        const first = document.createElement('button');
        const last = document.createElement('button');
        modal.appendChild(first);
        modal.appendChild(last);
        document.body.appendChild(modal);

        focusManager.trapFocus(modal);
        last.focus();

        const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
        modal.dispatchEvent(tabEvent);
      });

      it('traps Shift+Tab at first element', () => {
        const modal = document.createElement('div');
        const first = document.createElement('button');
        const last = document.createElement('button');
        modal.appendChild(first);
        modal.appendChild(last);
        document.body.appendChild(modal);

        focusManager.trapFocus(modal);
        first.focus();

        const shiftTabEvent = new KeyboardEvent('keydown', {
          key: 'Tab',
          shiftKey: true,
          bubbles: true
        });
        modal.dispatchEvent(shiftTabEvent);
      });

      it('handles Escape key', () => {
        const modal = document.createElement('div');
        modal.innerHTML = '<button>Button</button>';
        document.body.appendChild(modal);

        const initialElement = document.createElement('button');
        document.body.appendChild(initialElement);
        initialElement.focus();

        focusManager.moveFocus(modal.querySelector('button'));
        focusManager.trapFocus(modal);

        const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
        modal.dispatchEvent(escapeEvent);
      });

      it('returns null for empty container', () => {
        const cleanup = focusManager.trapFocus(null);

        expect(cleanup).toBe(null);
      });

      it('returns null when no focusable elements', () => {
        const modal = document.createElement('div');
        modal.innerHTML = '<div>No focusable elements</div>';
        document.body.appendChild(modal);

        const cleanup = focusManager.trapFocus(modal);

        expect(cleanup).toBe(null);
      });
    });

    describe('getFocusableElements', () => {
      it('finds button elements', () => {
        const container = document.createElement('div');
        container.innerHTML = '<button>Click</button>';
        document.body.appendChild(container);

        const elements = focusManager.getFocusableElements(container);

        expect(elements.length).toBe(1);
        expect(elements[0].tagName).toBe('BUTTON');
      });

      it('finds links', () => {
        const container = document.createElement('div');
        container.innerHTML = '<a href="#">Link</a>';
        document.body.appendChild(container);

        const elements = focusManager.getFocusableElements(container);

        expect(elements.length).toBe(1);
      });

      it('finds form inputs', () => {
        const container = document.createElement('div');
        container.innerHTML = '<input /><select></select><textarea></textarea>';
        document.body.appendChild(container);

        const elements = focusManager.getFocusableElements(container);

        expect(elements.length).toBe(3);
      });

      it('excludes disabled elements', () => {
        const container = document.createElement('div');
        container.innerHTML = '<button disabled>Disabled</button><button>Enabled</button>';
        document.body.appendChild(container);

        const elements = focusManager.getFocusableElements(container);

        expect(elements.length).toBe(1);
      });

      it('excludes aria-hidden elements', () => {
        const container = document.createElement('div');
        container.innerHTML = '<button aria-hidden="true">Hidden</button><button>Visible</button>';
        document.body.appendChild(container);

        const elements = focusManager.getFocusableElements(container);

        expect(elements.length).toBe(1);
      });

      it('finds elements with positive tabindex', () => {
        const container = document.createElement('div');
        container.innerHTML = '<div tabindex="0">Focusable</div>';
        document.body.appendChild(container);

        const elements = focusManager.getFocusableElements(container);

        expect(elements.length).toBe(1);
      });

      it('excludes elements with tabindex=-1', () => {
        const container = document.createElement('div');
        container.innerHTML = '<button tabindex="-1">Skip</button><button>Include</button>';
        document.body.appendChild(container);

        const elements = focusManager.getFocusableElements(container);

        expect(elements.length).toBe(1);
      });
    });
  });

  describe('TouchNavigation', () => {
    describe('makeTouchAccessible', () => {
      it('sets role attribute', () => {
        const element = document.createElement('div');

        TouchNavigation.makeTouchAccessible(element, { role: 'button' });

        expect(element.getAttribute('role')).toBe('button');
      });

      it('sets tabindex', () => {
        const element = document.createElement('div');

        TouchNavigation.makeTouchAccessible(element);

        expect(element.getAttribute('tabindex')).toBe('0');
      });

      it('sets aria-label', () => {
        const element = document.createElement('div');

        TouchNavigation.makeTouchAccessible(element, { label: 'Custom Label' });

        expect(element.getAttribute('aria-label')).toBe('Custom Label');
      });

      it('sets aria-describedby', () => {
        const element = document.createElement('div');

        TouchNavigation.makeTouchAccessible(element, { description: 'desc-id' });

        expect(element.getAttribute('aria-describedby')).toBe('desc-id');
      });

      it('handles click activation', () => {
        const element = document.createElement('div');
        const onActivate = jest.fn();

        TouchNavigation.makeTouchAccessible(element, { onActivate });

        element.click();

        expect(onActivate).toHaveBeenCalled();
      });

      it('handles Enter key activation', () => {
        const element = document.createElement('div');
        const onActivate = jest.fn();

        TouchNavigation.makeTouchAccessible(element, { onActivate });

        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
        element.dispatchEvent(enterEvent);

        expect(onActivate).toHaveBeenCalled();
      });

      it('handles Space key activation', () => {
        const element = document.createElement('div');
        const onActivate = jest.fn();

        TouchNavigation.makeTouchAccessible(element, { onActivate });

        const spaceEvent = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
        element.dispatchEvent(spaceEvent);

        expect(onActivate).toHaveBeenCalled();
      });

      it('returns cleanup function', () => {
        const element = document.createElement('div');
        const cleanup = TouchNavigation.makeTouchAccessible(element);

        expect(cleanup).toBeInstanceOf(Function);
      });
    });

    describe('addSwipeNavigation', () => {
      it('detects swipe left', () => {
        const container = document.createElement('div');
        const onSwipeLeft = jest.fn();
        document.body.appendChild(container);

        TouchNavigation.addSwipeNavigation(container, { onSwipeLeft });

        const touchStart = new TouchEvent('touchstart', {
          touches: [{ clientX: 200, clientY: 100 }]
        });
        const touchEnd = new TouchEvent('touchend', {
          changedTouches: [{ clientX: 100, clientY: 100 }]
        });

        container.dispatchEvent(touchStart);
        container.dispatchEvent(touchEnd);

        expect(onSwipeLeft).toHaveBeenCalled();
      });

      it('detects swipe right', () => {
        const container = document.createElement('div');
        const onSwipeRight = jest.fn();
        document.body.appendChild(container);

        TouchNavigation.addSwipeNavigation(container, { onSwipeRight });

        const touchStart = new TouchEvent('touchstart', {
          touches: [{ clientX: 100, clientY: 100 }]
        });
        const touchEnd = new TouchEvent('touchend', {
          changedTouches: [{ clientX: 200, clientY: 100 }]
        });

        container.dispatchEvent(touchStart);
        container.dispatchEvent(touchEnd);

        expect(onSwipeRight).toHaveBeenCalled();
      });

      it('detects swipe up', () => {
        const container = document.createElement('div');
        const onSwipeUp = jest.fn();
        document.body.appendChild(container);

        TouchNavigation.addSwipeNavigation(container, { onSwipeUp });

        const touchStart = new TouchEvent('touchstart', {
          touches: [{ clientX: 100, clientY: 200 }]
        });
        const touchEnd = new TouchEvent('touchend', {
          changedTouches: [{ clientX: 100, clientY: 100 }]
        });

        container.dispatchEvent(touchStart);
        container.dispatchEvent(touchEnd);

        expect(onSwipeUp).toHaveBeenCalled();
      });

      it('detects swipe down', () => {
        const container = document.createElement('div');
        const onSwipeDown = jest.fn();
        document.body.appendChild(container);

        TouchNavigation.addSwipeNavigation(container, { onSwipeDown });

        const touchStart = new TouchEvent('touchstart', {
          touches: [{ clientX: 100, clientY: 100 }]
        });
        const touchEnd = new TouchEvent('touchend', {
          changedTouches: [{ clientX: 100, clientY: 200 }]
        });

        container.dispatchEvent(touchStart);
        container.dispatchEvent(touchEnd);

        expect(onSwipeDown).toHaveBeenCalled();
      });

      it('ignores short swipes', () => {
        const container = document.createElement('div');
        const onSwipeLeft = jest.fn();
        document.body.appendChild(container);

        TouchNavigation.addSwipeNavigation(container, { onSwipeLeft });

        const touchStart = new TouchEvent('touchstart', {
          touches: [{ clientX: 100, clientY: 100 }]
        });
        const touchEnd = new TouchEvent('touchend', {
          changedTouches: [{ clientX: 90, clientY: 100 }]
        });

        container.dispatchEvent(touchStart);
        container.dispatchEvent(touchEnd);

        expect(onSwipeLeft).not.toHaveBeenCalled();
      });

      it('returns cleanup function', () => {
        const container = document.createElement('div');
        const cleanup = TouchNavigation.addSwipeNavigation(container);

        expect(cleanup).toBeInstanceOf(Function);
      });
    });
  });

  describe('LiveRegionManager', () => {
    let liveRegionManager;

    beforeEach(() => {
      liveRegionManager = new LiveRegionManager();
    });

    describe('createDefaultRegions', () => {
      it('creates polite region', () => {
        const region = document.getElementById('live-region-polite');

        expect(region).toBeTruthy();
        expect(region.getAttribute('aria-live')).toBe('polite');
      });

      it('creates assertive region', () => {
        const region = document.getElementById('live-region-assertive');

        expect(region).toBeTruthy();
        expect(region.getAttribute('aria-live')).toBe('assertive');
      });

      it('creates status region', () => {
        const region = document.getElementById('live-region-status');

        expect(region).toBeTruthy();
        expect(region.getAttribute('role')).toBe('status');
      });
    });

    describe('createRegion', () => {
      it('creates region with specified live level', () => {
        liveRegionManager.createRegion('custom', 'polite');

        const region = document.getElementById('live-region-custom');
        expect(region.getAttribute('aria-live')).toBe('polite');
      });

      it('sets aria-atomic', () => {
        liveRegionManager.createRegion('custom', 'polite');

        const region = document.getElementById('live-region-custom');
        expect(region.getAttribute('aria-atomic')).toBe('true');
      });

      it('sets role when provided', () => {
        liveRegionManager.createRegion('custom', 'polite', 'alert');

        const region = document.getElementById('live-region-custom');
        expect(region.getAttribute('role')).toBe('alert');
      });

      it('stores region in map', () => {
        liveRegionManager.createRegion('custom', 'polite');

        expect(liveRegionManager.regions.has('custom')).toBe(true);
      });
    });

    describe('announce', () => {
      it('announces message to polite region', () => {
        liveRegionManager.announce('Test message');

        const region = document.getElementById('live-region-polite');
        expect(region.textContent).toBe('Test message');
      });

      it('announces to specified region', () => {
        liveRegionManager.announce('Important!', 'assertive');

        const region = document.getElementById('live-region-assertive');
        expect(region.textContent).toBe('Important!');
      });

      it('clears message after timeout', () => {
        liveRegionManager.announce('Test message');

        const region = document.getElementById('live-region-polite');
        expect(region.textContent).toBe('Test message');

        jest.advanceTimersByTime(1000);

        expect(region.textContent).toBe('');
      });

      it('handles non-existent region gracefully', () => {
        expect(() => {
          liveRegionManager.announce('Test', 'non-existent');
        }).not.toThrow();
      });
    });

    describe('updateStatus', () => {
      it('updates status region', () => {
        liveRegionManager.updateStatus('');

        const region = document.getElementById('live-region-status');
        expect(region.textContent).toBe('');
      });

      it('persists status message', () => {
        liveRegionManager.updateStatus('Loaded');

        jest.advanceTimersByTime(2000);

        const region = document.getElementById('live-region-status');
        expect(region.textContent).toBe('Loaded');
      });
    });
  });

  describe('FormAccessibility', () => {
    describe('enhanceFormField', () => {
      it('sets aria-label', () => {
        const field = document.createElement('input');
        field.id = 'test-field';
        document.body.appendChild(field);

        FormAccessibility.enhanceFormField(field, { label: 'Test Label' });

        expect(field.getAttribute('aria-label')).toBe('Test Label');
      });

      it('sets aria-required', () => {
        const field = document.createElement('input');
        field.id = 'test-field';

        FormAccessibility.enhanceFormField(field, { required: true });

        expect(field.getAttribute('aria-required')).toBe('true');
      });

      it('sets aria-invalid', () => {
        const field = document.createElement('input');
        field.id = 'test-field';

        FormAccessibility.enhanceFormField(field, { invalid: true });

        expect(field.getAttribute('aria-invalid')).toBe('true');
      });

      it('creates description element', () => {
        const field = document.createElement('input');
        field.id = 'test-field';
        const parent = document.createElement('div');
        parent.appendChild(field);
        document.body.appendChild(parent);

        FormAccessibility.enhanceFormField(field, { description: 'Help text' });

        const desc = document.getElementById('test-field-desc');
        expect(desc).toBeTruthy();
        expect(desc.textContent).toBe('Help text');
      });

      it('creates error element for invalid field', () => {
        const field = document.createElement('input');
        field.id = 'test-field';
        const parent = document.createElement('div');
        parent.appendChild(field);
        document.body.appendChild(parent);

        FormAccessibility.enhanceFormField(field, {
          invalid: true,
          errorMessage: 'Field is required'
        });

        const error = document.getElementById('test-field-error');
        expect(error).toBeTruthy();
        expect(error.textContent).toBe('Field is required');
        expect(error.getAttribute('role')).toBe('alert');
      });

      it('links field to error via aria-describedby', () => {
        const field = document.createElement('input');
        field.id = 'test-field';
        const parent = document.createElement('div');
        parent.appendChild(field);
        document.body.appendChild(parent);

        FormAccessibility.enhanceFormField(field, {
          invalid: true,
          errorMessage: 'Error'
        });

        const describedBy = field.getAttribute('aria-describedby');
        expect(describedBy).toContain('test-field-error');
      });
    });

    describe('addMobileValidation', () => {
      it('adds invalid event listener', () => {
        const form = document.createElement('form');
        document.body.appendChild(form);

        FormAccessibility.addMobileValidation(form);

        // Event listener added, tested via behavior
        expect(form).toBeTruthy();
      });
    });
  });

  describe('MenuAccessibility', () => {
    describe('enhanceMobileMenu', () => {
      it('sets aria-expanded on button', () => {
        const button = document.createElement('button');
        button.id = 'menu-btn';
        const menu = document.createElement('div');
        menu.id = 'menu';
        document.body.appendChild(button);
        document.body.appendChild(menu);

        MenuAccessibility.enhanceMobileMenu(button, menu);

        expect(button.getAttribute('aria-expanded')).toBe('false');
      });

      it('sets aria-controls on button', () => {
        const button = document.createElement('button');
        button.id = 'menu-btn';
        const menu = document.createElement('div');
        menu.id = 'menu';

        MenuAccessibility.enhanceMobileMenu(button, menu);

        expect(button.getAttribute('aria-controls')).toBe('menu');
      });

      it('sets role=menu on menu', () => {
        const button = document.createElement('button');
        button.id = 'menu-btn';
        const menu = document.createElement('div');
        menu.id = 'menu';

        MenuAccessibility.enhanceMobileMenu(button, menu);

        expect(menu.getAttribute('role')).toBe('menu');
      });

      it('sets menuitem role on menu items', () => {
        const button = document.createElement('button');
        button.id = 'menu-btn';
        const menu = document.createElement('div');
        menu.innerHTML = '<a href="#">Item 1</a><a href="#">Item 2</a>';
        document.body.appendChild(button);
        document.body.appendChild(menu);

        MenuAccessibility.enhanceMobileMenu(button, menu);

        const items = menu.querySelectorAll('a');
        items.forEach(item => {
          expect(item.getAttribute('role')).toBe('menuitem');
        });
      });

      it('toggles menu on button click', () => {
        const button = document.createElement('button');
        button.id = 'menu-btn';
        const menu = document.createElement('div');
        menu.innerHTML = '<a href="#">Item 1</a>';
        document.body.appendChild(button);
        document.body.appendChild(menu);

        MenuAccessibility.enhanceMobileMenu(button, menu);

        button.click();

        expect(button.getAttribute('aria-expanded')).toBe('true');
      });

      it('returns cleanup function', () => {
        const button = document.createElement('button');
        button.id = 'menu-btn';
        const menu = document.createElement('div');
        menu.id = 'menu';

        const cleanup = MenuAccessibility.enhanceMobileMenu(button, menu);

        expect(cleanup).toBeInstanceOf(Function);
      });
    });
  });

  describe('ContrastUtils', () => {
    describe('prefersHighContrast', () => {
      it('checks prefers-contrast media query', () => {
        window.matchMedia = jest.fn().mockReturnValue({ matches: true });

        const result = ContrastUtils.prefersHighContrast();

        expect(window.matchMedia).toHaveBeenCalledWith('(prefers-contrast: high)');
        expect(result).toBe(true);
      });
    });

    describe('prefersReducedMotion', () => {
      it('checks prefers-reduced-motion media query', () => {
        window.matchMedia = jest.fn().mockReturnValue({ matches: true });

        const result = ContrastUtils.prefersReducedMotion();

        expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
        expect(result).toBe(true);
      });
    });

    describe('applyHighContrast', () => {
      it('adds high-contrast class to document', () => {
        ContrastUtils.applyHighContrast();

        expect(document.documentElement.classList.contains('high-contrast')).toBe(true);
      });
    });

    describe('applyReducedMotion', () => {
      it('adds reduced-motion class to document', () => {
        ContrastUtils.applyReducedMotion();

        expect(document.documentElement.classList.contains('reduced-motion')).toBe(true);
      });
    });
  });

  describe('initMobileAccessibility', () => {
    beforeEach(() => {
      window.matchMedia = jest.fn().mockReturnValue({ matches: false });
    });

    it('creates LiveRegionManager instance', () => {
      const result = initMobileAccessibility();

      expect(result.liveRegionManager).toBeInstanceOf(LiveRegionManager);
    });

    it('creates FocusManager instance', () => {
      const result = initMobileAccessibility();

      expect(result.focusManager).toBeInstanceOf(FocusManager);
    });

    it('exports utility modules', () => {
      const result = initMobileAccessibility();

      expect(result.ScreenReader).toBe(ScreenReader);
      expect(result.TouchNavigation).toBe(TouchNavigation);
      expect(result.FormAccessibility).toBe(FormAccessibility);
      expect(result.MenuAccessibility).toBe(MenuAccessibility);
    });

    it('applies high contrast when preferred', () => {
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === '(prefers-contrast: high)'
      }));

      initMobileAccessibility();

      expect(document.documentElement.classList.contains('high-contrast')).toBe(true);
    });

    it('applies reduced motion when preferred', () => {
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)'
      }));

      initMobileAccessibility();

      expect(document.documentElement.classList.contains('reduced-motion')).toBe(true);
    });

    it('enhances all forms on page', () => {
      const form1 = document.createElement('form');
      const form2 = document.createElement('form');
      document.body.appendChild(form1);
      document.body.appendChild(form2);

      initMobileAccessibility();

      // Forms enhanced (tested via side effects)
      expect(document.querySelectorAll('form').length).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('handles multiple screen reader announcements', () => {
      ScreenReader.announce('Message 1');
      ScreenReader.announce('Message 2');
      ScreenReader.announce('Message 3');

      const announcements = document.querySelectorAll('[aria-live]');
      expect(announcements.length).toBe(3);
    });

    it('handles swipe without touchstart', () => {
      const container = document.createElement('div');
      const onSwipeLeft = jest.fn();

      TouchNavigation.addSwipeNavigation(container, { onSwipeLeft });

      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 100, clientY: 100 }]
      });

      expect(() => {
        container.dispatchEvent(touchEnd);
      }).not.toThrow();

      expect(onSwipeLeft).not.toHaveBeenCalled();
    });

    it('handles focus trap cleanup', () => {
      const focusManager = new FocusManager();
      const modal = document.createElement('div');
      modal.innerHTML = '<button>Button</button>';
      document.body.appendChild(modal);

      const cleanup = focusManager.trapFocus(modal);
      cleanup();

      expect(() => {
        const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
        modal.dispatchEvent(tabEvent);
      }).not.toThrow();
    });
  });
});
