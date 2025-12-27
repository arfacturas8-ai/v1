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
      ? '#EF4444'
      : charCount > maxLength * 0.7
      ? '#F59E0B'
      : '#999999'
    : '#999999';

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

  const getInputStyle = () => {
    const baseStyle = {
      width: '100%',
      borderRadius: '12px',
      border: hasError ? '1px solid #EF4444' : hasSuccess ? '1px solid #10B981' : '1px solid #E8EAED',
      background: disabled ? '#F0F2F5' : '#FFFFFF',
      color: '#1A1A1A',
      fontSize: isMobile ? '16px' : '15px',
      height: type === 'textarea' ? 'auto' : (isMobile ? '48px' : '44px'),
      padding: type === 'textarea' ? '12px 16px' : `0 ${isMobile ? '12px' : '16px'}`,
      paddingLeft: leftIcon ? (isMobile ? '40px' : '44px') : (isMobile ? '12px' : '16px'),
      paddingRight: (rightIcon || type === 'password' || hasError || hasSuccess) ? (isMobile ? '40px' : '44px') : (isMobile ? '12px' : '16px'),
      outline: 'none',
      transition: 'all 0.2s',
      opacity: disabled ? 0.5 : 1,
      cursor: disabled ? 'not-allowed' : 'text'
    };
    return baseStyle;
  };

  const handleFocusStyle = (e) => {
    if (!disabled) {
      e.target.style.borderColor = hasError ? '#EF4444' : hasSuccess ? '#10B981' : '#58a6ff';
      e.target.style.boxShadow = hasError ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : hasSuccess ? '0 0 0 3px rgba(16, 185, 129, 0.1)' : '0 0 0 3px rgba(88, 166, 255, 0.1)';
    }
  };

  const handleBlurStyle = (e) => {
    e.target.style.borderColor = hasError ? '#EF4444' : hasSuccess ? '#10B981' : '#E8EAED';
    e.target.style.boxShadow = 'none';
  };

  const renderInput = () => {
    if (type === 'textarea') {
      return (
        <textarea
          ref={inputRef}
          id={id}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={(e) => {
            handleBlur(e);
            handleBlurStyle(e);
          }}
          onFocus={(e) => {
            setIsFocused(true);
            handleFocusStyle(e);
          }}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          maxLength={maxLength}
          rows={rows}
          style={{ ...getInputStyle(), resize: 'none', fontFamily: 'inherit' }}
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
          onBlur={(e) => {
            handleBlur(e);
            handleBlurStyle(e);
          }}
          onFocus={(e) => {
            setIsFocused(true);
            handleFocusStyle(e);
          }}
          required={required}
          disabled={disabled}
          style={getInputStyle()}
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
        onBlur={(e) => {
          handleBlur(e);
          handleBlurStyle(e);
        }}
        onFocus={(e) => {
          setIsFocused(true);
          handleFocusStyle(e);
        }}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        maxLength={maxLength}
        pattern={pattern}
        autoComplete={autoComplete}
        style={getInputStyle()}
        aria-invalid={hasError}
        aria-describedby={
          displayError ? `${id}-error` : helpText ? `${id}-help` : undefined
        }
        {...props}
      />
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} className={className}>
      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          style={{
            display: 'block',
            fontWeight: '600',
            color: '#1A1A1A',
            fontSize: isMobile ? '14px' : '15px'
          }}
        >
          {label}
          {required && <span style={{ marginLeft: '4px', color: '#EF4444' }}>*</span>}
        </label>
      )}

      {/* Input wrapper */}
      <div style={{ position: 'relative' }}>
        {/* Left icon */}
        {leftIcon && (
          <div style={{
            position: 'absolute',
            left: isMobile ? '12px' : '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#666666',
            pointerEvents: 'none'
          }}>
            {leftIcon}
          </div>
        )}

        {/* Input */}
        {renderInput()}

        {/* Right icons */}
        <div style={{
          position: 'absolute',
          right: isMobile ? '8px' : '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {/* Password toggle */}
          {type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                padding: isMobile ? '8px' : '4px',
                minWidth: isMobile ? '48px' : 'auto',
                minHeight: isMobile ? '48px' : 'auto',
                borderRadius: '8px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#666666',
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F0F2F5'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff style={{ width: isMobile ? '20px' : '16px', height: isMobile ? '20px' : '16px' }} />
              ) : (
                <Eye style={{ width: isMobile ? '20px' : '16px', height: isMobile ? '20px' : '16px' }} />
              )}
            </button>
          )}

          {/* Success icon */}
          {hasSuccess && (
            <Check style={{ width: '20px', height: '20px', color: '#10B981' }} aria-hidden="true" />
          )}

          {/* Error icon */}
          {hasError && (
            <AlertCircle style={{ width: '20px', height: '20px', color: '#EF4444' }} aria-hidden="true" />
          )}

          {/* Custom right icon */}
          {!hasError && !hasSuccess && rightIcon && (
            <div style={{ color: '#666666' }}>{rightIcon}</div>
          )}
        </div>
      </div>

      {/* Character count */}
      {showCharCount && maxLength && (
        <div style={{ fontSize: '12px', textAlign: 'right', color: charCountColor }}>
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
            gap: '8px',
            fontSize: '13px',
            color: '#EF4444'
          }}
          role="alert"
        >
          <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
          <span>{displayError}</span>
        </div>
      )}

      {/* Success message */}
      {!displayError && displaySuccess && typeof displaySuccess === 'string' && (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
          fontSize: '13px',
          color: '#10B981'
        }}>
          <Check style={{ width: '16px', height: '16px', flexShrink: 0 }} />
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
            gap: '8px',
            fontSize: '13px',
            color: '#666666'
          }}
        >
          <Info style={{ width: '16px', height: '16px', flexShrink: 0 }} />
          <span>{helpText}</span>
        </div>
      )}
    </div>
  );
};




export default FormField
