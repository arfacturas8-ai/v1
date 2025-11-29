/**
 * CRYB Design System - useMediaQuery Hook
 * React hook for responsive media queries with SSR support
 */

import { useState, useEffect } from 'react';

/**
 * Hook to use CSS media queries in React components
 * @param query - CSS media query string
 * @param defaultValue - Default value for SSR (optional)
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string, defaultValue?: boolean): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    // Return default value during SSR or if window is not available
    if (typeof window === 'undefined') {
      return defaultValue ?? false;
    }
    
    try {
      return window.matchMedia(query).matches;
    } catch (error) {
      return defaultValue ?? false;
    }
  });

  useEffect(() => {
    // Skip if window is not available (SSR)
    if (typeof window === 'undefined') {
      return;
    }

    let mediaQueryList: MediaQueryList;
    
    try {
      mediaQueryList = window.matchMedia(query);
    } catch (error) {
      return;
    }

    // Update state to match current media query
    setMatches(mediaQueryList.matches);

    // Create event handler
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add event listener
    // Use both methods for better browser compatibility
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQueryList.addListener(handleChange);
    }

    // Cleanup function
    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        mediaQueryList.removeListener(handleChange);
      }
    };
  }, [query]);

  return matches;
}

/**
 * Hook for multiple media queries
 * @param queries - Object with query names and media query strings
 * @returns Object with query names and their match status
 */
export function useMediaQueries<T extends Record<string, string>>(
  queries: T
): { [K in keyof T]: boolean } {
  const [matches, setMatches] = useState<{ [K in keyof T]: boolean }>(() => {
    const initialState = {} as { [K in keyof T]: boolean };
    
    if (typeof window === 'undefined') {
      // Return false for all queries during SSR
      Object.keys(queries).forEach((key) => {
        initialState[key as keyof T] = false;
      });
      return initialState;
    }

    Object.entries(queries).forEach(([key, query]) => {
      try {
        initialState[key as keyof T] = window.matchMedia(query as string).matches;
      } catch (error) {
        initialState[key as keyof T] = false;
      }
    });

    return initialState;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQueryLists: MediaQueryList[] = [];
    const handlers: (() => void)[] = [];

    Object.entries(queries).forEach(([key, query]) => {
      let mediaQueryList: MediaQueryList;
      
      try {
        mediaQueryList = window.matchMedia(query as string);
      } catch (error) {
        return;
      }

      mediaQueryLists.push(mediaQueryList);

      const handler = () => {
        setMatches(current => ({
          ...current,
          [key]: mediaQueryList.matches,
        }));
      };

      handlers.push(handler);

      if (mediaQueryList.addEventListener) {
        mediaQueryList.addEventListener('change', handler);
      } else {
        mediaQueryList.addListener(handler);
      }
    });

    return () => {
      mediaQueryLists.forEach((mediaQueryList, index) => {
        const handler = handlers[index];
        if (mediaQueryList.removeEventListener) {
          mediaQueryList.removeEventListener('change', handler);
        } else {
          mediaQueryList.removeListener(handler);
        }
      });
    };
  }, [queries]);

  return matches;
}

/**
 * Common breakpoint queries
 */
export const breakpointQueries = {
  xs: '(min-width: 475px)',
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
  mobile: '(max-width: 767px)',
  tablet: '(min-width: 768px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)',
  touch: '(hover: none) and (pointer: coarse)',
  hover: '(hover: hover) and (pointer: fine)',
  portrait: '(orientation: portrait)',
  landscape: '(orientation: landscape)',
  'reduced-motion': '(prefers-reduced-motion: reduce)',
  'high-contrast': '(prefers-contrast: high)',
  'dark-mode': '(prefers-color-scheme: dark)',
  'light-mode': '(prefers-color-scheme: light)',
} as const;

/**
 * Hook for common breakpoints
 */
export function useBreakpoints() {
  return useMediaQueries(breakpointQueries);
}

/**
 * Hook for device detection
 */
export function useDevice() {
  const breakpoints = useBreakpoints();
  
  return {
    isMobile: breakpoints.mobile,
    isTablet: breakpoints.tablet,
    isDesktop: breakpoints.desktop,
    isTouch: breakpoints.touch,
    hasHover: breakpoints.hover,
    isPortrait: breakpoints.portrait,
    isLandscape: breakpoints.landscape,
    prefersReducedMotion: breakpoints['reduced-motion'],
    prefersHighContrast: breakpoints['high-contrast'],
    prefersDarkMode: breakpoints['dark-mode'],
    prefersLightMode: breakpoints['light-mode'],
  };
}

/**
 * Hook for responsive values
 * Returns different values based on current breakpoint
 */
export function useResponsiveValue<T>(values: {
  mobile?: T;
  tablet?: T;
  desktop?: T;
  default: T;
}): T {
  const { isMobile, isTablet, isDesktop } = useDevice();
  
  if (isMobile && values.mobile !== undefined) {
    return values.mobile;
  }
  
  if (isTablet && values.tablet !== undefined) {
    return values.tablet;
  }
  
  if (isDesktop && values.desktop !== undefined) {
    return values.desktop;
  }
  
  return values.default;
}

/**
 * Hook for container queries (experimental)
 * Note: Requires browser support for container queries
 */
export function useContainerQuery(
  containerRef: React.RefObject<HTMLElement>,
  query: string
): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof window === 'undefined') {
      return;
    }

    // Check if browser supports container queries
    if (!('container' in document.documentElement.style)) {
      return;
    }

    const observer = new ResizeObserver(() => {
      // This is a simplified implementation
      // In a real implementation, you'd need to parse the container query
      // and check against the element's dimensions
      const rect = element.getBoundingClientRect();
      // Example: check if width > 400px
      setMatches(rect.width > 400);
    });

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [containerRef, query]);

  return matches;
}

export default useMediaQuery;