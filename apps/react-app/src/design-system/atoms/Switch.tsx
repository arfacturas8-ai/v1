import React from 'react';
import { colors, radii, spacing, typography, animation } from '../tokens';

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  labelPosition?: 'left' | 'right';
}

export const Switch: React.FC<SwitchProps> = ({
  label,
  labelPosition = 'right',
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
    flexDirection: labelPosition === 'left' ? 'row-reverse' : 'row',
    ...style,
  };

  const switchWrapperStyle: React.CSSProperties = {
    position: 'relative',
    width: '44px',
    height: '24px',
  };

  const inputStyle: React.CSSProperties = {
    position: 'absolute',
    width: '44px',
    height: '24px',
    margin: 0,
    opacity: 0,
    cursor: disabled ? 'not-allowed' : 'pointer',
  };

  const trackStyle: React.CSSProperties = {
    width: '44px',
    height: '24px',
    borderRadius: radii.full,
    backgroundColor: checked ? colors['brand-primary'] : colors['bg-elevated'],
    border: `2px solid ${isFocused ? colors['border-focus'] : 'transparent'}`,
    transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
    pointerEvents: 'none',
  };

  const thumbStyle: React.CSSProperties = {
    position: 'absolute',
    top: '2px',
    left: checked ? '22px' : '2px',
    width: '20px',
    height: '20px',
    borderRadius: radii.full,
    backgroundColor: colors['text-primary'],
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
    transition: `left ${animation.duration.normal} ${animation.easing.spring}`,
    pointerEvents: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.sans,
    color: colors['text-primary'],
    userSelect: 'none',
  };

  return (
    <label className={className} style={containerStyle}>
      <div style={switchWrapperStyle}>
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          style={inputStyle}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        <div style={trackStyle} />
        <div style={thumbStyle} />
      </div>

      {label && <span style={labelStyle}>{label}</span>}
    </label>
  );
};

export default Switch;
