/**
 * CRYB Design System - Input Component
 * Production-ready input component with validation states and accessibility
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Eye, EyeOff, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useResponsive } from '../../hooks/useResponsive';

// ===== INPUT VARIANTS =====
const inputVariants = cva(
  [
    // Base styles
    'flex w-full rounded-md border bg-background px-3 py-2',
    'text-base ring-offset-background transition-colors duration-200',
    'file:border-0 file:bg-transparent file:text-sm file:font-medium',
    'placeholder:text-muted-foreground',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'read-only:bg-muted/50 read-only:cursor-default',
  ],
  {
    variants: {
      variant: {
        default: 'border-input hover:border-ring/50',
        error: 'border-destructive/50 focus-visible:ring-destructive',
        success: 'border-cryb-success/50 focus-visible:ring-cryb-success',
        warning: 'border-cryb-warning/50 focus-visible:ring-cryb-warning',
      },
      size: {
        sm: 'h-10 px-2 text-sm md:h-8',
        default: 'h-12 px-3 text-base md:h-10',
        lg: 'h-14 px-4 text-lg md:h-12',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      fullWidth: true,
    },
  }
);

// ===== INPUT COMPONENT INTERFACE =====
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  /** Left icon or element */
  leftIcon?: React.ReactNode;
  /** Right icon or element */
  rightIcon?: React.ReactNode;
  /** Error message to display */
  error?: string;
  /** Success message to display */
  success?: string;
  /** Warning message to display */
  warning?: string;
  /** Helper text to display */
  helperText?: string;
  /** Label for the input */
  label?: string;
  /** Whether label is required */
  required?: boolean;
  /** Loading state */
  loading?: boolean;
}

// ===== INPUT COMPONENT =====
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      variant,
      size,
      fullWidth,
      leftIcon,
      rightIcon,
      error,
      success,
      warning,
      helperText,
      label,
      required,
      loading,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const inputId = id || React.useId();
    const { isMobile } = useResponsive();

    // Determine variant based on validation state
    const actualVariant = error ? 'error' : success ? 'success' : warning ? 'warning' : variant;
    
    // Determine if we should show password toggle
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
    
    // Status message and icon
    const statusMessage = error || success || warning || helperText;
    const statusIcon = error ? (
      <AlertCircle style={{
  height: '16px',
  width: '16px'
}} />
    ) : success ? (
      <CheckCircle2 style={{
  height: '16px',
  width: '16px'
}} />
    ) : warning ? (
      <Info style={{
  height: '16px',
  width: '16px'
}} />
    ) : null;

    const LoadingSpinner = () => (
      <svg
        style={{
  height: '16px',
  width: '16px'
}}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );

    return (
      <div className="space-y-2">
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block mb-2',
              isMobile ? 'text-sm' : 'text-sm md:text-base'
            )}
            style={{
  fontWeight: '500'
}}
          >
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}

        {/* Input Container */}
        <div style={{
  position: 'relative'
}}>
          {/* Left Icon */}
          {leftIcon && (
            <div style={{
  position: 'absolute'
}}>
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            id={inputId}
            type={inputType}
            className={cn(
              inputVariants({ variant: actualVariant, size, fullWidth }),
              leftIcon && 'pl-10',
              (rightIcon || isPassword || loading) && 'pr-10',
              className
            )}
            ref={ref}
            disabled={disabled || loading}
            aria-invalid={!!error}
            aria-describedby={
              statusMessage ? `${inputId}-message` : undefined
            }
            {...props}
          />

          {/* Right Side Content */}
          <div style={{
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
            {/* Loading Spinner */}
            {loading && <LoadingSpinner />}
            
            {/* Password Toggle */}
            {isPassword && !loading && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={cn(
                  'text-muted-foreground hover:text-foreground transition-colors rounded',
                  isMobile ? 'p-2 min-w-12 min-h-12' : 'p-1'
                )}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff style={{
  height: '16px',
  width: '16px'
}} /> : <Eye style={{
  height: '16px',
  width: '16px'
}} />}
              </button>
            )}
            
            {/* Right Icon */}
            {rightIcon && !loading && !isPassword && (
              <div className="text-muted-foreground">{rightIcon}</div>
            )}
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            id={`${inputId}-message`}
            className={cn(
              'flex items-start gap-2 text-sm',
              error && 'text-destructive',
              success && 'text-cryb-success',
              warning && 'text-cryb-warning',
              !error && !success && !warning && 'text-muted-foreground'
            )}
          >
            {statusIcon}
            <span>{statusMessage}</span>
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// ===== TEXTAREA COMPONENT =====
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    Omit<VariantProps<typeof inputVariants>, 'size'> {
  /** Error message to display */
  error?: string;
  /** Success message to display */
  success?: string;
  /** Warning message to display */
  warning?: string;
  /** Helper text to display */
  helperText?: string;
  /** Label for the textarea */
  label?: string;
  /** Whether label is required */
  required?: boolean;
  /** Resize behavior */
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      variant,
      fullWidth,
      error,
      success,
      warning,
      helperText,
      label,
      required,
      resize = 'vertical',
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const textareaId = id || React.useId();
    const { isMobile } = useResponsive();

    // Determine variant based on validation state
    const actualVariant = error ? 'error' : success ? 'success' : warning ? 'warning' : variant;
    
    // Status message and icon
    const statusMessage = error || success || warning || helperText;
    const statusIcon = error ? (
      <AlertCircle style={{
  height: '16px',
  width: '16px'
}} />
    ) : success ? (
      <CheckCircle2 style={{
  height: '16px',
  width: '16px'
}} />
    ) : warning ? (
      <Info style={{
  height: '16px',
  width: '16px'
}} />
    ) : null;

    const resizeClasses = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    };

    return (
      <div className="space-y-2">
        {/* Label */}
        {label && (
          <label
            htmlFor={textareaId}
            className={cn(
              'block mb-2',
              isMobile ? 'text-sm' : 'text-sm md:text-base'
            )}
            style={{
  fontWeight: '500'
}}
          >
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}

        {/* Textarea */}
        <textarea
          id={textareaId}
          className={cn(
            inputVariants({ variant: actualVariant, fullWidth }),
            isMobile ? 'min-h-[96px] text-base' : 'min-h-[80px] text-sm md:text-base',
            resizeClasses[resize],
            className
          )}
          ref={ref}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={
            statusMessage ? `${textareaId}-message` : undefined
          }
          {...props}
        />

        {/* Status Message */}
        {statusMessage && (
          <div
            id={`${textareaId}-message`}
            className={cn(
              'flex items-start gap-2 text-sm',
              error && 'text-destructive',
              success && 'text-cryb-success',
              warning && 'text-cryb-warning',
              !error && !success && !warning && 'text-muted-foreground'
            )}
          >
            {statusIcon}
            <span>{statusMessage}</span>
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// ===== INPUT GROUP COMPONENT =====
export interface InputGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Label for the group */
  label?: string;
  /** Whether the group is required */
  required?: boolean;
  /** Orientation of the group */
  orientation?: 'horizontal' | 'vertical';
}

const InputGroup = React.forwardRef<HTMLDivElement, InputGroupProps>(
  (
    {
      className,
      label,
      required,
      orientation = 'vertical',
      children,
      ...props
    },
    ref
  ) => {
    const groupId = React.useId();

    return (
      <fieldset ref={ref} className={cn('space-y-4', className)} {...props}>
        {label && (
          <legend style={{
  fontWeight: '500'
}}>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </legend>
        )}
        
        <div
          className={cn(
            orientation === 'horizontal' ? 'flex gap-4' : 'space-y-4'
          )}
          role="group"
          aria-labelledby={label ? `${groupId}-legend` : undefined}
        >
          {children}
        </div>
      </fieldset>
    );
  }
);

InputGroup.displayName = 'InputGroup';

// ===== SEARCH INPUT COMPONENT =====
export interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'type'> {
  /** Callback when search is performed */
  onSearch?: (value: string) => void;
  /** Show clear button */
  clearable?: boolean;
  /** Callback when input is cleared */
  onClear?: () => void;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      onSearch,
      clearable = true,
      onClear,
      value,
      onChange,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState('');
    const isControlled = value !== undefined;
    const searchValue = isControlled ? value : internalValue;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (!isControlled) {
        setInternalValue(newValue);
      }
      onChange?.(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onSearch?.(searchValue as string);
      }
      onKeyDown?.(e);
    };

    const handleClear = () => {
      if (!isControlled) {
        setInternalValue('');
      }
      onClear?.();
    };

    return (
      <Input
        ref={ref}
        type="search"
        value={searchValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        leftIcon={
          <svg
            style={{
  height: '16px',
  width: '16px'
}}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        }
        rightIcon={
          clearable && searchValue ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <svg
                style={{
  height: '16px',
  width: '16px'
}}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          ) : undefined
        }
        {...props}
      />
    );
  }
);

SearchInput.displayName = 'SearchInput';

// ===== EXPORTS =====
export { Input, Textarea, InputGroup, SearchInput, inputVariants };
export type { InputProps, TextareaProps, InputGroupProps, SearchInputProps };