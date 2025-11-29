/**
 * CRYB Design System - Animation and Motion Utilities
 * Comprehensive animation system with Framer Motion integration
 */

import { Variants, Transition, MotionProps } from 'framer-motion';

// ===== ANIMATION PRESETS =====

/**
 * Standard easing curves for consistent motion
 */
export const easings = {
  easeInOut: [0.4, 0, 0.2, 1],
  easeOut: [0, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  sharp: [0.4, 0, 0.6, 1],
  standard: [0.4, 0, 0.2, 1],
  decelerated: [0, 0, 0.2, 1],
  accelerated: [0.4, 0, 1, 1],
} as const;

/**
 * Duration presets for different interaction types
 */
export const durations = {
  instant: 0,
  fast: 0.15,
  normal: 0.25,
  slow: 0.35,
  slower: 0.5,
  slowest: 0.75,
} as const;

/**
 * Spring configuration presets
 */
export const springs = {
  gentle: {
    type: 'spring' as const,
    stiffness: 120,
    damping: 14,
    mass: 1,
  },
  bouncy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 17,
    mass: 1,
  },
  snappy: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
    mass: 1,
  },
  wobbly: {
    type: 'spring' as const,
    stiffness: 180,
    damping: 12,
    mass: 1,
  },
} as const;

// ===== COMMON ANIMATION VARIANTS =====

/**
 * Fade animations
 */
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

/**
 * Scale animations
 */
export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
};

/**
 * Slide animations
 */
export const slideVariants = {
  up: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  down: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  left: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  right: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
} as const;

/**
 * Rotation animations
 */
export const rotateVariants: Variants = {
  hidden: { opacity: 0, rotate: -10 },
  visible: { opacity: 1, rotate: 0 },
  exit: { opacity: 0, rotate: 10 },
};

/**
 * Flip animations
 */
export const flipVariants: Variants = {
  hidden: { opacity: 0, rotateY: -90 },
  visible: { opacity: 1, rotateY: 0 },
  exit: { opacity: 0, rotateY: 90 },
};

// ===== STAGGER ANIMATIONS =====

/**
 * Stagger container variants
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

/**
 * Stagger item variants
 */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

// ===== GESTURE ANIMATIONS =====

/**
 * Hover scale variants
 */
export const hoverScale: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
};

/**
 * Button press variants
 */
export const buttonPress: Variants = {
  rest: { scale: 1 },
  tap: { scale: 0.98 },
};

/**
 * Card hover variants
 */
export const cardHover: Variants = {
  rest: { 
    scale: 1,
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  },
  hover: { 
    scale: 1.02,
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    transition: { duration: 0.2 },
  },
};

// ===== LOADING ANIMATIONS =====

/**
 * Pulse animation
 */
export const pulseVariants: Variants = {
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Bounce animation
 */
export const bounceVariants: Variants = {
  bounce: {
    y: [0, -10, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Spin animation
 */
export const spinVariants: Variants = {
  spin: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

// ===== NOTIFICATION ANIMATIONS =====

/**
 * Toast animation variants
 */
export const toastVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: -50, 
    scale: 0.3,
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30,
    },
  },
  exit: { 
    opacity: 0,
    y: -50,
    scale: 0.5,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * Notification slide variants
 */
export const notificationSlide: Variants = {
  hidden: { x: '100%', opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: { 
    x: '100%', 
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

// ===== MODAL ANIMATIONS =====

/**
 * Modal backdrop variants
 */
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

/**
 * Modal content variants
 */
export const modalVariants: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8,
    y: 20,
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: { 
    opacity: 0, 
    scale: 0.8,
    y: 20,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * Drawer variants
 */
export const drawerVariants = {
  bottom: {
    hidden: { y: '100%' },
    visible: { y: 0 },
    exit: { y: '100%' },
  },
  top: {
    hidden: { y: '-100%' },
    visible: { y: 0 },
    exit: { y: '-100%' },
  },
  left: {
    hidden: { x: '-100%' },
    visible: { x: 0 },
    exit: { x: '-100%' },
  },
  right: {
    hidden: { x: '100%' },
    visible: { x: 0 },
    exit: { x: '100%' },
  },
} as const;

// ===== PAGE TRANSITIONS =====

/**
 * Page transition variants
 */
export const pageVariants: Variants = {
  initial: { opacity: 0, x: 20 },
  enter: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.3,
      ease: easings.easeOut,
    },
  },
  exit: { 
    opacity: 0, 
    x: -20,
    transition: {
      duration: 0.2,
      ease: easings.easeIn,
    },
  },
};

// ===== MICRO-INTERACTIONS =====

/**
 * Icon animation variants
 */
export const iconVariants: Variants = {
  rest: { scale: 1, rotate: 0 },
  hover: { scale: 1.1 },
  tap: { scale: 0.9 },
  spin: { 
    rotate: 360,
    transition: { duration: 0.5 },
  },
};

/**
 * Heart like animation
 */
export const heartLikeVariants: Variants = {
  rest: { scale: 1 },
  liked: { 
    scale: [1, 1.3, 1.1],
    transition: {
      duration: 0.4,
      ease: easings.easeOut,
    },
  },
};

/**
 * Badge animation variants
 */
export const badgeVariants: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 15,
    },
  },
  pulse: {
    scale: [1, 1.2, 1],
    transition: {
      duration: 0.6,
      repeat: Infinity,
    },
  },
};

// ===== LAYOUT ANIMATIONS =====

/**
 * Accordion variants
 */
export const accordionVariants: Variants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: { 
    height: 'auto', 
    opacity: 1,
    transition: {
      height: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
      opacity: {
        duration: 0.2,
      },
    },
  },
};

/**
 * Tabs content variants
 */
export const tabContentVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.2,
    },
  },
};

// ===== TRANSITION PRESETS =====

/**
 * Common transition configurations
 */
export const transitions = {
  default: {
    duration: durations.normal,
    ease: easings.easeInOut,
  },
  spring: springs.gentle,
  fast: {
    duration: durations.fast,
    ease: easings.easeOut,
  },
  slow: {
    duration: durations.slow,
    ease: easings.easeInOut,
  },
  bounce: springs.bouncy,
} as const;

// ===== GESTURE CONFIGURATIONS =====

/**
 * Drag constraints
 */
export const dragConstraints = {
  horizontal: { left: 0, right: 0 },
  vertical: { top: 0, bottom: 0 },
  all: { left: 0, right: 0, top: 0, bottom: 0 },
} as const;

/**
 * Swipe configurations
 */
export const swipeConfidenceThreshold = 10000;
export const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

// ===== ANIMATION UTILITIES =====

/**
 * Create stagger delay
 */
export const createStaggerDelay = (index: number, baseDelay = 0.1) => ({
  delay: index * baseDelay,
});

/**
 * Create responsive animation
 */
export const createResponsiveAnimation = (
  mobile: Variants,
  desktop: Variants,
  isMobile: boolean
) => (isMobile ? mobile : desktop);

/**
 * Create reduced motion variant
 */
export const createReducedMotionVariant = (
  normalVariant: Variants,
  reducedVariant: Variants,
  prefersReducedMotion: boolean
) => (prefersReducedMotion ? reducedVariant : normalVariant);

// ===== ANIMATION HOOKS TYPES =====

export interface AnimationConfig {
  variant?: keyof typeof slideVariants | 'fade' | 'scale' | 'rotate' | 'flip';
  duration?: keyof typeof durations | number;
  easing?: keyof typeof easings | number[];
  delay?: number;
  spring?: keyof typeof springs | Transition;
}

export interface GestureConfig {
  hover?: boolean;
  tap?: boolean;
  drag?: boolean;
  swipe?: boolean;
  constraints?: typeof dragConstraints[keyof typeof dragConstraints];
}

// ===== EXPORTS =====
export default {
  easings,
  durations,
  springs,
  fadeVariants,
  scaleVariants,
  slideVariants,
  rotateVariants,
  flipVariants,
  staggerContainer,
  staggerItem,
  hoverScale,
  buttonPress,
  cardHover,
  pulseVariants,
  bounceVariants,
  spinVariants,
  toastVariants,
  notificationSlide,
  backdropVariants,
  modalVariants,
  drawerVariants,
  pageVariants,
  iconVariants,
  heartLikeVariants,
  badgeVariants,
  accordionVariants,
  tabContentVariants,
  transitions,
  dragConstraints,
  swipeConfidenceThreshold,
  swipePower,
  createStaggerDelay,
  createResponsiveAnimation,
  createReducedMotionVariant,
};