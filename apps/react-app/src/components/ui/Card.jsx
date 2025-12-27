/**
 * CRYB Platform - Card Component v.1
 * Light theme cards matching design spec
 * White backgrounds, 16px rounded corners, subtle shadows
 */

import React, { forwardRef, useState } from 'react';

/**
 * Card Component
 * Base card container with v.1 design
 */
export const Card = forwardRef(
  (
    {
      className = '',
      variant = 'default',
      padding = 'default',
      interactive = false,
      as: Component = 'div',
      children,
      onClick,
      style,
      ...props
    },
    ref
  ) => {
    const [isHovered, setIsHovered] = useState(false);

    // Padding variants
    const paddingMap = {
      compact: '12px',
      default: '20px',
      spacious: '24px'
    };

    // Base card styles
    const baseStyle = {
      background: '#FFFFFF',
      border: '1px solid #E8EAED',
      borderRadius: '16px',
      padding: paddingMap[padding] || paddingMap.default,
      boxShadow: variant === 'elevated' ? '0 2px 8px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
      transition: 'all 0.2s',
      cursor: (interactive || onClick) ? 'pointer' : 'default',
      ...style
    };

    // Interactive hover styles
    const hoverStyle = (interactive || onClick) && isHovered ? {
      transform: 'translateY(-2px)',
      boxShadow: variant === 'elevated' ? '0 4px 16px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.08)',
      borderColor: '#CCCCCC'
    } : {};

    return (
      <Component
        ref={ref}
        className={className}
        style={{ ...baseStyle, ...hoverStyle }}
        onClick={onClick}
        onMouseEnter={() => (interactive || onClick) && setIsHovered(true)}
        onMouseLeave={() => (interactive || onClick) && setIsHovered(false)}
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
 */
export const CardHeader = forwardRef(
  ({ className = '', style, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={className}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          ...style
        }}
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
 */
export const CardTitle = forwardRef(
  ({ className = '', as: Component = 'h3', style, children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={className}
        style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#1A1A1A',
          lineHeight: '1.3',
          margin: 0,
          ...style
        }}
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
 */
export const CardDescription = forwardRef(
  ({ className = '', style, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={className}
        style={{
          fontSize: '14px',
          color: '#666666',
          lineHeight: '1.5',
          margin: 0,
          ...style
        }}
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
 */
export const CardContent = forwardRef(
  ({ className = '', style, children, ...props }, ref) => {
    return (
      <div ref={ref} className={className} style={style} {...props}>
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';

/**
 * CardFooter Component
 */
export const CardFooter = forwardRef(
  ({ className = '', style, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '16px',
          ...style
        }}
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
 */
export const CardImage = forwardRef(
  (
    {
      className = '',
      style,
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
        className={className}
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: '#F0F2F5',
          aspectRatio,
          ...style
        }}
      >
        {!error && src ? (
          <img
            ref={ref}
            src={src}
            alt={alt}
            loading={loading}
            style={{
              height: '100%',
              width: '100%',
              objectFit: objectFit === 'cover' ? 'cover' : 'contain',
              transition: 'transform 0.3s'
            }}
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
            justifyContent: 'center',
            color: '#999999'
          }}>
            <svg
              style={{ width: "64px", height: "64px", flexShrink: 0 }}
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
 */
export const CardBadge = forwardRef(
  ({ className = '', variant = 'default', style, children, ...props }, ref) => {
    // Badge variant styles
    const variantStyles = {
      default: {
        background: '#58a6ff',
        color: '#FFFFFF'
      },
      success: {
        background: '#10B981',
        color: '#FFFFFF'
      },
      warning: {
        background: '#F59E0B',
        color: '#FFFFFF'
      },
      danger: {
        background: '#EF4444',
        color: '#FFFFFF'
      },
      secondary: {
        background: '#F0F2F5',
        color: '#1A1A1A'
      }
    };

    return (
      <span
        ref={ref}
        className={className}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          zIndex: 10,
          padding: '4px 12px',
          borderRadius: '9999px',
          fontSize: '12px',
          fontWeight: '600',
          ...variantStyles[variant] || variantStyles.default,
          ...style
        }}
        {...props}
      >
        {children}
      </span>
    );
  }
);

CardBadge.displayName = 'CardBadge';

export default Card;
