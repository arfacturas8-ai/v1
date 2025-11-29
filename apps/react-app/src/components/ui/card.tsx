/**
 * CRYB Design System - Card Component
 * Modern OpenSea-inspired cards with glass, gradient, and interactive variants
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// ===== CARD VARIANTS =====
const cardVariants = cva(
  [
    'rounded-lg transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  ],
  {
    variants: {
      variant: {
        default: [
          'border bg-card text-card-foreground shadow-sm',
          'hover:shadow-md',
        ],
        glass: [
          'bg-background/80 backdrop-blur-md border border-border/50',
          'shadow-lg hover:bg-background/90 hover:border-border/70',
          'hover:shadow-xl',
        ],
        gradient: [
          'bg-gradient-to-br from-primary/10 via-background to-secondary/10',
          'border border-primary/20 shadow-lg',
          'hover:shadow-xl hover:shadow-primary/20',
        ],
        outline: [
          'border-2 border-border bg-transparent',
          'hover:bg-accent/5 hover:border-accent',
        ],
        elevated: [
          'bg-card border-0 shadow-md',
          'hover:shadow-lg hover:translate-y-[-2px]',
        ],
        interactive: [
          'border bg-card shadow-sm cursor-pointer',
          'hover:shadow-lg hover:border-primary/50 hover:translate-y-[-2px]',
          'active:translate-y-0 active:shadow-md',
        ],
        neon: [
          'bg-background/90 backdrop-blur-sm border-2 border-accent-cyan/40',
          'shadow-lg shadow-accent-cyan/20',
          'hover:border-accent-cyan/60 hover:shadow-xl hover:shadow-accent-cyan/30',
        ],
      },
      size: {
        sm: 'p-4',
        default: 'p-6',
        lg: 'p-8',
      },
      hover: {
        none: '',
        lift: 'hover:translate-y-[-4px]',
        glow: 'hover:shadow-xl',
        scale: 'hover:scale-[1.02]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      hover: 'none',
    },
  }
);

// ===== CARD COMPONENT =====
export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /** Whether to use motion animation */
  animated?: boolean;
  /** Whether card is clickable */
  clickable?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, hover, animated = false, clickable = false, ...props }, ref) => {
    const Comp = animated ? motion.div : 'div';

    return (
      <Comp
        ref={ref}
        className={cn(
          cardVariants({ variant, size, hover }),
          clickable && 'cursor-pointer',
          className
        )}
        {...(animated && {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.3 },
          whileHover: hover === 'scale' ? { scale: 1.02 } : undefined,
          whileTap: clickable ? { scale: 0.98 } : undefined,
        })}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

// ===== CARD HEADER =====
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

// ===== CARD TITLE =====
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

// ===== CARD DESCRIPTION =====
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

// ===== CARD CONTENT =====
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

// ===== CARD FOOTER =====
const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

// ===== CARD IMAGE =====
export interface CardImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  aspectRatio?: '16/9' | '4/3' | '1/1' | 'auto';
}

const CardImage = React.forwardRef<HTMLImageElement, CardImageProps>(
  ({ className, aspectRatio = 'auto', ...props }, ref) => {
    const aspectClasses = {
      '16/9': 'aspect-video',
      '4/3': 'aspect-[4/3]',
      '1/1': 'aspect-square',
      'auto': '',
    };

    return (
      <img
        ref={ref}
        className={cn(
          'w-full object-cover',
          aspectClasses[aspectRatio],
          className
        )}
        {...props}
      />
    );
  }
);
CardImage.displayName = 'CardImage';

// ===== EXPORTS =====
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  CardImage,
  cardVariants,
};

export type { CardProps, CardImageProps };