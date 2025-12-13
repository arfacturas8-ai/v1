/**
 * CRYB Platform - Input Component v.1
 * Light theme form inputs matching design spec
 * Using design system CSS variables
 */

import React from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

// ===== INPUT COMPONENT =====
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label for the input */
  label?: string;
  /** Error message */
  error?: string;
  /** Success message */
  success?: string;
  /** Helper text */
  helperText?: string;
  /** Left icon */
  leftIcon?: React.ReactNode;
  /** Right icon */
  rightIcon?: React.ReactNode;
  /** Required field */
  required?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = '',
      type = 'text',
      label,
      error,
      success,
      helperText,
      leftIcon,
      rightIcon,
      required,
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const inputId = id || React.useId();
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    const inputClass = [
      'input',
      leftIcon && 'pl-12',
      (rightIcon || isPassword) && 'pr-12',
      error && 'border-[var(--color-error)]',
      success && 'border-[var(--color-success)]',
      className
    ].filter(Boolean).join(' ');

    const statusMessage = error || success || helperText;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-medium)',
              color: 'var(--text-primary)'
            }}
          >
            {label}
            {required && <span style={{ color: 'var(--color-error)' }}>*</span>}
          </label>
        )}

        {/* Input Container */}
        <div style={{ position: 'relative' }}>
          {/* Left Icon */}
          {leftIcon && (
            <div
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)',
                pointerEvents: 'none'
              }}
            >
              {leftIcon}
            </div>
          )}

          {/* Input Field */}
          <input
            id={inputId}
            ref={ref}
            type={inputType}
            className={inputClass}
            aria-invalid={!!error}
            aria-describedby={statusMessage ? `${inputId}-message` : undefined}
            {...props}
          />

          {/* Right Side */}
          <div
            style={{
              position: 'absolute',
              right: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)'
            }}
          >
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 'var(--space-1)',
                  cursor: 'pointer',
                  color: 'var(--text-tertiary)',
                  display: 'flex',
                  alignItems: 'center'
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            )}
            {rightIcon && !isPassword && rightIcon}
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            id={`${inputId}-message`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontSize: 'var(--text-sm)',
              color: error
                ? 'var(--color-error)'
                : success
                ? 'var(--color-success)'
                : 'var(--text-secondary)'
            }}
          >
            {error && <AlertCircle size={16} />}
            {success && <CheckCircle2 size={16} />}
            <span>{statusMessage}</span>
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// ===== SEARCH INPUT COMPONENT =====
export interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'type'> {
  onSearch?: (value: string) => void;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onSearch, onKeyDown, ...props }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const target = e.target as HTMLInputElement;
        onSearch?.(target.value);
      }
      onKeyDown?.(e);
    };

    return (
      <Input
        ref={ref}
        type="search"
        className="search-input"
        onKeyDown={handleKeyDown}
        {...props}
      />
    );
  }
);

SearchInput.displayName = 'SearchInput';

// ===== TEXTAREA COMPONENT =====
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
  required?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className = '',
      label,
      error,
      success,
      helperText,
      required,
      resize = 'vertical',
      id,
      ...props
    },
    ref
  ) => {
    const textareaId = id || React.useId();

    const resizeStyles = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize'
    };

    const textareaClass = [
      'textarea',
      resizeStyles[resize],
      error && 'border-[var(--color-error)]',
      success && 'border-[var(--color-success)]',
      className
    ].filter(Boolean).join(' ');

    const statusMessage = error || success || helperText;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {/* Label */}
        {label && (
          <label
            htmlFor={textareaId}
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-medium)',
              color: 'var(--text-primary)'
            }}
          >
            {label}
            {required && <span style={{ color: 'var(--color-error)' }}>*</span>}
          </label>
        )}

        {/* Textarea */}
        <textarea
          id={textareaId}
          ref={ref}
          className={textareaClass}
          aria-invalid={!!error}
          aria-describedby={statusMessage ? `${textareaId}-message` : undefined}
          {...props}
        />

        {/* Status Message */}
        {statusMessage && (
          <div
            id={`${textareaId}-message`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontSize: 'var(--text-sm)',
              color: error
                ? 'var(--color-error)'
                : success
                ? 'var(--color-success)'
                : 'var(--text-secondary)'
            }}
          >
            {error && <AlertCircle size={16} />}
            {success && <CheckCircle2 size={16} />}
            <span>{statusMessage}</span>
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// ===== SELECT COMPONENT =====
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
  required?: boolean;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className = '',
      label,
      error,
      success,
      helperText,
      required,
      options,
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || React.useId();

    const selectClass = [
      'input',
      error && 'border-[var(--color-error)]',
      success && 'border-[var(--color-success)]',
      className
    ].filter(Boolean).join(' ');

    const statusMessage = error || success || helperText;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {/* Label */}
        {label && (
          <label
            htmlFor={selectId}
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-medium)',
              color: 'var(--text-primary)'
            }}
          >
            {label}
            {required && <span style={{ color: 'var(--color-error)' }}>*</span>}
          </label>
        )}

        {/* Select */}
        <select
          id={selectId}
          ref={ref}
          className={selectClass}
          aria-invalid={!!error}
          aria-describedby={statusMessage ? `${selectId}-message` : undefined}
          {...props}
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        {/* Status Message */}
        {statusMessage && (
          <div
            id={`${selectId}-message`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontSize: 'var(--text-sm)',
              color: error
                ? 'var(--color-error)'
                : success
                ? 'var(--color-success)'
                : 'var(--text-secondary)'
            }}
          >
            {error && <AlertCircle size={16} />}
            {success && <CheckCircle2 size={16} />}
            <span>{statusMessage}</span>
          </div>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

// ===== EXPORTS =====
export default Input;
