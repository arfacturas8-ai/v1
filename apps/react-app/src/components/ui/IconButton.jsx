import React, { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

const IconButton = forwardRef(({
  icon,
  variant = 'ghost',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  'aria-label': ariaLabel,
  tooltip,
  ...props
}, ref) => {
  
  // Base classes for modern glass morphism icon buttons
  const baseClasses = `
    inline-flex items-center justify-center
    font-medium transition-all duration-200 ease-out
    disabled:cursor-not-allowed disabled:pointer-events-none
    select-none relative overflow-hidden rounded-full
    transform-gpu will-change-transform
  `

  // Size variants with perfect square dimensions
  const sizeClasses = {
    xs: 'w-6 h-6 p-1',
    sm: 'w-8 h-8 p-1.5',
    md: 'w-10 h-10 p-2',
    lg: 'w-12 h-12 p-2.5',
    xl: 'w-14 h-14 p-3'
  }

  // Modern variant styles with glass morphism for icon buttons
  const variantClasses = {
    primary: `
      bg-gradient-accent text-white shadow-glass
      hover:shadow-glow hover:scale-105 hover:-translate-y-0.5
      focus:ring-4 focus:ring-accent-primary/30 focus:outline-none
      active:scale-95 active:translate-y-0
      disabled:opacity-50 disabled:transform-none
    `,
    secondary: `
      glass text-primary shadow-sm
      hover:glass-light hover:scale-105 hover:shadow-md
      focus:ring-4 focus:ring-border-glass/50 focus:outline-none
      active:bg-bg-tertiary active:scale-95
      disabled:opacity-50 disabled:transform-none
    `,
    ghost: `
      bg-transparent text-muted
      hover:glass hover:text-primary hover:scale-105
      focus:ring-4 focus:ring-border-glass/30 focus:outline-none
      active:bg-glass active:scale-95
      disabled:opacity-50
    `,
    outline: `
      bg-transparent text-accent-primary border border-accent-primary
      hover:bg-gradient-accent hover:text-white hover:scale-105 hover:shadow-glow
      focus:ring-4 focus:ring-accent-primary/30 focus:outline-none
      active:bg-accent-secondary active:scale-95
      disabled:opacity-50
    `,
    danger: `
      bg-transparent text-error
      hover:bg-error hover:text-white hover:scale-105 hover:glow-error
      focus:ring-4 focus:ring-error/30 focus:outline-none
      active:bg-red-700 active:scale-95
      disabled:opacity-50
    `,
    success: `
      bg-transparent text-success
      hover:bg-success hover:text-white hover:scale-105 hover:glow-success
      focus:ring-4 focus:ring-success/30 focus:outline-none
      active:bg-green-700 active:scale-95
      disabled:opacity-50
    `,
    warning: `
      bg-transparent text-warning
      hover:bg-warning hover:text-text-inverse hover:scale-105 hover:brightness-110
      focus:ring-4 focus:ring-warning/30 focus:outline-none
      active:bg-yellow-500 active:scale-95
      disabled:opacity-50
    `,
    glass: `
      glass-light text-primary shadow-glass
      hover:shadow-combined hover:scale-105 hover:glow-accent
      focus:ring-4 focus:ring-accent-primary/20 focus:outline-none
      active:scale-95
      disabled:opacity-50 disabled:transform-none
    `
  }

  const isDisabled = disabled || loading

  const buttonClasses = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${className}
  `

  const iconSize = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20
  }

  const IconElement = loading ? (
    <Loader2 
      className="" 
      size={iconSize[size]} 
      aria-hidden="true"
    />
  ) : icon ? (
    React.cloneElement(icon, { 
      size: iconSize[size],
      'aria-hidden': 'true'
    })
  ) : null

  return (
    <button
      ref={ref}
      type={type}
      className={buttonClasses}
      disabled={isDisabled}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-busy={loading}
      title={tooltip || ariaLabel}
      {...props}
    >
      {IconElement}
    </button>
  )
})

IconButton.displayName = 'IconButton'




export default IconButton
