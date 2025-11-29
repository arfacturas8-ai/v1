/**
 * Animation Utilities and Variants
 * Reusable Framer Motion animation configurations
 * Optimized for 60fps performance
 */

// Page transition variants
export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: 'easeInOut' },
};

export const pageSlideTransition = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: 0.3, ease: 'easeInOut' },
};

export const pageFadeTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

// Container animations with stagger
export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const staggerContainerFast = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0,
    },
  },
};

export const staggerContainerSlow = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

// Item animations
export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

export const fadeInDown = {
  hidden: { opacity: 0, y: -20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

export const fadeInLeft = {
  hidden: { opacity: 0, x: -20 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

export const fadeInRight = {
  hidden: { opacity: 0, x: 20 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

export const scaleInBounce = {
  hidden: { opacity: 0, scale: 0.8 },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 15,
    },
  },
};

// List animations
export const listItem = {
  hidden: { opacity: 0, x: -20 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
    },
  },
};

export const listItemVertical = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
};

// Modal/Dialog animations
export const modalBackdrop = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

export const modalContent = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.2 },
  },
};

export const slideUpModal = {
  hidden: { opacity: 0, y: '100%' },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    y: '100%',
    transition: { duration: 0.2 },
  },
};

// Card animations
export const cardHover = {
  rest: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
};

export const cardTap = {
  scale: 0.98,
  transition: { duration: 0.1 },
};

// Button animations
export const buttonHover = {
  scale: 1.05,
  transition: {
    duration: 0.2,
    ease: 'easeOut',
  },
};

export const buttonTap = {
  scale: 0.95,
  transition: { duration: 0.1 },
};

// Notification/Toast animations
export const toastSlideIn = {
  hidden: { opacity: 0, y: -100, scale: 0.8 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.2 },
  },
};

// Skeleton/Loading animations
export const shimmer = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      duration: 2,
      ease: 'linear',
      repeat: Infinity,
    },
  },
};

export const pulse = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Hover effects
export const hoverLift = {
  rest: { y: 0 },
  hover: {
    y: -4,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
};

export const hoverGlow = {
  rest: { boxShadow: '0 0 0 rgba(59, 130, 246, 0)' },
  hover: {
    boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

// Collapse/Expand animations
export const collapse = {
  collapsed: { height: 0, opacity: 0 },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: {
        duration: 0.3,
      },
      opacity: {
        duration: 0.25,
        delay: 0.1,
      },
    },
  },
};

// Mobile-specific animations
export const swipeableCard = {
  drag: 'x',
  dragConstraints: { left: 0, right: 0 },
  dragElastic: 0.2,
  onDragEnd: (event, info) => {
    if (info.offset.x > 100) {
      // Swipe right action
    } else if (info.offset.x < -100) {
      // Swipe left action
    }
  },
};

// Spring configurations
export const springConfigs = {
  gentle: {
    type: 'spring',
    stiffness: 100,
    damping: 20,
  },
  bouncy: {
    type: 'spring',
    stiffness: 300,
    damping: 15,
  },
  stiff: {
    type: 'spring',
    stiffness: 500,
    damping: 30,
  },
  slow: {
    type: 'spring',
    stiffness: 50,
    damping: 20,
  },
};

// Easing functions
export const easings = {
  easeInOut: [0.25, 0.46, 0.45, 0.94],
  easeOut: [0, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  sharp: [0.4, 0, 0.6, 1],
  spring: [0.25, 0.46, 0.45, 0.94],
};

// Layout shift prevention
export const layoutTransition = {
  layout: true,
  transition: {
    duration: 0.3,
    ease: 'easeInOut',
  },
};

// Infinite animations
export const rotate360 = {
  animate: {
    rotate: 360,
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

export const float = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const breathe = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};
