/**
 * CRYB Platform - FormField Component
 * Comprehensive form field with all interaction patterns
 */

import React, { useState, useRef, useEffect } from 'react';
import { Check, AlertCircle, Eye, EyeOff, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useResponsive } from '../../hooks/useResponsive';

export const FormField = ({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  disabled = false,
  error,
  success,
  helpText,
  maxLength,
  showCharCount = false,
  pattern,
  validation,
  validateOnChange = true,
  validateOnBlur = true,
  className,
  inputClassName,
  leftIcon,
  rightIcon,
  autoComplete,
  autoFocus = false,
  rows = 3,
  options = [], // for select
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [validationSuccess, setValidationSuccess] = useState(false);
  const inputRef = useRef(null);
  const { isMobile } = useResponsive();

  const charCount = value?.length || 0;
  const charCountColor = maxLength
    ? charCount > maxLength * 0.9
      ? 'text-error'
      : charCount > maxLength * 0.7
      ? 'text-warning'
      : 'text-text-tertiary'
    : 'text-text-tertiary';

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Validate on change
  const handleChange = (e) => {
    const newValue = e.target.value;
    onChange?.(e);

    if (validateOnChange && validation) {
      validateValue(newValue);
    } else if (validationError) {
      setValidationError(null);
    }
  };

  // Validate on blur
  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);

    if (validateOnBlur && validation) {
      validateValue(e.target.value);
    }
  };

  // Validation logic
  const validateValue = (val) => {
    if (typeof validation === 'function') {
      const result = validation(val);
      if (result === true) {
        setValidationError(null);
        setValidationSuccess(true);
      } else if (typeof result === 'string') {
        setValidationError(result);
        setValidationSuccess(false);
      } else {
        setValidationError(null);
        setValidationSuccess(false);
      }
    }
  };

  const displayError = error || validationError;
  const displaySuccess = success || validationSuccess;
  const hasError = !!displayError;
  const hasSuccess = !hasError && displaySuccess;

  const inputClasses = cn(
    'w-full rounded-lg border transition-all duration-200',
    'bg-bg-secondary text-text-primary placeholder:text-text-tertiary',
    'focus:outline-none focus:ring-2 focus:ring-offset-1',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-bg-tertiary',
    // Mobile-responsive heights and padding - prevent iOS zoom
    isMobile ? 'h-12 px-3 text-base' : 'h-10 px-4 py-2.5 text-sm md:text-base',
    leftIcon && (isMobile ? 'pl-10' : 'pl-11'),
    (rightIcon || type === 'password' || hasError || hasSuccess) && (isMobile ? 'pr-10' : 'pr-11'),
    hasError && 'border-error focus:ring-error/20 focus:border-error',
    hasSuccess && 'border-success focus:ring-success/20 focus:border-success',
    !hasError && !hasSuccess && 'border-border focus:ring-primary/20 focus:border-primary',
    inputClassName
  );

  const renderInput = () => {
    if (type === 'textarea') {
      return (
        <textarea
          ref={inputRef}
          id={id}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          maxLength={maxLength}
          rows={rows}
          className={cn(inputClasses, 'resize-none')}
          aria-invalid={hasError}
          aria-describedby={
            displayError ? `${id}-error` : helpText ? `${id}-help` : undefined
          }
          {...props}
        />
      );
    }

    if (type === 'select') {
      return (
        <select
          ref={inputRef}
          id={id}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={() => setIsFocused(true)}
          required={required}
          disabled={disabled}
          className={inputClasses}
          aria-invalid={hasError}
          aria-describedby={
            displayError ? `${id}-error` : helpText ? `${id}-help` : undefined
          }
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        ref={inputRef}
        id={id}
        name={name}
        type={type === 'password' && showPassword ? 'text' : type}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={() => setIsFocused(true)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        maxLength={maxLength}
        pattern={pattern}
        autoComplete={autoComplete}
        className={inputClasses}
        aria-invalid={hasError}
        aria-describedby={
          displayError ? `${id}-error` : helpText ? `${id}-help` : undefined
        }
        {...props}
      />
    );
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          className={cn(
            'block font-medium text-text-primary',
            isMobile ? 'text-sm' : 'text-sm md:text-base',
            required && "after:content-['*'] after:ml-1 after:text-error"
          )}
        >
          {label}
        </label>
      )}

      {/* Input wrapper */}
      <div style={{
  position: 'relative'
}}>
        {/* Left icon */}
        {leftIcon && (
          <div style={{
  position: 'absolute'
}}>
            {leftIcon}
          </div>
        )}

        {/* Input */}
        {renderInput()}

        {/* Right icons */}
        <div style={{
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
          {/* Password toggle */}
          {type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={cn(
                'rounded hover:bg-bg-tertiary transition-colors',
                isMobile ? 'p-2 min-w-12 min-h-12' : 'p-1'
              )}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className={isMobile ? 'w-5 h-5' : 'w-4 h-4'} />
              ) : (
                <Eye className={isMobile ? 'w-5 h-5' : 'w-4 h-4'} />
              )}
            </button>
          )}

          {/* Success icon */}
          {hasSuccess && (
            <Check style={{
  width: '20px',
  height: '20px'
}} aria-hidden="true" />
          )}

          {/* Error icon */}
          {hasError && (
            <AlertCircle style={{
  width: '20px',
  height: '20px'
}} aria-hidden="true" />
          )}

          {/* Custom right icon */}
          {!hasError && !hasSuccess && rightIcon && (
            <div className="text-text-tertiary">{rightIcon}</div>
          )}
        </div>
      </div>

      {/* Character count */}
      {showCharCount && maxLength && (
        <div className={cn('text-xs text-right', charCountColor)}>
          {charCount} / {maxLength}
        </div>
      )}

      {/* Error message */}
      {displayError && (
        <div
          id={`${id}-error`}
          style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: '8px'
}}
          role="alert"
        >
          <AlertCircle style={{
  width: '16px',
  height: '16px'
}} />
          <span>{displayError}</span>
        </div>
      )}

      {/* Success message */}
      {!displayError && displaySuccess && typeof displaySuccess === 'string' && (
        <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: '8px'
}}>
          <Check style={{
  width: '16px',
  height: '16px'
}} />
          <span>{displaySuccess}</span>
        </div>
      )}

      {/* Help text */}
      {!displayError && helpText && (
        <div
          id={`${id}-help`}
          style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: '8px'
}}
        >
          <Info style={{
  width: '16px',
  height: '16px'
}} />
          <span>{helpText}</span>
        </div>
      )}
    </div>
  );
};




export default FormField
