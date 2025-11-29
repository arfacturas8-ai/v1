import React, { forwardRef, useState, useCallback, useEffect, useRef } from 'react'
import { AlertCircle, CheckCircle } from 'lucide-react'

const Textarea = forwardRef(({
  variant = 'default',
  size = 'md',
  label,
  placeholder,
  value,
  defaultValue,
  onChange,
  onFocus,
  onBlur,
  disabled = false,
  readonly = false,
  required = false,
  error,
  success,
  helperText,
  rows = 4,
  minRows = 2,
  maxRows = 10,
  autoResize = false,
  resize = 'vertical',
  className = '',
  containerClassName = '',
  id,
  name,
  autoComplete,
  autoFocus = false,
  maxLength,
  minLength,
  showCharCount = false,
  'aria-describedby': ariaDescribedBy,
  ...props
}, ref) => {
  const [focused, setFocused] = useState(false)
  const [internalValue, setInternalValue] = useState(defaultValue || '')
  const textareaRef = useRef(null)
  const combinedRef = ref || textareaRef

  // Determine if this is a controlled or uncontrolled component
  const isControlled = value !== undefined
  const textareaValue = isControlled ? value : internalValue

  // Generate unique IDs
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`
  const helperTextId = helperText ? `${textareaId}-helper` : undefined
  const errorId = error ? `${textareaId}-error` : undefined
  const charCountId = showCharCount ? `${textareaId}-count` : undefined

  // Auto-resize functionality
  const adjustHeight = useCallback(() => {
    const textarea = combinedRef.current
    if (!textarea || !autoResize) return

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto'
    
    // Calculate new height based on content
    const scrollHeight = textarea.scrollHeight
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight)
    const paddingTop = parseInt(getComputedStyle(textarea).paddingTop)
    const paddingBottom = parseInt(getComputedStyle(textarea).paddingBottom)
    
    const minHeight = (minRows * lineHeight) + paddingTop + paddingBottom
    const maxHeight = (maxRows * lineHeight) + paddingTop + paddingBottom
    
    const newHeight = Math.max(minHeight, Math.min(maxHeight, scrollHeight))
    
    textarea.style.height = `${newHeight}px`
  }, [autoResize, minRows, maxRows, combinedRef])

  // Adjust height when value changes
  useEffect(() => {
    if (autoResize) {
      adjustHeight()
    }
  }, [textareaValue, adjustHeight])

  // Handle textarea changes
  const handleChange = useCallback((e) => {
    const newValue = e.target.value
    
    if (!isControlled) {
      setInternalValue(newValue)
    }
    
    onChange?.(e)
    
    // Adjust height after state update
    if (autoResize) {
      requestAnimationFrame(adjustHeight)
    }
  }, [onChange, isControlled, autoResize, adjustHeight])

  // Handle focus events
  const handleFocus = useCallback((e) => {
    setFocused(true)
    onFocus?.(e)
  }, [onFocus])

  const handleBlur = useCallback((e) => {
    setFocused(false)
    onBlur?.(e)
  }, [onBlur])

  // Character count
  const charCount = textareaValue?.length || 0
  const isOverLimit = maxLength && charCount > maxLength

  // Base modern textarea classes
  const baseTextareaClasses = `
    w-full border transition-all duration-200 ease-out
    focus:outline-none
    disabled:opacity-50 disabled:cursor-not-allowed
    readonly:opacity-75 readonly:cursor-default
    placeholder:text-muted
    backdrop-blur-sm
  `

  // Modern responsive size variants
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm rounded-lg',
    md: 'px-4 py-2.5 text-sm rounded-lg',
    lg: 'px-5 py-3 text-base rounded-xl'
  }

  // Modern variant styles with glass morphism
  const variantClasses = {
    default: `
      glass text-primary
      hover:border-border-secondary hover:shadow-sm
      focus:border-glow focus:ring-4 focus:ring-accent-primary/20 focus:shadow-glow
    `,
    filled: `
      bg-bg-secondary border-transparent text-primary
      hover:bg-bg-tertiary
      focus:glass focus:border-glow focus:ring-4 focus:ring-accent-primary/20
    `,
    outline: `
      bg-transparent border-glass text-primary backdrop-blur-sm
      hover:border-border-secondary hover:glass
      focus:border-glow focus:ring-4 focus:ring-accent-primary/20 focus:glass-light
    `,
    glass: `
      glass-light text-primary shadow-sm
      hover:shadow-md hover:border-border-secondary
      focus:border-glow focus:ring-4 focus:ring-accent-primary/30 focus:shadow-glow
    `
  }

  // State-specific styles
  const getStateClasses = () => {
    if (error) {
      return 'border-error focus:border-error focus:ring-error/20'
    }
    if (success) {
      return 'border-success focus:border-success focus:ring-success/20'
    }
    return ''
  }

  // Resize classes
  const resizeClasses = {
    none: 'resize-none',
    vertical: 'resize-y',
    horizontal: 'resize-x',
    both: 'resize'
  }

  const textareaClasses = `
    ${baseTextareaClasses}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${getStateClasses()}
    ${autoResize ? 'resize-none overflow-hidden' : resizeClasses[resize]}
    ${className}
  `

  return (
    <div style={{
  width: '100%'
}}>
      {/* Label */}
      {label && (
        <label 
          htmlFor={textareaId}
          style={{
  display: 'block',
  fontWeight: '500'
}}
        >
          {label}
        </label>
      )}

      {/* Textarea Container */}
      <div style={{
  position: 'relative'
}}>
        <textarea
          ref={combinedRef}
          id={textareaId}
          name={name}
          rows={autoResize ? minRows : rows}
          value={textareaValue}
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
          className={textareaClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={[helperTextId, errorId, charCountId, ariaDescribedBy].filter(Boolean).join(' ') || undefined}
          style={{
            minHeight: autoResize ? `${minRows * 1.5}rem` : undefined,
            maxHeight: autoResize ? `${maxRows * 1.5}rem` : undefined
          }}
          {...props}
        />

        {/* State Icons */}
        {(success || error) && (
          <div style={{
  position: 'absolute'
}}>
            {success && !error && (
              <CheckCircle 
                size={16} 
                className="text-success" 
                aria-hidden="true"
              />
            )}
            {error && (
              <AlertCircle 
                size={16} 
                className="text-error" 
                aria-hidden="true"
              />
            )}
          </div>
        )}
      </div>

      {/* Bottom Row - Character Count and Messages */}
      <div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start'
}}>
        <div style={{
  flex: '1'
}}>
          {/* Helper Text */}
          {helperText && !error && (
            <p 
              id={helperTextId}
              className="text-xs text-muted leading-tight"
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
  alignItems: 'center'
}}
              role="alert"
            >
              <AlertCircle size={12} aria-hidden="true" />
              {error}
            </p>
          )}

          {/* Success Message */}
          {success && typeof success === 'string' && (
            <p style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <CheckCircle size={12} aria-hidden="true" />
              {success}
            </p>
          )}
        </div>

        {/* Character Count */}
        {showCharCount && (
          <p 
            id={charCountId}
            className={`text-xs leading-tight flex-shrink-0 ${
              isOverLimit ? 'text-error' : 'text-muted'
            }`}
            aria-live="polite"
          >
            {maxLength ? `${charCount}/${maxLength}` : charCount}
          </p>
        )}
      </div>
    </div>
  )
})

Textarea.displayName = 'Textarea'




export default Textarea
