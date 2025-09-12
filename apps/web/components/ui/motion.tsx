"use client";

import * as React from "react";
import { motion, type HTMLMotionProps, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

// Common animation variants
export const fadeIn: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const slideIn: Variants = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 30 },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const slideUp: Variants = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -40 },
};

export const slideDown: Variants = {
  initial: { opacity: 0, y: -40 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 40 },
};

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

// Preset animation configurations
export const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

export const easeTransition = {
  duration: 0.3,
  ease: [0.22, 1, 0.36, 1] as const,
};

export const bounceTransition = {
  type: "spring" as const,
  stiffness: 500,
  damping: 20,
};

// Animated components
interface AnimatedDivProps extends HTMLMotionProps<"div"> {
  variant?: keyof typeof animationPresets;
}

const animationPresets = {
  fadeIn,
  slideIn,
  scaleIn,
  slideUp,
  slideDown,
} as const;

export const AnimatedDiv = React.forwardRef<HTMLDivElement, AnimatedDivProps>(
  ({ variant = "fadeIn", className, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        variants={animationPresets[variant]}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={easeTransition}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
AnimatedDiv.displayName = "AnimatedDiv";

// Stagger container for animating lists
export const StaggerContainer = React.forwardRef<
  HTMLDivElement,
  HTMLMotionProps<"div">
>(({ className, children, ...props }, ref) => {
  return (
    <motion.div
      ref={ref}
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
});
StaggerContainer.displayName = "StaggerContainer";

// Stagger item for individual items in a stagger container
export const StaggerItem = React.forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ className, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        variants={staggerItem}
        transition={easeTransition}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
StaggerItem.displayName = "StaggerItem";

// Pressable component with scale animation
export const Pressable = React.forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ className, children, whileTap, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileTap={{ scale: 0.95, ...whileTap }}
        transition={springTransition}
        className={cn("cursor-pointer", className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
Pressable.displayName = "Pressable";

// Hover scale component
export const HoverScale = React.forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ className, children, whileHover, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={{ scale: 1.05, ...whileHover }}
        transition={springTransition}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
HoverScale.displayName = "HoverScale";

// Magnetic hover effect
export const MagneticHover = React.forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ className, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={{ scale: 1.02, rotateX: 5, rotateY: 5 }}
        transition={springTransition}
        className={cn("transform-gpu", className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
MagneticHover.displayName = "MagneticHover";

// Floating animation component
export const FloatingElement = React.forwardRef<
  HTMLDivElement,
  HTMLMotionProps<"div"> & { duration?: number }
>(({ className, children, duration = 3, ...props }, ref) => {
  return (
    <motion.div
      ref={ref}
      animate={{
        y: [0, -10, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
});
FloatingElement.displayName = "FloatingElement";

// Glow pulse animation
export const GlowPulse = React.forwardRef<
  HTMLDivElement,
  HTMLMotionProps<"div"> & { color?: string }
>(({ className, children, color = "rgba(0, 82, 255, 0.5)", ...props }, ref) => {
  return (
    <motion.div
      ref={ref}
      animate={{
        boxShadow: [
          `0 0 0 0 ${color}`,
          `0 0 20px 10px transparent`,
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
});
GlowPulse.displayName = "GlowPulse";

// Text reveal animation
export const TextReveal = React.forwardRef<
  HTMLDivElement,
  HTMLMotionProps<"div"> & { text: string; delay?: number }
>(({ className, text, delay = 0, ...props }, ref) => {
  const letters = text.split("");

  return (
    <motion.div
      ref={ref}
      className={cn("inline-block", className)}
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      transition={{ delay }}
      {...props}
    >
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          variants={{
            initial: { opacity: 0, y: 50 },
            animate: { opacity: 1, y: 0 },
          }}
          className="inline-block"
        >
          {letter === " " ? "\u00A0" : letter}
        </motion.span>
      ))}
    </motion.div>
  );
});
TextReveal.displayName = "TextReveal";