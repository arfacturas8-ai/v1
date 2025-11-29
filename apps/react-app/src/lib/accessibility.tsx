/**
 * CRYB Design System - Accessibility Utilities
 * WCAG 2.1 AA compliance utilities and helpers
 */

import React from 'react';

// ===== ARIA UTILITIES =====

/**
 * Generate unique IDs for accessibility
 */
let idCounter = 0;
export const generateId = (prefix = 'cryb'): string => {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
};

/**
 * Hook for generating stable IDs
 */
export const useId = (prefix?: string): string => {
  const [id] = React.useState(() => generateId(prefix));
  return id;
};

/**
 * ARIA live region announcer
 */
class LiveRegionAnnouncer {
  private politeRegion: HTMLDivElement | null = null;
  private assertiveRegion: HTMLDivElement | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.createRegions();
    }
  }

  private createRegions() {
    // Polite region for non-urgent announcements
    this.politeRegion = document.createElement('div');
    this.politeRegion.setAttribute('aria-live', 'polite');
    this.politeRegion.setAttribute('aria-atomic', 'true');
    this.politeRegion.className = 'sr-only';
    document.body.appendChild(this.politeRegion);

    // Assertive region for urgent announcements
    this.assertiveRegion = document.createElement('div');
    this.assertiveRegion.setAttribute('aria-live', 'assertive');
    this.assertiveRegion.setAttribute('aria-atomic', 'true');
    this.assertiveRegion.className = 'sr-only';
    document.body.appendChild(this.assertiveRegion);
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    const region = priority === 'assertive' ? this.assertiveRegion : this.politeRegion;
    
    if (region) {
      // Clear previous message
      region.textContent = '';
      
      // Set new message after a brief delay to ensure screen readers pick it up
      setTimeout(() => {
        region.textContent = message;
      }, 100);

      // Clear message after announcement
      setTimeout(() => {
        region.textContent = '';
      }, 5000);
    }
  }
}

// Global announcer instance
export const announcer = new LiveRegionAnnouncer();

// ===== FOCUS MANAGEMENT =====

/**
 * Focus trap utility for modals and dialogs
 */
export class FocusTrap {
  private element: HTMLElement;
  private previousActiveElement: Element | null = null;
  private focusableElements: HTMLElement[] = [];

  constructor(element: HTMLElement) {
    this.element = element;
  }

  activate() {
    this.previousActiveElement = document.activeElement;
    this.updateFocusableElements();
    this.focusFirstElement();
    document.addEventListener('keydown', this.handleKeyDown);
  }

  deactivate() {
    document.removeEventListener('keydown', this.handleKeyDown);
    if (this.previousActiveElement && 'focus' in this.previousActiveElement) {
      (this.previousActiveElement as HTMLElement).focus();
    }
  }

  private updateFocusableElements() {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable]',
    ].join(', ');

    this.focusableElements = Array.from(
      this.element.querySelectorAll(focusableSelectors)
    ) as HTMLElement[];
  }

  private focusFirstElement() {
    if (this.focusableElements.length > 0) {
      this.focusableElements[0].focus();
    }
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    if (this.focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = this.focusableElements[0];
    const lastElement = this.focusableElements[this.focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  };
}

/**
 * Hook for focus trap
 */
export const useFocusTrap = (isActive: boolean = false) => {
  const elementRef = React.useRef<HTMLElement>(null);
  const focusTrap = React.useRef<FocusTrap | null>(null);

  React.useEffect(() => {
    if (isActive && elementRef.current) {
      focusTrap.current = new FocusTrap(elementRef.current);
      focusTrap.current.activate();
    } else if (focusTrap.current) {
      focusTrap.current.deactivate();
      focusTrap.current = null;
    }

    return () => {
      if (focusTrap.current) {
        focusTrap.current.deactivate();
      }
    };
  }, [isActive]);

  return elementRef;
};

// ===== KEYBOARD NAVIGATION =====

/**
 * Roving tabindex manager for composite widgets
 */
export class RovingTabindexManager {
  private items: HTMLElement[] = [];
  private currentIndex = 0;

  constructor(container: HTMLElement, itemSelector: string) {
    this.updateItems(container, itemSelector);
    this.setTabindex();
    container.addEventListener('keydown', this.handleKeyDown);
  }

  updateItems(container: HTMLElement, itemSelector: string) {
    this.items = Array.from(container.querySelectorAll(itemSelector)) as HTMLElement[];
  }

  private setTabindex() {
    this.items.forEach((item, index) => {
      item.setAttribute('tabindex', index === this.currentIndex ? '0' : '-1');
    });
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    const { key } = event;
    let newIndex = this.currentIndex;

    switch (key) {
      case 'ArrowRight':
      case 'ArrowDown':
        newIndex = (this.currentIndex + 1) % this.items.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        newIndex = (this.currentIndex - 1 + this.items.length) % this.items.length;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = this.items.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    this.setCurrentIndex(newIndex);
    this.items[newIndex].focus();
  };

  setCurrentIndex(index: number) {
    this.currentIndex = index;
    this.setTabindex();
  }

  destroy() {
    // Remove event listeners if needed
  }
}

// ===== COLOR CONTRAST UTILITIES =====

/**
 * Calculate relative luminance of a color
 */
const getRelativeLuminance = (r: number, g: number, b: number): number => {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

/**
 * Calculate contrast ratio between two colors
 */
export const getContrastRatio = (
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number }
): number => {
  const l1 = getRelativeLuminance(color1.r, color1.g, color1.b);
  const l2 = getRelativeLuminance(color2.r, color2.g, color2.b);
  const lightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return (lightest + 0.05) / (darkest + 0.05);
};

/**
 * Check if color combination meets WCAG contrast requirements
 */
export const meetsContrastRequirement = (
  foreground: { r: number; g: number; b: number },
  background: { r: number; g: number; b: number },
  level: 'AA' | 'AAA' = 'AA',
  size: 'normal' | 'large' = 'normal'
): boolean => {
  const ratio = getContrastRatio(foreground, background);
  
  if (level === 'AAA') {
    return size === 'large' ? ratio >= 4.5 : ratio >= 7;
  } else {
    return size === 'large' ? ratio >= 3 : ratio >= 4.5;
  }
};

/**
 * Parse hex color to RGB
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

// ===== REDUCED MOTION UTILITIES =====

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Hook for reduced motion preference
 */
export const usePrefersReducedMotion = (): boolean => {
  const [prefersReduced, setPrefersReduced] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReduced(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return prefersReduced;
};

// ===== SCREEN READER UTILITIES =====

/**
 * Screen reader only text component
 */
export const ScreenReaderOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="sr-only">{children}</span>
);

/**
 * Hook for screen reader announcements
 */
export const useAnnouncement = () => {
  return React.useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announcer.announce(message, priority);
  }, []);
};

// ===== SKIP LINK COMPONENT =====
export interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
}

export const SkipLink: React.FC<SkipLinkProps> = ({ href, children }) => (
  <a
    href={href}
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
  >
    {children}
  </a>
);

// ===== FORM ACCESSIBILITY UTILITIES =====

/**
 * Generate form field IDs and ARIA attributes
 */
export const useFormField = (name: string) => {
  const fieldId = useId(`field-${name}`);
  const errorId = useId(`error-${name}`);
  const helpId = useId(`help-${name}`);

  return {
    fieldId,
    errorId,
    helpId,
    getFieldProps: (hasError?: boolean, hasHelp?: boolean) => ({
      id: fieldId,
      'aria-describedby': [
        hasError ? errorId : '',
        hasHelp ? helpId : '',
      ].filter(Boolean).join(' ') || undefined,
      'aria-invalid': hasError ? 'true' : undefined,
    }),
    getErrorProps: () => ({
      id: errorId,
      role: 'alert',
      'aria-live': 'polite' as const,
    }),
    getHelpProps: () => ({
      id: helpId,
    }),
  };
};

// ===== LANDMARK UTILITIES =====

/**
 * Main content wrapper with proper landmarks
 */
export const MainContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <main role="main" id="main-content">
    {children}
  </main>
);

/**
 * Navigation wrapper with proper landmarks
 */
export const Navigation: React.FC<{ 
  children: React.ReactNode; 
  'aria-label'?: string 
}> = ({ children, 'aria-label': ariaLabel }) => (
  <nav role="navigation" aria-label={ariaLabel}>
    {children}
  </nav>
);

// ===== HIGH CONTRAST MODE DETECTION =====

/**
 * Hook for high contrast mode detection
 */
export const usePrefersHighContrast = (): boolean => {
  const [prefersHighContrast, setPrefersHighContrast] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setPrefersHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return prefersHighContrast;
};

// ===== ARIA DESCRIBEDBY MANAGER =====

/**
 * Manage aria-describedby attributes for complex components
 */
export class AriaDescribedByManager {
  private element: HTMLElement;
  private descriptions: string[] = [];

  constructor(element: HTMLElement) {
    this.element = element;
  }

  add(id: string) {
    if (!this.descriptions.includes(id)) {
      this.descriptions.push(id);
      this.update();
    }
  }

  remove(id: string) {
    this.descriptions = this.descriptions.filter(desc => desc !== id);
    this.update();
  }

  private update() {
    if (this.descriptions.length > 0) {
      this.element.setAttribute('aria-describedby', this.descriptions.join(' '));
    } else {
      this.element.removeAttribute('aria-describedby');
    }
  }
}

// ===== EXPORTS =====
export default {
  generateId,
  useId,
  announcer,
  FocusTrap,
  useFocusTrap,
  RovingTabindexManager,
  getContrastRatio,
  meetsContrastRequirement,
  hexToRgb,
  prefersReducedMotion,
  usePrefersReducedMotion,
  ScreenReaderOnly,
  useAnnouncement,
  SkipLink,
  useFormField,
  MainContent,
  Navigation,
  usePrefersHighContrast,
  AriaDescribedByManager,
};