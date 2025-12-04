import React from 'react';
import { colors, radii, spacing, typography, animation } from '../tokens';

interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const Radio: React.FC<RadioProps> = ({
  label,
  error,
  checked = false,
  disabled = false,
  className = '',
  style,
  onChange,
  ...props
}) => {
  const [isFocused, setIsFocused] = React.useState(false);

  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing[2],
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    ...style,
  };

  const radioWrapperStyle: React.CSSProperties = {
    position: 'relative',
    width: '20px',
    height: '20px',
  };

  const radioStyle: React.CSSProperties = {
    position: 'absolute',
    width: '20px',
    height: '20px',
    margin: 0,
    opacity: 0,
    cursor: disabled ? 'not-allowed' : 'pointer',
  };

  const customRadioStyle: React.CSSProperties = {
    width: '20px',
    height: '20px',
    borderRadius: radii.full,
    border: `2px solid ${error ? colors['error'] : isFocused ? colors['border-focus'] : colors['border-default']}`,
    backgroundColor: colors['bg-secondary'],
    transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  };

  const dotStyle: React.CSSProperties = {
    width: '10px',
    height: '10px',
    borderRadius: radii.full,
    backgroundColor: colors['brand-primary'],
    transform: checked ? 'scale(1)' : 'scale(0)',
    transition: `transform ${animation.duration.fast} ${animation.easing.spring}`,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.sans,
    color: error ? colors['error'] : colors['text-primary'],
    userSelect: 'none',
  };

  return (
    <label className={className} style={containerStyle}>
      <div style={radioWrapperStyle}>
        <input
          type="radio"
          checked={checked}
          disabled={disabled}
          style={radioStyle}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        <div style={customRadioStyle}>
          <div style={dotStyle} />
        </div>
      </div>

      {label && <span style={labelStyle}>{label}</span>}
    </label>
  );
};

// RadioGroup component for managing multiple radios
interface RadioGroupProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  value,
  onChange,
  children,
  className = '',
  style,
}) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[3],
    ...style,
  };

  return (
    <div className={className} style={containerStyle} role="radiogroup">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === Radio) {
          return React.cloneElement(child as React.ReactElement<RadioProps>, {
            name,
            checked: child.props.value === value,
            onChange: () => onChange(child.props.value as string),
          });
        }
        return child;
      })}
    </div>
  );
};

export default Radio;
