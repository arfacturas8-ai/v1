/**
 * Tests for interactions hooks index exports
 */
import * as interactions from './index';

describe('interactions/index', () => {
  describe('Hook Exports', () => {
    it('exports useAsync', () => {
      expect(interactions.useAsync).toBeDefined();
      expect(typeof interactions.useAsync).toBe('function');
    });

    it('exports useDebounce', () => {
      expect(interactions.useDebounce).toBeDefined();
      expect(typeof interactions.useDebounce).toBe('function');
    });

    it('exports useIntersectionObserver', () => {
      expect(interactions.useIntersectionObserver).toBeDefined();
      expect(typeof interactions.useIntersectionObserver).toBe('function');
    });

    it('exports useMediaQuery', () => {
      expect(interactions.useMediaQuery).toBeDefined();
      expect(typeof interactions.useMediaQuery).toBe('function');
    });

    it('exports useLocalStorage', () => {
      expect(interactions.useLocalStorage).toBeDefined();
      expect(typeof interactions.useLocalStorage).toBe('function');
    });

    it('exports useKeyPress', () => {
      expect(interactions.useKeyPress).toBeDefined();
      expect(typeof interactions.useKeyPress).toBe('function');
    });

    it('exports usePrevious', () => {
      expect(interactions.usePrevious).toBeDefined();
      expect(typeof interactions.usePrevious).toBe('function');
    });

    it('exports useToggle', () => {
      expect(interactions.useToggle).toBeDefined();
      expect(typeof interactions.useToggle).toBe('function');
    });

    it('exports useToast', () => {
      expect(interactions.useToast).toBeDefined();
      expect(typeof interactions.useToast).toBe('function');
    });

    it('exports useClickOutside', () => {
      expect(interactions.useClickOutside).toBeDefined();
      expect(typeof interactions.useClickOutside).toBe('function');
    });

    it('exports useScrollLock', () => {
      expect(interactions.useScrollLock).toBeDefined();
      expect(typeof interactions.useScrollLock).toBe('function');
    });
  });

  describe('Export Count', () => {
    it('exports exactly 11 hooks', () => {
      const exports = Object.keys(interactions);
      expect(exports).toHaveLength(11);
    });

    it('all exports are functions', () => {
      const exports = Object.values(interactions);
      exports.forEach(exportedValue => {
        expect(typeof exportedValue).toBe('function');
      });
    });
  });

  describe('Named Exports', () => {
    it('does not export default', () => {
      expect(interactions.default).toBeUndefined();
    });

    it('exports are directly accessible', () => {
      const {
        useAsync,
        useDebounce,
        useIntersectionObserver,
        useMediaQuery,
        useLocalStorage,
        useKeyPress,
        usePrevious,
        useToggle,
        useToast,
        useClickOutside,
        useScrollLock
      } = interactions;

      expect(useAsync).toBeDefined();
      expect(useDebounce).toBeDefined();
      expect(useIntersectionObserver).toBeDefined();
      expect(useMediaQuery).toBeDefined();
      expect(useLocalStorage).toBeDefined();
      expect(useKeyPress).toBeDefined();
      expect(usePrevious).toBeDefined();
      expect(useToggle).toBeDefined();
      expect(useToast).toBeDefined();
      expect(useClickOutside).toBeDefined();
      expect(useScrollLock).toBeDefined();
    });
  });

  describe('Hook Names', () => {
    it('all hooks follow "use" naming convention', () => {
      const exports = Object.keys(interactions);
      exports.forEach(name => {
        expect(name).toMatch(/^use[A-Z]/);
      });
    });

    it('contains expected hook names', () => {
      const expectedHooks = [
        'useAsync',
        'useDebounce',
        'useIntersectionObserver',
        'useMediaQuery',
        'useLocalStorage',
        'useKeyPress',
        'usePrevious',
        'useToggle',
        'useToast',
        'useClickOutside',
        'useScrollLock'
      ];

      const actualHooks = Object.keys(interactions);

      expectedHooks.forEach(hookName => {
        expect(actualHooks).toContain(hookName);
      });
    });
  });
});
