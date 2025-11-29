/**
 * CRYB Design System - Switch Component
 * Modern OpenSea-inspired toggle switches with animations
 */

import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Check, X } from 'lucide-react';

// ===== SWITCH VARIANTS =====
const switchVariants = cva(
  [
    'peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent',
    'transition-colors duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        default: [
          'data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
          'hover:data-[state=unchecked]:bg-muted',
        ],
        success: [
          'data-[state=checked]:bg-cryb-success data-[state=unchecked]:bg-input',
          'hover:data-[state=unchecked]:bg-muted',
        ],
        destructive: [
          'data-[state=checked]:bg-destructive data-[state=unchecked]:bg-input',
          'hover:data-[state=unchecked]:bg-muted',
        ],
        gradient: [
          'data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-primary data-[state=checked]:to-secondary',
          'data-[state=unchecked]:bg-input',
          'hover:data-[state=unchecked]:bg-muted',
        ],
        neon: [
          'data-[state=checked]:bg-accent-cyan data-[state=checked]:shadow-lg data-[state=checked]:shadow-accent-cyan/30',
          'data-[state=unchecked]:bg-input',
          'hover:data-[state=unchecked]:bg-muted',
        ],
        glass: [
          'data-[state=checked]:bg-background/80 data-[state=checked]:backdrop-blur-sm data-[state=checked]:border-primary',
          'data-[state=unchecked]:bg-background/50 data-[state=unchecked]:backdrop-blur-sm data-[state=unchecked]:border-border',
        ],
      },
      size: {
        sm: 'h-5 w-9',
        default: 'h-6 w-11',
        lg: 'h-7 w-14',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

// ===== SWITCH THUMB VARIANTS =====
const switchThumbVariants = cva(
  [
    'pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform duration-200',
  ],
  {
    variants: {
      size: {
        sm: 'h-4 w-4 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0',
        default: 'h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',
        lg: 'h-6 w-6 data-[state=checked]:translate-x-7 data-[state=unchecked]:translate-x-0',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

// ===== SWITCH COMPONENT =====
export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>,
    VariantProps<typeof switchVariants> {
  /** Label for the switch */
  label?: string;
  /** Description text */
  description?: string;
  /** Show icons inside switch */
  showIcons?: boolean;
  /** Custom checked icon */
  checkedIcon?: React.ReactNode;
  /** Custom unchecked icon */
  uncheckedIcon?: React.ReactNode;
  /** Loading state */
  loading?: boolean;
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(
  (
    {
      className,
      variant,
      size,
      label,
      description,
      showIcons = false,
      checkedIcon,
      uncheckedIcon,
      loading = false,
      disabled,
      checked,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const switchComponent = (
      <SwitchPrimitives.Root
        className={cn(switchVariants({ variant, size }), className)}
        disabled={isDisabled}
        checked={checked}
        ref={ref}
        {...props}
      >
        <SwitchPrimitives.Thumb className={cn(switchThumbVariants({ size }))}>
          {showIcons && !loading && (
            <span style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  width: '100%'
}}>
              {checked ? (
                checkedIcon || <Check style={{
  height: '12px',
  width: '12px'
}} />
              ) : (
                uncheckedIcon || <X style={{
  height: '12px',
  width: '12px'
}} />
              )}
            </span>
          )}
          {loading && (
            <span style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  width: '100%'
}}>
              <div
                style={{
  height: '8px',
  width: '8px',
  borderRadius: '50%'
}}
              />
            </span>
          )}
        </SwitchPrimitives.Thumb>
      </SwitchPrimitives.Root>
    );

    if (label || description) {
      return (
        <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '16px'
}}>
          <div style={{
  flex: '1'
}}>
            {label && (
              <label
                htmlFor={props.id}
                className={cn(
                  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                  isDisabled && 'cursor-not-allowed opacity-70'
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {switchComponent}
        </div>
      );
    }

    return switchComponent;
  }
);

Switch.displayName = SwitchPrimitives.Root.displayName;

// ===== SWITCH GROUP =====
export interface SwitchGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Group label */
  label?: string;
  /** Group description */
  description?: string;
  /** Orientation */
  orientation?: 'vertical' | 'horizontal';
}

const SwitchGroup = React.forwardRef<HTMLDivElement, SwitchGroupProps>(
  (
    {
      className,
      label,
      description,
      orientation = 'vertical',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div ref={ref} className={cn('space-y-4', className)} {...props}>
        {(label || description) && (
          <div className="space-y-1">
            {label && (
              <h3 style={{
  fontWeight: '500'
}}>{label}</h3>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        )}
        <div
          className={cn(
            orientation === 'vertical' ? 'space-y-3' : 'flex flex-wrap gap-4'
          )}
        >
          {children}
        </div>
      </div>
    );
  }
);

SwitchGroup.displayName = 'SwitchGroup';

// ===== SWITCH CARD (switch with card container) =====
export interface SwitchCardProps extends SwitchProps {
  /** Card title */
  title: string;
  /** Card description */
  cardDescription?: string;
  /** Card icon */
  icon?: React.ReactNode;
  /** Card variant */
  cardVariant?: 'default' | 'glass' | 'gradient';
}

const SwitchCard = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchCardProps
>(
  (
    {
      className,
      variant,
      size,
      title,
      cardDescription,
      icon,
      cardVariant = 'default',
      ...props
    },
    ref
  ) => {
    const cardClasses = {
      default: 'bg-card border border-border',
      glass: 'bg-background/80 backdrop-blur-sm border border-border/50',
      gradient: 'bg-gradient-to-br from-background via-background to-primary/5 border border-primary/20',
    };

    return (
      <div
        className={cn(
          'rounded-lg p-4 transition-colors hover:bg-accent/5',
          cardClasses[cardVariant],
          className
        )}
      >
        <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '16px'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  flex: '1'
}}>
            {icon && (
              <div className="mt-0.5 flex-shrink-0 text-muted-foreground">
                {icon}
              </div>
            )}
            <div style={{
  flex: '1'
}}>
              <h4 style={{
  fontWeight: '500'
}}>{title}</h4>
              {cardDescription && (
                <p className="text-sm text-muted-foreground">
                  {cardDescription}
                </p>
              )}
            </div>
          </div>
          <Switch ref={ref} variant={variant} size={size} {...props} />
        </div>
      </div>
    );
  }
);

SwitchCard.displayName = 'SwitchCard';

// ===== CONTROLLED SWITCH GROUP =====
export interface ControlledSwitchGroupProps {
  /** Switch options */
  options: Array<{
    id: string;
    label: string;
    description?: string;
    icon?: React.ReactNode;
  }>;
  /** Selected values */
  value: string[];
  /** Callback when value changes */
  onValueChange: (value: string[]) => void;
  /** Switch variant */
  variant?: VariantProps<typeof switchVariants>['variant'];
  /** Switch size */
  size?: VariantProps<typeof switchVariants>['size'];
  /** Layout orientation */
  orientation?: 'vertical' | 'horizontal';
  /** Custom class */
  className?: string;
}

const ControlledSwitchGroup: React.FC<ControlledSwitchGroupProps> = ({
  options,
  value,
  onValueChange,
  variant,
  size,
  orientation = 'vertical',
  className,
}) => {
  const handleToggle = (id: string) => {
    const newValue = value.includes(id)
      ? value.filter((v) => v !== id)
      : [...value, id];
    onValueChange(newValue);
  };

  return (
    <div
      className={cn(
        orientation === 'vertical' ? 'space-y-3' : 'flex flex-wrap gap-4',
        className
      )}
    >
      {options.map((option) => (
        <Switch
          key={option.id}
          id={option.id}
          checked={value.includes(option.id)}
          onCheckedChange={() => handleToggle(option.id)}
          label={option.label}
          description={option.description}
          variant={variant}
          size={size}
        />
      ))}
    </div>
  );
};

ControlledSwitchGroup.displayName = 'ControlledSwitchGroup';

// ===== EXPORTS =====
export {
  Switch,
  SwitchGroup,
  SwitchCard,
  ControlledSwitchGroup,
  switchVariants,
  switchThumbVariants,
};

export type {
  SwitchProps,
  SwitchGroupProps,
  SwitchCardProps,
  ControlledSwitchGroupProps,
};
