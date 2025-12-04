import React from 'react';
import { colors, spacing, typography, radii, animation } from '../../design-system/tokens';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'search' | 'url' | 'tel';
export type InputSize = 'sm' | 'md' | 'lg';

interface InputProps {
  type?: InputType;
  size?: InputSize;
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  label?: string;
  helperText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  clearable?: boolean;
  maxLength?: number;
  showCount?: boolean;
  loading?: boolean;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onClear?: () => void;
  fullWidth?: boolean;
  autoFocus?: boolean;
  required?: boolean;
  readOnly?: boolean;
}

const Input: React.FC<InputProps> = ({
  type = 'text',
  size = 'md',
  value = '',
  placeholder,
  disabled = false,
  error = false,
  errorMessage,
  label,
  helperText,
  icon,
  iconPosition = 'left',
  clearable = false,
  maxLength,
  showCount = false,
  loading = false,
  onChange,
  onFocus,
  onBlur,
  onClear,
  fullWidth = true,
  autoFocus = false,
  required = false,
  readOnly = false,
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  const getSizeStyles = (): React.CSSProperties => {
    const sizes = {
      sm: { padding: spacing[2], fontSize: typography.fontSize.sm, height: '36px' },
      md: { padding: spacing[3], fontSize: typography.fontSize.base, height: '44px' },
      lg: { padding: spacing[4], fontSize: typography.fontSize.lg, height: '52px' },
    };
    return sizes[size];
  };

  const getBorderColor = () => {
    if (error) return colors.semantic.error;
    if (isFocused) return colors.brand.primary;
    if (isHovered) return colors.border.strong;
    return colors.border.default;
  };

  const handleClear = () => {
    if (onChange) onChange('');
    if (onClear) onClear();
  };

  const hasRightContent = clearable && value && !disabled || loading || (icon && iconPosition === 'right');

  return (
    <div style={{ width: fullWidth ? '100%' : 'auto' }}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            color: error ? colors.semantic.error : colors.text.secondary,
            marginBottom: spacing[2],
          }}
        >
          {label}
          {required && <span style={{ color: colors.semantic.error, marginLeft: spacing[1] }}>*</span>}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        {icon && iconPosition === 'left' && (
          <div
            style={{
              position: 'absolute',
              left: spacing[3],
              top: '50%',
              transform: 'translateY(-50%)',
              color: disabled ? colors.text.tertiary : colors.text.secondary,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {icon}
          </div>
        )}

        <input
          type={type}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          maxLength={maxLength}
          autoFocus={autoFocus}
          required={required}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            onFocus?.();
          }}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            width: '100%',
            ...getSizeStyles(),
            paddingLeft: icon && iconPosition === 'left' ? `calc(${spacing[3]} + 28px)` : undefined,
            paddingRight: hasRightContent ? `calc(${spacing[3]} + 28px)` : undefined,
            backgroundColor: disabled ? colors.bg.tertiary : colors.bg.secondary,
            border: `1px solid ${getBorderColor()}`,
            borderRadius: radii.md,
            color: disabled ? colors.text.tertiary : colors.text.primary,
            fontFamily: typography.fontFamily.sans,
            fontSize: getSizeStyles().fontSize,
            outline: 'none',
            transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
            cursor: disabled ? 'not-allowed' : readOnly ? 'default' : 'text',
            boxSizing: 'border-box',
          }}
        />

        {loading && (
          <div
            style={{
              position: 'absolute',
              right: spacing[3],
              top: '50%',
              transform: 'translateY(-50%)',
              color: colors.text.tertiary,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              style={{ animation: 'spin 1s linear infinite' }}
            >
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" opacity="0.25" />
              <path
                d="M8 2a6 6 0 0 1 6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}

        {!loading && clearable && value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: spacing[3],
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: colors.text.tertiary,
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radii.sm,
              transition: `color ${animation.duration.fast} ${animation.easing.easeOut}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = colors.text.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = colors.text.tertiary;
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M12 4L4 12M4 4l8 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}

        {!loading && icon && iconPosition === 'right' && !(clearable && value && !disabled) && (
          <div
            style={{
              position: 'absolute',
              right: spacing[3],
              top: '50%',
              transform: 'translateY(-50%)',
              color: disabled ? colors.text.tertiary : colors.text.secondary,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {icon}
          </div>
        )}
      </div>

      {(helperText || errorMessage || showCount) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: spacing[2],
          }}
        >
          <span
            style={{
              fontSize: typography.fontSize.xs,
              color: error ? colors.semantic.error : colors.text.tertiary,
              flex: 1,
            }}
          >
            {error ? errorMessage : helperText}
          </span>
          {showCount && maxLength && (
            <span
              style={{
                fontSize: typography.fontSize.xs,
                color: value.length >= maxLength ? colors.semantic.warning : colors.text.tertiary,
                marginLeft: spacing[2],
              }}
            >
              {value.length}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Input;
