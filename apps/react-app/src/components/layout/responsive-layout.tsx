/**
 * CRYB Design System - Responsive Layout Components
 * Mobile-first responsive layout system with adaptive breakpoints
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { useMediaQuery } from '@/hooks/useMediaQuery';

// ===== CONTAINER VARIANTS =====
const containerVariants = cva([
  'w-full mx-auto px-4',
], {
  variants: {
    size: {
      sm: 'max-w-screen-sm',      // 640px
      md: 'max-w-screen-md',      // 768px
      lg: 'max-w-screen-lg',      // 1024px
      xl: 'max-w-screen-xl',      // 1280px
      '2xl': 'max-w-screen-2xl',  // 1536px
      full: 'max-w-full',
      content: 'max-w-4xl',       // 896px
      prose: 'max-w-3xl',         // 768px
      narrow: 'max-w-2xl',        // 672px
    },
    padding: {
      none: 'px-0',
      xs: 'px-2',
      sm: 'px-4',
      md: 'px-6',
      lg: 'px-8',
      xl: 'px-12',
    },
  },
  defaultVariants: {
    size: 'xl',
    padding: 'sm',
  },
});

// ===== GRID VARIANTS =====
const gridVariants = cva([
  'grid w-full',
], {
  variants: {
    cols: {
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
      5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
      6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
      auto: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
      'auto-fit': 'grid-cols-[repeat(auto-fit,minmax(250px,1fr))]',
      'auto-fill': 'grid-cols-[repeat(auto-fill,minmax(250px,1fr))]',
    },
    gap: {
      none: 'gap-0',
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
      '2xl': 'gap-12',
    },
    responsive: {
      true: 'gap-2 sm:gap-4 md:gap-6 lg:gap-8',
      false: '',
    },
  },
  defaultVariants: {
    cols: 'auto',
    gap: 'md',
    responsive: false,
  },
});

// ===== FLEXBOX VARIANTS =====
const flexVariants = cva([
  'flex',
], {
  variants: {
    direction: {
      row: 'flex-row',
      'row-reverse': 'flex-row-reverse',
      col: 'flex-col',
      'col-reverse': 'flex-col-reverse',
      responsive: 'flex-col md:flex-row',
      'responsive-reverse': 'flex-col-reverse md:flex-row-reverse',
    },
    wrap: {
      nowrap: 'flex-nowrap',
      wrap: 'flex-wrap',
      'wrap-reverse': 'flex-wrap-reverse',
    },
    justify: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly',
    },
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
      baseline: 'items-baseline',
    },
    gap: {
      none: 'gap-0',
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
      '2xl': 'gap-12',
      responsive: 'gap-2 sm:gap-4 md:gap-6',
    },
  },
  defaultVariants: {
    direction: 'row',
    wrap: 'nowrap',
    justify: 'start',
    align: 'start',
    gap: 'none',
  },
});

// ===== STACK VARIANTS =====
const stackVariants = cva([
  'flex flex-col',
], {
  variants: {
    spacing: {
      none: 'space-y-0',
      xs: 'space-y-1',
      sm: 'space-y-2',
      md: 'space-y-4',
      lg: 'space-y-6',
      xl: 'space-y-8',
      '2xl': 'space-y-12',
      responsive: 'space-y-2 sm:space-y-4 md:space-y-6',
    },
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
    },
  },
  defaultVariants: {
    spacing: 'md',
    align: 'stretch',
  },
});

// ===== RESPONSIVE INTERFACES =====
export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: VariantProps<typeof containerVariants>['size'];
  padding?: VariantProps<typeof containerVariants>['padding'];
  as?: keyof JSX.IntrinsicElements;
}

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: VariantProps<typeof gridVariants>['cols'];
  gap?: VariantProps<typeof gridVariants>['gap'];
  responsive?: VariantProps<typeof gridVariants>['responsive'];
  as?: keyof JSX.IntrinsicElements;
}

export interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: VariantProps<typeof flexVariants>['direction'];
  wrap?: VariantProps<typeof flexVariants>['wrap'];
  justify?: VariantProps<typeof flexVariants>['justify'];
  align?: VariantProps<typeof flexVariants>['align'];
  gap?: VariantProps<typeof flexVariants>['gap'];
  as?: keyof JSX.IntrinsicElements;
}

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: VariantProps<typeof stackVariants>['spacing'];
  align?: VariantProps<typeof stackVariants>['align'];
  as?: keyof JSX.IntrinsicElements;
}

export interface ResponsiveShowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Show only on specified breakpoints */
  show?: 'mobile' | 'tablet' | 'desktop' | 'mobile-tablet' | 'tablet-desktop';
  /** Hide on specified breakpoints */
  hide?: 'mobile' | 'tablet' | 'desktop' | 'mobile-tablet' | 'tablet-desktop';
  /** Render as different element */
  as?: keyof JSX.IntrinsicElements;
}

export interface AspectRatioProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Aspect ratio */
  ratio?: '1:1' | '4:3' | '16:9' | '21:9' | '3:2' | '2:3' | 'golden' | number;
}

// ===== BREAKPOINT CONSTANTS =====
export const breakpoints = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ===== CONTAINER COMPONENT =====
const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size, padding, as: Component = 'div', children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(containerVariants({ size, padding }), className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Container.displayName = 'Container';

// ===== GRID COMPONENT =====
const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ className, cols, gap, responsive, as: Component = 'div', children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(gridVariants({ cols, gap, responsive }), className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Grid.displayName = 'Grid';

// ===== FLEX COMPONENT =====
const Flex = React.forwardRef<HTMLDivElement, FlexProps>(
  ({ 
    className, 
    direction, 
    wrap, 
    justify, 
    align, 
    gap, 
    as: Component = 'div', 
    children, 
    ...props 
  }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(flexVariants({ direction, wrap, justify, align, gap }), className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Flex.displayName = 'Flex';

// ===== STACK COMPONENT =====
const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ className, spacing, align, as: Component = 'div', children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(stackVariants({ spacing, align }), className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Stack.displayName = 'Stack';

// ===== RESPONSIVE SHOW/HIDE COMPONENT =====
const ResponsiveShow: React.FC<ResponsiveShowProps> = ({ 
  show, 
  hide, 
  as: Component = 'div', 
  className,
  children, 
  ...props 
}) => {
  let responsiveClasses = '';

  if (show) {
    switch (show) {
      case 'mobile':
        responsiveClasses = 'block md:hidden';
        break;
      case 'tablet':
        responsiveClasses = 'hidden md:block lg:hidden';
        break;
      case 'desktop':
        responsiveClasses = 'hidden lg:block';
        break;
      case 'mobile-tablet':
        responsiveClasses = 'block lg:hidden';
        break;
      case 'tablet-desktop':
        responsiveClasses = 'hidden md:block';
        break;
    }
  }

  if (hide) {
    switch (hide) {
      case 'mobile':
        responsiveClasses = 'hidden md:block';
        break;
      case 'tablet':
        responsiveClasses = 'block md:hidden lg:block';
        break;
      case 'desktop':
        responsiveClasses = 'block lg:hidden';
        break;
      case 'mobile-tablet':
        responsiveClasses = 'hidden lg:block';
        break;
      case 'tablet-desktop':
        responsiveClasses = 'block md:hidden';
        break;
    }
  }

  return (
    <Component className={cn(responsiveClasses, className)} {...props}>
      {children}
    </Component>
  );
};

ResponsiveShow.displayName = 'ResponsiveShow';

// ===== ASPECT RATIO COMPONENT =====
const AspectRatio = React.forwardRef<HTMLDivElement, AspectRatioProps>(
  ({ className, ratio = '16:9', children, ...props }, ref) => {
    const ratioClasses = {
      '1:1': 'aspect-square',
      '4:3': 'aspect-[4/3]',
      '16:9': 'aspect-video',
      '21:9': 'aspect-[21/9]',
      '3:2': 'aspect-[3/2]',
      '2:3': 'aspect-[2/3]',
      'golden': 'aspect-[1.618/1]',
    };

    const aspectClass = typeof ratio === 'string' 
      ? ratioClasses[ratio] || 'aspect-video'
      : `aspect-[${ratio}]`;

    return (
      <div
        ref={ref}
        className={cn('relative overflow-hidden', aspectClass, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

AspectRatio.displayName = 'AspectRatio';

// ===== BREAKPOINT COMPONENT =====
const Breakpoint: React.FC<{
  at: keyof typeof breakpoints | 'up' | 'down';
  size?: keyof typeof breakpoints;
  children: React.ReactNode;
}> = ({ at, size, children }) => {
  const isClient = typeof window !== 'undefined';
  
  if (!isClient) {
    // Server-side: show content for mobile-first approach
    return <>{children}</>;
  }

  const breakpointValue = size ? breakpoints[size] : breakpoints.md;
  const mediaQuery = React.useMemo(() => {
    if (at === 'up') {
      return `(min-width: ${breakpointValue})`;
    } else if (at === 'down') {
      return `(max-width: ${breakpointValue})`;
    } else {
      return `(min-width: ${breakpoints[at]})`;
    }
  }, [at, breakpointValue]);

  const matches = useMediaQuery(mediaQuery);

  if (at === 'up' || (typeof at === 'string' && at in breakpoints)) {
    return matches ? <>{children}</> : null;
  }

  if (at === 'down') {
    return !matches ? <>{children}</> : null;
  }

  return <>{children}</>;
};

Breakpoint.displayName = 'Breakpoint';

// ===== RESPONSIVE IMAGE COMPONENT =====
export interface ResponsiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Image sources for different screen sizes */
  sources?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  /** Aspect ratio to maintain */
  aspectRatio?: AspectRatioProps['ratio'];
  /** Enable lazy loading */
  lazy?: boolean;
  /** Fallback image */
  fallback?: string;
}

const ResponsiveImage = React.forwardRef<HTMLImageElement, ResponsiveImageProps>(
  ({ 
    className, 
    sources, 
    aspectRatio, 
    lazy = true, 
    fallback, 
    alt,
    src,
    ...props 
  }, ref) => {
    const [currentSrc, setCurrentSrc] = React.useState(src);
    const [hasError, setHasError] = React.useState(false);
    
    const isMobile = useMediaQuery(`(max-width: ${breakpoints.md})`);
    const isTablet = useMediaQuery(`(min-width: ${breakpoints.md}) and (max-width: ${breakpoints.lg})`);
    
    React.useEffect(() => {
      if (sources) {
        if (isMobile && sources.mobile) {
          setCurrentSrc(sources.mobile);
        } else if (isTablet && sources.tablet) {
          setCurrentSrc(sources.tablet);
        } else if (sources.desktop) {
          setCurrentSrc(sources.desktop);
        }
      }
    }, [isMobile, isTablet, sources]);

    const handleError = () => {
      if (fallback && !hasError) {
        setCurrentSrc(fallback);
        setHasError(true);
      }
    };

    const imageElement = (
      <img
        ref={ref}
        src={currentSrc || src}
        alt={alt}
        loading={lazy ? 'lazy' : 'eager'}
        onError={handleError}
        className={cn('w-full h-full object-cover', className)}
        {...props}
      />
    );

    if (aspectRatio) {
      return (
        <AspectRatio ratio={aspectRatio}>
          {imageElement}
        </AspectRatio>
      );
    }

    return imageElement;
  }
);

ResponsiveImage.displayName = 'ResponsiveImage';

// ===== RESPONSIVE VIDEO COMPONENT =====
export interface ResponsiveVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  /** Video sources for different screen sizes */
  sources?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  /** Aspect ratio to maintain */
  aspectRatio?: AspectRatioProps['ratio'];
  /** Poster image sources */
  posterSources?: ResponsiveImageProps['sources'];
}

const ResponsiveVideo = React.forwardRef<HTMLVideoElement, ResponsiveVideoProps>(
  ({ 
    className, 
    sources, 
    aspectRatio = '16:9', 
    posterSources,
    poster,
    src,
    ...props 
  }, ref) => {
    const [currentSrc, setCurrentSrc] = React.useState(src);
    const [currentPoster, setCurrentPoster] = React.useState(poster);
    
    const isMobile = useMediaQuery(`(max-width: ${breakpoints.md})`);
    const isTablet = useMediaQuery(`(min-width: ${breakpoints.md}) and (max-width: ${breakpoints.lg})`);
    
    React.useEffect(() => {
      if (sources) {
        if (isMobile && sources.mobile) {
          setCurrentSrc(sources.mobile);
        } else if (isTablet && sources.tablet) {
          setCurrentSrc(sources.tablet);
        } else if (sources.desktop) {
          setCurrentSrc(sources.desktop);
        }
      }
      
      if (posterSources) {
        if (isMobile && posterSources.mobile) {
          setCurrentPoster(posterSources.mobile);
        } else if (isTablet && posterSources.tablet) {
          setCurrentPoster(posterSources.tablet);
        } else if (posterSources.desktop) {
          setCurrentPoster(posterSources.desktop);
        }
      }
    }, [isMobile, isTablet, sources, posterSources]);

    const videoElement = (
      <video
        ref={ref}
        src={currentSrc || src}
        poster={currentPoster || poster}
        className={cn('w-full h-full object-cover', className)}
        {...props}
      />
    );

    if (aspectRatio) {
      return (
        <AspectRatio ratio={aspectRatio}>
          {videoElement}
        </AspectRatio>
      );
    }

    return videoElement;
  }
);

ResponsiveVideo.displayName = 'ResponsiveVideo';

// ===== LAYOUT UTILITY HOOKS =====
export const useResponsive = () => {
  const isMobile = useMediaQuery(`(max-width: ${breakpoints.md})`);
  const isTablet = useMediaQuery(`(min-width: ${breakpoints.md}) and (max-width: ${breakpoints.lg})`);
  const isDesktop = useMediaQuery(`(min-width: ${breakpoints.lg})`);
  const isLargeDesktop = useMediaQuery(`(min-width: ${breakpoints.xl})`);
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    isTouch: isMobile || isTablet,
    breakpoint: isMobile ? 'mobile' : isTablet ? 'tablet' : isDesktop ? 'desktop' : 'xl',
  };
};

export const useBreakpoint = (breakpoint: keyof typeof breakpoints) => {
  return useMediaQuery(`(min-width: ${breakpoints[breakpoint]})`);
};

// ===== EXPORTS =====
export {
  Container,
  Grid,
  Flex,
  Stack,
  ResponsiveShow,
  AspectRatio,
  Breakpoint,
  ResponsiveImage,
  ResponsiveVideo,
  containerVariants,
  gridVariants,
  flexVariants,
  stackVariants,
};

export type {
  ContainerProps,
  GridProps,
  FlexProps,
  StackProps,
  ResponsiveShowProps,
  AspectRatioProps,
  ResponsiveImageProps,
  ResponsiveVideoProps,
};