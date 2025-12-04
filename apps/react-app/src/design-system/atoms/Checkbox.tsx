import React from 'react';
import { colors, radii, spacing, typography, animation } from '../tokens';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  indeterminate?: boolean;
  error?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  indeterminate = false,
  error,
  checked = false,
  disabled = false,
  className = '',
  style,
  onChange,
  ...props
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const checkboxRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing[2],
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    ...style,
  };

  const checkboxWrapperStyle: React.CSSProperties = {
    position: 'relative',
    width: '20px',
    height: '20px',
  };

  const checkboxStyle: React.CSSProperties = {
    position: 'absolute',
    width: '20px',
    height: '20px',
    margin: 0,
    opacity: 0,
    cursor: disabled ? 'not-allowed' : 'pointer',
  };

  const customCheckboxStyle: React.CSSProperties = {
    width: '20px',
    height: '20px',
    borderRadius: radii.sm,
    border: `2px solid ${error ? colors['error'] : isFocused ? colors['border-focus'] : colors['border-default']}`,
    backgroundColor: checked || indeterminate ? colors['brand-primary'] : colors['bg-secondary'],
    transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  };

  const checkIconStyle: React.CSSProperties = {
    color: colors['text-primary'],
    fontSize: '12px',
    fontWeight: typography.fontWeight.bold,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.sans,
    color: error ? colors['error'] : colors['text-primary'],
    userSelect: 'none',
  };

  return (
    <label className={className} style={containerStyle}>
      <div style={checkboxWrapperStyle}>
        <input
          ref={checkboxRef}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          style={checkboxStyle}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        <div style={customCheckboxStyle}>
          {indeterminate ? (
            <span style={checkIconStyle}>−</span>
          ) : checked ? (
            <span style={checkIconStyle}>✓</span>
          ) : null}
        </div>
      </div>

      {label && <span style={labelStyle}>{label}</span>}
    </label>
  );
};

export default Checkbox;
