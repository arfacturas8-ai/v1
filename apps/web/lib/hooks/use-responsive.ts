"use client";

import { useState, useEffect } from 'react';

export interface BreakpointValues {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

export const breakpoints: BreakpointValues = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export type Breakpoint = keyof BreakpointValues;

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

export function useBreakpoint(breakpoint: Breakpoint): boolean {
  const value = breakpoints[breakpoint];
  return useMediaQuery(`(min-width: ${value}px)`);
}

export function useBreakpointValue<T>(values: Partial<Record<Breakpoint, T>>, fallback: T): T {
  const breakpointKeys = Object.keys(breakpoints) as Breakpoint[];
  
  // Sort breakpoints by size (largest first)
  const sortedBreakpoints = breakpointKeys.sort((a, b) => breakpoints[b] - breakpoints[a]);
  
  const isXs = useBreakpoint('xs');
  const isSm = useBreakpoint('sm');
  const isMd = useBreakpoint('md');
  const isLg = useBreakpoint('lg');
  const isXl = useBreakpoint('xl');
  const is2xl = useBreakpoint('2xl');

  const breakpointMatches: Record<Breakpoint, boolean> = {
    'xs': isXs,
    'sm': isSm,
    'md': isMd,
    'lg': isLg,
    'xl': isXl,
    '2xl': is2xl,
  };

  // Find the first matching breakpoint value
  for (const bp of sortedBreakpoints) {
    if (breakpointMatches[bp] && values[bp] !== undefined) {
      return values[bp]!;
    }
  }

  return fallback;
}

export function useViewportSize() {
  const [size, setSize] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateSize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return size;
}

export function useIsMobile() {
  return useBreakpointValue(
    {
      xs: true,
      sm: true,
      md: false,
      lg: false,
      xl: false,
      '2xl': false,
    },
    false
  );
}

export function useIsTablet() {
  return useBreakpointValue(
    {
      xs: false,
      sm: false,
      md: true,
      lg: false,
      xl: false,
      '2xl': false,
    },
    false
  );
}

export function useIsDesktop() {
  return useBreakpointValue(
    {
      xs: false,
      sm: false,
      md: false,
      lg: true,
      xl: true,
      '2xl': true,
    },
    true
  );
}

// Custom hook for Discord-like responsive behavior
export function useDiscordLayout() {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();

  const layout = useBreakpointValue(
    {
      xs: 'mobile-stack',
      sm: 'mobile-stack', 
      md: 'tablet-hybrid',
      lg: 'desktop-full',
      xl: 'desktop-full',
      '2xl': 'desktop-wide',
    },
    'desktop-full'
  ) as 'mobile-stack' | 'tablet-hybrid' | 'desktop-full' | 'desktop-wide';

  const showServerSidebar = isDesktop;
  const showChannelSidebar = !isMobile;
  const showUserList = isDesktop;
  const allowResizing = isDesktop;
  const useCompactMode = isMobile;

  const sidebarWidth = useBreakpointValue(
    {
      xs: 0,
      sm: 0,
      md: 200,
      lg: 240,
      xl: 280,
      '2xl': 320,
    },
    240
  );

  const userListWidth = useBreakpointValue(
    {
      xs: 0,
      sm: 0,
      md: 0,
      lg: 200,
      xl: 240,
      '2xl': 280,
    },
    240
  );

  return {
    layout,
    isMobile,
    isTablet,
    isDesktop,
    showServerSidebar,
    showChannelSidebar,
    showUserList,
    allowResizing,
    useCompactMode,
    sidebarWidth,
    userListWidth,
  };
}