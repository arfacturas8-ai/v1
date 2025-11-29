import { useEffect, useState, useCallback } from 'react';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

/**
 * Custom hooks for animations
 * Optimized for performance and reduced motion preferences
 */

// Check if user prefers reduced motion
export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

// Animate elements when they enter viewport
export function useScrollAnimation(options = {}) {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: options.once !== false,
    margin: options.margin || '-100px',
    amount: options.amount || 0.3,
  });

  return { ref, isInView };
}

// Stagger animation for lists
export function useStaggerAnimation(itemCount, delay = 0.1) {
  const [visibleItems, setVisibleItems] = useState(0);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      setVisibleItems(itemCount);
      return;
    }

    let currentItem = 0;
    const interval = setInterval(() => {
      currentItem++;
      setVisibleItems(currentItem);
      if (currentItem >= itemCount) {
        clearInterval(interval);
      }
    }, delay * 1000);

    return () => clearInterval(interval);
  }, [itemCount, delay, prefersReducedMotion]);

  return visibleItems;
}

// Loading state with minimum display time
export function useLoadingState(isLoading, minDisplayTime = 500) {
  const [showLoading, setShowLoading] = useState(isLoading);
  const loadingStartTime = useRef(null);

  useEffect(() => {
    if (isLoading) {
      loadingStartTime.current = Date.now();
      setShowLoading(true);
    } else if (loadingStartTime.current) {
      const elapsedTime = Date.now() - loadingStartTime.current;
      const remainingTime = Math.max(0, minDisplayTime - elapsedTime);

      setTimeout(() => {
        setShowLoading(false);
        loadingStartTime.current = null;
      }, remainingTime);
    }
  }, [isLoading, minDisplayTime]);

  return showLoading;
}

// Page transition state
export function usePageTransition() {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const startTransition = useCallback(() => {
    setIsTransitioning(true);
  }, []);

  const endTransition = useCallback(() => {
    setIsTransitioning(false);
  }, []);

  return { isTransitioning, startTransition, endTransition };
}

// Intersection observer for infinite scroll
export function useInfiniteScroll(callback, options = {}) {
  const targetRef = useRef(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && callback) {
          callback();
        }
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '100px',
      }
    );

    const currentTarget = targetRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [callback, options.threshold, options.rootMargin]);

  return { targetRef, isIntersecting };
}

// Optimized animation variants based on reduced motion preference
export function useAnimationVariants(variants) {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) {
    // Return simplified variants with no motion
    return {
      hidden: { opacity: 0 },
      show: { opacity: 1 },
      exit: { opacity: 0 },
    };
  }

  return variants;
}

// Sequential reveal animation
export function useSequentialReveal(items, delay = 100) {
  const [revealedIndices, setRevealedIndices] = useState(new Set());
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      setRevealedIndices(new Set(items.map((_, i) => i)));
      return;
    }

    items.forEach((_, index) => {
      setTimeout(() => {
        setRevealedIndices((prev) => new Set([...prev, index]));
      }, index * delay);
    });
  }, [items, delay, prefersReducedMotion]);

  const isRevealed = useCallback(
    (index) => revealedIndices.has(index),
    [revealedIndices]
  );

  return isRevealed;
}

// Hover state with animation
export function useHoverAnimation() {
  const [isHovered, setIsHovered] = useState(false);

  const bind = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  };

  return { isHovered, bind };
}

// Scroll progress
export function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollTop = window.pageYOffset;
      const progress = (scrollTop / scrollHeight) * 100;
      setProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return progress;
}

// Debounced animation trigger
export function useDebouncedAnimation(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Animation queue for sequential animations
export function useAnimationQueue(animations) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const next = useCallback(() => {
    if (currentIndex < animations.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsComplete(true);
    }
  }, [currentIndex, animations.length]);

  const reset = useCallback(() => {
    setCurrentIndex(0);
    setIsComplete(false);
  }, []);

  return {
    current: animations[currentIndex],
    currentIndex,
    next,
    reset,
    isComplete,
  };
}

// Performance-aware animations
export function usePerformanceMode() {
  const [isLowPerformance, setIsLowPerformance] = useState(false);

  useEffect(() => {
    // Check device memory
    const memory = navigator.deviceMemory;
    if (memory && memory < 4) {
      setIsLowPerformance(true);
    }

    // Check hardware concurrency
    const cores = navigator.hardwareConcurrency;
    if (cores && cores < 4) {
      setIsLowPerformance(true);
    }

    // Check if on mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      setIsLowPerformance(true);
    }
  }, []);

  return isLowPerformance;
}

// Gesture-based animations
export function useSwipeAnimation(onSwipeLeft, onSwipeRight, threshold = 50) {
  const [startX, setStartX] = useState(0);

  const handleTouchStart = useCallback((e) => {
    setStartX(e.touches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(
    (e) => {
      const endX = e.changedTouches[0].clientX;
      const diff = startX - endX;

      if (Math.abs(diff) > threshold) {
        if (diff > 0) {
          onSwipeLeft?.();
        } else {
          onSwipeRight?.();
        }
      }
    },
    [startX, threshold, onSwipeLeft, onSwipeRight]
  );

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
}

export default {
  usePrefersReducedMotion,
  useScrollAnimation,
  useStaggerAnimation,
  useLoadingState,
  usePageTransition,
  useInfiniteScroll,
  useAnimationVariants,
  useSequentialReveal,
  useHoverAnimation,
  useScrollProgress,
  useDebouncedAnimation,
  useAnimationQueue,
  usePerformanceMode,
  useSwipeAnimation,
};
