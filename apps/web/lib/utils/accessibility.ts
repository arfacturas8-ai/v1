"use client";

import * as React from "react";

// Accessibility utilities for WCAG 2.1 AA compliance

// Generate unique IDs for accessibility
let accessibilityIdCounter = 0;
export function generateAccessibilityId(prefix: string = "cryb"): string {
  return `${prefix}-${++accessibilityIdCounter}`;
}

// Hook for managing focus trap in modals and popups
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement>,
  isActive: boolean = true
) {
  React.useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Find the closest element with data-close-on-escape
        const closableElement = container.closest('[data-close-on-escape]') as HTMLElement;
        if (closableElement) {
          const closeEvent = new CustomEvent('escape-pressed');
          closableElement.dispatchEvent(closeEvent);
        }
      }
    };

    document.addEventListener("keydown", handleTabKey);
    document.addEventListener("keydown", handleEscapeKey);
    
    // Focus first element
    firstElement?.focus();

    return () => {
      document.removeEventListener("keydown", handleTabKey);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [containerRef, isActive]);
}

// Hook for managing aria-live regions
export function useAriaLive() {
  const [liveMessage, setLiveMessage] = React.useState("");
  const [liveRegion, setLiveRegion] = React.useState<"polite" | "assertive">("polite");

  const announce = React.useCallback((message: string, priority: "polite" | "assertive" = "polite") => {
    setLiveRegion(priority);
    setLiveMessage("");
    // Small delay to ensure screen reader picks up the change
    setTimeout(() => setLiveMessage(message), 100);
  }, []);

  const clearMessage = React.useCallback(() => {
    setLiveMessage("");
  }, []);

  return { liveMessage, liveRegion, announce, clearMessage };
}

// Hook for keyboard navigation in lists/grids
export function useKeyboardNavigation(
  items: HTMLElement[],
  orientation: "horizontal" | "vertical" | "both" = "vertical"
) {
  const [activeIndex, setActiveIndex] = React.useState(0);

  const handleKeyDown = React.useCallback((e: KeyboardEvent) => {
    let nextIndex = activeIndex;

    switch (e.key) {
      case "ArrowDown":
        if (orientation === "vertical" || orientation === "both") {
          nextIndex = Math.min(activeIndex + 1, items.length - 1);
          e.preventDefault();
        }
        break;
      case "ArrowUp":
        if (orientation === "vertical" || orientation === "both") {
          nextIndex = Math.max(activeIndex - 1, 0);
          e.preventDefault();
        }
        break;
      case "ArrowRight":
        if (orientation === "horizontal" || orientation === "both") {
          nextIndex = Math.min(activeIndex + 1, items.length - 1);
          e.preventDefault();
        }
        break;
      case "ArrowLeft":
        if (orientation === "horizontal" || orientation === "both") {
          nextIndex = Math.max(activeIndex - 1, 0);
          e.preventDefault();
        }
        break;
      case "Home":
        nextIndex = 0;
        e.preventDefault();
        break;
      case "End":
        nextIndex = items.length - 1;
        e.preventDefault();
        break;
    }

    if (nextIndex !== activeIndex) {
      setActiveIndex(nextIndex);
      items[nextIndex]?.focus();
    }
  }, [activeIndex, items, orientation]);

  return { activeIndex, setActiveIndex, handleKeyDown };
}

// Hook for managing reduced motion preferences
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
}

// Hook for color contrast preferences
export function useHighContrast(): boolean {
  const [prefersHighContrast, setPrefersHighContrast] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-contrast: high)");
    setPrefersHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersHighContrast;
}

// Utility functions for accessibility

// Check if an element is focusable
export function isFocusable(element: HTMLElement): boolean {
  const focusableSelectors = [
    'button',
    '[href]',
    'input',
    'select',
    'textarea',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ];

  return focusableSelectors.some(selector => 
    element.matches(selector) && 
    !element.hasAttribute('disabled') && 
    !element.getAttribute('aria-hidden')
  );
}

// Get all focusable elements within a container
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'button:not([disabled])',
    '[href]:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"]):not([disabled])',
    '[contenteditable="true"]:not([disabled])'
  ];

  return Array.from(
    container.querySelectorAll(focusableSelectors.join(','))
  ) as HTMLElement[];
}

// Screen reader only text utility
export const visuallyHidden = {
  position: 'absolute' as const,
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap' as const,
  borderWidth: 0,
};

// Announce messages to screen readers
export function announceToScreenReader(message: string, priority: "polite" | "assertive" = "polite") {
  const liveRegion = document.createElement("div");
  liveRegion.setAttribute("aria-live", priority);
  liveRegion.setAttribute("aria-atomic", "true");
  liveRegion.style.position = "absolute";
  liveRegion.style.left = "-10000px";
  liveRegion.style.width = "1px";
  liveRegion.style.height = "1px";
  liveRegion.style.overflow = "hidden";

  document.body.appendChild(liveRegion);

  // Small delay to ensure it's registered by screen readers
  setTimeout(() => {
    liveRegion.textContent = message;
    setTimeout(() => {
      document.body.removeChild(liveRegion);
    }, 1000);
  }, 100);
}

// Color contrast utilities
export function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (color: string): number => {
    const rgb = parseInt(color.replace('#', ''), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = rgb & 0xff;

    const toLinear = (c: number) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };

    const rLin = toLinear(r);
    const gLin = toLinear(g);
    const bLin = toLinear(b);

    return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
  };

  const l1 = getLuminance(color1) + 0.05;
  const l2 = getLuminance(color2) + 0.05;
  
  return Math.max(l1, l2) / Math.min(l1, l2);
}

export function meetsWCAGContrast(
  foreground: string, 
  background: string, 
  level: "AA" | "AAA" = "AA",
  size: "normal" | "large" = "normal"
): boolean {
  const ratio = getContrastRatio(foreground, background);
  
  if (level === "AAA") {
    return size === "large" ? ratio >= 4.5 : ratio >= 7;
  } else {
    return size === "large" ? ratio >= 3 : ratio >= 4.5;
  }
}

// Keyboard event utilities
export const KEYBOARD_KEYS = {
  ENTER: "Enter",
  SPACE: " ",
  TAB: "Tab",
  ESCAPE: "Escape",
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
  ARROW_LEFT: "ArrowLeft", 
  ARROW_RIGHT: "ArrowRight",
  HOME: "Home",
  END: "End",
  PAGE_UP: "PageUp",
  PAGE_DOWN: "PageDown",
} as const;

// Check if a key event should activate an element
export function isActivationKey(event: KeyboardEvent): boolean {
  return event.key === KEYBOARD_KEYS.ENTER || event.key === KEYBOARD_KEYS.SPACE;
}

// ARIA attributes helpers
export interface AriaAttributes {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-selected'?: boolean;
  'aria-checked'?: boolean | 'mixed';
  'aria-disabled'?: boolean;
  'aria-hidden'?: boolean;
  'aria-live'?: 'off' | 'polite' | 'assertive';
  'aria-atomic'?: boolean;
  'aria-current'?: boolean | 'page' | 'step' | 'location' | 'date' | 'time';
  role?: string;
}

export function mergeAriaAttributes(
  ...attributes: (AriaAttributes | undefined)[]
): AriaAttributes {
  return Object.assign({}, ...attributes.filter(Boolean));
}

// Component wrapper for accessibility announcements
interface AriaLiveRegionProps {
  message: string;
  priority?: "polite" | "assertive";
  clearOnUpdate?: boolean;
}

export function AriaLiveRegion({ 
  message, 
  priority = "polite", 
  clearOnUpdate = true 
}: AriaLiveRegionProps) {
  const [currentMessage, setCurrentMessage] = React.useState(message);

  React.useEffect(() => {
    if (clearOnUpdate) {
      setCurrentMessage("");
      const timeout = setTimeout(() => setCurrentMessage(message), 100);
      return () => clearTimeout(timeout);
    } else {
      setCurrentMessage(message);
    }
  }, [message, clearOnUpdate]);

  if (!currentMessage) return null;

  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      style={visuallyHidden}
    >
      {currentMessage}
    </div>
  );
}