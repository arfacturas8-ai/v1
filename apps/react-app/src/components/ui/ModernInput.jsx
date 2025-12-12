import React, { useState, forwardRef } from 'react';
import { useResponsive } from '../../hooks/useResponsive';
import { getErrorMessage } from '../../utils/errorUtils'

const ModernInput = forwardRef(({
  label,
  error,
  hint,
  icon,
  rightIcon,
  variant = 'glass',
  size = 'md',
  className = '',
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const { isMobile } = useResponsive();

  const baseClasses = `
    w-full transition-all duration-300 ease-out
    focus:outline-none focus:ring-2 focus:ring-accent-primary/40 focus:ring-offset-2
    focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed
  `.trim();

  const variantClasses = {
    glass: `
      bg-bg-glass-primary backdrop-filter backdrop-blur-md
      border border-border-glass text-text-primary
      focus:bg-bg-glass-accent focus:border-border-accent
    `,
    solid: `
      bg-bg-secondary border border-border-primary text-text-primary
      focus:bg-bg-tertiary focus:border-border-accent
    `,
    gradient: `
      bg-gradient-to-r from-bg-secondary to-bg-tertiary
      border border-border-primary text-text-primary
      focus:from-bg-tertiary focus:to-bg-quaternary focus:border-border-accent
    `
  };

  const sizeClasses = {
    sm: isMobile ? 'h-10 px-3 py-2 text-sm rounded-lg' : 'px-3 py-2 text-sm rounded-lg',
    md: isMobile ? 'h-12 px-3 py-3 text-base rounded-xl' : 'px-4 py-3 text-base rounded-xl',
    lg: isMobile ? 'h-14 px-4 py-4 text-lg rounded-xl' : 'px-5 py-4 text-lg rounded-xl'
  };

  const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div style={{
  position: 'relative'
}}>
      {label && (
        <label
          htmlFor={inputId}
          className={isMobile ? 'text-sm mb-2' : 'text-sm md:text-base mb-2'}
          style={{
  display: 'block',
  fontWeight: '500'
}}
        >
          {label}
        </label>
      )}

      <div style={{
  position: 'relative'
}}>
        {icon && (
          <div style={{
  position: 'absolute'
}}>
            <div style={{
  width: '20px',
  height: '20px'
}}>{icon}</div>
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={`
            ${baseClasses}
            ${variantClasses[variant]}
            ${sizeClasses[size]}
            ${icon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${error ? 'border-error focus:border-error focus:ring-error/40' : ''}
          `}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        
        {rightIcon && (
          <div style={{
  position: 'absolute'
}}>
            <div style={{
  width: '20px',
  height: '20px'
}}>{rightIcon}</div>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mt-2 text-sm text-error animate-fade-in">
          {typeof error === "string" ? error : getErrorMessage(error, "")}
        </div>
      )}
      
      {hint && !error && (
        <div className="mt-2 text-sm text-text-quaternary">
          {hint}
        </div>
      )}
    </div>
  );
});

ModernInput.displayName = 'ModernInput';

// Textarea variant
const ModernTextarea = forwardRef(({
  label,
  error,
  hint,
  variant = 'glass',
  className = '',
  rows = 4,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const { isMobile } = useResponsive();

  const baseClasses = `
    w-full transition-all duration-300 ease-out resize-none
    focus:outline-none focus:ring-2 focus:ring-accent-primary/40 focus:ring-offset-2
    focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed
  `.trim();

  const variantClasses = {
    glass: `
      bg-bg-glass-primary backdrop-filter backdrop-blur-md
      border border-border-glass text-text-primary
      focus:bg-bg-glass-accent focus:border-border-accent
    `,
    solid: `
      bg-bg-secondary border border-border-primary text-text-primary
      focus:bg-bg-tertiary focus:border-border-accent
    `
  };

  const inputId = props.id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div style={{
  position: 'relative'
}}>
      {label && (
        <label
          htmlFor={inputId}
          className={isMobile ? 'text-sm mb-2' : 'text-sm md:text-base mb-2'}
          style={{
  display: 'block',
  fontWeight: '500'
}}
        >
          {label}
        </label>
      )}

      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className={isMobile ? 'text-base' : 'text-sm md:text-base'}
        style={{
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '12px',
  paddingBottom: '12px',
  minHeight: isMobile ? '48px' : '40px'
}}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        {...props}
      />
      
      {error && (
        <div className="mt-2 text-sm text-error animate-fade-in">
          {typeof error === "string" ? error : getErrorMessage(error, "")}
        </div>
      )}
      
      {hint && !error && (
        <div className="mt-2 text-sm text-text-quaternary">
          {hint}
        </div>
      )}
    </div>
  );
});

ModernTextarea.displayName = 'ModernTextarea';

export { ModernTextarea };



export default ModernInput
