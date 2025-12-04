import React from 'react';
import { colors, spacing, typography, radii, animation } from '../../design-system/tokens';

export type SwitchSize = 'sm' | 'md' | 'lg';

interface SwitchProps {
  checked?: boolean;
  disabled?: boolean;
  size?: SwitchSize;
  label?: string;
  labelPosition?: 'left' | 'right';
  description?: string;
  error?: boolean;
  errorMessage?: string;
  onChange?: (checked: boolean) => void;
  name?: string;
  required?: boolean;
  loading?: boolean;
  className?: string;
}

const Switch: React.FC<SwitchProps> = ({
  checked = false,
  disabled = false,
  size = 'md',
  label,
  labelPosition = 'right',
  description,
  error = false,
  errorMessage,
  onChange,
  name,
  required = false,
  loading = false,
  className,
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  const getSizeStyles = () => {
    const sizes = {
      sm: {
        width: '32px',
        height: '18px',
        thumbSize: '14px',
        translate: '14px',
        fontSize: typography.fontSize.sm,
      },
      md: {
        width: '44px',
        height: '24px',
        thumbSize: '20px',
        translate: '20px',
        fontSize: typography.fontSize.base,
      },
      lg: {
        width: '56px',
        height: '30px',
        thumbSize: '26px',
        translate: '26px',
        fontSize: typography.fontSize.lg,
      },
    };
    return sizes[size];
  };

  const styles = getSizeStyles();

  const getBackgroundColor = () => {
    if (disabled) {
      return checked ? colors.bg.elevated : colors.bg.tertiary;
    }
    if (error) {
      return checked ? colors.semantic.error : colors.bg.secondary;
    }
    return checked ? colors.brand.primary : colors.bg.secondary;
  };

  const getBorderColor = () => {
    if (error) return colors.semantic.error;
    if (checked) return colors.brand.primary;
    if (isFocused) return colors.brand.primary;
    if (isHovered) return colors.border.strong;
    return colors.border.default;
  };

  const handleChange = () => {
    if (!disabled && !loading && onChange) {
      onChange(!checked);
    }
  };

  const switchElement = (
    <div
      style={{
        position: 'relative',
        flexShrink: 0,
        paddingTop: label && !description ? '2px' : '0',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled || loading}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        name={name}
        required={required}
        style={{
          position: 'absolute',
          opacity: 0,
          width: 0,
          height: 0,
        }}
      />

      <div
        onClick={handleChange}
        onMouseEnter={() => !disabled && !loading && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: styles.width,
          height: styles.height,
          borderRadius: radii.full,
          backgroundColor: getBackgroundColor(),
          border: `2px solid ${getBorderColor()}`,
          cursor: disabled || loading ? 'not-allowed' : 'pointer',
          transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
          position: 'relative',
          opacity: disabled ? 0.5 : 1,
          boxShadow: isFocused ? `0 0 0 3px ${colors.brand.primary}20` : 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: checked ? `calc(100% - ${styles.thumbSize} - 2px)` : '2px',
            transform: 'translateY(-50%)',
            width: styles.thumbSize,
            height: styles.thumbSize,
            borderRadius: radii.full,
            backgroundColor: disabled ? colors.text.tertiary : '#FFFFFF',
            transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {loading && (
            <svg
              width="60%"
              height="60%"
              viewBox="0 0 16 16"
              fill="none"
              style={{ animation: 'spin 1s linear infinite' }}
            >
              <circle
                cx="8"
                cy="8"
                r="6"
                stroke={colors.brand.primary}
                strokeWidth="2"
                opacity="0.25"
              />
              <path
                d="M8 2a6 6 0 0 1 6 6"
                stroke={colors.brand.primary}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>
      </div>
    </div>
  );

  const labelElement = (label || description) && (
    <div style={{ flex: 1, minWidth: 0 }}>
      {label && (
        <div
          style={{
            fontSize: styles.fontSize,
            fontWeight: typography.fontWeight.medium,
            color: error ? colors.semantic.error : colors.text.primary,
            fontFamily: typography.fontFamily.sans,
            lineHeight: typography.lineHeight.snug,
            cursor: disabled || loading ? 'not-allowed' : 'pointer',
          }}
          onClick={handleChange}
        >
          {label}
          {required && <span style={{ color: colors.semantic.error, marginLeft: spacing[1] }}>*</span>}
        </div>
      )}

      {description && (
        <div
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
            marginTop: spacing[1],
            lineHeight: typography.lineHeight.normal,
          }}
        >
          {description}
        </div>
      )}
    </div>
  );

  return (
    <div className={className} style={{ display: 'inline-flex', flexDirection: 'column' }}>
      <div
        style={{
          display: 'flex',
          alignItems: description ? 'flex-start' : 'center',
          gap: spacing[3],
        }}
      >
        {labelPosition === 'left' && labelElement}
        {switchElement}
        {labelPosition === 'right' && labelElement}
      </div>

      {error && errorMessage && (
        <div
          style={{
            fontSize: typography.fontSize.xs,
            color: colors.semantic.error,
            marginTop: spacing[2],
            marginLeft: labelPosition === 'left' ? `calc(${styles.width} + ${spacing[3]})` : '0',
          }}
        >
          {errorMessage}
        </div>
      )}
    </div>
  );
};

export default Switch;
