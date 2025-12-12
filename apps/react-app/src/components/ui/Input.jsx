import React, { forwardRef, useState, useCallback } from 'react'
import { Eye, EyeOff, AlertCircle, CheckCircle, X } from 'lucide-react'
import { useResponsive } from '../../hooks/useResponsive'
import { getErrorMessage } from '../../utils/errorUtils'

const Input = forwardRef(({
  type = 'text',
  variant = 'default',
  size = 'md',
  label,
  placeholder,
  value,
  defaultValue,
  onChange,
  onFocus,
  onBlur,
  onClear,
  disabled = false,
  readonly = false,
  required = false,
  error,
  success,
  helperText,
  leftIcon,
  rightIcon,
  clearable = false,
  showPasswordToggle = false,
  className = '',
  containerClassName = '',
  id,
  name,
  autoComplete,
  autoFocus = false,
  maxLength,
  minLength,
  pattern,
  'aria-describedby': ariaDescribedBy,
  ...props
}, ref) => {
  const [focused, setFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [internalValue, setInternalValue] = useState(defaultValue || '')
  const { isMobile } = useResponsive()

  // Determine if this is a controlled or uncontrolled component
  const isControlled = value !== undefined
  const inputValue = isControlled ? value : internalValue

  // Generate unique IDs
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
  const helperTextId = helperText ? `${inputId}-helper` : undefined
  const errorId = error ? `${inputId}-error` : undefined

  // Handle input changes
  const handleChange = useCallback((e) => {
    const newValue = e.target.value
    
    if (!isControlled) {
      setInternalValue(newValue)
    }
    
    onChange?.(e)
  }, [onChange, isControlled])

  // Handle focus events
  const handleFocus = useCallback((e) => {
    setFocused(true)
    onFocus?.(e)
  }, [onFocus])

  const handleBlur = useCallback((e) => {
    setFocused(false)
    onBlur?.(e)
  }, [onBlur])

  // Handle clear functionality
  const handleClear = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isControlled) {
      setInternalValue('')
    }
    
    // Create a synthetic event for clearing
    const syntheticEvent = {
      target: { value: '', name, id: inputId },
      currentTarget: { value: '', name, id: inputId }
    }
    
    onClear?.(syntheticEvent)
    onChange?.(syntheticEvent)
    
    // Focus the input after clearing
    if (ref?.current) {
      ref.current.focus()
    }
  }, [isControlled, onClear, onChange, name, inputId, ref])

  // Toggle password visibility
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev)
  }, [])

  // Determine the actual input type
  const inputType = type === 'password' && showPassword ? 'text' : type

  // Use the existing input class from CSS
  const baseInputClass = 'input'
  
  // Size variants for inputs - mobile responsive
  const sizeClasses = {
    sm: isMobile ? 'h-10 text-sm' : 'input-sm',
    md: isMobile ? 'h-12 text-base' : '', // Default size, h-12 on mobile prevents iOS zoom
    lg: isMobile ? 'h-14 text-lg' : 'input-lg'
  }

  // Enhanced state-specific styles
  const getStateClasses = () => {
    if (error) {
      return 'border-error'
    }
    if (success) {
      return 'border-success'
    }
    return ''
  }

  // Calculate padding based on icons
  const getInputPadding = () => {
    let leftPadding = ''
    let rightPadding = ''

    if (leftIcon) {
      leftPadding = size === 'sm' ? 'pl-8' : size === 'lg' ? 'pl-12' : 'pl-10'
    }

    const hasRightContent = rightIcon || clearable || (type === 'password' && showPasswordToggle) || error || success
    if (hasRightContent) {
      rightPadding = size === 'sm' ? 'pr-8' : size === 'lg' ? 'pr-12' : 'pr-10'
    }

    return `${leftPadding} ${rightPadding}`
  }

  const inputClasses = [
    baseInputClass,
    sizeClasses[size],
    getStateClasses(),
    getInputPadding(),
    className
  ].filter(Boolean).join(' ')

  const iconSize = {
    sm: 14,
    md: 16,
    lg: 18
  }

  const iconPositionClasses = {
    sm: 'top-2 w-4 h-4',
    md: 'top-3 w-4 h-4', 
    lg: 'top-4 w-5 h-5'
  }

  const shouldShowClear = clearable && inputValue && !disabled && !readonly
  const shouldShowPasswordToggle = type === 'password' && showPasswordToggle && !disabled

  return (
    <div style={{
  width: '100%'
}}>
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className={isMobile ? 'text-sm mb-2' : 'text-sm md:text-base mb-2'}
          style={{
  display: 'block',
  fontWeight: '500',
  color: 'var(--text-secondary)'
}}
        >
          {label}
        </label>
      )}

      {/* Input Container */}
      <div style={{
  position: 'relative'
}}>
        {/* Left Icon */}
        {leftIcon && (
          <div style={{
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  color: 'var(--text-muted)'
}}>
            {React.cloneElement(leftIcon, { 
              size: iconSize[size],
              'aria-hidden': 'true'
            })}
          </div>
        )}

        {/* Input */}
        <input
          ref={ref}
          id={inputId}
          name={name}
          type={inputType}
          value={inputValue}
          placeholder={placeholder}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          readOnly={readonly}
          required={required}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          maxLength={maxLength}
          minLength={minLength}
          pattern={pattern}
          className={inputClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={[helperTextId, errorId, ariaDescribedBy].filter(Boolean).join(' ') || undefined}
          {...props}
        />

        {/* Right Icons Container */}
        <div style={{
  position: 'absolute',
  display: 'flex',
  alignItems: 'center'
}}>
          {/* Success Icon */}
          {success && !error && (
            <CheckCircle 
              size={iconSize[size]} 
              className="text-success" 
              aria-hidden="true"
            />
          )}

          {/* Error Icon */}
          {error && (
            <AlertCircle 
              size={iconSize[size]} 
              className="text-error" 
              aria-hidden="true"
            />
          )}

          {/* Clear Button */}
          {shouldShowClear && (
            <button
              type="button"
              onClick={handleClear}
              className={`text-muted hover:text-primary transition-colors rounded-sm hover:bg-hover-bg ${isMobile ? 'p-2 min-w-12 min-h-12' : 'p-0.5'}`}
              aria-label="Clear input"
              tabIndex={-1}
            >
              <X size={iconSize[size]} />
            </button>
          )}

          {/* Password Toggle */}
          {shouldShowPasswordToggle && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className={`text-muted hover:text-primary transition-colors rounded-sm hover:bg-hover-bg ${isMobile ? 'p-2 min-w-12 min-h-12' : 'p-0.5'}`}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff size={iconSize[size]} />
              ) : (
                <Eye size={iconSize[size]} />
              )}
            </button>
          )}

          {/* Custom Right Icon */}
          {rightIcon && !error && !success && (
            <div className="text-muted">
              {React.cloneElement(rightIcon, { 
                size: iconSize[size],
                'aria-hidden': 'true'
              })}
            </div>
          )}
        </div>
      </div>

      {/* Helper Text */}
      {helperText && !error && (
        <p 
          id={helperTextId}
          className="mt-1 text-xs leading-tight"
          style={{ color: 'var(--text-muted)' }}
        >
          {helperText}
        </p>
      )}

      {/* Error Message */}
      {error && (
        <p
          id={errorId}
          style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  color: 'var(--error)'
}}
          role="alert"
        >
          <AlertCircle size={12} aria-hidden="true" />
          {typeof error === "string" ? error : getErrorMessage(error, "")}
        </p>
      )}

      {/* Success Message */}
      {success && typeof success === 'string' && (
        <p
          style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  color: 'var(--success)'
}}
        >
          <CheckCircle size={12} aria-hidden="true" />
          {success}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'




export default Input
