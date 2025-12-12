import React from 'react';
import { colors, radii, spacing, typography, animation } from '../tokens';
import { getErrorMessage } from '../../utils/errorUtils';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'search' | 'url' | 'tel';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  helperText?: string;
  error?: string;
  maxLength?: number;
  showCharCount?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClear?: () => void;
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
  type = 'text',
  label,
  helperText,
  error,
  maxLength,
  showCharCount = false,
  leftIcon,
  rightIcon,
  onClear,
  fullWidth = false,
  disabled = false,
  value = '',
  className = '',
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const inputType = type === 'password' && showPassword ? 'text' : type;
  const charCount = typeof value === 'string' ? value.length : 0;

  const containerStyle: React.CSSProperties = {
    width: fullWidth ? '100%' : 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[1],
    ...style,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: error ? colors['error'] : colors['text-secondary'],
    fontFamily: typography.fontFamily.sans,
  };

  const inputWrapperStyle: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '40px',
    padding: leftIcon
      ? `${spacing[2]} ${spacing[3]} ${spacing[2]} 40px`
      : `${spacing[2]} ${spacing[3]}`,
    paddingRight: (rightIcon || onClear || type === 'password') ? '40px' : spacing[3],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.sans,
    color: colors['text-primary'],
    backgroundColor: colors['bg-secondary'],
    border: `1px solid ${error ? colors['error'] : isFocused ? colors['border-focus'] : colors['border-default']}`,
    borderRadius: radii.md,
    outline: 'none',
    transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
    cursor: disabled ? 'not-allowed' : 'text',
    opacity: disabled ? 0.6 : 1,
  };

  const iconStyle: React.CSSProperties = {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors['text-secondary'],
    fontSize: '18px',
    pointerEvents: 'none',
  };

  const leftIconStyle: React.CSSProperties = {
    ...iconStyle,
    left: spacing[3],
  };

  const rightIconStyle: React.CSSProperties = {
    ...iconStyle,
    right: spacing[3],
    pointerEvents: 'auto',
    cursor: 'pointer',
  };

  const helperTextStyle: React.CSSProperties = {
    fontSize: typography.fontSize.xs,
    color: error ? colors['error'] : colors['text-muted'],
    fontFamily: typography.fontFamily.sans,
    display: 'flex',
    justifyContent: 'space-between',
  };

  return (
    <div className={className} style={containerStyle}>
      {label && <label style={labelStyle}>{label}</label>}

      <div style={inputWrapperStyle}>
        {leftIcon && <span style={leftIconStyle}>{leftIcon}</span>}

        <input
          type={inputType}
          value={value}
          disabled={disabled}
          maxLength={maxLength}
          style={inputStyle}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />

        {type === 'password' && (
          <button
            type="button"
            style={rightIconStyle}
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        )}

        {onClear && value && type !== 'password' && (
          <button
            type="button"
            style={rightIconStyle}
            onClick={onClear}
            tabIndex={-1}
          >
            ✕
          </button>
        )}

        {rightIcon && type !== 'password' && !onClear && (
          <span style={rightIconStyle}>{rightIcon}</span>
        )}
      </div>

      {(helperText || error || showCharCount) && (
        <div style={helperTextStyle}>
          <span>{typeof error === 'string' ? error : (error ? getErrorMessage(error, '') : (helperText || ''))}</span>
          {showCharCount && maxLength && (
            <span>{charCount}/{maxLength}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default Input;
