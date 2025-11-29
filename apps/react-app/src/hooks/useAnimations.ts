/**
 * CRYB Design System - Animation Hooks
 * Custom hooks for managing animations and gestures
 */

import React from 'react';
import { 
  useAnimation, 
  useMotionValue, 
  useTransform, 
  useSpring,
  MotionValue,
  AnimationControls,
  useMotionValueEvent,
  useScroll,
  useInView,
} from 'framer-motion';
import { usePrefersReducedMotion } from '../lib/accessibility';

// ===== ANIMATION CONTROL HOOKS =====

/**
 * Enhanced animation controls with reduced motion support
 */
export const useAnimationControls = () => {
  const controls = useAnimation();
  const prefersReducedMotion = usePrefersReducedMotion();

  const safeAnimate = React.useCallback(
    (variants: any, options?: any) => {
      if (prefersReducedMotion) {
        // Instantly show the end state for reduced motion
        return controls.set(variants);
      }
      return controls.start(variants, options);
    },
    [controls, prefersReducedMotion]
  );

  return {
    ...controls,
    animate: safeAnimate,
    prefersReducedMotion,
  };
};

// ===== GESTURE HOOKS =====

/**
 * Enhanced hover detection with touch support
 */
export const useHover = () => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isTouched, setIsTouched] = React.useState(false);

  const handlers = React.useMemo(
    () => ({
      onHoverStart: () => setIsHovered(true),
      onHoverEnd: () => setIsHovered(false),
      onTouchStart: () => setIsTouched(true),
      onTouchEnd: () => setIsTouched(false),
    }),
    []
  );

  return {
    isHovered: isHovered || isTouched,
    isActuallyHovered: isHovered,
    isTouched,
    handlers,
  };
};

/**
 * Long press gesture hook
 */
export const useLongPress = (
  callback: () => void,
  duration: number = 500
) => {
  const timeoutRef = React.useRef<NodeJS.Timeout>();
  const isPressed = React.useRef(false);

  const start = React.useCallback(() => {
    isPressed.current = true;
    timeoutRef.current = setTimeout(() => {
      if (isPressed.current) {
        callback();
      }
    }, duration);
  }, [callback, duration]);

  const cancel = React.useCallback(() => {
    isPressed.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    onTouchStart: start,
    onTouchEnd: cancel,
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
  };
};

// ===== SCROLL ANIMATIONS =====

/**
 * Scroll-triggered animations
 */
export const useScrollAnimation = (threshold: number = 0.1) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { amount: threshold });
  const controls = useAnimationControls();

  React.useEffect(() => {
    if (isInView) {
      controls.animate('visible');
    } else {
      controls.animate('hidden');
    }
  }, [isInView, controls]);

  return { ref, controls, isInView };
};

/**
 * Parallax scroll effect
 */
export const useParallax = (multiplier: number = 0.5) => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, -1000 * multiplier]);
  
  return y;
};

/**
 * Scroll progress indicator
 */
export const useScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return { scrollYProgress, scaleX };
};

// ===== STAGGER ANIMATIONS =====

/**
 * Stagger children animations
 */
export const useStaggerChildren = (
  count: number,
  delay: number = 0.1,
  autoStart: boolean = true
) => {
  const controls = useAnimationControls();

  const animateChildren = React.useCallback(
    async (variant: string = 'visible') => {
      const promises = Array.from({ length: count }, (_, i) =>
        controls.animate(variant, { delay: i * delay })
      );
      return Promise.all(promises);
    },
    [controls, count, delay]
  );

  React.useEffect(() => {
    if (autoStart) {
      animateChildren();
    }
  }, [animateChildren, autoStart]);

  return { controls, animateChildren };
};

// ===== PHYSICS ANIMATIONS =====

/**
 * Spring physics hook
 */
export const useSpringPhysics = (
  target: number,
  options?: Parameters<typeof useSpring>[1]
) => {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, {
    stiffness: 300,
    damping: 30,
    ...options,
  });

  React.useEffect(() => {
    motionValue.set(target);
  }, [motionValue, target]);

  return spring;
};

/**
 * Drag physics with constraints
 */
export const useDragPhysics = (
  constraints?: { left?: number; right?: number; top?: number; bottom?: number }
) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const resetPosition = React.useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return {
    x,
    y,
    resetPosition,
    dragConstraints: constraints,
    dragElastic: 0.2,
    dragTransition: {
      bounceStiffness: 300,
      bounceDamping: 40,
    },
  };
};

// ===== MICRO-INTERACTIONS =====

/**
 * Button press feedback
 */
export const useButtonPress = () => {
  const scale = useMotionValue(1);
  const [isPressed, setIsPressed] = React.useState(false);

  const handlePress = React.useCallback(() => {
    setIsPressed(true);
    scale.set(0.95);
  }, [scale]);

  const handleRelease = React.useCallback(() => {
    setIsPressed(false);
    scale.set(1);
  }, [scale]);

  return {
    scale,
    isPressed,
    onTapStart: handlePress,
    onTap: handleRelease,
    onTapCancel: handleRelease,
  };
};

/**
 * Loading pulse animation
 */
export const useLoadingPulse = (isLoading: boolean) => {
  const controls = useAnimationControls();

  React.useEffect(() => {
    if (isLoading) {
      controls.animate('pulse');
    } else {
      controls.stop();
      controls.animate('rest');
    }
  }, [isLoading, controls]);

  return controls;
};

/**
 * Success checkmark animation
 */
export const useSuccessAnimation = () => {
  const pathLength = useMotionValue(0);
  const opacity = useMotionValue(0);

  const animate = React.useCallback(async () => {
    opacity.set(1);
    await pathLength.set(1);
  }, [pathLength, opacity]);

  const reset = React.useCallback(() => {
    pathLength.set(0);
    opacity.set(0);
  }, [pathLength, opacity]);

  return {
    pathLength,
    opacity,
    animate,
    reset,
  };
};

// ===== LAYOUT ANIMATIONS =====

/**
 * Auto-height animation for collapsible content
 */
export const useAutoHeight = (isOpen: boolean) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const height = useMotionValue(0);

  React.useEffect(() => {
    if (ref.current) {
      const element = ref.current;
      if (isOpen) {
        height.set(element.scrollHeight);
      } else {
        height.set(0);
      }
    }
  }, [isOpen, height]);

  return {
    ref,
    height,
    overflow: 'hidden' as const,
  };
};

/**
 * Shared layout transitions
 */
export const useSharedLayout = (layoutId: string) => {
  return {
    layoutId,
    layout: true,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  };
};

// ===== NOTIFICATION ANIMATIONS =====

/**
 * Toast notification animation
 */
export const useToastAnimation = (isVisible: boolean) => {
  const y = useMotionValue(-100);
  const opacity = useMotionValue(0);

  React.useEffect(() => {
    if (isVisible) {
      y.set(0);
      opacity.set(1);
    } else {
      y.set(-100);
      opacity.set(0);
    }
  }, [isVisible, y, opacity]);

  return { y, opacity };
};

// ===== PERFORMANCE OPTIMIZATIONS =====

/**
 * RAF (RequestAnimationFrame) hook for smooth animations
 */
export const useRAF = (callback: (time: number) => void, deps: React.DependencyList) => {
  const rafRef = React.useRef<number>();

  const animate = React.useCallback(
    (time: number) => {
      callback(time);
      rafRef.current = requestAnimationFrame(animate);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
  );

  React.useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [animate]);
};

/**
 * Optimized motion value for performance
 */
export const useOptimizedMotionValue = (initialValue: number) => {
  const motionValue = React.useMemo(
    () => useMotionValue(initialValue),
    [initialValue]
  );

  return motionValue;
};

// ===== GESTURE RECOGNITION =====

/**
 * Swipe gesture detection
 */
export const useSwipeGesture = (
  onSwipe: (direction: 'left' | 'right' | 'up' | 'down') => void,
  threshold: number = 50
) => {
  const [startPos, setStartPos] = React.useState<{ x: number; y: number } | null>(null);

  const handlePanStart = React.useCallback((event: any, info: any) => {
    setStartPos({ x: info.point.x, y: info.point.y });
  }, []);

  const handlePanEnd = React.useCallback(
    (event: any, info: any) => {
      if (!startPos) return;

      const deltaX = info.point.x - startPos.x;
      const deltaY = info.point.y - startPos.y;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > threshold) {
          onSwipe(deltaX > 0 ? 'right' : 'left');
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) > threshold) {
          onSwipe(deltaY > 0 ? 'down' : 'up');
        }
      }

      setStartPos(null);
    },
    [startPos, threshold, onSwipe]
  );

  return {
    onPanStart: handlePanStart,
    onPanEnd: handlePanEnd,
  };
};

// ===== EXPORTS =====
export default {
  useAnimationControls,
  useHover,
  useLongPress,
  useScrollAnimation,
  useParallax,
  useScrollProgress,
  useStaggerChildren,
  useSpringPhysics,
  useDragPhysics,
  useButtonPress,
  useLoadingPulse,
  useSuccessAnimation,
  useAutoHeight,
  useSharedLayout,
  useToastAnimation,
  useRAF,
  useOptimizedMotionValue,
  useSwipeGesture,
};