/**
 * useResponsive Hook
 * Provides responsive utilities for mobile-first design
 */
import { useState, useEffect } from 'react';

export const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowSize.width < 640;
  const isTablet = windowSize.width >= 640 && windowSize.width < 1024;
  const isDesktop = windowSize.width >= 1024;
  const isSmallMobile = windowSize.width < 375;

  // Responsive values
  const spacing = {
    xs: isMobile ? 4 : 8,
    sm: isMobile ? 8 : 12,
    md: isMobile ? 12 : 16,
    lg: isMobile ? 16 : 24,
    xl: isMobile ? 24 : 32,
    '2xl': isMobile ? 32 : 48,
    '3xl': isMobile ? 40 : 64,
  };

  const fontSize = {
    xs: isMobile ? 10 : 12,
    sm: isMobile ? 12 : 14,
    base: isMobile ? 14 : 16,
    lg: isMobile ? 16 : 18,
    xl: isMobile ? 18 : 20,
    '2xl': isMobile ? 20 : 24,
    '3xl': isMobile ? 24 : 28,
    '4xl': isMobile ? 28 : 36,
  };

  const containerMaxWidth = {
    sm: '100%',
    md: isMobile ? '100%' : '600px',
    lg: isMobile ? '100%' : '800px',
    xl: isMobile ? '100%' : '1200px',
  };

  const padding = {
    container: isMobile ? '16px' : '40px 20px',
    card: isMobile ? '16px' : '32px',
    section: isMobile ? '20px' : '48px',
  };

  return {
    isMobile,
    isTablet,
    isDesktop,
    isSmallMobile,
    windowSize,
    spacing,
    fontSize,
    containerMaxWidth,
    padding,
  };
};

// Responsive style generator
export const responsive = {
  padding: (mobile, desktop = mobile * 2) => {
    const { isMobile } = useResponsive();
    return `${isMobile ? mobile : desktop}px`;
  },
  fontSize: (mobile, desktop = mobile + 4) => {
    const { isMobile } = useResponsive();
    return `${isMobile ? mobile : desktop}px`;
  },
  spacing: (mobile, desktop = mobile * 1.5) => {
    const { isMobile } = useResponsive();
    return `${isMobile ? mobile : desktop}px`;
  },
};
