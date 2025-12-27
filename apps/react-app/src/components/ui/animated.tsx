/**
 * CRYB Design System - Animated Components
 * Reusable animated components with Framer Motion
 */

import React from 'react';
import { cn } from '../../lib/utils';
import {
  fadeVariants,
  scaleVariants,
  slideVariants,
  staggerContainer,
  staggerItem,
  hoverScale,
  cardHover,
  buttonPress,
  modalVariants,
  backdropVariants,
  toastVariants,
  bounceVariants,
  spinVariants,
  transitions,
} from '../../lib/animations';
import { useAnimationControls, useHover, useScrollAnimation } from '../../hooks/useAnimations';

// ===== BASIC ANIMATED COMPONENTS =====

export interface AnimatedDivProps extends MotionProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'fade' | 'scale' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight';
  duration?: number;
  delay?: number;
}

export const AnimatedDiv: React.FC<AnimatedDivProps> = ({
  children,
  className,
  variant = 'fade',
  duration = 0.25,
  delay = 0,
  ...props
}) => {
  const getVariants = (): Variants => {
    switch (variant) {
      case 'scale':
        return scaleVariants;
      case 'slideUp':
        return slideVariants.up;
      case 'slideDown':
        return slideVariants.down;
      case 'slideLeft':
        return slideVariants.left;
      case 'slideRight':
        return slideVariants.right;
      default:
        return fadeVariants;
    }
  };

  return (
    <div
      className={className}
      initial="hidden"
      animate="visible"
      exit="exit"}
      {...props}
    >
      {children}
    </div>
  );
};

// ===== INTERACTIVE COMPONENTS =====

export interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'scale' | 'press' | 'hover';
  isLoading?: boolean;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  className,
  variant = 'press',
  isLoading = false,
  disabled,
  ...props
}) => {
  const { isHovered, handlers } = useHover();

  const getVariants = (): Variants => {
    switch (variant) {
      case 'scale':
        return hoverScale;
      case 'hover':
        return {
          rest: { scale: 1 },
          hover: { scale: 1.02 },
        };
      default:
        return buttonPress;
    }
  };

  return (
    <button
      className={cn('relative overflow-hidden', className)}
      initial="rest"
      disabled={disabled || isLoading}
      {...handlers}
      {...props}
    >
      
        {isLoading ? (
          <div
            key="loading"
            animate="spin"
            style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}
          >
            <div style={{
  width: '16px',
  height: '16px',
  borderRadius: '50%'
}} />
          </div>
        ) : (
          <div key="content" initial="hidden" animate="visible">
            {children}
          </div>
        )}
      
    </button>
  );
};

// ===== CARD COMPONENTS =====

export interface AnimatedCardProps extends MotionProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className,
  hover = true,
  interactive = false,
  onClick,
  ...props
}) => {
  const { isHovered, handlers } = useHover();

  return (
    <div
      className={cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm',
        interactive && 'cursor-pointer',
        className
      )}
      initial="rest"
      onClick={onClick}
      {...(hover ? handlers : {})}
      {...props}
    >
      {children}
    </div>
  );
};

// ===== LAYOUT COMPONENTS =====

export interface StaggerContainerProps extends MotionProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  delayChildren?: number;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  className,
  staggerDelay = 0.1,
  delayChildren = 0.05,
  ...props
}) => {
  const customStaggerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren,
      },
    },
  };

  return (
    <div
      className={className}
      initial="hidden"
      animate="visible"
      {...props}
    >
      {children}
    </div>
  );
};

export interface StaggerItemProps extends MotionProps {
  children: React.ReactNode;
  className?: string;
  index?: number;
}

export const StaggerItem: React.FC<StaggerItemProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={className}
      {...props}
    >
      {children}
    </div>
  );
};

// ===== SCROLL ANIMATIONS =====

export interface ScrollAnimatedProps extends MotionProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'fade' | 'slideUp' | 'scale';
  threshold?: number;
  once?: boolean;
}

export const ScrollAnimated: React.FC<ScrollAnimatedProps> = ({
  children,
  className,
  variant = 'slideUp',
  threshold = 0.1,
  once = true,
  ...props
}) => {
  const { ref, controls } = useScrollAnimation(threshold);

  const getVariants = (): Variants => {
    switch (variant) {
      case 'fade':
        return fadeVariants;
      case 'scale':
        return scaleVariants;
      default:
        return slideVariants.up;
    }
  };

  return (
    <div
      ref={ref}
      className={className}
      initial="hidden"
      {...props}
    >
      {children}
    </div>
  );
};

// ===== MODAL COMPONENTS =====

export interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export const AnimatedModal: React.FC<AnimatedModalProps> = ({
  isOpen,
  onClose,
  children,
  className,
}) => {
  return (
    
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            style={{
  position: 'fixed'
}}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />
          
          {/* Modal content */}
          <div
            className={cn(
              'fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2',
              'bg-background border rounded-lg shadow-lg p-6',
              className
            )}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </div>
        </>
      )}
    
  );
};

// ===== NOTIFICATION COMPONENTS =====

export interface AnimatedToastProps {
  isVisible: boolean;
  children: React.ReactNode;
  className?: string;
  position?: 'top' | 'bottom';
}

export const AnimatedToast: React.FC<AnimatedToastProps> = ({
  isVisible,
  children,
  className,
  position = 'top',
}) => {
  const positionClasses = {
    top: 'top-4',
    bottom: 'bottom-4',
  };

  return (
    
      {isVisible && (
        <div
          className={cn(
            'fixed right-4 z-50 min-w-[300px] rounded-lg border bg-background p-4 shadow-lg',
            positionClasses[position],
            className
          )}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {children}
        </div>
      )}
    
  );
};

// ===== LOADING COMPONENTS =====

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div
      className={cn(
        'border-2 border-current border-t-transparent rounded-full',
        sizeClasses[size],
        className
      )}
      animate="spin"
    />
  );
};

export interface LoadingDotsProps {
  className?: string;
}

export const LoadingDots: React.FC<LoadingDotsProps> = ({ className }) => {
  return (
    <div className={cn('flex space-x-1', className)}>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          style={{
  width: '8px',
  height: '8px',
  borderRadius: '50%'
}}
          animate="bounce"}
        />
      ))}
    </div>
  );
};

// ===== TRANSITION COMPONENTS =====

export interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={className}
    >
      {children}
    </div>
  );
};

// ===== GESTURE COMPONENTS =====

export interface SwipeableProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  className?: string;
  threshold?: number;
}

export const Swipeable: React.FC<SwipeableProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  className,
  threshold = 50,
}) => {
  const handlePanEnd = (event: any, info: any) => {
    const { offset, velocity } = info;
    const swipe = Math.abs(offset.x * velocity.x) + Math.abs(offset.y * velocity.y);

    if (swipe < threshold) return;

    if (Math.abs(offset.x) > Math.abs(offset.y)) {
      // Horizontal swipe
      if (offset.x > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (offset.x < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    } else {
      // Vertical swipe
      if (offset.y > 0 && onSwipeDown) {
        onSwipeDown();
      } else if (offset.y < 0 && onSwipeUp) {
        onSwipeUp();
      }
    }
  };

  return (
    <div
      className={className}
      onPanEnd={handlePanEnd}
      style={{ touchAction: 'pan-y' }}
    >
      {children}
    </div>
  );
};

// ===== EXPORTS =====


const styles = {
  card: {
    background: 'rgba(20, 20, 20, 0.6)',
    backdropFilter: 'blur(12px)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    padding: '16px'
  },
  button: {
    background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
    border: 'none',
    borderRadius: '12px',
    color: '#ffffff',
    padding: '12px 24px',
    cursor: 'pointer',
    fontWeight: '600',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
  },
  container: {
    background: 'var(--bg-primary)',
    padding: '16px'
  },
  title: {
    color: '#ffffff',
    fontSize: '20px',
    fontWeight: '600',
    margin: '0 0 16px 0'
  },
  text: {
    color: '#A0A0A0',
    fontSize: '14px',
    margin: '0'
  },
  textTertiary: {
    color: '#666666',
    fontSize: '14px'
  }
}

export default {
  AnimatedDiv,
  AnimatedButton,
  AnimatedCard,
  StaggerContainer,
  StaggerItem,
  ScrollAnimated,
  AnimatedModal,
  AnimatedToast,
  LoadingSpinner,
  LoadingDots,
  PageTransition,
  Swipeable,
};