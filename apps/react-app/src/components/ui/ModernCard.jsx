import React from 'react';

const ModernCard = ({ 
  children, 
  variant = 'glass', 
  padding = 'lg',
  className = '', 
  hover = true,
  gradient = false,
  ...props 
}) => {
  const baseClasses = `
    relative transition-all duration-300 ease-out
    will-change-transform transform-gpu
  `.trim();

  const variantClasses = {
    glass: `
      glass-card
      ${hover ? 'hover:translate-y-[-2px] hover:shadow-glow-strong' : ''}
    `,
    solid: `
      bg-bg-secondary border border-border-primary
      ${hover ? 'hover:bg-bg-tertiary hover:border-border-accent hover:translate-y-[-1px]' : ''}
    `,
    gradient: `
      gradient-border
      ${hover ? 'hover:translate-y-[-2px] hover:shadow-xl' : ''}
    `,
    elevated: `
      bg-bg-secondary border border-border-primary shadow-xl
      ${hover ? 'hover:shadow-2xl hover:translate-y-[-3px]' : ''}
    `
  };

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };

  const cardContent = (
    <div className={`
      ${baseClasses}
      ${variantClasses[variant]}
      ${paddingClasses[padding]}
      ${className}
    `} {...props}>
      {gradient && (
        <div style={{
  position: 'absolute',
  borderRadius: '12px'
}}></div>
      )}
      <div style={{
  position: 'relative'
}}>
        {children}
      </div>
    </div>
  );

  // If it's a gradient variant, wrap in gradient border
  if (variant === 'gradient') {
    return (
      <div style={{
  border: '1px solid var(--border-subtle)'
}}>
        <div className="gradient-border-content">
          {children}
        </div>
      </div>
    );
  }

  return cardContent;
};

// Subcomponents for better composition
ModernCard.Header = ({ children, className = '' }) => (
  <div className={`mb-6 ${className}`}>
    {children}
  </div>
);

ModernCard.Title = ({ children, className = '' }) => (
  <h3 style={{
  fontWeight: '600'
}}>
    {children}
  </h3>
);

ModernCard.Description = ({ children, className = '' }) => (
  <p className={`text-text-tertiary leading-relaxed ${className}`}>
    {children}
  </p>
);

ModernCard.Footer = ({ children, className = '' }) => (
  <div className={`mt-6 pt-4 border-t border-border-primary ${className}`}>
    {children}
  </div>
);




export default ModernCard
