import React from 'react';
import { colors, spacing, typography, radii, animation } from '../../design-system/tokens';

export type CheckboxSize = 'sm' | 'md' | 'lg';

interface CheckboxProps {
  checked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  size?: CheckboxSize;
  label?: string;
  description?: string;
  error?: boolean;
  errorMessage?: string;
  onChange?: (checked: boolean) => void;
  name?: string;
  value?: string;
  required?: boolean;
  className?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
  checked = false,
  indeterminate = false,
  disabled = false,
  size = 'md',
  label,
  description,
  error = false,
  errorMessage,
  onChange,
  name,
  value,
  required = false,
  className,
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const getSizeStyles = () => {
    const sizes = {
      sm: { size: '16px', iconSize: '10px', fontSize: typography.fontSize.sm },
      md: { size: '20px', iconSize: '12px', fontSize: typography.fontSize.base },
      lg: { size: '24px', iconSize: '14px', fontSize: typography.fontSize.lg },
    };
    return sizes[size];
  };

  const styles = getSizeStyles();

  const getBorderColor = () => {
    if (error) return colors.semantic.error;
    if (checked || indeterminate) return colors.brand.primary;
    if (isFocused) return colors.brand.primary;
    if (isHovered) return colors.border.strong;
    return colors.border.default;
  };

  const getBackgroundColor = () => {
    if (disabled) return colors.bg.tertiary;
    if (checked || indeterminate) return colors.brand.primary;
    if (isHovered) return colors.bg.hover;
    return colors.bg.secondary;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled && onChange) {
      onChange(e.target.checked);
    }
  };

  return (
    <div className={className} style={{ display: 'inline-flex', flexDirection: 'column' }}>
      <label
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          cursor: disabled ? 'not-allowed' : 'pointer',
          gap: spacing[2],
          opacity: disabled ? 0.5 : 1,
        }}
        onMouseEnter={() => !disabled && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div style={{ position: 'relative', flexShrink: 0, paddingTop: '2px' }}>
          <input
            ref={inputRef}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            name={name}
            value={value}
            required={required}
            style={{
              position: 'absolute',
              opacity: 0,
              width: 0,
              height: 0,
            }}
          />

          <div
            style={{
              width: styles.size,
              height: styles.size,
              borderRadius: radii.sm,
              border: `2px solid ${getBorderColor()}`,
              backgroundColor: getBackgroundColor(),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
              boxShadow: isFocused ? `0 0 0 3px ${colors.brand.primary}20` : 'none',
            }}
          >
            {checked && !indeterminate && (
              <svg
                width={styles.iconSize}
                height={styles.iconSize}
                viewBox="0 0 12 12"
                fill="none"
                style={{
                  animation: `checkboxCheck ${animation.duration.normal} ${animation.easing.easeOut}`,
                }}
              >
                <path
                  d="M2 6l3 3 5-6"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}

            {indeterminate && (
              <svg
                width={styles.iconSize}
                height={styles.iconSize}
                viewBox="0 0 12 12"
                fill="none"
              >
                <path
                  d="M2 6h8"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </div>
        </div>

        {(label || description) && (
          <div style={{ flex: 1, minWidth: 0 }}>
            {label && (
              <div
                style={{
                  fontSize: styles.fontSize,
                  fontWeight: typography.fontWeight.medium,
                  color: error ? colors.semantic.error : colors.text.primary,
                  fontFamily: typography.fontFamily.sans,
                  lineHeight: typography.lineHeight.snug,
                }}
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
        )}
      </label>

      {error && errorMessage && (
        <div
          style={{
            fontSize: typography.fontSize.xs,
            color: colors.semantic.error,
            marginTop: spacing[1],
            marginLeft: `calc(${styles.size} + ${spacing[2]})`,
          }}
        >
          {errorMessage}
        </div>
      )}

      <style>
        {`
          @keyframes checkboxCheck {
            0% {
              opacity: 0;
              transform: scale(0.5);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}
      </style>
    </div>
  );
};

export default Checkbox;
