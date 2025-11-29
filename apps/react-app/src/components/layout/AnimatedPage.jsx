import React from 'react';
import { pageTransition, pageSlideTransition, pageFadeTransition } from '../../lib/animations';
import { usePrefersReducedMotion } from '../../hooks/useAnimations';

/**
 * AnimatedPage Component
 * Wrapper for pages with transition animations
 */

export function AnimatedPage({
  children,
  transition = 'fade',
  className = '',
  ...props
}) {
  const prefersReducedMotion = usePrefersReducedMotion();

  const transitions = {
    fade: pageFadeTransition,
    slide: pageSlideTransition,
    default: pageTransition,
  };

  const selectedTransition = prefersReducedMotion
    ? pageFadeTransition
    : transitions[transition] || pageTransition;

  return (
    <div
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}

export function AnimatedSection({
  children,
  delay = 0,
  className = '',
  ...props
}) {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className} {...props}>{children}</div>;
  }

  return (
    <div
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}

export function AnimatedList({
  children,
  stagger = 0.1,
  className = '',
  ...props
}) {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className} {...props}>{children}</div>;
  }

  return (
    <div
      className={className}
      initial="hidden"
      animate="show",
        show: {
          opacity: 1,
          transition: {
            staggerChildren: stagger,
          },
        },
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function AnimatedListItem({
  children,
  className = '',
  ...props
}) {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className} {...props}>{children}</div>;
  }

  return (
    <div
      className={className},
        show: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.3,
          },
        },
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function AnimatedCard({
  children,
  hover = true,
  className = '',
  ...props
}) {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion || !hover) {
    return (
      <div
        className={className}}}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={className}}},
      }}}
      {...props}
    >
      {children}
    </div>
  );
}

export function FadeIn({
  children,
  delay = 0,
  duration = 0.5,
  className = '',
}) {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={className}
    >
      {children}
    </div>
  );
}

export function SlideIn({
  children,
  direction = 'up',
  delay = 0,
  className = '',
}) {
  const prefersReducedMotion = usePrefersReducedMotion();

  const directions = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: 20 },
    right: { x: -20 },
  };

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={className}
    >
      {children}
    </div>
  );
}

export function ScaleIn({
  children,
  delay = 0,
  className = '',
}) {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={className}
    >
      {children}
    </div>
  );
}

export function StaggerChildren({
  children,
  stagger = 0.1,
  className = '',
}) {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={className}
      initial="hidden"
      animate="visible",
        },
      }}
    >
      {children}
    </div>
  );
}



export default AnimatedPage;
