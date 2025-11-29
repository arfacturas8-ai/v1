/**
 * CRYB Platform - OpenSea-Inspired Card Component
 * Modern card component with NFT marketplace aesthetics
 * Replaces all existing card implementations
 */

import React, { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';
/**
 * Card Variants using CVA
 * OpenSea-inspired styling with clean, modern aesthetics
 */
const cardVariants = cva(
  // Base styles
  [
    'relative rounded-base overflow-hidden',
    'transition-all duration-200',
    'border border-border',
  ],
  {
    variants: {
      // Variant styles
      variant: {
        default: [
          'bg-bg-secondary',
          'hover:border-border-hover',
        ],
        elevated: [
          'bg-bg-secondary shadow-md',
          'hover:shadow-lg hover:border-border-hover',
        ],
        interactive: [
          'bg-bg-secondary',
          'hover:bg-bg-tertiary hover:border-border-hover',
          'hover:shadow-md hover:-translate-y-1',
          'active:translate-y-0 active:shadow',
          'cursor-pointer',
        ],
        glass: [
          'glass',
          'hover:backdrop-blur-xl',
        ],
        outline: [
          'bg-transparent border-2',
          'hover:bg-bg-secondary/50 hover:border-border-hover',
        ],
        flat: [
          'bg-bg-tertiary border-none',
          'hover:bg-bg-hover',
        ],
      },
      // Padding variants
      padding: {
        none: 'p-0',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
        xl: 'p-8',
      },
      // Hover effect strength
      hoverEffect: {
        none: '',
        subtle: 'hover:shadow-sm',
        medium: 'hover:shadow-md',
        strong: 'hover:shadow-lg hover:-translate-y-1',
        glow: 'hover:shadow-glow-primary',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      hoverEffect: 'none',
    },
  }
);

/**
 * Card Component
 * Main card container with OpenSea-inspired design
 */
export const Card = forwardRef(
  (
    {
      className,
      variant = 'default',
      padding = 'md',
      hoverEffect = 'none',
      as: Component = 'div',
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    // Auto-apply interactive variant if onClick is provided
    const effectiveVariant = onClick && variant === 'default' ? 'interactive' : variant;

    return (
      <Component
        ref={ref}
        className={cn(
          cardVariants({ variant: effectiveVariant, padding, hoverEffect }),
          className
        )}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick(e);
                }
              }
            : undefined
        }
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';

/**
 * CardHeader Component
 * Top section of card, typically for titles and actions
 */
export const CardHeader = forwardRef(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col space-y-1.5', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

/**
 * CardTitle Component
 * Main heading for the card
 */
export const CardTitle = forwardRef(
  ({ className, as: Component = 'h3', children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(
          'text-xl font-semibold text-text-primary leading-tight',
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

CardTitle.displayName = 'CardTitle';

/**
 * CardDescription Component
 * Subtitle or description text
 */
export const CardDescription = forwardRef(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn('text-sm text-text-secondary', className)}
        {...props}
      >
        {children}
      </p>
    );
  }
);

CardDescription.displayName = 'CardDescription';

/**
 * CardContent Component
 * Main content area of the card
 */
export const CardContent = forwardRef(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('pt-0', className)} {...props}>
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';

/**
 * CardFooter Component
 * Bottom section, typically for actions or metadata
 */
export const CardFooter = forwardRef(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center gap-2 pt-4', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';

/**
 * CardImage Component
 * Image section for cards (common in NFT marketplaces)
 */
export const CardImage = forwardRef(
  (
    {
      className,
      src,
      alt,
      aspectRatio = '1/1',
      objectFit = 'cover',
      fallback,
      loading = 'lazy',
      ...props
    },
    ref
  ) => {
    const [error, setError] = React.useState(false);

    return (
      <div
        className={cn(
          'relative overflow-hidden bg-bg-tertiary',
          className
        )}
        style={{ aspectRatio }}
      >
        {!error && src ? (
          <img
            ref={ref}
            src={src}
            alt={alt}
            loading={loading}
            className={cn(
              'h-full w-full transition-transform duration-300',
              objectFit === 'cover' ? 'object-cover' : 'object-contain',
              'group-hover:scale-105'
            )}
            onError={() => setError(true)}
            {...props}
          />
        ) : fallback ? (
          <div style={{
  display: 'flex',
  height: '100%',
  width: '100%',
  alignItems: 'center',
  justifyContent: 'center'
}}>
            {fallback}
          </div>
        ) : (
          <div style={{
  display: 'flex',
  height: '100%',
  width: '100%',
  alignItems: 'center',
  justifyContent: 'center'
}}>
            <svg
              style={{
  height: '48px',
  width: '48px'
}}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>
    );
  }
);

CardImage.displayName = 'CardImage';

/**
 * CardBadge Component
 * Small badge/label for cards (e.g., "Featured", "New")
 */
export const CardBadge = forwardRef(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const badgeVariants = {
      default: 'bg-bg-tertiary text-text-primary',
      primary: 'bg-primary text-white',
      success: 'bg-success text-white',
      warning: 'bg-warning text-white',
      error: 'bg-error text-white',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'absolute top-2 right-2 z-10',
          'inline-flex items-center px-2 py-1',
          'text-xs font-medium rounded-md',
          badgeVariants[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

CardBadge.displayName = 'CardBadge';

/**
 * CardSkeleton Component
 * Loading skeleton for cards
 */
export const CardSkeleton = ({ aspectRatio = '1/1', className }) => {
  return (
    <Card className={cn('group', className)} padding="none">
      <div
        style={{
  height: '100%',
  width: '100%',
  aspectRatio
}}
      />
      <div style={{
  padding: '16px'
}}>
        <div style={{
  height: '20px',
  borderRadius: '4px'
}} />
        <div style={{
  height: '16px',
  width: '100%',
  borderRadius: '4px'
}} />
        <div style={{
  height: '16px',
  borderRadius: '4px'
}} />
      </div>
    </Card>
  );
};

CardSkeleton.displayName = 'CardSkeleton';

/**
 * NFTCard Component
 * Specialized card for NFT display (OpenSea-style)
 */
export const NFTCard = forwardRef(
  (
    {
      className,
      image,
      title,
      description,
      price,
      badge,
      onClick,
      ...props
    },
    ref
  ) => {
    return (
      <Card
        ref={ref}
        className={cn('group overflow-hidden', className)}
        variant="interactive"
        padding="none"
        onClick={onClick}
        {...props}
      >
        {badge && <CardBadge>{badge}</CardBadge>}

        <CardImage src={image} alt={title} aspectRatio="1/1" />

        <div style={{
  padding: '16px'
}}>
          <CardTitle className="text-base mb-1 truncate">{title}</CardTitle>
          {description && (
            <CardDescription className="line-clamp-2 mb-3">
              {description}
            </CardDescription>
          )}
          {price && (
            <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
              <span className="text-xs text-text-secondary">Price</span>
              <span style={{
  fontWeight: '600'
}}>
                {price}
              </span>
            </div>
          )}
        </div>
      </Card>
    );
  }
);

NFTCard.displayName = 'NFTCard';

/**
 * Usage Examples:
 *
 * // Basic card
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Card Title</CardTitle>
 *     <CardDescription>Card description</CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     <p>Card content goes here</p>
 *   </CardContent>
 *   <CardFooter>
 *     <Button>Action</Button>
 *   </CardFooter>
 * </Card>
 *
 * // Interactive card with hover
 * <Card variant="interactive" onClick={() => {}>
 *   <CardContent>Click me!</CardContent>
 * </Card>
 *
 * // Card with image (like NFT)
 * <Card padding="none">
 *   <CardImage src="/image.jpg" alt="NFT" aspectRatio="1/1" />
 *   <div style={{
  padding: '16px'
}}>
 *     <CardTitle>NFT Title</CardTitle>
 *     <CardDescription>0.5 ETH</CardDescription>
 *   </div>
 * </Card>
 *
 * // NFT Card (specialized)
 * <NFTCard
 *   image="/nft.jpg"
 *   title="Cool NFT #1234"
 *   description="Rare digital collectible"
 *   price="0.5 ETH"
 *   badge="Featured"
 *   onClick={() => viewNFT()}
 * />
 *
 * // Glass effect card
 * <Card variant="glass">
 *   <CardContent>Glassmorphism effect</CardContent>
 * </Card>
 *
 * // Loading skeleton
 * <CardSkeleton />
 */




export default cardVariants
