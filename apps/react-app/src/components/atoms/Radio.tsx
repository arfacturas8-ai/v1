import React from 'react';
import { colors, spacing, typography, radii, animation } from '../../design-system/tokens';

export type RadioSize = 'sm' | 'md' | 'lg';

interface RadioProps {
  checked?: boolean;
  disabled?: boolean;
  size?: RadioSize;
  label?: string;
  description?: string;
  error?: boolean;
  onChange?: (checked: boolean) => void;
  name?: string;
  value?: string;
  required?: boolean;
  className?: string;
}

interface RadioGroupProps {
  value?: string;
  onChange?: (value: string) => void;
  name?: string;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  children: React.ReactElement<RadioProps>[];
  direction?: 'vertical' | 'horizontal';
  className?: string;
}

const Radio: React.FC<RadioProps> = ({
  checked = false,
  disabled = false,
  size = 'md',
  label,
  description,
  error = false,
  onChange,
  name,
  value,
  required = false,
  className,
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  const getSizeStyles = () => {
    const sizes = {
      sm: { size: '16px', dotSize: '6px', fontSize: typography.fontSize.sm },
      md: { size: '20px', dotSize: '8px', fontSize: typography.fontSize.base },
      lg: { size: '24px', dotSize: '10px', fontSize: typography.fontSize.lg },
    };
    return sizes[size];
  };

  const styles = getSizeStyles();

  const getBorderColor = () => {
    if (error) return colors.semantic.error;
    if (checked) return colors.brand.primary;
    if (isFocused) return colors.brand.primary;
    if (isHovered) return colors.border.strong;
    return colors.border.default;
  };

  const getBackgroundColor = () => {
    if (disabled) return colors.bg.tertiary;
    if (isHovered && !checked) return colors.bg.hover;
    return colors.bg.secondary;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled && onChange) {
      onChange(e.target.checked);
    }
  };

  return (
    <label
      className={className}
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
          type="radio"
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
            borderRadius: radii.full,
            border: `2px solid ${getBorderColor()}`,
            backgroundColor: getBackgroundColor(),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
            boxShadow: isFocused ? `0 0 0 3px ${colors.brand.primary}20` : 'none',
          }}
        >
          {checked && (
            <div
              style={{
                width: styles.dotSize,
                height: styles.dotSize,
                borderRadius: radii.full,
                backgroundColor: disabled ? colors.text.tertiary : colors.brand.primary,
                animation: `radioDot ${animation.duration.normal} ${animation.easing.easeOut}`,
              }}
            />
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

      <style>
        {`
          @keyframes radioDot {
            0% {
              opacity: 0;
              transform: scale(0);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}
      </style>
    </label>
  );
};

export const RadioGroup: React.FC<RadioGroupProps> = ({
  value,
  onChange,
  name,
  disabled = false,
  error = false,
  errorMessage,
  children,
  direction = 'vertical',
  className,
}) => {
  return (
    <div className={className}>
      <div
        style={{
          display: 'flex',
          flexDirection: direction === 'vertical' ? 'column' : 'row',
          gap: direction === 'vertical' ? spacing[3] : spacing[4],
          flexWrap: direction === 'horizontal' ? 'wrap' : 'nowrap',
        }}
      >
        {React.Children.map(children, (child) => {
          if (!React.isValidElement(child)) return null;

          return React.cloneElement(child, {
            checked: child.props.value === value,
            onChange: () => onChange?.(child.props.value!),
            name: name || child.props.name,
            disabled: disabled || child.props.disabled,
            error: error || child.props.error,
          });
        })}
      </div>

      {error && errorMessage && (
        <div
          style={{
            fontSize: typography.fontSize.xs,
            color: colors.semantic.error,
            marginTop: spacing[2],
          }}
        >
          {errorMessage}
        </div>
      )}
    </div>
  );
};

export default Radio;
