/**
 * CRYB Platform - Focus Management Hook
 * Provides comprehensive focus management for accessibility
 * Handles focus trapping, restoration, and keyboard navigation
 */

import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook for focus trap in modals, dialogs, and other containers
 * Ensures keyboard users can navigate only within the trapped container
 *
 * @param {boolean} isActive - Whether the focus trap is active
 * @returns {Object} - Object containing the container ref and helper methods
 */
export function useFocusTrap(isActive = false) {
  const containerRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Get all focusable elements within a container
  const getFocusableElements = useCallback((container) => {
    if (!container) return [];

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ');

    const elements = container.querySelectorAll(focusableSelectors);
    return Array.from(elements).filter(
      (el) => !el.hasAttribute('aria-hidden') && el.offsetParent !== null
    );
  }, []);

  // Handle tab key navigation within the trap
  const handleKeyDown = useCallback(
    (event) => {
      if (!isActive || !containerRef.current) return;
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements(containerRef.current);
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey) {
        // Shift + Tab - move backwards
        if (activeElement === firstElement || !containerRef.current.contains(activeElement)) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab - move forwards
        if (activeElement === lastElement || !containerRef.current.contains(activeElement)) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    },
    [isActive, getFocusableElements]
  );

  // Activate focus trap
  useEffect(() => {
    if (isActive && containerRef.current) {
      // Save current focus
      previousActiveElement.current = document.activeElement;

      // Focus first element in container
      const focusableElements = getFocusableElements(containerRef.current);
      if (focusableElements.length > 0) {
        // Small delay to ensure the container is rendered
        setTimeout(() => {
          focusableElements[0]?.focus();
        }, 10);
      }

      // Add event listener
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        // Remove event listener
        document.removeEventListener('keydown', handleKeyDown);

        // Restore previous focus
        if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [isActive, handleKeyDown, getFocusableElements]);

  return {
    containerRef,
    getFocusableElements: () => getFocusableElements(containerRef.current),
  };
}

/**
 * Hook for managing focus on route changes
 * Announces page changes to screen readers and resets focus
 *
 * @param {string} pageTitle - Title of the current page
 */
export function useFocusOnRouteChange(pageTitle) {
  const announceRef = useRef(null);

  useEffect(() => {
    // Create announcement element if it doesn't exist
    if (!announceRef.current) {
      announceRef.current = document.createElement('div');
      announceRef.current.setAttribute('role', 'status');
      announceRef.current.setAttribute('aria-live', 'polite');
      announceRef.current.setAttribute('aria-atomic', 'true');
      announceRef.current.className = 'sr-only';
      document.body.appendChild(announceRef.current);
    }

    // Announce page change
    if (pageTitle) {
      announceRef.current.textContent = `Navigated to ${pageTitle}`;

      // Clear announcement after delay
      setTimeout(() => {
        if (announceRef.current) {
          announceRef.current.textContent = '';
        }
      }, 1000);
    }

    // Focus main content or first heading
    const mainContent = document.querySelector('#main-content') || document.querySelector('main');
    if (mainContent) {
      mainContent.focus({ preventScroll: true });
      mainContent.setAttribute('tabindex', '-1');
    }

    // Cleanup on unmount
    return () => {
      if (announceRef.current && announceRef.current.parentNode) {
        announceRef.current.parentNode.removeChild(announceRef.current);
        announceRef.current = null;
      }
    };
  }, [pageTitle]);
}

/**
 * Hook for managing focus in forms
 * Focuses on first error when form validation fails
 *
 * @param {Object} errors - Form errors object
 * @param {boolean} isSubmitting - Whether form is currently submitting
 */
export function useFocusOnError(errors, isSubmitting) {
  const previousErrorsRef = useRef({});

  useEffect(() => {
    // Only run when submission completes and there are errors
    if (!isSubmitting && errors && Object.keys(errors).length > 0) {
      const currentErrors = Object.keys(errors);
      const previousErrors = Object.keys(previousErrorsRef.current);

      // Check if this is a new error state
      const hasNewErrors = currentErrors.length > previousErrors.length ||
        currentErrors.some(key => !previousErrors.includes(key));

      if (hasNewErrors) {
        // Find first field with error
        const firstErrorField = currentErrors[0];
        const errorElement = document.querySelector(`[name="${firstErrorField}"]`) ||
          document.querySelector(`#${firstErrorField}`) ||
          document.querySelector(`[id$="-${firstErrorField}"]`);

        if (errorElement && typeof errorElement.focus === 'function') {
          // Focus the field
          errorElement.focus();

          // Scroll into view
          errorElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });

          // Announce error to screen readers
          const errorMessage = errors[firstErrorField];
          if (errorMessage) {
            announceToScreenReader(`Error: ${errorMessage}`, 'assertive');
          }
        }
      }
    }

    previousErrorsRef.current = errors || {};
  }, [errors, isSubmitting]);
}

/**
 * Hook for managing focus in lists with arrow key navigation
 * Enables keyboard navigation through lists (e.g., menus, dropdowns)
 *
 * @param {boolean} isActive - Whether keyboard navigation is active
 * @param {Object} options - Configuration options
 */
export function useListKeyboardNavigation(isActive = false, options = {}) {
  const {
    orientation = 'vertical', // 'vertical' or 'horizontal'
    loop = true, // Whether to loop from end to start
    onSelect = null, // Callback when item is selected (Enter/Space)
  } = options;

  const listRef = useRef(null);
  const currentIndexRef = useRef(0);

  const handleKeyDown = useCallback(
    (event) => {
      if (!isActive || !listRef.current) return;

      const items = Array.from(
        listRef.current.querySelectorAll('[role="menuitem"], [role="option"], li a, li button')
      ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);

      if (items.length === 0) return;

      const currentIndex = items.indexOf(document.activeElement);
      let nextIndex = currentIndex;

      const isVertical = orientation === 'vertical';
      const forwardKey = isVertical ? 'ArrowDown' : 'ArrowRight';
      const backwardKey = isVertical ? 'ArrowUp' : 'ArrowLeft';

      switch (event.key) {
        case forwardKey:
          event.preventDefault();
          nextIndex = currentIndex + 1;
          if (nextIndex >= items.length) {
            nextIndex = loop ? 0 : items.length - 1;
          }
          break;

        case backwardKey:
          event.preventDefault();
          nextIndex = currentIndex - 1;
          if (nextIndex < 0) {
            nextIndex = loop ? items.length - 1 : 0;
          }
          break;

        case 'Home':
          event.preventDefault();
          nextIndex = 0;
          break;

        case 'End':
          event.preventDefault();
          nextIndex = items.length - 1;
          break;

        case 'Enter':
        case ' ':
          event.preventDefault();
          if (onSelect && items[currentIndex]) {
            onSelect(items[currentIndex]);
          } else if (items[currentIndex]) {
            items[currentIndex].click();
          }
          return;

        default:
          return;
      }

      if (items[nextIndex]) {
        items[nextIndex].focus();
        currentIndexRef.current = nextIndex;
      }
    },
    [isActive, orientation, loop, onSelect]
  );

  useEffect(() => {
    if (isActive && listRef.current) {
      listRef.current.addEventListener('keydown', handleKeyDown);

      return () => {
        if (listRef.current) {
          listRef.current.removeEventListener('keydown', handleKeyDown);
        }
      };
    }
  }, [isActive, handleKeyDown]);

  return { listRef };
}

/**
 * Utility function to announce messages to screen readers
 * Creates a temporary live region for announcements
 *
 * @param {string} message - Message to announce
 * @param {string} priority - 'polite' or 'assertive'
 */
export function announceToScreenReader(message, priority = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Hook for managing roving tabindex in toolbars or button groups
 * Only one item is tabbable at a time, arrow keys move between items
 *
 * @param {boolean} isActive - Whether roving tabindex is active
 */
export function useRovingTabindex(isActive = false) {
  const containerRef = useRef(null);
  const currentIndexRef = useRef(0);

  const updateTabindices = useCallback(() => {
    if (!containerRef.current) return;

    const items = Array.from(
      containerRef.current.querySelectorAll('[role="button"], button, [role="tab"]')
    );

    items.forEach((item, index) => {
      item.setAttribute('tabindex', index === currentIndexRef.current ? '0' : '-1');
    });
  }, []);

  const handleKeyDown = useCallback(
    (event) => {
      if (!isActive || !containerRef.current) return;

      const items = Array.from(
        containerRef.current.querySelectorAll('[role="button"], button, [role="tab"]')
      );

      if (items.length === 0) return;

      let nextIndex = currentIndexRef.current;

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          nextIndex = (currentIndexRef.current + 1) % items.length;
          break;

        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          nextIndex = (currentIndexRef.current - 1 + items.length) % items.length;
          break;

        case 'Home':
          event.preventDefault();
          nextIndex = 0;
          break;

        case 'End':
          event.preventDefault();
          nextIndex = items.length - 1;
          break;

        default:
          return;
      }

      currentIndexRef.current = nextIndex;
      updateTabindices();
      items[nextIndex]?.focus();
    },
    [isActive, updateTabindices]
  );

  useEffect(() => {
    if (isActive && containerRef.current) {
      updateTabindices();
      containerRef.current.addEventListener('keydown', handleKeyDown);

      return () => {
        if (containerRef.current) {
          containerRef.current.removeEventListener('keydown', handleKeyDown);
        }
      };
    }
  }, [isActive, handleKeyDown, updateTabindices]);

  return { containerRef };
}

export default {
  useFocusTrap,
  useFocusOnRouteChange,
  useFocusOnError,
  useListKeyboardNavigation,
  useRovingTabindex,
  announceToScreenReader,
};
